'use strict';
/* Wave flow, win/lose and the fixed-step update() */

/* ============================================================
   WAVES / FLOW
   ============================================================ */
function startWave() {
  G.wave++;
  const n = G.wave, ev = buildSpawns(n), base = G.time + 0.5;
  for (const x of ev) G.queue.push({ at: base + x.t, type: x.type, wave: n });
  G.queue.sort((a, b) => a.at - b.at);
  G.state = 'active';
  G.leakedThisWave = 0;
  if (n > SAVE.bestWave) { SAVE.bestWave = n; Store.set('nb_bestWave', n); }
  const boss = n % 5 === 0;
  if (n >= 7 && (n % 2 === 1 || boss)) {
    const mKeys = Object.keys(WAVE_MUTATORS);
    G.mutator = WAVE_MUTATORS[mKeys[(n * 3) % mKeys.length]];
  } else {
    G.mutator = null;
  }
  let sub = boss ? 'Heavy hostile signature detected' : '';
  if (G.mutator) sub = (sub ? sub + ' · ' : '') + 'MUTATOR: ' + G.mutator.name;
  G.banner = { text: boss ? 'BOSS WAVE ' + n : 'WAVE ' + n, sub, t: 0, max: 2.6, color: boss ? '#d9534f' : (G.mutator ? '#f59e0b' : '#e2a72e') };
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
  const b = earlyBonus();
  if (b > 0) { G.gold += b; addText(W / 2, 80, '+' + b + ' early bonus', '#fbbf24', 18); Sfx.play('coin'); }
  startWave();
}
function onWaveClear() {
  const n = G.wave, bonus = 25 + n * 4;
  const isVC = hasPerk('venture_capital');
  const intRate = isVC ? 0.14 : 0.08, intCap = isVC ? 260 : 150;
  const interest = Math.min(intCap, Math.floor(G.gold * intRate));
  G.gold += bonus + interest; G.score += n * 100 + bonus + interest;
  addText(W / 2, 90, 'WAVE ' + n + ' CLEARED  +' + bonus, '#6ee7b7', 22);
  if (interest > 0) addText(W / 2, 118, 'interest +' + interest + (isVC ? ' (Venture Capital)' : ''), '#fbbf24', 16);
  Sfx.play('coin');
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
}
function saveBest() {
  if (G.score > SAVE.bestScore) { SAVE.bestScore = G.score; Store.set('nb_bestScore', SAVE.bestScore); }
  if (G.wave > SAVE.bestWave) { SAVE.bestWave = G.wave; Store.set('nb_bestWave', SAVE.bestWave); }
}
function endGame(won) {
  if (won) G.score += G.lives * 50;
  saveBest();
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
  G.time += dt; G.anim += dt;

  // Commander skills cooldown
  for (const k of ['orbital', 'overcharge', 'caltrops']) {
    if (G.skills[k] && G.skills[k].cd > 0) {
      const cdRate = hasPerk('orbital_salvo') && k === 'orbital' ? 1.5 : 1;
      G.skills[k].cd = Math.max(0, G.skills[k].cd - dt * cdRate);
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
    }
    if (h.life <= 0) G.hazards.splice(i, 1);
  }

  while (G.queue.length && G.queue[0].at <= G.time) { const q = G.queue.shift(); spawnEnemy(q.type, q.wave); }
  for (let i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
  let w = 0;
  for (let i = 0; i < G.enemies.length; i++) { const e = G.enemies[i]; if (!e.dead) G.enemies[w++] = e; }
  G.enemies.length = w;
  if (G.state === 'over') return;
  for (const t of G.towers) updateTower(t, dt);
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const p = G.proj[i], dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), step = PLASMA_SPD * dt;
    p.trail -= dt;
    if (p.trail <= 0) { p.trail = 0.02; const q = partPool.get(); q.x = p.x; q.y = p.y; q.vx = rand(-12, 12); q.vy = rand(-12, 12); q.life = q.max = 0.3; q.size = 3.5; q.color = '#fb923c'; q.drag = 2; q.round = true; }
    if (d <= step) { p.x = p.tx; p.y = p.ty; explode(p); G.proj.splice(i, 1); }
    else { p.x += dx / d * step; p.y += dy / d * step; }
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
}
