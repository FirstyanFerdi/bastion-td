// Unit test for Fase 5: Ascension Protocols & Special Event Mutators
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

console.log('Testing Fase 5: Ascension Protocols & Special Event Mutators...');

// 1. Ascension Dictionary & Modifiers Data
{
  if (!nb.ASCENSION_MODIFIERS || nb.ASCENSION_MODIFIERS.length < 6) throw new Error('Expected 6 Ascension levels (0 to 5)');
  for (let lv = 0; lv <= 5; lv++) {
    const data = nb.getAscensionData(lv);
    if (!data || data.level !== lv) throw new Error('Failed to retrieve Ascension data for level ' + lv);
  }
  console.log('✔ Ascension Protocol levels 0 to 5 verified');
}

// 2. Ascension 1: Hyper-Inflation (+15% tower cost)
{
  G.ascension = 0;
  const costNorm = nb.getTowerCost('gatling');
  if (costNorm !== 50) throw new Error('Expected 50 normal cost for gatling, got: ' + costNorm);

  G.ascension = 1;
  const costAsc1 = nb.getTowerCost('gatling');
  const expectedAsc1 = Math.round(50 * 1.15); // 58
  if (costAsc1 !== expectedAsc1) throw new Error('Expected ' + expectedAsc1 + ' cost under Hyper-Inflation, got: ' + costAsc1);

  const railCostAsc1 = nb.getTowerCost('rail');
  const expectedRail = Math.round(180 * 1.15); // 207
  if (railCostAsc1 !== expectedRail) throw new Error('Expected ' + expectedRail + ' for rail, got: ' + railCostAsc1);

  console.log('✔ Ascension 1 (Hyper-Inflation): +15% tower cost verified');
}

// 3. Ascension 2: Fragile Perimeter (12 starting lives)
{
  nb.SAVE.ascension = 0;
  newGame(false);
  if (nb.G.lives !== 25) throw new Error('Expected 25 lives on Ascension 0, got: ' + nb.G.lives);

  nb.SAVE.ascension = 2;
  newGame(false);
  if (nb.G.lives !== 12) throw new Error('Expected 12 lives under Fragile Perimeter (Ascension 2), got: ' + nb.G.lives);

  console.log('✔ Ascension 2 (Fragile Perimeter): 12 starting lives verified');
}

// 4. Ascension 3: Swarm Influx (+50% swarms, +15% speed)
{
  nb.G.ascension = 0;
  const spawnsNorm = nb.buildSpawns(3);
  const swarmsNorm = spawnsNorm.filter(s => s.type === 'swarm').length;

  nb.G.ascension = 3;
  const spawnsAsc3 = nb.buildSpawns(3);
  const swarmsAsc3 = spawnsAsc3.filter(s => s.type === 'swarm').length;

  if (swarmsAsc3 <= swarmsNorm) throw new Error('Expected swarmsAsc3 > swarmsNorm, got: ' + swarmsAsc3 + ' vs ' + swarmsNorm);

  // Speed test
  nb.G.enemies = [];
  spawnEnemy('swarm', 1);
  const swarmEnemy = nb.G.enemies[0];
  const baseSpeed = ED.swarm.speed;
  if (swarmEnemy.speed < baseSpeed * 1.10) throw new Error('Expected swarm speed boost on Ascension 3');

  console.log('✔ Ascension 3 (Swarm Influx): +50% swarm count and +15% speed verified');
}

// 5. Ascension 4: Shield Protocol (20% HP Shield on all enemies)
{
  nb.G.ascension = 4;
  nb.G.enemies = [];
  spawnEnemy('brute', 1);
  const brute = nb.G.enemies[0];

  if (!brute.shield || brute.shield <= 0) throw new Error('Expected innate shield on brute under Shield Protocol');
  const expectedShield = Math.round(brute.maxHp * 0.20);
  if (brute.shield !== expectedShield) throw new Error('Expected shield ' + expectedShield + ', got: ' + brute.shield);

  console.log('✔ Ascension 4 (Shield Protocol): 20% HP shield on hostiles verified');
}

// 6. Ascension 5: Nemesis Awakening (Boss execution immunity & Champion escorts)
{
  nb.G.ascension = 5;
  nb.G.enemies = [];
  spawnEnemy('boss', 1);
  const boss = nb.G.enemies[0];

  // Transition boss to Phase 2, then Phase 3 (Berserk)
  boss.phase = 2;
  boss.hp = Math.round(boss.maxHp * 0.25); // Trigger Phase 3 (hpPct <= 0.30)
  updateEnemy(boss, 0.05);

  if (boss.phase !== 3) throw new Error('Boss should be in Phase 3');
  // Check that 2 escorts were spawned
  const escorts = nb.G.enemies.filter(e => e !== boss && e.isChampion);
  if (escorts.length !== 2) throw new Error('Expected 2 Champion Escorts on Boss Berserk under Nemesis Awakening, got: ' + escorts.length);

  console.log('✔ Ascension 5 (Nemesis Awakening): Berserk Champion escorts verified');
}

// 7. Ascension Core Multiplier (+25% per level)
{
  nb.G.ascension = 0;
  nb.SAVE.cores = 0;
  const c0 = nb.addCores(10);
  if (c0 !== 10) throw new Error('Expected 10 cores at Ascension 0, got: ' + c0);

  nb.G.ascension = 4;
  const c4 = nb.addCores(10);
  if (c4 !== 20) throw new Error('Expected 20 cores (1 + 4*0.25 = 2.0x) at Ascension 4, got: ' + c4);

  console.log('✔ Nanite Cores Ascension multiplier (+25%/level) verified');
}

// 8. Special Event Mutators
{
  nb.G.ascension = 0;
  // A. Solar Flare (+35% Energy/Plasma damage)
  nb.G.mutator = nb.WAVE_MUTATORS.solar_flare;
  if (!nb.G.mutator) throw new Error('Missing solar_flare mutator');
  nb.G.enemies = [];
  spawnEnemy('scout', 1);
  const scout = nb.G.enemies[0];
  const hpBefore = scout.hp;
  dealDamage(scout, 10, 'energy', null);
  const dmgDealt = hpBefore - scout.hp;
  if (Math.round(dmgDealt) !== 14) throw new Error('Expected ~13.5 - 14 damage with +35% Solar Flare bonus, got: ' + dmgDealt);
  console.log('✔ Special Mutator: Solar Flare (+35% energy damage) verified');

  // B. Nanite Plague (Hostile death spawns 2 micro-swarms)
  nb.G.mutator = nb.WAVE_MUTATORS.nanite_plague;
  nb.G.enemies = [];
  spawnEnemy('scout', 1);
  const scoutPlague = nb.G.enemies[0];
  killEnemy(scoutPlague, null);
  const microSwarms = nb.G.enemies.filter(e => e.isMicroSpawn);
  if (microSwarms.length !== 2) throw new Error('Expected 2 micro-swarms from Nanite Plague, got: ' + microSwarms.length);
  console.log('✔ Special Mutator: Nanite Plague (micro-swarm spawn on death) verified');

  // C. Cryo Lockdown (-20% enemy speed)
  nb.G.mutator = nb.WAVE_MUTATORS.cryo_lockdown;
  nb.G.enemies = [];
  spawnEnemy('scout', 1);
  const scoutCryo = nb.G.enemies[0];
  const normalSpd = scoutCryo.speed;
  updateEnemy(scoutCryo, 0.05);
  if (Math.abs(scoutCryo.curSpeed - normalSpd * 0.80) > 1.0) {
    throw new Error('Expected scout speed to be reduced by 20% under Cryo Lockdown');
  }
  console.log('✔ Special Mutator: Cryo Lockdown (-20% speed) verified');

  // D. Overcharge Surge (+25% enemy speed)
  nb.G.mutator = nb.WAVE_MUTATORS.overcharge_anomaly;
  nb.G.enemies = [];
  spawnEnemy('scout', 1);
  const scoutOver = nb.G.enemies[0];
  const scoutOverBaseSpd = scoutOver.speed;
  updateEnemy(scoutOver, 0.05);
  if (Math.abs(scoutOver.curSpeed - scoutOverBaseSpd * 1.25) > 1.0) {
    throw new Error('Expected scout speed to be boosted by 25% under Overcharge Surge');
  }
  console.log('✔ Special Mutator: Overcharge Surge (+25% speed) verified');
}

console.log('\n🎉 ALL FASE 5 ASCENSION & SPECIAL EVENT MUTATORS TESTS PASSED!');
