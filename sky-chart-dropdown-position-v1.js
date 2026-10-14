// Canonical Sky Chart dropdown geometry. No consumer positions a menu independently.
(function(){
'use strict';
if(window.RelphiSkyDropdownPosition)return;
function position(menu,anchor,targetWidth=330){
  if(!menu||!anchor||menu.hidden)return;
  // Do not display a detached dropdown if its collapse control has left view.
  if(!anchor.isConnected)return;
  const rect=anchor.getBoundingClientRect(),margin=12,gap=6;
  const width=Math.min(targetWidth,Math.max(0,window.innerWidth-margin*2));
  menu.style.height='auto';menu.style.maxHeight='none';menu.style.overflowY='hidden';
  const computed=getComputedStyle(menu);
  const borders=(parseFloat(computed.borderTopWidth)||0)+(parseFloat(computed.borderBottomWidth)||0);
  const natural=Math.ceil(menu.scrollHeight+borders);
  const below=Math.max(0,window.innerHeight-margin-rect.bottom-gap);
  const above=Math.max(0,rect.top-gap-margin);
  const useBelow=below>=natural||(below>=above&&above<natural);
  const available=useBelow?below:above;
  const height=Math.max(0,Math.min(natural,available));
  const top=useBelow?rect.bottom+gap:rect.top-gap-height;
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
  Object.assign(menu.style,{position:'fixed',width:width+'px',height:height+'px',maxHeight:height+'px',overflowY:natural>height?'auto':'hidden',left:left+'px',top:top+'px',bottom:'auto'});
  menu.dataset.openDirection=useBelow?'below':'above';
}
// Shared outside-tap and Escape lifecycle. Filter modules own selection state only.
const registrations=new Map();
let outside=null;
function register(key,config){registrations.set(key,config);return()=>registrations.delete(key)}
function active(){return [...registrations.values()].filter(config=>config.isOpen?.())}
function inside(event,config){
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  return [config.anchor?.(),config.menu?.(),config.owner?.()].some(node=>node&&(path.includes(node)||node.contains?.(event.target)));
}
document.addEventListener('pointerdown',event=>{
  const candidates=active().filter(config=>!inside(event,config));
  outside=candidates.length?{id:event.pointerId,x:event.clientX,y:event.clientY,moved:false,candidates}:null;
},true);
document.addEventListener('pointermove',event=>{
  if(!outside||outside.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-outside.x,event.clientY-outside.y)>8)outside.moved=true;
},true);
document.addEventListener('pointerup',event=>{
  if(!outside||outside.id!==event.pointerId)return;
  const gesture=outside;outside=null;
  if(!gesture.moved&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)<=8){
    gesture.candidates.forEach(config=>{if(config.isOpen?.())config.close?.()});
  }
},true);
document.addEventListener('pointercancel',()=>{outside=null},true);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')active().forEach(config=>config.close?.(true));
});
window.RelphiSkyDropdownLifecycle=Object.freeze({register});
window.RelphiSkyDropdownPosition=position;
})();
