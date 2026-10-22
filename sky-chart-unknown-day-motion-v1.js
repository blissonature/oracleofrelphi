// Unknown-time Sky Chart: reversible civil-day exploration of hypothetical angles,
// Vertex, Fortune and planetary aspects. Never saves or rewrites an unknown birth time.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyUnknownDayMotionV1)return;
window.__relphiSkyUnknownDayMotionV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const PLANETS={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
const FAST=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
const DERIVED=['asc','dsc','mc','ic','vertex','anti-vertex','part-of-fortune'];
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const IDS={asc:'asc',ascendant:'asc',rising:'asc',dsc:'dsc',descendant:'dsc',mc:'mc',midheaven:'mc',mediumcoeli:'mc',ic:'ic',imumcoeli:'ic',vertex:'vertex',antivertex:'anti-vertex',avx:'anti-vertex',partoffortune:'part-of-fortune',fortune:'part-of-fortune',northnode:'north-node',southnode:'south-node',lilith:'lilith'};
const NO_PAIRS=new Set(['asc|dsc','ic|mc','north-node|south-node','anti-vertex|vertex']);
const NS='http://www.w3.org/2000/svg',MINUTE=60000,HOUR=3600000,EPHEMERIS_STEP=30*MINUTE;
const state={selected:'',identity:'',date:null,minutes:0,exploring:false,playing:false,raf:0,lastFrame:0,wheel:null,markerLayer:null,lineLayer:null,markers:new Map(),lines:new Map(),hidden:[],cache:new Map(),ui:null,enabled:false,paintCount:0};
const norm=x=>((Number(x)%360)+360)%360;
const shortest=(a,b)=>((Number(b)-Number(a)+540)%360)-180;
const rad=x=>x*Math.PI/180;
const deg=x=>x*180/Math.PI;
const interpolate=(a,b,f)=>norm(a+shortest(a,b)*f);
const attr=(node,key,value)=>node.setAttribute(key,String(value));
function el(name,attrs){
  const node=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs||{}))attr(node,key,value);
  return node;
}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function identity(value){return String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'')}
function idFor(key,item){const raw=identity(item?.glyphId||item?.id||item?.name||item?.label||key);return IDS[raw]||raw}
function source(payload){const p=payload?.placements||payload?.positions||payload?.points||payload?.bodies||{};return Array.isArray(p)?p.map((v,i)=>[v?.name||String(i),v]):Object.entries(p)}
function longitude(item){
  if(item?.longitude!==''&&item?.longitude!=null&&Number.isFinite(Number(item.longitude)))return norm(item.longitude);
  const sign=SIGNS.findIndex(name=>name.toLowerCase()===String(item?.sign||'').toLowerCase());
  return sign<0?NaN:norm(sign*30+Number(item.degree||0)+Number(item.minute||0)/60+Number(item.second||0)/3600);
}
function fixedPositions(payload){
  const out={};
  for(const [key,item] of source(payload)){const id=idFor(key,item),lon=longitude(item);if(id&&Number.isFinite(lon))out[id]=lon}
  return out;
}
function unknown(slot){
  const p=read(slot)?.calcProfile;
  if(!p||p.timeUnknown!==true)return null;
  const lat=Number(p.latitude),lon=Number(p.longitude),zone=String(p.timeZone||''),day=String(p.dateTime||'').slice(0,10);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>=89.9||!zone||!window.luxon?.DateTime||!/^\d{4}-\d\d-\d\d$/.test(day))return null;
  const local=window.luxon.DateTime.fromISO(day,{zone}).startOf('day');
  const next=local.plus({days:1});
  if(!local.isValid||!next.isValid||!Number.isFinite(local.toMillis())||next.toMillis()<=local.toMillis())return null;
  return{slot,day,zone,lat,lon,start:local.toMillis(),end:next.toMillis(),duration:(next.toMillis()-local.toMillis())/MINUTE};
}
function candidates(){return['A','B'].map(unknown).filter(Boolean)}
function astronomyLongitude(id,date){
  const A=window.Astronomy;if(!A)return NaN;
  try{
    if(id==='moon')return norm(A.EclipticGeoMoon(date).lon);
    return norm(A.Ecliptic(A.GeoVector(PLANETS[id],date,true)).elon);
  }catch(_){return NaN}
}
function ephemeris(id,ms){
  if(!Number.isFinite(ms))return NaN;
  const start=Math.floor(ms/EPHEMERIS_STEP)*EPHEMERIS_STEP,key=id+':'+start;
  let pair=state.cache.get(key);
  if(!pair){
    if(id==='chiron'&&window.RelphiChironEphemeris?.longitudeAt)pair=[window.RelphiChironEphemeris.longitudeAt(new Date(start)),window.RelphiChironEphemeris.longitudeAt(new Date(start+EPHEMERIS_STEP))];
    else if(PLANETS[id])pair=[astronomyLongitude(id,new Date(start)),astronomyLongitude(id,new Date(start+EPHEMERIS_STEP))];
    else return NaN;
    if(!pair.every(Number.isFinite))return NaN;
    if(state.cache.size>1000)state.cache.clear();
    state.cache.set(key,pair);
  }
  return interpolate(pair[0],pair[1],(ms-start)/EPHEMERIS_STEP);
}
function sidereal(date,geoLon){
  return norm(window.Astronomy.SiderealTime(date)*15+geoLon);
}
function angles(ms,lat,lon,solar,moon){
  const date=new Date(ms),theta=sidereal(date,lon),epsilon=Number(window.Astronomy.e_tilt(date).tobl),phi=rad(lat);
  const asc=norm(deg(Math.atan2(-Math.cos(rad(theta)),Math.sin(rad(theta))*Math.cos(rad(epsilon))+Math.tan(phi)*Math.sin(rad(epsilon))))+180);
  const mc=norm(deg(Math.atan2(Math.sin(rad(theta)),Math.cos(rad(theta))*Math.cos(rad(epsilon)))));
  // Same Swiss-style prime-vertical convention as RelphiSkyExtraPoints V3.
  const x=norm(theta-90),poleLatitude=lat>=0?90-lat:-90-lat;
  let vertex=norm(deg(Math.atan2(Math.sin(rad(x)),Math.cos(rad(epsilon))*Math.cos(rad(x))-Math.sin(rad(epsilon))*Math.tan(rad(poleLatitude)))));
  if(Math.abs(lat)<=epsilon&&((vertex-mc+540)%360)-180>0)vertex=norm(vertex+180);
  let day;
  try{const alt=window.SunCalc?.getPosition?.(date,lat,lon)?.altitude;if(Number.isFinite(alt))day=alt>0}catch(_){}
  if(day===undefined){
    // Ecliptic Sun -> equatorial RA/Dec -> local horizon altitude (no network).
    const lambda=rad(solar),eps=rad(epsilon),decl=Math.asin(Math.sin(eps)*Math.sin(lambda));
    const ra=norm(deg(Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda))));
    const hour=rad(((theta-ra+540)%360)-180);
    const altitude=Math.asin(Math.sin(phi)*Math.sin(decl)+Math.cos(phi)*Math.cos(decl)*Math.cos(hour));
    day=altitude>0;
  }
  return{asc,dsc:norm(asc+180),mc,ic:norm(mc+180),vertex,'anti-vertex':norm(vertex+180),'part-of-fortune':norm(day?asc+moon-solar:asc+solar-moon),day};
}
function positionAt(ms,site){
  const p=read(site.slot),out=fixedPositions(p);
  for(const id of FAST){const lon=ephemeris(id,ms);if(Number.isFinite(lon))out[id]=lon}
  const chiron=ephemeris('chiron',ms);if(Number.isFinite(chiron))out.chiron=chiron;
  if(Number.isFinite(out.sun)&&Number.isFinite(out.moon)){
    const derived=angles(ms,site.lat,site.lon,out.sun,out.moon);
    for(const id of DERIVED)out[id]=derived[id];
    out._day=derived.day;
  }
  // The unknown-time stored Moon is a range; it is never treated as a fixed position.
  if(!Number.isFinite(out.moon))delete out.moon;
  return out;
}
function wheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
function center(){return window.RelphiSkyWheelSpec?.comparison?.center||{x:600,y:600}}
function polar(r,value){const c=center(),a=rad(norm(value)-180);return{x:c.x+r*Math.cos(a),y:c.y+r*Math.sin(a)}}
function radialSegment(layer,r1,r2,angle,attrs){
  const a=polar(r1,angle),b=polar(r2,angle);
  const line=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,...attrs});layer.appendChild(line);return line;
}
function conceal(node){
  if(!node||state.hidden.some(x=>x.node===node))return;
  state.hidden.push({node,visibility:node.style.visibility});
  node.style.visibility='hidden';
}
function restore(){
  for(const x of state.hidden){if(x.node?.style)x.node.style.visibility=x.visibility}
  state.hidden=[];
  state.markerLayer?.remove();state.lineLayer?.remove();
  state.markerLayer=null;state.lineLayer=null;state.wheel=null;
  state.markers.clear();state.lines.clear();
}
function geometry(site,current){
  const spec=window.RelphiSkyWheelSpec,role=spec?.role?.(site.slot)||{};
  const sample=current.querySelector('[data-layer="placements"] > g[data-sky="'+site.slot+'"][data-placement="sun"]')
     ||current.querySelector('[data-layer="placements"] > g[data-sky="'+site.slot+'"][data-placement="mercury"]');
  const leader=current.querySelector('[data-layer="leaders"] line[data-sky="'+site.slot+'"][data-placement="sun"]');
  const c=center();
  let lane=Number(sample?.dataset.placementLane);
  if(!Number.isFinite(lane))lane=Number(role.placement?.[0]);
  let tick=leader?Math.hypot(Number(leader.getAttribute('x2'))-c.x,Number(leader.getAttribute('y2'))-c.y):NaN;
  if(!Number.isFinite(tick))tick=Number(role.degree)||lane;
  // Use the same absolute wheel lanes that the unknown-time foundation actually drew.
  const offset=site.slot==='B'?-23:23;
  const angleLane=Math.max(60,lane+offset);
  return{lane,tick,angleLane,edge:role.edge||tick,color:spec?.SKY?.[site.slot]||'#333',aspectRadius:Math.max(20,Number(spec?.role?.('A')?.inner||166)-1)};
}
function addMarker(layer,site,id,g){
  const isAngle=['asc','dsc','mc','ic'].includes(id);
  const lane=isAngle?g.angleLane:g.lane;
  const group=el('g',{'data-motion-body':id,'pointer-events':'none'});
  let guide=null,extra=null;
  if(isAngle){
    guide=el('line',{stroke:g.color,'stroke-width':'1.5','vector-effect':'non-scaling-stroke'});
    extra=el('line',{stroke:g.color,'stroke-width':'1.5','vector-effect':'non-scaling-stroke'});
    layer.append(guide,extra);
  }else{
    guide=el('line',{stroke:g.color,'stroke-width':'1.45','vector-effect':'non-scaling-stroke'});
    layer.appendChild(guide);
  }
  layer.appendChild(group);
  const component=window.RelphiGlyphComponent;
  try{
    const bubble=component?.createBubble?.(group,id,{radius:isAngle?19:Number(window.RelphiSkyWheelSpec?.comparison?.placementRadius)||18.5,padding:1,color:g.color,fill:'#fffdf8',strokeWidth:2.35});
    if(bubble?.root&&isAngle){
      bubble.circle.style.opacity='0';
      const outline=el('rect',{x:-19,y:-12,width:38,height:24,fill:'#fffdf8',stroke:g.color,'stroke-width':'1.4','vector-effect':'non-scaling-stroke'});
      bubble.root.insertBefore(outline,bubble.root.firstChild);
    }
    bubble?.ready?.catch?.(error=>console.warn('Motion glyph unavailable',id,error));
  }catch(error){console.warn('Motion glyph unavailable',id,error);group.remove();guide.remove();extra?.remove();return}
  state.markers.set(id,{group,guide,extra,lane,tick:g.tick,isAngle});
}
function prepare(site){
  const current=wheel();if(!current||!window.RelphiGlyphComponent||!window.RelphiGlyphRegistry)return false;
  if(state.wheel===current&&state.markerLayer?.isConnected&&state.selected===site.slot)return true;
  restore();state.wheel=current;
  const g=geometry(site,current);
  const aspectLayer=el('g',{'data-layer':'motion-day-aspects','pointer-events':'none','aria-hidden':'true'});
  const markerLayer=el('g',{'data-layer':'motion-day-markers','pointer-events':'none','aria-hidden':'true'});
  const placements=current.querySelector('[data-layer="placements"]');
  if(placements)current.insertBefore(aspectLayer,placements);else current.appendChild(aspectLayer);
  current.appendChild(markerLayer);
  state.lineLayer=aspectLayer;state.markerLayer=markerLayer;
  // Conceal only the speculative sky; do not change the reference sky's glyphs.
  current.querySelectorAll('[data-layer="placements"] > [data-sky="'+site.slot+'"],[data-layer="leaders"] > [data-sky="'+site.slot+'"]').forEach(conceal);
  current.querySelectorAll('[data-layer="aspects"] [data-left-sky="'+site.slot+'"],[data-layer="aspects"] [data-right-sky="'+site.slot+'"]').forEach(conceal);
  // The unknown-time range is a true uncertainty artifact, but the scrubber now
  // selects a hypothetical instant; hide the arc/ticks only during exploration.
  current.querySelectorAll('.sky-foundation-moon-range[data-sky="'+site.slot+'"],.sky-foundation-moon-range-boundary[data-sky="'+site.slot+'"],.sky-foundation-moon-range-leader[data-sky="'+site.slot+'"]').forEach(conceal);
  const ids=[...FAST,'chiron','north-node','south-node','lilith',...DERIVED];
  ids.forEach(id=>{
    if(window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id))addMarker(markerLayer,site,id,g);
  });
  return true;
}
function aspects(site,positions){
  const H=window.RelphiHarmonicOrb;if(!H)return[];
  const other=site.slot==='A'?'B':'A',op=read(other),known=op?.calcProfile?.timeUnknown!==true?fixedPositions(op):{};
  const available=Object.keys(positions).filter(id=>id!=='_day'&&Number.isFinite(positions[id]));
  const others=Object.keys(known).filter(id=>Number.isFinite(known[id]));
  const matrix=(()=>{try{return JSON.parse(localStorage.getItem('relphiSkyAspectMatrixV1')||'null')}catch(_){return null}})();
  const allowed=(scope,id)=>!matrix||!Array.isArray(matrix[scope])||matrix[scope].includes(id);
  const out=[],windowValue=H.getWindow?.()??H.windowFromControl?.()??7;
  function pair(left,right,leftSky,rightSky,scope){
    if(leftSky===rightSky&&NO_PAIRS.has([left,right].sort().join('|')))return;
    const l=(leftSky===site.slot?positions:known)[left],r=(rightSky===site.slot?positions:known)[right];
    const separation=Math.abs(shortest(l,r));
    for(const aspect of H.aspects||[]){
      if(!allowed(scope,aspect.id))continue;
      const metrics=H.metrics(separation,aspect,windowValue);
      if(!metrics?.active)continue;
      out.push({left,right,leftSky,rightSky,scope,aspect,metrics,l,r});
    }
  }
  for(let i=0;i<available.length;i++)for(let j=i+1;j<available.length;j++)pair(available[i],available[j],site.slot,site.slot,site.slot+'-'+site.slot);
  if(others.length){
    if(site.slot==='A')for(const left of available)for(const right of others)pair(left,right,'A','B','A-B');
    else for(const left of others)for(const right of available)pair(left,right,'A','B','A-B');
  }
  return out.sort((a,b)=>a.metrics.phaseError-b.metrics.phaseError);
}
function drawAspects(site,relationships,g){
  const used=new Set();
  for(const relation of relationships){
    const key=[relation.scope,relation.left,relation.right,relation.aspect.id].join('|');
    used.add(key);
    let line=state.lines.get(key);
    if(!line){
      line=el('line',{class:'sky-foundation-aspect sky-motion-day-aspect',stroke:relation.aspect.color,'stroke-width':'2','vector-effect':'non-scaling-stroke',opacity:'.68','data-aspect':relation.aspect.id,'data-relationship-mode':relation.scope,'data-left-placement':relation.left,'data-right-placement':relation.right,'data-left-sky':relation.leftSky,'data-right-sky':relation.rightSky});
      state.lineLayer.appendChild(line);state.lines.set(key,line);
    }
    const a=polar(g.aspectRadius,relation.l),b=polar(g.aspectRadius,relation.r);
    for(const [name,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))attr(line,name,value);
    line.style.display='';
    line.style.opacity=String(.20+.76*(relation.metrics.coherence||0));
  }
  for(const [key,line] of state.lines)if(!used.has(key))line.style.display='none';
}
function drawMarkers(positions,g){
  for(const [id,marker] of state.markers){
    const lon=positions[id];
    if(!Number.isFinite(lon)){marker.group.style.display='none';marker.guide.style.display='none';if(marker.extra)marker.extra.style.display='none';continue}
    marker.group.style.display='';marker.guide.style.display='';
    const display=polar(marker.lane,lon),exact=polar(marker.tick,lon);
    attr(marker.group,'transform','translate('+display.x+' '+display.y+')');
    marker.group.querySelector('.relphi-glyph-bubble')?.setAttribute('transform',marker.isAngle?'rotate('+norm(lon+270)+')':'');
    if(marker.isAngle){
      const first=polar(Math.min(marker.tick,marker.lane-45),lon),last=polar(Math.max(marker.tick,marker.lane+45),lon);
      const end=polar(marker.lane-13,lon),close=polar(marker.lane+13,lon);
      const segments=[[marker.guide,first,end],[marker.extra,close,last]];
      for(const [line,a,b] of segments){line.style.display='';for(const [name,value] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))attr(line,name,value)}
    }else for(const [name,value] of Object.entries({x1:display.x,y1:display.y,x2:exact.x,y2:exact.y}))attr(marker.guide,name,value);
  }
}
function timeText(ms,zone){
  try{return new Intl.DateTimeFormat(undefined,{timeZone:zone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true,timeZoneName:'short'}).format(new Date(ms))}
  catch(_){return new Date(ms).toISOString()}
}
function pretty(id){return ({asc:'Asc',dsc:'Dsc',mc:'MC',ic:'IC',vertex:'Vertex','anti-vertex':'Anti-Vertex','part-of-fortune':'Fortune','north-node':'N. Node','south-node':'S. Node'})[id]||id.charAt(0).toUpperCase()+id.slice(1)}
function paint(){
  const site=unknown(state.selected),ui=state.ui;
  if(!ui||!site||!state.enabled)return;
  if(!state.exploring){ui.slider.value='0';ui.play.textContent='Play';ui.time.textContent='Select a time or press Play';ui.phase.textContent='';ui.exact.textContent='';ui.aspects.textContent='';ui.reset.disabled=true;restore();return}
  if(!prepare(site))return;
  const ms=Math.min(site.end-1000,site.start+state.minutes*MINUTE),positions=positionAt(ms,site);
  const g=geometry(site,state.wheel),relationships=aspects(site,positions);
  drawMarkers(positions,g);drawAspects(site,relationships,g);
  ui.slider.value=String(state.minutes);
  ui.play.textContent=state.playing?'Pause':'Play';
  ui.time.textContent=timeText(ms,site.zone);
  ui.phase.textContent=positions._day?'Day chart':'Night chart';
  const close=relationships.filter(x=>x.metrics.phaseError<.10);
  ui.exact.textContent=close.length?close.slice(0,5).map(x=>pretty(x.left)+' '+x.aspect.id+' '+pretty(x.right)).join(' · '):'';
  if(state.paintCount++%6===0||!state.playing){
    const top=relationships.slice(0,7);
    ui.aspects.textContent=top.length?top.map(x=>pretty(x.left)+' '+x.aspect.id+' '+pretty(x.right)+' · '+x.metrics.ordinaryOrb.toFixed(2)+'°').join('   •   '):'No aspects inside the current Harmonic Window';
  }
  ui.reset.disabled=state.minutes===0&&!state.playing;
}
function stop(){
  state.playing=false;if(state.raf)cancelAnimationFrame(state.raf);
  state.raf=0;state.lastFrame=0;
  if(state.ui)state.ui.play.textContent='Play';
}
function close(){
  stop();state.enabled=false;state.minutes=0;state.exploring=false;restore();
  if(state.ui)state.ui.bar.hidden=true;
  const older=document.querySelector('.sky-motion-toolbar:not(.sky-motion-day-toolbar)');
  if(older)older.style.display='';
}
function tick(now){
  if(!state.playing)return;
  const elapsed=state.lastFrame?Math.min((now-state.lastFrame)/1000,.12):0;
  state.lastFrame=now;
  state.minutes+=elapsed*(Number(state.ui.speed.value)||30);
  if(state.minutes>=state.date.duration){state.minutes=state.date.duration;stop();paint();return}
  paint();state.raf=requestAnimationFrame(tick);
}
function play(){
  if(state.playing){stop();paint();return}
  if(!state.enabled)return;
  if(state.minutes>=state.date.duration)state.minutes=0;
  state.playing=true;state.exploring=true;state.lastFrame=0;paint();state.raf=requestAnimationFrame(tick);
}
function reset(){stop();state.minutes=0;state.exploring=false;restore();paint()}
function styles(){
  if(document.getElementById('skyUnknownDayStyles'))return;
  const s=document.createElement('style');s.id='skyUnknownDayStyles';
  s.textContent=[
    '.sky-motion-day-toolbar[hidden]{display:none!important}',
    '.sky-motion-day-toolbar{border:1px solid rgba(31,27,24,.17);border-radius:12px;margin:0 9px 10px;padding:10px 12px;display:grid;gap:8px;background:#fffdf8;color:#322b25;font:600 12px/1.45 system-ui,sans-serif}',
    '.sky-motion-day-toolbar .day-motion-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.sky-motion-day-toolbar .day-motion-title{margin-right:auto;font-weight:850}',
    '.sky-motion-day-toolbar button,.sky-motion-day-toolbar select{border:1px solid #96897a;border-radius:8px;background:#fff;color:#302720;padding:7px 10px;min-height:36px;font:650 12px/1.2 system-ui,sans-serif}',
    '.sky-motion-day-toolbar button{cursor:pointer}.sky-motion-day-toolbar button[data-day-play]{background:#292621;color:white;border-color:#292621}',
    '.sky-motion-day-toolbar button:disabled{opacity:.42;cursor:default}',
    '.sky-motion-day-toolbar input[type=range]{width:100%;accent-color:#c9211e;touch-action:pan-x}',
    '.sky-motion-day-toolbar .day-motion-time{font-weight:800;font-variant-numeric:tabular-nums}',
    '.sky-motion-day-toolbar .day-motion-exact{font-weight:750;color:#bd322e;min-height:0}',
    '.sky-motion-day-toolbar .day-motion-aspects{font-size:11px;font-weight:550;line-height:1.6;color:#635548;min-height:1em}',
    '.sky-motion-day-toolbar .day-motion-note{font-size:11px;color:#73675b;font-weight:500}',
    '.sky-motion-day-toolbar [data-day-phase]{font-size:11px;color:#66574c}',
    '#skyFoundationWheelMount [data-layer="motion-day-markers"] .relphi-glyph-bubble{filter:drop-shadow(0 0 1px white)}',
    '@media(max-width:620px){.sky-motion-day-toolbar{margin:0 5px 9px;padding:8px}.sky-motion-day-toolbar .day-motion-time{width:100%}}'
  ].join('\n');
  document.head.appendChild(s);
}
function build(){
  const panel=document.getElementById('skyFoundationComparison');if(!panel)return;
  styles();
  const bar=document.createElement('section');bar.className='sky-motion-day-toolbar';bar.hidden=true;bar.setAttribute('aria-label','Explore an unknown-time sky by local time of day');
  bar.innerHTML='<div class="day-motion-row"><strong class="day-motion-title">Explore unknown time</strong><label for="skyDaySlot">Sky</label><select id="skyDaySlot" data-day-slot aria-label="Unknown-time sky"></select><label for="skyDaySpeed">Speed</label><select id="skyDaySpeed" data-day-speed aria-label="Playback minutes per second"><option value="15">15 min/sec</option><option value="30" selected>30 min/sec</option><option value="60">1 hour/sec</option><option value="180">3 hours/sec</option></select><button data-day-play type="button">Play</button><button data-day-reset type="button">Reset</button></div><input data-day-slider type="range" min="0" value="0" step="any" aria-label="Time of day from local midnight to the next midnight"><div class="day-motion-row"><span>Midnight</span><span class="day-motion-time" data-day-time></span><span data-day-phase></span><span>End of day</span></div><div class="day-motion-exact" data-day-exact aria-live="off"></div><div class="day-motion-aspects" data-day-aspects aria-live="off"></div><div class="day-motion-note">Exploratory hypothetical times only. The birth time remains unknown; saved sky data and the Moon range are unchanged. Lines appear and fade as aspects enter and leave your Harmonic Window.</div>';
  panel.appendChild(bar);
  const get=x=>bar.querySelector('[data-day-'+x+']');
  state.ui={bar,slot:get('slot'),speed:get('speed'),play:get('play'),reset:get('reset'),slider:get('slider'),time:get('time'),phase:get('phase'),exact:get('exact'),aspects:get('aspects')};
  state.ui.slot.addEventListener('change',()=>{stop();restore();state.selected=state.ui.slot.value;state.identity='';sync()});
  state.ui.slider.addEventListener('input',()=>{stop();state.minutes=Number(state.ui.slider.value)||0;state.exploring=true;paint()});
  state.ui.play.addEventListener('click',play);
  state.ui.reset.addEventListener('click',reset);
}
function sync(){
  const found=candidates(),ui=state.ui;
  if(!ui)return;
  if(!found.length){close();return}
  const older=document.querySelector('.sky-motion-toolbar:not(.sky-motion-day-toolbar)');
  if(older)older.style.display='none';
  window.RelphiSkyInterpolatedMotion?.reset?.();
  state.enabled=true;ui.bar.hidden=false;
  if(!found.some(c=>c.slot===state.selected))state.selected=found[0].slot;
  const site=found.find(c=>c.slot===state.selected);
  const next=site.slot+':'+site.day+':'+site.zone+':'+site.lat+':'+site.lon+':'+site.start+':'+site.end;
  if(next!==state.identity){stop();restore();state.minutes=0;state.exploring=false;state.cache.clear();state.identity=next}
  if(state.wheel&&state.wheel!==wheel())restore();
  state.date=site;
  ui.slot.replaceChildren(...found.map(item=>{const option=document.createElement('option');option.value=item.slot;option.textContent='Sky '+item.slot;return option}));
  ui.slot.value=state.selected;ui.slot.disabled=found.length<=1;ui.slider.max=String(site.duration);
  paint();
}
function start(){
  build();sync();
  ['relphi:sky-foundation-ready','relphi:sky-harmonic-window-model-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-aspect-filter-rendered','relphi:sky-b-removed','relphi:sky-b-restored'].forEach(name=>window.addEventListener(name,()=>{if(state.enabled)sync()}));
  window.addEventListener('relphi:sky-where-when-editor-ready',()=>{stop();restore()});
  window.addEventListener('relphi:sky-where-when-committed',()=>{stop();restore();sync()});
  window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key)||event.key==='relphiSkyAspectMatrixV1')sync()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
}
window.RelphiSkyUnknownDayMotion=Object.freeze({unknown,positionAt,angles,aspects,interpolate,stop,reset});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();