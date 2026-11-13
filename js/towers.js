'use strict';
/* Tower placement, targeting and weapons */

/* ============================================================
   TOWERS
   ============================================================ */
function acquire(t, rangePx) {
  let best = null, bv = 0;
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if (e.stealth && e.revealT <= 0) continue; // Unrevealed stealth cannot be locked
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
function placeTower(col, row, type) {
  const def = TD[type];
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS || pathTile[row][col] || G.grid[row][col]) return false;
  if (G.gold < def.cost) { Sfx.play('error'); return false; }
  G.gold -= def.cost;
  const t = {
    type, c: col, r: row, x: col * TILE + TILE / 2, y: row * TILE + TILE / 2, tier: 0, branch: null, angle: -Math.PI / 2,
    recoil: 0, flash: 0, spin: Math.random() * 6, spinV: 3, cd: 0.3, prio: 'first', invested: def.cost,
    kills: 0, dmg: 0, pulseN: 0, charge: 1, pop: 1, empT: 0, overchargeT: 0, heat: 0
  };
  G.towers.push(t); G.grid[row][col] = t;
  burst(t.x, t.y, 14, def.color, 110, 0.5, 3, false);
  addRing(t.x, t.y, 6, 36, 0.35, def.color, 3);
  Sfx.play('place');
  return t;
}
function upgradeTower(t, branch) {
  if (!t || t.tier >= 2) return;
  const def = TD[t.type];
  let cost = 0;
  if (t.tier === 0) {
    cost = def.tiers[1].upg;
    if (G.gold < cost) { Sfx.play('error'); return; }
    G.gold -= cost; t.tier = 1; t.invested += cost; t.pop = 1;
  } else if (t.tier === 1) {
    branch = branch || 'A';
    const bDef = def.branches[branch];
    cost = bDef.upg;
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

  let rateMult = 1, rangeMult = 1;
  if (t.overchargeT > 0) rateMult *= 2.0;
  if (hasPerk('targeting_matrix')) { rangeMult *= 1.15; }
  if (G.mutator && G.mutator.id === 'emp_jam') rangeMult *= 0.88;
  if (G.mutator && G.mutator.id === 'ion_storm' && t.type !== 'tesla') rateMult *= 0.85;

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
  const rangePx = st.range * rangeMult * TILE;

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
    const p = posAt(Math.min(PLEN, e.d + e.curSpeed * tt), e.seg);
    tx = p.x - Math.sin(p.ang) * e.off; ty = p.y + Math.cos(p.ang) * e.off;
  }
  G.proj.push({ x: mx, y: my, tx, ty, dmg: st.dmg, splash: st.splash * TILE, shred: st.shred, src: t, trail: 0, branch: t.branch, radDur: st.radDur, radDps: st.radDps, acidAmp: st.acidAmp });
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
    G.hazards.push({ type: 'radiation', x: p.x, y: p.y, r: p.splash * 1.1, life: p.radDur, max: p.radDur, dps: p.radDps, shred: p.shred, src: p.src });
  }
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= p.splash + e.r) {
      const fall = 1 - 0.4 * clamp(d / p.splash, 0, 1);
      if (e.armor > 0 && e.shred < e.armor) e.shred = Math.min(e.armor, e.shred + p.shred);
      if (p.acidAmp) { e.brittle = Math.max(e.brittle, p.acidAmp); e.brittleT = 3.0; }
      dealDamage(e, p.dmg * fall, 'plasma', p.src);
    }
  }
}
function cryoPulse(t, st, rangePx, effRate) {
  t.cd = 1 / effRate; t.pulseN++; t.flash = 1;
  const isAbsZero = t.branch === 'A', isVortex = t.branch === 'B';
  const freeze = (isAbsZero) || (st.freeze && t.pulseN % 4 === 0);
  addRing(t.x, t.y, 10, rangePx, 0.55, isAbsZero ? '#93c5fd' : (isVortex ? '#3b82f6' : 'rgba(147,197,253,0.9)'), isAbsZero ? 5 : 4);
  addRing(t.x, t.y, 4, rangePx * 0.75, 0.45, 'rgba(219,234,254,0.6)', 2);
  Sfx.play('cryo');
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > (rangePx + e.r) ** 2) continue;
    e.revealT = 3.0; // reveals stealth units!
    e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, st.slow); e.slowT = 1.8;
    e.brittle = Math.max(e.brittleT > 0 ? e.brittle : 0, st.brittle); e.brittleT = 2.5;
    burst(e.x, e.y, 3, '#bfdbfe', 50, 0.5, 2.5, false);
    if (isVortex && st.pullDist) {
      e.d = Math.max(0, e.d - st.pullDist);
      burst(e.x, e.y, 6, '#60a5fa', 80, 0.4, 2, true);
    }
    if (freeze && e.type !== 'boss') {
      e.stunT = isAbsZero ? st.freezeDur : 0.9;
      addText(e.x, e.y - e.r - 14, 'FROZEN', '#e0f2fe', 12);
    }
    dealDamage(e, st.dmg, 'energy', t);
  }
}
const BOUNCE = 1.8;
function fireTesla(t, st, e) {
  const hit = [e];
  for (let k = 1; k < st.targets; k++) {
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
  hit.forEach((h, i) => {
    h.revealT = 2.5; // reveals stealth
    if (isEmp) {
      if (h.shield > 0) { h.shield = 0; h.shieldT = 0; burst(h.x, h.y, 8, '#22d3ee', 100, 0.4, 3, true); }
      if (h.type !== 'boss') h.stunT = Math.max(h.stunT, st.empStun);
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
    // Executioner execution check
    if (t.branch === 'B' && st.execThresh && o.type !== 'boss' && (o.hp / o.maxHp) <= st.execThresh) {
      o.hp = 0;
      addText(o.x, o.y - o.r - 18, 'EXECUTED', '#f43f5e', 16);
      burst(o.x, o.y, 20, '#f43f5e', 180, 0.5, 3.5, true);
      killEnemy(o, t);
    } else {
      dealDamage(o, dmg, 'phys', t, { crit });
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
