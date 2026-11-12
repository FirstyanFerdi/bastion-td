'use strict';
/* Procedural Web Audio synthesizer (Sfx) */

/* ============================================================
   AUDIO, procedural Web Audio synth
   ============================================================ */
const Sfx = {
  ctx: null, master: null, noiseBuf: null, muted: SAVE.muted, last: {},
  GAP: { gatling: 55, hit: 45, kill: 40, plasma: 90, boom: 70, cryo: 120, tesla: 80, rail: 120, heal: 300, shield: 200, click: 20 },
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.4;
      const comp = this.ctx.createDynamicsCompressor();
      this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.4; SAVE.muted = m; Store.set('nb_muted', m); },
  tone(type, f0, f1, dur, vol, delay) {
    const c = this.ctx; if (!c || this.muted) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.01, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol, freq, q, ftype, delay) {
    const c = this.ctx; if (!c || this.muted || !this.noiseBuf) return;
    const t = c.currentTime + (delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    const now = performance.now(), gap = this.GAP[name] || 0;
    if (gap && now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    switch (name) {
      case 'gatling': this.tone('square', 980 + rand(-80, 80), 380, 0.06, 0.07); break;
      case 'plasma': this.noise(0.22, 0.35, 700, 1, 'lowpass'); this.tone('sine', 150, 55, 0.25, 0.35); break;
      case 'boom': this.noise(0.45, 0.5, 380, 1, 'lowpass'); this.tone('sine', 95, 30, 0.4, 0.45); break;
      case 'cryo': this.tone('sine', 1300, 320, 0.4, 0.13); this.tone('triangle', 1900, 900, 0.25, 0.06, 0.03); break;
      case 'tesla': this.tone('sawtooth', 200 + rand(0, 90), 90, 0.14, 0.12); this.noise(0.14, 0.18, 3200, 2, 'bandpass'); break;
      case 'rail': this.tone('sawtooth', 2600, 60, 0.4, 0.2); this.noise(0.3, 0.28, 2000, 1, 'highpass'); this.tone('sine', 70, 40, 0.35, 0.35); break;
      case 'hit': this.tone('square', 230, 120, 0.04, 0.04); break;
      case 'kill': this.tone('triangle', 520, 150, 0.12, 0.12); break;
      case 'leak': this.tone('sawtooth', 240, 100, 0.4, 0.3); this.tone('sawtooth', 200, 80, 0.4, 0.25, 0.12); break;
      case 'wave': this.tone('sawtooth', 130, 130, 0.55, 0.18); this.tone('sawtooth', 196, 196, 0.55, 0.14); this.tone('sawtooth', 164, 164, 0.7, 0.18, 0.4); this.tone('sawtooth', 247, 247, 0.7, 0.14, 0.4); break;
      case 'boss': this.tone('sawtooth', 62, 38, 1.3, 0.35); this.tone('square', 90, 45, 1.2, 0.15); this.noise(1.0, 0.3, 240, 1, 'lowpass'); break;
      case 'upgrade': [440, 554, 659, 880].forEach((f, i) => this.tone('triangle', f, f, 0.16, 0.16, i * 0.06)); break;
      case 'place': this.tone('square', 220, 90, 0.12, 0.16); this.noise(0.08, 0.2, 1200, 1, 'lowpass'); break;
      case 'sell': this.tone('sine', 880, 1320, 0.1, 0.18); this.tone('sine', 1320, 1760, 0.14, 0.14, 0.08); break;
      case 'click': this.tone('square', 760, 520, 0.035, 0.06); break;
      case 'error': this.tone('square', 170, 120, 0.16, 0.14); break;
      case 'heal': this.tone('sine', 620, 940, 0.16, 0.06); break;
      case 'shield': this.tone('sine', 380, 980, 0.3, 0.1); break;
      case 'coin': this.tone('sine', 1100, 1500, 0.09, 0.1); break;
      case 'gameover': [330, 262, 196, 130].forEach((f, i) => this.tone('sawtooth', f, f * 0.9, 0.4, 0.2, i * 0.28)); break;
      case 'victory': [392, 494, 587, 784, 988].forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.2, i * 0.12)); break;
    }
  }
};
