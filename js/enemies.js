'use strict';
/* Enemy spawning and behaviour */

/* ============================================================
   ENEMIES
   ============================================================ */
function spawnEnemy(type, n, affix, threat, pathId, titanId) {
  const d = ED[type], sc = hpScale(n), hp = Math.round(d.hp * sc);
  let spd = d.speed * (1 + Math.min(0.25, n * 0.006)) * (type === 'swarm' ? rand(0.98, 1.02) : rand(0.94, 1.06));
  if (type === 'swarm' && G && G.ascension >= 3) spd *= 1.15;
  if (G && G.sector === 'abyss') spd *= 1.15; // Frozen slipstream
  if (G && G.sector === 'dunes') spd *= 0.85; // Quicksand drag
  let armor = d.armor;
  if (G && G.sector === 'abyssal') armor = Math.min(0.85, armor + 0.10); // Ocean depth pressure
  if (G.mutator && G.mutator.id === 'heavy_plating') armor = Math.min(0.85, armor + 0.20);
  const isChamp = !!(affix && CHAMPION_AFFIXES[affix]);
  const finalHp = isChamp ? Math.round(hp * 1.4) : hp;
  const finalReward = isChamp ? Math.round(d.reward * 1.4 * (1 + 0.03 * (n - 1))) : Math.max(1, Math.round(d.reward * (1 + 0.03 * (n - 1))));
  let pId = pathId || 0;
  if (!pathId && G && G.entropy && G.entropy.flankBreachActiveT > 0 && Math.random() < 0.35 && typeof PATH_BREACH !== 'undefined' && PATH_BREACH.length > 0) {
    pId = 1;
  }
  const startPt = (pId === 1 && PATH_BREACH.length > 0) ? PATH_BREACH[0] : PATH[0];
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
    counterTrait: null,
    hijackedT: 0, hijackFireCd: 0, reversed: 0,
    // 17.0 The Chrono-Tactical Singularity Properties
    isAberration: type === 'temporal_aberration',
    isDecoy: false,
    dispersionCocoon: false,
    cocoonElement: null,
    burrowed: type === 'phase_burrower',
    // 18.0 The Cataclysmic Convergence Properties
    isColossus: type === 'nemesis_dread_colossus',
    isRaptor: type === 'kamikaze_raptor',
    adaptedElement: null,
    adaptTimer: 3.0,
    // 19.0 The Omni-Synthesis & Counter-Taxa Properties
    isCarapace: type === 'chitin_phase_carapace',
    isDevourer: type === 'thermophilic_devourer',
    isFaraday: type === 'faraday_behemoth',
    isWeaver: type === 'resonance_weaver',
    carapaceHits: 0,
    weaverCd: 6.0,
    // 20.0 The Transcendent Architecture & Non-Euclidean Properties
    isPhantom: type === 'void_phantom',
    isWraith: type === 'causal_wraith',
    // 21.0 Maestro Dynamic Pacing Properties
    isLootDrone: type === 'golden_drone',
    isDoppel: type === 'doppelganger',
    // 22.0 The Epoch Horizon Properties
    isSlimeWeaver: type === 'slime_weaver',
    isEtherVoid: type === 'rift_breacher',
    isLeviathan: type === 'planetary_leviathan',
    slimeSprayCd: 3.0,
    genome: { kin: 0.1, heat: 0.1, elec: 0.1, cryo: 0.1, twitch: 0.1, mitosis: 0, frenzy: 0, entropic: 0 }
  };

  // 17.0 Decoy Swarm & Dispersion Cocoon Adaptation
  if (G && G.nemesis) {
    if (G.nemesis.activeDecoyWave) {
      e.isDecoy = true;
      e.hp = Math.round(e.hp * 0.20);
      e.maxHp = e.dispHp = e.hp;
      e.reward = 0;
    }
    if (type !== 'swarm' && type !== 'boss' && !e.isAberration && !e.isDecoy && G.wave >= 4 && G.nemesis.dominantElement && Math.random() < 0.35) {
      e.dispersionCocoon = true;
      e.cocoonElement = G.nemesis.dominantElement;
    }
  }

  // Reactive Hivemind Counter-Traits (4.0)
  if (G && G.hiveCounterTrait && type !== 'boss' && Math.random() < 0.65) {
    e.counterTrait = G.hiveCounterTrait;
  }

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

  // 9.0 Symbiotic Parasite Attachment (Absorbs Slow & Stun until sniped)
  if ((type === 'brute' || type === 'carrier' || type === 'gorger') && n >= 5 && Math.random() < 0.35) {
    e.hasParasite = true;
  }

  // 8.0 Colossal Multi-Part Titan Boss Anatomies
  if (type === 'boss' && typeof setupBossMultiParts === 'function') {
    setupBossMultiParts(e);
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
  return e;
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

  // 14.0 Sublimation Steam Cloud Debuff: In-cloud detection
  e.inSteamCloud = false;
  if (G && G.steamClouds && G.steamClouds.length > 0) {
    for (const sc of G.steamClouds) {
      if (Math.hypot(e.x - sc.x, e.y - sc.y) <= (sc.r || 60)) {
        e.inSteamCloud = true;
        break;
      }
    }
  }
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
        if (typeof spawnHostileArtillery === 'function') {
          spawnHostileArtillery(e, bestT, 140);
        } else {
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
        if (typeof spawnHostileArtillery === 'function') {
          spawnHostileArtillery(e, targetTower, 180);
        } else {
          targetTower.empT = 2.8;
          addFx('tracer', e.x, e.y, targetTower.x, targetTower.y, 0.4, '#f87171', 3);
          burst(targetTower.x, targetTower.y, 16, '#f87171', 120, 0.45, 3, false);
          addText(targetTower.x, targetTower.y - 20, 'DISRUPTED', '#f87171', 13);
          Sfx.play('boom');
        }
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

    // 5.0 Titan Boss Goliath: Raise Line-of-Sight blocking Seismic Pillars
    if (e.titanId === 'goliath' && !e.dead) {
      e.pillarCd = (e.pillarCd !== undefined ? e.pillarCd : 5.0) - dt;
      if (e.pillarCd <= 0 && (!G.seismicPillars || G.seismicPillars.length < 3)) {
        e.pillarCd = 8.0;
        G.seismicPillars = G.seismicPillars || [];
        const px = clamp(e.x + (Math.random() < 0.5 ? -45 : 45), 40, W - 40);
        const py = clamp(e.y + (Math.random() < 0.5 ? -45 : 45), 40, H - 40);
        G.seismicPillars.push({ x: px, y: py, r: 24, hp: 450, maxHp: 450 });
        burst(px, py, 20, '#78716c', 120, 0.5, 3.5, false);
        shake(6);
        addText(px, py - 24, 'SEISMIC PILLAR RAISED', '#a8a29e', 13);
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

    // 5.0 Titan Boss Chrono-Weaver: Time Inversion against Cryo
    if (e.titanId === 'chronoweaver' && (e.slowT > 0 || e.stunT > 0)) {
      e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
      e.speedBoostT = 2.0;
      burst(e.x, e.y, 14, '#38bdf8', 130, 0.45, 3, true);
      addText(e.x, e.y - e.r - 24, 'TIME INVERSION SURGE!', '#38bdf8', 15);
      shake(4);
    }

    // Titan Boss: Apex Swarm-Mother (Brood, Kamikaze Drones, Berserk)
    if (e.titanId === 'swarm_mother' && !e.dead) {
      e.broodCd = (e.broodCd !== undefined ? e.broodCd : 5.0) - dt;
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

      // 5.0 Titan Boss Apex Mother: Bio-Regeneration from Creep (Phase 2)
      if (e.hp <= e.maxHp * 0.50 && G && G.creep) {
        e.creepAbsorbCd = (e.creepAbsorbCd !== undefined ? e.creepAbsorbCd : 3.0) - dt;
        if (e.creepAbsorbCd <= 0) {
          e.creepAbsorbCd = 3.5;
          let absorbed = 0;
          for (const key in G.creep) {
            const [cr, cc] = key.split(',').map(Number);
            const cx = cc * TILE + TILE / 2, cy = cr * TILE + TILE / 2;
            if (Math.hypot(e.x - cx, e.y - cy) <= 2.2 * TILE) {
              delete G.creep[key];
              absorbed++;
              burst(cx, cy, 6, '#84cc16', 70, 0.3, 2, false);
              if (absorbed >= 3) break;
            }
          }
          if (absorbed > 0) {
            const healAmt = absorbed * 80;
            e.hp = Math.min(e.maxHp, e.hp + healAmt);
            e.dispHp = e.hp;
            burst(e.x, e.y, 16, '#84cc16', 110, 0.5, 3, true);
            addText(e.x, e.y - e.r - 26, '+' + healAmt + ' BIO-DEVOUR!', '#84cc16', 15);
            if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('spore_burst');
          }
        }
      }
    }
  }
  // 12.0 Biomechanical Hive Adaptive Mutation: Cryo-Adrenaline
  if (G && G.activeHiveMutations && G.activeHiveMutations.cryoAdrenaline) {
    if ((e.slowT > 0 || e.stunT > 0) && (!e.adrenalineCd || e.adrenalineCd <= 0)) {
      e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
      e.speedBoostT = 4.0;
      e.adrenalineCd = 7.0;
      burst(e.x, e.y, 8, '#f97316', 70, 0.35, 2.5, true);
      addText(e.x, e.y - e.r - 20, 'ADRENALINE SURGE +35%', '#f97316', 12);
    }
  }
  if (e.adrenalineCd > 0) e.adrenalineCd -= dt;

  let sp = e.speed;
  if (e.speedBoostT > 0) { e.speedBoostT -= dt; sp *= 1.35; }

  // 12.0 Harmonic Lattice Singularity Slow
  if (G && G.harmonicLattices && typeof pointInTriangle === 'function') {
    for (const lat of G.harmonicLattices) {
      if (lat.id === 'singularity' && pointInTriangle(e.x, e.y, lat.p1.x, lat.p1.y, lat.p2.x, lat.p2.y, lat.p3.x, lat.p3.y)) {
        e.shield = 0;
        sp *= 0.50;
        break;
      }
    }
  }
  if (G.mutator && G.mutator.id === 'frenzy' && e.hp < e.maxHp * 0.4) sp *= 1.35;
  if (G.mutator && G.mutator.id === 'cryo_lockdown') sp *= 0.80;
  if (G.mutator && G.mutator.id === 'overcharge_anomaly') sp *= 1.25;

  // 5.0 Biomass Creep Speed Multiplier (+30% speed)
  const tileC = Math.floor(e.x / TILE), tileR = Math.floor(e.y / TILE);
  if (G && G.creep && G.creep[tileR + ',' + tileC] && e.stunT <= 0) {
    sp *= (typeof BIOMASS_CONFIG !== 'undefined' ? BIOMASS_CONFIG.creepSpeedMult : 1.30);
  }

  // 9.0 Reactive Dynamic Soil Influences
  if (G && G.soilTiles) {
    const soil = G.soilTiles[tileC + '_' + tileR];
    if (soil) {
      if (soil.type === 'thermal_ash') {
        dealDamage(e, (soil.dps || 45) * dt, 'energy', null, { noReaction: true });
        e.noRegen = true;
        if (Math.random() < 0.2) burst(e.x, e.y, 1, '#f97316', 30, 0.2, 1.5, false);
      } else if (soil.type === 'frost_slick') {
        sp *= (soil.speedMult || 1.60);
        if (e.isTurningCorner && (!e.skidCd || e.skidCd <= 0)) {
          e.skidCd = 3.0;
          e.stunT = Math.max(e.stunT || 0, 2.0);
          dealDamage(e, 120, 'phys', null, { noReaction: true });
          burst(e.x, e.y, 14, '#38bdf8', 110, 0.45, 3, true);
          addText(e.x, e.y - e.r - 20, 'ICE SKID CRASH!', '#38bdf8', 13);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('shatter');
        }
      } else if (soil.type === 'acid_sinkhole') {
        if (e.type === 'scout' || e.type === 'swarm') {
          e.dead = true; e.hp = 0;
          burst(e.x, e.y, 16, '#84cc16', 90, 0.5, 3, true);
          addText(e.x, e.y - 15, 'SINKHOLE SWALLOWED!', '#84cc16', 13);
          return;
        } else {
          sp *= 0.50;
        }
      }
    }
  }
  if (e.skidCd > 0) e.skidCd -= dt;

  // 9.0 Rockslide Path Blockage & Rubble Clearing
  if (G && G.rockslides && G.rockslides.length > 0) {
    for (const rs of G.rockslides) {
      if (!rs.cleared && Math.hypot(rs.x - e.x, rs.y - e.y) <= 35) {
        if (e.type === 'brute' || e.type === 'carrier' || e.type === 'boss') {
          rs.hp -= (typeof DESTRUCTIBLE_TERRAIN_CONFIG !== 'undefined' ? DESTRUCTIBLE_TERRAIN_CONFIG.clearingRate : 20) * dt;
          sp = 0;
          if (Math.random() < 0.2) burst(rs.x, rs.y, 2, '#78716c', 40, 0.2, 2, false);
          if (rs.hp <= 0) rs.cleared = true;
        } else {
          sp = 0;
        }
      }
    }
  }

  // 18.0 Nemesis Dread-Colossus Mid-Fight Elemental Adaptation
  if (e.isColossus && !e.dead) {
    e.adaptTimer = (e.adaptTimer || 3.0) - dt;
    if (e.adaptTimer <= 0 && e.damageTracker) {
      e.adaptTimer = 3.5;
      let highestElem = null, maxAccum = 0;
      for (const el in e.damageTracker) {
        if (e.damageTracker[el] > maxAccum) {
          maxAccum = e.damageTracker[el];
          highestElem = el;
        }
      }
      if (highestElem && e.adaptedElement !== highestElem && maxAccum >= 60) {
        e.adaptedElement = highestElem;
        if (typeof addRing === 'function') addRing(e.x, e.y, 14, 85, 0.5, '#a855f7', 4);
        if (typeof burst === 'function') burst(e.x, e.y, 18, '#a855f7', 120, 0.45, 3, true);
        if (typeof addText === 'function') addText(e.x, e.y - e.r - 20, 'ADAPTED: ' + highestElem.toUpperCase(), '#a855f7', 14);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('reaction');
      }
    }
  }

  // 18.0 Kamikaze Phase-Raptor Detonation on Barricades
  if (e.isRaptor && !e.dead && G && G.barricades && G.barricades.length > 0) {
    for (let bIdx = G.barricades.length - 1; bIdx >= 0; bIdx--) {
      const bar = G.barricades[bIdx];
      if (bar.hp > 0 && Math.hypot(bar.x - e.x, bar.y - e.y) <= 30) {
        bar.hp = 0;
        e.dead = true;
        if (typeof burst === 'function') burst(e.x, e.y, 25, '#f43f5e', 140, 0.5, 3.5, true);
        if (typeof addText === 'function') addText(bar.x, bar.y - 15, 'RAPTOR DETONATION!', '#f43f5e', 14);
        if (typeof shake === 'function') shake(6);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
        G.barricades.splice(bIdx, 1);
        break;
      }
    }
  }

  // 19.0 Sub-Spatial Resonance Weaver Antisonic Pulse
  if (e.isWeaver && !e.dead) {
    if (e.weaverCd === undefined) e.weaverCd = 6.0;
    e.weaverCd -= dt;
    if (e.weaverCd <= 0) {
      e.weaverCd = 6.0;
      if (typeof addRing === 'function') addRing(e.x, e.y, 10, 130, 0.5, '#c084fc', 4);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('emp');
      if (typeof addText === 'function') addText(e.x, e.y - 20, 'ANTISONIC DISRUPTION!', '#c084fc', 12);
      if (G && G.fluxConduits) {
        for (const fc of G.fluxConduits) {
          if (Math.hypot(fc.t1.x - e.x, fc.t1.y - e.y) <= 130 || Math.hypot(fc.t2.x - e.x, fc.t2.y - e.y) <= 130) {
            fc.disabledT = 5.0;
          }
        }
      }
    }
  }

  // 9.0 Deployable Road Barricades Blockage & Hostile Clearing
  if (!e.isRaptor && G && G.barricades && G.barricades.length > 0) {
    for (let bIdx = G.barricades.length - 1; bIdx >= 0; bIdx--) {
      const bar = G.barricades[bIdx];
      if (bar.hp > 0 && Math.hypot(bar.x - e.x, bar.y - e.y) <= 32) {
        sp = 0;
        const atkDmg = (e.type === 'boss' ? 80 : (e.type === 'brute' || e.type === 'carrier' ? 45 : 18));
        bar.hp -= atkDmg * dt;
        if (Math.random() < 0.15) burst(bar.x, bar.y, 2, '#38bdf8', 35, 0.2, 1.5, false);
        if (bar.hp <= 0) {
          burst(bar.x, bar.y, 14, '#38bdf8', 90, 0.4, 2.5, true);
          addText(bar.x, bar.y - 15, 'BARRICADE SHATTERED!', '#f87171', 12);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('shatter');
          G.barricades.splice(bIdx, 1);
        }
      }
    }
  }

  // 9.0 Gorger Corpse Cannibalism
  if (e.type === 'gorger' && !e.dead && G && G.corpses && G.corpses.length > 0) {
    let nearestCorpse = null, minDist = 140;
    for (const cp of G.corpses) {
      const d = Math.hypot(cp.x - e.x, cp.y - e.y);
      if (d < minDist) { minDist = d; nearestCorpse = cp; }
    }
    if (nearestCorpse) {
      if (minDist > 16) {
        e.x += ((nearestCorpse.x - e.x) / minDist) * 45 * dt;
        e.y += ((nearestCorpse.y - e.y) / minDist) * 45 * dt;
        sp = 0;
      } else {
        const idx = G.corpses.indexOf(nearestCorpse);
        if (idx !== -1) G.corpses.splice(idx, 1);
        if (typeof feedGorger === 'function') feedGorger(e, nearestCorpse);
      }
    }
  }

  // 9.0 Subterranean Sapper Burrowing
  if (e.type === 'sapper' && !e.dead) {
    if (!e.burrowed && (!e.burrowCd || e.burrowCd <= 0)) {
      const nearTowers = G.towers ? G.towers.filter(t => Math.hypot(t.x - e.x, t.y - e.y) <= 120).length : 0;
      if (nearTowers >= 2) {
        e.burrowed = true;
        e.burrowT = 3.5;
        e.burrowCd = 10.0;
        burst(e.x, e.y, 10, '#78350f', 60, 0.35, 2.5, false);
        addText(e.x, e.y - 15, 'BURROWED!', '#b45309', 12);
      }
    }
    if (e.burrowT > 0) {
      e.burrowT -= dt;
      if (Math.random() < 0.25) burst(e.x, e.y, 2, '#78350f', 30, 0.2, 1.5, false);
      if (e.burrowT <= 0) {
        e.burrowed = false;
        burst(e.x, e.y, 12, '#78350f', 70, 0.4, 3, false);
        addText(e.x, e.y - 15, 'SURFACED', '#b45309', 12);
      }
    }
    if (e.burrowCd > 0) e.burrowCd -= dt;
  }

  // 15.0 DNTM Counter Hostile: Seismic Sapper Subterranean Eruption
  if (e.type === 'seismic_sapper' && !e.dead) {
    if (e.subterranean) {
      e.eruptTimer = (e.eruptTimer !== undefined ? e.eruptTimer : 6.0) - dt;
      if (Math.random() < 0.3) burst(e.x, e.y, 2, '#b45309', 25, 0.2, 1.5, false);
      if (e.eruptTimer <= 0) {
        e.subterranean = false;
        shake(14);
        burst(e.x, e.y, 25, '#b45309', 150, 0.6, 4, true);
        addRing(e.x, e.y, 10, 110, 0.6, '#b45309', 4);
        addText(e.x, e.y - 25, '💥 SEISMIC ERUPTION!', '#f59e0b', 16);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
        if (G && G.towers) {
          for (const t of G.towers) {
            if (Math.hypot(t.x - e.x, t.y - e.y) <= 130) {
              t.empT = Math.max(t.empT || 0, 4.0);
              burst(t.x, t.y, 8, '#f59e0b', 80, 0.35, 2.5, false);
              addText(t.x, t.y - 18, 'SEISMIC OVERLOAD', '#f59e0b', 12);
            }
          }
        }
      }
    }
  }

  // 15.0 DNTM Counter Hostile: Harpoon Colossus Mech Tether
  if ((e.type === 'harpoon_walker' || e.type === 'harpoon_colossus') && !e.dead && !(e.stunT > 0)) {
    if (G && G.mech && G.mech.active && !G.mech.isDocked) {
      const dMech = Math.hypot(G.mech.x - e.x, G.mech.y - e.y);
      if (dMech <= 220) {
        e.isTetheringMech = true;
        G.mech.rootedT = 0.5;
        const pullFactor = 35 * dt;
        G.mech.x += ((e.x - G.mech.x) / dMech) * pullFactor;
        G.mech.y += ((e.y - G.mech.y) / dMech) * pullFactor;
        if (Math.random() < 0.1 && typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('harpoon_tether');
      } else {
        e.isTetheringMech = false;
      }
    } else {
      e.isTetheringMech = false;
    }
  }

  // 17.0 Phase Burrower: Subterranean target acquisition and Stasis Web
  if (e.type === 'phase_burrower' && !e.dead && !(e.stunT > 0)) {
    if (e.burrowed) {
      let bestTower = null, maxInv = -1;
      if (G && G.towers) {
        for (const t of G.towers) {
          const inv = t.invested || 100;
          if (inv > maxInv) { maxInv = inv; bestTower = t; }
        }
      }
      if (bestTower) {
        const d = Math.hypot(bestTower.x - e.x, bestTower.y - e.y);
        if (d <= 45) {
          e.burrowed = false;
          bestTower.empT = 6.0;
          bestTower.stasisWeb = 6.0;
          burst(bestTower.x, bestTower.y, 20, '#a855f7', 120, 0.5, 3.5, true);
          addText(bestTower.x, bestTower.y - 25, 'STASIS WEB!', '#a855f7', 15);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('emp');
        }
      }
    }
  }

  // 15.0 DNTM Counter Hostile: Gold-Devourer Siphon
  if (e.type === 'gold_devourer' && !e.dead && !(e.stunT > 0)) {
    e.siphonTimer = (e.siphonTimer || 0) + dt;
    if (e.siphonTimer >= 1.0) {
      e.siphonTimer = 0;
      if (G && G.gold > 0) {
        const stolen = Math.min(G.gold, 15);
        G.gold -= stolen;
        e.stolenGold = (e.stolenGold || 0) + stolen;
        addText(e.x, e.y - 18, '-' + stolen + 'G SIPHONED', '#eab308', 12);
        burst(e.x, e.y, 4, '#eab308', 40, 0.3, 2, false);
      }
    }
  }

  // 9.0 Chaff Cloud Skimmer aerosol mist deployment
  if (e.type === 'chaff_skimmer' && !e.dead && !(e.stunT > 0) && (e.d === undefined || e.d > 0)) {
    e.chaffCd = (e.chaffCd !== undefined ? e.chaffCd : 2.5) - dt;
    if (e.chaffCd <= 0) {
      e.chaffCd = 3.5;
      G.hazards = G.hazards || [];
      G.hazards.push({
        type: 'chaff_cloud',
        x: e.x,
        y: e.y,
        r: 38,
        life: 6.0,
        max: 6.0
      });
      burst(e.x, e.y, 8, '#cbd5e1', 50, 0.35, 2.5, false);
      if (Math.random() < 0.35) addText(e.x, e.y - 16, 'CHAFF DEPLOYED', '#94a3b8', 11);
    }
  }

  // 9.0 Harpoon Leecher Mech & Tower Tethering
  if (e.type === 'harpoon_leecher' && !e.dead && !(e.stunT > 0)) {
    if (G && G.mech && G.mech.active && !G.mech.isDocked) {
      const dMech = Math.hypot(G.mech.x - e.x, G.mech.y - e.y);
      if (dMech <= 200) {
        e.isTetheringMech = true;
        e.tetheredTower = null;
        G.mech.rootedT = 0.5;
        G.mech.battery = Math.max(0, G.mech.battery - 15 * dt);
        if (Math.random() < 0.08 && typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('harpoon_tether');
      } else {
        e.isTetheringMech = false;
      }
    } else {
      e.isTetheringMech = false;
      if (G && G.towers && G.towers.length > 0) {
        let nearT = null, minTD = 160;
        for (const t of G.towers) {
          const d = Math.hypot(t.x - e.x, t.y - e.y);
          if (d < minTD) { minTD = d; nearT = t; }
        }
        if (nearT) {
          e.tetheredTower = nearT;
          nearT.empT = Math.max(nearT.empT || 0, 0.35); // suppress tower fire rate
          if (Math.random() < 0.08 && typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('harpoon_tether');
          for (const o of G.enemies) {
            if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) <= 80) {
              o.leecherBuffT = 0.5;
            }
          }
        } else {
          e.tetheredTower = null;
        }
      } else {
        e.tetheredTower = null;
      }
    }
  } else if (e.type === 'harpoon_leecher') {
    e.isTetheringMech = false;
    e.tetheredTower = null;
  }

  // 9.0 Symbiotic Parasite absorbs slow & stun for host
  if (e.hasParasite) {
    e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
  }

  // 16.0 Continuous CC Lockout Tracking (Anti-Permastun)
  if (e.rageImmune > 0) {
    e.rageImmune -= dt;
    e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
  } else if (e.slowT > 0 || e.stunT > 0) {
    e.continuousCcT = (e.continuousCcT || 0) + dt;
    if (e.continuousCcT >= 4.5 && typeof triggerKineticBreakout === 'function') {
      triggerKineticBreakout(e);
    }
  } else {
    e.continuousCcT = Math.max(0, (e.continuousCcT || 0) - dt * 2.0);
  }

  // 16.0 Syndicate Siphon Rig: Stationary Outpost
  if (e.type === 'siphon_rig') {
    sp = 0;
  }

  if (e.stunT > 0) sp = 0; else if (e.slowT > 0) sp *= 1 - e.slowAmt;
  if (e.leecherBuffT > 0) {
    e.leecherBuffT = Math.max(0, e.leecherBuffT - dt);
    sp *= 1.25;
  }

  // 13.0 Visceral Resonance: Molten Slag Slow & Thermal Burn
  if (G && G.moltenSlags && G.moltenSlags.length > 0) {
    for (const slag of G.moltenSlags) {
      if (Math.hypot(e.x - slag.x, e.y - slag.y) <= (slag.r || 38)) {
        sp *= 0.80;
        dealDamage(e, 35 * dt, 'plasma', null, { isSlag: true, noReaction: true });
        if (Math.random() < 0.08) burst(e.x, e.y, 2, '#f97316', 30, 0.2, 1.5, false);
        break;
      }
    }
  }

  // 13.0 Swarm Phalanx Formations
  if (e.type === 'brute' && G && G.enemies) {
    for (const ally of G.enemies) {
      if (ally !== e && !ally.dead && (ally.type === 'runner' || ally.type === 'swarmer') && Math.hypot(ally.x - e.x, ally.y - e.y) <= 80) {
        ally.phalanxShield = 0.5;
      }
    }
  }
  if (e.phalanxShield > 0) {
    e.phalanxShield = Math.max(0, e.phalanxShield - dt);
    e.armor = Math.min(0.75, (e.armor || 0) + 0.20);
  }

  // 13.0 Scatter Evasion vs Incoming Heavy Mortars
  if ((e.type === 'runner' || e.type === 'stalker') && G && G.incomingMortars && G.incomingMortars.length > 0) {
    for (const m of G.incomingMortars) {
      if (!m.reflected && m.progress > 0.4 && Math.hypot(m.tx - e.x, m.ty - e.y) <= 80) {
        e.off = (e.off || 0) + (Math.sign(e.off || 1) || 1) * 35 * dt;
        e.off = clamp(e.off, -18, 18);
        break;
      }
    }
  }

  // 13.0 Boss/Elite Tactical Heavy Mortar Launch
  if ((e.type === 'boss' || e.isElite) && !e.dead && e.d > 50) {
    e.mortarCd = (e.mortarCd !== undefined ? e.mortarCd : 8.0) - dt;
    if (e.mortarCd <= 0) {
      e.mortarCd = (e.type === 'boss' ? 7.0 : 10.0);
      const targetX = (G.mech && G.mech.active) ? G.mech.x : (typeof BASE_PT !== 'undefined' ? BASE_PT.x - 100 : 750);
      const targetY = (G.mech && G.mech.active) ? G.mech.y : (typeof BASE_PT !== 'undefined' ? BASE_PT.y : 300);
      if (typeof spawnHostileMortar === 'function') {
        spawnHostileMortar(e.x, e.y, targetX + rand(-35, 35), targetY + rand(-35, 35), e);
      }
    }
  }

  // Cyber-Hijacked minion AI
  if (e.hijackedT > 0) {
    e.hijackedT -= dt;
    sp = 0;
    e.hijackFireCd = (e.hijackFireCd !== undefined ? e.hijackFireCd : 0.6) - dt;
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

  // 6.0 Reclaimed Nanite Colossus Bastion Blocking
  if (G.reclaimedMinions && e.type !== 'boss') {
    const colossus = G.reclaimedMinions.find(m => m.type === 'colossus' && m.hp > 0 && Math.hypot(m.x - e.x, m.y - e.y) <= (m.r + e.r + 4));
    if (colossus) {
      sp = 0;
      colossus.hp -= (e.type === 'brute' ? 50 : 20) * dt;
      if (Math.random() < 0.15) burst(colossus.x, colossus.y, 2, '#94a3b8', 50, 0.2, 2, false);
      if (colossus.hp <= 0) {
        burst(colossus.x, colossus.y, 16, '#94a3b8', 120, 0.4, 3, true);
        addText(colossus.x, colossus.y - 18, 'COLOSSUS FALLEN', '#94a3b8', 12);
      }
    }
  }

  // Spore Pod Confusion (Walk backwards)
  if (e.reversed > 0) {
    e.reversed -= dt;
    sp = -Math.abs(sp);
  }

  // 8.0 Multi-Part Titan Boss: Locomotive Tendon Stagger
  if (e.staggerT > 0) {
    e.staggerT -= dt;
    sp = 0;
    if (Math.random() < 0.25) burst(e.x + rand(-15, 15), e.y + rand(-15, 15), 3, '#f97316', 50, 0.25, 2, true);
    if (e.staggerT <= 0) {
      e.staggerT = 0;
      if (G.grapplePrompt && G.grapplePrompt.boss === e) G.grapplePrompt = null;
    }
  }

  // 8.0 Multi-Part Titan Boss: Bio-Spore Artillery Mortar Pod
  if (e.parts && e.parts.mortar_pod && !e.parts.mortar_pod.broken && e.stunT <= 0 && e.staggerT <= 0 && !e.dead && e.d > 0) {
    e.parts.mortar_pod.timer = (e.parts.mortar_pod.timer || 0) + dt;
    if (e.parts.mortar_pod.timer >= (MULTI_PART_TITAN_CONFIG.parts.mortar_pod.fireInterval || 5.0) && G.towers.length > 0) {
      e.parts.mortar_pod.timer = 0;
      const targetTower = G.towers[Math.floor(Math.random() * G.towers.length)];
      targetTower.empT = 3.0;
      addFx('tracer', e.x, e.y, targetTower.x, targetTower.y, 0.45, '#a3e635', 3.5);
      burst(targetTower.x, targetTower.y, 18, '#a3e635', 130, 0.5, 3.5, false);
      addText(targetTower.x, targetTower.y - 20, 'BIO-SPORE ARTILLERY', '#a3e635', 13);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    }
  }

  // 8.0 Strategic Hivemind: Pheromone Avoidance Steering
  if (G && G.pheromoneMap && e.type !== 'boss') {
    const curC = Math.floor(e.x / TILE), curR = Math.floor(e.y / TILE);
    const phVal = G.pheromoneMap[curC + '_' + curR] || 0;
    if (phVal > 2.5) {
      e.off = Math.sin(G.time * 3 + e.id) * 16;
    }
  }

  // Sektor 03 Bio-Quarantine: Corrosive Acid Runoffs (continuous armor shred)
  if (G && G.sector === 'quarantine' && e.armor > 0) {
    e.shred = Math.min(e.armor, e.shred + e.armor * 0.15 * dt);
  }

  e.curSpeed = sp;
  e.d += sp * dt;
  if (e.reversed > 0 && e.d < 0) e.d = 0;
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
    if (G.cursedProtocols && G.cursedProtocols.includes('blood_pact')) {
      G.lives = 0;
      shake(20);
      Sfx.play('gameover');
      addText(BASE_PT.x - 40, BASE_PT.y - 30, 'BLOOD-PACT BREACHED! INSTANT LOSS!', '#f43f5e', 22);
      endGame(false);
      return;
    }
    G.lives -= e.leak; G.baseFlash = 1; G.dmgFlash = 1; shake(e.type === 'boss' ? 16 : 7 + e.leak);
    Sfx.play('leak');
    // 13.0 Citadel Aegis Protocol Last Stand Check
    if (typeof checkCitadelAegis === 'function') checkCitadelAegis();
    // 9.0 Persistent Nemesis Retribution on Boss/Elite Leak
    if (e.type === 'boss' || e.isElite || e.isNemesis) {
      if (typeof recordNemesisEscape === 'function') recordNemesisEscape(e);
    }
    addText(BASE_PT.x - 20, BASE_PT.y - 30, '-' + e.leak + (e.leak > 1 ? ' LIVES' : ' LIFE'), '#fb7185', 20);
    burst(BASE_PT.x, BASE_PT.y, 16, '#fb7185', 160, 0.6, 3.5, false);
    if (G.lives <= 0) { G.lives = 0; endGame(false); }
    return;
  }
  if (e.d < 0) e.d = 0;
  const p = posAt(e.d, e.seg, e.pathId);
  e.isTurningCorner = (p.seg !== e.seg);
  e.seg = p.seg;
  e.ang += angDiff(e.ang, p.ang) * Math.min(1, dt * 10);
  e.x = p.x - Math.sin(p.ang) * (e.off || 0); e.y = p.y + Math.cos(p.ang) * (e.off || 0);

  // 20.0 Chrono-Topological Space-Folding Transit & Stress
  if (!e.dead && G && G.spatialFolds && G.spatialFolds.length > 0) {
    for (const fold of G.spatialFolds) {
      if (!fold.active) continue;
      if (Math.hypot(e.x - fold.ptA.x, e.y - fold.ptA.y) <= 28) {
        e.x = fold.ptB.x;
        e.y = fold.ptB.y;
        fold.stress = (fold.stress || 0) + (typeof SPACE_FOLD_CONFIG !== 'undefined' ? SPACE_FOLD_CONFIG.stressPerPass : 12);
        if (typeof burst === 'function') burst(fold.ptB.x, fold.ptB.y, 10, '#38bdf8', 80, 0.3, 2, false);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('reaction');
        if (fold.stress >= (typeof SPACE_FOLD_CONFIG !== 'undefined' ? SPACE_FOLD_CONFIG.maxStress : 100)) {
          if (typeof triggerAbyssalTear === 'function') triggerAbyssalTear(fold);
        }
        break;
      }
    }
  }

  // 22.0 The Epoch Horizon Hostile Routines (Slime Weaver, Ether Void, Planetary Leviathan)
  if (!e.dead) {
    if (e.isSlimeWeaver) {
      e.slimeSprayCd = (e.slimeSprayCd || 3.0) - dt;
      if (e.slimeSprayCd <= 0) {
        e.slimeSprayCd = 4.5;
        if (G && G.fluxConduits && G.fluxConduits.length > 0) {
          const fc = G.fluxConduits.find(c => !c.disabledT && Math.hypot(((c.t1.x + c.t2.x) / 2) - e.x, ((c.t1.y + c.t2.y) / 2) - e.y) <= 120);
          if (fc) {
            fc.disabledT = 4.0;
            if (typeof burst === 'function') burst(e.x, e.y, 14, '#22c55e', 80, 0.4, 3, false);
            if (typeof addText === 'function') addText(e.x, e.y - 18, 'CONDUIT CORRODED!', '#22c55e', 12);
            if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('reaction');
          }
        }
      }
    }
    if (e.isEtherVoid) {
      const bPt = (typeof BASE_PT !== 'undefined') ? BASE_PT : { x: 880, y: 300 };
      const toBaseAngle = Math.atan2(bPt.y - e.y, bPt.x - e.x);
      e.x += Math.cos(toBaseAngle) * (e.speed * 0.35) * dt;
      e.y += Math.sin(toBaseAngle) * (e.speed * 0.35) * dt;
    }
    if (e.isLeviathan) {
      e.pulseTimer = (e.pulseTimer || 0) + dt;
      if (e.pulseTimer >= 6.0) {
        e.pulseTimer = 0;
        if (typeof shake === 'function') shake(10.0);
        if (typeof addRing === 'function') addRing(e.x, e.y, 10, 110, 0.6, '#a855f7', 4);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('shockwave');
      }
    }
  }
}
