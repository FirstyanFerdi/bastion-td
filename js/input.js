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
function onPointerDown(e) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
  Sfx.init(); Sfx.resume();
  onPointerMove(e);
  if (e.button === 2) { G.placing = null; G.sel = null; G.uiDirty = true; return; }
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
    if (G.state === 'over' || G.state === 'victory') return;
    if (G.paused) togglePause();
    else if (G.state === 'prep') callWave();
    else togglePause();
    return;
  }
  if (G.state !== 'prep' && G.state !== 'active') return;
  if (k >= '1' && k <= '5') { selectShop(TKEYS[Number(k) - 1]); return; }
  switch (k) {
    case 'Escape': G.placing = null; G.sel = null; G.uiDirty = true; break;
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
