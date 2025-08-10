export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.speed = 200;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(this.sprite.width, this.sprite.height);
    this.sprite.body.setOffset(0, 0);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.nearbyObject = null;
  }

  update() {
    // Reset nearby each frame
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

    body.velocity.normalize().scale(this.speed);

    // --- Improved interaction detection ---
    // Prefer precise physics overlap; fall back to a small distance test
  // --- Improved interaction detection ---
this.nearbyObject = null;
const interactables = this.scene.mapLoader.interactiveObjects;
for (let i = 0; i < interactables.length; i++) {
  const obj = interactables[i];
  
  // Compute distance from player center to object center
  const px = this.sprite.x;
  const py = this.sprite.y;
  const ox = obj.x + (obj.displayWidth / 2);
  const oy = obj.y + (obj.displayHeight / 2);
  const dist = Phaser.Math.Distance.Between(px, py, ox, oy);

  // Interaction radius — set bigger than tile size
  const interactionRadius = (this.scene.mapLoader?.tileSize || 50) * 1.2;

  if (dist <= interactionRadius) {
    this.nearbyObject = obj;
    break;
  }
}

  }

  interact() {
    if (!this.nearbyObject || !this.nearbyObject.mapData) {
      console.log("Nothing to interact with.");
      return;
    }

    const obj = this.nearbyObject.mapData;

    if (!obj.interactable) {
      console.log("This object is not interactable.");
      return;
    }

    // If the object is an entrance, ensure we set pendingEntranceId to the targetId
    if (obj.type === "entrance" && obj.targetMap && obj.targetId) {
      // store target id (the entrance id we want to appear at in the destination map)
      this.scene.pendingEntranceId = obj.targetId;
      // then call the registered interaction function (if any) so behavior is consistent
      if (obj.interactFunction && typeof this.scene.objectInteractions?.[obj.interactFunction] === 'function') {
        this.scene.objectInteractions[obj.interactFunction](this.nearbyObject, this.scene, this);
      } else {
        // fallback: directly change maps (keeps backwards compatibility)
        this.scene.mapLoader.loadMap(obj.targetMap);
      }
      return;
    }

    // For other interactables, call object's function via registry if exists
    if (obj.interactFunction && typeof this.scene.objectInteractions?.[obj.interactFunction] === 'function') {
      this.scene.objectInteractions[obj.interactFunction](this.nearbyObject, this.scene, this);
      return;
    }

    console.log("Interacted with object:", obj.type);
  }
}
