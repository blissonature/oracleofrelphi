// Selected Relationship v8: exact isolated zodiac geometry, persistent Tarot art, and glyph-first progressive reveal.
(function(){
'use strict';
if(window.__relphiSkySelectedRelationshipV8)return;
window.__relphiSkySelectedRelationshipV8=true;
window.__relphiSkySelectedRelationshipV7=true;
window.__relphiSkySelectedRelationshipV6=true;
window.__relphiSkySelectedRelationshipV5=true;
window.__relphiSkySelectedRelationshipV4=true;
const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'}, COLORS={A:'#c9211e',B:'#2462d0'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_IDS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ASPECTS={conjunction:['Conjunction',0],'semi-sextile':['Semi-Sextile',30],octile:['Octile',45],sextile:['Sextile',60],quintile:['Quintile',72],square:['Square',90],trine:['Trine',120],'tri-octile':['Tri-Octile',135],'bi-quintile':['Bi-Quintile',144],quincunx:['Quincunx',150],opposition:['Opposition',180]};
const ASPECT_COLORS={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
const DECANS=[[['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],[['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],[['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],[['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],[['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],[['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],[['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],[['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],[['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],[['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],[['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],[['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]];
const ALIASES={rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const MINI={cx:120,cy:120,aspectRadius:66,zodiacInner:76,zodiacOuter:99,signRadius:87};
let mount,selectedIndex=null,token=0;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const norm=v=>((Number(v)%360)+360)%360;
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
function source(p){const x=[p?.placements,p?.positions,p?.points,p?.bodies].find(v=>v&&typeof v==='object')||p||{};return Array.isArray(x)?x.map((v,i)=>[String(v?.name||v?.id||i),v]):Object.entries(x)}
function longitude(x){if(Number.isFinite(Number(x?.longitude)))return norm(x.longitude);const s=SIGNS.findIndex(n=>n.toLowerCase()===String(x?.sign||x?.zodiac||'').toLowerCase());return s<0?NaN:norm(s*30+Number(x.degree||x.degrees||0)+Number(x.minute||x.minutes||0)/60)}
function canonical(k,x){const r=window.RelphiGlyphRegistry;for(const c of [x?.glyphId,x?.id,x?.name,x?.label,x?.body,x?.planet,x?.point,k]){if(!c)continue;const raw=String(c).trim(),e=r?.resolve?.(ALIASES[raw.toLowerCase()]||raw)||r?.get?.(ALIASES[raw.toLowerCase()]||raw);if(e)return e}return null}
function record(slot,id,row){for(const [k,x] of source(read(KEYS[slot]))){if(!x||typeof x!=='object'||Array.isArray(x))continue;const e=canonical(k,x),v=longitude(x);if(e?.id===id&&Number.isFinite(v))return{id:e.id,entry:e,item:x,value:v,sky:slot,house:Number(row.dataset[slot==='A'?'leftHouse':'rightHouse'])}}return null}
function rowFor(i){return document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${i}"]`)}
function relation(i){const row=rowFor(i);if(!row)return null;const left=record('A',row.dataset.leftPlacement,row),right=record('B',row.dataset.rightPlacement,row),id=row.dataset.aspect,m=row.getAttribute('aria-label')?.match(/orb\s+([\d.]+)/i);if(!left||!right||!ASPECTS[id])return null;return{index:i,row,left,right,aspect:{id,color:ASPECT_COLORS[id]},orb:Number(row.dataset.sourceOrb||m?.[1]||0)}}
function pos(r){const v=norm(r.value),s=Math.floor(v/30),w=v-s*30,d=Math.floor(w),m=Math.round((w-d)*60)%60;return{sign:s,degree:d,minute:m,label:`${d}°${String(m).padStart(2,'0')}′ ${SIGNS[s]}`}}
function orb(v){let m=Math.round(Number(v)*60),d=Math.floor(m/60);return`${d}°${String(m%60).padStart(2,'0')}′`}
function card(r){const p=pos(r),di=Math.min(2,Math.floor(p.degree/10)),[id,title]=DECANS[p.sign][di];return{id,title,sign:SIGNS[p.sign],decan:di+1,image:`assets/tarot/rws/${id}.webp?v=border-preserving-crop-352`}}
function ensure(){if(mount?.isConnected)return mount;const rel=document.getElementById('skyFoundationRelationships');if(!rel)return null;mount=document.createElement('section');mount.id='skySelectedRelationship';mount.className='sky-selected-relationship sky-selected-understanding';mount.hidden=true;mount.innerHTML='<div class="sky-selected-body"></div>';rel.insertAdjacentElement('afterend',mount);return mount}
function renderSvgGroup(host,id,color,state,radius,strokeWidth=2.1){
  if(!host)return null;
  const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.get(id)||registry.resolve(id));
  if(!entry||!component?.createBubble){host.replaceChildren();host.dataset.glyphUnavailable='true';return null}
  host.replaceChildren();delete host.dataset.glyphUnavailable;
  const bubble=component.createBubble(host,entry.id,{radius,padding:.7,color,fill:'#fffdfa',strokeWidth});
  if(state==='plain'){bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true')}
  return bubble.ready;
}
function miniPoint(degree,radius){const angle=(norm(degree)-180)*Math.PI/180;return{x:MINI.cx+radius*Math.cos(angle),y:MINI.cy+radius*Math.sin(angle)}}
function miniWheelMarkup(r){
  const a=ASPECTS[r.aspect.id],pointA=miniPoint(r.left.value,MINI.aspectRadius),pointB=miniPoint(r.right.value,MINI.aspectRadius);
  const boundaries=Array.from({length:12},(_,i)=>{const p1=miniPoint(i*30,MINI.zodiacInner),p2=miniPoint(i*30,MINI.zodiacOuter);return`<line class="sky-selected-zodiac-boundary" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"></line>`}).join('');
  const signs=SIGN_IDS.map((id,i)=>{const p=miniPoint(i*30+15,MINI.signRadius);return`<g class="sky-selected-mini-sign" data-mini-sign="${id}" transform="translate(${p.x} ${p.y})"></g>`}).join('');
  return`<article class="sky-selected-aspect-diagram relationship-mini-wheel" style="--aspect-color:${r.aspect.color}"><svg viewBox="0 0 240 240" role="img" aria-label="Isolated ${esc(a[0])}: Sky A ${esc(r.left.entry.name)} to Sky B ${esc(r.right.entry.name)}" data-zodiac-origin="aries-0-at-9" data-left-longitude="${r.left.value.toFixed(8)}" data-right-longitude="${r.right.value.toFixed(8)}" data-aspect-radius="${MINI.aspectRadius}"><circle class="sky-selected-aspect-orbit sky-selected-zodiac-outer" cx="${MINI.cx}" cy="${MINI.cy}" r="${MINI.zodiacOuter}"></circle><circle class="sky-selected-zodiac-inner" cx="${MINI.cx}" cy="${MINI.cy}" r="${MINI.zodiacInner}"></circle>${boundaries}${signs}<circle class="sky-selected-aspect-track" cx="${MINI.cx}" cy="${MINI.cy}" r="${MINI.aspectRadius}"></circle><line class="sky-selected-aspect-radius sky-a" x1="${MINI.cx}" y1="${MINI.cy}" x2="${pointA.x}" y2="${pointA.y}"></line><line class="sky-selected-aspect-radius sky-b" x1="${MINI.cx}" y1="${MINI.cy}" x2="${pointB.x}" y2="${pointB.y}"></line><line class="sky-selected-isolated-aspect" x1="${pointA.x}" y1="${pointA.y}" x2="${pointB.x}" y2="${pointB.y}" stroke="${r.aspect.color}"></line><circle class="sky-selected-aspect-center" cx="${MINI.cx}" cy="${MINI.cy}" r="3.5"></circle><g class="sky-selected-aspect-point sky-a" data-mini-placement="left" transform="translate(${pointA.x} ${pointA.y})"></g><g class="sky-selected-aspect-point sky-b" data-mini-placement="right" transform="translate(${pointB.x} ${pointB.y})"></g></svg><div class="relationship-mini-wheel-meta"><span class="relationship-mini-wheel-aspect" data-mini-aspect="${r.aspect.id}"></span><span class="relationship-mini-wheel-orb">${orb(r.orb)}</span></div></article>`
}
function cardMarkup(slot,c){return`<article class="understanding-card sky-${slot.toLowerCase()}" data-selected-card="${slot}" data-card-title="${esc(c.title)}" data-card-decan="${c.decan}"><span class="correspondence-label">Sky ${slot}</span><figure class="correspondence-card-art"><img src="${esc(c.image)}" alt="${esc(c.title)}"></figure><button class="ledger-entry" data-ledger-card="${esc(c.id)}">Tarot Ledger</button></article>`}
function mark(i){document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(x=>x.setAttribute('aria-current',Number(x.dataset.relationIndex)===i?'true':'false'))}
async function render(i,source){
  const r=relation(i),panel=ensure();if(!r||!panel)return;
  const t=++token;selectedIndex=i;mark(i);panel.hidden=false;panel.dataset.relationIndex=i;
  const a=card(r.left),b=card(r.right),body=panel.querySelector('.sky-selected-body');
  body.innerHTML=`<header class="understanding-header"><div><span>Selected relationship</span><small>Glyph → name → referent</small></div></header><div class="relationship-visual">${cardMarkup('A',a)}${miniWheelMarkup(r)}${cardMarkup('B',b)}</div><section class="sky-selected-progressive" aria-label="Progressive comparison reading"></section>`;
  const jobs=[
    renderSvgGroup(body.querySelector('[data-mini-aspect]'),r.aspect.id,r.aspect.color,'plain',12.5,1.8),
    renderSvgGroup(body.querySelector('[data-mini-placement="left"]'),r.left.id,COLORS.A,'circled',11.5,2.05),
    renderSvgGroup(body.querySelector('[data-mini-placement="right"]'),r.right.id,COLORS.B,'circled',11.5,2.05)
  ];
  body.querySelectorAll('[data-mini-sign]').forEach(node=>jobs.push(renderSvgGroup(node,node.dataset.miniSign,'#514b45','plain',8.4,1.5)));
  await Promise.allSettled(jobs);
  if(t!==token)return;
  window.dispatchEvent(new CustomEvent('relphi:selected-relationship-rendered',{detail:{index:i,relation:r,source,version:'understanding-v5-persistent-art'}}));
}
document.addEventListener('click',e=>{const panel=e.target.closest('#skySelectedRelationship');const ledger=e.target.closest('[data-ledger-card]');if(panel&&ledger){window.dispatchEvent(new CustomEvent('relphi:open-ledger-card',{detail:{cardId:ledger.dataset.ledgerCard,source:'selected-relationship'}}));return}const row=e.target.closest('.sky-foundation-relationship-row[data-relation-index]');if(row)queueMicrotask(()=>render(Number(row.dataset.relationIndex),'relationship-list'))});
window.addEventListener('relphi:sky-foundation-clear-selection',()=>{selectedIndex=null;if(ensure())mount.hidden=true});
function ready(force=false){const panel=ensure();if(!panel)return;if(selectedIndex!=null&&rowFor(selectedIndex)){if(force)render(selectedIndex,'foundation-rerender');return}const first=[...document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')].find(x=>!x.hidden);if(first)render(Number(first.dataset.relationIndex),'initial-relationship')}
window.addEventListener('relphi:sky-foundation-ready',()=>ready(true));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(()=>ready(false)),{once:true});else requestAnimationFrame(()=>ready(false));
})();
