import type { AppSettings } from "@/types";

type Sound = "generate" | "copy" | "lock" | "save" | "delete" | "switch";
class StudioAudio {
  private context: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private voices: OscillatorNode[] = [];
  private getContext() {
    if (typeof window === "undefined" || !window.AudioContext) return null;
    this.context ??= new AudioContext();
    if (this.context.state === "suspended") void this.context.resume().catch(() => {});
    return this.context;
  }
  play(sound: Sound, settings: AppSettings) {
    if (!settings.sfx || settings.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes: Record<Sound, number[]> = { generate: [440, 554.37, 659.25], copy: [880, 1174.66], lock: [330], save: [523.25, 659.25, 783.99], delete: [330, 261.63], switch: [660] };
      notes[sound].forEach((frequency, i) => {
        const oscillator = ctx.createOscillator();
        const envelope = ctx.createGain();
        const start = ctx.currentTime + i * 0.045;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(settings.sfxVolume * 0.065, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.17);
        oscillator.connect(envelope).connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      });
    } catch { /* Audio is an optional enhancement. */ }
  }
  setAmbient(enabled: boolean, volume: number, muted: boolean): boolean {
    try {
      if (!enabled) { this.stopAmbient(); return true; }
      const ctx = this.getContext();
      if (!ctx) return false;
      if (!this.ambientGain) {
        this.ambientGain = ctx.createGain();
        this.ambientGain.gain.value = 0;
        this.ambientGain.connect(ctx.destination);
        [130.81, 196, 261.63, 329.63].forEach((frequency, i) => {
          const oscillator = ctx.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          oscillator.detune.value = [-3, 2, -1, 3][i];
          oscillator.connect(this.ambientGain!);
          oscillator.start();
          this.voices.push(oscillator);
        });
      }
      this.ambientGain.gain.setTargetAtTime(muted ? 0 : volume * 0.018, ctx.currentTime, 0.35);
      return true;
    } catch { return false; }
  }
  stopAmbient() {
    this.voices.forEach(voice => { try { voice.stop(); voice.disconnect(); } catch {} });
    this.voices = [];
    this.ambientGain?.disconnect();
    this.ambientGain = null;
  }
}
export const studioAudio = new StudioAudio();
