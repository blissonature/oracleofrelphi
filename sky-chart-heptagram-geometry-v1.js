// Keep the Sky-card heptagram vertices coincident with the seven planetary glyph nodes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramGeometryV1) return;
  window.__relphiSkyHeptagramGeometryV1 = true;

  const ORDER = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEK_PATH = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
  const CENTER = 180;
  const STAR_RADIUS = 142;
  const LABEL_RADIUS = 168;

  function point(key, radius) {
    const index = ORDER.indexOf(key);
    const angle = (-90 + index * (360 / 7)) * Math.PI / 180;
    return {
      x:CENTER + Math.cos(angle) * radius,
      y:CENTER + Math.sin(angle) * radius
    };
  }

  function setPointAttributes(node, prefix, value) {
    node.setAttribute(prefix + 'x', String(value.x));
    node.setAttribute(prefix + 'y', String(value.y));
  }

  function correct(svg) {
    if (!svg || svg.dataset.heptagramGeometryV1 === 'true') return;
    const weekLines = Array.from(svg.querySelectorAll('.sky-ph-week-segment'));
    const baseLines = weekLines.filter(line => !line.classList.contains('current'));
    if (baseLines.length < 7 || !svg.querySelector('.sky-ph-planet')) return;

    svg.dataset.heptagramGeometryV1 = 'true';
    const outer = svg.querySelector('.sky-ph-circle');
    if (outer) outer.setAttribute('r', String(STAR_RADIUS));

    baseLines.slice(0, 7).forEach((line, index) => {
      const from = point(WEEK_PATH[index], STAR_RADIUS);
      const to = point(WEEK_PATH[index + 1], STAR_RADIUS);
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x));
      line.setAttribute('y2', String(to.y));
    });

    const current = weekLines.find(line => line.classList.contains('current'));
    if (current) {
      const activeIndex = baseLines.findIndex(line => line.classList.contains('future'));
      const index = activeIndex < 0 ? 6 : activeIndex;
      const from = point(WEEK_PATH[index], STAR_RADIUS);
      const to = point(WEEK_PATH[index + 1], STAR_RADIUS);
      const oldFrom = { x:Number(current.getAttribute('x1')), y:Number(current.getAttribute('y1')) };
      const oldTo = { x:Number(current.getAttribute('x2')), y:Number(current.getAttribute('y2')) };
      const oldFullFrom = point(WEEK_PATH[index], 118);
      const oldFullTo = point(WEEK_PATH[index + 1], 118);
      const oldLength = Math.hypot(oldFullTo.x - oldFullFrom.x, oldFullTo.y - oldFullFrom.y) || 1;
      const drawnLength = Math.hypot(oldTo.x - oldFrom.x, oldTo.y - oldFrom.y);
      const fraction = Math.max(0, Math.min(1, drawnLength / oldLength));
      current.setAttribute('x1', String(from.x));
      current.setAttribute('y1', String(from.y));
      current.setAttribute('x2', String(from.x + (to.x - from.x) * fraction));
      current.setAttribute('y2', String(from.y + (to.y - from.y) * fraction));
    }

    ORDER.forEach(key => {
      const group = svg.querySelector(`.sky-ph-${key}`);
      if (!group) return;
      const nodePoint = point(key, STAR_RADIUS);
      const labelPoint = point(key, LABEL_RADIUS);
      const circle = group.querySelector('.sky-ph-node');
      const glyph = group.querySelector('.sky-ph-node-glyph');
      const label = group.querySelector('.sky-ph-node-label');
      if (circle) {
        circle.setAttribute('cx', String(nodePoint.x));
        circle.setAttribute('cy', String(nodePoint.y));
      }
      if (glyph) glyph.setAttribute('transform', `translate(${nodePoint.x} ${nodePoint.y})`);
      if (label) {
        label.setAttribute('x', String(labelPoint.x));
        label.setAttribute('y', String(labelPoint.y));
      }
    });
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(correct);
  }

  const observer = new MutationObserver(scan);
  function start() {
    scan();
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
