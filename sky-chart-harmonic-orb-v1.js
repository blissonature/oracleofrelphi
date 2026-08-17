// Harmonic Orb Theorem: one canonical aspect-phase model for Sky Chart.
(function(){
'use strict';
if(window.RelphiHarmonicOrb)return;
const DEFAULT_WINDOW=6;
const MAX_WINDOW=12;
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
function setWindow(value){activeWindow=clampWindow(value);document.documentElement.dataset.skyHarmonicWindow=String(activeWindow);return activeWindow}
function windowFromControl(){const input=document.querySelector('[data-filter="orb"]');if(input&&String(input.value).trim()!=='')setWindow(input.value);return activeWindow}
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
function loadCollectiveHarmonics(){
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveHarmonicsLoadStarted)return;
  window.__relphiCollectiveHarmonicsLoadStarted=true;
  function append(src,done){
    const script=document.createElement('script');script.src=src;script.async=false;
    if(done)script.addEventListener('load',done,{once:true});
    script.addEventListener('error',()=>console.error('[Oracle of Relphi] Could not load collective harmonic layer:',src),{once:true});
    (document.head||document.documentElement).appendChild(script);
  }
  append('relphi-collective-harmonics-core-v1.js?v=3',()=>{
    append('relphi-harmonic-provenance-v1.js?v=1',()=>{
      append('sky-chart-collective-harmonics-v1.js?v=4');
      append('sky-chart-collective-comparison-v1.js?v=4');
    });
  });
}
window.addEventListener('relphi:sky-orb-limit-changed',event=>{const value=event.detail?.harmonicWindow??event.detail?.orb;if(value!=null)setWindow(value)});
window.RelphiHarmonicOrb=Object.freeze({theorem:'ordinary orb × fundamental harmonic order = harmonic phase error',defaultWindow:DEFAULT_WINDOW,maxWindow:MAX_WINDOW,aspects:ASPECTS,byId:id=>BY_ID.get(String(id||''))||null,clampWindow,setWindow,windowFromControl,metrics,motion,relation});
loadCollectiveHarmonics();
})();
