const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const lifecycle = fs.readFileSync(path.join(root, 'drawing-board-template-lifecycle-v1.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

assert.match(nav, /drawing-board-custom-position-stickers-v1\.js\?v=1[\s\S]*drawing-board-template-lifecycle-v1\.js\?v=1[\s\S]*drawing-board-spread-prefabs-v1\.js\?v=11/);
assert.match(lifecycle, /id = 'clearShortListCardsOnly'/);
assert.match(lifecycle, /textContent = 'Clear Cards'/);
assert.match(lifecycle, /clear\.click\(\)/);
assert.match(lifecycle, /restoreAfterCardClear/);
assert.match(lifecycle, /bridge\(\)\?\.applyLayout\?\./);
assert.match(lifecycle, /templateFromValue/);
assert.match(lifecycle, /stageLayout\(layout\)/);
assert.match(lifecycle, /ensureSlotCount\(positions\.length\)/);
assert.match(lifecycle, /data-row-position-label-editor/);

class FakeMutationObserver {
  constructor() {}
  observe() {}
}

const sandbox = {
  location:{ pathname:'/tarot.html' },
  window:{},
  document:{
    readyState:'loading',
    addEventListener(){},
    querySelector(){ return null; },
    documentElement:{}
  },
  MutationObserver:FakeMutationObserver,
  requestAnimationFrame(callback){ callback(); },
  Event:class Event {},
  setTimeout,
  clearTimeout,
  console,
  JSON,
  Object,
  Array,
  Number,
  String
};
sandbox.window.window = sandbox.window;
sandbox.window.setTimeout = setTimeout;
vm.createContext(sandbox);
vm.runInContext(lifecycle, sandbox);

const api = sandbox.window.RelphiDrawingBoardTemplateLifecycle;
assert.ok(api, 'template lifecycle helpers should be exposed');

const layout = {
  name:'My Crossroads',
  positions:[
    { drawOrder:3, label:'Outcome' },
    { drawOrder:1, label:'Situation' },
    { drawOrder:2, label:'Choice' }
  ]
};
assert.deepEqual(Array.from(api.labelsFromLayout(layout)), ['Situation', 'Choice', 'Outcome']);
assert.equal(api.displayName(layout), '3 | My Crossroads');

const fallback = {
  name:'Unnamed labels',
  positions:[
    { drawOrder:2, label:'' },
    { drawOrder:1, label:'First' }
  ]
};
assert.deepEqual(Array.from(api.labelsFromLayout(fallback)), ['First', 'Position #2']);

console.log('Drawing Board template lifecycle regression checks passed.');
