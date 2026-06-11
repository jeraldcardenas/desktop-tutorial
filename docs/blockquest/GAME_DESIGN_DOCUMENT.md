# BlockQuest Online — Game Design Document

> **Version:** 0.1 (Concept / Pre-production)
> **Genre:** Multiplayer Block-Puzzle Battle RPG
> **Platform:** Browser (desktop first, mobile-friendly later)
> **Status:** Original IP. Inspired by falling-block mechanics as a genre — **no Tetris branding, names, assets, sounds, or trade dress are used.** All pieces, terminology ("Quads", "Bricks", "Lines"), art, and music are original.

---

## 1. Game Summary

**BlockQuest Online** is a persistent pixel-art world where the *combat system is a competitive falling-block puzzle*. Think of a cozy retro MMO town — players walk around, chat, take quests, shop for cosmetics — but when two characters lock eyes and one throws down a challenge, the screen splits into dueling puzzle boards. Clearing lines deals damage. Combos send garbage. RPG class skills bend the rules.

**The elevator pitch:** *"A pixel MMO overworld where every fight is a block-puzzle duel. Walk like Pokémon, fight like an arcade puzzle league, progress like an RPG."*

**Why it works:**
- Falling-block puzzle skill curves are infinitely deep and instantly understandable.
- The MMO overworld gives *context, stakes, and social glue* to every match — you're not queuing into a void, you're defending your rank in Neon Arcade City.
- Cosmetic-only monetization + browser access = frictionless viral loop ("click this link, you're in the world in 10 seconds").

---

## 2. Core Gameplay Loop

```
 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │   EXPLORE ──► ENCOUNTER ──► BATTLE ──► REWARD ──► GROW   │
 │      ▲                                              │    │
 │      └──────────────────────────────────────────────┘    │
 └──────────────────────────────────────────────────────────┘
```

1. **Log in** (guest or account) → spawn in Beginner Village.
2. **Create / customize** a layered pixel avatar.
3. **Explore** the open world; see real players moving live with usernames overhead.
4. **Interact** with NPCs, quest boards, shops, warp gates, other players.
5. **Challenge** an NPC or player (or accept an incoming challenge / join a queue).
6. **Battle** on a dedicated puzzle screen: clear lines, build combos, send garbage, fire class skills.
7. **Win** → EXP, coins, rank points, loot, quest progress, cosmetic unlocks.
8. **Return** to the world and keep climbing toward higher-rank zones.

**Session loop targets:** a battle lasts 2–5 minutes; a "snack session" is 1–3 battles (10–15 min); zone unlocks and quests provide the multi-week meta loop.

---

## 3. Main Features

| Pillar | Features |
|---|---|
| **World** | 7 themed zones, warp gates, hidden items, day/night tint, ambient NPCs |
| **Multiplayer** | Real-time movement, name tags, filtered chat, challenges, spectating, parties, guilds |
| **Battle** | Falling-block duels, garbage attacks, HP system, class skills, combo/B2B scoring |
| **RPG** | Levels, EXP, 5 classes with separate class levels, quests, achievements, inventory |
| **Competitive** | 9-tier ranked ladder, seasonal resets, leaderboards, tournaments, spectator arenas |
| **Identity** | Layered pixel avatar builder (15+ slots), unlockable cosmetics, emotes, profile cards |
| **Economy** | Coins (earned), Gems (premium, cosmetic-only), shops, season pass |

---

## 4. Open World Map Design

The world is a connected continent of tile-based zones (each zone ≈ 60×60 to 100×100 tiles of 16×16 px, rendered at 2–3× scale). Zones connect via **warp gates** that check the player's level/rank server-side.

### Zone Catalog

| # | Zone | Unlock | Theme & Identity | Music Direction | NPC Difficulty |
|---|---|---|---|---|---|
| 1 | **Beginner Village** | None | Warm grass-and-cobble starter town. Tutorial NPCs, basic shop, quest board, training dummy battles. Fountain plaza is the social hub. | Cheerful chiptune waltz, 90 BPM | ★ (drop speed 1, no skills) |
| 2 | **Brickwood Forest** | Level 5 | Mossy woods, brick ruins, puzzle trainers hiding behind trees, hidden coin caches in stumps. | Folky chiptune with flute lead | ★★ (slow garbage NPCs) |
| 3 | **Neon Arcade City** | Bronze | Synthwave city at night. Arcade cabinets (minigame flavor), the first true **PvP Arena**, cosmetic mega-shop, ranked queue terminals. | Synthwave / chip-fusion, 120 BPM | ★★★ (combo-focused NPCs) |
| 4 | **Lava Block Cavern** | Silver | Obsidian dungeon, glowing magma seams, faster battles, **Lava Boss** chamber. | Driving chip-metal, low drones | ★★★★ (high speed + burn modifier) |
| 5 | **Frost Grid Kingdom** | Gold | Ice castle, slippery tiles (movement slides 1 extra tile), elite trainers, **Ice Queen** boss. | Crystalline arps, music-box motif | ★★★★ (slippery battle modifier) |
| 6 | **Skyline Puzzle Arena** | Platinum | Floating sky colosseum. Center stage is a spectator arena — ongoing ranked finals visible as live boards on giant screens. | Orchestral chiptune, anthemic | ★★★★★ (tournament-grade AI) |
| 7 | **Dark Matrix Realm** | Diamond | Corrupted digital void, glitch shaders, **Glitch King** raid boss, mythic cosmetics, end-of-season tournament gate. | Distorted breakbeat chiptune | ★★★★★+ (modifier stacking bosses) |

### Every zone contains
- **NPC opponents** (3–8) with visible difficulty stars and battle archetypes
- **Quest givers** (2–4) feeding the zone's quest chain
- **A shop** with zone-exclusive cosmetics
- **Warp gate(s)** with rank/level checks
- **Hidden items** (sparkle tiles — coins, cosmetic shards, lore notes)
- **A PvP challenge area** (challenges anywhere, but arenas grant +10% rank points and enable spectating)

### World rules
- Movement is grid-based with smooth interpolation (Pokémon-style feel, 4-direction).
- Collision and zone-entry checks are **server-authoritative**.
- Each zone is a separate server "room" — natural sharding boundary (see §5).

---

## 5. Multiplayer Server Design

### Topology

```
                        ┌─────────────────────┐
        HTTPS/REST      │   Next.js Frontend  │
   ┌───────────────────►│  (React UI + Phaser │
   │                    │   3 game canvas)    │
   │                    └─────────┬───────────┘
   │                              │ WebSocket (Socket.io)
   ▼                              ▼
┌──────────────┐        ┌─────────────────────┐       ┌─────────┐
│  API Server  │        │  Realtime Gateway    │◄─────►│  Redis  │
│ (Next API /  │        │  (Node + Socket.io)  │       │ pub/sub │
│  Express)    │        │  • Zone rooms        │       │ presence│
│  auth, shop, │        │  • Battle rooms      │       │ matchmk │
│  profile,    │        │  • Matchmaker        │       └─────────┘
│  leaderboard │        └─────────┬───────────┘
└──────┬───────┘                  │
       │              ┌───────────┴───────────┐
       ▼              ▼                       ▼
┌─────────────────────────────┐    (scale-out: more gateway
│   PostgreSQL  (via Prisma)  │     nodes, rooms assigned via
│ users, profiles, inventory, │     Redis; battles are
│ matches, quests, ranks      │     self-contained rooms)
└─────────────────────────────┘
```

### Room model
- **Zone rooms** (`zone:beginner-village`): broadcast player positions, chat, emotes, challenge requests. 10–20 Hz state sync, interest-managed (only nearby players if a zone gets crowded).
- **Battle rooms** (`battle:<uuid>`): 2 players + spectators. Authoritative puzzle simulation runs **on the server**; clients send inputs, server broadcasts board states.
- **Matchmaker**: Redis sorted-set queue keyed by rank points; pairs players within a widening rating window.

### Scaling path
1. **MVP:** one Node process = API + gateway + all rooms. Fine for hundreds of CCU.
2. **Stage 2:** split gateway from API; Redis adapter for Socket.io so multiple gateway nodes share rooms.
3. **Stage 3:** dedicate battle servers (battles are stateless after the match record is written — easiest thing to horizontally scale). Or migrate rooms to **Colyseus**, which has this room/process model built in.

### Tick rates & sync
- Overworld: client sends intent (`move:up`) → server validates against collision map → broadcasts position at 10 Hz; clients interpolate.
- Battle: server ticks gravity at the level's drop rate; inputs are commands (`rotate_cw`, `hard_drop`) validated against the authoritative board.

---

## 6. Battle System Design

### Screen layout

```
┌────────────────────────────────────────────────────────────┐
│  ⏱ 2:41        COMBO ×4        👁 12 spectators            │
│ ┌──────────┐                              ┌──────────┐     │
│ │ 🧑 Pixel  │ HP ████████░░ 80            │ 🤖 Rival  │ 75  │
│ ├──────────┤  ┌────┐                      ├──────────┤     │
│ │          │  │HOLD│   NEXT ▣ ▣ ▣         │ (mirror   │    │
│ │  YOUR    │  └────┘                      │  of foe   │    │
│ │  BOARD   │  GARBAGE METER ▓▓▓░░         │  board)   │    │
│ │ 10 × 20  │  SKILL [Shield Wall ⏳ 8s]   │           │    │
│ └──────────┘                              └──────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Puzzle mechanics (original implementation of genre-standard rules)
- 10×20 board, 7 original tetromino-shaped "Quads" with a 7-bag randomizer
- Move left/right, soft drop, hard drop, rotate CW/CCW with basic kick table
- Hold piece (once per piece), 3-piece next preview
- Line clears: 1–4 lines; 4-line clear ("**Quad Clear**") and back-to-back bonuses
- Combo counter for consecutive-piece clears
- Gravity speed increases on a level curve over match time
- **Garbage**: attacks insert gray rows with one random gap at the opponent's board bottom; incoming garbage sits in a meter for 2 s and can be **countered** by your own clears before it lands

### Damage model (HP + board pressure hybrid)

| Action | Attack power |
|---|---|
| Single | 0 |
| Double | 1 |
| Triple | 2 |
| Quad Clear | 4 |
| Back-to-back Quad | +1 |
| Combo | +⌊combo/2⌋ |
| Perfect clear | 8 |

- Attack power converts to **garbage rows** sent AND **HP damage** (1 row = 4 HP). Players start at 100 HP.
- **Win conditions:** opponent tops out, opponent HP ≤ 0, or timer (5 min) expires → higher score wins.

### RPG class skills

Skills charge by clearing lines (not by time alone), have cooldowns, and are **utility-leaning, not damage-leaning** to protect competitive integrity.

| Class | Skill | Effect | Charge / Cooldown |
|---|---|---|---|
| **Block Warrior** | Shield Wall | Incoming garbage −50% for 5 s | 8 lines / 20 s |
| **Combo Mage** | Arcane Clear | After a 3+ combo, clears 1 random garbage row on your board | 6 lines / 15 s |
| **Speed Rogue** | Quick Drop | +40% handling (move/rotate/drop speed) for 6 s | 6 lines / 15 s |
| **Grid Healer** | Repair Field | Removes 1 garbage row every 2 s, ×3 ticks; heals 6 HP | 8 lines / 20 s |
| **Chaos Summoner** | Glitch Storm | Next garbage you send uses a scattered multi-gap pattern (harder to downstack) | 8 lines / 20 s |

**Balance rules:** skills never directly top-out an opponent; ranked normalizes skill numbers per season; class level adds *options* (alt skills), never raw stats in PvP.

---

## 7. RPG Progression System

**Player profile holds:** Level (1–100), EXP, Coins, Gems, Rank + rank points, Class + per-class levels, Inventory, Equipped cosmetics, Achievements, Quest progress.

- **EXP sources:** battles (win 100 / lose 25, scaled by opponent difficulty), quests, daily challenge, first-win-of-day bonus.
- **Level gates:** zones (lvl 5 → Brickwood), cosmetic unlock tracks, class slots.
- **Class levels** rise only by battling with that class; unlock alternate skills (choose 1 active) and class-flavored cosmetics.

---

## 8. Character Customization System

### Layered sprite architecture
Each avatar = ordered stack of 16×24 px sprite layers sharing one animation skeleton (idle 2f, walk 4f ×4 directions, battle-stance, victory, defeat):

```
[back item] → [body(skin tone)] → [bottom] → [shoes] → [top] → [jacket]
→ [face/eyes] → [hair] → [accessory] → [hat/mask] → [aura(fx, additive)]
→ [pet (separate follower entity)]
```

- **Palette-swap system**: hair/clothing sprites are drawn in index colors and recolored at load → 1 sprite asset = N color variants.
- Slots: skin tone, face, hair style+color, eyes, top, jacket, bottom, shoes, accessory, hat, mask, aura, back item, pet, emote set.

### "Looks like me" avatar (post-MVP)
Player uploads a selfie → vision model extracts *attributes only* (skin tone bucket, hair color/length, glasses, etc.) → attributes map to existing avatar parts → user confirms/edits. **Privacy rule: the photo is processed in memory, never persisted, never used for training, unless the user explicitly opts in to saving it.** MVP ships the manual builder only.

### Cosmetic acquisition
Leveling rewards • ranked season rewards • coin shop • gem shop • season pass • events • tournament exclusives • hidden world items.

---

## 9. Rank & Level System

| Rank | Points | Unlocks |
|---|---|---|
| Rookie | 0 | — (start) |
| Bronze | 100 | Neon Arcade City, ranked queue, Bronze frame |
| Silver | 300 | Lava Block Cavern, board theme "Magma" |
| Gold | 600 | Frost Grid Kingdom, golden name tag |
| Platinum | 1000 | Skyline Puzzle Arena, aura "Skyspark" |
| Diamond | 1500 | Dark Matrix Realm, animated profile card |
| Master | 2200 | Master gate emote, tournament seeding |
| Mythic | 3000 | Mythic aura, exclusive pet |
| World Champion | Top 10 seasonal | Crown cosmetic + statue in Beginner Village plaza |

- Elo-like: win +15–25 / loss −10–20 based on rating gap; small rank-floor protection at each tier.
- **Seasons:** 8–10 weeks; soft reset (compress toward Silver); seasonal cosmetic track.
- Player **level** (PvE/world progression) and **rank** (PvP skill) are deliberately separate ladders.

---

## 10. Quest System

Quest types: **Tutorial chain** (battle dummy → first NPC win → equip a cosmetic), **Zone chains** (story-flavored, gate boss access), **Dailies** (3/day: "clear 30 lines", "win 2 battles"), **Weeklies**, **Achievements** (lifetime: "Clear 10,000 lines").

Sample quests: Defeat 3 Beginner Trainers • Win your first PvP battle • Clear 50 total lines • Reach Bronze Rank • Explore Brickwood Forest • Beat the Lava Boss • Join a tournament • Unlock your first rare cosmetic.

Quest progress events are emitted by the battle/world servers (`LINES_CLEARED`, `BATTLE_WON`, `ZONE_ENTERED`) and consumed by a quest-progress service — adding new quests = adding data rows, not code.

---

## 11. NPC & Boss System

### NPC battle archetypes (AI parameter presets)

| Archetype | Behavior knobs |
|---|---|
| Normal Trainer | Balanced; medium speed, occasional misdrop |
| Fast Dropper | High APM, low efficiency |
| Combo Specialist | Builds combo wells, bursty damage |
| Garbage Spammer | Frequent small attacks |
| Puzzle Master | Near-perfect stacking, slow speed |
| Boss Enemy | Archetype + **battle modifier** |
| Event NPC | Seasonal rules/rewards |

NPC AI = heuristic placement search (score surface flatness, holes, well depth) + artificial reaction delay and error rate as the difficulty dials.

### Boss modifiers
- **Lava Boss:** every 30 s, 2 random board cells become *burning blocks* — clear their row within 15 s or they sear into garbage.
- **Ice Queen:** for 3 s after each of her attacks your DAS/handling becomes slippery (movement overshoots by 1).
- **Glitch King:** occasionally scrambles your next-piece preview (the queue is honest; the *display* lies until the piece spawns).

Bosses have larger HP pools, phase changes at 50% HP, and award guaranteed cosmetic loot on first kill.

---

## 12. Monetization System

**Hard rule: cosmetic-only. Nothing sold affects gravity, garbage, skills, HP, or rank.**

| Sell ✅ | Never sell ❌ |
|---|---|
| Skins, outfits, auras, emotes, pets | Damage/EXP boosts that affect PvP |
| Battle board themes, piece styles, clear effects | Rank points |
| Profile frames, name effects | Skills or stat advantages |
| Season pass (cosmetic track) | Loot boxes with gameplay items |

Dual currency: **Coins** (earned only — keeps grind rewarding) and **Gems** (purchased — premium cosmetics). Everything gem-purchasable is previewable on your own avatar before buying.

---

## 13. Database Schema (PostgreSQL via Prisma)

```prisma
// schema.prisma — core models

model User {
  id            String    @id @default(cuid())
  username      String    @unique
  email         String?   @unique
  passwordHash  String?               // null for guests
  isGuest       Boolean   @default(true)
  createdAt     DateTime  @default(now())
  lastSeenAt    DateTime  @updatedAt
  profile       Profile?
  inventory     InventoryItem[]
  questStates   QuestState[]
  matchesA      Match[]   @relation("playerA")
  matchesB      Match[]   @relation("playerB")
}

model Profile {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  level       Int     @default(1)
  exp         Int     @default(0)
  coins       Int     @default(100)
  gems        Int     @default(0)
  rankPoints  Int     @default(0)
  rankTier    String  @default("ROOKIE")
  classId     String  @default("warrior")
  classLevels Json    @default("{}")     // { "warrior": 3, "mage": 1 }
  avatar      Json    // { skinTone, hair, hairColor, eyes, top, bottom, shoes, hat, aura, ... }
  zoneId      String  @default("beginner-village")
  posX        Int     @default(25)
  posY        Int     @default(25)
  wins        Int     @default(0)
  losses      Int     @default(0)
  totalLines  Int     @default(0)
  bestCombo   Int     @default(0)
}

model CosmeticItem {
  id        String  @id              // "hair_spiky_red"
  slot      String                   // HAIR | TOP | AURA | PET | BOARD_THEME ...
  name      String
  rarity    String                   // COMMON..MYTHIC
  costCoins Int?
  costGems  Int?
  unlockBy  String  @default("SHOP") // SHOP | LEVEL | RANK | QUEST | EVENT
  meta      Json    @default("{}")
  owners    InventoryItem[]
}

model InventoryItem {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  equipped  Boolean  @default(false)
  obtainedAt DateTime @default(now())
  user      User         @relation(fields: [userId], references: [id])
  item      CosmeticItem @relation(fields: [itemId], references: [id])
  @@unique([userId, itemId])
}

model Match {
  id          String   @id @default(cuid())
  mode        String                  // RANKED | CASUAL | NPC | BOSS
  playerAId   String
  playerBId   String?                 // null when vs NPC
  npcId       String?
  winnerId    String?
  durationS   Int
  statsA      Json                    // { lines, maxCombo, attacksSent, ... }
  statsB      Json
  rankDeltaA  Int      @default(0)
  rankDeltaB  Int      @default(0)
  createdAt   DateTime @default(now())
  playerA     User     @relation("playerA", fields: [playerAId], references: [id])
  playerB     User?    @relation("playerB", fields: [playerBId], references: [id])
}

model Quest {
  id          String  @id             // "defeat_3_trainers"
  title       String
  description String
  zoneId      String?
  goalType    String                  // BATTLES_WON | LINES_CLEARED | ZONE_VISITED ...
  goalCount   Int
  rewardExp   Int     @default(0)
  rewardCoins Int     @default(0)
  rewardItem  String?
  states      QuestState[]
}

model QuestState {
  id        String  @id @default(cuid())
  userId    String
  questId   String
  progress  Int     @default(0)
  completed Boolean @default(false)
  claimedAt DateTime?
  user      User  @relation(fields: [userId], references: [id])
  quest     Quest @relation(fields: [questId], references: [id])
  @@unique([userId, questId])
}

model SeasonRecord {
  id         String @id @default(cuid())
  season     Int
  userId     String
  finalRank  String
  finalPoints Int
  @@unique([season, userId])
}
```

**Redis (ephemeral):** presence (`online:<zoneId>` sets), positions hot-cache, matchmaking queues (`mm:ranked` sorted set by rankPoints), active battle room registry, chat rate-limit counters, session tokens.

---

## 14. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend shell | **Next.js 14 (React)** | Routing, auth pages, shop/profile UI in React; SSR for landing/SEO |
| Game rendering | **Phaser 3** (inside a Next page) | Mature 2D engine: tilemaps, sprite animation, input, camera |
| Realtime | **Node.js + Socket.io** (MVP) → optional **Colyseus** later | Socket.io is simplest to ship; Colyseus' room model maps perfectly to zones/battles when you scale |
| API | Next.js API routes (MVP) → separate Express/Fastify service later | One deployable at first |
| Database | **PostgreSQL + Prisma** | Relational fits inventory/matches/quests; Prisma = fast iteration + types |
| Cache/queues | **Redis** | Presence, matchmaking, pub/sub for multi-node |
| Auth | Guest tokens (JWT) → NextAuth/Supabase Auth later | Zero-friction first session |
| Hosting | Vercel (frontend) + Railway/Fly.io/Render (game server + Postgres + Redis) | WebSocket servers need a long-lived host, not serverless |
| Assets | Aseprite for pixel art; Tiled for maps; free CC0 packs (e.g., Kenney) as placeholders | Standard pixel pipeline |

**Key decision — Socket.io vs Colyseus:** start with Socket.io (less framework lock-in, trivial MVP), but write zone/battle logic as self-contained `Room` classes so a Colyseus migration is a transport swap, not a rewrite.

---

## 15. Folder Structure

```
blockquest/
├─ package.json                  # npm workspaces: apps/*, packages/*
├─ apps/
│  ├─ web/                       # Next.js + Phaser client
│  │  ├─ src/
│  │  │  ├─ app/                 # routes: / (landing), /play, /profile, /shop, /leaderboard
│  │  │  ├─ game/                # Phaser code
│  │  │  │  ├─ scenes/           # BootScene, WorldScene, BattleScene, AvatarPreviewScene
│  │  │  │  ├─ entities/         # PlayerSprite, RemotePlayer, NpcSprite, PetFollower
│  │  │  │  ├─ systems/          # avatarRenderer, inputController, cameraFollow
│  │  │  │  └─ net/              # socket client, event handlers, interpolation buffer
│  │  │  ├─ components/          # React UI: ChatBox, QuestTracker, ChallengeModal, HUD
│  │  │  ├─ stores/              # zustand: session, world, battle, ui
│  │  │  └─ lib/                 # api client, auth helpers
│  │  └─ public/assets/          # sprites/, tilesets/, maps/, audio/, ui/
│  └─ server/                    # Node game server
│     ├─ src/
│     │  ├─ index.ts             # http + socket.io bootstrap
│     │  ├─ auth/                # guest token issue/verify
│     │  ├─ rooms/
│     │  │  ├─ ZoneRoom.ts       # movement, chat, presence, challenges
│     │  │  └─ BattleRoom.ts     # authoritative puzzle simulation
│     │  ├─ game/
│     │  │  ├─ engine/           # board.ts, pieces.ts, bag.ts, kicks.ts, scoring.ts
│     │  │  ├─ skills/           # class skill definitions + effects
│     │  │  └─ ai/               # npcBrain.ts (heuristic placement)
│     │  ├─ matchmaking/         # queue.ts (Redis sorted sets)
│     │  ├─ services/            # rewards.ts, quests.ts, rank.ts, chatFilter.ts
│     │  └─ db/                  # prisma client singleton
│     └─ prisma/
│        ├─ schema.prisma
│        └─ seed.ts              # zones, NPCs, quests, starter cosmetics
└─ packages/
   └─ shared/                    # imported by BOTH web & server
      ├─ src/
      │  ├─ events.ts            # socket event names + payload types
      │  ├─ types.ts             # AvatarConfig, BoardState, MatchResult...
      │  ├─ constants.ts         # board size, tick rates, rank thresholds
      │  └─ zones.ts             # zone metadata, unlock requirements
```

The `packages/shared` workspace is the load-bearing decision: event contracts and game constants defined once, type-checked on both ends.

---

## 16. MVP Roadmap (8 weeks, detailed plan in MVP_BUILD_PLAN.md)

| Week | Milestone |
|---|---|
| 1 | Monorepo, Prisma schema + seed, guest auth, Phaser boots a tilemap with a walkable character |
| 2 | Socket.io zone room: see other players move in real time with name tags |
| 3 | Avatar builder (5 slots, palette swaps) + avatars render in world |
| 4 | Single-player puzzle engine complete (client + shared logic) |
| 5 | Server-authoritative BattleRoom: PvP challenge flow → live 1v1 with garbage |
| 6 | Rewards (EXP/coins/rank points), result screen, simple rank tiers |
| 7 | One NPC opponent (heuristic AI), one shop, chat with filter |
| 8 | Polish, deploy, closed playtest |

---

## 17. Future Expansion Roadmap

- **v0.2:** Brickwood Forest + Neon Arcade City, ranked queue + matchmaking, 3 classes with skills, quest system, leaderboards
- **v0.3:** Spectator mode, friends list, parties, remaining classes, daily challenges, season 1
- **v0.4:** Lava Cavern + first boss (modifiers), guilds, season pass, gem shop
- **v0.5:** Remaining zones, tournaments, trading (if economy is healthy), mobile touch controls
- **v1.0:** Selfie-to-avatar attribute pipeline, replays, esports-grade spectator arena, localization

---

## 18. Sample UI Screens

1. **Landing:** logo, "PLAY AS GUEST" mega-button, "Create Account", live player count.
2. **Avatar Creator:** big animated preview (idle/walk toggle); category tabs (Skin/Hair/Eyes/Outfit/Extras); randomize button; name input.
3. **World HUD:** top-left: avatar chip + level + rank badge + coin counter; top-right: mini-map + zone name; bottom-left: collapsible chat; right rail: quest tracker; popups: challenge invite (Accept ⚔ / Decline), zone-unlock toast.
4. **Battle Screen:** as diagrammed in §6 — two boards, HP bars, hold/next, skill button with cooldown ring, garbage meter, combo flare, spectator eye-count.
5. **Result Screen:** VICTORY/DEFEAT banner; EXP bar animating up (level-up burst); +coins; rank-points delta with tier progress arc; quest-progress ticks; \[Rematch] \[Return to World].
6. **Shop:** grid of cosmetic cards (rarity-colored frames), live "try on" preview pane, coin/gem price chips.
7. **Profile Card** (click any player): avatar, level, rank tier, W/L, best combo, equipped title, \[Challenge] \[Add Friend] \[Spectate].

---

## 19. Sample Game States

**Client state machine:**
```
BOOT → AUTH → AVATAR_CREATE (first time) → WORLD
WORLD ⇄ MENU(shop/profile/quests)
WORLD → CHALLENGE_PENDING → BATTLE_COUNTDOWN → BATTLE_ACTIVE
BATTLE_ACTIVE → BATTLE_RESULT → WORLD
WORLD → SPECTATE → WORLD
any → DISCONNECTED → (reconnect grace 30s) → resume | AUTH
```

**Server battle-room states:**
```
CREATED → WAITING_FOR_PLAYERS → COUNTDOWN(3s) → ACTIVE
ACTIVE → FINISHED(reason: topout | hp | timeout | forfeit | disconnect)
FINISHED → persist Match → distribute rewards → close room
```

**Per-player battle state (authoritative, server-side):**
```ts
interface BattlePlayerState {
  board: Uint8Array;        // 10*20 cells, 0 = empty, 1-7 piece colors, 8 = garbage
  active: { kind, x, y, rot } | null;
  hold: PieceKind | null;  holdUsed: boolean;
  queue: PieceKind[];      bagState: number[];
  hp: number;  score: number;  lines: number;
  combo: number;  backToBack: boolean;
  pendingGarbage: { rows: number; landsAtTick: number }[];
  skill: { charge: number; cooldownUntil: number; activeUntil: number };
  alive: boolean;
}
```

---

## 20. Pseudocode — Multiplayer Movement

```
CLIENT (every key press, max 1 intent per move-step):
  on key(direction):
    if not currentlyMoving:
      predictedPos = pos + dirVector(direction)
      if clientCollisionMap.walkable(predictedPos):
        playWalkAnimation(direction)
        tweenTo(predictedPos)                 # optimistic
      send("move_intent", { direction, seq: ++seq })

SERVER (ZoneRoom):
  on "move_intent" (player, { direction, seq }):
    if now - player.lastMoveAt < MOVE_COOLDOWN_MS: return   # speed cap
    target = player.pos + dirVector(direction)
    if not zone.collisionMap.walkable(target): 
      send(player, "move_reject", { seq, pos: player.pos })  # client snaps back
      return
    player.pos = target; player.lastMoveAt = now
    if zone.warpAt(target):
      attemptZoneTransfer(player, zone.warpAt(target))       # checks rank/level

  every 100ms:                                               # 10 Hz snapshot
    broadcast("world_state", {
      players: visiblePlayersFor(each client).map(p =>
        ({ id, username, pos, facing, avatarHash, rankTier }))
    })

CLIENT (on "world_state"):
  for each remote player: push snapshot into interpolation buffer
  render remote players ~100ms in the past, lerping between snapshots
```

## 21. Pseudocode — Battle Matchmaking

```
# Direct challenge
on "challenge_send" (from, { targetId }):
  validate same zone, neither in battle, target not blocking from
  store pendingChallenge(from, target, expiresIn=30s)
  send(target, "challenge_received", { from: profileCard(from) })

on "challenge_accept" (target, { challengeId }):
  ch = pendingChallenges.take(challengeId)        # atomic, handles expiry
  if !ch: return send(target, "challenge_gone")
  room = createBattleRoom(mode="CASUAL", ch.from, ch.target)
  emitTo([ch.from, ch.target], "battle_start", { roomId: room.id, seed: room.seed })

# Ranked queue (Redis)
on "queue_join" (player):
  ZADD mm:ranked player.rankPoints player.id

every 2s (matchmaker loop):
  candidates = ZRANGE mm:ranked 0 -1 WITHSCORES
  for each adjacent pair (a, b):
    window = 50 + 25 * secondsInQueue(a)          # widen over time
    if |score(a) - score(b)| <= window:
      ZREM both (atomic via Lua — prevents double-match)
      createBattleRoom(mode="RANKED", a, b)
```

## 22. Pseudocode — Puzzle Battle Logic (server-authoritative core)

```
BattleRoom.tick (every 16ms):
  for p in players:
    if now >= p.nextGravityAt:
      if canMove(p.board, p.active, dy=+1): p.active.y += 1
      else: lockPiece(p)
      p.nextGravityAt = now + gravityInterval(levelFor(elapsed))
  if elapsed % SNAPSHOT_MS == 0: broadcastStates()
  checkWinConditions()

on input(p, cmd):                       # left/right/rotCW/rotCCW/soft/hard/hold/skill
  rateLimit(p, cmd)                      # humanly-possible APM cap (anti-cheat)
  switch cmd:
    move/rotate → apply if valid (kicks for rotation)
    hard_drop   → drop to floor, lockPiece(p)
    hold        → swap if !p.holdUsed
    skill       → if p.skill.charge >= cost and offCooldown: applySkill(p)

lockPiece(p):
  merge active piece into board
  cleared = removeFullRows(p.board)
  if cleared > 0:
    p.combo += 1
    attack = attackTable[cleared] + comboBonus(p.combo) + b2bBonus(p, cleared)
    attack = cancelPendingGarbage(p, attack)        # counter first
    if attack > 0: sendGarbage(opponent(p), attack); opponent(p).hp -= attack * HP_PER_ROW
    p.skill.charge += cleared
    emitQuestEvent(p.userId, LINES_CLEARED, cleared)
  else:
    p.combo = 0
    materializePendingGarbage(p)                    # rows whose delay elapsed rise now
  spawnNextPiece(p)                                  # from seeded 7-bag
  if spawnBlocked(p): p.alive = false               # top-out

checkWinConditions():
  if exactly one alive → finish(winner=alive)
  if a player.hp <= 0 → finish(winner=other)
  if elapsed > MATCH_MS → finish(winner=higherScore)

finish(winner):
  persist Match row; compute Elo deltas (ranked only)
  rewards = { exp, coins, rankDelta } per player → Prisma transaction
  broadcast("battle_end", { winner, stats, rewards })
```

Both players' RNG uses a **shared match seed** with per-player streams, so spectators and replays can reproduce the match deterministically.

---

## 23. Security & Anti-Cheat

1. **Server authority everywhere that matters:** boards, positions, currencies, rank, inventory live on the server. Clients send *intents*, never outcomes.
2. **Input plausibility:** APM/handling caps per command type; statistical flagging for superhuman consistency (0 misdrops at 300 APM).
3. **Seeded RNG server-side** — clients can't know or influence upcoming pieces beyond the honest preview.
4. **Zone/economy validation:** warp gates re-check rank server-side; shop purchases are atomic Prisma transactions checking balance; rewards only granted by `finish()`, never by a client message.
5. **Chat safety:** profanity filter (e.g., obscenity lists + normalization against leetspeak), per-user rate limits, mute/block/report, guest chat optionally restricted to emotes/presets.
6. **Auth:** short-lived JWT for guests bound to a device-local refresh token; bcrypt/argon2 for accounts; socket handshake verifies JWT; one active socket per user.
7. **Transport & infra:** WSS only, CORS allowlist, Redis-backed rate limiting on REST + socket events, no client-trusted IDs (server maps socket → userId once at handshake).
8. **Smurf/boost mitigation (later):** ranked requires level 5; match-history anomaly detection; report-driven review queue.

## 24. Performance Considerations

- **Network:** 10 Hz world snapshots with interest management (only players within camera + margin); delta-compress battle board updates (send changed rows or the piece transform, full board only on lock/garbage events); binary-pack boards (200 cells = 100 bytes at 4 bits/cell).
- **Server:** zone rooms are independent event-loops-friendly units — shard by room across processes via Redis adapter; battle sim is integer math on typed arrays (thousands of concurrent battles per node is realistic); never block the loop with DB writes (queue reward persistence).
- **Client:** texture atlases per zone; avatar layers composited **once** to a RenderTexture per appearance-hash (then it's a single sprite — crucial with 50+ players on screen); object pooling for blocks/particles; Phaser canvas in a dedicated React island so React re-renders never touch the game loop; tilemap culling on by default.
- **DB:** hot path (movement, battles in progress) never touches Postgres — Redis only; Postgres written at battle end, purchase, logout, and periodic position checkpoints (30 s).

## 25. Deployment Plan

| Stage | Setup |
|---|---|
| **MVP / closed beta** | Vercel: Next.js frontend. Railway (or Fly.io/Render): one Node game-server container + managed Postgres + managed Redis. WSS via the platform's TLS. ~$10–20/mo. |
| **Open beta** | Split API service from realtime gateway; 2+ gateway nodes behind a load balancer with sticky sessions + Socket.io Redis adapter; Sentry + uptime monitoring; nightly DB backups. |
| **Growth** | Dedicated battle-server pool (autoscaled — battles are self-contained and stateless after persist); CDN for all static assets; regional gateways (NA/EU/Asia) with region-local Redis; observability: Prometheus/Grafana on room counts, tick durations, socket backpressure. |
| **CI/CD** | GitHub Actions: typecheck + unit tests (puzzle engine has deterministic replay tests) → build → deploy preview → promote. Prisma migrations gated on deploy. |

---

*Next document: [MVP_BUILD_PLAN.md](./MVP_BUILD_PLAN.md) — the step-by-step build with code.*
