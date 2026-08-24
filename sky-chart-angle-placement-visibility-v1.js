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
  const ANGLE_SELECTOR = [
    '#skyFoundationA .sky-foundation-row[data-placement="asc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="dsc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="mc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="ic"]',
    '#skyFoundationB .sky-foundation-row[data-placement="asc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="dsc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="mc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="ic"]',
    '[data-layer="placements"] [data-angle-axis="true"]',
    '[data-layer="leaders"] [data-angle]'
  ].join(',');
  let queued = false;
  let hoverFilterActive = false;

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

  function relevantMutation(record) {
    if (record.type === 'attributes') return record.target?.matches?.(ANGLE_SELECTOR);
    return [...record.addedNodes,...record.removedNodes].some(node => {
      if (!(node instanceof Element)) return false;
      return node.matches(ANGLE_SELECTOR) || !!node.querySelector?.(ANGLE_SELECTOR);
    });
  }

  function isHoverFilterEvent(event) {
    const state = event.detail?.state || null;
    const hover = state?.mode === 'hover' || (!state && hoverFilterActive);
    hoverFilterActive = state?.mode === 'hover';
    return hover;
  }

  function start() {
    ['relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-filter-wheel-focus-changed','relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-single-sky-aspects-rendered'].forEach(name => window.addEventListener(name, schedule));
    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      if (!isHoverFilterEvent(event)) schedule();
    });
    new MutationObserver(records => {
      if (records.some(relevantMutation)) schedule();
    }).observe(
      document.getElementById('skyFoundationRoot') || document.documentElement,
      { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] }
    );
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
