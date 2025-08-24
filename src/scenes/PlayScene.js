export default class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    preload() {
        // Map + Tiles
        this.load.tilemapTiledJSON('map', 'assets/testMap.json');
        this.load.image('tiles', 'assets/tiles.png');

        // Player
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        // NPC
        this.load.image('npc', 'assets/npc.png'); 
    }

    create() {
        // --- MAP ---
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('tiles', 'tiles');

        const groundLayer = map.createLayer('Ground', tileset);
        const wallsLayer = map.createLayer('Walls', tileset);
        wallsLayer.setCollisionByExclusion([-1]);

        // --- PLAYER ---
        this.player = this.physics.add.sprite(100, 100, 'player', 0);
        this.player.setCollideWorldBounds(true);

        // Camera follow
        this.cameras.main.startFollow(this.player);

        // --- NPC ---
        this.npc = this.physics.add.staticSprite(200, 100, 'npc'); // NPC at fixed location
        this.physics.add.collider(this.player, this.npc);

        // --- COLLISIONS ---
        this.physics.add.collider(this.player, wallsLayer);

        // --- INPUT ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Debug hint
        this.add.text(10, 10, 'Use arrow keys to move. Press E near NPC.', { font: '16px Arial', fill: '#fff' });
    }

    update() {
        // --- PLAYER MOVEMENT ---
        const speed = 150;
        this.player.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(speed);
        }

        // --- NPC INTERACTION ---
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.npc.x, this.npc.y
            );

            if (distance < 40) {
                console.log("Talking to NPC...");
            }
        }
    }
}
