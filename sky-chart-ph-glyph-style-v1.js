// Aligns Sky Chart comparison lollipops with the Planetary Hours zodiac wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  document.getElementById('relphiPhGlyphStyle')?.remove();
  const style = document.createElement('style');
  style.id = 'relphiPhGlyphStyle';
  style.textContent = [
    '.unified-sky-wheel .chart-wheel-placement-stick{--ph-marker:#dc1f18}',
    '.unified-sky-wheel .chart-wheel-placement-stick.sky-b{--ph-marker:#3166e2}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-center-ray{stroke:#222!important;stroke-width:.55!important;opacity:.13!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:1.05!important;stroke-linecap:round!important;opacity:.78!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-clustered .chart-wheel-stick{stroke-width:1.15!important;opacity:.9!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:1.75!important;r:11.5px!important;filter:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-glyph{fill:#111!important;font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",sans-serif!important;font-size:14px!important;font-weight:900!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree{fill:#34312f!important;font-family:inherit!important;font-size:10.5px!important;font-weight:800!important;opacity:.94!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name{fill:#34312f!important;font-family:inherit!important;font-size:10.5px!important;font-weight:750!important;opacity:.94!important}',
    '@media(max-width:600px){.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name{font-size:11.25px!important}.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-glyph{font-size:14.5px!important}}'
  ].join('');
  document.head.appendChild(style);
})();
