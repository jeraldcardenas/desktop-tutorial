/**
 * AI-generated missions via Claude (Anthropic Messages API).
 *
 * This is the "future AI missions" seam the local database was designed around.
 * It calls Claude with a single structured tool (`emit_missions`) so the model
 * returns missions that already match TalkQuest's schema, then *re-validates*
 * everything locally before any of it reaches a child's screen. Anything that
 * fails validation is dropped, and callers always fall back to the local
 * database, so a session is never empty and never shows unvetted content.
 *
 * Transport is raw `fetch` (not the Node SDK, which doesn't belong in a React
 * Native bundle). Prefer a backend proxy — see services/aiConfig.js.
 */
import { AGE_GROUPS, THEMES, CATEGORIES, GAME_MODES } from '../constants';
import {
  getAIConfig,
  isAIConfigured,
  ANTHROPIC_VERSION,
  ANTHROPIC_DIRECT_URL,
} from './aiConfig';

const VALID_AGES = AGE_GROUPS.map((a) => a.id);
const VALID_THEMES = THEMES.map((t) => t.id);
const VALID_CATEGORIES = Object.keys(CATEGORIES); // language, motor, ...
const VALID_MODES = Object.keys(GAME_MODES); // treasure, copy, ...

const MAX_PROMPT = 120;
const MAX_TIP = 160;
const MAX_CELEBRATION = 80;

// Kid-safety + product guardrails. Deliberately explicit about what NOT to do.
const SYSTEM_PROMPT = [
  'You design short, playful developmental activities ("missions") for a toddler app called TalkQuest.',
  'Each mission is completed by a child WITH a parent/caregiver in the real world — never passive screen time.',
  '',
  'Hard rules:',
  '- Content must be safe, gentle, and positive. No danger, no choking/small-object hazards, no going outside alone, no water/bath unsupervised, no food allergens as requirements.',
  '- Never reference, diagnose, screen for, or imply autism, developmental delays, disorders, or any medical condition. This is play, not assessment.',
  '- No scary, violent, sad, or anxiety-inducing themes. Keep it joyful.',
  '- Minimal text. The child does not read — prompts are spoken aloud and must be short and concrete.',
  '- A parent assists, so "ask Mommy/Daddy/grown-up" style help is welcome.',
  '',
  'Match the requested age group:',
  '- "1-2": one simple step; pointing, clapping, body parts, animal sounds, finding common objects.',
  '- "2-3": colors, counting 1-3, animal movements, naming objects, simple pretend, "show me" tasks.',
  '- "3-4": two-step instructions, counting 1-5, shapes, emotions, simple choices, short storytelling, memory.',
  '',
  'For each mission provide: category, mode, a short spoken prompt, a one-line parent tip, and a cheerful celebration line.',
  'For mode "story", also provide 3 simple one-word options the child can choose from.',
].join('\n');

/** JSON schema for the structured tool Claude must call. */
function emitMissionsTool(count) {
  return {
    name: 'emit_missions',
    description: `Return exactly ${count} toddler missions matching the schema.`,
    input_schema: {
      type: 'object',
      properties: {
        missions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: VALID_CATEGORIES },
              mode: { type: 'string', enum: VALID_MODES },
              prompt: { type: 'string', description: 'Short spoken instruction for the child.' },
              parentTip: { type: 'string', description: 'One-line tip for the grown-up helping.' },
              celebration: { type: 'string', description: 'Cheerful praise shown when done.' },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: 'Only for mode "story": 3 one-word choices.',
              },
            },
            required: ['category', 'mode', 'prompt', 'parentTip', 'celebration'],
          },
        },
      },
      required: ['missions'],
    },
  };
}

export function buildUserPrompt({ ageGroup, theme, count }) {
  const themeLabel = THEMES.find((t) => t.id === theme)?.label || theme;
  return (
    `Create ${count} missions for a child in the "${ageGroup}" age group, ` +
    `themed around "${themeLabel}". Vary the game modes for a fun mix. ` +
    `Call the emit_missions tool with the result.`
  );
}

/** True if a single raw mission object is safe and complete enough to use. */
export function validateMission(raw) {
  if (!raw || typeof raw !== 'object') return false;
  if (!VALID_CATEGORIES.includes(raw.category)) return false;
  if (!VALID_MODES.includes(raw.mode)) return false;
  for (const field of ['prompt', 'parentTip', 'celebration']) {
    if (typeof raw[field] !== 'string' || raw[field].trim().length === 0) return false;
  }
  if (raw.mode === 'story') {
    if (!Array.isArray(raw.options) || raw.options.length < 2) return false;
    if (!raw.options.every((o) => typeof o === 'string' && o.trim())) return false;
  }
  return true;
}

const clamp = (s, max) => String(s).trim().slice(0, max);

/**
 * Validate, sanitize, and shape raw AI missions into TalkQuest's mission
 * objects. Pure (no I/O) so it is fully unit-testable. Drops invalid entries
 * and stamps the requested ageGroup/theme + a stable-ish id.
 */
export function coerceMissions(rawMissions, { ageGroup, theme }) {
  if (!Array.isArray(rawMissions)) return [];
  // Defensive: only trust the ageGroup/theme we asked for.
  const safeAge = VALID_AGES.includes(ageGroup) ? ageGroup : VALID_AGES[0];
  const safeTheme = VALID_THEMES.includes(theme) ? theme : VALID_THEMES[0];

  return rawMissions
    .filter(validateMission)
    .map((raw, i) => ({
      id: `ai-${safeAge}-${safeTheme}-${i}-${Date.now().toString(36)}`,
      ageGroup: safeAge,
      theme: safeTheme,
      category: raw.category,
      mode: raw.mode,
      prompt: clamp(raw.prompt, MAX_PROMPT),
      parentTip: clamp(raw.parentTip, MAX_TIP),
      celebration: clamp(raw.celebration, MAX_CELEBRATION),
      ...(raw.mode === 'story'
        ? { options: raw.options.slice(0, 3).map((o) => clamp(o, 24)) }
        : {}),
      source: 'ai',
    }));
}

/** Pull the emit_missions tool input out of a Messages API response body. */
export function extractMissions(responseBody) {
  const blocks = responseBody?.content;
  if (!Array.isArray(blocks)) return [];
  const toolUse = blocks.find((b) => b.type === 'tool_use' && b.name === 'emit_missions');
  return toolUse?.input?.missions || [];
}

/**
 * Generate `count` missions for an age group + theme. Resolves to a possibly
 * shorter array (only validated missions) or throws on transport/config error
 * — callers must fall back to the local database. Injectable `fetchImpl` keeps
 * it testable.
 */
export async function generateMissions({
  ageGroup,
  theme,
  count = 5,
  signal,
  fetchImpl,
  config = getAIConfig(),
}) {
  if (!isAIConfigured(config)) {
    throw new Error('AI missions are not configured');
  }
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) throw new Error('No fetch implementation available');

  const body = {
    model: config.model,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    tools: [emitMissionsTool(count)],
    tool_choice: { type: 'tool', name: 'emit_missions' },
    messages: [{ role: 'user', content: buildUserPrompt({ ageGroup, theme, count }) }],
  };

  // Proxy endpoint (preferred) vs. direct-to-Anthropic (dev only).
  const url = config.endpoint || ANTHROPIC_DIRECT_URL;
  const headers = { 'content-type': 'application/json' };
  if (!config.endpoint && config.apiKey) {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = ANTHROPIC_VERSION;
  }

  const res = await doFetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`AI mission request failed: ${res.status}`);
  }

  const json = await res.json();
  const missions = coerceMissions(extractMissions(json), { ageGroup, theme });
  return missions.slice(0, count);
}
