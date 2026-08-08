// Wheel presentation standardization: one chart-angle identity/axis per sky,
// exact comparison-wheel zodiac glyph treatment in mini wheels, and central mini house numbers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWheelStandardizationV1)return;
window.__relphiSkyWheelStandardizationV1=true;

const NS='http://www.w3.org/2000/svg';
const SKY={A:'#c9211e',B:'#2462d0'};
const COMPARISON={center:{x:600,y:600},A:{edge:166,side:'inner'},B:{edge:574,side:'outer'}};
const MINI={center:{x:300,y:300},A:{edge:83,side:'inner'},B:{edge:287,side:'outer'},houseNumberRadius:68};
const LINE_GAP=17;
let queued=false;

const norm=value=>((Number(value)%360)+360)%360;
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(center,radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(angle),y:center.y+radius*Math.sin(angle)}}
function transformPoint(node,center){const match=String(node.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)/);if(!match)return null;const x=Number(match[1]),y=Number(match[2]);if(!Number.isFinite(x)||!Number.isFinite(y))return null;return{x,y,radius:Math.hypot(x-center.x,y-center.y),degree:norm(Math.atan2(y-center.y,x-center.x)*180/Math.PI+180)}}
function radialLine(parent,center,inner,outer,degree,attrs){const a=point(center,inner,degree),b=point(center,outer,degree);parent.appendChild(svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{})))}

function uniqueAngles(layer){
  const seen=new Map();
  Array.from(layer?.querySelectorAll('g[data-sky][data-placement][data-angle-axis="true"]')||[]).forEach(group=>{
    const key=`${group.dataset.sky}|${group.dataset.placement}`;
    if(!seen.has(key)){seen.set(key,group);return}
    group.remove();
  });
  return Array.from(seen.values());
}

function standardizeAngleAxes(wheel,kind){
  if(!wheel)return;
  const center=kind==='comparison'?COMPARISON.center:MINI.center;
  const placements=wheel.querySelector(kind==='comparison'?'[data-layer="placements"]':'[data-mini-layer="placements"]');
  const leaders=wheel.querySelector(kind==='comparison'?'[data-layer="leaders"]':'[data-mini-layer="leaders"]');
  if(!placements||!leaders)return;
  const groups=uniqueAngles(placements);
  leaders.querySelectorAll('.sky-foundation-angle-axis').forEach(line=>line.remove());
  groups.forEach(group=>{
    const slot=group.dataset.sky;
    const geometry=(kind==='comparison'?COMPARISON:MINI)[slot];
    const position=transformPoint(group,center);
    if(!geometry||!position)return;
    const exact=Number(group.dataset.angleLongitude ?? group.dataset.exactLongitude);
    const degree=Number.isFinite(exact)?norm(exact):position.degree;
    const labelSide=geometry.side==='inner'?position.radius-LINE_GAP:position.radius+LINE_GAP;
    radialLine(leaders,center,Math.min(geometry.edge,labelSide),Math.max(geometry.edge,labelSide),degree,{
      stroke:SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke',
      'data-sky':slot,'data-angle':group.dataset.placement,'data-exact-longitude':degree.toFixed(8),
      'data-angle-lane':position.radius.toFixed(3),'data-axis-extreme':geometry.side,'data-axis-edge-radius':geometry.edge
    });
  });
}

function cloneComparisonSignsIntoMini(wheel){
  const comparison=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
  if(!comparison||!wheel)return;
  wheel.querySelectorAll('[data-mini-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign]').forEach(target=>{
    const id=target.dataset.zodiacSign;
    const source=comparison.querySelector(`[data-layer="zodiac"] .sky-foundation-sign-glyph[data-zodiac-sign="${CSS.escape(id)}"]`);
    if(!source||!source.childNodes.length)return;
    target.className.baseVal=source.className.baseVal;
    target.replaceChildren(...Array.from(source.childNodes).map(node=>node.cloneNode(true)));
    target.dataset.zodiacTreatment='comparison-clone';
  });
}

function centralizeMiniHouseNumbers(wheel){
  if(!wheel)return;
  wheel.querySelectorAll('[data-mini-layer="houses"] .sky-foundation-house-number').forEach(text=>{
    const x=Number(text.getAttribute('x')),y=Number(text.getAttribute('y'));
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    const degree=norm(Math.atan2(y-MINI.center.y,x-MINI.center.x)*180/Math.PI+180);
    const p=point(MINI.center,MINI.houseNumberRadius,degree);
    text.setAttribute('x',p.x.toFixed(3));
    text.setAttribute('y',p.y.toFixed(3));
    text.dataset.houseNumberLane='central';
  });
}

function standardize(){
  queued=false;
  const comparison=document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel');
  standardizeAngleAxes(comparison,'comparison');
  ['A','B'].forEach(slot=>{
    const wheel=document.querySelector(`#skyFoundation${slot} .sky-placement-mini-wheel`);
    if(!wheel)return;
    cloneComparisonSignsIntoMini(wheel);
    centralizeMiniHouseNumbers(wheel);
    standardizeAngleAxes(wheel,'mini');
  });
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{standardize();setTimeout(standardize,140)})}

['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',schedule);
document.addEventListener('click',event=>{if(event.target.closest('.sky-where-when-actions [data-ww-action="placements"]'))setTimeout(schedule,0)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
