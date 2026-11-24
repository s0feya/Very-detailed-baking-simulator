'use strict';
/* =========================================================
   Decorating counter, appliance close-ups, turning out bakes,
   cream, fruit, piping, layering, rolling, plating and serving.
   Loaded after play3d.js; wraps its functions.
   ========================================================= */
const DX = 3.15, DCTR = { x0: 1.99, x1: 4.28 };
const DRAIL = { y: 1.36, z: -0.265, slots: [DX - 0.95, DX - 0.83, DX - 0.71, DX - 0.59] };
const DSHELF = { y: 1.52, x0: DX - 0.42, x1: DX + 0.5, z: -0.16 };
let station = 'bake', edgeDwell = 0, prevView = 'counter', rollDrag = null;
const onDecor = x => x > 1.9;

/* ---------- new ingredients & items ---------- */
Object.assign(ING, {
  cream: { n: 'cream', d: 1.0, c: [250, 248, 238], type: 'liquid' },
  icing: { n: 'icing sugar', d: 0.56, c: [252, 252, 252], type: 'powder' },
  sprinkles: { n: 'sprinkles', d: 0.8, c: [236, 120, 150], type: 'chunk' },
});
Object.assign(DEF, {
  cream: { name: 'Whipping cream', src: 'cream', stock: 500, pour: { max: 45, tilt: 1.7 }, tare: 30, spoonable: 1 },
  icing: { name: 'Icing sugar shaker', src: 'icing', stock: 250, pour: { max: 7, tilt: 2.0 }, tare: 120, deco: 'dust' },
  sprinkles: { name: 'Sprinkles', src: 'sprinkles', stock: 120, pour: { max: 8, tilt: 2.0 }, tare: 150, deco: 'sprinkle' },
  chips2: { name: 'Chocolate chips', src: 'chips', stock: 300, pour: { max: 28, tilt: 1.9 }, tare: 15, deco: 'chip' },
  straws: { name: 'Strawberries', tare: 30, pick: 'strawberry' }, kiwis: { name: 'Kiwis', tare: 200, pick: 'kiwi' }, blues: { name: 'Blueberries', tare: 20, pick: 'blueberries' },
  strawberry: { name: 'Strawberry', tare: 15, fruit: 'strawberry' }, kiwi: { name: 'Kiwi', tare: 75, fruit: 'kiwi' }, blueberries: { name: 'A handful of blueberries', tare: 10, fruit: 'blueberry' },
  slices: { name: 'Sliced fruit', tare: 0 }, slice: { name: 'Fruit slice', tare: 0 },
  bowlD: { name: 'Cream bowl', cont: 1, recv: 1, pour: { max: 60, tilt: 1.6 }, tare: 300, mat: 'glass' },
  offset: { name: 'Offset spatula', tool: 1, spread: 1, tare: 50 }, knife: { name: 'Bread knife', tool: 1, knife: 1, tare: 110 },
  piping: { name: 'Piping bag', tool: 1, pipe: 1, cont: 1, tare: 20 }, whisk2: { name: 'Balloon whisk', tool: 1, mixer: 'whisk', tare: 90 },
  plate1: { name: 'Gold-rim porcelain plate', host: 1, tare: 520 }, plate2: { name: 'Blue floral plate', host: 1, tare: 560 }, plate3: { name: 'Sage stoneware plate', host: 1, tare: 640 },
  turntable: { name: 'Cake turntable', host: 1, fixed: 1 }, board: { name: 'Cutting board', host: 1, fixed: 1 },
  bake: { name: 'Bake' },
});
DEF.tray.recv = 1; DEF.tray.pour = { max: 40, tilt: 1.7 }; DEF.loaf.pour = { max: 0, tilt: 1.6 };
Object.assign(SPEC, {
  cream: { rad: 0.04, h: 0.2 }, icing: { rad: 0.034, h: 0.12 }, sprinkles: { rad: 0.032, h: 0.11 }, chips2: { rad: 0.06, h: 0.17 },
  straws: { rad: 0.075, h: 0.06 }, kiwis: { rad: 0.08, h: 0.05 }, blues: { rad: 0.06, h: 0.05 },
  strawberry: { rad: 0.018, h: 0.036 }, kiwi: { rad: 0.03, h: 0.05 }, blueberries: { rad: 0.022, h: 0.014 }, slices: { rad: 0.045, h: 0.012 }, slice: { rad: 0.015, h: 0.006 },
  bowlD: { rad: 0.076, h: 0.06 }, offset: { rad: 0.02, h: 0.26 }, knife: { rad: 0.02, h: 0.3 }, piping: { rad: 0.032, h: 0.22 }, whisk2: { rad: 0.03, h: 0.27 },
  plate1: { rad: 0.13, h: 0.018 }, plate2: { rad: 0.13, h: 0.018 }, plate3: { rad: 0.14, h: 0.02 }, turntable: { rad: 0.15, h: 0.09 }, board: { rad: 0.18, h: 0.022 },
});
PROF.bowlD = PROF.bowlS;
const hostTop = h => h.p.y + (h.kind === 'turntable' ? 0.09 : h.kind === 'board' ? 0.022 : h.kind === 'plate3' ? 0.012 : 0.01);

/* ---------- cream & mixing rules ---------- */
const _form = Mix.prototype.form;
Mix.prototype.form = function () { const t = this.total(); if (t > 0.5 && (this.g.cream || 0) > t * 0.6) return this.whip > 0.45 ? 'cream' : 'liquid'; return _form.call(this); };
const _desc = Mix.prototype.describe;
Mix.prototype.describe = function () { const t = this.total(); if (t > 0.5 && (this.g.cream || 0) > t * 0.6) { const w = this.whip; return w < 0.25 ? 'liquid cream' : w < 0.45 ? 'thickening' : w < 0.65 ? 'soft peaks' : w <= 1.05 ? 'stiff peaks' : 'over-whipped, grainy'; } return _desc.call(this); };
const isCream = m => m && m.total() > 0.5 && (m.g.cream || 0) > m.total() * 0.6;
const _handMix = handMix;
handMix = function (m, mv, type) {
  const t = m.total();
  if (type === 'whisk' && isCream(m)) { m.whip = Math.min(1.5, m.whip + mv * 0.0003 / Math.sqrt(Math.max(1, t / 300))); m.mix = 1; if (m.whip > 1.05) hintOnce('overwhip', 'Careful, the cream is turning grainy. Stop whisking!'); else if (m.whip > 0.65) hintOnce('stiff', 'Stiff peaks. The cream is ready.'); return; }
  _handMix(m, mv, type);
};

/* ---------- recipes: add decorating steps and a Swiss roll ---------- */
const bakesOf = shape => items.filter(i => i.kind === 'bake' && (!shape || i.shape === shape));
const creamReady = () => items.some(i => i.m && isCream(i.m) && i.m.whip >= 0.65 && i.m.whip <= 1.05);
const servedStep = { t: 'Put it on a plate and ring the bell to serve.', c: () => !!scorecard };
const cooledOut = (pan, shape) => () => bakesOf(shape).length > 0 || items.some(i => i.kind === pan && i.bake && i.bake.b > 0.9 && i.temp < 45);
(function patchRecipes() {
  const sponge = RECIPES.find(r => r.id === 'sponge'), cookies = RECIPES.find(r => r.id === 'cookies'), bread = RECIPES.find(r => r.id === 'bread');
  sponge.steps = sponge.steps.slice(0, 6).concat([
    { t: 'Let it cool on the wire rack, then carry it to the decorating counter.', c: cooledOut('tin', 'round') },
    { t: 'Turn it out onto the turntable and saw it into two layers with the bread knife.', c: () => bakesOf('round').some(b => b.layers >= 2) },
    { t: 'Whip 200 g cream with 20 g icing sugar to stiff peaks.', c: creamReady },
    { t: 'Fill and frost with the offset spatula, spinning the turntable as you spread.', c: () => bakesOf('round').some(b => b.fills.length >= b.layers - 1 && covAvg(b) > 0.6) },
    { t: 'Top with sliced strawberries or piped cream.', c: () => bakesOf('round').some(b => b.decos.length >= 5) },
    servedStep]);
  cookies.steps = cookies.steps.slice(0, 7).concat([
    { t: 'Cool them on the wire rack.', c: cooledOut('tray', 'cookies') },
    { t: 'Tip them onto a plate at the decorating counter.', c: () => bakesOf('cookies').some(b => b.host && b.host.kind.startsWith('plate')) },
    servedStep]);
  bread.steps = bread.steps.slice(0, 6).concat([
    { t: 'Cool it, then turn it out onto the cutting board.', c: () => bakesOf('loaf').length > 0 },
    { t: 'Slice it with the bread knife.', c: () => bakesOf('loaf').some(b => b.sliced >= 3) },
    servedStep]);
  const roll = {
    id: 'roll', name: 'Strawberry Swiss Roll', product: 'sheet', pan: 'tray', temp: 200, time: 9,
    ing: { egg: 200, sugar: 100, flour: 100, bp: 3 },
    lines: ['4 eggs', '100 g caster sugar', '100 g plain flour', '3 g baking powder', '200 g cream', 'strawberries · icing sugar'],
    steps: [
      { t: 'Preheat the oven to 200 °C.', c: () => near(OV.set, 200, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 60 && m.whip > 0.6) },
      { t: 'Gently fold in the flour and baking powder.', c: () => anyMix(m => m.g.flour > 70 && m.g.egg > 100 && m.mix > 0.85) },
      { t: 'Pour the batter onto the baking tray.', c: () => items.some(i => i.kind === 'tray' && i.m.total() > 250) },
      { t: 'Bake for about 9 minutes.', c: () => items.some(i => i.kind === 'tray' && i.bake && i.bake.b > 0.9) },
      { t: 'Turn the sponge out onto the cutting board.', c: () => bakesOf('sheet').length > 0 },
      { t: 'Whip the cream to stiff peaks.', c: creamReady },
      { t: 'Spread the cream over the sponge.', c: () => bakesOf('sheet').some(b => covAvg(b) > 0.6) },
      { t: 'Grab one short end and roll it up.', c: () => bakesOf('sheet').some(b => b.rolled >= 1) },
      { t: 'Decorate with strawberries and a dusting of icing sugar.', c: () => bakesOf('sheet').some(b => b.decos.length >= 3 || b.dust > 0.3) },
      servedStep]
  };
  RECIPES.splice(1, 0, roll);
})();

/* ---------- textures ---------- */
const DT = {};
function makeDecoTex() {
  DT.strawSkin = canvTex(128, 128, (c) => { c.fillStyle = '#c4161c'; c.fillRect(0, 0, 128, 128); noiseFill(c, 128, 128, 800, '90,0,10', 0.3, 3); for (let i = 0; i < 70; i++) { c.fillStyle = '#e8c34a'; c.beginPath(); c.ellipse(Math.random() * 128, Math.random() * 128, 1.6, 1, Math.random() * 3, 0, TAU); c.fill(); } });
  DT.strawCut = canvTex(128, 128, (c) => { c.clearRect(0, 0, 128, 128); c.fillStyle = '#c3141d'; c.beginPath(); c.moveTo(64, 120); c.bezierCurveTo(4, 70, 10, 8, 64, 12); c.bezierCurveTo(118, 8, 124, 70, 64, 120); c.fill(); const g = c.createRadialGradient(64, 58, 4, 64, 64, 50); g.addColorStop(0, '#fff2f0'); g.addColorStop(0.5, '#f7a3a3'); g.addColorStop(1, 'rgba(220,40,50,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(64, 62, 40, 46, 0, 0, TAU); c.fill(); });
  DT.kiwiCut = canvTex(128, 128, (c) => { c.fillStyle = '#7a5a33'; c.beginPath(); c.arc(64, 64, 64, 0, TAU); c.fill(); const g = c.createRadialGradient(64, 64, 6, 64, 64, 60); g.addColorStop(0, '#f4f2c8'); g.addColorStop(0.25, '#d9e06a'); g.addColorStop(0.6, '#7db234'); g.addColorStop(1, '#5d9a24'); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 59, 0, TAU); c.fill(); c.fillStyle = '#1c1a12'; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, r = 22 + Math.random() * 5; c.beginPath(); c.ellipse(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 2.2, 1.2, a, 0, TAU); c.fill(); } c.strokeStyle = 'rgba(255,255,230,.5)'; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; c.beginPath(); c.moveTo(64 + Math.cos(a) * 14, 64 + Math.sin(a) * 14); c.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); c.stroke(); } });
  DT.kiwiSkin = canvTex(128, 128, (c) => { c.fillStyle = '#7b5b36'; c.fillRect(0, 0, 128, 128); noiseFill(c, 128, 128, 4000, '60,40,20', 0.4, 1.5); noiseFill(c, 128, 128, 1200, '180,150,110', 0.3, 1.5); });
  DT.board = canvTex(512, 256, (c, w, h) => { c.fillStyle = '#b98d5c'; c.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? 'rgba(120,80,40,.12)' : 'rgba(255,230,190,.1)'; c.fillRect(0, i * h / 14, w, h / 14); } c.globalAlpha = 0.2; for (let i = 0; i < 40; i++) { c.strokeStyle = '#6e4a26'; c.beginPath(); const y = Math.random() * h; c.moveTo(0, y); for (let x = 0; x <= w; x += 40) c.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); c.stroke(); } });
  DT.goldRim = canvTex(1024, 32, (c, w, h) => { c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9a24a'; c.fillRect(0, h - 7, w, 5); c.fillRect(0, 6, w, 1.5); });
  DT.floralRim = canvTex(1024, 64, (c, w, h) => { c.fillStyle = '#f9f8f4'; c.fillRect(0, 0, w, h); c.fillStyle = '#24508f'; c.fillRect(0, h - 6, w, 4); for (let i = 0; i < 24; i++) { const x = (i + 0.5) * w / 24; c.save(); c.translate(x, 30); for (let p = 0; p < 6; p++) { c.rotate(TAU / 6); c.beginPath(); c.ellipse(0, -8, 3.5, 8, 0, 0, TAU); c.fill(); } c.fillStyle = '#f9f8f4'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill(); c.fillStyle = '#24508f'; c.restore(); c.strokeStyle = '#24508f'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 14, 34); c.quadraticCurveTo(x + 21, 20, x + 28, 34); c.stroke(); c.beginPath(); c.ellipse(x + 21, 22, 3, 5, 0.6, 0, TAU); c.fill(); } });
  DT.floralCenter = canvTex(256, 256, (c) => { c.fillStyle = '#f9f8f4'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(36,80,143,.5)'; c.lineWidth = 2; c.beginPath(); c.arc(128, 128, 120, 0, TAU); c.stroke(); });
  DT.sage = canvTex(256, 256, (c) => { c.fillStyle = '#a9b8a0'; c.fillRect(0, 0, 256, 256); noiseFill(c, 256, 256, 1800, '70,60,50', 0.5, 1.8); noiseFill(c, 256, 256, 600, '255,255,240', 0.3, 1.5); const g = c.createRadialGradient(128, 128, 60, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(60,70,50,.25)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }, [1, 1]);
  DT.sageRim = canvTex(512, 32, (c, w, h) => { c.fillStyle = '#a9b8a0'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 900, '70,60,50', 0.5, 1.6); c.fillStyle = '#7d6b55'; c.fillRect(0, h - 5, w, 5); });
  DT.spiral = canvTex(128, 128, (c) => { c.fillStyle = '#e9c98f'; c.beginPath(); c.arc(64, 64, 64, 0, TAU); c.fill(); c.strokeStyle = '#fffaf0'; c.lineWidth = 7; c.beginPath(); for (let t = 0; t < 22; t += 0.1) { const r = 4 + t * 2.6; c.lineTo(64 + Math.cos(t) * r, 64 + Math.sin(t) * r); } c.stroke(); c.strokeStyle = '#a8662c'; c.lineWidth = 4; c.beginPath(); c.arc(64, 64, 62, 0, TAU); c.stroke(); });
}

/* ---------- decorating station geometry ---------- */
function buildDecor() {
  const g = new THREE.Group(); FIX.room.add(g);
  const len = DCTR.x1 - DCTR.x0, cx = (DCTR.x0 + DCTR.x1) / 2;
  g.add(box(len, 0.82, 0.57, MAT.cabinet, cx, 0.46, -0.015));
  g.add(box(len, 0.05, 0.55, MAT.cabinetDark, cx, 0.025, -0.03));
  for (let i = 0; i < 4; i++) { const x = DCTR.x0 + (i + 0.5) * len / 4; g.add(box(len / 4 - 0.008, 0.78, 0.02, MAT.cabinet, x, 0.46, 0.27)); g.add(box(0.2, 0.012, 0.02, MAT.brushed, x, 0.8, 0.29)); }
  const top = box(len + 0.02, 0.04, 0.6, new THREE.MeshPhysicalMaterial({ color: 0x2e2c2a, roughness: 0.25, clearcoat: 0.5, map: TX.quartz }), cx, CT - 0.02, 0); top.castShadow = false; g.add(top);
  const tiles = mesh(new THREE.PlaneGeometry(len, 0.46), MAT.tiles, cx, CT + 0.23, WALLZ + 0.002, false); g.add(tiles);
  // plate shelf
  g.add(box(DSHELF.x1 - DSHELF.x0, 0.026, 0.28, MAT.wood, (DSHELF.x0 + DSHELF.x1) / 2, DSHELF.y - 0.013, DSHELF.z));
  [DSHELF.x0 + 0.06, DSHELF.x1 - 0.06].forEach(x => g.add(box(0.012, 0.09, 0.2, MAT.plastic, x, DSHELF.y - 0.07, DSHELF.z - 0.02)));
  // tool rail
  g.add(rot(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.48, 16), MAT.steel, DX - 0.77, DRAIL.y, DRAIL.z), 'z', Math.PI / 2));
  // window
  const wx = DX + 0.82, wy = 1.65;
  const sky = mesh(new THREE.PlaneGeometry(0.46, 0.66), new THREE.MeshBasicMaterial({ color: 0xe8f1f6 }), wx, wy, WALLZ + 0.003, false); g.add(sky);
  [[0, 0.34, 0.52, 0.04], [0, -0.34, 0.52, 0.04], [-0.25, 0, 0.04, 0.72], [0.25, 0, 0.04, 0.72], [0, 0, 0.46, 0.02], [0, 0, 0.02, 0.66]].forEach(([x, y, w, h]) => g.add(box(w, h, 0.04, MAT.white, wx + x, wy + y, WALLZ + 0.02)));
  g.add(box(0.56, 0.03, 0.08, MAT.white, wx, wy - 0.37, WALLZ + 0.04));
  // plant on the sill
  const pot = mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0xc87a52, roughness: 0.8 }), wx + 0.15, wy - 0.325, WALLZ + 0.04); g.add(pot);
  for (let i = 0; i < 7; i++) { const lf = mesh(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: 0x5f8f4a, roughness: 0.7 }), wx + 0.15 + Math.cos(i) * 0.025, wy - 0.27 + (i % 3) * 0.015, WALLZ + 0.04 + Math.sin(i) * 0.02); lf.scale.set(0.6, 1.4, 0.4); lf.rotation.z = Math.cos(i * 2) * 0.6; g.add(lf); }
  const sunWin = new THREE.SpotLight(0xfff1dd, 4, 3.5, 0.6, 0.6, 1.2); sunWin.position.set(wx, wy + 0.2, 0.9); sunWin.target.position.set(wx - 0.5, CT, 0); g.add(sunWin, sunWin.target);
  // side wall closing the room
  const side = mesh(new THREE.PlaneGeometry(4, 4), MAT.wall, DCTR.x1 + 0.1, 2, 1.7, false); side.rotation.y = -Math.PI / 2; g.add(side);
  // service bell
  const bell = new THREE.Group(); bell.position.set(DX + 0.98, CT, 0.15); g.add(bell);
  bell.add(mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.012, 32), MAT.plastic, 0, 0.006, 0));
  const brass = new THREE.MeshStandardMaterial({ color: 0xd6a94a, metalness: 1, roughness: 0.18 });
  const dome = mesh(new THREE.SphereGeometry(0.033, 32, 16, 0, TAU, 0, Math.PI / 2), brass, 0, 0.012, 0); bell.add(dome);
  bell.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.016, 8), brass, 0, 0.05, 0)); bell.add(mesh(new THREE.SphereGeometry(0.006, 12, 8), brass, 0, 0.058, 0));
  FIX.bell = bell; tag(bell, 'bell');
  // recipe card holder on the wall
  const card = mesh(new THREE.PlaneGeometry(0.095, 0.13), new THREE.MeshStandardMaterial({ map: CARDS[1].tex, roughness: 0.85 }), DX - 0.77, 1.72, WALLZ + 0.01, false); card.userData.card = null; g.add(card); FIX.decorCard = card;
  g.add(box(0.02, 0.012, 0.015, MAT.steel, DX - 0.77, 1.79, WALLZ + 0.015));
}

/* ---------- item models for new kinds ---------- */
function strawberryMesh(s = 1) {
  const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(Math.max(0.0001, Math.sin(t * Math.PI * 0.92) * 0.017 * (0.55 + 0.45 * t) * s), t * 0.034 * s)); }
  const g = new THREE.Group(); g.add(mesh(new THREE.LatheGeometry(pts, 20), new THREE.MeshPhysicalMaterial({ map: DT.strawSkin, roughness: 0.3, clearcoat: 0.6 })));
  const cal = mesh(new THREE.ConeGeometry(0.014 * s, 0.006 * s, 7), new THREE.MeshStandardMaterial({ color: 0x3f7a2e, roughness: 0.7 }), 0, 0.035 * s, 0); g.add(cal); return g;
}
function sliceMesh(fruit) {
  const tex = fruit === 'kiwi' ? DT.kiwiCut : DT.strawCut, r = fruit === 'kiwi' ? 0.016 : 0.013;
  const side = new THREE.MeshStandardMaterial({ color: fruit === 'kiwi' ? 0x7a5a33 : 0xc3141d, roughness: 0.5 }), face = new THREE.MeshPhysicalMaterial({ map: tex, transparent: fruit !== 'kiwi', roughness: 0.25, clearcoat: 0.8 });
  const m = mesh(new THREE.CylinderGeometry(r, r, 0.004, 24), [side, face, face]); if (fruit !== 'kiwi') m.scale.set(1, 1, 1.2); return m;
}
const BLUE = new THREE.MeshPhysicalMaterial({ color: 0x2b3566, roughness: 0.55, sheen: 0.8, sheenColor: new THREE.Color(0x9aa6c8) });
const CREAMMAT = new THREE.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color(0xffffff) });
function rosetteMesh() { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const t = mesh(new THREE.TorusGeometry(0.008 - i * 0.002, 0.0035, 8, 18), CREAMMAT, 0, 0.003 + i * 0.0042, 0); t.rotation.x = Math.PI / 2; g.add(t); } g.add(mesh(new THREE.ConeGeometry(0.003, 0.006, 8), CREAMMAT, 0, 0.016, 0)); return g; }
const SPRINKLE_COLS = [0xf06292, 0xffd54f, 0x81c784, 0x64b5f6, 0xffffff, 0xba68c8];
function decoMesh(type) {
  if (type === 'strawberry') return sliceMesh('strawberry');
  if (type === 'kiwi') return sliceMesh('kiwi');
  if (type === 'strawberryWhole') return strawberryMesh(0.9);
  if (type === 'blueberry') return mesh(new THREE.SphereGeometry(0.0058, 14, 10), BLUE);
  if (type === 'chip') return mesh(new THREE.ConeGeometry(0.0032, 0.005, 8), new THREE.MeshStandardMaterial({ color: 0x2b170d, roughness: 0.4 }));
  if (type === 'sprinkle') { const m = mesh(new THREE.CapsuleGeometry(0.0011, 0.004, 3, 6), new THREE.MeshStandardMaterial({ color: SPRINKLE_COLS[Math.floor(Math.random() * SPRINKLE_COLS.length)], roughness: 0.4 }), 0, 0.001, 0, false); m.rotation.z = Math.PI / 2; return m; }
  if (type === 'rosette') return rosetteMesh();
  return new THREE.Group();
}
function plateMesh(kind) {
  const g = new THREE.Group(); const R = kind === 'plate3' ? 0.14 : 0.13;
  const prof = kind === 'plate3' ? [[0.09, 0.006], [0.12, 0.012], [0.14, 0.02]] : [[0.085, 0.005], [0.115, 0.01], [0.13, 0.018]];
  const rimPts = [new THREE.Vector2(prof[0][0], prof[0][1]), new THREE.Vector2(prof[1][0], prof[1][1]), new THREE.Vector2(prof[2][0], prof[2][1]), new THREE.Vector2(prof[2][0] - 0.003, prof[2][1] - 0.003), new THREE.Vector2(prof[0][0] * 0.95, 0.0)];
  const rimTex = kind === 'plate1' ? DT.goldRim : kind === 'plate2' ? DT.floralRim : DT.sageRim;
  const glaze = (map) => new THREE.MeshPhysicalMaterial({ map, roughness: kind === 'plate3' ? 0.35 : 0.08, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide });
  rimTex.wrapS = THREE.RepeatWrapping; g.add(mesh(new THREE.LatheGeometry(rimPts, 64), glaze(rimTex)));
  const centerTex = kind === 'plate1' ? null : kind === 'plate2' ? DT.floralCenter : DT.sage;
  const center = mesh(new THREE.CircleGeometry(prof[0][0], 48), centerTex ? glaze(centerTex) : new THREE.MeshPhysicalMaterial({ color: 0xfbfaf6, roughness: 0.08, clearcoat: 1 }), 0, prof[0][1], 0); center.rotation.x = -Math.PI / 2; g.add(center);
  g.add(mesh(new THREE.CylinderGeometry(prof[0][0] * 0.95, prof[0][0] * 0.8, 0.005, 40), glaze(centerTex || null), 0, 0.0025, 0));
  return g;
}
function buildNewModel(it) {
  const k = it.kind, g = new THREE.Group(); const add = m => { g.add(m); return m; }; it.parts = {};
  if (k === 'cream') {
    const lab = labelTex(256, 512, (c, w, h) => { c.fillStyle = '#fdfcf8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c99a3c'; c.fillRect(0, 210, w, 140); c.fillStyle = '#fff'; c.font = '700 54px Georgia, serif'; c.textAlign = 'center'; c.fillText('CREAM', w / 2, 290); c.font = '600 22px Inter, sans-serif'; c.fillText('whipping · 35% fat', w / 2, 330); c.fillStyle = '#9a7a34'; c.fillText('500 ml', w / 2, 420); });
    const mt = new THREE.MeshStandardMaterial({ map: lab, roughness: 0.5 });
    add(mesh(new THREE.BoxGeometry(0.07, 0.16, 0.07), [MAT.white, MAT.white, MAT.white, MAT.white, mt, mt], 0, 0.08, 0));
    const gable = mesh(new THREE.CylinderGeometry(0.0495, 0.0495, 0.07, 4, 1), MAT.white, 0, 0.18, 0); gable.rotation.z = Math.PI / 2; gable.scale.set(0.45, 1, 1); gable.rotation.x = Math.PI / 4; add(gable);
  } else if (k === 'icing' || k === 'sprinkles') {
    const r = SPEC[k].rad, h = SPEC[k].h;
    add(mesh(latheShell([[0, 0], [r, 0], [r, h * 0.85]], [[0, 0.004], [r - 0.003, 0.004], [r - 0.003, h * 0.84]]), MAT.glass));
    it.parts.fill = add(mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.004, 1, 24), k === 'icing' ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }) : new THREE.MeshStandardMaterial({ map: canvTex(64, 64, (c) => { for (let i = 0; i < 300; i++) { c.fillStyle = ['#f06292', '#ffd54f', '#81c784', '#64b5f6', '#fff', '#ba68c8'][i % 6]; c.fillRect(Math.random() * 64, Math.random() * 64, 4, 1.5); } }), roughness: 0.5 }), 0, 0, 0, false));
    const lid = mesh(new THREE.CylinderGeometry(r + 0.002, r + 0.002, h * 0.15, 24), k === 'icing' ? MAT.steel : new THREE.MeshStandardMaterial({ color: 0xe86a8f, roughness: 0.4 }), 0, h * 0.925, 0); add(lid);
    if (k === 'icing') for (let i = 0; i < 7; i++) add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.002, 6), MAT.plastic, Math.cos(i) * 0.015 * (i ? 1 : 0), h + 0.0005, Math.sin(i) * 0.015 * (i ? 1 : 0), false));
  } else if (k === 'chips2') {
    return buildItemModel_orig(Object.assign(it, { kind: 'chips' })) && (it.kind = 'chips2', it.model_tmp);
  } else if (k === 'straws' || k === 'blues') {
    add(box(0.13, 0.05, 0.1, new THREE.MeshPhysicalMaterial({ color: 0xe8f5ee, transmission: 0.7, roughness: 0.25, transparent: true, thickness: 0.002 }), 0, 0.025, 0));
    it.parts.fruit = [];
    for (let i = 0; i < (k === 'straws' ? 8 : 30); i++) {
      const m = k === 'straws' ? strawberryMesh() : mesh(new THREE.SphereGeometry(0.0058, 12, 8), BLUE);
      if (k === 'straws') { m.position.set(-0.045 + (i % 4) * 0.03, 0.028 + Math.floor(i / 4) * 0.012, -0.022 + Math.floor(i / 4) * 0.04); m.rotation.set(Math.PI / 2 * 0.8, (i * 1.7) % 3, 0); }
      else m.position.set(-0.05 + (i % 6) * 0.02, 0.03 + Math.floor(i / 18) * 0.01, -0.035 + Math.floor((i % 18) / 6) * 0.03);
      add(m); it.parts.fruit.push(m);
    }
  } else if (k === 'kiwis') {
    add(mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.02, 32), MAT.ceramic, 0, 0.01, 0));
    it.parts.fruit = []; for (let i = 0; i < 3; i++) { const m = mesh(new THREE.SphereGeometry(0.03, 20, 14), new THREE.MeshStandardMaterial({ map: DT.kiwiSkin, roughness: 0.95 }), -0.035 + i * 0.035, 0.035, i === 1 ? 0.02 : -0.01); m.scale.set(1.3, 0.85, 0.85); m.rotation.y = i; add(m); it.parts.fruit.push(m); }
  } else if (k === 'strawberry') { const s = strawberryMesh(); s.rotation.z = Math.PI / 2; s.position.set(0.017, 0.017, 0); add(s); }
  else if (k === 'kiwi') { const m = mesh(new THREE.SphereGeometry(0.03, 20, 14), new THREE.MeshStandardMaterial({ map: DT.kiwiSkin, roughness: 0.95 }), 0, 0.025, 0); m.scale.set(1.3, 0.85, 0.85); add(m); }
  else if (k === 'blueberries') { for (let i = 0; i < 6; i++) add(mesh(new THREE.SphereGeometry(0.0058, 12, 8), BLUE, Math.cos(i) * 0.01 * (i ? 1 : 0), 0.006 + (i ? 0 : 0.008), Math.sin(i) * 0.01 * (i ? 1 : 0))); }
  else if (k === 'slices' || k === 'slice') { it.parts.slices = new THREE.Group(); add(it.parts.slices); }
  else if (k === 'bowlD') {
    add(mesh(latheShell(PROF.bowlS.outer, PROF.bowlS.inner), MAT.glass));
    it.parts.disc = add(contentDisc());
    it.parts.body = add(mesh(new THREE.BufferGeometry(), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, transparent: true, opacity: 0.95 }), 0, 0, 0, false)); it.parts.body.visible = false;
    it.parts.dome = add(mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), MAT.dough.clone(), 0, 0, 0)); it.parts.dome.visible = false;
  } else if (k === 'offset') {
    add(mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.1, 16), MAT.wood, 0, 0.21, 0));
    add(box(0.006, 0.03, 0.002, MAT.steel, 0, 0.15, 0));
    const blade = box(0.024, 0.13, 0.0016, MAT.steel, 0, 0.065, 0.006); blade.rotation.x = 0.08; add(blade);
    it.parts.load = add(mesh(new THREE.SphereGeometry(0.012, 16, 10), CREAMMAT, 0, 0.012, 0.01)); it.parts.load.scale.set(1, 0.6, 0.5); it.parts.load.visible = false;
  } else if (k === 'knife') {
    add(mesh(new THREE.CylinderGeometry(0.01, 0.009, 0.11, 16), MAT.plastic, 0, 0.24, 0));
    const tex = canvTex(64, 512, (c, w, h) => { c.fillStyle = '#d7dbde'; c.fillRect(0, 0, w, h); c.fillStyle = '#9aa0a5'; for (let y = 0; y < h; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(10, y + 7); c.lineTo(0, y + 14); c.fill(); } });
    add(box(0.026, 0.19, 0.0016, new THREE.MeshStandardMaterial({ map: tex, metalness: 0.9, roughness: 0.25 }), 0.004, 0.095, 0));
  } else if (k === 'piping') {
    const bag = mesh(new THREE.CylinderGeometry(0.032, 0.005, 0.18, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.8, roughness: 0.3, transparent: true, side: THREE.DoubleSide, thickness: 0.001 }), 0, 0.105, 0); add(bag);
    add(mesh(new THREE.ConeGeometry(0.006, 0.016, 8), MAT.steel, 0, 0.008, 0)).rotation.x = Math.PI;
    it.parts.fill = add(mesh(new THREE.CylinderGeometry(0.028, 0.005, 1, 20), CREAMMAT, 0, 0.02, 0, false)); it.parts.fill.visible = false;
  } else if (k === 'whisk2') { const L = 0.27; add(mesh(new THREE.CylinderGeometry(0.011, 0.009, L * 0.4, 20), new THREE.MeshStandardMaterial({ color: 0x2e2e2e, roughness: 0.5 }), 0, L * 0.8, 0)); add(wireLoops(4, L * 0.6, 0.032, 0.0011, MAT.chrome, L * 0.6)); }
  else if (k.startsWith('plate')) add(plateMesh(k));
  else if (k === 'turntable') {
    add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.05, 32), new THREE.MeshPhysicalMaterial({ color: 0xf4f3f0, roughness: 0.3, clearcoat: 0.6 }), 0, 0.025, 0));
    add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 20), MAT.chrome, 0, 0.065, 0));
    const top = new THREE.Group(); top.position.y = 0.08; add(top); it.parts.top = top;
    top.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 64), new THREE.MeshPhysicalMaterial({ color: 0xfbfbf9, roughness: 0.2, clearcoat: 0.8 }), 0, 0.0, 0));
    for (let i = 1; i < 4; i++) { const r = mesh(new THREE.TorusGeometry(i * 0.035, 0.0006, 4, 64), new THREE.MeshBasicMaterial({ color: 0xcfcfcf }), 0, 0.0062, 0, false); r.rotation.x = Math.PI / 2; top.add(r); }
    top.add(box(0.01, 0.0015, 0.02, new THREE.MeshBasicMaterial({ color: 0xd06a5a }), 0.14, 0.0065, 0));
  } else if (k === 'board') {
    const b = box(0.36, 0.022, 0.24, new THREE.MeshStandardMaterial({ map: DT.board, roughness: 0.75 }), 0, 0.011, 0); add(b);
  }
  g.traverse(o => { if (o.isMesh) o.userData.item = it; });
  return g;
}
const buildItemModel_orig = buildItemModel;
buildItemModel = function (it) {
  if (it.kind === 'chips2') { it.kind = 'chips'; const m = buildItemModel_orig(it); it.kind = 'chips2'; m.traverse(o => { if (o.isMesh) o.userData.item = it; }); return m; }
  if (['cream', 'icing', 'sprinkles', 'straws', 'blues', 'kiwis', 'strawberry', 'kiwi', 'blueberries', 'slices', 'slice', 'bowlD', 'offset', 'knife', 'piping', 'whisk2', 'plate1', 'plate2', 'plate3', 'turntable', 'board'].includes(it.kind)) return buildNewModel(it);
  return buildItemModel_orig(it);
};

/* ---------- bake objects (turned out of their pans) ---------- */
const COVN = 24;
function bakeDims(b) {
  const bk = b.bake;
  if (b.shape === 'round') return { rx: 0.096, rz: 0.096, h: clamp(0.02 + b.m.vol() / 1900 * 0.035 * (1 + bk.rise * 1.35), 0.025, 0.08) };
  if (b.shape === 'loaf') return { rx: 0.115, rz: 0.048, h: clamp(0.05 + Math.min(1.9, b.m.proof) * 0.02 + bk.rise * 0.06, 0.05, 0.12) };
  if (b.shape === 'cookies') return { rx: 0.1, rz: 0.1, h: 0.02 };
  return { rx: 0.165, rz: 0.115, h: clamp(0.006 + b.m.vol() / (0.34 * 0.24 * 1e6) * (1 + bk.rise * 1.2), 0.008, 0.022) };
}
function mkBake(shape, pan, pos, host) {
  const b = { id: uid++, kind: 'bake', shape, m: shape === 'cookies' ? trayMix(pan) : pan.m, bake: Object.assign({}, pan.bake), balls: shape === 'cookies' ? pan.balls.slice() : null, p: pos.clone(), zone: host ? 'host' : 'counter', host: host || null, hostOff: V3(0, 0, 0), tilt: 0, temp: pan.temp, touched: touchN++, layers: 1, fills: [], covTop: new Float32Array(COVN * COVN), covSide: new Float32Array(48), decos: [], rolled: 0, rollDir: -1, sliced: 0, dust: 0, creamG: 0, creamWhipSum: 0, melt: false, saw: 0, parts: {}, home: { p: pos.clone(), zone: 'counter' } };
  const d = bakeDims(b); b.rad = Math.max(d.rx, d.rz); b.h = d.h; b.dims = d;
  b.root = new THREE.Group(); b.pivot = new THREE.Group(); b.pivot.position.y = b.h / 2; b.model = new THREE.Group(); b.model.position.y = -b.h / 2;
  b.pivot.add(b.model); b.root.add(b.pivot); scene.add(b.root);
  b.topTex = canvTex(128, 128, () => { }); b.sideTex = canvTex(256, 16, () => { });
  b.decoG = new THREE.Group(); b.model.add(b.decoG);
  rebuildBake(b); paintCov(b);
  items.push(b); return b;
}
function crumbCol(b) { return mixc(b.m.color(), [255, 238, 196], 0.25); }
function stdMat(col, map, rough = 0.85) { return new THREE.MeshStandardMaterial({ color: new THREE.Color(rgb(col)), map: map || null, roughness: rough }); }
function rebuildBake(b) {
  const g = b.model; for (let i = g.children.length - 1; i >= 0; i--) if (g.children[i] !== b.decoG) g.remove(g.children[i]);
  const bk = b.bake, crust = crustColor(bk.brown, b.m.color()), crumb = crumbCol(b), d = b.dims;
  const crustM = stdMat(crust, TX.speck, 0.8), crumbM = stdMat(crumb, TX.speck, 0.95);
  const frostM = (tex) => { const m = CREAMMAT.clone(); m.alphaMap = tex; m.transparent = true; m.depthWrite = false; return m; };
  const tag = m => { m.traverse(o => { if (o.isMesh) o.userData.item = b; }); g.add(m); return m; };
  if (b.shape === 'round') {
    const n = b.layers, gaps = n - 1, fillT = k => (b.fills[k] != null ? 0.0035 + 0.003 * Math.min(1, b.fills[k] / 25) : 0.0012);
    let y = 0; const lh = (d.h - 0.0012 * gaps) / n;
    for (let i = 0; i < n; i++) {
      tag(mesh(new THREE.CylinderGeometry(d.rx, d.rx * 0.99, lh, 48), [crustM, i === n - 1 ? crustM : crumbM, crumbM], 0, y + lh / 2, 0));
      y += lh;
      if (i < n - 1) { const t = fillT(i); if (b.fills[i] != null) tag(mesh(new THREE.CylinderGeometry(d.rx * 0.985, d.rx * 0.985, t, 48), CREAMMAT, 0, y + t / 2, 0)); y += t; }
    }
    b.topY = y;
    const side = mesh(new THREE.CylinderGeometry(d.rx + 0.004, d.rx + 0.004, y + 0.003, 48, 1, true), frostM(b.sideTex), 0, (y + 0.003) / 2, 0, false); tag(side);
    const top = mesh(new THREE.CircleGeometry(d.rx + 0.004, 48), frostM(b.topTex), 0, y + 0.003, 0, false); top.rotation.x = -Math.PI / 2; tag(top);
  } else if (b.shape === 'loaf') {
    tag(mesh(new THREE.BoxGeometry(d.rx * 2, d.h * 0.55, d.rz * 2), crustM, 0, d.h * 0.275, 0));
    const dome = mesh(new THREE.SphereGeometry(1, 32, 16, 0, TAU, 0, Math.PI / 2), crustM, 0, d.h * 0.55, 0); dome.scale.set(d.rx, d.h * 0.45, d.rz); tag(dome);
    for (let k = 1; k <= b.sliced; k++) { const x = d.rx - k * 0.022; if (x < -d.rx + 0.01) break; tag(box(0.0025, d.h * 0.98, d.rz * 2.02, crumbM, x, d.h * 0.49, 0)); }
    b.topY = d.h;
  } else if (b.shape === 'cookies') {
    const n = b.balls.length; b.balls.forEach((ball, i) => { const top = i >= 7, ring = i === 0 ? 0 : top ? 0.045 : 0.08, idx = top ? i - 7 : i - 1, cnt = top ? Math.max(1, Math.min(5, n - 7)) : 6; const a = idx / cnt * TAU + (top ? 0.5 : 0); const r = 0.0098 * Math.cbrt(ball.g) * 0.8, sp = 1 + Math.min(0.35, bk.spread * 0.45) * sstep(0, 0.55, bk.b); const m = mesh(new THREE.SphereGeometry(1, 24, 14), new THREE.MeshPhysicalMaterial({ map: cookieTex, roughness: 0.75, color: new THREE.Color(rgb(crustColor(bk.brown * 0.95, ball.m.color()))) }), Math.cos(a) * ring, 0.006 + (top ? 0.014 : 0), Math.sin(a) * ring); m.scale.set(r * sp, r * (0.7 - 0.5 * (sp - 1)), r * sp); tag(m); });
    b.topY = 0.02;
  } else {
    const L = 0.33, W = 0.23, T = d.h, Lr = b.rolled * L, rr = 0.008 + 0.034 * Math.sqrt(b.rolled);
    const rg = new THREE.Group(); rg.scale.x = b.rollDir < 0 ? 1 : -1; g.add(rg);
    const xs0 = -L / 2 + Lr;
    if (L / 2 - xs0 > 0.004) {
      const slab = mesh(new THREE.BoxGeometry(L / 2 - xs0, T, W), [crumbM, crumbM, crustM, crumbM, crumbM, crumbM], (xs0 + L / 2) / 2, T / 2, 0); rg.add(slab); slab.userData.item = b;
      const top = mesh(new THREE.PlaneGeometry(L / 2 - xs0, W), frostM(b.topTex), (xs0 + L / 2) / 2, T + 0.0015, 0, false); top.rotation.x = -Math.PI / 2; rg.add(top); top.userData.item = b;
    }
    if (b.rolled > 0.02) {
      const endM = new THREE.MeshStandardMaterial({ map: DT.spiral, roughness: 0.85 });
      const cyl = mesh(new THREE.CylinderGeometry(rr, rr, W, 40), [crustM, endM, endM], b.rolled >= 1 ? 0 : xs0 - rr * 0.6, rr, 0); cyl.rotation.x = Math.PI / 2; rg.add(cyl); cyl.userData.item = b;
    }
    b.topY = b.rolled >= 1 ? rr * 2 : T; b.rollR = rr;
  }
  b.builtSig = rebuildSig(b);
}
const rebuildSig = b => [b.layers, b.fills.map(f => Math.round(Math.min(f, 25))).join('.'), Math.round(b.rolled * 50), b.sliced, Math.round(b.bake.brown * 20)].join('|');
function paintCov(b) {
  repaint(b.topTex, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const cw = w / COVN; for (let i = 0; i < COVN; i++) for (let j = 0; j < COVN; j++) { const v = b.covTop[i * COVN + j]; if (v <= 0.02) continue; const a = Math.min(1, v); c.fillStyle = `rgb(${a * 255 | 0},${a * 255 | 0},${a * 255 | 0})`; c.beginPath(); c.arc((i + 0.5) * cw, (j + 0.5) * cw, cw * 0.95, 0, TAU); c.fill(); }
  });
  repaint(b.sideTex, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); const n = b.covSide.length, cw = w / n; for (let i = 0; i < n; i++) { const a = Math.min(1, b.covSide[i]); c.fillStyle = `rgb(${a * 255 | 0},${a * 255 | 0},${a * 255 | 0})`; c.fillRect(i * cw - 1, 0, cw + 2, h); } });
  b.covDirty = false;
}
function covAvg(b) {
  if (!b.covTop) return 0; const d = b.dims; let s = 0, n = 0;
  for (let i = 0; i < COVN; i++) for (let j = 0; j < COVN; j++) { const lx = ((i + 0.5) / COVN * 2 - 1), lz = ((j + 0.5) / COVN * 2 - 1); if (b.shape === 'round' && lx * lx + lz * lz > 0.9) continue; s += Math.min(1, b.covTop[i * COVN + j]); n++; }
  return n ? s / n : 0;
}
function sideAvg(b) { let s = 0; b.covSide.forEach(v => s += Math.min(1, v)); return s / b.covSide.length; }
function spinOf(b) { return b.host && b.host.kind === 'turntable' ? (b.host.spinA || 0) : 0; }
function toLocal(b, x, z) { const s = spinOf(b) + (b.yaw || 0), dx = x - b.p.x, dz = z - b.p.z; return { x: dx * Math.cos(s) - dz * Math.sin(s), z: dx * Math.sin(s) + dz * Math.cos(s) }; }
function inFoot(b, x, z, pad = 0) { const l = toLocal(b, x, viewT < 0.5 ? b.p.z + (z - b.p.z) * 0.15 : z), d = b.dims; if (b.shape === 'round' || b.shape === 'cookies') return Math.hypot(l.x, l.z) < d.rx + pad; if (b.shape === 'sheet' && b.rolled >= 1) return Math.abs(l.x) < b.rollR + pad && Math.abs(l.z) < d.rz + pad; return Math.abs(l.x) < d.rx + pad && Math.abs(l.z) < d.rz + pad; }
function topAt(b, lx) { if (b.shape === 'sheet' && b.rolled >= 1) { const r = b.rollR; return Math.abs(lx) < r ? r + Math.sqrt(r * r - lx * lx) : r; } return b.topY || b.h; }
function bakeUnder(x, y, z, above = 0.35, pad = 0) { let best = null; for (const b of bakesOf()) { if (b.zone === 'held') continue; if (inFoot(b, x, z, pad) && y > b.p.y + (b.topY || b.h) - 0.05 && y - (b.p.y + (b.topY || b.h)) < above) { if (!best || b.touched > best.touched) best = b; } } return best; }
function addDeco(b, type, wx, wz) {
  if (b.decos.length > 220) return;
  let l = toLocal(b, wx, viewT < 0.5 ? b.p.z + (wz - b.p.z) * 0.3 : wz); const d = b.dims;
  if (b.shape === 'round' || b.shape === 'cookies') { const r = Math.hypot(l.x, l.z), lim = d.rx * 0.9; if (r > lim) { l.x *= lim / r; l.z *= lim / r; } }
  else { l.x = clamp(l.x, -d.rx * 0.9, d.rx * 0.9); l.z = clamp(l.z, -d.rz * 0.85, d.rz * 0.85); }
  const m = decoMesh(type); const frost = b.shape === 'round' ? 0.003 * Math.min(1, b.covTop[cellOf(b, l.x, l.z)] || 0) + 0.002 : 0.001;
  const yy = topAt(b, l.x) + frost + (type === 'rosette' ? 0 : type === 'blueberry' ? 0.005 : 0.002);
  m.position.set(l.x, yy, l.z); m.rotation.y = Math.random() * TAU; if (type === 'strawberry' || type === 'kiwi') { m.rotation.x = (Math.random() - 0.5) * 0.3; }
  if (type === 'strawberryWhole') { m.rotation.z = Math.PI * 0.95; m.position.y += 0.03; }
  m.traverse(o => { if (o.isMesh) o.userData.item = b; });
  b.decoG.add(m); b.decos.push({ type, x: l.x, z: l.z });
}
function cellOf(b, lx, lz) { const d = b.dims; const i = clamp(Math.floor((lx / d.rx * 0.5 + 0.5) * COVN), 0, COVN - 1), j = clamp(Math.floor((lz / d.rz * 0.5 + 0.5) * COVN), 0, COVN - 1); return i * COVN + j; }

/* ---------- turning bakes out of their pans ---------- */
function hosts() { return items.filter(i => DEF[i.kind]?.host && i.zone !== 'held' && visible3(i)); }
function onAnyCounter(x) { return (x > CTR.x0 + 0.05 && x < 0.75) || (x > DCTR.x0 + 0.03 && x < DCTR.x1 - 0.03); }
function unmold(it, dt) {
  let tgt = null;
  let bestD = 1e9; for (const h of hosts()) { const dz = (it.p.z - h.p.z) * (viewT < 0.5 ? 0.15 : 1), dd = Math.hypot(it.p.x - h.p.x, dz), top = hostTop(h); if (dd < h.rad * 0.8 && dd < bestD && it.p.y > top - 0.02 && it.p.y - top < 0.4 && !bakesOf().some(b => b.host === h)) { tgt = { h }; bestD = dd; } }
  if (tgt && PT.speed < 500) it.pourHold = (it.pourHold || 0) + dt; else it.pourHold = Math.max(0, (it.pourHold || 0) - dt * 4);
  if (tgt && tgt.h) it.zTarget = tgt.h.p.z;
  if (!it.pdir) it.pdir = V3(1, 0, 0);
  const want = tgt && it.pourHold > 0.45 ? Math.PI * 0.85 : 0;
  it.tilt += clamp(want - it.tilt, -3.6 * dt, 2.4 * dt); applyTilt(it); it.stream = null;
  if (tgt && it.tilt > 2.3) { it.slideT = (it.slideT || 0) + dt; if (it.slideT > 0.3) { turnOut(it, tgt); it.slideT = 0; } } else it.slideT = 0;
}
function turnOut(pan, tgt) {
  const shape = pan.kind === 'tin' ? 'round' : pan.kind === 'loaf' ? (pan.bake.type === 'bread' ? 'loaf' : 'loaf') : (pan.balls && pan.balls.length ? 'cookies' : 'sheet');
  const pos = tgt.h ? V3(tgt.h.p.x, hostTop(tgt.h), tgt.h.p.z) : V3(pan.p.x, CT, clamp(pan.p.z, -0.2, 0.2));
  const b = mkBake(shape, pan, pos, tgt.h || null);
  if (pan.temp > 50) b.temp = pan.temp;
  pan.m = new Mix(); pan.bake = null; if (pan.balls) pan.balls = [];
  SFX.thunk(0.8); sNoise(0.15, 300, 1, 0.4, 'lowpass');
  say(shape === 'round' ? 'Cake turned out.' : shape === 'sheet' ? 'Sponge turned out. Spread it, then roll it.' : shape === 'cookies' ? 'Cookies tipped out.' : 'Loaf turned out.', 2.5);
}

/* ---------- decorating tools ---------- */
function decoTool(it, dt) {
  const d = DEF[it.kind]; it.dipY = null;
  const mv = Math.hypot(it.p.x - (it.lx ?? it.p.x), it.p.z - (it.lz ?? it.p.z), (it.p.y - (it.ly ?? it.p.y)) * 0.4);
  // reach the cream bowl
  const creamBowl = recv3().find(r => isCream(r.m) && inOpen(opening3(r), it.p.x, it.p.z, 0));
  if ((d.spread || d.pipe) && creamBowl) {
    const o = opening3(creamBowl); it.zTarget = creamBowl.p.z; it.dipY = Math.max(o.bot, o.surf - 0.008);
    const cap = d.pipe ? 160 : 30, has = it.m ? it.m.total() : 0;
    if (it.p.y < o.surf + 0.004 && has < cap - 2 && !it.lock) { const t = creamBowl.m.total(), g = Math.min(cap - has, t, d.pipe ? 160 : 30); it.m = it.m || new Mix(); it.m.merge(creamBowl.m.take(g / t)); it.lock = creamBowl.id; SFX.scrape(); }
    return;
  }
  if (it.lock && !creamBowl) it.lock = null;
  const tip = it.p;
  if (d.knife) {
    const pts = [0, 0.05, 0.1, 0.15].map(k => V3(tip.x + k, tip.y, tip.z));
    const b = bakesOf().find(b => b.zone !== 'held' && pts.some(p => inFoot(b, p.x, p.z, 0.01)));
    if (b) {
      it.zTarget = b.p.z; const top = b.p.y + (b.topY || b.h);
      it.dipY = b.shape === 'round' ? b.p.y + (b.topY || b.h) * (b.layers === 1 ? 0.5 : 0.66) : b.p.y + 0.004;
      if (it.p.y < top + 0.005) { b.saw += mv; if (Math.random() < mv * 8) sNoise(0.05, 1800, 3, 0.18);
        if (b.shape === 'round' && b.saw > 0.16 && b.layers < 3) { b.layers++; b.saw = 0; b.fills = b.fills.slice(0, b.layers - 1); SFX.scrape(); say(`Cut into ${b.layers} layers.`, 2); }
        if (b.shape === 'loaf' && b.saw > 0.07 && b.sliced < 9) { b.sliced++; b.saw = 0; SFX.scrape(); }
        if (b.shape === 'sheet' && b.rolled >= 1 && b.saw > 0.07) { b.saw = 0; }
      }
      return;
    }
    const fr = items.find(f => (f.kind === 'strawberry' || f.kind === 'kiwi') && f.zone !== 'held' && pts.some(p => Math.hypot(p.x - f.p.x, (p.z - f.p.z) * (viewT < 0.5 ? 0.15 : 1)) < f.rad + 0.01));
    if (fr) {
      it.zTarget = fr.p.z; it.dipY = fr.p.y + 0.005;
      if (it.p.y < fr.p.y + fr.h) { fr.saw = (fr.saw || 0) + mv; if (Math.random() < mv * 10) sNoise(0.04, 2400, 3, 0.2); if (fr.saw > 0.05) chopFruit(fr); }
    }
    return;
  }
  const b = bakeUnder(tip.x, tip.y + 0.02, tip.z, 0.3, d.spread ? 0.03 : 0);
  if (!b) { if (d.pipe) it.pipeT = 0; return; }
  it.zTarget = b.p.z;
  const l = toLocal(b, tip.x, viewT < 0.5 ? b.p.z + (tip.z - b.p.z) * 0.3 : tip.z), top = b.p.y + topAt(b, l.x);
  if (d.pipe) {
    it.dipY = top + 0.03;
    if (it.m && it.m.total() > 4 && PT.speed < 900) { it.pipeT = (it.pipeT || 0) + dt; if (it.pipeT > 0.32) { it.pipeT = 0; addDeco(b, 'rosette', tip.x, tip.z); recordCream(b, it.m, 6); it.m.take(6 / it.m.total()); sNoise(0.12, 600, 1, 0.15, 'lowpass'); } }
    return;
  }
  // spreading
  const load = it.m ? it.m.total() : 0;
  const lr = Math.hypot(l.x, l.z), d2 = b.dims, onSide = b.shape === 'round' && lr > d2.rx * 0.9;
  it.dipY = onSide ? Math.min(it.p.y, b.p.y + (b.topY || b.h) * 0.75) : top + 0.002;
  if (load < 0.2) { if (!b.hintSpread) { b.hintSpread = 1; hintOnce('load', 'Dip the offset spatula into whipped cream first.'); } return; }
  if (it.p.y > top + 0.012 && !onSide) return;
  const spinMv = b.host && b.host.kind === 'turntable' ? Math.abs(b.host.spinV || 0) * Math.max(lr, 0.02) * dt : 0;
  const eff = mv + spinMv; if (eff < 0.0004) return;
  const g = Math.min(load, eff * 110);
  recordCream(b, it.m, g); it.m.take(g / load);
  if (b.temp > 35 && !b.melt) { b.melt = true; say('The cream is melting on the warm cake!', 3); }
  if (b.shape === 'round' && b.layers > 1 && !(b.fills.length >= b.layers - 1 && b.fills.every(f => f >= 25)) && !onSide) {
    const k = b.fills.findIndex(f => f < 25); const idx = k >= 0 ? k : b.fills.length; if (b.fills[idx] == null) b.fills[idx] = 0;
    b.fills[idx] += g; if (b.fills[idx] >= 25 && idx < b.layers - 2) b.fills[idx + 1] = b.fills[idx + 1] || 0;
    if (b.fills.length >= b.layers - 1 && b.fills.every(f => f >= 25)) hintOnce('filled' + b.id, 'Layers filled. Now frost the top and sides.');
    else hintOnce('filling' + b.id, 'Spreading cream between the layers first.');
    return;
  }
  if (onSide) { const a = ((Math.atan2(l.x, l.z) % TAU) + TAU) % TAU, n = b.covSide.length, i0 = Math.floor(a / TAU * n); for (let k = -1; k <= 1; k++) { const i = (i0 + k + n) % n; b.covSide[i] += g * 0.25 * (k ? 0.5 : 1); } }
  else {
    const rad = 0.028;
    for (let i = 0; i < COVN; i++) for (let j = 0; j < COVN; j++) { const cx = ((i + 0.5) / COVN * 2 - 1) * d2.rx, cz = ((j + 0.5) / COVN * 2 - 1) * d2.rz, dd = Math.hypot(cx - l.x, cz - l.z); if (dd < rad) b.covTop[i * COVN + j] += g * 0.22 * (1 - dd / rad); }
    if (b.shape === 'round' && spinMv > 0) { const a = Math.atan2(l.z, l.x); for (let k = 0; k < 8; k++) { const aa = a + k * 0.35, x = Math.cos(aa) * lr, z = Math.sin(aa) * lr; const c = cellOf(b, x, z); b.covTop[c] += g * 0.03; } }
  }
  b.covDirty = true;
}
function recordCream(b, m, g) { b.creamG += g; b.creamWhipSum += g * (m.whip || 0); }
function chopFruit(fr) {
  const type = fr.kind; const host = fr.host, off = fr.hostOff ? fr.hostOff.clone() : null;
  const s = mk3('slices', fr.p.x, fr.p.y, fr.p.z, fr.zone, { fruit: type, count: type === 'kiwi' ? 6 : 4 });
  if (host) { s.host = host; s.hostOff = off; }
  remove3(fr); SFX.scrape(); say(type === 'kiwi' ? 'Kiwi sliced.' : 'Strawberry sliced.', 1.6);
}

/* ---------- wrappers: pouring, tools, grabbing, releasing ---------- */
const _pour3 = pour3;
pour3 = function (it, dt) {
  const d = DEF[it.kind];
  if (d.pan && it.bake && it.bake.b > 0.3) return unmold(it, dt);
  if (it.m && it.m.form() === 'cream') { it.tilt = Math.max(0, it.tilt - dt * 3); applyTilt(it); it.stream = null; return; }
  if (d.deco && d.src) {
    const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.4, it.rad);
    if (b) return decoPour(it, b, dt);
  }
  return _pour3(it, dt);
};
function decoPour(it, b, dt) {
  const d = DEF[it.kind];
  if (PT.speed < 500) it.pourHold = (it.pourHold || 0) + dt; else it.pourHold = Math.max(0, it.pourHold - dt * 4);
  it.zTarget = b.p.z; if (!it.pdir) it.pdir = V3(1, 0, 0);
  const want = it.pourHold > 0.12 ? d.pour.tilt : 0; it.tilt += clamp(want - it.tilt, -3.6 * dt, 1.4 * dt); applyTilt(it); it.stream = null;
  const start = 0.9 + 0.6 * (1 - clamp(it.stock / d.stock, 0, 1));
  if (it.tilt <= start || it.stock <= 0.05) return;
  const flow = d.pour.max * clamp((it.tilt - start) / (d.pour.tilt - start), 0, 1), amt = Math.min(it.stock, flow * dt); it.stock -= amt;
  const lip = lip3(it), type = ING[d.src].type, col = ING[d.src].c;
  const n = d.deco === 'dust' ? amt * 4 : amt / (d.deco === 'chip' ? 2 : 0.25);
  for (let i = 0; i < n + (Math.random() < n % 1 ? 1 : 0); i++) {
    const tx = b.p.x + (lip.x - b.p.x) * 0.3 + (Math.random() - 0.5) * 0.06, tz = b.p.z + (lip.z - b.p.z) * 0.3 + (Math.random() - 0.5) * 0.06;
    const p0 = lip.clone(); const T = Math.sqrt(Math.max(0.01, 2 * (lip.y - b.p.y - (b.topY || b.h)) / 9.8));
    parts.push({ type: type === 'powder' ? 'powder' : type, p: p0, v: V3((tx - lip.x) / T, 0, (tz - lip.z) / T), land: b.p.y + topAt(b, toLocal(b, tx, tz).x) + 0.002, col: d.deco === 'sprinkle' ? [[240, 98, 146], [255, 213, 79], [129, 199, 132], [100, 181, 246]][i % 4] : col, life: 2, bake: b, deco: d.deco });
  }
}
const _tool3 = tool3;
tool3 = function (it, dt) {
  const d = DEF[it.kind];
  if (d.spread || d.knife || d.pipe) { decoTool(it, dt); it.lx = it.p.x; it.ly = it.p.y; it.lz = it.p.z; return; }
  _tool3(it, dt);
};
const _grab3 = grab3;
grab3 = function (hit) {
  const it = hit.it, d = DEF[it.kind];
  if (it.kind === 'turntable') { drag = { type: 'spin', it }; return; }
  if (d.fixed) return;
  if (d.pick) {
    if ((it.count ?? 0) <= 0) { say('None left.'); return; }
    it.count--; const f = mk3(d.pick, hit.point.x, hit.point.y - 0.02, hit.point.z, 'held'); beginHold(f, hit.point); SFX.click(); autoWork(); return;
  }
  if (it.kind === 'slices') {
    if (it.count > 1) { it.count--; const s = mk3('slice', hit.point.x, hit.point.y - 0.01, hit.point.z, 'held', { fruit: it.fruit, count: 1 }); beginHold(s, hit.point); SFX.click(); return; }
    it.kind = 'slice';
  }
  if (it.kind === 'bake' && it.shape === 'sheet' && it.rolled < 1 && hot3(it)) {
    const l = toLocal(it, hit.point.x, hit.point.z);
    if (Math.abs(l.x) > it.dims.rx * 0.6 && it.rolled < 0.02) { rollDrag = { b: it, side: Math.sign(l.x) || -1, x0: hit.point.x }; it.rollDir = rollDrag.side; drag = { type: 'roll' }; return; }
  }
  if (it.host) { it.host = null; }
  _grab3(hit);
  autoWork();
};
function isIngredient(it) { const d = DEF[it.kind] || {}; return !!(d.src || d.fruit || it.kind === 'egg' || it.kind === 'butterPiece' || it.kind === 'slice'); }
function autoWork() { if (held && isIngredient(held.it) && view === 'counter') { prevView = 'counter'; view = 'work'; } }
const _beginHold = beginHold;
beginHold = function (it, point) { _beginHold(it, point); if (it.kind === 'knife' && held) held.off = V3(0.12, 0, 0); if (held) held.off0 = held.off.clone(); it.host = null; };
const _release3 = release3;
release3 = function () {
  const it = held.it, d = DEF[it.kind];
  if (d.fruit || it.kind === 'slice') {
    const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.4, 0.01);
    if (b) {
      held = null; it.tilt = 0;
      if (it.kind === 'slice') addDeco(b, it.fruit, it.p.x, it.p.z);
      else if (it.kind === 'strawberry') addDeco(b, 'strawberryWhole', it.p.x, it.p.z);
      else if (it.kind === 'blueberries') for (let i = 0; i < 6; i++) addDeco(b, 'blueberry', it.p.x + (Math.random() - 0.5) * 0.04, it.p.z + (Math.random() - 0.5) * 0.04);
      else if (it.kind === 'kiwi') { say('Slice the kiwi on the board first.', 2); settle3Wrap(it); return; }
      remove3(it); SFX.plop(); return;
    }
    if (it.kind === 'slice') { const pile = items.find(s => s.kind === 'slices' && s.fruit === it.fruit && Math.hypot(s.p.x - it.p.x, (s.p.z - it.p.z) * (viewT < 0.5 ? 0.15 : 1)) < 0.06); if (pile) { held = null; pile.count++; remove3(it); SFX.click(); return; } }
    const punnet = items.find(p => DEF[p.kind].pick === it.kind && Math.hypot(p.p.x - it.p.x, (p.p.z - it.p.z) * (viewT < 0.5 ? 0.15 : 1)) < 0.08 && it.p.y - p.p.y < 0.2);
    if (punnet) { held = null; punnet.count++; remove3(it); SFX.click(); return; }
  }
  _release3();
};
function settle3Wrap(it) { settle3(it); }
const _releaseTool3 = releaseTool3;
releaseTool3 = function (it) {
  const x = it.p.x, y = it.p.y;
  if (onDecor(x)) {
    let best = null, bd = 0.07; DRAIL.slots.forEach((sx, i) => { const occ = items.some(o => o !== it && o.pose === 'hangD' && o.slot === i); if (occ) return; const top = y + it.h; if (Math.abs(x - sx) < bd && Math.abs(top - DRAIL.y) < 0.15 && it.p.z < 0.1) { bd = Math.abs(x - sx); best = i; } });
    if (best !== null) { hangD(it, best); SFX.clink(); return; }
  }
  _releaseTool3(it);
  if (it.pose === 'lie' && onDecor(x)) { it.p.x = clamp(x + it.h / 2, DCTR.x0 + it.h + 0.02, DCTR.x1 - 0.03); it.p.y = CT + (it.kind === 'knife' ? 0.013 : it.rad * 0.4); }
};
function hangD(it, slot) { it.pose = 'hangD'; it.zone = 'rail'; it.slot = slot; it.p.set(DRAIL.slots[slot], DRAIL.y + 0.012 - it.h, DRAIL.z + 0.016); }
const _support3 = support3;
support3 = function (it) {
  const { x, y, z } = it.p; let best = _support3(it);
  if (onDecor(x)) {
    best = null;
    if (x > DCTR.x0 + 0.02 && x < DCTR.x1 - 0.02) best = { y: CT, zone: 'counter', z: clamp(z, CTR.z0 + it.rad * 0.5, CTR.z1 - it.rad * 0.3) };
    if (x > DSHELF.x0 + 0.03 && x < DSHELF.x1 - 0.03 && y >= DSHELF.y - 0.02) best = { y: DSHELF.y, zone: 'shelf', z: DSHELF.z };
  }
  if (it.kind !== 'turntable' && it.kind !== 'board') for (const h of hosts()) {
    if (h === it || h.host === it) continue; if (it.kind.startsWith('plate') && h.kind.startsWith('plate')) continue;
    const top = hostTop(h); if (Math.hypot(x - h.p.x, (z - h.p.z) * (viewT < 0.5 ? 0.15 : 1)) < h.rad * 0.9 && top <= y + 0.03 && (!best || top > best.y)) best = { y: top, zone: 'host', host: h, z: viewT < 0.5 ? h.p.z + (z - h.p.z) * 0.15 : z };
  }
  return best;
};
const _settle3 = settle3;
settle3 = function (it) { const s = support3(it); it.landHost = s && s.host; _settle3(it); };
const _land3 = land3;
land3 = function (it) {
  const host = it.landZone === 'host' ? it.landHost : null;
  _land3(it);
  if (host && items.includes(it)) { it.host = host; const s = host.kind === 'turntable' ? (host.spinA || 0) : 0, dx = it.p.x - host.p.x, dz = it.p.z - host.p.z; it.hostOff = V3(dx * Math.cos(s) - dz * Math.sin(s), 0, dx * Math.sin(s) + dz * Math.cos(s)); it.yaw = it.kind === 'bake' ? -(s) + (it.yaw || 0) : 0; if (it.kind === 'bake') it.yaw = 0; }
};
const _nudge3 = nudge3;
nudge3 = function (it) {
  if (it.zone === 'host' || DEF[it.kind]?.fixed) return;
  if (!onDecor(it.p.x)) return _nudge3(it);
  if (!['counter', 'shelf'].includes(it.zone) || DEF[it.kind].tool) return;
  const lo = it.zone === 'counter' ? DCTR.x0 : DSHELF.x0, hi = it.zone === 'counter' ? DCTR.x1 : DSHELF.x1;
  const others = items.filter(o => o !== it && o.zone === it.zone && onDecor(o.p.x) && Math.abs(o.p.y - it.p.y) < 0.02 && !DEF[o.kind].tool);
  for (let k = 0; k < 30; k++) { let moved = false; for (const o of others) { const dx = it.p.x - o.p.x, dz = it.p.z - o.p.z, dd = Math.hypot(dx, dz) || 0.001, need = (o.rad + it.rad) * 0.92; if (dd < need) { const push = (need - dd) * 0.6; it.p.x += dx / dd * push + (dd < 0.002 ? 0.01 : 0); if (it.zone === 'counter') it.p.z += dz / dd * push; moved = true; } } it.p.x = clamp(it.p.x, lo + it.rad, hi - it.rad); if (it.zone === 'counter') it.p.z = clamp(it.p.z, CTR.z0 + it.rad * 0.5, CTR.z1 - it.rad * 0.3); if (!moved) break; }
};
const _opening3 = opening3;
opening3 = function (r) {
  const o = _opening3(r);
  if (r.kind === 'tray' && r.m && r.m.total() > 0.5) o.surf = r.p.y + 0.004 + r.m.vol() / (0.34 * 0.24 * 1e6);
  if (r.kind === 'bowlD') { const p = PROF.bowlS, top = r.p.y + p.outer.at(-1)[1]; return { c: V3(r.p.x, top, r.p.z), r: radiusAt(p.inner, top - r.p.y) * 0.88, top, surf: r.p.y + heightFor(p.vol, r.m.vol()), bot: r.p.y + p.inner[0][1] + 0.006 }; }
  return o;
};
const _bakeStep = bakeStep;
bakeStep = function (it, dtMin) {
  if (it.kind === 'tray' && !it.bake && !(it.balls && it.balls.length) && it.m && it.m.total() > 20 && it.temp >= 60) {
    const f = it.m.form(); if (f === 'batter' || f === 'lumpy') { const R = RECIPES.find(r => r.product === 'sheet'); it.bake = { type: 'sheet', b: 0, brown: 0, rise: 0, spread: 0, ideal: R.temp, time: R.time, tsum: 0, ttime: 0 }; }
  }
  _bakeStep(it, dtMin);
  if (it.bake && it.bake.type === 'sheet') { const m = it.m; const bpF = clamp(((m.g.bp || 0) / (m.g.flour || 1)) / 0.03, 0, 1.6); it.bake.rise = clamp(0.12 + m.whip * 0.7 + Math.min(bpF, 1.2) * 0.25, 0.08, 1.2) * sstep(0.05, 0.65, it.bake.b); }
};

/* ---------- pickCtrl: appliances zoom in, bell serves ---------- */
const _pickCtrl = pickCtrl;
pickCtrl = function (c) {
  if (c === 'bell') { serve(); return; }
  if (c === 'scale') { if (view === 'scale') view = prevView === 'pov' ? 'pov' : prevView || 'counter'; else { prevView = view; view = 'scale'; } autoScale = 0; SFX.click(); return; }
  _pickCtrl(c);
  if (c === 'fridgeDoor') { if (FRG.tgt === 1) { if (!['fridge', 'oven', 'scale'].includes(view)) prevView = view; view = 'fridge'; } else if (view === 'fridge') view = ['pov', 'work'].includes(prevView) ? prevView : 'counter'; }
  if (c === 'ovenDoor') { if (OVN.tgt === 1) { if (!['fridge', 'oven', 'scale'].includes(view)) prevView = view; view = 'oven'; } else if (view === 'oven') view = ['pov', 'work'].includes(prevView) ? prevView : 'counter'; }
};
function goStation(s) {
  if (station === s) return; station = s; edgeDwell = 0;
  if (['fridge', 'oven', 'scale'].includes(view)) view = 'counter';
  povX = s === 'decor' ? DX : 0;
  if (s === 'decor') hintOnce('decor', 'The decorating counter. Turn bakes out onto the turntable, a plate or the board.');
  SFX.click();
}
setView = function (v) {
  if (view === v) return;
  autoScale = 0;
  view = v;
  if (v === 'pov') { const sx = station === 'decor' ? DX : 0; povX = clamp(held ? held.it.p.x : sx, sx - 0.95, sx + 1.0); hintOnce('pov', 'Leaning over the counter. Use the arrows to look left or right.'); }
};
const camCur = { pos: null, look: V3(0, 1.1, -0.1), fov: 44 };
updateCamera = function (dt) {
  viewT += clamp((view === 'pov' ? 1 : 0) - viewT, -dt * 1.6, dt * 1.6);
  const sx = station === 'decor' ? DX : 0;
  if (view === 'pov' && PT.has && !drag) { const ex = PT.x / uiW; if (ex < 0.1) povX -= dt * 0.8 * (1 - ex / 0.1); if (ex > 0.9) povX += dt * 0.8 * ((ex - 0.9) / 0.1); }
  povX = clamp(povX, sx - 0.95, sx + 1.0);
  const aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? (1.5 / aspect) : 1;
  let tp, tl, tf;
  if (view === 'pov') { tp = V3(povX, 1.62, 0.5); tl = V3(povX, 0.88, -0.06); tf = 60 * (aspect < 1 ? 1.25 : 1); }
  else if (view === 'fridge') { tp = V3(-0.95, 1.38, 0.3 + 1.0 * widen); tl = V3(-1.45, 1.0, -0.05); tf = 50; }
  else if (view === 'oven') { tp = V3(1.12, 1.35, 0.3 + 0.95 * widen); tl = V3(1.4, 1.08, 0); tf = 50; }
  else if (view === 'work') { tp = V3(sx, 1.72, 0.3 + 1.2 * widen); tl = V3(sx, 0.98, -0.12); tf = 54; }
  else if (view === 'scale') { tp = V3(SCL.x + 0.05, 1.2, 0.3 + 0.36 * widen); tl = V3(SCL.x, CT + 0.06, 0); tf = 40; }
  else { tp = V3(sx, 1.52, 0.3 + 2.75 * widen); tl = V3(sx, 1.1, -0.1); tf = 44; }
  const k = 1 - Math.exp(-dt * 4.2);
  if (!camCur.pos) camCur.pos = tp.clone();
  camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  // keep a held item still while the camera glides
  const moving = camCur.pos.distanceTo(tp) > 0.01 || camCur.look.distanceTo(tl) > 0.01;
  if (held && moving && PT.has) { setRay(PT.x, PT.y); const it = held.it; if (viewT > 0.5) { const hp = planeHit(V3(0, 1, 0), V3(0, it.p.y, 0)); if (hp) held.off.set(hp.x - it.p.x, 0, hp.z - it.p.z); } else { const hp = planeHit(V3(0, 0, 1), V3(0, 0, it.zTarget ?? held.cz)); if (hp) held.off.set(hp.x - it.p.x, hp.y - it.p.y, 0); } }
  if (held && !moving && held.off0) held.off.lerp(held.off0, 1 - Math.exp(-dt * 3));
  if (heldDough && moving && PT.has) { const tg = carryTarget(null, true); if (tg) { const c = heldDough.center(); heldDough.grab.target.copy(tg); } }
};


/* ---------- serving & judging ---------- */
function serve() {
  SFX.ding();
  const all = bakesOf().filter(b => b.zone !== 'held');
  if (!all.length) { say('Nothing to serve yet. Bake something, then plate it here.', 3.5); return; }
  const plated = all.filter(b => b.host && b.host.kind.startsWith('plate')).sort((a, b) => b.touched - a.touched);
  const b = plated[0] || all.sort((a, b2) => b2.touched - a.touched)[0];
  if (b.temp > 45) { say('It’s still warm. Let it cool before serving.', 3); return; }
  judge(b);
}
function decoEval(b) {
  const good = [], notes = []; let s = 0.5;
  const plated = b.host && b.host.kind.startsWith('plate');
  if (plated) { s += 0.15; good.push(`Served on the ${DEF[b.host.kind].name.toLowerCase()}.`); } else { s -= 0.2; notes.push('Served straight off the counter. A plate makes it.'); }
  const top = covAvg(b), side = sideAvg(b), n = b.decos.length, cw = b.creamG > 1 ? b.creamWhipSum / b.creamG : null;
  if (b.shape === 'round') {
    if (b.layers >= 2 && b.fills.length >= b.layers - 1 && b.fills.every(f => f >= 25)) { s += 0.12; good.push('Neatly layered and filled.'); } else if (b.layers >= 2) notes.push('The layers were cut but not filled.');
    if (top > 0.75 && side > 0.6) { s += 0.15; good.push('Smoothly frosted all round.'); } else if (top > 0.25) notes.push('The frosting is patchy. Spin the turntable as you spread.');
  }
  if (b.shape === 'sheet') { if (b.rolled >= 1) { s += 0.2; good.push('Rolled up tight.'); if (b.bake.brown > 1.35) { s -= 0.1; notes.push('The sponge was dry and cracked as it rolled.'); } } else notes.push('It never got rolled up.'); if (top < 0.45) notes.push('Not much cream in the filling.'); }
  if (b.shape === 'loaf' && b.sliced >= 3) { s += 0.15; good.push(`Sliced into ${b.sliced + 1} pieces.`); }
  if (b.shape === 'cookies') s += 0.1;
  if (cw != null) { if (cw > 1.05) { s -= 0.15; notes.push('The cream was over-whipped and grainy.'); } else if (cw < 0.6) { s -= 0.1; notes.push('The cream was too soft and slid off.'); } else good.push('Cream whipped to perfect peaks.'); }
  if (b.melt) { s -= 0.12; notes.push('The cream melted on the warm cake. Let it cool first.'); }
  if (n >= 6) { s += 0.12; good.push(`Pretty toppings (${n}).`); } else if (n === 0 && b.dust < 0.2 && ['round', 'sheet'].includes(b.shape)) notes.push('It could use some toppings.');
  if (b.dust > 0.3) good.push('A snowy dusting of icing sugar.');
  return { s: clamp(s, 0, 1), good, notes };
}
const _judgeBase = judge;
judge = function (it) {
  if (it.bake && it.bake.type === 'sheet') it.bake.type = 'sheet';
  _judgeBase(it);
  if (!scorecard) return;
  if (it.kind === 'bake') {
    if (it.bake.type === 'sheet') { const m = it.m; if (m.whip < 0.45) { scorecard.notes.unshift('The eggs weren’t whisked enough, so the sponge is dense.'); scorecard.stars = Math.max(0, scorecard.stars - 1); } }
    const d = decoEval(it);
    scorecard.stars = Math.round((scorecard.stars / 5 * 0.7 + d.s * 0.3) * 10) / 2;
    scorecard.good = [...d.good.slice(0, 2), ...scorecard.good].slice(0, 4);
    scorecard.notes = [...d.notes, ...scorecard.notes].slice(0, 4);
  }
};

/* ---------- per-frame wrappers ---------- */
const _tick3 = tick3;
tick3 = function (dt) {
  // rack no longer judges; it just cools
  items.forEach(i => { if (i.zone === 'rack' && i.bake) { judged.add(i.id); if (i.bake.b > 0.15 && i.temp < 45) hintOnce('cooled' + i.id, 'Cooled. Carry it to the decorating counter with the → arrow.'); } });
  // particles landing on a bake become toppings
  for (const p of parts) if (p.bake && p.life > 0 && p.p.y + p.v.y * dt - 4.9 * dt * dt <= p.land) {
    const b = p.bake; p.bake = null;
    if (!items.includes(b)) continue;
    if (p.deco === 'dust') { b.dust = Math.min(1.2, b.dust + 0.012); b.dustDirty = true; }
    else if (Math.random() < (p.deco === 'chip' ? 0.9 : 0.6)) addDeco(b, p.deco === 'chip' ? 'chip' : 'sprinkle', p.p.x, p.p.z);
  }
  _tick3(dt);
  // whipping cream in the stand mixer
  const bowl = mixBowl(); if (MX.speed && MX.attach === 'whisk' && bowl && isCream(bowl.m)) { bowl.m.whip = Math.min(1.5, bowl.m.whip + 0.013 * MX.speed * dt); if (bowl.m.whip > 1.05) hintOnce('overwhip', 'Careful, the cream is turning grainy. Stop the mixer!'); }
  // turntable
  for (const t of items) if (t.kind === 'turntable') { if (drag && drag.type === 'spin' && drag.it === t) t.spinV = lerp(t.spinV || 0, clamp(PT.vx * 0.012, -14, 14), 0.35); t.spinA = (t.spinA || 0) + (t.spinV || 0) * dt; t.spinV = (t.spinV || 0) * Math.exp(-dt * 0.35); if (Math.abs(t.spinV) > 0.5 && Math.random() < dt * 4) sNoise(0.08, 200, 1, 0.05, 'lowpass'); }
  // sheet rolling
  if (rollDrag && drag && drag.type === 'roll') {
    const b = rollDrag.b; setRay(PT.x, PT.y);
    const hp = viewT > 0.5 ? planeHit(V3(0, 1, 0), V3(0, b.p.y + 0.02, 0)) : planeHit(V3(0, 0, 1), V3(0, 0, b.p.z));
    if (hp) { const pr = clamp((hp.x - rollDrag.x0) * (-rollDrag.side) / 0.26, 0, 1); b.rolled = lerp(b.rolled, pr, 0.4); }
  }
  // station switching by walking to the edge
  if (false) {
    const ex = PT.x / uiW, sxMax = station === 'decor' ? DX + 1.0 : 1.0, sxMin = station === 'decor' ? DX - 0.95 : -0.95;
    const right = station === 'bake' && ex > 0.975 && (view === 'counter' || povX >= sxMax - 0.01), left = station === 'decor' && ex < 0.025 && (view === 'counter' || povX <= sxMin + 0.01);
    if (right || left) { edgeDwell += dt; if (edgeDwell > 0.5) goStation(right ? 'decor' : 'bake'); } else edgeDwell = 0;
  } else edgeDwell = 0;
  // zoom onto the scale while pouring into something that sits on it
  const tgtOnScale = held && (held.it.flow > 0 || (DEF[held.it.kind].spoon && held.it.inside)) && amountTarget() && amountTarget().on && amountTarget().on.zone === 'scale';
  if (tgtOnScale && !['scale', 'fridge', 'oven', 'pov'].includes(view)) { prevView = view; view = 'scale'; autoScale = 1; scaleIdle = 0; }
  if (autoScale && view === 'scale') { scaleIdle = tgtOnScale ? 0 : scaleIdle + dt; if (scaleIdle > 1.4 || !held) { view = prevView || 'work'; autoScale = 0; } }
  // the wall card at the decorating counter mirrors the pinned recipe
  if (FIX.decorCard) { FIX.decorCard.visible = !!recipe; FIX.decorCard.userData.card = recipe ? 99 : null; }
};
const _onUp3 = onUp3;
onUp3 = function () {
  if (rollDrag) { const b = rollDrag.b; if (b.rolled > 0.8) { b.rolled = 1; SFX.plop(); say('Rolled up!', 2); } else b.rolled = 0; rollDrag = null; }
  _onUp3();
};
const _syncItem = syncItem;
syncItem = function (it) {
  if (it.host && it.zone !== 'held') {
    const h = it.host; if (!items.includes(h)) it.host = null;
    else { const s = h.kind === 'turntable' ? (h.spinA || 0) : 0, o = it.hostOff || V3(0, 0, 0); it.p.set(h.p.x + o.x * Math.cos(s) + o.z * Math.sin(s), hostTop(h), h.p.z - o.x * Math.sin(s) + o.z * Math.cos(s)); }
  }
  _syncItem(it);
  const P = it.parts || {};
  if (it.kind === 'bake') {
    it.root.rotation.y = spinOf(it) + (it.yaw || 0);
    if (rebuildSig(it) !== it.builtSig) rebuildBake(it);
    if (it.covDirty) paintCov(it);
    if (it.dustDirty) { it.dustDirty = false; it.model.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material !== CREAMMAT && !o.material.alphaMap && o.userData.item === it && o.parent !== it.decoG) { if (!o.userData.baseCol) o.userData.baseCol = o.material.color.clone(); o.material.color.copy(o.userData.baseCol).lerp(new THREE.Color(0xffffff), Math.min(0.8, it.dust * 0.7)); } }); }
  }
  if (it.kind === 'turntable' && P.top) P.top.rotation.y = it.spinA || 0;
  if ((it.kind === 'straws' || it.kind === 'blues' || it.kind === 'kiwis') && P.fruit) P.fruit.forEach((f, i) => f.visible = i < (it.kind === 'blues' ? Math.ceil(it.count / 6 * 5) : it.count));
  if ((it.kind === 'slices' || it.kind === 'slice') && P.slices) {
    const n = it.kind === 'slice' ? 1 : it.count; while (P.slices.children.length < n) { const m = sliceMesh(it.fruit); m.userData.item = it; P.slices.add(m); } while (P.slices.children.length > n) P.slices.remove(P.slices.children.at(-1));
    P.slices.children.forEach((m, i) => { m.position.set(-0.03 + i * 0.012, 0.003 + i * 0.0006, (i % 2) * 0.004); m.rotation.z = 0.12; m.traverse(o => o.userData.item = it); });
  }
  if (it.kind === 'offset' && P.load) { const has = it.m && it.m.total() > 0.3; P.load.visible = has; if (has) { const s = Math.cbrt(it.m.total() / 30); P.load.scale.set(s, 0.6 * s, 0.5 * s); } }
  if (it.kind === 'piping' && P.fill) { const v = it.m ? it.m.total() : 0; P.fill.visible = v > 1; const hh = 0.16 * Math.min(1, v / 160) + 0.01; P.fill.scale.y = hh; P.fill.position.y = 0.012 + hh / 2; }
  if (it.kind === 'knife') { if (it.pose === 'held' || it.pose === 'lie') { it.root.rotation.set(0, 0, -Math.PI / 2); } }
  if (it.kind === 'tray') {
    if (!P.batter) { P.batter = mesh(new THREE.BoxGeometry(0.345, 1, 0.245), new THREE.MeshStandardMaterial({ map: TX.speck, roughness: 0.6 }), 0, 0, 0); P.batter.userData.item = it; it.model.add(P.batter); }
    const show = it.m && it.m.total() > 0.5 && !it.balls.length; P.batter.visible = show;
    if (show) { const bk = it.bake, hh = Math.max(0.001, it.m.vol() / (0.34 * 0.24 * 1e6) * (1 + (bk ? bk.rise * 1.2 : 0))); P.batter.scale.y = hh; P.batter.position.y = 0.004 + hh / 2; P.batter.material.color = new THREE.Color(rgb(bk && bk.brown > 0.02 ? crustColor(bk.brown, it.m.color()) : it.m.color())); }
  }
  if (P.dome && it.m && isCream(it.m) && it.m.whip > 0.45 && PROF[it.kind === 'bowlD' ? 'bowlS' : it.kind]) {
    const pr = PROF[it.kind === 'bowlD' ? 'bowlS' : it.kind], surfL = heightFor(pr.vol, it.m.vol()), r = radiusAt(pr.inner, surfL) * 0.85;
    P.dome.visible = true; P.dome.position.y = surfL; P.dome.scale.set(r, r * (0.12 + 0.35 * Math.min(1, it.m.whip)), r);
    P.dome.material.color = new THREE.Color(it.m.whip > 1.05 ? 0xf6efd6 : 0xfffcf4); P.dome.material.map = null; P.dome.material.roughness = it.m.whip > 1.05 ? 0.9 : 0.45; P.dome.material.needsUpdate = true;
  }
  if (it.kind === 'bowlD' && P.disc && it.m) {
    const m = it.m, show = m.total() > 0.5; P.disc.visible = show;
    if (show) { const sl = heightFor(PROF.bowlS.vol, m.vol()), r = radiusAt(PROF.bowlS.inner, sl) * 0.985; P.disc.position.y = sl + 0.0008; P.disc.scale.set(r, r, 1); const sig = sigOf(m); if (P.disc.userData.sig !== sig) { P.disc.userData.sig = sig; repaint(P.disc.userData.tex, () => drawSurface(m, 128, 128, 126, 126)); } }
  }
  if (it.pose === 'hangD') it.root.rotation.set(0, 0, 0);
};
const _hover3 = hover3;
hover3 = function () {
  if (held || heldDough || drag || scorecard || !PT.has) return _hover3();
  if (edgeHover()) return station === 'bake' ? 'Walk to the decorating counter' : 'Walk back to the baking counter';
  const h = pick3(PT.x, PT.y);
  if (h && h.ctrl === 'bell') return 'Service bell · ring to serve your plated bake';
  if (h && h.ctrl === 'scale') return view === 'scale' ? 'Kitchen scale · click to step back' : 'Kitchen scale · click to look closer';
  if (h && h.it) {
    const it = h.it, d = DEF[it.kind];
    if (it.kind === 'bake') { const names = { round: 'Sponge cake', sheet: it.rolled >= 1 ? 'Swiss roll' : 'Sponge sheet', loaf: it.bake.type === 'bread' ? 'Loaf' : 'Loaf cake', cookies: 'Cookies' }; let s = names[it.shape]; if (it.shape === 'round' && it.layers > 1) s += ` · ${it.layers} layers`; const c = covAvg(it); if (c > 0.05) s += ` · frosted ${Math.round(c * 100)}%`; if (it.decos.length) s += ` · ${it.decos.length} toppings`; if (it.shape === 'loaf' && it.sliced) s += ` · ${it.sliced + 1} slices`; if (it.temp > 35) s += ' · warm'; if (it.shape === 'sheet' && it.rolled < 1) s += ' · grab an end to roll'; return s; }
    if (it.kind === 'turntable') return 'Cake turntable · drag sideways to spin';
    if (d.pick) return `${d.name} · ${it.count} left`;
    if (it.kind === 'slices') return `Sliced ${it.fruit === 'kiwi' ? 'kiwi' : 'strawberries'} · ${it.count}`;
    if (d.spread && it.m && it.m.total() > 0.3) return `${d.name} · loaded with cream`;
    if (d.pipe) return `${d.name} · ${it.m && it.m.total() > 1 ? Math.round(it.m.total()) + ' g cream' : 'empty'}`;
    if (it.kind === 'board') return 'Cutting board';
  }
  return _hover3();
};
const _hint3 = hint3;
hint3 = function () {
  if (held) {
    const it = held.it, d = DEF[it.kind];
    if (d.spread) return it.m && it.m.total() > 0.3 ? 'Spread over the cake; spin the turntable as you go.' : 'Dip into whipped cream to load the spatula.';
    if (d.pipe) return it.m && it.m.total() > 4 ? 'Hold still over the cake to pipe rosettes.' : 'Dip into whipped cream to fill the bag.';
    if (d.knife) return 'Saw across a cake to split it into layers, a loaf to slice it, or fruit on the board.';
    if (d.fruit || it.kind === 'slice') return 'Drop it onto the cake, or on the board to slice it.';
    if (d.deco) return 'Hold it over the cake to sprinkle.';
    if (d.pan && it.bake && it.bake.b > 0.3) return 'Hold it still over the turntable, a plate or the board to turn it out.';
    if (it.kind.startsWith('plate')) return 'Set the plate down, then lift the bake onto it.';
  }
  if (drag && drag.type === 'spin') return 'Spinning the turntable…';
  if (drag && drag.type === 'roll') return 'Roll it up…';
  return _hint3();
};
function edgeHover() { return null; if (!PT.has || ['fridge', 'oven', 'scale'].includes(view)) return null; const ex = PT.x / uiW, ey = PT.y / uiH; if (station === 'bake' && ex > 0.93 && ey > 0.3 && ey < 0.7) return 'right'; if (station === 'decor' && ex < 0.07 && ey > 0.3 && ey < 0.7) return 'left'; return null; }
const _drawUI3 = drawUI3;
drawUI3 = function () {
  _drawUI3();
  ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0);
  const side = edgeHover(); const showAny = !scorecard;
  if (showAny) {
    const drawChev = (right, strong) => { const x = right ? uiW - 34 : 34, y = uiH / 2; ctx.globalAlpha = strong ? 0.95 : 0.45; ctx.fillStyle = 'rgba(255,253,249,.85)'; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a433c'; ctx.lineWidth = 2.2; ctx.beginPath(); const d = right ? 1 : -1; ctx.moveTo(x - 5 * d, y - 9); ctx.lineTo(x + 5 * d, y); ctx.lineTo(x - 5 * d, y + 9); ctx.stroke(); if (edgeDwell > 0) { ctx.strokeStyle = '#c4412c'; ctx.beginPath(); ctx.arc(x, y, 25, -Math.PI / 2, -Math.PI / 2 + TAU * (edgeDwell / 0.5)); ctx.stroke(); } ctx.globalAlpha = 1; };

    drawAmountBar();
  }
  ctx = UI.getContext('2d');
};
const _onDown3 = onDown3;
onDown3 = function () {
  if (!scorecard && edgeHover() && ((station === 'bake' && PT.x > uiW - 60) || (station === 'decor' && PT.x < 60)) && Math.abs(PT.y - uiH / 2) < 30) { goStation(station === 'bake' ? 'decor' : 'bake'); return; }
  _onDown3();
};
drawScore3 = function () {
  const s = scorecard, a = sstep(0, 0.5, s.t);
  ctx.fillStyle = `rgba(40,34,28,${0.35 * a})`; ctx.fillRect(0, 0, uiW, uiH);
  const w = 580, h = 580, k = Math.min(1, (uiH - 30) / h, (uiW - 30) / w);
  ctx.save(); ctx.translate(uiW / 2, lerp(-400, uiH / 2, sstep(0, 0.6, s.t))); ctx.scale(k, k); ctx.rotate(-0.012);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
  ctx.fillStyle = lg(0, -h / 2, 0, h / 2, [[0, '#fffdf8'], [1, '#f4efe4']]); ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(230,200,120,.6)'; ctx.save(); ctx.rotate(0.04); ctx.fillRect(-50, -h / 2 - 12, 100, 26); ctx.restore();
  ctx.fillStyle = '#2d3a4f'; ctx.textAlign = 'center'; ctx.font = '700 40px Caveat, cursive'; ctx.fillText(s.R.name, 0, -h / 2 + 54);
  if (s.snap) ctx.drawImage(s.snap, -150, -h / 2 + 68, 300, 169); else { ctx.save(); ctx.translate(0, -h / 2 + 150); ctx.scale(2.4, 2.4); drawCardIcon(s.R.product); ctx.restore(); }
  for (let i = 0; i < 5; i++) { const x = -88 + i * 44, y = -h / 2 + 266, f = clamp(s.stars - i, 0, 1); star(x, y, 17, '#e3dccd'); if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 20, 40 * f, 40); ctx.clip(); star(x, y, 17, '#e0a43a'); ctx.restore(); } }
  ctx.font = '500 23px Caveat, cursive'; ctx.textAlign = 'left'; let y = -h / 2 + 314;
  s.good.forEach(g => { ctx.fillStyle = '#4c7a4a'; wrapText('+ ' + g, 0, 0, w - 80).forEach((l, i) => { ctx.fillText(l, -w / 2 + 40 + (i ? 14 : 0), y); y += 25; }); });
  s.notes.forEach(n => { ctx.fillStyle = '#9a4434'; wrapText('– ' + n, 0, 0, w - 80).forEach((l, i) => { ctx.fillText(l, -w / 2 + 40 + (i ? 14 : 0), y); y += 25; }); });
  ctx.font = '500 13px Inter, system-ui, sans-serif'; ctx.fillStyle = '#8a7f72'; ctx.textAlign = 'center'; ctx.fillText('Click the card to tidy the kitchen and bake again', 0, h / 2 - 16);
  ctx.restore();
};
const _snapBake = snapBake;
snapBake = function (it) {
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 5); const host = it.host; const c = it.p.clone().add(V3(0, (it.topY || it.h) * 0.5, 0));
  cam.position.copy(c).add(V3(0, 0.22, host ? 0.5 : 0.42)); cam.lookAt(c);
  const rt = new THREE.WebGLRenderTarget(600, 338, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
  const px = new Uint8Array(600 * 338 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 600, 338, px);
  const cnv = document.createElement('canvas'); cnv.width = 600; cnv.height = 338; const g = cnv.getContext('2d'); const id = g.createImageData(600, 338);
  for (let yy = 0; yy < 338; yy++) id.data.set(px.subarray((337 - yy) * 600 * 4, (338 - yy) * 600 * 4), yy * 600 * 4);
  g.putImageData(id, 0, 0); rt.dispose(); return cnv;
};
const _build3 = build3;
build3 = function () {
  rollDrag = null; station = 'bake'; view = 'counter'; edgeDwell = 0; autoScale = 0;
  _build3();
  const z = (v) => v;
  mk3('turntable', DX - 0.6, CT, 0.03, 'counter'); mk3('board', DX + 0.13, CT, 0.05, 'counter');
  mk3('bowlD', DX - 0.25, CT, 0.12, 'counter'); mk3('cream', DX - 0.28, CT, -0.17, 'counter');
  mk3('straws', DX + 0.47, CT, -0.15, 'counter', { count: 8 }); mk3('kiwis', DX + 0.5, CT, 0.12, 'counter', { count: 3 }); mk3('blues', DX + 0.64, CT, -0.15, 'counter', { count: 30 });
  mk3('sprinkles', DX + 0.78, CT, -0.18, 'counter'); mk3('icing', DX + 0.87, CT, -0.18, 'counter'); mk3('chips2', DX + 0.7, CT, 0.12, 'counter');
  mk3('plate1', DX - 0.26, DSHELF.y, DSHELF.z, 'shelf'); mk3('plate2', DX + 0.03, DSHELF.y, DSHELF.z, 'shelf'); mk3('plate3', DX + 0.33, DSHELF.y, DSHELF.z, 'shelf');
  ['offset', 'knife', 'piping', 'whisk2'].forEach((k, i) => { const it = mk3(k, 0, 0, 0, 'rail'); hangD(it, i); });
  items.filter(i => i.kind === 'piping').forEach(i => i.m = new Mix());
};
let autoScale = 0, scaleIdle = 0;

/* ---------- boot additions ---------- */
makeDecoTex();
// a fourth recipe card on the ledge
(function () {
  const t = canvTex(380, 520, () => { });
  const m = mesh(new THREE.PlaneGeometry(0.095, 0.13), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }), 0, LEDGE.y + 0.065, LEDGE.z, false); m.rotation.x = -0.12; m.userData.card = 3; scene.add(m); CARDS.push({ mesh: m, tex: t });
  const xs = [0.64, 0.76, 0.88, 1.0], rz = [-0.05, 0.02, -0.02, 0.06]; CARDS.forEach((c, i) => { c.mesh.position.x = xs[i]; c.mesh.rotation.z = rz[i]; });
})();
buildDecor();
build3();

/* ---------- amount hint bar ---------- */
const EXTRA_TARGET = { cream: 200, icing: 20 };
function needOf(k) { if (recipe && recipe.ing[k] != null) return recipe.ing[k]; if (recipe && EXTRA_TARGET[k] != null) return EXTRA_TARGET[k]; return null; }
function amountTarget() {
  if (!held) return null;
  const it = held.it, d = DEF[it.kind];
  let k = null, extra = 0, on = null;
  if (d.src) k = d.src;
  else if (it.kind === 'egg') { k = 'egg'; extra = 50; }
  else if (it.kind === 'butterPiece') { k = 'butter'; extra = it.g; }
  else if (d.spoon) { const ks = it.m.kinds(); if (ks.length) { k = ks.sort((a, b) => it.m.g[b] - it.m.g[a])[0]; extra = it.m.g[k]; } else { const s = items.find(s => DEF[s.kind].spoonable && DEF[s.kind].src && s.zone !== 'held' && visible3(s) && spoonOver(it, s)); if (s) k = DEF[s.kind].src; } on = it.inside && it.inside.m ? it.inside : null; }
  if (!k) return null;
  const need = needOf(k); if (need == null) return null;
  if (!on && d.src) { const t = findPour3(it); on = t && t.r ? t.r : null; }
  if (!on && !d.spoon) on = recvUnder(it.p.x, it.p.y, it.p.z, 0.4, it, 0.04);
  const have = on && on.m ? (on.m.g[k] || 0) : 0;
  return { k, need, have, extra, on };
}
function drawAmountBar() {
  if (scorecard) return;
  const a = amountTarget(); if (!a) return;
  const isEgg = a.k === 'egg', cur = a.have, after = a.have + (a.extra || 0), need = a.need;
  const w = 210, h = 10, x = clamp(PT.x - w / 2, 12, uiW - w - 12), y = clamp(PT.y - 74, 12, uiH - 60);
  ctx.save();
  ctx.fillStyle = 'rgba(255,253,249,.93)'; rr(x - 10, y - 24, w + 20, 46, 10); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.stroke();
  const scale = w / (need * 1.3), ratio = cur / need;
  const col = Math.abs(ratio - 1) <= 0.06 ? '#4c8a4a' : ratio > 1.1 ? '#c4412c' : '#d39a2c';
  ctx.fillStyle = '#e8e2d8'; rr(x, y, w, h, 5); ctx.fill();
  ctx.fillStyle = col; rr(x, y, Math.min(w, cur * scale), h, 5); ctx.fill();
  if (a.extra && after > cur) { ctx.fillStyle = 'rgba(120,110,95,.35)'; ctx.fillRect(x + Math.min(w, cur * scale), y, Math.max(0, Math.min(w, after * scale) - Math.min(w, cur * scale)), h); }
  const tx = x + need * scale; ctx.fillStyle = 'rgba(76,138,74,.22)'; ctx.fillRect(tx - need * 0.06 * scale, y - 3, need * 0.12 * scale, h + 6);
  ctx.strokeStyle = '#2f5a2d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, y - 4); ctx.lineTo(tx, y + h + 4); ctx.stroke();
  ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#3b3631';
  const name = ING[a.k].n[0].toUpperCase() + ING[a.k].n.slice(1);
  const txt = isEgg ? `${name}s · ${Math.round(cur / 50)} of ${Math.round(need / 50)}` : `${name} · ${Math.round(cur)} of ${need} g`;
  ctx.fillText(txt, x, y - 8);
  ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.fillText(!a.on ? 'hold over a bowl' : ratio > 1.1 ? 'too much' : Math.abs(ratio - 1) <= 0.06 ? 'just right' : a.extra ? `+${Math.round(a.extra)} g in hand` : 'keep going', x + w, y - 8);
  ctx.restore();
}
