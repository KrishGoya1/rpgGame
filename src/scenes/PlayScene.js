import { createMap } from '../systems/MapSystem.js';
import { createPlayer, handlePlayerMovement } from '../systems/PlayerSystem.js';
import { createNpcs, updateNpcPatrol } from '../systems/NpcSystem.js';
import { createDialogue, startDialogue, advanceDialogue } from '../systems/DialogueSystem.js';

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
        // Map
        const { map, wallsLayer } = createMap(this);

        // Player
        this.player = createPlayer(this, 100, 100);

        // NPCs
        this.npcs = createNpcs(this, map);

        // Collisions
        this.physics.add.collider(this.player, wallsLayer);
        this.physics.add.collider(this.player, this.npcs);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.advanceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Dialogue system
        const { dialogueText, dialogueBg } = createDialogue(this);
        this.dialogueText = dialogueText;
        this.dialogueBg = dialogueBg;
        this.dialogueActive = false;
        this.dialogueIndex = 0;
        this.currentNpc = null;

        // Debug hint
        this.add.text(10, 10, 'Use arrows to move. Press E near NPC. SPACE to advance dialogue.', { font: '14px Arial', fill: '#fff' });
    }

    update() {
        // Player movement
        handlePlayerMovement(this, this.player, this.cursors, this.dialogueActive);

        // NPC patrol
        updateNpcPatrol(this, this.npcs);

        // Interactions
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.dialogueActive) {
            this.npcs.children.iterate(npc => {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
                if (dist < 40) {
                    startDialogue(this, npc);
                }
            });
        }

        // Advance dialogue
        if (this.dialogueActive && Phaser.Input.Keyboard.JustDown(this.advanceKey)) {
            advanceDialogue(this);
        }
    }
}
