import assert from 'node:assert/strict';
import test from 'node:test';

function gcd(a,b){ while(b){ const t=b; b=a%b; a=t; } return Math.abs(a); }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
const fifths=[0,7,2,9,4,11,6,1,8,3,10,5];
const TAU=Math.PI*2;

function crossingGroups(n, direction=-1){
  const prev=1e-7*direction;
  const next=prev+direction*TAU;
  const out=[]; const delta=next-prev;
  for(let v=0;v<n;v++) for(let j=0;j<12;j++){
    const base=j*TAU/12-v*TAU/n; let cross;
    if(delta>0){ const k=Math.floor((prev-base)/TAU)+1; cross=base+k*TAU; if(cross>next+1e-9)continue; }
    else { const k=Math.ceil((prev-base)/TAU)-1; cross=base+k*TAU; if(cross<next-1e-9)continue; }
    out.push({frac:(cross-prev)/delta,node:j});
  }
  out.sort((a,b)=>a.frac-b.frac);
  const groups=[];
  for(const hit of out){const last=groups.at(-1);if(last&&Math.abs(last.frac-hit.frac)<1e-5)last.nodes.push(hit.node);else groups.push({frac:hit.frac,nodes:[hit.node]});}
  return groups;
}

test('gcd/lcm law holds for one through twelve',()=>{
  for(let n=1;n<=12;n++){
    const groups=crossingGroups(n);
    assert.equal(groups.length,lcm(n,12));
    assert.ok(groups.every(g=>new Set(g.nodes).size===gcd(n,12)));
    assert.equal(groups.reduce((s,g)=>s+new Set(g.nodes).size,0),12*n);
  }
});

test('fifths-field triangle produces augmented triads',()=>{
  for(const g of crossingGroups(3).slice(0,4)){
    const pcs=[...new Set(g.nodes)].map(i=>fifths[i]).sort((a,b)=>a-b);
    const ints=pcs.map((p,i)=>(pcs[(i+1)%pcs.length]-p+12)%12).sort((a,b)=>a-b);
    assert.deepEqual(ints,[4,4,4]);
  }
});

test('fifths-field square produces diminished sevenths',()=>{
  for(const g of crossingGroups(4).slice(0,3)){
    const pcs=[...new Set(g.nodes)].map(i=>fifths[i]).sort((a,b)=>a-b);
    const ints=pcs.map((p,i)=>(pcs[(i+1)%pcs.length]-p+12)%12).sort((a,b)=>a-b);
    assert.deepEqual(ints,[3,3,3,3]);
  }
});

test('five and seven are coprime with twelve',()=>{
  assert.equal(gcd(5,12),1); assert.equal(gcd(7,12),1);
  assert.equal(crossingGroups(5).length,60); assert.equal(crossingGroups(7).length,84);
});

test('dodecad crosses all twelve positions together',()=>{
  const groups=crossingGroups(12);
  assert.equal(groups.length,12);
  assert.ok(groups.every(g=>new Set(g.nodes).size===12));
});
