// Unified relationship list: inter-sky and intrasky relationships share one list.
// Sky ownership is conveyed visually by the existing red/blue endpoint colors.
// Redundant self-defining axes (Asc-Dsc, MC-IC, North Node-South Node) are omitted
// only within a sky; every other relationship involving those points remains eligible.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyIntraskyRelationshipsV2)return;
window.__relphiSkyIntraskyRelationshipsV2=true;
window.__relphiSkyIntraskyRelationshipsV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const COLORS={A:'#c9211e',B:'#2462d0'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ORDER=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','lilith','part-of-fortune','vertex','north-node','south-node','asc','dsc','mc','ic'];
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const REDUNDANT_INTRASKY_PAIRS=new Set(['asc|dsc','ic|mc','north-node|south-node']);
const HIDDEN_CLASSES=['sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden','sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'];
let queued=false,countQueued=false,colorQueued=false,listObserver=null;

const norm=value=>((Number(value)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){
  if(!payload||typeof payload!=='object')return[];
  const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),raw=known||payload;
  if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
  return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac));
}
function longitude(item){
  if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
  const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());
  return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
}
function canonical(key,item){
  const registry=window.RelphiGlyphRegistry;if(!registry)return null;
  for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
    if(candidate==null)continue;
    const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry.resolve?.(id)||registry.get?.(id);
    if(entry)return entry;
  }
  return null;
}
function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
function ascendant(payload,list){
  const record=list.find(item=>item.id==='asc');if(record)return record.value;
  const value=Number(profile(payload).ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0;
}
function cusps(payload,list){
  const p=profile(payload);
  for(const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){
    if(!raw)continue;
    const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);
    if(values.length===12&&values.every(Number.isFinite))return values.map(norm);
  }
  const asc=ascendant(payload,list),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;
  return Array.from({length:12},(_,index)=>norm(start+index*30));
}
function houseFor(value,houseCusps){
  for(let index=0;index<12;index+=1){
    const start=houseCusps[index],span=norm(houseCusps[(index+1)%12]-start)||30;
    if(norm(value-start)<span)return index+1;
  }
  return 12;
}
function prepare(slot){
  const payload=read(slot),list=source(payload).map(([key,item])=>{
    const entry=canonical(key,item),value=longitude(item);return{key,item,entry,id:entry?.id||'',value,sky:slot};
  }).filter(record=>record.entry&&Number.isFinite(record.value)).sort((a,b)=>{
    const ai=ORDER.indexOf(a.id),bi=ORDER.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.value-b.value;
  }),houseCusps=cusps(payload,list);
  list.forEach(record=>{record.sign=Math.floor(record.value/30);record.house=houseFor(record.value,houseCusps)});
  return list;
}
function redundantPair(left,right){
  const key=[String(left||''),String(right||'')].sort().join('|');
  return REDUNDANT_INTRASKY_PAIRS.has(key);
}
function relationships(list,scope){
  const harmonic=window.RelphiHarmonicOrb,aspects=harmonic?.aspects||[],windowValue=Number(harmonic?.maxWindow)||12,result=[];
  for(let leftIndex=0;leftIndex<list.length;leftIndex+=1){
    for(let rightIndex=leftIndex+1;rightIndex<list.length;rightIndex+=1){
      const left=list[leftIndex],right=list[rightIndex];
      if(redundantPair(left.id,right.id))continue;
      const distance=separation(left.value,right.value);
      for(const aspect of aspects){
        const relation=harmonic?.relation?.(left,right,aspect,distance,windowValue);
        if(relation)result.push({...relation,scope});
      }
    }
  }
  return result.sort((a,b)=>a.phaseError-b.phaseError||a.harmonicOrder-b.harmonicOrder||a.orb-b.orb);
}
function coordinate(record){
  const value=norm(record.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);
  return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`};
}
function glyphSlot(role,label){
  const slot=document.createElement('span');slot.className=`sky-foundation-relationship-glyph sky-foundation-relationship-glyph--${role}`;slot.dataset.glyphRole=role;slot.setAttribute('aria-label',label);return slot;
}
function makeRow(relation,index){
  const slot=relation.left.sky,scope=relation.scope,left=coordinate(relation.left),right=coordinate(relation.right),row=document.createElement('button');
  row.type='button';row.className='sky-foundation-relationship-row sky-intrasky-generated';row.dataset.relationshipSelection='true';
  // Keep mode/ownership in data for legacy controllers and accessibility, but do not
  // render A-A/B-B badges: endpoint color already carries the visible ownership.
  row.dataset.relationIndex=`${slot}${slot}-${index}`;row.dataset.relationshipMode=`${slot}-${slot}`;row.dataset.relationScope=scope;
  row.dataset.leftSky=slot;row.dataset.rightSky=slot;row.dataset.aspect=relation.aspect.id;row.dataset.leftPlacement=relation.left.id;row.dataset.rightPlacement=relation.right.id;
  row.dataset.sourceOrb=relation.orb.toFixed(6);row.dataset.harmonicOrder=String(relation.harmonicOrder);row.dataset.harmonicNumerator=String(relation.harmonicNumerator);
  row.dataset.phaseError=relation.phaseError.toFixed(6);row.dataset.signedPhaseError=relation.signedPhaseError.toFixed(6);row.dataset.harmonicWindow=relation.masterWindow.toFixed(6);
  row.dataset.windowFraction=Number.isFinite(relation.windowFraction)?relation.windowFraction.toFixed(6):String(relation.windowFraction);row.dataset.harmonicCoherence=relation.coherence.toFixed(8);
  row.dataset.leftHouse=String(relation.left.house);row.dataset.rightHouse=String(relation.right.house);row.dataset.leftSign=String(left.sign);row.dataset.rightSign=String(right.sign);
  row.setAttribute('aria-label',`Sky ${slot} ${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees, harmonic ${relation.harmonicOrder}, phase error ${relation.phaseError.toFixed(2)} degrees, coherence ${relation.coherencePercent.toFixed(0)} percent`);
  const leftGlyph=glyphSlot('left',relation.left.entry.name),aspectGlyph=glyphSlot('aspect',relation.aspect.id),rightGlyph=glyphSlot('right',relation.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span');
  leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';
  leftCopy.innerHTML=`${esc(relation.left.entry.name)}<small>${left.text} ${esc(SIGN_NAMES[left.sign])} · H${relation.left.house}</small>`;
  rightCopy.innerHTML=`${esc(relation.right.entry.name)}<small>${right.text} ${esc(SIGN_NAMES[right.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>`;
  row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);return row;
}
function annotateInterRows(list){
  list.querySelectorAll(':scope>.sky-foundation-relationship-row:not(.sky-intrasky-generated)').forEach(row=>{
    row.dataset.relationshipMode='A-B';row.dataset.relationScope='inter';row.dataset.leftSky='A';row.dataset.rightSky='B';
  });
}
function sortRows(list){
  const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];
  rows.sort((a,b)=>Number(a.dataset.phaseError||Infinity)-Number(b.dataset.phaseError||Infinity)||Number(a.dataset.harmonicOrder||Infinity)-Number(b.dataset.harmonicOrder||Infinity)||Number(a.dataset.sourceOrb||Infinity)-Number(b.dataset.sourceOrb||Infinity)||String(a.dataset.relationIndex).localeCompare(String(b.dataset.relationIndex)));
  rows.forEach(row=>list.appendChild(row));
}
function updateCount(){
  countQueued=false;
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row')],shown=rows.filter(row=>!row.hidden&&!HIDDEN_CLASSES.some(className=>row.classList.contains(className))&&getComputedStyle(row).display!=='none').length,count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(count){count.textContent=`${shown}/${rows.length}`;count.dataset.total=String(rows.length)}
  if(empty)empty.hidden=shown!==0;
}
function scheduleCount(){if(countQueued)return;countQueued=true;requestAnimationFrame(()=>requestAnimationFrame(updateCount))}
async function repairSlot(row,side){
  const templates=window.RelphiRelationshipGlyphTemplates;if(!templates?.clone)return;
  const sky=row.dataset[`${side}Sky`],color=COLORS[sky];if(!color)return;
  const placement=row.dataset[`${side}Placement`],glyph=row.querySelector(`.sky-foundation-relationship-glyph--${side}`);
  if(glyph&&placement){
    const desired=`${placement}|${color}|plain`;
    if(glyph.dataset.templateKey!==desired||!glyph.firstElementChild){
      const clone=await templates.clone(placement,color);if(clone&&row.isConnected){glyph.dataset.templateKey=desired;glyph.replaceChildren(clone)}
    }
  }
  const signIndex=Number(row.dataset[`${side}Sign`]),sign=SIGNS[signIndex],signSlot=row.querySelector(`.sky-foundation-relationship-placement--${side} .sky-foundation-relationship-sign`);
  if(signSlot&&sign){
    const desired=`${sign}|${color}|plain`;
    if(signSlot.dataset.templateKey!==desired||!signSlot.firstElementChild){
      const clone=await templates.clone(sign,color);if(clone&&row.isConnected){signSlot.dataset.templateKey=desired;signSlot.replaceChildren(clone)}
    }
  }
}
function repairColors(){colorQueued=false;document.querySelectorAll('#skyFoundationRelationshipList .sky-intrasky-generated').forEach(row=>{repairSlot(row,'left');repairSlot(row,'right')})}
function scheduleColors(){if(colorQueued)return;colorQueued=true;requestAnimationFrame(()=>requestAnimationFrame(repairColors))}
function cleanupUnauthorizedScopeUI(){
  document.querySelector('[data-relationship-scope-filter]')?.remove();
  document.querySelectorAll('.sky-chart-scope-hidden').forEach(node=>node.classList.remove('sky-chart-scope-hidden'));
  document.documentElement.removeAttribute('data-sky-relationship-scopes');
}
function referenceRank(text){
  const name=String(text||'').trim().toLowerCase().replace(/\s+/g,' ');
  const map=new Map([
    ['north node',0],['south node',1],
    ['ascendant',2],['asc',2],['rising',2],
    ['descendant',3],['dsc',3],
    ['midheaven',4],['mc',4],
    ['imum coeli',5],['ic',5]
  ]);
  return map.has(name)?map.get(name):-1;
}
function reorderPlacementLedgers(){
  document.querySelectorAll('#skyFoundationA .sky-foundation-ledger,#skyFoundationB .sky-foundation-ledger').forEach(ledger=>{
    const rows=[...ledger.querySelectorAll(':scope>.sky-foundation-row')];
    const references=rows.map((row,index)=>({row,index,rank:referenceRank(row.querySelector('.sky-foundation-row-name')?.textContent)})).filter(entry=>entry.rank>=0);
    references.sort((a,b)=>a.rank-b.rank||a.index-b.index).forEach(entry=>ledger.appendChild(entry.row));
  });
}
function installStyles(){
  if(document.getElementById('skyIntraskyRelationshipsV2Styles'))return;
  const style=document.createElement('style');style.id='skyIntraskyRelationshipsV2Styles';
  style.textContent=`
    #skyFoundationRelationshipList .sky-intrasky-generated[data-left-sky="A"]{--intrasky-color:${COLORS.A}}
    #skyFoundationRelationshipList .sky-intrasky-generated[data-left-sky="B"]{--intrasky-color:${COLORS.B}}
    #skyFoundationRelationshipList .sky-intrasky-generated::after{content:none!important;display:none!important}
  `;
  document.head.appendChild(style);
}
function merge(){
  queued=false;
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||!window.RelphiHarmonicOrb)return;
  installStyles();cleanupUnauthorizedScopeUI();annotateInterRows(list);
  list.querySelectorAll(':scope>.sky-intrasky-generated').forEach(row=>row.remove());
  const a=relationships(prepare('A'),'intra-a'),b=relationships(prepare('B'),'intra-b');
  a.forEach((relation,index)=>list.appendChild(makeRow(relation,index)));
  b.forEach((relation,index)=>list.appendChild(makeRow(relation,index)));
  sortRows(list);scheduleColors();scheduleCount();attachObserver(list);reorderPlacementLedgers();
  document.documentElement.dataset.skyIntraskyRelationships=`A:${a.length};B:${b.length}`;
  window.dispatchEvent(new CustomEvent('relphi:sky-intrasky-relationships-ready',{detail:{A:a.length,B:b.length,total:a.length+b.length}}));
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(merge))}
function attachObserver(list){
  if(listObserver?.__list===list)return;listObserver?.disconnect();
  listObserver=new MutationObserver(records=>{
    let needsColor=false,needsCount=false;
    for(const record of records){
      if(record.type==='attributes'&&record.attributeName==='data-template-key')needsColor=true;
      if(record.type==='attributes'&&['class','hidden'].includes(record.attributeName))needsCount=true;
      if(record.type==='childList'){needsColor=true;needsCount=true}
    }
    if(needsColor)scheduleColors();if(needsCount)scheduleCount();
  });
  listObserver.__list=list;listObserver.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-template-key']});
}
function start(){
  installStyles();cleanupUnauthorizedScopeUI();schedule();reorderPlacementLedgers();
  ['relphi:sky-foundation-interactions-ready','relphi:sky-foundation-ready'].forEach(name=>window.addEventListener(name,()=>{schedule();reorderPlacementLedgers()}));
  ['relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-harmonic-window-visibility-changed','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,scheduleCount));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
