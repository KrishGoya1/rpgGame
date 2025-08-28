export default class PlayerSystem {
constructor(scene, mapSys, bus) {
this.scene = scene;
this.mapSys = mapSys;
this.bus = bus;


// spawn player at map spawn
const s = this.mapSys.spawn || { x: 100, y: 100 };
this.sprite = this.scene.physics.add.sprite(s.x, s.y, 'player');
this.sprite.setCollideWorldBounds(true);


// collide with map walls
if (this.mapSys.layers.walls) this.scene.physics.add.collider(this.sprite, this.mapSys.layers.walls);


// input
this.cursors = this.scene.input.keyboard.createCursorKeys();
this.wasd = this.scene.input.keyboard.addKeys({
up: Phaser.Input.Keyboard.KeyCodes.W,
left: Phaser.Input.Keyboard.KeyCodes.A,
down: Phaser.Input.Keyboard.KeyCodes.S,
right: Phaser.Input.Keyboard.KeyCodes.D
});


// Listen to dialogue events to freeze/unfreeze movement (optional)
this.bus.on('dialogue:started', () => { this.scene.dialogueActive = true; });
this.bus.on('dialogue:ended', () => { this.scene.dialogueActive = false; });
}


update() {
if (this.scene.dialogueActive) { this.sprite.setVelocity(0); return; }


const speed = 150;
this.sprite.setVelocity(0);


if (this.cursors.left.isDown || this.wasd.left.isDown) this.sprite.setVelocityX(-speed);
else if (this.cursors.right.isDown || this.wasd.right.isDown) this.sprite.setVelocityX(speed);


if (this.cursors.up.isDown || this.wasd.up.isDown) this.sprite.setVelocityY(-speed);
else if (this.cursors.down.isDown || this.wasd.down.isDown) this.sprite.setVelocityY(speed);
}
}

export function createPlayer(scene, x, y) {
    const player = scene.physics.add.sprite(x, y, 'player', 0);
    player.setCollideWorldBounds(true);
    scene.cameras.main.startFollow(player);

    return player;
}

export function handlePlayerMovement(scene, player, cursors, dialogueActive) {
    const speed = 150;
    player.setVelocity(0);

    if (!dialogueActive) {
        if (cursors.left.isDown) player.setVelocityX(-speed);
        else if (cursors.right.isDown) player.setVelocityX(speed);

        if (cursors.up.isDown) player.setVelocityY(-speed);
        else if (cursors.down.isDown) player.setVelocityY(speed);
    }
}
