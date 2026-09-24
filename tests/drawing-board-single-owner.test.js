const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const nav = read('navloader.js');
const board = read('drawing-board-workflow-v2.js');
const css = read('drawing-board-workflow-v2.css');
const app = read('tarot-app.js');

assert.match(nav, /drawing-board-workflow-v2\.js\?v=96/);
[
  'drawing-board-interactions-v1.js',
  'drawing-board-template-lifecycle-v1.js',
  'drawing-board-spread-prefabs-v1.js',
  'drawing-board-options-transactional-v1.js',
  'drawing-board-render-geometry-v1.js',
  'drawing-board-chrome-ownership-v1.js'
].forEach(name => assert.doesNotMatch(nav, new RegExp(name.replaceAll('.', '\\.'))));
assert.doesNotMatch(nav, /relphi-drawing-board-ui-ready|relphi-drawing-board-ui-stable/);

['MutationObserver','relphi-drawing-board-ui-ready','relphi-drawing-board-ui-stable','Close Options'].forEach(needle => {
  assert.ok(!board.includes(needle), `unified Drawing Board must not contain ${needle}`);
});
['repair','reconcile','rehydrate','settling'].forEach(needle => {
  assert.ok(!board.toLowerCase().includes(needle), `unified Drawing Board must not use ${needle} lifecycle machinery`);
});

assert.match(app, /rowEnvelopeLayout:/);
assert.doesNotMatch(app, /DRAWING_BOARD_QUESTION_MAX/);
assert.doesNotMatch(app, /shortListPositionLabels[^\n]{0,180}slice\(0,\s*(?:90|96)\)/);
assert.match(app, /rowCardTransforms:/);
assert.match(app, /function rowCardTransform\(index\)[\s\S]{0,180}Math\.max\(\.32,/);
assert.match(app, /function normalizedPrefabTransform\(value = \{\}\)[\s\S]{0,260}scale: Math\.max\(\.32,/);
assert.match(app, /rowActiveLayout:/);
assert.match(app, /window\.RelphiDrawingBoardPrefabsBridge/);
assert.match(app, /window\.RelphiDrawingBoardOptionsBridge/);
assert.match(app, /window\.RelphiTarotLedgerBridge/);
assert.match(app, /document\.dispatchEvent\(new CustomEvent\('relphi:drawing-board-rendered'/);

assert.match(board, /Zoom Extents/);
assert.match(board, /zoomCardRowExtents/);
assert.match(board, /renderedContentBounds/);
assert.match(board, /workspace\.clientWidth/);
assert.match(board, /workspace\.clientHeight/);
assert.match(board, /relphi-workspace-tools/);
assert.match(board, /data-tool="more"/);
assert.doesNotMatch(board, /data-tool="snaps"/);
assert.doesNotMatch(board, /data-tool="background"/);
assert.match(board, /Unlock rotation & scale/);
assert.match(board, /Snaps/);
assert.match(board, /Background/);
assert.match(board, /installExportArea/);
assert.match(board, /drawing-board-post-export/);
assert.match(board, /relphi-reading-options-drawer/);
assert.match(board, /relphiResetBoard/);
assert.match(board, /relphiCancelOptions/);
assert.match(board, /relphiApplyOptions/);
assert.match(board, /optionsStructuralChanged/);
assert.doesNotMatch(board, /relphiBulkQuestions/);
assert.match(board, /parseBulkQuestions/);
assert.match(board, /const acceptCommaList=\(value\)=>/);
assert.match(board, /relphi-focus-reversed-badge/);
assert.doesNotMatch(board, /relphi-focus-draw/);
assert.match(board, /relphi-focus-position-panel[^\n]*relphi-focus-close/);
assert.match(board, /ArrowLeft/);
assert.match(board, /ArrowRight/);
assert.doesNotMatch(css, /relphi-bulk-questions/);
assert.match(board, /relphi-focus-reader/);
assert.match(board, /relphi-focus-strip/);
assert.doesNotMatch(board, /relphi-focus-fan/);
assert.match(board, /function installFocusStripScrub/);
assert.match(board, /drawnButtonAt/);
assert.match(board, /is-under-finger/);
assert.match(css, /\.relphi-focus-strip>button\.is-under-finger/);
assert.match(css, /\.relphi-focus-strip\.is-scrubbing/);
assert.doesNotMatch(board, /FOCUS_NAV_MODE_KEY|focusNavMode|renderFocusFan|installFocusFanScrub/);
assert.match(board, /delta>0 && current>=order\.length-1[\s\S]{0,160}configuredPositionCount\(\)===0[\s\S]{0,80}drawNextLogical\(panel\(\)\)/);
assert.doesNotMatch(css, /\.relphi-focus-fan/);
assert.doesNotMatch(css, /\.relphi-focus-strip>button[^\n]*transition:transform/);
assert.match(board, /keepFocusStripCurrentVisible/);
assert.match(board, /renderFocusStrip\(existingReader,index,\{preserveScroll:true\}\)/);
assert.doesNotMatch(board, /existingReader\.replaceWith\(reader\)/);
assert.match(board, /relphi-focus-art/);
assert.match(board, /function replaceFocusArt\(reader, artSource, cardId, reversed\)/);
assert.match(board, /previous\.replaceWith\(art\)/);
assert.match(board, /relphi-focus-entry/);
assert.match(board, /relphi-focus-position-panel/);
assert.match(board, /installFocusSwipe/);
assert.match(board, /renderCardEntry/);
assert.match(board, /acknowledgeCelticCrossing/);
assert.match(board, /celticCrossAcknowledged/);
assert.match(board, /event\.stopImmediatePropagation\(\)/);
assert.match(board, /swapPositionSlots/);
assert.match(board, /dataset\.relphiPositionId/);
assert.match(board, /function clearCardsOnly/);
assert.match(app, /rowCardManual/);
assert.match(app, /rowCardWasAddedManually/);

assert.match(css, /\.card-row-workspace\{[^}]*height:clamp\(28rem,62vh,40rem\)/);
assert.match(css, /@media\(max-width:700px\)[\s\S]*height:clamp\(23rem,58dvh,36rem\)/);
assert.match(css, /\.relphi-focus-reader\{/);
assert.match(css, /\.relphi-focus-main\{/);
assert.match(css, /\.relphi-focus-art\{/);
assert.match(css, /\.relphi-focus-entry\{/);
assert.match(css, /\.relphi-focus-position-panel\{/);
assert.match(css, /\.relphi-focus-shell\{[^}]*grid-template-rows:auto minmax\(0,1fr\) auto/);
assert.match(css, /\.relphi-focus-position-panel\{[^}]*overflow:visible!important/);
assert.match(css, /\.relphi-focus-art-frame\{[^}]*max-height:none!important/);
assert.doesNotMatch(css, /position-anchor:--relphi-focus-card-title/);
assert.match(css, /\.relphi-focus-art\.is-reversed\{/);
assert.match(css, /\.relphi-focus-strip\{/);
assert.doesNotMatch(css, /relphi-focus-card-host/);
assert.match(css, /\.card-row-action-staging\{display:none!important\}/);
assert.match(css, /card-row-workspace-toolbar:not\(\.relphi-board-controller\).*visibility:hidden!important/);
assert.match(css, /\.relphi-board-export\{/);
assert.match(css, /relphi-celtic-crossed[\s\S]*data-relphi-position-id="crossing"/);
assert.match(css, /relphi-transform-editing-unlocked/);
assert.doesNotMatch(css, /relphi-drawing-board-ui-ready|relphi-drawing-board-ui-stable/);

const storage = new Map();
const sandbox = {
  location:{ pathname:'/tarot.html' },
  localStorage:{ getItem:key => storage.get(key) ?? null, setItem:(key,value)=>storage.set(key,String(value)) },
  document:{ readyState:'loading', addEventListener(){}, getElementById(){return null;}, body:{classList:{add(){},remove(){}}}, querySelector(){return null;} },
  window:{ addEventListener(){} },
  Event,
  CustomEvent: class CustomEvent { constructor(type,options={}) { this.type=type; this.detail=options.detail; } },
  setTimeout(){ return 1; }, clearTimeout(){}, console
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;
vm.createContext(sandbox);
vm.runInContext(board, sandbox);
const registry = sandbox.window.RelphiDrawingBoardSpreadPrefabs;
assert.ok(registry, 'unified owner exposes spread registry');
assert.deepEqual(Array.from(registry.shipped, item => item.id), [
  'past-present-future-3',
  'situation-challenge-strategy-3',
  'choice-path-3',
  'relationship-check-in-5',
  'hope-and-comfort-5',
  'saturn-square-9',
  'celtic-cross-10',
  'six-polarities-houses-12',
  'focus-1'
]);
assert.ok(registry.shipped.every(item => item.source === 'shipped' && item.editable === false));
assert.equal(registry.byId('celtic-cross-11'), null);
const celtic = registry.byId('celtic-cross-10');
assert.equal(celtic.cardCount, 10);
assert.deepEqual(Array.from(celtic.positions, item => item.label), [
  '1 · What covers you','2 · What crosses you','3 · What crowns you','4 · What is beneath you','5 · What is behind you',
  '6 · What is before you','7 · Yourself','8 · Your house','9 · Your hopes or fears','10 · What will come'
]);
const cross = celtic.positions[1];
assert.deepEqual(JSON.parse(JSON.stringify(cross.canonicalTransform)), {x:.35,y:.34,scale:.48,rotation:0,zIndex:30});
assert.deepEqual(JSON.parse(JSON.stringify(cross.crossedTransform)), {x:.20,y:.34,scale:.48,rotation:90,zIndex:30});
const staff = celtic.positions.slice(6);
assert.ok(staff.every(item => item.transform.x === .70 && item.transform.scale === .44));
for (let i=1;i<staff.length;i++) assert.ok(Math.abs(staff[i-1].transform.y-staff[i].transform.y)*760 >= 170);
const polarities = registry.byId('six-polarities-houses-12');
assert.equal(new Set(polarities.positions.map(item => item.transform.x)).size, 4);
assert.equal(new Set(polarities.positions.map(item => item.transform.y)).size, 3);
const saturn = registry.byId('saturn-square-9');
assert.deepEqual(Array.from(saturn.positions, item => [item.transform.x,item.transform.y,item.transform.scale]), [
  [.04,.04,.58],[.36,.04,.58],[.68,.04,.58],[.04,.37,.58],[.36,.37,.58],[.68,.37,.58],[.04,.70,.58],[.36,.70,.58],[.68,.70,.58]
]);

console.log('Drawing Board single-owner checks passed.');
