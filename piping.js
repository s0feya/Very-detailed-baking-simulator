'use strict';
/* =========================================================
   Piped cream patterns. With the piping bag in hand:
   - click over a cake        -> one rosette (as before)
   - press and drag over it   -> squeeze a ridged line of cream
   Lines make borders, lattices, swirls or writing, and the
   cream-cake recipes check for them.
   ========================================================= */

const PIPE_STAR = (() => { const s = new THREE.Shape(), n = 8; for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU, r = i % 2 ? 0.0037 : 0.006, x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); } return s; })();

const PIPE_MAT = new THREE.MeshStandardMaterial({ color: 0xfff3e2, roughness: 0.5 });
function pipeRender(b) {
  if (!b.pipeG) { b.pipeG = new THREE.Group(); b.decoG.add(b.pipeG); }
  for (const s of b.piped || []) {
    if (!s.dirty || s.pts.length < 2) continue;
    if (s.mesh) { b.pipeG.remove(s.mesh); s.mesh.geometry.dispose(); }
    const curve = new THREE.CatmullRomCurve3(s.pts.map(p => V3(p.x, p.y, p.z)));
    const geo = new THREE.ExtrudeGeometry(PIPE_STAR, { steps: Math.max(4, s.pts.length * 2), bevelEnabled: false, extrudePath: curve });
    s.mesh = mesh(geo, PIPE_MAT, 0, 0, 0, false); s.mesh.userData.item = b; b.pipeG.add(s.mesh); s.dirty = false;
  }
  b.pipeDirty = false;
}
function pipeAt(b, wx, wz, stroke, exact) {
  b.piped = b.piped || [];
  const l = toLocal(b, wx, viewT < 0.5 && !exact ? b.p.z + (wz - b.p.z) * 0.3 : wz), d = b.dims;
  let x = l.x, z = l.z;
  if (b.shape === 'round') { const r = Math.hypot(x, z), lim = d.rx * 0.93; if (r > lim) { x *= lim / r; z *= lim / r; } }
  else { x = clamp(x, -d.rx * 0.92, d.rx * 0.92); z = clamp(z, -(d.rz || d.rx) * 0.88, (d.rz || d.rx) * 0.88); }
  const frost = b.shape === 'round' ? 0.003 * Math.min(1, b.covTop[cellOf(b, x, z)] || 0) + 0.002 : 0.001;
  const y = topAt(b, x) + frost + 0.0028;
  let s = stroke && stroke.s;
  if (!s) { s = { pts: [], dirty: true }; b.piped.push(s); if (stroke) stroke.s = s; }
  const last = s.pts[s.pts.length - 1];
  if (last && Math.hypot(last.x - x, last.z - z) < 0.004) return false;
  if (s.pts.length > 220) { if (stroke) stroke.s = null; return false; }
  s.pts.push({ x, y, z }); s.dirty = true; b.pipeDirty = true; return true;
}
const pipedStrokes = b => (b.piped || []).filter(s => s.pts.length >= 2);
const strokeLen = s => { let L = 0; for (let i = 1; i < s.pts.length; i++) L += Math.hypot(s.pts[i].x - s.pts[i - 1].x, s.pts[i].z - s.pts[i - 1].z); return L; };
function borderCover(b) {
  if (!b || b.shape !== 'round') return 0;
  const bins = new Array(24).fill(0), rx = b.dims.rx, mark = (x, z) => { if (Math.hypot(x, z) > rx * 0.68) bins[Math.floor(((Math.atan2(z, x) + Math.PI) / TAU) * 24) % 24] = 1; };
  for (const s of pipedStrokes(b)) s.pts.forEach(p => mark(p.x, p.z));
  for (const d of b.decos) if (d.type === 'rosette') mark(d.x, d.z);
  return bins.reduce((a, v) => a + v, 0) / 24;
}
function innerPiping(b) { let L = 0, n = 0; for (const s of pipedStrokes(b)) { const inner = s.pts.filter(p => Math.hypot(p.x, p.z) < b.dims.rx * 0.68).length / s.pts.length; if (inner > 0.5) { L += strokeLen(s); n++; } } return { L, n }; }
const borderOk = b => borderCover(b) >= 0.85;

/* ---------- the bag: press-and-drag squeezes a line ---------- */
function pipingHeld() { return held && held.sticky && DEF[held.it.kind] && DEF[held.it.kind].pipe ? held.it : null; }
const _onDownPipe = onDown3;
onDown3 = function () {
  const it = pipingHeld();
  if (it && !BOOK.open && !scorecard && !AUTO.busy && it.m && it.m.total() > 4) {
    const onBtn = BTN.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1);
    const b = !onBtn && bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0);
    if (b) { it.squeeze = { b, x0: PT.x, y0: PT.y, drawing: false, s: null }; return; }
  }
  _onDownPipe();
};
const _onUpPipe = onUp3;
onUp3 = function () {
  const it = pipingHeld();
  if (it && it.squeeze) {
    const sq = it.squeeze; it.squeeze = null;
    if (!sq.drawing) { it.useT = 0.35; it.pipeT = 0.33; } else { SFX.plop(); }
    held.fresh = false; return;
  }
  _onUpPipe();
};
const _tickPipe = tick3;
tick3 = function (dt) {
  _tickPipe(dt);
  const it = pipingHeld();
  if (it && it.squeeze) {
    const sq = it.squeeze;
    if (!sq.drawing && Math.hypot(PT.x - sq.x0, PT.y - sq.y0) > 8) { sq.drawing = true; hintOnce('pipeLine', 'Squeezing a line of cream. Drag around the edge for a border, or draw on top.'); }
    if (sq.drawing && it.m && it.m.total() > 0.5) {
      const b = bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0) || sq.b;
      if (b !== sq.b) { sq.b = b; sq.s = null; }
      if (pipeAt(b, it.p.x, it.p.z, sq)) { const g = 0.35; recordCream(b, it.m, g); it.m.take(Math.min(1, g / it.m.total())); if (Math.random() < 0.3) sNoise(0.06, 500, 1, 0.08, 'lowpass'); }
    } else if (sq.drawing && (!it.m || it.m.total() <= 0.5)) { say('The piping bag is empty. Dip it in the whipped cream.', 2); it.squeeze = null; }
  }
  for (const b of bakesOf()) if (b.pipeDirty) pipeRender(b);
};
const _rebuildBakePipe = rebuildBake;
rebuildBake = function (b) { _rebuildBakePipe(b); if (b.pipeG) b.decoG.add(b.pipeG); };
const _hintPipe = hint3;
hint3 = function () {
  const it = pipingHeld();
  if (it) { if (it.squeeze && it.squeeze.drawing) return 'Squeezing… let go to stop the line'; if (it.m && it.m.total() > 4) return 'Click on the cake for a rosette · press and drag to pipe a line · Esc to hang it up'; }
  return _hintPipe();
};

/* ---------- cookbook: a tab just for cream cakes ---------- */
RECIPES.filter(r => r.frosted).forEach(r => r.cream = true);
bookList = function () { return RECIPES.filter(r => (BOOK.country === 'All' || r.country === BOOK.country) && (BOOK.kind === 'All' || (BOOK.kind === 'cream' ? r.cream : r.kind === BOOK.kind))); };

/* ---------- recipes that need coating and piping ---------- */
const PIPE_CAKES = [
  { id: 'chantilly', name: 'Gâteau Chantilly', country: 'France', kind: 'hot', level: 2, product: 'cake', pan: 'tin', whip: true, frosted: true, cream: true, temp: 175, time: 28, ing: { egg: 200, sugar: 110, flour: 110, butter: 30 }, blurb: 'Genoise sponge filled with strawberries, coated in Chantilly cream with a piped shell border.',
    extra: ['300 g cream', 'strawberries'], steps: [
      { t: 'Preheat the oven to 175 °C.', c: () => near(OV.set, 175, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 70 && m.whip > 0.6) },
      { t: 'Gently fold in the flour and melted butter.', c: () => anyMix(m => (m.g.flour || 0) > 70 && (m.g.egg || 0) > 100 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 250) || roundB().length > 0 },
      { t: 'Bake for about 28 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable and slice it into 2 layers.', c: () => roundB().some(b => b.layers >= 2) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Fill the layer with cream and sliced strawberries.', c: () => roundB().some(b => fillsDone(b) && hasFillType(b, 'fruit')) },
      { t: 'Coat the whole cake in whipped cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Pipe a shell border all the way round the top edge.', c: () => roundB().some(borderOk) },
      { t: 'Arrange strawberries in the middle.', c: () => roundB().some(b => decoCount(b, 'strawberry') + decoCount(b, 'strawberryWhole') >= 3) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
  { id: 'lunchbox', name: 'Lunchbox Cake', country: 'South Korea', kind: 'hot', level: 1, product: 'cake', pan: 'tin', whip: false, frosted: true, cream: true, piped: true, temp: 170, time: 30, ing: { butter: 100, sugar: 100, egg: 100, flour: 120, milk: 60, bp: 5 }, blurb: 'A small vanilla cake, smooth cream coat, wavy piped border and a drawing or message on top.',
    extra: ['300 g cream'], steps: [
      { t: 'Preheat the oven to 170 °C.', c: () => near(OV.set, 170, 10) },
      { t: 'Beat the butter and sugar together.', c: () => anyMix(m => (m.g.butter || 0) > 70 && (m.g.sugar || 0) > 70 && m.mix > 0.7) },
      { t: 'Mix in the eggs, flour, milk and baking powder until smooth.', c: () => anyMix(m => (m.g.flour || 0) > 80 && (m.g.milk || 0) > 40 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 250) || roundB().length > 0 },
      { t: 'Bake for about 30 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable.', c: () => roundB().some(b => b.host && b.host.kind === 'turntable') || roundB().length > 0 && roundB().some(b => b.covTop.some(v => v > 0)) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Coat the whole cake in whipped cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Pipe a wavy border all the way round the top edge.', c: () => roundB().some(borderOk) },
      { t: 'Pipe a drawing or a message on top.', c: () => roundB().some(b => innerPiping(b).L > 0.14) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
  { id: 'celebration', name: 'Cream Celebration Cake', country: 'United Kingdom', kind: 'hot', level: 3, product: 'cake', pan: 'tin', whip: true, frosted: true, cream: true, piped: true, temp: 180, time: 25, ing: { egg: 200, sugar: 110, flour: 110, butter: 20, bp: 3 }, blurb: 'Three sponge layers with coulis and cream, coated all over, piped lattice and border.',
    extra: ['300 g cream', 'berry coulis', 'blueberries'], steps: [
      { t: 'Preheat the oven to 180 °C.', c: () => near(OV.set, 180, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 70 && m.whip > 0.6) },
      { t: 'Gently fold in the flour, butter and baking powder.', c: () => anyMix(m => (m.g.flour || 0) > 70 && (m.g.egg || 0) > 100 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 250) || roundB().length > 0 },
      { t: 'Bake for about 25 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable and slice it into 3 layers.', c: () => roundB().some(b => b.layers >= 3) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Fill one layer with berry coulis and the other with cream.', c: () => roundB().some(b => fillsDone(b) && hasFillType(b, 'coulis') && hasFillType(b, 'cream')) },
      { t: 'Coat the whole cake in whipped cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Pipe a lattice of crossing lines across the top.', c: () => roundB().some(b => innerPiping(b).n >= 4) },
      { t: 'Pipe a border round the top edge and add a few blueberries.', c: () => roundB().some(b => borderOk(b) && decoCount(b, 'blueberry') >= 4) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
];
PIPE_CAKES.forEach(R => { R.lines = [...Object.entries(R.ing).map(([k, v]) => k === 'egg' ? `${Math.round(v / 50)} eggs` : `${v} g ${ING[k].n}`), ...R.extra]; RECIPES.push(R); });
// the new countries need a ribbon in the cookbook
for (const R of PIPE_CAKES) if (!COUNTRIES.includes(R.country)) COUNTRIES.push(R.country);
HINTS.unshift(
  [/coat the whole cake/i, ['offset', 'turntable'], 'Load the offset spatula with whipped cream, hold it on the top, then the side, and spin the turntable.'],
  [/pipe .*border/i, ['piping'], 'Fill the piping bag with whipped cream. Press and drag slowly round the top edge.'],
  [/pipe a lattice/i, ['piping'], 'Press and drag straight lines across the top, then more lines crossing them.'],
  [/pipe a drawing|message/i, ['piping'], 'Press and drag on the middle of the cake to draw a heart, a smile or a word.']);

/* ---------- scoring ---------- */
const _decoEvalPipe = decoEval;
decoEval = function (b) {
  const r = _decoEvalPipe(b);
  if (b.shape === 'round') {
    const bc = borderCover(b), inner = innerPiping(b);
    if (bc >= 0.85 && pipedStrokes(b).length) { r.s += 0.06; r.good.unshift('A neat piped border all the way round.'); }
    else if (recipe && recipe.steps.some(s => /border/i.test(s.t)) && bc < 0.6) { r.s -= 0.06; r.notes.unshift('The piped border has gaps. Go all the way round the edge.'); }
    if (inner.n >= 4) { r.s += 0.05; r.good.unshift('Lovely piped lattice.'); } else if (inner.L > 0.14) { r.s += 0.04; r.good.unshift('Cute piped drawing on top.'); }
    r.s = clamp(r.s, 0, 1);
  }
  return r;
};

/* ---------- skip: perform the new steps with the real tools ---------- */
async function pipeStroke(b, pts, dur) {
  const bag = findK('piping'), cream = await ensureCream();
  if (bag && (!bag.m || bag.m.total() < 40)) { bag.m = bag.m || new Mix(); bag.m.merge(cream.m.take(Math.min(1, 80 / Math.max(1, cream.m.total())))); }
  const top = (b.topY || b.h), sq = { s: null };
  await toolOver('piping', b, dur, (tool, cc, raw) => { const k = Math.min(pts.length - 1, Math.floor(raw * pts.length)), p = pts[k], s = spinOf(b) + (b.yaw || 0), wx = b.p.x + p.x * Math.cos(-s) - p.z * Math.sin(-s), wz = b.p.z + p.x * Math.sin(-s) + p.z * Math.cos(-s); tool.p.set(wx, cc.y + top + 0.03, wz); pipeAt(b, wx, wz, sq, true); if (bag && bag.m && bag.m.total() > 1) bag.m.take(0.15 / bag.m.total()); });
  pipeRender(b);
}
const _performStepPipe = performStep;
performStep = async function (i) {
  const t = recipe.steps[i].t.toLowerCase(), b = bakeObj();
  if (/coat the whole cake/.test(t) && b) {
    const cream = await ensureCream(); look(b); const tt = b.host && b.host.kind === 'turntable' ? b.host : null;
    await toolOver('offset', b, 2.6, (tool, cc, raw) => { if (tt) tt.spinV = 7; tool.p.set(cc.x + b.dims.rx * (raw < 0.5 ? 0.4 : 1.05), cc.y + (raw < 0.5 ? (b.topY || b.h) + 0.004 : (b.topY || b.h) * 0.5), cc.z); });
    b.covTop.fill(1); b.covSide.fill(1); b.covDirty = true; b.creamG += 120; b.creamWhipSum += 120 * (cream.m.whip || 0.85); cream.m.take(Math.min(1, 120 / Math.max(1, cream.m.total()))); return;
  }
  if (/pipe .*border/.test(t) && b) {
    look(b); const rx = b.dims.rx, pts = [], wavy = /wavy/.test(t);
    for (let k = 0; k <= 96; k++) { const a = k / 96 * TAU, r = rx * (0.84 + (wavy ? 0.05 * Math.sin(k * 1.6) : 0.035 * Math.abs(Math.sin(k * 1.3)))); pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }); }
    await pipeStroke(b, pts, 3);
    if (/blueberr/.test(t)) for (let n = 0; n < 6; n++) { const a = n / 6 * TAU + 0.3; addDeco(b, 'blueberry', b.p.x + Math.cos(a) * rx * 0.35, b.p.z + Math.sin(a) * rx * 0.35); await waitS(0.08); }
    return;
  }
  if (/pipe a lattice/.test(t) && b) {
    look(b); const rx = b.dims.rx * 0.6;
    for (const dir of [1, -1]) for (const off of [-0.5, 0, 0.5]) { const pts = []; for (let k = 0; k <= 16; k++) { const u = (k / 16 * 2 - 1) * rx * Math.sqrt(1 - off * off), v = off * rx; pts.push(dir > 0 ? { x: u * 0.7071 - v * 0.7071, z: u * 0.7071 + v * 0.7071 } : { x: u * 0.7071 + v * 0.7071, z: -u * 0.7071 + v * 0.7071 }); } await pipeStroke(b, pts, 0.6); }
    return;
  }
  if (/pipe a drawing|message/.test(t) && b) {
    look(b); const s = b.dims.rx * 0.045, pts = [];
    for (let k = 0; k <= 60; k++) { const a = k / 60 * TAU, x = 16 * Math.pow(Math.sin(a), 3), z = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); pts.push({ x: x * s * 0.6, z: z * s * 0.6 }); }
    await pipeStroke(b, pts, 2.2); return;
  }
  if (/arrange strawberries in the middle/.test(t) && b) { look(b); for (let n = 0; n < 5; n++) { const a = n / 5 * TAU; addDeco(b, 'strawberry', b.p.x + Math.cos(a) * b.dims.rx * 0.3, b.p.z + Math.sin(a) * b.dims.rx * 0.3); SFX.plop(); await waitS(0.15); } return; }
  return _performStepPipe(i);
};
