export class Renderer {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Draws a simple colored rectangle on the game screen.
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width of object
   * @param {number} height - Height of object
   * @param {number} color - Hex color (0xRRGGBB)
   */
  drawObject(x, y, width, height, color) {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(x, y, width, height);
    return graphics;
  }
}
