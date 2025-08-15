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
    }

    loadManifest(manifestKey) {
        const manifest = this.scene.cache.json.get(manifestKey);
        if (!manifest || !manifest.maps) {
            console.error("Map manifest missing or invalid");
            return;
        }
        manifest.maps.forEach(mapName => {
            // NOTE: index.html is in src/, so use ../assets path
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

    // Store collidable objects here
    const solidObjects = this.scene.physics.add.staticGroup();

    mapData.objects.forEach(obj => {
        const sprite = this.createSpriteForObject(obj);

        // Attach map data reference
        sprite.mapData = obj;
        sprite.setData && sprite.setData('mapData', obj);

        if (obj.solid) {
            this.scene.physics.add.existing(sprite, true); // true = static body
            solidObjects.add(sprite); // add to collider group
        }
        if (obj.interactable) {
            this.interactiveObjects.push(sprite);
        }
    });

    // ✅ Add collision so player can't go through solid objects
    if (solidObjects.getChildren().length > 0 && this.scene.player?.sprite) {
        this.scene.physics.add.collider(this.scene.player.sprite, solidObjects);
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
        // avoid slashes in generated keys (some servers / texture APIs dislike them)
        const idPart = (obj.id || obj.name || obj.type).toString().replace(/\s+/g, '_');
        return `${folder}_${obj.type}_${idPart}`;
    }

    createObjectSprite(obj, textureKey, color) {
    // ✅ Ensure width/height are at least 1 tile to prevent Phaser crash
    const safeWidth = (obj.width || 1) * this.tileSize;
    const safeHeight = (obj.height || 1) * this.tileSize;

    const centerX = (obj.x * this.tileSize) + (safeWidth / 2);
    const centerY = (obj.y * this.tileSize) + (safeHeight / 2);

    if (this.scene.textures.exists(textureKey)) {
        return this.scene.add.image(centerX, centerY, textureKey)
            .setDisplaySize(safeWidth, safeHeight);
    } else {
        const g = this.scene.add.graphics();
        g.fillStyle(color, 1);
        g.fillRect(0, 0, safeWidth, safeHeight);

        const texKey = `placeholder_${obj.type}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        g.generateTexture(texKey, safeWidth, safeHeight);
        g.destroy();

        return this.scene.add.image(centerX, centerY, texKey);
    }
}


    clearMap() {
        this.interactiveObjects.forEach(obj => {
            if (obj && obj.destroy) obj.destroy();
        });
        this.interactiveObjects = [];
    }
}
