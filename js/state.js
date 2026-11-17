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
  const curSecId = (typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry';
  if (typeof loadSector === 'function') loadSector(curSecId);
  const sec = (typeof MAP_SECTORS !== 'undefined' && MAP_SECTORS[curSecId]) ? MAP_SECTORS[curSecId] : (typeof MAP_SECTORS !== 'undefined' ? MAP_SECTORS.foundry : null);
  G = {
    state: 'prep', lives: startLives, gold: 250 + startBonus, wave: 0, score: 0, time: 0, anim: 0, speed, paused: false,
    enemies: [], towers: [], proj: [], queue: [], grid: emptyGrid(),
    sel: null, placing: null, hover: null, mouse: { x: 0, y: 0, in: false },
    prepT: 20, shake: 0, dmgFlash: 0, baseFlash: 0, banner: null, endless: false, uiDirty: true, kills: 0,
    perks: [], skills: {},
    hazards: [], casting: null, mutator: null, drafting: null, leakedThisWave: 0, citadelCd: 0,
    sector: curSecId,
    fuelCells: sec ? sec.hazards.map(h => ({ ...h, x: h.c * TILE + TILE / 2, y: h.row * TILE + TILE / 2 })) : [
      { id: 1, type: 'fuel_cell', name: 'FUEL CELL', color: '#f97316', c: 6, row: 3, x: 6 * TILE + TILE / 2, y: 3 * TILE + TILE / 2, r: 16, hp: 60, maxHp: 60, dead: false },
      { id: 2, type: 'fuel_cell', name: 'FUEL CELL', color: '#f97316', c: 12, row: 7, x: 12 * TILE + TILE / 2, y: 7 * TILE + TILE / 2, r: 16, hp: 60, maxHp: 60, dead: false }
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
    swapSource: null,
    callStreak: 0,
    adrenalineT: 0,
    cursedProtocols: [],
    overloadT: 0,
    overloadCd: 0,
    meltdownT: 0,
    anomalies: [],
    anomalySpawnCd: 22,
    hivePressure: { phys: 0, energy: 0, cryo: 0, cluster: 0 },
    smugglerOffered: {},
    tpp: 0,
    matrixUnlocked: {},
    creep: {},
    sporeSpires: [],
    resonanceLines: [],
    thermalPurgeCd: 0,
    seismicPillars: [],
    emergencyBlackoutUsed: false,
    // 6.0 Living Paradox & Reality Systems
    timeHistory: [],
    chronoCd: 0,
    paradoxEntropy: 0,
    timeRippleT: 0,
    ghostEchoes: [],
    synapses: [],
    corpses: [],
    reclaimedMinions: [],
    syndicateGunship: null
  };
  initDoctrineSkills();
  partPool.clear(); fxPool.clear(); textPool.clear();
}

function detonateFuelCell(fc) {
  if (!fc || fc.dead) return;
  fc.dead = true;
  fc.hp = 0;
  const R = 120;
  const col = fc.color || '#f97316';
  addRing(fc.x, fc.y, 12, R, 0.7, col, 5);
  burst(fc.x, fc.y, 40, col, 220, 0.85, 4.5, true);
  burst(fc.x, fc.y, 20, '#fff7ed', 150, 0.5, 3, true);
  shake(14);

  if (fc.type === 'cryo_tank') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('freeze');
    addText(fc.x, fc.y - 28, 'NITROGEN FLASH-FREEZE!', '#38bdf8', 16);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= R + e.r) {
        e.freezeT = Math.max(e.freezeT || 0, 4.0);
        e.slowT = Math.max(e.slowT, 6.0);
        e.brittleT = Math.max(e.brittleT, 6.0);
        dealDamage(e, 180, 'cryo', null);
      }
    }
  } else if (fc.type === 'spore_pod') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    addText(fc.x, fc.y - 28, 'SPORE CONFUSION BURST!', '#a3e635', 16);
    G.hazards.push({ type: 'spore_cloud', x: fc.x, y: fc.y, r: 90, life: 4.0, max: 4.0, dps: 30, src: null });
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= R + e.r) {
        e.reversed = 2.5; // Walk backwards!
        if (e.armor > 0) e.shred = Math.min(e.armor, e.shred + e.armor * 0.5);
        dealDamage(e, 150, 'plasma', null);
      }
    }
  } else if (fc.type === 'tesla_pylon') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('hit');
    addText(fc.x, fc.y - 28, 'TESLA OVERLOAD SURGE!', '#facc15', 16);
    let hitCount = 0;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= 200 + e.r && hitCount < 8) {
        hitCount++;
        addFx('bolt', fc.x, fc.y, e.x, e.y, 0.25, '#facc15', 3.5);
        e.shield = 0;
        e.stunT = Math.max(e.stunT || 0, 1.8);
        dealDamage(e, 350, 'energy', null);
      }
    }
  } else if (fc.type === 'sun_monolith') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    addText(fc.x, fc.y - 28, 'SOLAR BEAM ERUPTION!', '#fbbf24', 16);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= 140 + e.r) {
        e.thermiteT = Math.max(e.thermiteT || 0, 5.0);
        e.thermiteDps = Math.max(e.thermiteDps || 0, 55);
        dealDamage(e, 400, 'energy', null);
      }
    }
  } else if (fc.type === 'emp_terminal') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    addText(fc.x, fc.y - 28, 'EMP SECURITY PULSE!', '#22d3ee', 16);
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= 150 + e.r) {
        e.shield = 0;
        e.stunT = Math.max(e.stunT || 0, 3.5);
        dealDamage(e, 250, 'energy', null);
      }
    }
  } else if (fc.type === 'hydro_geyser') {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    addText(fc.x, fc.y - 28, 'HYDRO-KINETIC GEYSER!', '#2dd4bf', 16);
    G.hazards.push({ type: 'water_pool', x: fc.x, y: fc.y, r: 85, life: 6.0, max: 6.0, dps: 15, src: null });
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= 130 + e.r) {
        e.stunT = Math.max(e.stunT || 0, 2.0);
        dealDamage(e, 300, 'cryo', null);
      }
    }
  } else {
    // Default fuel cell
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
    addText(fc.x, fc.y - 28, 'FUEL CELL DETONATION!', '#f97316', 17);
    G.hazards.push({ type: 'radiation', x: fc.x, y: fc.y, r: 90, life: 4.5, max: 4.5, dps: 42, shred: 0.35, src: null });
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - fc.x, e.y - fc.y);
      if (d <= 110 + e.r) {
        if (e.armor > 0) e.shred = e.armor; // 100% armor shred
        dealDamage(e, 450, 'plasma', null);
      }
    }
  }
}

/* ============================================================
   HIGH-STAKES OVERDRIVE & SUPER-WEAPONS (4.0)
   ============================================================ */
function triggerCoreOverload() {
  if (!G || G.state === 'menu' || G.overloadT > 0 || G.overloadCd > 0 || G.meltdownT > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.overloadT = 8.0;
  G.overloadCd = 45.0;
  shake(14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overload');
  addRing(BASE_PT.x, BASE_PT.y, 16, 220, 0.75, '#f43f5e', 5);
  burst(BASE_PT.x, BASE_PT.y, 45, '#fb7185', 200, 0.8, 4.5, true);
  burst(BASE_PT.x, BASE_PT.y, 25, '#fbbf24', 160, 0.6, 3.5, true);
  addText(W / 2, 75, 'CORE OVERLOAD: +250% HYPER-DRIVE!', '#fbbf24', 20);
  if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery('core_overload', 'anomaly');
  G.uiDirty = true;
  return true;
}

function applyCursedProtocol(protoId) {
  if (!G || typeof CURSED_PROTOCOLS === 'undefined' || !CURSED_PROTOCOLS[protoId]) return false;
  G.cursedProtocols = G.cursedProtocols || [];
  if (G.cursedProtocols.includes(protoId)) return false;
  G.cursedProtocols.push(protoId);
  const def = CURSED_PROTOCOLS[protoId];
  if (protoId === 'blood_pact') {
    G.lives = 1;
    shake(12);
  }
  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('strike');
  burst(W / 2, H / 2, 35, def.color, 180, 0.7, 4, true);
  addRing(W / 2, H / 2, 12, 160, 0.65, def.color, 4);
  addText(W / 2, 75, 'CURSED PROTOCOL ACCEPTED: ' + def.name.toUpperCase(), def.color, 18);
  if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery(protoId, 'cursed');
  G.uiDirty = true;
  return true;
}

function fuseTowers(t1, t2) {
  if (!G || !t1 || !t2 || t1 === t2) return false;
  if (typeof FUSION_RECIPES === 'undefined') return false;
  const recipe = FUSION_RECIPES.find(r =>
    (t1.type === r.towerA && t2.type === r.towerB) ||
    (t1.type === r.towerB && t2.type === r.towerA)
  );
  if (!recipe) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const cost = recipe.cost || 200;
  if (G.gold < cost) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.gold -= cost;
  t1.type = recipe.id;
  t1.tier = 0;
  t1.branch = null;
  t1.invested = (t1.invested || 0) + (t2.invested || 0) + cost;
  t1.chips = [...(t1.chips || []), ...(t2.chips || [])].slice(0, 2);
  t1.heat = 0;
  t1.recoil = 1;
  t1.flash = 1;
  t1.fusionPulseT = 0;
  G.grid[t2.r][t2.c] = null;
  const idx = G.towers.indexOf(t2);
  if (idx >= 0) G.towers.splice(idx, 1);
  if (G.sel === t2) G.sel = t1;
  shake(14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('fusion');
  burst(t1.x, t1.y, 40, recipe.color, 220, 0.8, 5, true);
  burst(t2.x, t2.y, 30, recipe.color, 180, 0.6, 4, true);
  addRing(t1.x, t1.y, 14, 110, 0.7, recipe.color, 5);
  addRing(t2.x, t2.y, 10, 80, 0.5, recipe.color, 4);
  addText(t1.x, t1.y - 32, 'SUPER-WEAPON FUSED: ' + recipe.name.toUpperCase() + '!', recipe.color, 16);
  if (typeof recordCodexDiscovery === 'function') recordCodexDiscovery(recipe.id, 'fusion');
  if (typeof updateResonanceConduits === 'function') updateResonanceConduits();
  G.uiDirty = true;
  return true;
}

/* ============================================================
   GRID RESONANCE BEAM CONDUITS (5.0)
   ============================================================ */
function updateResonanceConduits() {
  if (!G || !G.towers || typeof RESONANCE_CONDUITS === 'undefined') return;
  const lines = [];
  const relays = G.towers.filter(t => t.type === 'relay' || t.type === 'fusion_zero');

  const DIRS = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  for (const relay of relays) {
    if (relay.shutdownT > 0) continue;
    for (const [dc, dr] of DIRS) {
      for (let dist = 1; dist <= 5; dist++) {
        const nc = relay.c + dc * dist, nr = relay.r + dr * dist;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) break;
        const target = G.grid[nr][nc];
        if (target) {
          if (target !== relay) {
            let cKey = 'hyper_bridge';
            if (target.type === 'tesla') cKey = 'ion_plasma';
            else if (target.type === 'cryo' || target.type === 'fusion_zero') cKey = 'stasis_line';
            else if (target.type === 'gatling' || target.type === 'fusion_hellfire') cKey = 'sensor_wire';
            else if (target.type === 'plasma' || target.type === 'fusion_antimatter') cKey = 'incinerator_beam';
            else if (target.type === 'rail' || target.type === 'fusion_deathray') cKey = 'singularity_cord';

            const conf = RESONANCE_CONDUITS[cKey] || RESONANCE_CONDUITS.hyper_bridge;
            const lineId = [Math.min(relay.c, target.c), Math.min(relay.r, target.r), Math.max(relay.c, target.c), Math.max(relay.r, target.r)].join('_');
            if (!lines.some(l => l.id === lineId)) {
              lines.push({
                id: lineId,
                type: cKey,
                relay,
                target,
                x1: relay.x, y1: relay.y,
                x2: target.x, y2: target.y,
                c1: relay.c, r1: relay.r,
                c2: target.c, r2: target.r,
                conf
              });
            }
          }
          break;
        }
      }
    }
  }
  G.resonanceLines = lines;
}

/* ============================================================
   THERMODYNAMICS & HEAT PURGE (5.0)
   ============================================================ */
function triggerThermalPurge() {
  if (!G || G.thermalPurgeCd > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const isTurbo = hasMatrixProtocol('thermal_purge_turbo');
  const cd = isTurbo ? THERMAL_CONFIG.purgeCooldown * 0.5 : THERMAL_CONFIG.purgeCooldown;
  const dmg = isTurbo ? THERMAL_CONFIG.purgeDamage + 250 : THERMAL_CONFIG.purgeDamage;

  G.thermalPurgeCd = cd;
  for (const t of G.towers) {
    if (t.heat > 0) {
      t.heat = 0;
      burst(t.x, t.y, 10, '#cbd5e1', 90, 0.4, 3, true);
    }
  }

  shake(12);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('steam_purge');
  addRing(W / 2, H / 2, 20, Math.max(W, H), 0.85, '#cbd5e1', 6);
  burst(W / 2, H / 2, 50, '#f8fafc', 260, 0.8, 5, true);
  addText(W / 2, 90, '⚡ THERMAL STEAM PURGE ACTIVATED!', '#cbd5e1', 20);

  for (const e of G.enemies) {
    if (e.dead) continue;
    dealDamage(e, dmg, 'plasma', null);
  }

  G.creep = {};
  G.uiDirty = true;
  return true;
}

/* ============================================================
   BIOMASS CREEP & SPORE EXPANSION (5.0)
   ============================================================ */
function addBiomassCreep(col, row) {
  if (!G || col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
  G.creep = G.creep || {};
  const key = row + ',' + col;
  if (!G.creep[key]) {
    G.creep[key] = { r: row, c: col, life: 25.0 };
    burst(col * TILE + TILE / 2, row * TILE + TILE / 2, 6, '#84cc16', 70, 0.4, 2.5, true);
  } else {
    G.creep[key].life = 25.0;
  }
}

function cleanseBiomassCreep(col, row) {
  if (!G || !G.creep) return;
  const key = row + ',' + col;
  if (G.creep[key]) {
    delete G.creep[key];
    burst(col * TILE + TILE / 2, row * TILE + TILE / 2, 8, '#f8fafc', 90, 0.35, 2.5, true);
    if (Math.random() < 0.25) {
      G.gold += 3;
      addText(col * TILE + TILE / 2, row * TILE + TILE / 2 - 12, '+3G BIO-SALVAGE', '#34d399', 11);
    }
  }
}

/* ============================================================
   TACTICAL PROTOCOL MATRIX (5.0)
   ============================================================ */
function hasMatrixProtocol(id) {
  return Boolean(G && G.matrixUnlocked && G.matrixUnlocked[id]);
}

function unlockMatrixProtocol(id) {
  if (!G || typeof TACTICAL_MATRIX_PROTOCOLS === 'undefined') return false;
  const proto = TACTICAL_MATRIX_PROTOCOLS[id];
  if (!proto) return false;
  if (G.matrixUnlocked && G.matrixUnlocked[id]) return false;
  if (proto.req && (!G.matrixUnlocked || !G.matrixUnlocked[proto.req])) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  if ((G.tpp || 0) < proto.cost) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.tpp -= proto.cost;
  G.matrixUnlocked = G.matrixUnlocked || {};
  G.matrixUnlocked[id] = true;
  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('matrix_unlock');
  burst(W / 2, 90, 30, '#818cf8', 180, 0.7, 4, true);
  addRing(W / 2, 90, 10, 80, 0.5, '#818cf8', 4);
  addText(W / 2, 90, 'PROTOCOL ENGAGED: ' + proto.name.toUpperCase(), '#818cf8', 18);
  G.uiDirty = true;
  return true;
}

/* ============================================================
   BASTION TD 6.0: THE LIVING PARADOX & REALITY SYSTEMS
   ============================================================ */
function recordTimeSnapshot() {
  if (!G || G.state !== 'active' || !CHRONO_CONFIG) return;
  G.timeHistory = G.timeHistory || [];
  const enemySnaps = (G.enemies || []).map(e => ({
    id: e.id, type: e.type, hp: e.hp, maxHp: e.maxHp, shield: e.shield, maxShield: e.maxShield,
    d: e.d, x: e.x, y: e.y, pathId: e.pathId || 0, dead: e.dead, speed: e.speed
  }));
  G.timeHistory.push({
    time: G.time, gold: G.gold, lives: G.lives, enemies: enemySnaps
  });
  if (G.timeHistory.length > (CHRONO_CONFIG.historyCapacity || 50)) {
    G.timeHistory.shift();
  }
}

function triggerChronoRewind() {
  if (!G || (G.state !== 'active' && G.state !== 'prep') || G.drafting) return false;
  if ((G.chronoCd || 0) > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  if (!G.timeHistory || G.timeHistory.length < 5) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const snap = G.timeHistory[0];
  G.lives = Math.max(G.lives, snap.lives);
  G.gold = Math.max(G.gold, snap.gold);

  // Restore or resurrect enemies
  const snapIds = new Set(snap.enemies.map(s => s.id));
  for (const s of snap.enemies) {
    let cur = (G.enemies || []).find(e => e.id === s.id);
    if (!cur) {
      if (typeof spawnEnemy === 'function') {
        spawnEnemy(s.type, G.wave, null, null, s.pathId);
        cur = G.enemies[G.enemies.length - 1];
        if (cur) cur.id = s.id;
      }
    }
    if (cur) {
      cur.dead = false;
      cur.hp = s.hp;
      cur.maxHp = s.maxHp;
      cur.shield = s.shield;
      cur.maxShield = s.maxShield;
      cur.d = s.d;
      cur.x = s.x;
      cur.y = s.y;
    }
  }
  // Remove enemies that spawned after the snapshot
  if (G.enemies) {
    G.enemies = G.enemies.filter(e => snapIds.has(e.id));
  }

  // Create Ghost Echoes for all constructed defenses (they fire past timeline salvos!)
  G.ghostEchoes = G.ghostEchoes || [];
  if (G.towers) {
    for (const t of G.towers) {
      G.ghostEchoes.push({
        x: t.x, y: t.y, type: t.type, tier: t.tier, branch: t.branch,
        life: 5.0, maxLife: 5.0, fireCd: 0.15, angle: t.angle || 0, color: '#38bdf8'
      });
    }
  }

  // Paradox Entropy buildup
  G.paradoxEntropy = Math.min(100, (G.paradoxEntropy || 0) + (CHRONO_CONFIG.entropyPerUse || 35));
  if (G.paradoxEntropy >= 100 && typeof spawnEnemy === 'function') {
    spawnEnemy('scout', G.wave, 'phase_shifter', null, 0);
    const horror = G.enemies[G.enemies.length - 1];
    if (horror) {
      horror.isParadoxHorror = true;
      horror.hp = Math.round(horror.hp * 2.5);
      horror.maxHp = horror.hp;
      horror.armor = 0.85;
      burst(horror.x, horror.y, 30, '#c084fc', 180, 0.7, 4, true);
      addText(horror.x, horror.y - 30, 'PARADOX HORROR MANIFESTED!', '#c084fc', 16);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boss');
    }
  }

  G.chronoCd = CHRONO_CONFIG.cooldown || 35.0;
  G.timeRippleT = 1.0;
  shake(14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('time_rewind');
  burst(W / 2, H / 2, 45, '#38bdf8', 220, 0.8, 5, true);
  addRing(W / 2, H / 2, 20, Math.max(W, H), 0.9, '#38bdf8', 6);
  addText(W / 2, 85, 'CHRONO-REWIND ACTIVATED! (+GHOST ECHOES)', '#38bdf8', 18);
  G.timeHistory = [];
  G.uiDirty = true;
  return true;
}

function createNeuralSynapse(t1, t2) {
  if (!G || !t1 || !t2 || t1 === t2) return false;
  G.synapses = G.synapses || [];
  if (G.synapses.length >= (NEURAL_SYNAPSE_CONFIG.maxSynapses || 3)) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const dist = Math.hypot(t1.x - t2.x, t1.y - t2.y);
  if (dist > (NEURAL_SYNAPSE_CONFIG.maxDistance || 4.2 * TILE)) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const id1 = t1.c + ',' + t1.r + '-' + t2.c + ',' + t2.r;
  const id2 = t2.c + ',' + t2.r + '-' + t1.c + ',' + t1.r;
  if (G.synapses.some(s => s.id === id1 || s.id === id2)) return false;

  const pairKey = [t1.type, t2.type].sort().join('+');
  let pairObj = NEURAL_SYNAPSE_CONFIG.pairs[pairKey];
  if (!pairObj) {
    pairObj = { id: 'generic_synapse', name: 'Neural Resonance Conduit', color: '#c084fc', desc: '+15% Attack Speed & shared targeting awareness.' };
  }

  const newSyn = {
    id: id1,
    t1Id: t1.id, t2Id: t2.id,
    c1: t1.c, r1: t1.r, c2: t2.c, r2: t2.r,
    x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y,
    pairKey: pairKey,
    pair: pairObj
  };
  G.synapses.push(newSyn);

  shake(6);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('neural_link');
  burst(t1.x, t1.y, 16, pairObj.color, 90, 0.45, 3, true);
  burst(t2.x, t2.y, 16, pairObj.color, 90, 0.45, 3, true);
  addRing((t1.x + t2.x) / 2, (t1.y + t2.y) / 2, 8, dist / 2, 0.5, pairObj.color, 3);
  addText((t1.x + t2.x) / 2, (t1.y + t2.y) / 2 - 16, 'SYNAPSE LINK: ' + pairObj.name.toUpperCase(), pairObj.color, 14);
  G.uiDirty = true;
  return true;
}

function removeNeuralSynapse(id) {
  if (!G || !G.synapses) return false;
  const idx = G.synapses.findIndex(s => s.id === id);
  if (idx >= 0) {
    G.synapses.splice(idx, 1);
    G.uiDirty = true;
    return true;
  }
  return false;
}

function getTowerSynapses(t) {
  if (!G || !G.synapses || !t) return [];
  return G.synapses.filter(s => (s.c1 === t.c && s.r1 === t.r) || (s.c2 === t.c && s.r2 === t.r));
}

function reclaimCorpse(idx) {
  if (!G || !G.corpses || !G.corpses[idx]) return false;
  const c = G.corpses.splice(idx, 1)[0];
  G.reclaimedMinions = G.reclaimedMinions || [];
  let minion = null;
  if (c.type === 'brute') {
    minion = { type: 'colossus', x: c.x, y: c.y, hp: 850, maxHp: 850, life: 18.0, maxLife: 18.0, r: 22, color: '#94a3b8' };
  } else if (c.type === 'carrier') {
    minion = { type: 'drone_hive', x: c.x, y: c.y, hp: 450, maxHp: 450, life: 20.0, maxLife: 20.0, droneCd: 1.5, r: 18, color: '#34d399' };
  } else if (c.type === 'healer') {
    minion = { type: 'shield_emitter', x: c.x, y: c.y, hp: 500, maxHp: 500, life: 20.0, maxLife: 20.0, pulseCd: 2.5, r: 16, color: '#6ee7b7' };
  } else {
    minion = { type: 'colossus', x: c.x, y: c.y, hp: 500, maxHp: 500, life: 15.0, maxLife: 15.0, r: 16, color: '#38bdf8' };
  }
  G.reclaimedMinions.push(minion);
  shake(6);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('corpse_reclaim');
  burst(c.x, c.y, 25, '#10b981', 130, 0.55, 3.5, true);
  addRing(c.x, c.y, 10, 60, 0.5, '#10b981', 4);
  addText(c.x, c.y - 22, 'RECLAIMED: ' + minion.type.toUpperCase(), '#10b981', 14);
  G.uiDirty = true;
  return true;
}

function bribeSyndicate() {
  if (!G || !G.syndicateGunship || G.gold < (SYNDICATE_CONFIG.bribeCost || 120)) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.gold -= SYNDICATE_CONFIG.bribeCost || 120;
  G.syndicateGunship.state = 'bribed';
  G.syndicateGunship.droneCd = 0.5;
  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) { Sfx.play('coin'); Sfx.play('victory'); }
  burst(G.syndicateGunship.x, G.syndicateGunship.y, 30, '#fbbf24', 160, 0.6, 4, true);
  addText(G.syndicateGunship.x, G.syndicateGunship.y - 25, 'SYNDICATE HIRED: ALLIED DRONES ACTIVE!', '#fbbf24', 16);
  G.uiDirty = true;
  return true;
}

function raidSyndicate() {
  if (!G || !G.syndicateGunship) return false;
  G.syndicateGunship.state = 'hostile';
  shake(10);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
  burst(G.syndicateGunship.x, G.syndicateGunship.y, 25, '#f43f5e', 140, 0.5, 3.5, true);
  addText(G.syndicateGunship.x, G.syndicateGunship.y - 25, 'GUNSHIP RAID INITIATED!', '#f43f5e', 16);
  G.uiDirty = true;
  return true;
}

function triggerTectonicShift(centerCol, centerRow) {
  if (!G || (G.state !== 'prep' && G.state !== 'active')) return false;
  const cc = centerCol !== undefined ? centerCol : Math.floor(COLS / 2);
  const cr = centerRow !== undefined ? centerRow : Math.floor(ROWS / 2);
  const radius = 2.5 * TILE;
  const cx = cc * TILE + TILE / 2;
  const cy = cr * TILE + TILE / 2;

  shake(12);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('hit');
  addRing(cx, cy, 10, radius, 0.65, '#f59e0b', 4);
  burst(cx, cy, 28, '#f59e0b', 160, 0.6, 3.5, false);
  addText(cx, cy - 25, 'TECTONIC MAG-LEV SHIFT!', '#f59e0b', 16);

  // 1. Kinetic push & Centrifuge Loop Trap for hostiles in zone
  let affectedEnemies = 0;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dist = Math.hypot(e.x - cx, e.y - cy);
    if (dist <= radius + e.r) {
      affectedEnemies++;
      // Knockback distance along path or drop into kinetic chasm if low HP
      if (e.type !== 'boss' && e.hp < e.maxHp * 0.25) {
        killEnemy(e);
        burst(e.x, e.y, 16, '#0f172a', 120, 0.5, 3, true);
        addText(e.x, e.y - 15, 'CHASM DROP (VOID)!', '#38bdf8', 13);
      } else {
        e.d = Math.max(0, e.d - 75);
        const np = posAt(e.d, 0, e.pathId || 0);
        e.x = np.x; e.y = np.y;
        e.stunT = Math.max(e.stunT || 0, 1.2);
        burst(e.x, e.y, 8, '#f59e0b', 90, 0.35, 2.5, true);
        addText(e.x, e.y - 15, 'CENTRIFUGE LOOP!', '#f59e0b', 12);
      }
    }
  }

  // 2. Enemy AI Adaptation: Titan or Breacher implants Tectonic Spikes (Seismic Pillar)
  if (G.enemies.some(e => !e.dead && (e.type === 'boss' || e.type === 'breacher'))) {
    if (!G.seismicPillars) G.seismicPillars = [];
    if (G.seismicPillars.length < 3) {
      G.seismicPillars.push({
        id: Date.now() + Math.random(),
        c: cc, row: cr,
        x: cx, y: cy,
        hp: 350, maxHp: 350
      });
      addText(cx, cy + 25, 'TITAN COUNTER: TECTONIC SPIKE!', '#ef4444', 13);
    }
  }

  G.uiDirty = true;
  return true;
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

  // Cursed Protocol: Glass Singularity (Guaranteed Critical Strikes)
  if (G && G.cursedProtocols && G.cursedProtocols.includes('glass_singularity')) {
    opts.crit = true;
  }

  // Reactive Hivemind Evolutionary Pressure Tracking (4.0)
  if (G && G.hivePressure) {
    if (type === 'phys') G.hivePressure.phys += a;
    else if (type === 'energy' || type === 'plasma') G.hivePressure.energy += a;
    else if (type === 'cryo') G.hivePressure.cryo += a;
    if (opts.isSplash) G.hivePressure.cluster += a;
  }

  // Reactive Hivemind Counter-Traits (4.0)
  if (e.counterTrait === 'reflective' && type === 'phys' && Math.random() < 0.25) {
    burst(e.x, e.y, 6, '#f43f5e', 80, 0.3, 2, true);
    addText(e.x, e.y - e.r - 18, 'REFLECTED!', '#f43f5e', 12);
    return 0;
  }
  if (e.counterTrait === 'carbon_weave' && (type === 'energy' || type === 'plasma')) {
    a *= 0.50;
    burst(e.x, e.y, 4, '#38bdf8', 60, 0.25, 2, true);
  }
  if (e.counterTrait === 'insulated' && type === 'cryo') {
    e.slowT = 0; e.slowAmt = 0; e.freezeT = 0;
    a *= 0.35;
    burst(e.x, e.y, 4, '#f97316', 70, 0.25, 2, false);
  }

  // Hive Mutation: Chitin Armor Plating (deflects first 4 physical hits)
  if (e.chitinHits > 0 && type === 'phys') {
    e.chitinHits--;
    burst(e.x, e.y, 4, '#fb7185', 65, 0.25, 2.5, false);
    addText(e.x, e.y - e.r - 18, 'CHITIN DEFLECT (' + e.chitinHits + ')', '#fb7185', 11);
    return 0;
  }

  // 5.0 Titan Boss Goliath: Line-of-sight blockage by Seismic Pillars
  if (G && G.seismicPillars && G.seismicPillars.length > 0 && src && type !== 'cryo' && typeof distToSeg === 'function') {
    for (const p of G.seismicPillars) {
      if (p.hp > 0 && distToSeg(p.x, p.y, src.x, src.y, e.x, e.y) <= (p.r || 24)) {
        p.hp -= Math.min(p.hp, a);
        burst(p.x, p.y, 6, '#78716c', 60, 0.25, 2, false);
        addText(p.x, p.y - 20, 'SEISMIC BLOCK', '#a8a29e', 11);
        if (p.hp <= 0) {
          burst(p.x, p.y, 22, '#d6d3d1', 140, 0.5, 4, true);
          shake(5);
          addText(p.x, p.y - 25, 'PILLAR COLLAPSED', '#f59e0b', 13);
        }
        return 0; // intercepted by stone pillar
      }
    }
  }

  // 5.0 Tactical Matrix Protocol: Sabot Armor-Piercing (+20% shred & +15% phys dmg)
  if (hasMatrixProtocol('sabot_pierce')) {
    if (e.armor > 0) e.shred = Math.min(e.armor, (e.shred || 0) + e.armor * 0.20);
    if (type === 'phys') a *= 1.15;
  }

  // 5.0 Tactical Matrix Protocol: Apex Executioner (<15% HP executed)
  if (hasMatrixProtocol('execution_protocol') && e.type !== 'boss' && !e.dead) {
    if ((e.hp / e.maxHp) <= 0.15) {
      a = e.hp + 999;
      burst(e.x, e.y, 14, '#ef4444', 130, 0.4, 3, true);
      addText(e.x, e.y - e.r - 20, 'APEX EXECUTION!', '#ef4444', 14);
    }
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
    let effArmor = Math.max(0, (e.armor || 0) - (e.shred || 0));
    // Commander Skill: AP Sabot Rounds ignores 75% armor
    if (G && G.sabotRoundsT > 0) effArmor *= 0.25;
    if (src && src.type === 'gatling' && hasPerk('depleted_uranium')) effArmor = Math.max(0, effArmor - 0.25);
    a *= (1 - effArmor);
  }
  if (e.brittleT > 0) a *= 1 + (e.brittle || 0.35);
  if (hasPerk('titan_hunter') && (e.type === 'boss' || e.type === 'brute' || e.type === 'carrier')) a *= 1.30;
  if (G.mutator && G.mutator.id === 'ion_storm' && (type === 'energy' || (src && src.type === 'tesla'))) a *= 1.25;
  if (e.shield > 0 && opts.shieldMult) a *= opts.shieldMult;
  if (G.mutator && G.mutator.id === 'solar_flare' && (type === 'energy' || type === 'plasma' || (src && (src.type === 'tesla' || src.type === 'plasma')))) a *= 1.35;

  // Sector Climates:
  if (G && G.sector === 'abyss' && (type === 'cryo' || e.brittleT > 0)) {
    a *= 1.5; // Frozen Slipstream: +50% brittle/cryo damage
  }
  if (G && G.sector === 'abyssal' && (type === 'energy' || (src && src.type === 'tesla'))) {
    a *= 1.25; // Depth water conductivity: +25% energy damage
  }
  if (G && G.sector === 'skyspire' && (type === 'phys' || (src && (src.type === 'gatling' || src.type === 'rail'))) && e.type !== 'boss' && Math.random() < 0.20) {
    e.dead = true; e.hp = 0;
    burst(e.x, e.y, 16, '#818cf8', 120, 0.5, 3, true);
    addText(e.x, e.y - 15, 'VOID DROP!', '#818cf8', 13);
    G.score += e.reward * 10; G.gold += e.reward; G.kills++;
    return a;
  }

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

  // 6.0 Chrono-Horror Void Immunity (Physical damage phased into void)
  if (e.isParadoxHorror && type === 'phys') {
    burst(e.x, e.y, 4, '#c084fc', 60, 0.25, 2, false);
    addText(e.x, e.y - e.r - 16, 'VOID IMMUNE', '#c084fc', 11);
    return 0;
  }

  // 6.0 Modular Chip: Forbidden Singularity Core
  if (src && src.chips && src.chips.includes('quantum_singularity_chip') && e.type !== 'boss') {
    if (Math.random() < 0.20) {
      a += e.maxHp * 0.40;
      burst(e.x, e.y, 16, '#c084fc', 120, 0.4, 3.5, true);
      addRing(e.x, e.y, 6, 50, 0.4, '#c084fc', 3);
      addText(e.x, e.y - e.r - 20, 'SINGULARITY COLLAPSE!', '#c084fc', 13);
    }
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
  if (opts.crit) {
    addText(e.x, e.y - e.r - 14, 'CRIT ' + Math.round(a), '#fde047', 17);
    // 5.0 Tactical Matrix Protocol: Critical Cascade (25% chance of secondary explosion)
    if (hasMatrixProtocol('critical_cascade') && !opts.isCascade && Math.random() < 0.25) {
      burst(e.x, e.y, 12, '#fbbf24', 110, 0.4, 3, true);
      addRing(e.x, e.y, 6, 60, 0.35, '#fde047', 3);
      addText(e.x, e.y - e.r - 26, 'CRIT CASCADE!', '#fbbf24', 13);
      let hits = 0;
      for (const o of G.enemies) {
        if (o.dead || o === e) continue;
        if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= 75 * 75) {
          dealDamage(o, a * 0.45, type, src, { isCascade: true, noReaction: true });
          hits++;
          if (hits >= 2) break;
        }
      }
    }
  }
  else e.dmgAcc += a;
  if (src) src.dmg += a;
  Sfx.play('hit');
  if (e.hp <= 0) killEnemy(e, src);
  return a;
}
function killEnemy(e, src) {
  if (e.dead) return;
  e.dead = true;
  const streakMult = (G && G.callStreak && G.callStreak > 1) ? (1 + (G.callStreak - 1) * 0.4) : 1;
  const scoreStreakMult = (G && G.callStreak && G.callStreak > 1) ? (1 + (G.callStreak - 1) * 0.5) : 1;
  const isBloodPact = G && G.cursedProtocols && G.cursedProtocols.includes('blood_pact');
  const bloodMult = isBloodPact ? 3.0 : 1.0;
  const finalReward = Math.round(e.reward * streakMult * bloodMult);
  const finalScore = Math.round(e.reward * 10 * scoreStreakMult);
  G.gold += finalReward; G.score += finalScore; G.kills++;
  if (src) src.kills++;

  // 5.0 Biomass Creep Drop on Brute/Healer/Carrier kills
  if ((e.type === 'brute' || e.type === 'healer' || e.type === 'carrier') && Math.random() < (typeof BIOMASS_CONFIG !== 'undefined' ? BIOMASS_CONFIG.sporeDropChance : 0.55)) {
    addBiomassCreep(Math.floor(e.x / TILE), Math.floor(e.y / TILE));
  }

  // 5.0 Tactical Protocol Points (TPP) Earning
  if (e.affix) {
    G.tpp = (G.tpp || 0) + 1;
    burst(e.x, e.y, 8, '#818cf8', 90, 0.4, 2.5, true);
    addText(e.x, e.y - e.r - 20, '+1 TPP', '#818cf8', 13);
    G.uiDirty = true;
  }
  if (e.type === 'boss') {
    G.tpp = (G.tpp || 0) + 2;
    addText(e.x, e.y - 70, '+2 TPP', '#818cf8', 16);
    G.uiDirty = true;
    if (hasMatrixProtocol('contraband_scavenger')) {
      addCores(10);
      addText(e.x, e.y - 90, '+10 CORES (SCAVENGER)', '#38bdf8', 14);
    }
  }

  // Cursed Protocol: Glass Singularity penalty on kill
  if (G && G.cursedProtocols && G.cursedProtocols.includes('glass_singularity')) {
    burst(e.x, e.y, 14, '#a855f7', 120, 0.4, 3, true);
    for (const t of G.towers) {
      if ((t.x - e.x) ** 2 + (t.y - e.y) ** 2 <= 85 * 85) {
        t.empT = Math.max(t.empT || 0, 2.0);
        addText(t.x, t.y - 18, 'GLASS EMP', '#a855f7', 11);
      }
    }
  }

  // Reactive Hive Counter-Trait: Spore Mortar Retaliation
  if (e.counterTrait === 'spore_mortar' && G && G.towers && G.towers.length > 0) {
    const nearestT = G.towers.find(t => Math.hypot(t.x - e.x, t.y - e.y) <= 140);
    if (nearestT) {
      nearestT.empT = Math.max(nearestT.empT || 0, 2.5);
      if (typeof addBiomassCreep === 'function') addBiomassCreep(nearestT.c, nearestT.r);
      addFx('tracer', e.x, e.y, nearestT.x, nearestT.y, 0.35, '#84cc16', 3.0);
      burst(nearestT.x, nearestT.y, 14, '#84cc16', 90, 0.45, 3, false);
      shake(5);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('spore_burst');
      addText(nearestT.x, nearestT.y - 20, 'SPORE CORROSION', '#84cc16', 13);
    }
  }
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

  // 6.0 Corpse Persistence for Nanite Necromancy
  if (e.type !== 'swarm' && G && G.corpses) {
    if (G.corpses.length < 8) {
      G.corpses.push({
        type: e.type, x: e.x, y: e.y, r: e.r || 14,
        life: (typeof RECLAIMER_CONFIG !== 'undefined' ? RECLAIMER_CONFIG.corpseLifetime : 14.0)
      });
    }
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
