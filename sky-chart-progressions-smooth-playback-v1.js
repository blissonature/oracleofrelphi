// Continuous Progressions playback.
// Sky A/red is immutable. A dedicated blue overlay animates all ten secondary-progressed planets.
// One worker keyframe interval is exactly one real second, so the selected speed is literal:
// 30 target days at 1 month/s, 90 target days at 3 months/s, etc.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const core=window.RelphiSkyProgressionsCore;
  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const SEGMENT_MS=1000;
  const CHUNK_SAMPLES=36;
  const REFILL_AT=8;
  const UI_MS=120;
  const NS='http://www.w3.org/2000/svg';
  const C={x:600,y:600};
  const LANES=[450,440,460];
  const EXACT=414;
  const BLUE='#2462d0';
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};

  let playing=false;
  let worker=null;
  let workerBusy=false;
  let workerFailed=false;
  let playbackToken=0;
  let requestSerial=0;
  let activeRequestId='';
  let playbackSpeed=30;
  let samples=[];
  let segment=null;
  let segmentTimer=0;
  let uiRaf=0;
  let lastUi=0;
  let synthetic=false;
  let liveLayer=null;
  let aspectLayer=null;
  let liveBodies=new Map();
  let laneMap=new Map();
  let redPoints=new Map();
  let lastDays=0;
  let lastSnapshot=new Map();
  let lastAnnotationHTML='';

  const norm=value=>((Number(value)%360)+360)%360;
  const wrap=value=>((Number(value)+540)%360)-180;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const svg=(name,attrs={})=>{const node=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node};
  const esc=value=>window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');

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

  function placementSource(payload){
    if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;
    return Array.isArray(source)?source.map((item,index)=>[String(item?.id||item?.name||index),item]):Object.entries(source);
  }
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
      for(const candidate of candidates){
        const raw=canonicalId(candidate),resolved=window.RelphiGlyphRegistry&&(window.RelphiGlyphRegistry.resolve?.(raw)||window.RelphiGlyphRegistry.get?.(raw)),test=canonicalId(resolved?.id||aliases[raw]||raw);
        if(BODIES.includes(test)){id=test;break}
      }
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
    return rows.filter(row=>!(row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,40);
  }
  function relationKey(row){return`${row.mode}|${row.left.id}|${row.right.id}|${row.aspect.id}`}

  function parseTranslate(node){const match=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[,\s]+([-+\d.eE]+)/);return match?{x:Number(match[1]),y:Number(match[2])}:null}
  function captureStaticGeometry(){
    const view=wheel();laneMap=new Map();redPoints=new Map();if(!view)return false;
    BODIES.forEach((id,index)=>{
      const staticBlue=view.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${esc(id)}"]:not([data-angle-axis="true"])`);
      const raw=Number(staticBlue?.dataset.placementLane),nearest=LANES.reduce((best,lane)=>Math.abs(lane-raw)<Math.abs(best-raw)?lane:best,LANES[0]);
      laneMap.set(id,Number.isFinite(raw)&&Math.abs(nearest-raw)<12?raw:LANES[index%LANES.length]);
      const red=view.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${esc(id)}"]:not([data-angle-axis="true"])`),point=parseTranslate(red);
      if(point&&!red?.hidden&&red?.style.display!=='none')redPoints.set(id,point);
    });
    return redPoints.size>0;
  }

  function copyCanonicalBubble(target,id){
    const view=wheel(),source=view?.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${esc(id)}"]:not([data-angle-axis="true"])`);
    if(source&&source.childNodes.length){for(const child of source.childNodes)target.appendChild(child.cloneNode(true));return true}
    const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.resolve?.(id)||registry.get?.(id));
    if(entry&&component?.createBubble){try{component.createBubble(target,entry.id,{radius:17.2,padding:1,color:BLUE,fill:'#fffdf8',strokeWidth:1.8});return true}catch(_){}}
    return false;
  }
  function buildLiveLayer(snapshot){
    const view=wheel();if(!view)return false;
    view.querySelector('[data-progression-live-layer]')?.remove();
    liveLayer=svg('g',{'data-progression-live-layer':'true'});
    aspectLayer=svg('g',{'data-progression-live-aspects':'true'});
    liveLayer.appendChild(aspectLayer);liveBodies=new Map();
    for(const id of BODIES){
      const longitude=snapshot.get(id);if(!Number.isFinite(longitude))continue;
      const lane=laneMap.get(id)??LANES[BODIES.indexOf(id)%LANES.length];
      const rotating=svg('g',{'data-progression-live-body':id,transform:`rotate(${longitude} ${C.x} ${C.y})`});
      const leader=svg('line',{class:'sky-foundation-leader','data-progression-live-leader':id,stroke:BLUE,x1:C.x-lane,y1:C.y,x2:C.x-EXACT,y2:C.y});
      const bubble=svg('g',{transform:`translate(${C.x-lane} ${C.y})`});copyCanonicalBubble(bubble,id);
      rotating.append(leader,bubble);liveLayer.appendChild(rotating);liveBodies.set(id,{rotating,lane});
    }
    view.appendChild(liveLayer);return liveBodies.size===BODIES.length;
  }
  function removeNativeAnimations(node){node?.querySelectorAll(':scope > animate, :scope > animateTransform').forEach(animation=>animation.remove())}
  function setLiveSnapshot(snapshot){
    for(const id of BODIES){const value=snapshot.get(id),body=liveBodies.get(id);if(!Number.isFinite(value)||!body)continue;removeNativeAnimations(body.rotating);body.rotating.setAttribute('transform',`rotate(${value} ${C.x} ${C.y})`)}
  }
  function bodyPoint(id,longitude){const body=liveBodies.get(id);return body&&Number.isFinite(longitude)?polar(body.lane,longitude):null}
  function nativeAnimate(node,name,from,to,duration,collector){
    const animation=svg('animate',{attributeName:name,from,to,dur:`${duration}ms`,begin:'indefinite',fill:'freeze',calcMode:'linear'});node.appendChild(animation);collector.push(animation);
  }
  function animateBodies(from,to,duration,animations){
    for(const id of BODIES){
      const a=from.get(id),b=to.get(id),body=liveBodies.get(id);if(!Number.isFinite(a)||!Number.isFinite(b)||!body)continue;
      const unwrapped=a+wrap(b-a);removeNativeAnimations(body.rotating);body.rotating.setAttribute('transform',`rotate(${a} ${C.x} ${C.y})`);
      const animation=svg('animateTransform',{attributeName:'transform',type:'rotate',from:`${a} ${C.x} ${C.y}`,to:`${unwrapped} ${C.x} ${C.y}`,dur:`${duration}ms`,begin:'indefinite',fill:'freeze',calcMode:'linear'});
      body.rotating.appendChild(animation);animations.push(animation);
    }
  }
  function animateAspects(from,to,duration,animations){
    if(!aspectLayer)return;aspectLayer.replaceChildren();
    const union=new Map();for(const row of relationRows(from))union.set(relationKey(row),row);for(const row of relationRows(to))if(!union.has(relationKey(row)))union.set(relationKey(row),row);
    for(const relation of union.values()){
      const left0=bodyPoint(relation.left.id,from.get(relation.left.id)),left1=bodyPoint(relation.left.id,to.get(relation.left.id));
      const right0=relation.mode==='intra'?bodyPoint(relation.right.id,from.get(relation.right.id)):redPoints.get(relation.right.id);
      const right1=relation.mode==='intra'?bodyPoint(relation.right.id,to.get(relation.right.id)):redPoints.get(relation.right.id);
      if(!left0||!left1||!right0||!right1)continue;
      const line=svg('line',{class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`,stroke:relation.aspect.color,x1:left0.x,y1:left0.y,x2:right0.x,y2:right0.y,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-progression-scope':relation.mode});
      aspectLayer.appendChild(line);
      nativeAnimate(line,'x1',left0.x,left1.x,duration,animations);nativeAnimate(line,'y1',left0.y,left1.y,duration,animations);nativeAnimate(line,'x2',right0.x,right1.x,duration,animations);nativeAnimate(line,'y2',right0.y,right1.y,duration,animations);
    }
  }

  function snapshotFromValues(values){const map=new Map();for(const id of BODIES){const value=Number(values?.[id]);if(Number.isFinite(value))map.set(id,norm(value))}return map}
  function interpolateSnapshot(from,to,fraction){const map=new Map();for(const id of BODIES){const a=from.get(id),b=to.get(id);if(Number.isFinite(a)&&Number.isFinite(b))map.set(id,norm(a+wrap(b-a)*fraction))}return map}
  function insertSample(sample){
    if(!sample||!Number.isFinite(sample.days)||sample.snapshot.size!==BODIES.length)return;
    if(samples.some(item=>Math.abs(item.days-sample.days)<1e-8))return;
    samples.push(sample);samples.sort((a,b)=>a.days-b.days);
    if(playing&&!segment&&samples.length>=2)startSegment();
  }

  function ensureWorker(){
    if(worker||workerFailed)return!!worker;
    try{
      worker=new Worker(new URL('sky-chart-progressions-worker-v1.js',document.baseURI));
      worker.onmessage=event=>{
        const data=event.data||{};if(!playing||data.requestId!==activeRequestId)return;
        if(data.type==='sample'){insertSample({days:daysFromTarget(Number(data.targetMs)),snapshot:snapshotFromValues(data.values)});return}
        if(data.type==='done'){workerBusy=false;maybeRefill();return}
        if(data.type==='error'){workerBusy=false;workerFailed=true;stopPlayback({sync:false});showPlaybackError(String(data.message||'Background ephemeris worker failed.'))}
      };
      worker.onerror=()=>{workerBusy=false;workerFailed=true;if(playing){stopPlayback({sync:false});showPlaybackError('Background ephemeris worker failed.')}};
      return true;
    }catch(_){workerFailed=true;return false}
  }
  function requestChunk(fromDays){
    if(!playing||workerBusy||!ensureWorker())return;
    const max=Number(slider()?.max)||0;if(fromDays>max)return;
    const requestId=`${playbackToken}-${++requestSerial}`,stepDays=playbackSpeed;
    workerBusy=true;activeRequestId=requestId;
    worker.postMessage({type:'stream',requestId,epochMs:natalEpoch(),startTargetMs:targetMs(Math.min(max,fromDays)),stepTargetMs:stepDays*DAY,maxTargetMs:targetMs(max),count:CHUNK_SAMPLES});
  }
  function maybeRefill(){
    if(!playing||workerBusy)return;
    const max=Number(slider()?.max)||0,last=samples[samples.length-1];if(!last||last.days>=max)return;
    if(samples.length<=REFILL_AT)requestChunk(Math.min(max,last.days+playbackSpeed));
  }

  function renderAnnotations(snapshot,nextSnapshot,target){
    const items=[];
    for(const [id,value] of snapshot){
      if(!core?.signState)break;const future=nextSnapshot?.get(id),delta=Number.isFinite(future)?wrap(future-value):0,status=core.signState(value,delta,1);
      if(status.kind&&filterEnabled(status.kind))items.push({category:status.kind,title:`${BODY_NAME[id]} ${status.kind==='ingress'?'entering':'leaving'} ${status.sign}`,meta:`${status.kind[0].toUpperCase()+status.kind.slice(1)} · ${status.degree.toFixed(2)}° ${status.sign}${delta<0?' · retrograde':''}`});
    }
    for(const relation of relationRows(snapshot)){const right=relation.mode==='intra'?`progressed ${relation.right.name}`:`natal ${relation.right.name}`;items.push({category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)}`})}
    const html=items.slice(0,24).map(item=>`<article class="sky-progression-annotation is-${item.category}"><div class="sky-progression-annotation-time">${fmtDate(target)}</div><strong>${item.title}</strong><span>${item.meta}</span></article>`).join('')||'<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';
    if(html!==lastAnnotationHTML){lastAnnotationHTML=html;const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=html}
  }
  function updateUi(days,snapshot,nextSnapshot,now){
    if(slider())slider().value=String(days);if(now-lastUi<UI_MS)return;lastUi=now;
    const target=targetMs(days),root=panel(),date=root?.querySelector('[data-progression-date-label]'),age=root?.querySelector('[data-progression-age-label]'),epoch=natalEpoch();
    if(date)date.textContent=fmtDate(target);if(age&&Number.isFinite(epoch))age.textContent=`Secondary progression · ${((target-epoch)/YEAR).toFixed(2)} years after epoch`;renderAnnotations(snapshot,nextSnapshot,target);
  }
  function syncButton(buffering=false){
    const button=playButton();if(!button)return;button.dataset.playing=playing?'true':'false';
    if(!playing){button.textContent='Play';button.setAttribute('aria-label','Play progressions');return}
    button.textContent=buffering?'Buffering…':'Pause';button.setAttribute('aria-label',buffering?'Buffering progressions playback':'Pause progressions');
  }
  function showPlaybackError(message){const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=`<p class="sky-progression-no-events">${String(message)}</p>`}

  function beginAnimations(from,to){
    const animations=[];animateAspects(from,to,SEGMENT_MS,animations);animateBodies(from,to,SEGMENT_MS,animations);
    for(const animation of animations){try{animation.beginElement()}catch(_){}}
  }
  function startUiLoop(){
    if(uiRaf)cancelAnimationFrame(uiRaf);
    function frame(now){
      if(!playing||!segment)return;
      const fraction=clamp((now-segment.started)/SEGMENT_MS,0,1),days=segment.from.days+(segment.to.days-segment.from.days)*fraction,snapshot=interpolateSnapshot(segment.from.snapshot,segment.to.snapshot,fraction);
      lastDays=days;lastSnapshot=snapshot;updateUi(days,snapshot,segment.to.snapshot,now);uiRaf=requestAnimationFrame(frame);
    }
    uiRaf=requestAnimationFrame(frame);
  }
  function finishSegment(){
    if(!playing||!segment)return;
    if(uiRaf)cancelAnimationFrame(uiRaf);uiRaf=0;
    setLiveSnapshot(segment.to.snapshot);lastDays=segment.to.days;lastSnapshot=segment.to.snapshot;if(slider())slider().value=String(lastDays);
    samples.shift();segment=null;maybeRefill();
    const max=Number(slider()?.max)||0;if(lastDays>=max-.000001){stopPlayback({sync:true});return}
    if(samples.length>=2)startSegment();else syncButton(true);
  }
  function startSegment(){
    if(!playing||segment||samples.length<2)return;
    const from=samples[0],to=samples[1];segment={from,to,started:performance.now()};syncButton(false);beginAnimations(from.snapshot,to.snapshot);startUiLoop();
    clearTimeout(segmentTimer);segmentTimer=setTimeout(finishSegment,SEGMENT_MS);
  }

  function cleanupLiveLayer(){if(uiRaf)cancelAnimationFrame(uiRaf);uiRaf=0;clearTimeout(segmentTimer);segmentTimer=0;liveLayer?.remove();liveLayer=null;aspectLayer=null;liveBodies=new Map()}
  function stopPlayback({sync=true}={}){
    if(!playing)return;
    playing=false;playbackToken+=1;workerBusy=false;activeRequestId='';worker?.postMessage({type:'cancel'});document.documentElement.removeAttribute('data-progression-live-playing');cleanupLiveLayer();segment=null;samples=[];syncButton(false);
    if(slider())slider().value=String(lastDays);
    if(sync&&slider()){synthetic=true;try{slider().dispatchEvent(new Event('input',{bubbles:true}))}finally{synthetic=false}}
  }
  function startPlayback(){
    const range=slider(),view=wheel();if(!range||!view||!Number.isFinite(natalEpoch()))return;
    if(!ensureWorker()){showPlaybackError('This browser could not start the continuous playback worker.');return}
    if(!captureStaticGeometry())return;
    playbackSpeed=Math.max(1,Number(speedControl()?.value)||30);lastDays=Number(range.value)||0;lastSnapshot=new Map();samples=[];segment=null;lastUi=0;lastAnnotationHTML='';
    playbackToken+=1;requestSerial=0;workerBusy=false;playing=true;document.documentElement.setAttribute('data-progression-live-playing','true');syncButton(true);requestChunk(lastDays);
  }

  function installTransport(){const root=panel();if(!root)return false;const row=root.querySelector('.sky-progression-scrub-row'),view=root.querySelector('.sky-progressions-wheel-shell');if(!row||!view)return false;let transport=root.querySelector('.sky-progression-transport');if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';view.before(transport)}if(row.parentElement!==transport)transport.appendChild(row);if(slider())slider().step='any';return true}
  function injectStyle(){
    if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;
    const style=document.createElement('style');style.id='skyProgressionsSmoothPlaybackStyle';style.textContent=`
      .sky-progression-transport{position:sticky;top:.3rem;z-index:8;margin:.35rem 0 .45rem;padding:.45rem .5rem;border:1px solid rgba(25,23,20,.11);border-radius:.75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}
      .sky-progression-transport .sky-progression-scrub-row{margin:0}
      html[data-progression-live-playing="true"] [data-progression-shared-wheel="true"] [data-layer="placements"] [data-sky="B"],
      html[data-progression-live-playing="true"] [data-progression-shared-wheel="true"] [data-layer="leaders"] [data-sky="B"],
      html[data-progression-live-playing="true"] [data-progression-shared-wheel="true"] [data-layer="aspects"]{visibility:hidden!important}
      [data-progression-live-layer]{pointer-events:none}
    `;document.head.appendChild(style);
  }

  // First authoritative sample builds the dedicated overlay; the second begins motion.
  const originalInsertSample=insertSample;
  insertSample=function(sample){
    if(!sample||!Number.isFinite(sample.days)||sample.snapshot.size!==BODIES.length)return;
    if(samples.some(item=>Math.abs(item.days-sample.days)<1e-8))return;
    samples.push(sample);samples.sort((a,b)=>a.days-b.days);
    if(playing&&!liveLayer&&samples.length>=1){lastDays=samples[0].days;lastSnapshot=samples[0].snapshot;if(!buildLiveLayer(samples[0].snapshot)){stopPlayback({sync:false});showPlaybackError('Could not build the progressed planet layer.');return}}
    if(playing&&!segment&&samples.length>=2)startSegment();
  };
  void originalInsertSample;

  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-progression-play]');if(button){event.preventDefault();event.stopImmediatePropagation();playing?stopPlayback({sync:true}):startPlayback();return}if(playing&&event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now], [data-final-now]'))stopPlayback({sync:false})},true);
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!synthetic&&playing)stopPlayback({sync:false})},true);
  document.addEventListener('change',event=>{if(playing&&event.target.matches?.('[data-progression-range-start], [data-progression-range-end], [data-progression-speed]'))stopPlayback({sync:false})},true);
  window.addEventListener('relphi:sky-foundation-ready',()=>{if(playing)stopPlayback({sync:false});requestAnimationFrame(installTransport)});
  function start(){injectStyle();installTransport()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
