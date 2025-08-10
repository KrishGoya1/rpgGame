// mapLoader.js — final version with .mapData fix, spawn + entrance + debug
export class MapLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.tileSize = 50; // overridden by JSON
    this._visuals = [];
    this._bodies = [];
    this._colliders = [];
    this.interactiveObjects = [];
  }

  ensurePixelTexture() {
    if (!this.scene.textures.exists("__px")) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("__px", 1, 1);
      gfx.destroy();
    }
  }

  clearPreviousMap() {
    this._colliders.forEach(c => { if (c?.destroy) c.destroy(); });
    this._bodies.forEach(b => { if (b?.destroy) b.destroy(); });
    this._visuals.forEach(v => { if (v?.destroy) v.destroy(); });
    this._colliders.length = 0;
    this._bodies.length = 0;
    this._visuals.length = 0;
    this.interactiveObjects.length = 0;
  }

  loadMap(jsonKey) {
    const mapData = this.scene.cache.json.get(jsonKey);
    if (!mapData) {
      console.error(`Map JSON '${jsonKey}' not found`);
      return;
    }

    this.clearPreviousMap();
    this.tileSize = mapData.tileSize || this.tileSize;
    this.ensurePixelTexture();

    let spawnObj = null;

    mapData.objects.forEach(obj => {
      const px = obj.x * this.tileSize;
      const py = obj.y * this.tileSize;
      const pw = (obj.width || 1) * this.tileSize;
      const ph = (obj.height || 1) * this.tileSize;

      // SPAWN POINTS
      if (obj.type === "spawn") {
        if (this.scene.pendingSpawnName) {
          if (obj.name === this.scene.pendingSpawnName) spawnObj = obj;
        } else if (!spawnObj) {
          spawnObj = obj;
        }
        return;
      }

      // WALLS & BORDERS
      if (obj.type === "worldBorder" || obj.type === "wall") {
        const color = obj.type === "worldBorder" ? 0xff0000 : 0x0000ff;
        if (this.scene.debugMode) {
          this._visuals.push(this.renderer.drawObject(px, py, pw, ph, color));
          this._visuals.push(this.scene.add.text(px, py - 12, obj.type, { fontSize: '12px', fill: '#fff' }));
        }
        const wall = this.scene.physics.add.staticImage(px, py, "__px")
          .setOrigin(0, 0).setDisplaySize(pw, ph).setVisible(false);
        if (wall.body) wall.body.setSize(pw, ph).setOffset(0, 0);
        this._bodies.push(wall);
        if (this.scene.player?.sprite) {
          this._colliders.push(this.scene.physics.add.collider(this.scene.player.sprite, wall));
        }
      }

      // ITEMS
      if (obj.type === "item") {
        if (this.scene.debugMode) {
          this._visuals.push(this.renderer.drawObject(px, py, pw, ph, 0xffff00));
          this._visuals.push(this.scene.add.text(px, py - 12, obj.name || "Item", { fontSize: '12px', fill: '#000' }));
        }
        const itemBody = this.scene.physics.add.staticImage(px, py, "__px")
          .setOrigin(0, 0).setDisplaySize(pw, ph).setVisible(false);
        if (itemBody.body) itemBody.body.setSize(pw, ph).setOffset(0, 0);
        itemBody.mapData = obj; // store map JSON in .mapData
        this._bodies.push(itemBody);
        this.interactiveObjects.push(itemBody);
        if (this.scene.player?.sprite) {
          this._colliders.push(this.scene.physics.add.overlap(
            this.scene.player.sprite, itemBody,
            () => { this.scene.player.nearbyObject = itemBody; }
          ));
        }
      }

      // ENTRANCES
      if (obj.type === "entrance") {
        if (this.scene.debugMode) {
          this._visuals.push(this.renderer.drawObject(px, py, pw, ph, 0x00ff00));
          this._visuals.push(this.scene.add.text(px, py - 12, "Entrance", { fontSize: '12px', fill: '#fff' }));
        }
        const entranceBody = this.scene.physics.add.staticImage(px, py, "__px")
          .setOrigin(0, 0).setDisplaySize(pw, ph).setVisible(false);
        if (entranceBody.body) entranceBody.body.setSize(pw, ph).setOffset(0, 0);
        entranceBody.mapData = obj; // store map JSON in .mapData
        this._bodies.push(entranceBody);
        this.interactiveObjects.push(entranceBody);
        if (this.scene.player?.sprite) {
          this._colliders.push(this.scene.physics.add.overlap(
            this.scene.player.sprite, entranceBody,
            () => { this.scene.player.nearbyObject = entranceBody; }
          ));
        }
      }
    });

    // Physics & camera bounds
    this.scene.physics.world.setBounds(0, 0, (mapData.width || 0) * this.tileSize, (mapData.height || 0) * this.tileSize);
    this.scene.cameras.main.setBounds(0, 0, (mapData.width || 0) * this.tileSize, (mapData.height || 0) * this.tileSize);

    // Move player to spawn point
    if (spawnObj && this.scene.player?.sprite) {
      const spawnX = (spawnObj.x * this.tileSize) + (this.tileSize / 2);
      const spawnY = (spawnObj.y * this.tileSize) + (this.tileSize / 2);
      this.scene.player.sprite.setPosition(spawnX, spawnY);
    }
    this.scene.pendingSpawnName = null;

    // Keep player on top
    if (this.scene.player?.sprite) {
      this.scene.player.sprite.setDepth(1000);
    }
  }
}
