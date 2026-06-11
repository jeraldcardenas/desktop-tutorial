'use client';
import { useEffect, useRef } from 'react';

export function PhaserMount() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: import('phaser').Game | null = null;
    let cancelled = false;
    (async () => {
      const { createGame } = await import('@/game/createGame');
      if (!cancelled && ref.current) game = createGame(ref.current);
    })();
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />;
}
