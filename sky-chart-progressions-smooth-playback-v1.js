// Smooth Progressions playback: Sky A/red is immutable; only the blue progressed copy moves.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const core=window.RelphiSkyProgressionsCore;
  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const SEGMENT_MS=220;
  const UI_MS=120;
  const ASPECT_MS=220;
  const C={x:600,y:600};
  const LANES=[450,440,460];
  const EXACT=414;
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};

  let playing=false,raf=0,segment=null,prefetchToken=0,lastUi=0,lastAspect=0,lastAnnotationHTML='',synthetic=false;
  let laneMap=new Map(),redPoints=new Map(),activeRelations=[];

  const norm=v=>((Number(v)%360)+360)%360;
  const wrap=v=>((Number(v)+540)%360)-180;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  function panel(){return document.getElementById('skyProgressionsPanel')}
  function wheel(){return panel()?.querySelector('[data-progression-shared-wheel="true"]')}
  function slider(){return panel()?.querySelector('[data-progression-scrubber]')}
  function playButton(){return panel()?.querySelector('[data-progression-play]')}
  function speedControl(){return panel()?.querySelector('[data-progression-speed]')}
  function readA(){try{return JSON.parse(localStorage.getItem('relphiSkyChartA')||'null')}catch(_){return null}}
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{}}
  function natalEpoch(){const payload=readA(),p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN}
  function parseDate(value){const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0).getTime()}
  function rangeStartMs(){const value=parseDate(panel()?.querySelector('[data-progression-range-start]')?.value);return Number.isFinite(value)?value:natalEpoch()}
  function targetMs(days){return rangeStartMs()+Number(days||0)*DAY}
  function fmtDate(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
  function degreeLabel(value){let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`}
  function canonicalId(value){return String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-')}

  function astronomyLongitude(id,progressedMs){
    if(!window.Astronomy)return NaN;
    try{const body=window.Astronomy.Body?.[BODY_NAME[id]]||BODY_NAME[id],vector=window.Astronomy.GeoVector(body,new Date(progressedMs),true);return norm(window.Astronomy.Ecliptic(vector).elon)}catch(_){return NaN}
  }
  function snapshotAt(target){
    const epoch=natalEpoch();if(!Number.isFinite(epoch))return new Map();
    const progressed=epoch+((target-epoch)/YEAR)*DAY,map=new Map();
    for(const id of BODIES){const value=astronomyLongitude(id,progressed);if(Number.isFinite(value))map.set(id,value)}
    return map;
  }
  function interpolateSnapshot(from,to,fraction){
    const map=new Map();
    for(const id of BODIES){const a=from?.get(id),b=to?.get(id);if(Number.isFinite(a)&&Number.isFinite(b))map.set(id,norm(a+wrap(b-a)*fraction))}
    return map;
  }

  function placementSource(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(v=>v&&typeof v==='object'),source=known||payload;return Array.isArray(source)?source.map((item,index)=>[String(item?.id||item?.name||index),item]):Object.entries(source)}
  function itemLongitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const signs=core?.SIGNS||['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],sign=signs.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());if(sign<0)return NaN;
    return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
  }
  function natalRecords(){
    const aliases={sol:'sun',luna:'moon'},byId=new Map();
    for(const [key,item] of placementSource(readA())){
      if(!item||typeof item!=='object')continue;const candidates=[item.glyphId,item.id,item.name,item.label,item.body,item.planet,key].filter(Boolean);let id='';
      for(const candidate of candidates){const raw=canonicalId(candidate),resolved=window.RelphiGlyphRegistry&&(window.RelphiGlyphRegistry.resolve?.(raw)||window.RelphiGlyphRegistry.get?.(raw)),test=canonicalId(resolved?.id||aliases[raw]||raw);if(BODIES.includes(test)){id=test;break}}
      const value=itemLongitude(item);if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_NAME[id],value});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }
  function filterEnabled(id){return panel()?.querySelector(`[data-progression-filter="${id}"]`)?.getAttribute('aria-pressed')!=='false'}
  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function progressionRecords(snapshot){return BODIES.map(id=>snapshot.has(id)?{id,name:BODY_NAME[id],value:snapshot.get(id)}:null).filter(Boolean)}
  function relationRows(snapshot){
    if(!core?.activeRelationships)return[];const progressed=progressionRecords(snapshot),natal=natalRecords(),rows=[],orb=currentOrb();
    if(filterEnabled('intra'))rows.push(...core.activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(filterEnabled('inter'))rows.push(...core.activeRelationships(progressed,natal,orb,{mode:'inter'}));
    return rows.filter(row=>!(row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,32);
  }

  function parseTranslate(node){const m=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[,\s]+([-+\d.eE]+)/);return m?{x:Number(m[1]),y:Number(m[2])}:null}
  function captureGeometry(){
    const view=wheel();laneMap=new Map();redPoints=new Map();if(!view)return;
    BODIES.forEach((id,index)=>{
      const blue=view.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),raw=Number(blue?.dataset.placementLane),nearest=LANES.reduce((best,lane)=>Math.abs(lane-raw)<Math.abs(best-raw)?lane:best,LANES[0]);laneMap.set(id,Number.isFinite(raw)&&Math.abs(nearest-raw)<12?raw:LANES[index%LANES.length]);
      const red=view.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),point=parseTranslate(red);if(point&&!red.hidden)redPoints.set(id,point);
    });
  }
  function drawBlue(snapshot){
    const view=wheel(),points=new Map();if(!view)return points;
    for(const [id,longitude] of snapshot){
      const host=view.querySelector(`[data-layer="placements"] [data-sky="B"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),leader=view.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="B"][data-placement="${CSS.escape(id)}"]`);if(!host)continue;
      const lane=laneMap.get(id)??LANES[BODIES.indexOf(id)%LANES.length],display=polar(lane,longitude),exact=polar(EXACT,longitude);host.hidden=false;host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(lane);host.dataset.displayLongitude=longitude.toFixed(8);host.dataset.exactLongitude=longitude.toFixed(8);points.set(id,display);
      if(leader){leader.hidden=false;leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=longitude.toFixed(8)}
    }
    return points;
  }
  function rebuildAspectLines(snapshot){
    const view=wheel(),layer=view?.querySelector('[data-layer="aspects"]');if(!layer)return;layer.replaceChildren();activeRelations=relationRows(snapshot);
    for(const relation of activeRelations){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke',relation.aspect.color);line.setAttribute('class',`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`);line.dataset.left=relation.left.id;line.dataset.right=relation.right.id;line.dataset.mode=relation.mode;layer.appendChild(line)}
  }
  function moveAspectLines(bluePoints){
    const layer=wheel()?.querySelector('[data-layer="aspects"]');if(!layer)return;
    for(const line of layer.querySelectorAll('.sky-progression-aspect')){
      const from=bluePoints.get(line.dataset.left),to=line.dataset.mode==='intra'?bluePoints.get(line.dataset.right):redPoints.get(line.dataset.right);if(!from||!to){line.style.display='none';continue}line.style.removeProperty('display');line.setAttribute('x1',from.x);line.setAttribute('y1',from.y);line.setAttribute('x2',to.x);line.setAttribute('y2',to.y)
    }
  }
  function renderAnnotations(snapshot,target){
    const items=[];
    for(const [id,value] of snapshot){if(!core?.signState)break;const future=segment?.toSnapshot?.get(id),delta=Number.isFinite(future)?wrap(future-value):0,status=core.signState(value,delta,1);if(status.kind&&filterEnabled(status.kind))items.push({category:status.kind,title:`${BODY_NAME[id]} ${status.kind==='ingress'?'entering':'leaving'} ${status.sign}`,meta:`${status.kind[0].toUpperCase()+status.kind.slice(1)} · ${status.degree.toFixed(2)}° ${status.sign}${delta<0?' · retrograde':''}`})}
    for(const relation of activeRelations){const right=relation.mode==='intra'?`progressed ${relation.right.name}`:`natal ${relation.right.name}`;items.push({category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)}`})}
    const html=items.slice(0,24).map(item=>`<article class="sky-progression-annotation is-${item.category}"><div class="sky-progression-annotation-time">${fmtDate(target)}</div><strong>${item.title}</strong><span>${item.meta}</span></article>`).join('')||'<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';
    if(html!==lastAnnotationHTML){lastAnnotationHTML=html;const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=html}
  }

  function segmentSpanDays(){return(Math.max(1,Number(speedControl()?.value)||365.2422)*SEGMENT_MS/1000)}
  function makeSegment(fromDays,fromSnapshot,start){const range=slider(),max=Number(range?.max)||0,speed=Math.max(1,Number(speedControl()?.value)||365.2422),toDays=Math.min(max,fromDays+segmentSpanDays()),duration=Math.max(1,(toDays-fromDays)/speed*1000),toSnapshot=snapshotAt(targetMs(toDays));return{fromDays,toDays,fromSnapshot,toSnapshot,start,duration,next:null}}
  function prefetchNext(){
    const current=segment;if(!playing||!current||current.next||current.toDays>=Number(slider()?.max||0))return;const token=++prefetchToken;
    setTimeout(()=>{if(!playing||token!==prefetchToken||segment!==current)return;const max=Number(slider()?.max)||0,speed=Math.max(1,Number(speedControl()?.value)||365.2422),toDays=Math.min(max,current.toDays+segmentSpanDays()),duration=Math.max(1,(toDays-current.toDays)/speed*1000),toSnapshot=snapshotAt(targetMs(toDays));if(playing&&token===prefetchToken&&segment===current)current.next={fromDays:current.toDays,toDays,fromSnapshot:current.toSnapshot,toSnapshot,start:current.start+current.duration,duration,next:null}},0)
  }
  function advanceSegment(now){
    while(segment&&now-segment.start>=segment.duration&&segment.toDays<Number(slider()?.max||0)){
      const next=segment.next;segment=next||makeSegment(segment.toDays,segment.toSnapshot,segment.start+segment.duration);prefetchNext()
    }
  }
  function visualAt(now){if(!segment)return{days:Number(slider()?.value)||0,snapshot:new Map()};const fraction=clamp((now-segment.start)/segment.duration,0,1),days=segment.fromDays+(segment.toDays-segment.fromDays)*fraction;return{days,snapshot:interpolateSnapshot(segment.fromSnapshot,segment.toSnapshot,fraction)}}
  function syncButton(){const button=playButton();if(!button)return;button.dataset.playing=playing?'true':'false';button.textContent=playing?'Pause':'Play';button.setAttribute('aria-label',playing?'Pause progressions':'Play progressions')}
  function updateUi(visual,now){const range=slider();if(range)range.value=String(visual.days);const target=targetMs(visual.days),root=panel(),date=root?.querySelector('[data-progression-date-label]'),age=root?.querySelector('[data-progression-age-label]'),epoch=natalEpoch();if(now-lastUi>=UI_MS){lastUi=now;if(date)date.textContent=fmtDate(target);if(age&&Number.isFinite(epoch))age.textContent=`Secondary progression · ${((target-epoch)/YEAR).toFixed(2)} years after epoch`;renderAnnotations(visual.snapshot,target)}}

  function stopPlayback({sync=true}={}){
    if(!playing)return;const visual=visualAt(performance.now());playing=false;prefetchToken+=1;if(raf)cancelAnimationFrame(raf);raf=0;document.documentElement.removeAttribute('data-progression-live-playing');const points=drawBlue(visual.snapshot);moveAspectLines(points);if(slider())slider().value=String(visual.days);syncButton();segment=null;
    if(sync&&slider()){synthetic=true;try{slider().dispatchEvent(new Event('input',{bubbles:true}))}finally{synthetic=false}}
  }
  function startPlayback(){
    const range=slider(),view=wheel();if(!range||!view||!window.Astronomy)return;const fromDays=Number(range.value)||0,fromSnapshot=snapshotAt(targetMs(fromDays));captureGeometry();
    playing=true;document.documentElement.setAttribute('data-progression-live-playing','true');lastUi=0;lastAspect=0;lastAnnotationHTML='';syncButton();segment=makeSegment(fromDays,fromSnapshot,performance.now());prefetchNext();rebuildAspectLines(fromSnapshot);
    function frame(now){
      if(!playing||!segment)return;advanceSegment(now);const visual=visualAt(now),bluePoints=drawBlue(visual.snapshot);moveAspectLines(bluePoints);if(now-lastAspect>=ASPECT_MS){lastAspect=now;rebuildAspectLines(visual.snapshot);moveAspectLines(bluePoints)}updateUi(visual,now);const max=Number(slider()?.max)||0;if(visual.days>=max-.000001){if(slider())slider().value=String(max);stopPlayback({sync:true});return}raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame)
  }

  function installTransport(){const root=panel();if(!root)return false;const row=root.querySelector('.sky-progression-scrub-row'),view=root.querySelector('.sky-progressions-wheel-shell');if(!row||!view)return false;let transport=root.querySelector('.sky-progression-transport');if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';view.before(transport)}if(row.parentElement!==transport)transport.appendChild(row);if(slider())slider().step='any';return true}
  function injectStyle(){if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;const style=document.createElement('style');style.id='skyProgressionsSmoothPlaybackStyle';style.textContent=`.sky-progression-transport{position:sticky;top:.3rem;z-index:8;margin:.35rem 0 .45rem;padding:.45rem .5rem;border:1px solid rgba(25,23,20,.11);border-radius:.75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}.sky-progression-transport .sky-progression-scrub-row{margin:0}html[data-progression-live-playing="true"] [data-progression-shared-wheel] [data-sky="A"]{will-change:auto}html[data-progression-live-playing="true"] [data-progression-shared-wheel] [data-sky="B"]{will-change:transform}`;document.head.appendChild(style)}

  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-progression-play]');if(button){event.preventDefault();event.stopImmediatePropagation();playing?stopPlayback({sync:true}):startPlayback();return}if(playing&&event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now], [data-final-now]'))stopPlayback({sync:false})},true);
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!synthetic&&playing)stopPlayback({sync:false})},true);
  document.addEventListener('change',event=>{if(playing&&event.target.matches?.('[data-progression-range-start], [data-progression-range-end], [data-progression-speed]'))stopPlayback({sync:false})},true);
  window.addEventListener('relphi:sky-foundation-ready',()=>{if(playing)stopPlayback({sync:false});requestAnimationFrame(installTransport)});
  function start(){injectStyle();installTransport()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
