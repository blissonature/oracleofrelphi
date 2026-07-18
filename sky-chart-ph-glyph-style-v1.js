// Aligns SkyChart comparison markers with the Planetary Hours mini zodiac wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (document.getElementById('relphiPhGlyphStyle')) return;
  const style = document.createElement('style');
  style.id = 'relphiPhGlyphStyle';
  style.textContent = [
    '.unified-sky-wheel .chart-wheel-placement-stick{--ph-marker:#dc1f18}',
    '.unified-sky-wheel .chart-wheel-placement-stick.sky-b{--ph-marker:#3166e2}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-center-ray{stroke:#222!important;stroke-width:.55!important;opacity:.13!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:.9!important;opacity:.72!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-clustered .chart-wheel-stick{stroke-width:1.05!important;opacity:.88!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:1.45!important;r:7px!important;filter:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-glyph{fill:#111!important;font-family:"Segoe UI Symbol","Noto Sans Symbols",serif!important;font-size:10px!important;font-weight:900!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree{fill:#4f4b47!important;font-size:7.5px!important;font-weight:800!important;opacity:.78!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name{fill:#4f4b47!important;font-size:7.5px!important;font-weight:700!important;opacity:.72!important}'
  ].join('');
  document.head.appendChild(style);
})();
