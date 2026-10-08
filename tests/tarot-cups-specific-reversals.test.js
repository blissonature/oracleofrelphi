const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-reversed-copy-v1.js', 'utf8');
const ranks = ['ace','two','three','four','five','six','seven','eight','nine','ten'];
const entries = ranks.map(rank => {
  const match = source.match(new RegExp('\\b' + rank + '_of_cups: \\'((?:\\\\.|[^\\'])+)\\''));
  assert.ok(match, rank + ' of Cups needs a specific reversed meaning');
  assert.ok(match[1].length > 100, rank + ' of Cups meaning should be substantive');
  assert.doesNotMatch(match[1], /turns inward: completion becomes|core operation turning inward/i);
  return match[1];
});
assert.equal(new Set(entries).size,10,'Cups meanings must be distinct');
assert.match(source,/if \(card\.card_type === 'Ace'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
assert.match(source,/if \(card\.card_type === 'Pip'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
console.log('All ten Cups reversed interpretations are present, specific, and routed correctly');
