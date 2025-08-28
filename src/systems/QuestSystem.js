// QuestSystem.js
// Polished but minimal quest manager: supports collect + kill quests, persistence, rewards, and helpers for UI.

export default class QuestSystem {
  constructor(scene) {
    this.scene = scene;
    this.saveKey = 'rpg_save_v1';
    this.active = {};        // { questId: { def, progress } }
    this.completed = {};     // { questId: true }
    this.player = { xp: 0, gold: 0, inventory: {} };

    this._load();
  }

  // ---------- persistence ----------
  _load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      this.active = data.active || {};
      this.completed = data.completed || {};
      this.player = data.player || this.player;
    } catch (e) {
      console.warn('QuestSystem: failed to load save', e);
    }
  }

  _save() {
    try {
      const payload = { active: this.active, completed: this.completed, player: this.player };
      localStorage.setItem(this.saveKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('QuestSystem: failed to save', e);
    }
  }

  // ---------- API: query ----------
  isActive(id) { return !!this.active[id]; }
  isCompleted(id) { return !!this.completed[id]; }

  getActiveList() {
    return Object.entries(this.active).map(([id, obj]) => {
      return {
        id,
        title: obj.def.title || obj.def.description || id,
        description: obj.def.description || '',
        progress: obj.progress || 0,
        required: obj.def.count || obj.def.targetCount || 1,
        type: obj.def.type || 'collect'
      };
    });
  }

  getProgress(id) {
    if (!this.active[id]) return null;
    return { progress: this.active[id].progress, required: this.active[id].def.count || 1 };
  }

  // ---------- API: accepting / offering ----------
  /**
   * Accepts a quest definition (usually from NPC) and starts tracking it.
   * questDef must include { id, type, target, count, reward, title, description } minimally.
   */
  acceptQuest(questDef) {
    if (!questDef || !questDef.id) {
      console.warn('QuestSystem.acceptQuest: invalid questDef', questDef);
      return false;
    }
    const id = questDef.id;
    if (this.isCompleted(id) || this.isActive(id)) return false;

    this.active[id] = { def: questDef, progress: 0, acceptedAt: Date.now() };
    this._save();
    this._toast(`Quest accepted: ${questDef.title || id}`);
    return true;
  }

  /**
   * Called when item is collected in the world.
   * itemId: string (e.g., 'herb')
   */
  collectItem(itemId, amount = 1) {
    let changed = false;
    Object.entries(this.active).forEach(([id, entry]) => {
      const def = entry.def;
      if (def.type === 'collect' && def.target === itemId) {
        entry.progress = (entry.progress || 0) + amount;
        changed = true;
        this._maybeComplete(id);
      }
    });
    if (changed) this._save();
  }

  /**
   * Called when an enemy is killed.
   * targetId: string (e.g., 'slime')
   */
  killTarget(targetId, amount = 1) {
    let changed = false;
    Object.entries(this.active).forEach(([id, entry]) => {
      const def = entry.def;
      if (def.type === 'kill' && def.target === targetId) {
        entry.progress = (entry.progress || 0) + amount;
        changed = true;
        this._maybeComplete(id);
      }
    });
    if (changed) this._save();
  }

  // ---------- completion / reward ----------
  _maybeComplete(questId) {
    const entry = this.active[questId];
    if (!entry) return;

    const def = entry.def;
    const required = def.count || 1;
    const current = entry.progress || 0;
    if (current >= required) {
      // mark complete
      delete this.active[questId];
      this.completed[questId] = { completedAt: Date.now(), def };
      this._applyRewards(def.reward || {});
      this._save();
      this._toast(`Quest complete: ${def.title || questId}`);
      // optional hook for scene to react
      if (this.scene && typeof this.scene.onQuestCompleted === 'function') {
        try { this.scene.onQuestCompleted(questId, def); } catch (e) { /* ignore */ }
      }
    }
  }

  _applyRewards(rewards) {
    if (!rewards) return;
    if (rewards.xp) this.player.xp = (this.player.xp || 0) + rewards.xp;
    if (rewards.gold) this.player.gold = (this.player.gold || 0) + rewards.gold;
    if (Array.isArray(rewards.items)) {
      rewards.items.forEach(it => this._giveItem(it.id, it.quantity || 1));
    }
    this._save();
  }

  _giveItem(itemId, qty = 1) {
    if (!this.player.inventory) this.player.inventory = {};
    this.player.inventory[itemId] = (this.player.inventory[itemId] || 0) + qty;
    this._toast(`Received ${qty} × ${itemId}`);
  }

  // ---------- utilities ----------
  _toast(text, ms = 1800) {
    // small top-center toast (non-blocking)
    try {
      const cam = this.scene.cameras.main;
      const x = Math.round(cam.width / 2);
      const y = 28;
      const t = this.scene.add.text(x, y, text, { font: '16px Arial', fill: '#fff' })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(9999);
      this.scene.tweens.add({ targets: t, alpha: { from: 0, to: 1 }, duration: 150 });
      this.scene.time.delayedCall(ms, () => {
        this.scene.tweens.add({ targets: t, alpha: { from: 1, to: 0 }, duration: 200, onComplete: () => t.destroy() });
      });
    } catch (e) {
      console.log('Toast:', text);
    }
  }
}
