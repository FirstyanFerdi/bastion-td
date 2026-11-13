'use strict';
/* Static map layer and per-frame canvas rendering */

/* ============================================================
   MAP (static layer)
   ============================================================ */
function buildMap() {
  mapCanvas = document.createElement('canvas');
  mapCanvas.width = Math.round(W * S); mapCanvas.height = Math.round(H * S);
  const m = mapCanvas.getContext('2d'); m.scale(S, S);
  const rng = mulberry(20261111);
  m.fillStyle = '#171d1b'; m.fillRect(0, 0, W, H);
  // ground: mottled earth, rocks, grass tufts, cracks, build-pad brackets
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (pathTile[r][col]) continue;
    const x = col * TILE, y = r * TILE, n = Math.floor(rng() * 7);
    m.fillStyle = 'rgb(' + (27 + n) + ',' + (35 + n) + ',' + (32 + n) + ')'; m.fillRect(x, y, TILE, TILE);
    for (let k = 0; k < 30; k++) {
      m.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)';
      m.fillRect(x + rng() * TILE, y + rng() * TILE, 1 + rng() * 2.4, 1 + rng() * 2.4);
    }
    const q = rng(), cx = x + 14 + rng() * (TILE - 28), cy = y + 14 + rng() * (TILE - 28);
    if (q < 0.14) {
      const rx = 6 + rng() * 4, ry = 4 + rng() * 3;
      m.fillStyle = 'rgba(0,0,0,0.35)'; m.beginPath(); m.ellipse(cx + 2, cy + 3, rx, ry, 0, 0, TAU); m.fill();
      m.fillStyle = '#38423f'; m.beginPath(); m.ellipse(cx, cy, rx, ry, 0, 0, TAU); m.fill();
      m.fillStyle = '#46524e'; m.beginPath(); m.ellipse(cx - 1.5, cy - 1.5, rx * 0.55, ry * 0.5, 0, 0, TAU); m.fill();
    } else if (q < 0.3) {
      m.strokeStyle = '#34503f'; m.lineWidth = 1.3;
      for (let i = -1; i <= 2; i++) { m.beginPath(); m.moveTo(cx + i * 3, cy); m.lineTo(cx + i * 3 + rng() * 4 - 2, cy - 5 - rng() * 4); m.stroke(); }
    } else if (q < 0.38) {
      m.strokeStyle = 'rgba(0,0,0,0.35)'; m.lineWidth = 1; m.beginPath(); m.moveTo(cx - 8, cy - 3); m.lineTo(cx, cy + 1); m.lineTo(cx + 4, cy - 2); m.lineTo(cx + 9, cy + 4); m.stroke();
    }
    m.strokeStyle = 'rgba(200,214,224,0.12)'; m.lineWidth = 1.5;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const px = x + 6 + sx * (TILE - 12), py = y + 6 + sy * (TILE - 12), dx = sx ? -1 : 1, dy = sy ? -1 : 1;
      m.beginPath(); m.moveTo(px + dx * 9, py); m.lineTo(px, py); m.lineTo(px, py + dy * 9); m.stroke();
    }
  }
  m.strokeStyle = 'rgba(0,0,0,0.3)'; m.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) { m.beginPath(); m.moveTo(i * TILE + 0.5, 0); m.lineTo(i * TILE + 0.5, H); m.stroke(); }
  for (let i = 0; i <= ROWS; i++) { m.beginPath(); m.moveTo(0, i * TILE + 0.5); m.lineTo(W, i * TILE + 0.5); m.stroke(); }
  // road: gravelly asphalt with oil stains
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (!pathTile[r][col]) continue;
    const x = col * TILE, y = r * TILE, n = Math.floor(rng() * 5);
    m.fillStyle = 'rgb(' + (42 + n) + ',' + (47 + n) + ',' + (51 + n) + ')'; m.fillRect(x, y, TILE, TILE);
    for (let k = 0; k < 46; k++) {
      m.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.25)';
      m.fillRect(x + rng() * TILE, y + rng() * TILE, 1 + rng() * 2.2, 1 + rng() * 2.2);
    }
    if (rng() < 0.25) { m.fillStyle = 'rgba(0,0,0,0.18)'; m.beginPath(); m.ellipse(x + 10 + rng() * 40, y + 10 + rng() * 40, 8 + rng() * 8, 5 + rng() * 5, rng() * 3, 0, TAU); m.fill(); }
  }
  // curbs on every edge that borders open ground
  const open = (cc, rr2) => cc >= 0 && rr2 >= 0 && cc < COLS && rr2 < ROWS && !pathTile[rr2][cc];
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (!pathTile[r][col]) continue;
    const x = col * TILE, y = r * TILE;
    m.fillStyle = '#566068';
    if (open(col, r - 1)) m.fillRect(x, y, TILE, 6);
    if (open(col, r + 1)) m.fillRect(x, y + TILE - 6, TILE, 6);
    if (open(col - 1, r)) m.fillRect(x, y, 6, TILE);
    if (open(col + 1, r)) m.fillRect(x + TILE - 6, y, 6, TILE);
    m.fillStyle = '#14181b';
    if (open(col, r - 1)) m.fillRect(x, y + 6, TILE, 1.5);
    if (open(col, r + 1)) m.fillRect(x, y + TILE - 7.5, TILE, 1.5);
    if (open(col - 1, r)) m.fillRect(x + 6, y, 1.5, TILE);
    if (open(col + 1, r)) m.fillRect(x + TILE - 7.5, y, 1.5, TILE);
  }
  for (const s of SEG) {
    const nx = -Math.sin(s.ang), ny = Math.cos(s.ang);
    for (const o of [-13, 13]) { m.strokeStyle = 'rgba(0,0,0,0.16)'; m.lineWidth = 5; m.beginPath(); m.moveTo(s.x1 + nx * o, s.y1 + ny * o); m.lineTo(s.x2 + nx * o, s.y2 + ny * o); m.stroke(); }
  }
  m.strokeStyle = 'rgba(226,167,46,0.5)'; m.lineWidth = 2.5; m.setLineDash([14, 12]);
  m.beginPath(); PATH.forEach((p, i) => i ? m.lineTo(p.x, p.y) : m.moveTo(p.x, p.y)); m.stroke(); m.setLineDash([]);
  const vg = m.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  m.fillStyle = vg; m.fillRect(0, 0, W, H);
}

/* ============================================================
   RENDER
   ============================================================ */
function drawFlow(c) {
  const sp = (G.anim * 46) % 60;
  c.fillStyle = 'rgba(226,167,46,0.2)';
  for (let d = sp; d < PLEN; d += 60) {
    const p = posAt(d, 0);
    c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
    c.beginPath(); c.moveTo(6, 0); c.lineTo(-3, -6); c.lineTo(-1, 0); c.lineTo(-3, 6); c.closePath(); c.fill(); c.restore();
  }
}
function drawSpawnBase(c) {
  const t = G.anim;
  c.save(); c.translate(0, SPAWN_PT.y);
  const gx = 3, gw = 13, gh = TILE - 6;
  c.fillStyle = '#0b0f12'; c.fillRect(gx - 2, -gh / 2 - 2, gw + 4, gh + 4);
  c.save(); c.beginPath(); c.rect(gx, -gh / 2, gw, gh); c.clip();
  c.fillStyle = '#e2a72e'; c.fillRect(gx, -gh / 2, gw, gh);
  c.fillStyle = '#15181a';
  for (let y0 = -gh / 2 - gw; y0 < gh / 2; y0 += 14) { c.beginPath(); c.moveTo(gx, y0); c.lineTo(gx + gw, y0 + gw); c.lineTo(gx + gw, y0 + gw + 7); c.lineTo(gx, y0 + 7); c.closePath(); c.fill(); }
  c.restore();
  c.fillStyle = Math.sin(t * 5) > 0 ? '#d9534f' : '#4a2a28'; c.fillRect(gx + gw + 4, -4, 5, 8);
  c.restore();
  c.save(); c.translate(BASE_PT.x, BASE_PT.y);
  const hex = r => { c.beginPath(); for (let i = 0; i < 6; i++) { const q = i * TAU / 6 + Math.PI / 6; c.lineTo(Math.cos(q) * r, Math.sin(q) * r); } c.closePath(); };
  const hit = G.baseFlash > 0.02;
  c.fillStyle = '#0b0f12'; hex(27); c.fill();
  c.fillStyle = '#1d2429'; hex(24); c.fill();
  c.lineWidth = 3; c.strokeStyle = hit ? '#d9534f' : '#8fa0ab'; hex(24); c.stroke();
  c.save(); c.rotate(-t * 0.5); c.strokeStyle = '#5d6b74'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke(); c.restore();
  c.fillStyle = hit ? '#d9534f' : '#6dbf8b'; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
  c.fillStyle = '#0b0f12'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
  c.fillStyle = '#7e8d97'; c.font = '700 9px ' + FONT; c.textAlign = 'center'; c.fillText('BASE', 0, 41);
  c.restore();
}
function drawFx(c) {
  for (const f of fxPool.items) {
    if (!f.active) continue;
    const k = f.life / f.max;
    switch (f.type) {
      case 'tracer':
        c.globalAlpha = k; c.strokeStyle = f.color; c.lineWidth = f.w; c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); break;
      case 'bolt':
        c.globalAlpha = Math.min(1, k * 1.6); c.lineJoin = 'round';
        c.strokeStyle = 'rgba(250,204,21,0.45)'; c.lineWidth = 7; c.beginPath();
        for (let i = 0; i < f.pts.length; i += 2) i ? c.lineTo(f.pts[i], f.pts[i + 1]) : c.moveTo(f.pts[0], f.pts[1]); c.stroke();
        c.strokeStyle = '#fffbeb'; c.lineWidth = 2; c.beginPath();
        for (let i = 0; i < f.pts.length; i += 2) i ? c.lineTo(f.pts[i], f.pts[i + 1]) : c.moveTo(f.pts[0], f.pts[1]); c.stroke(); break;
      case 'rail':
        c.globalAlpha = k * 0.5; c.strokeStyle = f.color; c.lineWidth = f.w * 3 * k + 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke();
        c.globalAlpha = k; c.strokeStyle = '#fff'; c.lineWidth = f.w * k + 1; c.beginPath(); c.moveTo(f.x1, f.y1); c.lineTo(f.x2, f.y2); c.stroke(); c.lineCap = 'butt'; break;
      case 'ring': {
        const r = lerp(f.r1, f.r0, k * k);
        c.globalAlpha = k; c.strokeStyle = f.color; c.lineWidth = f.w * k + 0.5; c.beginPath(); c.arc(f.x1, f.y1, r, 0, TAU); c.stroke(); break;
      }
      case 'blast': {
        const r = f.r1 * (1 - k * 0.5);
        const g = c.createRadialGradient(f.x1, f.y1, 0, f.x1, f.y1, r);
        g.addColorStop(0, 'rgba(255,237,213,' + (0.9 * k) + ')'); g.addColorStop(0.5, 'rgba(251,146,60,' + (0.5 * k) + ')'); g.addColorStop(1, 'rgba(251,146,60,0)');
        c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(f.x1, f.y1, r, 0, TAU); c.fill(); break;
      }
    }
    c.globalAlpha = 1;
  }
}
function drawHazards(c, time) {
  for (const h of G.hazards) {
    if (h.type === 'radiation') {
      const g = c.createRadialGradient(h.x, h.y, 4, h.x, h.y, h.r);
      const k = clamp(h.life / h.max, 0, 1);
      g.addColorStop(0, 'rgba(251,146,60,' + (0.45 * k) + ')');
      g.addColorStop(0.6, 'rgba(234,88,12,' + (0.25 * k) + ')');
      g.addColorStop(1, 'rgba(234,88,12,0)');
      c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(253,186,116,' + (0.4 * k) + ')'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(h.x, h.y, h.r * (0.4 + 0.3 * Math.sin(time * 6)), 0, TAU); c.stroke();
    } else if (h.type === 'caltrops') {
      const k = clamp(h.life / h.max, 0, 1);
      c.fillStyle = 'rgba(226,167,46,' + (0.15 * k) + ')'; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(242,193,79,' + (0.6 * k) + ')'; c.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        const q = i * TAU / 5 + time * 0.4, sx = h.x + Math.cos(q) * 14, sy = h.y + Math.sin(q) * 14;
        c.beginPath(); c.moveTo(sx - 3, sy); c.lineTo(sx + 3, sy); c.moveTo(sx, sy - 3); c.lineTo(sx, sy + 3); c.stroke();
      }
    }
  }
}

function drawCasting(c, time) {
  if (!G.casting || !G.mouse.in) return;
  const mx = G.mouse.x, my = G.mouse.y;
  if (G.casting === 'orbital') {
    const rad = 95 * (hasPerk('orbital_salvo') ? 1.4 : 1.0);
    c.strokeStyle = '#f43f5e'; c.lineWidth = 2; c.setLineDash([8, 6]);
    c.beginPath(); c.arc(mx, my, rad, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(244,63,94,0.14)'; c.beginPath(); c.arc(mx, my, rad, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(mx - 16, my); c.lineTo(mx + 16, my); c.moveTo(mx, my - 16); c.lineTo(mx, my + 16); c.stroke();
    c.fillStyle = '#f43f5e'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('ORBITAL IMPACT TARGET', mx, my - rad - 8);
  } else if (G.casting === 'overcharge') {
    c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.setLineDash([6, 5]);
    c.beginPath(); c.arc(mx, my, 40, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(56,189,248,0.15)'; c.beginPath(); c.arc(mx, my, 40, 0, TAU); c.fill();
    c.fillStyle = '#38bdf8'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('SELECT TOWER TO OVERCHARGE', mx, my - 48);
  } else if (G.casting === 'caltrops') {
    c.strokeStyle = '#e2a72e'; c.lineWidth = 2;
    c.fillStyle = 'rgba(226,167,46,0.2)';
    c.beginPath(); c.arc(mx, my, 34, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#e2a72e'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('DEPLOY NANITE CALTROPS ON ROAD', mx, my - 42);
  }
}

function render() {
  const c = ctx;
  c.setTransform(S, 0, 0, S, 0, 0);
  c.clearRect(0, 0, W, H);
  c.save();
  if (G.shake > 0.2) c.translate(rand(-1, 1) * G.shake, rand(-1, 1) * G.shake);
  c.drawImage(mapCanvas, 0, 0, W, H);
  drawFlow(c); drawSpawnBase(c);
  const time = G.anim;
  drawHazards(c, time);

  // Tesla Overcharger conduits
  for (const t of G.towers) {
    if (t.type === 'tesla' && t.branch === 'A' && t.empT <= 0) {
      for (const o of G.towers) {
        if (o !== t && (o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= (2.2 * TILE) ** 2) {
          c.strokeStyle = 'rgba(234,179,8,0.45)'; c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(t.x, t.y); c.lineTo((t.x + o.x) / 2 + rand(-3, 3), (t.y + o.y) / 2 + rand(-3, 3)); c.lineTo(o.x, o.y); c.stroke();
        }
      }
    }
  }

  // placement / hover / selection / casting
  if (G.casting) {
    drawCasting(c, time);
  } else if (G.hover) {
    const { c: hc, r: hr } = G.hover, x = hc * TILE, y = hr * TILE;
    if (G.placing) {
      const def = TD[G.placing], ok = !pathTile[hr][hc] && !G.grid[hr][hc], afford = G.gold >= def.cost, good = ok && afford;
      c.fillStyle = good ? 'rgba(52,211,153,0.16)' : 'rgba(244,63,94,0.2)'; c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      c.strokeStyle = good ? '#34d399' : '#f43f5e'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      const rg = def.tiers[0].range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE, cx = x + TILE / 2, cy = y + TILE / 2;
      c.fillStyle = good ? 'rgba(52,211,153,0.07)' : 'rgba(244,63,94,0.07)'; c.strokeStyle = good ? 'rgba(52,211,153,0.6)' : 'rgba(244,63,94,0.5)';
      c.lineWidth = 1.5; c.setLineDash([6, 5]); c.beginPath(); c.arc(cx, cy, rg, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
      if (ok) { c.globalAlpha = 0.65; drawTowerSprite(c, G.placing, 0, { x: cx, y: cy, angle: -Math.PI / 4, spin: time, charge: 1 }, time); c.globalAlpha = 1; }
    } else if (G.grid[hr][hc] && G.grid[hr][hc] !== G.sel) {
      const t = G.grid[hr][hc], rg = getTierData(t).range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE;
      c.strokeStyle = 'rgba(148,163,184,0.45)'; c.lineWidth = 1.5; c.setLineDash([4, 5]); c.beginPath(); c.arc(t.x, t.y, rg, 0, TAU); c.stroke(); c.setLineDash([]);
    } else if (!G.grid[hr][hc] && !pathTile[hr][hc]) {
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1; c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    }
  }
  if (G.sel) {
    const t = G.sel, def = TD[t.type], rg = getTierData(t).range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE;
    c.fillStyle = 'rgba(255,255,255,0.045)'; c.strokeStyle = t.branch ? def.branches[t.branch].color : def.color; c.lineWidth = 1.5; c.setLineDash([8, 6]);
    c.beginPath(); c.arc(t.x, t.y, rg, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, t.x - 28, t.y - 28, 56, 56, 10); c.stroke();
  }
  for (const t of G.towers) drawTowerSprite(c, t.type, t.tier, t, time);
  for (const e of G.enemies) if (e.type !== 'boss' && e.x > -30) drawEnemy(c, e, time);
  for (const e of G.enemies) if (e.type === 'boss' && e.x > -40) drawEnemy(c, e, time);
  for (const e of G.enemies) if (e.x > -10) drawBars(c, e);
  // plasma shells
  for (const p of G.proj) {
    glow(c, p.x, p.y, 13, '#fb923c', 0.9);
    c.fillStyle = '#fff7ed'; c.beginPath(); c.arc(p.x, p.y, 3.8, 0, TAU); c.fill();
  }
  drawFx(c);
  c.globalCompositeOperation = 'lighter';
  for (const p of partPool.items) {
    if (!p.active) continue;
    c.globalAlpha = clamp(p.life / p.max, 0, 1); c.fillStyle = p.color;
    if (p.round) { c.beginPath(); c.arc(p.x, p.y, p.size * 0.6, 0, TAU); c.fill(); }
    else c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.textAlign = 'center'; c.lineJoin = 'round';
  for (const t of textPool.items) {
    if (!t.active) continue;
    c.globalAlpha = clamp(t.life / t.max * 1.6, 0, 1);
    c.font = '800 ' + t.size + 'px ' + FONT;
    c.lineWidth = 3; c.strokeStyle = 'rgba(2,6,14,0.85)'; c.strokeText(t.text, t.x, t.y);
    c.fillStyle = t.color; c.fillText(t.text, t.x, t.y);
  }
  c.globalAlpha = 1;
  c.restore();
  if (G.dmgFlash > 0) {
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, 'rgba(225,29,72,0)'); g.addColorStop(1, 'rgba(225,29,72,' + (G.dmgFlash * 0.4) + ')');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  if (G.banner) {
    const b = G.banner, a = clamp(Math.min(b.t, b.max - b.t) * 3, 0, 1), by = H * 0.3, bh = b.sub ? 92 : 66;
    c.save(); c.globalAlpha = a; c.textAlign = 'center';
    c.fillStyle = 'rgba(8,10,12,0.84)'; c.fillRect(0, by - 46, W, bh);
    c.fillStyle = b.color; c.fillRect(0, by - 46, W, 3); c.fillRect(0, by - 46 + bh - 3, W, 3);
    try { c.letterSpacing = '5px'; } catch (er) { }
    c.font = '700 40px ' + FONT; c.fillStyle = '#e9eef1'; c.fillText(b.text, W / 2, by + 2);
    try { c.letterSpacing = '1px'; } catch (er) { }
    if (b.sub) { c.font = '600 14px ' + FONT; c.fillStyle = '#9fb0ba'; c.fillText(b.sub, W / 2, by + 26); }
    try { c.letterSpacing = '0px'; } catch (er) { }
    c.restore();
  }
  if (G.state === 'prep' && G.wave === 0) {
    c.save(); c.textAlign = 'center'; c.fillStyle = 'rgba(8,10,12,0.78)'; c.fillRect(W / 2 - 300, H - 52, 600, 40); c.fillStyle = '#e2a72e'; c.fillRect(W / 2 - 300, H - 52, 4, 40); c.font = '700 18px ' + FONT; c.fillStyle = '#dfe5e8';
    c.fillText('Build your defenses, then press SPACE to launch wave 1', W / 2, H - 22); c.restore();
  }
  if (G.paused && (G.state === 'prep' || G.state === 'active')) {
    c.fillStyle = 'rgba(4,8,18,0.55)'; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '900 44px ' + FONT; c.fillText('PAUSED', W / 2, H / 2 - 4);
    c.font = '600 15px ' + FONT; c.fillStyle = '#9fb0d8'; c.fillText('Press P or the pause button to resume', W / 2, H / 2 + 26);
  }
}
