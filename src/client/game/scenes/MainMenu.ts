// twinertia/src/client/game/scenes/MainMenu.ts
import { Scene, GameObjects } from "phaser";

export class MainMenu extends Scene {
  background: GameObjects.Image | null = null;
  title: GameObjects.Text | null = null;
  playButton!: GameObjects.Text;
  settingsButton!: GameObjects.Text;
  quitButton!: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  init(): void {
    this.background = null;
    this.title = null;
  }

  create() {
    this.refreshLayout();

    // --- Fade in on scene start ---
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // --- Buttons below the title ---
    this.playButton = this.createButton(this.scale.height * 0.68, "▶ PLAY");
    this.settingsButton = this.createButton(this.scale.height * 0.78, "⚙ SETTINGS");
    this.quitButton = this.createButton(this.scale.height * 0.88, "✖ QUIT");

    // --- Button functionality ---
    this.playButton.on("pointerup", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => this.scene.start("Instructions"));
    });

    this.settingsButton.on("pointerup", () => {
      this.settingsButton.setText("⚙ Coming Soon!");
      this.tweens.add({
        targets: this.settingsButton,
        alpha: 0.5,
        yoyo: true,
        duration: 200,
      });
    });

    this.quitButton.on("pointerup", () => {
      this.quitButton.setText("✖ Not available in browser");
      this.tweens.add({
        targets: this.quitButton,
        alpha: 0.5,
        yoyo: true,
        duration: 300,
      });
    });

    // --- Handle resize events dynamically ---
    this.scale.on("resize", () => this.refreshLayout());
  }

  private refreshLayout(): void {
    const { width, height } = this.scale;
    this.cameras.resize(width, height);

    // --- Background ---
    if (!this.background) {
      this.background = this.add.image(0, 0, "background").setOrigin(0);
    }
    this.background.setDisplaySize(width, height);

    // --- Title ---
    const baseFontSize = 72;
    if (!this.title) {
      this.title = this.add
        .text(width / 2, height * 0.45, "T  W  I  N  E  R  T  I  A", {
          fontFamily: "Arial Black",
          fontSize: `${baseFontSize}px`,
          color: "#00ffff",
          stroke: "#000000",
          strokeThickness: 8,
          shadow: { offsetX: 0, offsetY: 0, color: "#00ffff", blur: 20, fill: true },
        })
        .setOrigin(0.5);
    }

    // Animate the title for a fun pulse effect
    this.tweens.add({
      targets: this.title,
      scale: { from: 1, to: 1.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createButton(y: number, label: string): GameObjects.Text {
    const btn = this.add
      .text(this.scale.width / 2, y, label, {
        fontFamily: "Arial Black",
        fontSize: "36px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () =>
        btn.setStyle({ color: "#00e5ff", stroke: "#00ffff", strokeThickness: 3 })
      )
      .on("pointerout", () =>
        btn.setStyle({ color: "#ffffff", stroke: "#000000", strokeThickness: 0 })
      );

    return btn;
  }
}
