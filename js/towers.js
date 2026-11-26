'use strict';
/* Tower placement, targeting and weapons */

/* ============================================================
   TOWERS
   ============================================================ */
function acquire(t, rangePx) {
  let best = null, bv = -Infinity;
  const logic = t.cyberLogic || t.logicRule;

  // 7.0 Cyber-Logic Priority Pre-check
  if (logic === 'shield_buster') {
    for (const e of G.enemies) {
      if (e.dead || e.x < 2) continue;
      if (e.stealth && e.revealT <= 0 && !(t.leyline && t.leyline.id === 'sensor')) continue;
      if (e.burrowed && !(t.leyline && t.leyline.id === 'sensor')) continue;
      const dx = e.x - t.x, dy = e.y - t.y, rr2 = rangePx + (typeof e.r === 'number' ? e.r : 0);
      if (dx * dx + dy * dy <= rr2 * rr2 && (e.shield || 0) > 100) {
        if (!best || (e.shield || 0) > (best.shield || 0)) best = e;
      }
    }
    if (best) { t.target = best; return best; }
  } else if (logic === 'titan_lock') {
    for (const e of G.enemies) {
      if (e.dead || e.x < 2) continue;
      if (e.stealth && e.revealT <= 0 && !(t.leyline && t.leyline.id === 'sensor')) continue;
      if (e.burrowed && !(t.leyline && t.leyline.id === 'sensor')) continue;
      const dx = e.x - t.x, dy = e.y - t.y, rr2 = rangePx + (typeof e.r === 'number' ? e.r : 0);
      if (dx * dx + dy * dy <= rr2 * rr2 && (e.type === 'boss' || e.affix)) {
        if (!best || e.hp > best.hp) best = e;
      }
    }
    if (best) { t.target = best; return best; }
  }

  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if (e.stealth && e.revealT <= 0 && !(t.leyline && t.leyline.id === 'sensor')) continue;
    if (e.burrowed && !(t.leyline && t.leyline.id === 'sensor')) continue;
    const dx = e.x - t.x, dy = e.y - t.y, rr2 = rangePx + (typeof e.r === 'number' ? e.r : 0);
    if (dx * dx + dy * dy > rr2 * rr2) continue;
    let v;
    switch (t.prio) {
      case 'first': v = e.d || 0; break;
      case 'last': v = -(e.d || 0); break;
      case 'strongest': v = e.hp + (e.shield || 0); break;
      default: v = -(e.hp + (e.shield || 0));
    }
    if (best === null || v > bv) { best = e; bv = v; }
  }
  t.target = best;
  return best;
}
function getTowerCost(type) {
  const def = TD[type];
  if (!def) return 0;
  let mult = (typeof G !== 'undefined' && G && G.ascension >= 1) ? 1.15 : 1.0;
  if (typeof G !== 'undefined' && G && G.wartimeMarket && G.wartimeMarket[type]) {
    mult *= G.wartimeMarket[type];
  }
  if (type === 'cryo' && typeof hasEdict === 'function' && hasEdict('edict_steel')) {
    mult *= 1.35;
  }
  return Math.round(def.cost * mult);
}

function getTowerPower(type, tier) {
  if (G && G.darkCurios && G.darkCurios.includes('blood_forge')) return 0;
  if (type && typeof type === 'object') {
    tier = type.tier;
    type = type.type;
  }
  const def = TD[type];
  if (!def || !def.power) return 0;
  return def.power[Math.min(tier || 0, def.power.length - 1)];
}

function getGridPowerStatus() {
  if (!G || !G.towers) return { used: 0, capacity: 60, isBrownout: false, pct: 0 };
  let used = 0;
  let capacity = 60;
  if (G && G.sector === 'metropolis') capacity += 15; // Sektor 06: Overclocked Grid
  if (typeof hasRelic === 'function' && hasRelic('quantum_capacitance')) capacity += 35; // 7.0 Exotic Relic
  if (typeof getWorkshopLevel === 'function') {
    capacity += getWorkshopLevel('treasury') * 5;
  }
  // Cursed Protocol: Entropy Conduit gives unlimited capacity
  if (G && G.cursedProtocols && G.cursedProtocols.includes('entropy_conduit')) {
    capacity = 9999;
  }
  // 18.0 The Cataclysmic Convergence: Ion Surge Grid Surplus
  if (G && G.cataclysm && G.cataclysm.ionSurgeActive) {
    capacity += (typeof CATACLYSM_CONFIG !== 'undefined' ? CATACLYSM_CONFIG.ionSurgePowerSupply : 150);
  }
  for (const t of G.towers) {
    if (t.type === 'relay') {
      if (t.shutdownT > 0) continue; // In thermal shutdown, provides 0 MW
      const st = getTierData(t);
      capacity += (st.powerSupply || 25);
    } else if (t.type === 'fusion_zero') {
      capacity += 50; // Absolute Zero Core clean power supply
    } else {
      used += getTowerPower(t.type, t.tier);
    }
  }
  // 19.0 Paradigm Shift: Inverted Entropy (0 MW Power Demand)
  if (G && G.paradigmShift && G.paradigmShift.active === 'inverted_entropy') {
    used = 0;
  }
  if (typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('zero_point_relay')) {
    capacity += 20 * G.towers.filter(t => t.type === 'relay').length;
  }
  let isBrownout = used > capacity;
  if (typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('zero_point_relay')) {
    isBrownout = false;
  }
  const pct = capacity > 0 ? used / capacity : 1;
  return { used, capacity, isBrownout, pct };
}

function triggerOverdrive(relayTower) {
  if (!relayTower || relayTower.type !== 'relay') return false;
  if (relayTower.shutdownT > 0 || relayTower.overdriveT > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  if (typeof triggerHarmonicOverdrive === 'function') {
    triggerHarmonicOverdrive(relayTower);
  }
  relayTower.overdriveT = 8.0;
  const st = getTierData(relayTower);
  const boost = relayTower.branch === 'B' ? '+100%' : '+75%';
  burst(relayTower.x, relayTower.y, 25, '#10b981', 140, 0.6, 3.5, true);
  addRing(relayTower.x, relayTower.y, 10, st.range * TILE, 0.6, '#34d399', 4);
  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
  addText(relayTower.x, relayTower.y - 28, 'OVERDRIVE ' + boost, '#34d399', 15);
  G.uiDirty = true;
  return true;
}

function maxChipsForTier(tier, type) {
  if (type && TD[type] && TD[type].isFusion) return 2;
  if (tier <= 0) return 0;
  if (tier === 1) return 1;
  return 2; // tier >= 2
}

/* ============================================================
   SUPER-WEAPON FUSION ELIGIBILITY (4.0)
   ============================================================ */
function getEligibleFusion(t) {
  if (!G || !t || !G.towers || (t.tier < 2 && !t.branch)) return null;
  if (typeof FUSION_RECIPES === 'undefined') return null;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = t.r + dr, nc = t.c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
      const partner = G.grid[nr][nc];
      if (partner && partner !== t && (partner.tier >= 2 || partner.branch)) {
        const recipe = FUSION_RECIPES.find(r =>
          (t.type === r.towerA && partner.type === r.towerB) ||
          (t.type === r.towerB && partner.type === r.towerA)
        );
        if (recipe) return { recipe, partner };
      }
    }
  }
  return null;
}

function socketChip(tower, chipId) {
  if (!tower || !chipId) return false;
  const chipDef = MODULAR_CHIPS[chipId];
  if (!chipDef) return false;
  if (chipDef.target !== 'any' && chipDef.target !== tower.type) return false;
  tower.chips = tower.chips || [];
  const maxChips = maxChipsForTier(tower.tier);
  if (tower.chips.length >= maxChips) return false;
  if (!SAVE.chipsInventory || (SAVE.chipsInventory[chipId] || 0) <= 0) return false;
  SAVE.chipsInventory[chipId]--;
  Store.set('nb_chips', SAVE.chipsInventory);
  tower.chips.push(chipId);
  burst(tower.x, tower.y, 14, chipDef.color || '#38bdf8', 90, 0.45, 3, true);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
  addText(tower.x, tower.y - 25, chipDef.name + ' SOCKETED', chipDef.color || '#38bdf8', 13);
  G.uiDirty = true;
  return true;
}

function unsocketChip(tower, chipIndex) {
  if (!tower || !tower.chips || chipIndex < 0 || chipIndex >= tower.chips.length) return false;
  const chipId = tower.chips.splice(chipIndex, 1)[0];
  SAVE.chipsInventory = SAVE.chipsInventory || {};
  SAVE.chipsInventory[chipId] = (SAVE.chipsInventory[chipId] || 0) + 1;
  Store.set('nb_chips', SAVE.chipsInventory);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
  addText(tower.x, tower.y - 25, 'CHIP REMOVED', '#94a3b8', 12);
  G.uiDirty = true;
  return true;
}

function swapTowers(t1, t2) {
  if (!t1 || !t2 || t1 === t2) return false;
  const r1 = t1.r, c1 = t1.c, x1 = t1.x, y1 = t1.y, l1 = t1.leyline;
  const r2 = t2.r, c2 = t2.c, x2 = t2.x, y2 = t2.y, l2 = t2.leyline;

  t1.r = r2; t1.c = c2; t1.x = x2; t1.y = y2; t1.leyline = l2;
  t2.r = r1; t2.c = c1; t2.x = x1; t2.y = y1; t2.leyline = l1;

  G.grid[r1][c1] = t2;
  G.grid[r2][c2] = t1;

  burst(x1, y1, 20, '#38bdf8', 140, 0.5, 3.5, true);
  burst(x2, y2, 20, '#38bdf8', 140, 0.5, 3.5, true);
  addRing(x1, y1, 10, 60, 0.5, '#38bdf8', 4);
  addRing(x2, y2, 10, 60, 0.5, '#38bdf8', 4);
  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('emp');
  addText(x1, y1 - 25, 'SHIFTED!', '#38bdf8', 14);
  addText(x2, y2 - 25, 'SHIFTED!', '#38bdf8', 14);
  if (typeof updateResonanceConduits === 'function') updateResonanceConduits();
  G.uiDirty = true;
  return true;
}

function addTowerHeat(t, baseHeat) {
  if (!t || t.type === 'relay') return;
  if (G && (G.aegisOverchargeT > 0 || G.harmonicCadenceT > 0)) {
    t.heat = 0;
    return;
  }
  let mult = 1.0;
  if (typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('conduit_supercharge')) {
    if (G && G.resonanceLines && G.resonanceLines.some(l => l.target === t || l.relay === t)) {
      mult *= 0.75;
    }
  }
  const maxH = typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.maxHeat : 100;
  t.heat = Math.min(maxH, (t.heat || 0) + baseHeat * mult);
}

function getTowerAmmoType(type) {
  if (type === 'gatling' || type === 'rail') return 'kinetic';
  if (type === 'plasma' || type === 'ion_uplink' || type === 'fusion_hellfire' || type === 'fusion_deathray') return 'plasma';
  if (type === 'cryo' || type === 'fusion_zero') return 'cryo';
  return null;
}

function consumeTowerAmmo(t) {
  if (!G || !G.logistics) return;
  if (G.aegisOverchargeT > 0 || G.harmonicCadenceT > 0) return;
  // 18.0 Ion Surge: Zero ammo burn for energy towers
  if (G && G.cataclysm && G.cataclysm.ionSurgeActive && (t.type === 'tesla' || t.type === 'beam' || t.type === 'plasma')) return;
  t.shotsFired = (t.shotsFired || 0) + 1;
  const aType = getTowerAmmoType(t.type);
  if (aType && G.logistics[aType] !== undefined) {
    const policy = G.logistics.policy || 'standard';
    const burn = policy === 'barrage' ? 2 : (policy === 'ration' ? 0.5 : 1);
    G.logistics[aType] = Math.max(0, G.logistics[aType] - burn);
  }
  // Inrush Current & Grid Frequency Dips on heavy energy discharges
  if (G.gridFreq !== undefined) {
    if (t.type === 'ion_uplink') G.gridFreq = Math.max(45.0, G.gridFreq - 0.45);
    else if (t.type === 'plasma' || t.type === 'fusion_hellfire') G.gridFreq = Math.max(45.0, G.gridFreq - 0.20);
    else if (t.type === 'tesla' || t.type === 'fusion_deathray') G.gridFreq = Math.max(45.0, G.gridFreq - 0.15);
  }
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax, v0y = cy - ay;
  const v1x = bx - ax, v1y = by - ay;
  const v2x = px - ax, v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01 || 1);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  return (u >= 0) && (v >= 0) && (u + v < 1);
}

function updateHarmonicLattices() {
  if (!G) return;
  G.harmonicLattices = [];
  if (!G.towers || G.towers.length < 3) return;
  const towers = G.towers;
  for (let i = 0; i < towers.length - 2; i++) {
    for (let j = i + 1; j < towers.length - 1; j++) {
      for (let k = j + 1; k < towers.length; k++) {
        const t1 = towers[i], t2 = towers[j], t3 = towers[k];
        const types = [t1.type, t2.type, t3.type];
        if (types.includes('tesla') && types.includes('cryo') && types.includes('plasma')) {
          G.harmonicLattices.push({
            id: 'singularity',
            name: 'Singularity Crucible',
            color: '#818cf8',
            p1: { x: t1.x, y: t1.y },
            p2: { x: t2.x, y: t2.y },
            p3: { x: t3.x, y: t3.y }
          });
        }
        if (types.includes('rail') && types.includes('gatling') && types.includes('relay')) {
          G.harmonicLattices.push({
            id: 'kinetic_grid',
            name: 'Hyper-Velocity Kinetic Grid',
            color: '#f59e0b',
            p1: { x: t1.x, y: t1.y },
            p2: { x: t2.x, y: t2.y },
            p3: { x: t3.x, y: t3.y }
          });
        }
      }
    }
  }
}

function placeTower(col, row, type) {
  const def = TD[type];
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS || pathTile[row][col] || G.grid[row][col]) return false;
  if (G.fuelCells && G.fuelCells.some(fc => !fc.dead && fc.c === col && fc.row === row)) return false;
  // 12.0 Terra-Scars Check
  if (G.terraScars && G.terraScars[col + ',' + row] && G.terraScars[col + ',' + row].wavesLeft > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    if (typeof addText === 'function') addText(col * TILE + TILE / 2, row * TILE + TILE / 2, 'TERRA-SCAR FRACTURE', '#ef4444', 12);
    return false;
  }
  let cost = getTowerCost(type);
  if (typeof hasEdict === 'function' && hasEdict('edict_steel') && type === 'cryo') {
    cost = Math.ceil(cost * 1.35);
  }
  if (G.gold < cost) { Sfx.play('error'); return false; }
  G.gold -= cost;
  const leyline = typeof getLeylineAt === 'function' ? getLeylineAt(col, row) : null;
  const t = {
    type, c: col, r: row, x: col * TILE + TILE / 2, y: row * TILE + TILE / 2, tier: 0, branch: null, angle: -Math.PI / 2,
    recoil: 0, flash: 0, spin: Math.random() * 6, spinV: 3, cd: 0.3, prio: 'first', invested: cost,
    kills: 0, dmg: 0, pulseN: 0, charge: 1, pop: 1, empT: 0, overchargeT: 0, heat: 0,
    overdriveT: 0, shutdownT: 0, chips: [],
    leyline
  };
  G.towers.push(t); G.grid[row][col] = t;
  burst(t.x, t.y, 14, def.color, 110, 0.5, 3, false);
  addRing(t.x, t.y, 6, 36, 0.35, def.color, 3);
  if (t.leyline) {
    burst(t.x, t.y, 18, t.leyline.color, 130, 0.55, 3.5, true);
    addText(t.x, t.y - 24, t.leyline.name.toUpperCase(), t.leyline.color, 12);
  }
  if (typeof updateResonanceConduits === 'function') updateResonanceConduits();
  if (typeof updateWartimeMarket === 'function') updateWartimeMarket();
  Sfx.play('place');
  return t;
}
function upgradeTower(t, branch) {
  if (!t || t.tier >= 2) return;
  const def = TD[t.type];
  if (def && def.isFusion) return;
  let cost = 0;
  if (t.tier === 0) {
    cost = getUpgradeCost(def.tiers[1].upg);
    if (G.gold < cost) { Sfx.play('error'); return; }
    G.gold -= cost; t.tier = 1; t.invested += cost; t.pop = 1;
  } else if (t.tier === 1) {
    branch = branch || 'A';
    const bDef = def.branches[branch];
    cost = getUpgradeCost(bDef.upg);
    if (G.gold < cost) { Sfx.play('error'); return; }
    G.gold -= cost; t.tier = 2; t.branch = branch; t.invested += cost; t.pop = 1;
  }
  const col = t.branch ? def.branches[t.branch].color : def.color;
  burst(t.x, t.y, 26, col, 150, 0.7, 3.5, false);
  addRing(t.x, t.y, 8, 60, 0.5, col, 4);
  if (typeof updateResonanceConduits === 'function') updateResonanceConduits();
  Sfx.play('upgrade'); G.uiDirty = true;
}
function sellTower(t) {
  if (!t) return;
  const v = (typeof hasEdict === 'function' && hasEdict('edict_automation')) ? 0 : Math.floor(t.invested * 0.75);
  // Refund socketed modular chips back to inventory
  if (t.chips && t.chips.length > 0 && typeof addChip === 'function') {
    for (const chipId of t.chips) addChip(chipId, 1);
  }
  // 12.0 Terra-Scars
  if (G && G.terraScars && ((t.shotsFired || 0) >= 8 || t.tier >= 1)) {
    G.terraScars[t.c + ',' + t.r] = { wavesLeft: 4, type: 'scorched', c: t.c, r: t.r };
    if (typeof addText === 'function') addText(t.x, t.y - 12, 'TERRA-SCAR (4 WAVES)', '#ef4444', 12);
  }
  G.gold += v; G.grid[t.r][t.c] = null;
  G.towers.splice(G.towers.indexOf(t), 1);
  if (G.synapses) {
    G.synapses = G.synapses.filter(s => !(s.c1 === t.c && s.r1 === t.r) && !(s.c2 === t.c && s.r2 === t.r));
  }
  if (G.sel === t) G.sel = null;
  burst(t.x, t.y, 22, '#fbbf24', 120, 0.6, 3, true);
  addText(t.x, t.y - 20, '+' + v, '#fbbf24', 16);
  if (typeof updateResonanceConduits === 'function') updateResonanceConduits();
  if (typeof updateWartimeMarket === 'function') updateWartimeMarket();
  Sfx.play('sell'); G.uiDirty = true;
}

function updateTower(t, dt) {
  if (t.empT > 0) { t.empT -= dt; return; }
  // 14.0 Frankenstein Custom Tower
  if (t.isCustom) {
    updateCustomTower(t, dt);
    return;
  }
  const def = TD[t.type], st = getTierData(t);
  t.cd -= dt; t.recoil = Math.max(0, t.recoil - dt * 6); t.flash = Math.max(0, t.flash - dt * 8); t.pop = Math.max(0, t.pop - dt * 4);
  if (t.overchargeT > 0) t.overchargeT -= dt;

  // Fission Relay behaviour
  if (t.type === 'relay') {
    t.spin += dt * 1.5;
    if (t.overdriveT > 0) {
      t.overdriveT -= dt;
      if (Math.random() < 0.25) burst(t.x, t.y, 2, '#34d399', 60, 0.25, 2, true);
      if (t.overdriveT <= 0) {
        t.overdriveT = 0;
        t.shutdownT = 6.0;
        addText(t.x, t.y - 24, 'THERMAL SHUTDOWN', '#fb7185', 13);
        burst(t.x, t.y, 16, '#94a3b8', 90, 0.5, 3, false);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
        G.uiDirty = true;
      }
    } else if (t.shutdownT > 0) {
      t.shutdownT -= dt;
      if (Math.random() < 0.25) {
        const p = partPool.get();
        p.x = t.x + rand(-6, 6); p.y = t.y - 10;
        p.vx = rand(-10, 10); p.vy = rand(-25, -45);
        p.life = p.max = rand(0.3, 0.6); p.size = rand(3, 6);
        p.color = 'rgba(203,213,225,0.4)'; p.drag = 1.2; p.round = true;
      }
      if (t.shutdownT <= 0) {
        t.shutdownT = 0;
        addText(t.x, t.y - 24, 'RELAY ONLINE', '#10b981', 13);
        burst(t.x, t.y, 12, '#10b981', 80, 0.4, 2.5, true);
        G.uiDirty = true;
      }
    }
    return;
  }

  let rateMult = 1, rangeMult = 1;

  // 12.0 Strategic Logistics & Grid Frequency Throttles
  if (G && G.blackoutT && G.blackoutT > 0) {
    if (t.type !== 'gatling' && t.type !== 'rail') {
      rateMult = 0;
    }
  }

  const aType = getTowerAmmoType(t.type);
  if (aType && G && G.logistics) {
    if (G.logistics[aType] <= 0) {
      t.isAmmoDepleted = true;
      rateMult *= 0.25; // Degraded Emergency Mode (-75% Fire Rate)
    } else {
      t.isAmmoDepleted = false;
    }
    if (G.logistics.policy === 'barrage') rateMult *= 1.25;
    else if (G.logistics.policy === 'ration') rateMult *= 0.85;
  }

  if (typeof hasEdict === 'function') {
    if (hasEdict('edict_steel') && (t.type === 'gatling' || t.type === 'rail')) rateMult *= 1.15;
  }

  // 13.0 Visceral Resonance Overdrives: Citadel Aegis Overcharge & Harmonic Cadence
  if (G && G.aegisOverchargeT > 0) rateMult *= 1.50;
  if (G && G.harmonicCadenceT > 0) rateMult *= 1.60;
  // 14.0 Overcharge Tether & Chronos Bankruptcy
  if (t.tetherOverchargeT > 0) rateMult *= 2.50;
  if (G && G.chronosBankruptcyWaves > 0) rateMult *= 0.50;

  if (G && G.harmonicLattices && G.harmonicLattices.some(l => l.id === 'kinetic_grid' && pointInTriangle(t.x, t.y, l.p1.x, l.p1.y, l.p2.x, l.p2.y, l.p3.x, l.p3.y))) {
    rateMult *= 1.20;
  }
  if (t.overchargeT > 0) rateMult *= 2.0;
  // 18.0 Cataclysmic Convergence: Ion Surge & Flash Blizzard Fire Rate Modifiers
  if (G && G.cataclysm) {
    if (G.cataclysm.ionSurgeActive && (t.type === 'tesla' || t.type === 'beam' || t.type === 'plasma')) {
      rateMult *= (typeof CATACLYSM_CONFIG !== 'undefined' ? CATACLYSM_CONFIG.ionSurgeRateMult : 2.0);
    }
    if (G.cataclysm.blizzardActive && (t.type === 'gatling' || t.type === 'mortar' || t.type === 'flak')) {
      rateMult *= (1.0 - (typeof CATACLYSM_CONFIG !== 'undefined' ? CATACLYSM_CONFIG.blizzardBallisticRatePenalty : 0.40));
    }
  }
  // 19.0 Paradigm Shift & Flux Conduit Modifiers
  if (G && G.paradigmShift && G.paradigmShift.active === 'inverted_entropy') {
    rateMult *= 2.0;
  }
  if (t.subCores && t.subCores[0] === 'penetrating_lance') {
    rateMult *= 0.75;
  }
  if (G && G.fluxConduits && G.fluxConduits.some(fc => (fc.t1 === t || fc.t2 === t) && !fc.disabledT)) {
    rateMult *= 1.25;
  }
  // 20.0 Overclock Throttle & Supercritical Meltdown State
  t.throttle = t.throttle || 1.0;
  rateMult *= t.throttle;
  if (t.throttle > 1.0) {
    const heatInc = ((t.throttle - 1.0) ** 2) * (typeof OVERCLOCK_CONFIG !== 'undefined' ? OVERCLOCK_CONFIG.heatRate : 0.08) * 100 * dt;
    t.heat = (t.heat || 0) + heatInc;
  }
  if ((t.heat || 0) >= 100 && t.throttle > 1.0 && !t.isSupercritical) {
    t.isSupercritical = true;
    t.supercriticalT = (typeof OVERCLOCK_CONFIG !== 'undefined' ? OVERCLOCK_CONFIG.supercriticalDuration : 4.0);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overload');
    if (typeof addText === 'function') addText(t.x, t.y - 25, '★ SUPERCRITICAL MELTDOWN! ★', '#a855f7', 15);
  }
  if (t.isSupercritical) {
    rateMult *= (typeof OVERCLOCK_CONFIG !== 'undefined' ? OVERCLOCK_CONFIG.supercriticalDmgMult : 8.0);
    t.supercriticalT -= dt;
    if (Math.random() < 0.25 && typeof burst === 'function') {
      burst(t.x, t.y, 4, '#c084fc', 60, 0.25, 2, true);
    }
    if (t.supercriticalT <= 0) {
      t.supercriticalT = 0;
      if (typeof triggerCoreMeltdown === 'function') triggerCoreMeltdown(t);
      return;
    }
  }

  // 20.0 Titan Mech Siege Bastion Conduit
  if (G && G.mech && G.mech.stance === 'siege_bastion' && Math.hypot(G.mech.x - t.x, G.mech.y - t.y) <= 150) {
    rangeMult *= (1.0 + (typeof TITAN_STANCE_CONFIG !== 'undefined' ? TITAN_STANCE_CONFIG.siegeBonusRange : 0.60));
    t.isAmmoDepleted = false;
  }
  // Core Overload & Meltdown Hangover (4.0)
  if (G && G.overloadT > 0) rateMult *= 3.5;
  if (G && G.meltdownT > 0) rateMult *= 0.5;
  if (hasPerk('targeting_matrix')) { rangeMult *= 1.15; }
  if (G.mutator && G.mutator.id === 'emp_jam') rangeMult *= 0.88;
  if (G.mutator && G.mutator.id === 'solar_flare') rangeMult *= 0.85;
  if (G.mutator && G.mutator.id === 'ion_storm' && t.type !== 'tesla') rateMult *= 0.85;
  if (G.mutator && G.mutator.id === 'cryo_lockdown') rateMult *= 0.80;
  if (G.mutator && G.mutator.id === 'overcharge_anomaly') rateMult *= 1.30;
  if (t.leyline && t.leyline.id === 'accelerator') rateMult *= 1.45;

  // 5.0 Thermodynamics: Natural & Cryo Heat Dissipation (Pilar 2)
  let dissipation = (typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.naturalDissipation : 8.0);
  // 21.0 Maestro Golden Respite 2x Heat Dissipation
  if (G && G.maestro && G.maestro.phase === 'respite') {
    dissipation *= 2.0;
  }
  // 22.0 Epoch Horizon: Trans-Logistics Grid Fire Rate & Heat Dissipation
  if (G && G.epoch && G.epoch.current >= 2) {
    const gridBonus = (typeof EPOCH_CONFIG !== 'undefined' && EPOCH_CONFIG.epochs[2]) ? EPOCH_CONFIG.epochs[2].gridFireRateBonus : 0.40;
    rateMult *= (1.0 + gridBonus);
    dissipation *= ((typeof EPOCH_CONFIG !== 'undefined' && EPOCH_CONFIG.epochs[2]) ? EPOCH_CONFIG.epochs[2].gridCoolingBonus : 2.0);
  }
  if (G && G.epoch && G.epoch.chronosSingularityActive) {
    rateMult *= 1.50;
  }
  // 21.0 Maestro Silent Arsenal Gambit Lockout
  if (t.silentArsenalLocked) {
    rateMult = 0;
  }
  for (const o of G.towers) {
    if (o !== t && (o.type === 'cryo' || o.type === 'fusion_zero')) {
      if ((o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= (1.8 * TILE) ** 2) {
        dissipation += (typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.cryoDissipationBonus : 16.0);
        break;
      }
    }
  }
  // 9.0 Reactive Dynamic Soil Influences
  if (G && G.soilTiles) {
    const soilUnder = G.soilTiles[t.c + '_' + t.r];
    if (soilUnder) {
      if (soilUnder.type === 'thermal_ash') dissipation *= 0.50;
      else if (soilUnder.type === 'acid_sinkhole') rateMult *= 0.75;
    }
  }

  t.heat = Math.max(0, (t.heat || 0) - dt * dissipation);

  // 25.0 Emergent Radiant Tower Exhaust (Hot towers auto-ignite adjacent oil vents / vaporize frost)
  if (typeof processTowerRadiantExhaust === 'function') {
    processTowerRadiantExhaust(t, dt);
  }

  // 5.0 Thermal Overheat Throttle (-40% Fire Rate)
  const maxH = typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.maxHeat : 100;
  if ((t.heat || 0) >= maxH) {
    rateMult *= (typeof THERMAL_CONFIG !== 'undefined' ? THERMAL_CONFIG.overheatPenalty : 0.60);
    if (Math.random() < 0.12) {
      burst(t.x, t.y - 12, 1, 'rgba(241,245,249,0.5)', 35, 0.35, 2, false);
    }
  }

  // 5.0 Tactical Protocol: Conduit Supercharge (+20% fire rate)
  if (typeof hasMatrixProtocol === 'function' && hasMatrixProtocol('conduit_supercharge')) {
    if (G && G.resonanceLines && G.resonanceLines.some(l => l.target === t || l.relay === t)) {
      rateMult *= 1.20;
    }
  }

  // 5.0 Living Biomass Creep Entanglement (-25% fire rate if tower is on creep tile)
  if (G && G.creep && G.creep[t.r + ',' + t.c]) {
    rateMult *= 0.75;
  }

  // 6.0 Neural Synapse Network Boosts
  const syns = typeof getTowerSynapses === 'function' ? getTowerSynapses(t) : [];
  if (syns.length > 0) {
    rateMult *= 1.15;
    if (t.type === 'rail' && syns.some(s => s.pair && s.pair.id === 'gatling_rail')) {
      rateMult *= 1.45; // Railgun Kinetic Acceleration
    }
  }
  t.synapseRateMult = rateMult;

  // 7.0 Nanite Bio-Catalyst Rate Boost
  if (t.catalystBoostT > 0) {
    t.catalystBoostT = Math.max(0, t.catalystBoostT - dt);
    rateMult *= 1.15;
  }

  // 7.0 Cyber-Logic Automation Presets
  const curLogic = t.cyberLogic || t.logicRule;
  if (curLogic && curLogic !== 'none') {
    if (curLogic === 'thermal_vent' && (t.heat || 0) > 75) {
      rateMult *= 0.65;
      t.heat = Math.max(0, (t.heat || 0) - dt * 25);
    }
  }

  // 8.0 Masterclass AAA Mechanics: Kinetic Belt Logistics & Forbidden Curios
  if (t.kineticAmmoBuff) rateMult *= 1.35;
  if (t.cryoCooling) t.heat = 0;
  if (G && G.darkCurios && G.darkCurios.includes('blood_forge')) rateMult *= 3.0;
  if (G && G.darkCurios && G.darkCurios.includes('singularity_agony')) rangeMult *= 0.60;

  // Power Grid: Brownout penalty
  const gp = getGridPowerStatus();
  if (gp.isBrownout) rateMult *= 0.65;

  // Fission Relay: Sector Overdrive buff
  for (const o of G.towers) {
    if (o !== t && o.type === 'relay' && o.overdriveT > 0) {
      const rRange = getTierData(o).range * TILE;
      if ((o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= rRange * rRange) {
        const boost = o.branch === 'B' ? 2.0 : 1.75;
        rateMult *= boost;
        rangeMult *= 1.25;
        break;
      }
    }
  }

  // Tesla Grid Overcharger aura check
  for (const o of G.towers) {
    if (o !== t && o.type === 'tesla' && o.branch === 'A' && o.empT <= 0) {
      if ((o.x - t.x) ** 2 + (o.y - t.y) ** 2 <= (2.2 * TILE) ** 2) { rateMult *= 1.35; break; }
    }
  }

  // 9.0 Ion Squall Overcharge
  if (t.ionOverchargeT > 0) {
    t.ionOverchargeT = Math.max(0, t.ionOverchargeT - dt);
    rateMult *= 2.0;
  }

  // 9.0 Nemesis Neural Core Chip (+25% Fire Rate)
  if (t.chips && t.chips.includes('nemesis_neural_core')) {
    rateMult *= 1.25;
  }

  let effRate = st.rate * rateMult;
  if (t.type === 'gatling' && t.branch === 'A') {
    effRate = lerp(st.rate, st.maxRate, t.spinup || 0) * rateMult;
  }
  t.charge = clamp(1 - t.cd * effRate, 0, 1);
  const sensorRangeBonus = (t.leyline && t.leyline.id === 'sensor') ? 2.5 * TILE : 0;
  if (G && G.sector === 'dunes' && !(t.leyline && t.leyline.id === 'sensor')) rangeMult *= 0.90; // Sektor 05: Quicksand dust reduces range
  // 9.0 Weather: Toxic Spore Fog reduces range unless Sensor Leyline
  if (G && G.currentWeather === 'spore_fog' && !(t.leyline && t.leyline.id === 'sensor')) {
    rangeMult *= 0.65;
  }
  const rangePx = st.range * rangeMult * TILE + sensorRangeBonus;

  if (t.type === 'cryo') {
    t.spin += dt * 0.9;
    if (t.cd <= 0) {
      let any = false;
      for (const e of G.enemies) { if (!e.dead && e.x > 2 && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= (rangePx + e.r) ** 2) { any = true; break; } }
      if (any) cryoPulse(t, st, rangePx, effRate);
    }
    return;
  }
  if (t.type === 'fusion_zero') {
    t.spin += dt * 1.4;
    updateZeroCore(t, st, dt);
    return;
  }
  const target = acquire(t, rangePx);
  t.spinV = lerp(t.spinV, target && (t.type === 'gatling' || t.type === 'fusion_hellfire') ? 30 : 3, Math.min(1, dt * 6));
  t.spin += t.spinV * dt;

  if (t.type === 'gatling' && t.branch === 'A') {
    if (target) t.spinup = Math.min(1, (t.spinup || 0) + dt * 0.45);
    else t.spinup = Math.max(0, (t.spinup || 0) - dt * 0.6);
  }

  if (t.type === 'tesla') {
    t.spin += dt * 0.8;
    if (target && t.cd <= 0) { fireTesla(t, st, target); t.cd = 1 / effRate; }
    return;
  }
  if (t.type === 'fusion_deathray') {
    t.spin += dt * 1.5;
    if (target && t.cd <= 0) { fireDeathRay(t, st, target); t.cd = 1 / effRate; }
    return;
  }
  if (!target) return;
  const desired = Math.atan2(target.y - t.y, target.x - t.x), diff = angDiff(t.angle, desired);
  const maxTurn = (t.type === 'rail' ? 7 : 11) * dt;
  t.angle += clamp(diff, -maxTurn, maxTurn);
  if (t.cd <= 0 && Math.abs(angDiff(t.angle, desired)) < 0.14) {
    t.cd = 1 / effRate;
    if (t.type === 'gatling') fireGatling(t, st, target);
    else if (t.type === 'plasma') firePlasma(t, st, target);
    else if (t.type === 'rail') fireRail(t, st, target);
    else if (t.type === 'fusion_hellfire') fireHellfire(t, st, target);
    else if (t.type === 'fusion_antimatter') fireAntimatter(t, st, target);
  }
}
function fireGatling(t, st, e) {
  addTowerHeat(t, 1.2);
  consumeTowerAmmo(t);
  const mx = t.x + Math.cos(t.angle) * (28 + t.tier * 3), my = t.y + Math.sin(t.angle) * (28 + t.tier * 3);
  t.recoil = 1; t.flash = 1;
  const isFlak = t.branch === 'B';
  // 25.0 In-Flight Medium Coupling (Conduit Wire / Gravity Slingshot)
  const gActor = (typeof applyMediumCoupling === 'function')
    ? applyMediumCoupling({ dmg: st.dmg, chain: ['gatling'] }, mx, my, e.x, e.y, 'gatling')
    : { dmg: st.dmg, chain: ['gatling'] };
  const color = gActor.ionized ? '#22d3ee' : (isFlak ? '#0ea5e9' : (t.branch === 'A' ? '#38bdf8' : '#a5f3fc'));
  addFx('tracer', mx, my, e.x, e.y, 0.09, color, isFlak ? 3.5 : 2);
  burst(e.x, e.y, isFlak ? 8 : 2, color, isFlak ? 110 : 70, 0.25, isFlak ? 3 : 2, false);
  dealDamage(e, gActor.dmg, gActor.ionized ? 'energy' : 'phys', t, { chain: gActor.chain });
  if (gActor.ionized && G.enemies) {
    const o = G.enemies.find(foe => !foe.dead && foe !== e && Math.hypot(foe.x - e.x, foe.y - e.y) <= 85);
    if (o) {
      addBolt(e.x, e.y, o.x, o.y, '#22d3ee');
      dealDamage(o, gActor.dmg * 0.65, 'energy', t, { isReaction: true, chain: gActor.chain });
    }
  }

  // 6.0 Neural Synapse: Gatling + Railgun Kinetic Piercing (+2 targets pierced)
  const syns = typeof getTowerSynapses === 'function' ? getTowerSynapses(t) : [];
  if (syns.some(s => s.pair && s.pair.id === 'gatling_rail') && typeof distToSeg === 'function') {
    const dx = e.x - mx, dy = e.y - my, dLen = Math.hypot(dx, dy) || 1;
    const nx = dx / dLen, ny = dy / dLen;
    let pierced = 0;
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if (distToSeg(o.x, o.y, mx, my, mx + nx * 280, my + ny * 280) <= (14 + o.r)) {
        dealDamage(o, st.dmg * 0.75, 'phys', t);
        burst(o.x, o.y, 3, '#38bdf8', 60, 0.2, 2, false);
        pierced++;
        if (pierced >= 2) break;
      }
    }
  }
  if (isFlak && st.flakRadius) {
    const fr = st.flakRadius * TILE;
    addRing(e.x, e.y, 4, fr, 0.3, '#38bdf8', 2);
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= (fr + o.r) ** 2) {
        dealDamage(o, st.dmg * 0.65, 'phys', t);
      }
    }
  }
  Sfx.play('gatling');
}
const PLASMA_SPD = 430;
function firePlasma(t, st, e) {
  addTowerHeat(t, 6.0);
  consumeTowerAmmo(t);
  const mx = t.x + Math.cos(t.angle) * 30, my = t.y + Math.sin(t.angle) * 30;
  const dist = Math.hypot(e.x - mx, e.y - my), tt = dist / PLASMA_SPD;
  let tx = e.x, ty = e.y;
  if (e.curSpeed > 0 && e.d >= 0) {
    const p = posAt(Math.min(PLEN, e.d + e.curSpeed * tt), e.seg, e.pathId);
    tx = p.x - Math.sin(p.ang) * e.off; ty = p.y + Math.cos(p.ang) * e.off;
  }
  const pObj = {
    x: mx, y: my, tx, ty, dmg: st.dmg, splash: st.splash * TILE, shred: st.shred, src: t, trail: 0,
    branch: t.branch, radDur: st.radDur, radDps: st.radDps, acidAmp: st.acidAmp,
    catalyst: !!(t.leyline && t.leyline.id === 'catalyst'),
    chain: ['plasma'], speedMult: 1.0
  };
  if (typeof applyMediumCoupling === 'function') applyMediumCoupling(pObj, mx, my, mx, my, 'plasma');
  G.proj.push(pObj);
  t.recoil = 1; t.flash = 1;
  burst(mx, my, 6, '#fdba74', 90, 0.3, 3, true);
  Sfx.play('plasma');
}
function explode(p) {
  if (p.type === 'singularity_orb') {
    addFx('blast', p.x, p.y, p.x, p.y, 0.45, '#818cf8', 1).r1 = p.splash;
    addRing(p.x, p.y, 10, p.splash, 0.6, '#818cf8', 5);
    burst(p.x, p.y, 40, '#818cf8', 220, 0.75, 4.5, true);
    burst(p.x, p.y, 20, '#c084fc', 160, 0.5, 3.5, true);
    shake(12); Sfx.play('boom');
    addText(p.x, p.y - 25, 'ANTIMATTER COLLAPSE!', '#818cf8', 18);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d <= p.splash + e.r) {
        if (e.type !== 'boss' && (e.hp / e.maxHp) <= (p.execThresh || 0.25)) {
          e.hp = 0;
          addText(e.x, e.y - e.r - 16, 'DISINTEGRATED', '#818cf8', 14);
          killEnemy(e, p.src);
        } else {
          e.d = Math.max(0, e.d - (p.pullDist || 70));
          dealDamage(e, p.dmg, 'plasma', p.src, { crit: true, isSplash: true });
        }
      }
    }
    return;
  }
  addFx('blast', p.x, p.y, p.x, p.y, 0.35, p.cryoInfused ? '#38bdf8' : (p.slingshot ? '#a855f7' : '#fb923c'), 1).r1 = p.splash;
  addRing(p.x, p.y, 6, p.splash, 0.4, p.cryoInfused ? '#67e8f9' : '#fdba74', 3);
  burst(p.x, p.y, 22, p.cryoInfused ? '#38bdf8' : '#fb923c', 190, 0.6, 4, true);
  burst(p.x, p.y, 10, '#fff7ed', 120, 0.35, 3, true);
  shake(p.slingshot ? 4.5 : 2.2); Sfx.play('boom');
  // 25.0 Cryo-Infused Plasma detonates instant Thermal Shock + Thermobaric Piston Impulse
  if (p.cryoInfused) {
    addText(p.x, p.y - 26, '★ CRYO-PLASMA COMET! ★', '#67e8f9', 15);
    if (typeof triggerThermobaricImpulse === 'function') {
      triggerThermobaricImpulse(p.x, p.y, p.src, appendChainStep(p.chain, 'cryo_plasma_boom'));
    }
  }
  // 9.0 Reactive Dynamic Soil: Thermal Ash & Vitrified Soil
  const pSoilKey = Math.floor(p.x / TILE) + '_' + Math.floor(p.y / TILE);
  const existingSoil = G.soilTiles && G.soilTiles[pSoilKey];
  if (existingSoil && existingSoil.type === 'thermal_ash') {
    // 9.0 Thermite Bloom Chain Reaction Explosion!
    shake(6);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('reaction');
    addRing(p.x, p.y, 10, 110, 0.5, '#ea580c', 4);
    burst(p.x, p.y, 28, '#f97316', 180, 0.55, 3.8, true);
    addText(p.x, p.y - 25, '★ THERMITE BLOOM ★', '#f97316', 15);
    for (const e of G.enemies) {
      if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) <= 100) {
        dealDamage(e, 220, 'plasma', p.src, { noReaction: true });
        e.thermiteT = Math.max(e.thermiteT || 0, 4.0);
      }
    }
  }
  if (typeof addSoilTile === 'function') {
    addSoilTile(Math.floor(p.x / TILE), Math.floor(p.y / TILE), 'thermal_ash', 18.0);
  }
  // 9.0 Plasma Splash Damage to Destructible Crags
  if (G && G.destructibleCrags && typeof damageCrag === 'function') {
    for (const crag of G.destructibleCrags) {
      if (!crag.collapsed && Math.hypot(crag.x - p.x, crag.y - p.y) <= p.splash + 26) {
        damageCrag(crag, p.dmg * 0.75);
      }
    }
  }
  // Nova Mortar leaves radiation puddle
  if (p.branch === 'A' && p.radDur) {
    const dur = p.catalyst ? p.radDur * 1.5 : p.radDur;
    G.hazards.push({ type: 'radiation', x: p.x, y: p.y, r: p.splash * 1.1, life: dur, max: dur, dps: p.radDps, shred: p.shred, src: p.src });
  }
  // Modular Chip: Cryo-Igniter Core (Plasma leaves burning frostfire)
  if (p.src && p.src.chips && p.src.chips.includes('cryo_igniter')) {
    G.hazards.push({ type: 'frostfire', x: p.x, y: p.y, r: p.splash * 0.9, life: 3.5, max: 3.5, dps: 38, slow: 0.40, src: p.src });
    addRing(p.x, p.y, 8, p.splash * 0.9, 0.45, '#38bdf8', 3);
  }
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= p.splash + e.r) {
      const fall = 1 - 0.4 * clamp(d / p.splash, 0, 1);
      const shredVal = p.catalyst ? p.shred * 1.5 : p.shred;
      if (e.armor > 0 && e.shred < e.armor) e.shred = Math.min(e.armor, e.shred + shredVal);
      if (p.acidAmp) {
        const acidAmpVal = p.catalyst ? p.acidAmp * 1.5 : p.acidAmp;
        const acidDur = p.catalyst ? 5.5 : 3.5;
        e.brittle = Math.max(e.brittle, acidAmpVal);
        e.brittleT = acidDur;
        e.acidT = acidDur;
      }
      if (p.cryoInfused) { e.slowT = Math.max(e.slowT || 0, 1.5); e.slowAmt = Math.max(e.slowAmt || 0, 0.35); }
      dealDamage(e, p.dmg * fall, 'plasma', p.src, { chain: p.chain });
    }
  }
}
function cryoPulse(t, st, rangePx, effRate) {
  addTowerHeat(t, 2.5);
  consumeTowerAmmo(t);
  // 9.0 Reactive Dynamic Soil: Frost Slick Ice Slide on tower and covered road tiles
  if (typeof addSoilTile === 'function') {
    addSoilTile(t.c, t.r, 'frost_slick', 12.0);
    const minC = Math.max(0, Math.floor((t.x - rangePx) / TILE));
    const maxC = Math.min(COLS - 1, Math.floor((t.x + rangePx) / TILE));
    const minR = Math.max(0, Math.floor((t.y - rangePx) / TILE));
    const maxR = Math.min(ROWS - 1, Math.floor((t.y + rangePx) / TILE));
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
        if (typeof pathTile !== 'undefined' && pathTile[r] && pathTile[r][c]) {
          const cx = c * TILE + TILE / 2, cy = r * TILE + TILE / 2;
          if (Math.hypot(cx - t.x, cy - t.y) <= rangePx) {
            addSoilTile(c, r, 'frost_slick', 12.0);
          }
        }
      }
    }
  }
  t.cd = 1 / effRate; t.pulseN++; t.flash = 1;
  const isAbsZero = t.branch === 'A', isVortex = t.branch === 'B';
  const isCat = !!(t.leyline && t.leyline.id === 'catalyst');
  const freeze = (isAbsZero) || (st.freeze && t.pulseN % 4 === 0);
  addRing(t.x, t.y, 10, rangePx, 0.55, isAbsZero ? '#93c5fd' : (isVortex ? '#3b82f6' : 'rgba(147,197,253,0.9)'), isAbsZero ? 5 : 4);
  addRing(t.x, t.y, 4, rangePx * 0.75, 0.45, 'rgba(219,234,254,0.6)', 2);
  Sfx.play('cryo');
  // 25.0 Cryo interacting with nearby overheated tower triggers Steam Vent Cooling
  const cryoActor = (typeof applyMediumCoupling === 'function')
    ? applyMediumCoupling({ dmg: st.dmg, chain: ['cryo'] }, t.x, t.y, t.x + rangePx * 0.6, t.y, 'cryo')
    : { chain: ['cryo'] };
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > (rangePx + e.r) ** 2) continue;
    e.revealT = 3.0; // reveals stealth units!
    const slowAmt = isCat ? Math.min(0.85, st.slow * 1.35) : st.slow;
    const slowT = isCat ? 3.0 : 1.8;
    const brittle = isCat ? st.brittle * 1.4 : st.brittle;
    const brittleT = isCat ? 4.5 : 2.5;
    e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, slowAmt); e.slowT = slowT;
    e.brittle = Math.max(e.brittleT > 0 ? e.brittle : 0, brittle); e.brittleT = brittleT;
    burst(e.x, e.y, 3, '#bfdbfe', 50, 0.5, 2.5, false);
    if (isVortex && st.pullDist) {
      e.d = Math.max(0, e.d - st.pullDist);
      burst(e.x, e.y, 6, '#60a5fa', 80, 0.4, 2, true);
    }
    if (freeze && e.type !== 'boss') {
      e.stunT = (isAbsZero ? st.freezeDur : 0.9) * (isCat ? 1.5 : 1);
      addText(e.x, e.y - e.r - 14, 'FROZEN', '#e0f2fe', 12);
    }
    dealDamage(e, st.dmg, 'cryo', t, { chain: cryoActor.chain });
  }

  // 6.0 Neural Synapse: Cryo + Plasma (Thermonuclear Frost Puddles)
  const cSyns = typeof getTowerSynapses === 'function' ? getTowerSynapses(t) : [];
  if (cSyns.some(s => s.pair && s.pair.id === 'cryo_plasma')) {
    G.hazards = G.hazards || [];
    G.hazards.push({
      type: 'frost_magma', x: t.x, y: t.y, r: rangePx * 0.75,
      life: 3.5, maxLife: 3.5, dps: 28, color: '#c084fc', src: t
    });
    burst(t.x, t.y, 14, '#c084fc', 90, 0.4, 3, true);
  }
}
const BOUNCE = 1.8;
function fireTesla(t, st, e) {
  addTowerHeat(t, 4.0);
  consumeTowerAmmo(t);
  const hit = [e];
  // Hive Mutation: Grounding Rubber Hulls restricts chain bounce to 1
  const bonusTargets = (G && G.sector === 'abyssal') ? 2 : 0; // Sektor 07: Water conductivity (+2 targets)
  const maxTargets = (e.grounded || (hit.length > 0 && hit[0].grounded)) ? 1 : ((st.targets || 4) + bonusTargets);
  for (let k = 1; k < maxTargets; k++) {
    const cur = hit[hit.length - 1]; let best = null, bd = (BOUNCE * TILE) ** 2;
    for (const o of G.enemies) {
      if (o.dead || o.x < 2 || hit.indexOf(o) >= 0) continue;
      const d = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) break; hit.push(best);
  }
  t.flash = 1;
  let px = t.x, py = t.y - 4;
  const isEmp = t.branch === 'B';
  const isCat = !!(t.leyline && t.leyline.id === 'catalyst');

  // Modular Chip: Arc Resonance (reflects off friendly tower to target with +50% dmg)
  if (t.chips && t.chips.includes('arc_resonance')) {
    for (const ally of G.towers) {
      if (ally !== t && (ally.x - t.x) ** 2 + (ally.y - t.y) ** 2 <= (2.2 * TILE) ** 2) {
        addBolt(t.x, t.y, ally.x, ally.y, '#c084fc');
        burst(ally.x, ally.y, 4, '#c084fc', 70, 0.25, 2, true);
        addBolt(ally.x, ally.y, e.x, e.y, '#c084fc');
        dealDamage(e, st.dmg * 0.5, 'energy', t);
        break;
      }
    }
  }

  hit.forEach((h, i) => {
    h.revealT = 2.5; // reveals stealth
    if (isEmp) {
      if (h.shield > 0) { h.shield = 0; h.shieldT = 0; burst(h.x, h.y, 8, '#22d3ee', 100, 0.4, 3, true); }
      if (h.type !== 'boss') h.stunT = Math.max(h.stunT, st.empStun * (isCat ? 1.5 : 1));
    }
    addBolt(px, py, h.x, h.y, isEmp ? '#38bdf8' : '#fde047');
    burst(h.x, h.y, 4, isEmp ? '#7dd3fc' : '#fef08a', 100, 0.3, 2.5, false);
    dealDamage(h, st.dmg * Math.pow(0.88, i), 'energy', t, { shieldMult: st.sm, chain: ['tesla'] });
    px = h.x; py = h.y;
  });

  // 25.0 Natural Surface Circuitry: Tesla lightning conducts along connected wet/frost/acid/oil tiles
  if (hit.length > 0 && typeof propagateSurfaceCircuit === 'function') {
    propagateSurfaceCircuit(hit[0].x, hit[0].y, st.dmg, t, ['tesla']);
  }

  // 6.0 Neural Synapse: Tesla + Relay (Conduit Perimeter Lightning)
  const tSyns = typeof getTowerSynapses === 'function' ? getTowerSynapses(t) : [];
  if (tSyns.some(s => s.pair && s.pair.id === 'tesla_relay') && G.resonanceLines && G.resonanceLines.length > 0) {
    for (const l of G.resonanceLines) {
      addBolt(t.x, t.y, l.x2, l.y2, '#facc15');
      burst(l.x2, l.y2, 5, '#facc15', 80, 0.3, 2.5, true);
      for (const o of G.enemies) {
        if (o.dead) continue;
        if ((o.x - l.x2) ** 2 + (o.y - l.y2) ** 2 <= 75 * 75) {
          dealDamage(o, st.dmg * 0.75, 'energy', t);
        }
      }
    }
  }
  Sfx.play('tesla');
}
function fireRail(t, st, e) {
  addTowerHeat(t, 14.0);
  consumeTowerAmmo(t);
  const a = t.angle, dx = Math.cos(a), dy = Math.sin(a);
  const len = st.range * TILE + 30, mx = t.x + dx * (34 + t.tier * 4), my = t.y + dy * (34 + t.tier * 4);
  let crit = Math.random() < (st.crit + (hasPerk('targeting_matrix') ? 0.10 : 0));
  let dmg = st.dmg * (crit ? st.cm : 1);
  // 25.0 In-Flight Medium Coupling (Conduit Ionize / Gravity Slingshot)
  const rActor = (typeof applyMediumCoupling === 'function')
    ? applyMediumCoupling({ dmg, chain: ['rail'] }, mx, my, mx + dx * len, my + dy * len, 'rail')
    : { dmg, chain: ['rail'] };
  dmg = rActor.dmg;
  const hits = [];
  for (const o of G.enemies) {
    if (o.dead || o.x < 2) continue;
    const rx = o.x - mx, ry = o.y - my, proj = rx * dx + ry * dy;
    if (proj < -12 || proj > len) continue;
    if (Math.abs(rx * dy - ry * dx) <= o.r + 7) hits.push({ o, proj });
  }
  hits.sort((p, q) => p.proj - q.proj);
  const n = Math.min(st.pierce, hits.length);
  for (let i = 0; i < n; i++) {
    const o = hits[i].o;
    o.revealT = 3.0; // reveals stealth
    burst(o.x, o.y, 8, rActor.ionized ? '#22d3ee' : '#fda4af', 150, 0.4, 3, false);
    // 25.0 Frozen Crystal Refraction (Frozen enemies act as Optical/Energy Prisms!)
    if ((o.stunT > 0 || o.freezeT > 0) && typeof triggerFrozenCrystalRefraction === 'function') {
      triggerFrozenCrystalRefraction(o, dmg, a, t, rActor.chain);
    }
    // Executioner execution check (Boss immune on Ascension 5)
    if (t.branch === 'B' && st.execThresh && (o.type !== 'boss' || !(G.ascension >= 5)) && (o.hp / o.maxHp) <= st.execThresh) {
      o.hp = 0;
      addText(o.x, o.y - o.r - 18, 'EXECUTED', '#f43f5e', 16);
      burst(o.x, o.y, 20, '#f43f5e', 180, 0.5, 3.5, true);
      killEnemy(o, t);
    } else {
      dealDamage(o, dmg, rActor.ionized ? 'energy' : 'phys', t, { crit, fromAngle: a, chain: rActor.chain });
    }
    // Modular Chip: Prism Refractor (laser splits into 3 refracted beams on frozen/shielded)
    if (t.chips && t.chips.includes('prism_refractor') && (o.slowT > 0 || o.stunT > 0 || o.shield > 0)) {
      for (const sign of [-1, 1]) {
        const ra = a + sign * 0.45;
        const rdx = Math.cos(ra), rdy = Math.sin(ra);
        addFx('rail', o.x, o.y, o.x + rdx * 130, o.y + rdy * 130, 0.25, '#c7d2fe', 4);
        burst(o.x, o.y, 6, '#c7d2fe', 110, 0.35, 2.5, true);
        for (const foe of G.enemies) {
          if (foe.dead || foe === o) continue;
          const frx = foe.x - o.x, fry = foe.y - o.y, fproj = frx * rdx + fry * rdy;
          if (fproj > 0 && fproj <= 130 && Math.abs(frx * rdy - fry * rdx) <= foe.r + 8) {
            dealDamage(foe, dmg * 0.55, 'phys', t, { crit, isReaction: true });
            burst(foe.x, foe.y, 5, '#c7d2fe', 80, 0.25, 2, false);
          }
        }
      }
      addText(o.x, o.y - o.r - 20, 'PRISM REFRACT!', '#c7d2fe', 13);
    }
    // Anti-projectile Dome halts rail beam from piercing further
    if (o.affix === 'dome' && !o.dead) {
      addRing(o.x, o.y, 10, 42, 0.4, '#38bdf8', 4);
      addText(o.x, o.y - o.r - 20, 'DOME BLOCKED', '#38bdf8', 13);
      break;
    }
  }
  const isBeam = t.branch === 'A';
  const f = addFx('rail', mx, my, mx + dx * len, my + dy * len, isBeam ? 0.4 : 0.3, crit ? '#fde047' : '#fb7185', crit ? 8 : (isBeam ? 9 : 6));
  for (let i = 0; i < (isBeam ? 18 : 12); i++) {
    const d = rand(0, len), p = partPool.get();
    p.x = mx + dx * d; p.y = my + dy * d; p.vx = rand(-30, 30); p.vy = rand(-30, 30); p.life = p.max = rand(0.2, 0.5);
    p.size = 2.5; p.color = '#fecdd3'; p.drag = 3; p.round = true;
  }
  t.recoil = 1; t.flash = 1; shake(1.2);
  burst(mx, my, 10, '#fb7185', 160, 0.4, 3, true);
  Sfx.play('rail');

  // Cursed Protocol: Tachyon Overclock non-kill penalty
  if (G && G.cursedProtocols && G.cursedProtocols.includes('tachyon_overclock')) {
    const killedCount = hits.slice(0, n).filter(h => h.o.dead || h.o.hp <= 0).length;
    if (killedCount === 0) {
      G.gold = Math.max(0, G.gold - 5);
      addText(t.x, t.y - 20, '-5G MISSED KILL', '#fb7185', 12);
    }
  }
}

/* ============================================================
   SUPER-WEAPON FIRING ROUTINES (4.0)
   ============================================================ */
function fireHellfire(t, st, e) {
  addTowerHeat(t, 5.0);
  consumeTowerAmmo(t);
  const a = t.angle;
  const mx1 = t.x + Math.cos(a - 0.22) * 32, my1 = t.y + Math.sin(a - 0.22) * 32;
  const mx2 = t.x + Math.cos(a + 0.22) * 32, my2 = t.y + Math.sin(a + 0.22) * 32;
  t.recoil = 1; t.flash = 1;
  addFx('tracer', mx1, my1, e.x + rand(-6, 6), e.y + rand(-6, 6), 0.08, '#f97316', 3.5);
  addFx('tracer', mx2, my2, e.x + rand(-6, 6), e.y + rand(-6, 6), 0.08, '#38bdf8', 3.5);
  dealDamage(e, st.dmg, 'phys', t);
  dealDamage(e, st.dmg, 'plasma', t, { isSplash: true });
  if (e.armor > 0) e.shred = Math.min(e.armor, e.shred + st.shred);
  // Thermite magma pool
  if (Math.random() < 0.35) {
    G.hazards.push({ type: 'radiation', x: e.x, y: e.y, r: 38, life: 2.5, max: 2.5, dps: st.magmaDps || 35, shred: 0.15, src: t });
    burst(e.x, e.y, 6, '#f97316', 90, 0.3, 2.5, true);
  }
  Sfx.play('gatling');
}

function fireDeathRay(t, st, e) {
  addTowerHeat(t, 10.0);
  consumeTowerAmmo(t);
  const a = t.angle, dx = Math.cos(a), dy = Math.sin(a);
  const ex = t.x + dx * (st.range * TILE), ey = t.y + dy * (st.range * TILE);
  t.flash = 1; t.recoil = 1;
  addFx('rail', t.x, t.y, ex, ey, 0.24, '#c084fc', 6);
  addFx('beam', t.x, t.y, e.x, e.y, 0.22, '#38bdf8', 3.5);
  dealDamage(e, st.dmg, 'energy', t, { crit: true });

  // 5-target chain lightning
  const hit = [e];
  for (let k = 1; k < (st.targets || 5); k++) {
    const cur = hit[hit.length - 1]; let best = null, bd = (2.5 * TILE) ** 2;
    for (const o of G.enemies) {
      if (o.dead || hit.includes(o)) continue;
      const d = (o.x - cur.x) ** 2 + (o.y - cur.y) ** 2;
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) break;
    hit.push(best);
    addBolt(cur.x, cur.y, best.x, best.y, '#38bdf8');
    best.stunT = Math.max(best.stunT || 0, st.chainStun || 1.2);
    dealDamage(best, st.chainDmg || 120, 'energy', t);
    burst(best.x, best.y, 6, '#38bdf8', 85, 0.3, 2.5, true);
  }
  shake(2.0);
  Sfx.play('rail');
  Sfx.play('tesla');
}

function updateZeroCore(t, st, dt) {
  const rangePx = st.range * TILE;
  // Permanent blizzard aura
  for (const e of G.enemies) {
    if (e.dead) continue;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= (rangePx + e.r) ** 2) {
      e.slowAmt = Math.max(e.slowAmt, st.slow || 0.65); e.slowT = 0.5;
      e.brittle = Math.max(e.brittle, st.brittle || 0.50); e.brittleT = 1.0;
    }
  }
  // Screen-Wide Time-Stop Freeze pulse every 12 seconds
  t.pulseT = (t.pulseT || 12.0) - dt;
  if (t.pulseT <= 0) {
    t.pulseT = 12.0;
    addTowerHeat(t, 15.0);
    shake(12);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('freeze');
    addRing(t.x, t.y, 20, Math.max(W, H), 0.8, '#38bdf8', 6);
    addText(W / 2, 75, 'ABSOLUTE ZERO: GLOBAL TIME-STOP!', '#38bdf8', 20);
    for (const e of G.enemies) {
      if (e.dead) continue;
      e.stunT = Math.max(e.stunT || 0, st.freezeDur || 3.5);
      burst(e.x, e.y, 8, '#e0f2fe', 90, 0.4, 3, true);
      dealDamage(e, st.freezeDmg || 200, 'cryo', t);
    }
  }
}

function fireAntimatter(t, st, e) {
  addTowerHeat(t, 8.0);
  consumeTowerAmmo(t);
  const mx = t.x + Math.cos(t.angle) * 32, my = t.y + Math.sin(t.angle) * 32;
  t.recoil = 1; t.flash = 1;
  G.proj.push({
    type: 'singularity_orb',
    x: mx, y: my, tx: e.x, ty: e.y,
    dmg: st.dmg, splash: st.splash * TILE, src: t,
    pullDist: st.pullDist || 70, execThresh: st.execThresh || 0.25
  });
  burst(mx, my, 12, '#818cf8', 130, 0.4, 3.5, true);
  Sfx.play('plasma');
}

/* ============================================================
   BASTION TD 14.0: FRANKENSTEIN CUSTOM TOWER BEHAVIORS
   ============================================================ */

function updateCustomTower(t, dt) {
  t.cd -= dt;
  t.recoil = Math.max(0, (t.recoil || 0) - dt * 6);
  t.flash = Math.max(0, (t.flash || 0) - dt * 8);
  t.pop = Math.max(0, (t.pop || 0) - dt * 4);
  if (t.overchargeT > 0) t.overchargeT -= dt;
  if (t.tetherOverchargeT > 0) t.tetherOverchargeT -= dt;

  let rateMult = 1, rangeMult = 1;
  if (t.tetherOverchargeT > 0) rateMult *= 2.50;
  if (G && G.chronosBankruptcyWaves > 0) rateMult *= 0.50;
  if (t.cpu === 'recoil_accelerator') {
    rateMult *= (1 + (t.recoilRamp || 0));
  }
  if (G && G.aegisOverchargeT > 0) rateMult *= 1.50;
  if (G && G.harmonicCadenceT > 0) rateMult *= 1.60;

  const rangePx = t.range * TILE * rangeMult;
  const inRange = [];
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d2 = (e.x - t.x) ** 2 + (e.y - t.y) ** 2;
    if (d2 <= (rangePx + e.r) ** 2) inRange.push(e);
  }

  if (inRange.length === 0) {
    t.firing = false;
    return;
  }
  t.firing = true;
  const target = pickTarget(inRange, t.prio || 'first');
  if (target) {
    t.angle = Math.atan2(target.y - t.y, target.x - t.x);
    if (t.cd <= 0) {
      fireCustomTower(t, target);
      t.cd = (1 / t.rate) / rateMult;
    }
  }
}

function fireCustomTower(t, target) {
  const mx = t.x + Math.cos(t.angle) * 16, my = t.y + Math.sin(t.angle) * 16;
  t.recoil = 1; t.flash = 1;
  const sfxType = t.payload === 'tesla_arc' ? 'tesla' : (t.payload === 'tachyon_rail' ? 'rail' : (t.payload === 'cryo_chemical' ? 'cryo' : 'gatling'));
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play(sfxType);

  if (t.payload === 'cluster_mortar') {
    G.proj.push({
      type: 'mortar_cluster',
      x: mx, y: my, tx: target.x, ty: target.y,
      dmg: t.dmg, splash: 55, src: t
    });
    burst(mx, my, 8, '#f59e0b', 80, 0.35, 2.5, true);
  } else if (t.payload === 'tesla_arc') {
    burst(mx, my, 6, '#38bdf8', 60, 0.3, 2, true);
    dealDamage(target, t.dmg, 'tesla', t);
    let chained = 0;
    for (const other of G.enemies) {
      if (other !== target && !other.dead && chained < 3) {
        if (Math.hypot(other.x - target.x, other.y - target.y) <= 85) {
          dealDamage(other, t.dmg * 0.7, 'tesla', t);
          chained++;
        }
      }
    }
  } else if (t.payload === 'cryo_chemical') {
    target.slowAmt = Math.max(target.slowAmt || 0, 0.50);
    target.slowT = 2.5;
    dealDamage(target, t.dmg, 'cryo', t);
    burst(target.x, target.y, 8, '#06b6d4', 70, 0.35, 2, true);
  } else {
    // Tachyon rail / kinetic
    G.proj.push({
      type: 'rail',
      x: mx, y: my, tx: target.x, ty: target.y,
      dmg: t.dmg, src: t, pierce: 4
    });
    burst(mx, my, 8, '#f43f5e', 120, 0.35, 3, true);
  }
}

// 20.0 Overclock & Supercritical Core Meltdown Controls
function setTowerThrottle(t, throttle) {
  if (!t) return false;
  const cfg = typeof OVERCLOCK_CONFIG !== 'undefined' ? OVERCLOCK_CONFIG : { minThrottle: 1.0, maxThrottle: 5.0 };
  t.throttle = clamp(throttle, cfg.minThrottle, cfg.maxThrottle);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
  if (typeof addText === 'function') addText(t.x, t.y - 20, 'THROTTLE: ' + (t.throttle * 100).toFixed(0) + '%', '#a855f7', 12);
  if (G) G.uiDirty = true;
  return t.throttle;
}

function coolTower(t, amount) {
  if (!t) return false;
  const cool = amount || 30;
  t.heat = Math.max(0, (t.heat || 0) - cool);
  if (t.isSupercritical && t.heat < 80) {
    t.isSupercritical = false;
    t.supercriticalT = 0;
    if (typeof addText === 'function') addText(t.x, t.y - 24, 'MELTDOWN COOLED!', '#38bdf8', 13);
  }
  if (typeof burst === 'function') burst(t.x, t.y, 10, '#38bdf8', 70, 0.35, 2, false);
  if (G) G.uiDirty = true;
  return true;
}
