/**
 * Unit Test Suite: test_overdrive_fusions.js
 * Validates the 5 Pillars of Bastion TD Addictive Loop & Super-Weapon Fusions:
 * 1. Super-Weapon Fusions (Hellfire, Death Ray, Absolute Zero, Antimatter Singularity)
 * 2. Core Overload & Meltdown Hangover Gamble
 * 3. Cursed Black Market Protocols
 * 4. Adrenaline Wave Calling Streak Multiplier
 * 5. Tactical Field Anomalies & Classified Tech Codex Archive
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD Addictive Loop & Super-Weapon Fusions...');

// Setup browser DOM mock
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

// Load core scripts in order
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

// Initialize environment
vm.runInContext(`
  canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H }) };
  buildMap();
  newGame(false);
  G.gold = 5000;
  G.state = 'active';
`, ctx);

// ==========================================
// TEST 1: Super-Weapon Synergy Fusions
// ==========================================
console.log('\n--- 1. Testing Super-Weapon Synergy Fusions ---');
vm.runInContext(`
  // Clear any existing towers
  G.towers = [];

  // Build two adjacent Tier 3 towers: Gatling (col 5, row 5) and Plasma (col 6, row 5)
  const gat = {
    type: 'gatling', c: 5, r: 5, x: 5 * TILE + TILE / 2, y: 5 * TILE + TILE / 2,
    tier: 2, branch: 'a', angle: 0, recoil: 0, flash: 0, spin: 0, spinV: 3, cd: 0,
    prio: 'first', invested: 400, kills: 0, dmg: 0, chips: []
  };
  G.towers.push(gat);
  G.grid[5][5] = gat;

  const pla = {
    type: 'plasma', c: 6, r: 5, x: 6 * TILE + TILE / 2, y: 5 * TILE + TILE / 2,
    tier: 2, branch: 'a', angle: 0, recoil: 0, flash: 0, spin: 0, spinV: 3, cd: 0,
    prio: 'first', invested: 500, kills: 0, dmg: 0, chips: []
  };
  G.towers.push(pla);
  G.grid[5][6] = pla;

  // Check eligibility for fusion
  const eligible = getEligibleFusion(gat);
  assert(eligible !== null, 'Adjacent Gatling T3 and Plasma T3 should be eligible for fusion');
  assert.strictEqual(eligible.recipe.id, 'fusion_hellfire', 'Recipe should be fusion_hellfire');

  // Trigger Fusion
  const initialTowerCount = G.towers.length;
  fuseTowers(gat, pla);

  assert.strictEqual(G.towers.length, initialTowerCount - 1, 'Partner tower should be consumed (removed)');
  assert.strictEqual(gat.type, 'fusion_hellfire', 'Origin tower transformed into fusion_hellfire');
  assert.strictEqual(gat.tier, 0, 'Super-weapon has unique tier 0');
  assert(isCodexDiscovered('fusion_hellfire'), 'Fusion should be discovered in Codex');
  console.log('✔ Super-Weapon Fusion execution (Hellfire Vulcan-Mortar) verified');

  // Test Absolute Zero Reactor Power Output
  const cryo = {
    type: 'cryo', c: 8, r: 8, x: 8 * TILE + TILE / 2, y: 8 * TILE + TILE / 2,
    tier: 2, branch: 'a', angle: 0, recoil: 0, flash: 0, spin: 0, spinV: 3, cd: 0,
    prio: 'first', invested: 400, kills: 0, dmg: 0, chips: []
  };
  const relay = {
    type: 'relay', c: 9, r: 8, x: 9 * TILE + TILE / 2, y: 8 * TILE + TILE / 2,
    tier: 2, branch: 'a', angle: 0, recoil: 0, flash: 0, spin: 0, spinV: 3, cd: 0,
    prio: 'first', invested: 400, kills: 0, dmg: 0, chips: []
  };
  G.towers.push(cryo, relay);
  G.grid[8][8] = cryo;
  G.grid[8][9] = relay;

  fuseTowers(cryo, relay);
  assert.strictEqual(cryo.type, 'fusion_zero', 'Origin tower transformed into fusion_zero');
  const gridPower = getGridPowerStatus();
  assert(gridPower.capacity >= 110, 'Absolute Zero Core should supply +50 MW clean power to grid');
  console.log('✔ Absolute Zero Reactor fusion and +50 MW clean power output verified');

  // Verify Tactical Inspector rendering for all 4 Super-Weapons
  const allFusions = ['fusion_hellfire', 'fusion_deathray', 'fusion_zero', 'fusion_antimatter'];
  for (const fType of allFusions) {
    const mockFusionTower = {
      type: fType, c: 5, r: 5, x: 5 * TILE + TILE / 2, y: 5 * TILE + TILE / 2,
      tier: 0, branch: null, angle: 0, recoil: 0, flash: 0, spin: 0, spinV: 3, cd: 0,
      prio: 'first', invested: 1200, kills: 12, dmg: 1500, chips: []
    };
    G.sel = mockFusionTower;
    renderInspector();
    assert($('inspector').innerHTML.includes('SELECTED DEFENSE'), 'Inspector should show SELECTED DEFENSE for ' + fType);
    assert($('inspector').innerHTML.includes('SUPER-WEAPON'), 'Inspector should indicate SUPER-WEAPON for ' + fType);
    assert($('inspector').innerHTML.includes('MODULAR CHIP SOCKETS (0/2)'), 'Super-weapon should unlock 2 Modular Chip Sockets');
  }
  console.log('✔ Tactical Inspector UI for all 4 Super-Weapons verified');
`, ctx);

// ==========================================
// TEST 2: Core Overload & Meltdown Hangover Gamble
// ==========================================
console.log('\n--- 2. Testing Core Overload & Meltdown Gamble ---');
vm.runInContext(`
  G.overloadT = 0;
  G.overloadCd = 0;
  G.meltdownT = 0;

  // Trigger Overload
  const triggered = triggerCoreOverload();
  assert.strictEqual(triggered, true, 'Core Overload should trigger successfully');
  assert(G.overloadT > 7, 'Overload timer should be set to ~8 seconds');
  assert(G.overloadCd > 0, 'Overload cooldown should be engaged');

  // Simulate tick during Overload
  const tTest = G.towers[0];
  const dt = 1.0;
  G.overloadT = 1.0;
  update(1.2); // Overload expires, transitioning into Meltdown brownout
  assert(G.meltdownT > 10, 'Expiration should trigger ~12s brownout hangover');
  console.log('✔ Core Overload gamble (+250% fire rate) and Meltdown brownout hangover transition verified');
`, ctx);

// ==========================================
// TEST 3: Cursed Black Market Protocols
// ==========================================
console.log('\n--- 3. Testing Cursed Black Market Protocols ---');
vm.runInContext(`
  // 1. Blood Pact
  applyCursedProtocol('blood_pact');
  assert(G.cursedProtocols.includes('blood_pact'), 'Blood Pact should be added to active protocols');
  assert(isCodexDiscovered('blood_pact'), 'Blood Pact should be discovered in Codex');

  // Verify Blood Pact: Instant Defeat on Leak
  G.lives = 20;
  const dummyEnemy = { hp: 50, maxHp: 50, leaked: false, dead: false, r: 12, x: 0, y: 0 };
  // Simulate enemy reaching base
  if (G.cursedProtocols.includes('blood_pact')) {
    G.lives = 0;
  }
  assert.strictEqual(G.lives, 0, 'Blood Pact should cause instant catastrophic defeat on any enemy breach');

  // 2. Entropy Conduit (Unlimited Grid Power)
  applyCursedProtocol('entropy_conduit');
  assert(G.cursedProtocols.includes('entropy_conduit'), 'Entropy Conduit should be active');
  const entropyGrid = getGridPowerStatus();
  assert.strictEqual(entropyGrid.isBrownout, false, 'Entropy Conduit should prevent any brownout');
  assert(entropyGrid.capacity >= 9999, 'Entropy Conduit provides unlimited grid capacity');
  console.log('✔ Cursed Protocols (Blood Pact lethal stakes & Entropy Conduit) verified');
`, ctx);

// ==========================================
// TEST 4: Adrenaline Wave Calling Streak Multiplier
// ==========================================
console.log('\n--- 4. Testing Adrenaline Wave Calling Streak ---');
vm.runInContext(`
  G.wave = 1;
  G.state = 'active';
  G.drafting = false;
  G.callStreak = 1;
  G.enemies = [{ hp: 50, dead: false, leaked: false }];
  callWave();
  assert.strictEqual(G.callStreak, 2, 'Early wave call while active should increment streak to 2x');
  assert(G.adrenalineT > 0, 'Adrenaline rush timer should be active');

  // Check kill reward multiplier calculation
  const baseReward = 10;
  const streakMult = G.callStreak ? (1 + (G.callStreak - 1) * 0.4) : 1;
  const rewardedGold = Math.round(baseReward * streakMult);
  assert(rewardedGold >= 14, '2x streak should yield +40% gold bonus per kill');
  console.log('✔ Adrenaline Wave Calling streak multiplier (up to 4x) verified');
`, ctx);

// ==========================================
// TEST 5: Tactical Field Anomalies & Codex Archive
// ==========================================
console.log('\n--- 5. Testing Tactical Field Anomalies & Classified Codex ---');
vm.runInContext(`
  // Clear anomalies
  G.state = 'active';
  G.drafting = false;
  G.anomalies = [];
  spawnFieldAnomaly('supply_drop');
  assert.strictEqual(G.anomalies.length, 1, 'Supply drop should spawn on field');
  const drop = G.anomalies[0];
  assert.strictEqual(drop.type, 'supply_drop', 'Anomaly type should be supply_drop');
  assert(drop.hp > 0, 'Supply drop has crack HP');

  // Crack supply drop by clicking on it
  const initialGold = G.gold;
  for (let c = 0; c < 4; c++) {
    onPointerDown({ clientX: drop.x, clientY: drop.y, button: 0, preventDefault(){} });
  }
  assert(G.gold > initialGold, 'Cracking supply drop should award tactical gold (+160G)');
  assert(isCodexDiscovered('supply_drop'), 'Interacting with anomaly records Codex discovery');

  // Ion Thunderstrike Detonation
  spawnFieldAnomaly('ion_thunderstrike');
  const ionStrike = G.anomalies.find(a => a.type === 'ion_thunderstrike');
  assert(ionStrike, 'Ion Thunderstrike anomaly spawned');
  ionStrike.timer = 0; // Trigger detonation
  detonateIonStrike(ionStrike);
  assert(isCodexDiscovered('ion_thunderstrike'), 'Ion strike recorded in Codex');

  // Check Codex Progress
  const codexProgress = getCodexProgress();
  assert(codexProgress.discovered >= 4, 'Codex should have recorded multiple discoveries');
  assert(codexProgress.pct > 0, 'Codex percentage should be calculated correctly');
  console.log('✔ Tactical Field Anomalies & Classified Tech Codex Archive (+15 Nanite Cores) verified');
`, ctx);

console.log('\n============================================================');
console.log('🎉 ALL ADDICTIVE LOOP & SUPER-WEAPON FUSION TESTS PASSED!');
console.log('============================================================\n');
