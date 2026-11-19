// Modern Procedural Audio Synthesizer using Web Audio API
export class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Context initializes on first user touch / click
  }

  private initContext() {
    if (this.isMuted) return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    } else if (!this.isMuted && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.isMuted;
  }

  // Soft resonant bubble/pop when a circle spawns from portal
  playSpawn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.09);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Tactile glass/magnetic click when player grabs an orb
  playGrab() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Melodic, ascending chord chime when matching correct target, scaling with combo!
  playMatch(combo: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Pentatonic scale progressions that ascend with combo streak
    const scales: number[][] = [
      [523.25, 659.25, 783.99],          // Combo 1: C5, E5, G5
      [587.33, 739.99, 880.00, 1174.66], // Combo 2: D5, F#5, A5, D6
      [659.25, 830.61, 987.77, 1318.51], // Combo 3: E5, G#5, B5, E6
      [783.99, 987.77, 1174.66, 1567.98, 2093.00] // Combo 4+: G5, B5, D6, G6, C7
    ];

    const chordIndex = Math.min(combo - 1, scales.length - 1);
    const notes = scales[chordIndex];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + idx * 0.038;

      // Primary tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      // Sparkle overtone
      const overtone = this.ctx.createOscillator();
      const overtoneGain = this.ctx.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, t);

      const volume = Math.min(0.18, 0.12 + combo * 0.015);
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      overtoneGain.gain.setValueAtTime(volume * 0.25, t);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      overtone.connect(overtoneGain);
      overtoneGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.32);
      overtone.start(t);
      overtone.stop(t + 0.2);
    });
  }

  // Futuristic vortex suction chime when non-matching orb is cleanly discarded
  playDiscard() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Downward swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    // Confirmation high ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(880, now + 0.04);
    ping.frequency.exponentialRampToValueAtTime(1320, now + 0.14);

    pingGain.gain.setValueAtTime(0.06, now + 0.04);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    ping.connect(pingGain);
    pingGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
    ping.start(now + 0.04);
    ping.stop(now + 0.14);
  }

  // Punchy bass impact + electrical glitch when life is lost
  playHurt() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.22);

    subGain.gain.setValueAtTime(0.28, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.22);

    // Glitch buzz
    const buzz = this.ctx.createOscillator();
    const buzzGain = this.ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(110, now);
    buzz.frequency.setValueAtTime(80, now + 0.05);

    buzzGain.gain.setValueAtTime(0.18, now);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    buzz.connect(buzzGain);
    buzzGain.connect(this.ctx.destination);
    buzz.start(now);
    buzz.stop(now + 0.16);
  }

  // High-tech pulse alert for moving challenge
  playAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.14, 0.28].forEach(offset => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + offset;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, t); // E5
      osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.08); // B5

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    });
  }

  // Triumphant game over synth melody
  playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 392, 349.23, 293.66, 220, 164.81];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + idx * 0.11;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    });
  }
}
