const assert = require('node:assert/strict');
const fs = require('node:fs');

const workflow = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const app = fs.readFileSync('tarot-app.js','utf8');

assert.match(workflow,/function expandBespokeDraftForLaunch\(draft\)/);
assert.match(workflow,/questionCardCount:entry\.count/);
assert.match(workflow,/questionCardIndex:offset/);
assert.match(workflow,/if\(total>MAX_POSITIONS\)return \{draft:null,total\}/);
assert.match(workflow,/if\(session\.path==='bespoke'\)\{/);
assert.match(workflow,/draft=expanded\.draft/);
assert.match(workflow,/Cards per question/);
assert.match(workflow,/Card '\+\(questionCardIndex\+1\)\+' of '\+questionCardCount/);

assert.match(app,/function prefabSemanticPositionMeta\(position\)/);
assert.match(app,/'allowReversals','allowRepeats','cardCount','linkTo'/);
assert.match(app,/'questionText','questionIndex','questionCardIndex','questionCardCount'/);
assert.match(app,/\.\.\.prefabSemanticPositionMeta\(position\)/);

console.log('Bespoke per-question controller settings survive launch and multi-card expansion.');
