// ============================================================
// Test Suite: Bastion TD 15.0 - Apex Ascendant: The Chrono-Singularity Nexus & Sentient Warfare Matrix
// Tests: Chrono-Anchor Recording & Temporal Echoes, DNTM Sentient AI,
// Geomorphic Magma Fissures & Zero-G Juggle Fields, Ancient Cyber-Engrams,
// and Cinematic Titan Finisher & Adrenaline Gamble.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 15.0: Apex Ascendant (Chrono-Singularity & Sentient Warfare Matrix)...\n');

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

console.log('--- 1. Testing Chrono-Singularity Nexus & Temporal Echoes ---');
assert(nb.CHRONO_NEXUS_CONFIG, 'CHRONO_NEXUS_CONFIG must be defined');
const anchorSuccess = nb.dropChronoAnchor(250, 250);
assert(anchorSuccess, 'Should successfully drop Chrono-Anchor');
assert(G.chronoAnchor && G.chronoAnchor.active, 'Chrono-Anchor is active in G');
assert.strictEqual(G.chronoAnchor.x, 250, 'Chrono-Anchor X stored');
assert.strictEqual(G.chronoAnchor.y, 250, 'Chrono-Anchor Y stored');

// Create test enemy and record a damage event
const testEnemy = {
  id: 9901,
  type: 'brute',
  x: 260,
  y: 260,
  r: 14,
  hp: 500,
  maxHp: 500,
  armor: 0,
  shred: 0,
  dead: false,
  leak: 1,
  speed: 40,
  curSpeed: 40,
  d: 100,
  seg: 0
};
G.enemies.push(testEnemy);

const testTower = {
  id: 8801,
  x: 200,
  y: 200,
  r: 1,
  row: 1,
  c: 1,
  type: 'sniper',
  tier: 0
};
G.towers.push(testTower);

nb.dealDamage(testEnemy, 150, 'phys', testTower);
assert(G.chronoAnchor.events.length > 0, 'Damage event recorded into Chrono-Anchor timeline');

// Trigger Reverberation
const echoCount = nb.triggerChronoReverberation();
assert(echoCount > 0, 'Temporal Echoes should be created from recorded events');
assert(G.temporalEchoes.length > 0, 'Echoes registered in G.temporalEchoes');
console.log('✔ Chrono-Anchor recording and Quantum Echo Reverberation verified');

console.log('\n--- 2. Testing Sentient Adversary AI (DNTM) ---');
assert(nb.DNTM_CONFIG, 'DNTM_CONFIG must be defined');
// Build a tight 6-tower killbox cluster
for (let i = 0; i < 6; i++) {
  G.towers.push({
    id: 9000 + i,
    x: 400 + (i % 3) * 20,
    y: 300 + Math.floor(i / 3) * 20,
    r: 2,
    row: 2,
    c: 2,
    type: 'gatling',
    tier: 0
  });
}
G.dntm = { timer: 4.1, killboxScore: 0, dominantElement: 'phys', elementBias: { phys: 600, plasma: 50, cryo: 50, energy: 50 }, activeCounters: [] };
nb.updateDNTMProfiler(4.5);

assert(G.dntm.killboxScore >= 6, 'Killbox cluster density detected by DNTM');
const sapper = G.enemies.find(e => e.type === 'seismic_sapper');
assert(sapper, 'DNTM should deploy Seismic Sapper counter hostile');
assert(sapper.subterranean, 'Sapper spawns subterranean');

// Test Sapper Eruption
sapper.eruptTimer = 0.05;
nb.updateEnemy(sapper, 0.1);
assert.strictEqual(sapper.subterranean, false, 'Sapper erupted to surface');

// Test Harpoon Colossus Mech Tethering
const harpoonEnemy = {
  id: 9902,
  type: 'harpoon_walker',
  x: 500,
  y: 500,
  r: 16,
  hp: 400,
  maxHp: 400,
  dead: false,
  stunT: 0
};
G.enemies.push(harpoonEnemy);
G.mech = { x: 550, y: 550, active: true, isDocked: false };
nb.updateEnemy(harpoonEnemy, 0.1);
assert(harpoonEnemy.isTetheringMech, 'Harpoon Walker tethers Titan Mech within range');
assert(G.mech.rootedT > 0, 'Titan Mech rooted by Harpoon tether');
console.log('✔ DNTM Killbox detection, Seismic Sapper eruption, and Harpoon tethering verified');

console.log('\n--- 3. Testing Geomorphic Magma Fissures & Zero-G Containment ---');
assert(nb.GEOMORPHIC_CONFIG, 'GEOMORPHIC_CONFIG must be defined');
const fis = nb.createGeomorphicFissure(100, 100, 200, 100);
assert(fis, 'Geomorphic fissure created');
assert(G.geomorphicFissures.includes(fis), 'Fissure stored in G.geomorphicFissures');

const burnVictim = {
  id: 9903,
  type: 'brute',
  x: 150,
  y: 100,
  r: 14,
  hp: 300,
  maxHp: 300,
  dead: false,
  armor: 0,
  shred: 0
};
G.enemies.push(burnVictim);
const hpBeforeFissure = burnVictim.hp;
nb.updateApexAscendantSystems(0.5);
assert(burnVictim.hp < hpBeforeFissure, 'Enemy in magma fissure takes continuous plasma burn damage');

// Zero-Gravity Field
const zg = nb.deployZeroGravityField(600, 600);
assert(zg, 'Zero-Gravity field deployed');
const floatVictim = {
  id: 9904,
  type: 'runner',
  x: 600,
  y: 600,
  r: 12,
  hp: 500,
  maxHp: 500,
  dead: false,
  armor: 0,
  shred: 0
};
G.enemies.push(floatVictim);
nb.updateApexAscendantSystems(0.2);
assert(floatVictim.inZeroGravity, 'Enemy marked floating in Zero Gravity field');

// Test Zero-G +200% juggle damage (3x damage)
const hpBeforeHit = floatVictim.hp;
nb.dealDamage(floatVictim, 100, 'phys', testTower);
const dmgTaken = hpBeforeHit - floatVictim.hp;
assert(dmgTaken >= 290, `Zero-G juggle should deal ~300 damage (got ${dmgTaken})`);
console.log('✔ Geomorphic Magma Fissures and Zero-G juggle damage multiplier verified');

console.log('\n--- 4. Testing Ancient Cyber-Engrams & ARPG Chimera Synthesis ---');
assert(nb.CYBER_ENGRAMS_DATABASE, 'CYBER_ENGRAMS_DATABASE must exist');
const bossEnemy = {
  id: 9999,
  type: 'boss',
  x: 300,
  y: 300,
  r: 32,
  hp: 1,
  maxHp: 2000,
  reward: 200,
  dead: false,
  leak: 5
};
G.enemies.push(bossEnemy);

const invCountBefore = G.cyberEngramsInventory.length;
nb.killEnemy(bossEnemy, testTower);
assert(G.cyberEngramsInventory.length > invCountBefore, 'Defeating Boss should drop Mythic Ancient Cyber-Engram');
const engram = G.cyberEngramsInventory[G.cyberEngramsInventory.length - 1];
assert(engram.prefix && engram.suffix, 'Engram has dual Awakened Prefix and Cataclysmic Suffix');

// Socket Engram into tower
const socketOk = nb.socketCyberEngram(testTower, engram.id);
assert(socketOk, 'Engram successfully socketed into defense');
assert.strictEqual(testTower.cyberEngram, engram, 'Tower holds socketed Cyber-Engram');
console.log('✔ Ancient Cyber-Engram boss drop, dual-affix generation, and socketing verified');

console.log('\n--- 5. Testing Cinematic Titan Finisher & Adrenaline Heat Gamble ---');
const titanBoss = {
  id: 9988,
  type: 'boss',
  name: 'Goliath Dreadnought',
  x: 350,
  y: 350,
  r: 35,
  hp: 250,
  maxHp: 2000, // 12.5% HP <= 15%
  dead: false
};
G.enemies.push(titanBoss);

nb.dealDamage(titanBoss, 10, 'energy', testTower);
assert(G.finisherPrompt && G.finisherPrompt.boss === titanBoss, 'Boss HP <= 15% prompts [F] EXECUTE finisher');

const initialGold = G.gold;
const initialCores = nb.SAVE.cores;
const executed = nb.triggerTitanFinisher(titanBoss);
assert(executed, 'Titan Finisher executed successfully');
assert(titanBoss.dead, 'Boss killed by Titan Finisher');
assert(G.gold >= initialGold + 350, 'Titan Finisher awards +350 Gold bounty');
assert(nb.SAVE.cores >= initialCores + 3, 'Titan Finisher awards +3 Nanite Cores');
assert.strictEqual(G.finisherPrompt, null, 'Finisher prompt cleared after execution');

// Adrenaline Heat Streak Scaling
G.adrenalineHeat = 5;
const fodder = {
  id: 9977,
  type: 'scout',
  x: 100,
  y: 100,
  r: 10,
  hp: 1,
  maxHp: 100,
  reward: 10,
  dead: false
};
G.enemies.push(fodder);
const goldBeforeFodder = G.gold;
nb.killEnemy(fodder, testTower);
const bountyGained = G.gold - goldBeforeFodder;
assert.strictEqual(bountyGained, 50, `5x Adrenaline Heat should award 50 Gold (got ${bountyGained})`);
console.log('✔ Cinematic Titan Finisher execution and 5x Adrenaline Gamble bounty scaling verified');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 15.0 APEX ASCENDANT TESTS PASSED (100%)');
console.log('============================================================\n');
