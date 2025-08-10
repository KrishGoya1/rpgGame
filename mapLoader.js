export class MapLoader {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.tileSize = 50;
        this.interactiveObjects = [];
        this.mapObjects = [];
    }

    clearPreviousMap() {
        this.mapObjects.forEach(obj => {
            if (obj && obj.destroy) obj.destroy();
        });
        this.mapObjects = [];
        this.interactiveObjects = [];
    }

    loadMap(mapKey) {
        const mapData = this.scene.cache.json.get(mapKey);
        if (!mapData) {
            console.error(`Map data for "${mapKey}" not found`);
            return;
        }

        this.tileSize = mapData.tileSize || 50;
        this.clearPreviousMap();
        this.currentMap = mapKey;

        mapData.objects.forEach(obj => {
            const x = obj.x * this.tileSize;
            const y = obj.y * this.tileSize;
            const width = (obj.width || 1) * this.tileSize;
            const height = (obj.height || 1) * this.tileSize;

            let gameObject;

            // If texture exists, use it
            if (obj.id && this.scene.textures.exists(obj.id)) {
                gameObject = this.scene.add.image(x + width / 2, y + height / 2, obj.id);
                gameObject.displayWidth = width;
                gameObject.displayHeight = height;
            } else {
                // Fallback color based on type
                let color = 0x888888;
                switch (obj.type) {
                    case "item": color = 0xff0000; break;
                    case "building": color = 0x0000ff; break;
                    case "entrance": color = 0x00ff00; break;
                    case "wall": color = 0xffffff; break;
                    case "worldBorder": color = 0x000000; break;
                }
                gameObject = this.scene.add.rectangle(x + width / 2, y + height / 2, width, height, color, 0.8);
            }

            this.scene.physics.add.existing(gameObject, true);
            gameObject.data = obj;

            if (obj.solid) {
                this.scene.physics.add.collider(this.scene.player.sprite, gameObject);
            }

            if (obj.interactable) {
                this.interactiveObjects.push(gameObject);
            }

            this.mapObjects.push(gameObject);
        });

        // Handle spawn from an entrance
        if (this.scene.pendingEntranceId) {
            const match = mapData.objects.find(o => o.type === "entrance" && o.id === this.scene.pendingEntranceId);
            if (match && this.scene.player?.sprite) {
                const spawnX = (match.x * this.tileSize) + (this.tileSize / 2);
                const spawnY = (match.y * this.tileSize) + (this.tileSize / 2);
                this.scene.player.sprite.setPosition(spawnX, spawnY);
            }
            this.scene.pendingEntranceId = null;
        } else {
            const spawn = mapData.objects.find(o => o.type === "spawn");
            if (spawn && this.scene.player?.sprite) {
                const spawnX = (spawn.x * this.tileSize) + (this.tileSize / 2);
                const spawnY = (spawn.y * this.tileSize) + (this.tileSize / 2);
                this.scene.player.sprite.setPosition(spawnX, spawnY);
            }
        }

        // Camera follow
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.startFollow(this.scene.player.sprite);
        }
    }
}
