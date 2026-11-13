'use strict';
/* Object pools, game state, particles/fx and damage model */

/* ============================================================
   POOLS
   ============================================================ */
class Pool {
  constructor(n, make) { this.items = Array.from({ length: n }, make); this.i = 0; }
  get() {
    const n = this.items.length;
    for (let k = 0; k < n; k++) {
      const it = this.items[(this.i + k) % n];
      if (!it.active) { this.i = (this.i + k + 1) % n; it.active = true; return it; }
    }
    const it = this.items[this.i]; this.i = (this.i + 1) % n; it.active = true; return it;
  }
  clear() { for (const it of this.items) it.active = false; }
}
const partPool = new Pool(900, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: '#fff', drag: 0, round: false }));
const fxPool = new Pool(160, () => ({ active: false, type: '', x1: 0, y1: 0, x2: 0, y2: 0, life: 0, max: 1, color: '#fff', w: 2, pts: null, r0: 0, r1: 0 }));
const textPool = new Pool(140, () => ({ active: false, x: 0, y: 0, vy: 0, life: 0, max: 1, text: '', color: '#fff', size: 12 }));

/* ============================================================
   GAME STATE
   ============================================================ */
let G = null;
let S = 1.5;            // render scale
let canvas, ctx, mapCanvas, last = 0;
let eid = 0;

function emptyGrid() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }

function hasPerk(id) { return G && G.perks && G.perks.indexOf(id) >= 0; }

function newGame(keepSpeed) {
  const speed = keepSpeed && G ? G.speed : 1;
  G = {
    state: 'prep', lives: 25, gold: 250, wave: 0, score: 0, time: 0, anim: 0, speed, paused: false,
    enemies: [], towers: [], proj: [], queue: [], grid: emptyGrid(),
    sel: null, placing: null, hover: null, mouse: { x: 0, y: 0, in: false },
    prepT: 20, shake: 0, dmgFlash: 0, baseFlash: 0, banner: null, endless: false, uiDirty: true, kills: 0,
    perks: [], skills: { orbital: { cd: 0 }, overcharge: { cd: 0 }, caltrops: { cd: 0 } },
    hazards: [], casting: null, mutator: null, drafting: null, leakedThisWave: 0
  };
  partPool.clear(); fxPool.clear(); textPool.clear();
}

/* ============================================================
   EFFECTS
   ============================================================ */
function burst(x, y, n, color, spd, life, size, round) {
  for (let i = 0; i < n; i++) {
    const p = partPool.get(), a = Math.random() * TAU, s = rand(0.25, 1) * spd;
    p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
    p.life = p.max = rand(0.5, 1) * life; p.size = rand(0.6, 1) * size; p.color = color; p.drag = 2.2; p.round = !!round;
  }
}
function addText(x, y, text, color, size) {
  const t = textPool.get();
  t.x = x + rand(-6, 6); t.y = y; t.vy = 34; t.life = t.max = 0.9; t.text = text; t.color = color; t.size = size || 12;
}
function addFx(type, x1, y1, x2, y2, life, color, w) {
  const f = fxPool.get();
  f.type = type; f.x1 = x1; f.y1 = y1; f.x2 = x2; f.y2 = y2; f.life = f.max = life; f.color = color; f.w = w || 2; f.pts = null; f.r0 = 0; f.r1 = 0;
  return f;
}
function addRing(x, y, r0, r1, life, color, w) {
  const f = addFx('ring', x, y, x, y, life, color, w || 3); f.r0 = r0; f.r1 = r1; return f;
}
function addBolt(x1, y1, x2, y2, color) {
  const f = addFx('bolt', x1, y1, x2, y2, 0.2, color, 3);
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(3, Math.floor(d / 16)), nx = -(y2 - y1) / (d || 1), ny = (x2 - x1) / (d || 1);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, o = (i === 0 || i === n) ? 0 : rand(-8, 8);
    pts.push(x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o);
  }
  f.pts = pts;
}
function shake(a) { G.shake = Math.max(G.shake, a); }

/* ============================================================
   DAMAGE
   ============================================================ */
function dealDamage(e, amount, type, src, opts) {
  if (e.dead) return 0;
  opts = opts || {};
  let a = amount;
  if (type === 'phys') {
    let effArmor = Math.max(0, e.armor - e.shred);
    if (src && src.type === 'gatling' && hasPerk('depleted_uranium')) effArmor = Math.max(0, effArmor - 0.25);
    a *= (1 - effArmor);
  }
  if (e.brittleT > 0) a *= 1 + e.brittle;
  if (hasPerk('titan_hunter') && (e.type === 'boss' || e.type === 'brute' || e.type === 'carrier')) a *= 1.30;
  if (G.mutator && G.mutator.id === 'ion_storm' && (type === 'energy' || (src && src.type === 'tesla'))) a *= 1.25;
  if (e.shield > 0 && opts.shieldMult) a *= opts.shieldMult;
  e.flash = 1;
  let toHp = a;
  if (e.shield > 0) {
    if (a <= e.shield) { e.shield -= a; toHp = 0; }
    else { toHp = a - e.shield; e.shield = 0; e.shieldT = 0; burst(e.x, e.y, 8, '#67e8f9', 90, 0.4, 2.5, true); }
  }
  e.hp -= toHp;
  if (src && src.type === 'gatling' && hasPerk('depleted_uranium')) { e.bleedT = 2.5; e.bleedDps = 15; }
  if (src && src.type === 'tesla' && hasPerk('superconductor')) { e.brittle = Math.max(e.brittle, 0.25); e.brittleT = 2.5; }
  if (opts.crit) addText(e.x, e.y - e.r - 14, 'CRIT ' + Math.round(a), '#fde047', 17);
  else e.dmgAcc += a;
  if (src) src.dmg += a;
  Sfx.play('hit');
  if (e.hp <= 0) killEnemy(e, src);
  return a;
}
function killEnemy(e, src) {
  if (e.dead) return;
  e.dead = true;
  G.gold += e.reward; G.score += e.reward * 10; G.kills++;
  if (src) src.kills++;
  const col = e.type === 'scout' ? '#a3e635' : e.type === 'brute' ? '#94a3b8' : e.type === 'swarm' ? '#fb7185' : e.type === 'healer' ? '#6ee7b7' : e.type === 'stealth' ? '#38bdf8' : e.type === 'carrier' ? '#34d399' : e.type === 'breacher' ? '#fbbf24' : '#c084fc';
  if (e.type === 'boss') {
    burst(e.x, e.y, 70, col, 260, 1.1, 5, false); burst(e.x, e.y, 40, '#fff', 200, 0.7, 3, true);
    addRing(e.x, e.y, 10, 130, 0.7, '#c084fc', 5); shake(12); Sfx.play('boom');
    addText(e.x, e.y - 30, '+' + e.reward, '#fbbf24', 22);
  } else {
    burst(e.x, e.y, e.type === 'swarm' ? 6 : 14, col, 130, 0.5, e.type === 'brute' || e.type === 'carrier' ? 4 : 3, e.type === 'swarm');
    if (e.type !== 'swarm') addText(e.x, e.y - e.r - 6, '+' + e.reward, '#fbbf24', 13);
    Sfx.play('kill');
  }
  // Perk: Cryo Shatter
  if (hasPerk('cryo_shatter') && (e.slowT > 0 || e.stunT > 0)) {
    burst(e.x, e.y, 16, '#93c5fd', 150, 0.5, 3.5, false);
    Sfx.play('shatter');
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 75 * 75) dealDamage(o, 28, 'energy', null);
    }
  }
  // Perk: Chain Reaction on Plasma kill
  if (hasPerk('chain_reaction') && src && src.type === 'plasma') {
    burst(e.x, e.y, 14, '#fdba74', 120, 0.4, 3, true);
    addRing(e.x, e.y, 6, 50, 0.35, '#fb923c', 2);
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 55 * 55) dealDamage(o, 35, 'plasma', src);
    }
  }
  // EMP Breacher detonation
  if (e.type === 'breacher') {
    burst(e.x, e.y, 24, '#facc15', 180, 0.6, 4, true);
    addRing(e.x, e.y, 8, 90, 0.5, '#fef08a', 4);
    shake(3.5); Sfx.play('emp');
    let bestT = null, bestD = 170 * 170;
    for (const t of G.towers) {
      const d = (t.x - e.x) ** 2 + (t.y - e.y) ** 2;
      if (d < bestD) { bestD = d; bestT = t; }
    }
    if (bestT) {
      bestT.empT = 3.5;
      addText(bestT.x, bestT.y - 20, 'EMP STUN', '#facc15', 13);
    }
  }
  G.uiDirty = G.sel ? true : G.uiDirty;
}
