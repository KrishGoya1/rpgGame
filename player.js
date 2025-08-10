export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 200;

    // Player sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(this.sprite.width, this.sprite.height);
    this.sprite.body.setOffset(0, 0);

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    // Current nearby object
    this.nearbyObject = null;
  }

  update() {
    // Reset nearby object each frame
    this.nearbyObject = null;

    const body = this.sprite.body;
    body.setVelocity(0);

    // Movement
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      body.setVelocityX(-this.speed);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      body.setVelocityX(this.speed);
    }
    if (this.cursors.up.isDown || this.keys.W.isDown) {
      body.setVelocityY(-this.speed);
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      body.setVelocityY(this.speed);
    }

    // Normalize diagonal speed
    body.velocity.normalize().scale(this.speed);

    // Manual overlap check for reliability
    this.scene.mapLoader.interactiveObjects.forEach(obj => {
      if (Phaser.Geom.Intersects.RectangleToRectangle(
        this.sprite.getBounds(),
        obj.getBounds()
      )) {
        this.nearbyObject = obj;
      }
    });
  }

  interact() {
    if (!this.nearbyObject || !this.nearbyObject.mapData) {
      console.log("Nothing to interact with.");
      return;
    }

    const obj = this.nearbyObject.mapData;

    // Entrances
    if (obj.type === "entrance" && obj.targetMap) {
      console.log(`Entering ${obj.targetMap}...`);
      this.scene.pendingSpawnName = obj.targetSpawn || null;
      this.scene.mapLoader.loadMap(obj.targetMap);
      return;
    }

    // Items
    if (obj.type === "item") {
      console.log(`Picked up ${obj.name || 'item'}`);
      this.nearbyObject.destroy(); // safely remove object
      return;
    }

    console.log("Interacted with object:", obj.type);
  }
}
