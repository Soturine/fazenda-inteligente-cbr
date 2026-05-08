export type GameSound =
  | "step"
  | "hoe"
  | "seed"
  | "water"
  | "fertilizer"
  | "pesticide"
  | "harvest"
  | "coin"
  | "error"
  | "nextDay"
  | "cbr";

type OscillatorKind = OscillatorType;

const mutedKey = "fazendinha-cbr-muted";

export class SoundSystem {
  private audioContext?: AudioContext;
  private muted = localStorage.getItem(mutedKey) === "true";

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    localStorage.setItem(mutedKey, String(this.muted));

    if (!this.muted) {
      void this.resume();
      this.play("cbr");
    }

    return this.muted;
  }

  play(sound: GameSound): void {
    if (this.muted) return;
    const context = this.getContext();
    if (!context) return;
    void this.resume();

    if (sound === "step") {
      this.noise(0.045, 0.035, 360);
      return;
    }

    if (sound === "hoe") {
      this.noise(0.08, 0.08, 240);
      this.tone(135, 0.055, "square", 0.035);
      return;
    }

    if (sound === "seed") {
      this.tone(620, 0.08, "triangle", 0.045);
      this.tone(820, 0.06, "triangle", 0.026, 0.055);
      return;
    }

    if (sound === "water") {
      this.noise(0.16, 0.045, 1350);
      this.tone(760, 0.05, "sine", 0.025);
      return;
    }

    if (sound === "fertilizer") {
      this.tone(420, 0.07, "triangle", 0.032);
      this.tone(690, 0.09, "triangle", 0.032, 0.055);
      return;
    }

    if (sound === "pesticide") {
      this.noise(0.18, 0.038, 720);
      return;
    }

    if (sound === "harvest") {
      this.tone(520, 0.08, "triangle", 0.045);
      this.tone(780, 0.1, "triangle", 0.04, 0.07);
      return;
    }

    if (sound === "coin") {
      this.tone(960, 0.06, "triangle", 0.04);
      this.tone(1280, 0.08, "triangle", 0.035, 0.055);
      return;
    }

    if (sound === "error") {
      this.tone(140, 0.12, "sawtooth", 0.04);
      return;
    }

    if (sound === "nextDay") {
      this.tone(330, 0.11, "sine", 0.038);
      this.tone(440, 0.12, "sine", 0.035, 0.1);
      this.tone(550, 0.16, "sine", 0.028, 0.22);
      return;
    }

    if (sound === "cbr") {
      this.tone(780, 0.08, "triangle", 0.035);
      this.tone(1050, 0.1, "triangle", 0.028, 0.07);
    }
  }

  private async resume(): Promise<void> {
    const context = this.getContext();
    if (context?.state === "suspended") {
      await context.resume();
    }
  }

  private getContext(): AudioContext | null {
    if (this.audioContext) return this.audioContext;

    try {
      this.audioContext = new AudioContext();
      return this.audioContext;
    } catch {
      return null;
    }
  }

  private tone(frequency: number, duration: number, type: OscillatorKind, volume: number, delay = 0): void {
    const context = this.getContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(duration: number, volume: number, frequency: number): void {
    const context = this.getContext();
    if (!context) return;

    const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = context.currentTime;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(start);
    source.stop(start + duration);
  }
}
