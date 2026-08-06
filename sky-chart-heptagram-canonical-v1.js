// Planetary Hours heptagram canonical-state consumer.
// This module places immutable canonical assets; it never draws or repairs glyph geometry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramCanonicalV3) return;
  window.__relphiSkyHeptagramCanonicalV3 = true;

  const KEYS = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const COLORS = Object.freeze({
    saturn:'#8c7a42', jupiter:'#41752f', mars:'#c9211e', sun:'#d08a00',
    venus:'#b23b79', mercury:'#277390', moon:'#58628a'
  });
  const DISPLAY_SIZE = 38;

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

  function clearLegacyPresentation(group) {
    group.querySelector(':scope > .sky-ph-node')?.remove();
    group.querySelector(':scope > .sky-ph-node-label')?.remove();
    group.classList.remove('is-day-ruler','is-hour-ruler');
  }

  function placePlanet(group) {
    const key = keyFor(group);
    const mount = group.querySelector(':scope > .sky-ph-node-glyph');
    if (!key || !mount) return;

    const state = legacyState(group);
    const requestedState = stateName(state);
    clearLegacyPresentation(group);
    group.dataset.glyphState = requestedState;
    group.classList.toggle('is-day-ruler', state.day);
    group.classList.toggle('is-hour-ruler', state.hour);

    const placer = window.RelphiCanonicalGlyphState;
    const supported = new Set(placer?.supportedStates?.() || []);
    if (!placer || !supported.has(requestedState)) {
      mount.replaceChildren();
      mount.dataset.glyphUnavailable = 'true';
      mount.dataset.requestedGlyphState = requestedState;
      return;
    }

    delete mount.dataset.glyphUnavailable;
    delete mount.dataset.requestedGlyphState;
    const color = COLORS[key];
    const hourPresentation = state.hour;
    placer.place(mount,key,{
      state:requestedState,
      size:DISPLAY_SIZE,
      label:key,
      baseColor:hourPresentation ? '#fff' : color,
      overlayColor:color,
      overlayFill:hourPresentation ? color : '#fff',
      overlayStroke:color
    });
  }

  function correct(svg) {
    if (!svg || !svg.querySelector('.sky-ph-planet')) return;
    svg.querySelectorAll('.sky-ph-planet').forEach(placePlanet);
    svg.dataset.canonicalHeptagramStateConsumer = 'true';
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
