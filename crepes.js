'use strict';
/* =========================================================
   Crêpes: a drawer under the oven holds an electric crêpe
   maker, a wooden spreader and a crêpe turner.
   Pour batter on the hot plate, spread it thin, flip it,
   lift it onto a plate. Crêpes stack up (flat for a mille
   crêpe cake, folded into quarters for a plate of crêpes).
   ========================================================= */

const CRP = {};
/* ---------- things ---------- */
Object.assign(DEF, {
  crepemaker: { name: 'Crêpe maker', cont: 1, cap: 140, recv: 1, tare: 1600 },
  spreader: { name: 'Crêpe spreader', tool: 1, crepeSpread: 1, tare: 30 },
  turner: { name: 'Crêpe turner', tool: 1, crepeTurn: 1, tare: 40 },
});
Object.assign(SPEC, { crepemaker: { rad: 0.17, h: 0.075 }, spreader: { rad: 0.02, h: 0.2 }, turner: { rad: 0.02, h: 0.3 } });
const CRP_TOP = 0.07, CRP_R = 0.15;
PROF.crepemaker = { outer: [[0, 0], [0.17, 0], [0.17, CRP_TOP + 0.002]], inner: [[0, CRP_TOP], [CRP_R, CRP_TOP], [CRP_R, CRP_TOP + 0.003]] };
if (typeof volTable === 'function') try { PROF.crepemaker.vol = volTable(PROF.crepemaker.inner); } catch (e) { }
PAN_NAME.crepemaker = 'crêpe maker';

// golden cooked side: honey-coloured lacy browning that gets denser towards a crisp rim
function crepeTexture(golden) {
  return canvTex(512, 512, (c, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2;
    let g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    if (golden) { g.addColorStop(0, '#e9b665'); g.addColorStop(0.6, '#e2a656'); g.addColorStop(0.9, '#cf8a3c'); g.addColorStop(1, '#a9682a'); }
    else { g.addColorStop(0, '#fbf0d4'); g.addColorStop(0.85, '#f6e6c0'); g.addColorStop(1, '#ecd3a0'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const rnd = (a, b) => a + Math.random() * (b - a);
    if (golden) {
      // lace: clusters of soft caramel spots with lighter veins between them
      for (let i = 0; i < 1400; i++) {
        const rr = Math.sqrt(Math.random()) * R * 0.97, a = Math.random() * TAU, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        const sz = rnd(5, 16) * (0.7 + 0.5 * rr / R), al = rnd(0.28, 0.6) * (0.6 + 0.6 * rr / R);
        const sg = c.createRadialGradient(x, y, 0, x, y, sz); sg.addColorStop(0, `rgba(140,72,22,${al})`); sg.addColorStop(0.55, `rgba(160,88,30,${al * 0.65})`); sg.addColorStop(1, 'rgba(170,100,40,0)');
        c.fillStyle = sg; c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill();
      }
      c.strokeStyle = 'rgba(255,236,190,.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 160; i++) { const rr = Math.sqrt(Math.random()) * R * 0.9, a = Math.random() * TAU, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) c.lineTo(x + rnd(-14, 14), y + rnd(-14, 14)); c.stroke(); }
      // butter sheen highlights
      for (let i = 0; i < 60; i++) { const x = rnd(0, w), y = rnd(0, h), sz = rnd(10, 30), sg = c.createRadialGradient(x, y, 0, x, y, sz); sg.addColorStop(0, 'rgba(255,245,215,.18)'); sg.addColorStop(1, 'rgba(255,245,215,0)'); c.fillStyle = sg; c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill(); }
      // crisp lacy rim
      c.lineWidth = 6; c.strokeStyle = 'rgba(178,108,44,.55)'; c.beginPath(); c.arc(cx, cy, R - 4, 0, TAU); c.stroke();
    } else {
      // the top side while cooking: pale and matte with tiny bubbles
      for (let i = 0; i < 500; i++) { const rr = Math.sqrt(Math.random()) * R * 0.95, a = Math.random() * TAU, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; c.fillStyle = `rgba(214,184,128,${rnd(0.08, 0.2)})`; c.beginPath(); c.arc(x, y, rnd(1, 3), 0, TAU); c.fill(); }
    }
  });
}
const CRP_LACE = crepeTexture(true), CRP_PALE = crepeTexture(false);
// colour multiplier on top of the texture: white when perfect, darker when overcooked
function crepeTint(c) { if (c < 1.2) return [244, 226, 200]; return mixc([244, 226, 200], [110, 70, 44], sstep(1.2, 2, c)); }
function crepeMat(c, pale) { return new THREE.MeshPhysicalMaterial({ map: pale ? CRP_PALE : CRP_LACE, color: new THREE.Color(rgb(crepeTint(c))), roughness: 0.62, sheen: 0.18, sheenColor: new THREE.Color(0xffd890) }); }
const CRP_EDGE = new THREE.MeshStandardMaterial({ color: 0xe8be7c, roughness: 0.6 });
function crepeCol(c) { return crepeTint(c); }
function topCol(cr) { return cr.side === 0 ? [255, 252, 246] : crepeTint(cr.cook[0]); }
// a crêpe folded into quarters: a puffy wedge with soft edges, its tip at the crêpe's centre
function foldedGeo(r) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(r, 0); sh.absarc(0, 0, r, 0, Math.PI / 2, false); sh.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0022, bevelSegments: 3, curveSegments: 24 });
  const uv = geo.attributes.uv, pos = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / (2 * r) + 0.5, pos.getY(i) / (2 * r) + 0.5);
  // drape it a little so it doesn't look like a flat slice
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), rho = Math.hypot(x, y) / r, phi = Math.atan2(y, x); pos.setZ(i, pos.getZ(i) + 0.0026 * Math.sin(phi * 4) * rho + 0.002 * rho * rho); }
  geo.computeVertexNormals(); geo.rotateX(-Math.PI / 2); return geo;
}

function crepeModel(it) {
  const g = new THREE.Group(); it.parts = {};
  if (it.kind === 'crepemaker') {
    g.add(mesh(new THREE.CylinderGeometry(0.17, 0.175, 0.05, 48), MAT.plastic, 0, 0.025, 0));
    const plate = new THREE.MeshStandardMaterial({ color: 0x2b2b2d, metalness: 0.55, roughness: 0.38 }); it.parts.plateMat = plate;
    g.add(mesh(new THREE.CylinderGeometry(CRP_R + 0.006, CRP_R + 0.006, 0.02, 48), plate, 0, 0.06, 0));
    const rim = mesh(new THREE.TorusGeometry(CRP_R + 0.008, 0.004, 8, 48), MAT.chrome, 0, CRP_TOP, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
    const btn = mesh(new THREE.BoxGeometry(0.03, 0.018, 0.012), new THREE.MeshStandardMaterial({ color: 0xb8352a, roughness: 0.4 }), 0.05, 0.026, 0.172); btn.userData.ctrl = 'crepeBtn'; btn.userData.noItem = true; g.add(btn); it.parts.btn = btn;
    const light = mesh(new THREE.SphereGeometry(0.005, 10, 8), new THREE.MeshStandardMaterial({ color: 0x552018, emissive: 0x000000 }), -0.04, 0.03, 0.172); g.add(light); it.parts.light = light;
    const crepe = mesh(new THREE.CylinderGeometry(1, 1, 1, 48), [CRP_EDGE, crepeMat(0.9, true), crepeMat(0.9, false)], 0, CRP_TOP + 0.001, 0, false); crepe.visible = false; g.add(crepe); it.parts.crepe = crepe;
    const puddle = mesh(new THREE.CylinderGeometry(1, 1, 1, 32), new THREE.MeshPhysicalMaterial({ color: 0xf2e4bc, roughness: 0.25, clearcoat: 0.6 }), 0, CRP_TOP + 0.002, 0, false); puddle.visible = false; g.add(puddle); it.parts.puddle = puddle;
  } else if (it.kind === 'spreader') {
    const wood = MAT.wood || new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 0.6 });
    g.add(mesh(new THREE.BoxGeometry(0.14, 0.006, 0.012), wood, 0, 0.003, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10), wood, 0, 0.093, 0));
  } else {
    const wood = MAT.wood || new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 0.6 });
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.2, 0.003), wood, 0, 0.1, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 10), wood, 0, 0.255, 0));
  }
  g.traverse(o => { if (o.isMesh && !o.userData.noItem) o.userData.item = it; });
  return g;
}
const _bimCr = buildItemModel;
buildItemModel = function (it) { if (['crepemaker', 'spreader', 'turner'].includes(it.kind)) return crepeModel(it); return _bimCr(it); };
const _mainBowlCr = mainBowl;
mainBowl = function () { DEF.crepemaker.recv = 0; try { return _mainBowlCr(); } finally { DEF.crepemaker.recv = 1; } };

/* ---------- a drawer under the oven ---------- */
(function buildOvenDrawer() {
  const rm = []; FIX.room.children.forEach(o => { if (o.isMesh && o.geometry.parameters && Math.abs(o.position.x - 1.585) < 0.01 && Math.abs(o.position.z - 0.31) < 0.01 && Math.abs(o.position.y - 0.76) < 0.01) rm.push(o); });
  FIX.room.children.forEach(o => { if (o.isMesh && o.geometry.parameters && Math.abs(o.position.x - 1.585) < 0.01 && Math.abs(o.position.y - 0.73) < 0.01 && Math.abs(o.position.z - 0.33) < 0.01) rm.push(o); });
  rm.forEach(o => FIX.room.remove(o));
  const d = { i: DRW.length, x: 1.585, w: 0.7, floor: 0.79, open: 0, tgt: 0, slide: 0.42 };
  const g = new THREE.Group(); g.position.set(d.x, 0, 0); FIX.room.add(g); d.g = g;
  const front = box(0.7, 0.34, 0.022, MAT.cabinet, 0, 0.77, 0.311); g.add(front);
  const handle = box(0.26, 0.012, 0.02, MAT.brushed, 0, 0.9, 0.33); g.add(handle);
  const inner = new THREE.MeshStandardMaterial({ color: 0xe9e4dc, roughness: 0.7 });
  g.add(box(0.64, 0.01, 0.46, inner, 0, d.floor - 0.005, 0.07)); g.add(box(0.01, 0.12, 0.46, inner, -0.32, d.floor + 0.055, 0.07)); g.add(box(0.01, 0.12, 0.46, inner, 0.32, d.floor + 0.055, 0.07)); g.add(box(0.64, 0.12, 0.01, inner, 0, d.floor + 0.055, -0.16));
  [front, handle].forEach(o => { o.userData.ctrl = 'drawer' + d.i; });
  DRW.push(d); CRP.drawer = d.i;
})();
const _hoverCr = hover3;
hover3 = function () {
  if (PT.has && !BOOK.open && !AUTO.busy) {
    const h = pick3(PT.x, PT.y);
    if (h && h.ctrl === 'drawer' + CRP.drawer) return `${DRW[CRP.drawer].tgt ? 'Close' : 'Open'} drawer · crêpe maker, spreader, turner`;
    if (h && h.ctrl === 'crepeBtn') { const mk = maker(); return `Crêpe maker · ${mk && mk.on ? 'on' : 'off'} · click to switch ${mk && mk.on ? 'off' : 'on'}`; }
    if (h && h.it && h.it.kind === 'crepemaker') { const mk = h.it, cr = mk.cr; if (!mk.on) return 'Crêpe maker · off · press the red switch'; if (mk.heat < 0.9) return `Crêpe maker · heating ${Math.round(mk.heat * 100)}%`; if (!cr) return 'Crêpe maker · hot · pour a little batter in the middle'; return `Crêpe · ${cr.side ? 'second side' : 'first side'} · ${Math.round(Math.min(1, cr.cook[cr.side]) * 100)}% cooked`; }
  }
  return _hoverCr();
};

/* ---------- the maker heats, the crêpe cooks ---------- */
function maker() { return items.find(i => i.kind === 'crepemaker'); }
const _pickCtrlCr = pickCtrl;
pickCtrl = function (c) {
  if (c === 'crepeBtn') { const mk = maker(); if (mk) { mk.on = !mk.on; SFX.click(); mk.parts.btn.position.z = 0.168; setTimeout(() => mk.parts.btn && (mk.parts.btn.position.z = 0.172), 150); say(mk.on ? 'Crêpe maker on. Wait for the green light.' : 'Crêpe maker off.', 2); } return; }
  _pickCtrlCr(c);
};
const _tickCr = tick3;
tick3 = function (dt) {
  _tickCr(dt);
  const dtG = dt * CLOCK.mult;
  for (const mk of items) {
    if (mk.kind !== 'crepemaker' || !mk.parts || !mk.parts.crepe) continue;
    if (mk.zone === 'drawer' || mk.zone === 'held') mk.on = mk.on && mk.zone !== 'drawer';
    mk.heat = clamp((mk.heat || 0) + (mk.on ? dtG / 45 : -dtG / 150), 0, 1);
    const hot = mk.heat >= 0.9;
    mk.parts.light.material.emissive.setHex(!mk.on ? 0x000000 : hot ? 0x2fbf4a : 0xff6a10); mk.parts.light.material.emissiveIntensity = mk.on ? 2.5 : 0;
    mk.parts.plateMat.color.setRGB(0.17 + mk.heat * 0.04, 0.17 + mk.heat * 0.02, 0.18);
    if (hot && mk.m && mk.m.total() > 0.5 && !mk.cr) { hintOnce('fieldIntro', 'Quickly spread the batter thin with the wooden spreader before it sets.'); }
    const g = mk.m ? mk.m.total() : 0;
    if (g > 3 && !mk.cr) mk.cr = { spread: 0.15, side: 0, cook: [0, 0], set: 0, flipped: false };
    if (g < 0.5 && mk.cr && !mk.cr.lifted) mk.cr = null;
    const cr = mk.cr, P = mk.parts;
    if (cr) {
      if (mk.heat > 0.4) { const rate = (mk.heat - 0.3) / 0.7 * dtG / 40 * (1.25 - cr.spread * 0.45); cr.cook[cr.side] += rate; if (cr.side === 0) cr.set += rate * 1.6; if (cr.side === 1) cr.cook[0] += rate * 0.08; }
      cr.spread = Math.min(1, cr.spread + (cr.set < 1 ? dtG * 0.0015 : 0) * (cr.spread < 0.45 ? 1 : 0));
      const r = 0.05 + (CRP_R - 0.055) * cr.spread * Math.min(1, 0.4 + g / 45), thick = clamp(g / 1e3 / (Math.PI * r * r) * 0.45, 0.0008, 0.006);
      const wet = cr.side === 0 && cr.set < 0.6;
      P.puddle.visible = wet; P.crepe.visible = !wet;
      P.puddle.scale.set(r, thick, r); P.puddle.position.y = CRP_TOP + thick / 2 + 0.0005;
      P.crepe.scale.set(r, Math.max(0.0012, thick * 0.6), r); P.crepe.position.y = CRP_TOP + 0.0012;
      const topM = P.crepe.material[1], wantMap = cr.side === 0 ? CRP_PALE : CRP_LACE; if (topM.map !== wantMap) { topM.map = wantMap; topM.needsUpdate = true; } topM.color.set(rgb(topCol(cr))); P.crepe.material[2].color.set(rgb(crepeTint(cr.cook[cr.side === 0 ? 0 : 1])));
      if (Math.random() < dt * 4 && hot) parts.push({ type: 'steam', p: V3(mk.p.x + (Math.random() - 0.5) * r, mk.p.y + CRP_TOP + 0.01, mk.p.z + (Math.random() - 0.5) * r), v: V3(0, 0.04, 0), life: 1.2 });
      if (hot && Math.random() < dt * 3) sNoise(0.15, 3000, 0.6, 0.02, 'highpass');
      if (cr.cook[cr.side] > 1.5 && !cr.warned) { cr.warned = true; say('It’s starting to burn!', 2); }
    } else { P.puddle.visible = false; P.crepe.visible = false; }
  }
};

/* ---------- tools ---------- */
function makerUnder(it, pad = 0.02) { return items.find(mk => mk.kind === 'crepemaker' && mk.zone !== 'held' && mk.zone !== 'drawer' && Math.hypot(it.p.x - mk.p.x, (it.p.z - mk.p.z) * (viewT < 0.5 ? 0.25 : 1)) < CRP_R + pad && it.p.y > mk.p.y + CRP_TOP - 0.02 && it.p.y < mk.p.y + 0.4); }
const _toolTargetCr = toolTarget;
toolTarget = function (it) { const d = DEF[it.kind]; if (d.crepeSpread || d.crepeTurn) return !!makerUnder(it); return _toolTargetCr(it); };
const _tool3Cr = tool3;
tool3 = function (it, dt) {
  const d = DEF[it.kind];
  if (!(d.crepeSpread || d.crepeTurn)) return _tool3Cr(it, dt);
  const mk = makerUnder(it); it.dipY = null;
  const mv = Math.hypot(it.p.x - (it.lx ?? it.p.x), it.p.z - (it.lz ?? it.p.z)); it.lx = it.p.x; it.lz = it.p.z;
  if (mk) {
    it.zTarget = mk.p.z; it.dipY = mk.p.y + CRP_TOP + (d.crepeSpread ? 0.004 : 0.01);
    const cr = mk.cr;
    if (d.crepeSpread && cr && cr.side === 0) {
      if (cr.set < 1) { cr.spread = Math.min(1, cr.spread + mv * 2.4); if (mv > 0.002 && Math.random() < 0.3) sNoise(0.05, 1400, 1, 0.05, 'bandpass'); }
      else if (mv > 0.004) hintOnce('setCrepe', 'Too late to spread: the batter has set. Spread straight after pouring.');
    }
    if (d.crepeTurn && (it.useT || 0) > 0 && !it.used) { it.used = true; turnerAction(mk); }
  }
  if ((it.useT || 0) > 0) it.useT -= dt; else it.used = false;
};
function crepeTargetPlate(mk) {
  let best = null, bd = 1.3;
  for (const h of hosts()) { const b = bakesOf().find(x => x.host === h); if (b && b.shape !== 'crepes') continue; const dd = Math.hypot(h.p.x - mk.p.x, h.p.z - mk.p.z); const pref = h.kind.startsWith('plate') ? 0 : 0.3; if (dd + pref < bd) { bd = dd + pref; best = h; } }
  return best;
}
function turnerAction(mk) {
  const cr = mk.cr;
  if (!cr) { say('Pour some batter on the plate first.', 1.8); return; }
  if (cr.side === 0) {
    if (cr.cook[0] < 0.35) { say('Not yet. Wait until the edges turn golden.', 1.8); return; }
    cr.side = 1; cr.flipped = true; CRP.flips = (CRP.flips || 0) + 1; SFX.thunk(0.4); sNoise(0.12, 900, 1, 0.12, 'bandpass'); mk.flipAnim = 0.35; return;
  }
  if (cr.cook[1] < 0.3) { say('Give the second side a few more seconds.', 1.8); return; }
  const pl = crepeTargetPlate(mk);
  if (!pl) { say('Put a plate next to the crêpe maker, then lift the crêpe onto it.', 2.6); return; }
  liftCrepe(mk, pl);
}
function liftCrepe(mk, pl) {
  const cr = mk.cr, m = mk.m; mk.m = new Mix(); mk.cr = null;
  const rec = { g: m.total(), spread: cr.spread, cook0: cr.cook[0], cook1: cr.cook[1], cream: false };
  // a short flight from the maker to the plate
  const disc = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.0015, 32), [CRP_EDGE, crepeMat(rec.cook0), crepeMat(rec.cook1)], 0, 0, 0, false); scene.add(disc);
  const a = mk.p.clone().add(V3(0, CRP_TOP + 0.01, 0)), b0 = V3(pl.p.x, hostTop(pl) + 0.03, pl.p.z); let t = 0;
  CRP.flights = CRP.flights || []; CRP.flights.push({ disc, a, b: b0, t, done: () => addCrepe(pl, rec, m) });
  SFX.plop();
}
function addCrepe(pl, rec, m) {
  let b = bakesOf().find(x => x.host === pl && x.shape === 'crepes');
  if (!b) {
    const pan = { m: new Mix(), bake: { type: 'crepes', b: 1, brown: 1, rise: 0, spread: 0, ideal: 200, time: 1 }, temp: 60, balls: null, kind: 'crepemaker' };
    b = mkBake('crepes', pan, V3(pl.p.x, hostTop(pl), pl.p.z), pl); b.crepes = []; b.creamTop = 0; b.fold = !!(recipe && recipe.foldCrepes);
  }
  if (b.creamTop >= 6 && b.crepes.length) { b.crepes[b.crepes.length - 1].cream = true; }
  b.creamTop = 0; b.crepes.push(rec); b.temp = 30; b.m.merge(m); b.touched = touchN++;
  const n = b.crepes.length, avg = b.crepes.reduce((s, c) => s + Math.min(c.cook0, c.cook1), 0) / n, worst = Math.max(...b.crepes.map(c => Math.max(c.cook0, c.cook1)));
  b.bake.b = clamp(avg / 0.6, 0, 1); b.bake.brown = worst > 1.4 ? 1 + (worst - 1.2) : 0.6 + 0.6 * Math.min(1, avg);
  rebuildBake(b);
  say(n === 1 ? 'First crêpe done!' : `${n} crêpes.`, 1.6);
}
const _tickCr2 = tick3;
tick3 = function (dt) {
  _tickCr2(dt);
  if (CRP.flights) for (let i = CRP.flights.length - 1; i >= 0; i--) { const f = CRP.flights[i]; f.t += dt / 0.55; const k = Math.min(1, f.t); f.disc.position.lerpVectors(f.a, f.b, k); f.disc.position.y += Math.sin(k * Math.PI) * 0.12; f.disc.rotation.x = Math.sin(k * Math.PI) * 0.6; if (k >= 1) { scene.remove(f.disc); f.disc.geometry.dispose(); CRP.flights.splice(i, 1); f.done(); } }
  for (const mk of items) if (mk.kind === 'crepemaker' && mk.flipAnim > 0) { mk.flipAnim -= dt; const k = 1 - mk.flipAnim / 0.35; if (mk.parts.crepe) { mk.parts.crepe.position.y = CRP_TOP + 0.0012 + Math.sin(k * Math.PI) * 0.05; mk.parts.crepe.rotation.x = k * Math.PI; if (mk.flipAnim <= 0) mk.parts.crepe.rotation.x = 0; } }
};
const _hintCr = hint3;
hint3 = function () {
  if (held && held.sticky) { const d = DEF[held.it.kind];
    if (d.crepeSpread) return 'Move it in circles over fresh batter to spread it thin · Esc to put it back';
    if (d.crepeTurn) return 'Click over the crêpe to flip it, click again to lift it onto a plate · Esc to put it back'; }
  return _hintCr();
};

/* ---------- crêpe stacks as bakes ---------- */
const _bakeDimsCr = bakeDims;
bakeDims = function (b) {
  if (b.shape !== 'crepes') return _bakeDimsCr(b);
  const cs = b.crepes || [], n = Math.max(1, cs.length), cream = cs.filter(c => c.cream).length;
  return b.fold ? { rx: 0.1, rz: 0.1, h: 0.012 } : { rx: 0.1, rz: 0.1, h: Math.max(0.003, n * 0.0018 + cream * 0.0032) };
};
const _rebuildBakeCr = rebuildBake;
rebuildBake = function (b) {
  if (b.shape !== 'crepes') return _rebuildBakeCr(b);
  const g = b.model; for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i] !== b.decoG) g.remove(g.children[i]);
  const d = b.dims = bakeDims(b); b.h = d.h; b.rad = d.rx; b.pivot.position.y = b.h / 2; b.model.position.y = -b.h / 2;
  const tag = m => { m.traverse(o => { if (o.isMesh) o.userData.item = b; }); g.add(m); return m; };
  const cs = b.crepes || [];
  if (b.fold) {
    b.foldSpots = []; const n = cs.length, step = Math.min(0.75, 3.4 / Math.max(1, n)), mid = -((n - 1) * step / 2 - 0.6) - Math.PI / 4; b.foldOff = { x: -Math.cos(mid) * 0.035, z: -Math.sin(mid) * 0.035 };
    cs.forEach((c, i) => { const r = 0.07 + 0.025 * c.spread, w = mesh(foldedGeo(r), crepeMat(Math.max(c.cook0, c.cook1)), 0, 0.0035 + i * 0.0032, 0); w.rotation.set(0.04, i * step - 0.6, 0); const a = -w.rotation.y - Math.PI / 4; w.position.x = -Math.cos(a) * 0.022 + b.foldOff.x; w.position.z = -Math.sin(a) * 0.022 + b.foldOff.z; tag(w); w.updateMatrix(); w.geometry.computeBoundingBox(); const ctr = w.geometry.boundingBox.getCenter(V3(0, 0, 0)).applyMatrix4(w.matrix); (b.foldSpots = b.foldSpots || [])[i] = { x: ctr.x, z: ctr.z, tx: w.position.x, tz: w.position.z }; });
    b.topY = 0.008 + cs.length * 0.0032;
  } else {
    let y = 0;
    cs.forEach((c, i) => {
      const r = Math.min(0.1, 0.07 + 0.03 * c.spread);
      tag(mesh(new THREE.CylinderGeometry(r, r, 0.0018, 48), [CRP_EDGE, crepeMat(c.cook0), crepeMat(c.cook1)], 0, y + 0.0009, 0)); y += 0.0018;
      if (c.cream) { tag(mesh(new THREE.CylinderGeometry(r * 0.995, r * 0.995, 0.0032, 40), CREAMMAT, 0, y + 0.0016, 0)); y += 0.0032; }
    });
    if (b.creamTop > 0) { const r = 0.094 * Math.min(1, 0.4 + b.creamTop / 10); tag(mesh(new THREE.CylinderGeometry(r, r, 0.002, 40), CREAMMAT, 0, y + 0.001, 0)); }
    b.topY = Math.max(0.002, y);
  }
  b.builtSig = rebuildSig(b);
};
// cream between the layers: the offset spatula with whipped cream over the stack
const _tool3Cr2 = tool3;
tool3 = function (it, dt) {
  const d = DEF[it.kind];
  if (d.spread && it.m && it.m.total() > 0.5) {
    const b = bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0.02);
    if (b && b.shape === 'crepes' && !b.fold) {
      it.zTarget = b.p.z; it.dipY = b.p.y + (b.topY || b.h) + 0.006;
      const mv = Math.hypot(it.p.x - (it.lx ?? it.p.x), it.p.z - (it.lz ?? it.p.z)); it.lx = it.p.x; it.lz = it.p.z;
      if (it.p.y < b.p.y + (b.topY || b.h) + 0.012 && mv > 0.001 && b.creamTop < 12) { const g = Math.min(it.m.total(), mv * 120); b.creamTop += g; recordCream(b, it.m, g); it.m.take(g / it.m.total()); if (Math.random() < 0.3) SFX.scrape(); if (Math.floor(b.creamTop) % 3 === 0) rebuildBake(b); if (b.creamTop >= 6) hintOnce('creamLayer', 'Thin layer of cream on. Now add the next crêpe on top.'); }
      return;
    }
  }
  _tool3Cr2(it, dt);
};
const crepeStack = () => bakesOf().find(b => b.shape === 'crepes');
const crepeCount = () => { const b = crepeStack(); return b ? b.crepes.length : 0; };
const creamLayers = () => { const b = crepeStack(); return b ? b.crepes.filter(c => c.cream).length : 0; };

/* ---------- recipes ---------- */
const crepeBatter = (fl, mi) => () => anyMix(m => (m.g.flour || 0) > fl && (m.g.milk || 0) > mi && (m.g.egg || 0) > 50 && m.mix > 0.85) || crepeCount() > 0 || !!(maker() && maker().m && maker().m.total() > 2);
const makerHot = () => !!(maker() && maker().heat >= 0.9) || crepeCount() > 0;
const CREPE_RECIPES = [
  { id: 'crepes', name: 'French Crêpes', country: 'France', kind: 'hot', level: 1, product: 'crepes', pan: 'crepemaker', noOven: true, whip: false, foldCrepes: true, temp: 200, time: 2, ing: { flour: 125, egg: 100, milk: 300, butter: 20, sugar: 15 }, blurb: 'Paper-thin crêpes folded into quarters with chocolate sauce and strawberries.',
    extra: ['chocolate sauce', 'strawberries'], steps: [
      { t: 'Whisk the flour, eggs, milk, sugar and melted butter into a thin batter.', c: crepeBatter(80, 180) },
      { t: 'Take the crêpe maker out of the drawer under the oven and switch it on.', c: makerHot },
      { t: 'Pour a little batter on the hot plate and spread it thin with the wooden spreader.', c: () => (maker() && maker().cr && maker().cr.spread > 0.7) || crepeCount() > 0 },
      { t: 'Flip it with the turner when the edges turn golden.', c: () => (maker() && maker().cr && maker().cr.side === 1) || crepeCount() > 0 },
      { t: 'Lift it onto a plate. Make 4 crêpes.', c: () => crepeCount() >= 4 },
      { t: 'Drizzle chocolate sauce and add strawberries.', c: () => { const b = crepeStack(); return !!b && drizLen(b) > 10 && b.decos.length >= 3; } },
      { t: 'Ring the bell to serve.', c: () => !!scorecard }] },
  { id: 'creamcrepes', name: 'Strawberry Cream Crêpes', country: 'Japan', kind: 'hot', level: 2, product: 'crepes', pan: 'crepemaker', noOven: true, whip: false, foldCrepes: true, cream: true, temp: 200, time: 2, ing: { flour: 125, egg: 100, milk: 300, butter: 20, sugar: 15 }, blurb: 'Harajuku-style crêpes with piped whipped cream and strawberries.',
    extra: ['300 g cream', 'strawberries'], steps: [
      { t: 'Whisk the flour, eggs, milk, sugar and melted butter into a thin batter.', c: crepeBatter(80, 180) },
      { t: 'Take the crêpe maker out of the drawer under the oven and switch it on.', c: makerHot },
      { t: 'Cook 3 crêpes: pour, spread thin, flip, then lift each onto a plate.', c: () => crepeCount() >= 3 },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Pipe cream rosettes over the crêpes.', c: () => { const b = crepeStack(); return !!b && decoCount(b, 'rosette') >= 4; } },
      { t: 'Add strawberries.', c: () => { const b = crepeStack(); return !!b && (decoCount(b, 'strawberry') + decoCount(b, 'strawberryWhole')) >= 3; } },
      { t: 'Ring the bell to serve.', c: () => !!scorecard }] },
  { id: 'millecrepe', name: 'Mille Crêpe Cake', country: 'Japan', kind: 'hot', level: 3, product: 'crepes', pan: 'crepemaker', noOven: true, whip: false, cream: true, temp: 200, time: 2, ing: { flour: 250, egg: 200, milk: 600, butter: 40, sugar: 30 }, blurb: 'Ten paper-thin crêpes layered with whipped cream, dusted with icing sugar.',
    extra: ['300 g cream', 'icing sugar', 'strawberries'], steps: [
      { t: 'Whisk the flour, eggs, milk, sugar and melted butter into a thin batter.', c: crepeBatter(160, 360) },
      { t: 'Take the crêpe maker out of the drawer under the oven and switch it on.', c: makerHot },
      { t: 'Whip 300 g cream with 30 g icing sugar to stiff peaks.', c: creamReady },
      { t: 'Cook a crêpe and lift it onto a plate.', c: () => crepeCount() >= 1 },
      { t: 'Spread a thin layer of cream, then add the next crêpe. Build 10 layers.', c: () => crepeCount() >= 10 && creamLayers() >= 8 },
      { t: 'Dust the top with icing sugar.', c: () => { const b = crepeStack(); return !!b && (b.dust || 0) > 0.2; } },
      { t: 'Add strawberries on top.', c: () => { const b = crepeStack(); return !!b && b.decos.length >= 3; } },
      { t: 'Ring the bell to serve.', c: () => !!scorecard }] },
];
CREPE_RECIPES.forEach(R => { R.lines = [...Object.entries(R.ing).map(([k, v]) => k === 'egg' ? `${Math.round(v / 50)} eggs` : `${v} g ${ING[k].n}`), ...R.extra]; RECIPES.push(R); });
HINTS.unshift(
  [/crêpe maker out of the drawer/i, ['drawer'], 'Open the drawer under the oven, set the crêpe maker on the counter and press its red switch. Wait for the green light.'],
  [/spread it thin|spread thin/i, ['spreader'], 'Pour a little batter in the middle, then quickly move the wooden spreader in circles before it sets.'],
  [/flip it|cook (\d) crêpes|cook a crêpe/i, ['turner'], 'When the edges turn golden, click the turner over the crêpe to flip it. Click again to lift it onto a plate.'],
  [/build 10 layers|thin layer of cream/i, ['offset'], 'Dip the offset spatula in whipped cream and spread it over the top crêpe, then lift the next crêpe on.']);

/* ---------- judging ---------- */
const _judgeCr = judge;
judge = function (it) {
  _judgeCr(it);
  if (!scorecard || !it || it.shape !== 'crepes') return;
  const cs = it.crepes || [], g = [], n = [];
  const thin = cs.filter(c => c.spread > 0.7).length / Math.max(1, cs.length), burnt = cs.filter(c => Math.max(c.cook0, c.cook1) > 1.5).length, raw = cs.filter(c => c.cook1 < 0.3).length;
  if (thin > 0.8) g.push('Paper-thin, lacy crêpes.'); else n.push('Some crêpes were thick. Spread the batter straight after pouring.');
  if (burnt) n.push(`${burnt} crêpe${burnt > 1 ? 's were' : ' was'} scorched.`); if (raw) n.push('Some were pale and doughy on one side.');
  if (recipe && recipe.id === 'millecrepe') { const L = cs.filter(c => c.cream).length; if (cs.length >= 10 && L >= 8) g.push(`${cs.length} neat layers with cream in between.`); else n.push(`Only ${cs.length} layers. A mille crêpe needs at least 10.`); }
  scorecard.good = [...g, ...scorecard.good].slice(0, 4); scorecard.notes = [...n, ...scorecard.notes].slice(0, 4);
  scorecard.stars = Math.round(clamp(scorecard.stars + g.length * 0.25 - n.length * 0.4, 0.5, 5) * 2) / 2;
};

/* ---------- skip ---------- */
async function makerReady() {
  const mk = maker(); if (!mk) return null;
  if (mk.zone === 'drawer') { const d = DRW[CRP.drawer]; d.tgt = 1; view = 'drawer'; DRWV.i = CRP.drawer; await waitS(0.6); const to = V3(0.45, CT, 0.06); await flyTo(mk, to, 0.7, 'counter'); mk.p.copy(to); mk.drawer = null; d.tgt = 0; await waitS(0.3); view = 'counter'; }
  if (!mk.on) { mk.on = true; SFX.click(); }
  if (mk.heat < 0.9) { look(mk); await ff(() => mk.heat >= 0.9, 20); }
  return mk;
}
async function plateNear(mk) {
  let pl = crepeTargetPlate(mk);
  if (!pl || Math.hypot(pl.p.x - mk.p.x, pl.p.z - mk.p.z) > 1.2) { pl = items.find(i => /^plate\d$/.test(i.kind) && (i.zone === 'carousel' || i.zone === 'shelf') && !bakesOf().some(b => b.host === i)); if (pl) { if (pl.root) pl.root.rotation.order = 'XYZ'; const to = V3(mk.p.x - 0.33, CT, 0.06); await flyTo(pl, to, 0.9, 'counter'); pl.p.copy(to); pl.slot = null; if (pl.root) pl.root.scale.setScalar(1); } }
  return pl;
}
async function cookOneCrepe(mk, pl, grams) {
  const bowl = items.find(i => i.m && i !== mk && DEF[i.kind]?.recv && (i.m.g.milk || 0) > 30 && (i.m.g.flour || 0) > 10) ;
  look(mk);
  if (bowl) await pourInto(bowl, mk, null, grams); else { mk.m.add('flour', grams * 0.25); mk.m.add('milk', grams * 0.6); mk.m.add('egg', grams * 0.15); }
  if (bowl && bowl.home) { /* stay near */ }
  await untilS(() => !!mk.cr, 2);
  await toolOver('spreader', mk, 0.9, (tool, c, raw) => { const a = raw * TAU * 2.2; tool.p.set(c.x + Math.cos(a) * 0.06 * raw, c.y + CRP_TOP + 0.004, c.z + Math.sin(a) * 0.06 * raw); if (mk.cr) mk.cr.spread = Math.max(mk.cr.spread, 0.3 + raw * 0.65); });
  await ff(() => mk.cr && mk.cr.cook[0] >= 0.55, 15);
  await toolOver('turner', mk, 0.5, (tool, c, raw) => { tool.p.set(c.x + 0.05, c.y + CRP_TOP + 0.01 + Math.sin(raw * Math.PI) * 0.04, c.z); if (raw > 0.5 && mk.cr && mk.cr.side === 0) turnerAction(mk); });
  await ff(() => mk.cr && mk.cr.cook[1] >= 0.5, 15);
  if (mk.cr) liftCrepe(mk, pl); await waitS(0.7);
}
const _performStepCr = performStep;
performStep = async function (i) {
  const t = recipe.steps[i].t.toLowerCase();
  if (/crêpe maker out of the drawer/.test(t)) { await makerReady(); return; }
  if (/pour a little batter/.test(t)) { const mk = await makerReady(); const bowl = items.find(x => x.m && x !== mk && DEF[x.kind]?.recv && (x.m.g.milk || 0) > 30); look(mk); if (bowl) await pourInto(bowl, mk, null, 45); await untilS(() => !!mk.cr, 2); await toolOver('spreader', mk, 1.0, (tool, c, raw) => { const a = raw * TAU * 2.2; tool.p.set(c.x + Math.cos(a) * 0.06 * raw, c.y + CRP_TOP + 0.004, c.z + Math.sin(a) * 0.06 * raw); if (mk.cr) mk.cr.spread = Math.max(mk.cr.spread, 0.3 + raw * 0.65); }); return; }
  if (/^flip it/.test(t)) { const mk = await makerReady(); await ff(() => mk.cr && mk.cr.cook[0] >= 0.55, 15); await toolOver('turner', mk, 0.5, (tool, c, raw) => { tool.p.set(c.x + 0.05, c.y + CRP_TOP + 0.01 + Math.sin(raw * Math.PI) * 0.04, c.z); if (raw > 0.5 && mk.cr && mk.cr.side === 0) turnerAction(mk); }); return; }
  const many = /make (\d+) crêpes|cook (\d+) crêpes/.exec(t), one = /cook a crêpe and lift/.test(t), layers = /build (\d+) layers/.exec(t);
  if (many || one || layers || /^lift it onto a plate/.test(t)) {
    const mk = await makerReady(); const pl = await plateNear(mk); if (!pl) return;
    const want = layers ? +layers[1] : many ? +(many[1] || many[2]) : 1;
    if (mk.cr && mk.cr.side === 1) { await ff(() => mk.cr.cook[1] >= 0.5, 10); liftCrepe(mk, pl); await waitS(0.7); }
    else if (mk.cr) { await ff(() => mk.cr.cook[0] >= 0.55, 15); turnerAction(mk); await ff(() => mk.cr && mk.cr.cook[1] >= 0.5, 10); if (mk.cr) liftCrepe(mk, pl); await waitS(0.7); }
    while (crepeCount() < want) {
      const b = crepeStack();
      if (layers && b && b.crepes.length) { const cream = await ensureCream(); look(b); await toolOver('offset', b, 0.6, (tool, c, raw) => { tool.p.set(c.x + Math.sin(raw * 9) * 0.05, c.y + (b.topY || b.h) + 0.006, c.z + Math.cos(raw * 7) * 0.03); }); b.creamTop = 8; recordCream(b, cream.m, 8); cream.m.take(Math.min(1, 8 / Math.max(1, cream.m.total()))); rebuildBake(b); }
      await cookOneCrepe(mk, pl, recipe.id === 'millecrepe' ? 40 : 50);
    }
    return;
  }
  if (/pipe cream rosettes over the crêpes/.test(t)) { const b = crepeStack(); await ensureCream(); if (b) { look(b); for (let n = 0; n < 6; n++) { const a = n / 6 * TAU; addDeco(b, 'rosette', b.p.x + Math.cos(a) * 0.05, b.p.z + Math.sin(a) * 0.05); SFX.plop(); await waitS(0.15); } } return; }
  if (/^add strawberries|strawberries on top|drizzle chocolate sauce and add strawberries/.test(t)) {
    const b = crepeStack(); if (!b) return;
    if (/drizzle/.test(t)) { const sauce = findK('chocsauce'); if (sauce) { look(b); const back = sauce.p.clone(), z = sauce.zone; await flyTo(sauce, b.p.clone().add(V3(0.08, (b.topY || b.h) + 0.15, 0)), 0.5); sauce.pdir = V3(-1, 0, 0); await animate(1.6, (k, raw) => { sauce.tilt = Math.min(2.2, raw * 6); applyTilt(sauce); const x = b.p.x + (raw * 2 - 1) * 0.07, zz = b.p.z + Math.sin(raw * 18) * 0.04; drizzleAt(b, 'chocsauce', x, zz); sauce.p.x = x + 0.03; sauce.p.z = zz; AUTO.stream = { type: 'liquid', a: lip3(sauce), b: V3(x, b.p.y + (b.topY || b.h), zz), col: ING.chocsauce.c, rate: 6, dir: sauce.pdir }; }); AUTO.stream = null; sauce.tilt = 0; applyTilt(sauce); sauce.stock = Math.max(0, sauce.stock - 25); await flyTo(sauce, back, 0.5); sauce.zone = z; sauce.p.copy(back); } }
    look(b); for (let n = 0; n < 5; n++) { const a = n / 5 * TAU + 0.4; addDeco(b, 'strawberry', b.p.x + Math.cos(a) * 0.045, b.p.z + Math.sin(a) * 0.045); SFX.plop(); await waitS(0.15); }
    return;
  }
  if (/dust the top with icing sugar/.test(t)) { const b = crepeStack(); const ic = findK('icing'); if (b) { look(b); if (ic) await toolOverSource(ic, b); b.dust = Math.max(b.dust || 0, 0.6); b.dustDirty = true; } return; }
  if (/ring the bell to serve/.test(t) && crepeStack()) { const b = crepeStack(); look(b); await waitS(0.3); judge(b); return; }
  return _performStepCr(i);
};

/* ---------- put things in the new drawer ---------- */
const _build3Cr = build3;
build3 = function () {
  _build3Cr();
  const put = (kind, x, z) => { const d = DRW[CRP.drawer], it = mk3(kind, d.x + x, d.floor, z, 'drawer'); it.drawer = CRP.drawer; it.dz = z; it.home = { p: it.p.clone(), zone: 'drawer', drawer: CRP.drawer, dz: z }; if (DEF[kind].tool) it.pose = 'lie'; return it; };
  const mk = put('crepemaker', -0.1, 0.06); mk.m = new Mix(); mk.on = false; mk.heat = 0; mk.cr = null;
  put('spreader', 0.2, -0.02); put('turner', 0.2, 0.16);
  CRP.flips = 0;
};
build3();

/* ---------- look down into the oven drawer ---------- */
const _updateCameraCr = updateCamera;
updateCamera = function (dt) {
  if (view !== 'drawer' || DRWV.i !== CRP.drawer) return _updateCameraCr(dt);
  const d = DRW[CRP.drawer], aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? 1.5 / aspect : 1;
  const tp = V3(d.x, 1.62, 0.62 + 0.55 * widen), tl = V3(d.x, d.floor, 0.47), tf = 46, k = 1 - Math.exp(-dt * 4.2);
  if (!camCur.pos) camCur.pos = tp.clone(); camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  viewT += clamp(0 - viewT, -dt * 1.6, dt * 1.6);
};
