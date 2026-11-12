'use strict';
/* Enemy spawning and behaviour */

/* ============================================================
   ENEMIES
   ============================================================ */
function spawnEnemy(type, n) {
  const d = ED[type], sc = hpScale(n), hp = Math.round(d.hp * sc);
  const spd = d.speed * (1 + Math.min(0.25, n * 0.006)) * (type === 'swarm' ? rand(0.98, 1.02) : rand(0.94, 1.06));
  const e = {
    type, id: ++eid, hp, maxHp: hp, dispHp: hp, shield: 0, maxShield: 0, speed: spd, curSpeed: spd, r: d.r,
    armor: d.armor, shred: 0, slowAmt: 0, slowT: 0, brittle: 0, brittleT: 0, stunT: 0,
    reward: Math.max(1, Math.round(d.reward * (1 + 0.03 * (n - 1)))), leak: d.leak,
    d: 0, seg: 0, x: PATH[0].x, y: PATH[0].y, ang: 0, off: 0, dead: false, flash: 0, dmgAcc: 0, dmgT: 0,
    healT: rand(0.6, 1.4), shieldCd: 4, shieldT: 0, anim: Math.random() * 10, healFx: 0
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
  if (e.type === 'boss') {
    if (e.shieldT > 0) {
      e.shieldT -= dt;
      if (e.shieldT <= 0) { e.shield = 0; }
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
  if (e.stunT > 0) sp = 0; else if (e.slowT > 0) sp *= 1 - e.slowAmt;
  e.curSpeed = sp;
  e.d += sp * dt;
  if (e.d >= PLEN) {
    e.dead = true;
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
