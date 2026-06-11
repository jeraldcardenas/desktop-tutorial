import { PieceKind } from './pieces';
import { Rng } from '../rng';

/** Seeded 7-bag randomizer: every 7 consecutive pieces contain each kind once. */
export function* sevenBag(rng: Rng): Generator<PieceKind, PieceKind, unknown> {
  while (true) {
    const bag: PieceKind[] = [0, 1, 2, 3, 4, 5, 6];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = rng.int(i + 1);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    yield* bag;
  }
}
