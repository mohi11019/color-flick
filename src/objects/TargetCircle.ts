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
  private pulseTween?: Phaser.Tweens.Tween;
  private moveTween?: Phaser.Tweens.Tween;

  public initialX: number;
  public initialY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TargetColorConfig) {
    super(scene, x, y);
    this.config = config;
    this.initialX = x;
    this.initialY = y;
    this.currentRadius = this.baseRadius;

    // Glowing outer ring
    this.glowGraphics = scene.add.graphics();
    this.add(this.glowGraphics);

    // Main circle graphics
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

    this.redraw();
    scene.add.existing(this);

    // Ambient breathing pulse
    this.pulseTween = scene.tweens.add({
      targets: this,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public redraw() {
    this.graphics.clear();
    this.glowGraphics.clear();

    const r = this.currentRadius;

    // Outer glow aura
    this.glowGraphics.fillStyle(this.config.color, 0.18);
    this.glowGraphics.fillCircle(0, 0, r + 14);

    this.glowGraphics.fillStyle(this.config.color, 0.3);
    this.glowGraphics.fillCircle(0, 0, r + 7);

    // Main filled circle with smooth border
    this.graphics.fillStyle(this.config.color, 0.95);
    this.graphics.fillCircle(0, 0, r);

    // Shiny inner ring
    this.graphics.lineStyle(3, 0xffffff, 0.85);
    this.graphics.strokeCircle(0, 0, r - 3);

    // Inner highlight
    this.graphics.fillStyle(0xffffff, 0.25);
    this.graphics.fillCircle(-r * 0.25, -r * 0.25, r * 0.35);
  }

  // Called when a matching circle is absorbed
  public grow() {
    this.currentRadius = Math.min(this.maxRadius, this.currentRadius + this.growthPerMatch);
    this.redraw();

    // Satisfying bounce pop animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 160,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  // Visual error reaction when wrong ball collides with this target
  public flashError() {
    // Shake target briefly
    const isHorizontal = this.config.side === 'top' || this.config.side === 'bottom';
    const prop = isHorizontal ? 'x' : 'y';
    const curVal = isHorizontal ? this.x : this.y;

    this.scene.tweens.add({
      targets: this,
      [prop]: curVal + (Math.random() > 0.5 ? 9 : -9),
      duration: 40,
      yoyo: true,
      repeat: 4,
      ease: 'Sine.easeInOut'
    });

    // Red expanding shockwave ring around this target
    const ring = this.scene.add.circle(this.x, this.y, this.getRadius() + 6);
    ring.setStrokeStyle(3, 0xff0055, 1);
    ring.setDepth(160);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  // Anticipation warning before movement starts
  public prepareMoving() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 250,
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
    const fullDuration = 3800; // Slow, leisurely sway

    if (isHorizontal) {
      const minX = 220;
      const maxX = 680;
      const targetFirst = Math.random() > 0.5 ? maxX : minX;
      const distToFirst = Math.abs(targetFirst - this.x);
      const totalSpan = maxX - minX;
      const initialDuration = Math.max(1600, (distToFirst / totalSpan) * fullDuration);

      // Phase 1: Gently glide from current position to first end point
      this.moveTween = this.scene.tweens.add({
        targets: this,
        x: targetFirst,
        duration: initialDuration,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Phase 2: Now continuously oscillate back and forth smoothly
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

      // Phase 1: Gently glide from current position to first end point
      this.moveTween = this.scene.tweens.add({
        targets: this,
        y: targetFirst,
        duration: initialDuration,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Phase 2: Now continuously oscillate back and forth smoothly
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
