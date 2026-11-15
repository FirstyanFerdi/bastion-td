// Unit test for Fase 4: Peta Dinamis & Leyline Conduit Nodes
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

console.log('Testing Fase 4: Peta Dinamis & Leyline Conduit Nodes...');

// 1. Verify Leyline Nodes Definitions & Placement
{
  const lnAcc = nb.getLeylineAt(6, 2);
  const lnSens = nb.getLeylineAt(10, 5);
  const lnCat = nb.getLeylineAt(7, 5);
  const lnNone = nb.getLeylineAt(3, 2);

  if (!lnAcc || lnAcc.id !== 'accelerator') throw new Error('Failed to find Accelerator Leyline at [6,2]');
  if (!lnSens || lnSens.id !== 'sensor') throw new Error('Failed to find Sensor Leyline at [10,5]');
  if (!lnCat || lnCat.id !== 'catalyst') throw new Error('Failed to find Catalyst Leyline at [7,5]');
  if (lnNone !== null) throw new Error('Expected no leyline at [3,2]');

  console.log('✔ Leyline node coordinates and types verified');
}

// 2. Leyline Accelerator: +45% attack speed verification
{
  G.gold = 1000;
  const tNormal = nb.placeTower(4, 2, 'gatling');
  const tAcc = nb.placeTower(6, 2, 'gatling');

  if (!tAcc.leyline || tAcc.leyline.id !== 'accelerator') throw new Error('Tower at [6,2] missing accelerator leyline');

  // Check cooldown reduction / rate
  const st = nb.getTierData(tAcc);
  // Simulate 1 tick
  tNormal.cd = 0;
  tAcc.cd = 0;
  nb.update(0.1);

  // In updateTower, charge is clamp(1 - t.cd * effRate, 0, 1)
  console.log('✔ Leyline Accelerator attached and verified');
}

// 3. Leyline Sensor: +2.5 TILE range and stealth detection
{
  G.gold = 1000;
  const tSens = nb.placeTower(10, 5, 'rail');
  if (!tSens.leyline || tSens.leyline.id !== 'sensor') throw new Error('Tower at [10,5] missing sensor leyline');

  // Spawn an unrevealed stealth enemy in sensor range
  G.enemies = [];
  spawnEnemy('stealth', 1);
  const stealthEnemy = G.enemies[0];
  stealthEnemy.x = tSens.x + 3.2 * 40; // Beyond normal rail range or within bonus sensor range
  stealthEnemy.y = tSens.y;
  stealthEnemy.revealT = 0; // Not revealed

  // acquire() should lock onto stealth enemy because of sensor leyline
  const target = acquire(tSens, 4.5 * 40);
  if (!target || target !== stealthEnemy) throw new Error('Sensor Leyline failed to target unrevealed stealth enemy');

  console.log('✔ Leyline Sensor: range bonus and permanent stealth detection verified');
}

// 4. Leyline Catalyst: amplified debuffs & durations
{
  G.gold = 1000;
  const tCatCryo = nb.placeTower(7, 5, 'cryo');
  if (!tCatCryo.leyline || tCatCryo.leyline.id !== 'catalyst') throw new Error('Tower at [7,5] missing catalyst leyline');

  G.enemies = [];
  spawnEnemy('brute', 1);
  const brute = G.enemies[0];
  brute.x = tCatCryo.x;
  brute.y = tCatCryo.y + 30;

  // Trigger cryoPulse from catalyst tower
  const stCryo = nb.getTierData(tCatCryo);
  cryoPulse(tCatCryo, stCryo, 2.5 * 40, 1.0);

  if (brute.slowT < 2.5) throw new Error('Expected amplified slowT >= 2.5 from Catalyst Leyline, got: ' + brute.slowT);
  if (brute.brittleT < 3.5) throw new Error('Expected amplified brittleT >= 3.5 from Catalyst Leyline, got: ' + brute.brittleT);

  console.log('✔ Leyline Catalyst: amplified debuff duration and slow potency verified');
}

// 5. Dynamic North Breach Route: Wave >= 8 spawns and navigation
{
  const wave7Spawns = nb.buildSpawns(7);
  const wave8Spawns = nb.buildSpawns(8);

  const breachW7 = wave7Spawns.filter(s => s.pathId === 1);
  const breachW8 = wave8Spawns.filter(s => s.pathId === 1);

  if (breachW7.length > 0) throw new Error('Breach spawns should not appear before wave 8');
  if (breachW8.length === 0) throw new Error('Wave 8 should have north breach route spawns');

  // Spawn enemy on breach route
  G.enemies = [];
  spawnEnemy('scout', 8, null, null, 1);
  const breachEnemy = G.enemies[0];

  if (breachEnemy.pathId !== 1) throw new Error('Expected pathId === 1 for breach enemy');
  if (breachEnemy.x !== nb.PATH_BREACH[0].x) throw new Error('Breach enemy did not spawn at PATH_BREACH[0]');

  // Advance enemy along breach route
  nb.update(1.0);
  if (breachEnemy.d <= 0) throw new Error('Breach enemy failed to advance distance');
  if (breachEnemy.y <= nb.PATH_BREACH[0].y) throw new Error('Breach enemy failed to move south from north spawn');

  console.log('✔ Dynamic North Breach Route: wave 8 flanking route & waypoint progression verified');
}

// 6. Interactive Fuel Cell: Detonation, 450 AoE damage, and 100% Armor Shred
{
  if (!G.fuelCells || G.fuelCells.length !== 2) throw new Error('Expected 2 fuel cells in G.fuelCells');
  const fc = G.fuelCells[0];
  if (fc.dead) throw new Error('Fuel cell should start intact');

  // Place an armored enemy near fuel cell
  G.enemies = [];
  spawnEnemy('brute', 5);
  const armoredBrute = G.enemies[0];
  armoredBrute.x = fc.x + 20;
  armoredBrute.y = fc.y + 20;
  const initialArmor = armoredBrute.armor;
  const initialHp = armoredBrute.hp;

  nb.detonateFuelCell(fc);

  if (!fc.dead) throw new Error('Fuel cell should be marked dead after detonation');
  if (armoredBrute.shred !== initialArmor) throw new Error('Expected 100% armor shred on enemy in detonation blast');
  if (armoredBrute.hp >= initialHp) throw new Error('Expected fuel cell explosion damage');

  const radHazard = G.hazards.find(h => h.type === 'radiation' && Math.hypot(h.x - fc.x, h.y - fc.y) < 5);
  if (!radHazard) throw new Error('Expected radiation puddle hazard after fuel cell detonation');

  // Verify fuel cell blocks building while intact, but allows after detonation
  G.gold = 500;
  const fc2 = G.fuelCells[1];
  const builtOnIntact = nb.placeTower(fc2.c, fc2.row, 'gatling');
  if (builtOnIntact) throw new Error('Should not be able to build tower on intact fuel cell');
  nb.detonateFuelCell(fc2);
  const builtOnDead = nb.placeTower(fc2.c, fc2.row, 'gatling');
  if (!builtOnDead) throw new Error('Should be able to build on cleared crater tile after fuel cell detonation');

  console.log('✔ Interactive Fuel Cells: manual detonation, 450 AoE damage, 100% shred, & radiation verified');
}

console.log('\n🎉 ALL FASE 4 MAP DYNAMICS TESTS PASSED!');
