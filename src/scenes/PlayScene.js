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

        this.cameras.main.startFollow(this.player);

        // --- OBJECTS ---
        const objectsLayer = map.getObjectLayer('Objects');

        // Spawn NPC(s)
        this.npcs = this.physics.add.group();
        objectsLayer.objects.forEach(obj => {
            if (obj.name === 'NPC') {
                const npc = this.physics.add.sprite(obj.x, obj.y, 'npc');
                npc.setImmovable(true);

                // Parse dialogue + path
                const dialogueProp = obj.properties.find(p => p.name === 'dialogue');
                npc.dialogue = dialogueProp ? JSON.parse(dialogueProp.value) : ["..."];

                const pathProp = obj.properties.find(p => p.name === 'path');
                npc.path = pathProp ? JSON.parse(pathProp.value) : null;
                npc.currentPathIndex = 0;

                this.npcs.add(npc);
            }
        });

        // Collider
        this.physics.add.collider(this.player, wallsLayer);
        this.physics.add.collider(this.player, this.npcs);

        // --- INPUT ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.advanceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // --- Dialogue Box ---
        this.dialogueActive = false;
        this.dialogueIndex = 0;
        this.dialogueText = this.add.text(20, 300, '', {
            font: '16px Arial',
            fill: '#fff',
            wordWrap: { width: 400 }
        }).setScrollFactor(0).setDepth(10).setVisible(false);

        this.dialogueBg = this.add.rectangle(0, 280, 480, 80, 0x000000, 0.7)
            .setOrigin(0, 0).setScrollFactor(0).setDepth(9).setVisible(false);

        this.currentNpc = null;

        // Debug hint
        this.add.text(10, 10, 'Use arrows to move. Press E near NPC. SPACE to advance dialogue.', { font: '14px Arial', fill: '#fff' });
    }

    update() {
        const speed = 150;
        this.player.setVelocity(0);

        if (!this.dialogueActive) {
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
        }

        // --- NPC Patrol ---
        this.npcs.children.iterate(npc => {
            if (npc.path && npc.path.length > 0) {
                const target = npc.path[npc.currentPathIndex];
                this.physics.moveTo(npc, target.x, target.y, 60);

                const dist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
                if (dist < 4) {
                    npc.body.reset(target.x, target.y);
                    npc.currentPathIndex = (npc.currentPathIndex + 1) % npc.path.length;
                }
            }
        });

        // --- Interact with NPC ---
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.dialogueActive) {
            this.npcs.children.iterate(npc => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
                if (dist < 40) {
                    this.startDialogue(npc);
                }
            });
        }

        // --- Advance Dialogue ---
        if (this.dialogueActive && Phaser.Input.Keyboard.JustDown(this.advanceKey)) {
            this.advanceDialogue();
        }
    }

    startDialogue(npc) {
        this.dialogueActive = true;
        this.currentNpc = npc;
        this.dialogueIndex = 0;
        this.dialogueBg.setVisible(true);
        this.dialogueText.setVisible(true);
        this.dialogueText.setText(npc.dialogue[this.dialogueIndex]);
    }

    advanceDialogue() {
        this.dialogueIndex++;
        if (this.dialogueIndex < this.currentNpc.dialogue.length) {
            this.dialogueText.setText(this.currentNpc.dialogue[this.dialogueIndex]);
        } else {
            this.dialogueActive = false;
            this.currentNpc = null;
            this.dialogueText.setVisible(false);
            this.dialogueBg.setVisible(false);
        }
    }
}
