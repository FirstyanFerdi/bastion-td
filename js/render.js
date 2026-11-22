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
    } else if (h.type === 'chaff_cloud') {
      const k = clamp(h.life / h.max, 0, 1);
      const g = c.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
      g.addColorStop(0, 'rgba(203,213,225,' + (0.5 * k) + ')');
      g.addColorStop(0.6, 'rgba(148,163,184,' + (0.28 * k) + ')');
      g.addColorStop(1, 'rgba(148,163,184,0)');
      c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(226,232,240,' + (0.55 * k) + ')'; c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const q = i * TAU / 4 + time * 0.8, sx = h.x + Math.cos(q) * (h.r * 0.6), sy = h.y + Math.sin(q) * (h.r * 0.6);
        c.beginPath(); c.arc(sx, sy, 1.8, 0, TAU); c.stroke();
      }
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
  drawDropPods(c, time);
  drawCorpses(c, time);
  drawReclaimedMinions(c, time);
  drawNeuralSynapses(c, time);
  drawGhostEchoes(c, time);
  drawLogisticsConduits(c, time);
  drawMegastructures(c, time);
  drawTitanGrapple(c, time);
  // 9.0 Living Ecosystem Ground Systems
  drawEcologySoil(c, time);
  drawDestructibleCrags(c, time);
  drawBarricades(c, time);
  // 10.0 Crucible of Ascendancy Ground Systems
  drawSingularityPens(c, time);
  drawPhotonPrisms(c, time);
  drawMidasCoins(c, time);
  drawCatalystPylons(c, time);
  // 12.0 Sovereign Depth Systems
  drawTerraScars(c, time);
  drawHarmonicLattices(c, time);
  // 13.0 Visceral Resonance Battlefield Systems
  drawDebris(c, time);
  drawMoltenSlags(c, time);
  drawIncomingMortars(c, time);
  drawChronosSpear(c, time);
  // 14.0 The Omni-Resonance Matrix Battlefield Systems
  drawSteamClouds(c, time);
  drawBioGasClouds(c, time);
  drawCustomTowers(c, time);
  drawTetherBeam(c, time);
  drawCarriedTower(c, time);
  // 15.0 Apex Ascendant Battlefield Ground Systems
  drawChronoEchoes(c, time);
  drawGeomorphicFissures(c, time);
  drawZeroGravityFields(c, time);
  // 16.0 Adaptive Entropy Ground & Infiltration Systems
  drawFlankBreachIndicator(c, time);
  drawSyndicateSiphonRig(c, time);
  drawThermalMicroVortex(c, time);
  // 17.0 The Chrono-Tactical Singularity Battlefield Systems
  drawHostileProjectiles(c, time);
  drawLootParticles(c, time);
  drawHarmonicBeams(c, time);
  drawGhostEntities(c, time);

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
    if (G.placingMegastructure && typeof canPlaceMegastructure === 'function' && typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[G.placingMegastructure]) {
      const conf = MEGASTRUCTURE_CONFIG[G.placingMegastructure];
      const ok = canPlaceMegastructure(hc, hr, G.placingMegastructure);
      const mw = 2 * TILE, mh = 2 * TILE;
      c.fillStyle = ok ? 'rgba(56,189,248,0.2)' : 'rgba(244,63,94,0.25)';
      c.fillRect(x + 1, y + 1, mw - 2, mh - 2);
      c.strokeStyle = ok ? conf.color : '#f43f5e';
      c.lineWidth = 2.5;
      c.strokeRect(x + 2, y + 2, mw - 4, mh - 4);
      c.font = '800 11px ' + FONT;
      c.fillStyle = ok ? conf.color : '#f43f5e';
      c.textAlign = 'center';
      c.fillText((ok ? 'VALID 2x2 SECTOR' : 'BLOCKED SECTOR'), x + mw / 2, y + mh / 2 + 4);
    } else if (G.placingBarricade) {
      const isRoad = typeof pathTile !== 'undefined' && pathTile[hr] && pathTile[hr][hc];
      const hasBar = G.barricades && G.barricades.some(b => b.c === hc && b.r === hr);
      const ok = isRoad && !hasBar;
      const bCost = typeof DESTRUCTIBLE_TERRAIN_CONFIG !== 'undefined' ? DESTRUCTIBLE_TERRAIN_CONFIG.barricadeCost : 40;
      const afford = G.gold >= bCost, good = ok && afford;
      c.fillStyle = good ? 'rgba(56,189,248,0.22)' : 'rgba(244,63,94,0.25)';
      c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      c.strokeStyle = good ? '#38bdf8' : '#f43f5e';
      c.lineWidth = 2;
      c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      c.font = '800 10px ' + FONT;
      c.fillStyle = good ? '#38bdf8' : '#f43f5e';
      c.textAlign = 'center';
      c.fillText(ok ? (afford ? 'PLACE BARRICADE (40G)' : 'NEED 40G') : 'ROAD ONLY', x + TILE / 2, y + TILE / 2 + 4);
    } else if (G.placingPrism) {
      const ok = typeof canPlacePrism === 'function' && canPlacePrism(hc, hr);
      const afford = G.gold >= 60, good = ok && afford;
      c.fillStyle = good ? 'rgba(56,189,248,0.22)' : 'rgba(244,63,94,0.25)';
      c.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      c.strokeStyle = good ? '#38bdf8' : '#f43f5e';
      c.lineWidth = 2;
      c.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
      c.font = '800 10px ' + FONT;
      c.fillStyle = good ? '#38bdf8' : '#f43f5e';
      c.textAlign = 'center';
      c.fillText(ok ? (afford ? 'PLACE PRISM (60G)' : 'NEED 60G') : 'GROUND ONLY', x + TILE / 2, y + TILE / 2 + 4);
    } else if (G.placing) {
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
    const t = G.sel;
    if (t.type && TD[t.type]) {
      const def = TD[t.type], rg = getTierData(t).range * (hasPerk('targeting_matrix') ? 1.15 : 1) * TILE;
      c.fillStyle = 'rgba(255,255,255,0.045)'; c.strokeStyle = t.branch ? def.branches[t.branch].color : def.color; c.lineWidth = 1.5; c.setLineDash([8, 6]);
      c.beginPath(); c.arc(t.x, t.y, rg, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, t.x - 28, t.y - 28, 56, 56, 10); c.stroke();
    } else if (typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[t.type]) {
      const conf = MEGASTRUCTURE_CONFIG[t.type];
      const rad = conf.beamRadius || conf.quakeRadius || 180;
      c.fillStyle = conf.color + '15'; c.strokeStyle = conf.color; c.lineWidth = 1.5; c.setLineDash([8, 6]);
      c.beginPath(); c.arc(t.x, t.y, rad, 0, TAU); c.fill(); c.stroke(); c.setLineDash([]);
      c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, t.x - 48, t.y - 48, 96, 96, 12); c.stroke();
    } else if (t.hp !== undefined && t.c !== undefined && t.roadC === undefined) {
      c.strokeStyle = '#38bdf8'; c.lineWidth = 2; rr(c, t.x - 24, t.y - 24, 48, 48, 8); c.stroke();
    } else if (t.type === 'photon_prism') {
      c.strokeStyle = '#38bdf8'; c.lineWidth = 2; rr(c, t.x - 24, t.y - 24, 48, 48, 8); c.stroke();
    }
  }
  for (const t of G.towers) drawTowerSprite(c, t.type, t.tier, t, time);
  drawTowerHeatGauges(c, time);
  drawChimeraAuras(c, time);
  for (const e of G.enemies) if (e.type !== 'boss' && e.x > -30) drawEnemy(c, e, time);
  for (const e of G.enemies) if (e.type === 'boss' && e.x > -40) { drawEnemy(c, e, time); drawBossAnatomicalParts(c, e, time); }
  for (const e of G.enemies) if (e.x > -10) drawBars(c, e);
  drawSyndicateGunship(c, time);
  drawTitanMech(c, time);
  drawDreadnoughtStrike(c, time);
  drawNemesisBosses(c, time);
  drawFinisherPrompt(c, time);
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
  // 7.0 Titan Mech Cockpit Visor HUD
  drawMechHUD(c);
  // 9.0 Micro-Climate Atmospheric Weather Atmosphere
  drawWeatherAtmosphere(c, time);
  // 10.0 Crucible of Ascendancy Post-Processing & HUD Overlays
  drawEnigmaBossAura(c, time);
  drawBulletTimeMatrix(c, time);
  drawCrucibleGambitBadge(c, time);
  drawChaosIncursionHUD(c, time);
  // 13.0 Visceral Resonance Overlays & HUDs
  drawHarmonicCadenceVfx(c, time);
  drawCitadelAegisVfx(c, time);
  drawMechRadioHUD(c, time);
  drawKillStreakHUD(c, time);
  // 15.0 Apex Adrenaline Overdrive HUD
  drawAdrenalineHeatBorder(c, time);
  // 16.0 Tactical Versatility Meter (TVM) HUD
  drawTacticalVersatilityMeter(c, time);
  // 17.0 Temporal Paradox Continuum HUD
  drawTemporalParadoxHUD(c, time);

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
    c.save(); c.textAlign = 'center';
    const bY = 20, bW = 540, bH = 34;
    c.fillStyle = 'rgba(8,12,18,0.85)';
    c.fillRect(W / 2 - bW / 2, bY, bW, bH);
    c.strokeStyle = '#e2a72e';
    c.lineWidth = 1;
    c.strokeRect(W / 2 - bW / 2, bY, bW, bH);
    c.fillStyle = '#e2a72e';
    c.fillRect(W / 2 - bW / 2, bY, 4, bH);
    c.font = '700 14px ' + FONT;
    c.fillStyle = '#f1f5f9';
    c.fillText('Build defenses around the conduit, then press SPACE to launch Wave 1', W / 2 + 2, bY + 22);
    c.restore();
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
    c.fillStyle = '#38bdf8';
    c.font = '700 8.5px ' + FONT;
    c.textAlign = 'center';
    c.fillText('SIPHON [CLICK] / CRUSH [MECH]', cp.x, cp.y + 16);
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

/* ============================================================
   BASTION TD 7.0: TITAN MECH, DREADNOUGHT & DROP-POD RENDERING
   ============================================================ */

function drawDropPods(c, time) {
  if (!G || !G.dropPods || G.dropPods.length === 0) return;
  for (const dp of G.dropPods) {
    if (!dp.landed) {
      // Beacon laser from sky
      const pRatio = dp.t / dp.landDelay;
      c.save();
      c.strokeStyle = 'rgba(239, 68, 68, ' + (0.4 + 0.4 * Math.sin(time * 14)) + ')';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(dp.x, -50);
      c.lineTo(dp.x, dp.y);
      c.stroke();

      // Pulsing reticle on ground
      const pulseR = 15 + (1 - pRatio) * 35;
      c.strokeStyle = '#ef4444';
      c.lineWidth = 2;
      c.setLineDash([6, 4]);
      c.beginPath();
      c.arc(dp.x, dp.y, pulseR, 0, TAU);
      c.stroke();
      c.setLineDash([]);

      // Descending pod silhouette
      const podY = -60 + (dp.y + 60) * (pRatio * pRatio);
      c.fillStyle = '#1e293b';
      c.strokeStyle = '#f87171';
      c.lineWidth = 1.5;
      rr(c, dp.x - 10, podY - 18, 20, 26, 4);
      c.fill(); c.stroke();
      c.restore();
    } else {
      // Landed Drop Pod Bunker
      c.save();
      c.fillStyle = '#0f172a';
      c.strokeStyle = '#ef4444';
      c.lineWidth = 2;
      rr(c, dp.x - 14, dp.y - 14, 28, 28, 5);
      c.fill(); c.stroke();

      // Hazard beacon
      c.fillStyle = '#ef4444';
      c.beginPath();
      c.arc(dp.x, dp.y, 4, 0, TAU);
      c.fill();

      // Heat vent exhaust
      if (Math.random() < 0.35) {
        c.fillStyle = 'rgba(248, 113, 113, 0.4)';
        c.fillRect(dp.x - 8 + Math.random() * 16, dp.y - 18, 3, 4);
      }
      c.restore();
    }
  }
}

function drawTitanMech(c, time) {
  if (!G || !G.mech) return;
  const m = G.mech;
  const mx = m.x, my = m.y, facing = m.facing || 0;
  c.save();
  c.translate(mx, my);

  // Piloted halo ring
  if (m.active) {
    c.strokeStyle = 'rgba(56, 189, 248, ' + (0.5 + 0.3 * Math.sin(time * 6)) + ')';
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(0, 0, 32, 0, TAU);
    c.stroke();
    c.setLineDash([]);
  } else if (m.isDocked) {
    c.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, 28, 0, TAU);
    c.stroke();
  }

  // Shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.4)';
  c.beginPath();
  c.ellipse(0, 8, 22, 12, 0, 0, TAU);
  c.fill();

  // Walker Legs
  const isMoving = Math.hypot(m.vx || 0, m.vy || 0) > 10;
  const legCycle = isMoving ? Math.sin(time * 12) * 8 : 0;
  c.fillStyle = '#334155';
  c.strokeStyle = '#1e293b';
  c.lineWidth = 2;
  // Left leg
  c.fillRect(-14, 2 + legCycle, 8, 14);
  c.strokeRect(-14, 2 + legCycle, 8, 14);
  // Right leg
  c.fillRect(6, 2 - legCycle, 8, 14);
  c.strokeRect(6, 2 - legCycle, 8, 14);

  // Torso / Chassis (rotates to facing)
  c.rotate(facing);

  // Armored Shoulder Mounts
  c.fillStyle = '#1e293b';
  c.strokeStyle = m.active ? '#38bdf8' : '#64748b';
  c.lineWidth = 1.8;
  rr(c, -18, -20, 36, 40, 6);
  c.fill(); c.stroke();

  // Vulcan Cannon (Right Arm)
  c.fillStyle = '#0f172a';
  c.fillRect(10, 8, 20, 6);
  c.strokeStyle = '#94a3b8';
  c.strokeRect(10, 8, 20, 6);
  if (m.firingT > 0) {
    // Muzzle Flash
    glow(c, 32, 11, 12, '#fbbf24', 0.9);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(32, 11, 4, 0, TAU);
    c.fill();
  }

  // Energy Blade / Shield Generator (Left Arm)
  c.fillStyle = '#0f172a';
  c.fillRect(10, -14, 12, 6);
  c.strokeStyle = '#f97316';
  c.strokeRect(10, -14, 12, 6);

  // Cockpit Core
  c.fillStyle = m.active ? '#0284c7' : '#475569';
  c.beginPath();
  c.arc(0, 0, 9, 0, TAU);
  c.fill();
  c.fillStyle = m.active ? '#38bdf8' : '#94a3b8';
  c.beginPath();
  c.arc(2, 0, 5, 0, TAU);
  c.fill();

  // Thermal Blade Swing Arc Visual
  if (m.swingT > 0) {
    c.save();
    c.strokeStyle = 'rgba(249, 115, 22, ' + (m.swingT * 1.5) + ')';
    c.lineWidth = 8;
    c.beginPath();
    c.arc(0, 0, 75, -Math.PI / 2.5, Math.PI / 2.5);
    c.stroke();

    c.strokeStyle = 'rgba(255, 255, 255, ' + m.swingT + ')';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 75, -Math.PI / 3, Math.PI / 3);
    c.stroke();
    c.restore();
  }

  c.restore();

  // Floating Health & Battery Bars above mech
  const barW = 44, barH = 4;
  const bx = mx - barW / 2, by = my - 36;
  // Hull HP Bar
  c.fillStyle = 'rgba(15, 23, 42, 0.8)';
  c.fillRect(bx, by, barW, barH);
  const hpPct = clamp(m.hp / m.maxHp, 0, 1);
  c.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
  c.fillRect(bx, by, barW * hpPct, barH);
  c.strokeStyle = '#0f172a';
  c.lineWidth = 1;
  c.strokeRect(bx, by, barW, barH);

  // Battery Bar
  c.fillStyle = 'rgba(15, 23, 42, 0.8)';
  c.fillRect(bx, by + barH + 2, barW, barH);
  const batPct = clamp(m.battery / m.maxBattery, 0, 1);
  c.fillStyle = batPct > 0.2 ? '#38bdf8' : '#f59e0b';
  c.fillRect(bx, by + barH + 2, barW * batPct, barH);
  c.strokeRect(bx, by + barH + 2, barW, barH);

  // Pilot Prompt Tag
  if (!m.active) {
    c.fillStyle = 'rgba(15, 23, 42, 0.85)';
    c.fillRect(mx - 32, my - 50, 64, 12);
    c.fillStyle = '#94a3b8';
    c.font = '700 8.5px ' + FONT;
    c.textAlign = 'center';
    c.fillText(m.isDocked ? 'DOCK RECHARGE' : 'MECH [TAB]', mx, my - 41);
  }
}

function drawDreadnoughtStrike(c, time) {
  if (!G || !G.dreadnought) return;
  const d = G.dreadnought;

  // Render Molten Craters on ground
  if (d.craters && d.craters.length > 0) {
    for (const cr of d.craters) {
      const alpha = clamp(cr.life / cr.maxLife, 0, 1);
      c.save();
      // Molten magma ground fill
      glow(c, cr.x, cr.y, cr.r * 0.8, '#f97316', alpha * 0.7);
      c.fillStyle = 'rgba(234, 88, 12, ' + (alpha * 0.35) + ')';
      c.beginPath();
      c.arc(cr.x, cr.y, cr.r, 0, TAU);
      c.fill();
      // Scorched ring border
      c.strokeStyle = 'rgba(249, 115, 22, ' + (alpha * 0.8) + ')';
      c.lineWidth = 2.5;
      c.stroke();
      // Fissure cracks
      c.strokeStyle = 'rgba(254, 215, 170, ' + alpha + ')';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(cr.x - cr.r * 0.5, cr.y - cr.r * 0.3);
      c.lineTo(cr.x + cr.r * 0.4, cr.y + cr.r * 0.2);
      c.lineTo(cr.x + cr.r * 0.7, cr.y - cr.r * 0.1);
      c.stroke();
      c.restore();
    }
  }

  if (!d.active) return;

  // Atmospheric darkening overlay
  c.save();
  c.fillStyle = 'rgba(15, 23, 42, 0.45)';
  c.fillRect(0, 0, W, H);

  // Giant Dreadnought Shadow overhead
  const shipX = W * 0.5 + Math.sin(time * 0.5) * 40;
  c.fillStyle = 'rgba(2, 6, 23, 0.65)';
  c.beginPath();
  c.moveTo(shipX - 280, -30);
  c.lineTo(shipX + 280, -30);
  c.lineTo(shipX + 160, 90);
  c.lineTo(shipX, 130);
  c.lineTo(shipX - 160, 90);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  c.lineWidth = 2;
  c.stroke();

  // Glowing Thruster Ports
  glow(c, shipX - 120, -10, 18, '#38bdf8', 0.8);
  glow(c, shipX + 120, -10, 18, '#38bdf8', 0.8);

  // Render Target Reticles and Falling Tungsten Rods
  if (d.rods) {
    for (const r of d.rods) {
      if (!r.landed) {
        // Orbital Target Lock Reticle
        const tDiff = Math.max(0, r.delay - d.t);
        const lockR = 25 + tDiff * 45;
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.5;
        c.setLineDash([8, 6]);
        c.beginPath();
        c.arc(r.x, r.y, lockR, 0, TAU);
        c.stroke();
        c.setLineDash([]);

        // Crosshairs
        c.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(r.x - lockR - 8, r.y); c.lineTo(r.x + lockR + 8, r.y);
        c.moveTo(r.x, r.y - lockR - 8); c.lineTo(r.x, r.y + lockR + 8);
        c.stroke();

        // Falling Kinetic Rod Trail when close to impact
        if (tDiff < 0.6) {
          const fallProgress = (0.6 - tDiff) / 0.6;
          const rodY = -100 + (r.y + 100) * fallProgress;
          c.strokeStyle = '#fed7aa';
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(r.x, rodY - 90);
          c.lineTo(r.x, rodY);
          c.stroke();
          glow(c, r.x, rodY, 20, '#f97316', 0.9);
        }
      }
    }
  }
  c.restore();
}

function drawMechHUD(c) {
  if (!G || !G.mech || !G.mech.active) return;
  const m = G.mech;
  const cfg = typeof TITAN_MECH_CONFIG !== 'undefined' ? TITAN_MECH_CONFIG : { maxHp: 1000, maxBattery: 100 };
  const hW = 440, hH = 68;
  const hX = (W - hW) / 2, hY = H - hH - 12;

  c.save();
  // Cockpit Glass Backdrop
  c.fillStyle = 'rgba(4, 12, 24, 0.88)';
  c.strokeStyle = '#0284c7';
  c.lineWidth = 2;
  rr(c, hX, hY, hW, hH, 8);
  c.fill(); c.stroke();

  // Scanline Effect
  c.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  c.lineWidth = 1;
  c.beginPath();
  for (let ly = hY + 6; ly < hY + hH; ly += 6) {
    c.moveTo(hX + 6, ly); c.lineTo(hX + hW - 6, ly);
  }
  c.stroke();

  // Header Title
  c.font = '800 11px ' + FONT;
  c.fillStyle = '#38bdf8';
  c.textAlign = 'left';
  c.fillText('⚔ TITAN COMBAT MECH PILOT HUD [TAB TO DISEMBARK]', hX + 16, hY + 18);

  // Status Indicators Grid
  // 1. Hull HP
  const hpPct = clamp(m.hp / cfg.maxHp, 0, 1);
  c.font = '700 9.5px ' + FONT;
  c.fillStyle = '#94a3b8';
  c.fillText('HULL INTEGRITY (' + Math.round(m.hp) + '/' + cfg.maxHp + ')', hX + 16, hY + 34);
  c.fillStyle = 'rgba(15, 23, 42, 0.8)';
  c.fillRect(hX + 16, hY + 38, 120, 6);
  c.fillStyle = hpPct > 0.4 ? '#22c55e' : '#ef4444';
  c.fillRect(hX + 16, hY + 38, 120 * hpPct, 6);

  // 2. Battery
  const batPct = clamp(m.battery / cfg.maxBattery, 0, 1);
  c.fillStyle = '#94a3b8';
  c.fillText('POWER CELL (' + Math.round(m.battery) + '%)', hX + 150, hY + 34);
  c.fillStyle = 'rgba(15, 23, 42, 0.8)';
  c.fillRect(hX + 150, hY + 38, 120, 6);
  c.fillStyle = batPct > 0.2 ? '#38bdf8' : '#f59e0b';
  c.fillRect(hX + 150, hY + 38, 120 * batPct, 6);

  // 3. Thermal Blade Status
  c.fillStyle = '#94a3b8';
  c.fillText('THERMAL BLADE [SPACE]', hX + 285, hY + 34);
  const bladeReady = m.bladeCd <= 0;
  c.font = '800 11px ' + FONT;
  c.fillStyle = bladeReady ? '#f97316' : '#64748b';
  c.fillText(bladeReady ? '★ READY TO CLEAVE' : 'COOLDOWN ' + m.bladeCd.toFixed(1) + 's', hX + 285, hY + 48);

  // Controls Reminder
  c.font = '600 9.5px ' + FONT;
  c.fillStyle = '#cbd5e1';
  c.fillText('WASD: Thrusters · Left Click: Vulcan Autocannon · Near Base: Auto Dock Recharge', hX + 16, hY + 58);

  c.restore();
}

/* ============================================================
   BASTION TD 8.0: MASTERCLASS AAA/INDIE RENDER PIPELINE
   ============================================================ */

function drawMegastructures(c, time) {
  if (!G || !G.megastructures || G.megastructures.length === 0) return;
  for (const ms of G.megastructures) {
    const conf = MEGASTRUCTURE_CONFIG[ms.type];
    if (!conf) continue;
    c.save();

    const maxDur = ms.maxDurability || conf.maxDurability || 3;
    const curDur = ms.durability !== undefined ? ms.durability : maxDur;
    const isBroken = ms.isBroken || curDur <= 0;

    const pad = 4;
    const rx = ms.c * TILE + pad, ry = ms.r * TILE + pad;
    const rw = 2 * TILE - pad * 2, rh = 2 * TILE - pad * 2;
    c.fillStyle = isBroken ? '#1a0505' : '#090e17';
    c.fillRect(rx, ry, rw, rh);

    const borderCol = isBroken ? (Math.sin(time * 8) > 0 ? '#ef4444' : '#7f1d1d') : conf.color;
    c.strokeStyle = borderCol;
    c.lineWidth = isBroken ? 3 : 2.5;
    c.strokeRect(rx, ry, rw, rh);

    // Hazard stripes if broken
    if (isBroken) {
      c.save();
      c.beginPath();
      c.rect(rx, ry, rw, rh);
      c.clip();
      c.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      c.lineWidth = 6;
      for (let offset = -rh; offset < rw + rh; offset += 16) {
        c.beginPath();
        c.moveTo(rx + offset, ry);
        c.lineTo(rx + offset + 20, ry + rh);
        c.stroke();
      }
      c.restore();
    }

    c.fillStyle = isBroken ? '#ef4444' : conf.color;
    c.fillRect(rx, ry, 6, 6);
    c.fillRect(rx + rw - 6, ry, 6, 6);
    c.fillRect(rx, ry + rh - 6, 6, 6);
    c.fillRect(rx + rw - 6, ry + rh - 6, 6, 6);

    if (ms.overclockT > 0 && !isBroken) {
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 2;
      c.setLineDash([4, 4]);
      c.strokeRect(rx - 2, ry - 2, rw + 4, rh + 4);
      c.setLineDash([]);
    }

    if (ms.type === 'ion_uplink') {
      c.translate(ms.x, ms.y);
      if (!isBroken) c.rotate(time * 0.8);
      c.strokeStyle = isBroken ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); c.stroke();
      }
      if (!isBroken) c.rotate(-time * 0.8);

      const orbPulse = isBroken ? 3 : (6 + Math.sin(time * 6) * 2);
      if (!isBroken) glow(c, 0, 0, 16, '#38bdf8', 0.8);
      c.fillStyle = isBroken ? '#f87171' : '#bae6fd';
      c.beginPath(); c.arc(0, 0, orbPulse, 0, Math.PI * 2); c.fill();
      c.translate(-ms.x, -ms.y);

      if (!isBroken && ms.targetX !== null && ms.targetY !== null && ms.targetX !== undefined) {
        c.save();
        glow(c, ms.targetX, ms.targetY, conf.beamRadius, '#38bdf8', 0.6);
        c.strokeStyle = 'rgba(56,189,248,0.85)';
        c.lineWidth = 5 + Math.sin(time * 20) * 2;
        c.beginPath();
        c.moveTo(ms.targetX, -50);
        c.lineTo(ms.targetX, ms.targetY);
        c.stroke();
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.stroke();
        c.strokeStyle = '#38bdf8';
        c.beginPath();
        c.arc(ms.targetX, ms.targetY, conf.beamRadius, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
    } else if (ms.type === 'drone_carrier') {
      c.fillStyle = isBroken ? '#1e1111' : '#0f172a';
      c.fillRect(ms.x - 22, ms.y - 22, 44, 44);
      c.strokeStyle = isBroken ? '#ef4444' : '#10b981';
      c.lineWidth = 2;
      c.strokeRect(ms.x - 22, ms.y - 22, 44, 44);
      c.fillStyle = isBroken ? '#7f1d1d' : '#34d399';
      c.fillRect(ms.x - 18, ms.y - 2, 36, 4);

      if (ms.drones && !isBroken) {
        for (const d of ms.drones) {
          glow(c, d.x, d.y, 8, d.type === 'interceptor' ? '#10b981' : '#38bdf8', 0.7);
          c.fillStyle = d.type === 'interceptor' ? '#34d399' : '#38bdf8';
          c.beginPath();
          c.arc(d.x, d.y, d.type === 'interceptor' ? 4 : 3, 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (ms.type === 'tectonic_siphon') {
      c.fillStyle = isBroken ? '#1c0d0d' : '#1c1917';
      c.beginPath(); c.arc(ms.x, ms.y, 26, 0, Math.PI * 2); c.fill();
      c.strokeStyle = isBroken ? '#ef4444' : '#f59e0b';
      c.lineWidth = 3;
      c.stroke();

      c.save();
      c.translate(ms.x, ms.y);
      if (!isBroken) c.rotate(time * 4);
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        c.fillStyle = isBroken ? '#78350f' : '#fbbf24';
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a - 0.2) * 24, Math.sin(a - 0.2) * 24);
        c.lineTo(Math.cos(a + 0.2) * 24, Math.sin(a + 0.2) * 24);
        c.fill();
      }
      c.restore();
    }

    // Durability pips / segments above the facility
    const pipW = 12, pipH = 3, pipGap = 3;
    const totalW = maxDur * pipW + (maxDur - 1) * pipGap;
    const startX = ms.x - totalW / 2;
    const pipY = ms.y - 38;
    for (let i = 0; i < maxDur; i++) {
      const activePip = i < curDur;
      c.fillStyle = isBroken ? '#ef4444' : activePip ? (curDur === 1 ? '#f97316' : '#10b981') : '#334155';
      c.fillRect(startX + i * (pipW + pipGap), pipY, pipW, pipH);
    }

    c.font = '800 9px ' + FONT;
    c.textAlign = 'center';
    if (isBroken) {
      c.fillStyle = Math.sin(time * 8) > 0 ? '#ef4444' : '#fbbf24';
      c.fillText('⚠ OFFLINE - REPAIR [U]', ms.x, ms.y + 36);
    } else {
      c.fillStyle = conf.color;
      c.fillText(conf.name.toUpperCase(), ms.x, ms.y + 36);
    }

    c.restore();
  }
}

function drawBossAnatomicalParts(c, e, time) {
  if (!e.parts) return;
  c.save();

  if (e.parts.carapace && !e.parts.carapace.broken) {
    const cpPct = e.parts.carapace.hp / e.parts.carapace.maxHp;
    c.strokeStyle = cpPct > 0.5 ? '#94a3b8' : '#f87171';
    c.lineWidth = 3;
    c.setLineDash([8, 4]);
    c.beginPath();
    c.arc(e.x, e.y, (e.r || 24) + 6, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }

  if (e.parts.mortar_pod && !e.parts.mortar_pod.broken) {
    glow(c, e.x - 14, e.y - 14, 10, '#a3e635', 0.6);
    c.fillStyle = '#a3e635';
    c.beginPath();
    c.arc(e.x - 14, e.y - 14, 6, 0, Math.PI * 2);
    c.fill();
  }

  if (e.parts.core && (e.parts.core.exposed || (e.parts.carapace && e.parts.carapace.broken))) {
    const pulse = 8 + Math.sin(time * 8) * 3;
    glow(c, e.x, e.y, 18, '#f43f5e', 0.85);
    c.fillStyle = '#f43f5e';
    c.beginPath();
    c.arc(e.x, e.y, pulse, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(e.x, e.y, pulse + 6, 0, Math.PI * 2);
    c.stroke();
  }

  if (e.staggerT > 0) {
    c.font = '800 13px ' + FONT;
    c.fillStyle = '#fbbf24';
    c.textAlign = 'center';
    c.fillText('★ STAGGERED (' + e.staggerT.toFixed(1) + 's) ★', e.x, e.y - (e.r || 24) - 24);
  }

  c.restore();
}

function drawLogisticsConduits(c, time) {
  if (!G || !G.logisticsConduits || G.logisticsConduits.length === 0) return;
  c.save();
  for (const cond of G.logisticsConduits) {
    const x1 = cond.c1 * TILE + TILE / 2, y1 = cond.r1 * TILE + TILE / 2;
    const x2 = cond.c2 * TILE + TILE / 2, y2 = cond.r2 * TILE + TILE / 2;
    c.strokeStyle = '#0f172a';
    c.lineWidth = 6;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = cond.color;
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const flowT = (time * 2) % 1;
    const px = lerp(x1, x2, flowT), py = lerp(y1, y2, flowT);
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(px, py, 3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}

function drawTitanGrapple(c, time) {
  if (!G || !G.grapplePrompt || !G.grapplePrompt.boss) return;
  const b = G.grapplePrompt.boss;
  c.save();
  const pulse = Math.sin(time * 10);
  const promptY = b.y - (b.r || 24) - 38;
  c.font = '800 14px ' + FONT;
  c.fillStyle = '#fbbf24';
  c.textAlign = 'center';
  c.fillText('PRESS [E] TITAN GRAPPLE CLEAVE!', b.x, promptY);

  if (G.mech && G.mech.active) {
    c.strokeStyle = 'rgba(56,189,248,' + (0.5 + 0.3 * pulse) + ')';
    c.lineWidth = 2.5;
    c.setLineDash([6, 4]);
    c.beginPath();
    c.moveTo(G.mech.x, G.mech.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    c.setLineDash([]);
  }
  c.restore();
}

/* ============================================================
   BASTION TD 9.0: LIVING ECOSYSTEM & NEMESIS NETWORK RENDERS
   ============================================================ */

function drawEcologySoil(c, time) {
  if (!G || !G.soilTiles) return;
  c.save();
  for (const k in G.soilTiles) {
    const st = G.soilTiles[k];
    const x = st.c * TILE, y = st.r * TILE;
    const alpha = clamp(st.life / st.maxLife, 0.2, 0.85);

    if (st.type === 'thermal_ash') {
      const pulse = 0.5 + 0.5 * Math.sin(time * 5 + st.c);
      c.fillStyle = 'rgba(249,115,22,' + (0.22 + 0.12 * pulse * alpha) + ')';
      c.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      c.strokeStyle = 'rgba(251,146,60,' + (0.4 + 0.4 * alpha) + ')';
      c.lineWidth = 1.5;
      c.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      c.strokeStyle = '#fdba74';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 8, y + 12);
      c.lineTo(x + TILE / 2, y + TILE / 2);
      c.lineTo(x + TILE - 8, y + TILE - 14);
      c.stroke();
    } else if (st.type === 'frost_slick') {
      const sheen = Math.sin(time * 3 + st.c * 2);
      c.fillStyle = 'rgba(56,189,248,' + (0.2 + 0.15 * alpha) + ')';
      c.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      c.strokeStyle = 'rgba(186,230,253,' + (0.5 + 0.3 * sheen) + ')';
      c.lineWidth = 1.8;
      c.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      c.beginPath();
      c.moveTo(x + 6, y + TILE - 8);
      c.lineTo(x + TILE - 8, y + 8);
      c.stroke();
    } else if (st.type === 'acid_sinkhole') {
      c.fillStyle = 'rgba(132,204,22,' + (0.28 + 0.15 * alpha) + ')';
      c.beginPath();
      c.arc(st.x, st.y, TILE * 0.44, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#a3e635';
      c.lineWidth = 2;
      c.stroke();
      const bRad = (time * 15 + st.c * 10) % (TILE * 0.35);
      c.strokeStyle = 'rgba(217,249,157,0.7)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(st.x, st.y, bRad, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}

function drawDestructibleCrags(c, time) {
  if (!G) return;
  c.save();

  if (G.destructibleCrags) {
    for (const crag of G.destructibleCrags) {
      if (crag.collapsed) continue;
      const x = crag.c * TILE + TILE / 2, y = crag.r * TILE + TILE / 2;
      c.fillStyle = '#334155';
      c.beginPath();
      c.moveTo(x - 20, y + 16);
      c.lineTo(x - 12, y - 18);
      c.lineTo(x + 8, y - 22);
      c.lineTo(x + 22, y - 4);
      c.lineTo(x + 16, y + 18);
      c.closePath();
      c.fill();
      c.strokeStyle = '#64748b';
      c.lineWidth = 2;
      c.stroke();

      c.strokeStyle = '#94a3b8';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 6, y - 12);
      c.lineTo(x + 2, y + 4);
      c.lineTo(x + 10, y + 12);
      c.stroke();

      if (crag.hp < crag.maxHp) {
        const bw = 36, bh = 4;
        c.fillStyle = 'rgba(15,23,42,0.85)';
        c.fillRect(x - bw / 2 - 1, y - 28, bw + 2, bh + 2);
        c.fillStyle = '#f59e0b';
        c.fillRect(x - bw / 2, y - 27, bw * (crag.hp / crag.maxHp), bh);
      }
    }
  }

  if (G.rockslides) {
    for (const rs of G.rockslides) {
      if (rs.cleared) continue;
      c.fillStyle = '#475569';
      c.beginPath();
      c.arc(rs.x - 10, rs.y - 6, 12, 0, Math.PI * 2);
      c.arc(rs.x + 8, rs.y - 8, 14, 0, Math.PI * 2);
      c.arc(rs.x + 2, rs.y + 10, 11, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#94a3b8';
      c.lineWidth = 2;
      c.stroke();

      const bw = 40, bh = 4;
      c.fillStyle = 'rgba(15,23,42,0.85)';
      c.fillRect(rs.x - bw / 2 - 1, rs.y - 24, bw + 2, bh + 2);
      c.fillStyle = '#e2e8f0';
      c.fillRect(rs.x - bw / 2, rs.y - 23, bw * (rs.life / rs.maxLife), bh);
      c.font = '800 8.5px ' + FONT;
      c.fillStyle = '#f59e0b';
      c.textAlign = 'center';
      c.fillText('RUBBLE (' + Math.ceil(rs.life) + 's)', rs.x, rs.y - 27);
    }
  }

  c.restore();
}

function drawBarricades(c, time) {
  if (!G || !G.barricades || G.barricades.length === 0) return;
  c.save();
  for (const bar of G.barricades) {
    const x = bar.x, y = bar.y;
    c.fillStyle = '#1e293b';
    c.fillRect(x - 18, y - 8, 36, 16);
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2;
    c.strokeRect(x - 18, y - 8, 36, 16);
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 12, y - 6); c.lineTo(x - 6, y + 6);
    c.moveTo(x - 2, y - 6); c.lineTo(x + 4, y + 6);
    c.moveTo(x + 8, y - 6); c.lineTo(x + 14, y + 6);
    c.stroke();

    if (bar.hp < bar.maxHp) {
      const pct = Math.max(0, bar.hp / bar.maxHp);
      c.fillStyle = 'rgba(15,23,42,0.85)';
      c.fillRect(x - 16, y - 14, 32, 4);
      c.fillStyle = pct > 0.5 ? '#10b981' : (pct > 0.25 ? '#f59e0b' : '#ef4444');
      c.fillRect(x - 16, y - 14, 32 * pct, 4);
    }
  }
  c.restore();
}

function drawWeatherAtmosphere(c, time) {
  if (!G || !G.currentWeather) return;
  c.save();
  if (G.currentWeather === 'spore_fog') {
    c.fillStyle = 'rgba(20,83,45,0.12)';
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(163,230,53,0.45)';
    for (let i = 0; i < 20; i++) {
      const px = (Math.sin(time * 0.4 + i * 1.5) * 0.5 + 0.5) * W;
      const py = ((time * 25 + i * 45) % H);
      c.beginPath();
      c.arc(px, py, 2.2, 0, Math.PI * 2);
      c.fill();
    }
  } else if (G.currentWeather === 'ion_squall') {
    const stormPulse = Math.sin(time * 4);
    if (stormPulse > 0.8) {
      c.fillStyle = 'rgba(129,140,248,0.06)';
      c.fillRect(0, 0, W, H);
    }
  }
  c.restore();
}

function drawNemesisBosses(c, time) {
  if (!G || !G.enemies) return;
  c.save();
  for (const e of G.enemies) {
    if (!e.dead && e.isNemesis && e.nemesisTitle) {
      const ty = e.y - (e.r || 24) - 32;
      c.font = '800 11px ' + FONT;
      const tw = c.measureText(e.nemesisTitle.toUpperCase()).width + 16;
      c.fillStyle = 'rgba(15,23,42,0.9)';
      c.fillRect(e.x - tw / 2, ty - 12, tw, 18);
      c.strokeStyle = '#a855f7';
      c.lineWidth = 1.5;
      c.strokeRect(e.x - tw / 2, ty - 12, tw, 18);

      c.fillStyle = '#e9d5ff';
      c.textAlign = 'center';
      c.fillText('★ ' + e.nemesisTitle.toUpperCase() + ' ★', e.x, ty + 2);
    }
  }
  c.restore();
}

/* ============================================================
   BASTION TD 10.0: THE CRUCIBLE OF ASCENDANCY - RENDER PIPELINE
   ============================================================ */

function drawPhotonPrisms(c, time) {
  if (!G || !G.prisms || G.prisms.length === 0) return;
  c.save();
  for (const pr of G.prisms) {
    const x = pr.x, y = pr.y;
    // Outer prism glow
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + pr.c);
    c.fillStyle = 'rgba(56,189,248,' + (0.15 + 0.1 * pulse) + ')';
    c.beginPath();
    c.arc(x, y, 18, 0, Math.PI * 2);
    c.fill();

    // Triangular crystal body
    c.save();
    c.translate(x, y);
    c.rotate(pr.angle || 0);

    c.fillStyle = '#0f172a';
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -14);
    c.lineTo(12, 10);
    c.lineTo(-12, 10);
    c.closePath();
    c.fill();
    c.stroke();

    // Internal refraction core
    c.fillStyle = '#818cf8';
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(6, 5);
    c.lineTo(-6, 5);
    c.closePath();
    c.fill();

    // Directional deflection arrow
    c.strokeStyle = '#a855f7';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(16, 0);
    c.lineTo(12, -4);
    c.moveTo(16, 0);
    c.lineTo(12, 4);
    c.stroke();

    c.restore();

    // Selection ring
    if (G.sel === pr) {
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.setLineDash([4, 4]);
      c.beginPath();
      c.arc(x, y, 22, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
    }
  }
  c.restore();
}

function drawSingularityPens(c, time) {
  if (!G || !G.singularityPens || G.singularityPens.length === 0) return;
  c.save();
  for (const pen of G.singularityPens) {
    const [p1, p2, p3] = pen.prisms;
    if (!p1 || !p2 || !p3) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);

    // Translucent cosmic triangle field
    c.fillStyle = 'rgba(168,85,247,' + (0.18 + 0.1 * pulse) + ')';
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
    c.lineTo(p3.x, p3.y);
    c.closePath();
    c.fill();

    // Resonating border beams
    c.strokeStyle = 'rgba(192,132,252,' + (0.6 + 0.4 * pulse) + ')';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(p1.x, p1.y);
    c.lineTo(p2.x, p2.y);
    c.lineTo(p3.x, p3.y);
    c.closePath();
    c.stroke();

    // Stasis vortex centroid
    const cx = (p1.x + p2.x + p3.x) / 3;
    const cy = (p1.y + p2.y + p3.y) / 3;
    c.strokeStyle = '#a855f7';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, 14 + pulse * 6, 0, Math.PI * 2);
    c.stroke();

    c.font = '800 9px ' + FONT;
    c.fillStyle = '#e9d5ff';
    c.textAlign = 'center';
    c.fillText('SINGULARITY STASIS', cx, cy + 3);
  }
  c.restore();
}

function drawMidasCoins(c, time) {
  if (!G || !G.midasCoins || G.midasCoins.length === 0) return;
  c.save();
  for (const coin of G.midasCoins) {
    const bob = Math.sin(time * 6 + coin.x) * 3;
    const cx = coin.x, cy = coin.y + bob;
    const lifeRatio = Math.max(0, coin.life / coin.maxLife);

    // Glow
    c.fillStyle = 'rgba(251,191,36,0.3)';
    c.beginPath();
    c.arc(cx, cy, 14, 0, Math.PI * 2);
    c.fill();

    // Coin disk
    c.fillStyle = '#fbbf24';
    c.strokeStyle = '#d97706';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Inner symbol
    c.fillStyle = '#78350f';
    c.font = '800 10px ' + FONT;
    c.textAlign = 'center';
    c.fillText('G', cx, cy + 3.5);

    // Expiring timer ring
    c.strokeStyle = lifeRatio > 0.3 ? '#fbbf24' : '#ef4444';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, 13, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lifeRatio));
    c.stroke();
  }
  c.restore();
}

function drawCatalystPylons(c, time) {
  if (!G || !G.catalystPylons || G.catalystPylons.length === 0) return;
  c.save();
  for (const p of G.catalystPylons) {
    if (p.hp <= 0) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 5 + p.x);
    // Beacon circle
    c.fillStyle = 'rgba(239,68,68,0.25)';
    c.beginPath();
    c.arc(p.x, p.y, 20 + pulse * 4, 0, Math.PI * 2);
    c.fill();

    // Hexagonal pylon
    c.fillStyle = '#0f172a';
    c.strokeStyle = p.color || '#ef4444';
    c.lineWidth = 2.5;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const hx = p.x + Math.cos(a) * 14;
      const hy = p.y + Math.sin(a) * 14;
      if (i === 0) c.moveTo(hx, hy); else c.lineTo(hx, hy);
    }
    c.closePath();
    c.fill();
    c.stroke();

    // Core crystal
    c.fillStyle = p.color || '#ef4444';
    c.beginPath();
    c.arc(p.x, p.y, 6, 0, Math.PI * 2);
    c.fill();

    // HP Bar
    const pct = Math.max(0, p.hp / p.maxHp);
    c.fillStyle = '#1e293b';
    c.fillRect(p.x - 18, p.y - 24, 36, 4);
    c.fillStyle = '#ef4444';
    c.fillRect(p.x - 18, p.y - 24, 36 * pct, 4);

    c.font = '800 8.5px ' + FONT;
    c.fillStyle = '#fca5a5';
    c.textAlign = 'center';
    c.fillText('PYLON: ' + p.hp + ' HP', p.x, p.y - 28);
  }
  c.restore();
}

function drawEnigmaBossAura(c, time) {
  if (!G || !G.enemies) return;
  c.save();
  for (const e of G.enemies) {
    if (e.dead || e.type !== 'boss' || !G.enigmaPolarity || typeof ENIGMA_BOSS_CONFIG === 'undefined') continue;
    const conf = ENIGMA_BOSS_CONFIG[G.enigmaPolarity];
    if (!conf) continue;

    // Elemental shield aura
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    c.strokeStyle = conf.color;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(e.x, e.y, (e.r || 26) + 12 + pulse * 3, 0, Math.PI * 2);
    c.stroke();

    // Rotating orbital runes
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + (i * Math.PI * 2) / 3;
      const rx = e.x + Math.cos(a) * ((e.r || 26) + 14);
      const ry = e.y + Math.sin(a) * ((e.r || 26) + 14);
      c.fillStyle = conf.color;
      c.beginPath();
      c.arc(rx, ry, 3.5, 0, Math.PI * 2);
      c.fill();
    }

    // Polarity HUD badge
    const ty = e.y - (e.r || 26) - 44;
    c.font = '800 10px ' + FONT;
    const label = '★ ENIGMA: ' + conf.name.toUpperCase() + ' (' + conf.immuneDesc + ') ★';
    const tw = c.measureText(label).width + 16;
    c.fillStyle = 'rgba(15,23,42,0.92)';
    c.fillRect(e.x - tw / 2, ty - 12, tw, 18);
    c.strokeStyle = conf.color;
    c.lineWidth = 1.5;
    c.strokeRect(e.x - tw / 2, ty - 12, tw, 18);
    c.fillStyle = conf.color;
    c.textAlign = 'center';
    c.fillText(label, e.x, ty + 2);
  }

  // Citadel Devastator Apocalyptic Countdown
  if (G.devastatorTimer > 0) {
    const tW = 480, tH = 34, tx = W / 2 - tW / 2, ty = 20;
    const pct = Math.max(0, G.devastatorTimer / 12.0);
    c.fillStyle = 'rgba(15,23,42,0.95)';
    c.fillRect(tx, ty, tW, tH);
    c.strokeStyle = '#ef4444';
    c.lineWidth = 2;
    c.strokeRect(tx, ty, tW, tH);

    // Red warning progress bar
    c.fillStyle = 'rgba(239,68,68,0.4)';
    c.fillRect(tx + 2, ty + 2, (tW - 4) * pct, tH - 4);

    c.font = '800 12px ' + FONT;
    c.fillStyle = '#fee2e2';
    c.textAlign = 'center';
    c.fillText('⚠️ CITADEL DEVASTATOR CHARGING: ' + G.devastatorTimer.toFixed(1) + 's (DESTROY 3 CATALYST PYLONS!)', W / 2, ty + 22);
  }
  c.restore();
}

function drawBulletTimeMatrix(c, time) {
  if (!G) return;
  c.save();
  if (G.bulletTimeT > 0) {
    // Time Dilation Cyan Screen Vignette
    const g = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    g.addColorStop(0, 'rgba(56,189,248,0)');
    g.addColorStop(1, 'rgba(56,189,248,0.35)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // Bullet-Time HUD Bar
    c.fillStyle = 'rgba(15,23,42,0.85)';
    c.fillRect(W / 2 - 200, 16, 400, 28);
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 1.5;
    c.strokeRect(W / 2 - 200, 16, 400, 28);
    c.font = '800 11px ' + FONT;
    c.fillStyle = '#38bdf8';
    c.textAlign = 'center';
    const paintedCount = G.bulletTimePainted ? G.bulletTimePainted.length : 0;
    c.fillText('⚡ BULLET-TIME MATRIX ACTIVE: PAINT 5 WEAKPOINTS [' + paintedCount + '/5]', W / 2, 34);

    // Target markers over painted foes
    if (G.bulletTimePainted) {
      for (const t of G.bulletTimePainted) {
        if (t.dead) continue;
        const pulse = 0.5 + 0.5 * Math.sin(time * 12);
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(t.x, t.y, (t.r || 16) + 8 + pulse * 4, 0, Math.PI * 2);
        c.stroke();
        // Crosshairs
        c.beginPath();
        c.moveTo(t.x - 14, t.y); c.lineTo(t.x + 14, t.y);
        c.moveTo(t.x, t.y - 14); c.lineTo(t.x, t.y + 14);
        c.stroke();
      }
    }
  }
  c.restore();
}

function drawCrucibleGambitBadge(c, time) {
  if (!G || !G.activeGambit || typeof CRUCIBLE_GAMBITS === 'undefined') return;
  const gambit = CRUCIBLE_GAMBITS[G.activeGambit];
  if (!gambit) return;
  c.save();
  const bx = 16, by = 16, bw = 240, bh = 26;
  c.fillStyle = 'rgba(15,23,42,0.88)';
  c.fillRect(bx, by, bw, bh);
  c.strokeStyle = gambit.color;
  c.lineWidth = 1.5;
  c.strokeRect(bx, by, bw, bh);

  c.font = '800 9.5px ' + FONT;
  c.fillStyle = gambit.color;
  c.textAlign = 'left';
  c.fillText('⚡ WAGER: ' + gambit.name.toUpperCase(), bx + 8, by + 17);
  c.restore();
}

function drawChimeraAuras(c, time) {
  if (!G || !G.towers) return;
  for (const t of G.towers) {
    if (!t.chimeraPrefix && !t.chimeraSuffix) continue;
    c.save();
    const pCol = (t.chimeraPrefix && typeof CHIMERA_PREFIXES !== 'undefined' && CHIMERA_PREFIXES[t.chimeraPrefix]) ? CHIMERA_PREFIXES[t.chimeraPrefix].color : '#a855f7';
    const sCol = (t.chimeraSuffix && typeof CHIMERA_SUFFIXES !== 'undefined' && CHIMERA_SUFFIXES[t.chimeraSuffix]) ? CHIMERA_SUFFIXES[t.chimeraSuffix].color : '#38bdf8';

    // Rotating prismatic aura ring
    const rad = 28 + Math.sin(time * 3) * 2;
    c.lineWidth = 1.8;
    c.strokeStyle = pCol;
    c.beginPath();
    c.arc(t.x, t.y, rad, time * 2, time * 2 + Math.PI * 1.2);
    c.stroke();

    c.strokeStyle = sCol;
    c.beginPath();
    c.arc(t.x, t.y, rad + 3, -time * 1.5, -time * 1.5 + Math.PI * 1.2);
    c.stroke();

    // Orbital sparkles
    for (let i = 0; i < 3; i++) {
      const ang = time * 2.5 + (i * Math.PI * 2) / 3;
      const spkX = t.x + Math.cos(ang) * (rad + 1.5);
      const spkY = t.y + Math.sin(ang) * (rad + 1.5);
      c.fillStyle = i % 2 === 0 ? pCol : sCol;
      c.fillRect(spkX - 1.5, spkY - 1.5, 3, 3);
    }
    c.restore();
  }
}

function drawChaosIncursionHUD(c, time) {
  if (!G || !G.chaosIncursion || G.chaosTimer <= 0) return;
  const incKey = G.chaosIncursion;
  const conf = typeof CHAOS_INCURSIONS !== 'undefined' ? CHAOS_INCURSIONS[incKey] : null;
  if (!conf) return;

  c.save();
  const bw = 280, bh = 38;
  const bx = (W - bw) / 2, by = 16;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);

  // Background box
  c.fillStyle = 'rgba(15, 23, 42, 0.92)';
  c.fillRect(bx, by, bw, bh);
  c.strokeStyle = conf.color;
  c.lineWidth = 2;
  c.strokeRect(bx, by, bw, bh);

  // Warning icon / pulses
  c.fillStyle = conf.color;
  c.globalAlpha = 0.8 + 0.2 * pulse;
  c.font = '800 11px ' + FONT;
  c.textAlign = 'left';
  c.fillText('⚠ CHAOS EVENT: ' + conf.name.toUpperCase(), bx + 10, by + 16);

  // Timer & Objective
  c.font = '700 9.5px ' + FONT;
  c.fillStyle = '#f8fafc';
  c.fillText(conf.desc, bx + 10, by + 30);

  c.textAlign = 'right';
  c.font = '800 12px ' + FONT;
  c.fillStyle = '#fbbf24';
  c.fillText(Math.ceil(G.chaosTimer) + 's', bx + bw - 10, by + 23);

  c.restore();
}

function drawTerraScars(c, time) {
  if (!G || !G.terraScars) return;
  c.save();
  for (const key of Object.keys(G.terraScars)) {
    const scar = G.terraScars[key];
    const parts = key.split(',');
    const col = parseInt(parts[0], 10), row = parseInt(parts[1], 10);
    const gx = col * TILE, gy = row * TILE;

    // Scorched fractured bedrock
    c.fillStyle = '#1c0d0d';
    c.fillRect(gx + 1, gy + 1, TILE - 2, TILE - 2);

    // Glowing magma fissure cracks
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + col * 2);
    c.strokeStyle = 'rgba(239, 68, 68, ' + (0.4 + 0.4 * pulse) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(gx + 6, gy + 8);
    c.lineTo(gx + 18, gy + 22);
    c.lineTo(gx + 14, gy + 36);
    c.moveTo(gx + 34, gy + 10);
    c.lineTo(gx + 22, gy + 26);
    c.lineTo(gx + 36, gy + 38);
    c.stroke();

    // Red fracture hazard border
    c.strokeStyle = '#ef444488';
    c.lineWidth = 1;
    c.strokeRect(gx + 2, gy + 2, TILE - 4, TILE - 4);

    // Countdown tag
    c.fillStyle = '#fca5a5';
    c.font = '800 8.5px ' + FONT;
    c.textAlign = 'center';
    c.fillText('SCAR ' + scar.wavesLeft + 'W', gx + TILE / 2, gy + TILE / 2 + 3);
  }
  c.restore();
}

function drawHarmonicLattices(c, time) {
  if (!G || !G.harmonicLattices || G.harmonicLattices.length === 0) return;
  c.save();
  for (const lat of G.harmonicLattices) {
    if (!lat.t1 || !lat.t2 || !lat.t3) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    const col = lat.color || '#38bdf8';

    // Triangle fill
    c.beginPath();
    c.moveTo(lat.t1.x, lat.t1.y);
    c.lineTo(lat.t2.x, lat.t2.y);
    c.lineTo(lat.t3.x, lat.t3.y);
    c.closePath();
    c.fillStyle = col + (lat.type === 'singularity' ? '1a' : '22');
    c.fill();

    // Resonant pulsing boundary
    c.strokeStyle = col;
    c.globalAlpha = 0.4 + 0.3 * pulse;
    c.lineWidth = 2;
    c.setLineDash([8, 4]);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1.0;

    // Centroid resonance marker
    const cx = (lat.t1.x + lat.t2.x + lat.t3.x) / 3;
    const cy = (lat.t1.y + lat.t2.y + lat.t3.y) / 3;
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx, cy, 4 + pulse * 2, 0, Math.PI * 2);
    c.fill();
    c.font = '800 8px ' + FONT;
    c.textAlign = 'center';
    c.fillText(lat.name ? lat.name.toUpperCase() : 'HARMONIC', cx, cy - 8);
  }
  c.restore();
}

/* ============================================================
   BASTION TD 13.0: VISCERAL RESONANCE & KINETIC TRANSCENDENCE RENDERERS
   ============================================================ */

function drawDebris(c, time) {
  if (!G || !G.debris || G.debris.length === 0) return;
  c.save();
  for (const d of G.debris) {
    const alpha = clamp(d.life / 0.5, 0, 1);
    c.globalAlpha = alpha;
    c.save();
    c.translate(d.x, d.y);
    c.rotate(d.angle || 0);
    const sz = d.size || 4;
    c.fillStyle = d.color || '#94a3b8';
    c.strokeStyle = '#0f172a';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-sz, -sz * 0.7);
    c.lineTo(sz, -sz * 0.4);
    c.lineTo(sz * 0.6, sz);
    c.lineTo(-sz * 0.8, sz * 0.8);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  c.restore();
}

function drawMoltenSlags(c, time) {
  if (!G || !G.moltenSlags || G.moltenSlags.length === 0) return;
  c.save();
  for (const s of G.moltenSlags) {
    const alpha = clamp(s.life / 1.0, 0, 0.85);
    const pulse = 0.5 + 0.5 * Math.sin(time * 6 + s.id);
    const r = (s.r || 38);
    const grad = c.createRadialGradient(s.x, s.y, 2, s.x, s.y, r);
    grad.addColorStop(0, 'rgba(249,115,22,' + alpha + ')');
    grad.addColorStop(0.5, 'rgba(234,88,12,' + (alpha * 0.7) + ')');
    grad.addColorStop(1, 'rgba(127,29,29,0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(s.x, s.y, r, 0, Math.PI * 2);
    c.fill();

    // Fiery crack lines
    c.strokeStyle = 'rgba(254,240,138,' + (alpha * (0.6 + 0.4 * pulse)) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(s.x - r * 0.5, s.y - r * 0.2);
    c.lineTo(s.x, s.y);
    c.lineTo(s.x + r * 0.4, s.y + r * 0.3);
    c.moveTo(s.x - r * 0.2, s.y + r * 0.4);
    c.lineTo(s.x, s.y);
    c.lineTo(s.x + r * 0.3, s.y - r * 0.4);
    c.stroke();
  }
  c.restore();
}

function drawIncomingMortars(c, time) {
  if (!G || !G.incomingMortars || G.incomingMortars.length === 0) return;
  c.save();
  for (const m of G.incomingMortars) {
    const isRefl = m.reflected;
    const col = isRefl ? '#38bdf8' : '#f97316';

    // Target crosshair
    const targetPulse = 0.6 + 0.4 * Math.sin(time * 12);
    c.strokeStyle = isRefl ? 'rgba(56,189,248,' + targetPulse + ')' : 'rgba(239,68,68,' + targetPulse + ')';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(m.tx, m.ty, 18, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(m.tx - 24, m.ty); c.lineTo(m.tx + 24, m.ty);
    c.moveTo(m.tx, m.ty - 24); c.lineTo(m.tx, m.ty + 24);
    c.stroke();

    // Shadow on ground
    const groundX = lerp(m.sx, m.tx, m.progress);
    const groundY = lerp(m.sy, m.ty, m.progress);
    c.fillStyle = 'rgba(15,23,42,0.45)';
    c.beginPath();
    c.ellipse(groundX, groundY, 12, 6, 0, 0, Math.PI * 2);
    c.fill();

    // Flying projectile
    c.fillStyle = isRefl ? '#67e8f9' : '#fed7aa';
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(m.x, m.y, isRefl ? 7 : 6, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Glow aura
    c.fillStyle = isRefl ? 'rgba(56,189,248,0.35)' : 'rgba(249,115,22,0.35)';
    c.beginPath();
    c.arc(m.x, m.y, 14, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawChronosSpear(c, time) {
  if (!G || !G.chronosSpearActive) return;
  const sp = G.chronosSpearActive;
  c.save();
  if (sp.state === 'targeting') {
    const pulse = 0.5 + 0.5 * Math.sin(time * 15);
    c.strokeStyle = 'rgba(239,68,68,' + (0.6 + 0.4 * pulse) + ')';
    c.lineWidth = 3;
    c.setLineDash([12, 6]);
    c.beginPath();
    c.moveTo(sp.tx, -50);
    c.lineTo(sp.tx, sp.ty);
    c.stroke();
    c.setLineDash([]);

    c.strokeStyle = '#ef4444';
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(sp.tx, sp.ty, 32 + (1 - sp.t / sp.maxT) * 40, 0, Math.PI * 2);
    c.stroke();
    c.font = '800 11px ' + FONT;
    c.fillStyle = '#ef4444';
    c.textAlign = 'center';
    c.fillText('ORBITAL LOCK: ' + (Math.ceil((sp.maxT - sp.t) * 10) / 10).toFixed(1) + 's', sp.tx, sp.ty + 46);
  } else if (sp.state === 'chasm') {
    const alpha = clamp(sp.maxT - sp.t, 0, 1);
    const rad = (typeof VISCERAL_CONFIG !== 'undefined' && VISCERAL_CONFIG.chronosSpear && VISCERAL_CONFIG.chronosSpear.chasmRadius) ? VISCERAL_CONFIG.chronosSpear.chasmRadius : 110;
    const spin = time * 4;

    const g = c.createRadialGradient(sp.tx, sp.ty, 5, sp.tx, sp.ty, rad);
    g.addColorStop(0, 'rgba(15,23,42,' + (0.95 * alpha) + ')');
    g.addColorStop(0.3, 'rgba(56,189,248,' + (0.45 * alpha) + ')');
    g.addColorStop(0.7, 'rgba(147,51,234,' + (0.35 * alpha) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(sp.tx, sp.ty, rad, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#020617';
    c.beginPath();
    c.arc(sp.tx, sp.ty, 22, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2.5;
    c.stroke();

    for (let i = 0; i < 3; i++) {
      const armAngle = spin + (i * Math.PI * 2) / 3;
      c.strokeStyle = i % 2 === 0 ? 'rgba(56,189,248,0.7)' : 'rgba(192,132,252,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(sp.tx, sp.ty, 40 + i * 18, armAngle, armAngle + Math.PI * 0.7);
      c.stroke();
    }
  }
  c.restore();
}

function drawHarmonicCadenceVfx(c, time) {
  if (!G || G.harmonicCadenceT <= 0) return;
  c.save();
  const pulse = 0.5 + 0.5 * Math.sin(time * 10);
  const hue = Math.floor((time * 120) % 360);
  const col = 'hsl(' + hue + ', 90%, 60%)';
  c.strokeStyle = col;
  c.lineWidth = 6 + pulse * 4;
  c.strokeRect(3, 3, W - 6, H - 6);

  c.fillStyle = 'rgba(15,23,42,0.85)';
  c.strokeStyle = col;
  c.lineWidth = 2;
  rr(c, W / 2 - 130, 8, 260, 26, 6);
  c.fill();
  c.stroke();

  c.font = '800 11px ' + FONT;
  c.fillStyle = col;
  c.textAlign = 'center';
  c.fillText('★ HARMONIC CADENCE OVERDRIVE (' + Math.ceil(G.harmonicCadenceT) + 's) ★', W / 2, 25);
  c.restore();
}

function drawCitadelAegisVfx(c, time) {
  if (!G) return;
  if (G.aegisLockdownT > 0) {
    c.save();
    const pulse = 0.5 + 0.5 * Math.sin(time * 16);
    c.strokeStyle = 'rgba(6,182,212,' + (0.5 + 0.3 * pulse) + ')';
    c.lineWidth = 8;
    c.strokeRect(4, 4, W - 8, H - 8);

    c.fillStyle = 'rgba(6,182,212,0.06)';
    c.fillRect(0, 0, W, H);
    c.restore();
  }
}

function drawMechRadioHUD(c, time) {
  if (!G || !G.mechRadioMessage) return;
  const msg = G.mechRadioMessage;
  c.save();
  const alpha = clamp(msg.t / 0.5, 0, 1);
  c.globalAlpha = alpha;

  const rx = W - 320, ry = 48, rw = 305, rh = 40;
  c.fillStyle = 'rgba(11,15,23,0.92)';
  c.strokeStyle = msg.color || '#38bdf8';
  c.lineWidth = 1.5;
  rr(c, rx, ry, rw, rh, 5);
  c.fill();
  c.stroke();

  c.strokeStyle = msg.color || '#38bdf8';
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const waveH = Math.abs(Math.sin(time * 8 + i)) * 14 + 4;
    c.beginPath();
    c.moveTo(rx + 14 + i * 5, ry + 20 - waveH / 2);
    c.lineTo(rx + 14 + i * 5, ry + 20 + waveH / 2);
    c.stroke();
  }

  c.font = '800 9.5px ' + FONT;
  c.fillStyle = '#f8fafc';
  c.textAlign = 'left';
  c.fillText(msg.text, rx + 40, ry + 24);
  c.restore();
}

function drawKillStreakHUD(c, time) {
  if (!G || !G.killStreak || G.killStreak < 3 || G.killStreakTimer <= 0) return;
  c.save();
  const kx = W / 2, ky = 72;
  const timerPct = clamp(G.killStreakTimer / ((typeof VISCERAL_CONFIG !== 'undefined' && VISCERAL_CONFIG.combos) ? VISCERAL_CONFIG.combos.streakWindow : 1.1), 0, 1);
  const col = G.killStreak >= 20 ? '#c084fc' : G.killStreak >= 10 ? '#f97316' : '#fbbf24';

  c.fillStyle = 'rgba(11,15,23,0.85)';
  c.strokeStyle = col;
  c.lineWidth = 1.5;
  rr(c, kx - 70, ky - 18, 140, 28, 4);
  c.fill();
  c.stroke();

  c.fillStyle = col;
  c.fillRect(kx - 65, ky + 6, 130 * timerPct, 3);

  c.font = '800 11.5px ' + FONT;
  c.fillStyle = col;
  c.textAlign = 'center';
  c.fillText('COMBO ' + G.killStreak + 'x RAMPAGE', kx, ky);
  c.restore();
}

/* ============================================================
   BASTION TD 14.0: THE OMNI-RESONANCE MATRIX RENDERING
   ============================================================ */

function drawSteamClouds(c, time) {
  if (!G || !G.steamClouds || G.steamClouds.length === 0) return;
  c.save();
  for (const s of G.steamClouds) {
    const alpha = Math.min(0.65, s.life / 3.0);
    c.fillStyle = 'rgba(224, 242, 254, ' + (alpha * 0.45) + ')';
    c.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.75) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(s.x, s.y, s.r || 60, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    for (let i = 0; i < 3; i++) {
      const a = (time * 1.5) + (i * Math.PI * 2 / 3);
      const px = s.x + Math.cos(a) * 18, py = s.y + Math.sin(a) * 18;
      c.beginPath();
      c.arc(px, py, (s.r || 60) * 0.45, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

function drawBioGasClouds(c, time) {
  if (!G || !G.bioGasClouds || G.bioGasClouds.length === 0) return;
  c.save();
  for (const g of G.bioGasClouds) {
    const alpha = Math.min(0.70, g.life / 4.0);
    c.fillStyle = 'rgba(34, 197, 94, ' + (alpha * 0.35) + ')';
    c.strokeStyle = 'rgba(74, 222, 128, ' + (alpha * 0.8) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(g.x, g.y, g.r || 70, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (time * 2.0) + (i * Math.PI / 2);
      const px = g.x + Math.cos(a) * 22, py = g.y + Math.sin(a) * 22;
      c.fillStyle = 'rgba(234, 179, 8, ' + (alpha * 0.5) + ')';
      c.beginPath();
      c.arc(px, py, 6 + Math.sin(time * 5 + i) * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

function drawTetherBeam(c, time) {
  if (!G || !G.tetherActive || !G.mech || !G.tetherActive.tower) return;
  const t = G.tetherActive.tower, m = G.mech;
  c.save();
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 3.5 + Math.sin(time * 15) * 1.5;
  c.beginPath();
  c.moveTo(m.x, m.y);
  const midX = (m.x + t.x) / 2 + (Math.random() - 0.5) * 10;
  const midY = (m.y + t.y) / 2 + (Math.random() - 0.5) * 10;
  c.quadraticCurveTo(midX, midY, t.x, t.y);
  c.stroke();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.stroke();
  glow(c, t.x, t.y, 20, '#38bdf8', 0.8);
  c.restore();
}

function drawCarriedTower(c, time) {
  if (!G || !G.carriedTower || !G.mech) return;
  const t = G.carriedTower, m = G.mech;
  c.save();
  c.translate(m.x, m.y - 18);
  c.strokeStyle = '#f59e0b';
  c.lineWidth = 2;
  c.setLineDash([3, 3]);
  c.strokeRect(-12, -12, 24, 24);
  c.setLineDash([]);
  c.fillStyle = 'rgba(245, 158, 11, 0.4)';
  c.fillRect(-10, -10, 20, 20);
  c.fillStyle = '#fff';
  c.font = '800 8px ' + FONT;
  c.textAlign = 'center';
  c.fillText('CARRIED', 0, -14);
  c.restore();
}

function drawCustomTowers(c, time) {
  if (!G || !G.customChassis || G.customChassis.length === 0) return;
  c.save();
  for (const t of G.customChassis) {
    if (t.isCarried) continue;
    c.save();
    c.translate(t.x, t.y);
    if (t.chassis === 'hex_hover_drone') {
      c.strokeStyle = '#06b6d4';
      c.lineWidth = 2;
      c.fillStyle = 'rgba(6, 182, 212, 0.2)';
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = Math.cos(a) * 16, py = Math.sin(a) * 16;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
      c.fill(); c.stroke();
    } else if (t.chassis === 'pneumatic_biped') {
      c.fillStyle = '#475569';
      c.fillRect(-12, -12, 24, 24);
      c.strokeStyle = '#f59e0b';
      c.lineWidth = 1.5;
      c.strokeRect(-12, -12, 24, 24);
    } else {
      c.fillStyle = '#1e293b';
      c.fillRect(-14, -14, 28, 28);
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 2;
      c.strokeRect(-14, -14, 28, 28);
    }

    c.rotate(t.angle || 0);
    c.fillStyle = t.payload === 'tesla_arc' ? '#38bdf8' : (t.payload === 'tachyon_rail' ? '#f43f5e' : '#f59e0b');
    c.fillRect(0, -4, 16, 8);
    c.restore();
  }
  c.restore();
}

/* ============================================================
   BASTION TD 15.0: APEX ASCENDANT RENDERING ROUTINES
   ============================================================ */

function drawChronoEchoes(c, time) {
  if (!G) return;
  if (G.chronoAnchor && G.chronoAnchor.active) {
    const a = G.chronoAnchor;
    c.save();
    const pulse = 0.5 + 0.5 * Math.sin(time * 6);
    c.strokeStyle = 'rgba(56, 189, 248, ' + (0.4 + 0.4 * pulse) + ')';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(a.x, a.y, 22 + pulse * 8, 0, TAU);
    c.stroke();

    c.fillStyle = 'rgba(56, 189, 248, 0.2)';
    c.beginPath();
    c.arc(a.x, a.y, 16, 0, TAU);
    c.fill();

    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(a.x + Math.cos(time * 3) * 12, a.y + Math.sin(time * 3) * 12);
    c.stroke();

    c.font = '800 10px ' + FONT;
    c.fillStyle = '#38bdf8';
    c.textAlign = 'center';
    c.fillText('ANCHOR [' + Math.max(0, a.t).toFixed(1) + 's]', a.x, a.y - 28);
    c.restore();
  }

  if (G.temporalEchoes && G.temporalEchoes.length > 0) {
    c.save();
    for (const echo of G.temporalEchoes) {
      const alpha = clamp(echo.life / (echo.maxLife || 4.0), 0, 1);
      c.globalAlpha = alpha * 0.75;
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 1.5;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.arc(echo.x, echo.y, 18, 0, TAU);
      c.stroke();

      if (echo.targetX !== undefined && echo.targetY !== undefined) {
        c.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(echo.x, echo.y);
        c.lineTo(echo.targetX, echo.targetY);
        c.stroke();
      }
    }
    c.setLineDash([]);
    c.restore();
  }
}

function drawGeomorphicFissures(c, time) {
  if (!G || !G.geomorphicFissures || G.geomorphicFissures.length === 0) return;
  c.save();
  for (const fis of G.geomorphicFissures) {
    const alpha = clamp(fis.life / (fis.maxLife || 14.0), 0, 1);
    c.globalAlpha = alpha;
    c.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    c.lineWidth = 14;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(fis.x1, fis.y1);
    c.lineTo(fis.x2, fis.y2);
    c.stroke();

    c.strokeStyle = '#f97316';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(fis.x1, fis.y1);
    c.lineTo(fis.x2, fis.y2);
    c.stroke();

    c.strokeStyle = '#fef08a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(fis.x1, fis.y1);
    c.lineTo(fis.x2, fis.y2);
    c.stroke();
  }
  c.restore();
}

function drawZeroGravityFields(c, time) {
  if (!G || !G.zeroGravityFields || G.zeroGravityFields.length === 0) return;
  c.save();
  for (const zg of G.zeroGravityFields) {
    const alpha = clamp(zg.life / (zg.maxLife || 10.0), 0, 1);
    c.globalAlpha = alpha;
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    
    c.fillStyle = 'rgba(6, 182, 212, 0.12)';
    c.beginPath();
    c.arc(zg.x, zg.y, zg.r, 0, TAU);
    c.fill();

    c.strokeStyle = 'rgba(192, 132, 252, ' + (0.4 + 0.3 * pulse) + ')';
    c.lineWidth = 2.5;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.arc(zg.x, zg.y, zg.r, 0, TAU);
    c.stroke();

    c.font = '800 9px ' + FONT;
    c.fillStyle = '#67e8f9';
    c.textAlign = 'center';
    c.fillText('ZERO-G FIELD', zg.x, zg.y - zg.r - 4);
  }
  c.setLineDash([]);
  c.restore();
}

function drawFinisherPrompt(c, time) {
  if (!G || !G.finisherPrompt || !G.finisherPrompt.boss || G.finisherPrompt.boss.dead) return;
  const b = G.finisherPrompt.boss;
  c.save();
  const pulse = 0.5 + 0.5 * Math.sin(time * 12);
  const px = b.x, py = b.y - (b.r || 30) - 38;

  c.strokeStyle = '#f43f5e';
  c.lineWidth = 2.5;
  const sz = 24 + pulse * 6;
  c.strokeRect(b.x - sz / 2, b.y - sz / 2, sz, sz);

  c.fillStyle = 'rgba(244, 63, 94, 0.9)';
  c.fillRect(px - 58, py - 12, 116, 24);
  c.strokeStyle = '#fff';
  c.lineWidth = 1.5;
  c.strokeRect(px - 58, py - 12, 116, 24);

  c.font = '900 12px ' + FONT;
  c.fillStyle = '#fff';
  c.textAlign = 'center';
  c.fillText('⚡ [F] EXECUTE ⚡', px, py + 4);
  c.restore();
}

function drawAdrenalineHeatBorder(c, time) {
  if (!G || !G.adrenalineHeat || G.adrenalineHeat < 2) return;
  c.save();
  const heat = G.adrenalineHeat;
  const pulse = 0.5 + 0.5 * Math.sin(time * (4 + heat * 2));
  const intensity = (heat - 1) / 4;
  c.strokeStyle = 'rgba(244, 63, 94, ' + (0.25 + 0.35 * intensity * pulse) + ')';
  c.lineWidth = 6 + heat * 2;
  c.strokeRect(4, 4, W - 8, H - 8);

  c.fillStyle = 'rgba(15, 23, 42, 0.85)';
  c.fillRect(W / 2 - 120, 4, 240, 22);
  c.strokeStyle = '#f43f5e';
  c.lineWidth = 1.5;
  c.strokeRect(W / 2 - 120, 4, 240, 22);

  c.font = '800 11px ' + FONT;
  c.fillStyle = '#f43f5e';
  c.textAlign = 'center';
  c.fillText('🔥 HEAT STREAK ' + heat + 'x (' + ((heat - 1) * 100) + '% BOUNTY) 🔥', W / 2, 19);
  c.restore();
}

/* ============================================================
   BASTION TD 16.0: ADAPTIVE ENTROPY RENDERING ROUTINES
   ============================================================ */

function drawTacticalVersatilityMeter(c, time) {
  if (!G || !G.entropy) return;
  const rank = G.entropy.tvmRank || 'B';
  const cfg = (typeof ENTROPY_CONFIG !== 'undefined' && ENTROPY_CONFIG.ranks && ENTROPY_CONFIG.ranks[rank]) ? ENTROPY_CONFIG.ranks[rank] : { color: '#fbbf24', mult: 1.25, name: 'Tactician' };
  
  c.save();
  const bx = W - 230, by = 10, bw = 215, bh = 22;
  c.fillStyle = 'rgba(15, 23, 42, 0.85)';
  c.fillRect(bx, by, bw, bh);
  c.strokeStyle = cfg.color;
  c.lineWidth = 1.5;
  c.strokeRect(bx, by, bw, bh);

  c.fillStyle = cfg.color;
  c.fillRect(bx, by, 32, bh);
  c.font = '900 12px ' + FONT;
  c.fillStyle = '#0f172a';
  c.textAlign = 'center';
  c.fillText(rank, bx + 16, by + 16);

  c.font = '800 10px ' + FONT;
  c.fillStyle = cfg.color;
  c.textAlign = 'left';
  c.fillText('STYLE: ' + cfg.name.toUpperCase(), bx + 38, by + 15);

  c.font = '700 9.5px ' + FONT;
  c.fillStyle = '#cbd5e1';
  c.textAlign = 'right';
  c.fillText(cfg.mult + 'x SCORE', bx + bw - 6, by + 15);
  c.restore();
}

function drawFlankBreachIndicator(c, time) {
  if (!G || !G.entropy) return;
  if (G.entropy.flankBreachWarningT > 0) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 12);
    c.save();
    c.fillStyle = 'rgba(249, 115, 22, ' + (0.2 + 0.25 * pulse) + ')';
    const startPt = (typeof PATH_BREACH !== 'undefined' && PATH_BREACH.length > 0) ? PATH_BREACH[0] : { x: 100, y: 100 };
    c.beginPath();
    c.arc(startPt.x, startPt.y, 40 + pulse * 10, 0, TAU);
    c.fill();
    c.strokeStyle = '#f97316';
    c.lineWidth = 2;
    c.stroke();

    c.font = '800 10px ' + FONT;
    c.fillStyle = '#f97316';
    c.textAlign = 'center';
    c.fillText('⚠️ FLANK BURROWING (' + G.entropy.flankBreachWarningT.toFixed(1) + 's)', startPt.x, startPt.y - 25);
    c.restore();
  }

  if (G.entropy.flankBreachActiveT > 0 && typeof PATH_BREACH !== 'undefined' && PATH_BREACH.length > 1) {
    c.save();
    c.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    c.lineWidth = 4;
    c.setLineDash([8, 6]);
    c.beginPath();
    c.moveTo(PATH_BREACH[0].x, PATH_BREACH[0].y);
    for (let i = 1; i < PATH_BREACH.length; i++) {
      c.lineTo(PATH_BREACH[i].x, PATH_BREACH[i].y);
    }
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
}

function drawSyndicateSiphonRig(c, time) {
  if (!G || !G.entropy || !G.entropy.siphonRig || G.entropy.siphonRig.dead) return;
  const rig = G.entropy.siphonRig;
  c.save();

  const bx = typeof BASE_PT !== 'undefined' ? BASE_PT.x : (W - 80);
  const by = typeof BASE_PT !== 'undefined' ? BASE_PT.y : (H / 2);
  c.strokeStyle = 'rgba(192, 132, 252, 0.6)';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(rig.x, rig.y);
  c.lineTo(bx, by);
  c.stroke();

  c.fillStyle = 'rgba(15, 23, 42, 0.9)';
  c.fillRect(rig.x - 22, rig.y - 22, 44, 44);
  c.strokeStyle = '#c084fc';
  c.lineWidth = 2;
  c.strokeRect(rig.x - 22, rig.y - 22, 44, 44);

  c.strokeStyle = '#e879f9';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(rig.x, rig.y);
  c.lineTo(rig.x + Math.cos(time * 4) * 16, rig.y + Math.sin(time * 4) * 16);
  c.stroke();

  c.font = '800 9px ' + FONT;
  c.fillStyle = '#e879f9';
  c.textAlign = 'center';
  c.fillText('SIPHON RIG', rig.x, rig.y - 28);
  c.fillText('-' + Math.round(rig.siphonedGold || 0) + 'G DRAINED', rig.x, rig.y + 35);
  c.restore();
}

function drawThermalMicroVortex(c, time) {
  if (!G || !G.entropy || !G.entropy.clusterOverheated) return;
  c.save();
  let cx = 0, cy = 0, count = 0;
  for (const t of (G.towers || [])) {
    cx += t.x; cy += t.y; count++;
  }
  if (count > 0) {
    cx /= count; cy /= count;
    const pulse = 0.5 + 0.5 * Math.sin(time * 5);
    c.strokeStyle = 'rgba(249, 115, 22, ' + (0.2 + 0.15 * pulse) + ')';
    c.lineWidth = 3;
    c.setLineDash([6, 6]);
    c.beginPath();
    c.arc(cx, cy, 70 + pulse * 10, 0, TAU);
    c.stroke();
    c.setLineDash([]);
    c.font = '800 8.5px ' + FONT;
    c.fillStyle = '#f97316';
    c.textAlign = 'center';
    c.fillText('THERMAL MICRO-VORTEX (+75% HEAT)', cx, cy - 80);
  }
  c.restore();
}

/* ============================================================
   17.0 THE CHRONO-TACTICAL SINGULARITY RENDERING SYSTEMS
   ============================================================ */

function drawHostileProjectiles(c, time) {
  if (!G || !G.hostileProjectiles || G.hostileProjectiles.length === 0) return;
  c.save();
  for (const p of G.hostileProjectiles) {
    // Ballistic Shadow on Ground
    const shadowY = p.sy + (p.ty - p.sy) * (p.progress || 0);
    c.fillStyle = 'rgba(0, 0, 0, 0.35)';
    c.beginPath();
    c.ellipse(p.x, shadowY, 12, 6, 0, 0, TAU);
    c.fill();

    // Flight Trail
    c.strokeStyle = p.deflected ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.45)';
    c.lineWidth = 2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(p.sx, p.sy);
    c.lineTo(p.x, p.y);
    c.stroke();
    c.setLineDash([]);

    // Projectile Core
    c.fillStyle = p.deflected ? '#38bdf8' : '#ef4444';
    c.beginPath();
    c.arc(p.x, p.y, p.deflected ? 9 : 7, 0, TAU);
    c.fill();

    // Parry Window Prompt Ring
    if (p.parryWindow && !p.deflected) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 18);
      c.strokeStyle = '#fbbf24';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(p.x, p.y, 18 + pulse * 6, 0, TAU);
      c.stroke();

      c.font = '800 11px ' + FONT;
      c.fillStyle = '#fbbf24';
      c.textAlign = 'center';
      c.fillText('[SPACE] PARRY!', p.x, p.y - 20);
    } else if (p.deflected) {
      c.font = '800 10px ' + FONT;
      c.fillStyle = '#38bdf8';
      c.textAlign = 'center';
      c.fillText('DEFLECTED 300%', p.x, p.y - 14);
    }
  }
  c.restore();
}

function drawLootParticles(c, time) {
  if (!G || !G.lootParticles || G.lootParticles.length === 0) return;
  c.save();
  for (const lp of G.lootParticles) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 12 + lp.x);
    c.fillStyle = lp.color || '#38bdf8';
    c.beginPath();
    c.arc(lp.x, lp.y, 3.5 + pulse * 1.5, 0, TAU);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1;
    c.stroke();
  }
  c.restore();
}

function drawHarmonicBeams(c, time) {
  if (!G || !G.harmonicBeams || G.harmonicBeams.length === 0) return;
  c.save();
  for (const hb of G.harmonicBeams) {
    if (!hb.t1 || !hb.t2 || !hb.t3) continue;
    const alpha = clamp(hb.life / hb.maxLife, 0, 1);
    c.strokeStyle = 'rgba(56, 189, 248, ' + (0.75 * alpha) + ')';
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(hb.t1.x, hb.t1.y);
    c.lineTo(hb.t2.x, hb.t2.y);
    c.lineTo(hb.t3.x, hb.t3.y);
    c.closePath();
    c.stroke();

    c.fillStyle = 'rgba(56, 189, 248, ' + (0.08 * alpha) + ')';
    c.fill();
  }
  c.restore();
}

function drawGhostEntities(c, time) {
  if (!G || !G.paradox || !G.paradox.active || !G.paradox.ghostEntities) return;
  c.save();
  for (const ge of G.paradox.ghostEntities) {
    if (ge.type === 'ghost_mech') {
      const pulse = 0.5 + 0.5 * Math.sin(time * 10);
      c.fillStyle = 'rgba(56, 189, 248, ' + (0.35 + 0.2 * pulse) + ')';
      c.strokeStyle = '#38bdf8';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(ge.x, ge.y, 24, 0, TAU);
      c.fill();
      c.stroke();

      c.font = '800 9px ' + FONT;
      c.fillStyle = '#38bdf8';
      c.textAlign = 'center';
      c.fillText('GHOST MECH [PAST]', ge.x, ge.y - 28);
    }
  }
  c.restore();
}

function drawTemporalParadoxHUD(c, time) {
  if (!G || !G.paradox || !G.paradox.active) return;
  c.save();
  const p = G.paradox;
  const pulse = 0.5 + 0.5 * Math.sin(time * 8);

  // Screen-Edge Chromatic Glitch Border
  c.strokeStyle = 'rgba(56, 189, 248, ' + (0.4 + 0.3 * pulse) + ')';
  c.lineWidth = 6;
  c.strokeRect(3, 3, W - 6, H - 6);

  // Top Center HUD Banner
  const bw = 360, bh = 32, bx = W / 2 - bw / 2, by = 16;
  c.fillStyle = 'rgba(15, 23, 42, 0.9)';
  c.fillRect(bx, by, bw, bh);
  c.strokeStyle = '#38bdf8';
  c.lineWidth = 1.5;
  c.strokeRect(bx, by, bw, bh);

  // Remaining Paradox Countdown Bar
  const pct = clamp(p.timer / p.maxDuration, 0, 1);
  c.fillStyle = 'rgba(56, 189, 248, 0.4)';
  c.fillRect(bx + 4, by + bh - 6, (bw - 8) * pct, 3);

  c.font = '800 12px ' + FONT;
  c.fillStyle = '#38bdf8';
  c.textAlign = 'center';
  c.fillText('⏳ TEMPORAL PARADOX: ' + p.timer.toFixed(1) + 's (GHOST FLEET ONLINE)', W / 2, by + 18);
  c.restore();
}
