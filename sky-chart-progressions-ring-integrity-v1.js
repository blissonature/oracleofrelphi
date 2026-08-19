// Keep Sky A red glyph bubbles on the Sky A ring and Sky B blue glyph bubbles on the Sky B ring.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const C={x:600,y:600};
  const LANES={A:[450,440,460],B:[287,299,283]};
  const EXACT={A:414,B:323};
  const BUBBLE_RADIUS=17.2;
  const CLEARANCE=6;
  let queued=false,applying=false,observer=null,observedWheel=null;

  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const sourceSlot=()=>document.querySelector('[data-progression-source]')?.value==='B'?'B':'A';
  const otherSlot=slot=>slot==='A'?'B':'A';

  function comparisonWheel(){return document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')}
  function progressionWheel(){return document.querySelector('[data-progression-shared-wheel]')}

  function restoreSlot(slot,wheel,source){
    if(!wheel||!source)return;
    const hosts=[...wheel.querySelectorAll(`[data-layer="placements"] [data-sky="${slot}"]`)];
    hosts.forEach(host=>{
      const id=host.dataset.placement,original=source.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]`);
      if(!original){host.hidden=true;return}
      host.hidden=original.hidden;
      const transform=original.getAttribute('transform');if(transform!=null)host.setAttribute('transform',transform);
      for(const key of ['placementLane','displayLongitude','exactLongitude']){
        if(original.dataset[key]!=null)host.dataset[key]=original.dataset[key];else delete host.dataset[key];
      }
    });
    const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] [data-sky="${slot}"]`)];
    leaders.forEach(leader=>{
      const id=leader.dataset.placement,original=source.querySelector(`[data-layer="leaders"] [data-sky="${slot}"][data-placement="${CSS.escape(id)}"]`);
      if(!original){leader.hidden=true;return}
      leader.hidden=original.hidden;
      for(const attr of ['x1','y1','x2','y2']){const value=original.getAttribute(attr);if(value!=null)leader.setAttribute(attr,value)}
      if(original.dataset.exactLongitude!=null)leader.dataset.exactLongitude=original.dataset.exactLongitude;
    });
  }

  function spread(records,slot){
    const lanes=LANES[slot],placed=[],result=[];
    for(const record of records.slice().sort((a,b)=>a.value-b.value)){
      let chosen=null;
      for(let step=0;step<=20&&!chosen;step+=1){
        const magnitude=step*.75,offsets=step===0?[0]:[magnitude,-magnitude];
        for(const offset of offsets){
          for(const lane of lanes){
            const display=norm(record.value+offset),point=polar(lane,display),collision=placed.some(other=>Math.hypot(point.x-other.x,point.y-other.y)<BUBBLE_RADIUS*2+CLEARANCE);
            if(collision)continue;chosen={...record,lane,display};placed.push(point);break;
          }
          if(chosen)break;
        }
      }
      result.push(chosen||{...record,lane:lanes[0],display:record.value});
    }
    return result;
  }

  function moveProgressedAFromBlueLane(wheel){
    const blue=[...wheel.querySelectorAll('[data-layer="placements"] [data-sky="B"][data-placement]')]
      .filter(node=>!node.hidden&&Number.isFinite(Number(node.dataset.exactLongitude)))
      .map(node=>({id:node.dataset.placement,value:Number(node.dataset.exactLongitude)}));
    const allowed=new Set(blue.map(record=>record.id));
    const redHosts=[...wheel.querySelectorAll('[data-layer="placements"] [data-sky="A"][data-placement]')];
    redHosts.forEach(host=>{host.hidden=!allowed.has(host.dataset.placement)});
    const redLeaders=[...wheel.querySelectorAll('[data-layer="leaders"] [data-sky="A"][data-placement]')];
    redLeaders.forEach(leader=>{leader.hidden=!allowed.has(leader.dataset.placement)});
    for(const record of spread(blue,'A')){
      const host=wheel.querySelector(`[data-layer="placements"] [data-sky="A"][data-placement="${CSS.escape(record.id)}"]`),leader=wheel.querySelector(`[data-layer="leaders"] [data-sky="A"][data-placement="${CSS.escape(record.id)}"]`);if(!host)continue;
      const display=polar(record.lane,record.display),exact=polar(EXACT.A,record.value);host.hidden=false;host.setAttribute('transform',`translate(${display.x} ${display.y})`);host.dataset.placementLane=String(record.lane);host.dataset.displayLongitude=record.display.toFixed(8);host.dataset.exactLongitude=record.value.toFixed(8);
      if(leader){leader.hidden=false;leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);leader.dataset.exactLongitude=record.value.toFixed(8)}
    }
  }

  function updateLabel(slot){
    const label=document.querySelector('[data-progression-ring-label]');if(!label)return;
    const reference=document.querySelector('[data-progression-reference]')?.value==='other'?'Other sky':`Natal Sky ${slot}`;
    label.textContent=slot==='A'?`Sky A (red): progressed · Sky B (blue): fixed · Inter reference: ${reference}`:`Sky A (red): fixed · Sky B (blue): progressed · Inter reference: ${reference}`;
  }

  function enforce(){
    queued=false;if(applying)return;
    const wheel=progressionWheel(),source=comparisonWheel();if(!wheel||!source)return;
    applying=true;
    try{
      const slot=sourceSlot();
      if(slot==='A'){
        moveProgressedAFromBlueLane(wheel);
        restoreSlot('B',wheel,source);
      }else{
        restoreSlot('A',wheel,source);
      }
      wheel.dataset.progressionRingIntegrity='sky-identity';
      wheel.setAttribute('aria-label','Progressions comparison wheel. Sky A remains red on the outer ring; Sky B remains blue on the inner ring.');
      updateLabel(slot);
    }finally{applying=false}
  }
  function schedule(){if(queued||applying)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(enforce))}
  function observe(){
    const wheel=progressionWheel();if(!wheel||wheel===observedWheel)return;
    observer?.disconnect();observedWheel=wheel;observer=new MutationObserver(schedule);observer.observe(wheel,{subtree:true,childList:true,attributes:true,attributeFilter:['transform','hidden','x1','y1','x2','y2','data-exact-longitude','data-display-longitude']});schedule();
  }

  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]'))schedule()});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-source], [data-progression-reference]'))schedule()});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-play], [data-progression-now]'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',()=>{observe();schedule()});
  setInterval(()=>{observe();if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true')schedule()},500);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{observe();schedule()},{once:true}):(()=>{observe();schedule()})();
})();
