// Browser adapter for the pure finite harmonic engine.
(function(){
'use strict';
if(window.RelphiHarmonicOrb)return;
const engine=window.RelphiHarmonicEngine;
if(!engine)throw new Error('RelphiHarmonicEngine must load before its browser adapter.');
let activeWindow=engine.defaultWindow;
function setWindow(value){activeWindow=clampWindow(value);document.documentElement.dataset.skyHarmonicWindow=String(activeWindow);return activeWindow}
function windowFromControl(){const input=document.querySelector('[data-filter="orb"]');if(input&&String(input.value).trim()!=='')setWindow(input.value);return activeWindow}
const clampWindow=engine.clampWindow;
window.addEventListener('relphi:sky-orb-limit-changed',event=>{const value=event.detail?.harmonicWindow??event.detail?.orb;if(value!=null)setWindow(value)});
window.RelphiHarmonicOrb=Object.freeze({...engine,setWindow,windowFromControl});
})();
