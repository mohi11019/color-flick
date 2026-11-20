import Phaser from 'phaser';
import { TargetColorConfig } from '../types';

export class TargetCircle extends Phaser.GameObjects.Container {
  public config: TargetColorConfig;
  public currentRadius: number;
  public baseRadius: number = 52;
  public maxRadius: number = 110;
  public growthPerMatch: number = 5;

  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private rotatingTechRing: Phaser.GameObjects.Graphics;
  private gateSprite?: Phaser.GameObjects.Image;
  private pulseTween?: Phaser.Tweens.Tween;
  private moveTween?: Phaser.Tweens.Tween;

  // Orbiting satellite energy motes
  private satelliteContainer: Phaser.GameObjects.Container;
  private satellites: Phaser.GameObjects.Arc[] = [];

  public initialX: number;
  public initialY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TargetColorConfig) {
    super(scene, x, y);
    this.config = config;
    this.initialX = x;
    this.initialY = y;
    this.currentRadius = this.baseRadius;

    // Layer 1: Glowing outer corona
    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    // Layer 2: Rotating sci-fi dashed tech ring
    this.rotatingTechRing = scene.add.graphics();
    this.add(this.rotatingTechRing);

    // Layer 3: Main portal body (Sprite if gate texture exists, else procedural fallback)
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    const gateKey = `gate_${this.config.name}`;
    if (scene.textures.exists(gateKey)) {
      this.gateSprite = scene.add.image(0, 0, gateKey);
      this.gateSprite.setDisplaySize(this.currentRadius * 2.5, this.currentRadius * 2.5);
      this.add(this.gateSprite);
    }

    // Layer 4: Orbiting satellite energy particles
    this.satelliteContainer = scene.add.container(0, 0);
    this.add(this.satelliteContainer);
    this.createSatellites(scene);

    this.redraw();
    scene.add.existing(this);

    // Continuous rotation for outer tech ring
    scene.tweens.add({
      targets: this.rotatingTechRing,
      angle: 360,
      duration: 12000,
      repeat: -1,
      ease: 'Linear'
    });

    // Continuous counter-rotation for satellites
    scene.tweens.add({
      targets: this.satelliteContainer,
      angle: -360,
      duration: 7000,
      repeat: -1,
      ease: 'Linear'
    });

    // Ambient breathing pulse
    this.pulseTween = scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createSatellites(scene: Phaser.Scene) {
    const count = 3;
    const r = this.currentRadius + 15;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const s = scene.add.circle(
        Math.cos(angle) * r,
        Math.sin(angle) * r,
        3.5,
        0xffffff,
        0.85
      );
      this.satellites.push(s);
      this.satelliteContainer.add(s);
    }
  }

  public redraw() {
    this.graphics.clear();
    this.glowGraphics.clear();
    this.rotatingTechRing.clear();

    const r = this.currentRadius;
    const c = this.config.color;

    // 1. Soft atmospheric energy corona
    this.glowGraphics.fillStyle(c, 0.12);
    this.glowGraphics.fillCircle(0, 0, r + 26);
    this.glowGraphics.fillStyle(c, 0.22);
    this.glowGraphics.fillCircle(0, 0, r + 14);
    this.glowGraphics.fillStyle(c, 0.35);
    this.glowGraphics.fillCircle(0, 0, r + 6);

    // 2. Rotating tech ring (dashed segments & techno-notches)
    this.rotatingTechRing.lineStyle(2, 0xffffff, 0.65);
    const segments = 12;
    const segAngle = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      if (i % 2 === 0) {
        this.rotatingTechRing.beginPath();
        this.rotatingTechRing.arc(0, 0, r + 12, i * segAngle, (i + 0.65) * segAngle, false);
        this.rotatingTechRing.strokePath();
      }
    }
    // Subtle tick marks
    this.rotatingTechRing.lineStyle(1.5, c, 0.9);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      this.rotatingTechRing.lineBetween(
        Math.cos(a) * (r + 8),
        Math.sin(a) * (r + 8),
        Math.cos(a) * (r + 15),
        Math.sin(a) * (r + 15)
      );
    }

    // 3. Main portal body
    if (this.gateSprite) {
      this.gateSprite.setDisplaySize(r * 2.5, r * 2.5);
    } else {
      // Procedural portal chamber fallback
      this.graphics.fillStyle(0x020617, 0.95);
      this.graphics.fillCircle(0, 0, r);

      // Concentric depth iris rings
      this.graphics.fillStyle(c, 0.85);
      this.graphics.fillCircle(0, 0, r - 3);

      this.graphics.lineStyle(2.5, 0xffffff, 0.9);
      this.graphics.strokeCircle(0, 0, r - 3);

      // Inner energy glow
      this.graphics.fillStyle(0xffffff, 0.22);
      this.graphics.fillCircle(0, 0, r * 0.65);

      this.graphics.lineStyle(1.5, 0xffffff, 0.5);
      this.graphics.strokeCircle(0, 0, r * 0.45);

      // Glass dome crescent reflection
      this.graphics.fillStyle(0xffffff, 0.35);
      this.graphics.fillCircle(-r * 0.28, -r * 0.28, r * 0.38);
    }

    // Reposition orbiting satellites
    const satR = r + 16;
    for (let i = 0; i < this.satellites.length; i++) {
      const a = (i * Math.PI * 2) / this.satellites.length;
      this.satellites[i].setPosition(Math.cos(a) * satR, Math.sin(a) * satR);
      this.satellites[i].setFillStyle(c, 0.9);
    }
  }

  // Called when a matching circle is absorbed
  public grow() {
    this.currentRadius = Math.min(this.maxRadius, this.currentRadius + this.growthPerMatch);
    this.redraw();

    // Shockwave donut ring expanding from portal
    const shockwave = this.scene.add.circle(this.x, this.y, this.getRadius() * 0.8);
    shockwave.setStrokeStyle(4, this.config.color, 1);
    shockwave.setDepth(150);

    this.scene.tweens.add({
      targets: shockwave,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.easeOut',
      onComplete: () => shockwave.destroy()
    });

    // Joyful celebration sparkles from gate
    for (let i = 0; i < 5; i++) {
      const sparkle = this.scene.add.text(
        this.x + Phaser.Math.Between(-15, 15),
        this.y + Phaser.Math.Between(-15, 15),
        '✨',
        { fontSize: '18px' }
      ).setOrigin(0.5).setDepth(155);

      this.scene.tweens.add({
        targets: sparkle,
        x: sparkle.x + Phaser.Math.Between(-30, 30),
        y: sparkle.y - Phaser.Math.Between(25, 50),
        alpha: 0,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 520,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }

    // Bouncy spring squash-and-stretch pop
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 140,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  // Visual error reaction when wrong ball collides with this target
  public flashError() {
    const isHorizontal = this.config.side === 'top' || this.config.side === 'bottom';
    const prop = isHorizontal ? 'x' : 'y';
    const curVal = isHorizontal ? this.x : this.y;

    // Red tint reaction on the cute guardian creature
    if (this.gateSprite) {
      this.gateSprite.setTint(0xff2255);
      this.scene.time.delayedCall(320, () => {
        if (this.gateSprite) this.gateSprite.clearTint();
      });
    }

    // Energetic glitch shake
    this.scene.tweens.add({
      targets: this,
      [prop]: curVal + (Math.random() > 0.5 ? 10 : -10),
      duration: 35,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut'
    });

    // Intense red expanding shockwave ring
    const ring = this.scene.add.circle(this.x, this.y, this.getRadius() + 6);
    ring.setStrokeStyle(3.5, 0xff0055, 1);
    ring.setDepth(160);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  // Anticipation warning before movement starts
  public prepareMoving() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 220,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut'
    });
  }

  // Start movement challenge gently and smoothly from current position without any jumping
  public startMoving() {
    if (this.moveTween) {
      this.moveTween.stop();
    }

    const isHorizontal = this.config.side === 'top' || this.config.side === 'bottom';
    const fullDuration = 3800;

    if (isHorizontal) {
      const minX = 220;
      const maxX = 680;
      const targetFirst = Math.random() > 0.5 ? maxX : minX;
      const distToFirst = Math.abs(targetFirst - this.x);
      const totalSpan = maxX - minX;
      const initialDuration = Math.max(1600, (distToFirst / totalSpan) * fullDuration);

      this.moveTween = this.scene.tweens.add({
        targets: this,
        x: targetFirst,
        duration: initialDuration,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.moveTween = this.scene.tweens.add({
            targets: this,
            x: targetFirst === maxX ? minX : maxX,
            duration: fullDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    } else {
      const minY = 180;
      const maxY = 520;
      const targetFirst = Math.random() > 0.5 ? maxY : minY;
      const distToFirst = Math.abs(targetFirst - this.y);
      const totalSpan = maxY - minY;
      const initialDuration = Math.max(1600, (distToFirst / totalSpan) * fullDuration);

      this.moveTween = this.scene.tweens.add({
        targets: this,
        y: targetFirst,
        duration: initialDuration,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.moveTween = this.scene.tweens.add({
            targets: this,
            y: targetFirst === maxY ? minY : maxY,
            duration: fullDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    }
  }

  // Stop moving and return gracefully to base position
  public stopMoving() {
    if (this.moveTween) {
      this.moveTween.stop();
      this.moveTween = undefined;
    }

    this.scene.tweens.add({
      targets: this,
      x: this.initialX,
      y: this.initialY,
      duration: 1400,
      ease: 'Sine.easeInOut'
    });
  }

  public getRadius(): number {
    return this.currentRadius * this.scaleX;
  }

  public destroy(fromScene?: boolean) {
    if (this.pulseTween) this.pulseTween.stop();
    if (this.moveTween) this.moveTween.stop();
    super.destroy(fromScene);
  }
}
