import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { CameraController } from './camera.js';
import { MapLoader } from './mapLoader.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.debugMode = true;
    this.pendingEntranceId = null;
  }

  preload() {
    // load manifest (manifest can be either an array ["map1.json", ...]
    // or an object { "maps": ["map1", ...] } — we handle both in create()
    // === NOTE: index.html is inside src/, maps folder is ../assets/maps
    this.load.json('mapManifest', '../assets/maps/index.json');

    // placeholder player texture
    this.add.graphics()
      .fillStyle(0xffff00, 1)
      .fillRect(0, 0, 40, 40)
      .generateTexture('player', 40, 40);
  }

  create() {
    // read the manifest (already loaded during preload)
    const manifestRaw = this.cache.json.get('mapManifest');

    // Manifest can be either:
    //  - an array like ["map1.json","pokecenter_interior.json"]
    //  - an object like { "maps": ["map1","pokecenter_interior"] }
    let manifestFiles = [];
    if (Array.isArray(manifestRaw)) {
      manifestFiles = manifestRaw.slice(); // copy
    } else if (manifestRaw && Array.isArray(manifestRaw.maps)) {
      manifestFiles = manifestRaw.maps.slice();
    } else {
      console.warn('Map manifest missing or invalid — falling back to ["map1"]');
      manifestFiles = ['map1']; // no extension — we normalize below
    }

    // Normalize entries: ensure each entry is a filename (with extension) and compute keys
    // We'll queue loads using keys without extension (e.g., 'map1') so cache key is predictable.
    this._manifestKeys = []; // store keys we requested
    manifestFiles.forEach(entry => {
      if (!entry) return;
      let filename = String(entry);
      // If user provided e.g. "map1" (no extension), add .json for path; if they provided "map1.json", keep it.
      const hasExt = filename.toLowerCase().endsWith('.json');
      const key = hasExt ? filename.slice(0, -5) : filename;
      // IMPORTANT: index.html is in src/, so relative path to assets is ../assets
      const path = hasExt ? `../assets/maps/${filename}` : `../assets/maps/${key}.json`;
      this.load.json(key, path);
      this._manifestKeys.push(key);
    });

    // Create renderer, player and mapLoader early (player must exist for physics callbacks to attach)
    this.renderer = new Renderer(this);
    this.player = new Player(this, 100, 100);
    this.inventory = [];
    this.mapLoader = new MapLoader(this, this.renderer);

    // Object interactions registry (add more functions here)
    this.objectInteractions = {
      sayHello: (body, scene, player) => {
        const msg = body.mapData?.text || "Hello!";
        scene.showDialog(msg);
      },
      giveItem: (body, scene, player) => {
        const name = body.mapData?.name || "Mysterious Item";
        scene.inventory.push(name);
        scene.showDialog(`Picked up: ${name}`);
        // destroy both body and any visual linked to it (mapLoader cleans visuals)
        body.destroy();
      },
      goToBuilding: (body, scene, player) => {
        const data = body.mapData;
        if (data?.targetMap && data?.targetId) {
          scene.pendingEntranceId = data.targetId;
          scene.mapLoader.loadMap(data.targetMap);
        } else {
          console.warn('goToBuilding missing targetMap/targetId', data);
        }
      },
      readSign: (body, scene, player) => {
        const txt = body.mapData?.text || '';
        scene.showDialog(txt);
      },
      healPokemon: (body, scene, player) => {
        scene.showDialog(body.mapData?.text || 'Your Pokémon feel refreshed.');
      },
      openShop: (body, scene, player) => {
        scene.showDialog('Shop UI not implemented yet.');
      }
    };

    // small dialog helper
    this.dialogText = null;
    this.showDialog = (text) => {
      if (this.dialogText) this.dialogText.destroy();
      this.dialogText = this.add.text(this.player.sprite.x, this.player.sprite.y - 60, text, {
        fontSize: '14px', fill: '#fff', backgroundColor: '#000', padding: { x: 6, y: 4 }
      }).setOrigin(0.5).setDepth(2000);
      this.time.delayedCall(1800, () => {
        if (this.dialogText) {
          this.dialogText.destroy();
          this.dialogText = null;
        }
      });
    };

    // When all queued map JSON files finish loading:
    this.load.once('complete', () => {
      // choose starting map key: prefer 'map1' if present, else first manifest key
      const startingKey = this._manifestKeys.includes('map1') ? 'map1' : (this._manifestKeys[0] || 'map1');

      // load the starting map (mapLoader will position player / set bounds)
      this.mapLoader.loadMap(startingKey);

      // Create camera controller now that world bounds are set
      this.cameraController = new CameraController(
        this,
        this.player.sprite,
        this.physics.world.bounds.width,
        this.physics.world.bounds.height
      );
    });

    // start queued map loading (this triggers the 'complete' event when done)
    this.load.start();
  }

  update() {
    // only allow updates once a map is loaded
    if (this.mapLoader && this.mapLoader.currentMap) {
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
