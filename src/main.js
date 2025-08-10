export class MapLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.tileSize = 50;
    this.currentMap = null;

    // bookkeeping arrays for cleanup
    this.mapObjects = [];      // all visual GameObjects (images, rectangles, texts)
    this.mapBodies = [];       // physics bodies we create (staticImage sensors)
    this.colliders = [];       // collider/overlap objects to destroy
    this.interactiveObjects = []; // bodies that are interactable (sensors)
  }

  ensurePixelTexture() {
    if (!this.scene.textures.exists('__px')) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture('__px', 1, 1);
      gfx.destroy();
    }
  }

  clearPreviousMap() {
    // destroy colliders first
    this.colliders.forEach(c => { try { c.destroy(); } catch (e) {} });
    this.colliders = [];

    // destroy physics bodies and visuals
    this.mapBodies.forEach(b => { try { b.destroy(); } catch (e) {} });
    this.mapBodies = [];

    this.mapObjects.forEach(o => { try { o.destroy(); } catch (e) {} });
    this.mapObjects = [];

    this.interactiveObjects = [];
  }

  loadMap(mapKey) {
    const mapData = this.scene.cache.json.get(mapKey);
    if (!mapData) {
      console.error(`Map data for "${mapKey}" not found`);
      return;
    }

    this.clearPreviousMap();
    this.tileSize = mapData.tileSize || 50;
    this.currentMap = mapKey;
    this.ensurePixelTexture();

    // create visuals + physics bodies
    mapData.objects.forEach(obj => {
      const px = obj.x * this.tileSize;
      const py = obj.y * this.tileSize;
      const pw = (obj.width || 1) * this.tileSize;
      const ph = (obj.height || 1) * this.tileSize;

      // VISUAL (image if texture exists, else colored rectangle depending on type)
      let visual;
      if (obj.id && this.scene.textures.exists(obj.id)) {
        visual = this.scene.add.image(px + pw/2, py + ph/2, obj.id).setDisplaySize(pw, ph).setOrigin(0.5);
      } else {
        // fallback color by type
        let color = 0x999999;
        switch (obj.type) {
          case 'item': color = 0xff0000; break;       // red
          case 'building': color = 0x0000ff; break;   // blue
          case 'entrance': color = 0x00ff00; break;   // green
          case 'wall': color = 0xffffff; break;       // white
          case 'worldBorder': color = 0x000000; break;// black
          default: color = 0x999999;
        }
        visual = this.scene.add.rectangle(px + pw/2, py + ph/2, pw, ph, color, 0.9).setOrigin(0.5);
      }
      this.mapObjects.push(visual);

      // Optional debug label
      if (this.scene.debugMode) {
        const label = this.scene.add.text(px + pw/2, py - 10, obj.id || obj.type || '', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.mapObjects.push(label);
      }

      // PHYSICS BODY (invisible) - top-left origin, so x=px,y=py
      const body = this.scene.physics.add.staticImage(px, py, '__px').setOrigin(0, 0).setDisplaySize(pw, ph).setVisible(false);

      // store metadata safely
      body.mapData = obj;

      // keep track of body so we can clean up later
      this.mapBodies.push(body);

      // collisions for solids
      if (obj.solid && this.scene.player?.sprite) {
        const col = this.scene.physics.add.collider(this.scene.player.sprite, body);
        this.colliders.push(col);
      }

      // add to interactive list and optional overlap callback (so overlap immediate sets nearbyObject)
      if (obj.interactable && this.scene.player?.sprite) {
        this.interactiveObjects.push(body);
        const overlap = this.scene.physics.add.overlap(this.scene.player.sprite, body, () => {
          // when physics overlap occurs, set player's nearbyObject directly
          if (this.scene.player) this.scene.player.nearbyObject = body;
        });
        this.colliders.push(overlap);
      }
    });

    // set world & camera bounds based on map size (if available)
    const mapPixelW = (mapData.width || 0) * this.tileSize;
    const mapPixelH = (mapData.height || 0) * this.tileSize;
    if (mapPixelW > 0 && mapPixelH > 0) {
      this.scene.physics.world.setBounds(0, 0, mapPixelW, mapPixelH);
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.setBounds(0, 0, mapPixelW, mapPixelH);
      }
    }

    // Set player spawn
    if (this.scene.pendingEntranceId) {
      const match = mapData.objects.find(o => (o.type === 'entrance' || o.type === 'exit') && o.id === this.scene.pendingEntranceId);
      if (match && this.scene.player?.sprite) {
        const spawnX = (match.x * this.tileSize) + (this.tileSize / 2);
        const spawnY = (match.y * this.tileSize) + (this.tileSize / 2);
        this.scene.player.sprite.setPosition(spawnX, spawnY);
      } else {
        console.warn(`Pending entrance id "${this.scene.pendingEntranceId}" not found in map "${mapKey}"`);
      }
      this.scene.pendingEntranceId = null;
    } else {
      // fallback: use first spawn object in map (if exists)
      const spawn = mapData.objects.find(o => o.type === 'spawn');
      if (spawn && this.scene.player?.sprite) {
        const spawnX = (spawn.x * this.tileSize) + (this.tileSize / 2);
        const spawnY = (spawn.y * this.tileSize) + (this.tileSize / 2);
        this.scene.player.sprite.setPosition(spawnX, spawnY);
      }
    }

    // ensure camera follows player
    if (this.scene.cameras && this.scene.cameras.main && this.scene.player?.sprite) {
      this.scene.cameras.main.startFollow(this.scene.player.sprite, true, 0.08, 0.08);
    }
  }
}
