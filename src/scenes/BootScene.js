export default class BootScene extends Phaser.Scene {
constructor() { super('BootScene'); }
preload() {
this.load.image('tiles', 'assets/tiles.png');
this.load.tilemapTiledJSON('map', 'assets/testMap.json');
this.load.image('player', 'assets/player.png');
this.load.image('npc', 'assets/npc.png');

this.load.image('gun', 'assets/gun.png');
this.load.image('pass', 'assets/pass.png');
this.load.image('npc_guard', 'assets/npc_guard.png');

}
create() { this.scene.start('PlayScene'); }
}