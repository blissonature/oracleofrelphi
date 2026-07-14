(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function injectStyles() {
    if (document.getElementById('relphi-relationship-color-hints')) return;
    const style = document.createElement('style');
    style.id = 'relphi-relationship-color-hints';
    style.textContent = `
body.sky-chart-page .relationship-list-row,
body.sky-chart-page .chart-wheel-aspect-key > span { --relationship-aspect-color:#6b625d; }
body.sky-chart-page .relationship-list-row.aspect-conjunction,
body.sky-chart-page .chart-wheel-aspect-key .key-conjunction { --relationship-aspect-color:#111; }
body.sky-chart-page .relationship-list-row.aspect-opposition,
body.sky-chart-page .chart-wheel-aspect-key .key-opposition { --relationship-aspect-color:#7b1fa2; }
body.sky-chart-page .relationship-list-row.aspect-trine,
body.sky-chart-page .chart-wheel-aspect-key .key-trine { --relationship-aspect-color:#1e88e5; }
body.sky-chart-page .relationship-list-row.aspect-square,
body.sky-chart-page .relationship-list-row.aspect-semi-square,
body.sky-chart-page .relationship-list-row.aspect-semisquare,
body.sky-chart-page .relationship-list-row.aspect-octile,
body.sky-chart-page .relationship-list-row.aspect-sesquiquadrate,
body.sky-chart-page .relationship-list-row.aspect-tri-octile,
body.sky-chart-page .chart-wheel-aspect-key .key-square { --relationship-aspect-color:#dc1f18; }
body.sky-chart-page .relationship-list-row.aspect-sextile,
body.sky-chart-page .relationship-list-row.aspect-semi-sextile,
body.sky-chart-page .relationship-list-row.aspect-semisextile,
body.sky-chart-page .chart-wheel-aspect-key .key-sextile { --relationship-aspect-color:#2e7d32; }
body.sky-chart-page .relationship-list-row.aspect-quincunx,
body.sky-chart-page .relationship-list-row.aspect-inconjunct,
body.sky-chart-page .chart-wheel-aspect-key .key-quincunx { --relationship-aspect-color:#d97706; }
body.sky-chart-page .relationship-list-row.aspect-quintile,
body.sky-chart-page .relationship-list-row.aspect-biquintile,
body.sky-chart-page .relationship-list-row.aspect-decile,
body.sky-chart-page .relationship-list-row.aspect-tridecile { --relationship-aspect-color:#b7791f; }
body.sky-chart-page .relationship-list-row.aspect-novile,
body.sky-chart-page .relationship-list-row.aspect-binovile,
body.sky-chart-page .relationship-list-row.aspect-septile,
body.sky-chart-page .relationship-list-row.aspect-biseptile,
body.sky-chart-page .relationship-list-row.aspect-triseptile,
body.sky-chart-page .relationship-list-row.aspect-undecile { --relationship-aspect-color:#6d4c9f; }
body.sky-chart-page .relationship-line-sample {
  display:inline-block;
  flex:0 0 1.8rem;
  width:1.8rem;
  height:.42rem;
  overflow:visible;
  vertical-align:middle;
}
body.sky-chart-page .relationship-line-sample line {
  stroke:var(--relationship-aspect-color,#6b625d) !important;
  stroke-width:3 !important;
  stroke-linecap:round;
  opacity:.96;
  vector-effect:non-scaling-stroke;
}
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-conjunction { stroke-dasharray:3 3; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-opposition { stroke-dasharray:none; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-trine { stroke-dasharray:8 3; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-square,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semi-square,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semisquare,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-octile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-sesquiquadrate,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-tri-octile { stroke-dasharray:2 2; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-sextile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semi-sextile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semisextile { stroke-dasharray:6 2; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-quincunx,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-inconjunct { stroke-dasharray:8 3 2 3; }
body.sky-chart-page .relationship-list-row .relationship-line-sample { margin-right:.08rem; }
body.sky-chart-page .chart-wheel-aspect-key > span { color:#332d29 !important; display:inline-flex; align-items:center; gap:.3rem; }
body.sky-chart-page .chart-wheel-aspect-key .relationship-line-sample { flex-basis:1.45rem; width:1.45rem; }
`;
    document.head.appendChild(style);
  }

  function aspectClass(element, prefix) {
    const name = Array.from(element.classList || []).find(function (item) { return item.indexOf(prefix) === 0; });
    return name ? name.slice(prefix.length) : '';
  }

  function sample(aspect) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'relationship-line-sample');
    svg.setAttribute('viewBox', '0 0 32 6');
    svg.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-wheel-aspect-' + aspect);
    line.setAttribute('x1', '1');
    line.setAttribute('y1', '3');
    line.setAttribute('x2', '31');
    line.setAttribute('y2', '3');
    svg.appendChild(line);
    return svg;
  }

  function enhance() {
    injectStyles();
    document.querySelectorAll('.relationship-list-row').forEach(function (row) {
      const aspect = aspectClass(row, 'aspect-');
      const points = row.querySelector('.relationship-list-points');
      if (!aspect || !points || points.querySelector('.relationship-line-sample')) return;
      points.prepend(sample(aspect));
    });
    document.querySelectorAll('.chart-wheel-aspect-key > span').forEach(function (item) {
      const aspect = aspectClass(item, 'key-');
      if (!aspect || item.querySelector('.relationship-line-sample')) return;
      item.prepend(sample(aspect));
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; enhance(); });
  }

  function install() {
    enhance();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiRelationshipColorHints = { enhance:enhance };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
