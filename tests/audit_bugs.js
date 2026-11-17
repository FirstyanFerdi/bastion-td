// Comprehensive Audit Script for Bastion TD
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const P = new Proxy(function () { }, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'length' ? 0 : k === 'then' ? undefined : P),
  apply: () => P, set: () => true, construct: () => P
});
const store = {};
Object.assign(globalThis, {
  window: globalThis,
  document: {
    documentElement: P,
    getElementById: () => P,
    createElement: () => P,
    addEventListener() { },
    querySelectorAll: () => [],
    querySelector: () => P,
    hidden: false
  },
  localStorage: {
    getItem: k => store[k] ?? null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: k => { delete store[k]; }
  },
  requestAnimationFrame: () => 1,
  addEventListener() { },
  devicePixelRatio: 1,
  innerWidth: 1400,
  setTimeout: (fn) => fn()
});

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}

console.log('=== RUNNING COMPREHENSIVE CODEBASE AUDIT ===\n');
const bugs = [];

// 1. Audit SFX Calls vs Sfx cases
console.log('--- 1. Auditing SFX Sounds ---');
const audioCode = fs.readFileSync('js/audio.js', 'utf8');
const audioCases = new Set([...audioCode.matchAll(/case\s+['"]([^'"]+)['"]:/g)].map(m => m[1]));

const sfxCalls = new Set();
for (const f of scripts) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/Sfx\.play\(['"]([^'"]+)['"]\)/g);
  for (const m of matches) {
    sfxCalls.add(m[1]);
    if (!audioCases.has(m[1])) {
      bugs.push({ category: 'SFX_MISSING_CASE', issue: `Sound '${m[1]}' called in ${f} has no switch case in Sfx.play()` });
    }
  }
}
console.log(`SFX sounds called (${sfxCalls.size}): ${[...sfxCalls].join(', ')}`);
console.log(`Audio cases implemented (${audioCases.size}): ${[...audioCases].join(', ')}`);

// 2. Audit UI Actions (data-act, data-ov, data-skill, etc.)
console.log('\n--- 2. Auditing UI Actions ---');
const uiActs = new Set();
const uiOvs = new Set();
const mainContent = fs.readFileSync('js/main.js', 'utf8') + fs.readFileSync('js/input.js', 'utf8');

for (const f of scripts.concat(['index.html'])) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(/data-act="([^"]+)"/g)) uiActs.add(m[1]);
  for (const m of content.matchAll(/data-ov="([^"]+)"/g)) uiOvs.add(m[1]);
}

for (const act of uiActs) {
  if (act === 'sign_contract') continue; // Handled via waveCard listener
  if (!mainContent.includes(`act === '${act}'`) && !mainContent.includes(`act === "${act}"`)) {
    bugs.push({ category: 'UI_ACT', issue: `data-act="${act}" has no handler in main.js/input.js` });
  }
}
for (const ov of uiOvs) {
  if (ov === 'hq_upg' || ov === 'perk') continue; // Handled specially
  if (!mainContent.includes(`a === '${ov}'`) && !mainContent.includes(`a === "${ov}"`)) {
    bugs.push({ category: 'UI_OV', issue: `data-ov="${ov}" has no handler in main.js/input.js` });
  }
}
console.log(`Audited ${uiActs.size} data-act and ${uiOvs.size} data-ov actions.`);

// 3. Audit Sector Data consistency across all sectors
console.log('\n--- 3. Auditing Sector Data ---');
for (const secId in MAP_SECTORS) {
  const sec = MAP_SECTORS[secId];
  // Check leylines
  if (!sec.leylines || !sec.leylines.accelerator || !sec.leylines.sensor || !sec.leylines.catalyst) {
    bugs.push({ category: 'SECTOR_DATA', issue: `Sector ${secId} missing one of standard leylines (accelerator, sensor, catalyst)` });
  }
  // Check hazards
  if (!sec.hazards || sec.hazards.length === 0) {
    bugs.push({ category: 'SECTOR_DATA', issue: `Sector ${secId} has empty hazards` });
  } else {
    for (const h of sec.hazards) {
      if (h.row === undefined || h.c === undefined || !h.type) {
        bugs.push({ category: 'SECTOR_DATA', issue: `Sector ${secId} hazard missing row, c, or type: ${JSON.stringify(h)}` });
      }
    }
  }
  // Check start & base
  if (!sec.start0 || !sec.base) {
    bugs.push({ category: 'SECTOR_DATA', issue: `Sector ${secId} missing start0 or base` });
  }
  // Check palette
  if (!sec.palette || !sec.palette.ground || !sec.palette.road || !sec.palette.curb) {
    bugs.push({ category: 'SECTOR_DATA', issue: `Sector ${secId} missing palette fields` });
  }
}

// 4. Audit Tower Definitions & Upgrades
console.log('\n--- 4. Auditing Tower Definitions ---');
for (const type in TD) {
  const def = TD[type];
  if (def.isFusion) continue; // Super-weapons are apex fusions with unique mechanics
  if (!def.tiers || def.tiers.length < 2) {
    bugs.push({ category: 'TOWER_DEF', issue: `Tower ${type} has fewer than 2 tiers` });
  }
  if (!def.branches || !def.branches.A || !def.branches.B) {
    bugs.push({ category: 'TOWER_DEF', issue: `Tower ${type} missing branch A or B` });
  }
}

// 5. Audit Enemy Definitions
console.log('\n--- 5. Auditing Enemy Definitions ---');
for (const type in ED) {
  const def = ED[type];
  if (def.hp === undefined || def.speed === undefined || def.reward === undefined) {
    bugs.push({ category: 'ENEMY_DEF', issue: `Enemy ${type} missing hp, speed, or reward` });
  }
}

// 6. Audit Commander Doctrines & Skills
console.log('\n--- 6. Auditing Commander Doctrines & Skills ---');
for (const docId in COMMANDER_DOCTRINES) {
  const doc = COMMANDER_DOCTRINES[docId];
  if (!doc.skills || doc.skills.length !== 4) {
    bugs.push({ category: 'DOCTRINE', issue: `Doctrine ${docId} does not have exactly 4 skills (Q, W, E, R)` });
  }
  for (const skId of (doc.skills || [])) {
    if (!COMMANDER_SKILLS[skId]) {
      bugs.push({ category: 'DOCTRINE', issue: `Doctrine ${docId} references undefined skill: ${skId}` });
    }
  }
}

// 7. Audit Modular Chips
console.log('\n--- 7. Auditing Modular Chips ---');
for (const chipId in MODULAR_CHIPS) {
  const chip = MODULAR_CHIPS[chipId];
  if (!chip.name || !chip.target || !chip.color) {
    bugs.push({ category: 'CHIPS', issue: `Modular chip ${chipId} missing name, target, or color` });
  }
}

// 8. Audit Mutators
console.log('\n--- 8. Auditing Mutators ---');
for (const mutId in WAVE_MUTATORS) {
  const mut = WAVE_MUTATORS[mutId];
  if (!mut.name || !mut.desc) {
    bugs.push({ category: 'MUTATOR', issue: `Mutator ${mutId} missing name or desc` });
  }
}

// 9. Audit Workshop Upgrades
console.log('\n--- 9. Auditing Workshop Upgrades ---');
for (const upgId in WORKSHOP_UPGRADES) {
  const upg = WORKSHOP_UPGRADES[upgId];
  if (!upg.costs || upg.costs.length !== upg.maxLv) {
    bugs.push({ category: 'WORKSHOP', issue: `Workshop upgrade ${upgId} costs array length (${upg.costs ? upg.costs.length : 0}) does not match maxLv (${upg.maxLv})` });
  }
}

// 10. Audit Defense Contracts
console.log('\n--- 10. Auditing Defense Contracts ---');
for (const cId in DEFENSE_CONTRACTS) {
  const c = DEFENSE_CONTRACTS[cId];
  if (!c.name || !c.rewardText) {
    bugs.push({ category: 'CONTRACTS', issue: `Contract ${cId} missing name or rewardText` });
  }
}

// 11. Audit HTML Element IDs
console.log('\n--- 11. Auditing HTML Element IDs ---');
const idMatches = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const htmlIds = new Set(idMatches);
const referencedIds = new Set();
for (const f of scripts) {
  const content = fs.readFileSync(f, 'utf8');
  for (const m of content.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) referencedIds.add(m[1]);
  for (const m of content.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) referencedIds.add(m[1]);
}
for (const id of referencedIds) {
  if (id === 'secMiniCanvas' || id === 'inspIcon' || id === 'btnUpg') continue; // Dynamically created inside inspector or overlay modal
  if (!htmlIds.has(id)) {
    bugs.push({ category: 'HTML_ID', issue: `Referenced element ID '#${id}' does not exist in index.html` });
  }
}
console.log(`Audited ${referencedIds.size} referenced element IDs.`);

console.log('\n=== AUDIT RESULTS ===');
if (bugs.length === 0) {
  console.log('🎉 ZERO STATIC INCONSISTENCY BUGS FOUND!');
} else {
  console.log(`⚠️ FOUND ${bugs.length} ISSUES:`);
  bugs.forEach((b, i) => console.log(`${i + 1}. [${b.category}] ${b.issue}`));
}
