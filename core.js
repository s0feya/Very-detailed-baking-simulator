'use strict';
/* Shared baking rules: recipes, mixing, baking, judging */
let items = [], doughs = [], parts = [], cracks = [], decals = [], patches = [];
let held = null, heldDough = null, drag = null, recipe = null, ticks = [], scorecard = null, toast = null, hintsShown = {};
let touchN = 1, uid = 1, judged = new Set();
function say(t, dur = 3.2) { toast = { t, life: dur }; }
function hintOnce(key, t) { if (hintsShown[key]) return; hintsShown[key] = 1; say(t, 4.5); }
/* ---------- recipes ---------- */
const near = (v, t, tol) => Math.abs(v - t) <= tol;
const allMixes = () => { const a = []; items.forEach(i => { if (i.m && i.m.total() > 0.5) a.push({ m: i.m, it: i }); }); doughs.forEach(d => a.push({ m: d.m, it: d })); return a; };
const anyMix = f => allMixes().some(o => f(o.m, o.it));
const RECIPES = [
  {
    id: 'sponge', name: 'Simple Sponge Cake', product: 'cake', pan: 'tin', temp: 180, time: 25,
    ing: { egg: 200, sugar: 120, flour: 120, bp: 4, butter: 40, milk: 60 },
    lines: ['4 eggs', '120 g caster sugar', '120 g plain flour', '4 g baking powder', '40 g soft butter', '60 g milk'],
    steps: [
      { t: 'Preheat the oven to 180 °C.', c: () => near(OV.set, 180, 10) },
      { t: 'Whisk the eggs and sugar until pale and thick (the mixer whisk is quickest).', c: () => anyMix(m => (m.g.egg || 0) > 140 && (m.g.sugar || 0) > 70 && m.whip > 0.6) },
      { t: 'Add the milk and soft butter.', c: () => anyMix(m => m.g.egg > 100 && m.g.milk > 30 && m.g.butter > 20) },
      { t: 'Fold in the flour and baking powder gently with the spatula.', c: () => anyMix(m => m.g.flour > 80 && m.g.egg > 100 && m.mix > 0.85) },
      { t: 'Pour the batter into the round tin.', c: () => items.some(i => i.kind === 'tin' && i.m.total() > 300) },
      { t: 'Bake for about 25 minutes until golden.', c: () => items.some(i => i.kind === 'tin' && i.bake && i.bake.b > 0.9) },
      { t: 'Cool on the wire rack.', c: () => !!scorecard },
    ]
  },
  {
    id: 'cookies', name: 'Chocolate Chip Cookies', product: 'cookies', pan: 'tray', temp: 180, time: 11,
    ing: { butter: 115, sugar: 100, egg: 50, flour: 180, bp: 4, salt: 2, chips: 120 },
    lines: ['115 g soft butter', '100 g sugar', '1 egg', '180 g plain flour', '4 g baking powder', '2 g salt', '120 g chocolate chips'],
    steps: [
      { t: 'Preheat the oven to 180 °C.', c: () => near(OV.set, 180, 10) },
      { t: 'Beat the butter and sugar together.', c: () => anyMix(m => m.g.butter > 70 && m.g.sugar > 60 && m.mix > 0.7) },
      { t: 'Beat in the egg.', c: () => anyMix(m => m.g.butter > 70 && m.g.egg > 30 && m.mix > 0.7) },
      { t: 'Mix in the flour, baking powder and salt.', c: () => anyMix(m => m.g.flour > 120 && m.g.butter > 70 && m.mix > 0.8) },
      { t: 'Stir in the chocolate chips.', c: () => anyMix(m => m.g.chips > 70 && m.g.flour > 100 && m.mix > 0.8) },
      { t: 'Scoop about 12 heaped tablespoons onto the tray.', c: () => items.some(i => i.kind === 'tray' && i.balls.length >= 9) },
      { t: 'Bake for about 11 minutes.', c: () => items.some(i => i.kind === 'tray' && i.bake && i.bake.b > 0.9) },
      { t: 'Cool on the wire rack.', c: () => !!scorecard },
    ]
  },
  {
    id: 'bread', name: 'Sandwich Loaf', product: 'bread', pan: 'loaf', temp: 200, time: 30,
    ing: { flour: 400, water: 250, yeast: 7, salt: 8, sugar: 15, butter: 25 },
    lines: ['400 g plain flour', '250 g water', '7 g dry yeast', '8 g salt', '15 g sugar', '25 g butter'],
    steps: [
      { t: 'Mix everything into a rough dough (spatula, or the mixer’s dough hook).', c: () => anyMix(m => m.g.flour > 250 && m.g.water > 150 && m.g.yeast > 2 && m.mix > 0.6) },
      { t: 'Knead until smooth and stretchy: dough hook, or by hand on a floured counter.', c: () => anyMix(m => m.g.flour > 250 && m.knead > 0.75) },
      { t: 'Let it rise in a bowl until doubled, about 45 minutes.', c: () => anyMix(m => m.g.flour > 250 && m.proof > 0.8) },
      { t: 'Shape it into the loaf pan.', c: () => items.some(i => i.kind === 'loaf' && i.m.form() === 'dough') },
      { t: 'Preheat the oven to 200 °C.', c: () => near(OV.set, 200, 10) },
      { t: 'Bake for about 30 minutes.', c: () => items.some(i => i.kind === 'loaf' && i.bake && i.bake.b > 0.9) },
      { t: 'Cool on the wire rack.', c: () => !!scorecard },
    ]
  },
];
const CARD_POS = [{ x: 878, rot: -0.06 }, { x: 950, rot: 0.02 }, { x: 1022, rot: 0.07 }];
const CARD_S = { w: 64, h: 86 }, CARD_PIN = { x: 950, w: 92, h: 124 };

function handMix(m, mv, type) {
  const t = m.total(); if (t < 1 || mv < 0.4) return;
  const f = m.form(), sz = Math.sqrt(Math.max(1, t / 300));
  if (type === 'whisk') {
    if (['dough', 'shaggy', 'cookie'].includes(f) && (m.g.flour || 0) > t * 0.3) { m.mix = Math.min(1, m.mix + mv * 0.00012); hintOnce('clog', 'The dough is clogging the whisk. Try the spatula, or the dough hook on the mixer.'); }
    else {
      m.mix = Math.min(1, m.mix + mv * 0.0011 / sz);
      if ((m.g.flour || 0) < t * 0.05 && m.g.egg) m.whip = Math.min(1, m.whip + mv * 0.00008 * (m.g.sugar ? 1 : 0.6) / sz);
      else if (m.g.flour && m.whip > 0) m.whip = Math.max(0, m.whip - mv * 0.00003);
    }
  } else m.mix = Math.min(1, m.mix + mv * 0.0009 / sz);
  m.yolk = Math.max(0, m.yolk - mv * 0.004 / sz); m.swirl += mv * 0.02;
  if (Math.random() < mv * 0.004) sNoise(0.06, type === 'whisk' ? 3500 : 900, 2, 0.08);
}
function trayMix(tray) { const m = new Mix(); tray.balls.forEach(b => m.merge(b.m)); return m; }
function bakeStep(it, dtMin) {
  const m = it.kind === 'tray' ? null : it.m;
  if (!it.bake) {
    if (OV.temp < 60) return;
    let type = null;
    if (it.kind === 'tray') { if (!it.balls.length) return; type = 'cookies'; }
    else { const f = m.form(); if (m.total() < 20) return; type = f === 'batter' || f === 'lumpy' ? 'cake' : f === 'cookie' ? 'cookies' : (f === 'dough' || f === 'shaggy') ? 'bread' : null; if (!type) return; }
    const R = RECIPES.find(r => r.product === type);
    const mm = it.kind === 'tray' ? trayMix(it) : m;
    it.bake = { type, b: 0, brown: 0, rise: 0, spread: clamp(0.35 + ((mm.g.butter || 0) / (mm.g.flour || 1)) * 0.65, 0.25, 1.2), ideal: R.temp, time: R.time, tsum: 0, ttime: 0 };
  }
  const bk = it.bake, h = clamp((OV.temp - 100) / (bk.ideal - 100), 0, 2);
  bk.b += h * dtMin / bk.time; bk.brown += Math.pow(h, 1.7) * dtMin / bk.time;
  if (OV.temp > 80) { bk.tsum += OV.temp * dtMin; bk.ttime += dtMin; }
  if (bk.type === 'cake' && m) { const bpF = clamp(((m.g.bp || 0) / (m.g.flour || 1)) / 0.033, 0, 1.6); const riseMax = clamp(0.12 + m.whip * 0.7 + Math.min(bpF, 1.2) * 0.3, 0.08, 1.25); bk.rise = riseMax * sstep(0.05, 0.65, bk.b) * (bk.b > 1.6 ? 0.92 : 1); }
  if (bk.type === 'bread' && m) bk.rise = 0.25 * sstep(0.05, 0.5, bk.b) * clamp(m.knead, 0.3, 1) * (m.proof > 1.7 ? 0.3 : 1);
}
const MISSING = { bp: 'No baking powder, so it barely rose.', yeast: 'No yeast, so the bread never rose.', egg: 'No egg, so it’s crumbly.', sugar: 'No sugar, so it’s bland.', salt: 'No salt, so it tastes flat.', butter: 'No butter, so it’s dry.', milk: 'No milk; a bit dry.', water: 'No water in the dough.', chips: 'Forgot the chocolate chips!' };
function judge(it) {
  const bk = it.bake, prod = bk.type;
  const R = (recipe && recipe.product === prod) ? recipe : RECIPES.find(r => r.product === prod);
  const m = it.kind === 'tray' ? trayMix(it) : it.m;
  const notes = [], good = []; const fl = m.g.flour || 0;
  let ing = 1;
  if (fl < 5) { ing = 0; notes.push('No flour went in, so nothing could set.'); }
  else {
    const sc = R.ing.flour / fl, pens = [];
    for (const k in R.ing) {
      if (k === 'flour') continue; const want = R.ing[k], have = (m.g[k] || 0) * sc;
      if (have < 0.06 * want) { pens.push({ p: 1, txt: MISSING[k] }); continue; }
      const dev = Math.log(have / want), tol = ['salt', 'bp', 'yeast'].includes(k) ? 0.3 : 0.17;
      const p = clamp((Math.abs(dev) - tol) / (tol * 2.5), 0, 1);
      if (p > 0) pens.push({ p, txt: `${dev > 0 ? 'Too much' : 'Not enough'} ${ING[k].n}: about ${Math.round(have)} g against ${want} g.` });
    }
    for (const k in m.g) if (!(k in R.ing) && m.g[k] * sc > R.ing.flour * 0.03) pens.push({ p: 0.5, txt: `There’s ${ING[k].n} in it, and the recipe doesn’t call for any.` });
    pens.sort((a, b) => b.p - a.p); ing = clamp(1 - pens.reduce((s, x) => s + x.p * 0.3, 0), 0, 1);
    pens.slice(0, 2).forEach(x => notes.push(x.txt));
    if (!pens.length) good.push('Measurements spot on.');
    const ratio = m.total() / Object.values(R.ing).reduce((a, b) => a + b, 0);
    if (ratio < 0.55) notes.push('A small batch: some of the mix was left behind.');
  }
  let proc = 1;
  if (prod === 'cake' && R.whip !== false) { if (m.whip < 0.45) { proc -= 0.5; notes.push('The eggs weren’t whisked to a pale foam, so the sponge is dense.'); } else if (m.whip < 0.62) { proc -= 0.2; notes.push('The eggs could have been whisked a little longer.'); } else good.push('Light, airy crumb from well-whipped eggs.'); if (m.mix < 0.8) { proc -= 0.35; notes.push('The batter wasn’t fully mixed, so there are flour streaks.'); } }
  if (prod === 'cookies') { if (m.mix < 0.8) { proc -= 0.4; notes.push('The dough wasn’t mixed evenly.'); } const n = it.balls ? it.balls.length : 1; if (it.balls && n < 8) { proc -= 0.2; notes.push(`Only ${n} cookie${n === 1 ? '' : 's'}; the recipe makes about 12.`); } else if (it.balls && m.total() / n > 70) { proc -= 0.15; notes.push('Very big cookies; they spread into each other.'); } else good.push('Nicely portioned cookies.'); }
  if (prod === 'bread') { if (m.knead < 0.5) { proc -= 0.45; notes.push('Under-kneaded, so the crumb is tight and heavy.'); } else if (m.knead < 0.75) { proc -= 0.15; notes.push('It could have used a bit more kneading.'); } else good.push('Well kneaded, springy crumb.'); if (m.proof < 0.6) { proc -= 0.35; notes.push('It didn’t rise for long enough, so it’s dense.'); } else if (m.proof > 1.7) { proc -= 0.35; notes.push('Over-proofed: the loaf sagged in the oven.'); } else good.push('A good rise.'); }
  if (m.shell > 0) { proc -= 0.25; notes.push('Crunch! There’s a bit of eggshell in it.'); }
  let bake = 1; const b = bk.b, br = bk.brown;
  const cold = prod === 'chilled' || prod === 'mousse';
  if (cold) { if ((m.chill || 0) < 0.7) { bake -= 0.6; notes.push('It hadn’t set yet. It needed longer in the fridge.'); } else if ((m.chill || 0) < 1) { bake -= 0.2; notes.push('A little soft. Give it a bit longer to chill.'); } else good.push('Set beautifully in the fridge.'); }
  else {
  if (b < 0.7) { bake -= 0.7; notes.push('Raw in the middle. It needed more time.'); }
  else if (b < 0.9) { bake -= 0.3; notes.push('Slightly underbaked in the centre.'); }
  if (br > 1.8) { bake -= 0.7; notes.push('Burnt on top.'); }
  else if (br > 1.4) { bake -= 0.35; notes.push('Over-browned. Take it out a few minutes sooner.'); }
  else if (br < 0.55) { bake -= 0.3; notes.push('A pale crust. It needs more heat or time.'); }
  else if (b >= 0.9) good.push('Golden and baked through.');
  }
  const avgT = bk.tsum / Math.max(0.01, bk.ttime);
  if (!cold && bk.ttime > 2 && avgT > R.temp + 25) notes.push(`The oven ran hot: about ${Math.round(avgT)} °C on average.`);
  else if (!cold && bk.ttime > 2 && avgT < R.temp - 25) notes.push(`The oven ran cool: about ${Math.round(avgT)} °C on average.`);
  bake = clamp(bake, 0, 1); proc = clamp(proc, 0, 1);
  const total = 0.4 * ing + 0.25 * proc + 0.35 * bake, stars = Math.round(total * 10) / 2;
  scorecard = { it, R, stars, notes: notes.slice(0, 4), good: good.slice(0, 3), t: 0 };
  SFX.ding();
}
function wrapText(t, x, y, maxW) { const words = t.split(' '), out = []; let line = ''; words.forEach(w => { const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW) { out.push(line); line = w; } else line = tt; }); if (line) out.push(line); return out; }
function star(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); }
