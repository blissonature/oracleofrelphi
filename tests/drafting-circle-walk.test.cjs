const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {build,polar,distance}=require('../drafting-circle-walk.js');
const html=fs.readFileSync(path.join(__dirname,'..','drafting-studio.html'),'utf8');
const near=(a,b,t=1e-3)=>assert.ok(Math.abs(a-b)<t,String(a)+' ≠ '+String(b));
const closePoint=(a,b,t=.05)=>near(distance(a,b),0,t);
const closeRing=shape=>closePoint(shape.points[0],shape.points.at(-1));

test('walk tool exposes a visible mode, keyboard-operable division tabs, and step controls',()=>{
 for(const id of ['walkMode','compassMode','circleWalkToolbar','cwPrev','cwNext','cwRestart','cwFinish','cwProgress','cwIncludeGuides','circleWalkLayer','circleWalkPanel']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 for(let n=2;n<=7;n++)assert.ok(html.includes('data-circle-division="'+n+'"'));
 assert.match(html,/drafting-circle-walk\.js/);
 assert.match(html,/RelphiDraftingBridge/);
});
test('each division has a progressive build, editable placement and a genuine endpoint',()=>{
 for(let n=2;n<=7;n++){
  const w=build(n,{x:600,y:350},142,0.2);
  assert.ok(w.steps.length>=4,'steps '+n);
  assert.equal(w.steps[0].title,'Establish the circle');
  assert.ok(w.steps.every(s=>s.title&&s.detail&&s.shapes.length));
  assert.ok(w.exportInk.length>=2);
  assert.deepEqual(w.c,{x:600,y:350});
  near(w.r,142);
  for(const s of w.exportInk){assert.ok(s.points.length>=2);assert.ok(s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))}
  closeRing(w.exportInk[0]);
 }
});
test('diameter gives precisely two semicircles',()=>{
 const w=build(2,{x:550,y:390},180,-Math.PI/2);
 const diameter=w.exportInk[1].points;
 near(distance(diameter[0],diameter[1]),360,.02);
 assert.equal(w.exact,true);
});
test('triangle emerges by taking alternating sixfold marks',()=>{
 const w=build(3,{x:550,y:390},180,-Math.PI/2);
 assert.match(w.steps.at(-2).title,/alternating/i);
 const pts=w.exportInk[1].points;
 assert.equal(pts.length,4);
 closeRing(w.exportInk[1]);
 near(distance(pts[0],pts[1]),Math.sqrt(3)*180,.02);
 near(distance(pts[1],pts[2]),Math.sqrt(3)*180,.02);
});
test('fourfold perpendicular construction makes four right angles',()=>{
 const w=build(4,{x:550,y:390},180,-Math.PI/2);
 const pts=w.exportInk[1].points;
 assert.equal(pts.length,5);
 closeRing(w.exportInk[1]);
 for(let i=0;i<4;i++)near(distance(pts[i],pts[i+1]),180*Math.SQRT2,.03);
 assert.ok(w.steps.some(s=>s.title.includes('perpendicular')||s.detail.includes('perpendicular')));
});
test('fivefold golden construction produces exact regular-pentagon chords',()=>{
 const w=build(5,{x:550,y:390},180,-Math.PI/2);
 assert.ok(w.steps.some(s=>s.title.includes('golden')));
 const pts=w.exportInk[1].points;
 assert.equal(pts.length,6);closeRing(w.exportInk[1]);
 const chord=360*Math.sin(Math.PI/5);
 for(let i=0;i<5;i++)near(distance(pts[i],pts[i+1]),chord,.03);
 assert.equal(w.exact,true);
});
test('six equal-radius chord steps close exactly',()=>{
 const w=build(6,{x:550,y:390},180,-Math.PI/2);
 const pts=w.exportInk[1].points;
 assert.equal(pts.length,7);closeRing(w.exportInk[1]);
 for(let i=0;i<6;i++)near(distance(pts[i],pts[i+1]),180,.04);
});
test('seven remains an explicitly approximate, open path with visible closure gap',()=>{
 const w=build(7,{x:550,y:390},180,-Math.PI/2),pts=w.exportInk[1].points;
 assert.equal(w.exact,false);
 assert.match(w.method,/Approximate/);
 assert.equal(pts.length,8);
 assert.ok(w.closureError>.5&&w.closureError<1.0);
 assert.ok(distance(pts[0],pts.at(-1))>1);
 assert.ok(w.steps.at(-1).shapes.some(s=>s.role==='gap'));
 for(let i=0;i<7;i++)near(distance(pts[i],pts[i+1]),Math.sqrt(3)/2*180,.04);
 assert.match(w.steps.at(-1).detail,/not constructible/i);
});
test('reject impossible division counts or invalid radii rather than generating false drawings',()=>{
 for(const n of [0,1,8,10,2.2,NaN])assert.throws(()=>build(n),RangeError);
 assert.throws(()=>build(5,{x:0,y:0},-1),RangeError);
 assert.throws(()=>build(5,{x:0,y:0},0),RangeError);
 assert.throws(()=>build(6,{x:Infinity,y:0},150),RangeError);
});
