// Keep the Sky-card heptagram and heptagon on the same seven vertices.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramGeometryV4) return;
  window.__relphiSkyHeptagramGeometryV4 = true;

  const ORDER = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEK_PATH = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
  const CENTER = 180;
  const SOURCE_STAR_RADIUS = 118;
  const SOURCE_HEPTAGON_RADIUS = 78;
  const STAR_RADIUS = 142;
  const HEPTAGON_RADIUS = STAR_RADIUS;

  function point(key, radius) {
    const index = ORDER.indexOf(key);
    const angle = (-90 + index * (360 / 7)) * Math.PI / 180;
    return {
      x:CENTER + Math.cos(angle) * radius,
      y:CENTER + Math.sin(angle) * radius
    };
  }

  function scaleCoordinate(value, sourceRadius, targetRadius) {
    return CENTER + (Number(value) - CENTER) * (targetRadius / sourceRadius);
  }

  function scaleLine(line, sourceRadius, targetRadius) {
    line.setAttribute('x1', String(scaleCoordinate(line.getAttribute('x1'), sourceRadius, targetRadius)));
    line.setAttribute('y1', String(scaleCoordinate(line.getAttribute('y1'), sourceRadius, targetRadius)));
    line.setAttribute('x2', String(scaleCoordinate(line.getAttribute('x2'), sourceRadius, targetRadius)));
    line.setAttribute('y2', String(scaleCoordinate(line.getAttribute('y2'), sourceRadius, targetRadius)));
  }

  function normalizeInactiveHourLines(hourLines) {
    hourLines.filter(line => !line.classList.contains('current')).forEach((line, index) => {
      if (index >= 7) {
        line.remove();
        return;
      }
      line.classList.remove('past');
      line.classList.add('future');
    });
  }

  function correct(svg) {
    if (!svg || svg.dataset.heptagramGeometryV4 === 'true') return;
    const weekLines = Array.from(svg.querySelectorAll('.sky-ph-week-segment'));
    const baseLines = weekLines.filter(line => !line.classList.contains('current'));
    const hourLines = Array.from(svg.querySelectorAll('.sky-ph-hour-segment'));
    if (baseLines.length < 7 || !hourLines.length || !svg.querySelector('.sky-ph-planet')) return;

    svg.dataset.heptagramGeometryV4 = 'true';

    const outer = svg.querySelector('.sky-ph-circle');
    if (outer) outer.setAttribute('r', String(STAR_RADIUS));
    const guide = svg.querySelector('.sky-ph-guide');
    if (guide) guide.setAttribute('r', String(STAR_RADIUS));

    baseLines.slice(0, 7).forEach((line, index) => {
      const from = point(WEEK_PATH[index], STAR_RADIUS);
      const to = point(WEEK_PATH[index + 1], STAR_RADIUS);
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x));
      line.setAttribute('y2', String(to.y));
    });

    const currentWeek = weekLines.find(line => line.classList.contains('current'));
    if (currentWeek) {
      const activeIndex = baseLines.findIndex(line => line.classList.contains('future'));
      const index = activeIndex < 0 ? 6 : activeIndex;
      const from = point(WEEK_PATH[index], STAR_RADIUS);
      const to = point(WEEK_PATH[index + 1], STAR_RADIUS);
      const oldFrom = { x:Number(currentWeek.getAttribute('x1')), y:Number(currentWeek.getAttribute('y1')) };
      const oldTo = { x:Number(currentWeek.getAttribute('x2')), y:Number(currentWeek.getAttribute('y2')) };
      const oldFullFrom = point(WEEK_PATH[index], SOURCE_STAR_RADIUS);
      const oldFullTo = point(WEEK_PATH[index + 1], SOURCE_STAR_RADIUS);
      const oldLength = Math.hypot(oldFullTo.x - oldFullFrom.x, oldFullTo.y - oldFullFrom.y) || 1;
      const drawnLength = Math.hypot(oldTo.x - oldFrom.x, oldTo.y - oldFrom.y);
      const fraction = Math.max(0, Math.min(1, drawnLength / oldLength));
      currentWeek.setAttribute('x1', String(from.x));
      currentWeek.setAttribute('y1', String(from.y));
      currentWeek.setAttribute('x2', String(from.x + (to.x - from.x) * fraction));
      currentWeek.setAttribute('y2', String(from.y + (to.y - from.y) * fraction));
    }

    hourLines.forEach(line => scaleLine(line, SOURCE_HEPTAGON_RADIUS, HEPTAGON_RADIUS));
    normalizeInactiveHourLines(hourLines);

    ORDER.forEach(key => {
      const group = svg.querySelector(`.sky-ph-${key}`);
      if (!group) return;
      const nodePoint = point(key, STAR_RADIUS);
      const circle = group.querySelector('.sky-ph-node');
      const glyph = group.querySelector('.sky-ph-node-glyph');
      if (circle) {
        circle.setAttribute('cx', String(nodePoint.x));
        circle.setAttribute('cy', String(nodePoint.y));
      }
      if (glyph) glyph.setAttribute('transform', `translate(${nodePoint.x} ${nodePoint.y})`);
    });
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    if (node.matches?.('.sky-ph-heptagram')) correct(node);
    node.querySelectorAll?.('.sky-ph-heptagram').forEach(correct);
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(correct);
  }

  const observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(inspect));
  });

  function start() {
    scan();
    observer.observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-heptagram-source-ready', scan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
