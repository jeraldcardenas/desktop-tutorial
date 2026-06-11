'use client';
import { useEffect, useRef } from 'react';
import type { AvatarConfig } from '@blockquest/shared';
import { drawAvatarFrame, FRAME_W, FRAME_H } from '@/game/avatarPixels';

export function AvatarPreview({ cfg, scale = 7 }: { cfg: AvatarConfig; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let step: 0 | 1 = 0;
    const render = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);
      drawAvatarFrame(ctx, cfg, 'down', step);
      ctx.restore();
    };
    render();
    const id = setInterval(() => {
      step = step === 0 ? 1 : 0;
      render();
    }, 400);
    return () => clearInterval(id);
  }, [cfg, scale]);

  return (
    <canvas
      ref={ref}
      width={FRAME_W * scale}
      height={FRAME_H * scale}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
