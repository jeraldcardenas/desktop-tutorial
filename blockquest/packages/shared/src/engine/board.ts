import { BOARD_W as W, BOARD_H as H, EMPTY, GARBAGE } from '../constants';
import { ActivePiece, cellsOf, KICKS } from './pieces';
import { Rng } from '../rng';

/** Row-major board, length W*H. 0 = empty, 1–7 = piece colors, 8 = garbage. */
export type Board = Uint8Array;

export const newBoard = (): Board => new Uint8Array(W * H);
export const idx = (x: number, y: number) => y * W + x;

export function collides(board: Board, piece: ActivePiece): boolean {
  for (const [px, py] of cellsOf(piece)) {
    if (px < 0 || px >= W || py >= H) return true;
    if (py >= 0 && board[idx(px, py)] !== EMPTY) return true;
  }
  return false;
}

export function tryMove(board: Board, piece: ActivePiece, dx: number, dy: number): ActivePiece | null {
  const moved = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return collides(board, moved) ? null : moved;
}

export function tryRotate(board: Board, piece: ActivePiece, cw: boolean): ActivePiece | null {
  const rot = (piece.rot + (cw ? 1 : 3)) & 3;
  for (const [kx, ky] of KICKS) {
    const candidate = { ...piece, rot, x: piece.x + kx, y: piece.y + ky };
    if (!collides(board, candidate)) return candidate;
  }
  return null;
}

export function dropDistance(board: Board, piece: ActivePiece): number {
  let d = 0;
  while (!collides(board, { ...piece, y: piece.y + d + 1 })) d++;
  return d;
}

/** Merge the piece into the board, then clear full rows. Returns lines cleared. */
export function lockPiece(board: Board, piece: ActivePiece): number {
  for (const [px, py] of cellsOf(piece)) {
    if (py >= 0) board[idx(px, py)] = piece.kind + 1;
  }
  return clearFullRows(board);
}

export function clearFullRows(board: Board): number {
  let cleared = 0;
  for (let y = H - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < W; x++) {
      if (board[idx(x, y)] === EMPTY) { full = false; break; }
    }
    if (full) {
      board.copyWithin(W, 0, y * W); // shift rows above down by one
      board.fill(EMPTY, 0, W);
      cleared++;
      y++; // re-check the same row index
    }
  }
  return cleared;
}

/** Push gray rows (one random gap each) in from the bottom. Returns false on top-out. */
export function addGarbageRows(board: Board, rows: number, rng: Rng): boolean {
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < W; x++) {
      if (board[idx(x, 0)] !== EMPTY) return false;
    }
    board.copyWithin(0, W); // shift everything up
    const gap = rng.int(W);
    for (let x = 0; x < W; x++) {
      board[idx(x, H - 1)] = x === gap ? EMPTY : GARBAGE;
    }
  }
  return true;
}
