import bus from './EventBus.js';

export default class DialogueSystem {
    constructor(scene) {
        this.scene = scene;
        this.dialogueActive = false;
        this.dialogueIndex = 0;
        this.currentNpc = null;

        this.advanceKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.dialogueBg = this.scene.add
            .rectangle(0, 280, 480, 80, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(9)
            .setVisible(false);

        this.dialogueText = this.scene.add
            .text(20, 300, '', {
                font: '16px Arial',
                fill: '#fff',
                wordWrap: { width: 400 }
            })
            .setScrollFactor(0)
            .setDepth(10)
            .setVisible(false);

        bus.on('dialogue:start', npc => this.startDialogue(npc));
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

    update() {
        if (
            this.dialogueActive &&
            Phaser.Input.Keyboard.JustDown(this.advanceKey)
        ) {
            this.advanceDialogue();
        }
    }
}

export function createDialogue(scene) {
    const dialogueText = scene.add.text(20, 300, '', {
        font: '16px Arial',
        fill: '#fff',
        wordWrap: { width: 400 }
    }).setScrollFactor(0).setDepth(10).setVisible(false);

    const dialogueBg = scene.add.rectangle(0, 280, 480, 80, 0x000000, 0.7)
        .setOrigin(0, 0).setScrollFactor(0).setDepth(9).setVisible(false);

    return { dialogueText, dialogueBg };
}

export function startDialogue(scene, npc) {
    scene.dialogueActive = true;
    scene.currentNpc = npc;
    scene.dialogueIndex = 0;
    scene.dialogueBg.setVisible(true);
    scene.dialogueText.setVisible(true);
    scene.dialogueText.setText(npc.dialogue[scene.dialogueIndex]);
}

export function advanceDialogue(scene) {
    scene.dialogueIndex++;
    if (scene.dialogueIndex < scene.currentNpc.dialogue.length) {
        scene.dialogueText.setText(scene.currentNpc.dialogue[scene.dialogueIndex]);
    } else {
        scene.dialogueActive = false;
        scene.currentNpc = null;
        scene.dialogueText.setVisible(false);
        scene.dialogueBg.setVisible(false);
    }
}
