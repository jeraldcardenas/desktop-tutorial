/**
 * Resolves configuration for AI-generated missions.
 *
 * SECURITY: A mobile app bundle is not a secret. The recommended production
 * setup is a small backend that proxies to Claude and holds the API key
 * server-side — set `endpoint` to that proxy. The direct-to-Anthropic `apiKey`
 * path exists only for local development/testing and must NOT ship in a real
 * release (anyone can extract a key embedded in an app).
 *
 * Values are read from Expo public env vars (inlined at build time):
 *   EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT  — your proxy URL (preferred)
 *   EXPO_PUBLIC_TALKQUEST_AI_KEY       — Anthropic API key (dev only!)
 *   EXPO_PUBLIC_TALKQUEST_AI_MODEL     — optional model override
 */

// Per Anthropic guidance, default to the most capable model. Override via env
// (e.g. a faster/cheaper model) only when you have a reason to.
export const DEFAULT_MODEL = 'claude-opus-4-8';
export const ANTHROPIC_VERSION = '2023-06-01';
export const ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com/v1/messages';

function env(name) {
  // Guarded for non-Expo/test environments where process may be undefined.
  try {
    return (typeof process !== 'undefined' && process.env && process.env[name]) || '';
  } catch (e) {
    return '';
  }
}

export function getAIConfig() {
  return {
    endpoint: env('EXPO_PUBLIC_TALKQUEST_AI_ENDPOINT'),
    apiKey: env('EXPO_PUBLIC_TALKQUEST_AI_KEY'),
    model: env('EXPO_PUBLIC_TALKQUEST_AI_MODEL') || DEFAULT_MODEL,
  };
}

/** True when either a proxy endpoint or a direct key is available. */
export function isAIConfigured(config = getAIConfig()) {
  return Boolean(config.endpoint || config.apiKey);
}
