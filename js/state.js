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
    syndicateGunship: null,
    // 7.0 Grand Expedition & Titan Mech Warfare Systems
    mech: {
      active: false,
      x: BASE_PT ? BASE_PT.x : 850,
      y: BASE_PT ? BASE_PT.y : 300,
      hp: 1200,
      maxHp: 1200,
      battery: 100,
      bladeCd: 0,
      vulcanCd: 0,
      facing: 0,
      swingT: 0,
      vx: 0,
      vy: 0,
      isDocked: true
    },
    dreadnought: {
      charge: 0,
      maxCharge: 100,
      active: false,
      t: 0,
      rods: [],
      craters: []
    },
    anomalousRelics: [],
    vaultsOffered: {},
    activeVaultModal: null,
    wartimeMarket: {},
    dropPods: [],
    mechKeys: { w: false, a: false, s: false, d: false },
    // 8.0 Masterclass AAA/Indie Systems
    megastructures: [],
    logisticsConduits: [],
    pheromoneMap: {},
    geneSplices: {},
    darkCurios: [],
    bloodForgeTimer: 0,
    bloodForgeKills: 0,
    activeBossTitan: null,
    grapplePrompt: null,
    placingMegastructure: null,
    // 9.0 Living Ecosystem & Nemesis Network Systems
    soilTiles: {},
    currentWeather: 'clear',
    weatherTimer: 0,
    ionSquallTimer: 0,
    profilerStats: { choke: 0, sniper: 0, elemental: 0, mech: 0 },
    adaptabilityScore: 1.0,
    activeNemesis: null,
    nemesisRoster: (typeof SAVE !== 'undefined' && SAVE.nemesisRoster) ? SAVE.nemesisRoster : [],
    acidDeathTally: {},
    destructibleCrags: [
      { id: 'crag_1', c: 4, r: 2, roadC: 5, roadR: 2, hp: 300, maxHp: 300, collapsed: false, x: 4 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 },
      { id: 'crag_2', c: 9, r: 6, roadC: 8, roadR: 6, hp: 300, maxHp: 300, collapsed: false, x: 9 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 }
    ],
    rockslides: [],
    barricades: [],
    // 10.0 Crucible of Ascendancy Systems
    cer: 1.0,
    playerActions: 0,
    apmTimer: 0,
    activeGambit: null,
    prisms: [],
    singularityPens: [],
    bulletTimeT: 0,
    bulletTimeCd: 0,
    bulletTimePainted: [],
    enigmaPolarity: 'thermal',
    enigmaTimer: 0,
    devastatorTimer: 0,
    catalystPylons: [],
    midasCoins: [],
    pandoraRelics: {},
    airdropCrates: [],
    rhythmFeedback: null,
    placingPrism: false,
    // 11.0 The Infinite Chronicles Systems
    expedition: (typeof generateExpeditionTree === 'function') ? { nodes: generateExpeditionTree(), currentNodeId: 'node_0_0', history: [], active: true } : null,
    activeHeatModifiers: [],
    currentHeat: 0,
    chimeraDraft: null,
    nemesisGenome: null,
    chaosIncursion: null,
    chaosTimer: 0,
    dynamicPathMorphed: false,
    ruleRelics: {}
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

  // 9.0 Fuel Cell Blast Damage to Destructible Crags
  if (G && G.destructibleCrags && typeof damageCrag === 'function') {
    for (const crag of G.destructibleCrags) {
      if (!crag.collapsed && Math.hypot(crag.x - fc.x, crag.y - fc.y) <= 120) {
        damageCrag(crag, 300);
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
   BASTION TD 7.0: TITAN MECH, DREADNOUGHT, ANOMALIES & MARKET
   ============================================================ */

function toggleMechPilot(forceState) {
  if (!G || !G.mech) return false;
  const nextState = forceState !== undefined ? forceState : !G.mech.active;
  if (nextState && G.mech.battery <= 5) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    addText(G.mech.x, G.mech.y - 30, 'BATTERY DEPLETED!', '#f43f5e', 14);
    return false;
  }
  G.mech.active = nextState;
  if (G.mech.active) {
    G.mech.isDocked = false;
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
    shake(6);
    burst(G.mech.x, G.mech.y, 25, '#38bdf8', 140, 0.5, 3.5, true);
    addRing(G.mech.x, G.mech.y, 10, 60, 0.45, '#38bdf8', 3);
    addText(G.mech.x, G.mech.y - 35, 'TITAN MECH: PILOT ENGAGED [TAB]', '#38bdf8', 16);
  } else {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
    addText(G.mech.x, G.mech.y - 25, 'AUTONOMOUS STANDBY', '#94a3b8', 12);
  }
  G.uiDirty = true;
  return G.mech.active;
}

function updateMech(dt) {
  if (!G || !G.mech) return;
  const m = G.mech;
  const cfg = typeof TITAN_MECH_CONFIG !== 'undefined' ? TITAN_MECH_CONFIG : {
    speed: 155, batteryDrainPerSec: 2.8, batteryRechargeRate: 18.0, vulcanDmg: 32, vulcanRate: 8.5, bladeDmg: 360, bladeCd: 1.4, bladeRadius: 82
  };

  // Cooldowns
  if (m.bladeCd > 0) m.bladeCd = Math.max(0, m.bladeCd - dt);
  if (m.vulcanCd > 0) m.vulcanCd = Math.max(0, m.vulcanCd - dt);
  if (m.swingT > 0) m.swingT = Math.max(0, m.swingT - dt * 4.5);

  const baseDist = Math.hypot(m.x - BASE_PT.x, m.y - BASE_PT.y);
  const nearBase = baseDist <= 60;

  if (m.active) {
    // Battery Drain
    m.battery = Math.max(0, m.battery - dt * cfg.batteryDrainPerSec);
    if (m.battery <= 0) {
      toggleMechPilot(false);
      addText(m.x, m.y - 35, 'SYSTEM SHUTDOWN - ZERO BATTERY', '#ef4444', 14);
    }

    // WASD Movement
    let dx = 0, dy = 0;
    if (G.mechKeys) {
      if (G.mechKeys.w) dy -= 1;
      if (G.mechKeys.s) dy += 1;
      if (G.mechKeys.a) dx -= 1;
      if (G.mechKeys.d) dx += 1;
    }
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len; dy /= len;
      m.vx = dx * cfg.speed;
      m.vy = dy * cfg.speed;
      m.x = clamp(m.x + m.vx * dt, 24, W - 24);
      m.y = clamp(m.y + m.vy * dt, 24, H - 24);
      // Footstep sound tick
      m.stepTimer = (m.stepTimer || 0) + dt;
      if (m.stepTimer >= 0.35) {
        m.stepTimer = 0;
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('mech_step');
        burst(m.x - dx * 8, m.y - dy * 8, 3, '#64748b', 40, 0.25, 2, false);
      }
    } else {
      m.vx = 0; m.vy = 0;
    }

    // Face mouse cursor
    if (G.mouse && G.mouse.in) {
      m.facing = Math.atan2(G.mouse.y - m.y, G.mouse.x - m.x);
    }
  } else {
    // Passive Docking Recharge near base
    if (nearBase) {
      m.isDocked = true;
      if (m.battery < 100) {
        m.battery = Math.min(100, m.battery + dt * cfg.batteryRechargeRate);
      }
      if (m.hp < m.maxHp) {
        m.hp = Math.min(m.maxHp, m.hp + dt * 60);
      }
    }
  }
}

function mechFireVulcan(tx, ty) {
  if (!G || !G.mech || !G.mech.active || G.mech.vulcanCd > 0) return false;
  const m = G.mech;
  const cfg = typeof TITAN_MECH_CONFIG !== 'undefined' ? TITAN_MECH_CONFIG : { vulcanRate: 8.5, vulcanDmg: 32 };
  m.vulcanCd = 1 / cfg.vulcanRate;

  const dx = tx - m.x, dy = ty - m.y;
  const dLen = Math.hypot(dx, dy) || 1;
  const nx = dx / dLen, ny = dy / dLen;

  // Barrel offset
  const bx = m.x + nx * 22 - ny * 6;
  const by = m.y + ny * 22 + nx * 6;

  addFx('tracer', bx, by, bx + nx * 450, by + ny * 450, 0.08, '#38bdf8', 2.8);
  burst(bx, by, 3, '#f59e0b', 70, 0.15, 2, false);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('mech_vulcan');

  // Raycast hit enemy
  let hitEnemy = null, hitDist = 450;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const ex = e.x - bx, ey = e.y - by;
    const dot = ex * nx + ey * ny;
    if (dot > 0 && dot < hitDist) {
      const perp = Math.abs(ex * ny - ey * nx);
      if (perp <= e.r + 6) {
        hitDist = dot;
        hitEnemy = e;
      }
    }
  }
  if (hitEnemy) {
    dealDamage(hitEnemy, cfg.vulcanDmg, 'phys', null);
    burst(hitEnemy.x, hitEnemy.y, 4, '#38bdf8', 90, 0.25, 2.5, true);
  }
  // 9.0 Vulcan Direct Fire Damage to Destructible Crags
  if (G && G.destructibleCrags && typeof damageCrag === 'function') {
    for (const crag of G.destructibleCrags) {
      if (!crag.collapsed) {
        const cx = crag.x - bx, cy = crag.y - by;
        const dot = cx * nx + cy * ny;
        if (dot > 0 && dot < hitDist) {
          const perp = Math.abs(cx * ny - cy * nx);
          if (perp <= 26) {
            damageCrag(crag, cfg.vulcanDmg);
          }
        }
      }
    }
  }
  return true;
}

function mechSwingBlade() {
  if (!G || !G.mech || !G.mech.active || G.mech.bladeCd > 0) return false;
  const m = G.mech;
  const cfg = typeof TITAN_MECH_CONFIG !== 'undefined' ? TITAN_MECH_CONFIG : { bladeCd: 1.4, bladeDmg: 360, bladeRadius: 82, bladeArc: Math.PI * 0.9 };
  m.bladeCd = cfg.bladeCd;
  m.swingT = 1.0;

  shake(8);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('mech_blade');
  addRing(m.x, m.y, 15, cfg.bladeRadius, 0.4, '#f59e0b', 4.5);
  burst(m.x + Math.cos(m.facing) * 35, m.y + Math.sin(m.facing) * 35, 20, '#f59e0b', 160, 0.45, 3.5, true);

  // Cleave all hostiles within arc
  let cleaved = 0;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dist = Math.hypot(e.x - m.x, e.y - m.y);
    if (dist <= cfg.bladeRadius + e.r) {
      const ang = Math.atan2(e.y - m.y, e.x - m.x);
      let diff = Math.abs(ang - m.facing);
      if (diff > Math.PI) diff = TAU - diff;
      if (diff <= cfg.bladeArc / 2) {
        cleaved++;
        dealDamage(e, cfg.bladeDmg, 'plasma', null);
        burst(e.x, e.y, 10, '#f59e0b', 130, 0.35, 3, true);
        addText(e.x, e.y - e.r - 18, 'THERMAL CLEAVE!', '#f59e0b', 13);
      }
    }
  }
  // 9.0 Titan Thermal Blade Cleave Damage to Destructible Crags
  if (G && G.destructibleCrags && typeof damageCrag === 'function') {
    for (const crag of G.destructibleCrags) {
      if (!crag.collapsed && Math.hypot(crag.x - m.x, crag.y - m.y) <= cfg.bladeRadius + 26) {
        damageCrag(crag, cfg.bladeDmg);
      }
    }
  }
  return true;
}

function chargeDreadnought(amount) {
  if (!G || !G.dreadnought) return;
  const d = G.dreadnought;
  const maxC = typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG.maxCharge : 100;
  d.charge = Math.min(maxC, d.charge + amount);
}

function triggerDreadnoughtStrike() {
  if (!G || !G.dreadnought || G.dreadnought.active) return false;
  const d = G.dreadnought;
  const maxC = typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG.maxCharge : 100;
  if (d.charge < maxC) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  d.charge = 0;
  d.active = true;
  d.t = 0;
  d.rods = [];

  shake(18);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('dreadnought_horn');
  G.banner = { text: 'ORBITAL DREADNOUGHT ENGAGED', sub: 'Kinetic Tungsten Rods incoming from orbit!', t: 0, max: 4.0, color: '#f59e0b' };

  // Calculate 3 impact target coordinates along hostile clusters or path
  const pts = [];
  if (G.enemies.length >= 3) {
    pts.push({ x: G.enemies[0].x, y: G.enemies[0].y });
    pts.push({ x: G.enemies[Math.floor(G.enemies.length / 2)].x, y: G.enemies[Math.floor(G.enemies.length / 2)].y });
    pts.push({ x: G.enemies[G.enemies.length - 1].x, y: G.enemies[G.enemies.length - 1].y });
  } else {
    pts.push({ x: W * 0.35, y: H * 0.5 });
    pts.push({ x: W * 0.55, y: H * 0.4 });
    pts.push({ x: W * 0.75, y: H * 0.6 });
  }

  for (let i = 0; i < pts.length; i++) {
    d.rods.push({
      x: pts[i].x, y: pts[i].y,
      delay: 1.2 + i * 0.7,
      landed: false
    });
  }
  G.uiDirty = true;
  return true;
}

function updateDreadnought(dt) {
  if (!G || !G.dreadnought) return;
  const d = G.dreadnought;
  const cfg = typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG : {
    shadowDuration: 4.0, rodDmg: 720, rodRadius: 140, craterDuration: 12.0, craterDps: 55
  };

  if (d.active) {
    d.t += dt;
    // Check rod impacts
    for (const r of d.rods) {
      if (!r.landed && d.t >= r.delay) {
        r.landed = true;
        shake(22);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('orbital_impact');
        addRing(r.x, r.y, 15, cfg.rodRadius, 0.85, '#f59e0b', 7);
        burst(r.x, r.y, 60, '#f97316', 280, 1.1, 5.5, true);
        burst(r.x, r.y, 35, '#fff', 190, 0.7, 4, true);
        addText(r.x, r.y - 30, 'KINETIC IMPACT: -' + cfg.rodDmg + ' AOE!', '#f59e0b', 20);

        // AoE Damage
        for (const e of G.enemies) {
          if (e.dead) continue;
          const dist = Math.hypot(e.x - r.x, e.y - r.y);
          if (dist <= cfg.rodRadius + e.r) {
            dealDamage(e, cfg.rodDmg, 'plasma', null);
            e.stunT = Math.max(e.stunT || 0, 2.5);
          }
        }

        // 9.0 Dreadnought Kinetic Rod Damage to Destructible Crags
        if (G && G.destructibleCrags && typeof damageCrag === 'function') {
          for (const crag of G.destructibleCrags) {
            if (!crag.collapsed && Math.hypot(crag.x - r.x, crag.y - r.y) <= cfg.rodRadius + 26) {
              damageCrag(crag, cfg.rodDmg);
            }
          }
        }

        // Leave Molten Crater
        if (!d.craters) d.craters = [];
        d.craters.push({
          x: r.x, y: r.y, r: cfg.rodRadius * 0.75,
          life: cfg.craterDuration, maxLife: cfg.craterDuration,
          dps: cfg.craterDps
        });
      }
    }

    if (d.t >= cfg.shadowDuration + 2.0 && d.rods.every(r => r.landed)) {
      d.active = false;
    }
  }

  // Update craters
  if (d.craters && d.craters.length > 0) {
    for (let i = d.craters.length - 1; i >= 0; i--) {
      const cr = d.craters[i];
      cr.life -= dt;
      for (const e of G.enemies) {
        if (!e.dead && Math.hypot(e.x - cr.x, e.y - cr.y) <= cr.r + e.r) {
          dealDamage(e, cr.dps * dt, 'plasma', null);
        }
      }
      if (cr.life <= 0) d.craters.splice(i, 1);
    }
  }
}

function hasRelic(relicId) {
  return G && G.anomalousRelics && G.anomalousRelics.includes(relicId);
}

function triggerAnomalyVault(wave) {
  if (!G || (G.vaultsOffered && G.vaultsOffered[wave])) return false;
  if (!G.vaultsOffered) G.vaultsOffered = {};
  G.vaultsOffered[wave] = true;
  G.activeVaultModal = {
    wave: wave,
    options: Object.values(ANOMALY_VAULTS)
  };
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('vault_open');
  showOverlay('anomaly_vault');
  return true;
}

function selectAnomalyVault(vaultId, relicId) {
  if (!G) return false;
  if (vaultId === 'relic_vault') {
    const rId = relicId || Object.keys(ANOMALY_RELICS)[Math.floor(Math.random() * Object.keys(ANOMALY_RELICS).length)];
    if (!G.anomalousRelics) G.anomalousRelics = [];
    if (!G.anomalousRelics.includes(rId)) {
      G.anomalousRelics.push(rId);
      const r = ANOMALY_RELICS[rId];
      burst(W / 2, H / 2, 35, r.color, 180, 0.8, 4, true);
      addText(W / 2, H / 2 - 40, 'EXOTIC RELIC: ' + r.name.toUpperCase(), r.color, 18);
    }
  } else if (vaultId === 'hazard_vault') {
    G.gold += 350;
    if (typeof addCores === 'function') addCores(75);
    burst(W / 2, H / 2, 30, '#f59e0b', 160, 0.7, 4, true);
    addText(W / 2, H / 2 - 40, 'INFESTATION PURGED: +350G +75 CORES!', '#f59e0b', 18);
  } else if (vaultId === 'smuggler_sanctum') {
    G.lives = Math.max(1, G.lives - 4);
    if (typeof addChip === 'function') {
      addChip('quantum_singularity_chip', 1);
      addChip('hyper_overdrive_chip', 1);
    }
    burst(W / 2, H / 2, 30, '#c084fc', 160, 0.7, 4, true);
    addText(W / 2, H / 2 - 40, 'SANCTUM PACT: -4 LIVES + 2 FORBIDDEN CHIPS', '#c084fc', 16);
  }
  G.activeVaultModal = null;
  showOverlay(null);
  G.uiDirty = true;
  return true;
}

function updateWartimeMarket() {
  if (!G || !G.towers) return;
  const counts = {};
  for (const t of G.towers) {
    counts[t.type] = (counts[t.type] || 0) + 1;
  }
  G.wartimeMarket = {};
  const tKeys = typeof TKEYS !== 'undefined' ? TKEYS : ['gatling', 'plasma', 'cryo', 'rail', 'tesla', 'relay'];
  const thresh = typeof MARKET_CONFIG !== 'undefined' ? MARKET_CONFIG.threshold : 3;
  for (const k of tKeys) {
    const c = counts[k] || 0;
    if (c >= thresh) {
      G.wartimeMarket[k] = 1.0 + (c - thresh + 1) * (MARKET_CONFIG.penaltyPerExtra || 0.15);
    } else if (c === 0 && G.towers.length >= 6) {
      G.wartimeMarket[k] = 1.0 - (MARKET_CONFIG.discountRatio || 0.15);
    } else {
      G.wartimeMarket[k] = 1.0;
    }
  }
}

function spawnDropPod(x, y, hostiles) {
  if (!G) return;
  if (!G.dropPods) G.dropPods = [];
  let px = x, py = y;
  if (typeof px !== 'number' || typeof py !== 'number' || (y === undefined && typeof x === 'number')) {
    const pIdx = Math.floor((typeof MAIN_PATH !== 'undefined' ? MAIN_PATH.length : 10) * 0.45);
    const pt = (typeof MAIN_PATH !== 'undefined' && MAIN_PATH[pIdx]) ? MAIN_PATH[pIdx] : { x: W * 0.45, y: H * 0.45 };
    px = pt.x + (typeof rand === 'function' ? rand(-25, 25) : 0);
    py = pt.y + (typeof rand === 'function' ? rand(-25, 25) : 0);
  }
  const dp = {
    id: Date.now() + Math.random(),
    x: px, y: py,
    t: 0,
    landDelay: 2.2,
    landed: false,
    hostiles: hostiles || ['breacher', 'stealth', 'scout']
  };
  G.dropPods.push(dp);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('drop');
  addRing(px, py, 10, 60, 0.6, '#ef4444', 3);
  addText(px, py - 25, '! INCOMING DROP-POD !', '#ef4444', 13);
  return dp;
}

function updateDropPods(dt) {
  if (!G || !G.dropPods || G.dropPods.length === 0) return;
  for (let i = G.dropPods.length - 1; i >= 0; i--) {
    const dp = G.dropPods[i];
    dp.t += dt;
    if (!dp.landed && dp.t >= dp.landDelay) {
      dp.landed = true;
      shake(10);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');
      burst(dp.x, dp.y, 25, '#ef4444', 160, 0.6, 4, true);
      addRing(dp.x, dp.y, 10, 80, 0.5, '#ef4444', 4);
      addText(dp.x, dp.y - 20, 'DROP-POD TOUCHDOWN!', '#ef4444', 14);

      // Spawn hostiles at drop-pod location
      if (typeof spawnEnemy === 'function') {
        for (const type of dp.hostiles) {
          spawnEnemy(type, G.wave);
          const spawned = G.enemies[G.enemies.length - 1];
          if (spawned) {
            spawned.x = dp.x + rand(-15, 15);
            spawned.y = dp.y + rand(-15, 15);
          }
        }
      }
      G.dropPods.splice(i, 1);
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

  // Cursed Protocol: Glass Singularity (Guaranteed Critical Strikes)
  if (G && G.cursedProtocols && G.cursedProtocols.includes('glass_singularity')) {
    opts.crit = true;
  }

  // 7.0 Exotic Relic: Berserker Matrix (Guaranteed Crits)
  if (hasRelic('berserker_core')) {
    opts.crit = true;
    a *= 1.50;
  }

  // Reactive Hivemind Evolutionary Pressure Tracking (4.0)
  if (G && G.hivePressure) {
    if (type === 'phys') G.hivePressure.phys += a;
    else if (type === 'energy' || type === 'plasma') G.hivePressure.energy += a;
    else if (type === 'cryo') G.hivePressure.cryo += a;
    if (opts.isSplash) G.hivePressure.cluster += a;
  }

  // 9.0 Tactical Profiler Tracking
  if (G && G.profilerStats) {
    if (src === 'mech' || (src && src.isMech)) {
      G.profilerStats.mech = (G.profilerStats.mech || 0) + a;
    } else if (type === 'cryo' || type === 'plasma') {
      G.profilerStats.elemental = (G.profilerStats.elemental || 0) + a;
    } else if (src && (src.type === 'rail' || (src.range && src.range >= 3.5))) {
      G.profilerStats.sniper = (G.profilerStats.sniper || 0) + a;
    } else {
      G.profilerStats.choke = (G.profilerStats.choke || 0) + a;
    }
  }

  // 9.0 Symbiotic Parasite Protection & Snipe
  if (e.hasParasite) {
    e.slowT = 0; e.slowAmt = 0; e.stunT = 0;
    if ((src && src.type === 'rail') || a >= 200) {
      e.hasParasite = false;
      burst(e.x, e.y - 12, 12, '#84cc16', 90, 0.4, 3, true);
      addText(e.x, e.y - e.r - 24, 'PARASITE PURGED!', '#84cc16', 13);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('spore_burst');
    }
  }

  // 9.0 Nemesis Commander Hard-Counter Armor (-50% against countered damage type)
  if (e.isNemesis && e.counterType === type) {
    a *= 0.50;
    burst(e.x, e.y, 6, '#a855f7', 70, 0.3, 2, false);
    if (Math.random() < 0.25) addText(e.x, e.y - e.r - 22, 'NEMESIS RESIST -50%', '#a855f7', 12);
  }

  // 9.0 Subterranean Sapper underground damage reduction (-75% vs direct fire/non-seismic)
  if (e.burrowed) {
    const isSeismic = (opts && opts.isSeismic) || (src && src.type === 'plasma') || (src && src.megaType === 'mantle_bore');
    if (!isSeismic) {
      a *= 0.25;
      burst(e.x, e.y, 3, '#78350f', 40, 0.2, 1.5, false);
      if (Math.random() < 0.2) addText(e.x, e.y - 15, 'UNDERGROUND RESIST -75%', '#b45309', 10);
    }
  }

  // 9.0 Chaff Cloud Skimmer Projectile & Energy Mitigation (Skimmer aura or lingering Chaff Cloud hazard)
  if ((type === 'phys' || type === 'energy') && G) {
    const nearSkimmer = G.enemies && G.enemies.some(s => !s.dead && s.type === 'chaff_skimmer' && Math.hypot(s.x - e.x, s.y - e.y) <= 100);
    const inChaffCloud = G.hazards && G.hazards.some(h => h.type === 'chaff_cloud' && Math.hypot(h.x - e.x, h.y - e.y) <= h.r + e.r);
    if (nearSkimmer || inChaffCloud) {
      a *= 0.50;
      burst(e.x, e.y, 4, '#94a3b8', 50, 0.25, 2, false);
      if (Math.random() < 0.2) addText(e.x, e.y - 14, 'CHAFF DEFLECTION -50%', '#cbd5e1', 11);
    }
  }

  // 9.0 Nemesis Neural Core Chip Armor Shred
  if (src && src.chips && src.chips.includes('nemesis_neural_core') && e.armor > 0) {
    e.shred = Math.min(e.armor, (e.shred || 0) + e.armor * 0.30);
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

  // 8.0 Multi-Part Titan Boss Carapace Mitigation & Stagger
  if (e.parts && e.parts.carapace && !e.parts.carapace.broken) {
    if (typeof damageBossPart === 'function') damageBossPart(e, 'carapace', a * 0.5, type, src);
    a *= 0.20; // 80% reduction to main body
  } else if (e.staggerT > 0) {
    a *= 1.50; // Staggered damage amplification
  }

  // 8.0 Biochemical Gene-Splicing Effects
  if (G && G.geneSplices) {
    if (G.geneSplices.healer_leech && e.armor > 0) {
      e.shred = Math.min(e.armor, (e.shred || 0) + e.armor * 0.20);
    }
    if (G.geneSplices.chrono_slip && Math.random() < 0.15) {
      e.d = Math.max(0, e.d - 50);
      burst(e.x, e.y, 8, '#818cf8', 80, 0.3, 2, true);
      addText(e.x, e.y - e.r - 20, 'TACHYON SLIP', '#818cf8', 11);
    }
  }

  // 8.0 Kinetic Logistics Belt Pierce & Plasma Explosion Buffs
  if (src && src.kineticAmmoBuff && type === 'phys') {
    a *= 1.35;
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
  // Natural Counter Dynamics: Shields deflect kinetic (-25%), conducted by energy (+35%)
  if (e.shield > 0) {
    if (type === 'phys') a *= 0.75;
    else if (type === 'energy' || (src && src.type === 'tesla')) a *= 1.35;
    if (opts.shieldMult) a *= opts.shieldMult;
  }
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

  // 10.0 Enigma Boss Polarity Mechanics
  if (e.type === 'boss' && G && G.enigmaPolarity && typeof ENIGMA_BOSS_CONFIG !== 'undefined') {
    const curPol = ENIGMA_BOSS_CONFIG[G.enigmaPolarity];
    if (curPol) {
      if (type === curPol.absorbs) {
        e.hp = Math.min(e.maxHp, e.hp + a * 1.5);
        burst(e.x, e.y, 8, '#22c55e', 80, 0.3, 2.5, false);
        addText(e.x, e.y - e.r - 20, '+' + Math.round(a * 1.5) + ' ABSORBED!', '#22c55e', 14);
        return 0;
      } else if (type === curPol.vulnerable) {
        a *= 2.0;
        opts.crit = true;
        burst(e.x, e.y, 10, curPol.color, 110, 0.4, 3, true);
        addText(e.x, e.y - e.r - 20, 'VULNERABILITY 200%!', curPol.color, 14);
      }
    }
  }

  // 10.0 Crucible Gambits: Thermodynamic Meltdown
  if (G && G.activeGambit === 'meltdown') {
    opts.crit = true;
    a *= 1.5;
  }

  // 10.0 Crucible Gambits: Void Tithe (Megastructure 4x damage)
  if (G && G.activeGambit === 'void_tithe' && src && src.type && (src.type === 'ion_uplink' || src.type === 'drone_carrier' || src.type === 'tectonic_siphon')) {
    a *= 4.0;
  }

  // 10.0 Pandora Relics: The Glass Monolith
  if (G && G.pandoraRelics && G.pandoraRelics.glass_monolith) {
    a *= 1.80;
  }

  // 11.0 Rule Bending Relics: Quantum Power Reroute
  if (G && G.ruleRelics && G.ruleRelics.quantum_reroute) {
    const pStatus = (typeof getGridPowerStatus === 'function') ? getGridPowerStatus() : { used: 0, capacity: 60 };
    const bonus = 1 + ((pStatus.capacity || 60) / 10) * 0.15;
    a *= bonus;
  }

  // 11.0 Chimera Tower Prefixes
  if (src && src.chimeraPrefix) {
    if (src.chimeraPrefix === 'glacial') {
      if (e.slowT > 0) a *= 1.20;
      e.slowT = Math.max(e.slowT || 0, 2.5);
      e.slowAmt = Math.max(e.slowAmt || 0, 0.35);
      burst(e.x, e.y, 6, '#38bdf8', 60, 0.25, 2, false);
    } else if (src.chimeraPrefix === 'thermobaric') {
      a *= 1.25;
      burst(e.x, e.y, 12, '#f97316', 80, 0.35, 3, false);
    } else if (src.chimeraPrefix === 'singularity') {
      if (Math.random() < 0.20 && G.enemies) {
        burst(e.x, e.y, 14, '#a855f7', 90, 0.4, 3, true);
        for (const o of G.enemies) {
          if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) <= 90) {
            o.x = (o.x + e.x) / 2; o.y = (o.y + e.y) / 2;
          }
        }
      }
    } else if (src.chimeraPrefix === 'vanguard') {
      a *= 1.20;
    } else if (src.chimeraPrefix === 'hyper_thermal') {
      a *= 1.15;
    }
  }

  // 11.0 Chimera Tower Suffixes
  if (src && src.chimeraSuffix) {
    if (src.chimeraSuffix === 'of_execution' && e.maxHp && (e.hp / e.maxHp <= 0.30)) {
      a *= 2.20;
      opts.crit = true;
      addText(e.x, e.y - e.r - 20, 'EXECUTION 220%!', '#c084fc', 13);
    } else if (src.chimeraSuffix === 'of_midas') {
      src.midasHitCount = (src.midasHitCount || 0) + 1;
      if (src.midasHitCount >= 4) {
        src.midasHitCount = 0;
        G.gold = (G.gold || 0) + 3;
        addText(e.x, e.y - e.r - 16, '+3G', '#eab308', 11);
      }
    } else if (src.chimeraSuffix === 'of_superconductor' && !opts.isChain && G.enemies) {
      let chainCount = 0;
      for (const o of G.enemies) {
        if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) <= 100) {
          chainCount++;
          addFx('tracer', e.x, e.y, o.x, o.y, 0.1, '#818cf8', 2);
          dealDamage(o, Math.round(a * 0.5), 'energy', src, { isChain: true });
          if (chainCount >= 3) break;
        }
      }
    }
  }

  // 11.0 Adaptive Nemesis Genome Trait Defenses
  if (G && G.nemesisGenome) {
    if (G.nemesisGenome === 'kinetic_dissipation') {
      if (type === 'phys') {
        a *= 0.40; // -60% ballistic
        burst(e.x, e.y, 5, '#94a3b8', 50, 0.25, 2, false);
      } else if (type === 'energy' || type === 'plasma') {
        a *= 2.50; // +150% energy vulnerability
        burst(e.x, e.y, 8, '#c084fc', 80, 0.3, 2.5, true);
      }
    } else if (G.nemesisGenome === 'cryo_metabolic') {
      if (type === 'cryo') {
        e.slowT = 0; e.slowAmt = 0;
        e.speedBoostT = 3.0; e.speedBoost = 1.5;
        addText(e.x, e.y - e.r - 18, 'CRYO SURGE +50% SPD!', '#38bdf8', 12);
        return 0;
      }
    }
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

  // 7.0 Exotic Relic: Tungsten Ricochet Core
  if (hasRelic('tungsten_ricochet') && src && !opts.isRicochet && G.enemies.length > 1) {
    let ricCount = 0;
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      if (Math.hypot(o.x - e.x, o.y - e.y) <= 130) {
        ricCount++;
        addFx('tracer', e.x, e.y, o.x, o.y, 0.12, '#38bdf8', 2);
        burst(o.x, o.y, 4, '#38bdf8', 80, 0.25, 2, true);
        dealDamage(o, a * 0.70, type, src, { isRicochet: true, noReaction: true });
        if (ricCount >= 2) break;
      }
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
  const isBlind = G && G.activeGambit === 'blind_perimeter';
  const blindMult = isBlind ? 2.0 : 1.0;
  const finalReward = Math.round(e.reward * streakMult * bloodMult * blindMult);
  const finalScore = Math.round(e.reward * 10 * scoreStreakMult);
  const isMidas = G && G.pandoraRelics && G.pandoraRelics.midas_transmutation;
  if (isMidas && typeof spawnMidasCoin === 'function') {
    spawnMidasCoin(e.x, e.y, finalReward * 2);
  } else {
    G.gold += finalReward;
  }
  G.score += finalScore; G.kills++;
  if (src) src.kills++;

  // 11.0 Chimera Suffix: of_fission
  if (src && src.chimeraSuffix === 'of_fission' && G.enemies) {
    burst(e.x, e.y, 16, '#e11d48', 100, 0.45, 3, true);
    for (const o of G.enemies) {
      if (!o.dead && o !== e && Math.hypot(o.x - e.x, o.y - e.y) <= 80) {
        dealDamage(o, 90, 'plasma', src, { isFission: true });
      }
    }
  }

  // 8.0 Strategic Hivemind: Record Pheromone Death Heatmap
  if (typeof recordPheromoneDeath === 'function') {
    recordPheromoneDeath(e.x, e.y);
  }

  // 8.0 Dark Tech Curios: Blood-Forge Kills Tracking
  if (G && G.bloodForgeTimer > 0) {
    G.bloodForgeKills = (G.bloodForgeKills || 0) + 1;
  }

  // 8.0 Biochemical Gene-Splicing: Healer Leeching Life Siphon
  if (G && G.geneSplices && G.geneSplices.healer_leech) {
    G.leechKillCount = (G.leechKillCount || 0) + 1;
    if (G.leechKillCount % 25 === 0 && G.lives < 20) {
      G.lives++;
      addText(e.x, e.y - 30, '+1 LIFE (BIO-LEECH)', '#34d399', 14);
      burst(e.x, e.y, 10, '#34d399', 100, 0.4, 3, true);
    }
  }

  // 8.0 Void Alchemy: Singularity Core of Agony Pull
  if (G && G.darkCurios && G.darkCurios.includes('singularity_agony')) {
    addRing(e.x, e.y, 4, 85, 0.4, '#a855f7', 3);
    for (const o of G.enemies) {
      if (o.dead || o === e) continue;
      const dist = Math.hypot(o.x - e.x, o.y - e.y);
      if (dist <= 85 && dist > 5) {
        o.x += ((e.x - o.x) / dist) * 18;
        o.y += ((e.y - o.y) / dist) * 18;
        dealDamage(o, 20, 'energy', null);
      }
    }
  }

  // 7.0 Dreadnought Gauge Charge from Kills
  if (typeof chargeDreadnought === 'function') {
    chargeDreadnought(typeof DREADNOUGHT_CONFIG !== 'undefined' ? DREADNOUGHT_CONFIG.chargePerKill : 0.8);
  }

  // 7.0 Exotic Relic: Nanite Bio-Catalyst
  if (typeof hasRelic === 'function' && hasRelic('nanite_catalyst')) {
    G.gold += 4;
    burst(e.x, e.y, 6, '#10b981', 75, 0.3, 2, true);
    addText(e.x, e.y - 12, '+4G CATALYST', '#10b981', 11);
    if (G.towers) {
      for (const t of G.towers) {
        if (Math.hypot(t.x - e.x, t.y - e.y) <= 120) {
          t.catalystBoostT = 3.0;
        }
      }
    }
  }

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

  // 6.0 Corpse Persistence for Nanite Necromancy & 9.0 Gorger Cannibalism
  if (e.type !== 'swarm' && G && G.corpses) {
    if (G.corpses.length < 16) {
      G.corpses.push({
        type: e.type, x: e.x, y: e.y, r: e.r || 14,
        life: 16.0
      });
    }
  }

  // 9.0 Nemesis Commander Retribution Bounty
  if (e.isNemesis) {
    G.gold += 100;
    addCores(35);
    if (typeof addChip === 'function') {
      addChip('nemesis_neural_core', 1);
    }
    addText(e.x, e.y - 45, '+100G NEMESIS BOUNTY!', '#fbbf24', 18);
    addText(e.x, e.y - 70, '+35 CORES & NEMESIS CORE CHIP!', '#38bdf8', 15);
    burst(e.x, e.y, 45, '#a855f7', 200, 0.8, 5, true);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('vault_open');
    if (G.nemesisRoster) {
      G.nemesisRoster = G.nemesisRoster.filter(n => n.id !== e.nemesisId);
      if (typeof SAVE !== 'undefined') SAVE.nemesisRoster = G.nemesisRoster;
    }
  }

  // 9.0 Acidic Sinkhole Accumulation (15+ Brute/Healer deaths)
  if ((e.type === 'brute' || e.type === 'healer') && G && G.acidDeathTally) {
    const tk = Math.floor(e.x / TILE) + '_' + Math.floor(e.y / TILE);
    G.acidDeathTally[tk] = (G.acidDeathTally[tk] || 0) + 1;
    if (G.acidDeathTally[tk] >= 15 && typeof addSoilTile === 'function') {
      addSoilTile(Math.floor(e.x / TILE), Math.floor(e.y / TILE), 'acid_sinkhole', 25.0);
      G.acidDeathTally[tk] = 0;
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

/* ============================================================
   BASTION TD 8.0: MASTERCLASS AAA/INDIE SYSTEMS STATE ENGINE
   ============================================================ */

function canPlaceMegastructure(col, row, type) {
  if (!G || !MEGASTRUCTURE_CONFIG || !MEGASTRUCTURE_CONFIG[type]) return false;
  const conf = MEGASTRUCTURE_CONFIG[type];
  if (col < 0 || row < 0 || col + 1 >= COLS || row + 1 >= ROWS) return false;
  for (let r = row; r <= row + 1; r++) {
    for (let c = col; c <= col + 1; c++) {
      if (pathTile[r][c] || G.grid[r][c]) return false;
      if (G.fuelCells && G.fuelCells.some(fc => !fc.dead && fc.c === c && fc.row === r)) return false;
    }
  }
  return G.gold >= conf.cost;
}

function placeMegastructure(col, row, type) {
  if (!canPlaceMegastructure(col, row, type)) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return null;
  }
  const conf = MEGASTRUCTURE_CONFIG[type];
  G.gold -= conf.cost;
  const ms = {
    id: 'mega_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    name: conf.name,
    color: conf.color,
    c: col,
    r: row,
    x: (col + 1) * TILE,
    y: (row + 1) * TILE,
    w: 2 * TILE,
    h: 2 * TILE,
    timer: 0,
    kills: 0,
    dmg: 0,
    active: true,
    maxDurability: conf.maxDurability || 3,
    durability: conf.maxDurability || 3,
    isBroken: false,
    drones: type === 'drone_carrier' ? [] : null
  };

  if (type === 'drone_carrier') {
    for (let i = 0; i < (conf.interceptorCount || 4); i++) {
      ms.drones.push({ type: 'interceptor', angle: (i * Math.PI * 2) / 4, dist: 38, cd: 0 });
    }
    for (let i = 0; i < (conf.repairBotCount || 2); i++) {
      ms.drones.push({ type: 'repair', angle: (i * Math.PI * 2) / 2 + Math.PI / 4, dist: 24, cd: 0 });
    }
  }

  for (let r = row; r <= row + 1; r++) {
    for (let c = col; c <= col + 1; c++) {
      G.grid[r][c] = ms;
    }
  }
  G.megastructures.push(ms);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('megastructure_build');
  shake(8);
  burst(ms.x, ms.y, 35, conf.color, 160, 0.7, 4, true);
  addRing(ms.x, ms.y, 10, 80, 0.5, conf.color, 4);
  addText(ms.x, ms.y - 30, conf.name.toUpperCase(), conf.color, 14);
  G.uiDirty = true;
  return ms;
}

function updateMegastructures(dt) {
  if (!G || !G.megastructures || G.megastructures.length === 0) return;
  for (const ms of G.megastructures) {
    if (ms.isBroken || !ms.active || (ms.durability !== undefined && ms.durability <= 0)) {
      ms.isBroken = true;
      ms.active = false;
      if (Math.random() < 0.04 && typeof burst === 'function') {
        const sx = ms.x + (Math.random() - 0.5) * 44;
        const sy = ms.y + (Math.random() - 0.5) * 44;
        burst(sx, sy, 2, '#ef4444', 35, 0.25, 2, false);
      }
      continue;
    }
    if (ms.overclockT > 0) {
      ms.overclockT = Math.max(0, ms.overclockT - dt);
    }
    const speedMult = ms.overclockT > 0 ? 1.5 : 1.0;
    const effDt = dt * speedMult;
    ms.timer += effDt;
    const conf = MEGASTRUCTURE_CONFIG[ms.type];
    if (!conf) continue;

    if (ms.type === 'ion_uplink') {
      let target = null;
      const prio = ms.prio || 'strongest';
      const live = G.enemies.filter(e => !e.dead);
      if (live.length > 0) {
        if (prio === 'strongest') {
          let maxHp = -1;
          for (const e of live) { if (e.hp > maxHp) { maxHp = e.hp; target = e; } }
        } else if (prio === 'weakest') {
          let minHp = Infinity;
          for (const e of live) { if (e.hp < minHp) { minHp = e.hp; target = e; } }
        } else if (prio === 'last') {
          let minProg = Infinity;
          for (const e of live) { if (e.d < minProg) { minProg = e.d; target = e; } }
        } else {
          // 'first'
          let maxProg = -1;
          for (const e of live) { if (e.d > maxProg) { maxProg = e.d; target = e; } }
        }
      }
      if (target) {
        ms.targetX = target.x;
        ms.targetY = target.y;
        const beamR = conf.beamRadius || 65;
        for (const e of G.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - ms.targetX, e.y - ms.targetY) <= beamR + (e.r || 12)) {
            dealDamage(e, conf.dps * effDt, 'energy', ms);
            ms.dmg += conf.dps * effDt;
          }
        }
        if (Math.floor(ms.timer * 4) !== Math.floor((ms.timer - effDt) * 4)) {
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('ion_beam');
        }
      } else {
        ms.targetX = null;
        ms.targetY = null;
      }
    } else if (ms.type === 'drone_carrier') {
      if (ms.drones) {
        for (const d of ms.drones) {
          d.angle += effDt * 1.8;
          d.x = ms.x + Math.cos(d.angle) * d.dist;
          d.y = ms.y + Math.sin(d.angle) * d.dist;
          d.cd = Math.max(0, d.cd - effDt);

          if (d.type === 'interceptor' && d.cd <= 0) {
            let nearest = null, nearDist = 180;
            for (const e of G.enemies) {
              if (e.dead) continue;
              const dst = Math.hypot(e.x - d.x, e.y - d.y);
              if (dst < nearDist) { nearDist = dst; nearest = e; }
            }
            if (nearest) {
              d.cd = 1 / (conf.droneRate || 2.2);
              dealDamage(nearest, conf.droneDmg || 28, 'phys', ms);
              addFx('tracer', d.x, d.y, nearest.x, nearest.y, 0.15, '#10b981', 1.5);
              burst(nearest.x, nearest.y, 3, '#10b981', 40, 0.2, 1.5, false);
            }
          } else if (d.type === 'repair') {
            for (const t of G.towers) {
              if (Math.hypot(t.x - ms.x, t.y - ms.y) <= 120) {
                t.heat = Math.max(0, (t.heat || 0) - 30 * effDt);
              }
            }
          }
        }
      }
    } else if (ms.type === 'tectonic_siphon') {
      const pInt = conf.pulseInterval || 3.0;
      if (ms.timer >= pInt) {
        ms.timer -= pInt;
        const qRad = conf.quakeRadius || 180;
        shake(7);
        addRing(ms.x, ms.y, 10, qRad, 0.6, '#f59e0b', 4);
        burst(ms.x, ms.y, 25, '#f59e0b', 140, 0.5, 3.5, true);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boom');

        for (const e of G.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - ms.x, e.y - ms.y) <= qRad + (e.r || 12)) {
            if (e.type !== 'boss' && e.hp <= e.maxHp * 0.25) {
              addText(e.x, e.y - e.r - 12, 'CHASM SWALLOWED', '#ef4444', 12);
              burst(e.x, e.y, 16, '#ef4444', 110, 0.45, 3, true);
              killEnemy(e, ms);
            } else {
              dealDamage(e, conf.quakeDmg || 250, 'phys', ms);
              e.slowT = Math.max(e.slowT || 0, 2.0);
              e.slowVal = 0.5;
            }
          }
        }
      }
    }
  }
}

function setupBossMultiParts(bossEnemy) {
  if (!bossEnemy || bossEnemy.parts) return;
  bossEnemy.parts = {
    carapace: { hp: 800, maxHp: 800, broken: false },
    mortar_pod: { hp: 500, maxHp: 500, broken: false, timer: 0 },
    joints: { hp: 650, maxHp: 650, broken: false },
    core: { hp: 1200, maxHp: 1200, broken: false, exposed: false }
  };
  bossEnemy.activeTargetPart = 'carapace';
  G.activeBossTitan = bossEnemy;
}

function damageBossPart(bossEnemy, partKey, amount, type, src) {
  if (!bossEnemy || !bossEnemy.parts || !bossEnemy.parts[partKey]) return;
  const p = bossEnemy.parts[partKey];
  if (p.broken) return;
  p.hp = Math.max(0, p.hp - amount);
  if (p.hp <= 0) {
    p.broken = true;
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('titan_break');
    burst(bossEnemy.x, bossEnemy.y, 25, '#f43f5e', 160, 0.6, 4, true);
    shake(8);
    const breakMsg = (MULTI_PART_TITAN_CONFIG && MULTI_PART_TITAN_CONFIG.parts[partKey]) ? MULTI_PART_TITAN_CONFIG.parts[partKey].breakText : 'PART DESTROYED!';
    addText(bossEnemy.x, bossEnemy.y - (bossEnemy.r || 24) - 25, breakMsg, '#f43f5e', 14);

    if (partKey === 'carapace') {
      bossEnemy.parts.core.exposed = true;
    } else if (partKey === 'joints') {
      bossEnemy.staggerT = 6.0;
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('titan_stagger');
      G.grapplePrompt = { boss: bossEnemy, timer: 6.0 };
      addText(bossEnemy.x, bossEnemy.y - (bossEnemy.r || 24) - 45, 'TITAN STAGGERED! PRESS [E] TO GRAPPLE!', '#fbbf24', 16);
    }
  }
}

function mechGrappleStrike(bossEnemy) {
  if (!bossEnemy || bossEnemy.staggerT <= 0 || !G || !G.mech || !G.mech.active) return false;
  bossEnemy.staggerT = 0;
  G.grapplePrompt = null;
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('mech_grapple');
  shake(15);
  addFx('tracer', G.mech.x, G.mech.y, bossEnemy.x, bossEnemy.y, 0.45, '#38bdf8', 4.0);
  burst(bossEnemy.x, bossEnemy.y, 50, '#38bdf8', 220, 0.9, 5, true);
  addRing(bossEnemy.x, bossEnemy.y, 10, 100, 0.6, '#38bdf8', 5);
  const dmg = 2400;
  dealDamage(bossEnemy, dmg, 'energy', G.mech);
  addText(bossEnemy.x, bossEnemy.y - 50, 'MECH TITAN CLEAVE! 2400 DMG', '#38bdf8', 18);
  return true;
}

function routeLogistics(c1, r1, c2, r2, type) {
  if (!G || !LOGISTICS_CONFIG || !LOGISTICS_CONFIG.types[type]) return false;
  const conf = LOGISTICS_CONFIG.types[type];
  if (G.gold < conf.cost) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.gold -= conf.cost;
  const conduit = {
    id: 'conduit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    c1, r1, c2, r2,
    type,
    color: conf.color,
    name: conf.name,
    active: true
  };
  G.logisticsConduits.push(conduit);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
  G.uiDirty = true;
  return conduit;
}

function updateLogistics(dt) {
  if (!G || !G.logisticsConduits || G.logisticsConduits.length === 0) return;
  for (const c of G.logisticsConduits) {
    const t1 = G.grid[c.r1] && G.grid[c.r1][c.c1];
    const t2 = G.grid[c.r2] && G.grid[c.r2][c.c2];
    [t1, t2].forEach(t => {
      if (t && t.type && TD[t.type]) {
        if (c.type === 'kinetic_belt') {
          t.kineticAmmoBuff = true;
        } else if (c.type === 'cryo_pipe') {
          t.heat = 0;
          t.cryoCooling = true;
        } else if (c.type === 'plasma_pipe') {
          t.plasmaExplosiveBuff = true;
        }
      }
    });
  }
}

function recordPheromoneDeath(x, y) {
  if (!G || !G.pheromoneMap) return;
  const col = Math.floor(x / TILE), row = Math.floor(y / TILE);
  const key = col + '_' + row;
  G.pheromoneMap[key] = (G.pheromoneMap[key] || 0) + 1.0;
}

function updatePheromones(dt) {
  if (!G || !G.pheromoneMap) return;
  for (const k in G.pheromoneMap) {
    G.pheromoneMap[k] = Math.max(0, G.pheromoneMap[k] - dt * 0.15);
    if (G.pheromoneMap[k] <= 0.05) delete G.pheromoneMap[k];
  }
}

function applyGeneSplice(spliceId) {
  if (!G || !GENE_SPLICING_CONFIG || !GENE_SPLICING_CONFIG[spliceId]) return false;
  const conf = GENE_SPLICING_CONFIG[spliceId];
  if (!SAVE || (SAVE.cores || 0) < conf.cost) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  SAVE.cores -= conf.cost;
  if (typeof saveGame === 'function') saveGame();
  G.geneSplices = G.geneSplices || {};
  G.geneSplices[spliceId] = true;
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('gene_splice');
  if (spliceId === 'brute_chitin' && G.towers) {
    for (const t of G.towers) {
      t.bioShield = 120;
    }
  }
  G.uiDirty = true;
  return true;
}

function applyDarkCurio(curioId) {
  if (!G || !DARK_TECH_CURIOS || !DARK_TECH_CURIOS[curioId]) return false;
  G.darkCurios = G.darkCurios || [];
  if (G.darkCurios.includes(curioId)) return false;
  G.darkCurios.push(curioId);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('vault_open');
  if (curioId === 'blood_forge') {
    G.bloodForgeTimer = 15.0;
    G.bloodForgeKills = 0;
  }
  G.uiDirty = true;
  return true;
}

/* ============================================================
   BASTION TD 9.0: LIVING ECOSYSTEM & NEMESIS NETWORK FUNCTIONS
   ============================================================ */

function addSoilTile(c, r, type, duration) {
  if (!G) return null;
  G.soilTiles = G.soilTiles || {};
  const cfg = typeof ECOSYSTEM_CONFIG !== 'undefined' && ECOSYSTEM_CONFIG.soil && ECOSYSTEM_CONFIG.soil[type];
  const maxLife = duration || (cfg ? cfg.duration : 15.0);
  const key = c + '_' + r;
  const tile = {
    key,
    type,
    c,
    r,
    x: c * TILE + TILE / 2,
    y: r * TILE + TILE / 2,
    life: maxLife,
    maxLife,
    dps: (cfg && cfg.dps) || 0,
    speedMult: (cfg && cfg.speedMult) || 1.0
  };
  G.soilTiles[key] = tile;
  if (type === 'thermal_ash') {
    burst(tile.x, tile.y, 8, '#f97316', 70, 0.4, 3, false);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('soil_burn');
  } else if (type === 'frost_slick') {
    burst(tile.x, tile.y, 8, '#38bdf8', 60, 0.4, 2.5, false);
  } else if (type === 'acid_sinkhole') {
    burst(tile.x, tile.y, 12, '#84cc16', 80, 0.5, 3.5, false);
  }
  G.uiDirty = true;
  return tile;
}

function setWeather(weatherType) {
  if (!G || !ECOSYSTEM_CONFIG.weather[weatherType]) return;
  G.currentWeather = weatherType;
  G.weatherTimer = 0;
  G.ionSquallTimer = 0;
  const w = ECOSYSTEM_CONFIG.weather[weatherType];
  addText(W / 2, 70, 'ATMOSPHERE: ' + w.name.toUpperCase(), w.color, 16);
  if (weatherType === 'ion_squall') {
    shake(8);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('weather_ion');
  }
  G.uiDirty = true;
}

function updateEcology(dt) {
  if (!G) return;
  // 1. Update Soil Tiles
  if (G.soilTiles) {
    for (const k in G.soilTiles) {
      const st = G.soilTiles[k];
      st.life -= dt;
      if (st.life <= 0) {
        delete G.soilTiles[k];
      }
    }
  }

  // 2. Update Weather Atmosphere
  G.weatherTimer = (G.weatherTimer || 0) + dt;
  if (G.currentWeather === 'ion_squall') {
    G.ionSquallTimer = (G.ionSquallTimer || 0) + dt;
    if (G.ionSquallTimer >= 3.5) {
      G.ionSquallTimer = 0;
      // Strike lightning at random target
      if (G.enemies && G.enemies.length > 0 && (Math.random() < 0.65 || (!G.towers || G.towers.length === 0))) {
        const target = G.enemies[Math.floor(Math.random() * G.enemies.length)];
        if (target && !target.dead) {
          dealDamage(target, 150, 'energy', null, { noReaction: true });
          target.stunT = Math.max(target.stunT || 0, 1.5);
          addFx('tracer', target.x, -20, target.x, target.y, 0.25, '#818cf8', 4);
          burst(target.x, target.y, 16, '#818cf8', 120, 0.4, 3, true);
          shake(6);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('weather_ion');
          addText(target.x, target.y - 20, 'ION STRIKE!', '#818cf8', 13);
        }
      } else if (G.towers && G.towers.length > 0 && Math.random() < 0.5) {
        // Strike tower: instant overcharge metal towers
        const t = G.towers[Math.floor(Math.random() * G.towers.length)];
        if (t && (t.type === 'gatling' || t.type === 'tesla' || t.type === 'rail')) {
          t.ionOverchargeT = 4.0;
          burst(t.x, t.y, 14, '#38bdf8', 90, 0.4, 3, true);
          addText(t.x, t.y - 18, 'ION OVERCHARGE (+100%)', '#38bdf8', 12);
          if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
        }
      } else if (G.mech && G.mech.active) {
        G.mech.battery = 100;
        burst(G.mech.x, G.mech.y, 16, '#38bdf8', 120, 0.45, 3.5, true);
        addText(G.mech.x, G.mech.y - 28, 'MECH BATTERY FULL!', '#38bdf8', 14);
        if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('weather_ion');
      } else if (G.enemies && G.enemies.length > 0) {
        const target = G.enemies[0];
        if (target && !target.dead) {
          dealDamage(target, 150, 'energy', null, { noReaction: true });
          target.stunT = Math.max(target.stunT || 0, 1.5);
          burst(target.x, target.y, 16, '#818cf8', 120, 0.4, 3, true);
        }
      }
    }
  }

  // 3. Update Rockslides
  if (G.rockslides) {
    for (let i = G.rockslides.length - 1; i >= 0; i--) {
      const rs = G.rockslides[i];
      rs.life -= dt;
      if (rs.life <= 0 || rs.cleared) {
        G.rockslides.splice(i, 1);
        burst(rs.x, rs.y, 16, '#78716c', 90, 0.4, 3, false);
        addText(rs.x, rs.y - 15, 'ROAD CLEARED', '#a8a29e', 12);
      }
    }
  }
}

function updateProfiler(dt) {
  if (!G || !G.profilerStats) return;
  const s = G.profilerStats;
  const total = s.choke + s.sniper + s.elemental + s.mech;
  if (total < 300) return;

  // Calculate dominant playstyle vector
  let dominant = 'choke_heavy';
  let maxVal = s.choke;
  if (s.sniper > maxVal) { dominant = 'sniper_long_range'; maxVal = s.sniper; }
  if (s.elemental > maxVal) { dominant = 'elemental_spam'; maxVal = s.elemental; }
  if (s.mech > maxVal) { dominant = 'mech_brawler'; maxVal = s.mech; }

  G.dominantPlaystyle = dominant;

  // Adaptability score scaling based on strategy complexity
  let activeVectors = 0;
  if (s.choke > total * 0.15) activeVectors++;
  if (s.sniper > total * 0.15) activeVectors++;
  if (s.elemental > total * 0.15) activeVectors++;
  if (s.mech > total * 0.15) activeVectors++;

  G.adaptabilityScore = Math.min(3.0, 1.0 + activeVectors * 0.4);
}

function damageCrag(crag, amount) {
  if (!crag || crag.collapsed) return;
  crag.hp = Math.max(0, crag.hp - amount);
  burst(crag.x, crag.y, 6, '#78716c', 60, 0.3, 2, false);
  if (crag.hp <= 0) {
    triggerRockslide(crag);
  }
}

function triggerRockslide(crag) {
  if (!crag || crag.collapsed) return;
  crag.collapsed = true;
  crag.hp = 0;
  shake(14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('rockslide');

  const rx = crag.roadC * TILE + TILE / 2;
  const ry = crag.roadR * TILE + TILE / 2;
  burst(rx, ry, 35, '#78716c', 160, 0.7, 4.5, true);
  burst(rx, ry, 20, '#d6d3d1', 120, 0.5, 3, false);
  addText(rx, ry - 25, 'ROCKSLIDE AVALANCHE!', '#f59e0b', 16);

  // Spawn rockslide blockade on road tile
  G.rockslides = G.rockslides || [];
  const rs = {
    id: 'rockslide_' + Date.now(),
    c: crag.roadC,
    r: crag.roadR,
    x: rx,
    y: ry,
    life: DESTRUCTIBLE_TERRAIN_CONFIG.rockslideDuration,
    maxLife: DESTRUCTIBLE_TERRAIN_CONFIG.rockslideDuration,
    hp: 300,
    maxHp: 300,
    cleared: false
  };
  G.rockslides.push(rs);

  // Crush enemies on this road tile
  if (G.enemies) {
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - rx, e.y - ry) <= 45) {
        dealDamage(e, DESTRUCTIBLE_TERRAIN_CONFIG.rockslideDamage, 'phys', null, { noReaction: true });
        e.stunT = Math.max(e.stunT || 0, 2.5);
        addText(e.x, e.y - e.r - 18, 'CRUSHED!', '#f59e0b', 13);
      }
    }
  }
  G.uiDirty = true;
  return rs;
}

function placeBarricade(c, r) {
  if (!G) return false;
  const cost = DESTRUCTIBLE_TERRAIN_CONFIG.barricadeCost;
  if (G.gold < cost) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  G.gold -= cost;
  G.barricades = G.barricades || [];
  const bar = {
    id: 'barricade_' + Date.now(),
    c, r,
    x: c * TILE + TILE / 2,
    y: r * TILE + TILE / 2,
    hp: DESTRUCTIBLE_TERRAIN_CONFIG.barricadeHp,
    maxHp: DESTRUCTIBLE_TERRAIN_CONFIG.barricadeHp
  };
  G.barricades.push(bar);
  burst(bar.x, bar.y, 14, '#94a3b8', 90, 0.4, 3, false);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('place');
  addText(bar.x, bar.y - 18, 'BARRICADE DEPLOYED', '#38bdf8', 12);
  G.uiDirty = true;
  return bar;
}

function feedGorger(e, corpse) {
  if (!e || e.dead || !corpse) return;
  e.corpsesEaten = (e.corpsesEaten || 0) + 1;
  burst(corpse.x, corpse.y, 12, '#f43f5e', 80, 0.4, 3, true);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('gorger_feed');
  addText(e.x, e.y - e.r - 16, 'DEVOUR (' + e.corpsesEaten + '/3)', '#f43f5e', 12);

  if (e.corpsesEaten >= ECO_MUTATION_CONFIG.gorger.eatThreshold) {
    // Instant Metamorphosis into Alpha Gorgon Apex
    e.type = 'alpha_gorgon';
    e.maxHp = Math.round(e.maxHp * ECO_MUTATION_CONFIG.alpha_gorgon.hpMult);
    e.hp = e.dispHp = e.maxHp;
    e.armor = ECO_MUTATION_CONFIG.alpha_gorgon.armor;
    e.r = Math.round(e.r * ECO_MUTATION_CONFIG.alpha_gorgon.rMult);
    e.reward = Math.round(e.reward * ECO_MUTATION_CONFIG.alpha_gorgon.bountyMult);
    shake(12);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('alpha_roar');
    burst(e.x, e.y, 40, '#831843', 180, 0.7, 4.5, true);
    addRing(e.x, e.y, 10, 95, 0.6, '#ec4899', 4);
    addText(e.x, e.y - e.r - 28, 'METAMORPHOSIS: ALPHA GORGON!', '#d946ef', 16);
  }
}

function recordNemesisEscape(e) {
  if (!e || (!e.type && !e.isElite)) return;
  G.nemesisRoster = G.nemesisRoster || [];

  // Determine hardest hit damage type
  let counterType = 'phys';
  if (G.damageTrack) {
    let maxDmg = G.damageTrack.phys || 0;
    if ((G.damageTrack.energy || 0) > maxDmg) { counterType = 'energy'; maxDmg = G.damageTrack.energy; }
    if ((G.damageTrack.cryo || 0) > maxDmg) { counterType = 'cryo'; maxDmg = G.damageTrack.cryo; }
    if ((G.damageTrack.plasma || 0) > maxDmg) { counterType = 'plasma'; maxDmg = G.damageTrack.plasma; }
  }

  const titles = {
    phys: "Vor'gath, The Rail-Shatterer",
    energy: "Volt-Reaper, The Superconductor",
    cryo: "Kryos-Tek, The Glacier-Borne",
    plasma: "Ignis-Vor, The Asbestos Fiend"
  };

  const title = titles[counterType] || "Vor'gath, The Untouchable";
  const entry = {
    id: 'nemesis_' + Date.now(),
    title,
    counterType,
    waveOrigin: (G && G.wave) || 1,
    baseHp: Math.round((e.maxHp || 1000) * 1.3),
    enemyType: e.type || 'boss'
  };

  // Avoid duplicates
  if (!G.nemesisRoster.some(n => n.title === entry.title)) {
    G.nemesisRoster.push(entry);
    if (typeof SAVE !== 'undefined') {
      SAVE.nemesisRoster = G.nemesisRoster;
      Store.set('nb_nemesis', SAVE.nemesisRoster);
    }
  }
  return entry;
}

function spawnNemesisCommander(nemesisData) {
  if (!G) return null;
  const nd = nemesisData || (G.nemesisRoster && G.nemesisRoster[0]);
  if (!nd) return null;

  spawnEnemy('boss', G.wave);
  const boss = G.enemies[G.enemies.length - 1];
  if (boss) {
    boss.isNemesis = true;
    boss.nemesisId = nd.id;
    boss.nemesisTitle = nd.title;
    boss.counterType = nd.counterType;
    boss.hp = boss.maxHp = boss.dispHp = Math.max(boss.maxHp, nd.baseHp || 2400);
    boss.reward += 100;
    shake(16);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('boss');
    addRing(boss.x, boss.y, 14, 140, 0.8, '#a855f7', 6);
    addText(boss.x, boss.y - 35, 'NEMESIS INVADER: ' + nd.title.toUpperCase(), '#a855f7', 16);
  }
  return boss;
}

/* ============================================================
   BASTION TD 10.0: THE CRUCIBLE OF ASCENDANCY - GAMEPLAY SYSTEMS
   ============================================================ */

function trackPlayerAction() {
  if (!G) return;
  G.playerActions = (G.playerActions || 0) + 1;
}

function updateSkillProfiler(dt) {
  if (!G || G.state !== 'active') return;
  G.apmTimer = (G.apmTimer || 0) + dt;
  if (G.apmTimer >= 2.0) {
    const apm = ((G.playerActions || 0) / G.apmTimer) * 60;
    G.playerActions = 0;
    G.apmTimer = 0;
    let avgDist = 300;
    if (G.enemies && G.enemies.length > 0) {
      const sumDist = G.enemies.reduce((acc, e) => acc + (e.d || 0), 0);
      avgDist = sumDist / G.enemies.length;
    }
    const goldBuffer = Math.min(2.0, (G.gold || 0) / 400);
    const speedPenalty = Math.max(0.5, 2.0 - (avgDist / 250));
    const apmFactor = Math.min(2.0, Math.max(0.5, apm / 35));
    const streakFactor = Math.min(1.5, 1 + ((G.wave || 1) - (G.leakedThisWave || 0) * 2) * 0.05);

    G.cer = Math.round((apmFactor * 0.3 + speedPenalty * 0.3 + goldBuffer * 0.2 + streakFactor * 0.2) * 100) / 100;
  }
}

function activateGambit(gambitId) {
  if (!G || typeof CRUCIBLE_GAMBITS === 'undefined' || !CRUCIBLE_GAMBITS[gambitId]) return false;
  const sW = typeof W !== 'undefined' ? W : 960;
  if (G.activeGambit === gambitId) {
    G.activeGambit = null;
    addText(sW / 2, 85, 'CRUCIBLE GAMBIT CLEARED', '#94a3b8', 14);
  } else {
    G.activeGambit = gambitId;
    const gDef = CRUCIBLE_GAMBITS[gambitId];
    addText(sW / 2, 85, 'GAMBIT ACTIVATED: ' + gDef.name.toUpperCase(), gDef.color, 16);
    burst(sW / 2, 85, 25, gDef.color, 120, 0.5, 3.5, true);
    shake(6);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
  }
  G.uiDirty = true;
  return true;
}

function canPlacePrism(col, row) {
  if (!G || col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
  if (pathTile[row][col] || G.grid[row][col]) return false;
  if (G.fuelCells && G.fuelCells.some(fc => !fc.dead && fc.c === col && fc.row === row)) return false;
  const cost = (typeof PHOTON_PRISM_CONFIG !== 'undefined' ? PHOTON_PRISM_CONFIG.cost : 60);
  return G.gold >= cost;
}

function placePrism(col, row) {
  if (!canPlacePrism(col, row)) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return null;
  }
  const conf = typeof PHOTON_PRISM_CONFIG !== 'undefined' ? PHOTON_PRISM_CONFIG : { cost: 60, color: '#38bdf8', glowColor: '#818cf8' };
  G.gold -= conf.cost;
  const prism = {
    id: 'prism_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    type: 'photon_prism',
    name: conf.name || 'Photon Reflection Prism',
    c: col,
    r: row,
    x: col * TILE + TILE / 2,
    y: row * TILE + TILE / 2,
    angle: 0,
    angleIndex: 0,
    color: conf.color || '#38bdf8',
    glowColor: conf.glowColor || '#818cf8',
    hp: 150,
    maxHp: 150,
    active: true
  };
  G.grid[row][col] = prism;
  G.prisms = G.prisms || [];
  G.prisms.push(prism);
  trackPlayerAction();
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('place');
  burst(prism.x, prism.y, 20, prism.color, 100, 0.4, 3, false);
  addRing(prism.x, prism.y, 8, 45, 0.4, prism.glowColor, 3);
  addText(prism.x, prism.y - 20, 'PRISM ALIGNED', prism.color, 12);
  checkSingularityPens();
  G.uiDirty = true;
  return prism;
}

function rotatePrism(prism) {
  if (!prism || prism.type !== 'photon_prism') return;
  prism.angleIndex = ((prism.angleIndex || 0) + 1) % 4;
  prism.angle = prism.angleIndex * (Math.PI / 2);
  trackPlayerAction();
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
  burst(prism.x, prism.y, 12, prism.color, 60, 0.3, 2, false);
  addRing(prism.x, prism.y, 6, 32, 0.3, prism.glowColor, 2);
  checkSingularityPens();
  G.uiDirty = true;
}

function checkSingularityPens() {
  if (!G || !G.prisms || G.prisms.length < 3) {
    G.singularityPens = [];
    return;
  }
  const maxD = (typeof PHOTON_PRISM_CONFIG !== 'undefined' && PHOTON_PRISM_CONFIG.maxLinkDistance) || 320;
  const pens = [];
  const p = G.prisms;
  for (let i = 0; i < p.length - 2; i++) {
    for (let j = i + 1; j < p.length - 1; j++) {
      for (let k = j + 1; k < p.length; k++) {
        const d1 = Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y);
        const d2 = Math.hypot(p[j].x - p[k].x, p[j].y - p[k].y);
        const d3 = Math.hypot(p[k].x - p[i].x, p[k].y - p[i].y);
        if (d1 <= maxD && d2 <= maxD && d3 <= maxD) {
          pens.push({
            p1: p[i], p2: p[j], p3: p[k],
            prisms: [p[i], p[j], p[k]],
            cx: (p[i].x + p[j].x + p[k].x) / 3,
            cy: (p[i].y + p[j].y + p[k].y) / 3
          });
        }
      }
    }
  }
  G.singularityPens = pens;
  if (pens.length > 0 && typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('fusion');
}

function isPointInTriangle(pt, v1, v2, v3) {
  const d1 = (pt.x - v2.x) * (v1.y - v2.y) - (v1.x - v2.x) * (pt.y - v2.y);
  const d2 = (pt.x - v3.x) * (v2.y - v3.y) - (v2.x - v3.x) * (pt.y - v3.y);
  const d3 = (pt.x - v1.x) * (v3.y - v1.y) - (v3.x - v1.x) * (pt.y - v1.y);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

function updatePrisms(dt) {
  if (!G || !G.prisms || G.prisms.length === 0) return;
  if (G.singularityPens && G.singularityPens.length > 0 && G.enemies) {
    for (const pen of G.singularityPens) {
      for (const e of G.enemies) {
        if (e.dead) continue;
        if (isPointInTriangle(e, pen.p1, pen.p2, pen.p3)) {
          e.slowT = Math.max(e.slowT || 0, 1.0);
          e.slowAmt = Math.max(e.slowAmt || 0, 0.60);
          if (e.armor && e.armor > 0) {
            e.armor = Math.max(0, e.armor - 5 * dt);
          }
          if (Math.random() < 0.08) {
            addFx('tracer', pen.cx, pen.cy, e.x, e.y, 0.1, '#818cf8', 1.5);
          }
        }
      }
    }
  }
}

function updateEnigmaBoss(dt) {
  if (!G || !G.enemies) return;
  const boss = G.enemies.find(e => !e.dead && e.type === 'boss');
  if (!boss) return;

  const sW = typeof W !== 'undefined' ? W : 960;
  G.enigmaTimer = (G.enigmaTimer || 0) + dt;
  if (G.enigmaTimer >= 8.0) {
    G.enigmaTimer = 0;
    const pols = ['thermal', 'cryo', 'conductive'];
    const curIdx = pols.indexOf(G.enigmaPolarity || 'thermal');
    G.enigmaPolarity = pols[(curIdx + 1) % pols.length];
    const polConf = (typeof ENIGMA_BOSS_CONFIG !== 'undefined' && ENIGMA_BOSS_CONFIG[G.enigmaPolarity]) ? ENIGMA_BOSS_CONFIG[G.enigmaPolarity] : { color: '#f97316', name: 'Thermal' };
    shake(6);
    burst(boss.x, boss.y, 30, polConf.color, 140, 0.6, 4, true);
    addRing(boss.x, boss.y, 15, 80, 0.5, polConf.color, 4);
    addText(boss.x, boss.y - 45, 'POLARITY SHIFT: ' + polConf.name.toUpperCase(), polConf.color, 15);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('emp');
    G.uiDirty = true;
  }

  if (boss.hp <= boss.maxHp * 0.30 && !boss.devastatorActive && !boss.devastatorDefeated) {
    boss.devastatorActive = true;
    G.devastatorTimer = 12.0;
    shake(10);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('dreadnought_horn');
    addText(sW / 2, 75, 'CITADEL DEVASTATOR INITIATED! DESTROY CATALYST PYLONS!', '#ef4444', 18);
    G.catalystPylons = [
      { id: 'pylon_1', x: boss.x - 70, y: boss.y - 50, hp: 180, maxHp: 180, color: '#f43f5e' },
      { id: 'pylon_2', x: boss.x + 70, y: boss.y - 50, hp: 180, maxHp: 180, color: '#38bdf8' },
      { id: 'pylon_3', x: boss.x, y: boss.y + 60, hp: 180, maxHp: 180, color: '#fbbf24' }
    ];
  }

  if (boss.devastatorActive && G.devastatorTimer > 0) {
    G.devastatorTimer -= dt;
    const livePylons = (G.catalystPylons || []).filter(p => p.hp > 0);
    if (livePylons.length === 0) {
      boss.devastatorActive = false;
      boss.devastatorDefeated = true;
      G.devastatorTimer = 0;
      boss.stunT = 6.0;
      shake(12);
      burst(boss.x, boss.y, 40, '#34d399', 180, 0.8, 5, true);
      addText(boss.x, boss.y - 45, 'CITADEL DEVASTATOR SEVERED! BOSS STAGGERED!', '#34d399', 16);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('titan_break');
    } else if (G.devastatorTimer <= 0) {
      G.lives = Math.max(1, G.lives - 10);
      shake(15);
      const bX = typeof BASE_PT !== 'undefined' ? BASE_PT.x : 850;
      const bY = typeof BASE_PT !== 'undefined' ? BASE_PT.y : 300;
      burst(bX, bY, 50, '#ef4444', 200, 1.0, 6, true);
      addText(sW / 2, 85, 'CITADEL DEVASTATOR IMPACT! -10 LIVES!', '#ef4444', 20);
      boss.devastatorActive = false;
      boss.devastatorDefeated = true;
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('orbital_impact');
    }
  }
}

function damageCatalystPylon(pylonId, dmg) {
  if (!G || !G.catalystPylons) return;
  const p = G.catalystPylons.find(py => py.id === pylonId);
  if (!p || p.hp <= 0) return;
  p.hp = Math.max(0, p.hp - dmg);
  burst(p.x, p.y, 6, p.color, 60, 0.3, 2, false);
  if (p.hp <= 0) {
    burst(p.x, p.y, 25, p.color, 120, 0.6, 3.5, true);
    addText(p.x, p.y - 20, 'PYLON DESTROYED!', '#34d399', 13);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('shatter');
  }
}

function triggerBulletTime() {
  if (!G || G.state !== 'active') return false;
  if ((G.bulletTimeCd || 0) > 0) {
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
    return false;
  }
  const sW = typeof W !== 'undefined' ? W : 960;
  const sH = typeof H !== 'undefined' ? H : 540;
  G.bulletTimeT = 4.0;
  G.bulletTimeCd = 45.0;
  G.bulletTimePainted = [];
  trackPlayerAction();
  shake(5);
  addRing(sW / 2, sH / 2, 20, 300, 0.6, '#38bdf8', 4);
  addText(sW / 2, 85, 'BULLET-TIME MATRIX ACTIVE [PAINT TARGETS]', '#38bdf8', 18);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('time_rewind');
  G.uiDirty = true;
  return true;
}

function paintBulletTimeTarget(x, y) {
  if (!G || (G.bulletTimeT || 0) <= 0 || !G.enemies) return false;
  let target = null, nearDist = 36;
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dst = Math.hypot(e.x - x, e.y - y);
    if (dst < nearDist) { nearDist = dst; target = e; }
  }
  if (target && !G.bulletTimePainted.includes(target)) {
    G.bulletTimePainted.push(target);
    trackPlayerAction();
    burst(target.x, target.y, 10, '#38bdf8', 70, 0.3, 2.5, false);
    addText(target.x, target.y - 20, 'MARKED [' + G.bulletTimePainted.length + '/5]', '#38bdf8', 12);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');

    if (G.bulletTimePainted.length >= 5) {
      shake(12);
      for (const t of G.bulletTimePainted) {
        if (!t.dead) {
          dealDamage(t, 1500, 'energy', null);
          burst(t.x, t.y, 25, '#38bdf8', 140, 0.5, 4, true);
        }
      }
      const sW = typeof W !== 'undefined' ? W : 960;
      addText(sW / 2, 75, 'ORBITAL EXECUTION CLEAVE! (1500 TRUE DMG)', '#38bdf8', 20);
      if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('orbital_impact');
      G.bulletTimePainted = [];
    }
    return true;
  }
  return false;
}

function triggerRhythmOverclock(tower, timingQuality) {
  if (!tower) return;
  trackPlayerAction();
  if (timingQuality === 'perfect') {
    tower.overclockT = 20;
    tower.heat = 0;
    tower.rhythmSync = true;
    burst(tower.x, tower.y, 30, '#fbbf24', 150, 0.6, 4, true);
    addRing(tower.x, tower.y, 10, 75, 0.5, '#fbbf24', 4);
    addText(tower.x, tower.y - 28, 'PERFECT SYNCHRONIZATION! (+100% SPD / 0 HEAT)', '#fbbf24', 14);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
  } else if (timingQuality === 'miss') {
    tower.stunT = 3.0;
    burst(tower.x, tower.y, 20, '#ef4444', 100, 0.5, 3, false);
    addText(tower.x, tower.y - 25, 'THERMAL BACKFIRE! (STUNNED 3s)', '#ef4444', 13);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('error');
  } else {
    tower.overclockT = 15;
    burst(tower.x, tower.y, 20, '#f59e0b', 120, 0.5, 3.5, false);
    addText(tower.x, tower.y - 25, 'OVERCLOCKED (+50% SPD)', '#f59e0b', 13);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('overcharge');
  }
  G.uiDirty = true;
}

function applyPandoraRelic(relicId) {
  if (!G || typeof PANDORA_RELICS === 'undefined' || !PANDORA_RELICS[relicId]) return false;
  G.pandoraRelics = G.pandoraRelics || {};
  G.pandoraRelics[relicId] = true;
  const r = PANDORA_RELICS[relicId];
  const sW = typeof W !== 'undefined' ? W : 960;
  const sH = typeof H !== 'undefined' ? H : 540;
  burst(sW / 2, sH / 2, 35, r.color, 160, 0.7, 4, true);
  addText(sW / 2, 85, 'PANDORA RELIC BOUND: ' + r.name.toUpperCase(), r.color, 16);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('vault_open');
  G.uiDirty = true;
  return true;
}

function spawnMidasCoin(x, y, goldVal) {
  if (!G) return;
  G.midasCoins = G.midasCoins || [];
  G.midasCoins.push({
    x, y, gold: goldVal || 10,
    life: 3.5, maxLife: 3.5,
    r: 12
  });
}

function collectMidasCoin(coin) {
  if (!G || !coin || !G.midasCoins) return;
  const idx = G.midasCoins.indexOf(coin);
  if (idx !== -1) {
    G.midasCoins.splice(idx, 1);
    G.gold += coin.gold;
    burst(coin.x, coin.y, 10, '#fbbf24', 60, 0.3, 2, false);
    addText(coin.x, coin.y - 15, '+' + coin.gold + 'G', '#fbbf24', 12);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('coin');
    G.uiDirty = true;
  }
}

function updateMidasCoins(dt) {
  if (!G || !G.midasCoins || G.midasCoins.length === 0) return;
  for (let i = G.midasCoins.length - 1; i >= 0; i--) {
    const c = G.midasCoins[i];
    c.life -= dt;
    if (c.life <= 0) {
      G.midasCoins.splice(i, 1);
      burst(c.x, c.y, 10, '#94a3b8', 50, 0.3, 2, false);
      addText(c.x, c.y - 12, 'COIN EXPIRED', '#94a3b8', 10);
    }
  }
}

/* ============================================================
   BASTION TD 11.0: THE INFINITE CHRONICLES - SYSTEMS ENGINE
   ============================================================ */

function generateChimeraDraft() {
  const pKeys = (typeof CHIMERA_PREFIXES !== 'undefined') ? Object.keys(CHIMERA_PREFIXES) : ['glacial', 'thermobaric', 'singularity'];
  const sKeys = (typeof CHIMERA_SUFFIXES !== 'undefined') ? Object.keys(CHIMERA_SUFFIXES) : ['of_ricochet', 'of_execution', 'of_fission'];
  const choices = [];
  for (let i = 0; i < 3; i++) {
    const pKey = pKeys[(Math.floor(Math.random() * pKeys.length) + i) % pKeys.length];
    const sKey = sKeys[(Math.floor(Math.random() * sKeys.length) + i) % sKeys.length];
    choices.push({
      id: 'draft_' + i + '_' + pKey + '_' + sKey,
      prefix: CHIMERA_PREFIXES[pKey] || { id: pKey, name: pKey, color: '#38bdf8' },
      suffix: CHIMERA_SUFFIXES[sKey] || { id: sKey, name: sKey, color: '#fbbf24' }
    });
  }
  return choices;
}

function applyChimeraAffix(tower, prefixId, suffixId) {
  if (!tower) return false;
  tower.chimeraPrefix = prefixId;
  tower.chimeraSuffix = suffixId;
  const p = (typeof CHIMERA_PREFIXES !== 'undefined' && CHIMERA_PREFIXES[prefixId]) || { name: prefixId, color: '#38bdf8' };
  const s = (typeof CHIMERA_SUFFIXES !== 'undefined' && CHIMERA_SUFFIXES[suffixId]) || { name: suffixId, color: '#fbbf24' };
  const baseName = (TD[tower.type] && TD[tower.type].name) || 'Tower';
  tower.chimeraName = p.name + ' ' + baseName + ' ' + s.name;
  burst(tower.x, tower.y, 25, p.color, 120, 0.5, 3.5, true);
  addRing(tower.x, tower.y, 10, 60, 0.45, s.color, 4);
  addText(tower.x, tower.y - 28, 'CHIMERA INFUSION: ' + tower.chimeraName.toUpperCase(), p.color, 14);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
  G.uiDirty = true;
  return true;
}

function applyRuleBendingRelic(relicId) {
  if (!G || typeof RULE_BENDING_RELICS === 'undefined' || !RULE_BENDING_RELICS[relicId]) return false;
  G.ruleRelics = G.ruleRelics || {};
  G.ruleRelics[relicId] = true;
  const r = RULE_BENDING_RELICS[relicId];
  const sW = typeof W !== 'undefined' ? W : 960;
  burst(sW / 2, 90, 30, r.color, 150, 0.6, 4, true);
  addText(sW / 2, 85, '★ PRISMATIC RELIC BOUND: ' + r.name.toUpperCase() + ' ★', r.color, 16);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('vault_open');
  G.uiDirty = true;
  return true;
}

function evolveNemesisGenome() {
  if (!G || !G.damageTrack || typeof NEMESIS_GENOME_TRAITS === 'undefined') return;
  const dtTrack = G.damageTrack;
  const phys = dtTrack.phys || 0;
  const cryo = dtTrack.cryo || 0;
  const energy = (dtTrack.energy || 0) + (dtTrack.plasma || 0);
  const total = phys + cryo + energy;
  if (total < 100) return;

  let selected = 'kinetic_dissipation';
  if (cryo / total >= 0.40) {
    selected = 'cryo_metabolic';
  } else if (energy / total >= 0.50) {
    selected = 'resonance_stealth';
  } else if (phys / total >= 0.55) {
    selected = 'kinetic_dissipation';
  } else {
    selected = 'swarm_fission';
  }

  G.nemesisGenome = selected;
  const trait = NEMESIS_GENOME_TRAITS[selected];
  const sW = typeof W !== 'undefined' ? W : 960;
  shake(8);
  burst(sW / 2, 95, 25, trait.color, 140, 0.6, 3.5, true);
  addText(sW / 2, 90, '★ NEMESIS HIVE ADAPTED: ' + trait.name.toUpperCase() + ' ★', trait.color, 16);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('alpha_roar');
  G.uiDirty = true;
}

function triggerDynamicPathMorph(type) {
  if (!G || G.dynamicPathMorphed) return false;
  G.dynamicPathMorphed = true;
  const morphType = type || 'bio_excavation';
  const sW = typeof W !== 'undefined' ? W : 960;
  const sH = typeof H !== 'undefined' ? H : 540;
  shake(12);

  if (morphType === 'bio_excavation') {
    if (G.destructibleCrags && G.destructibleCrags.length > 0) {
      const crag = G.destructibleCrags[0];
      crag.collapsed = true;
      if (typeof triggerRockslide === 'function') triggerRockslide(crag);
    }
    burst(sW / 2, sH / 2, 35, '#84cc16', 180, 0.7, 4, true);
    addText(sW / 2, 85, '⚠️ SECTOR ENTROPY: BIO-EXCAVATION CREATED NEW DETOUR!', '#84cc16', 16);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('rockslide');
  } else {
    burst(sW / 2, sH / 2, 35, '#f97316', 180, 0.7, 4, true);
    addText(sW / 2, 85, '⚠️ TECTONIC SUBDUCTION: ROAD MELTED INTO LAVA!', '#f97316', 16);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('soil_burn');
  }
  G.uiDirty = true;
  return true;
}

function triggerChaosIncursion(incursionId) {
  if (!G || G.chaosIncursion || typeof CHAOS_INCURSIONS === 'undefined') return false;
  const inc = CHAOS_INCURSIONS[incursionId] || CHAOS_INCURSIONS.smuggler_heist;
  G.chaosIncursion = inc.id;
  G.chaosTimer = inc.duration || 15.0;
  const sW = typeof W !== 'undefined' ? W : 960;
  shake(10);
  burst(sW / 2, 80, 30, inc.color, 160, 0.7, 4, true);
  addText(sW / 2, 80, '⚡ CHAOS INCURSION DETECTED: ' + inc.name.toUpperCase(), inc.color, 16);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('syndicate_drop');
  G.uiDirty = true;
  return true;
}

function resolveChaosIncursion(success) {
  if (!G || !G.chaosIncursion || typeof CHAOS_INCURSIONS === 'undefined') return;
  const inc = CHAOS_INCURSIONS[G.chaosIncursion];
  const sW = typeof W !== 'undefined' ? W : 960;
  if (success && inc) {
    if (inc.rewardGold) G.gold = (G.gold || 0) + inc.rewardGold;
    if (inc.rewardCores && typeof addCores === 'function') addCores(inc.rewardCores);
    burst(sW / 2, 90, 30, '#fbbf24', 160, 0.6, 4, true);
    addText(sW / 2, 90, '★ INCURSION NEUTRALIZED! +' + (inc.rewardGold || 150) + 'G REWARD! ★', '#fbbf24', 16);
    if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('victory');
  } else {
    addText(sW / 2, 90, 'INCURSION TIMED OUT / ESCAPED', '#94a3b8', 14);
  }
  G.chaosIncursion = null;
  G.chaosTimer = 0;
  G.uiDirty = true;
}

function toggleQuantumHeatModifier(modId) {
  if (!G || typeof QUANTUM_HEAT_MODIFIERS === 'undefined' || !QUANTUM_HEAT_MODIFIERS[modId]) return;
  G.activeHeatModifiers = G.activeHeatModifiers || [];
  const idx = G.activeHeatModifiers.indexOf(modId);
  if (idx !== -1) {
    G.activeHeatModifiers.splice(idx, 1);
  } else {
    G.activeHeatModifiers.push(modId);
  }
  G.currentHeat = G.activeHeatModifiers.reduce((acc, k) => acc + (QUANTUM_HEAT_MODIFIERS[k].heat || 0), 0);
  G.uiDirty = true;
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click');
}

function startExpeditionNode(nodeId) {
  if (!G || !G.expedition || !G.expedition.nodes) return false;
  const node = G.expedition.nodes.find(n => n.id === nodeId);
  if (!node || (!node.active && !node.cleared)) return false;
  G.expedition.currentNodeId = nodeId;
  G.expedition.history = G.expedition.history || [];
  G.expedition.history.push(nodeId);

  // Load sector corresponding to this node
  if (node.sectorId && typeof loadSector === 'function') {
    loadSector(node.sectorId);
  }

  // Node specific setup
  if (node.type === 'elite') {
    G.activeGambit = 'meltdown';
  } else if (node.type === 'rest_depot') {
    if (G.megastructures) {
      for (const ms of G.megastructures) {
        ms.durability = ms.maxDurability || 3;
        ms.isBroken = false;
        ms.active = true;
      }
    }
    G.lives = Math.min(25, (G.lives || 20) + 5);
  }

  G.uiDirty = true;
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('upgrade');
  return true;
}

function completeExpeditionNode() {
  if (!G || !G.expedition || !G.expedition.currentNodeId) return;
  const node = G.expedition.nodes.find(n => n.id === G.expedition.currentNodeId);
  if (node) {
    node.cleared = true;
    node.active = false;
    if (node.connections) {
      for (const nextId of node.connections) {
        const nextNode = G.expedition.nodes.find(n => n.id === nextId);
        if (nextNode) nextNode.active = true;
      }
    }
  }
  G.chimeraDraft = generateChimeraDraft();
  G.uiDirty = true;
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('victory');
}

function updateInfiniteChronicles(dt) {
  if (!G || G.state !== 'active') return;
  if (G.chaosTimer > 0) {
    G.chaosTimer -= dt;
    if (G.chaosTimer <= 0) {
      resolveChaosIncursion(false);
    }
  }
}
