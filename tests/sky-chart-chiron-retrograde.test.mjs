import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const storage=new Map();
const environment={
  Date,Math,Number,String,Array,Object,Map,Set,JSON,console,
  location:{pathname:'/sky-chart.html'},
  document:{readyState:'loading',addEventListener(){}},
  localStorage:{getItem:key=>storage.get(key)||null},
  RelphiGlyphRegistry:{
    resolve(id){return String(id||'').toLowerCase()==='chiron'?{id:'chiron',asset:'chiron'}:null},
    get(id){return this.resolve(id)}
  }
};
environment.window=environment;
const ctx=vm.createContext(environment);
for(const path of [
  'relphi-chiron-ephemeris-data-v1.js',
  'relphi-chiron-ephemeris-v1.js',
  'sky-chart-foundation-v2.js'
])vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
const provider=ctx.RelphiChironEphemeris;
const rx=ctx.RelphiSkyRetrograde;
const instant=date=>new Date(date+'T12:00:00.000Z');
const profile=date=>({instant:instant(date).toISOString(),dateTime:date,houseSystem:'whole-sign'});
const unknown=date=>({instant:'',dateTime:date,timeUnknown:true,timeZone:'UTC',houseSystem:'none'});
const record=date=>({name:'Chiron',glyphId:'chiron',longitude:provider.longitudeAt(instant(date))});
const sky=(date,calcProfile)=>({name:'Test chart',calcProfile,placements:{Chiron:record(date)}});
const year=Array.from({length:12},(_,i)=>'2026-'+String(i+1).padStart(2,'0')+'-15');
const directDate=year.find(day=>provider.motionAt(instant(day)).retrograde===false);
const retroDate=year.find(day=>provider.motionAt(instant(day)).retrograde===true);
assert.ok(directDate&&retroDate,'Chiron should have both direct and retrograde months in 2026');

test('local Chiron motion uses geocentric unwrapped central difference',()=>{
  const retro=provider.motionAt(instant(retroDate));
  const direct=provider.motionAt(instant(directDate));
  assert.ok(retro.longitudeSpeed < 0);
  assert.ok(direct.longitudeSpeed > 0);
  assert.equal(retro.retrograde,true);
  assert.equal(direct.retrograde,false);
  assert.equal(provider.calculate(instant(retroDate)).retrograde,true);
  assert.equal(provider.calculate(instant(directDate)).retrograde,false);
  assert.ok(provider.calculate(instant(retroDate)).longitudeSpeed<0);
});

test('Sky A and B recognize Chiron motion on older saved payloads with no Rx flag',()=>{
  storage.set('relphiSkyChartA',JSON.stringify(sky(retroDate,profile(retroDate))));
  storage.set('relphiSkyChartB',JSON.stringify(sky(directDate,profile(directDate))));
  assert.equal(rx.forPlacement('A','chiron'),true);
  assert.equal(rx.forPlacement('B','chiron'),false);
  assert.equal(rx.forPlacement('A','mercury'),false);
});

test('unknown-time Chiron uses chart date at local noon, not an invented birth time',()=>{
  storage.set('relphiSkyChartB',JSON.stringify(sky(retroDate,unknown(retroDate))));
  assert.equal(rx.forPlacement('B','chiron'),true);
  storage.set('relphiSkyChartB',JSON.stringify(sky(directDate,unknown(directDate))));
  assert.equal(rx.forPlacement('B','chiron'),false);
});

test('stored explicit motion remains authoritative, even for an older saved chart',()=>{
  const payload=sky(retroDate,profile(retroDate));
  payload.placements.Chiron.retrograde=false;
  storage.set('relphiSkyChartA',JSON.stringify(payload));
  assert.equal(rx.forPlacement('A','chiron'),false);
  payload.placements.Chiron.retrograde=true;
  storage.set('relphiSkyChartA',JSON.stringify(payload));
  assert.equal(rx.forPlacement('A','chiron'),true);
});

test('Rx is reachable from every Sky Chart output surface',()=>{
  const html=fs.readFileSync('sky-chart.html','utf8');
  const foundation=fs.readFileSync('sky-chart-foundation-v2.js','utf8');
  const expanded=fs.readFileSync('sky-chart-inline-expanded-header-v1.js','utf8');
  const compact=fs.readFileSync('sky-chart-relationship-scope-sections-v1.js','utf8');
  const semantic=fs.readFileSync('sky-chart-inline-relationship-copy-v1.js','utf8');
  const imageExport=fs.readFileSync('sky-chart-relationship-export-columns-v1.js','utf8');
  assert.match(foundation,/recordRetrograde\(record,payload\)\?/);
  assert.match(expanded,/RelphiSkyRetrograde\?\.forPlacement/);
  assert.match(compact,/RelphiSkyRetrograde\?\.forPlacement/);
  assert.match(semantic,/RelphiSkyRetrograde\?\.forPlacement/);
  assert.match(imageExport,/RelphiSkyRetrograde\?\.forPlacement/);
  assert.match(html,/relphi-chiron-ephemeris-v1\.js\?v=\d+/,'Chiron ephemeris must be loaded with a versioned resource URL');
  assert.ok(/sky-chart-foundation-v2\.js\?v=\d+/.test(html));
  assert.ok(/sky-chart-relationship-export-columns-v1\.js\?v=\d+/.test(html));
});
console.log('Chiron 2026 direct',directDate,'retrograde',retroDate);
