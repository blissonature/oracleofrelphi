// Semantic theme search for Sky Chart Relationships.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipThemesV1)return;
window.__relphiSkyRelationshipThemesV1=true;

const HIDDEN_CLASS='sky-chart-theme-filter-hidden';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_REFERENTS=Object.freeze({
  Aries:'initiative directness courage impulse beginning',
  Taurus:'embodiment value pleasure endurance material continuity',
  Gemini:'writing speech learning information exchange interpretation',
  Cancer:'care protection memory belonging attachment',
  Leo:'radiance creativity pride loyalty recognition',
  Virgo:'discernment service refinement repair usefulness',
  Libra:'relationship balance fairness dialogue mutual recognition',
  Scorpio:'intensity secrecy survival bonding emotional truth',
  Sagittarius:'meaning aspiration worldview philosophy exploration freedom',
  Capricorn:'structure responsibility endurance mastery worldly form',
  Aquarius:'systems reform collective intelligence detachment future orientation',
  Pisces:'surrender imagination compassion permeability release'
});
const HOUSE_REFERENTS=Object.freeze({
  '1':'self embodiment appearance approach immediate entry',
  '2':'resources possessions money values worth',
  '3':'communication learning siblings neighbors local environment',
  '4':'home roots family ancestry privacy foundations',
  '5':'creativity pleasure romance children play self expression',
  '6':'work service routines health maintenance obligations',
  '7':'partnership contracts relationship other agreements',
  '8':'shared resources intimacy debt inheritance vulnerability transformation loss death',
  '9':'worldview religion philosophy higher learning travel meaning',
  '10':'vocation career public standing reputation authority achievement responsibility',
  '11':'friends networks groups alliances hopes participation collective',
  '12':'retreat hidden processes solitude confinement surrender spirituality closure sorrow'
});
const PLACEMENT_NAMES=Object.freeze({
  sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',
  uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',chiron:'Chiron',lilith:'Lilith',
  'asteroid-lilith':'Asteroid Lilith','north-node':'North Node','south-node':'South Node',
  'part-of-fortune':'Part of Fortune',vertex:'Vertex','anti-vertex':'Anti-Vertex',
  asc:'Ascendant',dsc:'Descendant',mc:'MC',ic:'IC',child:'Child',hidalgo:'Hidalgo',victoria:'Victoria',daphne:'Daphne',vesta:'Vesta'
});
const PLACEMENT_REFERENTS=Object.freeze({
  sun:'identity vitality conscious purpose',
  moon:'feelings instincts memory emotional needs care',
  mercury:'thought perception language communication interpretation exchange recoverability',
  venus:'values attraction affection pleasure relating reception',
  mars:'drive assertion desire conflict defense action severance',
  jupiter:'growth confidence meaning opportunity expansion participation',
  saturn:'structure limits responsibility time commitment endurance',
  uranus:'freedom disruption originality awakening change invention',
  neptune:'imagination sensitivity surrender ideals vision permeability release',
  pluto:'power depth compulsion elimination transformation',
  chiron:'wounding healing intelligence guidance',
  asc:'presentation self approach immediate entry',
  dsc:'partnership other encounter relationship',
  mc:'public direction vocation visibility authority achievement',
  ic:'roots home private foundations family belonging',
  'north-node':'growth unfamiliar experience developing capacity',
  'south-node':'familiar inherited patterns known path',
  lilith:'instinctive autonomy refusal exile uncompromised desire',
  'asteroid-lilith':'equality autonomy',
  'part-of-fortune':'body feeling circumstance ease fortune openings',
  vertex:'consequential encounters outside ordinary control',
  'anti-vertex':'back door access reciprocal point',
  child:'children',
  hidalgo:'independence',
  victoria:'victory',
  daphne:'self preservation transformation',
  vesta:'devotion'
});
const ASPECT_NAMES=Object.freeze({
  conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',
  square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'
});
const ASPECT_REFERENTS=Object.freeze({
  conjunction:'union operating together',
  'semi-sextile':'accommodation neighboring functions',
  octile:'focused friction adjustment',
  sextile:'cooperative opening participation opportunity',
  quintile:'creative pattern making specialized skill',
  square:'activating pressure friction development action',
  trine:'low resistance flow exchange',
  'tri-octile':'accumulated friction redirection',
  'bi-quintile':'refined creative pattern making',
  quincunx:'continuing adjustment translation',
  opposition:'polarity contrast exchange awareness'
});
const OTHER_HIDDEN_CLASSES=Object.freeze([
  'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
  'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
  'sky-chart-sign-filter-hidden','sky-chart-zodiac-filter-hidden','sky-chart-semantic-hidden'
]);
let query='',queued=false,observer=null,observedList=null,corpusCache=new WeakMap();

function semantic(){return window.RelphiSemanticSearch}
function normalize(value){return semantic()?.normalize?.(value)??String(value??'').toLowerCase().trim()}
function corpus(){return semantic()?.corpus?.(...arguments)??normalize(Array.from(arguments).join(' '))}
function matches(haystack,needle){
  const api=semantic();
  if(api?.matches)return api.matches(haystack,needle);
  const terms=normalize(needle).split(/\s+/).filter(Boolean);
  return terms.every(term=>normalize(haystack).includes(term));
}
function canonical(value){return String(value||'').trim().toLowerCase().replace(/_/g,'-').replace(/\s+/g,'-')}
function signName(raw){
  const number=Number(raw);
  if(Number.isInteger(number)&&number>=0&&number<12)return SIGNS[number];
  const text=String(raw||'').trim();
  return SIGNS.find(name=>name.toLowerCase()===text.toLowerCase())||text;
}
function placementName(id){const key=canonical(id);return PLACEMENT_NAMES[key]||String(id||'').replace(/[-_]+/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}
function relatedCardSemantic(placementId,sign){
  const cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[];
  const planet=normalize(placementName(placementId)),zodiac=normalize(sign);
  const found=[];
  for(const card of cards){
    const astrology=card?.astrology||{};
    const planetFields=[astrology.planet,astrology.sign_ruler,astrology.decan_ruler].map(normalize);
    const signFields=[astrology.sign,astrology.zodiac_range,astrology.degree_span].map(normalize);
    const planetMatch=planet&&planetFields.some(value=>value===planet);
    const signMatch=zodiac&&signFields.some(value=>value===zodiac||value.includes(zodiac));
    if(!planetMatch&&!signMatch)continue;
    found.push(
      card.name,card.card_type,card.suit,card.element,card.elemental_formula,card.polarity,card.tags,
      astrology,
      card.systems?.golden_dawn_rws?.title,card.systems?.golden_dawn_rws?.notes,
      card.systems?.thoth?.title,card.systems?.thoth?.notes
    );
  }
  return found;
}
function rowSignature(row){
  return[
    row.dataset.leftPlacement,row.dataset.rightPlacement,row.dataset.aspect,row.dataset.leftSign,row.dataset.rightSign,
    row.dataset.leftHouse,row.dataset.rightHouse,row.dataset.leftSky,row.dataset.rightSky,row.dataset.relationshipMode,
    row.querySelector('.sky-foundation-relationship-copy')?.textContent||''
  ].join('|');
}
function rowCorpus(row){
  const signature=rowSignature(row),cached=corpusCache.get(row);
  if(cached?.signature===signature)return cached.value;
  const left=canonical(row.dataset.leftPlacement),right=canonical(row.dataset.rightPlacement),aspect=canonical(row.dataset.aspect);
  const leftSign=signName(row.dataset.leftSign),rightSign=signName(row.dataset.rightSign);
  const leftHouse=String(row.dataset.leftHouse||''),rightHouse=String(row.dataset.rightHouse||'');
  const value=corpus(
    row.textContent,
    row.getAttribute('aria-label'),
    row.dataset.relationshipMode,
    left,placementName(left),PLACEMENT_REFERENTS[left],
    right,placementName(right),PLACEMENT_REFERENTS[right],
    leftSign,SIGN_REFERENTS[leftSign],
    rightSign,SIGN_REFERENTS[rightSign],
    leftHouse&&('House '+leftHouse),HOUSE_REFERENTS[leftHouse],
    rightHouse&&('House '+rightHouse),HOUSE_REFERENTS[rightHouse],
    ASPECT_NAMES[aspect]||aspect,ASPECT_REFERENTS[aspect],
    relatedCardSemantic(left,leftSign),
    relatedCardSemantic(right,rightSign)
  );
  corpusCache.set(row,{signature,value});
  return value;
}
function rowMatches(row){return !query||matches(rowCorpus(row),query)}
function updateDocumentState(){
  const root=document.documentElement;
  root.dataset.skyRelationshipThemeFilter=query?'active':'all';
  if(query)root.dataset.skyRelationshipThemeQuery=query;else delete root.dataset.skyRelationshipThemeQuery;
}
function apply(){
  queued=false;ensureObserver();ensureControl();
  const rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
  rows.forEach(row=>row.classList.toggle(HIDDEN_CLASS,!rowMatches(row)));
  updateDocumentState();
  window.dispatchEvent(new CustomEvent('relphi:sky-theme-filter-changed',{detail:{query,matching:rows.filter(row=>!row.classList.contains(HIDDEN_CLASS)).length,total:rows.length}}));
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
function installStyles(){
  if(document.getElementById('skyRelationshipThemesV1Styles'))return;
  const style=document.createElement('style');style.id='skyRelationshipThemesV1Styles';style.textContent=`
    .${HIDDEN_CLASS}{display:none!important}
    #skyFoundationFocus .sky-chart-theme-filter{display:grid;grid-template-rows:auto var(--sky-filter-height,35px);gap:4px;align-self:end;min-width:0;color:var(--sky-filter-label-color,#4e463f);font:var(--sky-filter-label-font,800 .62rem/1.2 system-ui,sans-serif)}
    #skyFoundationFocus .sky-chart-theme-filter>span{white-space:nowrap}
    #skyFoundationFocus .sky-chart-theme-filter>input{width:100%;min-width:0;height:var(--sky-filter-height,35px);box-sizing:border-box;margin:0;padding:var(--sky-filter-control-padding,.52rem .58rem);border:var(--sky-filter-border,1px solid rgba(31,27,24,.2));border-radius:var(--sky-filter-radius,9px);background:#fff;color:var(--sky-filter-control-color,#191613);font:var(--sky-filter-control-font,700 .68rem/1.2 system-ui,sans-serif)}
    #skyFoundationFocus .sky-chart-theme-filter>input:hover,#skyFoundationFocus .sky-chart-theme-filter>input:focus-visible{border-color:#6b625a;outline:none}
    @media(min-width:621px){#skyFoundationFocus .sky-chart-filter-bar>.sky-chart-theme-filter{grid-column:1/-1!important;grid-row:2!important}}
  `;document.head.appendChild(style);
}
function filterBar(){return document.querySelector('#skyFoundationFocus .sky-chart-filter-bar')||document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar')}
function ensureControl(){
  installStyles();
  const bar=filterBar();if(!bar)return null;
  let field=bar.querySelector('[data-theme-filter="true"]');
  if(field)return field;
  field=document.createElement('label');field.className='sky-chart-theme-filter';field.dataset.themeFilter='true';
  const caption=document.createElement('span');caption.textContent='Themes';
  const input=document.createElement('input');input.type='search';input.autocomplete='off';input.spellcheck=false;input.placeholder='Ex. care authority children';input.dataset.themeSearch='true';input.setAttribute('aria-label','Filter relationships by themes and semantic tags');
  input.addEventListener('input',()=>{query=input.value.trim();schedule()});
  input.addEventListener('search',()=>{query=input.value.trim();schedule()});
  field.append(caption,input);bar.appendChild(field);return field;
}
function ensureObserver(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;corpusCache=new WeakMap();
  observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||(record.type==='attributes'&&record.attributeName!=='class')))schedule();
  });
  observer.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['data-left-placement','data-right-placement','data-aspect','data-left-sign','data-right-sign','data-left-house','data-right-house','data-left-sky','data-right-sky','data-relationship-mode','aria-label']});
}
function setQuery(value){
  query=String(value??'').trim();
  const input=document.querySelector('[data-theme-search="true"]');if(input&&input.value!==query)input.value=query;
  schedule();return query;
}
function clear(){return setQuery('')}
function start(){
  ensureControl();ensureObserver();schedule();
  [
    'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed',
    'relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-harmonic-window-visibility-changed'
  ].forEach(name=>window.addEventListener(name,()=>{ensureControl();ensureObserver();schedule()}));
}
window.RelphiRelationshipThemes=Object.freeze({
  get:()=>query,set:setQuery,clear,corpusFor:rowCorpus,matches:rowMatches,
  get matching(){return[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')].filter(rowMatches)}
});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();