// tests/test_visceral_resonance.js
// ============================================================
// Test Suite: Bastion TD 13.0 - Visceral Resonance & Kinetic Transcendence
// Verifies Game Juice (Overkill debris & Arc discharge, Multi-Kill Combos),
// Citadel Aegis Protocol (Last Stand Time Dilation & Repulsor Shockwave),
// Titan Mech Aegis Parry & Heavy Mortars, Molten Slags & Swarm Formations,
// The Harmonic Cadence (4-Element Symphony), Chronos Orbital Spear,
// and Autonomous Titan Mech AI Companion Doctrines.
// ============================================================

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

// Headless browser DOM stub
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

console.log('Testing Bastion TD 13.0: Visceral Resonance & Kinetic Transcendence...\n');

const nb = window.__nb;
nb.begin();
const G = nb.G;
G.state = 'active';

// ------------------------------------------------------------
// 1. Sensory Overdrive & Overkill Mechanics
// ------------------------------------------------------------
console.log('--- 1. Testing Sensory Overdrive & Overkill Systems ---');

// 1.1 Kinetic Debris Physics
assert(Array.isArray(G.debris), 'G.debris must be initialized as an array');
nb.spawnOverkillDebris(200, 200, '#94a3b8', 60);
assert(G.debris.length >= 3, 'Spawning overkill debris should populate G.debris');
const d0 = G.debris[0];
assert(d0.vx !== undefined && d0.vy !== undefined, 'Debris must have velocity components');
assert(d0.restitution === 0.55, 'Debris must define bounce restitution 0.55');

// Test debris physics update
const initialY = d0.y;
nb.updateVisceralSystems(0.1);
assert(d0.life < 1.8, 'Debris life should decrease with dt');

// Test debris pool cap (32 items)
for (let i = 0; i < 40; i++) {
  nb.spawnOverkillDebris(200, 200, '#fff', 50);
}
assert(G.debris.length <= 32, 'G.debris must be capped at 32 active items to protect 60 FPS performance');
console.log('✔ Overkill kinetic shatter and bouncing physics debris verified');

// 1.2 Superconductive Energy Arc Overkill (Arc Discharge)
G.enemies = [
  { id: 101, x: 200, y: 200, hp: 10, maxHp: 100, dead: false, r: 12, bounty: 10 },
  { id: 102, x: 230, y: 200, hp: 100, maxHp: 100, dead: false, r: 12, bounty: 10 },
  { id: 103, x: 250, y: 210, hp: 100, maxHp: 100, dead: false, r: 12, bounty: 10 }
];
// Deal 80 energy damage to enemy 101 (overkill = 70, well above threshold 25)
nb.dealDamage(G.enemies[0], 80, 'energy', null);
assert(G.enemies[0].dead, 'Enemy 101 should be dead');
assert(G.enemies[1].hp < 100, 'Enemy 102 must take superconductive arc discharge damage');
console.log('✔ Superconductive Energy Arc Overkill (Arc Discharge) verified');

// 1.3 Dynamic Multi-Kill Rampage Combos
console.log('\n--- 2. Testing Dynamic Multi-Kill Rampage Combos ---');
G.killStreak = 0;
G.gold = 100;
// Simulate killing 5 enemies in rapid succession
for (let i = 1; i <= 5; i++) {
  const dummy = { id: 200 + i, x: 300, y: 300, hp: 0, dead: false, bounty: 5, lastDmgType: 'phys' };
  nb.killEnemy(dummy, null);
}
assert.strictEqual(G.killStreak, 5, 'Kill streak should be 5');
assert(G.gold >= 150, 'Tier 1 DECIMATION! must award +25G bonus bounty');
assert(G.banner && G.banner.text.includes('DECIMATION'), 'Banner must announce DECIMATION!');

// Decay timer check
assert(G.killStreakTimer > 0, 'Kill streak timer must be active');
nb.updateVisceralSystems(1.5); // exceed 1.1s window
assert.strictEqual(G.killStreak, 0, 'Kill streak should reset after inactivity window expires');
console.log('✔ Dynamic Multi-Kill Rampage Combos & decay verified');

// ------------------------------------------------------------
// 2. Heart-Pounding Clutch Systems
// ------------------------------------------------------------
console.log('\n--- 3. Testing Citadel Aegis Protocol (Last Stand Clutch) ---');
G.lives = 10;
G.aegisTriggeredThisMatch = false;
G.enemies = [
  { id: 301, d: 250, seg: 0, pathId: 0, x: 250, y: 150, hp: 200, dead: false, r: 12 },
  { id: 302, d: 300, seg: 0, pathId: 0, x: 300, y: 150, hp: 200, dead: false, r: 12 }
];

// Base takes critical damage reducing lives to 2
G.lives = 2;
nb.checkCitadelAegis();
assert.strictEqual(G.aegisTriggeredThisMatch, true, 'Aegis protocol must trigger once per match');
assert(G.aegisLockdownT > 0, 'Bullet-time lockdown duration must be set to 3.0s');
assert(G.aegisOverchargeT > 0, 'Overcharged grid timer must be set to 10.0s');
assert(G.enemies[0].d < 250, 'All hostiles must be pushed back by Repulsor shockwave');
assert(G.banner && G.banner.text.includes('CITADEL AEGIS PROTOCOL'), 'Citadel Aegis banner must be announced');
console.log('✔ Citadel Aegis Protocol (Bullet-Time Dilation & Repulsor Shockwave) verified');

// ------------------------------------------------------------
// 3. Titan Mech Aegis Parry & Heavy Mortars
// ------------------------------------------------------------
console.log('\n--- 4. Testing Titan Mech Aegis Parry & Battlefield Hazards ---');
G.mech.x = 400;
G.mech.y = 300;
G.mech.active = true;

// Spawn an incoming hostile mortar targeting near Titan Mech (distance <= 75px)
const mortar = nb.spawnHostileMortar(100, 100, 420, 310, null);
assert(mortar, 'Hostile mortar must be spawned');
assert.strictEqual(mortar.reflected, false, 'Mortar is initially unreflected');

// Trigger Titan Parry
mortar.x = 415; mortar.y = 305; // mortar enters parry radius
const parrySuccess = nb.triggerTitanParry();
assert.strictEqual(parrySuccess, true, 'Parry should succeed within 75px');
assert.strictEqual(mortar.reflected, true, 'Mortar must become reflected');
assert(mortar.damage > 500, 'Reflected damage must be boosted by 350%');
assert(G.hitStopT > 0, 'Hit-stop micro freeze must be triggered on parry');

// Test unreflected mortar landing spawns Molten Slag
const groundMortar = { id: 999, sx: 0, sy: 0, tx: 500, ty: 400, radius: 45, damage: 200, reflected: false };
nb.detonateMortar(groundMortar);
assert(G.moltenSlags.length > 0, 'Detonating unreflected mortar must create a Molten Slag pool');
const slag = G.moltenSlags[G.moltenSlags.length - 1];
assert.strictEqual(slag.x, 500, 'Molten slag placed at impact X');
assert.strictEqual(slag.y, 400, 'Molten slag placed at impact Y');
console.log('✔ Titan Mech Aegis Parry & Battlefield Molten Slag hazards verified');

// ------------------------------------------------------------
// 4. The Harmonic Cadence (4-Element Symphony)
// ------------------------------------------------------------
console.log('\n--- 5. Testing The Harmonic Cadence Overdrive ---');
G.harmonicCadenceT = 0;
G.recentElements = { phys: 0, plasma: 0, cryo: 0, energy: 0 };
const testTarget = { id: 501, x: 600, y: 300, hp: 5000, maxHp: 5000, dead: false, r: 16 };
G.enemies = [testTarget];

// Strike target with all 4 elements in rapid sequence
nb.dealDamage(testTarget, 10, 'phys', null);
nb.dealDamage(testTarget, 10, 'plasma', null);
nb.dealDamage(testTarget, 10, 'cryo', null);
nb.dealDamage(testTarget, 10, 'energy', null);

assert(G.harmonicCadenceT > 0, 'Triggering all 4 elements within 3s must activate Harmonic Cadence Overdrive');
assert(G.banner && G.banner.text.includes('HARMONIC CADENCE'), 'Harmonic Cadence banner announced');

// Verify unlimited munitions and zero heat during Cadence
const testTower = { type: 'gatling', tier: 0, shotsFired: 0, heat: 0 };
G.logistics = { kinetic: 100, policy: 'standard' };
nb.consumeTowerAmmo(testTower);
assert.strictEqual(G.logistics.kinetic, 100, 'Zero ammo burned during Harmonic Cadence');
console.log('✔ The Harmonic Cadence Overdrive (4-Element Symphony) verified');

// ------------------------------------------------------------
// 5. Chronos Tungsten Orbital Spear
// ------------------------------------------------------------
console.log('\n--- 6. Testing Chronos Tungsten Orbital Spear ---');
G.chronosSpearAvailable = true;
G.chronosSpearActive = null;
const spearLaunched = nb.triggerChronosSpear(350, 250);
assert.strictEqual(spearLaunched, true, 'Chronos spear should launch successfully');
assert.strictEqual(G.chronosSpearAvailable, false, 'Spear becomes unavailable while recharging');
assert(G.chronosSpearActive && G.chronosSpearActive.state === 'targeting', 'Spear enters targeting state');

// Advance time until impact (1.0s laser warmup)
const spearBoss = { id: 601, x: 350, y: 250, hp: 2000, maxHp: 2000, dead: false, r: 20 };
G.enemies = [spearBoss];
nb.updateVisceralSystems(1.1);
assert.strictEqual(G.chronosSpearActive.state, 'chasm', 'Spear transitions to Singularity Gravity Chasm');
assert(spearBoss.hp < 1000, 'Primary target must suffer 70% Max HP tungsten penetration strike');

// Verify gravity vortex chasm pull
const swarmer = { id: 602, x: 380, y: 250, hp: 100, maxHp: 100, dead: false, r: 8 };
G.enemies.push(swarmer);
const initialDist = Math.hypot(swarmer.x - 350, swarmer.y - 250);
nb.updateVisceralSystems(0.2);
const newDist = Math.hypot(swarmer.x - 350, swarmer.y - 250);
assert(newDist < initialDist, 'Enemies inside Singularity Chasm must be drawn into gravitational center');
console.log('✔ Chronos Tungsten Orbital Spear & Singularity Chasm verified');

// ------------------------------------------------------------
// 6. Autonomous Titan Mech AI Companion
// ------------------------------------------------------------
console.log('\n--- 7. Testing Autonomous Titan Mech AI Companion ---');
G.mech.active = false;
G.mech.isDocked = false;
G.mech.x = 500;
G.mech.y = 300;

// Test companion mode switching
const mode1 = nb.setMechCompanionMode('bulwark');
assert.strictEqual(G.mechCompanionMode, 'bulwark', 'Companion mode set to bulwark');

const mode2 = nb.setMechCompanionMode(); // cycle
assert.strictEqual(G.mechCompanionMode, 'hunter', 'Companion mode cycled to hunter');

const mode3 = nb.setMechCompanionMode(); // cycle
assert.strictEqual(G.mechCompanionMode, 'sentry', 'Companion mode cycled to sentry');

// Radio Voice Line Verification
nb.triggerMechVoiceLine('parry');
assert(G.mechRadioMessage && G.mechRadioMessage.text.includes('deflected'), 'Parry radio voice line correctly formatted');
nb.updateVisceralSystems(4.0);
assert.strictEqual(G.mechRadioMessage, null, 'Radio message expires after duration');
console.log('✔ Autonomous Titan Mech AI Companion & Radio Comms verified');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 13.0: VISCERAL RESONANCE TESTS PASSED (100%)');
console.log('============================================================\n');
