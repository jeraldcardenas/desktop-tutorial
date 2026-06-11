# ⬛ BlockQuest Online — MVP

A browser MMO where you walk a pixel village, meet real players, and duel them
in falling-block puzzle battles. Original game — no Tetris branding or assets.

Design docs live in [`../docs/blockquest/`](../docs/blockquest/):
[Game Design Document](../docs/blockquest/GAME_DESIGN_DOCUMENT.md) ·
[MVP Build Plan](../docs/blockquest/MVP_BUILD_PLAN.md)

## What works in this MVP

- ✅ Guest login (username only) with JWT sessions
- ✅ Pixel avatar creator (skin / hair / hair color / top / bottom, procedural sprites — zero image assets)
- ✅ Beginner Village: procedurally generated shared tile map
- ✅ Real-time multiplayer movement with name tags (server-authoritative, optimistic client)
- ✅ Zone chat with profanity filter + rate limiting
- ✅ Click a player → profile popup → challenge → accept/decline → live 1v1
- ✅ Server-authoritative block battle: 7-bag, hold, next×3, ghost piece, combos, B2B, garbage with 2s counter window, HP damage
- ✅ NPC battle: Trainer Tobi (heuristic AI with tunable error rate) — press E next to him
- ✅ Result screen with EXP / coins / rank points; Rookie → Bronze → Silver tiers
- ✅ Cosmetic shop (Pixel Penny) — buy & equip with earned coins
- ✅ Leaderboard API

## Stack

| Layer | Tech |
|---|---|
| Web | Next.js 14 + Phaser 3 + zustand |
| Server | Node.js + Express + Socket.io |
| DB | PostgreSQL + Prisma |
| Shared | `@blockquest/shared` workspace — deterministic puzzle engine, event contracts, zone generator (type-checked on both ends) |

## Run it

Prereqs: Node 20+, Docker (for Postgres).

```bash
cd blockquest

# 1. database
docker compose up -d

# 2. install
npm install

# 3. configure
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local

# 4. schema + seed (shop items)
npm run db:push
npm run db:seed

# 5. run both (two terminals)
npm run dev:server   # :4000
npm run dev:web      # :3000
```

Open http://localhost:3000 in **two browser windows** to see multiplayer.
Click the other player to challenge them, or walk to Trainer Tobi and press **E**.

## Battle controls

`←/→` move · `↑`/`X` rotate · `Z` rotate ccw · `↓` soft drop · `Space` hard drop · `C` hold

## Tests

```bash
npm test   # deterministic puzzle-engine tests in packages/shared
```

## Repo layout

```
blockquest/
├─ packages/shared/   # puzzle engine, socket event types, constants, village generator
├─ apps/server/       # Express + Socket.io: ZoneRoom, BattleRoom, NPC AI, rewards, Prisma
└─ apps/web/          # Next.js + Phaser: WorldScene, BattleScene, avatar creator, HUD
```

## Architecture in one paragraph

Clients send *intents* (`move_intent`, `battle_input`), never outcomes. The
server validates movement against the shared collision map and runs the entire
puzzle simulation authoritatively (seeded 7-bag per match — clients can't peek
at upcoming pieces). Rewards are only granted by the server's match-end
transaction. Avatars are layered procedural pixel sprites composited into one
cached texture per look. The `shared` workspace keeps the engine and event
contracts identical on both ends, which is also what makes replays/spectating
cheap to add later.

## Known MVP simplifications

- No Redis yet — single server process holds room state (the interfaces are ready for it).
- Own-board rendering is server-snapshot driven (100 ms cadence) without client prediction; fine on LAN/low latency, prediction is the first polish task.
- Disconnect during battle = immediate forfeit (no grace window yet).
- Profanity filter is a small built-in list — swap in a real library before public beta.
