const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-reversed-copy-v1.js','utf8');
const ranks=['knight','queen','prince','princess'];
const suits=['wands','cups','swords','disks'];
const entries=ranks.flatMap(rank=>suits.map(suit=>{
  const id=rank+'_of_'+suit;
  const line=source.split('\n').find(row=>row.trimStart().startsWith(id+': '));
  assert.ok(line,id+' needs a specific reversed interpretation');
  assert.ok(line.length>120,id+' needs a substantive transformed operation');
  assert.doesNotMatch(line,/core operation turning inward|loses clean direction in motion/i);
  return line;
}));
assert.equal(new Set(entries).size,16,'all court meanings should be distinct');
assert.match(source,/COURT_SPECIFIC_REVERSED\[card\.card_id\] \|\| deriveCourt\(card\)/);
console.log('Sixteen court reversals covered');
