import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../sky-chart.html',import.meta.url),'utf8');
const vocab=readFileSync(new URL('../sky-chart-vocab-tab-v1.js',import.meta.url),'utf8');
new Function(vocab);

assert.match(html,/sky-chart-vocab-tab-v1\.js\?v=1/,'Sky Chart must load the Vocab subtab');
assert.match(vocab,/Glyphs/);
assert.match(vocab,/Names/);
assert.match(vocab,/Referents/);
assert.match(vocab,/data-sky-vocab-view-button="placements"/);
assert.match(vocab,/data-sky-vocab-view-button="vocab"/);
assert.match(vocab,/conjunction:'union'/);
assert.match(vocab,/opposition:'polarity'/);
assert.match(vocab,/Gemini:'writing, speech, learning, information exchange, and interpretation'/);
assert.match(vocab,/Sagittarius:'the search for meaning, greater aspirations, worldview, and the bigger picture'/);
assert.match(vocab,/'asteroid-lilith':'equality'/);
assert.match(vocab,/child:'children'/);
assert.match(vocab,/AXIS_PAIRS/,'Definitional axes must be treated as axes rather than ordinary opposition rows');
assert.match(vocab,/houseCusps\.length\?houseFor/,'Vocab houses must follow the active house system when cusps are available');
assert.match(vocab,/data\.vocabLocalStage/,'Vocab tokens must support local progressive reveal');

console.log('Sky Chart Vocab tab contract passed.');
