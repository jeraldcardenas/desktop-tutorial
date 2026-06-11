'use client';
import { useGameStore } from '@/stores/gameStore';
import { START_HP, MATCH_TIME_MS } from '@blockquest/shared';

export function BattleHud() {
  const battle = useGameStore((s) => s.battle);
  const userId = useGameStore((s) => s.userId);
  const opponent = useGameStore((s) => s.opponent);
  const phase = useGameStore((s) => s.phase);
  if (phase !== 'battle') return null;

  const mine = battle?.sides.find((s) => s.userId === userId) ?? battle?.sides[0];
  const theirs = battle?.sides.find((s) => s !== mine);
  const remaining = battle ? Math.max(0, MATCH_TIME_MS - battle.elapsedMs) : MATCH_TIME_MS;
  const mm = Math.floor(remaining / 60000);
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');

  return (
    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, pointerEvents: 'none' }}>
      <div style={{ textAlign: 'center', fontSize: 20, color: '#ffe97a' }}>
        ⏱ {mm}:{ss}
        {!battle && <div style={{ fontSize: 26, marginTop: 120 }}>Get ready...</div>}
      </div>
      {battle && mine && theirs && (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
          <SidePanel name="You" hp={mine.hp} combo={mine.combo} lines={mine.lines} good />
          <SidePanel name={opponent?.username ?? theirs.username} hp={theirs.hp} combo={theirs.combo} lines={theirs.lines} />
        </div>
      )}
    </div>
  );
}

function SidePanel({ name, hp, combo, lines, good }: { name: string; hp: number; combo: number; lines: number; good?: boolean }) {
  return (
    <div style={{ width: 260 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <strong style={{ color: good ? '#5ad1a0' : '#d15a6e' }}>{name}</strong>
        <span>{hp} HP · {lines} lines{combo > 0 ? ` · COMBO ×${combo + 1}` : ''}</span>
      </div>
      <div style={{ height: 10, background: '#0b0a14', border: '1px solid #3a3650', borderRadius: 4 }}>
        <div
          style={{
            height: '100%',
            width: `${(hp / START_HP) * 100}%`,
            background: good ? '#5ad1a0' : '#d15a6e',
            borderRadius: 3,
            transition: 'width 0.2s',
          }}
        />
      </div>
    </div>
  );
}
