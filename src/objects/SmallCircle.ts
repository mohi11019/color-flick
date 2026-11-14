import Phaser from 'phaser';
import { TargetSide } from '../types';

export interface SmallCircleConfig {
  color: number;
  isMatchingTarget: boolean;
  targetSide?: TargetSide;
}

export class SmallCircle extends Phaser.GameObjects.Container {
  public config: SmallCircleConfig;
  public radius: number = 18;
  public isDragging: boolean = false;
  public isDead: boolean = false;

  private graphics: Phaser.GameObjects.Graphics;
  private dragOffset: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

  // Gentle outward drift from center
  public driftSpeed: number;
  public driftAngle: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: SmallCircleConfig) {
    super(scene, x, y);
    this.config = config;

    // Physics body
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(this.radius, -this.radius, -this.radius);
    body.setBounce(0.2, 0.2);
    // Zero drag so it continuously drifts slowly without stopping
    body.setDrag(0, 0);

    // Initial slow drift in a random direction away from center
    this.driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.driftSpeed = Phaser.Math.FloatBetween(42, 68);
    body.setVelocity(
      Math.cos(this.driftAngle) * this.driftSpeed,
      Math.sin(this.driftAngle) * this.driftSpeed
    );

    // Visual graphics
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
      duration: 250,
      ease: 'Back.easeOut'
    });

    // Make circle interactive
    this.setSize(this.radius * 2.5, this.radius * 2.5);
    this.setInteractive({ useHandCursor: true });
  }

  private drawCircle() {
    this.graphics.clear();

    // Subtle outer halo
    this.graphics.fillStyle(this.config.color, 0.25);
    this.graphics.fillCircle(0, 0, this.radius + 6);

    // Main body
    this.graphics.fillStyle(this.config.color, 1);
    this.graphics.fillCircle(0, 0, this.radius);

    // Outline
    this.graphics.lineStyle(2, 0xffffff, 0.9);
    this.graphics.strokeCircle(0, 0, this.radius);

    // Specular shine dot
    this.graphics.fillStyle(0xffffff, 0.6);
    this.graphics.fillCircle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.28);
  }

  public startDrag(pointer: Phaser.Input.Pointer) {
    if (this.isDead) return;
    this.isDragging = true;
    this.dragOffset.set(this.x - pointer.x, this.y - pointer.y);

    // Stop velocity while being dragged
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 100,
      ease: 'Power1'
    });
  }

  public updateDrag(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging || this.isDead) return;

    this.x = pointer.x + this.dragOffset.x;
    this.y = pointer.y + this.dragOffset.y;
  }

  // Called when mouse is released: stops immediately with NO continuing flick/momentum
  public endDrag() {
    if (!this.isDragging || this.isDead) return;
    this.isDragging = false;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 120,
      ease: 'Power1'
    });

    // Stop completely where dropped (no inertia / no continuation)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  public destroy(fromScene?: boolean) {
    this.isDead = true;
    super.destroy(fromScene);
  }
}
