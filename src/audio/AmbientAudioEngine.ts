/**
 * Procedural Web Audio ambient night-valley soundscape.
 * Generates warm nocturnal chords, gentle night wind, and subtle harmonic chimes
 * routed through a low-pass filter that muffles smoothly during hover transitions.
 */
export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private windSource: AudioBufferSourceNode | null = null;
  private chimeTimer: number | null = null;
  private isInitialized = false;
  private isMuted = true;
  private isMuffled = false;

  public init(): void {
    if (this.isInitialized) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2600;
    lowpass.Q.value = 0.7;
    this.lowpass = lowpass;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    this.masterGain = masterGain;

    lowpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Warm D-minor-9 nocturnal pad chord (D2, A2, E3, F3, A3)
    const freqs = [73.42, 110.0, 164.81, 174.61, 220.0];
    const gains = [0.16, 0.12, 0.075, 0.06, 0.05];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = idx < 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (idx % 2 === 0 ? 1 : -1) * (3 + idx * 1.6);

      oscGain.gain.value = gains[idx];

      // Slow organic breathing LFO on amplitude
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + idx * 0.023;
      lfoGain.gain.value = gains[idx] * 0.35;

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(lowpass);

      osc.start();
      lfo.start();
      this.oscillators.push(osc, lfo);
    });

    // Soft filtered pink-ish night valley breeze
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.06;
    }

    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 340;
    windFilter.Q.value = 1.2;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.18;

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(lowpass);
    wind.start();
    this.windSource = wind;

    // Periodic pentatonic starlight notes
    const pentatonic = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const scheduleChime = () => {
      if (!this.ctx || !this.lowpass || this.isMuted) {
        this.chimeTimer = window.setTimeout(scheduleChime, 3400);
        return;
      }
      const now = this.ctx.currentTime;
      const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      this.triggerSoftTone(note, 0.045, 3.2, now);
      this.chimeTimer = window.setTimeout(scheduleChime, 2800 + Math.random() * 4200);
    };
    this.chimeTimer = window.setTimeout(scheduleChime, 2000);

    this.isInitialized = true;
  }

  private triggerSoftTone(freq: number, peakGain: number, duration: number, startTime: number): void {
    if (!this.ctx || !this.lowpass) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.lowpass);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  public toggleMute(): boolean {
    if (!this.isInitialized) {
      this.init();
    }
    if (!this.ctx || !this.masterGain) return true;

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), now);

    if (this.isMuted) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    } else {
      this.masterGain.gain.exponentialRampToValueAtTime(0.32, now + 0.9);
      this.applyMuffleFilter(this.isMuffled);
    }

    return this.isMuted;
  }

  public setMuffled(muffled: boolean): void {
    this.isMuffled = muffled;
    this.applyMuffleFilter(muffled);
  }

  private applyMuffleFilter(muffled: boolean): void {
    if (!this.ctx || !this.lowpass) return;
    const now = this.ctx.currentTime;
    const targetFreq = muffled ? 360 : 2600;
    this.lowpass.frequency.cancelScheduledValues(now);
    this.lowpass.frequency.setTargetAtTime(targetFreq, now, 0.28);
  }

  public playBloomChime(): void {
    if (!this.ctx || !this.lowpass || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.triggerSoftTone(587.33, 0.06, 2.0, now);
    this.triggerSoftTone(880.0, 0.04, 2.4, now + 0.12);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public dispose(): void {
    if (this.chimeTimer !== null) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.oscillators = [];
    if (this.windSource) {
      try {
        this.windSource.stop();
      } catch {
        // Ignore
      }
      this.windSource = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}
