'use client';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';
import { AvatarPreview } from './AvatarPreview';

export function ProfilePopup() {
  const popup = useGameStore((s) => s.profilePopup);
  const set = useGameStore((s) => s.set);
  const showToast = useGameStore((s) => s.showToast);
  if (!popup) return null;

  const challenge = () => {
    getSocket().emit('challenge_send', { targetUserId: popup.userId });
    showToast(`Challenge sent to ${popup.username}!`);
    set({ profilePopup: null });
  };

  return (
    <div className="modal-backdrop" onClick={() => set({ profilePopup: null })}>
      <div className="panel" style={{ width: 320, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <AvatarPreview cfg={popup.avatar} scale={5} />
        <h3 style={{ margin: '8px 0 4px' }}>{popup.username}</h3>
        <span className={`chip ${popup.rankTier}`}>{popup.rankTier}</span>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn" onClick={challenge} disabled={popup.inBattle}>
            {popup.inBattle ? 'In battle...' : 'Challenge ⚔'}
          </button>
          <button className="btn secondary" onClick={() => set({ profilePopup: null })}>Close</button>
        </div>
      </div>
    </div>
  );
}
