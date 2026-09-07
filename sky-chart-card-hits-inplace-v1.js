// Card Hits presentation refinement: relationship-style in-place ruler expansion
// and house spans showing ruler card, zodiac sign card, and intersecting decan cards.
(function(){
'use strict';
if(window.__relphiSkyCardHitsInplaceV1)return;
window.__relphiSkyCardHitsInplaceV1=true;

const SIGN_RULERS={aries:'Mars',taurus:'Venus',gemini:'Mercury',cancer:'Moon',leo:'Sun',virgo:'Mercury',libra:'Venus',scorpio:'Mars',sagittarius:'Jupiter',capricorn:'Saturn',aquarius:'Saturn',pisces:'Jupiter'};
const FALLBACK={Sun:'the_sun',Moon:'the_high_priestess',Mercury:'the_magician',Venus:'the_empress',Mars:'the_tower',Jupiter:'wheel_of_fortune',Saturn:'the_world'};
let queued=false;
const watched=new WeakSet();

function tarotCards(){return Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]}
function values(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}
function byId(id){return tarotCards().find(c=>c.card_id===id||c.stable_symbol_id===id)||null}
function planetCard(planet){return tarotCards().find(c=>c.arcana==='Major'&&values(c.astrology?.planet).includes(planet))||byId(FALLBACK[planet])}
function signCard(sign){const wanted=String(sign||'').trim().toLowerCase();return tarotCards().find(c=>c.arcana==='Major'&&values(c.astrology?.sign).some(v=>v.toLowerCase()===wanted))||null}
function cardName(card){return String(card?.systems?.golden_dawn_rws?.display_name||card?.name||card?.title||card?.card_name||card?.card_id||'Card').replace(/_/g,' ')}
function thumb(card,w=48,h=83){
  if(!card)return'';
  const shared=window.RelphiSkyCardHitsDrawer?.thumbnailFor;
  if(typeof shared==='function')return shared(card,w,h);
  const id=encodeURIComponent(card.card_id||card.stable_symbol_id||'');
  const src=new URL(`assets/tarot/rws/${id}.webp`,document.baseURI).href;
  const u=new URL('https://wsrv.nl/');
  u.searchParams.set('url',src);u.searchParams.set('w',String(w));u.searchParams.set('h',String(h));u.searchParams.set('fit','cover');u.searchParams.set('output','webp');u.searchParams.set('q','60');
  return u.href;
}
function titleCase(v){const s=String(v||'');return s?s[0].toUpperCase()+s.slice(1):''}

function ensureStyles(){
  if(document.getElementById('skyCardHitsInplaceV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyCardHitsInplaceV1Styles';
  style.textContent=`
.sky-card-rulers-grid>.sky-card-ruler-detail.sky-card-ruler-detail-inline{grid-column:1/-1;margin:0;min-width:0;animation:skyCardHitsInlineOpen .14s ease-out}
@keyframes skyCardHitsInlineOpen{from{opacity:.35;transform:translateY(-3px)}to{opacity:1;transform:none}}
.sky-card-house-row[data-ruler-spans-enhanced="true"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:.65rem!important}
.sky-card-house-row[data-ruler-spans-enhanced="true"]>.sky-card-house-label{justify-content:flex-start!important}
.sky-card-house-row[data-ruler-spans-enhanced="true"]>.sky-card-house-label>span{display:none!important}
.sky-card-house-span-list{display:grid;gap:.82rem;min-width:0}
.sky-card-house-span{display:grid;gap:.52rem;min-width:0;padding-top:.78rem;border-top:1px solid rgba(31,27,24,.09)}
.sky-card-house-span:first-child{padding-top:0;border-top:0}
.sky-card-house-span-heading{display:flex;align-items:center;gap:.4rem;min-width:0;color:#2b2622}
.sky-card-house-span-heading strong{font:900 .66rem/1.15 system-ui,sans-serif}
.sky-card-house-span-majors{display:flex;gap:.7rem;align-items:flex-start;justify-content:flex-start;min-width:0}
.sky-card-house-span-major{display:grid;grid-template-rows:auto auto auto;justify-items:center;gap:.22rem;width:52px;min-width:0}
.sky-card-house-span-major-role{color:#7a7068;font:900 .45rem/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}
.sky-card-house-span-major-art{display:block;width:46px;height:80px;border:1px solid rgba(31,27,24,.18);border-radius:4px;background:#eee;box-shadow:0 2px 7px rgba(31,27,24,.12);overflow:hidden}
.sky-card-house-span-major-art>img{display:block;width:100%;height:100%;object-fit:cover}
.sky-card-house-span-major-name{max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#332d28;font:850 .52rem/1.1 system-ui,sans-serif;text-align:center}
.sky-card-house-span-decans-wrap{display:grid;gap:.28rem;min-width:0}
.sky-card-house-span-decans-label{color:#7a7068;font:900 .45rem/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}
.sky-card-house-span-decans{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.42rem;align-items:start;justify-items:center;min-width:0}
.sky-card-house-span-decans .sky-card-house-decan{width:100%;gap:.3rem}
.sky-card-house-span-decans .sky-card-house-decan-art{width:min(52px,100%);height:auto;aspect-ratio:62/108}
.sky-card-house-span-decans .sky-card-house-decan-label{font-size:.5rem;padding:.15rem 0;gap:.12rem}
.sky-card-house-span-decans .sky-card-house-decan-label .sky-card-inline-glyph{flex-basis:16px;width:16px;height:16px}
@media(max-width:520px){.sky-card-house-span-majors{gap:.55rem}.sky-card-house-span-major{width:48px}.sky-card-house-span-major-art{width:42px;height:73px}.sky-card-house-span-major-name{max-width:48px}.sky-card-house-span-decans{gap:.3rem}}
`;
  document.head.appendChild(style);
}

function placeRulerDetail(root){
  const grid=root.querySelector('.sky-card-rulers-grid');
  const detail=root.querySelector('.sky-card-ruler-detail');
  if(!grid||!detail)return;
  const active=grid.querySelector('.sky-card-ruler.is-active');
  if(!active)return;
  if(detail.parentElement!==grid||detail.previousElementSibling!==active){
    active.insertAdjacentElement('afterend',detail);
  }
  detail.classList.add('sky-card-ruler-detail-inline');
}

function signOfDecan(node){return node.querySelector('[data-relphi-card-sign]')?.dataset.relphiCardSign||''}
function makeMajor(role,label,card){
  const box=document.createElement('div');
  box.className='sky-card-house-span-major';
  const roleLabel=document.createElement('span');
  roleLabel.className='sky-card-house-span-major-role';
  roleLabel.textContent=role;
  const art=document.createElement('span');
  art.className='sky-card-house-span-major-art';
  art.title=card?cardName(card):label;
  if(card){const img=document.createElement('img');img.src=thumb(card,58,101);img.alt='';img.loading='lazy';img.decoding='async';art.appendChild(img)}
  const name=document.createElement('span');
  name.className='sky-card-house-span-major-name';
  name.textContent=label;
  box.append(roleLabel,art,name);
  return box;
}
function makeSpan(sign,nodes){
  const ruler=SIGN_RULERS[sign]||'';
  const rulerCard=planetCard(ruler);
  const zodiacCard=signCard(sign);
  const signName=titleCase(sign);
  const span=document.createElement('section');
  span.className='sky-card-house-span';
  span.dataset.houseSignSpan=sign;
  span.setAttribute('aria-label',`${signName} span: ${ruler} ruler card, ${signName} zodiac card, and decan cards`);

  const heading=document.createElement('div');
  heading.className='sky-card-house-span-heading';
  const strong=document.createElement('strong');
  strong.textContent=signName;
  heading.appendChild(strong);

  const majors=document.createElement('div');
  majors.className='sky-card-house-span-majors';
  majors.append(makeMajor('Ruler',ruler,rulerCard),makeMajor('Sign',signName,zodiacCard));

  const decansWrap=document.createElement('div');
  decansWrap.className='sky-card-house-span-decans-wrap';
  const decansLabel=document.createElement('span');
  decansLabel.className='sky-card-house-span-decans-label';
  decansLabel.textContent='Decans';
  const decans=document.createElement('div');
  decans.className='sky-card-house-span-decans';
  nodes.forEach(node=>decans.appendChild(node));
  decansWrap.append(decansLabel,decans);

  span.append(heading,majors,decansWrap);
  return span;
}

function groupHouseSpans(root){
  root.querySelectorAll('.sky-card-house-row').forEach(row=>{
    if(row.dataset.rulerSpansEnhanced==='true')return;
    const original=row.querySelector(':scope > .sky-card-house-decans');
    if(!original)return;
    const items=Array.from(original.querySelectorAll(':scope > .sky-card-house-decan'));
    if(!items.length){row.dataset.rulerSpansEnhanced='true';return}
    const groups=[];
    items.forEach(item=>{
      const sign=signOfDecan(item);
      if(!sign)return;
      let group=groups[groups.length-1];
      if(!group||group.sign!==sign){group={sign,nodes:[]};groups.push(group)}
      group.nodes.push(item);
    });
    if(!groups.length)return;
    const list=document.createElement('div');
    list.className='sky-card-house-span-list';
    groups.forEach(group=>list.appendChild(makeSpan(group.sign,group.nodes)));
    original.replaceWith(list);
    row.dataset.rulerSpansEnhanced='true';
  });
}

function enhanceRoot(root){
  if(!root)return;
  placeRulerDetail(root);
  groupHouseSpans(root);
}
function enhanceAll(){
  queued=false;
  document.querySelectorAll('.sky-card-hits-structure').forEach(enhanceRoot);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function watchMount(mount){
  if(!mount||watched.has(mount))return;
  watched.add(mount);
  new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))schedule()}).observe(mount,{childList:true,subtree:true});
}
function bind(){
  ensureStyles();
  ['A','B'].forEach(slot=>watchMount(window.RelphiSkyCardShell?.get?.(slot)?.cardHits));
  schedule();
  if(['A','B'].some(slot=>!window.RelphiSkyCardShell?.get?.(slot)?.cardHits))requestAnimationFrame(bind);
}
window.addEventListener('relphi:sky-drawer-opened',schedule);
window.addEventListener('relphi:saved-sky-loaded',schedule);
window.addEventListener('relphi:sky-house-multiselect-changed',schedule);
document.addEventListener('click',event=>{if(event.target.closest?.('[data-card-ruler],[data-card-hits-view]'))requestAnimationFrame(schedule)},false);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();
