'use strict';
/* Tower placement, targeting and weapons */

/* ============================================================
   TOWERS
   ============================================================ */
function acquire(t, rangePx) {
  let best = null, bv = 0;
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
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
    type, c: col, r: row, x: col * TILE + TILE / 2, y: row * TILE + TILE / 2, tier: 0, angle: -Math.PI / 2,
    recoil: 0, flash: 0, spin: Math.random() * 6, spinV: 3, cd: 0.3, prio: 'first', invested: def.cost,
    kills: 0, dmg: 0, pulseN: 0, charge: 1, pop: 1
  };
  G.towers.push(t); G.grid[row][col] = t;
  burst(t.x, t.y, 14, def.color, 110, 0.5, 3, false);
  addRing(t.x, t.y, 6, 36, 0.35, def.color, 3);
  Sfx.play('place');
  return t;
}
function upgradeTower(t) {
  if (!t || t.tier >= 2) return;
  const def = TD[t.type], cost = def.tiers[t.tier + 1].upg;
  if (G.gold < cost) { Sfx.play('error'); return; }
  G.gold -= cost; t.tier++; t.invested += cost; t.pop = 1;
  burst(t.x, t.y, 26, def.color, 150, 0.7, 3.5, false);
  addRing(t.x, t.y, 8, 60, 0.5, def.color, 4);
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
  const def = TD[t.type], st = def.tiers[t.tier];
  t.cd -= dt; t.recoil = Math.max(0, t.recoil - dt * 6); t.flash = Math.max(0, t.flash - dt * 8); t.pop = Math.max(0, t.pop - dt * 4);
  t.charge = clamp(1 - t.cd * st.rate, 0, 1);
  const rangePx = st.range * TILE;
  if (t.type === 'cryo') {
    t.spin += dt * 0.9;
    if (t.cd <= 0) {
      let any = false;
      for (const e of G.enemies) { if (!e.dead && e.x > 2 && (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= (rangePx + e.r) ** 2) { any = true; break; } }
      if (any) cryoPulse(t, st, rangePx);
    }
    return;
  }
  const target = acquire(t, rangePx);
  t.spinV = lerp(t.spinV, target && t.type === 'gatling' ? 26 : 3, Math.min(1, dt * 6));
  t.spin += t.spinV * dt;
  if (t.type === 'tesla') { t.spin += dt * 0.8; if (target && t.cd <= 0) fireTesla(t, st, target); return; }
  if (!target) return;
  const desired = Math.atan2(target.y - t.y, target.x - t.x), diff = angDiff(t.angle, desired);
  const maxTurn = (t.type === 'rail' ? 7 : 11) * dt;
  t.angle += clamp(diff, -maxTurn, maxTurn);
  if (t.cd <= 0 && Math.abs(angDiff(t.angle, desired)) < 0.14) {
    t.cd = 1 / st.rate;
    if (t.type === 'gatling') fireGatling(t, st, target);
    else if (t.type === 'plasma') firePlasma(t, st, target);
    else if (t.type === 'rail') fireRail(t, st, target);
  }
}
function fireGatling(t, st, e) {
  const mx = t.x + Math.cos(t.angle) * (28 + t.tier * 3), my = t.y + Math.sin(t.angle) * (28 + t.tier * 3);
  t.recoil = 1; t.flash = 1;
  addFx('tracer', mx, my, e.x, e.y, 0.09, '#a5f3fc', 2);
  burst(e.x, e.y, 2, '#a5f3fc', 70, 0.25, 2, false);
  dealDamage(e, st.dmg, 'phys', t);
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
  G.proj.push({ x: mx, y: my, tx, ty, dmg: st.dmg, splash: st.splash * TILE, shred: st.shred, src: t, trail: 0 });
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
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d <= p.splash + e.r) {
      const fall = 1 - 0.4 * clamp(d / p.splash, 0, 1);
      if (e.armor > 0 && e.shred < e.armor) e.shred = Math.min(e.armor, e.shred + p.shred);
      dealDamage(e, p.dmg * fall, 'plasma', p.src);
    }
  }
}
function cryoPulse(t, st, rangePx) {
  t.cd = 1 / st.rate; t.pulseN++; t.flash = 1;
  const freeze = st.freeze && t.pulseN % 4 === 0;
  addRing(t.x, t.y, 10, rangePx, 0.55, 'rgba(147,197,253,0.9)', 4);
  addRing(t.x, t.y, 4, rangePx * 0.75, 0.45, 'rgba(219,234,254,0.6)', 2);
  Sfx.play('cryo');
  for (const e of G.enemies) {
    if (e.dead || e.x < 2) continue;
    if ((e.x - t.x) ** 2 + (e.y - t.y) ** 2 > (rangePx + e.r) ** 2) continue;
    e.slowAmt = Math.max(e.slowT > 0 ? e.slowAmt : 0, st.slow); e.slowT = 1.8;
    e.brittle = Math.max(e.brittleT > 0 ? e.brittle : 0, st.brittle); e.brittleT = 2.5;
    burst(e.x, e.y, 3, '#bfdbfe', 50, 0.5, 2.5, false);
    if (freeze && e.type !== 'boss') { e.stunT = 0.9; addText(e.x, e.y - e.r - 14, 'FROZEN', '#e0f2fe', 12); }
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
  t.cd = 1 / st.rate; t.flash = 1;
  let px = t.x, py = t.y - 4;
  hit.forEach((h, i) => {
    addBolt(px, py, h.x, h.y, '#fde047');
    burst(h.x, h.y, 4, '#fef08a', 100, 0.3, 2.5, false);
    dealDamage(h, st.dmg * Math.pow(0.88, i), 'energy', t, { shieldMult: st.sm });
    px = h.x; py = h.y;
  });
  Sfx.play('tesla');
}
function fireRail(t, st, e) {
  const a = t.angle, dx = Math.cos(a), dy = Math.sin(a);
  const len = st.range * TILE + 30, mx = t.x + dx * (34 + t.tier * 4), my = t.y + dy * (34 + t.tier * 4);
  const crit = Math.random() < st.crit, dmg = st.dmg * (crit ? st.cm : 1);
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
    burst(o.x, o.y, 8, '#fda4af', 150, 0.4, 3, false);
    dealDamage(o, dmg, 'phys', t, { crit });
  }
  const f = addFx('rail', mx, my, mx + dx * len, my + dy * len, 0.3, crit ? '#fde047' : '#fb7185', crit ? 8 : 6);
  for (let i = 0; i < 12; i++) {
    const d = rand(0, len), p = partPool.get();
    p.x = mx + dx * d; p.y = my + dy * d; p.vx = rand(-30, 30); p.vy = rand(-30, 30); p.life = p.max = rand(0.2, 0.5);
    p.size = 2.5; p.color = '#fecdd3'; p.drag = 3; p.round = true;
  }
  t.recoil = 1; t.flash = 1; shake(1.2);
  burst(mx, my, 10, '#fb7185', 160, 0.4, 3, true);
  Sfx.play('rail');
}
