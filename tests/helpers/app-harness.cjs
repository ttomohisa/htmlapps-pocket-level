const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { gunzipSync } = require('node:zlib');

// Executes the real inline application with only browser boundaries simulated.
// No browser, hardware sensor, network, or actual permission request is used.
function loadHtml(file = process.env.POCKET_LEVEL_HTML || path.join(__dirname, '../../src/index.template.html')) {
  const html = fs.readFileSync(file, 'utf8');
  const payload = html.match(/const b='([^']+)'/);
  return payload ? gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8') : html;
}
function createHarness({ stored, storageUnavailable = false, language = 'en' } = {}) {
  const html = loadHtml();
  let now = 1000, nextTimer = 0, permissionCalls = 0;
  const timers = new Map(), storage = new Map(), nodes = [], byId = new Map(), listeners = new Map();
  if (stored !== undefined) storage.set('pocket-level:v1', typeof stored === 'string' ? stored : JSON.stringify(stored));
  class Element {
    constructor(tag, attributes = {}) {
      this.tagName = tag.toUpperCase(); this.attributes = attributes;
      this.id = attributes.id; this.textContent = ''; this.value = attributes.value || '';
      this.dataset = Object.fromEntries(Object.entries(attributes).filter(([k]) => k.startsWith('data-')).map(([k, v]) => [k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]));
      this.style = {}; this.hidden = 'hidden' in attributes; this.disabled = 'disabled' in attributes;
      this.checked = 'checked' in attributes; this.open = false; this.listeners = new Map();
      this.classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
      this.classList = { add: (...items) => items.forEach(x => this.classes.add(x)), remove: (...items) => items.forEach(x => this.classes.delete(x)), contains: x => this.classes.has(x), toggle: (x, enabled = !this.classes.has(x)) => { if (enabled) this.classes.add(x); else this.classes.delete(x); return enabled; } };
    }
    set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
    get className() { return [...this.classes].join(' '); }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
    removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) || []).filter(f => f !== fn)); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    getAttribute(key) { return this.attributes[key] ?? null; }
    querySelector() { return this.child ||= new Element('span'); }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatch('close'); }
    dispatch(type, extra = {}) { for (const fn of this.listeners.get(type) || []) fn({ target: this, currentTarget: this, ...extra }); }
    click() { if (!this.disabled) this.dispatch('click'); }
  }
  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const attributes = {};
    for (const attr of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attributes[attr[1]] = attr[2] ?? '';
    const el = new Element(match[1], attributes); nodes.push(el); if (el.id) byId.set(el.id, el);
  }
  const document = { documentElement: { lang: language, dataset: {} }, visibilityState: 'visible', activeElement: null,
    querySelectorAll(selector) {
      if (selector === '[id]') return nodes.filter(n => n.id);
      if (selector === '[data-i18n]') return nodes.filter(n => n.dataset.i18n);
      if (selector === '[data-close-dialog]') return nodes.filter(n => n.dataset.closeDialog);
      if (selector === '.dialog-close') return nodes.filter(n => n.classList.contains('dialog-close'));
      if (selector === '#toleranceButtons button') return nodes.filter(n => n.tagName === 'BUTTON' && n.dataset.value);
      throw Error(`Unexpected selector in test harness: ${selector}`);
    }, getElementById: id => byId.get(id), addEventListener() {} };
  for (const match of html.matchAll(/<script[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)) byId.get(match[1]).textContent = match[2];
  function Sensor() {}
  Sensor.requestPermission = () => { permissionCalls++; throw Error('Actual permission path must not run in these tests'); };
  const context = { console, document, navigator: { language }, performance: { now: () => now }, location: { protocol: 'https:' }, isSecureContext: true,
    DeviceMotionEvent: Sensor, DeviceOrientationEvent: Sensor,
    localStorage: { getItem(key) { if (storageUnavailable) throw Error('Storage unavailable'); return storage.get(key) || null; }, setItem(key, value) { if (storageUnavailable) throw Error('Storage unavailable'); storage.set(key, value); } },
    setTimeout(fn, ms) { timers.set(++nextTimer, { fn, at: now + ms, repeat: 0 }); return nextTimer; }, clearTimeout: id => timers.delete(id),
    setInterval(fn, ms) { timers.set(++nextTimer, { fn, at: now + ms, repeat: ms }); return nextTimer; }, clearInterval: id => timers.delete(id), requestAnimationFrame: () => 0,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); }, TextDecoder, Uint8Array, atob };
  context.window = context;
  const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes("const storageKey = 'pocket-level:v1'"));
  if (!script) throw Error('Application script not found');
  // Test-only observability; no hooks or exports are inserted into production HTML.
  const exposed = script.replace(/\}\)\(\);\s*$/, 'globalThis.testApi={state,attachSensorListeners,renderMeter};})();');
  if (exposed === script) throw Error('Application closure not found');
  vm.createContext(context); vm.runInContext(exposed, context); context.testApi.attachSensorListeners();
  return { html, nodes: byId, state: context.testApi.state, storage, render: context.testApi.renderMeter,
    permissionCalls: () => permissionCalls,
    dispatch(type, event) { for (const fn of listeners.get(type) || []) fn(event); },
    motion(x, y, z) { this.dispatch('devicemotion', { accelerationIncludingGravity: { x, y, z } }); },
    orientation(beta, gamma) { this.dispatch('deviceorientation', { beta, gamma }); },
    advance(ms) { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { if (timer.repeat) timer.at = now + timer.repeat; else timers.delete(id); timer.fn(); } },
    preference(value) { const control = byId.get('primaryReadoutSelect'); if (!control) throw Error('Missing primary readout control'); control.value = value; control.dispatch('change'); },
    text(id) { return byId.get(id)?.textContent; }, stored() { return JSON.parse(storage.get('pocket-level:v1') || '{}'); } };
}
module.exports = { createHarness, loadHtml };
