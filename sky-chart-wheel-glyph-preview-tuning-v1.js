// Branch-only tuning: visibly longer lollipops, larger bubbles, and bold inline glyph assets.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const EXTRA_LENGTH = 28;
  const GLYPH_SIZE = 29;
  const ASSETS = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto'
  };
  let queued = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toUpperCase();
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function rememberTransform(node) {
    if (node.dataset.previewTuneBaseTransform != null) return;
    node.dataset.previewTuneBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function restoreNode(node) {
    const base = node.dataset.previewTuneBaseTransform;
    if (base == null) return;
    if (base === '__none__') node.removeAttribute('transform');
    else node.setAttribute('transform', base);
  }

  function translate(node, dx, dy) {
    rememberTransform(node);
    restoreNode(node);
    const base = node.dataset.previewTuneBaseTransform;
    const move = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? move : base + ' ' + move);
  }

  function rememberLeader(line) {
    if (line.dataset.previewTuneLeader) return;
    line.dataset.previewTuneLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['previewTune' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function restoreLeader(line) {
    if (!line.dataset.previewTuneLeader) return;
    ['x1','y1','x2','y2'].forEach(function (name) {
      const value = line.dataset['previewTune' + name.toUpperCase()];
      if (value != null) line.setAttribute(name, value);
    });
  }

  function boldAsset(root, color) {
    root.querySelectorAll('path,circle,ellipse,line,polyline,polygon,rect').forEach(function (node) {
      const fill = node.getAttribute('fill');
      if (fill !== 'none') node.setAttribute('fill', color);
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '2.7');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
      node.setAttribute('paint-order', 'stroke fill');
    });
  }

  function installInlineGlyph(group) {
    const text = group.querySelector('.chart-wheel-marker-glyph');
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (!text || !knob) return;

    const key = bare(text.textContent);
    if (key === 'AC') text.textContent = 'ASC';
    const asset = ASSETS[key];
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    group.querySelectorAll('image.relphi-bubble-glyph-image, image.relphi-angle-glyph-image, svg.relphi-colored-glyph, svg.relphi-bold-inline-glyph').forEach(function (node) { node.remove(); });
    group.classList.remove('has-preview-image', 'has-preview-angle-image', 'has-preview-colored-glyph', 'has-preview-inline-glyph');

    if (!asset) {
      group.classList.add('has-preview-angle-text');
      text.setAttribute('x', String(cx));
      text.setAttribute('y', String(cy));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', markerColor(group));
      text.removeAttribute('stroke');
      text.style.removeProperty('display');
      return;
    }

    group.classList.remove('has-preview-angle-text');
    if (group.dataset.previewInlineLoading === asset) return;
    group.dataset.previewInlineLoading = asset;
    fetch('assets/planet-glyphs/' + asset + '.svg?v=4').then(function (response) {
      if (!response.ok) throw new Error('glyph fetch failed');
      return response.text();
    }).then(function (markup) {
      const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
      const inline = document.createElementNS(NS, 'svg');
      inline.classList.add('relphi-bold-inline-glyph');
      inline.setAttribute('viewBox', parsed.getAttribute('viewBox') || '0 0 100 100');
      inline.setAttribute('x', String(cx - GLYPH_SIZE / 2));
      inline.setAttribute('y', String(cy - GLYPH_SIZE / 2));
      inline.setAttribute('width', String(GLYPH_SIZE));
      inline.setAttribute('height', String(GLYPH_SIZE));
      inline.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      inline.setAttribute('pointer-events', 'none');
      const knobTransform = knob.getAttribute('transform');
      if (knobTransform) inline.setAttribute('transform', knobTransform);
      Array.from(parsed.childNodes).forEach(function (node) {
        if (node.nodeType === Node.ELEMENT_NODE) inline.appendChild(document.importNode(node, true));
      });
      boldAsset(inline, markerColor(group));
      group.appendChild(inline);
      group.classList.add('has-preview-inline-glyph');
      text.style.display = 'none';
      schedule();
    }).catch(function () {
      text.style.removeProperty('display');
    }).finally(function () {
      delete group.dataset.previewInlineLoading;
    });
  }

  function extendPlacement(group, svgCenter) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const ax = num(contact.getAttribute('cx'));
    const ay = num(contact.getAttribute('cy'));
    if (![ax,ay].every(Number.isFinite)) return;

    const vx = ax - svgCenter.x;
    const vy = ay - svgCenter.y;
    const length = Math.hypot(vx, vy) || 1;
    const dx = vx / length * EXTRA_LENGTH;
    const dy = vy / length * EXTRA_LENGTH;

    [knob, group.querySelector('.chart-wheel-marker-glyph'), group.querySelector('svg.relphi-bold-inline-glyph')]
      .filter(Boolean).forEach(function (node) { translate(node, dx, dy); });

    rememberLeader(leader);
    restoreLeader(leader);
    const x1 = num(leader.getAttribute('x1'));
    const y1 = num(leader.getAttribute('y1'));
    const x2 = num(leader.getAttribute('x2'));
    const y2 = num(leader.getAttribute('y2'));
    if (![x1,y1,x2,y2].every(Number.isFinite)) return;

    const d1 = Math.hypot(x1 - ax, y1 - ay);
    const d2 = Math.hypot(x2 - ax, y2 - ay);
    if (d1 <= d2) {
      leader.setAttribute('x2', (x2 + dx).toFixed(2));
      leader.setAttribute('y2', (y2 + dy).toFixed(2));
    } else {
      leader.setAttribute('x1', (x1 + dx).toFixed(2));
      leader.setAttribute('y1', (y1 + dy).toFixed(2));
    }
  }

  function tune(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    const center = box && box.width ? { x:box.x + box.width / 2, y:box.y + box.height / 2 } : { x:400, y:400 };
    svg.querySelectorAll(PLACEMENT).forEach(function (group) {
      installInlineGlyph(group);
      extendPlacement(group, center);
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll('.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg').forEach(tune);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function install() {
    schedule();
    [250, 700, 1400, 2600].forEach(function (delay) { setTimeout(schedule, delay); });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('resize', schedule, { passive:true });
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
