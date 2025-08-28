// InventorySystem.js
// Responsibilities:
// - Track items (id -> count)
// - Persist to localStorage
// - Emit bus events on change
// - Provide API: addItem, removeItem, hasItem, getCount, getAll

import {bus} from './busInstance.js';

export default class InventorySystem {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.saveKey = opts.saveKey || 'rpg_inventory_v1';
    this.items = {}; // { itemId: qty }
    this._load();
  }

  // ---------- persistence ----------
  _load() {
    try {
      const raw = localStorage.getItem(this.saveKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') this.items = parsed;
    } catch (e) {
      console.warn('InventorySystem: load failed', e);
    }
  }

  _save() {
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.items));
    } catch (e) {
      console.warn('InventorySystem: save failed', e);
    }
  }

  // ---------- public API ----------
  addItem(id, qty = 1, opts = { toast: true }) {
    if (!id || qty <= 0) return 0;
    this.items[id] = (this.items[id] || 0) + qty;
    this._save();
    bus.emit('inventory:changed', { id, qty: this.items[id] });
    if (opts.toast) this._toast(`+${qty} ${id}`);
    return this.items[id];
  }

  removeItem(id, qty = 1) {
    if (!this.hasItem(id, qty)) return false;
    this.items[id] -= qty;
    if (this.items[id] <= 0) delete this.items[id];
    this._save();
    bus.emit('inventory:changed', { id, qty: this.items[id] || 0 });
    return true;
  }

  hasItem(id, qty = 1) {
    return (this.items[id] || 0) >= qty;
  }

  getCount(id) {
    return this.items[id] || 0;
  }

  getAll() {
    // return a shallow copy
    return Object.assign({}, this.items);
  }

  clear() {
    this.items = {};
    this._save();
    bus.emit('inventory:changed', { id: null, qty: 0, cleared: true });
  }

  // ---------- small helper UI toast ----------
  _toast(text, ms = 1400) {
    try {
      const cam = this.scene.cameras.main;
      const t = this.scene.add
        .text(cam.width / 2, 28, text, { font: '16px monospace', fill: '#fff' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(9999);
      this.scene.tweens.add({ targets: t, alpha: { from: 0, to: 1 }, duration: 120 });
      this.scene.time.delayedCall(ms, () => {
        this.scene.tweens.add({ targets: t, alpha: { from: 1, to: 0 }, duration: 180, onComplete: () => t.destroy() });
      });
    } catch (e) {
      console.log('Inventory toast:', text);
    }
  }
}
