const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync('index.html', 'utf8');

class DOMElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = {
      add: () => {}, remove: () => {}, toggle: () => {}
    };
    this.style = { setProperty: () => {} };
    this.dataset = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
  }
  querySelector(sel) { return new DOMElement('div'); }
  querySelectorAll(sel) { return []; }
  appendChild(child) { this.children.push(child); }
  addEventListener() {}
  getContext() {
    const grad = { addColorStop: () => {} };
    return new Proxy({}, { get: (t, k) => () => (k.includes('Gradient') ? grad : {}) });
  }
  toDataURL() { return 'data:image/png;base64,'; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; }
}

const elements = {};
const idMatches = [...html.matchAll(/id="([^"]+)"/g)];
for (const m of idMatches) elements[m[1]] = new DOMElement('div', m[1]);

const icoMatches = [...html.matchAll(/data-ico="([^"]+)"/g)];
const icoElements = icoMatches.map(m => {
  const el = new DOMElement('span');
  el.dataset.ico = m[1];
  return el;
});

const store = {};
const win = {
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
  addEventListener() {},
  requestAnimationFrame: (cb) => { console.log('requestAnimationFrame called successfully!'); },
  performance: { now: () => Date.now() },
  setTimeout: () => {},
  document: {
    hidden: false,
    getElementById: id => elements[id] || new DOMElement('div', id),
    createElement: tag => new DOMElement(tag),
    querySelectorAll: sel => {
      if (sel === '[data-ico]') return icoElements;
      return [];
    },
    addEventListener() {}
  }
};
win.window = win;
Object.assign(globalThis, win);

const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const f of scripts) {
  console.log('Loading', f);
  vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: f });
}
console.log('ALL SCRIPTS LOADED AND INIT COMPLETED!');
frame(100);
console.log('FRAME 1 RENDERED AND COMPLETED!');

