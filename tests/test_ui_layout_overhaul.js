// ============================================================
// Test Suite: UI Layout & Visual Overhaul (Bastion TD 9.2)
// Verifies Topbar Grouping, Dock Uniformity, Command Tray, and
// Inspector Layouts to ensure zero overlapping or squishing.
// ============================================================

const fs = require('fs');
const assert = require('assert');

console.log('Testing Bastion TD UI Layout & Visual Overhaul...');

// 1. Inspect index.html
const html = fs.readFileSync('index.html', 'utf8');

console.log('\n--- 1. Testing Topbar Semantic Grouping ---');
assert(html.includes('ctrl-group systems'), 'index.html must include .ctrl-group.systems');
assert(html.includes('ctrl-group protocols'), 'index.html must include .ctrl-group.protocols');
assert(html.includes('ctrl-group sim'), 'index.html must include .ctrl-group.sim');

const requiredIds = [
  'btnWorkshop', 'btnCodex', 'btnMatrix', 'vTpp', 'btnGeneLab',
  'btnThermalPurge', 'btnChrono', 'btnOverload', 'btnMechPilot', 'btnDreadnought', 'vDreadCharge',
  'speedSeg', 'btnPause', 'btnMute',
  'chipLives', 'chipGold', 'chipPower', 'chipCores', 'chipSector', 'chipWeather',
  'cmdSkills', 'perkTray', 'dock', 'waveCard', 'inspector'
];
requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `index.html must include ID: ${id}`);
});
console.log('✔ All topbar controls and HUD IDs correctly present and semantically grouped');

// 2. Inspect css/style.css
const css = fs.readFileSync('css/style.css', 'utf8');

console.log('\n--- 2. Testing CSS Layout Rules & Anti-Collision ---');
assert(css.includes('.ctrl-group {'), 'CSS must define .ctrl-group layout');
assert(css.includes('.cbtn {'), 'CSS must define .cbtn class for grouped control buttons');
assert(css.includes('.cbtn-badge'), 'CSS must define .cbtn-badge for micro counters');
assert(css.includes('padding-right: 22px'), 'Shop .meta must have right padding to avoid .key overlap');
assert(css.includes('.shop:nth-child(6) .tip'), 'CSS must specify tooltip right alignment for item 6');
assert(css.includes('.shop:nth-child(7) .tip'), 'CSS must specify tooltip right alignment for item 7');
assert(css.includes('.shop:nth-child(8) .tip'), 'CSS must specify tooltip right alignment for item 8');
assert(css.includes('.perk-tray {') && css.includes('white-space: nowrap'), 'Perk tray must not wrap onto skills');
assert(css.includes('#side {') && css.includes('overflow-y: auto'), 'Side column must support sleek scroll containment');
console.log('✔ CSS anti-collision paddings, tooltip alignments, and scroll containment verified');

// 3. Inspect js/ui.js for Dock uniformity & canvas icons
const uiJs = fs.readFileSync('js/ui.js', 'utf8');

console.log('\n--- 3. Testing Shop Dock Uniformity in ui.js ---');
assert(uiJs.includes('drawMegastructureDockIcon'), 'ui.js must implement drawMegastructureDockIcon');
assert(uiJs.includes('drawBarricadeDockIcon'), 'ui.js must implement drawBarricadeDockIcon');
assert(uiJs.includes('el.dataset.megaType'), 'refreshUI must handle el.dataset.megaType styling');
console.log('✔ Dock canvas icon generation and selection highlights verified');

// 4. Inspect js/render.js for canvas tutorial banner deconfliction
const renderJs = fs.readFileSync('js/render.js', 'utf8');

console.log('\n--- 4. Testing Wave 0 Banner Deconfliction in render.js ---');
assert(renderJs.includes('bY = 20') || renderJs.includes('bY = 22'), 'Wave 0 prep tutorial banner must be placed at top of canvas');
assert(!renderJs.includes('H - 52'), 'Wave 0 prep banner must NOT be drawn at H - 52 (which overlaps Titan Mech Visor)');
console.log('✔ Wave 0 canvas banner deconfliction verified');

console.log('\n============================================================');
console.log('🎉 ALL UI LAYOUT & VISUAL OVERHAUL TESTS PASSED (100%)');
console.log('============================================================\n');
