import Phaser from 'phaser';
import {
  BattleSnapshot, BattleSideSnapshot, BattleCmd, ROTATIONS, PieceKind,
  BOARD_W, BOARD_H, EMPTY, GARBAGE,
} from '@blockquest/shared';
import { getSocket } from '@/lib/socket';
import { bridge } from '@/lib/bridge';
import { useGameStore } from '@/stores/gameStore';

const CELL = 18;
const MINI = 8;

const PIECE_COLORS = [
  0x46c0e0, // I
  0xf2d250, // O
  0xb066d0, // T
  0x6fd06b, // S
  0xe06262, // Z
  0x5f7fe0, // J
  0xe09b4a, // L
];
const GARBAGE_COLOR = 0x6f6f78;

export class BattleScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private cleanups: (() => void)[] = [];

  constructor() {
    super('BattleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#14121f');
    this.cameras.main.setZoom(1);
    this.gfx = this.add.graphics();

    this.add.text(
      this.scale.width / 2, this.scale.height - 18,
      '←/→ move · ↑/X rotate · Z rotate ccw · ↓ soft · SPACE hard drop · C hold',
      { fontFamily: 'monospace', fontSize: '12px', color: '#8d89a8' },
    ).setOrigin(0.5);

    const keymap: Record<string, BattleCmd> = {
      'keydown-LEFT': 'left',
      'keydown-RIGHT': 'right',
      'keydown-UP': 'rot_cw',
      'keydown-X': 'rot_cw',
      'keydown-Z': 'rot_ccw',
      'keydown-DOWN': 'soft',
      'keydown-SPACE': 'hard',
      'keydown-C': 'hold',
    };
    const kb = this.input.keyboard;
    for (const [event, cmd] of Object.entries(keymap)) {
      const handler = () => {
        if (useGameStore.getState().phase === 'battle') {
          getSocket().emit('battle_input', { cmd });
        }
      };
      kb?.on(event, handler);
      this.cleanups.push(() => kb?.off(event, handler));
    }

    const offBridge = bridge.on('return-world', () => this.scene.start('WorldScene'));
    this.cleanups.push(offBridge);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
    });
  }

  update() {
    const snap = useGameStore.getState().battle;
    this.gfx.clear();
    if (!snap) return;
    this.drawSnapshot(snap);
  }

  private drawSnapshot(snap: BattleSnapshot) {
    const selfId = useGameStore.getState().userId;
    const mine = snap.sides.find((s) => s.userId === selfId) ?? snap.sides[0];
    const theirs = snap.sides.find((s) => s !== mine)!;

    const totalW = this.scale.width;
    const boardW = BOARD_W * CELL;
    this.drawBoard(mine, totalW / 2 - boardW - 90, 60, true);
    this.drawBoard(theirs, totalW / 2 + 90, 60, false);
  }

  private drawBoard(side: BattleSideSnapshot, x: number, y: number, isMine: boolean) {
    const g = this.gfx;
    const w = BOARD_W * CELL;
    const h = BOARD_H * CELL;

    g.fillStyle(0x0b0a14, 1);
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.lineStyle(2, side.alive ? (isMine ? 0x5ad1a0 : 0xd15a6e) : 0x444444, 1);
    g.strokeRect(x - 2, y - 2, w + 4, h + 4);

    for (let cy = 0; cy < BOARD_H; cy++) {
      for (let cx = 0; cx < BOARD_W; cx++) {
        const v = side.board[cy * BOARD_W + cx];
        if (v === EMPTY) continue;
        const color = v === GARBAGE ? GARBAGE_COLOR : PIECE_COLORS[(v - 1) % 7];
        g.fillStyle(color, 1);
        g.fillRect(x + cx * CELL + 1, y + cy * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // ghost piece outline (own board only)
    if (isMine && side.active && side.ghostY !== null && side.ghostY !== side.active.y) {
      g.lineStyle(1, 0xffffff, 0.35);
      for (const [ox, oy] of ROTATIONS[side.active.kind][side.active.rot & 3]) {
        const gx = side.active.x + ox;
        const gy = side.ghostY + oy;
        if (gy >= 0) g.strokeRect(x + gx * CELL + 1, y + gy * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // pending garbage warning bar (left edge)
    if (side.pendingGarbage > 0) {
      g.fillStyle(0xe06262, 0.9);
      const barH = Math.min(side.pendingGarbage, BOARD_H) * CELL;
      g.fillRect(x - 8, y + h - barH, 4, barH);
    }

    // hold + next previews beside the board
    const sideX = isMine ? x - 60 : x + w + 16;
    if (side.hold !== null) this.drawMini(side.hold, sideX, y + 14);
    side.queue.slice(0, 3).forEach((kind, i) => this.drawMini(kind, sideX, y + 70 + i * 40));
  }

  private drawMini(kind: PieceKind, x: number, y: number) {
    const g = this.gfx;
    g.fillStyle(PIECE_COLORS[kind], 1);
    for (const [ox, oy] of ROTATIONS[kind][0]) {
      g.fillRect(x + ox * MINI, y + oy * MINI, MINI - 1, MINI - 1);
    }
  }
}
