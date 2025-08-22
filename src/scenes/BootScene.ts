import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Images
    this.load.image("sky", "/assets/images/sky.png");
    this.load.audio("menuMusic", "/assets/audio/menuMusic.mp3");
    this.load.audio("clickSound", "/assets/audio/click.wav");

    this.load.image('tileset', 'assets/tilesets/tileset.png');

    this.load.tilemapTiledJSON("world", "/assets/maps/world.json");


  }

  create() {
    this.scene.start("MenuScene");
  }
}
