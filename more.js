'use strict';
/* =========================================================
   Pantry, bins, hands, bowl close-ups, progress bars, chilled
   desserts and the cookbook. Loaded last; wraps earlier code.
   ========================================================= */

/* ---------- new ingredients ---------- */
Object.assign(ING, {
  cocoa: { n: 'cocoa', d: 0.45, c: [92, 58, 40], type: 'powder' },
  cinnamon: { n: 'cinnamon', d: 0.55, c: [150, 92, 52], type: 'powder' },
  oats: { n: 'oats', d: 0.4, c: [214, 190, 140], type: 'grain' },
  honey: { n: 'honey', d: 1.42, c: [214, 150, 40], type: 'liquid' },
  coffee: { n: 'espresso', d: 1.0, c: [70, 42, 26], type: 'liquid' },
  biscuits: { n: 'biscuit crumbs', d: 0.5, c: [205, 160, 100], type: 'grain' },
  creamcheese: { n: 'cream cheese', d: 1.0, c: [250, 247, 238], type: 'thick' },
});
Object.assign(DEF, {
  cocoa: { name: 'Cocoa powder', src: 'cocoa', stock: 250, pour: { max: 9, tilt: 1.9 }, tare: 150, spoonable: 1 },
  cinnamon: { name: 'Ground cinnamon', src: 'cinnamon', stock: 60, pour: { max: 4, tilt: 1.9 }, tare: 90, spoonable: 1 },
  oats: { name: 'Rolled oats', src: 'oats', stock: 500, pour: { max: 30, tilt: 1.9 }, tare: 20 },
  honey: { name: 'Honey', src: 'honey', stock: 350, pour: { max: 12, tilt: 2.0 }, tare: 200, spoonable: 1 },
  coffee: { name: 'Cold espresso', src: 'coffee', stock: 300, pour: { max: 28, tilt: 1.6 }, tare: 300, spoonable: 1 },
  biscuits: { name: 'Biscuit crumbs', src: 'biscuits', stock: 400, pour: { max: 28, tilt: 1.9 }, tare: 20 },
  creamcheese: { name: 'Cream cheese', src: 'creamcheese', stock: 450, pour: { max: 20, tilt: 2.1 }, tare: 40, spoonable: 1 },
});
DEF.sugar.pour.max = 32;
Object.assign(SPEC, { cocoa: { rad: 0.038, h: 0.1 }, cinnamon: { rad: 0.026, h: 0.085 }, oats: { rad: 0.05, h: 0.16 }, honey: { rad: 0.042, h: 0.1 }, coffee: { rad: 0.04, h: 0.13 }, biscuits: { rad: 0.05, h: 0.14 }, creamcheese: { rad: 0.055, h: 0.06 } });
const PANTRY = { y: 1.66, x0: 0.04, x1: 0.64, z: SHZ };
const creamy = m => m && m.total() > 0.5 && ((m.g.cream || 0) + (m.g.creamcheese || 0)) > m.total() * 0.55 && (m.g.flour || 0) < m.total() * 0.1;

/* ---------- mixture rules for the new ingredients ---------- */
Mix.prototype.form = function () {
  const g = this.g, t = this.total(); if (t < 0.5) return 'empty';
  if (creamy(this)) return this.whip > 0.45 ? 'cream' : ((g.creamcheese || 0) > t * 0.3 ? 'batter' : 'liquid');
  const fl = (g.flour || 0) + (g.oats || 0) * 0.7 + (g.biscuits || 0) * 0.6 + (g.cocoa || 0) * 0.5;
  const liq = (g.milk || 0) + (g.water || 0) + (g.egg || 0) * 0.75 + (g.honey || 0) * 0.6 + (g.coffee || 0) + (g.cream || 0) * 0.8 + (g.creamcheese || 0) * 0.5, fat = g.butter || 0;
  if (fl < t * 0.15) return liq > t * 0.45 ? 'liquid' : 'loose';
  const hyd = (liq + fat * 0.8) / fl;
  if (hyd > 1.15) return this.mix < 0.35 ? 'lumpy' : 'batter';
  if (hyd < 0.32 || this.mix < 0.25) return 'loose';
  if (this.mix < 0.6) return 'shaggy';
  return (fat / fl > 0.3 || (g.chips || 0) > 0) ? 'cookie' : 'dough';
};
const _descM = Mix.prototype.describe;
Mix.prototype.describe = function () { if (creamy(this)) { const w = this.whip; let s = w < 0.25 ? 'runny' : w < 0.45 ? 'thickening' : w < 0.65 ? 'soft peaks' : w <= 1.05 ? 'stiff peaks' : 'over-whipped, grainy'; if (this.chill > 0.05) s += this.chill >= 1 ? ', set' : ', chilling'; return s; } return _descM.call(this); };
const _handMixM = handMix;
handMix = function (m, mv, type) {
  if (type === 'whisk' && creamy(m) && !isCream(m)) { m.whip = Math.min(1.5, m.whip + mv * 0.00028); m.mix = Math.min(1, m.mix + mv * 0.002); if (m.whip > 1.05) hintOnce('overwhip2', 'Careful, it’s turning grainy. Stop whisking!'); return; }
  _handMixM(m, mv, type);
};

/* ---------- models for pantry items ---------- */
function jarModel(it, o) {
  const g = new THREE.Group(), r = SPEC[it.kind].rad, h = SPEC[it.kind].h;
  g.add(mesh(latheShell([[0, 0], [r, 0], [r, h * 0.88], [r * 0.85, h]], [[0, 0.004], [r - 0.003, 0.004], [r - 0.003, h * 0.87], [r * 0.82, h - 0.001]]), o.glass || MAT.glass));
  it.parts.fill = mesh(new THREE.CylinderGeometry(r - 0.004, r - 0.004, 1, 28), o.fillMat, 0, 0, 0, false); g.add(it.parts.fill);
  const lab = labelTex(256, 64, (c, w, hh) => { c.fillStyle = o.labelBg || '#efe6d4'; c.fillRect(0, 0, w, hh); c.fillStyle = o.ink || '#4a3b2b'; c.font = `700 ${o.fs || 26}px Georgia, serif`; c.textAlign = 'center'; c.fillText(o.label, w / 2, 42); });
  g.add(mesh(new THREE.CylinderGeometry(r + 0.0008, r + 0.0008, h * 0.26, 28, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: lab, roughness: 0.85 }), 0, h * 0.5, 0, false));
  if (o.lid) g.add(mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.012, 24), o.lid, 0, h + 0.004, 0));
  return g;
}
function bagModel(it, o) {
  const g = new THREE.Group(), r = SPEC[it.kind].rad, h = SPEC[it.kind].h, w = r * 2, d = r * 1.3;
  const geo = new THREE.BoxGeometry(w, h, d, 5, 8, 4); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); pa.setZ(i, pa.getZ(i) * (1 - Math.pow(Math.max(0, (y - h * 0.3) / (h * 0.2)), 2) * 0.6)); pa.setX(i, pa.getX(i) + (Math.random() - 0.5) * 0.001); } geo.computeVertexNormals();
  const lab = labelTex(256, 384, (c, W, H) => { c.fillStyle = o.bg; c.fillRect(0, 0, W, H); noiseFill(c, W, H, 1500, '0,0,0', 0.05); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(24, 120, W - 48, 150); c.fillStyle = o.ink; c.font = '700 40px Georgia, serif'; c.textAlign = 'center'; c.fillText(o.label, W / 2, 195); c.font = '500 20px Inter, sans-serif'; c.fillText(o.sub, W / 2, 240); });
  g.add(mesh(geo, new THREE.MeshStandardMaterial({ map: lab, roughness: o.gloss ? 0.35 : 0.85 }), 0, h / 2, 0));
  return g;
}
function pantryModel(it) {
  const k = it.kind; it.parts = {};
  let g;
  if (k === 'cocoa') g = jarModel(it, { label: 'COCOA', fillMat: new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 1 }), lid: new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.5 }) });
  else if (k === 'cinnamon') g = jarModel(it, { label: 'CINNAMON', fs: 20, fillMat: new THREE.MeshStandardMaterial({ color: 0x96603a, roughness: 1 }), lid: MAT.steel });
  else if (k === 'honey') g = jarModel(it, { label: 'HONEY', fillMat: new THREE.MeshPhysicalMaterial({ color: 0xd99a2a, roughness: 0.1, transmission: 0.4, thickness: 0.05 }), lid: new THREE.MeshStandardMaterial({ color: 0xe2b23c, roughness: 0.3 }), labelBg: '#3b2a1a', ink: '#f2d27a' });
  else if (k === 'coffee') g = jarModel(it, { label: 'ESPRESSO', fs: 22, fillMat: new THREE.MeshPhysicalMaterial({ color: 0x2a1a10, roughness: 0.1 }), labelBg: '#f3efe6' });
  else if (k === 'oats') g = bagModel(it, { bg: '#c9b48a', ink: '#5a4322', label: 'OATS', sub: 'rolled · 500 g' });
  else if (k === 'biscuits') g = bagModel(it, { bg: '#b2462e', ink: '#7a2a18', label: 'BISCUITS', sub: 'crumbs · 400 g', gloss: 1 });
  else if (k === 'creamcheese') {
    g = new THREE.Group(); const lab = labelTex(512, 64, (c, w, h) => { c.fillStyle = '#f8f8f6'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a6fa8'; c.font = '700 30px Georgia, serif'; c.textAlign = 'center'; c.fillText('CREAM CHEESE', w / 4 + 20, 44); });
    g.add(mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.055, 32), [new THREE.MeshStandardMaterial({ map: lab, roughness: 0.4 }), MAT.white, MAT.white], 0, 0.0275, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.057, 0.057, 0.008, 32), new THREE.MeshStandardMaterial({ color: 0x3a6fa8, roughness: 0.4 }), 0, 0.058, 0));
  }
  g.traverse(o => { if (o.isMesh) o.userData.item = it; });
  return g;
}
const _bimM = buildItemModel;
buildItemModel = function (it) { if (['cocoa', 'cinnamon', 'honey', 'coffee', 'oats', 'biscuits', 'creamcheese'].includes(it.kind)) return pantryModel(it); return _bimM(it); };

/* ---------- room additions: pantry shelf, bins, cookbook; scale removed ---------- */
const BINS = [];
function buildMore() {
  const g = new THREE.Group(); FIX.room.add(g);
  g.add(box(PANTRY.x1 - PANTRY.x0, 0.026, 0.22, MAT.wood, (PANTRY.x0 + PANTRY.x1) / 2, PANTRY.y - 0.013, PANTRY.z));
  [PANTRY.x0 + 0.06, PANTRY.x1 - 0.06].forEach(x => g.add(box(0.012, 0.09, 0.16, MAT.plastic, x, PANTRY.y - 0.07, PANTRY.z - 0.02)));
  // pedal bins on the floor
  [[-1.0, 0.47], [2.2, 0.47]].forEach(([x, z]) => {
    const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b);
    const body = mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.44, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8dcdf, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide }), 0, 0.23, 0); b.add(body);
    b.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 40), MAT.cabinetDark, 0, 0.015, 0));
    b.add(mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.02, 40), MAT.plastic, 0, 0.01, 0));
    b.add(mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.2, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9, side: THREE.BackSide }), 0, 0.34, 0, false));
    const lid = new THREE.Group(); lid.position.set(0, 0.45, -0.13); b.add(lid);
    lid.add(mesh(new THREE.CylinderGeometry(0.134, 0.134, 0.022, 40), new THREE.MeshStandardMaterial({ color: 0xe6e9eb, metalness: 0.9, roughness: 0.22 }), 0, 0.011, 0.13));
    b.add(box(0.07, 0.015, 0.05, MAT.plastic, 0, 0.02, 0.15));
    tag(b, 'bin'); BINS.push({ x, z, top: 0.46, lid, open: 0, g: b });
  });
  // the cookbook, standing on the ledge
  const cover = labelTex(256, 360, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#8c3b2e'); gr.addColorStop(1, '#5e2219'); c.fillStyle = gr; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 2500, '0,0,0', 0.12); c.strokeStyle = '#d9b46a'; c.lineWidth = 3; c.strokeRect(16, 16, w - 32, h - 32); c.fillStyle = '#f0d79a'; c.textAlign = 'center'; c.font = '700 34px Georgia, serif'; c.fillText('The Small', w / 2, 120); c.fillText('Batch', w / 2, 160); c.font = 'italic 600 36px Georgia, serif'; c.fillText('Cookbook', w / 2, 205); c.font = '500 15px Inter, sans-serif'; c.fillText('baking from around the world', w / 2, 260); });
  const pages = new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.9 }), coverM = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.6 }), spine = new THREE.MeshStandardMaterial({ color: 0x5e2219, roughness: 0.6 });
  const book = mesh(new THREE.BoxGeometry(0.15, 0.21, 0.035), [pages, spine, pages, pages, coverM, spine], 0.99, LEDGE.y + 0.105, LEDGE.z + 0.012); book.rotation.z = -0.08; book.rotation.x = -0.1; g.add(book);
  tag(book, 'cookbook'); FIX.book = book;
  FIX.scale.visible = false; SCL.x = 99;
}

/* ---------- recipes & cookbook ---------- */
const CB = {
  sponge: { country: 'United Kingdom', kind: 'hot', level: 2, blurb: 'A light whisked sponge, layered with cream and strawberries.' },
  roll: { country: 'United Kingdom', kind: 'hot', level: 3, blurb: 'A thin sponge spread with cream and rolled while soft.' },
  cookies: { country: 'United States', kind: 'hot', level: 1, blurb: 'Chewy, golden and loaded with dark chocolate chips.' },
  bread: { country: 'United States', kind: 'hot', level: 2, blurb: 'A soft everyday loaf. Knead it, let it rise, slice it.' },
};
RECIPES.forEach(r => Object.assign(r, CB[r.id] || {}));
const MORE_RECIPES = [
  { id: 'shortbread', name: 'Scottish Shortbread', country: 'United Kingdom', kind: 'hot', level: 1, product: 'cookies', pan: 'tray', temp: 160, time: 18, ing: { flour: 180, butter: 120, sugar: 60 }, blurb: 'Three ingredients, rich and crumbly. A perfect first bake.' },
  { id: 'brownies', name: 'Fudgy Brownies', country: 'United States', kind: 'hot', level: 2, product: 'cake', pan: 'tin', whip: false, temp: 175, time: 25, ing: { butter: 120, sugar: 200, egg: 100, flour: 70, cocoa: 40, chips: 60 }, blurb: 'Dense and chocolatey. Don’t whisk in air, just mix.', deco: 'a dusting of icing sugar' },
  { id: 'cheesecake', name: 'No-Bake Cheesecake', country: 'United States', kind: 'cold', level: 3, product: 'chilled', pan: 'tin', chill: 120, ing: { biscuits: 150, butter: 60, creamcheese: 300, sugar: 80, cream: 200 }, blurb: 'Creamy and set in the fridge. Top with berries.' },
  { id: 'quatre', name: 'Quatre-Quarts', country: 'France', kind: 'hot', level: 1, product: 'cake', pan: 'loaf', whip: false, temp: 170, time: 45, ing: { egg: 200, sugar: 200, flour: 200, butter: 200 }, blurb: 'Breton pound cake: four ingredients in equal weight.' },
  { id: 'mousse', name: 'Chocolate Mousse', country: 'France', kind: 'cold', level: 2, product: 'mousse', pan: 'bowlS', chill: 30, ing: { cream: 250, sugar: 40, cocoa: 25 }, blurb: 'Silky whipped chocolate cream, chilled until set.' },
  { id: 'tiramisu', name: 'Tiramisu Cups', country: 'Italy', kind: 'cold', level: 3, product: 'mousse', pan: 'bowlS', chill: 60, ing: { creamcheese: 200, cream: 150, sugar: 50, coffee: 60, cocoa: 5 }, blurb: 'Coffee and mascarpone-style cream, dusted with cocoa.' },
  { id: 'schoko', name: 'Chocolate Loaf Cake', country: 'Germany', kind: 'hot', level: 2, product: 'cake', pan: 'loaf', whip: false, temp: 175, time: 45, ing: { butter: 125, sugar: 125, egg: 100, flour: 150, cocoa: 25, milk: 60, bp: 6 }, blurb: 'Schokoladenkuchen: a moist, sliceable chocolate loaf.' },
  { id: 'kanel', name: 'Cinnamon Loaf', country: 'Sweden', kind: 'hot', level: 3, product: 'bread', pan: 'loaf', temp: 190, time: 30, ing: { flour: 400, milk: 240, yeast: 7, sugar: 50, butter: 60, cinnamon: 8, salt: 5 }, blurb: 'Kanelbröd: a sweet yeasted loaf scented with cinnamon.' },
  { id: 'polvorones', name: 'Polvorones', country: 'Mexico', kind: 'hot', level: 1, product: 'cookies', pan: 'tray', temp: 170, time: 15, ing: { flour: 150, butter: 115, icing: 40 }, blurb: 'Melt-in-the-mouth tea cookies, rolled in icing sugar.', deco: 'icing sugar' },
  { id: 'castella', name: 'Castella Honey Sponge', country: 'Japan', kind: 'hot', level: 3, product: 'cake', pan: 'loaf', whip: true, temp: 160, time: 45, ing: { egg: 300, sugar: 160, flour: 120, honey: 40, milk: 20 }, blurb: 'Bouncy, fine-crumbed sponge sweetened with honey.' },
  { id: 'nankhatai', name: 'Nankhatai', country: 'India', kind: 'hot', level: 1, product: 'cookies', pan: 'tray', temp: 170, time: 18, ing: { flour: 120, sugar: 60, butter: 70, cinnamon: 2, bp: 2 }, blurb: 'Crisp spiced shortbread cookies, lovely with tea.' },
  { id: 'anzac', name: 'Anzac Biscuits', country: 'Australia', kind: 'hot', level: 1, product: 'cookies', pan: 'tray', temp: 175, time: 14, ing: { oats: 90, flour: 120, sugar: 100, butter: 110, honey: 40, water: 30, bp: 3 }, blurb: 'Chewy oat biscuits with a golden honey crunch.' },
  { id: 'pots', name: 'Strawberries & Cream Pots', country: 'United Kingdom', kind: 'cold', level: 1, product: 'mousse', pan: 'bowlS', chill: 15, ing: { cream: 200, sugar: 20 }, blurb: 'Whipped cream, chilled and piled with strawberries.', deco: 'strawberries' },
];
const PAN_NAME = { tin: 'round tin', loaf: 'loaf pan', tray: 'baking tray', bowlS: 'small bowl' };
const ingList = (R, keys) => (keys || Object.keys(R.ing)).map(k => ING[k].n).join(', ');
const hasAll = (m, R, f = 0.6) => Object.entries(R.ing).every(([k, v]) => (m.g[k] || 0) >= v * f);
const chillBowls = () => items.filter(i => (i.kind === 'bowlS' || i.kind === 'bowlD' || i.kind === 'bowlL') && creamy(i.m));
function genSteps(R) {
  const S = [], pre = { t: `Preheat the oven to ${R.temp} °C.`, c: () => near(OV.set, R.temp, 10) }, pan = PAN_NAME[R.pan];
  const bakeStep2 = { t: `Bake for about ${R.time} minutes.`, c: () => items.some(i => i.kind === R.pan && i.bake && i.bake.b > 0.9) || bakesOf().some(b => b.bake && b.bake.b > 0.9) };
  if (R.product === 'cake') {
    S.push(pre);
    if (R.whip) S.push({ t: 'Whisk the eggs and sugar until pale and thick.', c: () => anyMix(m => (m.g.egg || 0) > R.ing.egg * 0.6 && (m.g.sugar || 0) > R.ing.sugar * 0.5 && m.whip > 0.6) });
    else if (R.ing.butter) S.push({ t: 'Beat the butter and sugar together.', c: () => anyMix(m => (m.g.butter || 0) > R.ing.butter * 0.6 && (m.g.sugar || 0) > R.ing.sugar * 0.5 && m.mix > 0.7) });
    S.push({ t: `Mix in the rest (${ingList(R, Object.keys(R.ing).filter(k => !['sugar', 'butter'].includes(k) && !(R.whip && k === 'egg')))}) until smooth${R.whip ? ', folding gently' : ''}.`, c: () => anyMix(m => hasAll(m, R) && m.mix > 0.85) });
    S.push({ t: `Pour the batter into the ${pan}.`, c: () => items.some(i => i.kind === R.pan && i.m && i.m.total() > 200) || bakesOf().length > 0 });
    S.push(bakeStep2);
    S.push({ t: 'Cool it on the wire rack, then carry it to the decorating counter.', c: cooledOut(R.pan, R.pan === 'tin' ? 'round' : 'loaf') });
    S.push({ t: `Turn it out and finish it${R.deco ? ' with ' + R.deco : ' your way'}.`, c: () => bakesOf().some(b => b.decos.length >= 3 || b.dust > 0.3 || covAvg(b) > 0.5 || b.sliced >= 2) });
  } else if (R.product === 'cookies') {
    S.push(pre);
    S.push({ t: `Mix ${ingList(R)} into a soft dough.`, c: () => anyMix(m => hasAll(m, R) && m.mix > 0.8) });
    S.push({ t: 'Scoop about 12 heaped tablespoons onto the tray.', c: () => items.some(i => i.kind === 'tray' && i.balls.length >= 9) || bakesOf('cookies').length > 0 });
    S.push(bakeStep2);
    S.push({ t: 'Cool them on the wire rack.', c: cooledOut('tray', 'cookies') });
    S.push({ t: `Tip them onto a plate${R.deco ? ' and dust with ' + R.deco : ''}.`, c: () => bakesOf('cookies').some(b => b.host && b.host.kind.startsWith('plate') && (!R.deco || b.dust > 0.2)) });
  } else if (R.product === 'bread') {
    S.push({ t: `Mix ${ingList(R)} into a rough dough.`, c: () => anyMix(m => hasAll(m, R, 0.5) && m.mix > 0.6) });
    S.push({ t: 'Knead until smooth and stretchy.', c: () => anyMix(m => (m.g.flour || 0) > 250 && m.knead > 0.75) });
    S.push({ t: 'Let it rise in a bowl until doubled.', c: () => anyMix(m => (m.g.flour || 0) > 250 && m.proof > 0.8) });
    S.push({ t: 'Shape it into the loaf pan.', c: () => items.some(i => i.kind === 'loaf' && i.m.form() === 'dough') || bakesOf('loaf').length > 0 });
    S.push(pre); S.push(bakeStep2);
    S.push({ t: 'Cool it, turn it out onto the board and slice it.', c: () => bakesOf('loaf').some(b => b.sliced >= 3) });
  } else if (R.product === 'chilled') {
    S.push({ t: `Mix ${ingList(R)} together until smooth.`, c: () => anyMix(m => hasAll(m, R) && m.mix > 0.85) });
    S.push({ t: `Pour it into the ${pan}.`, c: () => items.some(i => i.kind === R.pan && i.m && i.m.total() > 300) || bakesOf().length > 0 });
    S.push({ t: `Chill it in the fridge for about ${R.chill} minutes.`, c: () => items.some(i => i.kind === R.pan && (i.m.chill || 0) >= 1) || bakesOf().some(b => (b.m.chill || 0) >= 1) });
    S.push({ t: 'Turn it out onto a plate at the decorating counter.', c: () => bakesOf('round').some(b => b.host && b.host.kind.startsWith('plate')) });
    S.push({ t: 'Decorate with fruit, cream or cocoa.', c: () => bakesOf('round').some(b => b.decos.length >= 3 || b.dust > 0.3) });
  } else if (R.product === 'mousse') {
    const cr = R.ing.creamcheese ? 'cream cheese and cream' : 'cream';
    S.push({ t: `Whisk the ${cr} with the sugar to soft peaks.`, c: () => anyMix(m => creamy(m) && (m.g.sugar || 0) > R.ing.sugar * 0.5 && m.whip > 0.5) });
    const rest = Object.keys(R.ing).filter(k => !['cream', 'creamcheese', 'sugar'].includes(k));
    if (rest.length) S.push({ t: `Gently fold in the ${ingList(R, rest)}.`, c: () => anyMix(m => hasAll(m, R) && m.mix > 0.85 && creamy(m)) });
    S.push({ t: 'Spoon it into the small bowl.', c: () => items.some(i => i.kind === 'bowlS' && creamy(i.m) && i.m.total() > 120) });
    S.push({ t: `Chill it in the fridge for about ${R.chill} minutes.`, c: () => chillBowls().some(b => (b.m.chill || 0) >= 1) });
    S.push({ t: `Top it with ${R.deco || 'berries, cocoa or sprinkles'}.`, c: () => chillBowls().some(b => (b.toppings || 0) >= 3) });
  }
  S.push({ t: 'Set it on a plate and ring the bell.', c: () => !!scorecard });
  return S;
}
MORE_RECIPES.forEach(R => { R.lines = Object.entries(R.ing).map(([k, v]) => k === 'egg' ? `${Math.round(v / 50)} egg${v > 50 ? 's' : ''}` : `${v} g ${ING[k].n}`); R.steps = genSteps(R); if (!R.temp) { R.temp = 0; R.time = R.chill; } RECIPES.push(R); });
const BOOK = { open: false, t: 0, country: 'All', kind: 'All', page: 0, hits: [], hover: null };
const COUNTRIES = ['All', ...[...new Set(RECIPES.map(r => r.country))]];
const RIBBON = ['#7a6a58', '#b0473a', '#3f6fa3', '#4a8a5b', '#c08a2e', '#6c4a8a', '#2f7f86', '#a85a7a', '#8a6a2e', '#5a7a2e', '#9a3e5a'];

/* ---------- bins ---------- */
function nearBin(p) { for (const b of BINS) { if (Math.abs(p.x - b.x) > 0.17) continue; if (viewT > 0.5) { if (Math.hypot(p.x - b.x, p.z - b.z) < 0.17) return b; } else if (p.y < b.top + 0.3 && p.y > b.top - 0.35) return b; } return null; }
function trash(it, bin) {
  const d = DEF[it.kind] || {};
  SFX.thunk(0.7); sNoise(0.18, 900, 1, 0.3, 'lowpass', 0.05);
  if (d.src || d.pick || it.kind === 'eggs' || it.kind === 'butter' || d.fixed || it.kind.startsWith('plate')) { say(`Keeping the ${d.name ? d.name.toLowerCase() : 'that'}. It goes back where it was.`, 2.5); it.flyHome = 1; return; }
  if (it.kind === 'bake' || it.kind === 'egg' || it.kind === 'butterPiece' || d.fruit || it.kind === 'slice' || it.kind === 'slices') { remove3(it); say('Into the bin.', 1.6); return; }
  if (it.m) it.m = new Mix(); if (it.balls) it.balls = []; it.bake = null; it.toppings = 0; if (it.parts && it.parts.tops) { it.parts.tops.forEach(m => it.model.remove(m)); it.parts.tops = []; }
  say('Emptied into the bin.', 1.8);
  if (d.tool) { it.pose = 'lie'; } it.flyHome = 1;
}

/* ---------- camera: work, fridge, oven, focus on a bowl ---------- */
let focusObj = null, focusIdle = 0;
updateCamera = function (dt) {
  viewT += clamp((view === 'pov' ? 1 : 0) - viewT, -dt * 1.6, dt * 1.6);
  const sx = station === 'decor' ? DX : 0;
  povX = clamp(povX, sx - 0.95, sx + 1.0);
  const aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? (1.5 / aspect) : 1;
  let tp, tl, tf;
  if (view === 'pov') { tp = V3(povX, 1.62, 0.5); tl = V3(povX, 0.88, -0.06); tf = 60 * (aspect < 1 ? 1.25 : 1); }
  else if (view === 'fridge') { tp = V3(-0.95, 1.38, 0.3 + 1.0 * widen); tl = V3(-1.45, 1.0, -0.05); tf = 50; }
  else if (view === 'oven') { tp = V3(1.12, 1.35, 0.3 + 0.95 * widen); tl = V3(1.4, 1.08, 0); tf = 50; }
  else if (view === 'work') { tp = V3(sx, 1.72, 0.3 + 1.2 * widen); tl = V3(sx, 0.98, -0.12); tf = 54; }
  else if (view === 'focus' && focusObj) { const p = focusObj.p, hh = focusObj.h || 0.1; tp = V3(p.x + 0.04, p.y + hh + 0.38, p.z + 0.18 + 0.42 * widen); tl = V3(p.x, p.y + hh * 0.55, p.z); tf = 42; }
  else { tp = V3(sx, 1.52, 0.3 + 2.75 * widen); tl = V3(sx, 1.1, -0.1); tf = 44; }
  const k = 1 - Math.exp(-dt * 4.2);
  if (!camCur.pos) camCur.pos = tp.clone();
  camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  const moving = camCur.pos.distanceTo(tp) > 0.01 || camCur.look.distanceTo(tl) > 0.01;
  if (held && moving && PT.has && !(NOFREEZE.t > performance.now())) { setRay(PT.x, PT.y); const it = held.it; if (viewT > 0.5) { const hp = planeHit(V3(0, 1, 0), V3(0, it.p.y, 0)); if (hp) held.off.set(hp.x - it.p.x, 0, hp.z - it.p.z); } else { const hp = planeHit(V3(0, 0, 1), V3(0, 0, it.zTarget ?? held.cz)); if (hp) held.off.set(hp.x - it.p.x, hp.y - it.p.y, 0); } }
  if (held && !moving && held.off0) held.off.lerp(held.off0, 1 - Math.exp(-dt * 3));
  if (heldDough && moving && PT.has) { const tg = carryTarget(null, true); if (tg) heldDough.grab.target.copy(tg); }
};
const _setViewM = setView;
setView = function (v) { if (view === 'focus') { focusObj = null; view = prevView === 'pov' ? 'pov' : 'work'; } _setViewM(v); };
function focusOn(obj) {
  if (!obj) return;
  if (['counter', 'work'].includes(view)) { prevView = view; view = 'focus'; }
  if (view === 'focus') { focusObj = obj; focusIdle = 0; }
}

/* ---------- wrappers ---------- */
const _pour3M = pour3;
pour3 = function (it, dt) {
  const d = DEF[it.kind];
  if (d.pour && d.src) {
    const a = amountTarget(), base = d.pour.max;
    let f = 1; if (a && a.on && a.need) { const r = a.have / a.need; f = r < 0.7 ? 1 : r < 1 ? lerp(1, 0.1, (r - 0.7) / 0.3) : 0.1; }
    d.pour.max = base * f; try { _pour3M(it, dt); } finally { d.pour.max = base; }
  } else _pour3M(it, dt);
  if (it.flow > 0) { const t = findPour3(it); if (t && t.r) focusOn(t.r); }
};
const _tool3M = tool3;
tool3 = function (it, dt) {
  _tool3M(it, dt);
  const r = it.inside;
  if (r && r.kind !== 'tray' && DEF[r.kind].recv && !DEF[it.kind].spread && !DEF[it.kind].pipe && !DEF[it.kind].knife) {
    const o = opening3(r), tg = carryTarget(it, false);
    if (tg && Math.hypot(tg.x - o.c.x, viewT > 0.5 ? tg.z - o.c.z : 0) > o.r * 1.35) { it.dipY = null; it.inside = null; }
    else { const R = (o.r || 0.05) * 0.6, dx = it.p.x - o.c.x, dz = it.p.z - o.c.z, dd = Math.hypot(dx, dz); if (dd > R) { it.p.x = o.c.x + dx / dd * R; it.p.z = o.c.z + dz / dd * R; } focusOn(r); }
  }
  if (DEF[it.kind].spread || DEF[it.kind].pipe || DEF[it.kind].knife) { const b = bakesOf().find(b => b.zone !== 'held' && inFoot(b, it.p.x, it.p.z, 0.03)); if (b && it.dipY != null) focusOn(b); }
};
const _grab3M = grab3;
grab3 = function (hit) {
  const it = hit.it, d = DEF[it.kind] || {};
  if (it.m && (d.recv || it.kind === 'loaf') && it.kind !== 'tray' && it.m.total() > 0.5 && hit.obj && !(it.parts.disc && [it.parts.disc, it.parts.dome, it.parts.body].includes(hit.obj))) {
    // clicked through the glass or the rim: does the ray land on the contents?
    const o = opening3(it); setRay(PT.x, PT.y); const sp = planeHit(V3(0, 1, 0), V3(0, o.surf, 0));
    if (sp && Math.hypot(sp.x - o.c.x, sp.z - o.c.z) < o.r * 0.85 && it.parts.disc) hit = Object.assign({}, hit, { obj: it.parts.disc, point: sp });
  }
  if (it.m && (d.recv || it.kind === 'loaf') && it.m.total() > 0.5 && hit.obj && (hit.obj === it.parts.disc || hit.obj === it.parts.dome || hit.obj === it.parts.body) && it.m.form() !== 'dough' && !it.m.shell && !it.bake) {
    drag = { type: 'hand', r: it, lx: PT.x, ly: PT.y, phase: 0 }; focusOn(it); SFX.scrape(); return;
  }
  _grab3M(hit);
};
const _release3M = release3;
release3 = function () {
  const it = held.it, bin = nearBin(it.p);
  if (bin) { held = null; it.tilt = 0; it.pourHold = 0; it.stream = null; trash(it, bin); return; }
  const d = DEF[it.kind] || {};
  if (d.fruit || it.kind === 'slice') {
    const bowl = recv3().find(r => creamy(r.m) && inOpen(opening3(r), it.p.x, it.p.z, 0.01) && it.p.y > opening3(r).top - 0.04);
    if (bowl) { held = null; addTopping(bowl, it); remove3(it); SFX.plop(); return; }
  }
  _release3M();
};
function addTopping(bowl, it) {
  const n = it.kind === 'blueberries' ? 6 : 1; bowl.toppings = (bowl.toppings || 0) + n;
  bowl.parts.tops = bowl.parts.tops || [];
  const pr = PROF[bowl.kind === 'bowlD' ? 'bowlS' : bowl.kind]; if (!pr) return;
  const sl = heightFor(pr.vol, bowl.m.vol()), rr0 = radiusAt(pr.inner, sl) * 0.6, dome = rr0 * (0.12 + 0.35 * Math.min(1, bowl.m.whip));
  for (let i = 0; i < n; i++) {
    const m = it.kind === 'blueberries' ? decoMesh('blueberry') : it.kind === 'strawberry' ? decoMesh('strawberryWhole') : it.kind === 'kiwi' ? decoMesh('kiwi') : decoMesh(it.fruit === 'kiwi' ? 'kiwi' : 'strawberry');
    const a = Math.random() * TAU, rr = Math.random() * rr0 * 0.8; m.position.set(Math.cos(a) * rr, sl + dome * 0.8 + 0.004, Math.sin(a) * rr); if (it.kind === 'strawberry') { m.rotation.z = Math.PI * 0.95; m.position.y += 0.03; }
    m.traverse(o => { if (o.isMesh) o.userData.item = bowl; }); bowl.model.add(m); bowl.parts.tops.push(m);
  }
}
const _releaseDoughM = releaseDough3;
releaseDough3 = function (dg) { const c = dg.center(), bin = nearBin(c); if (bin) { dg.grab = null; heldDough = null; dg.dispose(); doughs = doughs.filter(x => x !== dg); SFX.thunk(0.7); say('Into the bin.', 1.6); return; } _releaseDoughM(dg); };
const _support3M = support3;
support3 = function (it) { const s = _support3M(it); const { x, y } = it.p; if (x > PANTRY.x0 + 0.02 && x < PANTRY.x1 - 0.02 && y >= PANTRY.y - 0.02 && (!s || PANTRY.y > s.y)) return { y: PANTRY.y, zone: 'shelf', z: PANTRY.z }; return s; };
const _nudge3M = nudge3;
nudge3 = function (it) { if (it.zone === 'shelf' && it.p.x > PANTRY.x0 - 0.05 && it.p.x < PANTRY.x1 + 0.05 && it.p.y > 1.6) return; _nudge3M(it); };
const _bakeStepM = bakeStep;
bakeStep = function (it, dtMin) { const had = !!it.bake; _bakeStepM(it, dtMin); if (!had && it.bake && recipe && recipe.product === it.bake.type && recipe.temp) { it.bake.ideal = recipe.temp; it.bake.time = recipe.time; } };
const _pickCtrlM = pickCtrl;
pickCtrl = function (c) { if (c === 'cookbook') { BOOK.open = true; BOOK.t = 0; SFX.clink(); sNoise(0.3, 1800, 0.8, 0.2, 'bandpass', 0.05); return; } if (c === 'bin') { say('Drop things over the bin to throw them away.', 2.2); return; } _pickCtrlM(c); };
const _refreshCardsM = refreshCards;
refreshCards = function () { _refreshCardsM(); if (!recipe) CARDS.forEach(c => c.mesh.visible = false); };
serve = function () {
  SFX.ding();
  if (recipe && recipe.product === 'mousse') {
    const bowls = chillBowls().filter(b => b.zone !== 'held').sort((a, b) => (b.host && b.host.kind.startsWith('plate') ? 1 : 0) - (a.host && a.host.kind.startsWith('plate') ? 1 : 0) || b.touched - a.touched);
    if (!bowls.length) { say('Nothing to serve yet.', 3); return; }
    const b = bowls[0]; b.bake = { type: 'mousse', b: 1, brown: 1, rise: 0, spread: 0, tsum: 0, ttime: 0 }; judge(b); b.bake = null; return;
  }
  const all = bakesOf().filter(b => b.zone !== 'held');
  if (!all.length) { say('Nothing to serve yet. Make something, then plate it here.', 3.5); return; }
  const plated = all.filter(b => b.host && b.host.kind.startsWith('plate')).sort((a, b) => b.touched - a.touched);
  const b = plated[0] || all.sort((a, b2) => b2.touched - a.touched)[0];
  if (b.temp > 45) { say('It’s still warm. Let it cool before serving.', 3); return; }
  judge(b);
};
const _judgeM = judge;
judge = function (it) {
  _judgeM(it);
  if (!scorecard || it.kind === 'bake') return;
  // a chilled dessert served in its bowl
  const good = [], notes = []; let s = 0.5;
  if (it.host && it.host.kind.startsWith('plate')) { s += 0.2; good.push(`Served on the ${DEF[it.host.kind].name.toLowerCase()}.`); } else { s -= 0.15; notes.push('Set the bowl on a plate to serve it.'); }
  const w = it.m.whip; if (w > 1.05) { s -= 0.15; notes.push('The cream was over-whipped and grainy.'); } else if (w < 0.45) { s -= 0.15; notes.push('Too runny: whip it a little longer.'); } else good.push('Lovely light texture.');
  const t = it.toppings || 0; if (t >= 3) { s += 0.2; good.push('Generous toppings.'); } else notes.push('It could use some toppings.');
  scorecard.stars = Math.round((scorecard.stars / 5 * 0.7 + clamp(s, 0, 1) * 0.3) * 10) / 2;
  scorecard.good = [...good.slice(0, 2), ...scorecard.good].slice(0, 4); scorecard.notes = [...notes, ...scorecard.notes].slice(0, 4);
};
const _tickM = tick3;
tick3 = function (dt) {
  _tickM(dt);
  const dtMin = dt * CLOCK.mult / 60;
  // chilling
  if (recipe && (recipe.product === 'chilled' || recipe.product === 'mousse')) for (const it of items) {
    if (!it.m || it.m.total() < 50 || !((it.m.g.cream || 0) + (it.m.g.creamcheese || 0) > 0)) continue;
    if (it.zone === 'fridge' && it.temp < 10) it.m.chill = Math.min(1.3, (it.m.chill || 0) + dtMin / recipe.chill);
    if (it.kind === 'tin' && (it.m.chill || 0) >= 0.6 && !it.bake) it.bake = { type: 'chilled', b: 1, brown: 0, rise: 0, spread: 0, ideal: 0, time: 1, tsum: 0, ttime: 0 };
  }
  // cream-cheese mixes whip in the stand mixer too
  const mb = mixBowl(); if (MX.speed && MX.attach === 'whisk' && mb && creamy(mb.m) && !isCream(mb.m)) mb.m.whip = Math.min(1.5, mb.m.whip + 0.013 * MX.speed * dt);
  if (MX.speed && mb && mb.m.total() > 1) { /* keep focus on the mixer bowl while it runs */ }
  // stirring by hand
  if (drag && drag.type === 'hand') {
    const r = drag.r, mvPx = Math.hypot(PT.x - drag.lx, PT.y - drag.ly); drag.lx = PT.x; drag.ly = PT.y; drag.phase += mvPx * 0.05;
    if (r.m && r.m.total() > 0.5) { handMix(r.m, mvPx * 0.55, isCream(r.m) || creamy(r.m) ? 'spatula' : 'spatula'); if (Math.random() < mvPx * 0.01) sNoise(0.06, 700, 1.5, 0.08, 'lowpass'); }
    focusOn(r);
  }
  // bins open when something is carried near
  const hp = held ? held.it.p : heldDough ? heldDough.center() : null;
  for (const b of BINS) { const near = hp && nearBin(hp) === b; b.open += clamp((near ? 1 : 0) - b.open, -dt * 5, dt * 5); b.lid.rotation.x = -b.open * 1.1; if (near && held) held.it.zTarget = b.z; }
  if (heldDough && nearBin(heldDough.center())) heldDough.cz = BINS.find(b => b === nearBin(heldDough.center())).z;
  // leave the bowl close-up when nothing is happening there
  if (view === 'focus' && !focusPinned) { const active = (held && (held.it.inside || held.it.flow > 0 || held.it.dipY != null)) || (drag && drag.type === 'hand'); focusIdle = active ? 0 : focusIdle + dt; if (focusIdle > 1.3 || !focusObj || !items.includes(focusObj)) { view = prevView === 'pov' ? 'pov' : (prevView === 'counter' ? 'counter' : 'work'); focusObj = null; } }
  if (BOOK.open) BOOK.t += dt;
};
const _onDownM = onDown3;
onDown3 = function () { if (BOOK.open) { bookClick(); return; } _onDownM(); };
const _hoverM = hover3;
hover3 = function () {
  if (BOOK.open) return null;
  if (!held && !heldDough && !drag && PT.has) { const h = pick3(PT.x, PT.y); if (h && h.ctrl === 'cookbook') return 'Cookbook · pick a recipe'; if (h && h.ctrl === 'bin') return 'Bin · drop things over it to throw them away'; if (h && h.it && h.obj && h.it.parts && (h.obj === h.it.parts.disc || h.obj === h.it.parts.dome || h.obj === h.it.parts.body) && h.it.m && h.it.m.form() !== 'dough') return `${DEF[h.it.kind].name} · ${h.it.m.describe()} · drag inside to stir by hand`; }
  return _hoverM();
};
const _hintM = hint3;
hint3 = function () { if (BOOK.open) return ''; if (!recipe) return 'Open the cookbook on the ledge under the clock to choose a recipe.'; if (drag && drag.type === 'hand') return 'Stirring by hand. Keep moving in circles.'; if (held && nearBin(held.it.p)) return 'Let go to throw it in the bin.'; return _hintM(); };
addEventListener('keydown', e => { if (e.key === 'Escape' && BOOK.open) BOOK.open = false; });
UI.addEventListener('wheel', e => { if (BOOK.open) { e.stopImmediatePropagation(); BOOK.page = Math.max(0, BOOK.page + Math.sign(e.deltaY)); } }, { capture: true, passive: false });

/* ---------- progress bars ---------- */
function mixBar(m, tool) {
  if (creamy(m)) return { label: 'Whipping cream', v: m.whip, t: 0.65, max: 1.05, win: true };
  if (tool === 'hook' && ['dough', 'shaggy'].includes(m.form())) return { label: 'Kneading', v: m.knead, t: 0.75 };
  if (tool === 'whisk' && (m.g.egg || 0) > 0 && (m.g.flour || 0) < m.total() * 0.05) return { label: 'Whisking until pale', v: m.whip, t: 0.6 };
  const f = m.form(); return { label: f === 'shaggy' || f === 'dough' ? 'Bringing into a dough' : 'Mixing', v: m.mix, t: f === 'shaggy' || f === 'dough' ? 0.6 : 0.85 };
}
function actionBars() {
  const cur = [], world = [];
  if (held) {
    const it = held.it, d = DEF[it.kind];
    if (d.mixer && it.inside && it.inside.m && it.inside.m.total() > 0.5 && it.inside.kind !== 'tray') cur.push(mixBar(it.inside.m, d.mixer));
    if (d.spread || d.knife || d.pipe) { const b = bakesOf().find(b => b.zone !== 'held' && inFoot(b, it.p.x, it.p.z, 0.03)); if (b) {
      if (d.knife && b.shape === 'round' && b.layers < 3) cur.push({ label: `Cutting layer ${b.layers + 1}`, v: b.saw, t: 0.16 });
      else if (d.knife && b.shape === 'loaf') cur.push({ label: `Slice ${b.sliced + 1}`, v: b.saw, t: 0.07 });
      else if (d.spread) { const need = 25 * (b.layers - 1), done = b.fills.reduce((s, f) => s + Math.min(25, f), 0); if (b.shape === 'round' && b.layers > 1 && done < need) cur.push({ label: 'Filling the layers', v: done, t: need }); else if (b.shape === 'round') cur.push({ label: 'Frosting top · sides', v: (covAvg(b) + sideAvg(b)) / 2, t: 0.7 }); else cur.push({ label: 'Spreading', v: covAvg(b), t: 0.6 }); }
    } }
    const fr = d.knife && items.find(f => (f.kind === 'strawberry' || f.kind === 'kiwi') && f.saw > 0 && f.zone !== 'held'); if (fr) cur.push({ label: 'Slicing fruit', v: fr.saw, t: 0.05 });
  }
  if (drag && drag.type === 'hand' && drag.r.m) cur.push(mixBar(drag.r.m, 'spatula'));
  if (heldDough) cur.push({ label: 'Kneading', v: heldDough.m.knead, t: 0.75 });
  if (rollDrag) cur.push({ label: 'Rolling', v: rollDrag.b.rolled, t: 1 });
  const mb = mixBowl(); if (MX.speed && mb && mb.m.total() > 1 && MX.attach) world.push(Object.assign(mixBar(mb.m, MX.attach), { at: V3(MXR.x, CT + 0.45, 0.05) }));
  if (OV.set >= 30 && OV.heating) world.push({ label: 'Preheating', v: OV.temp, t: OV.set, at: V3(1.585, 1.62, 0.32), unit: '°C' });
  for (const it of [...items, ...doughs]) {
    if (it.zone === 'held') continue;
    const at = (it.p ? it.p.clone() : it.center()).add(V3(0, (it.h || 0.06) + 0.06, 0));
    if (it.zone === 'oven' && it.bake) world.push({ label: 'Baking', v: it.bake.b, t: 1, at: OVN.open > 0.5 ? at : V3(1.585, 1.2, 0.35), over: it.bake.brown > 1.4 });
    else if (it.bake && it.bake.b > 0.3 && it.temp > 45 && it.zone !== 'oven') world.push({ label: 'Cooling', v: 180 - it.temp, t: 135, at });
    const m = it.m; if (m && m.form && m.form() === 'dough' && (m.g.yeast || 0) > 0 && m.mix > 0.6 && !it.bake && m.proof < 1.6) world.push({ label: 'Rising', v: m.proof, t: 1, max: 1.6, win: true, at: it.kind === 'dough' ? it.center().add(V3(0, 0.1, 0)) : at });
    if (m && recipe && (recipe.product === 'chilled' || recipe.product === 'mousse') && (m.chill || 0) > 0 && (m.chill || 0) < 1.2 && it.kind !== 'dough') world.push({ label: 'Chilling', v: m.chill, t: 1, at: it.zone === 'fridge' && FRG.open < 0.5 ? V3(-1.58, 1.2, 0.4) : at });
  }
  return { cur, world };
}
function drawBar(x, y, b, small) {
  const w = small ? 130 : 200, h = small ? 7 : 9, ratio = b.v / b.t, over = b.over || (b.win && b.v > b.max), done = !over && ratio >= 1;
  const col = over ? '#c4412c' : done ? '#4c8a4a' : '#d39a2c';
  ctx.fillStyle = 'rgba(255,253,249,.92)'; rr(x - 8, y - (small ? 18 : 21), w + 16, small ? 32 : 38, 9); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.stroke();
  const span = b.win ? b.max * 1.15 : b.t * 1.1, sc = w / span;
  ctx.fillStyle = '#e8e2d8'; rr(x, y, w, h, h / 2); ctx.fill();
  if (b.win) { ctx.fillStyle = 'rgba(76,138,74,.25)'; ctx.fillRect(x + b.t * sc, y - 2, (b.max - b.t) * sc, h + 4); }
  ctx.fillStyle = col; rr(x, y, Math.max(h, Math.min(w, b.v * sc)), h, h / 2); ctx.fill();
  ctx.strokeStyle = '#2f5a2d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + b.t * sc, y - 3); ctx.lineTo(x + b.t * sc, y + h + 3); ctx.stroke();
  ctx.font = `600 ${small ? 10.5 : 12}px Inter, system-ui, sans-serif`; ctx.fillStyle = '#3b3631'; ctx.textAlign = 'left'; ctx.fillText(b.label, x, y - (small ? 5 : 7));
  ctx.textAlign = 'right'; ctx.fillStyle = col;
  const status = over ? (b.label === 'Baking' ? 'burning!' : b.label === 'Rising' ? 'over-risen' : 'too far') : done ? (b.label === 'Baking' ? 'done' : 'ready') : b.unit ? `${Math.round(b.v)} / ${b.t} ${b.unit}` : `${Math.round(clamp(ratio, 0, 1) * 100)}%`;
  ctx.fillText(status, x + w, y - (small ? 5 : 7));
}
function drawBars() {
  if (scorecard || BOOK.open) return;
  const { cur, world } = actionBars();
  cur.forEach((b, i) => drawBar(clamp(PT.x - 100, 12, uiW - 214), clamp(PT.y + 44 + i * 44, 30, uiH - 30), b, false));
  world.forEach(b => { const p = b.at.clone().project(camera); if (p.z > 1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05) return; const sx = (p.x + 1) / 2 * uiW, sy = (1 - p.y) / 2 * uiH; drawBar(sx - 65, sy, b, true); });
}
function drawHand(x, y, ph) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + Math.sin(ph) * 0.25); ctx.translate(Math.cos(ph) * 4, Math.sin(ph) * 3);
  const skin = lg(-20, -40, 20, 20, [[0, '#f2c9a5'], [1, '#d99c76']]); ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(120,70,40,.5)'; ctx.lineWidth = 1.2;
  for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-13 + f * 7, -34 + Math.abs(f - 1.5) * 3, 6.5, 26, 3.2) : ctx.rect(-13 + f * 7, -34, 6.5, 26); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(1, 0, 16, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-16, 0, 5, 11, -0.9, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e9e1d3'; ctx.fillRect(-14, 10, 30, 12);
  ctx.restore();
}

/* ---------- cookbook overlay ---------- */
function bookList() { return RECIPES.filter(r => (BOOK.country === 'All' || r.country === BOOK.country) && (BOOK.kind === 'All' || r.kind === BOOK.kind)); }
function recipeIcon(p) {
  if (p === 'mousse') { ctx.fillStyle = '#e8eef0'; ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(20, -6); ctx.lineTo(14, 16); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a4a32'; ctx.beginPath(); ctx.ellipse(0, -8, 20, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c3141d'; ctx.beginPath(); ctx.arc(4, -16, 5, 0, TAU); ctx.fill(); return; }
  if (p === 'chilled') { ctx.fillStyle = '#c99a62'; ctx.fillRect(-26, 6, 52, 6); ctx.fillStyle = '#f7f1e3'; ctx.fillRect(-26, -10, 52, 16); ctx.fillStyle = '#c3141d'; [-14, 0, 14].forEach(x => { ctx.beginPath(); ctx.arc(x, -12, 5, 0, TAU); ctx.fill(); }); return; }
  if (p === 'sheet') { ctx.fillStyle = '#d9a35b'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 12, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff8ea'; ctx.lineWidth = 3; ctx.beginPath(); for (let t = 0; t < 12; t += 0.2) ctx.lineTo(Math.cos(t) * (2 + t * 0.8), Math.sin(t) * (1 + t * 0.4)); ctx.stroke(); return; }
  drawCardIcon(p);
}
function drawBook() {
  if (!BOOK.open) return;
  const W = 980, H = 620, k = Math.min(1, (uiW - 24) / (W + 90), (uiH - 24) / (H + 60)), cx = uiW / 2, cy = uiH / 2 + 10;
  const a = sstep(0, 0.35, BOOK.t);
  ctx.fillStyle = `rgba(30,24,18,${0.45 * a})`; ctx.fillRect(0, 0, uiW, uiH);
  ctx.save(); ctx.translate(cx, cy + (1 - a) * 60); ctx.scale(k * (0.92 + 0.08 * a), k * (0.92 + 0.08 * a));
  BOOK.hits = []; const hit = (x0, y0, x1, y1, act) => BOOK.hits.push({ x0: cx + x0 * k, y0: cy + y0 * k, x1: cx + x1 * k, y1: cy + y1 * k, act });
  const inH = (x0, y0, x1, y1) => { const px = (PT.x - cx) / k, py = (PT.y - cy) / k; return px > x0 && px < x1 && py > y0 && py < y1; };
  // cover & pages
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-W / 2 - 12, -H / 2 - 4, W + 24, H + 22, 14); ctx.fill();
  ctx.fillStyle = lg(0, -H / 2, 0, H / 2, [[0, '#8c3b2e'], [1, '#5e2219']]); rr(-W / 2 - 14, -H / 2 - 12, W + 28, H + 24, 12); ctx.fill();
  // country ribbons on the right edge
  COUNTRIES.forEach((c, i) => { const y = -H / 2 + 16 + i * 48, on = BOOK.country === c, hv = inH(W / 2, y, W / 2 + 92, y + 40); ctx.fillStyle = RIBBON[i % RIBBON.length]; rr(W / 2 - 6, y, on ? 96 : hv ? 88 : 80, 40, 6); ctx.fill(); ctx.fillStyle = '#fff8ec'; ctx.font = `600 ${c.length > 12 ? 10 : 11.5}px Inter, system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.fillText(c === 'United Kingdom' ? 'UK' : c === 'United States' ? 'USA' : c, W / 2 + 8, y + 24); hit(W / 2, y, W / 2 + 96, y + 40, { country: c }); });
  // hot / cold bookmarks along the top
  [['All', 'All', '#7a6a58'], ['hot', 'Hot bakes', '#c4632c'], ['cold', 'Cold desserts', '#3f86a8']].forEach(([key, label, col], i) => { const x = -W / 2 + 40 + i * 132, on = BOOK.kind === key, hv = inH(x, -H / 2 - 44, x + 122, -H / 2); ctx.fillStyle = col; rr(x, -H / 2 - (on ? 46 : hv ? 40 : 34), 122, 50, 6); ctx.fill(); ctx.fillStyle = '#fff8ec'; ctx.font = '600 13px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + 61, -H / 2 - (on ? 24 : hv ? 19 : 14)); hit(x, -H / 2 - 46, x + 122, -H / 2, { kind: key }); });
  [-1, 1].forEach(s => { ctx.fillStyle = lg(s * W / 2, 0, 0, 0, [[0, '#efe5cf'], [0.85, '#faf4e6'], [1, '#e2d6bb']]); ctx.fillRect(s < 0 ? -W / 2 : 0, -H / 2, W / 2, H); });
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-3, -H / 2, 6, H);
  // headings
  const list = bookList(), per = 6, pages = Math.max(1, Math.ceil(list.length / per)); BOOK.page = clamp(BOOK.page, 0, pages - 1);
  ctx.fillStyle = '#5e2219'; ctx.textAlign = 'center'; ctx.font = 'italic 700 30px Georgia, serif'; ctx.fillText('The Small Batch Cookbook', -W / 4, -H / 2 + 46);
  ctx.font = '500 13px Inter, system-ui, sans-serif'; ctx.fillStyle = '#7a6a58'; ctx.fillText(`${BOOK.country === 'All' ? 'Every country' : BOOK.country} · ${BOOK.kind === 'All' ? 'hot and cold' : BOOK.kind === 'hot' ? 'hot bakes' : 'cold desserts'} · ${list.length} recipe${list.length === 1 ? '' : 's'}`, W / 4, -H / 2 + 42);
  ctx.strokeStyle = 'rgba(94,34,25,.25)'; ctx.beginPath(); ctx.moveTo(-W / 2 + 30, -H / 2 + 62); ctx.lineTo(-30, -H / 2 + 62); ctx.moveTo(30, -H / 2 + 62); ctx.lineTo(W / 2 - 30, -H / 2 + 62); ctx.stroke();
  const shown = list.slice(BOOK.page * per, BOOK.page * per + per); BOOK.hover = null;
  shown.forEach((R, n) => {
    const col = n < 3 ? -1 : 1, row = n % 3, x0 = col < 0 ? -W / 2 + 24 : 24, y0 = -H / 2 + 76 + row * 172, w = W / 2 - 48, h = 160;
    const hv = inH(x0, y0, x0 + w, y0 + h); if (hv) BOOK.hover = R;
    if (hv || recipe === R) { ctx.fillStyle = recipe === R ? 'rgba(76,138,74,.12)' : 'rgba(196,99,44,.1)'; rr(x0 - 6, y0 - 4, w + 12, h + 4, 10); ctx.fill(); }
    ctx.save(); ctx.translate(x0 + 44, y0 + 54); ctx.scale(1.15, 1.15); recipeIcon(R.product); ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = '#2d3a4f'; ctx.font = '700 28px Caveat, cursive'; ctx.fillText(R.name, x0 + 96, y0 + 30);
    ctx.font = '600 10.5px Inter, system-ui, sans-serif'; ctx.fillStyle = R.kind === 'cold' ? '#3f86a8' : '#c4632c';
    const tag = `${R.country.toUpperCase()} · ${R.kind === 'cold' ? 'COLD' : 'HOT'} · ${['', 'EASY', 'MEDIUM', 'HARD'][R.level || 2]}`; ctx.fillText(tag, x0 + 96, y0 + 50);
    for (let d = 0; d < 3; d++) { ctx.fillStyle = d < (R.level || 2) ? '#c4632c' : '#e2d6bb'; ctx.beginPath(); ctx.arc(x0 + 100 + ctx.measureText(tag).width + 10 + d * 11, y0 + 46, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5a5046'; ctx.font = '500 12.5px Inter, system-ui, sans-serif';
    ctx.fillText(R.product === 'chilled' || R.product === 'mousse' ? `No oven · chill ${R.chill} min` : `${R.temp} °C · ${R.time} min · ${PAN_NAME[R.pan]}`, x0 + 96, y0 + 70);
    ctx.fillStyle = '#3b3631'; ctx.font = '500 13px Inter, system-ui, sans-serif'; wrapText(R.blurb || '', 0, 0, w - 104).slice(0, 2).forEach((l, i) => ctx.fillText(l, x0 + 96, y0 + 94 + i * 18));
    ctx.fillStyle = '#8a7f72'; ctx.font = '500 11px Inter, system-ui, sans-serif'; const il = wrapText(R.lines.join(' · '), 0, 0, w - 104); ctx.fillText(il[0] + (il.length > 1 ? '…' : ''), x0 + 96, y0 + 136);
    if (recipe === R) { ctx.fillStyle = '#4c8a4a'; ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('BAKING NOW', x0 + w, y0 + 30); }
    hit(x0, y0, x0 + w, y0 + h, { recipe: R });
  });
  if (!shown.length) { ctx.fillStyle = '#8a7f72'; ctx.font = 'italic 600 20px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('No recipes here yet.', -W / 4, 0); }
  // page curls
  const curl = (s, en) => { const x = s > 0 ? W / 2 : -W / 2, y = H / 2; ctx.fillStyle = en ? lg(x - s * 40, y - 40, x, y, [[0, '#f6eedd'], [1, '#c9b892']]) : 'rgba(0,0,0,0)'; ctx.beginPath(); ctx.moveTo(x, y - 46); ctx.lineTo(x - s * 46, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); if (en) { ctx.fillStyle = '#7a6a58'; ctx.font = '600 11px Inter, system-ui, sans-serif'; ctx.textAlign = s > 0 ? 'right' : 'left'; ctx.fillText(s > 0 ? 'next →' : '← back', x - s * 52, y - 10); hit(Math.min(x, x - s * 110), y - 50, Math.max(x, x - s * 110), y, { page: s }); } };
  curl(1, BOOK.page < pages - 1); curl(-1, BOOK.page > 0);
  ctx.fillStyle = '#a89a86'; ctx.font = '500 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${BOOK.page + 1} / ${pages}`, 0, H / 2 + 2 - 8);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,253,249,.85)'; ctx.font = '500 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Click a recipe to bake it · click outside the book to close', uiW / 2, uiH - 10);
}
function bookClick() {
  const h = BOOK.hits.slice().reverse().find(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1);
  if (!h) { BOOK.open = false; SFX.click(); return; }
  const a = h.act;
  if (a.country) { BOOK.country = a.country; BOOK.page = 0; sNoise(0.08, 2400, 1, 0.15); return; }
  if (a.kind) { BOOK.kind = a.kind; BOOK.page = 0; sNoise(0.08, 2400, 1, 0.15); return; }
  if (a.page) { BOOK.page += a.page; sNoise(0.25, 1600, 0.7, 0.22, 'bandpass'); return; }
  if (a.recipe) { recipe = a.recipe; ticks = recipe.steps.map(() => false); refreshCards(); BOOK.open = false; SFX.clink(); say(`${recipe.name}. The steps are on the sticky notes.`, 3.5); }
}

/* ---------- overlay chain ---------- */
const _drawUIM = drawUI3;
drawUI3 = function () {
  _drawUIM();
  ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0);
  drawBars();
  if (drag && drag.type === 'hand' && PT.has) drawHand(PT.x, PT.y, drag.phase);
  drawBook();
  ctx = UI.getContext('2d');
};
const _build3M = build3;
build3 = function () {
  focusObj = null; BOOK.open = false;
  _build3M();
  mk3('cocoa', 0.1, PANTRY.y, PANTRY.z, 'shelf'); mk3('cinnamon', 0.18, PANTRY.y, PANTRY.z, 'shelf'); mk3('honey', 0.26, PANTRY.y, PANTRY.z, 'shelf');
  mk3('coffee', 0.35, PANTRY.y, PANTRY.z, 'shelf'); mk3('oats', 0.45, PANTRY.y, PANTRY.z, 'shelf'); mk3('biscuits', 0.57, PANTRY.y, PANTRY.z, 'shelf');
  mk3('creamcheese', -1.44, FRG.shelves[2], 0.04, 'fridge');
  refreshCards();
};

/* ---------- boot ---------- */
buildMore();
build3();

/* ---------- corner buttons: zoom out, close doors, restart ---------- */
const BTN = { hits: [], confirm: 0 };
function cornerButtons() {
  const b = [];
  if (MITT_WORN.v) b.push({ id: 'mitt', label: 'Take off mitt' });
  if (FRG.tgt === 1) b.push({ id: 'fridge', label: 'Close fridge' });
  if (OVN.tgt === 1) b.push({ id: 'oven', label: 'Close oven' });
  if (view !== 'counter') b.push({ id: 'zoom', label: 'Zoom out' });
  b.push({ id: 'restart', label: performance.now() < BTN.confirm ? 'Click again to restart' : 'Restart', warn: performance.now() < BTN.confirm });
  return b;
}
function drawCornerButtons() {
  if (scorecard || BOOK.open) { BTN.hits = []; return; }
  BTN.hits = []; let x = uiW - 14; const y = 14;
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  for (const b of cornerButtons()) {
    const w = ctx.measureText(b.label).width + 28, x0 = x - w, hv = PT.has && PT.x > x0 && PT.x < x && PT.y > y && PT.y < y + 34;
    ctx.fillStyle = b.warn ? (hv ? '#b23a2a' : '#c4412c') : hv ? 'rgba(255,253,249,1)' : 'rgba(255,253,249,.9)';
    rr(x0, y, w, 34, 17); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = b.warn ? '#fff' : '#3b3631'; ctx.textAlign = 'center'; ctx.fillText(b.label, x0 + w / 2, y + 22);
    BTN.hits.push({ x0, x1: x, y0: y, y1: y + 34, id: b.id }); x = x0 - 8;
  }
}
function cornerClick() {
  const h = BTN.hits.find(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1); if (!h) return false;
  if (h.id === 'mitt') { MITT_WORN.v = false; FIX.mitt.visible = true; SFX.click(); say('Mitt back on its hook.', 1.6); return true; }
  if (h.id === 'fridge') pickCtrl('fridgeDoor');
  else if (h.id === 'oven') pickCtrl('ovenDoor');
  else if (h.id === 'zoom') { focusObj = null; focusPinned = false; prevView = 'counter'; view = 'counter'; SFX.click(); }
  else if (h.id === 'restart') { if (performance.now() < BTN.confirm) { BTN.confirm = 0; build3(); SFX.click(); say('Fresh kitchen. Open the cookbook to start.', 3); } else { BTN.confirm = performance.now() + 3000; SFX.click(); } }
  return true;
}
const _onDownB = onDown3;
onDown3 = function () { if (!BOOK.open && !scorecard && cornerClick()) return; _onDownB(); };
const _hoverB = hover3;
hover3 = function () { if (!held && PT.has && BTN.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1)) return null; return _hoverB(); };
const _drawUIB = drawUI3;
drawUI3 = function () { _drawUIB(); ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); drawCornerButtons(); ctx = UI.getContext('2d'); };

/* ---------- mixer speed buttons ---------- */
const MXB = { hits: [] };
function drawMixerButtons() {
  MXB.hits = [];
  if (scorecard || BOOK.open || station !== 'bake' || ['fridge', 'oven'].includes(view)) return;
  const p = V3(MXR.x + 0.02, CT + 0.43, 0.06).project(camera); if (p.z > 1 || Math.abs(p.x) > 0.95 || Math.abs(p.y) > 0.95) return;
  const sx = (p.x + 1) / 2 * uiW, sy = (1 - p.y) / 2 * uiH;
  const labels = ['Off', '1', '2', '3'], bw = [40, 30, 30, 30], gap = 4, total = bw.reduce((a, b) => a + b, 0) + gap * 3 + 16;
  let x = sx - total / 2; const y = sy - 18;
  ctx.fillStyle = 'rgba(40,36,32,.82)'; rr(x, y - 16, total, 50, 12); ctx.fill();
  ctx.font = '600 10px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'left'; ctx.fillText(`MIXER · ${MX.attach ? (MX.attach === 'hook' ? 'dough hook' : 'whisk') : 'no attachment'}`, x + 8, y - 3);
  x += 8;
  labels.forEach((l, i) => {
    const on = MX.speed === i, hv = PT.has && PT.x > x && PT.x < x + bw[i] && PT.y > y + 2 && PT.y < y + 28;
    ctx.fillStyle = on ? (i ? '#e0a43a' : '#9aa59a') : hv ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.8)'; rr(x, y + 2, bw[i], 26, 8); ctx.fill();
    ctx.fillStyle = on ? '#fff' : '#3b3631'; ctx.font = '700 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(l, x + bw[i] / 2, y + 19);
    MXB.hits.push({ x0: x, x1: x + bw[i], y0: y + 2, y1: y + 28, s: i }); x += bw[i] + gap;
  });
}
function mixerButtonClick() {
  const h = MXB.hits.find(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1); if (!h) return false;
  MX.speed = h.s; SFX.click();
  if (h.s && !mixBowl()) say('The mixer is running with no bowl on it.', 2.2);
  else if (h.s && !MX.attach) say('Fit the whisk or dough hook first.', 2.2);
  const mb = mixBowl(); if (h.s && mb) focusOn(mb);
  return true;
}
const _onDownX = onDown3;
onDown3 = function () { if (!BOOK.open && !scorecard && mixerButtonClick()) return; _onDownX(); };
const _hoverX = hover3;
hover3 = function () { if (!held && PT.has && MXB.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1)) return null; return _hoverX(); };
const _drawUIX = drawUI3;
drawUI3 = function () { ctx = UI.getContext('2d'); _drawUIX(); ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); drawMixerButtons(); ctx = UI.getContext('2d'); };

/* ---------- put things away once they're no longer needed ---------- */
function amountIn(k) { let s = 0; for (const it of items) { if (it.m && !DEF[it.kind]?.src) s += it.m.g[k] || 0; if (it.kind === 'tray' && it.balls) it.balls.forEach(b => s += b.m.g[k] || 0); if (it.kind === 'bake' && it.balls) { /* counted in m */ } } doughs.forEach(d => s += d.m.g[k] || 0); return s; }
function ingredientDone(it) {
  const k = DEF[it.kind]?.src; if (!k || !recipe) return false;
  const need = recipe.ing[k] ?? EXTRA_TARGET[k]; if (need == null) return true; // not in this recipe at all
  return amountIn(k) >= need * 0.95;
}
function setToolHomes() {
  for (const it of items) if (DEF[it.kind]?.tool && (it.pose === 'hang' || it.pose === 'hangD')) it.home = { p: it.p.clone(), zone: 'rail', pose: it.pose, slot: it.slot };
}
const _build3X = build3;
build3 = function () { _build3X(); setToolHomes(); };
function curStep() { return recipe ? ticks.findIndex(t => !t) : -1; }
const _tool3X = tool3;
tool3 = function (it, dt) { _tool3X(it, dt); if (it.inside || it.dipY != null || (it.m && it.m.total() > 0.05)) it.useStep = curStep(); };
function sendHome(it, msg) {
  if (it.flyHome) return;
  if (it.home.zone === 'fridge' && FRG.open < 0.85) return;
  if (DEF[it.kind]?.tool) { it.pose = it.home.pose || 'hang'; it.slot = it.home.slot; }
  it.flyHome = 1; it.host = null; if (msg) say(msg, 2);
}
const _tickX = tick3;
tick3 = function (dt) {
  _tickX(dt);
  if (!recipe || scorecard) return;
  for (const it of items) {
    if (it.zone === 'held' || it.falling || it.flyHome) { it.awayT = 0; continue; }
    const d = DEF[it.kind] || {};
    const onWork = ['counter', 'host', 'rack'].includes(it.zone) || (it.zone === 'oven');
    if (!onWork) { it.awayT = 0; continue; }
    let done = false, msg = null;
    if (d.src && it.home && it.home.zone !== 'counter') { done = ingredientDone(it); if (done) msg = `Put the ${d.name.toLowerCase()} back.`; }
    else if (d.tool && it.home && it.home.zone === 'rail' && it.useStep != null && it.useStep >= 0) { done = !!ticks[it.useStep] && !(it.m && it.m.total() > 0.05); }
    else if (d.src && it.home && it.home.zone === 'counter') { done = false; }
    if (done) { it.awayT = (it.awayT || 0) + dt; if (it.awayT > 1.2) { sendHome(it, msg); it.awayT = 0; } } else it.awayT = 0;
  }
};
setToolHomes();

/* ---------- physical speed buttons on the mixer (replace the floating panel) ---------- */
drawMixerButtons = function () { MXB.hits = []; };
const MXBTN = [];
(function buildMixerButtons() {
  const g = FIX.mixer, px = 0.1, py = 0.215, pz = 0.062;
  const lab = canvTex(256, 64, (c, w, h) => { c.fillStyle = '#2b2b2b'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e2d4'; c.font = '700 22px Inter, sans-serif'; c.textAlign = 'center'; ['0', '1', '2', '3'].forEach((t, i) => c.fillText(t, 40 + i * 58, 24)); c.font = '600 12px Inter, sans-serif'; c.fillStyle = 'rgba(232,226,212,.6)'; c.fillText('SPEED', w / 2, 58); });
  const plate = mesh(new THREE.BoxGeometry(0.078, 0.036, 0.004), [MAT.plastic, MAT.plastic, MAT.plastic, MAT.plastic, new THREE.MeshStandardMaterial({ map: lab, roughness: 0.5 }), MAT.plastic], px, py, pz, false); g.add(plate);
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshPhysicalMaterial({ color: i ? 0xf1ece0 : 0xb9bfb8, roughness: 0.35, clearcoat: 0.6, emissive: 0x000000 });
    const b = mesh(new THREE.CylinderGeometry(0.0052, 0.0056, 0.005, 20), mat, px - 0.027 + i * 0.018, py - 0.004, pz + 0.004); b.rotation.x = Math.PI / 2; g.add(b);
    const hit = mesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), b.position.x, b.position.y, pz + 0.006, false); g.add(hit);
    tag(b, 'mx' + i); tag(hit, 'mx' + i); MXBTN.push(b);
  }
})();
const _pickCtrlX = pickCtrl;
pickCtrl = function (c) {
  const m = /^mx(\d)$/.exec(c || '');
  if (m) { MX.speed = +m[1]; SFX.click(); const mb = mixBowl(); if (MX.speed && !mb) say('The mixer is running with no bowl on it.', 2.2); else if (MX.speed && !MX.attach) say('Fit the whisk or dough hook first.', 2.2); else if (MX.speed && mb) focusOn(mb); return; }
  _pickCtrlX(c);
};
const _syncFixedX = syncFixed;
syncFixed = function () { _syncFixedX(); MXBTN.forEach((b, i) => { const on = MX.speed === i; b.position.z = 0.066 - (on ? 0.0022 : 0); b.material.emissive.setHex(on && i ? 0xd98a1c : 0x000000); b.material.emissiveIntensity = on ? 0.9 : 0; }); };
const _hoverMx = hover3;
hover3 = function () { if (!held && !heldDough && !drag && PT.has && !BOOK.open) { const h = pick3(PT.x, PT.y); const m = h && h.ctrl && /^mx(\d)$/.exec(h.ctrl); if (m) return `Mixer speed ${+m[1] ? m[1] : 'off'}${MX.speed === +m[1] ? ' (on now)' : ''}`; } return _hoverMx(); };

/* ---------- tools: click to pick up, click to use, click empty space to put down ---------- */
const _beginHoldT = beginHold;
beginHold = function (it, point) { _beginHoldT(it, point); if (held && DEF[it.kind]?.tool) { held.sticky = true; held.fresh = true; hintOnce('sticky', 'Tools stay in your hand. Click to use them, click an empty spot to put them down, or press Esc to hang them back up.'); } };
const _spoon3T = spoon3;
spoon3 = function (it, dt, inside) { if ((it.useT || 0) > 0) _spoon3T(it, dt, inside); else { it.dumpT = 0; if (it.lock) { const s = items.find(i => i.id === it.lock); if (!s || !spoonOver(it, s)) it.lock = null; } } };
function toolTarget(it) {
  const d = DEF[it.kind];
  if (d.spoon) { if (items.some(s => s !== it && (DEF[s.kind].spoonable || DEF[s.kind].recv || s.kind === 'tray') && visible3(s) && s.zone !== 'held' && spoonOver(it, s))) return true; return !!it.inside; }
  if (d.pipe) return !!bakeUnder(it.p.x, it.p.y + 0.02, it.p.z, 0.3, 0) || !!recv3().find(r => isCream(r.m) && inOpen(opening3(r), it.p.x, it.p.z, 0));
  if (d.mixer || d.spread || d.knife) return !!(it.inside || it.dipY != null);
  return false;
}
function putToolBack(it) { held = null; it.zone = 'counter'; it.tilt = 0; it.stream = null; it.inside = null; it.dipY = null; if (it.m && it.m.total() > 0.05 && DEF[it.kind].spoon) it.m = new Mix(); sendHome(it); SFX.clink(); }
const _onDownT = onDown3;
onDown3 = function () {
  if (held && held.sticky && !BOOK.open && !scorecard) {
    const onBtn = BTN.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1);
    if (!onBtn) {
      const it = held.it, d = DEF[it.kind];
      if (nearBin(it.p)) { release3(); return; }
      if (d.spoon && spoonClick(it)) return;
      if (toolTarget(it)) { it.useT = d.spoon ? 0.5 : 0.35; if (d.pipe) it.pipeT = 0.33; return; }
      release3(); return;
    }
  }
  _onDownT();
};
const _onUpT = onUp3;
onUp3 = function () { if (held && held.sticky) { held.fresh = false; if (drag) { if (drag.type === 'clock') CLOCK.hold = false; drag = null; } return; } _onUpT(); };
const _tool3T = tool3;
tool3 = function (it, dt) {
  const d = DEF[it.kind];
  if (d.pipe) { if ((it.useT || 0) > 0) { it.pipeT = Math.max(it.pipeT || 0, 0.33); } else it.pipeT = -999; }
  _tool3T(it, dt);
  if (it.useT > 0) it.useT -= dt;
};
UI.addEventListener('contextmenu', e => { e.preventDefault(); if (held && held.sticky) putToolBack(held.it); });
addEventListener('keydown', e => { if (e.key === 'Escape' && held && held.sticky) putToolBack(held.it); });
const _hintT = hint3;
hint3 = function () {
  if (held && held.sticky) { const it = held.it, d = DEF[it.kind];
    if (d.spoon) return it.m.total() > 0.05 ? 'Click over a bowl or the tray to tip the spoon · Esc to hang it up' : 'Click over a jar, bag or bowl to scoop · click the counter to put it down';
    if (d.pipe) return it.m && it.m.total() > 4 ? 'Click over the cake to pipe a rosette · Esc to hang it up' : 'Click in the whipped cream to fill the bag';
    if (d.mixer) return 'Move it in circles inside a bowl to stir · click the counter to put it down';
    if (d.spread) return 'Dip in cream, then move it over the cake · click the counter to put it down';
    if (d.knife) return 'Move it back and forth across the cake or fruit · click the counter to put it down';
    if (d.att) return 'Click on the mixer head to fit it · Esc to hang it up'; }
  return _hintT();
};

/* ---------- arrows to move around; click something to zoom to it ---------- */
const SPOTS = ['fridge', 'bake', 'oven', 'decor'];
const SPOT_NAME = { fridge: 'Fridge', bake: 'Baking counter', oven: 'Oven', decor: 'Decorating counter' };
let focusPinned = false;
function curSpot() { if (view === 'fridge') return 'fridge'; if (view === 'oven') return 'oven'; return station === 'decor' ? 'decor' : 'bake'; }
const NOFREEZE = { t: 0 };
function goSpot(s) {
  focusObj = null; focusPinned = false; if (held) { NOFREEZE.t = performance.now() + 1800; if (held.off0) held.off.copy(held.off0); }
  if (s === 'fridge' && FRG.tgt !== 1) { FRG.tgt = 1; SFX.fridge(); }
  if (s !== 'fridge' && FRG.tgt === 1) { FRG.tgt = 0; SFX.fridge(); }
  if (s === 'decor') { goStation('decor'); view = 'counter'; return; }
  if (station !== 'bake') goStation('bake');
  if (s === 'bake') view = 'counter'; else { prevView = 'counter'; view = s; }
  SFX.click();
}
function stepArrow(dir) {
  if (view === 'pov') { const sx = station === 'decor' ? DX : 0, nx = povX + dir * 0.45; if (nx < sx - 0.96 || nx > sx + 1.01) { const i = SPOTS.indexOf(curSpot()) + dir; if (i >= 0 && i < SPOTS.length) goSpot(SPOTS[i]); } else { povX = nx; SFX.click(); } return; }
  const i = SPOTS.indexOf(curSpot()) + dir; if (i >= 0 && i < SPOTS.length) goSpot(SPOTS[i]);
}
function stepBack() { focusObj = null; focusPinned = false; if (view === 'fridge' || view === 'oven') { if (view === 'fridge' && FRG.tgt === 1) { FRG.tgt = 0; SFX.fridge(); } view = 'counter'; } else if (view === 'focus' || view === 'pov') view = 'work'; else view = 'counter'; SFX.click(); }
function leanIn() { focusObj = null; focusPinned = false; if (view === 'counter') view = 'work'; else { const sx = station === 'decor' ? DX : 0; povX = clamp(povX || sx, sx - 0.95, sx + 1.0); view = 'pov'; } SFX.click(); }
const ARW = { hits: [] };
function arrowSpec() {
  const out = [], i = SPOTS.indexOf(curSpot()), pov = view === 'pov';
  const L = pov ? (povX > (station === 'decor' ? DX : 0) - 0.94 ? 'Look left' : i > 0 ? SPOT_NAME[SPOTS[i - 1]] : null) : i > 0 ? SPOT_NAME[SPOTS[i - 1]] : null;
  const R = pov ? (povX < (station === 'decor' ? DX : 0) + 0.99 ? 'Look right' : i < SPOTS.length - 1 ? SPOT_NAME[SPOTS[i + 1]] : null) : i < SPOTS.length - 1 ? SPOT_NAME[SPOTS[i + 1]] : null;
  if (L) out.push({ id: 'left', label: L }); if (R) out.push({ id: 'right', label: R });
  if (view !== 'counter') out.push({ id: 'up', label: view === 'focus' || view === 'pov' ? 'Step back' : 'Whole kitchen' });
  if (view === 'counter' || view === 'work') out.push({ id: 'down', label: view === 'counter' ? 'Closer' : 'Lean over' });
  return out;
}
function drawArrows() {
  ARW.hits = []; if (scorecard || BOOK.open) return;
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  for (const a of arrowSpec()) {
    let x, y; const r = 21;
    if (a.id === 'left') { x = 34; y = uiH / 2; } else if (a.id === 'right') { x = uiW - 34; y = uiH / 2; } else if (a.id === 'up') { x = uiW - 82; y = uiH - 40; } else { x = uiW - 34; y = uiH - 40; }
    const hv = PT.has && Math.hypot(PT.x - x, PT.y - y) < r + 4;
    ctx.fillStyle = hv ? 'rgba(255,253,249,1)' : 'rgba(255,253,249,.86)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = '#3b3631'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath();
    const d = 7; if (a.id === 'left') { ctx.moveTo(x + 3, y - d); ctx.lineTo(x - 4, y); ctx.lineTo(x + 3, y + d); } else if (a.id === 'right') { ctx.moveTo(x - 3, y - d); ctx.lineTo(x + 4, y); ctx.lineTo(x - 3, y + d); } else if (a.id === 'up') { ctx.moveTo(x - d, y + 3); ctx.lineTo(x, y - 4); ctx.lineTo(x + d, y + 3); } else { ctx.moveTo(x - d, y - 3); ctx.lineTo(x, y + 4); ctx.lineTo(x + d, y - 3); }
    ctx.stroke(); ctx.lineCap = 'butt';
    if (hv || a.id === 'left' || a.id === 'right') { const tw = ctx.measureText(a.label).width + 14; let lx = a.id === 'left' ? x + r + 6 : a.id === 'right' ? x - r - 6 - tw : x - tw / 2, ly = a.id === 'left' || a.id === 'right' ? y - 10 : y - r - 26; ctx.fillStyle = hv ? 'rgba(38,34,30,.88)' : 'rgba(38,34,30,.55)'; rr(lx, ly, tw, 20, 10); ctx.fill(); ctx.fillStyle = '#f6f2ec'; ctx.textAlign = 'left'; ctx.fillText(a.label, lx + 7, ly + 14); }
    ARW.hits.push({ x, y, r: r + 4, id: a.id });
  }
}
function arrowClick() {
  const h = ARW.hits.find(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r); if (!h) return false;
  if (h.id === 'left') stepArrow(-1); else if (h.id === 'right') stepArrow(1); else if (h.id === 'up') stepBack(); else leanIn();
  return true;
}
// clicking an object zooms to it
function pseudo(p, h) { return { p, h }; }
function zoomForHit(hit) {
  if (!hit) return;
  if (hit.ctrl) {
    const c = hit.ctrl;
    if (c === 'mixer' || c === 'lever' || /^mx\d$/.test(c)) { focusObj = mixBowl() || pseudo(V3(MXR.seat.x, CT, 0), 0.25); if (['counter', 'work', 'focus'].includes(view)) { if (view !== 'focus') prevView = view; view = 'focus'; } focusPinned = true; }
    else if (c === 'knobTemp' || c === 'knobTimer') { if (view !== 'oven') { prevView = 'counter'; view = 'oven'; } }
    else if (c === 'bell') { focusObj = pseudo(V3(DX + 0.98, CT, 0.15), 0.12); if (view !== 'focus') prevView = view; view = 'focus'; focusPinned = true; }
    return;
  }
  if (hit.it) { const d = DEF[hit.it.kind] || {}; if (d.fixed || (hit.it.kind === 'bake' && held == null && !drag)) { if (view !== 'focus') prevView = view; view = 'focus'; focusObj = hit.it; focusPinned = true; } }
}
const _autoWork = autoWork;
autoWork = function () { if (held && view === 'counter') { prevView = 'counter'; view = 'work'; } };
const _onDownA = onDown3;
onDown3 = function () {
  if (!BOOK.open && !scorecard && arrowClick()) return;
  const before = held ? held.it : null, wasDrag = drag;
  const hit = (!held && !BOOK.open && !scorecard) ? pick3(PT.x, PT.y) : null;
  _onDownA();
  if (hit && !before) { zoomForHit(hit); if (held && view === 'counter') { prevView = 'counter'; view = 'work'; } }
};
const _setViewA = setView;
setView = function (v) { focusPinned = false; _setViewA(v); };
const _hoverA = hover3;
hover3 = function () { if (PT.has && ARW.hits.some(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r)) return null; return _hoverA(); };
const _drawUIA = drawUI3;
drawUI3 = function () { _drawUIA(); ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); drawArrows(); ctx = UI.getContext('2d'); };
addEventListener('keydown', e => { if (BOOK.open) return; if (e.key === 'ArrowLeft') stepArrow(-1); if (e.key === 'ArrowRight') stepArrow(1); if (e.key === 'ArrowUp') stepBack(); if (e.key === 'ArrowDown') leanIn(); }, true);

// never stay zoomed on something that no longer exists, or on a closed fridge
const _tickS = tick3;
tick3 = function (dt) {
  _tickS(dt);
  if (view === 'focus' && focusObj && focusObj.kind && !items.includes(focusObj)) { focusObj = null; focusPinned = false; view = 'work'; }
  if (view === 'focus' && !focusObj) view = 'work';
  if (view === 'fridge' && FRG.tgt === 0 && FRG.open < 0.05) view = 'counter';
};

/* ---------- foldable sticky notes ---------- */
const NFOLD = { on: false, hits: [] };
const notesFolded = () => NFOLD.on || view === 'shelf';
const _noteLayoutF = noteLayout;
noteLayout = function () { if (notesFolded()) return []; return _noteLayoutF(); };
function drawFoldControls() {
  NFOLD.hits = []; if (!recipe || scorecard || BOOK.open) return;
  ctx.save();
  if (notesFolded()) {
    let x = 14; const y = 12;
    recipe.steps.forEach((s, i) => {
      if (NOTES.ripped.has(i)) return;
      const done = !!ticks[i], w = 30, h = 26;
      ctx.fillStyle = 'rgba(40,30,10,.18)'; ctx.fillRect(x + 2, y + 3, w, h);
      ctx.fillStyle = done ? '#f3dc7e' : '#fff3b0'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(200,160,40,.2)'; ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = done ? 'rgba(45,58,79,.45)' : '#2d3a4f'; ctx.font = '700 14px Caveat, cursive'; ctx.textAlign = 'center'; ctx.fillText(i + 1, x + w / 2, y + 19);
      if (done) { ctx.strokeStyle = 'rgba(196,52,38,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + w - 6, y + h - 5); ctx.moveTo(x + w - 6, y + 8); ctx.lineTo(x + 6, y + h - 5); ctx.stroke(); }
      x += w + 4;
    });
    if (!NFOLD.on) { ctx.restore(); return; }
    const label = 'Show the steps', tw = 116; ctx.fillStyle = 'rgba(255,253,249,.92)'; rr(x + 4, y, tw, 26, 13); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.stroke();
    ctx.fillStyle = '#3b3631'; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label + ' ▾', x + 4 + tw / 2, y + 17);
    NFOLD.hits.push({ x0: 14, x1: x + 4 + tw, y0: y, y1: y + 26, act: 'unfold' });
  } else {
    const L = _noteLayoutF(); if (!L.length) { ctx.restore(); return; }
    const last = L[L.length - 1], x = last.x + NW * last.s + 8, y = 14, tw = 92;
    ctx.fillStyle = 'rgba(255,253,249,.92)'; rr(x, y, tw, 26, 13); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.stroke();
    ctx.fillStyle = '#3b3631'; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Hide steps ▴', x + tw / 2, y + 17);
    NFOLD.hits.push({ x0: x, x1: x + tw, y0: y, y1: y + 26, act: 'fold' });
  }
  ctx.restore();
}
function foldClick() {
  const h = NFOLD.hits.find(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1); if (!h) return false;
  NFOLD.on = h.act === 'fold'; SFX.click(); sNoise(0.1, 2600, 1, 0.12); return true;
}

/* ---------- top-shelf view ---------- */
const _updateCameraS = updateCamera;
updateCamera = function (dt) {
  if (view !== 'shelf') return _updateCameraS(dt);
  const sx = station === 'decor' ? DX : -0.25, aspect = uiW / Math.max(1, uiH), widen = aspect < 1.5 ? 1.5 / aspect : 1;
  const tp = station === 'decor' ? V3(DX, 1.62, 0.3 + 0.95 * widen) : V3(-0.25, 1.62, 0.3 + 1.15 * widen), tl = station === 'decor' ? V3(DX, 1.5, -0.2) : V3(-0.25, 1.5, -0.2), tf = 50;
  const k = 1 - Math.exp(-dt * 4.2); if (!camCur.pos) camCur.pos = tp.clone();
  camCur.pos.lerp(tp, k); camCur.look.lerp(tl, k); camCur.fov = lerp(camCur.fov, tf, k);
  camera.position.copy(camCur.pos); camera.fov = camCur.fov; camera.aspect = aspect; camera.updateProjectionMatrix(); camera.lookAt(camCur.look);
  viewT += clamp(0 - viewT, -dt * 1.6, dt * 1.6);
  const moving = camCur.pos.distanceTo(tp) > 0.01;
  if (held && moving && PT.has) { setRay(PT.x, PT.y); const it = held.it, hp = planeHit(V3(0, 0, 1), V3(0, 0, it.zTarget ?? held.cz)); if (hp) held.off.set(hp.x - it.p.x, hp.y - it.p.y, 0); }
  if (held && !moving && held.off0) held.off.lerp(held.off0, 1 - Math.exp(-dt * 3));
};
// picking something off the shelf brings you back down to the table
const _autoWorkS = autoWork;
autoWork = function () { if (held && (view === 'counter' || view === 'shelf')) { prevView = 'counter'; view = 'work'; } };
const SHA = { hits: [] };
function drawShelfArrow() {
  SHA.hits = []; if (scorecard || BOOK.open || ['fridge', 'oven', 'pov', 'focus'].includes(view)) return;
  const up = view !== 'shelf', x = uiW / 2, y = up ? (recipe && !notesFolded() ? 14 + NH * noteScale() + 30 : 40) : uiH - 78, r = 20;
  const hv = PT.has && Math.hypot(PT.x - x, PT.y - y) < r + 4;
  ctx.fillStyle = hv ? 'rgba(255,253,249,1)' : 'rgba(255,253,249,.86)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#3b3631'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); if (up) { ctx.moveTo(x - 7, y + 3); ctx.lineTo(x, y - 4); ctx.lineTo(x + 7, y + 3); } else { ctx.moveTo(x - 7, y - 3); ctx.lineTo(x, y + 4); ctx.lineTo(x + 7, y - 3); } ctx.stroke(); ctx.lineCap = 'butt';
  const label = up ? 'Top shelves' : 'Back to the counter'; ctx.font = '600 11px Inter, system-ui, sans-serif'; const tw = ctx.measureText(label).width + 14;
  ctx.fillStyle = hv ? 'rgba(38,34,30,.88)' : 'rgba(38,34,30,.55)'; rr(x - tw / 2, up ? y + r + 6 : y - r - 26, tw, 20, 10); ctx.fill(); ctx.fillStyle = '#f6f2ec'; ctx.textAlign = 'center'; ctx.fillText(label, x, up ? y + r + 20 : y - r - 12);
  SHA.hits.push({ x, y, r: r + 4, up });
}
function shelfArrowClick() {
  const h = SHA.hits.find(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r); if (!h) return false;
  focusObj = null; focusPinned = false;
  if (h.up) { prevView = view; view = 'shelf'; } else view = prevView === 'work' ? 'work' : 'counter';
  SFX.click(); return true;
}
const _stepBackS = stepBack;
stepBack = function () { if (view === 'shelf') { view = 'counter'; SFX.click(); return; } _stepBackS(); };
const _onDownS = onDown3;
onDown3 = function () { if (!BOOK.open && !scorecard && (foldClick() || shelfArrowClick())) return; _onDownS(); };
const _hoverS = hover3;
hover3 = function () { if (PT.has && (NFOLD.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1) || SHA.hits.some(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r))) return null; return _hoverS(); };
const _drawUIS = drawUI3;
drawUI3 = function () { _drawUIS(); ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); drawFoldControls(); drawShelfArrow(); ctx = UI.getContext('2d'); };

/* ---------- every item: click once to hold, click again to put down ---------- */
const _beginHoldI = beginHold;
beginHold = function (it, point) { _beginHoldI(it, point); if (held && !held.sticky) { held.sticky = true; held.fresh = true; hintOnce('stickyItem', 'It stays in your hand. Hold it over a bowl to pour, or click again to put it down.'); } };
addEventListener('keydown', e => { if (e.key === 'Escape' && !held && MITT_WORN.v && !BOOK.open) { MITT_WORN.v = false; FIX.mitt.visible = true; say('Mitt back on its hook.', 1.6); } });
const _hintI = hint3;
hint3 = function () { const h = _hintI(); if (held && held.sticky && !DEF[held.it.kind].tool && h && !/click/i.test(h)) return h + ' · click to put it down'; return h; };

/* ---------- oven OFF button ---------- */
(function () {
  const g = new THREE.Group(); g.position.set(1.585, 1.502, OVN.front + 0.013); FIX.room.add(g);
  const btn = mesh(new THREE.CylinderGeometry(0.0095, 0.0105, 0.008, 24), new THREE.MeshPhysicalMaterial({ color: 0xc23b2b, roughness: 0.3, clearcoat: 0.8 }), 0, 0, 0.004); btn.rotation.x = Math.PI / 2; g.add(btn);
  const lab = canvTex(64, 32, (c) => { c.fillStyle = '#e8e2d4'; c.font = '700 20px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('OFF', 32, 23); });
  const pl = mesh(new THREE.PlaneGeometry(0.022, 0.011), new THREE.MeshBasicMaterial({ map: lab, transparent: true }), 0, -0.0175, 0.001, false); g.add(pl);
  const hit = mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 0, 0, 0.008, false); g.add(hit);
  tag(btn, 'ovenOff'); tag(hit, 'ovenOff'); FIX.ovenOff = btn;
  FIX.lamp.position.y = 1.535;
})();
const _pickCtrlO = pickCtrl;
pickCtrl = function (c) {
  if (c === 'ovenOff') { const was = OV.set > 0 || OV.timer > 0; OV.set = 0; OV.timer = 0; SFX.click(); FIX.ovenOff.position.z = 0.0015; setTimeout(() => FIX.ovenOff.position.z = 0.004, 160); say(was ? 'Oven off.' : 'The oven is already off.', 1.6); return; }
  _pickCtrlO(c);
};
const _hoverO = hover3;
hover3 = function () { if (!held && !heldDough && !drag && PT.has && !BOOK.open) { const h = pick3(PT.x, PT.y); if (h && h.ctrl === 'ovenOff') return OV.set > 0 ? `Turn the oven off (now ${OV.set} °C)` : 'Oven is off'; } return _hoverO(); };

/* ---------- cookies back onto the tray; keep holding while using arrows ---------- */
const _release3C = release3;
release3 = function () {
  const it = held && held.it;
  if (it && it.kind === 'bake' && it.shape === 'cookies') {
    const tray = items.find(t => t.kind === 'tray' && t.zone !== 'held' && visible3(t) && !t.balls.length && !(t.m && t.m.total() > 1) && inOpen(opening3(t), it.p.x, it.p.z, 0.05) && it.p.y > t.p.y - 0.02 && it.p.y - t.p.y < 0.4);
    if (tray) { held = null; tray.balls = it.balls.slice(); tray.bake = Object.assign({}, it.bake); tray.temp = it.temp; remove3(it); SFX.clink(); say('Cookies back on the tray.', 1.6); return; }
  }
  _release3C();
};
const _onDownH = onDown3;
onDown3 = function () {
  if (held && held.sticky) {
    const hitUI = ARW.hits.some(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r) || SHA.hits.some(h => Math.hypot(PT.x - h.x, PT.y - h.y) < h.r) || NFOLD.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1) || BTN.hits.some(h => PT.x > h.x0 && PT.x < h.x1 && PT.y > h.y0 && PT.y < h.y1);
    if (hitUI) { if (arrowClick() || shelfArrowClick() || foldClick() || cornerClick()) return; }
  }
  _onDownH();
};

/* ---------- no automatic zooming; buttons only ---------- */
focusOn = function () { };
autoWork = function () { };
UI.addEventListener('wheel', e => { if (!BOOK.open) { e.stopImmediatePropagation(); e.preventDefault(); const h = !held && pick3(PT.x, PT.y); if (h && (h.ctrl === 'knobTemp' || h.ctrl === 'knobTimer')) { if (h.ctrl === 'knobTemp') OV.set = clamp(Math.round((OV.set - Math.sign(e.deltaY) * 5) / 5) * 5, 0, 250); else OV.timer = clamp(OV.timer - Math.sign(e.deltaY) * 60, 0, 3600); SFX.click(); } } }, { capture: true, passive: false });
// fridge/oven doors no longer move the camera; the arrows and buttons do
const _pickCtrlZ = pickCtrl;
pickCtrl = function (c) { const v = view; _pickCtrlZ(c); if ((c === 'fridgeDoor' || c === 'ovenDoor') && v !== view) ZOOM_BY_BUTTON.v = true; };
const _onDownZ = onDown3;
onDown3 = function () { ZOOM_BY_BUTTON.v = false; const v = view, pv = prevView, fo = focusObj, fp = focusPinned; _onDownZ(); const arrow = false; if (view !== v && !ZOOM_BY_BUTTON.v) { view = v; prevView = pv; focusObj = fo; focusPinned = fp; } ZOOM_BY_BUTTON.v = false; };
const ZOOM_BY_BUTTON = { v: false };
['stepArrow', 'stepBack', 'leanIn', 'goSpot', 'shelfArrowClick', 'cornerClick', 'zoomForHit'].forEach(n => { const f = window[n]; if (typeof f !== 'function') return; window[n] = function (...a) { const v0 = view, s0 = station; const r = f.apply(this, a); if (view !== v0 || station !== s0) ZOOM_BY_BUTTON.v = true; return r; }; });

/* ---------- clicking a thing zooms onto it ---------- */
function zoomOnto(obj) { if (!obj) return; if (view !== 'focus') prevView = view === 'pov' ? 'pov' : 'work'; focusObj = obj.kind === 'dough' ? { p: obj.center(), h: 0.08 } : obj; focusPinned = true; view = 'focus'; ZOOM_BY_BUTTON.v = true; }
const _grab3Z = grab3;
grab3 = function (hit) { _grab3Z(hit); if (drag && drag.type === 'hand' && drag.r) zoomOnto(drag.r); };
UI.addEventListener('dblclick', () => {
  setTimeout(() => {
    if (BOOK.open || scorecard) return;
    if (held && held.sticky) release3();
    const h = pick3(PT.x, PT.y);
    if (h && h.it && !DEF[h.it.kind]?.tool) { zoomOnto(h.it); SFX.click(); }
    else if (h && h.dough) { zoomOnto(h.dough); SFX.click(); }
    else if (h && h.ctrl === 'fridgeDoor') { if (FRG.tgt !== 1) pickCtrl('fridgeDoor'); view = 'fridge'; }
    else if (h && (h.ctrl === 'ovenDoor' || h.ctrl === 'knobTemp' || h.ctrl === 'knobTimer')) view = 'oven';
  }, 30);
});
const _hintZ = hint3;
hint3 = function () { const h = _hintZ(); if (!h && !held && recipe) return 'Double-click anything to look closer · arrows to move around'; return h; };

/* ---------- spoon: a click scoops or tips, from any comfortable height ---------- */
function spoonClick(it) {
  const d = DEF[it.kind], full = it.m.total() > 0.05;
  let best = null, bd = 1e9;
  const consider = (r, o) => { const dd = Math.hypot(it.p.x - o.c.x, (it.p.z - o.c.z) * (viewT < 0.5 ? 0.1 : 1)); if (dd < bd) { bd = dd; best = r; } };
  if (full) {
    for (const r of recv3(true)) { if (r === it) continue; const o = opening3(r); if (inOpen(o, it.p.x, it.p.z, 0.03) && it.p.y > o.top - 0.06 && it.p.y - o.top < 0.45) consider(r, o); }
    if (best) { spoonDump3(it, best); return true; }
    const b = bakeUnder(it.p.x, it.p.y, it.p.z, 0.45, 0.02);
    if (b) { const k = it.m.kinds()[0]; if (k === 'chips' || k === 'sprinkles') { for (let i = 0; i < 4; i++) addDeco(b, k === 'chips' ? 'chip' : 'sprinkle', it.p.x + (Math.random() - 0.5) * 0.03, it.p.z + (Math.random() - 0.5) * 0.03); } it.m = new Mix(); SFX.plop(); return true; }
    return false;
  }
  // empty: scoop from a jar or bag first, then from a bowl
  for (const s of items) {
    const sd = DEF[s.kind]; if (!sd.spoonable || !sd.src || !visible3(s) || s.zone === 'held' || s.stock <= 0.3) continue;
    const o = srcOpen(s); if (Math.hypot(it.p.x - o.c.x, (it.p.z - o.c.z) * (viewT < 0.5 ? 0.1 : 1)) < o.r + 0.03 && it.p.y > o.c.y - 0.1 && it.p.y - o.c.y < 0.45) consider(s, o);
  }
  if (best) { const s = best, k = DEF[s.kind].src, g = Math.min(s.stock, d.spoon * ING[k].d * (0.96 + Math.random() * 0.08)); s.stock -= g; it.m.add(k, g); SFX.scrape(); it.useStep = curStep(); return true; }
  for (const r of recv3()) { if (r === it || !r.m || r.m.total() < 0.3) continue; const o = opening3(r); if (inOpen(o, it.p.x, it.p.z, 0.02) && it.p.y > o.top - 0.08 && it.p.y - o.top < 0.45) consider(r, o); }
  if (best) { const m = best.m, t = m.total(), f = m.form(); let g = ['cookie', 'dough', 'shaggy'].includes(f) ? (d.spoon === 15 ? 45 : 15) : d.spoon * (t / m.vol()); g = Math.min(g, t); it.m.merge(m.take(g / t)); SFX.scrape(); it.useStep = curStep(); return true; }
  return false;
}
