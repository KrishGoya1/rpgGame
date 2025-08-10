import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { CameraController } from './camera.js';
import { MapLoader } from './mapLoader.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.debugMode = true;
  }

  preload() {
  this.load.json('map1', 'map1.json');
  this.load.json('building1', 'building1.json'); 

  this.add.graphics()
    .fillStyle(0xffff00, 1)
    .fillRect(0, 0, 40, 40)
    .generateTexture('player', 40, 40);
}


  create() {
    this.renderer = new Renderer(this);
    this.player = new Player(this, 100, 100);

    this.mapLoader = new MapLoader(this, this.renderer);
    this.mapLoader.loadMap('map1');

    this.cameraController = new CameraController(
      this,
      this.player.sprite,
      this.physics.world.bounds.width,
      this.physics.world.bounds.height
    );
  }

  update() {
    this.player.update();
    if (Phaser.Input.Keyboard.JustDown(this.player.keys.SPACE)) {
      this.player.interact();
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#000',
  parent: 'game-container',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [MainScene]
};

new Phaser.Game(config);
