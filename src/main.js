import BootScene from "./scenes/BootScene.js";
import PlayScene from "./scenes/PlayScene.js";

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: { debug: true }
  },
  scene: [BootScene, PlayScene]
};

new Phaser.Game(config);
