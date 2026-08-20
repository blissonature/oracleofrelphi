// Progressions visual integrity: Sky A/red is fixed natal; blue is only the progressed planetary copy.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const BODIES=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']);
  const DERIVED=new Set(['asc','ascendant','dsc','descendant','mc','midheaven','ic','imum-coeli','imumcoeli','part-of-fortune','fortune','pof']);
  const canonical=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  function progressionWheel(){return document.querySelector('[data-progression-shared-wheel="true"]')}
  function suppress(node){node.hidden=true;node.style.setProperty('display','none','important');node.setAttribute('aria-hidden','true')}
  function reveal(node){node.hidden=false;node.style.removeProperty('display');node.removeAttribute('aria-hidden')}

  function enforce(){
    const wheel=progressionWheel();if(!wheel)return;

    // Angles and Fortune are intentionally absent until a progression method is chosen for them.
    wheel.querySelectorAll('[data-placement]').forEach(node=>{
      const id=canonical(node.dataset.placement);
      if(DERIVED.has(id)||node.dataset.angleAxis==='true'){suppress(node);return}
      // The blue lane is not the loaded Sky B. It contains only the progressed planetary copy of Sky A.
      if(node.dataset.sky==='B'&&!BODIES.has(id)){suppress(node);return}
      if(node.dataset.sky==='B'&&BODIES.has(id))reveal(node);
    });
    wheel.querySelectorAll('.sky-foundation-angle-axis').forEach(suppress);

    // Any leader whose endpoint is absent is visually absent too.
    wheel.querySelectorAll('[data-layer="leaders"] [data-sky="B"][data-placement]').forEach(leader=>{
      const id=canonical(leader.dataset.placement);if(!BODIES.has(id))suppress(leader);
    });

    wheel.dataset.progressionRingIntegrity='red-natal-fixed-blue-progressed-planets-only';
    wheel.setAttribute('aria-label','Progressions wheel. Sky A red placements are fixed natal positions; blue planetary placements are the continuously animated secondary-progressed copy of Sky A.');
    const label=document.querySelector('[data-progression-ring-label]');if(label)label.textContent='Red: Sky A natal (fixed) · Blue: secondary progressed Sky A';
  }
  function schedule(){if(document.documentElement.hasAttribute('data-progression-live-playing'))return;requestAnimationFrame(enforce)}
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-now]'))schedule()});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',schedule);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
