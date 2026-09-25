// Relationships Vocab: a peer reading mode for the Relationships ledger.
// Reuses the Placements Vocab grammar: Glyphs, Referents, and Names are progressive layers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipVocabV1)return;
window.__relphiSkyRelationshipVocabV1=true;

const VIEW_KEY='relphiSkyRelationshipVocabViewV1';
const GROUP_KEY='relphiSkyRelationshipVocabGroupOpenV1';
const DISPLAY_KEY='relphiSkyVocabDisplayV1';
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
  'anti-vertex':'what becomes accessible through the back door',
  child:'children',
  hidalgo:'independence',
  victoria:'victory',
  daphne:'self-preservation through transformation',
  vesta:'devotion'
};
const ASPECT_NAMES={
  conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',
  square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'
};
const ASPECT_REFERENTS={
  conjunction:'union','semi-sextile':'accommodation',octile:'focused friction',sextile:'cooperative opening',
  quintile:'creative pattern-making',square:'activating pressure',trine:'low-resistance flow',
  'tri-octile':'accumulated friction','bi-quintile':'refined creative pattern-making',
  quincunx:'continuing adjustment',opposition:'polarity'
};
const CONFIGS={
  'grand-trine':{name:'Grand Trine',referent:'closed three-way low-resistance flow'},
  kite:{name:'Kite',referent:'low-resistance circuit given direction through an opposing axis'},
  yod:{name:'Yod / Finger of God',referent:'converging adjustment toward a single apex'},
  'mystic-rectangle':{name:'Mystic Rectangle',referent:'balanced polarity linked by alternating flow and opportunity'},
  't-square':{name:'T-Square',referent:'opposition concentrated through a third point'},
  'grand-cross':{name:'Grand Cross / Grand Square',referent:'four-way activating pressure across two opposing axes'},
  'minor-grand-trine':{name:'Minor Grand Trine',referent:'flowing exchange focused through a cooperative apex'},
  'grand-sextile':{name:'Grand Sextile',referent:'six-point cooperative circuit with interlocking flow and polarity'},
  cradle:{name:'Cradle',referent:'opposing poles supported by a network of trines and sextiles'},
  'thors-hammer':{name:"Thor's Hammer / Fist of God",referent:'concentrated friction driven through a single apex'}
};
const HIDDEN_FOR_CONFIG=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-zodiac-filter-hidden','sky-chart-semantic-hidden'];
const HIDDEN_FOR_RELATIONSHIP=[...HIDDEN_FOR_CONFIG,'sky-chart-aspect-multiselect-hidden'];
let queued=false,activeMode='relationships',hoverRows=[],hoverLines=[];

function readJson(storage,key,fallback){try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(storage,key,value){try{storage.setItem(key,JSON.stringify(value))}catch(_){}}
function displayState(){
  const api=window.RelphiSkyVocab?.getDisplay?.();if(api)return api;
  const value=readJson(localStorage,DISPLAY_KEY,null);
  return{glyphs:value?.glyphs!==false,names:value?.names!==false,referents:value?.referents!==false};
}
function capitalize(value){return String(value||'').replace(/[A-Za-z]/,letter=>letter.toUpperCase())}
function registryEntry(id){const registry=window.RelphiGlyphRegistry;return registry?.get?.(id)||registry?.resolve?.(id)||null}
function placementName(id){return registryEntry(id)?.name||String(id||'').replace(/(^|-)([a-z])/g,(_,a,b)=>(a?' ':'')+b.toUpperCase())}
function placementInfo(id){return{id,glyphId:id,name:placementName(id),referent:PLACEMENT_REFERENTS[id]||placementName(id).toLowerCase(),hasGlyph:true}}
function signInfo(index){const name=SIGNS[Number(index)]||'Sign';return{id:name.toLowerCase(),glyphId:name.toLowerCase(),name,referent:SIGN_REFERENTS[name]||'zodiacal setting',hasGlyph:true}}
function houseInfo(number){number=Number(number);return{id:'house-'+number,glyphId:'',name:HOUSE_NAMES[number]||'House',referent:HOUSE_REFERENTS[number]||'life area',fallbackGlyph:String(number||''),hasGlyph:true}}
function aspectInfo(id){return{id,glyphId:id,name:ASPECT_NAMES[id]||id,referent:ASPECT_REFERENTS[id]||'relationship',hasGlyph:true}}
function configInfo(id){const value=CONFIGS[id]||{name:id,referent:'compound relationship structure'};return{id:'configuration-'+id,glyphId:'',name:value.name,referent:value.referent,hasGlyph:false}}
function makeToken(info,kind='term',sentenceStart=false,lead=''){
  const node=document.createElement('span');node.className='sky-vocab-token sky-relationship-vocab-token';node.dataset.vocabKind=kind;node.dataset.vocabId=String(info.id||'');node.dataset.vocabGlyphId=String(info.glyphId||'');node.dataset.vocabName=String(info.name||'');node.dataset.vocabReferent=String(info.referent||'');node.dataset.vocabFallbackGlyph=String(info.fallbackGlyph||info.name||'');node.dataset.vocabHasGlyph=info.hasGlyph===false?'false':'true';node.dataset.vocabLead=String(lead||'');node.dataset.vocabSentenceStart=sentenceStart?'true':'false';node.dataset.vocabLocalStage='0';renderToken(node);return node
}
function glyphNode(token){
  if(token.dataset.vocabHasGlyph==='false')return null;
  const holder=document.createElement('span');holder.className='sky-vocab-level sky-vocab-glyph';holder.dataset.vocabLevel='glyph';holder.setAttribute('role','button');holder.tabIndex=0;holder.setAttribute('aria-label','Reveal name');
  const kind=token.dataset.vocabKind,id=token.dataset.vocabGlyphId,fallback=token.dataset.vocabFallbackGlyph||token.dataset.vocabName;
  if(kind==='house'){
    const house=Number(String(token.dataset.vocabId||'').replace(/^house-/,''));
    const marker=window.RelphiHouseMedallion?.create?.(house,'',false);
    if(marker){holder.classList.add('is-house-medallion');marker.setAttribute('aria-hidden','true');marker.removeAttribute('title');marker.removeAttribute('aria-label');holder.appendChild(marker);return holder}
  }
  const unicode=window.RelphiGlyphCopySerializer?.unicodeFor?.(id);
  if(unicode){holder.textContent=unicode;return holder}
  const entry=id&&registryEntry(id),component=window.RelphiGlyphComponent;
  if(entry&&component?.draw){
    holder.classList.add('has-svg-glyph');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-18 -18 36 36');svg.setAttribute('aria-hidden','true');svg.style.visibility='hidden';holder.appendChild(svg);
    Promise.resolve(component.draw(svg,entry.id,{radius:14.5,padding:.5,color:'currentColor'})).then(()=>{if(svg.isConnected)svg.style.visibility='visible'}).catch(()=>{if(holder.isConnected)holder.textContent=fallback});
  }else holder.textContent=fallback;
  return holder
}
function nameNode(token){const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-name';node.dataset.vocabLevel='name';node.setAttribute('role','button');node.tabIndex=0;node.setAttribute('aria-label','Reveal referent');node.textContent=token.dataset.vocabName;return node}
function referentNode(token){const node=document.createElement('span');node.className='sky-vocab-level sky-vocab-referent';node.dataset.vocabLevel='referent';node.setAttribute('role','button');node.tabIndex=0;node.textContent=token.dataset.vocabSentenceStart==='true'?capitalize(token.dataset.vocabReferent):token.dataset.vocabReferent;return node}
function localVisibility(node){
  const state=displayState(),visible=[state.glyphs,state.referents,state.names],missing=[];visible.forEach((shown,index)=>{if(!shown)missing.push(index)});
  const stage=Math.max(0,Math.min(Number(node.dataset.vocabLocalStage||0),missing.length));missing.slice(0,stage).forEach(index=>{visible[index]=true});
  if(node.dataset.vocabHasGlyph==='false')visible[0]=false;
  return{showGlyph:visible[0],showReferent:visible[1],showName:visible[2],missingCount:missing.length,stage}
}
function renderToken(node){
  const state=localVisibility(node);node.replaceChildren();node.hidden=!(state.showGlyph||state.showReferent||state.showName);if(node.hidden)return;
  const lead=String(node.dataset.vocabLead||'').replace(/ /g,'\u00A0'),g=state.showGlyph?glyphNode(node):null,r=state.showReferent?referentNode(node):null,n=state.showName?nameNode(node):null;
  if(g){const head=document.createElement('span');head.className='sky-vocab-symbol-label';if(lead)head.appendChild(document.createTextNode(lead));head.appendChild(g);node.appendChild(head)}
  else if(lead&&(r||n))node.appendChild(document.createTextNode(lead));
  if(r){if(g)node.appendChild(document.createTextNode(' '));node.appendChild(r)}
  if(n){if(g||r)node.appendChild(document.createTextNode(' '));const meta=document.createElement('span');meta.className='sky-vocab-meta sky-vocab-parenthetical';meta.append(document.createTextNode('('),n,document.createTextNode(')'));node.appendChild(meta)}
}
function progressive(event){
  const level=event.target.closest?.('#skyRelationshipVocabPanel [data-vocab-level]');if(!level)return;
  const token=level.closest('.sky-vocab-token');if(!token)return;event.preventDefault();event.stopPropagation();
  const local=localVisibility(token);token.dataset.vocabLocalStage=String(local.missingCount?local.stage>=local.missingCount?0:local.stage+1:0);renderToken(token)
}
function relationshipMode(row){const raw=String(row?.dataset?.relationshipMode||'').toUpperCase();if(raw==='A-A'||raw==='B-B'||raw==='A-B')return raw;if(raw==='B-A')return'A-B';const a=String(row?.dataset?.leftSky||'').toUpperCase(),b=String(row?.dataset?.rightSky||'').toUpperCase();return a===b&&a? a+'-'+a:'A-B'}
function slots(row){const mode=relationshipMode(row);return{left:String(row.dataset.leftSky||(mode==='B-B'?'B':'A')).toUpperCase(),right:String(row.dataset.rightSky||(mode==='A-A'?'A':mode==='B-B'?'B':'B')).toUpperCase()}}
function rowKey(row){const s=slots(row);return s.left+':'+row.dataset.leftPlacement+'|'+row.dataset.aspect+'|'+s.right+':'+row.dataset.rightPlacement}
function configurationEligibleRow(row){return !HIDDEN_FOR_CONFIG.some(name=>row.classList.contains(name))}
function eligibleRow(row){return !row.hidden&&row.getAttribute('aria-hidden')!=='true'&&!HIDDEN_FOR_RELATIONSHIP.some(name=>row.classList.contains(name))}
function relationshipRows(){return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-aspect]')].filter(eligibleRow)}
function memberFromKey(key,pattern){
  const parts=String(key).split(':'),sky=parts.shift(),id=parts.join(':');let sign=NaN,house=NaN;
  for(const edge of pattern.edges||[]){const row=edge.row,s=slots(row);if(s.left===sky&&row.dataset.leftPlacement===id){sign=Number(row.dataset.leftSign);house=Number(row.dataset.leftHouse);break}if(s.right===sky&&row.dataset.rightPlacement===id){sign=Number(row.dataset.rightSign);house=Number(row.dataset.rightHouse);break}}
  return{sky,id,sign,house}
}
function memberContextGroups(members){
  const groups=[],byKey=new Map();
  members.forEach(member=>{
    const key=member.sign+'|'+(Number.isInteger(member.house)&&member.house>0?member.house:0);
    let group=byKey.get(key);if(!group){group={sign:member.sign,house:Number.isInteger(member.house)&&member.house>0?member.house:0,members:[]};byKey.set(key,group);groups.push(group)}
    group.members.push(member);
  });
  return groups;
}
function appendMemberNames(frag,members,sentenceStart=false){
  members.forEach((member,index)=>{
    if(index)frag.appendChild(document.createTextNode(index===members.length-1?' and ':', '));
    frag.append(makeToken(placementInfo(member.id),'placement',sentenceStart&&index===0));
  });
}
function appendMembersByContext(frag,members){
  const groups=memberContextGroups(members);
  groups.forEach((group,index)=>{
    if(index)frag.appendChild(document.createTextNode(index===groups.length-1?'; and ':'; '));
    appendMemberNames(frag,group.members,index===0);
    frag.append(makeToken(signInfo(group.sign),'sign',false,group.members.length===1?' is in ':' are in '));
    if(group.house)frag.append(makeToken(houseInfo(group.house),'house',false,', concerning '));
  });
}
function railGradient(values,colors){
  const valid=values.filter(value=>Number.isInteger(value)&&value>=0&&value<colors.length);
  if(!valid.length)return'linear-gradient(to bottom,rgba(31,27,24,.18) 0 100%)';
  const step=100/valid.length,stops=[];valid.forEach((value,index)=>stops.push(colors[value]+' '+(index*step)+'% '+((index+1)*step)+'%'));
  return'linear-gradient(to bottom,'+stops.join(',')+')';
}
function applyRelationshipRails(line,members){
  line.dataset.relationshipVocabColors='true';
  line.style.setProperty('--relationship-vocab-signs',railGradient(members.map(member=>member.sign),SIGN_COLORS));
  line.style.setProperty('--relationship-vocab-houses',railGradient(members.map(member=>Number.isInteger(member.house)&&member.house>0?member.house-1:NaN),HOUSE_COLORS));
}
function patternScope(pattern){
  const api=window.RelphiAspectConfigurations;
  try{const scoped=api?.scopeForPattern?.(pattern);if(scoped)return scoped}catch(_){}
  const skies=new Set((pattern?.vertices||[]).map(key=>String(key).split(':')[0]).filter(Boolean));
  if(skies.size===1){const sky=[...skies][0];return sky+'-'+sky}
  return'A-B';
}
function scopeLabel(scope){return scope==='A-A'?'A↔A':scope==='B-B'?'B↔B':'A↔B'}
function patternEligible(pattern){return (pattern.edges||[]).every(edge=>edge?.row&&configurationEligibleRow(edge.row))}
function geometryClause(pattern){
  const frag=document.createDocumentFragment(),aspect=id=>makeToken(aspectInfo(id),'aspect');
  if(pattern.type==='grand-trine'){frag.append(document.createTextNode(', with each placement in '),aspect('trine'),document.createTextNode(' with the other two'));return frag}
  if(pattern.type==='yod'){frag.append(document.createTextNode(', with the two base placements in '),aspect('sextile'),document.createTextNode(' and both in '),aspect('quincunx'),document.createTextNode(' with the apex'));return frag}
  if(pattern.type==='t-square'){frag.append(document.createTextNode(', with an '),aspect('opposition'),document.createTextNode(' concentrated through a third placement that is in '),aspect('square'),document.createTextNode(' with both ends'));return frag}
  if(pattern.type==='minor-grand-trine'){frag.append(document.createTextNode(', with a '),aspect('trine'),document.createTextNode(' feeding a third placement through two '),aspect('sextile'),document.createTextNode(' relationships'));return frag}
  if(pattern.type==='thors-hammer'){frag.append(document.createTextNode(', with a '),aspect('square'),document.createTextNode(' driven toward an apex through two '),aspect('tri-octile'),document.createTextNode(' relationships'));return frag}
  if(pattern.type==='grand-cross'){frag.append(document.createTextNode(', forming four '),aspect('square'),document.createTextNode(' relationships across two '),aspect('opposition'),document.createTextNode(' axes'));return frag}
  if(pattern.type==='mystic-rectangle'){frag.append(document.createTextNode(', joining two '),aspect('opposition'),document.createTextNode(' axes through two '),aspect('trine'),document.createTextNode(' and two '),aspect('sextile'),document.createTextNode(' relationships'));return frag}
  if(pattern.type==='kite'){frag.append(document.createTextNode(', extending a '),aspect('trine'),document.createTextNode(' circuit through an '),aspect('opposition'),document.createTextNode(' and two '),aspect('sextile'),document.createTextNode(' relationships'));return frag}
  if(pattern.type==='cradle'){frag.append(document.createTextNode(', supporting an '),aspect('opposition'),document.createTextNode(' through two '),aspect('trine'),document.createTextNode(' and three '),aspect('sextile'),document.createTextNode(' relationships'));return frag}
  if(pattern.type==='grand-sextile'){frag.append(document.createTextNode(', forming six linked '),aspect('sextile'),document.createTextNode(' relationships with embedded '),aspect('trine'),document.createTextNode(' flow and '),aspect('opposition'),document.createTextNode(' axes'));return frag}
  return frag
}
function configurationLine(pattern){
  const line=document.createElement('div');line.className='sky-vocab-line sky-vocab-structure-line sky-relationship-vocab-line';line.dataset.relationshipVocabEdges=(pattern.edges||[]).map(edge=>rowKey(edge.row)).join(';;');line.dataset.vocabStructure='configuration';line.dataset.configurationType=pattern.type;
  const scope=patternScope(pattern);line.dataset.relationshipScope=scope;
  const members=(pattern.vertices||[]).map(key=>memberFromKey(key,pattern));applyRelationshipRails(line,members);
  const frag=document.createDocumentFragment();const scopeText=document.createElement('span');scopeText.className='sky-relationship-vocab-scope';scopeText.textContent=scopeLabel(scope)+' · ';frag.append(scopeText,makeToken(configInfo(pattern.type),'configuration',true),document.createTextNode(': '));
  appendMembersByContext(frag,members);frag.append(geometryClause(pattern),document.createTextNode('.'));line.appendChild(frag);return line
}
function relationshipLine(row){
  const s=slots(row),line=document.createElement('div');line.className='sky-vocab-line sky-relationship-vocab-line';line.dataset.relationshipVocabEdges=rowKey(row);
  const members=[
    {id:String(row.dataset.leftPlacement||''),sign:Number(row.dataset.leftSign),house:Number(row.dataset.leftHouse)},
    {id:String(row.dataset.rightPlacement||''),sign:Number(row.dataset.rightSign),house:Number(row.dataset.rightHouse)}
  ];applyRelationshipRails(line,members);
  const frag=document.createDocumentFragment();frag.append(makeToken(placementInfo(row.dataset.leftPlacement),'placement',true),document.createTextNode(' is in '),makeToken(aspectInfo(row.dataset.aspect),'aspect'),document.createTextNode(' with '),makeToken(placementInfo(row.dataset.rightPlacement),'placement'),document.createTextNode('.'));line.appendChild(frag);line.dataset.relationshipScope=relationshipMode(row);line.dataset.leftSky=s.left;line.dataset.rightSky=s.right;return line
}
function groupState(){return readJson(sessionStorage,GROUP_KEY,{})||{}}
function saveGroup(key,open){const state=groupState();state[key]=!!open;writeJson(sessionStorage,GROUP_KEY,state)}
function previewGlyph(token){
  const id=token.dataset.vocabGlyphId,unicode=window.RelphiGlyphCopySerializer?.unicodeFor?.(id),span=document.createElement('span');span.className='sky-relationship-vocab-preview-token';span.textContent=unicode||token.dataset.vocabName||'';return span
}
function horizontalRail(value){return String(value||'').replace(/to bottom/,'to right')}
function createGroup(container,key,label,lines){
  if(!lines.length)return null;const details=document.createElement('details');details.className='sky-vocab-group sky-relationship-vocab-group';details.dataset.vocabGroup=key;details.open=groupState()[key]===true;
  const summary=document.createElement('summary');summary.className='sky-vocab-group-summary';const title=document.createElement('span');title.className='sky-vocab-structure-subheading sky-vocab-group-title';title.textContent=label;const chevron=document.createElement('span');chevron.className='sky-vocab-group-chevron';chevron.setAttribute('aria-hidden','true');
  const preview=document.createElement('span');preview.className='sky-vocab-group-preview sky-relationship-vocab-preview';const glyphs=document.createElement('span');glyphs.className='sky-relationship-vocab-preview-glyphs';const seen=new Set();
  lines.forEach(line=>line.querySelectorAll('.sky-vocab-token[data-vocab-kind="placement"]').forEach(token=>{const id=token.dataset.vocabId;if(!id||seen.has(id))return;seen.add(id);glyphs.appendChild(previewGlyph(token))}));
  if(glyphs.childNodes.length)preview.appendChild(glyphs);
  const rails=document.createElement('span');rails.className='sky-vocab-group-preview-rails sky-relationship-vocab-preview-rails';
  for(const kind of ['sign','house']){
    const rail=document.createElement('span');rail.className='sky-vocab-group-preview-rail sky-vocab-group-preview-rail-'+kind;rail.dataset.vocabPreviewRail=kind;
    lines.forEach(line=>{const value=line.style.getPropertyValue(kind==='sign'?'--relationship-vocab-signs':'--relationship-vocab-houses').trim();if(!value)return;const segment=document.createElement('span');segment.className='sky-vocab-group-preview-segment';segment.style.background=horizontalRail(value);rail.appendChild(segment)});
    if(rail.childNodes.length)rails.appendChild(rail);
  }
  if(rails.childNodes.length)preview.appendChild(rails);
  summary.append(title,chevron,preview);const body=document.createElement('div');body.className='sky-vocab-group-body';lines.forEach(line=>body.appendChild(line));details.append(summary,body);details.addEventListener('toggle',()=>saveGroup(key,details.open));container.appendChild(details);return details
}
function renderPanel(){
  const panel=document.getElementById('skyRelationshipVocabPanel');if(!panel)return;panel.replaceChildren();
  const patterns=(window.RelphiAspectConfigurations?.patterns||[]).filter(patternEligible);
  if(patterns.length){
    const heading=document.createElement('div');heading.className='sky-vocab-structures-heading';heading.textContent='Configurations';panel.appendChild(heading);
    const scopeOrder={'A-A':0,'B-B':1,'A-B':2};
    Object.entries(CONFIGS).forEach(([type,info])=>{
      const group=patterns.filter(pattern=>pattern.type===type).sort((a,b)=>(scopeOrder[patternScope(a)]??9)-(scopeOrder[patternScope(b)]??9)||a.maxPhase-b.maxPhase||a.meanPhase-b.meanPhase);
      createGroup(panel,'config-type-'+type,info.name,group.map(configurationLine));
    });
  }
  const rows=relationshipRows();
  if(rows.length){
    const heading=document.createElement('div');heading.className='sky-vocab-placements-heading sky-relationship-vocab-relationships-heading';heading.textContent='Relationships';panel.appendChild(heading);
    const buckets={'A-A':[],'B-B':[],'A-B':[]};rows.forEach(row=>buckets[relationshipMode(row)]?.push(relationshipLine(row)));
    createGroup(panel,'relationships-a','A↔A · Sky A',buckets['A-A']);createGroup(panel,'relationships-b','B↔B · Sky B',buckets['B-B']);createGroup(panel,'relationships-ab','A↔B · Intersky',buckets['A-B'])
  }
  if(!panel.childNodes.length){const empty=document.createElement('p');empty.className='sky-vocab-empty';empty.textContent='No relationships match the current Focus.';panel.appendChild(empty)}
}
function ensurePanel(){
  const owner=document.getElementById('skyFoundationRelationships');if(!owner)return null;let panel=document.getElementById('skyRelationshipVocabPanel');if(panel)return panel;
  panel=document.createElement('section');panel.id='skyRelationshipVocabPanel';panel.className='sky-vocab-panel sky-relationship-vocab-panel';panel.hidden=true;panel.setAttribute('aria-label','Relationship Vocab');
  const list=document.getElementById('skyFoundationRelationshipList');if(list)list.insertAdjacentElement('afterend',panel);else owner.appendChild(panel);
  panel.addEventListener('click',progressive);panel.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')progressive(event)});
  panel.addEventListener('pointerover',event=>{const line=event.target.closest('.sky-relationship-vocab-line');if(line&&!line.contains(event.relatedTarget))highlightEdges(line)});
  panel.addEventListener('pointerout',event=>{const line=event.target.closest('.sky-relationship-vocab-line');if(line&&!line.contains(event.relatedTarget))clearEdgeHighlight()});
  panel.addEventListener('focusin',event=>{const line=event.target.closest('.sky-relationship-vocab-line');if(line)highlightEdges(line)});
  panel.addEventListener('focusout',event=>{const line=event.target.closest('.sky-relationship-vocab-line');if(line&&!line.contains(event.relatedTarget))clearEdgeHighlight()});
  return panel
}
function ensureTabs(){
  const heading=document.querySelector('#skyFoundationRelationships>.sky-foundation-relationships-heading');if(!heading)return;
  let tabs=heading.querySelector('[data-relationship-vocab-tabs]');if(!tabs){
    const h2=heading.querySelector('h2');if(h2)h2.hidden=true;tabs=document.createElement('div');tabs.className='sky-placement-vocab-tabs sky-relationship-vocab-tabs';tabs.dataset.relationshipVocabTabs='true';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Relationship views');
    tabs.innerHTML='<button type="button" class="sky-placement-vocab-tab" data-relationship-vocab-view="relationships" role="tab">Relationships</button><button type="button" class="sky-placement-vocab-tab" data-relationship-vocab-view="vocab" role="tab">Vocab</button>';heading.insertBefore(tabs,heading.firstChild);
    tabs.addEventListener('click',event=>{const button=event.target.closest('[data-relationship-vocab-view]');if(button)activate(button.dataset.relationshipVocabView)})
  }
}
function viewState(){return sessionStorage.getItem(VIEW_KEY)==='vocab'?'vocab':'relationships'}
function activate(mode){
  const next=mode==='vocab'?'vocab':'relationships',panel=ensurePanel(),list=document.getElementById('skyFoundationRelationshipList'),empty=document.getElementById('skyFoundationRelationshipEmpty'),count=document.getElementById('skyFoundationRelationshipCount');
  activeMode=next;sessionStorage.setItem(VIEW_KEY,next);if(list)list.hidden=next==='vocab';if(panel)panel.hidden=next!=='vocab';if(empty)empty.hidden=next==='vocab'?true:relationshipRows().length!==0;if(count)count.hidden=next==='vocab';
  document.querySelectorAll('[data-relationship-vocab-view]').forEach(button=>{const active=button.dataset.relationshipVocabView===next;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',active?'true':'false');button.tabIndex=active?0:-1});
  document.querySelectorAll('#skyFoundationRelationships .sky-relationship-sort-control,#skyFoundationRelationships .sky-relationship-limit-control').forEach(control=>control.hidden=next==='vocab');
  document.documentElement.dataset.skyRelationshipView=next;if(next==='vocab')renderPanel();else clearEdgeHighlight()
}
function clearEdgeHighlight(){
  hoverRows.forEach(node=>node.classList.remove('is-relationship-vocab-peer'));hoverLines.forEach(node=>node.classList.remove('is-relationship-vocab-peer'));hoverRows=[];hoverLines=[];document.querySelector('.sky-foundation-wheel')?.classList.remove('has-relationship-vocab-hover')
}
function highlightEdges(line){
  clearEdgeHighlight();const keys=new Set(String(line.dataset.relationshipVocabEdges||'').split(';;').filter(Boolean));if(!keys.size)return;
  document.querySelectorAll('.sky-foundation-relationship-row[data-aspect]').forEach(row=>{if(keys.has(rowKey(row))){row.classList.add('is-relationship-vocab-peer');hoverRows.push(row)}});
  document.querySelectorAll('[data-layer="aspects"]>.sky-foundation-aspect[data-aspect]').forEach(svg=>{if(keys.has(rowKey(svg))){svg.classList.add('is-relationship-vocab-peer');hoverLines.push(svg)}});
  document.querySelector('.sky-foundation-wheel')?.classList.add('has-relationship-vocab-hover')
}
function clean(value){return String(value||'').replace(/[\t\f\v ]+/g,' ').replace(/ *\n */g,'\n').trim()}
function tokenText(token){
  if(token.hidden)return'';const lead=String(token.dataset.vocabLead||''),glyph=token.querySelector('.sky-vocab-glyph'),name=clean(token.querySelector('.sky-vocab-name')?.textContent),referent=clean(token.querySelector('.sky-vocab-referent')?.textContent),parts=[];let glyphText='';
  if(glyph){const id=token.dataset.vocabGlyphId,unicode=window.RelphiGlyphCopySerializer?.unicodeFor?.(id);glyphText=clean(unicode||token.dataset.vocabFallbackGlyph||token.dataset.vocabName)}
  if(glyphText)parts.push(glyphText);if(referent)parts.push(referent);if(name&&!(!unicodeFor(token)&&glyphText.toLowerCase()===name.toLowerCase()))parts.push('('+name+')');return lead+parts.join(' ')
}
function unicodeFor(token){return clean(window.RelphiGlyphCopySerializer?.unicodeFor?.(token.dataset.vocabGlyphId))}
function serializeLine(line){const clone=line.cloneNode(true);const originals=[...line.querySelectorAll('.sky-vocab-token')],copies=[...clone.querySelectorAll('.sky-vocab-token')];copies.forEach((copy,index)=>copy.replaceWith(document.createTextNode(tokenText(originals[index]))));return clean(clone.textContent)}
function serializePanel(){
  const panel=document.getElementById('skyRelationshipVocabPanel');if(!panel)return'';const lines=['Relationships — Vocab',''];
  [...panel.children].forEach(node=>{
    if(node.matches('.sky-vocab-structures-heading,.sky-vocab-placements-heading')){if(lines.at(-1)!=='')lines.push('');lines.push(clean(node.textContent).toUpperCase(),'');return}
    if(node.matches('details.sky-vocab-group')){const title=clean(node.querySelector('.sky-vocab-group-title')?.textContent);if(title){if(lines.at(-1)!=='')lines.push('');lines.push(title,'')}node.querySelectorAll(':scope>.sky-vocab-group-body>.sky-vocab-line').forEach(line=>{const text=serializeLine(line);if(text)lines.push(text)})}
  });return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()
}
async function writeClipboard(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true}}catch(_){}const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');Object.assign(area.style,{position:'fixed',left:'-9999px',opacity:'0'});document.body.appendChild(area);area.select();const ok=document.execCommand('copy')===true;area.remove();return ok}
let imageLibraryPromise=null;
function loadImageLibrary(){
  if(window.htmlToImage?.toPng)return Promise.resolve(window.htmlToImage);
  if(imageLibraryPromise)return imageLibraryPromise;
  imageLibraryPromise=new Promise((resolve,reject)=>{
    const src='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js',existing=document.querySelector('script[src="'+src+'"]');
    if(existing){existing.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});existing.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});return}
    const script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';script.addEventListener('load',()=>window.htmlToImage?.toPng?resolve(window.htmlToImage):reject(new Error('PNG exporter unavailable.')),{once:true});script.addEventListener('error',()=>reject(new Error('PNG exporter did not load.')),{once:true});document.head.appendChild(script)
  });
  return imageLibraryPromise
}
async function vocabDownload(button){
  const panel=document.getElementById('skyRelationshipVocabPanel');if(!panel)return;
  const previous=button?.innerHTML||'',wasDisabled=!!button?.disabled;if(button){button.disabled=true;button.setAttribute('aria-busy','true')}
  try{
    const lib=await loadImageLibrary(),rect=panel.getBoundingClientRect(),width=Math.max(320,Math.ceil(rect.width)),height=Math.max(120,Math.ceil(panel.scrollHeight));
    const dataUrl=await lib.toPng(panel,{cacheBust:false,backgroundColor:'#fffdf8',width,height,pixelRatio:2,canvasWidth:width*2,canvasHeight:height*2,skipAutoScale:true});
    const a=document.createElement('a');a.href=dataUrl;a.download='relationship-vocab-'+new Date().toISOString().slice(0,10)+'.png';a.style.display='none';document.body.appendChild(a);a.click();a.remove()
  }catch(error){console.error('[Sky Chart] Relationship Vocab export failed',error)}
  finally{if(button){button.disabled=wasDisabled;button.removeAttribute('aria-busy');button.innerHTML=previous}}
}
function installStyles(){
  if(document.getElementById('skyRelationshipVocabV1Styles'))return;const style=document.createElement('style');style.id='skyRelationshipVocabV1Styles';style.textContent=
    '.sky-relationship-vocab-tabs{grid-column:1/2;justify-self:start}.sky-relationship-vocab-panel{padding:.52rem .7rem .82rem;border-top:1px solid rgba(31,27,24,.1)}'+
    '.sky-relationship-vocab-preview{display:flex!important;gap:3px;align-items:center;overflow:hidden}.sky-relationship-vocab-preview-token{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 2px;border-radius:999px;background:#fffdf8;box-shadow:inset 0 0 0 1px rgba(31,27,24,.1);font:800 10px/1 system-ui,sans-serif;color:#332e2a}'+
    '.sky-relationship-vocab-line{position:relative}.sky-foundation-relationship-row.is-relationship-vocab-peer{box-shadow:inset 0 0 0 2px rgba(31,27,24,.38);background:#fffaf2}.sky-foundation-aspect.is-relationship-vocab-peer{stroke-width:6!important;opacity:1!important;filter:drop-shadow(0 0 2px #fffdf8)}'+
    '.sky-foundation-wheel.has-relationship-vocab-hover [data-layer="aspects"]>.sky-foundation-aspect:not(.is-relationship-vocab-peer){opacity:.12!important}'+
    '@media(max-width:620px){.sky-relationship-vocab-tabs{grid-area:title;grid-column:auto}.sky-relationship-vocab-panel{padding:.48rem .58rem .74rem}}';
  document.head.appendChild(style)
}
function refresh(){queued=false;installStyles();ensureTabs();ensurePanel();activate(viewState())}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
function start(){
  document.addEventListener('click',event=>{
    if(activeMode!=='vocab')return;
    const copy=event.target.closest('.sky-relationship-copy-button');if(copy){event.preventDefault();event.stopImmediatePropagation();void writeClipboard(serializePanel()).then(ok=>{if(!ok)return;const previous=copy.textContent;copy.textContent='Copied';setTimeout(()=>{if(copy.isConnected)copy.textContent=previous||'Copy'},1200)});return}
    const download=event.target.closest('#skyChartRelationshipsExport');if(download){event.preventDefault();event.stopImmediatePropagation();void vocabDownload(download)}
  },true);
  ['relphi:sky-foundation-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-aspect-multiselect-changed','relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected','relphi:sky-harmonic-window-visibility-changed','relphi:sky-display-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed'].forEach(name=>window.addEventListener(name,()=>{if(activeMode==='vocab')schedule()}));
  const observedList=document.getElementById('skyFoundationRelationshipList');if(observedList)new MutationObserver(records=>{if(activeMode==='vocab'&&records.some(record=>record.addedNodes?.length||record.removedNodes?.length))schedule()}).observe(observedList,{childList:true,subtree:false});
  schedule()
}
window.RelphiRelationshipVocab=Object.freeze({render:schedule,serialize:serializePanel,activate});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();