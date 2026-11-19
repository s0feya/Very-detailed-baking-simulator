'use strict';
/* =========================================================
   "Skip step": the kitchen performs the current step for you,
   with the same animations and results as doing it by hand.
   ========================================================= */
const AUTO = { busy: false, label: '', timers: [], anims: [], stream: null, t: 0 };
const waitS = sec => new Promise(res => AUTO.timers.push({ left: sec, res }));
const untilS = (fn, max = 30) => new Promise(res => AUTO.timers.push({ cond: fn, left: max, res }));
function animate(dur, fn) { return new Promise(res => AUTO.anims.push({ t: 0, dur, fn, res })); }
const _tickA2 = tick3;
tick3 = function (dt) {
  _tickA2(dt);
  if (!AUTO.busy) return;
  AUTO.t += dt;
  AUTO.anims = AUTO.anims.filter(a => { a.t += dt; const k = Math.min(1, a.t / a.dur); try { a.fn(sstep(0, 1, k), k, dt); } catch (e) { console.error(e); } if (k >= 1) { a.res(); return false; } return true; });
  AUTO.timers = AUTO.timers.filter(t => { t.left -= dt; if ((t.cond && t.cond()) || t.left <= 0) { t.res(); return false; } return true; });
};
const _syncParticlesA = syncParticles;
syncParticles = function () { if (AUTO.stream && !held) { held = { it: { stream: AUTO.stream, pdir: AUTO.stream.dir || V3(1, 0, 0) } }; try { _syncParticlesA(); } finally { held = null; } } else _syncParticlesA(); };

/* ---------- helpers ---------- */
const findK = k => items.find(i => i.kind === k);
const srcFor = k => items.find(i => DEF[i.kind]?.src === k && i.stock > 1) || items.find(i => DEF[i.kind]?.src === k);
function look(obj) { if (!obj) return; if (view !== 'focus') prevView = view === 'pov' ? 'counter' : (view === 'drawer' || view === 'fridge' || view === 'oven' || view === 'shelf' ? 'counter' : view); focusObj = obj; focusPinned = true; view = 'focus'; }
async function flyTo(it, to, dur = 0.6, zoneAfter) {
  const from = it.p.clone(); it.zone = 'auto'; it.falling = false; it.flyHome = 0; it.host = null;
  await animate(dur, k => { it.p.lerpVectors(from, to, k); it.p.y += Math.sin(k * Math.PI) * 0.08; });
  if (zoneAfter) it.zone = zoneAfter;
}
async function home(it) { if (!it || !items.includes(it)) return; it.tilt = 0; if (it.pivot) it.pivot.quaternion.identity(); if (DEF[it.kind]?.tool && it.home && it.home.zone === 'rail') { await flyTo(it, it.home.p.clone(), 0.5); it.pose = it.home.pose || 'hang'; it.slot = it.home.slot; it.zone = 'rail'; it.p.copy(it.home.p); return; } await flyTo(it, it.home.p.clone(), 0.55); it.zone = it.home.zone; it.p.copy(it.home.p); if (it.home.zone === 'drawer') { it.drawer = it.home.drawer; it.dz = it.home.dz; } }
function counterSpot(x) { return V3(x, CT, 0.05); }
function freeSpot(prefer) { const decor = station === 'decor'; const xs = decor ? [2.3, 2.5, 3.6, 3.85, 4.05] : [0.15, -0.25, 0.6, -0.45, 0.1]; for (const x of (prefer != null ? [prefer, ...xs] : xs)) { if (!items.some(o => o.zone === 'counter' && Math.abs(o.p.x - x) < 0.12 && Math.abs(o.p.z - 0.05) < 0.15)) return counterSpot(x); } return counterSpot(xs[0]); }
async function placeOnCounter(it, x) { if (it.zone === 'counter' && !x) return; const s = freeSpot(x); await flyTo(it, s, 0.6, 'counter'); it.p.copy(s); }
function mainBowl() {
  let best = null, bs = 0;
  for (const r of items) { if (!DEF[r.kind]?.recv || !r.m || ['tray', 'tin', 'loaf', 'pie', 'dutch', 'madeleine', 'canele'].includes(r.kind)) continue; let s = 0; for (const k in recipe.ing) s += Math.min(r.m.g[k] || 0, recipe.ing[k]); if (s > bs) { bs = s; best = r; } }
  return best;
}
function rimPoint(r) { const o = opening3(r); return V3(o.c.x + 0.09, o.top + 0.08, o.c.z); }
async function pourInto(src, dst, k, grams) {
  const d = DEF[src.kind], o0 = opening3(dst); look(dst);
  const side = V3(o0.c.x + (dst.rad || 0.08) * 0.6 + src.rad, o0.top + 0.05, o0.c.z);
  await flyTo(src, side, 0.6);
  src.pdir = V3(-1, 0, 0); const dur = clamp(grams / 70, 0.7, 2.2); let added = 0;
  const type = d.src ? (d.src === 'water' ? 'water' : ING[d.src].type) : 'thick';
  await animate(0.35, k2 => { src.tilt = k2 * (d.pour ? d.pour.tilt : 1.6) * 0.9; applyTilt(src); });
  await animate(dur, (k2, raw, dt) => {
    const want = grams * raw, step = want - added; added = want;
    if (d.src) { src.stock = Math.max(0, src.stock - step); dst.m.add(k, step); } else if (src.m && src.m.total() > 0.3) dst.m.merge(src.m.take(Math.min(1, step / Math.max(0.01, src.m.total()))));
    const lip = lip3(src), o = opening3(dst); AUTO.stream = { type: type === 'solid' ? 'thick' : type, a: lip, b: V3(o.c.x + 0.02, o.surf, o.c.z), col: d.src ? ING[d.src].c : (src.m ? src.m.color() : [240, 230, 200]), rate: 40, dir: src.pdir };
    if (['powder', 'grain', 'chunk'].includes(type) && Math.random() < 0.8) parts.push({ type, p: lip.clone(), v: V3(-0.06, 0.02, (Math.random() - 0.5) * 0.02), land: o.surf, col: d.src ? ING[d.src].c : [240, 230, 200], life: 1.5 });
  });
  AUTO.stream = null; setPour(null, 0);
  await animate(0.3, k2 => { src.tilt = (1 - k2) * (d.pour ? d.pour.tilt : 1.6) * 0.9; applyTilt(src); });
  src.tilt = 0;
}
async function addIngredient(k, grams, bowl) {
  if (grams < 0.5) return;
  if (k === 'egg') {
    const carton = findK('eggs'); if (carton && carton.zone === 'fridge') { FRG.tgt = 1; await waitS(0.4); }
    const n = Math.max(1, Math.round(grams / 50)); look(bowl);
    for (let i = 0; i < n; i++) { const from = carton ? carton.p.clone().add(V3(0, 0.06, 0)) : V3(bowl.p.x + 0.2, CT + 0.2, bowl.p.z); if (carton) carton.count = Math.max(0, carton.count - 1); const e = mk3('egg', from.x, from.y, from.z, 'auto'); await flyTo(e, rimPoint(bowl), 0.45); startCrack3(e, bowl); await waitS(0.75); }
    await waitS(0.5); if (FRG.tgt === 1 && view !== 'fridge') FRG.tgt = 0; return;
  }
  if (k === 'butter') {
    const dish = findK('butter'); if (dish && dish.zone === 'fridge') { FRG.tgt = 1; await waitS(0.4); }
    const from = dish ? dish.p.clone().add(V3(0, 0.05, 0)) : V3(bowl.p.x + 0.2, CT + 0.2, bowl.p.z); if (dish) dish.grams = Math.max(0, dish.grams - grams);
    const p = mk3('butterPiece', from.x, from.y, from.z, 'auto', { g: Math.round(grams) }); look(bowl); await flyTo(p, rimPoint(bowl), 0.55); const o = opening3(bowl); await flyTo(p, V3(o.c.x, o.surf + 0.01, o.c.z), 0.25); remove3(p); bowl.m.add('butter', grams); SFX.plop();
    if (FRG.tgt === 1 && view !== 'fridge') FRG.tgt = 0; return;
  }
  const src = srcFor(k);
  if (!src) { bowl.m.add(k, grams); return; }
  if (src.zone === 'fridge') { FRG.tgt = 1; await waitS(0.4); }
  const wasHome = src.home ? src.home.p.clone() : src.p.clone();
  await pourInto(src, bowl, k, grams);
  await flyTo(src, wasHome, 0.5); src.zone = src.home ? src.home.zone : 'counter'; src.p.copy(wasHome);
  if (FRG.tgt === 1 && view !== 'fridge') FRG.tgt = 0;
}
async function mixIn(bowl, how) {
  const m = bowl.m; look(bowl); const whip0 = m.whip;
  const onMixer = bowl.zone === 'mixer';
  if (onMixer && (how !== 'knead' || MX.attach === 'hook') && MX.attach) { MX.speed = how === 'fold' ? 1 : 3; await waitS(2.2); MX.speed = 0; }
  else {
    const tool = findK(how === 'whip' ? 'whisk' : how === 'knead' ? null : 'spatula') || findK('spatula');
    if (tool && how !== 'knead') {
      const back = tool.home ? tool.home.p.clone() : tool.p.clone(); tool.pose = 'held'; const o = opening3(bowl);
      await flyTo(tool, V3(o.c.x, o.top + 0.05, o.c.z), 0.5);
      await animate(2.0, (k, raw, dt) => { const a = raw * 26; const R = o.r * 0.45; tool.p.set(o.c.x + Math.cos(a) * R, Math.max(o.bot, o.surf - 0.01), o.c.z + Math.sin(a) * R * 0.6); handMix(m, 6, how === 'whip' ? 'whisk' : 'spatula'); });
      await home(tool);
    } else { await animate(2.0, (k, raw) => { m.swirl += 0.3; m.mix = Math.min(1, m.mix + 0.01); }); }
  }
  m.mix = 1; m.yolk = 0; m.whip = Math.max(m.whip, whip0);
  if (how === 'whip') m.whip = Math.max(m.whip, isCream(m) || creamy(m) ? 0.85 : 0.8);
  if (how === 'knead') m.knead = Math.max(m.knead, 0.9);
}
async function bowlFor(stepText) {
  let b = mainBowl();
  if (!b) { const bm = mixBowl(); b = (/whisk|whip|beat|knead/i.test(stepText) && bm && bm.m.total() < 1) ? bm : findK('bowlL'); }
  if (b && b.zone !== 'counter' && b.zone !== 'mixer') await placeOnCounter(b);
  return b;
}
function namedIngredients(text) {
  const t = text.toLowerCase(), ks = [];
  for (const k in recipe.ing) { const n = ING[k].n.toLowerCase(); if (t.includes(n) || (k === 'egg' && /\beggs?\b/.test(t)) || (k === 'bp' && t.includes('baking powder')) || (k === 'chips' && t.includes('chips')) || (k === 'berries' && t.includes('berr')) || (k === 'starter' && t.includes('starter'))) ks.push(k); }
  return ks;
}
async function ensureCream() {
  let bowl = items.find(i => i.m && (isCream(i.m) || creamy(i.m)) && i.m.whip > 0.6);
  if (bowl) return bowl;
  bowl = findK('bowlD') || findK('bowlS');
  if (!creamy(bowl.m)) { await addIngredient('cream', 200, bowl); await addIngredient('icing', 20, bowl); }
  await mixIn(bowl, 'whip'); return bowl;
}
const panOf = () => findK(recipe.pan) || null;
const bakeObj = () => bakesOf().sort((a, b) => b.touched - a.touched)[0];
async function ensureOvenHot() { if (!near(OV.set, recipe.temp, 10)) OV.set = recipe.temp; if (OV.temp < recipe.temp - 5) { CLOCK.hold = true; await untilS(() => OV.temp >= recipe.temp - 2, 20); CLOCK.hold = false; } }
async function intoOven(pan) {
  view = 'oven'; focusObj = null; focusPinned = false; OVN.tgt = 1; await waitS(0.6);
  await flyTo(pan, V3(1.585, OVN.rackY, 0.02), 0.8, 'oven'); pan.p.set(1.585, OVN.rackY, 0.02); SFX.thunk(0.6);
  OVN.tgt = 0; await waitS(0.5);
}
async function outToRack(pan) { view = 'oven'; OVN.tgt = 1; await waitS(0.6); await flyTo(pan, V3(RCK.x, RCK.top, RCK.z), 0.9, 'rack'); pan.p.set(RCK.x, RCK.top, RCK.z); OVN.tgt = 0; view = 'counter'; }
async function toDecor(it) { goStation('decor'); view = 'counter'; await waitS(0.6); if (it) await flyTo(it, V3(2.3, CT, 0.05), 0.9, 'counter'); if (it) it.p.set(2.3, CT, 0.05); }
async function plateReady() { let pl = items.find(i => i.kind.startsWith('plate') && i.zone === 'counter' && !bakesOf().some(b => b.host === i) && !items.some(o => o.host === i)); if (!pl) { pl = items.find(i => i.kind.startsWith('plate') && i.zone === 'shelf'); if (pl) { await flyTo(pl, V3(DX + 0.9, CT, -0.04), 0.8, 'counter'); pl.p.set(DX + 0.9, CT, -0.04); } } return pl; }
async function turnOutOnto(pan, host) {
  if (station !== 'decor' && host && onDecor(host.p.x)) await toDecor(null);
  look(host); const top = hostTop(host); pan.pdir = V3(1, 0, 0);
  await flyTo(pan, V3(host.p.x, top + 0.18, host.p.z), 0.6);
  await animate(0.6, k => { pan.tilt = k * Math.PI * 0.9; applyTilt(pan); });
  turnOut(pan, { h: host });
  await animate(0.4, k => { pan.tilt = (1 - k) * Math.PI * 0.9; applyTilt(pan); });
  pan.tilt = 0; await home(pan);
}
async function moveBakeTo(b, host) { look(host); await flyTo(b, V3(host.p.x, hostTop(host), host.p.z), 0.7); b.host = host; b.hostOff = V3(0, 0, 0); b.zone = 'host'; b.yaw = 0; }
async function toolOver(kind, target, dur, motion) {
  const t = findK(kind); if (!t) { await waitS(dur); return; }
  t.pose = 'held'; const c = target.p.clone(); await flyTo(t, c.clone().add(V3(0.15, 0.12, 0)), 0.5);
  await animate(dur, (k, raw, dt) => motion(t, c, raw, dt));
  await home(t);
}
async function ff(cond, max = 30) { CLOCK.hold = true; await untilS(cond, max); CLOCK.hold = false; }

/* ---------- the step performer ---------- */
async function performStep(i) {
  const R = recipe, text = R.steps[i].t, t = text.toLowerCase();
  const pan = panOf();
  // pastry-specific steps first
  if (/set 150 g of butter|onto a floured counter and set/.test(t)) {
    const b = mainBowl() || findK('bowlL'); if (b && b.m.total() < 50) { for (const k of ['flour', 'milk', 'sugar', 'yeast', 'salt']) await addIngredient(k, R.ing[k], b); await mixIn(b, 'mix'); }
    look(b); addPatch3(0.15, 0.05, 20); const dg = new Dough3(V3(b.p.x, CT + 0.15, b.p.z), b.m); b.m = new Mix(); doughs.push(dg);
    await animate(0.8, k => { dg.pts.forEach(o => { o.p.x += (0.15 - b.p.x) * 0.03; o.q.x = o.p.x; }); });
    await waitS(0.6); look({ p: V3(0.15, CT, 0.05), h: 0.06 }); await addIngredientToDough(dg, 150); return;
  }
  if (/rolling pin/.test(t)) {
    let dg = doughs[0];
    if (!dg) { const b = mainBowl(); if (b) { addPatch3(0.15, 0.05, 20); dg = new Dough3(V3(0.15, CT + 0.08, 0.05), b.m); b.m = new Mix(); doughs.push(dg); await waitS(0.8); } }
    if (!dg) return; const c = dg.center(); look({ p: V3(c.x, CT, c.z), h: 0.05 });
    const rounds = dg.lam ? 3 - (dg.turns || 0) : 1;
    for (let r = 0; r < rounds; r++) {
      await toolOver('pin', { p: dg.center() }, 1.4, (tool, cc, raw) => { tool.p.set(cc.x - 0.05 + Math.sin(raw * 18) * 0.08, CT + 0.03, cc.z); tool.pose = 'held'; dg.flat = Math.min(1, raw * 1.05); if (Math.random() < 0.2) sNoise(0.08, 400, 1, 0.1, 'lowpass'); });
      if (dg.lam) { dg.turns = (dg.turns || 0) + 1; dg.flat = dg.turns >= 3 ? 1 : 0.3; SFX.plop(); } else dg.flat = 1;
    }
    return;
  }
  if (/cut the dough/.test(t)) {
    const tray = findK('tray'); if (tray.zone !== 'counter') await placeOnCounter(tray, 0.6);
    const dg = doughs.find(d => d.lam) || doughs[0]; if (!dg) return; dg.turns = Math.max(3, dg.turns || 0);
    await toolOver('knife', { p: dg.center() }, 1.0, (tool, cc, raw) => { tool.p.set(cc.x - 0.1 + raw * 0.2, CT + 0.01, cc.z); });
    const n = 8, m = dg.m; for (let k = 0; k < n; k++) { const part = m.take(1 / (n - k)); part.turns = dg.turns; placeBall3(tray, tray.p, part); tray.balls[tray.balls.length - 1].shape = 'croissant'; }
    dg.dispose(); doughs = doughs.filter(x => x !== dg); look(tray); SFX.plop(); await waitS(0.6); return;
  }
  if (/let them rise/.test(t)) { const tray = findK('tray'); look(tray); await ff(() => tray.balls.length && tray.balls.every(b => (b.m.proof || 0) >= 1.05), 30); await brushOver(tray); return; }
  if (/brush the crust/.test(t)) { await brushOver(findK('pie')); return; }
  if (/lift it into the pie dish/.test(t)) {
    const dish = findK('pie'); await placeOnCounter(dish, -0.25); const dg = doughs[0];
    if (dg) { look(dish); dish.m.merge(dg.m); dish.crustFlat = Math.max(dish.crustFlat || 0, dg.flat || 0); dg.dispose(); doughs = doughs.filter(x => x !== dg); SFX.plop(); await waitS(0.6); }
    return;
  }
  if (/score the top/.test(t)) { const d = findK('dutch'); await toolOver('lame', d, 1.0, (tool, cc, raw) => { tool.p.set(cc.x - 0.06 + raw * 0.12, cc.y + 0.1, cc.z + Math.sin(raw * 3) * 0.02); }); d.scored = true; SFX.scrape(); return; }
  if (/tip the dough from the banneton/.test(t)) { const d = findK('dutch'), bn = findK('banneton'); await placeOnCounter(d, 0.6); if (bn && bn.m.total() > 50) { look(d); await pourInto(bn, d, null, bn.m.total()); d.m.merge(bn.m); bn.m = new Mix(); await home(bn); } return; }
  if (/rise in the banneton/.test(t)) { const bn = findK('banneton'); await placeOnCounter(bn, -0.25); const b = mainBowl(); if (b && b !== bn && b.m.total() > 50) { look(bn); bn.m.merge(b.m); b.m = new Mix(); SFX.plop(); } else if (doughs[0]) { bn.m.merge(doughs[0].m); doughs[0].dispose(); doughs = []; } look(bn); await ff(() => bn.m.proof >= 1.05, 30); return; }
  if (/shape it into the loaf pan/.test(t)) { const lp = findK('loaf'); await placeOnCounter(lp, 0.6); const b = mainBowl(); if (b) { look(lp); lp.m.merge(b.m); b.m = new Mix(); SFX.plop(); } else if (doughs[0]) { lp.m.merge(doughs[0].m); doughs[0].dispose(); doughs = []; } await waitS(0.5); return; }
  // general steps
  if (/preheat/.test(t)) { view = 'oven'; focusObj = null; focusPinned = false; const target = R.temp; await animate(0.8, k => { OV.set = Math.round(lerp(OV.set, target, k) / 5) * 5; }); OV.set = target; await ff(() => OV.temp >= target - 1, 25); view = 'counter'; return; }
  if (/whip|whisk the cream|cream with the sugar|cream cheese and cream/.test(t) && /cream/.test(t) && !/eggs/.test(t)) {
    const bowl = R.product === 'mousse' ? (findK('bowlS').m.total() > 1 && !creamy(findK('bowlS').m) ? findK('bowlD') : findK('bowlS')) : findK('bowlD') || findK('bowlS');
    if (bowl.zone !== 'counter') await placeOnCounter(bowl);
    for (const k of ['creamcheese', 'cream']) if (R.ing[k] || (k === 'cream' && /cream/.test(t))) await addIngredient(k, (R.ing[k] || 200) - (bowl.m.g[k] || 0), bowl);
    const sweet = R.ing.sugar && R.product === 'mousse' ? 'sugar' : 'icing'; await addIngredient(sweet, (R.ing[sweet] || 20) - (bowl.m.g[sweet] || 0), bowl);
    await mixIn(bowl, 'whip'); return;
  }
  if (/knead/.test(t)) {
    const dg = doughs[0]; if (dg) { look({ p: dg.center(), h: 0.05 }); await animate(2, (k, raw) => { dg.pts.forEach((o, j) => { o.p.x += Math.sin(raw * 20 + j) * 0.0008; }); }); dg.m.knead = Math.max(dg.m.knead, 0.9); return; }
    const b = mainBowl(); if (!b) return; if (b.zone === 'mixer') { const att = findK('attHook'); if (MX.attach !== 'hook' && att) { const old = mounted(); if (old) hang3(old, att.home.slot ?? 4); att.zone = 'mixer'; att.pose = 'mounted'; MX.attach = 'hook'; } }
    await mixIn(b, 'knead'); return;
  }
  if (/rise|doubled/.test(t)) { const b = mainBowl() || doughs[0]; const m = b && b.m; if (m) { look(b.kind === 'dough' ? { p: b.center(), h: 0.05 } : b); await ff(() => m.proof >= 1.05, 30); } return; }
  if (/chill/.test(t)) {
    const c = R.product === 'mousse' ? (chillBowls()[0] || findK('bowlS')) : pan; if (!c) return;
    view = 'fridge'; focusObj = null; FRG.tgt = 1; await waitS(0.6);
    const spot = V3(-1.58, FRG.shelves[1], 0.12); await flyTo(c, spot, 0.9, 'fridge'); c.p.copy(spot); FRG.tgt = 0; await waitS(0.5);
    await ff(() => (c.m.chill || 0) >= 1.05, 30); FRG.tgt = 1; await waitS(0.5); await placeOnCounter(c, 0.15); FRG.tgt = 0; view = 'counter'; return;
  }
  if (/scoop/.test(t)) {
    const tray = findK('tray'); await placeOnCounter(tray, 0.6); const b = mainBowl(); if (!b) return; const sp = findK('tbsp'); look(tray);
    for (let n = tray.balls.length; n < 12 && b.m.total() > 20; n++) { if (sp) { sp.pose = 'held'; await flyTo(sp, rimPoint(b), 0.2); await flyTo(sp, tray.p.clone().add(V3(0, 0.08, 0)), 0.2); } placeBall3(tray, tray.p, b.m.take(Math.min(1, 45 / b.m.total()))); SFX.plop(); }
    if (sp) await home(sp); return;
  }
  if (/pour the batter|pour it into|spoon it into|spread it into|onto the baking tray|pour the batter onto/.test(t)) {
    const dst = R.product === 'mousse' ? findK('bowlS') : (pan || findK('tin')); const b = mainBowl(); if (!b || !dst || b === dst) return;
    await placeOnCounter(dst, -0.25); const back = b.p.clone(), z = b.zone;
    await pourInto(b, dst, null, b.m.total()); if (b.m.total() > 0.3) dst.m.merge(b.m.take(1));
    await flyTo(b, back, 0.5); b.zone = z === 'mixer' ? 'mixer' : 'counter'; b.p.copy(back); return;
  }
  if (/bake/.test(t)) { const p = pan; if (!p) return; await ensureOvenHot(); if (p.zone !== 'oven') await intoOven(p); view = 'oven'; await ff(() => p.bake && p.bake.b >= 1.0, 40); return; }
  if (/cool/.test(t) && !/turn it out/.test(t) && !/tip them/.test(t)) {
    const p = pan && (pan.bake ? pan : null); if (p) { if (p.zone === 'oven') await outToRack(p); else if (p.zone !== 'rack') { await flyTo(p, V3(RCK.x, RCK.top, RCK.z), 0.8, 'rack'); } look(p); await ff(() => p.temp < 44, 30); if (/decorating counter/.test(t)) await toDecor(p); }
    else { const b = bakeObj(); if (b) await ff(() => b.temp < 44, 20); }
    return;
  }
  if (/turn it out|turn .* out|tip them onto a plate|turned out|onto the board/.test(t)) {
    let p = pan && pan.bake ? pan : null;
    if (p && p.zone === 'oven') await outToRack(p);
    if (p && p.temp > 44) { look(p); await ff(() => p.temp < 44, 30); }
    if (p) { if (!onDecor(p.p.x)) await toDecor(p); const host = /turntable/.test(t) ? findK('turntable') : /board/.test(t) ? findK('board') : await plateReady(); await turnOutOnto(p, host); }
    const b = bakeObj();
    if (b && /saw it into two layers/.test(t)) await sawLayers(b);
    if (b && /slice/.test(t)) await sliceLoaf(b);
    return;
  }
  if (/saw it into|layers with the bread knife/.test(t)) { const b = bakeObj(); if (b) await sawLayers(b); return; }
  if (/slice it/.test(t)) { const b = bakeObj(); if (b) await sliceLoaf(b); return; }
  if (/fill and frost|spread the cream|frost/.test(t)) {
    const b = bakeObj(); if (!b) return; const cream = await ensureCream(); look(b); const tt = b.host && b.host.kind === 'turntable' ? b.host : null;
    await toolOver('offset', b, 2.6, (tool, cc, raw) => { if (tt) tt.spinV = 7; tool.p.set(cc.x + 0.05, cc.y + (b.topY || b.h) + 0.004, cc.z); });
    if (b.layers > 1) b.fills = new Array(b.layers - 1).fill(28); b.covTop.fill(1); b.covSide.fill(1); b.covDirty = true; b.creamG = Math.max(b.creamG, 120); b.creamWhipSum = b.creamG * (cream.m.whip || 0.85); cream.m.take(Math.min(1, 120 / Math.max(1, cream.m.total()))); return;
  }
  if (/roll it up|roll it/.test(t) && bakeObj()) { const b = bakeObj(); look(b); await animate(1.6, k => { b.rolled = k; }); b.rolled = 1; SFX.plop(); return; }
  if (/top it|top with|decorat|finish it|dust/.test(t)) {
    const b = R.product === 'mousse' ? null : bakeObj();
    if (R.product === 'mousse') { const bowl = chillBowls()[0]; if (!bowl) return; look(bowl); const fakeFruit = (kind) => ({ kind, fruit: kind === 'slice' ? 'strawberry' : null }); for (let n = 0; n < 4; n++) { addTopping(bowl, fakeFruit(n % 2 ? 'blueberries' : 'strawberry')); SFX.plop(); await waitS(0.25); } return; }
    if (!b) return; look(b);
    if (/dust|icing/.test(t) || /icing/.test(R.deco || '')) { const ic = findK('icing'); if (ic) await toolOverSource(ic, b); b.dust = Math.max(b.dust, 0.6); b.dustDirty = true; if (!/strawberr|fruit/.test(t)) return; }
    const kind = /cocoa/.test(t) ? 'chip' : 'strawberry';
    for (let n = 0; n < 8; n++) { const a = n / 8 * TAU, r = (b.dims.rx || 0.08) * 0.6; addDeco(b, n % 3 === 2 ? 'rosette' : kind, b.p.x + Math.cos(a) * r, b.p.z + Math.sin(a) * r); SFX.plop(); await waitS(0.18); }
    return;
  }
  if (/plate and ring|ring the bell|set it on a plate|put it on a plate/.test(t)) {
    if (R.product === 'mousse') { const bowl = chillBowls()[0]; const pl = await plateReady(); if (bowl && pl) { await toDecor(null); look(pl); await flyTo(bowl, V3(pl.p.x, hostTop(pl), pl.p.z), 0.7); bowl.host = pl; bowl.hostOff = V3(0, 0, 0); bowl.zone = 'host'; } }
    else { let b = bakeObj(); if (!b && pan && pan.bake) { if (!onDecor(pan.p.x)) await toDecor(pan); await turnOutOnto(pan, await plateReady()); b = bakeObj(); } if (b && !(b.host && b.host.kind.startsWith('plate'))) { const pl = await plateReady(); if (pl) await moveBakeTo(b, pl); } }
    look({ p: V3(DX + 1.06, CT, 0.2), h: 0.1 }); await waitS(0.5); serve(); return;
  }
  if (/pour in the|pour in |add the .* to the (pie|pan|tin)/.test(t) && pan) {
    if (pan.zone !== 'counter') await placeOnCounter(pan, -0.25);
    for (const k of namedIngredients(text)) { const need = R.ing[k] - (pan.m.g[k] || 0); if (need > 0.5) await addIngredient(k, need, pan); } return;
  }
  // mixing / adding ingredients
  if (/mix|whisk|beat|fold|stir|rub|add the|combine/.test(t)) {
    const bowl = await bowlFor(t); if (!bowl) return;
    let ks = namedIngredients(text); if (/the rest|everything|remaining|all/.test(t) || !ks.length) ks = Object.keys(R.ing);
    ks = ks.filter(k => !(R.product === 'mousse' && false));
    for (const k of ks) { const need = R.ing[k] - (bowl.m.g[k] || 0); if (need > 0.5) await addIngredient(k, need, bowl); }
    await mixIn(bowl, /whisk|until pale/.test(t) ? 'whip' : /fold/.test(t) ? 'fold' : 'mix'); return;
  }
}
async function addIngredientToDough(dg, g) { const dish = findK('butter'); if (dish && dish.zone === 'fridge') { FRG.tgt = 1; await waitS(0.3); } const from = dish ? dish.p.clone() : V3(0.3, CT + 0.2, 0.05); if (dish) dish.grams = Math.max(0, dish.grams - g); const p = mk3('butterPiece', from.x, from.y + 0.05, from.z, 'auto', { g }); await flyTo(p, dg.center().add(V3(0, 0.05, 0)), 0.8); remove3(p); dg.lam = (dg.lam || 0) + g; dg.m.add('butter', g); SFX.plop(); FRG.tgt = 0; }
async function brushOver(pan) { if (!pan) return; const egg = findK('bowlS'); look(pan); await toolOver('brush', pan, 1.2, (tool, cc, raw) => { tool.p.set(cc.x - 0.08 + Math.sin(raw * 12) * 0.08, cc.y + 0.05, cc.z); }); pan.washed = true; }
async function sawLayers(b) { look(b); await toolOver('knife', b, 1.4, (tool, cc, raw) => { tool.p.set(cc.x - 0.15 + Math.sin(raw * 10) * 0.04, cc.y + (b.topY || b.h) * 0.5, cc.z); }); b.layers = Math.max(2, b.layers); b.fills = b.fills.slice(0, b.layers - 1); SFX.scrape(); }
async function sliceLoaf(b) { look(b); for (let s = b.sliced; s < 5; s++) { await toolOver('knife', b, 0.35, (tool, cc, raw) => { tool.p.set(cc.x + 0.1 - s * 0.022, cc.y + 0.01, cc.z - 0.06 + raw * 0.12); }); b.sliced = s + 1; SFX.scrape(); } }
async function toolOverSource(src, b) { const back = src.p.clone(), z = src.zone; await flyTo(src, b.p.clone().add(V3(0.04, (b.topY || b.h) + 0.15, 0)), 0.5); src.pdir = V3(-1, 0, 0); await animate(1.0, (k, raw) => { src.tilt = Math.min(1.8, raw * 3); applyTilt(src); if (Math.random() < 0.7) parts.push({ type: 'powder', p: lip3(src), v: V3((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.05), land: b.p.y + (b.topY || b.h), col: [255, 255, 255], life: 1.2 }); }); src.tilt = 0; applyTilt(src); await flyTo(src, back, 0.5); src.zone = z; src.p.copy(back); }

/* ---------- skip button & flow ---------- */
async function skipStep() {
  if (AUTO.busy || !recipe) return;
  const i = ticks.findIndex(t => !t); if (i < 0) return;
  if (held) { const it = held.it; held = null; it.tilt = 0; it.stream = null; settle3(it); }
  if (heldDough) releaseDough3(heldDough);
  AUTO.busy = true; AUTO.label = recipe.steps[i].t; AUTO.t = 0; MITT_WORN.v = false; FIX.mitt.visible = true;
  const savedView = view;
  try { await performStep(i); } catch (e) { console.error(e); }
  AUTO.stream = null; CLOCK.hold = false; MX.speed = 0;
  try { if (recipe && recipe.steps[i] && recipe.steps[i].c()) ticks[i] = true; } catch (_) { }
  if (recipe && !ticks[i]) ticks[i] = true;
  AUTO.busy = false; focusPinned = false;
  if (view === 'focus' || view === 'oven' || view === 'fridge') { view = 'work'; focusObj = null; }
  if (!scorecard) say('Step done. On to the next one.', 2);
}
const SKB = { hit: null };
function drawSkip() {
  SKB.hit = null; if (!recipe || scorecard || BOOK.open) return;
  if (AUTO.busy) {
    const w = Math.min(560, uiW - 40), x = uiW / 2 - w / 2, y = uiH - 96;
    ctx.fillStyle = 'rgba(38,34,30,.86)'; rr(x, y, w, 44, 12); ctx.fill();
    ctx.fillStyle = '#e0a43a'; const p = (AUTO.t * 0.9) % 1; rr(x + 10, y + 34, (w - 20) * p, 4, 2); ctx.fill();
    ctx.fillStyle = '#f6f2ec'; ctx.font = '600 13px Inter, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Doing it for you: ' + (AUTO.label.length > 70 ? AUTO.label.slice(0, 68) + '…' : AUTO.label), x + 12, y + 22);
    return;
  }
  if (ticks.every(t => t)) return;
  let x, y = 46;
  const fh = NFOLD.hits[0]; if (fh) { x = fh.act === 'fold' ? fh.x0 : fh.x1 + 8; y = fh.act === 'fold' ? 46 : 12; } else { x = 14; y = 12; }
  const label = 'Skip this step ⏭', tw = 120, hv = PT.has && PT.x > x && PT.x < x + tw && PT.y > y && PT.y < y + 26;
  ctx.fillStyle = hv ? '#3b3631' : 'rgba(59,54,49,.82)'; rr(x, y, tw, 26, 13); ctx.fill();
  ctx.fillStyle = '#fff8ec'; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + tw / 2, y + 17);
  SKB.hit = { x0: x, x1: x + tw, y0: y, y1: y + 26 };
}
const _onDownK = onDown3;
onDown3 = function () {
  if (AUTO.busy) return;
  if (SKB.hit && PT.x > SKB.hit.x0 && PT.x < SKB.hit.x1 && PT.y > SKB.hit.y0 && PT.y < SKB.hit.y1) { SFX.click(); skipStep(); return; }
  _onDownK();
};
const _hoverK = hover3;
hover3 = function () { if (AUTO.busy) return null; if (SKB.hit && PT.x > SKB.hit.x0 && PT.x < SKB.hit.x1 && PT.y > SKB.hit.y0 && PT.y < SKB.hit.y1) return 'Watch the kitchen do this step for you'; return _hoverK(); };
const _drawUIK = drawUI3;
drawUI3 = function () { _drawUIK(); ctx = UI.getContext('2d'); ctx.setTransform(uiDPR, 0, 0, uiDPR, 0, 0); drawSkip(); ctx = UI.getContext('2d'); };
const _hintK = hint3;
hint3 = function () { if (AUTO.busy) return ''; return _hintK(); };
// items mid-animation shouldn't be grabbed, judged or put away
const _visibleK = visible3;
visible3 = function (it) { if (it.zone === 'auto') return false; return _visibleK(it); };

if (FIX.bell) FIX.bell.position.set(DX + 1.06, CT, 0.2);
