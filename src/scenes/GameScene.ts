import Phaser from 'phaser';
import { TargetCircle } from '../objects/TargetCircle';
import { SmallCircle, SmallCircleConfig } from '../objects/SmallCircle';
import { SoundManager } from '../sound/SoundManager';
import { TutorialDialog } from './TutorialDialog';
import { TARGET_COLORS, NON_MATCHING_COLORS, TargetSide } from '../types';
import { preloadGameAssets } from '../assets';

interface StardustParticle {
  arc: Phaser.GameObjects.Arc;
  speed: number;
}

export class GameScene extends Phaser.Scene {
  private soundManager!: SoundManager;

  // Game state
  private isGameRunning: boolean = false;
  private isGameOver: boolean = false;
  private isPausedForTutorial: boolean = false;
  private lives: number = 5;
  private readonly maxLives: number = 5;
  private score: number = 0;
  private highScore: number = 0;
  private survivalTimer: number = 0;

  // Combo system
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private readonly comboWindow: number = 3200; // ms

  // Objects
  private targetCircles: Map<TargetSide, TargetCircle> = new Map();
  private smallCircles: SmallCircle[] = [];
  private draggedCircle: SmallCircle | null = null;

  // Visual Atmosphere & Spawner
  private stardustParticles: StardustParticle[] = [];
  private exitBaysContainer!: Phaser.GameObjects.Container;
  private centerPortalContainer!: Phaser.GameObjects.Container;
  private centerOuterRing!: Phaser.GameObjects.Graphics;
  private centerInnerRing!: Phaser.GameObjects.Graphics;
  private centerCore!: Phaser.GameObjects.Arc;

  // Spawning & Difficulty scaling
  private spawnTimer: number = 0;
  private currentSpawnDelay: number = 1900; // ms
  private readonly minSpawnDelay: number = 750;
  private gameTimeElapsed: number = 0;

  // Challenge mechanic (moving target circles)
  private isChallengeActive: boolean = false;
  private challengeTimer: number = 0;
  private nextChallengeAt: number = 22000;
  private challengeDuration: number = 12000;

  // UI elements
  private hudContainer!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private heartsText!: Phaser.GameObjects.Text;
  private soundBtnText!: Phaser.GameObjects.Text;
  private challengeBanner!: Phaser.GameObjects.Container;

  // Screens
  private tutorialDialog!: TutorialDialog;
  private gameOverContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('GameScene');
  }

  preload() {
    preloadGameAssets(this);
  }

  create() {
    this.soundManager = new SoundManager();

    // Load highscore
    const saved = localStorage.getItem('color_flick_highscore');
    this.highScore = saved ? parseInt(saved, 10) : 0;

    const { width, height } = this.scale;

    // Background decoration & floating stardust
    this.createBackground(width, height);

    // Visual Exit Zones along borders and in corners
    this.createExitZones(width, height);

    // Center Spawner Portal
    this.createCenterPortal(width / 2, height / 2);

    // Create 4 Target Circles on the borders
    this.createTargetCircles(width, height);

    // Create HUD
    this.createHUD(width, height);

    // Global Pointer Listeners for dragging
    this.setupInputListeners();

    // Multi-page Illustrated Visual Tutorial Dialog
    this.tutorialDialog = new TutorialDialog(this, width, height, () => {
      if (this.isPausedForTutorial) {
        this.isPausedForTutorial = false;
      } else {
        this.startGame();
      }
    });

    // Game Over Screen (hidden initially)
    this.createGameOverScreen(width, height);
  }

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    // Deep sci-fi radial gradient
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x020617, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle ambient cyber grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b, 0.45);
    for (let x = 0; x <= width; x += 55) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 55) {
      grid.lineBetween(0, y, width, y);
    }

    // Drifting ambient stardust particles (Parallax depth)
    for (let i = 0; i < 40; i++) {
      const px = Phaser.Math.Between(0, width);
      const py = Phaser.Math.Between(0, height);
      const pr = Phaser.Math.FloatBetween(1.2, 2.8);
      const alpha = Phaser.Math.FloatBetween(0.18, 0.65);
      const star = this.add.circle(px, py, pr, 0x38bdf8, alpha);
      star.setDepth(5);

      this.stardustParticles.push({
        arc: star,
        speed: Phaser.Math.FloatBetween(8, 22)
      });
    }
  }

  // Visual Exit Zones (دریچه‌های خروج نئونی در گوشه‌ها و لبه‌های آزاد)
  private createExitZones(width: number, height: number) {
    this.exitBaysContainer = this.add.container(0, 0).setDepth(20);

    const cornerSize = 82;
    const corners = [
      { x: 0, y: 0, label: '⇖ خروج', originX: 0, originY: 0, textX: 18, textY: 18 },
      { x: width, y: 0, label: 'خروج ⇗', originX: 1, originY: 0, textX: width - 18, textY: 18 },
      { x: 0, y: height, label: '⇙ خروج', originX: 0, originY: 1, textX: 18, textY: height - 18 },
      { x: width, y: height, label: 'خروج ⇘', originX: 1, originY: 1, textX: width - 18, textY: height - 18 }
    ];

    corners.forEach(c => {
      const wedge = this.add.graphics();
      // Shaded corner disposal bay
      wedge.fillStyle(0x06b6d4, 0.16);
      wedge.beginPath();
      if (c.originX === 0 && c.originY === 0) {
        wedge.moveTo(0, 0);
        wedge.lineTo(cornerSize, 0);
        wedge.lineTo(0, cornerSize);
      } else if (c.originX === 1 && c.originY === 0) {
        wedge.moveTo(width, 0);
        wedge.lineTo(width - cornerSize, 0);
        wedge.lineTo(width, cornerSize);
      } else if (c.originX === 0 && c.originY === 1) {
        wedge.moveTo(0, height);
        wedge.lineTo(cornerSize, height);
        wedge.lineTo(0, height - cornerSize);
      } else {
        wedge.moveTo(width, height);
        wedge.lineTo(width - cornerSize, height);
        wedge.lineTo(width, height - cornerSize);
      }
      wedge.closePath();
      wedge.fillPath();

      // Glowing diagonal border
      wedge.lineStyle(2.5, 0x22d3ee, 0.75);
      wedge.strokePath();

      // Inner chevron bracket
      wedge.lineStyle(1.5, 0x38bdf8, 0.4);
      if (c.originX === 0 && c.originY === 0) {
        wedge.lineBetween(14, 14, 38, 14);
        wedge.lineBetween(14, 14, 14, 38);
      } else if (c.originX === 1 && c.originY === 0) {
        wedge.lineBetween(width - 14, 14, width - 38, 14);
        wedge.lineBetween(width - 14, 14, width - 14, 38);
      } else if (c.originX === 0 && c.originY === 1) {
        wedge.lineBetween(14, height - 14, 38, height - 14);
        wedge.lineBetween(14, height - 14, 14, height - 38);
      } else {
        wedge.lineBetween(width - 14, height - 14, width - 38, height - 14);
        wedge.lineBetween(width - 14, height - 14, width - 14, height - 38);
      }

      // Corner label
      const label = this.add.text(c.textX, c.textY, c.label, {
        fontSize: '13px',
        color: '#22d3ee',
        fontStyle: 'bold',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }).setOrigin(c.originX, c.originY);

      this.exitBaysContainer.add([wedge, label]);
    });

    // Dashed border intake markers along edges
    const edgeMarkers = [
      { x1: 95, y1: 4, x2: 330, y2: 4 },
      { x1: 570, y1: 4, x2: 805, y2: 4 },
      { x1: 95, y1: height - 4, x2: 330, y2: height - 4 },
      { x1: 570, y1: height - 4, x2: 805, y2: height - 4 },
      { x1: 4, y1: 95, x2: 4, y2: 235 },
      { x1: 4, y1: 465, x2: 4, y2: 605 },
      { x1: width - 4, y1: 95, x2: width - 4, y2: 235 },
      { x1: width - 4, y1: 465, x2: width - 4, y2: 605 }
    ];

    const markersGfx = this.add.graphics();
    markersGfx.lineStyle(3, 0x06b6d4, 0.45);
    edgeMarkers.forEach(m => markersGfx.lineBetween(m.x1, m.y1, m.x2, m.y2));
    this.exitBaysContainer.add(markersGfx);

    // Subtle energetic pulse on exit bays
    this.tweens.add({
      targets: this.exitBaysContainer,
      alpha: 0.8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Futuristic Center Spawner Portal with multi-layered rotation
  private createCenterPortal(cx: number, cy: number) {
    this.centerPortalContainer = this.add.container(cx, cy).setDepth(25);

    // Outer rotating techno rune ring
    this.centerOuterRing = this.add.graphics();
    this.centerOuterRing.lineStyle(2, 0x38bdf8, 0.45);
    this.centerOuterRing.strokeCircle(0, 0, 42);

    // Techno tick marks around spawner
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      this.centerOuterRing.lineBetween(
        Math.cos(a) * 38,
        Math.sin(a) * 38,
        Math.cos(a) * 46,
        Math.sin(a) * 46
      );
    }
    this.centerPortalContainer.add(this.centerOuterRing);

    // Inner counter-rotating ring
    this.centerInnerRing = this.add.graphics();
    this.centerInnerRing.lineStyle(1.5, 0x06b6d4, 0.35);
    this.centerInnerRing.strokeCircle(0, 0, 26);
    this.centerPortalContainer.add(this.centerInnerRing);

    // Central pulsing core
    this.centerCore = this.add.circle(0, 0, 14, 0x38bdf8, 0.65);
    this.centerPortalContainer.add(this.centerCore);

    // Rotating tweens
    this.tweens.add({
      targets: this.centerOuterRing,
      angle: 360,
      duration: 14000,
      repeat: -1,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: this.centerInnerRing,
      angle: -360,
      duration: 8000,
      repeat: -1,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: this.centerCore,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.35,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createTargetCircles(width: number, height: number) {
    // Top: Blue
    const top = new TargetCircle(this, width / 2, 60, TARGET_COLORS.top);
    this.targetCircles.set('top', top);

    // Bottom: Red
    const bottom = new TargetCircle(this, width / 2, height - 60, TARGET_COLORS.bottom);
    this.targetCircles.set('bottom', bottom);

    // Left: Green
    const left = new TargetCircle(this, 65, height / 2, TARGET_COLORS.left);
    this.targetCircles.set('left', left);

    // Right: Yellow
    const right = new TargetCircle(this, width - 65, height / 2, TARGET_COLORS.right);
    this.targetCircles.set('right', right);
  }

  private createHUD(width: number, _height: number) {
    this.hudContainer = this.add.container(0, 0).setDepth(100);

    // Hearts (Lives) on the top left
    this.heartsText = this.add.text(25, 20, '', {
      fontSize: '24px',
      color: '#ff4757',
      fontStyle: 'bold'
    });
    this.hudContainer.add(this.heartsText);
    this.updateHeartsDisplay();

    // Help Button
    const helpBtn = this.add.container(205, 32);
    const helpBg = this.add.rectangle(0, 0, 80, 28, 0x1e293b, 0.9);
    helpBg.setStrokeStyle(1, 0x475569);
    helpBg.setInteractive({ useHandCursor: true });
    const helpText = this.add.text(0, 0, '📖 راهنما', {
      fontSize: '13px',
      color: '#93c5fd',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    helpBg.on('pointerover', () => helpBg.setFillStyle(0x334155));
    helpBg.on('pointerout', () => helpBg.setFillStyle(0x1e293b));
    helpBg.on('pointerdown', () => {
      this.isPausedForTutorial = true;
      this.tutorialDialog.setVisible(true);
    });
    helpBtn.add([helpBg, helpText]);
    this.hudContainer.add(helpBtn);

    // Sound Toggle Button (Mute/Unmute)
    const soundBtn = this.add.container(295, 32);
    const soundBg = this.add.rectangle(0, 0, 75, 28, 0x1e293b, 0.9);
    soundBg.setStrokeStyle(1, 0x475569);
    soundBg.setInteractive({ useHandCursor: true });
    this.soundBtnText = this.add.text(0, 0, '🔊 صدا', {
      fontSize: '12px',
      color: '#cbd5e1',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    soundBg.on('pointerover', () => soundBg.setFillStyle(0x334155));
    soundBg.on('pointerout', () => soundBg.setFillStyle(0x1e293b));
    soundBg.on('pointerdown', () => {
      const isMuted = this.soundManager.toggleMute();
      this.soundBtnText.setText(isMuted ? '🔇 بی‌صدا' : '🔊 صدا');
      this.soundBtnText.setColor(isMuted ? '#f87171' : '#cbd5e1');
    });
    soundBtn.add([soundBg, this.soundBtnText]);
    this.hudContainer.add(soundBtn);

    // Return to Main Menu Button
    const menuBtn = this.add.container(380, 32);
    const menuBg = this.add.rectangle(0, 0, 75, 28, 0x1e293b, 0.9);
    menuBg.setStrokeStyle(1, 0x475569);
    menuBg.setInteractive({ useHandCursor: true });
    const menuText = this.add.text(0, 0, '🏠 منو', {
      fontSize: '12px',
      color: '#cbd5e1',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    menuBg.on('pointerover', () => menuBg.setFillStyle(0x334155));
    menuBg.on('pointerout', () => menuBg.setFillStyle(0x1e293b));
    menuBg.on('pointerdown', () => {
      this.soundManager.playGrab();
      this.scene.start('MenuScene');
    });
    menuBtn.add([menuBg, menuText]);
    this.hudContainer.add(menuBtn);

    // Score on top right
    this.scoreText = this.add.text(width - 25, 20, 'امتیاز: ۰', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.scoreText);

    // High score below score
    this.highScoreText = this.add.text(width - 25, 50, `رکورد: ${this.highScore}`, {
      fontSize: '15px',
      color: '#f59e0b',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.highScoreText);

    // Challenge Banner
    this.challengeBanner = this.add.container(width / 2, 120).setAlpha(0);
    const bannerBg = this.add.rectangle(0, 0, 380, 42, 0xff0055, 0.88);
    bannerBg.setStrokeStyle(2, 0xffffff, 0.95);
    const bannerText = this.add.text(0, 0, '⚠️ چالش: حرکت آرام دروازه‌های اطراف! ⚠️', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    this.challengeBanner.add([bannerBg, bannerText]);
    this.hudContainer.add(this.challengeBanner);
  }

  private updateHeartsDisplay() {
    let hearts = '';
    for (let i = 0; i < this.maxLives; i++) {
      hearts += i < this.lives ? '❤️ ' : '🖤 ';
    }
    this.heartsText.setText(hearts);
  }

  private setupInputListeners() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameRunning || this.isGameOver || this.isPausedForTutorial) return;

      // Find if clicked on any small circle (top-most first)
      for (let i = this.smallCircles.length - 1; i >= 0; i--) {
        const circle = this.smallCircles[i];
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, circle.x, circle.y);
        if (dist <= circle.radius * 1.6) {
          this.draggedCircle = circle;
          circle.startDrag(pointer);
          this.soundManager.playGrab();
          break;
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.draggedCircle) {
        this.draggedCircle.updateDrag(pointer);
      }
    });

    this.input.on('pointerup', () => {
      if (this.draggedCircle) {
        this.draggedCircle.endDrag();
        this.draggedCircle = null;
      }
    });
  }

  private createGameOverScreen(width: number, height: number) {
    this.gameOverContainer = this.add.container(0, 0).setDepth(200).setVisible(false);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88);
    const card = this.add.rectangle(width / 2, height / 2, 520, 390, 0x1e1b4b, 0.96);
    card.setStrokeStyle(3, 0xff0055, 0.85);

    const title = this.add.text(width / 2, height / 2 - 130, 'بازی تمام شد!', {
      fontSize: '36px',
      color: '#ff4757',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const finalScore = this.add.text(width / 2, height / 2 - 55, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5).setName('finalScore');

    const highScoreMsg = this.add.text(width / 2, height / 2 - 10, '', {
      fontSize: '18px',
      color: '#f59e0b',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5).setName('highScoreMsg');

    // 1. Restart button
    const restartBtn = this.add.rectangle(width / 2 - 145, height / 2 + 85, 135, 46, 0x10b981, 1);
    restartBtn.setInteractive({ useHandCursor: true });
    const restartText = this.add.text(width / 2 - 145, height / 2 + 85, 'تکرار 🔁', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x059669));
    restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x10b981));
    restartBtn.on('pointerdown', () => {
      this.soundManager.playMatch(1);
      this.restartGame();
    });

    // 2. Main Menu button
    const menuBtn = this.add.rectangle(width / 2, height / 2 + 85, 135, 46, 0x0284c7, 1);
    menuBtn.setInteractive({ useHandCursor: true });
    const menuText = this.add.text(width / 2, height / 2 + 85, 'منو 🏠', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x0369a1));
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x0284c7));
    menuBtn.on('pointerdown', () => {
      this.soundManager.playGrab();
      this.scene.start('MenuScene');
    });

    // 3. Tutorial / Guide button
    const guideBtn = this.add.rectangle(width / 2 + 145, height / 2 + 85, 135, 46, 0x334155, 1);
    guideBtn.setInteractive({ useHandCursor: true });
    const guideText = this.add.text(width / 2 + 145, height / 2 + 85, 'راهنما 📖', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    guideBtn.on('pointerover', () => guideBtn.setFillStyle(0x475569));
    guideBtn.on('pointerout', () => guideBtn.setFillStyle(0x334155));
    guideBtn.on('pointerdown', () => {
      this.tutorialDialog.setVisible(true);
    });

    this.gameOverContainer.add([
      overlay,
      card,
      title,
      finalScore,
      highScoreMsg,
      restartBtn,
      restartText,
      menuBtn,
      menuText,
      guideBtn,
      guideText
    ]);
  }

  private startGame() {
    this.isGameRunning = true;
    this.isGameOver = false;
    this.isPausedForTutorial = false;
    this.lives = this.maxLives;
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.survivalTimer = 0;
    this.gameTimeElapsed = 0;
    this.spawnTimer = 0;
    this.currentSpawnDelay = 1900;
    this.isChallengeActive = false;
    this.challengeTimer = 0;
    this.nextChallengeAt = 22000;

    this.updateHeartsDisplay();
    this.scoreText.setText(`امتیاز: ${this.score}`);
    this.spawnInitialCircle();
  }

  private restartGame() {
    this.smallCircles.forEach(c => c.destroy());
    this.smallCircles = [];
    this.draggedCircle = null;

    this.targetCircles.forEach(target => {
      target.currentRadius = target.baseRadius;
      target.redraw();
      target.stopMoving();
    });

    this.challengeBanner.setAlpha(0);
    this.gameOverContainer.setVisible(false);
    this.startGame();
  }

  private spawnInitialCircle() {
    this.spawnCircle();
  }

  private spawnCircle() {
    if (!this.isGameRunning || this.isGameOver || this.isPausedForTutorial) return;

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Portal energy flash
    this.tweens.add({
      targets: this.centerCore,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 1,
      duration: 160,
      yoyo: true,
      ease: 'Power2'
    });

    // 65% chance matching one of 4 targets, 35% chance non-matching
    const isMatching = Math.random() < 0.65;
    let config: SmallCircleConfig;

    if (isMatching) {
      const sides: TargetSide[] = ['top', 'bottom', 'left', 'right'];
      const chosenSide = Phaser.Utils.Array.GetRandom(sides) as TargetSide;
      config = {
        color: TARGET_COLORS[chosenSide].color,
        isMatchingTarget: true,
        targetSide: chosenSide,
        textureKey: `orb_${TARGET_COLORS[chosenSide].name}`
      };
    } else {
      const nonMatch = Phaser.Utils.Array.GetRandom(NON_MATCHING_COLORS);
      const texKey = nonMatch.name === 'silver' ? 'orb_silver' : `orb_${nonMatch.name}`;
      config = {
        color: nonMatch.color,
        isMatchingTarget: false,
        textureKey: texKey
      };
    }

    const circle = new SmallCircle(this, cx, cy, config);
    this.smallCircles.push(circle);
    this.soundManager.playSpawn();

    // Spurt of mini birth particles
    this.createColorBurst(cx, cy, config.color, 8);
  }

  update(_time: number, delta: number) {
    if (!this.isGameRunning || this.isGameOver || this.isPausedForTutorial) return;

    this.gameTimeElapsed += delta;
    this.survivalTimer += delta;

    // Continuous time score (+10 points every second)
    if (this.survivalTimer >= 1000) {
      this.survivalTimer -= 1000;
      this.addScore(10);
    }

    // Combo countdown timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Update drifting background stardust
    const { width, height } = this.scale;
    this.stardustParticles.forEach(p => {
      p.arc.x += (p.speed * delta) / 1000;
      p.arc.y += (p.speed * 0.4 * delta) / 1000;
      if (p.arc.x > width + 10) p.arc.x = -10;
      if (p.arc.y > height + 10) p.arc.y = -10;
    });

    // Difficulty scaling: spawn circles faster over time
    this.currentSpawnDelay = Math.max(
      this.minSpawnDelay,
      1900 - Math.floor(this.gameTimeElapsed / 1000) * 22
    );

    // Spawning logic
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentSpawnDelay) {
      this.spawnTimer = 0;
      this.spawnCircle();
    }

    // Challenge logic
    this.handleChallenge(delta);

    // Update and check small circles (trail, collisions, exit zones, & border exit)
    this.processSmallCircles(delta);
  }

  private handleChallenge(delta: number) {
    if (!this.isChallengeActive) {
      if (this.gameTimeElapsed >= this.nextChallengeAt) {
        this.triggerChallenge();
      }
    } else {
      this.challengeTimer += delta;
      if (this.challengeTimer >= this.challengeDuration) {
        this.endChallenge();
      }
    }
  }

  private triggerChallenge() {
    this.isChallengeActive = true;
    this.challengeTimer = 0;
    this.soundManager.playAlert();

    this.tweens.add({
      targets: this.challengeBanner,
      alpha: 1,
      y: 110,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Phase 1: 1.0 second anticipation vibration/pulse
    this.targetCircles.forEach(target => {
      target.prepareMoving();
    });

    // Phase 2: After 1.0s, begin the gentle, slow glide
    this.time.delayedCall(1000, () => {
      if (this.isChallengeActive && !this.isGameOver) {
        this.targetCircles.forEach(target => {
          target.startMoving();
        });
      }
    });
  }

  private endChallenge() {
    this.isChallengeActive = false;
    this.nextChallengeAt = this.gameTimeElapsed + 22000 + Math.random() * 6000;

    this.tweens.add({
      targets: this.challengeBanner,
      alpha: 0,
      y: 80,
      duration: 400,
      ease: 'Cubic.easeIn'
    });

    this.targetCircles.forEach(target => {
      target.stopMoving();
    });
  }

  private isInsideExitZone(x: number, y: number): boolean {
    const { width, height } = this.scale;
    const margin = 42;

    const isNearBorder = x <= margin || x >= width - margin || y <= margin || y >= height - margin;
    if (!isNearBorder) return false;

    for (const target of this.targetCircles.values()) {
      const dist = Phaser.Math.Distance.Between(x, y, target.x, target.y);
      if (dist <= target.getRadius() + 20) {
        return false;
      }
    }

    return true;
  }

  private processSmallCircles(delta: number) {
    const { width, height } = this.scale;
    const boundaryBuffer = 15;

    for (let i = this.smallCircles.length - 1; i >= 0; i--) {
      const circle = this.smallCircles[i];
      if (circle.isDead) {
        this.smallCircles.splice(i, 1);
        continue;
      }

      // Update particle stardust trail
      circle.updateTrail(delta);

      // 1. Check collision with any target circle
      let collidedWithTarget = false;
      this.targetCircles.forEach((target, side) => {
        if (collidedWithTarget || circle.isDead) return;

        const dist = Phaser.Math.Distance.Between(circle.x, circle.y, target.x, target.y);
        const hitDistance = circle.radius + target.getRadius();

        if (dist <= hitDistance) {
          collidedWithTarget = true;
          if (this.draggedCircle === circle) {
            this.draggedCircle = null;
          }
          this.handleTargetCollision(circle, target, side);
        }
      });

      if (collidedWithTarget || circle.isDead) {
        this.smallCircles.splice(i, 1);
        continue;
      }

      // 2. Check collision with Exit Zones
      if (this.isInsideExitZone(circle.x, circle.y)) {
        this.handleExitZone(circle);
        this.smallCircles.splice(i, 1);
        continue;
      }

      // 3. Fallback: if circle completely exited past canvas boundary
      const isOutsideCanvas =
        circle.x < -boundaryBuffer ||
        circle.x > width + boundaryBuffer ||
        circle.y < -boundaryBuffer ||
        circle.y > height + boundaryBuffer;

      if (isOutsideCanvas) {
        this.handleExitZone(circle);
        this.smallCircles.splice(i, 1);
      }
    }
  }

  private handleTargetCollision(circle: SmallCircle, target: TargetCircle, targetSide: TargetSide) {
    if (circle.config.isMatchingTarget && circle.config.targetSide === targetSide) {
      // MATCH SUCCESS!
      this.comboCount++;
      this.comboTimer = this.comboWindow;

      const points = 100 * this.comboCount;
      this.addScore(points);
      this.soundManager.playMatch(this.comboCount);
      target.grow();

      // Juicy combo floating text feedback
      if (this.comboCount >= 2) {
        const titles = ['', '', '🔥 کومبو ۲x!', '⚡ کومبو ۳x!', '🌟 سوپر کومبو ۴x!', '👑 الترا کومبو ۵x!'];
        const badge = titles[Math.min(this.comboCount, titles.length - 1)] || `🔥 کومبو ${this.comboCount}x!`;
        this.showFloatingText(target.x, target.y - 30, `${badge} (+${points})`, '#f59e0b', 22);
      } else {
        this.showFloatingText(target.x, target.y, `+${points} ✨`, '#2ecc71', 18);
      }

      this.createColorBurst(circle.x, circle.y, circle.config.color, 22);
      circle.destroy();
    } else {
      // MISMATCH: reset combo
      this.comboCount = 0;
      this.comboTimer = 0;
      this.showMistakeAt(circle.x, circle.y, target, 'برخورد اشتباه با دروازه!');
      circle.destroy();
    }
  }

  private handleExitZone(circle: SmallCircle) {
    if (circle.isDead) return;
    circle.isDead = true;

    if (this.draggedCircle === circle) {
      this.draggedCircle = null;
    }

    // Elongated suction vortex effect
    this.tweens.add({
      targets: circle,
      scaleX: 0.2,
      scaleY: 1.6,
      alpha: 0.1,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => circle.destroy()
    });

    if (!circle.config.isMatchingTarget) {
      // NON-MATCHING EXITED SAFELY -> SUCCESS!
      this.soundManager.playDiscard();
      this.addScore(50);
      this.showFloatingText(
        Phaser.Math.Clamp(circle.x, 80, this.scale.width - 80),
        Phaser.Math.Clamp(circle.y, 80, this.scale.height - 80),
        '+50 🚀 خروج موفق',
        '#38bdf8'
      );
      this.createColorBurst(circle.x, circle.y, 0x06b6d4, 14);
    } else {
      // MATCHING CIRCLE ESCAPED INTO EXIT ZONE -> PENALTY!
      this.comboCount = 0;
      this.comboTimer = 0;
      this.showMistakeAt(circle.x, circle.y, undefined, 'دایره همرنگ وارد خروجی شد!');
    }
  }

  private showMistakeAt(x: number, y: number, target?: TargetCircle, reason: string = 'خطا!') {
    this.soundManager.playHurt();
    this.cameras.main.shake(130, 0.007);

    if (target) {
      target.flashError();
    }

    const ring = this.add.circle(x, y, 16);
    ring.setStrokeStyle(3, 0xff0055, 1);
    ring.setFillStyle(0xff0055, 0.25);
    ring.setDepth(160);

    this.tweens.add({
      targets: ring,
      radius: 65,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    const cross = this.add.text(x, y, '✖', {
      fontSize: '28px',
      color: '#ff0055',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(170);

    cross.setScale(0);
    this.tweens.add({
      targets: cross,
      scaleX: 1.35,
      scaleY: 1.35,
      y: y - 18,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: cross,
          alpha: 0,
          y: y - 40,
          duration: 350,
          ease: 'Cubic.easeIn',
          onComplete: () => cross.destroy()
        });
      }
    });

    this.createColorBurst(x, y, 0xff0055, 18);

    const clampedX = Phaser.Math.Clamp(x, 110, this.scale.width - 110);
    const clampedY = Phaser.Math.Clamp(y - 36, 50, this.scale.height - 50);
    this.showFloatingText(clampedX, clampedY, `❌ ${reason} (-۱ ❤️)`, '#ff4757', 16);

    this.loseLife();
  }

  private addScore(amount: number) {
    this.score += amount;
    this.scoreText.setText(`امتیاز: ${this.score}`);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreText.setText(`رکورد: ${this.highScore}`);
      localStorage.setItem('color_flick_highscore', this.highScore.toString());
    }
  }

  private loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    this.updateHeartsDisplay();

    this.tweens.add({
      targets: this.heartsText,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 120,
      yoyo: true,
      ease: 'Power1'
    });

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.isGameRunning = false;
    this.soundManager.playGameOver();

    this.targetCircles.forEach(t => t.stopMoving());
    this.challengeBanner.setAlpha(0);

    const finalScoreText = this.gameOverContainer.getByName('finalScore') as Phaser.GameObjects.Text;
    const highScoreMsg = this.gameOverContainer.getByName('highScoreMsg') as Phaser.GameObjects.Text;

    if (finalScoreText) {
      finalScoreText.setText(`امتیاز شما: ${this.score}`);
    }

    if (highScoreMsg) {
      if (this.score >= this.highScore && this.score > 0) {
        highScoreMsg.setText(`🔥 تبریک! رکورد جدید ثبت شد: ${this.highScore}`);
      } else {
        highScoreMsg.setText(`بهترین رکورد ثبت شده: ${this.highScore}`);
      }
    }

    this.gameOverContainer.setAlpha(0).setVisible(true);
    this.tweens.add({
      targets: this.gameOverContainer,
      alpha: 1,
      duration: 350,
      ease: 'Power2'
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string, fontSize: number = 18) {
    const floating = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: color,
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: floating,
      y: y - 50,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => floating.destroy()
    });
  }

  private createColorBurst(x: number, y: number, color: number, count: number = 16) {
    for (let i = 0; i < count; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2.5, 5.5), color);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(60, 240);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.tweens.add({
        targets: p,
        x: x + vx * 0.45,
        y: y + vy * 0.45,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(360, 600),
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }
}
