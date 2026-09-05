// Single-sky wheel layout v6: preserve one radial lane and separate only placements whose rendered bubbles actually collide.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyLayoutV6)return;
window.__relphiSkySingleSkyLayoutV1=true;
window.__relphiSkySingleSkyLayoutV2=true;
window.__relphiSkySingleSkyLayoutV3=true;
window.__relphiSkySingleSkyLayoutV4=true;
window.__relphiSkySingleSkyLayoutV5=true;
window.__relphiSkySingleSkyLayoutV6=true;

const EPS=1e-6;
const SIGN_MARGIN=.35;
const CLEARANCE=8;
const PASSES=36;
let queued=false,arranging=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
function spec(){return window.RelphiSkyWheelSpec||null}
function comparison(){return spec()?.comparison||null}
function role(){return spec()?.role?.('A')||null}
function center(){return comparison()?.center||{x:600,y:600}}
function polar(radius,degree){const c=center(),angle=(norm(degree)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function singleWheel(){return document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel[data-single-sky]')}
function slotFor(wheel){const explicit=String(wheel?.dataset?.singleSky||'A').toUpperCase();return explicit==='B'?'B':'A'}
function radiusOf(group){
  try{
    const box=group.getBBox();
    const measured=Math.max(Number(box.width)||0,Number(box.height)||0)/2;
    if(Number.isFinite(measured)&&measured>0)return Math.max(20,measured);
  }catch(_){}
  return Math.max(20,Number(comparison()?.placementBubbleRadius)||19.7);
}
function ordinaryItems(wheel,slot){
  const layer=wheel.querySelector('[data-layer="placements"]');if(!layer)return[];
  const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]:not([data-angle])`)];
  return [...layer.querySelectorAll(`:scope>g[data-sky="${slot}"][data-placement]:not([data-angle-axis="true"]):not([data-placement-foreground-overlay])`)].map((group,index)=>{
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const id=String(group.dataset.placement||'');
    const leader=leaders.find(line=>line.dataset.placement===id&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-5)||leaders.find(line=>line.dataset.placement===id);
    return leader?{group,leader,id,index,exact:norm(exact),display:norm(exact),sign:Math.floor(norm(exact)/30),radius:radiusOf(group)}:null;
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.index-b.index);
}
function placementLane(){const lane=Number(role()?.placement?.[0]);return Number.isFinite(lane)?lane:287}
function bounds(item,wrap=false){
  const shift=wrap&&item.sign===0?360:0;
  return{min:item.sign*30+SIGN_MARGIN+shift,max:(item.sign+1)*30-SIGN_MARGIN+shift};
}
function angularNeed(left,right,lane){
  const chord=Math.max(1,left.radius+right.radius+CLEARANCE);
  const ratio=Math.min(.999999,chord/(2*Math.max(1,lane)));
  return 2*Math.asin(ratio)*180/Math.PI;
}
function relax(items,lane){
  if(items.length<2)return items;
  for(let pass=0;pass<PASSES;pass++){
    let changed=false;
    for(let i=0;i<items.length;i++){
      const left=items[i],right=items[(i+1)%items.length],wrap=i===items.length-1;
      const lv=norm(left.display),rv=norm(right.display)+(wrap?360:0),need=angularNeed(left,right,lane),gap=rv-lv;
      if(gap+EPS>=need)continue;
      let deficit=need-gap;
      const lb=bounds(left,false),rb=bounds(right,wrap);
      const leftRoom=Math.max(0,lv-lb.min),rightRoom=Math.max(0,rb.max-rv);
      if(leftRoom+rightRoom<=EPS)continue;
      const half=deficit/2;
      const moveLeft=Math.min(leftRoom,half);left.display=norm(lv-moveLeft);deficit-=moveLeft;
      const moveRight=Math.min(rightRoom,deficit);right.display=norm(rv+moveRight);deficit-=moveRight;
      if(deficit>EPS){const extraLeft=Math.min(Math.max(0,leftRoom-moveLeft),deficit);left.display=norm(left.display-extraLeft);deficit-=extraLeft}
      changed=true;
    }
    if(!changed)break;
  }
  return items;
}
function protectHouseNumbers(wheel){
  const c=center(),g=role();if(!g)return;
  const radius=(Number(g.inner)+Number(g.outer))/2;
  wheel.querySelectorAll('[data-layer="a-houses"] .sky-foundation-house-number,[data-layer="a-houses"] .sky-placement-mini-house-number').forEach(node=>{
    const x=num(node.getAttribute('x')),y=num(node.getAttribute('y')),dx=x-c.x,dy=y-c.y,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length===0)return;
    node.setAttribute('x',(c.x+dx/length*radius).toFixed(3));node.setAttribute('y',(c.y+dy/length*radius).toFixed(3));node.dataset.houseNumberLane='protected';
  });
}
function applyPlacements(wheel){
  const slot=slotFor(wheel),items=ordinaryItems(wheel,slot);if(!items.length)return;
  const lane=placementLane();relax(items,lane);
  items.forEach((item,index)=>{
    const point=polar(lane,item.display),exact=polar(Number(role()?.degree)||323,item.exact);
    item.group.setAttribute('transform',`translate(${point.x.toFixed(3)} ${point.y.toFixed(3)})`);
    item.group.dataset.displayLongitude=norm(item.display).toFixed(8);
    item.group.dataset.placementLane=lane.toFixed(3);
    item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementTangentialOffset=(item.display-item.exact).toFixed(3);
    item.group.dataset.singleSkyCollisionResolved=Math.abs(item.display-item.exact)>EPS?'true':'false';
    item.group.dataset.singleSkyMeasuredRadius=item.radius.toFixed(3);
    item.leader.setAttribute('x1',point.x.toFixed(3));item.leader.setAttribute('y1',point.y.toFixed(3));
    item.leader.setAttribute('x2',exact.x.toFixed(3));item.leader.setAttribute('y2',exact.y.toFixed(3));
    item.leader.dataset.displayLongitude=norm(item.display).toFixed(8);
    item.leader.dataset.leaderRouting='standalone-measured-single-lane-v6';
  });
  wheel.dataset.singleSkyCollisionLayout='measured-single-lane-v6';
}
function apply(){
  queued=false;if(arranging)return;
  const wheel=singleWheel();if(!(wheel instanceof SVGSVGElement))return;
  arranging=true;try{protectHouseNumbers(wheel);applyPlacements(wheel);wheel.dataset.singleSkySpacing='ready'}finally{arranging=false}
}
function schedule(){if(queued||arranging)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
function start(){
  schedule();
  const mount=document.getElementById('skyFoundationWheelMount');if(mount)new MutationObserver(records=>{if(arranging)return;if(records.some(record=>record.type==='childList'))schedule()}).observe(mount,{childList:true,subtree:false});
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-single-sky-aspects-rendered','relphi:sky-where-when-committed','relphi:saved-sky-loaded','relphi:sky-b-removed'].forEach(name=>window.addEventListener(name,schedule));
}
window.RelphiSkySingleSkyLayout=Object.freeze({apply,schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
