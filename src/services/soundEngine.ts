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
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(85, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.09);
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
}

export const soundEngine = new SoundEngine();
