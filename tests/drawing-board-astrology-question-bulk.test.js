const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js,/function astrologyQuestionCategory\(question\)/);
assert.match(js,/function astrologyQuestionGroupsMarkup\(questionList,session\)/);
assert.match(js,/Patterns & concentrations/);
assert.match(js,/Card Hits/);
assert.match(js,/Planet relationships/);
assert.match(js,/Repeated rulers/);
assert.match(js,/Repeated themes/);
assert.match(js,/data-astrology-category-master/);
assert.match(js,/data-astrology-category-toggle/);
assert.match(js,/function astrologyQuestionIsSelected/);
assert.match(js,/syncAstrologyCategoryBoxes/);
assert.match(js,/toggle\.indeterminate=checked>0&&checked<items\.length/);
assert.match(js,/session\.astrologyQuestionSelection \|\|= \{\}/);
assert.match(js,/rememberAstrologyQuestionSelection/);
assert.doesNotMatch(js,/data-astrology-question-bulk/);
assert.match(css,/\.relphi-astrology-question-group\{/);
assert.match(css,/\.relphi-astrology-category-toggle/);
assert.match(css,/\.relphi-astrology-category-master/);

console.log('Astrological suggestions use category and master checkboxes with indeterminate state.');
