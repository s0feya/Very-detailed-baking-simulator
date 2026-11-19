'use strict';
/* =========================================================
   Small Batch Kitchen — a hands-on baking simulator
   ========================================================= */
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
const W = 1600, H = 900, TAU = Math.PI * 2;
let S = 1, OX = 0, OY = 0, DPR = 1;

/* ---------- math helpers ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const shade = (c, f) => f > 0 ? mixc(c, [255, 255, 255], f) : mixc(c, [0, 0, 0], -f);
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const fmtG = g => g >= 1000 ? (g / 1000).toFixed(2).replace(/0$/, '') + ' kg' : Math.round(g) + ' g';
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function lg(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
function radg(x, y, r0, r1, stops, x1, y1) { const g = ctx.createRadialGradient(x, y, r0, x1 ?? x, y1 ?? y, r1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
function shadow(x, y, w, a = 0.26) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.15);
  ctx.fillStyle = radg(0, 0, 0, w * 0.62, [[0, `rgba(50,38,28,${a})`], [0.6, `rgba(50,38,28,${a * 0.45})`], [1, 'rgba(50,38,28,0)']]);
  ctx.beginPath(); ctx.arc(0, 0, w * 0.62, 0, TAU); ctx.fill(); ctx.restore();
}

/* ---------- scene layout ---------- */
const REST = 628, CT_BACK = 596, CT_FRONT = 656, CX0 = 262, CX1 = 1290;
const SH1 = 250, SH2 = 410, SHX0 = 292, SHX1 = 800;
const RAIL_Y = 368, RAIL_X0 = 862, RAIL_X1 = 1090, RAIL_SLOTS = [884, 930, 976, 1022, 1068];
const FR = { x0: 18, x1: 262, y0: 64, y1: 884, open: 0, tgt: 0, ix0: 36, ix1: 246, shelves: [300, 470, 640] };
const OV = { x0: 1322, x1: 1568, py0: 160, py1: 226, dy0: 228, dy1: 548, cav: { x0: 1342, x1: 1548, y0: 246, y1: 530 }, rackY: 476, open: 0, tgt: 0, set: 0, temp: 22, timer: 0, heating: false, light: 0 };
const KN = { temp: { x: 1392, y: 193, r: 19 }, timer: { x: 1500, y: 193, r: 19 } };
const SCALE = { x: 655, w: 172, h: 28, tare: 0, disp: 0 };
const SCALE_TOP = REST - SCALE.h;
const RACK = { x: 960, w: 156, h: 16 };
const RACK_TOP = REST - RACK.h;
const MX = { x0: 1094, x1: 1290, seatX: 1170, seatY: REST - 14, speed: 0, attach: 'whisk', spin: 0 };
const CLOCK = { x: 945, y: 104, r: 56, hold: false, mult: 1 };
const MITT = { x: 1252, y: 156, worn: false };
let gameT = 8.5 * 3600;

/* ---------- ingredients ---------- */
const ING = {
  flour: { n: 'flour', d: .53, c: [244, 239, 229], type: 'powder' },
  sugar: { n: 'sugar', d: .85, c: [250, 249, 245], type: 'grain' },
  salt: { n: 'salt', d: 1.2, c: [252, 252, 252], type: 'grain' },
  bp: { n: 'baking powder', d: .9, c: [246, 246, 241], type: 'powder' },
  yeast: { n: 'yeast', d: .6, c: [196, 160, 104], type: 'grain' },
  chips: { n: 'chocolate chips', d: .65, c: [62, 36, 22], type: 'chunk' },
  egg: { n: 'egg', d: 1.03, c: [240, 200, 96], type: 'liquid' },
  butter: { n: 'butter', d: .91, c: [247, 228, 163], type: 'solid' },
  milk: { n: 'milk', d: 1.03, c: [250, 250, 246], type: 'liquid' },
  water: { n: 'water', d: 1, c: [214, 230, 238], type: 'liquid' },
};

class Mix {
  constructor() { this.g = {}; this.order = []; this.mix = 1; this.whip = 0; this.knead = 0; this.proof = 0; this.shell = 0; this.yolk = 1; this.swirl = Math.random() * 6; }
  total() { let s = 0; for (const k in this.g) s += this.g[k]; return s; }
  vol() { let v = 0; for (const k in this.g) v += this.g[k] / ING[k].d; return v; }
  kinds() { return Object.keys(this.g).filter(k => this.g[k] > 0.4); }
  add(k, g) {
    if (g <= 0) return;
    const t = this.total(), eggs = this.g.egg || 0;
    this.g[k] = (this.g[k] || 0) + g;
    if (!this.order.includes(k)) this.order.push(k);
    const nt = t + g;
    if (this.kinds().length <= 1) this.mix = 1; else if (t > 0) this.mix *= Math.pow(t / nt, 2); else this.mix = 0;
    if (k === 'egg') this.yolk = (this.yolk * eggs + g) / (eggs + g);
    if (k === 'flour' && this.whip > 0) this.whip *= 0.97;
  }
  copyProps(o) { this.mix = o.mix; this.whip = o.whip; this.knead = o.knead; this.proof = o.proof; this.yolk = o.yolk; this.shell = o.shell; }
  merge(o) {
    const t1 = this.total(), t2 = o.total(); if (t2 <= 0) return;
    if (t1 < 0.5) { for (const k of o.order) if (o.g[k]) { this.g[k] = (this.g[k] || 0) + o.g[k]; if (!this.order.includes(k)) this.order.push(k); } this.copyProps(o); return; }
    let diff = 0; const keys = new Set([...Object.keys(this.g), ...Object.keys(o.g)]);
    keys.forEach(k => diff += Math.abs((this.g[k] || 0) / t1 - (o.g[k] || 0) / t2));
    const t = t1 + t2, big = Math.max(t1, t2) / t;
    const wMix = (this.mix * t1 + o.mix * t2) / t;
    const eggs1 = this.g.egg || 0, eggs2 = o.g.egg || 0;
    this.whip = (this.whip * t1 + o.whip * t2) / t;
    this.knead = (this.knead * t1 + o.knead * t2) / t;
    this.proof = (this.proof * t1 + o.proof * t2) / t;
    if (eggs1 + eggs2 > 0) this.yolk = (this.yolk * eggs1 + o.yolk * eggs2) / (eggs1 + eggs2);
    this.shell += o.shell;
    for (const k of o.order) if (o.g[k]) { this.g[k] = (this.g[k] || 0) + o.g[k]; if (!this.order.includes(k)) this.order.push(k); }
    this.mix = this.kinds().length <= 1 ? 1 : wMix * (1 - (1 - big * big) * clamp(diff * 1.6, 0, 1));
  }
  take(frac) {
    frac = clamp(frac, 0, 1); const p = new Mix(); p.copyProps(this); p.shell = 0; p.order = this.order.slice();
    for (const k in this.g) { const a = this.g[k] * frac; p.g[k] = a; this.g[k] -= a; }
    if (this.total() < 0.3) this.clear();
    return p;
  }
  clear() { this.g = {}; this.order = []; this.mix = 1; this.whip = 0; this.knead = 0; this.proof = 0; this.shell = 0; this.yolk = 1; }
  color() {
    let r = 0, g = 0, b = 0, w = 0;
    for (const k in this.g) {
      if (k === 'chips') continue;
      const m = this.g[k], c = ING[k].c, wt = m * (k === 'water' ? 0.2 : 1) * (k === 'egg' ? 1.5 : 1);
      r += c[0] * wt; g += c[1] * wt; b += c[2] * wt; w += wt;
    }
    if (!w) return [70, 42, 26];
    let c = [r / w, g / w, b / w];
    if (this.g.water && this.g.flour) c = shade(c, -0.07);
    return mixc(c, [252, 244, 222], this.whip * 0.55);
  }
  form() {
    const g = this.g, t = this.total(); if (t < 0.5) return 'empty';
    const fl = g.flour || 0, liq = (g.milk || 0) + (g.water || 0) + (g.egg || 0) * 0.75, fat = g.butter || 0;
    if (fl < t * 0.15) return liq > t * 0.45 ? 'liquid' : 'loose';
    const hyd = (liq + fat * 0.8) / fl;
    if (hyd > 1.15) return this.mix < 0.35 ? 'lumpy' : 'batter';
    if (hyd < 0.32 || this.mix < 0.25) return 'loose';
    if (this.mix < 0.6) return 'shaggy';
    return (fat / fl > 0.3 || (g.chips || 0) > 0) ? 'cookie' : 'dough';
  }
  describe() {
    const f = this.form(), t = this.total(); if (t < 0.5) return 'empty';
    const names = { liquid: this.kinds().length > 1 ? 'liquid mix' : ING[this.kinds()[0]]?.n || 'liquid', loose: this.kinds().length > 1 ? 'dry mix' : ING[this.kinds()[0]]?.n || 'mix', lumpy: 'lumpy mix', batter: 'batter', shaggy: 'shaggy dough', cookie: 'cookie dough', dough: 'dough' };
    let s = names[f];
    if (this.kinds().length > 1 && f !== 'shaggy') s += this.mix > 0.9 ? ', smooth' : this.mix > 0.55 ? ', partly mixed' : ', unmixed';
    if (this.whip > 0.6) s += ', pale & airy';
    if (f === 'dough') { if (this.knead > 0.75) s += ', elastic'; else if (this.knead > 0.3) s += ', kneading…'; if (this.proof > 0.15) s += this.proof > 1.6 ? ', over-risen' : this.proof > 0.8 ? ', doubled' : ', rising'; }
    return s;
  }
}

/* ---------- item definitions ---------- */
const DEF = {
  flour: { w: 80, h: 122, name: 'Plain flour', src: 'flour', stock: 2000, pour: { max: 55, tilt: 1.95 }, tare: 30, spoonable: 1 },
  sugar: { w: 70, h: 100, name: 'Caster sugar', src: 'sugar', stock: 1000, pour: { max: 45, tilt: 1.9 }, tare: 420, spoonable: 1 },
  salt: { w: 50, h: 70, name: 'Fine salt', src: 'salt', stock: 400, pour: { max: 12, tilt: 1.9 }, tare: 210, spoonable: 1 },
  bp: { w: 50, h: 72, name: 'Baking powder', src: 'bp', stock: 150, pour: { max: 9, tilt: 1.9 }, tare: 60, spoonable: 1 },
  yeast: { w: 48, h: 62, name: 'Dry yeast', src: 'yeast', stock: 100, pour: { max: 9, tilt: 1.9 }, tare: 160, spoonable: 1 },
  chips: { w: 72, h: 104, name: 'Chocolate chips', src: 'chips', stock: 300, pour: { max: 40, tilt: 1.9 }, tare: 15 },
  milk: { w: 62, h: 142, name: 'Milk', src: 'milk', stock: 1000, pour: { max: 55, tilt: 1.7 }, tare: 30, spoonable: 1 },
  water: { w: 84, h: 124, name: 'Water pitcher', src: 'water', stock: 1500, pour: { max: 65, tilt: 1.5 }, tare: 520, spoonable: 1 },
  eggs: { w: 132, h: 40, name: 'Eggs', tare: 40 },
  egg: { w: 30, h: 38, name: 'Egg', tare: 58 },
  butter: { w: 116, h: 32, name: 'Butter', tare: 220 },
  butterPiece: { w: 30, h: 20, name: 'Butter', tare: 0 },
  bowlL: { w: 200, h: 96, name: 'Large glass bowl', cont: 1, cap: 3000, recv: 1, pour: { max: 80, tilt: 1.55 }, tare: 640, mat: 'glass' },
  bowlM: { w: 134, h: 100, name: 'Mixer bowl', cont: 1, cap: 2600, recv: 1, pour: { max: 80, tilt: 1.55 }, tare: 420, mat: 'steel' },
  bowlS: { w: 106, h: 52, name: 'Small bowl', cont: 1, cap: 520, recv: 1, pour: { max: 60, tilt: 1.6 }, tare: 180, mat: 'ceramic' },
  jug: { w: 86, h: 114, name: 'Measuring jug', cont: 1, cap: 520, recv: 1, pour: { max: 60, tilt: 1.45 }, tare: 310 },
  tin: { w: 136, h: 44, name: 'Round cake tin', cont: 1, cap: 1900, recv: 1, pour: { max: 60, tilt: 1.5 }, tare: 280, pan: 1 },
  loaf: { w: 146, h: 56, name: 'Loaf pan', cont: 1, cap: 1900, recv: 1, tare: 350, pan: 1 },
  tray: { w: 196, h: 12, name: 'Baking tray', cont: 1, tare: 400, pan: 1 },
  tbsp: { L: 118, name: 'Tablespoon · 15 ml', tool: 1, spoon: 15, cont: 1, tare: 25 },
  tsp: { L: 98, name: 'Teaspoon · 5 ml', tool: 1, spoon: 5, cont: 1, tare: 12 },
  whisk: { L: 150, name: 'Balloon whisk', tool: 1, mixer: 'whisk', tare: 90 },
  spatula: { L: 150, name: 'Silicone spatula', tool: 1, mixer: 'spatula', tare: 60 },
  attWhisk: { L: 124, name: 'Mixer whisk attachment', tool: 1, att: 'whisk', tare: 120 },
  attHook: { L: 124, name: 'Dough hook', tool: 1, att: 'hook', tare: 160 },
};

/* ---------- textures ---------- */
function noiseCanvas(w, h, n, col, aMax, sz = 1.4) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${col},${Math.random() * aMax})`; const s = 0.6 + Math.random() * sz; g.fillRect(Math.random() * w, Math.random() * h, s, s); }
  return c;
}
const TEX = {};
function makeTextures() {
  TEX.speck = ctx.createPattern(noiseCanvas(96, 96, 260, '120,90,50', 0.5), 'repeat');
  TEX.flour = ctx.createPattern(noiseCanvas(96, 96, 500, '255,255,255', 0.9, 2), 'repeat');
  TEX.grain = ctx.createPattern(noiseCanvas(64, 64, 400, '150,140,130', 0.35, 1.2), 'repeat');
  TEX.wall = ctx.createPattern(noiseCanvas(160, 160, 2400, '120,110,95', 0.05, 1.5), 'repeat');
  TEX.brush = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 8; const g = c.getContext('2d'); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; g.fillRect(Math.random() * 256, 0, 0.8, 8); g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(Math.random() * 256, 0, 0.8, 8); } return ctx.createPattern(c, 'repeat'); })();
  TEX.brushV = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d'); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.14})`; g.fillRect(0, Math.random() * 256, 8, 0.8); g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(0, Math.random() * 256, 8, 0.8); } return ctx.createPattern(c, 'repeat'); })();
}

/* ---------- sound (synthesised) ---------- */
let AC = null, master = null, noiseBuf = null, pourNode = null, humNode = null;
function audio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.55; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // continuous pour noise
    const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.8;
    const gn = AC.createGain(); gn.gain.value = 0;
    src.connect(f); f.connect(gn); gn.connect(master); src.start();
    pourNode = { f, gn };
    // mixer hum
    const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 90;
    const o2 = AC.createOscillator(); o2.type = 'square'; o2.frequency.value = 45;
    const lf = AC.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = 500;
    const hg = AC.createGain(); hg.gain.value = 0;
    o.connect(lf); o2.connect(lf); lf.connect(hg); hg.connect(master); o.start(); o2.start();
    humNode = { o, o2, hg, lf };
  } catch (e) { AC = null; }
}
function sNoise(dur, freq, q, gain, type = 'bandpass', delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function sTone(freq, dur, type = 'sine', gain = 0.2, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(); o.type = type; o.frequency.value = freq; const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  crack() { sNoise(0.04, 3200, 1.5, 0.9); sNoise(0.06, 1700, 2, 0.5, 'bandpass', 0.03); },
  splat() { sNoise(0.3, 600, 0.7, 0.9, 'lowpass'); sNoise(0.12, 2500, 1, 0.3); },
  plop() { sTone(180, 0.12, 'sine', 0.25); sNoise(0.12, 400, 1, 0.35, 'lowpass'); },
  thunk(v = 1) { sNoise(0.09, 260, 1.2, 0.5 * v, 'lowpass'); sTone(140, 0.08, 'sine', 0.12 * v); },
  clink() { sTone(2400, 0.25, 'sine', 0.06); sTone(3700, 0.2, 'sine', 0.03); },
  beep() { sTone(2300, 0.09, 'square', 0.05); },
  click() { sNoise(0.03, 3000, 3, 0.4); },
  ding() { [0, 0.5, 1].forEach(d => { sTone(1568, 1.4, 'sine', 0.22, d); sTone(3136, 0.8, 'sine', 0.05, d); }); },
  door() { sNoise(0.18, 180, 1, 0.6, 'lowpass'); },
  fridge() { sNoise(0.25, 300, 0.8, 0.5, 'lowpass'); sNoise(0.08, 1500, 1, 0.12, 'bandpass', 0.05); },
  ouch() { sTone(330, 0.15, 'triangle', 0.15); sTone(260, 0.2, 'triangle', 0.12, 0.1); },
  scrape() { sNoise(0.12, 2600, 2, 0.2); },
};
function setPour(type, rate) {
  if (!pourNode) return;
  const tgt = rate > 0 ? clamp(rate / 60, 0.05, 0.6) * (type === 'liquid' ? 0.8 : type === 'chunk' ? 0.5 : 0.45) : 0;
  pourNode.gn.gain.setTargetAtTime(tgt, AC.currentTime, 0.05);
  pourNode.f.frequency.setTargetAtTime(type === 'liquid' ? 700 + Math.random() * 300 : type === 'chunk' ? 2500 : type === 'thick' ? 300 : 4200, AC.currentTime, 0.05);
}
function setHum(speed) {
  if (!humNode) return;
  humNode.hg.gain.setTargetAtTime(speed ? 0.05 + speed * 0.02 : 0, AC.currentTime, 0.15);
  humNode.o.frequency.setTargetAtTime(70 + speed * 35, AC.currentTime, 0.3);
  humNode.o2.frequency.setTargetAtTime(35 + speed * 17, AC.currentTime, 0.3);
}
