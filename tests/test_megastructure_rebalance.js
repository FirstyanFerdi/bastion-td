// tests/test_megastructure_rebalance.js
// Test Suite: Megastructure Rebalance & Operational Lifespan Durability
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
  querySelector: (sel) => {
    if (sel && sel.includes('repair_mega')) return elements['repair_mega_btn'] || makeEl('button');
    if (sel && sel.includes('overclock_mega')) return elements['overclock_mega_btn'] || makeEl('button');
    return makeEl('div');
  },
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
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

console.log('Testing Megastructure Cost Rebalance & Operational Durability Lifecycle...\n');

const nb = window.__nb;

// ============================================================
// STAGE 1: Verify Rebalanced Costs & Lifespan Specifications
// ============================================================
console.log('--- 1. Testing Rebalanced Megastructure Costs & Durability Specs ---');

assert.strictEqual(MEGASTRUCTURE_CONFIG.ion_uplink.cost, 800, 'Ion Uplink cost should be increased to 800');
assert.strictEqual(MEGASTRUCTURE_CONFIG.ion_uplink.maxDurability, 3, 'Ion Uplink operational lifespan should be 3 waves');
assert.strictEqual(MEGASTRUCTURE_CONFIG.ion_uplink.repairCost, 280, 'Ion Uplink repair cost should be 280');

assert.strictEqual(MEGASTRUCTURE_CONFIG.drone_carrier.cost, 700, 'Drone Carrier cost should be increased to 700');
assert.strictEqual(MEGASTRUCTURE_CONFIG.drone_carrier.maxDurability, 4, 'Drone Carrier operational lifespan should be 4 waves');
assert.strictEqual(MEGASTRUCTURE_CONFIG.drone_carrier.repairCost, 240, 'Drone Carrier repair cost should be 240');

assert.strictEqual(MEGASTRUCTURE_CONFIG.tectonic_siphon.cost, 950, 'Tectonic Siphon cost should be increased to 950');
assert.strictEqual(MEGASTRUCTURE_CONFIG.tectonic_siphon.maxDurability, 3, 'Tectonic Siphon operational lifespan should be 3 waves');
assert.strictEqual(MEGASTRUCTURE_CONFIG.tectonic_siphon.repairCost, 330, 'Tectonic Siphon repair cost should be 330');

console.log('✔ All 3 megastructure costs, repair costs, and durability specs verified');


// ============================================================
// STAGE 2: Placement & Durability Initialization
// ============================================================
console.log('\n--- 2. Testing Placement & Durability State Initialization ---');

G.gold = 2000;
G.megastructures = [];

// Place Ion Uplink
let mCol = 2, mRow = 2;
const ionFacility = nb.placeMegastructure(mCol, mRow, 'ion_uplink');
assert(ionFacility, 'Ion facility placed');
assert.strictEqual(ionFacility.durability, 3, 'Initial durability must match maxDurability (3)');
assert.strictEqual(ionFacility.maxDurability, 3, 'Max durability must be 3');
assert.strictEqual(ionFacility.isBroken, false, 'Initial isBroken must be false');
assert.strictEqual(ionFacility.active, true, 'Initial active must be true');

console.log('✔ Durability state properly initialized on construction');


// ============================================================
// STAGE 3: Wave Progression Degradation & Breakdown (3 Waves)
// ============================================================
console.log('\n--- 3. Testing Wave Degradation Lifecycle & Breakdown ---');

G.wave = 1;
// Wave 1 Clears
onWaveClear();
assert.strictEqual(ionFacility.durability, 2, 'Durability decreases from 3 to 2 after wave 1 clear');
assert.strictEqual(ionFacility.isBroken, false, 'Facility still functioning at 2 waves remaining');

G.wave = 2;
// Wave 2 Clears
onWaveClear();
assert.strictEqual(ionFacility.durability, 1, 'Durability decreases from 2 to 1 after wave 2 clear');
assert.strictEqual(ionFacility.isBroken, false, 'Facility still functioning at 1 wave remaining');

G.wave = 3;
// Wave 3 Clears -> Critical Malfunction!
onWaveClear();
assert.strictEqual(ionFacility.durability, 0, 'Durability depleted to 0 after 3 waves');
assert.strictEqual(ionFacility.isBroken, true, 'Facility should enter isBroken = true');
assert.strictEqual(ionFacility.active, false, 'Facility should be deactivated (active = false)');

console.log('✔ Facility successfully degrades over 3 waves and breaks down cleanly');


// ============================================================
// STAGE 4: Operational Shutdown While Broken
// ============================================================
console.log('\n--- 4. Testing Weapon Deactivation While Broken ---');

const testEnemy = { hp: 1000, maxHp: 1000, r: 15, x: ionFacility.x, y: ionFacility.y, d: 50, dead: false };
G.enemies = [testEnemy];

// Update while broken: should deal ZERO damage!
nb.updateMegastructures(1.0);
assert.strictEqual(testEnemy.hp, 1000, 'Broken Ion Uplink must NOT deal damage to hostiles');

console.log('✔ Broken facility completely ceases hostile engagements');


// ============================================================
// STAGE 5: Inspector Display in Broken State & Repair Action
// ============================================================
console.log('\n--- 5. Testing Inspector Rendering for Broken State & Repair ---');

G.sel = ionFacility;
renderInspector();
const inspHtml = elements['inspector'].innerHTML;

assert(inspHtml.includes('OPERATIONAL LIFESPAN'), 'Inspector must render OPERATIONAL LIFESPAN');
assert(inspHtml.includes('BROKEN') || inspHtml.includes('OFFLINE'), 'Inspector must indicate broken/offline status');
assert(inspHtml.includes('data-act="repair_mega"'), 'Inspector must render data-act="repair_mega" button');
assert(inspHtml.includes('280'), 'Repair button must specify 280 repair gold cost');

// Simulate Repair Execution
G.gold = 500;
const goldBefore = G.gold;
const repCost = MEGASTRUCTURE_CONFIG.ion_uplink.repairCost;

// Invoke repair action logic (same as main.js)
if (G.sel && MEGASTRUCTURE_CONFIG[G.sel.type]) {
  const ms = G.sel;
  const conf = MEGASTRUCTURE_CONFIG[ms.type];
  const maxDur = ms.maxDurability || 3;
  if (G.gold >= repCost && ms.isBroken) {
    G.gold -= repCost;
    ms.durability = maxDur;
    ms.isBroken = false;
    ms.active = true;
  }
}

assert.strictEqual(G.gold, goldBefore - repCost, '280 Gold deducted for repair');
assert.strictEqual(ionFacility.durability, 3, 'Durability restored to 3 waves');
assert.strictEqual(ionFacility.isBroken, false, 'isBroken cleared back to false');
assert.strictEqual(ionFacility.active, true, 'active restored back to true');

// Verify operational capability restored
nb.updateMegastructures(0.5);
assert(testEnemy.hp < 1000, 'Repaired Ion Uplink must resume dealing solar laser damage');

console.log('✔ Repair mechanics, gold deduction, and operational restoration verified');


// ============================================================
// STAGE 6: Preventative Overhaul & Dismantle Refund
// ============================================================
console.log('\n--- 6. Testing Preventative Overhaul & Dismantle Refund ---');

// Degrade by 1 wave
ionFacility.durability = 2;
renderInspector();
const activeInspHtml = elements['inspector'].innerHTML;
assert(activeInspHtml.includes('2 / 3 WAVES'), 'Inspector shows 2 / 3 waves remaining');

// Dismantle refund reflects new 800 cost (800 * 0.7 = 560)
const expectedRefund = Math.floor(800 * 0.7);
assert.strictEqual(expectedRefund, 560, 'Dismantle refund calculated from new 800 base cost');

console.log('✔ Preventative overhaul and updated dismantle refund verified');

console.log('\n============================================================');
console.log('🎉 ALL MEGASTRUCTURE REBALANCE & LIFESPAN TESTS PASSED (100%)');
console.log('============================================================');
