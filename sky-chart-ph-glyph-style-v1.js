// Aligns Sky Chart comparison lollipops with the Planetary Hours zodiac wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  document.getElementById('relphiPhGlyphStyle')?.remove();
  const style = document.createElement('style');
  style.id = 'relphiPhGlyphStyle';
  style.textContent = [
    '.unified-sky-wheel .chart-wheel-placement-stick{--ph-marker:#dc1f18;outline:none}',
    '.unified-sky-wheel .chart-wheel-placement-stick.sky-b{--ph-marker:#3166e2}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-center-ray{stroke:#222!important;stroke-width:.55!important;opacity:.13!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:1.1!important;stroke-linecap:round!important;opacity:.82!important;transition:stroke-width .14s ease,opacity .14s ease}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-active .chart-wheel-stick,.unified-sky-wheel .chart-wheel-placement-stick.is-hovered .chart-wheel-stick{stroke-width:1.65!important;opacity:1!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:2!important;r:12.25px!important;filter:none!important;transition:stroke-width .14s ease,filter .14s ease}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-active .chart-wheel-stick-knob,.unified-sky-wheel .chart-wheel-placement-stick.is-hovered .chart-wheel-stick-knob{stroke-width:2.6!important;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.2))!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-glyph{fill:#111!important;font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",sans-serif!important;font-size:15px!important;font-weight:900!important;text-anchor:middle!important;dominant-baseline:middle!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .relphi-wheel-glyph-image{pointer-events:none}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name{fill:#24211f!important;font-family:inherit!important;font-size:11px!important;font-weight:800!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transition:opacity .14s ease}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-active .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick.is-active .chart-wheel-marker-name,.unified-sky-wheel .chart-wheel-placement-stick.is-hovered .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick.is-hovered .chart-wheel-marker-name,.unified-sky-wheel .chart-wheel-placement-stick:focus .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick:focus .chart-wheel-marker-name{opacity:1!important;visibility:visible!important}',
    '.unified-sky-wheel .relphi-aspect-is-active{opacity:1!important;stroke-width:2.4!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))}',
    '@media(max-width:600px){.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{r:12.75px!important}.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name{font-size:11.5px!important}}'
  ].join('');
  document.head.appendChild(style);
})();
