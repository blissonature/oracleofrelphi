const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-reversed-copy-v1.js','utf8');
const ranks = ['ace','two','three','four','five','six','seven','eight','nine','ten'];
const entries = ranks.map(rank => {
  const line = source.split('\n').find(line => line.trimStart().startsWith(rank + '_of_wands: '));
  assert.ok(line, rank + ' of Wands needs its own reversed meaning');
  assert.ok(line.length > 115, rank + ' of Wands meaning should be substantive');
  assert.doesNotMatch(line, /turns inward:|core operation turning inward/i);
  return line;
});
assert.equal(new Set(entries).size,10);
assert.match(source,/if \(card\.card_type === 'Ace'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
assert.match(source,/if \(card\.card_type === 'Pip'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
console.log('All ten Wands reversed interpretations are present and routed');
