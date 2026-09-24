// Harmonic Orb Theorem: one canonical aspect-phase model for Sky Chart.
(function(){
'use strict';
if(window.RelphiHarmonicOrb)return;
const DEFAULT_WINDOW=6;
const MAX_WINDOW=12;
const WINDOW_STEP=.05;
const ASPECTS=Object.freeze([
  Object.freeze({id:'conjunction',angle:0,numerator:0,harmonic:1,color:'#e53935'}),
  Object.freeze({id:'semi-sextile',angle:30,numerator:1,harmonic:12,color:'#7c9b49'}),
  Object.freeze({id:'octile',angle:45,numerator:1,harmonic:8,color:'#b86d43'}),
  Object.freeze({id:'sextile',angle:60,numerator:1,harmonic:6,color:'#d3b727'}),
  Object.freeze({id:'quintile',angle:72,numerator:1,harmonic:5,color:'#8b6cc2'}),
  Object.freeze({id:'square',angle:90,numerator:1,harmonic:4,color:'#d6534d'}),
  Object.freeze({id:'trine',angle:120,numerator:1,harmonic:3,color:'#4e9e69'}),
  Object.freeze({id:'tri-octile',angle:135,numerator:3,harmonic:8,color:'#9f5944'}),
  Object.freeze({id:'bi-quintile',angle:144,numerator:2,harmonic:5,color:'#7655aa'}),
  Object.freeze({id:'quincunx',angle:150,numerator:5,harmonic:12,color:'#4b8e88'}),
  Object.freeze({id:'opposition',angle:180,numerator:1,harmonic:2,color:'#5961c8'})
]);
const BY_ID=new Map(ASPECTS.map(aspect=>[aspect.id,aspect]));
let activeWindow=DEFAULT_WINDOW;
function clampWindow(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.min(MAX_WINDOW,n):DEFAULT_WINDOW}
function syncVisibleControls(sourceInput=null){
  const value=String(activeWindow),max=String(MAX_WINDOW);
  document.querySelectorAll('[data-harmonic-window-input],[data-vocab-harmonic-window-input]').forEach(input=>{
    if(input!==sourceInput)input.value=value;
    input.setAttribute('aria-valuenow',value);
    input.setAttribute('aria-valuemax',max);
    input.setAttribute('aria-invalid','false');
    input.setCustomValidity?.('');
  });
}
function setWindow(value,sourceInput=null){
  const next=clampWindow(value),changed=next!==activeWindow;
  activeWindow=next;
  document.documentElement.dataset.skyHarmonicWindow=String(activeWindow);
  syncVisibleControls(sourceInput);
  if(changed)window.dispatchEvent(new CustomEvent('relphi:sky-harmonic-window-model-changed',{detail:{harmonicWindow:activeWindow}}));
  return activeWindow;
}
function getWindow(){return activeWindow}
function harmonicWindowInput(target){
  return target?.closest?.('[data-harmonic-window-input],[data-vocab-harmonic-window-input]')||null;
}
function stepWindow(input,direction){
  const current=Number(String(input?.value??activeWindow).trim().replace(',','.'));
  const base=Number.isFinite(current)?current:activeWindow;
  const next=clampWindow(Math.round((base+direction*WINDOW_STEP)*100)/100);
  if(input)input.value=String(next);
  return setWindow(next,input);
}
document.addEventListener('keydown',event=>{
  const input=harmonicWindowInput(event.target);
  if(!input||(event.key!=='ArrowUp'&&event.key!=='ArrowDown'))return;
  event.preventDefault();
  event.stopPropagation();
  stepWindow(input,event.key==='ArrowUp'?1:-1);
});
// The [data-filter="orb"] control is the stable MAXIMUM candidate ceiling used
// to build the relationship pool. Reading it must never mutate the user's live
// Harmonic Window.
function windowFromControl(){
  const input=document.querySelector('[data-filter="orb"]');
  const raw=String(input?.value??'').trim().replace(',','.');
  return raw!==''?clampWindow(raw):MAX_WINDOW;
}
function metrics(distance,aspectLike,windowValue){
  const aspect=typeof aspectLike==='string'?BY_ID.get(aspectLike):aspectLike;
  if(!aspect)return null;
  const masterWindow=clampWindow(windowValue);
  const signedOrdinaryOrb=Number(distance)-aspect.angle;
  const ordinaryOrb=Math.abs(signedOrdinaryOrb);
  // Fundamental-harmonic rule: local error from THIS aspect target is multiplied by n.
  // Do not wrap the result around 360: wrapping aliases an exact conjunction into
  // opposition/trine/square/etc. because those higher transforms also land on 0°.
  const signedPhaseError=signedOrdinaryOrb*aspect.harmonic;
  const phaseError=Math.abs(signedPhaseError);
  const fraction=masterWindow>0?phaseError/masterWindow:(phaseError===0?0:Infinity);
  const coherence=phaseError===0&&masterWindow===0?1:(masterWindow>0&&phaseError<=masterWindow?Math.cos(Math.min(1,fraction)*Math.PI/2)**2:0);
  return Object.freeze({ordinaryOrb,signedOrdinaryOrb,harmonicOrder:aspect.harmonic,harmonicNumerator:aspect.numerator,signedPhaseError,phaseError,masterWindow,windowFraction:fraction,coherence,coherencePercent:coherence*100,active:phaseError<=masterWindow});
}
function motion(metricsLike,leftVelocity,rightVelocity){
  const lv=Number(leftVelocity),rv=Number(rightVelocity);
  if(!metricsLike||!Number.isFinite(lv)||!Number.isFinite(rv))return Object.freeze({available:false,relativeVelocity:NaN,harmonicVelocity:NaN,applying:null,timeToExactitudeDays:NaN});
  const relativeVelocity=rv-lv;
  const harmonicVelocity=relativeVelocity*metricsLike.harmonicOrder;
  const now=Math.abs(metricsLike.signedPhaseError);
  const later=Math.abs(metricsLike.signedPhaseError+harmonicVelocity/24);
  const applying=later<now;
  const timeToExactitudeDays=Math.abs(harmonicVelocity)>1e-12?Math.abs(metricsLike.signedPhaseError/harmonicVelocity):Infinity;
  return Object.freeze({available:true,relativeVelocity,harmonicVelocity,applying,timeToExactitudeDays});
}
function relation(left,right,aspect,distance,windowValue){const m=metrics(distance,aspect,windowValue);if(!m||!m.active)return null;const temporal=motion(m,left?.angularVelocity??left?.velocity??left?.item?.angularVelocity??left?.item?.velocity??left?.item?.speed,right?.angularVelocity??right?.velocity??right?.item?.angularVelocity??right?.item?.velocity??right?.item?.speed);return{left,right,aspect,distance,orb:m.ordinaryOrb,...m,temporal}}
window.addEventListener('relphi:sky-orb-limit-changed',event=>{const value=event.detail?.harmonicWindow??event.detail?.orb;if(value!=null)setWindow(value)});
window.RelphiHarmonicOrb=Object.freeze({theorem:'ordinary orb × fundamental harmonic order = harmonic phase error',defaultWindow:DEFAULT_WINDOW,maxWindow:MAX_WINDOW,windowStep:WINDOW_STEP,aspects:ASPECTS,byId:id=>BY_ID.get(String(id||''))||null,clampWindow,setWindow,getWindow,stepWindow,syncVisibleControls,windowFromControl,metrics,motion,relation});
})();