// Progressions playback v3: native SVG interpolation.
// Planet and aspect motion is handed to the browser as timed SVG animation segments,
// so expensive astrology calculations never determine the visible frame rate.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsSmoothPlaybackV1)return;
  window.__relphiSkyProgressionsSmoothPlaybackV1=true;

  const core=window.RelphiSkyProgressionsCore;
  const NS='http://www.w3.org/2000/svg';
  const DAY=86400000;
  const YEAR=365.2422*DAY;
  const SEGMENT_MS=180;
  const UI_MS=70;
  const C={x:600,y:600};
  const LANES={A:[287,299,283],B:[450,440,460]};
  const EXACT={A:323,B:414};
  const SKY={A:'#c9211e',B:'#2462d0'};
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};

  let playing=false;
  let raf=0;
  let segment=null;
  let overlay=null;
  let overlayPlacements=null;
  let overlayLeaders=null;
  let overlayAspects=null;
  let laneMap=new Map();
  let lastUi=0;
  let lastAnnotationHTML='';
  let synthetic=false;

  const norm=v=>((Number(v)%360)+360)%360;
  const wrap=v=>((Number(v)+540)%360)-180;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const svg=(name,attrs={})=>{const n=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n};

  function panel(){return document.getElementById('skyProgressionsPanel')}
  function wheel(){return panel()?.querySelector('[data-progression-shared-wheel="true"]')}
  function slider(){return panel()?.querySelector('[data-progression-scrubber]')}
  function playButton(){return panel()?.querySelector('[data-progression-play]')}
  function speedControl(){return panel()?.querySelector('[data-progression-speed]')}
  function sourceSlot(){return panel()?.querySelector('[data-progression-source]')?.value==='B'?'B':'A'}
  function otherSlot(slot){return slot==='A'?'B':'A'}
  function read(slot){try{return JSON.parse(localStorage.getItem(slot==='A'?'relphiSkyChartA':'relphiSkyChartB')||'null')}catch(_){return null}}
  function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{}}
  function epochMs(slot){const payload=read(slot),p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN}
  function parseDate(value){const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0).getTime()}
  function rangeStartMs(){const value=parseDate(panel()?.querySelector('[data-progression-range-start]')?.value);return Number.isFinite(value)?value:epochMs(sourceSlot())}
  function targetMs(days){return rangeStartMs()+Number(days||0)*DAY}
  function fmtDate(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
  function degreeLabel(value){let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`}

  function astronomyLongitude(id,progressedMs){
    if(!window.Astronomy)return NaN;
    try{
      const body=window.Astronomy.Body?.[BODY_NAME[id]]||BODY_NAME[id];
      const vector=window.Astronomy.GeoVector(body,new Date(progressedMs),true);
      return norm(window.Astronomy.Ecliptic(vector).elon);
    }catch(_){return NaN}
  }
  function snapshotAt(target){
    const epoch=epochMs(sourceSlot());if(!Number.isFinite(epoch))return new Map();
    const progressed=epoch+((target-epoch)/YEAR)*DAY,map=new Map();
    for(const id of BODIES){const value=astronomyLongitude(id,progressed);if(Number.isFinite(value))map.set(id,value)}
    return map;
  }
  function interpolateSnapshot(from,to,fraction){
    const result=new Map();
    for(const id of BODIES){const a=from?.get(id),b=to?.get(id);if(Number.isFinite(a)&&Number.isFinite(b))result.set(id,norm(a+wrap(b-a)*fraction))}
    return result;
  }

  function itemLongitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const signs=core?.SIGNS||['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const sign=signs.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());
    if(sign<0)return NaN;
    return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
  }
  function canonicalId(value){return String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-')}
  function storedPlanetRecords(slot){
    const payload=read(slot);if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(v=>v&&typeof v==='object'),source=known||payload;
    const entries=Array.isArray(source)?source.map((item,index)=>[String(item?.id||item?.name||index),item]):Object.entries(source);
    const byId=new Map(),aliases={sol:'sun',luna:'moon'};
    for(const [key,item] of entries){
      if(!item||typeof item!=='object')continue;
      const candidates=[item.glyphId,item.id,item.name,item.label,item.body,item.planet,key].filter(Boolean);let id='';
      for(const candidate of candidates){const raw=canonicalId(candidate),resolved=window.RelphiGlyphRegistry&&(window.RelphiGlyphRegistry.resolve(raw)||window.RelphiGlyphRegistry.get(raw)),test=canonicalId(resolved?.id||aliases[raw]||raw);if(BODIES.includes(test)){id=test;break}}
      const value=itemLongitude(item);if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_NAME[id],value});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }
  function referenceRecords(){
    const source=sourceSlot(),mode=panel()?.querySelector('[data-progression-reference]')?.value==='other'?'other':'natal';
    return storedPlanetRecords(mode==='other'?otherSlot(source):source);
  }
  function referenceLabel(){const source=sourceSlot(),mode=panel()?.querySelector('[data-progression-reference]')?.value==='other'?'other':'natal';return mode==='other'?`Sky ${otherSlot(source)}`:`Natal Sky ${source}`}
  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function filterEnabled(id){return panel()?.querySelector(`[data-progression-filter="${id}"]`)?.getAttribute('aria-pressed')!=='false'}
  function progressionRecords(snapshot){return BODIES.map(id=>snapshot.has(id)?{id,name:BODY_NAME[id],value:snapshot.get(id)}:null).filter(Boolean)}
  function relationRows(snapshot){
    if(!core?.activeRelationships)return[];
    const progressed=progressionRecords(snapshot),reference=referenceRecords(),rows=[],orb=currentOrb();
    if(filterEnabled('intra'))rows.push(...core.activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(filterEnabled('inter'))rows.push(...core.activeRelationships(progressed,reference,orb,{mode:'inter'}));
    return rows.filter(row=>!(panel()?.querySelector('[data-progression-reference]')?.value!=='other'&&row.mode==='inter'&&row.aspect.id==='conjunction'&&row.left.id===row.right.id)).sort((a,b)=>a.error-b.error).slice(0,32);
  }

  function ensureSpeedOptions(){
    const select=speedControl();if(!select)return;
    const options=[['30','1 month/s'],['90','3 months/s'],['365.2422','1 year/s'],['730.4844','2 years/s'],['1826.211','5 years/s']];
    const current=select.value;
    select.replaceChildren(...options.map(([value,label])=>new Option(label,value)));
    if(current&&options.some(([value])=>value===current))select.value=current;
    if(!select.dataset.progressionSmoothDefaulted){select.dataset.progressionSmoothDefaulted='true';select.value='365.2422'}
  }
  function injectStyle(){
    if(document.getElementById('skyProgressionsSmoothPlaybackStyle'))return;
    const style=document.createElement('style');style.id='skyProgressionsSmoothPlaybackStyle';style.textContent=`
      .sky-progression-transport{position:sticky;top:.3rem;z-index:8;margin:.35rem 0 .45rem;padding:.45rem .5rem;border:1px solid rgba(25,23,20,.11);border-radius:.75rem;background:rgba(255,255,255,.96);backdrop-filter:blur(8px)}
      .sky-progression-transport .sky-progression-scrub-row{margin:0}.sky-progressions-panel .sky-progression-playback:empty{display:none}
      [data-progression-motion-overlay]{pointer-events:none}
      html[data-progression-live-playing="true"] [data-progression-shared-wheel] [data-layer="aspects"]{visibility:hidden}
      @media(max-width:520px){.sky-progression-transport{top:.15rem;padding:.38rem}}
    `;document.head.appendChild(style)
  }
  function installTransport(){
    const root=panel();if(!root)return false;
    const row=root.querySelector('.sky-progression-scrub-row'),view=root.querySelector('.sky-progressions-wheel-shell');if(!row||!view)return false;
    let transport=root.querySelector('.sky-progression-transport');if(!transport){transport=document.createElement('div');transport.className='sky-progression-transport';view.before(transport)}
    if(row.parentElement!==transport)transport.appendChild(row);
    const range=slider();if(range)range.step='any';ensureSpeedOptions();return true;
  }

  function captureLanes(slot){
    laneMap=new Map();const view=wheel(),allowed=LANES[slot];
    BODIES.forEach((id,index)=>{
      const host=view?.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`),raw=Number(host?.dataset.placementLane);
      const nearest=allowed.reduce((best,lane)=>Math.abs(lane-raw)<Math.abs(best-raw)?lane:best,allowed[0]);
      laneMap.set(id,Number.isFinite(raw)&&Math.abs(nearest-raw)<10?raw:allowed[index%allowed.length]);
    });
  }
  function removeAnimations(node){node?.querySelectorAll(':scope > animate, :scope > animateTransform').forEach(n=>n.remove())}
  function buildOverlay(slot,initialSnapshot){
    const view=wheel();if(!view)return false;
    view.querySelector('[data-progression-motion-overlay]')?.remove();
    overlay=svg('g',{'data-progression-motion-overlay':'true'});
    overlayLeaders=svg('g',{'data-progression-motion-leaders':'true'});
    overlayAspects=svg('g',{'data-progression-motion-aspects':'true'});
    overlayPlacements=svg('g',{'data-progression-motion-placements':'true'});
    overlay.append(overlayAspects,overlayLeaders,overlayPlacements);
    for(const id of BODIES){
      const original=view.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`);if(!original)continue;
      original.dataset.progressionMotionOriginal='true';original.style.visibility='hidden';
      const clone=original.cloneNode(true);clone.style.visibility='visible';clone.hidden=false;clone.dataset.progressionMotionBody=id;removeAnimations(clone);overlayPlacements.appendChild(clone);
      const leader=svg('line',{class:'sky-foundation-leader','data-progression-motion-leader':id,stroke:SKY[slot]});overlayLeaders.appendChild(leader);
    }
    view.appendChild(overlay);
    setOverlaySnapshot(initialSnapshot,slot);
    return true;
  }
  function restoreOriginals(){
    const view=wheel();view?.querySelectorAll('[data-progression-motion-original="true"]').forEach(node=>{node.style.removeProperty('visibility');delete node.dataset.progressionMotionOriginal});
    overlay?.remove();overlay=null;overlayPlacements=null;overlayLeaders=null;overlayAspects=null;
  }
  function setOverlaySnapshot(snapshot,slot){
    if(!overlayPlacements)return;
    for(const [id,longitude] of snapshot){
      const lane=laneMap.get(id)??LANES[slot][BODIES.indexOf(id)%LANES[slot].length],display=polar(lane,longitude),exact=polar(EXACT[slot],longitude);
      const host=overlayPlacements.querySelector(`[data-progression-motion-body="${CSS.escape(id)}"]`),leader=overlayLeaders?.querySelector(`[data-progression-motion-leader="${CSS.escape(id)}"]`);if(!host)continue;
      removeAnimations(host);host.setAttribute('transform',`translate(${display.x} ${display.y})`);
      if(leader){removeAnimations(leader);leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y)}
    }
  }
  function animateAttribute(node,name,from,to,duration,collector){
    const a=svg('animate',{attributeName:name,from,to,dur:`${duration}ms`,begin:'indefinite',fill:'freeze',calcMode:'linear'});node.appendChild(a);collector.push(a)
  }
  function startNativeSegment(from,to,slot,duration){
    if(!overlayPlacements)return;
    const animations=[];
    for(const id of BODIES){
      const a=from.get(id),b=to.get(id);if(!Number.isFinite(a)||!Number.isFinite(b))continue;
      const lane=laneMap.get(id)??LANES[slot][BODIES.indexOf(id)%LANES[slot].length],p0=polar(lane,a),p1=polar(lane,b),e0=polar(EXACT[slot],a),e1=polar(EXACT[slot],b);
      const host=overlayPlacements.querySelector(`[data-progression-motion-body="${CSS.escape(id)}"]`),leader=overlayLeaders?.querySelector(`[data-progression-motion-leader="${CSS.escape(id)}"]`);if(!host)continue;
      removeAnimations(host);host.setAttribute('transform',`translate(${p0.x} ${p0.y})`);
      const motion=svg('animateTransform',{attributeName:'transform',type:'translate',from:`${p0.x} ${p0.y}`,to:`${p1.x} ${p1.y}`,dur:`${duration}ms`,begin:'indefinite',fill:'freeze',calcMode:'linear'});host.appendChild(motion);animations.push(motion);
      if(leader){removeAnimations(leader);leader.setAttribute('x1',p0.x);leader.setAttribute('y1',p0.y);leader.setAttribute('x2',e0.x);leader.setAttribute('y2',e0.y);animateAttribute(leader,'x1',p0.x,p1.x,duration,animations);animateAttribute(leader,'y1',p0.y,p1.y,duration,animations);animateAttribute(leader,'x2',e0.x,e1.x,duration,animations);animateAttribute(leader,'y2',e0.y,e1.y,duration,animations)}
    }
    animations.forEach(a=>{try{a.beginElement()}catch(_){}});
  }
  function animateAspectOverlay(from,to,duration){
    if(!overlayAspects)return;
    overlayAspects.replaceChildren();
    const relations=relationRows(from),ref=new Map(referenceRecords().map(r=>[r.id,r.value])),animations=[];
    for(const relation of relations){
      const left0=from.get(relation.left.id),left1=to.get(relation.left.id),right0=relation.mode==='intra'?from.get(relation.right.id):ref.get(relation.right.id),right1=relation.mode==='intra'?to.get(relation.right.id):ref.get(relation.right.id);
      if(![left0,left1,right0,right1].every(Number.isFinite))continue;
      const a0=polar(165,left0),a1=polar(165,left1),b0=polar(165,right0),b1=polar(165,right1),line=svg('line',{class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`,stroke:relation.aspect.color,x1:a0.x,y1:a0.y,x2:b0.x,y2:b0.y});
      overlayAspects.appendChild(line);animateAttribute(line,'x1',a0.x,a1.x,duration,animations);animateAttribute(line,'y1',a0.y,a1.y,duration,animations);animateAttribute(line,'x2',b0.x,b1.x,duration,animations);animateAttribute(line,'y2',b0.y,b1.y,duration,animations);
    }
    animations.forEach(a=>{try{a.beginElement()}catch(_){}});
  }

  function renderAnnotations(snapshot,target){
    const items=[];
    for(const [id,value] of snapshot){
      if(!core?.signState)break;
      const future=segment?.toSnapshot?.get(id),delta=Number.isFinite(future)?wrap(future-value):0,state=core.signState(value,delta,1);
      if(state.kind&&filterEnabled(state.kind))items.push({category:state.kind,title:`${BODY_NAME[id]} ${state.kind==='ingress'?'entering':'leaving'} ${state.sign}`,meta:`${state.kind[0].toUpperCase()+state.kind.slice(1)} · ${state.degree.toFixed(2)}° ${state.sign}${delta<0?' · retrograde':''}`});
    }
    for(const relation of relationRows(snapshot)){
      const right=relation.mode==='intra'?`progressed ${relation.right.name}`:`${referenceLabel()} ${relation.right.name}`;
      items.push({category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)}`});
    }
    const html=items.slice(0,24).map(item=>`<article class="sky-progression-annotation is-${item.category}"><div class="sky-progression-annotation-time">${fmtDate(target)}</div><strong>${item.title}</strong><span>${item.meta}</span></article>`).join('')||'<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';
    if(html!==lastAnnotationHTML){lastAnnotationHTML=html;const host=panel()?.querySelector('[data-progression-annotations]');if(host)host.innerHTML=html}
  }
  function updateUi(days,snapshot,now){
    const range=slider();if(range)range.value=String(days);
    if(now-lastUi<UI_MS)return;lastUi=now;
    const target=targetMs(days),root=panel(),date=root?.querySelector('[data-progression-date-label]'),age=root?.querySelector('[data-progression-age-label]'),epoch=epochMs(sourceSlot());
    if(date)date.textContent=fmtDate(target);if(age&&Number.isFinite(epoch))age.textContent=`Secondary progression · ${((target-epoch)/YEAR).toFixed(2)} years after epoch`;
    renderAnnotations(snapshot,target);
  }

  function syncButton(){const button=playButton();if(!button)return;button.dataset.playing=playing?'true':'false';button.textContent=playing?'Pause':'Play';button.setAttribute('aria-label',playing?'Pause progressions':'Play progressions')}
  function launchSegment(fromDays,fromSnapshot){
    const range=slider(),max=Number(range?.max)||0,speed=Number(speedControl()?.value)||365.2422,toDays=Math.min(max,fromDays+speed*SEGMENT_MS/1000),duration=Math.max(1,(toDays-fromDays)/speed*1000),toSnapshot=snapshotAt(targetMs(toDays)),slot=sourceSlot();
    segment={fromDays,toDays,fromSnapshot,toSnapshot,start:performance.now(),duration};
    startNativeSegment(fromSnapshot,toSnapshot,slot,duration);animateAspectOverlay(fromSnapshot,toSnapshot,duration);
  }
  function currentVisual(now=performance.now()){
    if(!segment)return{days:Number(slider()?.value)||0,snapshot:new Map()};
    const fraction=clamp((now-segment.start)/segment.duration,0,1),days=segment.fromDays+(segment.toDays-segment.fromDays)*fraction;
    return{days,snapshot:interpolateSnapshot(segment.fromSnapshot,segment.toSnapshot,fraction)};
  }
  function stopPlayback({sync=true}={}){
    if(!playing)return;
    const visual=currentVisual();playing=false;if(raf)cancelAnimationFrame(raf);raf=0;document.documentElement.removeAttribute('data-progression-live-playing');
    if(slider())slider().value=String(visual.days);restoreOriginals();syncButton();
    if(sync&&slider()){
      synthetic=true;try{slider().dispatchEvent(new Event('input',{bubbles:true}))}finally{synthetic=false}
      setTimeout(()=>window.dispatchEvent(new Event('relphi:progressions-ring-enforce')),70);
    }
  }
  function startPlayback(){
    const range=slider(),view=wheel();if(!range||!view||!window.Astronomy)return;
    window.dispatchEvent(new Event('relphi:progressions-ring-enforce'));
    requestAnimationFrame(()=>{
      const slot=sourceSlot(),fromDays=Number(range.value)||0,fromSnapshot=snapshotAt(targetMs(fromDays));
      captureLanes(slot);if(!buildOverlay(slot,fromSnapshot))return;
      playing=true;document.documentElement.setAttribute('data-progression-live-playing','true');lastUi=0;lastAnnotationHTML='';syncButton();launchSegment(fromDays,fromSnapshot);
      function frame(now){
        if(!playing||!segment)return;
        const visual=currentVisual(now);updateUi(visual.days,visual.snapshot,now);
        const max=Number(slider()?.max)||0;
        if(visual.days>=max-.000001){setOverlaySnapshot(segment.toSnapshot,sourceSlot());if(slider())slider().value=String(max);stopPlayback({sync:true});return}
        if(now-segment.start>=segment.duration){setOverlaySnapshot(segment.toSnapshot,sourceSlot());launchSegment(segment.toDays,segment.toSnapshot)}
        raf=requestAnimationFrame(frame);
      }
      raf=requestAnimationFrame(frame);
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-progression-play]');
    if(button){event.preventDefault();event.stopImmediatePropagation();playing?stopPlayback({sync:true}):startPlayback();return}
    if(playing&&event.target.closest?.('[data-sky-middle-tab="comparison"], [data-progression-now], [data-final-now]'))stopPlayback({sync:false});
  },true);
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!synthetic&&playing)stopPlayback({sync:false})},true);
  document.addEventListener('change',event=>{if(playing&&event.target.matches?.('[data-progression-source], [data-progression-reference], [data-progression-range-start], [data-progression-range-end], [data-progression-speed]'))stopPlayback({sync:false})},true);
  window.addEventListener('relphi:sky-foundation-ready',()=>{if(playing)stopPlayback({sync:false});requestAnimationFrame(installTransport)});

  function start(){injectStyle();installTransport();setInterval(()=>{if(!playing)installTransport()},1200)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
