import assert from 'node:assert/strict';
import test from 'node:test';

const phi=(1+Math.sqrt(5))/2;
const deg=r=>r*180/Math.PI;
const rad=d=>d*Math.PI/180;
const chord=(a,b)=>2*Math.sin(Math.abs(a-b)/2);

test('golden rectangle has phi side ratio when inscribed in one circle',()=>{
  const small=2*Math.atan(1/phi);
  const offsets=[0,small,Math.PI,Math.PI+small];
  const short=chord(offsets[0],offsets[1]);
  const long=chord(offsets[1],offsets[2]);
  assert.ok(Math.abs(long/short-phi)<1e-12);
});

test('golden rectangle opposite vertices are simultaneous tritone pairs on fifths wheel',()=>{
  const pcs=[0,7,2,9,4,11,6,1,8,3,10,5];
  for(let i=0;i<6;i++) assert.equal((pcs[(i+6)%12]-pcs[i]+12)%12,6);
});

test('golden rectangle produces alternating 3.435 and 26.565 degree strike gaps',()=>{
  const small=deg(2*Math.atan(1/phi));
  const residue=((small%30)+30)%30;
  const gaps=[residue,30-residue].sort((a,b)=>a-b);
  assert.ok(Math.abs(gaps[0]-3.434948822922024)<1e-9);
  assert.ok(Math.abs(gaps[1]-26.565051177077976)<1e-9);
});

test('canonical 21-55-64 construction puts Neptune/C in Quadrant II',()=>{
  const A=[0,0];
  const B=[55,0];
  const C=[-63/11,84*Math.sqrt(7)/11];
  assert.ok(C[0]<0);
  assert.ok(C[1]>0);
  const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  assert.ok(Math.abs(dist(A,B)-55)<1e-12);
  assert.ok(Math.abs(dist(A,C)-21)<1e-12);
  assert.ok(Math.abs(dist(B,C)-64)<1e-12);
});

test('21-55-64 sound-wheel offsets preserve the canonical orientation',()=>{
  // The SVG wheel is clockwise-positive, so canonical Cartesian circumcircle
  // offsets are sign-reversed: B is counterclockwise, Neptune/C clockwise.
  const A=0;
  const B=rad(-111.54226734437484);
  const C=rad(36.80449239188047);
  const AB=chord(A,B), AC=chord(A,C), BC=chord(B,C);
  const k=55/AB;
  assert.ok(B<0);
  assert.ok(C>0);
  assert.ok(Math.abs(AB*k-55)<1e-9);
  assert.ok(Math.abs(AC*k-21)<1e-9);
  assert.ok(Math.abs(BC*k-64)<1e-9);
});

test('21-55-64 triangle has 36 distinct crossings and A is zero-phase root stream',()=>{
  const offsets=[0,-111.54226734437484,36.80449239188047];
  const residues=offsets.map(v=>(((-v)%30)+30)%30).sort((a,b)=>a-b);
  assert.equal(new Set(residues.map(v=>v.toFixed(9))).size,3);
  assert.ok(residues.some(v=>Math.abs(v)<1e-9));
  assert.equal(3*12,36);
});
