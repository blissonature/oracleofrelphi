// Keep angle labels, axes, and ledger rows synchronized with explicit Placements choices.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAnglePlacementVisibilityV2) return;
  window.__relphiSkyAnglePlacementVisibilityV1 = true;
  window.__relphiSkyAnglePlacementVisibilityV2 = true;

  const ANGLES = ['asc','dsc','mc','ic'];
  let queued = false;

  function explicitChoice(slot, id) {
    return document.querySelector(
      `[data-placement-choice="${slot.toLowerCase()}"]` +
      `[data-placement-scope="placement"]` +
      `[data-placement-target="${id}"]`
    );
  }

  function apply() {
    queued = false;
    ['A','B'].forEach(slot => {
      ANGLES.forEach(id => {
        const choice = explicitChoice(slot, id);
        // Absence is not deselection. During initial construction, filter rows
        // may not exist yet; the canonical Angle must remain visible.
        const hidden = choice ? !choice.checked : false;
        document.querySelectorAll(
          `#skyFoundation${slot} .sky-foundation-row[data-placement="${id}"],` +
          `[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"],` +
          `[data-layer="leaders"] [data-sky="${slot}"][data-angle="${id}"]`
        ).forEach(node => node.classList.toggle('sky-chart-angle-placement-hidden', hidden));
      });
    });
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
    new MutationObserver(schedule).observe(
      document.getElementById('skyFoundationRoot') || document.documentElement,
      { childList:true, subtree:true, attributes:true, attributeFilter:['checked','class'] }
    );
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
