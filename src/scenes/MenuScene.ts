import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  private music!: Phaser.Sound.BaseSound;

  constructor() {
    super("MenuScene");
  }

  create() {
    const { width, height } = this.scale;

    // Background image
    this.add.image(0, 0, "sky").setOrigin(0).setDisplaySize(width, height);

    // Title
    this.add.text(width / 2, height / 2 - 100, "✨ TDGTK ✨", {
      fontSize: "64px",
      fontFamily: "Arial",
      color: "#ffcc00",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Start button
    const startText = this.add.text(width / 2, height / 2 + 50, "▶ Start Game", {
      fontSize: "32px",
      color: "#ffffff",
      backgroundColor: "#00000088",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive();

    // Hover effects
    startText.on("pointerover", () => {
      startText.setStyle({ color: "#00ff00" });
    });
    startText.on("pointerout", () => {
      startText.setStyle({ color: "#ffffff" });
    });

    // Click event
    startText.on("pointerdown", () => {
      this.sound.play("clickSound");
      this.music.stop();
      this.scene.start("GameScene");
    });

    // Background music (looping)
    this.music = this.sound.add("menuMusic", { loop: true, volume: 0.5 });
    this.music.play();

    // Optional: allow ENTER key to start
    this.input.keyboard!.on("keydown-ENTER", () => {
      this.sound.play("clickSound");
      this.music.stop();
      this.scene.start("GameScene");
    });
  }
}
