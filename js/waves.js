'use strict';
/* Wave flow, win/lose and the fixed-step update() */

/* ============================================================
   WAVES / FLOW
   ============================================================ */
function startWave() {
  G.wave++;
  const n = G.wave, ev = buildSpawns(n), base = G.time + 0.5;
  for (const x of ev) G.queue.push({ at: base + x.t, type: x.type, wave: n, affix: x.affix, threat: x.threat, pathId: x.pathId || 0, titanId: x.titanId || null });
  G.queue.sort((a, b) => a.at - b.at);
  G.state = 'active';
  G.leakedThisWave = 0;
  G.emergencyBlackoutUsed = false;
  // Dynamic Action Tab Switcher: auto-switch to Combat Overrides during wave
  if (typeof setActionTab === 'function' && (!G || !G.actionTabLocked)) {
    setActionTab('protocols', false);
  }
  if (n > SAVE.bestWave) { SAVE.bestWave = n; Store.set('nb_bestWave', n); addCores(3); }

  // 10.0 Crucible Gambits: Blood Oath of the Vanguard (1 Live Only)
  if (G.activeGambit === 'blood_oath') {
    G.lives = 1;
    shake(8);
    const sW = typeof W !== 'undefined' ? W : 960;
    addText(sW / 2, 70, 'BLOOD OATH OF THE VANGUARD: 1 LIVE ONLY! DO NOT LEAK!', '#ef4444', 16);
  }

  // 11.0 Quantum Heat Modifiers
  if (G.activeHeatModifiers && G.activeHeatModifiers.includes('heat_permadeath')) {
    G.lives = Math.min(G.lives, 3);
  }

  // 11.0 Rule Bending Relics: Symbiotic Parasite
  if (G.ruleRelics && G.ruleRelics.symbiotic_parasite && n % 3 === 0) {
    G.lives = Math.max(1, (G.lives || 20) - 1);
    const sW = typeof W !== 'undefined' ? W : 960;
    addText(sW / 2, 85, 'SYMBIOTIC PARASITE: -1 LIFE SACRIFICED', '#f43f5e', 14);
  }

  // 11.0 Dynamic Path Morphing (Every 4 waves)
  if (n % 4 === 0 && !G.dynamicPathMorphed && typeof triggerDynamicPathMorph === 'function') {
    triggerDynamicPathMorph();
  }

  // 11.0 Emergent Chaos Incursions
  if (!G.chaosIncursion && [3, 7, 11].includes(n) && typeof triggerChaosIncursion === 'function') {
    triggerChaosIncursion(n === 3 ? 'smuggler_heist' : (n === 7 ? 'anomaly_rift' : 'solar_emp_storm'));
  }

  // Living Hive Mutation Evaluation (wave >= 6)
  if (n >= 6 && G.damageTrack) {
    const dtTrack = G.damageTrack;
    const totalDmg = (dtTrack.phys || 0) + (dtTrack.cryo || 0) + (dtTrack.energy || 0) + (dtTrack.plasma || 0) + 1;
    const physRatio = (dtTrack.phys || 0) / totalDmg;
    const cryoRatio = (dtTrack.cryo || 0) / totalDmg;
    const energyRatio = ((dtTrack.energy || 0) + (dtTrack.plasma || 0)) / totalDmg;
    if (physRatio >= 0.45) G.hiveMutation = 'chitin';
    else if (cryoRatio >= 0.30) G.hiveMutation = 'insulation';
    else if (energyRatio >= 0.45) G.hiveMutation = 'rubber';
    else if ((G.skillsUsedThisWave || 0) >= 3) G.hiveMutation = 'scrambler';
    else G.hiveMutation = null;
  } else {
    G.hiveMutation = null;
  }
  G.skillsUsedThisWave = 0;

  const boss = n % 5 === 0;
  if (n >= 7 && (n % 2 === 1 || boss)) {
    const mKeys = Object.keys(WAVE_MUTATORS);
    G.mutator = WAVE_MUTATORS[mKeys[(n * 3) % mKeys.length]];
  } else {
    G.mutator = null;
  }

  // 9.0 Atmospheric Micro-Climate Weather Cycling (every 4 waves)
  if (n % 4 === 0) {
    const weathers = ['ion_squall', 'spore_fog'];
    const selected = weathers[Math.floor(((n / 4) - 1)) % weathers.length];
    if (typeof setWeather === 'function') setWeather(selected);
  } else if (n % 4 === 2) {
    if (typeof setWeather === 'function') setWeather('clear');
  }

  // 9.0 Nemesis Commander Scheduled Invasion
  if (G.nemesisRoster && G.nemesisRoster.length > 0 && n >= 6 && n % 3 === 0) {
    const nem = G.nemesisRoster[0];
    if (typeof spawnNemesisCommander === 'function') {
      setTimeout(() => spawnNemesisCommander(nem), 1500);
    }
  }

  // 6.0 Infiltrator Syndicate Dropship Encounter
  if ([6, 12, 18].includes(n)) {
    G.syndicateGunship = {
      x: W - 140, y: 75, hp: (typeof SYNDICATE_CONFIG !== 'undefined' ? SYNDICATE_CONFIG.gunshipMaxHp : 900),
      maxHp: (typeof SYNDICATE_CONFIG !== 'undefined' ? SYNDICATE_CONFIG.gunshipMaxHp : 900),
      state: 'neutral', life: 60.0, droneCd: 1.0, r: 28, active: true
    };
    burst(G.syndicateGunship.x, G.syndicateGunship.y, 35, '#fbbf24', 160, 0.7, 4, true);
    addRing(G.syndicateGunship.x, G.syndicateGunship.y, 10, 80, 0.6, '#fbbf24', 4);
    shake(8);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('syndicate_drop');
    addText(G.syndicateGunship.x, G.syndicateGunship.y - 30, 'MERCENARY GUNSHIP ARRIVED!', '#fbbf24', 16);
  }

  // 7.0 AI Director Blindspot Drop-Pod Incursions (Wave >= 7)
  if (n >= 7 && (n % 4 === 3 || (G.threatIndex && G.threatIndex >= 40))) {
    if (typeof spawnDropPod === 'function') spawnDropPod(n);
  }

  // 18.0 Planetary Cataclysms & Omega Crises Wave Triggers
  if (n === 5 && typeof triggerCataclysmEvent === 'function') {
    triggerCataclysmEvent('magma_fissure');
  } else if (n === 9 && typeof triggerOmegaCrisis === 'function') {
    triggerOmegaCrisis('rogue_harvester');
  } else if (n === 11 && typeof triggerCataclysmEvent === 'function') {
    triggerCataclysmEvent('flash_blizzard');
  } else if (n === 13 && typeof triggerOmegaCrisis === 'function') {
    triggerOmegaCrisis('spore_queen');
  } else if (n === 16 && typeof triggerCataclysmEvent === 'function') {
    triggerCataclysmEvent('ion_surge');
  } else if (n === 17 && typeof triggerOmegaCrisis === 'function') {
    triggerOmegaCrisis('reactor_meltdown');
  }
  let sub = boss ? 'Heavy hostile signature detected' : '';
  if (G.mutator) sub = (sub ? sub + ' · ' : '') + 'MUTATOR: ' + G.mutator.name;
  if (G.hiveMutation && typeof HIVE_MUTATIONS !== 'undefined' && HIVE_MUTATIONS[G.hiveMutation]) {
    sub = (sub ? sub + ' · ' : '') + 'HIVE: ' + HIVE_MUTATIONS[G.hiveMutation].badge;
  }

  if (n === 8) {
    shake(12);
    Sfx.play('boss');
    G.banner = { text: 'STRUCTURAL BREACH!', sub: 'Hostiles flanking from North Route!', t: 0, max: 3.5, color: '#ef4444' };
  } else if (n === 10) {
    shake(14); Sfx.play('boss');
    G.banner = { text: 'TITAN RAID: GOLIATH EXCAVATOR', sub: 'Tectonic drilling titan! Disables defenses at 50% HP!', t: 0, max: 4.0, color: '#f59e0b' };
  } else if (n === 15) {
    shake(14); Sfx.play('boss');
    G.banner = { text: 'TITAN RAID: CHRONO-WEAVER', sub: 'Temporal Anomaly! Reverses path and resurrects fallen hostiles!', t: 0, max: 4.0, color: '#38bdf8' };
  } else if (n === 20) {
    shake(16); Sfx.play('boss');
    G.banner = { text: 'TITAN RAID: APEX SWARM-MOTHER', sub: 'Colossal Hive Queen! Unleashes kamikaze drones & brood!', t: 0, max: 4.5, color: '#ec4899' };
  } else {
    G.banner = { text: boss ? 'BOSS WAVE ' + n : 'WAVE ' + n, sub, t: 0, max: 2.6, color: boss ? '#d9534f' : (G.mutator ? '#f59e0b' : '#e2a72e') };
  }
  if (boss) shake(8);
  Sfx.play('wave');
  G.uiDirty = true;
}
function earlyBonus() {
  if (G.state === 'prep') return G.wave === 0 ? 0 : 8 + Math.ceil(G.prepT * 1.2);
  return 8 + G.wave;
}
function canCall() {
  if (!G || (G.state !== 'prep' && G.state !== 'active') || G.drafting) return false;
  if (G.wave >= WIN_WAVE && !G.endless) return false;
  return true;
}
function callWave() {
  if (!canCall()) return;
  const isMultiWave = G.state === 'active' && G.enemies.length > 0;
  if (isMultiWave) {
    G.callStreak = Math.min(4, (G.callStreak || 1) + 1);
    G.adrenalineHeat = Math.min(5, (G.adrenalineHeat || 1) + 1);
    G.adrenalineT = 15.0; // 15s adrenaline rush
    shake(8);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('streak');
    addText(W / 2, 80, '🔥 ADRENALINE STREAK ' + G.callStreak + 'x! (+ ' + Math.round((G.callStreak - 1) * 40) + '% GOLD & +' + Math.round((G.callStreak - 1) * 50) + '% SCORE)', '#fbbf24', 20);
    if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('adrenaline_rush', 'anomaly');
  } else {
    G.callStreak = 1;
    G.adrenalineHeat = 1;
  }
  const b = earlyBonus() * (G.callStreak || 1);
  if (b > 0) { G.gold += b; addText(W / 2, 108, '+' + b + ' early bonus', '#fbbf24', 18); Sfx.play('coin'); }
  startWave();
}
function onWaveClear() {
  // Dynamic Action Tab Switcher: auto-switch to Facilities during prep
  if (typeof setActionTab === 'function' && (!G || !G.actionTabLocked)) {
    setActionTab('facilities', false);
  }
  G.callStreak = 0;
  G.adrenalineT = 0;
  G.adrenalineHeat = 1;
  G.chronosSpearAvailable = true;
  const n = G.wave, bonus = 25 + n * 4;
  const isVC = hasPerk('venture_capital');
  const intRate = isVC ? 0.14 : 0.08, intCap = isVC ? 260 : 150;
  const interest = Math.min(intCap, Math.floor(G.gold * intRate));
  const ascScoreMult = 1 + (G.ascension || 0) * 0.20;
  const adaptScoreMult = (G && G.adaptabilityScore) || 1.0;
  G.gold += bonus + interest; G.score += Math.round((n * 100 + bonus + interest) * ascScoreMult * adaptScoreMult);
  addText(W / 2, 90, 'WAVE ' + n + ' CLEARED  +' + bonus, '#6ee7b7', 22);
  if (interest > 0) addText(W / 2, 118, 'interest +' + interest + (isVC ? ' (Venture Capital)' : ''), '#fbbf24', 16);
  const earnedCores = addCores(Math.round(1 * (adaptScoreMult > 1.5 ? 2 : 1)));
  addText(W / 2, 142, '+' + earnedCores + ' Nanite Core' + (earnedCores > 1 ? 's' : '') + (adaptScoreMult > 1.0 ? ' (Adaptability x' + adaptScoreMult.toFixed(1) + ')' : ''), '#38bdf8', 14);

  // 5.0 Tactical Protocol Point for Clean Clear
  if (G.leakedThisWave === 0) {
    G.tpp = (G.tpp || 0) + 1;
    addText(W / 2, 164, '★ FLAWLESS DEFENSE: +1 TPP EARNED! ★', '#818cf8', 15);
    burst(W / 2, 164, 20, '#818cf8', 120, 0.5, 3, true);
    G.uiDirty = true;
  }

  // 10.0 Crucible Gambits: Blood Oath Rewards
  if (G.activeGambit === 'blood_oath' && G.leakedThisWave === 0) {
    const extraBloodInt = Math.floor(G.gold * 2.0);
    G.gold += extraBloodInt;
    addCores(3);
    const chipKeys = typeof MODULAR_CHIPS !== 'undefined' ? Object.keys(MODULAR_CHIPS) : [];
    if (chipKeys.length > 0 && typeof addChip === 'function') {
      const luckyChip = chipKeys[Math.floor(Math.random() * chipKeys.length)];
      addChip(luckyChip, 1);
    }
    addText(W / 2, 185, '★ BLOOD OATH FULFILLED! +200% INTEREST (+' + extraBloodInt + 'G) & +3 CORES! ★', '#ef4444', 16);
    burst(W / 2, 185, 30, '#ef4444', 160, 0.7, 4, true);
    Sfx.play('victory');
  }
  Sfx.play('coin');

  // Defense Contract evaluation & reward
  if (G.activeContract && typeof DEFENSE_CONTRACTS !== 'undefined') {
    const cId = G.activeContract;
    const cDef = DEFENSE_CONTRACTS[cId];
    if (cId === 'pacifist' && G.contractFailed) {
      addText(W / 2, 168, 'CONTRACT FAILED: Powers Were Used!', '#fb7185', 16);
    } else {
      addText(W / 2, 168, 'CONTRACT FULFILLED! ' + cDef.rewardText, '#34d399', 18);
      burst(W / 2, 168, 30, '#34d399', 180, 0.7, 4, true);
      if (cDef.rewardGold) G.gold += cDef.rewardGold;
      if (cDef.rewardCores) addCores(cDef.rewardCores);
      if (cDef.rewardChip && typeof addChip === 'function') addChip(cDef.rewardChip, 1);
      if (cDef.rewardInterest) {
        const extraInt = Math.floor(G.gold * cDef.rewardInterest);
        G.gold += extraInt;
        addText(W / 2, 192, 'CONTRACT BONUS INTEREST +' + extraInt, '#fbbf24', 15);
      }
      Sfx.play('victory');
    }
    G.activeContract = null;
    G.contractFailed = false;
  }

  // Cursed Black Market Terminal Offer (Waves 5, 10, 15)
  if ((n === 5 || n === 10 || n === 15) && (!G.smugglerOffered || !G.smugglerOffered[n])) {
    G.smugglerOffered = G.smugglerOffered || {};
    G.smugglerOffered[n] = true;
    setTimeout(() => {
      if (G && !G.drafting) showOverlay('smuggler');
    }, 1200);
  }

  // 7.0 Orbital Dreadnought Charge on Wave Clear
  if (typeof chargeDreadnought === 'function') {
    chargeDreadnought(typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG.chargePerWave : 15);
  }

  // 7.0 Anomaly Vault Expedition (Waves 4, 8, 12, 16...)
  if (n % 4 === 0 && n % 5 !== 0 && typeof triggerAnomalyVault === 'function') {
    triggerAnomalyVault(n);
  }

  // 8.0 Megastructure Wave Degradation & Maintenance Requirement
  if (G.megastructures && G.megastructures.length > 0) {
    for (const ms of G.megastructures) {
      if (!ms.isBroken && ms.active) {
        const maxD = ms.maxDurability || (typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[ms.type] ? MEGASTRUCTURE_CONFIG[ms.type].maxDurability : 3);
        ms.durability = (ms.durability !== undefined ? ms.durability : maxD) - 1;
        if (ms.durability <= 0) {
          ms.durability = 0;
          ms.isBroken = true;
          ms.active = false;
          shake(6);
          burst(ms.x, ms.y, 25, '#ef4444', 130, 0.6, 3.5, true);
          addRing(ms.x, ms.y, 10, 60, 0.5, '#ef4444', 4);
          addText(ms.x, ms.y - 35, 'FACILITY MALFUNCTION! REPAIR NEEDED', '#ef4444', 14);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
        } else {
          addText(ms.x, ms.y - 28, 'INTEGRITY: ' + ms.durability + '/' + maxD + ' WAVES', '#38bdf8', 12);
        }
      }
    }
    G.uiDirty = true;
  }

  // 11.0 Adaptive Nemesis Hive Evolution on Wave Clear
  if (typeof evolveNemesisGenome === 'function') {
    evolveNemesisGenome();
  }

  // 14.0 Quantum Bourse Commodity Price Drift & Void Bankruptcy Countdown
  if (G && G.bourseCommodities) {
    for (const k in G.bourseCommodities) {
      const delta = (Math.random() - 0.48) * 0.40;
      G.bourseCommodities[k] = Math.max(0.4, Math.min(30.0, +(G.bourseCommodities[k] + delta).toFixed(2)));
    }
  }
  if (G && G.chronosBankruptcyWaves > 0) {
    G.chronosBankruptcyWaves--;
    if (G.chronosBankruptcyWaves <= 0) {
      addText(W / 2, 210, 'CHRONOS BANKRUPTCY PENALTY LIFTED', '#34d399', 14);
    }
  }

  // 11.0 Expedition Node Cleared & Chimera Draft
  if (n % 5 === 0 && typeof completeExpeditionNode === 'function') {
    completeExpeditionNode();
  }

  // 12.0 Sovereign Depth: Logistics Resupply, Terra-Scars, Syndicate Debt, Hive Evolution, Edicts
  if (G.logistics && typeof MUNITIONS_LOGISTICS_CONFIG !== 'undefined') {
    const types = MUNITIONS_LOGISTICS_CONFIG.types;
    const autoBonus = typeof hasEdict === 'function' && hasEdict('edict_automation') ? 1.5 : 1.0;
    for (const k of Object.keys(types)) {
      const resupply = Math.round(types[k].resupplyPerWave * autoBonus);
      const capKey = 'max' + k.charAt(0).toUpperCase() + k.slice(1);
      G.logistics[k] = Math.min(G.logistics[capKey] || 1000, (G.logistics[k] || 0) + resupply);
    }
  }

  if (G.terraScars) {
    for (const key of Object.keys(G.terraScars)) {
      G.terraScars[key].wavesLeft--;
      if (G.terraScars[key].wavesLeft <= 0) {
        delete G.terraScars[key];
      }
    }
  }

  if (G.syndicateDebt && G.syndicateDebt.balance > 0) {
    G.syndicateDebt.wavesLeft--;
    if (G.syndicateDebt.wavesLeft <= 0 && !G.syndicateDebt.enforcersSpawned) {
      G.syndicateDebt.enforcersSpawned = true;
      if (typeof addText === 'function') addText(W / 2, 175, '⚠️ SYNDICATE DEBT DEFAULT: ENFORCERS DEPLOYED!', '#f43f5e', 16);
      if (typeof shake === 'function') shake(8);
      for (let ei = 0; ei < 3; ei++) {
        const enforcer = {
          type: 'enforcer_dropship', hp: 800 + n * 120, maxHp: 800 + n * 120,
          speed: 1.1, r: 16, bounty: 0, armor: 15,
          color: '#f43f5e', isBoss: false, d: -ei * 40, x: PATH[0].x, y: PATH[0].y,
          dead: false, slowT: 0, stunT: 0
        };
        G.enemies.push(enforcer);
      }
    }
  }

  if (G.tacticalProfile && G.activeHiveMutations) {
    const p = G.tacticalProfile;
    const totalDmg = (p.physDmg || 0) + (p.energyDmg || 0) + (p.cryoDmg || 0);
    if (totalDmg > 500) {
      if (p.physDmg / totalDmg > 0.6) G.activeHiveMutations.volatileAcid = true;
      if (p.cryoDmg / totalDmg > 0.3) G.activeHiveMutations.cryoAdrenaline = true;
      if (p.energyDmg / totalDmg > 0.6) G.activeHiveMutations.opticalChaff = true;
    }
    if (p.chokepointKills > 15) G.activeHiveMutations.burrowers = true;
  }

  if ((n === 5 || n === 10 || n === 15) && typeof SOVEREIGN_EDICTS !== 'undefined') {
    const unratified = Object.keys(SOVEREIGN_EDICTS).filter(ek => SOVEREIGN_EDICTS[ek].waveReq <= n && !(G.edicts && G.edicts.includes(ek)));
    if (unratified.length > 0) {
      G.edictModal = { available: unratified.slice(0, 3) };
    }
  }

  saveBest();

  // Boss Wave Roguelite Tech Requisition Draft
  if (n % 5 === 0) {
    const unowned = Object.keys(PERKS).filter(k => G.perks.indexOf(k) < 0);
    if (unowned.length > 0) {
      const pool = [...unowned], picked = [];
      while (picked.length < 3 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      G.drafting = { cards: picked };
      showOverlay('draft');
      Sfx.play('perk');
      G.uiDirty = true;
      return;
    }
  }

  if (G.edictModal && !G.drafting) {
    showOverlay('edicts');
  }

  // 24.0 Biosphere Market & Symbiotic Settlement
  if (typeof settleBiosphereWave === 'function') {
    settleBiosphereWave();
  }

  // 25.0 Mirror Architect Motif Frequency Gentle Decay
  if (G && G.emergent && G.emergent.signatureFreq) {
    for (const k in G.emergent.signatureFreq) {
      G.emergent.signatureFreq[k] = Math.floor(G.emergent.signatureFreq[k] * 0.5);
    }
  }
  // 26.0 Symbiotic Predator Ecology Motif Frequency Gentle Decay
  if (G && G.topology && G.topology.motifFreq) {
    for (const k in G.topology.motifFreq) {
      G.topology.motifFreq[k] = Math.floor(G.topology.motifFreq[k] * 0.5);
    }
  }

  if (n >= WIN_WAVE && !G.endless) { endGame(true); return; }
  G.state = 'prep'; G.prepT = 20; G.uiDirty = true;
}
function selectPerk(id) {
  if (!G || !G.drafting) return;
  G.perks.push(id);
  G.drafting = null;
  showOverlay(null);
  addText(W / 2, 140, 'REQUISITIONED: ' + PERKS[id].name, '#38bdf8', 18);
  Sfx.play('upgrade');
  if (G.wave >= WIN_WAVE && !G.endless) { endGame(true); return; }
  G.state = 'prep'; G.prepT = 20; G.uiDirty = true;
  if (G.edictModal) {
    showOverlay('edicts');
  }
}
function saveBest() {
  if (G.score > SAVE.bestScore) { SAVE.bestScore = G.score; Store.set('nb_bestScore', SAVE.bestScore); }
  if (G.wave > SAVE.bestWave) { SAVE.bestWave = G.wave; Store.set('nb_bestWave', SAVE.bestWave); }
}
function endGame(won) {
  if (!won) {
    // 23.0 The Phoenix Protocol: 10-Second Ghost Standoff Check
    if (G && G.phoenix && !G.phoenix.standoffTriggered) {
      if (typeof triggerPhoenixDoomsday === 'function') {
        const started = triggerPhoenixDoomsday();
        if (started) return;
      }
    }
    if (typeof generateBlackboxForensics === 'function') {
      generateBlackboxForensics();
    }
  }
  if (won) {
    G.score += G.lives * 50;
    if (typeof unlockNextAscension === 'function') unlockNextAscension(G.ascension || 0);
    addCores(15 + (G.ascension || 0) * 5);
    if (typeof recordSectorProgress === 'function') {
      const res = recordSectorProgress(G.sector || 'foundry', G.wave, true, G.lives, G.ascension || 0);
      G.sectorVictoryResult = res;
    }
  } else {
    if (typeof recordSectorProgress === 'function') {
      recordSectorProgress(G.sector || 'foundry', G.wave, false, G.lives, G.ascension || 0);
    }
  }
  saveBest();
  // 24.0 Biosphere End Game Records
  if (typeof recordBiosphereEndGame === 'function') {
    recordBiosphereEndGame(won);
  }
  G.state = won ? 'victory' : 'over';
  G.placing = null; G.casting = null; G.drafting = null;
  showOverlay(won ? 'win' : 'over');
  Sfx.play(won ? 'victory' : 'gameover');
}

/* ============================================================
   UPDATE
   ============================================================ */
function update(dt) {
  if (G.drafting) return;
  // 13.0 Visceral Resonance: Hit-Stop Micro Freeze
  if (G.hitStopT > 0) {
    G.hitStopT = Math.max(0, G.hitStopT - dt);
    return;
  }
  // 13.0 Citadel Aegis Protocol Bullet-Time Dilation
  if (G.aegisLockdownT > 0) {
    G.aegisLockdownT = Math.max(0, G.aegisLockdownT - dt);
    dt *= ((typeof VISCERAL_CONFIG !== 'undefined' && VISCERAL_CONFIG.aegis && VISCERAL_CONFIG.aegis.bulletTimeScale) ? VISCERAL_CONFIG.aegis.bulletTimeScale : 0.35);
  }
  G.time += dt; G.anim += dt;

  // Commander skills cooldown
  const scramblerSlow = (G.hiveMutation === 'scrambler') ? 0.70 : 1.0;
  const commandProtoBoost = (typeof getWorkshopLevel === 'function' && getWorkshopLevel('command_protocol') > 0) ? 1.25 : 1.0;
  const relicCdBoost = (typeof hasRelic === 'function' && hasRelic('quantum_capacitance')) ? 1.30 : 1.0;
  for (const k in G.skills) {
    if (G.skills[k] && G.skills[k].cd > 0) {
      const cdRate = (hasPerk('orbital_salvo') && k === 'orbital' ? 1.5 : 1) * scramblerSlow * commandProtoBoost * relicCdBoost;
      G.skills[k].cd = Math.max(0, G.skills[k].cd - dt * cdRate);
    }
  }
  if (G.sabotRoundsT > 0) G.sabotRoundsT = Math.max(0, G.sabotRoundsT - dt);
  if (G.liquidationT > 0) G.liquidationT = Math.max(0, G.liquidationT - dt);

  // Workshop HQ: Citadel Auto-Turret
  const citLv = typeof getWorkshopLevel === 'function' ? getWorkshopLevel('citadel_turret') : 0;
  if (citLv > 0 && G.state === 'active') {
    G.citadelCd = (G.citadelCd || 0) - dt;
    if (G.citadelCd <= 0) {
      const R = 2.5 * TILE;
      let target = null, bd = R * R;
      for (const e of G.enemies) {
        if (e.dead || e.d < 0) continue;
        const d = (e.x - BASE_PT.x) ** 2 + (e.y - BASE_PT.y) ** 2;
        if (d <= bd) { bd = d; target = e; }
      }
      if (target) {
        G.citadelCd = citLv === 1 ? 0.45 : 0.32;
        const dmg = citLv === 1 ? 28 : 48;
        addFx('tracer', BASE_PT.x, BASE_PT.y, target.x, target.y, 0.1, '#f43f5e', 2.5);
        burst(target.x, target.y, 4, '#f43f5e', 70, 0.25, 2, false);
        dealDamage(target, dmg, 'energy', null);
        Sfx.play('hit');
      }
    }
  }

  // Hazards tick
  for (let i = G.hazards.length - 1; i >= 0; i--) {
    const h = G.hazards[i];
    h.life -= dt;
    if (h.type === 'caltrops') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        if ((e.x - h.x) ** 2 + (e.y - h.y) ** 2 <= (h.r + e.r) ** 2) {
          e.slowAmt = Math.max(e.slowAmt, 0.6); e.slowT = 0.5;
          e.revealT = 2.0;
          dealDamage(e, h.dps * dt, 'phys', null);
          if (hasPerk('nanite_infusion') && e.armor > 0) e.shred = Math.min(e.armor, e.shred + 0.15 * dt);
        }
      }
    } else if (h.type === 'radiation') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        if ((e.x - h.x) ** 2 + (e.y - h.y) ** 2 <= (h.r + e.r) ** 2) {
          dealDamage(e, h.dps * dt, 'plasma', h.src);
          if (e.armor > 0) e.shred = Math.min(e.armor, e.shred + 0.18 * dt);
        }
      }
    } else if (h.type === 'frostfire') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        if ((e.x - h.x) ** 2 + (e.y - h.y) ** 2 <= (h.r + e.r) ** 2) {
          e.slowAmt = Math.max(e.slowAmt, h.slow || 0.40); e.slowT = 1.0;
          e.thermiteT = 1.5; e.thermiteDps = Math.max(e.thermiteDps || 0, e.maxHp * 0.035, 24);
          dealDamage(e, h.dps * dt, 'plasma', h.src, { noReaction: true });
        }
      }
    } else if (h.type === 'singularity') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - h.x, e.y - h.y);
        if (d <= h.r + e.r) {
          if (e.type !== 'boss') {
            e.d = Math.max(0, e.d - 90 * dt);
            e.slowAmt = 0.8; e.slowT = 1.2;
          }
          dealDamage(e, 26 * dt, 'energy', null);
        }
      }
    } else if (h.type === 'mine') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - h.x, e.y - h.y) <= (h.r + e.r)) {
          h.life = 0;
          burst(h.x, h.y, 25, '#f59e0b', 160, 0.6, 4, true);
          addRing(h.x, h.y, 10, 50, 0.45, '#f59e0b', 4);
          shake(8); Sfx.play('boom');
          addText(h.x, h.y - 18, 'PROXIMITY BLAST!', '#f59e0b', 14);
          for (const o of G.enemies) {
            if (o.dead) continue;
            if (Math.hypot(o.x - h.x, o.y - h.y) <= 55 + o.r) {
              dealDamage(o, 180 * hpScale(G.wave) * 0.4, 'phys', null);
              o.slowAmt = 0.35; o.slowT = 3.0;
            }
          }
          break;
        }
      }
    } else if (h.type === 'drone') {
      const dx = BASE_PT.x - h.x, dy = BASE_PT.y - h.y, dist = Math.hypot(dx, dy);
      const step = h.speed * dt;
      if (dist <= step || dist <= 14) {
        h.life = 0;
        G.lives -= 1;
        shake(10);
        burst(BASE_PT.x, BASE_PT.y, 20, '#ef4444', 160, 0.6, 4, false);
        addText(BASE_PT.x - 20, BASE_PT.y - 30, '-1 LIFE (AERIAL DRONE)', '#fb7185', 18);
        Sfx.play('leak');
        if (G.lives <= 0) { G.lives = 0; endGame(false); }
      } else {
        h.x += (dx / dist) * step;
        h.y += (dy / dist) * step;
      }
    } else if (h.type === 'chrono_echo') {
      h.timer -= dt;
      if (h.timer <= 0) {
        h.life = 0;
        spawnEnemy(h.enemyType, G.wave, null, null, h.pathId || 0);
        const revived = G.enemies[G.enemies.length - 1];
        if (revived) {
          revived.d = h.d;
          revived.hp = Math.round(revived.maxHp * 0.35);
          revived.dispHp = revived.hp;
          revived.isChronoClone = true;
          burst(revived.x, revived.y, 16, '#38bdf8', 120, 0.5, 3, true);
          addText(revived.x, revived.y - revived.r - 20, 'REVIVED', '#38bdf8', 14);
          Sfx.play('emp');
        }
      }
    }
    if (h.life <= 0) G.hazards.splice(i, 1);
  }

  while (G.queue.length && G.queue[0].at <= G.time) { const q = G.queue.shift(); spawnEnemy(q.type, q.wave, q.affix, q.threat, q.pathId, q.titanId); }
  for (let i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
  let w = 0;
  for (let i = 0; i < G.enemies.length; i++) { const e = G.enemies[i]; if (!e.dead) G.enemies[w++] = e; }
  G.enemies.length = w;
  if (G.state === 'over') return;
  for (const t of G.towers) updateTower(t, dt);
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const p = G.proj[i], dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), step = PLASMA_SPD * (p.speedMult || 1.0) * dt;
    p.trail -= dt;
    if (p.trail <= 0) {
      p.trail = 0.02; const q = partPool.get(); q.x = p.x; q.y = p.y; q.vx = rand(-12, 12); q.vy = rand(-12, 12);
      q.life = q.max = 0.3; q.size = 3.5;
      q.color = p.type === 'singularity_orb' ? '#818cf8' : (p.cryoInfused ? '#67e8f9' : (p.slingshot ? '#a855f7' : '#fb923c'));
      q.drag = 2; q.round = true;
    }
    // Gravitational Singularity suction while flying
    if (p.type === 'singularity_orb') {
      for (const e of G.enemies) {
        if (e.dead) continue;
        const edist = Math.hypot(e.x - p.x, e.y - p.y);
        if (edist <= 110 && edist > 8) {
          e.d = Math.max(0, e.d - 45 * dt);
        }
      }
    }
    if (d <= step) {
      if (typeof applyMediumCoupling === 'function') applyMediumCoupling(p, p.x, p.y, p.tx, p.ty, 'plasma');
      p.x = p.tx; p.y = p.ty; explode(p); G.proj.splice(i, 1);
    } else {
      const nx = p.x + dx / d * step, ny = p.y + dy / d * step;
      if (typeof applyMediumCoupling === 'function') applyMediumCoupling(p, p.x, p.y, nx, ny, 'plasma');
      p.x = nx; p.y = ny;
    }
  }
  // effects
  for (const p of partPool.items) {
    if (!p.active) continue;
    p.life -= dt; if (p.life <= 0) { p.active = false; continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k;
  }
  for (const f of fxPool.items) { if (f.active) { f.life -= dt; if (f.life <= 0) f.active = false; } }
  for (const t of textPool.items) { if (t.active) { t.life -= dt; t.y -= t.vy * dt; t.vy *= Math.max(0, 1 - 1.5 * dt); if (t.life <= 0) t.active = false; } }
  G.shake = Math.max(0, G.shake - dt * 22);
  G.dmgFlash = Math.max(0, G.dmgFlash - dt * 1.6);
  G.baseFlash = Math.max(0, G.baseFlash - dt * 2);
  if (G.banner) { G.banner.t += dt; if (G.banner.t >= G.banner.max) G.banner = null; }
  // wave logic
  if (G.state === 'prep' && G.wave > 0) {
    G.prepT -= dt;
    if (G.prepT <= 0 && canCall()) startWave();
  } else if (G.state === 'active' && G.queue.length === 0 && G.enemies.length === 0) {
    onWaveClear();
  }

  // Core Overload & Meltdown Timers (4.0)
  if (G.overloadT > 0) {
    G.overloadT -= dt;
    if (G.overloadT <= 0) {
      G.overloadT = 0;
      G.meltdownT = 12.0;
      shake(10);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
      addText(W / 2, 75, 'REACTOR MELTDOWN BROWNOUT! (-50% FIRE RATE)', '#fb7185', 18);
    }
  }
  if (G.meltdownT > 0) G.meltdownT -= dt;
  if (G.overloadCd > 0) G.overloadCd -= dt;
  if (G.adrenalineT > 0) G.adrenalineT -= dt;

  // 12.0 Grid Frequency Stability & Rolling Blackouts
  if (G && G.gridFreq !== undefined) {
    const gp = typeof getGridPowerStatus === 'function' ? getGridPowerStatus() : { used: 0, capacity: 60 };
    const loadRatio = gp.used / Math.max(1, gp.capacity);
    if (loadRatio > 1.0) {
      const dropRate = (loadRatio - 1.0) * 0.45;
      G.gridFreq = Math.max(45.0, G.gridFreq - dropRate * dt);
    } else {
      if (G.gridFreq < 50.0) {
        G.gridFreq = Math.min(50.0, G.gridFreq + 0.25 * dt);
      }
    }
    if (G.gridFreq < 48.5 && (!G.blackoutT || G.blackoutT <= 0)) {
      G.blackoutT = 3.5;
      shake(8);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
      addText(W / 2, 95, '⚡ FREQUENCY TRIP < 48.5 Hz! ROLLING BLACKOUT!', '#f43f5e', 18);
    }
  }
  if (G.blackoutT > 0) G.blackoutT = Math.max(0, G.blackoutT - dt);

  // Reactive Hivemind Dynamic Evolution (4.0)
  if (G.hivePressure && !G.hiveCounterTrait) {
    const hp = G.hivePressure;
    if (hp.phys >= 1200) { G.hiveCounterTrait = 'reflective'; addText(W / 2, 85, 'HIVE ADAPTATION: REFLECTIVE CARAPACE EVOLVED!', '#f43f5e', 16); }
    else if (hp.cryo >= 1000) { G.hiveCounterTrait = 'insulated'; addText(W / 2, 85, 'HIVE ADAPTATION: THERMAL MOLTEN CORE EVOLVED!', '#f97316', 16); }
    else if (hp.energy >= 1200) { G.hiveCounterTrait = 'carbon_weave'; addText(W / 2, 85, 'HIVE ADAPTATION: INSULATED CARBON WEAVE EVOLVED!', '#38bdf8', 16); }
    else if (hp.cluster >= 1200) { G.hiveCounterTrait = 'spore_mortar'; addText(W / 2, 85, 'HIVE ADAPTATION: SPORE MORTARS EVOLVED!', '#a3e635', 16); }
  }

  // Field Anomalies spawn and update (4.0)
  if (G.state === 'active') {
    G.anomalySpawnCd = (G.anomalySpawnCd !== undefined ? G.anomalySpawnCd : 25) - dt;
    if (G.anomalySpawnCd <= 0 && (!G.anomalies || G.anomalies.length < 2)) {
      G.anomalySpawnCd = rand(22, 35);
      spawnFieldAnomaly();
    }
  }
  if (G.anomalies) {
    for (let i = G.anomalies.length - 1; i >= 0; i--) {
      const an = G.anomalies[i];
      an.life -= dt;
      if (an.type === 'supply_drop') {
        if (an.life <= 0) {
          G.anomalies.splice(i, 1);
          burst(an.x, an.y, 16, '#94a3b8', 100, 0.4, 2.5, false);
          addText(an.x, an.y - 20, 'CARGO EXPIRED', '#94a3b8', 12);
        }
      } else if (an.type === 'ion_thunderstrike') {
        if (an.life <= 0) {
          G.anomalies.splice(i, 1);
          detonateIonStrike(an);
        }
      } else if (an.type === 'smuggler_drone') {
        an.x += an.vx * dt;
        an.y += Math.sin(G.time * 4) * 0.8;
        if (an.x > W + 40 || an.x < -40 || an.life <= 0) {
          G.anomalies.splice(i, 1);
        }
      } else if (an.type === 'chrono_rift') {
        for (const e of G.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - an.x, e.y - an.y) <= an.r + e.r) {
            e.d = Math.max(0, e.d - 75 * dt);
            e.slowAmt = Math.max(e.slowAmt, 0.75); e.slowT = 1.0;
          }
        }
        if (an.life <= 0) {
          G.anomalies.splice(i, 1);
          burst(an.x, an.y, 20, '#818cf8', 110, 0.5, 3, true);
        }
      }
    }
  }

  // 5.0 Thermal Steam Purge Cooldown
  if (G.thermalPurgeCd > 0) G.thermalPurgeCd = Math.max(0, G.thermalPurgeCd - dt);

  // Cursed Protocol: Entropy Conduit Periodic Radiation Flare (every 14s)
  if (G.cursedProtocols && G.cursedProtocols.includes('entropy_conduit') && G.state === 'active') {
    G.entropyRadiationCd = (G.entropyRadiationCd !== undefined ? G.entropyRadiationCd : 14.0) - dt;
    if (G.entropyRadiationCd <= 0 && G.towers && G.towers.length > 0) {
      G.entropyRadiationCd = 14.0;
      const targetTower = G.towers[Math.floor(Math.random() * G.towers.length)];
      targetTower.empT = Math.max(targetTower.empT || 0, 3.0);
      if (typeof addTowerHeat === 'function') addTowerHeat(targetTower, 35.0);
      burst(targetTower.x, targetTower.y, 18, '#10b981', 120, 0.5, 3.5, false);
      addRing(targetTower.x, targetTower.y, 10, 65, 0.55, '#10b981', 4);
      shake(6);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('reaction');
      addText(targetTower.x, targetTower.y - 22, 'ENTROPY RADIATION OVERHEAT!', '#10b981', 13);
    }
  }

  // 5.0 Emergency Grid EMP (Logistics Protocol)
  if (typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('emergency_blackout') && !G.emergencyBlackoutUsed && G.lives <= 6 && G.lives > 0 && G.state === 'active') {
    G.emergencyBlackoutUsed = true;
    shake(16);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('emp');
    addRing(W / 2, H / 2, 20, Math.max(W, H), 0.85, '#818cf8', 6);
    addText(W / 2, 85, 'EMERGENCY GRID EMP ACTIVATED! (3.5s STUN)', '#818cf8', 18);
    for (const e of G.enemies) {
      if (!e.dead) {
        e.stunT = Math.max(e.stunT || 0, 3.5);
        burst(e.x, e.y, 8, '#818cf8', 90, 0.4, 2.5, true);
      }
    }
  }

  // 5.0 Grid Resonance Laser Beams Active Processing (Pilar 1)
  if (G.resonanceLines && G.resonanceLines.length > 0 && typeof distToSeg === 'function') {
    const isWide = typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('prism_beam_width');
    const beamRadius = isWide ? 22 : 12;
    const dmgBoost = isWide ? 1.5 : 1.0;
    for (const l of G.resonanceLines) {
      if (!l.conf) continue;
      const dps = l.conf.dps * dmgBoost * dt;
      // Enemy intersection check
      for (const e of G.enemies) {
        if (e.dead) continue;
        if (distToSeg(e.x, e.y, l.x1, l.y1, l.x2, l.y2) <= (beamRadius + e.r)) {
          let dmgType = 'energy';
          if (l.type === 'incinerator_beam') dmgType = 'plasma';
          else if (l.type === 'stasis_line') dmgType = 'cryo';
          else if (l.type === 'sensor_wire') dmgType = 'phys';
          dealDamage(e, dps, dmgType, l.target || l.relay, { noReaction: false });

          if (l.type === 'stasis_line') {
            e.slowAmt = Math.max(e.slowAmt, 0.55); e.slowT = 0.5;
            e.brittle = Math.max(e.brittle, 0.25); e.brittleT = 1.0;
          } else if (l.type === 'sensor_wire') {
            e.revealT = 1.5;
            if (e.armor > 0) e.shred = Math.min(e.armor, (e.shred || 0) + e.armor * 0.25 * dt);
          } else if (l.type === 'ion_plasma' && Math.random() < 0.15) {
            for (const o of G.enemies) {
              if (o.dead || o === e) continue;
              if (Math.hypot(o.x - e.x, o.y - e.y) <= 80) {
                addBolt(e.x, e.y, o.x, o.y, '#facc15');
                dealDamage(o, 25 * dt, 'energy', l.target);
                break;
              }
            }
          }
        }
      }
      // Resonance beam cleanses biomass creep along its trajectory
      if (G.creep && Object.keys(G.creep).length > 0 && typeof cleanseBiomassCreep === 'function') {
        for (const key in G.creep) {
          const [cr, cc] = key.split(',').map(Number);
          const cx = cc * TILE + TILE / 2, cy = cr * TILE + TILE / 2;
          if (distToSeg(cx, cy, l.x1, l.y1, l.x2, l.y2) <= (beamRadius + 18)) {
            cleanseBiomassCreep(cc, cr);
          }
        }
      }
    }
  }

  // 5.0 Biomass Creep Lifetime Decay (Pilar 3)
  if (G.creep) {
    for (const key in G.creep) {
      const cr = G.creep[key];
      cr.life -= dt;
      if (cr.life <= 0) delete G.creep[key];
    }
  }

  // 5.0 Spore Spires Spawning & Combat AI (Pilar 3)
  if (G.state === 'active' && G.wave >= 7 && typeof BIOMASS_CONFIG !== 'undefined') {
    G.sporeSpires = G.sporeSpires || [];
    G.spireSpawnCd = (G.spireSpawnCd !== undefined ? G.spireSpawnCd : 20) - dt;
    if (G.spireSpawnCd <= 0 && G.sporeSpires.length < 2) {
      G.spireSpawnCd = rand(22, 35);
      const candidates = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if ((r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) && !pathTile[r][c] && !G.grid[r][c]) {
            if (!G.sporeSpires.some(s => s.r === r && s.c === c)) candidates.push({ r, c });
          }
        }
      }
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const sp = {
          r: pick.r, c: pick.c, x: pick.c * TILE + TILE / 2, y: pick.r * TILE + TILE / 2,
          hp: BIOMASS_CONFIG.spireMaxHp, maxHp: BIOMASS_CONFIG.spireMaxHp,
          fireCd: 4.0, dead: false
        };
        G.sporeSpires.push(sp);
        if (typeof addBiomassCreep === 'function') addBiomassCreep(pick.c, pick.r);
        burst(sp.x, sp.y, 25, '#84cc16', 140, 0.6, 4, true);
        addRing(sp.x, sp.y, 10, 60, 0.5, '#a3e635', 4);
        shake(6);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('spore_burst');
        addText(sp.x, sp.y - 25, 'SPORE SPIRE ERUPTED!', '#84cc16', 15);
      }
    }

    // Update active spires
    for (let i = G.sporeSpires.length - 1; i >= 0; i--) {
      const sp = G.sporeSpires[i];
      if (sp.dead || sp.hp <= 0) {
        G.sporeSpires.splice(i, 1);
        if (typeof cleanseBiomassCreep === 'function') cleanseBiomassCreep(sp.c, sp.r);
        const isScavenger = typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('contraband_scavenger');
        const rewG = isScavenger ? Math.round(BIOMASS_CONFIG.spireRewardGold * 1.5) : BIOMASS_CONFIG.spireRewardGold;
        const rewC = isScavenger ? BIOMASS_CONFIG.spireRewardCores * 2 : BIOMASS_CONFIG.spireRewardCores;
        G.gold += rewG;
        addCores(rewC);
        burst(sp.x, sp.y, 35, '#84cc16', 180, 0.7, 5, true);
        shake(8);
        addText(sp.x, sp.y - 20, '+' + rewG + 'G +' + rewC + ' CORES', '#84cc16', 16);
        continue;
      }
      sp.fireCd -= dt;
      if (sp.fireCd <= 0) {
        sp.fireCd = BIOMASS_CONFIG.spireFireInterval;
        const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const nb = neighbors[Math.floor(Math.random() * neighbors.length)];
        if (typeof addBiomassCreep === 'function') addBiomassCreep(sp.c + nb[0], sp.r + nb[1]);
        addRing(sp.x, sp.y, 8, 120, 0.45, '#84cc16', 3);
        for (const e of G.enemies) {
          if (!e.dead && Math.hypot(e.x - sp.x, e.y - sp.y) <= 120) {
            e.hp = Math.min(e.maxHp, e.hp + 120);
            e.dispHp = e.hp;
            burst(e.x, e.y, 4, '#84cc16', 50, 0.25, 2, false);
          }
        }
        if (G.towers.length > 0) {
          const tgtT = G.towers[Math.floor(Math.random() * G.towers.length)];
          tgtT.empT = Math.max(tgtT.empT || 0, 3.0);
          burst(tgtT.x, tgtT.y, 10, '#84cc16', 80, 0.4, 3, false);
          addText(tgtT.x, tgtT.y - 20, 'SPORE SLUDGE (-3s)', '#84cc16', 12);
        }
      }
    }
  }

  // 6.0 Chrono-Rewind Time Buffer Recording
  if (G.state === 'active' && typeof recordTimeSnapshot === 'function') {
    G.snapTimer = (G.snapTimer || 0) + dt;
    if (G.snapTimer >= (typeof CHRONO_CONFIG !== 'undefined' ? CHRONO_CONFIG.historyInterval : 0.1)) {
      G.snapTimer = 0;
      recordTimeSnapshot();
    }
  }

  // 6.0 Chrono Cooldowns & Paradox Entropy Decay
  if (G.chronoCd > 0) G.chronoCd = Math.max(0, G.chronoCd - dt);
  if (G.timeRippleT > 0) G.timeRippleT = Math.max(0, G.timeRippleT - dt * 2.5);
  if (G.paradoxEntropy > 0) {
    G.paradoxEntropy = Math.max(0, G.paradoxEntropy - dt * (typeof CHRONO_CONFIG !== 'undefined' ? CHRONO_CONFIG.entropyDecayRate : 2.5));
  }

  // 6.0 Ghost Echoes (Simultaneous Past-Timeline Firing)
  if (G.ghostEchoes && G.ghostEchoes.length > 0) {
    for (let i = G.ghostEchoes.length - 1; i >= 0; i--) {
      const ge = G.ghostEchoes[i];
      ge.life -= dt;
      ge.fireCd -= dt;
      if (ge.fireCd <= 0 && G.enemies.length > 0) {
        ge.fireCd = 0.25;
        const target = G.enemies.find(e => !e.dead && Math.hypot(e.x - ge.x, e.y - ge.y) <= 190);
        if (target) {
          addFx('tracer', ge.x, ge.y, target.x, target.y, 0.12, '#38bdf8', 2.5);
          burst(target.x, target.y, 4, '#38bdf8', 85, 0.25, 2.5, true);
          dealDamage(target, 24 * (1 + G.wave * 0.05), 'energy', null);
        }
      }
      if (ge.life <= 0) G.ghostEchoes.splice(i, 1);
    }
  }

  // 6.0 Corpse Persistence Lifetime Decay
  if (G.corpses && G.corpses.length > 0) {
    for (let i = G.corpses.length - 1; i >= 0; i--) {
      G.corpses[i].life -= dt;
      if (G.corpses[i].life <= 0) G.corpses.splice(i, 1);
    }
  }

  // 6.0 Reclaimed Nanite Minions
  if (G.reclaimedMinions && G.reclaimedMinions.length > 0) {
    for (let i = G.reclaimedMinions.length - 1; i >= 0; i--) {
      const m = G.reclaimedMinions[i];
      m.life -= dt;
      if (m.type === 'drone_hive') {
        m.droneCd = (m.droneCd || 1.5) - dt;
        if (m.droneCd <= 0 && G.enemies.length > 0) {
          m.droneCd = 2.0;
          const target = G.enemies.find(e => !e.dead && Math.hypot(e.x - m.x, e.y - m.y) <= 220);
          if (target) {
            addBolt(m.x, m.y, target.x, target.y, '#34d399');
            burst(target.x, target.y, 8, '#34d399', 90, 0.35, 3, true);
            dealDamage(target, 90, 'energy', null);
            if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('hit');
          }
        }
      } else if (m.type === 'shield_emitter') {
        m.pulseCd = (m.pulseCd || 2.5) - dt;
        if (m.pulseCd <= 0 && G.towers.length > 0) {
          m.pulseCd = 3.5;
          addRing(m.x, m.y, 10, 110, 0.5, '#6ee7b7', 3);
          for (const t of G.towers) {
            if (Math.hypot(t.x - m.x, t.y - m.y) <= 110) {
              t.empT = 0;
              burst(t.x, t.y, 6, '#6ee7b7', 60, 0.3, 2.5, true);
            }
          }
        }
      }
      if (m.life <= 0 || m.hp <= 0) G.reclaimedMinions.splice(i, 1);
    }
  }

  // 6.0 Infiltrator Syndicate Mercenary Gunship Logic
  if (G.syndicateGunship) {
    const gs = G.syndicateGunship;
    gs.life -= dt;
    if (gs.state === 'bribed') {
      gs.droneCd = (typeof gs.droneCd === 'number' ? gs.droneCd : 1.0) - dt;
      if (gs.droneCd <= 0 && G.enemies.length > 0) {
        gs.droneCd = 1.2;
        const target = G.enemies.find(e => !e.dead);
        if (target) {
          addFx('tracer', gs.x, gs.y, target.x, target.y, 0.15, '#fbbf24', 3.5);
          burst(target.x, target.y, 10, '#fbbf24', 115, 0.4, 3, true);
          dealDamage(target, 120, 'plasma', null);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
        }
      }
    } else if (gs.state === 'hostile') {
      gs.droneCd = (typeof gs.droneCd === 'number' ? gs.droneCd : 3.0) - dt;
      if (gs.droneCd <= 0 && G.towers.length > 0) {
        gs.droneCd = 3.0;
        const targetTower = G.towers[Math.floor(Math.random() * G.towers.length)];
        addFx('tracer', gs.x, gs.y, targetTower.x, targetTower.y, 0.2, '#f43f5e', 3);
        targetTower.empT = Math.max(targetTower.empT || 0, 2.5);
        burst(targetTower.x, targetTower.y, 12, '#f43f5e', 90, 0.4, 3, false);
        addText(targetTower.x, targetTower.y - 20, 'SYNDICATE MISSILE (-2.5s)', '#f43f5e', 12);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
      }
    }
    // Check Gunship Destruction
    if (gs.hp <= 0) {
      burst(gs.x, gs.y, 60, '#f43f5e', 240, 1.0, 5, true);
      burst(gs.x, gs.y, 35, '#fbbf24', 180, 0.7, 4, true);
      addRing(gs.x, gs.y, 10, 120, 0.7, '#f43f5e', 6);
      shake(16);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
      G.gold += (typeof SYNDICATE_CONFIG !== 'undefined' ? SYNDICATE_CONFIG.rewardGold : 220);
      if (typeof addCores === 'function') addCores(typeof SYNDICATE_CONFIG !== 'undefined' ? SYNDICATE_CONFIG.rewardCores : 30);
      if (typeof addChip === 'function') addChip('quantum_singularity_chip', 1);
      addText(gs.x, gs.y - 30, 'GUNSHIP DESTROYED: +220G +30 CORES + FORBIDDEN CHIP!', '#38bdf8', 15);
      G.syndicateGunship = null;
    } else if (gs.life <= 0) {
      burst(gs.x, gs.y, 20, '#94a3b8', 120, 0.5, 3, false);
      addText(gs.x, gs.y - 25, 'GUNSHIP DEPARTED', '#94a3b8', 13);
      G.syndicateGunship = null;
    }
  }

  // 7.0 Titan Mech Pilot Mode Update
  if (typeof updateMech === 'function') updateMech(dt);

  // 7.0 Orbital Dreadnought Super-Strike Update
  if (typeof updateDreadnought === 'function') updateDreadnought(dt);

  // 7.0 Tactical Drop-Pods Update
  if (typeof updateDropPods === 'function') updateDropPods(dt);

  // 8.0 Masterclass AAA/Indie Overhaul Updates
  if (typeof updateMegastructures === 'function') updateMegastructures(dt);
  if (typeof updateLogistics === 'function') updateLogistics(dt);
  if (typeof updatePheromones === 'function') updatePheromones(dt);

  // 9.0 Living Ecosystem & Nemesis Network Updates
  if (typeof updateEcology === 'function') updateEcology(dt);
  if (typeof updateProfiler === 'function') updateProfiler(dt);
  if (G && G.grapplePrompt && G.grapplePrompt.timer > 0) {
    G.grapplePrompt.timer = Math.max(0, G.grapplePrompt.timer - dt);
    if (G.grapplePrompt.timer <= 0) G.grapplePrompt = null;
  }
  if (G && G.darkCurios && G.darkCurios.includes('blood_forge')) {
    G.bloodForgeTimer = (G.bloodForgeTimer || 15.0) - dt;
    if (G.bloodForgeTimer <= 0) {
      G.bloodForgeTimer = 15.0;
      if ((G.bloodForgeKills || 0) < 30) {
        G.lives = Math.max(0, G.lives - 1);
        shake(12);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('hit');
        addText(W / 2, 90, 'BLOOD-FORGE SACRIFICE! -1 LIFE', '#e11d48', 18);
        if (G.lives <= 0 && typeof endGame === 'function') endGame();
      }
      G.bloodForgeKills = 0;
    }
  }

  // 10.0 Crucible of Ascendancy Updates
  if (typeof updateSkillProfiler === 'function') updateSkillProfiler(dt);
  if (typeof updatePrisms === 'function') updatePrisms(dt);
  if (typeof updateEnigmaBoss === 'function') updateEnigmaBoss(dt);
  if (typeof updateMidasCoins === 'function') updateMidasCoins(dt);
  if (G && G.bulletTimeT > 0) {
    G.bulletTimeT = Math.max(0, G.bulletTimeT - dt);
  }
  if (G && G.bulletTimeCd > 0) {
    G.bulletTimeCd = Math.max(0, G.bulletTimeCd - dt);
  }

  // 11.0 The Infinite Chronicles Updates
  if (typeof updateInfiniteChronicles === 'function') updateInfiniteChronicles(dt);

  // 12.0 Sovereign Depth Harmonic Lattices Update
  if (typeof updateHarmonicLattices === 'function') updateHarmonicLattices();

  // 13.0 Visceral Resonance & Kinetic Transcendence Updates
  if (typeof updateVisceralSystems === 'function') updateVisceralSystems(dt);
}

/* ============================================================
   FIELD ANOMALIES SYSTEM (4.0)
   ============================================================ */
function spawnFieldAnomaly(forcedType) {
  if (!G) return;
  G.anomalies = G.anomalies || [];
  const types = ['supply_drop', 'ion_thunderstrike', 'smuggler_drone', 'chrono_rift'];
  const t = forcedType || types[Math.floor(Math.random() * types.length)];
  if (t === 'supply_drop') {
    const valid = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (!pathTile[r][c] && !G.grid[r][c]) valid.push({ r, c });
      }
    }
    if (valid.length > 0) {
      const cell = valid[Math.floor(Math.random() * valid.length)];
      const an = {
        type: 'supply_drop',
        c: cell.c, r: cell.r,
        x: cell.c * TILE + TILE / 2, y: cell.r * TILE + TILE / 2,
        r: 16, hp: 120, maxHp: 120, life: 20.0, maxLife: 20.0, color: '#fbbf24'
      };
      G.anomalies.push(an);
      burst(an.x, an.y, 20, '#fbbf24', 120, 0.5, 3, true);
      addRing(an.x, an.y, 10, 45, 0.4, '#fbbf24', 3);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('drop');
      addText(an.x, an.y - 24, 'ORBITAL SUPPLY DROP!', '#fbbf24', 14);
      if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('supply_drop', 'anomaly');
    }
  } else if (t === 'ion_thunderstrike') {
    const p = posAt(rand(40, Math.max(50, (typeof PLEN !== 'undefined' ? PLEN : 500) - 40)), 0, 0);
    const an = {
      type: 'ion_thunderstrike',
      x: p.x, y: p.y, r: 75,
      life: 3.5, maxLife: 3.5, color: '#38bdf8'
    };
    G.anomalies.push(an);
    addRing(an.x, an.y, 12, an.r, 0.6, '#38bdf8', 3);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
    addText(an.x, an.y - 24, 'ION STRIKE RETICLE!', '#38bdf8', 14);
    if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('ion_thunderstrike', 'anomaly');
  } else if (t === 'smuggler_drone') {
    const an = {
      type: 'smuggler_drone',
      x: -25, y: rand(70, H - 100),
      vx: 130, r: 18,
      life: 14.0, maxLife: 14.0, color: '#c084fc'
    };
    G.anomalies.push(an);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('coin');
    addText(an.x + 40, an.y - 15, 'SMUGGLER DRONE APPROACHING!', '#c084fc', 13);
    if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('smuggler_drone', 'anomaly');
  } else if (t === 'chrono_rift') {
    const p = posAt(rand(50, Math.max(60, (typeof PLEN !== 'undefined' ? PLEN : 500) - 50)), 0, 0);
    const an = {
      type: 'chrono_rift',
      x: p.x, y: p.y, r: 55,
      life: 7.5, maxLife: 7.5, color: '#818cf8'
    };
    G.anomalies.push(an);
    burst(an.x, an.y, 25, '#818cf8', 140, 0.6, 3.5, true);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('freeze');
    addText(an.x, an.y - 24, 'CHRONO-RIFT DETECTED!', '#818cf8', 14);
    if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('chrono_rift', 'anomaly');
  }
}

function detonateIonStrike(an) {
  burst(an.x, an.y, 60, '#38bdf8', 250, 0.8, 5, true);
  burst(an.x, an.y, 30, '#ffffff', 200, 0.5, 4, true);
  addRing(an.x, an.y, 10, an.r * 1.3, 0.6, '#38bdf8', 5);
  shake(14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('strike');
  addText(an.x, an.y - 30, 'COSMIC ION THUNDERSTRIKE!', '#38bdf8', 18);
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - an.x, e.y - an.y);
    if (d <= an.r + e.r) {
      e.shield = 0;
      dealDamage(e, 1500, 'energy', null);
    }
  }
  for (const t of G.towers) {
    const d = Math.hypot(t.x - an.x, t.y - an.y);
    if (d <= an.r * 0.7) {
      t.empT = 2.5;
      addText(t.x, t.y - 18, 'ION STUN', '#38bdf8', 12);
    }
  }
}
