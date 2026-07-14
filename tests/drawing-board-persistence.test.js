const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'tarot-app.js'), 'latin1');
const html = fs.readFileSync(path.join(root, 'tarot.html'), 'utf8');

assert.match(app, /relphiDrawingBoardSessionV1/);
['shortListName:', 'rowCardReversals:', 'rowEnvelopeLayout:', 'rowCardTransforms:', 'rowSenseNotes:', 'rowTableImage:'].forEach(needle => assert.ok(app.includes(needle), 'missing board snapshot field: ' + needle));
assert.match(app, /function restoreBoardSnapshot\(snapshot\)[\s\S]*state\.shortListName[\s\S]*state\.rowCardReversals[\s\S]*state\.rowEnvelopeLayout[\s\S]*state\.rowCardTransforms[\s\S]*state\.rowSenseNotes[\s\S]*state\.rowTableImage/);
assert.match(app, /localStorage\.setItem\(DRAWING_BOARD_STORAGE_KEY/);
assert.match(app, /addEventListener\('pagehide', flushDrawingBoardSave\)/);
assert.match(app, /visibilityState === 'hidden'/);
assert.match(app, /landingOpenBoard/);
assert.match(app, /function refreshShortListViews\(\)[\s\S]{0,400}queueDrawingBoardSave\(\)/);
assert.match(app, /largeArtOmitted:true/);
assert.doesNotMatch(app, /DRAWING_BOARD_STORAGE_KEY[\s\S]{0,500}innerHTML/, 'persistence stores editable state, not a dead DOM snapshot');
assert.match(html, /tarot-app\.js\?v=354/);
console.log('Drawing Board persistence regression checks passed');
