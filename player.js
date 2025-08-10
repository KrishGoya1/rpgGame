export class Player {
  /**
   * 
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {number} x - Starting X position
   * @param {number} y - Starting Y position
   */
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 200; // Movement speed (px/s)

    // Create the player as a physics sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);

    // Input keys
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
  }

  /**
   * Call every frame to update player movement.
   */
  update() {
    const body = this.sprite.body;
    body.setVelocity(0);

    // Horizontal movement
    if (this.cursors.left.isDown || this.keys.A.isDown) {
      body.setVelocityX(-this.speed);
    } else if (this.cursors.right.isDown || this.keys.D.isDown) {
      body.setVelocityX(this.speed);
    }

    // Vertical movement
    if (this.cursors.up.isDown || this.keys.W.isDown) {
      body.setVelocityY(-this.speed);
    } else if (this.cursors.down.isDown || this.keys.S.isDown) {
      body.setVelocityY(this.speed);
    }

    // Normalize diagonal speed
    body.velocity.normalize().scale(this.speed);
  }

  /**
   * Handles interaction (e.g., talk to NPC, open door)
   */
  interact() {
    console.log('Interaction triggered');
    // Later: check for nearby interactive objects
  }
}
