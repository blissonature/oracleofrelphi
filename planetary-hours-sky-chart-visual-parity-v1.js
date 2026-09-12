// Match Planetary Hours current-placements mini wheel to the Sky Chart mini-wheel visual contract.
// The living heptagram is rendered directly by planetaryhours.html and is intentionally out of scope here.
(function(){
'use strict';
if(!/(^|\/)planetaryhours\.html$/.test(location.pathname)||window.__relphiPlanetaryHoursMiniWheelParityV1)return;
window.__relphiPlanetaryHoursMiniWheelParityV1=true;

const NS='http://www.w3.org/2000/svg';
const SIGN_IDS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const PLANET_IDS=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
const FALLBACK_ZODIAC=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const SKY_COLOR='#c9211e';
let queued=false,observer=null;
const norm=value=>((Number(value)%360)+360)%360;
function svg(name,attrs={}){const node=document.createElementNS(NS,name);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(center,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)}}
function longitudeFromPoint(cx,cy,x,y){return norm(Math.atan2(Number(y)-cy,Number(x)-cx)*180/Math.PI-180)}
function annularPath(center,inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=point(center,outer,start),b=point(center,outer,start+span),c=point(center,inner,start+span),d=point(center,inner,start);return`M${a.x.toFixed(3)} ${a.y.toFixed(3)} A${outer} ${outer} 0 ${large} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} L${c.x.toFixed(3)} ${c.y.toFixed(3)} A${inner} ${inner} 0 ${large} 0 ${d.x.toFixed(3)} ${d.y.toFixed(3)} Z`}
function numberAttr(node,name,fallback=NaN){const value=Number(node?.getAttribute(name));return Number.isFinite(value)?value:fallback}
function canonicalEntry(id){const registry=window.RelphiGlyphRegistry;return registry&&(registry.get(id)||registry.resolve(id))}
async function bubble(host,id,{radius,color,fill='#fffdfa',strokeWidth=1.8,plain=false}={}){const entry=canonicalEntry(id),component=window.RelphiGlyphComponent;if(!host||!entry||!component?.createBubble)return false;host.replaceChildren();host.dataset.canonicalGlyphId=entry.id;try{const rendered=component.createBubble(host,entry.id,{radius,padding:.7,color,fill,strokeWidth});if(plain){rendered.circle.style.opacity='0';rendered.circle.setAttribute('aria-hidden','true')}await rendered.ready;return true}catch(error){host.replaceChildren();host.dataset.glyphUnavailable='true';console.error('[Relphi Planetary Hours mini wheel]',error);return false}}
function installStyles(){if(document.getElementById('planetaryHoursMiniWheelParityV1Styles'))return;const style=document.createElement('style');style.id='planetaryHoursMiniWheelParityV1Styles';style.textContent=`
#phCurrentWheel .ph-current-wheel[data-sky-chart-parity="true"]{display:block;width:min(242px,100%);height:auto;margin:0 auto;overflow:visible}
#phCurrentWheel .ph-parity-house-sector{stroke:rgba(45,39,34,.10);stroke-width:1.1;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-house-cusp{stroke:rgba(45,39,34,.28);stroke-width:1.15;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-house-number{fill:#514943;font:800 16px/1 system-ui,sans-serif;text-anchor:middle;dominant-baseline:middle}
#phCurrentWheel .ph-parity-zodiac-sector{stroke:#fffdfa;stroke-width:1.45;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-zodiac-inner,#phCurrentWheel .ph-parity-zodiac-outer{fill:none;stroke:rgba(45,39,34,.38);stroke-width:1.35;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-sign{pointer-events:none;filter:drop-shadow(0 0 2px rgba(255,255,255,.98))}
#phCurrentWheel .ph-parity-angle-line{stroke:#514943;stroke-width:1.3;stroke-linecap:round;opacity:.72;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-angle-label{fill:#514943;font:850 13px/1 system-ui,sans-serif;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#fffdfa;stroke-width:3px}
#phCurrentWheel .ph-parity-placement-leader{stroke:${SKY_COLOR};stroke-width:1.35;stroke-linecap:round;opacity:.58;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-placement-contact{fill:${SKY_COLOR};stroke:#fffdfa;stroke-width:1.15;vector-effect:non-scaling-stroke}
#phCurrentWheel .ph-parity-placement{filter:drop-shadow(0 1px 2px rgba(45,39,34,.16))}
#phCurrentWheel .ph-parity-center{fill:#211d1a;stroke:#fffdfa;stroke-width:1.5;vector-effect:non-scaling-stroke}
`;document.head.appendChild(style)}
function sourceCenter(old){const core=old.querySelector('.wheel-core');return{x:numberAttr(core,'cx',110),y:numberAttr(core,'cy',110)}}
function degreesFromLines(nodes,center,endpoint='end'){return nodes.map(line=>longitudeFromPoint(center.x,center.y,numberAttr(line,endpoint==='start'?'x1':'x2'),numberAttr(line,endpoint==='start'?'y1':'y2'))).filter(Number.isFinite)}
function planetId(marker){
  const canonical=marker.querySelector('[data-canonical-glyph-id]')?.dataset?.canonicalGlyphId;if(PLANET_IDS.has(canonical))return canonical;
  const title=String(marker.querySelector('title')?.textContent||'').trim().split(/\s+/)[0].toLowerCase();return PLANET_IDS.has(title)?title:'';
}
function extractWheel(old){
  const center=sourceCenter(old),houseCusps=degreesFromLines([...old.querySelectorAll('.house-cusp')],center);
  const axisGroups=[...old.querySelectorAll('.angle-layer>g')];
  const axes=axisGroups.map(group=>{const line=group.querySelector('.angle-axis');return line?longitudeFromPoint(center.x,center.y,numberAttr(line,'x1'),numberAttr(line,'y1')):NaN}).filter(Number.isFinite);
  const planets=[...old.querySelectorAll('.planet-marker')].map(marker=>{
    const id=planetId(marker),contact=marker.querySelector('.planet-contact'),dot=marker.querySelector('.planet-dot');if(!id||!contact)return null;
    const actual=longitudeFromPoint(center.x,center.y,numberAttr(contact,'cx'),numberAttr(contact,'cy'));
    const display=dot?longitudeFromPoint(center.x,center.y,numberAttr(dot,'cx'),numberAttr(dot,'cy')):actual;
    return{id,actual,display};
  }).filter(Boolean);
  return{houseCusps,axes,planets};
}
function fallbackMiniSpec(){return{viewBox:[0,0,600,600],center:{x:300,y:300},zodiac:{inner:83,outer:128.5,fillOpacity:.82,glyphRadius:14,strokeWidth:1.8},standalone:{house:{inner:128.5,outer:207,numberRadius:167.75},placement:[172,178,166],edge:207},angleGap:12,placementRadius:12,placementStrokeWidth:1.8}}
function paritySpec(){const spec=window.RelphiSkyWheelSpec?.mini||fallbackMiniSpec(),role=window.RelphiSkyWheelSpec?.miniRole?.('A')||spec.standalone;return{spec,role}}
async function buildParityWheel(model){
  const {spec,role}=paritySpec(),center=spec.center||{x:300,y:300},zodiac=spec.zodiac,house=role.house||{inner:zodiac.outer,outer:207,numberRadius:167.75};
  const viewBox=spec.viewBox||[0,0,600,600],colors=window.RelphiSkyWheelSpec?.COLORS||FALLBACK_ZODIAC;
  const root=svg('svg',{class:'ph-current-wheel',viewBox:viewBox.join(' '),preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Current planetary placements mini zodiac wheel using the Sky Chart visual system'});root.dataset.skyChartParity='true';
  const houseLayer=svg('g',{class:'ph-parity-house-layer'}),zodiacLayer=svg('g',{class:'ph-parity-zodiac-layer'}),angleLayer=svg('g',{class:'ph-parity-angle-layer'}),placementLayer=svg('g',{class:'ph-parity-placement-layer'});
  const cusps=model.houseCusps.length===12?model.houseCusps:Array.from({length:12},(_,i)=>i*30);
  cusps.forEach((start,index)=>{
    const end=index===cusps.length-1?cusps[0]+360:cusps[index+1],mid=start+norm(end-start)/2;
    houseLayer.appendChild(svg('path',{d:annularPath(center,house.inner,house.outer,start,end),class:'ph-parity-house-sector',fill:index%2?'#faf7f2':'#fffdfa'}));
    const a=point(center,house.inner,start),b=point(center,house.outer,start);houseLayer.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'ph-parity-house-cusp'}));
    const label=point(center,house.numberRadius,mid),text=svg('text',{x:label.x,y:label.y,class:'ph-parity-house-number'});text.textContent=String(index+1);houseLayer.appendChild(text);
  });
  for(let index=0;index<12;index+=1)zodiacLayer.appendChild(svg('path',{d:annularPath(center,zodiac.inner,zodiac.outer,index*30,index*30+30),class:'ph-parity-zodiac-sector',fill:colors[index]||'#ddd','fill-opacity':zodiac.fillOpacity??.82}));
  zodiacLayer.append(svg('circle',{cx:center.x,cy:center.y,r:zodiac.inner,class:'ph-parity-zodiac-inner'}),svg('circle',{cx:center.x,cy:center.y,r:zodiac.outer,class:'ph-parity-zodiac-outer'}));
  const jobs=[];
  SIGN_IDS.forEach((id,index)=>{const p=point(center,(zodiac.inner+zodiac.outer)/2,index*30+15),host=svg('g',{transform:`translate(${p.x} ${p.y})`,class:'ph-parity-sign'});zodiacLayer.appendChild(host);jobs.push(bubble(host,id,{radius:zodiac.glyphRadius||14,color:'#514b45',plain:true,strokeWidth:1.5}))});
  const axisDefs=[['Asc',model.axes[0]],['Dsc',Number.isFinite(model.axes[0])?model.axes[0]+180:NaN],['MC',model.axes[1]],['IC',Number.isFinite(model.axes[1])?model.axes[1]+180:NaN]];
  const edge=Number(role.edge||house.outer),inward=edge-Number(spec.angleGap||12);
  axisDefs.forEach(([label,degree])=>{if(!Number.isFinite(degree))return;const a=point(center,inward,degree),b=point(center,edge,degree),t=point(center,edge+16,degree);angleLayer.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'ph-parity-angle-line'}));const text=svg('text',{x:t.x,y:t.y,class:'ph-parity-angle-label'});text.textContent=label;angleLayer.appendChild(text)});
  const placementRadius=Number(role.placement?.[0]||172),bubbleRadius=Number(spec.placementBubbleRadius||13),strokeWidth=Number(spec.placementStrokeWidth||1.8);
  model.planets.forEach(item=>{
    const from=point(center,zodiac.outer,item.actual),to=point(center,placementRadius,item.display);
    placementLayer.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,class:'ph-parity-placement-leader'}));
    placementLayer.appendChild(svg('circle',{cx:from.x,cy:from.y,r:2.4,class:'ph-parity-placement-contact'}));
    const host=svg('g',{transform:`translate(${to.x} ${to.y})`,class:'ph-parity-placement'});host.dataset.placement=item.id;placementLayer.appendChild(host);jobs.push(bubble(host,item.id,{radius:bubbleRadius,color:SKY_COLOR,fill:'#fffdfa',strokeWidth}));
  });
  root.append(houseLayer,zodiacLayer,angleLayer,placementLayer,svg('circle',{cx:center.x,cy:center.y,r:4,class:'ph-parity-center'}));
  await Promise.allSettled(jobs);return root;
}
async function enhanceWheel(){
  const mount=document.getElementById('phCurrentWheel');if(!mount)return false;
  const final=mount.querySelector('svg.ph-current-wheel[data-sky-chart-parity="true"]');
  if(final)return false;
  const old=mount.querySelector('svg.ph-current-wheel');if(!old)return false;
  const model=extractWheel(old);if(!model.planets.length)return false;
  const replacement=await buildParityWheel(model);if(!old.isConnected)return false;
  old.replaceWith(replacement);return true;
}

async function apply(){queued=false;await enhanceWheel()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>void apply())}
function start(){
  installStyles();schedule();
  observer=new MutationObserver(records=>{if(records.some(record=>record.target instanceof Element&&(record.target.matches?.('#phCurrentWheel')||record.target.closest?.('#phCurrentWheel'))))schedule()});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('relphi:canonical-glyph-runtime-ready',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

async function apply(){queued=false;await enhanceWheel()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>void apply())}
function start(){installStyles();schedule();observer=new MutationObserver(records=>{if(records.some(record=>record.target instanceof Element&&(record.target.matches?.('#phCurrentWheel')||record.target.closest?.('#phCurrentWheel'))))schedule()});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('relphi:canonical-glyph-runtime-ready',schedule)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
