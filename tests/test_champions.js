// Unit test for Adaptive Threat Director & Elite Champion Affixes (Fase 2)
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

console.log('Testing Fase 2: Adaptive Threat Director & Elite Champions...');

// 1. Threat Director: Physical bias -> Kinetic Deflector
{
  G.towers = [
    { type: 'gatling', x: 100, y: 100, c: 2, r: 2 },
    { type: 'gatling', x: 200, y: 100, c: 5, r: 2 },
    { type: 'rail', x: 300, y: 100, c: 7, r: 2 }
  ];
  const threat = getThreatDirectorAnalysis();
  if (!threat || threat.id !== 'deflector') throw new Error('Expected deflector threat, got: ' + (threat ? threat.id : 'null'));
  console.log('✔ Threat Director: Kinetic Deflector detected from physical bias');
}

// 2. Threat Director: Cryo bias -> Thermal Juggernaut
{
  G.towers = [
    { type: 'cryo', x: 100, y: 100, c: 2, r: 2 },
    { type: 'cryo', x: 200, y: 100, c: 5, r: 2 },
    { type: 'plasma', x: 300, y: 100, c: 7, r: 2 }
  ];
  const threat = getThreatDirectorAnalysis();
  if (!threat || threat.id !== 'thermal_juggernaut') throw new Error('Expected thermal_juggernaut threat, got: ' + (threat ? threat.id : 'null'));
  console.log('✔ Threat Director: Thermal Juggernaut detected from Cryo bias');
}

// 3. Threat Director: Cluster bias -> Artillery Walker
{
  G.towers = [
    { type: 'gatling', x: 100, y: 100, c: 2, r: 2 },
    { type: 'plasma', x: 120, y: 100, c: 3, r: 2 },
    { type: 'tesla', x: 100, y: 120, c: 2, r: 3 },
    { type: 'rail', x: 120, y: 120, c: 3, r: 3 }
  ];
  const threat = getThreatDirectorAnalysis();
  if (!threat || threat.id !== 'artillery') throw new Error('Expected artillery threat, got: ' + (threat ? threat.id : 'null'));
  console.log('✔ Threat Director: Artillery Walker detected from clustered towers');
}

// 4. Kinetic Deflector: 50% physical damage reduction
{
  spawnEnemy('brute', 1, null, 'deflector');
  const e = G.enemies[G.enemies.length - 1];
  e.armor = 0; // zero armor for clean test
  const dmgPhys = dealDamage(e, 100, 'phys', null);
  if (dmgPhys !== 50) throw new Error('Deflector expected 50 damage, got ' + dmgPhys);
  const dmgEnergy = dealDamage(e, 100, 'energy', null);
  if (dmgEnergy !== 100) throw new Error('Deflector should take 100 energy damage, got ' + dmgEnergy);
  console.log('✔ Kinetic Deflector passed: -50% phys, 100% energy');
}

// 5. Champion: Regenerator
{
  spawnEnemy('brute', 1, 'regenerator');
  const e = G.enemies[G.enemies.length - 1];
  if (!e.isChampion || e.affix !== 'regenerator') throw new Error('Champion setup failed');
  e.hp = e.maxHp - 100;
  e.dmgT = 0.5; // under fire
  updateEnemy(e, 0.5);
  if (e.hp !== e.maxHp - 100) throw new Error('Regenerator should not heal while under fire (dmgT > 0)');
  // Out of combat for 1.3 seconds
  updateEnemy(e, 1.3);
  if (e.hp <= e.maxHp - 100) throw new Error('Regenerator should heal after 1.2s without damage');
  console.log('✔ Champion Regenerator passed: heals out of combat');
}

// 6. Champion: Phase-Shifter
{
  spawnEnemy('brute', 1, 'phase_shifter');
  const e = G.enemies[G.enemies.length - 1];
  e.d = 100;
  // Small damage should not shift
  dealDamage(e, 30, 'energy', null);
  if (e.d !== 100) throw new Error('Small damage shifted position');
  // Heavy damage (>= 80) should shift forward 70px
  dealDamage(e, 100, 'energy', null);
  if (e.d < 160) throw new Error('Heavy damage did not trigger phase shift forward');
  if (e.phaseCd <= 0) throw new Error('Phase shift cooldown not set');
  console.log('✔ Champion Phase-Shifter passed: blinks forward 70px on heavy hit');
}

// 7. Champion: Avenger
{
  spawnEnemy('scout', 1, 'avenger');
  const avenger = G.enemies[G.enemies.length - 1];
  avenger.x = 200; avenger.y = 200;
  const initSpd = avenger.speed;
  const initArmor = avenger.armor;

  spawnEnemy('scout', 1);
  const ally = G.enemies[G.enemies.length - 1];
  ally.x = 220; ally.y = 200; // nearby (within 120px)

  killEnemy(ally, null);
  if (avenger.avengerStacks !== 1) throw new Error('Avenger did not gain stack, got ' + avenger.avengerStacks);
  if (avenger.speed <= initSpd) throw new Error('Avenger speed did not increase');
  if (avenger.armor <= initArmor) throw new Error('Avenger armor did not increase');
  console.log('✔ Champion Avenger passed: gains speed & armor when nearby allies die');
}

// 8. Champion: Anti-Projectile Dome
{
  spawnEnemy('brute', 1, 'dome');
  const domeChamp = G.enemies[G.enemies.length - 1];
  domeChamp.armor = 0;
  const dmg = dealDamage(domeChamp, 100, 'phys', null);
  if (dmg !== 60) throw new Error('Dome should dampen physical/projectile damage to 60%, got ' + dmg);
  console.log('✔ Champion Dome passed: 40% projectile damage dampening');
}

console.log('ALL FASE 2 ADAPTIVE THREAT & CHAMPION TESTS PASSED!');

