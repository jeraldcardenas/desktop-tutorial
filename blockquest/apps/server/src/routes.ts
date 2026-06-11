import { Router, type Response } from 'express';
import { AVATAR_OPTIONS, AvatarConfig, ShopItem } from '@blockquest/shared';
import { prisma } from './db';
import { createGuest, authRequired, AuthedRequest, HttpError } from './auth';

/** Creator indices below these counts are free; higher values need an owned shop item. */
const FREE_COUNTS: Record<keyof AvatarConfig, number> = {
  skin: 4,
  hair: 2,
  hairColor: 4,
  top: 3,
  bottom: 3,
};

export const router = Router();

const fail = (res: Response, err: unknown) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'internal error' });
};

router.post('/auth/guest', async (req, res) => {
  try {
    const { token, user } = await createGuest(req.body?.username);
    res.json({ token, user: { id: user.id, username: user.username }, profile: user.profile });
  } catch (err) {
    fail(res, err);
  }
});

router.get('/profile/me', authRequired, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { username: true } } },
    });
    if (!profile) return res.status(404).json({ error: 'not found' });
    res.json(profile);
  } catch (err) {
    fail(res, err);
  }
});

router.put('/profile/avatar', authRequired, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const input = (req.body?.avatar ?? {}) as Partial<AvatarConfig>;
    const owned = await prisma.inventoryItem.findMany({ where: { userId }, include: { item: true } });

    const avatar = {} as AvatarConfig;
    for (const slot of Object.keys(AVATAR_OPTIONS) as (keyof AvatarConfig)[]) {
      const max = AVATAR_OPTIONS[slot];
      const value = Math.min(Math.max(Number(input[slot] ?? 0) | 0, 0), max - 1);
      const isFree = value < FREE_COUNTS[slot];
      const isOwned = owned.some((o) => o.item.slot === slot && o.item.value === value);
      avatar[slot] = isFree || isOwned ? value : 0;
    }

    await prisma.profile.update({
      where: { userId },
      data: { avatar: { ...avatar } as Record<string, number> },
    });
    res.json({ avatar });
  } catch (err) {
    fail(res, err);
  }
});

router.get('/shop/items', authRequired, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const [items, owned, profile] = await Promise.all([
      prisma.cosmeticItem.findMany({ orderBy: { costCoins: 'asc' } }),
      prisma.inventoryItem.findMany({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);
    const avatar = (profile?.avatar ?? {}) as Partial<AvatarConfig>;
    const ownedIds = new Map(owned.map((o) => [o.itemId, o]));
    const out: ShopItem[] = items.map((i) => ({
      id: i.id,
      slot: i.slot as keyof AvatarConfig,
      value: i.value,
      name: i.name,
      rarity: i.rarity,
      costCoins: i.costCoins,
      owned: ownedIds.has(i.id),
      equipped: avatar[i.slot as keyof AvatarConfig] === i.value,
    }));
    res.json({ items: out, coins: profile?.coins ?? 0 });
  } catch (err) {
    fail(res, err);
  }
});

router.post('/shop/buy', authRequired, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const itemId = String(req.body?.itemId ?? '');

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.cosmeticItem.findUnique({ where: { id: itemId } });
      if (!item) throw new HttpError(404, 'No such item');
      const already = await tx.inventoryItem.findUnique({
        where: { userId_itemId: { userId, itemId } },
      });
      if (already) throw new HttpError(400, 'Already owned');
      const profile = await tx.profile.findUniqueOrThrow({ where: { userId } });
      if (profile.coins < item.costCoins) throw new HttpError(400, 'Not enough coins');
      await tx.profile.update({ where: { userId }, data: { coins: { decrement: item.costCoins } } });
      await tx.inventoryItem.create({ data: { userId, itemId } });
      return { coins: profile.coins - item.costCoins };
    });

    res.json(result);
  } catch (err) {
    fail(res, err);
  }
});

router.post('/inventory/equip', authRequired, async (req, res) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const itemId = String(req.body?.itemId ?? '');
    const inv = await prisma.inventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId } },
      include: { item: true },
    });
    if (!inv) throw new HttpError(400, 'You do not own this item');

    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
    const avatar = { ...(profile.avatar as unknown as AvatarConfig) };
    avatar[inv.item.slot as keyof AvatarConfig] = inv.item.value;
    await prisma.profile.update({ where: { userId }, data: { avatar } });
    res.json({ avatar });
  } catch (err) {
    fail(res, err);
  }
});

router.get('/leaderboard', async (_req, res) => {
  try {
    const top = await prisma.profile.findMany({
      orderBy: { rankPoints: 'desc' },
      take: 50,
      include: { user: { select: { username: true } } },
    });
    res.json({
      entries: top.map((p, i) => ({
        rank: i + 1,
        username: p.user.username,
        level: p.level,
        rankTier: p.rankTier,
        rankPoints: p.rankPoints,
        wins: p.wins,
        losses: p.losses,
      })),
    });
  } catch (err) {
    fail(res, err);
  }
});
