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
  tag: ['<path d="M3.5 12.5L12 4h8v8l-8.5 8.5z"/><circle cx="16" cy="8" r="1.3"/>', 0],
  wrench: ['<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>', 0],
  spark: ['<path d="M12 2.5L14.5 9.5L21.5 12L14.5 14.5L12 21.5L9.5 14.5L2.5 12L9.5 9.5z"/>', 1],
  bolt: ['<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>', 1]
};
function svg(n, cls) {
  const i = ICONS[n] || ['<circle cx="12" cy="12" r="6"/>', 0];
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
    case 'gatling': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + (s.maxRate ? '-' + f1(s.maxRate) : '') + '/s'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 2) + ' MW']];
    case 'plasma': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 5) + ' MW']];
    case 'cryo': return [['SLOW', Math.round(s.slow * 100) + '%'], ['BRITTLE', '+' + Math.round(s.brittle * 100) + '% dmg'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 4) + ' MW']];
    case 'tesla': return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 6) + ' MW']];
    case 'relay': return [['SUPPLY', '+' + (s.powerSupply || 25) + ' MW'], ['RANGE', f1(s.range) + ' t'], ['OVERDRIVE', s.overdriveBoost ? '+100% Rate' : '+75% Rate'], ['ROLE', 'Power Grid']];
    case 'fusion_hellfire': return [['DMG', s.dmg + ' × 2'], ['RATE', f1(s.rate) + '/s'], ['SPLASH', f1(s.splash) + ' t'], ['MAGMA', s.magmaDps + ' DPS (' + s.magmaDur + 's)']];
    case 'fusion_deathray': return [['DMG', String(s.dmg)], ['PIERCE', 'Screen-Wide'], ['CHAIN', s.chainDmg + ' (' + s.chains + 'x)'], ['STUN', s.stun + 's EMP']];
    case 'fusion_zero': return [['SUPPLY', '+' + (s.powerSupply || 50) + ' MW'], ['SLOW', Math.round((s.slow || 0.65) * 100) + '% Blizzard'], ['STASIS', s.pulseFreeze + 's Freeze'], ['INTERVAL', 'Every ' + s.pulseInterval + 's']];
    case 'fusion_antimatter': return [['DMG', String(s.dmg)], ['EXECUTE', '<25% HP'], ['VORTEX', f1(s.pullRadius) + ' t Gravity'], ['RATE', f1(s.rate) + '/s']];
    default: return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 8) + ' MW']];
  }
}
function drawMegastructureDockIcon(ic, mk, md) {
  if (!ic) return;
  ic.clearRect(0, 0, 48, 48);
  const col = (md && md.color) ? md.color : '#f59e0b';
  ic.fillStyle = '#090e17';
  ic.fillRect(4, 4, 40, 40);
  ic.strokeStyle = col;
  ic.lineWidth = 2;
  ic.strokeRect(4, 4, 40, 40);
  ic.fillStyle = col;
  ic.fillRect(5, 5, 5, 5);
  ic.fillRect(38, 5, 5, 5);
  ic.fillRect(5, 38, 5, 5);
  ic.fillRect(38, 38, 5, 5);

  if (mk === 'ion_uplink') {
    ic.strokeStyle = '#38bdf8';
    ic.lineWidth = 1.8;
    ic.beginPath();
    ic.arc(24, 24, 11, 0, Math.PI * 2);
    ic.stroke();
    ic.fillStyle = '#bae6fd';
    ic.beginPath();
    ic.arc(24, 24, 4.5, 0, Math.PI * 2);
    ic.fill();
    ic.strokeStyle = 'rgba(56,189,248,0.7)';
    ic.lineWidth = 1.2;
    ic.beginPath();
    ic.moveTo(24, 8); ic.lineTo(24, 40);
    ic.moveTo(8, 24); ic.lineTo(40, 24);
    ic.stroke();
  } else if (mk === 'drone_carrier') {
    ic.fillStyle = '#064e3b';
    ic.fillRect(12, 14, 24, 20);
    ic.strokeStyle = '#10b981';
    ic.lineWidth = 1.5;
    ic.strokeRect(12, 14, 24, 20);
    ic.strokeStyle = '#34d399';
    ic.lineWidth = 1.5;
    ic.beginPath();
    ic.moveTo(24, 16); ic.lineTo(24, 22);
    ic.moveTo(24, 26); ic.lineTo(24, 32);
    ic.stroke();
    ic.fillStyle = '#a7f3d0';
    ic.beginPath();
    ic.arc(17, 24, 2.5, 0, Math.PI * 2);
    ic.arc(31, 24, 2.5, 0, Math.PI * 2);
    ic.fill();
  } else if (mk === 'tectonic_siphon') {
    ic.strokeStyle = '#f59e0b';
    ic.lineWidth = 1.6;
    ic.beginPath();
    ic.arc(24, 24, 13, 0, Math.PI * 2);
    ic.stroke();
    ic.beginPath();
    ic.arc(24, 24, 7, 0, Math.PI * 2);
    ic.stroke();
    ic.fillStyle = '#fbbf24';
    ic.beginPath();
    ic.moveTo(24, 15); ic.lineTo(29, 31); ic.lineTo(19, 31);
    ic.closePath();
    ic.fill();
  } else {
    ic.strokeStyle = '#fff';
    ic.lineWidth = 1.6;
    ic.beginPath();
    ic.arc(24, 24, 10, 0, Math.PI * 2);
    ic.stroke();
    ic.fillStyle = col;
    ic.beginPath();
    ic.arc(24, 24, 5, 0, Math.PI * 2);
    ic.fill();
  }
}

function drawBarricadeDockIcon(ic) {
  if (!ic) return;
  ic.clearRect(0, 0, 48, 48);
  ic.fillStyle = '#090e17';
  ic.fillRect(4, 4, 40, 40);
  ic.strokeStyle = '#38bdf8';
  ic.lineWidth = 2;
  ic.strokeRect(4, 4, 40, 40);
  ic.fillStyle = '#1e293b';
  ic.fillRect(10, 16, 28, 16);
  ic.strokeStyle = '#f59e0b';
  ic.lineWidth = 1.5;
  ic.strokeRect(10, 16, 28, 16);
  ic.strokeStyle = '#fbbf24';
  ic.lineWidth = 1.8;
  ic.beginPath();
  ic.moveTo(14, 18); ic.lineTo(19, 30);
  ic.moveTo(21, 18); ic.lineTo(26, 30);
  ic.moveTo(28, 18); ic.lineTo(33, 30);
  ic.stroke();
  ic.fillStyle = '#38bdf8';
  ic.fillRect(20, 8, 8, 5);
}

function buildDock() {
  const dock = $('dock'); dock.innerHTML = '';
  TKEYS.forEach((k, idx) => {
    const d = TD[k], el = document.createElement('div');
    el.className = 'shop'; el.dataset.type = k; el.style.setProperty('--tc', d.color);
    const s = d.tiers[0];
    const cost = typeof getTowerCost === 'function' ? getTowerCost(k) : d.cost;
    const stats = statRows(k, 0).slice(0, 4).map(r => '<span><em>' + r[0] + '</em> ' + r[1] + '</span>').join('');
    el.innerHTML = '<span class="key">' + (idx + 1) + '</span><canvas width="48" height="48"></canvas><div class="meta"><div class="nm">' + d.name + '</div><div class="cost"><i class="coin"></i>' + cost + '</div><div class="role">' + d.role + '</div></div>' +
      '<div class="tip"><b>' + d.name + '</b>' + d.tip + '<div class="st">' + stats + '</div></div>';
    dock.appendChild(el);
    const ic = el.querySelector('canvas').getContext('2d');
    ic.scale(1.0, 1.0);
    drawTowerSprite(ic, k, 0, { x: 24, y: 24, angle: -Math.PI / 4, spin: 0.6, charge: 1 }, 0.9);
  });

  // 8.0 Megastructure Dock Facilities
  if (typeof MEGASTRUCTURE_CONFIG !== 'undefined') {
    Object.keys(MEGASTRUCTURE_CONFIG).forEach(mk => {
      const md = MEGASTRUCTURE_CONFIG[mk];
      const el = document.createElement('div');
      el.className = 'shop megastructure-shop';
      el.dataset.megaType = mk;
      el.style.setProperty('--tc', md.color);
      el.style.borderTop = '2px solid ' + md.color;
      const dispName = md.shortName || (md.name.split(' ')[0] + ' ' + (md.name.split(' ')[1] || ''));
      el.innerHTML = '<span class="key" style="background:' + md.color + ';color:#0f172a">2x2</span><canvas width="48" height="48"></canvas><div class="meta"><div class="nm" style="color:' + md.color + '">' + dispName + '</div><div class="cost"><i class="coin"></i>' + md.cost + '</div><div class="role">' + md.role + '</div></div>' +
        '<div class="tip"><b style="color:' + md.color + '">★ MEGASTRUCTURE (2x2): ' + md.name + '</b>' + md.desc + '<div class="st"><span><em>POWER</em> -' + md.power + ' MW</span><span><em>LIFESPAN</em> ' + (md.maxDurability || 3) + ' WAVES</span></div></div>';
      dock.appendChild(el);
      const ic = el.querySelector('canvas').getContext('2d');
      drawMegastructureDockIcon(ic, mk, md);
    });
  }

  // 9.0 Deployable Road Barricade Facility
  const barEl = document.createElement('div');
  barEl.className = 'shop deployable-shop';
  barEl.dataset.deployType = 'barricade';
  barEl.style.setProperty('--tc', '#38bdf8');
  barEl.style.borderTop = '2px solid #38bdf8';
  barEl.innerHTML = '<span class="key" style="background:#38bdf8;color:#0f172a">B</span><canvas width="48" height="48"></canvas><div class="meta"><div class="nm" style="color:#38bdf8">Barricade</div><div class="cost"><i class="coin"></i>40</div><div class="role">Road Block</div></div>' +
    '<div class="tip"><b style="color:#38bdf8">★ DEPLOYABLE BARRICADE (400 HP)</b>Deploy a heavy barricade on any road tile for 40 Gold. Stops hostiles and absorbs enemy attacks!</div>';
  dock.appendChild(barEl);
  const barIc = barEl.querySelector('canvas').getContext('2d');
  drawBarricadeDockIcon(barIc);
}
function selectShop(type) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
  if (G.placing === type) { G.placing = null; Sfx.play('click'); return; }
  G.placing = type; G.placingMegastructure = null; G.sel = null; G.casting = null; G.uiDirty = true; Sfx.play('click');
  const cost = typeof getTowerCost === 'function' ? getTowerCost(type) : TD[type].cost;
  if (G.gold < cost) {
    const el = document.querySelector('.shop[data-type="' + type + '"]');
    if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  }
}
function selectMegaShop(type) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
  if (G.placingMegastructure === type) { G.placingMegastructure = null; Sfx.play('click'); return; }
  G.placingMegastructure = type; G.placing = null; G.sel = null; G.casting = null; G.uiDirty = true; Sfx.play('click');
}
function renderInspector() {
  const box = $('inspector');
  const t = G.sel;
  if (!t) {
    if (G.placingBarricade) {
      const bCost = typeof DESTRUCTIBLE_TERRAIN_CONFIG !== 'undefined' ? DESTRUCTIBLE_TERRAIN_CONFIG.barricadeCost : 40;
      box.innerHTML = '<h3>DEPLOYING DEFENSE</h3>' +
        '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:#38bdf8">Road Barricade</h4><small>FORTIFICATION · <i class="coin"></i>' + bCost + '</small></div></div>' +
        '<div class="stats-grid">' +
        '<div class="srow"><span>HP</span><span class="sv">400 HP</span></div>' +
        '<div class="srow"><span>ARMOR</span><span class="sv">Heavy Alloy</span></div>' +
        '<div class="srow"><span>BLOCK</span><span class="sv">Full Path</span></div>' +
        '<div class="srow"><span>POWER</span><span class="sv">0 MW</span></div>' +
        '</div>' +
        '<div class="note">Click any road tile to deploy heavy barricade. Blocks enemy movement and absorbs attacks. Esc / Right-Click to cancel.</div>';
      const ic = $('inspIcon');
      if (ic) drawBarricadeDockIcon(ic.getContext('2d'));
      return;
    }
    if (G.placingMegastructure && typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[G.placingMegastructure]) {
      const mk = G.placingMegastructure;
      const d = MEGASTRUCTURE_CONFIG[mk];
      let stat1 = ['DMG', '420 DPS'], stat2 = ['RATE', 'Continuous'], stat3 = ['BEAM', '65 px'], stat4 = ['POWER', '-' + d.power + ' MW'];
      if (mk === 'drone_carrier') {
        stat1 = ['INTERCEPT', '4 Drones']; stat2 = ['REPAIR', '2 Drones'];
        stat3 = ['DMG', '28 x 2.2/s']; stat4 = ['POWER', '-' + d.power + ' MW'];
      } else if (mk === 'tectonic_siphon') {
        stat1 = ['DMG', '250 Quake']; stat2 = ['PULSE', 'Every 3.0s'];
        stat3 = ['RADIUS', '180 px']; stat4 = ['POWER', '-' + d.power + ' MW'];
      }
      box.innerHTML = '<h3>DEPLOYING DEFENSE</h3>' +
        '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:' + d.color + '">' + d.name + '</h4><small>MEGASTRUCTURE (2x2) · <i class="coin"></i>' + d.cost + ' · -' + d.power + ' MW · ' + (d.maxDurability || 3) + ' WAVES</small></div></div>' +
        '<div class="stats-grid">' +
        '<div class="srow"><span>' + stat1[0] + '</span><span class="sv">' + stat1[1] + '</span></div>' +
        '<div class="srow"><span>' + stat2[0] + '</span><span class="sv">' + stat2[1] + '</span></div>' +
        '<div class="srow"><span>' + stat3[0] + '</span><span class="sv">' + stat3[1] + '</span></div>' +
        '<div class="srow"><span>' + stat4[0] + '</span><span class="sv">' + stat4[1] + '</span></div>' +
        '</div>' +
        '<div class="note" style="border-left:3px solid ' + d.color + ';background:' + d.color + '15;color:#f8fafc;margin:6px 0">' + d.desc + '</div>' +
        '<div class="note">Requires a free 2x2 grid sector. Click valid ground to construct. Esc / Right-Click to cancel.</div>';
      const ic = $('inspIcon');
      if (ic) drawMegastructureDockIcon(ic.getContext('2d'), mk, d);
      return;
    }
    if (G.placing) {
      const d = TD[G.placing];
      const cost = typeof getTowerCost === 'function' ? getTowerCost(G.placing) : d.cost;
      box.innerHTML = '<h3>DEPLOYING DEFENSE</h3><div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:' + d.color + '">' + d.name + '</h4><small>' + d.role.toUpperCase() + ' · <i class="coin"></i>' + cost + '</small></div></div>' +
        '<div class="stats-grid">' + statRows(G.placing, 0).map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('') + '</div>' +
        '<div class="note">Click a free grid tile to construct (hold Shift for repeat placement). Esc / Right-Click to cancel.</div>';
      const ic = $('inspIcon');
      if (ic) {
        const c2 = ic.getContext('2d');
        c2.clearRect(0, 0, 48, 48);
        drawTowerSprite(c2, G.placing, 0, { x: 24, y: 24, angle: -Math.PI / 4, spin: 0.6, charge: 1 }, 0.9);
      }
      return;
    }
    const rxList = Object.values(ELEMENTAL_REACTIONS).map(rx =>
      '<div style="background:#0b1118;border-left:3px solid ' + rx.color + ';padding:3px 6px;border-radius:2px">' +
      '<div style="font-weight:800;color:' + rx.color + ';font-size:10px">' + rx.name.toUpperCase() + ' <span style="color:#64748b;font-weight:400">(' + rx.combo + ')</span></div>' +
      '<div style="font-size:9.5px;color:#94a3b8;line-height:1.2;margin-top:1px">' + rx.desc + '</div>' +
      '</div>'
    ).join('');

    const lnList = (typeof LEYLINE_NODES !== 'undefined' ? Object.values(LEYLINE_NODES) : []).map(ln =>
      '<div style="background:#0b1118;border-left:3px solid ' + ln.color + ';padding:3px 6px;border-radius:2px">' +
      '<div style="font-weight:800;color:' + ln.color + ';font-size:10px">' + ln.name.toUpperCase() + '</div>' +
      '<div style="font-size:9.5px;color:#94a3b8;line-height:1.2;margin-top:1px">' + ln.tip + '</div>' +
      '</div>'
    ).join('');

    box.innerHTML = '<h3>TACTICAL INSPECTOR</h3>' +
      '<div class="legend">' +
      '<div style="font-size:10.5px;color:#cbd5e1;margin-bottom:4px">Select any constructed tower to manage upgrades, modular chips, and target priority.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:10px;color:#94a3b8;background:#090d12;padding:5px 7px;border-radius:3px;border:1px solid #1e293b">' +
      '<div><span class="kbd">1</span>-<span class="kbd">6</span> Build Tower</div><div><kbd>Q/W/E/R</kbd> Powers</div>' +
      '<div><span class="kbd">U</span> Upgrade / <span class="kbd">X</span> Sell</div><div><kbd>Space</kbd> Wave/Pause</div>' +
      '</div>' +
      '<div style="margin-top:6px;font-size:9.5px;font-weight:800;color:#f8fafc;letter-spacing:0.4px">ELEMENTAL REACTIONS</div>' +
      '<div style="display:flex;flex-direction:column;gap:3px">' + rxList + '</div>' +
      '<div style="margin-top:6px;font-size:9.5px;font-weight:800;color:#f8fafc;letter-spacing:0.4px">LEYLINE CONDUIT NODES</div>' +
      '<div style="display:flex;flex-direction:column;gap:3px">' + lnList + '</div>' +
      '</div>';
    return;
  }

  // 9.0 Deployable Road Barricade Inspector
  if (t && t.maxHp && t.c !== undefined && t.roadC === undefined && (!t.type || (t.id && t.id.startsWith('barricade')))) {
    const bar = t;
    const pct = Math.round((bar.hp / bar.maxHp) * 100);
    const barColor = pct > 60 ? '#38bdf8' : (pct > 25 ? '#f59e0b' : '#ef4444');
    const canRepair = bar.hp < bar.maxHp;
    const repBtn = canRepair ?
      '<button class="primary" data-act="repair_barricade" style="width:100%">' + svg('up') + 'Repair +150 <i class="coin"></i>15</button>' :
      '<button class="primary" disabled style="width:100%;opacity:0.6">MAX INTEGRITY</button>';
    const salvageBtn = '<button class="sell" tabindex="-1" data-act="dismantle_barricade">' + svg('tag') + 'Salvage <i class="coin"></i>25</button>';

    box.innerHTML = '<h3>SELECTED DEFENSE</h3>' +
      '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:#38bdf8">Road Barricade</h4><small>FORTIFICATION · ' + bar.hp + ' / ' + bar.maxHp + ' HP</small></div></div>' +
      '<div style="margin:5px 0;padding:5px 8px;background:rgba(15,23,42,0.6);border:1px solid rgba(56,189,248,0.25);border-radius:3px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;margin-bottom:3px">' +
      '<span style="color:#94a3b8">STRUCTURAL INTEGRITY</span>' +
      '<span style="color:' + barColor + '">' + bar.hp + ' / ' + bar.maxHp + ' HP (' + pct + '%)</span>' +
      '</div>' +
      '<div style="width:100%;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">' +
      '<div style="width:' + pct + '%;height:100%;background:' + barColor + '"></div>' +
      '</div>' +
      '</div>' +
      '<div class="tower-actions">' + repBtn + salvageBtn + '</div>' +
      '<div class="stats-grid">' +
      '<div class="srow"><span>HP</span><span class="sv">' + bar.hp + ' / ' + bar.maxHp + '</span></div>' +
      '<div class="srow"><span>ARMOR</span><span class="sv">Heavy Alloy</span></div>' +
      '<div class="srow"><span>BLOCK</span><span class="sv">Full Path</span></div>' +
      '<div class="srow"><span>TILE</span><span class="sv">(' + bar.c + ',' + bar.r + ')</span></div>' +
      '</div>' +
      '<div class="prio off" id="prioBox"><button class="on">Block</button><button>Halt</button><button>Absorb</button><button>Fortify</button></div>' +
      '<div class="note" style="border-left:3px solid #38bdf8;background:rgba(56,189,248,0.08);color:#f8fafc;margin-top:6px">' +
      'Heavy alloy fortification. Blocks hostile pathing and absorbs enemy attacks to protect defensive lines.' +
      '</div>';

    const ic = $('inspIcon');
    if (ic) drawBarricadeDockIcon(ic.getContext('2d'));
    return;
  }

  // 8.0 Megastructure Inspector
  if (t && typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[t.type]) {
    const ms = t;
    const d = MEGASTRUCTURE_CONFIG[ms.type];
    const killCount = ms.kills || 0;
    const refund = Math.floor(d.cost * 0.7);
    const isOverclocked = (ms.overclockT || 0) > 0;
    const maxDur = ms.maxDurability || d.maxDurability || 3;
    const curDur = ms.durability !== undefined ? ms.durability : maxDur;
    const isBroken = ms.isBroken || curDur <= 0;
    const repCost = d.repairCost || Math.floor(d.cost * 0.35);

    let meterLabel = 'FACILITY POWER LOAD';
    let meterVal = '-' + d.power + ' MW (ONLINE)';
    let meterPct = 100;
    let meterColor = d.color;
    let stat1 = ['DMG', '420 DPS'], stat2 = ['RATE', 'Continuous'], stat3 = ['BEAM', '65 px'], stat4 = ['POWER', '-' + d.power + ' MW'];

    if (ms.type === 'drone_carrier') {
      meterLabel = 'CARRIER SQUADRON';
      meterVal = isBroken ? '0 DRONES (DOCKED)' : '6 DRONES ACTIVE';
      stat1 = ['INTERCEPT', '4 Drones']; stat2 = ['REPAIR', '2 Drones'];
      stat3 = ['DMG', '28 x 2.2/s']; stat4 = ['POWER', '-' + d.power + ' MW'];
    } else if (ms.type === 'tectonic_siphon') {
      meterLabel = 'MANTLE RESONANCE';
      meterVal = isBroken ? 'OFFLINE (SEIZED)' : ('-' + d.power + ' MW (ONLINE)');
      stat1 = ['DMG', '250 Quake']; stat2 = ['PULSE', 'Every 3.0s'];
      stat3 = ['RADIUS', '180 px']; stat4 = ['POWER', '-' + d.power + ' MW'];
    }

    if (isBroken) {
      meterLabel = 'FACILITY POWER LOAD';
      meterVal = '0 MW (MALFUNCTION - OFFLINE)';
      meterPct = 0;
      meterColor = '#ef4444';
    } else if (isOverclocked) {
      meterLabel = '★ OVERCLOCK BOOST';
      meterVal = Math.ceil(ms.overclockT) + 's (+50% SPD)';
      meterPct = Math.min(100, (ms.overclockT / 15) * 100);
      meterColor = '#f59e0b';
    }

    // Durability / Operational Lifespan bar
    const durPct = Math.max(0, Math.min(100, (curDur / maxDur) * 100));
    const durColor = isBroken ? '#ef4444' : curDur === 1 ? '#f97316' : curDur === 2 ? '#f59e0b' : '#10b981';
    const durStatus = isBroken ? '0 / ' + maxDur + ' WAVES (BROKEN)' : curDur + ' / ' + maxDur + ' WAVES REMAINING';

    let actionBtns = '';
    if (isBroken) {
      const canAfford = G.gold >= repCost;
      actionBtns = canAfford ?
        '<button class="primary" data-act="repair_mega" style="width:100%;background:#e11d48;color:#fff;font-weight:800;border:1px solid #fda4af">' + svg('wrench') + 'Repair Facility <i class="coin"></i>' + repCost + '</button>' :
        '<button class="primary" disabled style="width:100%;background:#334155;color:#94a3b8;font-weight:800">' + svg('wrench') + 'Repair Needs <i class="coin"></i>' + repCost + '</button>';
    } else {
      const ocPart = isOverclocked ?
        '<button class="primary" disabled style="width:100%;background:#059669;color:#fff;font-weight:800">★ OVERCLOCKED</button>' :
        '<button class="primary" data-act="overclock_mega" style="width:100%">' + svg('up') + 'Overclock <i class="coin"></i>40</button>';
      const repPart = (curDur < maxDur && G.gold >= repCost) ?
        '<button class="primary" data-act="repair_mega" style="width:100%;background:#0284c7;color:#fff;margin-top:4px">' + svg('wrench') + 'Overhaul <i class="coin"></i>' + repCost + '</button>' : '';
      actionBtns = ocPart + repPart;
    }
    const dismantleBtn = '<button class="sell" tabindex="-1" data-act="dismantle_mega">' + svg('tag') + 'Dismantle Facility <i class="coin"></i>' + refund + '</button>';

    const prioHtml = '<div class="prio" id="prioBox">' +
      PRIOS.map(p => '<button tabindex="-1" data-act="prio" data-prio="' + p[0] + '" class="' + ((ms.prio || 'first') === p[0] ? 'on' : '') + '">' + p[1] + '</button>').join('') +
      '</div>';

    const subtitleText = isBroken ?
      '<small style="color:#ef4444;font-weight:700">SELECTED MEGASTRUCTURE (2x2) · OFFLINE (NEEDS REPAIR)</small>' :
      '<small>SELECTED MEGASTRUCTURE (2x2) · ' + curDur + '/' + maxDur + ' WAVES · ' + killCount + ' KILLS</small>';

    box.innerHTML = '<h3>SELECTED DEFENSE</h3>' +
      '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:' + d.color + '">' + d.name + '</h4>' + subtitleText + '</div></div>' +
      '<div style="margin:4px 0;padding:4px 8px;background:rgba(15,23,42,0.7);border:1px solid ' + durColor + '50;border-radius:3px">' +
      '<div style="display:flex;justify-content:space-between;font-size:9.5px;font-weight:700;margin-bottom:2px">' +
      '<span style="color:#94a3b8">OPERATIONAL LIFESPAN</span>' +
      '<span style="color:' + durColor + '">' + durStatus + '</span>' +
      '</div>' +
      '<div style="width:100%;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">' +
      '<div style="width:' + durPct + '%;height:100%;background:' + durColor + '"></div>' +
      '</div>' +
      '</div>' +
      '<div style="margin:4px 0 5px;padding:4px 8px;background:rgba(15,23,42,0.6);border:1px solid ' + meterColor + '40;border-radius:3px">' +
      '<div style="display:flex;justify-content:space-between;font-size:9.5px;font-weight:700;margin-bottom:2px">' +
      '<span style="color:#94a3b8">' + meterLabel + '</span>' +
      '<span style="color:' + meterColor + '">' + meterVal + '</span>' +
      '</div>' +
      '<div style="width:100%;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">' +
      '<div style="width:' + meterPct + '%;height:100%;background:' + meterColor + '"></div>' +
      '</div>' +
      '</div>' +
      '<div class="tower-actions">' + actionBtns + dismantleBtn + '</div>' +
      '<div class="stats-grid">' +
      '<div class="srow"><span>' + stat1[0] + '</span><span class="sv">' + (isBroken ? '0 (OFFLINE)' : stat1[1]) + '</span></div>' +
      '<div class="srow"><span>' + stat2[0] + '</span><span class="sv">' + (isBroken ? 'DISABLED' : stat2[1]) + '</span></div>' +
      '<div class="srow"><span>' + stat3[0] + '</span><span class="sv">' + stat3[1] + '</span></div>' +
      '<div class="srow"><span>' + stat4[0] + '</span><span class="sv">' + (isBroken ? '0 MW' : stat4[1]) + '</span></div>' +
      '</div>' +
      prioHtml +
      '<div class="note" style="border-left:3px solid ' + (isBroken ? '#ef4444' : d.color) + ';background:' + (isBroken ? 'rgba(239,68,68,0.12)' : (d.color + '15')) + ';color:#f8fafc;margin-top:6px">' +
      (isBroken ? '⚠️ <b>FACILITY SEIZED:</b> Core mechanics fractured from operational wear. Pay repair cost to restore operational integrity.' : d.desc) +
      '</div>';

    const ic = $('inspIcon');
    if (ic) drawMegastructureDockIcon(ic.getContext('2d'), ms.type, d);
    return;
  }

  // 8.0 Colossal Multi-Part Titan Boss Inspector
  if (t && t.parts) {
    const b = t;
    const partsHtml = Object.keys(b.parts).map(pk => {
      const p = b.parts[pk];
      const conf = MULTI_PART_TITAN_CONFIG.parts[pk];
      const pct = Math.round((p.hp / p.maxHp) * 100);
      const isSel = b.activeTargetPart === pk;
      return '<div style="margin:4px 0;padding:5px;background:' + (p.broken ? '#1e1b2e' : '#0f172a') + ';border-left:3px solid ' + (p.broken ? '#64748b' : conf.color) + ';border-radius:2px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:10px;font-weight:800;color:' + (p.broken ? '#64748b' : conf.color) + '">' + conf.name.toUpperCase() + (p.broken ? ' (SEVERED)' : '') + '</span>' +
        (!p.broken ? '<button data-act="target_part" data-part="' + pk + '" style="font-size:8.5px;padding:2px 6px;background:' + (isSel ? conf.color : '#1e293b') + ';color:' + (isSel ? '#0f172a' : '#fff') + ';border:none;border-radius:2px;font-weight:800;cursor:pointer">' + (isSel ? 'TARGETING' : 'TARGET') + '</button>' : '') +
        '</div>' +
        '<div style="font-size:9px;color:#94a3b8;margin:2px 0">' + p.hp + ' / ' + p.maxHp + ' HP (' + pct + '%)</div>' +
        '<div style="width:100%;height:3px;background:#334155;border-radius:2px;overflow:hidden">' +
        '<div style="width:' + pct + '%;height:100%;background:' + (p.broken ? '#64748b' : conf.color) + '"></div>' +
        '</div>' +
        '</div>';
    }).join('');

    box.innerHTML = '<h3>ANATOMICAL TITAN TARGETING</h3>' +
      '<div class="insp-name"><div><h4 style="color:#f43f5e">COLOSSAL TITAN BOSS</h4><small>' + (b.staggerT > 0 ? '★ STAGGERED (PRESS [E] GRAPPLE)' : 'ACTIVE ANATOMY') + '</small></div></div>' +
      partsHtml +
      (b.staggerT > 0 ? '<button class="primary" data-act="titan_grapple" style="width:100%;margin-top:6px;background:#f59e0b;color:#0f172a;font-weight:800">★ EXECUTE TITAN MECH GRAPPLE [E]</button>' : '');
    return;
  }

  // 9.0 Destructible Crag Inspector
  if (t && t.roadC !== undefined) {
    const crag = t;
    box.innerHTML = '<h3>TACTICAL TERRAIN INSPECTOR</h3>' +
      '<div class="insp-name"><div><h4 style="color:#f59e0b">DESTRUCTIBLE CHOKEPOINT CRAG</h4><small>CRAG INTEGRITY · ' + crag.hp + ' / ' + crag.maxHp + ' HP</small></div></div>' +
      '<div style="margin:5px 0;padding:6px;background:rgba(15,23,42,0.8);border-left:3px solid #f59e0b;border-radius:2px">' +
      '<div style="font-size:10px;color:#f8fafc;font-weight:700">STATUS: ' + (crag.collapsed ? 'COLLAPSED (AVALANCHE TRIGGERED)' : 'UNSTABLE GEOLOGICAL CRAG') + '</div>' +
      '<div style="font-size:9.5px;color:#cbd5e1;line-height:1.25;margin-top:2px">Detonating or shooting this cliff triggers a massive Rockslide Avalanche that blocks the main road tile (' + crag.roadC + ',' + crag.roadR + ') for 20 seconds, crushing hostiles and redirecting traffic.</div>' +
      '</div>' +
      (!crag.collapsed ? '<button class="primary" data-act="collapse_crag" data-crag="' + crag.id + '" style="width:100%;margin-top:6px;background:#f59e0b;color:#0f172a;font-weight:800">COLLAPSE CHOKEPOINT CRAG</button>' : '');
    return;
  }

  // 9.0 Nemesis Commander Dossier Inspector
  if (t && t.isNemesis) {
    const nem = t;
    box.innerHTML = '<h3>NEMESIS INTELLIGENCE DOSSIER</h3>' +
      '<div class="insp-name"><div><h4 style="color:#a855f7">' + (nem.nemesisTitle || "Vor'gath, The Rail-Shatterer").toUpperCase() + '</h4><small>BOUNTY RETRIBUTION COMMANDER</small></div></div>' +
      '<div style="margin:5px 0;padding:6px;background:rgba(15,23,42,0.8);border-left:3px solid #a855f7;border-radius:2px">' +
      '<div style="font-size:10px;color:#f8fafc;font-weight:700">HARD-COUNTER ARMOR: -50% ' + (nem.counterType || 'phys').toUpperCase() + ' DAMAGE</div>' +
      '<div style="font-size:9.5px;color:#cbd5e1;line-height:1.25;margin-top:2px">Persistent Nemesis Commander. Defeating this unit yields high retribution rewards: +100 Gold, +35 Nanite Cores, and an Exotic Neural Chip!</div>' +
      '</div>';
    return;
  }

  const def = TD[t.type], tier = t.tier;
  const isFusion = Boolean(def && def.isFusion);
  const cur = statRows(t.type, tier, t.branch);
  const rows = cur.map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('');
  const sell = Math.floor(t.invested * 0.75);
  const isCryo = t.type === 'cryo' || t.type === 'fusion_zero';
  const isRelay = t.type === 'relay';
  const tierTitle = isFusion ? '★ SUPER-WEAPON' : (t.tier === 0 ? 'TIER I' : (t.tier === 1 ? 'TIER II' : 'SPEC: ' + (t.branch ? def.branches[t.branch].name.toUpperCase() : 'TIER III')));

  let leylineHtml = '';
  if (t.leyline) {
    leylineHtml = '<div style="margin:4px 0 6px 0;padding:4px 6px;background:' + t.leyline.color + '1a;border-left:3px solid ' + t.leyline.color + ';border-radius:2px;font-size:10px;color:#f8fafc">' +
      '<span style="color:' + t.leyline.color + ';font-weight:800">LEYLINE: ' + t.leyline.name.toUpperCase() + '</span><br>' +
      '<span style="color:#cbd5e1">' + t.leyline.tip + '</span></div>';
  }

  // Primary Action Area: Upgrade & Sell immediately accessible
  let upgHtml = '';
  if (isFusion) {
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" disabled style="width:100%;background:linear-gradient(90deg, ' + def.color + ', #818cf8);border-color:' + def.color + ';color:#0f172a;font-weight:800;letter-spacing:0.04em">★ APEX SUPER-WEAPON</button>';
  } else if (t.tier === 0 && def.tiers[1]) {
    const cost = getUpgradeCost(def.tiers[1].upg);
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" data-act="upgrade" data-cost="' + cost + '" style="width:100%">' + svg('up') + 'Upgrade T2 <i class="coin"></i>' + cost + '</button>';
  } else if (t.tier === 1 && def.branches) {
    const bA = def.branches.A, bB = def.branches.B;
    const cA = getUpgradeCost(bA.upg), cB = getUpgradeCost(bB.upg);
    upgHtml = '<div class="branch-grid">' +
      '<button class="branch-btn" tabindex="-1" data-act="upgrade" data-branch="A" data-cost="' + cA + '" style="--bc:' + bA.color + '"><div class="bh">' + bA.name + '</div><div class="br">' + bA.role + '</div><div class="bc"><i class="coin"></i>' + cA + '</div></button>' +
      '<button class="branch-btn" tabindex="-1" data-act="upgrade" data-branch="B" data-cost="' + cB + '" style="--bc:' + bB.color + '"><div class="bh">' + bB.name + '</div><div class="br">' + bB.role + '</div><div class="bc"><i class="coin"></i>' + cB + '</div></button>' +
      '</div>';
  } else {
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" disabled style="width:100%;opacity:0.6">MAX SPECIALIZATION</button>';
  }

  const sellBtnHtml = '<button class="sell" tabindex="-1" data-act="sell">' + svg('tag') + 'Sell <i class="coin"></i>' + sell + '</button>';

  const actsHtml = (t.tier === 1 && !isFusion) ?
    upgHtml + '<div style="margin-bottom:6px">' + sellBtnHtml + '</div>' :
    '<div class="tower-actions">' + upgHtml + sellBtnHtml + '</div>';

  const eligible = typeof getEligibleFusion === 'function' ? getEligibleFusion(t) : null;
  let fusionHtml = '';
  if (eligible) {
    const rec = eligible.recipe;
    const partnerName = (TD[eligible.partner.type] ? TD[eligible.partner.type].name : eligible.partner.type);
    fusionHtml = '<div class="fusion-box" style="margin:5px 0;padding:6px;background:rgba(129,140,248,0.12);border-left:3px solid ' + rec.color + ';border-radius:2px">' +
      '<div style="font-size:9.5px;font-weight:800;color:' + rec.color + ';letter-spacing:0.08em">★ SUPER-WEAPON FUSION AVAILABLE:</div>' +
      '<div style="font-size:11.5px;font-weight:800;color:#fff;margin:2px 0">' + rec.name + '</div>' +
      '<div style="font-size:9.5px;color:#94a3b8;line-height:1.2;margin-bottom:5px">' + rec.desc + ' <span style="color:#e2a72e">(Consumes adjacent ' + partnerName + ')</span></div>' +
      '<button class="btn-fuse" data-act="fuse" style="width:100%;padding:4px 8px;background:' + rec.color + ';color:#0f172a;border:none;border-radius:3px;font-weight:800;font-size:11px;cursor:pointer">★ ACTIVATE FUSION (' + rec.cost + 'G)</button>' +
      '</div>';
  }

  let relayHtml = '';
  if (isRelay) {
    const isOd = t.overdriveT > 0, isSd = t.shutdownT > 0;
    const odLabel = isOd ? 'OVERDRIVE ACTIVE (' + Math.ceil(t.overdriveT) + 's)' : (isSd ? 'THERMAL SHUTDOWN (' + Math.ceil(t.shutdownT) + 's)' : '⚡ TRIGGER SECTOR OVERDRIVE');
    relayHtml = '<button class="primary" data-act="overdrive" style="width:100%;margin:4px 0;background:' + (isOd ? '#059669' : (isSd ? '#475569' : '#10b981')) + '"' + (isOd || isSd ? ' disabled' : '') + '>' + odLabel + '</button>';
  }

  let chipsHtml = '';
  if (!isRelay) {
    const maxChips = isFusion ? 2 : (typeof maxChipsForTier === 'function' ? maxChipsForTier(t.tier) : (t.tier === 0 ? 0 : (t.tier === 1 ? 1 : 2)));
    if (!isFusion && t.tier === 0) {
      chipsHtml = '<div class="chips-panel" style="color:#64748b;font-size:9.5px">Upgrade to Tier II to unlock Modular Chip Sockets.</div>';
    } else {
      const inv = (typeof SAVE !== 'undefined' && SAVE.chipsInventory) || {};
      const chipsList = (t.chips || []).map((cId, idx) => {
        const cDef = (typeof MODULAR_CHIPS !== 'undefined' && MODULAR_CHIPS[cId]) || { name: cId, color: '#38bdf8' };
        return '<div class="chip-slot-item" style="border-left:3px solid ' + cDef.color + '">' +
          '<span style="font-size:10px;font-weight:800;color:' + cDef.color + '">' + cDef.name + '</span>' +
          '<button class="chip-unsocket-btn" data-act="unsocket" data-slot="' + idx + '">✕ Remove</button>' +
          '</div>';
      }).join('');

      let emptySlotHtml = '';
      if ((t.chips || []).length < maxChips) {
        const available = typeof MODULAR_CHIPS !== 'undefined' ? Object.keys(MODULAR_CHIPS).filter(cId => {
          const cDef = MODULAR_CHIPS[cId];
          const matchesType = cDef.target === 'any' || cDef.target === t.type || isFusion;
          const hasCount = (inv[cId] || 0) > 0;
          return matchesType && hasCount;
        }) : [];

        if (available.length > 0) {
          emptySlotHtml = '<div style="margin-top:3px">' +
            '<div style="font-size:9px;color:#94a3b8;font-weight:700;margin-bottom:2px">EQUIP COMPATIBLE CHIP:</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:3px">' +
            available.map(cId => {
              const cDef = MODULAR_CHIPS[cId];
              return '<button style="font-size:9.5px;padding:2px 5px;background:#1e293b;border:1px solid ' + cDef.color + ';border-radius:2px;color:#fff;cursor:pointer" data-act="socket" data-chip="' + cId + '" title="' + cDef.desc + '">' +
                '<span style="color:' + cDef.color + ';font-weight:700">+ ' + cDef.name + '</span> <small style="color:#94a3b8">(' + inv[cId] + ')</small>' +
                '</button>';
            }).join('') + '</div></div>';
        } else {
          emptySlotHtml = '<div style="font-size:9.5px;color:#64748b;margin-top:2px">No compatible chips in inventory.</div>';
        }
      }

      chipsHtml = '<div class="chips-panel">' +
        '<div class="chips-hdr"><span>MODULAR CHIP SOCKETS (' + ((t.chips || []).length) + '/' + maxChips + ')</span></div>' +
        chipsList + emptySlotHtml + '</div>';
    }
  }

  const fusionNote = isFusion ?
    '<div class="note" style="border-left:3px solid ' + def.color + ';background:' + def.color + '15;color:#e2e8f0;font-size:9.5px;line-height:1.25;margin-top:4px">' +
    '<b style="color:' + def.color + '">★ ' + def.name.toUpperCase() + ':</b> ' + def.tip + '</div>' : '';

  let thermalHtml = '';
  if (!isRelay) {
    const heat = Math.round(t.heat || 0);
    const maxH = typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.maxHeat : 100;
    const isOverheated = heat >= maxH;
    const heatColor = isOverheated ? '#ef4444' : (heat >= 75 ? '#f97316' : '#f59e0b');
    thermalHtml = '<div style="margin:5px 0;padding:5px 8px;background:rgba(15,23,42,0.6);border:1px solid ' + (isOverheated ? '#ef4444' : 'rgba(255,255,255,0.1)') + ';border-radius:3px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;margin-bottom:3px">' +
      '<span style="color:#94a3b8">THERMAL HEAT</span>' +
      '<span style="color:' + heatColor + '">' + heat + ' / ' + maxH + (isOverheated ? ' (THROTTLED -40%)' : '') + '</span>' +
      '</div>' +
      '<div style="width:100%;height:4px;background:#1e293b;border-radius:2px;overflow:hidden">' +
      '<div style="width:' + Math.min(100, (heat / maxH) * 100) + '%;height:100%;background:' + heatColor + '"></div>' +
      '</div>' +
      '</div>';
  }

  let conduitHtml = '';
  if (G && G.resonanceLines) {
    const activeConduits = G.resonanceLines.filter(l => l.target === t || l.relay === t);
    if (activeConduits.length > 0) {
      conduitHtml = '<div style="margin:4px 0;display:flex;flex-wrap:wrap;gap:4px">' +
        activeConduits.map(l => '<span class="tag" style="background:rgba(56,189,248,0.15);border:1px solid ' + l.conf.color + ';color:' + l.conf.color + ';font-size:8.5px">⚡ ' + l.conf.name.toUpperCase() + '</span>').join('') +
        '</div>';
    }
  }

  let synapseHtml = '';
  if (typeof getTowerSynapses === 'function') {
    const syns = getTowerSynapses(t);
    if (syns.length > 0) {
      synapseHtml = '<div style="margin:4px 0;display:flex;flex-direction:column;gap:3px">' +
        syns.map(s => {
          const conf = (typeof NEURAL_SYNAPSE_CONFIG !== 'undefined' && NEURAL_SYNAPSE_CONFIG.pairs[s.pairKey]) ? NEURAL_SYNAPSE_CONFIG.pairs[s.pairKey] : null;
          const otherId = s.t1Id === t.id ? s.t2Id : s.t1Id;
          const otherT = G.towers.find(ot => ot.id === otherId);
          const otherName = otherT ? TD[otherT.type].name : 'Tower';
          return '<div style="background:rgba(236,72,153,0.12);border-left:3px solid #ec4899;padding:3px 6px;border-radius:2px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9.5px;font-weight:800;color:#f472b6">SYNAPSE ↔ ' + otherName.toUpperCase() + '</span>' +
            '<button class="synapse-sever-btn" data-act="sever_synapse" data-syn="' + s.id + '" style="font-size:8px;padding:1px 4px;background:#471329;border:1px solid #ec4899;color:#fff;border-radius:2px;cursor:pointer">Sever</button></div>' +
            '<div style="font-size:8.5px;color:#cbd5e1;margin-top:1px">' + (conf ? conf.desc : 'Cross-Breeding Boost Active') + '</div>' +
            '</div>';
        }).join('') + '</div>';
    } else if (!isFusion && G.towers.length > 1) {
      synapseHtml = '<button class="primary" data-act="start_synapse" style="width:100%;margin:4px 0;background:#4a044e;border-color:#ec4899;color:#f472b6;font-size:9.5px;font-weight:800">CONNECT NEURAL SYNAPSE [N]</button>';
    }
  }

  let cyberLogicHtml = '';
  if ((t.tier >= 1 || isFusion) && typeof CYBER_LOGIC_PRESETS !== 'undefined') {
    const curLogic = t.cyberLogic || 'none';
    const curConf = CYBER_LOGIC_PRESETS[curLogic] || CYBER_LOGIC_PRESETS.none;
    const opts = Object.keys(CYBER_LOGIC_PRESETS).map(k => {
      const p = CYBER_LOGIC_PRESETS[k];
      return '<option value="' + k + '"' + (curLogic === k ? ' selected' : '') + '>' + p.name + '</option>';
    }).join('');

    cyberLogicHtml = '<div style="margin:5px 0;padding:5px 7px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.3);border-radius:3px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">' +
      '<span style="font-size:9.5px;font-weight:800;color:#38bdf8">⚡ CYBER-LOGIC MATRIX</span>' +
      '</div>' +
      '<select class="cyber-logic-select" data-act="set_cyber_logic" style="width:100%;font-size:10px;background:#0f172a;color:#f8fafc;border:1px solid #334155;padding:3px;border-radius:2px;cursor:pointer">' +
      opts +
      '</select>' +
      '<div style="font-size:8.5px;color:#94a3b8;line-height:1.2;margin-top:3px">' + curConf.desc + '</div>' +
      '</div>';
  }

  box.innerHTML = '<h3>SELECTED DEFENSE</h3>' +
    '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:' + (t.branch ? def.branches[t.branch].color : def.color) + '">' + (t.branch ? def.branches[t.branch].name : def.name) + '</h4><small>' + tierTitle + ' · ' + t.kills + ' KILLS</small></div></div>' +
    conduitHtml +
    synapseHtml +
    thermalHtml +
    leylineHtml +
    actsHtml +
    fusionHtml +
    '<div class="stats-grid">' + rows + '</div>' +
    relayHtml +
    '<div class="prio' + (isCryo || isRelay ? ' off' : '') + '" id="prioBox">' + PRIOS.map(p => '<button tabindex="-1" data-act="prio" data-prio="' + p[0] + '" class="' + (t.prio === p[0] ? 'on' : '') + '">' + p[1] + '</button>').join('') + '</div>' +
    cyberLogicHtml +
    chipsHtml +
    fusionNote +
    (isCryo && !isFusion ? '<div class="note">Cryo pulses affect all enemies in radius.</div>' : '') +
    (isRelay ? '<div class="note">Relay supplies MW power to sustain defense grid.</div>' : '');

  const ic = $('inspIcon');
  if (ic) {
    const c2 = ic.getContext('2d');
    c2.clearRect(0, 0, 48, 48);
    drawTowerSprite(c2, t.type, t.tier, { x: 24, y: 24, angle: t.angle, spin: t.spin, charge: t.charge }, 0.9, t.branch);
  }
}
let wcWave = -1, wcDone = false;
function renderWaveCard() {
  const n = G.wave + 1;
  setText('wcNum', String(n));
  if (wcWave !== n) {
    wcWave = n;
    const ev = buildSpawns(n);
    const cnt = {};
    ev.forEach(s => cnt[s.type] = (cnt[s.type] || 0) + (s.count || 1));
    const badges = Object.keys(cnt).map(k => {
      const isB = k === 'boss';
      const name = (typeof ED !== 'undefined' && ED[k]) ? ED[k].name : k;
      const iconImg = enemyIcons[k] ? '<img src="' + enemyIcons[k] + '" alt="' + name + '">' : '';
      return '<div class="badge' + (isB ? ' boss' : '') + '" title="' + name + '">' + iconImg + '<span>×' + cnt[k] + '</span></div>';
    }).join('');
    $('wcBadges').innerHTML = badges;

    const tags = [];
    if (cnt.stealth) tags.push('<span class="tag cy">STEALTH</span>');
    if (cnt.carrier) tags.push('<span class="tag purple">SHIELD CARRIER</span>');
    if (cnt.breacher) tags.push('<span class="tag orange">EMP BREACHER</span>');
    if (cnt.healer) tags.push('<span class="tag gr">HEALERS</span>');
    if (cnt.swarm) tags.push('<span class="tag red">SWARM RUSH</span>');
    if (cnt.brute) tags.push('<span class="tag">ARMORED</span>');
    if (ev.some(x => x.affix)) tags.push('<span class="tag purple">ELITE CHAMPIONS</span>');
    if (n === 10) tags.push('<span class="tag orange">TITAN: GOLIATH</span>');
    if (n === 15) tags.push('<span class="tag cy">TITAN: CHRONO-WEAVER</span>');
    if (n === 20) tags.push('<span class="tag purple">TITAN: APEX MOTHER</span>');
    if (G.hiveMutation && typeof HIVE_MUTATIONS !== 'undefined' && HIVE_MUTATIONS[G.hiveMutation]) {
      const hm = HIVE_MUTATIONS[G.hiveMutation];
      tags.push('<span class="tag" style="background:#4c0519;border-color:' + hm.color + ';color:' + hm.color + '">HIVE: ' + hm.badge + '</span>');
    }
    if (G.hiveCounterTrait && typeof HIVE_COUNTER_TRAITS !== 'undefined' && HIVE_COUNTER_TRAITS[G.hiveCounterTrait]) {
      const hct = HIVE_COUNTER_TRAITS[G.hiveCounterTrait];
      tags.push('<span class="tag" style="background:#450a0a;border-color:' + hct.color + ';color:' + hct.color + '">ADAPT: ' + hct.name.toUpperCase() + '</span>');
    }
    const threat = getThreatDirectorAnalysis();
    if (n >= 5 && threat) tags.push('<span class="tag orange">THREAT: ' + threat.name.toUpperCase() + '</span>');
    const waveMutator = (n >= 7 && (n % 2 === 1 || n % 5 === 0) && typeof WAVE_MUTATORS !== 'undefined') ? WAVE_MUTATORS[Object.keys(WAVE_MUTATORS)[(n * 3) % Object.keys(WAVE_MUTATORS).length]] : null;
    if (waveMutator) tags.push('<span class="tag ' + waveMutator.cls + '">MUTATOR: ' + waveMutator.name.toUpperCase() + '</span>');
    $('wcTags').innerHTML = tags.join('');

    let contractHtml = '';
    if (G.activeContract && typeof DEFENSE_CONTRACTS !== 'undefined') {
      const c = DEFENSE_CONTRACTS[G.activeContract];
      contractHtml = '<div class="contract-box signed">' +
        '<div class="contract-hdr">' +
        '<span style="font-size:9.5px;font-weight:800;color:#818cf8;letter-spacing:0.08em">SIGNED CONTRACT:</span>' +
        '<span class="tag purple" style="font-size:8.5px">ENFORCED</span>' +
        '</div>' +
        '<div style="font-size:11.5px;font-weight:800;color:#e0e7ff;margin-top:1px">' + c.name + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;line-height:1.25">' + c.desc + '</div>' +
        '<div style="font-size:10px;font-weight:800;color:#34d399;margin-top:2px">Reward: ' + c.rewardText + '</div>' +
        '</div>';
    } else if (!G.activeContract && typeof DEFENSE_CONTRACTS !== 'undefined' && G.state === 'prep' && G.wave > 0) {
      const cKeys = Object.keys(DEFENSE_CONTRACTS);
      const c = DEFENSE_CONTRACTS[cKeys[(G.wave * 2) % cKeys.length]];
      contractHtml = '<div class="contract-box">' +
        '<div class="contract-hdr">' +
        '<span style="font-size:9.5px;font-weight:800;color:#818cf8;letter-spacing:0.08em">OPTIONAL CONTRACT:</span>' +
        '<button class="contract-sign-btn" data-act="sign_contract" data-contract="' + c.id + '">Sign</button>' +
        '</div>' +
        '<div style="font-size:11.5px;font-weight:800;color:#e0e7ff;margin-top:1px">' + c.name + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;line-height:1.25">' + c.desc + '</div>' +
        '<div style="font-size:10px;font-weight:800;color:#34d399;margin-top:2px">Reward: ' + c.rewardText + '</div>' +
        '</div>';
    }

    const cBox = $('wcContract');
    if (cBox) cBox.innerHTML = contractHtml;
  }
  const btn = $('btnCall');
  let label, dis = !canCall();
  if (G.wave >= WIN_WAVE && !G.endless) label = 'Final wave in progress';
  else if (G.state === 'prep') {
    const b = earlyBonus();
    label = G.wave === 0 ? svg('play') + 'Start wave 1' : svg('play') + 'Call wave ' + n + ' (+' + b + ' gold) / ' + Math.ceil(G.prepT) + 's';
  } else if (G.state === 'active') {
    const streak = G.callStreak && G.callStreak > 1 ? ' [' + G.callStreak + 'x STREAK]' : '';
    label = svg('ff') + 'Call wave ' + n + ' early (+' + (earlyBonus() * (G.callStreak || 1)) + ' gold)' + streak;
  } else label = 'Standby';
  if (hud.call !== label) { hud.call = label; btn.innerHTML = label; }
  if (btn.disabled !== dis) btn.disabled = dis;
}
function renderSkillsAndPerks() {
  const skBox = $('cmdSkills'), pkBox = $('perkTray');
  if (!skBox || !pkBox || !G) return;
  const doc = (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES[G.doctrine]) || (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES.vanguard);
  const docSkills = doc ? doc.skills : ['orbital', 'minefield', 'sabot_rounds', 'carpet_bomb'];
  const keyLabels = ['Q', 'W', 'E', 'R'];

  const shortNames = {
    orbital: 'Orbital',
    minefield: 'Minefield',
    sabot_rounds: 'Sabot AP',
    carpet_bomb: 'Carpet Bomb',
    swap_towers: 'Spatial Shift',
    overcharge: 'Overcharge',
    cryo_singularity: 'Singularity',
    emp_nuke: 'EMP Nuke',
    holo_beacon: 'Holo-Decoy',
    cyber_hijack: 'Cyber-Hijack',
    caltrops: 'Caltrops',
    liquidation: 'Liquidation'
  };

  let docBadge = '';
  if (doc) {
    docBadge = '<div class="cmd-doc-badge" style="border-color:' + doc.color + '" title="' + doc.name + ' | Passive: ' + doc.passiveName + ' - ' + doc.passiveDesc + '">' +
      '<span style="color:' + doc.color + ';font-weight:800">' + doc.name.toUpperCase() + '</span>' +
      '</div>';
  }

  const skillsHtml = docBadge + docSkills.map((k, idx) => {
    const sk = (typeof COMMANDER_SKILLS !== 'undefined' && COMMANDER_SKILLS[k]) || { name: k, cd: 30, icon: 'target', desc: '' };
    const state = (G.skills && G.skills[k]) || { cd: 0 };
    const onCd = state.cd > 0, isActive = G.casting === k;
    const cdRatio = onCd ? clamp(state.cd / sk.cd, 0, 1) : 0;
    const keyStr = keyLabels[idx] || sk.key || '';
    const label = shortNames[k] || sk.name;
    return '<button class="cmd-btn' + (isActive ? ' active' : '') + '" data-skill="' + k + '" tabindex="-1" title="' + sk.name + ': ' + sk.desc + '" ' + (onCd ? 'disabled' : '') + '>' +
      '<span class="cmd-key">' + keyStr + '</span>' +
      svg(sk.icon) + '<span>' + label + '</span>' +
      (onCd ? '<div class="cmd-cooldown"><div class="cmd-cd-fill" style="width:' + Math.round(cdRatio * 100) + '%"></div><span>' + Math.ceil(state.cd) + 's</span></div>' : '') +
      '</button>';
  }).join('');
  if (hud.skills !== skillsHtml) { hud.skills = skillsHtml; skBox.innerHTML = skillsHtml; }

  const perksHtml = (G.perks && G.perks.length > 0) ?
    '<span style="font-size:9.5px;font-weight:800;color:var(--mute);margin-right:2px">PERKS:</span>' +
    G.perks.map(id => {
      const p = PERKS[id];
      return '<span class="perk-pill" title="' + p.desc + '"><b>' + p.tag + '</b> ' + p.name + '</span>';
    }).join('') : '';
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
    if (el.dataset.deployType === 'barricade') {
      const bCost = typeof DESTRUCTIBLE_TERRAIN_CONFIG !== 'undefined' ? DESTRUCTIBLE_TERRAIN_CONFIG.barricadeCost : 40;
      el.classList.toggle('poor', G.gold < bCost);
      el.classList.toggle('sel', !!G.placingBarricade);
      return;
    }
    if (el.dataset.megaType) {
      const md = typeof MEGASTRUCTURE_CONFIG !== 'undefined' ? MEGASTRUCTURE_CONFIG[el.dataset.megaType] : null;
      if (md) {
        el.classList.toggle('poor', G.gold < md.cost);
        el.classList.toggle('sel', G.placingMegastructure === el.dataset.megaType);
      }
      return;
    }
    const k = el.dataset.type;
    if (!k) return;
    const cost = typeof getTowerCost === 'function' ? getTowerCost(k) : TD[k].cost;
    el.classList.toggle('poor', G.gold < cost);
    el.classList.toggle('sel', G.placing === k);
  });
  if (G.uiDirty) { G.uiDirty = false; renderInspector(); }
  else if (G.sel) {
    const u = $('btnUpg');
    if (u && G.sel.tier === 0 && TD[G.sel.type] && !TD[G.sel.type].isFusion && TD[G.sel.type].tiers[1]) {
      u.disabled = G.gold < getUpgradeCost(TD[G.sel.type].tiers[1].upg);
    }
    if (G.sel.tier === 1) {
      document.querySelectorAll('.branch-btn').forEach(b => {
        b.disabled = G.gold < Number(b.dataset.cost);
      });
    }
  }
  if ($('vCores')) $('vCores').textContent = String((SAVE && SAVE.cores) || 0);
  const gp = typeof getGridPowerStatus === 'function' ? getGridPowerStatus() : { used: 0, capacity: 60, isBrownout: false };
  setText('vPower', gp.used + ' / ' + gp.capacity + ' MW');
  const chipP = $('chipPower');
  if (chipP) {
    chipP.classList.toggle('warn', gp.isBrownout);
    const bEl = chipP.querySelector('b');
    if (bEl) bEl.style.color = gp.isBrownout ? '#f43f5e' : (gp.pct > 0.85 ? '#facc15' : '#10b981');
  }
  const curSecId = (G && G.sector) || (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  const curSecObj = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : null;
  if ($('vSector') && curSecObj) {
    $('vSector').textContent = curSecObj.num + ' ' + curSecObj.shortName;
    $('vSector').style.color = curSecObj.color;
    if ($('chipSector')) $('chipSector').style.borderColor = curSecObj.color + '66';
  }
  // 9.0 Atmospheric Weather Chip Update
  if ($('vWeather') && G && G.currentWeather && typeof ECOSYSTEM_CONFIG !== 'undefined' && ECOSYSTEM_CONFIG.weather) {
    const w = ECOSYSTEM_CONFIG.weather[G.currentWeather] || { name: 'Clear', color: '#38bdf8' };
    $('vWeather').textContent = G.currentWeather.toUpperCase().replace('_', ' ');
    $('vWeather').style.color = w.color;
    if ($('chipWeather')) $('chipWeather').style.borderColor = w.color + '66';
  }
  const btnOv = $('btnOverload');
  if (btnOv && G) {
    if (G.overloadT > 0) {
      btnOv.textContent = 'OVERLOAD ' + Math.ceil(G.overloadT) + 's';
      btnOv.style.color = '#f43f5e';
      btnOv.style.borderColor = '#f43f5e';
    } else if (G.meltdownT > 0) {
      btnOv.textContent = 'BROWNOUT ' + Math.ceil(G.meltdownT) + 's';
      btnOv.style.color = '#f59e0b';
      btnOv.style.borderColor = '#f59e0b';
    } else if (G.overloadCd > 0) {
      btnOv.textContent = 'CD ' + Math.ceil(G.overloadCd) + 's';
      btnOv.style.color = '#94a3b8';
      btnOv.style.borderColor = '#475569';
    } else {
      btnOv.textContent = 'OVERLOAD (V)';
      btnOv.style.color = '#f43f5e';
      btnOv.style.borderColor = 'rgba(244,63,94,0.4)';
    }
  }
  if ($('vTpp')) $('vTpp').textContent = String((G && G.tpp) || 0);
  const btnTp = $('btnThermalPurge');
  if (btnTp && G) {
    if (G.thermalPurgeCd > 0) {
      btnTp.textContent = 'PURGE ' + Math.ceil(G.thermalPurgeCd) + 's';
      btnTp.style.opacity = '0.5';
      btnTp.disabled = true;
    } else {
      btnTp.textContent = 'PURGE [H]';
      btnTp.style.opacity = '1';
      btnTp.disabled = false;
    }
  }
  const btnChr = $('btnChrono');
  if (btnChr && G) {
    if (G.chronoCd > 0) {
      btnChr.textContent = 'CHRONO ' + Math.ceil(G.chronoCd) + 's';
      btnChr.style.opacity = '0.5';
      btnChr.disabled = true;
    } else {
      const entropy = Math.round(G.paradoxEntropy || 0);
      btnChr.textContent = entropy > 0 ? 'CHRONO [Z] ' + entropy + '%' : 'CHRONO [Z]';
      btnChr.style.opacity = '1';
      btnChr.disabled = false;
      btnChr.style.color = entropy > 60 ? '#f43f5e' : (entropy > 25 ? '#c084fc' : '#06b6d4');
      btnChr.style.borderColor = entropy > 60 ? '#f43f5e' : (entropy > 25 ? '#c084fc' : 'rgba(6,182,212,0.4)');
    }
  }
  const btnMech = $('btnMechPilot');
  if (btnMech && G && G.mech) {
    const m = G.mech;
    if (m.active) {
      btnMech.textContent = 'MECH ACTIVE (' + Math.round(m.battery) + '%)';
      btnMech.style.color = '#38bdf8';
      btnMech.style.borderColor = '#38bdf8';
      btnMech.style.background = 'rgba(56,189,248,0.2)';
    } else {
      btnMech.textContent = 'MECH [TAB] (' + Math.round(m.battery) + '%)';
      btnMech.style.color = m.battery > 15 ? '#38bdf8' : '#94a3b8';
      btnMech.style.borderColor = 'rgba(56,189,248,0.4)';
      btnMech.style.background = 'transparent';
    }
  }
  const btnDread = $('btnDreadnought');
  if (btnDread && G && G.dreadnought) {
    const d = G.dreadnought;
    const maxC = typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG.maxCharge : 100;
    const ready = d.charge >= maxC;
    if (d.active) {
      btnDread.innerHTML = 'ORBITAL STRIKE...';
      btnDread.style.color = '#f59e0b';
      btnDread.style.borderColor = '#f59e0b';
      btnDread.disabled = true;
    } else if (ready) {
      btnDread.innerHTML = '★ DREADNOUGHT READY';
      btnDread.style.color = '#fbbf24';
      btnDread.style.borderColor = '#f59e0b';
      btnDread.style.background = 'rgba(245,158,11,0.25)';
      btnDread.disabled = false;
    } else {
      const pct = Math.floor((d.charge / maxC) * 100);
      btnDread.innerHTML = 'DREADNOUGHT <span id="vDreadCharge" class="cbtn-badge dread">' + pct + '%</span>';
      btnDread.style.color = '#94a3b8';
      btnDread.style.borderColor = 'rgba(245,158,11,0.3)';
      btnDread.style.background = 'transparent';
      btnDread.disabled = true;
    }
  }
  renderWaveCard();
  renderSkillsAndPerks();
}

function renderSectorMiniPreview(canvasEl, secObj) {
  if (!canvasEl || !secObj) return;
  const c = canvasEl.getContext('2d');
  const cw = canvasEl.width, ch = canvasEl.height;
  c.clearRect(0, 0, cw, ch);
  c.fillStyle = secObj.bg || '#0f172a';
  c.fillRect(0, 0, cw, ch);

  const sx = cw / W, sy = ch / H;

  // Path 0
  if (secObj.wp0 && secObj.wp0.length > 0) {
    c.strokeStyle = (secObj.palette && secObj.palette.accent) || secObj.color || '#38bdf8';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    const st0 = secObj.start0;
    c.moveTo(clamp(st0.x * sx, 2, cw - 2), clamp(st0.y * sy, 2, ch - 2));
    for (const [col, row] of secObj.wp0) {
      c.lineTo((col * TILE + TILE / 2) * sx, (row * TILE + TILE / 2) * sy);
    }
    c.stroke();
  }

  // Path 1
  if (secObj.wp1 && secObj.wp1.length > 0) {
    c.strokeStyle = '#f43f5e';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.setLineDash([4, 3]);
    c.beginPath();
    const st1 = secObj.start1;
    c.moveTo(clamp(st1.x * sx, 2, cw - 2), clamp(st1.y * sy, 2, ch - 2));
    for (const [col, row] of secObj.wp1) {
      c.lineTo((col * TILE + TILE / 2) * sx, (row * TILE + TILE / 2) * sy);
    }
    c.stroke();
    c.setLineDash([]);
  }

  // Base marker
  if (secObj.base) {
    c.fillStyle = '#10b981';
    c.beginPath();
    c.arc(secObj.base.x * sx, secObj.base.y * sy, 4.5, 0, TAU);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.2;
    c.stroke();
  }

  // Hazards
  if (secObj.hazards) {
    for (const hz of secObj.hazards) {
      const hx = (hz.c * TILE + TILE / 2) * sx, hy = (hz.row * TILE + TILE / 2) * sy;
      c.fillStyle = hz.color || '#f97316';
      c.beginPath();
      c.arc(hx, hy, 3, 0, TAU);
      c.fill();
    }
  }

  // Leylines
  if (secObj.leylines) {
    for (const k in secObj.leylines) {
      const ln = secObj.leylines[k];
      const lx = (ln.c * TILE + TILE / 2) * sx, ly = (ln.r * TILE + TILE / 2) * sy;
      c.fillStyle = ln.color || '#fbbf24';
      c.fillRect(lx - 2, ly - 2, 4, 4);
    }
  }
}

/* overlay */
function showOverlay(kind) {
  const ov = $('overlay');
  if (!kind) { ov.classList.remove('show'); ov.innerHTML = ''; return; }
  let h = '';
  let curSecObj = null;
  if (kind === 'menu') {
    const curAsc = (typeof SAVE !== 'undefined' && SAVE.ascension) || 0;
    const maxUnlocked = Math.min(5, Math.max(1, (typeof SAVE !== 'undefined' && SAVE.maxAscension) || 1));
    const asc = typeof getAscensionData === 'function' ? getAscensionData(curAsc) : { name: 'Standard', desc: '', badge: 'NORMAL', color: '#94a3b8', pacts: [] };
    const pactsHtml = asc.pacts && asc.pacts.length > 0 ?
      '<div class="asc-pacts">' + asc.pacts.map(p => '<div>• ' + p + '</div>').join('') + '</div>' :
      '<div class="asc-pacts" style="color:#64748b;text-align:center">No active penalty pacts (Standard difficulty).</div>';

    const bonusText = curAsc > 0 ?
      '<span style="color:#38bdf8">+' + (curAsc * 25) + '% Cores</span> · <span style="color:#fbbf24">+' + (curAsc * 20) + '% Score</span>' :
      '<span style="color:#94a3b8">Base Rewards (1.0x)</span>';

    const ascSelectorHtml =
      '<div class="asc-box">' +
      '<div class="asc-bar">' +
      '<button class="asc-nav" data-ov="asc_prev"' + (curAsc <= 0 ? ' disabled' : '') + '>◀</button>' +
      '<div class="asc-title" style="color:' + asc.color + '">Pact of Punishment: ' + asc.badge + '</div>' +
      '<button class="asc-nav" data-ov="asc_next"' + (curAsc >= maxUnlocked ? ' disabled' : '') + '>▶</button>' +
      '</div>' +
      '<div class="asc-desc"><b>' + asc.name + ':</b> ' + asc.desc + '</div>' +
      pactsHtml +
      '<div style="margin-top:4px;font-size:10.5px;font-weight:700">' + bonusText + '</div>' +
      '</div>';

    const curDoc = (typeof SAVE !== 'undefined' && SAVE.doctrine) || 'vanguard';
    const docObj = (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES[curDoc]) || { name: 'Siege Vanguard', desc: '', color: '#f97316', passiveName: 'Shrapnel Cascade', passiveDesc: '' };
    const docSelectorHtml = (typeof COMMANDER_DOCTRINES !== 'undefined') ?
      '<div class="asc-box" style="border-color:#334155">' +
      '<div style="font-size:10px;font-weight:800;color:#94a3b8;margin-bottom:5px;letter-spacing:0.08em;text-align:left">COMMANDER TACTICAL DOCTRINE:</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px">' +
      Object.values(COMMANDER_DOCTRINES).map(d => {
        const isSel = d.id === curDoc;
        return '<button class="doc-pill' + (isSel ? ' on' : '') + '" data-ov="set_doctrine" data-doc="' + d.id + '" style="padding:5px 3px;background:' + (isSel ? 'rgba(56,189,248,0.15)' : '#0f172a') + ';border:1px solid ' + (isSel ? d.color : '#334155') + ';border-radius:3px;cursor:pointer;color:' + (isSel ? '#fff' : '#94a3b8') + ';font-size:10.5px;font-weight:700">' +
          '<div style="color:' + d.color + '">' + d.name + '</div>' +
          '<div style="font-size:8.5px;font-weight:400;margin-top:1px;color:#cbd5e1">' + d.passiveName + '</div>' +
          '</button>';
      }).join('') +
      '</div>' +
      '<div style="font-size:9.5px;color:#94a3b8;margin-top:5px;text-align:left;line-height:1.25">' +
      '<b>' + docObj.name + ':</b> ' + docObj.desc + ' <span style="color:' + docObj.color + '">[' + docObj.passiveName + ']: ' + docObj.passiveDesc + '</span>' +
      '</div>' +
      '</div>' : '';

    const curSecId = (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
    curSecObj = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : (typeof MAP_SECTORS !== 'undefined' ? MAP_SECTORS.foundry : null);
    const secMastery = typeof getSectorMastery === 'function' ? getSectorMastery(curSecId) : { stars: [false, false, false], cleared: false };

    // 7-sector tab bar
    const sectorTabsHtml = (typeof MAP_SECTORS !== 'undefined') ?
      '<div class="sec-tabs-bar">' +
      Object.values(MAP_SECTORS).map(s => {
        const isSel = s.id === curSecId;
        const m = typeof getSectorMastery === 'function' ? getSectorMastery(s.id) : { stars: [] };
        const unlocked = typeof isSectorUnlocked === 'function' ? isSectorUnlocked(s.id) : true;
        const starStr = (m.stars && m.stars[0] ? '★' : '☆') + (m.stars && m.stars[1] ? '★' : '☆') + (m.stars && m.stars[2] ? '★' : '☆');
        return '<button class="sec-tab-btn' + (isSel ? ' on' : '') + (!unlocked ? ' locked' : '') + '" data-ov="set_sector" data-sec="' + s.id + '" style="--sec-col:' + s.color + '"' + (!unlocked ? ' disabled' : '') + '>' +
          '<div class="sec-tab-num">' + (unlocked ? 'SECTOR ' + s.num : 'LOCKED') + '</div>' +
          '<div class="sec-tab-name">' + s.shortName + '</div>' +
          '<div class="sec-tab-stars">' + (unlocked ? starStr : '🔒') + '</div>' +
          '</button>';
      }).join('') +
      '</div>' : '';

    const starsDetailed = [
      { num: 1, title: 'Beat Wave 20', reward: '+25 Cores', done: !!(secMastery.stars && secMastery.stars[0]) },
      { num: 2, title: 'Perfect (25 Lives)', reward: '+35 Cores', done: !!(secMastery.stars && secMastery.stars[1]) },
      { num: 3, title: 'Ascension 2+ Clear', reward: '+50 Cores', done: !!(secMastery.stars && secMastery.stars[2]) }
    ];

    const dossierHtml = curSecObj ?
      '<div class="sec-dossier" style="border-left-color:' + curSecObj.color + '">' +
        '<div class="sec-dossier-top">' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            '<span class="sec-badge" style="background:' + curSecObj.color + '22;color:' + curSecObj.color + ';border:1px solid ' + curSecObj.color + '">SECTOR ' + curSecObj.num + '</span>' +
            '<b style="color:#f8fafc;font-size:11.5px">' + curSecObj.name + '</b>' +
            '<span style="color:#94a3b8;font-size:9.5px">(' + curSecObj.subtitle + ')</span>' +
          '</div>' +
          '<div style="color:' + curSecObj.color + ';font-size:10px;font-weight:700">' + curSecObj.topology + '</div>' +
        '</div>' +
        '<div class="sec-dossier-grid">' +
          '<canvas id="secMiniCanvas" width="160" height="96" style="background:' + curSecObj.bg + ';border:1px solid #1e293b;border-radius:3px"></canvas>' +
          '<div class="sec-intel">' +
            '<div><span class="sec-k">BIOME:</span> <span class="sec-v">' + curSecObj.biome + '</span></div>' +
            '<div><span class="sec-k">HAZARD:</span> <span class="sec-v">' + curSecObj.hazardDesc + '</span></div>' +
            '<div><span class="sec-k">CLIMATE:</span> <span class="sec-v" style="color:#fde047">' + curSecObj.climateDesc + '</span></div>' +
            '<div class="sec-star-wrap">' +
              starsDetailed.map(st =>
                '<div class="sec-star-item' + (st.done ? ' done' : '') + '">' +
                  '<span>' + (st.done ? '★' : '☆') + ' ' + st.title + '</span>' +
                  '<b style="color:' + (st.done ? '#34d399' : '#38bdf8') + '">' + (st.done ? 'DONE' : st.reward) + '</b>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' : '';

    const controlsHtml =
      '<div class="how">' +
      '<div><kbd>1</kbd>-<kbd>6</kbd> select tower</div><div><kbd>Q/W/E/R</kbd> powers</div>' +
      '<div><kbd>B</kbd> workshop HQ</div><div><kbd>Space</kbd> wave / pause</div>' +
      '<div><kbd>Click</kbd> build / inspect</div><div><kbd>Esc</kbd> cancel / deselect</div>' +
      '<div><kbd>U</kbd> upgrade / <kbd>X</kbd> sell</div><div><kbd>P</kbd> pause / <kbd>F</kbd> speed</div>' +
      '</div>';

    const statsHtml =
      '<div class="ov-stats">' +
      '<div><label>BEST WAVE</label><b>' + SAVE.bestWave + '</b></div>' +
      '<div><label>HIGH SCORE</label><b>' + SAVE.bestScore + '</b></div>' +
      '<div><label>NANITE CORES</label><b style="color:#38bdf8">' + (SAVE.cores || 0) + '</b></div>' +
      '</div>';

    h = '<div class="ov-box"><h1>' + LOGO + 'BASTION</h1><div class="sub">Hold the grid. Survive 20 waves, then push into Endless Mode.</div>' +
      '<div class="sec-box">' +
      '<div style="font-size:10px;font-weight:800;color:#94a3b8;margin-bottom:5px;letter-spacing:0.08em;text-align:left">EXPEDITION SECTOR DOSSIER:</div>' +
      sectorTabsHtml +
      dossierHtml +
      '</div>' +
      '<div class="ov-grid">' +
      '<div class="ov-col">' + docSelectorHtml + ascSelectorHtml + '</div>' +
      '<div class="ov-col">' + statsHtml + controlsHtml + '</div>' +
      '</div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="start" tabindex="-1" style="background:' + (curSecObj ? curSecObj.color : '#e2a72e') + ';border-color:' + (curSecObj ? curSecObj.color : '#e2a72e') + '">' + svg('play') + 'Deploy: ' + (curSecObj ? curSecObj.name : 'Bastion') + '</button><button class="ghost" data-ov="open_workshop" tabindex="-1">Workshop HQ</button></div></div>';
  } else if (kind === 'workshop') {
    const cards = Object.values(WORKSHOP_UPGRADES).map(u => {
      const lv = getWorkshopLevel(u.id);
      const isMax = lv >= u.maxLv;
      const cost = isMax ? 0 : u.costs[lv];
      const canAfford = !isMax && (SAVE.cores || 0) >= cost;
      let stars = '';
      for (let s = 1; s <= u.maxLv; s++) stars += s <= lv ? '★' : '☆';
      const btn = isMax ?
        '<button class="draft-btn" disabled>MAX RESEARCHED</button>' :
        '<button class="draft-btn' + (canAfford ? ' primary' : '') + '" data-ov="hq_upg" data-upg="' + u.id + '"' + (!canAfford ? ' disabled' : '') + '>Research (' + cost + ' Cores)</button>';
      return '<div class="draft-card" style="border-top-color:#38bdf8">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span class="draft-tag" style="background:#0c4a6e;color:#38bdf8">' + stars + ' LV ' + lv + '/' + u.maxLv + '</span>' +
        '<span style="font-size:10.5px;color:#94a3b8">' + u.effectText(lv) + '</span>' +
        '</div>' +
        '<div class="draft-name">' + u.name + '</div>' +
        '<div class="draft-desc">' + u.desc + '</div>' +
        btn +
        '</div>';
    }).join('');

    h = '<div class="draft-box" style="border-top-color:#38bdf8;max-width:780px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#38bdf8;letter-spacing:.15em">' + svg('spark') + ' BASTION WORKSHOP HQ</h2>' +
      '<div class="chip" style="background:#0b192c;border:1px solid #0284c7;padding:4px 10px;display:flex;align-items:center;gap:6px"><span class="ic" data-ico="spark"></span><div><label style="color:#94a3b8;font-size:9px">NANITE CORES</label><b style="color:#38bdf8;font-size:15px">' + (SAVE.cores || 0) + '</b></div></div>' +
      '</div>' +
      '<div class="sub">Permanent Meta-Progression. Nanite Cores persist across all runs.</div>' +
      '<div class="draft-grid" style="grid-template-columns:1fr 1fr;margin-bottom:14px">' + cards + '</div>' +
      '<div style="display:flex;justify-content:center;gap:10px">' +
      '<button class="primary big" data-ov="close_workshop" tabindex="-1">Resume Operation</button>' +
      '</div></div>';
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
  } else if (kind === 'smuggler') {
    const cards = Object.values(CURSED_PROTOCOLS).map(cp => {
      const isSigned = G && G.cursedProtocols && G.cursedProtocols.includes(cp.id);
      const btn = isSigned ?
        '<button class="draft-btn" disabled style="background:#334155;color:#94a3b8">PROTOCOL ACTIVE</button>' :
        '<button class="draft-btn" data-ov="accept_protocol" data-protocol="' + cp.id + '" style="background:' + cp.color + ';color:#0f172a;font-weight:800">ACCEPT PACT</button>';
      return '<div class="draft-card" style="border-top-color:' + cp.color + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span class="draft-tag" style="background:#31151e;color:' + cp.color + ';border:1px solid ' + cp.color + '">CURSED TECH</span>' +
        '</div>' +
        '<div class="draft-name" style="color:#f8fafc">' + cp.name + '</div>' +
        '<div style="font-size:10px;font-weight:700;color:#34d399;margin-bottom:3px">BUFF: ' + cp.buff + '</div>' +
        '<div style="font-size:10px;font-weight:700;color:#f43f5e;margin-bottom:6px">PENALTY: ' + cp.penalty + '</div>' +
        '<div class="draft-desc" style="font-size:9.5px;color:#94a3b8;margin-bottom:8px">' + cp.desc + '</div>' +
        btn +
        '</div>';
    }).join('');

    h = '<div class="draft-box" style="border-top-color:#c084fc;max-width:760px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
      '<h2 style="margin:0;color:#c084fc;letter-spacing:.12em">' + svg('tag') + ' BLACK MARKET SMUGGLER TERMINAL</h2>' +
      '<button class="ghost" data-ov="close_smuggler" style="padding:2px 8px;font-size:11px">✕ PASS</button>' +
      '</div>' +
      '<div class="sub">High-Stakes Cursed Protocols. Tremendous tactical power balanced by perilous operational penalties.</div>' +
      '<div class="draft-grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px">' + cards + '</div>' +
      '<div style="display:flex;justify-content:center">' +
      '<button class="ghost" data-ov="close_smuggler">Decline All Protocols (Proceed)</button>' +
      '</div></div>';
  } else if (kind === 'codex') {
    const progress = typeof getCodexProgress === 'function' ? getCodexProgress() : { discovered: 0, total: 19, pct: 0 };
    const fusionsHtml = (typeof FUSION_RECIPES !== 'undefined' ? FUSION_RECIPES : []).map(f => {
      const disc = typeof isCodexDiscovered === 'function' && isCodexDiscovered(f.id);
      return '<div class="codex-item' + (disc ? ' discovered' : ' locked') + '">' +
        '<div class="codex-icon" style="color:' + (disc ? f.color : '#64748b') + '">' + (disc ? '★' : '?') + '</div>' +
        '<div class="codex-meta">' +
        '<b style="color:' + (disc ? f.color : '#94a3b8') + '">' + (disc ? f.name : '??? CLASSIFIED FUSION') + '</b>' +
        '<small>' + (disc ? f.desc : 'Merge Tier 3 ' + f.towerA.toUpperCase() + ' with adjacent Tier 3 ' + f.towerB.toUpperCase()) + '</small>' +
        '</div>' +
        '<span class="codex-bounty">' + (disc ? 'DISCOVERED' : '+15 CORES') + '</span>' +
        '</div>';
    }).join('');

    const cursedHtml = (typeof CURSED_PROTOCOLS !== 'undefined' ? Object.values(CURSED_PROTOCOLS) : []).map(c => {
      const disc = typeof isCodexDiscovered === 'function' && isCodexDiscovered(c.id);
      return '<div class="codex-item' + (disc ? ' discovered' : ' locked') + '">' +
        '<div class="codex-icon" style="color:' + (disc ? c.color : '#64748b') + '">' + (disc ? '☣' : '?') + '</div>' +
        '<div class="codex-meta">' +
        '<b style="color:' + (disc ? c.color : '#94a3b8') + '">' + (disc ? c.name : '??? CURSED PROTOCOL') + '</b>' +
        '<small>' + (disc ? c.buff + ' ' + c.penalty : 'Sign pact at Black Market terminal after wave 5/10/15') + '</small>' +
        '</div>' +
        '<span class="codex-bounty">' + (disc ? 'DISCOVERED' : '+15 CORES') + '</span>' +
        '</div>';
    }).join('');

    const anomaliesHtml = (typeof FIELD_ANOMALIES !== 'undefined' ? Object.values(FIELD_ANOMALIES) : []).map(a => {
      const disc = typeof isCodexDiscovered === 'function' && isCodexDiscovered(a.id);
      return '<div class="codex-item' + (disc ? ' discovered' : ' locked') + '">' +
        '<div class="codex-icon" style="color:' + (disc ? a.color : '#64748b') + '">' + (disc ? '⚡' : '?') + '</div>' +
        '<div class="codex-meta">' +
        '<b style="color:' + (disc ? a.color : '#94a3b8') + '">' + (disc ? a.name : '??? TACTICAL ANOMALY') + '</b>' +
        '<small>' + (disc ? a.desc : 'Encounter and interact with tactical anomaly in combat') + '</small>' +
        '</div>' +
        '<span class="codex-bounty">' + (disc ? 'DISCOVERED' : '+15 CORES') + '</span>' +
        '</div>';
    }).join('');

    h = '<div class="draft-box" style="border-top-color:#c084fc;max-width:820px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#c084fc;letter-spacing:.15em">' + svg('target') + ' CLASSIFIED TECH CODEX</h2>' +
      '<div class="chip" style="background:#1e1b4b;border:1px solid #a855f7;padding:4px 10px;display:flex;align-items:center;gap:6px">' +
      '<span style="font-size:10px;color:#c084fc;font-weight:800">ARCHIVE PROGRESS: ' + progress.discovered + ' / ' + progress.total + ' (' + progress.pct + '%)</span>' +
      '</div>' +
      '</div>' +
      '<div class="sub">Decrypted database of advanced weaponry, forbidden black market protocols, and tactical anomalies. First discovery of each entry awards +15 Nanite Cores.</div>' +
      '<div style="font-size:10px;font-weight:800;color:#818cf8;margin:8px 0 4px;letter-spacing:0.08em">SUPER-WEAPON FUSIONS:</div>' +
      '<div class="codex-grid">' + fusionsHtml + '</div>' +
      '<div style="font-size:10px;font-weight:800;color:#f43f5e;margin:10px 0 4px;letter-spacing:0.08em">CURSED BLACK MARKET PROTOCOLS:</div>' +
      '<div class="codex-grid">' + cursedHtml + '</div>' +
      '<div style="font-size:10px;font-weight:800;color:#38bdf8;margin:10px 0 4px;letter-spacing:0.08em">TACTICAL FIELD ANOMALIES:</div>' +
      '<div class="codex-grid">' + anomaliesHtml + '</div>' +
      '<div style="display:flex;justify-content:center;margin-top:12px">' +
      '<button class="primary big" data-ov="close_codex">Close Archive</button>' +
      '</div></div>';
  } else if (kind === 'matrix') {
    const tpp = (G && G.tpp) || 0;
    const branches = [
      { id: 'warfare', name: 'WARFARE OVERCLOCK', color: '#f43f5e', tag: 'OFFENSE' },
      { id: 'grid', name: 'GRID ARCHITECTURE', color: '#38bdf8', tag: 'ENERGY' },
      { id: 'logistics', name: 'LOGISTICS & RECON', color: '#34d399', tag: 'SURVIVAL' }
    ];

    const branchHtml = branches.map(br => {
      const protos = Object.values(TACTICAL_MATRIX_PROTOCOLS).filter(p => p.branch === br.id);
      protos.sort((a, b) => a.tier - b.tier);

      const items = protos.map(p => {
        const unlocked = hasMatrixProtocol(p.id);
        const reqMet = !p.req || hasMatrixProtocol(p.req);
        const canAfford = tpp >= p.cost;
        let btnHtml = '';
        if (unlocked) {
          btnHtml = '<button class="draft-btn" disabled style="background:#15803d;color:#f0fdf4;font-weight:800;border:none">✔ PROTOCOL ENGAGED</button>';
        } else if (!reqMet) {
          const reqP = TACTICAL_MATRIX_PROTOCOLS[p.req];
          btnHtml = '<button class="draft-btn" disabled style="background:#334155;color:#94a3b8;border:none">REQ: ' + (reqP ? reqP.name : 'TIER ' + (p.tier - 1)) + '</button>';
        } else if (!canAfford) {
          btnHtml = '<button class="draft-btn" disabled style="background:#475569;color:#cbd5e1;border:none">NEED ' + p.cost + ' TPP</button>';
        } else {
          btnHtml = '<button class="draft-btn primary" data-ov="unlock_matrix" data-proto="' + p.id + '" style="background:' + br.color + ';border-color:' + br.color + ';color:#0f172a;font-weight:800">ENGAGE PROTOCOL (' + p.cost + ' TPP)</button>';
        }

        return '<div class="matrix-card' + (unlocked ? ' active' : (!reqMet ? ' locked' : '')) + '" style="background:#0f172a;border:1px solid ' + (unlocked ? '#22c55e' : (reqMet ? br.color : '#334155')) + ';border-radius:4px;padding:8px;border-top:3px solid ' + br.color + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<span class="draft-tag" style="background:#1e293b;color:' + br.color + ';border:1px solid ' + br.color + '44">TIER ' + p.tier + ' · ' + p.cost + ' TPP</span>' +
          (unlocked ? '<span style="font-size:10px;font-weight:800;color:#34d399">ONLINE</span>' : '') +
          '</div>' +
          '<div class="draft-name" style="color:#f8fafc;font-size:12.5px;margin:2px 0 4px">' + p.name + '</div>' +
          '<div class="draft-desc" style="font-size:10px;color:#94a3b8;margin-bottom:8px;line-height:1.3">' + p.desc + '</div>' +
          btnHtml +
          '</div>';
      }).join('');

      return '<div class="matrix-branch-col" style="display:flex;flex-direction:column;gap:8px">' +
        '<div class="matrix-branch-hdr" style="border-left:3px solid ' + br.color + ';padding-left:8px;margin-bottom:4px">' +
        '<b style="color:' + br.color + ';font-size:11.5px;letter-spacing:0.08em">' + br.name + '</b>' +
        '</div>' +
        items +
        '</div>';
    }).join('');

    h = '<div class="draft-box" style="border-top-color:#818cf8;max-width:880px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#818cf8;letter-spacing:.15em">⚡ TACTICAL PROTOCOL MATRIX</h2>' +
      '<div class="chip" style="background:#1e1b4b;border:1px solid #818cf8;padding:4px 10px;display:flex;align-items:center;gap:6px">' +
      '<span style="font-size:9.5px;color:#94a3b8;font-weight:700">TACTICAL PROTOCOL POINTS:</span>' +
      '<b style="color:#818cf8;font-size:16px">' + tpp + ' TPP</b>' +
      '</div>' +
      '</div>' +
      '<div class="sub">In-Run Synergistic Combat Protocols. Earn TPP from Flawless Wave Clears, Elite Hostiles, and Titans. Resets per run.</div>' +
      '<div class="matrix-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;margin:12px 0 14px">' + branchHtml + '</div>' +
      '<div style="display:flex;justify-content:center">' +
      '<button class="primary big" data-ov="close_matrix">Resume Perimeter Defense</button>' +
      '</div></div>';
  } else if (kind === 'syndicate') {
    const sg = G && G.syndicateGunship;
    const canBribe = (G && G.gold >= 120);
    h = '<div class="draft-box" style="border-top-color:#f59e0b;max-width:580px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#f59e0b;letter-spacing:.12em">' + svg('target') + ' THE INFILTRATOR SYNDICATE</h2>' +
      '<button class="ghost" data-ov="close_syndicate" style="padding:2px 8px;font-size:11px">✕ LEAVE</button>' +
      '</div>' +
      '<div class="sub">A neutral high-tech mercenary gunship has entered local airspace. Choose how to handle their intervention.</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0">' +
      '<div class="draft-card" style="border-top-color:#10b981">' +
      '<div style="font-size:10px;font-weight:800;color:#10b981;margin-bottom:4px">OPTION 1: MERCENARY CONTRACT</div>' +
      '<div class="draft-name">Bribe Gunship (120 Gold)</div>' +
      '<div class="draft-desc">Hire the gunship as an allied airborne weapons platform. Unleashes homing rocket salvos on the highest threat hostiles until wave ends.</div>' +
      '<button class="draft-btn' + (canBribe ? ' primary' : '') + '" data-ov="bribe_syndicate"' + (!canBribe ? ' disabled' : '') + '>Authorize Bribe (120G)</button>' +
      '</div>' +
      '<div class="draft-card" style="border-top-color:#ef4444">' +
      '<div style="font-size:10px;font-weight:800;color:#ef4444;margin-bottom:4px">OPTION 2: TACTICAL INTERCEPTION</div>' +
      '<div class="draft-name">Raid Syndicate Gunship</div>' +
      '<div class="draft-desc">Mark the gunship as hostile. Towers and skills can destroy it for massive bounties: <b style="color:#fbbf24">+220G</b>, <b style="color:#38bdf8">+30 Cores</b>, and the forbidden <b style="color:#c084fc">Singularity Collapse Chip</b>!</div>' +
      '<button class="draft-btn" data-ov="raid_syndicate" style="background:#ef4444;color:#fff;font-weight:800">Initiate Raid</button>' +
      '</div>' +
      '</div>' +
      '<div style="font-size:9.5px;color:#94a3b8;text-align:center">Ignoring the gunship causes syndicate raiders to extract 20% of alien bounty from this sector.</div>' +
      '</div>';
  } else if (kind === 'anomaly_vault') {
    const vList = typeof ANOMALY_VAULTS !== 'undefined' ? Object.values(ANOMALY_VAULTS) : [];
    const waveNum = (G && G.wave) || 4;
    h = '<div class="draft-box" style="border-top-color:#a855f7;max-width:680px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#c084fc;letter-spacing:.12em">🌌 ANOMALY VAULT EXPEDITION (WAVE ' + waveNum + ')</h2>' +
      '</div>' +
      '<div class="sub">A dimensional rift has breached the perimeter. Choose one expedition gate to explore before the next assault.</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin:12px 0">' +
      vList.map(v => {
        return '<div class="draft-card" style="border-top-color:' + v.color + ';display:flex;flex-direction:column;justify-content:space-between">' +
          '<div>' +
          '<div style="font-size:10px;font-weight:800;color:' + v.color + ';margin-bottom:4px">★ ' + (v.id || 'VAULT').toUpperCase() + '</div>' +
          '<div class="draft-name" style="font-size:13px;color:#fff;margin-bottom:6px">' + v.name + '</div>' +
          '<div class="draft-desc" style="font-size:10px;line-height:1.35;color:#cbd5e1">' + v.desc + '</div>' +
          '</div>' +
          '<button class="draft-btn" data-ov="select_vault" data-vault="' + v.id + '" style="margin-top:10px;background:' + v.color + ';color:#0f172a;font-weight:800">Enter Vault</button>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div style="font-size:9.5px;color:#94a3b8;text-align:center">Exotic relics from Anomaly Vaults alter fundamental physics rules for the remainder of this defense run.</div>' +
      '</div>';
  } else if (kind === 'gene_lab') {
    const cores = (typeof SAVE !== 'undefined' && SAVE.cores) || 0;
    const splicesHtml = (typeof GENE_SPLICING_CONFIG !== 'undefined') ? Object.keys(GENE_SPLICING_CONFIG).map(sk => {
      const sp = GENE_SPLICING_CONFIG[sk];
      const hasSplice = G && G.geneSplices && G.geneSplices[sk];
      const canAfford = cores >= sp.cost;
      return '<div style="margin:6px 0;padding:8px;background:rgba(15,23,42,0.85);border-left:3px solid ' + sp.color + ';border-radius:3px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
        '<div style="font-size:11px;font-weight:800;color:' + sp.color + '">' + sp.name.toUpperCase() + '</div>' +
        '<div style="font-size:9.5px;color:#cbd5e1;margin-top:2px">' + sp.desc + '</div>' +
        '</div>' +
        '<div>' +
        (hasSplice ? '<span style="font-size:10px;font-weight:800;color:#34d399">ACTIVE</span>' :
          '<button class="primary" data-ov="buy_splice" data-splice="' + sk + '"' + (!canAfford ? ' disabled' : '') + ' style="font-size:9.5px;padding:3px 8px;background:' + sp.color + ';color:#0f172a;font-weight:800">' + sp.cost + ' Cores</button>') +
        '</div>' +
        '</div>';
    }).join('') : '';

    const curiosHtml = (typeof DARK_TECH_CURIOS !== 'undefined') ? Object.keys(DARK_TECH_CURIOS).map(ck => {
      const cur = DARK_TECH_CURIOS[ck];
      const hasCurio = G && G.darkCurios && G.darkCurios.includes(ck);
      return '<div style="margin:6px 0;padding:8px;background:rgba(225,29,72,0.1);border-left:3px solid ' + cur.color + ';border-radius:3px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
        '<div style="font-size:11px;font-weight:800;color:' + cur.color + '">★ ' + cur.name.toUpperCase() + '</div>' +
        '<div style="font-size:9.5px;color:#fca5a5;margin-top:2px">' + cur.desc + '</div>' +
        '</div>' +
        '<div>' +
        (hasCurio ? '<span style="font-size:10px;font-weight:800;color:#e11d48">BOUND</span>' :
          '<button class="sell" data-ov="bind_curio" data-curio="' + ck + '" style="font-size:9.5px;padding:3px 8px;background:#e11d48;color:#fff;font-weight:800">SACRIFICE & BIND</button>') +
        '</div>' +
        '</div>';
    }).join('') : '';

    h = '<div class="draft-box" style="border-top-color:#34d399;max-width:620px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<h2 style="margin:0;color:#34d399;letter-spacing:.12em">🧬 BIOCHEMICAL GENE-SPLICING & VOID ALCHEMY</h2>' +
      '<button class="ghost" data-ov="close_gene_lab" style="padding:2px 8px;font-size:11px">✕ CLOSE</button>' +
      '</div>' +
      '<div class="sub">Splice harvested mutant genomes into defensive bio-structures using Nanite Cores (' + cores + ' Cores available).</div>' +
      '<div style="font-size:10px;font-weight:800;color:#38bdf8;margin:8px 0 4px;letter-spacing:0.08em">GENOMIC SPLICING PROTOCOLS:</div>' +
      splicesHtml +
      '<div style="font-size:10px;font-weight:800;color:#f43f5e;margin:12px 0 4px;letter-spacing:0.08em">FORBIDDEN DARK TECH CURIOS (HIGH RISK / HIGH REWARD):</div>' +
      curiosHtml +
      '</div>';
  } else if (kind === 'over') {
    const sec = (typeof MAP_SECTORS !== 'undefined' && G && G.sector && MAP_SECTORS[G.sector]) ? MAP_SECTORS[G.sector] : null;
    const secLabel = sec ? ('SECTOR ' + sec.num + ': ' + sec.name) : 'BASTION';
    h = '<div class="ov-box" style="border-top-color:#fb7185"><h2 style="color:#fb7185">BASE OVERRUN</h2><div class="sub">' + secLabel + ' breached at Wave ' + (G ? G.wave : 0) + '. Regroup and adapt defense layout.</div>' +
      '<div class="ov-stats" style="grid-template-columns:repeat(4, 1fr);margin-bottom:12px"><div><label>WAVE</label><b>' + (G ? G.wave : 0) + '</b></div><div><label>SCORE</label><b>' + (G ? G.score : 0) + '</b></div><div><label>CORES</label><b style="color:#38bdf8">' + (SAVE.cores || 0) + '</b></div><div><label>KILLS</label><b>' + (G ? G.kills : 0) + '</b></div></div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="again" tabindex="-1">' + svg('redo') + 'Play again</button><button class="ghost" data-ov="to_menu" tabindex="-1">Sector Dossier</button><button class="ghost" data-ov="open_workshop" tabindex="-1">Workshop HQ</button></div></div>';
  } else if (kind === 'win') {
    const curAsc = (G && G.ascension) || 0;
    const asc = typeof getAscensionData === 'function' ? getAscensionData(curAsc) : { badge: 'NORMAL', color: '#34d399' };
    const sec = (typeof MAP_SECTORS !== 'undefined' && G && G.sector && MAP_SECTORS[G.sector]) ? MAP_SECTORS[G.sector] : null;
    const secName = sec ? ('SECTOR ' + sec.num + ': ' + sec.name.toUpperCase()) : 'BASTION';
    const bountyText = (G && G.sectorVictoryResult && G.sectorVictoryResult.coresEarned > 0) ?
      '<div style="margin:8px 0;padding:6px;background:rgba(56,189,248,0.15);border:1px solid #38bdf8;border-radius:3px;color:#38bdf8;font-size:11px;font-weight:700">★ SECTOR MASTERY BOUNTY: +' + G.sectorVictoryResult.coresEarned + ' NANITE CORES! ★</div>' : '';

    const winTitle = curAsc > 0 ? 'ASCENSION ' + asc.badge + ' CONQUERED!' : secName + ' SECURED!';
    const winSub = curAsc > 0 ?
      'The Pact of Punishment was shattered! Next Ascension Protocol unlocked.' :
      'All 20 waves destroyed. Sector operational grid stabilized.';
    h = '<div class="ov-box" style="border-top-color:' + (curAsc > 0 ? asc.color : '#34d399') + '"><h2 style="color:' + (curAsc > 0 ? asc.color : '#34d399') + '">' + winTitle + '</h2><div class="sub">' + winSub + '</div>' +
      bountyText +
      '<div class="ov-stats" style="grid-template-columns:repeat(4, 1fr);margin-bottom:12px"><div><label>SCORE</label><b>' + (G ? G.score : 0) + '</b></div><div><label>BEST</label><b>' + SAVE.bestScore + '</b></div><div><label>CORES</label><b style="color:#38bdf8">' + (SAVE.cores || 0) + '</b></div><div><label>KILLS</label><b>' + (G ? G.kills : 0) + '</b></div></div>' +
      '<div class="ov-btns"><button class="primary big" data-ov="endless" tabindex="-1">' + svg('inf') + 'Endless mode</button><button class="ghost" data-ov="to_menu" tabindex="-1">Sector Dossier</button><button class="ghost" data-ov="open_workshop" tabindex="-1">Workshop HQ</button><button class="ghost" data-ov="again" tabindex="-1">New Game</button></div></div>';
  }
  ov.innerHTML = h; ov.classList.add('show');
  if (kind === 'menu' && curSecObj) {
    const mini = $('secMiniCanvas');
    if (mini) renderSectorMiniPreview(mini, curSecObj);
  }
}
