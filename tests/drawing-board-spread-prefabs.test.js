const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'drawing-board-spread-prefabs-v1.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

const storage = new Map();
const document = {
  readyState:'loading',
  addEventListener(){},
  head:{ appendChild(){} },
  body:{}
};
const sandbox = {
  location:{ pathname:'/tarot.html' },
  document,
  localStorage:{
    getItem(key){ return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value){ storage.set(key, String(value)); },
    removeItem(key){ storage.delete(key); }
  },
  MutationObserver:class { observe(){} },
  window:{},
  console,
  setTimeout(){ return 1; },
  clearTimeout(){}
};
sandbox.window.window = sandbox.window;
sandbox.window.document = document;
sandbox.window.location = sandbox.location;
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const api = sandbox.window.RelphiDrawingBoardSpreadPrefabs;
assert.ok(api, 'prefab registry should be exposed for integration and regression checks');
assert.equal(api.shipped.length, 4);
assert.deepEqual(
  Array.from(api.shipped, item => [item.id, item.cardCount]),
  [
    ['past-present-future-3', 3],
    ['saturn-square-9', 9],
    ['celtic-cross-10', 10],
    ['celtic-cross-11', 11]
  ]
);
assert.ok(api.shipped.every(item => item.source === 'shipped' && item.editable === false));

const celtic10 = api.shipped.find(item => item.id === 'celtic-cross-10');
const celtic11 = api.shipped.find(item => item.id === 'celtic-cross-11');
assert.equal(celtic10.positions.find(item => item.role === 'crossing').crosses, 'covering');
assert.equal(celtic11.positions.find(item => item.role === 'covering').covers, 'significator');
assert.equal(celtic11.positions.find(item => item.role === 'crossing').crosses, 'covering');
assert.ok(celtic10.positions.filter(item => item.openTransform).length >= 2);
assert.ok(celtic11.positions.filter(item => item.openTransform).length >= 3);

assert.match(source, /return prefab\.cardCount \+ ' \| ' \+ prefab\.name/);
assert.match(source, /Save as Prefab and Use/);
assert.match(source, />Use Once</);
assert.match(source, /Open Center/);
assert.match(source, /Restore Cross/);
assert.match(source, /relphiDrawingBoardSpreadPrefabsV2/);
assert.match(source, /SHIPPED\.some\(item => item\.id === clean\.id\)/);
assert.doesNotMatch(source, /drawnCardIds|readingName|readingNotes/);

assert.match(app, /rowActiveLayout:\s*cloneBoardValue\(state\.rowActiveLayout,\s*null\)/);
assert.match(app, /rowCenterOpen/, 'temporary Celtic view state should exist');
assert.doesNotMatch(app, /rowCenterOpen:\s*state\.rowCenterOpen/, 'temporary Celtic view must not persist in the board snapshot');
assert.match(app, /state\.rowLayoutLocked = true/);
assert.match(app, /relphi:drawing-board-rendered/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=1/);

console.log('Drawing Board spread prefab regression checks passed.');
