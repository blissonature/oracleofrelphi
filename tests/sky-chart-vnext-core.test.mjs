import assert from'node:assert/strict';
import{canonicalId,placement,placementEntries,calculateRelationships,calculateRelationshipPool,normalizeName}from'../sky-chart-vnext/core/model.mjs';
import{layoutWheel,assertLayoutInvariant}from'../sky-chart-vnext/core/layout.mjs';
import{initialState,reducer,modeOf}from'../sky-chart-vnext/core/store.mjs';
import{placementPassesFilters,relationshipMode,relationshipPassesFilters}from'../sky-chart-vnext/core/filters.mjs';
import{freshnessText,isLiveSky}from'../sky-chart-vnext/core/freshness.mjs';
import{nameExists,suggestUniqueName,saveNewSky,readLibrary}from'../sky-chart-vnext/core/storage.mjs';
import{exactInstant,solarAltitudeFromGeometry}from'../sky-chart-vnext/core/astronomy.mjs';

function sample(name,offset=0){
  const raw={Sun:29.7,Moon:29.9,Mercury:30.1,Venus:30.3,Mars:31.0,Jupiter:58.9,Saturn:59.2,Uranus:59.7,Neptune:60.2,Pluto:61.0,Ascendant:168.38,Midheaven:76.28};
  const placements=Object.fromEntries(Object.entries(raw).map(([key,value])=>[key,placement(key,value+offset)]));
  const cusps=Array.from({length:12},(_,i)=>(150+i*30)%360);
  return{name,placements,houseCusps:cusps,calcProfile:{instant:'2026-08-21T18:00:00.000Z',latitude:'40.7608',longitude:'-111.891',timeZone:'America/Denver',location:'Salt Lake City, Utah',houseSystem:'whole-sign',houseCusps:cusps}};
}

const a=sample('A'),b=sample('B',15);
let state=initialState();
assert.equal(modeOf(state),'empty');
state=reducer(state,{type:'SET_SLOT',slot:'A',sky:a});
assert.equal(modeOf(state),'single');
state=reducer(state,{type:'SET_SLOT',slot:'B',sky:b});
assert.equal(modeOf(state),'comparison');
state=reducer(state,{type:'CLEAR_SLOT',slot:'A'});
assert.equal(modeOf(state),'empty');
assert.equal(state.slots.B,null,'Clearing Sky A must also clear dependent Sky B.');

const model=layoutWheel(a,b,3);
assert.equal(assertLayoutInvariant(model.placements),true);
for(const item of model.placements){
  assert.equal(Math.floor(item.longitude/30),Math.floor(item.displayLongitude/30),`${item.name} crossed a sign boundary.`);
  assert.equal(item.leader.placementId,item.id,'Leader identity must come from its placement.');
  assert.equal(item.leader.slot,item.slot,'Leader slot must come from its placement.');
}
assert.ok(calculateRelationships(a,b,3).length>0,'Comparison must derive relationships directly from the two skies.');
const pool=calculateRelationshipPool(a,b,3);
assert.ok(pool.some(relation=>relation.scope==='A-A'));
assert.ok(pool.some(relation=>relation.scope==='A-B'));
assert.ok(pool.some(relation=>relation.scope==='B-B'));
assert.equal(new Set(pool.map(relation=>relation.id)).size,pool.length,'Every relationship must have a stable unique endpoint-and-aspect ID.');

let filtered=initialState({slots:{A:a,B:b},orb:3});
assert.equal(relationshipMode(filtered),'A-B');
filtered=reducer(filtered,{type:'SET_FILTER_EXCLUDED',kind:'placements',slot:'A',values:placementEntries(filtered.slots.A).map(item=>item.id)});
assert.equal(relationshipMode(filtered),'B-B','Disabling all Sky A placements must derive the Sky B internal relationship mode.');
assert.ok(pool.filter(relation=>relationshipPassesFilters(filtered,relation)).every(relation=>relation.scope==='B-B'));
filtered=reducer(filtered,{type:'RESET_FILTERS'});
filtered=reducer(filtered,{type:'SET_FILTER_EXCLUDED',kind:'placements',slot:'B',values:placementEntries(filtered.slots.B).map(item=>item.id)});
assert.equal(relationshipMode(filtered),'A-A','Disabling all Sky B placements must derive the Sky A internal relationship mode.');
filtered=reducer(filtered,{type:'RESET_FILTERS'});
const ascendant=placementEntries(filtered.slots.A).find(item=>item.name==='Ascendant');
filtered=reducer(filtered,{type:'SET_FILTER_EXCLUDED',kind:'houses',slot:'A',values:Array.from({length:12},(_,index)=>String(index+1))});
assert.equal(placementPassesFilters(filtered,'A',ascendant),true,'House filters must not capture chart angles.');
filtered=reducer(filtered,{type:'SET_FILTER_EXCLUDED',kind:'signs',slot:'A',values:[canonicalId(ascendant.sign)]});
assert.equal(placementPassesFilters(filtered,'A',ascendant),false,'Sign filters must still apply to chart angles.');
filtered=reducer(filtered,{type:'RESET_FILTERS'});
const cross=pool.find(relation=>relation.scope==='A-B');
filtered=reducer(filtered,{type:'SET_FILTER_EXCLUDED',kind:'aspects',values:[cross.aspectId]});
assert.equal(relationshipPassesFilters(filtered,cross),false,'Aspect filtering must derive from store state without event rebroadcasting.');

const hereNow={calcProfile:{source:'here-now-vnext',instant:'2026-08-22T02:00:00.000Z'}};
const updatedNow={calcProfile:{source:'update-now-vnext',instant:'2026-08-22T02:00:00.000Z'}};
const exactSky={calcProfile:{source:'exact-vnext',instant:'2026-08-22T02:00:00.000Z'}};
assert.equal(isLiveSky(hereNow),true,'Here and Now skies must carry live freshness provenance.');
assert.equal(isLiveSky(updatedNow),true,'Update to Now skies must carry live freshness provenance.');
assert.equal(isLiveSky(exactSky),false,'Exact/manual skies must not be treated as live merely because they have a timestamp.');
assert.equal(freshnessText(hereNow,Date.parse('2026-08-22T02:00:30.000Z')),'Now');
assert.equal(freshnessText(hereNow,Date.parse('2026-08-22T02:05:00.000Z')),'5 minutes ago');
assert.equal(freshnessText(updatedNow,Date.parse('2026-08-22T02:01:00.000Z')),'1 minute ago');
assert.equal(freshnessText(exactSky,Date.parse('2026-08-22T02:05:00.000Z')),'','Exact/manual skies must have no freshness readout.');

assert.ok(Math.abs(solarAltitudeFromGeometry(0,0,0,0)-90)<1e-9,'A Sun on the equatorial meridian at the equator must be overhead.');
assert.ok(Math.abs(solarAltitudeFromGeometry(0,0,180,0)+90)<1e-9,'The opposite meridian must put that Sun directly below the horizon.');
assert.ok(Math.abs(solarAltitudeFromGeometry(0,0,0,45)-45)<1e-9,'Meridian altitude must respond to geographic latitude rather than house numbering.');
assert.equal(exactInstant('2026-08-21T18:00','America/Denver').toISOString(),'2026-08-22T00:00:00.000Z','Summer Mountain Time must resolve without a downloaded date-time library.');
assert.equal(exactInstant('2026-01-21T18:00','America/Denver').toISOString(),'2026-01-22T01:00:00.000Z','Winter Mountain Time must resolve the seasonal UTC offset.');
assert.throws(()=>exactInstant('2026-03-08T02:30','America/Denver'),/does not exist/,'A skipped DST clock time must be rejected rather than silently changed.');

const records=[{id:'1',name:'Marisa Natal'},{id:'2',name:'Marisa Natal 2'}];
assert.equal(normalizeName('  MARISA   Natal '),'marisa natal');
assert.equal(nameExists('marisa natal',records),true,'Saved-sky names are case-insensitively unique.');
assert.equal(suggestUniqueName('Marisa Natal',records),'Marisa Natal 3');

class MemoryStorage{
  constructor(){this.map=new Map()}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}
const storage=new MemoryStorage(),first=saveNewSky(a,'My Sky',storage),duplicate=saveNewSky(b,'my sky',storage);
assert.equal(first.ok,true);
assert.equal(duplicate.ok,false,'A duplicate name must never overwrite an existing saved sky.');
assert.equal(duplicate.suggestion,'my sky 2');
assert.equal(readLibrary(storage).length,1,'Duplicate save must leave the original library intact.');

console.log('Sky Chart vNext core invariants passed.');
