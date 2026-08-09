// Harmonic Orb Theorem: one canonical aspect-phase model for Sky Chart.
(function(){
'use strict';
if(window.RelphiHarmonicOrb)return;
const DEFAULT_WINDOW=10;
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
function clampWindow(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.min(360,n):DEFAULT_WINDOW}
function windowFromControl(){return clampWindow(document.querySelector('[data-filter="orb"]')?.value ?? DEFAULT_WINDOW)}
function signedShortest(degrees){return ((Number(degrees)+180)%360+360)%360-180}
function metrics(distance,aspectLike,windowValue){
  const aspect=typeof aspectLike==='string'?BY_ID.get(aspectLike):aspectLike;
  if(!aspect)return null;
  const masterWindow=clampWindow(windowValue);
  const signedOrdinaryOrb=Number(distance)-aspect.angle;
  const ordinaryOrb=Math.abs(signedOrdinaryOrb);
  const signedPhaseError=signedShortest(signedOrdinaryOrb*aspect.harmonic);
  const phaseError=Math.abs(signedPhaseError);
  const fraction=masterWindow>0?phaseError/masterWindow:(phaseError===0?0:Infinity);
  const coherence=phaseError===0&&masterWindow===0?1:(masterWindow>0&&phaseError<=masterWindow?Math.cos(Math.min(1,fraction)*Math.PI/2)**2:0);
  return Object.freeze({
    ordinaryOrb,
    signedOrdinaryOrb,
    harmonicOrder:aspect.harmonic,
    harmonicNumerator:aspect.numerator,
    signedPhaseError,
    phaseError,
    masterWindow,
    windowFraction:fraction,
    coherence,
    coherencePercent:coherence*100,
    active:phaseError<=masterWindow
  });
}
function relation(left,right,aspect,distance,windowValue){const m=metrics(distance,aspect,windowValue);return m&&m.active?{left,right,aspect,distance,orb:m.ordinaryOrb,...m}:null}
window.RelphiHarmonicOrb=Object.freeze({
  theorem:'ordinary orb × fundamental harmonic order = harmonic phase error',
  defaultWindow:DEFAULT_WINDOW,
  aspects:ASPECTS,
  byId:id=>BY_ID.get(String(id||''))||null,
  clampWindow,
  windowFromControl,
  metrics,
  relation
});
})();