// Default Progressions to the selected sky's epoch through today, with the playhead at the epoch.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsEpochDefaultV1)return;
  window.__relphiSkyProgressionsEpochDefaultV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  let lastSignature='';
  let applying=false;

  const read=slot=>{try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}};
  const profile=payload=>payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload||{};
  function epochMs(slot){
    const payload=read(slot),raw=profile(payload)?.instant||profile(payload)?.dateTime||payload?.instant||payload?.dateTime;
    if(!raw)return NaN;
    const value=new Date(raw).getTime();
    return Number.isFinite(value)?value:NaN;
  }
  function dateValue(ms){
    const date=new Date(ms),year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
    return`${year}-${month}-${day}`;
  }
  function source(){return document.querySelector('[data-progression-source]')?.value==='B'?'B':'A'}
  function signature(){const slot=source();return`${slot}|${localStorage.getItem(KEYS[slot])||''}`}
  function applyDefault(){
    if(applying)return false;
    const panel=document.getElementById('skyProgressionsPanel');
    if(!panel)return false;
    const slot=source(),epoch=epochMs(slot),start=panel.querySelector('[data-progression-range-start]'),end=panel.querySelector('[data-progression-range-end]'),scrubber=panel.querySelector('[data-progression-scrubber]');
    if(!Number.isFinite(epoch)||!start||!end||!scrubber)return false;
    applying=true;
    try{
      start.value=dateValue(epoch);
      end.value=dateValue(Math.max(epoch+86400000,Date.now()));
      start.dispatchEvent(new Event('change',{bubbles:true}));
      scrubber.value='0';
      scrubber.dispatchEvent(new Event('input',{bubbles:true}));
      lastSignature=signature();
      document.documentElement.dataset.skyProgressionsDefaultRange='epoch-to-today';
      return true;
    }finally{applying=false}
  }
  function scheduleDefault(){requestAnimationFrame(()=>requestAnimationFrame(applyDefault))}

  document.addEventListener('change',event=>{
    if(applying)return;
    if(event.target.matches?.('[data-progression-source]'))scheduleDefault();
  });
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-sky-middle-tab="progressions"]')&&!lastSignature)scheduleDefault();
  });

  function start(){
    scheduleDefault();
    setInterval(()=>{
      const next=signature();
      if(next&&lastSignature&&next!==lastSignature)scheduleDefault();
    },1000);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
