import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const code=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');

test('wheel filter focus resolves intrasky lines by sky-owned, symmetric endpoint identity',()=>{
  assert.match(code,/function relationshipIdentity\(node\)/);
  assert.match(code,/if\(slots\.left===slots\.right\)/);
  assert.match(code,/\[left,right\]\.sort\(\)/);
  assert.match(code,/const identity=relationshipIdentity\(row\)/);
  assert.match(code,/const identity=relationshipIdentity\(node\)/);
  assert.match(code,/identity\?identities\.has\(identity\):relations\.has/);
  assert.match(code,/querySelectorAll\('\[data-layer="aspects"\] \.sky-foundation-aspect'\)/);
  assert.ok(html.includes('sky-chart-filter-wheel-focus-v1.js?v=19'));
});

test('relationship focus identity matches B-B regardless of endpoint order',()=>{
  const identity=(sky,left,aspect,right)=>{
    const [first,second]=[left,right].sort();
    return `${sky}:${first}|${aspect}|${sky}:${second}`;
  };
  assert.equal(identity('B','mars','trine','saturn'),identity('B','saturn','trine','mars'));
  assert.notEqual(identity('B','mars','trine','saturn'),identity('A','mars','trine','saturn'));
});
