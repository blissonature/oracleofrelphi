// A single, extensible harmonic-aspect catalogue for Sky Chart.
// Integer orders 2–40, irreducible numerators only, with traditional names
// where reasonably established. Unnamed fractions retain explicit Hn m/n
// labels; an order is not assigned a speculative astrological meaning.
(function(){
'use strict';
if(window.RelphiHarmonicAspectCatalog)return;
const MAX_ORDER=40;
const LEGACY=[
 ['conjunction','Conjunction',0,0,1,'#e53935','major'],
 ['semi-sextile','Semi-Sextile',30,1,12,'#7c9b49','minor'],
 ['octile','Octile',45,1,8,'#b86d43','minor'],
 ['sextile','Sextile',60,1,6,'#d3b727','major'],
 ['quintile','Quintile',72,1,5,'#8b6cc2','harmonic'],
 ['square','Square',90,1,4,'#d6534d','major'],
 ['trine','Trine',120,1,3,'#4e9e69','major'],
 ['tri-octile','Tri-Octile',135,3,8,'#9f5944','minor'],
 ['bi-quintile','Bi-Quintile',144,2,5,'#7655aa','harmonic'],
 ['quincunx','Quincunx',150,5,12,'#4b8e88','minor'],
 ['opposition','Opposition',180,1,2,'#5961c8','major']
];
const NAMED={
 7:{1:['septile','Septile'],2:['bi-septile','Biseptile'],3:['tri-septile','Triseptile']},
 9:{1:['novile','Novile'],2:['bi-novile','Binovile'],4:['quadri-novile','Quadranovile']},
 10:{1:['decile','Decile'],3:['tri-decile','Tridecile']},
 11:{1:['undecile','Undecile'],2:['bi-undecile','Biundecile'],3:['tri-undecile','Triundecile'],4:['quadri-undecile','Quadriundecile'],5:['quin-undecile','Quinundecile']},
 14:{1:['semi-septile','Semiseptile'],3:['tri-semi-septile','Tresemiseptile'],5:['quin-semi-septile','Quinsemiseptile']},
 15:{1:['quindecile','Quindecile (24°)'],2:['bi-quindecile','Biquindecile'],4:['quadri-quindecile','Quadraquindecile'],7:['sep-quindecile','Sepquindecile']},
 16:{1:['semi-octile','Semioctile'],3:['tri-semi-octile','Sesquioctile'],5:['quin-semi-octile','Quinsemioctile'],7:['sep-semi-octile','Sepsemioctile']},
 18:{1:['semi-novile','Seminovile'],5:['quin-semi-novile','Quin-seminovile'],7:['sep-semi-novile','Sep-seminovile']},
 20:{1:['vigintile','Vigintile'],3:['tri-vigintile','Trivigintile'],7:['sep-vigintile','Sepvigintile'],9:['non-vigintile','Nonvigintile']},
 24:{1:['semi-duodecile','Semiduodecile'],5:['quin-semi-duodecile','Quinsemiduodecile'],7:['sep-semi-duodecile','Sepsemiduodecile'],11:['undec-semi-duodecile','Undecsemiduodecile']},
 36:{1:['trigintasextile','Trigintasextile']},
 40:{1:['quadragintile','Quadragintile']}
};
const BASE_IDS=new Set(LEGACY.map(a=>a[0]));
const gcd=(a,b)=>b?gcd(b,a%b):a;
const base=LEGACY.map(([id,label,angle,numerator,harmonic,color,group])=>Object.freeze({id,label,angle,numerator,harmonic,color,group,legacy:true,aliases:[]}));
const aspects=[...base];
function hueFor(angle){return 'hsl('+((Math.round(angle*1.65)+4)%360)+' 62% 43%)'}
for(let n=2;n<=MAX_ORDER;n++){
 for(let m=1;m<=Math.floor(n/2);m++){
  if(gcd(m,n)!==1)continue;
  if(base.some(a=>a.harmonic===n&&a.numerator===m))continue;
  const label= NAMED[n]?.[m];
  const id=label?.[0]||'harmonic-'+n+'-'+m;
  const name=label?.[1]||('Harmonic '+n+' · '+m+'/'+n);
  const aliases=[];
  if(id==='tri-decile')aliases.push('tridecile','tredecile','sesquiquintile');
  if(id==='undecile')aliases.push('elftile');
  if(id==='bi-undecile')aliases.push('bielftile');
  if(id==='tri-undecile')aliases.push('trielftile');
  if(id==='quadri-undecile')aliases.push('quadrelftile');
  if(id==='quin-undecile')aliases.push('quinelftile');
  if(id==='quindecile')aliases.push('trientquintile');
  const angle=360*m/n;
  aspects.push(Object.freeze({id,label:name,angle,numerator:m,harmonic:n,color:hueFor(angle),group:'order-'+n,legacy:false,aliases}));
 }
}
aspects.sort((a,b)=>a.angle-b.angle||a.harmonic-b.harmonic);
const byId=new Map();
const byAlias=new Map();
for(const a of aspects){
 byId.set(a.id,a);
 for(const candidate of [a.id,a.label,...a.aliases])byAlias.set(String(candidate).trim().toLowerCase(),a);
}
const ORDERS=Object.freeze([...new Set(aspects.filter(a=>!a.legacy).map(a=>a.harmonic))].sort((a,b)=>a-b));
const group=n=>aspects.filter(a=>a.harmonic===n&&!a.legacy);
const FAMILY_REFERENTS=Object.freeze({
 7:'choice, thresholds, and the tension between intention and circumstance in septile symbolism',
 9:'inward ripening, completion, and integration in novile symbolism',
 10:'creative specialization and the discovery of unusual patterns in the tenth harmonic',
 11:'adjustment to competing impulses and unconventional resolutions in eleventh-harmonic symbolism'
});
const referent=a=>FAMILY_REFERENTS[a.harmonic]||('an exact '+a.numerator+'/'+a.harmonic+' division of the zodiacal circle; interpretation varies by astrological school');
window.RelphiHarmonicAspectCatalog=Object.freeze({maxOrder:MAX_ORDER,aspects:Object.freeze(aspects),legacyIds:Object.freeze([...BASE_IDS]),orders:ORDERS,byId:id=>byId.get(String(id||''))||byAlias.get(String(id||'').toLowerCase())||null,group,referent});
})();
