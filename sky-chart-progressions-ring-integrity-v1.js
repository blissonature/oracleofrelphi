// Progressions ring geometry: Sky A/red occupies the more central placement ring;
// Sky B/blue occupies the farther-out placement ring. The two bubble systems never share a lane.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const C={x:600,y:600};
  // Deliberately opposite the foundation's internal A/B lane names: this is the
  // visual ownership requested for Progressions — red central, blue outer.
  const LANES={A:[287,299,283],B:[450,440,460]};
  const EXACT={A:323,B:414};
  const BUBBLE_RADIUS=17.2;
  const CLEARANCE=6;
  let queued=false,applying=false,observer=null,observedWheel=null;

  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const sourceSlot=()=>document.querySelector('[data-progression-source]')?.value==='B'?'B':'A';

  function comparisonWheel(){return document.querySelector('#skyFoundationWheelMount .sky-foundation-wheel')}
  function progressionWheel(){return document.querySelector('[data-progression-shared-wheel]')}

  function ordinaryRecords(wheel,slot){
    if(!wheel)return[];
    return[...wheel.querySelectorAll(`[data-layer="placements"] [data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)]
      .filter(node=>!node.hidden&&Number.isFinite(Number(node.dataset.exactLongitude)))
      .map(node=>({id:node.dataset.placement,value:Number(node.dataset.exactLongitude)}));
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
            if(collision)continue;
            chosen={...record,lane,display};placed.push(point);break;
          }
          if(chosen)break;
        }
      }
      result.push(chosen||{...record,lane:lanes[0],display:record.value});
    }
    return result;
  }

  function placeSlot(wheel,slot,records){
    const allowed=new Set(records.map(record=>record.id));
    const hosts=[...wheel.querySelectorAll(`[data-layer="placements"] [data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)];
    const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] .sky-foundation-leader[data-sky="${slot}"][data-placement]`)];
    hosts.forEach(host=>{host.hidden=!allowed.has(host.dataset.placement)});
    leaders.forEach(leader=>{leader.hidden=!allowed.has(leader.dataset.placement)});

    for(const record of spread(records,slot)){
      const host=wheel.querySelector(`[data-layer="placements"] [data-sky="${slot}"][data-placement="${CSS.escape(record.id)}"]:not([data-angle-axis="true"])`);
      const leader=wheel.querySelector(`[data-layer="leaders"] .sky-foundation-leader[data-sky="${slot}"][data-placement="${CSS.escape(record.id)}"]`);
      if(!host)continue;
      const display=polar(record.lane,record.display),exact=polar(EXACT[slot],record.value);
      host.hidden=false;
      host.setAttribute('transform',`translate(${display.x} ${display.y})`);
      host.dataset.placementLane=String(record.lane);
      host.dataset.displayLongitude=record.display.toFixed(8);
      host.dataset.exactLongitude=record.value.toFixed(8);
      host.dataset.progressionVisualRing=slot==='A'?'central-red':'outer-blue';
      if(leader){
        leader.hidden=false;
        leader.setAttribute('x1',display.x);leader.setAttribute('y1',display.y);
        leader.setAttribute('x2',exact.x);leader.setAttribute('y2',exact.y);
        leader.dataset.exactLongitude=record.value.toFixed(8);
      }
    }
  }

  function updateLabel(slot){
    const label=document.querySelector('[data-progression-ring-label]');if(!label)return;
    label.textContent=slot==='A'
      ?'Sky A (red): progressed on central ring · Sky B (blue): fixed on outer ring'
      :'Sky A (red): fixed on central ring · Sky B (blue): progressed on outer ring';
  }

  function enforce(){
    queued=false;if(applying)return;
    const wheel=progressionWheel(),source=comparisonWheel();if(!wheel||!source)return;
    applying=true;
    try{
      const slot=sourceSlot();
      // The base progression renderer writes the progressed source positions into
      // its B placement set. Capture those longitudes first, then paint them onto
      // the color/ring that actually belongs to the selected sky.
      const progressed=ordinaryRecords(wheel,'B');
      const fixedA=ordinaryRecords(source,'A');
      const fixedB=ordinaryRecords(source,'B');

      if(slot==='A'){
        placeSlot(wheel,'A',progressed);
        placeSlot(wheel,'B',fixedB);
      }else{
        placeSlot(wheel,'A',fixedA);
        placeSlot(wheel,'B',progressed);
      }

      wheel.dataset.progressionRingIntegrity='red-central-blue-outer';
      wheel.setAttribute('aria-label','Progressions comparison wheel. Sky A red glyph bubbles occupy the central placement ring; Sky B blue glyph bubbles occupy the outer placement ring.');
      updateLabel(slot);
    }finally{applying=false}
  }

  function schedule(){if(queued||applying)return;queued=true;requestAnimationFrame(enforce)}
  function observe(){
    const wheel=progressionWheel();if(!wheel||wheel===observedWheel)return;
    observer?.disconnect();observedWheel=wheel;observer=new MutationObserver(schedule);
    observer.observe(wheel,{subtree:true,childList:true,attributes:true,attributeFilter:['transform','hidden','x1','y1','x2','y2','data-exact-longitude','data-display-longitude']});
    schedule();
  }

  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]'))schedule()});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-source], [data-progression-reference]'))schedule()});
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-play], [data-progression-now]'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',()=>{observe();schedule()});
  setInterval(()=>{observe();if(document.getElementById('skyFoundationComparison')?.dataset.progressionsActive==='true')schedule()},350);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>{observe();schedule()},{once:true}):(()=>{observe();schedule()})();
})();
