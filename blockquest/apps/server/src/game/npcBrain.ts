import { Board, PieceKind, ActivePiece, enumeratePlacements, PlacementOutcome } from '@blockquest/shared';

export interface NpcConfig {
  id: string;
  name: string;
  /** Delay before the NPC "decides" each piece — its APM ceiling. */
  thinkMs: number;
  /** Chance to deliberately pick the 2nd/3rd best placement. */
  errorRate: number;
}

export const NPCS: Record<string, NpcConfig> = {
  tobi: { id: 'tobi', name: 'Trainer Tobi', thinkMs: 1100, errorRate: 0.25 },
};

/**
 * Classic heuristic stacker: enumerate every (rotation, column) placement,
 * score the resulting board, pick the best — with deliberate mistakes as
 * the difficulty dial.
 */
export function decidePlacement(board: Board, kind: PieceKind, cfg: NpcConfig): ActivePiece | null {
  const options = enumeratePlacements(board, kind);
  if (options.length === 0) return null;
  options.sort((a, b) => score(b) - score(a));
  const pick = Math.random() < cfg.errorRate
    ? Math.min(1 + Math.floor(Math.random() * 2), options.length - 1)
    : 0;
  return options[pick].piece;
}

function score(o: PlacementOutcome): number {
  return 3.5 * o.linesCleared
    - 0.7 * o.aggregateHeight
    - 4.0 * o.holes      // covered empty cells — the classic stack-killer
    - 0.3 * o.bumpiness; // surface jaggedness
}
