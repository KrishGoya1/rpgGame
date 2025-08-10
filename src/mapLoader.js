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
            this.scene.load.json(mapName, `assets/maps/${mapName}.json`);
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

        mapData.objects.forEach(obj => {
            const sprite = this.createSpriteForObject(obj);
            if (obj.solid) this.scene.physics.add.existing(sprite, true);
            if (obj.interactable) {
                sprite.setData("objectData", obj);
                this.interactiveObjects.push(sprite);
            }
        });

        // Spawn player if spawn or entrance target
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
        return `${folder}/${obj.type}_${obj.id || obj.name || obj.type}`;
    }

    createObjectSprite(obj, textureKey, color) {
        const centerX = (obj.x * this.tileSize) + (obj.width * this.tileSize / 2);
        const centerY = (obj.y * this.tileSize) + (obj.height * this.tileSize / 2);

        if (this.scene.textures.exists(textureKey)) {
            return this.scene.add.image(centerX, centerY, textureKey)
                .setDisplaySize(obj.width * this.tileSize, obj.height * this.tileSize);
        } else {
            const g = this.scene.add.graphics();
            g.fillStyle(color, 1);
            g.fillRect(0, 0, obj.width * this.tileSize, obj.height * this.tileSize);
            const texKey = `placeholder_${obj.type}_${Phaser.Math.RND.uuid()}`;
            g.generateTexture(texKey, obj.width * this.tileSize, obj.height * this.tileSize);
            g.destroy();
            return this.scene.add.image(centerX, centerY, texKey);
        }
    }

    clearMap() {
        this.interactiveObjects.forEach(obj => obj.destroy());
        this.interactiveObjects = [];
    }
}
