import { SwitchProfile } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentProfile: SwitchProfile = 'cherry-blue';
  private muted: boolean = false;
  private volume: number = 0.7;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private getDestination(): AudioNode | null {
    this.init();
    return this.masterGain || this.ctx?.destination || null;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setProfile(profile: SwitchProfile) {
    this.currentProfile = profile;
  }

  public getProfile(): SwitchProfile {
    return this.currentProfile;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playKey(isSpace: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;

    if (this.currentProfile === 'cherry-blue') {
      // Crisp clicky mechanical sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 1400 : 2800, t);
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 400 : 800, t + 0.025);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      // Noise burst for keycap bottom-out
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSpace ? 1600 : 3200, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);

      osc.connect(gain);
      gain.connect(dest);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);

      osc.start(t);
      noise.start(t);
      osc.stop(t + 0.03);
      noise.stop(t + 0.03);
    } else if (this.currentProfile === 'cherry-red') {
      // Smooth linear keycap bottom out
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 350 : 650, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.03);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.04);
    } else if (this.currentProfile === 'topre') {
      // Tactile 'thock' sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 280 : 420, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.045);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (this.currentProfile === 'holy-panda') {
      // Deep rounded tactile thock
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 320 : 540, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(isSpace ? 600 : 1100, t);
      osc2.frequency.exponentialRampToValueAtTime(200, t + 0.02);
      gain2.gain.setValueAtTime(0.12, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      osc.connect(gain);
      gain.connect(dest);
      osc2.connect(gain2);
      gain2.connect(dest);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.045);
      osc2.stop(t + 0.025);
    } else if (this.currentProfile === 'model-m') {
      // IBM Model M Buckling spring ping + sharp mechanical contact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isSpace ? 1800 : 3400, t);
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 450 : 900, t + 0.02);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

      const springOsc = this.ctx.createOscillator();
      const springGain = this.ctx.createGain();
      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(isSpace ? 1200 : 2100, t);
      springGain.gain.setValueAtTime(0.08, t);
      springGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(dest);
      springOsc.connect(springGain);
      springGain.connect(dest);

      osc.start(t);
      springOsc.start(t);
      osc.stop(t + 0.03);
      springOsc.stop(t + 0.09);
    } else {
      // Hall Effect futuristic smooth electronic pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 900 : 1600, t);
      osc.frequency.exponentialRampToValueAtTime(isSpace ? 300 : 600, t + 0.02);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.025);
    }
  }

  public previewSwitch(profile: SwitchProfile) {
    if (this.muted) return;
    const prev = this.currentProfile;
    this.currentProfile = profile;
    this.playKey(false);
    setTimeout(() => {
      this.playKey(true);
      this.currentProfile = prev;
    }, 110);
  }

  public playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    // Gentle, low-gain wooden tap (no harsh grating sawtooth buzzing)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playCombo() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99]; // C5, E5, G5
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);
      gain.gain.setValueAtTime(0.1, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25 + idx * 0.03);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.03);
      osc.stop(t + 0.3 + idx * 0.03);
    });
  }

  public playHyperdrive() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    // Ascending sci-fi power-up arpeggio
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.12, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3 + idx * 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.04);
      osc.stop(t + 0.35 + idx * 0.04);
    });
  }

  public playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major fan-fare
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.15, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + idx * 0.06);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.06);
      osc.stop(t + 0.5 + idx * 0.06);
    });
  }

  public playBossHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playGemPickup(isSpecial: boolean = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const freq = isSpecial ? 1318.51 : 987.77;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, t + 0.07);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playComboChime(tier: number = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    // Pentatonic scale chords for sweet, non-fatiguing feedback
    const notesByTier: Record<number, number[]> = {
      1: [523.25, 659.25], // C5, E5
      2: [523.25, 659.25, 783.99], // C5, E5, G5
      3: [523.25, 659.25, 783.99, 987.77], // C5, E5, G5, B5
      4: [523.25, 783.99, 1046.50, 1318.51], // C5, G5, C6, E6
    };
    const notes = notesByTier[tier] || notesByTier[1];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);
      gain.gain.setValueAtTime(0.08, t + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28 + idx * 0.045);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.045);
      osc.stop(t + 0.3 + idx * 0.045);
    });
  }

  public playChestOpen() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // G major celestial harp
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.12, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + idx * 0.05);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.05);
      osc.stop(t + 0.55 + idx * 0.05);
    });
  }

  public playDuelWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const notes = [349.23, 440.00, 523.25, 698.46]; // F major victory fanfare
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.15, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + idx * 0.08);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.08);
      osc.stop(t + 0.5 + idx * 0.08);
    });
  }

  public playDuelLoss() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 466.16, 392.00]; // D, Bb, G minor descent
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.1, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + idx * 0.12);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t + idx * 0.12);
      osc.stop(t + 0.4 + idx * 0.12);
    });
  }

  public playSuddenDeathFail() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getDestination();
    if (!dest) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.25);
  }
}

export const soundEngine = new SoundEngine();
