// Makes the completed comparison lollipop scene the sole visible owner of the wheel SVG.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEELS = '.unified-sky-wheel > svg,.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE = 'relphi-dual-house-rings';
  const OVERLAY = 'relphi-comparison-lollipop-v1';

  function isolate(svg) {
    const structure = Array.from(svg.querySelectorAll(':scope > .' + STRUCTURE + '[data-ready="true"]')).pop();
    const overlay = Array.from(svg.querySelectorAll(':scope > .' + OVERLAY + '[data-ready="true"]')).pop();
    if (!structure || !overlay) return false;

    const skyA = overlay.querySelectorAll('.relphi-comparison-candy[data-sky="skyA"]').length;
    const skyB = overlay.querySelectorAll('.relphi-comparison-candy[data-sky="skyB"]').length;
    if (!skyA || !skyB) return false;

    Array.from(svg.children).forEach(function (child) {
      const tag = child.tagName && child.tagName.toLowerCase();
      const keep = child === structure || child === overlay || tag === 'defs' || tag === 'title' || tag === 'desc';
      if (keep) {
        child.removeAttribute('data-relphi-legacy-hidden');
        if (child.dataset.relphiExclusivePreviousDisplay !== undefined) {
          child.style.display = child.dataset.relphiExclusivePreviousDisplay;
          delete child.dataset.relphiExclusivePreviousDisplay;
        }
        return;
      }
      if (child.dataset.relphiLegacyHidden !== 'true') {
        child.dataset.relphiExclusivePreviousDisplay = child.style.display || '';
        child.dataset.relphiLegacyHidden = 'true';
      }
      child.style.display = 'none';
    });

    svg.dataset.relphiExclusiveComparisonScene = 'true';
    return true;
  }

  function run() {
    document.querySelectorAll(WHEELS).forEach(isolate);
  }

  function start() {
    run();
    window.addEventListener('relphi:comparison-lollipop-ready', run);
    window.addEventListener('relphi:wheel-structure-ready', run);
    window.addEventListener('storage', run);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
