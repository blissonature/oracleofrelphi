// Ephemeris-derived transit windows with exact passes, stations, and current phase.
(function(){
  'use strict';
  if(window.__relphiSkyTransitTimelineV1)return;
  window.__relphiSkyTransitTimelineV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const BODY={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const ANGLE={conjunction:0,'semi-sextile':30,octile:45,sextile:60,quintile:72,square:90,trine:120,'tri-octile':135,'bi-quintile':144,quincunx:150,opposition:180};
  const ASPECT={conjunction:'conjunction','semi-sextile':'semi-sextile',octile:'octile',sextile:'sextile',quintile:'quintile',square:'square',trine:'trine','tri-octile':'sesquiquadrate','bi-quintile':'biquintile',quincunx:'quincunx',opposition:'opposition'};
  const SETTINGS={moon:[18,.05,2],mercury:[240,.2,35],venus:[420,.25,70],mars:[750,.5,150],sun:[400,.25,10],jupiter:[1300,1,300],saturn:[1800,1,420],uranus:[2600,1.5,600],neptune:[3000,1.5,700],pluto:[3400,2,800]};
  const DAY=86400000;
  let calculationId=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wrap=value=>((Number(value)+540)%360)-180;
  const read=slot=>{try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}};
  const fmt=date=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(date);
  const shortFmt=date=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(date);
  const orbLabel=value=>{let total=Math.round(Number(value)*60),degrees=Math.floor(total/60);total%=60;return`${degrees}°${String(total).padStart(2,'0')}′`};
  const closeness=value=>value<=.25?'very close':value<=1?'close':value<=3?'moderate':value<=6?'wide':'very wide';

  function movingSlot(){
    const a=String(read('A')?.name||''),b=String(read('B')?.name||''),dynamic=/planetary hours|transit|current sky|\bnow\b/i;
    if(dynamic.test(a)!==dynamic.test(b))return dynamic.test(a)?'A':'B';
    try{const roles=window.RelphiSkyRoles||JSON.parse(localStorage.getItem('relphiSkyChartRoles')||'null');if(roles?.chart==='dynamic'&&roles?.currentSky!=='dynamic')return'A';if(roles?.currentSky==='dynamic'&&roles?.chart!=='dynamic')return'B'}catch(_){}
    return null;
  }
  function profileDate(profile){
    const source=profile?.calcProfile||profile,raw=source?.instant||source?.dateTime;if(!raw)return null;
    const date=new Date(raw);return Number.isFinite(date.getTime())?date:null;
  }
  function longitude(body,date){
    const astronomy=window.Astronomy,bodyValue=astronomy?.Body?.[BODY[body]]||BODY[body];
    const vector=astronomy.GeoVector(bodyValue,date,true);return astronomy.Ecliptic(vector).elon;
  }
  function modelFor(relation){
    const moving=movingSlot();if(!moving||!window.Astronomy)return null;
    const movingRecord=moving==='A'?relation.left:relation.right,fixedRecord=moving==='A'?relation.right:relation.left,profile=read(moving),date=profileDate(profile),angle=ANGLE[relation.aspect.id];
    if(!BODY[movingRecord.id]||!date||!Number.isFinite(angle))return null;
    const orbInput=Number(document.querySelector('[data-filter="orb"]')?.value),limit=Number.isFinite(orbInput)&&orbInput>0?orbInput:1;
    return{moving,movingRecord,fixedRecord,date,angle,aspect:ASPECT[relation.aspect.id]||relation.aspect.id,limit,settings:SETTINGS[movingRecord.id]};
  }
  function analyzer(model){
    const targetA=model.fixedRecord.value+model.angle,targetB=model.fixedRecord.value-model.angle;
    const errorAt=ms=>{const longitudeValue=longitude(model.movingRecord.id,new Date(ms)),a=wrap(longitudeValue-targetA),b=wrap(longitudeValue-targetB);return Math.abs(a)<=Math.abs(b)?a:b};
    const speedAt=ms=>wrap(longitude(model.movingRecord.id,new Date(ms+.08*DAY))-longitude(model.movingRecord.id,new Date(ms-.08*DAY)))/.16;
    return{errorAt,speedAt};
  }
  function root(a,b,fn){let fa=fn(a);for(let i=0;i<34;i++){const m=(a+b)/2,fm=fn(m);if(Math.sign(fa)===Math.sign(fm)){a=m;fa=fm}else b=m}return(a+b)/2}
  function timeline(model){
    const [horizon,step,gapDays]=model.settings,{errorAt,speedAt}=analyzer(model),center=model.date.getTime(),samples=[];
    for(let day=-horizon;day<=horizon;day+=step){const ms=center+day*DAY;samples.push({ms,error:errorAt(ms)})}
    const windows=[];let start=-1;
    for(let i=0;i<=samples.length;i++){const inside=i<samples.length&&Math.abs(samples[i].error)<=model.limit;if(inside&&start<0)start=i;if(!inside&&start>=0){const end=i-1;let entry=samples[start].ms,exit=samples[end].ms;if(start>0)entry=root(samples[start-1].ms,entry,ms=>Math.abs(errorAt(ms))-model.limit);if(i<samples.length)exit=root(exit,samples[i].ms,ms=>Math.abs(errorAt(ms))-model.limit);windows.push({start,end,entry,exit});start=-1}}
    const currentIndex=windows.findIndex(window=>window.entry<=center&&window.exit>=center);if(currentIndex<0)return null;
    let first=currentIndex,last=currentIndex;while(first>0&&(windows[first].entry-windows[first-1].exit)/DAY<=gapDays)first--;while(last<windows.length-1&&(windows[last+1].entry-windows[last].exit)/DAY<=gapDays)last++;
    const group=windows.slice(first,last+1),events=[];
    group.forEach((window,windowIndex)=>{
      for(let i=Math.max(1,window.start);i<=window.end;i++){const left=samples[i-1],right=samples[i];if(left.error===0||right.error===0||Math.sign(left.error)!==Math.sign(right.error)){const time=root(left.ms,right.ms,errorAt);if(time>=window.entry&&time<=window.exit&&!events.some(event=>event.type==='exact'&&Math.abs(event.time-time)<DAY*.2))events.push({type:'exact',time,windowIndex})}}
      let previousTime=window.entry,previousSpeed=speedAt(previousTime);for(let ms=window.entry+step*DAY;ms<=window.exit;ms+=step*DAY){const speed=speedAt(ms);if(Math.sign(speed)!==Math.sign(previousSpeed)){const time=root(previousTime,ms,speedAt);events.push({type:speedAt(time+.02*DAY)>=0?'direct':'retrograde',time,windowIndex})}previousTime=ms;previousSpeed=speed}
    });
    events.sort((a,b)=>a.time-b.time);const exacts=events.filter(event=>event.type==='exact'),completed=exacts.filter(event=>event.time<=center).length,currentError=Math.abs(errorAt(center)),before=Math.abs(errorAt(center-.05*DAY)),after=Math.abs(errorAt(center+.05*DAY)),motion=after<before?'applying':'separating',active=group.findIndex(window=>window.entry<=center&&window.exit>=center),activeWindow=group[active],progress=Math.max(0,Math.min(100,(center-activeWindow.entry)/(activeWindow.exit-activeWindow.entry)*100)),groupSamples=samples.filter(sample=>group.some(window=>sample.ms>=window.entry&&sample.ms<=window.exit)),closest=groupSamples.reduce((best,sample)=>Math.abs(sample.error)<Math.abs(best.error)?sample:best,groupSamples[0]);
    return{group,events,exacts,completed,currentError,motion,active,progress,center,closestError:Math.abs(closest.error),closestTime:closest.ms};
  }
  function marker(event,window,index){const left=Math.max(0,Math.min(100,(event.time-window.entry)/(window.exit-window.entry)*100)),symbol=event.type==='exact'?'◆':event.type==='retrograde'?'↶':'↷',label=event.type==='exact'?'Exact aspect':event.type==='retrograde'?'Station retrograde':'Station direct';return`<span class="sky-transit-marker is-${event.type}" style="--marker-left:${left}%" data-transit-layer="${event.type==='exact'?'exact':'detail'}" title="${esc(label)} · ${esc(fmt(new Date(event.time)))}"><b>${symbol}</b></span>`}
  function renderTimeline(host,model,data){
    const exactTotal=data.exacts.length,nowLabel=Math.abs(Date.now()-data.center)<2*DAY?'Now':'Selected time',title=`${model.movingRecord.entry.name} ${model.aspect} ${model.fixedRecord.entry.name}`;
    const windows=data.group.map((window,index)=>{const current=index===data.active,eventMarkers=data.events.filter(event=>event.windowIndex===index).map(event=>marker(event,window,index)).join(''),currentMarker=current?`<span class="sky-transit-marker is-current" style="--marker-left:${data.progress}%" title="${esc(nowLabel)}"><b>●</b></span>`:'';return`<div class="sky-transit-window-row"><p>${index===0?'Active period':'Return period'}: ${esc(fmt(new Date(window.entry)))}–${esc(fmt(new Date(window.exit)))}</p><div class="sky-transit-track">${eventMarkers}${currentMarker}</div></div>`}).join('');
    const ordinal=number=>number===1?'First':number===2?'Second':number===3?'Third':`${number}${number%10===1&&number%100!==11?'st':number%10===2&&number%100!==12?'nd':number%10===3&&number%100!==13?'rd':'th'}`,eventList=data.events.map((event,index)=>{const exactNumber=event.type==='exact'?data.events.slice(0,index+1).filter(item=>item.type==='exact').length:null,label=event.type==='exact'?`${exactNumber===data.exacts.length?'Final':ordinal(exactNumber)} exact`:event.type==='retrograde'?`${model.movingRecord.entry.name} stationed retrograde`:`${model.movingRecord.entry.name} stationed direct`;return`<li data-transit-layer="detail"><strong>${esc(label)}:</strong> ${esc(fmt(new Date(event.time)))}</li>`}).join('');
    host.className='sky-transit-timeline';host.dataset.transitStage='0';host.innerHTML=`<div class="sky-transit-heading"><span class="sky-progressive-meta-label">Transit window</span><strong>${esc(shortFmt(new Date(data.group[0].entry)))}–${esc(fmt(new Date(data.group[data.group.length-1].exit)))}</strong></div><h4>${esc(title)}</h4>${windows}<div class="sky-transit-status"><span><strong>Timing:</strong> ${Math.round(data.progress)}% through the current active window</span><span><strong>Closeness:</strong> ${orbLabel(data.currentError)} from exact · ${closeness(data.currentError)}</span><span><strong>Motion:</strong> ${data.motion}</span><span><strong>Pass:</strong> ${exactTotal?`${Math.min(data.completed+1,exactTotal)} of ${exactTotal}`:'near pass · does not become exact'}</span></div><p class="sky-transit-now"><strong>${esc(nowLabel)}:</strong> ${esc(data.motion)} ${data.completed?`after exact pass ${data.completed}`:'toward the first exact pass'} · Orb ${orbLabel(data.currentError)}</p><p class="sky-transit-count">${exactTotal?`${data.completed} of ${exactTotal} exact passes completed`:`Near pass · does not become exact. Closest orb: ${orbLabel(data.closestError)} on ${fmt(new Date(data.closestTime))}.`}</p><ol class="sky-transit-events">${eventList}</ol><button type="button" class="sky-transit-more">Show exact passes</button>`;
    host.querySelector('.sky-transit-more').addEventListener('click',event=>{const stage=(Number(host.dataset.transitStage)+1)%3;host.dataset.transitStage=String(stage);event.currentTarget.textContent=stage===0?'Show exact passes':stage===1?'Show dates, stations, and phases':'Return to simple timeline'});
  }
  function unavailable(host){host.className='sky-transit-unavailable';host.innerHTML='<span class="sky-progressive-meta-label">Transit timing</span><span>Available when one sky is a moving Sun, Moon, or planet and the other is a fixed chart.</span>'}
  function calculate(event){
    const id=++calculationId,relation=event.detail?.relation,panel=document.getElementById('skySelectedRelationship'),host=panel?.querySelector('[data-transit-timeline]');if(!relation||!host)return;
    const diagnosticSlot=movingSlot(),diagnosticRecord=diagnosticSlot==='A'?relation.left:relation.right,diagnosticProfile=diagnosticSlot?read(diagnosticSlot):null,diagnosticDate=diagnosticProfile?.calcProfile||diagnosticProfile;host.dataset.transitAstronomy=typeof window.Astronomy;host.dataset.transitMovingSlot=diagnosticSlot||'';host.dataset.transitMovingId=diagnosticRecord?.id||'';host.dataset.transitDate=String(diagnosticDate?.instant||diagnosticDate?.dateTime||'');host.dataset.transitAspect=relation.aspect?.id||'';
    const model=modelFor(relation);if(!model){unavailable(host);return}
    setTimeout(()=>{if(id!==calculationId||!host.isConnected)return;try{const data=timeline(model);if(data)renderTimeline(host,model,data);else unavailable(host)}catch(error){host.dataset.transitError=String(error?.message||error);unavailable(host)}},0);
  }
  window.addEventListener('relphi:selected-relationship-rendered',calculate);
})();
