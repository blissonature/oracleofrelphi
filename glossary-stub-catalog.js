/* Oracle of Relphi — draft combinatorial astrology reference catalog.
 * This is a lazy, unindexed scaffold, NOT a generator of publishable SEO pages.
 * The names and aspects match Sky Chart's canonical registry/control identifiers.
 */
(function(host){
'use strict';
if(host.RelphiGlossaryStubCatalog)return;

const placements=Object.freeze([
 ['sun','Sun'],['moon','Moon'],['mercury','Mercury'],['venus','Venus'],
 ['mars','Mars'],['jupiter','Jupiter'],['saturn','Saturn'],['uranus','Uranus'],
 ['neptune','Neptune'],['pluto','Pluto'],['chiron','Chiron'],['lilith','Lilith'],
 ['part-of-fortune','Part of Fortune'],['vertex','Vertex'],
 ['anti-vertex','Anti-Vertex'],['north-node','North Node'],['south-node','South Node'],
 ['asc','Ascendant'],['dsc','Descendant'],['mc','Midheaven'],['ic','Imum Coeli']
].map(([id,label])=>Object.freeze({id,label})));
const aspects=Object.freeze([
 ['conjunction','Conjunction',0],['semi-sextile','Semi-Sextile',30],
 ['octile','Octile',45],['sextile','Sextile',60],['quintile','Quintile',72],
 ['square','Square',90],['trine','Trine',120],['tri-octile','Tri-Octile',135],
 ['bi-quintile','Bi-Quintile',144],['quincunx','Quincunx',150],
 ['opposition','Opposition',180]
].map(([id,label,degrees])=>Object.freeze({id,label,degrees})));
const signs=Object.freeze(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
 .map((label,index)=>Object.freeze({id:label.toLowerCase(),label,index})));
const houses=Object.freeze(Array.from({length:12},(_,i)=>Object.freeze({id:String(i+1),label:'House '+(i+1),number:i+1})));
const scopes=Object.freeze([
 {id:'transit-to-natal',label:'Transiting placement → natal placement'},
 {id:'intersky',label:'Sky A → Sky B'},
 {id:'intrasky',label:'Within one sky'}
].map(x=>Object.freeze(x)));
const rxCapable=Object.freeze([
 'mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
 'chiron','lilith','north-node','south-node'
]);
const maps=Object.freeze({
 source:new Map(placements.map(x=>[x.id,x])),
 target:new Map(placements.map(x=>[x.id,x])),
 aspect:new Map(aspects.map(x=>[x.id,x])),
 sourceSign:new Map(signs.map(x=>[x.id,x])),
 targetSign:new Map(signs.map(x=>[x.id,x])),
 sourceHouse:new Map(houses.map(x=>[x.id,x])),
 targetHouse:new Map(houses.map(x=>[x.id,x])),
 scope:new Map(scopes.map(x=>[x.id,x]))
});
const defaults=Object.freeze({
 scope:'transit-to-natal',source:'uranus',sourceRx:true,
 sourceSign:'gemini',sourceHouse:'10',aspect:'opposition',
 target:'part-of-fortune',targetRx:false,targetSign:'sagittarius',targetHouse:'3'
});
function normalize(raw){
 const input={...defaults,...(raw||{})};
 const out={};
 for(const key of ['scope','source','sourceSign','sourceHouse','aspect','target','targetSign','targetHouse']){
   const value=String(input[key]).toLowerCase().trim();
   if(!maps[key].has(value))throw new RangeError('Unknown '+key+': '+value);
   out[key]=value;
 }
 for(const side of ['source','target']){
   const key=side+'Rx',requested=input[key]===true||input[key]===1||input[key]==='1'||input[key]==='true';
   if(requested&&!rxCapable.includes(out[side]))throw new RangeError(out[side]+' does not support Rx in this catalog');
   out[key]=requested;
 }
 return Object.freeze(out);
}
function wrap(degrees){return((degrees+180)%360+360)%360-180;}
function exactSignGeometry(config){
 const p=normalize(config),base=30*(maps.sourceSign.get(p.sourceSign).index-maps.targetSign.get(p.targetSign).index),angle=maps.aspect.get(p.aspect).degrees;
 // Signs each span [0,30). A pair can reach angle A when the wrapped
 // sign-origin difference falls STRICTLY within 30 degrees of +A or -A.
 return [angle,-angle].some(targetAngle=>Math.abs(wrap(base-targetAngle))<30-1e-9);
}
function idOf(config){
 const p=normalize(config);
 return [p.scope,p.source+(p.sourceRx?'-rx':''),p.sourceSign,'h'+p.sourceHouse,p.aspect,
         p.target+(p.targetRx?'-rx':''),p.targetSign,'h'+p.targetHouse].join('__');
}
function makeStub(config){
 const p=normalize(config),a=maps.source.get(p.source),b=maps.target.get(p.target),aspect=maps.aspect.get(p.aspect);
 const possible=exactSignGeometry(p);
 const labelA=a.label+(p.sourceRx?' Rx':'')+' in '+maps.sourceSign.get(p.sourceSign).label+' · '+maps.sourceHouse.get(p.sourceHouse).label;
 const labelB=b.label+(p.targetRx?' Rx':'')+' in '+maps.targetSign.get(p.targetSign).label+' · '+maps.targetHouse.get(p.targetHouse).label;
 return {
   schemaVersion:1,
   id:idOf(p),
   status:'stub',
   scope:{id:p.scope,label:maps.scope.get(p.scope).label},
   source:{id:p.source,label:a.label,retrograde:p.sourceRx,sign:p.sourceSign,house:Number(p.sourceHouse)},
   aspect:{id:p.aspect,label:aspect.label,degrees:aspect.degrees},
   target:{id:p.target,label:b.label,retrograde:p.targetRx,sign:p.targetSign,house:Number(p.targetHouse)},
   title:labelA+' — '+aspect.label+' — '+labelB,
   geometry:{exactAspectPossibleFromSignPair:possible,
     note:possible?'Signs permit this exact angular separation; degrees and houses still require a real chart.':'These two signs cannot form this exact aspect; do not publish as a literal exact hit.'},
   interpretation:{
     simpleDefinition:null,
     combinedMeaning:null,
     signAndHouseNuance:null,
     timingAndPasses:null,
     caveats:null
   },
   publication:{approved:false,indexable:false,readyForSitemap:false},
   method:'Astrological symbolism; actual placement degrees, house system, chart scope and timing must be verified before writing an interpretation.'
 };
}
function count(){
 return placements.length*aspects.length*placements.length*
   signs.length*houses.length*signs.length*houses.length;
}
// Iterate in a deterministic order; use filters and LIMIT to avoid enumerating
// the 100-million-record Cartesian product in memory or generating doorway pages.
function* enumerate({filter={},limit=20}={}){
 const permitted=['scope','source','sourceSign','sourceHouse','aspect','target','targetSign','targetHouse','sourceRx','targetRx'];
 for(const key of Object.keys(filter))if(!permitted.includes(key))throw new RangeError('Unknown filter '+key);
 const choices=(key,list)=>filter[key]===undefined?list.map(x=>x.id):[String(filter[key]).toLowerCase()];
 const finiteLimit=Number(limit);
 if(!Number.isInteger(finiteLimit)||finiteLimit<0||finiteLimit>1000)throw new RangeError('limit must be 0–1000');
 let seen=0;
 // Context, degrees, retrogrades are independent. The base matrix defaults to
 // direct motion; Rx is a qualifier on demand, not part of the count().
 const scope=filter.scope??'transit-to-natal';
 for(const source of choices('source',placements))
 for(const aspect of choices('aspect',aspects))
 for(const target of choices('target',placements))
 for(const sourceSign of choices('sourceSign',signs))
 for(const sourceHouse of choices('sourceHouse',houses))
 for(const targetSign of choices('targetSign',signs))
 for(const targetHouse of choices('targetHouse',houses)){
   if(seen>=finiteLimit)return;
   const config={...defaults,scope,source,aspect,target,sourceSign,sourceHouse,targetSign,targetHouse,sourceRx:filter.sourceRx??false,targetRx:filter.targetRx??false};
   const stub=makeStub(config);
   yield stub;seen++;
 }
}
function query(config){
 const p=normalize(config),order=['scope','source','sourceRx','sourceSign','sourceHouse','aspect','target','targetRx','targetSign','targetHouse'];
 const params=new URLSearchParams();
 for(const k of order)params.set(k,typeof p[k]==='boolean'?(p[k]?'1':'0'):p[k]);
 return params.toString();
}
host.RelphiGlossaryStubCatalog=Object.freeze({
 placements,aspects,signs,houses,scopes,rxCapable,defaults,
 normalize,exactSignGeometry,idOf,makeStub,count,enumerate,query
});
})(typeof window!=='undefined'?window:globalThis);
