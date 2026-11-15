// Unit test for Workshop HQ & Permanent Meta-Progression (Fase 3)
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

console.log('Testing Fase 3: Workshop HQ & Meta-Progression...');

// 1. Nanite Cores Earning & Persistence
{
  const initial = nb.SAVE.cores || 0;
  nb.addCores(25);
  if (nb.SAVE.cores !== initial + 25) throw new Error('addCores failed, expected ' + (initial + 25) + ', got ' + nb.SAVE.cores);
  console.log('✔ Nanite Cores earning & storage passed: ' + nb.SAVE.cores + ' cores');
}

// 2. Workshop Upgrades & Cost Validation
{
  nb.SAVE.workshop = {}; // Reset for testing
  nb.SAVE.cores = 5; // not enough for treasury (cost 10)
  const failRes = nb.upgradeWorkshop('treasury');
  if (failRes !== false || nb.getWorkshopLevel('treasury') !== 0) throw new Error('Should not allow upgrade without enough cores');

  nb.addCores(50); // now 55 cores
  const ok1 = nb.upgradeWorkshop('treasury');
  if (!ok1 || nb.getWorkshopLevel('treasury') !== 1) throw new Error('Treasury Lv 1 upgrade failed');
  if (nb.SAVE.cores !== 45) throw new Error('Expected 45 cores left after 10 cost, got ' + nb.SAVE.cores);

  const ok2 = nb.upgradeWorkshop('treasury'); // cost 25
  if (!ok2 || nb.getWorkshopLevel('treasury') !== 2) throw new Error('Treasury Lv 2 upgrade failed');
  if (nb.SAVE.cores !== 20) throw new Error('Expected 20 cores left, got ' + nb.SAVE.cores);
  console.log('✔ Workshop upgrade progression & core deduction passed');
}

// 3. Starting Treasury Gold Bonus
{
  // With treasury Lv 2, starting gold should be 250 + 2*50 = 350
  newGame();
  if (nb.G.gold !== 350) throw new Error('Expected 350 starting gold with Treasury Lv 2, got ' + nb.G.gold);
  console.log('✔ Starting Treasury passed: ' + nb.G.gold + ' gold on new game');
}

// 4. Logistics Network Upgrade Discount
{
  nb.SAVE.workshop.logistics = 1; // 10% discount
  const cost1 = nb.getUpgradeCost(100);
  if (cost1 !== 90) throw new Error('Expected 90 after 10% discount, got ' + cost1);

  nb.SAVE.workshop.logistics = 2; // 18% discount
  const cost2 = nb.getUpgradeCost(100);
  if (cost2 !== 82) throw new Error('Expected 82 after 18% discount, got ' + cost2);
  console.log('✔ Logistics Network passed: -10% (Lv 1) and -18% (Lv 2) upgrade discount');
}

// 5. Citadel Auto-Turret
{
  nb.SAVE.workshop.citadel_turret = 1;
  newGame();
  nb.G.state = 'active';
  // Spawn an enemy right near the base
  spawnEnemy('scout', 1);
  const e = nb.G.enemies[nb.G.enemies.length - 1];
  e.d = 1000;
  e.x = BASE_PT.x - 20; e.y = BASE_PT.y - 20; // within 2.5 tiles (100px)
  const hpBefore = e.hp;
  update(0.6); // ticks citadel turret
  if (e.hp >= hpBefore) throw new Error('Citadel Auto-Turret did not fire at hostile nearing base');
  console.log('✔ Citadel Auto-Turret passed: engages hostiles entering base perimeter');
}

// 6. Command Protocol [R] - Tactical EMP Nuke
{
  nb.SAVE.workshop.command_protocol = 1;
  newGame();
  nb.G.state = 'active';
  spawnEnemy('carrier', 1);
  spawnEnemy('brute', 1);
  const c = nb.G.enemies[nb.G.enemies.length - 2];
  const b = nb.G.enemies[nb.G.enemies.length - 1];
  c.shield = 100; c.maxShield = 100;
  b.stunT = 0;

  nb.triggerSkill('emp_nuke');
  if (c.shield !== 0) throw new Error('EMP Nuke failed to strip shields');
  if (b.stunT < 2.9) throw new Error('EMP Nuke failed to stun hostiles for 3s, got: ' + b.stunT);
  if (nb.G.skills.emp_nuke.cd <= 0) throw new Error('EMP Nuke cooldown was not set');
  console.log('✔ Command Protocol [R] Tactical EMP Nuke passed: shields wiped & 3s global stun');
}

console.log('ALL FASE 3 WORKSHOP HQ & META-PROGRESSION TESTS PASSED!');

