const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'drawing-board-spread-prefabs-v1.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=38/);

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
    ['six-polarities-houses-12', 12],
    ['focus-1', 1]
  ]
);
assert.ok(api.shipped.every(item => item.source === 'shipped' && item.editable === false));
assert.equal(api.shipped.some(item => item.id === 'celtic-cross-11'), false);
assert.doesNotMatch(source, /id:'celtic-cross-11'/);
assert.match(source, /RETIRED_PREFAB_IDS = new Set\(\['celtic-cross-11'\]\)/);

const celtic10 = api.shipped.find(item => item.id === 'celtic-cross-10');
const polarities = api.shipped.find(item => item.id === 'six-polarities-houses-12');
assert.deepEqual(
  Array.from(polarities.positions.slice().sort((a,b) => a.drawOrder - b.drawOrder), item => item.label),
  ['Aries','Libra','Taurus','Scorpio','Gemini','Sagittarius','Cancer','Capricorn','Leo','Aquarius','Virgo','Pisces']
);
const polarityColumns = [
  ['Aries','Libra'],
  ['Taurus','Scorpio'],
  ['Gemini','Sagittarius'],
  ['Cancer','Capricorn'],
  ['Leo','Aquarius'],
  ['Virgo','Pisces']
];
assert.equal(new Set(polarities.positions.map(item => item.transform.x)).size, 6, 'Six Polarities should use six columns');
assert.equal(new Set(polarities.positions.map(item => item.transform.y)).size, 2, 'Six Polarities should use two rows');
polarityColumns.forEach(([top, bottom]) => {
  const topPosition = polarities.positions.find(item => item.label === top);
  const bottomPosition = polarities.positions.find(item => item.label === bottom);
  assert.equal(topPosition.transform.x, bottomPosition.transform.x, top + ' / ' + bottom + ' should share a column');
  assert.notEqual(topPosition.transform.y, bottomPosition.transform.y, top + ' / ' + bottom + ' should occupy separate rows');
});
assert.ok(polarities.positions.every(item => item.transform.scale === .83), 'Six Polarities cards should use the largest practical six-column scale');
const polarityXs = Array.from(new Set(polarities.positions.map(item => item.transform.x))).sort((a,b) => a - b);
const polarityYs = Array.from(new Set(polarities.positions.map(item => item.transform.y))).sort((a,b) => a - b);
assert.deepEqual(polarityXs, [.01304,.17573,.33842,.50111,.6638,.82649], 'Six Polarities should fill the board as a centered six-column block');
assert.deepEqual(polarityYs, [.07408,.5], 'Six Polarities opposition rows should touch edge-to-edge');
for (let i = 1; i < polarityXs.length; i += 1) {
  const cardWidth = 174 * .83 / 900;
  const gapPx = ((polarityXs[i] - polarityXs[i - 1]) - cardWidth) * 900;
  assert.ok(Math.abs(gapPx - 2) < .05, 'Six Polarities horizontal gaps should be about 2px');
}
const cardHeight = 390 * .83 / 760;
const verticalGapPx = ((polarityYs[1] - polarityYs[0]) - cardHeight) * 760;
assert.ok(Math.abs(verticalGapPx) < .05, 'Each opposition pair should touch with zero vertical gap');
assert.equal(celtic10.positions.find(item => item.role === 'crossing').crosses, 'covering');
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
assert.equal(celtic10.positions.find(item => item.role === 'crossing').transform.rotation, 90);
assert.deepEqual(
  Array.from(celtic10.positions.slice(6).map(item => [item.transform.x, item.transform.y])),
  [[.76,.48],[.76,.36],[.76,.24],[.76,.12]]
);

assert.ok(celtic10.positions.filter(item => item.openTransform).length >= 2);
assert.equal(
  JSON.stringify(celtic10.positions.slice(0, 2).map(item => [item.transform.x, item.transform.y])),
  JSON.stringify([[.25, .326], [.25, .326]]),
  'the ten-card center should pile before being opened'
);

assert.match(source, /return prefab\.cardCount \+ ' \| ' \+ prefab\.name/);
assert.match(source, /Save As Copy and Use/);
assert.match(source, /Save Template and Use/);
assert.match(source, />Use Once</);
assert.match(source, /id="relphiSpreadTemplateSelect"/);
assert.match(source, /<select id="relphiSpreadTemplateSelect"/);
assert.match(source, /Custom \/ no saved template/);
assert.doesNotMatch(source, /New template…/);
assert.match(source, /<strong>Add labels<\/strong>/);
assert.match(source, /Save as Template/);
assert.match(source, /id="relphiSaveLabelsAsTemplate"/);
assert.match(source, /id="relphiLabelTemplateName"/);
assert.match(source, /function saveLabelsAsTemplate/);
assert.match(source, /ensureLabelTemplateSaver\(panel, field, builder\)/);
assert.match(source, /#addCardPlaceholder\{display:none!important\}/);
assert.match(source, /drawing-board-top-actions/);
assert.match(source, /card-row-workspace>\.drawing-board-primary-actions[\s\S]{0,140}display:none!important/);
assert.match(source, /relphi-reading-options-drawer \.board-reading-toggle-stack[\s\S]{0,260}display:flex!important[\s\S]{0,160}flex-wrap:nowrap!important/);
assert.match(source, /relphi-reading-options-drawer \.board-reading-toggle-stack>label[\s\S]{0,520}flex:1 1 0!important/);
assert.match(source, /width:min\(29rem/);
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
assert.match(source, /relphi-celtic-crossing-rotated/);
assert.match(source, /card-row-item\.relphi-celtic-crossing-rotated>\.card-row-drop-card/);
assert.match(source, /card-row-drop-card-inner\{transform:rotate\(-90deg\)!important\}/);
assert.match(source, /relphi-celtic-crossing-rotated\{background:transparent!important/);
assert.match(source, /translate\(-50%,-5\.25rem\)!important/);
assert.match(source, /card-row-drop-card-inner\{display:none!important\}/);
assert.match(source, /position\.role === 'crossing'/);
assert.doesNotMatch(source, /content:\"OFF\"/);
assert.doesNotMatch(source, /content:\"ON\"/);
assert.match(source, /relphiDrawingBoardSpreadPrefabsV2/);
assert.match(source, /relphiDrawingBoardStickerPrefabsV1/);
assert.match(source, /SHIPPED\.some\(item => item\.id === clean\.id\)/);
assert.match(source, /button:disabled\{opacity:\.45!important;cursor:default!important\}/);
assert.match(source, /function withDefaultRules\(prefab\)/);
assert.match(source, /allowReversals:ready\.rules\?\.allowReversals !== false/);
assert.match(source, /function enablePositionStickers\(\)/);
assert.match(source, /if \(clean\.length\) enablePositionStickers\(\)/);
assert.match(source, /rowPositionStickersQuick/);
assert.match(source, /drawScope:String\(ready\.rules\?\.drawScope \|\| 'full'\)/);
assert.match(source, /const ready = withDefaultRules\(prefab\)/);
assert.match(source, /window\.RelphiDrawingBoardSetPositionStickers\?\.\(true\)/);
assert.doesNotMatch(source, /\['rowPositionLabels','rowDrawScope','rowAllowRepeats','rowAllowReversalsQuick'/);
assert.match(source, /editor\.contentEditable = 'true'/);
assert.match(source, /function addWorkspaceControls/);
assert.match(source, /var\(--relphi-board-texture,none\)/);
assert.match(source, /background-color:var\(--row-table-bg,#7d1f28\)!important/);
assert.doesNotMatch(source, /row-grid-size/);
assert.match(app, /rowTableColor: '#7d1f28'/);
assert.match(app, /state\.rowTableColor = '#7d1f28'/);
assert.doesNotMatch(source, /card-row-transform-drawer/);
assert.doesNotMatch(source, /data-row-drawer-field/);
assert.match(source, /zoomCardRowExtents/);
assert.match(source, /function fitActiveLayoutOnMobile\(\)/);
assert.match(source, /function ensureMobileLayoutFit\(panel, state\)/);
assert.match(source, /panel\.dataset\.relphiMobileFitSignature/);
assert.match(source, /window\.visualViewport\?\.height/);
assert.match(source, /viewportHeight \* \.52/);
assert.match(source, /fitActiveLayoutOnMobile\(\)/);
assert.match(source, /position:fixed!important;top:4\.25rem/);
assert.match(source, /height:clamp\(22rem,56dvh,34rem\)!important/);
assert.match(source, /zoom\.step = '\.025'/);
assert.match(source, /zoom\.min = '\.35'/);
assert.match(source, /zoomWord\.textContent = 'Zoom'/);
assert.match(source, /center\.hidden = true/);
assert.match(source, /right:\.65rem!important;bottom:\.65rem!important/);
assert.match(source, /left:410px;top:610px/);
assert.match(source, /writing-mode:horizontal-tb!important/);
assert.doesNotMatch(source, /cursor:not-allowed/);
assert.match(source, /board-reading-toggle-stack>label::after\{content:\"?none/);
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

console.log('Drawing Board spread prefab regression checks passed.');
