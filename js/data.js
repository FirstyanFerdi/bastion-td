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
    tiers: [{ dmg: 8, rate: 6, range: 2.8, upg: 0 }, { dmg: 13, rate: 8, range: 3.1, upg: 65 }, { dmg: 20, rate: 10, range: 3.4, upg: 120 }]
  },
  plasma: {
    id: 'plasma', name: 'Plasma Cannon', color: '#fb923c', cost: 110, key: '2', role: 'Splash / Armor shred',
    tip: 'Slow AoE shells ignore armor and permanently shred it, so Gatlings and Railguns hit Brutes far harder afterward. Crushes Swarms.',
    tiers: [{ dmg: 42, rate: 0.8, range: 2.7, splash: 1.1, shred: 0.12, upg: 0 }, { dmg: 72, rate: 0.9, range: 3.0, splash: 1.3, shred: 0.18, upg: 100 }, { dmg: 115, rate: 1.0, range: 3.3, splash: 1.5, shred: 0.25, upg: 180 }]
  },
  cryo: {
    id: 'cryo', name: 'Cryo Emitter', color: '#60a5fa', cost: 80, key: '3', role: 'Slow / Brittle',
    tip: 'Pulses slow enemies 40% and make them brittle (+20% damage from everything). Tier III pulses periodically freeze enemies (bosses are immune).',
    tiers: [{ dmg: 2, rate: 0.8, range: 2.4, slow: 0.4, brittle: 0.2, freeze: 0, upg: 0 }, { dmg: 4, rate: 1.0, range: 2.7, slow: 0.45, brittle: 0.25, freeze: 0, upg: 70 }, { dmg: 7, rate: 1.2, range: 3.0, slow: 0.5, brittle: 0.3, freeze: 1, upg: 130 }]
  },
  tesla: {
    id: 'tesla', name: 'Tesla Coil', color: '#facc15', cost: 130, key: '4', role: 'Chain lightning / Energy',
    tip: 'Lightning chains across up to 4 enemies. Energy damage ignores armor and deals bonus damage to shields, the answer to shielded waves and bosses.',
    tiers: [{ dmg: 16, rate: 1.4, range: 2.5, targets: 2, sm: 1.75, upg: 0 }, { dmg: 26, rate: 1.6, range: 2.8, targets: 3, sm: 2.0, upg: 110 }, { dmg: 40, rate: 1.8, range: 3.1, targets: 4, sm: 2.4, upg: 190 }]
  },
  rail: {
    id: 'rail', name: 'Railgun Sniper', color: '#e11d48', cost: 180, key: '5', role: 'Pierce / Crit / Long range',
    tip: 'Enormous range and critical hits; the slug pierces every enemy in a straight line. Place it on long straights to rake whole columns of Brutes.',
    tiers: [{ dmg: 100, rate: 0.4, range: 5.5, crit: 0.2, cm: 2.5, pierce: 3, upg: 0 }, { dmg: 170, rate: 0.45, range: 6.5, crit: 0.25, cm: 2.5, pierce: 5, upg: 150 }, { dmg: 280, rate: 0.5, range: 7.5, crit: 0.3, cm: 3.0, pierce: 9, upg: 260 }]
  }
};
const TKEYS = ['gatling', 'plasma', 'cryo', 'tesla', 'rail'];
const PRIOS = [['first', 'First'], ['last', 'Last'], ['strongest', 'Strongest'], ['weakest', 'Weakest']];

const ED = {
  scout: { name: 'Scout', hp: 34, speed: 112, r: 10, armor: 0, reward: 4, leak: 1 },
  brute: { name: 'Armored Brute', hp: 240, speed: 46, r: 18, armor: 0.6, reward: 15, leak: 2 },
  swarm: { name: 'Swarm', hp: 13, speed: 84, r: 6, armor: 0, reward: 2, leak: 1 },
  healer: { name: 'Healer', hp: 110, speed: 62, r: 12, armor: 0, reward: 12, leak: 1 },
  boss: { name: 'Boss', hp: 1900, speed: 34, r: 28, armor: 0.25, reward: 140, leak: 8 }
};
const hpScale = n => 1 + 0.2 * (n - 1) + 0.014 * (n - 1) * (n - 1);
const WIN_WAVE = 20;

function buildSpawns(n) {
  const ev = [], add = (t, type) => ev.push({ t, type });
  const scouts = n === 1 ? 8 : 6 + Math.floor(n * 1.2);
  const sg = Math.max(0.26, 0.7 - n * 0.016);
  for (let i = 0; i < scouts; i++) add(i * sg, 'scout');
  if (n >= 3 && n % 2 === 1) {
    const per = 8 + (n % 5), cl = 1 + Math.floor(n / 8);
    for (let k = 0; k < cl; k++) for (let i = 0; i < per; i++) add(2.5 + k * 5 + i * 0.06, 'swarm');
  }
  if (n >= 4) { const b = 1 + Math.floor((n - 4) / 2); for (let i = 0; i < b; i++) add(1.5 + i * 1.8, 'brute'); }
  if (n >= 6) { const h = 1 + Math.floor((n - 6) / 4); for (let i = 0; i < h; i++) add(3 + i * 2.6, 'healer'); }
  if (n % 5 === 0) { const bc = 1 + Math.floor(n / 20); for (let i = 0; i < bc; i++) add(6 + i * 9, 'boss'); }
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
