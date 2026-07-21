// Branch preview: glyph-first Sky Chart lollipops aligned with Planetary Hours.
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
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:1.2!important;stroke-linecap:round!important;opacity:.84!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick{stroke-width:1.8!important;opacity:1!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:2.25!important;r:15px!important;filter:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick-knob{stroke-width:2.9!important;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.18))!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.has-preview-image .chart-wheel-marker-glyph{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick:not(.has-preview-image) .chart-wheel-marker-glyph{display:block!important;fill:var(--ph-marker)!important;font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","DejaVu Sans",sans-serif!important;font-size:15.5px!important;font-weight:900!important;text-anchor:middle!important;dominant-baseline:central!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.has-preview-angle-text .chart-wheel-marker-glyph{display:block!important;fill:var(--ph-marker)!important;font-family:system-ui,sans-serif!important;font-size:9.5px!important;font-weight:900!important;letter-spacing:-.45px!important;text-anchor:middle!important;dominant-baseline:central!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick image.relphi-bubble-glyph-image{pointer-events:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick svg.relphi-colored-glyph{pointer-events:none!important;overflow:visible}',
    '.unified-sky-wheel .is-preview-aspect-active{opacity:1!important;stroke-width:2.5!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))}',
    '@media(max-width:600px){.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{r:15.5px!important}}'
  ].join('');
  document.head.appendChild(style);
})();
