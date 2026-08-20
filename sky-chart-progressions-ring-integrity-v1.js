// Progressions visual integrity: Sky A/red is fixed natal; blue is the actual calendar sky.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const BODIES=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
  const DERIVED=new Set(['asc','ascendant','dsc','descendant','mc','midheaven','ic','imum-coeli','imumcoeli','part-of-fortune','fortune','pof']);
  const canonical=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  const progressionWheel=()=>document.querySelector('[data-progression-shared-wheel="true"]');
  const panel=()=>document.getElementById('skyProgressionsPanel');
  const suppress=node=>{if(!node)return;node.hidden=true;node.style.setProperty('display','none','important');node.setAttribute('aria-hidden','true')};
  const reveal=node=>{if(!node)return;node.hidden=false;node.style.removeProperty('display');node.removeAttribute('aria-hidden')};
  const setText=(node,text)=>{if(node&&node.textContent!==text)node.textContent=text};

  function relabel(){
    const root=panel();if(!root)return;
    const methods=root.querySelectorAll('.sky-progressions-method');
    setText(methods[0],'Sky A natal fixed · blue sky moves through time');
    setText(methods[1],'Calendar sky · actual planetary motion');
    setText(root.querySelector('[data-progression-ring-label]'),'Red: Sky A natal (fixed) · Blue: actual sky at selected date');
    setText(root.querySelector('.sky-progression-rule'),'Red placements are the fixed natal Sky A. Blue placements are the actual planetary sky at the selected calendar date. Ingress/egress conditions and aspect windows follow that moving sky.');

    const age=root.querySelector('[data-progression-age-label]');
    if(age){const next=age.textContent.replace('Secondary progression','Calendar sky').replace('after epoch','after natal');setText(age,next)}
    root.querySelectorAll('.sky-progression-annotation strong').forEach(node=>{
      const next=node.textContent.replace(/^Progressed /,'Moving ').replace(/ progressed /g,' moving ');setText(node,next);
    });

    const wheel=progressionWheel();if(wheel){
      wheel.dataset.progressionRingIntegrity='red-natal-fixed-blue-calendar-planets-only';
      wheel.setAttribute('aria-label','Progressions wheel. Sky A red placements are fixed natal positions; blue planetary placements show the actual sky at the selected calendar date.');
    }
  }

  function enforce(){
    relabel();
    if(document.documentElement.hasAttribute('data-progression-live-playing'))return;
    const wheel=progressionWheel();if(!wheel)return;
    wheel.querySelectorAll('[data-placement]').forEach(node=>{
      const id=canonical(node.dataset.placement);
      if(DERIVED.has(id)||node.dataset.angleAxis==='true'){suppress(node);return}
      if(node.dataset.sky==='B'&&!BODIES.has(id)){suppress(node);return}
      if(node.dataset.sky==='B'&&BODIES.has(id))reveal(node);
    });
    wheel.querySelectorAll('.sky-foundation-angle-axis').forEach(suppress);
    wheel.querySelectorAll('[data-layer="leaders"] [data-sky="B"][data-placement]').forEach(leader=>{if(!BODIES.has(canonical(leader.dataset.placement)))suppress(leader)});
  }
  function schedule(){requestAnimationFrame(()=>requestAnimationFrame(enforce))}

  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-now], [data-progression-filter], [data-progression-play]'))schedule()});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]'))schedule()});
  document.addEventListener('change',event=>{if(event.target.matches?.('[data-progression-range-start], [data-progression-range-end], [data-progression-speed]'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',schedule);
  window.addEventListener('relphi:sky-orb-limit-changed',schedule);

  function start(){
    schedule();
    const root=panel();if(!root)return;
    const observer=new MutationObserver(()=>{
      const age=root.querySelector('[data-progression-age-label]');
      if(age?.textContent.includes('Secondary progression'))setText(age,age.textContent.replace('Secondary progression','Calendar sky').replace('after epoch','after natal'));
      root.querySelectorAll('.sky-progression-annotation strong').forEach(node=>{
        if(/^Progressed /.test(node.textContent)||/ progressed /.test(node.textContent))setText(node,node.textContent.replace(/^Progressed /,'Moving ').replace(/ progressed /g,' moving '));
      });
    });
    const age=root.querySelector('[data-progression-age-label]'),annotations=root.querySelector('[data-progression-annotations]');
    if(age)observer.observe(age,{subtree:true,childList:true,characterData:true});
    if(annotations)observer.observe(annotations,{subtree:true,childList:true,characterData:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
