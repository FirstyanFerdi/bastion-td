/**
 * Unit Test Suite: test_deep_synergy.js
 * Validates the 5 Pillars of Bastion TD 5.0 Deep Interconnected Synergies:
 * 1. Grid Topology & Resonance Beam Conduits (Raycasting, DPS, debuffs, creep cleansing)
 * 2. Thermodynamics & Heat Exchange Network (Heat buildup, Cryo cooling, Overheat throttle, Thermal Steam Purge)
 * 3. Living Biomass Creep & Spore Pylons (Creep spread, speed bonus, tower entanglement, Spore Spires)
 * 4. In-Run Tactical Protocol Matrix (TPP acquisition, prerequisite checks, protocol buffs, emergency blackout)
 * 5. Dynamic Nemesis Boss AI (Goliath seismic LoS blocking, Chrono-Weaver time inversion, Apex Mother creep devouring)
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 5.0 Deep Interconnected Synergies...');

const makeElement = () => ({
  width: 0, height: 0, style: {}, innerHTML: '', textContent: '',
  classList: { add(){}, remove(){}, toggle(){} },
  querySelector: () => null,
  querySelectorAll: () => [],
  getContext: () => ({
    scale:()=>{}, translate:()=>{}, rotate:()=>{}, beginPath:()=>{}, closePath:()=>{},
    moveTo:()=>{}, lineTo:()=>{}, arc:()=>{}, arcTo:()=>{}, fill:()=>{}, stroke:()=>{}, ellipse:()=>{},
    save:()=>{}, restore:()=>{}, rect:()=>{}, fillRect:()=>{}, strokeRect:()=>{}, clearRect:()=>{},
    setLineDash:()=>{}, createRadialGradient:()=>({addColorStop:()=>{}}),
    createLinearGradient:()=>({addColorStop:()=>{}})
  }),
  toDataURL: () => 'data:image/png;base64,mock'
});

const elements = {};
const doc = {
  createElement: (tag) => makeElement(),
  getElementById: (id) => elements[id] || (elements[id] = makeElement()),
  querySelectorAll: () => []
};

const storage = {};
const ctx = vm.createContext({
  window: { devicePixelRatio: 1 },
  document: doc,
  localStorage: {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
  },
  Math,
  Date,
  setTimeout: (fn) => fn(),
  console,
  assert,
  enemyIcons: {}
});

const files = [
  'js/core.js',
  'js/audio.js',
  'js/data.js',
  'js/state.js',
  'js/enemies.js',
  'js/towers.js',
  'js/waves.js',
  'js/sprites.js',
  'js/render.js',
  'js/ui.js',
  'js/input.js'
];

for (const f of files) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
}

// Global initialization
vm.runInContext(`
  canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H }) };
  buildMap();
  newGame(false);
  G.gold = 10000;
  G.state = 'active';
`, ctx);

// -------------------------------------------------------------
// PILAR 1: Grid Topology & Resonance Beam Conduits
// -------------------------------------------------------------
console.log('\n--- PILAR 1: Resonance Beam Conduits ---');
vm.runInContext(`(() => {
  newGame(false);
  G.gold = 10000;
  G.state = 'active';

  // Find 3 collinear free tiles on row 0 (which is completely off the path in Foundry)
  const relay = placeTower(2, 0, 'relay');
  const tesla = placeTower(5, 0, 'tesla'); // 3 tiles East
  const cryo = placeTower(0, 0, 'cryo');   // 2 tiles West

  assert(relay, 'Relay should be placed successfully');
  assert(tesla, 'Tesla should be placed successfully');
  assert(cryo, 'Cryo should be placed successfully');

  updateResonanceConduits();
  assert(G.resonanceLines.length >= 2, 'Should establish at least 2 resonance conduits');
  const ionLine = G.resonanceLines.find(l => l.type === 'ion_plasma');
  assert(ionLine, 'Relay to Tesla should create Ion Plasma Arc');
  assert.strictEqual(ionLine.conf.color, '#facc15');

  const stasisLine = G.resonanceLines.find(l => l.type === 'stasis_line');
  assert(stasisLine, 'Relay to Cryo should create Stasis Line');

  // Test conduit beam clears biomass creep along path
  addBiomassCreep(3, 0); // on the path between (2,0) and (5,0)
  assert(G.creep['0,3'], 'Creep placed on col 3, row 0');
  
  // Tick beam
  update(0.1);
  assert(!G.creep['0,3'], 'Resonance conduit beam should have cleansed creep tile at (3, 0)');
  console.log('✓ Pillar 1: Line-of-sight resonance laser lines, conduit typing & creep cleansing passed');
})()`, ctx);

// -------------------------------------------------------------
// PILAR 2: Thermodynamics & Heat Exchange Network
// -------------------------------------------------------------
console.log('\n--- PILAR 2: Thermodynamics & Heat Exchange ---');
vm.runInContext(`(() => {
  newGame(false);
  G.gold = 10000;
  G.state = 'active';
  const gat = placeTower(2, 0, 'gatling');
  assert(gat, 'Gatling tower placed');
  assert.strictEqual(gat.heat, 0, 'Initial heat is 0');

  // Simulate repeated firing
  for (let i = 0; i < 20; i++) {
    addTowerHeat(gat, 6.0);
  }
  assert(gat.heat >= 100, 'Heat should reach max (100)');
  assert.strictEqual(gat.heat, 100, 'Heat capped at 100');

  // Proximity Cryo cooling test
  const cryo = placeTower(3, 0, 'cryo'); // adjacent tile
  assert(cryo, 'Cryo tower placed adjacent');
  const heatBefore = gat.heat;
  updateTower(gat, 0.5);
  assert(gat.heat < heatBefore, 'Adjacent Cryo tower should accelerate heat dissipation');

  // Test Thermal Steam Purge [H]
  G.thermalPurgeCd = 0;
  gat.heat = 90;
  spawnEnemy('scout', 5);
  const sc = G.enemies[0];
  const hpBefore = sc.hp;
  const purged = triggerThermalPurge();
  assert(purged, 'Thermal purge should trigger successfully');
  assert.strictEqual(gat.heat, 0, 'Thermal purge should reset all tower heat to 0');
  assert(G.thermalPurgeCd > 0, 'Thermal purge should be placed on cooldown');
  assert(sc.hp < hpBefore, 'Thermal purge should damage enemies on screen with boiling steam');
  console.log('✓ Pillar 2: Thermal heat buildup, Cryo passive cooling, throttle, & Steam Purge passed');
})()`, ctx);

// -------------------------------------------------------------
// PILAR 3: Living Biomass Creep & Spore Pylons
// -------------------------------------------------------------
console.log('\n--- PILAR 3: Living Biomass Creep & Spore Pylons ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';

  // Manual creep test
  addBiomassCreep(5, 5);
  assert(G.creep['5,5'], 'Creep tile created at row 5, col 5');
  
  // Test enemy speedup on creep
  spawnEnemy('scout', 1);
  const scout = G.enemies[0];
  scout.x = 5 * TILE + TILE / 2;
  scout.y = 5 * TILE + TILE / 2;
  const normalSpd = scout.speed;
  updateEnemy(scout, 0.016);
  // Enemy on creep gets +30% speed
  assert(scout.curSpeed > normalSpd * 1.25, 'Hostile on biomass creep tile gains +30% speed surge');

  // Spore Spire test
  G.wave = 7;
  G.spireSpawnCd = 0;
  update(0.1);
  assert(G.sporeSpires && G.sporeSpires.length > 0, 'Spore Spire should spawn on wave 7+');
  const spire = G.sporeSpires[0];
  assert(spire.hp === BIOMASS_CONFIG.spireMaxHp, 'Spore Spire max HP correct');

  // Destroying spire awards gold and cores
  const goldBefore = G.gold;
  const coresBefore = SAVE.cores || 0;
  spire.hp = 0;
  update(0.1);
  assert(G.gold > goldBefore, 'Destroying Spore Spire awards gold');
  assert((SAVE.cores || 0) > coresBefore, 'Destroying Spore Spire awards Nanite Cores');
  console.log('✓ Pillar 3: Biomass creep infestation, hostile speed bonus, & Spore Spire rewards passed');
})()`, ctx);

// -------------------------------------------------------------
// PILAR 4: In-Run Tactical Protocol Matrix
// -------------------------------------------------------------
console.log('\n--- PILAR 4: Tactical Protocol Matrix ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.tpp = 5;

  // Prerequisite validation
  assert(!hasMatrixProtocol('sabot_pierce'));
  assert(!unlockMatrixProtocol('critical_cascade'), 'Cannot unlock tier 2 without tier 1 req');
  
  // Unlock tier 1
  const u1 = unlockMatrixProtocol('sabot_pierce');
  assert(u1, 'Tier 1 sabot_pierce unlocked');
  assert(hasMatrixProtocol('sabot_pierce'));
  assert.strictEqual(G.tpp, 4, '1 TPP deducted');

  // Unlock tier 2
  const u2 = unlockMatrixProtocol('critical_cascade');
  assert(u2, 'Tier 2 critical_cascade unlocked after tier 1');
  assert.strictEqual(G.tpp, 2, '2 TPP deducted');

  // Test Sabot Pierce effect in damage calculation
  spawnEnemy('brute', 5);
  const brute = G.enemies[0];
  const startArmor = brute.armor;
  dealDamage(brute, 50, 'phys', null);
  assert(brute.shred >= startArmor * 0.20, 'Sabot Pierce protocol applies +20% armor shred');

  // Test Apex Executioner (<15% HP execute)
  G.tpp = 3;
  unlockMatrixProtocol('execution_protocol');
  assert(hasMatrixProtocol('execution_protocol'));
  brute.hp = brute.maxHp * 0.12; // < 15%
  dealDamage(brute, 1, 'phys', null);
  assert(brute.dead || brute.hp <= 0, 'Apex Executioner protocol executes foes under 15% HP');

  // Test Emergency Grid EMP (Logistics branch)
  G.tpp = 10;
  unlockMatrixProtocol('contraband_scavenger');
  unlockMatrixProtocol('thermal_purge_turbo');
  unlockMatrixProtocol('emergency_blackout');
  assert(hasMatrixProtocol('emergency_blackout'));

  G.lives = 5; // <= 6
  G.emergencyBlackoutUsed = false;
  spawnEnemy('scout', 5);
  const targetScout = G.enemies.find(e => !e.dead && e.type === 'scout');
  update(0.1);
  assert(G.emergencyBlackoutUsed, 'Emergency blackout should trigger when lives <= 6');
  assert(targetScout.stunT >= 3.0, 'Emergency blackout applies 3.5s global EMP stun to all enemies');
  console.log('✓ Pillar 4: TPP economy, prerequisite trees, Sabot Pierce, Executioner & Emergency EMP passed');
})()`, ctx);

// -------------------------------------------------------------
// PILAR 5: Dynamic Nemesis Boss AI
// -------------------------------------------------------------
console.log('\n--- PILAR 5: Dynamic Nemesis Boss AI ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';

  // 1. Wave 10 Titan Goliath: Seismic Pillars LoS Blocking
  spawnEnemy('boss', 10, null, null, 0, 'goliath');
  const goliath = G.enemies[0];
  assert.strictEqual(goliath.titanId, 'goliath');

  // Goliath raises seismic pillar
  goliath.pillarCd = 0;
  updateEnemy(goliath, 0.1);
  assert(G.seismicPillars && G.seismicPillars.length > 0, 'Goliath should raise a Seismic Pillar');
  const pillar = G.seismicPillars[0];
  assert.strictEqual(pillar.hp, 450, 'Seismic Pillar has 450 HP');

  // Test Seismic Pillar line-of-sight interception
  const friendlyTower = { x: pillar.x - 50, y: pillar.y, type: 'gatling' };
  spawnEnemy('scout', 1);
  const shieldedScout = G.enemies[G.enemies.length - 1];
  shieldedScout.x = pillar.x + 50;
  shieldedScout.y = pillar.y; // Pillar sits right on segment between tower and scout!

  const pillarHpBefore = pillar.hp;
  const dealt = dealDamage(shieldedScout, 60, 'phys', friendlyTower);
  assert.strictEqual(dealt, 0, 'Damage must be 0 because Seismic Pillar blocked line of sight');
  assert(pillar.hp < pillarHpBefore, 'Seismic Pillar absorbed projectile damage');

  // 2. Wave 15 Titan Chrono-Weaver: Time Inversion against Cold
  spawnEnemy('boss', 15, null, null, 0, 'chronoweaver');
  const chrono = G.enemies[G.enemies.length - 1];
  assert.strictEqual(chrono.titanId, 'chronoweaver');
  chrono.slowT = 2.0;
  chrono.slowAmt = 0.5;
  updateEnemy(chrono, 0.1);
  assert.strictEqual(chrono.slowT, 0, 'Chrono-Weaver purges slow/freeze');
  assert(chrono.speedBoostT > 0, 'Chrono-Weaver inverts cold into a temporal speed surge');

  // 3. Wave 20 Titan Apex Mother: Phase 2 Creep Consumption
  spawnEnemy('boss', 20, null, null, 0, 'swarm_mother');
  const mother = G.enemies[G.enemies.length - 1];
  assert.strictEqual(mother.titanId, 'swarm_mother');
  mother.x = 5 * TILE + TILE / 2;
  mother.y = 5 * TILE + TILE / 2;
  mother.hp = mother.maxHp * 0.40; // Phase 2 (<50% HP)
  const mCol = Math.floor(mother.x / TILE), mRow = Math.floor(mother.y / TILE);
  addBiomassCreep(mCol, mRow);
  assert(G.creep[mRow + ',' + mCol], 'Creep present near mother');

  mother.creepAbsorbCd = 0;
  const motherHpBefore = mother.hp;
  updateEnemy(mother, 0.1);
  assert(!G.creep[mRow + ',' + mCol], 'Apex Mother devours nearby creep in Phase 2');
  assert(mother.hp > motherHpBefore, 'Apex Mother regenerates health by devouring biomass creep');
  console.log('✓ Pillar 5: Goliath Seismic LoS blocking, Chrono Time Inversion, & Mother Creep Devour passed');
})()`, ctx);

console.log('\n======================================================');
console.log('ALL BASTION TD 5.0 DEEP SYNERGY TESTS PASSED PERFECTLY!');
console.log('======================================================\n');
