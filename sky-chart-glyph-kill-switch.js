// Emergency containment for malformed Sky Chart SVG planet glyph paths.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SYMBOLS = new Set(['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','⯓']);
  let queued = false;

  function installStyle() {
    if (document.getElementById('relphi-wheel-glyph-kill-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-wheel-glyph-kill-style';
    style.textContent = '.relphi-wheel-planet-glyph{display:none!important}.chart-wheel-markers text{visibility:visible!important}';
    document.head.appendChild(style);
  }

  function clean() {
    installStyle();
    window.RelphiDisableWheelPathGlyphs = true;
    document.querySelectorAll('.relphi-wheel-planet-glyph').forEach(function (node) { node.remove(); });
    document.querySelectorAll('svg text').forEach(function (text) {
      if (!SYMBOLS.has((text.textContent || '').trim())) return;
      text.removeAttribute('visibility');
      text.style.setProperty('visibility', 'visible', 'important');
      text.dataset.relphiWheelGlyphAligned = 'true';
      text.dataset.relphiWheelGlyphPending = 'true';
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      clean();
    });
  }

  function start() {
    clean();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['visibility','class','transform'] });
  }

  window.RelphiSkyGlyphKillSwitch = { clean: clean };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
