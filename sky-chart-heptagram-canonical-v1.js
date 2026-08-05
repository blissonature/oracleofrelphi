// Canonical circled planetary glyphs and unclipped Sky-card heptagram presentation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramCanonicalV2) return;
  window.__relphiSkyHeptagramCanonicalV2 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const COLORS = {
    saturn:'#8c7a42', jupiter:'#41752f', mars:'#c9211e', sun:'#d08a00',
    venus:'#b23b79', mercury:'#277390', moon:'#58628a'
  };
  const WHITE = '#fff';
  const GLYPH_RING_STROKE = 2.35;
  const DAY_RULER_RING_RADIUS = 25;
  const DAY_RULER_RING_STROKE = 2.35;
  const PAINTED = '[fill],[stroke],text';

  function keyFor(group) {
    return KEYS.find(key => group.classList.contains(`sky-ph-${key}`)) || '';
  }

  function forceHourRulerInverse(art) {
    if (!art) return;
    art.dataset.hourRulerInverse = 'true';
    art.querySelectorAll(PAINTED).forEach(node => {
      const tag = node.localName;
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (tag === 'text' || (fill && fill !== 'none')) {
        node.setAttribute('fill', WHITE);
        node.style.setProperty('fill', WHITE, 'important');
      }
      if (stroke && stroke !== 'none') {
        node.setAttribute('stroke', WHITE);
        node.style.setProperty('stroke', WHITE, 'important');
      }
      node.setAttribute('opacity', '1');
      node.style.setProperty('opacity', '1', 'important');
    });
  }

  function addDayRulerRing(bubble, color) {
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', String(DAY_RULER_RING_RADIUS));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', String(DAY_RULER_RING_STROKE));
    ring.setAttribute('aria-hidden', 'true');
    ring.classList.add('sky-ph-day-ruler-ring');
    ring.dataset.dayRuler = 'true';
    bubble.root.insertBefore(ring, bubble.root.firstChild);
    return ring;
  }

  async function replacePlanet(group) {
    const key = keyFor(group);
    if (!key || group.dataset.canonicalCircled === 'true') return true;
    const mount = group.querySelector('.sky-ph-node-glyph');
    const component = window.RelphiGlyphComponent;
    if (!mount || !component?.createBubble) return false;

    const oldNode = group.querySelector('.sky-ph-node');
    const isDay = group.classList.contains('is-day-ruler') || oldNode?.classList.contains('day');
    const isHour = group.classList.contains('is-hour-ruler') || oldNode?.classList.contains('hour');

    oldNode?.remove();
    group.querySelector('.sky-ph-node-label')?.remove();
    mount.replaceChildren();

    const bubble = component.createBubble(mount, key, {
      radius:20,
      padding:3,
      color:isHour ? WHITE : COLORS[key],
      fill:isHour ? COLORS[key] : WHITE
    });
    bubble.circle.setAttribute('stroke', COLORS[key]);
    bubble.circle.setAttribute('stroke-width', String(GLYPH_RING_STROKE));
    bubble.root.classList.add('sky-ph-canonical-bubble');
    bubble.root.dataset.planet = key;
    bubble.root.dataset.presentation = isHour ? 'hour-ruler-inversion' : isDay ? 'day-ruler-outline' : 'canonical-color';

    if (isDay) {
      bubble.root.classList.add('is-day-ruler');
      group.classList.add('is-day-ruler');
      addDayRulerRing(bubble, COLORS[key]);
    }
    if (isHour) {
      bubble.root.classList.add('is-hour-ruler');
      group.classList.add('is-hour-ruler');
    }

    const art = await bubble.ready;
    if (isHour) forceHourRulerInverse(art);
    group.dataset.canonicalCircled = 'true';
    return true;
  }

  function markHourBeforeReplacement(svg) {
    svg.querySelector('.sky-ph-node.day')?.closest('.sky-ph-planet')?.classList.add('is-day-ruler');
    svg.querySelector('.sky-ph-node.hour')?.closest('.sky-ph-planet')?.classList.add('is-hour-ruler');
  }

  async function correct(svg) {
    if (!svg || svg.dataset.canonicalHeptagramV2 === 'true' || svg.dataset.canonicalHeptagramV2 === 'pending') return;
    if (!svg.querySelector('.sky-ph-planet')) return;
    if (svg.dataset.canonicalSourceReady !== 'true') return;
    svg.dataset.canonicalHeptagramV2 = 'pending';

    try {
      svg.setAttribute('viewBox', '-28 -28 416 416');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.overflow = 'visible';

      markHourBeforeReplacement(svg);
      svg.querySelectorAll('.sky-ph-circle,.sky-ph-guide,.sky-ph-center-label,.sky-ph-node-label').forEach(node => node.remove());

      const results = await Promise.all(Array.from(svg.querySelectorAll('.sky-ph-planet')).map(replacePlanet));
      if (results.every(Boolean)) svg.dataset.canonicalHeptagramV2 = 'true';
      else delete svg.dataset.canonicalHeptagramV2;
    } catch (error) {
      delete svg.dataset.canonicalHeptagramV2;
      console.error('Sky Chart canonical heptagram correction failed:', error);
    }
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    if (node.matches?.('.sky-ph-heptagram')) void correct(node);
    node.querySelectorAll?.('.sky-ph-heptagram').forEach(svg => void correct(svg));
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(svg => void correct(svg));
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
