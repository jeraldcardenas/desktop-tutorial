/**
 * Core proxy handler for TalkQuest AI missions.
 *
 * The app (src/services/aiMissionProvider.js) POSTs a full Anthropic Messages
 * API body to this proxy WITHOUT any credentials. The proxy holds the API key
 * server-side, re-builds a safe request (so it can't be abused as an open relay
 * for arbitrary prompts/models), forwards it to Anthropic, and returns the
 * response verbatim so the app's `extractMissions` can read `content`.
 *
 * This module is framework-agnostic and pure-ish (network is injectable), so it
 * works behind the bundled Node server, a Vercel/Netlify function, a Cloudflare
 * Worker, etc. See server/README.md.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

// Only let the proxy talk to known models — prevents someone pointing it at an
// expensive/unexpected model, and keeps it scoped to this app's use.
const ALLOWED_MODELS = new Set([
  'claude-opus-4-8',
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
]);
const DEFAULT_MODEL = 'claude-opus-4-8';

// Mission generation is small; cap output to bound cost regardless of input.
const MAX_OUTPUT_TOKENS = 2000;

/**
 * Validate and re-build a safe Anthropic request body from untrusted input.
 * Returns { ok: true, body } or { ok: false, error }.
 */
function buildSafeBody(input) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    return { ok: false, error: 'messages[] is required' };
  }
  // Require the app's structured mission tool — this proxy only serves missions,
  // not free-form chat.
  const tools = Array.isArray(input.tools) ? input.tools : [];
  const hasMissionTool = tools.some((t) => t && t.name === 'emit_missions');
  if (!hasMissionTool) {
    return { ok: false, error: 'emit_missions tool is required' };
  }

  const model = ALLOWED_MODELS.has(input.model) ? input.model : DEFAULT_MODEL;
  const maxTokens = Math.min(
    Number.isInteger(input.max_tokens) && input.max_tokens > 0 ? input.max_tokens : MAX_OUTPUT_TOKENS,
    MAX_OUTPUT_TOKENS
  );

  return {
    ok: true,
    body: {
      model,
      max_tokens: maxTokens,
      ...(typeof input.system === 'string' ? { system: input.system } : {}),
      tools,
      tool_choice: { type: 'tool', name: 'emit_missions' },
      messages: input.messages,
    },
  };
}

/**
 * Handle one mission request.
 * @returns {Promise<{status:number, body:object}>}
 */
async function handleMissionRequest(input, { apiKey, fetchImpl } = {}) {
  if (!apiKey) {
    return { status: 500, body: { error: 'Proxy missing ANTHROPIC_API_KEY' } };
  }
  const built = buildSafeBody(input);
  if (!built.ok) {
    return { status: 400, body: { error: built.error } };
  }

  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) {
    return { status: 500, body: { error: 'No fetch available on server' } };
  }

  let res;
  try {
    res = await doFetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(built.body),
    });
  } catch (e) {
    return { status: 502, body: { error: 'Upstream request failed' } };
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    return { status: 502, body: { error: 'Invalid upstream response' } };
  }

  // Pass the Anthropic status + body straight through; the app reads `content`.
  return { status: res.status, body: json };
}

module.exports = {
  handleMissionRequest,
  buildSafeBody,
  ANTHROPIC_URL,
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  MAX_OUTPUT_TOKENS,
};
