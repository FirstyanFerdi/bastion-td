'use strict';
/* Game loop, init() and the test hook */

/* ============================================================
   MAIN LOOP
   ============================================================ */
function frame(ts) {
  requestAnimationFrame(frame);
  let dt = (ts - last) / 1000; last = ts;
  if (!(dt > 0)) dt = 0.016; if (dt > 0.1) dt = 0.1;
  if (G.state === 'prep' || G.state === 'active') {
    if (!G.paused) {
      const sdt = dt * G.speed, steps = Math.max(1, Math.ceil(sdt / (1 / 50))), h = sdt / steps;
      for (let i = 0; i < steps && (G.state === 'prep' || G.state === 'active'); i++) update(h);
    }
  } else if (G.state === 'menu') { G.anim += dt; }
  render();
  refreshUI();
}

let enemyIcons = {};
function init() {
  canvas = $('game');
  S = clamp(window.devicePixelRatio || 1, 1.5, 2);
  canvas.width = Math.round(W * S); canvas.height = Math.round(H * S);
  ctx = canvas.getContext('2d');
  buildMap(); buildDock();
  document.querySelectorAll('[data-ico]').forEach(el => { el.innerHTML = svg(el.dataset.ico); });
  ['scout', 'swarm', 'brute', 'healer', 'stealth', 'carrier', 'breacher', 'boss'].forEach(k => enemyIcons[k] = enemyIcon(k));
  newGame(false); G.state = 'menu';
  showOverlay('menu');
  fit(); window.addEventListener('resize', fit);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerleave', () => { if (G) { G.hover = null; G.mouse.in = false; } });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => { if (e.code === 'Space') e.preventDefault(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.state === 'active') G.paused = true; });
  document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if (b && b.blur) setTimeout(() => b.blur(), 0);
  });
  $('speedSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b && G) setSpeed(Number(b.dataset.speed)); });
  $('btnPause').addEventListener('click', () => { Sfx.init(); togglePause(); });
  $('btnMute').addEventListener('click', toggleMute);
  $('btnCall').addEventListener('click', () => { Sfx.init(); Sfx.resume(); if (G.state === 'menu') return; Sfx.play('click'); callWave(); });
  $('dock').addEventListener('click', e => { const s = e.target.closest('.shop'); if (s) { Sfx.init(); Sfx.resume(); selectShop(s.dataset.type); } });
  $('cmdSkills').addEventListener('click', e => {
    const b = e.target.closest('.cmd-btn');
    if (b && b.dataset.skill) triggerSkill(b.dataset.skill);
  });
  $('inspector').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !G.sel) return;
    const act = b.dataset.act;
    if (act === 'upgrade') upgradeTower(G.sel, b.dataset.branch);
    else if (act === 'sell') sellTower(G.sel);
    else if (act === 'prio') { G.sel.prio = b.dataset.prio; G.uiDirty = true; Sfx.play('click'); }
  });
  $('overlay').addEventListener('click', e => {
    const card = e.target.closest('[data-perk]');
    if (card && G.drafting) { selectPerk(card.dataset.perk); return; }
    const b = e.target.closest('button'); if (!b) return;
    Sfx.init(); Sfx.resume();
    const a = b.dataset.ov;
    if (a === 'start' || a === 'again') { begin(); Sfx.play('click'); }
    else if (a === 'endless') { showOverlay(null); G.endless = true; G.state = 'prep'; G.prepT = 15; G.uiDirty = true; wcWave = -1; Sfx.play('click'); }
  });
  last = performance.now();
  requestAnimationFrame(frame);
}
init();

// Small debug/test hook (harmless in production)
window.__nb = { get G() { return G; }, begin, update, render, startWave, placeTower, upgradeTower, sellTower, callWave, endGame, buildSpawns, hpScale, TD, ED, refreshUI, triggerSkill, selectPerk, PERKS, COMMANDER_SKILLS, WAVE_MUTATORS, getTierData };
