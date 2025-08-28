import bus from './EventBus.js';

export default class NPCSystem {
    constructor(scene, objectsLayer) {
        this.scene = scene;
        this.objectsLayer = objectsLayer;
        this.npcs = this.scene.physics.add.group();

        this.interactKey = this.scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.E
        );
    }

    create() {
        this.objectsLayer.objects.forEach(obj => {
            if (obj.name === 'NPC') {
                const npc = this.scene.physics.add.sprite(obj.x, obj.y, 'npc');
                npc.setImmovable(true);

                // Parse dialogue
                const dialogueProp = obj.properties.find(p => p.name === 'dialogue');
                npc.dialogue = dialogueProp
                    ? JSON.parse(dialogueProp.value)
                    : ['...'];

                // Parse patrol path
                const pathProp = obj.properties.find(p => p.name === 'path');
                if (pathProp) {
                    try {
                        npc.path = JSON.parse(pathProp.value);
                    } catch (e) {
                        npc.path = pathProp.value.split(';').map(str => {
                            const [x, y] = str.split(',').map(Number);
                            return { x, y };
                        });
                    }
                } else {
                    npc.path = null;
                }
                npc.currentPathIndex = 0;

                this.npcs.add(npc);
            }
        });
    }

    update(player, dialogueActive) {
        // Patrol movement
        this.npcs.children.iterate(npc => {
            if (npc.path && npc.path.length > 0) {
                const target = npc.path[npc.currentPathIndex];
                this.scene.physics.moveTo(npc, target.x, target.y, 60);

                const dist = Phaser.Math.Distance.Between(
                    npc.x,
                    npc.y,
                    target.x,
                    target.y
                );
                if (dist < 4) {
                    npc.body.reset(target.x, target.y);
                    npc.currentPathIndex =
                        (npc.currentPathIndex + 1) % npc.path.length;
                }
            }
        });

        // Interactions
        if (
            Phaser.Input.Keyboard.JustDown(this.interactKey) &&
            !dialogueActive
        ) {
            this.npcs.children.iterate(npc => {
                const dist = Phaser.Math.Distance.Between(
                    player.x,
                    player.y,
                    npc.x,
                    npc.y
                );
                if (dist < 40) {
                    bus.emit('dialogue:start', npc);
                }
            });
        }
    }
}


export function createNpcs(scene, map) {
    const objectsLayer = map.getObjectLayer('Objects');
    const npcs = scene.physics.add.group();

    objectsLayer.objects.forEach(obj => {
        if (obj.name === 'NPC') {
            const npc = scene.physics.add.sprite(obj.x, obj.y, 'npc');
            npc.setImmovable(true);

            // Dialogue from JSON
            const dialogueProp = obj.properties.find(p => p.name === 'dialogue');
            npc.dialogue = dialogueProp ? JSON.parse(dialogueProp.value) : ["..."];

            // Patrol path
            const pathProp = obj.properties.find(p => p.name === 'path');
            npc.path = pathProp ? JSON.parse(pathProp.value) : null;
            npc.currentPathIndex = 0;

            npcs.add(npc);
        }
    });

    return npcs;
}

export function updateNpcPatrol(scene, npcs) {
    npcs.children.iterate(npc => {
        if (npc.path && npc.path.length > 0) {
            const target = npc.path[npc.currentPathIndex];
            scene.physics.moveTo(npc, target.x, target.y, 60);

            const dist = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
            if (dist < 4) {
                npc.body.reset(target.x, target.y);
                npc.currentPathIndex = (npc.currentPathIndex + 1) % npc.path.length;
            }
        }
    });
}
