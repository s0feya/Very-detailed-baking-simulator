'use strict';
/* =========================================================
   Real cream coating:
   1. pour whipped cream onto the cake (it plops and holds shape)
   2. the offset spatula lies flat on the top and pushes the cream
      level, carrying the excess and pushing it over the edge
   3. held upright against the side it smooths a coat all round
   The cream is a height field with real thickness, drawn as an
   actual surface. The turntable has a motor and an on/off button.
   ========================================================= */

const FN = 40, FA = 72, FV = 10;       // top grid, side angles, side rows
const CREAM_V = 2e-6;                  // m³ per gram of whipped cream
const FROST = { blobs: [] };

function crInit(b) {
  if (b.cr) return b.cr;
  b.cr = { top: new Float32Array(FN * FN), side: new Float32Array(FA * FV), lip: new Float32Array(FA), poured: 0, active: 0, dirty: true, whip: 0.8, t: 0 };
  return b.cr;
}
const crR = b => b.dims.rx;
const cellA = b => { const c = 2 * crR(b) / FN; return c * c; };
function topIdx(b, x, z) { const R = crR(b), i = Math.floor((x / R * 0.5 + 0.5) * FN), j = Math.floor((z / R * 0.5 + 0.5) * FN); return i < 0 || j < 0 || i >= FN || j >= FN ? -1 : i * FN + j; }
function cellXZ(b, k) { const R = crR(b), i = Math.floor(k / FN), j = k % FN; return [((i + 0.5) / FN * 2 - 1) * R, ((j + 0.5) / FN * 2 - 1) * R]; }
function inDisc(b, k) { const [x, z] = cellXZ(b, k); return x * x + z * z <= crR(b) * crR(b) * 0.985; }
const sideAng = (x, z) => ((Math.atan2(x, z) % TAU) + TAU) % TAU;
function worldOf(b, lx, lz) { const s = spinOf(b) + (b.yaw || 0); return V3(b.p.x + lx * Math.cos(s) + lz * Math.sin(s), 0, b.p.z - lx * Math.sin(s) + lz * Math.cos(s)); }
const filledOk = b => b.layers < 2 || (b.fills.length >= b.layers - 1 && b.fills.slice(0, b.layers - 1).every(f => f >= 25));

/* ---------- adding cream ---------- */
function crDeposit(b, lx, lz, vol, sig = 0.014) {
  const C = crInit(b), A = cellA(b), R = crR(b), r2 = lx * lx + lz * lz;
  if (r2 > R * R * 0.97) { const a = sideAng(lx, lz); crSideAdd(b, a, vol, true); return; }
  let wsum = 0; const ws = [];
  for (let k = 0; k < FN * FN; k++) { const [x, z] = cellXZ(b, k), d2 = (x - lx) ** 2 + (z - lz) ** 2; if (d2 > 9 * sig * sig || !inDisc(b, k)) continue; const w = Math.exp(-d2 / (2 * sig * sig)); ws.push([k, w]); wsum += w; }
  if (!wsum) return; ws.forEach(([k, w]) => C.top[k] += vol * w / wsum / A);
  C.active = 2.5; C.dirty = true;
}
// cream on the side at angle a (spread over a few rows; from the top it lands on the upper rows)
function crSideAdd(b, a, vol, fromTop) {
  const C = crInit(b), R = crR(b), H = b.topY || b.h, ai = Math.floor(a / TAU * FA) % FA, cellArea = (TAU * R / FA) * (H / FV);
  for (let v = 0; v < FV; v++) { const w = fromTop ? (v >= FV - 3 ? 0.33 : 0) : 1 / FV; if (!w) continue; for (let d = -2; d <= 2; d++) C.side[(((ai + d) % FA + FA) % FA) * FV + v] += vol * w * [0.12, 0.22, 0.32, 0.22, 0.12][d + 2] / cellArea; }
  if (fromTop) C.lip[ai] = Math.min(0.005, C.lip[ai] + vol * 0.1 / (cellArea * 2));
  // gravity: what spills over runs down the side; past ~1 cm it drops off onto the turntable
  for (let d = -2; d <= 2; d++) { const ia = (((ai + d) % FA) + FA) % FA; for (let v = FV - 1; v > 0; v--) { const k = ia * FV + v; if (C.side[k] > 0.006) { const mv = (C.side[k] - 0.006) * 0.7; C.side[k] -= mv; C.side[k - 1] += mv; } } const k0 = ia * FV; if (C.side[k0] > 0.012) C.side[k0] = 0.012; }
  C.active = 2.5; C.dirty = true;
}

/* ---------- cream physics: holds its shape, slumps only when too steep ---------- */
function crRelax(b, dt) {
  const C = b.cr; if (!C || C.active <= 0) return; C.active -= dt;
  const cell = 2 * crR(b) / FN, stiff = clamp((C.whip - 0.4) / 0.5, 0, 1), smax = cell * lerp(0.35, 0.85, stiff), A = cellA(b);
  const T = C.top;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < FN; i++) for (let j = 0; j < FN; j++) {
    const k = i * FN + j; if (T[k] <= 0) continue;
    for (const [di, dj] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= FN || jj >= FN) continue; const kk = ii * FN + jj;
      if (!inDisc(b, kk)) { // over the edge: steep cream runs down the side
        if (T[k] > smax * 1.6) { const mv = (T[k] - smax * 1.6) * 0.15; T[k] -= mv; const [x, z] = cellXZ(b, kk); crSideAdd(b, sideAng(x, z), mv * A, true); }
        continue;
      }
      const lim = smax * (di && dj ? 1.414 : 1), diff = T[k] - T[kk]; if (diff > lim) { const mv = (diff - lim) * 0.12; T[k] -= mv; T[kk] += mv; C.dirty = true; }
    }
  }
  // soft rounding: whipped cream heaps are domes, not pyramids
  if (C.active > 2.3) { const S = T.slice(); for (let i = 1; i < FN - 1; i++) for (let j = 1; j < FN - 1; j++) { const k = i * FN + j; if (!inDisc(b, k)) continue; let n = 0, s = 0; for (const kk of [k - 1, k + 1, k - FN, k + FN]) if (inDisc(b, kk)) { s += S[kk]; n++; } if (n) T[k] = S[k] * 0.94 + (s / n) * 0.06; } }
  // thick cream on the side sags a little
  for (let a = 0; a < FA; a++) for (let v = FV - 1; v > 0; v--) { const k = a * FV + v; if (C.side[k] > 0.009) { const mv = (C.side[k] - 0.009) * 0.1; C.side[k] -= mv; C.side[k - 1] += mv; C.dirty = true; } }
}

/* ---------- the spatula ---------- */
function bladeLoadVol(tool) { return (tool.carry || 0) + (tool.m ? tool.m.total() * CREAM_V : 0); }
function takeLoad(tool, vol) {
  let got = Math.min(vol, tool.carry || 0); tool.carry = (tool.carry || 0) - got;
  if (got < vol && tool.m && tool.m.total() > 0.05) { const g = Math.min(tool.m.total(), (vol - got) / CREAM_V); tool.m.take(g / tool.m.total()); got += g * CREAM_V; }
  return got;
}
// flat on top: blade = segment of local points, level = coat thickness
function frostTop(b, tool, p0, p1, level, dt) {
  const C = crInit(b), A = cellA(b), R = crR(b), half = 0.012;
  const mid = { x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2 }, last = tool.frLast && tool.frLast.b === b ? tool.frLast : null;
  const mvx = last ? mid.x - last.x : 0, mvz = last ? mid.z - last.z : 0, mv = Math.hypot(mvx, mvz); tool.frLast = { b, x: mid.x, z: mid.z };
  if (mv < 1e-5 && last) return; // a still blade doesn't push
  const ux = p1.x - p0.x, uz = p1.z - p0.z, L2 = ux * ux + uz * uz || 1;
  let scraped = 0; const holes = [];
  for (let k = 0; k < FN * FN; k++) {
    if (!inDisc(b, k)) continue; const [x, z] = cellXZ(b, k);
    const t = clamp(((x - p0.x) * ux + (z - p0.z) * uz) / L2, 0, 1), dx = x - (p0.x + ux * t), dz = z - (p0.z + uz * t);
    if (dx * dx + dz * dz > half * half) continue;
    if (C.top[k] > level) { scraped += (C.top[k] - level) * A; C.top[k] = level; }
    else holes.push(k);
  }
  tool.carry = (tool.carry || 0) + scraped;
  // fill the low spots under the blade from what it carries
  for (const k of holes) { const need = (level - C.top[k]) * A * 0.5; if (need <= 0) continue; const got = takeLoad(tool, need); C.top[k] += got / A; }
  // the extra rides on the blade as a bank; where the blade reaches past the rim it falls over the side
  const extra = tool.carry || 0, rr0 = Math.hypot(p0.x, p0.z), rr1 = Math.hypot(p1.x, p1.z);
  if (extra > 1e-8 && Math.max(rr0, rr1) > R * 0.95) {
    const e = rr1 > rr0 ? p1 : p0, spill = extra * Math.min(1, dt * 6);
    tool.carry -= spill; crSideAdd(b, sideAng(e.x, e.z), spill, true);
  }
  C.active = 2; C.dirty = true;
}
// upright at the side: blade at radius r covers a narrow band of angles, every row it reaches
function frostSide(b, tool, a, r, yLow, dt) {
  const C = crInit(b), R = crR(b), H = b.topY || b.h, target = clamp(r - R, 0.0015, 0.01), cellArea = (TAU * R / FA) * (H / FV);
  const last = tool.frSide && tool.frSide.b === b ? tool.frSide.a : null; tool.frSide = { b, a };
  const da = last == null ? 0 : Math.atan2(Math.sin(a - last), Math.cos(a - last)); if (last != null && Math.abs(da) < 1e-4) return;
  const ai = Math.floor(a / TAU * FA), span = 2 + Math.ceil(Math.abs(da) / TAU * FA);
  let scraped = 0; const holes = [];
  for (let d = -span; d <= span; d++) {
    const ia = ((ai + d) % FA + FA) % FA;
    for (let v = 0; v < FV; v++) {
      const y = (v + 0.5) / FV * H; if (y < yLow) continue;
      const k = ia * FV + v; if (C.side[k] > target) { scraped += (C.side[k] - target) * cellArea; C.side[k] = target; } else holes.push(k);
    }
    // cream pushed up past the top edge makes a crown, the blade trims it too
    if (C.lip[ia] > 0.006) { scraped += (C.lip[ia] - 0.006) * cellArea; C.lip[ia] = 0.006; }
  }
  tool.carry = (tool.carry || 0) + scraped * 0.9;
  if (scraped > 0) { const lipA = ((ai - Math.sign(da || 1) * 2) % FA + FA) % FA; C.lip[lipA] += scraped * 0.1 / cellArea; }
  for (const k of holes) { const need = (target - C.side[k]) * cellArea * 0.55; if (need <= 0) continue; C.side[k] += takeLoad(tool, need) / cellArea; }
  C.active = 2; C.dirty = true;
}

/* ---------- syncing coverage numbers (used by steps, judging, decorating) ---------- */
function crCoverage(b) {
  const C = b.cr; if (!C) return;
  const R = crR(b);
  for (let i = 0; i < COVN; i++) for (let j = 0; j < COVN; j++) { const x = ((i + 0.5) / COVN * 2 - 1) * R, z = ((j + 0.5) / COVN * 2 - 1) * R, k = topIdx(b, x, z); b.covTop[i * COVN + j] = k < 0 ? 0 : Math.min(1.2, C.top[k] / 0.0022); }
  const n = b.covSide.length;
  for (let s = 0; s < n; s++) { const a0 = Math.floor(s / n * FA); let t = 0; for (let v = 0; v < FV; v++) t += Math.min(1, C.side[a0 * FV + v] / 0.0022); b.covSide[s] = t / FV; }
  let sum = 0, cnt = 0; for (let k = 0; k < FN * FN; k++) if (inDisc(b, k)) { sum += C.top[k]; cnt++; } C.avgTop = cnt ? sum / cnt : 0;
}
function topFlatness(b) { const C = b.cr; if (!C) return 1; let s = 0, s2 = 0, n = 0; for (let k = 0; k < FN * FN; k++) { if (!inDisc(b, k)) continue; const [x, z] = cellXZ(b, k); if (x * x + z * z > crR(b) * crR(b) * 0.8) continue; s += C.top[k]; s2 += C.top[k] ** 2; n++; } const m = s / n; return Math.sqrt(Math.max(0, s2 / n - m * m)); }

/* ---------- drawing the cream as a real surface ---------- */
function crMeshes(b) {
  const C = b.cr; if (C.g) return C.g;
  const g = new THREE.Group(); b.decoG.add(g); C.g = g;
  const mat = CREAMMAT.clone(); mat.side = THREE.DoubleSide; mat.map = null; mat.color = new THREE.Color(0xfffcf4); mat.roughness = 0.45;
  // top grid
  const M = FN, tg = new THREE.BufferGeometry(), tp = new Float32Array((M + 1) * (M + 1) * 3), ti = [];
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, bb = (i + 1) * (M + 1) + j, c = i * (M + 1) + j + 1, d = (i + 1) * (M + 1) + j + 1; ti.push(a, c, bb, bb, c, d); }
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setIndex(ti);
  const uv = new Float32Array((M + 1) * (M + 1) * 2); for (let i = 0; i <= M; i++) for (let j = 0; j <= M; j++) { uv[(i * (M + 1) + j) * 2] = i / M * 3; uv[(i * (M + 1) + j) * 2 + 1] = j / M * 3; } tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  C.topM = mesh(tg, mat, 0, 0, 0, false); C.topM.receiveShadow = true; g.add(C.topM);
  // side shell
  const sg = new THREE.BufferGeometry(), sp = new Float32Array((FA + 1) * (FV + 2) * 3), si = [], suv = new Float32Array((FA + 1) * (FV + 2) * 2);
  for (let a = 0; a < FA; a++) for (let v = 0; v < FV + 1; v++) { const p = a * (FV + 2) + v, q = (a + 1) * (FV + 2) + v; si.push(p, q, p + 1, q, q + 1, p + 1); }
  for (let a = 0; a <= FA; a++) for (let v = 0; v <= FV + 1; v++) { suv[(a * (FV + 2) + v) * 2] = a / FA * 6; suv[(a * (FV + 2) + v) * 2 + 1] = v / (FV + 1); }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.BufferAttribute(suv, 2)); sg.setIndex(si);
  C.sideM = mesh(sg, mat, 0, 0, 0, false); g.add(C.sideM);
  g.traverse(o => { if (o.isMesh) o.userData.item = b; });
  return g;
}
function crRender(b) {
  const C = b.cr; if (!C || !C.dirty) return; C.dirty = false;
  crMeshes(b); crCoverage(b);
  const R = crR(b), H = b.topY || b.h, M = FN, pos = C.topM.geometry.attributes.position.array, hide = 0.0015;
  const sideTopT = a => { const ai = ((Math.floor(a / TAU * FA)) % FA + FA) % FA; return C.side[ai * FV + FV - 1]; };
  const cellH = (i, j) => (i < 0 || j < 0 || i >= FN || j >= FN) ? 0 : C.top[i * FN + j];
  // one shared rim where the top coat meets the side coat
  const rim = a => { const ai = ((Math.floor(a / TAU * FA)) % FA + FA) % FA, st = C.side[ai * FV + FV - 1], k = topIdx(b, Math.sin(a) * R * 0.92, Math.cos(a) * R * 0.92), et = k >= 0 ? C.top[k] : 0, h = Math.max(et, st * 0.8) + C.lip[ai];
    const vis = h > 0.0003; return { r: vis ? R + Math.max(Math.min(st, 0.012) * 0.7, 0.0006) : R - 0.004, y: vis ? H + h + 0.0004 : H - hide, vis }; };
  for (let i = 0; i <= M; i++) for (let j = 0; j <= M; j++) {
    let x = (i / M * 2 - 1) * R, z = (j / M * 2 - 1) * R;
    let h = (cellH(i - 1, j - 1) + cellH(i, j - 1) + cellH(i - 1, j) + cellH(i, j)) / 4;
    const r = Math.hypot(x, z), a = sideAng(x, z);
    const o = (i * (M + 1) + j) * 3;
    if (r > R * 0.97) { const e = rim(a); pos[o] = x / (r || 1) * e.r; pos[o + 1] = e.y; pos[o + 2] = z / (r || 1) * e.r; continue; }
    const vis = h > 0.0003; pos[o] = x; pos[o + 1] = H + (vis ? h + 0.0004 : -hide); pos[o + 2] = z;
  }
  C.topM.geometry.attributes.position.needsUpdate = true; C.topM.geometry.computeVertexNormals();
  const sp = C.sideM.geometry.attributes.position.array;
  const sideT = (a, v) => C.side[(((a % FA) + FA) % FA) * FV + clamp(v, 0, FV - 1)];
  for (let a = 0; a <= FA; a++) {
    const th = a / FA * TAU;
    for (let v = 0; v <= FV + 1; v++) {
      let t, y;
      if (v <= FV) { const vv = v - 0.5; t = (sideT(a - 1, Math.floor(vv)) + sideT(a, Math.floor(vv)) + sideT(a - 1, Math.ceil(vv)) + sideT(a, Math.ceil(vv))) / 4; y = v / FV * H; }
      else { const e = rim(th), o2 = (a * (FV + 2) + v) * 3; sp[o2] = Math.sin(th) * e.r; sp[o2 + 1] = e.vis ? e.y : H - 0.003; sp[o2 + 2] = Math.cos(th) * e.r; continue; }
      const rr = t > 0.0003 ? R + Math.min(t, 0.012) : R - 0.004, o = (a * (FV + 2) + v) * 3;
      sp[o] = Math.sin(th) * rr; sp[o + 1] = Math.max(0.0005, y); sp[o + 2] = Math.cos(th) * rr;
    }
  }
  C.sideM.geometry.attributes.position.needsUpdate = true; C.sideM.geometry.computeVertexNormals();
}
// the old flat "painted" frosting is replaced by the real cream on round cakes
const _rebuildBakeFr = rebuildBake;
rebuildBake = function (b) {
  _rebuildBakeFr(b);
  if (b.shape !== 'round') return;
  b.model.traverse(o => { if (o.isMesh && o.material && (o.material.alphaMap === b.topTex || o.material.alphaMap === b.sideTex)) o.visible = false; });
  if (b.cr) { b.cr.dirty = true; }
};
// decorations sit on top of the cream
const _topAtFr = topAt;
topAt = function (b, lx) { const t = _topAtFr(b, lx); return b.shape === 'round' && b.cr ? t + (b.cr.avgTop || 0) : t; };

/* ---------- pouring whipped cream from the bowl ---------- */
const creamBowlOk = it => it.m && DEF[it.kind] && DEF[it.kind].recv && it.m.total() > 2 && (isCream(it.m) || creamy(it.m)) && (it.m.whip || 0) > 0.4;
function spawnBlob(b, from, g) {
  const r = Math.cbrt(g * CREAM_V * 3 / (4 * Math.PI)), m = mesh(new THREE.SphereGeometry(r, 14, 10), CREAMMAT, from.x, from.y, from.z, false);
  m.scale.set(1, 1.15, 1); scene.add(m); FROST.blobs.push({ b, m, v: 0, g, wob: Math.random() * 6 });
}
const _pour3Fr = pour3;
pour3 = function (it, dt) {
  if (!creamBowlOk(it)) return _pour3Fr(it, dt);
  const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.45, it.rad);
  if (!b || b.shape !== 'round') return _pour3Fr(it, dt);
  it.zTarget = b.p.z; if (!it.pdir) it.pdir = V3(-1, 0, 0);
  it.p.y = Math.max(it.p.y, b.p.y + (b.topY || b.h) + 0.1);
  if (PT.speed < 1500) it.pourHold = (it.pourHold || 0) + dt; else it.pourHold = Math.max(0, (it.pourHold || 0) - dt);
  const want = it.pourHold > 0.25 ? 2.0 : 0; it.tilt += clamp(want - it.tilt, -3 * dt, 2.2 * dt); applyTilt(it); it.stream = null;
  if (it.tilt < 1.4) return;
  it.blobT = (it.blobT || 0) + dt;
  if (it.blobT > 0.3) {
    it.blobT = 0; const g = Math.min(it.m.total(), 5 + Math.random() * 3); const part = it.m.take(g / it.m.total());
    const C = crInit(b); C.whip = lerp(C.whip, part.whip || 0.8, 0.3);
    if (!filledOk(b) && typeof addFill === 'function' && openGap(b) >= 0) { addFill(b, 'cream', g); hintOnce('pourFill', 'The cream is filling the layer first.'); }
    else spawnBlob(b, lip3(it), g);
    recordCream(b, part, g); sNoise(0.06, 500, 1, 0.08, 'lowpass');
  }
};

/* ---------- the spatula: flat on top, upright on the side ---------- */
const _decoToolFr = decoTool;
decoTool = function (it, dt) {
  const d = DEF[it.kind]; it.frostMode = null;
  if (!d.spread) return _decoToolFr(it, dt);
  if (recv3().some(r => isCream(r.m) && inOpen(opening3(r), it.p.x, it.p.z, 0))) return _decoToolFr(it, dt); // dipping into the bowl
  const b = bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0.05);
  if (!b || b.shape !== 'round' || !filledOk(b)) return _decoToolFr(it, dt);
  frostWithTool(b, it, dt, false);
};
// shared by play and by Skip; returns the mode
function frostWithTool(b, it, dt, auto) {
  crInit(b); it.zTarget = b.p.z;
  const R = crR(b), H = b.topY || b.h, top = b.p.y + H, l = toLocal(b, it.p.x, it.p.z), lr = Math.hypot(l.x, l.z);
  let side = it.frostSideMode || false;
  if (!side && lr > R * 1.0) side = true; else if (side && lr < R * 0.82) side = false;
  if (auto != null && typeof auto === 'string') side = auto === 'side';
  it.frostSideMode = side;
  if (side) {
    it.frostMode = 'side'; it.dipY = b.p.y + 0.004;
    // pressed against the cake: the blade rides on the coat
    const a = sideAng(l.x, l.z), want = R + 0.0045;
    if (lr < want) { const w = worldOf(b, Math.sin(a) * want, Math.cos(a) * want); it.p.x = w.x; it.p.z = w.z; }
    if (it.p.y < top - 0.005) frostSide(b, it, a, Math.max(lr, want), it.p.y - b.p.y, dt);
    return 'side';
  }
  it.frostMode = 'top'; const level = 0.0035; it.dipY = top + level;
  if (it.p.y > top + 0.016) { it.frLast = null; return 'top'; }
  // blade lies along x, centred on the hand
  const w0 = toLocal(b, it.p.x - 0.055, it.p.z), w1 = toLocal(b, it.p.x + 0.055, it.p.z);
  frostTop(b, it, w0, w1, level, dt);
  return 'top';
}
const _syncItemFr = syncItem;
syncItem = function (it) {
  _syncItemFr(it);
  if (it.kind === 'offset' && it.frostMode && (it.zone === 'held' || it.pose === 'held')) {
    if (it.frostMode === 'top') { it.root.rotation.set(Math.PI / 2, 0, -Math.PI / 2 + 0.05); it.root.position.x = it.p.x - 0.065; }
    else { const b = bakesOf('round').find(x => Math.hypot(x.p.x - it.p.x, x.p.z - it.p.z) < 0.2); if (b) it.root.rotation.set(0, Math.atan2(it.p.x - b.p.x, it.p.z - b.p.z), 0); }
  }
  if (it.kind === 'offset' && it.parts && it.parts.load) { const has = bladeLoadVol(it) > 0.6e-6; it.parts.load.visible = has; if (has) { const s = clamp(Math.cbrt(bladeLoadVol(it) / CREAM_V / 30), 0.4, 1.4); it.parts.load.scale.set(s, 0.6 * s, 0.5 * s); } }
  if (it.kind === 'bake' && it.cr) crRender(it);
  if (it.kind === 'turntable') ttButton(it);
};

/* ---------- electric turntable ---------- */
function ttButton(t) {
  const P = t.parts; if (!P) return;
  if (P.btn) { P.led.material.color.setHex(t.motor ? 0x4cd964 : 0x553333); P.btn.position.y = t.motor ? 0.0335 : 0.0355; return; }
  // a little motor pod in front of the base, outside the spinning plate
  const pod = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), new THREE.MeshPhysicalMaterial({ color: 0xf4f3f0, roughness: 0.3, clearcoat: 0.6 }), 0, 0.015, 0.175); pod.userData.ctrl = 'ttBtn';
  const btn = mesh(new THREE.CylinderGeometry(0.009, 0.0095, 0.008, 24), new THREE.MeshPhysicalMaterial({ color: 0xd8463a, roughness: 0.3, clearcoat: 0.8 }), -0.008, 0.0355, 0.175); btn.userData.ctrl = 'ttBtn';
  const led = mesh(new THREE.SphereGeometry(0.003, 10, 8), new THREE.MeshBasicMaterial({ color: 0x553333 }), 0.016, 0.031, 0.175, false); led.userData.ctrl = 'ttBtn';
  const lab = mesh(new THREE.PlaneGeometry(0.05, 0.012), new THREE.MeshBasicMaterial({ map: canvTex(160, 40, (c, w, h) => { c.fillStyle = '#8b8b8b'; c.font = '700 22px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('MOTOR', w / 2, 28); }), transparent: true }), 0, 0.015, 0.1952, false);
  const cord = mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd }), 0, 0.003, 0.115, false); cord.rotation.x = Math.PI / 2;
  [pod, btn, led, lab, cord].forEach(m => t.model.add(m)); P.btn = btn; P.led = led;
}
const _pickCtrlFr = pickCtrl;
pickCtrl = function (c) {
  if (c === 'ttBtn') { const t = findTT(); if (t) { t.motor = !t.motor; SFX.click(); say(t.motor ? 'Turntable on. Hold the spatula against the cake.' : 'Turntable off.', 2); } return; }
  _pickCtrlFr(c);
};
const findTT = () => items.find(i => i.kind === 'turntable');
const _hoverFr = hover3;
hover3 = function () { if (!held && !drag && PT.has && !BOOK.open && !TABLE.on) { const h = pick3(PT.x, PT.y); if (h && h.ctrl === 'ttBtn') { const t = findTT(); return t && t.motor ? 'Turntable motor: on · click to stop' : 'Turntable motor: click to start spinning'; } } if (held && held.it.kind === 'offset' && held.it.frostMode) return held.it.frostMode === 'top' ? 'Blade flat on the top: sweep across, let the turntable spin · move past the edge to do the sides' : 'Blade upright on the side: hold still while it spins · move inwards to go back to the top'; if (held && creamBowlOk(held.it)) { const b = bakeUnder(held.it.p.x, held.it.p.y, held.it.p.z, 0.45, held.it.rad); if (b && b.shape === 'round') return 'Hold still over the cake to pour the whipped cream'; } return _hoverFr(); };
const _tickFr = tick3;
tick3 = function (dt) {
  _tickFr(dt);
  const dtG = dt;
  for (const t of items) if (t.kind === 'turntable' && t.motor) { t.spinV = lerp(t.spinV || 0, 3.0, Math.min(1, dt * 3)); if (Math.random() < dt * 8) sNoise(0.05, 120, 1, 0.03, 'lowpass'); }
  // falling blobs of cream
  for (let i = FROST.blobs.length - 1; i >= 0; i--) {
    const B = FROST.blobs[i], b = B.b; B.v += 9.8 * dtG; B.m.position.y -= B.v * dtG; B.wob += dtG * 20; B.m.scale.set(1 + Math.sin(B.wob) * 0.05, 1.15 - Math.sin(B.wob) * 0.05, 1);
    const l = toLocal(b, B.m.position.x, B.m.position.z), C = crInit(b), k = topIdx(b, l.x, l.z), surf = b.p.y + (b.topY || b.h) + (k >= 0 ? C.top[k] : 0);
    if (!items.includes(b) || B.m.position.y <= surf) { scene.remove(B.m); FROST.blobs.splice(i, 1); if (items.includes(b)) { crDeposit(b, l.x + (Math.random() - 0.5) * 0.02, l.z + (Math.random() - 0.5) * 0.02, B.g * CREAM_V, 0.017); C.poured += B.g; SFX.plop && Math.random() < 0.5 && SFX.plop(); } }
  }
  for (const b of items) if (b.kind === 'bake' && b.cr) crRelax(b, dt);
};

/* ---------- recipe steps: pour, top, sides ---------- */
const FR_POUR = 'Pour the whipped cream onto the top of the cake.';
const FR_TOP = 'Switch on the turntable and smooth the top flat with the offset spatula.';
const FR_SIDE = 'Hold the spatula upright against the side to coat the sides.';
const crTopOk = b => b.cr && covAvg(b) >= 0.8 && topFlatness(b) < 0.0018;
RECIPES.forEach(R => {
  const i = R.steps.findIndex(s => /cover the whole cake|coat the whole cake/i.test(s.t)); if (i < 0) return;
  R.steps.splice(i, 1,
    { t: FR_POUR, c: () => roundB().some(b => (b.cr && b.cr.poured >= 50) || coverOk(b)) },
    { t: FR_TOP, c: () => roundB().some(b => crTopOk(b) || coverOk(b)) },
    { t: FR_SIDE, c: () => roundB().some(coverOk) });
});
HINTS.unshift(
  [/pour the whipped cream onto/i, ['bowlD', 'turntable'], 'Pick up the bowl of whipped cream and hold it still over the cake. It tips and the cream plops out in thick dollops.'],
  [/smooth the top flat/i, ['offset', 'turntable'], 'Press the red button on the turntable. Hold the offset spatula flat on the cream and sweep from the middle outwards; extra cream gets pushed over the edge.'],
  [/upright against the side/i, ['offset', 'turntable'], 'Move the spatula past the edge of the cake: it turns upright. Hold it against the side while the turntable spins.']);

/* ---------- Skip ---------- */
const _performStepFr = performStep;
performStep = async function (i) {
  const t = recipe.steps[i].t; const b = roundB()[0];
  if (b && t === FR_POUR) {
    const bowl = await ensureCream(); look(b); const back = bowl.p.clone(), z = bowl.zone, tt = findTT();
    await flyTo(bowl, b.p.clone().add(V3(0.04, (b.topY || b.h) + 0.14, 0)), 0.6); bowl.pdir = V3(-1, 0, 0); bowl.zone = 'auto';
    const C = crInit(b); C.whip = bowl.m.whip || 0.8; let acc = 0, poured = 0;
    await animate(2.4, (k, raw, dt) => { bowl.tilt = Math.min(2, raw * 5); applyTilt(bowl); acc += dt || 1 / 60; if (bowl.tilt > 1.4 && acc > 0.12 && poured < 120 && bowl.m.total() > 6) { acc = 0; const g = 7; poured += g; const p = lip3(bowl); bowl.p.x = b.p.x + 0.035 + Math.sin(raw * 9) * 0.025; spawnBlob(b, p, g); bowl.m.take(g / bowl.m.total()); } });
    bowl.tilt = 0; applyTilt(bowl); await waitS(0.6); await flyTo(bowl, back, 0.5); bowl.zone = z; bowl.p.copy(back);
    if (C.poured < 50) { crDeposit(b, 0, 0, (60 - C.poured) * CREAM_V, 0.03); C.poured = 60; }
    return;
  }
  if (b && t === FR_TOP) {
    look(b); const tt = findTT(); if (tt) tt.motor = true; const tool = findK('offset'); if (!tool) return;
    tool.pose = 'held'; await flyTo(tool, b.p.clone().add(V3(0, (b.topY || b.h) + 0.03, 0)), 0.5);
    await animate(4.2, (k, raw, dt) => { const r = crR(b) * (0.25 + 0.6 * Math.abs(Math.sin(raw * Math.PI * 2))); tool.p.set(b.p.x + r - 0.02, b.p.y + (b.topY || b.h) + 0.0035, b.p.z); tool.frostMode = 'top'; frostWithTool(b, tool, dt || 1 / 60, 'top'); });
    await waitS(0.4); if (!crTopOk(b)) { const C = b.cr; let v = 0; for (let k = 0; k < FN * FN; k++) if (inDisc(b, k)) { v += C.top[k]; } for (let k = 0; k < FN * FN; k++) if (inDisc(b, k)) C.top[k] = 0.0035; C.dirty = true; }
    tool.frostMode = null; await home(tool); return;
  }
  if (b && t === FR_SIDE) {
    look(b); const tt = findTT(); if (tt) tt.motor = true; const tool = findK('offset'); if (!tool) return;
    const cream = await ensureCream(); tool.m = tool.m || new Mix(); tool.m.merge(cream.m.take(Math.min(1, 60 / Math.max(1, cream.m.total()))));
    tool.pose = 'held'; await flyTo(tool, b.p.clone().add(V3(crR(b) + 0.03, 0.06, 0)), 0.5);
    await animate(4.5, (k, raw, dt) => { tool.p.set(b.p.x + crR(b) + 0.0045, b.p.y + 0.004, b.p.z); tool.frostMode = 'side'; frostWithTool(b, tool, dt || 1 / 60, 'side'); });
    await waitS(0.3); if (!coverOk(b)) { const C = b.cr; for (let k = 0; k < FA * FV; k++) C.side[k] = Math.max(C.side[k], 0.0035); C.dirty = true; crRender(b); }
    tool.frostMode = null; tool.m = new Mix(); tool.carry = 0; if (tt) tt.motor = false; await home(tool); return;
  }
  return _performStepFr(i);
};
