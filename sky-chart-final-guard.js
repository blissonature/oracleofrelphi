// Clears stale comparison state before a new Sky B workflow begins.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  window.addEventListener('click', function (event) {
    if (!event.target.closest?.('#relphiAddComparison, #relphiCompactAddComparison')) return;
    try { localStorage.removeItem('relphiCurrentSky'); } catch (_) {}
    try {
      sessionStorage.removeItem('relphiTwoSkyResumeV2');
      sessionStorage.removeItem('relphiFinalTwoSkyResumeV1');
    } catch (_) {}
    const status = byId('skyCalcStatus');
    if (status) status.textContent = '';
    const current = byId('currentSkyOutput');
    if (current) {
      current.hidden = true;
      current.setAttribute('hidden', '');
      current.dataset.skyName = '';
    }
    delete document.body.dataset.relphiSkyBReady;
  }, true);
})();