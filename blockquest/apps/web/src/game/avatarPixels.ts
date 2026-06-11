import type { AvatarConfig, Direction } from '@blockquest/shared';

/**
 * Procedural 16×24 pixel avatars — no image assets needed. The same routine
 * powers the React avatar-creator preview (plain <canvas>) and the Phaser
 * world sprites (canvas texture).
 */
export const FRAME_W = 16;
export const FRAME_H = 24;

export const SKIN_TONES = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
export const HAIR_COLORS = ['#2c222b', '#5a3825', '#b55239', '#e6c84c', '#ff7ab6', '#3ddc84'];
export const TOP_COLORS = ['#3b6ea5', '#a53b3b', '#3ba56b', '#777f8c', '#6b3ba5', '#e0b400'];
export const BOTTOM_COLORS = ['#34415e', '#4e342e', '#3c5d3c', '#6e5d2e'];
export const HAIR_NAMES = ['Short', 'Bob', 'Spiky', 'Long'];

const pick = (arr: string[], i: number) => arr[Math.max(0, Math.min(i, arr.length - 1))];

export function drawAvatarFrame(
  ctx: CanvasRenderingContext2D,
  cfg: AvatarConfig,
  facing: Direction,
  step: 0 | 1,
  ox = 0,
  oy = 0,
) {
  const skin = pick(SKIN_TONES, cfg.skin);
  const hairC = pick(HAIR_COLORS, cfg.hairColor);
  const topC = pick(TOP_COLORS, cfg.top);
  const botC = pick(BOTTOM_COLORS, cfg.bottom);

  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  };

  // head
  px(5, 2, 6, 7, skin);

  // hair (covers face when seen from behind)
  if (facing === 'up') px(5, 2, 6, 7, hairC);
  switch (cfg.hair) {
    case 0: // short
      px(4, 1, 8, 3, hairC); px(4, 4, 1, 2, hairC); px(11, 4, 1, 2, hairC);
      break;
    case 1: // bob
      px(4, 1, 8, 3, hairC); px(4, 4, 2, 5, hairC); px(10, 4, 2, 5, hairC);
      break;
    case 2: // spiky
      px(4, 1, 8, 2, hairC); px(4, 0, 2, 1, hairC); px(7, 0, 2, 1, hairC); px(10, 0, 2, 1, hairC);
      break;
    default: // long
      px(4, 1, 8, 3, hairC); px(3, 4, 2, 10, hairC); px(11, 4, 2, 10, hairC);
      break;
  }

  // eyes
  if (facing === 'down') {
    px(6, 5, 1, 1, '#1c1c1c'); px(9, 5, 1, 1, '#1c1c1c');
  } else if (facing === 'left') {
    px(5, 5, 1, 1, '#1c1c1c'); px(8, 5, 1, 1, '#1c1c1c');
  } else if (facing === 'right') {
    px(7, 5, 1, 1, '#1c1c1c'); px(10, 5, 1, 1, '#1c1c1c');
  }

  // torso + arms + hands
  px(4, 9, 8, 7, topC);
  px(3, 9, 1, 6, topC); px(12, 9, 1, 6, topC);
  px(3, 15, 1, 1, skin); px(12, 15, 1, 1, skin);

  // legs + shoes, with a simple two-frame walk
  const lOff = step === 1 ? 1 : 0;
  const rOff = step === 1 ? 0 : 1;
  px(5, 16, 3, 5 - lOff, botC);
  px(8, 16, 3, 5 - rOff, botC);
  px(5, 21 - lOff, 3, 2, '#23211f');
  px(8, 21 - rOff, 3, 2, '#23211f');
}

const FACINGS: Direction[] = ['down', 'up', 'left', 'right'];

/** Stable key for one appearance — equal configs share one texture. */
export const avatarKey = (cfg: AvatarConfig) =>
  `avatar:${cfg.skin}-${cfg.hair}-${cfg.hairColor}-${cfg.top}-${cfg.bottom}`;

export const frameName = (facing: Direction, step: 0 | 1) => `${facing}${step}`;

/**
 * Builds (or reuses) a Phaser canvas texture containing all 8 frames
 * (4 facings × 2 walk steps) for an avatar config.
 */
export function buildAvatarTexture(scene: Phaser.Scene, cfg: AvatarConfig): string {
  const key = avatarKey(cfg);
  if (scene.textures.exists(key)) return key;

  const tex = scene.textures.createCanvas(key, FRAME_W * 8, FRAME_H);
  if (!tex) return key;
  const ctx = tex.getContext();
  let i = 0;
  for (const facing of FACINGS) {
    for (const step of [0, 1] as const) {
      drawAvatarFrame(ctx, cfg, facing, step, i * FRAME_W, 0);
      tex.add(frameName(facing, step), 0, i * FRAME_W, 0, FRAME_W, FRAME_H);
      i++;
    }
  }
  tex.refresh();
  return key;
}
