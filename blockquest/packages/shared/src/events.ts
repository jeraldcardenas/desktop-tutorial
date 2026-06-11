import {
  AvatarConfig, BattleCmd, BattleSnapshot, Direction, GridPos, MatchStats,
  NpcSnapshot, PlayerSnapshot, ProfileCard, Rewards,
} from './types';

/** Client → Server socket events. */
export interface ClientToServer {
  world_join: () => void;
  move_intent: (p: { dir: Direction; seq: number }) => void;
  chat_send: (p: { text: string }) => void;
  npc_interact: (p: { npcId: string }) => void;

  challenge_send: (p: { targetUserId: string }) => void;
  challenge_respond: (p: { challengeId: string; accept: boolean }) => void;

  battle_input: (p: { cmd: BattleCmd }) => void;
  battle_forfeit: () => void;
}

/** Server → Client socket events. */
export interface ServerToClient {
  world_init: (p: { self: PlayerSnapshot; players: PlayerSnapshot[]; npcs: NpcSnapshot[] }) => void;
  world_state: (p: { players: PlayerSnapshot[] }) => void;
  player_joined: (p: PlayerSnapshot) => void;
  player_left: (p: { userId: string }) => void;
  move_reject: (p: { seq: number; pos: GridPos }) => void;
  chat_message: (p: { from: string; username: string; text: string }) => void;
  shop_open: () => void;
  error_toast: (p: { message: string }) => void;

  challenge_received: (p: { challengeId: string; from: ProfileCard }) => void;
  challenge_result: (p: { challengeId: string; accepted: boolean }) => void;

  battle_start: (p: { roomId: string; opponent: ProfileCard; countdownMs: number }) => void;
  battle_state: (p: BattleSnapshot) => void;
  battle_end: (p: { won: boolean; reason: string; stats: MatchStats; rewards: Rewards | null }) => void;
}
