// tests/test_crucible_ascendancy.js
// Comprehensive Test Suite for Bastion TD 10.0: The Crucible of Ascendancy
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

console.log('=== RUNNING BASTION TD 10.0: CRUCIBLE OF ASCENDANCY TEST SUITE ===\n');

const nb = window.__nb;
const G = nb.G;

// ============================================================
// PILLAR 1: Skill Profiler & Adaptive Combat Efficiency Rating (CER)
// ============================================================
console.log('--- 1. Testing Skill Profiler & Combat Efficiency Rating (CER) ---');

assert(G.cer !== undefined, 'G.cer should be initialized in newGame');
assert.strictEqual(G.cer, 1.0, 'Baseline CER should start at 1.0');

// Simulate high player action activity (APM > 60, high gold buffer, fast killzone)
G.state = 'active';
for (let i = 0; i < 25; i++) {
  nb.trackPlayerAction();
}
G.gold = 1000;
nb.updateSkillProfiler(2.1); // Trigger evaluation interval

console.log('Updated CER on high action & gold buffer:', G.cer);
assert(G.cer > 1.0, 'CER should rise above 1.0 under high player activity');

// Verify that if CER exceeds high threshold, it triggers mutator tracking
assert.strictEqual(typeof nb.SKILL_PROFILER_CONFIG, 'object', 'SKILL_PROFILER_CONFIG should be exported');
assert.strictEqual(nb.SKILL_PROFILER_CONFIG.highThreshold, 1.35, 'High threshold should be 1.35');
console.log('✓ Pillar 1: Adaptive Threat Director & CER Passed\n');


// ============================================================
// PILLAR 2: Crucible Gambits (High-Stakes Punishment & Reward Wagers)
// ============================================================
console.log('--- 2. Testing Crucible Gambits Wager System ---');

assert.strictEqual(typeof nb.CRUCIBLE_GAMBITS, 'object', 'CRUCIBLE_GAMBITS should exist');
assert(nb.CRUCIBLE_GAMBITS.blood_oath, 'Blood Oath gambit must be defined');
assert(nb.CRUCIBLE_GAMBITS.meltdown, 'Meltdown gambit must be defined');
assert(nb.CRUCIBLE_GAMBITS.void_tithe, 'Void Tithe gambit must be defined');
assert(nb.CRUCIBLE_GAMBITS.blind_perimeter, 'Blinded Perimeter gambit must be defined');

// Activate Blood Oath
nb.activateGambit('blood_oath');
assert.strictEqual(G.activeGambit, 'blood_oath', 'Active gambit should be blood_oath');

// Wave start under Blood Oath forces 1 live
G.lives = 25;
nb.startWave();
assert.strictEqual(G.lives, 1, 'Blood Oath must force lives to exactly 1 on wave start');

// Wave clear under Blood Oath pays +200% interest and +3 cores
G.gold = 100;
G.leakedThisWave = 0;
const prevCores = SAVE.cores || 0;
onWaveClear();
assert(G.gold >= 300, 'Blood Oath clear should pay at least +200% interest (got ' + G.gold + ')');
assert((SAVE.cores || 0) >= prevCores + 3, 'Blood Oath clear should reward +3 cores');

// Test Meltdown: 100% crit rate
nb.activateGambit('meltdown');
assert.strictEqual(G.activeGambit, 'meltdown', 'Active gambit should switch to meltdown');
const dummyEnemy = { x: 100, y: 100, r: 12, hp: 500, maxHp: 500, dead: false, type: 'grunt', armor: 0 };
const dmgOpts = {};
nb.dealDamage(dummyEnemy, 100, 'phys', null, dmgOpts);
assert.strictEqual(dmgOpts.crit, true, 'Meltdown gambit must guarantee critical strikes');

// Test Void Tithe: Megastructure 4x damage
nb.activateGambit('void_tithe');
const dummyMega = { type: 'ion_uplink' };
const megaTarget = { x: 100, y: 100, r: 12, hp: 1000, maxHp: 1000, dead: false, type: 'grunt', armor: 0 };
const dealtDmg = nb.dealDamage(megaTarget, 100, 'energy', dummyMega, {});
assert.strictEqual(dealtDmg, 400, 'Void Tithe must quadruple megastructure damage output (100 * 4 = 400)');

// Test Blinded Perimeter: 2x gold bounty
nb.activateGambit('blind_perimeter');
G.gold = 50;
const enemyBounty = { x: 100, y: 100, r: 12, hp: 10, maxHp: 10, reward: 20, dead: false, type: 'grunt' };
nb.killEnemy(enemyBounty, null);
assert.strictEqual(G.gold, 50 + (20 * 2), 'Blinded perimeter must double gold reward on kill (20 * 2 = 40)');

console.log('✓ Pillar 2: Crucible Gambits Wagers Passed\n');


// ============================================================
// PILLAR 3: Spatial Puzzle Mechanics (Photon Prisms & Singularity Pen)
// ============================================================
console.log('--- 3. Testing Photon Reflection Prisms & Singularity Pen ---');

assert.strictEqual(typeof nb.PHOTON_PRISM_CONFIG, 'object', 'PHOTON_PRISM_CONFIG must exist');
assert.strictEqual(nb.PHOTON_PRISM_CONFIG.cost, 60, 'Prism cost should be 60 Gold');

// Verify placement validation
G.gold = 500;
const validGround = nb.canPlacePrism(10, 4);
assert.strictEqual(validGround, true, 'Cell (10,4) should be valid free ground for prism');

// Find 3 valid ground coordinates
const freeTiles = [];
for (let r = 1; r < ROWS - 1; r++) {
  for (let c = 1; c < COLS - 1; c++) {
    if (nb.canPlacePrism(c, r)) freeTiles.push({ c, r });
  }
}
assert(freeTiles.length >= 3, 'Should have at least 3 free tiles');
let t1 = null, t2 = null, t3 = null;
outer:
for (let i = 0; i < freeTiles.length; i++) {
  for (let j = i + 1; j < freeTiles.length; j++) {
    const d12 = Math.hypot((freeTiles[i].c - freeTiles[j].c) * TILE, (freeTiles[i].r - freeTiles[j].r) * TILE);
    if (d12 > 240) continue;
    for (let k = j + 1; k < freeTiles.length; k++) {
      const d23 = Math.hypot((freeTiles[j].c - freeTiles[k].c) * TILE, (freeTiles[j].r - freeTiles[k].r) * TILE);
      const d31 = Math.hypot((freeTiles[k].c - freeTiles[i].c) * TILE, (freeTiles[k].r - freeTiles[i].r) * TILE);
      if (d23 <= 240 && d31 <= 240) {
        const area = Math.abs((freeTiles[i].c * (freeTiles[j].r - freeTiles[k].r) + freeTiles[j].c * (freeTiles[k].r - freeTiles[i].r) + freeTiles[k].c * (freeTiles[i].r - freeTiles[j].r)) / 2);
        if (area > 0.5) {
          t1 = freeTiles[i]; t2 = freeTiles[j]; t3 = freeTiles[k];
          break outer;
        }
      }
    }
  }
}
assert(t1 && t2 && t3, 'Should find 3 neighboring free tiles forming a triangle');

// Deploy 3 Prisms
const p1 = nb.placePrism(t1.c, t1.r);
const p2 = nb.placePrism(t2.c, t2.r);
const p3 = nb.placePrism(t3.c, t3.r);

assert(p1 && p2 && p3, 'All 3 prisms should be successfully constructed');
assert.strictEqual(G.prisms.length, 3, 'G.prisms should have 3 items');
assert.strictEqual(p1.type, 'photon_prism', 'Prism defense type should be photon_prism');

// Rotate Prism
const initialAngle = p1.angle;
nb.rotatePrism(p1);
assert.strictEqual(p1.angle, initialAngle + Math.PI / 2, 'Rotating prism should rotate angle by 90 degrees');

// Verify Singularity Pen triangle creation
assert.strictEqual(G.singularityPens.length, 1, 'Connecting 3 prisms must form exactly 1 Singularity Pen');
const pen = G.singularityPens[0];
assert.strictEqual(pen.prisms.length, 3, 'Singularity Pen must bind 3 prism vertices');

// Test point inside Singularity Pen triangle
const centerInsideX = (p1.x + p2.x + p3.x) / 3;
const centerInsideY = (p1.y + p2.y + p3.y) / 3;
const dummyTrapped = { x: centerInsideX, y: centerInsideY, d: 100, dead: false, speed: 1.0, armor: 50 };
G.enemies = [dummyTrapped];

nb.updatePrisms(1.0); // 1.0 second update inside pen
assert(dummyTrapped.slowT > 0, 'Hostile inside Singularity Pen should be afflicted with stasis slow');
assert.strictEqual(dummyTrapped.slowAmt, 0.60, 'Singularity Pen slow amount should be 60%');
assert(dummyTrapped.armor < 50, 'Singularity Pen should shred hostile armor over time');

console.log('✓ Pillar 3: Photon Prisms & Singularity Pen Passed\n');


// ============================================================
// PILLAR 4: Living Enigma Boss & Citadel Devastator Apocalyptic Interrupt
// ============================================================
console.log('--- 4. Testing Living Enigma Boss & Citadel Devastator ---');

assert.strictEqual(typeof nb.ENIGMA_BOSS_CONFIG, 'object', 'ENIGMA_BOSS_CONFIG must exist');
assert.strictEqual(nb.ENIGMA_BOSS_CONFIG.cycleInterval, 8.0, 'Enigma element shift cycle should be 8 seconds');

G.enigmaPolarity = 'thermal';
const enigmaBoss = { x: 200, y: 200, r: 28, hp: 1000, maxHp: 2000, type: 'boss', dead: false, armor: 0 };
G.enemies = [enigmaBoss];

// Test Polarity Absorption: Thermal polarity absorbs plasma damage to HEAL!
const hpBefore = enigmaBoss.hp;
const dealtPlasma = nb.dealDamage(enigmaBoss, 100, 'plasma', null, {});
assert.strictEqual(dealtPlasma, 0, 'Absorbed element should deal 0 effective damage');
assert.strictEqual(enigmaBoss.hp, hpBefore + (100 * 1.5), 'Absorbed element should heal boss by 150% of incoming damage');

// Test Polarity Vulnerability: Thermal polarity takes 200% damage from Cryo!
const dealtCryo = nb.dealDamage(enigmaBoss, 100, 'cryo', null, {});
assert.strictEqual(dealtCryo, 200, 'Counter element cryo should deal 200% amplified damage');

// Test Citadel Devastator Wipe Countdown Activation at <= 30% HP
enigmaBoss.hp = 500; // 500 / 2000 = 25% HP (<= 30%)
nb.updateEnigmaBoss(0.5);
assert(G.devastatorTimer > 10.0 && G.devastatorTimer <= 12.0, 'Devastator wipe countdown should be armed (~12.0s)');
assert.strictEqual(G.catalystPylons.length, 3, 'Devastator armed state must spawn 3 Catalyst Pylons');

// Destroy 2 pylons -> Countdown should still be active
nb.damageCatalystPylon(G.catalystPylons[0].id, 400);
nb.damageCatalystPylon(G.catalystPylons[1].id, 400);
nb.updateEnigmaBoss(0.5);
assert(G.devastatorTimer > 0, 'Devastator countdown should remain active while pylons remain');

// Destroy 3rd pylon -> Devastator countdown MUST be interrupted and cancelled!
nb.damageCatalystPylon(G.catalystPylons[2].id, 400);
nb.updateEnigmaBoss(0.5);
assert.strictEqual(G.devastatorTimer, 0, 'Destroying all 3 catalyst pylons must cancel Devastator wipe countdown!');

console.log('✓ Pillar 4: Enigma Boss & Citadel Devastator Interruption Passed\n');


// ============================================================
// PILLAR 5: Tactical Bullet-Time Matrix & Rhythm Overdrive Calibration
// ============================================================
console.log('--- 5. Testing Bullet-Time Matrix & Rhythm Calibration ---');

// Bullet-Time Activation
G.state = 'active';
G.bulletTimeCd = 0;
const btSuccess = nb.triggerBulletTime();
assert.strictEqual(btSuccess, true, 'triggerBulletTime should succeed');
assert.strictEqual(G.bulletTimeT, 4.0, 'Bullet-Time duration should be 4.0 seconds');
assert.strictEqual(G.bulletTimeCd, 45.0, 'Bullet-Time cooldown should be 45.0 seconds');

// Paint 5 targets during bullet-time
const targets = [];
for (let i = 0; i < 5; i++) {
  const foe = { x: 300 + i * 20, y: 300, r: 16, hp: 2000, maxHp: 2000, type: 'brute', dead: false, armor: 0 };
  targets.push(foe);
}
G.enemies = targets;

for (let i = 0; i < 4; i++) {
  const painted = nb.paintBulletTimeTarget(targets[i].x, targets[i].y);
  assert.strictEqual(painted, true, 'Should mark weakpoint target #' + (i + 1));
}
assert.strictEqual(G.bulletTimePainted.length, 4, 'Should have 4 marked targets');

// Mark 5th target -> Triggers 1500 True Damage Orbital Execution Cleave
const finalMark = nb.paintBulletTimeTarget(targets[4].x, targets[4].y);
assert.strictEqual(finalMark, true, '5th target marking should succeed');
assert.strictEqual(targets[0].hp, 500, 'Target should suffer 1500 True Damage cleave (2000 - 1500 = 500)');
assert.strictEqual(G.bulletTimePainted.length, 0, 'Marked list should reset after execution cleave');

// Test Rhythm Overdrive Calibration
const dummyTower = { x: 100, y: 100, heat: 80, overclockT: 0, stunT: 0, type: 'gatling' };
// Perfect timing
nb.triggerRhythmOverclock(dummyTower, 'perfect');
assert.strictEqual(dummyTower.overclockT, 20, 'Perfect timing should grant 20s overclock');
assert.strictEqual(dummyTower.heat, 0, 'Perfect timing should instantly vent all heat to 0');
assert.strictEqual(dummyTower.rhythmSync, true, 'Perfect timing should set rhythmSync flag');

// Miss timing -> Thermal backfire stun
nb.triggerRhythmOverclock(dummyTower, 'miss');
assert.strictEqual(dummyTower.stunT, 3.0, 'Miss timing should cause 3.0s thermal backfire stun');

console.log('✓ Pillar 5: Bullet-Time Matrix & Rhythm Overdrive Passed\n');


// ============================================================
// PILLAR 6: Pandora Relics & Physical Midas Coins
// ============================================================
console.log('--- 6. Testing Pandora Relics & Decaying Midas Coins ---');

assert.strictEqual(typeof nb.PANDORA_RELICS, 'object', 'PANDORA_RELICS must be exported');
assert(nb.PANDORA_RELICS.glass_monolith, 'Glass Monolith relic must be defined');
assert(nb.PANDORA_RELICS.midas_transmutation, 'Midas Transmutation relic must be defined');
assert(nb.PANDORA_RELICS.chrono_debt, 'Chrono Debt relic must be defined');

// Apply Glass Monolith
nb.applyPandoraRelic('glass_monolith');
assert.strictEqual(G.pandoraRelics.glass_monolith, true, 'Glass monolith should be bound');
const glassTarget = { x: 50, y: 50, r: 12, hp: 1000, maxHp: 1000, dead: false, type: 'grunt', armor: 0 };
const glassDmg = nb.dealDamage(glassTarget, 100, 'phys', null, {});
assert.strictEqual(glassDmg, 180, 'Glass Monolith must amplify damage by +80% (100 * 1.80 = 180)');

// Apply Midas' Transmutation
nb.applyPandoraRelic('midas_transmutation');
assert.strictEqual(G.pandoraRelics.midas_transmutation, true, 'Midas Transmutation should be bound');

// Defeating an enemy should now spawn physical Midas coins
G.midasCoins = [];
const richEnemy = { x: 120, y: 120, r: 14, reward: 50, dead: false, type: 'carrier' };
nb.killEnemy(richEnemy, null);
assert.strictEqual(G.midasCoins.length, 1, 'Kill with Midas Transmutation must drop a physical Midas coin');
const droppedCoin = G.midasCoins[0];
assert(droppedCoin.gold >= 100, 'Midas coin should drop double gold bounty (>= 100)');

// Collecting the coin
const goldBeforeCollect = G.gold;
nb.collectMidasCoin(droppedCoin);
assert.strictEqual(G.gold, goldBeforeCollect + droppedCoin.gold, 'Collecting coin should grant full coin gold to player');
assert.strictEqual(G.midasCoins.length, 0, 'Collected coin must be removed from field');

// Coin decaying/expiring test
nb.spawnMidasCoin(150, 150, 60);
assert.strictEqual(G.midasCoins.length, 1, 'One coin spawned for decay test');
nb.updateMidasCoins(4.0); // 4 seconds pass (lifespan is 3.5s)
assert.strictEqual(G.midasCoins.length, 0, 'Expired coin must rott and disappear without player picking it up');

console.log('✓ Pillar 6: Pandora Relics & Midas Coins Passed\n');

console.log('====================================================');
console.log('🎉 ALL 6 PILLARS OF BASTION TD 10.0 PASSED WITH 100% SUCCESS!');
console.log('====================================================');
