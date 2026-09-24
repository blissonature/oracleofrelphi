// Experimental Relationships × Vocab surface.
// Keeps relationship-specific expansion, cards, and mini-wheel, but makes the
// collapsed surface read like Vocab: glyph/name/referent layers, progressive
// reveal, and temporary wheel context from each token.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipVocabFusionV1)return;
window.__relphiRelationshipVocabFusionV1=true;

const STYLE_ID='skyRelationshipVocabFusionV1Styles';
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
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
  vertex:'encounters that feel consequential or outside ordinary control',
  'anti-vertex':'what becomes accessible through the back door'
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
const COLORS={A:'#c9211e',B:'#2462d0'};
let observer=null,observedList=null,queued=false,activeToken=null,previewToken=null;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion{
  position:relative!important;
  display:block!important;
  min-height:0!important;
  height:auto!important;
  padding:.5rem .72rem .48rem .86rem!important;
  border-radius:0!important;
  overflow:visible!important;
  contain:none!important;
  background:#fffdf8!important;
  text-align:left!important;
}
#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion:hover{
  background:#faf6f0!important;
}
#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion::before{
  width:4px!important;
}
#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion>
  :is(.sky-foundation-relationship-placement,.sky-foundation-relationship-glyph--aspect,.sky-foundation-relationship-orb){
  display:none!important;
}
.sky-rel-vocab-line{
  display:block!important;
  width:100%!important;
  min-width:0!important;
  color:#27211d!important;
  font:650 .78rem/1.62 system-ui,sans-serif!important;
  white-space:normal!important;
}
.sky-rel-vocab-token{
  --rel-token-color:#777;
  position:relative;
  display:inline;
  margin:0 .08rem;
  padding:.12rem .2rem .14rem;
  border-radius:5px;
  color:#27211d;
  cursor:pointer;
  box-decoration-break:clone;
  -webkit-box-decoration-break:clone;
}
.sky-rel-vocab-token:hover,.sky-rel-vocab-token:focus-visible,.sky-rel-vocab-token.is-wheel-active{
  background:color-mix(in srgb,var(--rel-token-color) 10%,transparent);
  outline:none;
}
.sky-rel-vocab-token.is-wheel-active{
  box-shadow:inset 0 -2px 0 var(--rel-token-color);
}
.sky-rel-vocab-anchor{
  display:inline-block;
  width:.38rem;
  height:.38rem;
  margin:0 .26rem .08rem 0;
  border-radius:50%;
  background:var(--rel-token-color);
  vertical-align:middle;
}
.sky-rel-vocab-owner{
  display:inline-block;
  margin-right:.18rem;
  color:var(--rel-token-color);
  font:900 .56rem/1 system-ui,sans-serif;
  letter-spacing:.05em;
  vertical-align:.15em;
}
.sky-rel-vocab-glyph{
  display:inline-grid;
  place-items:center;
  width:1.42rem;
  height:1.42rem;
  margin:0 .18rem -.38rem 0;
  vertical-align:baseline;
  color:var(--rel-token-color);
}
.sky-rel-vocab-glyph svg{
  display:block!important;
  width:1.42rem!important;
  height:1.42rem!important;
  overflow:visible!important;
}
.sky-rel-vocab-name{
  color:#201b18;
  font-weight:880;
}
.sky-rel-vocab-context{
  margin-left:.22rem;
  color:#70665e;
  font-size:.69rem;
  font-weight:700;
  font-variant-numeric:tabular-nums;
}
.sky-rel-vocab-referent{
  margin-left:.24rem;
  color:#756a62;
  font-weight:560;
}
.sky-rel-vocab-referent::before{content:"— "}
.sky-rel-vocab-separator{
  color:#aaa098;
  padding:0 .08rem;
  user-select:none;
}
.sky-rel-vocab-orb{
  display:inline-block;
  margin-left:.34rem;
  color:var(--relationship-stripe,#777);
  font:850 .63rem/1 system-ui,sans-serif;
  font-variant-numeric:tabular-nums;
  white-space:nowrap;
}
.sky-rel-vocab-hint{
  display:block;
  margin-top:.18rem;
  color:#978c83;
  font:650 .56rem/1.2 system-ui,sans-serif;
  letter-spacing:.01em;
}
#skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion.is-inline-expanded>.sky-rel-vocab-hint{
  display:none!important;
}
@media(max-width:620px){
  #skyFoundationRelationshipList>.sky-foundation-relationship-row.is-rel-vocab-fusion{
    padding:.48rem .55rem .46rem .78rem!important;
  }
  .sky-rel-vocab-line{font-size:.75rem!important;line-height:1.68!important}
  .sky-rel-vocab-context{font-size:.66rem}
  .sky-rel-vocab-referent{font-size:.72rem}
}
`;
  document.head.appendChild(style);
}

function displayState(){
  const api=window.RelphiSkyRelationshipDisplay;
  if(api?.getState)return api.getState();
  try{
    const parsed=JSON.parse(localStorage.getItem('relphiSkyVocabDisplayV1')||'{}');
    return{glyphs:parsed.glyphs!==false,names:parsed.names!==false,referents:parsed.referents!==false};
  }catch(_){return{glyphs:true,names:true,referents:true}}
}
function sideSky(row,side){
  const explicit=String(row.dataset[side==='left'?'leftSky':'rightSky']||'').toUpperCase();
  if(explicit==='A'||explicit==='B')return explicit;
  const mode=String(row.dataset.relationshipMode||'A-B').toUpperCase();
  if(mode==='A-A')return'A';
  if(mode==='B-B')return'B';
  return side==='left'?'A':'B';
}
function placementName(id){
  const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);
  return entry?.name||String(id||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function coordinate(row,side){
  const group=row.querySelector('.sky-foundation-relationship-placement--'+side);
  const small=group?.querySelector('.sky-foundation-relationship-copy small');
  const stored=String(small?.dataset?.relationshipCoordinate||'').trim();
  if(stored)return stored;
  const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);
  return match?.[0]||'';
}
function relationshipIdentity(row){
  const ls=sideSky(row,'left'),rs=sideSky(row,'right');
  const left=String(row.dataset.leftPlacement||''),aspect=String(row.dataset.aspect||''),right=String(row.dataset.rightPlacement||'');
  return left&&aspect&&right?`${ls}:${left}|${aspect}|${rs}:${right}`:'';
}
function tokenInfo(row,role){
  if(role==='aspect'){
    const id=String(row.dataset.aspect||'');
    const templates=window.RelphiRelationshipGlyphTemplates;
    return{
      role,id,name:ASPECT_NAMES[id]||id,
      referent:ASPECT_REFERENTS[id]||'a measured relationship between the two placements',
      color:templates?.colors?.aspects?.[id]||getComputedStyle(row).getPropertyValue('--relationship-stripe').trim()||'#777',
      owner:'',
      context:'',
      spec:{kind:'aspect',value:relationshipIdentity(row),source:'Relationships',label:ASPECT_NAMES[id]||id}
    };
  }
  const left=role==='left',id=String(row.dataset[left?'leftPlacement':'rightPlacement']||''),sky=sideSky(row,role);
  const sign=SIGNS[Number(row.dataset[left?'leftSign':'rightSign'])]||'',house=Number(row.dataset[left?'leftHouse':'rightHouse']),coord=coordinate(row,role);
  const context=[sign&&(`in ${sign}${coord?' '+coord:''}`),Number.isInteger(house)&&house>=1&&house<=12?`H${house}`:''].filter(Boolean).join(' · ');
  return{
    role,id,name:placementName(id),referent:PLACEMENT_REFERENTS[id]||`a calculated placement in Sky ${sky}`,
    color:COLORS[sky]||'#777',owner:sky,context,
    spec:{kind:'placement',sky,value:id,source:'Relationships',label:placementName(id)}
  };
}
function makeSpan(cls,text=''){const span=document.createElement('span');span.className=cls;if(text)span.textContent=text;return span}
async function paintGlyph(token,info){
  const host=token.querySelector('.sky-rel-vocab-glyph');
  if(!host||host.dataset.glyphId===info.id&&host.firstElementChild)return;
  const templates=window.RelphiRelationshipGlyphTemplates;
  if(!templates?.clone){setTimeout(()=>paintGlyph(token,info),120);return}
  host.dataset.glyphId=info.id;
  const svg=await templates.clone(info.id,info.color);
  if(!token.isConnected||host.dataset.glyphId!==info.id)return;
  if(svg)host.replaceChildren(svg);
}
function createToken(row,role){
  const info=tokenInfo(row,role),token=makeSpan('sky-rel-vocab-token sky-rel-vocab-token--'+role);
  token.dataset.relVocabToken=role;token.dataset.localStage='0';token.tabIndex=0;
  token.style.setProperty('--rel-token-color',info.color);
  token.setAttribute('role','button');
  token.setAttribute('aria-label',`${info.owner?`Sky ${info.owner} `:''}${info.name}. Tap to reveal more and isolate on the wheel.`);
  token._relphiSpec=info.spec;

  token.appendChild(makeSpan('sky-rel-vocab-anchor'));
  if(info.owner)token.appendChild(makeSpan('sky-rel-vocab-owner',info.owner));
  token.appendChild(makeSpan('sky-rel-vocab-glyph'));
  token.appendChild(makeSpan('sky-rel-vocab-name',info.name));
  if(info.context)token.appendChild(makeSpan('sky-rel-vocab-context',info.context));
  token.appendChild(makeSpan('sky-rel-vocab-referent',info.referent));
  paintGlyph(token,info);
  return token;
}
function layerNodes(token){return{
  glyph:token.querySelector('.sky-rel-vocab-glyph'),
  name:token.querySelector('.sky-rel-vocab-name'),
  context:token.querySelector('.sky-rel-vocab-context'),
  referent:token.querySelector('.sky-rel-vocab-referent')
}}
function missingLayers(state){return['glyphs','names','referents'].filter(key=>!state[key])}
function applyTokenDisplay(token,state=displayState()){
  const nodes=layerNodes(token),missing=missingLayers(state),stage=Math.min(Number(token.dataset.localStage)||0,missing.length),local=new Set(missing.slice(0,stage));
  if(nodes.glyph)nodes.glyph.hidden=!(state.glyphs||local.has('glyphs'));
  const namesVisible=state.names||local.has('names');
  if(nodes.name)nodes.name.hidden=!namesVisible;
  if(nodes.context)nodes.context.hidden=!namesVisible;
  if(nodes.referent)nodes.referent.hidden=!(state.referents||local.has('referents'));
  token.dataset.localStage=String(stage);
}
function applyDisplay(root=document){
  const state=displayState();
  root.querySelectorAll?.('[data-rel-vocab-token]').forEach(token=>applyTokenDisplay(token,state));
}
function progressive(token){
  const state=displayState(),missing=missingLayers(state);
  if(!missing.length)return;
  const current=Number(token.dataset.localStage)||0;
  token.dataset.localStage=String(current>=missing.length?0:current+1);
  applyTokenDisplay(token,state);
}
function clearActiveClass(){
  activeToken?.classList.remove('is-wheel-active');
  previewToken?.classList.remove('is-wheel-preview');
  activeToken=null;previewToken=null;
}
function preview(token){
  if(activeToken||!token?._relphiSpec)return;
  window.RelphiSkyFoundationInteractions?.previewWheel?.(token._relphiSpec);
  previewToken?.classList.remove('is-wheel-preview');
  previewToken=token;token.classList.add('is-wheel-preview');
}
function clearPreview(token){
  if(activeToken||previewToken!==token)return;
  window.RelphiSkyFoundationInteractions?.clearWheelPreview?.();
  token.classList.remove('is-wheel-preview');previewToken=null;
}
function toggleWheel(token){
  const api=window.RelphiSkyFoundationInteractions;if(!api?.toggleWheel||!token?._relphiSpec)return;
  previewToken?.classList.remove('is-wheel-preview');previewToken=null;
  if(activeToken&&activeToken!==token)activeToken.classList.remove('is-wheel-active');
  const active=api.toggleWheel(token._relphiSpec);
  if(active){activeToken=token;token.classList.add('is-wheel-active')}
  else{token.classList.remove('is-wheel-active');if(activeToken===token)activeToken=null}
}
function decorateRow(row){
  if(!(row instanceof HTMLElement)||!row.matches('.sky-foundation-relationship-row[data-relation-index]'))return;
  let line=row.querySelector(':scope>.sky-rel-vocab-line');
  if(line){applyDisplay(row);return}
  line=makeSpan('sky-rel-vocab-line');
  line.setAttribute('aria-label','Relationship vocabulary');
  line.append(
    createToken(row,'left'),
    makeSpan('sky-rel-vocab-separator',' '),
    createToken(row,'aspect'),
    makeSpan('sky-rel-vocab-separator',' '),
    createToken(row,'right')
  );
  const orb=Number(row.dataset.sourceOrb);
  if(Number.isFinite(orb))line.appendChild(makeSpan('sky-rel-vocab-orb',orb.toFixed(2)+'°'));
  const hint=makeSpan('sky-rel-vocab-hint','Tap a word or glyph to isolate it on the wheel · tap the row for cards and isolated geometry');
  row.insertBefore(line,row.firstChild);
  row.insertBefore(hint,line.nextSibling);
  row.classList.add('is-rel-vocab-fusion');
  applyDisplay(row);
}
function decorateAll(){
  queued=false;
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return;
  list.querySelectorAll(':scope>.sky-foundation-relationship-row[data-relation-index]').forEach(decorateRow);
}
function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(decorateAll));
}
function bindList(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;
  observer=new MutationObserver(records=>{
    if(records.some(record=>[...record.addedNodes].some(node=>node.nodeType===1&&node.matches?.('.sky-foundation-relationship-row'))))schedule();
  });
  observer.observe(list,{childList:true,subtree:false});

  list.addEventListener('click',event=>{
    const token=event.target.closest?.('[data-rel-vocab-token]');if(!token||!list.contains(token))return;
    event.preventDefault();event.stopPropagation();
    progressive(token);toggleWheel(token);
  });
  list.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const token=event.target.closest?.('[data-rel-vocab-token]');if(!token||!list.contains(token))return;
    event.preventDefault();event.stopPropagation();
    progressive(token);toggleWheel(token);
  });
  list.addEventListener('pointerover',event=>{
    if(event.pointerType==='touch')return;
    const token=event.target.closest?.('[data-rel-vocab-token]');if(token&&list.contains(token)&&!token.contains(event.relatedTarget))preview(token);
  });
  list.addEventListener('pointerout',event=>{
    if(event.pointerType==='touch')return;
    const token=event.target.closest?.('[data-rel-vocab-token]');if(token&&list.contains(token)&&!token.contains(event.relatedTarget))clearPreview(token);
  });
  list.addEventListener('focusin',event=>{const token=event.target.closest?.('[data-rel-vocab-token]');if(token&&list.contains(token))preview(token)});
  list.addEventListener('focusout',event=>{const token=event.target.closest?.('[data-rel-vocab-token]');if(token&&list.contains(token)&&!token.contains(event.relatedTarget))clearPreview(token)});
}
function clearFromBlank(event){
  if(!activeToken&&!previewToken)return;
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(target.closest('[data-rel-vocab-token]'))return;
  if(target.closest('button,input,select,textarea,a,label,summary,details,.sky-foundation-relationship-row,.sky-foundation-relationships-heading,.sky-chart-filter-bar'))return;
  if(!target.closest('#skyFoundationWheelMount,#skyFoundationA,#skyFoundationB,#skyFoundationComparison'))return;
  clearActiveClass();
}
function start(){
  installStyles();bindList();schedule();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,()=>{bindList();schedule()}));
  ['relphi:sky-display-changed','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,()=>applyDisplay(document.getElementById('skyFoundationRelationshipList')||document)));
  window.addEventListener('relphi:sky-foundation-clear-selection',clearActiveClass);
  document.addEventListener('click',clearFromBlank,false);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
