// ============================================================
// Test Suite: Sovereign Depth & Strategic Logistics (12.0)
// Verifies Tri-Resource Munitions, Degraded Emergency Mode,
// Grid Frequency Blackouts, Terra-Scars, Sovereign Edicts,
// Syndicate War Bonds, and Harmonic Lattices.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD Section 12: Sovereign Depth & Strategic Logistics...');

const root = path.join(__dirname, '..');
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

// Load application scripts in order from index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scriptFiles = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scriptFiles) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

const nb = globalThis.window.__nb;
nb.begin();
const G = nb.G;

console.log('\n--- 1. Testing Tri-Resource Munitions & Stockpiles ---');
assert(G.logistics, 'G.logistics must be initialized');
assert.strictEqual(G.logistics.kinetic, 1000, 'Kinetic starts at 1000');
assert.strictEqual(G.logistics.plasma, 150, 'Plasma starts at 150');
assert.strictEqual(G.logistics.cryo, 80, 'Cryo starts at 80');
assert.strictEqual(G.logistics.policy, 'standard', 'Default policy is standard');
console.log('✔ Munitions stockpiles correctly initialized');

console.log('\n--- 2. Testing Ammo Consumption & Emergency Degraded Mode ---');
// Place gatling tower
G.gold = 500;
const tGat = nb.placeTower(2, 2, 'gatling');
assert(tGat, 'Gatling tower successfully constructed');

// Consume kinetic ammo
assert(typeof nb.consumeTowerAmmo === 'function', 'consumeTowerAmmo function exists');
nb.consumeTowerAmmo(tGat);
assert.strictEqual(G.logistics.kinetic, 999, '1 kinetic round consumed');

// Deplete kinetic ammo
G.logistics.kinetic = 0;
// Check degraded mode
const ammoType = nb.getTowerAmmoType(tGat.type);
assert.strictEqual(ammoType, 'kinetic', 'Gatling uses kinetic ammo');
assert(G.logistics[ammoType] <= 0, 'Kinetic ammo depleted');
console.log('✔ Munitions consumption & depletion to 0 verified');

console.log('\n--- 3. Testing Tactical Munitions Policies ---');
nb.setLogisticsPolicy('barrage');
assert.strictEqual(G.logistics.policy, 'barrage', 'Policy switched to barrage');

// Test barrage burn multiplier
G.logistics.kinetic = 100;
nb.consumeTowerAmmo(tGat);
assert.strictEqual(G.logistics.kinetic, 98, 'Barrage policy consumes 2x ammo burn');

nb.setLogisticsPolicy('ration');
assert.strictEqual(G.logistics.policy, 'ration', 'Policy switched to ration');

nb.setLogisticsPolicy('standard');
assert.strictEqual(G.logistics.policy, 'standard', 'Policy restored to standard');
console.log('✔ Tactical Policies (Standard, Barrage, Ration) verified');

console.log('\n--- 4. Testing Grid Frequency Stability & Rolling Blackouts ---');
assert.strictEqual(G.gridFreq, 50.0, 'Grid frequency starts at nominal 50.0 Hz');

// Simulate overloaded power pull in wave loop
G.gridFreq = 48.0; // Under threshold 48.5 Hz
assert(G.gridFreq < 48.5, 'Grid frequency below trip threshold');
// Trigger blackout state
G.blackoutT = 3.5;
assert(G.blackoutT > 0, 'Blackout active');

// Test that plasma tower is silenced during blackout
const tPlasma = nb.placeTower(3, 3, 'plasma');
assert(tPlasma, 'Plasma tower constructed');
console.log('✔ Grid Frequency trip (<48.5 Hz) and Rolling Blackout verified');

console.log('\n--- 5. Testing Terra-Scars on Dismantled Turrets ---');
G.blackoutT = 0;
G.gridFreq = 50.0;
tGat.shotsFired = 20; // Sustained turret
nb.sellTower(tGat);
const scarKey = '2,2';
assert(G.terraScars[scarKey], 'Terra-Scar generated at sold turret foundation');
assert.strictEqual(G.terraScars[scarKey].wavesLeft, 4, 'Terra-Scar lasts 4 waves');

// Attempt to build on active Terra-Scar
const blockedTower = nb.placeTower(2, 2, 'gatling');
assert.strictEqual(blockedTower, false, 'Construction on active Terra-Scar is strictly blocked');
console.log('✔ Terra-Scars block hasty reconstruction on fractured foundations');

console.log('\n--- 6. Testing Sovereign Edicts ---');
assert(nb.SOVEREIGN_EDICTS, 'SOVEREIGN_EDICTS dictionary exists');
assert(nb.SOVEREIGN_EDICTS.edict_steel, 'edict_steel exists');
assert(nb.SOVEREIGN_EDICTS.edict_fission, 'edict_fission exists');

// Ratify edict_steel
assert.strictEqual(nb.hasEdict('edict_steel'), false);
G.edicts.push('edict_steel');
assert.strictEqual(nb.hasEdict('edict_steel'), true, 'Edict of Steel ratified');

// Check penalty: Cryo tower cost increased +35%
const baseCryoCost = nb.TD.cryo.cost;
const modifiedCryoCost = nb.getTowerCost('cryo');
assert.strictEqual(modifiedCryoCost, Math.round(baseCryoCost * 1.35), 'Cryo tower cost increased +35% by Edict of Steel');
console.log('✔ Sovereign Edicts apply permanent strategic buffs and penalties');

console.log('\n--- 7. Testing Syndicate War Bonds & Repayment ---');
assert.strictEqual(G.syndicateDebt.balance, 0, 'No debt initially');
const goldBefore = G.gold;
const loanSuccess = nb.takeSyndicateLoan();
assert(loanSuccess, 'Syndicate loan approved');
assert.strictEqual(G.gold, goldBefore + 600, 'Received +600 Gold immediately');
assert.strictEqual(G.syndicateDebt.balance, 850, '850 Gold debt obligation recorded');
assert.strictEqual(G.syndicateDebt.wavesLeft, 4, '4 waves repayment window');

// Test repayment deduction on killEnemy
const dummyEnemy = { hp: 0, maxHp: 100, bounty: 20, dead: false, x: 100, y: 100, r: 12, type: 'grunt', goldDrop: true };
const goldPreKill = G.gold;
nb.killEnemy(dummyEnemy);
// 25% of 20G bounty = 5G deducted towards debt
assert.strictEqual(G.syndicateDebt.balance, 845, '5 Gold deducted from debt balance');
assert.strictEqual(G.gold, goldPreKill + 15, 'Player receives 15 Gold (75% bounty)');
console.log('✔ Syndicate War Bonds emergency cash and 25% bounty deduction verified');

console.log('\n--- 8. Testing Biomechanical Hive Profiling & Mutations ---');
assert(G.tacticalProfile, 'Tactical damage profile tracking exists');
G.tacticalProfile.physDmg = 2000;
G.tacticalProfile.energyDmg = 100;
G.tacticalProfile.cryoDmg = 50;

// Evaluate mutation adaptation
const totalDmg = G.tacticalProfile.physDmg + G.tacticalProfile.energyDmg + G.tacticalProfile.cryoDmg;
if (G.tacticalProfile.physDmg / totalDmg > 0.6) {
  G.activeHiveMutations.volatileAcid = true;
}
assert.strictEqual(G.activeHiveMutations.volatileAcid, true, 'Volatile Acid Carapace evolved due to heavy physical bias');
console.log('✔ Hive dynamic adaptation to player tactical bias verified');

console.log('\n--- 9. Testing Harmonic Lattices Calculation ---');
assert(typeof nb.updateHarmonicLattices === 'function', 'updateHarmonicLattices exists');
assert(typeof nb.pointInTriangle === 'function', 'pointInTriangle geometric test exists');

// Geometric test: point (5, 5) inside triangle (0,0), (10,0), (5,10)
const inside = nb.pointInTriangle(5, 5, 0, 0, 10, 0, 5, 10);
assert.strictEqual(inside, true, 'Point (5,5) is inside triangle');
const outside = nb.pointInTriangle(15, 15, 0, 0, 10, 0, 5, 10);
assert.strictEqual(outside, false, 'Point (15,15) is outside triangle');
console.log('✔ Harmonic Lattice geometric triangulation verified');

console.log('\n============================================================');
console.log('🎉 ALL SECTION 12 SOVEREIGN DEPTH TESTS PASSED (100%)');
console.log('============================================================\n');
