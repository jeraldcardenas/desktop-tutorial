// Board
export const BOARD_W = 10;
export const BOARD_H = 20;
export const EMPTY = 0;
export const GARBAGE = 8;

// World
export const TILE = 16;
export const MOVE_COOLDOWN_MS = 150;
export const WORLD_SNAPSHOT_MS = 100;
export const CHAT_MAX_LEN = 140;

// Battle
export const BATTLE_SNAPSHOT_MS = 100;
export const BATTLE_TICK_MS = 50;
export const COUNTDOWN_MS = 3000;
export const MATCH_TIME_MS = 5 * 60_000;
export const START_HP = 100;
export const HP_PER_ROW = 4;
export const GARBAGE_DELAY_MS = 2000;
/** Attack rows by lines cleared (index = lines). */
export const ATTACK_TABLE = [0, 0, 1, 2, 4] as const;

/** Gravity interval in ms as a function of elapsed match time. */
export function gravityMs(elapsedMs: number): number {
  return Math.max(300, 900 - Math.floor(elapsedMs / 20_000) * 75);
}

// Ranks
export const RANK_THRESHOLDS = [
  { tier: 'ROOKIE', min: 0 },
  { tier: 'BRONZE', min: 100 },
  { tier: 'SILVER', min: 300 },
] as const;

export type RankTier = (typeof RANK_THRESHOLDS)[number]['tier'];

export function tierFor(points: number): RankTier {
  let tier: RankTier = 'ROOKIE';
  for (const r of RANK_THRESHOLDS) if (points >= r.min) tier = r.tier;
  return tier;
}

/** EXP needed to go from `level` to `level + 1`. */
export const expToNext = (level: number) => level * 100;

export function applyExp(level: number, exp: number): { level: number; exp: number } {
  while (exp >= expToNext(level)) {
    exp -= expToNext(level);
    level++;
  }
  return { level, exp };
}

// Avatar option counts (creator + validation share these)
export const AVATAR_OPTIONS = {
  skin: 4,
  hair: 4,
  hairColor: 6,
  top: 6,
  bottom: 4,
} as const;
