'use client';
import { useGameStore } from '@/stores/gameStore';
import { bridge } from '@/lib/bridge';

export function ResultScreen() {
  const result = useGameStore((s) => s.result);
  const phase = useGameStore((s) => s.phase);
  const set = useGameStore((s) => s.set);
  if (phase !== 'result' || !result) return null;

  const returnToWorld = () => {
    set({ phase: 'world', result: null, battle: null, opponent: null });
    bridge.emit('return-world');
  };

  return (
    <div className="modal-backdrop">
      <div className="panel" style={{ width: 400, textAlign: 'center' }}>
        <h1 style={{ color: result.won ? '#5ad1a0' : '#d15a6e', fontSize: 36, margin: '4px 0' }}>
          {result.won ? '🏆 VICTORY!' : '💀 DEFEAT'}
        </h1>
        <p style={{ color: '#8d89a8', marginTop: 0 }}>
          {result.reason === 'topout' && (result.won ? 'Opponent topped out!' : 'Your board topped out')}
          {result.reason === 'hp' && (result.won ? 'Opponent HP reached zero!' : 'Your HP reached zero')}
          {result.reason === 'timeout' && 'Time! Higher score wins'}
          {result.reason === 'forfeit' && (result.won ? 'Opponent left the battle' : 'Battle forfeited')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '14px 0', fontSize: 14 }}>
          <span>Lines<br /><strong>{result.stats.lines}</strong></span>
          <span>Best combo<br /><strong>×{result.stats.maxCombo + 1}</strong></span>
          <span>Attack sent<br /><strong>{result.stats.attacksSent}</strong></span>
          <span>Score<br /><strong>{result.stats.score}</strong></span>
        </div>

        {result.rewards && (
          <div className="panel" style={{ background: '#181527', margin: '10px 0', padding: 10, fontSize: 15 }}>
            +{result.rewards.exp} EXP · +{result.rewards.coins} 🪙
            {result.rewards.rankDelta !== 0 && (
              <span style={{ color: result.rewards.rankDelta > 0 ? '#5ad1a0' : '#d15a6e' }}>
                {' '}· {result.rewards.rankDelta > 0 ? '+' : ''}{result.rewards.rankDelta} RP
              </span>
            )}
            {result.rewards.leveledUp && (
              <div style={{ color: '#ffe97a', marginTop: 6 }}>⭐ LEVEL UP! Now level {result.rewards.newLevel}</div>
            )}
          </div>
        )}

        <button className="btn" onClick={returnToWorld} style={{ marginTop: 8 }}>
          Return to Town
        </button>
      </div>
    </div>
  );
}
