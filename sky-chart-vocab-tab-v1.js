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
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
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
  vx:'vertex',
  'north node':'north-node','true node':'north-node','mean node':'north-node',node:'north-node',
  'south node':'south-node',
  fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune',
  'black moon lilith':'lilith',
  'asteroid lilith':'asteroid-lilith','lilith 1181':'asteroid-lilith','1181 lilith':'asteroid-lilith',
  'child asteroid':'child','asteroid child':'child'
};
const ORDER=['north-node','south-node','asc','dsc','mc','ic','sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','lilith','asteroid-lilith','part-of-fortune','vertex','child','hidalgo','victoria','daphne','vesta'];
const NODE_IDS=new Set(['north-node','south-node']);
const AXIS_IDS=new Set(['asc','dsc','mc','ic']);
const LUMINARY_IDS=new Set(['sun','moon']);
const PLANET_IDS=new Set(['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
const AXIS_PAIRS=new Set(['asc|dsc','dsc|asc','mc|ic','ic|mc']);
const HARMONIC=()=>window.RelphiHarmonicOrb;
let queued=false;
const focusState={A:'',B:''};
let openDropdownState=null;
let dropdownPositionQueued=false;

const norm=value=>((Number(value)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
const slug=value=>String(value||'').trim().toLowerCase().replace(/[._]/g,' ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function readJson(storage,key,fallback){try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(storage,key,value){try{storage.setItem(key,JSON.stringify(value))}catch(_){}}
function payload(slot){return readJson(localStorage,KEYS[slot],null)}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function source(value){
  if(!value||typeof value!=='object')return[];
  const known=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object');
  const raw=known||value;
  if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
  return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
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
function relations(list){
  const model=HARMONIC(),aspects=model?.aspects||[],windowValue=(model?.windowFromControl?.()??Number(document.documentElement.dataset.skyHarmonicWindow))||6,result=[];
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
function houseInfo(number){return{id:'house-'+number,glyphId:null,name:HOUSE_NAMES[number]||'House',referent:HOUSE_REFERENTS[number]||'life area',fallbackGlyph:String(number||''),color:HOUSE_COLORS[number-1]||''}}
function placementInfo(record){return{id:record.id,glyphId:record.glyphId,name:record.name,referent:placementReferent(record),fallbackGlyph:record.name,color:''}}
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
  const value=readJson(localStorage,FILTER_KEY,null);
  return{
    nodes:value?.nodes!==false,
    axes:value?.axes!==false,
    luminaries:value?.luminaries!==false,
    planets:value?.planets!==false,
    other:value?.other!==false,
    relationships:value?.relationships!==false
  };
}
function saveFilter(next){writeJson(localStorage,FILTER_KEY,next)}
function categoryOf(record){
  if(NODE_IDS.has(record.id))return'nodes';
  if(AXIS_IDS.has(record.id))return'axes';
  if(LUMINARY_IDS.has(record.id))return'luminaries';
  if(PLANET_IDS.has(record.id))return'planets';
  return'other';
}
function eligibleRecords(list,filters){return list.filter(record=>filters[categoryOf(record)]!==false)}
function viewState(){return readJson(sessionStorage,VIEW_KEY,{A:'placements',B:'placements'})}
function saveView(slot,view){const state=viewState();state[slot]=view;writeJson(sessionStorage,VIEW_KEY,state)}
function applyTokenColor(node,tokenNode){
  const color=String(tokenNode?.dataset?.vocabColor||'').trim();
  if(!color)return;
  node.classList.add('is-color-coded');
  node.style.setProperty('color',color,'important');
  node.style.setProperty('-webkit-text-fill-color',color,'important');
}
function token(info,kind='term'){
  const node=document.createElement('span');
  node.className='sky-vocab-token';
  node.dataset.vocabKind=kind;
  node.dataset.vocabId=String(info.id||'');
  node.dataset.vocabGlyphId=String(info.glyphId||'');
  node.dataset.vocabName=String(info.name||'');
  node.dataset.vocabReferent=String(info.referent||'');
  node.dataset.vocabFallbackGlyph=String(info.fallbackGlyph||info.name||'');
  node.dataset.vocabColor=String(info.color||'');
  if(info.color)node.style.setProperty('--vocab-token-color',String(info.color));
  node.dataset.vocabLocalStage='0';
  renderToken(node);
  return node;
}
function glyphNode(tokenNode){
  const holder=document.createElement('span');holder.className='sky-vocab-level sky-vocab-glyph';holder.dataset.vocabLevel='glyph';holder.setAttribute('role','button');holder.tabIndex=0;holder.setAttribute('aria-label','Reveal name');applyTokenColor(holder,tokenNode);
  const glyphId=tokenNode.dataset.vocabGlyphId,fallback=tokenNode.dataset.vocabFallbackGlyph||tokenNode.dataset.vocabName;
  const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=glyphId&&(registry?.get?.(glyphId)||registry?.resolve?.(glyphId));
  if(entry&&component){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-18 -18 36 36');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');holder.appendChild(svg);
    component.draw(svg,entry.id,{radius:13,padding:1,color:'currentColor'}).catch(()=>{holder.replaceChildren(document.createTextNode(fallback))});
  }else holder.textContent=fallback;
  return holder;
}
function nameNode(tokenNode){
  const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-name';node.dataset.vocabLevel='name';node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label','Reveal referent');applyTokenColor(node,tokenNode);node.textContent=tokenNode.dataset.vocabName;return node;
}
function referentNode(tokenNode){
  const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-referent';node.dataset.vocabLevel='referent';node.setAttribute('role','button');node.tabIndex=0;node.textContent=tokenNode.dataset.vocabReferent;return node;
}
function renderToken(node){
  if(!(node instanceof HTMLElement))return;
  const state=displayState(),stage=Number(node.dataset.vocabLocalStage||0),showGlyph=state.glyphs,showName=state.names||stage>=1,showReferent=state.referents||stage>=2;
  node.replaceChildren();node.hidden=!(showGlyph||showName||showReferent);
  if(node.hidden)return;
  const g=showGlyph?glyphNode(node):null,n=showName?nameNode(node):null,r=showReferent?referentNode(node):null;
  if(r){
    node.appendChild(r);
    const astro=[];
    if(g)astro.push(g);
    if(n){
      const duplicateFallback=g&&g.textContent&&g.textContent.trim()===n.textContent.trim()&&!g.querySelector('svg');
      if(!duplicateFallback)astro.push(n);
    }
    if(astro.length){
      node.appendChild(document.createTextNode(' ('));
      astro.forEach((part,index)=>{if(index)node.appendChild(document.createTextNode(' '));node.appendChild(part)});
      node.appendChild(document.createTextNode(')'));
    }
  }else{
    if(g)node.appendChild(g);
    if(g&&n){
      const duplicateFallback=g.textContent&&g.textContent.trim()===n.textContent.trim()&&!g.querySelector('svg');
      if(!duplicateFallback)node.append(document.createTextNode(' '),n);
    }else if(n)node.appendChild(n);
  }
}
function rerenderTokens(root=document){root.querySelectorAll?.('.sky-vocab-token').forEach(renderToken)}

function phrasePlacement(record){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(record),'placement'),document.createTextNode(' in '),token(signInfo(record.sign),'sign'));
  if(record.house)frag.append(document.createTextNode(' in '),token(houseInfo(record.house),'house'));
  return frag;
}
function appendSentence(paragraph,fragment){paragraph.append(fragment,document.createTextNode('. '))}
function axisSentence(first,second){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(first),'placement'),document.createTextNode(' is in '),token(signInfo(first.sign),'sign'));
  if(first.house)frag.append(document.createTextNode(' in '),token(houseInfo(first.house),'house'));
  frag.append(document.createTextNode(', while '),token(placementInfo(second),'placement'),document.createTextNode(' is in '),token(signInfo(second.sign),'sign'));
  if(second.house)frag.append(document.createTextNode(' in '),token(houseInfo(second.house),'house'));
  return frag;
}
function relationSentence(relation){
  const frag=document.createDocumentFragment();
  frag.append(token(placementInfo(relation.left),'placement'),document.createTextNode(' is in '),token(aspectInfo(relation.aspect),'aspect'),document.createTextNode(' with '),token(placementInfo(relation.right),'placement'));
  return frag;
}
function renderGroup(paragraph,list,category){
  list.filter(record=>categoryOf(record)===category).forEach(record=>appendSentence(paragraph,phrasePlacement(record)));
}
function renderFullPlacements(paragraph,list){
  renderGroup(paragraph,list,'nodes');
  const byId=new Map(list.map(record=>[record.id,record])),asc=byId.get('asc'),dsc=byId.get('dsc'),mc=byId.get('mc'),ic=byId.get('ic');
  if(asc&&dsc)appendSentence(paragraph,axisSentence(asc,dsc));
  if(ic&&mc)appendSentence(paragraph,axisSentence(ic,mc));
  renderGroup(paragraph,list,'luminaries');
  renderGroup(paragraph,list,'planets');
  renderGroup(paragraph,list,'other');
}
function syncFocusBar(slot,panel,record){
  const bar=panel.querySelector('[data-vocab-focus-bar]'),label=bar?.querySelector('[data-vocab-focus-label]');
  if(!bar||!label)return;
  const id=focusState[slot];
  bar.hidden=!id;
  if(id)label.textContent='Focus: '+String(record?.name||id);
}
function renderParagraph(slot,panel){
  const list=records(slot),paragraph=panel.querySelector('[data-sky-vocab-paragraph]'),filters=filterState();
  if(!paragraph)return;
  paragraph.replaceChildren();
  if(!list.length){syncFocusBar(slot,panel,null);paragraph.textContent='Add or calculate placements to read this sky as vocabulary.';return}
  const focusId=focusState[slot],focusRecord=focusId?list.find(record=>record.id===focusId)||null:null,permitted=eligibleRecords(list,filters);
  syncFocusBar(slot,panel,focusRecord);
  if(focusId){
    if(!focusRecord){paragraph.textContent='The focused placement is no longer present in this sky.';return}
    if(filters[categoryOf(focusRecord)]===false){paragraph.textContent=focusRecord.name+' is hidden by the current Vocab filters.';return}
    appendSentence(paragraph,phrasePlacement(focusRecord));
    if(filters.relationships!==false){
      relations(permitted).filter(relation=>relation.left.id===focusId||relation.right.id===focusId).forEach(relation=>appendSentence(paragraph,relationSentence(relation)));
    }
  }else{
    renderFullPlacements(paragraph,permitted);
    if(filters.relationships!==false)relations(permitted).forEach(relation=>appendSentence(paragraph,relationSentence(relation)));
  }
  if(!displayState().glyphs&&!displayState().names&&!displayState().referents){
    paragraph.replaceChildren();
    const empty=document.createElement('span');empty.className='sky-vocab-empty';empty.textContent='Turn on Glyphs, Names, or Referents to display the vocabulary.';paragraph.appendChild(empty);
  }else if(!paragraph.childNodes.length){
    paragraph.textContent='No Vocab content matches the current filters.';
  }
}
function optionLabel(id,kind){
  if(kind==='layers')return{id:'glyphs',label:'Glyphs'}.id===id?'Glyphs':id==='names'?'Names':'Referents';
  return({nodes:'Nodes',axes:'Axes',luminaries:'Luminaries',planets:'Planets',other:'Other points',relationships:'Intrasky'})[id]||id;
}
function dropdownSummary(kind){
  const ids=kind==='layers'?['glyphs','names','referents']:['nodes','axes','luminaries','planets','other','relationships'];
  const state=kind==='layers'?displayState():filterState(),selected=ids.filter(id=>state[id]);
  if(selected.length===ids.length)return'All';
  if(!selected.length)return'None';
  if(kind==='layers'&&selected.length<=2)return selected.map(id=>optionLabel(id,kind)).join(' · ');
  return selected.length+' of '+ids.length;
}
function dropdownMarkup(slot,kind,label,ids,state){
  const menuId='skyVocab'+(kind==='layers'?'Display':'Include')+'Menu'+slot;
  const dataAttr=kind==='layers'?'data-vocab-layer':'data-vocab-filter';
  return '<div class="sky-vocab-dropdown" data-vocab-dropdown="'+kind+'" data-vocab-dropdown-slot="'+slot+'">'+
    '<span class="sky-vocab-dropdown-label">'+label+'</span>'+
    '<button type="button" class="sky-vocab-dropdown-field" data-vocab-dropdown-toggle="'+kind+'" aria-haspopup="dialog" aria-expanded="false" aria-controls="'+menuId+'">'+
      '<span class="sky-vocab-dropdown-summary" data-vocab-dropdown-summary="'+kind+'">'+dropdownSummary(kind)+'</span>'+
      '<span class="sky-vocab-dropdown-chevron" aria-hidden="true"></span>'+
    '</button>'+
    '<div id="'+menuId+'" class="sky-vocab-dropdown-menu" data-vocab-dropdown-menu="'+kind+'" data-vocab-menu-slot="'+slot+'" role="dialog" aria-label="'+label+'" hidden>'+
      ids.map(id=>'<label class="sky-vocab-menu-choice"><input type="checkbox" '+dataAttr+'="'+id+'" '+(state[id]?'checked':'')+'><span>'+optionLabel(id,kind)+'</span></label>').join('')+
    '</div>'+
  '</div>';
}
function controlsMarkup(slot){
  const state=displayState(),filters=filterState();
  return '<div class="sky-vocab-dropdown-row">'+
    dropdownMarkup(slot,'layers','Display',['glyphs','names','referents'],state)+
    dropdownMarkup(slot,'filters','Include',['nodes','axes','luminaries','planets','other','relationships'],filters)+
    '</div>'+
    '<div class="sky-vocab-focus-bar" data-vocab-focus-bar hidden><span data-vocab-focus-label></span><button type="button" data-vocab-clear-focus>Show all</button></div>';
}
function dropdownOwner(slot,kind){
  return document.querySelector('[data-sky-vocab-panel="'+slot+'"] [data-vocab-dropdown="'+kind+'"]');
}
function dropdownMenu(slot,kind){
  return document.querySelector('[data-vocab-dropdown-menu="'+kind+'"][data-vocab-menu-slot="'+slot+'"]');
}
function closeDropdown(){
  if(!openDropdownState)return;
  const {slot,kind}=openDropdownState,owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind);
  if(menu){
    menu.hidden=true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner?.appendChild(menu);
  }
  owner?.classList.remove('is-open');
  owner?.querySelector('[data-vocab-dropdown-toggle]')?.setAttribute('aria-expanded','false');
  openDropdownState=null;
}
function positionDropdown(){
  dropdownPositionQueued=false;
  if(!openDropdownState)return;
  const {slot,kind}=openDropdownState,owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind),field=owner?.querySelector('.sky-vocab-dropdown-field');
  if(!owner||!menu||!field||menu.hidden)return;
  const rect=field.getBoundingClientRect(),margin=10,width=Math.max(180,Math.min(280,Math.max(rect.width,220))),below=window.innerHeight-rect.bottom-margin,above=rect.top-margin;
  const natural=Math.min(menu.scrollHeight+4,320),maxHeight=Math.max(140,Math.min(320,Math.max(below,above)));
  const useAbove=below<Math.min(180,natural)&&above>below;
  const top=useAbove?Math.max(margin,rect.top-Math.min(natural,maxHeight)-5):Math.min(window.innerHeight-Math.min(natural,maxHeight)-margin,rect.bottom+5);
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left));
  Object.assign(menu.style,{position:'fixed',width:width+'px',maxHeight:maxHeight+'px',left:left+'px',top:Math.max(margin,top)+'px',zIndex:'10050'});
}
function scheduleDropdownPosition(){
  if(dropdownPositionQueued||!openDropdownState)return;
  dropdownPositionQueued=true;requestAnimationFrame(positionDropdown);
}
function openDropdown(slot,kind){
  if(openDropdownState?.slot===slot&&openDropdownState?.kind===kind){closeDropdown();return}
  closeDropdown();
  const owner=dropdownOwner(slot,kind),menu=dropdownMenu(slot,kind);
  if(!owner||!menu)return;
  openDropdownState={slot,kind};owner.classList.add('is-open');menu.hidden=false;menu.classList.add('is-portaled');document.body.appendChild(menu);
  owner.querySelector('[data-vocab-dropdown-toggle]')?.setAttribute('aria-expanded','true');
  scheduleDropdownPosition();
}
function updateDropdownSummaries(){
  document.querySelectorAll('[data-vocab-dropdown-summary]').forEach(node=>{node.textContent=dropdownSummary(node.dataset.vocabDropdownSummary)});
}
function rerenderPanels(){
  const display=displayState(),filters=filterState();
  document.querySelectorAll('[data-vocab-layer]').forEach(control=>{control.checked=!!display[control.dataset.vocabLayer]});
  document.querySelectorAll('[data-vocab-filter]').forEach(control=>{control.checked=!!filters[control.dataset.vocabFilter]});
  updateDropdownSummaries();
  document.querySelectorAll('[data-sky-vocab-panel]').forEach(panel=>renderParagraph(panel.dataset.skyVocabPanel,panel));
}
function clearVocabFocus(slot){
  focusState[slot]='';
  const clear=document.getElementById('skyFoundationClearIsolation');
  if(clear&&!clear.hidden)clear.click();else schedule();
}
function ensurePanel(slot,view){
  let panel=view.querySelector('[data-sky-vocab-panel]');
  if(panel)return panel;
  panel=document.createElement('section');panel.className='sky-vocab-panel';panel.dataset.skyVocabPanel=slot;panel.hidden=true;
  panel.innerHTML=controlsMarkup(slot)+'<p class="sky-vocab-paragraph" data-sky-vocab-paragraph></p>';
  const mount=view.querySelector('[data-sky-drawer-mount="placements"]');mount?.insertAdjacentElement('afterend',panel);
  panel.querySelectorAll('[data-vocab-layer]').forEach(input=>input.addEventListener('change',()=>{
    const state=displayState();state[input.dataset.vocabLayer]=input.checked;saveDisplay(state);rerenderPanels();
  }));
  panel.querySelectorAll('[data-vocab-filter]').forEach(input=>input.addEventListener('change',()=>{
    const state=filterState();state[input.dataset.vocabFilter]=input.checked;saveFilter(state);rerenderPanels();
  }));
  panel.querySelectorAll('[data-vocab-dropdown-toggle]').forEach(button=>button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();openDropdown(slot,button.dataset.vocabDropdownToggle);
  }));
  panel.querySelector('[data-vocab-clear-focus]')?.addEventListener('click',()=>clearVocabFocus(slot));
  panel.addEventListener('click',event=>progressive(event));
  panel.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')progressive(event)});
  return panel;
}
function progressive(event){
  const level=event.target.closest?.('[data-vocab-level]');if(!level)return;
  const tokenNode=level.closest('.sky-vocab-token');if(!tokenNode)return;
  event.preventDefault();event.stopPropagation();
  const current=Number(tokenNode.dataset.vocabLocalStage||0),which=level.dataset.vocabLevel;
  if(which==='glyph')tokenNode.dataset.vocabLocalStage=String(current>0?0:1);
  else if(which==='name')tokenNode.dataset.vocabLocalStage=String(current>=2?1:2);
  else if(which==='referent'&&current>2)tokenNode.dataset.vocabLocalStage='2';
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
}
function activate(slot,mode){
  const refs=window.RelphiSkyCardShell?.get?.(slot),view=refs?.placementsView;if(!view)return;
  const placement=refs.placements,panel=ensurePanel(slot,view),copy=view.querySelector('[data-copy-placements]'),next=mode==='vocab'?'vocab':'placements';
  if(placement)placement.hidden=next==='vocab';panel.hidden=next!=='vocab';if(copy)copy.hidden=next==='vocab';
  view.querySelectorAll('[data-sky-vocab-view-button]').forEach(button=>{const active=button.dataset.skyVocabViewButton===next;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false');button.tabIndex=active?0:-1});
  view.dataset.skyVocabView=next;saveView(slot,next);
  if(next==='vocab')renderParagraph(slot,panel);
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
    .sky-placement-vocab-tab{appearance:none;border:0;border-radius:999px;background:transparent;color:#5e554e;padding:.34rem .58rem;font:850 .72rem/1 system-ui,sans-serif;cursor:pointer}
    .sky-placement-vocab-tab:hover,.sky-placement-vocab-tab:focus-visible{background:#f4eee7;outline:none}
    .sky-placement-vocab-tab.is-active{background:#241f1b;color:#fff}
    .sky-vocab-panel{display:grid;gap:.72rem;padding:.52rem .7rem .82rem;min-width:0}
    .sky-vocab-panel[hidden]{display:none!important}
    .sky-vocab-dropdown-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;align-items:end}
    .sky-vocab-dropdown{position:relative;display:grid;grid-template-rows:auto 32px;gap:4px;min-width:0}
    .sky-vocab-dropdown-label{min-width:0;color:#665d56;font:800 .62rem/1.15 system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sky-vocab-dropdown-field{appearance:none;display:grid;grid-template-columns:minmax(0,1fr) 30px;align-items:center;width:100%;height:32px;min-width:0;margin:0;padding:0;border:1px solid rgba(56,48,42,.24);border-radius:7px;background:#fff;color:#332d28;font:750 .66rem/1.2 system-ui,sans-serif;text-align:left;cursor:pointer}
    .sky-vocab-dropdown-summary{min-width:0;padding:0 .5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sky-vocab-dropdown-chevron{align-self:stretch;border-left:1px solid rgba(56,48,42,.08);background-image:var(--sky-chart-filter-chevron);background-repeat:no-repeat;background-position:center;background-size:14px 14px}
    .sky-vocab-dropdown-field:hover,.sky-vocab-dropdown-field:focus-visible,.sky-vocab-dropdown.is-open .sky-vocab-dropdown-field{background-color:#f5f1eb;outline:none}
    .sky-vocab-dropdown.is-open .sky-vocab-dropdown-field{border-color:rgba(31,27,24,.42);box-shadow:0 0 0 2px rgba(31,27,24,.08)}
    .sky-vocab-dropdown-menu{box-sizing:border-box;display:grid;gap:2px;padding:6px;border:1px solid rgba(56,48,42,.2);border-radius:9px;background:#fff;box-shadow:0 12px 30px rgba(35,29,24,.18);overflow:auto}
    .sky-vocab-dropdown-menu[hidden]{display:none!important}
    .sky-vocab-menu-choice{display:flex;align-items:center;gap:.45rem;min-height:30px;padding:.28rem .42rem;border-radius:6px;color:#413934;font:750 .68rem/1.2 system-ui,sans-serif;cursor:pointer}
    .sky-vocab-menu-choice:hover{background:#f5f1eb}
    .sky-vocab-menu-choice input{margin:0;flex:0 0 auto}
    .sky-vocab-focus-bar{display:flex;align-items:center;gap:.48rem;width:max-content;max-width:100%;padding:.34rem .5rem;border-radius:999px;background:#f4eee7;color:#332c27;font:800 .64rem/1.2 system-ui,sans-serif}
    .sky-vocab-focus-bar[hidden]{display:none!important}
    .sky-vocab-focus-bar button{appearance:none;border:0;background:transparent;color:#6c5e54;text-decoration:underline;font:800 inherit;cursor:pointer;padding:0}
    .sky-vocab-paragraph{margin:0;color:#2c2723;font:500 .78rem/1.62 system-ui,sans-serif}
    .sky-vocab-token{display:inline;white-space:normal}
    .sky-vocab-level{border-radius:4px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sky-vocab-level:hover,.sky-vocab-level:focus-visible{background:rgba(45,39,34,.07);outline:none}
    .sky-vocab-glyph{display:inline-flex;align-items:center;justify-content:center;vertical-align:-.13em;min-width:.9em}
    .sky-vocab-glyph svg{display:inline-block;width:1.05em;height:1.05em;overflow:visible}
    .sky-vocab-name{font-weight:760}
    .sky-vocab-referent{font-weight:520;color:#2c2723}
    .sky-vocab-level.is-color-coded{color:var(--vocab-token-color)!important;-webkit-text-fill-color:var(--vocab-token-color)!important}
    .sky-vocab-level.is-color-coded svg{color:var(--vocab-token-color)!important}
    .sky-vocab-empty{color:#766c64;font-style:italic}
    @media(max-width:620px){
      .sky-placement-vocab-tab{font-size:.7rem;padding:.34rem .52rem}
      .sky-vocab-panel{padding:.48rem .58rem .74rem}
      .sky-vocab-dropdown-row{gap:6px}
      .sky-vocab-dropdown-label{font-size:.6rem}
      .sky-vocab-dropdown-field{font-size:.64rem}
      .sky-vocab-paragraph{font-size:.75rem;line-height:1.55}
    }
  `;document.head.appendChild(style);
}
function render(){
  queued=false;installStyles();saveDisplay(displayState());['A','B'].forEach(ensureSlot);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
function syncFocusFromFoundation(detail){
  const state=detail?.state;
  if(state?.mode==='hover')return;
  const next={A:'',B:''};
  if(state?.kind==='placement'&&state?.mode==='selected'&&KEYS[state.sky])next[state.sky]=String(state.value||'');
  const changed=next.A!==focusState.A||next.B!==focusState.B;
  if(!changed)return;
  focusState.A=next.A;focusState.B=next.B;schedule();
}
window.addEventListener('relphi:sky-foundation-filter-changed',event=>syncFocusFromFoundation(event.detail));
window.addEventListener('relphi:sky-foundation-clear-selection',()=>{if(focusState.A||focusState.B){focusState.A='';focusState.B='';schedule()}});
[
  'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready',
  'relphi:sky-orb-limit-changed','relphi:sky-working-copy-updated','relphi:saved-sky-loaded',
  'relphi:sky-b-restored','relphi:sky-session-recovered'
].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key)||event.key===DISPLAY_KEY||event.key===FILTER_KEY)schedule()});
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
window.RelphiSkyVocab=Object.freeze({render:schedule,activate,getDisplay:displayState,getFilters:filterState,getFocus:()=>({...focusState})});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
