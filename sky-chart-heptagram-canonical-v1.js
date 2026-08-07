// Planetary Hours heptagram consumer for the single Master Glyph List runtime.
// Glyphs are rendered at the canonical 64×64 master size, then the complete circled unit is scaled uniformly.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramCanonicalV6) return;
  window.__relphiSkyHeptagramCanonicalV6 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const MASTER_RADIUS = 19;
  const DISPLAY_RADIUS = 17;
  const MASTER_SCALE = DISPLAY_RADIUS / MASTER_RADIUS;
  const KEYS = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const COLORS = Object.freeze({
    saturn:'#8c7a42', jupiter:'#41752f', mars:'#c9211e', sun:'#d08a00',
    venus:'#b23b79', mercury:'#277390', moon:'#58628a'
  });

  function keyFor(group) {
    return KEYS.find(key => group.classList.contains(`sky-ph-${key}`)) || '';
  }

  function legacyState(group) {
    const node = group.querySelector(':scope > .sky-ph-node');
    return {
      day:group.classList.contains('is-day-ruler') || node?.classList.contains('day') || false,
      hour:group.classList.contains('is-hour-ruler') || node?.classList.contains('hour') || false
    };
  }

  function stateName(state) {
    if (state.day && state.hour) return 'day-and-hour-ruler';
    if (state.day) return 'day-ruler';
    if (state.hour) return 'hour-ruler';
    return 'plain';
  }

  function clearCompetingPresentation(group) {
    group.querySelector(':scope > .sky-ph-node')?.remove();
    group.querySelector(':scope > .sky-ph-node-label')?.remove();
  }

  async function placePlanet(group) {
    const key = keyFor(group);
    const mount = group.querySelector(':scope > .sky-ph-node-glyph');
    if (!key || !mount) return;

    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(key) || registry.resolve(key));
    if (!entry || !component?.createBubble) {
      mount.replaceChildren();
      mount.dataset.glyphUnavailable = 'true';
      return;
    }

    const state = legacyState(group);
    clearCompetingPresentation(group);
    group.dataset.glyphState = stateName(state);
    group.classList.toggle('is-day-ruler', state.day);
    group.classList.toggle('is-hour-ruler', state.hour);

    mount.replaceChildren();
    delete mount.dataset.glyphUnavailable;
    mount.dataset.canonicalGlyphId = entry.id;
    mount.dataset.canonicalGlyphPresentation = 'circled';
    mount.dataset.masterGlyphViewBox = '-32 -32 64 64';
    mount.dataset.masterGlyphScale = String(MASTER_SCALE);
    mount.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';

    const master = document.createElementNS(NS, 'g');
    master.setAttribute('transform', `scale(${MASTER_SCALE})`);
    master.dataset.masterGlyphUnit = 'true';
    mount.appendChild(master);

    try {
      const bubble = component.createBubble(master, entry.id, {
        radius:MASTER_RADIUS,
        padding:1,
        color:COLORS[key]
      });
      await bubble.ready;
      bubble.root.dataset.heptagramCircledGlyph = 'true';
    } catch (error) {
      mount.replaceChildren();
      mount.dataset.glyphUnavailable = 'true';
      console.error('[Relphi heptagram glyph]', error);
    }
  }

  function correct(svg) {
    if (!svg || !svg.querySelector('.sky-ph-planet')) return;
    svg.querySelectorAll('.sky-ph-planet').forEach(group => { void placePlanet(group); });
    svg.dataset.canonicalHeptagramConsumer = 'true';
    svg.dataset.glyphPresentation = 'circled';
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    if (node.matches?.('.sky-ph-heptagram')) correct(node);
    node.querySelectorAll?.('.sky-ph-heptagram').forEach(correct);
  }

  function scan() {
    document.querySelectorAll('.sky-ph-heptagram').forEach(correct);
  }

  function start() {
    scan();
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(inspect)))
      .observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('relphi:sky-heptagram-source-ready',scan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();