export default class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
  }

  create() {
    // Load map
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("tiles", "tiles");

    // Layers
    const ground = map.createLayer("Ground", tileset, 0, 0);
    const walls = map.createLayer("Walls", tileset, 0, 0);

    // Spawn player (just a placeholder square for now)
    const spawn = map.findObject("Objects", obj => obj.name === "PlayerSpawn");
    this.player = this.add.rectangle(spawn.x, spawn.y, 20, 20, 0x00ff00);

    // Center camera on player
    this.cameras.main.startFollow(this.player);
  }
}
