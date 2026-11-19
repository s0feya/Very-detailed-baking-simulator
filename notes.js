'use strict';
/* =========================================================
   Recipe steps as sticky notes in the top-left corner.
   Finished steps get crossed out; drag one to rip it off.
   ========================================================= */
const NOTES = { rid: null, ripped: new Set(), cross: {}, wig: {}, peel: null, fall: [], px: {}, flip: {}, flipT: {}, last: performance.now() };
const NW = 156, NH = 124;
function noteScale() { return clamp(uiW / 1250, 0.72, 1); }
function noteLayout() {
  if (!recipe || scorecard) return [];
  if (NOTES.rid !== recipe.id) { NOTES.rid = recipe.id; NOTES.ripped = new Set(); NOTES.cross = {}; NOTES.wig = {}; NOTES.fall = []; NOTES.peel = null; NOTES.px = {}; NOTES.flip = {}; NOTES.flipT = {}; }
  const s = noteScale(), list = [];
  recipe.steps.forEach((_, i) => { if (!NOTES.ripped.has(i)) list.push(i); });
  return list.slice(0, 4).map((i, k) => { const tx = 14 + k * NW * 0.9 * s; return { i, tx, x: NOTES.px[i] ?? tx, y: 12 + (i % 2) * 4, s, rot: (hash(i * 7 + 3) - 0.5) * 0.1 }; });
}
function noteLocal(n, x, y) {
  const cx = n.x + NW * n.s / 2, cy = n.y + NH * n.s / 2, dx = x - cx, dy = y - cy, c = Math.cos(-n.rot), sn = Math.sin(-n.rot);
  return { x: dx * c - dy * sn, y: dx * sn + dy * c };
}
function noteHit(x, y) {
  const L = noteLayout();
  for (let k = L.length - 1; k >= 0; k--) { const n = L[k], l = noteLocal(n, x, y); if (Math.abs(l.x) < NW * n.s / 2 && Math.abs(l.y) < NH * n.s / 2) return n; }
  return null;
}
const SND = {
  scribble() { for (let i = 0; i < 2; i++) sNoise(0.16, 3200 + i * 500, 2.5, 0.12, 'bandpass', i * 0.2); },
  rip() { for (let i = 0; i < 7; i++) sNoise(0.035, 1600 + i * 450, 1.4, 0.32, 'bandpass', i * 0.022); sNoise(0.2, 5000, 0.8, 0.08, 'highpass', 0.05); },
  tack() { sNoise(0.03, 2500, 3, 0.25); },
};

/* ---------- drawing ---------- */
function drawNote(n, i, done, cross, extra) {
  const s = n.s, w = NW, h = NH, R = recipe;
  ctx.save();
  ctx.translate(n.x + w * s / 2, n.y + h * s / 2); ctx.rotate(n.rot); ctx.scale(s, s);
  let lift = 0;
  if (extra) { ctx.translate(0, -h / 2); ctx.translate(extra.tx, extra.ty); ctx.rotate(extra.a); ctx.translate(0, h / 2); lift = extra.lift; }
  const wig = NOTES.wig[i] || 0; if (wig > 0) ctx.rotate(Math.sin(wig * 40) * 0.06 * wig);
  const ft = NOTES.flipT[i] || 0; if (ft > 0.001) { const sx = Math.cos(ft * Math.PI); ctx.scale(Math.max(0.02, Math.abs(sx)), 1); ctx.rotate(Math.sin(ft * Math.PI) * 0.04); if (ft > 0.5) { drawNoteBack(i, w, h); ctx.restore(); return; } }
  // shadow, bigger when lifted
  ctx.fillStyle = `rgba(40,30,10,${0.18 + lift * 0.12})`; ctx.beginPath(); ctx.moveTo(-w / 2 + 4, -h / 2 + 6); ctx.lineTo(w / 2 + 3 + lift * 6, -h / 2 + 6); ctx.lineTo(w / 2 + 2 + lift * 10, h / 2 + 4 + lift * 10); ctx.quadraticCurveTo(0, h / 2 + 9 + lift * 12, -w / 2 + 3, h / 2 + 4); ctx.closePath(); ctx.fill();
  // paper
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2 - 10 - lift * 8); ctx.quadraticCurveTo(w / 2 - 2, h / 2 - 1, w / 2 - 14 - lift * 10, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath();
  ctx.fillStyle = lg(0, -h / 2, 0, h / 2, done ? [[0, '#fff3b0'], [1, '#f3dc7e']] : [[0, '#fff7c2'], [1, '#fbe68e']]); ctx.fill();
  ctx.fillStyle = 'rgba(200,160,40,.16)'; ctx.fillRect(-w / 2, -h / 2, w, 16);
  // curled corner
  ctx.fillStyle = lg(w / 2 - 16, h / 2 - 16, w / 2, h / 2, [[0, 'rgba(255,250,215,1)'], [1, 'rgba(200,170,80,1)']]); ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - 10 - lift * 8); ctx.quadraticCurveTo(w / 2 - 8 - lift * 4, h / 2 - 8 - lift * 4, w / 2 - 14 - lift * 10, h / 2); ctx.quadraticCurveTo(w / 2 - 5, h / 2 - 4, w / 2, h / 2 - 10 - lift * 8); ctx.fill();
  // text
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(90,75,40,.65)'; ctx.font = '600 10px Inter, system-ui, sans-serif';
  ctx.fillText(`STEP ${i + 1} OF ${R.steps.length}`, -w / 2 + 10, -h / 2 + 12);
  ctx.fillStyle = done ? 'rgba(45,58,79,.55)' : '#2d3a4f'; ctx.font = '600 18px Caveat, "Bradley Hand", cursive';
  const lines = wrapText(R.steps[i].t, 0, 0, w - 20).slice(0, 5);
  lines.forEach((l, k) => ctx.fillText(l, -w / 2 + 10, -h / 2 + 34 + k * 18));
  // marker cross
  if (cross > 0) {
    ctx.strokeStyle = 'rgba(196,52,38,.88)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const a = clamp(cross * 2, 0, 1), b = clamp(cross * 2 - 1, 0, 1);
    const stroke = (x0, y0, x1, y1, t, seed) => { ctx.beginPath(); ctx.moveTo(x0, y0); const n = 10; for (let k = 1; k <= n * t; k++) { const f = k / n; ctx.lineTo(lerp(x0, x1, f) + Math.sin(f * 9 + seed) * 2, lerp(y0, y1, f) + Math.cos(f * 7 + seed) * 2); } ctx.stroke(); };
    stroke(-w / 2 + 14, -h / 2 + 22, w / 2 - 16, h / 2 - 14, a, i);
    if (b > 0) stroke(w / 2 - 16, -h / 2 + 22, -w / 2 + 14, h / 2 - 14, b, i + 3);
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}
function drawNotes() {
  const now = performance.now(), dt = Math.min(0.05, (now - NOTES.last) / 1000); NOTES.last = now;
  for (const n of noteLayout()) NOTES.px[n.i] = lerp(NOTES.px[n.i] ?? n.tx + 70, n.tx, 1 - Math.exp(-dt * 9));
  const L = noteLayout();
  if (recipe && !scorecard) recipe.steps.forEach((_, i) => { if (ticks[i]) { if (NOTES.cross[i] == null) { NOTES.cross[i] = 0; SND.scribble(); } NOTES.cross[i] = Math.min(1, NOTES.cross[i] + dt * 1.8); } });
  for (const k in NOTES.wig) NOTES.wig[k] = Math.max(0, NOTES.wig[k] - dt);
  if (recipe) recipe.steps.forEach((_, i) => { if (ticks[i]) NOTES.flip[i] = false; const tgt = NOTES.flip[i] ? 1 : 0, c = NOTES.flipT[i] || 0; NOTES.flipT[i] = c + clamp(tgt - c, -dt * 3.2, dt * 3.2); });
  // the note under the finger is drawn last so it sits on top
  const order = L.slice().sort((a, b) => (NOTES.peel && a.i === NOTES.peel.i ? 1 : 0) - (NOTES.peel && b.i === NOTES.peel.i ? 1 : 0));
  for (const n of order) {
    let extra = null;
    if (NOTES.peel && NOTES.peel.i === n.i) { const p = NOTES.peel, d = Math.hypot(p.dx, p.dy), t = clamp(d / 80, 0, 1); extra = { tx: p.dx * 0.35 * t, ty: p.dy * 0.35 * t, a: clamp(p.dx * 0.004, -0.5, 0.5) * t + t * 0.08 * Math.sign(p.dx || 1), lift: t }; }
    drawNote(n, n.i, !!ticks[n.i], NOTES.cross[n.i] || 0, extra);
  }
  // falling notes
  for (const f of NOTES.fall) {
    f.t += dt; f.vy += 1500 * dt; f.vy *= 0.985; f.vx += Math.sin(f.t * 7) * 260 * dt; f.vx *= 0.98; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt; f.vr *= 0.995;
    if (!recipe) continue;
    ctx.save(); ctx.globalAlpha = clamp(1.6 - f.t * 0.6, 0, 1);
    drawNote({ x: f.x, y: f.y, s: f.s, rot: f.rot }, f.i, true, 1, { tx: 0, ty: 0, a: 0, lift: 0.6 + Math.sin(f.t * 9) * 0.3 });
    ctx.restore();
  }
  NOTES.fall = NOTES.fall.filter(f => f.y < uiH + 260 && f.t < 4);
}

/* ---------- input ---------- */
const _onDownN = onDown3;
onDown3 = function () {
  const n = noteHit(PT.x, PT.y);
  if (n) {
    if (ticks[n.i] && (NOTES.cross[n.i] || 0) > 0.6) { NOTES.peel = { i: n.i, n, sx: PT.x, sy: PT.y, dx: 0, dy: 0 }; SND.tack(); }
    else { NOTES.flip[n.i] = !NOTES.flip[n.i]; SND.tack(); sNoise(0.12, 2600, 1, 0.15, 'bandpass', 0.03); }
    return;
  }
  _onDownN();
};
const _onMoveN = onMove3;
onMove3 = function () {
  if (NOTES.peel) {
    const p = NOTES.peel; p.dx = PT.x - p.sx; p.dy = PT.y - p.sy;
    if (Math.hypot(p.dx, p.dy) > 85) tearNote(true);
    return;
  }
  _onMoveN();
};
function tearNote(byDrag) {
  const p = NOTES.peel; if (!p) return; const n = p.n, t = 1;
  NOTES.fall.push({ i: p.i, x: n.x + p.dx * 0.35, y: n.y + p.dy * 0.35, s: n.s, rot: n.rot + clamp(p.dx * 0.004, -0.5, 0.5), vx: clamp(PT.vx * 0.45, -900, 900), vy: clamp(PT.vy * 0.45, -700, 600) - 120, vr: (p.dx >= 0 ? 1 : -1) * (2 + Math.random() * 2), t: 0 });
  NOTES.ripped.add(p.i); NOTES.peel = null; SND.rip();
}
const _onUpN = onUp3;
onUp3 = function () {
  if (NOTES.peel) { const p = NOTES.peel; if (Math.hypot(p.dx, p.dy) > 40) tearNote(false); else NOTES.peel = null; return; }
  _onUpN();
};
const _hoverN = hover3;
hover3 = function () {
  if (!held && !heldDough && !drag && PT.has && !NOTES.peel) { const n = noteHit(PT.x, PT.y); if (n) return ticks[n.i] ? 'Done! Drag it away to rip it off' : NOTES.flip[n.i] ? 'Click to flip back' : 'Stuck? Click for a hint'; }
  return _hoverN();
};
const _hintN = hint3;
hint3 = function () { const h = _hintN(); return h && h.startsWith('Next:') ? '' : h; };
const _drawUIN = drawUI3;
drawUI3 = function () {
  _drawUIN();
  ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0);
  drawNotes();
  if (MITT_WORN.v && PT.has) drawMitt(PT.x + 4, PT.y + 30, 0.7, -0.25);
  ctx = UI.getContext('2d');
};

/* ---------- hints on the back of each note ---------- */
const HINTS = [
  [/preheat/i, ['knob', 'oven', 'clock'], 'Turn the left dial on the oven to the temperature. The orange light goes out when it’s hot. Hold the clock to wait.'],
  [/whip.*cream|cream.*stiff|cream.*peaks/i, ['bowl', 'whisk', 'mixer'], 'Pour cream into the cream bowl and whisk it, or use the mixer whisk. Stop at stiff peaks before it turns grainy.'],
  [/whisk|until pale|pale and thick/i, ['mixer', 'whisk', 'lever'], 'Put eggs and sugar in the mixer bowl, fit the whisk and click the lever. Watch the bar until it’s pale and thick.'],
  [/beat|cream the butter/i, ['mixer', 'spatula', 'hand'], 'Butter and sugar in a bowl, then mix with the mixer, the spatula or by dragging inside the bowl with your hand.'],
  [/fold/i, ['spatula', 'hand', 'bowl'], 'Hold the spatula in the bowl and stir gently, or drag inside the bowl with your hand. The mixer would knock the air out.'],
  [/knead/i, ['hook', 'hand', 'flour'], 'Fit the dough hook and run the mixer, or pull the dough onto a floured counter and stretch it again and again.'],
  [/rise|doubled|proof/i, ['clock', 'bowl'], 'Leave the dough in a bowl and hold the clock to let time pass. The bar shows how far it has risen.'],
  [/chill/i, ['fridge', 'clock'], 'Put it in the fridge, close the door and hold the clock until the chilling bar fills.'],
  [/shape|loaf pan/i, ['hand', 'loaf'], 'Grab the dough with your hand and drop it into the loaf pan.'],
  [/scoop/i, ['tbsp', 'tray'], 'Dip the tablespoon into the dough, then hold it over the tray. Repeat for each cookie.'],
  [/pour|spread it into|spread the batter|spoon or pour/i, ['bowl', 'tin'], 'Pick up the bowl and hold it still over the pan. It tips by itself.'],
  [/mix|stir/i, ['spatula', 'hand', 'mixer'], 'Add everything to one bowl, then stir with the spatula, drag with your hand or use the mixer.'],
  [/bake/i, ['mitt', 'oven', 'clock'], 'Open the oven, put the pan on the rack, close the door and hold the clock. Wear the mitt to take it out.'],
  [/cool/i, ['mitt', 'rack', 'clock'], 'With the mitt on, set the pan on the wire rack and hold the clock until it’s cool. Then walk to the right.'],
  [/turn .*out|tip them/i, ['mitt', 'turntable', 'plate'], 'Hold the pan upside down over the turntable, a plate or the board until it drops out.'],
  [/saw|slice|layers/i, ['knife'], 'Take the bread knife from the rail and saw back and forth across the cake or loaf.'],
  [/fill and frost|frost|spread the cream|spread cream/i, ['offset', 'turntable'], 'Dip the offset spatula in whipped cream, then spread it on the cake. Spin the turntable as you go.'],
  [/roll/i, ['hand'], 'Grab one short end of the sponge and drag it across to roll it up.'],
  [/dust/i, ['icing'], 'Hold the icing sugar shaker over the cake to dust it.'],
  [/top|decorat/i, ['knife', 'strawberry', 'piping', 'sprinkles'], 'Slice fruit on the board and drop it on top, pipe cream rosettes, or sprinkle toppings.'],
  [/plate|bell|serve/i, ['plate', 'bell'], 'Take a plate from the shelf, lift the bake onto it and ring the bell.'],
];
function hintFor(i) { const t = recipe.steps[i].t; if (recipe.steps[i].h) return { tools: recipe.steps[i].tools || [], text: recipe.steps[i].h }; for (const [re, tools, text] of HINTS) if (re.test(t)) return { tools, text }; return { tools: [], text: 'Hover things to see what they are.' }; }
function drawNoteBack(i, w, h) {
  ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, '#f6e9a6'], [1, '#ecd681']]); ctx.fill();
  ctx.strokeStyle = 'rgba(140,110,40,.15)'; ctx.lineWidth = 1; for (let y = -h / 2 + 30; y < h / 2 - 4; y += 15) { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, y); ctx.lineTo(w / 2 - 6, y); ctx.stroke(); }
  const H = hintFor(i);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(90,75,40,.7)'; ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.fillText('HINT', -w / 2 + 10, -h / 2 + 12);
  // tool symbols
  H.tools.slice(0, 4).forEach((k, n) => { ctx.save(); ctx.translate(w / 2 - 14 - (Math.min(4, H.tools.length) - 1 - n) * 24, -h / 2 + 12); toolIcon(k); ctx.restore(); });
  ctx.fillStyle = '#3a3a5a'; ctx.font = '500 14.5px Caveat, "Bradley Hand", cursive';
  wrapText(H.text, 0, 0, w - 18).slice(0, 6).forEach((l, k) => ctx.fillText(l, -w / 2 + 9, -h / 2 + 40 + k * 15));
}
function toolIcon(k) {
  ctx.strokeStyle = '#3a3a5a'; ctx.fillStyle = '#3a3a5a'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const L = (pts) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); };
  switch (k) {
    case 'oven': ctx.strokeRect(-9, -8, 18, 16); ctx.strokeRect(-6, -3, 12, 8); L([[-6, -6], [6, -6]]); break;
    case 'knob': ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke(); L([[0, 0], [4, -5]]); break;
    case 'clock': ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke(); L([[0, -5], [0, 0], [4, 2]]); break;
    case 'whisk': L([[0, -9], [0, -3]]); ctx.beginPath(); ctx.ellipse(0, 3, 4, 6, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 3, 1.5, 6, 0, 0, TAU); ctx.stroke(); break;
    case 'mixer': L([[-8, 8], [8, 8], [6, 8], [6, -6], [-8, -6], [-8, -2], [6, -2]]); L([[-3, -2], [-3, 4]]); ctx.beginPath(); ctx.arc(-3, 5, 3, 0, Math.PI); ctx.stroke(); break;
    case 'lever': L([[-6, 6], [4, -6]]); ctx.beginPath(); ctx.arc(5, -7, 2.5, 0, TAU); ctx.fill(); break;
    case 'spatula': L([[0, -9], [0, 1]]); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-4, 1, 8, 8, 2) : ctx.rect(-4, 1, 8, 8); ctx.fill(); break;
    case 'hand': ctx.beginPath(); ctx.ellipse(0, 3, 6, 5, 0, 0, TAU); ctx.fill(); for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-5.5 + f * 3, -8, 2.4, 9, 1.2) : ctx.rect(-5.5 + f * 3, -8, 2.4, 9); ctx.fill(); } L([[-6, 2], [-9, -2]]); break;
    case 'bowl': ctx.beginPath(); ctx.moveTo(-9, -2); ctx.quadraticCurveTo(0, 14, 9, -2); ctx.closePath(); ctx.stroke(); break;
    case 'tin': ctx.strokeRect(-9, -3, 18, 8); ctx.beginPath(); ctx.ellipse(0, -3, 9, 2.5, 0, 0, TAU); ctx.stroke(); break;
    case 'loaf': L([[-9, -4], [-7, 6], [7, 6], [9, -4]]); break;
    case 'tray': L([[-10, 2], [10, 2]]); ctx.beginPath(); [-5, 0, 5].forEach(x => { ctx.moveTo(x + 2.5, 0); ctx.arc(x, 0, 2.5, 0, Math.PI, true); }); ctx.fill(); break;
    case 'tbsp': L([[3, -9], [0, 1]]); ctx.beginPath(); ctx.ellipse(-1, 4, 3.5, 4.5, 0.3, 0, TAU); ctx.stroke(); break;
    case 'mitt': ctx.beginPath(); ctx.moveTo(-4, 9); ctx.lineTo(-4, -2); ctx.lineTo(-8, -4); ctx.lineTo(-6, -7); ctx.lineTo(-3, -5); ctx.quadraticCurveTo(0, -11, 5, -6); ctx.lineTo(5, 9); ctx.closePath(); ctx.stroke(); break;
    case 'rack': ctx.strokeRect(-9, -4, 18, 6); [-4, 0, 4].forEach(x => L([[x, -4], [x, 2]])); L([[-8, 2], [-8, 7]]); L([[8, 2], [8, 7]]); break;
    case 'turntable': L([[-9, -4], [9, -4]]); L([[0, -4], [0, 5]]); L([[-5, 7], [5, 7]]); ctx.beginPath(); ctx.arc(0, -6, 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); break;
    case 'plate': ctx.beginPath(); ctx.ellipse(0, 2, 10, 4, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 2, 5, 2, 0, 0, TAU); ctx.stroke(); break;
    case 'bell': ctx.beginPath(); ctx.arc(0, 4, 7, Math.PI, 0); ctx.stroke(); L([[-9, 5], [9, 5]]); L([[0, -3], [0, -6]]); break;
    case 'knife': ctx.beginPath(); ctx.moveTo(-10, 1); ctx.lineTo(4, 1); ctx.lineTo(4, -4); ctx.quadraticCurveTo(-6, -3, -10, 1); ctx.stroke(); L([[4, -1], [10, -1]]); break;
    case 'offset': L([[-9, 4], [0, 4], [3, 0], [10, -6]]); break;
    case 'strawberry': ctx.beginPath(); ctx.moveTo(0, 9); ctx.quadraticCurveTo(-9, -2, 0, -4); ctx.quadraticCurveTo(9, -2, 0, 9); ctx.stroke(); L([[-4, -6], [0, -4], [4, -6]]); break;
    case 'piping': L([[-6, -8], [6, -8], [0, 8], [-6, -8]]); break;
    case 'sprinkles': ctx.strokeRect(-5, -6, 10, 13); [[-2, -1], [2, 2], [-1, 4], [2, -3]].forEach(([x, y]) => L([[x - 1, y], [x + 1, y + 1]])); break;
    case 'icing': ctx.strokeRect(-5, -4, 10, 12); [-3, 0, 3].forEach(x => { ctx.beginPath(); ctx.arc(x, -7, 0.8, 0, TAU); ctx.fill(); }); break;
    case 'fridge': ctx.strokeRect(-6, -9, 12, 18); L([[-6, -3], [6, -3]]); L([[3, -7], [3, -5]]); L([[3, 0], [3, 4]]); break;
    case 'hook': ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -2); ctx.bezierCurveTo(7, 0, 6, 9, -2, 7); ctx.stroke(); break;
    case 'flour': L([[-6, 8], [-6, -5], [-3, -8], [3, -8], [6, -5], [6, 8], [-6, 8]]); break;
  }
  ctx.lineCap = 'butt';
}
