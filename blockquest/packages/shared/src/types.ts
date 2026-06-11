import { PieceKind, ActivePiece } from './engine/pieces';
import { RankTier } from './constants';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GridPos {
  x: number;
  y: number;
}

export const DIR_VECTORS: Record<Direction, GridPos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface AvatarConfig {
  skin: number;
  hair: number;
  hairColor: number;
  top: number;
  bottom: number;
}

export const DEFAULT_AVATAR: AvatarConfig = { skin: 0, hair: 0, hairColor: 0, top: 0, bottom: 0 };

export interface PlayerSnapshot {
  userId: string;
  username: string;
  pos: GridPos;
  facing: Direction;
  avatar: AvatarConfig;
  rankTier: RankTier;
  inBattle: boolean;
}

export interface NpcSnapshot {
  id: string;
  name: string;
  pos: GridPos;
  kind: 'trainer' | 'shopkeeper';
}

export interface ProfileCard {
  userId: string;
  username: string;
  level: number;
  rankTier: RankTier;
  wins: number;
  losses: number;
}

export type BattleCmd = 'left' | 'right' | 'rot_cw' | 'rot_ccw' | 'soft' | 'hard' | 'hold';

export interface BattleSideSnapshot {
  userId: string;
  username: string;
  /** Board with the active piece already merged in (plain array for JSON). */
  board: number[];
  active: ActivePiece | null;
  ghostY: number | null;
  hold: PieceKind | null;
  queue: PieceKind[];
  hp: number;
  score: number;
  lines: number;
  combo: number;
  pendingGarbage: number;
  alive: boolean;
}

export interface BattleSnapshot {
  roomId: string;
  elapsedMs: number;
  sides: [BattleSideSnapshot, BattleSideSnapshot];
}

export interface MatchStats {
  lines: number;
  maxCombo: number;
  attacksSent: number;
  score: number;
}

export interface Rewards {
  exp: number;
  coins: number;
  rankDelta: number;
  leveledUp: boolean;
  newLevel: number;
  newTier: RankTier;
}

export interface ShopItem {
  id: string;
  slot: keyof AvatarConfig;
  value: number;
  name: string;
  rarity: string;
  costCoins: number;
  owned: boolean;
  equipped: boolean;
}
