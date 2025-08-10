import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { CameraController } from './camera.js';
import { MapLoader } from './mapLoader.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.debugMode = true;
    }

    preload() {
        // Load manifest
        this.load.json("mapManifest", "assets/maps/index.json");

        // Player placeholder texture
        this.add.graphics()
            .fillStyle(0xffff00, 1)
            .fillRect(0, 0, 40, 40)
            .generateTexture('player', 40, 40);
    }

    create() {
        const manifest = this.cache.json.get("mapManifest");

        if (!manifest || !manifest.maps) {
            console.error("Map manifest missing or invalid");
            return;
        }

        // Queue all map JSON loads
        manifest.maps.forEach(mapKey => {
            this.load.json(mapKey, `assets/maps/${mapKey}.json`);
        });

        // Create renderer, player, and inventory now
        this.renderer = new Renderer(this);
        this.player = new Player(this, 100, 100);
        this.inventory = [];

        // Map loader
        this.mapLoader = new MapLoader(this, this.renderer);

        // After all maps load, then load starting map and set up camera
        this.load.once('complete', () => {
            this.mapLoader.loadMap('map1');

            this.cameraController = new CameraController(
                this,
                this.player.sprite,
                this.physics.world.bounds.width,
                this.physics.world.bounds.height
            );
        });

        // Start loading the queued map files
        this.load.start();
    }

    update() {
        if (this.mapLoader.currentMap) {
            this.player.update();
            if (Phaser.Input.Keyboard.JustDown(this.player.keys.SPACE)) {
                this.player.interact();
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    backgroundColor: '#000',
    parent: 'game-container',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [MainScene]
};

new Phaser.Game(config);
