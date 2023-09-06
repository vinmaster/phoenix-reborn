import Phaser from 'phaser';

export class GameOver extends Phaser.Scene {
  PIXEL_SCALE = 4;

  MAX_X = 384;
  MAX_Y = 256;

  constructor() {
    super({ key: 'GameOver' });
  }

  preload() {}

  create() {
    let text = this.add.text(this.MAX_X / 2 - 70, this.MAX_Y / 2 - 20, 'text', {
      font: '24px Arial',
      color: '#000',
    });
    text.text = 'GAME OVER';
  }

  update(delta: number, now: number) {}
}
