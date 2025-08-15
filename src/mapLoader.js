export class MapLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.maps = {};
    this.currentMap = null;
    this.tileSize = 50;
    this.interactiveObjects = [];

    this.typeColors = {
      "item": 0xff0000,
      "building": 0x0000ff,
      "entrance": 0x00ff00,
      "wall": 0xffffff,
      "worldBorder": 0x000000
    };

    this.solidGroup = null;
    this.playerCollider = null;
  }

  loadManifest(manifestKey) {
    const manifest = this.scene.cache.json.get(manifestKey);
    if (!manifest || !manifest.maps) {
      console.error("Map manifest missing or invalid");
      return;
    }
    manifest.maps.forEach(mapName => {
      this.scene.load.json(mapName, `../assets/maps/${mapName}.json`);
    });
    this.scene.load.start();
  }

  loadMap(mapName) {
    const mapData = this.scene.cache.json.get(mapName);
    if (!mapData) {
      console.error(`Map data for "${mapName}" not found`);
      return;
    }

    this.clearMap();

    this.tileSize = mapData.tileSize || 50;
    this.currentMap = mapName;

    // Create fresh static group for colliders
    this.solidGroup = this.scene.physics.add.staticGroup();

    mapData.objects.forEach(obj => {
      const sprite = this.createSpriteForObject(obj);

      // Attach map data reference
      sprite.mapData = obj;
      sprite.setData && sprite.setData('mapData', obj);

      if (obj.solid) {
        this.scene.physics.add.existing(sprite, true);
        // Ensure physics body matches visual size and is centered
        if (sprite.body && sprite.body.setSize) {
          sprite.body.setSize(sprite.displayWidth, sprite.displayHeight, true);
          sprite.body.updateFromGameObject?.();
        }
        this.solidGroup.add(sprite);
      }
      if (obj.interactable) {
        this.interactiveObjects.push(sprite);
      }
    });

    // Add collision so player can't go through solid objects
    if (this.solidGroup.getChildren().length > 0 && this.scene.player?.sprite) {
      this.playerCollider = this.scene.physics.add.collider(this.scene.player.sprite, this.solidGroup);
    }

    // Spawn player
    let spawnPoint = mapData.objects.find(o => o.type === "spawn");
    if (this.scene.pendingEntranceId) {
      const match = mapData.objects.find(o => o.id === this.scene.pendingEntranceId);
      if (match) spawnPoint = match;
      this.scene.pendingEntranceId = null;
    }
    if (spawnPoint && this.scene.player?.sprite) {
      this.scene.player.sprite.setPosition(
        (spawnPoint.x * this.tileSize) + (this.tileSize / 2),
        (spawnPoint.y * this.tileSize) + (this.tileSize / 2)
      );
    }

    // Set world bounds
    const worldPxWidth = (mapData.width || 0) * this.tileSize;
    const worldPxHeight = (mapData.height || 0) * this.tileSize;
    this.scene.physics.world.setBounds(0, 0, worldPxWidth, worldPxHeight);
  }

  createSpriteForObject(obj) {
    const textureKey = this.getTextureKey(obj);
    const color = this.typeColors[obj.type] || 0xffff00;
    return this.createObjectSprite(obj, textureKey, color);
  }

  getTextureKey(obj) {
    if (obj.texture) return obj.texture;
    let folder = "misc";
    if (obj.type === "item") folder = "items";
    if (obj.type === "building") folder = "buildings";
    if (obj.type === "npc") folder = "npc";
    const idPart = (obj.id || obj.name || obj.type).toString().replace(/\s+/g, '_');
    return `\${folder}_\${obj.type}_\${idPart}`;
  }

  createObjectSprite(obj, textureKey, color) {
    // Ensure width/height are at least 1 tile
    const safeWidth = (obj.width || 1) * this.tileSize;
    const safeHeight = (obj.height || 1) * this.tileSize;

    const centerX = (obj.x * this.tileSize) + (safeWidth / 2);
    const centerY = (obj.y * this.tileSize) + (safeHeight / 2);

    let sprite;
    if (this.scene.textures.exists(textureKey)) {
      sprite = this.scene.add.image(centerX, centerY, textureKey).setDisplaySize(safeWidth, safeHeight);
    } else {
      // Use a deterministic placeholder key to avoid leaking textures
      const texKey = `placeholder_\${obj.type}_\${safeWidth}x\${safeHeight}`;
      if (!this.scene.textures.exists(texKey)) {
        const g = this.scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, safeWidth, safeHeight);
        g.generateTexture(texKey, safeWidth, safeHeight);
        g.destroy();
      }
      sprite = this.scene.add.image(centerX, centerY, texKey);
    }

    // Centered origin works best with physics sizing above
    sprite.setOrigin(0.5);
    // Slight layering by Y for nicer overlap
    sprite.setDepth(Math.floor(centerY));

    return sprite;
  }

  clearMap() {
    // Destroy interactables
    this.interactiveObjects.forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.interactiveObjects = [];

    // Destroy solid group & collider from previous map
    if (this.playerCollider) {
      this.playerCollider.destroy();
      this.playerCollider = null;
    }
    if (this.solidGroup) {
      this.solidGroup.clear(true, true);
      this.solidGroup = null;
    }
  }
}
