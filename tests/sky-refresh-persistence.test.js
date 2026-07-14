const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class FakeElement {
  constructor(id, value = '') {
    this.id = id;
    this.value = value;
    this.hidden = false;
    this.checked = false;
    this.dataset = {};
    this.options = [];
    this.selectedOptions = [];
    this.listeners = {};
  }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatchEvent(event) {
    if (this.id === 'skyCreatorTarget') elements.skyCreatorPaste.dataset.skyKind = this.value;
    (this.listeners[event.type] || []).forEach(listener => listener({ target:this }));
    if (this.id === 'skyCreatorPaste' && event.type === 'input') {
      const value = this.value;
      setTimeout(() => imports.push({ kind:this.dataset.skyKind, value }), 260);
    }
  }
  click() { this.hidden = false; }
}

const imports = [];
const elements = {
  skyCreatorTarget: new FakeElement('skyCreatorTarget', 'chart'),
  skyCreatorName: new FakeElement('skyCreatorName'),
  skyCreatorNotes: new FakeElement('skyCreatorNotes'),
  skyCreatorPaste: new FakeElement('skyCreatorPaste'),
  skyMotionMode: new FakeElement('skyMotionMode', 'static'),
  skyCreatorLibrary: new FakeElement('skyCreatorLibrary'),
  skyWizardComparePanel: new FakeElement('skyWizardComparePanel'),
  skyWizardCompareButton: new FakeElement('skyWizardCompareButton'),
  chartOutput: new FakeElement('chartOutput'),
  currentSkyOutput: new FakeElement('currentSkyOutput'),
  chartPanel: new FakeElement('chartPanel')
};
elements.chartPanel.dataset.skyChartMode = 'compare';
elements.skyWizardComparePanel.hidden = true;
elements.skyCreatorPaste.dataset.skyKind = 'chart';

const storage = new Map();
storage.set('relphiSkyChartSessionV1', JSON.stringify({
  skies: {
    chart: { name:'Sky A', notes:'', paste:'Sun,Aries,1,0', form:[] },
    currentSky: { name:'Sky B', notes:'', paste:'Moon,Taurus,2,0', motionMode:'dynamic', form:[] }
  },
  activeTarget: 'chart',
  compareOpen: true,
  chartMode: 'compare'
}));

const windowListeners = {};
const documentListeners = {};
const document = {
  visibilityState: 'visible',
  getElementById(id) { return elements[id] || null; },
  querySelector(selector) {
    if (selector === '[data-sky-chart-mode="compare"]') return { click() { elements.chartPanel.dataset.skyChartMode = 'compare'; } };
    return null;
  },
  querySelectorAll() { return []; },
  addEventListener(type, listener) { (documentListeners[type] ||= []).push(listener); }
};
const window = {
  location: { pathname:'/sky-chart.html' },
  addEventListener(type, listener) { (windowListeners[type] ||= []).push(listener); }
};

const source = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-refresh-persistence.js'), 'utf8');
vm.runInNewContext(source, {
  window,
  document,
  location:window.location,
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  MutationObserver: class { observe() {} },
  Event: class { constructor(type) { this.type = type; } },
  setTimeout,
  clearTimeout,
  console
});

setTimeout(() => {
  assert.deepEqual(imports.slice(0, 2), [
    { kind:'chart', value:'Sun,Aries,1,0' },
    { kind:'currentSky', value:'Moon,Taurus,2,0' }
  ], 'each paste snapshot imports before the shared editor switches targets');

  elements.skyCreatorTarget.value = 'chart';
  elements.skyCreatorPaste.dataset.skyKind = 'chart';
  elements.skyCreatorPaste.value = 'Sun,Leo,5,0';
  (windowListeners.pagehide || []).forEach(listener => listener());
  const saved = JSON.parse(storage.get('relphiSkyChartSessionV1'));
  assert.equal(saved.skies.chart.paste, 'Sun,Leo,5,0', 'pagehide flushes the active sky for Safari/iPhone refreshes');
  assert.equal(saved.version, 3);
  assert.equal(saved.skies.currentSky.motionMode, 'dynamic', 'Sky B Static/Dynamic choice survives refresh');
  assert.equal(saved.chartMode, 'compare', 'comparison language survives refresh');
  console.log('sky refresh persistence tests passed');
}, 2100);
