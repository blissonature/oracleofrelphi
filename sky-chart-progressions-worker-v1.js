// Background ephemeris sampler for Sky Chart calendar-time Progressions playback.
// Astronomy Engine runs in this worker so the visible wheel never waits on ephemeris work.
'use strict';

importScripts('vendor/astronomy-engine/astronomy.browser.min.js');

const BODIES=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
const BODY_NAME={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
let generation=0;

const norm=value=>((Number(value)%360)+360)%360;

function longitude(id,targetMs){
  const body=self.Astronomy?.Body?.[BODY_NAME[id]]||BODY_NAME[id];
  const vector=self.Astronomy.GeoVector(body,new Date(targetMs),true);
  return norm(self.Astronomy.Ecliptic(vector).elon);
}

function sample(targetMs){
  const values={};
  for(const id of BODIES)values[id]=longitude(id,targetMs);
  return values;
}

self.onmessage=event=>{
  const data=event.data||{};
  if(data.type==='cancel'){
    generation+=1;
    return;
  }
  if(data.type!=='stream')return;

  const token=++generation;
  const requestId=String(data.requestId||'');
  const startTargetMs=Number(data.startTargetMs);
  const stepTargetMs=Math.max(1,Number(data.stepTargetMs)||1);
  const maxTargetMs=Number(data.maxTargetMs);
  const count=Math.max(1,Math.min(96,Number(data.count)||48));
  let index=0;

  function next(){
    if(token!==generation)return;
    if(!Number.isFinite(startTargetMs)||!Number.isFinite(maxTargetMs)){
      self.postMessage({type:'error',requestId,message:'Invalid calendar-sky worker request.'});
      return;
    }
    const targetMs=Math.min(maxTargetMs,startTargetMs+index*stepTargetMs);
    try{
      self.postMessage({type:'sample',requestId,targetMs,values:sample(targetMs)});
    }catch(error){
      self.postMessage({type:'error',requestId,message:String(error?.message||error||'Calendar-sky worker failed.')});
      return;
    }
    index+=1;
    if(index<count&&targetMs<maxTargetMs){
      setTimeout(next,0);
    }else{
      self.postMessage({type:'done',requestId,targetMs});
    }
  }

  next();
};
