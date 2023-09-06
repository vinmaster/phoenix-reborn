import Phaser from 'phaser';
import { Input } from './Constants';

export class GameScene extends Phaser.Scene {
  // MAX_WIDTH = document.documentElement.clientWidth;
  // MAX_HEIGHT = document.documentElement.clientHeight - 5;
  PIXEL_SCALE = 4;

  keyboard!: Phaser.Types.Input.Keyboard.CursorKeys;
  pause = true;
  inputNextId = 1;
  self!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  MAX_X = 384;
  MAX_Y = 256;
  bullets!: Phaser.Physics.Arcade.Group;
  enemyBullets!: Phaser.Physics.Arcade.Group;
  justFired = false;
  enemies: Phaser.Types.Physics.Arcade.ImageWithDynamicBody[] = [];
  drops!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // this.load.spritesheet('person1', 'person1.png', { frameWidth: 16, frameHeight: 16 });
    // this.load.spritesheet('slime', 'slime.png', { frameWidth: 16, frameHeight: 16 });
  }

  create() {
    this.pause = false;
    document.addEventListener('visibilitychange', this.visibilityChange.bind(this));

    this.keyboard = this.input.keyboard!.createCursorKeys();
    this.createTextures();

    // this.self = this.physics.add.image(100, 100, 'ship');
    this.self = this.physics.add.image(this.MAX_X / 2, this.MAX_Y, 'ship');
    this.self.body.setSize(9 * this.PIXEL_SCALE, 7 * this.PIXEL_SCALE);

    this.bullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.drops = this.physics.add.group();
    this.physics.add.overlap(this.drops, this.self, this.collide as any, undefined, this);
    this.physics.add.overlap(this.enemyBullets, this.self, this.collide as any, undefined, this);

    // this.enemies.push(this.spawnEnemy(10, -10, 'enemy1'));
    // this.enemies.push(this.spawnEnemy(8, -20, 'enemy1'));
    // this.enemies.push(this.spawnEnemy(10, -30, 'enemy1'));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        this.enemies.push(
          this.spawnEnemy(
            15 * col + 2 * this.PIXEL_SCALE,
            -8 * row - 4 * this.PIXEL_SCALE,
            'enemy1'
          )
        );
      }
    }
    // let text = this.add.text(10, 20, 'text', {
    //   font: '16px Courier',
    //   color: '#fff',
    // });

    // this.physics.add.existing(this.self);
    // this.physics.add.existing(enemy1);
    // this.physics.add.collider(this.self, enemy1);
    // this.physics.world.on('collide', (obj1: any, obj2: any, body1: any, body2: any) => {
    //   console.log(obj1, obj2, body1, body2);
    // });

    // this.physics.add.overlap(this.self, enemy1, this.collide, undefined, this);
    this.physics.world.setBounds(
      0,
      this.MAX_Y / 2 + 5 * this.PIXEL_SCALE,
      this.MAX_X,
      this.MAX_Y / 2 - 5 * this.PIXEL_SCALE,
      true,
      true,
      true,
      true
    );
    this.self.setCollideWorldBounds(true);
  }

  update(delta: number, now: number) {
    if (this.pause) return;

    this.readInput();

    // clean up offscreen bullets
    this.bullets.children.each((child: Phaser.GameObjects.GameObject) => {
      if (!this.withinBounds(child.body!.position.x, child.body!.position.y)) {
        child.destroy();
      }
      return null;
    });

    if (this.enemies.length === 0) {
      this.scene.start('GameOver');
    }

    for (let enemy of this.enemies) {
      let phase = enemy.getData('phase');
      if (phase === 1) {
        let distance = enemy.getData('distance') || 0;
        if (distance < 40 * this.PIXEL_SCALE) {
          enemy.y += 1;
          enemy.setData('distance', distance + 1);
        } else {
          enemy.setData('phase', 2);
          enemy.setData('distance', 0);
          enemy.setData('direction', 0);
        }
      } else if (phase === 2) {
        let distance = enemy.getData('distance') || 0;
        let direction = enemy.getData('direction');
        let directions = [
          { x: 1, y: 0 },
          { x: 0, y: -1 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
        ];
        let dirDelta = directions[direction];
        if (distance < 4 * this.PIXEL_SCALE) {
          enemy.x += dirDelta.x;
          enemy.y += dirDelta.y;
          enemy.setData('distance', distance + 1);
        } else {
          enemy.setData('distance', 0);
          enemy.setData('direction', (direction + 1) % 4);
        }
      }

      // maybe fire
      if (Math.random() < 0.005) {
        let bullet = this.enemyBullets.create(enemy.x, enemy.y, 'bullet1');
        bullet.setData('source', 'enemy');
        bullet.setVelocity(0, 32 * this.PIXEL_SCALE);
      }
    }
  }

  collide(
    obj1: Phaser.Types.Physics.Arcade.ImageWithDynamicBody,
    obj2: Phaser.Types.Physics.Arcade.ImageWithDynamicBody
  ) {
    if (['bullet1'].includes(obj2.texture.key)) {
      if (obj2.getData('source') === 'enemy') {
        let dom = document.getElementById('hp')!;
        dom.textContent = (parseInt(dom.textContent!) - 2).toString();
        if (dom.textContent === '0') {
          this.scene.start('GameOver');
        }
      }
      obj2.destroy();
    }

    if (obj2.texture.key === 'money') {
      let dom = document.getElementById('money')!;
      dom.textContent = (parseInt(dom.textContent!) + 100).toString();
      obj2.destroy();
    }

    let enemy: Phaser.Types.Physics.Arcade.ImageWithDynamicBody | undefined;
    if (obj1.texture.key === 'enemy1') {
      enemy = obj1;
    } else if (obj2.texture.key === 'enemy1') {
      enemy = obj2;
    }
    if (!enemy) return;
    let hp = enemy.getData('hp') - 1;
    if (hp <= 0) {
      if (Math.random() < 0.3) {
        this.drops.create(enemy.x, enemy.y, 'money').setVelocity(0, 32 * this.PIXEL_SCALE);
      }
      let collider = enemy.getData('collider') as Phaser.Physics.Arcade.Collider;
      collider.destroy();
      let index = this.enemies.indexOf(enemy);
      if (index !== -1) {
        this.enemies.splice(index, 1);
      }
      enemy.destroy();
    } else enemy.setData('hp', hp);
  }

  spawnEnemy(x: number, y: number, type: string): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
    let enemy1 = this.physics.add.image(x * this.PIXEL_SCALE, y * this.PIXEL_SCALE, type);
    enemy1.body.setSize(7 * this.PIXEL_SCALE, 6 * this.PIXEL_SCALE);
    enemy1.setData('type', type);
    enemy1.setData('hp', 2);
    enemy1.setData('phase', 1);
    let collider = this.physics.add.overlap(
      this.bullets,
      enemy1,
      this.collide as any,
      undefined,
      this
    );
    enemy1.setData('collider', collider);
    return enemy1;
  }

  readInput() {
    let newInput: Input | undefined;
    if (
      this.keyboard.left.isDown &&
      this.withinBounds(this.self.x - this.PIXEL_SCALE, this.self.y)
    ) {
      newInput = {
        inputId: this.inputNextId++,
        data: { direction: 'left', distance: 1 },
      };
      this.self.x -= this.PIXEL_SCALE;
    } else if (this.keyboard.right.isDown) {
      newInput = {
        inputId: this.inputNextId++,
        data: { direction: 'right', distance: 1 },
      };
      this.self.x += this.PIXEL_SCALE;
    }
    if (this.keyboard.up.isDown) {
      newInput = {
        inputId: this.inputNextId++,
        data: { direction: 'up', distance: 1 },
      };
      this.self.y -= this.PIXEL_SCALE;
    } else if (
      this.keyboard.down.isDown &&
      this.withinBounds(this.self.x, this.self.y + this.PIXEL_SCALE)
    ) {
      newInput = {
        inputId: this.inputNextId++,
        data: { direction: 'down', distance: 1 },
      };
      this.self.y += this.PIXEL_SCALE;
    }
    if (this.keyboard.space.isDown && !this.justFired) {
      this.bullets
        .create(this.self.x, this.self.y, 'bullet1')
        .setVelocity(0, -32 * this.PIXEL_SCALE);
      this.justFired = true;
      this.time.delayedCall(200, () => {
        this.justFired = false;
      });
    }
    return newInput;
  }

  withinBounds(x: number, y: number): boolean {
    return x >= 0 && x <= this.MAX_X && y >= 0 && y <= this.MAX_Y;
  }

  visibilityChange(event: any) {
    if (document.visibilityState === 'visible') {
      this.pause = false;
    } else {
      this.pause = true;
    }
  }

  createTextures() {
    let pixelWidth = this.PIXEL_SCALE;
    let shipData = [
      // '0123456789',
      '0.......0',
      '0.......0',
      '0...0...0',
      '0..0.0..0',
      '0.0...0.0',
      '00.....00',
      '0.......0',
      // '0123456789ABCDEF',
    ];
    this.textures.generate('ship', { data: shipData, pixelWidth: pixelWidth });
    let moneyData = [
      '..0..',
      '.0000',
      '0.0..',
      '0.0..',
      '.000.',
      '..0.0',
      '..0.0',
      '0000.',
      '..0..',
    ];
    this.textures.generate('money', { data: moneyData, pixelWidth: pixelWidth });
    let enemy1Data = ['0.....0', '0.....0', '0000000', '0000000', '.00000.', '..000..'];
    this.textures.generate('enemy1', { data: enemy1Data, pixelWidth: pixelWidth });
    let bullet1Data = ['0'];
    this.textures.generate('bullet1', { data: bullet1Data, pixelWidth: pixelWidth });
  }
}
