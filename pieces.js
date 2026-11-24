'use strict';
/* =========================================================
   1. Pieces: cookies, croissants, madeleines and canelés come
      off the tray / mould / plate one at a time.
   2. Click = pick up. Zooming is its own little magnifier
      badge, so a click on a bowl never means two things.
   ========================================================= */

const PIECE_SHAPES = ['cookies', 'madeleines', 'caneles'];
const MOLD_SHAPE = { madeleine: 'madeleines', canele: 'caneles' };
function pieceCount(b) { return b.shape === 'cookies' ? (b.balls ? b.balls.length : 0) : (b.count || 0); }

/* ---------- sizes: a single piece is small, a pile is plate-sized ---------- */
const _bakeDimsPc = bakeDims;
bakeDims = function (b) {
  if (b.shape === 'cookies' && b.balls && b.balls.length === 1) return { rx: 0.035, rz: 0.035, h: 0.02 };
  if (b.shape === 'madeleines' && b.count === 1) return { rx: 0.026, rz: 0.032, h: 0.016 };
  if (b.shape === 'caneles' && b.count === 1) return { rx: 0.03, rz: 0.03, h: 0.05 };
  return _bakeDimsPc(b);
};
function refreshDims(b) { const d = bakeDims(b); b.dims = d; b.rad = Math.max(d.rx, d.rz); b.h = d.h; b.pivot.position.y = d.h / 2; b.model.position.y = -d.h / 2; rebuildBake(b); }

/* ---------- madeleines & canelés drawn as a count of separate pieces ---------- */
const MAD_SPOTS = [[0, 0], [-0.045, -0.03], [0.045, -0.03], [-0.045, 0.03], [0.045, 0.03], [0, -0.065], [0, 0.065], [-0.09, 0], [0.09, 0], [-0.09, -0.06], [0.09, 0.06], [-0.09, 0.06], [0.09, -0.06]];
const CAN_SPOTS = [[0, 0], [-0.062, 0], [0.062, 0], [-0.031, -0.055], [0.031, -0.055], [-0.031, 0.055], [0.031, 0.055], [0, 0, 1], [-0.031, 0, 1], [0.031, 0, 1]];
const _rebuildBakePc = rebuildBake;
rebuildBake = function (b) {
  if (b.shape === 'madeleines' || b.shape === 'caneles') {
    if (b.count == null) b.count = b.shape === 'madeleines' ? 12 : 6;
    const g = b.model; for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i] !== b.decoG) g.remove(g.children[i]);
    const bk = b.bake, crust = crustColor(bk.brown * (b.shape === 'caneles' ? 0.75 : 1), b.m.color()), crustM = stdMat(crust, TX.speck, b.washed ? 0.45 : 0.8);
    const put = (m, i) => { m.traverse(o => { if (o.isMesh) { o.userData.item = b; o.userData.piece = i; } }); g.add(m); };
    if (b.shape === 'madeleines') {
      const shell = stdMat(mixc(crust, [250, 225, 170], 0.25), TX.speck, 0.7);
      for (let i = 0; i < b.count; i++) {
        const s = MAD_SPOTS[i % MAD_SPOTS.length], grp = new THREE.Group(); grp.position.set(s[0], i >= MAD_SPOTS.length ? 0.012 : 0, s[1]); grp.rotation.y = i * 0.9;
        const body = mesh(new THREE.SphereGeometry(1, 22, 12, 0, TAU, 0, Math.PI / 2), crustM, 0, 0, 0); body.scale.set(0.022, 0.012, 0.03); grp.add(body);
        const hump = mesh(new THREE.SphereGeometry(1, 16, 10, 0, TAU, 0, Math.PI / 2), shell, 0, 0.008, 0.004); hump.scale.set(0.01, 0.007, 0.012); grp.add(hump);
        for (let k = -2; k <= 2; k++) { const r = box(0.0016, 0.0018, 0.026, crustM, k * 0.007, 0.0105 - Math.abs(k) * 0.0012, -0.002); r.rotation.y = k * 0.18; grp.add(r); }
        put(grp, i);
      }
      b.topY = 0.016;
    } else {
      const top = stdMat(mixc(crust, [30, 18, 10], 0.25), TX.speck, 0.5);
      for (let i = 0; i < b.count; i++) {
        const s = CAN_SPOTS[i % CAN_SPOTS.length], up = s[2] ? 0.048 : 0;
        const c = mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.048, 12), [crustM, top, crustM], s[0], 0.024 + up, s[1]); put(c, i);
      }
      b.topY = 0.05;
    }
    b.builtSig = rebuildSig(b);
    return;
  }
  _rebuildBakePc(b);
  if (b.shape === 'cookies') { let i = 0; b.model.children.forEach(m => { if (m !== b.decoG && m.isMesh) { m.userData.piece = i++; } }); }
};

/* ---------- trays and moulds: tag each cookie / cup so we know which one was clicked ---------- */
const _syncItemPc = syncItem;
syncItem = function (it) {
  _syncItemPc(it);
  const P = it.parts || {};
  if (it.kind === 'tray' && P.balls) P.balls.children.forEach((m, i) => { m.userData.item = it; m.userData.piece = i; });
  if (P.cups) {
    if (!it.bake) it.taken = null;
    P.cups.forEach((m, i) => { m.traverse(o => { o.userData.item = it; o.userData.piece = i; }); if (it.taken && it.taken.includes(i)) m.visible = false; });
  }
};

function canTakePiece(hit) {
  const it = hit.it, o = hit.obj; if (!it || !o || o.userData.piece == null || held || heldDough || drag) return false;
  if (it.zone === 'oven' || it.zone === 'held' || !visible3(it)) return false;
  if (it.kind === 'tray') return !!(it.bake && it.bake.b > 0.5 && it.balls && it.balls[o.userData.piece]);
  if (MOLD_SHAPE[it.kind]) return !!(it.bake && it.bake.b > 0.5 && it.m && it.m.total() > 1);
  if (it.kind === 'bake' && PIECE_SHAPES.includes(it.shape)) return pieceCount(it) > 1;
  return false;
}
function takePiece(hit) {
  const it = hit.it, i = hit.obj.userData.piece;
  if (!hot3(it)) return true;
  const at = hit.point.clone(); let b;
  if (it.kind === 'tray') {
    const ball = it.balls.splice(i, 1)[0];
    b = mkBake('cookies', { balls: [ball], bake: it.bake, temp: it.temp }, at, null);
    if (!it.balls.length) it.bake = null;
  } else if (MOLD_SHAPE[it.kind]) {
    const cups = it.parts.cups.length; it.taken = it.taken || []; it.taken.push(i);
    const left = cups - it.taken.length + 1, part = it.m.take(1 / Math.max(1, left));
    b = mkBake(MOLD_SHAPE[it.kind], { m: part, bake: it.bake, temp: it.temp }, at, null); b.count = 1; b.washed = it.washed; refreshDims(b);
    if (it.taken.length >= cups) { it.m = new Mix(); it.bake = null; it.taken = null; it.washed = false; }
  } else {
    if (it.shape === 'cookies') {
      const ball = it.balls.splice(i, 1)[0]; it.m = trayMix(it);
      b = mkBake('cookies', { balls: [ball], bake: it.bake, temp: it.temp }, at, null);
    } else {
      const part = it.m.take(1 / it.count); it.count--;
      b = mkBake(it.shape, { m: part, bake: it.bake, temp: it.temp }, at, null); b.count = 1; b.washed = it.washed; refreshDims(b);
    }
    refreshDims(it);
  }
  b.temp = it.temp; beginHold(b, hit.point); SFX.click();
  const name = b.shape === 'cookies' ? (b.balls[0].shape === 'croissant' ? 'croissant' : 'cookie') : b.shape === 'madeleines' ? 'madeleine' : 'canelé';
  hintOnce('onePiece', `One ${name} in your hand. Put it on a plate, then come back for the next.`);
  return true;
}
// dropping a piece onto a plate (or onto a pile of the same thing) joins the pile
function pileUnder(it) {
  return bakesOf().find(o => o !== it && o.shape === it.shape && o.zone !== 'held' && visible3(o) && pieceCount(o) < 16 &&
    (o.shape !== 'cookies' || (o.balls[0] && o.balls[0].shape) === (it.balls[0] && it.balls[0].shape)) &&
    Math.hypot(o.p.x - it.p.x, o.p.z - it.p.z) < o.rad + 0.04 && it.p.y > o.p.y - 0.03 && it.p.y - o.p.y < 0.4);
}
const _release3Pc = release3;
release3 = function () {
  const it = held && held.it;
  if (it && it.kind === 'bake' && PIECE_SHAPES.includes(it.shape)) {
    const pile = pileUnder(it);
    if (pile) {
      held = null;
      if (it.shape === 'cookies') { pile.balls.push(...it.balls); pile.m = trayMix(pile); } else { pile.count += it.count; pile.m.merge(it.m); }
      pile.touched = touchN++; refreshDims(pile); remove3(it); SFX.plop(); return;
    }
  }
  _release3Pc();
};

/* ---------- a click on a bowl: tap = pick it up, press and drag inside = stir by hand ---------- */
const PEND = { v: null };
function stirCandidate(hit) {
  const it = hit.it, d = DEF[it.kind] || {};
  return it.m && d.recv && it.kind !== 'tray' && !DEF[it.kind].tool && it.m.total() > 0.5 && !it.bake && !it.m.shell && it.m.form() !== 'dough';
}
const _onDownPc = onDown3;
onDown3 = function () {
  if (!BOOK.open && !scorecard && !held && !heldDough && !drag) {
    if (MAG.hit && Math.hypot(PT.x - MAG.hit.x, PT.y - MAG.hit.y) < MAG.hit.r) { zoomOnto(MAG.hit.it); MAG.it = null; MAG.hit = null; SFX.click(); return; }
    const hit = pick3(PT.x, PT.y);
    if (hit && hit.it && canTakePiece(hit)) { takePiece(hit); return; }
    if (hit && hit.it && stirCandidate(hit)) { PEND.v = { hit, x: PT.x, y: PT.y }; return; }
  }
  _onDownPc();
};
function runPending(asDrag) {
  const p = PEND.v; PEND.v = null; if (!p) return;
  if (asDrag) { const x = PT.x, y = PT.y; PT.x = p.x; PT.y = p.y; _onDownPc(); PT.x = x; PT.y = y; return; }
  const it = p.hit.it;
  if (!hot3(it)) return;
  if (it.zone === 'mixer' && MX.speed > 0) { say('Switch the mixer off before taking the bowl.'); return; }
  beginHold(it, p.hit.point); SFX.click();
}
const _onMovePc = onMove3;
onMove3 = function () { if (PEND.v && PT.down && Math.hypot(PT.x - PEND.v.x, PT.y - PEND.v.y) > 7) runPending(true); _onMovePc(); };
const _onUpPc = onUp3;
onUp3 = function () { if (PEND.v) { runPending(false); if (held) held.fresh = false; return; } _onUpPc(); };

/* ---------- the magnifier: hover anything, click the little lens to look closer ---------- */
const MAG = { it: null, hit: null, lost: 0, n: 0, t: 0 };
function magTarget(it) { const d = DEF[it.kind] || {}; return it.kind !== 'drawerItem' && !d.tool && !d.fixed; }
const _drawUIPc = drawUI3;
drawUI3 = function () {
  _drawUIPc();
  const now = performance.now() / 1000, dt = Math.min(0.1, now - (MAG.t || now)); MAG.t = now;
  const busy = held || heldDough || drag || BOOK.open || scorecard || !PT.has || view === 'focus' || !recipe && false;
  if (busy) { MAG.it = null; MAG.hit = null; return; }
  if ((MAG.n++ % 4) === 0) {
    const onLens = MAG.hit && Math.hypot(PT.x - MAG.hit.x, PT.y - MAG.hit.y) < MAG.hit.r + 6;
    const h = onLens ? null : pick3(PT.x, PT.y);
    if (h && h.it && magTarget(h.it)) { MAG.it = h.it; MAG.lost = 0; } else if (!onLens) MAG.lost += dt * 4;
    if (MAG.lost > 0.7) MAG.it = null;
  }
  const it = MAG.it; if (!it || !items.includes(it) || !visible3(it)) { MAG.hit = null; return; }
  const p = it.p.clone().add(V3(0, (it.topY || it.h || 0.05) + 0.03, 0)).project(camera);
  if (p.z > 1) { MAG.hit = null; return; }
  const x = (p.x + 1) / 2 * uiW + 26, y = (1 - p.y) / 2 * uiH - 4, r = 14, over = Math.hypot(PT.x - x, PT.y - y) < r;
  MAG.hit = { x, y, r, it };
  const c = UI.getContext('2d'); c.save(); c.setTransform(uiDPR, 0, 0, uiDPR, 0, 0);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 6; c.fillStyle = over ? '#fff' : 'rgba(255,255,255,.88)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.shadowBlur = 0;
  c.strokeStyle = '#3c3a36'; c.lineWidth = 2; c.beginPath(); c.arc(x - 2, y - 2, 5.5, 0, TAU); c.stroke(); c.lineWidth = 2.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 2, y + 2); c.lineTo(x + 7, y + 7); c.stroke();
  if (over) { c.font = '600 12px Inter, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(40,36,30,.85)'; const w = c.measureText('Look closer').width + 14; c.fillRect(x - w / 2, y + r + 5, w, 19); c.fillStyle = '#fff'; c.fillText('Look closer', x, y + r + 18); }
  c.restore();
};
// double-click no longer zooms onto objects (it used to drop and grab them too)
UI.addEventListener('dblclick', e => { const h = pick3(PT.x, PT.y); if (h && (h.it || h.dough)) e.stopImmediatePropagation(); }, true);
const _hintPc = hint3;
hint3 = function () {
  const h = _hintPc();
  if (h && /Double-click anything/.test(h)) return 'Click to pick things up · the lens beside an item looks closer';
  return h;
};
const _hoverPc = hover3;
hover3 = function () {
  if (!held && !heldDough && !drag && PT.has && !BOOK.open) {
    const h = pick3(PT.x, PT.y);
    if (h && h.it && h.obj && h.obj.userData.piece != null && canTakePiece(h)) { const it = h.it, s = it.kind === 'tray' ? (it.balls[0].shape === 'croissant' ? 'croissant' : 'cookie') : it.kind === 'madeleine' || it.shape === 'madeleines' ? 'madeleine' : it.kind === 'canele' || it.shape === 'caneles' ? 'canelé' : (it.balls[0].shape === 'croissant' ? 'croissant' : 'cookie'); return `Click to take one ${s}` + (it.kind === 'bake' ? '' : ' · grab the edge to carry it all'); }
    if (h && h.it && stirCandidate(h)) return 'Click to pick up the bowl · press and drag inside to stir by hand';
  }
  return _hoverPc();
};
