// Reveals the Sky Chart quickly, then allows the final lollipop wheel to replace atomically.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let timer = 0;
  let started = Date.now();
  let revealed = false;

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
    const wheel = workspace.querySelector('.unified-sky-wheel > svg,.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg');
    if (!wheel) return false;
    const overlay = wheel.querySelector('.relphi-comparison-lollipop-v1[data-ready="true"]');
    return !!overlay && overlay.querySelectorAll('.relphi-comparison-candy').length > 1;
  }

  function reveal(finalReady) {
    if (revealed) return;
    revealed = true;
    window.RelphiSkyRenderGate?.reveal();
    document.body.classList.toggle('relphi-sky-render-fallback', !finalReady);
    if (finalReady) window.dispatchEvent(new Event('relphi:sky-final-render-ready'));
  }

  function check() {
    clearTimeout(timer);
    const workspace = document.getElementById('relphiSkyWorkspace');
    const finalReady = !!workspace && cardsReady(workspace) && wheelReady(workspace);
    if (finalReady) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { reveal(true); });
      });
      return;
    }
    if (Date.now() - started >= 1000) {
      reveal(false);
      return;
    }
    timer = setTimeout(check, 80);
  }

  function recheckWithoutHiding() {
    if (!revealed) return check();
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace && cardsReady(workspace) && wheelReady(workspace)) {
      document.body.classList.remove('relphi-sky-render-fallback');
      window.dispatchEvent(new Event('relphi:sky-final-render-ready'));
    }
  }

  window.addEventListener('storage', recheckWithoutHiding);
  window.addEventListener('relphi:extra-points-updated', recheckWithoutHiding);
  window.addEventListener('relphi:house-system-changed', recheckWithoutHiding);
  window.addEventListener('relphi:wheel-structure-ready', recheckWithoutHiding);
  window.addEventListener('relphi:comparison-lollipop-ready', recheckWithoutHiding);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check, {once:true});
  else check();
})();