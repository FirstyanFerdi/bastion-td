// ============================================================
// Test Suite: Bastion TD 26.0 - The Topological Crucible & Living Matter Alchemy
// Tests:
// 1. Axiom 1: Geometric Crossfire Pinning (>=120 deg) & Grid High-Load Spillover Arcs
// 2. Axiom 2: Overkill Signal Relay (55% CD cut to 2 nearest neighboring towers)
// 3. Axiom 3: Corpse Matter Alchemy (Plasma Shrapnel Chain, Cryo Ice-Tomb, Tesla Bio-Voltaic)
// 4. Axiom 3b: Living Barricade Capacitors & 25.0 Kinetic Bowling Revenge Nova
// 5. Cross-Axiom Bridge: Ice-Tomb Optical Prism Refraction via Railgun & Masterwork Bounty
// 6. Symbiotic Predator Ecology (Corpse-Scavenger, Phase-Splitter, Martyr-Dampener, Scheduler)
// 7. End-to-End Update Loop, Wave Clear Decay & Zero UI Bloat Verification
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 26.0: The Topological Crucible & Living Matter Alchemy...\n');

const root = path.join(__dirname, '..');
const store = {};
const elements = {};
const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});

function makeEl(tag = 'div') {
  return {
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

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

const nb = window.__nb;
nb.begin();
const G = nb.G;
G.state = 'active';
G.gold = 2000;

console.log('--- 1. Testing Geometric Crossfire Pinning & Grid Spillover (Axiom 1) ---');
assert(nb.TOPOLOGICAL_ALCHEMY_CONFIG, 'TOPOLOGICAL_ALCHEMY_CONFIG must exist in data.js');
assert(G.topology, 'G.topology must initialize in newGame()');

const armoredFoe = { id: 1, type: 'brute', armor: 0.45, shred: 0, hp: 1000, maxHp: 1000, dead: false, x: 300, y: 300, r: 16 };
const tWest = { id: 101, type: 'gatling', x: 180, y: 300, tier: 1, cd: 0 };
const tEast = { id: 102, type: 'gatling', x: 420, y: 300, tier: 1, cd: 0 };
G.enemies = [armoredFoe];

nb.dealDamage(armoredFoe, 100, 'phys', tWest, { fromAngle: 0 });
G.time += 0.2;
const hpBeforePin = armoredFoe.hp;
nb.dealDamage(armoredFoe, 100, 'phys', tEast, { fromAngle: Math.PI });
assert(armoredFoe.shred >= 0.25, 'Opposing hits >=120 deg apart must shred target armor via Crossfire Pin');
assert(armoredFoe.slowT > 0, 'Crossfire Pin must apply pinning slow');
assert(armoredFoe.hp < hpBeforePin - 100 * 0.6, 'Crossfire Pin must amplify flanking damage');
assert(G.topology.crossfireCount >= 1, 'Crossfire Pin counter must increment');

// Grid Power High-Load Spillover Arcs (>=85% Load)
G.towers = [];
for (let k = 0; k < 10; k++) {
  G.towers.push({ id: 200 + k, type: 'rail', tier: 3, x: 300, y: 300, cd: 5, empT: 0 });
  const gp = getGridPowerStatus();
  if (gp.used / Math.max(1, gp.capacity) >= 0.85) break;
}
const spilloverTarget = { id: 2, type: 'scout', hp: 300, maxHp: 300, dead: false, x: 340, y: 300, r: 12 };
G.enemies = [spilloverTarget];
nb.updateTopologicalSystems(1.7);
assert(G.topology.spilloverCount >= 1, 'Grid >=85% load must trigger periodic Grid Spillover zaps');
assert(spilloverTarget.hp < 300, 'Grid Spillover arc must damage nearby enemy');
console.log('Crossfire Pinning and Grid Power Spillover verified cleanly.');

console.log('--- 2. Testing Overkill Signal Relay (Axiom 2) ---');
const killerTower = { id: 300, type: 'rail', x: 100, y: 200, tier: 2, cd: 2.0 };
const nearA = { id: 301, type: 'plasma', x: 260, y: 200, tier: 1, cd: 4.0 };
const nearB = { id: 302, type: 'tesla', x: 290, y: 200, tier: 1, cd: 4.0 };
const thirdInRange = { id: 303, type: 'gatling', x: 330, y: 200, tier: 1, cd: 4.0 };
const outOfRange = { id: 304, type: 'cryo', x: 600, y: 500, tier: 1, cd: 4.0 };
G.towers = [killerTower, nearA, nearB, thirdInRange, outOfRange];
const relayVictim = { id: 3, type: 'scout', hp: 40, maxHp: 100, dead: false, x: 250, y: 200, r: 12 };
G.enemies = [relayVictim];

nb.dealDamage(relayVictim, 160, 'phys', killerTower, { fromAngle: 0 });
assert.strictEqual(relayVictim.dead, true, 'Overkill strike must kill victim');
assert(Math.abs(nearA.cd - 1.8) < 0.01, `Nearest neighbor cooldown must be cut 55% (got ${nearA.cd})`);
assert(Math.abs(nearB.cd - 1.8) < 0.01, `Second neighbor cooldown must be cut 55% (got ${nearB.cd})`);
assert.strictEqual(thirdInRange.cd, 4.0, 'Overkill Relay must respect cap of max 2 nearest neighbors');
assert.strictEqual(outOfRange.cd, 4.0, 'Out-of-range tower must not receive relay');
assert(G.topology.relayCount >= 1, 'Relay counter must increment');
console.log('Overkill Signal Relay verified with neighbor cap and distance priority.');

console.log('--- 3. Testing Corpse Matter Alchemy (Axiom 3) ---');
// 3A: Plasma Corpse Shrapnel Chain
G.corpses = [
  { id: 401, type: 'brute', x: 300, y: 300, r: 14, maxHp: 400, hp: 400, life: 8, maxLife: 8, crushed: false },
  { id: 402, type: 'brute', x: 350, y: 300, r: 14, maxHp: 400, hp: 400, life: 8, maxLife: 8, crushed: false }
];
const shrapFoe = { id: 4, type: 'brute', hp: 800, maxHp: 800, dead: false, x: 325, y: 310, r: 14 };
G.enemies = [shrapFoe];
const explCount = nb.transmuteCorpseMatter(300, 300, 'plasma', 180, killerTower, ['plasma']);
assert(explCount >= 1 && G.corpses.length === 0, 'Plasma must detonate chained corpses');
assert(shrapFoe.hp < 800, 'Corpse Bone-Shrapnel chain must damage enemies nearby');

// 3B: Cryo Ice-Tomb & Hostile Roadblock Halting
const cLarge = { id: 403, type: 'brute', x: 400, y: 300, r: 16, maxHp: 500, hp: 500, life: 8, maxLife: 8, crushed: false };
const cSmall = { id: 404, type: 'swarmer', x: 420, y: 300, r: 9, maxHp: 80, hp: 80, life: 8, maxLife: 8, crushed: false };
G.corpses = [cLarge, cSmall];
nb.transmuteCorpseMatter(400, 300, 'cryo', 40, killerTower, ['cryo'], 132);
assert.strictEqual(cLarge.frozenTomb, true, 'Large corpse (r>=12) must freeze into an Ice-Tomb');
assert(!cSmall.frozenTomb, 'Small corpse (r<12) must not form Ice-Tomb roadblock');

const blockedMover = { id: 5, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 410, y: 300, r: 12, speed: 90, d: 100, seg: 0, off: 0, pathId: 0 };
G.enemies = [blockedMover];
const startD = blockedMover.d;
nb.updateEnemy(blockedMover, 0.25);
assert.strictEqual(blockedMover.d, startD, 'Ground hostile within 34px of Ice-Tomb must halt (sp = 0)');

// 3C: Tesla Bio-Voltaic Surge
G.barricades = [{ x: 200, y: 200, hp: 140, maxHp: 300, capCharge: 0 }];
const voltaicNeighbor = { id: 305, type: 'plasma', x: 230, y: 200, tier: 1, cd: 10.0 };
G.towers = [voltaicNeighbor];
G.mech = { x: 215, y: 200, battery: 50 };
G.corpses = [{ id: 405, type: 'brute', x: 205, y: 200, r: 14, maxHp: 400, life: 8, maxLife: 8, crushed: false }];
nb.transmuteCorpseMatter(205, 200, 'energy', 100, voltaicNeighbor, ['tesla']);
assert.strictEqual(G.barricades[0].hp, 180, 'Tesla corpse harvest must repair nearby barricade (+40 HP)');
assert(G.barricades[0].capCharge > 0, 'Voltaic surge must charge nearby Barricade Capacitor');
assert(Math.abs(voltaicNeighbor.cd - 7.0) < 0.01, 'Voltaic corpse surge must cut nearby tower cooldown by 30%');
assert.strictEqual(G.mech.battery, 62, 'Voltaic surge must recharge Titan Mech battery (+12)');
console.log('Corpse Matter Alchemy (Plasma, Cryo Ice-Tomb, Tesla Bio-Voltaic) verified.');

console.log('--- 4. Testing Living Barricade Capacitor & 25.0 Kinetic Bowling Nova (Axiom 3b) ---');
const capBar = { x: 300, y: 300, hp: 4, maxHp: 300, capCharge: 0 };
G.barricades = [capBar];
nb.chargeBarricadeCapacitor(capBar, 100, 'kinetic');
assert.strictEqual(capBar.capCharge, 100, 'Barricade Capacitor must accumulate absorbed energy');

const sieger = { id: 6, type: 'brute', hp: 800, maxHp: 800, dead: false, x: 305, y: 300, r: 16, speed: 60, d: 180, seg: 0, off: 0, pathId: 0 };
const trailer = { id: 7, type: 'scout', hp: 300, maxHp: 300, dead: false, x: 280, y: 300, r: 12, speed: 80, d: 160, seg: 0, off: 0, pathId: 0 };
G.enemies = [sieger, trailer];
G.corpses = [];
G.topology.crossAxiomCount = 0;
G.topology.discoveredMasterworks = {};

nb.updateEnemy(sieger, 0.2); // 45 * 0.2 = 9 dmg -> breaks 4 HP barricade!
assert.strictEqual(G.barricades.length, 0, 'Shattered barricade must be removed');
assert(G.topology.barricadeNovaCount >= 1, 'Breaking a charged barricade must unleash Revenge Kinetic Nova');
assert(sieger.hp < 800, 'Capacitor Nova must damage sieging enemy');
assert(sieger.d < 180 && trailer.hp < 300, 'Capacitor Nova must trigger 25.0 Kinetic Bowling collision against trailing enemies');
assert(G.topology.crossAxiomCount >= 1, 'Barricade Nova + Kinetic Bowling must register as a Cross-Axiom Masterwork');
console.log('Barricade Capacitor Nova + 25.0 Kinetic Bowling cross-bridge verified.');

console.log('--- 5. Testing End-to-End Railgun Ice-Tomb Prism Cross-Axiom Synergy ---');
const prismCorpse = { id: 499, type: 'brute', x: 300, y: 300, r: 16, frozenTomb: true, freezeT: 5.0, stunT: 5.0 };
G.corpses = [prismCorpse];
G.resonanceLines = [];
G.hazards = [];
G.soilTiles = {};
const frontDummy = { id: 8, type: 'scout', hp: 500, maxHp: 500, dead: false, x: 240, y: 300, r: 12, speed: 0 };
const sideTop = { id: 9, type: 'scout', hp: 500, maxHp: 500, dead: false, x: 300 + Math.cos(-0.42) * 85, y: 300 + Math.sin(-0.42) * 85, r: 12 };
const sideBot = { id: 10, type: 'scout', hp: 500, maxHp: 500, dead: false, x: 300 + Math.cos(0.42) * 85, y: 300 + Math.sin(0.42) * 85, r: 12 };
G.enemies = [frontDummy, sideTop, sideBot];
const railT = { id: 399, type: 'rail', x: 120, y: 300, tier: 1, branch: 'A', angle: 0, cd: 0, ammo: 10, maxAmmo: 10, heat: 0, flash: 0, recoil: 0, dmg: 0 };
G.towers = [railT];
G.gold = 1000;
const preMwGold = G.gold;
const preMwCount = G.topology.crossAxiomCount;

nb.updateTower(railT, 0.05);
assert(sideTop.hp < 500 && sideBot.hp < 500, 'Railgun beam passing through Ice-Tomb corpse must refract onto off-angle targets');
assert(G.topology.crossAxiomCount > preMwCount, 'Rail -> Ice-Tomb -> Cryo Refract must register new Cross-Axiom Masterwork');
assert(G.gold > preMwGold, 'New Cross-Axiom Masterwork must award bonus Gold');
console.log('End-to-End Railgun Ice-Tomb Prism Cross-Axiom Masterwork verified.');

console.log('--- 6. Testing Symbiotic Predator Ecology Units & Scheduler ---');
// 6A: Ecology Scheduler dormant on Wave 1, active on Wave 6 with dominant motifs
G.topology.motifFreq = { corpse: 4, crossfire: 3, overkill: 3 };
assert.deepStrictEqual(nb.analyzeSymbioticEcology(1), [], 'Ecology must stay dormant at Wave 1');
assert.strictEqual(nb.analyzeSymbioticEcology(6).length, 2, 'Wave 6 ecology cap should field 2 counter-predators');
const ecoQueue = nb.analyzeSymbioticEcology(8);
assert(ecoQueue.includes('corpse_scavenger') && ecoQueue.includes('phase_splitter') && ecoQueue.includes('martyr_dampener'),
  'Ecology scheduler at Wave 8+ must field counter-predators matching all 3 dominant 26.0 motifs');

// 6B: Phase-Splitter Mitosis under Crossfire
const splitter = { id: 11, type: 'phase_splitter', isSplitter: true, hasSplit: false, hp: 400, maxHp: 400, dead: false, x: 300, y: 300, r: 15, d: 120, seg: 0, off: 6, pathId: 0 };
G.enemies = [splitter];
G.wave = 5;
nb.dealDamage(splitter, 80, 'phys', tWest, { fromAngle: 0 });
G.time += 0.2;
nb.dealDamage(splitter, 80, 'phys', tEast, { fromAngle: Math.PI });
assert.strictEqual(G.enemies.length, 2, 'Phase-Splitter caught in Crossfire >=120 deg must split into 2 twins');
assert(splitter.hasSplit && G.enemies[1].hasSplit, 'Split twins must mark hasSplit=true to prevent infinite splitting');

// 6C: Martyr Overkill Buffer blocks Overkill Signal Relay
const rTowerA = { id: 410, type: 'plasma', x: 250, y: 200, cd: 4.0 };
const rTowerKill = { id: 411, type: 'rail', x: 100, y: 200, cd: 0 };
G.towers = [rTowerA, rTowerKill];
const martyrUnit = { id: 12, type: 'martyr_dampener', isMartyr: true, hp: 300, maxHp: 300, shield: 0, maxShield: 0, dead: false, x: 265, y: 200, r: 12 };
const sacrificeFoe = { id: 13, type: 'scout', hp: 30, maxHp: 100, dead: false, x: 240, y: 200, r: 12 };
G.enemies = [sacrificeFoe, martyrUnit];
nb.dealDamage(sacrificeFoe, 150, 'phys', rTowerKill, { fromAngle: 0 });
assert.strictEqual(rTowerA.cd, 4.0, 'Nearby Martyr Dampener must absorb Overkill Relay and block tower cooldown reset');
assert(martyrUnit.shield > 0, 'Martyr Dampener must convert absorbed overkill signal into shields');

// 6D: Corpse-Scavenger ignores Ice-Tomb and devours normal corpses
G.corpses = [
  { id: 500, type: 'brute', x: 400, y: 300, r: 16, frozenTomb: true, freezeT: 5.0 },
  { id: 501, type: 'scout', x: 312, y: 300, r: 12, maxHp: 200, life: 8, maxLife: 8, crushed: false }
];
const scav = { id: 14, type: 'corpse_scavenger', isScavenger: true, hp: 100, maxHp: 300, shield: 0, maxShield: 0, dead: false, x: 300, y: 300, r: 13, speed: 95, d: 100, seg: 0, off: 0, pathId: 0 };
G.enemies = [scav];
nb.updateEnemy(scav, 0.1);
assert.strictEqual(G.corpses.length, 1, 'Scavenger must devour normal corpse');
assert.strictEqual(G.corpses[0].frozenTomb, true, 'Scavenger must ignore Frozen Ice-Tomb corpse');
assert(scav.hp > 100 && scav.shield >= 50, 'Devouring corpse must heal and shield Scavenger');
console.log('Symbiotic Predator Ecology behaviors and scheduler verified cleanly.');

console.log('--- 7. Testing Update Loop Stability & Zero UI Bloat Check ---');
nb.updateTopologicalSystems(1.0);
assert(G.corpses[0].freezeT <= 4.0, 'updateTopologicalSystems must tick Ice-Tomb freeze duration');

const buttonCount = (html.match(/class="cbtn\s/g) || []).length;
assert.strictEqual(buttonCount, 23, `index.html topbar must retain exact 23 .cbtn buttons without bloat (got ${buttonCount})`);
console.log('Headless Update Loop & Zero UI Bloat verified cleanly.');

console.log('\nAll 7 Bastion TD 26.0 Topological Crucible test suites passed!\n');
