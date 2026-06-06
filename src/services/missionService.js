/**
 * Mission selection & randomization.
 *
 * Uses the local database first (see data/missions.js). The `provider` seam at
 * the bottom is where future AI-generated missions can be plugged in without
 * changing any screen code.
 */
import missions from '../data/missions';
import { generateMissions } from './aiMissionProvider';
import { isAIConfigured } from './aiConfig';

/** Fisher–Yates shuffle returning a new array (does not mutate input). */
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** All missions matching an age group (and optionally a theme). */
export function filterMissions(ageGroup, theme) {
  return missions.filter(
    (m) => m.ageGroup === ageGroup && (!theme || m.theme === theme)
  );
}

/**
 * Build a randomized, de-duplicated mission list for one session.
 *
 * Prefers missions from the chosen theme; if the theme doesn't have enough for
 * the requested count, it tops up with other missions from the same age group
 * so a session is never short. Tries to vary game modes for a fun mix.
 *
 * @returns Mission[] of length up to `count`
 */
export function buildSession({ ageGroup, theme, count = 5, rng = Math.random }) {
  const onTheme = shuffle(filterMissions(ageGroup, theme), rng);
  const offTheme = shuffle(
    filterMissions(ageGroup).filter((m) => m.theme !== theme),
    rng
  );

  const pool = [...onTheme, ...offTheme];
  const picked = [];
  const usedModes = new Set();

  // First pass: prefer mode variety.
  for (const mission of pool) {
    if (picked.length >= count) break;
    if (!usedModes.has(mission.mode)) {
      picked.push(mission);
      usedModes.add(mission.mode);
    }
  }
  // Second pass: fill remaining slots with whatever is left.
  for (const mission of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(mission)) picked.push(mission);
  }

  return picked.slice(0, count);
}

/**
 * Top up an AI-generated list to `count` using local missions, avoiding prompt
 * duplicates. Guarantees the session is never short even if the model returned
 * fewer (or zero) usable missions.
 */
export function topUpWithLocal(aiMissions, { ageGroup, theme, count, rng = Math.random }) {
  const seenPrompts = new Set(aiMissions.map((m) => m.prompt.trim().toLowerCase()));
  const result = [...aiMissions];
  const local = buildSession({ ageGroup, theme, count, rng });
  for (const mission of local) {
    if (result.length >= count) break;
    if (!seenPrompts.has(mission.prompt.trim().toLowerCase())) {
      result.push(mission);
      seenPrompts.add(mission.prompt.trim().toLowerCase());
    }
  }
  return result.slice(0, count);
}

/**
 * Provider seam. Resolves a session's missions, using AI generation when
 * `useAI` is set AND it is configured — otherwise (or on any failure) it serves
 * the local database. AI output is always topped up with local missions so the
 * session reaches `count`, and any error degrades gracefully to local-only.
 */
export async function getSessionMissions(config) {
  const { ageGroup, theme, count = 5, useAI = false } = config;

  if (useAI && isAIConfigured()) {
    try {
      const aiMissions = await generateMissions({ ageGroup, theme, count });
      if (aiMissions.length > 0) {
        return topUpWithLocal(aiMissions, { ageGroup, theme, count });
      }
    } catch (e) {
      // Network/config/validation problem — fall through to local missions.
    }
  }

  return buildSession({ ageGroup, theme, count });
}
