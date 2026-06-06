/**
 * Local persistence for progress and settings using AsyncStorage.
 * All data stays on-device. No accounts, no network, no analytics.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export const defaultProgress = {
  sessionsCompleted: 0,
  // Counts mapped to parent-dashboard metrics.
  words: 0, // language
  movement: 0, // motor
  social: 0, // social + emotion
  cognitive: 0, // cognitive
  imitation: 0, // pretend
  missionsDone: 0,
  missionsSkipped: 0,
  themeCounts: {}, // { themeId: count }
  // Last 8 weeks of activity keyed by ISO week start (YYYY-MM-DD of Monday).
  weekly: {}, // { weekStart: { sessions, missions } }
};

export const defaultSettings = {
  voiceEnabled: true,
  soundEnabled: true,
  childName: '',
};

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...fallback };
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    // Corrupt or unavailable storage should never crash play.
    return { ...fallback };
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export const loadProgress = () => readJson(STORAGE_KEYS.progress, defaultProgress);
export const saveProgress = (p) => writeJson(STORAGE_KEYS.progress, p);

export const loadSettings = () => readJson(STORAGE_KEYS.settings, defaultSettings);
export const saveSettings = (s) => writeJson(STORAGE_KEYS.settings, s);

export async function resetProgress() {
  await AsyncStorage.removeItem(STORAGE_KEYS.progress);
  return { ...defaultProgress };
}

/** Returns the ISO date (YYYY-MM-DD) of the Monday for the given date. */
export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

/**
 * Pure reducer that folds a completed session's missions into a progress
 * object. Kept pure (no I/O) so it is easy to unit test and reuse.
 *
 * @param {object} progress current progress object
 * @param {object} session  { theme, completed: Mission[], skipped: number }
 * @returns new progress object
 */
export function applySession(progress, session) {
  const next = {
    ...defaultProgress,
    ...progress,
    themeCounts: { ...(progress.themeCounts || {}) },
    weekly: { ...(progress.weekly || {}) },
  };

  next.sessionsCompleted += 1;
  next.missionsSkipped += session.skipped || 0;

  for (const mission of session.completed || []) {
    next.missionsDone += 1;
    switch (mission.category) {
      case 'language':
        next.words += 1;
        break;
      case 'motor':
        next.movement += 1;
        break;
      case 'social':
      case 'emotion':
        next.social += 1;
        break;
      case 'cognitive':
        next.cognitive += 1;
        break;
      case 'pretend':
        next.imitation += 1;
        break;
      default:
        break;
    }
  }

  if (session.theme) {
    next.themeCounts[session.theme] = (next.themeCounts[session.theme] || 0) + 1;
  }

  const wk = weekStart();
  const prevWeek = next.weekly[wk] || { sessions: 0, missions: 0 };
  next.weekly[wk] = {
    sessions: prevWeek.sessions + 1,
    missions: prevWeek.missions + (session.completed?.length || 0),
  };

  return next;
}

/** Returns the most-played theme id, or null if none yet. */
export function favoriteTheme(progress) {
  const counts = progress?.themeCounts || {};
  let best = null;
  let bestN = 0;
  for (const [theme, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = theme;
      bestN = n;
    }
  }
  return best;
}
