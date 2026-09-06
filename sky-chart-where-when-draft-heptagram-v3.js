// Live Where and When moment preview v3. The draft moment renders before commit
// with the same canonical heptagram glyph system used by the committed Sky.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenDraftHeptagramV3)return;
window.__relphiSkyWhereWhenDraftHeptagramV3=true;
window.__relphiSkyWhereWhenDraftHeptagramV2=true;
window.__relphiSkyWhereWhenDraftHeptagramV1=true;

const NS='http://www.w3.org/2000/svg';
const CHALDEAN=['saturn','jupiter','mars','sun','venus','mercury','moon'];
const WEEK_PATH=['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
const WEEKDAY_RULERS={1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn',7:'sun'};
const COLORS={saturn:'#8c7a42',jupiter:'#41752f',mars:'#c9211e',sun:'#d08a00',venus:'#b23b79',mercury:'#277390',moon:'#58628a'};
const timers={A:0,B:0};
const renderToken={A:0,B:0};
let observer=null;

function installStyle(){
  if(document.getElementById('skyWhereWhenDraftHeptagramStyleV3'))return;
  const node=document.createElement('style');
  node.id='skyWhereWhenDraftHeptagramStyleV3';
  node.textContent=`
    html[data-sky-where-when-editing="true"] .sky-where-when-heptagram-slot [data-sky-heptagram-frame]{display:none!important}
    .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"]{
      display:grid!important;grid-template-rows:auto auto;place-items:center;width:100%;min-height:0!important;padding:4px 0 6px;box-sizing:border-box
    }
    .sky-where-when-draft-heptagram{
      display:block!important;width:min(100%,176px)!important;height:auto!important;min-height:0!important;max-height:176px!important;overflow:visible!important;margin:0 auto!important
    }
    .sky-where-when-ph-jump{
      display:inline-flex;align-items:center;justify-content:center;max-width:100%;margin:1px auto 0;padding:.2rem .35rem;
      color:#5b1715;font:850 .64rem/1.25 system-ui,sans-serif;text-align:center;text-decoration:underline;text-underline-offset:3px
    }
    .sky-where-when-ph-jump:hover,.sky-where-when-ph-jump:focus-visible{
      color:#9f1b18;outline:2px solid rgba(201,33,30,.16);outline-offset:2px;border-radius:5px
    }
    @media(max-width:620px){
      .sky-where-when-draft-heptagram{width:min(100%,162px)!important;max-height:162px!important}
      .sky-where-when-ph-jump{font-size:.66rem}
    }
  `;
  document.head.appendChild(node);
}

function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function mount(slot){return editor(slot)?.querySelector(`[data-ww-heptagram-slot="${slot}"]`)||null}
function field(form,name){return String(form?.querySelector(`[data-ww-field="${name}"]`)?.value||'').trim()}
function canonicalLocation(form){
  const rows=form?.querySelectorAll('.sky-location-confirmation p')||[];
  const found=rows.length>1?String(rows[1].textContent||'').replace(/^Location found:\s*/i,'').trim():'';
  return found||field(form,'location-query');
}
function packet(slot){
  const form=editor(slot);if(!form)return null;
  const date=field(form,'date'),time=field(form,'time'),timeZone=field(form,'timezone');
  const latitudeRaw=field(form,'latitude'),longitudeRaw=field(form,'longitude');
  if(!date||!time||!timeZone||latitudeRaw===''||longitudeRaw==='')return null;
  const latitude=Number(latitudeRaw),longitude=Number(longitudeRaw);
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude<-90||latitude>90||longitude<-180||longitude>180)return null;
  const DateTime=window.luxon?.DateTime;if(!DateTime)return null;
  const local=DateTime.fromISO(`${date}T${time}`,{zone:timeZone,setZone:true});
  if(!local.isValid)return null;
  return{date,time,timeZone,latitude,longitude,location:canonicalLocation(form),instant:local.toUTC().toJSDate(),instantIso:local.toUTC().toISO()};
}
function solarNoonDate(localDate,timeZone){return window.luxon.DateTime.fromISO(`${localDate}T12:00`,{zone:timeZone,setZone:true}).toJSDate()}
function solarFrame(p){
  if(!window.SunCalc||!window.luxon?.DateTime)return null;
  const local=window.luxon.DateTime.fromJSDate(p.instant).setZone(p.timeZone);
  const todayDate=local.toFormat('yyyy-MM-dd'),previousDate=local.minus({days:1}).toFormat('yyyy-MM-dd'),nextDate=local.plus({days:1}).toFormat('yyyy-MM-dd');
  const today=SunCalc.getTimes(solarNoonDate(todayDate,p.timeZone),p.latitude,p.longitude);
  const previous=SunCalc.getTimes(solarNoonDate(previousDate,p.timeZone),p.latitude,p.longitude);
  const next=SunCalc.getTimes(solarNoonDate(nextDate,p.timeZone),p.latitude,p.longitude);
  const valid=value=>value instanceof Date&&!Number.isNaN(value.getTime());
  if(![today.sunrise,today.sunset,previous.sunrise,previous.sunset,next.sunrise].every(valid))return null;
  return p.instant>=today.sunrise
    ?{start:today.sunrise,sunrise:today.sunrise,sunset:today.sunset,end:next.sunrise}
    :{start:previous.sunrise,sunrise:previous.sunrise,sunset:previous.sunset,end:today.sunrise};
}
function weekdayRuler(instant,timeZone){const weekday=window.luxon.DateTime.fromJSDate(instant).setZone(timeZone).weekday;return WEEKDAY_RULERS[weekday]||'sun'}
function rotateHours(dayKey){const start=CHALDEAN.indexOf(dayKey);return Array.from({length:24},(_,index)=>CHALDEAN[(start+index)%7])}
function planetaryHours(frame,dayKey){
  const sequence=rotateHours(dayKey),daylight=frame.sunset.getTime()-frame.sunrise.getTime(),night=frame.end.getTime()-frame.sunset.getTime();
  const dayLength=daylight/12,nightLength=night/12;
  return Array.from({length:24},(_,index)=>{
    const bright=index<12,start=bright?frame.sunrise.getTime()+index*dayLength:frame.sunset.getTime()+(index-12)*nightLength;
    return{ruler:sequence[index],start:new Date(start),end:new Date(start+(bright?dayLength:nightLength))};
  });
}
function svg(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(key,radius){const index=CHALDEAN.indexOf(key),angle=(-90+index*(360/7))*Math.PI/180;return{x:180+Math.cos(angle)*radius,y:180+Math.sin(angle)*radius}}
function line(parent,a,b,className){parent.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className}))}
function partialLine(parent,a,b,fraction,className){const f=Math.max(0,Math.min(1,Number(fraction)||0));line(parent,a,{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},className)}
function planetGroup(key,dayKey,hourKey){
  const p=point(key,142),group=svg('g',{class:`sky-ph-planet sky-ph-${key}`,style:`color:${COLORS[key]}`});
  if(key===dayKey)group.classList.add('is-day-ruler');if(key===hourKey)group.classList.add('is-hour-ruler');
  group.appendChild(svg('circle',{cx:p.x,cy:p.y,r:18,class:`sky-ph-node${key===dayKey?' day':''}${key===hourKey?' hour':''}`}));
  group.appendChild(svg('g',{transform:`translate(${p.x} ${p.y})`,class:'sky-ph-node-glyph'}));
  return group;
}
function buildPreview(p){
  const frame=solarFrame(p);if(!frame)return null;
  const dayKey=weekdayRuler(frame.start,p.timeZone),rows=planetaryHours(frame,dayKey);
  let currentIndex=rows.findIndex(row=>p.instant>=row.start&&p.instant<row.end);if(currentIndex<0)currentIndex=0;
  const current=rows[currentIndex],weekIndex=Math.max(0,WEEK_PATH.indexOf(dayKey));
  const dayFraction=Math.max(0,Math.min(1,(p.instant-frame.start)/(frame.end-frame.start)));
  const hourFraction=Math.max(0,Math.min(1,(p.instant-current.start)/(current.end-current.start)));
  const root=svg('svg',{viewBox:'18 18 324 324',preserveAspectRatio:'xMidYMid meet',class:'sky-ph-heptagram sky-where-when-draft-heptagram',role:'img','aria-label':`Draft Where and When heptagram. ${dayKey} planetary day; ${current.ruler} planetary hour.`});
  root.dataset.draftWhereWhen='true';
  root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-circle'}));
  root.appendChild(svg('circle',{cx:180,cy:180,r:142,class:'sky-ph-guide'}));
  for(let index=0;index<7;index++){
    const from=point(WEEK_PATH[index],142),to=point(WEEK_PATH[index+1],142);
    line(root,from,to,`sky-ph-week-segment ${index<weekIndex?'past':'future'}`);
    if(index===weekIndex)partialLine(root,from,to,dayFraction,'sky-ph-week-segment current');
  }
  for(let index=0;index<7;index++)line(root,point(CHALDEAN[index],142),point(CHALDEAN[(index+1)%7],142),'sky-ph-hour-segment future');
  partialLine(root,point(current.ruler,142),point(CHALDEAN[(CHALDEAN.indexOf(current.ruler)+1)%7],142),hourFraction,'sky-ph-hour-segment current');
  CHALDEAN.forEach(key=>root.appendChild(planetGroup(key,dayKey,current.ruler)));
  return root;
}
function planetaryHoursHref(p){
  const params=new URLSearchParams();
  params.set('phShare','1');params.set('lat',String(p.latitude));params.set('lon',String(p.longitude));params.set('tz',p.timeZone);
  if(p.location)params.set('loc',p.location);if(p.instantIso)params.set('dt',p.instantIso);
  return 'planetaryhours.html#'+params.toString();
}
async function renderNow(slot){
  timers[slot]=0;const token=++renderToken[slot];
  const target=mount(slot);if(!target)return;
  const p=packet(slot);
  target.querySelectorAll('[data-draft-where-when="true"],.sky-where-when-ph-jump').forEach(node=>node.remove());
  if(!p){target.hidden=true;target.removeAttribute('data-draft-heptagram-ready');return}
  try{
    const preview=buildPreview(p);if(!preview){target.hidden=true;target.removeAttribute('data-draft-heptagram-ready');return}
    const jump=document.createElement('a');jump.className='sky-where-when-ph-jump';jump.href=planetaryHoursHref(p);jump.textContent='Jump to this moment in Planetary Hours';
    preview.style.visibility='hidden';
    target.append(preview,jump);target.hidden=false;target.dataset.draftHeptagramReady='true';
    const canonical=window.RelphiSkyHeptagramCanonical;
    if(canonical?.correct)await canonical.correct(preview);
    if(token!==renderToken[slot]||!preview.isConnected)return;
    preview.style.visibility='visible';
  }catch(error){
    const preview=target.querySelector('[data-draft-where-when="true"]');if(preview)preview.style.visibility='visible';
    console.error('Where/When moment preview failed:',error);
  }
}
function schedule(slot,delay=0){if(!slot||!(slot in timers))return;clearTimeout(timers[slot]);timers[slot]=window.setTimeout(()=>void renderNow(slot),delay)}
function scheduleOpen(delay=0){['A','B'].forEach(slot=>{if(editor(slot))schedule(slot,delay)})}
function normalize(slot){
  const form=editor(slot);if(!form)return;
  const preview=form.querySelector(`[data-ww-heptagram-slot="${slot}"]`),advanced=form.querySelector('.sky-where-when-advanced');
  if(preview&&advanced&&preview.nextElementSibling!==advanced)advanced.before(preview);
  schedule(slot,0);
}
function start(){
  installStyle();['A','B'].forEach(normalize);
  if(!observer){
    observer=new MutationObserver(records=>{
      const relevant=records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.sky-where-when-editor,[data-ww-heptagram-slot]')||node.querySelector?.('.sky-where-when-editor,[data-ww-heptagram-slot]'))));
      if(relevant)requestAnimationFrame(()=>['A','B'].forEach(normalize));
    });
    observer.observe(document.body,{subtree:true,childList:true});
  }
  document.addEventListener('input',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,35)},true);
  document.addEventListener('change',event=>{const form=event.target.closest?.('.sky-where-when-editor');if(form&&event.target.matches?.('[data-ww-field]'))schedule(form.dataset.slot,10)},true);
  document.addEventListener('click',event=>{
    const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;const slot=form.dataset.slot;
    const action=event.target.closest?.('[data-ww-action]')?.dataset?.wwAction||'';
    if(action){schedule(slot,0);window.setTimeout(()=>schedule(slot,0),120)}
  },true);
  window.addEventListener('relphi:sky-where-when-edit-state-changed',()=>{requestAnimationFrame(()=>['A','B'].forEach(normalize));window.setTimeout(()=>scheduleOpen(0),80)});
}
window.RelphiSkyWhereWhenDraftHeptagram=Object.freeze({render:schedule,refresh:()=>scheduleOpen(0),renderNow});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
