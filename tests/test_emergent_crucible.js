// ============================================================
// Test Suite: Bastion TD 25.0 - The Unified Emergent Crucible
// Tests:
// 1. In-Flight Medium Coupling (Cryo-Plasma, Conduit Ionize, Gravity Slingshot)
// 2. Frozen Crystal Refraction (Frozen targets acting as beam prisms)
// 3. Natural Surface Circuitry (Contiguous wet/icy/acid floor conductivity)
// 4. Thermobaric Piston, Kinetic Bowling & Radiant Tower Exhaust
// 5. Mirror Architect Physics Hijack (Galvanic Siphon, Mirror-Husk, Anchor-Behemoth)
// 6. Emergent Novelty Discovery, Anti-Stagnation Decay & Recursion Guard
// 7. End-to-End Update Loop (Mortar Slingshot Deflection) & Zero UI Bloat Check
// ============================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('Testing Bastion TD 25.0: The Unified Emergent Crucible...\n');

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

console.log('--- 1. Testing In-Flight Medium Coupling (Axiom 1) ---');
assert(nb.EMERGENT_CRUCIBLE_CONFIG, 'EMERGENT_CRUCIBLE_CONFIG must exist in data.js');
assert(G.emergent, 'G.emergent must initialize in newGame()');

// 1A: Conduit Ionization (Ray crossing Relay Resonance Line)
G.resonanceLines = [{ x1: 200, y1: 100, x2: 200, y2: 300 }];
const railActor = nb.applyMediumCoupling({ dmg: 100, chain: ['rail'] }, 100, 200, 350, 200, 'rail');
assert.strictEqual(railActor.ionized, true, 'Beam crossing resonance line should ionize');
assert.strictEqual(railActor.dmg, 125, 'Ionized beam should gain +25% damage');
assert(railActor.chain.includes('conduit_ionize'), 'Chain trace should append conduit_ionize');

// 1B: Cryo-Plasma Infusion + Gravitational Slingshot
G.soilTiles['5_3'] = { type: 'frost_slick', c: 5, r: 3, life: 10 };
G.hazards = [{ type: 'singularity', x: 380, y: 210, r: 60, life: 5 }];
const plasmaActor = nb.applyMediumCoupling(
  { dmg: 100, splash: 60, speedMult: 1.0, chain: ['plasma'] },
  250, 210, 420, 210, 'plasma'
);
assert.strictEqual(plasmaActor.cryoInfused, true, 'Plasma crossing frost slick should infuse Cryo');
assert.strictEqual(plasmaActor.slingshot, true, 'Plasma crossing singularity should gain Gravity Slingshot');
assert(plasmaActor.speedMult > 1.5, 'Slingshot should accelerate projectile speed');
assert(plasmaActor.splash > 75, 'Slingshot should enlarge blast radius');
console.log('In-Flight Medium Coupling verified (Conduit + Cryo-Plasma + Gravity Slingshot).');

console.log('--- 2. Testing Frozen Crystal Refraction (Axiom 1b) ---');
const frozenBoss = { id: 10, type: 'brute', hp: 1000, maxHp: 1000, dead: false, x: 300, y: 300, r: 18, stunT: 3.0 };
// Spread angle 0.42 rad from (300, 300) at dist 90 -> approx (382, 263) and (382, 337)
const backTop = { id: 11, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 300 + Math.cos(-0.42) * 90, y: 300 + Math.sin(-0.42) * 90, r: 12 };
const backBot = { id: 12, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 300 + Math.cos(0.42) * 90, y: 300 + Math.sin(0.42) * 90, r: 12 };
G.enemies = [frozenBoss, backTop, backBot];

const refractHits = nb.triggerFrozenCrystalRefraction(frozenBoss, 200, 0, null, ['rail']);
assert.strictEqual(refractHits, 2, 'Frozen target should refract laser into 2 trailing targets');
assert(backTop.hp < 200 && backBot.hp < 200, 'Both refracted beams must damage enemies behind the frozen target');
console.log('Frozen Crystal Refraction verified cleanly.');

console.log('--- 3. Testing Natural Surface Circuitry (Axiom 2) ---');
G.soilTiles = {
  '2_2': { type: 'frost_slick', c: 2, r: 2, life: 10 },
  '3_2': { type: 'acid_sinkhole', c: 3, r: 2, life: 10 },
  '4_2': { type: 'frost_slick', c: 4, r: 2, life: 10 }
};
const zapOrigin = { id: 20, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 2 * 60 + 30, y: 2 * 60 + 30, r: 10 };
const zapFar = { id: 21, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 4 * 60 + 30, y: 2 * 60 + 30, r: 10 };
const dryFoe = { id: 22, type: 'scout', hp: 200, maxHp: 200, dead: false, x: 7 * 60 + 30, y: 2 * 60 + 30, r: 10 };
G.enemies = [zapOrigin, zapFar, dryFoe];

const circuitOk = nb.propagateSurfaceCircuit(zapOrigin.x, zapOrigin.y, 100, null, ['tesla']);
assert.strictEqual(circuitOk, true, 'Surface circuit should propagate across connected conductive tiles');
assert(zapOrigin.hp < 200 && zapFar.hp < 200, 'Enemies standing on connected tiles must take shock damage');
assert.strictEqual(dryFoe.hp, 200, 'Disconnected enemy must remain unshocked by surface circuit');
console.log('Natural Surface Circuitry verified cleanly.');

console.log('--- 4. Testing Thermobaric Piston, Kinetic Bowling & Radiant Exhaust ---');
const heavyBrute = { id: 30, type: 'brute', hp: 1000, maxHp: 1000, dead: false, d: 200, seg: 0, pathId: 0, off: 0, x: 200, y: 90, r: 18, mass: 3.0 };
const trailingSwarm1 = { id: 31, type: 'swarm', hp: 150, maxHp: 150, shield: 40, dead: false, d: 185, seg: 0, pathId: 0, off: 0, x: 185, y: 90, r: 6, mass: 0.4 };
const trailingSwarm2 = { id: 32, type: 'swarm', hp: 150, maxHp: 150, shield: 0, dead: false, d: 170, seg: 0, pathId: 0, off: 0, x: 170, y: 90, r: 6, mass: 0.4 };
G.enemies = [heavyBrute, trailingSwarm1, trailingSwarm2];
// Put frost slick under brute to verify 1.5x slide knockback boost
const bc = Math.floor(heavyBrute.x / 60), br = Math.floor(heavyBrute.y / 60);
G.soilTiles[bc + '_' + br] = { type: 'frost_slick', c: bc, r: br, life: 10 };

const knockedCnt = nb.triggerThermobaricImpulse(heavyBrute.x, heavyBrute.y, null, ['cryo_infuse']);
assert(knockedCnt >= 1, 'Thermobaric impulse should knock back enemies in blast radius');
assert(heavyBrute.d <= 200 - 40, 'Heavy brute on Frost Slick should slide 1.5x further back (~48px)');
assert(trailingSwarm1.hp < 150 && trailingSwarm2.hp < 150, 'Sliding Brute must trigger Kinetic Bowling collision damage on trailing Swarms');

// Radiant Exhaust Test: Hot tower ignites idle nearby Oil Vent
const oilVent = G.biosphere.geomorphicNodes.find(n => n.type === 'oil_vent');
oilVent.state = 'idle';
const hotGatling = { type: 'gatling', x: oilVent.x + 30, y: oilVent.y, heat: 88, _exhaustCd: 0 };
nb.processTowerRadiantExhaust(hotGatling, 0.1);
assert.strictEqual(oilVent.state, 'ignited', 'Hot tower exhaust (heat >= 75) should ignite adjacent oil vent automatically');
console.log('Thermobaric Piston, Kinetic Bowling & Radiant Exhaust verified.');

console.log('--- 5. Testing Mirror Architect Physics Hijack (Axiom 3) ---');
// 5A: Galvanic Siphon steals surface circuit & EMPs tower
const siphon = { id: 40, type: 'galvanic_siphon', isSiphon: true, hp: 520, maxHp: 520, shield: 0, maxShield: 200, dead: false, x: 4 * 60 + 30, y: 2 * 60 + 30, r: 16 };
const friendWithSiphon = { id: 41, type: 'scout', hp: 100, maxHp: 100, shield: 0, maxShield: 100, dead: false, x: 3 * 60 + 30, y: 2 * 60 + 30, r: 10 };
const mockTesla = { type: 'tesla', x: 180, y: 120, empT: 0 };
G.enemies = [siphon, friendWithSiphon];
const wasCircuitAllowed = nb.propagateSurfaceCircuit(3 * 60 + 30, 2 * 60 + 30, 100, mockTesla, ['tesla']);
assert.strictEqual(wasCircuitAllowed, false, 'Galvanic Siphon must intercept and block surface circuit');
assert(mockTesla.empT > 0, 'Galvanic Siphon hijack must EMP-stun attacking Tesla tower');
assert(friendWithSiphon.shield > 0, 'Galvanic Siphon must feed absorbed energy into ally shields');

// 5B: Mirror-Husk reflects Rail/Energy beams until cracked by heavy kinetic
const mirrorFoe = { id: 42, type: 'mirror_husk', isMirrorHusk: true, mirrorCracked: false, hp: 500, maxHp: 500, dead: false, x: 400, y: 300, r: 15 };
const mockRail = { type: 'rail', x: 100, y: 300, empT: 0, dmg: 0 };
G.enemies = [mirrorFoe];
const reflDmg = nb.dealDamage(mirrorFoe, 200, 'phys', mockRail, {}); // phys < 45 from rail -> reflected backlash!
assert(mockRail.empT > 0, 'Uncracked Mirror-Husk must bounce EMP backlash onto firing Railgun');
assert(reflDmg <= 25, 'Uncracked Mirror-Husk must dampen reflected beam to 10%');

// Crack with heavy kinetic >= 45
nb.dealDamage(mirrorFoe, 80, 'phys', { type: 'gatling', dmg: 0 }, {});
assert.strictEqual(mirrorFoe.mirrorCracked, true, 'Heavy physical hit >= 45 should crack Mirror-Husk shell');

// 5C: Anchor-Behemoth resists Thermobaric knockback
const anchorFoe = { id: 43, type: 'anchor_behemoth', isAnchor: true, hp: 980, maxHp: 980, dead: false, d: 300, seg: 0, pathId: 0, off: 0, x: 300, y: 200, r: 21, mass: 5.0 };
G.enemies = [anchorFoe];
nb.triggerThermobaricImpulse(anchorFoe.x, anchorFoe.y, null, ['thermal_shock']);
assert.strictEqual(anchorFoe.d, 300, 'Anchor-Behemoth must resist Thermobaric knockback completely');

// 5D: Mirror Architect wave threat scheduling
G.emergent.signatureFreq = { circuit: 3, refract: 2, kinetic: 0 };
const scheduledThreats = nb.analyzeMirrorArchitectThreats(6);
assert(scheduledThreats.includes('galvanic_siphon') && scheduledThreats.includes('mirror_husk'), 'Mirror Architect must schedule hijackers matching dominant player motifs');
console.log('Mirror Architect Physics Hijack & Threat Adaptation verified.');

console.log('--- 6. Testing Novelty Discovery, Anti-Stagnation Decay & Recursion Guard ---');
G.emergent.discoveredChains = {};
G.emergent.uniqueCount = 0;
G.emergent.recentSignatures = [];
const preGold = G.gold;
const preCores = SAVE.cores || 0;

// Rare 4-step brand new discovery
const disc = nb.evaluateEmergentNovelty(['rail', 'conduit_ionize', 'cryo_refract', 'kinetic_bowling'], 300, 300);
assert.strictEqual(disc.isNew, true, 'Brand new 4-step chain must register as New Discovery');
assert.strictEqual(disc.freshness, 1.5, 'New discovery must apply 1.5x Freshness multiplier');
assert(G.gold > preGold && SAVE.cores > preCores, 'New 4-step discovery must grant bonus Gold and +1 Nanite Core');

// Repeat identical chain 5 times -> hits Stale Pattern decay (0.25x)
for (let k = 0; k < 4; k++) nb.evaluateEmergentNovelty(['rail', 'conduit_ionize', 'cryo_refract', 'kinetic_bowling'], 300, 300);
const staleEval = nb.evaluateEmergentNovelty(['rail', 'conduit_ionize', 'cryo_refract', 'kinetic_bowling'], 300, 300);
assert.strictEqual(staleEval.freshness, 0.25, 'Repeating exact chain >= 5 times must trigger 0.25x Stale decay');

// Recursion Depth Cap Guard
let guarded = ['s1', 's2', 's3', 's4', 's5', 's6'];
guarded = nb.appendChainStep(guarded, 's7');
assert.strictEqual(guarded.length, 6, 'appendChainStep must strictly enforce maxChainDepth = 6');
console.log('Novelty Discovery, Anti-Stagnation Decay & Recursion Guard verified.');

console.log('--- 7. Testing Headless Update Loop & Zero UI Bloat Check ---');
const targetFoe = { id: 50, type: 'brute', hp: 500, maxHp: 500, dead: false, x: 400, y: 200 };
G.enemies = [targetFoe];
G.hazards = [{ type: 'singularity', x: 350, y: 200, r: 65, life: 5 }];
G.incomingMortars = [{ x: 355, y: 205, tx: 800, ty: 300, reflected: false, progress: 0.5 }];

nb.updateEmergentSystems(0.1);
assert.strictEqual(G.incomingMortars[0].reflected, true, 'Hostile mortar crossing Singularity must deflect onto enemies');
assert(targetFoe.hp < 500, 'Deflected mortar must damage enemy force');

// Zero UI Bloat Verification: verify no extra buttons added to index.html topbar-actions
const buttonCount = (html.match(/class="cbtn\s/g) || []).length;
assert.strictEqual(buttonCount, 23, `index.html topbar must retain exact 23 .cbtn buttons without bloat (got ${buttonCount})`);
console.log('End-to-End Update Loop and Zero UI Bloat verified.');

console.log('\nAll 7 Bastion TD 25.0 Unified Emergent Crucible test suites passed!\n');
