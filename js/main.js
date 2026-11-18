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
    const b = e.target.closest('button'); if (!b || !G.sel) return;
    const act = b.dataset.act;
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
  if ($('btnGeneLab')) {
    $('btnGeneLab').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('gene_lab');
    });
  }
  if ($('chipSector')) {
    $('chipSector').addEventListener('click', () => {
      Sfx.init(); Sfx.resume(); Sfx.play('click');
      showOverlay('menu');
    });
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
    else if (a === 'close_smuggler' || a === 'close_codex' || a === 'close') {
      showOverlay(G && G.state === 'menu' ? 'menu' : null);
      Sfx.play('click');
    }
  });
  last = performance.now();
  requestAnimationFrame(frame);
}
init();

// Small debug/test hook (harmless in production)
window.__nb = { setDoctrine, COMMANDER_DOCTRINES, MODULAR_CHIPS, HIVE_MUTATIONS, TITAN_BOSSES, DEFENSE_CONTRACTS, socketChip, unsocketChip, swapTowers, addChip, maxChipsForTier, get G() { return G; }, begin, update, render, startWave, placeTower, upgradeTower, sellTower, callWave, endGame, buildSpawns, hpScale, TD, ED, refreshUI, triggerSkill, selectPerk, PERKS, COMMANDER_SKILLS, WAVE_MUTATORS, getTierData, addCores, upgradeWorkshop, getWorkshopLevel, getUpgradeCost, WORKSHOP_UPGRADES, SAVE, showOverlay, detonateFuelCell, LEYLINE_NODES, getLeylineAt, PLEN_BREACH, PATH_BREACH, getTowerCost, ASCENSION_MODIFIERS, getAscensionData, setAscension, unlockNextAscension, getGridPowerStatus, getTowerPower, triggerOverdrive, MAP_SECTORS, loadSector, setSector, getSectorMastery, recordSectorProgress, isSectorUnlocked, FUSION_RECIPES, CURSED_PROTOCOLS, FIELD_ANOMALIES, HIVE_COUNTER_TRAITS, fuseTowers, triggerCoreOverload, applyCursedProtocol, getEligibleFusion, isCodexDiscovered, recordCodexDiscovery, getCodexProgress, spawnFieldAnomaly, RESONANCE_CONDUITS, THERMAL_CONFIG, BIOMASS_CONFIG, TACTICAL_MATRIX_PROTOCOLS, updateResonanceConduits, triggerThermalPurge, addBiomassCreep, cleanseBiomassCreep, hasMatrixProtocol, unlockMatrixProtocol, recordTimeSnapshot, triggerChronoRewind, createNeuralSynapse, removeNeuralSynapse, getTowerSynapses, reclaimCorpse, bribeSyndicate, raidSyndicate, triggerTectonicShift, CHRONO_CONFIG, NEURAL_SYNAPSE_CONFIG, RECLAIMER_CONFIG, SYNDICATE_CONFIG, toggleMechPilot, mechFireVulcan, mechSwingBlade, triggerDreadnoughtStrike, triggerAnomalyVault, selectAnomalyVault, spawnDropPod, updateWartimeMarket, hasRelic, TITAN_MECH_CONFIG, DREADNOUGHT_CONFIG, ANOMALY_RELICS, ANOMALY_VAULTS, CYBER_LOGIC_PRESETS, MARKET_CONFIG,
  // 8.0 Masterclass AAA/Indie Exports
  canPlaceMegastructure, placeMegastructure, updateMegastructures, setupBossMultiParts, damageBossPart, mechGrappleStrike, routeLogistics, updateLogistics, recordPheromoneDeath, updatePheromones, applyGeneSplice, applyDarkCurio, MEGASTRUCTURE_CONFIG, MULTI_PART_TITAN_CONFIG, LOGISTICS_CONFIG, GENE_SPLICING_CONFIG, DARK_TECH_CURIOS,
  // 9.0 Living Ecosystem & Nemesis Network Exports
  addSoilTile, setWeather, updateEcology, updateProfiler, damageCrag, triggerRockslide, placeBarricade, feedGorger, recordNemesisEscape, spawnNemesisCommander, ECOSYSTEM_CONFIG, NEURAL_NEMESIS_CONFIG, DESTRUCTIBLE_TERRAIN_CONFIG, ECO_MUTATION_CONFIG
};
