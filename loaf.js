'use strict';
/* =========================================================
   Better bread & pastry looks:
   - the loaf is a proper sandwich loaf (straight sides, rounded
     corners, a domed top that puffs out over the tin)
   - slicing makes real slices that lean away and show the crumb
   - warmer, glossier, more golden crusts everywhere
   ========================================================= */

/* ---------- warmer crust colours ---------- */
CRUST.length = 0;
CRUST.push([0, null], [0.4, [243, 214, 150]], [0.8, [228, 168, 82]], [1.1, [204, 128, 48]], [1.5, [158, 84, 30]], [2, [96, 50, 22]], [3, [34, 22, 14]]);

// the shared "speck" texture becomes a warm, mottled bake (no grey dots)
(function () {
  const c = TX.speck.image, g = c.getContext('2d'), w = c.width, h = c.height;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 22, light = Math.random() < 0.5; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, light ? 'rgba(255,248,225,.55)' : 'rgba(196,120,52,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(150,82,30,${0.08 + Math.random() * 0.18})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 0.6 + Math.random() * 1.3, 0, TAU); g.fill(); }
  TX.speck.needsUpdate = true;
})();

// crusts get a soft buttery sheen; egg-washed ones a real glaze
const _stdMatLf = stdMat;
stdMat = function (col, map, rough = 0.85) {
  if (map !== TX.speck) return _stdMatLf(col, map, rough);
  return new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(col)), map, roughness: Math.min(rough, 0.72), sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffd79a), clearcoat: rough < 0.5 ? 0.55 : 0.08, clearcoatRoughness: 0.35 });
};

/* ---------- crumb texture for cut faces ---------- */
const CRUMB_TEX = canvTex(256, 256, (g, w, h) => {
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = Math.random() * w, y = Math.random() * h, rx = 1 + Math.random() * 3.5, ry = rx * (1.1 + Math.random() * 0.9); g.fillStyle = `rgba(175,130,78,${0.18 + Math.random() * 0.25})`; g.beginPath(); g.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.6, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.4, rx * 0.5, ry * 0.4, 0, 0, TAU); g.fill(); }
}, [14, 14]);
CRUMB_TEX.wrapS = CRUMB_TEX.wrapT = THREE.RepeatWrapping;

/* ---------- the sandwich-loaf cross-section ---------- */
function loafShape(W2, h) {
  const s = new THREE.Shape(), r = 0.008, sh = h * 0.58, ov = 0.005;
  s.moveTo(-W2 + r, 0); s.lineTo(W2 - r, 0); s.quadraticCurveTo(W2, 0, W2, r);
  s.lineTo(W2, sh);
  s.quadraticCurveTo(W2 + ov, sh + 0.002, W2 + ov * 0.8, sh + 0.012);
  s.bezierCurveTo(W2 + ov * 0.6, h * 0.97, W2 * 0.5, h, 0, h);
  s.bezierCurveTo(-W2 * 0.5, h, -W2 - ov * 0.6, h * 0.97, -W2 - ov * 0.8, sh + 0.012);
  s.quadraticCurveTo(-W2 - ov, sh + 0.002, -W2, sh);
  s.lineTo(-W2, r); s.quadraticCurveTo(-W2, 0, -W2 + r, 0);
  return s;
}
// a block of loaf from x0 to x1 (extruded along x); caps = cut faces, sides = crust
function loafBlock(shape, x0, x1, capM, crustM) {
  const len = Math.max(0.002, x1 - x0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 14 });
  geo.rotateY(Math.PI / 2); geo.translate(x0, 0, 0);
  return mesh(geo, [capM, crustM]);
}
function crustCap(shape, x, crustM, face) { const m = mesh(new THREE.ShapeGeometry(shape, 14), crustM); m.rotation.y = face * Math.PI / 2; m.position.x = x; m.scale.set(1.01, 1.01, 1.01); return m; }

const _rebuildBakeLf = rebuildBake;
rebuildBake = function (b) {
  if (b.shape !== 'loaf') return _rebuildBakeLf(b);
  const g = b.model; for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i] !== b.decoG) g.remove(g.children[i]);
  const bk = b.bake, d = b.dims, crust = crustColor(bk.brown, b.m.color());
  const crustM = stdMat(crust, TX.speck, 0.75);
  const crustSide = crustM.clone(); crustSide.map = TX.speck; crustSide.side = THREE.DoubleSide;
  const crumbM = new THREE.MeshStandardMaterial({ color: new THREE.Color(rgb(mixc(crumbCol(b), [255, 246, 222], 0.35))), map: CRUMB_TEX, roughness: 0.95 });
  const tag = m => { m.traverse(o => { if (o.isMesh) o.userData.item = b; }); g.add(m); return m; };
  const shape = loafShape(d.rz, d.h), T = 0.022, n = b.sliced || 0;
  const off = (b.cutOff || 0) * T, bodyEnd = d.rx - off - n * T;
  // the uncut part of the loaf, crust on its outer end
  tag(loafBlock(shape, -d.rx, bodyEnd, n ? crumbM : crustM, crustM));
  tag(crustCap(shape, -d.rx - 0.0016, crustSide, -1));
  // each slice leans a little further away and shows its crumb
  for (let k = 1; k <= n; k++) {
    const x0 = d.rx - off - k * T, gap = (n - k + 1) * 0.008 + (k === 1 ? 0.012 : 0), lean = -(k === 1 ? 0.42 : 0.04 + 0.025 * k);
    const piv = new THREE.Group(); piv.position.x = x0 + T + gap; piv.rotation.z = lean;
    const s = loafBlock(shape, -T + 0.0015, -0.0015, crumbM, crustM); piv.add(s);
    if (k === 1) { const cap = crustCap(shape, 0.0005, crustSide, 1); piv.add(cap); }
    tag(piv);
  }
  b.topY = d.h;
  b.builtSig = rebuildSig(b);
};
// a little more height and a fuller dome for the loaf
const _bakeDimsLf = bakeDims;
bakeDims = function (b) {
  if (b.shape === 'loaf') { const d = _bakeDimsLf(b); return { rx: 0.105, rz: 0.05, h: clamp(d.h * 1.05, 0.06, 0.12) }; }
  return _bakeDimsLf(b);
};
