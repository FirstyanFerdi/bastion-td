// ============================================================
// Test Suite: Bastion TD 24.0 - The Living Biosphere & Dynamic Commodity Crucible
// Tests:
// 1. Thermodynamic Footprint Accumulation & Weather State Machine (Superheat / Glacial)
// 2. Bio-Scrubber Terraforming & Bio-Fuel Generation
// 3. Interstellar Commodity Bourse & Dynamic Price Elasticity
// 4. Commodity Futures Speculation & Dividend Settlement
// 5. Reactive Geomorphic Node Reactions (Hellfire Ignition, Frost Slick, Magnetic EMP)
// 6. Biosphere Retribution (Spore Eclipse Fog & Bio-Titan Root-Walker) & Sensor Flare
// 7. Symbiotic Golden Ratio Harmonization & Super-Bloom (Free Logistics & Broodling Spawn)
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 24.0: The Living Biosphere & Dynamic Commodity Crucible...\n');

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

console.log('--- 1. Testing Thermodynamic Footprint Accumulation & Weather State Machine ---');
assert(nb.BIOSPHERE_CONFIG, 'BIOSPHERE_CONFIG must be defined in data.js');
assert(G.biosphere, 'G.biosphere must be initialized in newGame()');
assert(G.bourse, 'G.bourse must be initialized in newGame()');

const foe1 = { id: 1, type: 'brute', hp: 2000, maxHp: 2000, dead: false, x: 200, y: 200 };
G.enemies = [foe1];

// Deal massive plasma damage to drive footprint into Superheat
nb.dealDamage(foe1, 1500, 'plasma');
assert(G.biosphere.footprint > 0, 'Plasma damage should increase ecological footprint (heat accumulation)');
nb.updateBiosphereSystems(0.1);
assert.strictEqual(G.biosphere.state, 'superheat', 'Footprint >= 100 should transition state to superheat');
assert.strictEqual(G.biosphere.inHarmony, false, 'Superheat state should disable harmony');
console.log('Superheat state verified with footprint:', G.biosphere.footprint);

// Deal massive cryo damage to cool down and freeze into Glacial state
const foe2 = { id: 2, type: 'brute', hp: 3000, maxHp: 3000, dead: false, x: 200, y: 200 };
G.enemies.push(foe2);
nb.dealDamage(foe2, 2800, 'cryo');
nb.updateBiosphereSystems(0.1);
assert(G.biosphere.footprint <= -100, 'Cryo damage should drive footprint into deep negative territory');
assert.strictEqual(G.biosphere.state, 'glacial', 'Footprint <= -100 should transition state to glacial');
console.log('Glacial permafrost state verified with footprint:', G.biosphere.footprint);

console.log('--- 2. Testing Bio-Scrubber Terraforming & Bio-Fuel Generation ---');
G.gold = 300;
const scrubbed = nb.deployBioScrubber(2, 2);
assert(scrubbed, 'Deploying bio-scrubber should succeed when gold is sufficient');
assert.strictEqual(G.gold, 180, 'Deploying bio-scrubber should deduct 120 Gold');
assert.strictEqual(G.biosphere.scrubbers.length, 1, 'Scrubber should be registered in G.biosphere.scrubbers');

// Update systems and verify scrubber pulls footprint towards 0 and generates bio-fuel gold
const initialFootprint = G.biosphere.footprint;
const preFuelGold = G.gold;
nb.updateBiosphereSystems(6.0); // 6s to trigger bio-fuel (>5s)
assert(G.biosphere.footprint > initialFootprint, 'Bio-scrubber should remediate negative footprint towards 0');
assert(G.gold > preFuelGold, 'Bio-scrubber should generate bio-fuel revenue (+15G)');
console.log('Bio-Scrubber terraforming and bio-fuel generation verified successfully.');

console.log('--- 3. Testing Interstellar Commodity Bourse & Dynamic Price Elasticity ---');
const initialTiPrice = G.bourse.prices.titanium;
const initialTiHoldings = G.bourse.holdings.titanium;
G.gold = 1000;

// Execute Buy Order
const buySuccess = nb.executeCommodityTrade('titanium', 'buy', 10);
assert(buySuccess, 'Commodity buy trade should succeed with sufficient gold');
assert(G.bourse.holdings.titanium === initialTiHoldings + 10, 'Holdings should increase by purchased amount');
assert(G.bourse.prices.titanium > initialTiPrice, 'Buying commodity should cause price inflation');
console.log('Commodity buy execution verified. New Ti price:', G.bourse.prices.titanium);

// Execute Sell Order
const preSellGold = G.gold;
const sellSuccess = nb.executeCommodityTrade('titanium', 'sell', 5);
assert(sellSuccess, 'Commodity sell trade should succeed');
assert(G.gold > preSellGold, 'Selling commodity should yield gold revenue');
console.log('Commodity sell execution verified.');

console.log('--- 4. Testing Commodity Futures Speculation & Dividend Settlement ---');
G.wave = 3;
const preFuturesGold = G.gold;
const futuresSuccess = nb.executeCommodityTrade('promethium', 'futures', 20);
assert(futuresSuccess, 'Futures contract buy should succeed');
assert.strictEqual(G.bourse.futures.length, 1, 'Futures contract should be registered in G.bourse.futures');

// Artificially simulate price surge of promethium
G.bourse.prices.promethium += 40; // Bull market surge!
G.wave = 4; // Advance to wave target

const preSettlementGold = G.gold;
nb.settleBiosphereWave();
assert.strictEqual(G.bourse.futures.length, 0, 'Settled futures contract should be removed');
assert(G.gold > preSettlementGold, 'Settling profitable futures contract should pay out margin + profit');
assert(SAVE.futuresProfit > 0, 'SAVE.futuresProfit should record cumulative futures returns');
console.log('Commodity Futures speculation and dividend payout verified successfully.');

console.log('--- 5. Testing Reactive Geomorphic Node Reactions ---');
const ventNode = G.biosphere.geomorphicNodes.find(n => n.type === 'oil_vent');
assert(ventNode, 'Oil vent node must exist in geomorphic nodes');

// Trigger plasma on oil vent -> Hellfire Wall ignition
nb.triggerGeomorphicReaction(ventNode.id, 'plasma');
assert.strictEqual(ventNode.state, 'ignited', 'Plasma damage on oil vent should ignite Hellfire Wall');
assert(ventNode.stateTimer > 0, 'Ignited oil vent should have active countdown timer');

// Test damage from ignited oil vent to enemy in radius
const victim = { id: 99, type: 'swarm', hp: 300, maxHp: 300, dead: false, x: ventNode.x, y: ventNode.y };
G.enemies = [victim];
nb.updateBiosphereSystems(1.0);
assert(victim.hp < 300, 'Ignited Hellfire Wall should burn hostiles standing within its radius');
console.log('Oil vent Hellfire Wall ignition and burning verified.');

// Trigger cryo on oil vent -> Frost Slick freezing
ventNode.state = 'idle';
nb.triggerGeomorphicReaction(ventNode.id, 'cryo');
assert.strictEqual(ventNode.state, 'frozen', 'Cryo damage on oil vent should freeze Frost Slick');
console.log('Oil vent Frost Slick freezing verified.');

// Test Magnetic Lodestone EMP discharge
const lodeNode = G.biosphere.geomorphicNodes.find(n => n.type === 'magnetic_lodestone');
assert(lodeNode, 'Lodestone node must exist in geomorphic nodes');
for (let h = 0; h < 10; h++) {
  nb.triggerGeomorphicReaction(lodeNode.id, 'rail');
}
assert.strictEqual(lodeNode.charges, 0, '10 Railgun hits should discharge EMP and reset charges');
console.log('Magnetic Lodestone EMP discharge verified.');

console.log('--- 6. Testing Biosphere Retribution & Sensor Flare ---');
G.enemiesKilled = 120;
G.leakedThisWave = 1;
nb.updateBiosphereSystems(0.5);
assert(G.biosphere.immuneIndex >= 85, 'High kill ratio should increase planetary immune index');
assert(G.biosphere.sporeFogActive, 'Immune index >= 85 should trigger Spore Eclipse Fog');

// Sensor Flare deployment
const flareX = 400, flareY = 300;
const flareResult = nb.fireSensorFlare(flareX, flareY);
assert(flareResult, 'Firing sensor flare should succeed');
assert.strictEqual(G.biosphere.sensorFlares.length, 1, 'Sensor flare should be registered');
assert.strictEqual(G.biosphere.sensorFlares[0].x, flareX, 'Flare x coordinate should match');

// Biosphere Root-Walker spawn at 100% immune index
G.biosphere.immuneIndex = 100;
nb.updateBiosphereSystems(0.5);
const rootWalker = G.enemies.find(e => e.isRootWalker && !e.dead);
assert(rootWalker, '100% Planetary immune index should spawn Bio-Titan Root-Walker');
console.log('Biosphere Retribution and Sensor Flare verified successfully.');

console.log('--- 7. Testing Symbiotic Golden Ratio Harmonization & Super-Bloom ---');
// Return footprint to perfect equilibrium
G.biosphere.footprint = 0;
nb.updateBiosphereSystems(0.1);
assert.strictEqual(G.biosphere.state, 'harmony', 'Footprint within [-35, 35] should achieve harmony state');
assert.strictEqual(G.biosphere.inHarmony, true, 'inHarmony must be true');

// Simulate broodling spawn
nb.updateBiosphereSystems(15.0); // > 14s broodling interval
assert(G.biosphere.symbioticBroodlings.length >= 1, 'Symbiotic harmony should spawn friendly Broodling allies');
const broodling = G.biosphere.symbioticBroodlings[0];
assert(broodling.dps > 0, 'Broodling ally should possess combat DPS');

// Settle wave in harmony -> verify Super-Bloom 2x rewards
const preBloomGold = G.gold;
const preBloomCores = SAVE.cores || 0;
nb.settleBiosphereWave();
assert(G.gold > preBloomGold, 'Harmony Super-Bloom should award large bonus Gold');
assert(SAVE.cores > preBloomCores, 'Harmony Super-Bloom should award Nanite Cores (+2 Cores)');
console.log('Symbiotic Golden Ratio Harmonization and Super-Bloom rewards verified successfully.');

console.log('\nAll 7 Bastion TD 24.0 Living Biosphere test suites passed successfully!\n');
