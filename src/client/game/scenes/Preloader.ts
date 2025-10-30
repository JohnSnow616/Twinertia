import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    // Background
    this.add.image(512, 384, "background");

    // Progress bar outline
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    // Update bar width as loading progresses
    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("assets");  
    this.load.image("background", "assets/bg.png");

    // ✅ Correct path and frame sizes
    this.load.spritesheet("boy", "boy_character.png", {
    frameWidth: 67,
    frameHeight: 76,
    margin: 0,
    spacing: 0,
    });
  }

  create() {
    // Move to the Main Menu after loading is complete
    this.scene.start("MainMenu");
  }
}
