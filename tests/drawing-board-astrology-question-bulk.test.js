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
assert.match(js,/data-astrology-question-value="all">Select all/);
assert.match(js,/data-astrology-question-value="none">Clear all/);
assert.match(js,/data-astrology-question-value="all">All/);
assert.match(js,/data-astrology-question-value="none">None/);
assert.match(js,/session\.astrologyQuestionSelection \|\|= \{\}/);
assert.match(js,/rememberAstrologyQuestionSelection/);
assert.doesNotMatch(js,/data-astrology-select-all/);
assert.match(css,/\.relphi-astrology-question-group\{/);
assert.match(css,/\.relphi-astrology-question-bulk/);

console.log('Astrological suggestions support category and global bulk selection.');
