// Card Hits presentation refinement: relationship-style ruler expansion and progressive House detail.
(function(){
'use strict';
if(window.__relphiSkyCardHitsInplaceV4)return;
window.__relphiSkyCardHitsInplaceV4=true;
window.__relphiSkyCardHitsInplaceV3=true;
window.__relphiSkyCardHitsInplaceV2=true;
window.__relphiSkyCardHitsInplaceV1=true;

const NS='http://www.w3.org/2000/svg';
const RELATIONSHIP_GLYPH_DISPLAY_SIZE=38;
const RELATIONSHIP_GLYPH_RADIUS=19;
const SIGN_RULERS={aries:'Mars',taurus:'Venus',gemini:'Mercury',cancer:'Moon',leo:'Sun',virgo:'Mercury',libra:'Venus',scorpio:'Mars',sagittarius:'Jupiter',capricorn:'Saturn',aquarius:'Saturn',pisces:'Jupiter'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const FALLBACK={Sun:'the_sun',Moon:'the_high_priestess',Mercury:'the_magician',Venus:'the_empress',Mars:'the_tower',Jupiter:'wheel_of_fortune',Saturn:'the_world'};
const FACE_SEQUENCE=['Mars','Sun','Venus','Mercury','Moon','Saturn','Jupiter'];
const TIP_KEY='relphiSkyCardHitsHouseProgressiveTipV1';
const HOUSE_MEANINGS={
  1:'self, body, identity, appearance, and the way one enters life',
  2:'resources, money, possessions, values, livelihood, and self-worth',
  3:'communication, learning, siblings, neighbors, local movement, and everyday exchange',
  4:'home, family, roots, ancestry, private life, and foundational belonging',
  5:'creativity, pleasure, romance, children, play, and self-expression',
  6:'work, service, routines, health, maintenance, and practical care',
  7:'partnership, contracts, one-to-one relationships, and encounters with the other',
  8:'shared resources, debts, inheritance, intimacy, crisis, and transformation',
  9:'higher learning, philosophy, religion, publishing, long journeys, and the search for meaning',
  10:'vocation, public life, reputation, authority, achievement, and visible direction',
  11:'friends, groups, networks, alliances, hopes, and collective aims',
  12:'retreat, seclusion, hidden matters, surrender, endings, and what operates behind the scenes'
};
const SIGN_MEANINGS={
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
const PLANET_MEANINGS={
  Sun:'identity, vitality, and conscious purpose',
  Moon:'feelings, instincts, memory, and emotional needs',
  Mercury:'thought, perception, language, and communication',
  Venus:'values, attraction, affection, pleasure, and relating',
  Mars:'drive, assertion, desire, conflict, and action',
  Jupiter:'growth, confidence, meaning, opportunity, and expansion',
  Saturn:'structure, limits, responsibility, time, and commitment'
};
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
function formatDegree(value){
  let minutes=Math.round(norm(value)*60)%(360*60);
  if(minutes<0)minutes+=360*60;
  const si=Math.floor(minutes/(30*60))%12,within=minutes-si*30*60;
  return `${Math.floor(within/60)}°${String(within%60).padStart(2,'0')}′`;
}
function signIndexAt(value){return Math.floor(norm(value)/30)%12}
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
function ordinalHouse(house){const n=Number(house),mod100=n%100,suffix=(mod100>=11&&mod100<=13)?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th';return `${n}${suffix} House`}
function faceLord(sign,decan){const si=SIGNS.findIndex(s=>s.toLowerCase()===String(sign||'').toLowerCase()),d=Number(decan);if(si<0||!Number.isFinite(d))return'';return FACE_SEQUENCE[(si*3+Math.max(0,Math.min(2,Math.trunc(d))))%FACE_SEQUENCE.length]}

function glyphHost(id,className='sky-card-house-detail-glyph'){
  const host=document.createElement('span');host.className=className;host.dataset.relphiHouseGlyph=String(id||'').toLowerCase();host.setAttribute('aria-hidden','true');return host;
}
function relationshipMatchedRadius(host){
  const rectWidth=host?.getBoundingClientRect?.().width||0;
  const cssWidth=parseFloat(getComputedStyle(host).width)||0;
  const displaySize=rectWidth||cssWidth||RELATIONSHIP_GLYPH_DISPLAY_SIZE;
  return RELATIONSHIP_GLYPH_RADIUS*(RELATIONSHIP_GLYPH_DISPLAY_SIZE/displaySize);
}
function hydrateHouseGlyphs(scope){
  const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent;if(!registry||!component?.createBubble||!scope?.querySelectorAll)return;
  scope.querySelectorAll('[data-relphi-house-glyph]').forEach(host=>{
    if(host.dataset.relphiHouseGlyphHydrated==='true')return;
    const id=host.dataset.relphiHouseGlyph,entry=registry.get?.(id)||registry.resolve?.(id);if(!entry)return;
    host.dataset.relphiHouseGlyphHydrated='true';host.replaceChildren();
    const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','-32 -32 64 64');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');host.appendChild(svg);
    try{
      const bubble=component.createBubble(svg,entry.id,{radius:relationshipMatchedRadius(host),padding:1,color:'#111111',fill:'#ffffff'});
      if(bubble.circle){bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true')}
      Promise.resolve(bubble.ready).catch(error=>{host.dataset.relphiHouseGlyphHydrated='error';console.error('[Sky Chart] Canonical House Card Hits glyph failed',entry.id,error)});
    }catch(error){host.dataset.relphiHouseGlyphHydrated='error';console.error('[Sky Chart] Canonical House Card Hits glyph failed',entry.id,error)}
  });
}

function ensureStyles(){
  if(document.getElementById('skyCardHitsInplaceV4Styles'))return;
  document.getElementById('skyCardHitsInplaceV3Styles')?.remove();
  document.getElementById('skyCardHitsInplaceV2Styles')?.remove();
  document.getElementById('skyCardHitsInplaceV1Styles')?.remove();
  const style=document.createElement('style');style.id='skyCardHitsInplaceV4Styles';
  style.textContent=`
.sky-card-rulers-grid>.sky-card-ruler-detail.sky-card-ruler-detail-inline{grid-column:1/-1;margin:0;min-width:0;animation:skyCardHitsInlineOpen .14s ease-out}
@keyframes skyCardHitsInlineOpen{from{opacity:.35;transform:translateY(-3px)}to{opacity:1;transform:none}}
.sky-card-house-row[data-ruler-spans-enhanced="true"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important;padding:0!important;overflow:hidden!important;align-items:stretch!important}
.sky-card-house-toggle{appearance:none;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.55rem;width:100%;min-height:42px;padding:.55rem .65rem;border:0;background:#fffdfa;color:#211d19;cursor:pointer;text-align:left}
.sky-card-house-toggle:hover,.sky-card-house-toggle:focus-visible{background:#f8f4ee;outline:none}
.sky-card-house-toggle[aria-expanded="true"]{border-bottom:1px solid rgba(31,27,24,.09)}
.sky-card-house-toggle-range{display:flex;align-items:center;gap:.24rem;min-width:0;overflow:visible;color:#5f5750;font:780 .57rem/1.15 system-ui,sans-serif;white-space:nowrap}
.sky-card-house-toggle-range-text{white-space:nowrap}.sky-card-house-toggle-arrow{opacity:.62;margin:0 .02rem}.sky-card-house-toggle-glyph{display:inline-block;flex:0 0 30px;width:30px;height:30px}
.sky-card-house-toggle-glyph svg,.sky-card-house-detail-glyph svg{display:block;width:100%;height:100%;overflow:visible}
.sky-card-house-detail-glyph{display:inline-block;flex:0 0 32px;width:32px;height:32px}
.sky-card-house-hit-count{display:grid;place-items:center;min-width:25px;height:25px;padding:0 5px;border-radius:999px;background:var(--accent);color:#fff;font:900 .65rem/1 system-ui,sans-serif;box-shadow:0 1px 3px rgba(31,27,24,.14)}
.sky-card-house-hit-count.is-zero{background:#ebe6df;color:#8b8178;box-shadow:none}
.sky-card-house-detail{display:grid;gap:.72rem;min-width:0;padding:.68rem .65rem .75rem;background:#fffdfa}
.sky-card-house-detail[hidden]{display:none!important}
.sky-card-house-span-list{display:grid;gap:.72rem;min-width:0}
.sky-card-house-span{display:grid;gap:.42rem;min-width:0;padding-top:.68rem;border-top:1px solid rgba(31,27,24,.09)}
.sky-card-house-span:first-of-type{padding-top:0;border-top:0}
.sky-card-house-span-heading{min-width:0;color:#554d46;font:850 .57rem/1.28 system-ui,sans-serif}
@media(max-width:520px){.sky-card-house-toggle{gap:.38rem;padding:.5rem .55rem}.sky-card-house-toggle-range{gap:.18rem;font-size:.54rem}.sky-card-house-toggle-glyph{flex-basis:29px;width:29px;height:29px}.sky-card-house-detail-glyph{flex-basis:31px;width:31px;height:31px}}
`;
  document.head.appendChild(style);
}

function placeRulerDetail(root){
  const grid=root.querySelector('.sky-card-rulers-grid'),detail=root.querySelector('.sky-card-ruler-detail');if(!grid||!detail)return;
  const active=grid.querySelector('.sky-card-ruler.is-active');if(!active)return;
  if(detail.parentElement!==grid||detail.previousElementSibling!==active)active.insertAdjacentElement('afterend',detail);
  detail.classList.add('sky-card-ruler-detail-inline');
}
function signOfDecan(node){return node.querySelector('[data-relphi-card-sign]')?.dataset.relphiCardSign||''}
function decanIndex(node){const text=String(node?.querySelector?.('.sky-card-house-decan-label')?.textContent||node?.title||''),match=text.match(/(\d+)\s*[–-]/);return match?Math.max(0,Math.min(2,Math.floor(Number(match[1])/10))):-1}
function progressiveCopy(name,meaning,glyphId,cardLabel){
  const copy=document.createElement('div');copy.className='sky-card-house-detail-copy';copy.dataset.cardHouseProgressiveGroup='true';
  if(cardLabel){const card=document.createElement('span');card.className='sky-card-house-detail-card-name';card.textContent=cardLabel;copy.appendChild(card)}
  const line=document.createElement('div');line.className='sky-card-house-detail-name-line';if(glyphId)line.appendChild(glyphHost(glyphId));
  const button=document.createElement('button');button.type='button';button.className='sky-card-house-progressive-name';button.dataset.cardHouseProgressiveName='true';button.setAttribute('aria-expanded','false');button.setAttribute('title','Reveal meaning');button.textContent=name;line.appendChild(button);copy.appendChild(line);
  const referent=document.createElement('span');referent.className='sky-card-house-progressive-referent';referent.dataset.cardHouseProgressiveReferent='true';referent.hidden=true;referent.textContent=meaning;copy.appendChild(referent);return copy;
}
function makeMajorRow(role,label,card,glyphId,meaning){
  const row=document.createElement('div');row.className='sky-card-house-detail-row';row.dataset.cardHouseDetailRole=role.toLowerCase();
  const roleLabel=document.createElement('span');roleLabel.className='sky-card-house-detail-role';roleLabel.textContent=role;
  const art=document.createElement('span');art.className='sky-card-house-span-major-art';art.title=card?cardName(card):label;
  if(card){const img=document.createElement('img');img.src=thumb(card,64,111);img.alt='';img.loading='lazy';img.decoding='async';art.appendChild(img)}
  row.append(roleLabel,art,progressiveCopy(label,meaning,glyphId,card?cardName(card):''));return row;
}
function decanCardLabel(node){const first=String(node?.title||'').split('·')[0].trim();return first||'Decan card'}
function decanHitCount(item){const stored=Number(item?.dataset?.houseDecanHitCount);if(Number.isFinite(stored))return stored;const value=Number(item?.querySelector?.('.sky-card-house-decan-count')?.textContent);return Number.isFinite(value)?value:0}
function cleanDecanHit(item){item.querySelector('.sky-card-house-decan-count')?.remove();if(item.title)item.title=item.title.replace(/\s*·\s*\d+\s+placements?\s*$/i,'')}
function makeDecanRow(node,sign){
  const signName=titleCase(sign),decan=decanIndex(node),hits=decanHitCount(node),lord=faceLord(sign,decan),label=decanCardLabel(node);cleanDecanHit(node);
  const row=document.createElement('div');row.className='sky-card-house-detail-row sky-card-house-detail-row-decan';row.dataset.cardHouseDetailRole='decan';
  const role=document.createElement('span');role.className='sky-card-house-detail-role';role.textContent='Decan';
  const art=node.querySelector('.sky-card-house-decan-art')||document.createElement('span');art.classList.add('sky-card-house-decan-art');
  const copy=document.createElement('div');copy.className='sky-card-house-detail-copy';
  const card=document.createElement('span');card.className='sky-card-house-detail-card-name';card.textContent=label;copy.appendChild(card);
  const meta=document.createElement('span');meta.className='sky-card-house-decan-meta';meta.textContent=decan>=0?`${decan*10}–${decan*10+10}° ${signName}${hits>1?` ×${hits}`:''}`:signName;copy.appendChild(meta);
  if(lord){
    const face=document.createElement('div');face.className='sky-card-house-face';face.dataset.cardHouseProgressiveGroup='true';
    const faceLine=document.createElement('div');faceLine.className='sky-card-house-face-line';
    const faceLabel=document.createElement('span');faceLabel.className='sky-card-house-face-label';faceLabel.textContent='Face lord:';faceLine.append(faceLabel,glyphHost(lord.toLowerCase(),'sky-card-house-detail-glyph'));
    const button=document.createElement('button');button.type='button';button.className='sky-card-house-progressive-name sky-card-house-face-name';button.dataset.cardHouseProgressiveName='true';button.setAttribute('aria-expanded','false');button.setAttribute('title','Reveal meaning');button.textContent=lord;faceLine.appendChild(button);face.appendChild(faceLine);
    const referent=document.createElement('span');referent.className='sky-card-house-progressive-referent';referent.dataset.cardHouseProgressiveReferent='true';referent.hidden=true;referent.textContent=PLANET_MEANINGS[lord]||'';face.appendChild(referent);copy.appendChild(face);
  }
  row.append(role,art,copy);return row;
}
function makeSpan(leg,nodes){
  const sign=leg.sign,ruler=SIGN_RULERS[sign]||'',signName=titleCase(sign);
  const span=document.createElement('section');span.className='sky-card-house-span';span.dataset.houseSignSpan=sign;
  const start=Number.isFinite(leg.start)?formatLongitude(leg.start):signName,end=Number.isFinite(leg.end)?formatLongitude(leg.end):signName;
  span.setAttribute('aria-label',`${start} to ${end}: ${ruler} ruler, ${signName} sign${nodes.length?', and occupied decan cards':''}`);
  const heading=document.createElement('div');heading.className='sky-card-house-span-heading';heading.textContent=Number.isFinite(leg.start)&&Number.isFinite(leg.end)?`${start} → ${end}`:signName;span.appendChild(heading);
  const stack=document.createElement('div');stack.className='sky-card-house-detail-stack';
  stack.append(makeMajorRow('Ruler',ruler,planetCard(ruler),ruler.toLowerCase(),PLANET_MEANINGS[ruler]||''),makeMajorRow('Sign',signName,signCard(sign),sign,SIGN_MEANINGS[signName]||''));
  const decans=document.createElement('section');decans.className='sky-card-house-decans-zone';
  const decanHeading=document.createElement('span');decanHeading.className='sky-card-house-decans-heading';decanHeading.textContent='Decan Hits';decans.appendChild(decanHeading);
  if(nodes.length){const list=document.createElement('div');list.className='sky-card-house-decans-list';nodes.forEach(node=>list.appendChild(makeDecanRow(node,sign)));decans.appendChild(list)}
  else{const empty=document.createElement('span');empty.className='sky-card-house-no-placements';empty.textContent='No placements';decans.appendChild(empty)}
  stack.appendChild(decans);span.appendChild(stack);return span;
}
function validHouseNumber(value){const n=Number(value);return Number.isFinite(n)&&n>=1&&n<=12?Math.trunc(n):null}
function houseMedallion(house){
  const n=validHouseNumber(house);if(!n)return null;
  const canonical=window.RelphiHouseMedallion?.create?.(n,'',false);if(canonical)return canonical;
  const fallback=document.createElement('span');fallback.className='relphi-house-medallion';fallback.dataset.house=String(n);fallback.textContent=String(n);fallback.setAttribute('aria-label',ordinalHouse(n));return fallback;
}
function houseNumberFromRow(row){
  const stored=validHouseNumber(row?.dataset?.houseNumber);if(stored)return stored;
  const marker=row?.querySelector?.(':scope > .sky-card-house-label .relphi-house-medallion[data-house],:scope > .sky-card-house-toggle .relphi-house-medallion[data-house]');
  return validHouseNumber(marker?.dataset?.house);
}
function rangePart(value){const frag=document.createDocumentFragment(),text=document.createElement('span');text.className='sky-card-house-toggle-range-text';text.textContent=formatDegree(value);frag.append(text,glyphHost(SIGNS[signIndexAt(value)].toLowerCase(),'sky-card-house-toggle-glyph'));return frag}
function makeHouseToggle(house,cusps,total,fallbackSigns){
  const button=document.createElement('button');button.type='button';button.className='sky-card-house-toggle';button.dataset.cardHouseToggle=String(house);
  const marker=houseMedallion(house);
  const range=document.createElement('span');range.className='sky-card-house-toggle-range';
  let rangeLabel='';
  if(cusps){
    const start=cusps[house-1],end=cusps[house%12];range.append(rangePart(start));const arrow=document.createElement('span');arrow.className='sky-card-house-toggle-arrow';arrow.textContent='→';range.appendChild(arrow);range.append(rangePart(end));rangeLabel=`${formatLongitude(start)} to ${formatLongitude(end)}`;
  }else{
    fallbackSigns.forEach((sign,index)=>{if(index){const arrow=document.createElement('span');arrow.className='sky-card-house-toggle-arrow';arrow.textContent='→';range.appendChild(arrow)}const si=SIGNS.indexOf(sign);if(si>=0)range.appendChild(glyphHost(sign.toLowerCase(),'sky-card-house-toggle-glyph'))});rangeLabel=fallbackSigns.join(' to ');
  }
  range.setAttribute('aria-label',rangeLabel||`House ${house} zodiac span`);
  const count=document.createElement('span');count.className=`sky-card-house-hit-count${total===0?' is-zero':''}`;count.textContent=String(total);count.setAttribute('aria-label',`${total} hit${total===1?'':'s'} in House ${house}`);
  button.setAttribute('aria-label',`House ${house}, ${total} hit${total===1?'':'s'}. Open House details.`);if(marker)button.append(marker,range,count);else button.append(range,count);return button;
}
function makeHouseMeaning(house){
  const group=document.createElement('div');group.className='sky-card-house-meaning';group.dataset.cardHouseProgressiveGroup='true';
  const button=document.createElement('button');button.type='button';button.className='sky-card-house-progressive-name sky-card-house-name';button.dataset.cardHouseProgressiveName='true';button.setAttribute('aria-expanded','false');button.setAttribute('title','Reveal what this House pertains to');button.textContent=ordinalHouse(house);group.appendChild(button);
  const referent=document.createElement('span');referent.className='sky-card-house-progressive-referent';referent.dataset.cardHouseProgressiveReferent='true';referent.hidden=true;referent.textContent=HOUSE_MEANINGS[house]||'';group.appendChild(referent);return group;
}
function tipSeen(){try{return localStorage.getItem(TIP_KEY)==='1'}catch(_){return false}}
function markTipSeen(){try{localStorage.setItem(TIP_KEY,'1')}catch(_){}document.querySelectorAll('[data-card-house-first-tip]').forEach(node=>node.remove())}
function ensureTip(detail){
  if(!detail||tipSeen()||detail.querySelector(':scope > [data-card-house-first-tip]'))return;
  const tip=document.createElement('div');tip.className='sky-card-house-first-tip';tip.dataset.cardHouseFirstTip='true';
  const text=document.createElement('span');text.textContent='Tip: tap a name to reveal what it means.';
  const button=document.createElement('button');button.type='button';button.dataset.cardHouseTipDismiss='true';button.textContent='Got it';tip.append(text,button);detail.prepend(tip);
}
function applyHouseDisclosure(root){
  const slot=root?.dataset.cardHitsStructureSlot||'';if(!slot)return;
  root.querySelectorAll('.sky-card-house-row[data-house-number]').forEach(row=>{
    const house=Number(row.dataset.houseNumber),expanded=openHouse[slot]===house,button=row.querySelector(':scope > .sky-card-house-toggle'),detail=row.querySelector(':scope > .sky-card-house-detail');
    button?.setAttribute('aria-expanded',String(expanded));if(detail){detail.hidden=!expanded;if(expanded)ensureTip(detail)}
  });
}
function groupHouseSpans(root){
  const slot=root?.dataset.cardHitsStructureSlot||'',cuspValues=slot?cuspArrayForSlot(slot):null;
  root.querySelectorAll('.sky-card-house-row').forEach(row=>{
    if(row.dataset.rulerSpansEnhanced==='true')return;
    const original=row.querySelector(':scope > .sky-card-house-decans');if(!original)return;
    const items=Array.from(original.querySelectorAll(':scope > .sky-card-house-decan'));
    const house=houseNumberFromRow(row);if(!items.length||!house){row.dataset.rulerSpansEnhanced='true';return}
    const total=items.reduce((sum,item)=>sum+decanHitCount(item),0),occupiedBySign=new Map(),fallbackSigns=[];
    items.forEach(item=>{
      const sign=signOfDecan(item);if(!sign)return;const signName=titleCase(sign);if(!fallbackSigns.includes(signName))fallbackSigns.push(signName);
      const hits=decanHitCount(item);if(hits<=0)return;if(!occupiedBySign.has(sign))occupiedBySign.set(sign,[]);occupiedBySign.get(sign).push(item);
    });
    const legs=cuspValues?houseLegs(cuspValues,house):fallbackSigns.map(sign=>({sign:sign.toLowerCase(),start:NaN,end:NaN}));
    const displayLegs=total===0?legs:legs.filter(leg=>(occupiedBySign.get(leg.sign)||[]).length);
    const list=document.createElement('div');list.className='sky-card-house-detail sky-card-house-span-list';list.appendChild(makeHouseMeaning(house));displayLegs.forEach(leg=>list.appendChild(makeSpan(leg,occupiedBySign.get(leg.sign)||[])));
    const toggle=makeHouseToggle(house,cuspValues,total,fallbackSigns);
    row.querySelector(':scope > .sky-card-house-label')?.remove();original.replaceWith(list);row.prepend(toggle);
    row.dataset.houseNumber=String(house);row.dataset.houseHitCount=String(total);row.dataset.rulerSpansEnhanced='true';
  });
  if(slot)applyHouseDisclosure(root);hydrateHouseGlyphs(root);
}
function toggleProgressive(button){
  const group=button?.closest?.('[data-card-house-progressive-group]');if(!group)return;
  const referent=group.querySelector(':scope > [data-card-house-progressive-referent]');if(!referent)return;
  const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',expanded?'false':'true');referent.hidden=expanded;markTipSeen();
}
function enhanceRoot(root){if(!root)return;placeRulerDetail(root);groupHouseSpans(root);hydrateHouseGlyphs(root)}
function enhanceAll(){queued=false;document.querySelectorAll('.sky-card-hits-structure').forEach(enhanceRoot)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function watchMount(mount){if(!mount||watched.has(mount))return;watched.add(mount);new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))schedule()}).observe(mount,{childList:true,subtree:true})}
function bind(){ensureStyles();['A','B'].forEach(slot=>watchMount(window.RelphiSkyCardShell?.get?.(slot)?.cardHits));schedule();if(['A','B'].some(slot=>!window.RelphiSkyCardShell?.get?.(slot)?.cardHits))requestAnimationFrame(bind)}
window.addEventListener('relphi:sky-drawer-opened',schedule);
window.addEventListener('relphi:saved-sky-loaded',schedule);
window.addEventListener('relphi:sky-house-multiselect-changed',schedule);
document.addEventListener('click',event=>{
  const dismiss=event.target.closest?.('[data-card-house-tip-dismiss]');if(dismiss){event.preventDefault();event.stopPropagation();markTipSeen();return}
  const progressive=event.target.closest?.('[data-card-house-progressive-name]');if(progressive){event.preventDefault();event.stopPropagation();toggleProgressive(progressive);return}
  const houseButton=event.target.closest?.('[data-card-house-toggle]');
  if(houseButton){const root=houseButton.closest('.sky-card-hits-structure'),slot=root?.dataset.cardHitsStructureSlot||'',house=Number(houseButton.dataset.cardHouseToggle);if(slot&&house){openHouse[slot]=openHouse[slot]===house?null:house;applyHouseDisclosure(root)}return}
  if(event.target.closest?.('[data-card-ruler],[data-card-hits-view]'))requestAnimationFrame(schedule);
},false);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',bind,{once:true}):bind();
})();