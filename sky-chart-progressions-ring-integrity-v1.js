// Progressions visual integrity: Sky A/red is fixed natal; blue is the progressed copy.
// This guard never changes planetary longitude or radial position.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsRingIntegrityV1)return;
  window.__relphiSkyProgressionsRingIntegrityV1=true;

  const DERIVED=new Set(['asc','ascendant','dsc','descendant','mc','midheaven','ic','imum-coeli','imumcoeli','part-of-fortune','fortune','pof']);
  const canonical=value=>String(value||'').trim().toLowerCase().replace(/[_\s]+/g,'-');
  function progressionWheel(){return document.querySelector('[data-progression-shared-wheel="true"]')}
  function suppressDerived(){
    const wheel=progressionWheel();if(!wheel)return;
    wheel.querySelectorAll('[data-placement]').forEach(node=>{if(DERIVED.has(canonical(node.dataset.placement))||node.dataset.angleAxis==='true')node.hidden=true});
    wheel.querySelectorAll('.sky-foundation-angle-axis').forEach(node=>{node.hidden=true});
    wheel.dataset.progressionRingIntegrity='red-natal-fixed-blue-progressed';
    wheel.setAttribute('aria-label','Progressions wheel. Sky A red placements are fixed natal positions; blue placements are the secondary-progressed copy of Sky A.');
    const label=document.querySelector('[data-progression-ring-label]');if(label&&!label.textContent.trim())label.textContent='Red: Sky A natal (fixed) · Blue: secondary progressed Sky A';
  }
  function schedule(){requestAnimationFrame(suppressDerived)}
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-sky-middle-tab="progressions"], [data-progression-now]'))schedule()});
  document.addEventListener('input',event=>{if(event.target.matches?.('[data-progression-scrubber]')&&!document.documentElement.hasAttribute('data-progression-live-playing'))schedule()});
  window.addEventListener('relphi:sky-foundation-ready',schedule);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
