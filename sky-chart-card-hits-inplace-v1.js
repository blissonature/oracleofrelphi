// Card Hits presentation refinement: relationship-style ruler expansion and compact House concentration disclosures.
(function(){
'use strict';
if(window.__relphiSkyCardHitsInplaceV1)return;
window.__relphiSkyCardHitsInplaceV1=true;

const SIGN_RULERS={aries:'Mars',taurus:'Venus',gemini:'Mercury',cancer:'Moon',leo:'Sun',virgo:'Mercury',libra:'Venus',scorpio:'Mars',sagittarius:'Jupiter',capricorn:'Saturn',aquarius:'Saturn',pisces:'Jupiter'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const FALLBACK={Sun:'the_sun',Moon:'the_high_priestess',Mercury:'the_magician',Venus:'the_empress',Mars:'the_tower',Jupiter:'wheel_of_fortune',Saturn:'the_world'};
const openHouse={A:null,B:null};
const watched=new WeakSet();
let queued=false;
const norm=v=>((Number(v)%360)+360)%360;

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
function json(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(_){return null}}
function numericCusps(raw){
  if(!raw)return null;
  let a=null;
  if(Array.isArray(raw))a=raw.map(v=>Number(typeof v==='object'?(v.longitude??v.value??v.degree):v));
  else if(typeof raw==='object'){
    const keyed=[];
    for(let h=1;h<=12;h++){
      const v=raw[h]??raw[String(h)]??raw[`h${h}`]??raw[`house${h}`];
      keyed.push(Number(typeof v==='object'?(v?.longitude??v?.value??v?.degree):v));
    }
    a=keyed.every(Number.isFinite)?keyed:Object.values(raw).map(v=>Number(typeof v==='object'?(v?.longitude??v?.value??v?.degree):v)).filter(Number.isFinite);
  }
  return a&&a.length>=12&&a.slice(0,12).every(Number.isFinite)?a.slice(0,12).map(norm):null;
}
function source(payload){
  if(!payload||typeof payload!=='object')return[];
  const raw=[payload.placements,payload.positions,payload.points,payload.bodies].find(v=>v&&typeof v==='object')||payload;
  if(Array.isArray(raw))return raw.map((v,i)=>[String(v?.name||v?.label||v?.id||i),v]);
  return Object.entries(raw).filter(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(k));
}
function longitude(v){
  if(Number.isFinite(Number(v?.longitude)))return norm(v.longitude);
  const i=SIGNS.findIndex(s=>s.toLowerCase()===String(v?.sign||v?.zodiac||'').trim().toLowerCase());
  if(i<0)return NaN;
  return norm(i*30+Number(v?.degree||v?.degrees||0)+Number(v?.minute||v?.minutes||0)/60+Number(v?.second||v?.seconds||0)/3600);
}
function ascLongitude(payload){
  for(const [key,item] of source(payload)){
    const candidates=[item?.name,item?.label,item?.body,item?.planet,item?.point,item?.id,item?.glyphId,key].map(v=>String(v||'').trim().toLowerCase().replace(/[_\s-]+/g,''));
    if(candidates.some(v=>v==='asc'||v==='ascendant'||v==='rising')){const lon=longitude(item);if(Number.isFinite(lon))return lon}
  }
  return NaN;
}
function cuspArrayForSlot(slot){
  const payload=json(KEYS[slot]);
  if(!payload)return null;
  const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  for(const raw of[profile.houseCusps,profile.cusps,payload.houseCusps,payload.cusps,payload.houses]){
    const c=numericCusps(raw);if(c)return c;
  }
  const asc=ascLongitude(payload);
  if(!Number.isFinite(asc))return null;
  const system=String(profile.houseSystem||payload.houseSystem||'').toLowerCase();
  if(system.includes('whole')){
    const start=Math.floor(asc/30)*30;
    return Array.from({length:12},(_,i)=>norm(start+i*30));
  }
  if(system.includes('equal'))return Array.from({length:12},(_,i)=>norm(asc+i*30));
  return null;
}
function formatLongitude(value){
  let minutes=Math.round(norm(value)*60)%(360*60);
  if(minutes<0)minutes+=360*60;
  const si=Math.floor(minutes/(30*60))%12;
  const within=minutes-si*30*60;
  return `${Math.floor(within/60)}°${String(within%60).padStart(2,'0')}′ ${SIGNS[si]}`;
}
function houseLegs(cusps,house){
  if(!cusps||!Number.isFinite(house)||house<1||house>12)return[];
  const start=norm(cusps[house-1]);
  let end=norm(cusps[house%12]);
  if(end<=start)end+=360;
  const legs=[];
  let cursor=start,guard=0;
  while(cursor<end-1e-8&&guard++<14){
    const normalized=norm(cursor+1e-8);
    const signIndex=Math.floor(normalized/30)%12;
    const cycle=Math.floor(cursor/360)*360;
    let signEnd=cycle+(signIndex+1)*30;
    if(signIndex===11&&signEnd<=cursor+1e-8)signEnd+=360;
    while(signEnd<=cursor+1e-8)signEnd+=360;
    const legEnd=Math.min(end,signEnd);
    legs.push({sign:SIGNS[signIndex].toLowerCase(),start:cursor,end:legEnd});
    cursor=legEnd;
  }
  return legs;
}

function ensureStyles(){
  if(document.getElementById('skyCardHitsInplaceV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyCardHitsInplaceV1Styles';
  style.textContent=`
.sky-card-rulers-grid>.sky-card-ruler-detail.sky-card-ruler-detail-inline{grid-column:1/-1;margin:0;min-width:0;animation:skyCardHitsInlineOpen .14s ease-out}
@keyframes skyCardHitsInlineOpen{from{opacity:.35;transform:translateY(-3px)}to{opacity:1;transform:none}}
.sky-card-house-row[data-ruler-spans-enhanced="true"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important;padding:0!important;overflow:hidden!important;align-items:stretch!important}
.sky-card-house-toggle{appearance:none;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.55rem;width:100%;min-height:42px;padding:.55rem .65rem;border:0;background:#fffdfa;color:#211d19;cursor:pointer;text-align:left}
.sky-card-house-toggle:hover,.sky-card-house-toggle:focus-visible{background:#f8f4ee;outline:none}
.sky-card-house-toggle[aria-expanded="true"]{border-bottom:1px solid rgba(31,27,24,.09)}
.sky-card-house-toggle-name{font:900 .67rem/1.1 system-ui,sans-serif;white-space:nowrap}
.sky-card-house-toggle-range{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6d645c;font:750 .57rem/1.15 system-ui,sans-serif}
.sky-card-house-hit-count{display:grid;place-items:center;min-width:25px;height:25px;padding:0 5px;border-radius:999px;background:var(--accent);color:#fff;font:900 .65rem/1 system-ui,sans-serif;box-shadow:0 1px 3px rgba(31,27,24,.14)}
.sky-card-house-hit-count.is-zero{background:#ebe6df;color:#8b8178;box-shadow:none}
.sky-card-house-detail{display:grid;gap:.72rem;min-width:0;padding:.68rem .65rem .75rem;background:#fffdfa}
.sky-card-house-detail[hidden]{display:none!important}
.sky-card-house-span-list{display:grid;gap:.72rem;min-width:0}
.sky-card-house-span{display:grid;gap:.42rem;min-width:0;padding-top:.68rem;border-top:1px solid rgba(31,27,24,.09)}
.sky-card-house-span:first-child{padding-top:0;border-top:0}
.sky-card-house-span-heading{min-width:0;color:#554d46;font:850 .57rem/1.2 system-ui,sans-serif}
.sky-card-house-card-line{display:flex;flex-wrap:wrap;gap:.48rem;align-items:flex-start;min-width:0}
.sky-card-house-span-major,.sky-card-house-decan{display:grid;justify-items:center;align-content:start;gap:.2rem;width:48px;min-width:0}
.sky-card-house-span-major-role{color:#7a7068;font:900 .42rem/1 system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em}
.sky-card-house-span-major-art{display:block;width:44px;height:76px;border:1px solid rgba(31,27,24,.18);border-radius:4px;background:#eee;box-shadow:0 2px 7px rgba(31,27,24,.12);overflow:hidden}
.sky-card-house-span-major-art>img{display:block;width:100%;height:100%;object-fit:cover}
.sky-card-house-span-major-name{max-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#332d28;font:850 .49rem/1.1 system-ui,sans-serif;text-align:center}
.sky-card-house-card-line .sky-card-house-decan{width:50px!important;gap:.22rem!important}
.sky-card-house-card-line .sky-card-house-decan-art{width:46px!important;height:auto!important;aspect-ratio:62/108}
.sky-card-house-card-line .sky-card-house-decan-label{font-size:.48rem!important;padding:.1rem 0!important;gap:.1rem!important}
.sky-card-house-card-line .sky-card-house-decan-label .sky-card-inline-glyph{flex-basis:15px!important;width:15px!important;height:15px!important}
@media(max-width:520px){.sky-card-house-toggle{gap:.4rem;padding:.5rem .55rem}.sky-card-house-card-line{gap:.38rem}.sky-card-house-span-major,.sky-card-house-decan{width:46px}.sky-card-house-span-major-art{width:42px;height:73px}.sky-card-house-span-major-name{max-width:46px}.sky-card-house-card-line .sky-card-house-decan{width:47px!important}.sky-card-house-card-line .sky-card-house-decan-art{width:43px!important}}
`;
  document.head.appendChild(style);
}

function placeRulerDetail(root){
  const grid=root.querySelector('.sky-card-rulers-grid');
  const detail=root.querySelector('.sky-card-ruler-detail');
  if(!grid||!detail)return;
  const active=grid.querySelector('.sky-card-ruler.is-active');
  if(!active)return;
  if(detail.parentElement!==grid||detail.previousElementSibling!==active)active.insertAdjacentElement('afterend',detail);
  detail.classList.add('sky-card-ruler-detail-inline');
}
function signOfDecan(node){return node.querySelector('[data-relphi-card-sign]')?.dataset.relphiCardSign||''}
function makeMajor(role,label,card){
  const box=document.createElement('div');
  box.className='sky-card-house-span-major';
  const roleLabel=document.createElement('span');roleLabel.className='sky-card-house-span-major-role';roleLabel.textContent=role;
  const art=document.createElement('span');art.className='sky-card-house-span-major-art';art.title=card?cardName(card):label;
  if(card){const img=document.createElement('img');img.src=thumb(card,58,101);img.alt='';img.loading='lazy';img.decoding='async';art.appendChild(img)}
  const name=document.createElement('span');name.className='sky-card-house-span-major-name';name.textContent=label;
  box.append(roleLabel,art,name);return box;
}
function makeSpan(leg,nodes,showHeading){
  const sign=leg.sign,ruler=SIGN_RULERS[sign]||'',signName=titleCase(sign);
  const span=document.createElement('section');
  span.className='sky-card-house-span';span.dataset.houseSignSpan=sign;
  const start=Number.isFinite(leg.start)?formatLongitude(leg.start):signName;
  const end=Number.isFinite(leg.end)?formatLongitude(leg.end):signName;
  span.setAttribute('aria-label',`${start} to ${end}: ${ruler} ruler card, ${signName} zodiac card${nodes.length?', and occupied decan cards':''}`);
  if(showHeading&&Number.isFinite(leg.start)&&Number.isFinite(leg.end)){
    const heading=document.createElement('div');heading.className='sky-card-house-span-heading';heading.textContent=`${start} → ${end}`;span.appendChild(heading);
  }
  const line=document.createElement('div');line.className='sky-card-house-card-line';
  line.append(makeMajor('Ruler',ruler,planetCard(ruler)),makeMajor('Sign',signName,signCard(sign)));
  nodes.forEach(node=>line.appendChild(node));
  span.appendChild(line);
  return span;
}
function houseNumberFromRow(row){
  const text=row.querySelector(':scope > .sky-card-house-label strong')?.textContent||'';
  const match=text.match(/\d+/);return match?Number(match[0]):null;
}
function decanHitCount(item){const value=Number(item.querySelector('.sky-card-house-decan-count')?.textContent);return Number.isFinite(value)?value:0}
function cleanDecanHit(item){item.querySelector('.sky-card-house-decan-count')?.remove();if(item.title)item.title=item.title.replace(/\s*·\s*\d+\s+placements?\s*$/i,'')}
function makeHouseToggle(house,cusps,total,fallbackSigns){
  const button=document.createElement('button');button.type='button';button.className='sky-card-house-toggle';button.dataset.cardHouseToggle=String(house);
  const name=document.createElement('span');name.className='sky-card-house-toggle-name';name.textContent=`House ${house}`;
  const range=document.createElement('span');range.className='sky-card-house-toggle-range';
  range.textContent=cusps?`${formatLongitude(cusps[house-1])} → ${formatLongitude(cusps[house%12])}`:fallbackSigns.join(' → ');
  const count=document.createElement('span');count.className=`sky-card-house-hit-count${total===0?' is-zero':''}`;count.textContent=String(total);count.setAttribute('aria-label',`${total} hit${total===1?'':'s'} in House ${house}`);
  button.setAttribute('aria-label',`House ${house}, ${total} hit${total===1?'':'s'}. Show sign and ruler structure.`);
  button.append(name,range,count);return button;
}
function applyHouseDisclosure(root){
  const slot=root?.dataset.cardHitsStructureSlot||'';if(!slot)return;
  root.querySelectorAll('.sky-card-house-row[data-house-number]').forEach(row=>{
    const house=Number(row.dataset.houseNumber),expanded=openHouse[slot]===house;
    row.querySelector(':scope > .sky-card-house-toggle')?.setAttribute('aria-expanded',String(expanded));
    const detail=row.querySelector(':scope > .sky-card-house-detail');if(detail)detail.hidden=!expanded;
  });
}
function groupHouseSpans(root){
  const slot=root?.dataset.cardHitsStructureSlot||'',cuspValues=slot?cuspArrayForSlot(slot):null;
  root.querySelectorAll('.sky-card-house-row').forEach(row=>{
    if(row.dataset.rulerSpansEnhanced==='true')return;
    const original=row.querySelector(':scope > .sky-card-house-decans');if(!original)return;
    const items=Array.from(original.querySelectorAll(':scope > .sky-card-house-decan'));
    const house=houseNumberFromRow(row);if(!items.length||!house){row.dataset.rulerSpansEnhanced='true';return}
    const total=items.reduce((sum,item)=>sum+decanHitCount(item),0);
    const occupiedBySign=new Map(),fallbackSigns=[];
    items.forEach(item=>{
      const sign=signOfDecan(item);if(!sign)return;
      if(!fallbackSigns.includes(titleCase(sign)))fallbackSigns.push(titleCase(sign));
      const hits=decanHitCount(item);if(hits<=0)return;
      cleanDecanHit(item);
      if(!occupiedBySign.has(sign))occupiedBySign.set(sign,[]);
      occupiedBySign.get(sign).push(item);
    });
    const legs=cuspValues?houseLegs(cuspValues,house):fallbackSigns.map(sign=>({sign:sign.toLowerCase(),start:NaN,end:NaN}));
    const displayLegs=total===0?legs:legs.filter(leg=>(occupiedBySign.get(leg.sign)||[]).length);
    const list=document.createElement('div');list.className='sky-card-house-detail sky-card-house-span-list';
    displayLegs.forEach(leg=>list.appendChild(makeSpan(leg,occupiedBySign.get(leg.sign)||[],displayLegs.length>1)));
    const toggle=makeHouseToggle(house,cuspValues,total,fallbackSigns);
    row.querySelector(':scope > .sky-card-house-label')?.remove();original.replaceWith(list);row.prepend(toggle);
    row.dataset.houseNumber=String(house);row.dataset.houseHitCount=String(total);row.dataset.rulerSpansEnhanced='true';
  });
  if(slot)applyHouseDisclosure(root);
}
function enhanceRoot(root){if(!root)return;placeRulerDetail(root);groupHouseSpans(root)}
function enhanceAll(){queued=false;document.querySelectorAll('.sky-card-hits-structure').forEach(enhanceRoot)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function watchMount(mount){if(!mount||watched.has(mount))return;watched.add(mount);new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))schedule()}).observe(mount,{childList:true,subtree:true})}
function bind(){ensureStyles();['A','B'].forEach(slot=>watchMount(window.RelphiSkyCardShell?.get?.(slot)?.cardHits));schedule();if(['A','B'].some(slot=>!window.RelphiSkyCardShell?.get?.(slot)?.cardHits))requestAnimationFrame(bind)}
window.addEventListener('relphi:sky-drawer-opened',schedule);
window.addEventListener('relphi:saved-sky-loaded',schedule);
window.addEventListener('relphi:sky-house-multiselect-changed',schedule);
document.addEventListener('click',event=>{
  const houseButton=event.target.closest?.('[data-card-house-toggle]');
  if(houseButton){const root=houseButton.closest('.sky-card-hits-structure'),slot=root?.dataset.cardHitsStructureSlot||'',house=Number(houseButton.dataset.cardHouseToggle);if(slot&&house){openHouse[slot]=openHouse[slot]===house?null:house;applyHouseDisclosure(root)}return}
  if(event.target.closest?.('[data-card-ruler],[data-card-hits-view]'))requestAnimationFrame(schedule);
},false);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();
