// Web Audio API Retro Arcade Synthesizer
class SoundEffectsManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context may be restricted by browser policy before first interaction
    }
  }

  playHit() {
    this.playTone(180, 'sawtooth', 0.12, 0.25);
  }

  playSuperEffective() {
    this.playTone(440, 'triangle', 0.08, 0.3);
    setTimeout(() => this.playTone(660, 'triangle', 0.12, 0.35), 80);
    setTimeout(() => this.playTone(880, 'triangle', 0.16, 0.4), 160);
  }

  playCrit() {
    this.playTone(800, 'square', 0.06, 0.2);
    setTimeout(() => this.playTone(1200, 'square', 0.15, 0.3), 60);
  }

  playFaint() {
    this.playTone(300, 'sawtooth', 0.15, 0.25);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.2, 0.25), 120);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.3), 260);
  }

  playSwitch() {
    this.playTone(350, 'sine', 0.08, 0.2);
    setTimeout(() => this.playTone(550, 'sine', 0.12, 0.2), 80);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, idx) => {
      setTimeout(() => this.playTone(note, 'triangle', 0.25, 0.3), idx * 120);
    });
  }

  playClick() {
    this.playTone(600, 'sine', 0.04, 0.1);
  }
}

export const soundFx = new SoundEffectsManager();
