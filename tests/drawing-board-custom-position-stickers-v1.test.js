const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const hotfix = fs.readFileSync(path.join(root, 'drawing-board-custom-position-stickers-v1.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

assert.match(nav, /drawing-board-custom-position-stickers-v1\.js\?v=1[\s\S]*drawing-board-spread-prefabs-v1\.js\?v=11/);
assert.match(hotfix, /this\.id === 'rowPositionLabels'/);
assert.match(hotfix, /listener\.name === 'chooseFromOmnibox'/);
assert.match(hotfix, /field\.value = ''/);
assert.match(hotfix, /field\.value = rawValue/);

class FakeEventTarget {
  constructor() {
    this.listeners = [];
  }
  addEventListener(type, listener, options) {
    this.listeners.push({ type, listener, capture: options === true || !!options?.capture });
  }
  dispatch(type) {
    const event = {
      type,
      defaultPrevented:false,
      immediateStopped:false,
      propagationStopped:false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.immediateStopped = true; },
      stopPropagation() { this.propagationStopped = true; }
    };
    const matches = this.listeners.filter(item => item.type === type);
    for (const item of matches.filter(item => item.capture)) {
      item.listener.call(this, event);
      if (event.immediateStopped) return event;
    }
    for (const item of matches.filter(item => !item.capture)) {
      item.listener.call(this, event);
      if (event.immediateStopped) return event;
    }
    return event;
  }
}

const options = [
  { value:'New' },
  { value:'3 | Past, Present, Future' }
];
const sandbox = {
  location:{ pathname:'/tarot.html' },
  window:{
    RelphiDrawingBoardPrefabsBridge:{ getState(){ return { designMode:false }; } }
  },
  document:{ querySelectorAll(){ return options; } },
  EventTarget:FakeEventTarget,
  Proxy,
  Reflect,
  Array,
  String
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(hotfix, sandbox);

const field = new FakeEventTarget();
field.id = 'rowPositionLabels';
field.value = '';
const seen = { prefabValues:[], nativeValues:[] };

function chooseFromOmnibox(event) {
  seen.prefabValues.push(field.value);
  event.preventDefault();
  event.stopImmediatePropagation();
}

field.addEventListener('input', chooseFromOmnibox, true);
field.addEventListener('change', chooseFromOmnibox, true);
field.addEventListener('input', function () {
  seen.nativeValues.push(field.value);
});

field.value = 'Situation, Challenge, Strategy';
const customEvent = field.dispatch('input');
assert.equal(customEvent.immediateStopped, false, 'free text must not be consumed by the prefab handler');
assert.equal(customEvent.defaultPrevented, false, 'free text must reach the original Drawing Board input handler');
assert.equal(seen.prefabValues.at(-1), '', 'prefab state update must not mistake labels for a template name');
assert.equal(seen.nativeValues.at(-1), 'Situation, Challenge, Strategy', 'native position-label logic must receive the typed labels');

field.value = '3 | Past, Present, Future';
const templateEvent = field.dispatch('input');
assert.equal(templateEvent.immediateStopped, true, 'an exact template choice should still be consumed by the prefab handler');
assert.equal(templateEvent.defaultPrevented, true, 'template selection should retain its existing behavior');
assert.equal(seen.prefabValues.at(-1), '3 | Past, Present, Future');
assert.notEqual(seen.nativeValues.at(-1), '3 | Past, Present, Future', 'template names must not become custom position labels');

console.log('Drawing Board custom position sticker regression checks passed.');
