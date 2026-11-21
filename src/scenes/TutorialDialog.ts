import Phaser from 'phaser';

export class TutorialDialog extends Phaser.GameObjects.Container {
  private currentPage: number = 0;
  private readonly totalPages: number = 4;

  private cardBg!: Phaser.GameObjects.Rectangle;
  private contentContainer!: Phaser.GameObjects.Container;
  private dotsContainer!: Phaser.GameObjects.Container;
  private prevBtn!: Phaser.GameObjects.Container;
  private nextBtn!: Phaser.GameObjects.Container;
  private nextBtnText!: Phaser.GameObjects.Text;
  private nextBtnBg!: Phaser.GameObjects.Rectangle;

  private onStartCallback: () => void;

  constructor(scene: Phaser.Scene, width: number, height: number, onStart: () => void) {
    super(scene, 0, 0);
    this.onStartCallback = onStart;
    this.setDepth(300);

    // Dark semi-transparent background overlay
    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x030712, 0.93);
    this.add(overlay);

    // Main Card Modal
    const cardWidth = 700;
    const cardHeight = 550;
    this.cardBg = scene.add.rectangle(width / 2, height / 2, cardWidth, cardHeight, 0x0f172a, 0.98);
    this.cardBg.setStrokeStyle(2, 0x38bdf8, 0.85);
    this.add(this.cardBg);

    // Header Title
    const headerTitle = scene.add.text(width / 2, height / 2 - 240, '📖 راهنمای تصویری بازی (How to Play)', {
      fontSize: '22px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    this.add(headerTitle);

    // Skip Button (top-left or top-right)
    const skipBtnBg = scene.add.rectangle(width / 2 + 270, height / 2 - 240, 100, 32, 0x334155, 0.9);
    skipBtnBg.setStrokeStyle(1, 0x64748b);
    skipBtnBg.setInteractive({ useHandCursor: true });
    const skipText = scene.add.text(width / 2 + 270, height / 2 - 240, 'رد کردن ⏩', {
      fontSize: '13px',
      color: '#cbd5e1',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    skipBtnBg.on('pointerover', () => skipBtnBg.setFillStyle(0x475569));
    skipBtnBg.on('pointerout', () => skipBtnBg.setFillStyle(0x334155));
    skipBtnBg.on('pointerdown', () => this.startGame());
    this.add([skipBtnBg, skipText]);

    // Dynamic Content Container
    this.contentContainer = scene.add.container(width / 2, height / 2);
    this.add(this.contentContainer);

    // Navigation Dots
    this.dotsContainer = scene.add.container(width / 2, height / 2 + 205);
    this.add(this.dotsContainer);

    // Previous Button
    this.prevBtn = scene.add.container(width / 2 - 230, height / 2 + 215);
    const prevBg = scene.add.rectangle(0, 0, 120, 42, 0x1e293b, 1);
    prevBg.setStrokeStyle(1, 0x475569);
    prevBg.setInteractive({ useHandCursor: true });
    const prevText = scene.add.text(0, 0, '⬅ قبلی', {
      fontSize: '16px',
      color: '#94a3b8',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    prevBg.on('pointerover', () => prevBg.setFillStyle(0x334155));
    prevBg.on('pointerout', () => prevBg.setFillStyle(0x1e293b));
    prevBg.on('pointerdown', () => this.changePage(-1));
    this.prevBtn.add([prevBg, prevText]);
    this.add(this.prevBtn);

    // Next / Start Button
    this.nextBtn = scene.add.container(width / 2 + 220, height / 2 + 215);
    this.nextBtnBg = scene.add.rectangle(0, 0, 150, 44, 0x0284c7, 1);
    this.nextBtnBg.setInteractive({ useHandCursor: true });
    this.nextBtnText = scene.add.text(0, 0, 'بعدی ➔', {
      fontSize: '17px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    this.nextBtnBg.on('pointerover', () => {
      this.nextBtnBg.setFillStyle(this.currentPage === this.totalPages - 1 ? 0x059669 : 0x0369a1);
    });
    this.nextBtnBg.on('pointerout', () => {
      this.nextBtnBg.setFillStyle(this.currentPage === this.totalPages - 1 ? 0x10b981 : 0x0284c7);
    });
    this.nextBtnBg.on('pointerdown', () => {
      if (this.currentPage === this.totalPages - 1) {
        this.startGame();
      } else {
        this.changePage(1);
      }
    });
    this.nextBtn.add([this.nextBtnBg, this.nextBtnText]);
    this.add(this.nextBtn);

    scene.add.existing(this);
    this.renderCurrentPage();
  }

  private changePage(delta: number) {
    const newPage = Phaser.Math.Clamp(this.currentPage + delta, 0, this.totalPages - 1);
    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.renderCurrentPage();
    }
  }

  private startGame() {
    this.setVisible(false);
    this.onStartCallback();
  }

  private renderCurrentPage() {
    this.contentContainer.removeAll(true);
    this.dotsContainer.removeAll(true);

    // Update Dots
    const dotSpacing = 22;
    const startX = -((this.totalPages - 1) * dotSpacing) / 2;
    for (let i = 0; i < this.totalPages; i++) {
      const isActive = i === this.currentPage;
      const dot = this.scene.add.circle(
        startX + i * dotSpacing,
        0,
        isActive ? 6 : 4,
        isActive ? 0x38bdf8 : 0x475569
      );
      this.dotsContainer.add(dot);
    }

    // Update Prev button visibility
    this.prevBtn.setVisible(this.currentPage > 0);

    // Update Next button label & color
    if (this.currentPage === this.totalPages - 1) {
      this.nextBtnText.setText('شروع بازی! 🚀');
      this.nextBtnBg.setFillStyle(0x10b981);
    } else {
      this.nextBtnText.setText('بعدی ➔');
      this.nextBtnBg.setFillStyle(0x0284c7);
    }

    // Render Page-specific visual illustration and text
    switch (this.currentPage) {
      case 0:
        this.renderSlide1();
        break;
      case 1:
        this.renderSlide2();
        break;
      case 2:
        this.renderSlide3();
        break;
      case 3:
        this.renderSlide4();
        break;
    }
  }

  // Slide 1: تولید و حرکت آهسته توپ‌ها و ۴ دروازه
  private renderSlide1() {
    const s = this.scene;
    const illustration = s.add.container(0, -60);

    // Illustration Backdrop
    const illBg = s.add.rectangle(0, 0, 620, 210, 0x090d16, 0.9);
    illBg.setStrokeStyle(1, 0x1e293b);
    illustration.add(illBg);

    // Center Spawner with rings
    const centerPortal = s.add.circle(0, 0, 24, 0x38bdf8, 0.2);
    centerPortal.setStrokeStyle(2, 0x38bdf8, 0.8);
    const centerCore = s.add.circle(0, 0, 10, 0x38bdf8, 0.9);
    const centerLabel = s.add.text(0, 38, 'مرکز تولید', {
      fontSize: '12px',
      color: '#38bdf8',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    illustration.add([centerPortal, centerCore, centerLabel]);

    // 4 Target Portals around
    const targets = [
      { x: 0, y: -75, color: 0x1e90ff, name: 'آبی (بالا)' },
      { x: 0, y: 75, color: 0xff4757, name: 'قرمز (پایین)' },
      { x: -220, y: 0, color: 0x2ed573, name: 'سبز (چپ)' },
      { x: 220, y: 0, color: 0xffa502, name: 'زرد (راست)' }
    ];

    targets.forEach(t => {
      const circle = s.add.circle(t.x, t.y, 22, t.color, 0.95);
      circle.setStrokeStyle(2, 0xffffff, 0.8);
      const glow = s.add.circle(t.x, t.y, 28, t.color, 0.25);
      const label = s.add.text(t.x, t.y + (t.y < 0 ? -32 : 30), t.name, {
        fontSize: '11px',
        color: '#e2e8f0',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }).setOrigin(0.5);
      illustration.add([glow, circle, label]);
    });

    // Drifting small balls with motion dashed arrows
    const drifting = [
      { x: -70, y: -40, color: 0x1e90ff, label: 'آبی 🔵' },
      { x: 80, y: -30, color: 0xff4757, label: 'قرمز 🔴' },
      { x: -80, y: 40, color: 0x2ed573, label: 'سبز 🟢' },
      { x: 90, y: 45, color: 0xffa502, label: 'زرد 🟡' }
    ];

    drifting.forEach(d => {
      const ball = s.add.circle(d.x, d.y, 11, d.color, 1);
      ball.setStrokeStyle(1.5, 0xffffff, 0.9);
      const tag = s.add.text(d.x, d.y - 18, d.label, {
        fontSize: '10px',
        color: '#94a3b8',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }).setOrigin(0.5);

      // Motion trail line
      const arrow = s.add.graphics();
      arrow.lineStyle(1.5, d.color, 0.6);
      arrow.lineBetween(d.x * 0.4, d.y * 0.4, d.x * 0.85, d.y * 0.85);
      illustration.add([arrow, ball, tag]);
    });

    this.contentContainer.add(illustration);

    // Text description below
    const titleText = s.add.text(0, 75, '۱. متولد شدن گوی‌ها در مرکز صفحه', {
      fontSize: '20px',
      color: '#f8fafc',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const descText = s.add.text(
      0,
      128,
      '• گوی‌ها از مرکز متولد شده و بلافاصله به آرامی در جهت‌های مختلف شروع به حرکت می‌کنند.\n• در چهار طرف صفحه، ۴ دروازه اصلی دارید: آبی (بالا)، قرمز (پایین)، سبز (چپ)، زرد (راست).\n• هر گوی متعلق به یکی از این ۴ دروازه نگهبان است.',
      {
        fontSize: '14px',
        color: '#cbd5e1',
        align: 'right',
        lineSpacing: 8,
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }
    ).setOrigin(0.5);

    this.contentContainer.add([titleText, descText]);
  }

  // Slide 2: هدایت توپ‌های همرنگ
  private renderSlide2() {
    const s = this.scene;
    const illustration = s.add.container(0, -60);

    const illBg = s.add.rectangle(0, 0, 620, 210, 0x090d16, 0.9);
    illBg.setStrokeStyle(1, 0x1e293b);
    illustration.add(illBg);

    // Target Portal at top
    const target = s.add.circle(0, -50, 32, 0x1e90ff, 0.95);
    target.setStrokeStyle(3, 0xffffff, 0.9);
    const targetGlow = s.add.circle(0, -50, 44, 0x1e90ff, 0.3);
    const plusScore = s.add.text(65, -50, '+100 ✨\n(جذب موفق!)', {
      fontSize: '13px',
      color: '#2ecc71',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0, 0.5);
    illustration.add([targetGlow, target, plusScore]);

    // Blue ball being dragged towards it
    const draggedBall = s.add.circle(0, 40, 16, 0x1e90ff, 1);
    draggedBall.setStrokeStyle(2, 0xffffff, 1);

    // Drag path line
    const path = s.add.graphics();
    path.lineStyle(2, 0x38bdf8, 0.8);
    path.lineBetween(0, 35, 0, -15);
    // Arrow head
    path.lineBetween(0, -15, -6, -5);
    path.lineBetween(0, -15, 6, -5);

    // Mouse pointer cursor icon
    const cursor = s.add.text(18, 48, '🖱️ با موس بکشید', {
      fontSize: '13px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0, 0.5);

    // Warning side box
    const warnBox = s.add.rectangle(-200, 0, 170, 95, 0x450a0a, 0.85);
    warnBox.setStrokeStyle(1, 0xef4444);
    const warnText = s.add.text(
      -200,
      0,
      '⚠️ اخطار:\nاگر گوی از صفحه\nخارج شود:\n-۱ جون کم می‌شود! 💔',
      {
        fontSize: '12px',
        color: '#fca5a5',
        align: 'center',
        lineSpacing: 4,
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }
    ).setOrigin(0.5);

    illustration.add([path, draggedBall, cursor, warnBox, warnText]);
    this.contentContainer.add(illustration);

    // Text description below
    const titleText = s.add.text(0, 75, '۲. هدایت گوی‌ها به دروازه هم‌رنگ', {
      fontSize: '20px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const descText = s.add.text(
      0,
      128,
      '• گوی را با موس یا لمس بگیرید و به سمت دروازه هم‌رنگش پرتاب کنید.\n• به محض برخورد، دروازه نگهبان با جرقه‌های ستاره‌ای جشن گرفته و ۱۰۰+ امتیاز می‌گیرید!\n• اگر گوی را در میانه مسیر رها کنید، همان‌جا می‌ماند (بدون شتاب ناخواسته).\n• حواستان باشد: نگذارید هیچ گویی فرار کند و از صفحه بیرون برود!',
      {
        fontSize: '14px',
        color: '#cbd5e1',
        align: 'right',
        lineSpacing: 8,
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }
    ).setOrigin(0.5);

    this.contentContainer.add([titleText, descText]);
  }

  // Slide 3: سیستم کومبو و پرهیز از خطا
  private renderSlide3() {
    const s = this.scene;
    const illustration = s.add.container(0, -60);

    const illBg = s.add.rectangle(0, 0, 620, 210, 0x090d16, 0.9);
    illBg.setStrokeStyle(1, 0x1e293b);
    illustration.add(illBg);

    // Combo Badges illustration
    const comboBadge1 = s.add.text(-170, -35, '⚡ کومبو ۲x!', {
      fontSize: '18px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const comboBadge2 = s.add.text(-170, 5, '🌟 سوپر کومبو ۳x!', {
      fontSize: '20px',
      color: '#eab308',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const comboBadge3 = s.add.text(-170, 45, '👑 الترا کومبو ۵x!', {
      fontSize: '22px',
      color: '#ec4899',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    illustration.add([comboBadge1, comboBadge2, comboBadge3]);

    // Danger / Mistake explanation box
    const mistakeBox = s.add.rectangle(130, 0, 260, 140, 0x450a0a, 0.85);
    mistakeBox.setStrokeStyle(1.5, 0xef4444);

    const mistakeTitle = s.add.text(130, -45, '❌ چه چیزهایی خطا محسوب می‌شوند؟', {
      fontSize: '13px',
      color: '#fca5a5',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const mistake1 = s.add.text(130, -12, '۱. برخورد به دروازه اشتباه (-۱ ❤️)', {
      fontSize: '12px',
      color: '#fecaca',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const mistake2 = s.add.text(130, 16, '۲. فرار کردن گوی از لبه‌های صفحه (-۱ ❤️)', {
      fontSize: '12px',
      color: '#fecaca',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const mistake3 = s.add.text(130, 44, '⚡ در هر خطا کومبو صفر می‌شود!', {
      fontSize: '11px',
      color: '#fbbf24',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    illustration.add([mistakeBox, mistakeTitle, mistake1, mistake2, mistake3]);
    this.contentContainer.add(illustration);

    // Text description below
    const titleText = s.add.text(0, 75, '۳. ساخت زنجیره کومبو و مراقبت از جان‌ها', {
      fontSize: '20px',
      color: '#f59e0b',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const descText = s.add.text(
      0,
      128,
      '• با پرتاب‌های پیاپی و سریع به دروازه‌های درست، ضریب کومبو فعال می‌شود (+۲۰۰، +۳۰۰، +۵۰۰ امتیاز!).\n• شما ۵ جان (❤️) دارید؛ اگر گویی از صفحه بیرون بیفتد یا به دروازه اشتباه برخورد کند ۱ جان کم می‌شود.\n• فقط کافی است روی هدایت سریع ۴ رنگ اصلی تمرکز کنید و نگذارید گویی فرار کند!',
      {
        fontSize: '14px',
        color: '#cbd5e1',
        align: 'right',
        lineSpacing: 8,
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }
    ).setOrigin(0.5);

    this.contentContainer.add([titleText, descText]);
  }

  // Slide 4: چالش‌ها، جون‌ها و ثبت رکورد
  private renderSlide4() {
    const s = this.scene;
    const illustration = s.add.container(0, -60);

    const illBg = s.add.rectangle(0, 0, 620, 210, 0x090d16, 0.9);
    illBg.setStrokeStyle(1, 0x1e293b);
    illustration.add(illBg);

    // Hearts representation
    const heartsText = s.add.text(-170, -45, '❤️ ❤️ ❤️ ❤️ ❤️', {
      fontSize: '24px'
    }).setOrigin(0.5);
    const heartsLabel = s.add.text(-170, -10, '۵ جون در شروع بازی', {
      fontSize: '13px',
      color: '#f87171',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    // Moving Portal Challenge illustration
    const moveBox = s.add.rectangle(140, 0, 260, 140, 0x1e1b4b, 0.9);
    moveBox.setStrokeStyle(1, 0x818cf8);

    const moveBanner = s.add.text(140, -45, '⚠️ چالش حرکت دروازه‌ها! ⚠️', {
      fontSize: '13px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const movingCircle = s.add.circle(140, 5, 20, 0x1e90ff, 0.95);
    movingCircle.setStrokeStyle(2, 0xffffff, 0.9);
    const arrows = s.add.text(140, 36, '⬌ حرکت نوسانی روی لبه‌ها ⬌', {
      fontSize: '11px',
      color: '#cbd5e1',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    illustration.add([heartsText, heartsLabel, moveBox, moveBanner, movingCircle, arrows]);

    // Score illustration
    const scoreLabel = s.add.text(-170, 45, '🏆 امتیاز ثانیه‌ای پیوسته\nبا ماندن در بازی رکورد بزنید!', {
      fontSize: '13px',
      color: '#fbbf24',
      align: 'center',
      lineSpacing: 4,
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);
    illustration.add(scoreLabel);

    this.contentContainer.add(illustration);

    // Text description below
    const titleText = s.add.text(0, 75, '۴. چالش لغزش دروازه‌ها و زنده ماندن', {
      fontSize: '20px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }).setOrigin(0.5);

    const descText = s.add.text(
      0,
      128,
      '• بازی به صورت رکوردی است: با هر ثانیه زنده ماندن امتیازتان افزایش می‌یابد.\n• هر ۲۰ ثانیه، دروازه‌های اطراف روی لبه‌ها به حرکت درمی‌آیند تا دقت شما را محک بزنند!\n• آیا می‌توانید رکورد جدیدی ثبت کنید؟ دکمه زیر را بزنید تا بازی آغاز شود!',
      {
        fontSize: '14px',
        color: '#cbd5e1',
        align: 'right',
        lineSpacing: 8,
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }
    ).setOrigin(0.5);

    this.contentContainer.add([titleText, descText]);
  }
}
