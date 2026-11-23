// ============================================================
// Test Suite: Bastion TD 20.0 - The Transcendent Architecture & Non-Euclidean Crucible
// Tests:
// 1. Chrono-Topological Space-Folding (Non-Euclidean Spatial Transit & Stress Accumulation)
// 2. Space-Fold Railgun Piercing Echo & Abyssal Tear Rift (Void Phantoms)
// 3. Epigenetic Swarm Neural Network (Cryo-Sublimation, Faraday Absorber, Chitin Hardening, Mutagen Purge)
// 4. Supercritical Core Meltdown & Push-Your-Luck Thermal Cascade (10,000 Nuke Detonation, Craters, Cooling)
// 5. Causal Paradox Co-Op (12s Rewind, Ghost Timeline Fleet, Causal Wraith Immunity)
// 6. Titan Mech Tri-Stance Overdrive (Siege Bastion Hub, Matter Siphon Heat Sinking, Valkyrie Blade)
// 7. Visceral Kinetic Parrying & Titan Execution Finisher
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 20.0: The Transcendent Architecture & Non-Euclidean Crucible...\n');

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
G.wave = 6;
G.gold = 5000;

console.log('--- 1. Testing Chrono-Topological Space-Folding (Non-Euclidean Spatial Transit) ---');
assert(nb.SPACE_FOLD_CONFIG, 'SPACE_FOLD_CONFIG must be defined');
assert(G.spatialFolds, 'G.spatialFolds must be initialized');

const p1 = posAt(100, 0, 0);
const fold = nb.createSpatialFold(p1.x, p1.y, 400, 400);
assert(fold, 'Spatial fold should be successfully created');
assert.strictEqual(fold.active, true, 'Fold should be active');
assert.strictEqual(fold.stress, 0, 'Initial stress should be 0');

// Enemy stepping into anchor ptA
const traveler = {
  id: 101, x: p1.x, y: p1.y, hp: 500, maxHp: 500, dead: false, speed: 0, d: 100, seg: 0, off: 0, ang: 0, pathId: 0,
  slowAmt: 0, slowT: 0, stunT: 0, armor: 0.1
};
G.enemies = [traveler];
nb.updateEnemy(traveler, 0.01);

assert.strictEqual(traveler.x, 400, 'Enemy should be teleported across space-fold to ptB.x');
assert.strictEqual(traveler.y, 400, 'Enemy should be teleported across space-fold to ptB.y');
assert(fold.stress > 0, 'Passing through fold should accumulate stress');

// Stabilize fold
const initialStress = fold.stress;
nb.stabilizeSpatialFold(fold, 10);
assert(fold.stress < initialStress, 'Stabilizing fold should decrease stress');
console.log('✔ Space-Fold creation, non-euclidean transit, stress accumulation, and stabilization verified');

console.log('\n--- 2. Testing Space-Fold Railgun Piercing Echo & Abyssal Tear ---');
const railTower = { id: 201, x: 80, y: 80, type: 'rail', tier: 2 };
const targetEnemy = { id: 202, x: fold.ptA.x, y: fold.ptA.y, hp: 1000, maxHp: 1000, dead: false, armor: 0 };
G.enemies = [targetEnemy];
G.towers = [railTower];

// Deal railgun damage near ptA of fold -> triggers 4x penetration echo
nb.dealDamage(targetEnemy, 100, 'phys', railTower, {});
assert(targetEnemy.hp <= 500, 'Railgun shot passing through fold anchor should deal 4x amplified echo damage');

// Overstress fold to trigger Abyssal Tear
fold.stress = 100;
nb.triggerAbyssalTear(fold);
assert.strictEqual(fold.active, false, 'Fold should deactivate upon Abyssal Tear');
assert(G.enemies.some(e => e.type === 'void_phantom'), 'Abyssal Tear should spawn Void Phantom enemies');
console.log('✔ Space-Fold 4x Railgun piercing echo and Abyssal Tear Void Phantom spawning verified');

console.log('\n--- 3. Testing Epigenetic Swarm Neural Network & Mutagen Purge ---');
assert(nb.EPIGENETIC_SWARM_CONFIG, 'EPIGENETIC_SWARM_CONFIG must be defined');
assert(G.epigeneticSwarm, 'G.epigeneticSwarm must be initialized');

// Accumulate cryo damage to exceed 55% threshold
G.epigeneticSwarm.damageVector = { phys: 50, cryo: 600, energy: 50, plasma: 50 };
G.epigeneticSwarm.evalTimer = 3.5;
nb.updateEpigeneticEvolution(0.1);

assert(G.epigeneticSwarm.activeMutations.includes('anti_cryo'), 'Swarm should evolve anti_cryo mutation');

// Test anti_cryo defense on enemy
const cryoFoe = { id: 301, x: 200, y: 200, hp: 500, maxHp: 500, dead: false, armor: 0.1 };
const swarmAlly = { id: 302, x: 220, y: 200, hp: 400, maxHp: 400, dead: false, speedBoostT: 0 };
G.enemies = [cryoFoe, swarmAlly];

nb.dealDamage(cryoFoe, 50, 'cryo', null, {});
assert(cryoFoe.armor >= 0.85, 'Cryo damage should trigger Cryo-Sublimation +75% armor');
assert(swarmAlly.speedBoostT >= 3.0, 'Nearby swarm allies should gain steam speed boost');

// Test Epigenetic Mutagen Purge
G.gold = 500;
const purged = nb.applyEpigeneticMutagen();
assert.strictEqual(purged, true, 'Mutagen purge should succeed');
assert.strictEqual(G.epigeneticSwarm.activeMutations.length, 0, 'Mutagen purge should reset swarm mutations');
console.log('✔ Epigenetic Swarm evolution, Cryo-Sublimation defense, and Mutagen Purge verified');

console.log('\n--- 4. Testing Supercritical Core Meltdown & Push-Your-Luck Thermal Cascade ---');
assert(nb.OVERCLOCK_CONFIG, 'OVERCLOCK_CONFIG must be defined');

const nukeTower = { id: 401, x: 250, y: 250, c: 6, r: 6, type: 'plasma', tier: 2, cd: 0, heat: 0 };
G.towers = [nukeTower];

// Overclock tower to 400% throttle
nb.setTowerThrottle(nukeTower, 4.0);
assert.strictEqual(nukeTower.throttle, 4.0, 'Tower throttle should be set to 4.0 (400%)');

// Heat up tower past 100
nukeTower.heat = 100;
nb.updateTower(nukeTower, 0.1);
assert.strictEqual(nukeTower.isSupercritical, true, 'Tower should enter Supercritical state at 100% heat');
assert(nukeTower.supercriticalT > 0, 'Supercritical timer should be active');

// Test Cooling before meltdown
nb.coolTower(nukeTower, 40);
assert(nukeTower.heat < 80, 'Cooling tower should drop heat below 80');
assert.strictEqual(nukeTower.isSupercritical, false, 'Cooling should avert Supercritical Meltdown');

// Test actual Meltdown Detonation
nukeTower.isSupercritical = true;
nukeTower.supercriticalT = 0.05;
const bossVictim = { id: 402, x: 280, y: 280, hp: 12000, maxHp: 15000, dead: false };
G.enemies = [bossVictim];

nb.updateTower(nukeTower, 0.1); // triggers triggerCoreMeltdown
assert(bossVictim.hp <= 5000, '10,000 True Damage Nuke should devastate enemies in radius');
assert(!G.towers.includes(nukeTower), 'Overheated tower should be destroyed permanently');
assert(G.craters.length > 0, 'Meltdown should leave radioactive crater');
console.log('✔ Supercritical Core Meltdown, cooling intervention, and 10,000 True Damage Nuke verified');

console.log('\n--- 5. Testing Causal Paradox Co-Op (12s Rewind & Ghost Fleet) ---');
assert(nb.PARADOX_COOP_CONFIG, 'PARADOX_COOP_CONFIG must be defined');
assert(G.paradoxCoop, 'G.paradoxCoop must be initialized');

// Setup history snapshot
G.lives = 20;
const oldTower = { id: 501, x: 150, y: 150, type: 'gatling', tier: 1 };
G.towers = [oldTower];
const trackedEnemy = { id: 502, x: 100, y: 100, hp: 800, maxHp: 800, dead: false };
G.enemies = [trackedEnemy];

nb.recordParadoxCoopSnapshot();

// Advance state and deal damage to base
G.lives = 8;
trackedEnemy.x = 350;
trackedEnemy.y = 350;

// Trigger Paradox Co-Op Rewind
nb.triggerParadoxCoop();
assert.strictEqual(G.lives, 20, 'Paradox Co-Op should restore base lives to past snapshot');
assert.strictEqual(trackedEnemy.x, 100, 'Enemy position should be rewound to past snapshot coordinates');
assert.strictEqual(G.paradoxCoop.active, true, 'Ghost Fleet should now be active');
assert(G.paradoxCoop.ghostFleet.length > 0, 'Ghost Fleet should project holographic past towers');

// Test Causal Paradox Wraith immunity to regular towers
const wraith = { id: 503, x: 200, y: 200, hp: 600, maxHp: 600, dead: false, isWraith: true };
G.enemies = [wraith];
const towerDmg = nb.dealDamage(wraith, 150, 'energy', oldTower, {});
assert.strictEqual(towerDmg, 0, 'Causal Wraith should be completely immune to regular tower weapons');

// Titan Mech parry damage against wraith
const mechDmg = nb.dealDamage(wraith, 250, 'true', 'titan_mech', { isParry: true });
assert(mechDmg > 0, 'Causal Wraith should take damage from Titan Mech parry');
console.log('✔ Causal Paradox 12s timeline rewind, Ghost Fleet projection, and Wraith immunity verified');

console.log('\n--- 6. Testing Titan Mech Tri-Stance Overdrive ---');
assert(nb.TITAN_STANCE_CONFIG, 'TITAN_STANCE_CONFIG must be defined');
assert(G.mech, 'G.mech must be initialized');

// Stance 1: Siege Bastion
nb.setMechStance('siege_bastion');
assert.strictEqual(G.mech.stance, 'siege_bastion', 'Mech should be in siege_bastion stance');
assert.strictEqual(G.mech.speed, 0, 'Mech should be anchored with speed = 0 in Siege Bastion mode');

// Stance 2: Valkyrie Blade
nb.setMechStance('valkyrie_blade');
assert.strictEqual(G.mech.stance, 'valkyrie_blade', 'Mech should be in valkyrie_blade stance');
assert.strictEqual(G.mech.speed, 240, 'Mech speed should increase to 240 px/s in Valkyrie Blade mode');

// Stance 3: Matter Siphon
nb.setMechStance('matter_siphon');
assert.strictEqual(G.mech.stance, 'matter_siphon', 'Mech should be in matter_siphon stance');

// Matter Siphon cooling nearby tower
const hotTower = { id: 601, x: G.mech.x + 20, y: G.mech.y + 20, heat: 60 };
G.towers = [hotTower];
nb.updateTitanStanceSystems(1.0);
assert(hotTower.heat < 60, 'Matter Siphon stance should passively cool nearby overheating towers');
console.log('✔ Titan Mech Tri-Stance swapping (Siege, Valkyrie, Siphon) and passive cooling verified');

console.log('\n--- 7. Testing Visceral Kinetic Parrying & Titan Execution Finisher ---');
nb.setMechStance('valkyrie_blade');

// Kinetic Parry against hostile artillery projectile
G.hostileProjectiles = [
  { id: 701, x: G.mech.x + 20, y: G.mech.y + 20, damage: 150, deflected: false }
];
const parried = nb.mechParry();
assert.strictEqual(parried, true, 'Parry should succeed when hostile projectile is within range');
assert.strictEqual(G.hostileProjectiles[0].deflected, true, 'Hostile projectile should be marked deflected');

// Titan Execution Finisher against low-HP boss (<20% HP)
const lowHpBoss = { id: 702, x: 200, y: 200, hp: 150, maxHp: 1000, dead: false };
G.enemies = [lowHpBoss];
const initialGoldFinisher = G.gold;

const executed = nb.mechExecuteFinisher(lowHpBoss);
assert.strictEqual(executed, true, 'Finisher should succeed against boss with HP < 20%');
assert.strictEqual(lowHpBoss.dead, true, 'Target boss should be instantly slain');
assert.strictEqual(G.gold, initialGoldFinisher + 100, 'Finisher should award +100 bonus gold');
console.log('✔ Kinetic bullet-time parrying and Titan Execution Finisher verified');

console.log('\n============================================================');
console.log('ALL 5 APEX MECHANICS OF BASTION TD 20.0 VERIFIED SUCCESSFULLY!');
console.log('============================================================\n');
