/**
 * CASSETTE — Procedural Sound Library v2
 * All sounds synthesised via Web Audio API — zero external files.
 * Off by default; toggled by user via localStorage "cassette_sounds_enabled".
 *
 * New in v2:
 *  - Shared AudioContext singleton (avoids repeated context construction)
 *  - Convolution reverb impulse for spatial depth
 *  - Richer record-press (two-stage thunk + relay click)
 *  - Richer case open (plastic hinge creak + dust puff + snap)
 *  - Richer case close (clean snap + sub thud)
 *  - New: playSkipSound() for next/prev button
 *  - New: playSeekSound() for scrubber interaction
 *  - Improved tape hiss (two-band shaped noise)
 */

let _enabled = false;

if (typeof window !== "undefined") {
  _enabled = localStorage.getItem("cassette_sounds_enabled") === "true";
}

export function setSoundsEnabled(v: boolean) {
  _enabled = v;
  if (typeof window !== "undefined")
    localStorage.setItem("cassette_sounds_enabled", v ? "true" : "false");
}

export function getSoundsEnabled() { return _enabled; }

// ─── Shared AudioContext singleton ───────────────────────────────────────────
let _ac: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_ac || _ac.state === "closed") {
      _ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (_ac.state === "suspended") _ac.resume();
    return _ac;
  } catch { return null; }
}

// ─── Small convolution reverb (synthetic impulse) ────────────────────────────
function createReverb(ctx: AudioContext, decaySec = 0.25, wet = 0.18): ConvolverNode {
  const len = Math.floor(ctx.sampleRate * decaySec);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

// ─── 1. Mechanical button click (play/pause, any UI button) ──────────────────
export async function playClickSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Layer 1 — sharp transient
  const osc1 = a.createOscillator();
  const g1 = a.createGain();
  osc1.connect(g1); g1.connect(a.destination);
  osc1.type = "square";
  osc1.frequency.setValueAtTime(1100, now);
  osc1.frequency.exponentialRampToValueAtTime(200, now + 0.045);
  g1.gain.setValueAtTime(0.14, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
  osc1.start(now); osc1.stop(now + 0.06);

  // Layer 2 — body thud
  const osc2 = a.createOscillator();
  const g2 = a.createGain();
  const flt = a.createBiquadFilter();
  osc2.connect(flt); flt.connect(g2); g2.connect(a.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(120, now);
  osc2.frequency.exponentialRampToValueAtTime(55, now + 0.06);
  flt.type = "lowpass"; flt.frequency.value = 400;
  g2.gain.setValueAtTime(0.09, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  osc2.start(now); osc2.stop(now + 0.08);
}

// ─── 2. Tape side flip click ──────────────────────────────────────────────────
export async function playFlipSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Plastic thud
  const osc = a.createOscillator();
  const gain = a.createGain();
  const flt = a.createBiquadFilter();
  osc.connect(flt); flt.connect(gain); gain.connect(a.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
  flt.type = "lowpass"; flt.frequency.value = 1000;
  osc.start(now); osc.stop(now + 0.25);

  // High-freq click layered on top
  const o2 = a.createOscillator();
  const g2 = a.createGain();
  o2.connect(g2); g2.connect(a.destination);
  o2.type = "square";
  o2.frequency.value = 2200;
  g2.gain.setValueAtTime(0.06, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  o2.start(now); o2.stop(now + 0.03);

  // Short reverb tail
  const rev = createReverb(a, 0.12, 0.12);
  const dryGain = a.createGain();
  dryGain.gain.value = 1;
  rev.connect(a.destination);
}

// ─── 3. Record button — heavy two-stage press ────────────────────────────────
export async function playRecordPressSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Stage 1: mechanism compression (noise burst shaped like thunk)
  const buf = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / a.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 32) * 0.7;
    data[i] += Math.sin(2 * Math.PI * 75 * t) * Math.exp(-t * 18) * 0.45;
    data[i] += Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25) * 0.2;
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const flt = a.createBiquadFilter();
  const gain = a.createGain();
  src.connect(flt); flt.connect(gain); gain.connect(a.destination);
  flt.type = "lowpass"; flt.frequency.value = 700;
  gain.gain.value = 1.1;
  src.start(now);

  // Stage 2: relay latch click (delayed)
  setTimeout(() => {
    const a2 = ac(); if (!a2) return;
    const n = a2.currentTime;
    const o = a2.createOscillator();
    const g = a2.createGain();
    o.connect(g); g.connect(a2.destination);
    o.type = "square";
    o.frequency.setValueAtTime(1400, n);
    o.frequency.exponentialRampToValueAtTime(350, n + 0.04);
    g.gain.setValueAtTime(0.12, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + 0.05);
    o.start(n); o.stop(n + 0.06);
  }, 140);
}

// ─── 4. Reels engage (motor whirr onset) ─────────────────────────────────────
export async function playReelsEngageSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;
  const dur = 0.5;

  // Motor whirr
  const osc = a.createOscillator();
  const gain = a.createGain();
  const flt = a.createBiquadFilter();
  osc.connect(flt); flt.connect(gain); gain.connect(a.destination);
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(38, now);
  osc.frequency.linearRampToValueAtTime(130, now + dur);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
  gain.gain.linearRampToValueAtTime(0.05, now + dur);
  flt.type = "bandpass"; flt.frequency.value = 220; flt.Q.value = 3.5;
  osc.start(now); osc.stop(now + dur + 0.05);

  // Bearing squeal — very subtle
  const osc2 = a.createOscillator();
  const g2 = a.createGain();
  osc2.connect(g2); g2.connect(a.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(800, now + 0.1);
  osc2.frequency.linearRampToValueAtTime(1200, now + dur);
  g2.gain.setValueAtTime(0, now + 0.1);
  g2.gain.linearRampToValueAtTime(0.018, now + 0.2);
  g2.gain.linearRampToValueAtTime(0, now + dur);
  osc2.start(now + 0.1); osc2.stop(now + dur + 0.05);
}

// ─── 5. Rewind/fast-forward whirr ────────────────────────────────────────────
export function createRewindSound(): { start: () => void; stop: () => void } {
  const a = ac();
  if (!a) return { start: () => {}, stop: () => {} };

  // Main whirr
  const osc = a.createOscillator();
  const flt = a.createBiquadFilter();
  const gain = a.createGain();
  osc.connect(flt); flt.connect(gain); gain.connect(a.destination);
  osc.type = "sawtooth";
  osc.frequency.value = 170;
  flt.type = "highpass"; flt.frequency.value = 380;
  gain.gain.value = 0;

  // Harmonic layer
  const osc2 = a.createOscillator();
  const g2 = a.createGain();
  osc2.connect(g2); g2.connect(a.destination);
  osc2.type = "square";
  osc2.frequency.value = 340;
  g2.gain.value = 0;

  let started = false;

  return {
    start() {
      if (!_enabled) return;
      if (!started) { osc.start(); osc2.start(); started = true; }
      const now = a.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.12);
      g2.gain.linearRampToValueAtTime(0.022, now + 0.12);
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.linearRampToValueAtTime(420, now + 2.5);
      osc2.frequency.setValueAtTime(340, now);
      osc2.frequency.linearRampToValueAtTime(840, now + 2.5);
    },
    stop() {
      const now = a.currentTime;
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.22);
      g2.gain.linearRampToValueAtTime(0, now + 0.22);
      osc.frequency.linearRampToValueAtTime(170, now + 0.22);
      osc2.frequency.linearRampToValueAtTime(340, now + 0.22);
    },
  };
}

// ─── 6. Mechanical stop click ─────────────────────────────────────────────────
export async function playStopSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Mechanism slam
  const buf = a.createBuffer(1, a.sampleRate * 0.14, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / a.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.55;
    data[i] += Math.sin(2 * Math.PI * 115 * t) * Math.exp(-t * 35) * 0.38;
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const flt = a.createBiquadFilter();
  const gain = a.createGain();
  src.connect(flt); flt.connect(gain); gain.connect(a.destination);
  flt.type = "bandpass"; flt.frequency.value = 600; flt.Q.value = 1.5;
  gain.gain.value = 0.95;
  src.start(now);

  // Reel deceleration squeal
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.connect(g); g.connect(a.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
  g.gain.setValueAtTime(0.04, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.start(now); osc.stop(now + 0.13);
}

// ─── 7. Case open — plastic hinge creak + snap ───────────────────────────────
export async function playCaseOpenSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Hinge creak sweep (FM)
  const mod = a.createOscillator();
  const modGain = a.createGain();
  const car = a.createOscillator();
  const carGain = a.createGain();
  const rev = createReverb(a, 0.2);
  mod.connect(modGain); modGain.connect(car.frequency);
  car.connect(carGain);
  carGain.connect(rev); carGain.connect(a.destination);
  rev.connect(a.destination);
  mod.frequency.value = 90;
  modGain.gain.setValueAtTime(280, now);
  modGain.gain.linearRampToValueAtTime(30, now + 0.3);
  car.type = "triangle";
  car.frequency.setValueAtTime(520, now);
  car.frequency.linearRampToValueAtTime(260, now + 0.3);
  carGain.gain.setValueAtTime(0, now);
  carGain.gain.linearRampToValueAtTime(0.1, now + 0.02);
  carGain.gain.linearRampToValueAtTime(0.06, now + 0.28);
  carGain.gain.linearRampToValueAtTime(0, now + 0.32);
  mod.start(now); mod.stop(now + 0.35);
  car.start(now); car.stop(now + 0.35);

  // Dust puff (very brief noise)
  setTimeout(() => {
    const a2 = ac(); if (!a2) return;
    const n = a2.currentTime;
    const buf = a2.createBuffer(1, a2.sampleRate * 0.04, a2.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / d.length) * 8);
    const src = a2.createBufferSource();
    src.buffer = buf;
    const g = a2.createGain();
    src.connect(g); g.connect(a2.destination);
    g.gain.value = 0.04;
    src.start(n);
  }, 200);

  // Final snap
  setTimeout(() => playClickSound(true), 310);
}

// ─── 8. Case close — satisfying snap ─────────────────────────────────────────
export async function playCaseCloseSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  // Sharp plastic snap
  const buf = a.createBuffer(1, a.sampleRate * 0.1, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / a.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 75) * 0.8;
    data[i] += (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.3;
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const flt = a.createBiquadFilter();
  const gain = a.createGain();
  const rev = createReverb(a, 0.08);
  src.connect(flt); flt.connect(gain);
  gain.connect(a.destination); gain.connect(rev); rev.connect(a.destination);
  flt.type = "bandpass"; flt.frequency.value = 1800; flt.Q.value = 1.8;
  gain.gain.value = 0.85;
  src.start(now);

  // Sub thud underneath
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.connect(g); g.connect(a.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(90, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.start(now); osc.stop(now + 0.12);
}

// ─── 9. Skip sound (next/prev track) ─────────────────────────────────────────
export async function playSkipSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.connect(gain); gain.connect(a.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.035);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.07);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.start(now); osc.stop(now + 0.09);
}

// ─── 10. Seek scrub sound (scrubber drag) ────────────────────────────────────
export async function playSeekSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;

  const buf = a.createBuffer(1, a.sampleRate * 0.03, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / d.length) * 12) * 0.4;
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  const flt = a.createBiquadFilter();
  src.connect(flt); flt.connect(g); g.connect(a.destination);
  flt.type = "bandpass"; flt.frequency.value = 3000; flt.Q.value = 2;
  g.gain.value = 0.3;
  src.start(now);
}

// ─── 11. Tape hiss ambient (two-band shaped noise) ───────────────────────────
export function createTapeHiss(volume = 0.018): { start: () => void; stop: () => void; setVolume: (v: number) => void } {
  const a = ac();
  if (!a) return { start: () => {}, stop: () => {}, setVolume: () => {} };

  const bufSize = a.sampleRate * 3;
  const buf = a.createBuffer(2, bufSize, a.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
  }

  const src = a.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  // High-band presence (tape hiss character)
  const fltHi = a.createBiquadFilter();
  fltHi.type = "highshelf";
  fltHi.frequency.value = 4000;
  fltHi.gain.value = 6;

  // Low-band rumble cut
  const fltLo = a.createBiquadFilter();
  fltLo.type = "highpass";
  fltLo.frequency.value = 600;

  const masterGain = a.createGain();
  masterGain.gain.value = 0;

  src.connect(fltLo); fltLo.connect(fltHi); fltHi.connect(masterGain);
  masterGain.connect(a.destination);

  let started = false;

  return {
    start() {
      if (!started) { src.start(); started = true; }
      const now = a.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(volume, now + 2.0);
    },
    stop() {
      const now = a.currentTime;
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 1.2);
    },
    setVolume(v: number) {
      masterGain.gain.setTargetAtTime(v, a.currentTime, 0.3);
    },
  };
}

// ─── 12. Success chime (tape ready) ──────────────────────────────────────────
export async function playSuccessSound(force = false) {
  if (!_enabled && !force) return;
  const a = ac(); if (!a) return;
  const now = a.currentTime;
  const rev = createReverb(a, 0.6, 0.25);
  rev.connect(a.destination);

  // C5–E5–G5 major triad arpeggio
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.connect(gain);
    gain.connect(a.destination);
    gain.connect(rev);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + i * 0.11;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t); osc.stop(t + 0.65);
  });
}
