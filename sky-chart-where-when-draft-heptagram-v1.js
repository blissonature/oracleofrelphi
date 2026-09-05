// Live Where and When draft heptagram: preview the form's current time/place without mutating the committed Sky.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenDraftHeptagramV1)return;
window.__relphiSkyWhereWhenDraftHeptagramV1=true;

const NS='http://www.w3.org/2000/svg';
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const COLORS={saturn:'#8c7a42',jupiter:'#41752f',mars:'#c9211e',sun:'#d08a00',venus:'#b23b79',mercury:'#277390',moon:'#58628a'};
const SYMBOLS={saturn:'♄',jupiter:'♃',mars:'♂',sun:'☉',venus:'♀',mercury:'☿',moon:'☾'};
const timers={A:0,B:0};
let observer=null;

function style(){
  if(document.getElementById('skyWhereWhenDraftHeptagramStyle'))return;
  const node=document.createElement('style');node.id='skyWhereWhenDraftHeptagramStyle';
  node.textContent=`
    html[data-sky-where-when-editing="true"] .sky-where-when-heptagram-slot [data-sky-heptagram-frame]{display:none!important}
    .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"]{display:grid!important;place-items:center;width:100%;min-height:226px;padding:2px 0 0;box-sizing:border-box}
    .sky-where-when-draft-heptagram{display:block;width:min(100%,240px)!important;height:auto!important;max-height:none!important;overflow:visible;margin:0 auto}
    .sky-where-when-draft-heptagram .sky-ph-node-label{font-size:16px;font-weight:850}
    @media(max-width:620px){
      .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"]{min-height:214px}
      .sky-where-when-draft-heptagram{width:min(100%,224px)!important}
    }
  `;
  document.head.appendChild(node);
}
function svg(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function line(parent,a,b,className){parent.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const f=Math.max(0,Math.min(1,Number(fraction)||0));line(parent,a,{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},className)}
function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function mount(slot){return editor(slot)?.querySelector(`[data-ww-heptagram-slot="${slot}"]`)||null}
function field(form,name){return String(form?.querySelector(`[data-ww-field="${name}"]`)?.value||'').trim()}
function packet(slot){
  const form=editor(slot);if(!form)return null;
  const date=field(form,'date'),time=field(form,'time'),timeZone=field(form,'timezone'),latitude=Number(field(form,'latitude')),longitude=Number(field(form,'longitude'));
  if(!date||!time||!timeZone||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-90||latitude>90||longitude<-180||longitude>180)return null;
  const DateTime=window.luxon?.DateTime;if(!DateTime)return null;
  const local=DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});if(!local.isValid)return null;
  return{date,time,timeZone,latitude,longitude,instant:local.toUTC().toJSDate()};
}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone}).toJSDate()}
function solarFrame(p){
  if(!window.SunCalc)return null;
  const local=window.luxon.DateTime.fromJSDate(p.instant).setZone(p.timeZone),todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd');
  const today=SunCalc.getTimes(solarNoonDate(todayDate,p.timeZone),p.latitude,p.longitude),previous=SunCalc.getTimes(solarNoonDate(previousDate,p.timeZone),p.latitude,p.longitude),next=SunCalc.getTimes(solarNoonDate(nextDate,p.timeZone),p.latitude,p.longitude),valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());
  if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))return null;
  return p.instant>=today.sunrise?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}:{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function weekdayRuler(instant,timeZone){const weekday=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday;return WEEKDAY_RULERS[weekday]||'sun'}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHours(frame,dayKey){
  const sequence=rotateHours(dayKey),daylight=frame.sunset.getTime()-frame.sunrise.getTime(),night=frame.end.getTime()-frame.sunset.getTime(),dayLength=daylight/12,nightLength=night/12;
  return Array.from({length:24},(_,index)=>{const bright=index<12,start=bright?frame.sunrise.getTime()+index*dayLength:frame.sunset.getTime()+(index-12)*nightLength,end=start+(bright?dayLength:nightLength);return{ruler:sequence[index],start:new Date(start),end:new Date(end)}});
}
function stripIds(root){root.removeAttribute?.('id');root.querySelectorAll?.('[id]').forEach(node=>node.removeAttribute('id'));return root}
function sourcePlanet(key){
  const source=document.querySelector(`.sky-ph-heptagram .sky-ph-${key}`);return source?stripIds(source.cloneNode(true)):null;
}
function planetGroup(key,dayKey,hourKey){
  const p=point(key,142),group=sourcePlanet(key)||svg('g',{class:`sky-ph-planet sky-ph-${key}`,style:`color:${COLORS[key]}`});
  group.classList.remove('is-day-ruler','is-hour-ruler');if(key===dayKey)group.classList.add('is-day-ruler');if(key===hourKey)group.classList.add('is-hour-ruler');group.style.color=COLORS[key];
  let circle=group.querySelector(':scope > .sky-ph-node');if(!circle){circle=svg('circle',{class:'sky-ph-node'});group.prepend(circle)}
  circle.setAttribute('cx',String(p.x));circle.setAttribute('cy',String(p.y));circle.setAttribute('r','18');circle.setAttribute('class',`sky-ph-node${key===dayKey?' day':''}${key===hourKey?' hour':''}`);
  let glyph=group.querySelector(':scope > .sky-ph-node-glyph');
  if(glyph)glyph.setAttribute('transform',`translate(${p.x} ${p.y})`);
  else{
    let label=group.querySelector(':scope > .sky-ph-node-label');if(!label){label=svg('text',{class:'sky-ph-node-label'});group.appendChild(label)}
    label.setAttribute('x',String(p.x));label.setAttribute('y',String(p.y));label.textContent=SYMBOLS[key];
  }
  return group;
}
function buildPreview(p){
  const frame=solarFrame(p);if(!frame)return null;
  const dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHours(frame,dayKey),currentIndex=Math.max(0,rows.findIndex(row=>p.instant>=row.start&&p.instant<row.end)),current=rows[currentIndex]||rows[0],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey));
  const dayFraction=Math.max(0,Math.min(1,(p.instant.getTime()-frame.start.getTime())/(frame.end.getTime()-frame.start.getTime()))),hourFraction=Math.max(0,Math.min(1,(p.instant.getTime()-current.start.getTime())/(current.end.getTime()-current.start.getTime())));
  const root=svg('svg',{viewBox:'18 18 324 324',preserveAspectRatio:'xMidYMid meet',class:'sky-ph-heptagram sky-where-when-draft-heptagram',role:'img','aria-label':`Draft Where and When heptagram. ${dayKey} planetary day; ${current.ruler} planetary hour.`});
  root.dataset.draftWhereWhen='true';
  root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-circle'}));root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-guide'}));
  for(let index=0;index<7;index++){
    const from=point(WEEK_PATH[index],142),to=point(WEEK_PATH[index+1],142);line(root,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);if(index===weekIndex)partialLine(root,from,to,dayFraction,'sky-ph-week-segment current');
  }
  for(let index=0;index<7;index++){const from=point(CHALDEAN[index],142),to=point(CHALDEAN[(index+1)%7],142);line(root,from,to,'sky-ph-hour-segment future')}
  partialLine(root,point(current.ruler,142),point(CHALDEAN[(CHALDEAN.indexOf(current.ruler)+1)%7],142),hourFraction,'sky-ph-hour-segment current');
  CHALDEAN.forEach(key=>root.appendChild(planetGroup(key,dayKey,current.ruler)));
  return root;
}
function clear(slot){const target=mount(slot);if(!target)return;target.querySelector('[data-draft-where-when="true"]')?.remove();target.removeAttribute('data-draft-heptagram-ready')}
function render(slot){
  timers[slot]=0;const target=mount(slot);if(!target)return;
  const p=packet(slot);target.querySelector('[data-draft-where-when="true"]')?.remove();
  if(!p){target.hidden=true;target.removeAttribute('data-draft-heptagram-ready');return}
  try{
    const preview=buildPreview(p);if(!preview){target.hidden=true;target.removeAttribute('data-draft-heptagram-ready');return}
    target.appendChild(preview);target.hidden=false;target.dataset.draftHeptagramReady='true';
  }catch(error){target.hidden=true;target.removeAttribute('data-draft-heptagram-ready');console.error('Where/When draft heptagram failed:',error)}
}
function schedule(slot,delay=0){if(!slot||!(slot in timers))return;clearTimeout(timers[slot]);timers[slot]=window.setTimeout(()=>render(slot),delay)}
function scheduleOpenEditors(delay=0){['A','B'].forEach(slot=>{if(editor(slot))schedule(slot,delay)})}
function installObserver(){
  if(observer)return;observer=new MutationObserver(records=>{if(records.some(record=>record.type==='childList'||record.type==='characterData'))scheduleOpenEditors(20)});observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function start(){
  style();installObserver();scheduleOpenEditors();
  document.addEventListener('input',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,40)},true);
  document.addEventListener('change',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,20)},true);
  document.addEventListener('click',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;const slot=form.dataset.slot;schedule(slot,0);schedule(slot,120)},true);
  window.addEventListener('relphi:sky-where-when-edit-state-changed',()=>requestAnimationFrame(()=>scheduleOpenEditors(0)));
  window.addEventListener('relphi:sky-heptagram-canonical-ready',()=>scheduleOpenEditors(0));
  window.addEventListener('relphi:sky-heptagram-source-ready',()=>scheduleOpenEditors(0));
}
window.RelphiSkyWhereWhenDraftHeptagram=Object.freeze({render:schedule,refresh:()=>scheduleOpenEditors(0)});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
