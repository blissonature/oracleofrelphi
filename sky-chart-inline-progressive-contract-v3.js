// Inline relationship progressive reveal v3: seven fixed-address chains with houses in the top row.
// placement -> sign -> house -> aspect -> placement -> sign -> house
// Base glyph/label reveals name; name reveals referent; clicking a lower level collapses to it.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiInlineProgressiveContractV3)return;
window.__relphiInlineProgressiveContractV3=true;
window.__relphiInlineProgressiveContractV2=true;
window.__relphiInlineProgressiveContractV1=true;

const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_REFERENTS={Aries:'initiative, directness, courage, impulse, and beginning',Taurus:'embodiment, value, pleasure, endurance, and material continuity',Gemini:'language, exchange, curiosity, movement, and multiplicity',Cancer:'care, protection, memory, belonging, and attachment',Leo:'radiance, creativity, pride, loyalty, and recognition',Virgo:'discernment, service, refinement, repair, and usefulness',Libra:'relationship, balance, fairness, dialogue, and mutual recognition',Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',Sagittarius:'meaning, faith, exploration, philosophy, and freedom',Capricorn:'structure, responsibility, endurance, mastery, and worldly form',Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',Pisces:'surrender, imagination, compassion, permeability, and release'};
const PLACEMENT_REFERENTS={sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'};
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_REFERENTS=['','self, embodiment, appearance, approach, and the immediate way life is entered','resources, possessions, money, personal values, and what is held as one’s own','communication, learning, siblings, neighbors, short journeys, and the local environment','home, roots, family, ancestry, privacy, and the foundations of life','creativity, pleasure, romance, children, play, and personal self-expression','work, service, routines, health practices, maintenance, and practical obligations','partnership, contracts, one-to-one relationship, and encounters with the other','shared resources, intimacy, debt, inheritance, vulnerability, and transformation','worldview, religion, philosophy, higher learning, long journeys, and the search for meaning','vocation, public standing, reputation, authority, achievement, and visible responsibility','friends, networks, groups, alliances, hopes, and participation in a larger collective','retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'];
const HOUSE_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const ASPECT_NAMES={conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'};
const ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
const GLYPH_FIELDS=[['left-placement','.sky-foundation-relationship-glyph--left'],['left-sign','.sky-foundation-relationship-placement--left .sky-foundation-relationship-sign'],['aspect','.sky-foundation-relationship-glyph--aspect'],['right-placement','.sky-foundation-relationship-glyph--right'],['right-sign','.sky-foundation-relationship-placement--right .sky-foundation-relationship-sign']];
let observer=null,observedList=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function placementName(id){const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);return entry?.name||String(id||'').replace(/-/g,' ')}
function houseNumber(row,side){const n=Number(row.dataset[side==='left'?'leftHouse':'rightHouse']);return Number.isFinite(n)&&n>=1&&n<=12?n:0}
function houseInk(hex){const value=String(hex||'').replace('#','');if(value.length!==6)return'#fff';const r=parseInt(value.slice(0,2),16),g=parseInt(value.slice(2,4),16),b=parseInt(value.slice(4,6),16),luma=.299*r+.587*g+.114*b;return luma>160?'#211d1a':'#fff'}
function infoFor(row,field){
  if(field==='left-placement'){const id=String(row.dataset.leftPlacement||'');return{name:placementName(id),referent:PLACEMENT_REFERENTS[id]||'a calculated placement in Sky A',tone:'a'}}
  if(field==='right-placement'){const id=String(row.dataset.rightPlacement||'');return{name:placementName(id),referent:PLACEMENT_REFERENTS[id]||'a calculated placement in Sky B',tone:'b'}}
  if(field==='left-sign'){const name=SIGN_NAMES[Number(row.dataset.leftSign)]||'Sign';return{name,referent:SIGN_REFERENTS[name]||'the zodiacal mode containing the Sky A placement',tone:'a'}}
  if(field==='right-sign'){const name=SIGN_NAMES[Number(row.dataset.rightSign)]||'Sign';return{name,referent:SIGN_REFERENTS[name]||'the zodiacal mode containing the Sky B placement',tone:'b'}}
  if(field==='left-house'){const n=houseNumber(row,'left');return{name:HOUSE_NAMES[n]||'House',referent:HOUSE_REFERENTS[n]||'the house occupied by the Sky A placement',tone:'a'}}
  if(field==='right-house'){const n=houseNumber(row,'right');return{name:HOUSE_NAMES[n]||'House',referent:HOUSE_REFERENTS[n]||'the house occupied by the Sky B placement',tone:'b'}}
  const id=String(row.dataset.aspect||'');return{name:ASPECT_NAMES[id]||id,referent:ASPECT_REFERENTS[id]||'a measured relationship between the two placements',tone:'aspect'};
}
function tokenMarkup(row,field){const info=infoFor(row,field);return `<span class="inline-rel-progressive-token" data-inline-progressive-token="${field}" data-inline-progressive-stage="0" data-tone="${info.tone}" hidden><span class="inline-rel-progressive-level inline-rel-progressive-name" data-inline-progressive-level="name">${esc(info.name)}</span><span class="inline-rel-progressive-level inline-rel-progressive-referent" data-inline-progressive-level="referent" hidden>${esc(info.referent)}</span></span>`}
function stripMarkup(row){return `<div class="inline-rel-progressive-strip" aria-label="Progressive symbolic reveal"><div class="inline-rel-progressive-side inline-rel-progressive-side-a">${tokenMarkup(row,'left-placement')}${tokenMarkup(row,'left-sign')}${tokenMarkup(row,'left-house')}</div>${tokenMarkup(row,'aspect')}<div class="inline-rel-progressive-side inline-rel-progressive-side-b">${tokenMarkup(row,'right-placement')}${tokenMarkup(row,'right-sign')}${tokenMarkup(row,'right-house')}</div></div>`}
function coordinateText(small){const stored=String(small?.dataset?.relationshipCoordinate||'').trim();if(stored)return stored;const match=String(small?.textContent||'').match(/\d{1,2}°\d{2}′/);return match?.[0]||String(small?.textContent||'').split('·')[0].trim()}
function decorateTopHouseTrigger(row,side){
  const group=row.querySelector(`.sky-foundation-relationship-placement--${side}`),small=group?.querySelector('.sky-foundation-relationship-copy small'),house=houseNumber(row,side);if(!small||!house)return;
  const field=`${side}-house`,color=HOUSE_COLORS[house-1]||'#777',ink=houseInk(color),existing=small.querySelector(`[data-inline-progressive-glyph="${field}"]`);
  if(existing){small.classList.add('has-inline-house-trigger');existing.style.setProperty('--house-color',color);existing.style.setProperty('--house-ink',ink);return}
  const coordinate=coordinateText(small);small.dataset.relationshipCoordinate=coordinate;small.replaceChildren(document.createTextNode(coordinate+' '));
  const trigger=document.createElement('span');trigger.className='inline-rel-house-trigger';trigger.dataset.inlineProgressiveGlyph=field;trigger.setAttribute('aria-label',`${HOUSE_NAMES[house]}, house ${house}`);trigger.setAttribute('title',HOUSE_NAMES[house]);trigger.style.setProperty('--house-color',color);trigger.style.setProperty('--house-ink',ink);trigger.textContent=String(house);small.appendChild(trigger);small.classList.add('has-inline-house-trigger');
}
function ensureStrip(row){
  if(!row)return null;
  decorateTopHouseTrigger(row,'left');decorateTopHouseTrigger(row,'right');
  if(!row.classList.contains('is-inline-expanded'))return null;
  const detail=row.querySelector(':scope>.inline-rel-detail');if(!detail)return null;
  detail.querySelector(':scope>.inline-rel-top-reveal')?.remove();
  detail.querySelector(':scope>.inline-rel-house-context')?.remove();
  let strip=detail.querySelector(':scope>.inline-rel-progressive-strip');if(!strip){detail.insertAdjacentHTML('afterbegin',stripMarkup(row));strip=detail.querySelector(':scope>.inline-rel-progressive-strip')}
  GLYPH_FIELDS.forEach(([field,selector])=>{const glyph=row.querySelector(selector);if(!glyph)return;glyph.dataset.inlineProgressiveGlyph=field;glyph.setAttribute('title','Reveal name')});
  return strip;
}
function tokenFor(row,field){return ensureStrip(row)?.querySelector(`[data-inline-progressive-token="${field}"]`)||null}
function setStage(token,stage){if(!token)return;const next=Math.max(0,Math.min(2,Number(stage)||0)),name=token.querySelector('[data-inline-progressive-level="name"]'),referent=token.querySelector('[data-inline-progressive-level="referent"]');token.dataset.inlineProgressiveStage=String(next);token.hidden=next===0;if(name)name.hidden=next===0;if(referent)referent.hidden=next<2}
function baseActivate(row,field){const token=tokenFor(row,field);if(!token)return;const stage=Number(token.dataset.inlineProgressiveStage||0);setStage(token,stage===0?1:0)}
function levelActivate(levelNode){const token=levelNode.closest('[data-inline-progressive-token]');if(!token)return;const stage=Number(token.dataset.inlineProgressiveStage||0),level=levelNode.dataset.inlineProgressiveLevel;if(level==='name'){if(stage===1)setStage(token,2);else if(stage===2)setStage(token,1)}else if(level==='referent'&&stage===2)setStage(token,2)}
function expandedRowFor(target){return target?.closest?.('.sky-foundation-relationship-row.is-inline-expanded')||null}
function fieldFromBase(target,row){const direct=target.closest?.('[data-inline-progressive-glyph]');if(direct?.dataset.inlineProgressiveGlyph)return direct.dataset.inlineProgressiveGlyph;for(const [field,selector] of GLYPH_FIELDS){const glyph=target.closest?.(selector);if(glyph&&row.contains(glyph))return field}return''}
function ownRevealEvent(event){const row=expandedRowFor(event.target);if(!row)return false;ensureStrip(row);const level=event.target.closest?.('[data-inline-progressive-level]');if(level){event.preventDefault();event.stopImmediatePropagation();levelActivate(level);return true}const field=fieldFromBase(event.target,row);if(field){event.preventDefault();event.stopImmediatePropagation();baseActivate(row,field);return true}return false}
function handleClick(event){
  if(ownRevealEvent(event))return;
  const row=expandedRowFor(event.target);if(!row)return;
  if(event.target.closest?.('[data-inline-ledger]'))return;
  event.preventDefault();event.stopImmediatePropagation();
}
function handleKey(event){if(event.key!=='Enter'&&event.key!==' ')return;ownRevealEvent(event)}
function installStyles(){
  if(document.getElementById('skyInlineProgressiveContractV3Styles'))return;document.getElementById('skyInlineProgressiveContractV2Styles')?.remove();document.getElementById('skyInlineProgressiveContractStyles')?.remove();
  const style=document.createElement('style');style.id='skyInlineProgressiveContractV3Styles';style.textContent=`
    .sky-foundation-relationship-row.is-inline-expanded [data-inline-progressive-glyph]{cursor:pointer;border-radius:6px}
    .sky-foundation-relationship-row.is-inline-expanded [data-inline-progressive-glyph]:hover{background:rgba(45,39,34,.055)}
    .sky-foundation-relationship-copy small.has-inline-house-trigger{display:inline-flex!important;align-items:center;justify-content:center;gap:3px;overflow:visible!important}
    .inline-rel-house-trigger{display:inline-grid;place-items:center;width:18px;height:18px;min-width:18px;min-height:18px;padding:0;border-radius:50%;background:var(--house-color,#777);color:var(--house-ink,#fff)!important;font:900 .58rem/1 system-ui,sans-serif;cursor:pointer;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,.16)}
    .inline-rel-house-trigger:hover{filter:brightness(.92);box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 0 3px var(--house-color,#777)}
    .inline-rel-progressive-strip{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1fr) minmax(86px,.72fr) minmax(0,1fr);align-items:start;gap:8px;min-width:0}
    .inline-rel-progressive-side-a{grid-column:1}.inline-rel-progressive-side-b{grid-column:3}
    .inline-rel-progressive-side{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;gap:5px;min-width:0}
    .inline-rel-progressive-side>[data-inline-progressive-token$="-placement"]{grid-column:1}.inline-rel-progressive-side>[data-inline-progressive-token$="-sign"]{grid-column:2}.inline-rel-progressive-side>[data-inline-progressive-token$="-house"]{grid-column:3}
    .inline-rel-progressive-strip>[data-inline-progressive-token="aspect"]{grid-column:2}
    .inline-rel-progressive-token{grid-row:1;display:grid;justify-items:center;gap:4px;min-width:0;padding:4px 5px;border-radius:7px;background:rgba(45,39,34,.04)}
    .inline-rel-progressive-token[data-tone="a"]{border-top:2px solid #c9211e}.inline-rel-progressive-token[data-tone="b"]{border-top:2px solid #2462d0}.inline-rel-progressive-token[data-tone="aspect"]{border-top:2px solid var(--relationship-stripe,#777)}
    .inline-rel-progressive-token[hidden],.inline-rel-progressive-level[hidden]{display:none!important}
    .inline-rel-progressive-level{display:inline-block;max-width:100%;padding:0;border:0;background:transparent;color:#352f2a;cursor:pointer;font-family:system-ui,sans-serif;text-align:center}
    .inline-rel-progressive-name{font-size:.6rem;font-weight:900;line-height:1.15}.inline-rel-progressive-referent{font-size:.55rem;font-weight:680;line-height:1.28;color:#625a53;white-space:normal;overflow-wrap:anywhere}
    @media(max-width:620px){.inline-rel-progressive-strip{grid-template-columns:minmax(0,1fr) minmax(68px,.64fr) minmax(0,1fr);gap:4px}.inline-rel-progressive-side{gap:3px}.inline-rel-progressive-token{padding:3px}.inline-rel-progressive-name{font-size:.54rem}.inline-rel-progressive-referent{font-size:.49rem}.inline-rel-house-trigger{width:17px;height:17px;min-width:17px;min-height:17px;font-size:.55rem}}
  `;document.head.appendChild(style);
}
function decorateExisting(){document.querySelectorAll('.sky-foundation-relationship-row').forEach(ensureStrip)}
function ensureObserver(){const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;observer?.disconnect();observedList=list;observer=new MutationObserver(decorateExisting);observer.observe(list,{childList:true,subtree:true})}
function reconcile(){installStyles();ensureObserver();requestAnimationFrame(decorateExisting)}
function start(){reconcile();['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,reconcile))}
// Reveal ownership is installed before the inline row-toggle renderer. Once a relationship is open,
// only its reveal controls and explicit child actions own clicks; generic row clicks cannot collapse it.
document.addEventListener('click',handleClick,true);document.addEventListener('keydown',handleKey,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
