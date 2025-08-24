export default class PlayScene extends Phaser.Scene {
  constructor() {
    super("PlayScene");
  }

  preload() {
    this.load.image("tiles", "assets/tiles.png");
    this.load.tilemapTiledJSON("map", "assets/testMap.json");
    this.load.image("player", "assets/player.png");
  }

  create() {
    // Map setup
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("tiles", "tiles");

    // Create layers from your JSON
    const groundLayer = map.createLayer("Ground", tileset, 0, 0);
    const wallLayer = map.createLayer("Walls", tileset, 0, 0);

    // Player setup
    this.player = this.physics.add.sprite(100, 100, "player");
    this.player.setCollideWorldBounds(true);

    // Enable collision on walls
    wallLayer.setCollisionByExclusion([-1]);
    this.physics.add.collider(this.player, wallLayer);

    // Camera follows player
    this.cameras.main.startFollow(this.player);

    // Input setup
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update() {
    const speed = 150;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.player.setVelocityY(speed);
    }
  }
}
