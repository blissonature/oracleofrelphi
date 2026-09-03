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
assert.equal(api.shipped.length, 10);
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
    ['six-polarities-houses-12', 12],
    ['focus-1', 1]
  ]
);
assert.ok(api.shipped.every(item => item.source === 'shipped' && item.editable === false));

const celtic10 = api.shipped.find(item => item.id === 'celtic-cross-10');
const celtic11 = api.shipped.find(item => item.id === 'celtic-cross-11');
const polarities = api.shipped.find(item => item.id === 'six-polarities-houses-12');
assert.deepEqual(
  Array.from(polarities.positions.slice().sort((a,b) => a.drawOrder - b.drawOrder), item => item.label),
  ['Aries','Libra','Taurus','Scorpio','Gemini','Sagittarius','Cancer','Capricorn','Leo','Aquarius','Virgo','Pisces']
);
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
assert.equal(celtic10.positions.find(item => item.id === 'behind').transform.x, .04);
assert.equal(celtic10.positions.find(item => item.id === 'before').transform.x, .46);
assert.equal(celtic11.positions.find(item => item.id === 'behind').transform.x, .03);
assert.equal(celtic11.positions.find(item => item.id === 'before').transform.x, .57);
assert.equal(celtic10.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.equal(celtic11.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.ok(celtic10.positions.filter(item => item.openTransform).length >= 2);
assert.ok(celtic11.positions.filter(item => item.openTransform).length >= 3);
assert.equal(
  JSON.stringify(celtic10.positions.slice(0, 2).map(item => [item.transform.x, item.transform.y])),
  JSON.stringify([[.25, .326], [.25, .326]]),
  'the ten-card center should pile before being opened'
);
assert.equal(
  JSON.stringify(celtic11.positions.slice(0, 3).map(item => [item.transform.x, item.transform.y])),
  JSON.stringify([[.30, .36], [.30, .36], [.30, .36]]),
  'significator, cover, and cross should share one piled center'
);
assert.equal(
  JSON.stringify(celtic11.positions.slice(0, 3).map(item => item.openTransform.x)),
  JSON.stringify([.16, .30, .44]),
  'the open center should place its three cards side by side'
);
assert.equal(celtic11.positions[2].openTransform.rotation, 0);
assert.equal(
  JSON.stringify(celtic11.positions.slice(7).map(item => [item.transform.x, item.transform.y])),
  JSON.stringify([[.82, .70], [.82, .49], [.82, .28], [.82, .07]]),
  'the right-hand ladder should rise from Self to Outcome'
);
assert.ok(Math.abs(celtic11.positions[0].openTransform.x - celtic11.positions.find(item => item.id === 'behind').transform.x - .13) < 1e-12);
assert.ok(Math.abs(celtic11.positions[1].openTransform.x - celtic11.positions[0].openTransform.x - .14) < 1e-12);
assert.ok(Math.abs(celtic11.positions[2].openTransform.x - celtic11.positions[1].openTransform.x - .14) < 1e-12);
assert.ok(Math.abs(celtic11.positions.find(item => item.id === 'before').transform.x - celtic11.positions[2].openTransform.x - .13) < 1e-12);
assert.ok(Math.abs(celtic11.positions[1].openTransform.y - celtic11.positions.find(item => item.id === 'crowning').transform.y - .29) < 1e-12);
assert.ok(Math.abs(celtic11.positions.find(item => item.id === 'beneath').transform.y - celtic11.positions[1].openTransform.y - .29) < 1e-12);

assert.match(source, /return prefab\.cardCount \+ ' \| ' \+ prefab\.name/);
assert.match(source, /Save As Copy and Use/);
assert.match(source, /Save Template and Use/);
assert.match(source, />Use Once</);
assert.match(source, /id="relphiSpreadTemplateSelect"/);
assert.match(source, /<select id="relphiSpreadTemplateSelect"/);
assert.match(source, /Custom \/ no saved template/);
assert.match(source, /New template…/);
assert.match(source, /Position labels/);
assert.match(source, /Template name<input id="relphiSpreadDesignName"/);
assert.doesNotMatch(source, /Spread and draw settings are locked while cards are on the board/);
assert.match(source, /control\.disabled = !!state\.designMode/);
assert.match(source, /editor\.contentEditable = 'true'/);
assert.match(source, /applyForUse\(prefab\)/);
assert.match(source, /stagePrefab\(prefab\)/);
assert.match(source, /syncTypedLabels/);
assert.match(source, /relphiTemplateClear/);
assert.match(source, /right:2\.05rem/);
assert.match(source, /border:0!important/);
assert.doesNotMatch(source, />Use Template</);
assert.doesNotMatch(source, /Customize a Copy/);
assert.doesNotMatch(source, /Active layout locked/);
assert.match(source, /if \(select\.innerHTML !== optionsHtml\) select\.innerHTML = optionsHtml/);
assert.match(source, /if \(editor\.innerHTML !== editorHtml\)/);
assert.doesNotMatch(source, /id = 'relphiLabelsToggle'/);
assert.doesNotMatch(source, /className = 'relphi-labels-drawer'/);
assert.doesNotMatch(source, /Finish from the Templates drawer/);
assert.match(source, /Finish in Board Options/);
assert.match(source, /Design Template/);
assert.match(source, /data-prefab-action="cancel"/);
assert.match(source, /document\.getElementById\('clearShortList'\)\?\.click/);
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
assert.match(source, /function withDefaultRules\(prefab\)/);
assert.match(source, /allowReversals:ready\.rules\?\.allowReversals !== false/);
assert.match(source, /drawScope:String\(ready\.rules\?\.drawScope \|\| 'full'\)/);
assert.match(source, /const ready = withDefaultRules\(prefab\)/);
assert.doesNotMatch(source, /\['rowPositionLabels','rowDrawScope','rowAllowRepeats','rowAllowReversalsQuick'/);
assert.match(source, /editor\.contentEditable = 'true'/);
assert.match(source, /function addWorkspaceControls/);
assert.doesNotMatch(source, /card-row-transform-drawer/);
assert.doesNotMatch(source, /data-row-drawer-field/);
assert.match(source, /zoomCardRowExtents/);
assert.match(source, /zoom\.step = '\.025'/);
assert.match(source, /zoom\.min = '\.35'/);
assert.match(source, /zoomWord\.textContent = 'Zoom'/);
assert.match(source, /center\.hidden = true/);
assert.match(source, /right:\.65rem!important;bottom:\.65rem!important/);
assert.match(source, /writing-mode:horizontal-tb!important/);
assert.doesNotMatch(source, /cursor:not-allowed/);
assert.match(source, /board-reading-toggle-stack>label::after/);
assert.doesNotMatch(source, /'rowSnapEnabled','rowRotationSnapEnabled'/);
assert.doesNotMatch(source, /drawnCardIds|readingName|readingNotes/);

assert.match(app, /rowActiveLayout:\s*cloneBoardValue\(state\.rowActiveLayout,\s*null\)/);
assert.match(app, /rowCenterOpen/, 'temporary Celtic view state should exist');
assert.doesNotMatch(app, /rowCenterOpen:\s*state\.rowCenterOpen/, 'temporary Celtic view must not persist in the board snapshot');
assert.match(app, /state\.rowLayoutLocked = true/);
assert.match(app, /rowAllowReversals: true/);
assert.match(app, /option\('full','Full Pack'\)/);
assert.doesNotMatch(app, /const editable = !state\.rowLayoutLocked \|\| state\.rowLayoutDesignMode/);
assert.doesNotMatch(app, /labels\.addEventListener\('input',[\s\S]{0,180}rowLayoutLocked/);
assert.match(app, /relphi:drawing-board-rendered/);
assert.match(source, /draftName = String\(state\.currentLayout\.name/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=22/);

console.log('Drawing Board spread prefab regression checks passed.');
