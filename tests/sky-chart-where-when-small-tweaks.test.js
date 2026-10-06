const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('sky-chart-where-when-v3.js','utf8');
const css = fs.readFileSync('sky-chart-where-when-layout-density-v1.css','utf8');

assert.match(js,/sky-where-when-button secondary sky-where-when-here-now/);
assert.doesNotMatch(js,/sky-where-when-button primary sky-where-when-here-now/);
assert.match(js,/selected\?\.source==='current-location'\?' is-current-location':''/);
assert.match(js,/queryInput\.classList\.toggle\('is-current-location',packet\.source==='current-location'\)/);
assert.match(js,/input\.classList\.remove\('is-current-location'\)/);
assert.match(css,/\.sky-where-when-here-now-row\{[\s\S]*grid-template-columns:minmax\(62px,\.78fr\) minmax\(0,2\.22fr\)!important;/);
assert.match(css,/\.sky-where-when-here-now\{[\s\S]*grid-column:2!important;[\s\S]*width:100%!important;/);
assert.match(css,/\[data-ww-field="location-query"\]\.is-current-location\{[\s\S]*background:#e2dfdb!important;[\s\S]*color:#817a73!important;/);

console.log('Where and When small action/state refinements are guarded.');
