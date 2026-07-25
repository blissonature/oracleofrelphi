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
assert.equal(api.shipped.length, 9);
assert.deepEqual(
  Array.from(api.shipped, item => [item.id, item.cardCount]),
  [
    ['past-present-future-3', 3],
    ['situation-challenge-strategy-3', 3],
    ['choice-path-3', 3],
    ['relationship-check-in-5', 5],
    ['hope-and-comfort-5', 5],
    ['saturn-square-9', 9],
    ['celtic-cross-10', 10],
    ['celtic-cross-11', 11],
    ['focus-1', 1]
  ]
);
assert.ok(api.shipped.every(item => item.source === 'shipped' && item.editable === false));

const celtic10 = api.shipped.find(item => item.id === 'celtic-cross-10');
const celtic11 = api.shipped.find(item => item.id === 'celtic-cross-11');
assert.equal(celtic10.positions.find(item => item.role === 'crossing').crosses, 'covering');
assert.equal(celtic11.positions.find(item => item.role === 'covering').covers, 'significator');
assert.equal(celtic11.positions.find(item => item.role === 'crossing').crosses, 'covering');
assert.equal(celtic11.positions[0].label, 'Significator');
assert.deepEqual(
  Array.from(celtic10.positions, item => item.label),
  [
    '1 · What covers you',
    '2 · What crosses you',
    '3 · What crowns you',
    '4 · What is beneath you',
    '5 · What is behind you',
    '6 · What is before you',
    '7 · Yourself',
    '8 · Your house',
    '9 · Your hopes or fears',
    '10 · What will come'
  ]
);
assert.equal(celtic10.positions.find(item => item.id === 'behind').transform.x, .62);
assert.equal(celtic10.positions.find(item => item.id === 'before').transform.x, 0);
assert.equal(celtic11.positions.find(item => item.id === 'behind').transform.x, .62);
assert.equal(celtic11.positions.find(item => item.id === 'before').transform.x, 0);
assert.equal(celtic10.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.equal(celtic11.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.ok(celtic10.positions.filter(item => item.openTransform).length >= 2);
assert.ok(celtic11.positions.filter(item => item.openTransform).length >= 3);

assert.match(source, /return prefab\.cardCount \+ ' \| ' \+ prefab\.name/);
assert.match(source, /Save As Copy and Use/);
assert.match(source, /Save Template and Use/);
assert.match(source, />Use Once</);
assert.match(source, /Spread Template labels/);
assert.match(source, /renderOmniboxOptions\(datalist\)/);
assert.match(source, /id="relphiSpreadDesignName"/);
assert.match(source, /card count plus template name must be unique/);
assert.match(source, /templateNameConflict\(name, state\.slotCount\)/);
assert.match(source, /Design Template/);
assert.match(source, /id = 'relphiLabelsToggle'/);
assert.match(source, /className = 'relphi-labels-drawer'/);
assert.match(source, /toggle\.textContent = 'Templates'/);
assert.match(source, /NEW_TEMPLATE_OPTION = 'New'/);
assert.match(source, /Create a new Spread Template/);
assert.match(source, /NEW_TEMPLATE_PROMPT = 'Enter your own comma-separated position labels…'/);
assert.match(source, /id = 'relphiTemplateClear'/);
assert.match(source, /Clear template selection/);
assert.match(source, /field\.value = labelsValue\(match\)/);
assert.match(source, /newPromptArmed = false/);
assert.match(source, /className = 'relphi-template-eye'/);
assert.match(source, /Hide position stickers/);
assert.match(source, /relphi-eye-slash/);
assert.doesNotMatch(source, /name="relphiTemplateMode"/);
assert.doesNotMatch(source, /class="relphi-template-mode"/);
assert.match(source, /Edit as Copy/);
assert.match(source, /Finish from the Templates drawer/);
assert.match(source, /Situation, Challenge, Strategy/);
assert.match(source, /Option A', 'Option B', 'Advice/);
assert.match(source, /You', 'Other', 'Bond', 'Challenge', 'Next step/);
assert.match(source, /Confusion', 'Comfort', 'Lesson', 'Support', 'Next step/);
assert.match(source, /gridPositions\(\['Focus'\]\)/);
assert.doesNotMatch(source, /relphiSpreadPrefabSelect/);
assert.doesNotMatch(source, /window\.prompt/);
assert.match(source, /Open Center/);
assert.match(source, /Restore Cross/);
assert.match(source, /relphiDrawingBoardSpreadPrefabsV2/);
assert.match(source, /relphiDrawingBoardStickerPrefabsV1/);
assert.match(source, /SHIPPED\.some\(item => item\.id === clean\.id\)/);
assert.match(source, /button:disabled\{opacity:\.45!important;cursor:default!important\}/);
assert.doesNotMatch(source, /cursor:not-allowed/);
assert.doesNotMatch(source, /drawnCardIds|readingName|readingNotes/);

assert.match(app, /rowActiveLayout:\s*cloneBoardValue\(state\.rowActiveLayout,\s*null\)/);
assert.match(app, /rowCenterOpen/, 'temporary Celtic view state should exist');
assert.doesNotMatch(app, /rowCenterOpen:\s*state\.rowCenterOpen/, 'temporary Celtic view must not persist in the board snapshot');
assert.match(app, /state\.rowLayoutLocked = true/);
assert.match(app, /relphi:drawing-board-rendered/);
assert.match(source, /draftName = copySourceId \|\|/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=7/);

console.log('Drawing Board spread prefab regression checks passed.');
