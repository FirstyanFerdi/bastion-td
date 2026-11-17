'use strict';
/* Shared constants, math helpers and localStorage persistence */

/* ============================================================
   CONSTANTS & HELPERS
   ============================================================ */
const TILE = 60, COLS = 16, ROWS = 10, W = COLS * TILE, H = ROWS * TILE;
const TAU = Math.PI * 2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const FONT = '"Bahnschrift","Roboto Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif';
const ROMAN = ['I', 'II', 'III'];
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function glow(c, x, y, r, color, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
}
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ============================================================
   PERSISTENCE
   ============================================================ */
const Store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
const SAVE = {
  bestScore: Store.get('nb_bestScore', 0),
  bestWave: Store.get('nb_bestWave', 0),
  muted: Store.get('nb_muted', false),
  cores: Store.get('nb_cores', 0),
  workshop: Store.get('nb_workshop', {}),
  ascension: Number(Store.get('nb_ascension', 0)),
  maxAscension: Number(Store.get('nb_maxAscension', 0)),
  doctrine: Store.get('nb_doctrine', 'vanguard'),
  currentSector: Store.get('nb_currentSector', 'foundry'),
  sectorMastery: Store.get('nb_sectorMastery', {}),
  chipsInventory: Store.get('nb_chips', {
    prism_refractor: 2,
    cryo_igniter: 2,
    vampiric_siphon: 2,
    arc_resonance: 2,
    executioner_nanites: 2,
    feedback_chrono: 2
  }),
  codex: Store.get('nb_codex', {})
};

function setDoctrine(id) {
  if (typeof COMMANDER_DOCTRINES !== 'undefined' && !COMMANDER_DOCTRINES[id]) return false;
  SAVE.doctrine = id;
  Store.set('nb_doctrine', id);
  if (typeof G !== 'undefined' && G && G.state === 'prep' && G.wave === 0) {
    G.doctrine = id;
    if (typeof initDoctrineSkills === 'function') initDoctrineSkills();
  }
  if (typeof refreshUI === 'function') refreshUI();
  return true;
}

function addChip(id, count) {
  count = count || 1;
  SAVE.chipsInventory = SAVE.chipsInventory || {};
  SAVE.chipsInventory[id] = (SAVE.chipsInventory[id] || 0) + count;
  Store.set('nb_chips', SAVE.chipsInventory);
  if (typeof refreshUI === 'function') refreshUI();
  return SAVE.chipsInventory[id];
}

function addCores(n) {
  let mult = (typeof G !== 'undefined' && G && G.ascension > 0) ? (1 + G.ascension * 0.25) : 1;
  if (typeof G !== 'undefined' && G && G.cursedProtocols && G.cursedProtocols.includes('blood_pact')) {
    mult *= 2.0; // Blood-Pact: +100% cores
  }
  const finalCores = Math.round(n * mult);
  SAVE.cores = (SAVE.cores || 0) + finalCores;
  Store.set('nb_cores', SAVE.cores);
  const el = typeof $ === 'function' ? $('vCores') : null;
  if (el) el.textContent = String(SAVE.cores);
  return finalCores;
}

function setAscension(lv) {
  const max = Math.min(5, Math.max(1, SAVE.maxAscension || 1));
  SAVE.ascension = clamp(lv, 0, max);
  Store.set('nb_ascension', SAVE.ascension);
  if (typeof G !== 'undefined' && G && G.state === 'menu') G.ascension = SAVE.ascension;
  if (typeof refreshUI === 'function') refreshUI();
}

function unlockNextAscension(beatenLevel) {
  const nextUnlocked = Math.min(5, (beatenLevel || 0) + 1);
  if (nextUnlocked > (SAVE.maxAscension || 1)) {
    SAVE.maxAscension = nextUnlocked;
    Store.set('nb_maxAscension', SAVE.maxAscension);
  }
}

function getWorkshopLevel(id) {
  return (SAVE.workshop && SAVE.workshop[id]) || 0;
}

function getUpgradeCost(baseCost) {
  const logLv = getWorkshopLevel('logistics');
  const discount = logLv === 1 ? 0.10 : (logLv === 2 ? 0.18 : 0);
  return Math.round(baseCost * (1 - discount));
}

function upgradeWorkshop(id) {
  if (typeof WORKSHOP_UPGRADES === 'undefined') return false;
  const upg = WORKSHOP_UPGRADES[id];
  if (!upg) return false;
  const cur = getWorkshopLevel(id);
  if (cur >= upg.maxLv) return false;
  const cost = upg.costs[cur];
  if ((SAVE.cores || 0) < cost) return false;
  SAVE.cores -= cost;
  SAVE.workshop = SAVE.workshop || {};
  SAVE.workshop[id] = cur + 1;
  Store.set('nb_cores', SAVE.cores);
  Store.set('nb_workshop', SAVE.workshop);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('perk');
  if (typeof refreshUI === 'function') refreshUI();
  return true;
}

function getSectorMastery(secId) {
  SAVE.sectorMastery = SAVE.sectorMastery || {};
  return SAVE.sectorMastery[secId] || { stars: [false, false, false], cleared: false, bestWave: 0 };
}

function recordSectorProgress(secId, wave, isWin, lives, curAsc) {
  SAVE.sectorMastery = SAVE.sectorMastery || {};
  const m = getSectorMastery(secId);
  m.bestWave = Math.max(m.bestWave || 0, wave);
  let coresEarned = 0;
  if (isWin) {
    m.cleared = true;
    if (!m.stars[0]) {
      m.stars[0] = true;
      coresEarned += 25;
    }
    const maxLives = (curAsc >= 2) ? 12 : 25;
    if (lives >= maxLives && !m.stars[1]) {
      m.stars[1] = true;
      coresEarned += 35;
    }
    if (curAsc >= 2 && !m.stars[2]) {
      m.stars[2] = true;
      coresEarned += 50;
    }
  }
  SAVE.sectorMastery[secId] = m;
  Store.set('nb_sectorMastery', SAVE.sectorMastery);
  if (coresEarned > 0) addCores(coresEarned);
  return { m, coresEarned };
}

function isSectorUnlocked(secId) {
  if (!secId || secId === 'foundry') return true;
  const order = ['foundry', 'abyss', 'quarantine', 'skyspire', 'dunes', 'metropolis', 'abyssal'];
  const idx = order.indexOf(secId);
  if (idx <= 0) return true;
  const prevId = order[idx - 1];
  const prevM = getSectorMastery(prevId);
  return !!(prevM.cleared || prevM.bestWave >= 10 || (prevM.stars && prevM.stars.some(Boolean)));
}

function setSector(secId) {
  if (typeof MAP_SECTORS !== 'undefined' && !MAP_SECTORS[secId]) return false;
  SAVE.currentSector = secId;
  Store.set('nb_currentSector', secId);
  if (typeof loadSector === 'function') loadSector(secId);
  if (typeof buildMap === 'function') buildMap(secId);
  if (typeof G !== 'undefined' && G && G.state === 'menu') {
    G.sector = secId;
  }
  if (typeof refreshUI === 'function') refreshUI();
  return true;
}

/* ============================================================
   CLASSIFIED TECH CODEX (4.0)
   ============================================================ */
function recordCodexDiscovery(id, category) {
  SAVE.codex = SAVE.codex || {};
  if (SAVE.codex[id]) return false; // Already discovered
  SAVE.codex[id] = { id, category, time: Date.now() };
  Store.set('nb_codex', SAVE.codex);
  // Discovery bounty: +15 Nanite Cores
  addCores(15);
  if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('victory');
  if (typeof addText === 'function' && typeof W !== 'undefined') {
    addText(W / 2, 75, 'CODEX UNLOCKED: ' + String(id).toUpperCase().replace('_', ' ') + ' (+15 CORES)!', '#38bdf8', 16);
  }
  if (typeof refreshUI === 'function') refreshUI();
  return true;
}

function isCodexDiscovered(id) {
  return !!(SAVE.codex && SAVE.codex[id]);
}

function getCodexProgress() {
  SAVE.codex = SAVE.codex || {};
  const total = 4 + 4 + 4 + 7; // 4 fusions + 4 cursed + 4 anomalies + 7 sectors
  const discovered = Object.keys(SAVE.codex).length;
  return { discovered, total, pct: Math.min(100, Math.round((discovered / total) * 100)) };
}
