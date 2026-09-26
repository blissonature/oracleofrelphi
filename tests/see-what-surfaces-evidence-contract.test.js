const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-app.js','utf8');

assert.match(source, /window\.RELPHI_CARD_SUBPACK_CONTEXT = cardQuestionGeneratorContext/);
assert.match(source, /window\.RELPHI_EVIDENCE_CONTEXT = Object\.freeze/);
assert.match(source, /schema: 'relphi\.see-what-surfaces\.evidence'/);
assert.match(source, /kind: 'house-locator'/);
assert.match(source, /source: 'zodiacal-major'/);
assert.match(source, /card\.card_type === 'Major'.*astrology\.attribution_type === 'Sign'/s);
assert.match(source, /kind: 'zodiac-locator'/);
assert.match(source, /source: 'pip-decan'/);
assert.match(source, /card\.card_type === 'Pip'/);
assert.match(source, /kind: 'planet-locator'/);
assert.match(source, /relationships: Array\.isArray\(sky\.relationships\)/);
assert.match(source, /configurations: Array\.isArray\(sky\.configurations\)/);
assert.match(source, /cardHits: Array\.isArray\(sky\.cardHits\)/);
assert.match(source, /bridge: String\(source\.bridge \|\| ''\)/);
assert.match(source, /cards: cardEvidence/);
assert.match(source, /skies: skyEvidence/);
assert.match(source, /derived: Array\.isArray\(derived\)/);

console.log('Shared See What Surfaces evidence contract exposes card, sky, Card Hits, and derived evidence.');
