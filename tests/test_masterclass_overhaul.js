// tests/test_masterclass_overhaul.js
// Comprehensive test suite for Bastion TD 8.0: Masterclass AAA/Indie Overhaul
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

// Headless DOM stub
const store = {};
const elements = {};
const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});

function makeEl(tag) {
  const el = {
    tagName: (tag || 'DIV').toUpperCase(),
    style: new Proxy({ setProperty() {} }, { get: (t, k) => (k in t ? t[k] : '') }),
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; }
    },
    dataset: {},
    innerHTML: '',
    textContent: '',
    value: '',
    offsetWidth: 100,
    offsetHeight: 100,
    clientWidth: 100,
    clientHeight: 100,
    children: [],
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
    },
    querySelector() { return makeEl('canvas'); },
    querySelectorAll() { return []; },
    toDataURL() { return 'data:image/png;base64,mock'; },
    getContext() { return P; },
    addEventListener() {}
  };
  return el;
}

globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.document = {
  documentElement: makeEl('html'),
  getElementById: (id) => elements[id] || (elements[id] = makeEl('div')),
  createElement: makeEl,
  addEventListener() {},
  querySelectorAll: () => [],
  querySelector: () => makeEl('div'),
  hidden: false
};
globalThis.localStorage = {
  getItem: k => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); }
};
globalThis.requestAnimationFrame = () => 1;
globalThis.devicePixelRatio = 1;
globalThis.innerWidth = 1400;
globalThis.innerHeight = 900;
globalThis.setTimeout = (fn) => { fn(); return 0; };

// Load application scripts in order
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

console.log('Testing Bastion TD 8.0: Masterclass AAA/Indie Overhaul...\n');

const nb = window.__nb;
nb.begin();
const G = nb.G;

// ============================================================
// STAGE 1: SUBTERRANEAN MUNITIONS LOGISTICS & FLUIDICS NETWORK
// ============================================================
console.log('--- 1. Testing Subterranean Logistics & Fluidics Network ---');
G.gold = 1000;
// Find two adjacent free spots
let c1 = 3, r1 = 2, c2 = 4, r2 = 2;
const t1 = nb.placeTower(c1, r1, 'gatling');
const t2 = nb.placeTower(c2, r2, 'plasma');
assert(t1 && t2, 'Towers for logistics test should be placed');

// Route Kinetic Belt
const condKinetic = nb.routeLogistics(c1, r1, c2, r2, 'kinetic_belt');
assert(condKinetic, 'Kinetic belt conduit should be routed successfully');
assert.strictEqual(G.logisticsConduits.length, 1, 'Logistics conduits count should be 1');

// Update logistics
nb.updateLogistics(0.1);
assert.strictEqual(t1.kineticAmmoBuff, true, 'Connected gatling should gain kineticAmmoBuff');

// Check damage amplification from Sabot rounds
const dummyEnemy = { hp: 500, maxHp: 500, armor: 0, r: 14, x: 100, y: 100, d: 50, dead: false };
const hpBefore = dummyEnemy.hp;
dealDamage(dummyEnemy, 100, 'phys', t1);
const dmgDealt = hpBefore - dummyEnemy.hp;
assert(dmgDealt >= 134, 'Kinetic sabot ammo should amplify physical damage by +35%');

// Test Cryo pipe instant heat dissipation
t1.heat = 95;
nb.routeLogistics(c1, r1, c2, r2, 'cryo_pipe');
nb.updateLogistics(0.1);
assert.strictEqual(t1.heat, 0, 'Cryo pipe should instantly flush heat to 0');
assert.strictEqual(t1.cryoCooling, true, 'Cryo pipe should maintain cryoCooling immunity');

console.log('✔ Subterranean logistics conduits (Kinetic sabot belt & Cryo heat clearance) verified');


// ============================================================
// STAGE 2: COLOSSAL MULTI-PART TITANS & DESTRUCTIBLE ANATOMIES
// ============================================================
console.log('\n--- 2. Testing Colossal Multi-Part Titans & Destructible Anatomies ---');
const titanBoss = {
  type: 'boss', id: 9999, hp: 5000, maxHp: 5000, dispHp: 5000,
  armor: 0.3, shred: 0, r: 35, x: 200, y: 200, d: 100, dead: false,
  speed: 20, curSpeed: 20, leak: 5
};
nb.setupBossMultiParts(titanBoss);
assert(titanBoss.parts, 'Titan Boss should have multi-part anatomical systems');
assert.strictEqual(titanBoss.parts.carapace.hp, 800, 'Carapace should have 800 HP');
assert.strictEqual(titanBoss.parts.mortar_pod.hp, 500, 'Mortar Pod should have 500 HP');
assert.strictEqual(titanBoss.parts.joints.hp, 650, 'Locomotive Knee Tendons should have 650 HP');
assert.strictEqual(titanBoss.parts.core.exposed, false, 'Core should initially be protected');

// Test Carapace damage absorption: 80% damage reduction to main body
const bossHpStart = titanBoss.hp;
dealDamage(titanBoss, 100, 'phys', null);
const absorbedDmg = bossHpStart - titanBoss.hp;
assert(absorbedDmg <= 25, 'Carapace should reduce body damage by 80% (dealt ~20-25)');
assert(titanBoss.parts.carapace.hp < 800, 'Carapace should take damage');

// Shatter the carapace
nb.damageBossPart(titanBoss, 'carapace', 800, 'phys', null);
assert.strictEqual(titanBoss.parts.carapace.broken, true, 'Carapace should be shattered');
assert.strictEqual(titanBoss.parts.core.exposed, true, 'Core should now be exposed');

// Cripple Locomotive Knee Tendons to trigger Stagger
nb.damageBossPart(titanBoss, 'joints', 650, 'phys', null);
assert.strictEqual(titanBoss.parts.joints.broken, true, 'Joints should be crippled');
assert(titanBoss.staggerT >= 5.5, 'Titan Boss should enter 6-second Stagger state');
assert(G.grapplePrompt && G.grapplePrompt.boss === titanBoss, 'Grapple prompt should be active');

// Test Titan Mech Grapple Cleave
G.mech = { active: true, x: 210, y: 210, hp: 500, battery: 100 };
const hpPreGrapple = titanBoss.hp;
const grappleSuccess = nb.mechGrappleStrike(titanBoss);
assert(grappleSuccess, 'Mech grapple strike should execute successfully');
assert(hpPreGrapple - titanBoss.hp >= 2300, 'Mech grapple cleave should inflict massive 2400 true damage');
assert.strictEqual(titanBoss.staggerT, 0, 'Grapple strike should consume stagger');

console.log('✔ Multi-part titan anatomy damage, carapace shatter, knee stagger, and Mech Grapple Cleave verified');


// ============================================================
// STAGE 3: ADAPTIVE HIVEMIND STRATEGIC DIRECTOR 2.0 (PHEROMONES)
// ============================================================
console.log('\n--- 3. Testing Adaptive Hivemind Pheromone Strategic Director ---');
const deathX = 150, deathY = 150;
const dCol = Math.floor(deathX / TILE), dRow = Math.floor(deathY / TILE);
const cellKey = dCol + '_' + dRow;

// Record multiple deaths in same cell
nb.recordPheromoneDeath(deathX, deathY);
nb.recordPheromoneDeath(deathX, deathY);
nb.recordPheromoneDeath(deathX, deathY);
assert(G.pheromoneMap[cellKey] >= 3.0, 'Pheromone heatmap should accumulate death density');

// Update pheromones decay
const pvalBefore = G.pheromoneMap[cellKey];
nb.updatePheromones(1.0);
assert(G.pheromoneMap[cellKey] < pvalBefore, 'Pheromones should decay over time');

// Pheromone avoidance steering in enemy
const testScout = {
  type: 'scout', id: 888, hp: 50, maxHp: 50, x: deathX, y: deathY,
  d: 10, r: 10, dead: false, off: 0, anim: 0, flash: 0, dispHp: 50,
  speed: 60, curSpeed: 60, seg: 0, ang: 0
};
G.enemies.push(testScout);
updateEnemy(testScout, 0.1);
assert.notStrictEqual(testScout.off, 0, 'Hostile should apply lateral avoidance steering when encountering pheromone heatmap');

console.log('✔ Pheromone death heatmap accumulation, temporal decay, and avoidance steering verified');


// ============================================================
// STAGE 4: MODULAR MULTI-TILE MEGASTRUCTURE ENGINEERING (2x2)
// ============================================================
console.log('\n--- 4. Testing Multi-Tile Megastructure Engineering (2x2) ---');
G.gold = 2000;
// Find free 2x2 sector
let mCol = -1, mRow = -1;
for (let r = 1; r < ROWS - 2; r++) {
  for (let c = 1; c < COLS - 2; c++) {
    if (nb.canPlaceMegastructure(c, r, 'ion_uplink')) {
      mCol = c; mRow = r; break;
    }
  }
  if (mCol !== -1) break;
}
assert(mCol !== -1, 'Must find valid 2x2 ground for megastructure');

// Place Ion Uplink Array
const ionArray = nb.placeMegastructure(mCol, mRow, 'ion_uplink');
assert(ionArray, 'Ion Beam Uplink should be constructed');
assert.strictEqual(G.megastructures.length, 1, 'Megastructure array count should be 1');
// Verify all 4 grid cells reserved
assert.strictEqual(G.grid[mRow][mCol], ionArray, 'Top-left cell reserved');
assert.strictEqual(G.grid[mRow][mCol + 1], ionArray, 'Top-right cell reserved');
assert.strictEqual(G.grid[mRow + 1][mCol], ionArray, 'Bottom-left cell reserved');
assert.strictEqual(G.grid[mRow + 1][mCol + 1], ionArray, 'Bottom-right cell reserved');

// Cannot place another tower inside the 2x2 footprint
assert.strictEqual(nb.placeTower(mCol, mRow, 'gatling'), false, 'Cannot place tower on megastructure cell');

// Test Ion Beam continuous DPS
const ionTarget = { hp: 1000, maxHp: 1000, r: 15, x: 300, y: 300, d: 50, dead: false };
G.enemies = [ionTarget];
nb.updateMegastructures(0.5); // 0.5s beam tick
assert(ionTarget.hp < 1000, 'Ion Uplink continuous beam should deal solar laser damage');

// Test Drone Carrier base & autonomous interceptors
let dCol2 = -1, dRow2 = -1;
for (let r = 1; r < ROWS - 2; r++) {
  for (let c = 1; c < COLS - 2; c++) {
    if (nb.canPlaceMegastructure(c, r, 'drone_carrier')) {
      dCol2 = c; dRow2 = r; break;
    }
  }
  if (dCol2 !== -1) break;
}
const carrier = nb.placeMegastructure(dCol2, dRow2, 'drone_carrier');
assert(carrier && carrier.drones.length === 6, 'Drone carrier should launch 4 interceptors and 2 repair bots');

console.log('✔ Megastructure 2x2 placement, collision reservation, Ion beam DPS, and Drone Carrier operation verified');


// ============================================================
// STAGE 5: BIOCHEMICAL GENE-SPLICING & FORBIDDEN DARK CURIOS
// ============================================================
console.log('\n--- 5. Testing Biochemical Gene-Splicing & Void Alchemy ---');
SAVE.cores = 200;

// Apply Brute Bio-Chitin Weave
nb.applyGeneSplice('brute_chitin');
assert.strictEqual(G.geneSplices.brute_chitin, true, 'brute_chitin splice should be active');
assert.strictEqual(t1.bioShield, 120, 'Existing towers should receive 120 reactive bio-shield');

// Apply Healer Bio-Corrosive Leeching
nb.applyGeneSplice('healer_leech');
assert.strictEqual(G.geneSplices.healer_leech, true, 'healer_leech splice should be active');

// Test life restore on 25 kills
G.lives = 10;
for (let k = 0; k < 25; k++) {
  const dummyVictim = { type: 'scout', reward: 1, x: 50, y: 50, r: 10, hp: 0, dead: false };
  killEnemy(dummyVictim, null);
}
assert.strictEqual(G.lives, 11, 'Healer leech should restore 1 base life after 25 kills');

// Apply Forbidden Dark Tech Curio: The Blood-Forge Reactor
nb.applyDarkCurio('blood_forge');
assert(G.darkCurios.includes('blood_forge'), 'blood_forge curio should be bound');
assert.strictEqual(nb.getTowerPower(t1), 0, 'Blood-Forge should reduce tower power draw to 0 MW');

// Apply Singularity Core of Agony
nb.applyDarkCurio('singularity_agony');
assert(G.darkCurios.includes('singularity_agony'), 'singularity_agony curio should be bound');

console.log('✔ Biochemical gene-splicing (bio-shield, life leech) and Forbidden Dark Tech Curios verified');


// ============================================================
// STAGE 6: TACTICAL INSPECTOR FOR NEW & OLD DEFENSES
// ============================================================
console.log('\n--- 6. Testing Tactical Inspector for All Defense Formats ---');
const inspectorBox = elements['inspector'];

// Test Case A: Standard Gatling Turret (matching screenshot)
G.sel = t1;
renderInspector();
assert(inspectorBox.innerHTML.includes('Gatling Turret'), 'Inspector must render Gatling Turret info');
assert(inspectorBox.innerHTML.includes('TIER I'), 'Inspector must render TIER I');
assert(inspectorBox.innerHTML.toLowerCase().includes('upgrade'), 'Inspector must render UPGRADE button');
assert(inspectorBox.innerHTML.toLowerCase().includes('sell'), 'Inspector must render SELL button');
assert(inspectorBox.innerHTML.includes('Modular Chip Sockets'), 'Inspector must render chip socket guide');

// Test Case B: Megastructure Facility Selected
G.sel = ionArray;
renderInspector();
assert(inspectorBox.innerHTML.includes('SELECTED MEGASTRUCTURE'), 'Inspector must render Megastructure header');
assert(inspectorBox.innerHTML.includes('Ion Beam Orbital Uplink Array'), 'Inspector must render facility name');
assert(inspectorBox.innerHTML.includes('Dismantle Facility'), 'Inspector must render facility dismantle button');

// Test Case C: Colossal Multi-Part Titan Boss Selected
G.sel = titanBoss;
renderInspector();
assert(inspectorBox.innerHTML.includes('ANATOMICAL TITAN TARGETING'), 'Inspector must render Titan targeting header');
assert(inspectorBox.innerHTML.toUpperCase().includes('ARMORED CARAPACE PLATING'), 'Inspector must render carapace status');
assert(inspectorBox.innerHTML.toUpperCase().includes('BIO-SPORE ARTILLERY POD'), 'Inspector must render mortar pod status');
assert(inspectorBox.innerHTML.toUpperCase().includes('LOCOMOTIVE KNEE TENDONS'), 'Inspector must render knee tendons status');

console.log('✔ Tactical inspector renders standard defenses, 2x2 megastructures, and multi-part titan anatomies cleanly');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 8.0: MASTERCLASS OVERHAUL TESTS PASSED!');
console.log('============================================================\n');
