import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import {
  AvatarConfig, Direction, DIR_VECTORS, GridPos, PlayerSnapshot, ProfileCard,
  RankTier, ZoneMap, generateVillage, ZONE_ID,
  MOVE_COOLDOWN_MS, WORLD_SNAPSHOT_MS, CHAT_MAX_LEN,
} from '@blockquest/shared';
import { prisma } from '../db';
import { filterProfanity, rateAllow } from '../services/chatFilter';
import { BattleRoom, Participant } from './BattleRoom';
import { NPCS } from './npcBrain';

interface ZonePlayer {
  userId: string;
  username: string;
  socket: Socket;
  pos: GridPos;
  facing: Direction;
  avatar: AvatarConfig;
  card: ProfileCard;
  lastMoveAt: number;
  battle: BattleRoom | null;
}

interface Challenge {
  id: string;
  fromId: string;
  toId: string;
  timeout: ReturnType<typeof setTimeout>;
}

const CHALLENGE_TTL_MS = 30_000;

export class ZoneRoom {
  readonly zoneId = ZONE_ID;
  private map: ZoneMap = generateVillage();
  private players = new Map<string, ZonePlayer>();
  private challenges = new Map<string, Challenge>();

  constructor(private io: Server) {
    setInterval(() => this.broadcastState(), WORLD_SNAPSHOT_MS);
  }

  /** Called once per authenticated socket connection. */
  attach(socket: Socket, userId: string) {
    socket.on('world_join', () => void this.join(socket, userId));
    socket.on('move_intent', (p) => this.onMove(userId, p));
    socket.on('chat_send', (p) => this.onChat(userId, p));
    socket.on('npc_interact', (p) => void this.onNpcInteract(userId, p));
    socket.on('challenge_send', (p) => this.onChallengeSend(userId, p));
    socket.on('challenge_respond', (p) => void this.onChallengeRespond(userId, p));
    socket.on('battle_input', (p) => this.players.get(userId)?.battle?.handleInput(userId, p?.cmd));
    socket.on('battle_forfeit', () => this.players.get(userId)?.battle?.forfeit(userId));
    socket.on('disconnect', () => void this.leave(userId, socket));
  }

  private async join(socket: Socket, userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) return socket.emit('error_toast', { message: 'Profile not found' });

    const existing = this.players.get(userId);
    if (existing && existing.socket.id !== socket.id) existing.socket.disconnect(true);

    const pos = this.map.walkable(profile.posX, profile.posY)
      ? { x: profile.posX, y: profile.posY }
      : { ...this.map.spawn };

    const player: ZonePlayer = {
      userId,
      username: profile.user.username,
      socket,
      pos,
      facing: 'down',
      avatar: profile.avatar as unknown as AvatarConfig,
      card: {
        userId,
        username: profile.user.username,
        level: profile.level,
        rankTier: profile.rankTier as RankTier,
        wins: profile.wins,
        losses: profile.losses,
      },
      lastMoveAt: 0,
      battle: existing?.battle ?? null,
    };
    this.players.set(userId, player);
    socket.join(this.zoneId);

    socket.emit('world_init', {
      self: this.snap(player),
      players: [...this.players.values()].filter((p) => p.userId !== userId).map((p) => this.snap(p)),
      npcs: this.map.npcs,
    });
    socket.to(this.zoneId).emit('player_joined', this.snap(player));
  }

  private async leave(userId: string, socket: Socket) {
    const player = this.players.get(userId);
    if (!player || player.socket.id !== socket.id) return;
    player.battle?.forfeit(userId);
    this.players.delete(userId);
    this.io.to(this.zoneId).emit('player_left', { userId });
    await prisma.profile
      .update({ where: { userId }, data: { posX: player.pos.x, posY: player.pos.y } })
      .catch(() => undefined);
  }

  private onMove(userId: string, p: { dir: Direction; seq: number }) {
    const player = this.players.get(userId);
    if (!player || player.battle) return;
    const vec = DIR_VECTORS[p?.dir];
    if (!vec) return;

    const now = Date.now();
    if (now - player.lastMoveAt < MOVE_COOLDOWN_MS - 20) return; // small tolerance for jitter

    player.facing = p.dir;
    const target = { x: player.pos.x + vec.x, y: player.pos.y + vec.y };
    if (!this.map.walkable(target.x, target.y) || this.occupied(target)) {
      player.socket.emit('move_reject', { seq: p.seq, pos: player.pos });
      return;
    }
    player.pos = target;
    player.lastMoveAt = now;
  }

  private occupied(pos: GridPos): boolean {
    for (const p of this.players.values()) {
      if (p.pos.x === pos.x && p.pos.y === pos.y) return true;
    }
    return false;
  }

  private onChat(userId: string, p: { text: string }) {
    const player = this.players.get(userId);
    if (!player) return;
    if (!rateAllow(`chat:${userId}`, 3, 5000)) {
      return player.socket.emit('error_toast', { message: 'Slow down a little!' });
    }
    const text = filterProfanity(String(p?.text ?? '').slice(0, CHAT_MAX_LEN).trim());
    if (!text) return;
    this.io.to(this.zoneId).emit('chat_message', { from: userId, username: player.username, text });
  }

  private async onNpcInteract(userId: string, p: { npcId: string }) {
    const player = this.players.get(userId);
    const npc = this.map.npcs.find((n) => n.id === p?.npcId);
    if (!player || !npc || player.battle) return;
    const dist = Math.abs(player.pos.x - npc.pos.x) + Math.abs(player.pos.y - npc.pos.y);
    if (dist > 2) return;

    if (npc.kind === 'shopkeeper') {
      player.socket.emit('shop_open');
      return;
    }
    const cfg = NPCS[npc.id];
    if (!cfg) return;
    const npcParticipant: Participant = {
      userId: cfg.id,
      username: cfg.name,
      isNpc: true,
      socket: null,
      npcCfg: cfg,
      card: { userId: cfg.id, username: cfg.name, level: 3, rankTier: 'ROOKIE', wins: 0, losses: 0 },
    };
    this.startBattle(player, npcParticipant, 'NPC');
  }

  private onChallengeSend(userId: string, p: { targetUserId: string }) {
    const from = this.players.get(userId);
    const to = this.players.get(p?.targetUserId);
    if (!from || !to || from === to) return;
    if (from.battle || to.battle) {
      return from.socket.emit('error_toast', { message: `${to?.username ?? 'They'} can't battle right now` });
    }
    if (!rateAllow(`challenge:${userId}`, 3, 15_000)) return;

    const id = randomUUID();
    const timeout = setTimeout(() => {
      this.challenges.delete(id);
      from.socket.emit('challenge_result', { challengeId: id, accepted: false });
    }, CHALLENGE_TTL_MS);
    this.challenges.set(id, { id, fromId: userId, toId: to.userId, timeout });
    to.socket.emit('challenge_received', { challengeId: id, from: from.card });
  }

  private async onChallengeRespond(userId: string, p: { challengeId: string; accept: boolean }) {
    const ch = this.challenges.get(p?.challengeId);
    if (!ch || ch.toId !== userId) return;
    this.challenges.delete(ch.id);
    clearTimeout(ch.timeout);

    const from = this.players.get(ch.fromId);
    const to = this.players.get(ch.toId);
    from?.socket.emit('challenge_result', { challengeId: ch.id, accepted: !!p.accept });
    if (!p.accept || !from || !to || from.battle || to.battle) return;

    this.startBattle(from, this.asParticipant(to), 'CASUAL');
  }

  private asParticipant(p: ZonePlayer): Participant {
    return { userId: p.userId, username: p.username, isNpc: false, socket: p.socket, card: p.card };
  }

  private startBattle(player: ZonePlayer, opponent: Participant, mode: 'CASUAL' | 'NPC') {
    const room = new BattleRoom(this.asParticipant(player), opponent, mode, () => {
      for (const side of [player.userId, opponent.userId]) {
        const zp = this.players.get(side);
        if (zp?.battle === room) zp.battle = null;
      }
    });
    player.battle = room;
    if (!opponent.isNpc) {
      const oppPlayer = this.players.get(opponent.userId);
      if (oppPlayer) oppPlayer.battle = room;
    }
  }

  private snap(p: ZonePlayer): PlayerSnapshot {
    return {
      userId: p.userId,
      username: p.username,
      pos: p.pos,
      facing: p.facing,
      avatar: p.avatar,
      rankTier: p.card.rankTier,
      inBattle: p.battle !== null,
    };
  }

  private broadcastState() {
    if (this.players.size === 0) return;
    this.io.to(this.zoneId).emit('world_state', {
      players: [...this.players.values()].map((p) => this.snap(p)),
    });
  }
}
