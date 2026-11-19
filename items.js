'use strict';
/* =========================================================
   Item artwork (local coords: origin at bottom-centre)
   ========================================================= */

/* ---------- contents surface ---------- */
function drawDeposit(k, x, y, rx, ry, m, amt, seed) {
  if (k === 'flour' || k === 'bp') {
    ctx.fillStyle = radg(x - rx * 0.2, y - ry * 0.5, 0, rx, [[0, '#fdfbf7'], [0.7, '#f1ece2'], [1, 'rgba(225,217,203,.0)']]);
    ctx.beginPath(); ctx.ellipse(x, y - ry * 0.2, rx, ry * 1.2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = TEX.grain; ctx.globalAlpha *= 0.6; ctx.fill(); ctx.globalAlpha /= 0.6;
  } else if (k === 'sugar' || k === 'salt') {
    ctx.fillStyle = radg(x, y - ry * 0.3, 0, rx, [[0, '#ffffff'], [0.8, '#f2f1ec'], [1, 'rgba(235,233,228,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y - ry * 0.2, rx, ry * 1.1, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 18; i++) { const a = hash(seed + i) * TAU, r = Math.sqrt(hash(seed + i * 3)); ctx.fillStyle = `rgba(255,255,255,${0.5 + hash(i + seed * 2) * 0.5})`; ctx.fillRect(x + Math.cos(a) * rx * r * 0.9, y + Math.sin(a) * ry * r * 0.9, 1.4, 1.4); }
    ctx.fillStyle = 'rgba(160,150,140,.25)'; for (let i = 0; i < 14; i++) { const a = hash(seed + i * 7) * TAU, r = Math.sqrt(hash(seed + i * 5)); ctx.fillRect(x + Math.cos(a) * rx * r * 0.9, y + Math.sin(a) * ry * r * 0.9, 1, 1); }
  } else if (k === 'yeast') {
    ctx.fillStyle = radg(x, y, 0, rx, [[0, '#d2b07a'], [1, 'rgba(190,150,95,0)']]); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,85,45,.6)'; for (let i = 0; i < 20; i++) { const a = hash(seed + i) * TAU, r = Math.sqrt(hash(seed + i * 3)); ctx.fillRect(x + Math.cos(a) * rx * r * 0.8, y + Math.sin(a) * ry * r * 0.8, 1.3, 1); }
  } else if (k === 'butter') {
    const n = clamp(Math.ceil(amt / 22), 1, 9);
    for (let i = 0; i < n; i++) {
      const a = hash(seed + i * 11) * TAU, r = n === 1 ? 0 : 0.25 + hash(seed + i * 5) * 0.55;
      const bx = x + Math.cos(a) * rx * r, by = y + Math.sin(a) * ry * r, s = 7 + hash(i + seed) * 4;
      ctx.fillStyle = 'rgba(120,90,30,.25)'; rr(bx - s + 1, by - s * 0.5 + 2, s * 2, s * 1.1, 2.5); ctx.fill();
      ctx.fillStyle = lg(bx, by - s, bx, by + s, [[0, '#fff1bd'], [1, '#ecd078']]); rr(bx - s, by - s * 0.7, s * 2, s * 1.2, 2.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(bx - s + 2, by - s * 0.6, s, 1.3);
    }
  } else if (k === 'milk' || k === 'water' || k === 'egg') {
    const c = k === 'egg' ? 'rgba(255,250,232,.55)' : k === 'milk' ? 'rgba(252,252,248,.95)' : 'rgba(220,236,244,.5)';
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x - rx * 0.15, y - ry * 0.25, rx * 0.55, ry * 0.4, 0, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
  }
}
function drawYolks(m, cx, cy, rx, ry) {
  const n = Math.round((m.g.egg || 0) / 50); const a = clamp(m.yolk * 1.2 - 0.1, 0, 1); if (!n || a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < Math.min(n, 12); i++) {
    const ang = i * 2.4 + 0.7, r = n === 1 ? 0 : 0.2 + (i % 3) * 0.22;
    const x = cx + Math.cos(ang) * rx * r, y = cy + Math.sin(ang) * ry * r, s = Math.min(rx * 0.22, 11);
    ctx.fillStyle = 'rgba(255,250,232,.6)'; ctx.beginPath(); ctx.ellipse(x, y, s * 2, s * 1.1, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = radg(x - s * 0.3, y - s * 0.35, 0, s, [[0, '#ffd45c'], [0.7, '#f5a516'], [1, '#e08a0b']]); ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.78, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x - s * 0.35, y - s * 0.3, s * 0.3, s * 0.18, -0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function drawChips(m, cx, cy, rx, ry, mixed) {
  const n = Math.min(46, Math.round((m.g.chips || 0) / 3.5)); if (!n) return;
  for (let i = 0; i < n; i++) {
    const s = mixed ? i * 13 + 7 : i * 5 + 3;
    const a = hash(s) * TAU, r = mixed ? Math.sqrt(hash(s * 3)) * 0.9 : Math.sqrt(hash(s * 3)) * 0.55;
    const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
    ctx.fillStyle = '#2b170d'; ctx.beginPath(); ctx.moveTo(x, y - 3.5); ctx.quadraticCurveTo(x + 3.5, y + 2, x, y + 2); ctx.quadraticCurveTo(x - 3.5, y + 2, x, y - 3.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,190,.35)'; ctx.fillRect(x - 1, y - 1.5, 1, 1.5);
  }
}
function drawSurface(m, cx, cy, rx, ry) {
  const keys = m.kinds(); if (!keys.length) return;
  const f = m.form(), base = m.color();
  const u = keys.length > 1 ? 1 - m.mix : 1;
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = radg(cx - rx * 0.25, cy - ry * 0.5, rx * 0.05, rx * 1.15, [[0, rgb(shade(base, 0.1))], [1, rgb(shade(base, -0.14))]]);
  ctx.fillRect(cx - rx, cy - ry * 1.5, rx * 2, ry * 3);
  if (u > 0.03) {
    ctx.globalAlpha = Math.min(1, u * 1.6);
    const vol = m.vol();
    m.order.forEach((k, i) => {
      if (!(m.g[k] > 0.4) || k === 'chips') return;
      const fr = (m.g[k] / ING[k].d) / vol;
      const big = i === 0 || keys.length === 1;
      const r = big ? 1.05 : clamp(Math.sqrt(fr) * 1.3, 0.25, 0.85);
      const ang = i * 2.39 + 0.5, off = big ? 0 : 0.42;
      drawDeposit(k, cx + Math.cos(ang) * rx * off, cy + Math.sin(ang) * ry * off, rx * r, ry * r, m, m.g[k], i * 17 + 3);
    });
    ctx.globalAlpha = 1;
  }
  if (['loose', 'dough', 'shaggy', 'cookie', 'lumpy'].includes(f)) { ctx.globalAlpha = 0.3; ctx.fillStyle = TEX.speck; ctx.fillRect(cx - rx, cy - ry * 1.5, rx * 2, ry * 3); ctx.globalAlpha = 1; }
  if (keys.length > 1 && m.mix > 0.05 && m.mix < 0.995) {
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = rgb(shade(base, i % 2 ? 0.3 : -0.12), 0.45 * (1 - m.mix));
      ctx.beginPath(); ctx.ellipse(cx, cy, rx * (0.22 + i * 0.2), ry * (0.22 + i * 0.2), 0, m.swirl + i * 1.7, m.swirl + i * 1.7 + 2.4); ctx.stroke();
    }
  }
  drawYolks(m, cx, cy, rx, ry);
  drawChips(m, cx, cy, rx, ry, m.mix > 0.7 && keys.length > 1);
  if (f === 'batter' || f === 'liquid') {
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx - rx * 0.2, cy - ry * 0.25, rx * 0.5, ry * 0.4, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  }
  if (m.shell > 0) {
    const x = cx + rx * 0.35, y = cy - ry * 0.1;
    ctx.fillStyle = '#f6efe6'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x, y - 6, x + 7, y - 1); ctx.lineTo(x + 3, y + 2); ctx.lineTo(x - 2, y + 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b98557'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();
}
function doughFill(x, y, r) {
  return radg(x - r * 0.35, y - r * 0.55, r * 0.1, r * 1.6, [[0, '#f8eedb'], [0.55, '#ecdcbc'], [1, '#c9ae84']]);
}
function drawDome(m, cx, cy, rx, ry) {
  const f = m.form(); if (!['dough', 'cookie', 'shaggy'].includes(f)) return;
  const dh = ry * (1.1 + (f === 'dough' ? Math.min(m.proof, 1.8) * 1.6 : 0.4));
  const w = rx * (f === 'dough' ? 0.72 + Math.min(m.proof, 1.8) * 0.14 : 0.8);
  ctx.beginPath(); ctx.moveTo(cx - w, cy + ry * 0.2);
  ctx.bezierCurveTo(cx - w, cy - dh, cx + w, cy - dh, cx + w, cy + ry * 0.2);
  ctx.ellipse(cx, cy + ry * 0.2, w, ry * 0.5, 0, 0, Math.PI, false);
  const col = m.color();
  ctx.fillStyle = f === 'cookie' ? radg(cx - w * 0.3, cy - dh * 0.6, 1, w * 1.4, [[0, rgb(shade(col, 0.15))], [1, rgb(shade(col, -0.2))]]) : doughFill(cx, cy - dh * 0.4, w);
  ctx.fill();
  ctx.save(); ctx.clip(); ctx.globalAlpha = 0.35; ctx.fillStyle = TEX.speck; ctx.fillRect(cx - w, cy - dh, w * 2, dh + ry);
  ctx.globalAlpha = 1;
  if (f === 'shaggy' || (f === 'dough' && m.knead < 0.5)) for (let i = 0; i < 12; i++) {
    const a = hash(i * 9) * Math.PI, r2 = 0.2 + hash(i * 4) * 0.7, x = cx + Math.cos(a + Math.PI) * w * r2, y = cy - dh * 0.45 + Math.sin(a) * dh * 0.3, s = 3 + hash(i) * 5;
    ctx.fillStyle = radg(x, y, 0, s, [[0, i % 2 ? 'rgba(255,250,238,.4)' : 'rgba(160,125,80,.35)'], [1, 'rgba(160,125,80,0)']]); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
  if (f === 'cookie') drawChips(m, cx, cy - dh * 0.35, w * 0.8, dh * 0.5, true);
  ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.25 * Math.min(1, m.knead)})`; ctx.beginPath(); ctx.ellipse(cx - w * 0.3, cy - dh * 0.65, w * 0.35, dh * 0.15, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ---------- bowls ---------- */
function bowlGeom(it) { const w = it.w, h = it.h; return { w, h, rx: w / 2, ry: w * 0.12, top: -h, bh: w * 0.26 }; }
function bowlSurface(it) {
  const d = DEF[it.kind], g = bowlGeom(it), v = it.m.vol(), f = clamp(v / d.cap, 0, 1);
  const dep = 1 - Math.pow(f, 0.6); const sy = g.top + dep * g.h * 0.82; const srx = Math.max(6, g.rx * (1 - 0.55 * dep * dep) - 3);
  return { sy, srx, sry: srx * 0.24 };
}
function drawBowl(it, ins) {
  const d = DEF[it.kind], { w, h, rx, ry, top, bh } = bowlGeom(it), mat = d.mat;
  const sil = () => { ctx.moveTo(-rx, top); ctx.bezierCurveTo(-rx, top + h * 0.72, -bh * 1.3, 0, -bh, 0); ctx.lineTo(bh, 0); ctx.bezierCurveTo(bh * 1.3, 0, rx, top + h * 0.72, rx, top); };
  const frontPath = () => { ctx.beginPath(); sil(); ctx.ellipse(0, top, rx, ry, 0, 0, Math.PI, false); ctx.closePath(); };
  // interior
  ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU);
  ctx.fillStyle = mat === 'steel' ? lg(-rx, 0, rx, 0, [[0, '#d9dde0'], [0.4, '#8f979c'], [0.7, '#e7eaec'], [1, '#9aa1a6']]) : mat === 'glass' ? 'rgba(225,236,240,.35)' : lg(0, top - ry, 0, top + ry, [[0, '#d8d3ca'], [1, '#fbfaf7']]);
  ctx.fill();
  const v = it.m.vol();
  let s = null;
  if (v > 0.5) {
    s = bowlSurface(it);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, top, rx - 1, ry - 0.5, 0, 0, TAU); ctx.rect(-rx, top, rx * 2, h); ctx.clip();
    drawSurface(it.m, 0, s.sy, s.srx, s.sry);
    ctx.restore();
  }
  if (s) drawDome(it.m, 0, s.sy, s.srx, s.sry);
  if (ins) ins();
  // contents seen through glass
  if (mat === 'glass' && s) {
    ctx.save(); frontPath(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-rx - 5, s.sy); ctx.lineTo(-s.srx, s.sy); ctx.ellipse(0, s.sy, s.srx, s.sry, 0, Math.PI, 0, true); ctx.lineTo(rx + 5, s.sy); ctx.lineTo(rx + 5, 2); ctx.lineTo(-rx - 5, 2); ctx.closePath(); ctx.clip();
    const m = it.m, keys = m.kinds(), u = keys.length > 1 ? 1 - m.mix : 0;
    const span = -s.sy;
    if (u > 0.03) {
      let acc = 0; const vol = m.vol();
      m.order.forEach(k => { if (!(m.g[k] > 0.4)) return; const fr = (m.g[k] / ING[k].d) / vol; const y1 = -acc * span, y0 = -(acc + fr) * span - (acc + fr > 0.999 ? s.sry + 2 : 0); acc += fr; const c = k === 'egg' ? [244, 196, 70] : ING[k].c; ctx.fillStyle = rgb(c, k === 'water' ? 0.35 : 0.92); ctx.fillRect(-rx, y0, rx * 2, y1 - y0 + 0.5); });
    }
    if (u < 0.97) { ctx.globalAlpha = 1 - u; ctx.fillStyle = rgb(m.color(), m.form() === 'liquid' && keys.length === 1 && keys[0] === 'water' ? 0.35 : 0.93); ctx.fillRect(-rx, s.sy - s.sry - 2, rx * 2, span + s.sry + 4); ctx.globalAlpha = 1; }
    if (m.g.chips) { ctx.fillStyle = 'rgba(45,25,14,.8)'; for (let i = 0; i < Math.min(30, m.g.chips / 5); i++) ctx.fillRect(lerp(-rx * 0.6, rx * 0.6, hash(i * 3)), lerp(s.sy + 4, -6, hash(i * 7)), 3, 3); }
    ctx.fillStyle = lg(-rx, 0, rx, 0, [[0, 'rgba(0,0,0,.18)'], [0.3, 'rgba(255,255,255,.08)'], [0.8, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.2)']]); ctx.fillRect(-rx, top, rx * 2, h + 4);
    ctx.restore();
  }
  // exterior
  frontPath();
  if (mat === 'glass') {
    ctx.fillStyle = 'rgba(214,232,238,.16)'; ctx.fill();
    ctx.strokeStyle = 'rgba(110,135,145,.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); sil(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-rx * 0.8, top + h * 0.2); ctx.bezierCurveTo(-rx * 0.78, top + h * 0.55, -rx * 0.55, top + h * 0.85, -rx * 0.3, top + h * 0.93); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(rx * 0.75, top + h * 0.25); ctx.bezierCurveTo(rx * 0.72, top + h * 0.5, rx * 0.6, top + h * 0.7, rx * 0.45, top + h * 0.82); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,175,185,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, top - 0.5, rx - 1, ry - 0.5, 0, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
  } else if (mat === 'steel') {
    ctx.fillStyle = lg(-rx, 0, rx, 0, [[0, '#737b81'], [0.18, '#c9ced2'], [0.32, '#f4f6f7'], [0.5, '#9ca3a8'], [0.72, '#e6e9eb'], [1, '#6e767c']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = TEX.brush; ctx.globalAlpha = 0.5; ctx.fillRect(-rx, top - ry, w, h + ry); ctx.restore();
    ctx.strokeStyle = lg(-rx, 0, rx, 0, [[0, '#9aa1a6'], [0.4, '#ffffff'], [1, '#8a9196']]); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.stroke();
    if (it.kind === 'bowlM') { ctx.fillStyle = lg(0, -10, 0, 0, [[0, '#c8cdd0'], [1, '#6e767c']]); rr(-bh - 4, -9, bh * 2 + 8, 9, 2); ctx.fill(); ctx.strokeStyle = '#8e969b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(rx + 6, top + 22, 10, 16, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
  } else {
    ctx.fillStyle = lg(-rx, 0, rx, 0, [[0, '#cfcac1'], [0.3, '#fbfaf7'], [0.7, '#f1eee8'], [1, '#bdb7ad']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(70,100,130,.55)'; ctx.fillRect(-rx, top + 8, w, 2.5); ctx.restore();
    ctx.strokeStyle = '#fefefe'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, top + 1, rx, ry, 0, 0, Math.PI); ctx.stroke();
  }
}

/* ---------- measuring jug ---------- */
function drawJug(it, ins) {
  const w = it.w, h = it.h, rx = w / 2 - 6, ry = 7, top = -h + 8;
  const v = it.m.vol(), f = clamp(v / 520, 0, 1.05);
  const sy = -4 - f * (h - 16);
  // back rim + interior
  ctx.fillStyle = 'rgba(225,236,240,.35)'; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.fill();
  if (v > 0.5) { ctx.save(); ctx.beginPath(); ctx.rect(-rx, top - ry, rx * 2, h); ctx.clip(); drawSurface(it.m, 0, sy, rx - 2, ry - 1); ctx.restore(); }
  if (ins) ins();
  if (v > 0.5) {
    const m = it.m, keys = m.kinds(), u = keys.length > 1 ? 1 - m.mix : 0;
    ctx.save(); rr(-rx, sy, rx * 2, -4 - sy, [0, 0, 6, 6]); ctx.clip();
    if (u > 0.03) { let acc = 0; const vol = m.vol(), span = -sy - 4; m.order.forEach(k => { if (!(m.g[k] > 0.4)) return; const fr = (m.g[k] / ING[k].d) / vol; const y1 = -4 - acc * span, y0 = -4 - (acc + fr) * span; acc += fr; ctx.fillStyle = rgb(k === 'egg' ? [244, 196, 70] : ING[k].c, k === 'water' ? 0.35 : 0.92); ctx.fillRect(-rx, y0 - 1, rx * 2, y1 - y0 + 1); }); }
    if (u < 0.97) { const wat = keys.length === 1 && keys[0] === 'water'; ctx.globalAlpha = 1 - u; ctx.fillStyle = rgb(m.color(), wat ? 0.4 : 0.93); ctx.fillRect(-rx, sy, rx * 2, -sy); ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.fillStyle = rgb(shade(it.m.color(), 0.1), 0.9); ctx.beginPath(); ctx.ellipse(0, sy, rx - 1, ry - 1, 0, 0, Math.PI); ctx.fill();
  }
  // glass body
  ctx.fillStyle = 'rgba(214,232,238,.15)'; rr(-rx, top, rx * 2, -top, [0, 0, 7, 7]); ctx.fill();
  ctx.strokeStyle = 'rgba(110,135,145,.5)'; ctx.lineWidth = 1.3; ctx.stroke();
  // handle
  ctx.strokeStyle = 'rgba(160,185,195,.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(rx, top + 12); ctx.bezierCurveTo(rx + 22, top + 14, rx + 22, -24, rx, -16); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  // spout
  ctx.fillStyle = 'rgba(214,232,238,.4)'; ctx.beginPath(); ctx.moveTo(-rx, top); ctx.lineTo(-rx - 10, top - 4); ctx.lineTo(-rx, top + 10); ctx.fill();
  ctx.strokeStyle = 'rgba(150,175,185,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.stroke();
  // markings
  ctx.font = '600 7px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
  for (let ml = 50; ml <= 500; ml += 50) {
    const y = -4 - ml / 520 * (h - 16), big = ml % 100 === 0;
    ctx.strokeStyle = 'rgba(190,50,40,.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-rx + 4, y); ctx.lineTo(-rx + (big ? 16 : 10), y); ctx.stroke();
    if (big) { ctx.fillStyle = 'rgba(190,50,40,.85)'; ctx.fillText(ml, -rx + 18, y + 2.5); }
  }
  ctx.fillStyle = 'rgba(190,50,40,.7)'; ctx.fillText('ml', -rx + 18, -h + 22);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(rx - 7, top + 10); ctx.lineTo(rx - 7, -12); ctx.stroke();
}

/* ---------- pans ---------- */
const CRUST = [[0, null], [0.45, [236, 205, 140]], [1, [200, 138, 64]], [1.45, [140, 82, 36]], [2, [70, 42, 22]], [3, [28, 20, 16]]];
function crustColor(brown, base) {
  for (let i = 1; i < CRUST.length; i++) { const [b1, c1] = CRUST[i]; const [b0, c0] = CRUST[i - 1]; if (brown <= b1) return mixc(c0 || base, c1, (brown - b0) / (b1 - b0)); }
  return CRUST[CRUST.length - 1][1];
}
function drawTin(it, ins) {
  const w = it.w, h = it.h, rx = w / 2, ry = w * 0.12, top = -h;
  ctx.fillStyle = lg(0, top - ry, 0, top + ry, [[0, '#3a3b3d'], [1, '#56585b']]); ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0, TAU); ctx.fill();
  const m = it.m, v = m.vol(), bk = it.bake;
  let domeTop = null;
  if (v > 0.5) {
    const f = clamp(v / DEF.tin.cap, 0, 1);
    const rise = bk ? bk.rise : 0;
    const fillH = f * h * (1 + rise * 1.35);
    const sy = Math.max(top, -fillH);
    const over = Math.max(0, fillH - h);
    const col = bk && bk.brown > 0.02 ? crustColor(bk.brown, m.color()) : null;
    if (over < 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(0, top, rx - 2, ry - 1, 0, 0, TAU); ctx.rect(-rx, top, w, h); ctx.clip(); if (col) drawBakedTop(0, sy, rx - 3, ry * 0.9, col, bk, m); else drawSurface(m, 0, sy, rx - 3, ry * 0.9); ctx.restore(); }
    else domeTop = { over: Math.min(over, 46), col: col || m.color() };
  }
  if (ins) ins();
  // walls
  ctx.beginPath(); ctx.moveTo(-rx, top); ctx.lineTo(-rx + 2, 0); ctx.ellipse(0, 0, rx - 2, ry * 0.9, 0, Math.PI, 0, true); ctx.lineTo(rx, top); ctx.ellipse(0, top, rx, ry, 0, 0, Math.PI, false); ctx.closePath();
  ctx.fillStyle = lg(-rx, 0, rx, 0, [[0, '#2f3032'], [0.2, '#77797c'], [0.35, '#a7a9ac'], [0.55, '#4d4f52'], [0.8, '#86888b'], [1, '#2b2c2e']]); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, top, rx, ry, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  if (domeTop) {
    const { over, col } = domeTop;
    ctx.beginPath(); ctx.moveTo(-rx + 2, top); ctx.bezierCurveTo(-rx + 4, top - over * 1.2, rx - 4, top - over * 1.2, rx - 2, top); ctx.ellipse(0, top, rx - 2, ry, 0, 0, Math.PI, false); ctx.closePath();
    ctx.fillStyle = radg(-rx * 0.3, top - over, 2, rx * 1.3, [[0, rgb(shade(col, 0.18))], [0.7, rgb(col)], [1, rgb(shade(col, -0.25))]]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.3; ctx.fillStyle = TEX.speck; ctx.fillRect(-rx, top - over * 1.3, w, over * 1.3 + ry); ctx.restore();
    if (it.bake && it.bake.b > 0.7) { ctx.strokeStyle = rgb(shade(col, -0.3), 0.6); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-rx * 0.4, top - over * 0.75); ctx.quadraticCurveTo(0, top - over * 0.95, rx * 0.35, top - over * 0.8); ctx.stroke(); }
  }
}
function drawBakedTop(x, y, rx, ry, col, bk, m) {
  ctx.fillStyle = radg(x - rx * 0.3, y - ry * 0.5, 1, rx * 1.2, [[0, rgb(shade(col, 0.15))], [1, rgb(shade(col, -0.2))]]);
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.3; ctx.fillStyle = TEX.speck; ctx.fill(); ctx.globalAlpha = 1;
  if (m.g.chips) drawChips(m, x, y, rx, ry, true);
}
function drawLoaf(it, ins) {
  const w = it.w, h = it.h, top = -h, bw = w * 0.84, oh = 14;
  ctx.fillStyle = '#3e3f41'; rr(-w / 2 + 3, top - oh / 2, w - 6, oh, 4); ctx.fill();
  const m = it.m, v = m.vol(), bk = it.bake;
  let dome = null;
  if (v > 0.5) {
    const f = clamp(v / DEF.loaf.cap, 0, 1);
    const grow = m.form() === 'dough' ? 1 + Math.min(m.proof, 1.9) * 0.85 : 1;
    const fillH = f * h * grow * (1 + (bk ? bk.rise : 0));
    const col = bk && bk.brown > 0.02 ? crustColor(bk.brown, m.color()) : null;
    const isDough = ['dough', 'shaggy', 'cookie'].includes(m.form());
    if (fillH < h * 0.85 && !isDough) {
      ctx.save(); rr(-w / 2 + 5, top - oh / 2 + 1, w - 10, oh - 2, 3); ctx.clip();
      if (col) drawBakedTop(0, top, w / 2, oh, col, bk, m); else drawSurface(m, 0, top, w / 2 - 5, oh * 0.6); ctx.restore();
    } else dome = { over: clamp(fillH - h * 0.7, 6, 70), col: col, dough: isDough };
  }
  if (dome) {
    const { over, col } = dome; const dx = w / 2 - 8;
    ctx.beginPath(); ctx.moveTo(-dx, top + 4); ctx.bezierCurveTo(-dx - 2, top - over * 1.25, dx + 2, top - over * 1.25, dx, top + 4); ctx.closePath();
    ctx.fillStyle = col ? radg(-dx * 0.3, top - over, 2, dx * 1.4, [[0, rgb(shade(col, 0.2))], [0.6, rgb(col)], [1, rgb(shade(col, -0.3))]]) : doughFill(0, top - over * 0.5, dx);
    ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.3; ctx.fillStyle = TEX.speck; ctx.fillRect(-dx, top - over * 1.3, dx * 2, over * 1.3 + 6);
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(-dx * 0.3, top - over * 0.8, dx * 0.4, over * 0.15, -0.1, 0, TAU); ctx.fill();
    if (col && bk && bk.b > 0.5) { ctx.strokeStyle = rgb(mixc(col, [240, 220, 180], 0.4), 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-dx * 0.55, top - over * 0.75); ctx.quadraticCurveTo(0, top - over * 1.0, dx * 0.55, top - over * 0.75); ctx.stroke(); }
    ctx.restore();
  }
  if (ins) ins();
  ctx.beginPath(); ctx.moveTo(-w / 2, top); ctx.lineTo(w / 2, top); ctx.lineTo(bw / 2, 0); ctx.lineTo(-bw / 2, 0); ctx.closePath();
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#3a3b3d'], [0.15, '#8a8c8f'], [0.3, '#b8babd'], [0.5, '#5a5c5f'], [0.85, '#8e9093'], [1, '#353638']]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-w / 2, top, w, 2);
}
function drawTray(it, ins) {
  const w = it.w;
  ctx.fillStyle = lg(0, -12, 0, 0, [[0, '#d6d9dc'], [0.4, '#9ea4a8'], [1, '#6c7277']]); rr(-w / 2, -10, w, 10, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-w / 2 + 2, -10, w - 4, 1.5);
  if (ins) ins();
  const bk = it.bake, balls = it.balls || [];
  const sorted = balls.slice().sort((a, b) => a.row - b.row);
  sorted.forEach(b => {
    const depth = [-7, -4, -1][b.row], sc = [0.86, 0.93, 1][b.row];
    const r = Math.cbrt(b.g) * 3.6 * sc;
    const spread = bk ? 1 + bk.spread * sstep(0, 0.55, bk.b) : 1;
    const rx = r * spread, hh = r * (1.15 - 0.75 * (spread - 1) / 0.8);
    const col = bk && bk.brown > 0.02 ? crustColor(bk.brown * 0.95, b.m.color()) : b.m.color();
    const x = b.x * (w / 2 - 18), y = -10 + depth;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 1, rx * 1.05, rx * 0.25, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y - hh * 0.35, rx, Math.max(hh * 0.6, rx * 0.3), 0, Math.PI, 0); ctx.ellipse(x, y - hh * 0.35 + 0.1, rx, rx * 0.25, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = radg(x - rx * 0.3, y - hh * 0.8, 1, rx * 1.4, [[0, rgb(shade(col, 0.2))], [0.7, rgb(col)], [1, rgb(shade(col, -0.3))]]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalAlpha = 0.3; ctx.fillStyle = TEX.speck; ctx.fillRect(x - rx, y - hh * 1.2, rx * 2, hh * 1.4); ctx.globalAlpha = 1;
    ctx.fillStyle = '#2b170d'; const nc = Math.round((b.m.g.chips || 0) / b.m.total() * 22);
    for (let i = 0; i < nc; i++) { const cx = x + (hash(b.id * 7 + i) - 0.5) * rx * 1.5, cy = y - hh * (0.2 + hash(b.id * 3 + i) * 0.6); ctx.beginPath(); ctx.ellipse(cx, cy, 2.2, 1.6, 0, 0, TAU); ctx.fill(); }
    if (bk && bk.b > 0.6) { ctx.strokeStyle = rgb(shade(col, -0.2), 0.5); ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - rx * 0.5 + i * rx * 0.4, y - hh * 0.5); ctx.lineTo(x - rx * 0.3 + i * rx * 0.4, y - hh * 0.75); ctx.stroke(); } }
    ctx.restore();
  });
}

/* ---------- sources ---------- */
function drawFlourBag(it) {
  const w = it.w, h = it.h, full = clamp(it.stock / 2000, 0, 1), topY = -h + (1 - full) * 22;
  ctx.beginPath(); ctx.moveTo(-w / 2 + 2, 0); ctx.lineTo(w / 2 - 2, 0); ctx.quadraticCurveTo(w / 2 + 4, -h * 0.5, w / 2, topY + 10); ctx.lineTo(-w / 2, topY + 10); ctx.quadraticCurveTo(-w / 2 - 4, -h * 0.5, -w / 2 + 2, 0); ctx.closePath();
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#d5cdbd'], [0.3, '#f7f3ec'], [0.7, '#eee8dc'], [1, '#c9c0b0']]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(0, topY + 8, w / 2 - 4, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = TEX.grain; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-w / 2, topY + 10); for (let i = 0; i <= 8; i++) ctx.lineTo(-w / 2 + i * w / 8, topY + (i % 2 ? 2 : 8)); ctx.lineTo(w / 2, topY + 14); ctx.lineTo(-w / 2, topY + 14); ctx.closePath();
  ctx.fillStyle = '#e4ddcf'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.strokeStyle = 'rgba(110,90,60,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-w / 2 + 10, topY + 20); ctx.lineTo(-w / 2 + 6, -12); ctx.moveTo(w / 2 - 12, topY + 24); ctx.lineTo(w / 2 - 8, -8); ctx.stroke();
  rr(-w / 2 + 9, -h * 0.64, w - 18, h * 0.38, 4); ctx.fillStyle = '#fbfaf7'; ctx.fill();
  ctx.fillStyle = '#3d5a73'; ctx.font = '700 14px Georgia, "Times New Roman", serif'; ctx.textAlign = 'center'; ctx.fillText('FLOUR', 0, -h * 0.45);
  ctx.fillStyle = '#8a8070'; ctx.font = '500 7.5px Inter, system-ui, sans-serif'; ctx.fillText('plain · 2 kg', 0, -h * 0.35);
  ctx.strokeStyle = '#c4a55b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -h * 0.29); ctx.lineTo(0, -h * 0.18); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-3, -h * 0.27 + i * 3.4, 3, 1.4, 0.6, 0, TAU); ctx.ellipse(3, -h * 0.27 + i * 3.4, 3, 1.4, -0.6, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-w / 2 + 6, -6, w - 12, 3);
}
function drawJar(it, o) {
  const w = it.w, h = it.h, full = clamp(it.stock / o.max, 0, 1);
  const bodyTop = -h + 10;
  // contents
  const ch = (h - 18) * full;
  if (full > 0) {
    ctx.save(); rr(-w / 2 + 3, -ch - 4, w - 6, ch + 1, [0, 0, 6, 6]); ctx.clip();
    ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, rgb(shade(o.col, -0.15))], [0.4, rgb(shade(o.col, 0.1))], [1, rgb(shade(o.col, -0.2))]]); ctx.fillRect(-w / 2, -ch - 6, w, ch + 4);
    ctx.fillStyle = o.tex; ctx.globalAlpha = 0.8; ctx.fillRect(-w / 2, -ch - 6, w, ch + 4); ctx.globalAlpha = 1;
    ctx.restore();
    ctx.fillStyle = rgb(shade(o.col, 0.15)); ctx.beginPath(); ctx.ellipse(0, -ch - 4, w / 2 - 4, 4, 0, 0, TAU); ctx.fill();
  }
  // glass
  rr(-w / 2, bodyTop, w, -bodyTop, 8);
  ctx.fillStyle = o.tint || 'rgba(214,232,238,.14)'; ctx.fill();
  ctx.strokeStyle = 'rgba(110,135,145,.5)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(214,232,238,.3)'; rr(-w / 2 + 5, -h + 2, w - 10, 10, 3); ctx.fill(); ctx.strokeStyle = 'rgba(120,140,150,.5)'; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w / 2 + 6, bodyTop + 8); ctx.lineTo(-w / 2 + 6, -8); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w / 2 - 6, bodyTop + 12); ctx.lineTo(w / 2 - 6, -14); ctx.stroke();
  // label
  const ly = -h * 0.52;
  ctx.fillStyle = o.labelBg || '#e3d4b8'; rr(-w / 2 + 6, ly - 9, w - 12, 18, 2); ctx.fill();
  ctx.fillStyle = '#4a3b2b'; ctx.font = `700 ${o.fs || 8}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText(o.label, 0, ly + 3);
}
function drawTinCan(it) {
  const w = it.w, h = it.h;
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#9aa0a5'], [0.3, '#eef0f1'], [0.6, '#c3c8cb'], [1, '#8a9095']]); rr(-w / 2, -h, w, h, 4); ctx.fill();
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#24466b'], [0.35, '#3d6a99'], [1, '#1d3a5a']]); ctx.fillRect(-w / 2, -h + 12, w, h - 22);
  ctx.fillStyle = '#f6efe2'; ctx.font = '700 7px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('BAKING', 0, -h * 0.58); ctx.fillText('POWDER', 0, -h * 0.46);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '500 5.5px Inter, sans-serif'; ctx.fillText('double acting', 0, -h * 0.34);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-w / 2 + 6, -h + 2, 4, h - 4);
  ctx.fillStyle = '#e8eaeb'; ctx.beginPath(); ctx.ellipse(0, -h, w / 2, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f2f0ea'; ctx.beginPath(); ctx.ellipse(0, -h, w / 2 - 4, 2.6, 0, 0, TAU); ctx.fill();
}
function drawChipsBag(it) {
  const w = it.w, h = it.h, full = clamp(it.stock / 300, 0, 1);
  ctx.beginPath(); ctx.moveTo(-w / 2 + 3, 0); ctx.lineTo(w / 2 - 3, 0); ctx.quadraticCurveTo(w / 2 + 3, -h * 0.5, w / 2 - 2, -h + 14); ctx.lineTo(-w / 2 + 2, -h + 14); ctx.quadraticCurveTo(-w / 2 - 3, -h * 0.5, -w / 2 + 3, 0); ctx.closePath();
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#3a2014'], [0.35, '#6b3e25'], [0.6, '#56301c'], [1, '#2e190f']]); ctx.fill();
  ctx.fillStyle = 'rgba(30,15,8,.9)'; rr(-w / 2 + 2, -h + 2, w - 4, 14, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 2, -h + 6); ctx.lineTo(w / 2 - 2, -h + 4); ctx.lineTo(w / 2 - 2, -h + 7); ctx.lineTo(-w / 2 + 2, -h + 9); ctx.fill();
  // window
  const wy = -h * 0.42; rr(-w / 2 + 12, wy - 16, w - 24, 34, 10); ctx.fillStyle = 'rgba(240,228,210,.25)'; ctx.fill();
  ctx.save(); ctx.clip(); const lvl = wy + 18 - 34 * full; for (let i = 0; i < 40; i++) { const x = -w / 2 + 12 + hash(i) * (w - 24), y = lerp(lvl, wy + 18, hash(i * 3)); ctx.fillStyle = '#25140b'; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.quadraticCurveTo(x + 3, y + 2, x, y + 2); ctx.quadraticCurveTo(x - 3, y + 2, x, y - 3); ctx.fill(); } ctx.restore();
  ctx.fillStyle = '#f3e3c3'; ctx.font = '700 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('CHOCOLATE', 0, -h * 0.74); ctx.font = '600 7px Inter, sans-serif'; ctx.fillText('dark chips · 300 g', 0, -h * 0.12);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-w / 2 + 6, -h + 18, 3, h - 26);
}
function drawMilk(it) {
  const w = it.w, h = it.h, gh = 26;
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#d9dcdd'], [0.3, '#ffffff'], [0.7, '#f3f4f4'], [1, '#c8cbcc']]); ctx.fillRect(-w / 2, -h + gh, w, h - gh);
  ctx.beginPath(); ctx.moveTo(-w / 2, -h + gh); ctx.lineTo(-w / 2 + 6, -h + 6); ctx.lineTo(w / 2 - 6, -h + 6); ctx.lineTo(w / 2, -h + gh); ctx.closePath();
  ctx.fillStyle = lg(0, -h, 0, -h + gh, [[0, '#ffffff'], [1, '#e2e4e5']]); ctx.fill();
  ctx.fillStyle = '#eceeee'; ctx.fillRect(-w / 2 + 6, -h, w - 12, 7);
  ctx.fillStyle = '#4e83b7'; ctx.fillRect(-w / 2, -h * 0.45, w, 30);
  ctx.fillStyle = '#ffffff'; ctx.font = '700 14px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('MILK', 0, -h * 0.45 + 20);
  ctx.fillStyle = '#4e83b7'; ctx.font = '600 7px Inter, sans-serif'; ctx.fillText('whole · 1 L', 0, -h * 0.2);
  ctx.fillStyle = 'rgba(78,131,183,.25)'; ctx.beginPath(); ctx.arc(0, -h * 0.62, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e9b949'; ctx.beginPath(); ctx.arc(w / 2 - 14, -h + 16, 4.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(w / 2 - 5, -h + gh, 5, h - gh);
}
function drawPitcher(it, ins) {
  const w = it.w, h = it.h, full = clamp(it.stock / 1500, 0, 1), rx = w / 2 - 8;
  const wy = -6 - (h - 22) * full;
  if (full > 0) {
    ctx.fillStyle = 'rgba(190,220,232,.42)'; rr(-rx + 1, wy, rx * 2 - 2, -6 - wy, [0, 0, 8, 8]); ctx.fill();
    ctx.fillStyle = 'rgba(225,242,250,.6)'; ctx.beginPath(); ctx.ellipse(0, wy, rx - 1, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
  }
  rr(-rx, -h + 10, rx * 2, h - 10, [2, 2, 9, 9]); ctx.fillStyle = 'rgba(214,232,238,.14)'; ctx.fill(); ctx.strokeStyle = 'rgba(110,135,145,.5)'; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.fillStyle = 'rgba(214,232,238,.3)'; ctx.beginPath(); ctx.moveTo(-rx, -h + 10); ctx.lineTo(-rx - 12, -h + 2); ctx.lineTo(-rx, -h + 22); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,185,195,.75)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(rx, -h + 22); ctx.bezierCurveTo(rx + 26, -h + 26, rx + 24, -30, rx, -24); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(150,175,185,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -h + 10, rx, 6, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-rx + 7, -h + 22); ctx.lineTo(-rx + 7, -14); ctx.stroke();
}
function drawEggShape(rx, ry, cracked) {
  ctx.beginPath(); ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(rx * 0.72, -ry, rx, -ry * 0.1, rx, ry * 0.25); ctx.bezierCurveTo(rx, ry * 0.78, rx * 0.55, ry, 0, ry);
  ctx.bezierCurveTo(-rx * 0.55, ry, -rx, ry * 0.78, -rx, ry * 0.25); ctx.bezierCurveTo(-rx, -ry * 0.1, -rx * 0.72, -ry, 0, -ry); ctx.closePath();
}
function eggFill(rx, ry) { return radg(-rx * 0.35, -ry * 0.35, 1, rx * 1.6, [[0, '#f1d3b1'], [0.55, '#d4a073'], [1, '#9c6a40']]); }
function drawEgg(cx, cy, s = 1, rot = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); const rx = 14 * s, ry = 18.5 * s;
  drawEggShape(rx, ry); ctx.fillStyle = eggFill(rx, ry); ctx.fill();
  ctx.fillStyle = 'rgba(120,70,40,.25)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((hash(i * 3) - 0.5) * rx * 1.3, (hash(i * 7) - 0.5) * ry * 1.4, 0.7, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-rx * 0.38, -ry * 0.45, rx * 0.22, ry * 0.15, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawCarton(it) {
  const w = it.w, h = it.h, n = it.count;
  // eggs (back row then front row)
  for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const idx = row * 3 + i; if (idx >= n) continue;
    drawEgg(-w / 2 + 24 + i * 36 + row * 12, -h + 4 - (1 - row) * 5, 0.85);
  }
  ctx.beginPath(); ctx.moveTo(-w / 2, -h + 14); for (let i = 0; i <= 6; i++) { const x = -w / 2 + i * w / 6; ctx.quadraticCurveTo(x - w / 12, -h + 24, x, -h + 14); } ctx.lineTo(w / 2 - 4, 0); ctx.lineTo(-w / 2 + 4, 0); ctx.closePath();
  ctx.fillStyle = lg(0, -h, 0, 0, [[0, '#cfc9bf'], [1, '#a9a297']]); ctx.fill();
  ctx.fillStyle = TEX.grain; ctx.fill();
  ctx.strokeStyle = 'rgba(80,70,60,.18)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + i * w / 6, -h + 18); ctx.lineTo(-w / 2 + i * w / 6 + 2, -2); ctx.stroke(); }
}
function drawButterDish(it) {
  const w = it.w;
  const len = 92 * clamp(it.grams / 250, 0, 1);
  if (len > 2) {
    const x0 = -46, by = -10, bh = 22;
    ctx.fillStyle = lg(0, by - bh, 0, by, [[0, '#fff3c4'], [1, '#e8cd7b']]); rr(x0, by - bh, len, bh, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x0 + 3, by - bh + 3, len - 6, 2);
    // paper wrapper on left part with gram marks
    const pw = Math.min(len, 54);
    ctx.fillStyle = lg(0, by - bh, 0, by, [[0, '#f5f2ea'], [1, '#d8d2c4']]); ctx.fillRect(x0 - 1, by - bh - 1, pw, bh + 2);
    ctx.strokeStyle = 'rgba(180,60,50,.6)'; ctx.lineWidth = 0.8; ctx.font = '600 5px Inter, sans-serif'; ctx.fillStyle = 'rgba(180,60,50,.8)'; ctx.textAlign = 'center';
    for (let gm = 25; gm < it.grams; gm += 25) { const x = x0 + len - gm / 250 * 92; if (x < x0 + 2) break; ctx.beginPath(); ctx.moveTo(x, by - bh); ctx.lineTo(x, by - bh + (gm % 50 ? 4 : 7)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(70,90,140,.7)'; ctx.font = '700 6px Georgia, serif'; ctx.fillText('BUTTER', x0 + pw / 2, by - 6);
  }
  ctx.fillStyle = lg(-w / 2, 0, w / 2, 0, [[0, '#d7d3cb'], [0.3, '#ffffff'], [1, '#c9c4ba']]);
  ctx.beginPath(); ctx.moveTo(-w / 2, -10); ctx.lineTo(w / 2, -10); ctx.lineTo(w / 2 - 8, 0); ctx.lineTo(-w / 2 + 8, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.1)'; ctx.stroke();
}
function drawButterPiece(it) {
  const w = it.w, h = it.h;
  ctx.fillStyle = lg(0, -h, 0, 0, [[0, '#fff3c4'], [1, '#e5c870']]); rr(-w / 2, -h, w, h, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-w / 2 + 3, -h + 2.5, w - 6, 1.6);
  ctx.fillStyle = 'rgba(160,120,40,.18)'; ctx.fillRect(w / 2 - 4, -h + 2, 4, h - 2);
}

/* ---------- tools (tip at origin, extend upward) ---------- */
function steel(x0, x1) { return lg(x0, 0, x1, 0, [[0, '#7c848a'], [0.45, '#f2f4f5'], [1, '#737b80']]); }
function drawSpoonTool(it) {
  const L = DEF[it.kind].L, big = DEF[it.kind].spoon === 15, r = big ? 12 : 8.5;
  ctx.fillStyle = steel(-3, 3); ctx.beginPath(); ctx.moveTo(-2, -r * 1.2); ctx.lineTo(2, -r * 1.2); ctx.lineTo(4, -L + 8); ctx.quadraticCurveTo(0, -L - 2, -4, -L + 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#59616a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -L + 12, 3, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#4b535a'; ctx.font = '700 5px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.save(); ctx.translate(0, -L * 0.55); ctx.rotate(-Math.PI / 2); ctx.fillText(big ? '1 TBSP' : '1 TSP', 0, 2); ctx.restore();
  ctx.fillStyle = lg(-r, 0, r, 0, [[0, '#6f777d'], [0.4, '#eef1f2'], [1, '#6a7278']]); ctx.beginPath(); ctx.ellipse(0, -r * 0.5, r, r * 0.62, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, -r, 0, 0, [[0, '#59616a'], [1, '#c7ccd0']]); ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r - 2, r * 0.38, 0, 0, TAU); ctx.fill();
  if (it.m && it.m.total() > 0.05) {
    const m = it.m, f = m.form(), c = m.color();
    if (f === 'cookie' || f === 'dough' || f === 'shaggy') { ctx.fillStyle = radg(-r * 0.3, -r * 1.3, 1, r * 1.4, [[0, rgb(shade(c, 0.15))], [1, rgb(shade(c, -0.2))]]); ctx.beginPath(); ctx.ellipse(0, -r * 0.95, r * 0.95, r * 0.85, 0, 0, TAU); ctx.fill(); if (m.g.chips) { ctx.fillStyle = '#2b170d'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-r * 0.5 + i * r * 0.33, -r * (0.7 + (i % 2) * 0.5), 1.6, 0, TAU); ctx.fill(); } } }
    else if (f === 'liquid' || f === 'batter') { ctx.fillStyle = rgb(c, 0.95); ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r - 2.5, r * 0.32, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke(); }
    else { ctx.fillStyle = radg(0, -r, 0, r, [[0, rgb(shade(c, 0.15))], [1, rgb(shade(c, -0.12))]]); ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r - 1.5, r * 0.36, 0, 0, Math.PI); ctx.lineTo(-r + 1.5, -r * 0.62); ctx.fill(); ctx.fillStyle = rgb(shade(c, 0.05)); ctx.fillRect(-r + 1.5, -r * 0.62 - 1.5, (r - 1.5) * 2, 2); if (ING[m.kinds()[0]]?.type === 'grain') { ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 5; i++) ctx.fillRect(-r + 3 + i * r * 0.4, -r * 0.62 - 1.5, 1, 1); } }
  }
}
function drawWhiskTool(L) {
  const hL = L * 0.42;
  ctx.fillStyle = steel(-5, 5); rr(-5, -L, 10, hL, 5); ctx.fill();
  ctx.strokeStyle = '#59616a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -L - 4, 4.5, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#8f979c'; ctx.fillRect(-5.5, -L + hL - 3, 11, 5);
  const top = -L + hL + 2;
  for (let j = 0; j < 6; j++) {
    const wj = 4 + 18 * Math.abs(Math.cos(j / 6 * Math.PI + 0.3));
    ctx.strokeStyle = j % 2 ? '#a7aeb3' : '#d9dde0'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-3, top); ctx.bezierCurveTo(-wj, top + (L - hL) * 0.45, -wj * 1.1, -2, 0, 0); ctx.bezierCurveTo(wj * 1.1, -2, wj, top + (L - hL) * 0.45, 3, top); ctx.stroke();
  }
}
function drawSpatulaTool(L) {
  ctx.fillStyle = lg(-5, 0, 5, 0, [[0, '#2d2d2d'], [0.4, '#5a5a5a'], [1, '#232323']]); rr(-4.5, -L, 9, L * 0.68, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-2.5, -L + 6, 1.5, L * 0.6);
  ctx.strokeStyle = '#777'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, -L + 8, 2.5, 0, TAU); ctx.stroke();
  ctx.fillStyle = lg(-17, 0, 17, 0, [[0, '#b65a44'], [0.4, '#df7d63'], [1, '#a64e3a']]);
  ctx.beginPath(); ctx.moveTo(-6, -L * 0.34); ctx.lineTo(6, -L * 0.34); ctx.lineTo(17, -L * 0.26); ctx.lineTo(17, -5); ctx.quadraticCurveTo(17, 0, 10, 0); ctx.lineTo(-10, 0); ctx.quadraticCurveTo(-17, 0, -17, -5); ctx.lineTo(-17, -L * 0.26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-13, -L * 0.25, 3, L * 0.2);
}
function drawAttWhisk(L, spin = 0) {
  ctx.fillStyle = steel(-6, 6); ctx.fillRect(-6, -L, 12, 22);
  ctx.fillStyle = '#9aa1a6'; ctx.fillRect(-14, -L + 22, 28, 6);
  const top = -L + 28;
  for (let j = 0; j < 8; j++) {
    const ph = j / 8 * Math.PI + spin; const wj = 26 * Math.cos(ph);
    ctx.strokeStyle = Math.sin(ph) > 0 ? '#e1e5e7' : '#8f979c'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-12, top); ctx.bezierCurveTo(wj - 10, top + (L - 28) * 0.55, wj * 0.9, -4, 0, 0); ctx.moveTo(12, top); ctx.bezierCurveTo(wj + 10, top + (L - 28) * 0.55, wj * 0.9, -4, 0, 0); ctx.stroke();
  }
}
function drawAttHook(L, spin = 0) {
  ctx.fillStyle = steel(-6, 6); ctx.fillRect(-6, -L, 12, 24);
  const s = Math.cos(spin);
  ctx.strokeStyle = lg(-20, 0, 20, 0, [[0, '#7c848a'], [0.5, '#eef1f2'], [1, '#737b80']]); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -L + 22); ctx.bezierCurveTo(26 * s, -L * 0.55, 30 * s, -L * 0.15, 8 * s, -4); ctx.bezierCurveTo(-6 * s, 4, -20 * s, -14, -14 * s, -30); ctx.stroke();
  ctx.lineCap = 'butt';
}
function drawToolShape(it) {
  const k = it.kind, L = DEF[k].L;
  if (k === 'tbsp' || k === 'tsp') drawSpoonTool(it);
  else if (k === 'whisk') drawWhiskTool(L);
  else if (k === 'spatula') drawSpatulaTool(L);
  else if (k === 'attWhisk') drawAttWhisk(L);
  else if (k === 'attHook') drawAttHook(L);
}
