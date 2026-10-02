const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js,/id='drawing-board-document-actions'/);
assert.match(js,/workspace\.insertAdjacentElement\('afterend',strip\)/);
assert.match(js,/strip\.insertAdjacentElement\('afterend',readingText\)/);
assert.doesNotMatch(css,/grid-template-areas:"title title exports exports"/);
assert.match(css,/\.relphi-board-document-buttons\{[\s\S]*?justify-content:flex-end!important/);
assert.match(css,/@media\(max-width:700px\)[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);

console.log('Drawing Board document actions live between the felt and Reading Text, with a two-column mobile layout.');
