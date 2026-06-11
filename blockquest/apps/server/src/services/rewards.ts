import { applyExp, tierFor, Rewards, MatchStats } from '@blockquest/shared';
import { prisma } from './../db';

export interface RewardParticipant {
  userId: string;       // empty string for NPCs
  isNpc: boolean;
  won: boolean;
  stats: MatchStats;
}

export interface MatchRecord {
  mode: 'CASUAL' | 'NPC';
  reason: string;
  durationS: number;
  a: RewardParticipant;
  b: RewardParticipant;
  npcId?: string;
}

/** Persist the match and grant EXP / coins / rank points in one transaction. */
export async function grantRewards(rec: MatchRecord): Promise<Map<string, Rewards>> {
  const out = new Map<string, Rewards>();

  await prisma.$transaction(async (tx) => {
    for (const p of [rec.a, rec.b]) {
      if (p.isNpc) continue;
      const exp = p.won ? (rec.mode === 'NPC' ? 60 : 100) : 25;
      const coins = p.won ? (rec.mode === 'NPC' ? 30 : 50) : 10;
      const rp = rec.mode === 'NPC' ? (p.won ? 5 : 0) : (p.won ? 20 : -10);

      const prof = await tx.profile.findUniqueOrThrow({ where: { userId: p.userId } });
      const rankPoints = Math.max(0, prof.rankPoints + rp);
      const leveled = applyExp(prof.level, prof.exp + exp);

      await tx.profile.update({
        where: { userId: p.userId },
        data: {
          level: leveled.level,
          exp: leveled.exp,
          coins: { increment: coins },
          rankPoints,
          rankTier: tierFor(rankPoints),
          wins: { increment: p.won ? 1 : 0 },
          losses: { increment: p.won ? 0 : 1 },
          totalLines: { increment: p.stats.lines },
          bestCombo: Math.max(prof.bestCombo, p.stats.maxCombo),
        },
      });

      out.set(p.userId, {
        exp,
        coins,
        rankDelta: rankPoints - prof.rankPoints,
        leveledUp: leveled.level > prof.level,
        newLevel: leveled.level,
        newTier: tierFor(rankPoints),
      });
    }

    await tx.match.create({
      data: {
        mode: rec.mode,
        playerAId: rec.a.userId,
        playerBId: rec.b.isNpc ? null : rec.b.userId,
        npcId: rec.npcId ?? null,
        winnerId: rec.a.won ? rec.a.userId : rec.b.isNpc ? null : rec.b.userId,
        reason: rec.reason,
        durationS: rec.durationS,
        statsA: rec.a.stats as object,
        statsB: rec.b.stats as object,
      },
    });
  });

  return out;
}
