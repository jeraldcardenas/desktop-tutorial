'use client';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';

export function ChallengeModal() {
  const challenge = useGameStore((s) => s.challenge);
  const set = useGameStore((s) => s.set);
  if (!challenge) return null;

  const respond = (accept: boolean) => {
    getSocket().emit('challenge_respond', { challengeId: challenge.challengeId, accept });
    set({ challenge: null });
  };

  return (
    <div className="modal-backdrop">
      <div className="panel" style={{ width: 360, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>⚔ Battle Challenge!</h2>
        <p>
          <strong style={{ color: '#ffe97a' }}>{challenge.from.username}</strong>{' '}
          <span className={`chip ${challenge.from.rankTier}`}>{challenge.from.rankTier}</span>
          <br />
          Lv {challenge.from.level} · {challenge.from.wins}W / {challenge.from.losses}L
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" onClick={() => respond(true)}>Accept ⚔</button>
          <button className="btn danger" onClick={() => respond(false)}>Decline</button>
        </div>
      </div>
    </div>
  );
}
