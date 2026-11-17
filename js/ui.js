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
    default: return [['DMG', String(s.dmg)], ['RATE', f1(s.rate) + '/s'], ['RANGE', f1(s.range) + ' t'], ['POWER', '-' + (s.power || 8) + ' MW']];
  }
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
}
function selectShop(type) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
  if (G.placing === type) { G.placing = null; Sfx.play('click'); return; }
  G.placing = type; G.sel = null; G.casting = null; G.uiDirty = true; Sfx.play('click');
  const cost = typeof getTowerCost === 'function' ? getTowerCost(type) : TD[type].cost;
  if (G.gold < cost) {
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
      const cost = typeof getTowerCost === 'function' ? getTowerCost(G.placing) : d.cost;
      box.innerHTML = '<h3>DEPLOYING DEFENSE</h3><div class="insp-name"><div><h4 style="color:' + d.color + '">' + d.name + '</h4><small>' + d.role.toUpperCase() + ' · <i class="coin"></i>' + cost + '</small></div></div>' +
        '<div class="stats-grid">' + statRows(G.placing, 0).map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('') + '</div>' +
        '<div class="note">Click a free grid tile to construct (hold Shift for repeat placement). Esc / Right-Click to cancel.</div>';
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

  const def = TD[t.type], tier = t.tier;
  const cur = statRows(t.type, tier, t.branch);
  const rows = cur.map(r => '<div class="srow"><span>' + r[0] + '</span><span class="sv">' + r[1] + '</span></div>').join('');
  const sell = Math.floor(t.invested * 0.75);
  const isCryo = t.type === 'cryo';
  const isRelay = t.type === 'relay';
  const tierTitle = t.tier === 0 ? 'TIER I' : (t.tier === 1 ? 'TIER II' : 'SPEC: ' + (t.branch ? def.branches[t.branch].name.toUpperCase() : 'TIER III'));

  let leylineHtml = '';
  if (t.leyline) {
    leylineHtml = '<div style="margin:4px 0 6px 0;padding:4px 6px;background:' + t.leyline.color + '1a;border-left:3px solid ' + t.leyline.color + ';border-radius:2px;font-size:10px;color:#f8fafc">' +
      '<span style="color:' + t.leyline.color + ';font-weight:800">LEYLINE: ' + t.leyline.name.toUpperCase() + '</span><br>' +
      '<span style="color:#cbd5e1">' + t.leyline.tip + '</span></div>';
  }

  // Primary Action Area: Upgrade & Sell immediately accessible
  let upgHtml = '';
  if (t.tier === 0) {
    const cost = getUpgradeCost(def.tiers[1].upg);
    upgHtml = '<button class="primary" id="btnUpg" tabindex="-1" data-act="upgrade" data-cost="' + cost + '" style="width:100%">' + svg('up') + 'Upgrade T2 <i class="coin"></i>' + cost + '</button>';
  } else if (t.tier === 1) {
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

  const actsHtml = t.tier === 1 ?
    upgHtml + '<div style="margin-bottom:6px">' + sellBtnHtml + '</div>' :
    '<div class="tower-actions">' + upgHtml + sellBtnHtml + '</div>';

  let relayHtml = '';
  if (isRelay) {
    const isOd = t.overdriveT > 0, isSd = t.shutdownT > 0;
    const odLabel = isOd ? 'OVERDRIVE ACTIVE (' + Math.ceil(t.overdriveT) + 's)' : (isSd ? 'THERMAL SHUTDOWN (' + Math.ceil(t.shutdownT) + 's)' : '⚡ TRIGGER SECTOR OVERDRIVE');
    relayHtml = '<button class="primary" data-act="overdrive" style="width:100%;margin:4px 0;background:' + (isOd ? '#059669' : (isSd ? '#475569' : '#10b981')) + '"' + (isOd || isSd ? ' disabled' : '') + '>' + odLabel + '</button>';
  }

  let chipsHtml = '';
  if (!isRelay) {
    const maxChips = typeof maxChipsForTier === 'function' ? maxChipsForTier(t.tier) : (t.tier === 0 ? 0 : (t.tier === 1 ? 1 : 2));
    if (t.tier === 0) {
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
          const matchesType = cDef.target === 'any' || cDef.target === t.type;
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

  box.innerHTML = '<h3>SELECTED DEFENSE</h3>' +
    '<div class="insp-name"><canvas id="inspIcon" width="48" height="48"></canvas><div><h4 style="color:' + (t.branch ? def.branches[t.branch].color : def.color) + '">' + (t.branch ? def.branches[t.branch].name : def.name) + '</h4><small>' + tierTitle + ' · ' + t.kills + ' KILLS</small></div></div>' +
    leylineHtml +
    actsHtml +
    '<div class="stats-grid">' + rows + '</div>' +
    relayHtml +
    '<div class="prio' + (isCryo || isRelay ? ' off' : '') + '" id="prioBox">' + PRIOS.map(p => '<button tabindex="-1" data-act="prio" data-prio="' + p[0] + '" class="' + (t.prio === p[0] ? 'on' : '') + '">' + p[1] + '</button>').join('') + '</div>' +
    chipsHtml +
    (isCryo ? '<div class="note">Cryo pulses affect all enemies in radius.</div>' : '') +
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
  } else if (G.state === 'active') label = svg('ff') + 'Call wave ' + n + ' early (+' + earlyBonus() + ' gold)';
  else label = 'Standby';
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
    const k = el.dataset.type;
    const cost = typeof getTowerCost === 'function' ? getTowerCost(k) : TD[k].cost;
    el.classList.toggle('poor', G.gold < cost);
    el.classList.toggle('sel', G.placing === k);
  });
  if (G.uiDirty) { G.uiDirty = false; renderInspector(); }
  else if (G.sel) {
    const u = $('btnUpg');
    if (u && G.sel.tier === 0) u.disabled = G.gold < getUpgradeCost(TD[G.sel.type].tiers[1].upg);
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
