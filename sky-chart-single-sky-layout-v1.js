// Single-sky wheel layout v4: preserve one radial placement lane and resolve crowding tangentially within each true sign.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyLayoutV4)return;
window.__relphiSkySingleSkyLayoutV1=true;
window.__relphiSkySingleSkyLayoutV2=true;
window.__relphiSkySingleSkyLayoutV3=true;
window.__relphiSkySingleSkyLayoutV4=true;

const EPS=1e-6;
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
function ordinaryItems(wheel,slot){
  const layer=wheel.querySelector('[data-layer="placements"]');if(!layer)return[];
  const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]:not([data-angle])`)];
  return [...layer.querySelectorAll(`:scope>g[data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)].map((group,index)=>{
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const id=String(group.dataset.placement||'');
    const leader=leaders.find(line=>line.dataset.placement===id&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-5)||leaders.find(line=>line.dataset.placement===id);
    return leader?{group,leader,id,index,exact:norm(exact),sign:Math.floor(norm(exact)/30)}:null;
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.index-b.index);
}
function placementLane(){const lane=Number(role()?.placement?.[0]);return Number.isFinite(lane)?lane:287}
function minimumSeparation(lane){
  const cmp=comparison()||{},bubble=Number(cmp.placementBubbleRadius)||19.7,clearance=Math.max(3,Number(cmp.placementClearance)||6),chord=2*bubble+clearance;
  const ratio=Math.min(.999999,chord/(2*Math.max(1,lane)));
  return 2*Math.asin(ratio)*180/Math.PI+.08;
}
function isotonic(values){
  const blocks=[];
  values.forEach((value,index)=>{
    let block={start:index,end:index,count:1,sum:value,mean:value};blocks.push(block);
    while(blocks.length>1){
      const right=blocks[blocks.length-1],left=blocks[blocks.length-2];if(left.mean<=right.mean+EPS)break;
      blocks.pop();blocks.pop();block={start:left.start,end:right.end,count:left.count+right.count,sum:left.sum+right.sum};block.mean=block.sum/block.count;blocks.push(block);
    }
  });
  const out=new Array(values.length);blocks.forEach(block=>{for(let i=block.start;i<=block.end;i++)out[i]=block.mean});return out;
}
function solveSign(items,lane){
  if(!items.length)return[];
  if(items.length===1)return[{item:items[0],display:items[0].exact,lane}];
  const sign=items[0].sign,signStart=sign*30,signEnd=signStart+30;
  const requested=minimumSeparation(lane),maxFit=(29.4)/(items.length-1),sep=Math.min(requested,maxFit);
  const margin=Math.min(.3,Math.max(.05,sep*.04)),lower=signStart+margin,upper=signEnd-margin-(items.length-1)*sep;
  const targets=items.map((item,index)=>item.exact-index*sep),fit=isotonic(targets);
  return items.map((item,index)=>{
    const base=Math.max(lower,Math.min(upper,fit[index])),display=base+index*sep;
    return{item,display,lane};
  });
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
  const lane=placementLane(),bySign=new Map();
  items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSign(bySign.get(sign)||[],lane));
  solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  solution.forEach((record,index)=>{
    const {item}=record,point=polar(lane,record.display),exact=polar(Number(role()?.degree)||323,item.exact);
    item.group.setAttribute('transform',`translate(${point.x.toFixed(3)} ${point.y.toFixed(3)})`);
    item.group.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.group.dataset.placementLane=lane.toFixed(3);
    item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementTangentialOffset=(record.display-item.exact).toFixed(3);
    item.group.dataset.singleSkyCollisionResolved=Math.abs(record.display-item.exact)>EPS?'true':'false';
    item.leader.setAttribute('x1',point.x.toFixed(3));item.leader.setAttribute('y1',point.y.toFixed(3));
    item.leader.setAttribute('x2',exact.x.toFixed(3));item.leader.setAttribute('y2',exact.y.toFixed(3));
    item.leader.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.leader.dataset.leaderRouting='standalone-single-lane-ordered-v4';
  });
  wheel.dataset.singleSkyCollisionLayout='single-lane-tangential-v4';
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
  ['relphi:sky-foundation-ready','relphi:sky-single-sky-aspects-rendered','relphi:sky-where-when-committed','relphi:saved-sky-loaded','relphi:sky-b-removed'].forEach(name=>window.addEventListener(name,schedule));
}
window.RelphiSkySingleSkyLayout=Object.freeze({apply,schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
