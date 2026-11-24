'use strict';
/* =========================================================
   3D play: items, carrying, pouring, cracking, stirring, dough,
   simulation, camera views and the overlay UI
   ========================================================= */
const UI = cv; // 2D overlay canvas (#c)
let uiW = 0, uiH = 0, uiDPR = 1;
let view = 'counter', viewT = 0, povX = 0;
const ray = new THREE.Raycaster();
const PT = { x: 0, y: 0, down: false, vx: 0, vy: 0, speed: 0, lx: 0, ly: 0, has: false };
const VIEWS = {
  counter: { pos: V3(0.0, 1.52, 3.05), look: V3(0.0, 1.1, -0.1), fov: 44 },
  pov: { pos: V3(0, 1.62, 0.5), look: V3(0, 0.88, -0.06), fov: 60 },
};
const MITT_WORN = { v: false };

/* ---------- items ---------- */
function mk3(kind, x, y, z, zone, extra) {
  const d = DEF[kind] || {}, sp = SPEC[kind];
  const it = Object.assign({ id: uid++, kind, p: V3(x, y, z), zone, tilt: 0, temp: 22, touched: touchN++, home: { p: V3(x, y, z), zone }, rad: sp.rad, h: sp.h }, extra || {});
  if (d.cont) it.m = new Mix();
  if (d.stock) it.stock = d.stock;
  if (kind === 'tray') it.balls = [];
  it.root = new THREE.Group(); it.pivot = new THREE.Group(); it.pivot.position.y = it.h / 2; it.model = buildItemModel(it); it.model.position.y = -it.h / 2;
  it.pivot.add(it.model); it.root.add(it.pivot); scene.add(it.root);
  items.push(it); return it;
}
function remove3(it) { items = items.filter(i => i !== it); scene.remove(it.root); }
function hang3(it, slot) { it.pose = 'hang'; it.zone = 'rail'; it.slot = slot; it.p.set(RAIL.slots[slot], RAIL.y + 0.012 - it.h, RAIL.z + 0.016); }
function build3() {
  items.forEach(i => scene.remove(i.root)); doughs.forEach(d => d.dispose());
  items = []; doughs = []; parts = []; cracks.forEach(c => scene.remove(c.g)); cracks = []; decals.forEach(d => scene.remove(d.mesh)); decals = []; patches.forEach(p => scene.remove(p.mesh)); patches = [];
  held = null; heldDough = null; drag = null; judged = new Set();
  mk3('tin', -1.02, SHELVES[1], SHZ, 'shelf'); mk3('loaf', -0.74, SHELVES[1], SHZ, 'shelf'); mk3('tray', -0.39, SHELVES[1], SHZ, 'shelf');
  mk3('flour', -1.06, SHELVES[0], SHZ, 'shelf'); mk3('sugar', -0.9, SHELVES[0], SHZ, 'shelf'); mk3('salt', -0.78, SHELVES[0], SHZ, 'shelf'); mk3('bp', -0.68, SHELVES[0], SHZ, 'shelf'); mk3('yeast', -0.58, SHELVES[0], SHZ, 'shelf'); mk3('chips', -0.43, SHELVES[0], SHZ, 'shelf');
  mk3('butter', -1.62, FRG.shelves[2], 0.0, 'fridge', { grams: 250 }); mk3('eggs', -1.6, FRG.shelves[1], 0.02, 'fridge', { count: 6 }); mk3('milk', -1.78, FRG.shelves[0], 0.02, 'fridge'); mk3('water', -1.47, FRG.shelves[0], 0.02, 'fridge');
  mk3('bowlL', -0.88, CT, 0.03, 'counter'); mk3('bowlS', -0.6, CT, 0.05, 'counter'); 
  mk3('bowlM', MXR.seat.x, MXR.seat.y, MXR.seat.z, 'mixer');
  ['whisk', 'spatula', 'tbsp', 'tsp', 'attHook'].forEach((k, i) => { const it = mk3(k, 0, 0, 0, 'rail'); hang3(it, i); it.home.slot = i; });
  const aw = mk3('attWhisk', 0, 0, 0, 'mixer'); aw.home.slot = 4; aw.pose = 'mounted';
  Object.assign(OV, { open: 0, tgt: 0, set: 0, temp: 22, timer: 0, heating: false, light: 0 });
  Object.assign(MX, { speed: 0, attach: 'whisk', spin: 0 });
  FRG.open = 0; FRG.tgt = 0; OVN.open = 0; OVN.tgt = 0; SCALE.tare = 0; SCALE.disp = 0; MITT_WORN.v = false;
  recipe = null; ticks = []; scorecard = null; gameT = 8.5 * 3600; hintsShown = {};
  refreshCards();
}
const mounted = () => items.find(i => i.zone === 'mixer' && DEF[i.kind].att);
const mixBowl = () => items.find(i => i.zone === 'mixer' && i.kind === 'bowlM');
function visible3(it) { if (it.zone === 'fridge') return FRG.open > 0.85; if (it.zone === 'oven') return OVN.open > 0.85; return true; }

/* ---------- openings & receivers ---------- */
function opening3(r) {
  if (PROF[r.kind]) {
    const p = PROF[r.kind], top = r.p.y + p.outer[p.outer.length - 1][1];
    const sy = r.p.y + heightFor(p.vol, r.m.vol());
    return { c: V3(r.p.x, top, r.p.z), r: radiusAt(p.inner, top - r.p.y) * 0.88, top, surf: sy, bot: r.p.y + p.inner[0][1] + 0.006 };
  }
  if (r.kind === 'loaf') { const top = r.p.y + LOAF.h, f = r.m.vol() / (LOAF.iw * LOAF.id * LOAF.h * 1e6); return { c: V3(r.p.x, top, r.p.z), rx: LOAF.iw / 2, rz: LOAF.id / 2, r: 0.07, top, surf: r.p.y + 0.004 + Math.min(1, f) * LOAF.h, bot: r.p.y + 0.008 }; }
  if (r.kind === 'tray') return { c: V3(r.p.x, r.p.y + 0.014, r.p.z), rx: 0.17, rz: 0.12, r: 0.12, top: r.p.y + 0.014, surf: r.p.y + 0.005, bot: r.p.y };
}
function inOpen(o, x, z, pad = 0) { if (viewT < 0.5) z = o.c.z + (z - o.c.z) * 0.1; if (o.rx) return Math.abs(x - o.c.x) < o.rx + pad && Math.abs(z - o.c.z) < o.rz + pad; return Math.hypot(x - o.c.x, z - o.c.z) < o.r + pad; }
function recv3(includeTray) { return items.filter(r => (DEF[r.kind].recv || (includeTray && r.kind === 'tray')) && r.zone !== 'held' && visible3(r) && !r.falling); }
function recvUnder(x, y, z, above, except, pad = 0.02) {
  let best = null, bd = 1e9;
  for (const r of recv3()) { if (r === except) continue; const o = opening3(r); if (inOpen(o, x, z, pad) && y > o.top - 0.04 && y - o.top < above) { const d = Math.hypot(x - o.c.x, z - o.c.z); if (d < bd) { bd = d; best = r; } } }
  return best;
}
function weight3(it) { const d = DEF[it.kind]; let w = d.tare || 0; if (it.m) w += it.m.total(); if (it.stock != null) w += it.stock; if (it.kind === 'eggs') w += it.count * 58; if (it.kind === 'butter') w += it.grams; if (it.kind === 'butterPiece') w += it.g; if (it.kind === 'tray') it.balls.forEach(b => w += b.m.total()); return w; }

/* ---------- supports ---------- */
function support3(it) {
  const { x, y, z } = it.p, c = [];
  const onScale = Math.abs(x - SCL.x) < 0.1 && Math.abs(z - SCL.z) < 0.1, onRack = Math.abs(x - RCK.x) < 0.15 && Math.abs(z - RCK.z) < 0.12;
  if (x > CTR.x0 + 0.03 && x < CTR.x1 - 0.03) c.push({ y: CT, zone: 'counter', z: clamp(z, CTR.z0 + it.rad * 0.5, CTR.z1 - it.rad * 0.3) });
  if (onScale) c.push({ y: SCL.top, zone: 'scale' });
  if (onRack) c.push({ y: RCK.top, zone: 'rack' });
  if (x > SHX[0] + 0.03 && x < SHX[1] - 0.03) SHELVES.forEach(sy => c.push({ y: sy, zone: 'shelf', z: SHZ }));
  if (FRG.open > 0.85 && x > FRG.ix0 + 0.04 && x < FRG.ix1 - 0.04) FRG.shelves.forEach(sy => c.push({ y: sy, zone: 'fridge', z: 0.02 }));
  if (OVN.open > 0.85 && x > OVN.x0 + 0.06 && x < OVN.x1 - 0.06 && y > OVN.y0 - 0.05 && y < OVN.y1) c.push({ y: OVN.rackY, zone: 'oven', z: 0.02 });
  if (it.kind === 'bowlM' && Math.hypot(x - MXR.seat.x, z - MXR.seat.z) < 0.09 && y < MXR.seat.y + 0.25) c.push({ y: MXR.seat.y, zone: 'mixer', x: MXR.seat.x, z: MXR.seat.z });
  let best = null; for (const s of c) if (s.y <= y + 0.02 && (!best || s.y > best.y)) best = s;
  if (best && best.zone === 'counter' && (onScale || onRack)) { /* scale / rack win when above */ }
  return best;
}
function settle3(it) {
  const s = support3(it);
  if (!s) { it.flyHome = 1; return; }
  if (s.x != null) it.p.x = s.x; if (s.z != null) it.p.z = s.z;
  it.falling = true; it.vy = 0; it.landY = s.y; it.landZone = s.zone;
}
function land3(it) {
  const v = it.vy; it.falling = false; it.p.y = it.landY; it.zone = it.landZone; it.vy = 0;
  if (it.into) { const r = it.into; it.into = null; if (it.kind === 'butterPiece') r.m.add('butter', it.g); remove3(it); SFX.plop(); return; }
  if (it.kind === 'egg' && v > 1.6) { remove3(it); addDecal('egg', it.p.x, it.p.y, it.p.z); SFX.splat(); say('Splat. That egg is gone.'); return; }
  SFX.thunk(clamp(v / 2.5, 0.15, 1));
  nudge3(it);
}
function nudge3(it) {
  if (!['counter', 'shelf', 'fridge'].includes(it.zone) || DEF[it.kind].tool) return;
  const lo = it.zone === 'counter' ? CTR.x0 : it.zone === 'shelf' ? SHX[0] : FRG.ix0, hi = it.zone === 'counter' ? 0.75 : it.zone === 'shelf' ? SHX[1] : FRG.ix1;
  const others = items.filter(o => o !== it && o.zone === it.zone && Math.abs(o.p.y - it.p.y) < 0.02 && !DEF[o.kind].tool);
  if (it.zone === 'counter') others.push({ p: V3(SCL.x, 0, SCL.z), rad: 0.1 }, { p: V3(RCK.x, 0, RCK.z), rad: 0.15 });
  for (let k = 0; k < 30; k++) {
    let moved = false;
    for (const o of others) {
      const dx = it.p.x - o.p.x, dz = it.p.z - o.p.z, d = Math.hypot(dx, dz) || 0.001, need = (o.rad + it.rad) * 0.92;
      if (d < need) { const push = (need - d) * 0.6; it.p.x += dx / d * push + (d < 0.002 ? 0.01 : 0); if (it.zone === 'counter') it.p.z += dz / d * push; moved = true; }
    }
    it.p.x = clamp(it.p.x, lo + it.rad, hi - it.rad); if (it.zone === 'counter') it.p.z = clamp(it.p.z, CTR.z0 + it.rad * 0.5, CTR.z1 - it.rad * 0.3);
    if (!moved) break;
  }
}

/* ---------- decals (spills, flour) ---------- */
function addDecal(type, x, y, z, col) {
  const t = canvTex(128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    if (type === 'egg') { c.fillStyle = 'rgba(255,250,232,.75)'; c.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, r = 40 * (0.75 + Math.random() * 0.4); c.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } c.fill(); const gr = c.createRadialGradient(60, 60, 2, 64, 64, 18); gr.addColorStop(0, '#ffd45c'); gr.addColorStop(1, '#e8930f'); c.fillStyle = gr; c.beginPath(); c.arc(66, 64, 17, 0, TAU); c.fill(); c.fillStyle = '#c4915f'; c.fillRect(20, 50, 16, 7); c.fillRect(96, 74, 14, 6); }
    else { c.fillStyle = rgb(col || [240, 230, 210], 0.85); c.beginPath(); c.ellipse(64, 64, 40, 30, 0, 0, TAU); c.fill(); }
  });
  const m = mesh(new THREE.PlaneGeometry(type === 'egg' ? 0.12 : 0.05, type === 'egg' ? 0.12 : 0.05), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.2, depthWrite: false }), x, y + 0.0015, z, false); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * TAU; scene.add(m);
  decals.push({ mesh: m, t: 0 });
}
function addPatch3(x, z, g) {
  let p = patches.find(p => Math.hypot(p.x - x, p.z - z) < 0.06);
  if (!p) {
    const t = canvTex(128, 128, (c) => { const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(0.7, 'rgba(250,248,242,.6)'); gr.addColorStop(1, 'rgba(250,248,242,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); noiseFill(c, 128, 128, 600, '255,255,255', 0.9, 2); });
    const m = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1 }), x, CT + 0.0012, z, false); m.rotation.x = -Math.PI / 2; scene.add(m);
    p = { x, z, amt: 0, mesh: m }; patches.push(p);
  }
  p.amt += g; const s = Math.min(0.22, 0.04 + Math.sqrt(p.amt) * 0.012); p.mesh.scale.set(s, s, 1); p.mesh.material.opacity = clamp(p.amt / 20, 0.3, 1);
}

/* ---------- soft-body dough ---------- */
class Dough3 {
  constructor(pos, m) {
    this.kind = 'dough'; this.id = uid++; this.m = m; this.zone = 'counter'; this.temp = 22; this.dust = 0; this.touched = touchN++;
    this.baseR = 0.026 * Math.cbrt(Math.max(60, m.total()) / 50); this.floorY = CT; this.grab = null; this.lastD = 0; this.strands = [];
    this.geo = new THREE.SphereGeometry(1, 28, 18);
    const pa = this.geo.attributes.position, key = {}; this.vmap = []; this.rest = []; this.pts = [];
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = `${Math.round(x * 1000) + 0},${Math.round(y * 1000) + 0},${Math.round(z * 1000) + 0}`; if (key[k] == null) { key[k] = this.rest.length; this.rest.push(V3(x, y, z)); const R = this.R(); const p = V3(pos.x + x * R, pos.y + y * R, pos.z + z * R); this.pts.push({ p, q: p.clone(), stuck: null }); } this.vmap.push(key[k]); }
    this.rmean = V3(0, 0, 0); this.rest.forEach(r => this.rmean.add(r)); this.rmean.multiplyScalar(1 / this.rest.length); this.rest = this.rest.map(r => r.clone().sub(this.rmean));
    this.mesh = new THREE.Mesh(this.geo, MAT.dough.clone()); this.mesh.castShadow = true; this.mesh.receiveShadow = true; this.mesh.userData.dough = this; this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.strandMeshes = []; for (let i = 0; i < 10; i++) { const s = mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), MAT.dough, 0, 0, 0, false); s.visible = false; scene.add(s); this.strandMeshes.push(s); }
  }
  dispose() { scene.remove(this.mesh); this.strandMeshes.forEach(s => scene.remove(s)); }
  R() { return this.baseR * (1 + 0.3 * Math.min(1.8, this.m.proof)); }
  center() { const c = V3(0, 0, 0); for (const o of this.pts) c.add(o.p); return c.multiplyScalar(1 / this.pts.length); }
  sticky() { const g = this.m.g, fl = g.flour || 1, hyd = ((g.water || 0) + (g.milk || 0) + (g.egg || 0) * 0.75) / fl; return clamp(0.55 + (hyd - 0.6) * 2 - Math.min(1, this.m.knead) * 0.45 - this.dust * 0.55, 0.04, 1); }
  startGrab(hit, target) {
    let bi = 0, bd = 1e9; this.pts.forEach((o, i) => { const d = o.p.distanceTo(hit); if (d < bd) { bd = d; bi = i; } });
    const rg = this.rest[bi]; this.grab = { w: this.rest.map(r => 0.92 * Math.exp(-(1 - r.dot(rg)) / 0.11)), off: this.pts.map(o => o.p.clone().sub(target)), target: target.clone() };
    this.touched = touchN++;
  }
  update(dt) {
    const sub = 4, h = dt / sub, stick = this.sticky(), R = this.R(), ks0 = 0.05 + 0.05 * Math.min(1, this.m.knead);
    const ks = this.grab ? 0.022 + 0.035 * Math.min(1, this.m.knead) : ks0;
    const tmp = V3(0, 0, 0);
    for (let s = 0; s < sub; s++) {
      for (const o of this.pts) { tmp.copy(o.p).sub(o.q).multiplyScalar(0.94); o.q.copy(o.p); o.p.add(tmp); o.p.y -= 9.8 * h * h; }
      const c = this.center(), sq = this.grab ? 0.95 : 0.78;
      this.pts.forEach((o, i) => { const r = this.rest[i]; tmp.set(c.x + r.x * R * 1.12, c.y + r.y * R * sq, c.z + r.z * R * 1.12); o.p.lerp(tmp, ks); });
      if (this.grab) { const T = this.grab.target; this.pts.forEach((o, i) => { const w = this.grab.w[i]; if (w < 0.003) return; tmp.copy(this.grab.off[i]).multiplyScalar(0.85).add(T); o.p.lerp(tmp, w); }); }
      for (const o of this.pts) {
        if (o.p.y < this.floorY) { o.p.y = this.floorY; o.q.x = o.p.x - (o.p.x - o.q.x) * 0.25; o.q.z = o.p.z - (o.p.z - o.q.z) * 0.25; if (!o.stuck && stick > 0.12) o.stuck = V3(o.p.x, this.floorY, o.p.z); }
        if (o.stuck) {
          const up = o.p.y - this.floorY, lim = 0.004 + 0.035 * stick, side = Math.hypot(o.p.x - o.stuck.x, o.p.z - o.stuck.z);
          if (this.grab && up < lim && side < lim * 2.5) { o.p.y -= up * 0.5 * stick; o.p.x += (o.stuck.x - o.p.x) * 0.7 * stick; o.p.z += (o.stuck.z - o.p.z) * 0.7 * stick; }
          else if (up >= lim || side >= lim * 2.5) { this.strands.push({ a: o.stuck.clone(), o, life: 1, max: 0.02 + 0.07 * stick }); o.stuck = null; if (Math.random() < 0.3) sNoise(0.05, 900, 2, 0.15, 'lowpass'); }
          else if (!this.grab && up > 0.001) o.stuck = null;
        }
      }
    }
    this.strands = this.strands.filter(st => { st.life -= dt * 1.4; return st.life > 0 && st.a.distanceTo(st.o.p) < st.max; }).slice(-10);
    if (this.grab) {
      const c = this.center(); let D = 0; this.pts.forEach((o, i) => { const r = this.rest[i]; D += o.p.distanceTo(V3(c.x + r.x * R * 1.12, c.y + r.y * R * 0.8, c.z + r.z * R * 1.12)); }); D /= this.pts.length * R;
      if (this.pts.some(o => o.p.y < this.floorY + 0.002)) this.m.knead = Math.min(1.3, this.m.knead + Math.abs(D - this.lastD) * 0.09);
      this.lastD = D;
    }
    const c = this.center();
    for (const pa of patches) if (pa.amt > 0.5 && Math.hypot(pa.x - c.x, pa.z - c.z) < R * 1.5 && this.pts.some(o => o.p.y < this.floorY + 0.002)) { const take = Math.min(pa.amt, dt * 6); pa.amt -= take; this.m.add('flour', take * 0.6); this.dust = Math.min(1, this.dust + take * 0.04); addPatch3(pa.x, pa.z, 0); }
    // geometry
    const pa = this.geo.attributes.position; for (let i = 0; i < this.vmap.length; i++) { const o = this.pts[this.vmap[i]].p; pa.setXYZ(i, o.x, o.y, o.z); }
    pa.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
    const mat = this.mesh.material; mat.color.setRGB(...mixc([236, 220, 189], [252, 250, 245], this.dust * 0.7).map(v => v / 255)).convertSRGBToLinear(); mat.sheen = 0.3 + 0.6 * Math.min(1, this.m.knead); mat.roughness = 0.9 - 0.25 * Math.min(1, this.m.knead);
    this.strandMeshes.forEach((s, i) => { const st = this.strands[i]; if (!st) { s.visible = false; return; } const a = st.a, b = st.o.p, d = a.distanceTo(b), t = 1 - d / st.max; s.visible = true; s.position.copy(a).add(b).multiplyScalar(0.5); s.scale.set(Math.max(0.0005, 0.003 * t * st.life), d, Math.max(0.0005, 0.003 * t * st.life)); s.quaternion.setFromUnitVectors(V3(0, 1, 0), b.clone().sub(a).normalize()); });
  }
}

/* ---------- egg cracking ---------- */
function startCrack3(egg, r) {
  remove3(egg); const o = opening3(r);
  const dir = V3(egg.p.x - o.c.x, 0, egg.p.z - o.c.z); if (dir.length() < 0.001) dir.set(-1, 0, 0); dir.normalize();
  const rim = o.c.clone().add(dir.clone().multiplyScalar(o.r * 0.55));
  const g = new THREE.Group(); scene.add(g);
  const top = eggHalf(true), bot = eggHalf(false); const eg = new THREE.Group(); eg.add(top, bot); top.children.forEach(m => m.position.y -= 0); g.add(eg);
  const yolk = mesh(new THREE.SphereGeometry(0.012, 20, 14), MAT.yolk, 0, 0, 0); yolk.visible = false; g.add(yolk);
  const white = mesh(new THREE.SphereGeometry(0.02, 20, 14), MAT.white_egg, 0, 0, 0, false); white.visible = false; g.add(white);
  cracks.push({ g, eg, top, bot, yolk, white, r, rim, start: egg.p.clone().add(V3(0, 0.03, 0)), t: 0, snd: false, added: false, shell: Math.random() < 0.13 });
}
function updateCracks3(dt) {
  for (const c of cracks) {
    c.t += dt; const o = opening3(c.r); const t = c.t, eggH = 0.057;
    const hover = c.rim.clone(); hover.y = o.top + 0.03;
    if (t < 0.17) { c.eg.position.lerpVectors(c.start, hover, sstep(0, 1, t / 0.17)); c.eg.rotation.z = 1.2; }
    if (t > 0.17 && !c.snd) { c.snd = true; SFX.crack(); }
    if (t >= 0.17 && t < 0.3) { c.eg.position.copy(hover); c.eg.position.y -= Math.sin((t - 0.17) / 0.13 * Math.PI) * 0.006; }
    if (t >= 0.3) {
      const p = sstep(0.3, 0.62, t); c.eg.position.copy(hover); c.eg.rotation.z = 1.2;
      c.top.rotation.z = p * 1.2; c.top.position.set(-p * 0.012, 0, 0); c.bot.rotation.z = -p * 1.1; c.bot.position.set(p * 0.012, 0, 0);
      const q = sstep(0.34, 0.66, t);
      c.yolk.visible = c.white.visible = q > 0 && t < 0.75;
      const y = lerp(hover.y - 0.005, o.surf + 0.006, q * q);
      c.yolk.position.set(hover.x, y, hover.z); c.white.position.set(hover.x, y + 0.004 + (1 - q) * 0.01, hover.z); c.white.scale.set(1, 1 + (1 - q) * 1.8, 1);
      const fade = 1 - sstep(0.85, 1.2, t); [c.top, c.bot].forEach(h => h.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = fade; } }));
      if (t > 0.85) c.eg.position.y += (t - 0.85) * 0.25;
    }
    if (t > 0.62 && !c.added) { c.added = true; c.r.m.add('egg', 48 + Math.random() * 6); if (c.shell) { c.r.m.shell = 1; hintOnce('shell', 'A bit of shell fell in. Tap the bowl’s contents to fish it out.'); } SFX.plop(); }
  }
  cracks = cracks.filter(c => { if (c.t >= 1.25) { scene.remove(c.g); return false; } return true; });
}

/* ---------- pointer & camera ---------- */
function setRay(sx, sy) { ray.setFromCamera(new THREE.Vector2(sx / uiW * 2 - 1, -(sy / uiH) * 2 + 1), camera); }
function pick3(sx, sy) {
  setRay(sx, sy);
  const roots = [...items.filter(i => i !== (held && held.it)).map(i => i.root), ...doughs.filter(d => d !== heldDough).map(d => d.mesh), FIX.room, ...CARDS.map(c => c.mesh)];
  const hits = ray.intersectObjects(roots, true);
  for (const h of hits) {
    let o = h.object; if (!shown(o)) continue;
    if (o.userData.item) { const it = o.userData.item; if (!visible3(it) && it.zone !== 'oven') continue; return { it, point: h.point, obj: o }; }
    if (o.userData.dough) return { dough: o.userData.dough, point: h.point };
    if (o.userData.ctrl) return { ctrl: o.userData.ctrl, point: h.point };
    if (o.userData.card != null) return { card: o.userData.card, point: h.point };
    return null;
  }
  return null;
}
function shown(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function planeHit(normal, point) { const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point); const out = V3(0, 0, 0); return ray.ray.intersectPlane(pl, out) ? out : null; }
function carryTarget(it, isDough) {
  setRay(PT.x, PT.y);
  const viewPov = viewT > 0.5;
  if (viewPov) {
    let y = isDough ? CT + 0.11 : CT + 0.17;
    const hp = planeHit(V3(0, 1, 0), V3(0, y, 0)); if (!hp) return null;
    if (!isDough && held) {
      const off = held.off; const x = hp.x - off.x, z = hp.z - off.z;
      const r = recvUnder(x, 10, z, 99, it, it.rad * 1.2); if (r) y = Math.max(y, opening3(r).top + (DEF[it.kind].tool ? 0.08 : 0.035));
      const hp2 = planeHit(V3(0, 1, 0), V3(0, y, 0)) || hp; return V3(hp2.x - off.x, y, hp2.z - off.z);
    }
    return hp;
  }
  const z = held ? (held.it.zTarget ?? held.cz) : (isDough ? heldDough.cz : 0.05);
  const hp = planeHit(V3(0, 0, 1), V3(0, 0, z)); if (!hp) return null;
  if (held) { hp.sub(held.off); hp.y = Math.max(hp.y, 0.08); }
  return hp;
}
function updateCamera(dt) {
  viewT += clamp((view === 'pov' ? 1 : 0) - viewT, -dt * 1.6, dt * 1.6);
  const t = sstep(0, 1, viewT);
  if (view === 'pov' && PT.has && !drag) { const ex = PT.x / uiW; if (ex < 0.1) povX -= dt * 0.8 * (1 - ex / 0.1); if (ex > 0.9) povX += dt * 0.8 * ((ex - 0.9) / 0.1); }
  povX = clamp(povX, -0.95, 1.0);
  const aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? (1.5 / aspect) : 1;
  const cp = VIEWS.counter.pos.clone(); cp.z = 0.3 + (cp.z - 0.3) * widen;
  const pp = VIEWS.pov.pos.clone(); pp.x = povX; const pl = VIEWS.pov.look.clone(); pl.x = povX;
  camera.position.lerpVectors(cp, pp, t);
  const look = V3(0, 0, 0).lerpVectors(VIEWS.counter.look, pl, t);
  camera.fov = lerp(VIEWS.counter.fov, VIEWS.pov.fov * (aspect < 1 ? 1.25 : 1), t); camera.aspect = aspect; camera.updateProjectionMatrix();
  camera.lookAt(look);
}
function setView(v) { if (view === v) return; view = v; if (v === 'pov') { const c = held ? held.it.p.x : 0; povX = clamp(c, -0.95, 1.0); hintOnce('pov', 'Leaning over the counter. Use the arrows to look left or right.'); } }

/* ---------- grabbing ---------- */
function hot3(it) { if (it.temp > 55 && !MITT_WORN.v) { SFX.ouch(); say('Ouch! That’s hot. Put on the oven mitt first.'); return false; } return true; }
function beginHold(it, point) {
  it.zone = 'held'; it.falling = false; it.flyHome = 0; it.touched = touchN++;
  const viewPov = viewT > 0.5;
  const cz = 0.04;
  if (DEF[it.kind].tool) { it.pose = 'held'; if (point) { it.p.set(point.x, point.y - it.h * 0.6, viewPov ? point.z : cz); } }
  const ref = point ? point.clone() : it.p.clone().add(V3(0, it.h / 2, 0));
  let off;
  if (viewPov) off = V3(ref.x - it.p.x, 0, ref.z - it.p.z);
  else { setRay(PT.x, PT.y); const hp = planeHit(V3(0, 0, 1), V3(0, 0, cz)) || ref; off = V3(hp.x - it.p.x, hp.y - it.p.y, 0); }
  if (DEF[it.kind].tool) off = viewPov ? V3(0, 0, 0) : V3(0, it.h * 0.6, 0);
  held = { it, off, cz };
}
function grab3(hit) {
  const it = hit.it, d = DEF[it.kind];
  if (!hot3(it)) return;
  if (it.zone === 'mixer' && it.kind === 'bowlM' && MX.speed > 0) { say('Switch the mixer off before taking the bowl.'); return; }
  if (it.zone === 'mixer' && d.att) { if (MX.speed > 0) { say('Switch the mixer off first.'); return; } MX.attach = null; }
  if (it.kind === 'eggs') { if (it.count <= 0) { say('The carton is empty.'); return; } it.count--; const e = mk3('egg', hit.point.x, hit.point.y - 0.03, hit.point.z, 'held'); beginHold(e, hit.point); SFX.click(); return; }
  if (it.kind === 'butter' && it.grams > 0.5) {
    const len = 0.12 * it.grams / 250, x0 = it.p.x - 0.08, rel = clamp((hit.point.x - x0) / len, 0, 1);
    let g = Math.round((1 - rel) * it.grams / 25) * 25; g = clamp(g || 25, 25, it.grams); if (rel < 0.12) g = it.grams;
    it.grams -= g; const p = mk3('butterPiece', hit.point.x, hit.point.y - 0.02, hit.point.z, 'held', { g }); beginHold(p, hit.point); SFX.click(); say(`Cut off ${g} g of butter.`, 2); return;
  }
  if (it.m && (d.recv || it.kind === 'loaf') && it.m.total() > 0.5 && hit.obj && (hit.obj === it.parts.disc || hit.obj === it.parts.dome || hit.obj === it.parts.body)) {
    if (it.m.shell > 0) { it.m.shell = 0; SFX.click(); say('Fished out the bit of shell.'); return; }
    if (it.m.form() === 'dough' && !it.bake) {
      const o = opening3(it), m = it.m; it.m = new Mix();
      const dg = new Dough3(V3(o.c.x, o.surf + 0.03, o.c.z), m); doughs.push(dg); grabDough(dg, hit.point); dg.strands.push({ a: V3(o.c.x, o.surf, o.c.z), o: dg.pts[dg.pts.length - 1], life: 1, max: 0.1 });
      sNoise(0.2, 500, 1, 0.3, 'lowpass'); return;
    }
  }
  if (d.tool && it.zone !== 'held') SFX.clink();
  beginHold(it, hit.point);
}
function grabDough(dg, point) { dg.cz = clamp(dg.center().z, -0.1, 0.15); heldDough = dg; const tgt = carryTarget(null, true) || point; dg.startGrab(point, tgt); dg.grab.target.copy(tgt); }
function release3() {
  const it = held.it, d = DEF[it.kind]; held = null; it.tilt = 0; it.pourHold = 0; it.stream = null; it.slideT = 0; it.inside = null; it.dip = 0;
  if (d.tool) return releaseTool3(it);
  if (it.kind === 'egg') {
    const carton = items.find(i => i.kind === 'eggs' && visible3(i) && Math.hypot(i.p.x - it.p.x, i.p.z - it.p.z) < 0.13 && Math.abs(it.p.y - i.p.y) < 0.12);
    if (carton && carton.count < 6) { carton.count++; remove3(it); SFX.click(); return; }
    const r = recvUnder(it.p.x, it.p.y, it.p.z, 0.35, null, 0.03); if (r) { startCrack3(it, r); return; }
  }
  if (it.kind === 'butterPiece') {
    const r = recvUnder(it.p.x, it.p.y, it.p.z, 0.4, null, 0.02); if (r) { it.into = r; it.falling = true; it.vy = 0; it.landY = opening3(r).surf; it.landZone = 'counter'; return; }
    const dish = items.find(i => i.kind === 'butter' && visible3(i) && Math.hypot(i.p.x - it.p.x, i.p.z - it.p.z) < 0.11); if (dish && dish.grams + it.g <= 250) { dish.grams += it.g; remove3(it); SFX.click(); return; }
  }
  settle3(it);
}
function releaseTool3(it) {
  const d = DEF[it.kind];
  if (d.spoon && it.m.total() > 0.05) {
    const r = recvUnder(it.p.x, it.p.y, it.p.z, 0.25, null, 0.01) || items.find(i => i.kind === 'tray' && visible3(i) && inOpen(opening3(i), it.p.x, it.p.z) && it.p.y - i.p.y < 0.3);
    if (r) spoonDump3(it, r); else { addDecal('spill', it.p.x, CT, clamp(it.p.z, -0.25, 0.25), it.m.color()); it.m = new Mix(); }
  }
  if (d.att && Math.abs(it.p.x - MXR.seat.x) < 0.12 && Math.abs(it.p.z - MXR.seat.z) < 0.12 && it.p.y > CT + 0.0 && it.p.y < CT + 0.45) {
    if (MX.speed > 0) say('Switch the mixer off first.');
    else { const old = mounted(); if (old && old !== it) { hang3(old, it.home.slot ?? 4); old.home.slot = it.home.slot ?? 4; } it.zone = 'mixer'; it.pose = 'mounted'; MX.attach = d.att; SFX.click(); say(d.att === 'hook' ? 'Dough hook fitted.' : 'Whisk fitted.', 2); return; }
  }
  let best = null, bd = 0.07;
  RAIL.slots.forEach((sx, i) => { const occ = items.some(o => o !== it && o.pose === 'hang' && o.slot === i); if (occ) return; const top = it.p.y + it.h, dd = Math.abs(it.p.x - sx); if (dd < bd && Math.abs(top - RAIL.y) < 0.15 && it.p.z < 0.1) { bd = dd; best = i; } });
  if (best !== null) { hang3(it, best); SFX.clink(); return; }
  it.pose = 'lie'; it.zone = 'counter'; it.p.set(clamp(it.p.x + it.h / 2, CTR.x0 + it.h + 0.02, 0.72), CT + it.rad * 0.4, clamp(it.p.z, CTR.z0 + 0.04, CTR.z1 - 0.04)); it.touched = touchN++; SFX.clink();
}
function releaseDough3(dg) {
  dg.grab = null; heldDough = null;
  const c = dg.center(); const r = recvUnder(c.x, c.y + 0.05, c.z, 0.3, null, 0.02);
  if (r && r.kind !== 'jug') { r.m.merge(dg.m); dg.dispose(); doughs = doughs.filter(d => d !== dg); SFX.plop(); if (r.kind === 'loaf') say('Dough shaped into the loaf pan.', 2.5); return; }
  const onScale = Math.abs(c.x - SCL.x) < 0.1 && Math.abs(c.z - SCL.z) < 0.1;
  dg.floorY = onScale ? SCL.top : CT; dg.zone = onScale ? 'scale' : 'counter';
  dg.pts.forEach(o => { o.p.x = clamp(o.p.x, CTR.x0 + 0.05, 0.72); o.p.z = clamp(o.p.z, -0.25, 0.25); });
}

/* ---------- pouring ---------- */
function pourDir(it, o) { const d = V3(o.c.x - it.p.x, 0, o.c.z - it.p.z); if (d.length() < 0.01) { if (!it.pdir) it.pdir = V3(1, 0, 0); return it.pdir; } it.pdir = d.normalize(); return it.pdir; }
function applyTilt(it) { const dir = it.pdir || V3(1, 0, 0); const axis = V3(dir.z, 0, -dir.x).normalize(); it.pivot.quaternion.setFromAxisAngle(axis, it.tilt); }
function lip3(it) { const dir = it.pdir || V3(1, 0, 0); const pv = it.p.clone().add(V3(0, it.h / 2, 0)); const local = V3(dir.x * it.rad * 0.95, it.h / 2, dir.z * it.rad * 0.95); local.applyQuaternion(it.pivot.quaternion); return pv.add(local); }
function findPour3(it) {
  let best = null, bd = 1e9;
  for (const r of recv3()) { if (r === it) continue; const o = opening3(r); const d = Math.hypot(it.p.x - o.c.x, (it.p.z - o.c.z) * (viewT < 0.5 ? 0.1 : 1)), reach = (o.rx || o.r) + it.rad * 1.6; if (d < reach && it.p.y > o.top - 0.03 && it.p.y - o.top < 0.4 && d < bd) { bd = d; best = { r, o }; } }
  if (best) return best;
  const f = it.m ? it.m.form() : null, lumpy = it.m && ['dough', 'shaggy', 'cookie'].includes(f);
  if ((it.kind === 'flour' || lumpy) && it.p.x > CTR.x0 + 0.1 && it.p.x < 0.7 && it.p.y - CT < 0.3 && it.p.y > CT + 0.04 && Math.hypot(it.p.x - SCL.x, it.p.z - SCL.z) > 0.15)
    return { counter: true, o: { c: V3(it.p.x + 0.1, CT, it.p.z), r: 0.06, top: CT, surf: CT + 0.002 } };
  return null;
}
function pour3(it, dt) {
  const d = DEF[it.kind], empty = d.src ? it.stock <= 0.05 : it.m.total() < 0.3;
  const tgt = empty ? null : findPour3(it), still = PT.speed < 500;
  if (tgt && still) it.pourHold = (it.pourHold || 0) + dt; else it.pourHold = Math.max(0, (it.pourHold || 0) - dt * 4);
  if (tgt && !tgt.counter) { pourDir(it, tgt.o); it.zTarget = tgt.o.c.z; } else if (tgt) it.pdir = it.pdir || V3(1, 0, 0);
  const want = tgt && it.pourHold > (tgt.counter ? 0.45 : 0.12) ? d.pour.tilt : 0;
  const cur = it.tilt, rate = want > cur ? 1.35 : 3.6; it.tilt = cur + clamp(want - cur, -rate * dt, rate * dt);
  applyTilt(it); it.stream = null; it.flow = 0;
  const fill = d.src ? clamp(it.stock / d.stock, 0, 1) : clamp(it.m.vol() / ((PROF[it.kind] ? PROF[it.kind].vol.at(-1)[1] : 500)), 0, 1);
  const start = d.src ? 0.55 + 0.85 * (1 - fill) : 0.3 + 0.95 * (1 - fill);
  if (!tgt || it.tilt <= start) { it.slideT = 0; return; }
  const lip = lip3(it);
  const lv = V3(lip.x - tgt.o.c.x, 0, lip.z - tgt.o.c.z); const lim = (tgt.o.rx ? Math.min(tgt.o.rx, tgt.o.rz) : tgt.o.r) * 0.6; if (lv.length() > lim) lv.setLength(lim);
  const land = V3(tgt.o.c.x + lv.x, tgt.o.surf, tgt.o.c.z + lv.z);
  const f = clamp((it.tilt - start) / Math.max(0.2, d.pour.tilt - start), 0, 1);
  if (!d.src && ['dough', 'shaggy', 'cookie'].includes(it.m.form())) {
    it.slideT = (it.slideT || 0) + dt; it.stream = { type: 'blob', a: lip, b: land, k: clamp(it.slideT / 0.7, 0, 1), col: it.m.color() };
    if (it.slideT > 0.7) { const m = it.m; it.m = new Mix(); if (tgt.counter) { const dg = new Dough3(V3(land.x, CT + 0.06, land.z), m); doughs.push(dg); hintOnce('knead', 'Grab the dough and stretch it to knead. A little flour on the counter stops it sticking.'); } else tgt.r.m.merge(m); SFX.plop(); it.slideT = 0; it.stream = null; }
    return;
  }
  let type, col, max = d.pour.max;
  if (d.src) { type = ING[d.src].type; col = ING[d.src].c; if (d.src === 'water') type = 'water'; }
  else { const form = it.m.form(); col = it.m.color(); if (form === 'batter' || form === 'lumpy') { type = 'thick'; max *= 0.8; } else if (form === 'liquid') type = it.m.kinds().length === 1 && it.m.g.water ? 'water' : 'liquid'; else { const main = it.m.kinds().sort((a, b) => it.m.g[b] - it.m.g[a])[0]; type = ING[main].type === 'liquid' ? 'grain' : ING[main].type; if (type === 'solid') type = 'chunk'; } }
  const flow = max * f * f; let amt = flow * dt;
  if (d.src) { amt = Math.min(amt, it.stock); it.stock -= amt; if (tgt.counter) addPatch3(land.x, land.z, amt); else tgt.r.m.add(d.src, amt); }
  else { const t = it.m.total(); amt = Math.min(amt, t); const part = it.m.take(amt / t); if (tgt.counter) addPatch3(land.x, land.z, amt); else tgt.r.m.merge(part); }
  it.flow = flow; it.stream = { type, a: lip, b: land, col, rate: flow };
  if (['powder', 'grain', 'chunk'].includes(type)) {
    const n = type === 'chunk' ? flow * dt / 2.5 : flow * dt * (type === 'powder' ? 3 : 4);
    const dir = it.pdir;
    for (let i = 0; i < n + (Math.random() < n % 1 ? 1 : 0); i++) parts.push({ type, p: lip.clone().add(V3((Math.random() - 0.5) * 0.008, 0, (Math.random() - 0.5) * 0.008)), v: V3(dir.x * (0.05 + Math.random() * 0.05), 0.02, dir.z * (0.05 + Math.random() * 0.05)), land: land.y, col, life: 2 });
  }
}

/* ---------- tools ---------- */
function tool3(it, dt) {
  const d = DEF[it.kind]; let inside = null;
  for (const r of recv3(!!d.spoon)) { const o = opening3(r); if (inOpen(o, it.p.x, it.p.z, -0.005) && it.p.y < o.top + 0.12 && (!inside || r.touched > inside.r.touched)) inside = { r, o }; }
  it.inside = inside ? inside.r : null;
  it.dipY = null; if (inside) it.zTarget = inside.r.p.z;
  if (inside && d.mixer && inside.r.kind !== 'tray') {
    it.dipY = Math.max(inside.o.bot, inside.o.surf - 0.012);
    const mv = Math.hypot(it.p.x - (it.lx ?? it.p.x), it.p.z - (it.lz ?? it.p.z), (it.p.y - (it.ly ?? it.p.y)) * 0.5) * 1000 * 0.55;
    if (it.p.y < inside.o.surf + 0.01) handMix(inside.r.m, mv, d.mixer);
  }
  if (d.spoon) spoon3(it, dt, inside);
  it.lx = it.p.x; it.ly = it.p.y; it.lz = it.p.z;
}
function srcOpen(s) { return { c: V3(s.p.x, s.p.y + s.h, s.p.z), r: s.rad * 0.85 }; }
function spoonOver(it, s) { if (DEF[s.kind].recv || s.kind === 'tray') { const o = opening3(s); return inOpen(o, it.p.x, it.p.z, 0.01) && it.p.y < o.top + 0.14; } const o = srcOpen(s); return Math.hypot(it.p.x - o.c.x, (it.p.z - o.c.z) * (viewT < 0.5 ? 0.1 : 1)) < o.r + 0.01 && it.p.y < o.c.y + 0.14 && it.p.y > o.c.y - 0.08; }
function spoon3(it, dt, inside) {
  const d = DEF[it.kind], full = it.m.total() > 0.05;
  if (it.lock) { const s = items.find(i => i.id === it.lock); if (!s || !spoonOver(it, s)) it.lock = null; else return; }
  if (!full) {
    for (const s of items) {
      const sd = DEF[s.kind]; if (!sd.spoonable || !visible3(s) || s.zone === 'held' || s.stock <= 0.3) continue;
      if (spoonOver(it, s)) { const o = srcOpen(s); it.zTarget = s.p.z; it.dipY = o.c.y - 0.025; if (it.p.y < o.c.y - 0.012) { const k = sd.src, g = Math.min(s.stock, d.spoon * ING[k].d * (0.96 + Math.random() * 0.08)); s.stock -= g; it.m.add(k, g); it.lock = s.id; SFX.scrape(); hintOnce('spoon', 'A level spoonful. Hold the spoon over a bowl to tip it in.'); } return; }
    }
    if (inside && inside.r.kind !== 'tray') {
      const m = inside.r.m, t = m.total();
      if (t > 0.3) { it.dipY = Math.max(inside.o.bot, inside.o.surf - 0.008); if (it.p.y < inside.o.surf + 0.004) { const f = m.form(); let g = ['cookie', 'dough', 'shaggy'].includes(f) ? (d.spoon === 15 ? 45 : 15) : d.spoon * (t / m.vol()); g = Math.min(g, t); it.m.merge(m.take(g / t)); it.lock = inside.r.id; SFX.scrape(); } }
    }
  } else {
    if (inside) { it.dumpT = (it.dumpT || 0) + dt; if (it.dumpT > (inside.r.kind === 'tray' ? 0.25 : 0.15)) spoonDump3(it, inside.r); }
    else { it.dumpT = 0; const k = it.m.kinds(); if (k.length === 1) { const s = items.find(s => DEF[s.kind].src === k[0] && visible3(s) && s.zone !== 'held' && spoonOver(it, s)); if (s && it.p.y < s.p.y + s.h + 0.02) { s.stock += it.m.total(); it.m = new Mix(); it.lock = s.id; SFX.scrape(); } } }
  }
}
function spoonDump3(it, r) {
  const m = it.m; it.m = new Mix(); it.dumpT = 0; it.lock = r.id; it.tipAnim = 0.35;
  if (r.kind === 'tray') { placeBall3(r, it.p, m); SFX.plop(); return; }
  r.m.merge(m); SFX.plop();
  const o = opening3(r), c = m.color(); for (let i = 0; i < 8; i++) parts.push({ type: 'grain', p: it.p.clone(), v: V3((Math.random() - 0.5) * 0.08, 0.02, (Math.random() - 0.5) * 0.08), land: o.surf, col: c, life: 1 });
}
function placeBall3(tray, p, m) {
  const lx = p.x - tray.p.x, lz = p.z - tray.p.z, slots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) slots.push({ x: -0.12 + c * 0.08, z: -0.08 + r * 0.08 });
  const free = slots.filter(s => !tray.balls.some(b => Math.abs(b.x - s.x) < 0.01 && Math.abs(b.z - s.z) < 0.01));
  if (!free.length) { const b = tray.balls[0]; b.m.merge(m); b.g = b.m.total(); return; }
  free.sort((a, b) => Math.hypot(a.x - lx, a.z - lz) - Math.hypot(b.x - lx, b.z - lz));
  tray.balls.push({ id: uid++, x: free[0].x, z: free[0].z, g: m.total(), m });
}

/* ---------- input ---------- */
function pickCtrl(c) {
  if (c === 'clock') { drag = { type: 'clock' }; CLOCK.hold = true; return; }
  if (c === 'knobTemp' || c === 'knobTimer') { drag = { type: 'knob', k: c === 'knobTemp' ? 'temp' : 'timer', y: PT.y, x: PT.x }; SFX.click(); return; }
  if (c === 'ovenDoor') { OVN.tgt = OVN.open > 0.5 ? 0 : 1; SFX.door(); return; }
  if (c === 'fridgeDoor') { FRG.tgt = FRG.open > 0.5 ? 0 : 1; SFX.fridge(); return; }
  if (c === 'tare') { SCALE.tare = SCALE.disp; SFX.beep(); return; }
  if (c === 'lever') { MX.speed = (MX.speed + 1) % 4; SFX.click(); if (MX.speed && !mixBowl()) say('The mixer is running with no bowl.', 2); return; }
  if (c === 'mitt') { MITT_WORN.v = !MITT_WORN.v; FIX.mitt.visible = !MITT_WORN.v; SFX.click(); if (MITT_WORN.v) say('Oven mitt on. Click the hook to hang it back.', 2.5); return; }
}
function viewToggleHit(x, y) { return false; }
function onDown3() {
  if (scorecard) { if (scorecard.t > 0.8) { build3(); SFX.click(); } return; }
  if (viewToggleHit(PT.x, PT.y)) { setView(view === 'pov' ? 'counter' : 'pov'); SFX.click(); return; }
  if (MITT_WORN.v) { setRay(PT.x, PT.y); const h = ray.intersectObject(FIX.mitt, true); if (h.length) { pickCtrl('mitt'); return; } }
  const hit = pick3(PT.x, PT.y);
  if (!hit) return;
  if (hit.card != null) { if (!recipe) { recipe = RECIPES[hit.card]; ticks = recipe.steps.map(() => false); refreshCards(); SFX.click(); say(`${recipe.name}: hover the card any time to read it.`, 4); } return; }
  if (hit.ctrl) { pickCtrl(hit.ctrl); return; }
  if (hit.dough) { if (!hot3(hit.dough)) return; grabDough(hit.dough, hit.point); return; }
  if (hit.it) grab3(hit);
}
function onMove3() {
  if (drag && drag.type === 'knob') {
    const dy = drag.y - PT.y, dx = PT.x - drag.x; drag.y = PT.y; drag.x = PT.x; const delta = (dy + dx) / 260;
    if (drag.k === 'temp') { const old = OV.set; OV.set = clamp(OV.set + delta * 250, 0, 250); if (Math.round(old / 10) !== Math.round(OV.set / 10)) SFX.click(); }
    else { const old = OV.timer; OV.timer = clamp(OV.timer + delta * 3600, 0, 3600); if (Math.round(old / 60) !== Math.round(OV.timer / 60)) sNoise(0.02, 4000, 3, 0.15); }
  }
}
function onUp3() {
  if (drag) { if (drag.type === 'clock') CLOCK.hold = false; if (drag.type === 'knob' && drag.k === 'temp') { OV.set = Math.round(OV.set / 5) * 5; if (OV.set < 30) OV.set = 0; } drag = null; }
  if (held) release3();
  if (heldDough) releaseDough3(heldDough);
}
function ptFrom(e) { const r = UI.getBoundingClientRect(); PT.x = e.clientX - r.left; PT.y = e.clientY - r.top; PT.has = true; }
UI.addEventListener('pointerdown', e => { audio(); try { UI.setPointerCapture(e.pointerId); } catch (_) { } ptFrom(e); PT.lx = PT.x; PT.ly = PT.y; PT.down = true; onDown3(); e.preventDefault(); });
UI.addEventListener('pointermove', e => { ptFrom(e); onMove3(); });
UI.addEventListener('pointerup', e => { ptFrom(e); PT.down = false; onUp3(); });
UI.addEventListener('pointercancel', () => { PT.down = false; onUp3(); });
UI.addEventListener('pointerleave', () => { PT.has = false; });
let wheelLock = 0;
UI.addEventListener('wheel', e => {
  e.preventDefault();
  const h = !held && pick3(PT.x, PT.y);
  if (h && (h.ctrl === 'knobTemp' || h.ctrl === 'knobTimer')) { if (h.ctrl === 'knobTemp') OV.set = clamp(Math.round((OV.set - Math.sign(e.deltaY) * 5) / 5) * 5, 0, 250); else OV.timer = clamp(OV.timer - Math.sign(e.deltaY) * 60, 0, 3600); SFX.click(); return; }
  const now = performance.now(); if (now < wheelLock) return; if (Math.abs(e.deltaY) < 4) return; wheelLock = now + 450;
  setView(e.deltaY > 0 ? 'pov' : 'counter');
}, { passive: false });
addEventListener('keydown', e => { if (e.code === 'Space' || e.key === 'v' || e.key === 'V') { e.preventDefault(); setView(view === 'pov' ? 'counter' : 'pov'); } });

/* ---------- recipe cards on the ledge ---------- */
const CARDS = [];
function makeCards() {
  for (let i = 0; i < 3; i++) {
    const t = canvTex(380, 520, () => { });
    const m = mesh(new THREE.PlaneGeometry(0.095, 0.13), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }), LEDGE.x[i], LEDGE.y + 0.065, LEDGE.z, false); m.rotation.x = -0.12; m.rotation.z = [-0.05, 0.02, 0.06][i];
    m.userData.card = i; scene.add(m); CARDS.push({ mesh: m, tex: t });
  }
}
let cardSig = '';
function refreshCards() {
  CARDS.forEach((c, i) => {
    const R = recipe || RECIPES[i];
    c.mesh.visible = !recipe || i === 1; c.mesh.userData.card = recipe ? -1 : i;
    if (recipe && i === 1) { c.mesh.userData.card = null; c.mesh.userData.pinned = true; }
    repaint(c.tex, () => drawCard(190, 520, 380, 520, R, 0, !!recipe && i === 1, recipe ? ticks : null));
  });
  if (recipe) CARDS[1].mesh.userData.card = 99;
  cardSig = JSON.stringify(ticks);
}

/* ---------- simulation ---------- */
function tick3(dt) {
  const ivx = (PT.x - PT.lx) / Math.max(dt, 1e-3), ivy = (PT.y - PT.ly) / Math.max(dt, 1e-3);
  PT.vx = lerp(PT.vx, ivx, 0.3); PT.vy = lerp(PT.vy, ivy, 0.3); PT.speed = Math.hypot(PT.vx, PT.vy) * 1.4; PT.lx = PT.x; PT.ly = PT.y;
  CLOCK.mult = CLOCK.hold ? Math.min(120, CLOCK.mult * (1 + dt * 4) + dt * 30) : Math.max(1, CLOCK.mult * (1 - dt * 8));
  const dtG = dt * CLOCK.mult; gameT += dtG; const dtMin = dtG / 60;
  FRG.open += clamp(FRG.tgt - FRG.open, -dt * 2.4, dt * 2.4);
  OVN.open += clamp(OVN.tgt - OVN.open, -dt * 2.2, dt * 2.2);
  OV.open = OVN.open;
  updateCamera(dt);
  // held item
  if (held) {
    const it = held.it, d = DEF[it.kind];
    const tg = carryTarget(it, false);
    if (tg) {
      if (d.tool && it.dipY != null) tg.y = Math.min(tg.y, it.dipY);
      const k = Math.min(1, dt * 22); it.p.lerp(tg, k);
    }
    it.zTarget = null;
    if (d.tool) { tool3(it, dt); if (it.tipAnim > 0) it.tipAnim -= dt; }
    else if (d.pour) pour3(it, dt);
    else { const r = recvUnder(it.p.x, it.p.y, it.p.z, 0.4, it, 0.03); if (r) it.zTarget = r.p.z; }
    setPour(it.stream ? it.stream.type : null, it.stream ? (it.stream.rate || 20) : 0);
  } else setPour(null, 0);
  if (heldDough) { const tg = carryTarget(null, true); if (tg) heldDough.grab.target.lerp(tg, Math.min(1, dt * 20)); }
  for (const it of items) {
    if (it.falling) { it.vy += 9.8 * dt; it.p.y -= it.vy * dt; if (it.p.y <= it.landY) land3(it); }
    else if (it.flyHome) { it.flyHome -= dt * 2.2; it.p.lerp(it.home.p, 0.18); if (it.flyHome <= 0 || it.p.distanceTo(it.home.p) < 0.004) { it.flyHome = 0; it.p.copy(it.home.p); it.zone = it.home.zone; if (it.zone === 'fridge') FRG.tgt = 1; } }
  }
  // mixer
  const bowl = mixBowl(); MX.spin += dt * MX.speed * 9;
  if (MX.speed && bowl && bowl.m.total() > 1 && MX.attach) {
    const m = bowl.m, s = MX.speed, f = m.form(), t = m.total(), sz = Math.sqrt(Math.max(1, t / 300));
    if (MX.attach === 'whisk') {
      if (['dough', 'shaggy', 'cookie'].includes(f) && (m.g.flour || 0) > t * 0.3) { m.mix = Math.min(1, m.mix + (f === 'cookie' ? 0.02 : 0.006) * s * dt); hintOnce('clogm', 'Thick dough is clogging the whisk. Swap in the dough hook from the rail.'); }
      else { m.mix = Math.min(1, m.mix + 0.07 * s * dt / sz); if ((m.g.flour || 0) < t * 0.05 && m.g.egg) m.whip = Math.min(1, m.whip + 0.011 * s * dt * (m.g.sugar ? 1 : 0.5)); else if ((m.g.flour || 0) > t * 0.1 && m.whip > 0) m.whip = Math.max(0, m.whip - 0.004 * s * s * dt); if (m.g.butter && m.g.sugar && !m.g.flour) m.whip = Math.min(0.5, m.whip + 0.004 * s * dt); }
    } else { if (['dough', 'shaggy', 'loose', 'cookie'].includes(f)) { m.mix = Math.min(1, m.mix + 0.05 * s * dt / sz); if (m.mix > 0.6 && f !== 'loose') m.knead = Math.min(1.3, m.knead + 0.009 * s * dt); } else m.mix = Math.min(1, m.mix + 0.012 * s * dt); }
    m.yolk = Math.max(0, m.yolk - 0.5 * s * dt); m.swirl += s * dt * 4;
    if (s === 3 && (m.g.flour || 0) > 20 && m.mix < 0.5 && Math.random() < 0.6) { parts.push({ type: 'puff', p: V3(MXR.seat.x + (Math.random() - 0.5) * 0.15, CT + 0.17, (Math.random() - 0.5) * 0.15), v: V3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.1, (Math.random() - 0.5) * 0.15), life: 1 }); hintOnce('puff', 'Whoosh, flour everywhere! Start slow, then speed up.'); }
  }
  setHum(MX.speed);
  // oven
  OV.light = OV.set > 0 ? 1 : 0; OV.heating = OV.set >= 30 && OV.temp < OV.set - 1;
  if (OV.heating) OV.temp = Math.min(OV.set, OV.temp + (OVN.open > 0.5 ? 0.15 : 0.6) * dtG);
  OV.temp += -(OV.temp - 22) * (OVN.open > 0.5 ? 0.012 : 0.0008) * dtG;
  if (!OV.heating && OV.set >= 30 && OV.temp > OV.set + 1) OV.temp -= Math.min(OV.temp - OV.set, 0.05 * dtG);
  if (OV.timer > 0) { OV.timer = Math.max(0, OV.timer - dtG); if (OV.timer === 0) { SFX.ding(); say('Ding! The oven timer is up.', 4); } }
  for (const it of [...items, ...doughs]) {
    const inOven = it.zone === 'oven', env = inOven ? OV.temp : 22, rate = inOven ? 0.8 : it.zone === 'rack' ? 0.16 : it.zone === 'fridge' ? 0.15 : 0.07;
    it.temp += (env - it.temp) * (1 - Math.exp(-dtMin * rate)); if (it.zone === 'fridge') it.temp += (5 - it.temp) * (1 - Math.exp(-dtMin * 0.15));
    const m = it.kind === 'tray' ? null : it.m;
    if (m && m.form() === 'dough' && m.g.yeast > 0 && m.mix > 0.6 && it.temp < 50) { const yf = clamp((m.g.yeast / (m.g.flour || 1)) / 0.0175, 0, 1.6) * (m.g.salt > (m.g.flour || 1) * 0.04 ? 0.6 : 1); const loc = it.zone === 'fridge' ? 0.1 : (inOven && it.temp > 26) ? 1.4 : 1; m.proof += yf / 45 * dtMin * loc; }
    if (DEF[it.kind]?.pan && inOven) bakeStep(it, dtMin);
  }
  for (const it of items) if (it.zone === 'rack' && it.bake && it.bake.b > 0.15 && !judged.has(it.id)) { if (it.temp < 45) { judged.add(it.id); judge(it); } else hintOnce('cool' + it.id, 'Let it cool on the rack. Hold the clock to pass the time.'); }
  // particles
  for (const p of parts) {
    p.life -= dt;
    if (p.type === 'puff' || p.type === 'steam') { p.p.addScaledVector(p.v, dt); p.v.multiplyScalar(0.96); continue; }
    p.v.y -= 9.8 * dt; p.p.addScaledVector(p.v, dt);
    if (p.p.y <= p.land) { if (p.type === 'chunk' && !p.b) { p.b = 1; p.v.y *= -0.3; p.v.x *= 0.5; p.v.z *= 0.5; p.p.y = p.land; continue; } p.life = 0; if (p.type === 'powder' && Math.random() < 0.2) parts.push({ type: 'puff', p: p.p.clone(), v: V3((Math.random() - 0.5) * 0.04, 0.02 + Math.random() * 0.03, (Math.random() - 0.5) * 0.04), life: 0.7 }); }
  }
  parts = parts.filter(p => p.life > 0); if (parts.length > 1800) parts.splice(0, parts.length - 1800);
  for (const it of items) if (it.temp > 60 && it.zone !== 'oven' && Math.random() < dt * 6) parts.push({ type: 'steam', p: V3(it.p.x + (Math.random() - 0.5) * it.rad, it.p.y + it.h + 0.02, it.p.z + (Math.random() - 0.5) * it.rad), v: V3((Math.random() - 0.5) * 0.01, 0.05 + Math.random() * 0.03, 0), life: 1.8 });
  doughs.forEach(d => d.update(dt));
  updateCracks3(dt);
  decals.forEach(d => { d.t += dt; if (d.t > 45) d.mesh.material.opacity = Math.max(0, 1 - (d.t - 45) / 15); });
  decals = decals.filter(d => { if (d.t > 60) { scene.remove(d.mesh); return false; } return true; });
  patches = patches.filter(p => { if (p.amt < 0.3) { scene.remove(p.mesh); return false; } return true; });
  if (toast) { toast.life -= dt; if (toast.life <= 0) toast = null; }
  if (scorecard) scorecard.t += dt;
  if (recipe) { recipe.steps.forEach((s, i) => { if (!ticks[i]) { try { if (s.c()) ticks[i] = true; } catch (_) { } } }); if (JSON.stringify(ticks) !== cardSig) refreshCards(); }
  let gross = 0; items.forEach(i => { if (i.zone === 'scale') gross += weight3(i); }); doughs.forEach(d => { if (d.zone === 'scale') gross += d.m.total(); });
  SCALE.disp += (gross - SCALE.disp) * Math.min(1, dt * 7);
}

/* ---------- visuals sync ---------- */
const PMAX = 2000;
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PMAX * 3), 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(PMAX * 3), 3));
const dotTex = canvTex(32, 32, (c) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
const pPts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.0035, vertexColors: true, map: dotTex, transparent: true, alphaTest: 0.2, depthWrite: false })); pPts.frustumCulled = false;
const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
const fPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: 0.03, color: 0xffffff, map: dotTex, transparent: true, opacity: 0.22, depthWrite: false })); fPts.frustumCulled = false;
let streamMesh = null;
function syncParticles() {
  const pa = pGeo.attributes.position.array, ca = pGeo.attributes.color.array, fa = fGeo.attributes.position.array; let n = 0, f = 0;
  for (const p of parts) {
    if (p.type === 'puff' || p.type === 'steam') { if (f < 600) { fa[f * 3] = p.p.x; fa[f * 3 + 1] = p.p.y; fa[f * 3 + 2] = p.p.z; f++; } continue; }
    if (n >= PMAX) continue; pa[n * 3] = p.p.x; pa[n * 3 + 1] = p.p.y; pa[n * 3 + 2] = p.p.z;
    const c = p.type === 'powder' ? [250, 248, 243] : p.col; ca[n * 3] = Math.pow(c[0] / 255, 2.2); ca[n * 3 + 1] = Math.pow(c[1] / 255, 2.2); ca[n * 3 + 2] = Math.pow(c[2] / 255, 2.2); n++;
  }
  pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  fGeo.setDrawRange(0, f); fGeo.attributes.position.needsUpdate = true;
  // liquid stream
  const s = held && held.it.stream;
  if (streamMesh) { scene.remove(streamMesh); streamMesh.geometry.dispose(); streamMesh = null; }
  if (s && (s.type === 'liquid' || s.type === 'water' || s.type === 'thick' || s.type === 'blob' || s.type === 'powder')) {
    const a = s.a, b = s.type === 'blob' ? s.a.clone().lerp(s.b, s.k) : s.b, mid = a.clone().lerp(b, 0.35); mid.y = a.y - (a.y - b.y) * 0.1;
    if (s.type !== 'blob') { const dir = held.it.pdir; mid.x += dir.x * 0.012; mid.z += dir.z * 0.012; }
    const r = s.type === 'blob' ? 0.018 : s.type === 'thick' ? 0.0035 + Math.sqrt(s.rate) * 0.0009 : s.type === 'powder' ? 0.003 : 0.0015 + Math.sqrt(s.rate) * 0.0005;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const mat = s.type === 'water' ? MAT.water : s.type === 'blob' ? MAT.dough : s.type === 'powder' ? STREAM_POWDER : streamMat(s.col);
    streamMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, r, 10, false), mat); streamMesh.castShadow = false; scene.add(streamMesh);
  }
}
const STREAM_POWDER = new THREE.MeshStandardMaterial({ color: 0xfbf9f4, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false });
const streamMats = {}; function streamMat(c) { const k = c.map(v => Math.round(v / 8)).join(); if (!streamMats[k]) streamMats[k] = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(c)), roughness: 0.15, clearcoat: 0.6 }); return streamMats[k]; }
function colorOf(c) { return new THREE.Color(rgb(c)); }
function sigOf(m) { return m.order.join() + '|' + Math.round(m.total()) + '|' + Math.round(m.mix * 40) + '|' + Math.round(m.yolk * 10) + '|' + m.shell + '|' + Math.round(m.swirl * 2) + '|' + Math.round(m.whip * 10) + '|' + Math.round(m.proof * 20); }
const cookieTex = canvTex(128, 128, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128); noiseFill(c, 128, 128, 500, '120,80,40', 0.3, 2); c.fillStyle = '#2b170d'; for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(Math.random() * 128, Math.random() * 128, 4 + Math.random() * 3, 3, Math.random() * 3, 0, TAU); c.fill(); } });
function syncItem(it) {
  const d = DEF[it.kind];
  it.root.position.copy(it.p);
  it.root.rotation.set(0, 0, 0);
  if (d.tool) {
    if (it.pose === 'lie') it.root.rotation.z = Math.PI / 2;
    else if (it.zone === 'mixer') { const pv = FIX.attachPivot.getWorldPosition(V3(0, 0, 0)); it.p.set(pv.x + Math.cos(MX.spin * 0.25) * 0.012 * (MX.speed ? 1 : 0), pv.y - it.h, pv.z + Math.sin(MX.spin * 0.25) * 0.012 * (MX.speed ? 1 : 0)); it.root.position.copy(it.p); it.root.rotation.y = MX.spin; }
    else if (it.zone === 'held') { const sw = clamp(PT.vx * 0.0004, -0.3, 0.3); it.root.rotation.z = -sw; if (it.tipAnim > 0) it.root.rotation.x = Math.sin(it.tipAnim / 0.35 * Math.PI) * 1.0; }
    it.root.visible = it.zone !== 'oven' || OVN.open > 0.1 || true;
  } else if (it.zone === 'held' && !it.stream && it.tilt < 0.01) { it.pivot.quaternion.identity(); it.pivot.rotation.z = clamp(-PT.vx * 0.0003, -0.25, 0.25); }
  else if (it.zone !== 'held') it.pivot.quaternion.identity();
  it.root.visible = it.zone !== 'fridge' || FRG.open > 0.02;
  // contents
  const P = it.parts;
  if (it.m && P.disc && it.kind !== 'tray') {
    const m = it.m, tot = m.total();
    let surfL = 0, discR = 0;
    if (PROF[it.kind]) { const pr = PROF[it.kind]; surfL = heightFor(pr.vol, m.vol()); discR = radiusAt(pr.inner, surfL) * 0.985; }
    else if (it.kind === 'loaf') { surfL = 0.004 + Math.min(1, m.vol() / (LOAF.iw * LOAF.id * LOAF.h * 1e6)) * LOAF.h; discR = 1; }
    const bk = it.bake, form = m.form();
    const show = tot > 0.5;
    P.disc.visible = show;
    if (show) {
      let sl = surfL;
      if (it.kind === 'tin' && bk) sl = Math.min(PROF.tin.inner.at(-1)[1], surfL * (1 + bk.rise * 1.35));
      P.disc.position.y = sl + 0.0008;
      if (it.kind !== 'loaf') { const r = PROF[it.kind] ? radiusAt(PROF[it.kind].inner, sl) * 0.985 : discR; P.disc.scale.set(r, r, 1); }
      const sig = sigOf(m) + '|' + (bk ? Math.round(bk.brown * 30) : '');
      if (P.disc.userData.sig !== sig) {
        P.disc.userData.sig = sig;
        repaint(P.disc.userData.tex, () => { if (bk && bk.brown > 0.02) { const col = crustColor(bk.brown, m.color()); drawBakedTop(128, 128, 126, 126, col, bk, m); } else drawSurface(m, 128, 128, 126, 126); });
      }
      if (P.body) {
        const glassBody = (it.kind === 'bowlL' || it.kind === 'jug');
        if (glassBody) {
          const key = Math.round(surfL * 2000) + '|' + m.color().map(v => Math.round(v / 6)).join() + (m.kinds().length === 1 && m.g.water ? 'w' : '');
          if (P.body.userData.key !== key) {
            P.body.userData.key = key; P.body.geometry.dispose();
            const pr = PROF[it.kind].inner.filter(p => p[1] < surfL).map(p => new THREE.Vector2(p[0] * 0.985, p[1])); pr.push(new THREE.Vector2(radiusAt(PROF[it.kind].inner, surfL) * 0.985, surfL));
            if (pr.length >= 2) P.body.geometry = new THREE.LatheGeometry(pr, 48);
            const wat = m.kinds().length === 1 && m.g.water; P.body.material.color = colorOf(m.color()); P.body.material.transmission = 0; P.body.material.transparent = !!wat; P.body.material.opacity = wat ? 0.45 : 1; P.body.material.needsUpdate = true;
          }
          P.body.visible = true;
        }
      }
    } else if (P.body) P.body.visible = false;
    // dough dome / baked dome
    if (P.dome) {
      let vis = false;
      if (it.kind === 'tin' && bk && surfL * (1 + bk.rise * 1.35) > PROF.tin.inner.at(-1)[1]) {
        const over = Math.min(0.045, surfL * (1 + bk.rise * 1.35) - PROF.tin.inner.at(-1)[1]); vis = true;
        P.dome.position.y = PROF.tin.inner.at(-1)[1]; P.dome.scale.set(0.097, over, 0.097); P.dome.material.color = colorOf(crustColor(bk.brown, m.color())); P.dome.material.sheen = 0;
      } else if (['dough', 'shaggy', 'cookie'].includes(form) && show) {
        vis = true; const proof = form === 'dough' ? Math.min(m.proof, 1.9) : 0;
        if (it.kind === 'loaf') { const hh = (surfL * (1 + proof * 0.85) * (1 + (bk ? bk.rise : 0))) ; const over = Math.max(0.012, hh - LOAF.h * 0.55); P.dome.position.y = Math.min(hh, LOAF.h * 0.55); P.dome.scale.set(LOAF.iw / 2 * 0.98, over, LOAF.id / 2 * 0.98); }
        else { const r = radiusAt(PROF[it.kind].inner, surfL) * (0.72 + proof * 0.12); P.dome.position.y = surfL; P.dome.scale.set(r, r * (0.45 + proof * 0.45), r); }
        P.dome.material.color = colorOf(bk && bk.brown > 0.02 ? crustColor(bk.brown, m.color()) : form === 'cookie' ? m.color() : [236, 220, 189]);
        P.dome.material.map = form === 'cookie' ? cookieTex : TX.speck; P.dome.material.needsUpdate = true;
      }
      P.dome.visible = vis;
    }
  }
  if (it.kind === 'tray') {
    const g = P.balls; while (g.children.length < it.balls.length) g.add(mesh(new THREE.SphereGeometry(1, 24, 14), new THREE.MeshPhysicalMaterial({ map: cookieTex, roughness: 0.75, sheen: 0.3 })));
    while (g.children.length > it.balls.length) g.remove(g.children[g.children.length - 1]);
    const bk = it.bake;
    it.balls.forEach((b, i) => { const ms = g.children[i], r = 0.0098 * Math.cbrt(b.g) * 0.8; const sp = bk ? 1 + Math.min(0.35, bk.spread * 0.45) * sstep(0, 0.55, bk.b) : 1; ms.position.set(b.x, 0.004, b.z); ms.scale.set(r * sp, r * (0.7 - 0.5 * (sp - 1)), r * sp); ms.material.color = colorOf(bk && bk.brown > 0.02 ? crustColor(bk.brown * 0.95, b.m.color()) : b.m.color()); });
  }
  if (P.fill && it.stock != null) { const max = DEF[it.kind].stock, f = clamp(it.stock / max, 0, 1), H = it.h * 0.88 * f; P.fill.visible = f > 0.002; P.fill.scale.y = Math.max(0.0001, H); P.fill.position.y = 0.005 + H / 2; }
  if (P.fill && (it.kind === 'tbsp' || it.kind === 'tsp')) { const has = it.m.total() > 0.05; P.fill.visible = has; if (has) P.fill.material.color = colorOf(it.m.color()); }
  if (it.kind === 'eggs') P.eggs.forEach((e, i) => e.visible = i < it.count);
  if (it.kind === 'butter') { const len = Math.max(0.0001, 0.12 * it.grams / 250); P.block.scale.x = len; P.block.position.x = -0.08 + len / 2; P.block.visible = it.grams > 0.5; const wl = Math.min(len, 0.06); P.wrap.scale.x = wl; P.wrap.position.x = -0.08 + wl / 2; P.wrap.visible = it.grams > 0.5; }
  if (it.kind === 'butterPiece') { const len = 0.12 * it.g / 250; P.block.scale.x = len; }
}
function syncFixed() {
  FIX.fridgeDoor.rotation.y = -sstep(0, 1, FRG.open) * Math.PI * 0.86;
  FIX.fridgeLight.intensity = FRG.open > 0.05 ? 1.2 * FRG.open : 0;
  FIX.ovenDoor.rotation.x = sstep(0, 1, OVN.open) * Math.PI * 0.48;
  FIX.knobTemp.rotation.z = -(-Math.PI * 0.75 + OV.set / 250 * Math.PI * 1.5);
  FIX.knobTimer.rotation.z = -(-Math.PI * 0.75 + OV.timer / 3600 * Math.PI * 1.5);
  FIX.lamp.material.emissive.setHex(OV.heating ? 0xff7a10 : 0x000000); FIX.lamp.material.emissiveIntensity = OV.heating ? 3 : 0;
  const glow = OV.heating ? 1 : clamp((OV.temp - 60) / 300, 0, 0.5); FIX.element.material.emissive.setRGB(glow * 1.0, glow * 0.3, glow * 0.05); FIX.element.material.emissiveIntensity = glow * 2.5;
  FIX.ovenLight.intensity = OV.set > 0 ? 2.2 : 0;
  const s = gameT % 60, mi = (gameT / 60) % 60, h = (gameT / 3600) % 12;
  FIX.hSec.rotation.z = -s / 60 * TAU; FIX.hMin.rotation.z = -mi / 60 * TAU; FIX.hHour.rotation.z = -h / 12 * TAU; FIX.hSec.visible = CLOCK.mult < 6;
  FIX.lever.rotation.z = 0.6 - MX.speed * 0.4;
  const val = Math.round(SCALE.disp - SCALE.tare), vs = (Math.abs(val) < 1 ? '0' : val) + '';
  if (FIX.lcdTex.userData.v !== vs) { FIX.lcdTex.userData.v = vs; repaint(FIX.lcdTex, (c, w, hh) => { c.fillStyle = '#aebcaa'; c.fillRect(0, 0, w, hh); c.fillStyle = '#1f2620'; c.font = '600 46px ui-monospace, Menlo, monospace'; c.textAlign = 'right'; c.fillText(vs, w - 44, 50); c.font = '600 22px Inter, sans-serif'; c.fillText('g', w - 14, 50); }); }
  FIX.mitt.visible = !MITT_WORN.v;
}

/* ---------- overlay UI ---------- */
function hover3() {
  if (held || heldDough || drag || scorecard || !PT.has) return null;
  if (viewToggleHit(PT.x, PT.y)) return view === 'pov' ? 'Step back (scroll up or Space)' : 'Lean over the counter (scroll down or Space)';
  const h = pick3(PT.x, PT.y); if (!h) return null;
  if (h.card != null) return null;
  if (h.ctrl) {
    const c = h.ctrl;
    if (c === 'clock') { const hh = Math.floor(gameT / 3600) % 24, mm = Math.floor(gameT / 60) % 60; return `${hh}:${String(mm).padStart(2, '0')} · hold the clock to make time fly`; }
    if (c === 'knobTemp') return `Oven temperature · drag or scroll · ${OV.set ? OV.set + ' °C' : 'off'}`;
    if (c === 'knobTimer') return `Timer · ${Math.floor(OV.timer / 60)}:${String(Math.floor(OV.timer % 60)).padStart(2, '0')}`;
    if (c === 'ovenDoor') return `Oven · ${Math.round(OV.temp)} °C${OV.set ? ' → ' + OV.set + ' °C' : ' · off'} · click to ${OVN.open > 0.5 ? 'close' : 'open'}`;
    if (c === 'fridgeDoor') return FRG.open > 0.5 ? 'Close the fridge' : 'Fridge · click to open';
    if (c === 'tare') return 'Tare: zero the scale';
    if (c === 'lever') return `Speed lever · ${MX.speed ? 'speed ' + MX.speed : 'off'} · click to change`;
    if (c === 'mitt') return MITT_WORN.v ? 'Hang the oven mitt back up' : 'Oven mitt · click to put it on';
    if (c === 'mixer') return `Stand mixer · ${MX.attach ? (MX.attach === 'hook' ? 'dough hook' : 'whisk') + ' fitted' : 'no attachment'}`;
    return null;
  }
  if (h.dough) { const d = h.dough; return `Dough · ${fmtG(d.m.total())} · ${d.m.knead > 0.75 ? 'smooth and elastic' : 'kneaded ' + Math.round(d.m.knead / 0.75 * 100) + '%'}${d.sticky() > 0.5 ? ' · sticky' : ''}`; }
  const it = h.it, d = DEF[it.kind]; let s = d.name;
  if (d.src) s += ` · ${fmtG(Math.max(0, it.stock))} left`;
  else if (it.kind === 'eggs') s += ` · ${it.count} left`;
  else if (it.kind === 'butter') s += ` · ${Math.round(it.grams)} g · grab where you want to cut`;
  else if (it.kind === 'butterPiece') s += ` · ${it.g} g`;
  else if (it.kind === 'tray') s += it.balls.length ? ` · ${it.balls.length} cookie${it.balls.length > 1 ? 's' : ''}` : ' · empty';
  else if (it.m && !d.tool) s += ` · ${it.m.total() > 0.5 ? fmtG(it.m.total()) + ', ' + it.m.describe() : 'empty'}`;
  else if (d.spoon && it.m.total() > 0.05) s += ` · ${it.m.total().toFixed(1)} g`;
  if (it.bake) s += ` · ${it.bake.b < 0.7 ? 'baking' : it.bake.b < 0.92 ? 'nearly done' : it.bake.brown > 1.45 ? 'very dark' : 'baked'}`;
  if (it.temp > 55) s += ' · hot!';
  return s;
}
function hint3() {
  if (scorecard) return '';
  if (!recipe) return 'Pick a recipe card from the ledge under the clock.';
  if (held) { const it = held.it, d = DEF[it.kind]; if (d.spoon) return it.m.total() > 0.05 ? 'Hold the spoon over a bowl or the tray to tip it in.' : 'Hover the spoon over a jar or bag to dip a level spoonful.'; if (d.mixer) return 'Hold it over a bowl and stir in circles.'; if (d.att) return 'Fit it onto the mixer head, or hang it back on the rail.'; if (it.kind === 'egg') return 'Let go over a bowl to crack it on the rim.'; if (it.kind === 'butterPiece') return 'Drop it into a bowl.'; if (d.pour) return 'Hold still over a bowl to pour; move away to stop.'; }
  if (heldDough) return 'Stretch, fold and push to knead. Drop it into a bowl or the loaf pan.';
  if (drag && drag.type === 'clock') return 'Time is flying…';
  const i = ticks.findIndex(t => !t); return i >= 0 ? 'Next: ' + recipe.steps[i].t : '';
}
let hoverCache = null, hoverFrame = 0;
function drawUI3() {
  ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); ctx.clearRect(0, 0, uiW, uiH);
  const sc = Math.min(1.15, Math.max(0.75, uiW / 1400));
  if ((hoverFrame++ % 3) === 0) hoverCache = hover3();
  const h = hint3();
  if (h) { ctx.font = `500 ${15 * sc}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; const tw = ctx.measureText(h).width + 28; ctx.fillStyle = 'rgba(255,253,249,.82)'; rr(uiW / 2 - tw / 2, uiH - 46 * sc, tw, 30 * sc, 15 * sc); ctx.fill(); ctx.fillStyle = 'rgba(60,54,48,.9)'; ctx.fillText(h, uiW / 2, uiH - 26 * sc); }
  if (hoverCache && !MITT_WORN.v || (hoverCache && MITT_WORN.v)) { ctx.font = '500 13px Inter, system-ui, sans-serif'; const tw = ctx.measureText(hoverCache).width + 20; let tx = clamp(PT.x + 16, 8, uiW - tw - 8), ty = PT.y + 26; if (ty > uiH - 40) ty = PT.y - 40; ctx.fillStyle = 'rgba(38,34,30,.86)'; rr(tx, ty, tw, 26, 6); ctx.fill(); ctx.fillStyle = '#f6f2ec'; ctx.textAlign = 'left'; ctx.fillText(hoverCache, tx + 10, ty + 17.5); }
  if (toast) { const a = clamp(toast.life * 2, 0, 1); ctx.font = '600 16px Inter, system-ui, sans-serif'; const tw = ctx.measureText(toast.t).width + 32; const ty0 = (recipe && !scorecard && !notesFolded() ? 12 + NH * noteScale() : 30) + 74; ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,253,248,.95)'; rr(uiW / 2 - tw / 2, ty0, tw, 38, 19); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.stroke(); ctx.fillStyle = '#3b3631'; ctx.textAlign = 'center'; ctx.fillText(toast.t, uiW / 2, ty0 + 24); ctx.globalAlpha = 1; }
  // recipe card zoom
  if (!held && !heldDough && !drag && !scorecard && PT.has) {
    const hit = pick3(PT.x, PT.y); let R = null;
    if (hit && hit.card != null) R = hit.card === 99 ? recipe : RECIPES[hit.card];
    if (R) {
      const lines = Math.ceil(R.lines.length / 2) + R.steps.reduce((s, st) => s + Math.ceil(st.t.length / 40), 0), ch = 130 + lines * 22 + 30;
      const k = Math.min(1, (uiH - 80) / ch, (uiW - 40) / 420); ctx.save(); ctx.translate(uiW / 2, 30); ctx.scale(k, k);
      drawCard(0, ch, 420, ch, R, -0.01, true, recipe === R ? ticks : null);
      if (!recipe) { ctx.font = '600 14px Inter, system-ui, sans-serif'; ctx.fillStyle = '#3b3631'; ctx.textAlign = 'center'; ctx.fillText('Click the card to bake this', 0, ch + 26); }
      ctx.restore();
    }
  }
  if (scorecard) drawScore3();
  if (MITT_WORN.v && PT.has) drawMitt(PT.x + 4, PT.y + 30, 0.7, -0.25);
  ctx = UI.getContext('2d');
}
function drawScore3() {
  const s = scorecard, a = sstep(0, 0.5, s.t);
  ctx.fillStyle = `rgba(40,34,28,${0.35 * a})`; ctx.fillRect(0, 0, uiW, uiH);
  const k = Math.min(1, (uiH - 40) / 470, (uiW - 30) / 560);
  ctx.save(); ctx.translate(uiW / 2, lerp(-300, uiH / 2, sstep(0, 0.6, s.t))); ctx.scale(k, k); ctx.rotate(-0.015);
  const w = 560, h = 470;
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  ctx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, '#fffdf8'], [1, '#f4efe4']]); ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(230,200,120,.6)'; ctx.save(); ctx.rotate(0.04); ctx.fillRect(-50, -h / 2 - 12, 100, 26); ctx.restore();
  ctx.fillStyle = '#2d3a4f'; ctx.textAlign = 'center'; ctx.font = '700 40px Caveat, cursive'; ctx.fillText(s.R.name, 0, -h / 2 + 56);
  if (s.snap) ctx.drawImage(s.snap, -110, -h / 2 + 72, 220, 124); else { ctx.save(); ctx.translate(0, -h / 2 + 140); ctx.scale(2.4, 2.4); drawCardIcon(s.R.product); ctx.restore(); }
  for (let i = 0; i < 5; i++) { const x = -88 + i * 44, y = -h / 2 + 222, f = clamp(s.stars - i, 0, 1); star(x, y, 17, '#e3dccd'); if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 20, 40 * f, 40); ctx.clip(); star(x, y, 17, '#e0a43a'); ctx.restore(); } }
  ctx.font = '500 24px Caveat, cursive'; ctx.textAlign = 'left'; let y = -h / 2 + 272;
  s.good.forEach(g => { ctx.fillStyle = '#4c7a4a'; ctx.fillText('+ ' + g, -w / 2 + 40, y); y += 28; });
  s.notes.forEach(n => { ctx.fillStyle = '#9a4434'; wrapText('– ' + n, 0, 0, w - 80).forEach((l, i) => { ctx.fillText(l, -w / 2 + 40 + (i ? 14 : 0), y); y += 26; }); });
  if (!s.notes.length) { ctx.fillStyle = '#2d3a4f'; ctx.fillText('A bake to be proud of.', -w / 2 + 40, y); }
  ctx.font = '500 13px Inter, system-ui, sans-serif'; ctx.fillStyle = '#8a7f72'; ctx.textAlign = 'center'; ctx.fillText('Click the card to tidy the kitchen and bake again', 0, h / 2 - 18);
  ctx.restore();
}
function snapBake(it) {
  // a small photo of the finished bake for the score card
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 5); const c = it.p.clone().add(V3(0, it.h * 0.6, 0));
  cam.position.copy(c).add(V3(0, 0.22, 0.42)); cam.lookAt(c);
  const rt = new THREE.WebGLRenderTarget(440, 248, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
  const px = new Uint8Array(440 * 248 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 440, 248, px);
  const cnv = document.createElement('canvas'); cnv.width = 440; cnv.height = 248; const g = cnv.getContext('2d'); const id = g.createImageData(440, 248);
  for (let y = 0; y < 248; y++) id.data.set(px.subarray((247 - y) * 440 * 4, (248 - y) * 440 * 4), y * 440 * 4);
  g.putImageData(id, 0, 0); rt.dispose(); return cnv;
}

/* ---------- boot ---------- */
const STATIC = new THREE.Group();
function resize3() {
  uiDPR = Math.min(2, window.devicePixelRatio || 1); uiW = innerWidth; uiH = innerHeight;
  UI.width = Math.round(uiW * uiDPR); UI.height = Math.round(uiH * uiDPR);
  renderer.setSize(uiW, uiH, false);
}
addEventListener('resize', resize3);
const ctx2 = document.createElement('canvas').getContext('2d'); ctx = ctx2; makeTextures(); ctx = UI.getContext('2d');
makeTex(); makeMats(); makeEnv(); makeLights(); buildRoom(); scene.add(pPts, fPts); makeCards();
const origJudge = judge; judge = function (it) { origJudge(it); try { scorecard.snap = snapBake(it); } catch (e) { } };
resize3(); build3();
let last3 = performance.now();
function frame3(now) { const dt = Math.min(0.05, (now - last3) / 1000); last3 = now; step3(dt); requestAnimationFrame(frame3); }
function step3(dt) {
  try { tick3(dt); } catch (e) { console.error(e); }
  try { items.forEach(syncItem); syncFixed(); syncParticles(); renderer.render(scene, camera); drawUI3(); } catch (e) { console.error(e); }
  UI.style.cursor = MITT_WORN.v ? 'none' : (held || heldDough) ? 'grabbing' : drag ? 'grabbing' : hoverCache ? 'grab' : 'default';
}
requestAnimationFrame(frame3);
