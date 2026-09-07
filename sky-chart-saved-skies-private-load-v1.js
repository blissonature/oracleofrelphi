// Concealed Saved Skies load list: identify records by the existing three-part Sky fingerprint, never by saved name.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesPrivateLoadV1)return;
window.__relphiSkySavedSkiesPrivateLoadV1=true;

const NS='http://www.w3.org/2000/svg';
const LIBRARY_KEY='relphiSkyLibraryV1';
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_RULERS=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const EXALTATIONS=['Sun','Moon','','Jupiter','','Mercury','Saturn','','','Mars','','Venus'];
const DECAN_RULERS=[['Mars','Sun','Venus'],['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],['Saturn','Jupiter','Mars'],['Sun','Venus','Mercury'],['Moon','Saturn','Jupiter'],['Mars','Sun','Venus'],['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],['Saturn','Jupiter','Mars']];
const DECAN_CARDS=[['two_of_wands','three_of_wands','four_of_wands'],['five_of_pentacles','six_of_pentacles','seven_of_pentacles'],['eight_of_swords','nine_of_swords','ten_of_swords'],['two_of_cups','three_of_cups','four_of_cups'],['five_of_wands','six_of_wands','seven_of_wands'],['eight_of_pentacles','nine_of_pentacles','ten_of_pentacles'],['two_of_swords','three_of_swords','four_of_swords'],['five_of_cups','six_of_cups','seven_of_cups'],['eight_of_wands','nine_of_wands','ten_of_wands'],['two_of_pentacles','three_of_pentacles','four_of_pentacles'],['five_of_swords','six_of_swords','seven_of_swords'],['eight_of_cups','nine_of_cups','ten_of_cups']];
const PLANET_NAMES=new Set(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']);
const OUTER_PLANET_CARDS={Uranus:'the_fool',Neptune:'the_hanged_man',Pluto:'judgement'};
const BODY_ALIASES={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',asc:'Ascendant',rising:'Ascendant',ascendant:'Ascendant',dsc:'Descendant',descendant:'Descendant',mc:'Midheaven',midheaven:'Midheaven',ic:'Imum Coeli','north-node':'North Node','north node':'North Node',node:'North Node','south-node':'South Node','south node':'South Node',chiron:'Chiron',lilith:'Lilith',vertex:'Vertex','part-of-fortune':'Part of Fortune','part of fortune':'Part of Fortune',fortune:'Part of Fortune'};
const ANGLE_IDS=new Set(['asc','ascendant','rising','dsc','descendant','mc','midheaven','ic','imumcoeli']);
const FALLBACK_COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const FALLBACK_SKY='#6c6259';
let queued=false;

const norm=value=>((Number(value)%360)+360)%360;
const normalized=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
function newId(){return `sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalized(record?.name)}`)}
function library(){const api=window.RelphiSkySavedSkyIdentity;const list=api?.library?.()||readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list:[]}

function migrateLegacyIds(){
  const list=readJson(LIBRARY_KEY,[]);if(!Array.isArray(list)||!list.length)return;
  let changed=false;
  list.forEach(record=>{if(record&&typeof record==='object'&&!String(record.id||record.savedSkyId||record?.metadata?.savedSkyId||'').trim()){record.id=newId();changed=true}});
  if(!changed||!writeJson(LIBRARY_KEY,list))return;
  try{window.dispatchEvent(new StorageEvent('storage',{key:LIBRARY_KEY,newValue:localStorage.getItem(LIBRARY_KEY),storageArea:localStorage}))}catch(_){window.dispatchEvent(new Event('storage'))}
  window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{action:'privacy-id-migration'}}));
}

function installStyle(){
  if(document.getElementById('skySavedSkiesPrivateLoadV1Style'))return;
  const style=document.createElement('style');style.id='skySavedSkiesPrivateLoadV1Style';style.textContent=`
#skySavedSkiesPopover .sky-saved-list-name,#skySavedSkiesPopover .sky-saved-list-meta{display:none!important}
#skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{grid-template-columns:minmax(0,1fr) 20px;grid-template-areas:"fingerprint check";min-height:60px;padding:6px 8px}
.sky-saved-fingerprint-triptych{grid-area:fingerprint;display:grid;grid-template-columns:48px 48px 30px;gap:9px;align-items:center;justify-content:start;min-width:0}
.sky-saved-fingerprint-piece{display:grid;place-items:center;width:48px;height:48px;min-width:0;overflow:visible}
.sky-saved-fingerprint-piece[data-fingerprint-part="card"]{width:30px}
.sky-saved-fingerprint-piece svg{display:block;width:44px;height:44px;max-width:100%;max-height:100%;overflow:visible}
.sky-saved-fingerprint-piece .sky-card-hits-fingerprint-strip{display:grid;place-items:center}
.sky-saved-fingerprint-piece .sky-card-hits-fingerprint-card{position:relative;display:block;width:22px;height:38px}
.sky-saved-fingerprint-piece .sky-card-hits-fingerprint-card img{display:block;width:22px;height:38px;object-fit:cover;border-radius:2px}
.sky-saved-fingerprint-piece .sky-card-hits-fingerprint-count{position:absolute;right:-6px;top:-5px;display:grid;place-items:center;min-width:15px;height:15px;padding:0 3px;border:1.5px solid #fff;border-radius:999px;background:#5f554d;color:#fff;font:900 8px/1 system-ui,sans-serif;box-sizing:border-box}
.sky-saved-fingerprint-empty{display:block;width:22px;height:22px;border:1px dashed rgba(31,27,24,.28);border-radius:999px}
@media(max-width:420px){.sky-saved-fingerprint-triptych{grid-template-columns:44px 44px 28px;gap:6px}.sky-saved-fingerprint-piece{width:44px;height:44px}}
`;
  document.head.appendChild(style);
}

function svg(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(key,radius,cx=180,cy=180){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:cx+Math.cos(angle)*radius,y:cy+Math.sin(angle)*radius}}
function line(parent,a,b,className){parent.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const f=Math.max(0,Math.min(1,Number(fraction)||0));line(parent,a,{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},className)}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone,setZone:true}).toJSDate()}
function timingPacket(payload){
  const profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
  const timeZone=String(profile.timeZone||payload?.timeZone||'').trim(),latitude=Number(profile.latitude??payload?.latitude),longitude=Number(profile.longitude??payload?.longitude);
  if(!timeZone||!Number.isFinite(latitude)||!Number.isFinite(longitude)||!window.luxon?.DateTime)return null;
  let instant=null;const direct=String(profile.instant||payload?.instant||'').trim();
  if(direct){const parsed=new Date(direct);if(!Number.isNaN(parsed.getTime()))instant=parsed}
  if(!instant){const raw=String(profile.dateTime||payload?.dateTime||'').trim();if(raw){const local=window.luxon.DateTime.fromISO(raw,{zone:timeZone,setZone:true});if(local.isValid)instant=local.toUTC().toJSDate()}}
  return instant?{timeZone,latitude,longitude,instant}:null;
}
function solarFrame(packet){
  if(!window.SunCalc||!window.luxon?.DateTime)return null;
  const local=window.luxon.DateTime.fromJSDate(packet.instant).setZone(packet.timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd');
  const today=SunCalc.getTimes(solarNoonDate(todayDate,packet.timeZone),packet.latitude,packet.longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,packet.timeZone),packet.latitude,packet.longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,packet.timeZone),packet.latitude,packet.longitude);
  const valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))return null;
  return packet.instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function weekdayRuler(instant,timeZone){const weekday=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday;return WEEKDAY_RULERS[weekday]||'sun'}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHours(frame,dayKey){const sequence=rotateHours(dayKey),daylight=frame.sunset-frame.sunrise,night=frame.end-frame.sunset,dayLength=daylight/12,nightLength=night/12;return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*dayLength:frame.sunset.getTime()+(index-12)*nightLength;return{ruler:sequence[index],start:new Date(start),end:new Date(start+(bright?dayLength:nightLength))}})}
function whereFingerprint(payload){
  const packet=timingPacket(payload),frame=packet&&solarFrame(packet);if(!packet||!frame)return null;
  const dayKey=weekdayRuler(frame.start,packet.timeZone),rows=planetaryHours(frame,dayKey);let currentIndex=rows.findIndex(row=>packet.instant>=row.start&&packet.instant<row.end);if(currentIndex<0)currentIndex=0;
  const current=rows[currentIndex],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey)),dayFraction=Math.max(0,Math.min(1,(packet.instant-frame.start)/(frame.end-frame.start))),hourFraction=Math.max(0,Math.min(1,(packet.instant-current.start)/(current.end-current.start)));
  const root=svg('svg',{viewBox:'0 0 360 360',preserveAspectRatio:'xMidYMid meet',class:'sky-where-fingerprint-heptagram','aria-hidden':'true',focusable:'false'});
  for(let index=0;index<7;index++){const from=point(WEEK_PATH[index],142),to=point(WEEK_PATH[index+1],142);line(root,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(root,from,to,dayFraction,'sky-ph-week-segment current')}
  partialLine(root,point(current.ruler,142),point(CHALDEAN[(CHALDEAN.indexOf(current.ruler)+1)%7],142),hourFraction,'sky-ph-hour-segment current');
  return root;
}

function placementSource(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),raw=known||payload;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGN_NAMES.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function placementName(key,item){return String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||item?.glyphId||key||'').trim()}
function normalizedId(name){return String(name||'').toLowerCase().replace(/[\s_-]+/g,'')}
function placementRecords(payload){return placementSource(payload).map(([key,item],index)=>{const value=longitude(item);if(!Number.isFinite(value))return null;const name=placementName(key,item),id=normalizedId(name);return{index,key,item,name,id,value}}).filter(Boolean)}
function polar(cx,cy,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:cx+radius*Math.cos(angle),y:cy+radius*Math.sin(angle)}}
function annularPath(cx,cy,inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=polar(cx,cy,outer,start),b=polar(cx,cy,outer,start+span),c=polar(cx,cy,inner,start+span),d=polar(cx,cy,inner,start);return`M${a.x.toFixed(3)} ${a.y.toFixed(3)} A${outer} ${outer} 0 ${large} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} L${c.x.toFixed(3)} ${c.y.toFixed(3)} A${inner} ${inner} 0 ${large} 0 ${d.x.toFixed(3)} ${d.y.toFixed(3)} Z`}
function axisValue(records,primaryIds,oppositeIds){const primary=records.find(record=>primaryIds.includes(record.id));if(primary)return primary.value;const opposite=records.find(record=>oppositeIds.includes(record.id));return opposite?norm(opposite.value+180):NaN}
function addAxis(root,cx,cy,radius,degree,className){if(!Number.isFinite(degree))return;const a=polar(cx,cy,radius,degree),b=polar(cx,cy,radius,degree+180);root.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function placementsFingerprint(payload){
  const records=placementRecords(payload),ordinary=records.filter(record=>!ANGLE_IDS.has(record.id));if(!records.length)return null;
  const colors=window.RelphiSkyWheelSpec?.COLORS||FALLBACK_COLORS,skyColor=FALLBACK_SKY,root=svg('svg',{viewBox:'13 0 38 38',preserveAspectRatio:'xMidYMid meet','aria-hidden':'true',focusable:'false',class:'sky-placement-fingerprint-wheel'}),cx=32,cy=19,inner=15,outer=18;
  for(let index=0;index<12;index++){root.appendChild(svg('path',{d:annularPath(cx,cy,inner,outer,index*30,index*30+30),fill:colors[index]||'#ddd','fill-opacity':'.88'}));const a=polar(cx,cy,inner,index*30),b=polar(cx,cy,outer,index*30);root.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'sky-placement-fingerprint-sign-divider'}))}
  root.appendChild(svg('circle',{cx,cy,r:inner,fill:'#fffdfa',stroke:'rgba(44,38,33,.28)','stroke-width':'.65'}));
  addAxis(root,cx,cy,14.6,axisValue(records,['asc','ascendant','rising'],['dsc','descendant']),'sky-placement-fingerprint-axis sky-placement-fingerprint-horizon');addAxis(root,cx,cy,14.6,axisValue(records,['mc','midheaven'],['ic','imumcoeli']),'sky-placement-fingerprint-axis sky-placement-fingerprint-meridian');
  const bins=Array.from({length:12},()=>0);ordinary.forEach(record=>{bins[Math.floor(norm(record.value)/30)]+=1});const silhouette=bins.map((count,index)=>polar(cx,cy,4.7+Math.min(4,count)*2.05,index*30+15));if(ordinary.length)root.appendChild(svg('polygon',{points:silhouette.map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),fill:skyColor,'fill-opacity':'.20',stroke:skyColor,'stroke-opacity':'.58','stroke-width':'.72','stroke-linejoin':'round'}));ordinary.forEach(record=>{const p=polar(cx,cy,12.35,record.value);root.appendChild(svg('circle',{cx:p.x,cy:p.y,r:ordinary.length>18?1.05:1.3,fill:skyColor,stroke:'#fff','stroke-width':'.62'}))});return root;
}

function cards(){return Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]}
function cardById(id){return cards().find(card=>card.card_id===id||card.stable_symbol_id===id)||null}
function splitValues(value){return String(value||'').split(',').map(item=>item.trim()).filter(Boolean)}
function bodyName(key,item){for(const candidate of[item?.name,item?.label,item?.body,item?.planet,item?.point,item?.id,item?.glyphId,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=raw.toLowerCase().replace(/_/g,'-');if(BODY_ALIASES[id])return BODY_ALIASES[id];const entry=window.RelphiGlyphRegistry?.resolve?.(raw)||window.RelphiGlyphRegistry?.get?.(raw);if(entry?.name)return entry.name}return String(key||'Placement')}
function cardRecords(payload){return placementSource(payload).map(([key,item],index)=>{const value=longitude(item);if(!Number.isFinite(value))return null;const signIndex=Math.floor(value/30),within=value-signIndex*30,degree=Math.floor(within);return{id:`${index}:${key}`,body:bodyName(key,item),signIndex,sign:SIGN_NAMES[signIndex],decan:Math.min(2,Math.floor(degree/10))}}).filter(Boolean)}
function cardForPlanet(planet){return cards().find(card=>card.arcana==='Major'&&splitValues(card.astrology?.planet).includes(planet))||cardById(OUTER_PLANET_CARDS[planet])}
function cardForSign(sign){return cards().find(card=>card.arcana==='Major'&&splitValues(card.astrology?.sign).includes(sign))||null}
function cardForDecan(record){return cardById(DECAN_CARDS[record.signIndex]?.[record.decan])}
function displayName(card){return String(card?.name||card?.title||card?.card_name||card?.card_id||'Card').replace(/_/g,' ')}
function thumbnailFor(card,w=22,h=38){const id=encodeURIComponent(card?.card_id||card?.stable_symbol_id||''),source=new URL(`assets/tarot/rws/${id}.webp`,document.baseURI).href,thumb=new URL('https://wsrv.nl/');thumb.searchParams.set('url',source);thumb.searchParams.set('w',String(w));thumb.searchParams.set('h',String(h));thumb.searchParams.set('fit','cover');thumb.searchParams.set('output','webp');thumb.searchParams.set('q','50');return thumb.href}
function associationCards(record){const found=[];if(PLANET_NAMES.has(record.body))found.push(cardForPlanet(record.body));found.push(cardForSign(record.sign),cardForDecan(record),cardForPlanet(SIGN_RULERS[record.signIndex]));const exalted=EXALTATIONS[record.signIndex];if(exalted)found.push(cardForPlanet(exalted));const decanRuler=DECAN_RULERS[record.signIndex]?.[record.decan];if(decanRuler)found.push(cardForPlanet(decanRuler));return found.filter(Boolean)}
function strongestCard(payload){const tally=new Map();cardRecords(payload).forEach(record=>{const seen=new Set();associationCards(record).forEach(card=>{const id=card.card_id||card.stable_symbol_id;if(!id||seen.has(id))return;seen.add(id);let hit=tally.get(id);if(!hit){hit={id,card,count:0};tally.set(id,hit)}hit.count+=1})});return Array.from(tally.values()).sort((a,b)=>b.count-a.count||displayName(a.card).localeCompare(displayName(b.card)))[0]||null}
function cardFingerprint(payload){const hit=strongestCard(payload);if(!hit)return null;const strip=document.createElement('span');strip.className='sky-card-hits-fingerprint-strip';const card=document.createElement('span');card.className='sky-card-hits-fingerprint-card';const image=document.createElement('img');image.src=thumbnailFor(hit.card);image.alt='';image.width=22;image.height=38;image.loading='lazy';image.decoding='async';card.appendChild(image);const chip=document.createElement('span');chip.className='sky-card-hits-fingerprint-count';chip.textContent=String(hit.count);card.appendChild(chip);strip.appendChild(card);return strip}

function piece(part,node){const mount=document.createElement('span');mount.className='sky-saved-fingerprint-piece';mount.dataset.fingerprintPart=part;if(node)mount.appendChild(node);else{const empty=document.createElement('span');empty.className='sky-saved-fingerprint-empty';empty.setAttribute('aria-hidden','true');mount.appendChild(empty)}return mount}
function triptych(record){const root=document.createElement('span');root.className='sky-saved-fingerprint-triptych';root.setAttribute('aria-hidden','true');root.append(piece('where',whereFingerprint(record)),piece('placements',placementsFingerprint(record)),piece('card',cardFingerprint(record)));return root}

function redactLoadList(){
  queued=false;const menu=document.getElementById('skySavedSkiesPopover');if(!menu||menu.hidden)return;
  const head=menu.querySelector('.sky-saved-subview-head strong');if(!head||String(head.textContent||'').trim()!=='Load Sky')return;
  const byRef=new Map(library().map(record=>[recordRef(record),record]));
  menu.querySelectorAll('.sky-saved-list-row').forEach(row=>{
    const item=row.querySelector('[data-saved-sky-ref]');if(!item)return;const ref=String(item.dataset.savedSkyRef||''),record=byRef.get(ref);if(!record)return;
    if(item.dataset.privateSkyFingerprint!=='true'){
      const current=row.classList.contains('is-active'),check=document.createElement('span');check.className='sky-saved-list-check';check.setAttribute('aria-hidden','true');check.textContent=current?'✓':'';
      item.replaceChildren(triptych(record),check);item.dataset.privateSkyFingerprint='true';item.setAttribute('aria-label','Load this concealed saved sky.');item.removeAttribute('title');
    }
    const del=row.querySelector('[data-saved-delete-ref]');if(del){del.setAttribute('aria-label','Delete this concealed saved sky from Saved skies');del.title='Delete concealed saved sky'}
    const confirmation=row.querySelector('.sky-saved-delete-confirmation');if(confirmation)confirmation.setAttribute('aria-label','Delete this concealed saved sky?');
  });
}
function schedule(){if(queued)return;queued=true;queueMicrotask(redactLoadList)}
function start(){installStyle();migrateLegacyIds();schedule();new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',schedule,true);window.addEventListener('relphi:saved-sky-library-changed',schedule)}
window.RelphiSkyPrivateLoad=Object.freeze({redact:schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
