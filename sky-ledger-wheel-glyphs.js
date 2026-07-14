// Compatibility shim for the retired SVG-path wheel glyph renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SYMBOLS = new Set(['☉','☽','☿','♀','♂','♃','♄','♅','♆','♇','⯓']);

  function emergencyClean() {
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

  function loadKillSwitch() {
    if (document.querySelector('script[src^="sky-chart-glyph-kill-switch.js"]')) return;
    const script = document.createElement('script');
    script.src = 'sky-chart-glyph-kill-switch.js?v=2';
    document.body.appendChild(script);
  }

  emergencyClean();
  loadKillSwitch();
  window.RelphiWheelGlyphFallback = { clean: emergencyClean };
})();
