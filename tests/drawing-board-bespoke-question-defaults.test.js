const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function bespokeDefaultQuestionSettings\(draft\)/);
assert.match(js,/Defaults for new questions\./);
assert.match(js,/id="relphiQuestionControllerReversals" type="checkbox" '\+\(defaults\.reversals\?'checked':''\)\+'/);
assert.doesNotMatch(js,/id="relphiQuestionControllerReversals" type="checkbox" disabled/);
assert.match(js,/const applyQuestionController=\(patch\)=>selectedQuestionIndexes\(\)\.length\?applyToSelected\(patch\):applyQuestionDefaults\(patch\)/);
assert.match(js,/draft\.positionSettings\.push\(\{\.\.\.defaults,linkTo:''\}\)/);
assert.match(js,/draft\.positionSettings=\[\];[\s\S]*?markQuestionEditCustom/);
assert.match(js,/applyQuestionController\(\{pack:scope\}\)/);

console.log('Bespoke exposes and applies visible defaults for new questions before any questions are selected.');
