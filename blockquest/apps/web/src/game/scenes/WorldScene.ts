import Phaser from 'phaser';
import {
  Direction, GridPos, PlayerSnapshot, NpcSnapshot, AvatarConfig,
  generateVillage, ZoneMap, TILE, ZONE_W, ZONE_H, MOVE_COOLDOWN_MS,
} from '@blockquest/shared';
import { getSocket } from '@/lib/socket';
import { bridge } from '@/lib/bridge';
import { useGameStore } from '@/stores/gameStore';
import { buildAvatarTexture, frameName, FRAME_H } from '../avatarPixels';
import { buildTileTextures } from '../tilePixels';

interface RemoteEntity {
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  target: GridPos;
  facing: Direction;
  stepToggle: boolean;
}

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
};

export class WorldScene extends Phaser.Scene {
  private map!: ZoneMap;
  private player!: Phaser.GameObjects.Sprite;
  private playerLabel!: Phaser.GameObjects.Text;
  private pos: GridPos = { x: 0, y: 0 };
  private moving = false;
  private seq = 0;
  private remotes = new Map<string, RemoteEntity>();
  private npcs: NpcSnapshot[] = [];
  private cleanups: (() => void)[] = [];
  private keysDown = new Set<string>();

  constructor() {
    super('WorldScene');
  }

  create() {
    this.map = generateVillage();
    buildTileTextures(this);
    this.drawMap();

    const socket = getSocket();
    const onInit = (data: { self: PlayerSnapshot; players: PlayerSnapshot[]; npcs: NpcSnapshot[] }) =>
      this.onWorldInit(data);
    const onState = (data: { players: PlayerSnapshot[] }) => this.onWorldState(data.players);
    const onLeft = ({ userId }: { userId: string }) => this.removeRemote(userId);
    const onReject = ({ pos }: { pos: GridPos }) => this.snapTo(pos);
    const onBattleStart = () => this.scene.start('BattleScene');
    const onRefresh = () => {
      socket.emit('world_join'); // re-init: picks up new avatar / position
    };

    socket.on('world_init', onInit);
    socket.on('world_state', onState);
    socket.on('player_left', onLeft);
    socket.on('move_reject', onReject);
    socket.on('battle_start', onBattleStart);
    const offBridge = bridge.on('refresh-world', onRefresh);

    this.cleanups.push(() => {
      socket.off('world_init', onInit);
      socket.off('world_state', onState);
      socket.off('player_left', onLeft);
      socket.off('move_reject', onReject);
      socket.off('battle_start', onBattleStart);
      offBridge();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
      this.remotes.clear();
    });

    // Use native DOM key events so keys work regardless of canvas focus
    const onKeyDown = (e: KeyboardEvent) => {
      if (useGameStore.getState().typing) return;
      this.keysDown.add(e.code);
      if (e.code === 'KeyE') this.interactNearby();
      // prevent arrow keys from scrolling the page
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => this.keysDown.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    this.cleanups.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    socket.emit('world_join');
  }

  // ---- world build -------------------------------------------------------

  private drawMap() {
    const rt = this.add.renderTexture(0, 0, ZONE_W * TILE, ZONE_H * TILE).setOrigin(0);
    for (let y = 0; y < ZONE_H; y++) {
      for (let x = 0; x < ZONE_W; x++) {
        rt.draw(`tile:${this.map.tiles[y][x]}`, x * TILE, y * TILE);
      }
    }
    this.cameras.main.setBounds(0, 0, ZONE_W * TILE, ZONE_H * TILE);
    this.cameras.main.setZoom(2.5);
  }

  private onWorldInit(data: { self: PlayerSnapshot; players: PlayerSnapshot[]; npcs: NpcSnapshot[] }) {
    // Rebuild local player (fresh join or avatar change)
    this.player?.destroy();
    this.playerLabel?.destroy();
    for (const id of [...this.remotes.keys()]) this.removeRemote(id);

    this.pos = { ...data.self.pos };
    const key = buildAvatarTexture(this, data.self.avatar);
    this.player = this.add
      .sprite(px(this.pos.x), py(this.pos.y), key, frameName('down', 0))
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.playerLabel = this.makeLabel(data.self.username, '#ffe97a');
    this.positionLabel(this.playerLabel, this.player);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    this.npcs = data.npcs;
    for (const npc of data.npcs) this.spawnNpc(npc);
    for (const snap of data.players) this.upsertRemote(snap);
  }

  private spawnNpc(npc: NpcSnapshot) {
    const cfg: AvatarConfig =
      npc.kind === 'trainer'
        ? { skin: 1, hair: 2, hairColor: 2, top: 1, bottom: 1 }
        : { skin: 0, hair: 1, hairColor: 3, top: 2, bottom: 2 };
    const key = buildAvatarTexture(this, cfg);
    const sprite = this.add
      .sprite(px(npc.pos.x), py(npc.pos.y), key, frameName('down', 0))
      .setOrigin(0.5, 1)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => getSocket().emit('npc_interact', { npcId: npc.id }));
    const label = this.makeLabel(`${npc.name} ${npc.kind === 'trainer' ? '⚔' : '🛒'}`, '#9ad0ff');
    this.positionLabel(label, sprite);
  }

  // ---- remote players ----------------------------------------------------

  private onWorldState(players: PlayerSnapshot[]) {
    const seen = new Set<string>();
    const selfId = useGameStore.getState().userId;
    for (const snap of players) {
      if (snap.userId === selfId) continue;
      seen.add(snap.userId);
      this.upsertRemote(snap);
    }
    for (const id of [...this.remotes.keys()]) {
      if (!seen.has(id)) this.removeRemote(id);
    }
  }

  private upsertRemote(snap: PlayerSnapshot) {
    let r = this.remotes.get(snap.userId);
    if (!r) {
      const key = buildAvatarTexture(this, snap.avatar);
      const sprite = this.add
        .sprite(px(snap.pos.x), py(snap.pos.y), key, frameName(snap.facing, 0))
        .setOrigin(0.5, 1)
        .setDepth(9)
        .setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => useGameStore.getState().set({ profilePopup: snap }));
      const label = this.makeLabel(snap.username, '#ffffff');
      r = { sprite, label, target: { ...snap.pos }, facing: snap.facing, stepToggle: false };
      this.remotes.set(snap.userId, r);
    }
    // Avatar may have changed (shop equip)
    const key = buildAvatarTexture(this, snap.avatar);
    if (r.sprite.texture.key !== key) r.sprite.setTexture(key, frameName(snap.facing, 0));
    r.target = { ...snap.pos };
    r.facing = snap.facing;
    r.sprite.setAlpha(snap.inBattle ? 0.5 : 1);
  }

  private removeRemote(userId: string) {
    const r = this.remotes.get(userId);
    if (!r) return;
    r.sprite.destroy();
    r.label.destroy();
    this.remotes.delete(userId);
  }

  // ---- input / update ----------------------------------------------------

  update() {
    if (!this.player) return;

    if (!useGameStore.getState().typing && !this.moving) {
      for (const [code, dir] of Object.entries(KEY_TO_DIR)) {
        if (this.keysDown.has(code)) {
          this.tryMove(dir);
          break;
        }
      }
    }

    // interpolate remote players toward their server tile
    for (const r of this.remotes.values()) {
      const tx = px(r.target.x);
      const ty = py(r.target.y);
      const dx = tx - r.sprite.x;
      const dy = ty - r.sprite.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0.5) {
        r.sprite.x += dx * 0.25;
        r.sprite.y += dy * 0.25;
        r.stepToggle = Math.floor(this.time.now / 150) % 2 === 0;
      }
      r.sprite.setFrame(frameName(r.facing, dist > 0.5 && r.stepToggle ? 1 : 0));
      this.positionLabel(r.label, r.sprite);
    }
    this.positionLabel(this.playerLabel, this.player);
  }

  private tryMove(dir: Direction) {
    this.player.setFrame(frameName(dir, 0));
    const vec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
    const target = { x: this.pos.x + vec[0], y: this.pos.y + vec[1] };
    getSocket().emit('move_intent', { dir, seq: ++this.seq });
    if (!this.map.walkable(target.x, target.y)) return;

    // optimistic move; server move_reject snaps us back
    this.pos = target;
    this.moving = true;
    this.player.setFrame(frameName(dir, 1));
    this.tweens.add({
      targets: this.player,
      x: px(target.x),
      y: py(target.y),
      duration: MOVE_COOLDOWN_MS,
      onComplete: () => {
        this.moving = false;
        this.player.setFrame(frameName(dir, 0));
      },
    });
  }

  private snapTo(pos: GridPos) {
    this.tweens.killTweensOf(this.player);
    this.pos = { ...pos };
    this.player.setPosition(px(pos.x), py(pos.y));
    this.moving = false;
  }

  private interactNearby() {
    if (useGameStore.getState().typing) return;
    for (const npc of this.npcs) {
      const dist = Math.abs(this.pos.x - npc.pos.x) + Math.abs(this.pos.y - npc.pos.y);
      if (dist <= 4) {
        getSocket().emit('npc_interact', { npcId: npc.id });
        return;
      }
    }
  }

  // ---- helpers -------------------------------------------------------------

  private makeLabel(text: string, color: string) {
    return this.add
      .text(0, 0, text, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color,
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(20);
  }

  private positionLabel(label: Phaser.GameObjects.Text, sprite: Phaser.GameObjects.Sprite) {
    label.setPosition(Math.round(sprite.x), Math.round(sprite.y - FRAME_H - 2));
  }
}

const px = (x: number) => x * TILE + TILE / 2;
const py = (y: number) => y * TILE + TILE;
