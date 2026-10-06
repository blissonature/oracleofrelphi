const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function hydrateTemplateDraft\(draft,template\)/);
assert.match(js,/draft\.labels=ordered\.map/);
assert.match(js,/draft\.positionSettings=\[\]/);
assert.match(js,/if\(draft\.templateId && based\)\{/);
assert.match(js,/const canonical=clone\(based\)/);
assert.match(js,/return canonical;/);
assert.match(js,/if\(chosen\)hydrateTemplateDraft\(draft,chosen\)/);
assert.match(js,/if\(!draft\.templateId && selected\) hydrateTemplateDraft\(draft,selected\)/);

const celtic = js.match(/const CELTIC_CROSS = \{[\s\S]*?\n  \};/);
assert.ok(celtic,'Celtic Cross canonical template must exist');
assert.match(celtic[0],/cardCount:10/);
for(const id of ['covering','crossing','crowning','beneath','behind','before','self','house','hopes-fears','outcome']){
  assert.match(celtic[0],new RegExp("position\\('"+id+"'"));
}


assert.match(js,/function singleRowPositions\(labels\)/);
assert.match(js,/const startX=\(CANVAS_W-totalWidth\)\/2/);
assert.match(js,/startX\+\(index\*cardWidth\)/);
assert.match(js,/positions:singleRowPositions\(item\.labels\)/);
assert.match(js,/positions:singleRowPositions\(HOUSE_POLARITY_LABELS\)/);
assert.match(js,/id:'focus-1'[\s\S]*?positions:singleRowPositions\(\['Focus'\]\)/);

console.log('Templates launch their canonical layouts; standard spreads pack flush in one row while special layouts remain canonical.');
