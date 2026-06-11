import { create } from 'zustand';
import type { BattleSnapshot, MatchStats, PlayerSnapshot, ProfileCard, Rewards } from '@blockquest/shared';

export interface ChatMsg {
  from: string;
  username: string;
  text: string;
}

export interface BattleResult {
  won: boolean;
  reason: string;
  stats: MatchStats;
  rewards: Rewards | null;
}

interface ProfileData {
  level: number;
  exp: number;
  coins: number;
  rankTier: string;
  rankPoints: number;
  wins: number;
  losses: number;
  avatar: Record<string, number>;
  user: { username: string };
}

interface GameState {
  userId: string | null;
  username: string | null;
  profile: ProfileData | null;
  phase: 'world' | 'battle' | 'result';
  typing: boolean;
  onlineCount: number;
  chat: ChatMsg[];
  challenge: { challengeId: string; from: ProfileCard } | null;
  opponent: ProfileCard | null;
  battle: BattleSnapshot | null;
  result: BattleResult | null;
  shopOpen: boolean;
  profilePopup: PlayerSnapshot | null;
  toast: string | null;

  set: (partial: Partial<GameState>) => void;
  pushChat: (m: ChatMsg) => void;
  showToast: (message: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  userId: null,
  username: null,
  profile: null,
  phase: 'world',
  typing: false,
  onlineCount: 1,
  chat: [],
  challenge: null,
  opponent: null,
  battle: null,
  result: null,
  shopOpen: false,
  profilePopup: null,
  toast: null,

  set: (partial) => set(partial),
  pushChat: (m) => set({ chat: [...get().chat.slice(-49), m] }),
  showToast: (message) => {
    set({ toast: message });
    setTimeout(() => {
      if (get().toast === message) set({ toast: null });
    }, 3000);
  },
}));
