export class CameraController {
  /**
   * 
   * @param {Phaser.Scene} scene - Phaser scene
   * @param {Phaser.GameObjects.Sprite} target - Sprite to follow
   * @param {number} mapWidth - Map width in pixels
   * @param {number} mapHeight - Map height in pixels
   */
  constructor(scene, target, mapWidth, mapHeight) {
    this.scene = scene;

    // Make camera follow the player
    scene.cameras.main.startFollow(target, true, 0.08, 0.08);

    // Set camera bounds to map size
    scene.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  }
}
