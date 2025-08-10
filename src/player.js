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
    this.nearbyObject = null;

    const body = this.sprite.body;
    body.setVelocity(0);

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

    // Interaction radius detection (uses physics bodies created by MapLoader)
    const interactables = (this.scene.mapLoader && this.scene.mapLoader.interactiveObjects) ? this.scene.mapLoader.interactiveObjects : [];
    for (let i = 0; i < interactables.length; i++) {
      const obj = interactables[i];
      if (!obj || !obj.mapData) continue;

      // obj is the static body created at top-left (setOrigin(0,0)), so compute its center:
      const ox = obj.x + (obj.displayWidth / 2);
      const oy = obj.y + (obj.displayHeight / 2);

      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, ox, oy);

      // make radius configurable per-object, fallback to 1.2 tiles
      const interactionRadius = (obj.mapData?.interactionRadius) || ((this.scene.mapLoader?.tileSize || 50) * 1.2);

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

    // If it's an entrance, set pendingEntranceId to targetId first (so target map knows where to spawn)
    if ((obj.type === 'entrance' || obj.type === 'exit') && obj.targetMap && obj.targetId) {
      this.scene.pendingEntranceId = obj.targetId;
      // prefer calling object's registered function, else fallback to direct map load
      if (obj.interactFunction && typeof this.scene.objectInteractions?.[obj.interactFunction] === 'function') {
        this.scene.objectInteractions[obj.interactFunction](this.nearbyObject, this.scene, this);
      } else {
        this.scene.mapLoader.loadMap(obj.targetMap);
      }
      return;
    }

    // otherwise call registered interaction
    if (obj.interactFunction && typeof this.scene.objectInteractions?.[obj.interactFunction] === 'function') {
      this.scene.objectInteractions[obj.interactFunction](this.nearbyObject, this.scene, this);
      return;
    }

    console.log('Interacted with object:', obj.type);
  }
}
