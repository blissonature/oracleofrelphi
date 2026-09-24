// Vocab view for Sky Card Placements.
// Placements remains the structured ledger; Vocab turns the same chart data into readable language.
// Glyphs, Names, and Referents are independent display layers with local progressive reveal.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyVocabTabV1)return;
window.__relphiSkyVocabTabV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const DISPLAY_KEY='relphiSkyVocabDisplayV1';
const VIEW_KEY='relphiSkyVocabViewV1';
const FILTER_KEY='relphiSkyVocabFilterV1';
const SCOPE_FILTER_KEY='relphiSkyVocabScopeFilterV1';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const SIGN_RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const SIGN_POLARITIES=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
const HOUSE_POLARITIES=[[1,7],[2,8],[3,9],[4,10],[5,11],[6,12]];
const SIGN_FIGURES=['Lamb','Bull','Twins','Crab','Lion','Maiden','Scales','Scorpion','Bow','Kid','Bucket','Fishes'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const HOUSE_MENU_DESCRIPTIONS=['','self, body, approach','money, possessions, worth','communication, siblings, local life','home, family, roots','pleasure, creativity, children','work, health, routine','partners, bonds, agreements','loss, death, other people’s resources','travel, belief, higher learning','career, reputation, public life','friends, groups, hopes','solitude, sorrow, hidden things'];
const SIGN_REFERENTS={
  Aries:'initiative, directness, courage, impulse, and beginning',
  Taurus:'embodiment, value, pleasure, endurance, and material continuity',
  Gemini:'writing, speech, learning, information exchange, and interpretation',
  Cancer:'care, protection, memory, belonging, and attachment',
  Leo:'radiance, creativity, pride, loyalty, and recognition',
  Virgo:'discernment, service, refinement, repair, and usefulness',
  Libra:'relationship, balance, fairness, dialogue, and mutual recognition',
  Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',
  Sagittarius:'the search for meaning, greater aspirations, worldview, and the bigger picture',
  Capricorn:'structure, responsibility, endurance, mastery, and worldly form',
  Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',
  Pisces:'surrender, imagination, compassion, permeability, and release'
};
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_REFERENTS=['',
  'self, embodiment, appearance, approach, and the immediate way life is entered',
  'resources, possessions, money, personal values, and what is held as one’s own',
  'communication, learning, siblings, neighbors, short journeys, and the local environment',
  'home, roots, family, ancestry, privacy, and the foundations of life',
  'creativity, pleasure, romance, children, play, and personal self-expression',
  'work, service, routines, health practices, maintenance, and practical obligations',
  'partnership, contracts, one-to-one relationship, and encounters with the other',
  'shared resources, intimacy, debt, inheritance, vulnerability, and transformation',
  'worldview, religion, philosophy, higher learning, long journeys, and the search for meaning',
  'vocation, public standing, reputation, authority, achievement, and visible responsibility',
  'friends, networks, groups, alliances, hopes, and participation in a larger collective',
  'retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'
];
const PLACEMENT_REFERENTS={
  sun:'identity',
  moon:'feelings and emotional needs',
  mercury:'thought and communication',
  venus:'values, affection, attraction, and relating',
  mars:'drive, assertion, conflict, and action',
  jupiter:'growth, meaning, opportunity, and expansion',
  saturn:'structure, limits, responsibility, and time',
  uranus:'disruption',
  neptune:'imagination, ideals, permeability, and surrender',
  pluto:'power, depth, elimination, and transformation',
  chiron:'wound',
  asc:'immediate presentation and the way life is entered',
  dsc:'partnership and encounters with the other',
  mc:'public visibility',
  ic:'foundation for home and family',
  'north-node':'growth through unfamiliar experience',
  'south-node':'familiar and inherited patterns',
  lilith:'instinctive autonomy and refusal',
  'asteroid-lilith':'equality',
  'part-of-fortune':'fortune and openings',
  vertex:'consequential encounters',
  'anti-vertex':'what becomes accessible through the back door',
  child:'children',
  hidalgo:'independence',
  victoria:'victory',
  daphne:'self-preservation through transformation',
  vesta:'devotion'
};
const ASPECT_NAMES={
  conjunction:'Conjunction',
  'semi-sextile':'Semi-Sextile',
  octile:'Octile',
  sextile:'Sextile',
  quintile:'Quintile',
  square:'Square',
  trine:'Trine',
  'tri-octile':'Tri-Octile',
  'bi-quintile':'Bi-Quintile',
  quincunx:'Quincunx',
  opposition:'Opposition'
};
const ASPECT_REFERENTS={
  conjunction:'union',
  'semi-sextile':'accommodation',
  octile:'focused friction',
  sextile:'cooperative opening',
  quintile:'creative pattern-making',
  square:'activating pressure',
  trine:'low-resistance flow',
  'tri-octile':'accumulated friction',
  'bi-quintile':'refined creative pattern-making',
  quincunx:'continuing adjustment',
  opposition:'polarity'
};
const ALIASES={
  rising:'asc',ascendant:'asc',ac:'asc',
  descendant:'dsc',dc:'dsc',
  midheaven:'mc','medium coeli':'mc',
  'imum coeli':'ic',imumcoeli:'ic',
  vx:'vertex',vertex:'vertex','anti vertex':'anti-vertex','anti-vertex':'anti-vertex',antivertex:'anti-vertex',avx:'anti-vertex',
  'north node':'north-node','true node':'north-node','mean node':'north-node',node:'north-node',
  'south node':'south-node',
  fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune',
  'black moon lilith':'lilith',
  'asteroid lilith':'asteroid-lilith','lilith 1181':'asteroid-lilith','1181 lilith':'asteroid-lilith',
  'child asteroid':'child','asteroid child':'child'
};
const ORDER=['north-node','south-node','asc','dsc','mc','ic','vertex','anti-vertex','sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','lilith','asteroid-lilith','part-of-fortune','child','hidalgo','victoria','daphne','vesta'];
const NODE_IDS=new Set(['north-node','south-node']);
const AXIS_IDS=new Set(['asc','dsc','mc','ic']);
const LUMINARY_IDS=new Set(['sun','moon']);
const PLANET_IDS=new Set(['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
const AXIS_PAIRS=new Set(['asc|dsc','dsc|asc','mc|ic','ic|mc','north-node|south-node','south-node|north-node','vertex|anti-vertex','anti-vertex|vertex']);
const AXIS_STRUCTURES=[
  {left:'vertex',right:'anti-vertex',label:'Vertex polarity'},
  {left:'asc',right:'dsc',label:'Horizon polarity'},
  {left:'mc',right:'ic',label:'Meridian polarity'},
  {left:'north-node',right:'south-node',label:'Nodal polarity'}
];
const STELLIUM_IDS=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
const STRUCTURAL_ANCHOR_IDS=new Set(AXIS_STRUCTURES.flatMap(axis=>[axis.left,axis.right]));
const CLUSTER_ORB=3;
const HARMONIC=()=>window.RelphiHarmonicOrb;
function harmonicWindow(){
  const model=HARMONIC();
  if(model?.getWindow)return model.getWindow();
  const liveRaw=String(document.documentElement.dataset.skyHarmonicWindow??'').trim();
  if(liveRaw!==''){
    const live=Number(liveRaw.replace(',','.'));
    if(Number.isFinite(live))return model?.clampWindow?.(live)??live;
  }
  return Number(model?.defaultWindow??6);
}
let queued=false;
let openDropdownState=null;
let dropdownPositionQueued=false;
let wheelFilterState=null;
let wheelFilterSpec=null;
let vocabWheelContextLine=null;
let vocabWheelContextToken=null;
let vocabWheelPinnedToken=null;
let vocabWheelTouchLine=null;

const norm=value=>((Number(value)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
const slug=value=>String(value||'').trim().toLowerCase().replace(/[._]/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function readJson(storage,key,fallback){try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(storage,key,value){try{storage.setItem(key,JSON.stringify(value))}catch(_){}}
function payload(slot){return readJson(localStorage,KEYS[slot],null)}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function internalPlacementEntry(key,item){
  return[key,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point].some(value=>/^[_$]/.test(String(value||'').trim()));
}
function source(value){
  if(!value||typeof value!=='object')return[];
  const known=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object');
  const raw=known||value;
  if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]).filter(([key,item])=>!internalPlacementEntry(key,item));
  return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!internalPlacementEntry(key,item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
}
function longitude(item){
  if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
  const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());
  if(sign<0)return NaN;
  return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
}
function rawName(key,item){return String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||item?.glyphId||key||'Placement').trim()}
function registryEntry(candidates){
  const registry=window.RelphiGlyphRegistry;if(!registry)return null;
  for(const candidate of candidates){
    if(candidate==null)continue;
    const raw=String(candidate).trim(),alias=ALIASES[raw.toLowerCase()]||raw;
    const entry=registry.resolve?.(alias)||registry.get?.(alias);
    if(entry)return entry;
  }
  return null;
}
function identity(key,item,name){
  const candidates=[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key,name].filter(v=>v!=null).map(v=>String(v).trim());
  const lower=candidates.map(v=>v.toLowerCase());
  if(lower.some(v=>/1181/.test(v)||v==='asteroid lilith'))return{id:'asteroid-lilith',glyphId:null,name:'Asteroid Lilith'};
  const entry=registryEntry(candidates);
  if(entry)return{id:entry.id,glyphId:entry.id,name:entry.name||name};
  const alias=ALIASES[String(name||'').toLowerCase()]||ALIASES[String(key||'').toLowerCase()]||slug(name||key);
  return{id:alias||slug(name)||'placement',glyphId:null,name:name||String(key||'Placement')};
}
function ascendant(value,records){
  const found=records.find(record=>record.id==='asc');if(found)return found.value;
  const p=profile(value),candidate=Number(p.ascendant??value?.ascendant??value?.asc);return Number.isFinite(candidate)?norm(candidate):NaN;
}
function cusps(value,records){
  const p=profile(value);
  for(const raw of [p.houseCusps,p.cusps,value?.houseCusps,value?.cusps,value?.houses]){
    if(!raw)continue;
    const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);
    if(values.length===12&&values.every(Number.isFinite))return values.map(norm);
  }
  const asc=ascendant(value,records);if(!Number.isFinite(asc))return[];
  const system=String(p.houseSystem||value?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;
  return Array.from({length:12},(_,index)=>norm(start+index*30));
}
function houseFor(value,houseCusps){
  if(!houseCusps.length)return 0;
  for(let index=0;index<12;index++){const start=houseCusps[index],span=norm(houseCusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}
  return 12;
}
function records(slot){
  const value=payload(slot);if(!value)return[];
  const first=source(value).map(([key,item])=>{
    const v=longitude(item);if(!Number.isFinite(v))return null;
    const name=rawName(key,item),ident=identity(key,item,name),explicitHouse=Number(item?.house??item?.houseNumber??item?.house_number);
    return{key,item,value:v,name:ident.name,id:ident.id,glyphId:ident.glyphId,sign:Math.floor(v/30),explicitHouse:Number.isFinite(explicitHouse)&&explicitHouse>=1&&explicitHouse<=12?Math.trunc(explicitHouse):0,house:0};
  }).filter(Boolean);
  const houseCusps=cusps(value,first);
  first.forEach(record=>{record.house=houseCusps.length?houseFor(record.value,houseCusps):record.explicitHouse});
  return first.sort((a,b)=>{const ai=ORDER.indexOf(a.id),bi=ORDER.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.value-b.value});
}
function structuralRecords(slot,list){
  if(list.some(record=>record.id==='anti-vertex'))return list;
  const vertex=list.find(record=>record.id==='vertex');if(!vertex)return list;
  const value=norm(vertex.value+180),houseCusps=cusps(payload(slot),list);
  const anti={
    key:'Anti-Vertex',item:{derived:true},value,name:'Anti-Vertex',id:'anti-vertex',glyphId:'anti-vertex',
    sign:Math.floor(value/30),explicitHouse:0,house:houseCusps.length?houseFor(value,houseCusps):0
  };
  return[...list,anti];
}
function relations(list){
  const model=HARMONIC(),aspects=model?.aspects||[],windowValue=harmonicWindow(),result=[];
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
    const left=list[i],right=list[j],distance=separation(left.value,right.value);
    for(const aspect of aspects){
      const metrics=model?.metrics?.(distance,aspect,windowValue);if(!metrics?.active)continue;
      if(aspect.id==='opposition'&&AXIS_PAIRS.has(left.id+'|'+right.id))continue;
      result.push({left,right,aspect,metrics});
    }
  }
  return result.sort((a,b)=>a.metrics.phaseError-b.metrics.phaseError||a.metrics.harmonicOrder-b.metrics.harmonicOrder||a.metrics.ordinaryOrb-b.metrics.ordinaryOrb);
}
function placementReferent(record){return PLACEMENT_REFERENTS[record.id]||String(record.name||'placement').toLowerCase()}
function signInfo(index){const name=SIGNS[index]||'Sign';return{id:slug(name),glyphId:slug(name),name,referent:SIGN_REFERENTS[name]||'zodiacal setting',color:SIGN_COLORS[index]||''}}
function houseInfo(number){return{id:'house-'+number,glyphId:null,name:HOUSE_NAMES[number]||'House',referent:HOUSE_MENU_DESCRIPTIONS[number]||'life area',fallbackGlyph:String(number||''),color:HOUSE_COLORS[number-1]||''}}
function placementInfo(record){return{id:record.id,glyphId:record.glyphId,name:record.name,referent:placementReferent(record),fallbackGlyph:record.fallbackGlyph||record.name,color:''}}
function aspectInfo(aspect){return{id:aspect.id,glyphId:aspect.id,name:ASPECT_NAMES[aspect.id]||aspect.id,referent:ASPECT_REFERENTS[aspect.id]||'relationship',fallbackGlyph:ASPECT_NAMES[aspect.id]||aspect.id,color:String(aspect?.color||'')}}

function displayState(){
  const value=readJson(localStorage,DISPLAY_KEY,null);
  return{
    glyphs:value?.glyphs!==false,
    names:value?.names!==false,
    referents:value?.referents!==false
  };
}
function saveDisplay(next){writeJson(localStorage,DISPLAY_KEY,next);document.documentElement.dataset.skyVocabGlyphs=next.glyphs?'true':'false';document.documentElement.dataset.skyVocabNames=next.names?'true':'false';document.documentElement.dataset.skyVocabReferents=next.referents?'true':'false'}
function filterState(){
  const value=readJson(sessionStorage,FILTER_KEY,null);
  return{relationships:value?.relationships!==false};
}
function saveFilter(next){writeJson(sessionStorage,FILTER_KEY,next)}
function emptyScope(){return{placements:null,signs:null,houses:null}}
function normalizeScopeSlot(raw){
  if(Array.isArray(raw))return{placements:raw,signs:null,houses:null};
  return{
    placements:Array.isArray(raw?.placements)?raw.placements:null,
    signs:Array.isArray(raw?.signs)?raw.signs.map(Number).filter(Number.isInteger):null,
    houses:Array.isArray(raw?.houses)?raw.houses.map(Number).filter(Number.isInteger):null
  };
}
function scopeFilterState(){
  const value=readJson(sessionStorage,SCOPE_FILTER_KEY,null);
  return{A:normalizeScopeSlot(value?.A),B:normalizeScopeSlot(value?.B)};
}
function saveScopeFilter(next){writeJson(sessionStorage,SCOPE_FILTER_KEY,next)}
function categoryOf(record){
  if(NODE_IDS.has(record.id))return'nodes';
  if(AXIS_IDS.has(record.id))return'axes';
  if(LUMINARY_IDS.has(record.id))return'luminaries';
  if(PLANET_IDS.has(record.id))return'planets';
  return'other';
}
const CATEGORY_LABELS={nodes:'Nodes',axes:'Axes',luminaries:'Luminaries',planets:'Planets',other:'Other points'};
const CATEGORY_ORDER=['nodes','axes','luminaries','planets','other'];
const ALL_SIGNS=Array.from({length:12},(_,index)=>index);
const ALL_HOUSES=Array.from({length:12},(_,index)=>index+1);
function manualScope(slot){return scopeFilterState()[slot]||emptyScope()}
function activeScope(slot){
  const wheel=wheelFilterState?.[slot];
  return wheel||manualScope(slot);
}
function scopeSelection(slot,kind,list=records(slot)){
  const scope=activeScope(slot),raw=scope[kind];
  if(kind==='placements'){
    const available=list.map(record=>record.id);
    return new Set(raw===null?available:raw.filter(id=>available.includes(id)));
  }
  const all=kind==='signs'?ALL_SIGNS:ALL_HOUSES;
  return new Set(raw===null?all:raw.filter(value=>all.includes(Number(value))).map(Number));
}
function eligibleRecords(slot,list=records(slot)){
  const placements=scopeSelection(slot,'placements',list),signs=scopeSelection(slot,'signs',list),houses=scopeSelection(slot,'houses',list);
  return list.filter(record=>placements.has(record.id)&&signs.has(record.sign)&&(!record.house||houses.has(record.house)));
}
function saveManualDimension(slot,kind,values,list=records(slot)){
  const state=scopeFilterState(),next={...state[slot]},all=kind==='placements'?list.map(record=>record.id):kind==='signs'?ALL_SIGNS:ALL_HOUSES;
  const normalized=Array.from(new Set(values)).filter(value=>all.includes(kind==='placements'?value:Number(value))).map(value=>kind==='placements'?value:Number(value));
  next[kind]=normalized.length===all.length?null:normalized;
  state[slot]=next;saveScopeFilter(state);
}
function viewState(){return readJson(sessionStorage,VIEW_KEY,{A:'placements',B:'placements'})}
function saveView(slot,view){const state=viewState();state[slot]=view;writeJson(sessionStorage,VIEW_KEY,state)}
function applyTokenColor(node,tokenNode){
  const color=String(tokenNode?.dataset?.vocabColor||'').trim();
  if(!color)return;
  node.classList.add('is-color-coded');
  node.style.setProperty('color',color,'important');
  node.style.setProperty('-webkit-text-fill-color',color,'important');
}
function capitalizeStart(value){return String(value||'').replace(/[A-Za-z]/,letter=>letter.toUpperCase())}
function token(info,kind='term',sentenceStart=false,lead=''){
  const node=document.createElement('span');
  node.className='sky-vocab-token';
  node.dataset.vocabKind=kind;
  node.dataset.vocabId=String(info.id||'');
  node.dataset.vocabGlyphId=String(info.glyphId||'');
  node.dataset.vocabName=String(info.name||'');
  node.dataset.vocabReferent=String(info.referent||'');
  node.dataset.vocabFallbackGlyph=String(info.fallbackGlyph||info.name||'');
  node.dataset.vocabColor=String(info.color||'');
  node.dataset.vocabLead=String(lead||'');
  if(info.color)node.style.setProperty('--vocab-token-color',String(info.color));
  node.dataset.vocabLocalStage='0';
  node.dataset.vocabSentenceStart=sentenceStart?'true':'false';
  renderToken(node);
  return node;
}
function glyphNode(tokenNode){
  const holder=document.createElement('span');holder.className='sky-vocab-level sky-vocab-glyph';holder.dataset.vocabLevel='glyph';holder.setAttribute('role','button');holder.tabIndex=0;holder.setAttribute('aria-label','Reveal name');applyTokenColor(holder,tokenNode);
  const glyphId=tokenNode.dataset.vocabGlyphId,fallback=tokenNode.dataset.vocabFallbackGlyph||tokenNode.dataset.vocabName;
  if(glyphId)holder.dataset.relphiCopyId=glyphId;
  if(tokenNode.dataset.vocabKind==='house'){
    const house=Number(String(tokenNode.dataset.vocabId||'').replace(/^house-/,'')||fallback);
    const marker=window.RelphiHouseMedallion?.create?.(house,'',false);
    if(marker){
      marker.classList.add('sky-vocab-house-medallion');
      holder.classList.add('is-house-medallion');
      marker.setAttribute('aria-hidden','true');
      marker.removeAttribute('aria-label');
      marker.removeAttribute('title');
      holder.replaceChildren(marker);
      return holder;
    }
  }
  const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=glyphId&&(registry?.get?.(glyphId)||registry?.resolve?.(glyphId));
  if(entry&&component){
    holder.classList.add('has-svg-glyph');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-18 -18 36 36');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');holder.appendChild(svg);
    component.draw(svg,entry.id,{radius:14.5,padding:.5,color:'currentColor'}).catch(()=>{holder.replaceChildren(document.createTextNode(fallback))});
  }else holder.textContent=fallback;
  return holder;
}
function nameNode(tokenNode){
  const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-name';node.dataset.vocabLevel='name';node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label','Reveal referent');applyTokenColor(node,tokenNode);node.textContent=tokenNode.dataset.vocabName;return node;
}
function referentNode(tokenNode){
  const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-referent';node.dataset.vocabLevel='referent';node.setAttribute('role','button');node.tabIndex=0;node.textContent=tokenNode.dataset.vocabSentenceStart==='true'?capitalizeStart(tokenNode.dataset.vocabReferent):tokenNode.dataset.vocabReferent;return node;
}
function localVisibility(node){
  const state=displayState(),visible=[state.glyphs,state.referents,state.names],missing=[];
  visible.forEach((shown,index)=>{if(!shown)missing.push(index)});
  const stage=Math.max(0,Math.min(Number(node.dataset.vocabLocalStage||0),missing.length));
  missing.slice(0,stage).forEach(index=>{visible[index]=true});
  return{showGlyph:visible[0],showReferent:visible[1],showName:visible[2],missingCount:missing.length,stage};
}
function renderToken(node){
  if(!(node instanceof HTMLElement))return;
  const {showGlyph,showName,showReferent}=localVisibility(node);
  node.replaceChildren();node.hidden=!(showGlyph||showName||showReferent);
  if(node.hidden)return;
  const rawLead=String(node.dataset.vocabLead||''),lead=rawLead.replace(/ /g,'\u00A0');
  const g=showGlyph?glyphNode(node):null,n=showName?nameNode(node):null,r=showReferent?referentNode(node):null;

  if(g){
    const head=document.createElement('span');head.className='sky-vocab-symbol-label';
    if(lead)head.appendChild(document.createTextNode(lead));
    head.appendChild(g);
    node.appendChild(head);
  }else if(lead&&(r||n)){
    node.appendChild(document.createTextNode(lead));
  }

  if(r){
    if(g)node.appendChild(document.createTextNode(' '));
    node.appendChild(r);
  }

  if(n){
    if(g||r)node.appendChild(document.createTextNode(' '));
    const meta=document.createElement('span');meta.className='sky-vocab-meta sky-vocab-parenthetical';meta.setAttribute('aria-label','Astrological vocabulary name');
    meta.append(document.createTextNode('('),n,document.createTextNode(')'));
    node.appendChild(meta);
  }
}
function rerenderTokens(root=document){root.querySelectorAll?.('.sky-vocab-token').forEach(renderToken)}

function phrasePlacement(record){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(record),'placement',true),token(signInfo(record.sign),'sign',false,' is in '));
  if(record.house)frag.append(token(houseInfo(record.house),'house',false,' in '));
  return frag;
}
function placementRailGradient(records,keyOf,colorOf){
  const members=records.filter(Boolean);
  if(!members.length)return structureNeutralColor();
  if(members.length===1)return colorOf(keyOf(members[0]))||structureNeutralColor();
  const step=100/members.length,stops=[];
  members.forEach((record,index)=>{
    const color=colorOf(keyOf(record))||structureNeutralColor(),start=index*step,end=(index+1)*step;
    stops.push(color+' '+start+'% '+end+'%');
  });
  return'linear-gradient(to bottom,'+stops.join(',')+')';
}
function applyPlacementRails(line,records,slot){
  line.dataset.vocabPlacementColors='true';
  line.dataset.vocabHouseSystem=activeHouseSystem(slot);
  line.style.setProperty('--vocab-placement-signs',placementRailGradient(records,record=>record.sign,key=>SIGN_COLORS[key]));
  line.style.setProperty('--vocab-placement-houses',placementRailGradient(records,record=>record.house||null,key=>HOUSE_COLORS[key-1]));
}
function appendSentence(container,fragment,records=[],slot='A'){
  const line=document.createElement('div');line.className='sky-vocab-line';
  if(records.length)applyPlacementRails(line,records,slot);
  line.append(fragment,document.createTextNode('.'));container.appendChild(line)
}
function axisSentence(first,second){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(first),'placement',true),token(signInfo(first.sign),'sign',false,' is in '));
  if(first.house)frag.append(token(houseInfo(first.house),'house',false,' in '));
  frag.append(token(placementInfo(second),'placement',false,', while '),token(signInfo(second.sign),'sign',false,' is in '));
  if(second.house)frag.append(token(houseInfo(second.house),'house',false,' in '));
  return frag;
}
function relationSentence(relation){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(relation.left),'placement',true),document.createTextNode(' is in '),token(aspectInfo(relation.aspect),'aspect'),document.createTextNode(' with '),token(placementInfo(relation.right),'placement'));
  return frag;
}
function polarityPole(list,anchorId,oppositeId,windowValue){
  const anchor=list.find(record=>record.id===anchorId);if(!anchor)return[];
  const attached=list.filter(record=>
    record.id!==anchorId&&
    record.id!==oppositeId&&
    separation(record.value,anchor.value)<=windowValue
  );
  return[anchor,...attached];
}
function polarityStructures(list){
  const windowValue=harmonicWindow();
  return AXIS_STRUCTURES.map(axis=>{
    const left=polarityPole(list,axis.left,axis.right,windowValue),right=polarityPole(list,axis.right,axis.left,windowValue);
    if(!left.length||!right.length)return null;
    return{...axis,left,right,harmonicWindow:windowValue};
  }).filter(Boolean);
}
function proximityClusters(list){
  const remaining=new Set(list.map(record=>record.id)),byId=new Map(list.map(record=>[record.id,record])),clusters=[];
  while(remaining.size){
    const seed=remaining.values().next().value,stack=[seed],members=[];remaining.delete(seed);
    while(stack.length){
      const id=stack.pop(),record=byId.get(id);if(!record)continue;members.push(record);
      Array.from(remaining).forEach(otherId=>{
        const other=byId.get(otherId);
        if(other&&separation(record.value,other.value)<=CLUSTER_ORB){remaining.delete(otherId);stack.push(otherId)}
      });
    }
    if(members.length>=2)clusters.push(members.sort((a,b)=>a.value-b.value));
  }
  return clusters;
}
function independentClusters(list){return proximityClusters(list)}
function compactStructureContext(info,kind,sentenceStart=false){
  const wrap=token(info,kind,sentenceStart);
  wrap.classList.add('sky-vocab-structure-context');
  wrap.dataset.vocabContextKind=kind;
  return wrap;
}
function structureMemberGroups(members){
  const groups=[],byContext=new Map();
  members.forEach(record=>{
    const key=record.sign+'|'+(record.house||0);
    let group=byContext.get(key);
    if(!group){
      group={sign:record.sign,house:record.house||0,members:[]};
      byContext.set(key,group);groups.push(group);
    }
    group.members.push(record);
  });
  return groups;
}
function appendStructureMemberGroup(frag,group){
  const wrap=document.createElement('span');wrap.className='sky-vocab-structure-member-group';
  wrap.dataset.vocabStructureContextGroup=group.sign+'|'+group.house;
  group.members.forEach((record,index)=>{
    if(index)wrap.appendChild(document.createTextNode(index===group.members.length-1?' and ':', '));
    wrap.appendChild(token(placementInfo(record),'placement',false));
  });
  const context=document.createElement('span');context.className='sky-vocab-structure-member-context';
  context.append(
    document.createTextNode(group.members.length===1?' is in ':' are in '),
    compactStructureContext(signInfo(group.sign),'sign')
  );
  if(group.house)context.append(
    document.createTextNode(', concerning '),
    compactStructureContext(houseInfo(group.house),'house')
  );
  wrap.appendChild(context);frag.appendChild(wrap);
}
function appendStructureMembers(frag,members){
  const groups=structureMemberGroups(members);
  groups.forEach((group,index)=>{
    if(index)frag.appendChild(document.createTextNode(index===groups.length-1?' and ':', '));
    appendStructureMemberGroup(frag,group);
  });
}
function clusterSignProfile(members){
  const signs=Array.from(new Set(members.map(record=>record.sign)));
  if(signs.length===1)return{type:'mid-sign',signs,names:[SIGNS[signs[0]]]};
  const ordered=signs.length===2&&signs.includes(0)&&signs.includes(11)?[11,0]:signs.slice().sort((a,b)=>a-b);
  return{type:'cusp',signs:ordered,names:ordered.map(index=>SIGNS[index])};
}
function isStellium(members){return members.filter(record=>STELLIUM_IDS.has(record.id)).length>=3}
function structureLabel(text){
  const label=document.createElement('span');label.className='sky-vocab-structure-label';label.textContent=text;return label;
}
function clusterSentence(members){
  const frag=document.createDocumentFragment(),profile=clusterSignProfile(members),stellium=isStellium(members),type=profile.type==='mid-sign'?'Mid-sign':'Cusp';
  frag.append(structureLabel((stellium?'Stellium · ':'')+type+' · '+profile.names.join('–')+':'),document.createTextNode(' '));
  appendStructureMembers(frag,members);
  return frag;
}
function polaritySentence(structure){
  const frag=document.createDocumentFragment();
  frag.append(
    structureLabel(structure.label+':'),
    document.createTextNode(' At one end of the polarity, ')
  );
  appendStructureMembers(frag,structure.left);
  frag.appendChild(document.createTextNode('; at the other, '));
  appendStructureMembers(frag,structure.right);
  return frag;
}
function appendStructureSubheading(container,label){
  const heading=document.createElement('div');heading.className='sky-vocab-structure-subheading';heading.textContent=label;container.appendChild(heading);
}
function appendSimplePlacementList(frag,members,contextKind){
  members.forEach((record,index)=>{
    if(index)frag.appendChild(document.createTextNode(index===members.length-1?' and ':', '));
    frag.appendChild(token(placementInfo(record),'placement',false));
    if(contextKind==='house'&&record.house)frag.append(document.createTextNode(' · '),compactStructureContext(houseInfo(record.house),'house'));
    if(contextKind==='sign')frag.append(document.createTextNode(' · '),compactStructureContext(signInfo(record.sign),'sign'));
  });
}
function appendSignPole(frag,signIndex,list,sentenceStart=false){
  frag.appendChild(compactStructureContext(signInfo(signIndex),'sign',sentenceStart));
  const members=list.filter(record=>record.sign===signIndex);
  if(members.length){
    frag.appendChild(document.createTextNode(': '));appendSimplePlacementList(frag,members,'house');
  }else{
    frag.appendChild(document.createTextNode(': no placements · default ruler '+SIGN_RULERS[signIndex]));
  }
}
function signPolaritySentence(pair,list){
  const frag=document.createDocumentFragment();
  appendSignPole(frag,pair[0],list,true);
  frag.appendChild(document.createTextNode(' ↔ '));appendSignPole(frag,pair[1],list);
  return frag;
}
function houseCuspSign(slot,list,house){
  const values=cusps(payload(slot),list);if(values.length!==12)return null;
  const value=Number(values[house-1]);return Number.isFinite(value)?Math.floor(norm(value)/30):null;
}
function houseOccupants(list,house){
  return list.filter(record=>record.house===house&&!AXIS_IDS.has(record.id));
}
function appendHousePole(frag,house,slot,list,sentenceStart=false){
  frag.appendChild(compactStructureContext(houseInfo(house),'house',sentenceStart));
  const cuspSign=houseCuspSign(slot,list,house);
  if(Number.isInteger(cuspSign)){
    frag.append(document.createTextNode(' · cusp '),compactStructureContext(signInfo(cuspSign),'sign'));
  }
  const members=houseOccupants(list,house);
  if(members.length){
    frag.appendChild(document.createTextNode(': '));appendSimplePlacementList(frag,members,'sign');
  }else{
    const ruler=Number.isInteger(cuspSign)?SIGN_RULERS[cuspSign]:'unknown';
    frag.appendChild(document.createTextNode(': no placements · default ruler '+ruler));
  }
}
function housePolaritySentence(pair,slot,list){
  const frag=document.createDocumentFragment();
  appendHousePole(frag,pair[0],slot,list,true);
  frag.appendChild(document.createTextNode(' ↔ '));appendHousePole(frag,pair[1],slot,list);
  return frag;
}
function structureScopeIsAll(slot){
  const scope=activeScope(slot);return scope.placements===null&&scope.signs===null&&scope.houses===null;
}
function signPairVisible(slot,pair,permitted,showAll){
  if(showAll)return true;
  const scope=activeScope(slot);
  if(scope.signs!==null)return pair.some(sign=>scope.signs.includes(sign));
  return permitted.some(record=>pair.includes(record.sign));
}
function housePairVisible(slot,pair,permitted,showAll){
  if(showAll)return true;
  const scope=activeScope(slot);
  if(scope.houses!==null)return pair.some(house=>scope.houses.includes(house));
  return permitted.some(record=>pair.includes(record.house));
}
function structureNeutralColor(){return'rgba(31,27,24,.18)'}
function splitStructureGradient(colorA,colorB){
  return'linear-gradient(to bottom,'+(colorA||structureNeutralColor())+' 0 50%,'+(colorB||structureNeutralColor())+' 50% 100%)';
}
function halfWeightedStructureGradient(left,right,keyOf,colorOf){
  const sideStops=(members,from,to)=>{
    const counts=new Map(),order=[];
    members.forEach(record=>{
      const key=keyOf(record);
      if(key===null||key===undefined||!colorOf(key))return;
      if(!counts.has(key))order.push(key);
      counts.set(key,(counts.get(key)||0)+1);
    });
    const total=order.reduce((sum,key)=>sum+counts.get(key),0);
    if(!total)return[structureNeutralColor()+' '+from+'% '+to+'%'];
    let used=0;
    return order.map(key=>{
      const start=from+(used/total)*(to-from);
      used+=counts.get(key);
      const end=from+(used/total)*(to-from);
      return colorOf(key)+' '+start+'% '+end+'%';
    });
  };
  return'linear-gradient(to bottom,'+[...sideStops(left,0,50),...sideStops(right,50,100)].join(',')+')';
}
function activeHouseSystem(slot){
  const value=payload(slot),p=profile(value);
  return String(p.houseSystem||value?.houseSystem||'whole-sign');
}
function applyPolarityRails(line,signGradient,houseGradient,slot){
  line.dataset.vocabPolarityColors='true';
  line.dataset.vocabHouseSystem=activeHouseSystem(slot);
  line.style.setProperty('--vocab-polarity-signs',signGradient);
  line.style.setProperty('--vocab-polarity-houses',houseGradient);
}
function weightedStructureGradient(members,keyOf,colorOf,preferredOrder=[]){
  const counts=new Map(),seen=[];
  members.forEach(record=>{
    const key=keyOf(record);
    if(key===null||key===undefined||!colorOf(key))return;
    if(!counts.has(key))seen.push(key);
    counts.set(key,(counts.get(key)||0)+1);
  });
  const keys=[...preferredOrder.filter(key=>counts.has(key)),...seen.filter(key=>!preferredOrder.includes(key))];
  const total=keys.reduce((sum,key)=>sum+counts.get(key),0);
  if(!total)return'linear-gradient(to bottom,rgba(31,27,24,.24) 0 100%)';
  let used=0;
  const stops=[];
  keys.forEach(key=>{
    const start=used/total*100;
    used+=counts.get(key);
    const end=used/total*100;
    const color=colorOf(key);
    stops.push(color+' '+start+'% '+end+'%');
  });
  return'linear-gradient(to bottom,'+stops.join(',')+')';
}
function concentrationDistribution(members,keyOf,labelOf,preferredOrder=[]){
  const counts=new Map(),seen=[];
  members.forEach(record=>{
    const key=keyOf(record);
    if(key===null||key===undefined)return;
    if(!counts.has(key))seen.push(key);
    counts.set(key,(counts.get(key)||0)+1);
  });
  const keys=[...preferredOrder.filter(key=>counts.has(key)),...seen.filter(key=>!preferredOrder.includes(key))];
  return keys.map(key=>labelOf(key)+':'+counts.get(key)).join('|');
}
function applyConcentrationStripe(line,members,profile,slot){
  const signOrder=profile?.signs||[];
  line.dataset.vocabConcentrationColors='true';
  line.dataset.vocabHouseSystem=activeHouseSystem(slot);
  line.dataset.vocabSignDistribution=concentrationDistribution(members,record=>record.sign,key=>SIGNS[key],signOrder);
  line.dataset.vocabHouseDistribution=concentrationDistribution(members,record=>record.house||null,key=>'H'+key);
  line.style.setProperty('--vocab-concentration-signs',weightedStructureGradient(members,record=>record.sign,key=>SIGN_COLORS[key],signOrder));
  line.style.setProperty('--vocab-concentration-houses',weightedStructureGradient(members,record=>record.house||null,key=>HOUSE_COLORS[key-1]));
}
function renderStructures(container,list,permitted,slot){
  const selected=new Set(permitted.map(record=>record.id)),showAll=structureScopeIsAll(slot);
  const polarities=polarityStructures(list),clusters=independentClusters(list);
  const visiblePolarities=polarities.filter(structure=>showAll||[...structure.left,...structure.right].some(record=>selected.has(record.id)));
  const visibleClusters=clusters.filter(members=>showAll||members.some(record=>selected.has(record.id))).sort((a,b)=>{
    const aStellium=isStellium(a),bStellium=isStellium(b);
    return Number(bStellium)-Number(aStellium)||b.length-a.length||a[0].value-b[0].value;
  });
  const visibleSignPairs=SIGN_POLARITIES.filter(pair=>signPairVisible(slot,pair,permitted,showAll));
  const visibleHousePairs=HOUSE_POLARITIES.filter(pair=>housePairVisible(slot,pair,permitted,showAll));
  if(!visiblePolarities.length&&!visibleClusters.length&&!visibleSignPairs.length&&!visibleHousePairs.length)return;

  const heading=document.createElement('div');heading.className='sky-vocab-structures-heading';heading.textContent='Structures';container.appendChild(heading);

  if(visiblePolarities.length){
    appendStructureSubheading(container,'Primary polarities');
    visiblePolarities.forEach(structure=>{
      const line=document.createElement('div');line.className='sky-vocab-line sky-vocab-structure-line';line.dataset.vocabStructure='axis-polarity';line.dataset.vocabAxis=structure.left[0].id+'-'+structure.right[0].id;line.dataset.vocabMembers=[...structure.left,...structure.right].map(record=>record.id).join('|');line.dataset.vocabHarmonicWindow=String(structure.harmonicWindow);
      applyPolarityRails(
        line,
        halfWeightedStructureGradient(structure.left,structure.right,record=>record.sign,key=>SIGN_COLORS[key]),
        halfWeightedStructureGradient(structure.left,structure.right,record=>record.house||null,key=>HOUSE_COLORS[key-1]),
        slot
      );
      line.append(polaritySentence(structure),document.createTextNode('.'));container.appendChild(line);
    });
  }

  if(visibleClusters.length){
    appendStructureSubheading(container,'Concentrations');
    visibleClusters.forEach(members=>{
      const profile=clusterSignProfile(members),line=document.createElement('div');
      line.className='sky-vocab-line sky-vocab-structure-line';line.dataset.vocabStructure=isStellium(members)?'stellium':'cluster';
      line.dataset.vocabClusterType=profile.type;line.dataset.vocabSigns=profile.names.join('|');line.dataset.vocabMembers=members.map(record=>record.id).join(',');
      applyConcentrationStripe(line,members,profile,slot);
      line.append(clusterSentence(members),document.createTextNode('.'));container.appendChild(line);
    });
  }

  if(visibleSignPairs.length){
    appendStructureSubheading(container,'Sign polarities');
    visibleSignPairs.forEach(pair=>{
      const line=document.createElement('div');line.className='sky-vocab-line sky-vocab-structure-line';line.dataset.vocabStructure='sign-polarity';line.dataset.vocabSigns=pair.map(index=>SIGNS[index]).join('|');
      const leftMembers=list.filter(record=>record.sign===pair[0]),rightMembers=list.filter(record=>record.sign===pair[1]);
      applyPolarityRails(
        line,
        splitStructureGradient(SIGN_COLORS[pair[0]],SIGN_COLORS[pair[1]]),
        halfWeightedStructureGradient(leftMembers,rightMembers,record=>record.house||null,key=>HOUSE_COLORS[key-1]),
        slot
      );
      line.append(signPolaritySentence(pair,list),document.createTextNode('.'));container.appendChild(line);
    });
  }

  if(visibleHousePairs.length){
    appendStructureSubheading(container,'House polarities');
    visibleHousePairs.forEach(pair=>{
      const line=document.createElement('div');line.className='sky-vocab-line sky-vocab-structure-line';line.dataset.vocabStructure='house-polarity';line.dataset.vocabHouses=pair.join('|');
      const leftCuspSign=houseCuspSign(slot,list,pair[0]),rightCuspSign=houseCuspSign(slot,list,pair[1]);
      applyPolarityRails(
        line,
        splitStructureGradient(Number.isInteger(leftCuspSign)?SIGN_COLORS[leftCuspSign]:null,Number.isInteger(rightCuspSign)?SIGN_COLORS[rightCuspSign]:null),
        splitStructureGradient(HOUSE_COLORS[pair[0]-1],HOUSE_COLORS[pair[1]-1]),
        slot
      );
      line.append(housePolaritySentence(pair,slot,list),document.createTextNode('.'));container.appendChild(line);
    });
  }
}
function renderGroup(container,list,category,slot){
  list.filter(record=>categoryOf(record)===category).forEach(record=>appendSentence(container,phrasePlacement(record),[record],slot));
}
function renderAxisPair(container,list,aId,bId,slot){
  const a=list.find(record=>record.id===aId),b=list.find(record=>record.id===bId);
  if(a&&b){appendSentence(container,axisSentence(a,b),[a,b],slot);return}
  if(a)appendSentence(container,phrasePlacement(a),[a],slot);
  if(b)appendSentence(container,phrasePlacement(b),[b],slot);
}
function renderFullPlacements(container,list,slot){
  renderGroup(container,list,'nodes',slot);
  renderAxisPair(container,list,'asc','dsc',slot);
  renderAxisPair(container,list,'mc','ic',slot);
  renderGroup(container,list,'luminaries',slot);
  renderGroup(container,list,'planets',slot);
  renderGroup(container,list,'other',slot);
}
function vocabLineContext(line){
  if(!(line instanceof HTMLElement))return null;
  const panel=line.closest('[data-sky-vocab-panel]'),slot=String(panel?.dataset?.skyVocabPanel||'').toUpperCase();
  if(!KEYS[slot])return null;
  const placements=new Set(),signs=new Set(),houses=new Set();
  if(line.dataset.vocabStructure==='axis-polarity'){
    String(line.dataset.vocabMembers||'').split('|').map(value=>value.trim()).filter(Boolean).forEach(id=>placements.add(id));
  }
  line.querySelectorAll('.sky-vocab-token').forEach(tokenNode=>{
    const kind=tokenNode.dataset.vocabKind,id=String(tokenNode.dataset.vocabId||'');
    if(kind==='placement'&&id)placements.add(id);
    if(kind==='sign'){
      const index=SIGNS.findIndex(name=>slug(name)===id);
      if(index>=0)signs.add(index);
    }
    if(kind==='house'){
      const number=Number(id.replace(/^house-/,''));
      if(Number.isInteger(number)&&number>=1&&number<=12)houses.add(number);
    }
  });
  /* A placement implies its wheel sign and house even when the sentence does not
     spell those context tokens out (for example, relationship-derived lines).
     Vocab wheel emphasis should therefore always illuminate the complete spatial
     context of every placement named by the active line. */
  document.querySelectorAll(`#skyFoundationWheelMount [data-focus-piece="placement"][data-sky="${slot}"]`).forEach(node=>{
    if(!placements.has(String(node.dataset.placement||'')))return;
    const sign=Number(node.dataset.sign),house=Number(node.dataset.house);
    if(Number.isInteger(sign)&&sign>=0&&sign<12)signs.add(sign);
    if(Number.isInteger(house)&&house>=1&&house<=12)houses.add(house);
  });
  return{slot,placements,signs,houses};
}
function clearVocabWheelTokenContext(){
  const api=window.RelphiSkyFoundationInteractions;
  api?.clearWheel?.();
  api?.clearWheelPreview?.();
  vocabWheelContextToken?.classList.remove('is-wheel-token-active');
  vocabWheelContextToken=null;
}
function clearVocabLineIsolation(){
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  if(!wheel||wheel.dataset.vocabIsolation!=='true')return;
  wheel.querySelectorAll('.is-vocab-context').forEach(node=>node.classList.remove('is-vocab-context','is-kept','is-hovered'));
  wheel.classList.remove('has-vocab-context','has-vocab-axis-context','has-isolation');
  delete wheel.dataset.vocabIsolation;
}
function clearVocabWheelContext(){
  clearVocabLineIsolation();
  clearVocabWheelTokenContext();
  vocabWheelContextLine?.classList.remove('is-wheel-context-active');
  vocabWheelContextLine=null;
}
function vocabTokenWheelContext(tokenNode){
  if(!(tokenNode instanceof HTMLElement))return null;
  const kind=String(tokenNode.dataset.vocabKind||''),id=String(tokenNode.dataset.vocabId||'');
  if(!['placement','sign','house'].includes(kind)||!id)return null;
  const panel=tokenNode.closest('[data-sky-vocab-panel]'),slot=String(panel?.dataset?.skyVocabPanel||'').toUpperCase();
  if(!KEYS[slot])return null;
  if(kind==='placement')return{kind,slot,id};
  if(kind==='sign'){
    const sign=SIGNS.findIndex(name=>slug(name)===id);
    return sign>=0?{kind,slot,sign}:null;
  }
  const house=Number(id.replace(/^house-/,''));
  return Number.isInteger(house)&&house>=1&&house<=12?{kind,slot,house}:null;
}
function foundationSpec(context){
  if(!context)return null;
  if(context.kind==='placement')return{kind:'placement',sky:context.slot,value:context.id};
  if(context.kind==='sign')return{kind:'sign',sky:null,value:context.sign};
  if(context.kind==='house')return{kind:'house',sky:context.slot,value:context.house};
  return null;
}
function applyVocabTokenWheelContext(tokenNode){
  const context=vocabTokenWheelContext(tokenNode),api=window.RelphiSkyFoundationInteractions;
  if(!context||!api?.previewWheel)return;
  clearVocabLineIsolation();
  if(!api.previewWheel(foundationSpec(context)))return;
  vocabWheelContextToken?.classList.remove('is-wheel-token-active');
  tokenNode.classList.add('is-wheel-token-active');
  vocabWheelContextToken=tokenNode;
}
function restoreVocabWheelContext(line=null){
  if(vocabWheelPinnedToken?.isConnected){applyVocabTokenWheelContext(vocabWheelPinnedToken);return}
  clearVocabWheelTokenContext();
  if(line?.isConnected){applyVocabWheelContext(line);return}
  clearVocabWheelContext();
}
function togglePinnedVocabToken(tokenNode){
  if(!(tokenNode instanceof HTMLElement))return;
  const context=vocabTokenWheelContext(tokenNode),api=window.RelphiSkyFoundationInteractions;
  if(!context||!api?.toggleWheel)return;
  clearVocabLineIsolation();
  const wasPinned=vocabWheelPinnedToken===tokenNode;
  vocabWheelPinnedToken=wasPinned?null:tokenNode;
  vocabWheelTouchLine=null;
  vocabWheelContextToken?.classList.remove('is-wheel-token-active');
  vocabWheelContextToken=wasPinned?null:tokenNode;
  tokenNode.classList.toggle('is-wheel-token-active',!wasPinned);
  api.toggleWheel(foundationSpec(context));
}
function applyVocabWheelContext(line){
  if(line===vocabWheelContextLine)return;
  window.RelphiSkyFoundationInteractions?.clearWheelPreview?.();
  clearVocabLineIsolation();
  const context=vocabLineContext(line),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  if(!context||!wheel||wheel.classList.contains('has-isolation'))return;
  let matched=0;
  wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{
    const type=String(node.dataset.focusPiece||''),sky=String(node.dataset.sky||'').toUpperCase();
    let keep=false;
    if((type==='placement'||type==='leader')&&sky===context.slot&&context.placements.has(String(node.dataset.placement||'')))keep=true;
    if(type==='sign'&&context.signs.has(Number(node.dataset.sign)))keep=true;
    if(type==='house'&&sky===context.slot&&context.houses.has(Number(node.dataset.house)))keep=true;
    if(type==='aspect'){
      const leftSky=String(node.dataset.leftSky||'').toUpperCase(),rightSky=String(node.dataset.rightSky||'').toUpperCase();
      const leftId=String(node.dataset.leftPlacement||''),rightId=String(node.dataset.rightPlacement||'');
      keep=(leftSky===context.slot&&context.placements.has(leftId))||(rightSky===context.slot&&context.placements.has(rightId));
    }
    if(keep){node.classList.add('is-vocab-context','is-kept');matched++}
  });
  if(!matched)return;
  wheel.dataset.vocabIsolation='true';
  wheel.classList.add('has-isolation','has-vocab-context');
  wheel.classList.toggle('has-vocab-axis-context',line.dataset.vocabStructure==='axis-polarity');
  line.classList.add('is-wheel-context-active');
  vocabWheelContextLine=line;
}
function bindVocabWheelContext(panel){
  if(panel.dataset.vocabWheelContextBound==='true')return;
  panel.dataset.vocabWheelContextBound='true';
  const interactiveToken=target=>target.closest?.('.sky-vocab-token[data-vocab-kind="placement"],.sky-vocab-token[data-vocab-kind="sign"],.sky-vocab-token[data-vocab-kind="house"]');
  panel.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode)){
      if(!tokenNode.contains(event.relatedTarget))applyVocabTokenWheelContext(tokenNode);
      return;
    }
    if(vocabWheelPinnedToken?.isConnected)return;
    const line=event.target.closest?.('.sky-vocab-line');
    if(!line||!panel.contains(line)||line.contains(event.relatedTarget))return;
    applyVocabWheelContext(line);
  });
  panel.addEventListener('pointerout',event=>{
    if(event.pointerType==='touch')return;
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode)){
      if(tokenNode.contains(event.relatedTarget))return;
      const line=tokenNode.closest('.sky-vocab-line');
      restoreVocabWheelContext(line&&line.contains(event.relatedTarget)?line:null);
      return;
    }
    const line=event.target.closest?.('.sky-vocab-line');
    if(!line||line.contains(event.relatedTarget)||vocabWheelTouchLine===line||vocabWheelPinnedToken?.isConnected)return;
    clearVocabWheelContext();
  });
  panel.addEventListener('focusin',event=>{
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode)){applyVocabTokenWheelContext(tokenNode);return}
    if(vocabWheelPinnedToken?.isConnected)return;
    const line=event.target.closest?.('.sky-vocab-line');
    if(line&&panel.contains(line))applyVocabWheelContext(line);
  });
  panel.addEventListener('focusout',event=>{
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode)){
      if(tokenNode.contains(event.relatedTarget))return;
      const line=tokenNode.closest('.sky-vocab-line');
      restoreVocabWheelContext(line&&line.contains(event.relatedTarget)?line:null);
      return;
    }
    const line=event.target.closest?.('.sky-vocab-line');
    if(line&&!line.contains(event.relatedTarget)&&vocabWheelTouchLine!==line&&!vocabWheelPinnedToken?.isConnected)clearVocabWheelContext();
  });
  panel.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    if(interactiveToken(event.target))return;
    const line=event.target.closest?.('.sky-vocab-line');
    if(line&&panel.contains(line))return;
    vocabWheelTouchLine=null;
    vocabWheelPinnedToken=null;
    clearVocabWheelContext();
  });
  panel.addEventListener('pointerup',event=>{
    if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    if(interactiveToken(event.target))return;
    const line=event.target.closest?.('.sky-vocab-line');
    if(!line||!panel.contains(line)){vocabWheelTouchLine=null;vocabWheelPinnedToken=null;clearVocabWheelContext();return}
    vocabWheelTouchLine=line;
    vocabWheelPinnedToken=null;
    applyVocabWheelContext(line);
  });
  panel.addEventListener('click',event=>{
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode))togglePinnedVocabToken(tokenNode);
  },true);
  panel.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const tokenNode=interactiveToken(event.target);
    if(tokenNode&&panel.contains(tokenNode))togglePinnedVocabToken(tokenNode);
  },true);
}
function hasVocabWheelContext(){
  return !!(vocabWheelContextLine||vocabWheelContextToken||vocabWheelPinnedToken||vocabWheelTouchLine);
}
function clearVocabWheelContextFromBlank(event){
  if(!hasVocabWheelContext())return;
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;
  if(vocabWheelPinnedToken?.contains?.(target)||vocabWheelContextToken?.contains?.(target))return;
  if(vocabWheelTouchLine?.contains?.(target)||vocabWheelContextLine?.contains?.(target))return;
  if(target.closest('.sky-vocab-line'))return;
  vocabWheelTouchLine=null;
  vocabWheelPinnedToken=null;
  clearVocabWheelContext();
}
function renderParagraph(slot,panel){
  const list=records(slot),container=panel.querySelector('[data-sky-vocab-paragraph]'),filters=filterState();
  if(!container)return;
  container.replaceChildren();
  if(!list.length){container.textContent='Add or calculate placements to read this sky as vocabulary.';return}
  const permitted=eligibleRecords(slot,list),structureList=structuralRecords(slot,list);
  renderStructures(container,structureList,permitted,slot);
  if(permitted.length){
    const heading=document.createElement('div');heading.className='sky-vocab-placements-heading';heading.textContent='Placements';container.appendChild(heading);
    renderFullPlacements(container,permitted,slot);
  }
  if(!displayState().glyphs&&!displayState().names&&!displayState().referents){
    container.replaceChildren();
    const empty=document.createElement('span');empty.className='sky-vocab-empty';empty.textContent='Turn on Glyphs, Names, or Referents to display the vocabulary.';container.appendChild(empty);
  }else if(!container.childNodes.length){
    container.textContent='No placements match the current filters.';
  }
}
function htmlEscape(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function optionLabel(id){return id==='glyphs'?'Glyphs':id==='names'?'Names':'Referents'}
function layerSummary(){
  const state=displayState(),ids=['glyphs','referents','names'],selected=ids.filter(id=>state[id]);
  if(selected.length===ids.length)return'All';
  if(!selected.length)return'None';
  return selected.map(optionLabel).join(' · ');
}
function dimensionSummary(slot,kind){
  const list=records(slot),selected=scopeSelection(slot,kind,list),all=kind==='placements'?list.map(record=>record.id):kind==='signs'?ALL_SIGNS:ALL_HOUSES;
  if(!all.length||!selected.size)return'None';
  if(selected.size===all.length)return'All';
  if(selected.size===1){
    const value=Array.from(selected)[0];
    if(kind==='placements')return list.find(record=>record.id===value)?.name||String(value);
    if(kind==='signs')return SIGNS[Number(value)]||String(value);
    return 'House '+value;
  }
  return selected.size+' of '+all.length;
}
function basicDropdownShell(slot,kind,label,summary,body){
  const menuId='skyVocab'+kind[0].toUpperCase()+kind.slice(1)+'Menu'+slot;
  return '<div class="sky-vocab-dropdown" data-vocab-dropdown="'+kind+'" data-vocab-dropdown-slot="'+slot+'">'+
    '<span class="sky-vocab-dropdown-label">'+label+'</span>'+
    '<button type="button" class="sky-vocab-dropdown-field" data-vocab-dropdown-toggle="'+kind+'" aria-haspopup="dialog" aria-expanded="false" aria-controls="'+menuId+'">'+
      '<span class="sky-vocab-dropdown-summary" data-vocab-dropdown-summary="'+kind+'" data-vocab-summary-slot="'+slot+'">'+htmlEscape(summary)+'</span>'+
      '<span class="sky-vocab-dropdown-chevron" aria-hidden="true"></span>'+
    '</button>'+
    '<div id="'+menuId+'" class="sky-vocab-dropdown-menu" data-vocab-dropdown-menu="'+kind+'" data-vocab-menu-slot="'+slot+'" role="dialog" aria-label="'+label+'" hidden>'+body+'</div>'+
  '</div>';
}
function layerDropdownMarkup(slot){
  const state=displayState(),rows=['glyphs','referents','names'].map(id=>'<label class="sky-vocab-filter-row"><span class="sky-vocab-filter-name">'+optionLabel(id)+'</span><span class="sky-vocab-filter-check"><input type="checkbox" data-vocab-layer="'+id+'" data-vocab-slot="'+slot+'" '+(state[id]?'checked':'')+' aria-label="'+optionLabel(id)+'"></span></label>').join('');
  const body='<div class="sky-vocab-filter-list"><div class="sky-vocab-filter-header"><strong>DISPLAY</strong><span class="sky-vocab-filter-actions"><button type="button" data-vocab-layer-all="'+slot+'">All</button><button type="button" data-vocab-layer-none="'+slot+'">None</button></span></div>'+rows+'</div>';
  return basicDropdownShell(slot,'layers','Display',layerSummary(),body);
}
function relationshipChoice(inputMarkup,choiceClass=''){
  return '<label class="'+choiceClass+'">'+inputMarkup+'<span></span></label>';
}
function placementDropdownMarkup(slot){
  const list=records(slot),selected=scopeSelection(slot,'placements',list);
  const groupRows=CATEGORY_ORDER.map(category=>{
    const members=list.filter(record=>categoryOf(record)===category);if(!members.length)return'';
    const chosen=members.filter(record=>selected.has(record.id)).length,all=chosen===members.length,some=chosen>0&&chosen<members.length;
    const groupInput='<input type="checkbox" data-vocab-group="'+category+'" data-vocab-slot="'+slot+'" '+(all?'checked':'')+' '+(some?'data-indeterminate="true"':'')+' aria-label="'+htmlEscape(CATEGORY_LABELS[category])+'">';
    const groupRow='<div class="sky-chart-placement-list-item sky-chart-placement-list-item-group" data-vocab-placement-group-row="'+category+'">'+
      '<strong class="sky-chart-placement-list-label">'+CATEGORY_LABELS[category]+'</strong>'+
      '<div class="sky-chart-placement-list-choices">'+relationshipChoice(groupInput,'sky-chart-placement-choice sky-chart-placement-choice-all')+'</div>'+
    '</div>';
    const placementRows=members.map(record=>{
      const input='<input type="checkbox" data-vocab-placement="'+htmlEscape(record.id)+'" data-vocab-slot="'+slot+'" '+(selected.has(record.id)?'checked':'')+' aria-label="'+htmlEscape(record.name)+'">';
      return '<div class="sky-chart-placement-list-item sky-chart-placement-list-item-placement" data-placement-list-item="'+htmlEscape(record.id)+'">'+
        '<strong class="sky-chart-placement-list-label">'+htmlEscape(record.name)+'</strong>'+
        '<div class="sky-chart-placement-list-choices">'+relationshipChoice(input,'sky-chart-placement-choice sky-chart-placement-choice-all')+'</div>'+
      '</div>';
    }).join('');
    return groupRow+placementRows;
  }).join('');
  const allChecked=selected.size===list.length,allIndeterminate=selected.size>0&&selected.size<list.length;
  const allInput='<input type="checkbox" data-vocab-dimension-master="placements" data-vocab-slot="'+slot+'" '+(allChecked?'checked':'')+' '+(allIndeterminate?'data-indeterminate="true"':'')+' aria-label="All placements">';
  const body='<div class="sky-chart-placement-filter-body"><div class="sky-chart-placement-list" data-placement-list="vocab">'+
    '<div class="sky-chart-placement-list-header"><strong class="sky-chart-placement-list-header-label">Placement</strong><div class="sky-chart-placement-list-header-choices"><span class="sky-chart-placement-list-header-choice sky-chart-placement-list-header-choice-all">All</span></div></div>'+
    '<div class="sky-chart-placement-list-item sky-chart-placement-list-item-master">'+
      '<strong class="sky-chart-placement-list-label">All placements</strong>'+
      '<div class="sky-chart-placement-list-choices">'+relationshipChoice(allInput,'sky-chart-placement-choice sky-chart-placement-choice-all')+'</div>'+
    '</div>'+groupRows+
  '</div></div>';
  const menuId='skyVocabPlacementsMenu'+slot;
  return '<div class="sky-chart-placement-filter sky-vocab-rel-filter" data-vocab-dropdown="placements" data-vocab-dropdown-slot="'+slot+'">'+
    '<div class="sky-chart-placement-filter-head">'+
      '<span class="sky-chart-placement-filter-label">Placements</span>'+
      '<div class="sky-chart-placement-summary-choices"><span data-vocab-dropdown-summary="placements" data-vocab-summary-slot="'+slot+'">'+htmlEscape(dimensionSummary(slot,'placements'))+'</span></div>'+
      '<button type="button" class="sky-chart-placement-filter-toggle" data-vocab-dropdown-toggle="placements" aria-haspopup="dialog" aria-expanded="false" aria-controls="'+menuId+'" aria-label="Open Placements"></button>'+
    '</div>'+
    '<div id="'+menuId+'" class="sky-chart-placement-filter-popover sky-vocab-rel-popover" data-vocab-dropdown-menu="placements" data-vocab-menu-slot="'+slot+'" role="dialog" aria-label="Placements" hidden>'+body+'</div>'+
  '</div>';
}
function signDropdownMarkup(slot){
  const selected=scopeSelection(slot,'signs'),rows=ALL_SIGNS.map(index=>{
    return '<label class="sky-chart-zodiac-filter-row" data-sign-list-item="'+String(SIGNS[index]||'').toLowerCase()+'">'+
      '<span class="sky-chart-zodiac-filter-name">'+
        '<span class="sky-chart-zodiac-filter-glyph" data-vocab-zodiac-glyph="'+index+'"></span>'+
        '<span class="sky-chart-zodiac-filter-copy"><span class="sky-chart-sign-list-label">'+SIGNS[index]+'</span><span class="sky-chart-sign-list-figure">'+SIGN_FIGURES[index]+'</span></span>'+
      '</span>'+
      '<span class="sky-chart-zodiac-filter-check"><input type="checkbox" data-vocab-sign="'+index+'" data-vocab-slot="'+slot+'" '+(selected.has(index)?'checked':'')+' aria-label="'+SIGNS[index]+', '+SIGN_FIGURES[index]+'"></span>'+
    '</label>';
  }).join('');
  const body='<div class="sky-chart-zodiac-filter-list">'+
    '<div class="sky-chart-zodiac-filter-header"><strong>ZODIAC SIGN</strong><span class="sky-chart-zodiac-filter-actions"><button type="button" data-vocab-dimension-all="signs" data-vocab-slot="'+slot+'">All</button><button type="button" data-vocab-dimension-none="signs" data-vocab-slot="'+slot+'">None</button></span></div>'+
    rows+'</div>';
  const menuId='skyVocabSignsMenu'+slot;
  return '<div class="sky-chart-zodiac-filter sky-vocab-rel-filter" data-vocab-dropdown="signs" data-vocab-dropdown-slot="'+slot+'">'+
    '<span class="sky-chart-zodiac-filter-label">Zodiac Signs</span>'+
    '<button type="button" class="sky-chart-zodiac-filter-toggle" data-vocab-dropdown-toggle="signs" aria-haspopup="dialog" aria-expanded="false" aria-controls="'+menuId+'"><span data-vocab-dropdown-summary="signs" data-vocab-summary-slot="'+slot+'">'+htmlEscape(dimensionSummary(slot,'signs'))+'</span></button>'+
    '<div id="'+menuId+'" class="sky-chart-zodiac-filter-menu sky-vocab-rel-popover" data-vocab-dropdown-menu="signs" data-vocab-menu-slot="'+slot+'" role="dialog" aria-label="Zodiac Signs" hidden>'+body+'</div>'+
  '</div>';
}
function houseDropdownMarkup(slot){
  const selected=scopeSelection(slot,'houses');
  const allChecked=selected.size===ALL_HOUSES.length,allIndeterminate=selected.size>0&&selected.size<ALL_HOUSES.length;
  const rows=ALL_HOUSES.map(number=>{
    const input='<input type="checkbox" data-vocab-house="'+number+'" data-vocab-slot="'+slot+'" '+(selected.has(number)?'checked':'')+' aria-label="House '+number+': '+htmlEscape(HOUSE_MENU_DESCRIPTIONS[number])+'">';
    return '<div class="sky-chart-house-list-item sky-chart-house-list-item-house" data-house-list-item="'+number+'">'+
      '<strong class="sky-chart-house-list-label"><span class="sky-chart-house-menu-medallion" data-vocab-house-medallion="'+number+'" aria-hidden="true"></span><span class="sky-chart-house-menu-description">'+htmlEscape(HOUSE_MENU_DESCRIPTIONS[number])+'</span></strong>'+
      '<div class="sky-chart-house-list-choices">'+relationshipChoice(input,'sky-chart-house-choice sky-chart-house-choice-all')+'</div>'+
    '</div>';
  }).join('');
  const allInput='<input type="checkbox" data-vocab-dimension-master="houses" data-vocab-slot="'+slot+'" '+(allChecked?'checked':'')+' '+(allIndeterminate?'data-indeterminate="true"':'')+' aria-label="All houses">';
  const body='<div class="sky-chart-house-filter-body"><div class="sky-chart-house-list" data-house-list="vocab">'+
    '<div class="sky-chart-house-list-header"><strong>House</strong><span>All</span></div>'+
    '<div class="sky-chart-house-list-item sky-chart-house-list-item-master"><strong class="sky-chart-house-list-label">All houses</strong><div class="sky-chart-house-list-choices">'+relationshipChoice(allInput,'sky-chart-house-choice sky-chart-house-choice-all')+'</div></div>'+
    rows+
  '</div></div>';
  const menuId='skyVocabHousesMenu'+slot;
  return '<div class="sky-chart-house-filter sky-vocab-rel-filter" data-vocab-dropdown="houses" data-vocab-dropdown-slot="'+slot+'">'+
    '<div class="sky-chart-house-filter-head">'+
      '<span class="sky-chart-house-filter-label">Houses</span>'+
      '<div class="sky-chart-house-summary-choices"><span data-vocab-dropdown-summary="houses" data-vocab-summary-slot="'+slot+'">'+htmlEscape(dimensionSummary(slot,'houses'))+'</span></div>'+
      '<button type="button" class="sky-chart-house-filter-toggle" data-vocab-dropdown-toggle="houses" aria-haspopup="dialog" aria-expanded="false" aria-controls="'+menuId+'" aria-label="Open Houses">⌄</button>'+
    '</div>'+
    '<div id="'+menuId+'" class="sky-chart-house-filter-popover sky-vocab-rel-popover" data-vocab-dropdown-menu="houses" data-vocab-menu-slot="'+slot+'" role="dialog" aria-label="Houses" hidden>'+body+'</div>'+
  '</div>';
}
function harmonicWindowMarkup(slot){
  const max=Number(HARMONIC()?.maxWindow??0),value=harmonicWindow();
  return '<label class="sky-vocab-dropdown sky-vocab-harmonic-field" data-vocab-harmonic-field="'+slot+'">'+
    '<span class="sky-vocab-dropdown-label">Harmonic Window</span>'+
    '<input class="sky-vocab-dropdown-field sky-vocab-harmonic-input" type="text" inputmode="decimal" autocomplete="off" value="'+htmlEscape(value)+'" data-vocab-harmonic-window-input="'+slot+'" role="spinbutton" aria-valuemin="0" aria-valuemax="'+htmlEscape(max)+'" aria-valuenow="'+htmlEscape(value)+'" aria-label="Master harmonic phase window in degrees, maximum '+htmlEscape(max)+'">'+
  '</label>';
}
function controlsMarkup(slot){return '<div class="sky-vocab-harmonic-row">'+harmonicWindowMarkup(slot)+'</div><div class="sky-vocab-dropdown-row">'+layerDropdownMarkup(slot)+placementDropdownMarkup(slot)+signDropdownMarkup(slot)+houseDropdownMarkup(slot)+'</div>'}
function dropdownOwner(slot,kind){return document.querySelector('[data-sky-vocab-panel="'+slot+'"] [data-vocab-dropdown="'+kind+'"]')}
function dropdownMenu(slot,kind){return document.querySelector('[data-vocab-dropdown-menu="'+kind+'"][data-vocab-menu-slot="'+slot+'"]')}
function closeDropdown(){
  if(!openDropdownState)return;
  const {slot,kind}=openDropdownState,owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind);
  if(menu){menu.hidden=true;menu.classList.remove('is-portaled');menu.removeAttribute('style');owner?.appendChild(menu)}
  owner?.classList.remove('is-open');owner?.querySelector('[data-vocab-dropdown-toggle]')?.setAttribute('aria-expanded','false');openDropdownState=null;
}
function positionDropdown(){
  dropdownPositionQueued=false;if(!openDropdownState)return;
  const {slot,kind}=openDropdownState,owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind),field=owner?.querySelector('[data-vocab-dropdown-toggle]');
  if(!owner||!menu||!field||menu.hidden)return;
  const previousScroll=menu.scrollTop;
  const rect=field.getBoundingClientRect(),margin=kind==='houses'?8:12,targetWidth=kind==='placements'?350:kind==='houses'?430:kind==='signs'?330:260,width=Math.max(220,Math.min(targetWidth,window.innerWidth-margin*2)),below=window.innerHeight-rect.bottom-margin,above=rect.top-margin;
  menu.style.height='auto';menu.style.maxHeight='none';menu.style.overflowY='hidden';
  const natural=Math.ceil(menu.scrollHeight+2),available=Math.max(180,window.innerHeight-margin*2),rendered=Math.min(natural,available);
  if(natural>available){menu.style.height=available+'px';menu.style.maxHeight=available+'px';menu.style.overflowY='auto'}
  const useAbove=below<Math.min(220,rendered)&&above>below,top=useAbove?Math.max(margin,rect.top-rendered-5):Math.min(window.innerHeight-rendered-margin,rect.bottom+5),left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left));
  Object.assign(menu.style,{position:'fixed',width:width+'px',left:left+'px',top:Math.max(margin,top)+'px',zIndex:'10050'});
  if(previousScroll)menu.scrollTop=Math.min(previousScroll,Math.max(0,menu.scrollHeight-menu.clientHeight));
}
function scheduleDropdownPosition(event){
  if(dropdownPositionQueued||!openDropdownState)return;
  const menu=dropdownMenu(openDropdownState.slot,openDropdownState.kind);
  if(event?.type==='scroll'&&(event.target===menu||menu?.contains?.(event.target)))return;
  dropdownPositionQueued=true;requestAnimationFrame(positionDropdown)
}
function openDropdown(slot,kind){
  if(openDropdownState?.slot===slot&&openDropdownState?.kind===kind){closeDropdown();return}
  closeDropdown();const owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind);if(!owner||!menu)return;
  openDropdownState={slot,kind};owner.classList.add('is-open');menu.hidden=false;menu.classList.add('is-portaled');document.body.appendChild(menu);owner.querySelector('[data-vocab-dropdown-toggle]')?.setAttribute('aria-expanded','true');scheduleDropdownPosition();
}
function canonicalHarmonicWindowInput(){return document.querySelector('#skyFoundationRelationships [data-harmonic-window-input]')}
function syncHarmonicWindowControls(){
  const value=String(harmonicWindow()),max=String(HARMONIC()?.maxWindow??0);
  document.querySelectorAll('[data-vocab-harmonic-window-input]').forEach(input=>{
    input.value=value;input.setAttribute('aria-valuenow',value);input.setAttribute('aria-valuemax',max);input.setAttribute('aria-invalid','false');input.setCustomValidity('');
  });
}
function setHarmonicWindowFromVocab(input,commit=false){
  const model=HARMONIC(),max=Number(model?.maxWindow??0),raw=String(input.value||'').trim().replace(',','.');
  let value=Number(raw);
  if(commit&&Number.isFinite(value)){value=Math.max(0,Math.min(max,value));input.value=String(value)}
  const valid=raw!==''&&Number.isFinite(value)&&value>=0&&value<=max;
  input.setCustomValidity(valid?'':'Enter a harmonic phase window from 0 to '+max+' degrees.');
  input.setAttribute('aria-invalid',valid?'false':'true');
  if(!valid)return;
  input.setAttribute('aria-valuenow',String(value));
  model?.setWindow?.(value);
  const canonical=canonicalHarmonicWindowInput();
  if(canonical){
    canonical.value=String(value);
    canonical.setAttribute('aria-valuenow',String(value));
    canonical.dispatchEvent(new Event(commit?'change':'input',{bubbles:true}));
    return;
  }
  window.dispatchEvent(new CustomEvent('relphi:sky-harmonic-window-visibility-changed',{detail:{harmonicWindow:value}}));
}
function syncControlState(){
  syncHarmonicWindowControls();
  const display=displayState(),filters=filterState();
  document.querySelectorAll('[data-vocab-layer]').forEach(input=>{input.checked=!!display[input.dataset.vocabLayer]});
  document.querySelectorAll('[data-vocab-filter="relationships"]').forEach(input=>{input.checked=filters.relationships!==false});
  ['A','B'].forEach(slot=>{
    const list=records(slot);
    const placements=scopeSelection(slot,'placements',list),signs=scopeSelection(slot,'signs',list),houses=scopeSelection(slot,'houses',list);
    document.querySelectorAll('[data-vocab-placement][data-vocab-slot="'+slot+'"]').forEach(input=>{input.checked=placements.has(input.dataset.vocabPlacement)});
    document.querySelectorAll('[data-vocab-sign][data-vocab-slot="'+slot+'"]').forEach(input=>{input.checked=signs.has(Number(input.dataset.vocabSign))});
    document.querySelectorAll('[data-vocab-house][data-vocab-slot="'+slot+'"]').forEach(input=>{input.checked=houses.has(Number(input.dataset.vocabHouse))});
    document.querySelectorAll('[data-vocab-group][data-vocab-slot="'+slot+'"]').forEach(input=>{
      const members=list.filter(record=>categoryOf(record)===input.dataset.vocabGroup),chosen=members.filter(record=>placements.has(record.id)).length;
      input.checked=members.length>0&&chosen===members.length;input.indeterminate=chosen>0&&chosen<members.length;
    });
    document.querySelectorAll('[data-vocab-dimension-master="placements"][data-vocab-slot="'+slot+'"]').forEach(input=>{input.checked=list.length>0&&placements.size===list.length;input.indeterminate=placements.size>0&&placements.size<list.length});
    document.querySelectorAll('[data-vocab-dimension-master="houses"][data-vocab-slot="'+slot+'"]').forEach(input=>{input.checked=houses.size===ALL_HOUSES.length;input.indeterminate=houses.size>0&&houses.size<ALL_HOUSES.length});
    ['placements','signs','houses'].forEach(kind=>document.querySelectorAll('[data-vocab-dropdown-summary="'+kind+'"][data-vocab-summary-slot="'+slot+'"]').forEach(node=>{node.textContent=dimensionSummary(slot,kind)}));
  });
  document.querySelectorAll('[data-vocab-dropdown-summary="layers"]').forEach(node=>{node.textContent=layerSummary()});
}
function rerenderPanels(){vocabWheelTouchLine=null;clearVocabWheelContext();syncControlState();document.querySelectorAll('[data-sky-vocab-panel]').forEach(panel=>renderParagraph(panel.dataset.skyVocabPanel,panel))}
function releaseWheelIsolationForManualFilter(){
  if(!wheelFilterState)return;
  wheelFilterState=null;wheelFilterSpec=null;
  const clear=document.getElementById('skyFoundationClearIsolation');if(clear&&!clear.hidden)clear.click();
}
function setLayerAll(checked){const state=displayState();['glyphs','referents','names'].forEach(id=>{state[id]=checked});saveDisplay(state);rerenderPanels()}
function setDimensionAll(slot,kind,checked){
  releaseWheelIsolationForManualFilter();
  const all=kind==='placements'?records(slot).map(record=>record.id):kind==='signs'?ALL_SIGNS:ALL_HOUSES;
  saveManualDimension(slot,kind,checked?all:[]);rerenderPanels();
}
function toggleDimension(slot,kind,value,checked){
  releaseWheelIsolationForManualFilter();
  const list=records(slot),selected=new Set(scopeSelection(slot,kind,list));
  const normalized=kind==='placements'?value:Number(value);checked?selected.add(normalized):selected.delete(normalized);
  saveManualDimension(slot,kind,selected,list);rerenderPanels();
}
function toggleGroup(slot,category,checked){
  releaseWheelIsolationForManualFilter();
  const list=records(slot),selected=new Set(scopeSelection(slot,'placements',list)),members=list.filter(record=>categoryOf(record)===category).map(record=>record.id);
  members.forEach(id=>checked?selected.add(id):selected.delete(id));saveManualDimension(slot,'placements',selected,list);rerenderPanels();
}
function decorateRelationshipStyleMenus(root){
  root.querySelectorAll('[data-vocab-zodiac-glyph]').forEach(host=>{
    if(host.dataset.vocabDecorated==='true')return;
    const index=Number(host.dataset.vocabZodiacGlyph),id=String(SIGNS[index]||'').toLowerCase(),registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.get(id)||registry.resolve(id));
    if(!entry||!component?.createBubble)return;
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-20 -20 40 40');svg.setAttribute('aria-hidden','true');host.appendChild(svg);
    const bubble=component.createBubble(svg,entry.id,{radius:15,padding:1,color:SIGN_COLORS[index]});bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true');host.dataset.vocabDecorated='true';
  });
  root.querySelectorAll('[data-vocab-house-medallion]').forEach(host=>{
    if(host.dataset.vocabDecorated==='true')return;
    const marker=window.RelphiHouseMedallion?.create?.(Number(host.dataset.vocabHouseMedallion));
    if(!marker)return;
    marker.classList.add('sky-chart-house-menu-medallion');marker.setAttribute('aria-hidden','true');marker.removeAttribute('aria-label');marker.removeAttribute('title');
    host.replaceWith(marker);marker.dataset.vocabDecorated='true';
  });
}
function ensurePanel(slot,view){
  let panel=view.querySelector('[data-sky-vocab-panel]');if(panel)return panel;
  panel=document.createElement('section');panel.className='sky-vocab-panel';panel.dataset.skyVocabPanel=slot;panel.hidden=true;
  panel.innerHTML=controlsMarkup(slot)+'<div class="sky-vocab-paragraph" data-sky-vocab-paragraph></div>';
  decorateRelationshipStyleMenus(panel);
  const mount=view.querySelector('[data-sky-drawer-mount="placements"]');mount?.insertAdjacentElement('afterend',panel);
  panel.querySelectorAll('[data-vocab-harmonic-window-input]').forEach(input=>{
    input.addEventListener('input',()=>setHarmonicWindowFromVocab(input,false));
    input.addEventListener('change',()=>setHarmonicWindowFromVocab(input,true));
    input.addEventListener('blur',()=>setHarmonicWindowFromVocab(input,true));
  });
  panel.querySelectorAll('[data-vocab-layer]').forEach(input=>input.addEventListener('change',()=>{const state=displayState();state[input.dataset.vocabLayer]=input.checked;saveDisplay(state);rerenderPanels()}));
  panel.querySelectorAll('[data-vocab-placement]').forEach(input=>input.addEventListener('change',()=>toggleDimension(slot,'placements',input.dataset.vocabPlacement,input.checked)));
  panel.querySelectorAll('[data-vocab-sign]').forEach(input=>input.addEventListener('change',()=>toggleDimension(slot,'signs',input.dataset.vocabSign,input.checked)));
  panel.querySelectorAll('[data-vocab-house]').forEach(input=>input.addEventListener('change',()=>toggleDimension(slot,'houses',input.dataset.vocabHouse,input.checked)));
  panel.querySelectorAll('[data-vocab-group]').forEach(input=>input.addEventListener('change',()=>toggleGroup(slot,input.dataset.vocabGroup,input.checked)));
  panel.querySelectorAll('[data-vocab-dimension-all]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setDimensionAll(slot,button.dataset.vocabDimensionAll,true)}));
  panel.querySelectorAll('[data-vocab-dimension-master]').forEach(input=>input.addEventListener('change',()=>setDimensionAll(slot,input.dataset.vocabDimensionMaster,input.checked)));
  panel.querySelectorAll('[data-vocab-dimension-none]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setDimensionAll(slot,button.dataset.vocabDimensionNone,false)}));
  panel.querySelectorAll('[data-vocab-dropdown-toggle]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openDropdown(slot,button.dataset.vocabDropdownToggle)}));
  panel.querySelector('[data-vocab-layer-all]')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setLayerAll(true)});
  panel.querySelector('[data-vocab-layer-none]')?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setLayerAll(false)});
  panel.querySelectorAll('[data-indeterminate="true"]').forEach(input=>{input.indeterminate=true});
  panel.addEventListener('click',event=>progressive(event));panel.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')progressive(event)});
  bindVocabWheelContext(panel);
  return panel;
}
function progressive(event){
  const level=event.target.closest?.('[data-vocab-level]');if(!level)return;
  const tokenNode=level.closest('.sky-vocab-token');if(!tokenNode)return;
  event.preventDefault();event.stopPropagation();
  const local=localVisibility(tokenNode);
  tokenNode.dataset.vocabLocalStage=String(local.missingCount?local.stage>=local.missingCount?0:local.stage+1:0);
  renderToken(tokenNode);
}
function installSubtabs(slot,view){
  const row=view.querySelector('.sky-placement-copy-row');if(!row)return;
  let tabs=row.querySelector('[data-sky-vocab-tabs]');
  if(!tabs){
    const title=row.querySelector('.sky-placement-copy-title');if(title)title.hidden=true;
    tabs=document.createElement('div');tabs.className='sky-placement-vocab-tabs';tabs.dataset.skyVocabTabs=slot;tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Placement views');
    tabs.innerHTML='<button type="button" class="sky-placement-vocab-tab" data-sky-vocab-view-button="placements" role="tab">Placements</button><button type="button" class="sky-placement-vocab-tab" data-sky-vocab-view-button="vocab" role="tab">Vocab</button>';
    row.insertBefore(tabs,row.querySelector('[data-copy-placements]')||null);
    tabs.addEventListener('click',event=>{const button=event.target.closest('[data-sky-vocab-view-button]');if(button)activate(slot,button.dataset.skyVocabViewButton)});
  }
  if(!row.querySelector('[data-copy-vocab]')){
    const copy=document.createElement('button');copy.type='button';copy.className='sky-quick-copy-button sky-vocab-copy';copy.dataset.copyVocab=slot;copy.textContent='Copy';copy.hidden=true;copy.setAttribute('aria-label','Copy visible Vocab for Sky '+slot);row.appendChild(copy);
  }
}
function activate(slot,mode){
  const refs=window.RelphiSkyCardShell?.get?.(slot),view=refs?.placementsView;if(!view)return;
  const placement=refs.placements,panel=ensurePanel(slot,view),copy=view.querySelector('[data-copy-placements]'),vocabCopy=view.querySelector('[data-copy-vocab]'),next=mode==='vocab'?'vocab':'placements';
  if(placement)placement.hidden=next==='vocab';panel.hidden=next!=='vocab';if(copy)copy.hidden=next==='vocab';if(vocabCopy)vocabCopy.hidden=next!=='vocab';
  view.querySelectorAll('[data-sky-vocab-view-button]').forEach(button=>{const active=button.dataset.skyVocabViewButton===next;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false');button.tabIndex=active?0:-1});
  view.dataset.skyVocabView=next;saveView(slot,next);
  if(next==='vocab')renderParagraph(slot,panel);else if(vocabWheelContextLine?.closest?.('[data-sky-vocab-panel]')===panel){vocabWheelTouchLine=null;clearVocabWheelContext()}
}
function ensureSlot(slot){
  const refs=window.RelphiSkyCardShell?.get?.(slot),view=refs?.placementsView;if(!view)return;
  installSubtabs(slot,view);const panel=ensurePanel(slot,view),state=viewState(),mode=state[slot]==='vocab'?'vocab':'placements';activate(slot,mode);
  if(mode==='vocab')renderParagraph(slot,panel);
}
function installStyles(){
  if(document.getElementById('skyVocabTabV1Styles'))return;
  const style=document.createElement('style');style.id='skyVocabTabV1Styles';style.textContent=`
    .sky-placement-vocab-tabs{display:inline-flex;align-items:center;gap:.18rem;min-width:0}
    .sky-vocab-copy{margin-left:auto}
    .sky-placement-vocab-tab{appearance:none;border:0;border-radius:999px;background:transparent;color:#5e554e;padding:.34rem .58rem;font:850 .72rem/1 system-ui,sans-serif;cursor:pointer}
    .sky-placement-vocab-tab:hover,.sky-placement-vocab-tab:focus-visible{background:#f4eee7;outline:none}
    .sky-placement-vocab-tab.is-active{background:#241f1b;color:#fff}
    .sky-vocab-panel{display:grid;gap:.72rem;padding:.52rem .7rem .82rem;min-width:0}
    .sky-vocab-panel[hidden]{display:none!important}
    .sky-vocab-harmonic-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;align-items:end}
    .sky-vocab-harmonic-field{width:auto;min-width:0;margin:0}
    .sky-vocab-harmonic-input{width:100%;box-sizing:border-box;background:#fff!important;padding-right:.58rem}
    .sky-vocab-dropdown-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;align-items:end}

    /* Display remains Vocab-specific. Placement / Houses / Zodiac use the Relationships classes directly. */
    .sky-vocab-dropdown{position:relative;display:grid;grid-template-rows:auto 35px;gap:4px;min-width:0}
    .sky-vocab-dropdown-label{align-self:end;color:#4e463f;font:800 .62rem/1.2 system-ui,sans-serif}
    .sky-vocab-dropdown-field{appearance:none;width:100%;height:35px;box-sizing:border-box;margin:0;padding:.52rem 2rem .52rem .58rem;border:1px solid rgba(31,27,24,.2);border-radius:9px;background:#fff var(--sky-chart-filter-chevron) no-repeat right 9px center/15px 15px;color:#191613;font:700 .68rem/1.2 system-ui,sans-serif;text-align:left;cursor:pointer}
    .sky-vocab-dropdown-menu{position:fixed;z-index:10000;width:min(260px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 24px));overflow:auto;box-sizing:border-box;padding:10px;border:1px solid rgba(31,27,24,.22);border-radius:13px;background:#fffdf8;box-shadow:0 16px 38px rgba(31,27,24,.2)}
    .sky-vocab-dropdown-menu[hidden]{display:none!important}
    .sky-vocab-filter-list{overflow:hidden;border:1px solid rgba(31,27,24,.17);border-radius:10px;background:#fff}
    .sky-vocab-filter-header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-height:38px;border-bottom:1px solid rgba(31,27,24,.16);background:#e9e3da;color:#29231e;font:900 .61rem/1 system-ui,sans-serif}
    .sky-vocab-filter-header strong{padding:7px 10px}
    .sky-vocab-filter-actions{align-self:stretch;display:flex;align-items:center;gap:4px;padding:4px 6px;border-left:1px solid rgba(31,27,24,.1)}
    .sky-vocab-filter-actions button{min-height:26px;margin:0;padding:4px 7px;border:1px solid rgba(31,27,24,.25);border-radius:6px;background:#fff;color:#29231e;font:800 .58rem/1 system-ui,sans-serif}
    .sky-vocab-filter-row{display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center;min-height:42px;border-top:1px solid rgba(31,27,24,.075);color:#29231e;cursor:pointer}
    .sky-vocab-filter-name{padding:7px 10px;font:750 .67rem/1.15 system-ui,sans-serif}
    .sky-vocab-filter-check{align-self:stretch;display:flex;align-items:center;justify-content:center;border-left:1px solid rgba(31,27,24,.08);background:rgba(31,27,24,.018)}
    .sky-vocab-filter-row input[type="checkbox"]{appearance:none;-webkit-appearance:none;position:relative;width:15px;height:15px;min-width:15px;margin:0;border:1px solid #211d19;border-radius:3px;background:#fff!important;color:#111}
    .sky-vocab-filter-row input[type="checkbox"]::after{content:"";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 13px/13px Arial,sans-serif}
    .sky-vocab-filter-row input[type="checkbox"]:checked::after{content:"✓"}

    /* Make the reused Relationships controls match the unified Relationships closed-field treatment. */
    .sky-vocab-panel .sky-chart-placement-filter-head,.sky-vocab-panel .sky-chart-house-filter-head{display:grid!important;grid-template-columns:minmax(0,1fr) 32px!important;grid-template-rows:auto 35px!important;grid-template-areas:"label label" "field field"!important;align-items:center!important;gap:4px 0!important;min-height:0!important}
    .sky-vocab-panel .sky-chart-placement-filter-label,.sky-vocab-panel .sky-chart-house-filter-label{grid-area:label!important;align-self:end!important;padding:0!important;color:#4e463f!important;font:800 .62rem/1.2 system-ui,sans-serif!important}
    .sky-vocab-panel .sky-chart-placement-summary-choices,.sky-vocab-panel .sky-chart-house-summary-choices{grid-area:field!important;grid-column:1/3!important;grid-row:2!important;height:35px!important;min-height:35px!important;padding:.52rem .58rem!important;padding-right:36px!important;border:1px solid rgba(31,27,24,.2)!important;border-radius:9px!important;background:#fff!important;color:#191613!important;font:700 .68rem/1.2 system-ui,sans-serif!important}
    .sky-vocab-panel .sky-chart-placement-filter-toggle,.sky-vocab-panel .sky-chart-house-filter-toggle{grid-column:2!important;grid-row:2!important;z-index:2!important;width:32px!important;min-width:32px!important;height:35px!important;min-height:35px!important;border:0!important;border-radius:0 9px 9px 0!important;background-color:transparent!important;background-image:var(--sky-chart-filter-chevron)!important;background-repeat:no-repeat!important;background-position:center!important;background-size:15px 15px!important;color:transparent!important;font-size:0!important}
    .sky-vocab-panel .sky-chart-placement-filter-toggle::before{display:none!important}
    .sky-vocab-panel .sky-chart-zodiac-filter{display:grid;grid-template-rows:auto 35px;gap:4px;align-self:end;min-width:0;color:#4e463f;font:800 .62rem/1.2 system-ui,sans-serif}
    .sky-vocab-panel .sky-chart-zodiac-filter-label{align-self:end}
    .sky-vocab-panel .sky-chart-zodiac-filter-toggle{height:35px}

    /* Vocab has one sky-specific checkbox column; row visuals remain the Relationships visuals. */
    .sky-vocab-panel .sky-chart-placement-list-header,.sky-vocab-panel .sky-chart-placement-list-item{grid-template-columns:minmax(0,1fr) 40px}
    .sky-vocab-panel .sky-chart-house-list-header,.sky-vocab-panel .sky-chart-house-list-item{grid-template-columns:minmax(0,1fr) 40px}
    .sky-vocab-panel .sky-chart-placement-list-header span,.sky-vocab-panel .sky-chart-house-list-header span{display:flex}
    .sky-vocab-panel .sky-chart-placement-choice,.sky-vocab-panel .sky-chart-house-choice{min-width:40px}
    .sky-vocab-rel-popover .sky-chart-placement-list-header,.sky-vocab-rel-popover .sky-chart-placement-list-item{grid-template-columns:minmax(0,1fr) 40px!important}
    .sky-vocab-rel-popover .sky-chart-placement-list-header-choices,.sky-vocab-rel-popover .sky-chart-placement-list-choices{grid-template-columns:40px!important}
    .sky-vocab-rel-popover .sky-chart-placement-list-header-choice,.sky-vocab-rel-popover .sky-chart-placement-choice{width:40px!important;min-width:40px!important}
    .sky-vocab-rel-popover .sky-chart-house-list-header,.sky-vocab-rel-popover .sky-chart-house-list-item{grid-template-columns:minmax(0,1fr) 40px!important}
    .sky-vocab-rel-popover .sky-chart-placement-list-header span,.sky-vocab-rel-popover .sky-chart-house-list-header span{display:flex!important}
    .sky-vocab-rel-popover .sky-chart-placement-choice,.sky-vocab-rel-popover .sky-chart-house-choice{min-width:40px!important}
    .sky-vocab-rel-popover .sky-chart-house-menu-description{white-space:normal}

    .sky-vocab-paragraph{display:grid;gap:.48rem;margin:0;color:#2c2723;font:500 .81rem/1.52 system-ui,sans-serif}
    .sky-vocab-line{display:block;margin:0}
    .sky-vocab-structures-heading{margin:0 0 -.08rem;padding-top:0;border-top:0;color:#6a6058;font:900 .62rem/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.055em}
    .sky-vocab-structure-subheading,.sky-vocab-placements-heading{margin:.12rem 0 -.18rem;color:#756b62;font:850 .58rem/1.2 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.045em}
    .sky-vocab-placements-heading{margin-top:.32rem;padding-top:.5rem;border-top:1px solid rgba(31,27,24,.12)}
    .sky-vocab-structure-line{padding:.34rem .42rem;border-left:3px solid rgba(31,27,24,.24);border-radius:0 6px 6px 0;background:rgba(31,27,24,.035);color:#211d19;font-size:1em;font-weight:500;line-height:1.52}
    .sky-vocab-structure-line[data-vocab-polarity-colors="true"]{position:relative;border-left:0;padding-left:.76rem}
    .sky-vocab-structure-line[data-vocab-polarity-colors="true"]::before,.sky-vocab-structure-line[data-vocab-polarity-colors="true"]::after{content:"";position:absolute;top:0;bottom:0;width:3px}
    .sky-vocab-structure-line[data-vocab-polarity-colors="true"]::before{left:0;border-radius:3px 0 0 3px;background:var(--vocab-polarity-signs)}
    .sky-vocab-structure-line[data-vocab-polarity-colors="true"]::after{left:4px;background:var(--vocab-polarity-houses);opacity:.5}
    .sky-vocab-structure-line[data-vocab-concentration-colors="true"]{position:relative;border-left:0;padding-left:.76rem}
    .sky-vocab-structure-line[data-vocab-concentration-colors="true"]::before,.sky-vocab-structure-line[data-vocab-concentration-colors="true"]::after{content:"";position:absolute;top:0;bottom:0;width:3px}
    .sky-vocab-structure-line[data-vocab-concentration-colors="true"]::before{left:0;border-radius:3px 0 0 3px;background:var(--vocab-concentration-signs)}
    .sky-vocab-structure-line[data-vocab-concentration-colors="true"]::after{left:4px;background:var(--vocab-concentration-houses);opacity:.5}
    .sky-vocab-line[data-vocab-placement-colors="true"]{position:relative;padding-left:.76rem}
    .sky-vocab-line[data-vocab-placement-colors="true"]::before,.sky-vocab-line[data-vocab-placement-colors="true"]::after{content:"";position:absolute;top:0;bottom:0;width:3px}
    .sky-vocab-line[data-vocab-placement-colors="true"]::before{left:0;background:var(--vocab-placement-signs)}
    .sky-vocab-line[data-vocab-placement-colors="true"]::after{left:4px;background:var(--vocab-placement-houses);opacity:.5}
    .sky-vocab-line.is-wheel-context-active{box-shadow:inset 0 0 0 1px rgba(31,27,24,.14)}
    .sky-vocab-token.is-wheel-token-active>.sky-vocab-level{background:rgba(45,39,34,.09);box-shadow:inset 0 -2px 0 rgba(31,27,24,.22)}
    /* Wheel emphasis deliberately reuses the comparison wheel's native isolation
       classes. Vocab owns no second glow/brightness treatment. */
    .sky-vocab-structure-label{font:inherit;color:inherit}
    .sky-vocab-structure-member-group{display:inline}
    .sky-vocab-structure-member-context{white-space:normal;color:inherit}
    .sky-vocab-structure-context{display:inline;white-space:normal;font:inherit;color:inherit}
    .sky-vocab-structure-line .sky-vocab-referent{font:inherit;color:inherit}
    .sky-vocab-structure-line .sky-vocab-name{font:inherit;vertical-align:baseline}
    .sky-vocab-structure-line .sky-vocab-parenthetical{font:inherit}
    .sky-vocab-token{display:inline;white-space:normal}
    .sky-vocab-level{border-radius:4px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sky-vocab-level:hover,.sky-vocab-level:focus-visible{background:rgba(45,39,34,.07);outline:none}
    .sky-vocab-token{--vocab-mark-size:1.68em}
    .sky-vocab-symbol-label{display:inline;white-space:nowrap}
    .sky-vocab-parenthetical{display:inline;white-space:nowrap;vertical-align:baseline;color:#6a6058}
    .sky-vocab-parenthetical .sky-vocab-name,.sky-vocab-parenthetical .sky-vocab-referent{display:inline;vertical-align:baseline;color:inherit}
    .sky-vocab-glyph{position:relative;display:inline-block;width:var(--vocab-mark-size);min-width:var(--vocab-mark-size);height:1em;min-height:1em;margin:0;vertical-align:baseline;overflow:visible;font-weight:800;line-height:1}
    .sky-vocab-glyph.has-svg-glyph{width:var(--vocab-mark-size);min-width:var(--vocab-mark-size)}
    .sky-vocab-glyph svg{position:absolute;left:50%;top:50%;display:block;width:var(--vocab-mark-size);height:var(--vocab-mark-size);overflow:visible;transform:translate(-50%,-36%)}
    .sky-vocab-glyph.is-house-medallion{position:relative;display:inline-block;width:var(--vocab-mark-size);min-width:var(--vocab-mark-size);height:1em;min-height:1em;vertical-align:-.08em;overflow:visible}
    .sky-vocab-glyph>.relphi-house-medallion{position:absolute!important;left:50%!important;top:50%!important;display:inline-grid!important;width:1.3rem!important;height:1.3rem!important;margin:0!important;place-items:center!important;vertical-align:baseline!important;transform:translate(-50%,-61%);color:var(--house-ink)!important;-webkit-text-fill-color:var(--house-ink)!important;font-size:.72em!important;line-height:1!important}
    .sky-vocab-glyph>.relphi-house-medallion[data-house="10"],.sky-vocab-glyph>.relphi-house-medallion[data-house="11"],.sky-vocab-glyph>.relphi-house-medallion[data-house="12"]{font-size:.61em!important;letter-spacing:-.02em!important}
    .sky-vocab-name{display:inline-block;font-weight:720;font-size:.94em;line-height:1;vertical-align:baseline;color:#62584f}
    .sky-vocab-referent{font-weight:560;color:#211d19}
    .sky-vocab-level.is-color-coded{color:var(--vocab-token-color)!important;-webkit-text-fill-color:var(--vocab-token-color)!important}
    .sky-vocab-level.is-color-coded svg{color:var(--vocab-token-color)!important}
    .sky-vocab-empty{color:#766c64;font-style:italic}
    @media(max-width:620px){
      .sky-placement-vocab-tab{font-size:.7rem;padding:.34rem .52rem}
      .sky-vocab-panel{padding:.48rem .58rem .74rem}
      .sky-vocab-dropdown-row{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      .sky-vocab-paragraph{font-size:.79rem;line-height:1.5}
    }
  `;document.head.appendChild(style);
}
function render(){
  queued=false;if(vocabWheelContextLine&&!vocabWheelContextLine.isConnected){vocabWheelTouchLine=null;clearVocabWheelContext()}installStyles();saveDisplay(displayState());['A','B'].forEach(ensureSlot);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
function relationshipRowSlots(row){
  const mode=String(row?.dataset?.relationshipMode||'A-B').toUpperCase();
  return{left:String(row?.dataset?.leftSky||(mode==='B-B'?'B':'A')).toUpperCase(),right:String(row?.dataset?.rightSky||(mode==='A-A'?'A':mode==='B-B'?'B':'B')).toUpperCase()};
}
function allWheelScope(){return{A:emptyScope(),B:emptyScope()}}
function wheelSpecFromNode(node){
  const kind=String(node?.dataset?.interactive||'');
  if(kind==='placement'&&KEYS[node.dataset.sky])return{kind,sky:node.dataset.sky,value:String(node.dataset.placement||'')};
  if(kind==='sign'){
    const value=Number(node.dataset.sign);return Number.isInteger(value)?{kind,sky:null,value}:null;
  }
  if(kind==='house'&&KEYS[node.dataset.sky]){
    const value=Number(node.dataset.house);return Number.isInteger(value)?{kind,sky:node.dataset.sky,value}:null;
  }
  return null;
}
function sameWheelSpec(a,b){return!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&String(a.value)===String(b.value)}
function wheelScopeFromSpec(spec){
  if(!spec)return null;
  const next=allWheelScope();
  if(spec.kind==='placement'){
    next[spec.sky]={placements:[String(spec.value)],signs:null,houses:null};
    return next;
  }
  if(spec.kind==='sign'){
    const sign=Number(spec.value);
    next.A={placements:null,signs:[sign],houses:null};
    next.B={placements:null,signs:[sign],houses:null};
    return next;
  }
  if(spec.kind==='house'){
    next[spec.sky]={placements:null,signs:null,houses:[Number(spec.value)]};
    return next;
  }
  return null;
}
function wheelNodeFromEvent(event){
  const allowed=new Set(['placement','sign','house']);
  const direct=event.target.closest?.('#skyFoundationWheelMount [data-interactive="placement"],#skyFoundationWheelMount [data-interactive="sign"],#skyFoundationWheelMount [data-interactive="house"]');
  if(direct)return direct;
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  return path.find(node=>node?.dataset&&allowed.has(node.dataset.interactive)&&node.closest?.('#skyFoundationWheelMount'))||null;
}
function vocabClearableBlank(target){
  const root=document.getElementById('skyFoundationRoot');
  if(!root?.contains(target))return false;
  if(target.closest?.('[data-interactive],button,input,select,textarea,a,label,summary,details,.sky-foundation-relationship-row,#skySelectedRelationship,.sky-chart-filter-bar,.sky-card-hits-structure,.sky-foundation-relationships-heading'))return false;
  return !!target.closest?.('#skyFoundationWheelMount,#skyFoundationA,#skyFoundationB,#skyFoundationComparison');
}
function mirrorDirectWheelClick(event){
  const node=wheelNodeFromEvent(event);
  if(!node){
    if((wheelFilterState||wheelFilterSpec)&&vocabClearableBlank(event.target))applyWheelSpec(null);
    return;
  }
  const spec=wheelSpecFromNode(node);if(!spec)return;
  if(sameWheelSpec(wheelFilterSpec,spec)){
    wheelFilterSpec=null;wheelFilterState=null;
  }else{
    wheelFilterSpec=spec;wheelFilterState=wheelScopeFromSpec(spec);
  }
  rerenderPanels();
}
function applyWheelSpec(spec){
  if(!spec){wheelFilterSpec=null;wheelFilterState=null;rerenderPanels();return}
  wheelFilterSpec=spec;wheelFilterState=wheelScopeFromSpec(spec);rerenderPanels();
}
function driveFiltersFromWheel(detail){
  const state=detail?.state;
  if(state?.mode==='hover')return;
  if(!state){
    if(wheelFilterState||wheelFilterSpec)applyWheelSpec(null);
    return;
  }
  if(state.mode!=='selected')return;
  if(state.kind==='placement'&&KEYS[state.sky]){applyWheelSpec({kind:'placement',sky:state.sky,value:String(state.value||'')});return}
  if(state.kind==='sign'){applyWheelSpec({kind:'sign',sky:null,value:Number(state.value)});return}
  if(state.kind==='house'&&KEYS[state.sky]){applyWheelSpec({kind:'house',sky:state.sky,value:Number(state.value)});return}
  if(state.kind!=='aspect')return;
  const next=allWheelScope(),endpoints={A:new Set(),B:new Set()};
  (detail.relationshipIndexes||[]).forEach(index=>{
    const row=document.querySelector('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index="'+CSS.escape(String(index))+'"]');if(!row)return;
    const slots=relationshipRowSlots(row);
    if(row.dataset.leftPlacement&&KEYS[slots.left])endpoints[slots.left].add(row.dataset.leftPlacement);
    if(row.dataset.rightPlacement&&KEYS[slots.right])endpoints[slots.right].add(row.dataset.rightPlacement);
  });
  ['A','B'].forEach(slot=>{if(endpoints[slot].size)next[slot]={placements:Array.from(endpoints[slot]),signs:null,houses:null}});
  wheelFilterState=next;wheelFilterSpec={kind:'aspect',sky:null,value:String(state.value||'')};rerenderPanels();
}
function mirrorHouseBridge(detail){
  if(detail?.source!=='comparison-wheel')return;
  const slot=String(detail.slot||'').toUpperCase();
  if(detail.active&&KEYS[slot]&&Number.isInteger(Number(detail.house))){
    applyWheelSpec({kind:'house',sky:slot,value:Number(detail.house)});
  }else if(wheelFilterSpec?.kind==='house'){
    applyWheelSpec(null);
  }
}
function mirrorZodiacBridge(detail){
  const signs=Array.isArray(detail?.signs)?detail.signs.map(Number).filter(Number.isInteger):[];
  if(detail?.source==='wheel'&&signs.length===1){
    applyWheelSpec({kind:'sign',sky:null,value:signs[0]});
  }else if(wheelFilterSpec?.kind==='sign'&&signs.length===12){
    applyWheelSpec(null);
  }
}
window.addEventListener('relphi:sky-foundation-filter-changed',event=>driveFiltersFromWheel(event.detail));
window.addEventListener('relphi:sky-foundation-clear-selection',()=>{
  if(wheelFilterState||wheelFilterSpec)applyWheelSpec(null);
  vocabWheelTouchLine=null;clearVocabWheelContext();
});
window.addEventListener('relphi:sky-house-focus-bridge-changed',event=>mirrorHouseBridge(event.detail));
window.addEventListener('relphi:sky-zodiac-filter-changed',event=>mirrorZodiacBridge(event.detail));
document.addEventListener('pointerdown',mirrorDirectWheelClick,true);
document.addEventListener('pointerdown',clearVocabWheelContextFromBlank,true);
[
  'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready',
  'relphi:sky-orb-limit-changed','relphi:sky-harmonic-window-visibility-changed','relphi:sky-working-copy-updated','relphi:saved-sky-loaded',
  'relphi:sky-b-restored','relphi:sky-session-recovered'
].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key)||event.key===DISPLAY_KEY)schedule()});
window.addEventListener('pageshow',schedule);
document.addEventListener('pointerdown',event=>{
  if(!openDropdownState)return;
  const {slot,kind}=openDropdownState,owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind),path=typeof event.composedPath==='function'?event.composedPath():[];
  if(path.includes(owner)||path.includes(menu)||owner?.contains(event.target)||menu?.contains(event.target))return;
  closeDropdown();
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDropdown()});
window.addEventListener('resize',scheduleDropdownPosition);
window.addEventListener('scroll',scheduleDropdownPosition,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.RelphiSkyVocab=Object.freeze({render:schedule,activate,getDisplay:displayState,getFilters:filterState,getScopeFilters:scopeFilterState,getWheelFilters:()=>wheelFilterState,getWheelFilterSpec:()=>wheelFilterSpec});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
