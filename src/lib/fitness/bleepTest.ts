// 20m, 8.5 km/h start, +0.5 km/h per level. Keep this version stable for weekly comparisons.
// Protocol table: https://www.thebeeptest.com/download
export const SHUTTLES = [7,8,8,9,9,10,10,11,11,11,12,12,13,13,13,14,14,15,15,16,16] as const;
export const COUNTDOWN = 5;
export const PROTOCOL = '20m-8.5-v1';
export const STEPS = SHUTTLES.flatMap((count, index) => Array.from({ length: count }, (_, shuttle) => ({
  level: index + 1, shuttle: shuttle + 1, seconds: 72 / (8.5 + index * 0.5), levelEnd: shuttle + 1 === count,
})));
let time = COUNTDOWN;
export const DEADLINES = STEPS.map(step => (time += step.seconds));
export function completedAt(elapsed: number) { return DEADLINES.filter(deadline => deadline <= elapsed + 0.001).length; }
export function score(completed: number) {
  const step = STEPS[Math.min(Math.max(0, completed), STEPS.length) - 1];
  return step ? `${step.level}.${step.shuttle}` : '0.0';
}
export function targetAt(elapsed: number) { return STEPS[completedAt(elapsed)] ?? STEPS[STEPS.length - 1]; }

export class BleepAudio {
  private context = new AudioContext();
  private origin = 0;
  private base = 0;
  private started = false;
  private tones: OscillatorNode[] = [];
  get elapsed() { return this.started ? this.base + this.context.currentTime - this.origin : this.base; }
  get running() { return this.context.state === 'running' && this.started; }
  private tone(at: number, frequency = 1000, duration = 0.16) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.5, at + 0.008);
    gain.gain.setValueAtTime(0.5, at + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, at + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    oscillator.start(at); oscillator.stop(at + duration);
    this.tones.push(oscillator);
  }
  async test() { await this.context.resume(); this.tone(this.context.currentTime + 0.1); }
  async start(elapsed = 0) {
    await this.context.resume();
    this.base = elapsed; this.origin = this.context.currentTime; this.started = true;
    for (let i = 0; i < COUNTDOWN; i++) if (i >= elapsed) this.tone(this.origin + i - elapsed + 0.02, 600, 0.1);
    if (elapsed <= COUNTDOWN) this.tone(this.origin + COUNTDOWN - elapsed, 1200, 0.45);
    DEADLINES.forEach((deadline, index) => {
      if (deadline <= elapsed) return;
      const at = this.origin + deadline - elapsed;
      this.tone(at);
      if (STEPS[index]?.levelEnd) { this.tone(at + 0.24, 1200); this.tone(at + 0.48, 1200); }
    });
  }
  async pause() { await this.context.suspend(); }
  async resume() { await this.context.resume(); }
  async close() { this.started = false; await this.context.close(); }
}
