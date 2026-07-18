// Makes the twelve zodiac sign boundaries readable as six full wheel diameters.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function point(longitude, radius, cx, cy) {
    const angle = (longitude + 180) * Math.PI / 180;
    return { x:cx + Math.cos(angle) * radius, y:cy + Math.sin(angle) * radius };
  }

  function enhanceWheel(svg) {
    if (!svg || svg.querySelector('.relphi-sign-cusp-diameters')) return;
    const core = svg.querySelector('.chart-wheel-core');
    if (!core) return;
    const cx = Number(core.getAttribute('cx'));
    const cy = Number(core.getAttribute('cy'));
    const radius = Number(core.getAttribute('r'));
    if (![cx, cy, radius].every(Number.isFinite)) return;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'relphi-sign-cusp-diameters');
    group.setAttribute('aria-label', 'Zodiac sign boundaries');

    for (let index = 0; index < 6; index += 1) {
      const start = point(index * 30, radius, cx, cy);
      const end = point(index * 30 + 180, radius, cx, cy);
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', start.x.toFixed(1));
      line.setAttribute('y1', start.y.toFixed(1));
      line.setAttribute('x2', end.x.toFixed(1));
      line.setAttribute('y2', end.y.toFixed(1));
      line.setAttribute('data-sign-axis', String(index));
      group.appendChild(line);
    }

    for (let index = 0; index < 12; index += 1) {
      const edge = point(index * 30, radius, cx, cy);
      const marker = document.createElementNS(SVG_NS, 'circle');
      marker.setAttribute('cx', edge.x.toFixed(1));
      marker.setAttribute('cy', edge.y.toFixed(1));
      marker.setAttribute('r', '2.4');
      marker.setAttribute('class', 'relphi-sign-cusp-marker');
      group.appendChild(marker);
    }

    const houseLayer = svg.querySelector('.chart-wheel-house-layer');
    svg.insertBefore(group, houseLayer || svg.firstChild);
  }

  function enhanceAll() {
    document.querySelectorAll('.unified-sky-wheel .chart-wheel-plot').forEach(enhanceWheel);
  }

  const style = document.createElement('style');
  style.id = 'relphiSignCuspStyles';
  style.textContent = [
    '.unified-sky-wheel .relphi-sign-cusp-diameters{pointer-events:none}',
    '.unified-sky-wheel .relphi-sign-cusp-diameters line{stroke:#514c47;stroke-width:1.15;stroke-opacity:.32;vector-effect:non-scaling-stroke}',
    '.unified-sky-wheel .relphi-sign-cusp-diameters line[data-sign-axis="0"]{stroke:#8f1713;stroke-width:1.45;stroke-opacity:.48}',
    '.unified-sky-wheel .relphi-sign-cusp-marker{fill:#fffdfa;stroke:#514c47;stroke-width:1.35;vector-effect:non-scaling-stroke}',
    '.unified-sky-wheel .relphi-sign-cusp-marker:first-of-type{stroke:#8f1713}'
  ].join('');
  if (!document.getElementById(style.id)) document.head.appendChild(style);

  const start = function () {
    enhanceAll();
    const output = document.getElementById('chartOutput');
    if (!output) return;
    new MutationObserver(enhanceAll).observe(output, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
