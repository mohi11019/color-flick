import Phaser from 'phaser';
import { TargetSide } from '../types';

export interface SmallCircleConfig {
  color: number;
  isMatchingTarget: boolean;
  targetSide?: TargetSide;
}

export class SmallCircle extends Phaser.GameObjects.Container {
  public config: SmallCircleConfig;
  public radius: number = 19;
  public isDragging: boolean = false;
  public isDead: boolean = false;

  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private dragOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  // Gentle outward drift from center
  public driftSpeed: number;
  public driftAngle: number;

  // Trail spawning timer
  private trailTimer: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: SmallCircleConfig) {
    super(scene, x, y);
    this.config = config;
    this.prevX = x;
    this.prevY = y;

    // Physics body
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.radius, -this.radius, -this.radius);
    body.setBounce(0.2, 0.2);
    body.setDrag(0, 0);

    // Initial slow drift in a random direction away from center
    this.driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.driftSpeed = Phaser.Math.FloatBetween(42, 68);
    body.setVelocity(
      Math.cos(this.driftAngle) * this.driftSpeed,
      Math.sin(this.driftAngle) * this.driftSpeed
    );

    // Layer 1: Outer glowing aura
    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    // Layer 2: Main orb body with glass reflections
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawCircle();

    scene.add.existing(this);

    // Pop-in scale animation
    this.setScale(0);
    scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 280,
      ease: 'Back.easeOut'
    });

    // Make circle interactive
    this.setSize(this.radius * 2.6, this.radius * 2.6);
    this.setInteractive({ useHandCursor: true });
  }

  private drawCircle() {
    this.graphics.clear();
    this.glowGraphics.clear();

    const r = this.radius;
    const c = this.config.color;

    // 1. Outer chromatic glow aura
    this.glowGraphics.fillStyle(c, 0.18);
    this.glowGraphics.fillCircle(0, 0, r + 8);
    this.glowGraphics.fillStyle(c, 0.32);
    this.glowGraphics.fillCircle(0, 0, r + 4);

    // 2. Base dark rim for 3D depth
    this.graphics.fillStyle(0x0a0a14, 0.8);
    this.graphics.fillCircle(0, 0, r);

    // 3. Vibrant main color body
    this.graphics.fillStyle(c, 0.95);
    this.graphics.fillCircle(0, 0, r - 1);

    // 4. Glowing inner core highlight
    this.graphics.fillStyle(0xffffff, 0.28);
    this.graphics.fillCircle(0, 0, r * 0.55);

    // 5. Crisp glass rim outline
    this.graphics.lineStyle(2, 0xffffff, 0.9);
    this.graphics.strokeCircle(0, 0, r - 1);

    // 6. Secondary soft rim glow at bottom-right (Fresnel effect)
    this.graphics.lineStyle(1.5, c, 0.7);
    this.graphics.strokeCircle(r * 0.12, r * 0.12, r - 3);

    // 7. Specular highlight glares (curved glossy reflection)
    this.graphics.fillStyle(0xffffff, 0.85);
    this.graphics.fillCircle(-r * 0.32, -r * 0.32, r * 0.26);

    this.graphics.fillStyle(0xffffff, 0.5);
    this.graphics.fillCircle(-r * 0.1, -r * 0.5, r * 0.12);
  }

  public startDrag(pointer: Phaser.Input.Pointer) {
    if (this.isDead) return;
    this.isDragging = true;
    this.dragOffset.set(this.x - pointer.x, this.y - pointer.y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    // Dynamic pickup squash & grow
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.28,
      scaleY: 1.28,
      duration: 120,
      ease: 'Back.easeOut'
    });
  }

  public updateDrag(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging || this.isDead) return;

    this.prevX = this.x;
    this.prevY = this.y;

    this.x = pointer.x + this.dragOffset.x;
    this.y = pointer.y + this.dragOffset.y;

    // Organic squash and stretch based on drag speed & angle
    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    const speed = Math.hypot(dx, dy);

    if (speed > 2) {
      const angle = Math.atan2(dy, dx);
      this.rotation = angle;
      const stretch = Math.min(speed * 0.015, 0.35);
      this.scaleX = 1.25 + stretch;
      this.scaleY = Math.max(1.25 - stretch * 0.6, 0.9);
    }
  }

  // Update called every frame for particle trail & stretch relaxation
  public updateTrail(delta: number) {
    if (this.isDead) return;

    // Relax rotation & scale back to normal smoothly
    if (!this.isDragging) {
      this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, 0, 0.08);
      this.scaleX = Phaser.Math.Linear(this.scaleX, 1.0, 0.1);
      this.scaleY = Phaser.Math.Linear(this.scaleY, 1.0, 0.1);
    }

    // Spawn micro stardust trail particles
    this.trailTimer += delta;
    if (this.trailTimer >= (this.isDragging ? 35 : 75)) {
      this.trailTimer = 0;
      this.spawnTrailParticle();
    }
  }

  private spawnTrailParticle() {
    if (this.isDead || !this.scene) return;

    const p = this.scene.add.circle(
      this.x + Phaser.Math.Between(-3, 3),
      this.y + Phaser.Math.Between(-3, 3),
      Phaser.Math.Between(2, 4),
      this.config.color,
      0.65
    );
    p.setDepth(15);

    this.scene.tweens.add({
      targets: p,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: this.isDragging ? 420 : 280,
      ease: 'Cubic.easeOut',
      onComplete: () => p.destroy()
    });
  }

  // Called when mouse is released: stops immediately with NO continuing flick/momentum
  public endDrag() {
    if (!this.isDragging || this.isDead) return;
    this.isDragging = false;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      rotation: 0,
      duration: 150,
      ease: 'Back.easeOut'
    });

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  public destroy(fromScene?: boolean) {
    this.isDead = true;
    super.destroy(fromScene);
  }
}
