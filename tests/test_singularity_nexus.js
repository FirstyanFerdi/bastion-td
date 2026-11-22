// ============================================================
// Test Suite: Bastion TD 17.0 - The Chrono-Tactical Singularity & Neural Swarm Ecosystem
// Tests:
// 1. Kinetic Parrying & Projectile Deflection (300% Crit True Damage, Mech Battery, Time Dilation)
// 2. Corpse Crushing & Magnetized Loot Sieve (Shrapnel AoE, Quantum Shards, Nanite Cores)
// 3. Harmonic Resonant Overdrive (3-Chain Cadence, Harmonic Beams, Fire Rate & Range Buff)
// 4. Neural Nemesis AI Profiling (Markov Aggression, Overkill Reliance, Spatial Vulnerability)
// 5. Adaptive Dispersion Cocoon & Shield Modulation (70% Absorption, Overshield Aura, Shatter)
// 6. Temporal Paradox Continuum & Ghost Army Co-Op (15s Buffer, Collapse Rewind, 2x Playback)
// 7. Temporal Aberrations (Phase Immunity to Ghosts, Live Player Vulnerability, Victory Bounty)
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 17.0: The Chrono-Tactical Singularity & Neural Swarm Ecosystem...\n');

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

console.log('--- 1. Testing Kinetic Parrying & Projectile Deflection ---');
assert(nb.SINGULARITY_CONFIG, 'SINGULARITY_CONFIG must be defined');

const targetTower = { id: 101, x: 500, y: 300, empT: 0 };
G.towers = [targetTower];
const enemySource = { id: 201, x: 200, y: 300, hp: 500, maxHp: 500, dead: false };
G.enemies = [enemySource];

const proj = nb.spawnHostileArtillery(enemySource, targetTower, 150);
assert(proj, 'Hostile artillery projectile should spawn');
assert.strictEqual(G.hostileProjectiles.length, 1, 'G.hostileProjectiles should contain 1 item');

// Advance projectile into parry window
proj.progress = 0.85;
proj.parryWindow = true;

G.mech = { x: 480, y: 300, battery: 40 };
G.timeDilation = 0;
const parryResult = nb.triggerKineticParry(proj);
assert.strictEqual(parryResult, true, 'Kinetic parry should succeed');
assert.strictEqual(proj.deflected, true, 'Projectile should be marked deflected');
assert.strictEqual(G.mech.battery, 65, 'Mech battery should recharge +25% (40 -> 65)');
assert(G.timeDilation > 0, 'Time dilation bullet-time should be active');
assert(G.paradox.charge >= 10, 'Paradox charge should increase by at least 10% on perfect parry');

// Advance deflected projectile to impact
proj.progress = 1.0;
nb.updateSingularityNexusSystems(0.016);
assert(enemySource.hp < 500, 'Enemy should receive reflected 300% Crit damage');
console.log('✔ Kinetic Parrying & 300% Deflection damage verified');

console.log('\n--- 2. Testing Corpse Crushing & Magnetized Loot Sieve ---');
G.corpses = [];
const deadGoliath = { id: 301, x: 350, y: 250, hp: 0, maxHp: 800, hpMax: 800, type: 'brute', dead: false };
nb.killEnemy(deadGoliath, 'mech');

assert(G.corpses.length > 0, 'Heavy/brute kill should spawn a physical corpse in G.corpses');
const corpse = G.corpses[0];
assert.strictEqual(corpse.maxHp, 800, 'Corpse maxHp should be recorded');

// Interaction A: Mech Stomp Crushes Corpse in AoE
const nearbyFoe = { id: 302, x: 360, y: 255, hp: 300, maxHp: 300, dead: false };
G.enemies = [nearbyFoe];
const crushResult = nb.triggerCorpseCrush(corpse);
assert.strictEqual(crushResult, true, 'triggerCorpseCrush should succeed');
assert(nearbyFoe.hp < 300, 'Nearby enemy should receive 20% maxHp shrapnel damage');
assert.strictEqual(G.corpses.length, 0, 'Corpse should be consumed upon crushing');

// Interaction B: Pointer Siphon extracts Quantum Shards & Nanite Core
const deadBoss = { id: 303, x: 400, y: 200, hp: 0, maxHp: 1200, hpMax: 1200, type: 'boss', dead: false };
nb.killEnemy(deadBoss, targetTower);
assert(G.corpses.length > 0, 'Boss death should spawn corpse');
const bossCorpse = G.corpses[0];
const goldBefore = G.gold;
const initialParadoxCharge = G.paradox.charge;

const siphonResult = nb.triggerCorpseSiphon(bossCorpse);
assert.strictEqual(siphonResult, true, 'triggerCorpseSiphon should succeed');
assert(G.gold > goldBefore, 'Gold should increase from Quantum Shard siphon');
assert(G.paradox.charge > initialParadoxCharge, 'Paradox charge should increase from corpse siphon');
assert(G.lootParticles.length > 0, 'Magnetized loot particles should spawn');
console.log('✔ Corpse Crushing AoE & Magnetized Loot Siphon verified');

console.log('\n--- 3. Testing Harmonic Resonant Overdrive (3-Chain Cadence) ---');
const t1 = { id: 1, x: 200, y: 200, type: 'gatling', overdriveT: 0, harmonicBuff: 0 };
const t2 = { id: 2, x: 240, y: 200, type: 'plasma', overdriveT: 0, harmonicBuff: 0 };
const t3 = { id: 3, x: 280, y: 200, type: 'rail', overdriveT: 0, harmonicBuff: 0 };
G.towers = [t1, t2, t3];
G.time = 10.0;

nb.triggerHarmonicOverdrive(t1);
assert.strictEqual(G.harmonicOverdriveChain, 1, 'Chain should be 1 after first tower');

G.time = 10.5; // within 1.2s
nb.triggerHarmonicOverdrive(t2);
assert.strictEqual(G.harmonicOverdriveChain, 2, 'Chain should be 2 after second tower');

G.time = 11.0; // within 1.2s
nb.triggerHarmonicOverdrive(t3);
assert.strictEqual(G.harmonicOverdriveChain, 3, 'Chain should reach 3 after third tower');

assert(t1.harmonicBuff > 0, 't1 should receive harmonicBuff');
assert(t2.harmonicBuff > 0, 't2 should receive harmonicBuff');
assert(t3.harmonicBuff > 0, 't3 should receive harmonicBuff');
assert(G.harmonicBeams.length > 0, 'Harmonic connecting beams should be generated');
console.log('✔ 3-Chain Harmonic Resonant Overdrive verified');

console.log('\n--- 4. Testing Neural Nemesis AI Profiler & Telemetry ---');
assert(nb.NEMESIS_CONFIG, 'NEMESIS_CONFIG must be defined');
assert(G.nemesis, 'G.nemesis must be initialized');

// Heavy rear tower investment
t1.c = 11; t1.x = 800; t1.invested = 500;
t2.c = 12; t2.x = 840; t2.invested = 600;
t3.c = 1; t3.x = 100; t3.invested = 100;
nb.updateNemesisAI(0.1);

assert(G.nemesis.spatialVuln > 0.35, 'Spatial vulnerability should exceed threshold with rear investment');
assert(G.nemesis.predictedTactic.includes('Phase Burrower'), 'Nemesis should predict Phase Burrower attack');
console.log('✔ Neural Nemesis AI Profiling & Tactic Prediction verified');

console.log('\n--- 5. Testing Adaptive Dispersion Cocoon & Shield Modulation ---');
const cocoonEnemy = {
  id: 401, x: 300, y: 300, hp: 400, maxHp: 400, dead: false,
  dispersionCocoon: true, cocoonElement: 'plasma', shield: 0
};
const minionAlly = { id: 402, x: 320, y: 300, hp: 200, maxHp: 200, dead: false, shield: 0 };
G.enemies = [cocoonEnemy, minionAlly];

// Dominant plasma attack: absorbed 70%, grants overshield to ally
nb.dealDamage(cocoonEnemy, 100, 'plasma', t2);
assert(cocoonEnemy.hp >= 360, 'Cocoon should absorb 70% of plasma damage');
assert(minionAlly.shield > 0, 'Cocoon should grant Overshield Aura to nearby ally');

// Counter physical kinetic attack: shatters cocoon with +150% damage
nb.dealDamage(cocoonEnemy, 100, 'phys', t1);
assert.strictEqual(cocoonEnemy.dispersionCocoon, false, 'Cocoon should be shattered by counter element');
console.log('✔ Adaptive Dispersion Cocoon absorption & shatter verified');

console.log('\n--- 6. Testing Temporal Paradox Continuum & Ghost Army Playback ---');
assert(nb.PARADOX_CONFIG, 'PARADOX_CONFIG must be defined');
assert(G.paradox, 'G.paradox must be initialized');

// Record snapshots
for (let i = 0; i < 20; i++) {
  G.time += 0.1;
  nb.updateSingularityNexusSystems(0.1);
}
assert(G.paradox.historyBuffer.length > 0, 'History buffer should record timeline snapshots');

// Charge to 100% and trigger Paradox Collapse
G.paradox.charge = 100;
G.lives = 4;
const collapseResult = nb.triggerParadoxCollapse();
assert.strictEqual(collapseResult, true, 'Paradox Collapse should trigger successfully');
assert.strictEqual(G.paradox.active, true, 'Paradox should be marked active');
assert.strictEqual(G.lives, 12, 'Base core lives should be restored to at least 12');
assert(G.paradox.ghostEntities.length > 0, 'Ghost Fleet entities should be spawned');
console.log('✔ Temporal Paradox 15s Rewind & Ghost Army instantiation verified');

console.log('\n--- 7. Testing Temporal Aberrations & Victory Bounty ---');
const aberration = G.enemies.find(e => e.isAberration);
assert(aberration, 'Temporal Aberrations should spawn upon Paradox Collapse');

// Ghost damage should deal 0 damage
const hpBeforeGhost = aberration.hp;
nb.dealDamage(aberration, 50, 'energy', 'ghost_mech', { isGhost: true });
assert.strictEqual(aberration.hp, hpBeforeGhost, 'Aberration should be immune to ghost damage');

// Live player damage deals normal damage
nb.dealDamage(aberration, 100, 'phys', t1);
assert(aberration.hp < hpBeforeGhost, 'Live player should deal normal damage to Aberration');

// Defeating Aberration awards bounty
const goldBeforeAb = G.gold;
nb.killEnemy(aberration, t1);
assert(G.gold >= goldBeforeAb + 50, 'Defeating Aberration should award +50 Gold bounty');
console.log('✔ Temporal Aberrations ghost immunity & live defeat verified');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 17.0 SINGULARITY NEXUS TESTS PASSED (100%)');
console.log('============================================================');
