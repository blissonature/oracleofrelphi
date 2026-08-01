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
    if (!key || group.dataset.canonicalCircled === 'true') return;
    const mount = group.querySelector('.sky-ph-node-glyph');
    if (!mount || !window.RelphiGlyphComponent?.createBubble) return;

    group.querySelector('.sky-ph-node')?.remove();
    group.querySelector('.sky-ph-node-label')?.remove();
    mount.replaceChildren();

    const activeHour = group.classList.contains(`sky-ph-${key}`) &&
      group.querySelector('.sky-ph-node-glyph')?.parentElement?.querySelector('.sky-ph-node.hour');
    const color = COLORS[key];
    const isHour = group.classList.contains('is-hour-ruler') || false;

    // createBubble is the approved canonical circled glyph component. It owns both
    // the circle and the canonical artwork; no replacement ring is drawn here.
    const bubble = window.RelphiGlyphComponent.createBubble(mount, key, {
      radius:20,
      padding:3,
      color,
      fill:'#fff'
    });
    bubble.root.classList.add('sky-ph-canonical-bubble');
    bubble.root.dataset.planet = key;
    await bubble.ready;

    // The renderer identifies the current hour by the original dark-filled node.
    // Preserve that semantic before the old node is removed, then give its canonical
    // artwork the required white contrast without changing any SVG geometry.
    if (activeHour || isHour) {
      bubble.circle.setAttribute('fill', color);
      const artwork = Array.from(bubble.root.children).find(node => node !== bubble.circle);
      if (artwork) window.RelphiGlyphComponent.recolor(artwork, '#fff');
      bubble.root.classList.add('is-hour-ruler');
    }
    group.dataset.canonicalCircled = 'true';
  }

  function markHourBeforeReplacement(svg) {
    const hourNode = svg.querySelector('.sky-ph-node.hour');
    hourNode?.closest('.sky-ph-planet')?.classList.add('is-hour-ruler');
  }

  async function correct(svg) {
    if (!svg || svg.dataset.canonicalHeptagramV1 === 'true') return;
    if (!svg.querySelector('.sky-ph-planet')) return;
    svg.dataset.canonicalHeptagramV1 = 'true';
    svg.setAttribute('viewBox', '-28 -28 416 416');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    markHourBeforeReplacement(svg);
    svg.querySelectorAll('.sky-ph-circle,.sky-ph-guide,.sky-ph-center-label,.sky-ph-node-label').forEach(node => node.remove());
    await Promise.all(Array.from(svg.querySelectorAll('.sky-ph-planet')).map(replacePlanet));
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(svg => void correct(svg));
  }

  const observer = new MutationObserver(scan);
  function start() {
    scan();
    observer.observe(document.documentElement, { childList:true, subtree:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
