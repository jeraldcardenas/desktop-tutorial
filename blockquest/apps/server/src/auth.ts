import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_AVATAR } from '@blockquest/shared';
import { prisma } from './db';
import { isProfane } from './services/chatFilter';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function createGuest(usernameRaw: unknown) {
  const base = String(usernameRaw ?? '').trim().slice(0, 16).replace(/[^a-zA-Z0-9_]/g, '');
  if (base.length < 3) throw new HttpError(400, 'Username must be 3-16 letters, numbers or _');
  if (isProfane(base)) throw new HttpError(400, 'Please pick a different name');

  // ensure uniqueness: Pixel, Pixel_2, Pixel_3 ...
  let username = base;
  for (let n = 2; await prisma.user.findUnique({ where: { username } }); n++) {
    username = `${base}_${n}`;
  }

  const user = await prisma.user.create({
    data: {
      username,
      isGuest: true,
      profile: { create: { avatar: { ...DEFAULT_AVATAR } as Record<string, number> } },
    },
    include: { profile: true },
  });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
  return { token, user };
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
  return payload.sub;
}

export interface AuthedRequest extends Request {
  userId: string;
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  try {
    (req as AuthedRequest).userId = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
