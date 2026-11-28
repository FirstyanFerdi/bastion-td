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
  canvas.addEventListener('wheel', e => {
    if (e.shiftKey && G && (G.state === 'prep' || G.state === 'active')) {
      e.preventDefault();
      const p = canvasPos(e);
      const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
      if (typeof triggerTectonicShift === 'function') triggerTectonicShift(col, row);
    }
  }, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.state === 'active') G.paused = true; });
  document.addEventListener('click', e => {
    const b = e.target.closest ? e.target.closest('button') : null;
    if (b && b.blur) setTimeout(() => b.blur(), 0);
  });
  $('speedSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b && G) setSpeed(Number(b.dataset.speed)); });
  $('btnPause').addEventListener('click', () => { Sfx.init(); togglePause(); });
  $('btnMute').addEventListener('click', toggleMute);
  $('btnCall').addEventListener('click', () => { Sfx.init(); Sfx.resume(); if (G.state === 'menu') return; Sfx.play('click'); callWave(); });
  $('dock').addEventListener('click', e => {
    const dep = e.target.closest('.deployable-shop');
    if (dep) {
      Sfx.init(); Sfx.resume();
      if (!G || (G.state !== 'prep' && G.state !== 'active')) return;
      const dType = dep.dataset.deployType;
      if (dType === 'prism') {
        G.placingPrism = !G.placingPrism;
        G.placingBarricade = null;
      } else {
        G.placingBarricade = !G.placingBarricade;
        G.placingPrism = null;
      }
      G.placing = null; G.placingMegastructure = null; G.sel = null; G.casting = null;
      G.uiDirty = true; Sfx.play('click');
      return;
    }
    const ms = e.target.closest('.megastructure-shop');
    if (ms) { Sfx.init(); Sfx.resume(); selectMegaShop(ms.dataset.megaType); return; }
    const s = e.target.closest('.shop');
    if (s) { Sfx.init(); Sfx.resume(); selectShop(s.dataset.type); }
  });
  const wc = $('waveCard');
  if (wc) {
    wc.addEventListener('click', e => {
      const b = e.target.closest('button[data-act="sign_contract"]');
      if (b && b.dataset.contract) {
        G.activeContract = b.dataset.contract;
        G.uiDirty = true;
        Sfx.play('upgrade');
      }
    });
  }
  $('cmdSkills').addEventListener('click', e => {
    const b = e.target.closest('.cmd-btn');
    if (b && b.dataset.skill) triggerSkill(b.dataset.skill);
  });
  $('inspector').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'toggle_gambit') {
      if (typeof activateGambit === 'function') activateGambit(b.dataset.gambit);
      return;
    }
    if (act === 'set_insp_tab') {
      if (b.dataset.tab) {
        G.inspectorTab = b.dataset.tab;
        renderInspector();
        Sfx.play('click');
      }
      return;
    }
    if (act === 'open_chimera_draft') {
      showOverlay('chimera_draft');
      return;
    }
    if (act === 'trigger_bullet_time') {
      if (typeof triggerBulletTime === 'function') triggerBulletTime();
      return;
    }
    if (act === 'rotate_prism') {
      if (G.sel && typeof rotatePrism === 'function') rotatePrism(G.sel);
      return;
    }
    if (act === 'dismantle_prism') {
      if (G.sel && G.sel.type === 'photon_prism') {
        const pr = G.sel;
        const refund = 42;
        G.gold += refund;
        if (G.grid[pr.r] && G.grid[pr.r][pr.c] === pr) G.grid[pr.r][pr.c] = null;
        const idx = G.prisms ? G.prisms.indexOf(pr) : -1;
        if (idx !== -1) G.prisms.splice(idx, 1);
        if (typeof checkSingularityPens === 'function') checkSingularityPens();
        burst(pr.x, pr.y, 15, '#38bdf8', 80, 0.4, 3, false);
        addText(pr.x, pr.y - 18, '+' + refund + 'G SALVAGED', '#fbbf24', 12);
        G.sel = null; G.uiDirty = true;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('sell');
      }
      return;
    }
    if (act === 'trigger_rhythm_oc') {
      if (G.sel && typeof triggerRhythmOverclock === 'function') {
        triggerRhythmOverclock(G.sel, b.dataset.quality || 'perfect');
      }
      return;
    }
    if (!G.sel) return;
    if (act === 'upgrade') upgradeTower(G.sel, b.dataset.branch);
    else if (act === 'sell') sellTower(G.sel);
    else if (act === 'prio') { G.sel.prio = b.dataset.prio; G.uiDirty = true; Sfx.play('click'); }
    else if (act === 'overdrive') { triggerOverdrive(G.sel); }
    else if (act === 'fuse') {
      const eligible = typeof getEligibleFusion === 'function' ? getEligibleFusion(G.sel) : null;
      if (eligible && typeof fuseTowers === 'function') {
        fuseTowers(G.sel, eligible.partner);
      }
    }
    else if (act === 'socket') {
      if (typeof socketChip === 'function') socketChip(G.sel, b.dataset.chip);
      G.uiDirty = true;
      Sfx.play('upgrade');
    }
    else if (act === 'unsocket') {
      if (typeof unsocketChip === 'function') unsocketChip(G.sel, Number(b.dataset.slot));
      G.uiDirty = true;
      Sfx.play('click');
    }
    else if (act === 'start_synapse') {
      G.synapseSource = G.sel;
      addText(G.sel.x, G.sel.y - 25, 'SELECT TARGET TOWER [N]', '#ec4899', 12);
      G.uiDirty = true;
      Sfx.play('click');
    }
    else if (act === 'sever_synapse') {
      if (typeof removeNeuralSynapse === 'function') removeNeuralSynapse(b.dataset.syn);
      G.uiDirty = true;
      Sfx.play('click');
    }
    else if (act === 'dismantle_mega' && G.sel && MEGASTRUCTURE_CONFIG && MEGASTRUCTURE_CONFIG[G.sel.type]) {
      const ms = G.sel;
      const refund = Math.floor(MEGASTRUCTURE_CONFIG[ms.type].cost * 0.7);
      G.gold += refund;
      for (let r = ms.r; r <= ms.r + 1; r++) {
        for (let c = ms.c; c <= ms.c + 1; c++) {
          if (G.grid[r][c] === ms) G.grid[r][c] = null;
        }
      }
      const idx = G.megastructures.indexOf(ms);
      if (idx !== -1) G.megastructures.splice(idx, 1);
      burst(ms.x, ms.y, 20, ms.color, 100, 0.4, 3, false);
      addText(ms.x, ms.y - 20, '+' + refund + 'G DISMANTLED', '#fbbf24', 13);
      G.sel = null; G.uiDirty = true;
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('sell');
    }
    else if (act === 'overclock_mega' && G.sel && MEGASTRUCTURE_CONFIG && MEGASTRUCTURE_CONFIG[G.sel.type]) {
      const ms = G.sel;
      const ocCost = 40;
      if (G.gold >= ocCost && !ms.overclockT && !ms.isBroken) {
        G.gold -= ocCost;
        ms.overclockT = 15;
        burst(ms.x, ms.y, 25, ms.color, 140, 0.6, 4, true);
        addRing(ms.x, ms.y, 10, 60, 0.5, ms.color, 4);
        addText(ms.x, ms.y - 25, 'CORE OVERCLOCKED!', '#f59e0b', 14);
        G.uiDirty = true;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
      } else {
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
      }
    }
    else if (act === 'repair_mega' && G.sel && MEGASTRUCTURE_CONFIG && MEGASTRUCTURE_CONFIG[G.sel.type]) {
      const ms = G.sel;
      const conf = MEGASTRUCTURE_CONFIG[ms.type];
      const maxDur = ms.maxDurability || conf.maxDurability || 3;
      const repCost = conf.repairCost || Math.floor(conf.cost * 0.35);
      const isDamaged = ms.isBroken || (ms.durability !== undefined && ms.durability < maxDur);
      if (G.gold >= repCost && isDamaged) {
        G.gold -= repCost;
        ms.durability = maxDur;
        ms.isBroken = false;
        ms.active = true;
        burst(ms.x, ms.y, 30, '#38bdf8', 150, 0.6, 4, true);
        addRing(ms.x, ms.y, 10, 80, 0.5, '#38bdf8', 4);
        addText(ms.x, ms.y - 30, 'FACILITY REPAIRED & ONLINE!', '#34d399', 14);
        G.uiDirty = true;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
      } else {
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
      }
    }
    else if (act === 'repair_barricade' && G.sel && G.sel.hp !== undefined) {
      const bar = G.sel;
      const repCost = 15;
      if (G.gold >= repCost && bar.hp < bar.maxHp) {
        G.gold -= repCost;
        bar.hp = Math.min(bar.maxHp, bar.hp + 150);
        burst(bar.x, bar.y, 15, '#38bdf8', 80, 0.4, 3, false);
        addText(bar.x, bar.y - 18, '+150 HP REPAIRED', '#38bdf8', 12);
        G.uiDirty = true;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
      } else {
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
      }
    }
    else if (act === 'dismantle_barricade' && G.sel && G.sel.hp !== undefined) {
      const bar = G.sel;
      const refund = 25;
      G.gold += refund;
      const idx = G.barricades ? G.barricades.indexOf(bar) : -1;
      if (idx !== -1) G.barricades.splice(idx, 1);
      burst(bar.x, bar.y, 15, '#38bdf8', 80, 0.4, 3, false);
      addText(bar.x, bar.y - 18, '+' + refund + 'G SALVAGED', '#fbbf24', 12);
      G.sel = null;
      G.uiDirty = true;
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('sell');
    }
    else if (act === 'target_part') {
      if (G.sel && G.sel.parts) {
        G.sel.activeTargetPart = b.dataset.part;
        G.uiDirty = true;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
      }
    }
    else if (act === 'titan_grapple') {
      if (G.activeBossTitan && typeof mechGrappleStrike === 'function') {
        mechGrappleStrike(G.activeBossTitan);
        G.uiDirty = true;
      }
    }
    else if (act === 'collapse_crag') {
      const cragId = b.dataset.crag;
      const crag = G.destructibleCrags && G.destructibleCrags.find(c => c.id === cragId);
      if (crag && typeof triggerRockslide === 'function') {
        triggerRockslide(crag);
        G.uiDirty = true;
      }
    }
    else if (act === 'set_cyber_logic') {
      // Handled via inspector change listener
    }
  });
  $('inspector').addEventListener('change', e => {
    const sel = e.target.closest('select');
    if (!sel || !G.sel) return;
    const act = sel.dataset.act;
    if (act === 'set_cyber_logic') {
      G.sel.cyberLogic = sel.value;
      G.uiDirty = true;
      Sfx.play('click');
      const conf = (typeof CYBER_LOGIC_PRESETS !== 'undefined') ? CYBER_LOGIC_PRESETS[sel.value] : null;
      if (conf) addText(G.sel.x, G.sel.y - 25, conf.name, conf.color || '#38bdf8', 13);
    }
  });
  if ($('btnWorkshop')) {
    $('btnWorkshop').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('workshop');
    });
  }
  if ($('btnCodex')) {
    $('btnCodex').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('codex');
    });
  }
  if ($('btnMatrix')) {
    $('btnMatrix').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('matrix');
    });
  }
  if ($('btnThermalPurge')) {
    $('btnThermalPurge').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerThermalPurge === 'function') triggerThermalPurge();
    });
  }
  if ($('btnChrono')) {
    $('btnChrono').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerChronoRewind === 'function') triggerChronoRewind();
    });
  }
  if ($('btnOverload')) {
    $('btnOverload').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerCoreOverload === 'function') triggerCoreOverload();
    });
  }
  if ($('btnMechPilot')) {
    $('btnMechPilot').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof toggleMechPilot === 'function') toggleMechPilot();
    });
  }
  if ($('btnDreadnought')) {
    $('btnDreadnought').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerDreadnoughtStrike === 'function') triggerDreadnoughtStrike();
    });
  }
  if ($('btnChronosSpear')) {
    $('btnChronosSpear').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      const tx = (G && G.mouse && G.mouse.in) ? G.mouse.x : (W / 2);
      const ty = (G && G.mouse && G.mouse.in) ? G.mouse.y : (H / 2);
      if (typeof triggerChronosSpear === 'function') triggerChronosSpear(tx, ty);
    });
  }
  if ($('btnCompanionMode')) {
    $('btnCompanionMode').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof setMechCompanionMode === 'function') setMechCompanionMode();
    });
  }
  if ($('btnTitanParry')) {
    $('btnTitanParry').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerTitanParry === 'function') triggerTitanParry();
    });
  }
  if ($('btnExpedition')) {
    $('btnExpedition').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('expedition');
    });
  }
  if ($('btnQuantumHeat')) {
    $('btnQuantumHeat').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('quantum_heat');
    });
  }
  if ($('btnGeneLab')) {
    $('btnGeneLab').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('gene_lab');
    });
  }
  if ($('btnLogistics')) {
    $('btnLogistics').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('logistics');
    });
  }
  if ($('btnBonds')) {
    $('btnBonds').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('logistics');
    });
  }
  if ($('btnBourse')) {
    $('btnBourse').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('bourse');
    });
  }
  if ($('btnEngrams')) {
    $('btnEngrams').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('engrams');
    });
  }
  if ($('btnAnchor')) {
    $('btnAnchor').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof dropChronoAnchor === 'function') dropChronoAnchor();
    });
  }
  if ($('btnDirective')) {
    $('btnDirective').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('directive');
    });
  }
  if ($('btnForensics')) {
    $('btnForensics').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('forensics');
    });
  }
  if ($('btnParadox')) {
    $('btnParadox').addEventListener('click', () => {
      Sfx.init(); Sfx.resume();
      if (typeof triggerParadoxCollapse === 'function') triggerParadoxCollapse();
    });
  }
  if ($('btnExosuit')) {
    $('btnExosuit').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      if (G) {
        const order = ['vanguard', 'phantom', 'archon'];
        const cur = G.exosuitType || 'vanguard';
        const nxt = order[(order.indexOf(cur) + 1) % order.length];
        if (typeof setTitanExosuit === 'function') setTitanExosuit(nxt);
      }
    });
  }
  if ($('chipSector')) {
    $('chipSector').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('menu');
    });
  }

  // Action Category Tab Switcher
  if (typeof document !== 'undefined' && document.querySelectorAll) {
    const actionTabs = document.querySelectorAll('.action-tab');
    if (actionTabs && actionTabs.forEach) {
      actionTabs.forEach(btn => {
        if (btn.addEventListener) {
          btn.addEventListener('click', () => {
            Sfx.init(); Sfx.resume && Sfx.resume();
            if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
            setActionTab(btn.dataset.tab, true);
          });
        }
      });
    }
  }
  $('overlay').addEventListener('click', e => {
    const card = e.target.closest('[data-perk]');
    if (card && G.drafting) { selectPerk(card.dataset.perk); return; }
    const upgBtn = e.target.closest('[data-ov="hq_upg"]');
    if (upgBtn && upgBtn.dataset.upg) {
      upgradeWorkshop(upgBtn.dataset.upg);
      showOverlay('workshop');
      return;
    }
    const b = e.target.closest('button'); if (!b) return;
    Sfx.init(); Sfx.resume();
    const a = b.dataset.ov;
    if (a === 'asc_prev') {
      setAscension((SAVE.ascension || 0) - 1);
      showOverlay('menu');
      Sfx.play('click');
      return;
    } else if (a === 'asc_next') {
      setAscension((SAVE.ascension || 0) + 1);
      showOverlay('menu');
      Sfx.play('click');
      return;
    } else if (a === 'set_doctrine') {
      setDoctrine(b.dataset.doc);
      showOverlay('menu');
      Sfx.play('click');
      return;
    } else if (a === 'set_sector') {
      if (b.dataset.sec && typeof setSector === 'function') {
        setSector(b.dataset.sec);
        showOverlay('menu');
        Sfx.play('click');
      }
      return;
    }
    if (a === 'start' || a === 'again') { begin(); Sfx.play('click'); }
    else if (a === 'endless') { showOverlay(null); G.endless = true; G.state = 'prep'; G.prepT = 15; G.uiDirty = true; wcWave = -1; Sfx.play('click'); }
    else if (a === 'to_menu') { if (G) G.state = 'menu'; showOverlay('menu'); Sfx.play('click'); }
    else if (a === 'open_workshop') { showOverlay('workshop'); Sfx.play('click'); }
    else if (a === 'close_workshop') { showOverlay(G && G.state === 'menu' ? 'menu' : null); Sfx.play('click'); }
    else if (a === 'accept_protocol') {
      if (b.dataset.protocol && typeof applyCursedProtocol === 'function') {
        applyCursedProtocol(b.dataset.protocol);
        showOverlay(null);
      }
    }
    else if (a === 'unlock_matrix') {
      if (b.dataset.proto && typeof unlockMatrixProtocol === 'function') {
        unlockMatrixProtocol(b.dataset.proto);
        showOverlay('matrix');
      }
    }
    else if (a === 'close_matrix') {
      showOverlay(G && G.state === 'menu' ? 'menu' : null);
      Sfx.play('click');
    }
    else if (a === 'bribe_syndicate') {
      if (typeof bribeSyndicate === 'function') bribeSyndicate();
      showOverlay(null);
    }
    else if (a === 'raid_syndicate') {
      if (typeof raidSyndicate === 'function') raidSyndicate();
      showOverlay(null);
    }
    else if (a === 'close_syndicate') {
      showOverlay(null);
      Sfx.play('click');
    }
    else if (a === 'select_vault') {
      if (b.dataset.vault && typeof selectAnomalyVault === 'function') {
        selectAnomalyVault(b.dataset.vault);
      }
    }
    else if (a === 'buy_splice') {
      if (b.dataset.splice && typeof applyGeneSplice === 'function') {
        applyGeneSplice(b.dataset.splice);
        showOverlay('gene_lab');
      }
    }
    else if (a === 'bind_curio') {
      if (b.dataset.curio && typeof applyDarkCurio === 'function') {
        applyDarkCurio(b.dataset.curio);
        showOverlay('gene_lab');
      }
    }
    else if (a === 'close_gene_lab') {
      showOverlay(G && G.state === 'menu' ? 'menu' : null);
      Sfx.play('click');
    }
    else if (a === 'start_expedition_node') {
      if (b.dataset.node && typeof startExpeditionNode === 'function') {
        startExpeditionNode(b.dataset.node);
        showOverlay(null);
      }
    }
    else if (a === 'close_expedition') {
      showOverlay(null);
      Sfx.play('click');
    }
    else if (a === 'pick_chimera_draft') {
      const choiceIdx = parseInt(b.dataset.choice, 10);
      if (G && G.chimeraDraft && G.chimeraDraft[choiceIdx]) {
        const choice = G.chimeraDraft[choiceIdx];
        const target = G.sel || (G.towers && G.towers[0]);
        if (target && typeof applyChimeraAffix === 'function') {
          applyChimeraAffix(target, choice.prefix.id, choice.suffix.id);
          G.chimeraDraft = null;
          showOverlay(null);
        }
      }
    }
    else if (a === 'close_chimera_draft') {
      showOverlay(null);
      Sfx.play('click');
    }
    else if (a === 'toggle_heat_mod') {
      if (b.dataset.mod && typeof toggleQuantumHeatModifier === 'function') {
        toggleQuantumHeatModifier(b.dataset.mod);
        showOverlay('quantum_heat');
      }
    }
    else if (a === 'close_heat') {
      showOverlay(null);
      Sfx.play('click');
    }
    else if (a === 'set_policy') {
      if (b.dataset.policy && typeof setLogisticsPolicy === 'function') {
        setLogisticsPolicy(b.dataset.policy);
        showOverlay('logistics');
      }
    }
    else if (a === 'syndicate_loan') {
      if (typeof takeSyndicateLoan === 'function') {
        takeSyndicateLoan();
        showOverlay('logistics');
      }
    }
    else if (a === 'bourse_trade') {
      const comm = b.dataset.comm;
      const act = b.dataset.trade;
      if (typeof tradeBourse === 'function') {
        tradeBourse(comm, act, 10);
        showOverlay('bourse');
      }
    }
    else if (a === 'void_bargain') {
      const vid = b.dataset.bargain;
      if (typeof acceptVoidBargain === 'function') {
        acceptVoidBargain(vid);
        showOverlay('bourse');
      }
    }
    else if (a === 'sign_edict') {
      const cardEl = b.closest('[data-edict]');
      const eId = (cardEl && cardEl.dataset.edict) || b.dataset.edict;
      if (eId && G) {
        G.edicts = G.edicts || [];
        if (!G.edicts.includes(eId)) G.edicts.push(eId);
        G.edictModal = null;
        showOverlay(null);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
        if (typeof addText === 'function') addText(W / 2, 140, 'EDICT RATIFIED: ' + (typeof SOVEREIGN_EDICTS !== 'undefined' && SOVEREIGN_EDICTS[eId] ? SOVEREIGN_EDICTS[eId].name : eId), '#38bdf8', 18);
        G.uiDirty = true;
      }
    }
    else if (a === 'socket_engram') {
      const egId = b.dataset.engramId;
      if (G && G.sel && egId && typeof socketCyberEngram === 'function') {
        socketCyberEngram(G.sel, egId);
        showOverlay('engrams');
        G.uiDirty = true;
      }
    }
    else if (a === 'scan_forensics') {
      if (G && G.nemesis) {
        G.nemesis.scannedThisWave = true;
        burst(W / 2, H / 2, 22, '#a855f7', 150, 0.5, 3.5, true);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('matrix_unlock');
        addText(W / 2, H / 2, 'SWARM FREQUENCIES DECODED!', '#a855f7', 16);
        showOverlay(null);
      }
    }
    else if (a === 'close_smuggler' || a === 'close_codex' || a === 'close') {
      showOverlay(G && G.state === 'menu' ? 'menu' : null);
      Sfx.play('click');
    }
  });
  last = performance.now();
  requestAnimationFrame(frame);
}

function setActionTab(tabName, isManual) {
  const gSys = typeof $ === 'function' ? $('groupSystems') : (typeof document !== 'undefined' ? document.getElementById('groupSystems') : null);
  const gProto = typeof $ === 'function' ? $('groupProtocols') : (typeof document !== 'undefined' ? document.getElementById('groupProtocols') : null);
  if (typeof document !== 'undefined' && document.querySelectorAll) {
    const tabs = document.querySelectorAll('.action-tab');
    if (tabs && tabs.forEach) {
      tabs.forEach(t => {
        if (t.dataset && t.dataset.tab === tabName) {
          if (t.classList && t.classList.add) t.classList.add('active');
        } else {
          if (t.classList && t.classList.remove) t.classList.remove('active');
        }
      });
    }
  }

  if (gSys && gProto && gSys.style && gProto.style) {
    if (tabName === 'facilities') {
      gSys.style.display = 'flex';
      gProto.style.display = 'none';
    } else if (tabName === 'protocols') {
      gSys.style.display = 'none';
      gProto.style.display = 'flex';
    } else { // 'all'
      gSys.style.display = 'flex';
      gProto.style.display = 'flex';
    }
  }
  if (typeof G !== 'undefined' && G) {
    G.currentActionTab = tabName;
    if (isManual) G.actionTabLocked = (tabName === 'all');
  }
}

init();

// Small debug/test hook (harmless in production)
window.__nb = { setDoctrine, COMMANDER_DOCTRINES, MODULAR_CHIPS, HIVE_MUTATIONS, TITAN_BOSSES, DEFENSE_CONTRACTS, socketChip, unsocketChip, swapTowers, addChip, maxChipsForTier, get G() { return G; }, begin, update, render, startWave, placeTower, upgradeTower, sellTower, callWave, endGame, buildSpawns, hpScale, TD, ED, refreshUI, triggerSkill, selectPerk, PERKS, COMMANDER_SKILLS, WAVE_MUTATORS, getTierData, addCores, upgradeWorkshop, getWorkshopLevel, getUpgradeCost, WORKSHOP_UPGRADES, SAVE, showOverlay, detonateFuelCell, LEYLINE_NODES, getLeylineAt, PLEN_BREACH, PATH_BREACH, getTowerCost, ASCENSION_MODIFIERS, getAscensionData, setAscension, unlockNextAscension, getGridPowerStatus, getTowerPower, triggerOverdrive, MAP_SECTORS, loadSector, setSector, getSectorMastery, recordSectorProgress, isSectorUnlocked, FUSION_RECIPES, CURSED_PROTOCOLS, FIELD_ANOMALIES, HIVE_COUNTER_TRAITS, fuseTowers, triggerCoreOverload, applyCursedProtocol, getEligibleFusion, isCodexDiscovered, recordCodexDiscovery, getCodexProgress, spawnFieldAnomaly, RESONANCE_CONDUITS, THERMAL_CONFIG, BIOMASS_CONFIG, TACTICAL_MATRIX_PROTOCOLS, updateResonanceConduits, triggerThermalPurge, addBiomassCreep, cleanseBiomassCreep, hasMatrixProtocol, unlockMatrixProtocol, recordTimeSnapshot, triggerChronoRewind, createNeuralSynapse, removeNeuralSynapse, getTowerSynapses, reclaimCorpse, bribeSyndicate, raidSyndicate, triggerTectonicShift, CHRONO_CONFIG, NEURAL_SYNAPSE_CONFIG, RECLAIMER_CONFIG, SYNDICATE_CONFIG, toggleMechPilot, mechFireVulcan, mechSwingBlade, triggerDreadnoughtStrike, triggerAnomalyVault, selectAnomalyVault, spawnDropPod, updateWartimeMarket, hasRelic, TITAN_MECH_CONFIG, DREADNOUGHT_CONFIG, ANOMALY_RELICS, ANOMALY_VAULTS, CYBER_LOGIC_PRESETS, MARKET_CONFIG, setActionTab,
  // 8.0 Masterclass AAA/Indie Exports
  canPlaceMegastructure, placeMegastructure, updateMegastructures, setupBossMultiParts, damageBossPart, mechGrappleStrike, routeLogistics, updateLogistics, recordPheromoneDeath, updatePheromones, applyGeneSplice, applyDarkCurio, MEGASTRUCTURE_CONFIG, MULTI_PART_TITAN_CONFIG, LOGISTICS_CONFIG, GENE_SPLICING_CONFIG, DARK_TECH_CURIOS,
  // 9.0 Living Ecosystem & Nemesis Network Exports
  addSoilTile, setWeather, updateEcology, updateProfiler, damageCrag, triggerRockslide, placeBarricade, feedGorger, recordNemesisEscape, spawnNemesisCommander, ECOSYSTEM_CONFIG, NEURAL_NEMESIS_CONFIG, DESTRUCTIBLE_TERRAIN_CONFIG, ECO_MUTATION_CONFIG,
  // 10.0 Crucible of Ascendancy Exports
  CRUCIBLE_GAMBITS, PHOTON_PRISM_CONFIG, ENIGMA_BOSS_CONFIG, PANDORA_RELICS, SKILL_PROFILER_CONFIG, trackPlayerAction, updateSkillProfiler, activateGambit, canPlacePrism, placePrism, rotatePrism, checkSingularityPens, updatePrisms, updateEnigmaBoss, damageCatalystPylon, triggerBulletTime, paintBulletTimeTarget, triggerRhythmOverclock, applyPandoraRelic, spawnMidasCoin, collectMidasCoin, updateMidasCoins,
  // 11.0 The Infinite Chronicles Exports
  EXPEDITION_NODE_TYPES, generateExpeditionTree, CHIMERA_PREFIXES, CHIMERA_SUFFIXES, RULE_BENDING_RELICS, NEMESIS_GENOME_TRAITS, QUANTUM_HEAT_MODIFIERS, CHAOS_INCURSIONS, DYNAMIC_ENTROPY_CONFIG, generateChimeraDraft, applyChimeraAffix, applyRuleBendingRelic, evolveNemesisGenome, triggerDynamicPathMorph, triggerChaosIncursion, resolveChaosIncursion, toggleQuantumHeatModifier, startExpeditionNode, completeExpeditionNode, updateInfiniteChronicles,
  // 12.0 Sovereign Depth & Strategic Logistics Exports
  MUNITIONS_LOGISTICS_CONFIG, SOVEREIGN_EDICTS, HARMONIC_LATTICE_CONFIG, CORRUPTED_CHIPS, setLogisticsPolicy, takeSyndicateLoan, hasEdict, consumeTowerAmmo, getTowerAmmoType, updateHarmonicLattices, pointInTriangle,
  // 13.0 Visceral Resonance Exports
  VISCERAL_CONFIG, triggerCitadelAegis, checkCitadelAegis, triggerTitanParry, spawnHostileMortar, detonateMortar, spawnOverkillDebris, triggerChronosSpear, executeChronosSpearImpact, updateChronosChasm, setMechCompanionMode, triggerMechVoiceLine, updateMechAutonomousBehavior, updateVisceralSystems,
  // 14.0 The Omni-Resonance Matrix & Hyper-Evolution Exports
  FRANKENSTEIN_FOUNDRY_CONFIG, ALCHEMY_MATRIX_CONFIG, SENTIENT_HIVEMIND_CONFIG, QUANTUM_BOURSE_CONFIG, TITAN_EXOSUIT_CONFIG,
  craftCustomTower, titanLiftTower, titanDeployTower, titanToggleLift, tetherTowerOvercharge, setTitanExosuit, spawnSteamCloud, spawnBioGasCloud, detonateThermobaricBioGas, tradeBourse, acceptVoidBargain, updateHyperEvolutionSystems,
  // 15.0 Apex Ascendant Exports
  CHRONO_NEXUS_CONFIG, DNTM_CONFIG, GEOMORPHIC_CONFIG, CYBER_ENGRAMS_DATABASE, ADRENALINE_GAMBLE_CONFIG,
  dropChronoAnchor, triggerChronoReverberation, recordChronoEvent, createGeomorphicFissure, deployZeroGravityField, socketCyberEngram, triggerTitanFinisher, updateDNTMProfiler, updateApexAscendantSystems,
  // 16.0 Adaptive Entropy Matrix Exports
  ENTROPY_CONFIG, PHENOTYPIC_MUTATIONS, TACTICAL_DIRECTIVES,
  triggerPrismaticDetonation, triggerThermalShockShatter, triggerKineticBreakout, triggerFlankBreach, spawnSyndicateHeistRig, resolveSyndicateHeistBounty, generateHighCommandDirective, resolveDirectiveReward, updateEntropyProfiler, updateAdaptiveEntropySystems,
  // 17.0 The Chrono-Tactical Singularity Exports
  SINGULARITY_CONFIG, NEMESIS_CONFIG, PARADOX_CONFIG,
  spawnHostileArtillery, triggerKineticParry, triggerCorpseCrush, triggerCorpseSiphon, triggerHarmonicOverdrive, triggerParadoxCollapse, updateNemesisAI, updateSingularityNexusSystems,
  // 18.0 The Cataclysmic Convergence Exports
  CATACLYSM_CONFIG, OMEGA_CRISIS_CONFIG, PREDATOR_SCALING_CONFIG,
  triggerCataclysmEvent, triggerBlizzardShatter, triggerOmegaCrisis, purgeReactorValve, severQueenTether, resolveOmegaCrisis, triggerCrisisTriumph, distToSegment, updateCataclysmSystems, updateOmegaCrisisSystems, updatePredatorScalingSystems,
  // 19.0 The Omni-Synthesis Crucible & Evolutionary Phylogeny Matrix Exports
  OMNI_SYNTHESIS_CONFIG, MODULAR_SUBCORE_DATABASE, ADAPTIVE_PHYLOGENY_CONFIG, PARADIGM_SHIFT_CONFIG,
  triggerBoseEinsteinSingularity, triggerThermobaricCyclone, triggerTachyonWeb, triggerMagmaGeyser, socketSubCore, createFluxConduit, removeFluxConduit, activateParadigmShift, speciateTaxa, updateOmniSynthesisSystems, updatePhylogenyDirector, updateParadigmShiftSystems,
  // 20.0 The Transcendent Architecture & Non-Euclidean Crucible Exports
  SPACE_FOLD_CONFIG, EPIGENETIC_SWARM_CONFIG, OVERCLOCK_CONFIG, PARADOX_COOP_CONFIG, TITAN_STANCE_CONFIG,
  createSpatialFold, updateSpatialFolds, triggerAbyssalTear, stabilizeSpatialFold, updateEpigeneticEvolution, applyEpigeneticMutagen, setTowerThrottle, coolTower, triggerCoreMeltdown, recordParadoxSnapshot, recordParadoxCoopSnapshot, triggerParadoxCoop, updateParadoxCoop, setMechStance, mechParry, mechExecuteFinisher, updateTitanStanceSystems, updateBastion20Systems,
  // 21.0 The Maestro Dynamic Pacing Director & Neuro-Kinetic Tension Engine Exports
  MAESTRO_DIRECTOR_CONFIG, calculatePlayerTension, calculatePlayerProficiency, transitionMaestroPhase, triggerMiracleClutch, offerDirectorGambit, acceptDirectorGambit, resolveDirectorGambit, updateMaestroDirector,
  // 22.0 The Epoch Horizon & Macro-Scale Metamorphosis Exports
  EPOCH_CONFIG, calculatePlayerPowerVector, checkEpochProgression, advanceEpoch, craftScavengerTrap, triggerTectonicChasm, fireOrbitalIonLance, activateChronosSingularity, updateNemesisOvermind, updateEpochSystems,
  // 23.0 The Phoenix Protocol & Causal Failure Metamorphosis Exports
  PHOENIX_CONFIG, triggerPhoenixDoomsday, resolvePhoenixRebirth, generateBlackboxForensics, restoreCausalMonolith, updatePhoenixSystems,
  // 24.0 The Living Biosphere & Dynamic Commodity Crucible Exports
  BIOSPHERE_CONFIG, updateBiosphereSystems, executeCommodityTrade, triggerGeomorphicReaction, fireSensorFlare, deployBioScrubber, settleBiosphereWave, recordBiosphereEndGame, spawnSymbioticBroodling, spawnBioTitanRootWalker,
  // 25.0 The Unified Emergent Crucible Exports
  EMERGENT_CRUCIBLE_CONFIG, appendChainStep, evaluateEmergentNovelty, analyzeMirrorArchitectThreats, applyMediumCoupling, triggerFrozenCrystalRefraction, propagateSurfaceCircuit, triggerThermobaricImpulse, resolveKineticCollision, processTowerRadiantExhaust, updateEmergentSystems, getUnitMass,
  // 26.0 The Topological Crucible & Living Matter Alchemy Exports
  TOPOLOGICAL_ALCHEMY_CONFIG, processCrossfirePinning, triggerOverkillSignalRelay, processGridSpillover, transmuteCorpseMatter, chargeBarricadeCapacitor, detonateBarricadeNova, analyzeSymbioticEcology, updateTopologicalSystems,
  explode, cryoPulse, dealDamage, killEnemy, updateEnemy, updateTower, updateDreadnought
};
