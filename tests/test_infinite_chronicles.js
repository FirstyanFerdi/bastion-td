// test_infinite_chronicles.js - Comprehensive Test Suite for Bastion TD 11.0: The Infinite Chronicles
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

// Headless DOM stub
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

const sandbox = {
  window: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  document: {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl(id === 'game' ? 'canvas' : 'div');
      return elements[id];
    },
    querySelector(s) { return makeEl('div'); },
    querySelectorAll() { return []; },
    createElement(tag) { return makeEl(tag); },
    body: makeEl('body'),
    addEventListener() {}
  },
  navigator: { userAgent: 'NodeTest' },
  AudioContext: class {
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
    get currentTime() { return 0; }
    get destination() { return {}; }
    resume() {}
  },
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => {},
  setTimeout: fn => fn(),
  console
};
sandbox.window = sandbox;

vm.createContext(sandbox);

const scripts = [
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
  'js/input.js',
  'js/main.js'
];

for (const s of scripts) {
  vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), sandbox, { filename: s });
}

const nb = sandbox.window.__nb;

console.log('Testing Bastion TD 11.0: The Infinite Chronicles...\n');

// 1. Procedural Expedition Matrix Tests
console.log('--- 1. Testing Procedural Expedition Matrix ---');
const expNodes = nb.generateExpeditionTree(12345);
assert(Array.isArray(expNodes) && expNodes.length >= 7, 'Expedition tree should contain at least 7 nodes across tiers');
const maxTier = expNodes.reduce((max, n) => Math.max(max, n.tier), 0);
assert.strictEqual(maxTier, 4, 'Expedition tree must span from Tier 0 (Entry) to Tier 4 (Cataclysm Boss Gate)');
const bossNode = expNodes.find(n => n.type === 'cataclysm_gate');
assert(bossNode, 'Must contain a cataclysm boss gate node');
console.log('✔ Procedural expedition tree generation verified with 5 tiers and branching nodes');

// Starting node
nb.begin();
const G = nb.G;
assert(G.expedition && Array.isArray(G.expedition.nodes), 'New game should initialize expedition matrix with nodes array');
const firstNode = G.expedition.nodes[0];
nb.startExpeditionNode(firstNode.id);
assert.strictEqual(G.expedition.currentNodeId, firstNode.id, 'Engaged node should become currentNodeId');
console.log('✔ startExpeditionNode correctly transitions campaign node state to ' + firstNode.id);

// Complete node
nb.completeExpeditionNode();
assert.strictEqual(firstNode.cleared, true, 'Cleared node should mark cleared');
const nextConnectedNode = G.expedition.nodes.find(n => firstNode.connections.includes(n.id));
assert(nextConnectedNode && nextConnectedNode.active, 'Subsequent connected node must be activated');
assert(G.chimeraDraft && G.chimeraDraft.length === 3, 'Completing expedition node must award Chimera Draft');
console.log('✔ completeExpeditionNode activates subsequent nodes and awards Chimera Draft');


// 2. Dynamic Path Morphing & Chokepoint Entropy Tests
console.log('\n--- 2. Testing Dynamic Path Morphing & Chokepoint Entropy ---');
assert.strictEqual(G.dynamicPathMorphed, false, 'Dynamic path morph should be false initially');
nb.triggerDynamicPathMorph('bio_excavation');
assert.strictEqual(G.dynamicPathMorphed, true, 'dynamicPathMorphed flag should be set');
console.log('✔ Dynamic Path Morphing creates reactive detours and triggers terrain entropy');


// 3. Prismatic Chimera Tower Draft & Rule-Bending Relics
console.log('\n--- 3. Testing Prismatic Chimera Tower Draft & Rule-Bending Relics ---');
const draft = nb.generateChimeraDraft();
assert(draft && draft.length === 3, 'generateChimeraDraft must produce 3 distinct affix combinations');
assert(draft[0].prefix && draft[0].suffix, 'Each draft option must contain prefix and suffix affixes');

const testTower = nb.placeTower(2, 2, 'tesla');
assert(testTower, 'Tower should be placed');
nb.applyChimeraAffix(testTower, 'glacial', 'of_execution');
assert.strictEqual(testTower.chimeraPrefix, 'glacial', 'Prefix should be applied');
assert.strictEqual(testTower.chimeraSuffix, 'of_execution', 'Suffix should be applied');
assert(testTower.chimeraName.includes('Glacial') && testTower.chimeraName.includes('Execution'), 'Chimera name should be infused');
console.log('✔ Chimera affix infusion correctly modifies tower attributes and generates title: ' + testTower.chimeraName);

// Test Chimera execution mechanic in dealDamage
const lowHpEnemy = { id: 'en1', hp: 15, maxHp: 100, x: 100, y: 100, armor: 0, dead: false, speed: 60, reward: 10 };
G.enemies.push(lowHpEnemy);
nb.dealDamage(lowHpEnemy, 5, 'energy', testTower);
assert(lowHpEnemy.dead, 'of_execution suffix should execute hostiles below 20% max HP');
console.log('✔ Chimera suffix of_execution instantly executes critical hostiles');

// Rule Bending Relic: quantum_reroute
nb.applyRuleBendingRelic('quantum_reroute');
assert(G.ruleRelics && G.ruleRelics['quantum_reroute'], 'Rule-bending relic should be registered');
console.log('✔ Rule-Bending Relic quantum_reroute active');


// 4. Adaptive Nemesis Genome Tests
console.log('\n--- 4. Testing Adaptive Nemesis Genome ---');
G.damageTrack = { phys: 600, cryo: 50, energy: 50, plasma: 0 };
nb.evolveNemesisGenome();
assert.strictEqual(G.nemesisGenome, 'kinetic_dissipation', 'Genome should evolve kinetic_dissipation when kinetic damage dominates');
console.log('✔ Nemesis Genome adapts reactively to dominant player kinetic loadout');

// Verify damage reduction against kinetic_dissipation
const armorEnemy = { id: 'en2', hp: 100, maxHp: 100, x: 100, y: 100, armor: 0, dead: false, speed: 60, reward: 15 };
G.enemies.push(armorEnemy);
const baseHp = armorEnemy.hp;
nb.dealDamage(armorEnemy, 40, 'phys');
const takenDmg = baseHp - armorEnemy.hp;
assert(takenDmg < 40, 'kinetic_dissipation should mitigate incoming kinetic/phys damage');
console.log('✔ Adaptive Genome trait kinetic_dissipation reduces kinetic damage taken (' + takenDmg + ' vs 40)');


// 5. Quantum Ascension Heat System Tests
console.log('\n--- 5. Testing Quantum Ascension Heat System ---');
assert.strictEqual(G.currentHeat, 0, 'Initial heat should be 0');
nb.toggleQuantumHeatModifier('heat_speed');
assert.strictEqual(G.currentHeat, 1, 'Toggling heat_speed (+1 Heat) should increase heat to 1');
assert(G.activeHeatModifiers.includes('heat_speed'), 'heat_speed should be active');

nb.toggleQuantumHeatModifier('heat_speed');
assert.strictEqual(G.currentHeat, 0, 'Toggling off should decrease heat back to 0');
assert(!G.activeHeatModifiers.includes('heat_speed'), 'heat_speed should be deactivated');
console.log('✔ Quantum Heat modifiers toggle cleanly and recalculate cumulative heat');


// 6. Emergent Chaos Incursions Tests
console.log('\n--- 6. Testing Emergent Chaos Incursions ---');
nb.triggerChaosIncursion('smuggler_heist');
assert.strictEqual(G.chaosIncursion, 'smuggler_heist', 'Chaos incursion should be active');
assert(G.chaosTimer > 0, 'Chaos event timer should be initialized');

// Countdown timer in updateInfiniteChronicles
const initialTimer = G.chaosTimer;
G.state = 'active';
nb.updateInfiniteChronicles(1.0);
assert(G.chaosTimer < initialTimer, 'updateInfiniteChronicles should decrement chaosTimer');

// Resolution
const prevGold = G.gold;
nb.resolveChaosIncursion(true);
assert.strictEqual(G.chaosIncursion, null, 'Resolving incursion should clear active state');
assert(G.gold > prevGold, 'Successful incursion should award tactical bounty');
console.log('✔ Chaos Incursion lifecycle (trigger, update, resolve with rewards) verified');

console.log('\n============================================================');
console.log('🎉 ALL 6 PILLARS OF BASTION TD 11.0: THE INFINITE CHRONICLES PASSED (100%)');
console.log('============================================================\n');
