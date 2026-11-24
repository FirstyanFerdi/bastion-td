// ============================================================
// Test Suite: Bastion TD 22.0 - The Epoch Horizon & Macro-Scale Metamorphosis
// Tests:
// 1. Tri-Epoch Progression & Paradigm State Machine (Guerilla -> Industrial -> Orbital)
// 2. Scavenger Salvage & Field Crafting (Epoch 1: Nanite Mines & Scrap Barricades)
// 3. Industrial Cyber-Grid Architecture (Epoch 2: +40% Fire Rate, 2x Cooling & Combat Skiffs)
// 4. Tectonic Geo-Engineering Chasms (Epoch 2: Magma Rift Fracture & Creep Slowdown)
// 5. Planetary Orbital Ion Lance & Chronos Singularity (Epoch 3: 1200 True Damage & 8s Global Stasis)
// 6. The Nemesis Overmind Dynamic Scaling Engine (Omega Power Vector, Slime Weavers & Ether Void)
// 7. End-to-End Epoch Systems Update Loop Simulation
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 22.0: The Epoch Horizon & Macro-Scale Metamorphosis...\n');

const root = path.join(__dirname, '..');
const store = {};
const elements = {};
const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});

function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    style: new Proxy({ setProperty() {} }, { get: (t, k) => (k in t ? t[k] : '') }),
    classList: {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(c) { return this._classes.has(c); },
      toggle(c, f) {
        if (f === undefined) f = !this.contains(c);
        if (f) this.add(c); else this.remove(c);
        return f;
      }
    },
    children: [],
    dataset: {},
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) {
      const idx = this.children.indexOf(child);
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

// Load application scripts
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

const nb = window.__nb;
nb.begin();
const G = nb.G;
G.state = 'active';

console.log('--- 1. Testing Tri-Epoch Progression & Paradigm State Machine ---');
assert(nb.EPOCH_CONFIG, 'EPOCH_CONFIG must be defined in data.js');
assert(G.epoch, 'G.epoch must be initialized in newGame()');
assert.strictEqual(G.epoch.current, 1, 'Initial game state should be Epoch 1 (Tactical Guerilla)');

// Test manual/dynamic advancement to Epoch 2
const adv2 = nb.advanceEpoch(2);
assert.strictEqual(adv2, true, 'Advancing to Epoch 2 should succeed');
assert.strictEqual(G.epoch.current, 2, 'G.epoch.current should be 2 (Industrial Cyber-Grid)');
assert(G.epoch.combatSkiffs && G.epoch.combatSkiffs.length === 2, 'Advancing to Epoch 2 should deploy 2 Combat Skiffs for Titan Mech');

// Test manual/dynamic advancement to Epoch 3
const adv3 = nb.advanceEpoch(3);
assert.strictEqual(adv3, true, 'Advancing to Epoch 3 should succeed');
assert.strictEqual(G.epoch.current, 3, 'G.epoch.current should be 3 (Orbital Hegemony)');
assert.strictEqual(G.epoch.ascendantActive, true, 'Advancing to Epoch 3 should activate Ascendant Titan Colossus state');
console.log('Epoch state transitions verified successfully.');

console.log('--- 2. Testing Scavenger Salvage & Field Crafting (Epoch 1) ---');
G.epoch.current = 1;
G.epoch.salvage = 0;

// Simulate killEnemy dropping salvage
const deadFoe = { id: 88, hp: 0, dead: false, x: 200, y: 200, reward: 10, isEtherVoid: false };
nb.killEnemy(deadFoe);
assert(G.epoch.salvage >= 5, 'Killing an enemy should drop scavenger salvage');
const currentSalvage = G.epoch.salvage;

// Test craft nanite mine
G.epoch.salvage = 50;
const mineCrafted = nb.craftScavengerTrap('nanite_mine', 250, 250);
assert.strictEqual(mineCrafted, true, 'Crafting nanite mine should succeed with sufficient salvage');
assert.strictEqual(G.epoch.salvage, 30, 'Nanite mine should cost 20 salvage');
assert(G.hazards.some(h => h.type === 'mine' && h.x === 250), 'Mine should be placed in G.hazards');

// Test craft scrap barricade
const barCrafted = nb.craftScavengerTrap('scrap_barricade', 300, 300);
assert.strictEqual(barCrafted, true, 'Crafting scrap barricade should succeed');
assert.strictEqual(G.epoch.salvage, 0, 'Scrap barricade should cost 30 salvage');
assert(G.barricades.some(b => b.x === 300), 'Scrap barricade should be placed in G.barricades');
console.log('Scavenger Salvage and field crafting verified successfully.');

console.log('--- 3. Testing Industrial Cyber-Grid Architecture (Epoch 2) ---');
G.epoch.current = 2;
const testTower = {
  id: 111, type: 'gatling', x: 200, y: 200, tier: 1, coolDown: 0, cd: 0, rate: 1.0, damage: 30,
  heat: 60, maxHeat: 100, overheated: false, range: 150, baseRange: 150, element: 'phys'
};
G.towers = [testTower];

// Verify heat dissipation rate is doubled in Epoch 2
nb.updateTower(testTower, 1.0);
assert(testTower.heat < 50, 'Epoch 2 Trans-Logistics Grid should provide 2x heat dissipation');

// Verify Combat Skiffs autonomous firing
if (G.mech) {
  G.mech.x = 200; G.mech.y = 200;
  G.epoch.combatSkiffs[0].cd = 0;
  const targetFoe = { id: 91, x: 210, y: 210, hp: 100, maxHp: 100, dead: false, d: 50, seg: 0, pathId: 0 };
  G.enemies = [targetFoe];
  nb.updateEpochSystems(0.016);
  assert(targetFoe.hp < 100, 'Combat skiffs should autonomously engage nearby enemies');
}
console.log('Industrial Cyber-Grid and Combat Skiffs verified successfully.');

console.log('--- 4. Testing Tectonic Geo-Engineering Chasms (Epoch 2) ---');
G.gold = 500;
const chasm = nb.triggerTectonicChasm(100, 200, 400, 200);
assert(chasm, 'Tectonic chasm should be created');
assert.strictEqual(chasm.life, 14.0, 'Chasm duration should default to 14.0s');
assert(G.gold <= 350, 'Creating chasm should deduct 150G');

// Enemy stepping into chasm
const walkingFoe = { id: 92, x: 250, y: 200, hp: 200, maxHp: 200, dead: false, d: 100, seg: 0, pathId: 0 };
G.enemies = [walkingFoe];
nb.updateEpochSystems(0.5);
assert(walkingFoe.hp < 200, 'Walking across tectonic chasm should deal true damage');
assert(walkingFoe.slowT > 0, 'Chasm should apply slow effect to enemies');
console.log('Tectonic Geo-Engineering Chasms verified successfully.');

console.log('--- 5. Testing Planetary Orbital Ion Lance & Chronos Singularity (Epoch 3) ---');
G.epoch.current = 3;
G.epoch.orbitalCooldown = 0;
const foeInBlast = { id: 93, x: 400, y: 300, hp: 2000, maxHp: 2000, dead: false, d: 200, seg: 0, pathId: 0 };
const foeOutside = { id: 94, x: 700, y: 300, hp: 2000, maxHp: 2000, dead: false, d: 200, seg: 0, pathId: 0 };
G.enemies = [foeInBlast, foeOutside];

// Fire Orbital Ion Lance at x = 400
const fired = nb.fireOrbitalIonLance(400, 300);
assert.strictEqual(fired, true, 'Orbital Ion Lance firing should succeed');
assert(foeInBlast.hp <= 800, 'Orbital Ion Lance must deal 1200 True Damage to targets in its column');
assert.strictEqual(foeOutside.hp, 2000, 'Targets outside the beam column should remain undamaged');
assert(G.epoch.orbitalCooldown > 20, 'Orbital Ion Lance should go on 25s cooldown');

// Chronos Singularity global stasis
nb.activateChronosSingularity();
assert.strictEqual(G.epoch.chronosSingularityActive, true, 'Chronos Singularity should be active');
assert(foeOutside.stunT >= 7.0, 'Chronos Singularity should freeze all hostiles for 8s');
console.log('Planetary Orbital Ion Lance and Chronos Singularity verified successfully.');

console.log('--- 6. Testing The Nemesis Overmind Dynamic Scaling Engine ---');
G.towers = [
  { id: 1, totalCost: 500, damage: 100, rate: 2 },
  { id: 2, totalCost: 500, damage: 100, rate: 2 }
];
G.gold = 3000;
G.fluxConduits = [{ t1: G.towers[0], t2: G.towers[1], disabledT: 0 }];

const omega = nb.calculatePlayerPowerVector();
assert(omega >= 1.0, 'Omega power vector should scale with DPS, net worth, and grid efficiency');
console.log('Player Omega Power calculated successfully:', omega);

// Slime weaver conduit corrosion test
const testP = posAt(50);
const slimeWeaver = {
  id: 95, type: 'slime_weaver', isSlimeWeaver: true, x: testP.x, y: testP.y, hp: 420, maxHp: 420,
  dead: false, speed: 65, slimeSprayCd: 0.05, d: 50, seg: 0, pathId: 0
};
G.towers[0].x = testP.x + 5; G.towers[0].y = testP.y;
G.towers[1].x = testP.x + 15; G.towers[1].y = testP.y;
G.enemies = [slimeWeaver];
nb.updateEnemy(slimeWeaver, 0.1);
assert(G.fluxConduits[0].disabledT > 0, 'Corrosive Slime Weaver should spray acid and disable power conduits');

// Ether Void dimensional glide test
const p0 = posAt(0);
const etherBreacher = {
  id: 96, type: 'rift_breacher', isEtherVoid: true, x: p0.x, y: p0.y, hp: 550, maxHp: 550,
  dead: false, speed: 100, d: 0, seg: 0, pathId: 0
};
const startDist = Math.hypot(BASE_PT.x - etherBreacher.x, BASE_PT.y - etherBreacher.y);
nb.updateEnemy(etherBreacher, 0.5);
const newDist = Math.hypot(BASE_PT.x - etherBreacher.x, BASE_PT.y - etherBreacher.y);
assert(newDist < startDist, 'Dimensional Rift Breacher should glide directly across ether void toward Base');
console.log('Nemesis Overmind counter-tactics and hostile behaviors verified successfully.');

console.log('--- 7. Testing End-to-End Epoch Systems Update Loop Simulation ---');
G.epoch.current = 1;
G.wave = 9;
G.gold = 2000;
G.towers = [
  { id: 1, totalCost: 300 }, { id: 2, totalCost: 300 }, { id: 3, totalCost: 300 },
  { id: 4, totalCost: 300 }, { id: 5, totalCost: 300 }, { id: 6, totalCost: 300 }
];

// Check progression triggers advance to Epoch 2 at wave 9
nb.checkEpochProgression();
assert.strictEqual(G.epoch.current, 2, 'Automatic check should advance game to Epoch 2 at wave 9');

// Advance loop tick
G.epoch.orbitalCooldown = 5.0;
nb.updateEpochSystems(1.0);
assert(G.epoch.orbitalCooldown < 5.0, 'Update loop should smoothly decrement orbital cooldown');

console.log('\nAll 7 Bastion TD 22.0 Epoch Horizon test suites passed successfully!\n');
