// Keep angle bubbles, leaders, and ledger rows synchronized with the Placements checklist.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAnglePlacementVisibilityV1) return;
  window.__relphiSkyAnglePlacementVisibilityV1 = true;

  const ANGLES = ['asc','dsc','mc','ic'];
  let selected = { A:new Set(ANGLES), B:new Set(ANGLES) };
  let queued = false;

  function apply() {
    queued = false;
    ['A','B'].forEach(slot => {
      ANGLES.forEach(id => {
        const hidden = !selected[slot].has(id);
        document.querySelectorAll(
          `#skyFoundation${slot} .sky-foundation-row[data-placement="${id}"],` +
          `[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"],` +
          `[data-layer="leaders"] [data-sky="${slot}"][data-placement="${id}"]`
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
    window.addEventListener('relphi:sky-placement-multiselect-changed', event => {
      selected = {
        A:new Set((event.detail?.A || []).filter(id => ANGLES.includes(id))),
        B:new Set((event.detail?.B || []).filter(id => ANGLES.includes(id)))
      };
      schedule();
    });
    window.addEventListener('relphi:sky-foundation-ready', schedule);
    window.addEventListener('relphi:sky-foundation-interactions-ready', schedule);
    new MutationObserver(schedule).observe(document.getElementById('skyFoundationRoot') || document.documentElement, { childList:true, subtree:true });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
