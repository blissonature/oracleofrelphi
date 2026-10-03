const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

const render = js.match(/function renderOptions\(root = panel\(\), \{preserveScroll=true\} = \{\}\) \{[\s\S]*?\n  \}/);
assert.ok(render,'renderOptions must exist');

assert.match(render[0],/aria-label','Crafted reading paths/);
assert.doesNotMatch(render[0],/drawSettingsMarkup/);
assert.doesNotMatch(render[0],/advancedDrawSettings/);
assert.doesNotMatch(render[0],/id="relphiDraftPack"/);
assert.doesNotMatch(render[0],/id="relphiDraftReversals"/);
assert.doesNotMatch(render[0],/id="relphiDraftRepeats"/);
assert.doesNotMatch(render[0],/aria-label="Draw settings"/);

assert.match(js,/function renderFreeSettings\(root=panel\(\)\)/);
assert.match(js,/id="relphiFreePack"/);
assert.match(js,/id="relphiFreeReversals"/);
assert.match(js,/id="relphiFreeRepeats"/);

console.log('Crafted no longer renders shared Draw settings; Free settings remain independent.');
