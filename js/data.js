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

/* Dynamic North Breach Route (Wave >= 8) */
const WP_BREACH = [[7, 0], [7, 1], [11, 1], [11, 3], [11, 8], [14, 8], [14, 2], [15, 2]];
for (let i = 0; i < WP_BREACH.length - 1; i++) {
  const [c1, r1] = WP_BREACH[i], [c2, r2] = WP_BREACH[i + 1];
  const dc = Math.sign(c2 - c1), dr = Math.sign(r2 - r1);
  let c = c1, r = r1; pathTile[r][c] = true;
  while (c !== c2 || r !== r2) { c += dc; r += dr; pathTile[r][c] = true; }
}
const PATH_BREACH = [{ x: 7 * TILE + TILE / 2, y: -TILE * 0.6 }];
for (const [c, r] of WP_BREACH) PATH_BREACH.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
const SEG_BREACH = []; let PLEN_BREACH = 0;
for (let i = 0; i < PATH_BREACH.length - 1; i++) {
  const a = PATH_BREACH[i], b = PATH_BREACH[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y);
  SEG_BREACH.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, len, start: PLEN_BREACH, ang: Math.atan2(b.y - a.y, b.x - a.x) });
  PLEN_BREACH += len;
}

function posAt(d, hint, pathId) {
  const segs = pathId === 1 ? SEG_BREACH : SEG;
  let i = hint || 0; if (d < 0) d = 0;
  while (i < segs.length - 1 && d >= segs[i].start + segs[i].len) i++;
  const s = segs[i], t = clamp((d - s.start) / s.len, 0, 1);
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

const COMMANDER_SKILLS = {
  orbital: { id: 'orbital', name: 'Orbital Strike', key: 'Q', cd: 32, icon: 'target', desc: 'Call down a devastating kinetic strike on target area.' },
  overcharge: { id: 'overcharge', name: 'Overcharge', key: 'W', cd: 25, icon: 'ff', desc: 'Supercharge a tower for 7s (+100% fire rate).' },
  caltrops: { id: 'caltrops', name: 'Nanite Caltrops', key: 'E', cd: 18, icon: 'shield', desc: 'Deploy spike hazard on road (slows 60% and shreds).' },
  emp_nuke: { id: 'emp_nuke', name: 'Tactical EMP Nuke', key: 'R', cd: 40, icon: 'spark', desc: 'Global EMP wave: clears enemy shields, stuns all enemies on screen for 3.0s.' }
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
const LEYLINE_NODES = {
  accelerator: {
    id: 'accelerator', name: 'Hyper-Accelerator', c: 6, r: 2,
    color: '#fbbf24', aura: 'rgba(251,191,36,0.22)',
    desc: '+45% Attack Speed to tower deployed here.'
  },
  sensor: {
    id: 'sensor', name: 'Sensor Relay', c: 10, r: 5,
    color: '#38bdf8', aura: 'rgba(56,189,248,0.22)',
    desc: '+2.5 Range and permanent Stealth true-sight.'
  },
  catalyst: {
    id: 'catalyst', name: 'Catalyst Node', c: 7, r: 5,
    color: '#c084fc', aura: 'rgba(192,132,252,0.22)',
    desc: '+50% debuff potency and doubled effect durations.'
  }
};
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
  if (n % 5 === 0) { const bc = 1 + Math.floor(n / 20); for (let i = 0; i < bc; i++) add(6 + i * 9, 'boss'); }

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

  // Dynamic North Breach Route (Wave >= 8, flanking ~35% non-boss, non-swarm enemies)
  if (n >= 8) {
    for (let i = 0; i < ev.length; i++) {
      const item = ev[i];
      if (item.type !== 'boss' && item.type !== 'swarm' && ((i + n) % 3 === 0)) {
        item.pathId = 1;
      }
    }
  }

  ev.sort((a, b) => a.t - b.t);
  return ev;
}
