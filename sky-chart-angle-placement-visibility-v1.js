// Chart angles are structural chart objects. Relationship filters may control
// their participation in relationship results, but must never hide them from the
// Sky Card Placements tab or from the wheel itself.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAnglePlacementVisibilityV3) return;
  window.__relphiSkyAnglePlacementVisibilityV1 = true;
  window.__relphiSkyAnglePlacementVisibilityV2 = true;
  window.__relphiSkyAnglePlacementVisibilityV3 = true;

  const ANGLES = ['asc','dsc','mc','ic'];
  let queued = false;

  function apply() {
    queued = false;
    ['A','B'].forEach(slot => {
      ANGLES.forEach(id => {
        document.querySelectorAll(
          `#skyFoundation${slot} .sky-foundation-row[data-placement="${id}"],` +
          `[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"],` +
          `[data-layer="leaders"] [data-sky="${slot}"][data-angle="${id}"]`
        ).forEach(node => {
          node.classList.remove('sky-chart-angle-placement-hidden');
          node.removeAttribute('hidden');
          node.dataset.chartAngleVisibility = 'structural-always-visible';
        });
      });
    });
    document.documentElement.dataset.skyAnglePlacementVisibility = 'structural-always-visible';
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function start() {
    window.addEventListener('relphi:sky-placement-multiselect-changed', schedule);
    window.addEventListener('relphi:sky-foundation-ready', schedule);
    window.addEventListener('relphi:sky-foundation-interactions-ready', schedule);
    window.addEventListener('relphi:sky-single-sky-aspects-rendered', schedule);
    new MutationObserver(schedule).observe(
      document.getElementById('skyFoundationRoot') || document.documentElement,
      { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class'] }
    );
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
