// QuestLogUI.js
// Minimal, polished quest list that lives on the right side of the screen.
// Call .update() from scene.update() to refresh.

export default class QuestLogUI {
  constructor(scene, questSystem) {
    this.scene = scene;
    this.qs = questSystem;

    const cam = scene.cameras.main;
    this.x = cam.width - 210;
    this.y = 10;
    this.w = 200;
    this.h = 140;

    this.bg = scene.add.rectangle(this.x, this.y, this.w, this.h, 0x000000, 0.6)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(900);

    this.title = scene.add.text(this.x + 8, this.y + 6, 'Active Quests', { font: '14px monospace', fill: '#ffd' })
      .setScrollFactor(0)
      .setDepth(901);

    this.body = scene.add.text(this.x + 8, this.y + 28, '', { font: '13px monospace', fill: '#fff', wordWrap: { width: this.w - 16 } })
      .setScrollFactor(0)
      .setDepth(901);

    this.bg.setVisible(true);
    this.title.setVisible(true);
    this.body.setVisible(true);
  }

  update() {
    const list = this.qs.getActiveList();
    if (!list || list.length === 0) {
      this.body.setText('  (no active quests)');
      return;
    }
    const lines = list.map(q => {
      return `- ${q.title}\n  ${q.progress}/${q.required}`;
    });
    this.body.setText(lines.join('\n\n'));
  }

  destroy() {
    this.bg.destroy();
    this.title.destroy();
    this.body.destroy();
  }
}
