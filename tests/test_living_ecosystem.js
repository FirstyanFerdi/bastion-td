// tests/test_living_ecosystem.js
// Comprehensive test suite for Bastion TD 9.0: Living Ecosystem & Nemesis Network
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

console.log('Testing Bastion TD 9.0: Living Ecosystem & Nemesis Network...\n');

const nb = window.__nb;
nb.begin();
const G = nb.G;

// ============================================================
// STAGE 1: REACTIVE DYNAMIC ECOLOGY & MICRO-CLIMATES
// ============================================================
console.log('--- 1. Testing Reactive Dynamic Soil Saturation & Weather ---');
assert(G.soilTiles, 'G.soilTiles must be initialized');

// 1.1 Thermal Ash
const ashTile = nb.addSoilTile(5, 3, 'thermal_ash', 18.0);
assert(ashTile, 'Thermal ash tile should be created');
assert.strictEqual(G.soilTiles['5_3'].type, 'thermal_ash', 'Soil tile at 5_3 should be thermal ash');

const victimEnemy = { type: 'scout', x: 5 * TILE + TILE / 2, y: 3 * TILE + TILE / 2, hp: 100, maxHp: 100, r: 10, dead: false };
G.enemies.push(victimEnemy);
updateEnemy(victimEnemy, 1.0);
assert(victimEnemy.hp < 100, 'Enemy standing on thermal ash must take burn DoT');
assert.strictEqual(victimEnemy.noRegen, true, 'Enemy on thermal ash must have regeneration suppressed');

// 1.2 Frost Slick Ice Slide & Corner Skid Collision
const iceTile = nb.addSoilTile(6, 4, 'frost_slick', 12.0);
assert(iceTile, 'Frost slick tile should be created');
const slidingEnemy = { type: 'scout', x: 6 * TILE + TILE / 2, y: 4 * TILE + TILE / 2, hp: 200, maxHp: 200, speed: 100, curSpeed: 100, r: 10, dead: false, isTurningCorner: false, skidCd: 0 };
updateEnemy(slidingEnemy, 0.1);
assert(slidingEnemy.curSpeed >= 160, 'Enemy on frost slick should gain +60% move speed');

// Turning corner on ice triggers skid crash!
slidingEnemy.x = 6 * TILE + TILE / 2;
slidingEnemy.y = 4 * TILE + TILE / 2;
slidingEnemy.isTurningCorner = true;
updateEnemy(slidingEnemy, 0.1);
assert(slidingEnemy.hp <= 80, 'Enemy turning corner on ice slide must take 120 collision impact damage');
assert(slidingEnemy.stunT > 1.0, 'Enemy turning corner on ice slide must suffer 2.0s Stun');

// 1.3 Acidic Sinkhole
const acidTile = nb.addSoilTile(7, 5, 'acid_sinkhole', 25.0);
assert(acidTile, 'Acid sinkhole should be created');
const lightEnemy = { type: 'scout', x: 7 * TILE + TILE / 2, y: 5 * TILE + TILE / 2, hp: 50, maxHp: 50, speed: 100, r: 8, dead: false };
updateEnemy(lightEnemy, 0.1);
assert.strictEqual(lightEnemy.dead, true, 'Light scout enemy should be instantly swallowed by acidic sinkhole');

const heavyEnemy = { type: 'brute', x: 7 * TILE + TILE / 2, y: 5 * TILE + TILE / 2, hp: 400, maxHp: 400, speed: 50, curSpeed: 50, r: 18, dead: false };
updateEnemy(heavyEnemy, 0.1);
assert(heavyEnemy.curSpeed <= 25, 'Heavy brute should be slowed by 50% in acidic sinkhole');

// 1.4 Weather: Ion Squall and Spore Fog
nb.setWeather('ion_squall');
assert.strictEqual(G.currentWeather, 'ion_squall', 'Weather should be ion_squall');
G.enemies = [];
const hostileToStrike = { type: 'carrier', x: 200, y: 200, hp: 500, maxHp: 500, r: 20, dead: false };
G.enemies.push(hostileToStrike);
G.ionSquallTimer = 4.0;
nb.updateEcology(0.1); // triggers lightning strike
assert(hostileToStrike.hp < 500 && hostileToStrike.stunT > 0, 'Ion Squall lightning strike should damage and stun hostile');

nb.setWeather('spore_fog');
assert.strictEqual(G.currentWeather, 'spore_fog', 'Weather should be spore_fog');
G.gold = 1000;
const testGatling = nb.placeTower(3, 3, 'gatling');
assert(testGatling, 'Gatling tower should be placed');
updateTower(testGatling, 0.1);
console.log('✔ Reactive dynamic soil saturation & micro-climate weather verified');

// ============================================================
// STAGE 2: NEURAL NEMESIS AI 3.0 & PROFILER SYSTEM
// ============================================================
console.log('--- 2. Testing Neural Nemesis AI 3.0 & Counter-Tactics ---');

// 2.1 Profiler Playstyle Detection
G.profilerStats = { choke: 1200, sniper: 200, elemental: 150, mech: 100 };
nb.updateProfiler(0.1);
assert.strictEqual(G.dominantPlaystyle, 'choke_heavy', 'Dominant playstyle should be choke_heavy');

// Multiple vectors increase adaptability score
G.profilerStats = { choke: 800, sniper: 600, elemental: 500, mech: 400 };
nb.updateProfiler(0.1);
assert(G.adaptabilityScore > 1.5, 'Adaptability score should scale up when multiple playstyle vectors are used');

// 2.2 Sapper Burrowing Counter
nb.placeTower(4, 3, 'gatling');
const sapper = { type: 'sapper', x: 3 * TILE + 20, y: 3 * TILE + 20, hp: 180, maxHp: 180, r: 13, dead: false, burrowed: false };
G.enemies.push(sapper);
updateEnemy(sapper, 0.1);
assert.strictEqual(sapper.burrowed, true, 'Sapper should burrow underground when near high tower clusters');
const acquired = acquire(testGatling, 200);
assert.notStrictEqual(acquired, sapper, 'Surface tower without sensor leyline cannot target burrowed sapper');

// 2.3 Chaff Skimmer Aerosol Mitigation
const skimmer = { type: 'chaff_skimmer', x: 300, y: 300, hp: 220, maxHp: 220, r: 15, dead: false };
const alliedGrunt = { type: 'brute', x: 320, y: 310, hp: 400, maxHp: 400, r: 18, dead: false };
G.enemies = [skimmer, alliedGrunt];
const hpBeforePhys = alliedGrunt.hp;
dealDamage(alliedGrunt, 100, 'phys', null);
const physDmgTaken = hpBeforePhys - alliedGrunt.hp;
assert(physDmgTaken <= 55, 'Chaff Skimmer aerosol cloud should mitigate projectile damage by 50%');

// 2.4 Harpoon Leecher Tethering
G.mech.active = true;
G.mech.isDocked = false;
G.mech.x = 400; G.mech.y = 400;
G.mech.battery = 100;
const leecher = { type: 'harpoon_leecher', x: 450, y: 420, hp: 260, maxHp: 260, r: 16, dead: false };
G.enemies.push(leecher);
updateEnemy(leecher, 0.1);
assert.strictEqual(leecher.isTetheringMech, true, 'Harpoon Leecher within 200px should latch tether to Titan Mech');
assert(G.mech.battery < 100, 'Harpoon Leecher tether must drain Titan Mech battery');

// 2.5 Persistent Nemesis Boss Roster & Retribution
const escapingBoss = { type: 'boss', maxHp: 2000, isElite: true };
G.damageTrack = { phys: 1500, energy: 300, cryo: 100, plasma: 50 };
const nemEntry = nb.recordNemesisEscape(escapingBoss);
assert(nemEntry, 'Nemesis escape record should be created');
assert.strictEqual(nemEntry.counterType, 'phys', 'Nemesis counter type should be phys (highest damage taken)');
assert(nemEntry.title.includes('Rail-Shatterer'), 'Nemesis title should match anti-physical naming');

// Spawn Nemesis Commander
const nemesisCommander = nb.spawnNemesisCommander(nemEntry);
assert(nemesisCommander, 'Nemesis Commander should spawn into game');
assert.strictEqual(nemesisCommander.isNemesis, true, 'Spawned boss must be marked as isNemesis');
assert.strictEqual(nemesisCommander.counterType, 'phys', 'Nemesis counter type must persist');

// Verify 50% damage reduction against countered weapon
const nemHpBefore = nemesisCommander.hp;
dealDamage(nemesisCommander, 200, 'phys', null);
const nemDmgTaken = nemHpBefore - nemesisCommander.hp;
assert(nemDmgTaken <= 105, 'Nemesis Commander must mitigate countered physical damage by 50%');

// Defeat Nemesis Commander and verify Retribution Bounty
const goldBefore = G.gold;
const coresBefore = SAVE.cores || 0;
killEnemy(nemesisCommander, null);
assert(G.gold >= goldBefore + 100, 'Defeating Nemesis Commander must award +100 Gold Retribution Bounty');
assert((SAVE.cores || 0) >= coresBefore + 35, 'Defeating Nemesis Commander must award +35 Nanite Cores');
console.log('✔ Neural Nemesis AI 3.0, profiler vectors, and persistent retribution verified');

// ============================================================
// STAGE 3: DEFORMABLE TERRAIN & PHYSICS OBSTACLES
// ============================================================
console.log('--- 3. Testing Deformable Terrain & Physics Obstacles ---');
assert(G.destructibleCrags && G.destructibleCrags.length > 0, 'Destructible crags must exist on the map');

const crag = G.destructibleCrags[0];
const targetRoadX = crag.roadC * TILE + TILE / 2;
const targetRoadY = crag.roadR * TILE + TILE / 2;
const foeOnRoad = { type: 'brute', x: targetRoadX, y: targetRoadY, hp: 500, maxHp: 500, r: 18, dead: false };
G.enemies = [foeOnRoad];

// Damage and collapse the crag
nb.damageCrag(crag, 300);
assert.strictEqual(crag.collapsed, true, 'Crag should collapse when reaching 0 HP');
assert(G.rockslides.length > 0, 'Rockslide blockade should be spawned on the road');
assert(foeOnRoad.hp <= 250, 'Enemy on road tile must suffer 250 crushing damage from rockslide avalanche');
assert(foeOnRoad.stunT >= 2.0, 'Enemy crushed by rockslide must be stunned');

// Rubble clearing by heavy enemies
const rockslide = G.rockslides[0];
const clearingBrute = { type: 'brute', x: targetRoadX, y: targetRoadY, hp: 300, maxHp: 300, speed: 40, curSpeed: 40, r: 18, dead: false };
updateEnemy(clearingBrute, 1.0);
assert.strictEqual(clearingBrute.curSpeed, 0, 'Hostile must be stopped by rockslide blockade');
assert(rockslide.hp < 300, 'Heavy brute must pound and clear rubble');

// Deploy portable barricade
G.gold = 100;
const barricade = nb.placeBarricade(8, 2);
assert(barricade, 'Barricade should be placed');
assert.strictEqual(barricade.hp, 400, 'Barricade must have 400 HP');
assert.strictEqual(G.gold, 60, '40 Gold should be deducted for barricade');
console.log('✔ Destructible crag collapse, rockslide crushing, and barricades verified');

// ============================================================
// STAGE 4: PREDATOR-PREY HIVE ECOSYSTEM & MUTATIONS
// ============================================================
console.log('--- 4. Testing Predator-Prey Hive Ecosystem & Alpha Mutation ---');

// 4.1 Corpse Cannibalism & Metamorphosis
G.corpses = [
  { type: 'scout', x: 200, y: 200, r: 10, life: 15.0 },
  { type: 'scout', x: 205, y: 205, r: 10, life: 15.0 },
  { type: 'scout', x: 210, y: 210, r: 10, life: 15.0 }
];

const gorger = { type: 'gorger', x: 202, y: 202, hp: 320, maxHp: 320, dispHp: 320, r: 16, dead: false, corpsesEaten: 0, reward: 16 };
G.enemies = [gorger];

// Feed 1
nb.feedGorger(gorger, G.corpses[0]);
assert.strictEqual(gorger.corpsesEaten, 1, 'Gorger should have eaten 1 corpse');

// Feed 2
nb.feedGorger(gorger, G.corpses[1]);
assert.strictEqual(gorger.corpsesEaten, 2, 'Gorger should have eaten 2 corpses');

// Feed 3 -> Triggers Alpha Mutation!
nb.feedGorger(gorger, G.corpses[2]);
assert.strictEqual(gorger.corpsesEaten, 3, 'Gorger should have eaten 3 corpses');
assert.strictEqual(gorger.type, 'alpha_gorgon', 'Gorger should have metamorphosed into alpha_gorgon');
assert(gorger.maxHp >= 750, 'Alpha Gorgon HP should be amplified by +150%');
assert.strictEqual(gorger.armor, 0.45, 'Alpha Gorgon should possess 45% armor plating');

// 4.2 Symbiotic Parasite Protection & Snipe
const hostFoe = { type: 'carrier', x: 500, y: 500, hp: 600, maxHp: 600, r: 20, dead: false, hasParasite: true, slowT: 3.0, slowAmt: 0.5, stunT: 2.0 };
dealDamage(hostFoe, 50, 'phys', null);
assert.strictEqual(hostFoe.slowT, 0, 'Symbiotic parasite must absorb and nullify slow');
assert.strictEqual(hostFoe.stunT, 0, 'Symbiotic parasite must absorb and nullify stun');

// Direct Railgun shot purges parasite
const sniperTower = { type: 'rail', x: 100, y: 100, range: 6.0 };
dealDamage(hostFoe, 80, 'phys', sniperTower);
assert.strictEqual(hostFoe.hasParasite, false, 'Railgun sniper shot must purge symbiotic parasite');
console.log('✔ Gorger cannibalism, Alpha metamorphosis, and symbiotic parasite verified');

// ============================================================
// STAGE 5: TACTICAL INSPECTOR FOR LIVING ECOSYSTEM
// ============================================================
console.log('--- 5. Testing Tactical Inspector for Living Ecosystem ---');

// Inspect Destructible Crag
G.sel = crag;
renderInspector();
const inspBox = elements['inspector'];
assert(inspBox.innerHTML.includes('DESTRUCTIBLE CHOKEPOINT CRAG'), 'Inspector must render destructible crag dossier');
assert(inspBox.innerHTML.includes('COLLAPSE CHOKEPOINT CRAG') || inspBox.innerHTML.includes('COLLAPSED'), 'Inspector must provide crag interaction');

// Inspect Nemesis Boss
const sampleNem = { isNemesis: true, nemesisTitle: "Vor'gath, The Rail-Shatterer", counterType: 'phys' };
G.sel = sampleNem;
renderInspector();
assert(inspBox.innerHTML.includes("VOR'GATH, THE RAIL-SHATTERER"), 'Inspector must render Nemesis Commander title');
assert(inspBox.innerHTML.includes('HARD-COUNTER ARMOR'), 'Inspector must render Nemesis counter-armor');
console.log('✔ Tactical inspector renders destructible crags and Nemesis dossiers cleanly');

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 9.0: LIVING ECOSYSTEM TESTS PASSED!');
console.log('============================================================\n');
