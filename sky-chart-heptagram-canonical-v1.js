// Canonical circled planetary glyphs and unclipped Sky-card heptagram presentation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramCanonicalV1) return;
  window.__relphiSkyHeptagramCanonicalV1 = true;

  const KEYS = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const COLORS = {
    saturn:'#8c7a42', jupiter:'#41752f', mars:'#c9211e', sun:'#d08a00',
    venus:'#b23b79', mercury:'#277390', moon:'#58628a'
  };

  function keyFor(group) {
    return KEYS.find(key => group.classList.contains(`sky-ph-${key}`)) || '';
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

    // The hour-ruler inversion is created at draw time rather than imposed on
    // finished artwork. This preserves every canonical support stroke, scale,
    // offset, and relationship between filled and stroked forms.
    const bubble = component.createBubble(mount, key, {
      radius:20,
      padding:3,
      color:isHour ? '#fff' : COLORS[key],
      fill:isHour ? COLORS[key] : '#fff'
    });
    bubble.circle.setAttribute('stroke', COLORS[key]);
    bubble.root.classList.add('sky-ph-canonical-bubble');
    bubble.root.dataset.planet = key;
    bubble.root.dataset.presentation = isHour ? 'hour-ruler-inversion' : 'canonical-color';
    await bubble.ready;

    if (isDay) {
      bubble.root.classList.add('is-day-ruler');
      group.classList.add('is-day-ruler');
    }

    if (isHour) {
      bubble.root.classList.add('is-hour-ruler');
      group.classList.add('is-hour-ruler');
    }

    group.dataset.canonicalCircled = 'true';
    return true;
  }

  function markHourBeforeReplacement(svg) {
    svg.querySelector('.sky-ph-node.day')?.closest('.sky-ph-planet')?.classList.add('is-day-ruler');
    svg.querySelector('.sky-ph-node.hour')?.closest('.sky-ph-planet')?.classList.add('is-hour-ruler');
  }

  async function correct(svg) {
    if (!svg || svg.dataset.canonicalHeptagramV1 === 'true' || svg.dataset.canonicalHeptagramV1 === 'pending') return;
    if (!svg.querySelector('.sky-ph-planet')) return;
    if (svg.dataset.canonicalSourceReady !== 'true') return;
    svg.dataset.canonicalHeptagramV1 = 'pending';

    try {
      svg.setAttribute('viewBox', '-28 -28 416 416');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.style.overflow = 'visible';

      markHourBeforeReplacement(svg);
      svg.querySelectorAll('.sky-ph-circle,.sky-ph-guide,.sky-ph-center-label,.sky-ph-node-label').forEach(node => node.remove());

      const results = await Promise.all(Array.from(svg.querySelectorAll('.sky-ph-planet')).map(replacePlanet));
      if (results.every(Boolean)) svg.dataset.canonicalHeptagramV1 = 'true';
      else delete svg.dataset.canonicalHeptagramV1;
    } catch (error) {
      delete svg.dataset.canonicalHeptagramV1;
      console.error('Sky Chart canonical heptagram correction failed:', error);
    }
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(svg => void correct(svg));
  }

  const observer = new MutationObserver(scan);
  function start() {
    scan();
    observer.observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-heptagram-source-ready', scan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
