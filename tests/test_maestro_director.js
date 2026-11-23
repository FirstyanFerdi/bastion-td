// ============================================================
// Test Suite: Bastion TD 21.0 - The Maestro Dynamic Pacing Director & Neuro-Kinetic Tension Engine
// Tests:
// 1. Tension Index Calculation (Biometric Stress Profiler & Multi-Variable Weighting)
// 2. Proficiency Index Calculation (Cognitive Skill Cadence & Flow State Metric)
// 3. 4-Phase Pacing State Machine (Buildup -> Crescendo -> Miracle -> Respite)
// 4. Miracle Window Clutch Execution (Bullet-Time, Battery Restoration, Repulsor Wave, Bounty)
// 5. Golden Respite Phase Mechanics (2x Tower Heat Dissipation, Golden Nanite Drones)
// 6. Director's Gambits (Offer, Accept, Apply Penalties, Resolution & Reward)
// 7. End-to-End Maestro Director Update Loop Simulation
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 21.0: The Maestro Dynamic Pacing Director & Neuro-Kinetic Tension Engine...\n');

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
G.wave = 10;
G.gold = 3000;
G.lives = 20;

console.log('--- 1. Testing Tension Index Calculation (Biometric Stress Profiler) ---');
assert(nb.MAESTRO_DIRECTOR_CONFIG, 'MAESTRO_DIRECTOR_CONFIG must be defined in data.js');
assert(G.maestro, 'G.maestro must be initialized in newGame()');

// At full health (20 lives), empty enemy field, full mech battery, 0 heat -> Tension should be 0
G.lives = 20;
G.enemies = [];
if (G.mech) G.mech.battery = 100;
G.towers = [];

let tension = nb.calculatePlayerTension();
assert.strictEqual(tension, 0, 'Tension should be 0 when player is at full health with no threats');

// Simulate severe danger: low lives (5/20), creeping enemy near base, hot towers, drained mech
G.lives = 5;
const testPlen = (typeof PLEN !== 'undefined' && PLEN > 0) ? PLEN : 1000;
const basePt = (typeof BASE_PT !== 'undefined') ? BASE_PT : { x: 800, y: 300 };
G.enemies = [
  { id: 1, x: basePt.x - 40, y: basePt.y, hp: 1000, maxHp: 1000, dead: false, d: testPlen * 0.95, seg: 0, pathId: 0 }
];
if (G.mech) {
  G.mech.active = true;
  G.mech.battery = 10;
}
G.towers = [
  { id: 1, type: 'gatling', x: 200, y: 200, heat: 95, maxHeat: 100, overheated: true }
];

tension = nb.calculatePlayerTension();
assert(tension >= 60, 'Tension should rise significantly (>60) under multi-variable crisis conditions');
assert(tension <= 100, 'Tension must not exceed 100');
console.log('Tension under crisis calculated successfully:', tension.toFixed(2));

console.log('--- 2. Testing Proficiency Index Calculation (Cognitive Skill Cadence) ---');
G.killStreak = 15;
G.kills = 80;
G.wave = 5;
let skill = nb.calculatePlayerProficiency();
assert(skill >= 1.0, 'High combo and kill rate should yield skill score >= 1.0');
assert(skill <= 3.0, 'Proficiency index must be clamped at max 3.0');
console.log('Player skill proficiency calculated successfully:', skill.toFixed(2));

console.log('--- 3. Testing 4-Phase Pacing State Machine ---');
nb.transitionMaestroPhase('buildup');
assert.strictEqual(G.maestro.phase, 'buildup', 'Maestro phase should transition to buildup');
assert.strictEqual(G.maestro.phaseTimer, 10.0, 'Buildup phase timer should default to 10s');

nb.transitionMaestroPhase('crescendo');
assert.strictEqual(G.maestro.phase, 'crescendo', 'Maestro phase should transition to crescendo');
assert.strictEqual(G.maestro.phaseTimer, 20.0, 'Crescendo phase timer should default to 20s');

nb.transitionMaestroPhase('miracle');
assert.strictEqual(G.maestro.phase, 'miracle', 'Maestro phase should transition to miracle');
assert.strictEqual(G.maestro.phaseTimer, 6.0, 'Miracle phase timer should default to 6s');

nb.transitionMaestroPhase('respite');
assert.strictEqual(G.maestro.phase, 'respite', 'Maestro phase should transition to respite');
assert.strictEqual(G.maestro.phaseTimer, 12.0, 'Respite phase timer should default to 12s');

console.log('--- 4. Testing Miracle Window Clutch Mechanics & Near-Miss Redemption ---');
nb.transitionMaestroPhase('miracle');
G.maestro.miracleAvailable = true;
if (G.mech) {
  G.mech.battery = 5;
  G.mech.x = 500;
  G.mech.y = 300;
}
G.gold = 1000;
const enemyClutch = { id: 99, x: 500, y: 300, hp: 500, maxHp: 500, d: 400, dead: false, seg: 0, pathId: 0 };
G.enemies = [enemyClutch];

// Trigger miracle clutch via mechParry
const clutchResult = nb.mechParry();
assert(clutchResult, 'Mech parry during miracle window should trigger miracle clutch');
assert.strictEqual(G.maestro.phase, 'respite', 'Miracle clutch should transition directly into respite phase');
assert.strictEqual(G.maestro.totalClutches, 1, 'Total clutches count should increment');
if (G.mech) {
  assert.strictEqual(G.mech.battery, 100, 'Titan Mech battery should be restored to 100% on clutch');
}
assert(enemyClutch.d <= 300, 'Living enemies should be repelled backwards by Repulsor Wave');
assert(enemyClutch.hp < 500, 'Repulsor wave must deal true damage to enemies');
assert(G.gold >= 1150, 'Miracle clutch must award +150G bonus');

console.log('--- 5. Testing Golden Respite Phase Mechanics ---');
// Verify Golden Nanite Drones were spawned during transition to respite
const drones = G.enemies.filter(e => e.isLootDrone);
assert(drones.length >= 4, 'Respite phase should spawn 4x Golden Nanite Drones');
assert.strictEqual(drones[0].leak, 0, 'Golden Nanite Drones should not damage player base on leak');
assert.strictEqual(drones[0].reward, 85, 'Golden Nanite Drone reward should be 85G');

// Verify 2x Tower Heat Dissipation in Respite
const coolingTower = {
  id: 201, type: 'laser', x: 100, y: 100, heat: 80, maxHeat: 100, tier: 1, coolDown: 0,
  overheated: false, range: 150, baseRange: 150, rate: 1.0, damage: 20, element: 'energy'
};
G.towers = [coolingTower];
G.maestro.phase = 'respite';
nb.updateTower(coolingTower, 1.0);
assert(coolingTower.heat < 75, 'Tower heat should dissipate rapidly (2x rate) during respite');

console.log('--- 6. Testing Director Gambits (Adaptive Provocations) ---');
// Test Offer
const offered = nb.offerDirectorGambit('crucible_surge');
assert(offered, 'Crucible Surge gambit should be offered');
assert.strictEqual(G.maestro.offeredGambit.id, 'crucible_surge', 'Offered gambit ID should match');

// Test Accept
const accepted = nb.acceptDirectorGambit('crucible_surge');
assert(accepted, 'Gambit should be accepted');
assert(G.maestro.activeGambit, 'Active gambit should be set');
assert.strictEqual(G.maestro.activeGambit.id, 'crucible_surge');

// Test Silent Arsenal gambit tower lock
const tStrong = { id: 301, type: 'railgun', tier: 4, heat: 0, maxHeat: 100, range: 300, rate: 0.5, coolDown: 0 };
G.towers = [tStrong];
nb.acceptDirectorGambit('silent_arsenal');
assert.strictEqual(tStrong.silentArsenalLocked, true, 'Strongest tower should be EMP locked');
nb.updateTower(tStrong, 0.5);
assert.strictEqual(tStrong.coolDown, 0, 'Locked tower should not fire/cycle cooldown');

// Test Gambit Triumph Resolution
const goldBefore = G.gold;
nb.resolveDirectorGambit(true);
assert.strictEqual(tStrong.silentArsenalLocked, false, 'Tower lock must be lifted upon gambit resolution');
assert(G.gold > goldBefore, 'Gambit triumph should grant gold rewards');
assert.strictEqual(G.maestro.activeGambit, null, 'Active gambit must be cleared');

console.log('--- 7. Testing End-to-End Maestro Director Update Loop Simulation ---');
// Start in buildup
nb.transitionMaestroPhase('buildup');
G.maestro.phaseTimer = 0.1;
nb.updateMaestroDirector(0.15);
assert.strictEqual(G.maestro.phase, 'crescendo', 'Maestro director loop should advance buildup to crescendo on timeout');

// Active gambit timer countdown
nb.acceptDirectorGambit('crucible_surge');
assert(G.maestro.activeGambit, 'Active gambit present');
G.maestro.activeGambit.timer = 0.1;
G.lives = 20;
nb.updateMaestroDirector(0.15);
assert.strictEqual(G.maestro.activeGambit, null, 'Director update loop should successfully resolve gambit when timer reaches 0');

console.log('\nAll 7 Bastion TD 21.0 Maestro Director test suites passed successfully!\n');
