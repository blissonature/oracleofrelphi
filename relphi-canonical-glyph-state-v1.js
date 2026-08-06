// Canonical glyph placement contract.
// This module never draws, fits, crops, normalizes, or repairs glyph geometry.
// It places only pre-authored canonical SVG markup and approved pre-authored state overlays.
(function () {
  'use strict';
  if (window.RelphiCanonicalGlyphState) return;

  const EXPECTED_GLYPH_COUNT = 93;
  const ALLOWED_STATES = Object.freeze([
    'plain',
    'circled',
    'day-ruler',
    'hour-ruler',
    'day-hour-ruler'
  ]);
  const FORBIDDEN_NODES = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed']);
  let manifest = null;

  function invariant(condition, message) {
    if (!condition) throw new Error('[Relphi canonical glyph state] ' + message);
  }

  function normalize(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toLowerCase();
  }

  function parseSvg(markup, label) {
    invariant(typeof markup === 'string' && markup.trim(), label + ' is missing SVG markup.');
    const documentNode = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const parserError = documentNode.querySelector('parsererror');
    invariant(!parserError, label + ' is not valid SVG.');
    const svg = documentNode.documentElement;
    invariant(svg && svg.localName === 'svg', label + ' must have an SVG root.');
    invariant(svg.hasAttribute('viewBox'), label + ' must preserve its authored viewBox.');
    svg.querySelectorAll('*').forEach(function (node) {
      invariant(!FORBIDDEN_NODES.has(node.localName), label + ' contains a forbidden node: ' + node.localName + '.');
    });
    return svg;
  }

  function validateLayer(layerId, layers) {
    const layer = layers[layerId];
    invariant(layer && typeof layer === 'object', 'Missing approved state overlay: ' + layerId + '.');
    const svg = parseSvg(layer.markup, 'State overlay "' + layerId + '"');
    invariant(svg.getAttribute('viewBox') === layer.viewBox, 'State overlay "' + layerId + '" changed its authored viewBox.');
  }

  function registerManifest(candidate) {
    invariant(!manifest, 'The canonical manifest is already registered.');
    invariant(candidate && typeof candidate === 'object', 'Manifest is required.');
    invariant(candidate.source === 'https://oracleofrelphi.com/glyphs-unified-preview.html', 'The official Master Glyph List must be the sole source.');
    invariant(candidate.glyphs && typeof candidate.glyphs === 'object', 'Manifest glyph table is missing.');
    invariant(candidate.layers && typeof candidate.layers === 'object', 'Manifest state-overlay table is missing.');
    invariant(candidate.states && typeof candidate.states === 'object', 'Manifest state table is missing.');

    const ids = Object.keys(candidate.glyphs);
    invariant(ids.length === EXPECTED_GLYPH_COUNT, 'Expected exactly ' + EXPECTED_GLYPH_COUNT + ' canonical glyphs; received ' + ids.length + '.');

    ids.forEach(function (id) {
      const entry = candidate.glyphs[id];
      invariant(entry && typeof entry === 'object', 'Invalid glyph entry: ' + id + '.');
      invariant(entry.id === id, 'Glyph entry key/id mismatch: ' + id + '.');
      const svg = parseSvg(entry.markup, 'Glyph "' + id + '"');
      invariant(svg.getAttribute('viewBox') === entry.viewBox, 'Glyph "' + id + '" changed its authored viewBox.');
      invariant(!entry.crop && !entry.fit && !entry.transform, 'Glyph "' + id + '" contains prohibited fitting metadata.');
    });

    ALLOWED_STATES.forEach(function (state) {
      invariant(Array.isArray(candidate.states[state]), 'Missing canonical state definition: ' + state + '.');
      candidate.states[state].forEach(function (layerId) {
        validateLayer(layerId, candidate.layers);
      });
    });

    manifest = Object.freeze(candidate);
    return manifest;
  }

  function resolve(identity) {
    invariant(manifest, 'Canonical manifest has not been registered.');
    const direct = normalize(identity);
    if (manifest.glyphs[direct]) return manifest.glyphs[direct];
    const resolved = manifest.aliases && manifest.aliases[direct];
    invariant(resolved && manifest.glyphs[resolved], 'Unknown canonical glyph identity: ' + identity + '.');
    return manifest.glyphs[resolved];
  }

  function cloneMarkup(markup, label) {
    const svg = parseSvg(markup, label);
    return document.importNode(svg, true);
  }

  function place(target, identity, options) {
    invariant(target instanceof Element, 'A DOM target is required.');
    const state = String(options && options.state || 'plain');
    invariant(ALLOWED_STATES.includes(state), 'Illegal glyph state: ' + state + '.');
    const glyph = resolve(identity);
    const stateLayers = manifest.states[state];

    const host = document.createElement('span');
    host.className = 'relphi-canonical-glyph-state';
    host.dataset.glyphId = glyph.id;
    host.dataset.glyphState = state;
    host.dataset.canonicalSource = manifest.source;
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', options && options.label || glyph.name || glyph.id);
    if (options && options.color) host.style.color = options.color;
    if (options && options.size) {
      const size = typeof options.size === 'number' ? options.size + 'px' : String(options.size);
      host.style.width = size;
      host.style.height = size;
    }

    const base = cloneMarkup(glyph.markup, 'Glyph "' + glyph.id + '"');
    base.classList.add('relphi-canonical-glyph-state__base');
    base.setAttribute('aria-hidden', 'true');
    host.appendChild(base);

    stateLayers.forEach(function (layerId) {
      const layerEntry = manifest.layers[layerId];
      const layer = cloneMarkup(layerEntry.markup, 'State overlay "' + layerId + '"');
      layer.classList.add('relphi-canonical-glyph-state__overlay');
      layer.dataset.overlayId = layerId;
      layer.setAttribute('aria-hidden', 'true');
      host.appendChild(layer);
    });

    target.replaceChildren(host);
    return host;
  }

  function installStyles() {
    if (document.getElementById('relphiCanonicalGlyphStateStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiCanonicalGlyphStateStyles';
    style.textContent = [
      '.relphi-canonical-glyph-state{position:relative;display:inline-block;inline-size:1em;block-size:1em;overflow:visible;color:currentColor;vertical-align:middle}',
      '.relphi-canonical-glyph-state>svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}',
      '.relphi-canonical-glyph-state__base,.relphi-canonical-glyph-state__overlay{transform:none!important;clip-path:none!important;mask:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  installStyles();
  window.RelphiCanonicalGlyphState = Object.freeze({
    expectedGlyphCount: EXPECTED_GLYPH_COUNT,
    allowedStates: ALLOWED_STATES,
    registerManifest,
    resolve,
    place,
    source: 'https://oracleofrelphi.com/glyphs-unified-preview.html'
  });
})();
