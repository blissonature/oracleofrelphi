// Continuous Progressions playback: Sky A/red is immutable; only the blue progressed copy moves.
// Astronomy Engine sampling lives in a Web Worker. The main thread only interpolates and paints.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const core=window.RelphiSkyProgressionsCore;
  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const KEYFRAME_REAL_MS=120;
  const CHUNK_SAMPLES=48;
  const REFILL_SECONDS=2.5;
  const UI_MS=140;
  const ASPECT_MS=260;
  const C={x:600,y:600};
  const LANES=[450,440,460];
  const EXACT=414;
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};

  let playing=false;
  let raf=0;
  let worker=null;
  let workerBusy=false;
  let workerFailed=false;
  let requestSerial=0;
  let activeRequestId='';
  let playbackToken=0;
  let startPerf=0;
  let startDays=0;
  let playbackSpeed=365.2422;
  let samples=[];
  let lastUi=0;
  let lastAspect=0;
  let lastAnnotationHTML='';
  let synthetic=false;
  let laneMap=new Map();
  let redPoints=new Map();
  let blueHosts=new Map();
  let blueLeaders=new Map();
  let aspectLines=[];
  let activeRelations=[];

  const norm=value=>((Number(value)%360)+360)%360;
  const wrap=value=>((Number(value)+540)%360)-180;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  function panel(){return document.getElementById('skyProgressionsPanel')}
  function wheel(){return panel()?.querySelector('[data-progression-shared-wheel="true"]')}
  function slider(){return panel()?.querySelector('[data-progression-scrubber]')}
  function playButton(){return panel()?.querySelector('[data-progression-play]')}
  function speedControl(){return panel()?.querySelector('[data-progression-speed]')}
  function readA(){try{return JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')}catch(_){return null}}
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{}}
  function natalEpoch(){const payload=readA(),p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN}
  function parseDate(value){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return NaN;return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0).getTime()}
  function rangeStartMs(){const value=parseDate(panel()?.querySelector('[data-progression-range-start]')?.value);return Number.isFinite(value)?value:natalEpoch()}
  function targetMs(days){return rangeStartMs()+Number(days||0)*DAY}
  function daysFromTarget(ms){return(ms-rangeStartMs())/DAY}
  function fmtDate(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
  function degreeLabel(value){let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`}
  function canonicalId(value){return String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-')}

  function placementSource(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(v=>v&&typeof v==='object'),source=known||payload;return Array.isArray(source)?source.map((item,index)=>[String(item?.id||item?.name||index),item]):Object.entries(source)}
  function itemLongitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const signs=core?.SIGNS||['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const sign=signs.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());if(sign<0)return NaN;
    return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
  }
  function natalRecords(){
    const aliases={sol:'sun',luna:'moon'},byId=new Map();
    for(const [key,item] of placementSource(readA())){
      if(!item||typeof item!=='object')continue;
      const candidates=[item.glyphId,item.id,item.name,item.label,item.body,item.planet,key].filter(Boolean);let id='';
      for(const candidate of candidates){const raw=canonicalId(candidate),resolved=window.RelphiGlyphRegistry&&(window.RelphiGlyphRegistry.resolve?.(raw)||window.RelphiGlyphRegistry.get?.(raw)),test=canonicalId(resolved?.id||aliases[raw]||raw);if(BODIES.includes(test)){id=test;break}}
      const value=itemLongitude(item);if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_NAME[id],value});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }
  function filterEnabled(id){return panel()?.querySelector(`[data-progression-filter="${id}"]`)?.getAttribute('aria-pressed')!=='false'}
  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function progressionRecords(snapshot){return BODIES.map(id=>snapshot.has(id)?{id,name:BODY_NAME[id],value:snapshot.get(id)}:null).filter(Boolean)}
  function relationRows(snapshot){
    if(!core?.activeRelationships)return[];
    const progressed=progressionRecords(snapshot),natal=natalRecords(),rows=[],orb=currentOrb();
    if(filterEnabled('intra'))rows.push(...core.activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(filterEnabled('inter'))rows.push(...core.activeRelationships(progressed,natal,orb,{mode:'inter'}));
    return rows.filter(row=>!(row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,32);
  }

  function parseTranslate(node){const match=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[,\s]+([-+\d.eE]+)/);return match?{x:Number(match[1]),y:Number(match[2])}:null}
  function isActuallyVisible(node){return!!node&&!node.hidden&&node.style.display!=='none'&&node.style.visibility!=='hidden'}
  function captureGeometry(){
    const view=wheel();laneMap=new Map();redPoints=new Map();blueHosts=new Map();blueLeaders=new Map();if(!view)return false;

    // The blue lane in Progressions is not Sky B. It is reserved exclusively for the ten progressed bodies.
    view.querySelectorAll('[data-layer="placements"] [data-sky="B"][data-placement]').forEach(node=>{
      const id=canonicalId(node.dataset.placement);
      if(!BODIES.includes(id)){node.style.setProperty('display','none','important');node.setAttribute('aria-hidden','true')}
    });
    view.querySelectorAll('[data-layer="leaders"] [data-sky="B"][data-placement]').forEach(node=>{
      const id=canonicalId(node.dataset.placement);
      if(!BODIES.includes(id)){node.style.setProperty('display','none','important');node.setAttribute('aria-hidden','true')}
    });

    BODIES.forEach((id,index)=>{
      const blue=view.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`);
      const leader=view.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="B"][data-placement="${CSS.escape(id)}"]`);
      const raw=Number(blue?.dataset.placementLane),nearest=LANES.reduce((best,lane)=>Math.abs(lane-raw)<Math.abs(best-raw)?lane:best,LANES[0]);
      laneMap.set(id,Number.isFinite(raw)&&Math.abs(nearest-raw)<12?raw:LANES[index%LANES.length]);
      if(blue){blue.style.removeProperty('display');blue.removeAttribute('aria-hidden');blueHosts.set(id,blue)}
      if(leader){leader.style.removeProperty('display');leader.removeAttribute('aria-hidden');blueLeaders.set(id,leader)}
      const red=view.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),point=parseTranslate(red);
      if(point&&isActuallyVisible(red))redPoints.set(id,point);
    });
    return blueHosts.size>0;
  }
  function snapshotFromWheel(){
    const result=new Map();
    for(const [id,host] of blueHosts){const value=Number(host.dataset.exactLongitude);if(Number.isFinite(value))result.set(id,norm(value))}
    return result;
  }
  function drawBlue(snapshot){
    const points=new Map();
    for(const id of BODIES){
      const longitude=snapshot.get(id),host=blueHosts.get(id);if(!Number.isFinite(longitude)||!host)continue;
      const lane=laneMap.get(id)??LANES[BODIES.indexOf(id)%LANES.length],display=polar(lane,longitude),exact=polar(EXACT,longitude),leader=blueLeaders.get(id);
      host.hidden=false;host.style.removeProperty('display');host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(lane);host.dataset.displayLongitude=longitude.toFixed(8);host.dataset.exactLongitude=longitude.toFixed(8);points.set(id,display);
      if(leader){leader.hidden=false;leader.style.removeProperty('display');leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=longitude.toFixed(8)}
    }
    return points;
  }

  function rebuildAspectLines(snapshot){
    const layer=wheel()?.querySelector('[data-layer="aspects"]');if(!layer)return;
    layer.replaceChildren();activeRelations=relationRows(snapshot);aspectLines=[];
    for(const relation of activeRelations){
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('stroke',relation.aspect.color);line.setAttribute('class',`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`);
      layer.appendChild(line);aspectLines.push({line,relation});
    }
  }
  function moveAspectLines(bluePoints){
    for(const item of aspectLines){
      const relation=item.relation,line=item.line,from=bluePoints.get(relation.left.id),to=relation.mode==='intra'?bluePoints.get(relation.right.id):redPoints.get(relation.right.id);
      if(!from||!to){line.style.display='none';continue}
      line.style.removeProperty('display');line.setAttribute('x1',from.x);line.setAttribute('y1',from.y);line.setAttribute('x2',to.x);line.setAttribute('y2',to.y);
    }
  }

  function snapshotFromValues(values){const result=new Map();for(const id of BODIES){const value=Number(values?.[id]);if(Number.isFinite(value))result.set(id,norm(value))}return result}
  function interpolateSnapshot(from,to,fraction){
    const result=new Map();
    for(const id of BODIES){const a=from?.get(id),b=to?.get(id);if(Number.isFinite(a)&&Number.isFinite(b))result.set(id,norm(a+wrap(b-a)*fraction))}
    return result;
  }
  function insertSample(sample){
    if(!sample||!Number.isFinite(sample.days)||!(sample.snapshot instanceof Map))return;
    const last=samples[samples.length-1];
    if(last&&Math.abs(last.days-sample.days)<1e-8){samples[samples.length-1]=sample;return}
    samples.push(sample);samples.sort((a,b)=>a.days-b.days);
  }
  function visualForDays(days){
    if(!samples.length)return{snapshot:new Map(),nextSnapshot:null};
    while(samples.length>3&&samples[1].days<days)samples.shift();
    let before=samples[0],after=samples[1]||samples[0];
    for(let i=1;i<samples.length;i+=1){if(samples[i].days>=days){after=samples[i];before=samples[i-1]||samples[i];break}before=samples[i];after=samples[i]}
    if(before===after||Math.abs(after.days-before.days)<1e-9)return{snapshot:before.snapshot,nextSnapshot:after.snapshot};
    const fraction=clamp((days-before.days)/(after.days-before.days),0,1);
    return{snapshot:interpolateSnapshot(before.snapshot,after.snapshot,fraction),nextSnapshot:after.snapshot};
  }

  function ensureWorker(){
    if(worker||workerFailed)return!!worker;
    try{
      worker=new Worker(new URL('sky-chart-progressions-worker-v1.js',document.baseURI));
      worker.onmessage=event=>{
        const data=event.data||{};if(!playing||data.requestId!==activeRequestId)return;
        if(data.type==='sample'){
          const days=daysFromTarget(Number(data.targetMs));insertSample({days,snapshot:snapshotFromValues(data.values)});return;
        }
        if(data.type==='done'){workerBusy=false;return}
        if(data.type==='error'){workerBusy=false;workerFailed=true;stopPlayback({sync:false});const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML='<p class="sky-progression-no-events">Continuous playback could not start because the background ephemeris worker failed.</p>'}
      };
      worker.onerror=()=>{workerBusy=false;workerFailed=true;if(playing)stopPlayback({sync:false})};
      return true;
    }catch(_){workerFailed=true;return false}
  }
  function requestChunk(fromDays){
    if(!playing||workerBusy||!ensureWorker())return;
    const range=slider(),max=Number(range?.max)||0;if(fromDays>=max)return;
    const stepDays=playbackSpeed*KEYFRAME_REAL_MS/1000,start=Math.min(max,fromDays),requestId=`${playbackToken}-${++requestSerial}`;
    workerBusy=true;activeRequestId=requestId;
    worker.postMessage({type:'stream',requestId,epochMs:natalEpoch(),startTargetMs:targetMs(start),stepTargetMs:stepDays*DAY,maxTargetMs:targetMs(max),count:CHUNK_SAMPLES});
  }
  function maybeRefill(days){
    if(workerBusy||!playing)return;
    const last=samples[samples.length-1],max=Number(slider()?.max)||0;if(!last||last.days>=max)return;
    const aheadSeconds=(last.days-days)/Math.max(1,playbackSpeed);
    if(aheadSeconds<=REFILL_SECONDS){const stepDays=playbackSpeed*KEYFRAME_REAL_MS/1000;requestChunk(Math.min(max,last.days+stepDays))}
  }

  function renderAnnotations(snapshot,nextSnapshot,target){
    const items=[];
    for(const [id,value] of snapshot){
      if(!core?.signState)break;const future=nextSnapshot?.get(id),delta=Number.isFinite(future)?wrap(future-value):0,status=core.signState(value,delta,1);
      if(status.kind&&filterEnabled(status.kind))items.push({category:status.kind,title:`${BODY_NAME[id]} ${status.kind==='ingress'?'entering':'leaving'} ${status.sign}`,meta:`${status.kind[0].toUpperCase()+status.kind.slice(1)} · ${status.degree.toFixed(2)}° ${status.sign}${delta<0?' · retrograde':''}`});
    }
    for(const relation of activeRelations){const right=relation.mode==='intra'?`progressed ${relation.right.name}`:`natal ${relation.right.name}`;items.push({category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)}`})}
    const html=items.slice(0,24).map(item=>`<article class="sky-progression-annotation is-${item.category}"><div class="sky-progression-annotation-time">${fmtDate(target)}</div><strong>${item.title}</strong><span>${item.meta}</span></article>`).join('')||'<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';
    if(html!==lastAnnotationHTML){lastAnnotationHTML=html;const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=html}
  }
  function updateUi(days,visual,now){
    const range=slider();if(range)range.value=String(days);if(now-lastUi<UI_MS)return;lastUi=now;
    const target=targetMs(days),root=panel(),date=root?.querySelector('[data-progression-date-label]'),age=root?.querySelector('[data-progression-age-label]'),epoch=natalEpoch();
    if(date)date.textContent=fmtDate(target);if(age&&Number.isFinite(epoch))age.textContent=`Secondary progression · ${((target-epoch)/YEAR).toFixed(2)} years after epoch`;
    renderAnnotations(visual.snapshot,visual.nextSnapshot,target);
  }
  function syncButton(){const button=playButton();if(!button)return;button.dataset.playing=playing?'true':'false';button.textContent=playing?'Pause':'Play';button.setAttribute('aria-label',playing?'Pause progressions':'Play progressions')}

  function stopPlayback({sync=true}={}){
    if(!playing)return;
    const elapsed=(performance.now()-startPerf)/1000,max=Number(slider()?.max)||0,days=clamp(startDays+elapsed*playbackSpeed,0,max),visual=visualForDays(days);
    playing=false;playbackToken+=1;workerBusy=false;activeRequestId='';worker?.postMessage({type:'cancel'});if(raf)cancelAnimationFrame(raf);raf=0;document.documentElement.removeAttribute('data-progression-live-playing');
    const bluePoints=drawBlue(visual.snapshot);moveAspectLines(bluePoints);if(slider())slider().value=String(days);syncButton();samples=[];
    if(sync&&slider()){synthetic=true;try{slider().dispatchEvent(new Event('input',{bubbles:true}))}finally{synthetic=false}}
  }
  function startPlayback(){
    const range=slider(),view=wheel();if(!range||!view||!Number.isFinite(natalEpoch()))return;
    if(!ensureWorker()){const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML='<p class="sky-progression-no-events">This browser could not start the continuous playback worker.</p>';return}
    if(!captureGeometry())return;
    const initialSnapshot=snapshotFromWheel();if(initialSnapshot.size<2)return;
    startDays=Number(range.value)||0;playbackSpeed=Math.max(1,Number(speedControl()?.value)||365.2422);startPerf=performance.now();samples=[{days:startDays,snapshot:initialSnapshot}];playbackToken+=1;requestSerial=0;workerBusy=false;lastUi=0;lastAspect=0;lastAnnotationHTML='';
    playing=true;document.documentElement.setAttribute('data-progression-live-playing','true');syncButton();rebuildAspectLines(initialSnapshot);
    const stepDays=playbackSpeed*KEYFRAME_REAL_MS/1000;requestChunk(startDays+stepDays);

    function frame(now){
      if(!playing)return;
      const max=Number(slider()?.max)||0,elapsed=(now-startPerf)/1000,days=clamp(startDays+elapsed*playbackSpeed,0,max),visual=visualForDays(days),bluePoints=drawBlue(visual.snapshot);
      moveAspectLines(bluePoints);
      if(now-lastAspect>=ASPECT_MS){lastAspect=now;rebuildAspectLines(visual.snapshot);moveAspectLines(bluePoints)}
      updateUi(days,visual,now);maybeRefill(days);
      if(days>=max-.000001){stopPlayback({sync:true});return}
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  }

  function installTransport(){
    const root=panel();if(!root)return false;const row=root.querySelector('.sky-progression-scrub-row'),view=root.querySelector('.sky-progressions-wheel-shell');if(!row||!view)return false;
    let transport=root.querySelector('.sky-progression-transport');if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';view.before(transport)}
    if(row.parentElement!==transport)transport.appendChild(row);if(slider())slider().step='any';return true;
  }
  function injectStyle(){
    if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;
    const style=document.createElement('style');style.id='skyProgressionsSmoothPlaybackStyle';style.textContent=`
      .sky-progression-transport{position:sticky;top:.3rem;z-index:8;margin:.35rem 0 .45rem;padding:.45rem .5rem;border:1px solid rgba(25,23,20,.11);border-radius:.75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}
      .sky-progression-transport .sky-progression-scrub-row{margin:0}
      [data-progression-shared-wheel="true"] [data-layer="placements"] [data-sky="B"][data-placement]:not([data-placement="sun"]):not([data-placement="moon"]):not([data-placement="mercury"]):not([data-placement="venus"]):not([data-placement="mars"]):not([data-placement="jupiter"]):not([data-placement="saturn"]):not([data-placement="uranus"]):not([data-placement="neptune"]):not([data-placement="pluto"]),
      [data-progression-shared-wheel="true"] [data-layer="leaders"] [data-sky="B"][data-placement]:not([data-placement="sun"]):not([data-placement="moon"]):not([data-placement="mercury"]):not([data-placement="venus"]):not([data-placement="mars"]):not([data-placement="jupiter"]):not([data-placement="saturn"]):not([data-placement="uranus"]):not([data-placement="neptune"]):not([data-placement="pluto"]){display:none!important}
    `;document.head.appendChild(style);
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-progression-play]');if(button){event.preventDefault();event.stopImmediatePropagation();playing?stopPlayback({sync:true}):startPlayback();return}
    if(playing&&event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now], [data-final-now]'))stopPlayback({sync:false});
  },true);
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!synthetic&&playing)stopPlayback({sync:false})},true);
  document.addEventListener('change',event=>{if(playing&&event.target.matches?.('[data-progression-range-start], [data-progression-range-end], [data-progression-speed]'))stopPlayback({sync:false})},true);
  window.addEventListener('relphi:sky-foundation-ready',()=>{if(playing)stopPlayback({sync:false});requestAnimationFrame(installTransport)});
  function start(){injectStyle();installTransport()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
