// ============================================================
// Test Suite: Bastion TD 16.0 - The Adaptive Entropy Matrix
// Tests: Spatial HHI & Flank Breach, Shannon Index & Phenotypic Mutations,
// Prismatic 3-Element Detonation, Syndicate Siphon Rig & Heist Bounty,
// CC Lockout & Kinetic Rage Breakout, Thermal Shock Shatter, and TVM Ledger.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 16.0: The Adaptive Entropy Matrix (Anti-Dominant Strategy Protocol)...\n');

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

console.log('--- 1. Testing Spatial Clumping (HHI) & Flank Breach Infiltration ---');
assert(nb.ENTROPY_CONFIG, 'ENTROPY_CONFIG must be defined');

// Place 7 towers in tight 2-tile cluster
G.towers = [];
for (let i = 0; i < 7; i++) {
  G.towers.push({
    id: 1000 + i,
    x: 300 + (i % 3) * 20,
    y: 200 + Math.floor(i / 3) * 20,
    r: 2,
    row: 2,
    c: 2,
    type: 'gatling',
    tier: 0,
    invested: 150
  });
}

nb.updateEntropyProfiler(4.0);
assert(G.entropy.hhi >= 0.65, `Spatial HHI should detect killbox clumping (got ${G.entropy.hhi.toFixed(2)})`);
assert(G.entropy.clusterOverheated, 'Thermal micro-vortex activated over dense cluster');
assert(G.entropy.flankBreachWarningT > 0 || G.entropy.flankBreachActiveT > 0, 'Flank breach countdown triggered on persistent killbox');
console.log('✔ Spatial HHI killbox detection and Flank Breach warning verified');

console.log('\n--- 2. Testing Shannon Diversity Index & Phenotypic Mutations ---');
assert(nb.PHENOTYPIC_MUTATIONS, 'PHENOTYPIC_MUTATIONS must be defined');
// Simulate heavy Physical damage monoculture
G.dntm.elementBias = { phys: 1500, plasma: 50, cryo: 50, energy: 50 };
nb.updateEntropyProfiler(4.0);

assert(G.entropy.activeMutations.includes('phys'), 'Swarm mutates Hardened Reactive Chitin against physical monoculture');

// Test damage reduction on light physical fire (< 45 dmg)
const testTarget = {
  id: 8881,
  type: 'brute',
  x: 200,
  y: 200,
  hp: 200,
  maxHp: 200,
  armor: 0,
  shred: 0,
  dead: false
};
G.enemies.push(testTarget);

const hpBeforeLowPhys = testTarget.hp;
nb.dealDamage(testTarget, 40, 'phys', G.towers[0]);
const taken = hpBeforeLowPhys - testTarget.hp;
assert(taken <= 10, `Reactive chitin should reduce 40 physical damage by 80% (took ${taken})`);
console.log('✔ Shannon Diversity calculation and Phenotypic Chitin reduction verified');

console.log('\n--- 3. Testing Prismatic Cross-Tech 3-Element Detonation ---');
const triVictim = {
  id: 8882,
  type: 'carrier',
  x: 250,
  y: 250,
  hp: 1500,
  maxHp: 1500,
  armor: 0,
  shred: 0,
  dead: false
};
G.enemies.push(triVictim);

// Hit with Phys, then Plasma, then Cryo within window
G.time = 100.0;
nb.dealDamage(triVictim, 20, 'phys', G.towers[0]);
G.time = 100.5;
nb.dealDamage(triVictim, 20, 'plasma', G.towers[0]);
G.time = 101.0;
const hpBeforePrismatic = triVictim.hp;
nb.dealDamage(triVictim, 100, 'cryo', G.towers[0]);
const prismaticDmg = hpBeforePrismatic - triVictim.hp;
assert(prismaticDmg >= 280, `Prismatic Detonation should deal ~300 damage (got ${prismaticDmg})`);
assert(triVictim.wasPrismatic, 'Victim flagged with wasPrismatic for bonus core and gold');
console.log('✔ Prismatic Cross-Tech 3-Element Detonation verified');

console.log('\n--- 4. Testing Syndicate Siphon Rig & Cartel Heist Dividend ---');
G.gold = 3500;
G.wave = 5;
G.entropy.siphonRig = null;
nb.updateEntropyProfiler(4.0);

assert(G.entropy.siphonRig, 'Syndicate Siphon Rig should spawn on high liquid gold stagnation');
const rig = G.entropy.siphonRig;
assert(G.enemies.includes(rig), 'Siphon Rig added to active enemies');

// Simulate 2 seconds of gold drain
const goldBeforeDrain = G.gold;
nb.updateAdaptiveEntropySystems(2.0);
assert(G.gold < goldBeforeDrain, 'Siphon Rig actively drains player gold');
assert(rig.siphonedGold > 0, 'Siphoned gold stored in rig');

// Test Heist Resolution
const goldBeforeBounty = G.gold;
const initialCores = nb.SAVE.cores;
nb.killEnemy(rig, G.towers[0]);
assert(G.gold > goldBeforeBounty + rig.siphonedGold, 'Recovered 100% stolen gold + 150% Heist Dividend');
assert(nb.SAVE.cores >= initialCores + 3, 'Heist resolution awards +3 Nanite Cores');
console.log('✔ Syndicate Siphon Rig gold drain and +150% Heist Dividend recovery verified');

console.log('\n--- 5. Testing Continuous CC Lockout & Kinetic Rage Breakout ---');
const permaVictim = {
  id: 8883,
  type: 'brute',
  x: 300,
  y: 300,
  hp: 800,
  maxHp: 800,
  dead: false,
  slowT: 5.0,
  slowAmt: 0.80,
  continuousCcT: 4.4
};
G.enemies.push(permaVictim);

nb.updateEnemy(permaVictim, 0.2);
assert(permaVictim.rageImmune > 0, 'Hostile triggers Kinetic Rage Breakout upon 4.5s CC lockout');
assert.strictEqual(permaVictim.slowT, 0, 'Slow and freeze cleansed on breakout');
console.log('✔ Continuous CC lockout detection and Kinetic Rage Breakout verified');

console.log('\n--- 6. Testing Thermal Shock Shatter Execution ---');
const frozenEnemy = {
  id: 8884,
  type: 'brute',
  x: 350,
  y: 350,
  hp: 1000,
  maxHp: 1000,
  dead: false,
  slowT: 3.0,
  slowAmt: 0.60,
  armor: 0,
  shred: 0
};
G.enemies.push(frozenEnemy);

const hpBeforeShock = frozenEnemy.hp;
nb.dealDamage(frozenEnemy, 100, 'phys', G.towers[0]);
const shockDmg = hpBeforeShock - frozenEnemy.hp;
// 100 base + 40% of 1000 = 500 total
assert(shockDmg >= 480, `Thermal Shock Shatter should deal ~500 damage (got ${shockDmg})`);
console.log('✔ Thermal Shock Shatter execution verified');

console.log('\n--- 7. Testing Tactical Versatility Meter (TVM) & Directives ---');
assert(G.entropy.tvmRank, 'TVM Rank should be computed');
assert(['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'].includes(G.entropy.tvmRank), 'TVM Rank belongs to valid grade tier');

// Test High Command Directive Generation
nb.generateHighCommandDirective();
assert(G.entropy.directive, 'High Command Directive generated');
assert(G.entropy.directive.title && G.entropy.directive.rewardGold, 'Directive has title and rewards');

// Resolve Directive Reward
const goldBeforeDir = G.gold;
nb.resolveDirectiveReward();
assert(G.gold > goldBeforeDir, 'Directive completion awards substantial gold bounty');
console.log('✔ TVM Style Meter ranking and High Command Directives verified');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 16.0 ADAPTIVE ENTROPY TESTS PASSED (100%)');
console.log('============================================================\n');
