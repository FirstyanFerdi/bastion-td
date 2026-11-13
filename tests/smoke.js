// Headless smoke test: loads the same scripts index.html loads (in order, as classic
// scripts sharing one global scope), stubs the DOM/canvas, then lets a simple bot
// build towers and play through waves. Exits non-zero if anything throws.
//
//   node tests/smoke.js            # play until victory (wave 20)
//   node tests/smoke.js 40         # keep going into Endless Mode up to wave 40
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const maxWave = Number(process.argv[2]) || 20;

// A proxy that tolerates any DOM / canvas call.
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

const spots = [[3, 2], [4, 2], [6, 2], [4, 3], [3, 5], [3, 6], [1, 5], [4, 5], [5, 6], [6, 6], [7, 5], [9, 4], [9, 6], [10, 5], [10, 4], [12, 4], [12, 6], [13, 5], [10, 7], [12, 2], [13, 3], [9, 2], [7, 2], [3, 3]];
const types = ['gatling', 'plasma', 'cryo', 'tesla', 'rail', 'gatling', 'plasma', 'tesla', 'gatling', 'rail', 'cryo', 'plasma'];
let next = 0;
function bot() {
  const G = nb.G;
  if (G.drafting && G.drafting.cards && G.drafting.cards.length > 0) {
    nb.selectPerk(G.drafting.cards[0]);
  }
  for (const t of G.towers) {
    if (t.tier === 0 && G.gold >= nb.TD[t.type].tiers[1].upg + 50) {
      nb.upgradeTower(t);
    } else if (t.tier === 1 && G.gold >= nb.TD[t.type].branches.A.upg + 50) {
      nb.upgradeTower(t, (t.c + t.r) % 2 === 0 ? 'A' : 'B');
    }
  }
  while (next < spots.length) {
    const ty = types[next % types.length], [c, r] = spots[next];
    if (G.gold < nb.TD[ty].cost + 30) break;
    const t = nb.placeTower(c, r, ty); next++;
    if (t) t.prio = ['first', 'strongest', 'last', 'weakest'][next % 4];
  }
}

let steps = 0;
try {
  for (let i = 0; i < 2000000; i++) {
    const G = nb.G;
    if (G.drafting && G.drafting.cards && G.drafting.cards.length > 0) {
      nb.selectPerk(G.drafting.cards[0]);
    }
    if (G.state === 'over') break;
    if (G.state === 'victory') { if (maxWave <= 20) break; G.endless = true; G.state = 'prep'; G.prepT = 15; }
    if (G.wave >= maxWave && G.state === 'prep') break;
    if (G.state === 'prep' && (G.wave === 0 || G.prepT < 17)) nb.callWave();
    if (i % 30 === 0) bot();
    nb.update(1 / 50);
    if (i % 10 === 0) nb.render();
    if (i % 50 === 0) nb.refreshUI();
    steps++;
  }
} catch (e) {
  console.error('FAIL:', e.stack); process.exit(1);
}
const G = nb.G;
console.log(`OK  state=${G.state} wave=${G.wave} lives=${G.lives} towers=${G.towers.length} score=${G.score} steps=${steps}`);
