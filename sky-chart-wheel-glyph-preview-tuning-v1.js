// Branch-only tuning: slightly longer lollipops and uniform ASC/MC glyph assets.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const EXTRA_LENGTH = 7;
  let queued = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toUpperCase();
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

  function ensureAngleGlyph(group) {
    const text = group.querySelector('.chart-wheel-marker-glyph');
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (!text || !knob) return;
    const key = bare(text.textContent);
    const asset = key === 'ASC' ? 'ascendant' : key === 'MC' ? 'midheaven' : '';
    if (!asset) return;

    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    let image = group.querySelector('image.relphi-angle-glyph-image');
    if (!image) {
      image = document.createElementNS(NS, 'image');
      image.classList.add('relphi-angle-glyph-image');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      image.setAttribute('pointer-events', 'none');
      group.appendChild(image);
    }
    const size = 17.5;
    image.setAttribute('href', 'assets/planet-glyphs/' + asset + '.svg?v=1');
    image.setAttribute('x', String(cx - size / 2));
    image.setAttribute('y', String(cy - size / 2));
    image.setAttribute('width', String(size));
    image.setAttribute('height', String(size));
    group.classList.add('has-preview-angle-image');
  }

  function extendPlacement(group, svgCenter) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const kx = num(knob.getAttribute('cx'));
    const ky = num(knob.getAttribute('cy'));
    const ax = num(contact.getAttribute('cx'));
    const ay = num(contact.getAttribute('cy'));
    if (![kx,ky,ax,ay].every(Number.isFinite)) return;

    const vx = ax - svgCenter.x;
    const vy = ay - svgCenter.y;
    const length = Math.hypot(vx, vy) || 1;
    const dx = vx / length * EXTRA_LENGTH;
    const dy = vy / length * EXTRA_LENGTH;

    const nodes = [
      knob,
      group.querySelector('.chart-wheel-marker-glyph'),
      group.querySelector('image.relphi-bubble-glyph-image'),
      group.querySelector('image.relphi-angle-glyph-image')
    ].filter(Boolean);
    nodes.forEach(function (node) { translate(node, dx, dy); });

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
      ensureAngleGlyph(group);
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
