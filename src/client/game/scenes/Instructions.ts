import * as Phaser from 'phaser';

export class Instructions extends Phaser.Scene {
  private background!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private instructions!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private startKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Instructions');
  }

  create() {
    const { width, height } = this.scale; // ✅ full dynamic screen size

    // Semi-transparent dark background
    this.background = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // Title text
    this.title = this.add.text(width / 2, height * 0.25, '🕹️ HOW TO PLAY 🕹️', {
      fontSize: '48px',
      color: '#00ffcc',
      fontFamily: 'Arial Black',
      align: 'center',
    }).setOrigin(0.5);

    // Instructions (more spaced and readable)
    this.instructions = this.add.text(
      width / 2,
      height * 0.5,
      `➡ Move: Arrow Keys
🕶 Switch Worlds: [SPACE]
💎 Collect Orbs to Win
⚠ Avoid Obstacles
💚 Reach the Green Portal`,
      {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 10,
      }
    ).setOrigin(0.5);

    // Bottom prompt
    this.prompt = this.add.text(
      width / 2,
      height * 0.8,
      'Press [ENTER] to Start',
      {
        fontSize: '30px',
        color: '#00ff00',
        fontFamily: 'Arial',
      }
    ).setOrigin(0.5);

    // ✅ Keyboard setup (safe check)
    if (this.input.keyboard) {
      this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // Fade-in animation for smoother entry
    this.tweens.add({
      targets: [this.background, this.title, this.instructions, this.prompt],
      alpha: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Sine.easeInOut',
    });
  }

  // ✅ Phaser update with override
  override update(): void {
    if (this.startKey && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      // Fade out before switching
      this.tweens.add({
        targets: [this.background, this.title, this.instructions, this.prompt],
        alpha: 0,
        duration: 400,
        onComplete: () => this.scene.start('Game'),
      });
    }
  }
}
