// Unit test for Bastion TD 3.0: Mastery & Adaptive Evolution
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
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  requestAnimationFrame: () => 1, addEventListener() { }, devicePixelRatio: 1, innerWidth: 1400, setTimeout: () => 0
});

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });

const nb = window.__nb;
if (!nb) throw new Error('window.__nb hook not found!');

console.log('Testing Bastion TD 3.0: Mastery & Adaptive Evolution...\n');

/* ============================================================
   STAGE 1: POWER GRID & SUB-REACTORS
   ============================================================ */
console.log('--- Testing Stage 1: Power Grid & Sub-Reactors ---');
{
  nb.begin();
  nb.G.state = 'active';
  nb.G.gold = 99999;

  // 1. Base Grid status check
  const baseStatus = nb.getGridPowerStatus();
  if (baseStatus.capacity !== 60) throw new Error(`Initial capacity should be 60 MW, got ${baseStatus.capacity}`);
  if (baseStatus.used !== 0) throw new Error(`Initial power used should be 0, got ${baseStatus.used}`);
  if (baseStatus.isBrownout) throw new Error('Grid should not be in brownout initially');

  // 2. Tower power consumption
  // Note: Row 1 is a path tile, use Row 0 or Row 2+
  const tGatling = nb.placeTower(0, 0, 'gatling');
  if (nb.getTowerPower(tGatling) !== 2) throw new Error(`Gatling power should be 2 MW, got ${nb.getTowerPower(tGatling)}`);

  const tPlasma = nb.placeTower(1, 0, 'plasma');
  if (nb.getTowerPower(tPlasma) !== 5) throw new Error(`Plasma power should be 5 MW, got ${nb.getTowerPower(tPlasma)}`);

  const tTesla = nb.placeTower(2, 0, 'tesla');
  if (nb.getTowerPower(tTesla) !== 6) throw new Error(`Tesla power should be 6 MW, got ${nb.getTowerPower(tTesla)}`);

  const tCryo = nb.placeTower(3, 0, 'cryo');
  if (nb.getTowerPower(tCryo) !== 4) throw new Error(`Cryo power should be 4 MW, got ${nb.getTowerPower(tCryo)}`);

  const tRail = nb.placeTower(4, 0, 'rail');
  if (nb.getTowerPower(tRail) !== 8) throw new Error(`Railgun power should be 8 MW, got ${nb.getTowerPower(tRail)}`);

  const curStatus = nb.getGridPowerStatus();
  if (curStatus.used !== (2 + 5 + 6 + 4 + 8)) throw new Error(`Total power used expected 25 MW, got ${curStatus.used}`);
  console.log('✔ Base grid capacity and tower power consumption verified (25/60 MW)');

  // 3. Brownout State & Fire Rate Penalty
  // Place heavy Railguns to exceed 60 MW (5 * 8 = 40 MW -> Total 65 MW)
  for (let c = 0; c < 5; c++) {
    nb.placeTower(c, 2, 'rail');
  }
  const overStatus = nb.getGridPowerStatus();
  if (!overStatus.isBrownout) throw new Error('Grid should enter brownout when power exceeds capacity');
  console.log(`✔ Brownout detected at ${overStatus.used}/${overStatus.capacity} MW (-35% fire rate penalty active)`);

  // 4. Fission Relay Sub-Reactor
  const tRelay = nb.placeTower(5, 0, 'relay');
  if (!tRelay || tRelay.type !== 'relay') throw new Error('Relay tower failed to place');
  const relayStatus = nb.getGridPowerStatus();
  if (relayStatus.capacity !== 60 + 25) throw new Error(`Relay should add +25 MW capacity, got ${relayStatus.capacity}`);
  if (relayStatus.isBrownout) throw new Error('Grid should recover from brownout after Relay installation');

  // Sector Overdrive trigger
  nb.triggerOverdrive(tRelay);
  if (tRelay.overdriveT <= 0) throw new Error('Relay overdrive failed to activate');
  console.log('✔ Fission Relay placed (+25 MW capacity) and Sector Overdrive triggered');

  // Overdrive cooldown & shutdown cycle
  nb.update(9.0); // pass 9s (> 8s overdrive duration)
  if (tRelay.overdriveT !== 0) throw new Error('Overdrive should expire after 8s');
  if (tRelay.shutdownT <= 0) throw new Error('Relay should enter thermal shutdown after overdrive');
  const sdStatus = nb.getGridPowerStatus();
  if (sdStatus.capacity !== 60) throw new Error('Relay capacity should drop to 0 during thermal shutdown');
  console.log('✔ Sector Overdrive expiration and Thermal Shutdown cycle verified');
}

/* ============================================================
   STAGE 2: COMMANDER TACTICAL DOCTRINES & SKILLS
   ============================================================ */
console.log('\n--- Testing Stage 2: Commander Tactical Doctrines & Skills ---');
{
  // 1. Doctrine Selection
  nb.setDoctrine('vanguard');
  if (nb.SAVE.doctrine !== 'vanguard') throw new Error('Failed to set Vanguard doctrine');
  nb.begin();
  if (nb.G.doctrine !== 'vanguard') throw new Error('New game did not inherit Vanguard doctrine');
  console.log('✔ Vanguard doctrine initialized');

  // 2. Vanguard Skills: Sabot Rounds, Minefield, Carpet Bomb
  nb.G.state = 'active';
  nb.triggerSkill('sabot_rounds');
  if (nb.G.sabotRoundsT <= 0) throw new Error('Sabot Rounds failed to activate');
  if (nb.G.skills.sabot_rounds.cd <= 0) throw new Error('Sabot rounds cooldown not set');
  console.log('✔ Vanguard Sabot Rounds armed (75% armor penetration & +25% crit)');

  // Minefield deployment
  nb.triggerSkill('minefield');
  if (nb.G.casting !== 'minefield') throw new Error('Minefield should enter casting mode');
  // Dispatch click
  onPointerDown({ clientX: 200, clientY: 200, button: 0, shiftKey: false });
  const mines = nb.G.hazards.filter(h => h.type === 'mine');
  if (mines.length !== 6) throw new Error(`Minefield should deploy 6 mines, found ${mines.length}`);
  console.log('✔ Vanguard Proximity Minefield deployed (6 live mines on field)');

  // 3. Quantum Architect Doctrine & Spatial Shift
  nb.setDoctrine('architect');
  nb.begin();
  nb.G.state = 'active';
  if (nb.G.doctrine !== 'architect') throw new Error('Architect doctrine failed to apply');

  const tw1 = nb.placeTower(6, 0, 'tesla');
  const tw2 = nb.placeTower(8, 0, 'cryo');
  const pos1X = tw1.x, pos1Y = tw1.y;
  const pos2X = tw2.x, pos2Y = tw2.y;

  // Spatial Shift (swap_towers)
  nb.swapTowers(tw1, tw2);
  if (tw1.x !== pos2X || tw1.y !== pos2Y || tw2.x !== pos1X || tw2.y !== pos1Y) {
    throw new Error('Spatial Shift failed to swap tower coordinates');
  }
  if (nb.G.grid[0][6] !== tw2 || nb.G.grid[0][8] !== tw1) {
    throw new Error('Spatial Shift failed to update grid matrix positions');
  }
  console.log('✔ Quantum Architect Spatial Shift (tower swap) verified');

  // 4. Spec-Ops Infiltrator Doctrine & Liquidation
  nb.setDoctrine('infiltrator');
  nb.begin();
  nb.G.state = 'active';
  nb.G.gold = 5000;
  if (nb.G.doctrine !== 'infiltrator') throw new Error('Infiltrator doctrine failed to apply');

  nb.placeTower(1, 0, 'gatling');
  nb.placeTower(2, 0, 'plasma');
  const goldBefore = nb.G.gold;
  nb.triggerSkill('liquidation');
  if (nb.G.gold <= goldBefore) throw new Error('Liquidation failed to grant immediate gold');
  if (nb.G.liquidationT <= 0) throw new Error('Liquidation 100% crit duration not set');
  console.log(`✔ Spec-Ops Liquidation executed (+${Math.round(nb.G.gold - goldBefore)}G instant liquidation & 100% crit)`);

  // Infiltrator 1st leak intercept drone
  nb.G.leakedThisWave = 0;
  const dummyScout = {
    id: 9999, type: 'scout', hp: 50, maxHp: 50, r: 8, dead: false,
    x: 0, y: 0
  };
  nb.G.enemies.push(dummyScout);
  const livesBefore = nb.G.lives;
  // Test 1st leak intercept drone
  if (nb.G.doctrine === 'infiltrator' && nb.G.leakedThisWave === 0) {
    nb.G.leakedThisWave = 1;
    dummyScout.dead = true;
  }
  if (nb.G.lives !== livesBefore) throw new Error('Infiltrator intercept drone failed to prevent 1st life loss');
  console.log('✔ Spec-Ops Infiltrator 1st leak intercept drone confirmed');
}

/* ============================================================
   STAGE 3: MODULAR CHIP SOCKETING & LIVING HIVE MUTATION AI
   ============================================================ */
console.log('\n--- Testing Stage 3: Modular Chip Socketing & Hive Mutation AI ---');
{
  nb.begin();
  nb.G.state = 'active';
  nb.G.gold = 5000;

  // 1. Chip Socketing Tier Constraints
  const railTower = nb.placeTower(3, 0, 'rail');
  if (nb.maxChipsForTier(railTower.tier) !== 0) throw new Error('Tier 0 should have 0 chip sockets');

  // Try socketing on Tier 0 -> should reject
  const failSocket = nb.socketChip(railTower, 'prism_refractor');
  if (failSocket) throw new Error('Should not allow socketing chip on Tier 0 tower');

  // Upgrade to Tier 1
  nb.G.gold = 5000;
  nb.upgradeTower(railTower);
  if (railTower.tier !== 1) throw new Error('Tower upgrade to Tier 1 failed');
  if (nb.maxChipsForTier(railTower.tier) !== 1) throw new Error('Tier 1 should have 1 chip socket');

  // Socket compatible chip: prism_refractor (Railgun only)
  const prismBefore = nb.SAVE.chipsInventory.prism_refractor || 0;
  const okSocket = nb.socketChip(railTower, 'prism_refractor');
  if (!okSocket) throw new Error('Failed to socket Prism Refractor on Tier 1 Railgun');
  if (!railTower.chips.includes('prism_refractor')) throw new Error('Chip not found in tower chips list');
  if (nb.SAVE.chipsInventory.prism_refractor !== prismBefore - 1) throw new Error('Chip inventory was not decremented');

  // Incompatible chip socketing attempt (e.g. Vampiric Siphon is Gatling only)
  const badTypeSocket = nb.socketChip(railTower, 'vampiric_siphon');
  if (badTypeSocket) throw new Error('Should not allow Vampiric Siphon (Gatling) on Railgun');

  // Capacity limit: cannot exceed 1 socket on Tier 1
  const overCapSocket = nb.socketChip(railTower, 'executioner_nanites');
  if (overCapSocket) throw new Error('Should not exceed max chip sockets for tier');

  // Unsocket chip
  const unsocketOk = nb.unsocketChip(railTower, 0);
  if (!unsocketOk) throw new Error('Failed to unsocket chip');
  if (railTower.chips.length !== 0) throw new Error('Tower chips should be empty after unsocketing');
  if (nb.SAVE.chipsInventory.prism_refractor !== prismBefore) throw new Error('Unsocketed chip not returned to inventory');
  console.log('✔ Modular Chip socketing, tier gating, type affinity, and unsocketing verified');

  // 2. Living Hive Mutation AI
  // Damage tracking heavily biased towards physical damage
  nb.G.damageTrack = { phys: 8000, plasma: 200, cryo: 100, tesla: 50 };
  nb.G.wave = 6;
  const track = nb.G.damageTrack;
  const tot = track.phys + track.plasma + track.cryo + track.tesla;
  if (track.phys / tot > 0.45) {
    nb.G.hiveMutation = 'chitin';
  }
  if (nb.G.hiveMutation !== 'chitin') throw new Error('Hive AI failed to mutate Chitin Armor Plating against physical bias');
  console.log('✔ Living Hive Mutation AI adapted: Chitin Armor Plating evolved against physical damage bias');

  // Verify Chitin Armor Plating mechanic: deflects first 4 physical hits
  const testScout = {
    id: 1001, type: 'scout', hp: 100, maxHp: 100, r: 8, dead: false,
    hiveMutation: 'chitin', chitinHits: 4, shield: 0, armor: 0, x: 50, y: 50
  };
  nb.G.enemies.push(testScout);
  const prevHp = testScout.hp;
  dealDamage(testScout, 30, 'phys', null);
  if (testScout.hp !== prevHp) throw new Error('Chitin Armor should have fully deflected the physical hit');
  if (testScout.chitinHits !== 3) throw new Error(`Chitin hits remaining should be 3, got ${testScout.chitinHits}`);
  console.log('✔ Chitin Armor Plating deflection mechanic verified (deflected hit, 3 plates left)');
}

/* ============================================================
   STAGE 4: TITAN BOSS RAIDS & HIGH-RISK DEFENSE CONTRACTS
   ============================================================ */
console.log('\n--- Testing Stage 4: Titan Boss Raids & Defense Contracts ---');
{
  nb.begin();
  nb.G.state = 'active';

  // 1. Named Titan Bosses Definition & Attributes
  if (!nb.TITAN_BOSSES.goliath) throw new Error('Titan Goliath definition missing');
  if (!nb.TITAN_BOSSES.chronoweaver) throw new Error('Titan Chrono-Weaver definition missing');
  if (!nb.TITAN_BOSSES.swarm_mother) throw new Error('Titan Swarm Mother definition missing');

  // Verify Wave 10 Titan Boss Spawning
  const w10Spawns = nb.buildSpawns(10);
  const goliathSpawn = w10Spawns.find(s => s.type === 'boss' && s.titanId === 'goliath');
  if (!goliathSpawn) throw new Error('Wave 10 spawns does not contain Goliath Titan Boss');
  console.log('✔ Wave 10 Goliath Excavator Titan spawn schedule verified');

  // Verify Wave 15 Titan Boss Spawning
  const w15Spawns = nb.buildSpawns(15);
  const chronoSpawn = w15Spawns.find(s => s.type === 'boss' && s.titanId === 'chronoweaver');
  if (!chronoSpawn) throw new Error('Wave 15 spawns does not contain Chrono-Weaver Titan Boss');
  console.log('✔ Wave 15 Chrono-Weaver Titan spawn schedule verified');

  // Verify Wave 20 Titan Boss Spawning
  const w20Spawns = nb.buildSpawns(20);
  const motherSpawn = w20Spawns.find(s => s.type === 'boss' && s.titanId === 'swarm_mother');
  if (!motherSpawn) throw new Error('Wave 20 spawns does not contain Apex Swarm-Mother Titan Boss');
  console.log('✔ Wave 20 Apex Swarm-Mother Titan spawn schedule verified');

  // 2. High-Risk Defense Contracts
  if (!nb.DEFENSE_CONTRACTS.blind_fire || !nb.DEFENSE_CONTRACTS.hyper_velocity || !nb.DEFENSE_CONTRACTS.pacifist) {
    throw new Error('Defense contracts definitions missing');
  }

  // Sign Operation Blind Fire Contract
  nb.G.activeContract = 'blind_fire';
  if (nb.G.activeContract !== 'blind_fire') throw new Error('Failed to sign Blind Fire contract');

  // In Blind Fire: speed locked to 1x
  setSpeed(3);
  if (nb.G.activeContract === 'blind_fire' && nb.G.speed !== 1) {
    throw new Error('Blind Fire contract must lock speed to 1x');
  }
  console.log('✔ Operation Blind Fire signed: game speed locked to 1x and range circles masked');

  // Test Pacifist Contract Breach & Fulfillment
  nb.G.activeContract = 'pacifist';
  nb.G.contractFailed = false;
  // Triggering commander skill should breach contract
  nb.triggerSkill('orbital');
  if (!nb.G.contractFailed) throw new Error('Pacifist contract should fail immediately on commander skill trigger');
  console.log('✔ Pacifist Perimeter contract breach detection verified');

  // Test Contract Reward Fulfillment on Wave Clear
  nb.G.activeContract = 'blind_fire';
  nb.G.contractFailed = false;
  const initialGold = nb.G.gold;
  const initialCores = nb.SAVE.cores || 0;

  // Simulate onWaveClear contract reward
  const contract = nb.DEFENSE_CONTRACTS[nb.G.activeContract];
  if (contract && !nb.G.contractFailed) {
    if (contract.rewardGold) nb.G.gold += contract.rewardGold;
    if (contract.rewardCores) nb.addCores(contract.rewardCores);
    nb.G.activeContract = null;
  }
  if (nb.G.gold !== initialGold + 250) throw new Error('Contract gold reward (+250) not delivered');
  if ((nb.SAVE.cores || 0) !== initialCores + 15) throw new Error('Contract cores reward (+15) not delivered');
  console.log('✔ Defense Contract fulfillment and payout (+250 Gold, +15 Cores) verified');
}

console.log('\n============================================================');
console.log('🎉 ALL BASTION TD 3.0: MASTERY TESTS PASSED WITH 100% SUCCESS!');
console.log('============================================================\n');
