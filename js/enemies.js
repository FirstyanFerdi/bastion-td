'use strict';
/* Enemy spawning and behaviour */

/* ============================================================
   ENEMIES
   ============================================================ */
function spawnEnemy(type, n) {
  const d = ED[type], sc = hpScale(n), hp = Math.round(d.hp * sc);
  let spd = d.speed * (1 + Math.min(0.25, n * 0.006)) * (type === 'swarm' ? rand(0.98, 1.02) : rand(0.94, 1.06));
  let armor = d.armor;
  if (G.mutator && G.mutator.id === 'heavy_plating') armor = Math.min(0.85, armor + 0.20);
  const e = {
    type, id: ++eid, hp, maxHp: hp, dispHp: hp, shield: 0, maxShield: 0, speed: spd, curSpeed: spd, r: d.r,
    armor, shred: 0, slowAmt: 0, slowT: 0, brittle: 0, brittleT: 0, stunT: 0,
    reward: Math.max(1, Math.round(d.reward * (1 + 0.03 * (n - 1)))), leak: d.leak,
    d: 0, seg: 0, x: PATH[0].x, y: PATH[0].y, ang: 0, off: 0, dead: false, flash: 0, dmgAcc: 0, dmgT: 0,
    healT: rand(0.6, 1.4), shieldCd: 4, shieldT: 0, anim: Math.random() * 10, healFx: 0,
    stealth: !!d.stealth, revealT: 0, carrierT: rand(1.5, 3.0), bleedT: 0, bleedDps: 0,
    phase: 1, mortarCd: 7
  };
  if (type === 'swarm') { e.off = rand(-15, 15); e.d = -rand(0, 22); }
  if ((type === 'scout' || type === 'brute') && n >= 8 && Math.random() < Math.min(0.5, (n - 6) * 0.05)) {
    e.maxShield = e.shield = Math.round(hp * (type === 'brute' ? 0.35 : 0.5));
  }
  if (type === 'boss') { shake(14); Sfx.play('boss'); addRing(PATH[1].x, PATH[1].y, 10, 120, 0.8, '#c084fc', 5); }
  e.x = PATH[0].x + e.d; e.y = PATH[0].y + e.off;
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
  }
  let sp = e.speed;
  if (G.mutator && G.mutator.id === 'frenzy' && e.hp < e.maxHp * 0.4) sp *= 1.35;
  if (e.stunT > 0) sp = 0; else if (e.slowT > 0) sp *= 1 - e.slowAmt;
  e.curSpeed = sp;
  e.d += sp * dt;
  if (e.d >= PLEN) {
    e.dead = true;
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
  if (e.d < 0) { e.x = PATH[0].x + e.d; e.y = PATH[0].y + e.off; }
  else {
    const p = posAt(e.d, e.seg); e.seg = p.seg;
    e.ang += angDiff(e.ang, p.ang) * Math.min(1, dt * 10);
    e.x = p.x - Math.sin(p.ang) * e.off; e.y = p.y + Math.cos(p.ang) * e.off;
  }
}
