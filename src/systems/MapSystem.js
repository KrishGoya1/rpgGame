export default class MapSystem {
constructor(scene) {
this.scene = scene;
this.map = null;
this.layers = { ground: null, walls: null };
this.spawn = { x: 100, y: 100 };
}


load(key) {
// key must match the preload key (e.g. 'map')
this.map = this.scene.make.tilemap({ key });
const tileset = this.map.addTilesetImage('tiles', 'tiles');
this.layers.ground = this.map.createLayer('Ground', tileset, 0, 0);
this.layers.walls = this.map.createLayer('Walls', tileset, 0, 0);


// Enable collision on walls layer
if (this.layers.walls) this.layers.walls.setCollisionByExclusion([-1]);


// Find spawn point (Objects or NPCs layer)
const objs = this.map.getObjectLayer('Objects') || this.map.getObjectLayer('NPCs');
if (objs && objs.objects) {
const spawnObj = objs.objects.find(o => o.name === 'PlayerSpawn');
if (spawnObj) this.spawn = { x: spawnObj.x, y: spawnObj.y };
}
}
}
export function createMap(scene) {
    const map = scene.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('tiles', 'tiles');

    const groundLayer = map.createLayer('Ground', tileset);
    const wallsLayer = map.createLayer('Walls', tileset);
    wallsLayer.setCollisionByExclusion([-1]);

    return { map, groundLayer, wallsLayer };
}
