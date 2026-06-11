import { ATTACK_TABLE } from '../constants';

/** Garbage rows sent for a clear: base + combo bonus + back-to-back quad bonus. */
export function computeAttack(cleared: number, combo: number, wasBackToBack: boolean): number {
  if (cleared <= 0) return 0;
  const base = ATTACK_TABLE[Math.min(cleared, 4)];
  const comboBonus = Math.floor(Math.max(combo, 0) / 2);
  const b2bBonus = cleared === 4 && wasBackToBack ? 1 : 0;
  return base + comboBonus + b2bBonus;
}

export function scoreFor(cleared: number, combo: number): number {
  return cleared * 100 * (Math.max(combo, 0) + 1);
}
