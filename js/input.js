'use strict';
/* Pointer and keyboard handling, canvas fitting */

/* ============================================================
   INPUT
   ============================================================ */
function setSpeed(s) { G.speed = s; Sfx.play('click'); }
function togglePause() {
  if (G.state !== 'prep' && G.state !== 'active') return;
  G.paused = !G.paused; Sfx.play('click');
}
function toggleMute() { Sfx.init(); Sfx.setMuted(!Sfx.muted); if (!Sfx.muted) Sfx.play('click'); }
function begin() {
  Sfx.init(); Sfx.resume && Sfx.resume();
  newGame(true); showOverlay(null); wcWave = -1;
}
Sfx.resume = function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); };

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H };
}
function onPointerMove(e) {
  if (!G) return;
  const p = canvasPos(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.in = true;
  const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
  G.hover = (col >= 0 && row >= 0 && col < COLS && row < ROWS) ? { c: col, r: row } : null;
}
function triggerSkill(id) {
  if (!G || (G.state !== 'prep' && G.state !== 'active') || G.drafting) return;
  const sk = G.skills[id];
  if (!sk || sk.cd > 0) { Sfx.play('error'); return; }
  if (G.casting === id) { G.casting = null; G.uiDirty = true; Sfx.play('click'); return; }
  G.casting = id; G.placing = null; G.sel = null; G.uiDirty = true;
  Sfx.play('click');
}

function onPointerDown(e) {
  if (!G || (G.state !== 'prep' && G.state !== 'active') || G.drafting) return;
  Sfx.init(); Sfx.resume();
  onPointerMove(e);
  if (e.button === 2) { G.placing = null; G.sel = null; G.casting = null; G.uiDirty = true; return; }

  // Commander Casting Handle
  if (G.casting) {
    const p = canvasPos(e);
    const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
    if (G.casting === 'orbital') {
      const rad = 95 * (hasPerk('orbital_salvo') ? 1.4 : 1.0);
      burst(p.x, p.y, 45, '#f43f5e', 220, 0.8, 4, true);
      addRing(p.x, p.y, 10, rad, 0.7, '#f43f5e', 5);
      shake(12); Sfx.play('orbital');
      for (const en of G.enemies) {
        if (en.dead) continue;
        if ((en.x - p.x) ** 2 + (en.y - p.y) ** 2 <= (rad + en.r) ** 2) {
          dealDamage(en, 420 * hpScale(G.wave) * 0.45, 'phys', null);
          en.revealT = 4.0;
        }
      }
      G.skills.orbital.cd = COMMANDER_SKILLS.orbital.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'overcharge') {
      let bestT = null, bestD = 48 * 48;
      for (const t of G.towers) {
        const d = (t.x - p.x) ** 2 + (t.y - p.y) ** 2;
        if (d < bestD) { bestD = d; bestT = t; }
      }
      if (bestT) {
        bestT.overchargeT = 7.0;
        burst(bestT.x, bestT.y, 25, '#38bdf8', 140, 0.6, 3, false);
        addRing(bestT.x, bestT.y, 10, 50, 0.5, '#38bdf8', 4);
        addText(bestT.x, bestT.y - 20, 'OVERCHARGED!', '#38bdf8', 16);
        Sfx.play('overcharge');
        G.skills.overcharge.cd = COMMANDER_SKILLS.overcharge.cd;
        G.casting = null; G.uiDirty = true;
        return;
      } else {
        Sfx.play('error'); return;
      }
    } else if (G.casting === 'caltrops') {
      if (col >= 0 && row >= 0 && col < COLS && row < ROWS && pathTile[row][col]) {
        const dur = hasPerk('nanite_infusion') ? 18 : 12;
        G.hazards.push({ type: 'caltrops', x: col * TILE + TILE / 2, y: row * TILE + TILE / 2, r: 28, life: dur, max: dur, dps: 34, col, row });
        burst(col * TILE + TILE / 2, row * TILE + TILE / 2, 14, '#e2a72e', 90, 0.4, 2.5, true);
        Sfx.play('caltrops');
        G.skills.caltrops.cd = COMMANDER_SKILLS.caltrops.cd;
        G.casting = null; G.uiDirty = true;
        return;
      } else {
        Sfx.play('error'); return;
      }
    }
  }

  if (!G.hover) return;
  const { c, r } = G.hover;
  if (G.placing) {
    if (pathTile[r][c] || G.grid[r][c]) { Sfx.play('error'); return; }
    const t = placeTower(c, r, G.placing);
    if (t) { if (!e.shiftKey) G.placing = null; G.sel = e.shiftKey ? null : t; G.uiDirty = true; }
    return;
  }
  const t = G.grid[r][c];
  if (t) { G.sel = t; Sfx.play('click'); } else G.sel = null;
  G.uiDirty = true;
}
function onKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (!G) return;
  if (G.state === 'menu') { if (e.code === 'Space' || k === 'Enter') { e.preventDefault(); begin(); } return; }
  if (e.code === 'Space') {
    e.preventDefault();
    if (e.repeat) return;
    if (G.state === 'over' || G.state === 'victory' || G.drafting) return;
    if (G.paused) togglePause();
    else if (G.state === 'prep') callWave();
    else togglePause();
    return;
  }
  if (G.state !== 'prep' && G.state !== 'active') return;
  if (k >= '1' && k <= '5') { selectShop(TKEYS[Number(k) - 1]); return; }
  switch (k) {
    case 'q': case 'Q': triggerSkill('orbital'); break;
    case 'w': case 'W': triggerSkill('overcharge'); break;
    case 'e': case 'E': triggerSkill('caltrops'); break;
    case 'Escape': G.placing = null; G.sel = null; G.casting = null; G.uiDirty = true; break;
    case 'p': case 'P': togglePause(); break;
    case 'm': case 'M': toggleMute(); break;
    case 'f': case 'F': setSpeed(G.speed % 3 + 1); break;
    case 'u': case 'U': if (G.sel) upgradeTower(G.sel); break;
    case 'x': case 'X': case 'Delete': if (G.sel) sellTower(G.sel); break;
  }
}
function fit() {
  const st = $('stage'), wrap = $('canvasWrap'), narrow = window.innerWidth <= 980;
  const aw = st.clientWidth, ah = narrow ? 1e5 : st.clientHeight;
  const w = Math.max(280, Math.min(aw, ah * W / H));
  wrap.style.width = Math.floor(w) + 'px'; wrap.style.height = Math.floor(w * H / W) + 'px';
}
