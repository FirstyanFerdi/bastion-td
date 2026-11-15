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
  maxAscension: Number(Store.get('nb_maxAscension', 0))
};

function addCores(n) {
  const mult = (typeof G !== 'undefined' && G && G.ascension > 0) ? (1 + G.ascension * 0.25) : 1;
  const finalCores = Math.round(n * mult);
  SAVE.cores = (SAVE.cores || 0) + finalCores;
  Store.set('nb_cores', SAVE.cores);
  const el = typeof $ === 'function' ? $('vCores') : null;
  if (el) el.textContent = String(SAVE.cores);
  return finalCores;
}

function setAscension(lv) {
  const max = Math.min(5, Math.max(1, (SAVE.maxAscension || 0) + 1));
  SAVE.ascension = clamp(lv, 0, max);
  Store.set('nb_ascension', SAVE.ascension);
  if (typeof G !== 'undefined' && G && G.state === 'menu') G.ascension = SAVE.ascension;
  if (typeof refreshUI === 'function') refreshUI();
}

function unlockNextAscension(beatenLevel) {
  if (beatenLevel >= (SAVE.maxAscension || 0)) {
    SAVE.maxAscension = Math.min(5, beatenLevel + 1);
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
