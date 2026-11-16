'use strict';
/* Path, tower/enemy definitions and wave generator */

/* ============================================================
   PATH
   ============================================================ */
/* ============================================================
   MAP SECTORS & EXPEDITIONS (7 DISTINCT BIOMES)
   ============================================================ */
const MAP_SECTORS = {
  foundry: {
    id: 'foundry',
    num: '01',
    name: 'The Iron Foundry',
    shortName: 'FOUNDRY',
    subtitle: 'Industrial Smelting Facility',
    biome: 'Basalt Magma & Smelting Vents',
    color: '#f97316',
    border: '#c2410c',
    bg: '#171d1b',
    topology: 'Serpentine Gauntlet (Narrow Funnel)',
    hazardDesc: 'High-Pressure Fuel Cells (450 AoE + 100% Armor Shred)',
    climateDesc: 'Heat Vents: Periodic lava bursts ignite hostiles with Thermite Burn.',
    wp0: [[0, 1], [5, 1], [5, 4], [2, 4], [2, 7], [8, 7], [8, 3], [11, 3], [11, 8], [14, 8], [14, 2], [15, 2]],
    wp1: [[7, 0], [7, 1], [11, 1], [11, 3], [11, 8], [14, 8], [14, 2], [15, 2]],
    start0: { x: -TILE * 0.6, y: 1 * TILE + TILE / 2 },
    start1: { x: 7 * TILE + TILE / 2, y: -TILE * 0.6 },
    base: { x: 15 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 },
    leylines: {
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 6, r: 2, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 10, r: 5, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 7, r: 5, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' }
    },
    hazards: [
      { id: 1, type: 'fuel_cell', name: 'FUEL CELL', color: '#f97316', c: 6, row: 3, r: 16, hp: 60, dead: false },
      { id: 2, type: 'fuel_cell', name: 'FUEL CELL', color: '#f97316', c: 12, row: 7, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [27, 35, 32],
      road: [42, 47, 51],
      curb: '#566068',
      lane: 'rgba(226,167,46,0.5)',
      accent: '#f97316'
    }
  },
  abyss: {
    id: 'abyss',
    num: '02',
    name: 'Sub-Zero Abyss',
    shortName: 'ABYSS',
    subtitle: 'Cryogenic Permafrost Trench',
    biome: 'Glacial Permafrost & Ice Rift',
    color: '#38bdf8',
    border: '#0284c7',
    bg: '#0c1a24',
    topology: 'Dual-Front Convergence (West & North Entries)',
    hazardDesc: 'Cryo Nitrogen Tanks (Instant 4.0s AoE Freeze)',
    climateDesc: 'Frozen Slipstream: +15% enemy speed, but +50% Brittle/Shatter damage taken.',
    wp0: [[0, 2], [4, 2], [4, 5], [8, 5], [11, 5], [11, 2], [14, 2], [15, 2]],
    wp1: [[8, 0], [8, 3], [6, 3], [6, 5], [8, 5], [11, 5], [11, 2], [14, 2], [15, 2]],
    start0: { x: -TILE * 0.6, y: 2 * TILE + TILE / 2 },
    start1: { x: 8 * TILE + TILE / 2, y: -TILE * 0.6 },
    base: { x: 15 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 },
    leylines: {
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 8, r: 4, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 5, r: 2, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 10, r: 3, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' }
    },
    hazards: [
      { id: 1, type: 'cryo_tank', name: 'CRYO NITROGEN TANK', color: '#38bdf8', c: 7, row: 4, r: 16, hp: 60, dead: false },
      { id: 2, type: 'cryo_tank', name: 'CRYO NITROGEN TANK', color: '#38bdf8', c: 10, row: 4, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [15, 28, 42],
      road: [28, 45, 65],
      curb: '#7dd3fc',
      lane: 'rgba(56,189,248,0.6)',
      accent: '#38bdf8'
    }
  },
  quarantine: {
    id: 'quarantine',
    num: '03',
    name: 'Toxic Bio-Quarantine',
    shortName: 'QUARANTINE',
    subtitle: 'Contaminated Biochemical Vault',
    biome: 'Acidic Sludge & Fungal Spores',
    color: '#a3e635',
    border: '#65a30d',
    bg: '#181220',
    topology: 'The Split Switchback (Parit Zig-Zag & Bio-Flank)',
    hazardDesc: 'Unstable Spore Pods (2.5s Hostile Reverse Confusion + Acid)',
    climateDesc: 'Corrosive Acid Runoffs: Hostiles continuously lose 15% armor/sec in sludge.',
    wp0: [[0, 7], [3, 7], [3, 1], [7, 1], [7, 8], [11, 8], [11, 2], [14, 2], [14, 7], [15, 7]],
    wp1: [[3, 4], [7, 4], [11, 4], [14, 4], [14, 7], [15, 7]],
    start0: { x: -TILE * 0.6, y: 7 * TILE + TILE / 2 },
    start1: { x: -TILE * 0.6, y: 4 * TILE + TILE / 2 },
    base: { x: 15 * TILE + TILE / 2, y: 7 * TILE + TILE / 2 },
    leylines: {
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 5, r: 3, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' },
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 9, r: 5, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 12, r: 5, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' }
    },
    hazards: [
      { id: 1, type: 'spore_pod', name: 'SPORE POD', color: '#a3e635', c: 5, row: 5, r: 16, hp: 60, dead: false },
      { id: 2, type: 'spore_pod', name: 'SPORE POD', color: '#a3e635', c: 12, row: 6, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [26, 20, 34],
      road: [38, 32, 46],
      curb: '#4d7c0f',
      lane: 'rgba(163,230,53,0.6)',
      accent: '#a3e635'
    }
  },
  skyspire: {
    id: 'skyspire',
    num: '04',
    name: 'Orbital Sky-Spire',
    shortName: 'SKY-SPIRE',
    subtitle: 'High-Orbit Citadel Platform',
    biome: 'Deep Space Void & Titanium Hex',
    color: '#818cf8',
    border: '#4f46e5',
    bg: '#080b14',
    topology: 'Concentric Spiral (Pusaran Luar Menuju Inti Pusat)',
    hazardDesc: 'Overcharged Tesla Pylons (350 Chain AoE + Shield Drain)',
    climateDesc: 'Void Gravity: Heavy kinetic & railgun hits have 20% chance to blast hostiles off edge.',
    wp0: [[0, 1], [14, 1], [14, 8], [1, 8], [1, 3], [12, 3], [12, 6], [4, 6], [4, 4], [8, 4]],
    wp1: [[8, 9], [8, 6], [4, 6], [4, 4], [8, 4]],
    start0: { x: -TILE * 0.6, y: 1 * TILE + TILE / 2 },
    start1: { x: 8 * TILE + TILE / 2, y: H + TILE * 0.6 },
    base: { x: 8 * TILE + TILE / 2, y: 4 * TILE + TILE / 2 },
    leylines: {
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 7, r: 2, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 9, r: 2, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' },
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 7, r: 5, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' }
    },
    hazards: [
      { id: 1, type: 'tesla_pylon', name: 'TESLA PYLON', color: '#facc15', c: 6, row: 2, r: 16, hp: 60, dead: false },
      { id: 2, type: 'tesla_pylon', name: 'TESLA PYLON', color: '#facc15', c: 10, row: 5, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [20, 24, 38],
      road: [35, 40, 60],
      curb: '#6366f1',
      lane: 'rgba(129,140,248,0.6)',
      accent: '#818cf8'
    }
  },
  dunes: {
    id: 'dunes',
    num: '05',
    name: 'Sunken Dunes',
    shortName: 'DUNES',
    subtitle: 'Ancient Monolith Canyon',
    biome: 'Golden Desert Sands & Sandstone Ruins',
    color: '#eab308',
    border: '#ca8a04',
    bg: '#251c12',
    topology: 'Canyon Double-Fork (Split Around Sunken Relic)',
    hazardDesc: 'Relic Sun Monoliths (Concentrated 400 Solar Ray Beam)',
    climateDesc: 'Quicksand Drift: Enemies slowed 20% on sand; dust cuts tower range 10% unless on Sensor.',
    wp0: [[0, 4], [3, 4], [3, 7], [7, 7], [7, 8], [11, 8], [11, 5], [14, 5], [15, 5]],
    wp1: [[0, 4], [3, 4], [3, 1], [8, 1], [8, 3], [11, 3], [11, 5], [14, 5], [15, 5]],
    start0: { x: -TILE * 0.6, y: 4 * TILE + TILE / 2 },
    start1: { x: -TILE * 0.6, y: 4 * TILE + TILE / 2 },
    base: { x: 15 * TILE + TILE / 2, y: 5 * TILE + TILE / 2 },
    leylines: {
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 5, r: 2, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 9, r: 6, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 5, r: 6, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' }
    },
    hazards: [
      { id: 1, type: 'sun_monolith', name: 'SUN MONOLITH', color: '#fbbf24', c: 6, row: 4, r: 16, hp: 60, dead: false },
      { id: 2, type: 'sun_monolith', name: 'SUN MONOLITH', color: '#fbbf24', c: 10, row: 6, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [48, 38, 24],
      road: [62, 48, 32],
      curb: '#a16207',
      lane: 'rgba(234,179,8,0.6)',
      accent: '#eab308'
    }
  },
  metropolis: {
    id: 'metropolis',
    num: '06',
    name: 'Neon Cyber-Metropolis',
    shortName: 'METROPOLIS',
    subtitle: 'Sector 07 Data Haven Highway',
    biome: 'Cyberpunk Skyway & Neon Grid',
    color: '#06b6d4',
    border: '#0891b2',
    bg: '#0e131d',
    topology: 'Multi-Lane Skyway & Express Overpass',
    hazardDesc: 'EMP Security Terminals (3.5s Stun + Total Shield Strip)',
    climateDesc: 'Overclocked Grid: +15 MW Grid Power capacity, Commander Skills charge +15% faster.',
    wp0: [[0, 2], [6, 2], [6, 6], [2, 6], [2, 8], [13, 8], [13, 5], [9, 5], [9, 2], [15, 2]],
    wp1: [[0, 2], [6, 2], [9, 2], [15, 2]],
    start0: { x: -TILE * 0.6, y: 2 * TILE + TILE / 2 },
    start1: { x: -TILE * 0.6, y: 2 * TILE + TILE / 2 },
    base: { x: 15 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 },
    leylines: {
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 7, r: 4, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 11, r: 4, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 4, r: 4, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' }
    },
    hazards: [
      { id: 1, type: 'emp_terminal', name: 'EMP TERMINAL', color: '#22d3ee', c: 4, row: 3, r: 16, hp: 60, dead: false },
      { id: 2, type: 'emp_terminal', name: 'EMP TERMINAL', color: '#22d3ee', c: 11, row: 6, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [16, 20, 28],
      road: [24, 28, 38],
      curb: '#06b6d4',
      lane: 'rgba(34,211,238,0.7)',
      accent: '#06b6d4'
    }
  },
  abyssal: {
    id: 'abyssal',
    num: '07',
    name: 'Abyssal Trench',
    shortName: 'ABYSSAL',
    subtitle: 'Deep Oceanic Geothermal Rift',
    biome: 'Bioluminescent Abyss & Thermal Reef',
    color: '#2dd4bf',
    border: '#0d9488',
    bg: '#08141e',
    topology: 'Submerged Trench Chasm (Aquatic Labyrinth)',
    hazardDesc: 'Hydrothermal Geysers (300 Dmg + 2.0s Knockup + Slow Puddles)',
    climateDesc: 'Depth Pressure: Enemies +10% base armor; Tesla jumps +2 targets and deals +25% dmg.',
    wp0: [[0, 5], [3, 5], [3, 1], [7, 1], [7, 7], [11, 7], [11, 3], [14, 3], [14, 6], [15, 6]],
    wp1: [[0, 5], [5, 5], [5, 8], [11, 8], [11, 3], [14, 3], [14, 6], [15, 6]],
    start0: { x: -TILE * 0.6, y: 5 * TILE + TILE / 2 },
    start1: { x: -TILE * 0.6, y: 5 * TILE + TILE / 2 },
    base: { x: 15 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 },
    leylines: {
      catalyst: { id: 'catalyst', name: 'Catalyst Node', c: 9, r: 4, color: '#c084fc', aura: 'rgba(192,132,252,0.22)', desc: '+50% debuff potency and doubled effect durations.' },
      sensor: { id: 'sensor', name: 'Sensor Relay', c: 12, r: 4, color: '#38bdf8', aura: 'rgba(56,189,248,0.22)', desc: '+2.5 Range and permanent Stealth true-sight.' },
      accelerator: { id: 'accelerator', name: 'Hyper-Accelerator', c: 4, r: 3, color: '#fbbf24', aura: 'rgba(251,191,36,0.22)', desc: '+45% Attack Speed to tower deployed here.' }
    },
    hazards: [
      { id: 1, type: 'hydro_geyser', name: 'HYDRO GEYSER', color: '#2dd4bf', c: 5, row: 3, r: 16, hp: 60, dead: false },
      { id: 2, type: 'hydro_geyser', name: 'HYDRO GEYSER', color: '#2dd4bf', c: 9, row: 5, r: 16, hp: 60, dead: false }
    ],
    palette: {
      ground: [10, 22, 32],
      road: [18, 34, 46],
      curb: '#0d9488',
      lane: 'rgba(45,212,191,0.6)',
      accent: '#2dd4bf'
    }
  }
};

const pathTile = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
let WP_TILES = [];
const PATH = [];
const SEG = [];
let PLEN = 0;
let WP_BREACH = [];
const PATH_BREACH = [];
const SEG_BREACH = [];
let PLEN_BREACH = 0;
const BASE_PT = { x: 0, y: 0 };
const SPAWN_PT = { x: 0, y: 0 };
const LEYLINE_NODES = {};

function loadSector(sectorId) {
  const sec = MAP_SECTORS[sectorId] || MAP_SECTORS.foundry;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) pathTile[r][c] = false;

  WP_TILES = sec.wp0;
  PATH.length = 0;
  PATH.push(sec.start0);
  for (const [c, r] of WP_TILES) PATH.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
  for (let i = 0; i < WP_TILES.length - 1; i++) {
    const [c1, r1] = WP_TILES[i], [c2, r2] = WP_TILES[i + 1];
    const dc = Math.sign(c2 - c1), dr = Math.sign(r2 - r1);
    let c = c1, r = r1; pathTile[r][c] = true;
    while (c !== c2 || r !== r2) { c += dc; r += dr; pathTile[r][c] = true; }
  }
  SEG.length = 0; PLEN = 0;
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
    SEG.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len, start: PLEN, ang: Math.atan2(b.y - a.y, b.x - a.x) });
    PLEN += len;
  }

  WP_BREACH = sec.wp1 || [];
  PATH_BREACH.length = 0;
  SEG_BREACH.length = 0;
  PLEN_BREACH = 0;
  if (WP_BREACH.length > 0) {
    PATH_BREACH.push(sec.start1);
    for (const [c, r] of WP_BREACH) PATH_BREACH.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
    for (let i = 0; i < WP_BREACH.length - 1; i++) {
      const [c1, r1] = WP_BREACH[i], [c2, r2] = WP_BREACH[i + 1];
      const dc = Math.sign(c2 - c1), dr = Math.sign(r2 - r1);
      let c = c1, r = r1; pathTile[r][c] = true;
      while (c !== c2 || r !== r2) { c += dc; r += dr; pathTile[r][c] = true; }
    }
    for (let i = 0; i < PATH_BREACH.length - 1; i++) {
      const a = PATH_BREACH[i], b = PATH_BREACH[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
      SEG_BREACH.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len, start: PLEN_BREACH, ang: Math.atan2(b.y - a.y, b.x - a.x) });
      PLEN_BREACH += len;
    }
  }

  BASE_PT.x = sec.base.x; BASE_PT.y = sec.base.y;
  SPAWN_PT.x = sec.start0.x <= 0 ? TILE * 0.5 : sec.start0.x;
  SPAWN_PT.y = sec.start0.y <= 0 ? TILE * 0.5 : sec.start0.y;

  for (const k in LEYLINE_NODES) delete LEYLINE_NODES[k];
  Object.assign(LEYLINE_NODES, sec.leylines);
}

loadSector('foundry');

function posAt(d, hint, pathId) {
  const segs = (pathId === 1 && SEG_BREACH.length > 0) ? SEG_BREACH : SEG;
  let i = hint || 0; if (d < 0) d = 0;
  while (i < segs.length - 1 && d >= segs[i].start + segs[i].len) i++;
  const s = segs[i], t = clamp((d - s.start) / s.len, 0, 1);
  return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t, ang: s.ang, seg: i };
}

/* ============================================================
   DEFINITIONS
   ============================================================ */
const TD = {
  gatling: {
    id: 'gatling', name: 'Gatling Turret', color: '#22d3ee', cost: 50, key: '1', role: 'Rapid fire / Physical', power: [2, 3, 4],
    tip: 'Cheap, relentless single-target fire. Armor blunts physical damage, pair with Plasma (shreds armor) and Cryo (brittle = +damage taken).',
    tiers: [
      { dmg: 8, rate: 6, range: 2.8, upg: 0, power: 2 },
      { dmg: 14, rate: 8.5, range: 3.1, upg: 65, power: 3 }
    ],
    branches: {
      A: { branch: 'A', name: 'Overdrive Minigun', role: 'Accelerating Fire', color: '#38bdf8', dmg: 16, rate: 11, maxRate: 22, range: 3.3, upg: 135, power: 4, tip: 'Heat ramps rate up to 22/s on focused targets.' },
      B: { branch: 'B', name: 'Flak Cannon', role: 'Burst Shrapnel AoE', color: '#0ea5e9', dmg: 36, rate: 3.2, range: 3.5, flakRadius: 1.3, shrapnel: 4, upg: 135, power: 4, tip: 'Proximity flak bursts tear into clusters of light enemies.' }
    }
  },
  plasma: {
    id: 'plasma', name: 'Plasma Cannon', color: '#fb923c', cost: 110, key: '2', role: 'Splash / Armor shred', power: [5, 7, 9],
    tip: 'Slow AoE shells ignore armor and permanently shred it, so Gatlings and Railguns hit Brutes far harder afterward. Crushes Swarms.',
    tiers: [
      { dmg: 42, rate: 0.8, range: 2.7, splash: 1.1, shred: 0.12, upg: 0, power: 5 },
      { dmg: 75, rate: 0.9, range: 3.0, splash: 1.3, shred: 0.18, upg: 100, power: 7 }
    ],
    branches: {
      A: { branch: 'A', name: 'Nova Mortar', role: 'Nuclear Radiation', color: '#f97316', dmg: 140, rate: 0.55, range: 3.6, splash: 1.7, shred: 0.25, radDur: 4.5, radDps: 26, upg: 185, power: 9, tip: 'Nuclear blast leaves radioactive pool burning and shredding enemies.' },
      B: { branch: 'B', name: 'Acid Melter', role: 'Corrosive Beam', color: '#ea580c', dmg: 20, rate: 4.5, range: 3.2, splash: 0.7, shred: 0.35, acidAmp: 0.25, upg: 175, power: 9, tip: 'Rapid acid spray melts armor to 0 and amplifies all damage taken.' }
    }
  },
  cryo: {
    id: 'cryo', name: 'Cryo Emitter', color: '#60a5fa', cost: 80, key: '3', role: 'Slow / Brittle', power: [4, 5, 7],
    tip: 'Pulses slow enemies 40% and make them brittle (+20% damage from everything). Tier III pulses periodically freeze enemies (bosses are immune).',
    tiers: [
      { dmg: 3, rate: 0.8, range: 2.4, slow: 0.4, brittle: 0.2, freeze: 0, upg: 0, power: 4 },
      { dmg: 6, rate: 1.0, range: 2.7, slow: 0.45, brittle: 0.25, freeze: 0, upg: 75, power: 5 }
    ],
    branches: {
      A: { branch: 'A', name: 'Absolute Zero', role: 'Deep Freeze Shatter', color: '#93c5fd', dmg: 14, rate: 0.75, range: 3.1, slow: 0.55, brittle: 0.35, freezeDur: 2.2, shatter: true, upg: 140, power: 7, tip: 'Radial blast freezes all targets solid. Frozen units shatter on death.' },
      B: { branch: 'B', name: 'Vortex Siphon', role: 'Gravity Anomaly', color: '#3b82f6', dmg: 16, rate: 1.3, range: 2.9, slow: 0.45, brittle: 0.25, pullDist: 26, upg: 140, power: 7, tip: 'Gravitational pulse pulls enemies backwards toward the center.' }
    }
  },
  tesla: {
    id: 'tesla', name: 'Tesla Coil', color: '#facc15', cost: 130, key: '4', role: 'Chain lightning / Energy', power: [6, 8, 10],
    tip: 'Lightning chains across up to 4 enemies. Energy damage ignores armor and deals bonus damage to shields, the answer to shielded waves and bosses.',
    tiers: [
      { dmg: 16, rate: 1.4, range: 2.5, targets: 2, sm: 1.75, upg: 0, power: 6 },
      { dmg: 28, rate: 1.6, range: 2.8, targets: 3, sm: 2.0, upg: 110, power: 8 }
    ],
    branches: {
      A: { branch: 'A', name: 'Grid Overcharger', role: 'Pylon Buff Conduit', color: '#eab308', dmg: 38, rate: 1.8, range: 3.2, targets: 4, sm: 2.2, buffAura: 0.35, upg: 195, power: 10, tip: 'Chains lightning and grants +35% attack speed to adjacent friendly towers.' },
      B: { branch: 'B', name: 'EMP Disrupter', role: 'Shield Stripper / Stun', color: '#ca8a04', dmg: 52, rate: 1.25, range: 3.0, targets: 3, sm: 3.5, empStun: 1.6, stripShield: true, upg: 195, power: 10, tip: 'Instantly overloads enemy shields and disables healer/boss abilities.' }
    }
  },
  rail: {
    id: 'rail', name: 'Railgun Sniper', color: '#e11d48', cost: 180, key: '5', role: 'Pierce / Crit / Long range', power: [8, 11, 14],
    tip: 'Enormous range and critical hits; the slug pierces every enemy in a straight line. Place it on long straights to rake whole columns of Brutes.',
    tiers: [
      { dmg: 100, rate: 0.4, range: 5.5, crit: 0.2, cm: 2.5, pierce: 3, upg: 0, power: 8 },
      { dmg: 180, rate: 0.45, range: 6.5, crit: 0.25, cm: 2.5, pierce: 5, upg: 155, power: 11 }
    ],
    branches: {
      A: { branch: 'A', name: 'Orbital Lance', role: 'Continuous Thermal Beam', color: '#f43f5e', dmg: 95, rate: 3.0, range: 8.0, pierce: 99, beam: true, crit: 0.2, cm: 2.0, upg: 270, power: 14, tip: 'Sustained thermal laser cuts through entire columns continuously.' },
      B: { branch: 'B', name: 'Executioner', role: 'Anti-Boss Heavy Slug', color: '#be123c', dmg: 360, rate: 0.35, range: 8.5, crit: 0.35, cm: 3.5, pierce: 4, execThresh: 0.18, upg: 270, power: 14, tip: 'Hyper-kinetic round executes non-boss enemies under 18% HP instantly.' }
    }
  },
  relay: {
    id: 'relay', name: 'Fission Relay', color: '#10b981', cost: 90, key: '6', role: 'Infrastructure / +25 MW', power: [0, 0, 0],
    tip: 'Auxiliary fission sub-reactor providing +25 MW to the grid. Click an active relay to trigger Sector Overdrive (+75% Fire Rate nearby).',
    tiers: [
      { dmg: 0, rate: 0, range: 2.2, upg: 0, powerSupply: 25, power: 0 },
      { dmg: 0, rate: 0, range: 2.5, upg: 80, powerSupply: 40, power: 0 }
    ],
    branches: {
      A: { branch: 'A', name: 'Fusion Reactor', role: '+60 MW Clean Power', color: '#059669', dmg: 0, rate: 0, range: 2.8, upg: 140, powerSupply: 60, power: 0, tip: 'Advanced fusion core providing massive clean power (+60 MW capacity).' },
      B: { branch: 'B', name: 'Overcharge Pylon', role: 'Surge Emitter / +35 MW', color: '#34d399', dmg: 0, rate: 0, range: 3.0, upg: 140, powerSupply: 35, power: 0, overdriveBoost: 1.0, tip: 'Amplifies Sector Overdrive to +100% Fire Rate for nearby defenses.' }
    }
  }
};
// Backward compatibility fallback for tier 2
for (const k of Object.keys(TD)) TD[k].tiers[2] = TD[k].branches.A;

function getTierData(t) {
  const def = TD[t.type];
  if (!def) return { dmg: 0, rate: 0, range: 2.5 };
  if (t.branch && def.branches[t.branch]) return def.branches[t.branch];
  return def.tiers[t.tier] || def.tiers[0];
}

const TKEYS = ['gatling', 'plasma', 'cryo', 'tesla', 'rail', 'relay'];
const PRIOS = [['first', 'First'], ['last', 'Last'], ['strongest', 'Strongest'], ['weakest', 'Weakest']];

/* ============================================================
   ELEMENTAL REACTION MATRIX (Fase 1)
   ============================================================ */
const ELEMENTAL_REACTIONS = {
  thermal_shock: {
    id: 'thermal_shock', name: 'Thermal Shockwave', combo: 'Cryo + Plasma', color: '#38bdf8',
    desc: 'Instant 250% AoE steam burst that permanently shatters 50% enemy armor.'
  },
  electrolytic: {
    id: 'electrolytic', name: 'Electrolytic Detonation', combo: 'Acid + Tesla', color: '#a3e635',
    desc: 'Lightning violently discharges through all acid-coated units without target cap.'
  },
  thermite: {
    id: 'thermite', name: 'Thermite Incineration', combo: 'Bleed + Radiation', color: '#f97316',
    desc: 'Ignites open physical wounds with radiation, dealing 3.5% Max HP/sec.'
  },
  superconductor: {
    id: 'superconductor', name: 'Superconductor Surge', combo: 'Cryo + Tesla', color: '#fde047',
    desc: 'Electrifying chilled targets triggers an automatic Critical Strike and prolongs stun.'
  }
};

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

const COMMANDER_DOCTRINES = {
  vanguard: {
    id: 'vanguard',
    name: 'Siege Vanguard',
    tag: 'BALLISTICS & EXPLOSIVES',
    color: '#f97316',
    desc: 'Spesialis senjata kinetik berat, fragmentasi pecahan peluru, dan artileri pemusnah.',
    passiveName: 'Shrapnel Cascade',
    passiveDesc: 'Serangan kritis fisik (Gatling/Railgun) memicu serpihan fragmentasi ke musuh di sekitarnya.',
    skills: ['orbital', 'minefield', 'sabot_rounds', 'carpet_bomb']
  },
  architect: {
    id: 'architect',
    name: 'Quantum Architect',
    tag: 'ENERGY & GRID SYNERGY',
    color: '#38bdf8',
    desc: 'Spesialis manipulasi medan energi, sinergi listrik reaktor, dan relokasi menara seketika.',
    passiveName: 'Superconductive Conduit',
    passiveDesc: 'Seluruh menara energi saling terhubung; Reaksi Elemen menghasilkan +40% kerusakan.',
    skills: ['swap_towers', 'overcharge', 'cryo_singularity', 'emp_nuke']
  },
  infiltrator: {
    id: 'infiltrator',
    name: 'Spec-Ops Infiltrator',
    tag: 'TACTICS, SABOTAGE & ECO',
    color: '#a855f7',
    desc: 'Spesialis pengacau taktis, umpan hologram, peretasan musuh, dan pencairan pasar gelap.',
    passiveName: 'Counter-Measures',
    passiveDesc: 'Musuh siluman menerima 2.5x kerusakan saat diungkap. Kebocoran pertama di setiap wave dinetralkan drone pangkalan.',
    skills: ['holo_beacon', 'cyber_hijack', 'caltrops', 'liquidation']
  }
};

const COMMANDER_SKILLS = {
  // Vanguard skills
  orbital: { id: 'orbital', name: 'Orbital Strike', key: 'Q', cd: 32, icon: 'target', desc: 'Dentuman meteor kinetik berdaya hancur tinggi dan mengungkap musuh siluman.' },
  minefield: { id: 'minefield', name: 'Proximity Minefield', key: 'W', cd: 28, icon: 'spark', desc: 'Menebar 6 ranjau ledak di jalur tempur (180 damage fisik + 35% slow).' },
  sabot_rounds: { id: 'sabot_rounds', name: 'AP Sabot Rounds', key: 'E', cd: 24, icon: 'target', desc: 'Menara fisik mengabaikan 75% armor musuh dan memperoleh +25% crit selama 6s.' },
  carpet_bomb: { id: 'carpet_bomb', name: 'Carpet Bombing', key: 'R', cd: 50, icon: 'flag', desc: '5 pengeboman udara berturut-turut di sepanjang jalur lintasan utama (300 dmg tiap ledakan).' },
  // Architect skills
  swap_towers: { id: 'swap_towers', name: 'Spatial Shift', key: 'Q', cd: 14, icon: 'redo', desc: 'Menukar seketika posisi 2 menara kawan tanpa biaya jual/beli.' },
  overcharge: { id: 'overcharge', name: 'Overcharge Surge', key: 'W', cd: 22, icon: 'ff', desc: 'Supercharge menara terpilih selama 8 detik (+120% attack rate, +20% jangkauan).' },
  cryo_singularity: { id: 'cryo_singularity', name: 'Cryo Singularity', key: 'E', cd: 32, icon: 'spark', desc: 'Pusaran lubang es menarik seluruh musuh dalam radius 120px dan membekukan selama 3 detik.' },
  emp_nuke: { id: 'emp_nuke', name: 'Tactical EMP Nuke', key: 'R', cd: 40, icon: 'spark', desc: 'Gelombang EMP global: menghapus perisai dan melumpuhkan sirkuit semua musuh selama 3.5 detik.' },
  // Infiltrator skills
  holo_beacon: { id: 'holo_beacon', name: 'Decoy Holo-Beacon', key: 'Q', cd: 30, icon: 'shield', desc: 'Umpan holografis (400 HP). Musuh berhenti maju dan memukuli umpan selama 5 detik.' },
  cyber_hijack: { id: 'cyber_hijack', name: 'Cyber-Hijack', key: 'W', cd: 26, icon: 'spark', desc: 'Meretas 1 musuh non-boss menjadi kawan selama 6s untuk menembaki kawanannya.' },
  caltrops: { id: 'caltrops', name: 'Nanite Caltrops', key: 'E', cd: 18, icon: 'shield', desc: 'Menebar kawat duri nanit di jalan (memperlambat 60% dan merontokkan armor).' },
  liquidation: { id: 'liquidation', name: 'Market Liquidation', key: 'R', cd: 45, icon: 'coin', desc: 'Cairkan 25% investasi menara jadi emas instan + 100% peluang crit menara selama 8s.' }
};

/* ============================================================
   MODULAR CHIPS (FASE 3)
   ============================================================ */
const MODULAR_CHIPS = {
  prism_refractor: {
    id: 'prism_refractor',
    name: 'Prism Refractor',
    target: 'rail',
    icon: 'spark',
    color: '#e0e7ff',
    desc: 'Tembakan laser Railgun terbias jadi 3 cabang saat mengenai musuh berstatus beku atau memiliki perisai.'
  },
  cryo_igniter: {
    id: 'cryo_igniter',
    name: 'Cryo-Igniter Core',
    target: 'plasma',
    icon: 'spark',
    color: '#93c5fd',
    desc: 'Ledakan Plasma meninggalkan tanah es-api: menerapkan Slow 40% sekaligus Thermite Burn (3.5% Max HP/s).'
  },
  vampiric_siphon: {
    id: 'vampiric_siphon',
    name: 'Vampiric Siphon',
    target: 'gatling',
    icon: 'coin',
    color: '#fbbf24',
    desc: 'Setiap 8 musuh yang ditumbangkan oleh menara ini menyetor +1 Gold langsung ke kas markas.'
  },
  arc_resonance: {
    id: 'arc_resonance',
    name: 'Arc Resonance',
    target: 'tesla',
    icon: 'bolt',
    color: '#a855f7',
    desc: 'Pantulan petir Tesla antar menara kawan memantul ke musuh dengan +50% bonus kerusakan.'
  },
  executioner_nanites: {
    id: 'executioner_nanites',
    name: 'Executioner Nanites',
    target: 'any',
    icon: 'target',
    color: '#f43f5e',
    desc: 'Peluang 8% untuk langsung mengeksekusi musuh non-boss yang memiliki sisa HP di bawah 30%.'
  },
  feedback_chrono: {
    id: 'feedback_chrono',
    name: 'Feedback Chrono',
    target: 'any',
    icon: 'ff',
    color: '#34d399',
    desc: 'Setiap kali menara memicu Reaksi Elemen, cooldown seluruh skill Komandan terpotong 0.5 detik.'
  }
};

/* ============================================================
   LIVING HIVE MUTATIONS (FASE 3)
   ============================================================ */
const HIVE_MUTATIONS = {
  chitin: {
    id: 'chitin',
    name: 'Chitin Armor Plating',
    desc: 'Musuh melahirkan cangkang kitin tebal yang kebal dari 4 peluru balistik pertama.',
    badge: 'CHITIN PLATING',
    color: '#fb7185'
  },
  insulation: {
    id: 'insulation',
    name: 'Cryo-Thermal Insulation',
    desc: 'Efek Cryo memicu lonjakan adrenalin musuh (+25% speed 1.5s) jika tidak dibekukan total.',
    badge: 'CRYO INSULATION',
    color: '#38bdf8'
  },
  rubber: {
    id: 'rubber',
    name: 'Grounding Rubber Hulls',
    desc: 'Tubuh musuh dilapisi karet penangkal listrik; pantulan petir Tesla dibatasi maksimal 1 kali.',
    badge: 'GROUNDED HULLS',
    color: '#fbbf24'
  },
  scrambler: {
    id: 'scrambler',
    name: 'Scrambler Drones',
    desc: 'Drone pengacau frekuensi udara memperlambat pemulihan cooldown skill Komandan sebesar -30%.',
    badge: 'SCRAMBLER DRONES',
    color: '#c084fc'
  }
};

/* ============================================================
   NAMED TITAN BOSSES (FASE 4)
   ============================================================ */
const TITAN_BOSSES = {
  goliath: {
    id: 'goliath',
    name: 'Goliath Excavator',
    wave: 10,
    hpMult: 4.5,
    armor: 0.55,
    speed: 18,
    color: '#f59e0b',
    desc: 'Titan bor tektonik baja berat. Pada 50% HP melancarkan Tectonic Drill yang melumpuhkan 2 menara terdekat selama 6 detik.'
  },
  chronoweaver: {
    id: 'chronoweaver',
    name: 'Chrono-Weaver',
    wave: 15,
    hpMult: 4.0,
    shieldPct: 0.35,
    speed: 22,
    color: '#38bdf8',
    desc: 'Master manipulasi waktu. Melompati mundur 90px saat HP turun 25%, dan membangkitkan anak buah yang gugur di dalam gelembung waktu.'
  },
  swarm_mother: {
    id: 'swarm_mother',
    name: 'Apex Swarm-Mother',
    wave: 20,
    hpMult: 5.0,
    armor: 0.30,
    speed: 20,
    color: '#ec4899',
    desc: 'Ratu biomekanik kolosal. Memuntahkan telur mikro-swarm, melepaskan drone Kamikaze udara, dan berserk saat terluka kritis.'
  }
};

/* ============================================================
   HIGH-RISK DEFENSE CONTRACTS (FASE 4)
   ============================================================ */
const DEFENSE_CONTRACTS = {
  blind_fire: {
    id: 'blind_fire',
    name: 'Operation Blind Fire',
    desc: 'Lingkaran jangkauan menara dinonaktifkan dan kecepatan game terkunci 1x.',
    rewardGold: 250,
    rewardCores: 15,
    rewardText: '+250 Gold, +15 Cores'
  },
  hyper_velocity: {
    id: 'hyper_velocity',
    name: 'Hyper-Velocity Influx',
    desc: 'Musuh bergerak +60% lebih cepat, tetapi memiliki -30% Max HP.',
    rewardChip: 'prism_refractor',
    rewardGold: 120,
    rewardText: '+1 Modular Chip, +120 Gold'
  },
  pacifist: {
    id: 'pacifist',
    name: 'Pacifist Perimeter',
    desc: 'Selesaikan wave tanpa menggunakan kemampuan komandan aktif [Q, W, E, R].',
    rewardInterest: 0.20,
    rewardText: '+20% Gold Interest Bonus'
  }
};

/* ============================================================
   WORKSHOP HQ (META-PROGRESSION - FASE 3)
   ============================================================ */
const WORKSHOP_UPGRADES = {
  treasury: {
    id: 'treasury',
    name: 'Starting Treasury',
    icon: 'coin',
    desc: 'Cadangan modal awal tambahan saat memulai setiap babak pertahanan baru.',
    maxLv: 3,
    costs: [10, 25, 45],
    effectText: lv => (lv === 0 ? '+0 Gold' : '+' + (lv * 50) + ' Gold awal')
  },
  citadel_turret: {
    id: 'citadel_turret',
    name: 'Reinforced Citadel',
    icon: 'shield',
    desc: 'Markas pusat dilengkapi meriam pertahanan otomatis saat musuh mendekati radius 2.5 tile.',
    maxLv: 2,
    costs: [20, 50],
    effectText: lv => (lv === 0 ? 'Nonaktif' : 'Meriam otomatis aktif (Lv ' + lv + ')')
  },
  logistics: {
    id: 'logistics',
    name: 'Logistics Network',
    icon: 'up',
    desc: 'Efisiensi logistik material memberikan diskon permanen untuk biaya peningkatan semua menara.',
    maxLv: 2,
    costs: [15, 35],
    effectText: lv => (lv === 0 ? '0% Diskon' : lv === 1 ? '-10% Biaya Upgrade' : '-18% Biaya Upgrade')
  },
  command_protocol: {
    id: 'command_protocol',
    name: 'Command Protocol [R]',
    icon: 'spark',
    desc: 'Membuka slot kemampuan taktis keempat [R]: Tactical EMP Nuke untuk situasi darurat.',
    maxLv: 1,
    costs: [30],
    effectText: lv => (lv === 0 ? 'Terkunci' : 'Skill [R] Tactical EMP Nuke Aktif')
  }
};

/* ============================================================
   LEYLINE CONDUIT NODES (FASE 4)
   ============================================================ */
function getLeylineAt(c, r) {
  for (const k in LEYLINE_NODES) {
    const node = LEYLINE_NODES[k];
    if (node.c === c && node.r === r) return node;
  }
  return null;
}

const WAVE_MUTATORS = {
  ion_storm: { id: 'ion_storm', name: 'Ion Storm', desc: '+25% Energy Damage, -15% Ballistic Rate', cls: 'purple' },
  heavy_plating: { id: 'heavy_plating', name: 'Heavy Plating', desc: '+20% Enemy Armor', cls: 'orange' },
  frenzy: { id: 'frenzy', name: 'Frenzy Surge', desc: 'Enemies sprint below 40% HP', cls: 'orange' },
  emp_jam: { id: 'emp_jam', name: 'EMP Interference', desc: '-10% Tower Range', cls: 'purple' },
  solar_flare: { id: 'solar_flare', name: 'Solar Flare', desc: '+35% Energy Damage, -15% Tower Range', cls: 'orange' },
  nanite_plague: { id: 'nanite_plague', name: 'Nanite Plague', desc: 'Fallen hostiles release micro-swarms', cls: 'purple' },
  cryo_lockdown: { id: 'cryo_lockdown', name: 'Cryo Lockdown', desc: '-20% Enemy Speed, -20% Tower Attack Rate', cls: 'cyan' },
  overcharge_anomaly: { id: 'overcharge_anomaly', name: 'Overcharge Surge', desc: '+30% Tower Rate, +25% Enemy Speed', cls: 'yellow' }
};

/* ============================================================
   ASCENSION PROTOCOLS (FASE 5)
   ============================================================ */
const ASCENSION_MODIFIERS = [
  { level: 0, id: 'standard', name: 'Standard Mode', desc: 'Sistem pertahanan reguler tanpa protokol hukuman.', badge: 'NORMAL', color: '#94a3b8', pacts: [] },
  { level: 1, id: 'inflation', name: 'Hyper-Inflation', desc: 'Biaya logistik material meningkat: Harga menara naik +15%.', badge: 'ASC I', color: '#f59e0b', pacts: ['Harga pembangunan menara +15%'] },
  { level: 2, id: 'fragile', name: 'Fragile Perimeter', desc: 'Integritas perimeter rapuh: Nyawa awal markas hanya 12 Lives.', badge: 'ASC II', color: '#f97316', pacts: ['Harga menara +15%', 'Nyawa awal berkurang menjadi 12'] },
  { level: 3, id: 'swarm_influx', name: 'Swarm Influx', desc: 'Infestasi swarm masif: Jumlah swarm +50% dan bergerak +15% lebih cepat.', badge: 'ASC III', color: '#ef4444', pacts: ['Harga menara +15%', 'Nyawa awal 12', 'Jumlah swarm +50% & speed +15%'] },
  { level: 4, id: 'shield_protocol', name: 'Shield Protocol', desc: 'Protokol perisai pertahanan musuh: Seluruh musuh memiliki perisai 20% HP.', badge: 'ASC IV', color: '#38bdf8', pacts: ['Harga menara +15%', 'Nyawa 12', 'Swarm +50%', 'Semua musuh memiliki perisai 20% HP'] },
  { level: 5, id: 'nemesis', name: 'Nemesis Awakening', desc: 'Kebangkitan Nemesis: Boss kebal eksekusi Railgun & memanggil Champion Escort saat Berserk.', badge: 'ASC V', color: '#a855f7', pacts: ['Harga menara +15%', 'Nyawa 12', 'Swarm +50%', 'Perisai musuh 20%', 'Boss kebal eksekusi & panggil 2 Champion saat Berserk'] }
];

function getAscensionData(lv) {
  return ASCENSION_MODIFIERS[clamp(lv || 0, 0, ASCENSION_MODIFIERS.length - 1)];
}

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

/* ============================================================
   CHAMPION AFFIXES & ADAPTIVE THREAT (FASE 2)
   ============================================================ */
const CHAMPION_AFFIXES = {
  regenerator: {
    id: 'regenerator', name: 'Regenerator', color: '#22c55e', auraColor: 'rgba(34,197,94,0.3)',
    tip: 'Memulihkan 6% HP/detik jika tidak diserang selama 1.2 detik.'
  },
  phase_shifter: {
    id: 'phase_shifter', name: 'Phase-Shifter', color: '#a855f7', auraColor: 'rgba(168,85,247,0.35)',
    tip: 'Berteleportasi maju 70px saat terkena dampak kerusakan besar (>=80).'
  },
  avenger: {
    id: 'avenger', name: 'Avenger', color: '#f97316', auraColor: 'rgba(249,115,22,0.35)',
    tip: 'Kecepatan dan armor bertambah tiap kali sekutu di dekatnya gugur (maks 5x).'
  },
  dome: {
    id: 'dome', name: 'Projector Dome', color: '#38bdf8', auraColor: 'rgba(56,189,248,0.3)',
    tip: 'Memancarkan kubah penahan proyektil dan menghentikan penetrasi Railgun.'
  }
};

const THREAT_VARIANTS = {
  deflector: {
    id: 'deflector', name: 'Kinetic Deflector', color: '#94a3b8',
    tip: 'Musuh mengembangkan perisai anti-kinetik: -50% physical damage!'
  },
  thermal_juggernaut: {
    id: 'thermal_juggernaut', name: 'Thermal Juggernaut', color: '#ea580c',
    tip: 'Memancarkan gelombang panas yang mencairkan efek beku & slow sekutu sekitar!'
  },
  artillery: {
    id: 'artillery', name: 'Artillery Walker', color: '#ef4444',
    tip: 'Membombardir kluster menara terpadat dari jarak jauh dengan tembakan EMP!'
  }
};

function getThreatDirectorAnalysis() {
  if (typeof G === 'undefined' || !G.towers || G.towers.length < 3) return null;
  const towers = G.towers;
  let phys = 0, cryo = 0;
  for (const t of towers) {
    if (t.type === 'gatling' || t.type === 'rail') phys++;
    else if (t.type === 'cryo') cryo++;
  }
  const physRatio = phys / towers.length;
  const cryoRatio = cryo / towers.length;

  let maxCluster = 0;
  for (let i = 0; i < towers.length; i++) {
    let cnt = 0;
    for (let j = 0; j < towers.length; j++) {
      if ((towers[i].x - towers[j].x) ** 2 + (towers[i].y - towers[j].y) ** 2 <= (2.6 * 40) ** 2) cnt++;
    }
    if (cnt > maxCluster) maxCluster = cnt;
  }

  if (physRatio >= 0.55) return THREAT_VARIANTS.deflector;
  if (cryo >= 2 || cryoRatio >= 0.30) return THREAT_VARIANTS.thermal_juggernaut;
  if (maxCluster >= 4 && towers.length >= 4) return THREAT_VARIANTS.artillery;
  return null;
}

function buildSpawns(n) {
  const ev = [], add = (t, type) => ev.push({ t, type, affix: null, threat: null, pathId: 0 });
  const scouts = n === 1 ? 8 : 6 + Math.floor(n * 1.2);
  const sg = Math.max(0.24, 0.7 - n * 0.016);
  for (let i = 0; i < scouts; i++) add(i * sg, 'scout');
  if (n >= 3 && n % 2 === 1) {
    const ascSwarmMult = (typeof G !== 'undefined' && G && G.ascension >= 3) ? 1.5 : 1.0;
    const per = Math.round((8 + (n % 5)) * ascSwarmMult), cl = 1 + Math.floor(n / 8);
    for (let k = 0; k < cl; k++) for (let i = 0; i < per; i++) add(2.5 + k * 5 + i * 0.06, 'swarm');
  }
  if (n >= 4) { const b = 1 + Math.floor((n - 4) / 2); for (let i = 0; i < b; i++) add(1.5 + i * 1.8, 'brute'); }
  if (n >= 6) { const h = 1 + Math.floor((n - 6) / 4); for (let i = 0; i < h; i++) add(3 + i * 2.6, 'healer'); }
  if (n >= 7) { const st = 1 + Math.floor((n - 7) / 3); for (let i = 0; i < st; i++) add(4 + i * 2.2, 'stealth'); }
  if (n >= 9) { const cr = 1 + Math.floor((n - 9) / 5); for (let i = 0; i < cr; i++) add(5 + i * 4.5, 'carrier'); }
  if (n >= 11) { const br = 1 + Math.floor((n - 11) / 4); for (let i = 0; i < br; i++) add(2 + i * 3.2, 'breacher'); }
  if (n % 5 === 0) {
    const bc = 1 + Math.floor(n / 20);
    for (let i = 0; i < bc; i++) {
      const sp = { t: 6 + i * 9, type: 'boss', affix: null, threat: null, pathId: 0 };
      if (n === 10) sp.titanId = 'goliath';
      else if (n === 15) sp.titanId = 'chronoweaver';
      else if (n === 20) sp.titanId = 'swarm_mother';
      ev.push(sp);
    }
  }

  // Adaptive Threat Director
  const threat = getThreatDirectorAnalysis();
  if (n >= 5 && threat) {
    let applied = 0;
    for (let i = 0; i < ev.length; i++) {
      if (ev[i].type !== 'swarm' && ev[i].type !== 'boss') {
        ev[i].threat = threat.id;
        applied++;
        if (applied >= (threat.id === 'deflector' ? 3 : 1)) break;
      }
    }
  }

  // Elite Champion Affixes (wave >= 6, ~25% chance for non-swarm, non-boss)
  if (n >= 6) {
    const affixKeys = Object.keys(CHAMPION_AFFIXES);
    for (let i = 0; i < ev.length; i++) {
      const item = ev[i];
      if (item.type !== 'swarm' && item.type !== 'boss') {
        const hash = ((n * 137 + i * 43) % 100);
        if (hash < 25) {
          const affixIndex = (n * 3 + i * 7) % affixKeys.length;
          item.affix = affixKeys[affixIndex];
        }
      }
    }
  }

  // Multi-Sector Dynamic Route Spawning
  const curSec = (typeof G !== 'undefined' && G && G.sector) ? G.sector : ((typeof SAVE !== 'undefined' && SAVE.currentSector) || 'foundry');
  if (curSec === 'abyss') {
    // Sektor 02: Dual-Front Convergence (West vs North split from wave 1)
    for (let i = 0; i < ev.length; i++) {
      if (ev[i].type !== 'boss') {
        ev[i].pathId = (i % 2 === 0 ? 0 : 1);
      }
    }
  } else if (curSec === 'dunes') {
    // Sektor 05: Canyon Double-Fork (North Mesa vs South Canyon alternate on wave >= 4)
    if (n >= 4) {
      for (let i = 0; i < ev.length; i++) {
        if (ev[i].type !== 'boss' && (i % 2 === 1)) {
          ev[i].pathId = 1;
        }
      }
    }
  } else if (curSec === 'quarantine') {
    // Sektor 03: Bio-Tunnel Flank on wave >= 6
    if (n >= 6) {
      for (let i = 0; i < ev.length; i++) {
        if ((ev[i].type === 'breacher' || ev[i].type === 'stealth' || (i + n) % 3 === 0) && ev[i].type !== 'boss') {
          ev[i].pathId = 1;
        }
      }
    }
  } else if (curSec === 'skyspire') {
    // Sektor 04: Drop pods from South on wave >= 7
    if (n >= 7) {
      for (let i = 0; i < ev.length; i++) {
        if (ev[i].type !== 'boss' && ((i + n) % 3 === 0)) {
          ev[i].pathId = 1;
        }
      }
    }
  } else if (curSec === 'metropolis') {
    // Sektor 06: Express Flyover on wave >= 6
    if (n >= 6) {
      for (let i = 0; i < ev.length; i++) {
        if (ev[i].type !== 'boss' && ((i + n) % 3 === 0)) {
          ev[i].pathId = 1;
        }
      }
    }
  } else if (curSec === 'abyssal') {
    // Sektor 07: Geyser bypass on wave >= 5
    if (n >= 5) {
      for (let i = 0; i < ev.length; i++) {
        if (ev[i].type !== 'boss' && ((i + n) % 3 === 0)) {
          ev[i].pathId = 1;
        }
      }
    }
  } else {
    // Sektor 01 (Foundry): Dynamic North Breach Route (Wave >= 8)
    if (n >= 8) {
      for (let i = 0; i < ev.length; i++) {
        const item = ev[i];
        if (item.type !== 'boss' && item.type !== 'swarm' && ((i + n) % 3 === 0)) {
          item.pathId = 1;
        }
      }
    }
  }

  ev.sort((a, b) => a.t - b.t);
  return ev;
}
