// Inline relationship progressive reveal contract: glyph -> name -> referent.
// Each of the five top-row symbols owns an independent reveal chain.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiInlineProgressiveContractV1)return;
window.__relphiInlineProgressiveContractV1=true;

const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
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
  sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'
};
const ASPECT_NAMES={conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'};
const ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
const FIELDS=[
  ['left-placement','.sky-foundation-relationship-glyph--left'],
  ['left-sign','.sky-foundation-relationship-placement--left .sky-foundation-relationship-sign'],
  ['aspect','.sky-foundation-relationship-glyph--aspect'],
  ['right-placement','.sky-foundation-relationship-glyph--right'],
  ['right-sign','.sky-foundation-relationship-placement--right .sky-foundation-relationship-sign']
];
let fastPointerTarget=null;
let fastPointerAt=0;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function placementName(id){const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);return entry?.name||String(id||'').replace(/-/g,' ')}
function infoFor(row,field){
  if(field==='left-placement'){
    const id=String(row.dataset.leftPlacement||'');return{name:placementName(id),referent:PLACEMENT_REFERENTS[id]||'a calculated placement in Sky A',tone:'a'};
  }
  if(field==='right-placement'){
    const id=String(row.dataset.rightPlacement||'');return{name:placementName(id),referent:PLACEMENT_REFERENTS[id]||'a calculated placement in Sky B',tone:'b'};
  }
  if(field==='left-sign'){
    const name=SIGN_NAMES[Number(row.dataset.leftSign)]||'Sign';return{name,referent:SIGN_REFERENTS[name]||'the zodiacal mode containing the Sky A placement',tone:'a'};
  }
  if(field==='right-sign'){
    const name=SIGN_NAMES[Number(row.dataset.rightSign)]||'Sign';return{name,referent:SIGN_REFERENTS[name]||'the zodiacal mode containing the Sky B placement',tone:'b'};
  }
  const id=String(row.dataset.aspect||'');return{name:ASPECT_NAMES[id]||id,referent:ASPECT_REFERENTS[id]||'a measured relationship between the two placements',tone:'aspect'};
}
function tokenMarkup(row,field){
  const info=infoFor(row,field);
  return `<span class="inline-rel-progressive-token" data-inline-progressive-token="${field}" data-inline-progressive-stage="0" data-tone="${info.tone}" hidden><span class="inline-rel-progressive-level inline-rel-progressive-name" data-inline-progressive-level="name" role="button" tabindex="0" aria-expanded="false">${esc(info.name)}</span><span class="inline-rel-progressive-level inline-rel-progressive-referent" data-inline-progressive-level="referent" role="button" tabindex="0" hidden>${esc(info.referent)}</span></span>`;
}
function stripMarkup(row){
  return `<div class="inline-rel-progressive-strip" aria-label="Progressive symbolic reveal"><div class="inline-rel-progressive-side inline-rel-progressive-side-a">${tokenMarkup(row,'left-placement')}${tokenMarkup(row,'left-sign')}</div>${tokenMarkup(row,'aspect')}<div class="inline-rel-progressive-side inline-rel-progressive-side-b">${tokenMarkup(row,'right-placement')}${tokenMarkup(row,'right-sign')}</div></div>`;
}
function ensureStrip(row){
  if(!row?.classList.contains('is-inline-expanded'))return null;
  const detail=row.querySelector(':scope>.inline-rel-detail');if(!detail)return null;
  detail.querySelector(':scope>.inline-rel-top-reveal')?.remove();
  let strip=detail.querySelector(':scope>.inline-rel-progressive-strip');
  if(!strip){detail.insertAdjacentHTML('afterbegin',stripMarkup(row));strip=detail.querySelector(':scope>.inline-rel-progressive-strip')}
  FIELDS.forEach(([field,selector])=>{
    const glyph=row.querySelector(selector);if(!glyph)return;
    glyph.dataset.inlineProgressiveGlyph=field;
    glyph.setAttribute('title','Reveal name');
    glyph.setAttribute('role','button');
    glyph.setAttribute('tabindex','0');
  });
  return strip;
}
function tokenFor(row,field){return ensureStrip(row)?.querySelector(`[data-inline-progressive-token="${field}"]`)||null}
function setStage(token,stage){
  if(!token)return;
  const next=Math.max(0,Math.min(2,Number(stage)||0));
  const name=token.querySelector('[data-inline-progressive-level="name"]'),referent=token.querySelector('[data-inline-progressive-level="referent"]');
  token.dataset.inlineProgressiveStage=String(next);token.hidden=next===0;
  if(name){name.hidden=next===0;name.setAttribute('aria-expanded',next===2?'true':'false')}
  if(referent)referent.hidden=next<2;
}
function glyphActivate(row,field){
  const token=tokenFor(row,field);if(!token)return;
  const stage=Number(token.dataset.inlineProgressiveStage||0);
  setStage(token,stage===0?1:0);
  if(stage===0)token.querySelector('[data-inline-progressive-level="name"]')?.focus({preventScroll:true});
}
function levelActivate(levelNode){
  const token=levelNode.closest('[data-inline-progressive-token]');if(!token)return;
  const stage=Number(token.dataset.inlineProgressiveStage||0),level=levelNode.dataset.inlineProgressiveLevel;
  if(level==='name'){
    if(stage===1){setStage(token,2);token.querySelector('[data-inline-progressive-level="referent"]')?.focus({preventScroll:true})}
    else if(stage===2){setStage(token,1);levelNode.focus({preventScroll:true})}
  }
}
function expandedRowFor(target){return target?.closest?.('.sky-foundation-relationship-row.is-inline-expanded')||null}
function fieldFromGlyph(target,row){
  const direct=target.closest?.('[data-inline-progressive-glyph]');if(direct?.dataset.inlineProgressiveGlyph)return direct.dataset.inlineProgressiveGlyph;
  for(const [field,selector] of FIELDS){const glyph=target.closest?.(selector);if(glyph&&row.contains(glyph))return field}
  return'';
}
function activateTarget(event){
  const row=expandedRowFor(event.target);if(!row)return null;
  const level=event.target.closest?.('[data-inline-progressive-level]');
  if(level){event.preventDefault();event.stopImmediatePropagation();levelActivate(level);return level}
  const field=fieldFromGlyph(event.target,row);
  if(field){event.preventDefault();event.stopImmediatePropagation();glyphActivate(row,field);return event.target.closest?.('[data-inline-progressive-glyph]')||event.target}
  return null;
}
function handlePointerUp(event){
  if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
  const target=activateTarget(event);if(!target)return;
  fastPointerTarget=target;
  fastPointerAt=performance.now();
}
function handleClick(event){
  if(fastPointerTarget&&performance.now()-fastPointerAt<800){
    const same=event.target===fastPointerTarget||fastPointerTarget.contains?.(event.target)||event.target.contains?.(fastPointerTarget);
    if(same){event.preventDefault();event.stopImmediatePropagation();fastPointerTarget=null;return}
  }
  activateTarget(event);
}
function handleKey(event){
  if(event.key!=='Enter'&&event.key!==' ')return;
  const row=expandedRowFor(event.target);if(!row)return;
  const level=event.target.closest?.('[data-inline-progressive-level]');
  if(level){event.preventDefault();event.stopImmediatePropagation();levelActivate(level);return}
  const field=fieldFromGlyph(event.target,row);if(!field)return;
  event.preventDefault();event.stopImmediatePropagation();glyphActivate(row,field);
}
function installStyles(){
  if(document.getElementById('skyInlineProgressiveContractStyles'))return;
  const style=document.createElement('style');style.id='skyInlineProgressiveContractStyles';style.textContent=`
    .sky-foundation-relationship-row.is-inline-expanded [data-inline-progressive-glyph]{cursor:pointer;border-radius:7px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sky-foundation-relationship-row.is-inline-expanded [data-inline-progressive-glyph]:hover{background:rgba(45,39,34,.055)}
    .sky-foundation-relationship-row.is-inline-expanded [data-inline-progressive-glyph]:focus-visible{outline:2px solid currentColor;outline-offset:2px}
    .inline-rel-progressive-strip{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(86px,.72fr) minmax(0,1fr);align-items:start;gap:8px;min-width:0}
    .inline-rel-progressive-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:5px;min-width:0}
    .inline-rel-progressive-token{display:grid;justify-items:center;gap:4px;min-width:0;padding:4px 5px;border-radius:7px;background:rgba(45,39,34,.04)}
    .inline-rel-progressive-token[data-tone="a"]{border-top:2px solid #c9211e}.inline-rel-progressive-token[data-tone="b"]{border-top:2px solid #2462d0}.inline-rel-progressive-token[data-tone="aspect"]{border-top:2px solid var(--relationship-stripe,#777)}
    .inline-rel-progressive-token[hidden],.inline-rel-progressive-level[hidden]{display:none!important}
    .inline-rel-progressive-level{display:inline-block;max-width:100%;padding:0;border:0;background:transparent;color:#352f2a;cursor:pointer;font-family:system-ui,sans-serif;text-align:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .inline-rel-progressive-name{font-size:.6rem;font-weight:900;line-height:1.15}.inline-rel-progressive-referent{font-size:.55rem;font-weight:680;line-height:1.28;color:#625a53;white-space:normal;overflow-wrap:anywhere}
    .inline-rel-progressive-level:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:3px}
    @media(max-width:620px){.inline-rel-progressive-strip{grid-template-columns:minmax(0,1fr) minmax(68px,.64fr) minmax(0,1fr);gap:4px}.inline-rel-progressive-side{gap:3px}.inline-rel-progressive-token{padding:3px}.inline-rel-progressive-name{font-size:.54rem}.inline-rel-progressive-referent{font-size:.49rem}}
  `;document.head.appendChild(style);
}
function decorateExisting(){document.querySelectorAll('.sky-foundation-relationship-row.is-inline-expanded').forEach(ensureStrip)}
function observeWhenReady(){
  installStyles();
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list)new MutationObserver(()=>requestAnimationFrame(decorateExisting)).observe(list,{childList:true,subtree:true});
  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(decorateExisting));
  requestAnimationFrame(decorateExisting);
}
// Capture ownership is installed immediately, before sky-chart-inline-relationship-v4.js
// registers its expanded-row toggle listener. Touch/pen activate on pointer-up so mobile
// does not wait for the browser's synthesized click; the later click is suppressed.
document.addEventListener('pointerup',handlePointerUp,true);
document.addEventListener('click',handleClick,true);
document.addEventListener('keydown',handleKey,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',observeWhenReady,{once:true}):observeWhenReady();
})();
