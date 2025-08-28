// QuestSystem.js
// Polished quest manager: supports collect + kill + turn-in quests, persistence, rewards, and UI hooks.

export default class QuestSystem {
  constructor(scene, inventorySystem = null) {
    this.scene = scene;
    this.inventory = inventorySystem;   // optional, recommended for item rewards
    this.saveKey = 'rpg_save_v1';
    this.active = {};        // { questId: { def, progress } }
    this.completed = {};     // { questId: { completedAt, def } }
    this.player = { xp: 0, gold: 0 };

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
      console.warn('QuestSystem: load failed', e);
    }
  }

  _save() {
    try {
      const payload = { active: this.active, completed: this.completed, player: this.player };
      localStorage.setItem(this.saveKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('QuestSystem: save failed', e);
    }
  }

  // ---------- query API ----------
  isActive(id) { return !!this.active[id]; }
  isCompleted(id) { return !!this.completed[id]; }

  getActiveList() {
    return Object.entries(this.active).map(([id, entry]) => {
      const def = entry.def;
      return {
        id,
        title: def.title || def.description || id,
        description: def.description || '',
        progress: entry.progress || 0,
        required: def.count || 1,
        type: def.type || 'collect'
      };
    });
  }

  getProgress(id) {
    if (!this.active[id]) return null;
    const entry = this.active[id];
    return { progress: entry.progress, required: entry.def.count || 1 };
  }

  // ---------- quest acceptance ----------
  acceptQuest(questDef) {
    if (!questDef || !questDef.id) return false;
    const id = questDef.id;
    if (this.isCompleted(id) || this.isActive(id)) return false;

    this.active[id] = { def: questDef, progress: 0, acceptedAt: Date.now() };
    this._save();
    this._toast(`Quest accepted: ${questDef.title || id}`);
    return true;
  }

  // ---------- progress updates ----------
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

  tryTurnIn(questId) {
    const entry = this.active[questId];
    if (!entry) return false;
    const def = entry.def;

    if (def.type === 'collect' && this.inventory) {
      const requiredCount = def.count || 1;
      if (this.inventory.hasItem(def.target, requiredCount)) {
        this.inventory.removeItem(def.target, requiredCount);
        this._completeQuest(questId);
        return true;
      }
    } else {
      // for kill quests, check progress
      this._maybeComplete(questId);
      return !!this.completed[questId];
    }

    return false;
  }

  // ---------- completion / reward ----------
  _maybeComplete(questId) {
    const entry = this.active[questId];
    if (!entry) return;
    const def = entry.def;
    const progress = entry.progress || 0;
    const required = def.count || 1;

    if (progress >= required) {
      this._completeQuest(questId);
    }
  }

  _completeQuest(questId) {
    const entry = this.active[questId];
    if (!entry) return;
    const def = entry.def;

    delete this.active[questId];
    this.completed[questId] = { completedAt: Date.now(), def };

    // give rewards
    this._applyRewards(def.reward || {});
    this._save();
    this._toast(`Quest complete: ${def.title || questId}`);

    // optional scene hook
    if (this.scene && typeof this.scene.onQuestCompleted === 'function') {
      try { this.scene.onQuestCompleted(questId, def); } catch (e) {}
    }
  }

  _applyRewards(rewards) {
    if (!rewards) return;

    if (rewards.xp) this.player.xp = (this.player.xp || 0) + rewards.xp;
    if (rewards.gold) this.player.gold = (this.player.gold || 0) + rewards.gold;

    if (Array.isArray(rewards.items) && this.inventory) {
      rewards.items.forEach(item => this.inventory.addItem(item.id, item.quantity || 1));
    }
  }

  // ---------- helper toast ----------
  _toast(text, ms = 1800) {
    try {
      const cam = this.scene.cameras.main;
      const t = this.scene.add.text(cam.width / 2, 28, text, { font: '16px Arial', fill: '#fff' })
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
