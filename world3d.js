'use strict';
/* =========================================================
   3D kitchen: renderer, lighting, materials, room, item models
   Units are metres. x right, y up, z toward the viewer.
   ========================================================= */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const glc = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xe9e5df);
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.02, 30);

/* ---------- layout ---------- */
const CT = 0.9, WALLZ = -0.3;
const CTR = { x0: -1.2, x1: 1.2, z0: -0.27, z1: 0.27 };
const SHELVES = [1.36, 1.66], SHX = [-1.15, -0.2], SHZ = -0.19;
const RAIL = { y: 1.36, z: -0.265, slots: [0.08, 0.18, 0.28, 0.38, 0.5] };
const FRG = { x0: -1.95, x1: -1.22, h: 1.95, front: 0.32, ix0: -1.9, ix1: -1.27, shelves: [0.62, 1.0, 1.38], open: 0, tgt: 0 };
const OVN = { x0: 1.3, x1: 1.87, y0: 0.93, y1: 1.43, front: 0.31, rackY: 1.0, open: 0, tgt: 0 };
const SCL = { x: -0.3, z: 0.02, top: CT + 0.032 };
const RCK = { x: 0.4, z: 0.02, top: CT + 0.028 };
const MXR = { x: 0.95, z: 0.0, seat: V3(0.89, CT + 0.05, 0.0) };
const CLK = { p: V3(0.86, 1.92, WALLZ + 0.03), r: 0.13 };
const LEDGE = { y: 1.44, x: [0.68, 0.84, 1.0], z: -0.27 };
const MITT3 = { p: V3(1.14, 1.6, WALLZ + 0.03) };

/* ---------- texture helpers ---------- */
function canvTex(w, h, fn, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const saved = ctx; ctx = c.getContext('2d'); fn(ctx, w, h); ctx = saved;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.userData = { canvas: c }; return t;
}
function repaint(t, fn) { const c = t.userData.canvas; const saved = ctx; ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); fn(ctx, c.width, c.height); ctx = saved; t.needsUpdate = true; }
function noiseFill(g, w, h, n, col, a, s = 1.5) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${col},${Math.random() * a})`; const z = 0.5 + Math.random() * s; g.fillRect(Math.random() * w, Math.random() * h, z, z); } }
const TX = {};
function makeTex() {
  TX.quartz = canvTex(1024, 512, (g, w, h) => { g.fillStyle = '#f3f1ec'; g.fillRect(0, 0, w, h); noiseFill(g, w, h, 9000, '150,140,128', 0.12); g.globalAlpha = 0.16; for (let i = 0; i < 30; i++) { g.strokeStyle = i % 3 ? '#c9c2b7' : '#b3aa9d'; g.lineWidth = 0.6 + Math.random() * 1.6; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 10; k++) { x += 30 + Math.random() * 60; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); } }, [2, 1]);
  TX.tiles = canvTex(512, 256, (g, w, h) => { g.fillStyle = '#dcd6cd'; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const x = c * 128 + (r % 2) * 64, y = r * 32; const gr = g.createLinearGradient(0, y, 0, y + 32); gr.addColorStop(0, '#fbfaf7'); gr.addColorStop(1, '#ebe7e1'); g.fillStyle = gr; g.fillRect(x + 2, y + 2, 124, 28); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x + 3, y + 3, 122, 2); } }, [5, 1.6]);
  TX.wood = canvTex(512, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c9a273'); gr.addColorStop(1, '#a8804f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalAlpha = 0.25; for (let i = 0; i < 22; i++) { g.strokeStyle = i % 2 ? '#7a5632' : '#e2c49b'; g.lineWidth = 0.8 + Math.random(); g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 2.5); g.stroke(); } });
  TX.brushed = canvTex(256, 256, (g, w, h) => { g.fillStyle = '#e6e9ec'; g.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '90,90,90'},${Math.random() * 0.05})`; g.fillRect(0, Math.random() * h, w, 0.7); } }, [1, 1]);
  TX.speck = canvTex(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); noiseFill(g, w, h, 1400, '120,90,55', 0.45, 2); }, [2, 2]);
  TX.pulp = canvTex(256, 128, (g, w, h) => { g.fillStyle = '#c8c1b5'; g.fillRect(0, 0, w, h); noiseFill(g, w, h, 4000, '90,80,70', 0.25, 2); });
  TX.fabric = canvTex(128, 128, (g, w, h) => { g.fillStyle = '#b8533d'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let i = -128; i < 256; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); } noiseFill(g, w, h, 1500, '60,20,10', 0.2); }, [3, 3]);
  TX.eggshell = canvTex(128, 128, (g, w, h) => { g.fillStyle = '#d6a77b'; g.fillRect(0, 0, w, h); noiseFill(g, w, h, 300, '120,70,40', 0.35, 2.5); noiseFill(g, w, h, 1500, '255,240,220', 0.15); });
  TX.flourTop = canvTex(128, 128, (g, w, h) => { g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, w, h); noiseFill(g, w, h, 1500, '170,160,145', 0.25); });
}
function labelTex(w, h, draw) { return canvTex(w, h, draw); }

/* ---------- materials ---------- */
const MAT = {};
function makeMats() {
  const S = (o) => new THREE.MeshStandardMaterial(o), Ph = (o) => new THREE.MeshPhysicalMaterial(o);
  MAT.wall = S({ color: 0xf1eee9, roughness: 0.95 });
  MAT.floor = S({ color: 0xb59a7a, roughness: 0.7 });
  MAT.tiles = S({ map: TX.tiles, roughness: 0.35 });
  MAT.counter = Ph({ map: TX.quartz, roughness: 0.22, clearcoat: 0.4, clearcoatRoughness: 0.25 });
  MAT.cabinet = S({ color: 0xd9d5ce, roughness: 0.55 });
  MAT.cabinetDark = S({ color: 0x4a4642, roughness: 0.8 });
  MAT.steel = S({ color: 0xdfe3e6, metalness: 1, roughness: 0.22 });
  MAT.brushed = S({ color: 0xffffff, map: TX.brushed, metalness: 1, roughness: 0.38 });
  MAT.chrome = S({ color: 0xffffff, metalness: 1, roughness: 0.08 });
  MAT.darkMetal = S({ color: 0x3c3d40, metalness: 0.7, roughness: 0.42, side: THREE.DoubleSide });
  MAT.glass = Ph({ color: 0xffffff, roughness: 0.04, transmission: 1, thickness: 0.003, ior: 1.5, transparent: true, side: THREE.DoubleSide, envMapIntensity: 1.2 });
  MAT.blackGlass = Ph({ color: 0x3a3532, roughness: 0.05, metalness: 0, clearcoat: 1, transmission: 0.85, thickness: 0.01, transparent: true });
  MAT.panelGlass = Ph({ color: 0x111112, roughness: 0.12, clearcoat: 1 });
  MAT.wood = S({ map: TX.wood, roughness: 0.65 });
  MAT.ceramic = Ph({ color: 0xfbfaf6, roughness: 0.18, clearcoat: 0.6 });
  MAT.enamel = Ph({ color: 0xa9bba9, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 });
  MAT.plastic = S({ color: 0x2b2b2b, roughness: 0.45 });
  MAT.silicone = S({ color: 0xd9715a, roughness: 0.55 });
  MAT.paper = S({ color: 0xf2eee6, roughness: 0.9 });
  MAT.pulp = S({ map: TX.pulp, roughness: 1 });
  MAT.egg = S({ map: TX.eggshell, roughness: 0.6 });
  MAT.eggInside = S({ color: 0xf8f3ea, roughness: 0.7, side: THREE.DoubleSide });
  MAT.butter = Ph({ color: 0xf6e2a0, roughness: 0.42, sheen: 0.4 });
  MAT.dough = Ph({ color: 0xecdcbd, map: TX.speck, roughness: 0.82, sheen: 0.7, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.6 });
  MAT.water = Ph({ color: 0xdaf0f8, roughness: 0.02, transmission: 0.95, thickness: 0.02, ior: 1.33, transparent: true });
  MAT.milk = Ph({ color: 0xfbfbf7, roughness: 0.25 });
  MAT.white = S({ color: 0xf6f7f7, roughness: 0.4 });
  MAT.liner = S({ color: 0xf2f5f6, roughness: 0.5 });
  MAT.ovenIn = S({ color: 0x2a2928, roughness: 0.55, side: THREE.BackSide });
  MAT.fabric = S({ map: TX.fabric, roughness: 0.95 });
  MAT.rackWire = S({ color: 0x55595d, metalness: 0.8, roughness: 0.35 });
  MAT.yolk = Ph({ color: 0xf7a613, roughness: 0.15, clearcoat: 1 });
  MAT.white_egg = Ph({ color: 0xfffbf0, roughness: 0.05, transmission: 0.7, thickness: 0.01, transparent: true, opacity: 0.85 });
}

/* ---------- geometry helpers ---------- */
function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }
function rot(m, ax, a) { m.rotation[ax] = a; return m; }
function box(w, h, d, mat, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function latheShell(outer, inner, seg = 64) {
  const pts = outer.map(p => new THREE.Vector2(p[0], p[1]));
  const lip = outer[outer.length - 1], il = inner[inner.length - 1];
  pts.push(new THREE.Vector2((lip[0] + il[0]) / 2, Math.max(lip[1], il[1]) + 0.0015));
  for (let i = inner.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(inner[i][0], inner[i][1]));
  return new THREE.LatheGeometry(pts, seg);
}
function radiusAt(prof, y) { if (y <= prof[0][1]) return prof[0][0]; for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const a = prof[i - 1], b = prof[i]; return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return prof[prof.length - 1][0]; }
function volTable(prof) { const top = prof[prof.length - 1][1], y0 = prof[0][1], n = 120, tab = [[y0, 0]]; let v = 0; for (let i = 1; i <= n; i++) { const y = y0 + (top - y0) * i / n, r = radiusAt(prof, y - (top - y0) / n / 2); v += Math.PI * r * r * (top - y0) / n * 1e6; tab.push([y, v]); } return tab; }
function heightFor(tab, ml) { if (ml <= 0) return tab[0][0]; for (let i = 1; i < tab.length; i++) if (ml <= tab[i][1]) return lerp(tab[i - 1][0], tab[i][0], (ml - tab[i - 1][1]) / (tab[i][1] - tab[i - 1][1])); return tab[tab.length - 1][0]; }
function tubeAlong(points, r, mat, closed = false) { const c = new THREE.CatmullRomCurve3(points, closed); return mesh(new THREE.TubeGeometry(c, Math.max(16, points.length * 6), r, 6, closed), mat); }
function wireLoops(n, h, w, r, mat, hubY) {
  const g = new THREE.Group();
  for (let j = 0; j < n; j++) {
    const a = j / n * Math.PI, pts = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24 * Math.PI; const x = Math.sin(t) * w * (0.35 + 0.65 * Math.sin(t * 0.5 + 0.2)), y = hubY - (1 - Math.cos(t)) / 2 * h * 0 - Math.sin(t / 2) * 0; pts.push(V3(Math.cos(a) * Math.sin(t) * w, hubY - h * (0.5 - 0.5 * Math.cos(t)) * 0, Math.sin(a) * Math.sin(t) * w)); }
    const loop = []; for (let k = 0; k <= 28; k++) { const t = -Math.PI / 2 + k / 28 * Math.PI; const rr = w * Math.cos(t * 0.95), yy = hubY - h * (Math.sin(t) * 0.5 + 0.5); loop.push(V3(Math.cos(a) * rr * (k < 14 ? -1 : 1) * Math.sign(Math.cos(t)) , yy, Math.sin(a) * rr)); }
    // ellipse loop through hub and tip in a vertical plane
    const pl = []; for (let k = 0; k <= 32; k++) { const t = k / 32 * TAU; pl.push(V3(Math.cos(a) * Math.sin(t) * w, hubY - h / 2 + Math.cos(t) * h / 2, Math.sin(a) * Math.sin(t) * w)); }
    const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pl, true), 64, r, 5, true);
    g.add(mesh(tg, mat));
  }
  return g;
}

/* ---------- environment (soft studio reflections) ---------- */
function makeEnv() {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), new THREE.MeshBasicMaterial({ color: 0x8a847c, side: THREE.BackSide })); room.position.y = 2; es.add(room);
  const lamp = (w, h, x, y, z, c, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 1, 0); es.add(m); };
  lamp(3, 2, -4.9, 2.2, 1, 0xffffff); lamp(4, 1, 0, 4.9, 0, 0xfff4e6); lamp(2, 1.5, 4.9, 2, -1, 0xbfc8d0); lamp(3, 1.2, 0, 2, 4.9, 0xd8d0c4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0x6e5a46 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.9; es.add(floor);
  scene.environment = pm.fromScene(es, 0.04).texture;
}
function makeLights() {
  scene.add(new THREE.HemisphereLight(0xfffaf2, 0xb8a894, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1e0, 2.4); sun.position.set(-2.2, 4.2, 3.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -2.4; sc.right = 2.4; sc.top = 2.6; sc.bottom = -1; sc.near = 1; sc.far = 10; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdfe8f0, 0.5); fill.position.set(3, 2.5, 2); scene.add(fill);
  // under-cabinet glow on the counter
  const strip = new THREE.RectAreaLight ? null : null;
}

/* ---------- room ---------- */
const FIX = {}; // fixed interactive meshes
function tag(obj, ctrl) { obj.traverse(o => { if (o.isMesh) o.userData.ctrl = ctrl; }); return obj; }
function buildRoom() {
  const room = new THREE.Group(); scene.add(room); FIX.room = room;
  const floor = mesh(new THREE.PlaneGeometry(12, 8), MAT.floor, 0, 0, 2, false); floor.rotation.x = -Math.PI / 2; room.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(12, 4), MAT.wall, 0, 2, WALLZ, false); room.add(wall);
  const tiles = mesh(new THREE.PlaneGeometry(2.4, 0.46), MAT.tiles, 0, CT + 0.23, WALLZ + 0.002, false); room.add(tiles);
  // base cabinets + counter
  room.add(box(2.4, 0.82, 0.57, MAT.cabinet, 0, 0.05 + 0.41, -0.015));
  room.add(box(2.4, 0.05, 0.55, MAT.cabinetDark, 0, 0.025, -0.03));
  for (let i = 0; i < 4; i++) {
    const x = -0.9 + i * 0.6; room.add(box(0.592, 0.78, 0.02, MAT.cabinet, x, 0.07 + 0.39, 0.27));
    const h = box(0.24, 0.012, 0.02, MAT.brushed, x, 0.8, 0.29); room.add(h);
  }
  const top = box(2.44, 0.04, 0.6, MAT.counter, 0, CT - 0.02, 0.0); top.castShadow = false; room.add(top);
  // shelves
  SHELVES.forEach(y => {
    room.add(box(SHX[1] - SHX[0], 0.026, 0.22, MAT.wood, (SHX[0] + SHX[1]) / 2, y - 0.013, SHZ));
    [SHX[0] + 0.08, SHX[1] - 0.08].forEach(x => room.add(box(0.012, 0.09, 0.16, MAT.plastic, x, y - 0.07, SHZ - 0.02)));
  });
  // utensil rail
  const rail = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.62, 16), MAT.steel, 0.29, RAIL.y, RAIL.z); rail.rotation.z = Math.PI / 2; room.add(rail);
  [-0.02, 0.6].forEach(x => room.add(rot(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 16), MAT.steel, x, RAIL.y, RAIL.z - 0.015), 'x', Math.PI / 2)));
  // recipe ledge
  room.add(box(0.5, 0.015, 0.06, MAT.wood, 0.84, LEDGE.y - 0.0075, LEDGE.z + 0.005));
  // mitt hook
  room.add(mesh(new THREE.SphereGeometry(0.008, 12, 8), MAT.plastic, MITT3.p.x, MITT3.p.y + 0.01, WALLZ + 0.01));
  // tall oven column
  room.add(box(0.73, 0.86, 0.6, MAT.cabinet, 1.585, 0.43, 0.0)); room.add(box(0.73, 0.6, 0.6, MAT.cabinet, 1.585, 1.9, 0.0));
  room.add(box(0.04, 0.74, 0.6, MAT.cabinet, 1.24, 1.23, 0.0)); room.add(box(0.04, 0.74, 0.6, MAT.cabinet, 1.93, 1.23, 0.0)); room.add(box(0.73, 0.74, 0.02, MAT.cabinet, 1.585, 1.23, -0.29));
  room.add(box(0.7, 0.36, 0.02, MAT.cabinet, 1.585, 0.22 + 0.18, 0.31));
  room.add(box(0.7, 0.36, 0.02, MAT.cabinet, 1.585, 0.6 + 0.18 - 0.02, 0.31));
  room.add(box(0.7, 0.5, 0.02, MAT.cabinet, 1.585, 1.88, 0.31));
  [0.73, 0.38, 1.66].forEach(y => room.add(box(0.26, 0.012, 0.02, MAT.brushed, 1.585, y, 0.33)));
  buildOven(room); buildFridge(room); buildClock(room); buildScale(room); buildRack(room); buildMixer(room); buildMitt(room);
}

/* ---------- oven ---------- */
function buildOven(room) {
  const g = new THREE.Group(); room.add(g); const cx = (OVN.x0 + OVN.x1) / 2, w = OVN.x1 - OVN.x0 + 0.08;
  // frame around the cavity
  g.add(box(w, 0.04, 0.02, MAT.brushed, cx, OVN.y0 - 0.02, OVN.front));
  g.add(box(0.04, OVN.y1 - OVN.y0 + 0.1, 0.02, MAT.brushed, OVN.x0 - 0.02, (OVN.y0 + OVN.y1) / 2, OVN.front));
  g.add(box(0.04, OVN.y1 - OVN.y0 + 0.1, 0.02, MAT.brushed, OVN.x1 + 0.02, (OVN.y0 + OVN.y1) / 2, OVN.front));
  // cavity
  const cav = mesh(new THREE.BoxGeometry(OVN.x1 - OVN.x0, OVN.y1 - OVN.y0, 0.52), MAT.ovenIn, cx, (OVN.y0 + OVN.y1) / 2, OVN.front - 0.27, false); g.add(cav);
  // heating element
  const elPts = []; for (let i = 0; i <= 10; i++) elPts.push(V3(OVN.x0 + 0.05 + i * 0.047, OVN.y1 - 0.025, -0.15 + (i % 2) * 0.3));
  FIX.element = tubeAlong(elPts, 0.004, new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, emissive: 0x000000 })); g.add(FIX.element);
  // rack
  const rk = new THREE.Group(); for (let i = 0; i < 12; i++) rk.add(rot(mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.48, 6), MAT.chrome, OVN.x0 + 0.04 + i * 0.045, OVN.rackY - 0.003, 0.02), 'x', Math.PI / 2));
  [-0.2, 0.24].forEach(z => rk.add(rot(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.52, 6), MAT.chrome, cx, OVN.rackY - 0.003, z), 'z', Math.PI / 2)));
  g.add(rk);
  FIX.ovenLight = new THREE.PointLight(0xffa860, 0, 1.4, 1.2); FIX.ovenLight.position.set(cx, OVN.y1 - 0.06, 0.05); g.add(FIX.ovenLight);
  // control panel
  g.add(box(w, 0.11, 0.025, MAT.panelGlass, cx, 1.52, OVN.front));
  FIX.knobTemp = knob(1.42); FIX.knobTimer = knob(1.75); g.add(FIX.knobTemp, FIX.knobTimer);
  tag(FIX.knobTemp, 'knobTemp'); tag(FIX.knobTimer, 'knobTimer');
  FIX.lamp = mesh(new THREE.SphereGeometry(0.006, 12, 8), new THREE.MeshStandardMaterial({ color: 0x3a2516, emissive: 0x000000 }), 1.585, 1.52, OVN.front + 0.014); g.add(FIX.lamp);
  FIX.panelTex = canvTex(512, 64, () => { }); const pl = mesh(new THREE.PlaneGeometry(w - 0.02, 0.1), new THREE.MeshBasicMaterial({ map: FIX.panelTex, transparent: true }), cx, 1.52, OVN.front + 0.0135, false); g.add(pl);
  repaint(FIX.panelTex, (g2, W2, H2) => { g2.font = '600 15px Inter, sans-serif'; g2.fillStyle = 'rgba(200,200,200,.55)'; g2.textAlign = 'center'; const k = W2 / (w - 0.02); const x1 = (1.42 - (cx - (w - 0.02) / 2)) * k, x2 = (1.75 - (cx - (w - 0.02) / 2)) * k; for (let i = 0; i <= 5; i++) { const a = -Math.PI * 0.75 + i / 5 * Math.PI * 1.5 - Math.PI / 2; g2.fillText(i * 50, x1 + Math.cos(a) * 44, 34 + Math.sin(a) * 26); } for (let i = 0; i <= 6; i++) { const a = -Math.PI * 0.75 + i / 6 * Math.PI * 1.5 - Math.PI / 2; g2.fillText(i * 10, x2 + Math.cos(a) * 44, 34 + Math.sin(a) * 26); } g2.font = '600 11px Inter, sans-serif'; g2.fillText('°C', x1 + 60, 58); g2.fillText('MIN', x2 + 62, 58); });
  // door (pivot at the bottom hinge)
  const door = new THREE.Group(); door.position.set(cx, OVN.y0 - 0.005, OVN.front + 0.012); g.add(door);
  const dh = OVN.y1 - OVN.y0 + 0.06;
  const dglass = box(w - 0.01, dh, 0.022, MAT.blackGlass, 0, dh / 2, 0); dglass.castShadow = false; door.add(dglass);
  const handle = mesh(new THREE.CylinderGeometry(0.009, 0.009, w - 0.12, 16), MAT.steel, 0, dh - 0.045, 0.045); handle.rotation.z = Math.PI / 2; door.add(handle);
  [-1, 1].forEach(s => door.add(box(0.014, 0.014, 0.04, MAT.steel, s * (w / 2 - 0.08), dh - 0.045, 0.025)));
  FIX.ovenDoor = door; tag(door, 'ovenDoor');
}
function knob(x) {
  const g = new THREE.Group(); g.position.set(x, 1.52, OVN.front + 0.012);
  const k = mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.026, 32), MAT.steel, 0, 0, 0.013); k.rotation.x = Math.PI / 2; g.add(k);
  const grip = box(0.01, 0.04, 0.01, MAT.chrome, 0, 0, 0.03); g.add(grip);
  const mark = box(0.003, 0.012, 0.002, new THREE.MeshBasicMaterial({ color: 0xd0402b }), 0, 0.014, 0.0355); g.add(mark);
  return g;
}

/* ---------- fridge ---------- */
function buildFridge(room) {
  const g = new THREE.Group(); room.add(g); const { x0, x1, h, front } = FRG, cx = (x0 + x1) / 2, w = x1 - x0, d = front - WALLZ;
  const SP = new THREE.MeshStandardMaterial({ color: 0xd4d8db, metalness: 0.85, roughness: 0.32 }); MAT.fridgeSteel = SP;
  const sides = [box(0.03, h, d, SP, x0 + 0.015, h / 2, (front + WALLZ) / 2), box(0.03, h, d, SP, x1 - 0.015, h / 2, (front + WALLZ) / 2), box(w, 0.04, d, SP, cx, h - 0.02, (front + WALLZ) / 2), box(w, 0.06, d, MAT.cabinetDark, cx, 0.03, (front + WALLZ) / 2)];
  sides.forEach(s => g.add(s));
  const liner = mesh(new THREE.BoxGeometry(w - 0.075, h - 0.135, d - 0.035), new THREE.MeshStandardMaterial({ color: 0xf3f6f7, roughness: 0.45, side: THREE.BackSide }), cx, h / 2 + 0.01, (front + WALLZ) / 2 - 0.01, false); liner.receiveShadow = false; g.add(liner);
  FRG.shelves.forEach(y => { const s = box(w - 0.08, 0.006, d - 0.07, new THREE.MeshStandardMaterial({ color: 0xe6f1f4, roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }), cx, y - 0.003, -0.0); s.castShadow = false; g.add(s); g.add(box(w - 0.07, 0.012, 0.01, MAT.white, cx, y - 0.004, front - 0.04)); });
  g.add(box(w - 0.08, 0.2, d - 0.08, new THREE.MeshStandardMaterial({ color: 0xe8f2f5, roughness: 0.3, transparent: true, opacity: 0.5 }), cx, 0.2, 0.0));
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x7da35a : 0x9cbf6a, roughness: 0.7 }), x0 + 0.12 + i * 0.15, 0.17, -0.05 + (i % 2) * 0.08));
  // jam jar decoration
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 24), new THREE.MeshPhysicalMaterial({ color: 0x9a1f2a, roughness: 0.1, transmission: 0.3, thickness: 0.05 }), x1 - 0.12, 1.38 + 0.04, -0.12));
  g.add(mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.02, 24), MAT.white, x1 - 0.12, 1.38 + 0.09, -0.12));
  FIX.fridgeLight = new THREE.PointLight(0xf2f8ff, 0, 1.6, 1.5); FIX.fridgeLight.position.set(cx, h - 0.15, 0.1); g.add(FIX.fridgeLight);
  // door hinged on the left edge
  const door = new THREE.Group(); door.position.set(x0, 0.06, front + 0.02); g.add(door);
  const panel = box(w, h - 0.06, 0.05, MAT.fridgeSteel, w / 2, (h - 0.06) / 2, 0); door.add(panel);
  const inner = box(w - 0.04, h - 0.12, 0.012, MAT.liner, w / 2, (h - 0.06) / 2, -0.03); door.add(inner);
  [0.5, 0.95, 1.4].forEach(y => door.add(box(w - 0.1, 0.06, 0.07, new THREE.MeshStandardMaterial({ color: 0xdfeef3, roughness: 0.3, transparent: true, opacity: 0.55 }), w / 2, y, -0.07)));
  const hb = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.6, 16), MAT.steel, w - 0.06, 1.05, 0.07); door.add(hb);
  [0.78, 1.32].forEach(y => door.add(box(0.016, 0.016, 0.05, MAT.steel, w - 0.06, y, 0.045)));
  FIX.fridgeDoor = door; tag(door, 'fridgeDoor');
}
/* ---------- clock ---------- */
function buildClock(room) {
  const g = new THREE.Group(); g.position.copy(CLK.p); room.add(g);
  const rim = mesh(new THREE.CylinderGeometry(CLK.r, CLK.r, 0.035, 64), MAT.plastic, 0, 0, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const faceTex = canvTex(512, 512, (c, w, h) => { c.fillStyle = '#fbfaf7'; c.beginPath(); c.arc(256, 256, 256, 0, TAU); c.fill(); for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; c.strokeStyle = big ? '#222' : '#888'; c.lineWidth = big ? 9 : 3; c.beginPath(); c.moveTo(256 + Math.cos(a) * 236, 256 + Math.sin(a) * 236); c.lineTo(256 + Math.cos(a) * (big ? 196 : 214), 256 + Math.sin(a) * (big ? 196 : 214)); c.stroke(); } c.font = '500 46px Inter, sans-serif'; c.fillStyle = '#222'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; c.fillText(i, 256 + Math.cos(a) * 160, 256 + Math.sin(a) * 160); } });
  const face = mesh(new THREE.CircleGeometry(CLK.r - 0.012, 64), new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }), 0, 0, 0.018, false); g.add(face);
  const glassF = mesh(new THREE.CircleGeometry(CLK.r - 0.01, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0.02, transparent: true, opacity: 0.25 }), 0, 0, 0.03, false); g.add(glassF);
  const handMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.4 });
  const mkHand = (len, wd, z, mat) => { const p = new THREE.Group(); p.position.z = z; const b = box(wd, len, 0.003, mat, 0, len / 2 - 0.012, 0); b.castShadow = false; p.add(b); g.add(p); return p; };
  FIX.hHour = mkHand(0.06, 0.008, 0.021, handMat); FIX.hMin = mkHand(0.09, 0.005, 0.023, handMat); FIX.hSec = mkHand(0.1, 0.002, 0.025, new THREE.MeshStandardMaterial({ color: 0xc4412c }));
  g.add(rot(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 16), handMat, 0, 0, 0.026), 'x', Math.PI / 2));
  FIX.clock = g; tag(g, 'clock');
}
/* ---------- scale ---------- */
function buildScale(room) {
  const g = new THREE.Group(); g.position.set(SCL.x, CT, SCL.z); room.add(g);
  g.add(box(0.2, 0.024, 0.2, MAT.white, 0, 0.012, 0));
  const top = box(0.205, 0.006, 0.205, MAT.glass, 0, 0.028, 0); g.add(top); g.children.forEach(m => m.userData.ctrl = 'scale');
  FIX.lcdTex = canvTex(256, 64, () => { });
  const lcd = mesh(new THREE.PlaneGeometry(0.07, 0.016), new THREE.MeshBasicMaterial({ map: FIX.lcdTex }), -0.02, 0.012, 0.1006, false); g.add(lcd);
  const btn = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.004, 20), MAT.steel, 0.055, 0.012, 0.101); btn.rotation.x = Math.PI / 2; g.add(btn); tag(btn, 'tare');
  FIX.scale = g;
}
function buildRack(room) {
  const g = new THREE.Group(); g.position.set(RCK.x, CT, RCK.z); room.add(g);
  for (let i = 0; i < 11; i++) { const c = mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.24, 6), MAT.rackWire, -0.15 + i * 0.03, 0.026, 0); c.rotation.x = Math.PI / 2; g.add(c); }
  [-0.12, 0.12].forEach(z => { const c = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.32, 6), MAT.rackWire, 0, 0.026, z); c.rotation.z = Math.PI / 2; g.add(c); });
  [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].forEach(([x, z]) => g.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.026, 6), MAT.rackWire, x, 0.013, z)));
}
/* ---------- stand mixer ---------- */
function buildMixer(room) {
  const g = new THREE.Group(); g.position.set(MXR.x, CT, MXR.z); room.add(g);
  const base = mesh(new THREE.BoxGeometry(0.33, 0.036, 0.21), MAT.enamel, -0.0, 0.018, 0); g.add(base); [-1, 1].forEach(s => g.add(rot(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.21, 20), MAT.enamel, s * 0.165, 0.018, 0), 'x', Math.PI / 2)));
  const col = mesh(new THREE.CapsuleGeometry(0.05, 0.2, 8, 24), MAT.enamel, 0.1, 0.14, 0); col.scale.set(1, 1, 1.15); g.add(col);
  const head = mesh(new THREE.CapsuleGeometry(0.065, 0.2, 10, 32), MAT.enamel, 0.0, 0.33, 0); head.rotation.z = Math.PI / 2; g.add(head);
  const band = mesh(new THREE.CylinderGeometry(0.067, 0.067, 0.02, 32), MAT.chrome, -0.09, 0.33, 0); band.rotation.z = Math.PI / 2; g.add(band);
  const hub = mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.04, 20), MAT.chrome, MXR.seat.x - MXR.x, 0.26, 0); g.add(hub);
  const clamp_ = mesh(new THREE.TorusGeometry(0.075, 0.006, 8, 32), MAT.chrome, MXR.seat.x - MXR.x, 0.05, 0); g.add(mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.008, 32), MAT.chrome, MXR.seat.x - MXR.x, 0.046, 0)); clamp_.rotation.x = Math.PI / 2; g.add(clamp_);
  // speed lever
  const lev = new THREE.Group(); lev.position.set(0.1, 0.33, 0.07); g.add(lev);
  lev.add(box(0.06, 0.008, 0.008, MAT.chrome, 0.03, 0, 0)); lev.add(mesh(new THREE.SphereGeometry(0.009, 12, 10), MAT.plastic, 0.06, 0, 0));
  FIX.lever = lev; tag(lev, 'lever');
  FIX.attachPivot = new THREE.Group(); FIX.attachPivot.position.set(MXR.seat.x - MXR.x, 0.24, 0); g.add(FIX.attachPivot);
  FIX.mixer = g; tag(base, 'mixer'); tag(col, 'mixer'); tag(head, 'mixer');
}
function buildMitt(room) {
  const s = new THREE.Shape(); const k = 0.0021;
  s.moveTo(-18 * k, -52 * k); s.lineTo(-20 * k, -10 * k); s.bezierCurveTo(-34 * k, -4 * k, -38 * k, 18 * k, -26 * k, 22 * k); s.bezierCurveTo(-20 * k, 24 * k, -16 * k, 12 * k, -14 * k, 6 * k); s.bezierCurveTo(-16 * k, 40 * k, -6 * k, 52 * k, 4 * k, 52 * k); s.bezierCurveTo(18 * k, 52 * k, 22 * k, 36 * k, 20 * k, 10 * k); s.lineTo(18 * k, -52 * k); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 4 });
  const m = mesh(geo, MAT.fabric, MITT3.p.x, MITT3.p.y - 0.12, WALLZ + 0.02); m.rotation.z = Math.PI + 0.08; room.add(m);
  m.scale.set(-1, 1, 1);
  FIX.mitt = m; tag(m, 'mitt');
}

/* =========================================================
   Item models
   ========================================================= */
const PROF = {
  bowlL: { outer: [[0, 0], [0.05, 0], [0.095, 0.03], [0.125, 0.075], [0.132, 0.11]], inner: [[0, 0.006], [0.045, 0.007], [0.088, 0.032], [0.117, 0.074], [0.125, 0.108]] },
  bowlM: { outer: [[0, 0], [0.062, 0], [0.098, 0.04], [0.11, 0.1], [0.112, 0.14]], inner: [[0, 0.007], [0.058, 0.009], [0.093, 0.042], [0.105, 0.1], [0.107, 0.138]] },
  bowlS: { outer: [[0, 0], [0.04, 0], [0.068, 0.03], [0.076, 0.06]], inner: [[0, 0.006], [0.038, 0.007], [0.063, 0.032], [0.071, 0.058]] },
  jug: { outer: [[0, 0], [0.055, 0], [0.056, 0.13]], inner: [[0, 0.004], [0.051, 0.004], [0.052, 0.128]] },
  tin: { outer: [[0, 0], [0.1, 0], [0.1, 0.05]], inner: [[0, 0.002], [0.097, 0.002], [0.097, 0.049]] },
};
Object.values(PROF).forEach(p => p.vol = volTable(p.inner));
const LOAF = { w: 0.25, d: 0.115, h: 0.075, iw: 0.235, id: 0.1 };
const SPEC = {
  flour: { rad: 0.065, h: 0.22 }, sugar: { rad: 0.05, h: 0.15 }, salt: { rad: 0.04, h: 0.1 }, bp: { rad: 0.038, h: 0.1 }, yeast: { rad: 0.035, h: 0.085 },
  chips: { rad: 0.06, h: 0.17 }, milk: { rad: 0.04, h: 0.24 }, water: { rad: 0.06, h: 0.2 }, eggs: { rad: 0.13, h: 0.07 }, egg: { rad: 0.022, h: 0.057 },
  butter: { rad: 0.1, h: 0.05 }, butterPiece: { rad: 0.03, h: 0.035 }, bowlL: { rad: 0.132, h: 0.11 }, bowlM: { rad: 0.112, h: 0.14 }, bowlS: { rad: 0.076, h: 0.06 },
  jug: { rad: 0.06, h: 0.13 }, tin: { rad: 0.1, h: 0.05 }, loaf: { rad: 0.13, h: 0.075 }, tray: { rad: 0.18, h: 0.016 },
  tbsp: { rad: 0.02, h: 0.17 }, tsp: { rad: 0.015, h: 0.14 }, whisk: { rad: 0.03, h: 0.27 }, spatula: { rad: 0.025, h: 0.26 }, attWhisk: { rad: 0.035, h: 0.17 }, attHook: { rad: 0.03, h: 0.17 },
};
function glassLathe(prof) { return mesh(latheShell(prof.outer, prof.inner), MAT.glass); }
function contentDisc() { const t = canvTex(256, 256, () => { }); const m = mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, alphaTest: 0.5 }), 0, 0, 0, false); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 2; m.userData.tex = t; return m; }

function buildItemModel(it) {
  const k = it.kind, g = new THREE.Group(), sp = SPEC[k];
  const add = m => { g.add(m); return m; };
  it.parts = {};
  if (k === 'bowlL' || k === 'bowlM' || k === 'bowlS' || k === 'jug' || k === 'tin') {
    const p = PROF[k];
    const mat = k === 'bowlL' || k === 'jug' ? MAT.glass : k === 'bowlM' ? MAT.steel : k === 'tin' ? MAT.darkMetal : MAT.ceramic;
    add(mesh(latheShell(p.outer, p.inner), mat));
    if (k === 'bowlS') { const band = mesh(new THREE.TorusGeometry(0.0745, 0.0015, 6, 64), new THREE.MeshStandardMaterial({ color: 0x48698a }), 0, 0.05, 0); band.rotation.x = Math.PI / 2; add(band); }
    if (k === 'bowlM') { const h = mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 24, Math.PI), MAT.steel, 0.11, 0.09, 0); h.rotation.z = -Math.PI / 2; add(h); }
    if (k === 'jug') {
      const h = mesh(new THREE.TorusGeometry(0.04, 0.007, 10, 24, Math.PI), MAT.glass, 0.056, 0.07, 0); h.rotation.z = -Math.PI / 2; add(h);
      const mk = canvTex(256, 256, (c) => { c.clearRect(0, 0, 256, 256); c.strokeStyle = 'rgba(200,50,40,.9)'; c.fillStyle = 'rgba(200,50,40,.95)'; c.font = '600 18px Inter, sans-serif'; for (let ml = 50; ml <= 500; ml += 50) { const y = 256 - (heightFor(PROF.jug.vol, ml) / 0.13) * 256; const big = ml % 100 === 0; c.lineWidth = 2.5; c.beginPath(); c.moveTo(20, y); c.lineTo(big ? 70 : 50, y); c.stroke(); if (big) c.fillText(ml, 78, y + 6); } c.fillText('ml', 78, 30); });
      const mm = mesh(new THREE.CylinderGeometry(0.0565, 0.0565, 0.13, 32, 1, true, -0.6, 1.2), new THREE.MeshBasicMaterial({ map: mk, transparent: true, depthWrite: false }), 0, 0.065, 0, false); add(mm);
    }
    it.parts.disc = add(contentDisc());
    if (k === 'bowlL' || k === 'jug') { it.parts.body = add(mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, transparent: true, opacity: 0.95 }), 0, 0, 0, false)); it.parts.body.visible = false; }
    it.parts.dome = add(mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.dough.clone(), 0, 0, 0)); it.parts.dome.visible = false;
  } else if (k === 'loaf') {
    const { w, d, h } = LOAF, t = 0.003;
    const shape = new THREE.Group();
    shape.add(box(w * 0.9, t, d * 0.88, MAT.darkMetal, 0, t / 2, 0));
    const side = (sw, ang, x, z, ry) => { const m = box(sw, h, t, MAT.darkMetal, x, h / 2, z); m.rotation.y = ry; m.rotation.x = ang * (ry ? 0 : 1); if (ry) m.rotation.z = ang; return m; };
    const s1 = box(w, h * 1.02, t, MAT.darkMetal, 0, h / 2, d / 2 - 0.004); s1.rotation.x = -0.12; shape.add(s1);
    const s2 = box(w, h * 1.02, t, MAT.darkMetal, 0, h / 2, -d / 2 + 0.004); s2.rotation.x = 0.12; shape.add(s2);
    const s3 = box(t, h * 1.02, d, MAT.darkMetal, w / 2 - 0.006, h / 2, 0); s3.rotation.z = 0.12; shape.add(s3);
    const s4 = box(t, h * 1.02, d, MAT.darkMetal, -w / 2 + 0.006, h / 2, 0); s4.rotation.z = -0.12; shape.add(s4);
    add(shape);
    it.parts.disc = contentDisc(); it.parts.disc.scale.set(LOAF.iw / 2, LOAF.id / 2, 1); add(it.parts.disc);
    it.parts.dome = add(mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.dough.clone(), 0, 0, 0)); it.parts.dome.visible = false;
  } else if (k === 'tray') {
    add(box(0.36, 0.004, 0.26, MAT.brushed, 0, 0.002, 0));
    [[0, 0.13, 0.36, 0.004], [0, -0.13, 0.36, 0.004]].forEach(([x, z, w2]) => add(box(w2, 0.014, 0.004, MAT.brushed, x, 0.007, z)));
    [-0.18, 0.18].forEach(x => add(box(0.004, 0.014, 0.26, MAT.brushed, x, 0.007, 0)));
    it.parts.balls = new THREE.Group(); add(it.parts.balls);
  } else if (k === 'flour') {
    const geo = new THREE.BoxGeometry(0.12, 0.22, 0.08, 6, 10, 4); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setX(i, pa.getX(i) * (1 + 0.04 * Math.sin(y * 30)) + (Math.random() - 0.5) * 0.0015); pa.setZ(i, pa.getZ(i) * (1 + 0.06 * Math.cos(y * 20)) + (Math.random() - 0.5) * 0.0015); } geo.computeVertexNormals();
    const lab = labelTex(256, 448, (c, w, h) => { c.fillStyle = '#f4efe5'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 3000, '120,100,70', 0.08); c.fillStyle = '#fbfaf6'; c.fillRect(20, 150, w - 40, 170); c.fillStyle = '#34536c'; c.font = '700 54px Georgia, serif'; c.textAlign = 'center'; c.fillText('FLOUR', w / 2, 230); c.fillStyle = '#8a7f6f'; c.font = '500 20px Inter, sans-serif'; c.fillText('plain · 2 kg', w / 2, 270); c.strokeStyle = '#c4a55b'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 290); c.lineTo(w / 2, 312); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.moveTo(0, 60); c.lineTo(w, 60); c.stroke(); });
    const side = new THREE.MeshStandardMaterial({ color: 0xebe4d6, roughness: 0.92 }), front = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.9 }), topm = new THREE.MeshStandardMaterial({ map: TX.flourTop, roughness: 1 });
    add(mesh(geo, [side, side, topm, side, front, side], 0, 0.11, 0));
  } else if (k === 'sugar' || k === 'salt' || k === 'yeast') {
    const r = sp.rad, h = sp.h, col = k === 'yeast' ? 0xc6a066 : 0xfbfaf6;
    const p = { outer: [[0, 0], [r, 0], [r, h * 0.92], [r * 0.86, h]], inner: [[0, 0.004], [r - 0.003, 0.004], [r - 0.003, h * 0.91], [r * 0.83, h - 0.001]] };
    add(mesh(latheShell(p.outer, p.inner), k === 'yeast' ? new THREE.MeshPhysicalMaterial({ color: 0xb8803c, roughness: 0.05, transmission: 0.8, thickness: 0.004, transparent: true }) : MAT.glass));
    it.parts.fill = add(mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.004, 1, 32), new THREE.MeshStandardMaterial({ color: col, map: TX.speck, roughness: 0.9 }), 0, 0, 0, false));
    const lab = labelTex(256, 64, (c, w, hh) => { c.fillStyle = '#e4d5b9'; c.fillRect(0, 0, w, hh); c.fillStyle = '#4a3b2b'; c.font = '700 30px Georgia, serif'; c.textAlign = 'center'; c.fillText(k.toUpperCase(), w / 2, 42); });
    add(mesh(new THREE.CylinderGeometry(r + 0.0008, r + 0.0008, h * 0.22, 32, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.85 }), 0, h * 0.5, 0, false));
  } else if (k === 'bp') {
    const lab = labelTex(512, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f5a86'); gr.addColorStop(1, '#1d3a5a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#f6efe2'; c.font = '700 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('BAKING POWDER', w / 4 + 40, 60); c.font = '500 18px Inter, sans-serif'; c.fillText('double acting · 150 g', w / 4 + 40, 92); });
    add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.1, 40), [new THREE.MeshStandardMaterial({ map: lab, metalness: 0.3, roughness: 0.4 }), MAT.steel, MAT.steel], 0, 0.05, 0));
  } else if (k === 'chips') {
    const geo = new THREE.BoxGeometry(0.11, 0.17, 0.05, 6, 8, 4); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); const pinch = 1 - Math.pow(Math.max(0, (y - 0.04) / 0.045), 2) * 0.7; pa.setZ(i, pa.getZ(i) * pinch); } geo.computeVertexNormals();
    const lab = labelTex(256, 384, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#3a2014'); gr.addColorStop(0.5, '#6b3e25'); gr.addColorStop(1, '#2e190f'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#f3e3c3'; c.font = '700 34px Georgia, serif'; c.textAlign = 'center'; c.fillText('CHOCOLATE', w / 2, 110); c.font = '600 20px Inter, sans-serif'; c.fillText('dark chips · 300 g', w / 2, 300); c.fillStyle = 'rgba(240,228,210,.25)'; c.beginPath(); c.roundRect(40, 140, w - 80, 120, 30); c.fill(); c.fillStyle = '#24130a'; for (let i = 0; i < 60; i++) { const x = 50 + Math.random() * (w - 100), y = 180 + Math.random() * 75; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); } });
    add(mesh(geo, new THREE.MeshPhysicalMaterial({ map: lab, roughness: 0.3, clearcoat: 0.8 }), 0, 0.085, 0));
  } else if (k === 'milk') {
    const lab = labelTex(256, 512, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#4e83b7'; c.fillRect(0, 230, w, 110); c.fillStyle = '#fff'; c.font = '700 64px Georgia, serif'; c.textAlign = 'center'; c.fillText('MILK', w / 2, 305); c.fillStyle = '#4e83b7'; c.font = '600 24px Inter, sans-serif'; c.fillText('whole · 1 L', w / 2, 400); });
    const mat = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.55 });
    add(mesh(new THREE.BoxGeometry(0.07, 0.19, 0.07), [MAT.white, MAT.white, MAT.white, MAT.white, mat, mat], 0, 0.095, 0));
    const gable = mesh(new THREE.CylinderGeometry(0.0495, 0.0495, 0.07, 4, 1), MAT.white, 0, 0.215, 0); gable.rotation.z = Math.PI / 2; gable.rotation.y = 0; gable.scale.set(0.45, 1, 1); gable.rotation.x = Math.PI / 4; add(gable);
    const capm = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 16), new THREE.MeshStandardMaterial({ color: 0xe9b949 }), 0.018, 0.232, 0.0); add(capm);
  } else if (k === 'water') {
    const r = 0.055, h = 0.2, p = { outer: [[0, 0], [r, 0], [r, h]], inner: [[0, 0.005], [r - 0.003, 0.005], [r - 0.003, h - 0.001]] };
    add(mesh(latheShell(p.outer, p.inner), MAT.glass));
    const hd = mesh(new THREE.TorusGeometry(0.055, 0.008, 10, 24, Math.PI), MAT.glass, 0.056, 0.11, 0); hd.rotation.z = -Math.PI / 2; add(hd);
    it.parts.fill = add(mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.004, 1, 32), MAT.water, 0, 0, 0, false));
  } else if (k === 'eggs') {
    add(box(0.26, 0.04, 0.11, MAT.pulp, 0, 0.02, 0));
    it.parts.eggs = []; for (let i = 0; i < 6; i++) { const e = add(eggMesh()); e.position.set(-0.085 + (i % 3) * 0.085, 0.03, i < 3 ? -0.026 : 0.026); e.rotation.z = 0.05; it.parts.eggs.push(e); }
  } else if (k === 'egg') {
    const e = add(eggMesh()); e.rotation.z = Math.PI / 2; e.position.set(0.0285, 0.022, 0); it.parts.egg = e;
  } else if (k === 'butter') {
    add(box(0.2, 0.012, 0.1, MAT.ceramic, 0, 0.006, 0));
    it.parts.block = add(box(1, 0.035, 0.06, MAT.butter, 0, 0.012 + 0.0175, 0));
    const wrap = labelTex(256, 64, (c, w, h) => { c.fillStyle = '#f3efe6'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(180,60,50,.8)'; c.lineWidth = 2; for (let i = 1; i < 10; i++) { const x = i / 10 * w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, i % 2 ? 10 : 18); c.stroke(); } c.fillStyle = '#4a5a8c'; c.font = '700 22px Georgia, serif'; c.textAlign = 'center'; c.fillText('BUTTER', w / 2, 46); });
    it.parts.wrap = add(box(1, 0.037, 0.062, new THREE.MeshStandardMaterial({ map: wrap, roughness: 0.8 }), 0, 0.012 + 0.0175, 0));
  } else if (k === 'butterPiece') {
    it.parts.block = add(box(1, 0.035, 0.06, MAT.butter, 0, 0.0175, 0));
  } else if (k === 'tbsp' || k === 'tsp') {
    const L = sp.h, br = k === 'tbsp' ? 0.021 : 0.015;
    const hnd = box(0.008, L - br * 1.4, 0.0025, MAT.steel, 0, br * 1.4 + (L - br * 1.4) / 2, 0); add(hnd);
    const bowl = mesh(new THREE.SphereGeometry(br, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), MAT.steel, 0, br * 0.75, 0); bowl.scale.set(1, 0.55, 1); add(bowl);
    it.parts.fill = add(mesh(new THREE.SphereGeometry(br * 0.92, 20, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, map: TX.speck }), 0, br * 0.75, 0, false)); it.parts.fill.scale.set(1, 0.35, 1); it.parts.fill.visible = false;
  } else if (k === 'whisk') {
    const L = sp.h; add(mesh(new THREE.CylinderGeometry(0.011, 0.009, L * 0.4, 20), MAT.steel, 0, L * 0.8, 0));
    add(wireLoops(4, L * 0.6, 0.032, 0.0011, MAT.chrome, L * 0.6));
  } else if (k === 'spatula') {
    const L = sp.h; add(mesh(new THREE.CylinderGeometry(0.007, 0.007, L * 0.7, 16), MAT.plastic, 0, L * 0.65, 0));
    const head = box(0.05, 0.075, 0.009, MAT.silicone, 0, 0.0375, 0); add(head);
  } else if (k === 'attWhisk') {
    const L = sp.h; add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 16), MAT.chrome, 0, L - 0.02, 0));
    add(wireLoops(5, L - 0.03, 0.045, 0.0013, MAT.chrome, L - 0.035));
  } else if (k === 'attHook') {
    const L = sp.h; add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 16), MAT.chrome, 0, L - 0.02, 0));
    const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(V3(Math.sin(t * Math.PI * 1.3) * 0.035, (L - 0.04) * (1 - t) + 0.01, Math.cos(t * Math.PI * 1.3) * 0.012)); } add(tubeAlong(pts, 0.006, MAT.chrome));
  }
  g.traverse(o => { if (o.isMesh) o.userData.item = it; });
  return g;
}
function eggMesh() {
  const pts = []; const R = 0.022, h = 0.057;
  for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; pts.push(new THREE.Vector2(Math.max(0.0001, R * Math.sin(t) * (1 + 0.12 * Math.cos(t))), h / 2 * (1 - Math.cos(t)))); }
  return mesh(new THREE.LatheGeometry(pts, 32), MAT.egg);
}
function eggHalf(top) {
  const pts = []; const R = 0.022, h = 0.057;
  for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; const y = h / 2 * (1 - Math.cos(t)); if (top ? y >= h * 0.45 : y <= h * 0.45) pts.push(new THREE.Vector2(Math.max(0.0001, R * Math.sin(t) * (1 + 0.12 * Math.cos(t))), y)); }
  const g = new THREE.Group(); g.add(mesh(new THREE.LatheGeometry(pts, 24), MAT.egg)); const inner = mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.x * 0.94, p.y)), 24), MAT.eggInside); g.add(inner); return g;
}
