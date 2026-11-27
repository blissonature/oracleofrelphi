// Relationship sorting: exactitude, aspect taxonomy, strength/valence, duration, and phase-end timing.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipSortV1)return;
window.__relphiRelationshipSortV1=true;

const MODES=Object.freeze({
  angular:'angular-separation',harmonic:'harmonic-order',zodiac:'zodiacal-order',
  exact:'exact',
  aspect:'aspect',
  strongest:'strongest',
  challenging:'most-challenging',
  supportive:'most-supportive',
  longest:'duration-longest',
  shortest:'duration-shortest',
  beganMostRecently:'began-most-recently',
  endsSoonest:'ends-soonest',
  endsLast:'ends-last',
  applying:'applying-first',
  separating:'separating-first',
  closing:'closing-first',
  opening:'opening-first',
  referenceResolution:'reference-resolution'
});
const ASPECT_ORDER=Object.freeze([
  'conjunction','opposition','trine','square','sextile',
  'quincunx','semi-sextile','quintile','bi-quintile','octile','tri-octile'
]);
const ASPECT_RANK=new Map(ASPECT_ORDER.map((id,index)=>[id,index]));
const AXIS_FAMILY=Object.freeze({
  asc:'horizon',dsc:'horizon',
  mc:'meridian',ic:'meridian',
  'north-node':'nodes','south-node':'nodes'
});
const SIGNIFICANCE_HIDDEN_CLASSES=Object.freeze([
  'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
  'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
  'sky-chart-zodiac-filter-hidden','sky-chart-semantic-hidden'
]);

// The ranking model is deliberately scope-agnostic: A↔B, A↔A, and B↔B use
// the same score. Sky A/B may be natal, event, or current; neither is privileged.
//
// Harmonic order is charged once, through phase error. Aspect prominence is only
// the intrinsic prominence of the geometric operation; it is not a second harmonic penalty.
const EXACTNESS_HALF_PHASE=3;
const EXACTNESS_EXPONENT=1.75;
const ASPECT_PROMINENCE=Object.freeze({
  conjunction:1,
  opposition:.98,
  square:.96,
  trine:.94,
  sextile:.92,
  quincunx:.88,
  'tri-octile':.87,
  octile:.86,
  quintile:.86,
  'bi-quintile':.85,
  'semi-sextile':.84
});
const ASPECT_VALENCE=Object.freeze({
  trine:.8,
  sextile:.65,
  quintile:.25,
  'bi-quintile':.25,
  'semi-sextile':.1,
  conjunction:0,
  quincunx:-.45,
  octile:-.4,
  'tri-octile':-.45,
  opposition:-.7,
  square:-.75
});
const HARMONIC_ORDER=Object.freeze({
  conjunction:1,
  opposition:2,
  trine:3,
  square:4,
  quintile:5,
  'bi-quintile':5,
  sextile:6,
  octile:8,
  'tri-octile':8,
  quincunx:12,
  'semi-sextile':12
});

// Active bodies have agency. Sensitive anchors are locations/points that can be struck.
// Chiron remains an active astronomical body, but with lower authority than a planet.
const ACTIVE_AUTHORITY=Object.freeze({
  sun:1.1,moon:1.1,
  mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
  chiron:.85
});
const ANCHOR_SENSITIVITY=Object.freeze({
  asc:1.1,dsc:1.1,mc:1.1,ic:1.1,
  'north-node':.85,'south-node':.85,
  'part-of-fortune':.8,
  lilith:.7,vertex:.7
});
const ANCHOR_ANCHOR_FACTOR=.55;
const PLANETARY_NATURE=Object.freeze({
  jupiter:.25,venus:.22,
  sun:0,moon:0,mercury:0,
  mars:-.22,saturn:-.25,
  uranus:0,neptune:0,pluto:0,chiron:0
});
const SCORE_MODEL=Object.freeze({
  exactnessHalfPhase:EXACTNESS_HALF_PHASE,
  exactnessExponent:EXACTNESS_EXPONENT,
  aspectProminence:ASPECT_PROMINENCE,
  aspectValence:ASPECT_VALENCE,
  activeAuthority:ACTIVE_AUTHORITY,
  anchorSensitivity:ANCHOR_SENSITIVITY,
  anchorAnchorFactor:ANCHOR_ANCHOR_FACTOR,
  planetaryNature:PLANETARY_NATURE
});

let scoreCache=new WeakMap();
let mode=MODES.exact;
const learn=()=>window.RelphiSkyStartupMode?.readMode?.()==='learn';
const LEARN_OPTIONS=[[MODES.angular,'Angular Separation'],[MODES.harmonic,'Harmonic Order'],[MODES.challenging,'Most Challenging First'],[MODES.supportive,'Most Supportive First'],[MODES.zodiac,'Zodiacal Order']];
let learnMode=MODES.angular,natalMode=MODES.exact,previousLearn=null;
function syncMode(){const current=learn();if(current===previousLearn)return;if(previousLearn!==null){if(previousLearn)learnMode=mode;else natalMode=mode;}mode=current?learnMode:natalMode;previousLearn=current;calculationGeneration++;busy=false;clearTimeout(transitTimer);}
let calculationGeneration=0;
let busy=false,transitTimer=0;
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}

function number(row,key,fallback=Infinity){
  const value=Number(row?.dataset?.[key]);
  return Number.isFinite(value)?value:fallback;
}
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
function relationOrdinal(row){
  const raw=String(row?.dataset?.relationIndex||'');
  const match=raw.match(/(\d+)(?!.*\d)/);
  return match?Number(match[1]):Infinity;
}
function compareExact(a,b){
  return number(a,'phaseError')-number(b,'phaseError') ||
    number(a,'harmonicOrder')-number(b,'harmonicOrder') ||
    number(a,'sourceOrb')-number(b,'sourceOrb') ||
    relationOrdinal(a)-relationOrdinal(b);
}
function compareAspect(a,b){
  const ar=ASPECT_RANK.get(String(a?.dataset?.aspect||''))??999;
  const br=ASPECT_RANK.get(String(b?.dataset?.aspect||''))??999;
  return ar-br||compareExact(a,b);
}
function normalizedPoint(id){return String(id||'').trim().toLowerCase()}
function endpointSky(row,side){
  const stored=String(row?.dataset?.[side==='left'?'leftSky':'rightSky']||'').trim().toUpperCase();
  if(stored==='A'||stored==='B')return stored;
  const mode=String(row?.dataset?.relationshipMode||'A-B').toUpperCase();
  if(mode==='A-A')return'A';
  if(mode==='B-B')return'B';
  return side==='left'?'A':'B';
}
function endpointFamilyToken(row,side){
  const key=side==='left'?'leftPlacement':'rightPlacement';
  const point=normalizedPoint(row?.dataset?.[key]);
  const axis=AXIS_FAMILY[point];
  return `${endpointSky(row,side)}:${axis?`axis:${axis}`:`point:${point}`}`;
}
function axisFamilyKey(row){
  const left=normalizedPoint(row?.dataset?.leftPlacement),right=normalizedPoint(row?.dataset?.rightPlacement);
  if(!AXIS_FAMILY[left]&&!AXIS_FAMILY[right])return'';
  return [endpointFamilyToken(row,'left'),endpointFamilyToken(row,'right')].sort().join('|');
}
function rowEligibleForSignificanceFamily(row){
  if(!row)return false;
  // Keep significance-family ranking stable while wheel selection temporarily hides
  // nonmatching rows via hidden/aria-hidden. Only persistent filter classes remove a
  // row from the ranking pool.
  return !SIGNIFICANCE_HIDDEN_CLASSES.some(name=>row.classList?.contains(name));
}
function activeAuthority(id){return ACTIVE_AUTHORITY[normalizedPoint(id)]??null}
function anchorSensitivity(id){return ANCHOR_SENSITIVITY[normalizedPoint(id)]??null}
function isActive(id){return activeAuthority(id)!=null}
function phaseError(row){
  const stored=number(row,'phaseError',NaN);
  if(Number.isFinite(stored))return Math.max(0,stored);
  const orb=number(row,'sourceOrb',0);
  const aspectId=String(row?.dataset?.aspect||'');
  const harmonic=number(row,'harmonicOrder',HARMONIC_ORDER[aspectId]??1);
  return Math.max(0,orb)*Math.max(1,harmonic);
}
function exactness(row){
  const ratio=phaseError(row)/EXACTNESS_HALF_PHASE;
  return 1/(1+Math.pow(Math.max(0,ratio),EXACTNESS_EXPONENT));
}
function contactAuthority(left,right){
  const leftActive=activeAuthority(left),rightActive=activeAuthority(right);
  const leftAnchor=anchorSensitivity(left),rightAnchor=anchorSensitivity(right);
  // Two actors share agency; geometric mean keeps the relationship symmetric without
  // letting one unusually high authority dominate the other.
  if(leftActive!=null&&rightActive!=null)return Math.sqrt(leftActive*rightActive);
  // An active body striking an anchor is limited by what it strikes: anchor sensitivity
  // is allowed to matter fully rather than being averaged away by the body's agency.
  if(leftActive!=null&&rightAnchor!=null)return leftActive*rightAnchor;
  if(rightActive!=null&&leftAnchor!=null)return rightActive*leftAnchor;
  // Anchor↔anchor is correspondence between sensitive locations, not two active agents.
  if(leftAnchor!=null&&rightAnchor!=null)return ANCHOR_ANCHOR_FACTOR*Math.sqrt(leftAnchor*rightAnchor);
  // Unknown endpoints remain visible but do not receive special authority.
  if(leftActive!=null||rightActive!=null)return .8;
  if(leftAnchor!=null||rightAnchor!=null)return .55;
  return .5;
}
function natureAdjustment(left,right){
  const active=[];
  if(isActive(left))active.push(PLANETARY_NATURE[normalizedPoint(left)]??0);
  if(isActive(right))active.push(PLANETARY_NATURE[normalizedPoint(right)]??0);
  if(!active.length)return 0;
  return active.reduce((sum,value)=>sum+value,0)/active.length;
}
function relationshipScore(row){
  if(!row)return Object.freeze({strength:0,valence:0,signed:0,challenge:0,support:0,exactness:0,contactAuthority:0,phaseError:Infinity});
  const cached=scoreCache.get(row);
  if(cached)return cached;

  const aspectId=String(row.dataset.aspect||'');
  const left=normalizedPoint(row.dataset.leftPlacement);
  const right=normalizedPoint(row.dataset.rightPlacement);
  const prominence=ASPECT_PROMINENCE[aspectId]??.8;
  const precision=exactness(row);
  const authority=contactAuthority(left,right);
  const strength=prominence*precision*authority;
  const nature=natureAdjustment(left,right);
  const geometricValence=ASPECT_VALENCE[aspectId]??0;
  const valence=clamp(
    aspectId==='conjunction' ? nature*1.5 : geometricValence+nature,
    -1,
    1
  );
  const signed=strength*valence;
  const result=Object.freeze({
    strength,
    valence,
    signed,
    challenge:strength*Math.max(-valence,0),
    support:strength*Math.max(valence,0),
    exactness:precision,
    contactAuthority:authority,
    phaseError:phaseError(row)
  });
  scoreCache.set(row,result);
  row.dataset.relationshipStrength=strength.toFixed(6);
  // Backward-compatible alias for the first scoring draft.
  row.dataset.relationshipIntensity=strength.toFixed(6);
  row.dataset.relationshipValence=valence.toFixed(6);
  row.dataset.relationshipSignedScore=signed.toFixed(6);
  row.dataset.relationshipChallengeScore=result.challenge.toFixed(6);
  row.dataset.relationshipSupportScore=result.support.toFixed(6);
  row.dataset.relationshipExactness=precision.toFixed(6);
  row.dataset.relationshipContactAuthority=authority.toFixed(6);
  return result;
}
function invalidateScores(){scoreCache=new WeakMap()}
function compareRawStrength(a,b){
  const as=relationshipScore(a),bs=relationshipScore(b);
  return bs.strength-as.strength || compareExact(a,b);
}
function compareRawSigned(a,b,direction){
  const as=relationshipScore(a),bs=relationshipScore(b);
  const delta=chartCompatibility(a)-chartCompatibility(b);
  if(delta!==0)return direction==='supportive'?-delta:delta;
  return bs.strength-as.strength || compareExact(a,b);
}
function axisFamilyRows(row){
  const key=axisFamilyKey(row);
  if(!key)return[row];
  const list=row?.closest?.('#skyFoundationRelationshipList');
  if(!list)return[row];
  const siblings=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row[data-relation-index]')]
    .filter(candidate=>rowEligibleForSignificanceFamily(candidate)&&axisFamilyKey(candidate)===key);
  return siblings.length?siblings:[row];
}
// A family has one stable representative for all significance sorts: its strongest
// visible manifestation. This prevents the family identity from changing when the
// user switches between supportive and challenging views.
function axisFamilyRepresentative(row){
  const siblings=axisFamilyRows(row);
  let best=siblings[0];
  for(let index=1;index<siblings.length;index+=1){
    if(compareRawStrength(siblings[index],best)<0)best=siblings[index];
  }
  const key=axisFamilyKey(row);
  if(key){
    for(const sibling of siblings){
      sibling.dataset.relationshipAxisFamily=key;
      sibling.dataset.relationshipAxisFamilyPrimary=sibling===best?'true':'false';
    }
  }else{
    delete row.dataset.relationshipAxisFamily;
    delete row.dataset.relationshipAxisFamilyPrimary;
  }
  return best;
}
function sameAxisFamily(a,b){
  const ak=axisFamilyKey(a),bk=axisFamilyKey(b);
  return Boolean(ak&&ak===bk);
}
function compareSignificance(a,b,kind){
  const ar=axisFamilyRepresentative(a),br=axisFamilyRepresentative(b);

  // Mirrored manifestations stay together as one configuration block rather than
  // being dumped below unrelated rows. Their order within the block follows the
  // selected significance view.
  if(sameAxisFamily(a,b)){
    if(kind==='strength')return compareRawStrength(a,b);
    return compareRawSigned(a,b,kind==='support'?'supportive':'challenging');
  }

  // Families are positioned by their strongest manifestation. For valence views,
  // the signed score is continuous: Most Challenging runs negative→positive and
  // Most Supportive runs positive→negative, making the two views true opposites.
  if(kind==='strength')return compareRawStrength(ar,br);
  return compareRawSigned(ar,br,kind==='support'?'supportive':'challenging');
}
function timingValue(row,key){
  const value=Number(row?.dataset?.[key]);
  return Number.isFinite(value)?value:null;
}
function compareTiming(a,b,key,direction){
  const av=timingValue(a,key),bv=timingValue(b,key);
  if(av!=null&&bv!=null)return direction*(av-bv)||compareExact(a,b);
  if(av!=null)return-1;
  if(bv!=null)return 1;
  return compareExact(a,b);
}
function motionFor(row){
  const snapshot=window.RelphiRelationshipTransitMeta?.motionSnapshotForRow?.(row);
  if(!snapshot)return null;
  row.dataset.relationshipPhase=snapshot.phase;
  row.dataset.relationshipDistance=snapshot.distance;
  row.dataset.relationshipApplyingRate=String(snapshot.applyingRate);
  row.dataset.relationshipSeparationRate=String(snapshot.separationRate);
  return snapshot;
}
function compareMotion(a,b,kind){
  const am=motionFor(a),bm=motionFor(b);
  const rank=kind==='phase'
    ?{applying:0,exact:1,steady:2,separating:3}
    :{closing:0,steady:1,opening:2};
  const reverse=mode===MODES.separating||mode===MODES.opening;
  const ar=am?(rank[am[kind]]??9):10,br=bm?(rank[bm[kind]]??9):10;
  const ordered=reverse?(9-ar)-(9-br):ar-br;
  if(ordered)return ordered;
  const av=kind==='phase'?Math.abs(am?.applyingRate??0):Math.abs(am?.separationRate??0);
  const bv=kind==='phase'?Math.abs(bm?.applyingRate??0):Math.abs(bm?.separationRate??0);
  return bv-av||compareExact(a,b);
}
const REFERENCE_RESOLUTION=Object.freeze({
  asc:100,dsc:100,mc:100,ic:100,
  vertex:96,'part-of-fortune':96,
  moon:90,
  mercury:76,venus:74,sun:72,mars:68,
  'north-node':58,'south-node':58,lilith:56,
  jupiter:44,saturn:36,chiron:30,uranus:22,neptune:14,pluto:10
});
function referenceResolutionFor(row){
  const left=normalizedPoint(row?.dataset?.leftPlacement),right=normalizedPoint(row?.dataset?.rightPlacement);
  const leftValue=REFERENCE_RESOLUTION[left]??40,rightValue=REFERENCE_RESOLUTION[right]??40;
  const value=Math.max(leftValue,rightValue);
  row.dataset.referenceResolution=String(value);
  row.dataset.referenceResolutionEndpoint=leftValue>=rightValue?'left':'right';
  return value;
}
function compareReferenceResolution(a,b){
  return referenceResolutionFor(b)-referenceResolutionFor(a)||compareExact(a,b);
}
function zodiacCompare(a,b){const pair=r=>[Number(r.dataset.leftSign),Number(r.dataset.rightSign)].sort((x,y)=>x-y);const x=pair(a),y=pair(b);return x[0]-y[0]||x[1]-y[1]}
function angularDistance(row){const n=Math.abs(Number(row.dataset.leftSign)-Number(row.dataset.rightSign));return Math.min(n,12-n)*30}
// Learn uses equal votes, not the natal phase-error/authority model.
// House archetypes (Aries = 1) are a teaching convention, not actual planetary placements.
const LEARN_RULERS=Object.freeze(['mars','venus','mercury','moon','sun','mercury','venus','mars','jupiter','saturn','saturn','jupiter']);
const LEARN_EXALTATION=Object.freeze({sun:0,moon:1,jupiter:3,mercury:5,saturn:6,mars:9,venus:11});
const LEARN_FACE_SEQUENCE=Object.freeze(['mars','sun','venus','mercury','moon','saturn','jupiter']);
const LEARN_TRIPLICITY=Object.freeze([['sun','jupiter','saturn'],['venus','moon','mars'],['saturn','mercury','jupiter'],['venus','mars','moon']]);
const LEARN_JOYS=Object.freeze({0:'mercury',2:'moon',4:'venus',5:'mars',8:'sun',10:'jupiter',11:'saturn'});
const learnMod=n=>(n%12+12)%12;
function learnGeometry(a,b){
  const d=learnMod(a-b),s=Math.min(d,12-d);
  return [0,2,4].includes(s)?1:-1;
}
function learnDignity(p,s){
  // Shared domicile is already represented here; do not add a second ruler vote.
  if(LEARN_RULERS[s]===p||LEARN_EXALTATION[p]===s)return 1;
  if(LEARN_RULERS[learnMod(s+6)]===p||LEARN_EXALTATION[p]===learnMod(s+6))return -1;
  return 0;
}
function learnFace(p,s){return [0,1,2].some(i=>LEARN_FACE_SEQUENCE[(s*3+i)%7]===p)?1:0}
function learnTriplicity(p,s){return LEARN_TRIPLICITY[s%4].includes(p)?1:0}
function learnMirror(a,b){const sum=learnMod(a+b);return sum===5||sum===11?1:0}
function learnPairVotes(a,b,ha,hb){
  // a,b are zodiac indices; ha,hb are independently supplied zero-based house
  // assignments. Whole sign is only one caller of this house-system-neutral kernel.
  const pa=LEARN_RULERS[a],pb=LEARN_RULERS[b];
  const votes={};
  function relationship(label,x,y){
    votes[label+' geometry']=learnGeometry(x,y);
    // Symmetric sign correspondence; count shared domicile only once.
    votes[label+' dignity']=LEARN_RULERS[x]===LEARN_RULERS[y]?1:learnDignity(LEARN_RULERS[x],y);
    if(LEARN_RULERS[x]!==LEARN_RULERS[y])votes[label+' reciprocal dignity']=learnDignity(LEARN_RULERS[y],x);
    votes[label+' face affinity']=learnFace(LEARN_RULERS[x],y);
    votes[label+' reciprocal face affinity']=learnFace(LEARN_RULERS[y],x);
    votes[label+' triplicity affinity']=learnTriplicity(LEARN_RULERS[x],y);
    votes[label+' reciprocal triplicity affinity']=learnTriplicity(LEARN_RULERS[y],x);
    votes[label+' antiscia or contra-antiscia']=learnMirror(x,y);
  }
  relationship('sign pair',a,b);
  relationship('first sign and house',a,ha);
  relationship('second sign and house',b,hb);
  relationship('first sign and other house',a,hb);
  relationship('second sign and other house',b,ha);
  // No extra modality/element/polarity/harmonic votes: encoded by geometry.
  // No separate house-pair geometry: duplicates the sign pair in whole sign.
  votes['first ruler joy']=LEARN_JOYS[ha]===pa?1:0;
  votes['second ruler joy']=LEARN_JOYS[hb]===pb?1:0;
  votes['first house aversion']=[1,5,7,11].includes(ha)?-1:0;
  votes['second house aversion']=[1,5,7,11].includes(hb)?-1:0;
  return votes;
}
function learnPairScore(a,b,ha,hb){return Object.values(learnPairVotes(a,b,ha,hb)).reduce((sum,v)=>sum+v,0)}
const LEARN_WHOLE_SIGN_SCORES=Object.freeze([
  [[0,4,14,7,23,10,0,18,14,12,11,16],[4,0,7,27,7,15,8,8,4,14,13,15],[14,7,0,13,14,13,12,9,8,9,20,4],[7,27,13,0,7,18,14,14,16,2,7,18],[23,7,14,7,0,7,6,15,20,9,5,10],[10,15,13,18,7,0,11,14,1,8,10,-3],[0,8,12,14,6,11,0,4,15,13,21,17],[18,8,9,14,15,14,4,0,6,19,9,17],[14,4,8,16,20,1,15,6,0,12,20,13],[12,14,9,2,9,8,13,19,12,0,9,11],[11,13,20,7,5,10,21,9,20,9,0,10],[16,15,4,18,10,-3,17,17,13,11,10,0]],
  [[0,7,1,8,6,5,6,5,7,10,7,12],[7,0,4,6,9,3,2,2,-2,5,6,9],[1,4,0,12,1,6,5,0,-4,5,7,7],[8,6,12,0,8,6,10,4,3,5,4,5],[6,9,1,8,0,6,2,1,5,4,-1,4],[5,3,6,6,6,0,7,5,2,2,2,1],[6,2,5,10,2,7,0,3,-1,10,11,9],[5,2,0,4,1,5,3,0,5,7,9,8],[7,-2,-4,3,5,2,-1,5,0,10,5,9],[10,5,5,5,4,2,10,7,10,0,10,9],[7,6,7,4,-1,2,11,9,5,10,0,10],[12,9,7,5,4,1,9,8,9,9,10,0]],
  [[0,7,14,3,9,5,10,7,8,10,12,9],[7,0,3,20,5,11,8,10,7,10,8,14],[14,3,0,8,16,10,6,10,10,9,12,8],[3,20,8,0,7,20,8,11,11,10,12,11],[9,5,16,7,0,6,9,6,9,9,13,5],[5,11,10,20,6,0,8,12,8,7,5,6],[10,8,6,8,9,8,0,6,13,7,12,11],[7,10,10,11,6,12,6,0,1,16,6,8],[8,7,10,11,9,8,13,1,0,10,20,13],[10,10,9,10,9,7,7,16,10,0,10,12],[12,8,12,12,13,5,12,6,20,10,0,10],[9,14,8,11,5,6,11,8,13,12,10,0]],
  [[0,7,6,2,6,8,4,16,4,7,6,11],[7,0,7,5,4,8,16,4,5,10,7,7],[6,7,0,3,0,3,7,5,-1,6,2,3],[2,5,3,0,8,6,7,4,3,4,-1,9],[6,4,0,8,0,6,1,7,-1,6,1,9],[8,8,3,6,6,0,11,6,1,9,8,-2],[4,16,7,7,1,11,0,4,6,8,4,14],[16,4,5,4,7,6,4,0,4,9,6,7],[4,5,-1,3,-1,1,6,4,0,6,0,2],[7,10,6,4,6,9,8,9,6,0,12,13],[6,7,2,-1,1,8,4,6,0,12,0,9],[11,7,3,9,9,-2,14,7,2,13,9,0]],
  [[0,5,9,8,20,2,7,4,17,7,10,12],[5,0,10,12,8,13,9,14,8,11,12,10],[9,10,0,5,12,9,17,6,14,8,19,6],[8,12,5,0,6,10,11,13,9,5,9,12],[20,8,12,6,0,8,7,10,19,8,10,13],[2,13,9,10,8,0,9,8,3,10,12,6],[7,9,17,11,7,9,0,4,9,8,18,6],[4,14,6,13,10,8,4,0,8,5,4,15],[17,8,14,9,19,3,9,8,0,5,15,8],[7,11,8,5,8,10,8,5,5,0,10,5],[10,12,19,9,10,12,18,4,15,10,0,12],[12,10,6,12,13,6,6,15,8,5,12,0]],
  [[0,2,7,2,12,11,-2,13,4,14,4,10],[2,0,3,8,6,1,7,-2,10,5,8,9],[7,3,0,3,3,8,6,9,6,7,8,8],[2,8,3,0,0,4,12,1,13,-2,5,9],[12,6,3,0,0,4,4,7,7,8,0,9],[11,1,8,4,4,0,5,9,7,6,8,8],[-2,7,6,12,4,5,0,1,6,7,9,13],[13,-2,9,1,7,9,1,0,2,8,6,5],[4,10,6,13,7,7,6,2,0,7,3,14],[14,5,7,-2,8,6,7,8,7,0,2,11],[4,8,8,5,0,8,9,6,3,2,0,7],[10,9,8,9,9,8,13,5,14,11,7,0]],
  [[0,0,4,-1,3,0,0,-2,5,0,8,2],[0,0,-2,7,2,3,-4,8,-3,10,0,4],[4,-2,0,2,9,-5,5,-2,8,2,9,-1],[-1,7,2,0,-4,1,0,8,3,2,-4,2],[3,2,9,-4,0,-3,7,0,9,-2,5,-3],[0,3,-5,1,-3,0,1,3,-2,0,-3,-3],[0,-4,5,0,7,1,0,0,5,3,3,3],[-2,8,-2,8,0,3,0,0,-3,5,2,3],[5,-3,8,3,9,-2,5,-3,0,3,11,-5],[0,10,2,2,-2,0,3,5,3,0,-2,0],[8,0,9,-4,5,-3,3,2,11,-2,0,-2],[2,4,-1,2,-3,-3,3,3,-5,0,-2,0]],
  [[0,2,7,7,9,8,7,13,-2,7,1,7],[2,0,2,10,5,9,10,2,5,8,13,9],[7,2,0,3,5,8,2,10,-4,9,3,4],[7,10,3,0,4,3,13,4,12,4,10,7],[9,5,5,4,0,2,8,15,5,7,-1,9],[8,9,8,3,2,0,8,7,4,6,8,0],[7,10,2,13,8,8,0,6,7,11,10,12],[13,2,10,4,15,7,6,0,2,10,4,12],[-2,5,-4,12,5,4,7,2,0,4,5,8],[7,8,9,4,7,6,11,10,4,0,3,4],[1,13,3,10,-1,8,10,4,5,3,0,3],[7,9,4,7,9,0,12,12,8,4,3,0]],
  [[0,7,9,6,21,9,9,15,17,9,11,11],[7,0,7,11,6,13,12,9,0,12,9,11],[9,7,0,5,9,8,15,2,9,8,19,9],[6,11,5,0,8,4,5,12,2,10,4,15],[21,6,9,8,0,5,12,9,20,10,14,10],[9,13,8,4,5,0,12,6,4,9,9,6],[9,12,15,5,12,12,0,10,12,12,20,15],[15,9,2,12,9,6,10,0,8,10,7,13],[17,0,9,2,20,4,12,8,0,7,11,12],[9,12,8,10,10,9,12,10,7,0,10,8],[11,9,19,4,14,9,20,7,11,10,0,6],[11,11,9,15,10,6,15,13,12,8,6,0]],
  [[0,10,4,4,7,3,4,4,7,5,-1,6],[10,0,7,9,6,1,8,5,8,6,7,4],[4,7,0,9,4,5,9,7,-1,7,7,0],[4,9,9,0,3,7,7,1,11,4,13,9],[7,6,4,3,0,5,4,8,6,13,1,6],[3,1,5,7,5,0,7,0,-2,4,7,-2],[4,8,9,7,4,7,0,11,13,8,11,10],[4,5,7,1,8,0,11,0,7,10,5,3],[7,8,-1,11,6,-2,13,7,0,9,6,6],[5,6,7,4,13,4,8,10,9,0,8,7],[-1,7,7,13,1,7,11,5,6,8,0,8],[6,4,0,9,6,-2,10,3,6,7,8,0]],
  [[0,6,15,5,7,9,7,11,10,10,12,5],[6,0,9,23,6,13,11,14,14,12,7,18],[15,9,0,6,10,5,7,9,15,5,8,4],[5,23,6,0,3,11,11,7,6,6,2,10],[7,6,10,3,0,5,9,6,11,7,10,7],[9,13,5,11,5,0,3,14,4,5,4,6],[7,11,7,11,9,3,0,8,20,14,11,12],[11,14,9,7,6,14,8,0,10,15,9,11],[10,14,15,6,11,4,20,10,0,12,16,9],[10,12,5,6,7,5,14,15,12,0,7,13],[12,7,8,2,10,4,11,9,16,7,0,9],[5,18,4,10,7,6,12,11,9,13,9,0]],
  [[0,3,0,7,3,2,-2,2,3,5,5,11],[3,0,11,6,4,8,1,-2,4,7,10,4],[0,11,0,9,3,10,3,1,6,5,4,8],[7,6,9,0,4,6,0,3,5,-2,1,5],[3,4,3,4,0,5,1,6,4,1,1,5],[2,8,10,6,5,0,6,0,6,8,6,7],[-2,1,3,0,1,6,0,5,5,11,8,6],[2,-2,1,3,6,0,5,0,8,6,7,10],[3,4,6,5,4,6,5,8,0,11,10,11],[5,7,5,-2,1,8,11,6,11,0,9,9],[5,10,4,1,1,6,8,7,10,9,0,10],[11,4,8,5,5,7,6,10,11,9,10,0]]
]);
function learnWholeSignScore(row){const asc=window.RelphiSkyStartupMode?.readLearnAscendant?.()??0;const a=Number(row.dataset.leftSign),b=Number(row.dataset.rightSign);return LEARN_WHOLE_SIGN_SCORES[asc]?.[a]?.[b]??0;}
// Chart relationships use the same vote vocabulary, plus actual planetary
// dignities and the geometry resolved by the selected house system.
const CHART_BOUNDS=[
  [['jupiter',6],['venus',14],['mercury',21],['mars',26],['saturn',30]],
  [['venus',8],['mercury',14],['jupiter',22],['saturn',27],['mars',30]],
  [['mercury',6],['jupiter',12],['venus',17],['mars',24],['saturn',30]],
  [['mars',7],['venus',13],['mercury',19],['jupiter',26],['saturn',30]],
  [['jupiter',6],['venus',11],['saturn',18],['mercury',24],['mars',30]],
  [['mercury',7],['venus',17],['jupiter',21],['mars',28],['saturn',30]],
  [['saturn',6],['mercury',14],['jupiter',21],['venus',28],['mars',30]],
  [['mars',7],['venus',11],['mercury',19],['jupiter',24],['saturn',30]],
  [['jupiter',12],['venus',17],['mercury',21],['saturn',26],['mars',30]],
  [['mercury',7],['jupiter',14],['venus',22],['saturn',26],['mars',30]],
  [['mercury',7],['venus',13],['jupiter',20],['mars',25],['saturn',30]],
  [['venus',12],['jupiter',16],['mercury',19],['mars',28],['saturn',30]]
];
function chartEndpoint(row,side){
  const p=normalizedPoint(row.dataset[side+'Placement']);
  const actual=window.RelphiSkyFoundationInteractions?.relationshipEndpoint?.(endpointSky(row,side),p);
  const sign=Number(row.dataset[side+'Sign']),house=Number(row.dataset[side+'House']);
  return {p,sign:Number.isInteger(sign)&&sign>=0&&sign<12?sign:null,
    house:Number.isInteger(house)&&house>=1&&house<=12?house-1:null,
    ...actual,...(actual?.house!=null?{house:actual.house-1}:{})};
}
function chartPairVotes(row){
  const a=chartEndpoint(row,'left'),b=chartEndpoint(row,'right');
  const votes={};
  if(a.sign!=null&&b.sign!=null&&a.house!=null&&b.house!=null){
    Object.assign(votes,learnPairVotes(a.sign,b.sign,a.house,b.house));
    delete votes['sign pair geometry']; // actual aspect is the geometric vote
  }else if(a.sign!=null&&b.sign!=null){
    const pa=LEARN_RULERS[a.sign],pb=LEARN_RULERS[b.sign];
    votes['sign pair dignity']=learnDignity(pa,b.sign);
    if(pa!==pb)votes['sign pair reciprocal dignity']=learnDignity(pb,a.sign);
    votes['sign pair face affinity']=learnFace(pa,b.sign);
    votes['sign pair reciprocal face affinity']=learnFace(pb,a.sign);
    votes['sign pair triplicity affinity']=learnTriplicity(pa,b.sign);
    votes['sign pair reciprocal triplicity affinity']=learnTriplicity(pb,a.sign);
    votes['sign pair antiscia or contra-antiscia']=learnMirror(a.sign,b.sign);
  }
  const valence=ASPECT_VALENCE[row.dataset.aspect]??0;
  votes['actual aspect']=Math.sign(valence);
  for(const [name,e,other] of [['first',a,b],['second',b,a]]){
    if(e.sign==null)continue;
    if(!Object.hasOwn(LEARN_EXALTATION,e.p))continue; // no invented traditional dignities for outer planets or points
    votes[name+' planetary dignity']=learnDignity(e.p,e.sign);
    const day=e.day;
    const trip=LEARN_TRIPLICITY[e.sign%4];
    votes[name+' planetary triplicity']=day==null?(trip.includes(e.p)?1:0):((trip[day?0:1]===e.p||trip[2]===e.p)?1:0);
    if(Number.isFinite(e.longitude)){
      const degree=((e.longitude%30)+30)%30;
      votes[name+' planetary face']=LEARN_FACE_SEQUENCE[(e.sign*3+Math.floor(degree/10))%7]===e.p?1:0;
      if(e.p!=='sun'&&e.p!=='moon')votes[name+' planetary bound']=CHART_BOUNDS[e.sign].find(([,end])=>degree<end)?.[0]===e.p?1:0;
    }
    if(e.house!=null){
      // A planet actually rejoicing supersedes the corresponding proxy ruler joy.
      if(e.p===LEARN_RULERS[e.sign])delete votes[name+' ruler joy'];
      votes[name+' planetary joy']=LEARN_JOYS[e.house]===e.p?1:0;
    }
    if(Number.isFinite(e.cusp)){
      const cuspLord=LEARN_RULERS[Math.floor(e.cusp/30)];
      if(cuspLord!==LEARN_RULERS[e.sign])votes[name+' actual cusp lord affinity']=other.p===cuspLord?1:0;
    }
    if(day!=null&&['mars','saturn'].includes(e.p))votes[name+' malefic sect']=(e.p==='saturn'?day:!day)?0:-1;
    if(other.sign!=null&&e.p!==LEARN_RULERS[e.sign]){
      votes[name+' dignity in other sign']=learnDignity(e.p,other.sign);
    }
  }
  return votes;
}
function chartCompatibility(row){
  const votes=chartPairVotes(row);
  const score=Object.values(votes).reduce((sum,v)=>sum+v,0);
  row.dataset.relationshipCompatibilityScore=String(score);
  return score;
}
function compareRows(a,b){
  if(learn()){
    if(mode===MODES.angular)return angularDistance(a)-angularDistance(b)||zodiacCompare(a,b);
    if(mode===MODES.harmonic)return (HARMONIC_ORDER[a.dataset.aspect]??99)-(HARMONIC_ORDER[b.dataset.aspect]??99)||angularDistance(a)-angularDistance(b)||zodiacCompare(a,b);
    if(mode===MODES.challenging||mode===MODES.supportive){return (mode===MODES.supportive?-1:1)*(learnWholeSignScore(a)-learnWholeSignScore(b))||zodiacCompare(a,b)}
    return zodiacCompare(a,b);
  }
  if(mode===MODES.referenceResolution)return compareReferenceResolution(a,b);
  if(mode===MODES.applying||mode===MODES.separating)return compareMotion(a,b,'phase');
  if(mode===MODES.closing||mode===MODES.opening)return compareMotion(a,b,'distance');
  if(mode===MODES.aspect)return compareAspect(a,b);
  if(mode===MODES.strongest)return compareSignificance(a,b,'strength');
  if(mode===MODES.challenging)return compareSignificance(a,b,'challenge');
  if(mode===MODES.supportive)return compareSignificance(a,b,'support');
  if(mode===MODES.longest)return compareTiming(a,b,'transitDurationDays',-1);
  if(mode===MODES.shortest)return compareTiming(a,b,'transitDurationDays',1);
  if(mode===MODES.beganMostRecently)return compareTiming(a,b,'transitStartedDaysAgo',1);
  if(mode===MODES.endsSoonest)return compareTiming(a,b,'transitEndsInDays',1);
  if(mode===MODES.endsLast)return compareTiming(a,b,'transitEndsInDays',-1);
  return compareExact(a,b);
}
function currentMode(){return mode}
function dispatch(){
  document.documentElement.dataset.skyRelationshipSort=mode;
  window.dispatchEvent(new CustomEvent('relphi:relationship-sort-changed',{detail:{mode}}));
}
function installStyles(){
  if(document.getElementById('skyRelationshipSortV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyRelationshipSortV1Styles';
  style.textContent=`
#skyFoundationRelationships .sky-relationship-heading-actions>.sky-relationship-sort-control{display:inline-flex;align-items:center;min-width:0;white-space:nowrap}
#skyFoundationRelationships .sky-relationship-sort-select{appearance:none;-webkit-appearance:none;width:100%;max-width:none;min-width:0;height:29px;box-sizing:border-box;margin:0;padding:0 27px 0 9px;border:1px solid rgba(31,27,24,.18);border-radius:9px;background:#fff var(--sky-chart-filter-chevron) no-repeat right 7px center/14px 14px;color:#332e2a;font:800 .67rem/1 system-ui,sans-serif;cursor:pointer}
#skyFoundationRelationships .sky-relationship-sort-select:hover,#skyFoundationRelationships .sky-relationship-sort-select:focus-visible{border-color:#6b625a;outline:none}
#skyFoundationRelationships .sky-relationship-sort-select[aria-busy="true"]{cursor:progress!important;opacity:.66}
@media(max-width:620px){#skyFoundationRelationships .sky-relationship-heading-actions>.sky-relationship-sort-control{flex:1 1 0;min-width:0}#skyFoundationRelationships .sky-relationship-sort-select{width:100%;max-width:none;min-width:0}}
`;
  document.head.appendChild(style);
}
function ensureHeadingActions(relationships){
  const heading=relationships?.querySelector(':scope > .sky-foundation-relationships-heading');
  if(!heading)return null;
  let actions=heading.querySelector(':scope > .sky-relationship-heading-actions');
  if(!actions){
    actions=document.createElement('span');
    actions.className='sky-relationship-heading-actions';
    const clear=heading.querySelector(':scope > #skyFoundationClearIsolation');
    heading.insertBefore(actions,clear||null);
  }
  return actions;
}
function ensureControl(){
  syncMode();
  installStyles();
  const relationships=document.getElementById('skyFoundationRelationships');
  const actions=ensureHeadingActions(relationships);
  if(!actions)return null;

  const legacy=relationships.querySelector('.sky-relationship-controls .sky-relationship-sort-control,.sky-chart-filter-bar .sky-relationship-sort-control');
  let control=actions.querySelector(':scope>.sky-relationship-sort-control')||legacy;
  if(!control){
    control=document.createElement('label');
    control.className='sky-relationship-sort-control';

    const select=document.createElement('select');
    select.className='sky-relationship-sort-select';
    select.dataset.relationshipSort='true';
    select.setAttribute('aria-label','Sort relationships');
    select.title='Sort relationships';
    select.value=mode;
    select.addEventListener('change',()=>setMode(select.value));
    control.appendChild(select);
  }
  const sortAnchor=actions.querySelector(':scope>.sky-relationship-limit-control,:scope>#skyFoundationRelationshipCount,:scope>.sky-relationship-copy-button,:scope>#skyChartRelationshipsExport');
  if(control.parentElement!==actions||control.nextElementSibling!==sortAnchor)actions.insertBefore(control,sortAnchor||actions.firstChild);

const NATAL_OPTIONS=[
      [MODES.exact,'Most Exact First'],
      [MODES.aspect,'Aspect Type'],
      [MODES.strongest,'Strongest First'],
      [MODES.challenging,'Most Challenging First'],
      [MODES.supportive,'Most Supportive First'],
      [MODES.longest,'Longest Duration'],
      [MODES.shortest,'Shortest Duration'],
      [MODES.beganMostRecently,'Began Most Recently'],
      [MODES.endsSoonest,'Ends Soonest'],
      [MODES.endsLast,'Ends Last'],
      [MODES.applying,'Applying First'],
      [MODES.separating,'Separating First'],
      [MODES.closing,'Closing First'],
      [MODES.opening,'Opening First'],
      [MODES.referenceResolution,'Highest Reference Resolution']
    ];
  const select=control.querySelector('select');
  if(select&&select.dataset.sortExperience!==String(learn())){select.replaceChildren(...(learn()?LEARN_OPTIONS:NATAL_OPTIONS).map(([value,label])=>new Option(label,value)));select.dataset.sortExperience=String(learn());}
  if(select&&select.value!==mode)select.value=mode;
  if(select){
    select.setAttribute('aria-busy',busy?'true':'false');
    select.title=busy?'Calculating relationship timing…':'Sort: '+(select.selectedOptions[0]?.textContent||'Relationships');
  }
  return select;
}
async function prepareTransitSort(){
  transitTimer=0;
  if(whereWhenEditing())return;
  const generation=++calculationGeneration;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.estimatedTimingForRow){
    busy=false;
    ensureControl();
    dispatch();
    return;
  }
  busy=true;
  ensureControl();
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')]
    .filter(row=>!SIGNIFICANCE_HIDDEN_CLASSES.some(name=>row.classList.contains(name)));
  for(let index=0;index<rows.length;index+=1){
    if(generation!==calculationGeneration)return;
    api.estimatedTimingForRow(rows[index]);
    if(index%4===3)await new Promise(resolve=>setTimeout(resolve,0));
  }
  if(generation!==calculationGeneration)return;
  busy=false;
  ensureControl();
  dispatch();
}
function scheduleTransitSort(delay=90){
  calculationGeneration+=1;
  clearTimeout(transitTimer);
  transitTimer=setTimeout(()=>prepareTransitSort(),Math.max(0,Number(delay)||0));
}
function setMode(next){
  if(learn()){if(!LEARN_OPTIONS.some(([id])=>id===next))next=MODES.angular;}else if(!Object.values(MODES).includes(next)||[MODES.angular,MODES.harmonic,MODES.zodiac].includes(next))next=MODES.exact;
  mode=next;
  calculationGeneration+=1;
  busy=false;
  ensureControl();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast,MODES.applying,MODES.separating,MODES.closing,MODES.opening].includes(mode)){
    scheduleTransitSort(0);
    return;
  }
  dispatch();
}
function refreshForRows(){
  invalidateScores();
  if(whereWhenEditing())return;
  ensureControl();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast,MODES.applying,MODES.separating,MODES.closing,MODES.opening].includes(mode)){
    scheduleTransitSort(110);
    return;
  }
  if(mode!==MODES.exact)dispatch();
}
function invalidateTransit(){
  invalidateScores();
  calculationGeneration+=1;
  if(whereWhenEditing()){busy=false;return;}
  busy=false;
  window.RelphiRelationshipTransitMeta?.clearDurationCache?.();
  if([MODES.longest,MODES.shortest,MODES.beganMostRecently,MODES.endsSoonest,MODES.endsLast,MODES.applying,MODES.separating,MODES.closing,MODES.opening].includes(mode))scheduleTransitSort(110);
}
window.RelphiRelationshipSort=Object.freeze({
  axisFamilyKey,
  compareRows,
  mode:currentMode,
  model:SCORE_MODEL,
  scoreRow:relationshipScore,
  learnPairVotes,
  learnPairScore,
  chartPairVotes,
  chartCompatibility,
  referenceResolutionFor,
  referenceResolution:REFERENCE_RESOLUTION,
  setMode
});

function start(){
  ensureControl();
  [
    'relphi:sky-experience-changed',
    'relphi:sky-foundation-ready',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready'
  ].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(refreshForRows)));
  [
    'relphi:sky-harmonic-window-visibility-changed',
    'relphi:sky-live-origin-changed'
  ].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(invalidateTransit)));
  const root=document.getElementById('skyFoundationRoot');
  if(root)new MutationObserver(()=>requestAnimationFrame(ensureControl)).observe(root,{childList:true,subtree:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
