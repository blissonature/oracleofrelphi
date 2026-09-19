// Desktop-only Relationships carousel + expanded relationship catalog.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipFilmstripV2)return;
window.__relphiSkyRelationshipFilmstripV1=true;
window.__relphiSkyRelationshipFilmstripV2=true;

const desktopQuery=window.matchMedia('(min-width:901px) and (pointer:fine)');
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_REFERENTS={
  Aries:'initiative, directness, courage, impulse, and beginning',
  Taurus:'embodiment, value, pleasure, endurance, and material continuity',
  Gemini:'language, exchange, curiosity, movement, and multiplicity',
  Cancer:'care, protection, memory, belonging, and attachment',
  Leo:'radiance, creativity, pride, loyalty, and recognition',
  Virgo:'discernment, service, refinement, repair, and usefulness',
  Libra:'relationship, balance, fairness, dialogue, and mutual recognition',
  Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',
  Sagittarius:'meaning, faith, exploration, philosophy, and freedom',
  Capricorn:'structure, responsibility, endurance, mastery, and worldly form',
  Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',
  Pisces:'surrender, imagination, compassion, permeability, and release'
};
const PLACEMENT_REFERENTS={
  sun:'identity, vitality, and conscious purpose',
  moon:'feelings, instincts, memory, and emotional needs',
  mercury:'thought, perception, language, and communication',
  venus:'values, attraction, affection, pleasure, and relating',
  mars:'drive, assertion, desire, conflict, and action',
  jupiter:'growth, confidence, meaning, opportunity, and expansion',
  saturn:'structure, limits, responsibility, time, and commitment',
  uranus:'freedom, disruption, originality, awakening, and change',
  neptune:'imagination, sensitivity, surrender, ideals, and vision',
  pluto:'power, depth, compulsion, elimination, and transformation',
  chiron:'wounding, healing intelligence, and the capacity to guide healing',
  asc:'the way a person enters life and is immediately perceived',
  dsc:'the way a person meets partners and encounters the other',
  mc:'public direction, vocation, visibility, and the role a person grows toward',
  ic:'roots, home, private foundations, and inherited belonging',
  'north-node':'growth through unfamiliar experience and developing capacity',
  'south-node':'familiar patterns, inherited capacity, and the known path',
  lilith:'instinctive autonomy, refusal, exile, and uncompromised desire',
  'part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',
  vertex:'encounters that feel consequential or outside ordinary control'
};
const ASPECT_NAMES={
  conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',
  quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile',
  'bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'
};
const ASPECT_REFERENTS={
  conjunction:'the two functions operate together',
  'semi-sextile':'neighboring functions accommodate one another',
  octile:'focused friction and adjustment',
  sextile:'a cooperative opening activated through participation',
  quintile:'creative pattern-making and specialized skill',
  square:'activating pressure and development',
  trine:'low-resistance exchange',
  'tri-octile':'accumulated friction and redirection',
  'bi-quintile':'refined creative pattern-making',
  quincunx:'continuing adjustment and translation',
  opposition:'awareness through polarity, contrast, and exchange'
};
const DECANS=[
  [['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],
  [['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],
  [['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],
  [['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],
  [['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],
  [['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],
  [['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],
  [['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],
  [['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],
  [['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],
  [['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],
  [['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]
];
const ALIASES={
  rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',
  midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex',
  'north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node',
  'south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'
};

let expanded=false;
let currentKey='';
let wheelAccumulator=0;
let wheelDirection=0;
let lastWheelMoveAt=0;
let reconcileQueued=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=value=>((Number(value)%360)+360)%360;
function panel(){return document.getElementById('skyFoundationRelationships')}
function list(){return document.getElementById('skyFoundationRelationshipList')}
function active(){return desktopQuery.matches}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function source(payload){
  const known=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object');
  const raw=known||payload||{};
  return Array.isArray(raw)?raw.map((item,index)=>[String(item?.name||item?.id||index),item]):Object.entries(raw);
}
function longitude(item){
  if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
  const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());
  if(sign<0)return NaN;
  return norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
}
function canonical(key,item){
  const registry=window.RelphiGlyphRegistry;
  if(!registry)return null;
  for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
    if(candidate==null)continue;
    const raw=String(candidate).trim(),alias=ALIASES[raw.toLowerCase()]||raw;
    const entry=registry.resolve?.(alias)||registry.get?.(alias);
    if(entry)return entry;
  }
  return null;
}
function rowSky(row,side){
  const explicit=String(row?.dataset?.[side==='left'?'leftSky':'rightSky']||'').toUpperCase();
  if(explicit==='A'||explicit==='B')return explicit;
  const mode=String(row?.dataset?.relationshipMode||'A-B').toUpperCase();
  if(mode==='A-A')return'A';
  if(mode==='B-B')return'B';
  return side==='left'?'A':'B';
}
function placementRecord(slot,id){
  for(const [key,item] of source(read(KEYS[slot]))){
    if(!item||typeof item!=='object'||Array.isArray(item))continue;
    const entry=canonical(key,item),value=longitude(item);
    if(entry?.id===id&&Number.isFinite(value))return{slot,id,entry,value};
  }
  return null;
}
function placementName(id){
  const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);
  return entry?.name||String(id||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function positionLabel(record){
  if(!record)return'';
  const value=norm(record.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-7);
  return`${degree}°${String(minute).padStart(2,'0')}′ ${SIGNS[sign]}`;
}
function cardFor(record){
  if(!record)return null;
  const value=norm(record.value),sign=Math.floor(value/30),degree=Math.floor(value-sign*30),decan=Math.min(2,Math.floor(degree/10));
  const [id,title]=DECANS[sign][decan];
  return{id,title,image:`assets/tarot/rws/${id}.webp?v=border-preserving-crop-352`};
}

function rowKey(row){
  if(!row)return'';
  const mode=String(row.dataset.relationshipMode||'A-B').toUpperCase();
  const leftSky=rowSky(row,'left'),rightSky=rowSky(row,'right');
  return[
    mode,leftSky,row.dataset.leftPlacement||'',row.dataset.aspect||'',
    rightSky,row.dataset.rightPlacement||'',row.dataset.sourceOrb||row.dataset.orb||''
  ].join('|');
}
function rowVisible(row){
  if(!row||row.hidden||row.getAttribute('aria-hidden')==='true'||row.style.display==='none')return false;
  return !Array.from(row.classList).some(name=>/hidden$/.test(name));
}
function visibleRows(){
  const l=list();
  return l?Array.from(l.querySelectorAll(':scope>.sky-foundation-relationship-row[data-relation-index]')).filter(rowVisible):[];
}
function findCurrent(rows=visibleRows()){
  const focused=document.activeElement?.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(focused&&rows.includes(focused))return focused;
  if(currentKey){
    const matched=rows.find(row=>rowKey(row)===currentKey);
    if(matched)return matched;
  }
  const aria=rows.find(row=>row.getAttribute('aria-current')==='true');
  return aria||null;
}
function markCurrent(row){
  const l=list();
  if(!l)return;
  l.querySelectorAll(':scope>.sky-foundation-relationship-row.is-filmstrip-current').forEach(node=>{
    if(node!==row)node.classList.remove('is-filmstrip-current');
  });
  if(row){
    row.classList.add('is-filmstrip-current');
    currentKey=rowKey(row);
  }
}
function syncNav(rows=visibleRows(),current=findCurrent(rows)){
  const index=current?rows.indexOf(current):-1;
  const previous=document.getElementById('skyRelationshipFilmstripPrevious');
  const next=document.getElementById('skyRelationshipFilmstripNext');
  if(previous)previous.disabled=index<=0;
  if(next)next.disabled=index<0||index>=rows.length-1;
}
function layoutCarousel(){
  const rows=visibleRows();
  const l=list();
  if(!l)return;
  l.querySelectorAll(':scope>.sky-foundation-relationship-row[data-filmstrip-slot]').forEach(row=>delete row.dataset.filmstripSlot);
  if(expanded){
    syncNav(rows,findCurrent(rows));
    return;
  }
  let current=findCurrent(rows);
  if(!current&&rows.length){
    current=rows[0];
    markCurrent(current);
  }
  if(!current){syncNav(rows,null);return}
  const index=rows.indexOf(current);
  if(index>0)rows[index-1].dataset.filmstripSlot='previous';
  current.dataset.filmstripSlot='current';
  if(index>=0&&index<rows.length-1)rows[index+1].dataset.filmstripSlot='next';
  syncNav(rows,current);
}
function reveal(row){
  if(!row||!expanded)return;
  row.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
}
function selectRow(row,{focus=true}={}){
  if(!row||!rowVisible(row))return false;
  markCurrent(row);
  layoutCarousel();
  if(focus&&document.activeElement!==row)row.focus({preventScroll:true});
  reveal(row);
  return true;
}
function moveSelection(direction,origin){
  const rows=visibleRows();
  if(!rows.length)return false;
  let current=findCurrent(rows);
  if(!current&&origin){
    const candidate=origin.closest?.('.sky-foundation-relationship-row[data-relation-index]');
    if(candidate&&rows.includes(candidate))current=candidate;
  }
  let index=current?rows.indexOf(current):(direction>0?-1:rows.length);
  const nextIndex=Math.max(0,Math.min(rows.length-1,index+direction));
  if(nextIndex===index&&current)return false;
  return selectRow(rows[nextIndex]);
}

function arrowMarkup(direction){
  return `<span class="sky-relationship-filmstrip-arrow sky-relationship-filmstrip-arrow--${direction}" aria-hidden="true"></span>`;
}
function ensureControls(){
  const p=panel();
  if(!p)return;
  let previous=document.getElementById('skyRelationshipFilmstripPrevious');
  if(!previous){
    previous=document.createElement('button');
    previous.id='skyRelationshipFilmstripPrevious';
    previous.type='button';
    previous.className='sky-relationship-filmstrip-nav sky-relationship-filmstrip-nav--previous';
    previous.innerHTML=arrowMarkup('previous');
    previous.setAttribute('aria-label','Previous relationship');
    previous.title='Previous relationship';
    previous.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();moveSelection(-1,event.target)});
    p.appendChild(previous);
  }
  let next=document.getElementById('skyRelationshipFilmstripNext');
  if(!next){
    next=document.createElement('button');
    next.id='skyRelationshipFilmstripNext';
    next.type='button';
    next.className='sky-relationship-filmstrip-nav sky-relationship-filmstrip-nav--next';
    next.innerHTML=arrowMarkup('next');
    next.setAttribute('aria-label','Next relationship');
    next.title='Next relationship';
    next.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();moveSelection(1,event.target)});
    p.appendChild(next);
  }
  let toggle=document.getElementById('skyRelationshipFilmstripToggle');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.id='skyRelationshipFilmstripToggle';
    toggle.type='button';
    toggle.className='sky-relationship-filmstrip-toggle';
    toggle.innerHTML='<span class="sky-relationship-filmstrip-chevron" aria-hidden="true"></span>';
    toggle.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      setExpanded(!expanded,{restoreFocus:true});
    });
    p.appendChild(toggle);
  }
  toggle.setAttribute('aria-expanded',expanded?'true':'false');
  toggle.setAttribute('aria-label',expanded?'Collapse Relationships to carousel':'Expand Relationships list');
  toggle.title=expanded?'Collapse Relationships':'Expand Relationships';
  syncNav();
}

function richSideMarkup(row,side){
  const id=String(row.dataset[side==='left'?'leftPlacement':'rightPlacement']||'');
  const sky=rowSky(row,side);
  const signIndex=Number(row.dataset[side==='left'?'leftSign':'rightSign']);
  const house=Number(row.dataset[side==='left'?'leftHouse':'rightHouse']);
  const sign=SIGNS[signIndex]||'';
  const record=placementRecord(sky,id);
  const card=cardFor(record);
  const name=placementName(id);
  const placementReferent=PLACEMENT_REFERENTS[id]||`a calculated placement in Sky ${sky}`;
  const meta=[`Sky ${sky}`,positionLabel(record),Number.isFinite(house)&&house>0?`House ${house}`:'' ].filter(Boolean).join(' · ');
  return `<section class="sky-filmstrip-rich-side is-sky-${sky.toLowerCase()}">
    ${card?`<figure class="sky-filmstrip-rich-card"><img src="${esc(card.image)}" alt="${esc(card.title)} card art" loading="lazy" decoding="async" fetchpriority="low"><figcaption>${esc(card.title)}</figcaption></figure>`:''}
    <div class="sky-filmstrip-rich-copy">
      <small>${esc(meta)}</small>
      <strong>${esc(name)}</strong>
      <p>${esc(placementReferent)}</p>
      ${sign?`<div class="sky-filmstrip-rich-sign"><b>${esc(sign)}</b><span>${esc(SIGN_REFERENTS[sign]||'')}</span></div>`:''}
    </div>
  </section>`;
}
function ensureRichDetail(row){
  if(!row||row.querySelector(':scope>.sky-filmstrip-expanded-detail'))return;
  const aspectId=String(row.dataset.aspect||'');
  const aspectName=ASPECT_NAMES[aspectId]||aspectId;
  const aspectReferent=ASPECT_REFERENTS[aspectId]||'a measured relationship between the two placements';
  const orb=Number(row.dataset.sourceOrb||row.dataset.orb||0);
  const detail=document.createElement('div');
  detail.className='sky-filmstrip-expanded-detail';
  detail.innerHTML=`${richSideMarkup(row,'left')}
    <section class="sky-filmstrip-rich-aspect">
      <strong>${esc(aspectName)}</strong>
      <p>${esc(aspectReferent)}</p>
      <small>${Number.isFinite(orb)?esc(orb.toFixed(2)+'° orb'):''}</small>
    </section>
    ${richSideMarkup(row,'right')}`;
  row.appendChild(detail);
}
function hydrateExpanded(){
  if(!expanded)return;
  visibleRows().forEach(ensureRichDetail);
}

function setExpanded(value,{restoreFocus=false}={}){
  expanded=!!value;
  const p=panel();
  if(p)p.dataset.filmstripExpanded=expanded?'true':'false';
  ensureControls();
  if(!active())return;
  if(expanded)hydrateExpanded();
  requestAnimationFrame(()=>{
    const rows=visibleRows();
    const selected=findCurrent(rows)||rows[0]||null;
    if(selected){
      markCurrent(selected);
      layoutCarousel();
      if(restoreFocus)selected.focus({preventScroll:true});
      reveal(selected);
    }else layoutCarousel();
  });
}
function mountDesktop(){
  const p=panel();
  if(!p)return false;
  document.documentElement.dataset.skyRelationshipFilmstrip='true';
  p.dataset.filmstripExpanded=expanded?'true':'false';
  ensureControls();
  bindList();
  if(expanded)hydrateExpanded();
  layoutCarousel();
  return true;
}
function unmountDesktop(){
  const p=panel();
  document.documentElement.removeAttribute('data-sky-relationship-filmstrip');
  if(p){
    p.removeAttribute('data-filmstrip-expanded');
    p.querySelectorAll('.is-filmstrip-current').forEach(row=>row.classList.remove('is-filmstrip-current'));
    p.querySelectorAll('[data-filmstrip-slot]').forEach(row=>delete row.dataset.filmstripSlot);
    ['skyRelationshipFilmstripPrevious','skyRelationshipFilmstripNext','skyRelationshipFilmstripToggle'].forEach(id=>document.getElementById(id)?.remove());
  }
  window.dispatchEvent(new CustomEvent('relphi:sky-relationship-filmstrip-mode-changed',{detail:{active:false}}));
}
function applyMode(){
  if(active()){
    if(mountDesktop())window.dispatchEvent(new CustomEvent('relphi:sky-relationship-filmstrip-mode-changed',{detail:{active:true,expanded}}));
  }else unmountDesktop();
}

function onWheel(event){
  if(!active()||!event.target.closest?.('#skyFoundationRelationshipList'))return;
  if(event.ctrlKey||event.metaKey)return;
  const delta=Math.abs(event.deltaY)>=Math.abs(event.deltaX)?event.deltaY:event.deltaX;
  if(!delta)return;
  event.preventDefault();
  const direction=delta>0?1:-1;
  if(direction!==wheelDirection){
    wheelDirection=direction;
    wheelAccumulator=0;
  }
  wheelAccumulator+=Math.abs(delta);
  const now=performance.now();
  const threshold=event.deltaMode===1?1:34;
  if(wheelAccumulator<threshold||now-lastWheelMoveAt<62)return;
  wheelAccumulator=0;
  lastWheelMoveAt=now;
  moveSelection(direction,event.target);
}
function onKeydown(event){
  if(!active())return;
  const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(!row||!list()?.contains(row))return;
  let direction=0;
  if(!expanded&&event.key==='ArrowLeft')direction=-1;
  else if(!expanded&&event.key==='ArrowRight')direction=1;
  else if(expanded&&event.key==='ArrowUp')direction=-1;
  else if(expanded&&event.key==='ArrowDown')direction=1;
  if(!direction)return;
  event.preventDefault();
  event.stopPropagation();
  moveSelection(direction,row);
}
function onFocusin(event){
  const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(row&&list()?.contains(row)){
    markCurrent(row);
    layoutCarousel();
  }
}
function onClick(event){
  if(!active()||expanded)return;
  const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
  if(!row||!list()?.contains(row))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  selectRow(row);
}
function bindList(){
  const l=list();
  if(!l||l.dataset.relationshipFilmstripBound==='true')return;
  l.dataset.relationshipFilmstripBound='true';
  l.addEventListener('wheel',onWheel,{passive:false});
  l.addEventListener('keydown',onKeydown);
  l.addEventListener('focusin',onFocusin);
  l.addEventListener('click',onClick,true);
}
function reconcile(){
  reconcileQueued=false;
  applyMode();
  if(!active())return;
  const rows=visibleRows();
  if(currentKey&&!rows.some(row=>rowKey(row)===currentKey))currentKey='';
  const selected=findCurrent(rows);
  if(selected)markCurrent(selected);
  else if(rows.length)markCurrent(rows[0]);
  if(expanded)hydrateExpanded();
  layoutCarousel();
}
function schedule(){
  if(reconcileQueued)return;
  reconcileQueued=true;
  requestAnimationFrame(reconcile);
}
function start(){
  schedule();
  desktopQuery.addEventListener?.('change',schedule);
  [
    'relphi:sky-foundation-ready',
    'relphi:sky-foundation-interactions-ready',
    'relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready',
    'relphi:sky-aspect-multiselect-changed',
    'relphi:sky-placement-multiselect-changed',
    'relphi:sky-house-multiselect-changed',
    'relphi:sky-zodiac-filter-changed',
    'relphi:sky-harmonic-window-visibility-changed'
  ].forEach(name=>window.addEventListener(name,schedule));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
