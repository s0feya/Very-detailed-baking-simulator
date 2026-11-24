'use strict';
/* =========================================================
   Sauces behave like fluid: they land exactly where you aim
   (point at the spot on the bake), pool where you linger,
   spread out, and run down the sides at the edges.
   ========================================================= */

// height of the top surface at a local point (the loaf has a dome)
function surfAt(b, x, z) {
  if (b.shape === 'loaf') { const d = b.dims, W = d.rz + 0.004, sh = d.h * 0.58 + 0.012, f = Math.max(0, 1 - (z / W) * (z / W)); return sh + (d.h - sh) * Math.pow(f, 0.28) + 0.0015; }
  return topAt(b, x);
}
// keep a point on the bake; tells whether it is right at an edge
function clampTop(b, x, z) {
  const d = b.dims; let edge = null;
  if (b.shape === 'round' || b.shape === 'crepes' || b.shape === 'pie' || b.shape === 'boule') {
    const lim = (d.rx || 0.09) * 0.97, r = Math.hypot(x, z); if (r > lim) { x *= lim / r; z *= lim / r; } if (r > lim * 0.92) edge = { a: Math.atan2(z, x) };
  } else {
    const ex = (d.rx || 0.1) * 0.97, ez = (d.rz || 0.05) * 0.97;
    x = clamp(x, -ex, ex); z = clamp(z, -ez, ez);
    if (Math.abs(z) > ez * 0.82) edge = { side: Math.sign(z) }; else if (Math.abs(x) > ex * 0.95) edge = { end: Math.sign(x) };
  }
  return { x, z, edge };
}
drizzleAt = function (b, type, wx, wz, amt = 1) {
  b.drizzle = b.drizzle || []; let s = b.drizzle[b.drizzle.length - 1];
  const l = toLocal(b, wx, wz), c = clampTop(b, l.x, l.z), x = c.x, z = c.z, thin = b.shape === 'crepes';
  if (!s || s.type !== type || s.closed) { s = { type, pts: [], drips: [] }; b.drizzle.push(s); }
  const last = s.pts[s.pts.length - 1], w0 = thin ? 0.0022 : 0.0042, wMax = thin ? 0.006 : 0.016;
  if (last && Math.hypot(last.x - x, last.z - z) < 0.004) { last.w = Math.min(wMax, last.w + 0.00035 * amt); b.drizDirty = true; }
  else {
    // fill the gap with in-between drops so a fast stroke stays continuous
    const steps = last ? Math.min(8, Math.floor(Math.hypot(last.x - x, last.z - z) / 0.004)) : 0;
    for (let k = 1; k <= steps; k++) { const t = k / (steps + 1), px = lerp(last.x, x, t), pz = lerp(last.z, z, t); s.pts.push({ x: px, y: surfAt(b, px, pz), z: pz, w: w0 * (0.85 + Math.random() * 0.3) }); }
    s.pts.push({ x, y: surfAt(b, x, z), z, w: w0 * (0.9 + Math.random() * 0.3) }); b.drizDirty = true;
    if (s.pts.length > 900) s.closed = true;
  }
  // runs down the side when it reaches an edge
  if (c.edge && Math.random() < 0.5 * amt) {
    const d = b.dims; let drip = null;
    if (c.edge.a != null) { const a = c.edge.a; if (!s.drips.some(dd => dd.a != null && Math.abs(dd.a - a) < 0.16)) drip = { a, x: Math.cos(a) * (d.rx + 0.004), y: (b.topY || b.h) + 0.002, z: Math.sin(a) * (d.rx + 0.004), len: 0.012 + Math.random() * 0.025 }; }
    else if (c.edge.side) { const zz = c.edge.side * (d.rz + (b.shape === 'loaf' ? 0.006 : 0.003)); if (!s.drips.some(dd => dd.side === c.edge.side && Math.abs(dd.x - x) < 0.018)) drip = { side: c.edge.side, x, y: b.shape === 'loaf' ? d.h * 0.62 : (b.topY || b.h), z: zz, len: 0.012 + Math.random() * 0.03 }; }
    else if (c.edge.end) { const xx = c.edge.end * ((d.rx || 0.1) + 0.003); if (!s.drips.some(dd => dd.end === c.edge.end && Math.abs(dd.z - z) < 0.018)) drip = { end: c.edge.end, x: xx, y: surfAt(b, x, z) - 0.004, z, len: 0.01 + Math.random() * 0.025 }; }
    if (drip) { s.drips.push(drip); b.drizDirty = true; }
  }
};

const SAUCE_BLOB = new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2);
const SAUCE_DRIP = (() => { const g = new THREE.CapsuleGeometry(1, 1, 4, 10); return g; })();
drizzleRender = function (b) {
  if (!b.drizG) { b.drizG = new THREE.Group(); b.decoG.add(b.drizG); }
  const G = b.drizG; while (G.children.length) { const c = G.children.pop(); if (c.isInstancedMesh) c.dispose(); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), up = new THREE.Euler();
  for (const s of b.drizzle || []) {
    const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(ING[s.type].c)), roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, transmission: s.type === 'coulis' ? 0.15 : 0, thickness: 0.01 });
    const pts = s.pts; if (pts.length) {
      const im = new THREE.InstancedMesh(SAUCE_BLOB, mat, pts.length); im.castShadow = false;
      pts.forEach((p, i) => {
        // neighbouring drops share their size so the ribbon looks like one smooth flow
        const nb = (pts[i - 1] ? pts[i - 1].w : p.w) * 0.25 + p.w * 0.5 + (pts[i + 1] ? pts[i + 1].w : p.w) * 0.25;
        P.set(p.x, p.y + 0.0006, p.z); S.set(nb * 1.15, Math.max(0.0012, nb * 0.32), nb * 1.15); Q.identity(); M.compose(P, Q, S); im.setMatrixAt(i, M);
      });
      im.instanceMatrix.needsUpdate = true; im.userData.item = b; G.add(im);
    }
    if ((s.drips || []).length >= 6 && b.shape === 'round') { const top = mesh(new THREE.CylinderGeometry(b.dims.rx * 0.97, b.dims.rx * 0.97, 0.004, 48), mat, 0, (b.topY || b.h) + 0.003, 0, false); top.userData.item = b; G.add(top); }
    const drips = s.drips || []; if (drips.length) {
      const im = new THREE.InstancedMesh(SAUCE_DRIP, mat, drips.length * 2); let n = 0;
      for (const d of drips) {
        const r = b.shape === 'crepes' ? 0.0018 : 0.0032;
        P.set(d.x, d.y - d.len / 2, d.z); S.set(r, d.len / 2 + 0.0001, r * 0.7); Q.setFromEuler(up.set(0, d.a != null ? -d.a : d.side ? 0 : Math.PI / 2, 0)); M.compose(P, Q, S); im.setMatrixAt(n++, M);
        P.set(d.x, d.y - d.len - 0.001, d.z); S.set(r * 1.35, r * 1.5, r * 1.35); Q.identity(); M.compose(P, Q, S); im.setMatrixAt(n++, M); // the bead at the bottom
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; im.userData.item = b; G.add(im);
    }
  }
  b.drizDirty = false;
};

/* ---------- aiming: the sauce lands on the spot you point at ---------- */
const _pour3Sc = pour3;
pour3 = function (it, dt) {
  const d = DEF[it.kind];
  if (!d.drizzle) return _pour3Sc(it, dt);
  let b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.45, it.rad);
  if (!b || openGap(b) >= 0) return _pour3Sc(it, dt);
  // while pouring, the bottle glides on a level just above the bake: up/down on screen moves it back/forward
  const topW = b.p.y + (b.topY || b.h), lvl = topW + 0.12;
  if (viewT < 0.5) {
    setRay(PT.x, PT.y); const hp = planeHit(V3(0, 1, 0), V3(0, lvl + (held && held.it === it ? held.off.y : 0), 0));
    if (hp) { const zz = clamp(hp.z - (held && held.it === it ? held.off.z : 0), b.p.z - b.rad - 0.02, b.p.z + b.rad + 0.02); it.zTarget = zz; it.p.z += (zz - it.p.z) * Math.min(1, dt * 16); }
  }
  it.p.y += (Math.max(it.p.y, lvl) - it.p.y) * Math.min(1, dt * 16);
  if (!it.pdir) it.pdir = V3(-1, 0, 0);
  if (PT.speed < 2000) it.pourHold = (it.pourHold || 0) + dt;
  const want = it.pourHold > 0.1 ? 2.3 : 0; it.tilt += clamp(want - it.tilt, -3.6 * dt, 3 * dt); applyTilt(it); it.stream = null;
  if (it.tilt < 1.6 || it.stock < 0.2) return;
  const lip = lip3(it), amt = Math.min(it.stock, 6 * dt); it.stock -= amt;
  const tx = lip.x, tz = lip.z, l = toLocal(b, tx, tz), c = clampTop(b, l.x, l.z);
  const ty = b.p.y + surfAt(b, c.x, c.z) + 0.003;
  it.stream = { type: 'liquid', a: lip, b: V3(tx, ty, tz), col: ING[d.src].c, rate: 6 };
  drizzleAt(b, d.src, tx, tz, amt / (6 / 60)); it.drizStroke = true; recordCream(b, { whip: 0.85 }, 0);
};
