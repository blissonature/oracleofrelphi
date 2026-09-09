(function(){
'use strict';
if(window.__relphiSkyRenderStabilityV3)return;
window.__relphiSkyRenderStabilityV3=true;
window.__relphiSkyRenderStabilityV2=true;
window.__relphiSkyRenderStabilityV1=true;
const root=document.documentElement;
const SKY_KEYS=['relphiSkyChartA','relphiSkyChartB'];
let revealTimer=0;
let editSignature='';

function storageSignature(){
  try{return JSON.stringify(SKY_KEYS.map(key=>localStorage.getItem(key)||''))}catch(_){return''}
}
function hide(){
  clearTimeout(revealTimer);
  delete root.dataset.skyWheelStable;
}
function wheelReady(){
  const foundation=document.getElementById('skyFoundationRoot');
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  return !!wheel&&foundation?.getAttribute('aria-busy')==='false';
}
function reveal(){
  if(wheelReady())root.dataset.skyWheelStable='true';
}
function show(){
  requestAnimationFrame(()=>requestAnimationFrame(reveal));
}
function showAfterFoundation(){
  // The foundation is already the completed replacement wheel. Do not strand it hidden
  // if the interaction pass elects not to run (for example while a Where/When editor remains open).
  show();
  clearTimeout(revealTimer);
  revealTimer=window.setTimeout(reveal,180);
}
function rememberEditStart(event){
  if(event.detail?.active===true)editSignature=storageSignature();
}

// Foundation v2 historically forced render(true) whenever a Where/When edit ended,
// even when the user merely changed drawers and the saved sky had not changed.
// Wrap only that exact listener: real storage changes still render, unchanged closes do not.
const nativeAddEventListener=window.addEventListener;
let closeRenderWrapped=false;
nativeAddEventListener.call(window,'relphi:sky-where-when-edit-state-changed',rememberEditStart);
window.addEventListener=function(type,listener,options){
  if(!closeRenderWrapped&&type==='relphi:sky-where-when-edit-state-changed'&&typeof listener==='function'){
    const source=Function.prototype.toString.call(listener);
    if(source.includes('active===false')&&source.includes('render(true)')){
      closeRenderWrapped=true;
      const wrapped=function(event){
        if(event?.detail?.active!==false)return listener.call(this,event);
        const before=editSignature;
        editSignature='';
        if(before&&storageSignature()===before){
          show();
          return;
        }
        return listener.call(this,event);
      };
      const result=nativeAddEventListener.call(this,type,wrapped,options);
      window.addEventListener=nativeAddEventListener;
      return result;
    }
  }
  return nativeAddEventListener.call(this,type,listener,options);
};

hide();
nativeAddEventListener.call(window,'relphi:sky-orb-limit-changed',hide,{capture:true});
nativeAddEventListener.call(window,'storage',hide,{capture:true});
nativeAddEventListener.call(window,'relphi:sky-foundation-ready',showAfterFoundation);
nativeAddEventListener.call(window,'relphi:sky-foundation-interactions-ready',show);
if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')show();
})();
