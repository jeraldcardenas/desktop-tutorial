'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import { connectSocket, disconnectSocket, refreshProfile } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { PhaserMount } from '@/components/PhaserMount';
import { HudOverlay } from '@/components/HudOverlay';
import { ChatBox } from '@/components/ChatBox';
import { ChallengeModal } from '@/components/ChallengeModal';
import { ProfilePopup } from '@/components/ProfilePopup';
import { BattleHud } from '@/components/BattleHud';
import { ResultScreen } from '@/components/ResultScreen';
import { ShopModal } from '@/components/ShopModal';
import { api } from '@/lib/api';

export default function PlayPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/');
      return;
    }
    let active = true;
    (async () => {
      try {
        const profile = await api<{ userId: string; user: { username: string } }>('/profile/me');
        if (!active) return;
        useGameStore.getState().set({
          userId: profile.userId,
          username: profile.user.username,
          profile: profile as never,
        });
        connectSocket();
        void refreshProfile();
        setReady(true);
      } catch {
        router.replace('/');
      }
    })();
    return () => {
      active = false;
      disconnectSocket();
    };
  }, [router]);

  if (!ready) {
    return (
      <main style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading BlockQuest...
      </main>
    );
  }

  return (
    <main style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <PhaserMount />
      <HudOverlay />
      <ChatBox />
      <ChallengeModal />
      <ProfilePopup />
      <BattleHud />
      <ResultScreen />
      <ShopModal />
    </main>
  );
}
