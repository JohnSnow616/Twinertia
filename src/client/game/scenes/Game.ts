// twinertia/src/client/game/scenes/Game.ts
import * as Phaser from "phaser";
import { Kiro } from "../logic/Kiro";

export class Game extends Phaser.Scene {
  private kiro!: Kiro;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private worldText!: Phaser.GameObjects.Text;

  private lightGroup!: Phaser.Physics.Arcade.StaticGroup;
  private shadowGroup!: Phaser.Physics.Arcade.StaticGroup;

  private collectibles!: Phaser.Physics.Arcade.Group;
  private collectedCount: number = 0;
  private totalOrbs: number = 0;
  private orbText!: Phaser.GameObjects.Text;
  private goal!: Phaser.GameObjects.Rectangle;
  private hazard!: Phaser.GameObjects.Rectangle;

  private player!: Phaser.Physics.Arcade.Sprite;
  private shadowTwin!: Phaser.GameObjects.Sprite;

  // Start world = light
  private currentWorld: "light" | "shadow" = "light";
  private isTransitioning: boolean = false;

  private isDead: boolean = false;

  private lightEnergy: number = 100;
  private shadowEnergy: number = 100;
  private energyDecayRate: number = 5;
  private energyText!: Phaser.GameObjects.Text;

  // Shadow timer
  private shadowTimer: number = 0;
  private shadowLimit: number = 8; // seconds allowed in shadow
  private shadowTimerText?: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create(): void {
    this.isDead = false;
    this.kiro = new Kiro();

    // --- Animations ---
    this.anims.create({
      key: "boy-idle",
      frames: this.anims.generateFrameNumbers("boy", { start: 0, end: 6 }),
      frameRate: 0,
      repeat: 0,
    });
    this.anims.create({
      key: "boy-run",
      frames: this.anims.generateFrameNumbers("boy", { start: 14, end: 20 }),
      frameRate: 0,
      repeat: -1,
    });
    this.anims.create({
      key: "boy-jump",
      frames: this.anims.generateFrameNumbers("boy", { start: 21, end: 27 }),
      frameRate: 0,
      repeat: 0,
    });

    // --- Player setup ---
    this.player = this.physics.add.sprite(100, 450, "boy", 0);
    this.player.setOrigin(0.5, 1);
    this.player.play("boy-idle");
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(500);
    this.player.setBounce(0);
    this.player.setSize(32, 60);
    this.player.setOffset(13, 18);
    this.player.setFriction(1, 1);

    // --- Shadow Twin setup ---
    this.shadowTwin = this.add.sprite(this.scale.width - 100, 450, "boy", 0);
    this.shadowTwin.setOrigin(0.5, 1);
    this.shadowTwin.setTint(0xaa0000);
    this.shadowTwin.setAlpha(0.4);
    this.shadowTwin.setFlipX(true);
    this.shadowTwin.play("boy-idle");

    // --- Groups & Platforms ---
    this.lightGroup = this.physics.add.staticGroup();
    this.shadowGroup = this.physics.add.staticGroup();

    // Requirement 9: first bar same for both worlds -> create at same position
    this.createLightPlatform(100, 500, 200, 20);   // first light platform
    this.createShadowPlatform(100, 500, 200, 20);  // first shadow platform (same)

    // remaining platforms (keeps your previous layout but first bar is same)
    this.createLightPlatform(400, 400, 150, 20);
    this.createLightPlatform(650, 350, 200, 20);
    this.createShadowPlatform(400, 500, 150, 20);
    this.createShadowPlatform(600, 450, 150, 20);

    // --- Hazard (shadow world) ---
    this.hazard = this.add.rectangle(650, 330, 50, 20, 0xff0000);
    this.physics.add.existing(this.hazard, true);
    this.shadowGroup.add(this.hazard);

    // --- Collectibles (shadow world) ---
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    const orbPositions = [
      { x: 500, y: 470 },
      { x: 600, y: 430 },
      { x: 700, y: 400 },
    ];
    orbPositions.forEach((pos) => {
      const orb = this.add.circle(pos.x, pos.y, 8, 0x00ffff);
      this.physics.add.existing(orb);
      const orbBody = orb.body as Phaser.Physics.Arcade.Body;
      orbBody.setAllowGravity(false);
      orbBody.setImmovable(true);
      // initial state: invisible in light world (req #10)
      orb.setVisible(false);
      orbBody.enable = false;
      (orb as any).collected = false;
      // small pulse for shadow visibility (will be visible only in shadow)
      this.tweens.add({
        targets: orb,
        scale: { from: 1, to: 1.3 },
        alpha: { from: 0.8, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
      this.collectibles.add(orb);
    });

    this.collectedCount = 0;
    this.totalOrbs = orbPositions.length;

    // --- Goal (light world) ---
    this.goal = this.add.rectangle(800, 300, 40, 60, 0x888888);
    this.physics.add.existing(this.goal, true);
    this.lightGroup.add(this.goal);

    // --- Collisions & Overlaps ---
    this.physics.add.collider(this.player, this.lightGroup);
    this.physics.add.collider(this.player, this.shadowGroup);
    this.physics.add.overlap(
  this.player,
  this.collectibles,
  (_player, orb) => this.collectItem(_player as Phaser.GameObjects.GameObject, orb as Phaser.GameObjects.GameObject & { body?: Phaser.Physics.Arcade.Body; collected?: boolean }),
  undefined,
  this
);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, undefined, this);
    this.physics.add.overlap(this.player, this.hazard, this.hitHazard, undefined, this);

    // --- UI ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.worldText = this.add.text(10, 10, "World: LIGHT", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
    }).setScrollFactor(0);

    this.energyText = this.add.text(10, 40, "Energy: Light 100 | Shadow 100", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#ffffaa",
    }).setScrollFactor(0);

    this.orbText = this.add.text(10, 70, `Orbs: 0/${this.totalOrbs}`, {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#00ffff",
    }).setScrollFactor(0);

    // Timer text (hidden until entering shadow)
    this.shadowTimerText = this.add.text(10, 100, `Time: ${this.shadowLimit.toFixed(1)}s`, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ff66cc",
    }).setScrollFactor(0);
    this.shadowTimerText.setVisible(false);

  const isLight = this.currentWorld === "light";
this.shadowGroup.children.each((obj) => {
  const go = obj as Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  go.setVisible(!isLight);
  const body = (obj as any).body as Phaser.Physics.Arcade.Body | undefined;
  if (body) {
    body.enable = !isLight;
    if (!isLight) body.updateFromGameObject();
  }
  return true;
});

    // collectibles already set invisible above

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#111122");
  }

  override update(_time: number, _delta: number): void {
    if (this.isDead) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const speed = 200;
    const jumpSpeed = -350;
    body.setVelocityX(0);

    if (this.cursors.left?.isDown) {
      body.setVelocityX(-speed);
      this.player.setFlipX(true);
      if (body.blocked.down) this.player.play("boy-run", true);
    } else if (this.cursors.right?.isDown) {
      body.setVelocityX(speed);
      this.player.setFlipX(false);
      if (body.blocked.down) this.player.play("boy-run", true);
    } else if (body.blocked.down) {
      this.player.play("boy-idle", true);
    }

    if (this.cursors.up?.isDown && body.blocked.down) {
      body.setVelocityY(jumpSpeed);
      this.player.play("boy-jump", true);
    }

    if (this.player.y > 600) this.playerDies();

    // Mirror twin
    const centerX = this.scale.width / 2;
    const dist = this.player.x - centerX;
    this.shadowTwin.x = centerX - dist;
    this.shadowTwin.y = this.player.y;
    this.shadowTwin.setFlipX(!this.player.flipX);
    const anim = this.player.anims.currentAnim?.key ?? "boy-idle";
    if (this.shadowTwin.anims.currentAnim?.key !== anim) this.shadowTwin.play(anim, true);
    this.shadowTwin.setAlpha(this.currentWorld === "light" ? 0.4 : 0.15);

    // Energy drain
    if (this.currentWorld === "light")
      this.lightEnergy = Math.max(0, this.lightEnergy - this.energyDecayRate * (_delta / 1000));
    else
      this.shadowEnergy = Math.max(0, this.shadowEnergy - this.energyDecayRate * (_delta / 1000));

    // Timer handling (req 1-4,11)
    if (this.currentWorld === "shadow") {
      // compute remaining
      const elapsed = (this.time.now - this.shadowTimer) / 1000;
      const remaining = Math.max(0, this.shadowLimit - elapsed);

      // show timer text
      if (this.shadowTimerText) {
        this.shadowTimerText.setText(`Time: ${remaining.toFixed(1)}s`);
        this.shadowTimerText.setVisible(true);
      }

      // warning flash when near end
      if (remaining <= 2 && remaining > 0) {
        this.cameras.main.flash(80, 255, 50, 50);
      }

      // when time runs out => instant death (req 11)
      if (remaining <= 0) {
        // vanish player and trigger death immediately
        this.playerDies();
        return; // skip further updates this frame
      }
    } else {
      // hide timer text in light world (req 2)
      if (this.shadowTimerText) this.shadowTimerText.setVisible(false);
    }

    // update energy text (keeps existing format)
    this.energyText.setText(
      `Energy: Light ${this.lightEnergy.toFixed(0)} | Shadow ${this.shadowEnergy.toFixed(0)}`
    );

    // die if energy below zero (existing)
    if (this.lightEnergy <= 0 || this.shadowEnergy <= 0) {
      this.playerDies();
      return;
    }

    // --- World switch: SPACE toggles opposite world once (req 6) ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      const newWorld = this.currentWorld === "light" ? "shadow" : "light";
      this.fadeWorldTransition(newWorld);
    }
  }

  private fadeWorldTransition(newWorld: "light" | "shadow") {
  if (this.isTransitioning || newWorld === this.currentWorld) return;
  this.isTransitioning = true;

  const cam = this.cameras.main;
  cam.fadeOut(150, 0, 0, 0);

  cam.once("camerafadeoutcomplete", () => {
    const isLight: boolean = newWorld === "light"; // declare here

    // Update UI & background
    this.worldText.setText(`World: ${newWorld.toUpperCase()}`);
    cam.setBackgroundColor(isLight ? "#111122" : "#220011");

    // Light group
    this.lightGroup.children.each((obj) => {
      const go = obj as Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
      go.setVisible(isLight);
      const body = (obj as any).body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.enable = isLight;
        if (isLight) body.updateFromGameObject();
      }
      return true;
    });

    // Shadow group
    this.shadowGroup.children.each((obj) => {
      const go = obj as Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
      go.setVisible(!isLight);
      const body = (obj as any).body as Phaser.Physics.Arcade.Body | undefined;
      if (body) {
        body.enable = !isLight;
        if (!isLight) body.updateFromGameObject();
      }
      return true;
    });

    // Collectibles
    this.collectibles.children.each((obj) => {
      const orb = obj as Phaser.GameObjects.Arc & { collected?: boolean; body?: Phaser.Physics.Arcade.Body };
      const orbBody = orb.body;
      const collected = !!orb.collected;
      if (!isLight && !collected) {
        orb.setVisible(true);
        if (orbBody) orbBody.enable = true;
      } else {
        orb.setVisible(false);
        if (orbBody) orbBody.enable = false;
      }
      return true;
    });

    // Timer: reset every shadow entry
    if (newWorld === "shadow") {
      this.shadowTimer = this.time.now;
      if (this.shadowTimerText) {
        this.shadowTimerText.setText(`Time: ${this.shadowLimit.toFixed(1)}s`);
        this.shadowTimerText.setVisible(true);
      }
    } else {
      if (this.shadowTimerText) this.shadowTimerText.setVisible(false);
    }

    cam.fadeIn(150, 0, 0, 0);
    cam.once("camerafadeincomplete", () => {
      this.currentWorld = newWorld;
      this.isTransitioning = false;
    });
  });
}

  private createLightPlatform(x: number, y: number, w: number, h: number) {
    const plat = this.add.rectangle(x, y, w, h, 0xffffff);
    this.physics.add.existing(plat, true);
    this.lightGroup.add(plat);
  }

  private createShadowPlatform(x: number, y: number, w: number, h: number) {
    const plat = this.add.rectangle(x, y, w, h, 0xff5555, 0.5);
    this.physics.add.existing(plat, true);
    this.shadowGroup.add(plat);
  }

  // --- collectItem ---
private collectItem(_playerObj: Phaser.GameObjects.GameObject, orbObj: Phaser.GameObjects.GameObject & { body?: Phaser.Physics.Arcade.Body, collected?: boolean }): void {
  if (this.currentWorld !== "shadow") return;

  const orb = orbObj;
  const orbBody = orb.body;

  if (orb.collected) return;

  orb.collected = true;
  (orb as Phaser.GameObjects.Arc).setVisible(false);
  if (orbBody) orbBody.enable = false;

  this.collectedCount++;
  this.orbText.setText(`Orbs: ${this.collectedCount}/${this.totalOrbs}`);
  this.lightEnergy = Math.min(100, this.lightEnergy + 20);

  const feedback = this.add.text(this.player.x - 30, this.player.y - 60, "+Energy", {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#00ffcc",
  });
  this.tweens.add({
    targets: feedback,
    alpha: 0,
    y: feedback.y - 20,
    duration: 800,
    onComplete: () => feedback.destroy(),
  });

  if (this.collectedCount >= this.totalOrbs) {
    this.goal.setFillStyle(0x00ff00);
  }
}

  private reachGoal() {
  // Only trigger in the light world
  if (this.currentWorld !== "light") return;

  // Goal locked check
  if (this.collectedCount < this.totalOrbs) {
    const msg = this.add.text(this.player.x - 60, this.player.y - 80, "Goal Locked!", {
      fontSize: "18px",
      color: "#ff3333",
      fontFamily: "monospace",
    });
    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 700,
      delay: 800,
      onComplete: () => msg.destroy(),
    });
    return;
  }

  // Prevent re-trigger
  if (this.isDead) return;
  this.isDead = true;

  // Make sure goal is green
  this.goal.setFillStyle(0x00ff00);

  // Disable player physics so it doesn't interfere
  this.physics.world.disable(this.player);

  // Bring player visually in front of the goal
  this.goal.setDepth(1);
  this.player.setDepth(2);

  // Calculate target point: inside the goal rectangle
  const targetX = this.goal.x as number;
  const targetY = (this.goal.y as number) - (this.goal.height ?? 40) / 4;

  // Subtle goal glow pulse
  this.tweens.add({
    targets: this.goal,
    alpha: { from: 1, to: 0.6 },
    duration: 250,
    yoyo: true,
    repeat: 4,
  });

  // Tween player into the goal (move, shrink, fade)
  this.tweens.add({
    targets: this.player,
    x: targetX,
    y: targetY,
    scale: 0.2,
    alpha: 0,
    duration: 1200,
    ease: "Sine.easeInOut",
    onUpdate: () => {
      // Create the illusion of player blending into goal color
      const tintBlend = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffffff),
        Phaser.Display.Color.ValueToColor(0x00ff00),
        100,
        100 - this.player.alpha * 100
      );
      this.player.setTint(Phaser.Display.Color.GetColor(tintBlend.r, tintBlend.g, tintBlend.b));
    },
    onComplete: () => {
      this.player.setVisible(false);
      this.player.clearTint();

      const completeText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 80,
        "LEVEL COMPLETE!",
        {
          fontSize: "34px",
          color: "#00ff00",
          fontFamily: "monospace",
        }
      );
      completeText.setOrigin(0.5);
      completeText.setDepth(10);

      this.time.delayedCall(1200, () => {
        this.scene.pause();
      });
    },
  });
}


  private hitHazard() {
    if (this.currentWorld === "shadow" && !this.isDead) this.playerDies();
  }

  private playerDies() {
    if (this.isDead) return;
    this.isDead = true;

    // instant death visual
    this.player.setTint(0xff0000);
    this.player.setVelocity(0, 0);
    this.player.anims.stop();

    this.shadowTwin.setTint(0xff0000);
    this.shadowTwin.anims.stop();

    // fade out player & twin then restart
    this.tweens.add({
      targets: [this.player, this.shadowTwin],
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        this.scene.restart();
      },
    });
  }
}
