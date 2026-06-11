import { randomUUID } from 'node:crypto';
import type { Socket } from 'socket.io';
import {
  Board, newBoard, collides, tryMove, tryRotate, lockPiece, addGarbageRows,
  dropDistance, spawnPiece, sevenBag, mulberry32, computeAttack, scoreFor,
  gravityMs, ActivePiece, PieceKind, BattleCmd, BattleSnapshot, BattleSideSnapshot,
  MatchStats, ProfileCard, Rng, cellsOf, idx,
  START_HP, HP_PER_ROW, GARBAGE_DELAY_MS, MATCH_TIME_MS, COUNTDOWN_MS,
  BATTLE_TICK_MS, BATTLE_SNAPSHOT_MS, BOARD_W, BOARD_H,
} from '@blockquest/shared';
import { NpcConfig, decidePlacement } from './npcBrain';
import { grantRewards } from '../services/rewards';

export interface Participant {
  userId: string; // npc id for NPCs
  username: string;
  isNpc: boolean;
  socket: Socket | null;
  card: ProfileCard;
  npcCfg?: NpcConfig;
}

interface BattleSide extends Participant {
  board: Board;
  bag: Generator<PieceKind, PieceKind, unknown>;
  rng: Rng;
  queue: PieceKind[];
  active: ActivePiece | null;
  hold: PieceKind | null;
  holdUsed: boolean;
  hp: number;
  score: number;
  lines: number;
  combo: number;
  b2b: boolean;
  maxCombo: number;
  attacksSent: number;
  pendingGarbage: { rows: number; landsAt: number }[];
  nextGravityAt: number;
  alive: boolean;
  npcThinkAt: number;
  inputTimes: number[];
}

const MAX_INPUTS_PER_SEC = 25; // generous humanly-possible cap

export class BattleRoom {
  readonly id = randomUUID();
  readonly seed = (Math.random() * 0xffffffff) >>> 0;
  state: 'COUNTDOWN' | 'ACTIVE' | 'FINISHED' = 'COUNTDOWN';
  private sides: [BattleSide, BattleSide];
  private startedAt = 0;
  private lastSnapshotAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    a: Participant,
    b: Participant,
    public mode: 'CASUAL' | 'NPC',
    private onEnd: (room: BattleRoom) => void,
  ) {
    this.sides = [this.makeSide(a, 0), this.makeSide(b, 1)];
    for (const side of this.sides) {
      const opp = this.opponent(side);
      side.socket?.emit('battle_start', {
        roomId: this.id,
        opponent: opp.card,
        countdownMs: COUNTDOWN_MS,
      });
    }
    setTimeout(() => {
      if (this.state !== 'COUNTDOWN') return;
      this.state = 'ACTIVE';
      this.startedAt = Date.now();
      for (const side of this.sides) this.spawn(side);
      this.timer = setInterval(() => this.tick(), BATTLE_TICK_MS);
    }, COUNTDOWN_MS);
  }

  private makeSide(p: Participant, i: number): BattleSide {
    const rng = mulberry32((this.seed ^ (i * 0x9e3779b9)) >>> 0);
    const bag = sevenBag(rng);
    return {
      ...p,
      board: newBoard(), bag, rng,
      queue: [bag.next().value, bag.next().value, bag.next().value],
      active: null, hold: null, holdUsed: false,
      hp: START_HP, score: 0, lines: 0, combo: -1, b2b: false,
      maxCombo: 0, attacksSent: 0,
      pendingGarbage: [], nextGravityAt: 0, alive: true,
      npcThinkAt: 0, inputTimes: [],
    };
  }

  hasPlayer(userId: string): boolean {
    return this.sides.some((s) => !s.isNpc && s.userId === userId);
  }

  private sideOf(userId: string): BattleSide | undefined {
    return this.sides.find((s) => s.userId === userId);
  }

  private opponent(side: BattleSide): BattleSide {
    return this.sides[0] === side ? this.sides[1] : this.sides[0];
  }

  private elapsed(): number {
    return this.startedAt === 0 ? 0 : Date.now() - this.startedAt;
  }

  // ---- input -------------------------------------------------------------

  handleInput(userId: string, cmd: BattleCmd) {
    if (this.state !== 'ACTIVE') return;
    const side = this.sideOf(userId);
    if (!side || !side.alive || !side.active) return;
    if (!this.apmAllow(side)) return;

    switch (cmd) {
      case 'left':
      case 'right': {
        const moved = tryMove(side.board, side.active, cmd === 'left' ? -1 : 1, 0);
        if (moved) side.active = moved;
        break;
      }
      case 'rot_cw':
      case 'rot_ccw': {
        const rotated = tryRotate(side.board, side.active, cmd === 'rot_cw');
        if (rotated) side.active = rotated;
        break;
      }
      case 'soft': {
        const moved = tryMove(side.board, side.active, 0, 1);
        if (moved) {
          side.active = moved;
          side.score += 1;
        }
        break;
      }
      case 'hard': {
        const d = dropDistance(side.board, side.active);
        side.active = { ...side.active, y: side.active.y + d };
        side.score += d * 2;
        this.lock(side);
        break;
      }
      case 'hold': {
        if (side.holdUsed) break;
        const held = side.hold;
        side.hold = side.active.kind;
        side.holdUsed = true;
        side.active = held !== null ? spawnPiece(held) : null;
        if (side.active === null) this.spawn(side);
        else if (collides(side.board, side.active)) this.topOut(side);
        break;
      }
    }
  }

  forfeit(userId: string) {
    if (this.state === 'FINISHED') return;
    const side = this.sideOf(userId);
    if (!side) return;
    this.finish(this.opponent(side), 'forfeit');
  }

  private apmAllow(side: BattleSide): boolean {
    const now = Date.now();
    side.inputTimes = side.inputTimes.filter((t) => now - t < 1000);
    if (side.inputTimes.length >= MAX_INPUTS_PER_SEC) return false;
    side.inputTimes.push(now);
    return true;
  }

  // ---- simulation --------------------------------------------------------

  private tick() {
    if (this.state !== 'ACTIVE') return;
    const now = Date.now();

    for (const side of this.sides) {
      if (!side.alive) continue;
      if (!side.active) this.spawn(side);
      if ((this.state as string) === 'FINISHED') return; // spawn may have ended the match
      if (!side.alive || !side.active) continue;

      if (side.isNpc && side.npcCfg && now >= side.npcThinkAt) {
        const target = decidePlacement(side.board, side.active.kind, side.npcCfg);
        if (target) {
          side.active = target;
          this.lock(side);
        }
        continue;
      }

      if (side.active && now >= side.nextGravityAt) {
        const moved = tryMove(side.board, side.active, 0, 1);
        if (moved) side.active = moved;
        else this.lock(side);
        side.nextGravityAt = now + gravityMs(this.elapsed());
      }
    }

    if (this.state !== 'ACTIVE') return;

    if (now - this.lastSnapshotAt >= BATTLE_SNAPSHOT_MS) {
      this.lastSnapshotAt = now;
      this.broadcastSnapshot();
    }

    if (this.elapsed() >= MATCH_TIME_MS) {
      const [a, b] = this.sides;
      this.finish(a.score >= b.score ? a : b, 'timeout');
    }
  }

  private spawn(side: BattleSide) {
    side.queue.push(side.bag.next().value);
    side.active = spawnPiece(side.queue.shift()!);
    side.holdUsed = false;
    side.nextGravityAt = Date.now() + gravityMs(this.elapsed());
    if (side.isNpc && side.npcCfg) {
      side.npcThinkAt = Date.now() + side.npcCfg.thinkMs;
    }
    if (collides(side.board, side.active)) this.topOut(side);
  }

  private lock(side: BattleSide) {
    if (!side.active) return;
    const cleared = lockPiece(side.board, side.active);
    side.active = null;

    if (cleared > 0) {
      side.combo++;
      side.maxCombo = Math.max(side.maxCombo, side.combo);
      side.lines += cleared;
      side.score += scoreFor(cleared, side.combo);
      let attack = computeAttack(cleared, side.combo, side.b2b);
      side.b2b = cleared === 4;
      attack = this.counterPending(side, attack);
      if (attack > 0) this.sendGarbage(side, this.opponent(side), attack);
    } else {
      side.combo = -1;
      this.materializeDueGarbage(side);
    }

    if (this.state === 'ACTIVE' && side.alive) this.spawn(side);
  }

  /** Outgoing attack first cancels your own incoming garbage. */
  private counterPending(side: BattleSide, attack: number): number {
    while (attack > 0 && side.pendingGarbage.length > 0) {
      const head = side.pendingGarbage[0];
      const cancel = Math.min(attack, head.rows);
      head.rows -= cancel;
      attack -= cancel;
      if (head.rows === 0) side.pendingGarbage.shift();
    }
    return attack;
  }

  private sendGarbage(from: BattleSide, target: BattleSide, rows: number) {
    from.attacksSent += rows;
    target.pendingGarbage.push({ rows, landsAt: Date.now() + GARBAGE_DELAY_MS });
    target.hp = Math.max(0, target.hp - rows * HP_PER_ROW);
    if (target.hp === 0) this.finish(from, 'hp');
  }

  private materializeDueGarbage(side: BattleSide) {
    const now = Date.now();
    const due = side.pendingGarbage.filter((g) => g.landsAt <= now);
    side.pendingGarbage = side.pendingGarbage.filter((g) => g.landsAt > now);
    for (const g of due) {
      if (!addGarbageRows(side.board, g.rows, side.rng)) {
        this.topOut(side);
        return;
      }
    }
  }

  private topOut(side: BattleSide) {
    side.alive = false;
    side.active = null;
    if (this.state !== 'FINISHED') this.finish(this.opponent(side), 'topout');
  }

  // ---- output ------------------------------------------------------------

  private snapshotSide(side: BattleSide): BattleSideSnapshot {
    const board = Array.from(side.board);
    let ghostY: number | null = null;
    if (side.active) {
      ghostY = side.active.y + dropDistance(side.board, side.active);
      for (const [x, y] of cellsOf(side.active)) {
        if (y >= 0 && x >= 0 && x < BOARD_W && y < BOARD_H) board[idx(x, y)] = side.active.kind + 1;
      }
    }
    return {
      userId: side.userId,
      username: side.username,
      board,
      active: side.active,
      ghostY,
      hold: side.hold,
      queue: [...side.queue],
      hp: side.hp,
      score: side.score,
      lines: side.lines,
      combo: side.combo,
      pendingGarbage: side.pendingGarbage.reduce((a, g) => a + g.rows, 0),
      alive: side.alive,
    };
  }

  private broadcastSnapshot() {
    const snap: BattleSnapshot = {
      roomId: this.id,
      elapsedMs: this.elapsed(),
      sides: [this.snapshotSide(this.sides[0]), this.snapshotSide(this.sides[1])],
    };
    for (const side of this.sides) side.socket?.emit('battle_state', snap);
  }

  private statsOf(side: BattleSide): MatchStats {
    return { lines: side.lines, maxCombo: Math.max(side.maxCombo, 0), attacksSent: side.attacksSent, score: side.score };
  }

  private async finish(winner: BattleSide, reason: string) {
    if (this.state === 'FINISHED') return;
    this.state = 'FINISHED';
    if (this.timer) clearInterval(this.timer);
    this.broadcastSnapshot();

    const [a, b] = this.sides;
    const durationS = Math.round(this.elapsed() / 1000);

    let rewards = new Map<string, import('@blockquest/shared').Rewards>();
    try {
      rewards = await grantRewards({
        mode: this.mode,
        reason,
        durationS,
        npcId: this.sides.find((s) => s.isNpc)?.userId,
        a: { userId: a.userId, isNpc: a.isNpc, won: winner === a, stats: this.statsOf(a) },
        b: { userId: b.userId, isNpc: b.isNpc, won: winner === b, stats: this.statsOf(b) },
      });
    } catch (err) {
      console.error('reward persistence failed', err);
    }

    for (const side of this.sides) {
      side.socket?.emit('battle_end', {
        won: winner === side,
        reason,
        stats: this.statsOf(side),
        rewards: rewards.get(side.userId) ?? null,
      });
    }
    this.onEnd(this);
  }
}
