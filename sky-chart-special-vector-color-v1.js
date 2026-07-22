// Preview: bind custom Pluto and Part of Fortune vectors to the exact host marker color.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  document.getElementById('relphiSpecialVectorColorStyle')?.remove();
  const style = document.createElement('style');
  style.id = 'relphiSpecialVectorColorStyle';
  style.textContent = [
    '.unified-sky-wheel .chart-wheel-placement-stick .relphi-pluto-vector,',
    '.unified-sky-wheel .chart-wheel-placement-stick .relphi-fortune-vector{',
    'color:var(--ph-marker)!important;',
    'stroke:var(--ph-marker)!important;',
    'fill:none!important',
    '}',
    '.unified-sky-wheel .chart-wheel-placement-stick .relphi-pluto-vector path,',
    '.unified-sky-wheel .chart-wheel-placement-stick .relphi-fortune-vector path{',
    'stroke:var(--ph-marker)!important;',
    'fill:none!important',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
