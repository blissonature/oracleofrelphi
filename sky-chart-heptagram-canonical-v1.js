// Planetary Hours heptagram consumer for the single Master Glyph List runtime.
// The complete canonical glyph pass is awaitable so Sky cards reveal only the final heptagram state.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHeptagramCanonicalV10) return;
  window.__relphiSkyHeptagramCanonicalV9 = true;
  window.__relphiSkyHeptagramCanonicalV10 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const MASTER_RADIUS = 19;
  const DISPLAY_RADIUS = 17;
  const MASTER_SCALE = DISPLAY_RADIUS / MASTER_RADIUS;
  const DAY_RING_INNER_RADIUS = 23;
  const DAY_RING_OUTER_RADIUS = 27;
  const KEYS = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const COLORS = Object.freeze({
    saturn:'#8c7a42', jupiter:'#41752f', mars:'#c9211e', sun:'#d08a00',
    venus:'#b23b79', mercury:'#277390', moon:'#58628a'
  });
  const pending = new WeakMap();

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

  function clearHeptagramWords(svg) {
    svg.querySelectorAll('text').forEach(node => node.remove());
    svg.dataset.wordPresentation = 'glyph-only';
  }

  function dayRulerRing(radius, color, role) {
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', String(radius));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('vector-effect', 'non-scaling-stroke');
    ring.classList.add('sky-ph-day-ruler-ring', `sky-ph-day-ruler-ring--${role}`);
    ring.dataset.dayRulerRing = role;
    ring.setAttribute('aria-hidden', 'true');
    return ring;
  }

  function addDayRulerHalo(master, color) {
    const halo = document.createElementNS(NS, 'g');
    halo.classList.add('sky-ph-day-ruler-halo');
    halo.dataset.dayRulerState = 'true';
    halo.append(
      dayRulerRing(DAY_RING_INNER_RADIUS, color, 'inner'),
      dayRulerRing(DAY_RING_OUTER_RADIUS, color, 'outer')
    );
    master.appendChild(halo);
    return halo;
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
    const stateId = stateName(state);
    const planetColor = COLORS[key];
    clearCompetingPresentation(group);
    group.dataset.glyphState = stateId;
    group.classList.toggle('is-day-ruler', state.day);
    group.classList.toggle('is-hour-ruler', state.hour);

    mount.replaceChildren();
    delete mount.dataset.glyphUnavailable;
    mount.dataset.canonicalGlyphId = entry.id;
    mount.dataset.canonicalGlyphPresentation = 'circled';
    mount.dataset.masterGlyphViewBox = '-32 -32 64 64';
    mount.dataset.masterGlyphScale = String(MASTER_SCALE);
    mount.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    mount.dataset.planetaryHourState = stateId;

    const master = document.createElementNS(NS, 'g');
    master.setAttribute('transform', `scale(${MASTER_SCALE})`);
    master.dataset.masterGlyphUnit = 'true';
    master.dataset.planetaryHourState = stateId;
    mount.appendChild(master);

    if (state.day) addDayRulerHalo(master, planetColor);

    try {
      const bubble = component.createBubble(master, entry.id, {
        radius:MASTER_RADIUS,
        padding:1,
        color:state.hour ? '#ffffff' : planetColor,
        fill:state.hour ? planetColor : '#ffffff',
        strokeWidth:state.hour ? 2.8 : 2.35
      });
      bubble.circle.setAttribute('stroke', planetColor);
      bubble.circle.dataset.planetaryHourState = stateId;
      await bubble.ready;
      bubble.root.dataset.heptagramCircledGlyph = 'true';
      bubble.root.dataset.planetaryHourState = stateId;
    } catch (error) {
      mount.replaceChildren();
      mount.dataset.glyphUnavailable = 'true';
      console.error('[Relphi heptagram glyph]', error);
    }
  }

  async function correct(svg) {
    if (!svg || !svg.querySelector('.sky-ph-planet')) return false;
    if (svg.dataset.canonicalHeptagramReady === 'true') return true;
    if (pending.has(svg)) return pending.get(svg);

    const job = (async () => {
      svg.dataset.canonicalHeptagramBusy = 'true';
      clearHeptagramWords(svg);
      await Promise.all(Array.from(svg.querySelectorAll('.sky-ph-planet')).map(placePlanet));
      clearHeptagramWords(svg);
      svg.dataset.canonicalHeptagramConsumer = 'true';
      svg.dataset.glyphPresentation = 'circled';
      svg.dataset.rulerStates = 'day-double-ring-hour-fill';
      svg.dataset.canonicalHeptagramReady = 'true';
      delete svg.dataset.canonicalHeptagramBusy;
      window.dispatchEvent(new CustomEvent('relphi:sky-heptagram-canonical-ready',{detail:{svg}}));
      return true;
    })();

    pending.set(svg, job);
    try { return await job; }
    finally { pending.delete(svg); }
  }

  async function scan() {
    await Promise.allSettled(Array.from(document.querySelectorAll('.sky-ph-heptagram')).map(correct));
  }

  window.RelphiSkyHeptagramCanonical = Object.freeze({ correct, scan });

  function start() {
    void scan();
    window.addEventListener('relphi:sky-heptagram-source-ready', () => { void scan(); });
    window.addEventListener('relphi:sky-foundation-ready', () => { void scan(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
