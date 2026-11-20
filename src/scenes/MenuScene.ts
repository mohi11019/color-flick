import Phaser from 'phaser';
import { SoundManager } from '../sound/SoundManager';
import { preloadGameAssets } from '../assets';

interface StardustParticle {
  arc: Phaser.GameObjects.Arc;
  speed: number;
}

export class MenuScene extends Phaser.Scene {
  private soundManager!: SoundManager;

  // Background elements
  private stardustParticles: StardustParticle[] = [];
  private menuPortalContainer!: Phaser.GameObjects.Container;

  // Views containers
  private mainMenuView!: Phaser.GameObjects.Container;
  private stageSelectView!: Phaser.GameObjects.Container;
  private settingsView!: Phaser.GameObjects.Container;
  private aboutView!: Phaser.GameObjects.Container;

  // State
  private highScore: number = 0;
  private screenShakeEnabled: boolean = true;

  constructor() {
    super('MenuScene');
  }

  preload() {
    preloadGameAssets(this);
  }

  create() {
    this.soundManager = new SoundManager();

    // Load saved highscore
    const savedScore = localStorage.getItem('color_flick_highscore');
    this.highScore = savedScore ? parseInt(savedScore, 10) : 0;

    // Load screen shake setting
    const savedShake = localStorage.getItem('color_flick_screenshake');
    this.screenShakeEnabled = savedShake !== null ? savedShake === 'true' : true;

    const { width, height } = this.scale;

    // 1. Animated Sci-Fi Background
    this.createBackground(width, height);

    // 2. Decorative Center Portal in menu background
    this.createBackgroundPortal(width / 2, height / 2 - 40);

    // 3. Create all menu view containers
    this.createMainMenuView(width, height);
    this.createStageSelectView(width, height);
    this.createSettingsView(width, height);
    this.createAboutView(width, height);

    // Initial state: show Main Menu
    this.showView(this.mainMenuView);
  }

  private createBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x020617, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    // Ambient grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e293b, 0.45);
    for (let x = 0; x <= width; x += 55) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += 55) {
      grid.lineBetween(0, y, width, y);
    }

    // Drifting stardust particles
    for (let i = 0; i < 45; i++) {
      const px = Phaser.Math.Between(0, width);
      const py = Phaser.Math.Between(0, height);
      const pr = Phaser.Math.FloatBetween(1.2, 3);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.6);
      const star = this.add.circle(px, py, pr, 0x38bdf8, alpha);
      star.setDepth(2);

      this.stardustParticles.push({
        arc: star,
        speed: Phaser.Math.FloatBetween(10, 24)
      });
    }
  }

  private createBackgroundPortal(cx: number, cy: number) {
    this.menuPortalContainer = this.add.container(cx, cy).setDepth(3).setAlpha(0.35);

    const outerRing = this.add.graphics();
    outerRing.lineStyle(2, 0x38bdf8, 0.5);
    outerRing.strokeCircle(0, 0, 140);

    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      outerRing.lineBetween(
        Math.cos(a) * 132,
        Math.sin(a) * 132,
        Math.cos(a) * 148,
        Math.sin(a) * 148
      );
    }
    this.menuPortalContainer.add(outerRing);

    const innerRing = this.add.graphics();
    innerRing.lineStyle(1.5, 0x06b6d4, 0.4);
    innerRing.strokeCircle(0, 0, 95);
    this.menuPortalContainer.add(innerRing);

    // Slow atmospheric rotation
    this.tweens.add({
      targets: outerRing,
      angle: 360,
      duration: 35000,
      repeat: -1,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: innerRing,
      angle: -360,
      duration: 25000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  // --- 1. MAIN MENU VIEW ---
  private createMainMenuView(width: number, _height: number) {
    this.mainMenuView = this.add.container(0, 0).setDepth(10);

    // Title & Logo
    const title = this.add.text(width / 2, 175, 'COLOR FLICK', {
      fontSize: '52px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 230, 'نَـبَـرد رَنـگ‌هـا', {
      fontSize: '22px',
      color: '#f8fafc',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Button 1: Play / Start Game
    const playBtn = this.createMenuButton(
      width / 2,
      330,
      270,
      56,
      '🎮 شروع بازی',
      0x10b981,
      0x059669,
      () => {
        this.soundManager.playMatch(1);
        this.showView(this.stageSelectView);
      }
    );

    // Button 2: Settings
    const settingsBtn = this.createMenuButton(
      width / 2,
      405,
      270,
      50,
      '⚙️ تنظیمات',
      0x1e293b,
      0x334155,
      () => {
        this.soundManager.playGrab();
        this.showView(this.settingsView);
      }
    );

    // Button 3: About
    const aboutBtn = this.createMenuButton(
      width / 2,
      475,
      270,
      50,
      'ℹ️ درباره بازی',
      0x1e293b,
      0x334155,
      () => {
        this.soundManager.playGrab();
        this.showView(this.aboutView);
      }
    );

    // High Score Badge at bottom
    const highScoreBadge = this.add.container(width / 2, 570);
    const badgeBg = this.add.rectangle(0, 0, 320, 42, 0x0f172a, 0.85);
    badgeBg.setStrokeStyle(1.5, 0xf59e0b, 0.7);
    const badgeText = this.add.text(0, 0, `🏆 بالاترین رکورد: ${this.highScore} امتیاز`, {
      fontSize: '15px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    highScoreBadge.add([badgeBg, badgeText]);

    this.mainMenuView.add([title, subtitle, playBtn, settingsBtn, aboutBtn, highScoreBadge]);
  }

  // --- 2. STAGE SELECTION VIEW ---
  private createStageSelectView(width: number, _height: number) {
    this.stageSelectView = this.add.container(0, 0).setDepth(10).setVisible(false);

    // Header Title
    const title = this.add.text(width / 2, 75, '🗺️ انتخاب استیج (Select Stage)', {
      fontSize: '32px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 115, 'استیج مورد نظر خود را برای شروع انتخاب کنید:', {
      fontSize: '15px',
      color: '#94a3b8',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Grid of 4 Stage Cards
    // Card 1: Stage 1 (UNLOCKED)
    const stage1Card = this.createStageCard({
      x: width / 2 - 180,
      y: 240,
      title: 'استیج ۱: هسته نئونی',
      subtitle: 'Neon Core',
      desc: 'قوانین کلاسیک و چالش حرکت دروازه‌ها',
      color: 0x38bdf8,
      isUnlocked: true,
      actionText: 'شروع مرحله ➔',
      onSelect: () => {
        this.soundManager.playMatch(1);
        this.scene.start('GameScene', { stage: 1 });
      }
    });

    // Card 2: Stage 2 (LOCKED)
    const stage2Card = this.createStageCard({
      x: width / 2 + 180,
      y: 240,
      title: 'استیج ۲: اعماق اقیانوس',
      subtitle: 'Ocean Abyss',
      desc: 'گوی‌های تغییر رنگ و جریان‌های آبی\n(نیاز به ۱,۰۰۰ امتیاز در استیج ۱)',
      color: 0x06b6d4,
      isUnlocked: false,
      actionText: '🔒 قفل است'
    });

    // Card 3: Stage 3 (LOCKED)
    const stage3Card = this.createStageCard({
      x: width / 2 - 180,
      y: 430,
      title: 'استیج ۳: گرداب کیهانی',
      subtitle: 'Cosmic Singularity',
      desc: 'پورتال‌های گرانشی و گوی‌های ناپایدار\n(نیاز به ۲,۵۰۰ امتیاز در استیج ۲)',
      color: 0xa855f7,
      isUnlocked: false,
      actionText: '🔒 قفل است'
    });

    // Card 4: Coming Soon
    const comingSoonCard = this.createStageCard({
      x: width / 2 + 180,
      y: 430,
      title: 'استیج ۴: به‌زودی...',
      subtitle: 'Coming Soon',
      desc: 'مراحل جدید، حالت‌های تیمی و چالش‌های هفتگی در راهند!',
      color: 0xf59e0b,
      isUnlocked: false,
      isComingSoon: true,
      actionText: '⏳ به‌زودی'
    });

    // Back Button to Main Menu
    const backBtn = this.createMenuButton(
      width / 2,
      590,
      220,
      46,
      '⬅ بازگشت به منو',
      0x334155,
      0x475569,
      () => {
        this.soundManager.playGrab();
        this.showView(this.mainMenuView);
      }
    );

    this.stageSelectView.add([
      title,
      subtitle,
      stage1Card,
      stage2Card,
      stage3Card,
      comingSoonCard,
      backBtn
    ]);
  }

  private createStageCard(params: {
    x: number;
    y: number;
    title: string;
    subtitle: string;
    desc: string;
    color: number;
    isUnlocked: boolean;
    isComingSoon?: boolean;
    actionText: string;
    onSelect?: () => void;
  }): Phaser.GameObjects.Container {
    const card = this.add.container(params.x, params.y);
    const cardWidth = 320;
    const cardHeight = 165;

    // Card Background
    const bg = this.add.rectangle(
      0,
      0,
      cardWidth,
      cardHeight,
      params.isUnlocked ? 0x0f172a : 0x090d16,
      0.95
    );
    bg.setStrokeStyle(
      params.isUnlocked ? 2 : 1,
      params.isUnlocked ? params.color : 0x334155,
      params.isUnlocked ? 0.9 : 0.4
    );

    // Glowing badge/corner indicator
    const statusText = this.add.text(
      cardWidth / 2 - 16,
      -cardHeight / 2 + 14,
      params.isUnlocked ? '✅ فعال' : params.isComingSoon ? '⏳ بزودی' : '🔒 قفل',
      {
        fontSize: '12px',
        color: params.isUnlocked ? '#34d399' : params.isComingSoon ? '#fbbf24' : '#94a3b8',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 0);

    // Title
    const titleText = this.add.text(0, -45, params.title, {
      fontSize: '18px',
      color: params.isUnlocked ? '#f8fafc' : '#64748b',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Subtitle English
    const subText = this.add.text(0, -22, params.subtitle, {
      fontSize: '11px',
      color: params.isUnlocked ? '#38bdf8' : '#475569',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(0, 10, params.desc, {
      fontSize: '11px',
      color: params.isUnlocked ? '#cbd5e1' : '#64748b',
      align: 'center',
      lineSpacing: 3,
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Action Button / Badge
    const btnContainer = this.add.container(0, 52);
    const btnBg = this.add.rectangle(
      0,
      0,
      170,
      32,
      params.isUnlocked ? 0x0284c7 : 0x1e293b,
      params.isUnlocked ? 1 : 0.6
    );
    btnBg.setStrokeStyle(1, params.isUnlocked ? 0x38bdf8 : 0x475569, 0.7);

    const btnLabel = this.add.text(0, 0, params.actionText, {
      fontSize: '13px',
      color: params.isUnlocked ? '#ffffff' : '#94a3b8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnLabel]);

    if (params.isUnlocked && params.onSelect) {
      bg.setInteractive({ useHandCursor: true });
      btnBg.setInteractive({ useHandCursor: true });

      const onHover = () => {
        bg.setStrokeStyle(2.5, 0x38bdf8, 1);
        btnBg.setFillStyle(0x0369a1);
        card.setScale(1.03);
      };
      const onOut = () => {
        bg.setStrokeStyle(2, params.color, 0.9);
        btnBg.setFillStyle(0x0284c7);
        card.setScale(1.0);
      };

      bg.on('pointerover', onHover);
      bg.on('pointerout', onOut);
      bg.on('pointerdown', params.onSelect);

      btnBg.on('pointerover', onHover);
      btnBg.on('pointerout', onOut);
      btnBg.on('pointerdown', params.onSelect);
    }

    card.add([bg, statusText, titleText, subText, descText, btnContainer]);
    return card;
  }

  // --- 3. SETTINGS VIEW ---
  private createSettingsView(width: number, height: number) {
    this.settingsView = this.add.container(0, 0).setDepth(10).setVisible(false);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75);

    const card = this.add.rectangle(width / 2, height / 2, 480, 420, 0x0f172a, 0.98);
    card.setStrokeStyle(2, 0x38bdf8, 0.85);

    const title = this.add.text(width / 2, height / 2 - 160, '⚙️ تنظیمات بازی', {
      fontSize: '28px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Setting 1: Sound FX Toggle
    const soundRow = this.createSettingToggle(
      width / 2,
      height / 2 - 80,
      '🔊 افکت‌های صوتی:',
      !this.soundManager.isMuted,
      () => {
        this.soundManager.toggleMute();
      }
    );

    // Setting 2: Screen Shake Toggle
    const shakeRow = this.createSettingToggle(
      width / 2,
      height / 2 - 15,
      '📳 لرزش صفحه (Screen Shake):',
      this.screenShakeEnabled,
      newState => {
        this.screenShakeEnabled = newState;
        localStorage.setItem('color_flick_screenshake', newState ? 'true' : 'false');
      }
    );

    // Setting 3: Reset High Score Button
    const resetScoreBtn = this.createMenuButton(
      width / 2,
      height / 2 + 65,
      260,
      44,
      '🗑️ پاک کردن رکورد امتیاز',
      0x450a0a,
      0x7f1d1d,
      () => {
        localStorage.removeItem('color_flick_highscore');
        this.highScore = 0;
        this.soundManager.playHurt();
        alert('رکورد شما با موفقیت ریست شد.');
      }
    );

    // Back Button
    const backBtn = this.createMenuButton(
      width / 2,
      height / 2 + 145,
      200,
      44,
      '⬅ بازگشت',
      0x334155,
      0x475569,
      () => {
        this.soundManager.playGrab();
        this.showView(this.mainMenuView);
      }
    );

    this.settingsView.add([overlay, card, title, soundRow, shakeRow, resetScoreBtn, backBtn]);
  }

  private createSettingToggle(
    x: number,
    y: number,
    label: string,
    initialState: boolean,
    onToggle: (state: boolean) => void
  ): Phaser.GameObjects.Container {
    const row = this.add.container(x, y);

    const text = this.add.text(-60, 0, label, {
      fontSize: '15px',
      color: '#e2e8f0',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(1, 0.5);

    let state = initialState;
    const btnBg = this.add.rectangle(130, 0, 110, 36, state ? 0x10b981 : 0x475569, 1);
    btnBg.setStrokeStyle(1, 0xffffff, 0.5);
    btnBg.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(130, 0, state ? 'روشن ✅' : 'خاموش ❌', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      state = !state;
      btnBg.setFillStyle(state ? 0x10b981 : 0x475569);
      btnText.setText(state ? 'روشن ✅' : 'خاموش ❌');
      this.soundManager.playGrab();
      onToggle(state);
    });

    row.add([text, btnBg, btnText]);
    return row;
  }

  // --- 4. ABOUT VIEW ---
  private createAboutView(width: number, height: number) {
    this.aboutView = this.add.container(0, 0).setDepth(10).setVisible(false);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.75);

    const card = this.add.rectangle(width / 2, height / 2, 540, 460, 0x0f172a, 0.98);
    card.setStrokeStyle(2, 0x38bdf8, 0.85);

    const title = this.add.text(width / 2, height / 2 - 180, 'ℹ️ درباره بازی Color Flick', {
      fontSize: '28px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const infoLines = [
      '🎮 عنوان: نبرد رنگ‌ها (Color Flick)',
      '⚡ نسخه: 1.2.0',
      '🛠️ موتور بازی: Phaser 3 & TypeScript & Vite',
      '📱 پلتفرم: وب (HTML5) & اندروید (Capacitor)',
      '👤 توسعه‌دهنده: mohi11019',
      '',
      '🎯 ایده بازی:',
      'یک بازی مهارتی آرکید سریع و اعتیادآور.',
      'گوی‌های متولدشده در مرکز را با موس هدایت کنید:',
      '• همرنگ‌ها را به دروازه‌های ۴ طرف برسانید تا بزرگ‌تر شوند.',
      '• گوی‌های متفرقه را به دریچه‌های خروج اطراف هدایت کنید.'
    ];

    const infoText = this.add.text(width / 2, height / 2 - 30, infoLines.join('\n'), {
      fontSize: '14px',
      color: '#cbd5e1',
      align: 'right',
      lineSpacing: 7,
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Back Button
    const backBtn = this.createMenuButton(
      width / 2,
      height / 2 + 175,
      200,
      44,
      '⬅ بازگشت',
      0x334155,
      0x475569,
      () => {
        this.soundManager.playGrab();
        this.showView(this.mainMenuView);
      }
    );

    this.aboutView.add([overlay, card, title, infoText, backBtn]);
  }

  // Helper to switch view containers with a smooth fade in
  private showView(targetView: Phaser.GameObjects.Container) {
    [this.mainMenuView, this.stageSelectView, this.settingsView, this.aboutView].forEach(view => {
      view.setVisible(false);
      view.setAlpha(0);
    });

    targetView.setVisible(true);
    this.tweens.add({
      targets: targetView,
      alpha: 1,
      duration: 250,
      ease: 'Power1'
    });
  }

  // Helper for styled arcade buttons
  private createMenuButton(
    x: number,
    y: number,
    btnWidth: number,
    btnHeight: number,
    label: string,
    bgColor: number,
    hoverColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, btnWidth, btnHeight, bgColor, 1);
    bg.setStrokeStyle(1.5, 0x38bdf8, 0.65);
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(hoverColor);
      btn.setScale(1.04);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(bgColor);
      btn.setScale(1.0);
    });

    bg.on('pointerdown', onClick);

    btn.add([bg, text]);
    return btn;
  }

  update(_time: number, delta: number) {
    // Update drifting stardust particles
    const { width, height } = this.scale;
    this.stardustParticles.forEach(p => {
      p.arc.x += (p.speed * delta) / 1000;
      p.arc.y += (p.speed * 0.35 * delta) / 1000;
      if (p.arc.x > width + 10) p.arc.x = -10;
      if (p.arc.y > height + 10) p.arc.y = -10;
    });
  }
}
