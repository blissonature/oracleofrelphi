// Data-derived fingerprints for collapsed Where and When, Placements, and Card Hits drawers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyDrawerFingerprintsV1)return;
window.__relphiSkyDrawerFingerprintsV1=true;

const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const FALLBACK_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const FALLBACK_SKY={A:'#c9211e',B:'#2462d0'};
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ANGLE_IDS=new Set(['asc','ascendant','rising','dsc','descendant','mc','midheaven','ic','imumcoeli']);
let queued=false;

const norm=value=>((Number(value)%360)+360)%360;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){
  if(!payload||typeof payload!=='object')return[];
  const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object');
  const raw=known||payload;
  if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
  return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
}
function longitude(item){
  if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
  const signName=String(item?.sign||item?.zodiac||'').trim().toLowerCase();
  const signIndex=SIGN_NAMES.findIndex(sign=>sign.toLowerCase()===signName);
  return signIndex<0?NaN:norm(signIndex*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
}
function recordName(key,item){return String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||item?.glyphId||key||'').trim()}
function normalizedId(name){return String(name||'').toLowerCase().replace(/[\s_-]+/g,'')}
function placementRecords(payload){return source(payload).map(([key,item])=>{const value=longitude(item);if(!Number.isFinite(value))return null;const name=recordName(key,item),id=normalizedId(name);return{name,id,value,item}}).filter(Boolean)}
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function polar(cx,cy,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)}}
function annularPath(cx,cy,inner,outer,start,end){
  const span=norm(end-start)||360,large=span>180?1:0;
  const a=polar(cx,cy,outer,start),b=polar(cx,cy,outer,start+span),c=polar(cx,cy,inner,start+span),d=polar(cx,cy,inner,start);
  return`M${a.x.toFixed(3)} ${a.y.toFixed(3)} A${outer} ${outer} 0 ${large} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} L${c.x.toFixed(3)} ${c.y.toFixed(3)} A${inner} ${inner} 0 ${large} 0 ${d.x.toFixed(3)} ${d.y.toFixed(3)} Z`;
}
function axisValue(records,primaryIds,oppositeIds){const primary=records.find(record=>primaryIds.includes(record.id));if(primary)return primary.value;const opposite=records.find(record=>oppositeIds.includes(record.id));return opposite?norm(opposite.value+180):NaN}
function addAxis(root,cx,cy,radius,degree,className){if(!Number.isFinite(degree))return;const a=polar(cx,cy,radius,degree),b=polar(cx,cy,radius,degree+180);root.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function whereMount(slot){return window.RelphiSkyCardShell?.get?.(slot)?.whereFingerprint||null}
function placementMount(slot){return window.RelphiSkyCardShell?.get?.(slot)?.placementFingerprint||null}
function cardHitsMount(slot){return window.RelphiSkyCardShell?.get?.(slot)?.cardHitsFingerprint||null}

function stripCloneIdentity(root){
  root.removeAttribute('id');root.removeAttribute('role');root.removeAttribute('aria-label');root.removeAttribute('data-sky-heptagram');
  root.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
}
function renderWhere(slot,payload){
  const mount=whereMount(slot);if(!mount)return;
  const refs=window.RelphiSkyCardShell?.get?.(slot),sourceSvg=refs?.heptagram,profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  const complete=!!(profile.dateTime&&profile.location&&profile.timeZone&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude)));
  mount.replaceChildren();
  if(!complete||!sourceSvg||sourceSvg.dataset.canonicalSourceReady!=='true'||sourceSvg.dataset.canonicalHeptagramReady!=='true'){
    mount.hidden=true;mount.removeAttribute('aria-label');return;
  }
  const clone=sourceSvg.cloneNode(true);stripCloneIdentity(clone);clone.classList.add('sky-where-fingerprint-heptagram');clone.setAttribute('aria-hidden','true');clone.setAttribute('focusable','false');
  mount.appendChild(clone);mount.hidden=false;
  mount.setAttribute('aria-label',`Where and When fingerprint for Sky ${slot}: current planetary-hours heptagram.`);
}

function renderPlacements(slot,payload){
  const mount=placementMount(slot);if(!mount)return;
  const records=placementRecords(payload),ordinary=records.filter(record=>!ANGLE_IDS.has(record.id));
  mount.replaceChildren();
  if(!records.length){mount.hidden=true;mount.removeAttribute('aria-label');return}
  mount.hidden=false;
  const colors=window.RelphiSkyWheelSpec?.COLORS||FALLBACK_COLORS;
  const skyColor=window.RelphiSkyWheelSpec?.SKY?.[slot]||FALLBACK_SKY[slot];
  const root=svg('svg',{viewBox:'0 0 64 38','aria-hidden':'true',focusable:'false',class:'sky-placement-fingerprint-wheel'});
  const cx=32,cy=19,inner=15,outer=18;
  for(let index=0;index<12;index+=1){
    root.appendChild(svg('path',{d:annularPath(cx,cy,inner,outer,index*30,index*30+30),fill:colors[index]||'#ddd','fill-opacity':'.88'}));
    const a=polar(cx,cy,inner,index*30),b=polar(cx,cy,outer,index*30);
    root.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'sky-placement-fingerprint-sign-divider'}));
  }
  root.appendChild(svg('circle',{cx,cy,r:inner,fill:'#fffdfa',stroke:'rgba(44,38,33,.28)','stroke-width':'.65'}));
  addAxis(root,cx,cy,14.6,axisValue(records,['asc','ascendant','rising'],['dsc','descendant']),'sky-placement-fingerprint-axis sky-placement-fingerprint-horizon');
  addAxis(root,cx,cy,14.6,axisValue(records,['mc','midheaven'],['ic','imumcoeli']),'sky-placement-fingerprint-axis sky-placement-fingerprint-meridian');
  const bins=Array.from({length:12},()=>0);
  ordinary.forEach(record=>{bins[Math.floor(norm(record.value)/30)]+=1});
  const silhouette=bins.map((count,index)=>polar(cx,cy,4.7+Math.min(4,count)*2.05,index*30+15));
  if(ordinary.length)root.appendChild(svg('polygon',{points:silhouette.map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),fill:skyColor,'fill-opacity':'.20',stroke:skyColor,'stroke-opacity':'.58','stroke-width':'.72','stroke-linejoin':'round'}));
  ordinary.forEach(record=>{const point=polar(cx,cy,12.35,record.value);root.appendChild(svg('circle',{cx:point.x,cy:point.y,r:ordinary.length>18?1.05:1.3,fill:skyColor,stroke:'#fff','stroke-width':'.62'}))});
  mount.appendChild(root);
  const asc=axisValue(records,['asc','ascendant','rising'],['dsc','descendant']),mc=axisValue(records,['mc','midheaven'],['ic','imumcoeli']);
  const axes=[Number.isFinite(asc)?'Ascendant':'',Number.isFinite(mc)?'Midheaven':''].filter(Boolean).join(' and ');
  mount.setAttribute('aria-label',`Placements fingerprint: ${ordinary.length} plotted placement${ordinary.length===1?'':'s'}${axes?`, oriented by ${axes}`:''}.`);
}

function renderCardHits(slot){
  const mount=cardHitsMount(slot);if(!mount)return;
  const api=window.RelphiSkyCardHitsDrawer,hits=api?.getHits?.(slot)||[];
  mount.replaceChildren();
  if(!hits.length){mount.hidden=true;mount.removeAttribute('aria-label');return}
  mount.hidden=false;
  const strip=document.createElement('span');strip.className='sky-card-hits-fingerprint-strip';
  const shown=hits.slice(0,3);
  shown.forEach(hit=>{
    const card=document.createElement('span');card.className='sky-card-hits-fingerprint-card';
    const image=document.createElement('img');image.src=api.thumbnailFor(hit.card,16,28);image.alt='';image.width=16;image.height=28;image.loading='lazy';image.decoding='async';card.appendChild(image);
    const chip=document.createElement('span');chip.className='sky-card-hits-fingerprint-count';chip.textContent=String(hit.count);card.appendChild(chip);strip.appendChild(card);
  });
  if(hits.length>shown.length){const more=document.createElement('span');more.className='sky-card-hits-fingerprint-more';more.textContent=`+${hits.length-shown.length}`;strip.appendChild(more)}
  mount.appendChild(strip);
  const strongest=shown.map(hit=>`${api.displayName(hit.card)} ×${hit.count}`).join(', ');
  mount.setAttribute('aria-label',`Card Hits fingerprint: ${hits.length} cards. Strongest hits: ${strongest}.`);
}

function renderSlot(slot){const payload=read(slot);renderWhere(slot,payload);renderPlacements(slot,payload);renderCardHits(slot)}
function render(){queued=false;renderSlot('A');renderSlot('B')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
function relevantStorage(event){return !event.key||Object.values(KEYS).includes(event.key)}

window.addEventListener('storage',event=>{if(relevantStorage(event))schedule()});
['relphi:sky-foundation-ready','relphi:sky-heptagram-source-ready','relphi:sky-live-origin-changed','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed'].forEach(name=>window.addEventListener(name,schedule));
window.RelphiSkyDrawerFingerprints=Object.freeze({render:schedule});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
