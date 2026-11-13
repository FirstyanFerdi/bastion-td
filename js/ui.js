'use strict';
/* HUD, SVG icon set, shop dock, inspector, overlays */

/* ============================================================
   UI
   ============================================================ */

/* hand-drawn vector icon set (no emoji, no external assets) */
const ICONS = {
  shield: ['<path d="M12 3l7.5 3v5.2c0 4.6-3.1 8.2-7.5 9.8-4.4-1.6-7.5-5.2-7.5-9.8V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>', 0],
  coin: ['<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/>', 0],
  wave: ['<path d="M2.5 14.5c2.2 0 2.2-5 4.5-5s2.3 5 4.5 5 2.2-5 4.5-5 2.3 5 4.5 5"/><path d="M3 19h18"/>', 0],
  target: ['<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>', 0],
  flag: ['<path d="M6 21V3.5"/><path d="M6 4.5h12l-3 4 3 4H6"/>', 0],
  play: ['<path d="M7 4.5l12.5 7.5L7 19.5z"/>', 1],
  pause: ['<rect x="6" y="4.5" width="4.2" height="15"/><rect x="13.8" y="4.5" width="4.2" height="15"/>', 1],
  ff: ['<path d="M3.5 5l8.5 7-8.5 7zM12 5l8.5 7-8.5 7z"/>', 1],
  speaker: ['<path d="M4 9.5h3.8L13 5v14l-5.2-4.5H4z"/><path d="M16 9c1.5 1.5 1.5 4.5 0 6"/><path d="M18.6 6.4c3 3 3 8.2 0 11.2"/>', 0],
  muted: ['<path d="M4 9.5h3.8L13 5v14l-5.2-4.5H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>', 0],
  up: ['<path d="M12 20V5M5.5 11.5L12 5l6.5 6.5"/>', 0],
  arrow: ['<path d="M4 12h15M13 6l6 6-6 6"/>', 0],
  redo: ['<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', 0],
  inf: ['<path d="M12 12c-2-2.6-3.7-4-5.7-4a4 4 0 0 0 0 8c2 0 3.7-1.4 5.7-4s3.7-4 5.7-4a4 4 0 0 1 0 8c-2 0-3.7-1.4-5.7-4z"/>', 0],
  tag: ['<path d="M3.5 12.5L12 4h8v8l-8.5 8.5z"/><circle cx="16" cy="8" r="1.3"/>', 0]
};
function svg(n, cls) {
  const i = ICONS[n];
  return '<svg class="ico' + (i[1] ? ' f' : '') + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + i[0] + '</svg>';
}
const LOGO = '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5l11.5 6.5v14L16 29.5 4.5 23V9z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 20.5l6-8.5 6 8.5" fill="none" stroke="#e2a72e" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const hud = {};
function setHTML(id, html) { const k = 'h:' + id; if (hud[k] !== html) { hud[k] = html; $(id).innerHTML = html; } }
function setText(id, v) { if (hud[id] !== v) { hud[id] = v; $(id).textContent = v; return true; } return false; }
function setCls(id, cls, on) { const k = id + '.' + cls; if (hud[k] !== on) { hud[k] = on; $(id).classList.toggle(cls, on); } }

function statRows(type, i, branch) {
  const def = TD[type];
  const s = branch && def.branches[branch] ? def.branches[branch] : (def.tiers[i] || def.tiers[0]);
  const f1 = v => String(Math.round(v * 10) / 10);
  switch (type) {
    case 'gatling': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + (s.maxRate ? '-' + f1(s.maxRate) : '') + '/s'], ['RANGE', f1(s.range) + ' t'], ['ROLE', s.role || 'Physical DPS']];
    case 'plasma': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['SPLASH', f1(s.splash) + ' t'], ['SHRED', Math.round(s.shred * 100) + '%/hit']];
    case 'cryo': return [['SLOW', Math.round(s.slow * 100) + '%'], ['BRITTLE', '+' + Math.round(s.brittle * 100) + '% dmg'], ['RANGE', f1(s.range) + ' t'], ['ROLE', s.role || 'Freeze / Control']];
    case 'tesla': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['CHAIN', s.targets + ' targets'], ['SHIELD DMG', '×' + s.sm]];
    default: return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['CRIT', Math.round(s.crit * 100) + '% ×' + s.cm], ['PIERCE', s.pierce + ' units']];
  }
}
function buildDock() {
  const dock = $('dock'); dock.innerHTML = '';
  TKEYS.forEach(k => {
    const d = TD[k], el = document.createElement('div');
    el.className = 'shop'; el.dataset.type = k; el.style.setProperty('--tc', d.color);
    const s = d.tiers[0];
    const stats = statRows(k, 0).slice(0, 4).map(r => '<span><em>' + r[0] + '</em> ' + r[1] + '</span>').join('');
    el.innerHTML = '<span class="key">' + d.key + '</span><canvas width="56" height="56"></canvas><div class="meta"><div class="nm">' + d.name + '</div><div class="cost"><i class="coin"></i>' + d.cost + '</div><div class="role">' + d.role + '</div></div>' +
      '<div class="tip"><b>' + d.name + '</b>' + d.tip + '<div class="st">' + stats + '</div></div>';
    dock.appendChild(el);
    const ic = el.querySelector('canvas').getContext('2d');
    ic.scale(1.0, 1.0);
    drawTowerSprite(ic, k, 0, { x: 28, y: 28, angle: -Math.PI / 4, spin: 0.6, charge: 1 }, 1);
  });
}
function selectShop(type) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
  if (G.placing === type) { G.placing = null; Sfx.play('click'); return; }
  G.placing = type; G.sel = null; G.casting = null; G.uiDirty = true; Sfx.play('click');
  if (G.gold < TD[type].cost) {
    const el = document.querySelector('.shop[data-type="' + type + '"]');
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }
}
function renderInspector() {
  const box = $('inspector');
  const t = G.sel;
  if (!t) {
    if (G.placing) {
      const d = TD[G.placing];
      box.innerHTML = '<h3>PLACING</h3><div class="insp-name"><div><h4 style="color:' + d.color + '">' + d.name + '</h4><small>' + d.role.toUpperCase() + '</small></div></div>' +
        statRows(G.placing, 0).map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('') +
        '<div class="note">Click a free tile to build (hold Shift to keep building). Esc / right-click cancels.</div>';
      return;
    }
    box.innerHTML = '<h3>TACTICAL INSPECTOR</h3><div class="legend">' +
      '<div>Select a tower on the grid to upgrade, specialize or change its <b>targeting priority</b>.</div>' +
      '<div><span class="kbd">1</span>-<span class="kbd">5</span> build &nbsp; <span class="kbd">Q</span>/<span class="kbd">W</span>/<span class="kbd">E</span> commander powers</div>' +
      '<div><span class="kbd">U</span> upgrade &nbsp; <span class="kbd">X</span> sell &nbsp; <span class="kbd">Space</span> wave / pause</div>' +
      '<div><span class="kbd">P</span> pause &nbsp; <span class="kbd">F</span> speed &nbsp; <span class="kbd">M</span> mute</div>' +
      '<div style="margin-top:6px"><b>Synergies:</b> Plasma shreds armor → Gatling &amp; Rail hit Brutes harder. Cryo makes everything hit +20% harder. Tesla melts shields.</div></div>';
    return;
  }
  const def = TD[t.type], tier = t.tier;
  const cur = statRows(t.type, tier, t.branch);
  const rows = cur.map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('');
  const sell = Math.floor(t.invested * 0.75);
  const isCryo = t.type === 'cryo';
  const tierTitle = t.tier === 0 ? 'TIER I' : (t.tier === 1 ? 'TIER II' : 'SPEC: ' + (t.branch ? def.branches[t.branch].name.toUpperCase() : 'TIER III'));

  let upgHtml = '';
  if (t.tier === 0) {
    const cost = def.tiers[1].upg;
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" data-act="upgrade" data-cost="' + cost + '">' + svg('up') + 'Upgrade Tier II <i class="coin"></i>' + cost + '</button>';
  } else if (t.tier === 1) {
    const bA = def.branches.A, bB = def.branches.B;
    upgHtml = '<div class="branch-grid">' +
      '<button class="branch-btn" tabindex="-1" data-act="upgrade" data-branch="A" data-cost="' + bA.upg + '" style="--bc:' + bA.color + '"><div class="bh">' + bA.name + '</div><div class="br">' + bA.role + '</div><div class="bc"><i class="coin"></i>' + bA.upg + '</div></button>' +
      '<button class="branch-btn" tabindex="-1" data-act="upgrade" data-branch="B" data-cost="' + bB.upg + '" style="--bc:' + bB.color + '"><div class="bh">' + bB.name + '</div><div class="br">' + bB.role + '</div><div class="bc"><i class="coin"></i>' + bB.upg + '</div></button>' +
      '</div>';
  } else {
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" disabled>MAX SPECIALIZATION</button>';
  }

  box.innerHTML = '<h3>SELECTED TOWER</h3>' +
    '<div class="insp-name"><canvas id="inspIcon" width="56" height="56"></canvas><div><h4 style="color:' + (t.branch ? def.branches[t.branch].color : def.color) + '">' + (t.branch ? def.branches[t.branch].name : def.name) + '</h4><small>' + tierTitle + ' / ' + t.kills + ' KILLS</small></div></div>' +
    rows +
    '<div class="prio' + (isCryo ? ' off' : '') + '" id="prioBox">' + PRIOS.map(p => '<button tabindex="-1" data-act="prio" data-prio="' + p[0] + '" class="' + (t.prio === p[0] ? 'on' : '') + '">' + p[1] + '</button>').join('') + '</div>' +
    (isCryo ? '<div class="note" style="margin-top:-4px;margin-bottom:6px">Cryo pulses hit every enemy in range, no targeting needed.</div>' : '') +
    '<div class="acts" style="' + (t.tier === 1 ? 'grid-template-columns:1fr;' : '') + '">' + upgHtml +
    '<button class="sell" tabindex="-1" data-act="sell">' + svg('tag') + 'Sell <i class="coin"></i>' + sell + '</button></div>' +
    '<div class="note">Sell refunds 75% of everything invested.</div>';
  const ic = $('inspIcon').getContext('2d');
  drawTowerSprite(ic, t.type, t.tier, { x: 28, y: 28, angle: -Math.PI / 4, spin: 0.6, charge: 1, branch: t.branch }, 1);
  if (t.tier === 0 && $('btnUpg')) $('btnUpg').disabled = G.gold < def.tiers[1].upg;
  if (t.tier === 1) {
    document.querySelectorAll('.branch-btn').forEach(b => {
      b.disabled = G.gold < Number(b.dataset.cost);
    });
  }
}
let wcWave = -1, wcDone = false;
function renderWaveCard() {
  const n = G.wave + 1;
  if (n !== wcWave) {
    wcWave = n;
    const ev = buildSpawns(n), cnt = {};
    ev.forEach(x => cnt[x.type] = (cnt[x.type] || 0) + 1);
    $('wcNum').textContent = String(n);
    $('wcBadges').innerHTML = ['scout', 'swarm', 'brute', 'healer', 'stealth', 'carrier', 'breacher', 'boss'].filter(k => cnt[k]).map(k =>
      '<div class="badge' + (k === 'boss' ? ' boss' : '') + '" title="' + ED[k].name + '"><img src="' + enemyIcons[k] + '" alt="' + ED[k].name + '">×' + cnt[k] + '</div>').join('');
    const tags = [];
    if (n % 5 === 0) tags.push('<span class="tag red">BOSS WAVE</span>');
    if (G.endless && n > WIN_WAVE) tags.push('<span class="tag">ENDLESS</span>');
    if (n >= 8) tags.push('<span class="tag cy">SHIELDED UNITS</span>');
    if (cnt.stealth) tags.push('<span class="tag cy">STEALTH</span>');
    if (cnt.carrier) tags.push('<span class="tag purple">SHIELD CARRIER</span>');
    if (cnt.breacher) tags.push('<span class="tag orange">EMP BREACHER</span>');
    if (cnt.healer) tags.push('<span class="tag gr">HEALERS</span>');
    if (cnt.swarm) tags.push('<span class="tag red">SWARM RUSH</span>');
    if (cnt.brute) tags.push('<span class="tag">ARMORED</span>');
    if (G.mutator) tags.push('<span class="tag ' + G.mutator.cls + '">MUTATOR: ' + G.mutator.name.toUpperCase() + '</span>');
    $('wcTags').innerHTML = tags.join('');
  }
  const btn = $('btnCall');
  let label, dis = !canCall();
  if (G.wave >= WIN_WAVE && !G.endless) label = 'Final wave in progress';
  else if (G.state === 'prep') {
    const b = earlyBonus();
    label = G.wave === 0 ? svg('play') + 'Start wave 1' : svg('play') + 'Call wave ' + n + ' now (+' + b + ' gold) / ' + Math.ceil(G.prepT) + 's';
  } else if (G.state === 'active') label = svg('ff') + 'Call wave ' + n + ' early (+' + earlyBonus() + ' gold)';
  else label = 'Standby';
  if (hud.call !== label) { hud.call = label; btn.innerHTML = label; }
  if (btn.disabled !== dis) btn.disabled = dis;
}

function renderSkillsAndPerks() {
  const skBox = $('cmdSkills'), pkBox = $('perkTray');
  if (!skBox || !pkBox || !G) return;
  // Commander skills
  const skillsHtml = Object.keys(COMMANDER_SKILLS).map(k => {
    const sk = COMMANDER_SKILLS[k], state = G.skills[k] || { cd: 0 };
    const onCd = state.cd > 0, isActive = G.casting === k;
    const cdRatio = onCd ? clamp(state.cd / sk.cd, 0, 1) : 0;
    return '<button class="cmd-btn' + (isActive ? ' active' : '') + '" data-skill="' + k + '" tabindex="-1" title="' + sk.desc + '" ' + (onCd ? 'disabled' : '') + '>' +
      '<span class="cmd-key">' + sk.key + '</span>' +
      svg(sk.icon) + '<span>' + sk.name + '</span>' +
      (onCd ? '<div class="cmd-cooldown"><div class="cmd-cd-fill" style="width:' + Math.round(cdRatio * 100) + '%"></div><span>' + Math.ceil(state.cd) + 's</span></div>' : '') +
      '</button>';
  }).join('');
  if (hud.skills !== skillsHtml) { hud.skills = skillsHtml; skBox.innerHTML = skillsHtml; }

  // Active perks
  const perksHtml = G.perks.map(id => {
    const p = PERKS[id];
    return '<span class="perk-pill" title="' + p.desc + '"><b>' + p.tag + '</b> ' + p.name + '</span>';
  }).join('');
  if (hud.perks !== perksHtml) { hud.perks = perksHtml; pkBox.innerHTML = perksHtml; }
}

function refreshUI() {
  if (setText('vLives', String(G.lives))) { }
  setCls('chipLives', 'warn', G.lives <= 6);
  if (setText('vGold', String(Math.floor(G.gold)))) { const ch = $('chipGold'); ch.classList.add('bump'); setTimeout(() => ch.classList.remove('bump'), 160); }
  setText('vWave', G.wave + (G.endless ? ' / ENDLESS' : ' / ' + WIN_WAVE));
  setText('vScore', String(G.score));
  setText('vBestScore', 'best ' + Math.max(SAVE.bestScore, G.score));
  setText('vBestWave', String(Math.max(SAVE.bestWave, G.wave)));
  setHTML('btnPause', G.paused ? svg('play') : svg('pause'));
  $('btnPause').classList.toggle('on', G.paused);
  setHTML('btnMute', Sfx.muted ? svg('muted') : svg('speaker')); $('btnMute').classList.toggle('on', Sfx.muted);
  document.querySelectorAll('#speedSeg button').forEach(b => b.classList.toggle('on', Number(b.dataset.speed) === G.speed));
  document.querySelectorAll('.shop').forEach(el => {
    const k = el.dataset.type;
    el.classList.toggle('poor', G.gold < TD[k].cost);
    el.classList.toggle('sel', G.placing === k);
  });
  if (G.uiDirty) { G.uiDirty = false; renderInspector(); }
  else if (G.sel) {
    const u = $('btnUpg');
    if (u && G.sel.tier === 0) u.disabled = G.gold < TD[G.sel.type].tiers[1].upg;
    if (G.sel.tier === 1) {
      document.querySelectorAll('.branch-btn').forEach(b => {
        b.disabled = G.gold < Number(b.dataset.cost);
      });
    }
  }
  renderWaveCard();
  renderSkillsAndPerks();
}

/* overlay */
function showOverlay(kind) {
  const ov = $('overlay');
  if (!kind) { ov.classList.remove('show'); ov.innerHTML = ''; return; }
  let h = '';
  if (kind === 'menu') {
    h = '<div class="ov-box"><h1>' + LOGO + 'BASTION</h1><div class="sub">Hold the grid. Survive 20 waves, then push into Endless Mode.</div>' +
      '<div class="how"><div><kbd>1</kbd>-<kbd>5</kbd> select tower</div><div><kbd>Q</kbd>/<kbd>W</kbd>/<kbd>E</kbd> commander powers</div><div><kbd>Space</kbd> call wave / pause</div><div><kbd>Click</kbd> build / inspect</div><div><kbd>Esc</kbd> cancel / deselect</div><div><kbd>U</kbd> upgrade / <kbd>X</kbd> sell</div><div><kbd>P</kbd> pause / <kbd>F</kbd> speed / <kbd>M</kbd> mute</div></div>' +
      '<div class="ov-stats"><div><label>BEST WAVE</label><b>' + SAVE.bestWave + '</b></div><div><label>HIGH SCORE</label><b>' + SAVE.bestScore + '</b></div></div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="start" tabindex="-1">' + svg('play') + 'Deploy</button></div></div>';
  } else if (kind === 'draft' && G.drafting) {
    const cards = G.drafting.cards.map(id => {
      const p = PERKS[id];
      return '<div class="draft-card" data-ov="perk" data-perk="' + id + '">' +
        '<span class="draft-tag">' + p.tag + '</span>' +
        '<div class="draft-name">' + p.name + '</div>' +
        '<div class="draft-desc">' + p.desc + '</div>' +
        '<button class="draft-btn" tabindex="-1">Requisition Module</button>' +
        '</div>';
    }).join('');
    h = '<div class="draft-box"><h2>' + svg('tag') + ' TACTICAL TECH REQUISITION</h2><div class="sub">Boss eliminated. Choose 1 experimental technology to reinforce your perimeter defenses.</div>' +
      '<div class="draft-grid">' + cards + '</div></div>';
  } else if (kind === 'over') {
    h = '<div class="ov-box"><h2 style="color:#fb7185">BASE OVERRUN</h2><div class="sub">The Bastion has fallen. Regroup and try a new layout.</div>' +
      '<div class="ov-stats"><div><label>WAVE REACHED</label><b>' + G.wave + '</b></div><div><label>SCORE</label><b>' + G.score + '</b></div><div><label>BEST SCORE</label><b>' + SAVE.bestScore + '</b></div><div><label>KILLS</label><b>' + G.kills + '</b></div></div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="again" tabindex="-1">' + svg('redo') + 'Play again</button></div></div>';
  } else if (kind === 'win') {
    h = '<div class="ov-box"><h2 style="color:#6ee7b7">BASTION HELD!</h2><div class="sub">All 20 waves destroyed. The grid is safe, for now.</div>' +
      '<div class="ov-stats"><div><label>SCORE</label><b>' + G.score + '</b></div><div><label>BEST SCORE</label><b>' + SAVE.bestScore + '</b></div><div><label>LIVES LEFT</label><b>' + G.lives + '</b></div><div><label>KILLS</label><b>' + G.kills + '</b></div></div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="endless" tabindex="-1">' + svg('inf') + 'Endless mode</button><button class="ghost" data-ov="again" tabindex="-1">New Game</button></div></div>';
  }
  ov.innerHTML = h; ov.classList.add('show');
}
