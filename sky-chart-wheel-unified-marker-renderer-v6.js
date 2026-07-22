// Sky Chart preview: canonical glyphs and circles share one local-coordinate marker group.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
const NS='http://www.w3.org/2000/svg';
const PLACEMENT='.chart-wheel-placement-stick';
const SVG_SELECTOR='.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
const OUTWARD=58,GAP=43,MAX_T=84,R=17.5,SAFE=30.25,RED='#dc1f18',BLUE='#3166e2';
const ASSETS={SUN:'sun',MOON:'moon',MERCURY:'mercury',VENUS:'venus',MARS:'mars',JUPITER:'jupiter',SATURN:'saturn',URANUS:'uranus',NEPTUNE:'neptune',PLUTO:'pluto'};
const MAP={NO:'☊',NODE:'☊','NORTH NODE':'☊','TRUE NODE':'☊','MEAN NODE':'☊',SO:'☋','SOUTH NODE':'☋',PA:'FORTUNE_VECTOR',POF:'FORTUNE_VECTOR',FORTUNE:'FORTUNE_VECTOR','PART OF FORTUNE':'FORTUNE_VECTOR','HEART OF FORTUNE':'FORTUNE_VECTOR',LILITH:'⚸','BLACK MOON LILITH':'⚸',DS:'DSC',DSC:'DSC',DESCENDANT:'DSC',V:'Vx',VX:'Vx',VERTEX:'Vx',AC:'ASC',ASC:'ASC',RISING:'ASC',ASCENDANT:'ASC',MC:'MC',MIDHEAVEN:'MC',IC:'IC',IMUMCOELI:'IC','IMUM COELI':'IC'};
const PROFILE={'☊':[28,600,0,-.45],'☋':[28,600,0,.15],'⚸':[26.5,550,0,-.45]};
const ANGLES=new Set(['ASC','DSC','MC','IC','VX']);
const OPTICAL={sun:[0,1],moon:[0,.2],jupiter:[1,0],mercury:[0,0],venus:[0,0],mars:[0,0],saturn:[0,0],uranus:[0,0],neptune:[0,0],pluto:[0,0]};
const PLANET_TEXT=new Set(['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','⯓']);
const sources=new Map(),loads=new Map();
let ready=false,queued=false,rendering=false;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN};
const bare=v=>String(v||'').replace(/[\uFE0E\uFE0F]/g,'').trim();
function resolveIdentity(g,t){
  if(g.dataset.relphiGlyphKind&&g.dataset.relphiGlyphValue)return{kind:g.dataset.relphiGlyphKind,value:g.dataset.relphiGlyphValue};
  for(const candidate of [g.dataset.body,g.dataset.name,g.dataset.placement,g.getAttribute('data-body'),g.getAttribute('data-name'),g.querySelector('.chart-wheel-marker-name')?.textContent,g.getAttribute('aria-label'),t?.textContent]){
    const value=bare(candidate).toUpperCase();
    if(ASSETS[value])return remember(g,'asset',ASSETS[value]);
    if(MAP[value])return remember(g,'text',MAP[value]);
    const first=value.split(/[·,\s]/)[0];
    if(ASSETS[first])return remember(g,'asset',ASSETS[first]);
    if(MAP[first])return remember(g,'text',MAP[first]);
  }
  return remember(g,'text',bare(t?.textContent));
}
function remember(g,kind,value){g.dataset.relphiGlyphKind=kind;g.dataset.relphiGlyphValue=value;return{kind,value}}
function rootPoint(node,x,y){const m=node.getCTM?.();return m?new DOMPoint(x,y).matrixTransform(m):new DOMPoint(x,y)}
function localPoint(node,p){const m=node.getCTM?.();if(!m)return p;try{return p.matrixTransform(m.inverse())}catch(_){return p}}
function ensureMarker(g){
  let unit=g.querySelector(':scope > g.relphi-marker-unit');
  if(!unit){unit=document.createElementNS(NS,'g');unit.classList.add('relphi-marker-unit');g.appendChild(unit)}
  let knob=g.querySelector(':scope > circle.chart-wheel-stick-knob, g.relphi-marker-unit > circle.chart-wheel-stick-knob');
  let texts=Array.from(g.querySelectorAll('.chart-wheel-marker-glyph'));
  let text=texts.find(n=>n.parentNode===unit)||texts[0];
  if(!text&&knob){text=document.createElementNS(NS,'text');text.classList.add('chart-wheel-marker-glyph')}
  if(!knob||!text)return{unit,knob,text};
  resolveIdentity(g,text);
  if(knob.parentNode!==unit)unit.appendChild(knob);
  if(text.parentNode!==unit)unit.appendChild(text);
  texts.filter(n=>n!==text).forEach(n=>n.remove());
  if(knob.dataset.relphiLocal!=='1'){
    const ox=num(knob.getAttribute('cx')),oy=num(knob.getAttribute('cy'));
    if(Number.isFinite(ox)&&Number.isFinite(oy)){unit.dataset.originX=String(ox);unit.dataset.originY=String(oy);unit.setAttribute('transform',`translate(${ox} ${oy})`)}
    knob.setAttribute('cx','0');knob.setAttribute('cy','0');knob.dataset.relphiLocal='1';
  }
  text.setAttribute('x','0');text.setAttribute('y','0');
  return{unit,knob,text};
}
function purgeLegacy(g,unit,knob,text,keep){
  g.classList.remove('has-preview-inline-glyph','has-preview-angle-text');
  g.querySelectorAll('image.relphi-bubble-glyph-image,svg.relphi-colored-glyph,svg.relphi-bold-inline-glyph,.relphi-wheel-planet-glyph,.relphi-pluto-vector').forEach(n=>n.remove());
  g.querySelectorAll('.relphi-approved-glyph,.relphi-fortune-vector').forEach(n=>{if(n.parentNode!==unit||!keep||!n.classList.contains(keep))n.remove()});
  g.querySelectorAll('text').forEach(n=>{if(n!==text&&(n.classList.contains('chart-wheel-marker-glyph')||PLANET_TEXT.has(bare(n.textContent))))n.remove()});
  Array.from(unit.children).forEach(n=>{if(n!==knob&&n!==text&&(!keep||!n.classList.contains(keep)))n.remove()});
}
function purgeRootLegacy(svg){
  svg.querySelectorAll('.relphi-wheel-planet-glyph,svg.relphi-colored-glyph,svg.relphi-bold-inline-glyph,image.relphi-bubble-glyph-image').forEach(n=>{if(!n.closest('.relphi-marker-unit'))n.remove()});
  svg.querySelectorAll('text').forEach(n=>{if(!n.closest('.relphi-marker-unit')&&PLANET_TEXT.has(bare(n.textContent)))n.remove()});
}
function hostColor(g,knob){const color=g.classList.contains('sky-b')?BLUE:RED;knob.setAttribute('stroke',color);knob.style.setProperty('stroke',color,'important');return color}
function loadAsset(name){
  if(sources.has(name))return Promise.resolve(sources.get(name));
  if(loads.has(name))return loads.get(name);
  const promise=fetch(`assets/planet-glyphs/${name}.svg`).then(r=>{if(!r.ok)throw Error(name);return r.text()}).then(source=>{const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;sources.set(name,svg);return svg});
  loads.set(name,promise);return promise;
}
function recolor(root,color){
  root.querySelectorAll('*').forEach(el=>{
    const tag=el.tagName.toLowerCase(),shape=['path','circle','ellipse','rect','polygon','polyline','line'].includes(tag),fill=el.getAttribute('fill'),stroke=el.getAttribute('stroke');
    if(shape&&fill!=='none'){
      el.setAttribute('fill',color);el.setAttribute('stroke',color);el.setAttribute('stroke-width','1.15');el.setAttribute('paint-order','stroke fill');el.setAttribute('stroke-linejoin','round');
      el.style.setProperty('fill',color,'important');el.style.setProperty('stroke',color,'important');el.style.setProperty('stroke-width','1.15','important');
    }else if(shape&&stroke&&stroke!=='none'){
      const old=parseFloat(el.getAttribute('stroke-width'))||1.4,width=Math.max(1.7,old*1.14);
      el.setAttribute('stroke',color);el.setAttribute('stroke-width',width.toFixed(2));el.style.setProperty('stroke',color,'important');el.style.setProperty('stroke-width',width.toFixed(2),'important');
    }
    el.style.setProperty('color',color,'important');el.style.setProperty('opacity','1','important');
  });
}
function fitArt(art,name){
  art.removeAttribute('transform');
  let box;try{box=art.getBBox()}catch(_){return false}
  if(!box||!box.width||!box.height)return false;
  const scale=SAFE/Math.max(box.width,box.height),off=OPTICAL[name]||[0,0],cx=box.x+box.width/2,cy=box.y+box.height/2;
  art.setAttribute('transform',`translate(${off[0]} ${off[1]}) scale(${scale.toFixed(5)}) translate(${-cx.toFixed(3)} ${-cy.toFixed(3)})`);
  return true;
}
function appendAsset(unit,name,color){
  let art=unit.querySelector(`:scope > g.relphi-approved-${name}`);
  if(!art){
    const source=sources.get(name);if(!source)return false;
    art=document.createElementNS(NS,'g');art.classList.add('relphi-approved-glyph',`relphi-approved-${name}`);
    Array.from(source.children).forEach(child=>art.appendChild(document.importNode(child,true)));
    unit.appendChild(art);
  }
  recolor(art,color);if(!fitArt(art,name)){art.remove();return false}
  art.style.setProperty('opacity','1','important');return true;
}
function fortune(unit,color){
  let mark=unit.querySelector(':scope > g.relphi-fortune-vector');
  if(!mark){mark=document.createElementNS(NS,'g');mark.classList.add('relphi-fortune-vector');mark.innerHTML='<path d="M0 -9.25 A9.25 9.25 0 1 1 0 9.25 A9.25 9.25 0 1 1 0 -9.25"/><path d="M-6.54 -6.54 L6.54 6.54 M6.54 -6.54 L-6.54 6.54"/>';unit.appendChild(mark)}
  mark.removeAttribute('transform');mark.setAttribute('fill','none');mark.setAttribute('stroke',color);mark.setAttribute('stroke-width','2.1');mark.setAttribute('stroke-linecap','round');
  mark.querySelectorAll('*').forEach(el=>{el.setAttribute('fill','none');el.setAttribute('stroke',color);el.style.setProperty('stroke',color,'important');el.style.setProperty('opacity','1','important')});
  return true;
}
function centerText(text,dx,dy){
  text.removeAttribute('transform');let box;try{box=text.getBBox()}catch(_){return}
  if(!box||!box.width||!box.height)return;
  const ratio=Math.min(1,SAFE/Math.max(box.width,box.height));
  if(ratio<.999){const size=parseFloat(getComputedStyle(text).fontSize)||27;text.style.setProperty('font-size',(size*ratio)+'px','important');try{box=text.getBBox()}catch(_){return}}
  text.setAttribute('transform',`translate(${(-(box.x+box.width/2)+dx).toFixed(2)} ${(-(box.y+box.height/2)+dy).toFixed(2)})`);
}
function styleMarker(g,unit,knob,text){
  const id=resolveIdentity(g,text),keep=id.kind==='asset'?`relphi-approved-${id.value}`:(id.value==='FORTUNE_VECTOR'?'relphi-fortune-vector':'');
  purgeLegacy(g,unit,knob,text,keep);
  knob.setAttribute('cx','0');knob.setAttribute('cy','0');knob.setAttribute('r',String(R));knob.style.setProperty('fill','#fff','important');knob.style.setProperty('fill-opacity','1','important');knob.style.setProperty('opacity','1','important');
  const color=hostColor(g,knob);
  text.textContent='';text.style.setProperty('display','none','important');
  if(id.kind==='asset')return appendAsset(unit,id.value,color);
  if(id.value==='FORTUNE_VECTOR')return fortune(unit,color);
  const value=id.value,upper=value.toUpperCase(),angle=ANGLES.has(upper),profile=PROFILE[value]||(angle?[16,700,upper==='ASC'||upper==='DSC'?1:0,.2]:[28,600,0,0]);
  text.textContent=value;text.setAttribute('x','0');text.setAttribute('y','0');text.setAttribute('text-anchor','middle');text.setAttribute('dominant-baseline','central');text.setAttribute('fill',color);
  text.style.setProperty('fill',color,'important');text.style.setProperty('display','inline','important');text.style.setProperty('visibility','visible','important');text.style.setProperty('font-family',angle?'system-ui,sans-serif':'Apple Symbols, Segoe UI Symbol, Noto Sans Symbols 2, serif','important');text.style.setProperty('font-size',profile[0]+'px','important');text.style.setProperty('font-weight',String(profile[1]),'important');text.style.setProperty('stroke','none','important');
  centerText(text,profile[2],profile[3]);return true;
}
function collect(svg){
  const view=svg.viewBox?.baseVal,center=view&&view.width?{x:view.x+view.width/2,y:view.y+view.height/2}:{x:400,y:400};
  return Array.from(svg.querySelectorAll(PLACEMENT)).map((g,index)=>{
    const marker=ensureMarker(g),contact=g.querySelector('circle.chart-wheel-contact-dot'),leader=g.querySelector('line.chart-wheel-stick');
    if(!marker.knob||!marker.text||!contact||!leader||!styleMarker(g,marker.unit,marker.knob,marker.text))return null;
    const ax=num(contact.getAttribute('cx')),ay=num(contact.getAttribute('cy'));if(!Number.isFinite(ax)||!Number.isFinite(ay))return null;
    const vx=ax-center.x,vy=ay-center.y,length=Math.hypot(vx,vy)||1;
    return{index,g,unit:marker.unit,contact,leader,anchor:{x:ax,y:ay},radial:{x:vx/length,y:vy/length},tangent:{x:-vy/length,y:vx/length},offset:0};
  }).filter(Boolean);
}
const position=item=>({x:item.anchor.x+item.radial.x*OUTWARD+item.tangent.x*item.offset,y:item.anchor.y+item.radial.y*OUTWARD+item.tangent.y*item.offset});
function solve(items){
  for(let pass=0;pass<56;pass++){
    let changed=false;
    for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
      const p=position(items[a]),q=position(items[b]),distance=Math.hypot(q.x-p.x,q.y-p.y);if(distance>=GAP)continue;
      const cross=items[a].radial.x*items[b].radial.y-items[a].radial.y*items[b].radial.x,direction=Math.sign(cross)||(items[a].index<items[b].index?1:-1),push=Math.min(7,(GAP-distance)*.64+.5);
      items[a].offset=Math.max(-MAX_T,Math.min(MAX_T,items[a].offset-direction*push/2));items[b].offset=Math.max(-MAX_T,Math.min(MAX_T,items[b].offset+direction*push/2));changed=true;
    }
    if(!changed)break;
  }
}
function connect(item){
  const contactRoot=rootPoint(item.contact,item.anchor.x,item.anchor.y),bubbleRoot=rootPoint(item.unit,0,0),contact=localPoint(item.leader,contactRoot),bubble=localPoint(item.leader,bubbleRoot);
  const x1=num(item.leader.getAttribute('x1')),y1=num(item.leader.getAttribute('y1')),x2=num(item.leader.getAttribute('x2')),y2=num(item.leader.getAttribute('y2'));
  const p1=rootPoint(item.leader,x1,y1),p2=rootPoint(item.leader,x2,y2),first=Math.hypot(p1.x-contactRoot.x,p1.y-contactRoot.y)<=Math.hypot(p2.x-contactRoot.x,p2.y-contactRoot.y);
  if(first){item.leader.setAttribute('x1',contact.x);item.leader.setAttribute('y1',contact.y);item.leader.setAttribute('x2',bubble.x);item.leader.setAttribute('y2',bubble.y)}else{item.leader.setAttribute('x2',contact.x);item.leader.setAttribute('y2',contact.y);item.leader.setAttribute('x1',bubble.x);item.leader.setAttribute('y1',bubble.y)}
  item.leader.style.setProperty('opacity','1','important');
}
function layout(svg){
  if(!ready||rendering)return;rendering=true;
  try{
    purgeRootLegacy(svg);const items=collect(svg);if(!items.length)return;solve(items);
    items.forEach(item=>{const point=position(item);item.unit.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);connect(item);item.g.style.setProperty('opacity','1','important')});
  }finally{rendering=false}
}
function scan(){document.querySelectorAll(SVG_SELECTOR).forEach(layout)}
function schedule(){if(queued||!ready||rendering)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
function relevant(records){return records.some(record=>Array.from(record.addedNodes||[]).some(node=>node.nodeType===1&&!node.closest?.('.relphi-marker-unit')&&(node.matches?.(PLACEMENT)||node.querySelector?.(PLACEMENT)||node.matches?.(SVG_SELECTOR))))}
function install(){
  Promise.all(Object.values(ASSETS).map(loadAsset)).then(()=>{ready=true;schedule()}).catch(()=>{ready=true;schedule()});
  new MutationObserver(records=>{if(relevant(records))schedule()}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});window.addEventListener('relphi:sky-builder-v4-loaded',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();