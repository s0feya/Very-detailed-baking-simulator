'use strict';
/* =========================================================
   Aimed cutting:
   - Bread (on the counter or at the table): a dotted line shows
     where the slice will be; the knife hovers right over it and
     follows the mouse; a click saws straight down that line.
   - Cakes at the table: the camera looks straight down; a dotted
     line runs from the centre to the edge where the knife points;
     a click cuts there. Two cuts free a slice.
   ========================================================= */

/* ---------- dotted guide lines ---------- */
const DASH_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.95 });
const DASH_GEO = new THREE.BoxGeometry(1, 1, 1);
// bold white dashes along a path, drawn over everything so the knife never hides them
function dashLine(owner, key, pts) {
  let L = owner[key];
  if (!L) { L = new THREE.InstancedMesh(DASH_GEO, DASH_MAT, 80); L.renderOrder = 20; L.frustumCulled = false; owner[key] = L; }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0); let n = 0, acc = 0;
  for (let i = 1; i < pts.length && n < 80; i++) {
    const a = pts[i - 1], b = pts[i], seg = a.distanceTo(b); if (seg < 1e-6) continue; const dir = b.clone().sub(a).normalize(); Q.setFromUnitVectors(X, dir);
    for (let t = (0.009 - acc) % 0.009; t < seg && n < 80; t += 0.009) { const c = a.clone().addScaledVector(dir, Math.min(seg, t + 0.0025)); M.compose(c, Q, new THREE.Vector3(0.005, 0.0016, 0.0016)); L.setMatrixAt(n++, M); }
    acc = (acc + seg) % 0.009;
  }
  L.count = n; L.instanceMatrix.needsUpdate = true; L.visible = true; return L;
}
function hideLine(L) { if (L) L.visible = false; }

/* ---------- bread: where the next slice goes ---------- */
function loafRange(b) { const cuts = loafCuts(b), hi = cuts.length ? cuts[cuts.length - 1] : b.dims.rx; return { lo: Math.max(-b.dims.rx + 0.02, hi - 0.06), hi: hi - 0.008 }; }
function aimLoaf(b) {
  setRay(PT.x, PT.y); const hp = planeHit(V3(0, 1, 0), V3(0, b.p.y + b.dims.h * 0.85, 0)); if (!hp) return null;
  const l = toLocal(b, hp.x, hp.z), r = loafRange(b); if (r.hi <= -b.dims.rx + 0.02) return null;
  return clamp(l.x, r.lo, r.hi);
}
function loafLinePts(b, x) {
  const shape = loafShape(b.dims.rz, b.dims.h), pts = shape.getPoints(20).filter(p => p.y > b.dims.h * 0.15);
  // walk the outline over the top, from one side to the other
  const left = pts.filter(p => p.x < 0).sort((a, c) => a.y - c.y || a.x - c.x), right = pts.filter(p => p.x >= 0).sort((a, c) => c.y - a.y || a.x - c.x);
  const path = [...left, ...right.reverse().reverse()].sort((a, c) => Math.atan2(a.y - b.dims.h * 0.3, -a.x) - Math.atan2(c.y - b.dims.h * 0.3, -c.x));
  return path.map(p => V3(x, p.y + 0.0025 * Math.sign(p.y), -p.x * 1.04));
}
function showLoafLine(b, x) {
  const L = dashLine(b, 'cutLine', loafLinePts(b, x)); if (L.parent !== b.root) b.root.add(L);
}
function cutLoafAt(b, x) { const cuts = loafCuts(b); cuts.push(x); b.sliced = cuts.length; rebuildBake(b); SFX.scrape && SFX.scrape(); }
function loafWorld(b, lx, y, lz) { const w = worldOf(b, lx, lz); w.y = y; return w; }

/* ---------- kitchen: the bread knife over a loaf ---------- */
const LC = { b: null, x: 0, anim: null };
const _decoToolCt = decoTool;
decoTool = function (it, dt) {
  const d = DEF[it.kind];
  if (!d.knife) return _decoToolCt(it, dt);
  const b = bakesOf('loaf').find(x => x.zone !== 'held' && visible3(x) && Math.hypot(x.p.x - it.p.x, x.p.z - it.p.z) < 0.28);
  if (!b) { if (LC.b) hideLine(LC.b.cutLine); LC.b = null; it.cutPose = null; return _decoToolCt(it, dt); }
  if (LC.b && LC.b !== b) hideLine(LC.b.cutLine);
  LC.b = b; it.cutPose = 'loaf'; it.dipY = null;
  const top = b.p.y + b.dims.h;
  if (LC.anim) {
    // sawing straight down the line
    const A = LC.anim; A.t += dt; const k = Math.min(1, A.t / 0.7);
    const w = loafWorld(b, A.x, top + 0.03 - k * (b.dims.h + 0.03), -b.dims.rz - 0.015 + Math.sin(A.t * 30) * 0.012);
    it.p.copy(w); if (Math.random() < 0.5) sNoise(0.04, 1800, 3, 0.15);
    if (k >= 1) { cutLoafAt(b, A.x); LC.anim = null; const n = b.sliced; say(n === 1 ? 'First slice! Move along and click again for the next.' : `${n} slices.`, 1.6); }
    return;
  }
  const x = aimLoaf(b);
  if (x == null) { hideLine(b.cutLine); return; }
  LC.x = x; showLoafLine(b, x);
  it.p.copy(loafWorld(b, x, top + 0.03, -b.dims.rz - 0.015)); it.zTarget = it.p.z;
};
const _syncItemCt = syncItem;
syncItem = function (it) {
  _syncItemCt(it);
  if (it.kind === 'knife' && it.cutPose === 'loaf' && it.zone === 'held' && LC.b) it.root.rotation.set(0, -Math.PI / 2 + spinOf(LC.b) + (LC.b.yaw || 0), -Math.PI / 2);
};
const _onDownCt = onDown3;
onDown3 = function () {
  if (!TABLE.on && held && held.it.kind === 'knife' && LC.b && LC.b.cutLine && LC.b.cutLine.visible && !LC.anim) { LC.anim = { t: 0, x: LC.x }; return; }
  _onDownCt();
};
const _release3Ct = release3;
release3 = function () { if (held && held.it.kind === 'knife') { if (LC.b) hideLine(LC.b.cutLine); LC.b = null; held.it.cutPose = null; LC.anim = null; } _release3Ct(); };
const _hoverCt = hover3;
hover3 = function () { if (!TABLE.on && held && held.it.kind === 'knife' && LC.b) return LC.anim ? 'Slicing…' : 'Move along the loaf to choose the slice · click to cut on the dotted line'; return _hoverCt(); };

/* ---------- the table: top-down cutting ---------- */
const TC = { aim: null, anim: null };
function tableCutting() { return TABLE.on && TABLE.knife && TABLE.knife.kind !== 'butter'; }
function placeTableKnife(k, tip, dirTipToHandle, y, tilt) {
  // knife model: blade from the origin to x = L, handle at negative x
  const L = k.g.userData.tipLen, a = Math.atan2(-dirTipToHandle.z, dirTipToHandle.x) + Math.PI; // +x must point from handle to tip
  const o = tip.clone().add(dirTipToHandle.clone().multiplyScalar(L)); o.y = y;
  k.g.position.copy(o.sub(TABLE.P)); k.g.rotation.set(tilt, a, 0, 'YXZ');
}
function tableAim() {
  const b = TABLE.b, k = TABLE.knife; if (!b.root.visible) return null;
  if (b.shape === 'loaf') { const x = aimLoaf(b); if (x == null) return null; return { loaf: true, x }; }
  const top = b.p.y + cakeH(b); setRay(PT.x, PT.y); const hp = planeHit(V3(0, 1, 0), V3(0, top, 0)); if (!hp) return null;
  b.root.updateMatrixWorld(true); const l = b.root.worldToLocal(hp.clone());
  if (Math.hypot(l.x, l.z) > cakeR(b) * 2.2) return null;
  return { a: Math.atan2(l.x, l.z), top };
}
function showTableAim(A) {
  const b = TABLE.b, k = TABLE.knife;
  if (!A) { hideLine(b.cutLine); return; }
  if (A.loaf) {
    showLoafLine(b, A.x);
    const top = b.p.y + b.dims.h, tip = loafWorld(b, A.x, top, -b.dims.rz - 0.012), back = loafWorld(b, A.x, top, b.dims.rz + 0.05);
    const dir = back.sub(tip).normalize(); dir.y = 0;
    const down = TC.anim ? Math.min(1, TC.anim.t / 0.6) : 0;
    placeTableKnife(k, tip, dir, top + 0.03 - down * (b.dims.h + 0.02) + (TC.anim ? 0 : 0), 0);
    if (TC.anim) k.g.position.z += Math.sin(TC.anim.t * 30) * 0.012;
    return;
  }
  const R = cakeR(b), H = cakeH(b), d = dAng(A.a), pts = [];
  for (let i = 0; i <= 24; i++) pts.push(V3(d.x * R * 1.04 * i / 24, H + 0.004, d.z * R * 1.04 * i / 24));
  const L = dashLine(b, 'cutLine', pts); if (L.parent !== b.root) b.root.add(L);
  // the knife lies along the line, tip at the centre, edge down
  const center = V3(b.p.x, 0, b.p.z), wd = d.clone().applyQuaternion(b.root.getWorldQuaternion(new THREE.Quaternion()));
  const down = TC.anim ? Math.sin(Math.min(1, TC.anim.t / 0.5) * Math.PI) : 0;
  placeTableKnife(k, center, wd, A.top + 0.035 - down * 0.05, 0.5 * (1 - down));
}
function finishTableCut(A) {
  const b = TABLE.b, k = TABLE.knife;
  if (A.loaf) {
    cutLoafAt(b, A.x);
    tSay(k.kind === 'bread' ? 'A neat slice. Put the knife down and click the loaf to lay a slice on the plate.' : 'The soft bread squashed a little. The serrated bread knife cuts cleaner.', 3.5);
    return;
  }
  if (k.kind === 'bread' && b.shape !== 'crepes') tSay('The serrated knife tears the crumb a little. The cake knife is smoother.', 2.5);
  addCut(A.a);
}
const _tableDownCt = tableDown, _tableMoveCt = tableMove;
tableDown = function () {
  if (tableCutting() && !TC.anim && !inBack()) {
    const k = TABLE.knife, kh = tableRayHit(TABLE.knives.map(x => x.g).filter(g => g !== k.g)), sh = tableRayHit(TABLE.sups.map(s => s.g));
    const A = !kh && !sh ? tableAim() : null;
    if (A) { TC.anim = { t: 0, A }; SFX.scrape && SFX.scrape(); return; }
  }
  _tableDownCt();
};
tableMove = function () { if (tableCutting()) return; _tableMoveCt(); };
const _tickCt = tick3;
tick3 = function (dt) {
  _tickCt(dt);
  if (!TABLE.on || !TABLE.b) return;
  const b = TABLE.b;
  if (!tableCutting()) { hideLine(b.cutLine); TC.anim = null; return; }
  if (TC.anim) { TC.anim.t += dt; showTableAim(TC.anim.A); if (TC.anim.t >= (TC.anim.A.loaf ? 0.6 : 0.5)) { const A = TC.anim.A; TC.anim = null; finishTableCut(A); } return; }
  TC.aim = tableAim(); showTableAim(TC.aim);
};
// looking straight down on the cake while holding a cutting knife
const _updateCameraCt = updateCamera;
updateCamera = function (dt) {
  if (!tableCutting()) return _updateCameraCt(dt);
  const b = TABLE.b, aspect = uiW / Math.max(1, uiH), top = b.p.y + (b.topY || b.h), hgt = 0.5 * (aspect < 1 ? 1 / aspect : 1);
  const tp = V3(b.p.x, top + hgt, b.p.z + 0.02), tl = V3(b.p.x, top, b.p.z), k = 1 - Math.exp(-dt * 4);
  camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, 42, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
};
// bread slices at the table now come off at the thickness they were cut
takeSlice = function () {
  const b = TABLE.b, cuts = loafCuts(b), taken = b.taken || 0; if (cuts.length <= taken) return false;
  const T = Math.max(0.006, (taken === 0 ? b.dims.rx : cuts[taken - 1]) - cuts[taken]);
  b.taken = taken + 1; rebuildBake(b);
  if (TABLE.sliceG) scene.remove(TABLE.sliceG);
  const d = b.dims, shape = loafShape(d.rz, d.h);
  const crust = crustColor(b.bake.brown, b.m.color()), crustM = stdMat(crust, TX.speck, 0.75);
  const crumbM = new THREE.MeshStandardMaterial({ color: new THREE.Color(rgb(mixc(crumbCol(b), [255, 246, 222], 0.35))), map: CRUMB_TEX, roughness: 0.95 });
  const G = new THREE.Group(), inner = new THREE.Group(); inner.rotation.z = Math.PI / 2; G.add(inner);
  inner.add(loafBlock(shape, -T / 2, T / 2, crumbM, crustM)); inner.position.set(d.h / 2, 0, 0);
  const bb = new THREE.Box2(); shape.getPoints(24).forEach(p => bb.expandByPoint(p));
  const cw = 256, cv = document.createElement('canvas'); cv.width = cv.height = cw; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y; tex.repeat.set(1 / w, 1 / h); tex.offset.set(-bb.min.x / w, -bb.min.y / h);
  const geo = new THREE.ShapeGeometry(shape, 24); geo.rotateY(Math.PI / 2); geo.translate(T / 2 + 0.0026, 0, 0);
  const sp = mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.35, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }), 0, 0, 0, false); inner.add(sp);
  const pl = TABLE.plates[0]; G.position.copy(TABLE.P).add(pl.position).add(V3(0, 0.013, 0)); G.rotation.y = -0.4;
  scene.add(G); TABLE.sliceG = G; TABLE.slice = { G, sp, cv, ctx: cv.getContext('2d'), bb, w, h, cw, tex, top: 0.013 + T, painted: 0 };
  SFX.click(); tSay('A slice on the plate. Take the butter knife, dip it in a spread, then drag it over the slice.', 5);
  return true;
};
// the table hint while aiming
const _drawUICt = drawUI3;
drawUI3 = function () {
  if (tableCutting() && TABLE.msgT <= 0) { TABLE.msg = TABLE.b.shape === 'loaf' ? 'Move along the loaf to choose the slice · click to cut on the dotted line' : 'Point the knife where you want to cut · click to cut along the dotted line'; TABLE.msgT = 0.05; }
  _drawUICt();
};

// the old "saw back and forth" bar doesn't apply to aimed slicing
const _actionBarsCt = actionBars;
actionBars = function () { const r = _actionBarsCt(); if (r && r.cur && held && held.it.kind === 'knife' && LC.b) r.cur = r.cur.filter(c => !/^Slice \d/.test(c.label)); return r; };
const _hintCt = hint3;
hint3 = function () { if (!TABLE.on && held && held.it.kind === 'knife' && LC.b) return 'Move along the loaf to aim · click to slice on the dotted line · click the counter to put the knife down'; return _hintCt(); };
