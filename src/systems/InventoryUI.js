// InventoryUI.js
// Small top-left panel listing item icons and counts.
// Assumes item sprite keys are the same as item ids (e.g., "gun" image preloaded under key "gun").

import { bus } from './busInstance.js';


export default class InventoryUI {
  constructor(scene, inventory, opts = {}) {
    this.scene = scene;
    this.inventory = inventory;
    this.x = opts.x ?? 8;
    this.y = opts.y ?? 40;
    this.maxCols = opts.maxCols ?? 4;
    this.cellSize = opts.cellSize ?? 40;

    this._elements = []; // pool of {icon, text}

    // title
    this.title = scene.add.text(this.x, this.y - 22, 'Inventory', { font: '13px monospace', fill: '#ffd' }).setScrollFactor(0).setDepth(900);
    // render initially
    this.update();

    // listen to inventory changes
    this._off = bus.on('inventory:changed', () => this.update());
  }

  update() {
    const items = this.inventory.getAll();
    // destroy old elements
    this._elements.forEach(e => { e.icon && e.icon.destroy(); e.text && e.text.destroy(); });
    this._elements = [];

    const keys = Object.keys(items);
    if (keys.length === 0) {
      this.emptyText = this.scene.add.text(this.x, this.y, '(empty)', { font: '12px monospace', fill: '#ddd' }).setScrollFactor(0).setDepth(900);
      this._elements.push({ text: this.emptyText });
      return;
    }

    // layout grid
    let i = 0;
    for (const id of keys) {
      const count = items[id];
      const col = i % this.maxCols;
      const row = Math.floor(i / this.maxCols);
      const px = this.x + col * this.cellSize;
      const py = this.y + row * this.cellSize;

      let icon;
      if (this.scene.textures.exists(id)) {
        icon = this.scene.add.image(px + 8, py + 8, id).setDisplaySize(32, 32).setOrigin(0).setScrollFactor(0).setDepth(900);
      } else {
        // fallback colored rect
        icon = this.scene.add.rectangle(px + 8 + 16, py + 8 + 16, 32, 32, 0x666666).setScrollFactor(0).setDepth(900);
      }
      const text = this.scene.add.text(px + 32 + 12, py + 8 + 6, `x${count}`, { font: '12px monospace', fill: '#fff' }).setScrollFactor(0).setDepth(900);

      this._elements.push({ icon, text });
      i++;
    }
  }

  destroy() {
    this._elements.forEach(e => { e.icon && e.icon.destroy(); e.text && e.text.destroy(); });
    this.title && this.title.destroy();
    bus.off && this._off && bus.off('inventory:changed', this._off);
  }
}
