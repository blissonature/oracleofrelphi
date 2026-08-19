// True smooth Progressions playback.
// The wheel moves on requestAnimationFrame; ephemeris positions are sampled as light keyframes,
// while the expensive full commentary renderer is allowed to catch up only when playback stops.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const core=window.RelphiSkyProgressionsCore;
  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const KEYFRAME_MS=120;
  const COMMENTARY_MS=45;
  const LABEL_MS=90;
  const C={x:600,y:600};
  const LANES={A:[287,299,283],B:[450,440,460]};
  const EXACT={A:323,B:414};
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const LABEL={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};

  let playing=false,raf=0,startPerf=0,startDays=0,keyStart=0,keyFrom=null,keyTo=null,lastCommentary=0,lastLabel=0,synthetic=false;
  let activeLaneMap=new Map(),previousDirection=new Map(),stationFlash=new Map(),lastAnnotationHTML='';

  const norm=value=>((Number(value)%360)+360)%360;
  const wrap=value=>((Number(value)+540)%360)-180;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  function panel(){return document.getElementById('skyProgressionsPanel')}
  function slider(){return panel()?.querySelector('[data-progression-scrubber]')}
  function playButton(){return panel()?.querySelector('[data-progression-play]')}
  function speedControl(){return panel()?.querySelector('[data-progression-speed]')}
  function sourceSlot(){return panel()?.querySelector('[data-progression-source]')?.value==='B'?'B':'A'}
  function otherSlot(slot){return slot==='A'?'B':'A'}
  function wheel(){return panel()?.querySelector('[data-progression-shared-wheel="true"]')}
  function read(slot){try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}}
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{}}
  function epochMs(slot){const payload=read(slot),p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN}
  function parseDate(value){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return NaN;return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0).getTime()}
  function rangeStartMs(){const value=parseDate(panel()?.querySelector('[data-progression-range-start]')?.value);return Number.isFinite(value)?value:epochMs(sourceSlot())}
  function targetMs(days){return rangeStartMs()+Number(days||0)*DAY}
  function fmtDate(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
  function fmtDateTime(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
  function degreeLabel(value){let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`}

  function astronomyLongitude(id,progressedMs){
    if(!window.Astronomy)return NaN;
    try{const vector=window.Astronomy.GeoVector(window.Astronomy.Body?.[BODY_NAME[id]]||BODY_NAME[id],new Date(progressedMs),true);return norm(window.Astronomy.Ecliptic(vector).elon)}catch(_){return NaN}
  }
  function snapshotAt(target){
    const epoch=epochMs(sourceSlot());if(!Number.isFinite(epoch))return new Map();
    const progressed=epoch+((target-epoch)/YEAR)*DAY,map=new Map();
    for(const id of BODIES){const value=astronomyLongitude(id,progressed);if(Number.isFinite(value))map.set(id,value)}
    return map;
  }
  function interpolateSnapshot(from,to,fraction){
    const result=new Map();
    for(const id of BODIES){const a=from?.get(id),b=to?.get(id);if(!Number.isFinite(a)||!Number.isFinite(b))continue;result.set(id,norm(a+wrap(b-a)*fraction))}
    return result;
  }

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
  function canonicalId(value){return String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-')}
  function storedPlanetRecords(slot){
    const aliases={sol:'sun',luna:'moon'},byId=new Map();
    for(const [key,item] of placementSource(read(slot))){
      const candidates=[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,key].filter(Boolean);let id='';
      for(const candidate of candidates){const raw=canonicalId(candidate),resolved=window.RelphiGlyphRegistry&&(window.RelphiGlyphRegistry.resolve(raw)||window.RelphiGlyphRegistry.get(raw)),test=canonicalId(resolved?.id||aliases[raw]||raw);if(BODIES.includes(test)){id=test;break}}
      const value=itemLongitude(item);if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:LABEL[id],value});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }

  function ensureSpeedOptions(){
    const select=speedControl();if(!select)return;
    if(![...select.options].some(option=>option.value==='730.4844'))select.add(new Option('2 years/s','730.4844'));
    if(![...select.options].some(option=>option.value==='1826.211'))select.add(new Option('5 years/s','1826.211'));
    if(!select.dataset.progressionSmoothDefaulted){select.dataset.progressionSmoothDefaulted='true';select.value='365.2422'}
  }
  function injectStyle(){
    if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;
    const style=document.createElement('style');style.id='skyProgressionsSmoothPlaybackStyle';style.textContent=`
      .sky-progression-transport{position:sticky;top:.3rem;z-index:8;margin:.35rem 0 .45rem;padding:.45rem .5rem;border:1px solid rgba(25,23,20,.11);border-radius:.75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}
      .sky-progression-transport .sky-progression-scrub-row{margin:0}.sky-progressions-panel .sky-progression-playback:empty{display:none}
      html[data-progression-live-playing="true"] [data-progression-shared-wheel] [data-sky]{will-change:transform}
      @media(max-width:520px){.sky-progression-transport{top:.15rem;padding:.38rem}}
    `;document.head.appendChild(style)
  }
  function installTransport(){
    const root=panel();if(!root)return false;const row=root.querySelector('.sky-progression-scrub-row'),view=root.querySelector('.sky-progressions-wheel-shell');if(!row||!view)return false;
    let transport=root.querySelector('.sky-progression-transport');if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';view.before(transport)}
    if(row.parentElement!==transport)transport.appendChild(row);const range=slider();if(range)range.step='any';ensureSpeedOptions();return true;
  }

  function captureLanes(slot){
    activeLaneMap=new Map();const view=wheel(),allowed=LANES[slot];
    BODIES.forEach((id,index)=>{const host=view?.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),raw=Number(host?.dataset.placementLane),nearest=allowed.reduce((best,lane)=>Math.abs(lane-raw)<Math.abs(best-raw)?lane:best,allowed[0]);activeLaneMap.set(id,Number.isFinite(raw)&&Math.abs(nearest-raw)<10?raw:allowed[index%allowed.length])});
  }
  function drawSnapshot(snapshot){
    const view=wheel(),slot=sourceSlot();if(!view)return;
    for(const [id,longitude] of snapshot){
      const host=view.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),leader=view.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="${slot}"][data-placement="${CSS.escape(id)}"]`);if(!host)continue;
      const lane=activeLaneMap.get(id)??LANES[slot][BODIES.indexOf(id)%LANES[slot].length],display=polar(lane,longitude),exact=polar(EXACT[slot],longitude);
      host.hidden=false;host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(lane);host.dataset.displayLongitude=longitude.toFixed(8);host.dataset.exactLongitude=longitude.toFixed(8);host.dataset.progressionVisualRing=slot==='A'?'central-red':'outer-blue';
      if(leader){leader.hidden=false;leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=longitude.toFixed(8)}
    }
  }

  function filterEnabled(id){return panel()?.querySelector(`[data-progression-filter="${id}"]`)?.getAttribute('aria-pressed')!=='false'}
  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function progressionRecords(snapshot){return BODIES.map(id=>snapshot.has(id)?{id,name:LABEL[id],value:snapshot.get(id)}:null).filter(Boolean)}
  function referenceRecords(){const source=sourceSlot(),other=otherSlot(source),mode=panel()?.querySelector('[data-progression-reference]')?.value==='other'?'other':'natal';return storedPlanetRecords(mode==='other'?other:source)}
  function referenceLabel(){const source=sourceSlot(),mode=panel()?.querySelector('[data-progression-reference]')?.value==='other'?'other':'natal';return mode==='other'?`Sky ${otherSlot(source)}`:`Natal Sky ${source}`}
  function relationRows(snapshot){
    if(!core?.activeRelationships)return[];const progressed=progressionRecords(snapshot),reference=referenceRecords(),rows=[],orb=currentOrb();
    if(filterEnabled('intra'))rows.push(...core.activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(filterEnabled('inter'))rows.push(...core.activeRelationships(progressed,reference,orb,{mode:'inter'}));
    return rows.filter(row=>!(panel()?.querySelector('[data-progression-reference]')?.value!=='other'&&row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,40);
  }
  function renderAspectLines(snapshot,relations){
    const view=wheel(),layer=view?.querySelector('[data-layer="aspects"]');if(!layer)return;layer.replaceChildren();
    const ref=new Map(referenceRecords().map(record=>[record.id,record.value]));
    for(const relation of relations){const left=snapshot.get(relation.left.id),right=relation.mode==='intra'?snapshot.get(relation.right.id):ref.get(relation.right.id);if(!Number.isFinite(left)||!Number.isFinite(right))continue;const a=polar(165,left),b=polar(165,right),line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [key,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:relation.aspect.color,class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`}))line.setAttribute(key,String(value));layer.appendChild(line)}
  }
  function liveAnnotations(snapshot,nextSnapshot,target,relations,now){
    const items=[],source=sourceSlot();
    for(const id of BODIES){
      const value=snapshot.get(id),next=nextSnapshot?.get(id);if(!Number.isFinite(value)||!Number.isFinite(next))continue;const delta=wrap(next-value),direction=Math.sign(delta),previous=previousDirection.get(id);
      if(previous&&direction&&previous!==direction){const category=direction<0?'retrograde':'direct';stationFlash.set(id,{category,until:now+700,title:category==='retrograde'?`${LABEL[id]} beginning retrograde`:`${LABEL[id]} ending retrograde`})}if(direction)previousDirection.set(id,direction);
      if(core?.signState){const state=core.signState(value,delta,1);if(state.kind&&filterEnabled(state.kind))items.push({category:state.kind,title:`${LABEL[id]} ${state.kind==='ingress'?'entering':'leaving'} ${state.sign}`,meta:`${state.kind[0].toUpperCase()+state.kind.slice(1)} · ${state.degree.toFixed(2)}° ${state.sign}${delta<0?' · retrograde':''}`})}
    }
    for(const [id,event] of [...stationFlash]){if(event.until<=now){stationFlash.delete(id);continue}if(filterEnabled(event.category))items.push({category:event.category,title:event.title,meta:`Progressed Sky ${source} station crossing`})}
    const nextRelations=relationRows(nextSnapshot||snapshot),nextByKey=new Map(nextRelations.map(row=>[`${row.mode}|${row.left.id}|${row.right.id}|${row.aspect.id}`,row]));
    for(const relation of relations){const key=`${relation.mode}|${relation.left.id}|${relation.right.id}|${relation.aspect.id}`,future=nextByKey.get(key),motion=future?core.classifyMotion?.(relation.error,future.error,.001)||'active':'separating',right=relation.mode==='intra'?`progressed ${relation.right.name}`:`${referenceLabel()} ${relation.right.name}`;items.push({category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)} · ${motion}`})}
    const html=items.slice(0,24).map(item=>`<article class="sky-progression-annotation is-${item.category}"><div class="sky-progression-annotation-time">${fmtDate(target)}</div><strong>${item.title}</strong><span>${item.meta}</span></article>`).join('')||'<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';
    if(html!==lastAnnotationHTML){lastAnnotationHTML=html;const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=html}
  }
  function updateLabels(target){const root=panel();if(!root)return;const date=root.querySelector('[data-progression-date-label]'),age=root.querySelector('[data-progression-age-label]'),epoch=epochMs(sourceSlot());if(date)date.textContent=fmtDateTime(target);if(age&&Number.isFinite(epoch))age.textContent=`Secondary progression · ${((target-epoch)/YEAR).toFixed(1)} years after epoch`}

  function rebuildKeyframe(now,days,speed){const currentTarget=targetMs(days),futureTarget=currentTarget+(speed*KEYFRAME_MS/1000)*DAY;keyFrom=snapshotAt(currentTarget);keyTo=snapshotAt(futureTarget);keyStart=now}
  function syncBase(){
    const range=slider();if(!range)return;synthetic=true;try{range.dispatchEvent(new Event('input',{bubbles:true}))}finally{synthetic=false}
    setTimeout(()=>window.dispatchEvent(new Event('relphi:progressions-ring-enforce')),80);setTimeout(()=>window.dispatchEvent(new Event('relphi:progressions-ring-enforce')),220);
  }
  function syncButton(){const button=playButton();if(!button)return;button.dataset.playing=playing?'true':'false';button.textContent=playing?'Pause':'Play';button.setAttribute('aria-label',playing?'Pause progressions':'Play progressions')}
  function stopPlayback({sync=true}={}){playing=false;document.documentElement.removeAttribute('data-progression-live-playing');if(raf)cancelAnimationFrame(raf);raf=0;syncButton();if(sync)syncBase()}
  function startPlayback(){
    const range=slider();if(!range||!window.Astronomy)return;window.dispatchEvent(new Event('relphi:progressions-ring-enforce'));
    requestAnimationFrame(()=>{
      captureLanes(sourceSlot());playing=true;document.documentElement.setAttribute('data-progression-live-playing','true');startDays=Number(range.value)||0;startPerf=performance.now();keyStart=0;keyFrom=null;keyTo=null;previousDirection.clear();stationFlash.clear();syncButton();
      function frame(now){
        if(!playing)return;const speed=Number(speedControl()?.value)||365.2422,max=Number(range.max)||0,elapsed=(now-startPerf)/1000,days=clamp(startDays+elapsed*speed,0,max),target=targetMs(days);
        range.value=String(days);
        if(!keyFrom||now-keyStart>=KEYFRAME_MS)rebuildKeyframe(now,days,speed);
        const fraction=clamp((now-keyStart)/KEYFRAME_MS,0,1),visual=interpolateSnapshot(keyFrom,keyTo,fraction);drawSnapshot(visual);
        if(now-lastCommentary>=COMMENTARY_MS){lastCommentary=now;const relations=relationRows(visual);renderAspectLines(visual,relations);liveAnnotations(visual,keyTo,target,relations,now)}
        if(now-lastLabel>=LABEL_MS){lastLabel=now;updateLabels(target)}
        if(days>=max){drawSnapshot(snapshotAt(targetMs(max)));stopPlayback({sync:true});return}
        raf=requestAnimationFrame(frame);
      }
      raf=requestAnimationFrame(frame);
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-progression-play]');if(button){event.preventDefault();event.stopImmediatePropagation();playing?stopPlayback({sync:true}):startPlayback();return}
    if(event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now]')&&playing)stopPlayback({sync:false});
  },true);
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!synthetic&&playing)stopPlayback({sync:false})},true);
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-source], [data-progression-reference], [data-progression-range-start], [data-progression-range-end]')&&playing)stopPlayback({sync:false})},true);

  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(()=>installTransport()));
  const structuralObserver=new MutationObserver(()=>installTransport());
  function start(){injectStyle();installTransport();structuralObserver.observe(document.body,{childList:true,subtree:true})}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
