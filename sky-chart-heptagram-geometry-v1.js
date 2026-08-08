// Keep the Sky-card weekly star and planetary-hour path on the same seven vertices.
// Weekly sequence may cut across as a heptagram; planetary hours always advance around the perimeter in Chaldean order.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramGeometryV6) return;
  window.__relphiSkyHeptagramGeometryV6 = true;

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

  function setLine(line, fromKey, toKey, radius=HEPTAGON_RADIUS, fraction=1) {
    const from = point(fromKey, radius);
    const to = point(toKey, radius);
    const f = Math.max(0, Math.min(1, Number(fraction) || 0));
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y));
    line.setAttribute('x2', String(from.x + (to.x - from.x) * f));
    line.setAttribute('y2', String(from.y + (to.y - from.y) * f));
  }

  function sourceFraction(line, fromKey, toKey, sourceRadius) {
    const x1 = Number(line.getAttribute('x1'));
    const y1 = Number(line.getAttribute('y1'));
    const x2 = Number(line.getAttribute('x2'));
    const y2 = Number(line.getAttribute('y2'));
    const drawn = Math.hypot(x2 - x1, y2 - y1);
    const a = point(fromKey, sourceRadius);
    const b = point(toKey, sourceRadius);
    const full = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return Math.max(0, Math.min(1, drawn / full));
  }

  function hourRuler(svg) {
    return ORDER.find(key => {
      const group = svg.querySelector(`.sky-ph-${key}`);
      const node = group?.querySelector(':scope > .sky-ph-node');
      return group?.classList.contains('is-hour-ruler') || node?.classList.contains('hour');
    }) || '';
  }

  function nextHour(key) {
    const index = ORDER.indexOf(key);
    return index < 0 ? '' : ORDER[(index + 1) % ORDER.length];
  }

  function normalizeHourPath(svg, hourLines) {
    const current = hourLines.find(line => line.classList.contains('current')) || null;
    const base = hourLines.filter(line => line !== current);

    // The seven reusable hour edges are the perimeter itself:
    // Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon → Saturn.
    base.forEach((line, index) => {
      if (index >= ORDER.length) {
        line.remove();
        return;
      }
      const from = ORDER[index];
      const to = ORDER[(index + 1) % ORDER.length];
      setLine(line, from, to);
      line.classList.remove('past');
      line.classList.add('future');
      line.dataset.hourFrom = from;
      line.dataset.hourTo = to;
    });

    if (!current) return;
    const ruler = hourRuler(svg);
    const next = nextHour(ruler);
    if (!ruler || !next) return;

    // Current-hour progress begins at the current ruler and advances toward the next ruler.
    // Example: during a Moon hour, progress is Moon → Saturn.
    const fraction = sourceFraction(current, ruler, next, SOURCE_HEPTAGON_RADIUS);
    setLine(current, ruler, next, HEPTAGON_RADIUS, fraction);
    current.dataset.hourFrom = ruler;
    current.dataset.hourTo = next;
    current.dataset.hourPath = 'perimeter';
  }

  function correct(svg) {
    if (!svg || svg.dataset.heptagramGeometryV6 === 'true') return;
    const weekLines = Array.from(svg.querySelectorAll('.sky-ph-week-segment'));
    const baseLines = weekLines.filter(line => !line.classList.contains('current'));
    const hourLines = Array.from(svg.querySelectorAll('.sky-ph-hour-segment'));
    if (baseLines.length < 7 || !hourLines.length || !svg.querySelector('.sky-ph-planet')) return;

    svg.dataset.heptagramGeometryV6 = 'true';
    svg.dataset.planetaryHourPath = 'chaldean-perimeter';

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
      const fromKey = WEEK_PATH[index];
      const toKey = WEEK_PATH[index + 1];
      const fraction = sourceFraction(currentWeek, fromKey, toKey, SOURCE_STAR_RADIUS);
      setLine(currentWeek, fromKey, toKey, STAR_RADIUS, fraction);
    }

    normalizeHourPath(svg, hourLines);

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

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(svg => {
      delete svg.dataset.heptagramGeometryV4;
      delete svg.dataset.heptagramGeometryV5;
      correct(svg);
    });
  }

  function start() {
    scan();
    // The heptagram source already announces when it is ready; no document-wide observer is needed.
    window.addEventListener('relphi:sky-heptagram-source-ready', scan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
