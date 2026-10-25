import assert from 'node:assert/strict';
import test from 'node:test';
import {norm, signed, delta, polar, miniPoint, miniLongitude} from './geometry.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t, `expected ${b}, received ${a}`);
const positions=[0,10,30,40.137,90,120,180,270,300,359.999];
test('mini map exactly matches established Relphi zodiac orientation',()=>{
 for(let d=0;d<360;d+=.375){const {x,y}=miniPoint(d,54,75,75),a=(norm(d)-180)*Math.PI/180;
  near(x,75+54*Math.cos(a));near(y,75+54*Math.sin(a));
  near(Math.abs(signed(miniLongitude(x,y)-d)),0);}
});
test('yaw rotation has same normalized longitude as focus geometry',()=>{
 for(const f of positions)for(const d of positions){const a=d*Math.PI/180,theta=-f*Math.PI/180,x=Math.sin(a),z=Math.cos(a),target=polar(delta(d,f));
  near(x*Math.cos(theta)+z*Math.sin(theta),target.x);
  near(-x*Math.sin(theta)+z*Math.cos(theta),target.z);}
});
test('all supported aspect angles are invariant under rotating the camera',()=>{
 for(const aspect of [30,45,60,72,90,120,135,144,150,180])for(const focus of positions){
  near(Math.abs(signed(delta(359.99,focus)-delta(359.99+aspect,focus))),Math.min(aspect,360-aspect));}
});
test('unequal house cusps remain distinct for Sky A and Sky B including Aries wrap',()=>{
 const A=[350,14,40,74,107,139,168,196,225,252,284,317],B=[342,12,37,69,102,130,161,191,219,247,278,312];
 const widths=x=>x.map((v,i)=>norm(x[(i+1)%12]-v));
 const house=(degree,x)=>x.findIndex((v,i)=>norm(degree-v)<norm(x[(i+1)%12]-v))+1;
 for(const x of [A,B]){near(widths(x).reduce((a,b)=>a+b,0),360);
   for(let i=0;i<3600;i++){const h=house(i/10,x);assert.ok(h>=1&&h<=12)}}
 assert.ok(new Set(widths(A)).size>1);
 assert.equal(house(345,A),12);assert.equal(house(345,B),1);assert.equal(house(359,A),1);
});
test('flat camera field contains full zodiac rings on portrait and landscape',()=>{
 const radius=4.05,half=5.1;
 for(const [w,h] of [[320,640],[375,812],[768,1024],[1366,768],[2560,1440]]){
  const aspect=w/h,left=half*Math.max(1,aspect),top=half*Math.max(1,1/aspect);
  assert.ok(left>radius&&top>radius);near(left/top,aspect);}
});
test('perspective camera widens field on narrow displays',()=>{
 const desired=24*Math.PI/180;
 for(const aspect of [.4,.5,.6,1,1.5,2.5]){
  const fov=Math.max(45,2*Math.atan(Math.tan(desired)/aspect)*180/Math.PI);
  const horizontal=Math.atan(Math.tan(fov*Math.PI/360)*aspect);
  assert.ok(horizontal>=Math.min(desired,Math.atan(Math.tan(Math.PI/8)*aspect))-1e-10);}
});
