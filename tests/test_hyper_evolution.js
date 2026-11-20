// ============================================================
// Test Suite: Bastion TD 14.0 - The Omni-Resonance Matrix & Hyper-Evolution
// Tests: Frankenstein Foundry, Chemical Alchemy Matrix, Sentient Hivemind
// Evolution, Quantum Syndicate Bourse & Void Bargains, Titan Mech Exosuit
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 14.0: The Omni-Resonance Matrix & Hyper-Evolution...\n');

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
G.gold = 5000;

console.log('--- 1. Testing Frankenstein Foundry Custom Tower Assembly ---');
assert(nb.FRANKENSTEIN_FOUNDRY_CONFIG, 'Frankenstein Foundry config must exist');
const customTower = nb.craftCustomTower('hex_hover_drone', 'tesla_arc', 'apex_sniper', 2, 2);
assert(customTower, 'Should craft custom tower successfully');
assert.strictEqual(customTower.isCustom, true, 'Crafted tower is marked custom');
assert.strictEqual(customTower.chassis, 'hex_hover_drone', 'Chassis correctly assigned');
assert.strictEqual(customTower.payload, 'tesla_arc', 'Payload correctly assigned');
assert.strictEqual(customTower.cpu, 'apex_sniper', 'CPU correctly assigned');
assert(G.customChassis.includes(customTower), 'Custom tower registered in G.customChassis');
console.log('✔ Frankenstein Foundry custom tower crafting verified');

console.log('\n--- 2. Testing Titan Mech Tower Lift & Mobile Shoulder Firing ---');
G.mech = { x: customTower.x, y: customTower.y, active: true, controlled: true };
const lifted = nb.titanLiftTower(customTower);
assert(lifted, 'Titan Mech should lift the custom tower');
assert.strictEqual(G.carriedTower, customTower, 'Tower is now carried on Mech shoulder');
assert.strictEqual(customTower.isCarried, true, 'Tower marked as carried');
assert.strictEqual(G.grid[customTower.r][customTower.c], null, 'Grid slot freed on lift');

// Move mech and update hyper evolution systems
G.mech.x = 400; G.mech.y = 300;
nb.updateHyperEvolutionSystems(0.1);
assert.strictEqual(customTower.x, 400, 'Carried tower coordinates sync with Mech x');
assert.strictEqual(customTower.y, 286, 'Carried tower coordinates offset above Mech y');

// Find an empty non-path tile to deploy
let deployC = -1, deployR = -1;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (!pathTile[r][c] && !G.grid[r][c]) {
      deployC = c; deployR = r; break;
    }
  }
  if (deployC !== -1) break;
}
assert(deployC !== -1, 'Must find an empty deploy tile');
const deployed = nb.titanDeployTower(deployC, deployR);
assert(deployed, 'Should deploy carried tower to empty tile');
assert.strictEqual(G.carriedTower, null, 'No carried tower after deployment');
assert.strictEqual(customTower.isCarried, false, 'Tower no longer carried');
assert.strictEqual(customTower.c, deployC, 'Tower col updated');
assert.strictEqual(customTower.r, deployR, 'Tower row updated');
assert.strictEqual(G.grid[deployR][deployC], customTower, 'Grid slot occupied by deployed tower');
console.log('✔ Titan Mech tower lift, mobile shoulder carry, and deployment verified');

console.log('\n--- 3. Testing Overcharge Hyper-Flux Tether ---');
G.mech.battery = 80;
const tethered = nb.tetherTowerOvercharge(customTower);
assert(tethered, 'Should activate hyper-flux tether');
assert(G.tetherActive, 'Tether active in state');
assert.strictEqual(G.mech.battery, 55, '25% battery consumed by tether');
assert(customTower.tetherOverchargeT > 0, 'Tower has tetherOverchargeT active');
console.log('✔ Overcharge hyper-flux tether verified');

console.log('\n--- 4. Testing Chemical Alchemy Matrix: Steam Clouds & Bio Gas Detonations ---');
nb.spawnSteamCloud(150, 150);
assert.strictEqual(G.steamClouds.length, 1, 'Steam cloud spawned');
const testEnemy = {
  id: 991, x: 150, y: 150, r: 12, hp: 100, maxHp: 100,
  armor: 0, dead: false, type: 'runner', speed: 60,
  slowAmt: 0, slowT: 0, inSteamCloud: false
};
G.enemies.push(testEnemy);
nb.updateEnemy(testEnemy, 0.05);
assert.strictEqual(testEnemy.inSteamCloud, true, 'Enemy inside steam cloud flagged inSteamCloud');

// Bio Gas Cloud and Thermobaric Detonation
nb.spawnBioGasCloud(250, 250);
assert.strictEqual(G.bioGasClouds.length, 1, 'Bio gas cloud spawned');
nb.detonateThermobaricBioGas(G.bioGasClouds[0]);
assert.strictEqual(G.bioGasClouds.length, 0, 'Bio gas cloud detonated and consumed');
console.log('✔ Steam cloud emergence and thermobaric bio-gas detonation verified');

console.log('\n--- 5. Testing Sentient Hivemind Evolution & Real-Time Bio-Metamorphosis ---');
const corpse = { x: 300, y: 300, consumed: false };
G.corpses = [corpse];
const swarmFeeder = {
  id: 992, x: 300, y: 300, r: 8, hp: 50, maxHp: 50,
  armor: 0, dead: false, type: 'swarm', biomassFeeds: 2
};
G.enemies = [swarmFeeder];
nb.updateHyperEvolutionSystems(0.1);
assert.strictEqual(corpse.consumed, true, 'Corpse consumed by swarm hostile');
assert.strictEqual(swarmFeeder.biomassFeeds, 3, 'Biomass feeds incremented to 3');
assert.strictEqual(swarmFeeder.name, 'Abyssal Apex Juggernaut', 'Hostile metamorphosed into Abyssal Apex Juggernaut');
assert.strictEqual(swarmFeeder.type, 'juggernaut', 'Type mutated to juggernaut');
assert(swarmFeeder.hp > 150, 'Apex Juggernaut HP amplified by 4.5x');
assert.strictEqual(swarmFeeder.armor, 0.65, 'Apex Juggernaut armor set to 0.65');
console.log('✔ Real-time necro-cannibalism and Apex Juggernaut metamorphosis verified');

console.log('\n--- 6. Testing Quantum Syndicate Bourse & Void Bargains ---');
assert(G.bourseCommodities, 'Commodities bourse initialized');
const initialGold = G.gold;
const bought = nb.tradeBourse('kinetic', 'buy', 10);
assert(bought, 'Commodity purchase should succeed');
assert.strictEqual(G.bourseHoldings.kinetic, 10, 'Holdings updated to 10');
assert(G.gold < initialGold, 'Gold deducted for purchase');

const sold = nb.tradeBourse('kinetic', 'sell', 10);
assert(sold, 'Commodity sale should succeed');
assert.strictEqual(G.bourseHoldings.kinetic, 0, 'Holdings reduced to 0');

// Void Bargain: Chronos Bankruptcy
const signed = nb.acceptVoidBargain('chronos_bankruptcy');
assert(signed, 'Void bargain signed');
assert(G.voidBargainsActive.includes('chronos_bankruptcy'), 'Pact active in voidBargainsActive');
assert(G.chronosBankruptcyWaves > 0, 'Chronos bankruptcy penalty waves active');
console.log('✔ Quantum Syndicate Bourse commodity trading and Void Bargains verified');

console.log('\n--- 7. Testing Titan Exosuit Archetype Switching ---');
assert.strictEqual(G.exosuitType, 'vanguard', 'Default exosuit is vanguard');
nb.setTitanExosuit('phantom');
assert.strictEqual(G.exosuitType, 'phantom', 'Exosuit switched to phantom');
nb.setTitanExosuit('archon');
assert.strictEqual(G.exosuitType, 'archon', 'Exosuit switched to archon');
console.log('✔ Titan Exosuit archetype switching verified');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 14.0 HYPER-EVOLUTION TESTS PASSED (100%)');
console.log('============================================================\n');
