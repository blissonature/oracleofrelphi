(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  // A 12-step pitch-class palette that also follows the color wheel.
  // Semitones advance by one hue step; 180° lands on the complementary hue.
  const TONIC_COLORS = [
    '#d7263d', // C / root · red
    '#e85d04', // C sharp / D flat · red-orange
    '#f59e0b', // D · orange
    '#d4a017', // D sharp / E flat · yellow
    '#84cc16', // E · yellow-green
    '#16a34a', // F · green
    '#0d9488', // F sharp / G flat · teal, complement of the root
    '#2563eb', // G · blue
    '#4f46e5', // G sharp / A flat · indigo
    '#7c3aed', // A · violet
    '#c026d3', // A sharp / B flat · magenta
    '#db2777'  // B · rose
  ];

  const ASPECTS = [
    { key:'conjunction', degrees:0, aliases:['conjunction'] },
    { key:'semisextile', degrees:30, aliases:['semi-sextile', 'semisextile'] },
    { key:'undecile', degrees:360 / 11, aliases:['undecile'] },
    { key:'decile', degrees:36, aliases:['decile'] },
    { key:'novile', degrees:40, aliases:['novile'] },
    { key:'semisquare', degrees:45, aliases:['semi-square', 'semisquare', 'octile'] },
    { key:'septile', degrees:360 / 7, aliases:['septile'] },
    { key:'sextile', degrees:60, aliases:['sextile'] },
    { key:'quintile', degrees:72, aliases:['quintile'] },
    { key:'binovile', degrees:80, aliases:['binovile'] },
    { key:'square', degrees:90, aliases:['square'] },
    { key:'biseptile', degrees:720 / 7, aliases:['biseptile'] },
    { key:'tridecile', degrees:108, aliases:['tridecile'] },
    { key:'trine', degrees:120, aliases:['trine'] },
    { key:'sesquiquadrate', degrees:135, aliases:['sesquiquadrate', 'sesquisquare', 'tri-octile'] },
    { key:'biquintile', degrees:144, aliases:['biquintile'] },
    { key:'quincunx', degrees:150, aliases:['quincunx', 'inconjunct'] },
    { key:'triseptile', degrees:1080 / 7, aliases:['triseptile'] },
    { key:'opposition', degrees:180, aliases:['opposition'] }
  ];

  function hexToRgb(hex) {
    const value = String(hex || '').replace('#', '');
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  function toHex(value) {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  }

  function mixHex(a, b, amount) {
    const first = hexToRgb(a);
    const second = hexToRgb(b);
    const t = Math.max(0, Math.min(1, Number(amount) || 0));
    return '#' +
      toHex(first.r + (second.r - first.r) * t) +
      toHex(first.g + (second.g - first.g) * t) +
      toHex(first.b + (second.b - first.b) * t);
  }

  function colorForDegrees(degrees) {
    const chromaticStep = Math.max(0, Number(degrees) || 0) / 30;
    const lower = Math.floor(chromaticStep);
    const fraction = chromaticStep - lower;
    const first = TONIC_COLORS[lower % TONIC_COLORS.length];
    const second = TONIC_COLORS[(lower + 1) % TONIC_COLORS.length];
    return fraction < 0.0001 ? first : mixHex(first, second, fraction);
  }

  const ASPECT_COLORS = ASPECTS.reduce(function (result, aspect) {
    result[aspect.key] = colorForDegrees(aspect.degrees);
    aspect.aliases.forEach(function (alias) { result[alias] = result[aspect.key]; });
    return result;
  }, {});

  function classSelectors(prefix, aliases) {
    return aliases.map(function (alias) { return prefix + alias; }).join(',\n');
  }

  function aspectCss(aspect) {
    const color = ASPECT_COLORS[aspect.key];
    const relationshipSelectors = aspect.aliases.reduce(function (selectors, alias) {
      selectors.push('body.sky-chart-page .relationship-list-row.aspect-' + alias);
      selectors.push('body.sky-chart-page .chart-wheel-aspect-key .key-' + alias);
      return selectors;
    }, []).join(',\n');
    const wheelSelectors = classSelectors('body.sky-chart-page .chart-wheel-aspect-', aspect.aliases);
    const centerSelectors = aspect.aliases.map(function (alias) {
      return 'body.sky-chart-page .chart-wheel-aspect-center.chart-wheel-aspect-' + alias;
    }).join(',\n');

    return relationshipSelectors + ' { --relationship-aspect-color:' + color + '; }\n' +
      wheelSelectors + ' { stroke:' + color + ' !important; }\n' +
      centerSelectors + ' { fill:' + color + ' !important; }';
  }

  function injectStyles() {
    if (document.getElementById('relphi-relationship-color-hints')) return;
    const style = document.createElement('style');
    style.id = 'relphi-relationship-color-hints';

    const customProperties = ASPECTS.map(function (aspect) {
      return '--aspect-' + aspect.key + ':' + ASPECT_COLORS[aspect.key] + ';';
    }).join('');

    style.textContent = `
body.sky-chart-page {
  ${customProperties}
}
body.sky-chart-page .relationship-list-row,
body.sky-chart-page .chart-wheel-aspect-key > span { --relationship-aspect-color:#6b625d; }
${ASPECTS.map(aspectCss).join('\n')}

/* The row's existing vertical edge is the aspect-color cue. */
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

/* Selection remains a complete Relphi-red stroke, separate from aspect color. */
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

  window.RelphiHarmonicPalette = {
    tonicColors:TONIC_COLORS.slice(),
    aspectColors:Object.assign({}, ASPECT_COLORS),
    colorForDegrees:colorForDegrees
  };
  window.RelphiRelationshipColorHints = { enhance:enhance };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
