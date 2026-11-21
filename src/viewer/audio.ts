/** Procedural ambience: soft desert wind (filtered noise with slow gusts). No audio files needed. */
export class Ambience {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private on = false;

  start() {
    if (this.ctx) { this.setEnabled(true); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7;
    const gust = ctx.createOscillator();
    gust.frequency.value = 0.07;
    const gustGain = ctx.createGain();
    gustGain.gain.value = 260;
    gust.connect(gustGain).connect(lp.frequency);
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(); gust.start();
    this.ctx = ctx; this.gain = g;
    this.setEnabled(true);
  }

  setEnabled(v: boolean) {
    this.on = v;
    if (!this.ctx || !this.gain) return;
    if (v && this.ctx.state === 'suspended') void this.ctx.resume();
    this.gain.gain.setTargetAtTime(v ? 0.35 : 0, this.ctx.currentTime, 0.6);
  }

  get enabled() { return this.on; }

  dispose() { void this.ctx?.close(); this.ctx = null; }
}
