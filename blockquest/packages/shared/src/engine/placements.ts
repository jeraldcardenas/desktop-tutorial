import { BOARD_W as W, BOARD_H as H, EMPTY } from '../constants';
import { Board, idx, collides, dropDistance, lockPiece } from './board';
import { ActivePiece, PieceKind } from './pieces';

export interface PlacementOutcome {
  piece: ActivePiece; // final resting position
  linesCleared: number;
  aggregateHeight: number;
  holes: number;
  bumpiness: number;
}

/** All distinct resting positions for `kind` on `board`, with board-quality metrics. */
export function enumeratePlacements(board: Board, kind: PieceKind): PlacementOutcome[] {
  const out: PlacementOutcome[] = [];
  const seen = new Set<string>();
  for (let rot = 0; rot < 4; rot++) {
    for (let x = -2; x < W; x++) {
      const start: ActivePiece = { kind, rot, x, y: -2 };
      if (collides(board, start)) continue;
      const rest: ActivePiece = { ...start, y: start.y + dropDistance(board, start) };
      const key = `${rot}:${x}:${rest.y}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const clone = new Uint8Array(board) as Board;
      const linesCleared = lockPiece(clone, rest);
      out.push({ piece: rest, linesCleared, ...metrics(clone) });
    }
  }
  return out;
}

function metrics(board: Board): { aggregateHeight: number; holes: number; bumpiness: number } {
  const heights = new Array<number>(W).fill(0);
  let holes = 0;
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = 0; y < H; y++) {
      const filled = board[idx(x, y)] !== EMPTY;
      if (filled && top === -1) top = y;
      if (!filled && top !== -1) holes++;
    }
    heights[x] = top === -1 ? 0 : H - top;
  }
  let bumpiness = 0;
  for (let x = 0; x < W - 1; x++) bumpiness += Math.abs(heights[x] - heights[x + 1]);
  return { aggregateHeight: heights.reduce((a, b) => a + b, 0), holes, bumpiness };
}
