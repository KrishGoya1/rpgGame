export class Renderer {
  constructor(scene) {
    this.scene = scene;
  }

  drawObject(x, y, width, height, color) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(x, y, width, height);
    return graphics;
  }
}
