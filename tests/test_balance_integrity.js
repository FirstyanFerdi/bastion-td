// ============================================================
// Test Suite: Tower & Enemy Game Balancing Integrity
// Verifies DPS, cost efficiency (DPS/G), shield mechanics, and
// anti-spam counter dynamics across all defense tiers and enemies.
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

// Mock browser
const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});
const store = {};
Object.assign(globalThis, {
  window: globalThis,
  document: { documentElement: P, getElementById: () => P, createElement: () => P, addEventListener() { }, querySelectorAll: () => [], querySelector: () => P, hidden: false },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
  requestAnimationFrame: () => 1, addEventListener() { }, devicePixelRatio: 1, innerWidth: 1400, setTimeout: () => 0
});

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const nb = window.__nb;
nb.begin();

console.log('Testing Tower Defense Balance Integrity...');

console.log('\n--- 1. Testing Tower Stats & DPS/Gold Efficiency ---');

// 1.1 Gatling Turret (Nerfed early dominance)
const gat = TD.gatling;
assert.strictEqual(gat.cost, 50, 'Gatling base cost is 50');
const gatDpsT0 = gat.tiers[0].dmg * gat.tiers[0].rate;
assert.strictEqual(gatDpsT0, 30.0, 'Gatling T0 DPS should be 30.0 (down from 48.0)');
const gatDpsPerGold = gatDpsT0 / gat.cost;
assert(gatDpsPerGold <= 0.65, `Gatling DPS/G must be balanced (<= 0.65), got: ${gatDpsPerGold.toFixed(3)}`);
assert(gat.branches.A.maxRate <= 16, 'Overdrive Minigun max rate must be capped at <= 16/s');
console.log(`✔ Gatling Turret: ${gatDpsT0} DPS (${gatDpsPerGold.toFixed(3)} DPS/Gold) - Early dominance reined in`);

// 1.2 Plasma Cannon (Buffed early viability)
const pla = TD.plasma;
assert.strictEqual(pla.cost, 95, 'Plasma cost reduced to 95 for early accessibility');
const plaDpsT0 = pla.tiers[0].dmg * pla.tiers[0].rate;
assert(plaDpsT0 >= 40.0, `Plasma T0 DPS should be >= 40.0, got: ${plaDpsT0}`);
const plaDpsPerGold = plaDpsT0 / pla.cost;
assert(plaDpsPerGold >= 0.40, `Plasma DPS/G must be competitive (>= 0.40), got: ${plaDpsPerGold.toFixed(3)}`);
console.log(`✔ Plasma Cannon: ${plaDpsT0.toFixed(1)} DPS (${plaDpsPerGold.toFixed(3)} DPS/Gold) - Early viability secured`);

// 1.3 Tesla Coil (Buffed damage & multi-target shield shred)
const tes = TD.tesla;
assert.strictEqual(tes.cost, 120, 'Tesla cost reduced to 120');
assert.strictEqual(tes.tiers[0].targets, 2, 'Tesla T0 targets 2 enemies');
const tesDpsSingle = tes.tiers[0].dmg * tes.tiers[0].rate;
const tesDpsMulti = tesDpsSingle * tes.tiers[0].targets;
assert(tesDpsMulti >= 60.0, `Tesla multi-target DPS should be >= 60.0, got: ${tesDpsMulti}`);
console.log(`✔ Tesla Coil: ${tesDpsSingle.toFixed(1)} single / ${tesDpsMulti.toFixed(1)} multi DPS - Anti-shield & swarm viability`);

// 1.4 Railgun Sniper (Orbital Lance pierce nerf)
const rail = TD.rail;
assert.strictEqual(rail.branches.A.pierce, 6, 'Orbital Lance beam pierce must be capped at 6 (not infinite 99)');
assert(rail.branches.A.dmg <= 60, 'Orbital Lance damage tuned for multi-target beam');
console.log(`✔ Railgun Sniper: Orbital Lance pierce capped at 6 - Infinite map wipe eliminated`);

console.log('\n--- 2. Testing Enemy Defensive Profiles & Counter-Mechanics ---');

// 2.1 Armored Brute heavy armor
assert(ED.brute.armor >= 0.65, 'Armored Brute must have >= 65% armor to mandate Plasma armor shred');
assert.strictEqual(ED.brute.hp, 260, 'Armored Brute base HP updated to 260');

// 2.2 Shield Carrier
assert(ED.carrier.hp >= 400, 'Shield Carrier base HP updated to 420');
assert(ED.carrier.armor >= 0.40, 'Shield Carrier armor updated to 40%');

// 2.3 Scout & Swarm
assert(ED.scout.hp >= 40, 'Scout HP updated to 42 (prevents 1-bullet instant deletion)');
assert(ED.swarm.speed >= 85, 'Swarm speed updated to 88');
console.log('✔ Enemy defensive baselines & armor mandates verified');

console.log('\n--- 3. Testing Natural Counter Shield Dynamics in dealDamage ---');

const G = nb.G;
G.state = 'active';

// Test Physical vs Shield (-25% penalty)
const dummyFoePhys = { hp: 100, maxHp: 100, shield: 100, maxShield: 100, dead: false, armor: 0, d: 0, x: 50, y: 50, r: 12 };
nb.dealDamage(dummyFoePhys, 40, 'phys', null);
assert.strictEqual(dummyFoePhys.shield, 100 - (40 * 0.75), 'Physical damage must suffer -25% penalty vs shields (30 dealt)');

// Test Energy vs Shield (+35% bonus)
const dummyFoeEnergy = { hp: 100, maxHp: 100, shield: 100, maxShield: 100, dead: false, armor: 0, d: 0, x: 50, y: 50, r: 12 };
nb.dealDamage(dummyFoeEnergy, 40, 'energy', null);
assert.strictEqual(dummyFoeEnergy.shield, 100 - (40 * 1.35), 'Energy damage must gain +35% bonus vs shields (54 dealt)');
console.log('✔ Shield dynamics: Physical (-25%) vs Energy (+35%) natural counter confirmed');

console.log('\n============================================================');
console.log('🎉 ALL BALANCE INTEGRITY TESTS PASSED (100%)');
console.log('============================================================\n');
