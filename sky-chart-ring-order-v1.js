// Comparison-wheel ring contract: Sky A inner, Sky B outer, using the shared wheel specification.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRingOrderV2)return;
window.__relphiSkyRingOrderV1=true;
window.__relphiSkyRingOrderV2=true;
const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
let queued=false;
const spec=()=>window.RelphiSkyWheelSpec;
const norm=value=>((Number(value)%360)+360)%360;
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(center,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)}}
function annular(center,inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=point(center,outer,start),b=point(center,outer,start+span),c=point(center,inner,start+span),d=point(center,inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
function radialLine(parent,center,inner,outer,degree,attrs){const a=point(center,inner,degree),b=point(center,outer,degree);parent.appendChild(svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{})))}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),raw=known||payload;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const signs=spec()?.SIGNS||[],sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonicalId(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry?.id)return entry.id}return''}
function recordMap(slot){const map=new Map();source(read(slot)).forEach(([key,item])=>{const id=canonicalId(key,item),value=longitude(item);if(id&&Number.isFinite(value)&&!map.has(id))map.set(id,value)});return map}
function ascendant(payload,map){if(map.has('asc'))return map.get('asc');const p=payload?.calcProfile||{},value=Number(p.ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
function cusps(slot){const payload=read(slot),map=recordMap(slot),p=payload?.calcProfile||{};for(const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}const asc=ascendant(payload,map),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,i)=>norm(start+i*30))}
function transformPoint(node,center){const match=String(node.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)/);if(!match)return null;const x=Number(match[1]),y=Number(match[2]);if(!Number.isFinite(x)||!Number.isFinite(y))return null;return{x,y,radius:Math.hypot(x-center.x,y-center.y),degree:norm(Math.atan2(y-center.y,x-center.x)*180/Math.PI+180)}}
function closestIndex(value,values){let best=0,distance=Infinity;values.forEach((candidate,index)=>{const d=Math.abs(Number(value)-candidate);if(d<distance){distance=d;best=index}});return best}
function fillHouses(layer,slot,geometry){const shared=spec(),center=shared.comparison.center,values=cusps(slot);layer.replaceChildren();values.forEach((start,index)=>{const end=values[(index+1)%12],mid=start+(norm(end-start)||30)/2;layer.appendChild(svg('path',{d:annular(center,geometry.inner,geometry.outer,start,end),fill:shared.COLORS[index],'fill-opacity':shared.comparison.houseFillOpacity}));radialLine(layer,center,geometry.inner,geometry.outer,end,{stroke:shared.SKY[slot],class:'sky-foundation-divider'});const p=point(center,(geometry.inner+geometry.outer)/2,mid),text=svg('text',{x:p.x,y:p.y,class:'sky-foundation-house-number'});text.textContent=String(index+1);layer.appendChild(text)})}
function uniquePlacements(layer){const seen=new Set();Array.from(layer.querySelectorAll('g[data-sky][data-placement]')).forEach(group=>{const key=`${group.dataset.sky}|${group.dataset.placement}`;if(seen.has(key))group.remove();else seen.add(key)})}
function adapt(){
  queued=false;
  const shared=spec(),wheel=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');if(!shared||!wheel)return;
  const center=shared.comparison.center,inner=shared.comparison.inner,outer=shared.comparison.outer;
  let aLayer=wheel.querySelector('[data-layer="a-houses"]'),bLayer=wheel.querySelector('[data-layer="b-houses"]');if(!aLayer||!bLayer)return;
  if(wheel.dataset.ringOrder!=='A-inner-B-outer'){aLayer.setAttribute('data-layer','ring-temp');bLayer.setAttribute('data-layer','a-houses');aLayer.setAttribute('data-layer','b-houses');aLayer=wheel.querySelector('[data-layer="a-houses"]');bLayer=wheel.querySelector('[data-layer="b-houses"]')}
  fillHouses(aLayer,'A',inner);fillHouses(bLayer,'B',outer);
  const placements=wheel.querySelector('[data-layer="placements"]'),leaders=wheel.querySelector('[data-layer="leaders"]');if(!placements||!leaders)return;
  uniquePlacements(placements);leaders.querySelectorAll('.sky-foundation-leader,.sky-foundation-angle-axis').forEach(line=>line.remove());
  const maps={A:recordMap('A'),B:recordMap('B')};
  placements.querySelectorAll('g[data-sky][data-placement]').forEach(group=>{
    const slot=group.dataset.sky,geometry=shared.role(slot),id=group.dataset.placement,exact=maps[slot]?.get(id);if(!geometry||!Number.isFinite(exact))return;
    const isAngle=group.dataset.angleAxis==='true';
    if(isAngle){const lane=geometry.angle[0],p=point(center,lane,exact),labelSide=geometry.side==='inner'?lane-shared.comparison.angleGap:lane+shared.comparison.angleGap;group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.dataset.angleLane=String(lane);group.dataset.angleLongitude=exact.toFixed(8);group.dataset.angleExtreme=geometry.side;radialLine(leaders,center,Math.min(geometry.edge,labelSide),Math.max(geometry.edge,labelSide),exact,{stroke:shared.SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke','data-sky':slot,'data-angle':id,'data-exact-longitude':exact.toFixed(8),'data-angle-lane':lane,'data-axis-extreme':geometry.side,'data-axis-edge-radius':geometry.edge});return}
    const current=transformPoint(group,center),display=Number(group.dataset.displayLongitude);if(!current||!Number.isFinite(display))return;const oldLanes=slot==='A'?shared.comparison.outer.placement:shared.comparison.inner.placement,index=closestIndex(current.radius,oldLanes),lane=geometry.placement[index],p=point(center,lane,display),target=point(center,geometry.degree,exact);group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.dataset.placementLane=String(lane);leaders.appendChild(svg('line',{x1:p.x,y1:p.y,x2:target.x,y2:target.y,stroke:shared.SKY[slot],class:'sky-foundation-leader'}))
  });
  wheel.dataset.ringOrder='A-inner-B-outer';wheel.dataset.innerSky='A';wheel.dataset.outerSky='B';wheel.dataset.wheelSpec='relphi-sky-wheel-v1';
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(adapt)}}
window.addEventListener('relphi:sky-foundation-ready',schedule);
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))schedule()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
