export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    // Load map + tileset
    this.load.image("tiles", "assets/tiles.png");
    this.load.tilemapTiledJSON("map", "assets/testMap.json");
  }

  create() {
    this.scene.start("PlayScene");
  }
}
