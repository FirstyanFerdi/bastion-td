/**
 * Unit Test Suite: test_grand_expansion.js
 * Validates Bastion TD 7.0: The Grand Expedition & Titan Mech Warfare
 * 1. Titan Combat Mech Pilot Mode (WASD thrusters, Vulcan autocannon, Thermal Blade Cleave, Dock recharge)
 * 2. Orbital Dreadnought "Aegis Prime" Super-Strike (Kinetic Tungsten Rods & Molten Craters)
 * 3. Anomaly Vault Expeditions & Exotic Relics (Tungsten Ricochet, Berserker Core, Nanite Catalyst)
 * 4. Cyber-Logic Automation Matrix (Shield Annihilator & Auto-Heat Regulator presets)
 * 5. Dynamic Wartime Supply-Demand Market & Blindspot Drop-Pods
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 7.0: The Grand Expedition & Titan Mech Warfare...\n');

const makeElement = () => ({
  width: 960, height: 600, style: { setProperty(){} }, innerHTML: '', textContent: '',
  classList: { add(){}, remove(){}, toggle(){}, contains:()=>false },
  dataset: {},
  appendChild(){}, addEventListener(){}, removeEventListener(){},
  querySelector: () => makeElement(),
  querySelectorAll: () => [],
  getContext: () => ({
    scale(){}, translate(){}, rotate(){}, beginPath(){}, closePath(){},
    moveTo(){}, lineTo(){}, arc(){}, arcTo(){}, fill(){}, stroke(){}, ellipse(){},
    save(){}, restore(){}, rect(){}, fillRect(){}, strokeRect(){}, clearRect(){},
    setLineDash(){}, createRadialGradient:()=>({addColorStop(){}}),
    createLinearGradient:()=>({addColorStop(){}}),
    fillText(){}, strokeText(){}
  }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
  toDataURL: () => 'data:image/png;base64,mock'
});

const elements = {};
const ctx = {
  window: { devicePixelRatio: 1, addEventListener(){}, removeEventListener(){} },
  document: {
    addEventListener(){}, removeEventListener(){},
    createElement: () => makeElement(),
    getElementById: (id) => elements[id] || (elements[id] = makeElement()),
    querySelectorAll: () => []
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 1,
  AudioContext: function() {
    return {
      createOscillator: () => ({ connect(){}, start(){}, stop(){}, frequency: { setValueAtTime(){}, exponentialRampToValueAtTime(){} } }),
      createGain: () => ({ connect(){}, gain: { setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} } }),
      createBiquadFilter: () => ({ connect(){}, frequency: { setValueAtTime(){} } }),
      createBuffer: () => ({ getChannelData: () => new Float32Array(100) }),
      createBufferSource: () => ({ connect(){}, start(){}, buffer: null }),
      destination: {},
      state: 'running',
      resume: () => Promise.resolve()
    };
  },
  console: console,
  assert: assert
};
ctx.window.document = ctx.document;
ctx.window.localStorage = ctx.localStorage;
vm.createContext(ctx);

const scripts = [
  'js/core.js', 'js/data.js', 'js/audio.js', 'js/state.js', 'js/enemies.js',
  'js/towers.js', 'js/waves.js', 'js/sprites.js', 'js/render.js', 'js/ui.js',
  'js/input.js', 'js/main.js'
];
for (const s of scripts) {
  const code = fs.readFileSync(s, 'utf8');
  vm.runInContext(code, ctx, { filename: s });
}

vm.runInContext(`
// Initialize Game
begin();
assert(G, 'Game state should be initialized');

// ============================================================
// 1. TITAN COMBAT MECH PILOT MODE
// ============================================================
console.log('--- 1. Testing Titan Combat Mech Pilot Mode ---');
assert(G.mech, 'Titan Mech state should exist');
assert.strictEqual(G.mech.active, false, 'Mech starts in standby dock mode');

// Toggle Mech Pilot Mode
const pilotEngaged = toggleMechPilot(true);
assert.strictEqual(pilotEngaged, true, 'toggleMechPilot should return true when engaged');
assert.strictEqual(G.mech.active, true, 'Mech should be active');

// WASD Thruster Movement
G.mech.x = 200; G.mech.y = 200;
G.mechKeys = { w: true, a: false, s: false, d: true };
const initialBattery = G.mech.battery;
updateMech(0.1); // Move diagonally up-right for 100ms
assert(G.mech.x > 200, 'Mech should move right along X axis');
assert(G.mech.y < 200, 'Mech should move up along Y axis');
assert(G.mech.battery < initialBattery, 'Active mech movement should drain battery');

// Test Manual Vulcan Fire
G.enemies = [{
  id: 101, type: 'scout', x: 260, y: 190, r: 12, hp: 150, maxHp: 150,
  armor: 0, shield: 0, dead: false, slowAmt: 0, slowT: 0
}];
G.mech.vulcanCd = 0;
const fired = mechFireVulcan(260, 190);
assert.strictEqual(fired, true, 'mechFireVulcan should successfully fire');
assert(G.enemies[0].hp < 150, 'Enemy within firing line should take Vulcan bullet damage');

// Test Thermal Blade Cleave AoE
G.enemies.push({
  id: 102, type: 'swarm', x: 220, y: 220, r: 10, hp: 80, maxHp: 80,
  armor: 0, shield: 0, dead: false, slowAmt: 0, slowT: 0
});
G.enemies.push({
  id: 103, type: 'swarm', x: 230, y: 195, r: 10, hp: 80, maxHp: 80,
  armor: 0, shield: 0, dead: false, slowAmt: 0, slowT: 0
});
G.mech.bladeCd = 0;
G.mech.facing = Math.atan2(0, 1); // Facing East
const bladeSwung = mechSwingBlade();
assert.strictEqual(bladeSwung, true, 'mechSwingBlade should execute');
assert(G.mech.swingT > 0, 'Blade swing animation timer should be active');

// Disembark & Base Dock Recharge
toggleMechPilot(false);
assert.strictEqual(G.mech.active, false, 'Mech disembarked into standby mode');
G.mech.x = BASE_PT.x; G.mech.y = BASE_PT.y;
G.mech.battery = 50; G.mech.hp = 600;
updateMech(0.5); // Docked recharge near base
assert(G.mech.battery > 50, 'Battery should auto-recharge while docked near base');
assert(G.mech.hp > 600, 'Hull should auto-repair while docked near base');
console.log('✓ Titan Mech Pilot Mode (WASD movement, Vulcan gunfire, Blade cleave, Dock recharge) verified');

// ============================================================
// 2. ORBITAL DREADNOUGHT "AEGIS PRIME" SUPER-STRIKE
// ============================================================
console.log('\\n--- 2. Testing Orbital Dreadnought "Aegis Prime" Super-Strike ---');
assert(G.dreadnought, 'Orbital Dreadnought state should exist');
G.dreadnought.charge = 50;
chargeDreadnought(50);
assert.strictEqual(G.dreadnought.charge, 100, 'Dreadnought should reach full 100% orbital charge');

// Trigger Super-Strike
G.enemies = [
  { id: 201, type: 'brute', x: 300, y: 250, r: 16, hp: 4000, maxHp: 4000, dead: false },
  { id: 202, type: 'breacher', x: 500, y: 250, r: 14, hp: 4000, maxHp: 4000, dead: false },
  { id: 203, type: 'carrier', x: 700, y: 250, r: 18, hp: 4000, maxHp: 4000, dead: false }
];
const strikeLaunched = triggerDreadnoughtStrike();
assert.strictEqual(strikeLaunched, true, 'Dreadnought super-strike should initiate');
assert.strictEqual(G.dreadnought.active, true, 'Dreadnought active sequence engaged');
assert.strictEqual(G.dreadnought.rods.length, 3, '3 kinetic tungsten rods from god should be queued');

// Advance time until all rods impact
updateDreadnought(3.5);
assert(G.dreadnought.rods.every(r => r.landed), 'All 3 tungsten rods should have impacted');
assert(G.enemies[0].hp < 4000, 'Hostile in kinetic impact radius should suffer catastrophic damage');
assert(G.dreadnought.craters && G.dreadnought.craters.length > 0, 'Molten kinetic craters should remain on ground');

// Molten crater residual burn damage
const initialHp = G.enemies[0].hp;
updateDreadnought(0.5);
assert(G.enemies[0].hp < initialHp, 'Molten crater should deal residual burn damage over time');
console.log('✓ Orbital Dreadnought Super-Strike (Tungsten Rods from God & Molten Craters) verified');

// ============================================================
// 3. ANOMALY VAULT EXPEDITIONS & EXOTIC RELICS
// ============================================================
console.log('\\n--- 3. Testing Anomaly Vault Expeditions & Exotic Relics ---');
const vaultTriggered = triggerAnomalyVault(4);
assert.strictEqual(vaultTriggered, true, 'Wave 4 Anomaly Vault should trigger');
assert(G.activeVaultModal, 'Active vault expedition modal should be presented');

// Select Relic Vault and obtain Tungsten Ricochet
selectAnomalyVault('relic_vault', 'tungsten_ricochet');
assert(hasRelic('tungsten_ricochet'), 'Player should possess Tungsten Ricochet relic');

// Verify Tungsten Ricochet projectile ricochet logic
const dummyTower = { type: 'gatling', x: 150, y: 200, dmg: 0 };
const dummyFoeA = { id: 301, type: 'brute', x: 200, y: 200, r: 15, hp: 500, maxHp: 500, dead: false, armor: 0, shield: 0 };
const dummyFoeB = { id: 302, type: 'scout', x: 240, y: 210, r: 12, hp: 200, maxHp: 200, dead: false, armor: 0, shield: 0 };
G.enemies = [dummyFoeA, dummyFoeB];
dealDamage(dummyFoeA, 100, 'phys', dummyTower);
assert(dummyFoeB.hp < 200, 'Tungsten Ricochet relic should cause damage to arc/ricochet to nearby secondary targets');

// Select Berserker Core relic
G.anomalousRelics.push('berserker_core');
const dummyFoeC = { id: 303, type: 'scout', x: 400, y: 400, r: 12, hp: 500, maxHp: 500, dead: false, armor: 0, shield: 0 };
dealDamage(dummyFoeC, 100, 'energy', null);
// Base 100 * 1.5 crit mult = 150 damage
assert.strictEqual(dummyFoeC.hp, 350, 'Berserker Core should guarantee crits with 1.5x damage multiplier');

// Select Nanite Catalyst relic
G.anomalousRelics.push('nanite_catalyst');
const dummyDeadFoe = { id: 304, type: 'scout', x: 100, y: 100, r: 12, hp: 0, maxHp: 100, dead: false, reward: 10 };
const preGold = G.gold;
killEnemy(dummyDeadFoe);
assert.strictEqual(G.gold, preGold + 10 + 4, 'Nanite Catalyst should award +4 extra bonus gold upon kill');
console.log('✓ Anomaly Vaults & Exotic Relics (Tungsten Ricochet, Berserker Core, Nanite Catalyst) verified');

// ============================================================
// 4. CYBER-LOGIC AUTOMATION MATRIX
// ============================================================
console.log('\\n--- 4. Testing Cyber-Logic Automation Matrix ---');
const gatTower = placeTower(4, 2, 'gatling');
assert(gatTower, 'Tower should be placed');
upgradeTower(gatTower); // Upgrade to Tier II
assert.strictEqual(gatTower.tier, 1, 'Tower upgraded to Tier II');

// Set Shield Buster Logic Rule
gatTower.cyberLogic = 'shield_buster';
const unshieldedFoe = { id: 401, type: 'scout', x: gatTower.x + 40, y: gatTower.y, r: 12, d: 250, hp: 100, shield: 0, dead: false };
const shieldedFoe = { id: 402, type: 'carrier', x: gatTower.x + 60, y: gatTower.y, r: 15, d: 150, hp: 300, shield: 400, dead: false };
G.enemies = [unshieldedFoe, shieldedFoe];
updateTower(gatTower, 0.1);
assert.strictEqual(gatTower.target, shieldedFoe, 'Shield Buster logic should prioritize high-shield target even if other enemy is ahead on path');

// Set Thermal Vent Auto-Heat Regulator
gatTower.cyberLogic = 'thermal_vent';
gatTower.heat = 90; // Overheated threshold (> 80%)
updateTower(gatTower, 0.1);
assert(gatTower.heat <= 90, 'Thermal vent logic should auto-throttle and vent heat to avoid critical shutdown');
console.log('✓ Cyber-Logic Automation Matrix (Shield Annihilator & Auto-Heat Regulator presets) verified');

// ============================================================
// 5. WARTIME SUPPLY-DEMAND MARKET & BLINDSPOT DROP-PODS
// ============================================================
console.log('\\n--- 5. Testing Wartime Supply-Demand Market & Drop-Pods ---');
// Clear existing towers and place 4 plasma turrets to trigger market inflation
G.gold = 1000;
G.towers = [];
for (let c = 0; c < COLS; c++) {
  for (let r = 0; r < ROWS; r++) {
    G.grid[r][c] = null;
  }
}

const freeSpots = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (!pathTile[r][c] && !G.grid[r][c]) freeSpots.push({ c, r });
  }
}
const p1 = placeTower(freeSpots[0].c, freeSpots[0].r, 'plasma');
const p2 = placeTower(freeSpots[1].c, freeSpots[1].r, 'plasma');
const p3 = placeTower(freeSpots[2].c, freeSpots[2].r, 'plasma');
const p4 = placeTower(freeSpots[3].c, freeSpots[3].r, 'plasma'); // 4th plasma turret (>= 3 threshold)

updateWartimeMarket();
assert(G.wartimeMarket.plasma > 1.0, 'Constructing 4 of the same tower type should incur supply-demand market inflation');
const inflatedCost = getTowerCost('plasma');
assert(inflatedCost > TD.plasma.cost, 'Market inflation multiplier should increase purchase and upgrade price');

// Test Blindspot Drop-Pod Incursions
const dropPod = spawnDropPod(350, 280, ['breacher', 'stealth']);
assert(dropPod, 'Drop-Pod should spawn');
assert.strictEqual(dropPod.landed, false, 'Drop-Pod starts in falling state');

// Advance drop pod until touchdown
updateDropPods(2.5);
assert.strictEqual(dropPod.landed, true, 'Drop-Pod should touch down and deploy hostile assault squad');
assert(G.enemies.some(e => e.type === 'breacher'), 'Hostile squad should deploy onto field from drop-pod');
console.log('✓ Wartime Supply-Demand Market & Drop-Pod Blindspot Insertion verified');

console.log('\\n============================================================');
console.log('🎉 ALL BASTION TD 7.0 GRAND EXPANSION TESTS PASSED (100%)!');
console.log('============================================================\\n');
`, ctx);
