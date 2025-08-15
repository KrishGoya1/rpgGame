export class Inventory {
  /**
   * @param {Phaser.Scene} scene - The Phaser scene this inventory belongs to.
   */
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.isOpen = false;

    // Create UI
    this.container = scene.add.container(scene.scale.width / 2, scene.scale.height / 2)
      .setDepth(3000)
      .setVisible(false);

    const bg = scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.8).setOrigin(0.5);
    this.text = scene.add.text(-130, -180, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: 260 }
    });

    this.container.add([bg, this.text]);

    // Toggle key
    this.keys = scene.input.keyboard.addKeys({
      inventory: Phaser.Input.Keyboard.KeyCodes.I
    });
  }

  /** Call this in scene.update() to check for toggle input */
  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.inventory)) {
      this.toggle();
    }
  }

  /** Show/hide inventory UI */
  toggle() {
    this.isOpen = !this.isOpen;
    this.container.setVisible(this.isOpen);

    if (this.isOpen) {
      this.refreshUI();
    }
  }

  /** Add an item (stack if exists) */
  addItem(name, qty = 1) {
    const existing = this.items.find(i => i.name === name);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({ name, quantity: qty });
    }
    if (this.isOpen) {
      this.refreshUI();
    }
  }

  /** Remove item (reduce quantity or delete) */
  removeItem(name, qty = 1) {
    const existing = this.items.find(i => i.name === name);
    if (!existing) return false;

    existing.quantity -= qty;
    if (existing.quantity <= 0) {
      this.items = this.items.filter(i => i.name !== name);
    }
    if (this.isOpen) {
      this.refreshUI();
    }
    return true;
  }

  /** Check if player has at least `qty` of `name` */
  hasItem(name, qty = 1) {
    const existing = this.items.find(i => i.name === name);
    return !!existing && existing.quantity >= qty;
  }

  /** Refresh UI text */
  refreshUI() {
    if (this.items.length === 0) {
      this.text.setText('Inventory is empty.');
    } else {
      this.text.setText(
        this.items.map(i => `${i.name} x${i.quantity}`).join('\n')
      );
    }
  }
}
