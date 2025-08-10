// MapLoader.js (updated)
export class MapLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.tileSize = 50; // default, overridden by JSON
  }

  ensurePixelTexture() {
    // create a 1x1 white pixel texture if it doesn't exist
    if (!this.scene.textures.exists("__px")) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("__px", 1, 1);
      gfx.destroy();
    }
  }

  loadMap(jsonKey) {
    const mapData = this.scene.cache.json.get(jsonKey);
    if (!mapData) {
      console.error(`Map JSON '${jsonKey}' not found`);
      return;
    }

    this.tileSize = mapData.tileSize || this.tileSize;
    const objects = mapData.objects || [];

    // Ensure we have a pixel texture for consistent sprites/bodies.
    this.ensurePixelTexture();

    // Make sure player is drawn above walls
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.player.sprite.setDepth(10);
    }

    objects.forEach(obj => {
      const px = obj.x * this.tileSize;
      const py = obj.y * this.tileSize;
      const pw = (obj.width || 1) * this.tileSize;
      const ph = (obj.height || 1) * this.tileSize;

      if (obj.type === "worldBorder" || obj.type === "wall") {
        // color: red for border, blue for in-world walls
        const color = obj.type === "worldBorder" ? 0xff0000 : 0x0000ff;

        // Draw a visible debug rectangle using the renderer (top-left origin)
        // (optional) If you prefer no visible rectangle, comment out this line.
        this.renderer.drawObject(px, py, pw, ph, color);

        // Create a proper staticImage that uses a real texture so display/body line up
        const wall = this.scene.physics.add
          .staticImage(px, py, "__px") // top-left world pos
          .setOrigin(0, 0)             // top-left origin
          .setDisplaySize(pw, ph);

        // Optionally tint the visible rectangle (only visible if you leave wall visible)
        wall.setTint(color);

        // Ensure physics body matches display size and has zero offset
        if (wall.body) {
          wall.body.setSize(pw, ph);
          wall.body.setOffset(0, 0);
        }

        // Keep the physics sprite hidden if you don't want duplicate visuals
        // (we already drew with renderer.drawObject). If you want to see the actual texture,
        // comment out the next line.
        wall.setVisible(false);

        // Add collider between player and wall
        if (this.scene.player && this.scene.player.sprite) {
          this.scene.physics.add.collider(this.scene.player.sprite, wall);
        }
      }

      if (obj.type === "item") {
        // Draw item (visible)
        this.renderer.drawObject(px, py, pw, ph, 0xffff00);

        // Create a sensor for pickup collisions (optional)
        const itemBody = this.scene.physics.add.staticImage(px, py, "__px")
          .setOrigin(0, 0)
          .setDisplaySize(pw, ph)
          .setVisible(false);

        if (itemBody.body) {
          itemBody.body.setSize(pw, ph);
          itemBody.body.setOffset(0, 0);
        }

        // Example overlap: when player overlaps item, pick it up
        if (this.scene.player && this.scene.player.sprite) {
          this.scene.physics.add.overlap(
            this.scene.player.sprite,
            itemBody,
            () => {
              // remove visuals and body
              itemBody.destroy();
              // you can add a proper event here, e.g. scene.events.emit('pickup', obj);
              this.scene.ui && this.scene.ui.show && this.scene.ui.show("Picked up item!");
            },
            null,
            this
          );
        }
      }
    });

    // Set bounds for physics and camera
    this.scene.physics.world.setBounds(
      0,
      0,
      (mapData.width || 0) * this.tileSize,
      (mapData.height || 0) * this.tileSize
    );
    this.scene.cameras.main.setBounds(
      0,
      0,
      (mapData.width || 0) * this.tileSize,
      (mapData.height || 0) * this.tileSize
    );
  }
}
