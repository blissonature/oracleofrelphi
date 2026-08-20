// Secondary progressions: Sky A is the fixed natal sky; Sky B's visual lane is reused for the progressed copy of Sky A.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsV1)return;
  window.__relphiSkyProgressionsV1=true;

  const core=window.RelphiSkyProgressionsCore;
  if(!core)return;
  const {DAY,YEAR,SIGNS,norm,wrap,aspectError,secondaryProgressedMs,signState,classifyMotion,activeRelationships}=core;
  const NS='http://www.w3.org/2000/svg';
  const KEY_A='relphiSkyChartA';
  const SKY={A:'#c9211e',B:'#2462d0'};
  const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
  const FILTER_DEFAULTS={ingress:true,egress:true,retrograde:true,direct:true,intra:true,inter:true};
  const C={x:600,y:600};
  const EXACT={A:323,B:414};
  const LANES={A:[287,299,283],B:[450,440,460]};
  const LAYOUT={bubbleRadius:17.2,minimumClearance:6,tangentialStep:.75,tangentialLimit:15};
  const DERIVED=new Set(['asc','ascendant','dsc','descendant','mc','midheaven','ic','imum-coeli','imumcoeli','part-of-fortune','fortune','pof']);
  const state={rangeStart:NaN,rangeEnd:NaN,target:NaN,filters:{...FILTER_DEFAULTS},corridor:1,renderId:0,raf:0,aspectWindowCache:new Map(),speedScale:new Map(),lastNatalSignature:'',wheel:null,wheelSignature:''};

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const readA=()=>{try{return JSON.parse(localStorage.getItem(KEY_A)||'null')}catch(_){return null}};
  const rawA=()=>localStorage.getItem(KEY_A)||'';
  const profile=payload=>payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{};
  const epochMs=payload=>{const p=profile(payload),stamp=p?.instant||p?.dateTime||payload?.instant||payload?.dateTime;if(!stamp)return NaN;const value=new Date(stamp).getTime();return Number.isFinite(value)?value:NaN};
  const natalEpoch=()=>epochMs(readA());
  const natalName=()=>readA()?.name||'Sky A';
  const fmtDate=ms=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms));
  const fmtDateTime=ms=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(ms));
  const dateInputValue=ms=>{const d=new Date(ms),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`};
  const parseDateInput=value=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return NaN;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0).getTime()};
  const degreeLabel=value=>{let total=Math.round(Math.abs(Number(value))*60),degree=Math.floor(total/60);total%=60;return`${degree}°${String(total).padStart(2,'0')}′`};
  const ageLabel=(epoch,target)=>{const years=(target-epoch)/YEAR;if(!Number.isFinite(years))return'';return years<2?`${years.toFixed(2)} years`:`${years.toFixed(1)} years`};
  const canonicalId=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const svg=(name,attrs={})=>{const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node};

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
      const raw=canonicalId(candidate),resolved=registry&&(registry.resolve?.(raw)||registry.get?.(raw)),id=canonicalId(resolved?.id||aliases[raw]||raw);
      if(id)return id;
    }
    return'';
  }
  function natalRecords(){
    const byId=new Map();
    for(const [key,item] of placementSource(readA())){
      const id=idFor(key,item),value=itemLongitude(item);
      if(BODIES.includes(id)&&Number.isFinite(value)&&!byId.has(id))byId.set(id,{id,name:BODY_NAME[id],value,item});
    }
    return BODIES.map(id=>byId.get(id)).filter(Boolean);
  }
  function astronomyBody(id){return window.Astronomy?.Body?.[BODY_NAME[id]]||BODY_NAME[id]}
  function longitudeAtProgressed(id,progressedMs){const astronomy=window.Astronomy;if(!astronomy)return NaN;const vector=astronomy.GeoVector(astronomyBody(id),new Date(progressedMs),true);return norm(astronomy.Ecliptic(vector).elon)}
  function progressedLongitude(id,targetMs){const epoch=natalEpoch();return longitudeAtProgressed(id,secondaryProgressedMs(epoch,targetMs))}
  function progressedRecords(targetMs){return BODIES.map(id=>({id,name:BODY_NAME[id],value:progressedLongitude(id,targetMs)})).filter(record=>Number.isFinite(record.value))}
  function progressedSpeed(id,targetMs){const epoch=natalEpoch(),p=secondaryProgressedMs(epoch,targetMs),step=.04*DAY;return wrap(longitudeAtProgressed(id,p+step)-longitudeAtProgressed(id,p-step))/.08}
  function speedAtProgressed(id,pMs){const step=.04*DAY;return wrap(longitudeAtProgressed(id,pMs+step)-longitudeAtProgressed(id,pMs-step))/.08}

  function defaultRange(){
    const epoch=natalEpoch();if(!Number.isFinite(epoch))return;
    state.rangeStart=epoch;state.rangeEnd=Math.max(epoch+DAY,Date.now());state.target=epoch;
    state.aspectWindowCache.clear();state.speedScale.clear();
  }
  function spreadPlacements(list,slot){
    const lanes=LANES[slot],placed=[],result=[],steps=Math.floor(LAYOUT.tangentialLimit/LAYOUT.tangentialStep);
    for(const record of list.slice().sort((a,b)=>a.value-b.value)){
      let chosen=null;
      for(let step=0;step<=steps&&!chosen;step+=1){
        const amount=step*LAYOUT.tangentialStep,offsets=step===0?[0]:[amount,-amount];
        for(const offset of offsets){
          for(const lane of lanes){
            const display=norm(record.value+offset),point=polar(lane,display),collision=placed.some(other=>Math.hypot(point.x-other.x,point.y-other.y)<LAYOUT.bubbleRadius*2+LAYOUT.minimumClearance);
            if(collision)continue;chosen={...record,lane,display,point};placed.push(point);break;
          }
          if(chosen)break;
        }
      }
      if(!chosen){const lane=lanes[0],display=record.value,point=polar(lane,display);chosen={...record,lane,display,point};placed.push(point)}
      result.push(chosen);
    }
    return result;
  }
  function wheelSource(){return document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')}
  function invalidateWheel(){state.wheel=null;state.wheelSignature='';document.querySelector('[data-progression-wheel-mount]')?.replaceChildren()}
  function derived(node){return DERIVED.has(canonicalId(node?.dataset?.placement||''))||node?.dataset?.angleAxis==='true'}

  function ensurePlanetHost(wheel,slot,id){
    const placements=wheel.querySelector('[data-layer="placements"]');if(!placements)return null;
    let host=placements.querySelector(`[data-sky="${slot}"][data-placement="${CSS.escape(id)}"]:not([data-angle-axis="true"])`);if(host)return host;
    host=svg('g',{'data-sky':slot,'data-placement':id});placements.appendChild(host);
    const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.resolve?.(id)||registry.get?.(id));
    if(entry&&component?.createBubble){try{component.createBubble(host,entry.id,{radius:17.2,padding:1,color:SKY[slot],fill:'#fffdf8',strokeWidth:1.8})}catch(_){}}
    return host;
  }
  function ensureLeader(wheel,slot,id){
    const leaders=wheel.querySelector('[data-layer="leaders"]');if(!leaders)return null;
    let leader=leaders.querySelector(`.sky-foundation-leader[data-sky="${slot}"][data-placement="${CSS.escape(id)}"]`);
    if(!leader){leader=svg('line',{class:'sky-foundation-leader','data-sky':slot,'data-placement':id,stroke:SKY[slot]});leaders.appendChild(leader)}
    return leader;
  }
  function prepareWheel(panel){
    const signature=rawA();
    if(state.wheel&&state.wheel.isConnected&&state.wheelSignature===signature)return state.wheel;
    const source=wheelSource(),mount=panel.querySelector('[data-progression-wheel-mount]');if(!source||!mount)return null;
    const wheel=source.cloneNode(true);wheel.dataset.progressionSharedWheel='true';wheel.setAttribute('aria-label','Progressions wheel. Sky A red is the fixed natal sky; blue is the secondary-progressed copy of Sky A.');
    mount.replaceChildren(wheel);state.wheel=wheel;state.wheelSignature=signature;
    const bHouses=wheel.querySelector('[data-layer="b-houses"]');if(bHouses)bHouses.style.display='none';
    wheel.querySelectorAll('[data-layer="placements"] [data-placement], [data-layer="leaders"] [data-placement]').forEach(node=>{if(derived(node))node.hidden=true});
    BODIES.forEach(id=>{ensurePlanetHost(wheel,'A',id);ensureLeader(wheel,'A',id);ensurePlanetHost(wheel,'B',id);ensureLeader(wheel,'B',id)});
    return wheel;
  }
  function updatePlacementRing(wheel,slot,records){
    const allowed=new Set(records.map(record=>record.id));
    wheel.querySelectorAll(`[data-layer="placements"] [data-sky="${slot}"][data-placement]`).forEach(node=>{node.hidden=derived(node)||!allowed.has(canonicalId(node.dataset.placement))});
    wheel.querySelectorAll(`[data-layer="leaders"] [data-sky="${slot}"][data-placement]`).forEach(node=>{node.hidden=derived(node)||!allowed.has(canonicalId(node.dataset.placement))});
    const points=new Map();
    for(const record of spreadPlacements(records,slot)){
      const host=ensurePlanetHost(wheel,slot,record.id),leader=ensureLeader(wheel,slot,record.id);if(!host)continue;
      const display=record.point,exact=polar(EXACT[slot],record.value);host.hidden=false;host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(record.lane);host.dataset.displayLongitude=record.display.toFixed(8);host.dataset.exactLongitude=record.value.toFixed(8);host.dataset.progressionVisualRing=slot==='A'?'natal-red-fixed':'progressed-blue';points.set(record.id,display);
      if(leader){leader.hidden=false;leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=record.value.toFixed(8)}
    }
    return points;
  }
  function updateAspectLayer(wheel,relations,natalPoints,progressedPoints){
    const layer=wheel.querySelector('[data-layer="aspects"]');if(!layer)return;layer.replaceChildren();
    for(const relation of relations){
      const from=progressedPoints.get(relation.left.id),to=relation.mode==='intra'?progressedPoints.get(relation.right.id):natalPoints.get(relation.right.id);
      if(!from||!to)continue;
      layer.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,class:`sky-foundation-aspect sky-progression-aspect is-${relation.mode}`,'data-aspect':relation.aspect.id,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-orb':relation.error.toFixed(6),'data-progression-scope':relation.mode}));
    }
  }
  function updateWheel(wheel,progressed,natal,relations){const natalPoints=updatePlacementRing(wheel,'A',natal),progressedPoints=updatePlacementRing(wheel,'B',progressed);updateAspectLayer(wheel,relations,natalPoints,progressedPoints)}

  function currentOrb(){const value=Number(document.querySelector('[data-filter="orb"]')?.value);return Number.isFinite(value)&&value>=0?value:1}
  function visibleAspectRows(progressed,natal){
    const orb=currentOrb(),rows=[];
    if(state.filters.intra)rows.push(...activeRelationships(progressed,progressed,orb,{mode:'intra'}));
    if(state.filters.inter)rows.push(...activeRelationships(progressed,natal,orb,{mode:'inter'}));
    return rows.filter(relation=>!(relation.mode==='inter'&&relation.aspect.id==='conjunction'&&relation.left.id===relation.right.id)).sort((a,b)=>a.error-b.error||a.aspect.angle-b.aspect.angle).slice(0,40);
  }
  function relationKey(relation){return`${relation.mode}|${relation.left.id}|${relation.right.id}|${relation.aspect.id}|${currentOrb().toFixed(3)}`}
  function relationErrorAt(relation,targetMs,natalMap){const a=progressedLongitude(relation.left.id,targetMs),b=relation.mode==='intra'?progressedLongitude(relation.right.id,targetMs):natalMap.get(relation.right.id)?.value;return Number.isFinite(a)&&Number.isFinite(b)?aspectError(a,b,relation.aspect.angle):Infinity}
  function refineBoundary(relation,a,b,natalMap,orb){let fa=relationErrorAt(relation,a,natalMap)-orb;for(let i=0;i<24;i+=1){const m=(a+b)/2,fm=relationErrorAt(relation,m,natalMap)-orb;if(Math.sign(fm)===Math.sign(fa)){a=m;fa=fm}else b=m}return(a+b)/2}
  function aspectWindowFor(relation,targetMs,natalMap){
    const key=relationKey(relation),cached=state.aspectWindowCache.get(key);if(cached&&targetMs>=cached.start&&targetMs<=cached.end)return cached;
    const orb=currentOrb(),step=14*DAY,maxSpan=80*YEAR,epoch=natalEpoch();let left=targetMs,right=targetMs,probe=targetMs;
    while(targetMs-left<maxSpan&&left>epoch){const next=Math.max(epoch,probe-step);if(relationErrorAt(relation,next,natalMap)>orb){left=refineBoundary(relation,next,probe,natalMap,orb);break}probe=next;left=probe;if(next===epoch)break}
    probe=targetMs;while(right-targetMs<maxSpan){const next=probe+step;if(relationErrorAt(relation,next,natalMap)>orb){right=refineBoundary(relation,probe,next,natalMap,orb);break}probe=next;right=probe}
    const result={start:Math.max(epoch,left),end:right};state.aspectWindowCache.set(key,result);return result;
  }
  function aspectMotion(relation,targetMs,natalMap){return classifyMotion(relationErrorAt(relation,targetMs-DAY,natalMap),relationErrorAt(relation,targetMs+DAY,natalMap),.0005)}
  function speedScale(id,targetMs){const epoch=natalEpoch(),p=secondaryProgressedMs(epoch,targetMs),key=`${id}|${Math.round(p/(10*DAY))}`;if(state.speedScale.has(key))return state.speedScale.get(key);let max=0;for(let offset=-20;offset<=20;offset+=5)max=Math.max(max,Math.abs(speedAtProgressed(id,p+offset*DAY)));const threshold=max*.12;state.speedScale.set(key,threshold);return threshold}
  function nearestStation(id,targetMs){
    const epoch=natalEpoch(),center=secondaryProgressedMs(epoch,targetMs),step=.25*DAY,candidates=[];
    function root(a,b){let fa=speedAtProgressed(id,a);for(let i=0;i<24;i+=1){const m=(a+b)/2,fm=speedAtProgressed(id,m);if(Math.sign(fm)===Math.sign(fa)){a=m;fa=fm}else b=m}return(a+b)/2}
    let previous=center-5*DAY,previousSpeed=speedAtProgressed(id,previous);for(let p=previous+step;p<=center+5*DAY;p+=step){const speed=speedAtProgressed(id,p);if(Math.sign(speed)!==Math.sign(previousSpeed))candidates.push(root(previous,p));previous=p;previousSpeed=speed}
    if(!candidates.length)return null;const station=candidates.reduce((best,value)=>Math.abs(value-center)<Math.abs(best-center)?value:best,candidates[0]),target=core.targetMsFromProgressedMs(epoch,station),after=speedAtProgressed(id,station+.08*DAY);return{targetMs:target,type:after<0?'retrograde':'direct'};
  }
  function stationAnnotation(id,targetMs){if(id==='sun'||id==='moon')return null;const speed=progressedSpeed(id,targetMs),threshold=speedScale(id,targetMs);if(!Number.isFinite(speed)||!Number.isFinite(threshold)||threshold<=0||Math.abs(speed)>threshold)return null;const station=nearestStation(id,targetMs);if(!station)return null;return{id:`station-${id}-${station.type}`,category:station.type,title:station.type==='retrograde'?`${BODY_NAME[id]} beginning retrograde`:`${BODY_NAME[id]} ending retrograde`,meta:`Station ${station.type==='retrograde'?'Rx':'direct'} · ${fmtDate(station.targetMs)} · speed ${Math.abs(speed).toFixed(3)}°/day`,sort:station.targetMs}}
  function signAnnotations(progressed,targetMs){const rows=[];for(const record of progressed){const speed=progressedSpeed(record.id,targetMs),status=signState(record.value,speed,state.corridor);if(!status.kind||!state.filters[status.kind])continue;const direction=status.direction==='retrograde'?' · retrograde':'';rows.push({id:`${status.kind}-${record.id}`,category:status.kind,title:`${record.name} ${status.kind==='ingress'?'entering':'leaving'} ${status.sign}`,meta:`${status.kind[0].toUpperCase()+status.kind.slice(1)} · ${status.degree.toFixed(2)}° ${status.sign}${direction} · ${state.corridor}° active window`,progress:status.progress,sort:targetMs})}return rows}
  function aspectAnnotations(relations,targetMs,natalMap){return relations.map(relation=>{const window=aspectWindowFor(relation,targetMs,natalMap),motion=aspectMotion(relation,targetMs,natalMap),right=relation.mode==='intra'?`progressed ${relation.right.name}`:`natal ${relation.right.name}`;return{id:`${relation.mode}-${relation.left.id}-${relation.right.id}-${relation.aspect.id}`,category:relation.mode,title:`Progressed ${relation.left.name} ${relation.aspect.name.toLowerCase()} ${right}`,meta:`${relation.mode==='intra'?'Intra':'Inter'} · orb ${degreeLabel(relation.error)} · ${motion} · ${fmtDate(window.start)}–${fmtDate(window.end)}`,sort:window.start}})}
  function annotationMarkup(item){const progress=Number.isFinite(item.progress)?`<div class="sky-progression-annotation-progress" aria-hidden="true"><i style="--progress:${Math.round(item.progress*100)}%"></i></div>`:'';return`<article class="sky-progression-annotation is-${esc(item.category)}" data-progression-annotation="${esc(item.id)}"><div class="sky-progression-annotation-time">${esc(fmtDate(state.target))}</div><strong>${esc(item.title)}</strong><span>${esc(item.meta)}</span>${progress}</article>`}
  function renderAnnotations(host,items){if(!items.length){host.innerHTML='<p class="sky-progression-no-events">No enabled temporal conditions are active at this point on the timeline.</p>';return}host.innerHTML=items.sort((a,b)=>a.sort-b.sort||a.title.localeCompare(b.title)).slice(0,24).map(annotationMarkup).join('')}

  async function render(){
    if(document.documentElement.hasAttribute('data-progression-live-playing'))return;
    const id=++state.renderId,panel=document.getElementById('skyProgressionsPanel');if(!panel||panel.hidden)return;const annotationHost=panel.querySelector('[data-progression-annotations]'),epoch=natalEpoch();
    if(!Number.isFinite(epoch)||!window.Astronomy){panel.dataset.progressionAvailable='false';annotationHost.innerHTML='<p class="sky-progression-no-events">Sky A needs a valid instant and Astronomy Engine.</p>';return}
    const wheel=prepareWheel(panel);if(!wheel){annotationHost.innerHTML='<p class="sky-progression-no-events">Load the Comparison wheel first so Progressions can reuse its geometry.</p>';return}
    panel.dataset.progressionAvailable='true';const natal=natalRecords(),progressed=progressedRecords(state.target),natalMap=new Map(natal.map(record=>[record.id,record])),relations=visibleAspectRows(progressed,natal);updateWheel(wheel,progressed,natal,relations);
    const items=[...signAnnotations(progressed,state.target)];if(state.filters.retrograde||state.filters.direct){for(const body of BODIES){const item=stationAnnotation(body,state.target);if(item&&state.filters[item.category])items.push(item)}}items.push(...aspectAnnotations(relations,state.target,natalMap));if(id!==state.renderId)return;
    renderAnnotations(annotationHost,items);panel.querySelector('[data-progression-date-label]').textContent=fmtDateTime(state.target);panel.querySelector('[data-progression-age-label]').textContent=`Secondary progression · ${ageLabel(epoch,state.target)} after epoch`;panel.querySelector('[data-progression-ring-label]').textContent=`Red: ${natalName()} natal (fixed) · Blue: secondary progressed ${natalName()}`;syncScrubber();
  }
  function scheduleRender(){if(document.documentElement.hasAttribute('data-progression-live-playing'))return;cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(render)}
  function syncScrubber(){const panel=document.getElementById('skyProgressionsPanel');if(!panel||!Number.isFinite(state.rangeStart)||!Number.isFinite(state.rangeEnd))return;const slider=panel.querySelector('[data-progression-scrubber]'),span=Math.max(1,(state.rangeEnd-state.rangeStart)/DAY),value=clamp((state.target-state.rangeStart)/DAY,0,span);slider.max=String(span);slider.step='any';slider.value=String(value);panel.querySelector('[data-progression-range-start]').value=dateInputValue(state.rangeStart);panel.querySelector('[data-progression-range-end]').value=dateInputValue(state.rangeEnd)}
  function setTarget(ms){state.target=clamp(ms,state.rangeStart,state.rangeEnd);scheduleRender()}
  function setRange(start,end){const epoch=natalEpoch();start=Math.max(epoch,start);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start+DAY)return false;state.rangeStart=start;state.rangeEnd=end;state.target=clamp(state.target,start,end);state.aspectWindowCache.clear();state.speedScale.clear();syncScrubber();scheduleRender();return true}

  function panelMarkup(){const filter=(id,label)=>`<button type="button" class="sky-progression-filter is-on" data-progression-filter="${id}" aria-pressed="true">${label}</button>`;return`<section id="skyProgressionsPanel" class="sky-progressions-panel" aria-label="Progressions" hidden><div class="sky-progressions-toolbar"><span class="sky-progressions-method">Sky A natal fixed · blue ring progressed</span><span class="sky-progressions-method">Secondary · 1 day = 1 year</span></div><p class="sky-progression-ring-key" data-progression-ring-label></p><div class="sky-progressions-wheel-shell"><div class="sky-progressions-wheel-mount" data-progression-wheel-mount></div></div><aside class="sky-progression-commentary" aria-label="Active temporal annotations"><header><span>Active now</span><strong data-progression-date-label></strong><small data-progression-age-label></small></header><div class="sky-progression-annotations" data-progression-annotations></div></aside><div class="sky-progression-filters" aria-label="Progression annotation filters">${filter('ingress','Ingress')}${filter('egress','Egress')}${filter('retrograde','Begin retrograde')}${filter('direct','End retrograde')}${filter('intra','Intra aspects')}${filter('inter','Inter aspects')}</div><div class="sky-progression-playback"><div class="sky-progression-range"><label>From <input type="date" data-progression-range-start></label><label>To <input type="date" data-progression-range-end></label></div><div class="sky-progression-scrub-row"><button type="button" data-progression-play>Play</button><input type="range" min="0" max="3650" step="any" value="0" data-progression-scrubber aria-label="Progression timeline"><select data-progression-speed aria-label="Playback speed"><option value="30">1 month/s</option><option value="90">3 months/s</option><option value="365.2422">1 year/s</option><option value="730.4844">2 years/s</option><option value="1826.211">5 years/s</option></select><button type="button" data-progression-now>Today</button></div><p class="sky-progression-rule">Red placements are the fixed natal Sky A. Blue placements are its secondary progressions. Ingress/egress conditions live inside the ${state.corridor}° threshold; aspects live only while inside the current Sky Chart orb.</p></div></section>`}
  function enhance(){const middle=document.getElementById('skyFoundationComparison');if(!middle||document.getElementById('skyProgressionsPanel'))return;const heading=middle.querySelector(':scope > .sky-foundation-heading'),tabs=document.createElement('div');tabs.className='sky-comparison-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Middle panel view');tabs.innerHTML='<button type="button" role="tab" aria-selected="true" data-sky-middle-tab="comparison">Comparison</button><button type="button" role="tab" aria-selected="false" data-sky-middle-tab="progressions">Progressions</button>';heading?.insertAdjacentElement('afterend',tabs);middle.insertAdjacentHTML('beforeend',panelMarkup());defaultRange();syncScrubber();middle.dataset.progressionsEnhanced='true'}
  function activate(name){const middle=document.getElementById('skyFoundationComparison'),panel=document.getElementById('skyProgressionsPanel');if(!middle||!panel)return;const progression=name==='progressions';middle.dataset.progressionsActive=progression?'true':'false';panel.hidden=!progression;middle.querySelectorAll('[data-sky-middle-tab]').forEach(button=>button.setAttribute('aria-selected',button.dataset.skyMiddleTab===name?'true':'false'));if(progression){refreshFromStorage();invalidateWheel();scheduleRender()}}
  function refreshFromStorage(){const signature=rawA(),changed=state.lastNatalSignature&&signature!==state.lastNatalSignature;if(changed){defaultRange();invalidateWheel()}state.lastNatalSignature=signature;state.aspectWindowCache.clear();state.speedScale.clear();syncScrubber()}

  document.addEventListener('click',event=>{const tab=event.target.closest?.('[data-sky-middle-tab]');if(tab){activate(tab.dataset.skyMiddleTab);return}const filter=event.target.closest?.('[data-progression-filter]');if(filter){const key=filter.dataset.progressionFilter;state.filters[key]=!state.filters[key];filter.classList.toggle('is-on',state.filters[key]);filter.setAttribute('aria-pressed',state.filters[key]?'true':'false');scheduleRender();return}if(event.target.closest?.('[data-progression-now]')){setTarget(clamp(Date.now(),state.rangeStart,state.rangeEnd));return}});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!document.documentElement.hasAttribute('data-progression-live-playing'))setTarget(state.rangeStart+Number(event.target.value)*DAY)});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-range-start], [data-progression-range-end]')){const panel=document.getElementById('skyProgressionsPanel'),start=parseDateInput(panel.querySelector('[data-progression-range-start]').value),end=parseDateInput(panel.querySelector('[data-progression-range-end]').value);if(!setRange(start,end))syncScrubber()}});
  window.addEventListener('storage',event=>{if(event.key===KEY_A){refreshFromStorage();if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true')scheduleRender()}});
  window.addEventListener('relphi:sky-orb-limit-changed',()=>{state.aspectWindowCache.clear();scheduleRender()});
  window.addEventListener('relphi:sky-foundation-ready',()=>{enhance();if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true'&&!document.documentElement.hasAttribute('data-progression-live-playing')){invalidateWheel();scheduleRender()}});
  function start(){enhance();state.lastNatalSignature=rawA();syncScrubber()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
