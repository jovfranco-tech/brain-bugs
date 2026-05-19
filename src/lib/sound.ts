class SoundManager {
  private ctx: AudioContext | null = null;
  private isMusicPlaying = false;
  private musicEnabled = true;
  private sfxEnabled = true;
  private musicInterval: any = null;

  constructor() {
    // Lazy loaded context in browser
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  getMusicEnabled() {
    return this.musicEnabled;
  }

  getSfxEnabled() {
    return this.sfxEnabled;
  }

  playDrag() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (_) {}

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playSnap() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (_) {}

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playError() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (_) {}

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.22);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  playVictory() {
    if (!this.sfxEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (_) {}

    const now = this.ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      const timeOffset = idx * 0.08;
      const playTime = now + timeOffset;

      osc.frequency.setValueAtTime(freq, playTime);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.14, playTime);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.4);

      osc.start(playTime);
      osc.stop(playTime + 0.42);
    });
  }

  startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (_) {}

    this.isMusicPlaying = true;
    let step = 0;
    
    // Play a gentle arpeggio arround a major 7 chord
    const notes = [261.63, 329.63, 392.00, 493.88, 587.33, 493.88, 392.00, 329.63];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;
      
      try {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      } catch (_) {}

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      const freq = notes[step % notes.length];

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.65);

      step++;
    }, 750);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundManager();
