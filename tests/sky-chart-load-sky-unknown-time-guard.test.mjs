import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('sky-chart-saved-skies-private-load-v1.js','utf8');
const start=source.indexOf('function timeUnknown(payload){');
const end=source.indexOf('\nfunction migrateLegacyIds(){',start);
assert.ok(start>=0&&end>start,'unknown-time classifier must exist');
const timeUnknown=vm.runInNewContext('('+source.slice(start,end).trim()+')');
for(const payload of [
  {calcProfile:{timeUnknown:true,dateTime:'1985-10-08T00:00:00'}},
  {profile:{timeUnknown:true,dateTime:'1985-10-08T00:00:00'}},
  {timeUnknown:true,dateTime:'1985-10-08T00:00:00'}
]) assert.equal(timeUnknown(payload),true,'unknown-time record must remain unknown');
assert.equal(timeUnknown({calcProfile:{timeUnknown:false}}),false);

const whereStart=source.indexOf('function whereFingerprint(payload){');
const whereEnd=source.indexOf('\nfunction placementSource(payload){',whereStart);
assert.ok(whereStart>=0&&whereEnd>whereStart);
const where=source.slice(whereStart,whereEnd);
assert.match(where,/if\(timeUnknown\(payload\)\)return null;/,'unknown time must short-circuit before constructing a ruler or heptagram');
const fn=vm.runInNewContext('('+where+')',{timeUnknown,timingPacket(){throw Error('Unknown sky must not calculate a time')}}); 
for(const payload of [{calcProfile:{timeUnknown:true}},{profile:{timeUnknown:true}},{timeUnknown:true}])
  assert.equal(fn(payload),null,'unknown sky must have no microheptagram');
console.log('Load Sky unknown-time ruler/microheptagram guard passed.');
