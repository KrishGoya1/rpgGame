export class CameraController {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.GameObjects.Sprite} target
   * @param {number} mapWidth
   * @param {number} mapHeight
   */
  constructor(scene, target, mapWidth, mapHeight) {
    this.scene = scene;
    const cam = scene.cameras.main;

    // crisp movement & light smoothing
    cam.roundPixels = true;
    cam.setLerp(0.12, 0.12);
    cam.startFollow(target, true);

    // Add a small deadzone so the camera doesn't micro-jitter
    const dzW = Math.floor(scene.scale.width * 0.25);
    const dzH = Math.floor(scene.scale.height * 0.25);
    cam.setDeadzone(dzW, dzH);

    // Optional: slight zoom for tighter framing (comment out if undesired)
    cam.setZoom(1.15);

    // Bounds must match physics/world bounds
    cam.setBounds(0, 0, mapWidth, mapHeight);
  }
}
