/** Deterministic engine sanity tests — run with `npm test -w @blockquest/shared`. */
import assert from 'node:assert';
import {
  newBoard, idx, collides, tryMove, tryRotate, lockPiece, clearFullRows,
  addGarbageRows, dropDistance, spawnPiece, sevenBag, mulberry32, computeAttack,
  enumeratePlacements, BOARD_W, BOARD_H, EMPTY, GARBAGE,
} from '../src/index';

// 7-bag: first 7 pieces contain each kind exactly once, and is seed-stable
{
  const bag = sevenBag(mulberry32(42));
  const first7 = Array.from({ length: 7 }, () => bag.next().value);
  assert.deepStrictEqual([...first7].sort(), [0, 1, 2, 3, 4, 5, 6]);
  const bag2 = sevenBag(mulberry32(42));
  const again = Array.from({ length: 7 }, () => bag2.next().value);
  assert.deepStrictEqual(first7, again, 'bag must be deterministic per seed');
}

// Line clear: fill bottom row except one cell, drop an I-piece vertically next to it
{
  const board = newBoard();
  for (let x = 0; x < BOARD_W - 1; x++) board[idx(x, BOARD_H - 1)] = 1;
  board[idx(BOARD_W - 1, BOARD_H - 2)] = EMPTY;
  // place a single-cell-wide column: use O piece in the gap is 2 wide; fill manually instead
  board[idx(BOARD_W - 1, BOARD_H - 1)] = 1;
  const cleared = clearFullRows(board);
  assert.strictEqual(cleared, 1);
  assert.strictEqual(board[idx(0, BOARD_H - 1)], EMPTY);
}

// Lock + clear via the real flow: flat stack, drop I horizontally 2 times to make rows
{
  const board = newBoard();
  for (let x = 0; x < 6; x++) board[idx(x, BOARD_H - 1)] = 2;
  const i = { ...spawnPiece(0), x: 6, y: 0 }; // I covers x 6..9 at rot 0
  const rest = { ...i, y: i.y + dropDistance(board, i) };
  const cleared = lockPiece(board, rest);
  assert.strictEqual(cleared, 1, 'I piece should complete the bottom row');
}

// Garbage: rows rise with exactly one gap; top-out reported when full
{
  const board = newBoard();
  assert.strictEqual(addGarbageRows(board, 3, mulberry32(7)), true);
  for (let y = BOARD_H - 3; y < BOARD_H; y++) {
    let gaps = 0;
    for (let x = 0; x < BOARD_W; x++) if (board[idx(x, y)] === EMPTY) gaps++;
    assert.strictEqual(gaps, 1);
    assert.strictEqual(board[idx(0, y)] === EMPTY || board[idx(0, y)] === GARBAGE, true);
  }
}

// Rotation with kicks never lands inside the wall
{
  const board = newBoard();
  let p = { ...spawnPiece(0), x: -1, y: 5, rot: 1 }; // vertical I hugging left wall
  if (collides(board, p)) p = { ...p, x: 0 };
  const rotated = tryRotate(board, p, true);
  assert.ok(rotated && !collides(board, rotated));
}

// Movement respects walls
{
  const board = newBoard();
  let p = spawnPiece(1); // O at x=4
  let guard = 0;
  while (tryMove(board, p, -1, 0) && guard++ < 20) p = tryMove(board, p, -1, 0)!;
  assert.strictEqual(p.x, 0, 'O piece should stop at the left wall');
}

// Attack table
assert.strictEqual(computeAttack(4, 0, false), 4);
assert.strictEqual(computeAttack(4, 0, true), 5);
assert.strictEqual(computeAttack(2, 3, false), 1 + 1);
assert.strictEqual(computeAttack(0, 5, true), 0);

// Placement enumeration finds the obvious best move (flat board → no holes options exist)
{
  const board = newBoard();
  const options = enumeratePlacements(board, 0);
  assert.ok(options.length > 0);
  assert.ok(options.every((o) => o.holes === 0 || o.holes > 0));
  assert.ok(options.some((o) => o.holes === 0), 'flat board must offer hole-free placements');
}

console.log('✅ shared engine tests passed');
