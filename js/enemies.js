'use strict';
/* Enemy spawning and behaviour */

/* ============================================================
   ENEMIES
   ============================================================ */
function spawnEnemy(type, n, affix, threat, pathId, titanId) {
  const d = ED[type], sc = hpScale(n), hp = Math.round(d.hp * sc);
  let spd = d.speed * (1 + Math.min(0.25, n * 0.006)) * (type === 'swarm' ? rand(0.98, 1.02) : rand(0.94, 1.06));
  if (type === 'swarm' && G && G.ascension >= 3) spd *= 1.15;
  let armor = d.armor;
  if (G.mutator && G.mutator.id === 'heavy_plating') armor = Math.min(0.85, armor + 0.20);
  const isChamp = !!(affix && CHAMPION_AFFIXES[affix]);
  const finalHp = isChamp ? Math.round(hp * 1.4) : hp;
  const finalReward = isChamp ? Math.round(d.reward * 1.4 * (1 + 0.03 * (n - 1))) : Math.max(1, Math.round(d.reward * (1 + 0.03 * (n - 1))));
  const pId = pathId || 0;
  const startPt = pId === 1 ? PATH_BREACH[0] : PATH[0];
  const e = {
    type, id: ++eid, hp: finalHp, maxHp: finalHp, dispHp: finalHp, shield: 0, maxShield: 0, speed: spd, curSpeed: spd, r: isChamp ? Math.round(d.r * 1.15) : d.r,
    armor, shred: 0, slowAmt: 0, slowT: 0, brittle: 0, brittleT: 0, stunT: 0,
    reward: finalReward, leak: d.leak,
    d: 0, seg: 0, x: startPt.x, y: startPt.y, ang: 0, off: 0, dead: false, flash: 0, dmgAcc: 0, dmgT: 0,
    healT: rand(0.6, 1.4), shieldCd: 4, shieldT: 0, anim: Math.random() * 10, healFx: 0,
    stealth: !!d.stealth, revealT: 0, carrierT: rand(1.5, 3.0), bleedT: 0, bleedDps: 0,
    acidT: 0, thermiteT: 0, thermiteDps: 0,
    phase: 1, mortarCd: 7,
    isChampion: isChamp, affix: affix || null, threat: threat || null,
    noDmgT: 0, phaseCd: 0, avengerStacks: 0, thawCd: rand(1.5, 2.5), artilleryCd: rand(4.0, 7.0),
    pathId: pId, titanId: titanId || null,
    chitinHits: 0, insulation: false, grounded: false, speedBoostT: 0,
    hijackedT: 0, hijackFireCd: 0
  };

  // Named Titan Boss stats
  if (titanId && typeof TITAN_BOSSES !== 'undefined' && TITAN_BOSSES[titanId]) {
    const tb = TITAN_BOSSES[titanId];
    e.hp = Math.round(hp * tb.hpMult);
    e.maxHp = e.dispHp = e.hp;
    if (tb.armor) e.armor = tb.armor;
    if (tb.speed) { e.speed = tb.speed; e.curSpeed = tb.speed; }
    if (tb.shieldPct) e.maxShield = e.shield = Math.round(e.hp * tb.shieldPct);
    e.r = Math.round(d.r * 1.5);
    e.reward = Math.round(e.reward * 2.5);
    if (titanId === 'chronoweaver') e.rewindThresholds = [0.75, 0.50, 0.25];
    if (titanId === 'swarm_mother') e.broodCd = 5.0;
  }

  // Living Hive Mutations
  if (G && G.hiveMutation) {
    if (G.hiveMutation === 'chitin' && type !== 'boss') e.chitinHits = 4;
    if (G.hiveMutation === 'insulation') e.insulation = true;
    if (G.hiveMutation === 'rubber') e.grounded = true;
  }

  // Defense Contract: Hyper-Velocity Influx
  if (G && G.activeContract === 'hyper_velocity') {
    e.speed *= 1.60; e.curSpeed = e.speed;
    e.hp = Math.max(1, Math.round(e.hp * 0.70)); e.maxHp = e.dispHp = e.hp;
  }

  if (type === 'swarm') { e.off = rand(-15, 15); e.d = -rand(0, 22); }
  if ((type === 'scout' || type === 'brute') && n >= 8 && Math.random() < Math.min(0.5, (n - 6) * 0.05)) {
    e.maxShield = e.shield = Math.round(hp * (type === 'brute' ? 0.35 : 0.5));
  }
  if (G && G.ascension >= 4 && e.shield <= 0) {
    e.maxShield = e.shield = Math.round(finalHp * 0.20);
  }
  if (type === 'boss') { shake(14); Sfx.play('boss'); addRing(PATH[1].x, PATH[1].y, 10, 120, 0.8, '#c084fc', 5); }
  if (pId === 1) {
    e.x = startPt.x + e.off;
    e.y = startPt.y + e.d;
  } else {
    e.x = startPt.x + e.d;
    e.y = startPt.y + e.off;
  }
  G.enemies.push(e);
}

function updateEnemy(e, dt) {
  e.anim += dt;
  e.flash = Math.max(0, e.flash - dt * 6);
  e.dispHp += (e.hp - e.dispHp) * Math.min(1, dt * 7);
  if (e.healFx > 0) e.healFx -= dt;
  if (e.revealT > 0) e.revealT -= dt;
  if (e.bleedT > 0) {
    e.bleedT -= dt;
    dealDamage(e, e.bleedDps * dt, 'phys', null);
    if (e.dead) return;
  }
  if (e.acidT > 0) e.acidT -= dt;
  if (e.thermiteT > 0) {
    e.thermiteT -= dt;
    dealDamage(e, e.thermiteDps * dt, 'energy', null, { noReaction: true });
    if (e.dead) return;
    if (Math.random() < 0.25) burst(e.x, e.y, 2, '#fdba74', 60, 0.25, 2, false);
  }
  if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowAmt = 0; }
  if (e.brittleT > 0) { e.brittleT -= dt; if (e.brittleT <= 0) e.brittle = 0; }
  if (e.stunT > 0) e.stunT -= dt;
  if (e.dmgT > 0) e.dmgT -= dt;
  if (e.dmgAcc > 0 && e.dmgT <= 0) {
    addText(e.x, e.y - e.r - 12, String(Math.max(1, Math.round(e.dmgAcc))), '#e2e8f0', 12);
    e.dmgAcc = 0; e.dmgT = 0.35;
  }
  if (e.type === 'healer' && e.stunT <= 0) {
    e.healT -= dt;
    if (e.healT <= 0 && e.d > 0) {
      e.healT = 2.0;
      const R = 1.7 * TILE; let healed = false;
      for (const o of G.enemies) {
        if (o.dead || o === e || o.hp >= o.maxHp) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= R * R) {
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * (o.type === 'boss' ? 0.03 : 0.07));
          addText(o.x, o.y - o.r - 8, '+', '#6ee7b7', 14); burst(o.x, o.y, 3, '#6ee7b7', 40, 0.5, 2.5, true); healed = true;
        }
      }
      addRing(e.x, e.y, 6, R, 0.5, 'rgba(110,231,183,0.8)', 2);
      e.healFx = 0.5;
      if (healed) Sfx.play('heal');
    }
  }
  // Shield Carrier ability
  if (e.type === 'carrier' && e.stunT <= 0) {
    e.carrierT -= dt;
    if (e.carrierT <= 0 && e.d > 0) {
      e.carrierT = 3.6;
      const R = 2.0 * TILE;
      addRing(e.x, e.y, 10, R, 0.6, '#38bdf8', 3);
      Sfx.play('shield');
      for (const o of G.enemies) {
        if (o.dead || o === e) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= R * R) {
          const sh = Math.round(o.maxHp * 0.28);
          o.maxShield = Math.max(o.maxShield, sh);
          o.shield = Math.min(o.maxShield, o.shield + sh);
          burst(o.x, o.y, 4, '#38bdf8', 60, 0.35, 2.5, true);
        }
      }
    }
  }
  // Champion Affix: Regenerator
  if (e.affix === 'regenerator' && !e.dead) {
    if (e.dmgT <= 0) {
      e.noDmgT += dt;
      if (e.noDmgT >= 1.2 && e.hp < e.maxHp) {
        const heal = e.maxHp * 0.06 * dt;
        e.hp = Math.min(e.maxHp, e.hp + heal);
        if (Math.random() < 0.2) burst(e.x, e.y, 2, '#22c55e', 40, 0.3, 2, true);
      }
    } else {
      e.noDmgT = 0;
    }
  }
  if (e.phaseCd > 0) e.phaseCd -= dt;

  // Adaptive Threat: Thermal Juggernaut aura
  if (e.threat === 'thermal_juggernaut' && e.stunT <= 0 && !e.dead && e.d > 0) {
    e.thawCd -= dt;
    if (e.thawCd <= 0) {
      e.thawCd = 2.4;
      const R = 2.0 * TILE;
      addRing(e.x, e.y, 6, R, 0.5, '#ea580c', 3);
      for (const o of G.enemies) {
        if (o.dead) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= (R + o.r) ** 2) {
          if (o.slowT > 0 || o.stunT > 0) {
            o.slowT = 0; o.slowAmt = 0; o.stunT = 0;
            burst(o.x, o.y, 4, '#fdba74', 60, 0.35, 2.5, false);
            addText(o.x, o.y - o.r - 14, 'THAWED', '#fdba74', 11);
          }
        }
      }
    }
  }

  // Adaptive Threat: Artillery Walker mortar
  if (e.threat === 'artillery' && e.stunT <= 0 && !e.dead && e.d > 0 && G.towers.length > 0) {
    e.artilleryCd -= dt;
    if (e.artilleryCd <= 0) {
      e.artilleryCd = 7.5;
      let bestT = G.towers[0], bestCount = 0;
      for (const t1 of G.towers) {
        let cnt = 0;
        for (const t2 of G.towers) if ((t1.x - t2.x) ** 2 + (t1.y - t2.y) ** 2 <= (2.6 * TILE) ** 2) cnt++;
        if (cnt > bestCount) { bestCount = cnt; bestT = t1; }
      }
      if (bestT) {
        for (const t of G.towers) {
          if ((t.x - bestT.x) ** 2 + (t.y - bestT.y) ** 2 <= (2.2 * TILE) ** 2) {
            t.empT = 2.4;
            burst(t.x, t.y, 10, '#f87171', 90, 0.4, 2.5, false);
            addText(t.x, t.y - 18, 'EMP DISRUPTED', '#f87171', 12);
          }
        }
        addFx('tracer', e.x, e.y, bestT.x, bestT.y, 0.45, '#f87171', 3.5);
        addRing(bestT.x, bestT.y, 10, 2.2 * TILE, 0.6, '#f87171', 4);
        shake(5); Sfx.play('boom');
      }
    }
  }
  // Boss Multi-Phase Logic
  if (e.type === 'boss') {
    const hpPct = e.hp / e.maxHp;
    if (e.phase === 1 && hpPct <= 0.65) {
      e.phase = 2;
      e.slowAmt = 0; e.slowT = 0; e.brittle = 0; e.brittleT = 0; e.stunT = 0;
      e.maxShield = e.shield = Math.round(e.maxHp * 0.22);
      shake(10); Sfx.play('boss');
      addRing(e.x, e.y, 12, 110, 0.7, '#38bdf8', 5);
      addText(e.x, e.y - e.r - 28, 'PHASE II: DRONE SHIELD', '#38bdf8', 15);
      spawnEnemy('scout', G.wave); spawnEnemy('scout', G.wave);
    } else if (e.phase === 2 && hpPct <= 0.30) {
      e.phase = 3;
      e.speed *= 1.45;
      e.stunT = 0;
      shake(12); Sfx.play('boss');
      addRing(e.x, e.y, 16, 130, 0.8, '#f43f5e', 5);
      addText(e.x, e.y - e.r - 28, 'PHASE III: BERSERK', '#f43f5e', 16);
      if (G && G.ascension >= 5) {
        spawnEnemy('brute', G.wave, 'avenger', null, e.pathId || 0);
        spawnEnemy('scout', G.wave, 'phase_shifter', null, e.pathId || 0);
        const b1 = G.enemies[G.enemies.length - 2];
        const b2 = G.enemies[G.enemies.length - 1];
        if (b1) { b1.d = Math.max(0, e.d - 35); b1.pathId = e.pathId || 0; }
        if (b2) { b2.d = Math.max(0, e.d - 60); b2.pathId = e.pathId || 0; }
        addText(e.x, e.y - e.r - 46, 'NEMESIS ESCORTS', '#a855f7', 14);
        burst(e.x, e.y, 18, '#a855f7', 150, 0.6, 4, true);
      }
    }
    // Phase 1 mortar fire
    if (e.phase === 1 && e.stunT <= 0) {
      e.mortarCd -= dt;
      if (e.mortarCd <= 0 && G.towers.length > 0 && e.d > 0) {
        e.mortarCd = 7.5;
        const targetTower = G.towers[Math.floor(Math.random() * G.towers.length)];
        targetTower.empT = 2.8;
        addFx('tracer', e.x, e.y, targetTower.x, targetTower.y, 0.4, '#f87171', 3);
        burst(targetTower.x, targetTower.y, 16, '#f87171', 120, 0.45, 3, false);
        addText(targetTower.x, targetTower.y - 20, 'DISRUPTED', '#f87171', 13);
        Sfx.play('boom');
      }
    }
    if (e.shieldT > 0) {
      e.shieldT -= dt;
      if (e.shieldT <= 0) e.shield = 0;
    } else {
      e.shieldCd -= dt;
      if (e.shieldCd <= 0 && e.d > 0) {
        e.maxShield = e.shield = Math.round(e.maxHp * 0.18); e.shieldT = 5; e.shieldCd = 10;
        addRing(e.x, e.y, 20, 70, 0.6, '#22d3ee', 4); Sfx.play('shield');
        addText(e.x, e.y - e.r - 24, 'SHIELD', '#67e8f9', 15);
      }
    }

    // Titan Boss: Goliath Excavator (Tectonic Drill Quake at 50% HP)
    if (e.titanId === 'goliath' && !e.tectonicTriggered && e.hp <= e.maxHp * 0.50) {
      e.tectonicTriggered = true;
      shake(18);
      Sfx.play('boom');
      burst(e.x, e.y, 35, '#f59e0b', 200, 0.8, 5, true);
      addText(e.x, e.y - e.r - 28, 'TECTONIC DRILL QUAKE!', '#f59e0b', 18);
      const sorted = [...G.towers].sort((a, b) => Math.hypot(a.x - e.x, a.y - e.y) - Math.hypot(b.x - e.x, b.y - e.y));
      for (let k = 0; k < Math.min(2, sorted.length); k++) {
        sorted[k].empT = 6.0;
        burst(sorted[k].x, sorted[k].y, 16, '#f59e0b', 120, 0.5, 3.5, false);
        addText(sorted[k].x, sorted[k].y - 20, 'GROUND FAULT!', '#f59e0b', 14);
      }
    }

    // Titan Boss: Chrono-Weaver (Temporal Rewind at 75%, 50%, 25% HP)
    if (e.titanId === 'chronoweaver' && e.rewindThresholds && e.rewindThresholds.length > 0) {
      if (e.hp <= e.maxHp * e.rewindThresholds[0]) {
        e.rewindThresholds.shift();
        e.d = Math.max(0, e.d - 90);
        e.shield = Math.min(e.maxShield, e.shield + Math.round(e.maxHp * 0.15));
        burst(e.x, e.y, 30, '#38bdf8', 180, 0.7, 4, true);
        addRing(e.x, e.y, 10, 90, 0.6, '#38bdf8', 5);
        shake(10);
        Sfx.play('emp');
        addText(e.x, e.y - e.r - 28, 'TEMPORAL REWIND!', '#38bdf8', 16);
      }
    }

    // Titan Boss: Apex Swarm-Mother (Brood, Kamikaze Drones, Berserk)
    if (e.titanId === 'swarm_mother' && !e.dead) {
      e.broodCd = (e.broodCd || 5.0) - dt;
      if (e.broodCd <= 0) {
        e.broodCd = 5.0;
        for (let k = 0; k < 3; k++) {
          spawnEnemy('swarm', G.wave, null, null, e.pathId || 0);
          const m = G.enemies[G.enemies.length - 1];
          if (m) {
            m.d = Math.max(0, e.d - 20 - k * 12);
            m.hp = Math.round(m.hp * 1.2);
            m.maxHp = m.hp;
          }
        }
        burst(e.x, e.y, 18, '#ec4899', 120, 0.5, 3.5, false);
        addText(e.x, e.y - e.r - 20, 'SWARM BROOD!', '#ec4899', 14);
        Sfx.play('reaction');
      }
      if (!e.droneSpawned && e.hp <= e.maxHp * 0.60) {
        e.droneSpawned = true;
        shake(10);
        addText(e.x, e.y - e.r - 28, 'KAMIKAZE DRONES LAUNCHED!', '#ef4444', 16);
        for (let k = 0; k < 3; k++) {
          G.hazards.push({
            type: 'drone',
            x: e.x + rand(-20, 20),
            y: e.y + rand(-20, 20),
            hp: 90 * hpScale(G.wave) * 0.35,
            maxHp: 90 * hpScale(G.wave) * 0.35,
            r: 12,
            speed: 65,
            life: 25,
            anim: Math.random() * 5
          });
        }
        Sfx.play('boom');
      }
      if (!e.berserkTriggered && e.hp <= e.maxHp * 0.25) {
        e.berserkTriggered = true;
        e.speed *= 1.40;
        e.curSpeed = e.speed;
        shake(14);
        burst(e.x, e.y, 35, '#ec4899', 200, 0.8, 5, true);
        addText(e.x, e.y - e.r - 32, 'APEX BERSERK!', '#ef4444', 20);
        Sfx.play('boss');
        if (typeof CHAMPION_AFFIXES !== 'undefined') {
          const affKeys = Object.keys(CHAMPION_AFFIXES);
          spawnEnemy('brute', G.wave, affKeys[0], null, e.pathId || 0);
          const esc1 = G.enemies[G.enemies.length - 1];
          if (esc1) { esc1.d = Math.max(0, e.d - 30); esc1.isEscort = true; }
          spawnEnemy('scout', G.wave, affKeys[1], null, e.pathId || 0);
          const esc2 = G.enemies[G.enemies.length - 1];
          if (esc2) { esc2.d = Math.max(0, e.d - 50); esc2.isEscort = true; }
        }
      }
    }
  }
  let sp = e.speed;
  if (e.speedBoostT > 0) { e.speedBoostT -= dt; sp *= 1.25; }
  if (G.mutator && G.mutator.id === 'frenzy' && e.hp < e.maxHp * 0.4) sp *= 1.35;
  if (G.mutator && G.mutator.id === 'cryo_lockdown') sp *= 0.80;
  if (G.mutator && G.mutator.id === 'overcharge_anomaly') sp *= 1.25;
  if (e.stunT > 0) sp = 0; else if (e.slowT > 0) sp *= 1 - e.slowAmt;

  // Cyber-Hijacked minion AI
  if (e.hijackedT > 0) {
    e.hijackedT -= dt;
    sp = 0;
    e.hijackFireCd = (e.hijackFireCd || 0.6) - dt;
    if (e.hijackFireCd <= 0) {
      e.hijackFireCd = 0.6;
      let bestTar = null, bestDist = 120 * 120;
      for (const o of G.enemies) {
        if (o.dead || o === e || o.hijackedT > 0) continue;
        const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
        if (d < bestDist) { bestDist = d; bestTar = o; }
      }
      if (bestTar) {
        addFx('tracer', e.x, e.y, bestTar.x, bestTar.y, 0.12, '#38bdf8', 2);
        burst(bestTar.x, bestTar.y, 4, '#38bdf8', 80, 0.25, 2, true);
        dealDamage(bestTar, 45 * hpScale(G.wave) * 0.3, 'energy', null);
        Sfx.play('hit');
      }
    }
    if (e.hijackedT <= 0) {
      addText(e.x, e.y - e.r - 18, 'HIJACK EXPIRED', '#94a3b8', 12);
    }
  }

  // Decoy Holo-Beacon
  if (G.hazards) {
    const beacon = G.hazards.find(h => h.type === 'beacon' && h.hp > 0 && Math.hypot(h.x - e.x, h.y - e.y) <= 85);
    if (beacon && e.type !== 'boss') {
      sp = 0;
      beacon.hp -= 25 * dt;
      if (Math.random() < 0.2) burst(beacon.x, beacon.y, 2, '#38bdf8', 40, 0.2, 2, true);
    }
  }

  e.curSpeed = sp;
  e.d += sp * dt;
  const plen = e.pathId === 1 ? PLEN_BREACH : PLEN;
  if (e.d >= plen) {
    e.dead = true;
    // Doctrine Passive: Spec-Ops Infiltrator Counter-Measures (First leak intercepted)
    if (G.doctrine === 'infiltrator' && G.infiltratorDroneUsed !== G.wave) {
      G.infiltratorDroneUsed = G.wave;
      burst(BASE_PT.x, BASE_PT.y, 20, '#a855f7', 150, 0.6, 3.5, true);
      addRing(BASE_PT.x, BASE_PT.y, 10, 75, 0.5, '#a855f7', 4);
      addText(BASE_PT.x - 20, BASE_PT.y - 32, 'INTERCEPT DRONE DEFLECT', '#a855f7', 15);
      Sfx.play('shield');
      return;
    }
    // Perk: Emergency Forcefield
    if (hasPerk('energy_shield') && G.leakedThisWave < 2) {
      G.leakedThisWave++;
      burst(BASE_PT.x, BASE_PT.y, 14, '#38bdf8', 120, 0.5, 3, true);
      addRing(BASE_PT.x, BASE_PT.y, 10, 60, 0.45, '#38bdf8', 4);
      addText(BASE_PT.x - 20, BASE_PT.y - 30, 'FORCEFIELD BLOCKED', '#38bdf8', 15);
      Sfx.play('shield');
      return;
    }
    G.lives -= e.leak; G.baseFlash = 1; G.dmgFlash = 1; shake(e.type === 'boss' ? 16 : 7 + e.leak);
    Sfx.play('leak');
    addText(BASE_PT.x - 20, BASE_PT.y - 30, '-' + e.leak + (e.leak > 1 ? ' LIVES' : ' LIFE'), '#fb7185', 20);
    burst(BASE_PT.x, BASE_PT.y, 16, '#fb7185', 160, 0.6, 3.5, false);
    if (G.lives <= 0) { G.lives = 0; endGame(false); }
    return;
  }
  if (e.d < 0) {
    const startPt = e.pathId === 1 ? PATH_BREACH[0] : PATH[0];
    if (e.pathId === 1) {
      e.x = startPt.x + e.off;
      e.y = startPt.y + e.d;
    } else {
      e.x = startPt.x + e.d;
      e.y = startPt.y + e.off;
    }
  } else {
    const p = posAt(e.d, e.seg, e.pathId); e.seg = p.seg;
    e.ang += angDiff(e.ang, p.ang) * Math.min(1, dt * 10);
    e.x = p.x - Math.sin(p.ang) * e.off; e.y = p.y + Math.cos(p.ang) * e.off;
  }
}
