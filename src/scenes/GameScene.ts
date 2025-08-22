import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload(): void {
    // Load the JSON map
    this.load.tilemapTiledJSON('world', 'assets/maps/world.json');

    // Explicitly load the tileset image with the SAME key as in world.json ("tileset")
    this.load.image('tileset', 'assets/tilesets/tileset.png');
  }

  create(): void {
    const map = this.make.tilemap({ key: 'world' });

    // Match the "name" inside world.json tileset definition
    const tileset = map.addTilesetImage('tileset', 'tileset');

    const ground = map.createLayer('Ground', tileset!, 0, 0);
    const walls = map.createLayer('Walls', tileset!, 0, 0);

    if (walls) {
      walls.setCollisionByProperty({ collides: true });
    }

    this.add.text(10, 10, '🌍 World Loaded!', { fontSize: '16px', color: '#fff' });
  }
}
