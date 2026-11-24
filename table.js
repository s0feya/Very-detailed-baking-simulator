'use strict';
/* =========================================================
   The tasting table: after the bell, carry what you baked to
   a dining table with a lace cloth, pick a knife, and cut it.
   - Cakes (and mille crêpe): the real model is cut with
     clipping planes, so frosting, piping and fruit stay exactly
     as decorated, and the cut faces show every layer.
   - Bread / loaf cakes: saw slices, lay one on a plate and
     spread butter, jam or honey on it.
   - Toppings on the table match what was baked.
   ========================================================= */
renderer.localClippingEnabled = true;

const TABLE = { on: false, b: null, P: V3(0, 0, 9), top: 0.76, built: false, knife: null, stroke: null, cuts: [], reg: null, pieces: [], plateN: 0, slice: null, load: null, tip: '', msg: '', msgT: 0, hover: null };
const tAng = a => V3(Math.cos(a), 0, -Math.sin(a));         // direction of increasing angle at angle a
const dAng = a => V3(Math.sin(a), 0, Math.cos(a));           // radial direction at angle a (three.js cylinder convention)
const mod2 = a => ((a % TAU) + TAU) % TAU;
function tSay(s, t = 3) { TABLE.msg = s; TABLE.msgT = t; }

function canCut(b) { return b && (b.shape === 'round' || b.shape === 'loaf' || (b.shape === 'crepes' && !b.fold && (b.crepes || []).length > 2)); }

/* ---------- the dining room ---------- */
function damaskTex() {
  return canvTex(512, 512, (g, w, h) => {
    g.fillStyle = '#eadfcb'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(190,172,140,.6)'; g.lineWidth = 2;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * 128 + (y % 2) * 64, cy = y * 128 + 64; g.save(); g.translate(cx, cy);
      for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(16, 18, 10, 40, 0, 46); g.bezierCurveTo(-10, 40, -16, 18, 0, 6); g.stroke(); }
      g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.stroke(); g.restore();
    }
  }, [3, 3]);
}
function laceTex() {
  return canvTex(512, 64, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.96)';
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.arc(x + 16, 18, 15, 0, Math.PI); g.lineTo(x + 32, 0); g.lineTo(x, 0); g.fill(); g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x + 16, 14, 5, 0, TAU); g.fill(); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + 4 + k * 6, 26, 1.8, 0, TAU); g.fill(); } g.restore(); }
  }, [14, 1]);
}
function buildTable() {
  if (TABLE.built) return; TABLE.built = true;
  const P = TABLE.P, G = new THREE.Group(); G.position.copy(P); scene.add(G); TABLE.g = G;
  // floor & wall
  const wood = canvTex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#8a5a36' : '#7d5031'; g.fillRect(0, i * 64, w, 64); for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(60,34,18,${0.1 + Math.random() * 0.15})`; g.beginPath(); const y = i * 64 + Math.random() * 64; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y + 2); g.stroke(); } g.fillStyle = 'rgba(30,16,8,.5)'; g.fillRect(0, i * 64, w, 2); } }, [3, 3]);
  const floor = mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6 }), 0, 0, 0, false); floor.rotation.x = -Math.PI / 2; G.add(floor);
  const paper = canvTex(256, 256, (g, w, h) => { g.fillStyle = '#c9d3c0'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x, 0, 12, h); g.fillStyle = 'rgba(120,140,110,.18)'; g.fillRect(x + 14, 0, 2, h); } }, [6, 2]);
  const wall = mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: paper, roughness: 0.9 }), 0, 1.5, -1.4, false); G.add(wall);
  const wains = mesh(new THREE.BoxGeometry(6, 0.9, 0.03), new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 0.6 }), 0, 0.45, -1.38, false); G.add(wains);
  // a painting and a window glow for atmosphere
  const art = canvTex(256, 192, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f3d9b0'); gr.addColorStop(1, '#a7b88f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#d9785a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(60 + i * 28, 120 - (i % 2) * 10, 16, 0, TAU); g.fill(); } g.fillStyle = '#6b8a55'; g.fillRect(0, 150, w, 42); });
  G.add(mesh(new THREE.BoxGeometry(0.62, 0.48, 0.03), new THREE.MeshStandardMaterial({ color: 0xb08d4a, metalness: 0.6, roughness: 0.35 }), 0.1, 1.55, -1.37, false));
  G.add(mesh(new THREE.PlaneGeometry(0.54, 0.4), new THREE.MeshStandardMaterial({ map: art, roughness: 0.8 }), 0.1, 1.55, -1.35, false));
  // the table and its cloth
  const T = TABLE.top;
  G.add(mesh(new THREE.CylinderGeometry(0.05, 0.08, T - 0.02, 20), new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.5 }), 0, (T - 0.02) / 2, 0));
  const cloth = new THREE.MeshPhysicalMaterial({ map: damaskTex(), roughness: 0.85, sheen: 0.6, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
  G.add(mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.01, 96), cloth, 0, T - 0.005, 0));
  const skirt = new THREE.CylinderGeometry(0.6, 0.7, 0.56, 160, 10, true); const pos = skirt.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(x, z), drop = (0.28 - y) / 0.56, r = Math.hypot(x, z) + Math.sin(a * 16) * 0.018 * drop * drop + Math.sin(a * 7 + 1) * 0.008 * drop; pos.setXYZ(i, Math.sin(a) * r, y, Math.cos(a) * r); }
  skirt.computeVertexNormals(); G.add(mesh(skirt, cloth, 0, T - 0.29, 0));
  const lace = mesh(new THREE.CylinderGeometry(0.7, 0.71, 0.05, 160, 1, true), new THREE.MeshStandardMaterial({ map: laceTex(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.9 }), 0, T - 0.595, 0, false); G.add(lace);
  // napkin for the knives, a vase of flowers
  G.add(mesh(new THREE.BoxGeometry(0.1, 0.004, 0.3), new THREE.MeshStandardMaterial({ color: 0xc9a7a0, roughness: 0.9 }), 0.36, T + 0.002, 0.03));
  const vase = mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.13, 20), new THREE.MeshPhysicalMaterial({ color: 0xbfd6e0, roughness: 0.1, transmission: 0.6, thickness: 0.02 }), -0.3, T + 0.065, -0.3); G.add(vase);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; G.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.1), new THREE.MeshStandardMaterial({ color: 0x4f7a3a }), -0.3 + Math.cos(a) * 0.012, T + 0.17, -0.3 + Math.sin(a) * 0.012)); G.add(mesh(new THREE.SphereGeometry(0.016, 12, 8), new THREE.MeshStandardMaterial({ color: [0xf2a7b5, 0xffffff, 0xf7d36b, 0xe7849a, 0xfff0f5][i], roughness: 0.7 }), -0.3 + Math.cos(a) * 0.028, T + 0.225, -0.3 + Math.sin(a) * 0.028)); }
  // lights just for the table
  const key = new THREE.SpotLight(0xfff0d8, 5, 5, 0.7, 0.6, 1.4); key.position.set(0.6, 2.2, 1.2); key.target.position.set(0, T, 0); G.add(key); G.add(key.target);
  const fill = new THREE.PointLight(0xffe2c0, 0.8, 4, 1.5); fill.position.set(-0.8, 1.6, 0.8); G.add(fill);
  // stand / board and serving plates
  TABLE.stand = new THREE.Group(); G.add(TABLE.stand);
  TABLE.plates = [V3(-0.17, T, 0.3), V3(0.15, T, 0.32)].map(p => { const pl = new THREE.Group(); pl.position.copy(p); pl.add(mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.012, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), 0, 0.006, 0)); const rim = mesh(new THREE.TorusGeometry(0.093, 0.002, 6, 64), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.9, roughness: 0.3 }), 0, 0.0125, 0); rim.rotation.x = Math.PI / 2; pl.add(rim); G.add(pl); return pl; });
  G.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.001), new THREE.MeshBasicMaterial({ color: 0 }), 0, -1, 0));
  G.visible = false;
}

/* ---------- knives & toppings ---------- */
function knifeModel(kind) {
  const g = new THREE.Group(), steelM = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 0.95, roughness: 0.22 });
  const handleM = new THREE.MeshStandardMaterial({ color: kind === 'bread' ? 0x3a2416 : kind === 'butter' ? 0xf1ece2 : 0x2c2c30, roughness: 0.4 });
  const L = kind === 'bread' ? 0.2 : kind === 'cake' ? 0.17 : 0.1, W = kind === 'butter' ? 0.016 : 0.026;
  const bs = new THREE.Shape(); bs.moveTo(0, 0); bs.lineTo(L, 0); if (kind === 'butter') bs.quadraticCurveTo(L + 0.012, W * 0.5, L, W); else bs.quadraticCurveTo(L + 0.004, W * 0.2, L - 0.02, W); bs.lineTo(0, W); bs.lineTo(0, 0);
  const blade = mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.0015, bevelEnabled: false }), steelM); blade.position.set(0, -W / 2, -0.00075); g.add(blade);
  if (kind === 'bread') for (let i = 0; i < 22; i++) g.add(mesh(new THREE.ConeGeometry(0.0018, 0.003, 4), steelM, 0.006 + i * 0.0085, -W / 2 - 0.001, 0));
  const h = mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.1, 14), handleM, -0.05, 0, 0); h.rotation.z = Math.PI / 2; g.add(h);
  g.userData.tipLen = L; g.userData.bladeW = W; return g;
}
const SUPS = {
  butter: { name: 'Butter', col: [248, 228, 160], spread: 1 },
  jam: { name: 'Strawberry jam', col: [178, 22, 44], spread: 1, gloss: 1 },
  honey: { name: 'Honey', col: [226, 150, 30], spread: 1, gloss: 1 },
  cream: { name: 'Whipped cream', col: [255, 251, 242] },
  berries: { name: 'Fresh berries', col: [190, 30, 60] },
  coulis: { name: 'Berry coulis', col: [160, 20, 50], gloss: 1 },
  choc: { name: 'Chocolate sauce', col: [70, 36, 20], gloss: 1 }
};
function supsFor(b) {
  if (b.shape === 'loaf') return b.bake.type === 'bread' ? ['butter', 'jam', 'honey'] : ['butter', 'jam', 'cream'];
  if (b.shape === 'crepes') return ['cream', 'berries', 'honey'];
  if (b.bake.type === 'chilled' || (b.m.g.creamcheese || 0) > 50) return ['coulis', 'berries', 'cream'];
  if ((b.m.g.cocoa || 0) > 5) return ['cream', 'berries', 'choc'];
  return ['cream', 'jam', 'berries'];
}
function supModel(k) {
  const S = SUPS[k], col = new THREE.Color(rgb(S.col)), g = new THREE.Group();
  if (k === 'butter') { g.add(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.01, 32), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), 0, 0.005, 0)); g.add(box(0.06, 0.022, 0.035, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }), 0, 0.021, 0)); }
  else if (k === 'berries') { g.add(mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.035, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide }), 0, 0.0175, 0)); for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.012 + (i % 3) * 0.008; g.add(mesh(new THREE.SphereGeometry(i % 2 ? 0.009 : 0.011, 12, 8), new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0x2b2a5e : 0xc0142f, roughness: 0.3, clearcoat: 0.6 }), Math.cos(a) * r, 0.032 + (i % 3) * 0.004, Math.sin(a) * r)); } }
  else if (k === 'cream') { g.add(mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.035, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xe9eef5, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide }), 0, 0.0175, 0)); const c = mesh(new THREE.SphereGeometry(0.042, 24, 12, 0, TAU, 0, Math.PI / 2), CREAMMAT, 0, 0.03, 0); c.scale.y = 0.5; g.add(c); }
  else if (k === 'coulis' || k === 'choc') { g.add(mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.07, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0.7, thickness: 0.01 }), 0, 0.035, 0)); g.add(mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.05, 24), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.1, clearcoat: 1 }), 0, 0.027, 0)); }
  else { // jars: jam, honey
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 24), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.15, clearcoat: 1, transmission: k === 'honey' ? 0.35 : 0.1, thickness: 0.03 }), 0, 0.035, 0));
    const lid = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 24), new THREE.MeshStandardMaterial({ map: canvTex(64, 64, (c2, w, h) => { c2.fillStyle = k === 'honey' ? '#d7b46a' : '#c9473f'; c2.fillRect(0, 0, w, h); c2.fillStyle = '#fff'; for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) c2.fillRect(x, y, 8, 8); }), roughness: 0.8 }), 0, 0.076, 0); g.add(lid);
    const lab = mesh(new THREE.CylinderGeometry(0.0305, 0.0305, 0.03, 24, 1, true), new THREE.MeshStandardMaterial({ map: canvTex(256, 64, (c2, w, h) => { c2.fillStyle = '#f8f1e2'; c2.fillRect(0, 0, w, h); c2.fillStyle = '#5a3a2a'; c2.font = 'italic 700 26px Georgia'; c2.textAlign = 'center'; c2.fillText(k === 'honey' ? 'Honey' : 'Fraise', w / 4, 40); c2.fillText(k === 'honey' ? 'Honey' : 'Fraise', w * 3 / 4, 40); }), roughness: 0.8 }), 0, 0.035, 0); g.add(lab);
  }
  g.traverse(o => { if (o.isMesh) o.userData.sup = k; }); return g;
}

/* ---------- cross-section texture for the cut faces ---------- */
function crossTex(b, R, H) {
  const W = 256, Hp = 256, frosted = b.shape === 'round' && (covAvg(b) > 0.25 || sideAvg(b) > 0.25), fr = frosted ? 0.004 : 0;
  return canvTex(W, Hp, (g) => {
    const Y = y => Hp - y / H * Hp, X = x => x / R * W;
    g.fillStyle = '#fffaf0'; g.fillRect(0, 0, W, Hp);
    const crumb = rgb(mixc(crumbCol(b), [236, 190, 105], 0.38)), crust = rgb(crustColor(b.bake.brown, b.m.color()));
    const holes = (y0, y1, x1) => { for (let i = 0; i < (y0 - y1) * x1 / 30; i++) { const x = Math.random() * x1, y = y1 + Math.random() * (y0 - y1); g.fillStyle = `rgba(160,120,70,${0.15 + Math.random() * 0.2})`; g.beginPath(); g.ellipse(x, y, 1 + Math.random() * 2.2, 1.2 + Math.random() * 2.6, 0, 0, TAU); g.fill(); } };
    if (b.shape === 'crepes') {
      let y = 0; const cs = b.crepes || [];
      cs.forEach(c => { const t = 0.0018; g.fillStyle = '#e6b469'; g.fillRect(0, Y(y + t), W, Y(y) - Y(y + t) + 0.5); g.fillStyle = 'rgba(150,90,30,.5)'; g.fillRect(0, Y(y + t) , W, 1); y += t; if (c.cream) { const ct = 0.0032; g.fillStyle = '#fffaf0'; g.fillRect(0, Y(y + ct), W, Y(y) - Y(y + ct) + 0.5); y += ct; } });
      return;
    }
    const n = b.layers || 1, fillT = k => (b.fills[k] != null ? 0.0035 + 0.003 * Math.min(1, b.fills[k] / 25) : 0.0012);
    const top = b.topY || H, lh = (top - 0.0012 * (n - 1) - (b.fills || []).reduce((s, f, k) => s + (k < n - 1 ? fillT(k) - 0.0012 : 0), 0)) / n;
    // biscuit base for cheesecakes
    let y = 0;
    for (let i = 0; i < n; i++) {
      g.fillStyle = crumb; g.fillRect(0, Y(y + lh), X(R - fr), Y(y) - Y(y + lh) + 1);
      if ((b.m.g.biscuits || 0) > 20 && i === 0) { g.fillStyle = '#b98a52'; g.fillRect(0, Y(y + Math.min(lh * 0.3, 0.012)), X(R - fr), Y(y) - Y(y + Math.min(lh * 0.3, 0.012))); }
      else holes(Y(y), Y(y + lh), X(R - fr));
      if (i === 0) { g.fillStyle = crust; g.fillRect(0, Y(0.0016), X(R - fr), Y(0) - Y(0.0016)); }
      y += lh;
      if (i < n - 1) {
        const t = fillT(i), types = (b.fillTypes && b.fillTypes[i]) || ['cream'], sauce = types.find(s => ING[s] && ING[s].type !== 'grain' && s !== 'cream' && s !== 'fruit');
        g.fillStyle = sauce ? rgb(ING[sauce].c) : '#fffaf0'; g.fillRect(0, Y(y + t), X(R - fr), Y(y) - Y(y + t) + 1);
        if (types.includes('fruit')) for (let k = 0; k < 9; k++) { g.fillStyle = '#d0213f'; const fx = (k + 0.5) / 9 * X(R - fr), fy = (Y(y) + Y(y + t)) / 2; g.beginPath(); g.ellipse(fx, fy, 6, (Y(y) - Y(y + t)) * 0.38, 0, 0, TAU); g.fill(); g.fillStyle = '#fbe3e7'; g.beginPath(); g.ellipse(fx, fy, 2.5, 1.5, 0, 0, TAU); g.fill(); }
        y += t;
      }
    }
    if (frosted) { g.fillStyle = '#fffaf0'; g.fillRect(0, 0, W, Y(top) + 2); g.fillRect(X(R - fr), 0, W - X(R - fr), Hp); }
    else { g.fillStyle = crust; g.fillRect(0, 0, W, Y(top) + 3); g.fillRect(X(R) - 3, 0, 3, Hp); }
  });
}
function cutFace(b, a, R, H, tex) {
  const m = mesh(new THREE.PlaneGeometry(R, H), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }), 0, 0, 0, false);
  const d = dAng(a); m.position.set(d.x * R / 2, H / 2, d.z * R / 2); m.rotation.y = a - Math.PI / 2; m.userData.noClip = true; return m;
}

/* ---------- clipping helpers ---------- */
function clipSetup(root, defs, intersect) {
  const planes = defs.map(() => new THREE.Plane());
  root.userData.clip = { defs, planes, intersect };
  root.traverse(o => {
    if (!o.isMesh || o.userData.noClip) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    const nm = ms.map(m => { const c = m.userData.tClip ? m : m.clone(); c.userData.tClip = true; c.clippingPlanes = planes; c.clipIntersection = intersect; c.clipShadows = true; return c; });
    o.material = Array.isArray(o.material) ? nm : nm[0];
  });
  clipUpdate(root);
}
function clipUpdate(root) {
  const c = root.userData.clip; if (!c) return;
  root.updateMatrixWorld(true); const q = root.getWorldQuaternion(new THREE.Quaternion()), p = root.getWorldPosition(new THREE.Vector3());
  c.defs.forEach((n, i) => { const nw = n.clone().applyQuaternion(q).normalize(); c.planes[i].set(nw, -nw.dot(p)); });
  // keep newly rebuilt meshes (e.g. drizzle) clipped too
  root.traverse(o => { if (o.isMesh && !o.userData.noClip) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.clippingPlanes !== c.planes) { const ms = Array.isArray(o.material) ? o.material : [o.material]; const nm = ms.map(x => { const y = x.userData.tClip ? x : x.clone(); y.userData.tClip = true; y.clippingPlanes = c.planes; y.clipIntersection = c.intersect; return y; }); o.material = Array.isArray(o.material) ? nm : nm[0]; } } });
}

/* ---------- start / end ---------- */
function startTable(b) {
  buildTable();
  const T = TABLE.top, G = TABLE.g; G.visible = true;
  if (TABLE.b && TABLE.b !== b && TABLE.b.root) TABLE.b.root.visible = false;
  TABLE.on = true; TABLE.b = b; TABLE.cuts = []; TABLE.reg = null; TABLE.knife = null; TABLE.stroke = null; TABLE.slice = null; TABLE.load = null; TABLE.plateN = 0;
  scorecard = null; held = null; drag = null;
  // stand or board
  const S = TABLE.stand; while (S.children.length) S.remove(S.children[0]);
  let standH;
  if (b.shape === 'loaf') { const board = mesh(new THREE.BoxGeometry(0.34, 0.02, 0.17), new THREE.MeshStandardMaterial({ color: 0xb98a56, roughness: 0.55, map: TX.speck }), 0, T + 0.01, -0.02); S.add(board); standH = 0.02; }
  else { const porc = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1 }); S.add(mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.06, 32), porc, 0, T + 0.03, -0.02)); S.add(mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.012, 64), porc, 0, T + 0.066, -0.02)); standH = 0.072; }
  // move the bake
  b.host = null; b.zone = 'table'; b.hostOff = V3(0, 0, 0); b.yaw = 0; b.tilt = 0;
  b.p.set(TABLE.P.x, T + standH, TABLE.P.z - 0.02); b.root.visible = true;
  if (b.shape === 'loaf') { b.yaw = 0; }
  // knives on the napkin, toppings to the left
  (TABLE.knives || []).forEach(k => G.remove(k.g)); (TABLE.sups || []).forEach(s => G.remove(s.g));
  TABLE.knives = ['cake', 'bread', 'butter'].map((kind, i) => { const g = knifeModel(kind); const home = V3(0.33, T + 0.006, -0.08 + i * 0.09); g.position.copy(home); g.rotation.set(-Math.PI / 2, 0, 0); g.traverse(o => { if (o.isMesh) o.userData.knife = kind; }); G.add(g); return { kind, g, home }; });
  TABLE.sups = supsFor(b).map((k, i) => { const g = supModel(k); g.position.set(-0.36 + (i % 2) * 0.03, T, -0.1 + i * 0.12); G.add(g); return { k, g }; });
  (TABLE.pieces || []).forEach(p => { scene.remove(p.root); p.dollops.forEach(d => scene.remove(d)); }); TABLE.pieces = [];
  if (TABLE.faceG) b.root.remove(TABLE.faceG); TABLE.faceG = new THREE.Group(); b.root.add(TABLE.faceG);
  if (TABLE.sliceG) { scene.remove(TABLE.sliceG); TABLE.sliceG = null; }
  TABLE.tex = canCut(b) && b.shape !== 'loaf' ? crossTex(b, cakeR(b), cakeH(b)) : null;
  tSay(b.shape === 'loaf' ? 'Pick up the bread knife and saw across the loaf.' : 'Pick up the cake knife, then drag from the middle of the cake out to the edge.', 5);
  SFX.ding && SFX.click();
}
function cakeR(b) { const frosted = b.shape === 'round' && (covAvg(b) > 0.25 || sideAvg(b) > 0.25); return b.shape === 'crepes' ? b.dims.rx * 0.95 : b.dims.rx + (frosted ? 0.004 : 0); }
function cakeH(b) { return (b.topY || b.h) + (b.shape === 'round' && covAvg(b) > 0.25 ? 0.003 : 0); }
function endTable() {
  TABLE.on = false; if (TABLE.g) TABLE.g.visible = false;
  (TABLE.pieces || []).forEach(p => { scene.remove(p.root); p.dollops.forEach(d => scene.remove(d)); }); TABLE.pieces = [];
  if (TABLE.sliceG) { scene.remove(TABLE.sliceG); TABLE.sliceG = null; }
}
const _build3Tb = build3;
build3 = function () { endTable(); _build3Tb(); };

/* ---------- cutting a round cake ---------- */
function rebuildFaces() {
  const b = TABLE.b, F = TABLE.faceG; while (F.children.length) F.remove(F.children[0]);
  const R = cakeR(b), H = cakeH(b);
  if (!TABLE.reg) { TABLE.cuts.forEach(a => { const d = dAng(a), s = box(0.0014, 0.003, R, new THREE.MeshBasicMaterial({ color: 0x3b2a1e }), d.x * R / 2, H + 0.0005, d.z * R / 2); s.rotation.y = a; s.userData.noClip = true; F.add(s); }); return; }
  const [R0, R1] = TABLE.reg, removed = R1 - R0, remain = TAU - removed;
  if (remain < 0.12) { b.root.visible = false; return; }
  F.add(cutFace(b, R0, R, H, TABLE.tex)); F.add(cutFace(b, R1, R, H, TABLE.tex));
  if (remain <= Math.PI) clipSetup(b.root, [tAng(R1), tAng(R0).negate()], false);
  else clipSetup(b.root, [tAng(R0).negate(), tAng(R1)], true);
}
function addCut(a) {
  const b = TABLE.b;
  if (!TABLE.reg) {
    if (!TABLE.cuts.length) { TABLE.cuts.push(a); rebuildFaces(); tSay('One cut. Make a second cut a little way round to free a slice.', 4); return; }
    const c0 = TABLE.cuts[0]; let d = mod2(a - c0), w0 = c0, w1 = c0 + d;
    if (d > Math.PI) { d = TAU - d; w0 = a; w1 = a + d; }
    if (d < 0.18) { tSay('Too thin. Cut a bit further round.', 2.5); return; }
    if (d > 1.6) { w1 = w0 + 1.6; d = 1.6; }
    TABLE.reg = [w0, w1]; TABLE.cuts = []; rebuildFaces(); liftPiece(w0, w1); return;
  }
  const [R0, R1] = TABLE.reg, e1 = mod2(a - R1), e0 = mod2(R0 - a);
  let w0, w1; if (e1 <= e0) { w0 = R1; w1 = R1 + Math.min(1.6, e1); } else { w1 = R0; w0 = R0 - Math.min(1.6, e0); }
  if (w1 - w0 < 0.18) { tSay('Too thin. Cut a bit further round from the gap.', 2.5); return; }
  const remain = TAU - (R1 - R0) - (w1 - w0);
  if (remain < 0.18) { w0 = R1; w1 = R0 + TAU; }
  TABLE.reg = [Math.min(R0, w0), Math.max(R1, w1)]; rebuildFaces(); liftPiece(w0, w1);
}
function liftPiece(w0, w1) {
  const b = TABLE.b, F = TABLE.faceG; b.root.remove(F);
  const saved = []; b.root.traverse(o => { saved.push([o, o.userData]); o.userData = {}; });
  const root = b.root.clone(true); saved.forEach(([o, u]) => o.userData = u); b.root.add(F);
  root.traverse(o => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); });
  scene.add(root);
  const R = cakeR(b), H = cakeH(b);
  root.add(cutFace(b, w0, R, H, TABLE.tex)); root.add(cutFace(b, w1, R, H, TABLE.tex));
  clipSetup(root, [tAng(w0), tAng(w1).negate()], false);
  // slide it onto a serving plate, one cut face turned to you
  const pl = TABLE.plates[TABLE.plateN++ % TABLE.plates.length];
  TABLE.pieces.filter(p => p.plate === pl).forEach(p => { scene.remove(p.root); p.dollops.forEach(d => scene.remove(d)); }); TABLE.pieces = TABLE.pieces.filter(p => p.plate !== pl);
  const yaw = Math.PI / 2 - w0 - 0.35, mid = (w0 + w1) / 2 + yaw, cen = dAng(mid).multiplyScalar(R * 0.6);
  const to = TABLE.P.clone().add(pl.position).add(V3(-cen.x, 0.013, -cen.z));
  TABLE.pieces.push({ root, from: root.position.clone(), fromYaw: root.rotation.y, to, yaw, t: 0, plate: pl, dollops: [] });
  SFX.thunk && SFX.thunk(0.4); tSay('A slice! Click a topping to add it to the plate, or keep cutting.', 4);
}

/* ---------- bread: slices onto a plate, then spreads ---------- */
function takeSlice() {
  const b = TABLE.b; if (!b.sliced) return false;
  b.sliced--; b.cutOff = (b.cutOff || 0) + 1; rebuildBake(b);
  if (TABLE.sliceG) scene.remove(TABLE.sliceG);
  const d = b.dims, shape = loafShape(d.rz, d.h), T = 0.02;
  const crust = crustColor(b.bake.brown, b.m.color()), crustM = stdMat(crust, TX.speck, 0.75);
  const crumbM = new THREE.MeshStandardMaterial({ color: new THREE.Color(rgb(mixc(crumbCol(b), [255, 246, 222], 0.35))), map: CRUMB_TEX, roughness: 0.95 });
  const G = new THREE.Group(), inner = new THREE.Group(); inner.rotation.z = Math.PI / 2; G.add(inner);
  const blk = loafBlock(shape, -T / 2, T / 2, crumbM, crustM); inner.add(blk);
  inner.position.set(d.h / 2, 0, 0);
  // the spread layer: a canvas painted where the knife goes
  const bb = new THREE.Box2(); shape.getPoints(24).forEach(p => bb.expandByPoint(p));
  const cw = 256, cv = document.createElement('canvas'); cv.width = cv.height = cw; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y; tex.repeat.set(1 / w, 1 / h); tex.offset.set(-bb.min.x / w, -bb.min.y / h);
  const geo = new THREE.ShapeGeometry(shape, 24); geo.rotateY(Math.PI / 2); geo.translate(T / 2 + 0.0026, 0, 0);
  const spreadM = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.35, clearcoat: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const sp = mesh(geo, spreadM, 0, 0, 0, false); inner.add(sp);
  const pl = TABLE.plates[0]; G.position.copy(TABLE.P).add(pl.position).add(V3(0, 0.013, 0)); G.rotation.y = -0.4;
  scene.add(G); TABLE.sliceG = G; TABLE.slice = { G, sp, cv, ctx: cv.getContext('2d'), bb, w, h, cw, tex, top: 0.013 + T, painted: 0 };
  SFX.click(); tSay('A slice on the plate. Take the butter knife, dip it in a spread, then drag it over the slice.', 5);
  return true;
}
function paintSlice(pt) {
  const S = TABLE.slice, L = TABLE.load; if (!S || !L) return;
  const lp = S.sp.worldToLocal(pt.clone()), sx = -lp.z, sy = lp.y;
  const u = (sx - S.bb.min.x) / S.w, v = (sy - S.bb.min.y) / S.h; if (u < -0.05 || u > 1.05 || v < -0.05 || v > 1.05) return;
  const c = S.ctx, x = u * S.cw, y = (1 - v) * S.cw, col = SUPS[L.k].col;
  const gr = c.createRadialGradient(x, y, 0, x, y, 26); gr.addColorStop(0, `rgba(${col},${L.k === 'butter' ? 0.75 : 0.9})`); gr.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = gr; c.beginPath(); c.arc(x, y, 26, 0, TAU); c.fill();
  if (L.k === 'jam') { c.fillStyle = 'rgba(120,8,24,.55)'; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 2 + Math.random() * 3, 0, TAU); c.fill(); } }
  S.tex.needsUpdate = true; L.left -= 1; S.painted++;
  if (L.left <= 0) { TABLE.load = null; setKnifeLoad(null); tSay('The knife is clean. Dip it again for more.', 2); }
}
function setKnifeLoad(k) {
  const kn = TABLE.knives.find(x => x.kind === 'butter'); if (!kn) return;
  if (kn.blob) { kn.g.remove(kn.blob); kn.blob = null; }
  if (k) { const m = mesh(new THREE.SphereGeometry(0.008, 12, 8), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(rgb(SUPS[k].col)), roughness: 0.3, clearcoat: 0.7 }), kn.g.userData.tipLen - 0.012, 0, 0.002); m.scale.set(1.4, 0.8, 0.5); kn.g.add(m); kn.blob = m; }
}
function addDollop(k) {
  const p = TABLE.pieces[TABLE.pieces.length - 1]; if (!p) { tSay('Cut a slice first, then add toppings to its plate.', 2.5); return; }
  const base = TABLE.P.clone().add(p.plate.position).add(V3(0, 0.013, 0)), n = p.dollops.length, a = 2.2 + n * 0.8, at = base.clone().add(V3(Math.cos(a) * 0.065, 0, Math.sin(a) * 0.05));
  const g = new THREE.Group(); g.position.copy(at); const S = SUPS[k], col = new THREE.Color(rgb(S.col));
  if (k === 'cream') { const q = mesh(new THREE.SphereGeometry(0.018, 20, 12), CREAMMAT, 0, 0.008, 0); q.scale.set(1.3, 0.6, 0.8); q.rotation.y = a; g.add(q); }
  else if (k === 'berries') { for (let i = 0; i < 3; i++) g.add(mesh(new THREE.SphereGeometry(i ? 0.008 : 0.01, 12, 8), new THREE.MeshPhysicalMaterial({ color: i % 2 ? 0x2b2a5e : 0xc0142f, roughness: 0.3, clearcoat: 0.6 }), (i - 1) * 0.013, 0.008, (i % 2) * 0.008)); }
  else { const pool = mesh(new THREE.SphereGeometry(0.03, 24, 8, 0, TAU, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.05, clearcoat: 1 }), 0, 0, 0); pool.scale.set(1, 0.06, 0.7); g.add(pool); }
  scene.add(g); p.dollops.push(g);
  SFX.plop(); tSay(`${S.name} on the plate.`, 1.6);
}

/* ---------- input ---------- */
function tableRayHit(objs) { setRay(PT.x, PT.y); const h = ray.intersectObjects(objs, true); return h.length ? h[0] : null; }
function overBake() { const b = TABLE.b; if (!b.root.visible) return null; return tableRayHit([b.root]); }
function planeAt(y) { setRay(PT.x, PT.y); return planeHit(V3(0, 1, 0), V3(0, y, 0)); }
const BACKBTN = { x: 0, y: 0, w: 0, h: 0 };
function inBack() { return PT.x > BACKBTN.x && PT.x < BACKBTN.x + BACKBTN.w && PT.y > BACKBTN.y && PT.y < BACKBTN.y + BACKBTN.h; }
function putKnifeDown() { const k = TABLE.knife; if (!k) return; k.g.position.copy(k.home); k.g.rotation.set(-Math.PI / 2, 0, 0); TABLE.knife = null; SFX.clink && SFX.clink(); }

function tableDown() {
  if (inBack()) { build3(); SFX.click(); return; }
  const b = TABLE.b, k = TABLE.knife;
  if (k) {
    const kh = tableRayHit(TABLE.knives.map(x => x.g).filter(g => g !== k.g)), sh = tableRayHit(TABLE.sups.map(s => s.g));
    if (sh && sh.object.userData.sup) {
      const s = sh.object.userData.sup;
      if (k.kind === 'butter' && SUPS[s].spread) { TABLE.load = { k: s, left: 70 }; setKnifeLoad(s); SFX.scrape && SFX.scrape(); tSay(`${SUPS[s].name} on the knife. Drag it over the slice.`, 2.5); return; }
      addDollop(s); return;
    }
    if (kh) { putKnifeDown(); return; }
    if (k.kind === 'butter' && TABLE.slice) { TABLE.stroke = { spread: true, pts: [] }; return; }
    const hb = overBake();
    if (hb) {
      if (k.kind === 'butter') { tSay('The butter knife is for spreading. Pick the cake or bread knife to cut.', 3); return; }
      TABLE.stroke = { pts: [], y: hb.point.y }; return;
    }
    putKnifeDown(); return;
  }
  const kh = tableRayHit(TABLE.knives.map(x => x.g));
  if (kh) { TABLE.knife = TABLE.knives.find(x => x.kind === kh.object.userData.knife); SFX.clink && SFX.clink(); const n = { cake: 'Cake knife', bread: 'Bread knife', butter: 'Butter knife' }[TABLE.knife.kind]; tSay(`${n} in hand.` + (TABLE.knife.kind === 'butter' ? ' Dip it in a spread.' : b.shape === 'loaf' ? ' Press and saw across the loaf.' : ' Press and drag from the middle out to the edge.'), 3); return; }
  const sh = tableRayHit(TABLE.sups.map(s => s.g));
  if (sh && sh.object.userData.sup) { const s = sh.object.userData.sup; if (SUPS[s].spread && b.shape === 'loaf') { tSay('Pick up the butter knife to spread it.', 2.5); return; } addDollop(s); return; }
  if (b.shape === 'loaf' && overBake()) { if (!takeSlice()) tSay('Slice it first with the bread knife.', 2.5); return; }
  if (overBake()) tSay('Pick up a knife from the napkin first.', 2.5);
}
function tableMove() {
  const k = TABLE.knife; if (!k) return;
  const b = TABLE.b, st = TABLE.stroke;
  if (st && st.spread) { const p = planeAt(TABLE.P.y + TABLE.slice.top); if (p) { k.g.position.copy(p).sub(TABLE.P).add(V3(-0.07, 0.004, 0)); k.g.rotation.set(-Math.PI / 2 + 0.25, 0, 0.3); paintSlice(p); } return; }
  if (st) {
    const p = planeAt(st.y); if (!p) return; st.pts.push(p.clone());
    // the blade sinks into the cake along the stroke
    k.g.position.copy(p).sub(TABLE.P).add(V3(0, -0.01, 0)); const pr = st.pts[st.pts.length - 2];
    const yaw = b.shape === 'loaf' ? Math.PI / 2 : (pr ? Math.atan2(-(p.z - b.p.z), p.x - b.p.x) : 0);
    k.g.rotation.set(0, yaw, 0); if (Math.random() < 0.3) sNoise(0.04, b.shape === 'loaf' ? 1600 : 900, 3, 0.12);
    return;
  }
  const p = planeAt(TABLE.top + 0.13); if (p) { k.g.position.lerp(p.clone().sub(TABLE.P), 0.5); k.g.rotation.set(-0.5, 0.6, 0); }
}
function tableUp() {
  const st = TABLE.stroke; TABLE.stroke = null; if (!st || st.spread) return;
  const b = TABLE.b, k = TABLE.knife; if (!st.pts.length) return;
  b.root.updateMatrixWorld(true);
  const loc = st.pts.map(p => b.root.worldToLocal(p.clone()));
  if (b.shape === 'loaf') {
    let travel = 0; for (let i = 1; i < loc.length; i++) travel += Math.abs(loc[i].z - loc[i - 1].z);
    if (travel < 0.07) { tSay('Saw right across the loaf to cut a slice.', 2.5); return; }
    if ((b.sliced || 0) + (b.cutOff || 0) >= 9) { tSay('That’s the whole loaf sliced.', 2); return; }
    b.sliced = (b.sliced || 0) + 1; rebuildBake(b); SFX.scrape && SFX.scrape();
    tSay(k.kind === 'bread' ? 'A neat slice. Click the loaf to lay a slice on the plate.' : 'The soft bread squashed a little. The serrated bread knife cuts cleaner. Click the loaf to take a slice.', 3.5);
    return;
  }
  const R = cakeR(b), rs = loc.map(p => Math.hypot(p.x, p.z)), far = rs.indexOf(Math.max(...rs));
  if (Math.max(...rs) < R * 0.7 || Math.min(...rs) > R * 0.4) { tSay('Cut from the middle right out to the edge.', 2.5); return; }
  const a = Math.atan2(loc[far].x, loc[far].z);
  if (k.kind === 'bread' && b.shape !== 'crepes') tSay('The serrated knife tears the crumb a little. The cake knife is smoother.', 2.5);
  SFX.scrape && SFX.scrape(); addCut(a);
}

/* ---------- hooks into the game loop ---------- */
const _onDownTb = onDown3;
onDown3 = function () {
  if (TABLE.on) { tableDown(); return; }
  if (scorecard && CUTBTN.on && PT.x > CUTBTN.x && PT.x < CUTBTN.x + CUTBTN.w && PT.y > CUTBTN.y && PT.y < CUTBTN.y + CUTBTN.h) { startTable(scorecard.it); return; }
  _onDownTb();
};
const _onMoveTb = onMove3;
onMove3 = function () { if (TABLE.on) { tableMove(); return; } _onMoveTb(); };
const _onUpTb = onUp3;
onUp3 = function () { if (TABLE.on) { tableUp(); return; } _onUpTb(); };
const _updateCameraTb = updateCamera;
updateCamera = function (dt) {
  if (!TABLE.on) return _updateCameraTb(dt);
  const aspect = uiW / Math.max(1, uiH), widen = aspect < 1.4 ? 1.4 / aspect : 1, P = TABLE.P;
  const tp = V3(P.x, 1.36 + 0.1 * (widen - 1), P.z + 0.74 * widen), tl = V3(P.x - 0.01, TABLE.top + 0.05, P.z + 0.02), k = 1 - Math.exp(-dt * 3.5);
  if (!camCur.pos || camCur.pos.distanceTo(tp) > 3) { camCur.pos = tp.clone(); camCur.look = tl.clone(); }
  camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, 46, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
};
const _tickTb = tick3;
tick3 = function (dt) {
  _tickTb(dt);
  if (!TABLE.on) return;
  const b = TABLE.b; b.p.x = TABLE.P.x; b.p.z = TABLE.P.z - 0.02; b.zone = 'table'; b.host = null;
  if (b.root.userData.clip) clipUpdate(b.root);
  for (const p of TABLE.pieces) {
    if (p.t < 1) { p.t = Math.min(1, p.t + dt * 1.4); const e = sstep(0, 1, p.t); p.root.position.lerpVectors(p.from, p.to, e); p.root.position.y += Math.sin(e * Math.PI) * 0.08; p.root.rotation.y = lerp(p.fromYaw, p.yaw, e); }
    clipUpdate(p.root);
  }
  if (TABLE.msgT > 0) TABLE.msgT -= dt;
  // hover label
  TABLE.hover = null;
  if (!TABLE.knife) { const kh = tableRayHit(TABLE.knives.map(x => x.g)); if (kh) TABLE.hover = { cake: 'Cake knife', bread: 'Bread knife (serrated)', butter: 'Butter knife' }[kh.object.userData.knife]; }
  if (!TABLE.hover) { const sh = tableRayHit(TABLE.sups.map(s => s.g)); if (sh && sh.object.userData.sup) TABLE.hover = SUPS[sh.object.userData.sup].name; }
};
// keep the bake where it is on the table (no physics, no host)
const _syncItemTb = syncItem;
syncItem = function (it) { _syncItemTb(it); };

/* ---------- 2D overlay ---------- */
const CUTBTN = { on: false, x: 0, y: 0, w: 0, h: 0 };
const _drawScoreTb = drawScore3;
drawScore3 = function () {
  _drawScoreTb();
  const s = scorecard; CUTBTN.on = false; if (!s || s.t < 0.6 || !canCut(s.it) || !items.includes(s.it)) return;
  const w = 580, h = 580, k = Math.min(1, (uiH - 30) / h, (uiW - 30) / w), bw = 250 * k, bh = 42 * k;
  const x = uiW / 2 - bw / 2, y = lerp(-400, uiH / 2, sstep(0, 0.6, s.t)) + (h / 2 + 14) * k;
  Object.assign(CUTBTN, { on: true, x, y, w: bw, h: bh });
  const over = PT.x > x && PT.x < x + bw && PT.y > y && PT.y < y + bh;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 10; ctx.fillStyle = over ? '#7a2f3f' : '#93394b';
  ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bh / 2); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(17 * k)}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.it.shape === 'loaf' ? 'Slice it at the table  →' : 'Cut it at the table  →', uiW / 2, y + bh / 2 + 1); ctx.restore();
};
const _drawUITb = drawUI3;
drawUI3 = function () {
  _drawUITb();
  if (!TABLE.on) return;
  const c = UI.getContext('2d'); c.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); c.clearRect(0, 0, uiW, uiH);
  // back button
  c.font = '600 14px Inter, system-ui, sans-serif'; const label = 'Tidy up & bake again', bw = c.measureText(label).width + 32;
  Object.assign(BACKBTN, { x: uiW - bw - 18, y: 18, w: bw, h: 36 });
  c.fillStyle = inBack() ? '#fff' : 'rgba(255,255,255,.88)'; c.beginPath(); c.roundRect(BACKBTN.x, BACKBTN.y, bw, 36, 18); c.fill();
  c.fillStyle = '#3a332c'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, BACKBTN.x + bw / 2, BACKBTN.y + 18);
  // title
  c.font = '700 34px Caveat, cursive'; c.fillStyle = 'rgba(255,255,255,.95)'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 8; c.textAlign = 'left'; c.fillText(TABLE.b && recipe ? recipe.name : 'Tea time', 22, 40); c.shadowBlur = 0;
  // message / hint
  const msg = TABLE.msgT > 0 ? TABLE.msg : TABLE.knife ? (TABLE.knife.kind === 'butter' ? (TABLE.load ? 'Drag over the slice to spread · click the napkin to put it down' : 'Click a spread to dip the knife') : 'Press and drag through it to cut · click the napkin to put the knife down') : 'Pick a knife from the napkin';
  c.font = '500 15px Inter, system-ui, sans-serif'; const mw = c.measureText(msg).width + 30; c.fillStyle = 'rgba(40,34,28,.72)'; c.beginPath(); c.roundRect(uiW / 2 - mw / 2, uiH - 58, mw, 34, 17); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(msg, uiW / 2, uiH - 40);
  if (TABLE.hover) { c.font = '600 13px Inter, system-ui, sans-serif'; const w = c.measureText(TABLE.hover).width + 16; c.fillStyle = 'rgba(40,34,28,.85)'; c.beginPath(); c.roundRect(PT.x + 14, PT.y - 30, w, 24, 12); c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(TABLE.hover, PT.x + 22, PT.y - 17); }
  UI.style.cursor = TABLE.knife ? 'none' : (TABLE.hover ? 'pointer' : 'default');
};
