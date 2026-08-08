// Ring-order contract: Sky A is central/inner; Sky B is ex-central/outer.
// Adapts the comparison wheel and the per-Sky placement mini wheels without redrawing canonical glyph art.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRingOrderV1)return;
window.__relphiSkyRingOrderV1=true;

const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SKY={A:'#c9211e',B:'#2462d0'};
const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const C={x:600,y:600};
const R={innerIn:166,innerOut:323,zIn:323,zOut:414,outerIn:414,outerOut:574,innerDegree:323,outerDegree:414};
const LANES={
  A:{ordinary:[287,299,283],angles:[202,220,238],edge:166,extreme:'inner'},
  B:{ordinary:[450,440,460],angles:[540,522,504],edge:574,extreme:'outer'}
};
const OLD_LANES={A:{ordinary:[450,440,460],angles:[540,522,504]},B:{ordinary:[287,299,283],angles:[202,220,238]}};
const MINI={
  A:{hIn:83,hOut:161.5,degree:161.5,ordinary:[143.5,149.5,141.5],angles:[101,110,119],edge:83,extreme:'inner'},
  B:{hIn:207,hOut:287,degree:207,ordinary:[225,220,230],angles:[270,261,252],edge:287,extreme:'outer'},
  zIn:161.5,zOut:207,c:{x:300,y:300}
};
const MINI_OLD={ordinary:[225,220,230],angles:[270,261,252]};

const norm=value=>((Number(value)%360)+360)%360;
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(center,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)}}
function annular(center,inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=point(center,outer,start),b=point(center,outer,start+span),c=point(center,inner,start+span),d=point(center,inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
function radialLine(parent,center,inner,outer,degree,attrs){const a=point(center,inner,degree),b=point(center,outer,degree);parent.appendChild(svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{})))}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),value=known||payload;if(Array.isArray(value))return value.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(value).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'],sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonicalId(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry?.id)return entry.id}return''}
function recordMap(slot){const map=new Map();source(read(slot)).forEach(([key,item])=>{const id=canonicalId(key,item),value=longitude(item);if(id&&Number.isFinite(value)&&!map.has(id))map.set(id,value)});return map}
function ascendant(payload,map){if(map.has('asc'))return map.get('asc');const p=payload?.calcProfile||{},value=Number(p.ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
function cusps(slot){const payload=read(slot),map=recordMap(slot),p=payload?.calcProfile||{};for(const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}const asc=ascendant(payload,map),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,i)=>norm(start+i*30))}
function closestIndex(value,values){let best=0,distance=Infinity;values.forEach((candidate,index)=>{const d=Math.abs(Number(value)-candidate);if(d<distance){distance=d;best=index}});return best}
function transformPoint(node,center){const match=String(node.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)/);if(!match)return null;const x=Number(match[1]),y=Number(match[2]);if(!Number.isFinite(x)||!Number.isFinite(y))return null;const radius=Math.hypot(x-center.x,y-center.y),degree=norm(Math.atan2(y-center.y,x-center.x)*180/Math.PI+180);return{x,y,radius,degree}}

function fillHouseLayer(layer,slot,center,inner,outer){const values=cusps(slot);layer.replaceChildren();values.forEach((start,index)=>{const end=values[(index+1)%12],span=norm(end-start)||30,mid=start+span/2;layer.appendChild(svg('path',{d:annular(center,inner,outer,start,end),fill:COLORS[index],'fill-opacity':'.5'}));radialLine(layer,center,inner,outer,end,{stroke:SKY[slot],class:'sky-foundation-divider'});const p=point(center,(inner+outer)/2,mid),text=svg('text',{x:p.x,y:p.y,class:'sky-foundation-house-number'});text.textContent=String(index+1);layer.appendChild(text)})}

function adaptComparison(){
  const wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
  if(!wheel||wheel.dataset.ringOrder==='A-inner-B-outer')return;
  const oldA=wheel.querySelector('[data-layer="a-houses"]'),oldB=wheel.querySelector('[data-layer="b-houses"]');
  if(!oldA||!oldB)return;
  oldA.setAttribute('data-layer','ring-order-temp');oldB.setAttribute('data-layer','a-houses');oldA.setAttribute('data-layer','b-houses');
  fillHouseLayer(oldB,'A',C,R.innerIn,R.innerOut);
  fillHouseLayer(oldA,'B',C,R.outerIn,R.outerOut);

  const placementLayer=wheel.querySelector('[data-layer="placements"]'),leaders=wheel.querySelector('[data-layer="leaders"]');
  if(!placementLayer||!leaders)return;
  const maps={A:recordMap('A'),B:recordMap('B')};
  leaders.querySelectorAll('.sky-foundation-leader').forEach(line=>line.remove());
  leaders.querySelectorAll('.sky-foundation-angle-axis').forEach(line=>line.remove());

  placementLayer.querySelectorAll('g[data-sky][data-placement]').forEach(group=>{
    const slot=group.dataset.sky;if(!LANES[slot])return;
    const id=group.dataset.placement,exact=maps[slot].get(id);
    if(!Number.isFinite(exact))return;
    const isAngle=group.dataset.angleAxis==='true';
    const current=transformPoint(group,C);
    if(isAngle){
      const old=Number(group.dataset.angleLane)||current?.radius||OLD_LANES[slot].angles[0],index=closestIndex(old,OLD_LANES[slot].angles),lane=LANES[slot].angles[index],p=point(C,lane,exact),labelSide=slot==='A'?lane-17:lane+17;
      group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.dataset.angleLane=String(lane);group.dataset.angleExtreme=LANES[slot].extreme;
      radialLine(leaders,C,Math.min(LANES[slot].edge,labelSide),Math.max(LANES[slot].edge,labelSide),exact,{stroke:SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke','data-sky':slot,'data-angle':id,'data-exact-longitude':exact.toFixed(8),'data-angle-lane':lane,'data-axis-extreme':LANES[slot].extreme,'data-axis-edge-radius':LANES[slot].edge});
    }else{
      const display=Number(group.dataset.displayLongitude);if(!Number.isFinite(display))return;const old=Number(group.dataset.placementLane)||current?.radius||OLD_LANES[slot].ordinary[0],index=closestIndex(old,OLD_LANES[slot].ordinary),lane=LANES[slot].ordinary[index],p=point(C,lane,display),target=point(C,slot==='A'?R.innerDegree:R.outerDegree,exact);
      group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.dataset.placementLane=String(lane);
      leaders.appendChild(svg('line',{x1:p.x,y1:p.y,x2:target.x,y2:target.y,stroke:SKY[slot],class:'sky-foundation-leader'}));
    }
  });
  wheel.dataset.ringOrder='A-inner-B-outer';
  wheel.dataset.innerSky='A';wheel.dataset.outerSky='B';
}

function miniHouseLayer(wheel,slot,geometry){const layer=wheel.querySelector('[data-mini-layer="houses"]');if(layer)fillHouseLayer(layer,slot,MINI.c,geometry.hIn,geometry.hOut)}
function adaptMini(slot){
  const panel=document.getElementById(`skyFoundation${slot}`),wheel=panel?.querySelector('.sky-placement-mini-wheel');
  if(!wheel||wheel.dataset.ringRole===MINI[slot].extreme)return;
  const geometry=MINI[slot];
  miniHouseLayer(wheel,slot,geometry);
  const outlines=wheel.querySelector('[data-mini-layer="outlines"]');if(outlines){outlines.replaceChildren();const radii=slot==='A'?[geometry.hIn,MINI.zIn,MINI.zOut]:[MINI.zIn,MINI.zOut,geometry.hOut];radii.forEach(radius=>outlines.appendChild(svg('circle',{cx:MINI.c.x,cy:MINI.c.y,r:radius,class:'sky-foundation-ring'})))}
  const ticks=wheel.querySelector('[data-mini-layer="ticks"]');if(ticks){ticks.replaceChildren();for(let degree=0;degree<360;degree++){const length=degree%10===0?12:degree%5===0?8:5,className=degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick';radialLine(ticks,MINI.c,geometry.degree-length,geometry.degree+length,degree,{class:className})}}
  const placements=wheel.querySelector('[data-mini-layer="placements"]'),leaders=wheel.querySelector('[data-mini-layer="leaders"]');if(!placements||!leaders)return;
  const map=recordMap(slot);leaders.replaceChildren();
  placements.querySelectorAll('g[data-sky][data-placement]').forEach(group=>{
    const id=group.dataset.placement,exact=map.get(id),current=transformPoint(group,MINI.c);if(!Number.isFinite(exact)||!current)return;
    const isAngle=group.dataset.angleAxis==='true';
    if(isAngle){const index=closestIndex(current.radius,MINI_OLD.angles),lane=geometry.angles[index],p=point(MINI.c,lane,exact),labelSide=slot==='A'?lane-17:lane+17;group.setAttribute('transform',`translate(${p.x} ${p.y})`);radialLine(leaders,MINI.c,Math.min(geometry.edge,labelSide),Math.max(geometry.edge,labelSide),exact,{stroke:SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke','data-sky':slot,'data-angle':id})}
    else{const index=closestIndex(current.radius,MINI_OLD.ordinary),lane=geometry.ordinary[index],display=current.degree,p=point(MINI.c,lane,display),target=point(MINI.c,geometry.degree,exact);group.setAttribute('transform',`translate(${p.x} ${p.y})`);leaders.appendChild(svg('line',{x1:p.x,y1:p.y,x2:target.x,y2:target.y,stroke:SKY[slot],class:'sky-foundation-leader'}))}
  });
  const backdrop=wheel.querySelector(':scope > circle');if(backdrop)backdrop.setAttribute('r',String(slot==='A'?MINI.zOut+4:geometry.hOut+4));
  wheel.dataset.ringRole=geometry.extreme;wheel.dataset.ringOrder=slot==='A'?'central-sky':'ex-central-sky';
}
function adaptMinis(){adaptMini('A');adaptMini('B')}
function scheduleMinis(){setTimeout(adaptMinis,0);setTimeout(adaptMinis,120)}

window.addEventListener('relphi:sky-foundation-ready',()=>{adaptComparison();scheduleMinis()});
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))scheduleMinis()});
document.addEventListener('click',event=>{if(event.target.closest('.sky-where-when-actions [data-ww-action="placements"]'))scheduleMinis()},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{adaptComparison();scheduleMinis()},{once:true});else{adaptComparison();scheduleMinis()}
})();
