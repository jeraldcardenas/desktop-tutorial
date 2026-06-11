# BlockQuest Online — MVP Build Plan

> Companion to [GAME_DESIGN_DOCUMENT.md](./GAME_DESIGN_DOCUMENT.md).
> Goal: a deployable vertical slice in ~8 weeks that proves the core fantasy —
> *walk a shared pixel town, meet a real player, duel them in a block battle, get rewarded.*

---

## 1. MVP Scope (locked)

**IN:**
- Guest login (one click, username only)
- Avatar creator: 5 slots (skin tone, hair style, hair color, top, bottom) with palette swaps
- **One zone:** Beginner Village (~60×60 tiles)
- Real-time multiplayer movement with name tags
- Basic filtered chat (zone-wide)
- Challenge a player → accept/decline → battle
- Server-authoritative 1v1 block puzzle battle (garbage + HP, **no class skills yet**)
- Result screen with EXP, coins, rank points
- Simple rank tiers (Rookie → Bronze → Silver thresholds)
- **One NPC** opponent ("Trainer Tobi", easy heuristic AI)
- **One shop** with ~10 coin-priced cosmetics

**OUT (deliberately):** accounts/passwords, other zones, class skills, quests, friends, guilds, spectating, ranked queue, season pass, gems, mobile controls, selfie avatars.

Everything OUT has a seam already prepared (shared event contracts, data-driven zones/NPCs/cosmetics), so adding it later is additive.

---

## 2. How the MVP Plays (user flows)

### Open-world flow
```
Visit site → "Play as Guest" → enter username → avatar creator → Spawn in
Beginner Village → arrow keys/WASD to walk → see other players moving with
names → type in chat → click a player → profile popup → [Challenge]
```

### Battle flow
```
Challenge sent → target sees modal (Accept ⚔ / Decline, 30s) → Accept →
both clients switch to BattleScene → 3-2-1 countdown → play (move, rotate,
soft/hard drop, hold) → clears send garbage + HP damage → someone tops out
or hits 0 HP → result screen (EXP bar animates, +coins, rank points) →
[Return to Town] → back in world at same position
```

### NPC flow
```
Walk to Trainer Tobi → press E → dialog: "Ready to battle?" → battle vs
server-driven AI → same result screen (smaller rewards, repeatable with
diminishing returns per day)
```

---

## 3. Technical Architecture (MVP)

```
┌────────────────────────────── Browser ──────────────────────────────┐
│  Next.js app                                                        │
│  ├─ React UI layer (login, avatar creator, HUD, chat, modals, shop) │
│  ├─ zustand stores (session, world, battle)  ←→  React + Phaser     │
│  └─ Phaser 3 canvas (WorldScene, BattleScene)                       │
│            │ REST (auth, shop, profile)   │ Socket.io (everything   │
│            ▼                              ▼  realtime)              │
└─────────────────────────────────────────────────────────────────────┘
             │                              │
┌────────────▼──────────────────────────────▼─────────────────────────┐
│  ONE Node.js server (apps/server)  — Express + Socket.io            │
│  ├─ /api/auth/guest  /api/shop/*  /api/profile/*                    │
│  ├─ ZoneRoom("beginner-village")  — movement, chat, challenges      │
│  ├─ BattleRoom(uuid) — authoritative sim @60Hz, snapshots @20Hz     │
│  ├─ NpcBrain — runs inside BattleRoom for PvE                       │
│  └─ Prisma → PostgreSQL          (Redis deferred until multi-node)  │
└──────────────────────────────────────────────────────────────────────┘
```

MVP simplification: **no Redis yet** — single process holds all room state in memory. The matchmaking/presence interfaces are written against a small `StateStore` abstraction so swapping in Redis later is mechanical.

---

## 4. Socket Event Contract (packages/shared/src/events.ts)

```ts
// ---- Client → Server ----
export interface ClientToServer {
  // world
  world_join:      (zoneId: string) => void;
  move_intent:     (p: { dir: 'up'|'down'|'left'|'right'; seq: number }) => void;
  chat_send:       (p: { text: string }) => void;
  npc_interact:    (p: { npcId: string }) => void;
  // challenges
  challenge_send:    (p: { targetUserId: string }) => void;
  challenge_respond: (p: { challengeId: string; accept: boolean }) => void;
  // battle
  battle_input: (p: { cmd: 'left'|'right'|'rot_cw'|'rot_ccw'|'soft'|'hard'|'hold' }) => void;
  battle_forfeit: () => void;
}

// ---- Server → Client ----
export interface ServerToClient {
  world_init:   (p: { self: PlayerSnapshot; players: PlayerSnapshot[];
                      npcs: NpcSnapshot[] }) => void;
  world_state:  (p: { players: PlayerSnapshot[] }) => void;       // 10 Hz
  player_joined:(p: PlayerSnapshot) => void;
  player_left:  (p: { userId: string }) => void;
  move_reject:  (p: { seq: number; pos: GridPos }) => void;
  chat_message: (p: { from: string; username: string; text: string }) => void;

  challenge_received: (p: { challengeId: string; from: ProfileCard }) => void;
  challenge_result:   (p: { challengeId: string; accepted: boolean }) => void;

  battle_start: (p: { roomId: string; opponent: ProfileCard; countdownMs: number }) => void;
  battle_state: (p: BattleSnapshot) => void;                      // 20 Hz
  battle_event: (p: { type: 'lines'|'garbage_sent'|'garbage_landed'|'combo';
                      who: 'you'|'opp'; n: number }) => void;
  battle_end:   (p: { won: boolean; stats: MatchStats; rewards: Rewards }) => void;
}
```

`PlayerSnapshot = { userId, username, pos, facing, moving, avatar: AvatarConfig, rankTier }`.

## 5. REST API Routes (MVP)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/guest` | `{ username }` → validates/uniquifies, creates User+Profile, returns JWT |
| GET | `/api/profile/me` | Full own profile (level, exp, coins, rank, avatar, inventory) |
| PUT | `/api/profile/avatar` | Save AvatarConfig (validated against owned/free parts) |
| GET | `/api/shop/items` | Catalog with prices + owned flags |
| POST | `/api/shop/buy` | `{ itemId }` → atomic balance check + grant |
| POST | `/api/inventory/equip` | `{ itemId }` → toggles equipped within slot |
| GET | `/api/leaderboard` | Top 50 by rank points (cheap to add, good demo value) |

Everything else rides the socket.

---

## 6. Key Code — selected real snippets

### 6.1 Guest auth (server)

```ts
// apps/server/src/auth/guest.ts
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';

export async function createGuest(usernameRaw: string) {
  const base = usernameRaw.trim().slice(0, 16).replace(/[^a-zA-Z0-9_]/g, '');
  if (base.length < 3) throw new HttpError(400, 'Username must be 3–16 chars');
  if (isProfane(base)) throw new HttpError(400, 'Pick a different name');

  // ensure uniqueness: Pixel, Pixel#2, Pixel#3 ...
  let username = base;
  for (let n = 2; await prisma.user.findUnique({ where: { username } }); n++)
    username = `${base}#${n}`;

  const user = await prisma.user.create({
    data: { username, isGuest: true, profile: { create: { avatar: DEFAULT_AVATAR } } },
  });
  return { token: jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '30d' }),
           user };
}

// socket handshake
io.use(async (socket, next) => {
  try {
    const { sub } = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET!) as any;
    socket.data.userId = sub;
    next();
  } catch { next(new Error('unauthorized')); }
});
```

### 6.2 ZoneRoom — movement + presence (server)

```ts
// apps/server/src/rooms/ZoneRoom.ts
import { MOVE_COOLDOWN_MS, DIR_VECTORS } from '@blockquest/shared';

export class ZoneRoom {
  players = new Map<string, ZonePlayer>();   // userId → state
  constructor(public zoneId: string, private collision: CollisionMap,
              private io: Server) {}

  join(socket: Socket, profile: Profile) {
    const p: ZonePlayer = {
      userId: profile.userId, username: profile.user.username,
      pos: { x: profile.posX, y: profile.posY }, facing: 'down',
      avatar: profile.avatar as AvatarConfig, rankTier: profile.rankTier,
      lastMoveAt: 0, inBattle: false, socket,
    };
    this.players.set(p.userId, p);
    socket.join(this.zoneId);
    socket.emit('world_init', { self: snap(p),
      players: [...this.players.values()].filter(o => o !== p).map(snap),
      npcs: ZONE_NPCS[this.zoneId] });
    socket.to(this.zoneId).emit('player_joined', snap(p));

    socket.on('move_intent', ({ dir, seq }) => this.onMove(p, dir, seq));
    socket.on('chat_send', ({ text }) => this.onChat(p, text));
    socket.on('disconnect', () => this.leave(p));
  }

  private onMove(p: ZonePlayer, dir: Direction, seq: number) {
    const now = Date.now();
    if (p.inBattle || now - p.lastMoveAt < MOVE_COOLDOWN_MS) return;
    const target = { x: p.pos.x + DIR_VECTORS[dir].x, y: p.pos.y + DIR_VECTORS[dir].y };
    if (!this.collision.walkable(target.x, target.y)) {
      p.socket.emit('move_reject', { seq, pos: p.pos });   // client snaps back
      return;
    }
    p.pos = target; p.facing = dir; p.lastMoveAt = now;
  }

  startBroadcast() {                                        // 10 Hz snapshots
    setInterval(() => {
      this.io.to(this.zoneId).emit('world_state',
        { players: [...this.players.values()].map(snap) });
    }, 100);
  }

  private onChat(p: ZonePlayer, text: string) {
    if (!rateLimiter.allow(`chat:${p.userId}`, 3, 5000)) return;  // 3 msgs / 5s
    const clean = filterProfanity(String(text).slice(0, 140));
    this.io.to(this.zoneId).emit('chat_message',
      { from: p.userId, username: p.username, text: clean });
  }
}
```

### 6.3 Shared puzzle engine core (used by server sim; client uses it only for prediction/rendering)

```ts
// packages/shared/src/engine/board.ts
export const W = 10, H = 20;
export const EMPTY = 0, GARBAGE = 8;

export type Board = Uint8Array;                  // length 200, row-major
export const idx = (x: number, y: number) => y * W + x;

export function collides(board: Board, piece: ActivePiece): boolean {
  for (const [px, py] of cellsOf(piece)) {
    if (px < 0 || px >= W || py >= H) return true;          // walls/floor
    if (py >= 0 && board[idx(px, py)] !== EMPTY) return true;
  }
  return false;
}

export function lockPiece(board: Board, piece: ActivePiece): number {
  for (const [px, py] of cellsOf(piece))
    if (py >= 0) board[idx(px, py)] = piece.kind + 1;
  return clearFullRows(board);
}

export function clearFullRows(board: Board): number {
  let cleared = 0;
  for (let y = H - 1; y >= 0; y--) {
    let full = true;
    for (let x = 0; x < W; x++) if (board[idx(x, y)] === EMPTY) { full = false; break; }
    if (full) {
      board.copyWithin(W, 0, y * W);             // shift everything above down
      board.fill(EMPTY, 0, W);
      cleared++; y++;                            // re-check same row index
    }
  }
  return cleared;
}

export function addGarbageRows(board: Board, rows: number, rng: Rng): boolean {
  for (let r = 0; r < rows; r++) {
    // top row occupied? → top-out
    for (let x = 0; x < W; x++) if (board[idx(x, 0)] !== EMPTY) return false;
    board.copyWithin(0, W);                      // shift everything up
    const gap = rng.int(W);
    for (let x = 0; x < W; x++)
      board[idx(x, H - 1)] = x === gap ? EMPTY : GARBAGE;
  }
  return true;
}

// packages/shared/src/engine/bag.ts — seeded 7-bag randomizer
export function* sevenBag(rng: Rng): Generator<PieceKind> {
  while (true) {
    const bag: PieceKind[] = [0, 1, 2, 3, 4, 5, 6];
    for (let i = bag.length - 1; i > 0; i--) {           // Fisher–Yates
      const j = rng.int(i + 1); [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    yield* bag;
  }
}
```

### 6.4 BattleRoom — the authoritative duel (server)

```ts
// apps/server/src/rooms/BattleRoom.ts
import { W, H, lockPiece, collides, addGarbageRows, sevenBag,
         ATTACK_TABLE, HP_PER_ROW, GARBAGE_DELAY_MS } from '@blockquest/shared';

export class BattleRoom {
  id = crypto.randomUUID();
  seed = crypto.getRandomValues(new Uint32Array(1))[0];
  state: 'COUNTDOWN' | 'ACTIVE' | 'FINISHED' = 'COUNTDOWN';
  p: [BattleSide, BattleSide];

  constructor(private io: Server, a: Participant, b: Participant,
              public mode: 'CASUAL' | 'NPC') {
    this.p = [this.makeSide(a, 0), this.makeSide(b, 1)];
    this.io.to(this.roomChannel).emit('battle_start',
      { roomId: this.id, countdownMs: 3000, /* opponent cards */ });
    setTimeout(() => { this.state = 'ACTIVE'; this.loop(); }, 3000);
  }

  private makeSide(part: Participant, i: number): BattleSide {
    const rng = mulberry32(this.seed ^ (i * 0x9e3779b9));   // per-player stream
    const bag = sevenBag(rng);
    return { ...part, board: new Uint8Array(W * H), bag, rng,
      queue: [bag.next().value, bag.next().value, bag.next().value],
      active: null, hold: null, holdUsed: false,
      hp: 100, score: 0, lines: 0, combo: -1, b2b: false,
      pendingGarbage: [], nextGravityAt: 0, alive: true };
  }

  onInput(userId: string, cmd: BattleCmd) {
    if (this.state !== 'ACTIVE') return;
    const side = this.sideOf(userId);
    if (!side?.alive || !apmGuard.allow(userId)) return;
    switch (cmd) {
      case 'left':  case 'right': this.tryShift(side, cmd === 'left' ? -1 : 1); break;
      case 'rot_cw': case 'rot_ccw': this.tryRotate(side, cmd === 'rot_cw'); break;
      case 'soft': this.tryFall(side); break;
      case 'hard': { while (this.tryFall(side)) {} this.lock(side); break; }
      case 'hold': this.tryHold(side); break;
    }
  }

  private lock(side: BattleSide) {
    const cleared = lockPiece(side.board, side.active!);
    side.active = null; side.holdUsed = false;
    if (cleared > 0) {
      side.combo++; side.lines += cleared;
      const b2bNow = cleared === 4;
      let attack = ATTACK_TABLE[cleared]
                 + Math.floor(Math.max(side.combo, 0) / 2)
                 + (b2bNow && side.b2b ? 1 : 0);
      side.b2b = b2bNow;
      side.score += cleared * 100 * (side.combo + 1);
      attack = this.counterPending(side, attack);           // cancel incoming first
      if (attack > 0) this.sendGarbage(this.opponent(side), attack);
    } else {
      side.combo = -1;
      this.materializeDueGarbage(side);
    }
    this.spawn(side);
  }

  private sendGarbage(target: BattleSide, rows: number) {
    target.pendingGarbage.push({ rows, landsAt: Date.now() + GARBAGE_DELAY_MS });
    target.hp = Math.max(0, target.hp - rows * HP_PER_ROW);
    this.emitEvent('garbage_sent', target, rows);
    if (target.hp === 0) this.finish(this.opponent(target));
  }

  private materializeDueGarbage(side: BattleSide) {
    const due = side.pendingGarbage.filter(g => g.landsAt <= Date.now());
    side.pendingGarbage = side.pendingGarbage.filter(g => g.landsAt > Date.now());
    for (const g of due)
      if (!addGarbageRows(side.board, g.rows, side.rng)) return this.topOut(side);
  }

  private spawn(side: BattleSide) {
    side.queue.push(side.bag.next().value);
    side.active = spawnPiece(side.queue.shift()!);
    if (collides(side.board, side.active)) this.topOut(side);
  }

  private loop() {
    const tick = setInterval(() => {
      if (this.state !== 'ACTIVE') return clearInterval(tick);
      const now = Date.now();
      for (const side of this.p) {
        if (!side.alive) continue;
        if (!side.active) this.spawn(side);
        if (now >= side.nextGravityAt) {
          if (!this.tryFall(side)) this.lock(side);
          side.nextGravityAt = now + gravityMs(this.elapsed());
        }
      }
      if (now % 50 < 16) this.broadcastSnapshots();          // ~20 Hz
      if (this.elapsed() > MATCH_TIME_MS) this.finishByScore();
    }, 16);
  }

  private async finish(winner: BattleSide) {
    this.state = 'FINISHED';
    const rewards = await grantRewards(this.p, winner, this.mode);  // Prisma tx
    for (const side of this.p)
      side.emit('battle_end', { won: side === winner,
        stats: statsOf(side), rewards: rewards[side.userId] });
  }
}
```

### 6.5 Rewards + rank (server)

```ts
// apps/server/src/services/rewards.ts
const RANK_THRESHOLDS = [
  { tier: 'ROOKIE', min: 0 }, { tier: 'BRONZE', min: 100 }, { tier: 'SILVER', min: 300 },
];
export const tierFor = (pts: number) =>
  [...RANK_THRESHOLDS].reverse().find(r => pts >= r.min)!.tier;

export async function grantRewards(sides, winner, mode) {
  return prisma.$transaction(async (tx) => {
    const out = {};
    for (const s of sides.filter(s => !s.isNpc)) {
      const won = s === winner;
      const exp   = won ? (mode === 'NPC' ? 60 : 100) : 25;
      const coins = won ? (mode === 'NPC' ? 30 : 50)  : 10;
      const rp    = mode === 'NPC' ? (won ? 5 : 0) : (won ? 20 : -10);
      const prof = await tx.profile.findUniqueOrThrow({ where: { userId: s.userId } });
      const rankPoints = Math.max(0, prof.rankPoints + rp);
      const { level, exp: newExp } = applyExp(prof.level, prof.exp + exp);
      await tx.profile.update({ where: { userId: s.userId },
        data: { level, exp: newExp, coins: { increment: coins },
                rankPoints, rankTier: tierFor(rankPoints),
                wins: { increment: won ? 1 : 0 }, losses: { increment: won ? 0 : 1 },
                totalLines: { increment: s.lines } } });
      out[s.userId] = { exp, coins, rankDelta: rp, leveledUp: level > prof.level,
                        newTier: tierFor(rankPoints) };
    }
    await tx.match.create({ data: { /* mode, players, winner, stats */ } });
    return out;
  });
}
```

### 6.6 NPC brain (server, runs inside BattleRoom)

```ts
// apps/server/src/game/ai/npcBrain.ts
// Every `thinkInterval` ms: enumerate all (rotation, column) placements for the
// active piece, score each resulting board, take the best — with deliberate error.
export class NpcBrain {
  constructor(private cfg: { thinkMs: number; errorRate: number }) {}

  decide(board: Board, piece: ActivePiece): Placement {
    const options = enumeratePlacements(board, piece);
    options.sort((a, b) => this.score(b) - this.score(a));
    // difficulty knob: sometimes pick the 2nd/3rd best on purpose
    const pick = Math.random() < this.cfg.errorRate
      ? Math.min(1 + Math.floor(Math.random() * 2), options.length - 1) : 0;
    return options[pick];
  }

  private score(o: PlacementOutcome): number {
    return  3.5 * o.linesCleared
          - 0.7 * o.aggregateHeight
          - 4.0 * o.holes          // covered empty cells — the classic killer
          - 0.3 * o.bumpiness;     // surface jaggedness
  }
}
// "Trainer Tobi" (MVP): { thinkMs: 1100, errorRate: 0.25 } — beatable by anyone
// who has played falling-block games for an hour.
```

### 6.7 Client — Phaser WorldScene with remote-player interpolation

```ts
// apps/web/src/game/scenes/WorldScene.ts
export class WorldScene extends Phaser.Scene {
  remotes = new Map<string, RemotePlayer>();

  create() {
    const map = this.make.tilemap({ key: 'beginner-village' });
    const tiles = map.addTilesetImage('village-tiles');
    map.createLayer('ground', tiles);
    const walls = map.createLayer('walls', tiles);
    walls.setCollisionByProperty({ collides: true });

    this.player = new LocalPlayer(this, store.session.avatar);
    this.cameras.main.startFollow(this.player.sprite).setZoom(3);

    socket.on('world_state', ({ players }) => {
      for (const snap of players) {
        if (snap.userId === store.session.userId) continue;
        const rp = this.remotes.get(snap.userId) ?? this.spawnRemote(snap);
        rp.pushSnapshot(snap);                 // buffered, rendered 100ms behind
      }
    });
    socket.on('player_left', ({ userId }) =>
      { this.remotes.get(userId)?.destroy(); this.remotes.delete(userId); });
    socket.on('move_reject', ({ pos }) => this.player.snapTo(pos));
  }

  update(_t: number, dt: number) {
    this.player.handleInput(this.cursors, socket);  // optimistic move + intent
    for (const rp of this.remotes.values()) rp.interpolate(dt);
  }
}

// RemotePlayer.interpolate: lerp between the two snapshots straddling
// (now - 100ms); flip walk animation on while distance > epsilon.
// Name tag = Phaser bitmap text pinned above the composited avatar sprite.
```

### 6.8 Client — layered avatar compositing (the "looks like 50 players, costs 1 sprite" trick)

```ts
// apps/web/src/game/systems/avatarRenderer.ts
const LAYERS = ['body', 'bottom', 'shoes', 'top', 'eyes', 'hair'] as const;

export function buildAvatarTexture(scene: Phaser.Scene, cfg: AvatarConfig): string {
  const key = `avatar:${hash(cfg)}`;
  if (scene.textures.exists(key)) return key;       // cache hit — shared look

  const rt = scene.make.renderTexture(
    { width: SHEET_W, height: SHEET_H }, false);     // full anim sheet
  for (const layer of LAYERS) {
    const part = cfg[layer]; if (!part) continue;
    const img = recolor(scene, `part:${layer}:${part.id}`, part.color);
    rt.draw(img, 0, 0);                              // sheets share frame grid
  }
  rt.saveTexture(key);
  registerAnimations(scene, key);                    // idle/walk × 4 directions
  return key;
}
// recolor(): palette-index swap on a canvas copy — one grayscale-indexed
// hair sheet becomes any hair color for free.
```

### 6.9 React ↔ Phaser bridge (Next.js)

```tsx
// apps/web/src/app/play/page.tsx
'use client';
export default function PlayPage() {
  const phase = useUiStore(s => s.phase);   // 'world' | 'battle' | 'result'
  return (
    <div className="relative h-screen">
      <PhaserMount />                        {/* mounts once; scenes switch internally */}
      <HudOverlay />                         {/* coins, level, rank badge, minimap */}
      <ChatBox />
      <ChallengeModal />                     {/* listens to challenge_received */}
      {phase === 'battle' && <BattleHud />}  {/* HP bars, hold/next, combo flare */}
      {phase === 'result' && <ResultScreen />}
    </div>
  );
}

// PhaserMount: useEffect(() => { game = new Phaser.Game(config); return
// () => game.destroy(true); }, []) — Phaser never re-renders with React.
// The two worlds talk ONLY through the zustand stores + the socket singleton.
```

---

## 7. Build Order (step-by-step, 8 weeks)

**Week 1 — Skeleton.**
1. `npm init -w apps/web -w apps/server -w packages/shared` monorepo; TS everywhere.
2. Prisma schema (§13 of GDD, trimmed to User/Profile/CosmeticItem/InventoryItem/Match) + seed script (10 cosmetics, Trainer Tobi, village map metadata).
3. `/api/auth/guest` + JWT; Next.js landing page with guest-login form.
4. Phaser boots inside Next: tilemap renders (use a CC0 tileset like Kenney's as placeholder), local character walks with collision. *Checkpoint: single-player walking in the village.*

**Week 2 — Multiplayer presence.**
5. Socket.io server with JWT handshake; ZoneRoom with join/leave/move/snapshot (§6.2).
6. Client net layer: optimistic movement + interpolation buffer (§6.7); name tags.
7. Position checkpointing to Postgres every 30 s + on disconnect. *Checkpoint: two browser windows see each other walk.*

**Week 3 — Identity.**
8. Avatar parts pipeline: 1 body sheet × 4 skin tones, 4 hairstyles (palette-swappable), 3 tops, 3 bottoms.
9. Avatar creator screen (React, with live Phaser preview scene); save via `PUT /api/profile/avatar`.
10. `buildAvatarTexture` compositing (§6.8); avatars appear in world. *Checkpoint: players look different and recognizable.*

**Week 4 — The puzzle engine.**
11. `packages/shared/engine`: board, pieces, kicks, 7-bag, scoring — **with deterministic unit tests** (replay a scripted input sequence, assert final board hash).
12. Client BattleScene rendering a local single-player game (keyboard, hold, next×3, ghost piece). *Checkpoint: the puzzle game is fun on its own.*

**Week 5 — PvP.**
13. Challenge flow over ZoneRoom (send/receive/accept/expire).
14. BattleRoom (§6.4): authoritative sim, input commands, 20 Hz snapshots, garbage + HP, win conditions.
15. Client renders *both* boards from server snapshots (local board may predict; server wins conflicts). *Checkpoint: two humans complete a full duel.*

**Week 6 — Stakes.**
16. Rewards transaction (§6.5), Match persistence, result screen with animated EXP bar and rank-delta.
17. Rank tiers + rank badge on name tags and profile popup. *Checkpoint: winning feels good.*

**Week 7 — World life.**
18. Trainer Tobi NPC: sprite in world, E-to-interact dialog, NpcBrain battles (§6.6).
19. Shop: catalog API, buy/equip, shopkeeper NPC opens the React shop modal.
20. Chat with profanity filter + rate limit; player profile popup with [Challenge]. *Checkpoint: the full MVP loop works end-to-end.*

**Week 8 — Ship.**
21. Disconnect handling (battle forfeit after 15 s grace; world session cleanup), error toasts, reconnect.
22. Deploy: Vercel (web) + Railway (server + Postgres); WSS; CORS allowlist.
23. Closed playtest with ~20 players; instrument: battles/session, session length, challenge-accept rate.

---

## 8. MVP Success Criteria

- A new visitor reaches the world in **< 60 seconds** from first page load.
- Two strangers can find each other and finish a duel with **no instructions**.
- Battle feels responsive at 150 ms RTT (input → visible result < 100 ms locally via prediction).
- ≥ 30% of playtesters play a second session unprompted — that's the signal this is a real game, not a demo.

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Server-authoritative battle feels laggy | Client-side prediction for *your own* board + server reconciliation; opponent board is display-only so latency there is invisible |
| Pixel-art production becomes the bottleneck | CC0 placeholder packs for world/tiles; hand-make ONLY avatar parts (small 16×24 sheets); commission art after the loop is proven |
| Empty-world problem at low CCU | Trainer Tobi is always available; show live player count; later: NPC ambient walkers + "ping a friend" share link |
| Scope creep (it's an MMO…) | The OUT list in §1 is a contract. Every cut feature already has its seam. |

---

*This plan is deliberately boring where it can be (Express, Socket.io, Postgres) and clever only where it must be (shared deterministic engine, composited avatars, authoritative battles). That's how an MVP ships.*
