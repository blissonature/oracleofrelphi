// Branch-only preview renderer: build final markers synchronously before first paint.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const OUTWARD_DISTANCE = 58;
  const BUBBLE_RADIUS = 17.5;
  const MIN_CENTER_GAP = 43;
  const MAX_TANGENTIAL = 84;
  const GLYPH_SIZE = 26;
  const PATHS = {
    '☉':'M49.42,43.39 L46.31,44.56 L44.36,46.50 L43.58,51.17 L45.14,54.28 L46.69,55.44 L50.97,56.22 L53.69,55.06 L55.64,53.11 L56.42,48.83 L53.69,44.56 Z M46.69,15.00 L38.92,16.56 L33.47,18.89 L27.25,23.17 L23.36,27.06 L19.86,32.11 L16.36,40.67 L15.19,48.44 L15.58,55.44 L16.75,60.50 L19.86,67.50 L27.25,76.44 L32.31,79.94 L40.08,83.44 L45.92,84.61 L54.08,84.61 L62.25,82.67 L67.69,79.94 L71.58,77.22 L76.64,72.17 L82.47,62.06 L84.42,53.50 L84.42,46.50 L82.86,38.72 L80.53,33.28 L76.25,27.06 L72.36,23.17 L66.92,19.28 L59.53,16.17 L52.92,15.00 Z M45.14,19.28 L50.97,18.89 L58.36,20.06 L64.19,22.39 L68.86,25.50 L76.25,34.06 L79.36,41.44 L80.53,47.28 L80.53,52.33 L79.36,58.56 L74.31,68.67 L68.47,74.50 L61.08,78.78 L53.69,80.72 L42.42,79.94 L36.19,77.61 L30.36,73.72 L26.47,69.83 L22.97,64.78 L21.03,60.50 L19.47,54.28 L19.47,44.94 L21.81,37.17 L24.92,31.72 L33.08,23.94 L40.47,20.44 Z',
    '☽':'M29.11,14.75 L26.50,16.24 L26.50,17.73 L27.62,18.85 L33.59,21.09 L37.32,23.70 L41.42,27.80 L44.78,32.65 L48.51,42.73 L49.25,51.68 L46.64,62.87 L42.91,69.59 L35.82,76.67 L27.24,80.40 L26.50,81.15 L26.50,83.02 L29.48,84.51 L35.08,85.63 L41.79,85.63 L50.37,83.76 L55.22,81.52 L62.31,76.30 L67.53,69.96 L70.15,65.11 L73.13,54.29 L73.13,46.46 L71.64,38.99 L69.03,32.65 L65.67,27.43 L61.19,22.58 L55.60,18.48 L51.87,16.61 L44.03,14.37 L34.70,14.00 Z M36.20,17.73 L45.90,18.48 L53.73,21.83 L57.83,24.82 L61.56,28.55 L65.67,34.52 L68.65,42.35 L69.40,47.95 L69.40,52.80 L67.91,60.26 L63.06,69.59 L54.48,77.42 L47.02,80.78 L39.93,81.90 L35.82,81.15 L44.03,74.44 L48.88,67.35 L52.24,57.65 L52.98,48.32 L51.49,38.99 L48.13,30.79 L43.66,24.45 L36.20,18.48 Z',
    '☿':'M33.92,11.00 L32.44,12.48 L33.18,15.81 L35.40,19.13 L40.57,23.20 L37.99,24.68 L33.55,29.11 L30.96,33.92 L29.85,38.73 L30.59,46.86 L32.81,51.66 L37.99,57.21 L42.79,59.80 L48.34,61.27 L47.97,72.73 L37.99,73.10 L36.51,74.21 L36.51,76.06 L37.62,77.17 L47.60,77.17 L48.34,83.82 L47.97,87.15 L49.08,88.63 L50.92,88.63 L52.03,87.15 L52.03,77.54 L62.01,77.17 L63.49,76.06 L63.49,74.21 L61.64,73.10 L52.03,72.73 L52.03,61.27 L59.06,59.06 L62.01,57.21 L66.08,53.14 L69.41,46.12 L69.78,37.25 L68.67,33.55 L64.97,27.64 L59.06,23.20 L65.71,17.65 L67.56,12.85 L66.82,11.37 L64.97,11.00 L63.86,11.74 L62.75,15.07 L58.32,19.13 L53.51,20.98 L46.86,20.98 L39.83,18.02 L37.62,15.81 L36.14,12.11 Z M46.12,25.05 L51.66,24.68 L58.69,27.27 L63.86,32.44 L66.08,37.99 L66.08,43.90 L63.49,50.18 L59.06,54.62 L52.77,57.21 L47.23,57.21 L40.94,54.62 L36.88,50.92 L33.92,44.64 L33.55,39.46 L34.29,35.77 L35.77,32.81 L40.57,27.64 Z',
    '♀':'M47.91,12.00 L41.45,13.52 L36.89,15.80 L31.19,21.12 L27.39,28.34 L26.25,37.46 L27.77,44.30 L31.19,50.38 L38.41,56.46 L47.91,59.50 L47.91,71.28 L37.27,71.66 L36.13,72.42 L35.75,74.32 L37.27,75.84 L47.53,75.84 L47.91,86.48 L49.05,87.62 L50.57,87.62 L51.71,86.48 L52.09,75.84 L62.35,75.84 L63.87,74.70 L63.87,72.80 L62.35,71.66 L51.71,71.28 L51.71,59.50 L55.51,58.74 L61.97,56.08 L68.43,50.38 L72.61,42.02 L73.37,34.42 L71.09,25.30 L68.43,21.12 L63.87,16.56 L57.41,13.14 Z M47.91,15.80 L55.13,16.56 L61.21,19.60 L66.53,25.30 L68.43,29.10 L69.57,34.80 L68.81,40.88 L65.39,47.72 L60.07,52.66 L52.85,55.32 L44.87,54.94 L38.41,51.90 L35.37,49.24 L32.33,45.06 L30.05,37.46 L30.81,30.62 L34.23,23.78 L40.69,18.08 Z',
    '♂':'M83.91,13.90 L62.37,13.90 L61.57,15.10 L62.37,17.49 L77.52,17.89 L60.77,35.04 L51.60,30.25 L45.61,29.06 L40.43,29.06 L30.45,31.85 L24.87,35.44 L19.28,41.82 L15.69,49.80 L14.90,53.79 L14.90,61.77 L18.09,71.34 L24.07,78.92 L33.64,84.51 L43.62,86.10 L49.60,85.30 L55.19,83.31 L60.37,80.12 L65.16,75.33 L67.15,72.54 L70.34,64.96 L71.14,54.59 L68.75,45.81 L63.56,37.83 L79.92,21.48 L80.72,21.88 L80.32,34.64 L81.51,36.24 L83.51,36.24 L84.31,35.44 L84.70,24.27 Z M38.43,33.45 L44.81,33.05 L49.20,33.84 L56.78,37.43 L60.77,41.02 L63.96,45.41 L66.75,52.99 L66.75,62.17 L65.16,67.35 L62.37,72.14 L59.17,75.73 L54.79,78.92 L46.81,81.71 L38.83,81.71 L34.44,80.52 L29.26,77.72 L22.87,71.34 L19.28,62.96 L18.89,53.79 L22.08,45.01 L29.66,37.04 Z',
    '♃':'M26.04,14.49 L20.48,20.06 L18.34,25.62 L17.92,31.61 L20.06,38.45 L22.62,38.88 L23.91,37.59 L22.19,28.61 L24.33,22.62 L27.33,19.20 L33.74,16.21 L40.59,16.63 L43.16,17.92 L46.58,21.34 L48.72,26.04 L48.72,34.60 L46.58,42.30 L40.16,53.42 L29.89,63.26 L25.19,65.83 L21.34,66.68 L20.06,68.39 L20.48,70.11 L21.34,70.96 L62.41,70.96 L63.26,71.82 L63.26,86.79 L64.54,88.07 L66.26,88.07 L67.54,86.79 L67.54,71.39 L80.80,70.96 L81.66,70.11 L81.66,67.54 L80.80,66.68 L67.54,66.26 L67.54,14.92 L66.26,13.64 L64.12,13.64 L63.26,14.49 L63.26,66.26 L34.17,66.68 L33.74,66.26 L44.87,54.71 L50.00,45.29 L52.99,35.88 L52.99,25.19 L50.00,18.34 L45.72,14.07 L38.45,11.50 L34.60,11.50 Z',
    '♄':'M37.55,11.37 L36.82,12.46 L36.82,17.96 L36.08,18.69 L28.39,18.69 L27.66,19.79 L28.76,22.35 L36.82,22.72 L36.82,68.86 L37.55,69.96 L39.38,70.32 L40.85,68.49 L40.85,45.79 L43.41,40.66 L47.07,37.00 L51.83,35.17 L55.49,34.80 L61.35,36.63 L66.85,42.49 L68.31,47.25 L68.31,50.18 L67.21,54.58 L55.49,74.35 L54.76,76.92 L54.76,81.31 L56.23,84.97 L58.79,87.54 L61.72,88.63 L67.21,87.90 L70.51,84.97 L70.51,82.41 L68.31,81.68 L65.75,84.24 L62.45,84.97 L59.15,82.41 L58.42,78.01 L60.99,71.79 L70.14,57.51 L71.97,50.92 L71.97,47.25 L70.87,42.49 L69.04,38.83 L65.75,35.17 L62.45,32.97 L58.42,31.51 L52.93,31.14 L49.27,31.87 L45.24,33.70 L40.85,37.37 L40.85,22.72 L50.73,22.35 L51.83,21.25 L51.83,19.42 L51.10,18.69 L41.21,18.69 L40.85,12.83 L39.75,11.37 Z',
    '♅':'M21.91,11.00 L20.30,11.81 L20.30,14.23 L23.93,16.25 L27.17,19.49 L30.40,25.95 L31.21,30.40 L31.21,40.91 L30.40,45.76 L28.38,50.61 L24.34,55.46 L21.10,57.07 L19.89,59.09 L21.10,60.71 L23.53,60.71 L26.36,59.09 L30.80,54.65 L34.04,48.18 L35.65,38.48 L47.37,38.48 L47.78,63.54 L44.14,64.75 L40.10,67.98 L37.67,72.43 L37.27,77.68 L38.89,82.53 L42.52,86.58 L47.37,88.60 L52.22,88.60 L55.05,87.79 L60.31,83.34 L62.33,78.09 L62.33,74.05 L61.11,70.41 L58.69,67.18 L51.82,63.54 L51.82,38.89 L63.94,38.48 L65.16,46.16 L69.60,55.46 L74.05,59.50 L77.68,61.11 L78.90,60.71 L79.70,57.88 L75.66,55.46 L72.43,52.22 L70.01,47.78 L68.79,43.33 L68.39,33.63 L69.60,25.55 L71.62,21.10 L76.47,15.85 L79.30,14.64 L79.70,12.21 L77.28,11.00 L72.83,13.42 L69.60,16.66 L65.56,24.74 L63.94,34.44 L52.22,34.44 L51.82,12.21 L50.61,11.00 L48.99,11.00 L47.78,12.21 L47.78,34.04 L35.65,34.44 L34.84,27.17 L32.42,19.89 L27.57,13.83 Z M47.78,67.98 L51.82,67.98 L53.84,68.79 L56.67,71.22 L58.28,74.85 L58.28,77.68 L56.26,81.73 L51.41,84.55 L48.18,84.55 L44.14,82.53 L42.12,80.11 L41.31,77.68 L42.12,72.43 L44.95,69.20 Z',
    '♆':'M18.11,10.00 L13.58,15.28 L12.83,17.55 L15.85,18.68 L15.85,35.28 L18.49,44.34 L23.02,51.51 L30.57,57.92 L39.25,61.70 L47.92,63.21 L47.92,73.77 L35.47,74.15 L34.72,74.91 L34.72,76.79 L35.85,77.92 L47.55,77.92 L47.92,88.49 L48.68,89.62 L50.94,89.62 L51.70,88.87 L52.08,77.92 L63.77,77.92 L65.28,76.42 L65.28,75.28 L64.15,74.15 L52.45,74.15 L51.70,73.40 L51.70,63.58 L52.45,62.83 L60.75,61.70 L67.17,59.06 L73.21,54.91 L77.74,50.00 L81.51,43.21 L83.40,36.79 L83.40,18.68 L84.15,17.92 L86.04,18.30 L86.79,16.42 L81.89,10.00 L76.60,16.42 L77.36,18.30 L79.62,18.68 L79.62,35.66 L77.36,42.83 L73.21,49.25 L67.17,54.53 L62.26,57.17 L55.09,59.06 L52.08,59.06 L51.70,18.68 L54.34,18.30 L55.09,16.42 L49.81,10.00 L44.53,16.79 L45.28,18.30 L47.92,18.68 L47.92,58.68 L45.28,59.06 L37.74,57.17 L31.32,53.77 L26.42,49.25 L22.64,43.96 L20.00,36.04 L19.62,18.68 L22.26,18.30 L23.40,16.79 Z',
    '♇':'M19.91,31.31 L19.16,32.06 L19.16,35.05 L20.66,39.91 L25.89,48.50 L34.11,55.23 L39.72,57.85 L47.94,59.72 L47.94,70.93 L47.20,71.68 L35.24,71.68 L34.49,72.43 L34.49,74.30 L35.61,75.42 L47.57,75.42 L47.94,87.00 L49.07,88.13 L50.56,88.13 L51.68,87.00 L52.06,75.42 L63.64,75.42 L65.14,74.30 L65.14,72.43 L64.39,71.68 L52.43,71.68 L51.68,70.93 L51.68,59.72 L52.43,58.97 L57.66,58.60 L61.03,57.48 L69.62,52.62 L74.11,48.13 L77.47,43.27 L79.72,38.04 L80.46,32.06 L79.72,31.31 L77.85,31.31 L76.73,32.43 L76.35,35.80 L73.74,41.78 L67.01,49.63 L61.03,53.36 L56.92,54.86 L47.20,55.61 L39.72,53.74 L31.87,48.88 L28.51,45.51 L25.52,41.03 L23.27,35.42 L22.90,32.06 L21.41,30.94 Z M47.57,11.50 L41.59,13.37 L35.61,18.23 L32.25,24.96 L31.87,32.43 L34.11,38.79 L38.97,44.02 L44.95,47.01 L52.43,47.38 L58.41,45.51 L64.02,41.03 L67.75,33.93 L68.13,28.32 L66.26,21.59 L61.03,15.24 L55.42,12.25 Z M47.94,15.24 L53.18,15.61 L58.04,17.85 L62.15,22.34 L64.02,27.20 L64.02,32.06 L61.77,37.29 L57.66,41.40 L52.06,43.65 L47.57,43.65 L41.96,41.40 L37.48,36.92 L35.61,31.68 L35.98,25.70 L38.23,21.22 L41.59,17.85 Z'
  };
  PATHS['⊙'] = PATHS['☉'];
  PATHS['☾'] = PATHS['☽'];
  PATHS['⛢'] = PATHS['♅'];
  PATHS['⯓'] = PATHS['♇'];

  function num(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : NaN; }
  function bare(value) { return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toUpperCase(); }
  function color(group) { return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18'; }

  function rootPoint(node, x, y) {
    const matrix = node.getCTM?.();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }
  function localPoint(node, point) {
    const matrix = node.getCTM?.();
    if (!matrix) return point;
    try {
      const local = new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse());
      return { x:local.x, y:local.y };
    } catch (_) { return point; }
  }

  function rememberTransform(node) {
    if (node.dataset.relphiLayoutBaseTransform != null) return;
    node.dataset.relphiLayoutBaseTransform = node.getAttribute('transform') || '__none__';
  }
  function restoreTransform(node) {
    const base = node.dataset.relphiLayoutBaseTransform;
    if (base == null) return;
    if (base === '__none__') node.removeAttribute('transform');
    else node.setAttribute('transform', base);
  }
  function move(node, dx, dy) {
    rememberTransform(node);
    restoreTransform(node);
    const base = node.dataset.relphiLayoutBaseTransform;
    const translation = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? translation : base + ' ' + translation);
  }
  function rememberLeader(line) {
    if (line.dataset.relphiLayoutLeader) return;
    line.dataset.relphiLayoutLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiLayout' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }
  function restoreLeader(line) {
    rememberLeader(line);
    ['x1','y1','x2','y2'].forEach(function (name) {
      const value = line.dataset['relphiLayout' + name.toUpperCase()];
      if (value != null) line.setAttribute(name, value);
    });
  }

  function prepareGlyph(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!knob || !text) return;
    const key = bare(text.textContent);
    if (key === 'AC') text.textContent = 'ASC';
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    const pathData = PATHS[key];
    if (!pathData) {
      group.classList.add('has-preview-angle-text');
      group.classList.remove('has-preview-inline-glyph');
      text.style.removeProperty('display');
      text.setAttribute('x', String(cx));
      text.setAttribute('y', String(cy));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', color(group));
      return;
    }

    group.classList.remove('has-preview-angle-text');
    text.style.display = 'none';
    group.querySelectorAll('image.relphi-bubble-glyph-image,svg.relphi-colored-glyph').forEach(function (node) { node.style.display = 'none'; });
    let inline = group.querySelector('svg.relphi-bold-inline-glyph');
    if (!inline) {
      inline = document.createElementNS(NS, 'svg');
      inline.classList.add('relphi-bold-inline-glyph');
      inline.setAttribute('viewBox', '0 0 100 100');
      inline.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      inline.setAttribute('pointer-events', 'none');
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('clip-rule', 'evenodd');
      inline.appendChild(path);
      group.appendChild(inline);
    }
    inline.setAttribute('x', String(cx - GLYPH_SIZE / 2));
    inline.setAttribute('y', String(cy - GLYPH_SIZE / 2));
    inline.setAttribute('width', String(GLYPH_SIZE));
    inline.setAttribute('height', String(GLYPH_SIZE));
    const path = inline.querySelector('path');
    path.setAttribute('fill', color(group));
    path.setAttribute('stroke', color(group));
    path.setAttribute('stroke-width', '1.55');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('paint-order', 'stroke fill');
    group.classList.add('has-preview-inline-glyph');
  }

  function collect(svg) {
    const box = svg.viewBox?.baseVal;
    const center = box && box.width ? { x:box.x + box.width / 2, y:box.y + box.height / 2 } : { x:400, y:400 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      const knob = group.querySelector('circle.chart-wheel-stick-knob');
      const contact = group.querySelector('circle.chart-wheel-contact-dot');
      const leader = group.querySelector('line.chart-wheel-stick');
      if (!knob || !contact || !leader) return null;
      const cx = num(knob.getAttribute('cx'));
      const cy = num(knob.getAttribute('cy'));
      const ax = num(contact.getAttribute('cx'));
      const ay = num(contact.getAttribute('cy'));
      if (![cx,cy,ax,ay].every(Number.isFinite)) return null;
      const vx = ax - center.x;
      const vy = ay - center.y;
      const length = Math.hypot(vx, vy) || 1;
      return {
        index:index, group:group, knob:knob, contact:contact, leader:leader,
        original:{x:cx,y:cy}, anchor:{x:ax,y:ay},
        radial:{x:vx/length,y:vy/length}, tangent:{x:-vy/length,y:vx/length}, offset:0
      };
    }).filter(Boolean);
  }
  function finalPosition(item) {
    return {
      x:item.anchor.x + item.radial.x * OUTWARD_DISTANCE + item.tangent.x * item.offset,
      y:item.anchor.y + item.radial.y * OUTWARD_DISTANCE + item.tangent.y * item.offset
    };
  }
  function solve(items) {
    for (let pass = 0; pass < 56; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a], second = items[b];
          const p = finalPosition(first), q = finalPosition(second);
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= MIN_CENTER_GAP) continue;
          const cross = first.radial.x * second.radial.y - first.radial.y * second.radial.x;
          const direction = Math.sign(cross) || (first.index < second.index ? 1 : -1);
          const push = Math.min(7, (MIN_CENTER_GAP - distance) * 0.64 + 0.5);
          first.offset = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, first.offset - direction * push / 2));
          second.offset = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, second.offset + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function connectLeader(item) {
    restoreLeader(item.leader);
    const cx = num(item.knob.getAttribute('cx'));
    const cy = num(item.knob.getAttribute('cy'));
    const ax = num(item.contact.getAttribute('cx'));
    const ay = num(item.contact.getAttribute('cy'));
    const bubbleRoot = rootPoint(item.knob, cx, cy);
    const anchorRoot = rootPoint(item.contact, ax, ay);
    const vx = bubbleRoot.x - anchorRoot.x;
    const vy = bubbleRoot.y - anchorRoot.y;
    const length = Math.hypot(vx, vy) || 1;
    const edgeRoot = {
      x:bubbleRoot.x - vx / length * (BUBBLE_RADIUS + 0.5),
      y:bubbleRoot.y - vy / length * (BUBBLE_RADIUS + 0.5)
    };
    const anchorLocal = localPoint(item.leader, anchorRoot);
    const edgeLocal = localPoint(item.leader, edgeRoot);
    const baseX1 = num(item.leader.dataset.relphiLayoutX1);
    const baseY1 = num(item.leader.dataset.relphiLayoutY1);
    const baseX2 = num(item.leader.dataset.relphiLayoutX2);
    const baseY2 = num(item.leader.dataset.relphiLayoutY2);
    const oneRoot = rootPoint(item.leader, baseX1, baseY1);
    const twoRoot = rootPoint(item.leader, baseX2, baseY2);
    const oneIsAnchor = Math.hypot(oneRoot.x-anchorRoot.x, oneRoot.y-anchorRoot.y) <= Math.hypot(twoRoot.x-anchorRoot.x, twoRoot.y-anchorRoot.y);
    if (oneIsAnchor) {
      item.leader.setAttribute('x1', anchorLocal.x.toFixed(2));
      item.leader.setAttribute('y1', anchorLocal.y.toFixed(2));
      item.leader.setAttribute('x2', edgeLocal.x.toFixed(2));
      item.leader.setAttribute('y2', edgeLocal.y.toFixed(2));
    } else {
      item.leader.setAttribute('x2', anchorLocal.x.toFixed(2));
      item.leader.setAttribute('y2', anchorLocal.y.toFixed(2));
      item.leader.setAttribute('x1', edgeLocal.x.toFixed(2));
      item.leader.setAttribute('y1', edgeLocal.y.toFixed(2));
    }
  }

  function layout(svg) {
    const groups = Array.from(svg.querySelectorAll(PLACEMENT));
    if (!groups.length) return;
    groups.forEach(function (group) {
      [group.querySelector('.chart-wheel-stick-knob'), group.querySelector('.chart-wheel-marker-glyph'), group.querySelector('svg.relphi-bold-inline-glyph')]
        .filter(Boolean).forEach(restoreTransform);
      const leader = group.querySelector('line.chart-wheel-stick');
      if (leader) restoreLeader(leader);
      prepareGlyph(group);
    });
    const items = collect(svg);
    solve(items);
    items.forEach(function (item) {
      const target = finalPosition(item);
      const dx = target.x - item.original.x;
      const dy = target.y - item.original.y;
      [item.knob, item.group.querySelector('.chart-wheel-marker-glyph'), item.group.querySelector('svg.relphi-bold-inline-glyph')]
        .filter(Boolean).forEach(function (node) { move(node, dx, dy); });
      connectLeader(item);
    });
    svg.classList.add('relphi-layout-ready');
  }

  const selector = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  function scan(root) {
    if (root instanceof SVGElement && root.matches(selector)) layout(root);
    root.querySelectorAll?.(selector).forEach(layout);
  }
  function install() {
    scan(document);
    new MutationObserver(function (records) {
      const svgs = new Set();
      records.forEach(function (record) {
        Array.from(record.addedNodes || []).forEach(function (node) {
          if (!(node instanceof Element)) return;
          const svg = node.matches?.(selector) ? node : node.closest?.('svg');
          if (svg && svg.matches?.(selector)) svgs.add(svg);
          node.querySelectorAll?.(selector).forEach(function (found) { svgs.add(found); });
        });
      });
      svgs.forEach(layout);
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', function () { document.querySelectorAll(selector).forEach(layout); }, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { document.querySelectorAll(selector).forEach(layout); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
