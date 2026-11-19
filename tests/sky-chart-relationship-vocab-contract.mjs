import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../sky-chart.html',import.meta.url),'utf8');
const controller=readFileSync(new URL('../sky-chart-foundation-interactions-v2.js',import.meta.url),'utf8');
const vocab=readFileSync(new URL('../sky-chart-vocab-tab-v1.js',import.meta.url),'utf8');
const copyCss=readFileSync(new URL('../relphi-copy-icon-convention-v1.css',import.meta.url),'utf8');
const relationshipsCss=readFileSync(new URL('../sky-chart-foundation-interactions-v1.css',import.meta.url),'utf8');

assert.doesNotMatch(html,/sky-chart-relationship-vocab-v1\.js/,'Unrequested Relationships Vocab controller must not load');
assert.doesNotMatch(html,/data-relationship-vocab-tabs|skyRelationshipVocabPanel/,'No Vocab peer tab or panel in Relationships HTML');
assert.doesNotMatch(copyCss+relationshipsCss,/sky-relationship-vocab-tabs/,'No orphaned Relationship Vocab tab layout selectors');
assert.match(controller,/<h2>Relationships<\/h2>/,'Relationships keeps its original heading');
assert.match(html,/sky-chart-vocab-tab-v1\.js\?v=\d+/,'Existing Placements Vocab remains available');
assert.match(vocab,/data-sky-vocab-view-button="vocab"/,'The Placements Vocab tab remains unchanged');
assert.match(html,/sky-chart-relationship-sort-v1\.js\?v=\d+/,'Relationship sorting remains available');
assert.match(html,/sky-chart-relationship-limit-v1\.js\?v=\d+/,'Relationship Max remains available');
console.log('Relationships has no unauthorized Vocab tab; original controls and Placements Vocab remain.');
