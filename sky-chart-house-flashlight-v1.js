// House flashlight: reveal a selected house's true cusp rays through both skies.
// The default wheel remains unchanged; this overlay never receives pointer events.
(function(root,factory){
'use strict';
const pure=factory();
if(typeof module==='object'&&module.exports)module.exports=pure;
if(!root||!root.document||!/(^|\/)sky-chart\.html$/.test(root.location?.pathname||''))return;
if(root.__relphiSkyHouseFlashlightV1)return;
root.__relphiSkyHouseFlashlightV1=true;
const document=root.document,NS='http://www.w3.org/2000/svg';
let pinned=null,hovered=null,lastWheel=null;
const wrap=(v)=>((Number(v)%360)+360)%360;
function houseNode(target){
 return target?.closest?.('#skyFoundationWheelMount [data-interactive="house"][data-sky][data-house]')||null;
}
function position(node){
 if(!node)return null;
 const sky=String(node.dataset.sky||'').toUpperCase();
 const house=Number(node.dataset.house);
 if(!['A','B'].includes(sky)||!Number.isInteger(house)||house<1||house>12)return null;
 return {sky,house};
}
function same(a,b){return!!a&&!!b&&a.sky===b.sky&&a.house===b.house}
function wheel(){
 return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
}
function svg(tag,props){
 const node=document.createElementNS(NS,tag);
 for(const [key,value] of Object.entries(props))node.setAttribute(key,String(value));
 return node;
}
function host(){
 const chart=wheel();if(!chart)return null;
 let layer=chart.querySelector(':scope > [data-house-flashlight]');
 if(!layer){
  layer=svg('g',{'data-house-flashlight':'true','class':'sky-house-flashlight','pointer-events':'none','aria-hidden':'true'});
  const before=chart.querySelector(':scope > [data-layer="aspects"]')||chart.querySelector(':scope > [data-layer="leaders"]');
  if(before)chart.insertBefore(layer,before);else chart.appendChild(layer);
 }
 return layer;
}
function geometry(chart,slot){
 const spec=root.RelphiSkyWheelSpec?.comparison;
 if(!spec)return null;
 const comparable=chart.hasAttribute('data-outer-sky')&&!!chart.querySelector('[data-layer="b-houses"] > path[data-house]');
 const inside=Number(spec.inner.inner),zIn=Number(spec.zodiac.inner),zOut=Number(spec.zodiac.outer),outside=comparable?Number(spec.outer.outer):zOut;
 return pure.segments({slot,inside,zIn,zOut,outside,comparable});
}
function decorate(parent,angle,section,center,color,index){
 const a=pure.polar(center,section.from,angle),b=pure.polar(center,section.to,angle);
 parent.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,
  'data-boundary':String(index),'data-segment':'other',
  'vector-effect':'non-scaling-stroke',stroke:color,
  'stroke-width':'2','stroke-dasharray':'6 6',
  'pointer-events':'none',
  'class':'sky-house-flashlight-edge sky-house-flashlight-other'}));
}
function render(){
 const chart=wheel(),layer=host();
 if(!layer||!chart)return;
 const focus=pinned||hovered;
 if(!focus){layer.replaceChildren();layer.removeAttribute('data-sky');layer.removeAttribute('data-house');return}
 const sector=chart.querySelector('[data-layer="'+(focus.sky==='A'?'a-houses':'b-houses')+'"] > path[data-house="'+focus.house+'"][data-house-cusp-start][data-house-cusp-end]');
 if(!sector){layer.replaceChildren();return} // unknown-time charts have no valid house sectors
 const starts=[Number(sector.dataset.houseCuspStart),Number(sector.dataset.houseCuspEnd)];
 if(!starts.every(Number.isFinite)){layer.replaceChildren();return}
 const segments=geometry(chart,focus.sky);
 if(!segments){layer.replaceChildren();return}
 const spec=root.RelphiSkyWheelSpec?.comparison,center=spec?.center;
 if(!center){layer.replaceChildren();return}
 const fragment=document.createDocumentFragment(),color=root.RelphiSkyWheelSpec?.SKY?.[focus.sky]||'#c9211e';
 starts.forEach((angle,index)=>{
  const group=svg('g',{'data-house-flashlight-boundary':index===0?'start':'end'});
  segments.filter(section=>section.role==='other').forEach(section=>decorate(group,angle,section,center,color,index));
  fragment.appendChild(group);
 });
 layer.replaceChildren(fragment);
 layer.dataset.sky=focus.sky;layer.dataset.house=String(focus.house);
 layer.dataset.pinned=String(!!pinned);
 layer.setAttribute('aria-label','Sky '+focus.sky+' house '+focus.house+' cusp extensions');
 lastWheel=chart;
}
function setHover(value){
 if(same(hovered,value)||(!hovered&&!value))return;
 hovered=value;render();
}
function setPinned(value){
 pinned=value;render();
}
document.addEventListener('pointerover',event=>{
 const node=houseNode(event.target);
 if(!node)return;
 setHover(position(node));
});
document.addEventListener('pointerout',event=>{
 const node=houseNode(event.target);
 if(!node||node.contains(event.relatedTarget))return;
 if(same(hovered,position(node)))setHover(null);
});
root.addEventListener('relphi:sky-house-focus-bridge-changed',event=>{
 const detail=event.detail||{};
 if(detail.active===true&&(detail.slot==='A'||detail.slot==='B')&&Number.isInteger(Number(detail.house))){
  setPinned({sky:detail.slot,house:Number(detail.house)});
 }else{
  setPinned(null);
 }
});
root.addEventListener('relphi:sky-foundation-filter-changed',event=>{
 const state=event.detail?.state;
 // Hover/selected house focus may originate outside the house wedge itself
 // (e.g. a card). Don't overwrite explicit house taps while pinned.
 if(pinned)return;
 if(state?.kind==='house'&&(state.sky==='A'||state.sky==='B')){
  setHover({sky:state.sky,house:Number(state.value)});
 }else if(state?.kind&&hovered&&!houseNode(document.querySelector(':hover [data-interactive="house"]'))){
  setHover(null);
 }
});
root.addEventListener('relphi:sky-foundation-clear-selection',()=>{setPinned(null);setHover(null)});
root.addEventListener('relphi:sky-b-removed',()=>{
 if(pinned?.sky==='B')pinned=null;
 if(hovered?.sky==='B')hovered=null;
 root.requestAnimationFrame(render);
});
// A normal click away from a house should not leave a pinned highlight.
document.addEventListener('click',event=>{
 if(!pinned||houseNode(event.target))return;
 const inside=document.getElementById('skyFoundationRoot')?.contains(event.target);
 if(!inside)return;
 if(event.target.closest('button,input,select,textarea,label,summary,details'))return;
 setPinned(null);
});
root.addEventListener('relphi:sky-foundation-ready',()=>root.requestAnimationFrame(()=>{
 if(wheel()!==lastWheel||pinned||hovered)render();
}));
root.RelphiSkyHouseFlashlight=Object.freeze({render,getFocus:()=>pinned||hovered});
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function polar(center,radius,degree){
  const radians=((Number(degree)%360+360)%360-180)*Math.PI/180;
  return{x:center.x+radius*Math.cos(radians),y:center.y+radius*Math.sin(radians)};
 }
 function segments({slot,inside,zIn,zOut,outside,comparable}){
  if(!['A','B'].includes(slot)||![inside,zIn,zOut,outside].every(Number.isFinite)||inside<0||inside>=zIn||zIn>=zOut||zOut>outside)return null;
  if(slot==='B'&&!comparable)return null;
  return[
   {role:slot==='A'?'home':'other',from:inside,to:zIn},
   {role:'zodiac',from:zIn,to:zOut},
   ...(comparable?[{role:slot==='B'?'home':'other',from:zOut,to:outside}]:[])
  ];
 }
 return Object.freeze({polar,segments});
});
