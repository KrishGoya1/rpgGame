// PlayScene.js (updated) - integrates QuestSystem + QuestLogUI + NPC quest-offer flow
import { createMap } from '../systems/MapSystem.js';
import { createPlayer, handlePlayerMovement } from '../systems/PlayerSystem.js';
import { createNpcs, updateNpcPatrol, getNearbyNpc } from '../systems/NpcSystem.js';
import { createDialogue, startDialogue, advanceDialogue } from '../systems/DialogueSystem.js';

import QuestSystem from '../systems/QuestSystem.js';
import QuestLogUI from '../systems/QuestLogUI.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
  }

  create() {
    // MAP
    const { map, groundLayer, wallsLayer } = createMap(this);

    // find player spawn if provided
    let spawnX = 100, spawnY = 100;
    const objs = map.getObjectLayer('Objects') || map.getObjectLayer('NPCs');
    if (objs && objs.objects) {
      const spawn = objs.objects.find(o => o.name === 'PlayerSpawn');
      if (spawn) { spawnX = spawn.x; spawnY = spawn.y; }
    }

    // PLAYER
    this.player = createPlayer(this, spawnX, spawnY);
    this.physics.add.collider(this.player, wallsLayer);

    // NPCs
    this.npcs = createNpcs(this, map);
    this.physics.add.collider(this.npcs, wallsLayer);
    this.physics.add.collider(this.player, this.npcs);

    // DIALOGUE UI (re-usable module)
    const diag = createDialogue(this);
    this.dialogueText = diag.dialogueText;
    this.dialogueBg = diag.dialogueBg;
    this.dialogueActive = false;
    this.currentNpc = null;

    // QUEST SYSTEM + UI
    this.questSystem = new QuestSystem(this);
    this.questLog = new QuestLogUI(this, this.questSystem);
    this.questLog.update();

    // Offer UI (simple inline overlay)
    const cam = this.cameras.main;
    this.offerBg = this.add.rectangle(40, cam.height - 160, cam.width - 80, 120, 0x031b2e, 0.95)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(1100).setVisible(false);
    this.offerText = this.add.text(60, cam.height - 140, '', { font: '16px monospace', fill: '#fff', wordWrap: { width: cam.width - 160 } })
      .setScrollFactor(0).setDepth(1101).setVisible(false);

    this.offerAcceptKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.offerDeclineKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.advanceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Debug hint
    this.add.text(8, 8, 'WASD/Arrows: Move · E: interact · SPACE: advance dialogue · Y/N: accept/decline quest', { font: '12px monospace', fill: '#fff' }).setScrollFactor(0);
  }

  update(time, delta) {
    // player movement (respects scene.dialogueActive)
    handlePlayerMovement(this, this.player, this.cursors, this.dialogueActive);

    // NPC patrol
    updateNpcPatrol(this, this.npcs);

    // update quest log UI
    this.questLog.update();

    // if offer is active, watch for Y/N
    if (this.offerBg.visible) {
      if (Phaser.Input.Keyboard.JustDown(this.offerAcceptKey)) {
        if (this._pendingOfferNpc && this._pendingOfferNpc.quest) {
          this.questSystem.acceptQuest(this._pendingOfferNpc.quest);
          this.questLog.update();
          this._clearOffer();
        }
      } else if (Phaser.Input.Keyboard.JustDown(this.offerDeclineKey)) {
        this._clearOffer();
      }
      return; // while offer shown, don't start other interactions
    }

    // Interact - E
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.dialogueActive) {
      const npc = getNearbyNpc(this.npcs, this.player.x, this.player.y, 48);
      if (npc) {
        // priority: quest offer / completion -> regular dialogue
        const quest = npc.quest;
        if (quest && !this.questSystem.isActive(quest.id) && !this.questSystem.isCompleted(quest.id)) {
          // offer quest to player
          this._showOffer(npc);
          return;
        }

        if (quest && this.questSystem.isActive(quest.id)) {
          // check if complete (maybe progress satisfied)
          const progress = this.questSystem.getProgress(quest.id);
          const required = (quest.count || 1);
          if (progress && progress.progress >= required) {
            // force completion to give reward
            this.questSystem._maybeComplete(quest.id);
            this.questLog.update();
            // optionally show a short message then continue dialogue
            this.scene.time.delayedCall(300, () => startDialogue(this, npc));
            return;
          }
        }

        // fallback: normal dialogue
        startDialogue(this, npc);
        this.dialogueActive = true;
        this.currentNpc = npc;
      }
    }

    // Advance Dialogue
    if (this.dialogueActive && Phaser.Input.Keyboard.JustDown(this.advanceKey)) {
      // advanceDialogue expects scene to keep the dialogue references
      advanceDialogue(this);
      if (!this.dialogueActive) {
        // dialogue ended; no-op
      }
    }
  }

  // small helpers for offer UI
  _showOffer(npc) {
    if (!npc || !npc.quest) return;
    this._pendingOfferNpc = npc;
    this.offerBg.setVisible(true);
    const q = npc.quest;
    const lines = [
      q.title || 'Quest Offered',
      '',
      q.description || (q.type === 'collect' ? `Collect ${q.count || 1} × ${q.target}` : `Defeat ${q.count || 1} × ${q.target}`),
      '',
      '(Y) Accept · (N) Decline'
    ];
    this.offerText.setText(lines.join('\n')).setVisible(true);
  }

  _clearOffer() {
    this._pendingOfferNpc = null;
    this.offerBg.setVisible(false);
    this.offerText.setVisible(false);
  }

  // called by QuestSystem on completion (optional hook)
  onQuestCompleted(id, def) {
    // small visual acknowledgement
    const text = `Completed: ${def.title || id}`;
    const t = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 60, text, { font: '20px monospace', fill: '#ffd' }).setOrigin(0.5).setDepth(2000);
    this.time.delayedCall(1200, () => t.destroy());
  }
}
