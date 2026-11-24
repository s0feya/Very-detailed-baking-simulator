'use strict';
/* =========================================================
   Static room + fixed appliances
   ========================================================= */
const BG = document.createElement('canvas');
function paintBG() {
  BG.width = W * 2; BG.height = H * 2;
  const saved = ctx; ctx = BG.getContext('2d'); ctx.scale(2, 2);
  // wall
  ctx.fillStyle = lg(0, 0, 0, CT_BACK, [[0, '#f0ede8'], [1, '#e6e1da']]); ctx.fillRect(0, 0, W, CT_BACK);
  ctx.fillStyle = radg(620, 60, 0, 1000, [[0, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, CT_BACK);
  ctx.fillStyle = TEX.wall; ctx.fillRect(0, 0, W, CT_BACK);
  // backsplash: matte subway tiles
  const ty0 = 452;
  for (let r = 0, y = ty0; y < CT_BACK; r++, y += 24) {
    for (let x = CX0 - (r % 2) * 32; x < CX1; x += 64) {
      const x0 = Math.max(x, CX0), x1 = Math.min(x + 64, CX1); if (x1 <= x0) continue;
      const v = hash(r * 31 + x) * 0.04;
      ctx.fillStyle = lg(0, y, 0, y + 24, [[0, `rgba(250,249,246,1)`], [1, `rgba(${236 - v * 200},${233 - v * 200},${228 - v * 200},1)`]]);
      ctx.fillRect(x0 + 1, y + 1, x1 - x0 - 2, 22);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x0 + 2, y + 1.5, x1 - x0 - 4, 1.2);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,.04)'; ctx.fillRect(CX0, ty0 - 2, CX1 - CX0, 2);
  // shelves
  [SH1, SH2].forEach(y => {
    ctx.fillStyle = lg(0, y + 14, 0, y + 60, [[0, 'rgba(60,45,30,.16)'], [1, 'rgba(60,45,30,0)']]); ctx.fillRect(SHX0 + 6, y + 14, SHX1 - SHX0 - 12, 46);
    [SHX0 + 40, SHX1 - 40].forEach(bx => { ctx.fillStyle = '#2f2c2a'; ctx.beginPath(); ctx.moveTo(bx - 3, y + 12); ctx.lineTo(bx + 3, y + 12); ctx.lineTo(bx + 3, y + 46); ctx.lineTo(bx - 3, y + 40); ctx.fill(); });
    ctx.fillStyle = lg(0, y - 6, 0, y, [[0, '#cfae83'], [1, '#c09a6b']]); ctx.fillRect(SHX0, y - 6, SHX1 - SHX0, 6);
    ctx.fillStyle = lg(0, y, 0, y + 14, [[0, '#b48c5d'], [1, '#93704a']]); ctx.fillRect(SHX0, y, SHX1 - SHX0, 14);
    ctx.globalAlpha = 0.25; for (let i = 0; i < 9; i++) { ctx.strokeStyle = '#7a5a36'; ctx.lineWidth = 0.7; ctx.beginPath(); const yy = y + 2 + i * 1.4; ctx.moveTo(SHX0, yy); for (let x = SHX0; x <= SHX1; x += 40) ctx.lineTo(x, yy + Math.sin(x * 0.03 + i) * 0.7); ctx.stroke(); } ctx.globalAlpha = 1;
  });
  // utensil rail
  ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(RAIL_X0, RAIL_Y + 5, RAIL_X1 - RAIL_X0, 4);
  ctx.fillStyle = lg(0, RAIL_Y - 4, 0, RAIL_Y + 4, [[0, '#f2f4f5'], [0.5, '#a9b0b5'], [1, '#6f767b']]); rr(RAIL_X0, RAIL_Y - 4, RAIL_X1 - RAIL_X0, 8, 4); ctx.fill();
  [RAIL_X0 + 4, RAIL_X1 - 4].forEach(x => { ctx.fillStyle = '#8a9196'; ctx.beginPath(); ctx.arc(x, RAIL_Y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9dde0'; ctx.beginPath(); ctx.arc(x - 1.5, RAIL_Y - 1.5, 3, 0, TAU); ctx.fill(); });
  // recipe ledge
  ctx.fillStyle = 'rgba(60,45,30,.12)'; ctx.fillRect(832, 306, 236, 14);
  ctx.fillStyle = lg(0, 296, 0, 308, [[0, '#cfae83'], [1, '#9f7a4e']]); rr(830, 296, 240, 10, 2); ctx.fill();
  // mitt hook
  ctx.fillStyle = '#2f2c2a'; ctx.beginPath(); ctx.arc(MITT.x, MITT.y, 4, 0, TAU); ctx.fill();
  // counter top
  ctx.fillStyle = lg(0, CT_BACK, 0, CT_FRONT, [[0, '#dcd8d1'], [0.25, '#efece7'], [1, '#f7f5f1']]); ctx.fillRect(CX0, CT_BACK, CX1 - CX0, CT_FRONT - CT_BACK);
  ctx.globalAlpha = 0.18; for (let i = 0; i < 26; i++) { ctx.strokeStyle = i % 3 ? '#c9c3ba' : '#b8b1a6'; ctx.lineWidth = 0.6 + Math.random(); ctx.beginPath(); let x = CX0 + Math.random() * (CX1 - CX0), y = CT_BACK + Math.random() * 60; ctx.moveTo(x, y); for (let k = 0; k < 8; k++) { x += 20 + Math.random() * 30; y += (Math.random() - 0.5) * 8; ctx.lineTo(x, clamp(y, CT_BACK, CT_FRONT)); } ctx.stroke(); } ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(60,50,40,.12)'; ctx.fillRect(CX0, CT_BACK, CX1 - CX0, 3);
  ctx.fillStyle = lg(0, CT_FRONT, 0, CT_FRONT + 14, [[0, '#fbfaf8'], [0.4, '#e9e5df'], [1, '#cfcac2']]); ctx.fillRect(CX0, CT_FRONT, CX1 - CX0, 14);
  // base cabinets
  ctx.fillStyle = '#d7d3cc'; ctx.fillRect(CX0, CT_FRONT + 14, CX1 - CX0, H);
  ctx.fillStyle = lg(0, CT_FRONT + 14, 0, CT_FRONT + 40, [[0, 'rgba(0,0,0,.18)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(CX0, CT_FRONT + 14, CX1 - CX0, 26);
  const doors = [[CX0, 520], [520, 780], [780, 1040], [1040, CX1]];
  doors.forEach(([a, b]) => cabinetDoor(a + 3, CT_FRONT + 18, b - a - 6, 880 - CT_FRONT - 22, true));
  ctx.fillStyle = '#4a4642'; ctx.fillRect(CX0, 880, CX1 - CX0, 20);
  // tall oven column
  ctx.fillStyle = '#d4d0c9'; ctx.fillRect(1290, 30, 310, H - 30);
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(1290, 30, 3, H - 30);
  cabinetDoor(1296, 36, 298, 112, false, true);
  cabinetDoor(1296, 560, 298, 156, true);
  cabinetDoor(1296, 720, 298, 156, true);
  ctx.fillStyle = '#4a4642'; ctx.fillRect(1290, 880, 310, 20);
  // oven housing recess
  ctx.fillStyle = '#2b2a29'; ctx.fillRect(OV.x0 - 8, OV.py0 - 8, OV.x1 - OV.x0 + 16, OV.dy1 - OV.py0 + 16);
  // left wall area behind fridge
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(FR.x1, 64, 8, CT_BACK - 64);
  ctx = saved;
}
function cabinetDoor(x, y, w, h, handleTop, handleBottom) {
  ctx.fillStyle = lg(x, y, x + w, y + h, [[0, '#dedad3'], [1, '#cfcac2']]); rr(x, y, w, h, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.strokeRect(x + 13, y + 13, w - 24, h - 24);
  const hy = handleTop ? y + 18 : handleBottom ? y + h - 18 : null;
  if (hy) {
    const hw = Math.min(140, w * 0.5);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(x + w / 2 - hw / 2, hy + 3, hw, 5, 2.5); ctx.fill();
    ctx.fillStyle = lg(0, hy - 3, 0, hy + 4, [[0, '#f5f6f7'], [0.5, '#a3a9ae'], [1, '#70777c']]); rr(x + w / 2 - hw / 2, hy - 3, hw, 6, 3); ctx.fill();
  }
}

/* ---------- fridge ---------- */
function drawFridgeBody() {
  const { x0, x1, y0, y1 } = FR; const a = FR.open;
  // interior (visible when opening)
  if (a > 0.02) {
    ctx.fillStyle = '#9da3a6'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = lg(FR.ix0, 0, FR.ix1, 0, [[0, '#d9dfe2'], [0.12, '#f4f7f8'], [0.88, '#f4f7f8'], [1, '#d4dadd']]);
    ctx.fillRect(FR.ix0, y0 + 16, FR.ix1 - FR.ix0, y1 - y0 - 40);
    ctx.fillStyle = radg(140, y0 + 30, 0, 260, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(235,245,255,0)']]); ctx.fillRect(FR.ix0, y0 + 16, FR.ix1 - FR.ix0, 300);
    ctx.fillStyle = '#ffffff'; rr(110, y0 + 20, 60, 6, 3); ctx.fill();
    // crisper drawers
    ctx.fillStyle = 'rgba(205,220,226,.65)'; rr(FR.ix0 + 6, 680, FR.ix1 - FR.ix0 - 12, 160, 6); ctx.fill();
    ctx.fillStyle = 'rgba(120,170,90,.55)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(70 + i * 36, 800, 24, 34, 0.3 * (i % 2 ? 1 : -1), 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(230,240,244,.75)'; rr(FR.ix0 + 6, 740, FR.ix1 - FR.ix0 - 12, 100, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; rr(110, 750, 60, 6, 3); ctx.fill();
    FR.shelves.forEach(y => {
      ctx.fillStyle = 'rgba(220,235,240,.6)'; ctx.fillRect(FR.ix0, y, FR.ix1 - FR.ix0, 4);
      ctx.fillStyle = 'rgba(150,165,172,.8)'; ctx.fillRect(FR.ix0, y + 4, FR.ix1 - FR.ix0, 3);
      ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(FR.ix0, y + 7, FR.ix1 - FR.ix0, 10);
    });
    // decorative jars on the top shelf
    ctx.fillStyle = '#b8343a'; rr(196, 300 - 46, 34, 40, 5); ctx.fill(); ctx.fillStyle = '#e9e2d4'; ctx.fillRect(196, 300 - 52, 34, 8); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(200, 300 - 42, 5, 30);
  }
}
function drawFridgeDoor() {
  const { x0, x1, y0, y1 } = FR; const a = FR.open; const th = a * Math.PI * 0.55;
  const fullW = x1 - x0, wv = fullW * Math.cos(th), grow = Math.sin(th) * 26;
  const rx = x0 + Math.max(wv, 0);
  if (Math.cos(th) > 0.12) {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(rx, y0 - grow); ctx.lineTo(rx, y1 + grow * 0.4); ctx.lineTo(x0, y1); ctx.closePath();
    ctx.fillStyle = lg(x0, 0, rx, 0, [[0, '#b8bcbf'], [0.25, '#e4e6e7'], [0.6, '#d3d6d8'], [1, '#aeb2b5']]); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = TEX.brushV; ctx.fillRect(x0, y0 - 40, fullW, y1 - y0 + 80);
    ctx.fillStyle = radg(80, 160, 0, 420, [[0, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(x0, y0 - 40, fullW, y1 - y0 + 80); ctx.restore();
    // handle
    const hx = x0 + (fullW - 26) * Math.cos(th), hg = grow * 0.9;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; rr(hx + 4, 330 - hg * 0.3, 10, 300, 5); ctx.fill();
    ctx.fillStyle = lg(hx, 0, hx + 12, 0, [[0, '#f6f7f8'], [0.5, '#a7adb1'], [1, '#6e757a']]); rr(hx, 324 - hg * 0.3, 11, 300 + hg * 0.2, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rx, y0 - grow); ctx.lineTo(rx, y1 + grow * 0.4); ctx.stroke();
  } else {
    // open: show inner liner with door bins as a narrow panel
    const pw = 34 + (0.12 - Math.cos(th)) * 40;
    ctx.fillStyle = lg(x0, 0, x0 + pw, 0, [[0, '#c9cfd2'], [1, '#eef2f4']]);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + pw, y0 - 30); ctx.lineTo(x0 + pw, y1 + 14); ctx.lineTo(x0, y1); ctx.fill();
    [250, 430, 610].forEach(y => { ctx.fillStyle = 'rgba(190,210,218,.8)'; ctx.fillRect(x0 + 3, y, pw - 4, 40); });
  }
  // fridge side edges
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x1, y0, 2, y1 - y0);
  ctx.fillStyle = '#3c3a38'; ctx.fillRect(x0, y1, x1 - x0, 16);
}

/* ---------- oven ---------- */
function drawOvenBack() {
  const c = OV.cav;
  // frame
  ctx.fillStyle = lg(OV.x0, 0, OV.x1, 0, [[0, '#9aa0a4'], [0.3, '#e1e4e6'], [0.7, '#cfd3d6'], [1, '#8f969a']]);
  ctx.fillRect(OV.x0, OV.py0, OV.x1 - OV.x0, OV.dy1 - OV.py0);
  // control panel
  ctx.fillStyle = lg(0, OV.py0, 0, OV.py1, [[0, '#2a2a2a'], [1, '#111']]); rr(OV.x0 + 4, OV.py0 + 4, OV.x1 - OV.x0 - 8, OV.py1 - OV.py0 - 6, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(OV.x0 + 6, OV.py0 + 6, OV.x1 - OV.x0 - 12, 10);
  drawKnob(KN.temp, OV.set / 250, ['0', '50', '100', '150', '200', '250']);
  drawKnob(KN.timer, OV.timer / 3600, ['0', '10', '20', '30', '40', '50', '60']);
  ctx.font = '500 8px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8b8b8b';
  ctx.fillText('°C', KN.temp.x + 30, KN.temp.y + 22); ctx.fillText('MIN', KN.timer.x + 32, KN.timer.y + 22);
  // indicator lamp
  const lit = OV.heating;
  ctx.fillStyle = lit ? radg(1446, 193, 0, 9, [[0, '#ffd27a'], [0.5, '#ff8a1f'], [1, 'rgba(255,120,0,0)']]) : '#3a2a20';
  ctx.beginPath(); ctx.arc(1446, 193, lit ? 9 : 3.5, 0, TAU); ctx.fill();
  if (!lit) { ctx.fillStyle = '#5a3c28'; ctx.beginPath(); ctx.arc(1446, 193, 3, 0, TAU); ctx.fill(); }
  // cavity
  ctx.fillStyle = '#1c1b1a'; ctx.fillRect(OV.x0 + 6, OV.dy0, OV.x1 - OV.x0 - 12, OV.dy1 - OV.dy0);
  ctx.fillStyle = lg(0, c.y0, 0, c.y1, [[0, '#2c2b2b'], [1, '#3b3937']]); ctx.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0);
  // perspective walls
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(c.x0, c.y0); ctx.lineTo(c.x0 + 22, c.y0 + 18); ctx.lineTo(c.x0 + 22, c.y1 - 16); ctx.lineTo(c.x0, c.y1); ctx.fill();
  ctx.beginPath(); ctx.moveTo(c.x1, c.y0); ctx.lineTo(c.x1 - 22, c.y0 + 18); ctx.lineTo(c.x1 - 22, c.y1 - 16); ctx.lineTo(c.x1, c.y1); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(c.x0 + 22, c.y1 - 16, c.x1 - c.x0 - 44, 16);
  // fan cover
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; for (let r = 10; r < 50; r += 6) { ctx.beginPath(); ctx.arc((c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2 - 10, r, 0, TAU); ctx.stroke(); }
  // heating element
  const glow = OV.heating ? 1 : clamp((OV.temp - 60) / 300, 0, 0.5);
  ctx.strokeStyle = glow > 0.05 ? rgb(mixc([70, 60, 55], [255, 110, 30], glow)) : '#555'; ctx.lineWidth = 3;
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const x = c.x0 + 30 + i * 30; ctx.moveTo(x, c.y0 + 10); ctx.lineTo(x + 15, c.y0 + 16); ctx.lineTo(x + 30, c.y0 + 10); } ctx.stroke();
  if (glow > 0.05) { ctx.strokeStyle = `rgba(255,170,80,${glow * 0.35})`; ctx.lineWidth = 9; ctx.stroke(); }
  // oven light
  if (OV.light > 0) { ctx.fillStyle = radg((c.x0 + c.x1) / 2, c.y0 + 20, 0, 260, [[0, `rgba(255,200,120,${0.35 * OV.light})`], [1, 'rgba(255,160,60,0)']]); ctx.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0); }
  // rack guides & rack
  ctx.strokeStyle = '#8e9296'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x0 + 8, OV.rackY + 2); ctx.lineTo(c.x1 - 8, OV.rackY + 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,205,210,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x0 + 26, OV.rackY - 4); ctx.lineTo(c.x1 - 26, OV.rackY - 4); ctx.stroke();
  for (let x = c.x0 + 26; x <= c.x1 - 26; x += 12) { ctx.beginPath(); ctx.moveTo(x, OV.rackY - 4); ctx.lineTo(x + (x - (c.x0 + c.x1) / 2) * 0.08, OV.rackY + 2); ctx.stroke(); }
}
function drawKnob(k, v, labels) {
  const a0 = -Math.PI * 0.75, a1 = Math.PI * 0.75;
  ctx.font = '500 7px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8f8f8f';
  labels.forEach((l, i) => { const a = lerp(a0, a1, i / (labels.length - 1)) - Math.PI / 2; ctx.fillText(l, k.x + Math.cos(a) * (k.r + 9), k.y + Math.sin(a) * (k.r + 9) + 2.5); });
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.arc(k.x + 1, k.y + 2, k.r + 1, 0, TAU); ctx.fill();
  ctx.fillStyle = radg(k.x - 6, k.y - 7, 1, k.r * 1.3, [[0, '#ffffff'], [0.4, '#c9ced2'], [1, '#6b7277']], k.x, k.y); ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(k.x, k.y, k.r - 4, 0, TAU); ctx.stroke();
  const a = lerp(a0, a1, clamp(v, 0, 1)) - Math.PI / 2;
  ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(a + Math.PI / 2);
  ctx.fillStyle = lg(-4, 0, 4, 0, [[0, '#8d9398'], [0.5, '#f1f3f4'], [1, '#868c91']]); rr(-4, -k.r + 2, 8, k.r * 2 - 4, 4); ctx.fill();
  ctx.fillStyle = '#d0402b'; ctx.fillRect(-1, -k.r + 3, 2, 6);
  ctx.restore();
}
function drawOvenDoor() {
  const c = OV.cav, a = OV.open, th = a * Math.PI / 2;
  const dx0 = OV.x0 + 6, dx1 = OV.x1 - 6, hingeY = OV.dy1, dh = OV.dy1 - OV.dy0;
  const topY = hingeY - dh * Math.cos(th) + 46 * Math.sin(th), spread = 10 * Math.sin(th);
  if (Math.cos(th) > 0.14) {
    const sy = (hingeY - topY) / dh;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(dx0 - spread, topY); ctx.lineTo(dx1 + spread, topY); ctx.lineTo(dx1, hingeY); ctx.lineTo(dx0, hingeY); ctx.closePath();
    // window hole
    const wx0 = c.x0 + 16, wx1 = c.x1 - 16, wy0 = topY + 52 * sy, wy1 = topY + (dh - 48) * sy;
    ctx.moveTo(wx0, wy0); ctx.lineTo(wx0, wy1); ctx.lineTo(wx1, wy1); ctx.lineTo(wx1, wy0); ctx.closePath();
    ctx.fillStyle = lg(0, topY, 0, hingeY, [[0, '#1b1b1c'], [1, '#0d0d0e']]); ctx.fill('evenodd');
    // window glass
    ctx.fillStyle = OV.light > 0 ? `rgba(40,20,5,${0.5 - OV.light * 0.15})` : 'rgba(10,10,12,.72)'; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.fillStyle = lg(wx0, wy0, wx1, wy1, [[0, 'rgba(255,255,255,.12)'], [0.35, 'rgba(255,255,255,.02)'], [0.4, 'rgba(255,255,255,.08)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    // handle
    const hy = topY + 18 * sy;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(dx0 + 20, hy + 6, dx1 - dx0 - 40, 6, 3); ctx.fill();
    ctx.fillStyle = lg(0, hy - 5, 0, hy + 5, [[0, '#fafbfb'], [0.5, '#a6acb0'], [1, '#626a6f']]); rr(dx0 + 14 - spread, hy - 5, dx1 - dx0 - 28 + spread * 2, 10, 5); ctx.fill();
    ctx.restore();
  } else {
    ctx.beginPath(); ctx.moveTo(dx0, hingeY); ctx.lineTo(dx1, hingeY); ctx.lineTo(dx1 + spread, topY); ctx.lineTo(dx0 - spread, topY); ctx.closePath();
    ctx.fillStyle = lg(0, hingeY, 0, topY, [[0, '#3a3938'], [1, '#262525']]); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(c.x0 + 14, hingeY + 6, c.x1 - c.x0 - 28, Math.max(0, topY - hingeY - 14));
    ctx.fillStyle = '#999'; ctx.fillRect(dx0 - spread, topY - 2, dx1 - dx0 + spread * 2, 3);
  }
}

/* ---------- scale ---------- */
function drawScale() {
  const { x, w, h } = SCALE, y = REST;
  shadow(x, y, w);
  ctx.fillStyle = lg(0, y - h, 0, y, [[0, '#f4f4f2'], [1, '#c9cbcb']]); rr(x - w / 2, y - h + 4, w, h - 4, 6); ctx.fill();
  // glass platform
  ctx.fillStyle = lg(0, y - h, 0, y - h + 7, [[0, 'rgba(255,255,255,.95)'], [1, 'rgba(190,200,205,.9)']]); rr(x - w / 2 - 3, y - h, w + 6, 7, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(120,135,140,.5)'; ctx.lineWidth = 1; ctx.stroke();
  // lcd
  ctx.fillStyle = '#5d6460'; rr(x - 42, y - h + 10, 64, 15, 2); ctx.fill();
  ctx.fillStyle = '#b9c6b4'; rr(x - 40, y - h + 11.5, 60, 12, 1.5); ctx.fill();
  const val = Math.round(SCALE.disp - SCALE.tare);
  ctx.fillStyle = '#1f2620'; ctx.font = '600 11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'right';
  ctx.fillText((Math.abs(val) < 1 ? '0' : val) + '', x + 8, y - h + 21.5);
  ctx.font = '600 7px Inter, system-ui, sans-serif'; ctx.fillText('g', x + 17, y - h + 21.5);
  // tare button
  ctx.fillStyle = lg(0, y - h + 10, 0, y - h + 24, [[0, '#fafafa'], [1, '#b8bcbc']]); ctx.beginPath(); ctx.arc(x + 48, y - h + 17, 7, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();
  ctx.fillStyle = '#7b8283'; ctx.font = '600 5.5px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TARE', x + 48, y - h + 19);
}
function drawRack() {
  const { x, w } = RACK, y = REST, top = RACK_TOP;
  shadow(x, y, w, 0.15);
  ctx.strokeStyle = '#5c6166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 8, y); ctx.lineTo(x - w / 2 + 12, top); ctx.moveTo(x + w / 2 - 8, y); ctx.lineTo(x + w / 2 - 12, top); ctx.stroke();
  ctx.fillStyle = '#6b7075'; ctx.fillRect(x - w / 2, top - 2, w, 3);
  ctx.strokeStyle = 'rgba(200,205,210,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w / 2, top - 2.5); ctx.lineTo(x + w / 2, top - 2.5); ctx.stroke();
}

/* ---------- stand mixer ---------- */
const ENAMEL = [176, 192, 178];
function drawMixerBase() {
  const y = REST;
  shadow(1190, y, 210, 0.3);
  // base plate
  ctx.fillStyle = lg(0, y - 16, 0, y, [[0, rgb(shade(ENAMEL, 0.25))], [1, rgb(shade(ENAMEL, -0.25))]]); rr(MX.x0, y - 16, MX.x1 - MX.x0, 16, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(MX.x0 + 10, y - 15, MX.x1 - MX.x0 - 20, 2);
  // column
  ctx.fillStyle = lg(1232, 0, 1286, 0, [[0, rgb(shade(ENAMEL, -0.2))], [0.35, rgb(shade(ENAMEL, 0.3))], [1, rgb(shade(ENAMEL, -0.3))]]);
  ctx.beginPath(); ctx.moveTo(1226, y - 14); ctx.bezierCurveTo(1236, y - 80, 1240, y - 150, 1238, y - 200); ctx.lineTo(1286, y - 200); ctx.bezierCurveTo(1288, y - 140, 1290, y - 70, 1290, y - 14); ctx.closePath(); ctx.fill();
  // bowl clamp
  ctx.fillStyle = lg(0, y - 30, 0, y - 14, [[0, '#e8ecee'], [1, '#8e969b']]); rr(MX.seatX - 52, y - 24, 104, 10, 4); ctx.fill();
}
function drawMixerHead() {
  const y = REST, hy = y - 196;
  // attachment shaft hub
  ctx.fillStyle = lg(MX.seatX - 9, 0, MX.seatX + 9, 0, [[0, '#7c848a'], [0.5, '#f0f2f3'], [1, '#737b80']]); ctx.fillRect(MX.seatX - 8, hy, 16, 12);
  // head body
  ctx.beginPath(); ctx.moveTo(1112, hy - 2); ctx.bezierCurveTo(1088, hy - 6, 1086, hy - 54, 1112, y - 258);
  ctx.lineTo(1262, y - 262); ctx.bezierCurveTo(1296, y - 262, 1300, hy, 1270, hy - 2); ctx.closePath();
  ctx.fillStyle = lg(0, y - 262, 0, hy, [[0, rgb(shade(ENAMEL, 0.35))], [0.45, rgb(ENAMEL)], [1, rgb(shade(ENAMEL, -0.3))]]); ctx.fill();
  ctx.fillStyle = radg(1150, y - 248, 0, 90, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
  // chrome band
  ctx.fillStyle = lg(0, hy - 30, 0, hy - 22, [[0, '#ffffff'], [0.5, '#9aa2a7'], [1, '#e8ebed']]); ctx.fillRect(1100, hy - 30, 182, 6);
  // front nose cap
  ctx.fillStyle = lg(0, y - 250, 0, hy, [[0, '#f6f7f8'], [1, '#8b9398']]); ctx.beginPath(); ctx.ellipse(1098, (hy + y - 258) / 2, 8, 26, 0, 0, TAU); ctx.fill();
  // speed lever
  const la = -0.9 + MX.speed * 0.45;
  ctx.save(); ctx.translate(1282, y - 218); ctx.rotate(la);
  ctx.fillStyle = lg(0, -3, 0, 3, [[0, '#f5f6f7'], [1, '#7d858a']]); rr(0, -3, 26, 6, 3); ctx.fill();
  ctx.fillStyle = '#2d2d2d'; ctx.beginPath(); ctx.arc(26, 0, 4.5, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = rgb(shade(ENAMEL, -0.4)); ctx.beginPath(); ctx.arc(1282, y - 218, 4, 0, TAU); ctx.fill();
  ctx.font = '600 7px Inter, system-ui, sans-serif'; ctx.fillStyle = 'rgba(40,50,40,.55)'; ctx.textAlign = 'left';
  ['0', '1', '2', '3'].forEach((s, i) => { const a = -0.9 + i * 0.45; ctx.fillText(s, 1282 + Math.cos(a) * 36 - 2, y - 218 + Math.sin(a) * 36 + 3); });
}
function drawMixer(bowl, attIt) {
  drawMixerBase();
  const ins = () => drawAttachmentOnMixer(attIt);
  if (bowl) drawItemAt(bowl, ins); else ins();
  drawMixerHead();
}
function drawAttachmentOnMixer(attIt) {
  if (!attIt) return;
  ctx.save(); ctx.translate(MX.seatX, REST - 36);
  const L = 150; // from hub to tip
  if (attIt.kind === 'attWhisk') drawAttWhisk(L, MX.spin); else drawAttHook(L, MX.spin);
  ctx.restore();
}

/* ---------- clock ---------- */
function drawClock() {
  const { x, y, r } = CLOCK;
  ctx.fillStyle = 'rgba(60,45,30,.18)'; ctx.beginPath(); ctx.arc(x + 4, y + 7, r + 2, 0, TAU); ctx.fill();
  ctx.fillStyle = lg(0, y - r, 0, y + r, [[0, '#4a4744'], [1, '#232120']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = radg(x - 12, y - 16, 0, r, [[0, '#ffffff'], [1, '#ebe8e3']]); ctx.beginPath(); ctx.arc(x, y, r - 6, 0, TAU); ctx.fill();
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; const big = i % 5 === 0; ctx.strokeStyle = big ? '#2a2826' : '#8e8a85'; ctx.lineWidth = big ? 2.4 : 1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r - 10), y + Math.sin(a) * (r - 10)); ctx.lineTo(x + Math.cos(a) * (r - (big ? 17 : 13)), y + Math.sin(a) * (r - (big ? 17 : 13))); ctx.stroke(); }
  const s = gameT % 60, m = (gameT / 60) % 60, h = (gameT / 3600) % 12;
  const hand = (a, len, wdt, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = col; ctx.lineWidth = wdt; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, len * 0.18); ctx.lineTo(0, -len); ctx.stroke(); ctx.restore(); };
  hand(h / 12 * TAU, r * 0.48, 4, '#1f1d1c');
  hand(m / 60 * TAU, r * 0.72, 3, '#1f1d1c');
  if (CLOCK.mult < 6) hand(s / 60 * TAU, r * 0.78, 1, '#c4412c');
  else { ctx.fillStyle = 'rgba(196,65,44,.12)'; ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#1f1d1c'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(x - 14, y - 24, 26, 12, -0.5, 0, TAU); ctx.fill();
}

/* ---------- oven mitt ---------- */
function mittPath(s = 1) {
  ctx.beginPath();
  ctx.moveTo(-18 * s, 52 * s); ctx.lineTo(-20 * s, 10 * s); ctx.bezierCurveTo(-34 * s, 4 * s, -38 * s, -18 * s, -26 * s, -22 * s);
  ctx.bezierCurveTo(-20 * s, -24 * s, -16 * s, -12 * s, -14 * s, -6 * s); ctx.bezierCurveTo(-16 * s, -40 * s, -6 * s, -52 * s, 4 * s, -52 * s);
  ctx.bezierCurveTo(18 * s, -52 * s, 22 * s, -36 * s, 20 * s, -10 * s); ctx.lineTo(18 * s, 52 * s); ctx.closePath();
}
function drawMitt(x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  mittPath(s); ctx.fillStyle = lg(-30 * s, 0, 24 * s, 0, [[0, '#8a3a2c'], [0.4, '#c25a43'], [1, '#7c3427']]); ctx.fill();
  ctx.save(); ctx.clip(); ctx.globalAlpha = 0.18; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  for (let i = -60; i < 60; i += 7) { ctx.beginPath(); ctx.moveTo(-40 * s, i * s); ctx.lineTo(40 * s, (i + 30) * s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-40 * s, (i + 30) * s); ctx.lineTo(40 * s, i * s); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#e9e1d3'; ctx.fillRect(-19 * s, 40 * s, 37 * s, 12 * s);
  ctx.restore();
}

/* ---------- recipe cards ---------- */
function drawCard(x, y, w, h, R, rot = 0, full = false, ticks = null) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(40,30,20,.18)'; ctx.fillRect(-w / 2 + 3, -h + 4, w, h);
  ctx.fillStyle = lg(0, -h, 0, 0, [[0, '#fffdf8'], [1, '#f3eee3']]); ctx.fillRect(-w / 2, -h, w, h);
  const k = w / 380;
  ctx.strokeStyle = 'rgba(120,150,190,.25)'; ctx.lineWidth = Math.max(0.5, k);
  for (let ly = -h + 70 * k; ly < -8 * k; ly += 22 * k) { ctx.beginPath(); ctx.moveTo(-w / 2 + 8 * k, ly); ctx.lineTo(w / 2 - 8 * k, ly); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(210,90,80,.35)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h + 56 * k); ctx.lineTo(w / 2, -h + 56 * k); ctx.stroke();
  ctx.fillStyle = '#2d3a4f'; ctx.textAlign = 'left';
  ctx.font = `700 ${34 * k}px Caveat, 'Bradley Hand', cursive`; ctx.fillText(R.name, -w / 2 + 14 * k, -h + 42 * k);
  ctx.font = `500 ${13 * k}px Inter, system-ui, sans-serif`; ctx.fillStyle = '#7b6f60';
  ctx.textAlign = 'right'; ctx.fillText(R.chill ? `chill ${R.chill} min` : R.noOven ? 'no oven' : `${R.temp} °C · ${R.time} min`, w / 2 - 14 * k, -h + 40 * k); ctx.textAlign = 'left';
  if (full) {
    ctx.font = `600 ${22 * k}px Caveat, cursive`;
    let ly = -h + 86 * k;
    ctx.fillStyle = '#2d3a4f';
    R.lines.forEach((l, i) => { const col = i % 2, row = Math.floor(i / 2); ctx.fillText('· ' + l, -w / 2 + 16 * k + col * (w / 2 - 10 * k), ly + row * 22 * k); });
    ly += Math.ceil(R.lines.length / 2) * 22 * k + 14 * k;
    ctx.font = `500 ${21 * k}px Caveat, cursive`;
    R.steps.forEach((s, i) => {
      const done = ticks && ticks[i];
      ctx.fillStyle = done ? 'rgba(45,58,79,.45)' : '#2d3a4f';
      const words = (i + 1 + '. ' + s.t).split(' '); let line = '', yy = ly;
      words.forEach(wd => { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w - 56 * k) { ctx.fillText(line, -w / 2 + 30 * k, yy); line = '   ' + wd; yy += 21 * k; } else line = t; });
      ctx.fillText(line, -w / 2 + 30 * k, yy);
      if (done) { ctx.strokeStyle = '#4c7a4a'; ctx.lineWidth = 2.2 * k; ctx.beginPath(); ctx.moveTo(-w / 2 + 12 * k, ly - 6 * k); ctx.lineTo(-w / 2 + 17 * k, ly - 1 * k); ctx.lineTo(-w / 2 + 26 * k, ly - 13 * k); ctx.stroke(); }
      ly = yy + 23 * k;
    });
  } else {
    // tiny illustration of the bake
    ctx.save(); ctx.translate(0, -h * 0.35); ctx.scale(k * 2.2, k * 2.2); drawCardIcon(R.product); ctx.restore();
  }
  ctx.restore();
}
function drawCardIcon(p) {
  if (p === 'cake') { ctx.fillStyle = '#d9a35b'; ctx.beginPath(); ctx.ellipse(0, -8, 30, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f1dcb0'; ctx.fillRect(-30, -8, 60, 18); ctx.fillStyle = '#c58a45'; ctx.beginPath(); ctx.ellipse(0, -8, 30, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#b84a4a'; ctx.fillRect(-30, 0, 60, 3); }
  else if (p === 'cookies') { [[-18, 0], [12, -4], [0, 8]].forEach(([x, y]) => { ctx.fillStyle = '#c98b48'; ctx.beginPath(); ctx.ellipse(x, y, 15, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a2a18'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 7 + i * 5, y - 2 + (i % 2) * 4, 1.8, 0, TAU); ctx.fill(); } }); }
  else { ctx.fillStyle = '#b8743a'; ctx.beginPath(); ctx.moveTo(-30, 10); ctx.lineTo(-30, -4); ctx.bezierCurveTo(-30, -24, 30, -24, 30, -4); ctx.lineTo(30, 10); ctx.fill(); ctx.fillStyle = '#e8c48a'; ctx.beginPath(); ctx.ellipse(0, -12, 16, 4, 0, 0, TAU); ctx.fill(); }
}
