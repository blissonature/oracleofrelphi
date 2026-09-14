const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const interactions = read('drawing-board-interactions-v1.js');
const lifecycle = read('drawing-board-template-lifecycle-v1.js');
const options = read('drawing-board-options-transactional-v1.js');
const renderGeometry = read('drawing-board-render-geometry-v1.js');
const chrome = read('drawing-board-chrome-ownership-v1.js');

// Exactly one loaded owner is allowed to define spread geometry.
assert.match(lifecycle, /single owner of spread geometry/);
assert.match(lifecycle, /window\.RelphiDrawingBoardLayoutController/);
assert.match(lifecycle, /delete base\.helper/);
assert.match(lifecycle, /canonicalTransform:open \|\| closed/);
assert.match(lifecycle, /\['behind', transform\(\.02,\.313/);
assert.match(lifecycle, /\['self', transform\(\.40,\.571/);
assert.match(lifecycle, /\['house', transform\(\.40,\.399/);
assert.match(lifecycle, /\['hopes-fears', transform\(\.40,\.227/);
assert.match(lifecycle, /\['outcome', transform\(\.40,\.055/);
assert.match(lifecycle, /contentBounds\(\)/);
assert.match(lifecycle, /card-row-position-panel/);
assert.match(lifecycle, /frame\.width - GUTTER\*2/);
assert.match(lifecycle, /frame\.height - GUTTER\*2/);
assert.match(lifecycle, /stopImmediatePropagation\(\)/);
assert.match(lifecycle, /rowDrawScope:'full'/);
assert.match(lifecycle, /rowAllowReversals:true/);
assert.match(lifecycle, /rowAllowRepeats:false/);

// Interaction code may not own layout.
assert.doesNotMatch(interactions, /card-row-item\{position:relative/);
assert.doesNotMatch(interactions, /style\.left\s*=/);
assert.doesNotMatch(interactions, /style\.top\s*=/);
assert.doesNotMatch(interactions, /style\.translate\s*=/);
assert.match(interactions, /handles input behavior only/);

// The former geometry layer is deliberately inert.
assert.match(renderGeometry, /Deliberately no DOM geometry mutations/);
assert.doesNotMatch(renderGeometry, /MutationObserver/);
assert.doesNotMatch(renderGeometry, /style\.left/);

// Options is a draft transaction; applying a template is one controller call.
assert.match(options, /Draft edits never mutate the board/);
assert.match(options, /controller\(\)\?\.applyDraft/);
assert.match(options, /controller\(\)\?\.resetBoard/);
assert.match(options, /#drawingBoardOptionsButton/);
assert.match(options, /event\.stopImmediatePropagation\(\)/);
assert.doesNotMatch(options, /saveAndClear/);

// Chrome is UI-only, waits for the assembled current controls, and readiness is monotonic.
assert.match(chrome, /UI placement\/readiness only/);
assert.match(chrome, /relphi-drawing-board-ui-stable/);
assert.match(chrome, /#zoomCardRowExtents/);
assert.match(chrome, /data-relphi-transaction-owner="v2"/);
assert.doesNotMatch(chrome, /relphi-celtic-readable/);
assert.doesNotMatch(chrome, /row-card-rotation/);

console.log('Drawing Board single-owner architecture checks passed.');
