import { Tile, TILE, mulberry32 } from '@blockquest/shared';

/** Procedural 16×16 tile textures — keyed `tile:<kind>`. */
export function buildTileTextures(scene: Phaser.Scene) {
  const draw: Record<Tile, (ctx: CanvasRenderingContext2D) => void> = {
    [Tile.Grass]: (ctx) => {
      base(ctx, '#58a14e');
      speckle(ctx, '#4c8c44', 6, 1);
    },
    [Tile.Path]: (ctx) => {
      base(ctx, '#d8c08a');
      speckle(ctx, '#c7af7a', 5, 2);
    },
    [Tile.Water]: (ctx) => {
      base(ctx, '#3f7fc4');
      ctx.fillStyle = '#5e9bd8';
      ctx.fillRect(2, 4, 5, 1);
      ctx.fillRect(8, 10, 6, 1);
    },
    [Tile.Tree]: (ctx) => {
      base(ctx, '#58a14e');
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(7, 10, 2, 5);
      ctx.fillStyle = '#2f6b33';
      ctx.fillRect(3, 2, 10, 9);
      ctx.fillStyle = '#3d8a42';
      ctx.fillRect(4, 3, 5, 4);
    },
    [Tile.House]: (ctx) => {
      base(ctx, '#b06a4a');
      ctx.fillStyle = '#7d4631';
      ctx.fillRect(0, 0, 16, 5);
      ctx.fillStyle = '#8f5238';
      ctx.fillRect(2, 7, 3, 4);
      ctx.fillRect(11, 7, 3, 4);
    },
    [Tile.Fountain]: (ctx) => {
      base(ctx, '#9aa2ad');
      ctx.fillStyle = '#3f7fc4';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#bfe2ff';
      ctx.fillRect(6, 6, 4, 4);
    },
    [Tile.Flowers]: (ctx) => {
      base(ctx, '#58a14e');
      ctx.fillStyle = '#f4d35e';
      ctx.fillRect(3, 4, 2, 2);
      ctx.fillStyle = '#ef6f6c';
      ctx.fillRect(10, 9, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 12, 2, 2);
    },
  };

  for (const kind of Object.values(Tile).filter((v): v is Tile => typeof v === 'number')) {
    const key = `tile:${kind}`;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, TILE, TILE);
    if (!tex) continue;
    draw[kind](tex.getContext());
    tex.refresh();
  }
}

function base(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TILE, TILE);
}

function speckle(ctx: CanvasRenderingContext2D, color: string, count: number, size: number) {
  const rng = mulberry32(7);
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(rng.int(TILE - size), rng.int(TILE - size), size, size);
  }
}
