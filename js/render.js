'use strict';
/* Static map layer and per-frame canvas rendering */

/* ============================================================
   MAP (static layer)
   ============================================================ */
function buildMap(sectorId) {
  const curSecId = sectorId || (typeof G !== 'undefined' && G && G.sector) || (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  const sec = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : (typeof MAP_SECTORS !== 'undefined' ? MAP_SECTORS.foundry : null);
  const pal = (sec && sec.palette) || { ground: [27, 35, 32], road: [42, 47, 51], curb: '#566068', lane: 'rgba(226,167,46,0.5)', accent: '#f97316' };

  mapCanvas = document.createElement('canvas');
  mapCanvas.width = Math.round(W * S); mapCanvas.height = Math.round(H * S);
  const m = mapCanvas.getContext('2d'); m.scale(S, S);
  const rng = mulberry(20261111);
  m.fillStyle = sec ? sec.bg : '#171d1b'; m.fillRect(0, 0, W, H);
  // ground: mottled earth, rocks, grass tufts, cracks, build-pad brackets
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (pathTile[r][col]) continue;
    const x = col * TILE, y = r * TILE, n = Math.floor(rng() * 7);
    m.fillStyle = 'rgb(' + (pal.ground[0] + n) + ',' + (pal.ground[1] + n) + ',' + (pal.ground[2] + n) + ')'; m.fillRect(x, y, TILE, TILE);
    for (let k = 0; k < 28; k++) {
      m.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)';
      m.fillRect(x + rng() * TILE, y + rng() * TILE, 1 + rng() * 2.4, 1 + rng() * 2.4);
    }
    const q = rng(), cx = x + 14 + rng() * (TILE - 28), cy = y + 14 + rng() * (TILE - 28);
    if (q < 0.14) {
      const rx = 6 + rng() * 4, ry = 4 + rng() * 3;
      m.fillStyle = 'rgba(0,0,0,0.35)'; m.beginPath(); m.ellipse(cx + 2, cy + 3, rx, ry, 0, 0, TAU); m.fill();
      m.fillStyle = pal.curb; m.beginPath(); m.ellipse(cx, cy, rx, ry, 0, 0, TAU); m.fill();
    } else if (q < 0.3) {
      m.strokeStyle = pal.accent + '55'; m.lineWidth = 1.3;
      for (let i = -1; i <= 2; i++) { m.beginPath(); m.moveTo(cx + i * 3, cy); m.lineTo(cx + i * 3 + rng() * 4 - 2, cy - 5 - rng() * 4); m.stroke(); }
    } else if (q < 0.38) {
      m.strokeStyle = 'rgba(0,0,0,0.35)'; m.lineWidth = 1; m.beginPath(); m.moveTo(cx - 8, cy - 3); m.lineTo(cx, cy + 1); m.lineTo(cx + 4, cy - 2); m.lineTo(cx + 9, cy + 4); m.stroke();
    }
    m.strokeStyle = 'rgba(200,214,224,0.10)'; m.lineWidth = 1.5;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const px = x + 6 + sx * (TILE - 12), py = y + 6 + sy * (TILE - 12), dx = sx ? -1 : 1, dy = sy ? -1 : 1;
      m.beginPath(); m.moveTo(px + dx * 9, py); m.lineTo(px, py); m.lineTo(px, py + dy * 9); m.stroke();
    }
  }
  m.strokeStyle = 'rgba(0,0,0,0.3)'; m.lineWidth = 1;
  for (let i = 0; i <= COLS; i++) { m.beginPath(); m.moveTo(i * TILE + 0.5, 0); m.lineTo(i * TILE + 0.5, H); m.stroke(); }
  for (let i = 0; i <= ROWS; i++) { m.beginPath(); m.moveTo(0, i * TILE + 0.5); m.lineTo(W, i * TILE + 0.5); m.stroke(); }
  // road: asphalt / terrain with biome palette
  for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
    if (!pathTile[r][col]) continue;
    const x = col * TILE, y = r * TILE, n = Math.floor(rng() * 5);
    m.fillStyle = 'rgb(' + (pal.road[0] + n) + ',' + (pal.road[1] + n) + ',' + (pal.road[2] + n) + ')'; m.fillRect(x, y, TILE, TILE);
    for (let k = 0; k < 36; k++) {
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
    m.fillStyle = pal.curb;
    if (open(col, r - 1)) m.fillRect(x, y, TILE, 5.5);
    if (open(col, r + 1)) m.fillRect(x, y + TILE - 5.5, TILE, 5.5);
    if (open(col - 1, r)) m.fillRect(x, y, 5.5, TILE);
    if (open(col + 1, r)) m.fillRect(x + TILE - 5.5, y, 5.5, TILE);
    m.fillStyle = '#101418';
    if (open(col, r - 1)) m.fillRect(x, y + 5.5, TILE, 1.5);
    if (open(col, r + 1)) m.fillRect(x, y + TILE - 7, TILE, 1.5);
    if (open(col - 1, r)) m.fillRect(x + 5.5, y, 1.5, TILE);
    if (open(col + 1, r)) m.fillRect(x + TILE - 7, y, 1.5, TILE);
  }
  for (const s of SEG) {
    const nx = -Math.sin(s.ang), ny = Math.cos(s.ang);
    for (const o of [-13, 13]) { m.strokeStyle = 'rgba(0,0,0,0.16)'; m.lineWidth = 5; m.beginPath(); m.moveTo(s.x1 + nx * o, s.y1 + ny * o); m.lineTo(s.x2 + nx * o, s.y2 + ny * o); m.stroke(); }
  }
  m.strokeStyle = pal.lane; m.lineWidth = 2.5; m.setLineDash([14, 12]);
  m.beginPath(); PATH.forEach((p, i) => i ? m.lineTo(p.x, p.y) : m.moveTo(p.x, p.y)); m.stroke();
  if (PATH_BREACH.length > 0) {
    m.beginPath(); PATH_BREACH.forEach((p, i) => i ? m.lineTo(p.x, p.y) : m.moveTo(p.x, p.y)); m.stroke();
  }
  m.setLineDash([]);
  const vg = m.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  m.fillStyle = vg; m.fillRect(0, 0, W, H);
}

/* ============================================================
   RENDER
   ============================================================ */
function drawFlow(c) {
  const sp = (G.anim * 46) % 60;
  const curSecId = (G && G.sector) || (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  const sec = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : null;
  const flowCol = (sec && sec.palette && sec.palette.accent) || '#e2a72e';

  c.fillStyle = flowCol + '44';
  for (let d = sp; d < PLEN; d += 60) {
    const p = posAt(d, 0);
    c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
    c.beginPath(); c.moveTo(6, 0); c.lineTo(-3, -6); c.lineTo(-1, 0); c.lineTo(-3, 6); c.closePath(); c.fill(); c.restore();
  }
  const isPath1Active = (curSecId === 'abyss') || (G.wave >= (curSecId === 'abyssal' ? 5 : (curSecId === 'quarantine' || curSecId === 'metropolis' ? 6 : (curSecId === 'skyspire' ? 7 : 8))));
  if (PLEN_BREACH > 0 && isPath1Active) {
    c.fillStyle = 'rgba(239,68,68,0.35)';
    for (let d = sp; d < PLEN_BREACH; d += 60) {
      const p = posAt(d, 0, 1);
      c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
      c.beginPath(); c.moveTo(6, 0); c.lineTo(-3, -6); c.lineTo(-1, 0); c.lineTo(-3, 6); c.closePath(); c.fill(); c.restore();
    }
  }
}
function drawLeylineNodes(c, time) {
  if (typeof LEYLINE_NODES === 'undefined') return;
  for (const k in LEYLINE_NODES) {
    const node = LEYLINE_NODES[k];
    const cx = node.c * TILE + TILE / 2, cy = node.r * TILE + TILE / 2;
    const pulse = Math.sin(time * 3 + node.c) * 0.2 + 0.8;
    c.save();
    c.fillStyle = node.color + '1a';
    c.fillRect(node.c * TILE + 2, node.r * TILE + 2, TILE - 4, TILE - 4);
    c.strokeStyle = node.color;
    c.lineWidth = 1.5;
    c.globalAlpha = 0.5 * pulse;
    c.strokeRect(node.c * TILE + 3, node.r * TILE + 3, TILE - 6, TILE - 6);

    c.globalAlpha = 0.7 * pulse;
    c.beginPath();
    c.arc(cx, cy, 14 + Math.sin(time * 4) * 2, 0, TAU);
    c.strokeStyle = node.color;
    c.lineWidth = 2;
    c.stroke();

    c.fillStyle = node.color;
    c.font = '700 12px ' + FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(node.icon || '◈', cx, cy);
    c.restore();
  }
}
function drawFuelCells(c, time) {
  if (!G.fuelCells) return;
  for (const fc of G.fuelCells) {
    if (fc.dead) {
      c.save();
      c.fillStyle = 'rgba(28,25,23,0.7)';
      c.beginPath(); c.arc(fc.x, fc.y, fc.r + 3, 0, TAU); c.fill();
      c.strokeStyle = '#431407'; c.lineWidth = 2; c.stroke();
      c.restore();
      continue;
    }
    const pulse = Math.sin(time * 4 + fc.id) * 0.15 + 0.85;
    const col = fc.color || '#f97316';
    c.save();
    c.translate(fc.x, fc.y);

    // Threat aura
    c.fillStyle = col + '26';
    c.beginPath(); c.arc(0, 0, (fc.r + 6) * pulse, 0, TAU); c.fill();

    // Body container
    c.fillStyle = '#0f172a';
    c.beginPath(); c.arc(0, 0, fc.r, 0, TAU); c.fill();
    c.fillStyle = col + '44';
    c.beginPath(); c.arc(0, 0, fc.r - 2.5, 0, TAU); c.fill();

    // Inner core
    c.fillStyle = col;
    c.beginPath(); c.arc(0, 0, 5 * pulse, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(0, 0, 2.5, 0, TAU); c.fill();

    c.strokeStyle = col;
    c.lineWidth = 1.8;
    c.beginPath(); c.arc(0, 0, fc.r, 0, TAU); c.stroke();

    // Badges & Labels
    const shortLabel = fc.type === 'cryo_tank' ? 'CRYO' :
      (fc.type === 'spore_pod' ? 'SPORE' :
      (fc.type === 'tesla_pylon' ? 'TESLA' :
      (fc.type === 'sun_monolith' ? 'SOLAR' :
      (fc.type === 'emp_terminal' ? 'EMP' :
      (fc.type === 'hydro_geyser' ? 'HYDRO' : 'TNT')))));

    c.fillStyle = '#ffffff';
    c.font = '800 8.5px ' + FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(shortLabel, 0, 0);

    c.fillStyle = col;
    c.font = '700 8px ' + FONT;
    c.fillText('[CLICK]', 0, fc.r + 8);
    c.restore();
  }
}
function drawSpawnBase(c) {
  const t = G.anim;
  const curSecId = (G && G.sector) || (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  const sec = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : (typeof MAP_SECTORS !== 'undefined' ? MAP_SECTORS.foundry : null);
  const portalCol = (sec && sec.color) || '#e2a72e';

  // Primary Spawn Portal
  if (PATH.length > 0) {
    const pt = PATH[0];
    const px = Math.max(12, Math.min(W - 12, pt.x <= 0 ? 12 : pt.x));
    const py = Math.max(12, Math.min(H - 12, pt.y <= 0 ? 12 : pt.y));
    c.save(); c.translate(px, py);
    c.fillStyle = portalCol + '33'; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
    c.fillStyle = '#0f172a'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
    c.strokeStyle = portalCol; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = portalCol; c.font = '800 8px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(curSecId === 'abyss' ? 'WEST' : 'GATE 1', 0, 16);
    c.restore();
  }

  // Secondary Spawn Portal / Breach
  const isPath1Active = (curSecId === 'abyss') || (G.wave >= (curSecId === 'abyssal' ? 5 : (curSecId === 'quarantine' || curSecId === 'metropolis' ? 6 : (curSecId === 'skyspire' ? 7 : 8))));
  if (PATH_BREACH.length > 0 && isPath1Active) {
    const pt = PATH_BREACH[0];
    const px = Math.max(16, Math.min(W - 16, pt.x <= 0 ? 16 : pt.x));
    const py = Math.max(16, Math.min(H - 16, pt.y <= 0 ? 16 : pt.y));
    c.save(); c.translate(px, py);
    const pulse = Math.sin(t * 6) > 0;
    c.fillStyle = pulse ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)';
    c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
    c.fillStyle = '#0f172a'; c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
    c.strokeStyle = '#ef4444'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ef4444'; c.font = '800 8px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(curSecId === 'abyss' ? 'NORTH' : '! BREACH !', 0, 16);
    c.restore();
  }

  // Base Structure
  c.save(); c.translate(BASE_PT.x, BASE_PT.y);
  const hex = r => { c.beginPath(); for (let i = 0; i < 6; i++) { const q = i * TAU / 6 + Math.PI / 6; c.lineTo(Math.cos(q) * r, Math.sin(q) * r); } c.closePath(); };
  const hit = G.baseFlash > 0.02;
  c.fillStyle = '#0b0f12'; hex(27); c.fill();
  c.fillStyle = '#1d2429'; hex(24); c.fill();
  c.lineWidth = 3; c.strokeStyle = hit ? '#d9534f' : '#8fa0ab'; hex(24); c.stroke();
  c.save(); c.rotate(-t * 0.5); c.strokeStyle = '#5d6b74'; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.stroke(); c.restore();
  c.fillStyle = hit ? '#d9534f' : '#6dbf8b'; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
  c.fillStyle = '#0b0f12'; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
  const citLv = typeof getWorkshopLevel === 'function' ? getWorkshopLevel('citadel_turret') : 0;
  if (citLv > 0) {
    c.save();
    c.rotate(t * 2.5);
    c.fillStyle = '#f43f5e';
    c.fillRect(0, -2, 11, 4);
    c.fillStyle = '#e2e8f0';
    c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(244,63,94,0.25)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 2.5 * TILE, 0, TAU); c.stroke();
  }
  c.fillStyle = '#7e8d97'; c.font = '700 9px ' + FONT; c.textAlign = 'center'; c.fillText('BASE', 0, 41);
  c.restore();
}

function drawAtmosphericParticles(c, time) {
  const curSecId = (G && G.sector) || (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  let pCol = 'rgba(249,115,22,0.35)';
  let pDirY = -1, pSpeed = 18;
  if (curSecId === 'abyss') { pCol = 'rgba(224,242,254,0.45)'; pDirY = 1; pSpeed = 24; }
  else if (curSecId === 'quarantine') { pCol = 'rgba(163,230,53,0.35)'; pDirY = -0.5; pSpeed = 12; }
  else if (curSecId === 'skyspire') { pCol = 'rgba(165,180,252,0.45)'; pDirY = -0.2; pSpeed = 8; }
  else if (curSecId === 'dunes') { pCol = 'rgba(234,179,8,0.35)'; pDirY = 0.4; pSpeed = 30; }
  else if (curSecId === 'metropolis') { pCol = 'rgba(34,211,238,0.4)'; pDirY = -1; pSpeed = 22; }
  else if (curSecId === 'abyssal') { pCol = 'rgba(45,212,191,0.45)'; pDirY = -1.2; pSpeed = 16; }

  c.fillStyle = pCol;
  for (let i = 0; i < 22; i++) {
    const seed = i * 937.13;
    const px = (seed * 11 + time * (12 + (i % 7) * 4)) % W;
    const py = ((seed * 19 + time * pSpeed * pDirY) % H + H) % H;
    const size = 1.2 + (i % 4) * 0.7;
    c.fillRect(px, py, size, size);
  }
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
        c.beginPath(); c.moveTo(sx - 3, sy); c.lineTo(sx + 3, sy); c.moveTo(sx, sy - 3); c.lineTo(sx + 3, sy); c.stroke();
      }
    } else if (h.type === 'frostfire') {
      const k = clamp(h.life / h.max, 0, 1);
      const g = c.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
      g.addColorStop(0, 'rgba(56,189,248,' + (0.4 * k) + ')');
      g.addColorStop(0.5, 'rgba(251,146,60,' + (0.3 * k) + ')');
      g.addColorStop(1, 'rgba(56,189,248,0)');
      c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(147,197,253,' + (0.6 * k) + ')'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(h.x, h.y, h.r * 0.7, 0, TAU); c.stroke();
    } else if (h.type === 'singularity') {
      const k = clamp(h.life / h.max, 0, 1);
      c.save(); c.translate(h.x, h.y); c.rotate(time * 3);
      const g = c.createRadialGradient(0, 0, 4, 0, 0, h.r);
      g.addColorStop(0, 'rgba(15,23,42,' + (0.9 * k) + ')');
      g.addColorStop(0.4, 'rgba(56,189,248,' + (0.35 * k) + ')');
      g.addColorStop(1, 'rgba(56,189,248,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, h.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(56,189,248,' + (0.7 * k) + ')'; c.lineWidth = 2; c.setLineDash([12, 8]);
      c.beginPath(); c.arc(0, 0, h.r * 0.8, 0, TAU); c.stroke();
      c.beginPath(); c.arc(0, 0, h.r * 0.4, 0, TAU); c.stroke();
      c.restore();
    } else if (h.type === 'mine') {
      c.fillStyle = '#334155'; c.beginPath(); c.arc(h.x, h.y, 7, 0, TAU); c.fill();
      c.strokeStyle = '#f59e0b'; c.lineWidth = 1.5; c.stroke();
      const blink = Math.sin(time * 12) > 0;
      c.fillStyle = blink ? '#ef4444' : '#7f1d1d'; c.beginPath(); c.arc(h.x, h.y, 2.5, 0, TAU); c.fill();
    } else if (h.type === 'beacon') {
      const hpPct = clamp(h.hp / h.maxHp, 0, 1);
      c.fillStyle = '#1e293b'; c.fillRect(h.x - 8, h.y - 4, 16, 8);
      c.strokeStyle = '#38bdf8'; c.lineWidth = 1.5; c.strokeRect(h.x - 8, h.y - 4, 16, 8);
      const f = 0.5 + 0.5 * Math.sin(time * 15);
      c.fillStyle = 'rgba(56,189,248,' + (0.2 + 0.15 * f) + ')';
      c.beginPath(); c.moveTo(h.x - 12, h.y - 20); c.lineTo(h.x + 12, h.y - 20); c.lineTo(h.x + 6, h.y - 4); c.lineTo(h.x - 6, h.y - 4); c.closePath(); c.fill();
      c.strokeStyle = '#38bdf8'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#0f172a'; c.fillRect(h.x - 14, h.y - 28, 28, 4);
      c.fillStyle = '#38bdf8'; c.fillRect(h.x - 14, h.y - 28, 28 * hpPct, 4);
    } else if (h.type === 'drone') {
      c.save(); c.translate(h.x, h.y);
      const ang = Math.atan2(BASE_PT.y - h.y, BASE_PT.x - h.x);
      c.rotate(ang);
      c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(8, 0); c.lineTo(-6, -6); c.lineTo(-3, 0); c.lineTo(-6, 6); c.closePath(); c.fill();
      c.strokeStyle = '#fee2e2'; c.lineWidth = 1.2; c.stroke();
      glow(c, 0, 0, 10, '#ef4444', 0.6);
      c.restore();
    } else if (h.type === 'chrono_echo') {
      const pulse = 0.5 + 0.5 * Math.sin(time * 10);
      c.strokeStyle = 'rgba(56,189,248,' + (0.4 + 0.4 * pulse) + ')';
      c.lineWidth = 2; c.setLineDash([4, 4]);
      c.beginPath(); c.arc(h.x, h.y, 14, 0, TAU); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(56,189,248,0.2)'; c.beginPath(); c.arc(h.x, h.y, 14, 0, TAU); c.fill();
      c.fillStyle = '#38bdf8'; c.font = '700 9px ' + FONT; c.textAlign = 'center';
      c.fillText(Math.ceil(h.timer) + 's', h.x, h.y - 18);
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
  } else if (G.casting === 'minefield') {
    c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.setLineDash([5, 5]);
    c.beginPath(); c.arc(mx, my, 48, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(245,158,11,0.18)'; c.beginPath(); c.arc(mx, my, 48, 0, TAU); c.fill();
    c.fillStyle = '#f59e0b'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('DEPLOY 6 PROXIMITY MINES', mx, my - 54);
  } else if (G.casting === 'carpet_bomb') {
    c.strokeStyle = '#ef4444'; c.lineWidth = 2.5; c.setLineDash([8, 6]);
    c.beginPath(); c.arc(mx, my, 65, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(239,68,68,0.18)'; c.beginPath(); c.arc(mx, my, 65, 0, TAU); c.fill();
    c.fillStyle = '#ef4444'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('HEAVY CARPET BOMBING INBOUND', mx, my - 72);
  } else if (G.casting === 'swap_towers') {
    c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.setLineDash([4, 4]);
    c.beginPath(); c.arc(mx, my, 36, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#38bdf8'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText(G.swapSource ? 'CLICK SECOND TOWER TO SWAP' : 'CLICK FIRST TOWER TO SWAP', mx, my - 44);
  } else if (G.casting === 'cryo_singularity') {
    c.strokeStyle = '#60a5fa'; c.lineWidth = 2; c.setLineDash([10, 6]);
    c.beginPath(); c.arc(mx, my, 120, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(96,165,250,0.14)'; c.beginPath(); c.arc(mx, my, 120, 0, TAU); c.fill();
    c.fillStyle = '#93c5fd'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('CRYO SINGULARITY (120px VORTEX)', mx, my - 128);
  } else if (G.casting === 'holo_beacon') {
    c.strokeStyle = '#38bdf8'; c.lineWidth = 2;
    c.fillStyle = 'rgba(56,189,248,0.2)';
    c.beginPath(); c.arc(mx, my, 28, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#38bdf8'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('DEPLOY DECOY HOLO-BEACON (400 HP)', mx, my - 36);
  } else if (G.casting === 'cyber_hijack') {
    c.strokeStyle = '#a855f7'; c.lineWidth = 2; c.setLineDash([6, 4]);
    c.beginPath(); c.arc(mx, my, 42, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#a855f7'; c.font = '700 12px ' + FONT; c.textAlign = 'center';
    c.fillText('TARGET HOSTILE TO CYBER-HIJACK', mx, my - 48);
  }
}

function render() {
  const c = ctx;
  c.setTransform(S, 0, 0, S, 0, 0);
  c.clearRect(0, 0, W, H);
  c.save();
  if (G.shake > 0.2) c.translate(rand(-1, 1) * G.shake, rand(-1, 1) * G.shake);
  c.drawImage(mapCanvas, 0, 0, W, H);
  const time = G.anim;
  drawFlow(c);
  drawBiomassCreep(c, time);
  drawLeylineNodes(c, time);
  drawFuelCells(c, time);
  drawSpawnBase(c);
  drawHazards(c, time);
  drawAtmosphericParticles(c, time);
  drawResonanceBeams(c, time);
  drawFieldAnomalies(c, time);
  drawSporeSpires(c, time);
  drawSeismicPillars(c, time);
  drawCorpses(c, time);
  drawReclaimedMinions(c, time);
  drawNeuralSynapses(c, time);
  drawGhostEchoes(c, time);

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
      const def = TD[G.placing];
      const cost = typeof getTowerCost === 'function' ? getTowerCost(G.placing) : def.cost;
      const fuelCellBlocked = G.fuelCells && G.fuelCells.some(fc => !fc.dead && fc.c === hc && fc.row === hr);
      const ok = !pathTile[hr][hc] && !G.grid[hr][hc] && !fuelCellBlocked;
      const afford = G.gold >= cost, good = ok && afford;
      c.fillStyle = good ? 'rgba(52,211,153,0.16)' : 'rgba(244,63,94,0.2)'; c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      c.strokeStyle = good ? '#34d399' : '#f43f5e'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      const rg = def.tiers[0].range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE, cx = x + TILE / 2, cy = y + TILE / 2;
      c.fillStyle = good ? 'rgba(52,211,153,0.07)' : 'rgba(244,63,94,0.07)'; c.strokeStyle = good ? 'rgba(52,211,153,0.6)' : 'rgba(244,63,94,0.5)';
      c.lineWidth = 1.5; c.setLineDash([6, 5]); c.beginPath(); if (!G.activeContract || G.activeContract !== 'blind_fire') { c.arc(cx, cy, rg, 0, TAU); c.fill(); c.stroke(); } c.setLineDash([]);
      if (ok) { c.globalAlpha = 0.65; drawTowerSprite(c, G.placing, 0, { x: cx, y: cy, angle: -Math.PI / 4, spin: time, charge: 1 }, time); c.globalAlpha = 1; }
    } else if (G.grid[hr][hc] && G.grid[hr][hc] !== G.sel) {
      const t = G.grid[hr][hc], rg = getTierData(t).range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE;
      c.strokeStyle = 'rgba(148,163,184,0.45)'; c.lineWidth = 1.5; c.setLineDash([4, 5]); c.beginPath(); c.arc(t.x, t.y, rg, 0, TAU); c.stroke(); c.setLineDash([]);
    } else if (!G.grid[hr][hc] && !pathTile[hr][hc]) {
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1; c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    }
  }
  if (G.sel && (!G.activeContract || G.activeContract !== 'blind_fire')) {
    const t = G.sel, def = TD[t.type], rg = getTierData(t).range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE;
    c.fillStyle = 'rgba(255,255,255,0.045)'; c.strokeStyle = t.branch ? def.branches[t.branch].color : def.color; c.lineWidth = 1.5; c.setLineDash([8, 6]);
    c.beginPath(); c.arc(t.x, t.y, rg, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, t.x - 28, t.y - 28, 56, 56, 10); c.stroke();
  }
  for (const t of G.towers) drawTowerSprite(c, t.type, t.tier, t, time);
  drawTowerHeatGauges(c, time);
  for (const e of G.enemies) if (e.type !== 'boss' && e.x > -30) drawEnemy(c, e, time);
  for (const e of G.enemies) if (e.type === 'boss' && e.x > -40) drawEnemy(c, e, time);
  for (const e of G.enemies) if (e.x > -10) drawBars(c, e);
  drawSyndicateGunship(c, time);
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
  // Golden Adrenaline Rush Screen Glow (4.0)
  if (G.adrenalineT > 0) {
    const aPulse = 0.5 + 0.5 * Math.sin(time * 8);
    c.save();
    c.strokeStyle = 'rgba(251,191,36,' + (0.35 + 0.25 * aPulse) + ')';
    c.lineWidth = 6;
    c.strokeRect(3, 3, W - 6, H - 6);
    c.restore();
  }
  // Core Overload Hyper-Drive Screen Glow (4.0)
  if (G.overloadT > 0) {
    const oPulse = 0.5 + 0.5 * Math.sin(time * 15);
    c.save();
    c.strokeStyle = 'rgba(244,63,94,' + (0.45 + 0.35 * oPulse) + ')';
    c.lineWidth = 8;
    c.strokeRect(4, 4, W - 8, H - 8);
    c.restore();
  }
  // Meltdown Brownout Flicker
  if (G.meltdownT > 0 && Math.random() < 0.2) {
    c.fillStyle = 'rgba(251,113,133,0.08)';
    c.fillRect(0, 0, W, H);
  }
  // 6.0 Chrono Ripple & Paradox Glitch
  drawChronoRipple(c, time);
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

function drawFieldAnomalies(c, time) {
  if (!G || !G.anomalies) return;
  for (const an of G.anomalies) {
    if (an.type === 'supply_drop') {
      glow(c, an.x, an.y, 22, '#fbbf24', 0.6 + 0.3 * Math.sin(time * 6));
      c.fillStyle = '#1e293b'; c.strokeStyle = '#fbbf24'; c.lineWidth = 2;
      rr(c, an.x - 14, an.y - 14, 28, 28, 4); c.fill(); c.stroke();
      c.fillStyle = '#fbbf24';
      c.fillRect(an.x - 2, an.y - 8, 4, 16);
      c.fillRect(an.x - 8, an.y - 2, 16, 4);
      const hpPct = clamp(an.hp / an.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.75)'; c.fillRect(an.x - 16, an.y - 22, 32, 5);
      c.fillStyle = '#fbbf24'; c.fillRect(an.x - 15, an.y - 21, 30 * hpPct, 3);
    } else if (an.type === 'ion_thunderstrike') {
      c.save(); c.translate(an.x, an.y); c.rotate(time * 3);
      c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.setLineDash([8, 6]);
      c.beginPath(); c.arc(0, 0, an.r, 0, TAU); c.stroke();
      c.beginPath(); c.moveTo(-an.r - 8, 0); c.lineTo(an.r + 8, 0); c.stroke();
      c.beginPath(); c.moveTo(0, -an.r - 8); c.lineTo(0, an.r + 8); c.stroke();
      c.restore();
      c.fillStyle = '#38bdf8'; c.font = '800 11px ' + FONT; c.textAlign = 'center';
      c.fillText('ION STRIKE: ' + an.life.toFixed(1) + 's', an.x, an.y - an.r - 10);
    } else if (an.type === 'smuggler_drone') {
      glow(c, an.x, an.y, 20, '#c084fc', 0.7);
      c.fillStyle = '#2e1065'; c.strokeStyle = '#c084fc'; c.lineWidth = 2;
      rr(c, an.x - 14, an.y - 8, 28, 16, 4); c.fill(); c.stroke();
      for (const rx of [-12, 12]) {
        for (const ry of [-8, 8]) {
          c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(an.x + rx, an.y + ry, 3, 0, TAU); c.fill();
        }
      }
      c.fillStyle = '#fde047'; c.beginPath(); c.arc(an.x, an.y, 3, 0, TAU); c.fill();
      c.fillStyle = '#e9d5ff'; c.font = '800 9.5px ' + FONT; c.textAlign = 'center';
      c.fillText('SMUGGLER [CLICK]', an.x, an.y - 12);
    } else if (an.type === 'chrono_rift') {
      c.save(); c.translate(an.x, an.y); c.rotate(-time * 4);
      glow(c, 0, 0, an.r, '#818cf8', 0.7);
      c.strokeStyle = '#818cf8'; c.lineWidth = 2.5; c.setLineDash([10, 8]);
      c.beginPath(); c.arc(0, 0, an.r, 0, TAU); c.stroke();
      c.strokeStyle = '#c084fc'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, an.r * 0.6, 0, TAU); c.stroke();
      c.restore();
    }
  }
}

/* ============================================================
   BASTION TD 5.0 DEEP SYNERGY CANVAS RENDERING
   ============================================================ */

function drawBiomassCreep(c, time) {
  if (!G || !G.creep) return;
  c.save();
  for (const key in G.creep) {
    const [row, col] = key.split(',').map(Number);
    const x = col * TILE, y = row * TILE;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + col * 1.5 + row * 2);
    c.fillStyle = 'rgba(63, 98, 18, 0.45)';
    c.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    c.strokeStyle = '#84cc16';
    c.lineWidth = 1.5;
    c.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);

    c.fillStyle = '#a3e635';
    c.globalAlpha = pulse * 0.8;
    c.beginPath();
    c.arc(x + 16, y + 16, 3.5, 0, TAU);
    c.arc(x + 44, y + 42, 4, 0, TAU);
    c.arc(x + 42, y + 18, 3, 0, TAU);
    c.arc(x + 18, y + 44, 3, 0, TAU);
    c.fill();
    c.globalAlpha = 1.0;
  }
  c.restore();
}

function drawResonanceBeams(c, time) {
  if (!G || !G.resonanceLines || G.resonanceLines.length === 0) return;
  const isWide = typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('prism_beam_width');
  const baseW = isWide ? 4.5 : 2.5;

  c.save();
  for (const l of G.resonanceLines) {
    const col = (l.conf && l.conf.color) || '#38bdf8';
    const pulse = 0.7 + 0.3 * Math.sin(time * 8 + l.x1);

    c.strokeStyle = col;
    c.globalAlpha = 0.35 * pulse;
    c.lineWidth = baseW * 3.5;
    c.beginPath();
    c.moveTo(l.x1, l.y1);
    c.lineTo(l.x2, l.y2);
    c.stroke();

    c.globalAlpha = 0.95;
    c.lineWidth = baseW;
    c.beginPath();
    c.moveTo(l.x1, l.y1);
    c.lineTo(l.x2, l.y2);
    c.stroke();

    const tProg = (time * 1.8) % 1.0;
    const sparkX = lerp(l.x1, l.x2, tProg);
    const sparkY = lerp(l.y1, l.y2, tProg);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(sparkX, sparkY, baseW * 1.4, 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawSporeSpires(c, time) {
  if (!G || !G.sporeSpires) return;
  for (const sp of G.sporeSpires) {
    if (sp.dead) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 5 + sp.x);
    glow(c, sp.x, sp.y, 24, '#84cc16', 0.6 * pulse);
    c.fillStyle = '#365314';
    c.strokeStyle = '#a3e635';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(sp.x - 14, sp.y + 16);
    c.lineTo(sp.x, sp.y - 18);
    c.lineTo(sp.x + 14, sp.y + 16);
    c.closePath();
    c.fill(); c.stroke();

    c.fillStyle = '#84cc16';
    c.beginPath();
    c.arc(sp.x, sp.y - 10, 6 + 2 * pulse, 0, TAU);
    c.fill();

    const hpPct = clamp(sp.hp / sp.maxHp, 0, 1);
    c.fillStyle = 'rgba(0,0,0,0.7)';
    c.fillRect(sp.x - 16, sp.y - 28, 32, 5);
    c.fillStyle = '#84cc16';
    c.fillRect(sp.x - 15, sp.y - 27, 30 * hpPct, 3);
  }
}

function drawSeismicPillars(c, time) {
  if (!G || !G.seismicPillars) return;
  for (const p of G.seismicPillars) {
    if (p.hp <= 0) continue;
    c.fillStyle = '#44403c';
    c.strokeStyle = '#a8a29e';
    c.lineWidth = 2;
    rr(c, p.x - 14, p.y - 18, 28, 36, 4);
    c.fill(); c.stroke();

    c.strokeStyle = '#f59e0b';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(p.x - 6, p.y - 10);
    c.lineTo(p.x + 4, p.y);
    c.lineTo(p.x - 2, p.y + 12);
    c.stroke();

    const hpPct = clamp(p.hp / p.maxHp, 0, 1);
    c.fillStyle = 'rgba(0,0,0,0.75)';
    c.fillRect(p.x - 16, p.y - 27, 32, 5);
    c.fillStyle = '#f59e0b';
    c.fillRect(p.x - 15, p.y - 26, 30 * hpPct, 3);
  }
}

function drawTowerHeatGauges(c, time) {
  if (!G || !G.towers) return;
  for (const t of G.towers) {
    if (t.type === 'relay') continue;
    const heat = t.heat || 0;
    if (heat < 15) continue;
    const maxH = typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.maxHeat : 100;
    const pct = clamp(heat / maxH, 0, 1);
    const col = pct >= 1 ? '#ef4444' : (pct >= 0.75 ? '#f97316' : '#f59e0b');

    c.fillStyle = 'rgba(15, 23, 42, 0.85)';
    c.fillRect(t.x - 16, t.y + 20, 32, 4);
    c.fillStyle = col;
    c.fillRect(t.x - 15, t.y + 21, 30 * pct, 2);

    if (pct >= 1) {
      const flash = 0.5 + 0.5 * Math.sin(time * 12);
      c.fillStyle = 'rgba(239, 68, 68, ' + (0.4 * flash) + ')';
      c.beginPath();
      c.arc(t.x, t.y, 26, 0, TAU);
      c.fill();
    }
  }
}

/* ============================================================
   BASTION TD 6.0 THE LIVING PARADOX CANVAS RENDERING
   ============================================================ */

function drawCorpses(c, time) {
  if (!G || !G.corpses || G.corpses.length === 0) return;
  c.save();
  for (let i = 0; i < G.corpses.length; i++) {
    const cp = G.corpses[i];
    const k = clamp(cp.life / cp.maxLife, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(time * 6 + cp.x);

    // Green nanite decay ring
    c.strokeStyle = 'rgba(34, 197, 94, ' + (0.45 * k * pulse) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cp.x, cp.y, 16 + 4 * pulse, 0, TAU);
    c.stroke();

    // Alien carcass body
    c.fillStyle = 'rgba(30, 41, 59, ' + (0.85 * k) + ')';
    c.strokeStyle = 'rgba(71, 85, 105, ' + (0.95 * k) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(cp.x, cp.y, 12, 7, Math.PI / 4, 0, TAU);
    c.fill();
    c.stroke();

    // Nanite bio-luminescence
    c.fillStyle = 'rgba(34, 197, 94, ' + (0.85 * k * pulse) + ')';
    c.beginPath();
    c.arc(cp.x - 3, cp.y - 2, 2.5, 0, TAU);
    c.arc(cp.x + 3, cp.y + 2, 2, 0, TAU);
    c.fill();

    // Interactive prompt
    c.fillStyle = '#4ade80';
    c.font = '700 8.5px ' + FONT;
    c.textAlign = 'center';
    c.fillText('RECLAIM [CLICK]', cp.x, cp.y + 16);
  }
  c.restore();
}

function drawReclaimedMinions(c, time) {
  if (!G || !G.reclaimedMinions || G.reclaimedMinions.length === 0) return;
  c.save();
  for (const m of G.reclaimedMinions) {
    if (m.type === 'colossus') {
      // Cyber-organic Colossus Bastion barrier
      const hpPct = clamp(m.hp / m.maxHp, 0, 1);
      c.fillStyle = '#1e293b';
      c.strokeStyle = '#22c55e';
      c.lineWidth = 2.5;
      rr(c, m.x - 14, m.y - 14, 28, 28, 6);
      c.fill();
      c.stroke();

      // Armor plating cross
      c.fillStyle = '#334155';
      c.fillRect(m.x - 10, m.y - 4, 20, 8);
      c.fillRect(m.x - 4, m.y - 10, 8, 20);

      // Nanite core
      c.fillStyle = '#4ade80';
      c.beginPath();
      c.arc(m.x, m.y, 4, 0, TAU);
      c.fill();

      // Colossus HP Bar
      c.fillStyle = 'rgba(0,0,0,0.8)';
      c.fillRect(m.x - 16, m.y - 22, 32, 5);
      c.fillStyle = '#22c55e';
      c.fillRect(m.x - 15, m.y - 21, 30 * hpPct, 3);

      c.fillStyle = '#86efac';
      c.font = '800 8px ' + FONT;
      c.textAlign = 'center';
      c.fillText('COLOSSUS', m.x, m.y - 25);
    } else if (m.type === 'hive') {
      // Nanite Drone Hive
      c.fillStyle = '#0f172a';
      c.strokeStyle = '#06b6d4';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(m.x, m.y, 12, 0, TAU);
      c.fill();
      c.stroke();

      // Orbiting Drones
      const dCount = m.drones || 3;
      for (let i = 0; i < dCount; i++) {
        const ang = time * 4 + (i * TAU / dCount);
        const dx = m.x + Math.cos(ang) * 20;
        const dy = m.y + Math.sin(ang) * 20;
        c.fillStyle = '#38bdf8';
        c.beginPath();
        c.arc(dx, dy, 3, 0, TAU);
        c.fill();
      }

      c.fillStyle = '#67e8f9';
      c.font = '800 8px ' + FONT;
      c.textAlign = 'center';
      c.fillText('HIVE (' + dCount + ')', m.x, m.y - 16);
    } else if (m.type === 'bio_shield') {
      // Bio-Shield Emitter Dome
      const pulse = 0.5 + 0.5 * Math.sin(time * 5);
      c.strokeStyle = 'rgba(168, 85, 247, ' + (0.5 + 0.3 * pulse) + ')';
      c.lineWidth = 2;
      c.setLineDash([6, 4]);
      c.beginPath();
      c.arc(m.x, m.y, m.r || 110, 0, TAU);
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = '#2e1065';
      c.strokeStyle = '#a855f7';
      c.lineWidth = 2;
      rr(c, m.x - 10, m.y - 10, 20, 20, 4);
      c.fill();
      c.stroke();

      c.fillStyle = '#c084fc';
      c.font = '800 8px ' + FONT;
      c.textAlign = 'center';
      c.fillText('CLEANSE DOME', m.x, m.y - 14);
    }
  }
  c.restore();
}

function drawNeuralSynapses(c, time) {
  if (!G || !G.synapses || G.synapses.length === 0) return;
  c.save();
  for (const syn of G.synapses) {
    const t1 = G.towers.find(t => t.id === syn.t1Id);
    const t2 = G.towers.find(t => t.id === syn.t2Id);
    if (!t1 || !t2) continue;

    // Glowing double-helix sine wave
    const dx = t2.x - t1.x;
    const dy = t2.y - t1.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) continue;
    const nx = -dy / dist;
    const ny = dx / dist;

    // Strand 1 (Neon Pink/Magenta)
    c.strokeStyle = 'rgba(236, 72, 153, 0.75)';
    c.lineWidth = 2;
    c.beginPath();
    for (let step = 0; step <= 20; step++) {
      const frac = step / 20;
      const wave = Math.sin(frac * TAU * 2 - time * 6) * 5;
      const px = t1.x + dx * frac + nx * wave;
      const py = t1.y + dy * frac + ny * wave;
      if (step === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    // Strand 2 (Electric Cyan / Purple)
    c.strokeStyle = 'rgba(168, 85, 247, 0.75)';
    c.lineWidth = 2;
    c.beginPath();
    for (let step = 0; step <= 20; step++) {
      const frac = step / 20;
      const wave = -Math.sin(frac * TAU * 2 - time * 6) * 5;
      const px = t1.x + dx * frac + nx * wave;
      const py = t1.y + dy * frac + ny * wave;
      if (step === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    // Central Synapse Core Node
    const mx = (t1.x + t2.x) / 2;
    const my = (t1.y + t2.y) / 2;
    c.fillStyle = '#ec4899';
    c.beginPath();
    c.arc(mx, my, 4.5, 0, TAU);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(mx, my, 2, 0, TAU);
    c.fill();

    // Synapse Label
    const synConf = (typeof NEURAL_SYNAPSE_CONFIG !== 'undefined' && NEURAL_SYNAPSE_CONFIG.pairs[syn.pairKey]) ? NEURAL_SYNAPSE_CONFIG.pairs[syn.pairKey] : null;
    const label = synConf ? synConf.name : 'SYNAPSE';
    c.fillStyle = '#f472b6';
    c.font = '800 8px ' + FONT;
    c.textAlign = 'center';
    c.fillText(label, mx, my - 9);
  }
  c.restore();
}

function drawGhostEchoes(c, time) {
  if (!G || !G.ghostEchoes || G.ghostEchoes.length === 0) return;
  c.save();
  for (const ge of G.ghostEchoes) {
    const alphaPulse = 0.45 + 0.25 * Math.sin(time * 10 + ge.x);
    c.globalAlpha = alphaPulse;

    // Cyan holographic base ring
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(ge.x, ge.y, 22, 0, TAU);
    c.stroke();
    c.setLineDash([]);

    // Translucent tower silhouette
    drawTowerSprite(c, ge.type, ge.tier, { x: ge.x, y: ge.y, angle: ge.angle, spin: time * 2, charge: 1 }, time);

    // Cyan scanline overlay
    c.fillStyle = 'rgba(56, 189, 248, 0.25)';
    c.fillRect(ge.x - 18, ge.y - 18, 36, 36);

    // Label & Time remaining
    c.fillStyle = '#38bdf8';
    c.font = '800 8.5px ' + FONT;
    c.textAlign = 'center';
    c.fillText('GHOST ECHO: ' + ge.life.toFixed(1) + 's', ge.x, ge.y - 25);
  }
  c.restore();
}

function drawSyndicateGunship(c, time) {
  if (!G || !G.syndicateGunship || !G.syndicateGunship.active) return;
  const sg = G.syndicateGunship;
  c.save();
  c.translate(sg.x, sg.y);

  // Heavy mercenary shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.4)';
  c.beginPath();
  c.ellipse(0, 26, 34, 14, 0, 0, TAU);
  c.fill();

  // Thruster exhaust
  const tFlicker = Math.random() * 4;
  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.ellipse(-24, 8, 4, 10 + tFlicker, 0, 0, TAU);
  c.ellipse(24, 8, 4, 10 + tFlicker, 0, 0, TAU);
  c.fill();

  // Gunship Hull (Matte dark composite armor)
  c.fillStyle = '#0f172a';
  c.strokeStyle = sg.bribed ? '#10b981' : (sg.hostile ? '#ef4444' : '#f59e0b');
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(0, -24);
  c.lineTo(18, -8);
  c.lineTo(28, 12);
  c.lineTo(12, 18);
  c.lineTo(0, 14);
  c.lineTo(-12, 18);
  c.lineTo(-28, 12);
  c.lineTo(-18, -8);
  c.closePath();
  c.fill();
  c.stroke();

  // Cockpit canopy
  c.fillStyle = sg.bribed ? '#34d399' : (sg.hostile ? '#f87171' : '#fbbf24');
  c.beginPath();
  c.ellipse(0, -6, 6, 12, 0, 0, TAU);
  c.fill();

  // HP Bar & Status Badge
  const hpPct = clamp(sg.hp / sg.maxHp, 0, 1);
  c.fillStyle = 'rgba(0,0,0,0.85)';
  c.fillRect(-24, -36, 48, 6);
  c.fillStyle = sg.bribed ? '#10b981' : (sg.hostile ? '#ef4444' : '#f59e0b');
  c.fillRect(-23, -35, 46 * hpPct, 4);

  c.fillStyle = sg.bribed ? '#6ee7b7' : (sg.hostile ? '#fca5a5' : '#fde68a');
  c.font = '800 8.5px ' + FONT;
  c.textAlign = 'center';
  const tag = sg.bribed ? 'ALLIED GUNSHIP' : (sg.hostile ? 'RAIDING GUNSHIP' : 'SYNDICATE GUNSHIP [CLICK]');
  c.fillText(tag, 0, -41);

  c.restore();
}

function drawChronoRipple(c, time) {
  if (!G) return;
  // Reality Paradox Wave Distortion
  if (G.timeRippleT > 0) {
    const k = clamp(G.timeRippleT, 0, 1);
    c.save();
    // Cyan / Magenta Reality Distortion Rings
    const r1 = (1 - k) * W * 0.7;
    const r2 = (1 - k) * W * 0.4;
    c.strokeStyle = 'rgba(56, 189, 248, ' + (0.6 * k) + ')';
    c.lineWidth = 8 * k;
    c.beginPath();
    c.arc(W / 2, H / 2, r1, 0, TAU);
    c.stroke();

    c.strokeStyle = 'rgba(236, 72, 153, ' + (0.5 * k) + ')';
    c.lineWidth = 5 * k;
    c.beginPath();
    c.arc(W / 2, H / 2, r2, 0, TAU);
    c.stroke();

    // Chromatic glitch lines
    c.fillStyle = 'rgba(56, 189, 248, ' + (0.12 * k) + ')';
    for (let i = 0; i < 4; i++) {
      const gy = (G.anim * 400 + i * 140) % H;
      c.fillRect(0, gy, W, 4);
    }
    c.restore();
  }

  // Paradox Entropy Glitch Vignette
  if (G.paradoxEntropy && G.paradoxEntropy > 20) {
    const pct = clamp(G.paradoxEntropy / 100, 0, 1);
    c.save();
    const glitchPulse = 0.5 + 0.5 * Math.sin(time * 16);
    c.strokeStyle = 'rgba(168, 85, 247, ' + (0.35 * pct * glitchPulse) + ')';
    c.lineWidth = 6 * pct;
    c.strokeRect(2, 2, W - 4, H - 4);
    c.restore();
  }
}
