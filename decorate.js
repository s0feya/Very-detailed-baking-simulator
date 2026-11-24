'use strict';
/* =========================================================
   Pretty auto-decorating for the Skip button: rings, rows and
   even spirals instead of random scatter. Positions are given
   in the cake's own coordinates, so the camera angle and the
   spinning turntable can't squash or smear the pattern.
   ========================================================= */

function decoAt(b, type, lx, lz) {
  const s = spinOf(b) + (b.yaw || 0), wx = b.p.x + lx * Math.cos(s) + lz * Math.sin(s), wz = b.p.z - lx * Math.sin(s) + lz * Math.cos(s);
  const v = viewT; viewT = 1; try { addDeco(b, type, wx, wz); } finally { viewT = v; }
  const d = b.decos[b.decos.length - 1], m = b.decoG.children[b.decoG.children.length - 1];
  if (d && m && (type === 'strawberry' || type === 'kiwi')) { const a = Math.atan2(lz, lx); m.rotation.y = -a + Math.PI / 2; }
}
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
async function decoRing(b, type, n, r, a0 = 0, delay = 0.09) { for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU; decoAt(b, type, Math.cos(a) * r, Math.sin(a) * r); if (i % 2 === 0) SFX.plop(); await waitS(delay); } }
async function decoSpiral(b, type, n, rmax, delay = 0.04) { for (let i = 0; i < n; i++) { const r = rmax * Math.sqrt((i + 0.5) / n), a = i * GOLDEN; decoAt(b, type, Math.cos(a) * r, Math.sin(a) * r); if (i % 4 === 0) SFX.plop(); await waitS(delay); } }
async function decoRow(b, type, n, along, len, delay = 0.1) { for (let i = 0; i < n; i++) { const u = n === 1 ? 0 : (i / (n - 1) * 2 - 1) * len; along === 'x' ? decoAt(b, type, u, 0) : decoAt(b, type, 0, u); SFX.plop(); await waitS(delay); } }

/* the classic finish for a round cake: piped ring, fruit ring, a berry in the middle */
async function classicRound(b, fruit = 'strawberry', rosettes = true) {
  const rx = b.dims.rx;
  if (rosettes) await decoRing(b, 'rosette', 10, rx * 0.8, 0, 0.07);
  await decoRing(b, fruit, 8, rx * 0.5, rosettes ? Math.PI / 8 : 0);
  decoAt(b, fruit === 'strawberry' ? 'strawberryWhole' : fruit, 0, 0); SFX.plop();
}
async function prettyFinish(b, t) {
  const rx = b.dims.rx || 0.08;
  if (b.shape === 'round') {
    if (/cocoa|chocolate/.test(t)) { await decoRing(b, 'rosette', 10, rx * 0.8, 0, 0.07); await decoSpiral(b, 'chip', 18, rx * 0.55); return; }
    if (/blueberr/.test(t)) { await classicRound(b, 'blueberry'); return; }
    await classicRound(b); return;
  }
  if (b.shape === 'sheet' && b.rolled >= 1) { const L = (b.dims.rz || 0.1) * 0.75; for (let i = 0; i < 5; i++) { const u = (i / 4 * 2 - 1) * L; decoAt(b, i % 2 ? 'rosette' : 'strawberry', 0, u); SFX.plop(); await waitS(0.12); } return; }
  if (b.shape === 'loaf' || b.shape === 'sheet') { const L = (b.dims.rx || 0.1) * 0.72; for (let i = 0; i < 5; i++) { const u = (i / 4 * 2 - 1) * L; decoAt(b, i % 2 ? 'rosette' : 'strawberry', u, 0); SFX.plop(); await waitS(0.12); } return; }
  if (b.shape === 'crepes') { await crepeFruit(b); return; }
  await decoRing(b, 'strawberry', 6, rx * 0.5);
}
// the fan of folded crêpes: common tip point and the angles it covers
function crepeFan(b) {
  const S = b.foldSpots || []; if (!S.length) return null;
  const tx = S.reduce((a, p) => a + p.tx, 0) / S.length, tz = S.reduce((a, p) => a + p.tz, 0) / S.length;
  const angs = S.map(p => Math.atan2(p.z - tz, p.x - tx)); let a0 = Math.min(...angs), a1 = Math.max(...angs);
  if (a1 - a0 > Math.PI) { const w = angs.map(a => a < 0 ? a + TAU : a); a0 = Math.min(...w); a1 = Math.max(...w); }
  return { tx, tz, a0: a0 - 0.25, a1: a1 + 0.25, at(a, r) { return [tx + Math.cos(a) * r, tz + Math.sin(a) * r]; } };
}
async function crepeFruit(b, type = 'strawberry') {
  const F = b.fold && crepeFan(b);
  if (F) {
    // a neat arc of berries across the fan, a smaller arc inside it
    for (let i = 0; i < 6; i++) { const [x, z] = F.at(lerp(F.a0, F.a1, i / 5), 0.066); decoAt(b, type, x, z); SFX.plop(); await waitS(0.09); }
    for (let i = 0; i < 3; i++) { const [x, z] = F.at(lerp(F.a0, F.a1, (i + 0.5) / 3), 0.036); decoAt(b, type, x, z); await waitS(0.09); }
    return;
  }
  await decoRing(b, type, 7, 0.055, 0, 0.1); decoAt(b, 'strawberryWhole', 0, 0); SFX.plop();
}

/* ---------- Skip: take over the steps that place toppings ---------- */
const _performStepDeco = performStep;
performStep = async function (i) {
  const R = recipe, t = R.steps[i].t.toLowerCase(), b = bakeObj();
  if (R.product !== 'mousse' && b && /pipe cream rosettes and top with strawberries/.test(t)) { look(b); await classicRound(b); return; }
  if (b && /scatter chocolate chips and pipe rosettes/.test(t)) { look(b); await decoRing(b, 'rosette', 10, b.dims.rx * 0.8, 0, 0.07); await decoRing(b, 'chip', 12, b.dims.rx * 0.55, 0, 0.03); await decoSpiral(b, 'chip', 8, b.dims.rx * 0.3); return; }
  if (b && /shake sprinkles/.test(t)) { look(b); await decoSpiral(b, 'sprinkle', 40, b.dims.rx * 0.78, 0.02); return; }
  if (b && /arrange strawberries in the middle/.test(t)) { look(b); await decoRing(b, 'strawberry', 7, b.dims.rx * 0.32); decoAt(b, 'strawberryWhole', 0, 0); SFX.plop(); return; }
  if (/pipe cream rosettes over the crêpes/.test(t)) { const cb = crepeStack(); await ensureCream(); if (cb) { look(cb); const F = crepeFan(cb); if (F) { for (let k = 0; k < 7; k++) { const [x, z] = F.at(lerp(F.a0, F.a1, k / 6), 0.05); decoAt(cb, 'rosette', x, z); SFX.plop(); await waitS(0.12); } for (let k = 0; k < 3; k++) { const [x, z] = F.at(lerp(F.a0, F.a1, (k + 0.5) / 3), 0.078); decoAt(cb, 'rosette', x, z); await waitS(0.12); } } } return; }
  if (/^add strawberries\.?$|^add strawberries on top/.test(t)) { const cb = crepeStack(); if (cb) { look(cb); await crepeFruit(cb); return; } }
  if (/drizzle chocolate sauce and add strawberries/.test(t)) {
    const cb = crepeStack(); if (!cb) return _performStepDeco(i);
    const sauce = findK('chocsauce');
    if (sauce) { look(cb); const back = sauce.p.clone(), z = sauce.zone; await flyTo(sauce, cb.p.clone().add(V3(0.08, (cb.topY || cb.h) + 0.15, 0)), 0.5); sauce.pdir = V3(-1, 0, 0);
      const v = viewT; await animate(2.2, (k, raw) => { viewT = 1; const F = crepeFan(cb), aa = F ? lerp(F.a0, F.a1, raw) : 0, rad = 0.052 + Math.sin(raw * Math.PI * 11) * 0.02, x = F ? F.tx + Math.cos(aa) * rad : (raw * 2 - 1) * 0.06, zz = F ? F.tz + Math.sin(aa) * rad : 0, s = spinOf(cb) + (cb.yaw || 0), wx = cb.p.x + x * Math.cos(s) + zz * Math.sin(s), wz = cb.p.z - x * Math.sin(s) + zz * Math.cos(s); drizzleAt(cb, 'chocsauce', wx, wz); viewT = v; sauce.tilt = Math.min(2.2, raw * 6); applyTilt(sauce); sauce.p.x = wx + 0.03; sauce.p.z = wz; AUTO.stream = { type: 'liquid', a: lip3(sauce), b: V3(wx, cb.p.y + (cb.topY || cb.h), wz), col: ING.chocsauce.c, rate: 6, dir: sauce.pdir }; });
      AUTO.stream = null; sauce.tilt = 0; applyTilt(sauce); sauce.stock = Math.max(0, sauce.stock - 25); await flyTo(sauce, back, 0.5); sauce.zone = z; sauce.p.copy(back); }
    await crepeFruit(cb); return;
  }
  // the general "top with / decorate / finish it" steps
  if (R.product !== 'mousse' && b && /top it|top with|decorat|finish it/.test(t) && !/^dust/.test(t)) {
    look(b);
    if (/dust|icing/.test(t) || /icing/.test(R.deco || '')) { const ic = findK('icing'); if (ic) await toolOverSource(ic, b); b.dust = Math.max(b.dust || 0, 0.6); b.dustDirty = true; if (!/strawberr|fruit|cream|cocoa/.test(t)) return; }
    await prettyFinish(b, t); return;
  }
  return _performStepDeco(i);
};
