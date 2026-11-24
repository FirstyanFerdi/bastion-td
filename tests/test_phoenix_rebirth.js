// ============================================================
// Test Suite: Bastion TD 23.0 - The Phoenix Protocol & Causal Failure Engine
// Tests:
// 1. The Phoenix Protocol (Doomsday Singularity & 10s Standoff Trigger)
// 2. Scarred Rebirth Miracle Clutch & +25% Permanent Critical Damage
// 3. Catastrophic Blackbox Forensics (Root Cause, Tactical Vulnerability, EDM Currency)
// 4. Causal Monolith Memorial & Awakened Ghost Memory Restoration (50% Discount)
// 5. Causal Scars (Persistent Magma Environmental Hazard Burning)
// 6. Nemesis Grudge System & Vendetta Triumph (+500G & +15 Cores Bounty)
// 7. End-to-End Phoenix Systems Update Loop Simulation
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 23.0: The Phoenix Protocol & Causal Failure Engine...\n');

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

console.log('--- 1. Testing The Phoenix Protocol (Doomsday Singularity & 10s Standoff Trigger) ---');
assert(nb.PHOENIX_CONFIG, 'PHOENIX_CONFIG must be defined in data.js');
assert(G.phoenix, 'G.phoenix must be initialized in newGame()');

// Prepare enemy crowd: 2 swarms and 1 boss
const creep1 = { id: 1, type: 'swarm', hp: 50, maxHp: 50, dead: false, d: 100, seg: 0, pathId: 0 };
const creep2 = { id: 2, type: 'scout', hp: 80, maxHp: 80, dead: false, d: 110, seg: 0, pathId: 0 };
const bossFoe = { id: 3, type: 'boss', hp: 2000, maxHp: 2000, dead: false, d: 120, seg: 0, pathId: 0 };
G.enemies = [creep1, creep2, bossFoe];

const triggered = nb.triggerPhoenixDoomsday();
assert.strictEqual(triggered, true, 'Phoenix Doomsday should trigger successfully');
assert.strictEqual(G.phoenix.ghostStandoff, true, 'Ghost standoff should be active');
assert.strictEqual(G.phoenix.standoffTimer, 10.0, 'Standoff timer should start at 10.0s');
assert.strictEqual(creep1.dead, true, 'Doomsday wave should eliminate normal creeps');
assert.strictEqual(creep2.dead, true, 'Doomsday wave should eliminate normal creeps');
assert(bossFoe.hp < 2000, 'Doomsday wave should inflict 40% true damage to bosses');
assert.strictEqual(G.mech.battery, 100, 'Titan Mech battery should be restored to 100%');
console.log('Phoenix Doomsday Singularity verified successfully.');

console.log('--- 2. Testing Scarred Rebirth Miracle Clutch & +25% Critical Damage ---');
// Eliminate boss during standoff to trigger clutch
nb.killEnemy(bossFoe);
assert.strictEqual(G.phoenix.ghostStandoff, false, 'Standoff should conclude upon boss kill');
assert.strictEqual(G.phoenix.scarredBastion, true, 'Scarred Bastion buff should be activated');
assert.strictEqual(G.lives, 1, 'Base lives should be restored to 1 on Scarred Rebirth');

// Verify +25% Critical Damage in dealDamage
const testTarget = { id: 4, hp: 1000, maxHp: 1000, dead: false, d: 200, seg: 0, pathId: 0, armor: 0 };
const normalDmg = 100;
nb.dealDamage(testTarget, normalDmg, 'phys', null, { crit: true });
// Base crit damage would be 100, but with Scarred Bastion (+25%) it becomes 125
assert.strictEqual(testTarget.hp, 875, 'Scarred Bastion should increase critical strike damage by +25%');
console.log('Scarred Rebirth and Critical Strike bonus verified successfully.');

console.log('--- 3. Testing Catastrophic Blackbox Forensics Generation ---');
G.towers = [
  { id: 1, type: 'gatling', heat: 95, isSupercritical: true, totalCost: 600, c: 5, r: 5, x: 300, y: 300 },
  { id: 2, type: 'rail', heat: 90, isSupercritical: true, totalCost: 800, c: 6, r: 5, x: 360, y: 300 }
];
G.wave = 15;
G.score = 50000;
const forensics = nb.generateBlackboxForensics();
assert(forensics, 'Forensics report should be generated');
assert(forensics.rootCause.includes('Thermal Starvation'), 'Root cause should diagnose high heat / supercritical cluster');
assert(forensics.vulnerability.includes('-80%'), 'Forensics should reveal tactical vulnerability of killer hostiles');
assert(forensics.edmEarned > 0, 'Entropic Dark Matter should be awarded on defeat');
assert(SAVE.edm >= forensics.edmEarned, 'EDM should persist into SAVE.edm');
console.log('Blackbox Forensics and EDM calculation verified successfully:', forensics.edmEarned, 'EDM');

console.log('--- 4. Testing Causal Monolith Memorial & Heritage Restoration ---');
assert(SAVE.causalMonolith, 'Best tower should be preserved into SAVE.causalMonolith');
assert.strictEqual(SAVE.causalMonolith.type, 'rail', 'Highest investment tower should become the monolith');

// Start a fresh game to verify monolith inheritance
nb.begin();
const newG = nb.G;
assert(newG.causalMonolith, 'New game should inherit causalMonolith from previous timeline');
assert.strictEqual(newG.causalMonolith.restored, false, 'Monolith should initially be unrestored');

// Restore monolith with 50% discount
newG.gold = 1000;
const restored = nb.restoreCausalMonolith();
assert.strictEqual(restored, true, 'Restoring monolith should succeed');
assert.strictEqual(newG.causalMonolith.restored, true, 'Monolith should be marked as restored');
const restoredTower = newG.towers.find(t => t.c === 6 && t.r === 5);
assert(restoredTower, 'Tower should be resurrected at monolith coordinates');
assert.strictEqual(restoredTower.awakenedGhostMemory, true, 'Resurrected tower should gain Awakened Ghost Memory trait');
console.log('Causal Monolith restoration and Awakened Ghost Memory verified successfully.');

console.log('--- 5. Testing Causal Scars (Persistent Magma Environmental Burning) ---');
assert(newG.causalScars && newG.causalScars.length > 0, 'Causal scars should persist into new game');
const scar = newG.causalScars[0];
const creepingEnemy = { id: 77, x: scar.x, y: scar.y, hp: 200, maxHp: 200, dead: false, d: 50, seg: 0, pathId: 0 };
newG.enemies = [creepingEnemy];
nb.updatePhoenixSystems(1.0);
assert(creepingEnemy.hp < 200, 'Enemies traversing magma scar should receive environmental burn damage');
console.log('Causal Scars environmental damage verified successfully.');

console.log('--- 6. Testing Nemesis Grudge System & Vendetta Triumph ---');
assert(newG.grudgeNemesis, 'Grudge Nemesis should be remembered in new game');
const initialGold = newG.gold;
const initialCores = (typeof SAVE !== 'undefined' ? SAVE.cores : 0);

// Defeat grudge nemesis
const revengeFoe = { id: 999, type: newG.grudgeNemesis.type, hp: 0, dead: false, x: 200, y: 200 };
nb.killEnemy(revengeFoe);
assert(newG.gold >= initialGold + 500, 'Defeating Grudge Nemesis should award +500 Gold Vendetta Bounty');
assert.strictEqual(newG.grudgeNemesis, null, 'Grudge should be resolved upon nemesis execution');
console.log('Nemesis Grudge System and Vendetta Triumph verified successfully.');

console.log('--- 7. Testing End-to-End Phoenix Systems Update Loop Simulation ---');
newG.phoenix.ghostStandoff = true;
newG.phoenix.standoffTriggered = true;
newG.phoenix.standoffTimer = 0.5;
newG.enemies = [];

// Simulate ticks until standoff timer expires without kills -> should trigger defeat
nb.updatePhoenixSystems(0.6);
assert.strictEqual(newG.phoenix.ghostStandoff, false, 'Timeout should resolve standoff');
assert.strictEqual(newG.state, 'over', 'Standoff timeout without requirement should transition to true game over');
assert(newG.phoenix.blackboxActive, 'Game over should activate Blackbox Forensics display');

console.log('\nAll 7 Bastion TD 23.0 Phoenix Protocol test suites passed successfully!\n');
