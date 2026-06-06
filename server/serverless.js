/**
 * Serverless adapters for the TalkQuest mission proxy.
 *
 * Both wrap the same core handler from ./proxy. Pick the one matching your host
 * and set ANTHROPIC_API_KEY in the function's environment. Point the app at the
 * deployed URL via EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT.
 */

const { handleMissionRequest } = require('./proxy');

const CORS = {
  'access-control-allow-origin': process.env.ALLOWED_ORIGIN || '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

/**
 * Vercel / Next.js API route style: export default (req, res).
 * Vercel parses JSON into req.body automatically.
 *
 *   // api/missions.js
 *   module.exports = require('../server/serverless').vercelHandler;
 */
async function vercelHandler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json', ...CORS });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  const { status, body } = await handleMissionRequest(req.body, {
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  res.writeHead(status, { 'content-type': 'application/json', ...CORS });
  res.end(JSON.stringify(body));
}

/**
 * Netlify / AWS Lambda (API Gateway) style: exports.handler = (event) => result.
 *
 *   // netlify/functions/missions.js
 *   exports.handler = require('../../server/serverless').netlifyHandler;
 */
async function netlifyHandler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  let input;
  try {
    input = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  const { status, body } = await handleMissionRequest(input, {
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(body),
  };
}

module.exports = { vercelHandler, netlifyHandler };
