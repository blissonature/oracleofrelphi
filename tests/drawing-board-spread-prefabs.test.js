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
    ['six-axes-cancer-leo-hinge-12', 12],
    ['focus-1', 1]
  ]
);
assert.ok(api.shipped.every(item => item.source === 'shipped' && item.editable === false));

const celtic10 = api.shipped.find(item => item.id === 'celtic-cross-10');
const celtic11 = api.shipped.find(item => item.id === 'celtic-cross-11');
const sixAxes = api.shipped.find(item => item.id === 'six-axes-cancer-leo-hinge-12');
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
assert.equal(celtic11.positions.find(item => item.id === 'behind').transform.x, .04);
assert.equal(celtic11.positions.find(item => item.id === 'before').transform.x, .46);
assert.equal(celtic10.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.equal(celtic11.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.ok(celtic10.positions.filter(item => item.openTransform).length >= 2);
assert.ok(celtic11.positions.filter(item => item.openTransform).length >= 3);
assert.deepEqual(
  Array.from(celtic10.positions.slice(0, 2), item => [item.transform.x, item.transform.y]),
  [[.25, .326], [.391, .390]],
  'the rotated crossing card should use the compensated origin that centers it over the covering card'
);
assert.deepEqual(
  Array.from(celtic11.positions.slice(0, 3), item => [item.transform.x, item.transform.y]),
  [[.25, .326], [.25, .326], [.391, .390]],
  'the significator and covering card share a center while the rotated crossing card uses a compensated origin'
);
assert.equal(celtic11.positions.find(item => item.role === 'crossing').transform.x, .391);
assert.equal(celtic11.positions.find(item => item.role === 'crossing').transform.y, .390);
assert.equal(
  JSON.stringify(celtic11.positions.slice(0, 3).map(item => item.openTransform.x)),
  JSON.stringify([.145, .25, .355]),
  'the open center should place its three cards side by side'
);
assert.equal(celtic11.positions[2].openTransform.rotation, 0);
assert.equal(
  JSON.stringify(celtic11.positions.slice(7).map(item => [item.transform.x, item.transform.y])),
  JSON.stringify([[.76, .718], [.76, .492], [.76, .266], [.76, .04]]),
  'the right-hand ladder should rise from Self to Outcome'
);
assert.ok(Math.abs(celtic11.positions[0].openTransform.x - celtic11.positions.find(item => item.id === 'behind').transform.x - .105) < 1e-12);
assert.ok(Math.abs(celtic11.positions[1].openTransform.x - celtic11.positions[0].openTransform.x - .105) < 1e-12);
assert.ok(Math.abs(celtic11.positions[2].openTransform.x - celtic11.positions[1].openTransform.x - .105) < 1e-12);
assert.ok(Math.abs(celtic11.positions.find(item => item.id === 'before').transform.x - celtic11.positions[2].openTransform.x - .105) < 1e-12);
assert.ok(Math.abs(celtic11.positions[1].openTransform.y - celtic11.positions.find(item => item.id === 'crowning').transform.y - .226) < 1e-12);
assert.ok(Math.abs(celtic11.positions.find(item => item.id === 'beneath').transform.y - celtic11.positions[1].openTransform.y - .226) < 1e-12);

assert.equal(sixAxes.helper, 'six-axis-hinge');
assert.equal(sixAxes.cardCount, 12);
assert.deepEqual(
  Array.from(sixAxes.positions, item => item.label),
  [
    '1 · Aries · I',
    '2 · Taurus · Mine',
    '3 · Gemini · Word',
    '4 · Cancer · Interior',
    '5 · Leo · Heart',
    '6 · Virgo · Distinction',
    '7 · Libra · You',
    '8 · Scorpio · Ours',
    '9 · Sagittarius · Meaning',
    '10 · Capricorn · Form',
    '11 · Aquarius · Field',
    '12 · Pisces · Dissolution'
  ]
);
assert.equal(sixAxes.positions.find(item => item.id === 'aries-i').transform.y, sixAxes.positions.find(item => item.id === 'libra-you').transform.y);
assert.equal(sixAxes.positions.find(item => item.id === 'cancer-interior').transform.x, sixAxes.positions.find(item => item.id === 'leo-heart').transform.x);
assert.ok(sixAxes.positions.find(item => item.id === 'leo-heart').transform.y > sixAxes.positions.find(item => item.id === 'cancer-interior').transform.y);

assert.match(source, /return prefab\.cardCount \+ ' \| ' \+ prefab\.name/);
assert.match(source, /Save As Copy and Use/);
assert.match(source, /Save Template and Use/);
assert.match(source, />Use Once</);
assert.match(source, /id="relphiTemplateNameInput"/);
assert.match(source, /Template name/);
assert.match(source, /Design Template/);
assert.match(source, /id = 'relphiLabelsToggle'/);
assert.match(source, /className = 'relphi-labels-drawer'/);
assert.match(source, /toggle\.textContent = 'Templates'/);
assert.match(source, /class="relphi-template-picker"/);
assert.match(source, /class="relphi-template-chevron"/);
assert.match(source, /data-template-new="true"/);
assert.match(source, /data-template-id=/);
assert.match(source, /field\.removeAttribute\('list'\)/);
assert.match(source, /Position labels/);
assert.match(source, /Name the template, then type its comma-separated position labels above/);
assert.match(source, /templateMenuOpen/);
assert.match(source, /background:#fffdf8/);
assert.match(source, /background:#f5f0e9/);
assert.match(source, /border-right:1\.6px solid currentColor/);
assert.match(source, /rotate\(225deg\)/);
assert.doesNotMatch(source, /NEW_TEMPLATE_OPTION/);
assert.doesNotMatch(source, /NEW_TEMPLATE_PROMPT/);
assert.doesNotMatch(source, /renderOmniboxOptions/);
assert.doesNotMatch(source, /field\.setAttribute\('list'/);
assert.match(source, /className = 'relphi-template-eye'/);
assert.match(source, /quickLabel\.parentElement !== positionHost/);
assert.match(source, /Hide position labels on the board/);
assert.match(source, /relphi-eye-slash/);
assert.doesNotMatch(source, /name="relphiTemplateMode"/);
assert.doesNotMatch(source, /class="relphi-template-mode"/);
assert.match(source, /Customize Template/);
assert.match(source, /data-prefab-action="cancel"/);
assert.match(source, /document\.getElementById\('clearShortList'\)\?\.click/);
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
assert.match(source, /relphiCenterZoomSync/);
assert.match(source, /zoomInput\?\.addEventListener\('input', restoreCenterView\)/);
assert.match(source, /zoomInput\?\.addEventListener\('change', restoreCenterView\)/);
assert.match(source, /event\.ctrlKey \|\| event\.metaKey/);
assert.match(source, /six-axis-hinge/);
assert.match(source, /Cancer \| Leo/);
assert.match(source, /held within → radiant/);
assert.match(source, /relphiDrawingBoardSpreadPrefabsV2/);
assert.match(source, /relphiDrawingBoardStickerPrefabsV1/);
assert.match(source, /SHIPPED\.some\(item => item\.id === clean\.id\)/);
assert.match(source, /button:disabled\{opacity:\.45!important;cursor:default!important\}/);
assert.match(source, /function addWorkspaceControls/);
assert.doesNotMatch(source, /card-row-transform-drawer/);
assert.doesNotMatch(source, /data-row-drawer-field/);
assert.match(source, /opacity:0!important/);
assert.match(source, /is-recently-used/);
assert.match(source, /zoomCardRowExtents/);
assert.match(source, /right:\.75rem!important;bottom:\.75rem!important;top:auto!important;left:auto!important/);
assert.match(source, /writing-mode:horizontal-tb!important/);
assert.doesNotMatch(source, /card-row-workspace-toolbar\{position:absolute!important;top:\.55rem!important;left:\.55rem!important/);
assert.doesNotMatch(source, /cursor:not-allowed/);
assert.doesNotMatch(source, /drawnCardIds|readingName|readingNotes/);

assert.match(app, /rowActiveLayout:\s*cloneBoardValue\(state\.rowActiveLayout,\s*null\)/);
assert.match(app, /rowCenterOpen/, 'temporary Celtic view state should exist');
assert.doesNotMatch(app, /rowCenterOpen:\s*state\.rowCenterOpen/, 'temporary Celtic view must not persist in the board snapshot');
assert.match(app, /state\.rowLayoutLocked = true/);
assert.match(app, /relphi:drawing-board-rendered/);
assert.match(source, /draftName = String\(state\.currentLayout\.name/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=12/);

console.log('Drawing Board spread prefab regression checks passed.');
