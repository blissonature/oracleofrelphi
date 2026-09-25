import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../sky-chart.html',import.meta.url),'utf8');
const vocab=readFileSync(new URL('../sky-chart-relationship-vocab-v1.js',import.meta.url),'utf8');
const configurations=readFileSync(new URL('../sky-chart-aspect-configurations-v1.js',import.meta.url),'utf8');

new Function(vocab);
new Function(configurations);

assert.match(html,/sky-chart-relationship-vocab-v1\.js\?v=3/,'Sky Chart must load Relationship Vocab.');
assert.match(vocab,/data-relationship-vocab-view="relationships"[^>]*>Relationships</,'Relationships must remain the first peer tab.');
assert.match(vocab,/data-relationship-vocab-view="vocab"[^>]*>Vocab</,'Vocab must be a peer tab inside Relationships.');
assert.match(vocab,/'grand-trine':\{name:'Grand Trine',referent:'closed three-way low-resistance flow'\}/,'Grand Trine must carry its own Vocab referent.');
assert.match(vocab,/function configInfo\(id\).*hasGlyph:false/s,'Configurations without a canonical unique glyph must not borrow an elemental or aspect glyph.');
assert.match(vocab,/'grand-cross':\{name:'Grand Cross \/ Grand Square'/,'Grand Cross must expose the Grand Square alias.');
assert.match(vocab,/makeToken\(configInfo\(pattern\.type\),'configuration',true\)/,'A configuration itself must be a progressive Vocab token.');
assert.match(vocab,/heading\.textContent='Configurations'/,'Detected configurations must be presented in Relationship Vocab rather than inside the Aspects menu.');
assert.match(vocab,/config-type-.*info\.name/s,'Relationship Vocab must group configuration results by configuration type.');
assert.match(vocab,/function scopeLabel\(scope\).*A↔A.*B↔B.*A↔B/s,'Each configuration result must identify whether it is A↔A, B↔B, or A↔B.');
assert.match(vocab,/memberContextGroups/,'Configuration prose must combine members that share sign and house context instead of repeating that context.');
assert.match(vocab,/data\.relationshipVocabColors|relationshipVocabColors/s,'Relationship Vocab lines must carry sign and house rail data.');
assert.match(vocab,/sky-relationship-vocab-preview-rails/,'Collapsed Relationship Vocab groups must include horizontal sign and house rails.');
assert.match(vocab,/A↔A · Sky A/,'Other intrasky Sky A relationships must live in Relationship Vocab.');
assert.match(vocab,/B↔B · Sky B/,'Other intrasky Sky B relationships must live in Relationship Vocab.');
assert.match(vocab,/A↔B · Intersky/,'Intersky relationships must live in Relationship Vocab.');
assert.match(vocab,/with each placement in .*aspect\('trine'\).*with the other two/s,'Grand Trine prose must state its actual three-way trine geometry.');
assert.match(vocab,/serializePanel/,'Relationship Vocab must have a semantic copy serializer.');
assert.match(vocab,/html-to-image@1\.11\.11/,'Relationship Vocab download must save the Vocab view rather than the hidden relationship ledger.');
assert.match(configurations,/Grand Cross \/ Grand Square/,'The configuration selector must use the same Grand Cross / Grand Square naming.');

console.log('Relationship Vocab contract passed.');
