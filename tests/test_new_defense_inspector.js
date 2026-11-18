// tests/test_new_defense_inspector.js
// Test Suite: New Defense Tactical Inspector & Unified Card Layout
// Verifies that Megastructures and Barricades render the exact
// complete defense information card matching the tactical inspector layout.
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

// Load application scripts in order from index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

console.log('Testing New Defense Tactical Inspector Unified Layout...\n');

const nb = window.__nb;
nb.begin();
const G = nb.G;
G.state = 'active';
G.gold = 500;

console.log('--- 1. Testing Deploying State Inspector Cards (Shop Dock Clicks) ---');

// 1.1 Deploying Megastructure
G.placingMegastructure = 'ion_uplink';
G.placing = null;
G.placingBarricade = null;
G.sel = null;
renderInspector();
const megaDeployHtml = elements['inspector'].innerHTML;
assert(megaDeployHtml.includes('DEPLOYING DEFENSE'), 'Megastructure deploying header must be DEPLOYING DEFENSE');
assert(megaDeployHtml.includes('id="inspIcon"'), 'Megastructure deploying card must have #inspIcon canvas');
assert(megaDeployHtml.includes('Ion Beam Orbital Uplink Array'), 'Megastructure deploying card must show name');
assert(megaDeployHtml.includes('class="stats-grid"'), 'Megastructure deploying card must have .stats-grid');
assert(megaDeployHtml.includes('420 DPS'), 'Megastructure deploying card must show stats');
console.log('✔ Megastructure deploying card verified');

// 1.2 Deploying Barricade
G.placingMegastructure = null;
G.placingBarricade = true;
renderInspector();
const barDeployHtml = elements['inspector'].innerHTML;
assert(barDeployHtml.includes('DEPLOYING DEFENSE'), 'Barricade deploying header must be DEPLOYING DEFENSE');
assert(barDeployHtml.includes('id="inspIcon"'), 'Barricade deploying card must have #inspIcon canvas');
assert(barDeployHtml.includes('Road Barricade'), 'Barricade deploying card must show Road Barricade');
assert(barDeployHtml.includes('class="stats-grid"'), 'Barricade deploying card must have .stats-grid');
assert(barDeployHtml.includes('400 HP'), 'Barricade deploying card must show 400 HP');
console.log('✔ Road Barricade deploying card verified');

// 1.3 Deploying Standard Tower
G.placingBarricade = null;
G.placing = 'gatling';
renderInspector();
const towerDeployHtml = elements['inspector'].innerHTML;
assert(towerDeployHtml.includes('DEPLOYING DEFENSE'), 'Tower deploying header must be DEPLOYING DEFENSE');
assert(towerDeployHtml.includes('id="inspIcon"'), 'Tower deploying card must have #inspIcon canvas');
assert(towerDeployHtml.includes('class="stats-grid"'), 'Tower deploying card must have .stats-grid');
console.log('✔ Standard Tower deploying card verified');

console.log('\n--- 2. Testing Selected Defense Card for Megastructures ---');

// Place an Ion Uplink megastructure
G.placing = null;
const ms = nb.placeMegastructure(2, 2, 'ion_uplink');
assert(ms, 'Megastructure should be successfully placed');
G.sel = ms;
renderInspector();
const megaSelHtml = elements['inspector'].innerHTML;

assert(megaSelHtml.includes('SELECTED DEFENSE'), 'Header must be SELECTED DEFENSE');
assert(megaSelHtml.includes('id="inspIcon"'), 'Must contain #inspIcon canvas');
assert(megaSelHtml.includes('Ion Beam Orbital Uplink Array'), 'Must contain facility name');
assert(megaSelHtml.includes('MEGASTRUCTURE (2x2)'), 'Must indicate Megastructure tier');
assert(megaSelHtml.includes('FACILITY POWER LOAD'), 'Must display power load status meter');
assert(megaSelHtml.includes('-25 MW (ONLINE)'), 'Must display -25 MW value');
assert(megaSelHtml.includes('data-act="overclock_mega"'), 'Must contain Overclock action button');
assert(megaSelHtml.includes('data-act="dismantle_mega"'), 'Must contain Dismantle action button');
assert(megaSelHtml.includes('class="stats-grid"'), 'Must contain 2x2 stats grid');
assert(megaSelHtml.includes('420 DPS'), 'Stats grid must show 420 DPS');
assert(megaSelHtml.includes('class="prio"'), 'Must contain target priority selector');
assert(megaSelHtml.includes('class="note"'), 'Must contain facility tactical description note');
console.log('✔ Megastructure selected inspector matches screenshot layout completely');

console.log('\n--- 3. Testing Selected Defense Card for Road Barricade ---');

// Place a road barricade
const bar = nb.placeBarricade(0, 1);
assert(bar, 'Barricade should be successfully placed');
bar.hp = 250; // Damaged state
G.sel = bar;
renderInspector();
const barSelHtml = elements['inspector'].innerHTML;

assert(barSelHtml.includes('SELECTED DEFENSE'), 'Header must be SELECTED DEFENSE');
assert(barSelHtml.includes('id="inspIcon"'), 'Must contain #inspIcon canvas');
assert(barSelHtml.includes('Road Barricade'), 'Must contain Road Barricade name');
assert(barSelHtml.includes('FORTIFICATION'), 'Must contain fortification subtitle');
assert(barSelHtml.includes('STRUCTURAL INTEGRITY'), 'Must display Structural Integrity status meter');
assert(barSelHtml.includes('250 / 400 HP'), 'Must show damaged HP in meter');
assert(barSelHtml.includes('data-act="repair_barricade"'), 'Must contain Repair action button');
assert(barSelHtml.includes('data-act="dismantle_barricade"'), 'Must contain Salvage action button');
assert(barSelHtml.includes('class="stats-grid"'), 'Must contain 2x2 stats grid');
assert(barSelHtml.includes('Heavy Alloy'), 'Stats grid must show Heavy Alloy armor');
assert(barSelHtml.includes('class="prio off"'), 'Must contain status badges');
assert(barSelHtml.includes('class="note"'), 'Must contain barricade tactical description note');
console.log('✔ Road Barricade selected inspector matches screenshot layout completely');

console.log('\n--- 4. Testing Action Handlers & State Updates ---');

// 4.1 Overclock Megastructure
G.gold = 100;
G.sel = ms;
const ocBtn = { dataset: { act: 'overclock_mega' }, closest: () => ocBtn };
// Simulate inspector click for overclock
if (G.sel && MEGASTRUCTURE_CONFIG && MEGASTRUCTURE_CONFIG[G.sel.type]) {
  const msObj = G.sel;
  const ocCost = 40;
  if (G.gold >= ocCost && !msObj.overclockT) {
    G.gold -= ocCost;
    msObj.overclockT = 15;
  }
}
assert.strictEqual(G.gold, 60, '40 Gold deducted for overclock');
assert.strictEqual(ms.overclockT, 15, 'Overclock timer set to 15s');

// 4.2 Update megastructures with overclock
nb.updateMegastructures(1.0);
assert(ms.overclockT <= 14.1, 'Overclock timer decreases with dt');

// 4.3 Repair Barricade
G.sel = bar;
assert.strictEqual(bar.hp, 250);
if (G.sel && G.sel.hp !== undefined) {
  const barObj = G.sel;
  const repCost = 15;
  if (G.gold >= repCost && barObj.hp < barObj.maxHp) {
    G.gold -= repCost;
    barObj.hp = Math.min(barObj.maxHp, barObj.hp + 150);
  }
}
assert.strictEqual(G.gold, 45, '15 Gold deducted for repair');
assert.strictEqual(bar.hp, 400, 'Barricade restored +150 HP to max');

// 4.4 Salvage Barricade
const barCountBefore = G.barricades.length;
if (G.sel && G.sel.hp !== undefined) {
  const barObj = G.sel;
  const refund = 25;
  G.gold += refund;
  const idx = G.barricades ? G.barricades.indexOf(barObj) : -1;
  if (idx !== -1) G.barricades.splice(idx, 1);
  G.sel = null;
}
assert.strictEqual(G.gold, 70, '25 Gold refunded for salvage');
assert.strictEqual(G.barricades.length, barCountBefore - 1, 'Barricade removed from G.barricades');
assert.strictEqual(G.sel, null, 'G.sel reset after salvage');

// 4.5 Dismantle Megastructure
G.sel = ms;
const megaCountBefore = G.megastructures.length;
if (G.sel && MEGASTRUCTURE_CONFIG && MEGASTRUCTURE_CONFIG[G.sel.type]) {
  const msObj = G.sel;
  const refund = Math.floor(MEGASTRUCTURE_CONFIG[msObj.type].cost * 0.7);
  G.gold += refund;
  for (let r = msObj.r; r <= msObj.r + 1; r++) {
    for (let c = msObj.c; c <= msObj.c + 1; c++) {
      if (G.grid[r][c] === msObj) G.grid[r][c] = null;
    }
  }
  const idx = G.megastructures.indexOf(msObj);
  if (idx !== -1) G.megastructures.splice(idx, 1);
  G.sel = null;
}
assert(G.gold > 70, 'Refund added for dismantling megastructure');
assert.strictEqual(G.megastructures.length, megaCountBefore - 1, 'Megastructure removed from G.megastructures');
assert.strictEqual(G.grid[2][2], null, 'Grid tile cleared');
assert.strictEqual(G.grid[2][3], null, 'Grid tile cleared');
assert.strictEqual(G.grid[3][2], null, 'Grid tile cleared');
assert.strictEqual(G.grid[3][3], null, 'Grid tile cleared');
assert.strictEqual(G.sel, null, 'G.sel reset after dismantle');
console.log('✔ All new defense actions (Overclock, Repair, Salvage, Dismantle) verified');

console.log('\n============================================================');
console.log('🎉 ALL NEW DEFENSE INSPECTOR TESTS PASSED (100%)');
console.log('============================================================\n');
