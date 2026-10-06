const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function bespokeDefaultQuestionSettings\(draft\)/);
assert.doesNotMatch(js,/Defaults for new questions\./);
assert.doesNotMatch(js,/draft\?\.questionDefaults/);
assert.doesNotMatch(js,/applyQuestionDefaults/);
assert.match(js,/const applyQuestionController=\(patch\)=>selectedQuestionIndexes\(\)\.length\?applyToSelected\(patch\):false/);
assert.match(js,/Object\.values\(controller\)\.forEach\(node=>\{if\(node&&'disabled' in node\)node\.disabled=!any\}\)/);
assert.match(js,/draft\.positionSettings\.push\(\{\.\.\.defaults,linkTo:''\}\)/);
assert.match(js,/pack:pack&&pack!=='question-by-question'\?pack:'full'/);
assert.match(js,/cardCount:1/);
assert.match(js,/applyQuestionController\(\{pack:scope\}\)/);

console.log('Bespoke card options apply only to selected questions; new questions keep baseline settings.');
