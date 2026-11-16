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

function initDoctrineSkills() {
  if (!G) return;
  G.skills = {};
  if (typeof COMMANDER_SKILLS !== 'undefined') {
    for (const skId of Object.keys(COMMANDER_SKILLS)) {
      G.skills[skId] = { cd: 0 };
    }
  }
}

function newGame(keepSpeed) {
  const asc = (typeof SAVE !== 'undefined' && SAVE.ascension) || 0;
  const startLives = asc >= 2 ? 12 : 25;
  const speed = keepSpeed && G ? G.speed : 1;
  const startBonus = typeof getWorkshopLevel === 'function' ? getWorkshopLevel('treasury') * 50 : 0;
  const docId = (typeof SAVE !== 'undefined' && SAVE.doctrine) || 'vanguard';
  G = {
    state: 'prep', lives: startLives, gold: 250 + startBonus, wave: 0, score: 0, time: 0, anim: 0, speed, paused: false,
    enemies: [], towers: [], proj: [], queue: [], grid: emptyGrid(),
    sel: null, placing: null, hover: null, mouse: { x: 0, y: 0, in: false },
    prepT: 20, shake: 0, dmgFlash: 0, baseFlash: 0, banner: null, endless: false, uiDirty: true, kills: 0,
    perks: [], skills: {},
    hazards: [], casting: null, mutator: null, drafting: null, leakedThisWave: 0, citadelCd: 0,
    fuelCells: [
      { id: 1, c: 6, row: 3, x: 6 * TILE + TILE / 2, y: 3 * TILE + TILE / 2, r: 16, hp: 60, maxHp: 60, dead: false },
      { id: 2, c: 12, row: 7, x: 12 * TILE + TILE / 2, y: 7 * TILE + TILE / 2, r: 16, hp: 60, maxHp: 60, dead: false }
    ],
    ascension: asc,
    doctrine: docId,
    damageTrack: { phys: 0, cryo: 0, energy: 0, plasma: 0, skills: 0 },
    hiveMutation: null,
    activeContract: null,
    contractFailed: false,
    infiltratorDroneUsed: -1,
    sabotRoundsT: 0,
    liquidationT: 0,
    skillsUsedThisWave: 0,
    swapSource: null
  };
  initDoctrineSkills();
  partPool.clear(); fxPool.clear(); textPool.clear();
}

function detonateFuelCell(fc) {
  if (!fc || fc.dead) return;
  fc.dead = true;
  fc.hp = 0;
  const R = 110;
  addRing(fc.x, fc.y, 12, R, 0.7, '#f97316', 5);
  burst(fc.x, fc.y, 45, '#f97316', 220, 0.85, 4.5, true);
  burst(fc.x, fc.y, 25, '#fff7ed', 150, 0.5, 3, true);
  shake(14);
  Sfx.play('boom');
  addText(fc.x, fc.y - 28, 'FUEL CELL DETONATION!', '#f97316', 17);
  G.hazards.push({ type: 'radiation', x: fc.x, y: fc.y, r: 90, life: 4.5, max: 4.5, dps: 42, shred: 0.35, src: null });
  for (const e of G.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - fc.x, e.y - fc.y);
    if (d <= R + e.r) {
      if (e.armor > 0) e.shred = e.armor; // 100% armor shred
      dealDamage(e, 450, 'plasma', null);
    }
  }
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
  if (G && G.damageTrack && G.damageTrack[type] !== undefined) {
    G.damageTrack[type] += amount;
  }

  // Hive Mutation: Chitin Armor Plating (deflects first 4 physical hits)
  if (e.chitinHits > 0 && type === 'phys') {
    e.chitinHits--;
    burst(e.x, e.y, 4, '#fb7185', 65, 0.25, 2.5, false);
    addText(e.x, e.y - e.r - 18, 'CHITIN DEFLECT (' + e.chitinHits + ')', '#fb7185', 11);
    return 0;
  }

  // Hive Mutation: Cryo-Thermal Insulation (Adrenaline speed surge on cold)
  if (e.insulation && (type === 'cryo' || (src && src.type === 'cryo'))) {
    if (e.stunT <= 0 && (!e.speedBoostT || e.speedBoostT <= 0)) {
      e.speedBoostT = 1.5;
      burst(e.x, e.y, 4, '#38bdf8', 60, 0.25, 2, false);
      if (Math.random() < 0.25) addText(e.x, e.y - e.r - 16, 'ADRENALINE', '#38bdf8', 11);
    }
  }

  // Commander Doctrine: Spec-Ops Infiltrator (Revealed stealth take 2.5x dmg)
  if (G && G.doctrine === 'infiltrator' && e.type === 'stealth' && e.revealT > 0) {
    a *= 2.5;
  }

  if (type === 'phys') {
    let effArmor = Math.max(0, e.armor - e.shred);
    // Commander Skill: AP Sabot Rounds ignores 75% armor
    if (G && G.sabotRoundsT > 0) effArmor *= 0.25;
    if (src && src.type === 'gatling' && hasPerk('depleted_uranium')) effArmor = Math.max(0, effArmor - 0.25);
    a *= (1 - effArmor);
  }
  if (e.brittleT > 0) a *= 1 + e.brittle;
  if (hasPerk('titan_hunter') && (e.type === 'boss' || e.type === 'brute' || e.type === 'carrier')) a *= 1.30;
  if (G.mutator && G.mutator.id === 'ion_storm' && (type === 'energy' || (src && src.type === 'tesla'))) a *= 1.25;
  if (e.shield > 0 && opts.shieldMult) a *= opts.shieldMult;
  if (G.mutator && G.mutator.id === 'solar_flare' && (type === 'energy' || type === 'plasma' || (src && (src.type === 'tesla' || src.type === 'plasma')))) a *= 1.35;

  // Commander Skill: Market Liquidation (100% crit chance)
  if (G && G.liquidationT > 0) opts.crit = true;

  // Named Titan Boss: Goliath Excavator rear weak point
  if (e.titanId === 'goliath' && opts.fromAngle !== undefined) {
    const diff = Math.abs(angDiff(opts.fromAngle, e.ang));
    if (diff < Math.PI * 0.45) {
      a *= 2.0;
      opts.crit = true;
      burst(e.x, e.y, 10, '#f59e0b', 140, 0.4, 3.5, true);
      addText(e.x, e.y - e.r - 28, 'REAR WEAK POINT x2!', '#f59e0b', 15);
    }
  }

  // Modular Chip: Executioner Nanites
  if (src && src.chips && src.chips.includes('executioner_nanites') && e.type !== 'boss') {
    if ((e.hp / e.maxHp) <= 0.30 && Math.random() < 0.08) {
      a = e.hp + 999;
      burst(e.x, e.y, 14, '#f43f5e', 140, 0.4, 3, true);
      addText(e.x, e.y - e.r - 18, 'NANITE EXECUTE!', '#f43f5e', 14);
    }
  }

  // Adaptive Threat: Kinetic Deflector (-50% physical damage)
  if (e.threat === 'deflector' && type === 'phys') {
    a *= 0.5;
    burst(e.x, e.y, 3, '#94a3b8', 45, 0.2, 2, false);
    if (Math.random() < 0.2) addText(e.x, e.y - e.r - 18, 'DEFLECT -50%', '#94a3b8', 11);
  }

  // Champion Affix: Anti-Projectile Dome
  const inDome = e.affix === 'dome' || G.enemies.some(o => !o.dead && o.affix === 'dome' && (o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 40 * 40);
  if (inDome && (type === 'phys' || (src && src.type === 'rail'))) {
    a *= 0.6;
    burst(e.x, e.y, 3, '#38bdf8', 50, 0.25, 2, true);
  }

  // Elemental Combos & Reactions (Fase 1)
  let reactionTriggered = false;
  if (!opts.noReaction && !opts.isReaction) {
    // 1. Thermal Shockwave (Cryo + Plasma)
    if (type === 'plasma' && (e.slowT > 0 || e.stunT > 0)) {
      reactionTriggered = true;
      e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
      a *= 2.5;
      if (e.armor > 0) e.shred = Math.min(e.armor, e.shred + e.armor * 0.5);
      addRing(e.x, e.y, 8, 75, 0.45, '#38bdf8', 4);
      burst(e.x, e.y, 16, '#38bdf8', 120, 0.5, 3.5, true);
      addText(e.x, e.y - e.r - 26, 'THERMAL SHOCK', '#38bdf8', 14);
      Sfx.play('shockwave');
      for (const o of G.enemies) {
        if (o.dead || o === e) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= (75 + o.r) ** 2) {
          dealDamage(o, a * 0.4, 'plasma', src, { isReaction: true, noReaction: true });
        }
      }
    }

    // 2. Electrolytic Detonation (Acid + Tesla)
    if ((type === 'energy' || (src && src.type === 'tesla')) && e.acidT > 0) {
      reactionTriggered = true;
      e.acidT = 0;
      addRing(e.x, e.y, 6, 65, 0.4, '#a3e635', 3);
      burst(e.x, e.y, 10, '#a3e635', 100, 0.4, 2.5, false);
      addText(e.x, e.y - e.r - 26, 'ELECTROLYTIC', '#a3e635', 14);
      Sfx.play('reaction');
      for (const o of G.enemies) {
        if (o.dead || o === e || !(o.acidT > 0)) continue;
        o.acidT = 0;
        addBolt(e.x, e.y, o.x, o.y, '#a3e635');
        burst(o.x, o.y, 6, '#a3e635', 90, 0.35, 2.5, false);
        addText(o.x, o.y - o.r - 16, 'CONDUCTED', '#a3e635', 12);
        dealDamage(o, a * 1.15, 'energy', src, { isReaction: true, noReaction: true });
      }
    }

    // 3. Thermite Incineration (Bleed + Radiation/Plasma)
    if ((type === 'plasma' || (src && src.type === 'plasma')) && e.bleedT > 0) {
      reactionTriggered = true;
      e.bleedT = 0;
      e.thermiteT = 3.0;
      e.thermiteDps = Math.max(e.thermiteDps || 0, e.maxHp * 0.035, 24);
      burst(e.x, e.y, 14, '#f97316', 130, 0.5, 3.5, false);
      addText(e.x, e.y - e.r - 26, 'THERMITE BURN', '#f97316', 14);
      Sfx.play('reaction');
    }

    // 4. Superconductor Surge (Cryo + Tesla)
    if (src && src.type === 'tesla' && (e.slowT > 0 || e.stunT > 0)) {
      reactionTriggered = true;
      a *= 2.0;
      opts.crit = true;
      if (e.type !== 'boss') e.stunT = Math.max(e.stunT * 2, 1.2);
      else e.stunT = Math.max(e.stunT, 0.4);
      addRing(e.x, e.y, 8, 55, 0.4, '#fde047', 4);
      burst(e.x, e.y, 10, '#fef08a', 120, 0.4, 3, true);
      addText(e.x, e.y - e.r - 28, 'SUPERCONDUCTOR', '#fde047', 14);
      Sfx.play('reaction');
    }
  }

  // Commander Doctrine: Quantum Architect (+40% reaction damage)
  if (reactionTriggered && G && G.doctrine === 'architect') {
    a *= 1.40;
  }

  // Modular Chip: Feedback Chrono (Reactions reduce cooldowns by 0.5s)
  if (reactionTriggered && src && src.chips && src.chips.includes('feedback_chrono')) {
    for (const k in G.skills) {
      if (G.skills[k] && G.skills[k].cd > 0) {
        G.skills[k].cd = Math.max(0, G.skills[k].cd - 0.5);
      }
    }
    burst(src.x, src.y, 6, '#34d399', 60, 0.3, 2, true);
  }

  // Commander Doctrine: Siege Vanguard (Shrapnel Cascade on physical crits)
  if (G && G.doctrine === 'vanguard' && type === 'phys' && opts.crit && !opts.noShrapnel && src && (src.type === 'gatling' || src.type === 'rail')) {
    burst(e.x, e.y, 8, '#f59e0b', 110, 0.35, 2.5, true);
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 48 * 48) {
        dealDamage(o, a * 0.35, 'phys', src, { noShrapnel: true, noReaction: true });
      }
    }
  }
  e.flash = 1;
  let toHp = a;
  if (e.shield > 0) {
    if (a <= e.shield) { e.shield -= a; toHp = 0; }
    else { toHp = a - e.shield; e.shield = 0; e.shieldT = 0; burst(e.x, e.y, 8, '#67e8f9', 90, 0.4, 2.5, true); }
  }
  e.hp -= toHp;
  // Champion Affix: Phase-Shifter teleport on heavy impact
  if (e.affix === 'phase_shifter' && a >= 80 && (!e.phaseCd || e.phaseCd <= 0) && e.hp > 0) {
    e.phaseCd = 3.5;
    burst(e.x, e.y, 12, '#a855f7', 120, 0.4, 3, true);
    const pLen = e.pathId === 1 ? PLEN_BREACH : PLEN;
    e.d = Math.min(pLen - 15, e.d + 70);
    burst(e.x, e.y, 14, '#c084fc', 140, 0.45, 3.5, true);
    addText(e.x, e.y - e.r - 24, 'PHASE SHIFT', '#c084fc', 14);
    Sfx.play('reaction');
  }
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
    addCores(10);
    addText(e.x, e.y - 56, '+10 NANITE CORES', '#38bdf8', 16);
  } else {
    burst(e.x, e.y, e.type === 'swarm' ? 6 : 14, col, 130, 0.5, e.type === 'brute' || e.type === 'carrier' ? 4 : 3, e.type === 'swarm');
    if (e.type !== 'swarm') addText(e.x, e.y - e.r - 6, '+' + e.reward, '#fbbf24', 13);
    Sfx.play('kill');
  }

  // Modular Chip: Vampiric Siphon (+1 Gold every 8 kills)
  if (src && src.chips && src.chips.includes('vampiric_siphon')) {
    src.vampKills = (src.vampKills || 0) + 1;
    if (src.vampKills % 8 === 0) {
      G.gold += 1;
      burst(src.x, src.y, 4, '#fbbf24', 50, 0.25, 2, true);
      addText(src.x, src.y - 18, '+1G SIPHON', '#fbbf24', 12);
    }
  }

  // Titan Boss: Chrono-Weaver Time Dilation Field (minions leave revival echoes)
  if (e.type !== 'boss' && !e.isChronoClone) {
    const cw = G.enemies.find(o => !o.dead && o.titanId === 'chronoweaver');
    if (cw && Math.hypot(e.x - cw.x, e.y - cw.y) <= 110) {
      G.hazards.push({
        type: 'chrono_echo',
        x: e.x, y: e.y, enemyType: e.type, d: e.d, pathId: e.pathId || 0,
        timer: 3.5, life: 3.5, max: 3.5
      });
      addText(e.x, e.y - e.r - 20, 'TEMPORAL ECHO', '#38bdf8', 12);
    }
  }
  // Champion Affix: Avenger trigger on nearby allies
  for (const o of G.enemies) {
    if (o.dead || o === e || o.affix !== 'avenger') continue;
    if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 120 * 120) {
      if ((o.avengerStacks || 0) < 5) {
        o.avengerStacks = (o.avengerStacks || 0) + 1;
        o.speed *= 1.15;
        o.armor = Math.min(0.85, o.armor + 0.10);
        burst(o.x, o.y, 8, '#f97316', 90, 0.4, 3, false);
        addText(o.x, o.y - o.r - 22, 'AVENGE x' + o.avengerStacks, '#f97316', 13);
        Sfx.play('reaction');
      }
    }
  }
  // Special Event Mutator: Nanite Plague (spawns micro-swarms on death)
  if (G.mutator && G.mutator.id === 'nanite_plague' && e.type !== 'swarm' && !e.isMicroSpawn && typeof spawnEnemy === 'function') {
    for (let k = 0; k < 2; k++) {
      spawnEnemy('swarm', G.wave, null, null, e.pathId || 0);
      const m = G.enemies[G.enemies.length - 1];
      if (m) {
        m.isMicroSpawn = true;
        m.d = Math.max(0, e.d - rand(10, 25));
        m.x = e.x + rand(-10, 10);
        m.y = e.y + rand(-10, 10);
        m.hp = Math.round(m.hp * 0.7);
        m.maxHp = m.hp;
      }
    }
    burst(e.x, e.y, 8, '#c084fc', 80, 0.4, 2.5, false);
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
