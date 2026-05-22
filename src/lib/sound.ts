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
    
    // Upbeat child-friendly major-pentatonic chiptune melody
    const melody = [
      329.63, 392.00, 440.00, 523.25, // E4, G4, A4, C5
      392.00, 523.25, 587.33, 659.25, // G4, C5, D5, E5
      523.25, 659.25, 783.99, 880.00, // C5, E5, G5, A5
      783.99, 659.25, 587.33, 523.25, // G5, E5, D5, C5
      440.00, 523.25, 392.00, 523.25, // A4, C5, G4, C5
      329.63, 392.00, 261.63, 329.63, // E4, G4, C4, E4
      392.00, 440.00, 523.25, 587.33, // G4, A4, C5, D5
      659.25, 783.99, 880.00, 1046.50 // E5, G5, A5, C6
    ];

    // Warm, bouncy bass accompaniment
    const bass = [130.81, 196.00, 164.81, 220.00]; // C3, G3, E3, A3

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;
      
      try {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      } catch (_) {}

      const now = this.ctx.currentTime;
      const freq = melody[step % melody.length];

      // 1. Play melody note (Triangle wave - soft and playful)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.3);

      // 2. Play bass note (Sine wave - warm and deep) every 4 steps (on the beat)
      if (step % 4 === 0) {
        const bassFreq = bass[Math.floor(step / 4) % bass.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.022, now);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);

        bassOsc.start(now);
        bassOsc.stop(now + 0.6);
      }

      step++;
    }, 260); // fast bouncy 260ms tempo
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  playClick() {
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
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}

export const sound = new SoundManager();
