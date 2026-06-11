import Phaser from 'phaser';
import { WorldScene } from './scenes/WorldScene';
import { BattleScene } from './scenes/BattleScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    pixelArt: true,
    backgroundColor: '#1a2433',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [WorldScene, BattleScene],
  });
}
