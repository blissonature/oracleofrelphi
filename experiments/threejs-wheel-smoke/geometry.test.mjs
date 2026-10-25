import test from 'node:test';
import assert from 'node:assert/strict';
import {norm, signed, delta, polar, miniPoint, miniLongitude} from './geometry.mjs';
const near = (actual, expected, tolerance=1e-9) => assert.ok(Math.abs(actual-expected)<tolerance, `expected ${expected}, got ${actual}`);
test('longitude normalization wraps without losing exact boundaries',()=>{near(norm(-90),270);near(norm(450),90);near(norm(360),0);});
test('focused hemisphere maps angular anchors to front, caps, and far point',()=>{
 for (const focus of [0,1.125,32,90,175,270,359.8]) {
  near(delta(focus,focus),0); near(delta(focus+90,focus),90);
  near(delta(focus-90,focus),-90); near(Math.abs(delta(focus+180,focus)),180);
  const front=polar(delta(focus,focus));const right=polar(delta(focus+90,focus));
  const left=polar(delta(focus-90,focus));const far=polar(delta(focus+180,focus));
  near(front.x,0);near(front.z,1);near(right.x,1);near(right.z,0);
  near(left.x,-1);near(left.z,0);near(far.x,0);near(far.z,-1);
 }
});
test('miniature aspect wheel remains exact at source longitudes',()=>{
 for (const longitude of [0,15.3,60.1,90,172,180,233.42,270,359.999]) {
  const {x,y}=miniPoint(longitude);near(Math.abs(signed(miniLongitude(x,y)-longitude)),0,1e-8);
 }
 const p0=miniPoint(0),p90=miniPoint(90),p180=miniPoint(180),p270=miniPoint(270);
 near(p0.x,21);near(p0.y,75);near(p90.x,75);near(p90.y,21);
 near(p180.x,129);near(p180.y,75);near(p270.x,75);near(p270.y,129);
});
test('aspect angular distance is invariant under a change of focal longitude',()=>{
 const a=40.137, b=160.137;
 const original=Math.abs(signed(a-b));near(original,120);
 for(const focus of [0,15,95,140,299,359])near(Math.abs(signed(delta(a,focus)-delta(b,focus))),original);
});
