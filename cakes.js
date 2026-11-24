'use strict';
/* =========================================================
   Layer cakes: three-layer slicing, mixed fillings, drizzle
   sauces with drips, more plates on a spinning carousel.
   ========================================================= */

/* ---------- sauces ---------- */
Object.assign(ING, {
  chocsauce: { n: 'chocolate sauce', d: 1.2, c: [64, 34, 20], type: 'liquid' },
  coulis: { n: 'berry coulis', d: 1.1, c: [168, 24, 52], type: 'liquid' },
  caramel: { n: 'caramel sauce', d: 1.3, c: [196, 122, 46], type: 'liquid' },
});
Object.assign(DEF, {
  chocsauce: { name: 'Chocolate sauce', src: 'chocsauce', stock: 300, pour: { max: 14, tilt: 2.0 }, tare: 40, drizzle: 1 },
  coulis: { name: 'Berry coulis', src: 'coulis', stock: 300, pour: { max: 14, tilt: 2.0 }, tare: 40, drizzle: 1 },
  caramel: { name: 'Caramel sauce', src: 'caramel', stock: 300, pour: { max: 14, tilt: 2.0 }, tare: 40, drizzle: 1 },
});
Object.assign(SPEC, { chocsauce: { rad: 0.03, h: 0.15 }, coulis: { rad: 0.03, h: 0.15 }, caramel: { rad: 0.03, h: 0.15 } });
const FILL_COL = { cream: [255, 250, 238], fruit: [214, 60, 70], coulis: [168, 24, 52], chocsauce: [64, 34, 20], caramel: [196, 122, 46] };
function sauceModel(it) {
  const g = new THREE.Group(), c = ING[DEF[it.kind].src].c; it.parts = {};
  const lab = labelTex(256, 96, (x, w, h) => { x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, w, h); x.fillStyle = rgb(c); x.font = '700 26px Georgia, serif'; x.textAlign = 'center'; x.fillText(DEF[it.kind].name.toUpperCase().replace(' SAUCE', ''), w / 2, 44); x.font = '500 16px Inter, sans-serif'; x.fillText('squeeze', w / 2, 72); });
  g.add(mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.12, 24), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(c)), roughness: 0.25, clearcoat: 0.8, transmission: 0.15 }), 0, 0.06, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.0285, 0.0285, 0.05, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lab }), 0, 0.06, 0, false));
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.015, 20), MAT.white, 0, 0.127, 0));
  g.add(mesh(new THREE.ConeGeometry(0.008, 0.025, 12), MAT.white, 0, 0.147, 0));
  g.traverse(o => { if (o.isMesh) o.userData.item = it; }); return g;
}


/* ---------- cocoa really colours a batter ---------- */
const _mixColorC = Mix.prototype.color;
Mix.prototype.color = function () { const c = _mixColorC.call(this), t = this.total ? this.total() : 0, co = (this.g.cocoa || 0); if (!t || !co) return c; return mixc(c, [74, 44, 30], Math.min(0.82, co / t * 7)); };

/* ---------- plates ---------- */
Object.assign(DEF, {
  plate4: { name: 'Terracotta plate', host: 1, tare: 600 }, plate5: { name: 'Slate plate', host: 1, tare: 700 }, plate6: { name: 'Pink scalloped plate', host: 1, tare: 520 },
  plate7: { name: 'Gold-dot plate', host: 1, tare: 540 }, plate8: { name: 'Breton stripe plate', host: 1, tare: 560 }, plate9: { name: 'Botanical leaf plate', host: 1, tare: 560 },
});
['plate4', 'plate5', 'plate6', 'plate7', 'plate8', 'plate9'].forEach(k => SPEC[k] = { rad: 0.13, h: 0.018 });
const PLT = {};
(function plateTextures() {
  const rim = (fn, w = 1024, h = 48) => { const t = canvTex(w, h, fn); t.wrapS = THREE.RepeatWrapping; return t; };
  PLT.plate4 = { rim: rim((c, w, h) => { c.fillStyle = '#b85a34'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 3000, '90,40,20', 0.25, 2); c.fillStyle = '#8e3f22'; c.fillRect(0, h - 7, w, 7); }), center: canvTex(256, 256, (c) => { c.fillStyle = '#c4653e'; c.fillRect(0, 0, 256, 256); noiseFill(c, 256, 256, 2500, '120,50,25', 0.25, 2); }), rough: 0.55 };
  PLT.plate5 = { rim: rim((c, w, h) => { c.fillStyle = '#2f3336'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 3000, '120,120,120', 0.18, 2); c.fillStyle = 'rgba(200,200,200,.35)'; c.fillRect(0, h - 4, w, 4); }), center: canvTex(256, 256, (c) => { c.fillStyle = '#34383b'; c.fillRect(0, 0, 256, 256); noiseFill(c, 256, 256, 3500, '140,140,140', 0.14, 2); }), rough: 0.85 };
  PLT.plate6 = { rim: rim((c, w, h) => { c.fillStyle = '#f5d3d8'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; for (let x = 0; x < w; x += 32) { c.beginPath(); c.arc(x + 16, h, 16, Math.PI, 0); c.fill(); } }), center: canvTex(256, 256, (c) => { c.fillStyle = '#f8dde1'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 118, 0, TAU); c.stroke(); }), rough: 0.1 };
  PLT.plate7 = { rim: rim((c, w, h) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a24a'; for (let x = 0; x < w; x += 22) { c.beginPath(); c.arc(x + 11, h / 2, 3.5, 0, TAU); c.fill(); } c.fillRect(0, h - 4, w, 3); }), center: null, rough: 0.08 };
  PLT.plate8 = { rim: rim((c, w, h) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#23407a'; for (let x = 0; x < w; x += 24) c.fillRect(x, 0, 11, h); }), center: canvTex(256, 256, (c) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#23407a'; c.lineWidth = 4; c.beginPath(); c.arc(128, 128, 120, 0, TAU); c.stroke(); }), rough: 0.1 };
  PLT.plate9 = { rim: rim((c, w, h) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { c.strokeStyle = '#5c8a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 4, h - 8); c.quadraticCurveTo(x + 32, 4, x + 60, h - 8); c.stroke(); c.fillStyle = '#6f9e57'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + 14 + k * 12, h / 2 - 2 + (k % 2) * 6, 6, 3, k % 2 ? 0.6 : -0.6, 0, TAU); c.fill(); } } }), center: null, rough: 0.1 };
})();
function plateMesh2(kind) {
  const P = PLT[kind], g = new THREE.Group(), prof = [[0.085, 0.005], [0.115, 0.01], [0.13, 0.018]];
  const pts = [new THREE.Vector2(prof[0][0], prof[0][1]), new THREE.Vector2(prof[1][0], prof[1][1]), new THREE.Vector2(prof[2][0], prof[2][1]), new THREE.Vector2(prof[2][0] - 0.003, prof[2][1] - 0.003), new THREE.Vector2(prof[0][0] * 0.95, 0)];
  const glaze = map => new THREE.MeshPhysicalMaterial({ map, roughness: P.rough, clearcoat: P.rough < 0.5 ? 1 : 0.2, side: THREE.DoubleSide });
  g.add(mesh(new THREE.LatheGeometry(pts, 64), glaze(P.rim)));
  const center = mesh(new THREE.CircleGeometry(prof[0][0], 48), P.center ? glaze(P.center) : new THREE.MeshPhysicalMaterial({ color: 0xfbfaf6, roughness: 0.08, clearcoat: 1 }), 0, prof[0][1], 0); center.rotation.x = -Math.PI / 2; g.add(center);
  g.add(mesh(new THREE.CylinderGeometry(prof[0][0] * 0.95, prof[0][0] * 0.8, 0.005, 40), glaze(P.center || P.rim), 0, 0.0025, 0));
  return g;
}
const _bimC = buildItemModel;
buildItemModel = function (it) {
  if (DEF[it.kind]?.drizzle) return sauceModel(it);
  if (PLT[it.kind]) { it.parts = {}; const g = plateMesh2(it.kind); g.traverse(o => { if (o.isMesh) o.userData.item = it; }); return g; }
  return _bimC(it);
};

/* ---------- spinning plate carousel ---------- */
const CAR = { x: DX + 0.04, z: -0.02, rot: 0, vel: 0, tiers: [{ y: 1.88, n: 5, r: 0.27, off: 0 }, { y: 1.6, n: 4, r: 0.22, off: Math.PI / 4 }] };
const CAR_SLOTS = []; CAR.tiers.forEach((t, ti) => { for (let i = 0; i < t.n; i++) CAR_SLOTS.push({ ti, a: t.off + i / t.n * TAU }); });
(function buildCarousel() {
  // retire the old plate shelf
  const rm = []; FIX.room.traverse(o => { if (o.isMesh && o.geometry.parameters && Math.abs(o.position.y - (DSHELF.y - 0.013)) < 0.003 && Math.abs(o.geometry.parameters.width - (DSHELF.x1 - DSHELF.x0)) < 0.01) rm.push(o); if (o.isMesh && o.geometry.parameters && Math.abs(o.position.y - (DSHELF.y - 0.07)) < 0.003 && Math.abs(o.geometry.parameters.height - 0.09) < 0.003 && onDecor(o.position.x)) rm.push(o); });
  rm.forEach(o => o.parent.remove(o)); DSHELF.x0 = DSHELF.x1 = -99;
  const g = new THREE.Group(); FIX.room.add(g);
  g.add(box(0.05, 0.03, 0.3, MAT.plastic, CAR.x, 2.08, (CAR.z + WALLZ) / 2)); g.add(box(0.08, 0.12, 0.02, MAT.plastic, CAR.x, 2.08, WALLZ + 0.01));
  const spin = new THREE.Group(); spin.position.set(CAR.x, 0, CAR.z); g.add(spin); CAR.g = spin;
  spin.add(mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.66, 12), MAT.chrome, 0, 1.76, 0));
  CAR.tiers.forEach(t => { const top = t.y + 0.125; const ring = mesh(new THREE.TorusGeometry(t.r, 0.004, 8, 64), MAT.chrome, 0, top, 0); ring.rotation.x = Math.PI / 2; spin.add(ring); for (let i = 0; i < t.n; i++) { const a = t.off + i / t.n * TAU, sx = Math.sin(a), sz = Math.cos(a); const spoke = mesh(new THREE.CylinderGeometry(0.003, 0.003, t.r, 6), MAT.chrome, sx * t.r / 2, top, sz * t.r / 2); spoke.rotation.set(Math.PI / 2, 0, 0); spoke.rotation.order = 'YXZ'; spoke.rotation.y = a; spin.add(spoke); spin.add(mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.034, 6), MAT.chrome, sx * t.r, top - 0.017, sz * t.r)); const clip = mesh(new THREE.BoxGeometry(0.02, 0.008, 0.012), MAT.chrome, sx * t.r, t.y + 0.092, sz * t.r); clip.rotation.y = a; spin.add(clip); } });
  spin.add(mesh(new THREE.SphereGeometry(0.015, 12, 10), MAT.chrome, 0, 2.06, 0));
  spin.traverse(o => { if (o.isMesh) o.userData.ctrl = 'carousel'; });
})();
function carSlotPos(slot) { const t = CAR.tiers[CAR_SLOTS[slot].ti], a = CAR_SLOTS[slot].a + CAR.rot; return { p: V3(CAR.x + Math.sin(a) * t.r, t.y, CAR.z + Math.cos(a) * t.r), a }; }

/* ---------- fillings, drizzle and drips ---------- */
function openGap(b) { if (b.shape !== 'round' || b.layers < 2) return -1; for (let k = 0; k < b.layers - 1; k++) if ((b.fills[k] || 0) < 25) return k; return -1; }
function addFill(b, type, amt) { const k = openGap(b); if (k < 0) return false; b.fills[k] = (b.fills[k] || 0) + amt; b.fillTypes = b.fillTypes || []; b.fillTypes[k] = b.fillTypes[k] || []; if (!b.fillTypes[k].includes(type)) b.fillTypes[k].push(type); if (b.fills[k] >= 25) { const n = openGap(b); say(n < 0 ? 'All the layers are filled. Now cover it in cream.' : `Layer ${k + 1} filled. On to the next one.`, 2.5); } return true; }
function gapY(b, k) { const d = b.dims, n = b.layers, gaps = n - 1, fillT = j => (b.fills[j] != null ? 0.0035 + 0.003 * Math.min(1, b.fills[j] / 25) : 0.0012); const lh = (d.h - 0.0012 * gaps) / n; let y = (k + 1) * lh; for (let j = 0; j < k; j++) y += fillT(j); return y + fillT(k) / 2; }
const _rebuildBakeC = rebuildBake;
rebuildBake = function (b) {
  _rebuildBakeC(b);
  if (b.shape === 'round' && b.layers > 1 && b.fillTypes) {
    const discs = b.model.children.filter(m => m.isMesh && m.material === CREAMMAT && m.geometry.type === 'CylinderGeometry');
    discs.forEach((m, k) => { const types = b.fillTypes[k] || ['cream']; const main = types.find(t => t !== 'fruit') || 'cream'; m.material = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(FILL_COL[main])), roughness: main === 'cream' ? 0.45 : 0.15, clearcoat: main === 'cream' ? 0 : 0.8, sheen: main === 'cream' ? 0.6 : 0 }); m.userData.item = b;
      if (types.includes('fruit')) for (let j = 0; j < 9; j++) { const a = j / 9 * TAU, s = sliceMesh('strawberry'); s.scale.set(0.8, 0.8, 0.8); s.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2); s.position.set(Math.cos(a) * b.dims.rx * 0.9, m.position.y, Math.sin(a) * b.dims.rx * 0.9); s.traverse(o => { if (o.isMesh) o.userData.item = b; }); b.model.add(s); } });
  }
  if (b.drizG) b.decoG.add(b.drizG);
};
const _rebuildSigC = rebuildSig;
function drizzleRender(b) {
  if (!b.drizG) { b.drizG = new THREE.Group(); b.decoG.add(b.drizG); }
  const G = b.drizG; while (G.children.length) { const c = G.children.pop(); c.geometry && c.geometry.dispose(); }
  for (const s of b.drizzle || []) {
    const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(ING[s.type].c)), roughness: 0.12, clearcoat: 1 });
    if (s.pts.length >= 2) { const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(s.pts.map(p => V3(p.x, p.y, p.z))), Math.max(8, s.pts.length * 3), b.shape === 'crepes' ? 0.0014 : 0.0024, 8, false), mat, 0, 0, 0, false); m.userData.item = b; G.add(m); }
    if ((s.drips || []).length >= 6 && b.shape === 'round') { const top = mesh(new THREE.CylinderGeometry(b.dims.rx * 0.97, b.dims.rx * 0.97, 0.004, 48), mat, 0, (b.topY || b.h) + 0.003, 0, false); top.userData.item = b; G.add(top); }
    for (const d of s.drips || []) { const m = mesh(new THREE.CapsuleGeometry(0.0035, d.len, 4, 8), mat, d.x, d.y - d.len / 2, d.z, false); m.userData.item = b; G.add(m); }
  }
  b.drizDirty = false;
}
function drizzleAt(b, type, wx, wz) {
  b.drizzle = b.drizzle || []; let s = b.drizzle[b.drizzle.length - 1];
  const l = toLocal(b, wx, viewT < 0.5 ? b.p.z + (wz - b.p.z) * 0.3 : wz), d = b.dims, r = Math.hypot(l.x, l.z), lim = (d.rx || 0.09) * 0.98;
  let x = l.x, z = l.z; if (b.shape === 'round' && r > lim) { x *= lim / r; z *= lim / r; }
  const y = topAt(b, x) + (b.shape === 'round' ? 0.006 : 0.003);
  if (!s || s.type !== type || s.closed) { s = { type, pts: [], drips: [] }; b.drizzle.push(s); }
  const last = s.pts[s.pts.length - 1];
  if (!last || Math.hypot(last.x - x, last.z - z) > 0.007) { s.pts.push({ x, y, z }); b.drizDirty = true; if (s.pts.length > 160) s.closed = true; }
  if (b.shape === 'round' && Math.hypot(x, z) > lim * 0.9) { const a = Math.atan2(z, x); if (!s.drips.some(dd => Math.abs(Math.atan2(dd.z, dd.x) - a) < 0.18)) { s.drips.push({ x: Math.cos(a) * (d.rx + 0.004), y: (b.topY || b.h) + 0.002, z: Math.sin(a) * (d.rx + 0.004), len: 0.012 + Math.random() * 0.025 }); b.drizDirty = true; } }
}
const dripCount = b => (b.drizzle || []).reduce((s, x) => s + x.drips.length, 0);
const drizLen = b => (b.drizzle || []).reduce((s, x) => s + x.pts.length, 0);
const _pour3C = pour3;
pour3 = function (it, dt) {
  const d = DEF[it.kind];
  if (!d.drizzle) return _pour3C(it, dt);
  const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.45, it.rad);
  if (!b) { if (it.drizStroke) { const lb = bakesOf().find(x => x.drizzle && x.drizzle.length); if (lb) lb.drizzle[lb.drizzle.length - 1].closed = true; it.drizStroke = false; } return _pour3C(it, dt); }
  it.zTarget = b.p.z; if (!it.pdir) it.pdir = V3(-1, 0, 0);
  if (PT.speed < 2000) it.pourHold = (it.pourHold || 0) + dt;
  const want = it.pourHold > 0.1 ? 2.3 : 0; it.tilt += clamp(want - it.tilt, -3.6 * dt, 3 * dt); applyTilt(it); it.stream = null;
  if (it.tilt < 1.6 || it.stock < 0.2) return;
  const lip = lip3(it), amt = Math.min(it.stock, 6 * dt); it.stock -= amt;
  const tx = lip.x, tz = lip.z, l = toLocal(b, tx, tz);
  const ty = b.p.y + topAt(b, l.x) + 0.004;
  it.stream = { type: 'liquid', a: lip, b: V3(tx, ty, tz), col: ING[d.src].c, rate: 6 };
  if (openGap(b) >= 0) { addFill(b, d.src, amt * 2.2); hintOnce('sauceFill', 'The sauce is going in as a filling between the layers.'); }
  else { drizzleAt(b, d.src, tx, tz); it.drizStroke = true; recordCream(b, { whip: 0.85 }, 0); }
};
// cream spreading and fruit can fill layers too, and fill types are remembered
const _tool3C = tool3;
tool3 = function (it, dt) {
  const b = (DEF[it.kind].spread) ? bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0.03) : null;
  const before = b ? b.fills.map(f => f || 0) : null;
  _tool3C(it, dt);
  if (b && before) { b.fillTypes = b.fillTypes || []; b.fills.forEach((f, k) => { if ((f || 0) > (before[k] || 0)) { b.fillTypes[k] = b.fillTypes[k] || []; if (!b.fillTypes[k].includes('cream')) b.fillTypes[k].push('cream'); } }); }
};
const _release3C2 = release3;
release3 = function () {
  const it = held && held.it, d = it && DEF[it.kind];
  if (it && (d.fruit || it.kind === 'slice')) { const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.4, 0.01); if (b && openGap(b) >= 0 && it.kind !== 'kiwi') { held = null; addFill(b, 'fruit', it.kind === 'slice' ? 8 : it.kind === 'strawberry' ? 10 : 9); remove3(it); SFX.plop(); return; } }
  _release3C2();
};
// knife can cut up to three layers (already), keep the extra check visible in bars
const _syncItemC = syncItem;
syncItem = function (it) {
  if (it.zone === 'carousel' && it.slot != null && !it.flyHome) { const s = carSlotPos(it.slot); it.p.copy(s.p); _syncItemC(it); it.root.rotation.order = 'YXZ'; it.root.rotation.set(Math.PI / 2, s.a, 0); it.root.position.copy(s.p); it.root.scale.setScalar(0.72); return; }
  if (it.root) { it.root.rotation.order = 'XYZ'; if (/^plate\d$/.test(it.kind)) it.root.scale.setScalar(1); }
  _syncItemC(it);
  if (it.kind === 'bake' && it.drizDirty) drizzleRender(it);
};
const _visibleC = visible3;
visible3 = function (it) { if (it.zone === 'carousel') return true; return _visibleC(it); };

/* ---------- carousel interaction ---------- */
const _updateCameraC = updateCamera;
updateCamera = function (dt) {
  if (view !== 'plates') return _updateCameraC(dt);
  const aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? 1.5 / aspect : 1;
  const tp = V3(CAR.x, 1.78, CAR.z + 0.3 + 0.85 * widen), tl = V3(CAR.x, 1.72, CAR.z), tf = 44, k = 1 - Math.exp(-dt * 4.2);
  if (!camCur.pos) camCur.pos = tp.clone(); camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  viewT += clamp(0 - viewT, -dt * 1.6, dt * 1.6);
};
const _onDownC = onDown3;
onDown3 = function () {
  if (!held && !BOOK.open && !scorecard && !AUTO.busy) {
    const h = pick3(PT.x, PT.y);
    const onCar = h && ((h.it && h.it.zone === 'carousel') || h.ctrl === 'carousel');
    if (onCar) {
      if (view !== 'plates') { prevView = view; view = 'plates'; station = 'decor'; focusObj = null; focusPinned = false; SFX.click(); hintOnce('carousel', 'Swipe sideways to spin the plates. Click the plate you like to take it.'); return; }
      drag = { type: 'carousel', x0: PT.x, rot0: CAR.rot, plate: h.it && h.it.zone === 'carousel' ? h.it : null, moved: false }; return;
    }
  }
  _onDownC();
};
const _onMoveC = onMove3;
onMove3 = function () { if (drag && drag.type === 'carousel') { const dx = PT.x - drag.x0; if (Math.abs(dx) > 6) drag.moved = true; CAR.rot = drag.rot0 + dx * 0.008; CAR.vel = 0; return; } _onMoveC(); };
const _onUpC = onUp3;
onUp3 = function () {
  if (drag && drag.type === 'carousel') {
    const d = drag; drag = null;
    if (!d.moved && d.plate) { const pl = d.plate; pl.zone = 'counter'; pl.root.rotation.order = 'XYZ'; beginHold(pl, pl.p.clone()); station = 'decor'; view = 'work'; SFX.clink(); say(`${DEF[pl.kind].name}. Click on the counter to set it down.`, 2.5); }
    else CAR.vel = clamp(PT.vx * 0.008, -6, 6);
    return;
  }
  _onUpC();
};
const _tickC = tick3;
tick3 = function (dt) {
  _tickC(dt);
  if (!(drag && drag.type === 'carousel')) { CAR.rot += CAR.vel * dt; CAR.vel *= Math.exp(-dt * 2.5); if (Math.abs(CAR.vel) < 0.3) { const step = TAU / CAR.tiers[0].n, target = Math.round(CAR.rot / step) * step; CAR.rot += (target - CAR.rot) * Math.min(1, dt * 4); } }
  if (CAR.g) CAR.g.rotation.y = CAR.rot;
};
const _stepBackC = stepBack;
stepBack = function () { if (view === 'plates') { station = 'decor'; view = 'counter'; SFX.click(); return; } _stepBackC(); };
const _hoverC = hover3;
hover3 = function () {
  if (!held && !heldDough && PT.has && !BOOK.open && !AUTO.busy) { const h = pick3(PT.x, PT.y); if (h && h.it && h.it.zone === 'carousel') return view === 'plates' ? `${DEF[h.it.kind].name} · click to take it` : 'Plate carousel · click to look closer'; if (h && h.ctrl === 'carousel') return view === 'plates' ? 'Swipe sideways to spin' : 'Plate carousel · click to look closer'; if (h && h.it && DEF[h.it.kind].drizzle) return `${DEF[h.it.kind].name} · hold over a cake to drizzle`; }
  return _hoverC();
};
const _hintC = hint3;
hint3 = function () { if (view === 'plates' && !held) return 'Swipe to spin the plates · click one to take it · ↑ to step back'; if (held && DEF[held.it.kind].drizzle) return 'Hold it over the cake and move around to drizzle. Near the edge it drips down.'; return _hintC(); };
// skip helper: find a plate on the carousel
const _plateReadyC = plateReady;
plateReady = async function () {
  let pl = items.find(i => i.kind.startsWith('plate') && i.zone === 'counter' && !bakesOf().some(b => b.host === i) && !items.some(o => o.host === i));
  if (!pl) { pl = items.find(i => i.kind.startsWith('plate') && i.zone === 'carousel'); if (pl) { pl.root.rotation.order = 'XYZ'; await flyTo(pl, V3(DX + 0.9, CT, -0.04), 0.9, 'counter'); pl.p.set(DX + 0.9, CT, -0.04); } }
  return pl || _plateReadyC();
};

/* ---------- recipes ---------- */
const fillsDone = b => b.layers > 1 && b.fills.length >= b.layers - 1 && b.fills.slice(0, b.layers - 1).every(f => f >= 25);
const hasFillType = (b, t) => (b.fillTypes || []).some(ts => ts && ts.includes(t));
const coverOk = b => covAvg(b) >= 0.75 && sideAvg(b) >= 0.6;
const decoCount = (b, t) => b.decos.filter(d => d.type === t).length;
const roundB = () => bakesOf('round');
const LAYER_CAKES = [
  { id: 'shortcake', name: 'Strawberry Shortcake', country: 'Japan', kind: 'hot', level: 3, product: 'cake', pan: 'tin', whip: true, frosted: true, temp: 170, time: 30, ing: { egg: 200, sugar: 100, flour: 100, milk: 30, butter: 20 }, blurb: 'Feather-light sponge in three layers, filled and covered in cream and strawberries.',
    extra: ['300 g cream', 'strawberries'], steps: [
      { t: 'Preheat the oven to 170 °C.', c: () => near(OV.set, 170, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 60 && m.whip > 0.6) },
      { t: 'Gently fold in the flour, milk and butter.', c: () => anyMix(m => (m.g.flour || 0) > 70 && (m.g.egg || 0) > 100 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 250) || roundB().length > 0 },
      { t: 'Bake for about 30 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable and slice it into 3 layers.', c: () => roundB().some(b => b.layers >= 3) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Fill both layers with cream and sliced strawberries.', c: () => roundB().some(b => fillsDone(b) && hasFillType(b, 'cream') && hasFillType(b, 'fruit')) },
      { t: 'Cover the whole cake in cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Pipe cream rosettes and top with strawberries.', c: () => roundB().some(b => decoCount(b, 'rosette') >= 4 && (decoCount(b, 'strawberry') + decoCount(b, 'strawberryWhole')) >= 3) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
  { id: 'blackforest', name: 'Black Forest Gâteau', country: 'Germany', kind: 'hot', level: 3, product: 'cake', pan: 'tin', whip: true, frosted: true, temp: 180, time: 28, ing: { egg: 200, sugar: 120, flour: 90, cocoa: 30, bp: 3 }, blurb: 'Chocolate sponge layered with berry coulis and cream, crowned with chocolate.',
    extra: ['300 g cream', 'berry coulis', 'chocolate chips'], steps: [
      { t: 'Preheat the oven to 180 °C.', c: () => near(OV.set, 180, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 70 && m.whip > 0.6) },
      { t: 'Gently fold in the flour, cocoa and baking powder.', c: () => anyMix(m => (m.g.flour || 0) > 60 && (m.g.cocoa || 0) > 15 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 250) || roundB().length > 0 },
      { t: 'Bake for about 28 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable and slice it into 3 layers.', c: () => roundB().some(b => b.layers >= 3) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Fill one layer with berry coulis and the other with cream.', c: () => roundB().some(b => fillsDone(b) && hasFillType(b, 'coulis') && hasFillType(b, 'cream')) },
      { t: 'Cover the whole cake in cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Scatter chocolate chips and pipe rosettes on top.', c: () => roundB().some(b => decoCount(b, 'chip') >= 10 && decoCount(b, 'rosette') >= 3) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
  { id: 'drip', name: 'Chocolate Drip Cake', country: 'United States', kind: 'hot', level: 2, product: 'cake', pan: 'tin', whip: false, frosted: true, temp: 175, time: 35, ing: { butter: 120, sugar: 150, egg: 100, flour: 150, cocoa: 30, milk: 100, bp: 6 }, blurb: 'Cream-covered chocolate cake with a glossy chocolate drip and sprinkles.',
    extra: ['300 g cream', 'chocolate sauce', 'sprinkles'], steps: [
      { t: 'Preheat the oven to 175 °C.', c: () => near(OV.set, 175, 10) },
      { t: 'Beat the butter and sugar together.', c: () => anyMix(m => (m.g.butter || 0) > 80 && (m.g.sugar || 0) > 90 && m.mix > 0.7) },
      { t: 'Mix in the eggs, flour, cocoa, milk and baking powder until smooth.', c: () => anyMix(m => (m.g.flour || 0) > 100 && (m.g.cocoa || 0) > 15 && (m.g.milk || 0) > 60 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 300) || roundB().length > 0 },
      { t: 'Bake for about 35 minutes.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) || roundB().length > 0 },
      { t: 'Cool it on the rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
      { t: 'Turn it out onto the turntable and slice it into 2 layers.', c: () => roundB().some(b => b.layers >= 2) },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Fill the layer with cream.', c: () => roundB().some(b => fillsDone(b)) },
      { t: 'Cover the whole cake in cream while spinning the turntable.', c: () => roundB().some(coverOk) },
      { t: 'Drizzle chocolate sauce around the edge so it drips down.', c: () => roundB().some(b => dripCount(b) >= 6) },
      { t: 'Shake sprinkles on top.', c: () => roundB().some(b => decoCount(b, 'sprinkle') >= 10) },
      { t: 'Move it onto a plate and ring the bell.', c: () => !!scorecard }] },
];
LAYER_CAKES.forEach(R => { R.lines = [...Object.entries(R.ing).map(([k, v]) => k === 'egg' ? `${Math.round(v / 50)} eggs` : `${v} g ${ING[k].n}`), ...R.extra]; RECIPES.push(R); });
EXTRA_TARGET.cream = 300; EXTRA_TARGET.icing = 30;
HINTS.unshift(
  [/3 layers|2 layers/i, ['turntable', 'knife'], 'Turn the cake out onto the turntable, then saw the bread knife across it once per layer.'],
  [/fill (both|one|the) layer/i, ['offset', 'strawberry'], 'Spread cream with the offset spatula, drop strawberry slices, or drizzle a sauce. Each layer fills in turn.'],
  [/drizzle|drip/i, ['icing'], 'Hold the sauce bottle over the cake edge and move around. It drips down the sides.'],
  [/cover the whole cake/i, ['offset', 'turntable'], 'Load the offset spatula with cream, hold it on the top and side, and spin the turntable.']);

/* ---------- judging the decoration ---------- */
const _decoEvalC = decoEval;
decoEval = function (b) {
  const r = _decoEvalC(b);
  if (b.shape === 'round') {
    const types = new Set((b.fillTypes || []).flat()); if (types.size >= 2) { r.s += 0.08; r.good.unshift(`Fillings: ${[...types].map(t => ({ cream: 'cream', fruit: 'strawberries', coulis: 'berry coulis', chocsauce: 'chocolate', caramel: 'caramel' }[t])).join(', ')}.`); }
    if (dripCount(b) >= 6) { r.s += 0.08; r.good.unshift('A glossy drip all the way round.'); } else if (drizLen(b) > 20) r.good.push('Pretty sauce drizzle.');
    if (recipe && recipe.frosted && !coverOk(b)) { r.s -= 0.12; r.notes.unshift('The cream doesn’t cover the cake. Spin the turntable as you spread.'); }
    r.s = clamp(r.s, 0, 1);
  }
  return r;
};

/* ---------- skip: perform the new steps ---------- */
const _performStepC = performStep;
performStep = async function (i) {
  const t = recipe.steps[i].t.toLowerCase();
  const b = bakeObj();
  const m = /slice it into (\d) layers/.exec(t);
  if (m) { const host = findK('turntable'); let pan = panOf(); if (pan && pan.bake) { if (pan.zone === 'oven') await outToRack(pan); if (pan.temp > 44) await ff(() => pan.temp < 44, 30); if (!onDecor(pan.p.x)) await toDecor(pan); await turnOutOnto(pan, host); } const bb = bakeObj(); if (!bb) return; look(bb); const n = +m[1]; while (bb.layers < n) { await toolOver('knife', bb, 0.9, (tool, cc, raw) => { tool.p.set(cc.x - 0.15 + Math.sin(raw * 10) * 0.04, cc.y + (bb.topY || bb.h) * (1 - bb.layers / (n + 0.5)), cc.z); }); bb.layers++; bb.fills = bb.fills.slice(0, bb.layers - 1); SFX.scrape(); } return; }
  if (/^fill /.test(t) && b) {
    look(b); const cream = await ensureCream(); const gaps = b.layers - 1;
    for (let k = 0; k < gaps; k++) {
      let types = ['cream'];
      if (/strawberr/.test(t)) types = ['cream', 'fruit'];
      if (/coulis/.test(t)) types = k === 0 ? ['coulis'] : ['cream'];
      await toolOver('offset', b, 0.9, (tool, cc, raw) => { tool.p.set(cc.x + Math.sin(raw * 8) * 0.04, cc.y + gapY(b, k) + 0.02, cc.z); });
      if (types.includes('coulis')) { const s = findK('coulis'); if (s) s.stock = Math.max(0, s.stock - 20); }
      b.fills[k] = 28; b.fillTypes = b.fillTypes || []; b.fillTypes[k] = types; SFX.plop(); await waitS(0.25);
    }
    cream.m.take(Math.min(1, 60 / Math.max(1, cream.m.total()))); b.creamG += 60; b.creamWhipSum += 60 * (cream.m.whip || 0.85); return;
  }
  if (/drizzle|drip/.test(t) && b) {
    look(b); const sauce = findK(/caramel/.test(t) ? 'caramel' : /coulis/.test(t) ? 'coulis' : 'chocsauce'); const type = DEF[sauce.kind].src;
    const back = sauce.p.clone(), z = sauce.zone; await flyTo(sauce, b.p.clone().add(V3(0.1, (b.topY || b.h) + 0.15, 0)), 0.5); sauce.pdir = V3(-1, 0, 0);
    await animate(2.4, (k, raw) => { sauce.tilt = Math.min(2.2, raw * 6); applyTilt(sauce); const a = raw * TAU * 1.05, r = b.dims.rx * 0.95; drizzleAt(b, type, b.p.x + Math.cos(a) * r, b.p.z + Math.sin(a) * r); sauce.p.x = b.p.x + Math.cos(a) * r * 0.6; sauce.p.z = b.p.z + Math.sin(a) * r * 0.6; AUTO.stream = { type: 'liquid', a: lip3(sauce), b: V3(b.p.x + Math.cos(a) * r, b.p.y + (b.topY || b.h), b.p.z + Math.sin(a) * r), col: ING[type].c, rate: 6, dir: sauce.pdir }; });
    AUTO.stream = null; sauce.tilt = 0; applyTilt(sauce); sauce.stock = Math.max(0, sauce.stock - 40); await flyTo(sauce, back, 0.5); sauce.zone = z; sauce.p.copy(back); return;
  }
  if (/cover the whole cake/.test(t) && b) { const cream = await ensureCream(); look(b); const tt = b.host && b.host.kind === 'turntable' ? b.host : null; await toolOver('offset', b, 2.6, (tool, cc, raw) => { if (tt) tt.spinV = 7; tool.p.set(cc.x + b.dims.rx * (raw < 0.5 ? 0.4 : 1.05), cc.y + (raw < 0.5 ? (b.topY || b.h) + 0.004 : (b.topY || b.h) * 0.5), cc.z); }); b.covTop.fill(1); b.covSide.fill(1); b.covDirty = true; b.creamG += 120; b.creamWhipSum += 120 * (cream.m.whip || 0.85); cream.m.take(Math.min(1, 120 / Math.max(1, cream.m.total()))); return; }
  if (/pipe cream rosettes|scatter chocolate chips|shake sprinkles/.test(t) && b) {
    look(b); const plan = /sprinkles/.test(t) ? ['sprinkle', 14] : /chips/.test(t) ? ['chip', 14] : ['strawberry', 4];
    for (let n = 0; n < plan[1]; n++) { const a = n / plan[1] * TAU, r = b.dims.rx * (plan[0] === 'strawberry' ? 0.45 : 0.25 + Math.random() * 0.6); addDeco(b, plan[0], b.p.x + Math.cos(a) * r, b.p.z + Math.sin(a) * r); if (n % 3 === 0) SFX.plop(); await waitS(0.08); }
    if (/rosettes/.test(t)) for (let n = 0; n < 8; n++) { const a = n / 8 * TAU + 0.2, r = b.dims.rx * 0.78; addDeco(b, 'rosette', b.p.x + Math.cos(a) * r, b.p.z + Math.sin(a) * r); await waitS(0.12); }
    return;
  }
  return _performStepC(i);
};

/* ---------- put the new things in place ---------- */
const _build3C = build3;
build3 = function () {
  CAR.rot = 0; CAR.vel = 0;
  _build3C();
  for (const k of ['plate4', 'plate5', 'plate6', 'plate7', 'plate8', 'plate9']) mk3(k, CAR.x, 1.7, CAR.z, 'carousel');
  const plates = items.filter(i => /^plate\d$/.test(i.kind)).sort((a, b) => a.kind.localeCompare(b.kind));
  plates.forEach((pl, i) => { pl.zone = 'carousel'; pl.slot = i % CAR_SLOTS.length; const s = carSlotPos(pl.slot); pl.p.copy(s.p); pl.home = { p: s.p.clone(), zone: 'carousel', slot: pl.slot }; });
  mk3('chocsauce', DX - 0.12, CT, -0.2, 'counter'); mk3('coulis', DX - 0.02, CT, -0.2, 'counter'); mk3('caramel', DX + 0.08, CT, -0.2, 'counter');
};
// returning plates go back to their carousel slot
const _tickC2 = tick3;
tick3 = function (dt) { _tickC2(dt); for (const it of items) if (it.home && it.home.zone === 'carousel' && it.zone === 'carousel' && it.slot == null) it.slot = it.home.slot; };
build3();
