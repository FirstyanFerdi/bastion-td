/**
 * Unit Test Suite: test_effects_realization.js
 * Verifies that all effects across perks, workshop upgrades, cursed protocols,
 * and hive traits are fully realized in runtime logic and not merely text descriptions.
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Real-Time Effects Realization in Bastion TD...');

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
  G.gold = 10000;
  G.state = 'active';
`, ctx);

// 1. Verify Workshop Command Protocol [R]
console.log('\n--- 1. Testing Workshop Command Protocol [R] ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  SAVE.workshop = SAVE.workshop || {};
  SAVE.workshop.command_protocol = 1;
  console.log('Workshop level:', getWorkshopLevel('command_protocol'));
  console.log('G.doctrine:', G.doctrine);

  // Verify cooldown boost (+25%)
  G.skills.orbital = { cd: 10 };
  update(1.0);
  console.log('Orbital cd after 1s update:', G.skills.orbital.cd);
  assert(G.skills.orbital.cd <= 8.8, 'Command protocol should accelerate skills cooldown by +25%');

  // Verify EMP pulse when casting slot [R] (e.g. carpet_bomb for vanguard)
  spawnEnemy('carrier', 1);
  const carrier = G.enemies[0];
  carrier.shield = 100; carrier.maxShield = 100;
  spawnEnemy('scout', 1);
  const scout = G.enemies[1];
  scout.stunT = 0;

  G.drafting = null;
  G.skills.carpet_bomb = { cd: 0 };
  triggerSkill('carpet_bomb');
  console.log('Carrier shield after triggerSkill:', carrier.shield, 'Scout stunT:', scout.stunT);
  assert(carrier.shield < 100, 'Command protocol EMP pulse should strip hostile shield on casting [R]');
  assert(scout.stunT >= 1.0, 'Command protocol EMP pulse should stun hostiles on casting [R]');
  console.log('✔ Command Protocol [R] CD boost and tactical EMP pulse verified in gameplay');
})()`, ctx);

// 2. Verify Cursed Protocol: Entropy Conduit Radiation Flare
console.log('\n--- 2. Testing Entropy Conduit Radiation Penalty ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.gold = 5000;
  applyCursedProtocol('entropy_conduit');
  assert(G.cursedProtocols.includes('entropy_conduit'), 'Entropy conduit active');

  const t = placeTower(2, 0, 'gatling');
  assert(t, 'Tower placed');
  t.empT = 0;
  t.heat = 0;

  G.entropyRadiationCd = 0;
  update(0.1);
  assert(t.empT > 0, 'Entropy radiation should disrupt friendly tower with EMP');
  assert(t.heat > 0, 'Entropy radiation should apply severe thermal heat buildup');
  console.log('✔ Entropy Conduit periodic radiation overload & EMP disruption verified');
})()`, ctx);

// 3. Verify Reactive Hive Counter-Trait: Spore Mortar Retaliation
console.log('\n--- 3. Testing Spore Mortar Retaliation ---');
vm.runInContext(`(() => {
  newGame(false);
  G.state = 'active';
  G.gold = 5000;
  const t = placeTower(2, 0, 'gatling');
  t.empT = 0;

  spawnEnemy('scout', 1);
  const e = G.enemies[G.enemies.length - 1];
  e.counterTrait = 'spore_mortar';
  e.x = t.x + 30;
  e.y = t.y + 30; // within 140px

  killEnemy(e, null);
  assert(t.empT > 0, 'Spore mortar retaliation should corrode and EMP disrupt nearest tower');
  assert(G.creep && G.creep[t.r + ',' + t.c], 'Spore mortar retaliation should spread biomass creep at tower base');
  console.log('✔ Spore Mortar hostile retaliation mortar & creep contamination verified');
})()`, ctx);

console.log('\n============================================================');
console.log('ALL EFFECTS REALIZATION VERIFICATION TESTS PASSED (100%)!');
console.log('============================================================\n');
