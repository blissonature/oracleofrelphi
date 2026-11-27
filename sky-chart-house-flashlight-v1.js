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
let focus=null,lastWheel=null;
const wrap=(v)=>((Number(v)%360)+360)%360;
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
 const base={x1:a.x,y1:a.y,x2:b.x,y2:b.y,
  'data-boundary':String(index),'data-segment':section.role,'vector-effect':'non-scaling-stroke',
  stroke:color,'stroke-linecap':'round'};
 const glow=svg('line',{...base,'class':'sky-house-flashlight-glow sky-house-flashlight-'+section.role,
   'stroke-width':section.role==='home'?10:section.role==='zodiac'?9:7});
 const core=svg('line',{...base,'class':'sky-house-flashlight-edge sky-house-flashlight-'+section.role,
   'stroke-width':section.role==='home'?2.9:section.role==='zodiac'?2.5:2.0});
 parent.append(glow,core);
}
function render(){
 const chart=wheel(),layer=host();
 if(!layer||!chart)return;
 if(!focus){layer.replaceChildren();layer.removeAttribute('data-sky');layer.removeAttribute('data-house');layer.removeAttribute('data-pinned');return}
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
  segments.forEach(section=>decorate(group,angle,section,center,color,index));
  fragment.appendChild(group);
 });
 layer.replaceChildren(fragment);
 layer.dataset.sky=focus.sky;layer.dataset.house=String(focus.house);
 layer.dataset.pinned=String(focus.mode==='selected');
 layer.setAttribute('aria-label','Sky '+focus.sky+' house '+focus.house+' cusp extensions');
 lastWheel=chart;
}
// The foundation interaction controller owns hover, selection and exit.
// Do not maintain a second pointer-derived hover or a second pin.
function setFocus(state){
 const next=state?.kind==='house'&&['A','B'].includes(state.sky)&&Number.isInteger(Number(state.value))&&['hover','selected'].includes(state.mode)
  ?{sky:state.sky,house:Number(state.value),mode:state.mode}:null;
 if(focus?.sky===next?.sky&&focus?.house===next?.house&&focus?.mode===next?.mode)return;
 focus=next;render();
}
root.addEventListener('relphi:sky-foundation-filter-changed',event=>setFocus(event.detail?.state));
root.addEventListener('relphi:sky-foundation-clear-selection',()=>setFocus(null));
root.addEventListener('relphi:sky-b-removed',()=>{if(focus?.sky==='B')setFocus(null)});
root.addEventListener('relphi:sky-foundation-ready',()=>root.requestAnimationFrame(()=>{
 if(wheel()!==lastWheel||focus)render();
}));
root.RelphiSkyHouseFlashlight=Object.freeze({render,getFocus:()=>focus?{sky:focus.sky,house:focus.house}:null});
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
