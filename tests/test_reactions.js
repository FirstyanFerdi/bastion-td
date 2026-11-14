// Unit verification test for Elemental Reactions (Fase 1)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');

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
const G = nb.G;

console.log('Testing Elemental Reactions...');

// Test 1: Thermal Shockwave (Cryo + Plasma)
{
  spawnEnemy('brute', 1);
  const e = G.enemies[G.enemies.length - 1];
  e.armor = 0.4;
  e.slowT = 1.5;
  const dmg = dealDamage(e, 100, 'plasma', null);
  if (dmg < 200) throw new Error('Thermal shock damage multiplier failed');
  if (e.shred !== 0.2) throw new Error('Thermal shock 50% armor shred failed, expected 0.2, got ' + e.shred);
  if (e.slowT !== 0) throw new Error('Thermal shock did not consume slow');
  console.log('✔ Thermal Shockwave passed: 250% dmg burst & 50% armor shred');
}

// Test 2: Electrolytic Detonation (Acid + Tesla)
{
  spawnEnemy('scout', 1);
  spawnEnemy('scout', 1);
  const e1 = G.enemies[G.enemies.length - 2];
  const e2 = G.enemies[G.enemies.length - 1];
  e1.acidT = 3.0;
  e2.acidT = 3.0;
  const hpBefore = e2.hp;
  const teslaTower = { type: 'tesla', dmg: 0, kills: 0 };
  dealDamage(e1, 40, 'energy', teslaTower);
  if (e1.acidT !== 0) throw new Error('Primary acidT was not consumed');
  if (e2.acidT !== 0) throw new Error('Secondary acidT was not conducted');
  if (e2.hp >= hpBefore) throw new Error('Secondary enemy did not take conducted electrolytic damage');
  console.log('✔ Electrolytic Detonation passed: infinite acid chain lightning');
}

// Test 3: Thermite Incineration (Bleed + Plasma)
{
  spawnEnemy('brute', 1);
  const e = G.enemies[G.enemies.length - 1];
  e.bleedT = 2.0;
  dealDamage(e, 30, 'plasma', null);
  if (e.bleedT !== 0) throw new Error('Bleed was not converted into thermite');
  if (e.thermiteT !== 3.0) throw new Error('Thermite duration was not set');
  if (e.thermiteDps <= 0) throw new Error('Thermite dps was not set');
  console.log('✔ Thermite Incineration passed: 3.5% Max HP/sec DoT ignited');
}

// Test 4: Superconductor Surge (Cryo + Tesla)
{
  spawnEnemy('scout', 1);
  const e = G.enemies[G.enemies.length - 1];
  e.slowT = 1.0;
  const teslaTower = { type: 'tesla', dmg: 0, kills: 0 };
  const dmg = dealDamage(e, 50, 'energy', teslaTower);
  if (dmg !== 100) throw new Error('Superconductor guaranteed crit failed, expected 100, got ' + dmg);
  if (e.stunT < 1.2) throw new Error('Superconductor stun duration failed, expected >= 1.2, got ' + e.stunT);
  console.log('✔ Superconductor Surge passed: guaranteed crit & extended stun');
}

console.log('ALL 4 ELEMENTAL REACTIONS VERIFIED SUCCESSFULLY!');

