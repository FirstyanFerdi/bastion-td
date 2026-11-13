'use strict';
/* Path, tower/enemy definitions and wave generator */

/* ============================================================
   PATH
   ============================================================ */
const WP_TILES = [[0, 1], [5, 1], [5, 4], [2, 4], [2, 7], [8, 7], [8, 3], [11, 3], [11, 8], [14, 8], [14, 2], [15, 2]];
const pathTile = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
const PATH = [{ x: -TILE * 0.6, y: WP_TILES[0][1] * TILE + TILE / 2 }];
for (const [c, r] of WP_TILES) PATH.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
for (let i = 0; i < WP_TILES.length - 1; i++) {
  const [c1, r1] = WP_TILES[i], [c2, r2] = WP_TILES[i + 1];
  const dc = Math.sign(c2 - c1), dr = Math.sign(r2 - r1);
  let c = c1, r = r1; pathTile[r][c] = true;
  while (c !== c2 || r !== r2) { c += dc; r += dr; pathTile[r][c] = true; }
}
const SEG = []; let PLEN = 0;
for (let i = 0; i < PATH.length - 1; i++) {
  const a = PATH[i], b = PATH[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
  SEG.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len, start: PLEN, ang: Math.atan2(b.y - a.y, b.x - a.x) });
  PLEN += len;
}
function posAt(d, hint) {
  let i = hint || 0; if (d < 0) d = 0;
  while (i < SEG.length - 1 && d >= SEG[i].start + SEG[i].len) i++;
  const s = SEG[i], t = clamp((d - s.start) / s.len, 0, 1);
  return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t, ang: s.ang, seg: i };
}
const BASE_PT = PATH[PATH.length - 1];
const SPAWN_PT = { x: TILE * 0.5, y: PATH[0].y };

/* ============================================================
   DEFINITIONS
   ============================================================ */
const TD = {
  gatling: {
    id: 'gatling', name: 'Gatling Turret', color: '#22d3ee', cost: 50, key: '1', role: 'Rapid fire / Physical',
    tip: 'Cheap, relentless single-target fire. Armor blunts physical damage, pair with Plasma (shreds armor) and Cryo (brittle = +damage taken).',
    tiers: [
      { dmg: 8, rate: 6, range: 2.8, upg: 0 },
      { dmg: 14, rate: 8.5, range: 3.1, upg: 65 }
    ],
    branches: {
      A: { branch: 'A', name: 'Overdrive Minigun', role: 'Accelerating Fire', color: '#38bdf8', dmg: 16, rate: 11, maxRate: 22, range: 3.3, upg: 135, tip: 'Heat ramps rate up to 22/s on focused targets.' },
      B: { branch: 'B', name: 'Flak Cannon', role: 'Burst Shrapnel AoE', color: '#0ea5e9', dmg: 36, rate: 3.2, range: 3.5, flakRadius: 1.3, shrapnel: 4, upg: 135, tip: 'Proximity flak bursts tear into clusters of light enemies.' }
    }
  },
  plasma: {
    id: 'plasma', name: 'Plasma Cannon', color: '#fb923c', cost: 110, key: '2', role: 'Splash / Armor shred',
    tip: 'Slow AoE shells ignore armor and permanently shred it, so Gatlings and Railguns hit Brutes far harder afterward. Crushes Swarms.',
    tiers: [
      { dmg: 42, rate: 0.8, range: 2.7, splash: 1.1, shred: 0.12, upg: 0 },
      { dmg: 75, rate: 0.9, range: 3.0, splash: 1.3, shred: 0.18, upg: 100 }
    ],
    branches: {
      A: { branch: 'A', name: 'Nova Mortar', role: 'Nuclear Radiation', color: '#f97316', dmg: 140, rate: 0.55, range: 3.6, splash: 1.7, shred: 0.25, radDur: 4.5, radDps: 26, upg: 185, tip: 'Nuclear blast leaves radioactive pool burning and shredding enemies.' },
      B: { branch: 'B', name: 'Acid Melter', role: 'Corrosive Beam', color: '#ea580c', dmg: 20, rate: 4.5, range: 3.2, splash: 0.7, shred: 0.35, acidAmp: 0.25, upg: 175, tip: 'Rapid acid spray melts armor to 0 and amplifies all damage taken.' }
    }
  },
  cryo: {
    id: 'cryo', name: 'Cryo Emitter', color: '#60a5fa', cost: 80, key: '3', role: 'Slow / Brittle',
    tip: 'Pulses slow enemies 40% and make them brittle (+20% damage from everything). Tier III pulses periodically freeze enemies (bosses are immune).',
    tiers: [
      { dmg: 3, rate: 0.8, range: 2.4, slow: 0.4, brittle: 0.2, freeze: 0, upg: 0 },
      { dmg: 6, rate: 1.0, range: 2.7, slow: 0.45, brittle: 0.25, freeze: 0, upg: 75 }
    ],
    branches: {
      A: { branch: 'A', name: 'Absolute Zero', role: 'Deep Freeze Shatter', color: '#93c5fd', dmg: 14, rate: 0.75, range: 3.1, slow: 0.55, brittle: 0.35, freezeDur: 2.2, shatter: true, upg: 140, tip: 'Radial blast freezes all targets solid. Frozen units shatter on death.' },
      B: { branch: 'B', name: 'Vortex Siphon', role: 'Gravity Anomaly', color: '#3b82f6', dmg: 16, rate: 1.3, range: 2.9, slow: 0.45, brittle: 0.25, pullDist: 26, upg: 140, tip: 'Gravitational pulse pulls enemies backwards toward the center.' }
    }
  },
  tesla: {
    id: 'tesla', name: 'Tesla Coil', color: '#facc15', cost: 130, key: '4', role: 'Chain lightning / Energy',
    tip: 'Lightning chains across up to 4 enemies. Energy damage ignores armor and deals bonus damage to shields, the answer to shielded waves and bosses.',
    tiers: [
      { dmg: 16, rate: 1.4, range: 2.5, targets: 2, sm: 1.75, upg: 0 },
      { dmg: 28, rate: 1.6, range: 2.8, targets: 3, sm: 2.0, upg: 110 }
    ],
    branches: {
      A: { branch: 'A', name: 'Grid Overcharger', role: 'Pylon Buff Conduit', color: '#eab308', dmg: 38, rate: 1.8, range: 3.2, targets: 4, sm: 2.2, buffAura: 0.35, upg: 195, tip: 'Chains lightning and grants +35% attack speed to adjacent friendly towers.' },
      B: { branch: 'B', name: 'EMP Disrupter', role: 'Shield Stripper / Stun', color: '#ca8a04', dmg: 52, rate: 1.25, range: 3.0, targets: 3, sm: 3.5, empStun: 1.6, stripShield: true, upg: 195, tip: 'Instantly overloads enemy shields and disables healer/boss abilities.' }
    }
  },
  rail: {
    id: 'rail', name: 'Railgun Sniper', color: '#e11d48', cost: 180, key: '5', role: 'Pierce / Crit / Long range',
    tip: 'Enormous range and critical hits; the slug pierces every enemy in a straight line. Place it on long straights to rake whole columns of Brutes.',
    tiers: [
      { dmg: 100, rate: 0.4, range: 5.5, crit: 0.2, cm: 2.5, pierce: 3, upg: 0 },
      { dmg: 180, rate: 0.45, range: 6.5, crit: 0.25, cm: 2.5, pierce: 5, upg: 155 }
    ],
    branches: {
      A: { branch: 'A', name: 'Orbital Lance', role: 'Continuous Thermal Beam', color: '#f43f5e', dmg: 95, rate: 3.0, range: 8.0, pierce: 99, beam: true, crit: 0.2, cm: 2.0, upg: 270, tip: 'Sustained thermal laser cuts through entire columns continuously.' },
      B: { branch: 'B', name: 'Executioner', role: 'Anti-Boss Heavy Slug', color: '#be123c', dmg: 360, rate: 0.35, range: 8.5, crit: 0.35, cm: 3.5, pierce: 4, execThresh: 0.18, upg: 270, tip: 'Hyper-kinetic round executes non-boss enemies under 18% HP instantly.' }
    }
  }
};
// Backward compatibility fallback for tier 2
for (const k of Object.keys(TD)) TD[k].tiers[2] = TD[k].branches.A;

function getTierData(t) {
  const def = TD[t.type];
  if (t.branch && def.branches[t.branch]) return def.branches[t.branch];
  return def.tiers[t.tier] || def.tiers[0];
}

const TKEYS = ['gatling', 'plasma', 'cryo', 'tesla', 'rail'];
const PRIOS = [['first', 'First'], ['last', 'Last'], ['strongest', 'Strongest'], ['weakest', 'Weakest']];

/* ============================================================
   ROGUE-LITE TECH PERKS & SKILLS
   ============================================================ */
const PERKS = {
  superconductor: { id: 'superconductor', name: 'Superconductor', tag: 'TESLA', desc: 'Tesla Coil chains +2 extra enemies and applies Brittle (+25% damage taken).' },
  depleted_uranium: { id: 'depleted_uranium', name: 'Depleted Uranium', tag: 'GATLING', desc: 'Gatling gains +25% armor penetration and inflicts bleeding damage over time.' },
  cryo_shatter: { id: 'cryo_shatter', name: 'Cryo Shatter', tag: 'CRYO', desc: 'Enemies dying while slowed or frozen explode into icy shrapnel hitting nearby foes.' },
  chain_reaction: { id: 'chain_reaction', name: 'Chain Reaction', tag: 'PLASMA', desc: 'Plasma explosions scoring kills trigger a secondary destructive shockwave.' },
  orbital_salvo: { id: 'orbital_salvo', name: 'Orbital Salvo', tag: 'COMMAND', desc: 'Orbital Strike radius +40% and ability cooldown reduced by 35%.' },
  titan_hunter: { id: 'titan_hunter', name: 'Titan Hunter', tag: 'OFFENSE', desc: 'All towers deal +30% bonus damage against Bosses and Armored Brutes.' },
  venture_capital: { id: 'venture_capital', name: 'Venture Capital', tag: 'ECONOMY', desc: 'End-of-wave interest rate boosted to 14% (cap 260 gold).' },
  energy_shield: { id: 'energy_shield', name: 'Emergency Forcefield', tag: 'DEFENSE', desc: 'The first 2 leaked enemies per wave do not deduct player lives.' },
  nanite_infusion: { id: 'nanite_infusion', name: 'Nanite Infusion', tag: 'TACTICAL', desc: 'Nanite Caltrops duration +50% and permanently strips 30% enemy armor.' },
  targeting_matrix: { id: 'targeting_matrix', name: 'Targeting Matrix', tag: 'ALL TOWERS', desc: 'All towers gain +15% attack range and +10% Critical Chance.' }
};

const COMMANDER_SKILLS = {
  orbital: { id: 'orbital', name: 'Orbital Strike', key: 'Q', cd: 32, icon: 'target', desc: 'Call down a devastating kinetic strike on target area.' },
  overcharge: { id: 'overcharge', name: 'Overcharge', key: 'W', cd: 25, icon: 'ff', desc: 'Supercharge a tower for 7s (+100% fire rate).' },
  caltrops: { id: 'caltrops', name: 'Nanite Caltrops', key: 'E', cd: 18, icon: 'shield', desc: 'Deploy spike hazard on road (slows 60% and shreds).' }
};

const WAVE_MUTATORS = {
  ion_storm: { id: 'ion_storm', name: 'Ion Storm', desc: '+25% Energy Damage, -15% Ballistic Rate', cls: 'purple' },
  heavy_plating: { id: 'heavy_plating', name: 'Heavy Plating', desc: '+20% Enemy Armor', cls: 'orange' },
  frenzy: { id: 'frenzy', name: 'Frenzy Surge', desc: 'Enemies sprint below 40% HP', cls: 'orange' },
  emp_jam: { id: 'emp_jam', name: 'EMP Interference', desc: '-10% Tower Range', cls: 'purple' }
};

const ED = {
  scout: { name: 'Scout', hp: 34, speed: 112, r: 10, armor: 0, reward: 4, leak: 1 },
  brute: { name: 'Armored Brute', hp: 240, speed: 46, r: 18, armor: 0.6, reward: 15, leak: 2 },
  swarm: { name: 'Swarm', hp: 13, speed: 84, r: 6, armor: 0, reward: 2, leak: 1 },
  healer: { name: 'Healer', hp: 110, speed: 62, r: 12, armor: 0, reward: 12, leak: 1 },
  stealth: { name: 'Stealth Infiltrator', hp: 44, speed: 115, r: 9, armor: 0, reward: 8, leak: 1, stealth: true },
  carrier: { name: 'Shield Carrier', hp: 380, speed: 40, r: 20, armor: 0.35, reward: 28, leak: 2, carrier: true },
  breacher: { name: 'EMP Breacher', hp: 80, speed: 92, r: 12, armor: 0, reward: 9, leak: 1, breacher: true },
  boss: { name: 'Boss', hp: 1900, speed: 34, r: 28, armor: 0.25, reward: 140, leak: 8 }
};
const hpScale = n => 1 + 0.2 * (n - 1) + 0.014 * (n - 1) * (n - 1);
const WIN_WAVE = 20;

function buildSpawns(n) {
  const ev = [], add = (t, type) => ev.push({ t, type });
  const scouts = n === 1 ? 8 : 6 + Math.floor(n * 1.2);
  const sg = Math.max(0.24, 0.7 - n * 0.016);
  for (let i = 0; i < scouts; i++) add(i * sg, 'scout');
  if (n >= 3 && n % 2 === 1) {
    const per = 8 + (n % 5), cl = 1 + Math.floor(n / 8);
    for (let k = 0; k < cl; k++) for (let i = 0; i < per; i++) add(2.5 + k * 5 + i * 0.06, 'swarm');
  }
  if (n >= 4) { const b = 1 + Math.floor((n - 4) / 2); for (let i = 0; i < b; i++) add(1.5 + i * 1.8, 'brute'); }
  if (n >= 6) { const h = 1 + Math.floor((n - 6) / 4); for (let i = 0; i < h; i++) add(3 + i * 2.6, 'healer'); }
  if (n >= 7) { const st = 1 + Math.floor((n - 7) / 3); for (let i = 0; i < st; i++) add(4 + i * 2.2, 'stealth'); }
  if (n >= 9) { const cr = 1 + Math.floor((n - 9) / 5); for (let i = 0; i < cr; i++) add(5 + i * 4.5, 'carrier'); }
  if (n >= 11) { const br = 1 + Math.floor((n - 11) / 4); for (let i = 0; i < br; i++) add(2 + i * 3.2, 'breacher'); }
  if (n % 5 === 0) { const bc = 1 + Math.floor(n / 20); for (let i = 0; i < bc; i++) add(6 + i * 9, 'boss'); }
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
