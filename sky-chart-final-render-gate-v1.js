// Reveals the Sky Chart workspace only when the final cards and lollipop wheel are ready.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let timer = 0;
  let started = Date.now();

  function hasSkyB() {
    try { return !!JSON.parse(localStorage.getItem('relphiSkyChartB') || 'null'); }
    catch (_) { return false; }
  }

  function cardsReady(workspace) {
    const cards = Array.from(workspace.querySelectorAll('.relphi-workspace-sky'));
    const expected = hasSkyB() ? 2 : 1;
    if (cards.length < expected) return false;
    return cards.slice(0, expected).every(function (card) {
      const svg = card.querySelector('.relphi-skinny-solo svg');
      if (!svg) return false;
      const markers = svg.querySelectorAll('.relphi-inscribed-lollipop');
      return markers.length > 0 && !svg.querySelector('.relphi-approved-inscribed-unit:not([data-ready="true"])');
    });
  }

  function wheelReady(workspace) {
    if (!hasSkyB()) return true;
    const wheel = workspace.querySelector('.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg');
    if (!wheel) return false;
    const overlay = wheel.querySelector(':scope > .relphi-wheel-geometry-v2[data-ready="true"]');
    return !!overlay && overlay.querySelectorAll('.relphi-shared-placement-host').length > 1;
  }

  function check() {
    clearTimeout(timer);
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace && cardsReady(workspace) && wheelReady(workspace)) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.RelphiSkyRenderGate?.reveal();
          window.dispatchEvent(new Event('relphi:sky-final-render-ready'));
        });
      });
      return;
    }
    if (Date.now() - started > 15000) {
      // Keep a stable fallback rather than exposing intermediate redraws.
      const note = document.querySelector('#chartOutput::before');
      window.RelphiSkyRenderGate?.reveal();
      document.body.classList.add('relphi-sky-render-fallback');
      return;
    }
    timer = setTimeout(check, 100);
  }

  function prepareAndCheck() {
    started = Date.now();
    window.RelphiSkyRenderGate?.prepare();
    check();
  }

  window.addEventListener('storage', prepareAndCheck);
  window.addEventListener('relphi:extra-points-updated', prepareAndCheck);
  window.addEventListener('relphi:house-system-changed', prepareAndCheck);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check, {once:true});
  else check();
})();