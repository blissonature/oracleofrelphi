// Coalesce the two foundation-ready callbacks that rebuild the same Sky-card heptagram.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramRefreshStabilityV2) return;
  window.__relphiSkyHeptagramRefreshStabilityV2 = true;

  const nativeAdd = window.addEventListener;
  let refreshCards = null;
  let frame = 0;
  let running = false;
  let queued = false;
  let lastSignature = '';

  function signature() {
    return [
      localStorage.getItem('relphiSkyChartA') || '',
      localStorage.getItem('relphiSkyChartB') || '',
      sessionStorage.getItem('relphiSkyWhereWhenViewV1') || ''
    ].join('\u241f');
  }

  function cardsSettled() {
    return ['A', 'B'].every(slot => {
      const body = document.querySelector(`#skyFoundation${slot} .sky-foundation-body`);
      const heptagram = body?.querySelector('.sky-ph-heptagram');
      const summary = body?.querySelector('.sky-ph-summary');
      return !!(
        body &&
        body.querySelector('.sky-where-when-placement-view') &&
        body.querySelector('.sky-where-when-view') &&
        heptagram &&
        summary &&
        !/calculating/i.test(summary.textContent || '') &&
        heptagram.dataset.canonicalHeptagramV2 !== 'pending'
      );
    });
  }

  function waitUntilSettled(started, done) {
    if (cardsSettled() || performance.now() - started > 10000) return done();
    setTimeout(() => waitUntilSettled(started, done), 40);
  }

  function finishRun() {
    running = false;
    if (!queued) return;
    queued = false;
    if (signature() !== lastSignature || !cardsSettled()) scheduleRefresh();
  }

  function runRefresh(next) {
    frame = 0;
    if (!refreshCards) return;
    if (next === lastSignature && cardsSettled()) return;
    if (running) {
      if (next !== lastSignature) queued = true;
      return;
    }
    running = true;
    lastSignature = next;
    refreshCards();
    waitUntilSettled(performance.now(), finishRun);
  }

  function scheduleRefresh() {
    if (!refreshCards) return;
    const next = signature();
    if (next === lastSignature && cardsSettled()) return;
    if (running) {
      if (next !== lastSignature) queued = true;
      return;
    }
    if (frame) return;
    frame = requestAnimationFrame(() => runRefresh(next));
  }

  window.addEventListener = function (type, listener, options) {
    const source = typeof listener === 'function' ? Function.prototype.toString.call(listener) : '';
    if (type === 'relphi:sky-foundation-interactions-ready' && listener?.name === 'refreshCards') {
      refreshCards = listener;
      return nativeAdd.call(window, type, scheduleRefresh, options);
    }
    if (type === 'relphi:sky-foundation-ready' && source.includes('requestAnimationFrame(refreshCards)')) {
      return nativeAdd.call(window, type, scheduleRefresh, options);
    }
    return nativeAdd.call(window, type, listener, options);
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener = nativeAdd;
  }, { once:true });
})();
