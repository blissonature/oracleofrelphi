const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const app=fs.readFileSync('tarot-app.js','utf8');

assert.match(workflow,/\['tags','Keywords \/ Tags'\]/);
assert.match(workflow,/function keywordDraftMarkup\(draft\)/);
assert.match(workflow,/id="relphiKeywordQuery"/);
assert.match(workflow,/data-keyword-choice/);
assert.match(workflow,/RELPHI_KEYWORD_SUBPACK_CONTEXT\?\.matches/);
assert.match(workflow,/snap\.rowSelectedTags=draft\.pack==='tags'/);
assert.match(workflow,/snap\.rowTagMatchMode=draft\.keywordMatchMode==='all'/);
assert.match(app,/window\.RELPHI_KEYWORD_SUBPACK_CONTEXT = Object\.freeze/);
assert.match(app,/catalog: \(\) => canonicalTagCatalog\(\)\.slice\(\)/);
assert.match(app,/count: \(tags, mode = 'any'\)/);
console.log('Referents Pack selector exposes the Keywords / Tags builder and persists its selection.');
