import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { CameraController } from './camera.js';
import { MapLoader } from './mapLoader.js';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.debugMode = false;
    this.pendingEntranceId = null;
    this._manifestKeys = [];
    this.hintText = null;
    this.dialogText = null;
    this.removedObjectIds = new Set(); // Track removed objects
  }

  preload() {
    this.load.json('mapManifest', '../assets/maps/index.json');
    this.add.graphics()
      .fillStyle(0xffff00, 1)
      .fillRect(0, 0, 40, 40)
      .generateTexture('player', 40, 40);
  }

  create() {
    if (this.input.keyboard) {
      this.input.keyboard.addCapture([
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D
      ]);
    }

    const manifestRaw = this.cache.json.get('mapManifest');
    let manifestFiles = [];
    if (Array.isArray(manifestRaw)) {
      manifestFiles = manifestRaw.slice();
    } else if (manifestRaw && Array.isArray(manifestRaw.maps)) {
      manifestFiles = manifestRaw.maps.slice();
    } else {
      console.warn('Map manifest missing or invalid — falling back to ["map1"]');
      manifestFiles = ['map1'];
    }

    this._manifestKeys = [];
    manifestFiles.forEach(entry => {
      if (!entry) return;
      let filename = String(entry);
      const hasExt = filename.toLowerCase().endsWith('.json');
      const key = hasExt ? filename.slice(0, -5) : filename;
      const path = hasExt ? `../assets/maps/${filename}` : `../assets/maps/${key}.json`;
      this.load.json(key, path);
      this._manifestKeys.push(key);
    });

    this.renderer = new Renderer(this);
    this.player = new Player(this, 100, 100);
    this.inventory = [];
    this.mapLoader = new MapLoader(this, this.renderer);

    this.objectInteractions = {
      sayHello: (body, scene, player) => {
        const msg = body.mapData?.text || "Hello!";
        scene.showDialog(msg);
      },
      giveItem: (body, scene, player) => {
        const name = body.mapData?.name || "Mysterious Item";
        scene.inventory.push(name);
        scene.showDialog(`Picked up: ${name}`);
        if (body.mapData?.id) {
          scene.removedObjectIds.add(body.mapData.id);
        }
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

    this.showDialog = (text) => {
      if (this.dialogText) this.dialogText.destroy();
      this.dialogText = this.add.text(this.player.sprite.x, this.player.sprite.y - 60, text, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 8, y: 6 }
      }).setOrigin(0.5).setDepth(2000);
      this.time.delayedCall(1800, () => {
        if (this.dialogText) {
          this.dialogText.destroy();
          this.dialogText = null;
        }
      });
    };

    this.hintText = this.add.text(0, 0, 'Press SPACE to interact', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(2000).setVisible(false);

    this.load.once('complete', () => {
      const startingKey = this._manifestKeys.includes('map1') ? 'map1' : (this._manifestKeys[0] || 'map1');
      this.mapLoader.loadMap(startingKey);

      this.cameraController = new CameraController(
        this,
        this.player.sprite,
        this.physics.world.bounds.width,
        this.physics.world.bounds.height
      );
    });

    this.load.start();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.scene.pause();
      else this.scene.resume();
    });
  }

  update() {
    if (this.mapLoader && this.mapLoader.currentMap) {
      this.player.update();

      // Feet-based depth sorting
      this.player.sprite.setDepth(this.player.sprite.y + (this.player.sprite.displayHeight / 2));

      if (this.player.nearbyObject) {
        this.hintText.setPosition(this.player.sprite.x, this.player.sprite.y - 40);
        this.hintText.setVisible(true);
      } else {
        this.hintText.setVisible(false);
      }

      if (Phaser.Input.Keyboard.JustDown(this.player.keys.SPACE)) {
        this.player.interact();
      }
    }

    if (this.dialogText) {
      this.dialogText.setPosition(this.player.sprite.x, this.player.sprite.y - 60);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#000',
  parent: 'game-container',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { y: 0 } }
  },
  scene: [MainScene]
};

new Phaser.Game(config);
