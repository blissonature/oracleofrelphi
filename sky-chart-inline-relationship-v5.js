// Inline relationship reveal v5: the isolated mini-wheel is pure geometry.
// Sky A and Sky B endpoints are plain color points at their true longitudes; overlap is allowed.
(function(){
'use strict';
if(window.__relphiInlineRelationshipV5)return;
window.__relphiInlineRelationshipV1=true;
window.__relphiInlineRelationshipV2=true;
window.__relphiInlineRelationshipV3=true;
window.__relphiInlineRelationshipV4=true;
window.__relphiInlineRelationshipV5=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const COLORS={A:'#c9211e',B:'#2462d0'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ASPECT_NAMES={conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'};
const PLACEMENT_REFERENTS={sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control'};
const ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
const DECANS=[[['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],[['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],[['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],[['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],[['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],[['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],[['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],[['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],[['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],[['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],[['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],[['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]];
const ALIAS={rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
let openRow=null;
const cardArtWarmups=new Map();

const norm=n=>((Number(n)%360)+360)%360;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
function source(p){const x=[p?.placements,p?.positions,p?.points,p?.bodies].find(v=>v&&typeof v==='object')||p||{};return Array.isArray(x)?x.map((v,i)=>[String(v?.name||v?.id||i),v]):Object.entries(x)}
function lon(x){if(Number.isFinite(Number(x?.longitude)))return norm(x.longitude);const s=SIGNS.findIndex(n=>n.toLowerCase()===String(x?.sign||x?.zodiac||'').toLowerCase());return s<0?NaN:norm(s*30+Number(x.degree||x.degrees||0)+Number(x.minute||x.minutes||0)/60)}
function canonical(k,x){const r=window.RelphiGlyphRegistry;for(const c of [x?.glyphId,x?.id,x?.name,x?.label,x?.body,x?.planet,x?.point,k]){if(!c)continue;const raw=String(c).trim(),e=r?.resolve?.(ALIAS[raw.toLowerCase()]||raw)||r?.get?.(ALIAS[raw.toLowerCase()]||raw);if(e)return e}return null}
function find(slot,id,row){for(const[k,x]of source(read(KEYS[slot]))){if(!x||typeof x!=='object'||Array.isArray(x))continue;const e=canonical(k,x),v=lon(x);if(e?.id===id&&Number.isFinite(v)){const h=Number(row.dataset[slot==='A'?'leftHouse':'rightHouse']);return{id:e.id,entry:e,value:v,sky:slot,house:Number.isFinite(h)&&h>0?h:null}}}return null}
function relation(row){const l=find('A',row.dataset.leftPlacement,row),r=find('B',row.dataset.rightPlacement,row);if(!l||!r)return null;return{left:l,right:r,aspect:String(row.dataset.aspect||''),orb:Number(row.dataset.sourceOrb||0)}}
function card(rec){const v=norm(rec.value),s=Math.floor(v/30),d=Math.floor(v-s*30),[id,title]=DECANS[s][Math.min(2,Math.floor(d/10))];return{id,title,image:`assets/tarot/rws-export/${id}.webp`}}
function warmCardArt(src){
  const key=String(src||'');if(!key)return Promise.resolve();
  const existing=cardArtWarmups.get(key);if(existing)return existing.ready;
  const image=new Image();image.decoding='async';
  let settle;const loaded=new Promise(resolve=>{settle=resolve});
  image.addEventListener('load',settle,{once:true});image.addEventListener('error',settle,{once:true});image.src=key;
  const ready=typeof image.decode==='function'?image.decode().catch(()=>loaded):loaded;
  cardArtWarmups.set(key,{image,ready});return ready;
}
function warmCurrentCardArt(){
  const paths=new Set();
  ['A','B'].forEach(slot=>{for(const[,x]of source(read(KEYS[slot]))){if(!x||typeof x!=='object'||Array.isArray(x))continue;const v=lon(x);if(Number.isFinite(v))paths.add(card({value:v}).image)}});
  paths.forEach(warmCardArt);
}
function point(v,r=48){const a=(norm(v)-180)*Math.PI/180;return{x:60+r*Math.cos(a),y:60+r*Math.sin(a)}}
function position(rec){const v=norm(rec.value),si=Math.floor(v/30),within=v-si*30,d=Math.floor(within),m=Math.floor((within-d)*60+1e-7);return{sign:SIGNS[si],degree:d,minute:m,label:`${d}°${String(m).padStart(2,'0')}′`}}
function tarotHref(cardId){const params=new URLSearchParams();params.set('card',cardId);const ref=new URLSearchParams(location.search).get('ref');if(ref)params.set('ref',ref);return`tarot.html?${params.toString()}`}

function wheelMarkup(rel){
  const a=point(rel.left.value),b=point(rel.right.value);
  return `<div class="inline-rel-wheel"><div class="inline-rel-wheel-stage"><svg viewBox="0 0 120 120" aria-label="Isolated relationship"><circle cx="60" cy="60" r="48" class="inline-rel-ring"/><line x1="60" y1="60" x2="${a.x}" y2="${a.y}" class="inline-rel-radius a"/><line x1="60" y1="60" x2="${b.x}" y2="${b.y}" class="inline-rel-radius b"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="inline-rel-aspect"/><g class="inline-rel-point-layer" aria-hidden="true"><circle cx="${a.x}" cy="${a.y}" r="5.4" class="inline-rel-point inline-rel-point-a"/><circle cx="${b.x}" cy="${b.y}" r="5.4" class="inline-rel-point inline-rel-point-b"/></g></svg></div><div class="inline-rel-orb"><span style="--orb:${Math.min(1,rel.orb)}"></span><strong>${rel.orb.toFixed(2)}°</strong></div></div>`;
}
function cardMarkup(slot,c){
  const href=tarotHref(c.id);
  return `<a class="inline-rel-card sky-${slot.toLowerCase()}" data-inline-ledger="${esc(c.id)}" href="${esc(href)}" style="text-decoration:none" aria-label="Open full ${esc(c.title)} Tarot Ledger entry"><small>Sky ${slot}</small><img loading="eager" decoding="async" src="${esc(c.image)}" alt="${esc(c.title)}"><b>${esc(c.title)}</b></a>`;
}

function contextMarkup(rel){
  const lp=position(rel.left),rp=position(rel.right);
  return `<div class="inline-rel-house-context"><span>Sky A · ${esc(lp.sign)} ${esc(lp.label)}${rel.left.house?` · H${rel.left.house}`:''}</span><span>Sky B · ${esc(rp.sign)} ${esc(rp.label)}${rel.right.house?` · H${rel.right.house}`:''}</span></div>`;
}
function revealInfo(rel,field){
  if(field==='left')return{name:rel.left.entry.name,referent:PLACEMENT_REFERENTS[rel.left.id]||'a calculated placement in Sky A',color:COLORS.A};
  if(field==='right')return{name:rel.right.entry.name,referent:PLACEMENT_REFERENTS[rel.right.id]||'a calculated placement in Sky B',color:COLORS.B};
  const name=ASPECT_NAMES[rel.aspect]||rel.aspect;
  return{name,referent:ASPECT_REFERENTS[rel.aspect]||'a measured relationship between the two placements',color:'var(--relationship-stripe,#777)'};
}
function clearReveal(row){
  if(!row)return;
  delete row.dataset.inlineRevealField;delete row.dataset.inlineRevealLevel;
  const reveal=row.querySelector(':scope>.inline-rel-detail>.inline-rel-top-reveal');
  if(reveal){reveal.hidden=true;reveal.textContent='';reveal.removeAttribute('style');delete reveal.dataset.level;delete reveal.dataset.field}
}
function cycleReveal(row,field){
  const rel=relation(row),reveal=row.querySelector(':scope>.inline-rel-detail>.inline-rel-top-reveal');
  if(!rel||!reveal)return;
  const sameField=row.dataset.inlineRevealField===field,current=sameField?row.dataset.inlineRevealLevel:'';
  const next=current===''?'name':current==='name'?'referent':'';
  if(!next){clearReveal(row);return}
  const info=revealInfo(rel,field);
  row.dataset.inlineRevealField=field;row.dataset.inlineRevealLevel=next;
  reveal.dataset.field=field;reveal.dataset.level=next;reveal.style.setProperty('--reveal-color',info.color);
  reveal.textContent=next==='name'?info.name:info.referent;
  reveal.hidden=false;
}
function fieldFromTopGlyph(node){
  if(node?.classList.contains('sky-foundation-relationship-glyph--left'))return'left';
  if(node?.classList.contains('sky-foundation-relationship-glyph--right'))return'right';
  if(node?.classList.contains('sky-foundation-relationship-glyph--aspect'))return'aspect';
  return'';
}
function decorateTopReveal(row){
  const fields=[['left','.sky-foundation-relationship-glyph--left'],['aspect','.sky-foundation-relationship-glyph--aspect'],['right','.sky-foundation-relationship-glyph--right']];
  fields.forEach(([field,selector])=>{const node=row.querySelector(selector);if(!node)return;node.dataset.inlineTopReveal=field;node.setAttribute('title','Tap to reveal name, then meaning')});
}
function close(row){
  clearReveal(row);
  const detail=row?.querySelector(':scope>.inline-rel-detail');if(detail)detail.hidden=true;
  row?.classList.remove('is-inline-expanded');row?.setAttribute('aria-expanded','false');
}

function open(row){
  if(openRow&&openRow!==row)close(openRow);
  if(row===openRow&&row.classList.contains('is-inline-expanded'))return;
  const rel=relation(row);if(!rel)return;
  openRow=row;row.classList.add('is-inline-expanded');row.setAttribute('aria-expanded','true');decorateTopReveal(row);
  const signature=`${rel.left.id}@${rel.left.value.toFixed(7)}|${rel.aspect}|${rel.right.id}@${rel.right.value.toFixed(7)}`;
  let detail=row.querySelector(':scope>.inline-rel-detail');
  if(detail&&detail.dataset.inlineRelationshipSignature===signature){detail.hidden=false;document.getElementById('skySelectedRelationship')?.setAttribute('hidden','');return}
  detail?.remove();detail=document.createElement('div');detail.className='inline-rel-detail';detail.dataset.inlineRelationshipSignature=signature;
  const ca=card(rel.left),cb=card(rel.right);warmCardArt(ca.image);warmCardArt(cb.image);
  detail.innerHTML=`<div class="inline-rel-top-reveal" role="status" aria-live="polite" hidden></div><div class="inline-rel-visual">${cardMarkup('A',ca)}${wheelMarkup(rel)}${cardMarkup('B',cb)}</div>${contextMarkup(rel)}`;
  row.appendChild(detail);
  document.getElementById('skySelectedRelationship')?.setAttribute('hidden','');
}

document.addEventListener('click',e=>{
  const ledger=e.target.closest('[data-inline-ledger]');
  if(ledger){e.stopImmediatePropagation();return}
  const topGlyph=e.target.closest('[data-inline-top-reveal],.sky-foundation-relationship-glyph--left,.sky-foundation-relationship-glyph--aspect,.sky-foundation-relationship-glyph--right');
  const revealRow=topGlyph?.closest('.sky-foundation-relationship-row.is-inline-expanded');
  if(revealRow){const field=topGlyph.dataset.inlineTopReveal||fieldFromTopGlyph(topGlyph);if(field){e.preventDefault();e.stopImmediatePropagation();cycleReveal(revealRow,field);return}}
  const row=e.target.closest('.sky-foundation-relationship-row[data-relation-index]');
  if(row)requestAnimationFrame(()=>open(row));
},true);
function suppress(){const p=document.getElementById('skySelectedRelationship');if(p)p.hidden=true}
window.addEventListener('relphi:selected-relationship-rendered',suppress);
window.addEventListener('relphi:sky-foundation-ready',()=>{if(openRow&&!openRow.isConnected)openRow=null;warmCurrentCardArt();suppress()});
function start(){warmCurrentCardArt();suppress()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();