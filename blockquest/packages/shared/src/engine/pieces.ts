export type PieceKind = 0 | 1 | 2 | 3 | 4 | 5 | 6; // I O T S Z J L
export const PIECE_NAMES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export interface ActivePiece {
  kind: PieceKind;
  rot: number; // 0..3
  x: number;
  y: number;
}

type Cell = readonly [number, number];

const BASE: { box: number; cells: Cell[] }[] = [
  { box: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] }, // I
  { box: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // O
  { box: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] }, // T
  { box: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] }, // S
  { box: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] }, // Z
  { box: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] }, // J
  { box: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] }, // L
];

/** ROTATIONS[kind][rot] = list of [x,y] cell offsets. CW rotation in an n×n box: (x,y) → (n-1-y, x). */
export const ROTATIONS: Cell[][][] = BASE.map(({ box, cells }) => {
  const rots: Cell[][] = [cells];
  for (let r = 1; r < 4; r++) {
    rots.push(rots[r - 1].map(([x, y]) => [box - 1 - y, x] as const));
  }
  return rots;
});

export function cellsOf(p: ActivePiece): Cell[] {
  return ROTATIONS[p.kind][p.rot & 3].map(([cx, cy]) => [p.x + cx, p.y + cy] as const);
}

export function spawnPiece(kind: PieceKind): ActivePiece {
  return { kind, rot: 0, x: kind === 1 ? 4 : 3, y: kind === 0 ? -1 : 0 };
}

/** Simple kick offsets tried in order when a rotation collides. */
export const KICKS: Cell[] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
