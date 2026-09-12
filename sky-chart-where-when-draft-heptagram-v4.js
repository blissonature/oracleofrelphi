// Live Where and When preview. Renders directly into the footer-owned heptagram mount.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenDraftHeptagramV4)return;
window.__relphiSkyWhereWhenDraftHeptagramV4=true;
window.__relphiSkyWhereWhenDraftHeptagramV3=true;
window.__relphiSkyWhereWhenDraftHeptagramV2=true;
window.__relphiSkyWhereWhenDraftHeptagramV1=true;

const NS='http://www.w3.org/2000/svg';
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const COLORS={saturn:'#8c7a42',jupiter:'#41752f',mars:'#c9211e',sun:'#d08a00',venus:'#b23b79',mercury:'#277390',moon:'#58628a'};
const timers={A:0,B:0},renderToken={A:0,B:0};

function installStyle(){
  if(document.getElementById('skyWhereWhenDraftHeptagramStyleV4'))return;
  const node=document.createElement('style');node.id='skyWhereWhenDraftHeptagramStyleV4';
  node.textContent=`
    .sky-where-when-heptagram-slot{display:grid;place-items:center;align-content:start;row-gap:10px;width:100%;min-height:176px;padding:6px 0 8px;box-sizing:border-box;overflow:visible!important}
    .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"] [data-sky-heptagram-frame]{display:none!important}
    .sky-where-when-heptagram-slot [data-sky-heptagram-frame]{display:block;width:min(100%,176px);margin:0 auto}
    .sky-where-when-heptagram-slot [data-sky-heptagram-frame] .sky-ph-heptagram{display:block;width:100%;height:auto}
    .sky-where-when-draft-heptagram{display:block!important;width:min(100%,176px)!important;height:auto!important;max-height:176px!important;overflow:visible!important;margin:0 auto!important}
    .sky-where-when-heptagram-slot .sky-ph-jump{justify-self:center;max-width:100%;margin:0 auto}
    .sky-where-when-heptagram-slot .sky-ph-jump-title{white-space:nowrap}
  `;document.head.appendChild(node);
}
function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function mount(slot){return editor(slot)?.querySelector(`[data-ww-heptagram-slot="${slot}"]`)||null}
function field(form,name){return String(form?.querySelector(`[data-ww-field="${name}"]`)?.value||'').trim()}
function canonicalLocation(form){
  const inferred=form?.querySelector('.sky-location-confirmation[data-location-source="placement-inference"] .sky-inferred-location-value')?.textContent?.trim();
  if(inferred)return inferred;
  const rows=form?.querySelectorAll('.sky-location-confirmation p')||[],found=[...rows].find(node=>/^Location found:/i.test(String(node.textContent||'').trim()));
  return String(found?.textContent||'').replace(/^Location found:\s*/i,'').trim()||field(form,'location-query');
}
function packet(slot){
  const form=editor(slot);if(!form)return null;
  const date=field(form,'date'),time=field(form,'time'),timeZone=field(form,'timezone'),latitudeRaw=field(form,'latitude'),longitudeRaw=field(form,'longitude');
  if(!date||!time||!timeZone||latitudeRaw===''||longitudeRaw==='')return null;
  const latitude=Number(latitudeRaw),longitude=Number(longitudeRaw);if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-90||latitude>90||longitude<-180||longitude>180)return null;
  const DateTime=window.luxon?.DateTime;if(!DateTime)return null;const local=DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});if(!local.isValid)return null;
  return{date,time,timeZone,latitude,longitude,location:canonicalLocation(form),instant:local.toUTC().toJSDate(),instantIso:local.toUTC().toISO()};
}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone,setZone:true}).toJSDate()}
function solarFrame(p){
  if(!window.SunCalc||!window.luxon?.DateTime)return null;const local=window.luxon.DateTime.fromJSDate(p.instant).setZone(p.timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd');
  const today=SunCalc.getTimes(solarNoonDate(todayDate,p.timeZone),p.latitude,p.longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,p.timeZone),p.latitude,p.longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,p.timeZone),p.latitude,p.longitude),valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());
  if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))return null;
  return p.instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function weekdayRuler(instant,timeZone){return WEEKDAY_RULERS[window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday]||'sun'}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHours(frame,dayKey){const sequence=rotateHours(dayKey),daylight=frame.sunset-frame.sunrise,night=frame.end-frame.sunset,dayLength=daylight/12,nightLength=night/12;return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*dayLength:frame.sunset.getTime()+(index-12)*nightLength;return{ruler:sequence[index],start:new Date(start),end:new Date(start+(bright?dayLength:nightLength))}})}
function svg(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function line(parent,a,b,className){parent.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const f=Math.max(0,Math.min(1,Number(fraction)||0));line(parent,a,{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},className)}
function planetGroup(key,dayKey,hourKey){const p=point(key,142),group=svg('g',{class:`sky-ph-planet sky-ph-${key}`,style:`color:${COLORS[key]}`});if(key===dayKey)group.classList.add('is-day-ruler');if(key===hourKey)group.classList.add('is-hour-ruler');group.appendChild(svg('circle',{cx:p.x,cy:p.y,r:18,class:`sky-ph-node${key===dayKey?' day':''}${key===hourKey?' hour':''}`}));group.appendChild(svg('g',{transform:`translate(${p.x} ${p.y})`,class:'sky-ph-node-glyph'}));return group}
function buildPreview(p){
  const frame=solarFrame(p);if(!frame)return null;const dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHours(frame,dayKey);let currentIndex=rows.findIndex(row=>p.instant>=row.start&&p.instant<row.end);if(currentIndex<0)currentIndex=0;const current=rows[currentIndex],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey)),dayFraction=Math.max(0,Math.min(1,(p.instant-frame.start)/(frame.end-frame.start))),hourFraction=Math.max(0,Math.min(1,(p.instant-current.start)/(current.end-current.start)));
  const root=svg('svg',{viewBox:'0 0 360 360',preserveAspectRatio:'xMidYMid meet',class:'sky-ph-heptagram sky-where-when-draft-heptagram',role:'img','aria-label':`Draft Where and When heptagram. ${dayKey} planetary day; ${current.ruler} planetary hour.`});root.dataset.draftWhereWhen='true';root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-circle'}));root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-guide'}));
  for(let index=0;index<7;index++){const from=point(WEEK_PATH[index],142),to=point(WEEK_PATH[index+1],142);line(root,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(root,from,to,dayFraction,'sky-ph-week-segment current')}
  for(let index=0;index<7;index++)line(root,point(CHALDEAN[index],142),point(CHALDEAN[(index+1)%7],142),'sky-ph-hour-segment future');
  partialLine(root,point(current.ruler,142),point(CHALDEAN[(CHALDEAN.indexOf(current.ruler)+1)%7],142),hourFraction,'sky-ph-hour-segment current');CHALDEAN.forEach(key=>root.appendChild(planetGroup(key,dayKey,current.ruler)));return root;
}
function planetaryHoursHref(p){const params=new URLSearchParams();params.set('phShare','1');params.set('lat',String(p.latitude));params.set('lon',String(p.longitude));params.set('tz',p.timeZone);if(p.location)params.set('loc',p.location);if(p.instantIso)params.set('dt',p.instantIso);return'planetaryhours.html#'+params.toString()}
function clearDraft(target){target?.querySelectorAll('[data-draft-where-when-link="true"],[data-draft-where-when="true"],.sky-where-when-ph-jump').forEach(node=>node.remove());target?.removeAttribute('data-draft-heptagram-ready')}
async function renderNow(slot){
  timers[slot]=0;const token=++renderToken[slot],form=editor(slot),target=mount(slot);if(!form||!target)return;const p=packet(slot);clearDraft(target);if(!p)return;
  try{
    const preview=buildPreview(p);if(!preview)return;const jump=document.createElement('a');jump.className='sky-ph-jump';jump.dataset.draftWhereWhenLink='true';jump.href=planetaryHoursHref(p);const title=document.createElement('span');title.className='sky-ph-jump-title';title.textContent='Jump to this time in Planetary Hours';preview.style.visibility='hidden';jump.append(title,preview);target.append(jump);
    const canonical=window.RelphiSkyHeptagramCanonical;if(canonical?.correct)await canonical.correct(preview);if(token!==renderToken[slot]||!preview.isConnected)return;preview.style.visibility='visible';target.dataset.draftHeptagramReady='true';
  }catch(error){clearDraft(target);console.error('Where/When moment preview failed:',error)}
}
function schedule(slot,delay=0){if(!slot||!(slot in timers))return;clearTimeout(timers[slot]);timers[slot]=window.setTimeout(()=>void renderNow(slot),delay)}
function start(){
  installStyle();document.addEventListener('input',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,35)},true);document.addEventListener('change',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,10)},true);
  window.addEventListener('relphi:sky-where-when-editor-ready',event=>schedule(event.detail?.slot,0));window.addEventListener('relphi:sky-drawer-closed',event=>{if(event.detail?.drawer==='where'){const slot=event.detail?.slot;clearTimeout(timers[slot]);renderToken[slot]=(renderToken[slot]||0)+1}});
}
window.RelphiSkyWhereWhenDraftHeptagram=Object.freeze({render:schedule,refresh:()=>['A','B'].forEach(slot=>schedule(slot,0)),renderNow});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
