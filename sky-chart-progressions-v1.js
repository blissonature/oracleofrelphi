// Secondary-progressions playback using the canonical Comparison wheel and active temporal annotations.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsV1)return;
  window.__relphiSkyProgressionsV1=true;

  const core=window.RelphiSkyProgressionsCore;
  if(!core)return;
  const {DAY,YEAR,SIGNS,ASPECTS,norm,wrap,aspectError,secondaryProgressedMs,signState,classifyMotion,activeRelationships}=core;
  const NS='http://www.w3.org/2000/svg';
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SKY={A:'#c9211e',B:'#2462d0'};
  const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const BODY_LABEL=Object.fromEntries(BODIES.map(id=>[id,id.replace(/(^|-)([a-z])/g,(_,dash,char)=>`${dash?' ':''}${char.toUpperCase()}`)]));
  const FILTER_DEFAULTS={ingress:true,egress:true,retrograde:true,direct:true,intra:true,inter:true};
  const C={x:600,y:600};
  const R={bIn:166,bOut:323,zIn:323,zOut:414,aIn:414,aOut:574,bDegree:323,aDegree:414};
  const PLACEMENT_LAYOUT={bubbleRadius:17.2,minimumClearance:6,tangentialStep:.75,tangentialLimit:15,lanes:{A:[450,440,460],B:[287,299,283]}};
  const state={source:'A',reference:'natal',rangeStart:NaN,rangeEnd:NaN,target:NaN,playing:false,speed:30,filters:{...FILTER_DEFAULTS},corridor:1,renderId:0,raf:0,lastFrame:0,aspectWindowCache:new Map(),speedScale:new Map(),lastSourceSignature:'',lastReferenceSignature:'',wheel:null,wheelSignature:''};

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const read=slot=>{try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}};
  const raw=slot=>localStorage.getItem(KEYS[slot])||'';
  const profile=payload=>payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{};
  const epochMs=payload=>{const value=profile(payload),stamp=value?.instant||value?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const date=new Date(stamp).getTime();return Number.isFinite(date)?date:NaN};
  const fmtDate=ms=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms));
  const fmtDateTime=ms=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(ms));
  const dateInputValue=ms=>{const d=new Date(ms),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`};
  const parseDateInput=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0).getTime()};
  const degreeLabel=value=>{let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`};
  const ageLabel=(epoch,target)=>{const years=(target-epoch)/YEAR;if(!Number.isFinite(years))return'';return years<2?`${years.toFixed(2)} years`:`${years.toFixed(1)} years`};
  const canonicalId=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const svg=(name,attrs)=>{const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node};
  const annular=(inner,outer,start,end)=>{const span=norm(end-start)||360,large=span>180?1:0,a=polar(outer,start),b=polar(outer,start+span),c=polar(inner,start+span),d=polar(inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`};

  function placementSource(payload){
    if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;
    if(Array.isArray(source))return source.map((item,index)=>[String(item?.id||item?.name||item?.label||index),item]);
    return Object.entries(source).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
  }
  function itemLongitude(item){
    if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);
    const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||item?.zodiac||'').trim().toLowerCase());
    if(sign<0)return NaN;
    return norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600);
  }
  function idFor(key,item){
    const aliases={sol:'sun',luna:'moon',rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum-coeli':'ic',imumcoeli:'ic'};
    const registry=window.RelphiGlyphRegistry;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
      if(candidate==null)continue;
      const rawId=canonicalId(candidate),resolved=registry&&(registry.resolve(rawId)||registry.get(rawId)),test=canonicalId(resolved?.id||aliases[rawId]||rawId);
      if(test)return test;
    }
    return'';
  }
  function allStoredRecords(payload){
    const byId=new Map();
    for(const [key,item] of placementSource(payload)){
      const id=idFor(key,item),value=itemLongitude(item);
      if(id&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_LABEL[id]||id,value,item});
    }
    return[...byId.values()];
  }
  function storedRecords(payload){const byId=new Map(allStoredRecords(payload).map(record=>[record.id,record]));return BODIES.map(id=>byId.get(id)).filter(Boolean)}
  function sourcePayload(){return read(state.source)}
  function otherSlot(){return state.source==='A'?'B':'A'}
  function referencePayload(){return state.reference==='other'?read(otherSlot()):sourcePayload()}
  function referenceRecords(){return storedRecords(referencePayload())}
  function sourceEpoch(){return epochMs(sourcePayload())}
  function sourceName(){return sourcePayload()?.name||`Sky ${state.source}`}
  function referenceLabel(){if(state.reference==='other')return referencePayload()?.name||`Sky ${otherSlot()}`;return`Natal ${sourceName()}`}
  function astronomyBody(id){return window.Astronomy?.Body?.[BODY_NAME[id]]||BODY_NAME[id]}
  function longitudeAtProgressed(id,progressedMs){const astronomy=window.Astronomy;if(!astronomy)return NaN;const vector=astronomy.GeoVector(astronomyBody(id),new Date(progressedMs),true);return norm(astronomy.Ecliptic(vector).elon)}
  function progressedLongitude(id,targetMs){const epoch=sourceEpoch();return longitudeAtProgressed(id,secondaryProgressedMs(epoch,targetMs))}
  function progressedRecords(targetMs){return BODIES.map(id=>({id,name:BODY_LABEL[id],value:progressedLongitude(id,targetMs)})).filter(record=>Number.isFinite(record.value))}
  function progressedSpeed(id,targetMs){const epoch=sourceEpoch(),p=secondaryProgressedMs(epoch,targetMs),step=.04*DAY;return wrap(longitudeAtProgressed(id,p+step)-longitudeAtProgressed(id,p-step))/.08}
  function speedAtProgressed(id,pMs){const step=.04*DAY;return wrap(longitudeAtProgressed(id,pMs+step)-longitudeAtProgressed(id,pMs-step))/.08}
  function defaultRange(){
    const epoch=sourceEpoch();if(!Number.isFinite(epoch))return;
    state.rangeStart=epoch;state.rangeEnd=Math.max(epoch+DAY,Date.now());state.target=epoch;
    state.aspectWindowCache.clear();state.speedScale.clear();
  }
  function ensureValidSource(){if(Number.isFinite(epochMs(read(state.source))))return true;const alternative=state.source==='A'?'B':'A';if(Number.isFinite(epochMs(read(alternative)))){state.source=alternative;return true}return false}

  function houseCusps(payload){
    const p=profile(payload);
    for(const source of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){
      if(!source)continue;
      const values=(Array.isArray(source)?source:Object.values(source)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);
      if(values.length===12&&values.every(Number.isFinite))return values.map(norm);
    }
    const records=allStoredRecords(payload),ascRecord=records.find(record=>record.id==='asc'),asc=Number(ascRecord?.value??p.ascendant??payload?.ascendant??payload?.asc);
    const resolved=Number.isFinite(asc)?norm(asc):0,system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(resolved/30)*30:resolved;
    return Array.from({length:12},(_,index)=>norm(start+index*30));
  }
  function renderHouseLayer(wheel,layerName,cusps,inner,outer,slot){
    const layer=wheel.querySelector(`[data-layer="${layerName}"]`);if(!layer)return;
    layer.replaceChildren();
    cusps.forEach((start,index)=>{
      const end=cusps[(index+1)%12],span=norm(end-start)||30;
      layer.appendChild(svg('path',{d:annular(inner,outer,start,end),fill:COLORS[index],'fill-opacity':'.5'}));
      const a=polar(inner,end),b=polar(outer,end);layer.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:SKY[slot],class:'sky-foundation-divider'}));
      const point=polar((inner+outer)/2,start+span/2),text=svg('text',{x:point.x,y:point.y,class:'sky-foundation-house-number'});text.textContent=String(index+1);layer.appendChild(text);
    });
  }
  function spreadPlacements(list,slot){
    const lanes=PLACEMENT_LAYOUT.lanes[slot],placed=[],result=[],steps=Math.floor(PLACEMENT_LAYOUT.tangentialLimit/PLACEMENT_LAYOUT.tangentialStep),sorted=list.slice().sort((a,b)=>a.value-b.value);
    for(const record of sorted){
      let chosen=null;
      for(let step=0;step<=steps&&!chosen;step+=1){
        const magnitude=step*PLACEMENT_LAYOUT.tangentialStep,offsets=step===0?[0]:[magnitude,-magnitude];
        for(const offset of offsets){
          for(const lane of lanes){
            const display=norm(record.value+offset),point=polar(lane,display),collision=placed.some(other=>Math.hypot(point.x-other.x,point.y-other.y)<PLACEMENT_LAYOUT.bubbleRadius*2+PLACEMENT_LAYOUT.minimumClearance);
            if(collision)continue;chosen={...record,lane,display};placed.push(point);break;
          }
          if(chosen)break;
        }
      }
      if(!chosen)chosen={...record,lane:lanes[0],display:record.value};
      result.push(chosen);
    }
    return result;
  }
  function wheelSource(){return document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')}
  function roleSignature(){return`${state.source}|${state.reference}|${raw(state.source)}|${state.reference==='other'?raw(otherSlot()):raw(state.source)}`}
  function invalidateWheel(){state.wheel=null;state.wheelSignature='';document.querySelector('[data-progression-wheel-mount]')?.replaceChildren()}
  function prepareWheel(panel){
    const signature=roleSignature();
    if(state.wheel&&state.wheel.isConnected&&state.wheelSignature===signature)return state.wheel;
    const sourceWheel=wheelSource(),mount=panel.querySelector('[data-progression-wheel-mount]');if(!sourceWheel||!mount)return null;
    const wheel=sourceWheel.cloneNode(true);wheel.dataset.progressionSharedWheel='true';wheel.setAttribute('aria-label','Progressions comparison wheel. Outer ring is the reference sky; inner ring is the progressed source.');
    mount.replaceChildren(wheel);state.wheel=wheel;state.wheelSignature=signature;
    renderHouseLayer(wheel,'a-houses',houseCusps(referencePayload()),R.aIn,R.aOut,'A');
    renderHouseLayer(wheel,'b-houses',houseCusps(sourcePayload()),R.bIn,R.bOut,'B');
    return wheel;
  }
  function updatePlacementRing(wheel,slot,records){
    const placements=wheel.querySelectorAll(`[data-layer="placements"] [data-sky="${slot}"]`),leaders=wheel.querySelectorAll(`[data-layer="leaders"] [data-sky="${slot}"]`),allowed=new Set(records.map(record=>record.id));
    placements.forEach(node=>{node.hidden=!allowed.has(node.dataset.placement)});leaders.forEach(node=>{node.hidden=!allowed.has(node.dataset.placement)});
    const exactRadius=slot==='A'?R.aDegree:R.bDegree;
    for(const record of spreadPlacements(records,slot)){
      const host=wheel.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(record.id)}"]`),leader=wheel.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="${slot}"][data-placement="${CSS.escape(record.id)}"]`);if(!host)continue;
      const display=polar(record.lane,record.display),exact=polar(exactRadius,record.value);host.hidden=false;host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(record.lane);host.dataset.displayLongitude=record.display.toFixed(8);host.dataset.exactLongitude=record.value.toFixed(8);
      if(leader){leader.hidden=false;leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=record.value.toFixed(8)}
    }
  }
  function updateAspectLayer(wheel,relations){
    const layer=wheel.querySelector('[data-layer="aspects"]');if(!layer)return;layer.replaceChildren();
    for(const relation of relations){
      const from=polar(R.bIn-1,relation.left.value),to=polar(R.bIn-1,relation.right.value),line=svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`,'data-aspect':relation.aspect.id,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-orb':relation.error.toFixed(6),'data-progression-scope':relation.mode});
      layer.appendChild(line);
    }
  }
  function updateWheel(wheel,progressed,reference,relations){updatePlacementRing(wheel,'A',reference);updatePlacementRing(wheel,'B',progressed);updateAspectLayer(wheel,relations)}

  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function visibleAspectRows(progressed,reference){
    const orb=currentOrb(),rows=[];
    if(state.filters.intra)rows.push(...activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(state.filters.inter&&reference.length)rows.push(...activeRelationships(progressed,reference,orb,{mode:'inter'}));
    return rows.filter(relation=>!(state.reference==='natal'&&relation.mode==='inter'&&relation.aspect.id==='conjunction'&&relation.left.id===relation.right.id)).sort((a,b)=>a.error-b.error||a.aspect.angle-b.aspect.angle).slice(0,40);
  }
  function relationKey(relation){return`${state.source}|${state.reference}|${relation.mode}|${relation.left.id}|${relation.right.id}|${relation.aspect.id}|${currentOrb().toFixed(3)}`}
  function relationErrorAt(relation,targetMs,referenceMap){const a=progressedLongitude(relation.left.id,targetMs),b=relation.mode==='intra'?progressedLongitude(relation.right.id,targetMs):referenceMap.get(relation.right.id)?.value;return Number.isFinite(a)&&Number.isFinite(b)?aspectError(a,b,relation.aspect.angle):Infinity}
  function refineBoundary(relation,a,b,referenceMap,orb){let fa=relationErrorAt(relation,a,referenceMap)-orb;for(let i=0;i<24;i+=1){const m=(a+b)/2,fm=relationErrorAt(relation,m,referenceMap)-orb;if(Math.sign(fm)===Math.sign(fa)){a=m;fa=fm}else b=m}return(a+b)/2}
  function aspectWindowFor(relation,targetMs,referenceMap){
    const key=relationKey(relation),cached=state.aspectWindowCache.get(key);if(cached&&targetMs>=cached.start&&targetMs<=cached.end)return cached;
    const orb=currentOrb(),step=14*DAY,maxSpan=80*YEAR,epoch=sourceEpoch();let left=targetMs,right=targetMs,probe=targetMs;
    while(targetMs-left<maxSpan&&left>epoch){const next=Math.max(epoch,probe-step);if(relationErrorAt(relation,next,referenceMap)>orb){left=refineBoundary(relation,next,probe,referenceMap,orb);break}probe=next;left=probe;if(next===epoch)break}
    probe=targetMs;while(right-targetMs<maxSpan){const next=probe+step;if(relationErrorAt(relation,next,referenceMap)>orb){right=refineBoundary(relation,probe,next,referenceMap,orb);break}probe=next;right=probe}
    const result={start:Math.max(epoch,left),end:right};state.aspectWindowCache.set(key,result);return result;
  }
  function aspectMotion(relation,targetMs,referenceMap){return classifyMotion(relationErrorAt(relation,targetMs-DAY,referenceMap),relationErrorAt(relation,targetMs+DAY,referenceMap),.0005)}
  function speedScale(id,targetMs){const epoch=sourceEpoch(),p=secondaryProgressedMs(epoch,targetMs),key=`${id}|${Math.round(p/(10*DAY))}`;if(state.speedScale.has(key))return state.speedScale.get(key);let max=0;for(let offset=-20;offset<=20;offset+=5)max=Math.max(max,Math.abs(speedAtProgressed(id,p+offset*DAY)));const threshold=max*.12;state.speedScale.set(key,threshold);return threshold}
  function nearestStation(id,targetMs){
    const epoch=sourceEpoch(),center=secondaryProgressedMs(epoch,targetMs),step=.25*DAY,candidates=[];
    function root(a,b){let fa=speedAtProgressed(id,a);for(let i=0;i<24;i+=1){const m=(a+b)/2,fm=speedAtProgressed(id,m);if(Math.sign(fm)===Math.sign(fa)){a=m;fa=fm}else b=m}return(a+b)/2}
    let previous=center-5*DAY,previousSpeed=speedAtProgressed(id,previous);for(let p=previous+step;p<=center+5*DAY;p+=step){const speed=speedAtProgressed(id,p);if(Math.sign(speed)!==Math.sign(previousSpeed))candidates.push(root(previous,p));previous=p;previousSpeed=speed}
    if(!candidates.length)return null;const station=candidates.reduce((best,value)=>Math.abs(value-center)<Math.abs(best-center)?value:best,candidates[0]),target=core.targetMsFromProgressedMs(epoch,station),after=speedAtProgressed(id,station+.08*DAY);return{targetMs:target,type:after<0?'retrograde':'direct'};
  }
  function stationAnnotation(id,targetMs){if(id==='sun'||id==='moon')return null;const speed=progressedSpeed(id,targetMs),threshold=speedScale(id,targetMs);if(!Number.isFinite(speed)||!Number.isFinite(threshold)||threshold<=0||Math.abs(speed)>threshold)return null;const station=nearestStation(id,targetMs);if(!station)return null;return{id:`station-${id}-${station.type}`,category:station.type,title:station.type==='retrograde'?`${BODY_LABEL[id]} beginning retrograde`:`${BODY_LABEL[id]} ending retrograde`,meta:`Station ${station.type==='retrograde'?'Rx':'direct'} · ${fmtDate(station.targetMs)} · speed ${Math.abs(speed).toFixed(3)}°/day`,sort:station.targetMs}}
  function signAnnotations(progressed,targetMs){const rows=[];for(const record of progressed){const speed=progressedSpeed(record.id,targetMs),status=signState(record.value,speed,state.corridor);if(!status.kind||!state.filters[status.kind])continue;const degree=status.degree.toFixed(2),verb=status.kind==='ingress'?'entering':'leaving',direction=status.direction==='retrograde'?' · retrograde':'';rows.push({id:`${status.kind}-${record.id}`,category:status.kind,title:`${record.name} ${verb} ${status.sign}`,meta:`${status.kind[0].toUpperCase()+status.kind.slice(1)} · ${degree}° ${status.sign}${direction} · ${state.corridor}° active window`,progress:status.progress,sort:targetMs})}return rows}
  function aspectAnnotations(relations,targetMs,referenceMap){return relations.map(relation=>{const window=aspectWindowFor(relation,targetMs,referenceMap),motion=aspectMotion(relation,targetMs,referenceMap),right=relation.mode==='intra'?`progressed ${relation.right.name}`:`${referenceLabel()} ${relation.right.name}`;return{id:`${relation.mode}-${relation.left.id}-${relation.right.id}-${relation.aspect.id}`,category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)} · ${motion} · ${fmtDate(window.start)}–${fmtDate(window.end)}`,sort:window.start}})}
  function annotationMarkup(item){const progress=Number.isFinite(item.progress)?`<div class="sky-progression-annotation-progress" aria-hidden="true"><i style="--progress:${Math.round(item.progress*100)}%"></i></div>`:'';return`<article class="sky-progression-annotation is-${esc(item.category)}" data-progression-annotation="${esc(item.id)}"><div class="sky-progression-annotation-time">${esc(fmtDate(state.target))}</div><strong>${esc(item.title)}</strong><span>${esc(item.meta)}</span>${progress}</article>`}
  function renderAnnotations(host,items){if(!items.length){host.innerHTML='<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';return}host.innerHTML=items.sort((a,b)=>a.sort-b.sort||a.title.localeCompare(b.title)).slice(0,24).map(annotationMarkup).join('')}

  async function render(){
    const id=++state.renderId,panel=document.getElementById('skyProgressionsPanel');if(!panel||panel.hidden)return;const annotationHost=panel.querySelector('[data-progression-annotations]'),epoch=sourceEpoch();
    if(!Number.isFinite(epoch)||!window.Astronomy){panel.dataset.progressionAvailable='false';annotationHost.innerHTML='<p class="sky-progression-no-events">A stored sky with a valid instant and Astronomy Engine is required.</p>';return}
    const wheel=prepareWheel(panel);if(!wheel){annotationHost.innerHTML='<p class="sky-progression-no-events">Load the Comparison wheel first so Progressions can reuse it.</p>';return}
    panel.dataset.progressionAvailable='true';const progressed=progressedRecords(state.target),reference=referenceRecords(),referenceMap=new Map(reference.map(record=>[record.id,record])),relations=visibleAspectRows(progressed,reference);updateWheel(wheel,progressed,reference,relations);
    const items=[...signAnnotations(progressed,state.target)];if(state.filters.retrograde||state.filters.direct){for(const body of BODIES){const item=stationAnnotation(body,state.target);if(item&&state.filters[item.category])items.push(item)}}items.push(...aspectAnnotations(relations,state.target,referenceMap));if(id!==state.renderId)return;
    renderAnnotations(annotationHost,items);panel.querySelector('[data-progression-date-label]').textContent=fmtDateTime(state.target);panel.querySelector('[data-progression-age-label]').textContent=`Secondary progression · ${ageLabel(epoch,state.target)} after epoch`;panel.querySelector('[data-progression-ring-label]').textContent=`Outer: ${referenceLabel()} · Inner: Progressed ${sourceName()}`;syncScrubber();
  }
  function scheduleRender(){cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(render)}
  function syncScrubber(){const panel=document.getElementById('skyProgressionsPanel');if(!panel||!Number.isFinite(state.rangeStart)||!Number.isFinite(state.rangeEnd))return;const slider=panel.querySelector('[data-progression-scrubber]'),span=Math.max(1,Math.round((state.rangeEnd-state.rangeStart)/DAY)),value=clamp(Math.round((state.target-state.rangeStart)/DAY),0,span);slider.max=String(span);slider.value=String(value);panel.querySelector('[data-progression-range-start]').value=dateInputValue(state.rangeStart);panel.querySelector('[data-progression-range-end]').value=dateInputValue(state.rangeEnd)}
  function setTarget(ms){state.target=clamp(ms,state.rangeStart,state.rangeEnd);scheduleRender()}
  function setRange(start,end){const epoch=sourceEpoch();start=Math.max(epoch,start);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start+DAY)return false;state.rangeStart=start;state.rangeEnd=end;state.target=clamp(state.target,start,end);state.aspectWindowCache.clear();state.speedScale.clear();syncScrubber();scheduleRender();return true}
  function stop(){state.playing=false;state.lastFrame=0;const button=document.querySelector('[data-progression-play]');if(button){button.dataset.playing='false';button.textContent='Play';button.setAttribute('aria-label','Play progressions')}}
  function play(){if(state.playing){stop();return}state.playing=true;state.lastFrame=performance.now();const button=document.querySelector('[data-progression-play]');if(button){button.dataset.playing='true';button.textContent='Pause';button.setAttribute('aria-label','Pause progressions')}function frame(now){if(!state.playing)return;const elapsed=(now-state.lastFrame)/1000;state.lastFrame=now;const next=state.target+elapsed*state.speed*DAY;if(next>=state.rangeEnd){setTarget(state.rangeEnd);stop();return}state.target=next;scheduleRender();requestAnimationFrame(frame)}requestAnimationFrame(frame)}
  function panelMarkup(){const filter=(id,label)=>`<button type="button" class="sky-progression-filter is-on" data-progression-filter="${id}" aria-pressed="true">${label}</button>`;return`<section id="skyProgressionsPanel" class="sky-progressions-panel" aria-label="Progressions" hidden><div class="sky-progressions-toolbar"><label>Progress <select data-progression-source aria-label="Progression source"><option value="A">Sky A</option><option value="B">Sky B</option></select></label><span class="sky-progressions-method">Secondary · 1 day = 1 year</span><label>Inter reference <select data-progression-reference aria-label="Inter-aspect reference"><option value="natal">Natal source</option><option value="other">Other sky</option></select></label></div><p class="sky-progression-ring-key" data-progression-ring-label></p><div class="sky-progressions-wheel-shell"><div class="sky-progressions-wheel-mount" data-progression-wheel-mount></div></div><aside class="sky-progression-commentary" aria-label="Active temporal annotations"><header><span>Active now</span><strong data-progression-date-label></strong><small data-progression-age-label></small></header><div class="sky-progression-annotations" data-progression-annotations></div></aside><div class="sky-progression-filters" aria-label="Progression annotation filters">${filter('ingress','Ingress')}${filter('egress','Egress')}${filter('retrograde','Begin retrograde')}${filter('direct','End retrograde')}${filter('intra','Intra aspects')}${filter('inter','Inter aspects')}</div><div class="sky-progression-playback"><div class="sky-progression-range"><label>From <input type="date" data-progression-range-start></label><label>To <input type="date" data-progression-range-end></label></div><div class="sky-progression-scrub-row"><button type="button" data-progression-play>Play</button><input type="range" min="0" max="3650" step="1" value="0" data-progression-scrubber aria-label="Progression timeline"><select data-progression-speed aria-label="Playback speed"><option value="30">1 month/s</option><option value="90">3 months/s</option><option value="365.2422">1 year/s</option></select><button type="button" data-progression-now>Today</button></div><p class="sky-progression-rule">Ingress and egress annotations remain visible only inside the ${state.corridor}° threshold. Aspect annotations remain visible only while the relationship is inside the current Sky Chart orb.</p></div></section>`}
  function enhance(){const middle=document.getElementById('skyFoundationComparison');if(!middle||document.getElementById('skyProgressionsPanel'))return;const heading=middle.querySelector(':scope > .sky-foundation-heading'),tabs=document.createElement('div');tabs.className='sky-comparison-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Middle panel view');tabs.innerHTML='<button type="button" role="tab" aria-selected="true" data-sky-middle-tab="comparison">Comparison</button><button type="button" role="tab" aria-selected="false" data-sky-middle-tab="progressions">Progressions</button>';heading?.insertAdjacentElement('afterend',tabs);middle.insertAdjacentHTML('beforeend',panelMarkup());if(!ensureValidSource())document.getElementById('skyProgressionsPanel').dataset.progressionAvailable='false';defaultRange();const panel=document.getElementById('skyProgressionsPanel');panel.querySelector('[data-progression-source]').value=state.source;panel.querySelector('[data-progression-reference]').value=state.reference;syncScrubber();middle.dataset.progressionsEnhanced='true'}
  function activate(name){const middle=document.getElementById('skyFoundationComparison'),panel=document.getElementById('skyProgressionsPanel');if(!middle||!panel)return;const progression=name==='progressions';middle.dataset.progressionsActive=progression?'true':'false';panel.hidden=!progression;middle.querySelectorAll('[data-sky-middle-tab]').forEach(button=>button.setAttribute('aria-selected',button.dataset.skyMiddleTab===name?'true':'false'));if(progression){stop();refreshFromStorage();invalidateWheel();scheduleRender()}else stop()}
  function refreshFromStorage(){
    if(!ensureValidSource())return;
    const sourceSignature=raw(state.source),referenceSignature=state.reference==='other'?raw(otherSlot()):sourceSignature,sourceChanged=state.lastSourceSignature&&sourceSignature!==state.lastSourceSignature,referenceChanged=state.lastReferenceSignature&&referenceSignature!==state.lastReferenceSignature;
    if(sourceChanged){defaultRange();invalidateWheel()}else if(referenceChanged)invalidateWheel();
    state.lastSourceSignature=sourceSignature;state.lastReferenceSignature=referenceSignature;state.aspectWindowCache.clear();state.speedScale.clear();const source=document.querySelector('[data-progression-source]');if(source)source.value=state.source;const otherOption=document.querySelector('[data-progression-reference] option[value="other"]');if(otherOption)otherOption.disabled=!read(otherSlot());syncScrubber();
  }

  document.addEventListener('click',event=>{const tab=event.target.closest?.('[data-sky-middle-tab]');if(tab){activate(tab.dataset.skyMiddleTab);return}const filter=event.target.closest?.('[data-progression-filter]');if(filter){const key=filter.dataset.progressionFilter;state.filters[key]=!state.filters[key];filter.classList.toggle('is-on',state.filters[key]);filter.setAttribute('aria-pressed',state.filters[key]?'true':'false');scheduleRender();return}if(event.target.closest?.('[data-progression-play]')){play();return}if(event.target.closest?.('[data-progression-now]')){setTarget(clamp(Date.now(),state.rangeStart,state.rangeEnd));return}});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')){stop();setTarget(state.rangeStart+Number(event.target.value)*DAY)}});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-source]')){stop();state.source=event.target.value==='B'?'B':'A';state.reference='natal';document.querySelector('[data-progression-reference]').value='natal';defaultRange();invalidateWheel();state.lastSourceSignature=raw(state.source);state.lastReferenceSignature=state.lastSourceSignature;scheduleRender();return}if(event.target.matches?.('[data-progression-reference]')){state.reference=event.target.value==='other'?'other':'natal';state.aspectWindowCache.clear();state.lastReferenceSignature=state.reference==='other'?raw(otherSlot()):raw(state.source);invalidateWheel();scheduleRender();return}if(event.target.matches?.('[data-progression-speed]')){state.speed=Number(event.target.value)||30;return}if(event.target.matches?.('[data-progression-range-start], [data-progression-range-end]')){const panel=document.getElementById('skyProgressionsPanel'),start=parseDateInput(panel.querySelector('[data-progression-range-start]').value),end=parseDateInput(panel.querySelector('[data-progression-range-end]').value);if(!setRange(start,end))syncScrubber();return}});
  window.addEventListener('relphi:sky-orb-limit-changed',()=>{state.aspectWindowCache.clear();scheduleRender()});window.addEventListener('relphi:sky-foundation-ready',()=>{enhance();if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true'){invalidateWheel();scheduleRender()}});setInterval(()=>{if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true')refreshFromStorage()},1000);
  function start(){enhance();state.lastSourceSignature=raw(state.source);state.lastReferenceSignature=state.reference==='other'?raw(otherSlot()):state.lastSourceSignature;syncScrubber()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
