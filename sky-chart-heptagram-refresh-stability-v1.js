// Coalesce the two foundation-ready callbacks that rebuild the same Sky-card heptagram.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramRefreshStabilityV1) return;
  window.__relphiSkyHeptagramRefreshStabilityV1 = true;

  const nativeAdd = window.addEventListener;
  let refreshCards = null;
  let frame = 0;
  let lastSignature = '';
  let lastRun = -Infinity;

  function signature() {
    return [
      localStorage.getItem('relphiSkyChartA') || '',
      localStorage.getItem('relphiSkyChartB') || '',
      sessionStorage.getItem('relphiSkyWhereWhenViewV1') || ''
    ].join('\u241f');
  }

  function cardShellMissing() {
    return ['A', 'B'].some(slot => {
      const body = document.querySelector(`#skyFoundation${slot} .sky-foundation-body`);
      return !!body && (!body.querySelector('.sky-where-when-placement-view') || !body.querySelector('.sky-where-when-view'));
    });
  }

  function scheduleRefresh() {
    if (!refreshCards || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const next = signature();
      const now = performance.now();
      if (next === lastSignature && now - lastRun < 450 && !cardShellMissing()) return;
      lastSignature = next;
      lastRun = now;
      refreshCards();
    });
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
