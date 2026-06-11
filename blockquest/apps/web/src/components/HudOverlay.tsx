'use client';
import { useGameStore } from '@/stores/gameStore';
import { expToNext } from '@blockquest/shared';

export function HudOverlay() {
  const profile = useGameStore((s) => s.profile);
  const onlineCount = useGameStore((s) => s.onlineCount);
  const toast = useGameStore((s) => s.toast);
  const phase = useGameStore((s) => s.phase);

  return (
    <>
      {profile && phase === 'world' && (
        <div className="panel" style={{ position: 'absolute', top: 12, left: 12, padding: '8px 14px', display: 'flex', gap: 14, alignItems: 'center', pointerEvents: 'none' }}>
          <strong style={{ color: '#ffe97a' }}>{profile.user.username}</strong>
          <span>Lv {profile.level} ({profile.exp}/{expToNext(profile.level)})</span>
          <span style={{ color: '#f2d250' }}>🪙 {profile.coins}</span>
          <span className={`chip ${profile.rankTier}`}>{profile.rankTier} · {profile.rankPoints} RP</span>
        </div>
      )}
      {phase === 'world' && (
        <div style={{ position: 'absolute', top: 12, right: 12, color: '#8d89a8', fontSize: 13, pointerEvents: 'none' }}>
          🟢 {onlineCount} online · Beginner Village · WASD/arrows move · E interact
        </div>
      )}
      {toast && (
        <div className="panel" style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', padding: '8px 18px', borderColor: '#5ad1a0', zIndex: 200 }}>
          {toast}
        </div>
      )}
    </>
  );
}
