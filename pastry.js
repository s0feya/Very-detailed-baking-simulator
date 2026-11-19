'use strict';
/* =========================================================
   Drawers under the counter, pastry equipment and recipes:
   croissants, berry pie, sourdough, madeleines, canelés.
   ========================================================= */

/* ---------- ingredients ---------- */
Object.assign(ING, {
  starter: { n: 'sourdough starter', d: 1.0, c: [236, 226, 204], type: 'thick' },
  berries: { n: 'berries', d: 0.75, c: [120, 28, 58], type: 'chunk' },
});
Object.assign(MISSING, { starter: 'No starter, so it never rose.', berries: 'No fruit in the filling!', cocoa: 'No cocoa.', cinnamon: 'No cinnamon.', oats: 'No oats.', honey: 'No honey.', coffee: 'No espresso.', biscuits: 'No biscuit crumbs.', creamcheese: 'No cream cheese.', cream: 'No cream.', icing: 'No icing sugar.' });
Object.assign(DEF, {
  starter: { name: 'Sourdough starter', src: 'starter', stock: 300, pour: { max: 14, tilt: 2.0 }, tare: 250, spoonable: 1 },
  berries: { name: 'Frozen berries', src: 'berries', stock: 600, pour: { max: 40, tilt: 1.9 }, tare: 20 },
  pie: { name: 'Pie dish', cont: 1, recv: 1, pan: 1, pour: { max: 0, tilt: 1.6 }, tare: 600 },
  banneton: { name: 'Banneton (proofing basket)', cont: 1, recv: 1, pour: { max: 40, tilt: 1.8 }, tare: 250 },
  dutch: { name: 'Dutch oven', cont: 1, recv: 1, pan: 1, pour: { max: 0, tilt: 1.6 }, tare: 3500 },
  madeleine: { name: 'Madeleine pan', cont: 1, recv: 1, pan: 1, pour: { max: 0, tilt: 1.6 }, tare: 400 },
  canele: { name: 'Canelé molds', cont: 1, recv: 1, pan: 1, pour: { max: 0, tilt: 1.6 }, tare: 600 },
  pin: { name: 'Rolling pin', tool: 1, roll: 1, tare: 500 },
  brush: { name: 'Pastry brush', tool: 1, brush: 1, cont: 1, tare: 30 },
  lame: { name: 'Bread lame', tool: 1, lame: 1, tare: 20 },
});
Object.assign(SPEC, {
  starter: { rad: 0.04, h: 0.12 }, berries: { rad: 0.06, h: 0.15 },
  pie: { rad: 0.125, h: 0.045 }, banneton: { rad: 0.105, h: 0.08 }, dutch: { rad: 0.13, h: 0.11 }, madeleine: { rad: 0.15, h: 0.02 }, canele: { rad: 0.12, h: 0.05 },
  pin: { rad: 0.025, h: 0.42 }, brush: { rad: 0.015, h: 0.2 }, lame: { rad: 0.012, h: 0.15 },
});
PROF.pie = { outer: [[0, 0], [0.095, 0], [0.125, 0.045]], inner: [[0, 0.006], [0.09, 0.006], [0.118, 0.043]] };
PROF.banneton = { outer: [[0, 0], [0.06, 0], [0.095, 0.04], [0.105, 0.08]], inner: [[0, 0.006], [0.056, 0.007], [0.09, 0.04], [0.099, 0.078]] };
PROF.dutch = { outer: [[0, 0], [0.12, 0], [0.13, 0.02], [0.13, 0.11]], inner: [[0, 0.012], [0.112, 0.012], [0.12, 0.03], [0.12, 0.108]] };
['pie', 'banneton', 'dutch'].forEach(k => PROF[k].vol = volTable(PROF[k].inner));
const RECT = { madeleine: { rx: 0.14, rz: 0.095, h: 0.02, cap: 300 }, canele: { rx: 0.1, rz: 0.07, h: 0.05, cap: 330 } };
Object.assign(PAN_NAME, { pie: 'pie dish', dutch: 'Dutch oven', madeleine: 'madeleine pan', canele: 'canelé molds', banneton: 'banneton' });

/* ---------- textures ---------- */
const PT2 = {};
PT2.rattan = canvTex(256, 256, (c, w, h) => { c.fillStyle = '#b98a55'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { c.fillStyle = y % 16 ? 'rgba(90,60,30,.35)' : 'rgba(255,230,190,.25)'; c.fillRect(0, y, w, 3); } noiseFill(c, w, h, 2000, '60,40,20', 0.2); });
PT2.shell = canvTex(256, 192, (c, w, h) => { c.fillStyle = '#9aa0a5'; c.fillRect(0, 0, w, h); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const x = 32 + k * 64, y = 32 + r * 64; const g = c.createRadialGradient(x, y + 6, 4, x, y, 28); g.addColorStop(0, '#5d6266'); g.addColorStop(1, '#b8bdc0'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, 20, 27, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,40,40,.35)'; for (let s = -3; s <= 3; s++) { c.beginPath(); c.moveTo(x, y + 24); c.lineTo(x + s * 6, y - 22); c.stroke(); } } });

/* ---------- models ---------- */
function crescentGeo() { const g = new THREE.TorusGeometry(1, 0.42, 10, 20, Math.PI * 1.25); g.rotateX(Math.PI / 2); g.rotateY(Math.PI * 0.12); return g; }
const CRESCENT = crescentGeo();
function pastryModel(it) {
  const k = it.kind, g = new THREE.Group(), add = m => { g.add(m); return m; }; it.parts = {};
  const discParts = () => { it.parts.disc = add(contentDisc()); it.parts.dome = add(mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.dough.clone(), 0, 0, 0)); it.parts.dome.visible = false; };
  if (k === 'starter') { const r = 0.04, h = 0.12; add(mesh(latheShell([[0, 0], [r, 0], [r, h * 0.85]], [[0, 0.004], [r - 0.003, 0.004], [r - 0.003, h * 0.84]]), MAT.glass)); it.parts.fill = add(mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.004, 1, 24), new THREE.MeshStandardMaterial({ color: 0xece2cc, map: TX.speck, roughness: 0.6 }), 0, 0, 0, false)); add(mesh(new THREE.CylinderGeometry(r + 0.002, r + 0.002, 0.012, 24), new THREE.MeshStandardMaterial({ color: 0xc9a46a, roughness: 0.5 }), 0, h * 0.88, 0)); const lab = labelTex(256, 64, (c, w, hh) => { c.fillStyle = '#efe6d4'; c.fillRect(0, 0, w, hh); c.fillStyle = '#4a3b2b'; c.font = '700 22px Georgia, serif'; c.textAlign = 'center'; c.fillText('STARTER', w / 2, 40); }); add(mesh(new THREE.CylinderGeometry(r + 0.0008, r + 0.0008, h * 0.22, 24, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lab }), 0, h * 0.45, 0, false)); }
  else if (k === 'berries') { const lab = labelTex(256, 384, (c, W, H) => { c.fillStyle = '#d9eef6'; c.fillRect(0, 0, W, H); c.fillStyle = '#6a1a3a'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(30 + Math.random() * (W - 60), 220 + Math.random() * 120, 10 + Math.random() * 6, 0, TAU); c.fill(); } c.fillStyle = '#1d4f7a'; c.font = '700 36px Georgia, serif'; c.textAlign = 'center'; c.fillText('BERRIES', W / 2, 120); c.font = '500 20px Inter, sans-serif'; c.fillText('frozen · 600 g', W / 2, 160); }); add(mesh(new THREE.BoxGeometry(0.12, 0.15, 0.04), new THREE.MeshPhysicalMaterial({ map: lab, roughness: 0.3, clearcoat: 0.7 }), 0, 0.075, 0)); }
  else if (k === 'pie') { const p = PROF.pie; const m = mesh(latheShell(p.outer, p.inner, 24), new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: 0.2, clearcoat: 0.8 })); add(m); discParts(); it.parts.crust = add(mesh(new THREE.TorusGeometry(0.113, 0.01, 8, 40), MAT.dough.clone(), 0, 0.044, 0)); it.parts.crust.rotation.x = Math.PI / 2; it.parts.crust.visible = false; }
  else if (k === 'banneton') { add(mesh(latheShell(PROF.banneton.outer, PROF.banneton.inner, 40), new THREE.MeshStandardMaterial({ map: PT2.rattan, roughness: 0.9 }))); discParts(); }
  else if (k === 'dutch') { add(mesh(latheShell(PROF.dutch.outer, PROF.dutch.inner, 48), new THREE.MeshPhysicalMaterial({ color: 0xa8322a, roughness: 0.3, clearcoat: 0.7 }))); [-1, 1].forEach(s => { const h = mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16, Math.PI), MAT.darkMetal, s * 0.135, 0.085, 0); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; add(h); }); discParts(); }
  else if (k === 'madeleine') { add(box(0.3, 0.012, 0.2, new THREE.MeshStandardMaterial({ map: PT2.shell, metalness: 0.6, roughness: 0.4 }), 0, 0.006, 0)); it.parts.cups = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const m = mesh(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2), MAT.dough.clone(), -0.105 + c * 0.07, 0.012, -0.065 + r * 0.065); m.scale.set(0.019, 0.001, 0.026); m.visible = false; add(m); it.parts.cups.push(m); } }
  else if (k === 'canele') { add(box(0.24, 0.006, 0.16, MAT.darkMetal, 0, 0.003, 0)); it.parts.cups = []; const copper = new THREE.MeshStandardMaterial({ color: 0xc27a4a, metalness: 1, roughness: 0.28 }); for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const x = -0.075 + c * 0.075, z = -0.038 + r * 0.076; add(mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.045, 12, 1, true), copper, x, 0.028, z)); const f = mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.004, 12), MAT.dough.clone(), x, 0.008, z); f.visible = false; add(f); it.parts.cups.push(f); } }
  else if (k === 'pin') { add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 24), MAT.wood, 0, 0.21, 0)); [0.04, 0.38].forEach(y => add(mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.07, 16), MAT.wood, 0, y, 0))); }
  else if (k === 'brush') { add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 12), MAT.wood, 0, 0.13, 0)); add(box(0.03, 0.012, 0.008, MAT.steel, 0, 0.055, 0)); it.parts.bristle = add(box(0.03, 0.05, 0.007, new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 1 }), 0, 0.025, 0)); }
  else if (k === 'lame') { add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 10), MAT.wood, 0, 0.09, 0)); add(box(0.02, 0.028, 0.001, MAT.chrome, 0, 0.016, 0)); }
  g.traverse(o => { if (o.isMesh) o.userData.item = it; });
  return g;
}
const _bimP = buildItemModel;
buildItemModel = function (it) { if (['starter', 'berries', 'pie', 'banneton', 'dutch', 'madeleine', 'canele', 'pin', 'brush', 'lame'].includes(it.kind)) return pastryModel(it); return _bimP(it); };

/* ---------- drawers ---------- */
const DRW = [-0.9, -0.3, 0.3, 0.9].map((x, i) => ({ i, x, w: 0.56, floor: 0.705, open: 0, tgt: 0, slide: 0.43 }));
const drawerZ = (d, local) => local + d.open * d.slide;
(function buildDrawers() {
  // take away the old full-height doors and their handles
  const rm = []; FIX.room.children.forEach(o => { if (!o.isMesh || !o.geometry.parameters) return; const p = o.geometry.parameters; if (Math.abs(o.position.z - 0.27) < 0.005 && Math.abs(p.width - 0.592) < 0.002 && Math.abs(p.height - 0.78) < 0.002) rm.push(o); if (Math.abs(o.position.z - 0.29) < 0.005 && Math.abs(p.width - 0.24) < 0.002 && Math.abs(o.position.y - 0.8) < 0.01) rm.push(o); });
  rm.forEach(o => FIX.room.remove(o));
  DRW.forEach(d => {
    FIX.room.add(box(0.592, 0.6, 0.02, MAT.cabinet, d.x, 0.37, 0.27)); FIX.room.add(box(0.2, 0.012, 0.02, MAT.brushed, d.x, 0.6, 0.29));
    const g = new THREE.Group(); g.position.set(d.x, 0, 0); FIX.room.add(g); d.g = g;
    const front = box(0.592, 0.17, 0.022, MAT.cabinet, 0, 0.775, 0.281); g.add(front);
    const handle = box(0.24, 0.012, 0.02, MAT.brushed, 0, 0.79, 0.3); g.add(handle);
    const inner = new THREE.MeshStandardMaterial({ color: 0xe9e4dc, roughness: 0.7 });
    g.add(box(0.54, 0.01, 0.4, inner, 0, d.floor - 0.005, 0.07)); g.add(box(0.01, 0.1, 0.4, inner, -0.27, d.floor + 0.045, 0.07)); g.add(box(0.01, 0.1, 0.4, inner, 0.27, d.floor + 0.045, 0.07)); g.add(box(0.54, 0.1, 0.01, inner, 0, d.floor + 0.045, -0.13));
    tag(front, 'drawer' + d.i); tag(handle, 'drawer' + d.i);
  });
})();
function openDrawer(i) {
  DRW.forEach(d => { if (d.i !== i) d.tgt = 0; });
  const d = DRW[i]; d.tgt = d.tgt ? 0 : 1; sNoise(0.25, 500, 0.8, 0.35, 'lowpass'); sNoise(0.1, 2200, 2, 0.08, 'bandpass', 0.15);
  if (d.tgt) { if (view !== 'drawer') prevView = view === 'focus' ? 'counter' : view; view = 'drawer'; DRWV.i = i; ZOOM_BY_BUTTON.v = true; }
  else if (view === 'drawer') { view = 'counter'; ZOOM_BY_BUTTON.v = true; }
}
const DRWV = { i: 0 };
const _visibleD = visible3;
visible3 = function (it) { if (it.zone === 'drawer') return DRW[it.drawer] && DRW[it.drawer].open > 0.85; return _visibleD(it); };
const _support3D = support3;
support3 = function (it) {
  const s = _support3D(it);
  for (const d of DRW) { if (d.open < 0.85) continue; const z0 = drawerZ(d, -0.12), z1 = drawerZ(d, 0.26); if (Math.abs(it.p.x - d.x) < 0.25 && it.p.z > z0 - 0.05 && it.p.z < z1 + 0.05 && it.p.y < CT - 0.02 && it.p.y >= d.floor - 0.03) return { y: d.floor, zone: 'drawer', drawer: d.i, z: clamp(it.p.z, z0 + it.rad * 0.5, z1 - it.rad * 0.3) }; }
  return s;
};
const _settle3D = settle3;
settle3 = function (it) { const s = support3(it); it.landDrawer = s && s.drawer; _settle3D(it); };
const _land3D = land3;
land3 = function (it) { const dr = it.landZone === 'drawer' ? it.landDrawer : null; _land3D(it); if (dr != null && items.includes(it)) { it.drawer = dr; it.dz = it.p.z - DRW[dr].open * DRW[dr].slide; } };
const _pickCtrlD = pickCtrl;
pickCtrl = function (c) { const m = /^drawer(\d)$/.exec(c || ''); if (m) { openDrawer(+m[1]); return; } _pickCtrlD(c); };
const _cornerButtonsD = cornerButtons;
cornerButtons = function () { const b = _cornerButtonsD(); if (DRW.some(d => d.tgt)) b.unshift({ id: 'drawerClose', label: 'Close drawer' }); return b; };
const _cornerClickD = cornerClick;
cornerClick = function () { const h = BTN.hits.find(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1); if (h && h.id === 'drawerClose') { const d = DRW.find(d => d.tgt); if (d) openDrawer(d.i); return true; } return _cornerClickD(); };
const _updateCameraD = updateCamera;
updateCamera = function (dt) {
  if (view !== 'drawer') return _updateCameraD(dt);
  const d = DRW[DRWV.i], aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? 1.5 / aspect : 1;
  const tp = V3(d.x, 1.42, 0.55 + 0.75 * widen), tl = V3(d.x, d.floor, 0.5), tf = 46, k = 1 - Math.exp(-dt * 4.2);
  if (!camCur.pos) camCur.pos = tp.clone(); camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  viewT += clamp(0 - viewT, -dt * 1.6, dt * 1.6);
  const moving = camCur.pos.distanceTo(tp) > 0.01;
  if (held && moving && PT.has) { setRay(PT.x, PT.y); const it = held.it, hp = planeHit(V3(0, 0, 1), V3(0, 0, it.zTarget ?? held.cz)); if (hp) held.off.set(hp.x - it.p.x, hp.y - it.p.y, 0); }
};
const _sendHomeD = sendHome;
sendHome = function (it, msg) { _sendHomeD(it, msg); if (it.home && it.home.zone === 'drawer') { it.drawer = it.home.drawer; it.dz = it.home.dz; } };

/* ---------- rolling dough flat (and folding butter in) ---------- */
Dough3.prototype.update = function (dt) {
  const sub = 4, h = dt / sub, stick = this.sticky(), R = this.R(), fl = this.flat || 0;
  const ks0 = 0.05 + 0.05 * Math.min(1, this.m.knead), ks = this.grab ? 0.022 + 0.035 * Math.min(1, this.m.knead) : ks0 + fl * 0.05;
  const sxz = 1.12 * (1 + 0.9 * fl), tmp = V3(0, 0, 0);
  for (let s = 0; s < sub; s++) {
    for (const o of this.pts) { tmp.copy(o.p).sub(o.q).multiplyScalar(0.94); o.q.copy(o.p); o.p.add(tmp); o.p.y -= 9.8 * h * h; }
    const c = this.center(), sq = (this.grab ? 0.95 : 0.78) * (1 - 0.78 * fl);
    this.pts.forEach((o, i) => { const r = this.rest[i]; tmp.set(c.x + r.x * R * sxz, c.y + r.y * R * sq, c.z + r.z * R * sxz); o.p.lerp(tmp, ks); });
    if (this.grab) { const T = this.grab.target; this.pts.forEach((o, i) => { const w = this.grab.w[i]; if (w < 0.003) return; tmp.copy(this.grab.off[i]).multiplyScalar(0.85).add(T); o.p.lerp(tmp, w); }); }
    for (const o of this.pts) {
      if (o.p.y < this.floorY) { o.p.y = this.floorY; o.q.x = o.p.x - (o.p.x - o.q.x) * 0.25; o.q.z = o.p.z - (o.p.z - o.q.z) * 0.25; if (!o.stuck && stick > 0.12) o.stuck = V3(o.p.x, this.floorY, o.p.z); }
      if (o.stuck) {
        const up = o.p.y - this.floorY, lim = 0.004 + 0.035 * stick, side = Math.hypot(o.p.x - o.stuck.x, o.p.z - o.stuck.z);
        if (this.grab && up < lim && side < lim * 2.5) { o.p.y -= up * 0.5 * stick; o.p.x += (o.stuck.x - o.p.x) * 0.7 * stick; o.p.z += (o.stuck.z - o.p.z) * 0.7 * stick; }
        else if (up >= lim || side >= lim * 2.5) { if (this.grab) this.strands.push({ a: o.stuck.clone(), o, life: 1, max: 0.02 + 0.07 * stick }); o.stuck = null; }
        else if (!this.grab && up > 0.001) o.stuck = null;
      }
    }
  }
  this.strands = this.strands.filter(st => { st.life -= dt * 1.4; return st.life > 0 && st.a.distanceTo(st.o.p) < st.max; }).slice(-10);
  if (this.grab) { const c = this.center(); let D = 0; this.pts.forEach((o, i) => { const r = this.rest[i]; D += o.p.distanceTo(V3(c.x + r.x * R * sxz, c.y + r.y * R * 0.8, c.z + r.z * R * sxz)); }); D /= this.pts.length * R; if (this.pts.some(o => o.p.y < this.floorY + 0.002)) this.m.knead = Math.min(1.3, this.m.knead + Math.abs(D - this.lastD) * 0.09); this.lastD = D; }
  const c = this.center();
  for (const pa of patches) if (pa.amt > 0.5 && Math.hypot(pa.x - c.x, pa.z - c.z) < R * 1.5 * (1 + fl) && this.pts.some(o => o.p.y < this.floorY + 0.002)) { const take = Math.min(pa.amt, dt * 6); pa.amt -= take; this.m.add('flour', take * 0.6); this.dust = Math.min(1, this.dust + take * 0.04); addPatch3(pa.x, pa.z, 0); }
  const pa = this.geo.attributes.position; for (let i = 0; i < this.vmap.length; i++) { const o = this.pts[this.vmap[i]].p; pa.setXYZ(i, o.x, o.y, o.z); }
  pa.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  const mat = this.mesh.material; mat.color.setRGB(...mixc(this.lam ? [242, 226, 180] : [236, 220, 189], [252, 250, 245], this.dust * 0.7).map(v => v / 255)).convertSRGBToLinear(); mat.sheen = 0.3 + 0.6 * Math.min(1, this.m.knead); mat.roughness = 0.9 - 0.25 * Math.min(1, this.m.knead);
  this.strandMeshes.forEach((s, i) => { const st = this.strands[i]; if (!st) { s.visible = false; return; } const a = st.a, b = st.o.p, d = a.distanceTo(b), t = 1 - d / st.max; s.visible = true; s.position.copy(a).add(b).multiplyScalar(0.5); s.scale.set(Math.max(0.0005, 0.003 * t * st.life), d, Math.max(0.0005, 0.003 * t * st.life)); s.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); });
};
function doughUnder(p, pad = 0) { let best = null; for (const dg of doughs) { if (dg === heldDough) continue; const c = dg.center(), R = dg.R() * (1 + 0.9 * (dg.flat || 0)); const dd = Math.hypot(p.x - c.x, (p.z - c.z) * (viewT < 0.5 ? 0.15 : 1)); if (dd < R * 1.3 + pad && p.y > c.y - 0.05) best = dg; } return best; }

/* ---------- pastry tools ---------- */
const _tool3P = tool3;
tool3 = function (it, dt) {
  const d = DEF[it.kind];
  const mv = Math.hypot(it.p.x - (it.lx ?? it.p.x), it.p.z - (it.lz ?? it.p.z), (it.p.y - (it.ly ?? it.p.y)) * 0.4);
  it.dipY = null; let done = false;
  if (d.roll) {
    const dg = doughUnder(it.p, 0.05);
    if (dg) {
      const c = dg.center(); it.zTarget = c.z; it.dipY = dg.floorY + 0.012 + 0.02 * (1 - (dg.flat || 0)); done = true;
      if (it.p.y < it.dipY + 0.02) {
        const slow = dg.sticky() > 0.55 && dg.dust < 0.2 ? 0.35 : 1; if (slow < 1) hintOnce('pinstick', 'It’s sticking to the pin. Dust the counter with flour.');
        dg.flat = Math.min(1, (dg.flat || 0) + mv * 1.6 * slow); if (Math.random() < mv * 6) sNoise(0.08, 400, 1, 0.12, 'lowpass');
        if (dg.flat >= 1 && dg.lam) { dg.turns = (dg.turns || 0) + 1; dg.flat = 0.3; SFX.plop(); say(dg.turns >= 3 ? 'Third fold done. Cut it with the bread knife!' : `Folded (${dg.turns} of 3). Roll it out again.`, 2.5); }
      }
    }
  } else if (d.lame) {
    const r = recv3().find(r => r.m && ['dough', 'shaggy'].includes(r.m.form()) && inOpen(opening3(r), it.p.x, it.p.z, 0.01));
    if (r) { const o = opening3(r); it.zTarget = r.p.z; it.dipY = Math.max(o.surf, o.bot) + 0.02; done = true; if (it.p.y < it.dipY + 0.015) { r.score = (r.score || 0) + mv; if (Math.random() < mv * 10) sNoise(0.05, 3200, 3, 0.15); if (r.score > 0.06 && !r.scored) { r.scored = true; SFX.scrape(); say('Scored. It’ll open up in the oven.', 2); } } }
  } else if (d.brush) {
    const bowl = recv3().find(r => r.m && (r.m.g.egg || 0) > 5 && r.m.total() < 400 && inOpen(opening3(r), it.p.x, it.p.z, 0));
    if (bowl) { const o = opening3(bowl); it.zTarget = bowl.p.z; it.dipY = o.surf - 0.005; done = true; if (it.p.y < o.surf + 0.005 && it.m.total() < 4) { it.m.merge(bowl.m.take(4 / bowl.m.total())); SFX.scrape(); } }
    else if (it.m.total() > 0.5) {
      const pan = items.find(t => t.zone !== 'held' && (t.kind === 'tray' || t.kind === 'pie' || t.kind === 'dutch' || t.kind === 'loaf') && !t.bake && ((t.balls && t.balls.length) || (t.m && t.m.total() > 50)) && inOpen(opening3(t), it.p.x, it.p.z, 0.02));
      if (pan) { const o = opening3(pan); it.zTarget = pan.p.z; it.dipY = Math.max(o.surf, o.top) + 0.03; done = true; if (it.p.y < it.dipY + 0.02) { pan.wash = (pan.wash || 0) + mv; it.m.take(Math.min(1, mv * 2)); if (pan.wash > 0.15 && !pan.washed) { pan.washed = true; say('Brushed with egg for a glossy crust.', 2); } } }
    }
    if (it.parts.bristle) it.parts.bristle.material.color.setHex(it.m.total() > 0.5 ? 0xf2c14e : 0xe9dcc0);
  } else if (d.knife) {
    const dg = doughUnder(it.p, 0.05);
    if (dg && dg.lam) {
      const c = dg.center(); it.zTarget = c.z; it.dipY = dg.floorY + 0.01; done = true;
      if (it.p.y < dg.floorY + 0.04) { dg.cut = (dg.cut || 0) + mv; if (Math.random() < mv * 8) sNoise(0.05, 1800, 3, 0.15);
        if (dg.cut > 0.1) {
          if ((dg.turns || 0) < 3) { hintOnce('turns', 'Roll and fold it 3 times before cutting.'); dg.cut = 0; }
          else { const tray = items.find(t => t.kind === 'tray' && t.zone !== 'held' && visible3(t) && !t.balls.length && !(t.m && t.m.total() > 1));
            if (!tray) { hintOnce('needtray', 'Put the empty baking tray on the counter first.'); dg.cut = 0; }
            else { const n = 8, m = dg.m; dg.m.turns = dg.turns; for (let i = 0; i < n; i++) { const part = m.take(1 / (n - i)); part.turns = dg.turns; placeBall3(tray, tray.p, part); tray.balls[tray.balls.length - 1].shape = 'croissant'; } tray.turns = dg.turns; dg.dispose(); doughs = doughs.filter(x => x !== dg); SFX.plop(); say('Cut and rolled into 8 croissants.', 2.5); }
          }
        }
      }
    }
  }
  if (done) { it.lx = it.p.x; it.ly = it.p.y; it.lz = it.p.z; it.useStep = curStep(); return; }
  _tool3P(it, dt);
};
// butter on the dough = laminated pastry
const _release3P = release3;
release3 = function () {
  const it = held && held.it;
  if (it && it.kind === 'butterPiece') { const dg = doughUnder(it.p, 0.02); if (dg) { held = null; dg.lam = (dg.lam || 0) + it.g; dg.m.add('butter', it.g); remove3(it); SFX.plop(); say('Butter on the dough. Now roll it out with the rolling pin.', 3); return; } }
  _release3P();
};
// pastry for pies can be pulled out of the bowl too
const _grab3P = grab3;
grab3 = function (hit) {
  const it = hit.it;
  if (recipe && recipe.roll && it && it.m && DEF[it.kind].recv && it.m.total() > 50 && !it.bake && ['cookie', 'dough'].includes(it.m.form()) && !(it.m.g.chips > 0)) {
    const o = opening3(it); setRay(PT.x, PT.y); const sp = planeHit(V3(0, 1, 0), V3(0, o.surf, 0));
    if (sp && Math.hypot(sp.x - o.c.x, sp.z - o.c.z) < o.r * 0.9) { const m = it.m; it.m = new Mix(); const dg = new Dough3(V3(o.c.x, o.surf + 0.03, o.c.z), m); doughs.push(dg); grabDough(dg, sp); sNoise(0.2, 500, 1, 0.3, 'lowpass'); return; }
  }
  _grab3P(hit);
};
const _releaseDoughP = releaseDough3;
releaseDough3 = function (dg) { const c = dg.center(), r = recvUnder(c.x, c.y + 0.05, c.z, 0.3, null, 0.02), flat = dg.flat || 0; _releaseDoughP(dg); if (r && r.kind === 'pie' && !doughs.includes(dg)) { r.crustFlat = Math.max(r.crustFlat || 0, flat); if (flat < 0.8) say('Pressed in, but it’s thick. Rolling it flat first makes a better crust.', 3); else say('Pastry lined into the pie dish.', 2); } };

/* ---------- openings, rendering & baking for the new pans ---------- */
const _opening3P = opening3;
opening3 = function (r) {
  if (RECT[r.kind]) { const R = RECT[r.kind], f = clamp(r.m.vol() / R.cap, 0, 1); return { c: V3(r.p.x, r.p.y + R.h, r.p.z), rx: R.rx, rz: R.rz, r: Math.min(R.rx, R.rz), top: r.p.y + R.h, surf: r.p.y + 0.004 + f * R.h, bot: r.p.y + 0.002 }; }
  return _opening3P(r);
};
const _syncItemP = syncItem;
syncItem = function (it) {
  if (it.zone === 'drawer' && DRW[it.drawer] && !it.flyHome) { const d = DRW[it.drawer]; it.p.z = (it.dz ?? 0) + d.open * d.slide; it.p.y = d.floor; }
  _syncItemP(it);
  const P = it.parts || {};
  if (it.kind === 'drawerItem') return;
  if ((it.kind === 'pin' || it.kind === 'lame' && false) && (it.pose === 'held' || it.pose === 'lie')) it.root.rotation.set(0, 0, -Math.PI / 2);
  if (it.zone === 'drawer' && DEF[it.kind].tool) it.root.rotation.set(0, 0, it.kind === 'pin' ? -Math.PI / 2 : Math.PI / 2);
  if (P.cups && it.m) {
    const f = clamp(it.m.vol() / RECT[it.kind].cap, 0, 1), bk = it.bake, col = new THREE.Color(rgb(bk && bk.brown > 0.02 ? crustColor(bk.brown * (it.kind === 'canele' ? 0.75 : 1), it.m.color()) : it.m.color()));
    P.cups.forEach(m => { m.visible = f > 0.01; m.material.color = col; m.material.map = TX.speck; if (it.kind === 'madeleine') m.scale.y = 0.002 + f * 0.012 * (1 + (bk ? 0.6 * sstep(0.1, 0.6, bk.b) : 0)); else m.position.y = 0.006 + f * 0.04 + (bk ? 0.006 * sstep(0.1, 0.6, bk.b) : 0); });
  }
  if (it.kind === 'pie' && P.crust) { const has = it.m && (it.m.g.flour || 0) > 40; P.crust.visible = has; if (has) { P.crust.material.color = new THREE.Color(rgb(it.bake && it.bake.brown > 0.02 ? crustColor(it.bake.brown, [236, 220, 189]) : [236, 220, 189])); P.crust.scale.setScalar(1); } }
  if (it.kind === 'tray' && P.balls) it.balls.forEach((b, i) => { const ms = P.balls.children[i]; if (!ms || b.shape !== 'croissant') return; if (ms.geometry !== CRESCENT) ms.geometry = CRESCENT; const pr = Math.min(1.5, b.m.proof || 0), s = 0.016 * (1 + pr * 0.35) * (it.bake ? 1 + 0.25 * sstep(0, 0.5, it.bake.b) : 1); ms.scale.set(s * 1.2, s * 0.9, s * 1.2); ms.position.y = 0.006 + s * 0.3; ms.material.map = TX.speck; });
};
const _bakeStepP = bakeStep;
bakeStep = function (it, dtMin) {
  if (!it.bake && OV.temp >= 60 && it.m && it.m.total() > 20) {
    const R0 = recipe, mk = (type, temp, time) => ({ type, b: 0, brown: 0, rise: 0, spread: 0.3, ideal: R0 && R0.product === type ? R0.temp : temp, time: R0 && R0.product === type ? R0.time : time, tsum: 0, ttime: 0 });
    if (it.kind === 'pie') it.bake = mk('pie', 200, 35);
    else if (it.kind === 'madeleine') it.bake = mk('madeleine', 190, 11);
    else if (it.kind === 'canele') it.bake = mk('canele', 220, 50);
  }
  if (it.kind === 'tray' && !it.bake && it.balls && it.balls.some(b => b.shape === 'croissant') && OV.temp >= 60) { const R0 = recipe; it.bake = { type: 'croissant', b: 0, brown: 0, rise: 0, spread: 0.1, ideal: R0 && R0.product === 'croissant' ? R0.temp : 200, time: R0 && R0.product === 'croissant' ? R0.time : 18, tsum: 0, ttime: 0 }; }
  _bakeStepP(it, dtMin);
};
// turning the new pans out
const _turnOutP = turnOut;
turnOut = function (pan, tgt) {
  const map = { pie: 'pie', dutch: 'boule', madeleine: 'madeleines', canele: 'caneles' };
  if (!map[pan.kind]) return _turnOutP(pan, tgt);
  const pos = tgt.h ? V3(tgt.h.p.x, hostTop(tgt.h), tgt.h.p.z) : V3(pan.p.x, CT, clamp(pan.p.z, -0.2, 0.2));
  const b = mkBake(map[pan.kind], pan, pos, tgt.h || null);
  b.scored = pan.scored; b.washed = pan.washed; b.crustFlat = pan.crustFlat; b.temp = pan.temp;
  pan.m = new Mix(); pan.bake = null; pan.scored = false; pan.washed = false; pan.crustFlat = 0; pan.wash = 0; pan.score = 0;
  SFX.thunk(0.8); say('Turned out.', 1.8);
};
const _bakeDimsP = bakeDims;
bakeDims = function (b) {
  if (b.shape === 'pie') return { rx: 0.12, rz: 0.12, h: 0.045 };
  if (b.shape === 'boule') return { rx: 0.11, rz: 0.11, h: clamp(0.06 + Math.min(1.8, b.m.proof) * 0.02 + b.bake.rise * 0.05, 0.06, 0.12) };
  if (b.shape === 'madeleines') return { rx: 0.13, rz: 0.09, h: 0.02 };
  if (b.shape === 'caneles') return { rx: 0.1, rz: 0.07, h: 0.05 };
  return _bakeDimsP(b);
};
const _rebuildBakeP = rebuildBake;
rebuildBake = function (b) {
  if (!['pie', 'boule', 'madeleines', 'caneles'].includes(b.shape)) { _rebuildBakeP(b); if (b.shape === 'cookies' && b.balls && b.balls.some(x => x.shape === 'croissant')) b.model.children.forEach(m => { if (m.isMesh && m.geometry.type === 'SphereGeometry') { m.geometry = CRESCENT; m.scale.multiplyScalar(1.15); } }); return; }
  const g = b.model; for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i] !== b.decoG) g.remove(g.children[i]);
  const bk = b.bake, d = b.dims, crust = crustColor(bk.brown * (b.shape === 'caneles' ? 0.75 : 1), b.m.color()), crustM = stdMat(crust, TX.speck, b.washed ? 0.45 : 0.8);
  const tagM = m => { m.traverse(o => { if (o.isMesh) o.userData.item = b; }); g.add(m); return m; };
  if (b.shape === 'pie') {
    tagM(mesh(new THREE.CylinderGeometry(0.115, 0.095, 0.04, 40), crustM, 0, 0.02, 0));
    const fill = mesh(new THREE.CircleGeometry(0.1, 40), stdMat(mixc([120, 28, 58], crust, 0.15), null, 0.35), 0, 0.041, 0); fill.rotation.x = -Math.PI / 2; tagM(fill);
    for (let i = -2; i <= 2; i++) { tagM(box(0.2 * Math.cos(Math.asin(Math.min(0.95, Math.abs(i) * 0.4))), 0.006, 0.014, crustM, 0, 0.044, i * 0.04)); const s = box(0.014, 0.006, 0.2 * Math.cos(Math.asin(Math.min(0.95, Math.abs(i) * 0.4))), crustM, i * 0.04, 0.047, 0); tagM(s); }
    const rim = mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 40), crustM, 0, 0.042, 0); rim.rotation.x = Math.PI / 2; tagM(rim);
    b.topY = 0.05;
  } else if (b.shape === 'boule') {
    const s = mesh(new THREE.SphereGeometry(1, 40, 24, 0, TAU, 0, Math.PI / 2), crustM, 0, 0, 0); s.scale.set(d.rx, d.h, d.rx); tagM(s);
    if (b.scored) { const ear = stdMat(mixc(crust, [240, 220, 180], 0.45), TX.speck, 0.9); for (let k = 0; k < 2; k++) { const sc = box(0.14, 0.004, 0.012, ear, 0, d.h * 0.93, -0.02 + k * 0.04); sc.rotation.y = 0.35 - k * 0.7; tagM(sc); } }
    else { const crack = box(0.05, 0.02, 0.01, stdMat(mixc(crust, [240, 220, 180], 0.4), null, 0.9), d.rx * 0.8, d.h * 0.35, 0); crack.rotation.z = 0.6; tagM(crack); }
    b.topY = d.h;
  } else if (b.shape === 'madeleines') {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const m = mesh(new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI / 2), crustM, -0.09 + c * 0.06 + (r % 2) * 0.01, 0, -0.06 + r * 0.06); m.scale.set(0.022, 0.014, 0.03); m.rotation.y = (r + c) * 0.4; tagM(m); }
    b.topY = 0.015;
  } else if (b.shape === 'caneles') {
    const top = stdMat(mixc(crust, [30, 18, 10], 0.25), TX.speck, 0.5);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) tagM(mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.048, 12), [crustM, top, crustM], -0.065 + c * 0.065, 0.024, -0.035 + r * 0.07));
    b.topY = 0.05;
  }
  b.builtSig = rebuildSig(b);
};

/* ---------- rising: sourdough starter and croissants on the tray ---------- */
const _tickP = tick3;
tick3 = function (dt) {
  _tickP(dt);
  DRW.forEach(d => { d.open += clamp(d.tgt - d.open, -dt * 2.6, dt * 2.6); d.g.position.z = d.open * d.slide; });
  if (view === 'drawer' && !DRW[DRWV.i].tgt && DRW[DRWV.i].open < 0.05) view = 'counter';
  // reach into open drawers while carrying something
  if (held) { for (const d of DRW) if (d.open > 0.85 && Math.abs(held.it.p.x - d.x) < 0.27 && held.it.p.y < CT - 0.01) held.it.zTarget = drawerZ(d, 0.07); }
  const dtMin = dt * CLOCK.mult / 60;
  for (const it of [...items, ...doughs]) {
    const m = it.kind === 'tray' ? null : it.m;
    if (m && (m.g.starter || 0) > 0 && m.form() === 'dough' && m.mix > 0.6 && it.temp < 50 && !it.bake) { const sf = clamp(((m.g.starter || 0) / (m.g.flour || 1)) / 0.2, 0, 1.5); m.proof += sf / 120 * dtMin * (it.zone === 'fridge' ? 0.1 : it.kind === 'banneton' ? 1.15 : 1); }
    if (it.kind === 'tray' && it.balls && !it.bake) it.balls.forEach(b => { if (b.shape === 'croissant' && (b.m.g.yeast || 0) > 0) b.m.proof = Math.min(2, (b.m.proof || 0) + clamp((b.m.g.yeast / (b.m.g.flour || 1)) / 0.02, 0, 1.5) / 40 * dtMin); });
  }
};
const _actionBarsP = actionBars;
actionBars = function () {
  const r = _actionBarsP();
  if (held) { const it = held.it, d = DEF[it.kind]; if (d.roll) { const dg = doughUnder(it.p, 0.05); if (dg) r.cur.push(dg.lam ? { label: `Rolling · fold ${Math.min(3, (dg.turns || 0) + 1)} of 3`, v: dg.flat || 0, t: 1 } : { label: 'Rolling flat', v: dg.flat || 0, t: 0.9 }); } if (d.knife) { const dg = doughUnder(it.p, 0.05); if (dg && dg.lam) r.cur.push({ label: 'Cutting croissants', v: dg.cut || 0, t: 0.1 }); } if (d.lame) { const t = recv3().find(t => t.score > 0 && !t.scored); if (t) r.cur.push({ label: 'Scoring', v: t.score, t: 0.06 }); } }
  for (const t of items) if (t.kind === 'tray' && t.balls && t.balls.some(b => b.shape === 'croissant') && !t.bake && t.zone !== 'held') { const pr = t.balls.reduce((s, b) => s + (b.m.proof || 0), 0) / t.balls.length; r.world.push({ label: 'Rising', v: pr, t: 1, max: 1.6, win: true, at: t.p.clone().add(V3(0, 0.08, 0)) }); }
  return r;
};

/* ---------- judging the new bakes ---------- */
const _judgeP = judge;
judge = function (it) {
  const dark = it.bake && (it.bake.type === 'canele');
  if (dark) it.bake.brown *= 0.7;
  _judgeP(it);
  if (dark) it.bake.brown /= 0.7;
  if (!scorecard) return;
  const g = [], n = [], t = it.bake && it.bake.type;
  if (t === 'croissant') { const turns = it.balls && it.balls[0] && it.balls[0].m.turns || (it.m && it.m.turns) || 0; if (turns >= 3) g.push('Flaky layers from three folds.'); else n.push('Not enough folds, so there are no flaky layers.'); const pr = it.m.proof || 0; if (pr < 0.6) n.push('They didn’t rise long enough before baking.'); else if (pr > 1.6) n.push('Over-proofed: they lost their shape.'); }
  if (t === 'pie') { if ((it.crustFlat || 0) >= 0.8) g.push('A thin, crisp crust.'); else n.push('A thick, lumpy crust. Roll the pastry flat first.'); }
  if (t === 'bread' && it.shape === 'boule') { if (it.scored) g.push('Scored nicely, with a proud ear.'); else n.push('Not scored, so it burst at the side.'); }
  if (t === 'canele') { if (it.bake.brown >= 1.25 && it.bake.brown <= 2.1) g.push('Deep caramelised crust, custardy inside.'); else if (it.bake.brown < 1.25) n.push('Too pale. Canelés need a dark, caramelised crust.'); }
  if (it.washed) g.push('Glossy egg-washed crust.');
  if (g.length || n.length) { scorecard.good = [...g, ...scorecard.good].slice(0, 4); scorecard.notes = [...n, ...scorecard.notes].slice(0, 4); scorecard.stars = clamp(scorecard.stars + g.length * 0.25 - n.length * 0.5, 0.5, 5); scorecard.stars = Math.round(scorecard.stars * 2) / 2; }
};

/* ---------- recipes ---------- */
const PASTRY = [
  { id: 'croissant', name: 'Butter Croissants', country: 'France', kind: 'hot', level: 3, product: 'croissant', pan: 'tray', temp: 200, time: 18, ing: { flour: 250, milk: 140, sugar: 30, yeast: 5, salt: 5, butter: 150 }, blurb: 'Fold butter into yeasted dough three times for flaky layers.', roll: false,
    steps: [
      { t: 'Mix flour, milk, sugar, yeast and salt into a dough.', c: () => anyMix(m => (m.g.flour || 0) > 150 && (m.g.yeast || 0) > 2 && m.mix > 0.6 && !(m.g.butter > 60)) },
      { t: 'Pull the dough onto a floured counter and set 150 g of butter on it.', c: () => doughs.some(d => (d.lam || 0) >= 100) || items.some(t => t.balls && t.balls.some(b => b.shape === 'croissant')) },
      { t: 'Roll it out with the rolling pin (from the drawer) and fold, 3 times.', c: () => doughs.some(d => (d.turns || 0) >= 3) || items.some(t => t.balls && t.balls.some(b => b.shape === 'croissant')) },
      { t: 'Put the empty tray on the counter and cut the dough with the bread knife.', c: () => items.some(t => t.kind === 'tray' && t.balls.some(b => b.shape === 'croissant')) || bakesOf('cookies').length > 0 },
      { t: 'Let them rise, then brush them with beaten egg.', c: () => items.some(t => t.kind === 'tray' && t.balls.length && t.balls.reduce((s, b) => s + (b.m.proof || 0), 0) / t.balls.length > 0.8) || bakesOf('cookies').length > 0 },
      { t: 'Preheat the oven to 200 °C.', c: () => near(OV.set, 200, 10) },
      { t: 'Bake for about 18 minutes.', c: () => items.some(t => t.kind === 'tray' && t.bake && t.bake.b > 0.9) || bakesOf('cookies').length > 0 },
      { t: 'Cool, then tip them onto a plate.', c: () => bakesOf('cookies').some(b => b.host && b.host.kind.startsWith('plate')) },
      { t: 'Ring the bell to serve.', c: () => !!scorecard }] },
  { id: 'pie', name: 'Mixed Berry Pie', country: 'United States', kind: 'hot', level: 3, product: 'pie', pan: 'pie', temp: 200, time: 35, roll: true, ing: { flour: 250, butter: 150, water: 60, salt: 3, berries: 300, sugar: 60 }, blurb: 'Roll out buttery pastry, fill with berries, bake till bubbling.',
    steps: [
      { t: 'Rub the flour, butter, salt and water into a pastry dough.', c: () => anyMix(m => (m.g.flour || 0) > 150 && (m.g.butter || 0) > 90 && (m.g.water || 0) > 30 && m.mix > 0.7) },
      { t: 'Pull the pastry onto a floured counter and roll it flat with the rolling pin.', c: () => doughs.some(d => (d.flat || 0) >= 0.9) || items.some(p => p.kind === 'pie' && (p.crustFlat || 0) >= 0.8) },
      { t: 'Lift it into the pie dish (in a drawer).', c: () => items.some(p => p.kind === 'pie' && (p.m.g.flour || 0) > 100) || bakesOf('pie').length > 0 },
      { t: 'Pour in the frozen berries and sugar.', c: () => items.some(p => p.kind === 'pie' && (p.m.g.berries || 0) > 200) || bakesOf('pie').length > 0 },
      { t: 'Brush the crust with beaten egg (optional).', c: () => items.some(p => p.kind === 'pie' && p.washed) || bakesOf('pie').length > 0 },
      { t: 'Preheat the oven to 200 °C.', c: () => near(OV.set, 200, 10) },
      { t: 'Bake for about 35 minutes.', c: () => items.some(p => p.kind === 'pie' && p.bake && p.bake.b > 0.9) || bakesOf('pie').length > 0 },
      { t: 'Cool it, then turn it out onto a plate.', c: () => bakesOf('pie').some(b => b.host && b.host.kind.startsWith('plate')) },
      { t: 'Ring the bell to serve.', c: () => !!scorecard }] },
  { id: 'sourdough', name: 'Sourdough Boule', country: 'France', kind: 'hot', level: 3, product: 'bread', pan: 'dutch', temp: 240, time: 40, ing: { flour: 500, water: 350, starter: 100, salt: 10 }, blurb: 'Slow-risen with starter, baked in a Dutch oven, scored for an ear.',
    steps: [
      { t: 'Mix flour, water, starter (fridge) and salt into a dough.', c: () => anyMix(m => (m.g.flour || 0) > 300 && (m.g.starter || 0) > 50 && m.mix > 0.6) },
      { t: 'Knead until smooth and stretchy.', c: () => anyMix(m => (m.g.starter || 0) > 50 && m.knead > 0.75) },
      { t: 'Let it rise in the banneton (in a drawer) until doubled.', c: () => items.some(b => b.kind === 'banneton' && b.m.proof > 0.8) || items.some(d => d.kind === 'dutch' && (d.m.g.starter || 0) > 0) || bakesOf('boule').length > 0 },
      { t: 'Preheat the oven to 240 °C.', c: () => near(OV.set, 240, 10) },
      { t: 'Tip the dough from the banneton into the Dutch oven.', c: () => items.some(d => d.kind === 'dutch' && (d.m.g.flour || 0) > 300) || bakesOf('boule').length > 0 },
      { t: 'Score the top with the lame.', c: () => items.some(d => d.kind === 'dutch' && d.scored) || bakesOf('boule').some(b => b.scored) },
      { t: 'Bake for about 40 minutes.', c: () => items.some(d => d.kind === 'dutch' && d.bake && d.bake.b > 0.9) || bakesOf('boule').length > 0 },
      { t: 'Cool it, then turn it out onto the board.', c: () => bakesOf('boule').length > 0 },
      { t: 'Set it on a plate and ring the bell.', c: () => !!scorecard }] },
  { id: 'madeleines', name: 'Madeleines', country: 'France', kind: 'hot', level: 2, product: 'madeleine', pan: 'madeleine', whip: false, temp: 190, time: 11, ing: { egg: 100, sugar: 100, flour: 100, butter: 100, bp: 4, honey: 10 }, blurb: 'Shell-shaped little sponges with a signature hump.', deco: 'a dusting of icing sugar' },
  { id: 'caneles', name: 'Canelés', country: 'France', kind: 'hot', level: 3, product: 'canele', pan: 'canele', whip: false, temp: 220, time: 50, ing: { milk: 250, sugar: 120, egg: 50, flour: 50, butter: 25 }, blurb: 'Custardy inside, deeply caramelised outside. Bake them dark.' },
];
PASTRY.forEach(R => {
  R.lines = Object.entries(R.ing).map(([k, v]) => k === 'egg' ? `${Math.round(v / 50)} egg${v > 50 ? 's' : ''}` : `${v} g ${ING[k].n}`);
  if (!R.steps) { const tmp = Object.assign({}, R, { product: 'cake' }); R.steps = genSteps(tmp); R.steps[3].c = () => items.some(i => i.kind === R.pan && i.m && i.m.total() > 150) || bakesOf().length > 0; R.steps[4].c = () => items.some(i => i.kind === R.pan && i.bake && i.bake.b > 0.9) || bakesOf().length > 0; }
  RECIPES.push(R);
});
const _recipeIconP = recipeIcon;
recipeIcon = function (p) {
  if (p === 'croissant') { ctx.fillStyle = '#d39a4a'; ctx.beginPath(); ctx.arc(0, 6, 22, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(0, 6, 10, Math.PI * 1.9, Math.PI * 1.1, true); ctx.fill(); ctx.strokeStyle = '#a8662c'; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 6, -8); ctx.lineTo(i * 4, -2); ctx.stroke(); } return; }
  if (p === 'pie') { ctx.fillStyle = '#c98b48'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a1c3a'; ctx.beginPath(); ctx.ellipse(0, -1, 20, 8, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e0b070'; ctx.lineWidth = 3; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 4, -8); ctx.lineTo(i * 8 + 4, 6); ctx.stroke(); } return; }
  if (p === 'madeleine') { ctx.fillStyle = '#d9a35b'; [[-12, 0], [12, 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y, 10, 14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b07a3a'; for (let s = -2; s <= 2; s++) { ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + s * 3.5, y - 12); ctx.stroke(); } }); return; }
  if (p === 'canele') { ctx.fillStyle = '#6a3214'; [-14, 0, 14].forEach(x => { ctx.fillRect(x - 6, -10, 12, 22); ctx.fillStyle = '#8a4a20'; ctx.fillRect(x - 6, -12, 12, 4); ctx.fillStyle = '#6a3214'; }); return; }
  if (p === 'bread') { _recipeIconP(p); return; }
  _recipeIconP(p);
};
// hints for the new steps
HINTS.unshift(
  [/rolling pin/i, ['pin', 'flour'], 'Open a drawer for the rolling pin. Move it back and forth over the dough on a floured counter.'],
  [/score/i, ['lame'], 'Take the lame from a drawer and draw it across the dough in the pot.'],
  [/brush/i, ['brush', 'bowl'], 'Crack an egg into the small bowl, dip the pastry brush, then brush over the pastry.'],
  [/banneton|dutch oven|pie dish|drawer/i, ['drawer', 'bowl'], 'Click a drawer front under the counter to open it. The pans and tools are inside.'],
  [/set 150 g of butter/i, ['hand', 'flour'], 'Grab the dough out of the bowl onto floured counter, cut 150 g of butter in the fridge and drop it on the dough.'],
  [/cut the dough/i, ['tray', 'knife'], 'Put the empty tray on the counter, then saw the bread knife across the folded dough.']);
const _toolIconP = toolIcon;
toolIcon = function (k) {
  ctx.strokeStyle = '#3a3a5a'; ctx.fillStyle = '#3a3a5a'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  if (k === 'pin') { ctx.strokeRect(-6, -3, 12, 6); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-6, 0); ctx.moveTo(6, 0); ctx.lineTo(10, 0); ctx.stroke(); return; }
  if (k === 'lame') { ctx.beginPath(); ctx.moveTo(-9, 6); ctx.lineTo(4, -3); ctx.stroke(); ctx.strokeRect(3, -7, 7, 5); return; }
  if (k === 'brush') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillRect(-4, 0, 8, 8); return; }
  if (k === 'drawer') { ctx.strokeRect(-9, -6, 18, 12); ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke(); return; }
  _toolIconP(k);
};

/* ---------- hover text & put the new things in place ---------- */
const _hoverP = hover3;
hover3 = function () {
  if (!held && !heldDough && !drag && PT.has && !BOOK.open) {
    const h = pick3(PT.x, PT.y);
    if (h && h.ctrl && /^drawer\d$/.test(h.ctrl)) { const i = +h.ctrl.slice(6); const names = ['rolling pin, pastry brush, lame', 'pie dish, banneton', 'madeleine pan, canelé molds', 'Dutch oven']; return `${DRW[i].tgt ? 'Close' : 'Open'} drawer · ${names[i]}`; }
    if (h && h.dough) { const d = h.dough; if (d.lam) return `Laminated dough · fold ${d.turns || 0} of 3`; if ((d.flat || 0) > 0.2) return `Pastry · rolled ${Math.round(Math.min(1, d.flat / 0.9) * 100)}%`; }
    if (h && h.it && (h.it.kind === 'dutch' || h.it.kind === 'banneton') && h.it.m && h.it.m.total() > 50) return `${DEF[h.it.kind].name} · ${h.it.m.describe()}${h.it.scored ? ' · scored' : ''}`;
  }
  return _hoverP();
};
const _build3P = build3;
build3 = function () {
  DRW.forEach(d => { d.open = 0; d.tgt = 0; });
  _build3P();
  const put = (kind, di, x, z, extra) => { const d = DRW[di], it = mk3(kind, d.x + x, d.floor, z, 'drawer', extra); it.drawer = di; it.dz = z; it.home = { p: it.p.clone(), zone: 'drawer', drawer: di, dz: z }; if (DEF[kind].tool) it.pose = 'lie'; return it; };
  put('pin', 0, 0.0, -0.06); put('brush', 0, -0.12, 0.14); put('lame', 0, 0.12, 0.14);
  put('pie', 1, -0.12, 0.07); put('banneton', 1, 0.13, 0.07);
  put('madeleine', 2, 0, -0.05); put('canele', 2, 0, 0.15);
  put('dutch', 3, 0, 0.07);
  mk3('starter', -1.38, FRG.shelves[1], 0.02, 'fridge');
  mk3('berries', -1.55, 0.31, 0.04, 'fridge');
  items.filter(i => i.kind === 'brush').forEach(i => i.m = new Mix());
};
if (!FRG.shelves.includes(0.31)) FRG.shelves.push(0.31);
// tools that live in drawers lie flat in there
const _syncFixedP = syncFixed;
syncFixed = function () { _syncFixedP(); };
build3();
