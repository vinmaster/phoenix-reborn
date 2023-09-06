import './style.css';
import 'phaser';
import { GameScene } from './GameScene';
import { GameOver } from './GameOver';

const GameConfig: Phaser.Types.Core.GameConfig = {
  title: 'ExampleGame',
  url: 'https://github.com/digitsensitive/phaser3-typescript',
  version: '2.0',
  width: 384,
  height: 256,
  type: Phaser.AUTO,
  parent: 'app',
  // `as as Phaser.Types.Scenes.SettingsConfig[]` is required until https://github.com/photonstorm/phaser/pull/6235
  // scene: [menu()] as Phaser.Types.Scenes.SettingsConfig[],
  scene: [GameScene, GameOver],
  input: {
    keyboard: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  backgroundColor: '#d3d3d3',
  render: { pixelArt: true, antialias: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // `fullscreenTarget` must be defined for phones to not have
    // a small margin during fullscreen.
    fullscreenTarget: 'app',
    expandParent: false,
  },
};

export class Game extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.addEventListener('load', () => {
  // Expose `_game` to allow debugging, mute button and fullscreen button
  (window as any)._game = new Game(GameConfig);
});
