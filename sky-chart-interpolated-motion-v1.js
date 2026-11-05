// Visual time-lapse for known-time Sky Chart placements. The reference sky,
 // houses, aspect calculations, and saved payload are never rewritten by playback.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyInterpolatedMotionV1)return;
window.__relphiSkyInterpolatedMotionV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const NAMES={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars'};
const BODIES=Object.keys(NAMES);
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const HOUR=3600000,STEP=HOUR/2,MIN=-48,MAX=48,NS='http://www.w3.org/2000/svg';
const state={slot:'',signature:'',baseMs:0,zone:'UTC',offset:0,playing:false,preview:false,lastFrame:0,raf:0,wheel:null,layer:null,markers:[],dimmed:[],cache:new Map(),controls:null};
const norm=x=>((Number(x)%360)+360)%360;
const delta=(a,b)=>((Number(b)-Number(a)+540)%360)-180;
// Angular interpolation takes the short way across 0 Aries, also for retrograde motion.
const interpolateLongitude=(a,b,f)=>norm(Number(a)+delta(a,b)*Math.max(0,Math.min(1,Number(f))));
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function longitude(name,date){
  const A=window.Astronomy;if(!A)return NaN;
  try{
    if(name==='moon')return norm(A.EclipticGeoMoon(date).lon);
    return norm(A.Ecliptic(A.GeoVector(NAMES[name],date,true)).elon);
  }catch(_){return NaN}
}
// Samples are exact Astronomy Engine evaluations 30 minutes apart; the frame
// renderer only interpolates between them, never re-evaluates the ephemeris at 60fps.
function sampledLongitude(name,ms){
  if(!BODIES.includes(name)||!Number.isFinite(ms))return NaN;
  const start=Math.floor(ms/STEP)*STEP,key=name+':'+start;
  let pair=state.cache.get(key);
  if(!pair){
    pair=[longitude(name,new Date(start)),longitude(name,new Date(start+STEP))];
    if(!pair.every(Number.isFinite))return NaN;
    if(state.cache.size>700)state.cache.clear();
    state.cache.set(key,pair);
  }
  return interpolateLongitude(pair[0],pair[1],(ms-start)/STEP);
}
function storedLongitude(payload,name){
  const positions=payload?.placements||payload?.positions||{};
  const entry=Object.entries(positions).find(([key,item])=>{
    const candidate=String(item?.glyphId||item?.name||item?.id||key).trim().toLowerCase().replace(/[^a-z]/g,'');
    return candidate===name;
  });
  const item=entry?.[1];if(!item)return NaN;
  if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);
  const sign=SIGNS.findIndex(x=>x.toLowerCase()===String(item.sign||'').toLowerCase());
  if(sign<0)return NaN;
  return norm(sign*30+Number(item.degree||0)+Number(item.minute||0)/60+Number(item.second||0)/3600);
}
function candidate(slot){
  const payload=read(slot),p=payload?.calcProfile||{};
  if(!payload||p.timeUnknown===true)return null;
  const instant=Date.parse(p.instant||payload.instant||'');
  if(!Number.isFinite(instant))return null;
  const usable=BODIES.filter(name=>{
    const current=storedLongitude(payload,name),calculated=sampledLongitude(name,instant);
    // Imported placements can be from different coordinate systems. Do not
    // silently animate such charts using incompatible geocentric coordinates.
    return Number.isFinite(current)&&Number.isFinite(calculated)&&Math.abs(delta(current,calculated))<1;
  });
  if(!usable.length)return null;
  return{slot,payload,instant,zone:String(p.timeZone||'UTC'),usable};
}
function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
function polar(r,angle){const center=window.RelphiSkyWheelSpec?.comparison?.center||{x:600,y:600},a=(norm(angle)-180)*Math.PI/180;return{x:center.x+r*Math.cos(a),y:center.y+r*Math.sin(a)}}
function svg(tag){return document.createElementNS(NS,tag)}
function restore(){
  for(const [node,value] of state.dimmed)if(node?.style)node.style.opacity=value;
  state.dimmed=[];
  state.layer?.remove();state.layer=null;state.markers=[];state.wheel=null;
}
function dim(node,value){if(!node)return;state.dimmed.push([node,node.style.opacity]);node.style.opacity=String(value)}
function makeOverlay(){
  const wheel=currentWheel();
  if(!wheel){restore();return false}
  if(state.wheel===wheel&&state.layer?.isConnected)return true;
  restore();state.wheel=wheel;
  const layer=svg('g');layer.setAttribute('data-layer','motion-preview');layer.setAttribute('pointer-events','none');layer.setAttribute('aria-hidden','true');
  layer.style.display='none';wheel.appendChild(layer);state.layer=layer;
  const p=window.RelphiSkyWheelSpec?.comparison||{},c=p.center||{x:600,y:600},color=p?.sky?.[state.slot]||window.RelphiSkyWheelSpec?.SKY?.[state.slot]||'#413a35';
  const payload=candidate(state.slot);
  if(!payload)return false;
  for(const body of payload.usable){
    const host=wheel.querySelector('[data-layer="placements"] > g[data-sky="'+state.slot+'"][data-placement="'+body+'"]');
    if(!host)continue;
    const leader=wheel.querySelector('[data-layer="leaders"] line[data-sky="'+state.slot+'"][data-placement="'+body+'"]');
    let lane=Number(host.dataset.placementLane);
    if(!Number.isFinite(lane)){
      const t=(host.getAttribute('transform')||'').match(/translate\(([-\d.]+)[ ,]+([-\d.]+)/);
      lane=t?Math.hypot(Number(t[1])-c.x,Number(t[2])-c.y):NaN;
    }
    const exactRadius=leader?Math.hypot(Number(leader.getAttribute('x2'))-c.x,Number(leader.getAttribute('y2'))-c.y):NaN;
    if(!Number.isFinite(lane))continue;
    const trace=svg('line');trace.setAttribute('stroke',color);trace.setAttribute('stroke-width','2');trace.setAttribute('vector-effect','non-scaling-stroke');trace.setAttribute('opacity','.65');
    layer.appendChild(trace);
    const clone=host.cloneNode(true);clone.classList.add('sky-motion-animated-marker');
    clone.removeAttribute('data-placement');clone.removeAttribute('data-sky');clone.removeAttribute('data-house');clone.removeAttribute('data-display-longitude');clone.removeAttribute('data-exact-longitude');
    clone.querySelectorAll('[id],[data-placement],[data-sky],[tabindex],[role]').forEach(node=>{['id','data-placement','data-sky','tabindex','role'].forEach(attr=>node.removeAttribute(attr))});
    clone.setAttribute('data-motion-body',body);clone.setAttribute('pointer-events','none');
    layer.appendChild(clone);
    state.markers.push({body,clone,trace,lane,exactRadius:Number.isFinite(exactRadius)?exactRadius:lane});
    dim(host,.19);dim(leader,.12);
  }
  // Keep reference-sky aspect lines visible. Unknown-time exploration draws its own evolving aspect layer.
  return state.markers.length>0;
}
function clock(ms){
  try{return new Intl.DateTimeFormat(undefined,{timeZone:state.zone,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(new Date(ms))}
  catch(_){return new Date(ms).toUTCString()}
}
function coordinate(x){
  const longitude=norm(x),sign=Math.floor(longitude/30),within=longitude-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60);
  return degree+'°'+String(minute).padStart(2,'0')+'′ '+SIGNS[sign];
}
function paint(){
  const ui=state.controls;if(!ui)return;
  ui.slider.value=String(state.offset);
  ui.play.textContent=state.playing?'Pause':'Play';
  ui.play.setAttribute('aria-label',state.playing?'Pause planetary motion':'Play planetary motion');
  ui.reset.disabled=!state.preview&&!state.playing;
  ui.time.textContent=state.baseMs?clock(state.baseMs+state.offset*HOUR):'';
  ui.position.textContent='';
  if(!state.preview){if(state.layer)state.layer.style.display='none';return}
  if(!makeOverlay())return;
  state.layer.style.display='';
  const at=state.baseMs+state.offset*HOUR;
  const names=[];
  for(const marker of state.markers){
    const lon=sampledLongitude(marker.body,at);
    if(!Number.isFinite(lon))continue;
    const bubble=polar(marker.lane,lon),exact=polar(marker.exactRadius,lon);
    marker.clone.setAttribute('transform','translate('+bubble.x+' '+bubble.y+')');
    for(const [key,val] of Object.entries({x1:bubble.x,y1:bubble.y,x2:exact.x,y2:exact.y}))marker.trace.setAttribute(key,String(val));
    names.push(NAMES[marker.body]+' '+coordinate(lon));
  }
  ui.position.textContent=names.join(' · ');
}
function pause(){state.playing=false;if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.lastFrame=0;paint()}
function clearPreview(){pause();state.preview=false;state.offset=0;restore();paint()}
function tick(now){
  if(!state.playing)return;
  const elapsed=state.lastFrame?Math.min(.12,(now-state.lastFrame)/1000):0;state.lastFrame=now;
  const speed=Number(state.controls.speed.value)||3;
  state.offset=Math.min(MAX,state.offset+Math.max(0,elapsed)*speed);
  paint();
  if(state.offset>=MAX){pause();return}
  state.raf=requestAnimationFrame(tick);
}
function play(){
  if(state.playing){pause();return}
  if(!state.baseMs)return;
  if(state.offset>=MAX)state.offset=MIN;
  state.preview=true;state.playing=true;state.lastFrame=0;
  paint();state.raf=requestAnimationFrame(tick);
}
function ensureStyles(){
  if(document.getElementById('skyMotionPlaybackStyles'))return;
  const style=document.createElement('style');style.id='skyMotionPlaybackStyles';
  style.textContent=[
    '.sky-motion-toolbar{margin:0 10px 12px;padding:10px 12px;border:1px solid rgba(31,27,24,.16);border-radius:11px;background:#fffdf8;display:grid;gap:7px;color:#302922;font:600 12px/1.4 system-ui,sans-serif}',
    '.sky-motion-toolbar .sky-motion-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}',
    '.sky-motion-toolbar button,.sky-motion-toolbar select{border:1px solid #9c9186;border-radius:7px;background:#fff;color:#241f1b;font:600 12px/1.2 inherit;padding:7px 10px;min-height:34px}',
    '.sky-motion-toolbar button{cursor:pointer}.sky-motion-toolbar button:disabled,.sky-motion-toolbar select:disabled{cursor:not-allowed;opacity:.45}',
    '.sky-motion-toolbar [data-motion-play]{background:#292621;color:#fff;border-color:#292621;min-width:62px}',
    '.sky-motion-toolbar input[type="range"]{width:100%;margin:0;accent-color:#c9211e;touch-action:pan-x}',
    '.sky-motion-toolbar .sky-motion-heading{font-weight:850;margin-right:auto}',
    '.sky-motion-toolbar .sky-motion-time{font-weight:700;font-variant-numeric:tabular-nums}',
    '.sky-motion-toolbar .sky-motion-note{font-size:11px;font-weight:500;color:#655d54}',
    '.sky-motion-toolbar .sky-motion-coordinates{font-size:11px;font-variant-numeric:tabular-nums;line-height:1.65}',
    '.sky-motion-animated-marker{opacity:1!important;filter:drop-shadow(0 0 2px #fffdf8)}',
    '@media(max-width:620px){.sky-motion-toolbar{margin:0 5px 9px;padding:8px}.sky-motion-toolbar .sky-motion-time{width:100%}}'
  ].join('\n');
  document.head.appendChild(style);
}
function buildControls(){
  const panel=document.getElementById('skyFoundationComparison');
  if(!panel)return;
  ensureStyles();
  const bar=document.createElement('section');bar.className='sky-motion-toolbar';bar.setAttribute('aria-label','Interpolated planetary movement');
  bar.innerHTML='<div class="sky-motion-row"><span class="sky-motion-heading">Planetary motion</span><label for="skyMotionSlot">Sky</label><select id="skyMotionSlot" data-motion-slot aria-label="Sky to animate"></select><label for="skyMotionSpeed">Speed</label><select id="skyMotionSpeed" data-motion-speed aria-label="Simulation speed"><option value="1">1 hour/sec</option><option value="3" selected>3 hours/sec</option><option value="6">6 hours/sec</option></select><button type="button" data-motion-play>Play</button><button type="button" data-motion-reset>Reset</button></div><input type="range" data-motion-slider aria-label="Hours before or after reference sky" min="-48" max="48" step="0.01" value="0"><div class="sky-motion-row"><span>−48h</span><span class="sky-motion-time" data-motion-time aria-live="off"></span><span>+48h</span></div><div class="sky-motion-coordinates" data-motion-position aria-live="off"></div><div class="sky-motion-note" data-motion-note>Visual preview only. The reference sky, houses, aspects, and saved data remain unchanged.</div>';
  panel.appendChild(bar);
  const get=attr=>bar.querySelector('[data-motion-'+attr+']');
  state.controls={bar,slot:get('slot'),speed:get('speed'),play:get('play'),reset:get('reset'),slider:get('slider'),time:get('time'),position:get('position'),note:get('note')};
  state.controls.slot.addEventListener('change',()=>{pause();state.slot=state.controls.slot.value;state.signature='';sync()});
  state.controls.slider.addEventListener('input',()=>{
    pause();state.offset=Number(state.controls.slider.value)||0;
    const active=Math.abs(state.offset)>0.00001;
    if(!active&&state.preview){clearPreview();return}
    state.preview=active;paint();
  });
  state.controls.play.addEventListener('click',play);
  state.controls.reset.addEventListener('click',clearPreview);
}
function sync(){
  if(!state.controls)return;
  const found=['A','B'].map(candidate).filter(Boolean),available=new Map(found.map(c=>[c.slot,c]));
  if(!available.has(state.slot))state.slot=available.has('B')?'B':available.has('A')?'A':'';
  const ui=state.controls;
  ui.slot.replaceChildren(...found.map(c=>{const option=document.createElement('option');option.value=c.slot;option.textContent='Sky '+c.slot;return option}));
  ui.slot.value=state.slot;
  const next=available.get(state.slot),sig=next?state.slot+':'+next.instant+':'+next.usable.join(','):'';
  if(sig!==state.signature){pause();state.preview=false;state.offset=0;restore();state.signature=sig}
  state.baseMs=next?.instant||0;state.zone=next?.zone||'UTC';
  ui.slider.disabled=ui.play.disabled=ui.speed.disabled=!next;
  ui.slot.disabled=found.length<=1;ui.reset.disabled=true;
  ui.note.textContent=next?'Visual preview only · moving Sun, Moon, Mercury, Venus and Mars when available. Houses, aspects, and saved skies remain fixed.':'Use Where and When to make a dated sky with known time before animating.';
  if(state.preview)makeOverlay();
  paint();
}
function start(){
  if(!document.getElementById('skyFoundationComparison'))return;
  buildControls();sync();
  window.addEventListener('relphi:sky-foundation-ready',sync);
  window.addEventListener('relphi:sky-where-when-editor-ready',clearPreview);
  window.addEventListener('relphi:sky-where-when-committed',()=>{clearPreview();sync()});
  window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))clearPreview()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
}
window.RelphiSkyInterpolatedMotion=Object.freeze({interpolateLongitude,sampledLongitude,coordinate,pause,reset:clearPreview});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();