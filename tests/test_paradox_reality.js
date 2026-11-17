/**
 * Unit Test Suite: test_paradox_reality.js
 * Validates Bastion TD 6.0: The Living Paradox & Reality Manipulation
 * 1. Chrono-Echo Splicer & 4D Quantum Time Rewind (Ghost Echoes, dual-timeline fire)
 * 2. Paradox Entropy & Reality Fracture (Chrono-Horror physical damage immunity)
 * 3. Reclaimed Nanite Necromancy (Alien corpses, Colossus Bastion physical path blocking)
 * 4. Neural-Link Synapse Network (Cross-Breeding Gatling+Railgun piercing & speed)
 * 5. The Infiltrator Syndicate (Bribing allied drone strikes, Raiding gunship & Singularity chip)
 * 6. Tectonic Mag-Lev Shifter (Centrifuge loop knockback & Void chasm drops)
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 6.0: The Living Paradox & Reality Manipulation...');

const makeElement = () => ({
  width: 960, height: 600, style: { setProperty(){} }, innerHTML: '', textContent: '',
  classList: { add(){}, remove(){}, toggle(){} },
  dataset: {},
  appendChild(){}, addEventListener(){}, removeEventListener(){},
  querySelector: () => makeElement(),
  querySelectorAll: () => [],
  getContext: () => ({
    scale(){}, translate(){}, rotate(){}, beginPath(){}, closePath(){},
    moveTo(){}, lineTo(){}, arc(){}, arcTo(){}, fill(){}, stroke(){}, ellipse(){},
    save(){}, restore(){}, rect(){}, fillRect(){}, strokeRect(){}, clearRect(){},
    setLineDash(){}, createRadialGradient:()=>({addColorStop(){}}),
    createLinearGradient:()=>({addColorStop(){}})
  }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
  toDataURL: () => 'data:image/png;base64,mock'
});

const elements = {};
const ctx = {
  window: { devicePixelRatio: 1, addEventListener(){}, removeEventListener(){} },
  document: {
    addEventListener(){}, removeEventListener(){},
    createElement: () => makeElement(),
    getElementById: (id) => elements[id] || (elements[id] = makeElement()),
    querySelectorAll: () => []
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => {},
  Math, Date, console, assert,
  enemyIcons: {}
};

vm.createContext(ctx);

const files = [
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
  'js/input.js'
];

for (const f of files) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
}

// Global initialization
vm.runInContext(`
  canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: W, height: H }) };
  buildMap();
  newGame(false);
  G.gold = 5000;
  G.state = 'active';
  G.drafting = null;
`, ctx);

// ============================================================
// 1. Chrono-Echo Splicer & 4D Quantum Time Rewind
// ============================================================
console.log('\n--- 1. Testing Chrono-Echo Splicer & 4D Quantum Rewind ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;
  G.lives = 25;
  G.gold = 1000;
  G.timeHistory = [];

  // Place a tower and record history
  const t = placeTower(4, 2, 'gatling');
  assert(t, 'Tower placed successfully');
  G.gold = 1000;

  // Record initial snapshot
  recordTimeSnapshot();
  const initSnapshotLen = G.timeHistory.length;
  assert(initSnapshotLen > 0, 'Snapshot recorded in timeHistory');

  // Spawn an enemy and advance
  spawnEnemy('scout', 1);
  const enemy = G.enemies[0];
  enemy.d = 120;
  enemy.x = 200; enemy.y = 200;

  // Let 1.0 second elapse with periodic recording
  for (let step = 0; step < 10; step++) {
    update(0.1);
    recordTimeSnapshot();
  }

  // Simulate damage and gold loss
  G.lives = 18;
  G.gold = 600;
  enemy.hp = 10;
  enemy.d = 280;

  // Trigger Chrono-Rewind
  const success = triggerChronoRewind();
  assert(success, 'Chrono Rewind should trigger successfully');
  assert.strictEqual(G.lives, 25, 'Lives should be restored from past snapshot');
  assert.strictEqual(G.gold, 1000, 'Gold should be restored from past snapshot');
  assert(G.timeRippleT > 0, 'Reality ripple distortion active');

  // Verify Ghost Echo creation
  assert(G.ghostEchoes && G.ghostEchoes.length > 0, 'Ghost Echoes should spawn from past timeline towers');
  const echo = G.ghostEchoes[0];
  assert.strictEqual(echo.type, 'gatling', 'Ghost echo matches past tower type');
  assert(echo.life > 0, 'Ghost echo has active lifetime');

  // Tick update to verify Ghost Echo fires and deals damage
  spawnEnemy('scout', 1);
  const target = G.enemies[0];
  // Position ghost echo right next to path entrance so target at d=0 is in range
  echo.x = target.x; echo.y = target.y;
  const initialHp = target.hp;
  echo.fireCd = 0;
  update(0.1);
  assert(target.hp < initialHp, 'Ghost Echo laser should damage hostile in dual-timeline');
  console.log('✓ 4D Time Rewind restored lives/gold/hostiles & Ghost Echo fired successfully');
})()`, ctx);

// ============================================================
// 2. Paradox Entropy & Reality Fracture (Chrono-Horror)
// ============================================================
console.log('\n--- 2. Testing Paradox Entropy & Chrono-Horror Immunity ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;
  G.timeHistory = [];
  for (let i = 0; i < 10; i++) recordTimeSnapshot();

  // Entropy starts at 0
  assert.strictEqual(G.paradoxEntropy, 0, 'Initial Paradox Entropy is 0%');

  // Trigger rewind to accumulate entropy
  G.chronoCd = 0;
  triggerChronoRewind();
  assert(G.paradoxEntropy >= 30, 'Chrono Rewind should increase Paradox Entropy');

  // Force entropy to 100% and trigger rewind to cause Reality Fracture
  G.paradoxEntropy = 100;
  G.chronoCd = 0;
  for (let i = 0; i < 10; i++) recordTimeSnapshot();
  triggerChronoRewind();

  // Reality fracture spawns Chrono-Horror
  const horror = G.enemies.find(e => e.isParadoxHorror);
  assert(horror, 'Reality Fracture must spawn Chrono-Horror');
  assert(horror.isParadoxHorror, 'Chrono-Horror is an active anomaly entity');

  // Test Physical Damage Void Immunity
  const hpBefore = horror.hp;
  dealDamage(horror, 50, 'phys', null);
  assert.strictEqual(horror.hp, hpBefore, 'Chrono-Horror must be VOID IMMUNE to physical projectiles');

  // Test Energy / Laser Damage vulnerability
  dealDamage(horror, 40, 'energy', null);
  assert(horror.hp < hpBefore, 'Chrono-Horror can be damaged by energy / resonance lasers');
  console.log('✓ Paradox Entropy triggered Reality Fracture and Chrono-Horror void immunity verified');
})()`, ctx);

// ============================================================
// 3. Reclaimed Nanite Necromancy (Corpses & Colossus Bastion)
// ============================================================
console.log('\n--- 3. Testing Nanite Necromancy & Colossus Path Blocking ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;
  G.corpses = [];
  G.reclaimedMinions = [];

  // Spawn and kill an enemy
  spawnEnemy('brute', 1);
  const brute = G.enemies[0];
  brute.x = 240; brute.y = 180;
  killEnemy(brute);

  // Corpse persistence
  assert(G.corpses.length > 0, 'Alien death should leave persistent corpse on grid');
  const corpse = G.corpses[0];
  assert.strictEqual(corpse.type, 'brute', 'Corpse remembers origin enemy type');

  // Reclaim corpse into Colossus Bastion
  const reclaimed = reclaimCorpse(0);
  assert(reclaimed, 'Corpse successfully reclaimed into bio-defense');
  assert(G.reclaimedMinions.length > 0, 'Reclaimed minion added to active minions');
  const colossus = G.reclaimedMinions[0];
  assert.strictEqual(colossus.type, 'colossus', 'Brute corpse reclaims into Colossus Bastion barrier');
  assert(colossus.hp > 0, 'Colossus has barrier HP');

  // Test physical path blocking of enemies
  spawnEnemy('scout', 1);
  const hostile = G.enemies[0];
  hostile.x = colossus.x - 10;
  hostile.y = colossus.y;
  hostile.d = 100;
  const initialDist = hostile.d;
  const initialColossusHp = colossus.hp;

  // Tick updateEnemy: scout should be blocked by Colossus and attack it
  updateEnemy(hostile, 0.5);
  assert.strictEqual(hostile.d, initialDist, 'Enemy must be physically blocked from advancing past Colossus');
  assert(colossus.hp < initialColossusHp, 'Enemy blocked by Colossus must damage Colossus barrier');
  console.log('✓ Alien corpses persisted, reclaimed Colossus Bastion physically blocked path');
})()`, ctx);

// ============================================================
// 4. Neural-Link Synapse Network (Cross-Breeding)
// ============================================================
console.log('\n--- 4. Testing Neural Synapse Cross-Breeding (Gatling + Railgun) ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;

  // Place adjacent Gatling and Rail
  const t1 = placeTower(2, 2, 'gatling');
  const t2 = placeTower(3, 2, 'rail');
  assert(t1 && t2, 'Towers placed');

  // Create Neural Synapse
  const created = createNeuralSynapse(t1, t2);
  assert(created, 'Neural Synapse established between Gatling and Rail');
  const syn = G.synapses[0];
  assert.strictEqual(syn.pairKey, 'gatling+rail', 'Pair key normalized to gatling+rail');

  // Check lookup helper
  const synList = getTowerSynapses(t1);
  assert.strictEqual(synList.length, 1, 'getTowerSynapses returns active synapse');

  // Verify Railgun kinetic acceleration (+45% spinup / rate)
  const baseRate = getTierData(t2).rate;
  updateTower(t2, 0.1);
  assert(t2.synapseRateMult >= 1.4, 'Railgun linked to Gatling receives kinetic acceleration bonus');

  // Verify Gatling Kinetic Piercing
  spawnEnemy('scout', 1);
  spawnEnemy('scout', 1);
  const e1 = G.enemies[0];
  const e2 = G.enemies[1];
  e1.x = t1.x + 30; e1.y = t1.y;
  e2.x = t1.x + 60; e2.y = t1.y;
  const e2InitHp = e2.hp;

  // Fire Gatling at e1: pierced bullet behind should hit e2
  t1.target = e1;
  fireGatling(t1, getTierData(t1), e1);
  assert(e2.hp < e2InitHp, 'Gatling linked to Railgun must pierce through primary target to hit rear target');

  // Test severing synapse
  removeNeuralSynapse(syn.id);
  assert.strictEqual(G.synapses.length, 0, 'Synapse removed cleanly');
  console.log('✓ Neural Synapse successfully cross-bred Gatling (pierce) and Railgun (acceleration)');
})()`, ctx);

// ============================================================
// 5. The Infiltrator Syndicate (Bribing & Raiding)
// ============================================================
console.log('\n--- 5. Testing The Infiltrator Syndicate Dropship ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;
  G.gold = 500;
  SAVE.cores = 10;
  SAVE.chipsInventory = SAVE.chipsInventory || {};

  // Trigger Wave 6 to spawn Syndicate Gunship
  G.wave = 5;
  startWave();
  assert(G.syndicateGunship && G.syndicateGunship.active, 'Wave 6 must spawn Syndicate Gunship');
  assert.strictEqual(G.syndicateGunship.state, 'neutral', 'Initial gunship state is neutral');

  // Test Bribe Gunship
  const bribeSuccess = bribeSyndicate();
  assert(bribeSuccess, 'Bribe should succeed with sufficient gold');
  assert.strictEqual(G.syndicateGunship.state, 'bribed', 'Gunship state changes to bribed');
  assert.strictEqual(G.gold, 500 - 120, '120G deducted for bribe');

  // Verify allied fire from bribed gunship
  G.enemies = [];
  spawnEnemy('brute', 1);
  const brute = G.enemies[0];
  const hpBefore = brute.hp;
  G.syndicateGunship.droneCd = 0;
  update(0.1);
  assert(brute.hp < hpBefore, 'Bribed Syndicate Gunship fires allied missile strikes at hostiles');

  // Test Raid Gunship & Loot Payout
  G.syndicateGunship.state = 'neutral';
  raidSyndicate();
  assert.strictEqual(G.syndicateGunship.state, 'hostile', 'Gunship marked as hostile for raid');

  // Destroy gunship
  G.syndicateGunship.hp = 0;
  const goldBefore = G.gold;
  const coresBefore = SAVE.cores;
  update(0.1);

  assert(!G.syndicateGunship || !G.syndicateGunship.active, 'Destroyed gunship is deactivated');
  assert(G.gold >= goldBefore + 220, 'Raid destruction awards +220G');
  assert(SAVE.cores >= coresBefore + 30, 'Raid destruction awards +30 Nanite Cores');
  assert(SAVE.chipsInventory['quantum_singularity_chip'] > 0, 'Raid awards forbidden Quantum Singularity Chip');
  console.log('✓ Syndicate Gunship bribe allied fire & raid destruction rewards verified');
})()`, ctx);

// ============================================================
// 6. Tectonic Mag-Lev Shifter
// ============================================================
console.log('\n--- 6. Testing Tectonic Mag-Lev Shifter ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.drafting = null;

  // Spawn hostile in center
  spawnEnemy('scout', 1);
  const scout = G.enemies[0];
  scout.d = 200;
  scout.hp = 100;
  const cx = 5 * TILE + TILE / 2;
  const cy = 4 * TILE + TILE / 2;
  scout.x = cx; scout.y = cy;

  // Trigger Tectonic Shift
  triggerTectonicShift(5, 4);
  assert(scout.d < 200, 'Tectonic Mag-Lev shift must knock back enemy along path (Centrifuge loop)');

  // Test Void Chasm drop on low-HP hostile
  spawnEnemy('scout', 1);
  const lowHpScout = G.enemies[1];
  lowHpScout.x = cx; lowHpScout.y = cy;
  lowHpScout.hp = 10; lowHpScout.maxHp = 100;
  triggerTectonicShift(5, 4);
  assert(lowHpScout.dead, 'Low-HP hostile must fall into Kinetic Chasm void drop');
  console.log('✓ Tectonic Mag-Lev Centrifuge knockback and Void Chasm drop verified');
})()`, ctx);

console.log('\n============================================================');
console.log('ALL BASTION TD 6.0 THE LIVING PARADOX TESTS PASSED (100%)');
console.log('============================================================');
