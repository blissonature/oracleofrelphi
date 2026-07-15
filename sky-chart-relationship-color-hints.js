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

/* The row's existing vertical edge is now the aspect cue. */
body.sky-chart-page .relationship-list-row {
  position:relative !important;
  overflow:hidden;
  border-left-color:inherit !important;
}
body.sky-chart-page .relationship-list-row::before {
  content:"";
  position:absolute;
  z-index:1;
  left:0;
  top:.38rem;
  bottom:.38rem;
  width:4px;
  border-radius:0 999px 999px 0;
  background:var(--relationship-aspect-color,#6b625d);
  pointer-events:none;
}
body.sky-chart-page .relationship-list-row .relationship-line-sample {
  display:none !important;
}

/* Selection is a complete Relphi-red stroke, separate from the aspect color. */
body.sky-chart-page .relationship-list-row.is-selected,
body.sky-chart-page .relationship-list-row[aria-pressed="true"] {
  border-color:#dc1f18 !important;
  box-shadow:inset 0 0 0 1px #dc1f18, 0 0 0 2px rgba(220,31,24,.12) !important;
  outline:none !important;
}
body.sky-chart-page .relationship-list-row:focus-visible {
  outline:2px solid rgba(220,31,24,.55) !important;
  outline-offset:2px;
}

/* The compact legend keeps line color plus pattern because it explains the wheel. */
body.sky-chart-page .chart-wheel-aspect-key > span {
  color:#332d29 !important;
  display:inline-flex;
  align-items:center;
  gap:.3rem;
}
body.sky-chart-page .chart-wheel-aspect-key .relationship-line-sample {
  display:inline-block;
  flex:0 0 1.45rem;
  width:1.45rem;
  height:.42rem;
  overflow:visible;
  vertical-align:middle;
}
body.sky-chart-page .chart-wheel-aspect-key .relationship-line-sample line {
  stroke:var(--relationship-aspect-color,#6b625d) !important;
  stroke-width:3 !important;
  stroke-linecap:round;
  opacity:.96;
  vector-effect:non-scaling-stroke;
}
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-conjunction { stroke-dasharray:3 3; }
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-opposition { stroke-dasharray:none; }
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-trine { stroke-dasharray:8 3; }
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-square { stroke-dasharray:2 2; }
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-sextile { stroke-dasharray:6 2; }
body.sky-chart-page .chart-wheel-aspect-key .chart-wheel-aspect-quincunx { stroke-dasharray:8 3 2 3; }
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
      row.querySelectorAll('.relationship-line-sample').forEach(function (node) { node.remove(); });
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
