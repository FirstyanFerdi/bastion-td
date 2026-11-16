'use strict';
/* Tower placement, targeting and weapons */

/* ============================================================
   TOWERS
   ============================================================ */
function acquire(t, rangePx) {
  let best = null, bv = 0;
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if (e.stealth && e.revealT <= 0 && !(t.leyline && t.leyline.id === 'sensor')) continue; // Unrevealed stealth cannot be locked unless on Sensor Leyline
    const dx = e.x - t.x, dy = e.y - t.y, rr2 = rangePx + e.r;
    if (dx * dx + dy * dy > rr2 * rr2) continue;
    let v;
    switch (t.prio) {
      case 'first': v = e.d; break;
      case 'last': v = -e.d; break;
      case 'strongest': v = e.hp + e.shield; break;
      default: v = -(e.hp + e.shield);
    }
    if (best === null || v > bv) { best = e; bv = v; }
  }
  return best;
}
function getTowerCost(type) {
  const def = TD[type];
  if (!def) return 0;
  const mult = (typeof G !== 'undefined' && G && G.ascension >= 1) ? 1.15 : 1.0;
  return Math.round(def.cost * mult);
}

function getTowerPower(type, tier) {
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
  if (typeof getWorkshopLevel === 'function') {
    capacity += getWorkshopLevel('treasury') * 5;
  }
  for (const t of G.towers) {
    if (t.type === 'relay') {
      if (t.shutdownT > 0) continue; // In thermal shutdown, provides 0 MW
      const st = getTierData(t);
      capacity += st.powerSupply || 25;
    } else {
      used += getTowerPower(t.type, t.tier);
    }
  }
  const isBrownout = used > capacity;
  const pct = capacity > 0 ? used / capacity : 1;
  return { used, capacity, isBrownout, pct };
}

function triggerOverdrive(relayTower) {
  if (!relayTower || relayTower.type !== 'relay') return false;
  if (relayTower.shutdownT > 0 || relayTower.overdriveT > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
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

function maxChipsForTier(tier) {
  if (tier <= 0) return 0;
  if (tier === 1) return 1;
  return 2; // tier >= 2
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
  G.uiDirty = true;
  return true;
}

function placeTower(col, row, type) {
  const def = TD[type];
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS || pathTile[row][col] || G.grid[row][col]) return false;
  if (G.fuelCells && G.fuelCells.some(fc => !fc.dead && fc.c === col && fc.row === row)) return false;
  const cost = getTowerCost(type);
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
  Sfx.play('place');
  return t;
}
function upgradeTower(t, branch) {
  if (!t || t.tier >= 2) return;
  const def = TD[t.type];
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
  Sfx.play('upgrade'); G.uiDirty = true;
}
function sellTower(t) {
  if (!t) return;
  const v = Math.floor(t.invested * 0.75);
  G.gold += v; G.grid[t.r][t.c] = null;
  G.towers.splice(G.towers.indexOf(t), 1);
  if (G.sel === t) G.sel = null;
  burst(t.x, t.y, 22, '#fbbf24', 120, 0.6, 3, true);
  addText(t.x, t.y - 20, '+' + v, '#fbbf24', 16);
  Sfx.play('sell'); G.uiDirty = true;
}

function updateTower(t, dt) {
  if (t.empT > 0) { t.empT -= dt; return; }
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
  if (t.overchargeT > 0) rateMult *= 2.0;
  if (hasPerk('targeting_matrix')) { rangeMult *= 1.15; }
  if (G.mutator && G.mutator.id === 'emp_jam') rangeMult *= 0.88;
  if (G.mutator && G.mutator.id === 'solar_flare') rangeMult *= 0.85;
  if (G.mutator && G.mutator.id === 'ion_storm' && t.type !== 'tesla') rateMult *= 0.85;
  if (G.mutator && G.mutator.id === 'cryo_lockdown') rateMult *= 0.80;
  if (G.mutator && G.mutator.id === 'overcharge_anomaly') rateMult *= 1.30;
  if (t.leyline && t.leyline.id === 'accelerator') rateMult *= 1.45;

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

  let effRate = st.rate * rateMult;
  if (t.type === 'gatling' && t.branch === 'A') {
    effRate = lerp(st.rate, st.maxRate, t.heat || 0) * rateMult;
  }
  t.charge = clamp(1 - t.cd * effRate, 0, 1);
  const sensorRangeBonus = (t.leyline && t.leyline.id === 'sensor') ? 2.5 * TILE : 0;
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
  const target = acquire(t, rangePx);
  t.spinV = lerp(t.spinV, target && t.type === 'gatling' ? 26 : 3, Math.min(1, dt * 6));
  t.spin += t.spinV * dt;

  if (t.type === 'gatling' && t.branch === 'A') {
    if (target) t.heat = Math.min(1, (t.heat || 0) + dt * 0.45);
    else t.heat = Math.max(0, (t.heat || 0) - dt * 0.6);
  }

  if (t.type === 'tesla') {
    t.spin += dt * 0.8;
    if (target && t.cd <= 0) { fireTesla(t, st, target); t.cd = 1 / effRate; }
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
  }
}
function fireGatling(t, st, e) {
  const mx = t.x + Math.cos(t.angle) * (28 + t.tier * 3), my = t.y + Math.sin(t.angle) * (28 + t.tier * 3);
  t.recoil = 1; t.flash = 1;
  const isFlak = t.branch === 'B';
  const color = isFlak ? '#0ea5e9' : (t.branch === 'A' ? '#38bdf8' : '#a5f3fc');
  addFx('tracer', mx, my, e.x, e.y, 0.09, color, isFlak ? 3.5 : 2);
  burst(e.x, e.y, isFlak ? 8 : 2, color, isFlak ? 110 : 70, 0.25, isFlak ? 3 : 2, false);
  dealDamage(e, st.dmg, 'phys', t);
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
  const mx = t.x + Math.cos(t.angle) * 30, my = t.y + Math.sin(t.angle) * 30;
  const dist = Math.hypot(e.x - mx, e.y - my), tt = dist / PLASMA_SPD;
  let tx = e.x, ty = e.y;
  if (e.curSpeed > 0 && e.d >= 0) {
    const p = posAt(Math.min(PLEN, e.d + e.curSpeed * tt), e.seg, e.pathId);
    tx = p.x - Math.sin(p.ang) * e.off; ty = p.y + Math.cos(p.ang) * e.off;
  }
  G.proj.push({
    x: mx, y: my, tx, ty, dmg: st.dmg, splash: st.splash * TILE, shred: st.shred, src: t, trail: 0,
    branch: t.branch, radDur: st.radDur, radDps: st.radDps, acidAmp: st.acidAmp,
    catalyst: !!(t.leyline && t.leyline.id === 'catalyst')
  });
  t.recoil = 1; t.flash = 1;
  burst(mx, my, 6, '#fdba74', 90, 0.3, 3, true);
  Sfx.play('plasma');
}
function explode(p) {
  addFx('blast', p.x, p.y, p.x, p.y, 0.35, '#fb923c', 1).r1 = p.splash;
  addRing(p.x, p.y, 6, p.splash, 0.4, '#fdba74', 3);
  burst(p.x, p.y, 22, '#fb923c', 190, 0.6, 4, true);
  burst(p.x, p.y, 10, '#fff7ed', 120, 0.35, 3, true);
  shake(2.2); Sfx.play('boom');
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
      dealDamage(e, p.dmg * fall, 'plasma', p.src);
    }
  }
}
function cryoPulse(t, st, rangePx, effRate) {
  t.cd = 1 / effRate; t.pulseN++; t.flash = 1;
  const isAbsZero = t.branch === 'A', isVortex = t.branch === 'B';
  const isCat = !!(t.leyline && t.leyline.id === 'catalyst');
  const freeze = (isAbsZero) || (st.freeze && t.pulseN % 4 === 0);
  addRing(t.x, t.y, 10, rangePx, 0.55, isAbsZero ? '#93c5fd' : (isVortex ? '#3b82f6' : 'rgba(147,197,253,0.9)'), isAbsZero ? 5 : 4);
  addRing(t.x, t.y, 4, rangePx * 0.75, 0.45, 'rgba(219,234,254,0.6)', 2);
  Sfx.play('cryo');
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
    dealDamage(e, st.dmg, 'energy', t);
  }
}
const BOUNCE = 1.8;
function fireTesla(t, st, e) {
  const hit = [e];
  // Hive Mutation: Grounding Rubber Hulls restricts chain bounce to 1
  const maxTargets = (e.grounded || (hit.length > 0 && hit[0].grounded)) ? 1 : st.targets;
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
    dealDamage(h, st.dmg * Math.pow(0.88, i), 'energy', t, { shieldMult: st.sm });
    px = h.x; py = h.y;
  });
  Sfx.play('tesla');
}
function fireRail(t, st, e) {
  const a = t.angle, dx = Math.cos(a), dy = Math.sin(a);
  const len = st.range * TILE + 30, mx = t.x + dx * (34 + t.tier * 4), my = t.y + dy * (34 + t.tier * 4);
  let crit = Math.random() < (st.crit + (hasPerk('targeting_matrix') ? 0.10 : 0));
  let dmg = st.dmg * (crit ? st.cm : 1);
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
    burst(o.x, o.y, 8, '#fda4af', 150, 0.4, 3, false);
    // Executioner execution check (Boss immune on Ascension 5)
    if (t.branch === 'B' && st.execThresh && (o.type !== 'boss' || !(G.ascension >= 5)) && (o.hp / o.maxHp) <= st.execThresh) {
      o.hp = 0;
      addText(o.x, o.y - o.r - 18, 'EXECUTED', '#f43f5e', 16);
      burst(o.x, o.y, 20, '#f43f5e', 180, 0.5, 3.5, true);
      killEnemy(o, t);
    } else {
      dealDamage(o, dmg, 'phys', t, { crit, fromAngle: a });
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
}
