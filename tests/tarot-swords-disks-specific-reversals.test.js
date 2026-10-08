const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-reversed-copy-v1.js','utf8');
const ranks = ['ace','two','three','four','five','six','seven','eight','nine','ten'];
for (const suit of ['swords','pentacles']) {
  const meanings = ranks.map(rank => {
    const line = source.split('\n').find(line => line.trimStart().startsWith(rank + '_of_' + suit + ': '));
    assert.ok(line, rank + ' of ' + suit + ' requires a specific reversed meaning');
    assert.ok(line.length > 120, rank + ' of ' + suit + ' should be substantive');
    assert.doesNotMatch(line, /turns inward:|core operation turning inward/i);
    return line;
  });
  assert.equal(new Set(meanings).size,10);
}
assert.match(source,/if \(card\.card_type === 'Ace'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
assert.match(source,/if \(card\.card_type === 'Pip'\) return PIP_SPECIFIC_REVERSED\[card\.card_id\]/);
console.log('Swords and Pentacles reversed meaning coverage passed');
