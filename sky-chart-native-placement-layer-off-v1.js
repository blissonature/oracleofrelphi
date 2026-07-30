// Suppress the original tiny placement layer after the full-size comparison overlay is ready.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEEL_SELECTOR = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const OVERLAY_SELECTOR = ':scope > .relphi-comparison-lollipop-v1[data-ready="true"]';
  const NATIVE_SELECTOR = '.chart-wheel-placement-stick,.chart-wheel-placement';
  let queued = false;
  let applying = false;

  function suppressWheel(svg) {
    if (!svg || !svg.querySelector(OVERLAY_SELECTOR)) return;

    const readyOverlays = Array.from(svg.querySelectorAll(OVERLAY_SELECTOR));
    readyOverlays.slice(0, -1).forEach(function (duplicate) { duplicate.remove(); });
    const overlay = readyOverlays[readyOverlays.length - 1];
    if (!overlay) return;

    svg.querySelectorAll(NATIVE_SELECTOR).forEach(function (placement) {
      if (placement.closest('.relphi-comparison-lollipop-v1,.relphi-dual-house-rings')) return;
      placement.style.setProperty('display', 'none', 'important');
      placement.style.setProperty('visibility', 'hidden', 'important');
      placement.style.setProperty('opacity', '0', 'important');
      placement.setAttribute('aria-hidden', 'true');
      placement.setAttribute('data-relphi-native-placement-suppressed', 'true');
    });

    overlay.style.setProperty('display', 'block', 'important');
    overlay.style.setProperty('visibility', 'visible', 'important');
    overlay.style.setProperty('opacity', '1', 'important');
    overlay.removeAttribute('aria-hidden');
    svg.dataset.relphiPlacementLayer = 'full-size-only';
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      document.querySelectorAll(WHEEL_SELECTOR).forEach(suppressWheel);
    } finally {
      applying = false;
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      apply();
    });
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    const svg = event.detail && event.detail.svg;
    if (svg) suppressWheel(svg);
    else queue();
  });
  window.addEventListener('relphi:wheel-structure-ready', queue);
  window.addEventListener('relphi:house-system-changed', queue);
  window.addEventListener('storage', queue);

  function start() {
    apply();
    new MutationObserver(function (records) {
      if (applying) return;
      const relevant = records.some(function (record) {
        const target = record.target && record.target.nodeType === 1 ? record.target : null;
        if (target && target.closest && target.closest(WHEEL_SELECTOR)) return true;
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === 1 &&
            (node.matches && node.matches(WHEEL_SELECTOR + ',' + NATIVE_SELECTOR + ',.relphi-comparison-lollipop-v1') ||
             node.querySelector && node.querySelector(WHEEL_SELECTOR + ',' + NATIVE_SELECTOR + ',.relphi-comparison-lollipop-v1'));
        });
      });
      if (relevant) queue();
    }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class','data-ready'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
