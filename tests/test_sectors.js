// Unit test for Bastion TD Multi-Sector Expansion (7 Distinct Environments)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});
const store = {};
Object.assign(globalThis, {
  window: globalThis,
  document: {
    documentElement: P,
    getElementById: () => P,
    createElement: () => P,
    addEventListener() { },
    querySelectorAll: () => [],
    querySelector: () => P,
    hidden: false
  },
  localStorage: {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; }
  },
  requestAnimationFrame: () => 1,
  addEventListener() { },
  devicePixelRatio: 1,
  innerWidth: 1400,
  setTimeout: () => 0
});

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const nb = window.__nb;
if (!nb) throw new Error('window.__nb hook not found!');

console.log('Testing Bastion TD Multi-Sector Expedition System...\n');

/* ============================================================
   STAGE 1: SECTOR CATALOG & TOPOLOGY VERIFICATION
   ============================================================ */
console.log('--- Testing Stage 1: Sector Catalog & Data Integrity ---');
{
  const sectors = Object.keys(nb.MAP_SECTORS);
  if (sectors.length !== 7) throw new Error(`Expected 7 map sectors, found ${sectors.length}`);

  const expectedSectors = ['foundry', 'abyss', 'quarantine', 'skyspire', 'dunes', 'metropolis', 'abyssal'];
  for (const sId of expectedSectors) {
    const s = nb.MAP_SECTORS[sId];
    if (!s) throw new Error(`Missing sector definition: ${sId}`);
    if (!s.name || !s.num || !s.wp0 || s.wp0.length < 2) {
      throw new Error(`Sector ${sId} invalid configuration`);
    }
    if (!s.leylines || Object.keys(s.leylines).length === 0) {
      throw new Error(`Sector ${sId} must define leylines`);
    }
    if (!s.hazards || s.hazards.length === 0) {
      throw new Error(`Sector ${sId} must define hazards`);
    }
  }
  console.log('✔ All 7 sectors defined with required waypoints, leylines, and hazards');
}

/* ============================================================
   STAGE 2: DYNAMIC SECTOR LOADING & PATH RECOMPUTATION
   ============================================================ */
console.log('--- Testing Stage 2: Dynamic Sector Loading & Geometry ---');
{
  for (const sId of ['foundry', 'abyss', 'quarantine', 'skyspire', 'dunes', 'metropolis', 'abyssal']) {
    nb.setSector(sId);
    if (nb.G.sector !== sId) throw new Error(`Active sector mismatch: expected ${sId}, got ${nb.G.sector}`);
    
    // Check that path lengths are strictly positive
    const plen = vm.runInThisContext('PLEN');
    if (!plen || plen <= 0) throw new Error(`Sector ${sId} has invalid PLEN: ${plen}`);

    // Verify leylines do not collide with path tiles
    const pathTile = vm.runInThisContext('pathTile');
    const leylines = vm.runInThisContext('LEYLINE_NODES');
    for (const k in leylines) {
      const node = leylines[k];
      if (pathTile[node.r] && pathTile[node.r][node.c]) {
        throw new Error(`Sector ${sId} has leyline ${k} overlapping path tile at [${node.c}, ${node.r}]`);
      }
    }

    // Verify hazards do not collide with path tiles
    const sObj = nb.MAP_SECTORS[sId];
    for (const h of sObj.hazards) {
      if (pathTile[h.row] && pathTile[h.row][h.c]) {
        throw new Error(`Sector ${sId} has hazard ${h.type} overlapping path tile at [${h.c}, ${h.row}]`);
      }
    }
  }
  console.log('✔ All 7 sectors load cleanly; path geometry and collision masks validated');
}

/* ============================================================
   STAGE 3: DUAL-FRONT CONVERGENCE & MULTI-PATH SPAWNING
   ============================================================ */
console.log('--- Testing Stage 3: Dual-Front Spawning (Abyss Sector 02) ---');
{
  nb.setSector('abyss');
  nb.begin();
  nb.G.state = 'active';

  // In Abyss, secondary route wpBreach is defined and spawns alternate between path 0 and path 1
  const spawns = nb.buildSpawns(1);
  const path0Count = spawns.filter(s => s.pathId === 0).length;
  const path1Count = spawns.filter(s => s.pathId === 1).length;

  if (path0Count === 0 || path1Count === 0) {
    throw new Error(`Abyss sector should distribute spawns across both fronts. Got path0: ${path0Count}, path1: ${path1Count}`);
  }

  // Verify coordinates along path 0 and path 1
  const pos0 = vm.runInThisContext('posAt(0, 0, 0)');
  const pos1 = vm.runInThisContext('posAt(0, 0, 1)');
  
  // Path 0 enters from West (x < 100), Path 1 enters from North (y < 100)
  if (pos0.x > 100) throw new Error(`Abyss path 0 should spawn from west gate, got x=${pos0.x}`);
  if (pos1.y > 100) throw new Error(`Abyss path 1 should spawn from north gate, got y=${pos1.y}`);

  console.log(`✔ Dual-front routes validated: West Gate (${path0Count} hostiles) & North Gate (${path1Count} hostiles)`);
}

/* ============================================================
   STAGE 4: INTERACTIVE HAZARDS DETONATION (ALL 7 TYPES)
   ============================================================ */
console.log('--- Testing Stage 4: Interactive Hazard Detonation ---');
{
  const hazardTypes = [
    { sec: 'foundry', type: 'fuel_cell', check: (e) => e.hp < 1000 && e.shred > 0 },
    { sec: 'abyss', type: 'cryo_tank', check: (e) => e.freezeT >= 3.5 && e.brittleT > 0 },
    { sec: 'quarantine', type: 'spore_pod', check: (e) => e.reversed >= 2.0 },
    { sec: 'skyspire', type: 'tesla_pylon', check: (e) => e.shield <= 0 && e.stunT > 0 },
    { sec: 'dunes', type: 'sun_monolith', check: (e) => e.thermiteT > 0 },
    { sec: 'metropolis', type: 'emp_terminal', check: (e) => e.stunT >= 3.0 && e.shield <= 0 },
    { sec: 'abyssal', type: 'hydro_geyser', check: (e) => e.stunT >= 1.5 }
  ];

  for (const hInfo of hazardTypes) {
    nb.setSector(hInfo.sec);
    nb.begin();
    nb.G.state = 'active';

    if (!nb.G.fuelCells || nb.G.fuelCells.length === 0) {
      throw new Error(`Sector ${hInfo.sec} has no interactive hazards placed`);
    }

    const cell = nb.G.fuelCells[0];
    if (cell.type !== hInfo.type) {
      throw new Error(`Sector ${hInfo.sec} expected hazard type ${hInfo.type}, found ${cell.type}`);
    }

    // Place an enemy right next to the hazard
    const testEnemy = {
      id: 9999,
      type: 'scout',
      r: 14,
      x: cell.x + 20,
      y: cell.y + 20,
      hp: 1000,
      maxHp: 1000,
      shield: 200,
      armor: 50,
      shred: 0,
      baseSpeed: 50,
      dist: 100,
      burnT: 0,
      shredT: 0,
      freezeT: 0,
      brittleT: 0,
      stunT: 0,
      reversed: 0,
      thermiteT: 0
    };
    nb.G.enemies.push(testEnemy);

    // Detonate hazard
    nb.detonateFuelCell(cell);

    if (!cell.dead) throw new Error(`Hazard ${cell.type} should be marked dead`);
    if (!hInfo.check(testEnemy)) {
      throw new Error(`Hazard ${cell.type} effect failed on hostile: ${JSON.stringify(testEnemy)}`);
    }
  }
  console.log('✔ All 7 sector hazard types detonated and debuffs applied successfully');
}

/* ============================================================
   STAGE 5: SECTOR CLIMATE PASSIVES
   ============================================================ */
console.log('--- Testing Stage 5: Sector Climate Passives ---');
{
  // 1. Neon Metropolis: +15 MW Grid Capacity
  nb.setSector('metropolis');
  nb.begin();
  nb.G.state = 'active';
  const metroGrid = nb.getGridPowerStatus();
  if (metroGrid.capacity !== 75) {
    throw new Error(`Neon Metropolis should provide 75 MW grid capacity (60 + 15), got ${metroGrid.capacity}`);
  }
  console.log('✔ Metropolis climate: Overclocked Grid (+15 MW capacity) verified');

  // 2. Abyssal Trench: Water conductivity grants +2 chain lightning bounce targets
  nb.setSector('abyssal');
  nb.begin();
  nb.G.state = 'active';
  nb.G.gold = 99999;
  const teslaTower = nb.placeTower(0, 0, 'tesla');
  // Tesla base chains = 2, with abyssal sector should target up to 4
  const chainTargets = [];
  for (let i = 0; i < 5; i++) {
    nb.G.enemies.push({
      id: 8000 + i,
      x: teslaTower.x + 30 + i * 20,
      y: teslaTower.y + 10,
      hp: 500,
      maxHp: 500,
      dist: 50 + i * 20
    });
  }
  // Trigger tesla firing
  const fireTeslaFn = vm.runInThisContext('fireTesla');
  if (typeof fireTeslaFn === 'function') {
    const st = nb.getTierData(teslaTower);
    fireTeslaFn(teslaTower, st, nb.G.enemies[0]);
    const hitEnemies = nb.G.enemies.filter(e => e.hp < 500);
    // Base Tier 1 Tesla has targets = 2. With Abyssal water conductivity bonus (+2), it hits 4 enemies!
    if (hitEnemies.length !== 4) throw new Error(`Abyssal Trench tesla chain lightning expected 4 targets (2 base + 2 bonus), got ${hitEnemies.length}`);
  }
  console.log('✔ Abyssal Trench climate: Hydro-Conductivity (+2 chain lightning targets) verified');

  // 3. Glacial Abyss: Brittle damage bonus (+50%)
  nb.setSector('abyss');
  nb.begin();
  nb.G.state = 'active';
  const enemyAbyss = { id: 7001, x: 100, y: 100, hp: 1000, maxHp: 1000, brittle: 0.35, brittleT: 5.0, armor: 0 };
  const dealDmgFn = vm.runInThisContext('dealDamage');
  dealDmgFn(enemyAbyss, 100, 'energy', null, {});
  // Normal brittle is 1.35x. In Abyss it should be 1.35 * 1.5 = 2.025x damage (approx ~202.5 dmg)
  const dmgDealt = 1000 - enemyAbyss.hp;
  if (dmgDealt < 200) {
    throw new Error(`Glacial Abyss brittle amplifier expected >= 200 damage, dealt ${dmgDealt}`);
  }
  console.log(`✔ Glacial Abyss climate: Frozen Slipstream (+50% brittle damage: ${dmgDealt.toFixed(1)} dmg dealt) verified`);

  // 4. Sunken Dunes: Range penalty (-10%) unless on Sensor Leyline
  nb.setSector('dunes');
  nb.begin();
  nb.G.state = 'active';
  const towerDunes = nb.placeTower(0, 0, 'gatling');
  towerDunes.angle = 0;
  towerDunes.cd = 0;
  const updateTowerFn = vm.runInThisContext('updateTower');
  // Gatling base range is 2.8 TILE = 168px (TILE=60). With 10% penalty in Dunes, effective range is 151.2px.
  // Place enemy at distance 160px (x = towerDunes.x + 160)
  const duneEnemy = { id: 6001, x: towerDunes.x + 160, y: towerDunes.y, r: 0, d: 100, hp: 500, maxHp: 500, dead: false, armor: 0, shred: 0 };
  nb.G.enemies.push(duneEnemy);
  updateTowerFn(towerDunes, 0.1);
  // In Dunes (151.2px range), enemy at 160px is out of range and NOT hit
  if (duneEnemy.hp !== 500) {
    throw new Error('Dunes dust storm should have prevented tower from hitting enemy outside 90% range');
  }

  // Now switch back to Foundry (168px range)
  nb.setSector('foundry');
  nb.begin();
  nb.G.state = 'active';
  const towerFoundry = nb.placeTower(0, 0, 'gatling');
  towerFoundry.angle = 0;
  towerFoundry.cd = 0;
  const foundryEnemy = { id: 6002, x: towerFoundry.x + 160, y: towerFoundry.y, r: 0, d: 100, hp: 500, maxHp: 500, dead: false, armor: 0, shred: 0 };
  nb.G.enemies.push(foundryEnemy);
  updateTowerFn(towerFoundry, 0.1);
  // In Foundry (168px range), enemy at 160px IS inside range and hit!
  if (foundryEnemy.hp >= 500) {
    throw new Error('In Foundry normal sector, enemy at 160px should be inside 168px range and hit');
  }
  console.log('✔ Sunken Dunes climate: Sandstorm Drift (-10% range penalty) verified');
}

/* ============================================================
   STAGE 6: 3-STAR MASTERY PROGRESSION & CORE BOUNTIES
   ============================================================ */
console.log('--- Testing Stage 6: Sector Mastery & Unlocking ---');
{
  nb.SAVE.cores = 0;
  nb.SAVE.sectorMastery = {};

  // Check initial sector unlocked: foundry should be unlocked, abyss locked initially
  if (!nb.isSectorUnlocked('foundry')) throw new Error('Foundry must be unlocked initially');
  if (nb.isSectorUnlocked('abyss')) throw new Error('Abyss should be locked before clearing Wave 10 on Foundry');

  // Clear Foundry Wave 20 with 25 lives and Ascension 0
  const result1 = nb.recordSectorProgress('foundry', 20, true, 25, 0);
  if (!result1.m.stars[0]) throw new Error('Star 1 (wave 20 clear) should be awarded');
  if (!result1.m.stars[1]) throw new Error('Star 2 (flawless defense) should be awarded');
  if (result1.m.stars[2]) throw new Error('Star 3 should NOT be awarded on Ascension 0');
  
  // Cores earned: 25 for Star 1 + 35 for Star 2 = 60 cores
  if (result1.coresEarned !== 60) {
    throw new Error(`Expected 60 Cores bounty, got ${result1.coresEarned}`);
  }
  if (nb.SAVE.cores !== 60) {
    throw new Error(`SAVE.cores expected 60, got ${nb.SAVE.cores}`);
  }

  // Now Abyss should be unlocked!
  if (!nb.isSectorUnlocked('abyss')) {
    throw new Error('Abyss should now be unlocked after Foundry wave 20 clear');
  }

  // Clear Abyss on Ascension 2 with 8 lives (less than 12 maxLives) to get Star 1 and Star 3
  const result2 = nb.recordSectorProgress('abyss', 20, true, 8, 2);
  if (!result2.m.stars[0]) throw new Error('Star 1 should be awarded for Abyss clear');
  if (result2.m.stars[1]) throw new Error('Star 2 should NOT be awarded with 8 lives (below 12 maxLives)');
  if (!result2.m.stars[2]) throw new Error('Star 3 should be awarded on Ascension 2 clear');
  // 25 cores (Star 1) + 50 cores (Star 3) = 75 cores
  if (result2.coresEarned !== 75) {
    throw new Error(`Expected 75 Cores bounty, got ${result2.coresEarned}`);
  }

  // Verify mastery persistence in SAVE
  const foundryMastery = nb.getSectorMastery('foundry');
  if (!foundryMastery.stars[0] || !foundryMastery.stars[1] || foundryMastery.stars[2]) {
    throw new Error(`Foundry mastery stars incorrect: ${JSON.stringify(foundryMastery)}`);
  }

  const abyssMastery = nb.getSectorMastery('abyss');
  if (!abyssMastery.stars[0] || abyssMastery.stars[1] || !abyssMastery.stars[2]) {
    throw new Error(`Abyss mastery stars incorrect: ${JSON.stringify(abyssMastery)}`);
  }

  console.log('✔ 3-Star Sector Mastery, bounties (+135 total Cores), and sequential sector unlocking verified');
}

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD MULTI-SECTOR TESTS PASSED WITH 100% SUCCESS!');
console.log('============================================================\n');
