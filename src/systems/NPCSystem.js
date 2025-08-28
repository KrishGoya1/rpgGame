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


// Updated NpcSystem (functional exports) - parses dialogue, optional path, and optional quest property.
// Exports: createNpcs(scene, map) -> Phaser.Group, updateNpcPatrol(scene, npcs), getNearbyNpc(npcs, x, y, range)

export function createNpcs(scene, map) {
  const layer = map.getObjectLayer('Objects') || map.getObjectLayer('NPCs');
  const group = scene.physics.add.group();

  if (!layer || !Array.isArray(layer.objects)) return group;

  layer.objects.forEach(obj => {
    const name = obj.name || '';
    // Heuristic: either object named starting with 'npc' or has dialogue/quest property
    const hasProps = (obj.properties || []).length > 0;
    const dialogProp = (obj.properties || []).find(p => p.name === 'dialogue');
    const questProp = (obj.properties || []).find(p => p.name === 'quest');

    if (!(name.toLowerCase().startsWith('npc') || dialogProp || questProp)) {
      return; // skip non-NPC objects
    }

    const x = obj.x || 0;
    const y = obj.y || 0;
    const npc = scene.physics.add.sprite(x, y, 'npc');
    npc.setImmovable(true);
    npc.name = name || `npc_${obj.id}`;

    // parse dialogue (stringified JSON array or plain string)
    npc.dialogue = ['...'];
    if (dialogProp && dialogProp.value) {
      try { npc.dialogue = JSON.parse(dialogProp.value); }
      catch (e) { npc.dialogue = [String(dialogProp.value)]; }
    }

    // parse path (either JSON array of {x,y} or semicolon string "x,y;x,y")
    npc.path = null;
    if ((obj.properties || []).length > 0) {
      const pathProp = (obj.properties || []).find(p => p.name === 'path');
      if (pathProp && pathProp.value) {
        try { npc.path = JSON.parse(pathProp.value); }
        catch (e) {
          npc.path = (pathProp.value || '').split(';').map(s => {
            const [px, py] = s.split(',').map(Number);
            return { x: px, y: py };
          }).filter(p => !Number.isNaN(p.x) && !Number.isNaN(p.y));
        }
      }
    }
    npc.currentPathIndex = 0;

    // parse quest (stringified JSON object)
    npc.quest = null;
    if (questProp && questProp.value) {
      try {
        npc.quest = JSON.parse(questProp.value);
        if (!npc.quest.id) npc.quest.id = npc.questId || npc.name || `quest_${obj.id}`;
      } catch (e) {
        console.warn('NpcSystem: failed to parse quest prop for', npc.name, e);
      }
    }

    group.add(npc);
  });

  return group;
}

export function updateNpcPatrol(scene, npcs) {
  npcs.children.iterate(npc => {
    if (!npc || !npc.path || npc.path.length === 0) return;
    const target = npc.path[npc.currentPathIndex];
    scene.physics.moveTo(npc, target.x, target.y, 60);
    const d = Phaser.Math.Distance.Between(npc.x, npc.y, target.x, target.y);
    if (d < 4) {
      npc.body.reset(target.x, target.y);
      npc.currentPathIndex = (npc.currentPathIndex + 1) % npc.path.length;
    }
  });
}

export function getNearbyNpc(npcs, x, y, range = 40) {
  let found = null;
  npcs.children.iterate(npc => {
    if (found) return;
    if (Phaser.Math.Distance.Between(x, y, npc.x, npc.y) <= range) found = npc;
  });
  return found;
}
