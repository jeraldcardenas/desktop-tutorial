import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/stores/gameStore';
import { api, getToken } from './api';

const WS = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) throw new Error('socket not connected yet');
  return socket;
}

export function connectSocket(): Socket {
  if (socket) return socket;
  socket = io(WS, { auth: { token: getToken() }, transports: ['websocket'] });
  const store = useGameStore.getState();

  socket.on('connect_error', () => store.showToast('Connection failed — is the server running?'));

  socket.on('chat_message', (m) => useGameStore.getState().pushChat(m));
  socket.on('error_toast', ({ message }) => useGameStore.getState().showToast(message));
  socket.on('shop_open', () => useGameStore.getState().set({ shopOpen: true }));

  socket.on('world_state', ({ players }) =>
    useGameStore.getState().set({ onlineCount: players.length }),
  );

  socket.on('challenge_received', (p) => useGameStore.getState().set({ challenge: p }));
  socket.on('challenge_result', ({ accepted }) => {
    if (!accepted) useGameStore.getState().showToast('Challenge declined or expired');
  });

  socket.on('battle_start', ({ opponent }) => {
    useGameStore.getState().set({
      phase: 'battle',
      opponent,
      battle: null,
      result: null,
      challenge: null,
      profilePopup: null,
    });
  });
  socket.on('battle_state', (snap) => useGameStore.getState().set({ battle: snap }));
  socket.on('battle_end', (p) => {
    useGameStore.getState().set({ phase: 'result', result: p });
    void refreshProfile();
  });

  return socket;
}

export async function refreshProfile() {
  try {
    const profile = await api<NonNullable<ReturnType<typeof useGameStore.getState>['profile']>>('/profile/me');
    useGameStore.getState().set({ profile });
  } catch {
    /* ignore */
  }
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
