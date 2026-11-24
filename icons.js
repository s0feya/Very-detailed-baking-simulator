'use strict';
/* =========================================================
   Cookbook pictures: each recipe shows what the finished bake
   should look like, painted on a little plate.
   ========================================================= */

const ICON = {
  sponge: { base: 'round', side: 'layers', sponge: '#e9c27c', fill: '#fff8ec', top: '#fff8ec', deco: ['rosettes', 'strawRing', 'strawCentre'] },
  roll: { base: 'roll', sponge: '#e7bd72', dust: true, deco: ['rowStraw'] },
  cookies: { base: 'cookies', col: '#cf9a55', chips: true },
  bread: { base: 'loafBread', col: '#c98b45' },
  shortbread: { base: 'fingers', col: '#efd29a' },
  brownies: { base: 'brownies', col: '#4a2c1c', dust: true },
  cheesecake: { base: 'cheesecake', deco: ['berryTop'] },
  quatre: { base: 'loafCake', col: '#d9a35b', crumb: '#f2d08a' },
  mousse: { base: 'cup', layers: ['#6b3f2a'], topping: '#7a4a32', deco: ['raspberry'] },
  tiramisu: { base: 'cup', layers: ['#f3e6cc', '#8a5a3a', '#f3e6cc'], topping: '#6b4026' },
  schoko: { base: 'loafCake', col: '#5b3522', crumb: '#6e432c', dust: true },
  kanel: { base: 'loafBread', col: '#b87a3e', swirl: true },
  polvorones: { base: 'domes', col: '#f3e2c0', dust: true },
  castella: { base: 'castella' },
  nankhatai: { base: 'cookies', col: '#e6bd78', cracks: true },
  anzac: { base: 'cookies', col: '#c9904b', oats: true },
  pots: { base: 'cup', layers: ['#fff6ea'], topping: '#fff6ea', deco: ['strawCup'] },
  croissant: { base: 'croissants' },
  pie: { base: 'pie' },
  sourdough: { base: 'boule' },
  madeleines: { base: 'madeleines', dust: true },
  caneles: { base: 'caneles' },
  shortcake: { base: 'round', side: 'frosted', deco: ['rosettes', 'strawWholeRing', 'strawCentre'] },
  blackforest: { base: 'round', side: 'frosted', shavings: true, deco: ['rosettes', 'cherries', 'chipsCentre'] },
  drip: { base: 'round', side: 'frosted', drip: '#3d2416', deco: ['sprinkles'] },
  chantilly: { base: 'round', side: 'frosted', deco: ['shellBorder', 'strawCentreRing'] },
  lunchbox: { base: 'round', side: 'frosted', frost: '#fbe3e6', small: true, deco: ['wavyBorder', 'heart'] },
  celebration: { base: 'round', side: 'frosted', deco: ['lattice', 'shellBorder', 'blueberries'] },
  crepes: { base: 'crepes', sauce: '#3d2416', deco: ['crepeStraw'] },
  creamcrepes: { base: 'crepes', deco: ['crepeRosettes', 'crepeStraw'] },
  millecrepe: { base: 'millecrepe', dust: true, deco: ['strawCentreRing'] },
};

const IC = {
  lg(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; },
  rg(x, y, r, stops) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; },
  ell(x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); },
  shade(c, k) { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, f = v => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; },
  seed: 1, rnd() { IC.seed = (IC.seed * 16807) % 2147483647; return IC.seed / 2147483647; },
};
function icPlate(y = 22, rx = 40, ry = 11) {
  IC.ell(0, y + 2, rx + 1, ry + 1, 'rgba(60,40,20,.18)');
  IC.ell(0, y, rx, ry, IC.lg(0, y - ry, 0, y + ry, [[0, '#ffffff'], [1, '#e9e3da']]));
  IC.ell(0, y - 1, rx * 0.72, ry * 0.68, '#f6f2ec');
}
function icStraw(x, y, s = 1, whole = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = IC.lg(0, -5, 0, 5, [[0, '#ff5a5f'], [1, '#c81d2b']]); ctx.beginPath(); ctx.moveTo(0, whole ? 6 : 4); ctx.bezierCurveTo(-6, 2, -5, -4, 0, -4); ctx.bezierCurveTo(5, -4, 6, 2, 0, whole ? 6 : 4); ctx.fill();
  if (!whole) { ctx.fillStyle = 'rgba(255,220,220,.75)'; ctx.beginPath(); ctx.ellipse(0, 0, 2, 2.8, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffe9a0'; for (let i = 0; i < 4; i++) ctx.fillRect(-2.5 + (i % 2) * 4, -1.5 + (i >> 1) * 3, 0.8, 0.8);
  if (whole) { ctx.fillStyle = '#3f8a3a'; ctx.beginPath(); ctx.moveTo(-3.5, -4); ctx.lineTo(0, -6.5); ctx.lineTo(3.5, -4); ctx.lineTo(0, -3); ctx.fill(); }
  ctx.restore();
}
function icRosette(x, y, s = 1, col = '#fffaf0') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  IC.ell(0, 1.5, 4.6, 2.2, 'rgba(120,90,60,.18)');
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-4.5, 1); ctx.quadraticCurveTo(-4.5, -3, -1, -4); ctx.quadraticCurveTo(0, -7, 1, -4); ctx.quadraticCurveTo(4.5, -3, 4.5, 1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(170,140,110,.45)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-2, -3.5, 0, -5.5); ctx.moveTo(3, 0); ctx.quadraticCurveTo(2, -3.5, 0, -5.5); ctx.moveTo(0, 0.5); ctx.lineTo(0, -4); ctx.stroke();
  ctx.restore();
}
function icBerry(x, y, col = '#2c3a78', r = 2.4) { IC.ell(x, y, r, r, IC.rg(x - r * 0.4, y - r * 0.4, r * 1.6, [[0, IC.shade(col, 0.35)], [1, col]])); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - r * 0.5, y - r * 0.6, 0.9, 0.9); }
function icCherry(x, y) { icBerry(x, y, '#8c0f1d', 3); ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y - 2.5); ctx.quadraticCurveTo(x + 2, y - 7, x + 4, y - 8); ctx.stroke(); }

/* a round cake seen from the front at a slight angle */
function icRound(S) {
  const rx = S.small ? 25 : 30, ry = rx * 0.34, h = S.small ? 20 : 24, top = -8, bot = top + h;
  icPlate(bot + 3);
  const frost = S.frost || '#fffaf1', sp = S.sponge || '#e6bd74';
  // side
  if (S.base === 'millecrepe') {
    ctx.save(); ctx.beginPath(); ctx.rect(-rx, top, rx * 2, h); ctx.ellipse(0, bot, rx, ry, 0, 0, Math.PI); ctx.clip();
    const n = 14; for (let i = 0; i < n; i++) { const y = top + i * h / n; ctx.fillStyle = i % 2 ? '#fff7ea' : '#e7b86c'; ctx.fillRect(-rx, y, rx * 2, h / n + 0.6); }
    ctx.fillStyle = IC.lg(-rx, 0, rx, 0, [[0, 'rgba(0,0,0,.12)'], [0.4, 'rgba(255,255,255,.08)'], [1, 'rgba(0,0,0,.18)']]); ctx.fillRect(-rx, top, rx * 2, h + ry);
    ctx.restore();
  } else {
    ctx.save(); ctx.beginPath(); ctx.rect(-rx, top, rx * 2, h); ctx.ellipse(0, bot, rx, ry, 0, 0, Math.PI); ctx.clip();
    if (S.side === 'layers') { const lh = h / 3; for (let i = 0; i < 3; i++) { ctx.fillStyle = sp; ctx.fillRect(-rx, top + i * lh, rx * 2, lh); ctx.fillStyle = S.fill || '#fff8ec'; if (i < 2) ctx.fillRect(-rx, top + (i + 1) * lh - 1.6, rx * 2, 3.2); } ctx.fillStyle = S.fill; ctx.fillRect(-rx, top, rx * 2, 2.5); }
    else { ctx.fillStyle = frost; ctx.fillRect(-rx, top, rx * 2, h + ry); }
    ctx.fillStyle = IC.lg(-rx, 0, rx, 0, [[0, 'rgba(0,0,0,.14)'], [0.35, 'rgba(255,255,255,.1)'], [1, 'rgba(0,0,0,.2)']]); ctx.fillRect(-rx, top, rx * 2, h + ry);
    if (S.shavings) { IC.seed = 7; ctx.fillStyle = '#4a2a1a'; for (let i = 0; i < 40; i++) { const x = (IC.rnd() * 2 - 1) * rx, y = top + 4 + IC.rnd() * (h - 2); ctx.fillRect(x, y, 1.6, 0.9); } }
    ctx.restore();
  }
  // drip down the side
  if (S.drip) { IC.seed = 3; ctx.fillStyle = S.drip; for (let i = 0; i <= 12; i++) { const x = -rx + 2 + i * (rx * 2 - 4) / 12, len = 4 + IC.rnd() * 9, yy = top + Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * ry; ctx.beginPath(); ctx.moveTo(x - 1.8, yy - 1); ctx.lineTo(x - 1.8, yy + len); ctx.arc(x, yy + len, 1.8, Math.PI, 0, true); ctx.lineTo(x + 1.8, yy - 1); ctx.fill(); } }
  // top
  const topCol = S.base === 'millecrepe' ? '#eebd72' : S.drip ? S.drip : S.side === 'layers' ? (S.top || frost) : frost;
  IC.ell(0, top, rx, ry, topCol);
  if (S.base === 'millecrepe') { ctx.save(); ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.clip(); IC.seed = 11; for (let i = 0; i < 60; i++) { const x = (IC.rnd() * 2 - 1) * rx, y = top + (IC.rnd() * 2 - 1) * ry; IC.ell(x, y, 2 + IC.rnd() * 3, 1 + IC.rnd() * 1.4, 'rgba(176,104,40,.25)'); } ctx.restore(); }
  if (S.drip) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-rx * 0.3, top - ry * 0.3, rx * 0.35, ry * 0.25, -0.2, 0, TAU); ctx.fill(); }
  if (S.dust) { IC.seed = 5; ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 90; i++) { const a = IC.rnd() * TAU, r = Math.sqrt(IC.rnd()); ctx.fillRect(Math.cos(a) * r * rx * 0.95, top + Math.sin(a) * r * ry * 0.95, 0.8, 0.8); } }
  icTopDeco(S, rx, ry, top);
}
function icTopDeco(S, rx, ry, top) {
  const at = (a, r) => [Math.cos(a) * rx * r, top + Math.sin(a) * ry * r];
  const items = [];
  for (const d of S.deco || []) {
    if (d === 'rosettes') for (let i = 0; i < 10; i++) { const [x, y] = at(i / 10 * TAU, 0.8); items.push([y, () => icRosette(x, y, 0.85)]); }
    if (d === 'strawRing') for (let i = 0; i < 7; i++) { const [x, y] = at(i / 7 * TAU + 0.3, 0.45); items.push([y, () => icStraw(x, y, 0.75)]); }
    if (d === 'strawWholeRing') for (let i = 0; i < 10; i++) { const [x, y] = at(i / 10 * TAU, 0.8); items.push([y + 0.1, () => icStraw(x, y - 4, 0.7, true)]); }
    if (d === 'strawCentre') { const [x, y] = at(0, 0); items.push([y + 0.2, () => icStraw(x, y - 2, 1, true)]); }
    if (d === 'strawCentreRing') { for (let i = 0; i < 6; i++) { const [x, y] = at(i / 6 * TAU, 0.35); items.push([y, () => icStraw(x, y, 0.7)]); } const [x, y] = at(0, 0); items.push([y + 0.2, () => icStraw(x, y - 2, 0.9, true)]); }
    if (d === 'cherries') for (let i = 0; i < 10; i += 2) { const [x, y] = at(i / 10 * TAU, 0.8); items.push([y + 0.1, () => icCherry(x, y - 4)]); }
    if (d === 'chipsCentre') { IC.seed = 9; for (let i = 0; i < 16; i++) { const r = 0.55 * Math.sqrt((i + 0.5) / 16), a = i * 2.4, [x, y] = at(a, r); items.push([y, () => { ctx.fillStyle = '#3a2214'; ctx.beginPath(); ctx.moveTo(x, y - 1.6); ctx.lineTo(x - 1.4, y + 0.8); ctx.lineTo(x + 1.4, y + 0.8); ctx.fill(); }]); } }
    if (d === 'sprinkles') { IC.seed = 13; const cols = ['#ff6f91', '#ffd166', '#6fd3ff', '#8be38b', '#c39bff', '#ffffff']; for (let i = 0; i < 46; i++) { const r = 0.8 * Math.sqrt((i + 0.5) / 46), a = i * 2.4, [x, y] = at(a, r); items.push([y, () => { ctx.save(); ctx.translate(x, y); ctx.rotate(IC.rnd() * Math.PI); ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-1.5, -0.5, 3, 1); ctx.restore(); }]); } }
    if (d === 'shellBorder' || d === 'wavyBorder') for (let i = 0; i < 22; i++) { const a = i / 22 * TAU, [x, y] = at(a, 0.88); items.push([y, () => { IC.ell(x, y, d === 'wavyBorder' ? 3.2 : 2.8, 1.8, '#fffdf8'); ctx.strokeStyle = 'rgba(170,140,110,.4)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.5, 0, Math.PI, TAU); ctx.stroke(); }]); }
    if (d === 'lattice') items.push([top - ry, () => { ctx.save(); ctx.beginPath(); ctx.ellipse(0, top, rx * 0.72, ry * 0.72, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = 1.8; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 7 - 12, top - ry); ctx.lineTo(k * 7 + 12, top + ry); ctx.stroke(); ctx.beginPath(); ctx.moveTo(k * 7 + 12, top - ry); ctx.lineTo(k * 7 - 12, top + ry); ctx.stroke(); } ctx.restore(); }]);
    if (d === 'blueberries') for (let i = 0; i < 6; i++) { const [x, y] = at(i / 6 * TAU + 0.5, 0.4); items.push([y, () => icBerry(x, y)]); }
    if (d === 'heart') items.push([top, () => { ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = 2; ctx.beginPath(); const s = 0.5; for (let k = 0; k <= 40; k++) { const t = k / 40 * TAU, x = 16 * Math.sin(t) ** 3 * s, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s * 0.32; k ? ctx.lineTo(x, top + y) : ctx.moveTo(x, top + y); } ctx.stroke(); }]);
  }
  items.sort((a, b) => a[0] - b[0]).forEach(f => f[1]());
}

/* ---------- other shapes ---------- */
function icLoaf(S, bread) {
  icPlate(20);
  const w = 30, h = bread ? 22 : 16, d = 9, x0 = -w + 2, y0 = 16 - h;
  const col = S.col || '#d9a35b';
  ctx.fillStyle = IC.shade(col, -0.25); ctx.beginPath(); ctx.moveTo(x0 + w * 2, y0); ctx.lineTo(x0 + w * 2 + d, y0 - d * 0.6); ctx.lineTo(x0 + w * 2 + d, 16 - d * 0.6); ctx.lineTo(x0 + w * 2, 16); ctx.fill();
  ctx.fillStyle = IC.lg(0, y0, 0, 16, [[0, col], [1, IC.shade(col, -0.2)]]); ctx.fillRect(x0, y0, w * 2, h);
  ctx.fillStyle = IC.shade(col, 0.12); ctx.beginPath(); ctx.moveTo(x0, y0); if (bread) ctx.bezierCurveTo(x0 + 6, y0 - 12, x0 + w * 2 + d - 6, y0 - 12 - d * 0.6, x0 + w * 2 + d, y0 - d * 0.6); else ctx.lineTo(x0 + w * 2 + d, y0 - d * 0.6); ctx.lineTo(x0 + w * 2, y0); ctx.closePath(); if (!bread) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + d, y0 - d * 0.6); ctx.lineTo(x0 + w * 2 + d, y0 - d * 0.6); ctx.lineTo(x0 + w * 2, y0); } ctx.fill();
  if (!bread) { ctx.strokeStyle = IC.shade(col, -0.3); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0 + 10, y0 - 3); ctx.quadraticCurveTo(x0 + w, y0 - 6, x0 + w * 2 - 4, y0 - 3); ctx.stroke(); }
  // slices in front
  const crumb = S.crumb || (bread ? '#f3dcae' : '#f2d08a');
  for (let i = 0; i < (bread ? 2 : 1); i++) { const sx = x0 - 9 + i * 7, sy = y0 + 4; ctx.fillStyle = col; rr(sx - 1, sy - 1, 14, h - 2, 4); ctx.fill(); ctx.fillStyle = crumb; rr(sx, sy, 12, h - 4, 3); ctx.fill(); if (S.swirl) { ctx.strokeStyle = '#8a5326'; ctx.lineWidth = 1.1; ctx.beginPath(); for (let t = 0; t < 10; t += 0.3) ctx.lineTo(sx + 6 + Math.cos(t) * t * 0.5, sy + (h - 4) / 2 + Math.sin(t) * t * 0.6); ctx.stroke(); } }
  if (S.dust) { IC.seed = 4; ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) ctx.fillRect(x0 + IC.rnd() * w * 2 + IC.rnd() * d, y0 - IC.rnd() * d * 0.6, 0.8, 0.8); }
}
function icCookies(S) {
  icPlate(20);
  const pos = [[-15, 6], [13, 6], [-1, 13]];
  pos.forEach(([x, y], i) => {
    IC.ell(x, y + 2, 14, 5.5, 'rgba(80,50,20,.25)'); IC.ell(x, y, 14, 6, IC.rg(x - 4, y - 2, 16, [[0, IC.shade(S.col, 0.15)], [1, IC.shade(S.col, -0.15)]]));
    IC.seed = 20 + i;
    if (S.chips) { ctx.fillStyle = '#3a2214'; for (let k = 0; k < 7; k++) IC.ell(x + (IC.rnd() * 2 - 1) * 9, y + (IC.rnd() * 2 - 1) * 3.5, 1.6, 1.1, '#3a2214'); }
    if (S.cracks) { ctx.strokeStyle = IC.shade(S.col, -0.3); ctx.lineWidth = 0.8; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 5, y - 2); ctx.lineTo(x - 4 + k * 5, y + 2); ctx.stroke(); } }
    if (S.oats) { for (let k = 0; k < 10; k++) IC.ell(x + (IC.rnd() * 2 - 1) * 9, y + (IC.rnd() * 2 - 1) * 3.5, 1.8, 0.8, 'rgba(255,236,190,.7)'); }
  });
}
function icFingers(S) { icPlate(20); for (let i = 0; i < 3; i++) { const x = -22 + i * 15, y = 6 + i * 2; ctx.fillStyle = 'rgba(80,50,20,.2)'; rr(x + 1, y + 2, 13, 9, 2); ctx.fill(); ctx.fillStyle = IC.lg(0, y, 0, y + 9, [[0, S.col], [1, IC.shade(S.col, -0.15)]]); rr(x, y, 13, 9, 2); ctx.fill(); ctx.fillStyle = IC.shade(S.col, -0.3); for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) ctx.fillRect(x + 3 + k * 3.5, y + 3 + j * 3, 0.9, 0.9); } }
function icDomes(S) { icPlate(20); [[-15, 8], [13, 8], [-1, 14], [0, 3]].forEach(([x, y]) => { IC.ell(x, y + 2, 9, 4, 'rgba(80,50,20,.2)'); ctx.fillStyle = IC.rg(x - 3, y - 4, 12, [[0, '#fffaf0'], [1, S.col]]); ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0, 0, Math.PI); ctx.ellipse(x, y, 9, 7, 0, Math.PI, TAU); ctx.fill(); }); }
function icBrownies() { icPlate(20); [[-12, 4], [10, 6], [-1, 12]].forEach(([x, y]) => { ctx.fillStyle = '#2c180e'; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.lineTo(x + 10, y + 7); ctx.lineTo(x - 10, y + 7); ctx.fill(); ctx.fillStyle = '#5a3624'; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 6, y - 4); ctx.lineTo(x + 14, y - 4); ctx.lineTo(x + 10, y); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.85)'; IC.seed = x * 7 + 99; for (let i = 0; i < 18; i++) ctx.fillRect(x - 8 + IC.rnd() * 20, y - 3.5 + IC.rnd() * 3, 0.8, 0.8); }); }
function icCheesecake(S) {
  const rx = 30, ry = 10, top = -4, h = 20, bot = top + h; icPlate(bot + 3);
  ctx.save(); ctx.beginPath(); ctx.rect(-rx, top, rx * 2, h); ctx.ellipse(0, bot, rx, ry, 0, 0, Math.PI); ctx.clip(); ctx.fillStyle = '#fbf1dc'; ctx.fillRect(-rx, top, rx * 2, h + ry); ctx.fillStyle = '#b07a44'; ctx.fillRect(-rx, bot - 5, rx * 2, 5 + ry); ctx.fillStyle = IC.lg(-rx, 0, rx, 0, [[0, 'rgba(0,0,0,.12)'], [0.4, 'rgba(255,255,255,.1)'], [1, 'rgba(0,0,0,.18)']]); ctx.fillRect(-rx, top, rx * 2, h + ry); ctx.restore();
  IC.ell(0, top, rx, ry, '#c2182a'); IC.ell(-8, top - 3, 10, 2.4, 'rgba(255,255,255,.25)');
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; icBerry(Math.cos(a) * rx * 0.5, top + Math.sin(a) * ry * 0.5, '#7a0f22', 2.4); }
}
function icCup(S) {
  icPlate(22, 30, 8);
  ctx.save(); ctx.beginPath(); ctx.moveTo(-17, -10); ctx.lineTo(17, -10); ctx.lineTo(12, 20); ctx.lineTo(-12, 20); ctx.closePath(); ctx.clip();
  const L = S.layers, lh = 26 / L.length; L.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-20, -6 + i * lh, 40, lh + 1); });
  ctx.fillStyle = S.topping; ctx.fillRect(-20, -10, 40, 5); ctx.restore();
  ctx.strokeStyle = 'rgba(200,220,230,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(-12, 20); ctx.lineTo(12, 20); ctx.lineTo(17, -12); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-14, -8, 2, 24);
  if ((S.deco || []).includes('raspberry')) { icBerry(-3, -13, '#b0142b', 3.2); icRosette(6, -11, 0.9); }
  if ((S.deco || []).includes('strawCup')) { icStraw(-5, -13, 1, true); icStraw(5, -12, 0.85); }
  if (S === ICON.tiramisu) { IC.seed = 3; ctx.fillStyle = 'rgba(60,30,15,.6)'; for (let i = 0; i < 40; i++) ctx.fillRect(-15 + IC.rnd() * 30, -10 + IC.rnd() * 4, 0.9, 0.9); }
}
function icCroissants() { icPlate(20); [[-11, 8, -0.3], [11, 10, 0.25]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); for (let k = -3; k <= 3; k++) { const w = 6 - Math.abs(k) * 1.2, xx = k * 3.6; IC.ell(xx, Math.abs(k) * 1.4, w * 0.8 + 1, w, IC.rg(xx - 1, -2, w * 1.6, [[0, '#f0bb62'], [1, '#b5702c']])); } ctx.restore(); }); }
function icPie() {
  const rx = 32, ry = 11, top = -2; icPlate(14);
  IC.ell(0, top + 6, rx, ry, '#c58a4a'); IC.ell(0, top, rx, ry, '#d79b55'); IC.ell(0, top, rx * 0.86, ry * 0.86, '#7a1530');
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, top, rx * 0.86, ry * 0.86, 0, 0, TAU); ctx.clip(); ctx.fillStyle = '#e3aa62'; for (let k = -4; k <= 4; k++) { ctx.save(); ctx.translate(k * 7, top); ctx.fillRect(-2, -ry, 4, ry * 2); ctx.restore(); } for (let k = -2; k <= 2; k++) ctx.fillRect(-rx, top + k * 4 - 1.5, rx * 2, 3); ctx.restore();
  ctx.strokeStyle = '#b8783a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, top, rx * 0.93, ry * 0.93, 0, 0, TAU); ctx.stroke();
}
function icBoule() { icPlate(20); ctx.fillStyle = IC.rg(-8, -6, 36, [[0, '#d9a050'], [0.7, '#a8652a'], [1, '#7a4419']]); ctx.beginPath(); ctx.ellipse(0, 14, 28, 6, 0, 0, Math.PI); ctx.ellipse(0, 14, 28, 24, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = '#f3dcae'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-14, -2); ctx.quadraticCurveTo(0, -8, 14, -2); ctx.stroke(); IC.seed = 2; ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 50; i++) ctx.fillRect(-20 + IC.rnd() * 40, -8 + IC.rnd() * 14, 1, 1); }
function icMadeleines() { icPlate(20); [[-14, 8, -0.2], [12, 8, 0.2], [0, 13, 0]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = IC.rg(0, -3, 14, [[0, '#f2c271'], [1, '#c4843c']]); ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(140,80,30,.45)'; ctx.lineWidth = 0.8; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(k * 3, -6); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.75)'; IC.seed = 8 + x; for (let i = 0; i < 25; i++) ctx.fillRect(-9 + IC.rnd() * 18, -5 + IC.rnd() * 10, 0.8, 0.8); ctx.restore(); }); }
function icCaneles() { icPlate(20); [[-14, 6], [14, 6], [0, 11]].forEach(([x, y]) => { ctx.fillStyle = IC.lg(x - 7, 0, x + 7, 0, [[0, '#3a1a0c'], [0.4, '#7a3a14'], [1, '#2a1208']]); ctx.beginPath(); ctx.moveTo(x - 7, y - 14); ctx.lineTo(x + 7, y - 14); ctx.lineTo(x + 8, y + 2); ctx.lineTo(x - 8, y + 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,190,120,.25)'; ctx.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y - 14); ctx.lineTo(x + k * 3.4, y + 2); ctx.stroke(); } IC.ell(x, y - 14, 7, 2.4, '#5a2810'); }); }
function icCastella() { icPlate(20); [[-12, 2], [8, 6]].forEach(([x, y]) => { ctx.fillStyle = '#f6d36b'; ctx.fillRect(x - 9, y, 18, 14); ctx.fillStyle = '#6b3410'; ctx.fillRect(x - 9, y - 3, 18, 3); ctx.fillStyle = '#a65a1c'; ctx.beginPath(); ctx.moveTo(x - 9, y - 3); ctx.lineTo(x - 5, y - 6); ctx.lineTo(x + 13, y - 6); ctx.lineTo(x + 9, y - 3); ctx.fill(); ctx.fillStyle = '#e9c45a'; ctx.beginPath(); ctx.moveTo(x + 9, y - 3); ctx.lineTo(x + 13, y - 6); ctx.lineTo(x + 13, y + 11); ctx.lineTo(x + 9, y + 14); ctx.fill(); }); }
function icRoll(S) {
  icPlate(20);
  const x0 = -26, x1 = 22, cy = 6, r = 11;
  ctx.fillStyle = IC.lg(0, cy - r, 0, cy + r, [[0, '#e9be72'], [1, '#c48a44']]); ctx.beginPath(); ctx.moveTo(x0, cy - r); ctx.lineTo(x1, cy - r); ctx.lineTo(x1, cy + r); ctx.lineTo(x0, cy + r); ctx.fill();
  IC.ell(x1, cy, 6, r, '#f1d196'); ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.2; ctx.beginPath(); for (let t = 0; t < 14; t += 0.25) ctx.lineTo(x1 + Math.cos(t) * t * 0.4, cy + Math.sin(t) * t * 0.75); ctx.stroke();
  if (S.dust) { IC.seed = 6; ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 70; i++) ctx.fillRect(x0 + IC.rnd() * (x1 - x0), cy - r + IC.rnd() * 6, 0.8, 0.8); }
  for (let i = 0; i < 4; i++) { const x = x0 + 8 + i * 11; if (i % 2) icRosette(x, cy - r - 1, 0.8); else icStraw(x, cy - r - 2, 0.75, true); }
}
function icCrepes(S) {
  icPlate(20);
  const wedge = (x, y, a, s = 1) => { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5); ctx.rotate(a); ctx.fillStyle = IC.rg(10, 10, 30, [[0, '#f3cf8a'], [0.75, '#e8b468'], [1, '#c98a44']]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 30 * s, 0, Math.PI / 2); ctx.closePath(); ctx.fill(); IC.seed = Math.round(a * 100) + 50; for (let i = 0; i < 26; i++) { const rr2 = Math.sqrt(IC.rnd()) * 27 * s, aa = IC.rnd() * Math.PI / 2; IC.ell(Math.cos(aa) * rr2, Math.sin(aa) * rr2, 2 + IC.rnd() * 2.5, 1.5 + IC.rnd() * 1.5, 'rgba(176,104,40,.22)'); } ctx.strokeStyle = 'rgba(170,100,40,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 30 * s - 0.7, 0, Math.PI / 2); ctx.stroke(); ctx.restore(); };
  wedge(-22, 0, 0.1); wedge(-14, -2, 0.55); wedge(-6, -1, 1.0);
  if (S.sauce) { ctx.strokeStyle = S.sauce; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const x = -12 + k * 1.1, y = 4 + Math.sin(k * 0.9) * 4; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  if ((S.deco || []).includes('crepeRosettes')) [[-6, 2], [2, 6], [10, 4], [18, 8]].forEach(([x, y]) => icRosette(x, y, 1));
  if ((S.deco || []).includes('crepeStraw')) [[-2, 9], [8, 11], [16, 10], [24, 13]].forEach(([x, y], i) => icStraw(x, y, 0.85, i === 3));
}

const _recipeIconIco = recipeIcon;
recipeIcon = function (p, R) {
  const S = R && ICON[R.id];
  if (!S) return _recipeIconIco(p);
  ctx.save(); ctx.scale(0.95, 0.95);
  switch (S.base) {
    case 'round': case 'millecrepe': icRound(S); break;
    case 'roll': icRoll(S); break;
    case 'cookies': icCookies(S); break;
    case 'fingers': icFingers(S); break;
    case 'domes': icDomes(S); break;
    case 'brownies': icBrownies(S); break;
    case 'cheesecake': icCheesecake(S); break;
    case 'loafCake': icLoaf(S, false); break;
    case 'loafBread': icLoaf(S, true); break;
    case 'castella': icCastella(S); break;
    case 'cup': icCup(S); break;
    case 'croissants': icCroissants(S); break;
    case 'pie': icPie(S); break;
    case 'boule': icBoule(S); break;
    case 'madeleines': icMadeleines(S); break;
    case 'caneles': icCaneles(S); break;
    case 'crepes': icCrepes(S); break;
    default: _recipeIconIco(p);
  }
  ctx.restore();
};
