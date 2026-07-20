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
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick{stroke:#222!important;stroke-width:1.15!important;stroke-linecap:round!important;opacity:.82!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick{stroke-width:1.75!important;opacity:1!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-contact-dot{fill:var(--ph-marker)!important;stroke:#fff!important;stroke-width:.7!important;r:1.8px}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{fill:#fff!important;stroke:var(--ph-marker)!important;stroke-width:2!important;r:12.5px!important;filter:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick-knob{stroke-width:2.7!important;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.18))!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-name,.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-degree{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-marker-glyph{display:none!important}',
    '.unified-sky-wheel .chart-wheel-placement-stick image.relphi-bubble-glyph-image{pointer-events:none!important}',
    '.unified-sky-wheel .is-preview-aspect-active{opacity:1!important;stroke-width:2.5!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.18))}',
    '@media(max-width:600px){.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{r:13px!important}}'
  ].join('');
  document.head.appendChild(style);
})();
