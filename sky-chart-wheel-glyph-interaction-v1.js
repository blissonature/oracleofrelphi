// Makes the comparison wheel glyph-first and reveals labels only through interaction.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const GLYPH_MAP = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    'ASC':'ascendant','MC':'midheaven'
  };
  let pinned = [];
  let queued = false;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function placementName(group) {
    return bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.getAttribute('data-body')) || bare(group.getAttribute('data-placement')) || 'placement';
  }

  function standardizeGlyph(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!knob || !text) return;
    const key = bare(text.textContent);
    const asset = GLYPH_MAP[key];
    if (!asset || asset === 'ascendant' || asset === 'midheaven') return;

    let image = group.querySelector('image.relphi-wheel-glyph-image');
    const cx = Number(knob.getAttribute('cx'));
    const cy = Number(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
    const size = 18.5;

    if (!image) {
      image = document.createElementNS(NS, 'image');
      image.classList.add('relphi-wheel-glyph-image');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      image.setAttribute('pointer-events', 'none');
      group.appendChild(image);
    }
    image.setAttribute('href', 'assets/planet-glyphs/' + asset + '.svg?v=4');
    image.setAttribute('x', String(cx - size / 2));
    image.setAttribute('y', String(cy - size / 2));
    image.setAttribute('width', String(size));
    image.setAttribute('height', String(size));
    image.setAttribute('aria-label', placementName(group));
    text.setAttribute('visibility', 'hidden');
    text.style.opacity = '0';
  }

  function clearTransient(svg) {
    svg.querySelectorAll(PLACEMENT + '.is-hovered').forEach(function (group) { group.classList.remove('is-hovered'); });
    svg.querySelectorAll('.relphi-aspect-is-active').forEach(function (node) { node.classList.remove('relphi-aspect-is-active'); });
  }

  function setActive(groups, aspect, pin) {
    const svg = (groups[0] || aspect)?.closest('svg');
    if (!svg) return;
    svg.querySelectorAll(PLACEMENT).forEach(function (group) {
      group.classList.remove('is-active', 'is-hovered');
      group.setAttribute('aria-expanded', 'false');
    });
    svg.querySelectorAll('.relphi-aspect-is-active').forEach(function (node) { node.classList.remove('relphi-aspect-is-active'); });
    groups.filter(Boolean).forEach(function (group) {
      group.classList.add(pin ? 'is-active' : 'is-hovered');
      group.setAttribute('aria-expanded', 'true');
    });
    if (aspect) aspect.classList.add('relphi-aspect-is-active');
    if (pin) pinned = groups.filter(Boolean);
  }

  function rootPoint(node, x, y) {
    const svg = node.ownerSVGElement;
    if (!svg || !node.getCTM) return { x:x, y:y };
    const matrix = node.getCTM();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }

  function contactPoint(group) {
    const dot = group.querySelector('.chart-wheel-contact-dot');
    if (!dot) return null;
    const x = Number(dot.getAttribute('cx'));
    const y = Number(dot.getAttribute('cy'));
    return Number.isFinite(x) && Number.isFinite(y) ? rootPoint(dot, x, y) : null;
  }

  function endpoints(node) {
    if (node.tagName.toLowerCase() === 'line') {
      const x1 = Number(node.getAttribute('x1')); const y1 = Number(node.getAttribute('y1'));
      const x2 = Number(node.getAttribute('x2')); const y2 = Number(node.getAttribute('y2'));
      if ([x1,y1,x2,y2].every(Number.isFinite)) return [rootPoint(node, x1, y1), rootPoint(node, x2, y2)];
    }
    if (node.tagName.toLowerCase() === 'path' && node.getTotalLength) {
      try {
        const length = node.getTotalLength();
        const a = node.getPointAtLength(0); const b = node.getPointAtLength(length);
        return [rootPoint(node, a.x, a.y), rootPoint(node, b.x, b.y)];
      } catch (_) {}
    }
    return [];
  }

  function nearestPlacements(aspect) {
    const svg = aspect.closest('svg');
    const ends = endpoints(aspect);
    if (!svg || ends.length !== 2) return [];
    const placements = Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group) {
      return { group:group, point:contactPoint(group) };
    }).filter(function (item) { return item.point; });
    return ends.map(function (end) {
      let best = null;
      placements.forEach(function (item) {
        const d = Math.hypot(item.point.x - end.x, item.point.y - end.y);
        if (!best || d < best.d) best = { group:item.group, d:d };
      });
      return best && best.d < 24 ? best.group : null;
    }).filter(Boolean);
  }

  function aspectCandidates(svg) {
    return Array.from(svg.querySelectorAll(
      '.chart-wheel-aspect, .chart-wheel-aspect-line, [data-aspect], [class*="aspect"] line, [class*="aspect"] path, line[class*="relationship"], path[class*="relationship"]'
    )).filter(function (node) { return !node.closest(PLACEMENT); });
  }

  function wirePlacement(group) {
    if (group.dataset.relphiGlyphWired) return;
    group.dataset.relphiGlyphWired = 'true';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', placementName(group));
    group.setAttribute('aria-expanded', 'false');
    standardizeGlyph(group);

    const targets = [group.querySelector('.chart-wheel-stick-knob'), group.querySelector('.chart-wheel-stick'), group].filter(Boolean);
    targets.forEach(function (target) {
      target.style.cursor = 'pointer';
      target.addEventListener('pointerenter', function () { if (!pinned.includes(group)) setActive([group], null, false); });
      target.addEventListener('pointerleave', function () {
        if (!pinned.length) clearTransient(group.closest('svg'));
      });
    });
    group.addEventListener('focus', function () { setActive([group], null, false); });
    group.addEventListener('blur', function () { if (!pinned.length) clearTransient(group.closest('svg')); });
    group.addEventListener('click', function (event) {
      event.stopPropagation();
      if (pinned.length === 1 && pinned[0] === group) {
        pinned = [];
        setActive([], null, true);
      } else {
        setActive([group], null, true);
      }
    });
    group.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); group.dispatchEvent(new MouseEvent('click', { bubbles:true })); }
      if (event.key === 'Escape') { pinned = []; setActive([], null, true); }
    });
  }

  function wireAspect(node) {
    if (node.dataset.relphiAspectWired) return;
    node.dataset.relphiAspectWired = 'true';
    node.style.cursor = 'pointer';
    node.style.pointerEvents = 'stroke';
    node.addEventListener('pointerenter', function () {
      const groups = nearestPlacements(node);
      if (groups.length) setActive(groups, node, false);
    });
    node.addEventListener('pointerleave', function () {
      if (!pinned.length) clearTransient(node.closest('svg'));
    });
    node.addEventListener('click', function (event) {
      const groups = nearestPlacements(node);
      if (!groups.length) return;
      event.stopPropagation();
      setActive(groups, node, true);
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll('.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg').forEach(function (svg) {
      svg.querySelectorAll(PLACEMENT).forEach(wirePlacement);
      aspectCandidates(svg).forEach(wireAspect);
      if (!svg.dataset.relphiClearWired) {
        svg.dataset.relphiClearWired = 'true';
        svg.addEventListener('click', function (event) {
          if (event.target.closest?.(PLACEMENT) || event.target.closest?.('[data-relphi-aspect-wired]')) return;
          pinned = [];
          setActive([], null, true);
        });
      }
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function install() {
    schedule();
    [150, 500, 1200, 2400].forEach(function (delay) { setTimeout(schedule, delay); });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiSkyWheelGlyphInteraction = { run:run, schedule:schedule };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
