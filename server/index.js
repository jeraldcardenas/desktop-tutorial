/**
 * Minimal zero-dependency Node server for TalkQuest AI missions.
 *
 * Run:   ANTHROPIC_API_KEY=sk-ant-... node server/index.js
 * Then point the app at it:
 *        EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT=http://localhost:8787/missions
 *
 * Requires Node 18+ (uses the built-in global `fetch`). No npm install needed.
 * This is a reference implementation — add real auth/rate-limiting before
 * exposing it publicly (see server/README.md).
 */

const http = require('http');
const { handleMissionRequest } = require('./proxy');

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MAX_BODY_BYTES = 256 * 1024; // small; mission requests are tiny

// CORS: lock to your app's origin in production via ALLOWED_ORIGIN.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function send(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, keyConfigured: Boolean(API_KEY) });
  }
  if (req.method !== 'POST' || !req.url.startsWith('/missions')) {
    return send(res, 404, { error: 'Not found' });
  }

  let input;
  try {
    input = await readJsonBody(req);
  } catch (e) {
    return send(res, 400, { error: e.message });
  }

  const { status, body } = await handleMissionRequest(input, { apiKey: API_KEY });
  return send(res, status, body);
});

// Don't start a real listener when imported (e.g. by tests).
if (require.main === module) {
  if (!API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY is not set — /missions will return 500.');
  }
  server.listen(PORT, () => {
    console.log(`TalkQuest mission proxy listening on http://localhost:${PORT}`);
    console.log(`  POST /missions   → generates missions via Claude`);
    console.log(`  GET  /health     → liveness check`);
  });
}

module.exports = { server };
