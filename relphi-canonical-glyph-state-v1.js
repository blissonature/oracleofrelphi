// Canonical glyph placement contract.
// This module never draws, fits, crops, normalizes, or repairs glyph geometry.
// It places only pre-authored canonical SVG markup and approved pre-authored state overlays.
(function () {
  'use strict';
  if (window.RelphiCanonicalGlyphState) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const EXPECTED_GLYPH_COUNT = 93;
  const REQUIRED_STATES = Object.freeze(['plain', 'circled']);
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

    REQUIRED_STATES.forEach(function (state) {
      invariant(Array.isArray(candidate.states[state]), 'Missing required canonical state definition: ' + state + '.');
    });
    Object.entries(candidate.states).forEach(function ([state, layers]) {
      invariant(Array.isArray(layers), 'Canonical state "' + state + '" must be an array of approved overlays.');
      layers.forEach(function (layerId) {
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

  function numericSize(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
    const parsed = Number.parseFloat(String(value || ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function applyLayerPaint(node, options, layerId) {
    const layerColors = options && options.layerColors;
    const color = layerColors && layerColors[layerId] || options && options.overlayColor || options && options.color;
    if (color) node.style.color = color;
    const fills = options && options.layerFills;
    const strokes = options && options.layerStrokes;
    const fill = fills && fills[layerId] || options && options.overlayFill;
    const stroke = strokes && strokes[layerId] || options && options.overlayStroke;
    if (fill) node.style.setProperty('--relphi-state-fill', fill);
    if (stroke) node.style.setProperty('--relphi-state-stroke', stroke);
  }

  function configureSvgBox(node, size) {
    const value = numericSize(size);
    if (!value) return;
    const half = value / 2;
    node.setAttribute('x', String(-half));
    node.setAttribute('y', String(-half));
    node.setAttribute('width', String(value));
    node.setAttribute('height', String(value));
    node.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  function place(target, identity, options) {
    invariant(target instanceof Element, 'A DOM target is required.');
    invariant(manifest, 'Canonical manifest has not been registered.');
    const state = String(options && options.state || 'plain');
    invariant(Object.prototype.hasOwnProperty.call(manifest.states, state), 'Illegal or unregistered glyph state: ' + state + '.');
    const glyph = resolve(identity);
    const stateLayers = manifest.states[state];
    const svgTarget = target.namespaceURI === SVG_NS;
    const host = svgTarget ? document.createElementNS(SVG_NS, 'g') : document.createElement('span');

    host.classList.add('relphi-canonical-glyph-state');
    host.dataset.glyphId = glyph.id;
    host.dataset.glyphState = state;
    host.dataset.canonicalSource = manifest.source;
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', options && options.label || glyph.name || glyph.id);

    if (!svgTarget && options && options.size) {
      const size = typeof options.size === 'number' ? options.size + 'px' : String(options.size);
      host.style.width = size;
      host.style.height = size;
    }

    stateLayers.forEach(function (layerId) {
      const layerEntry = manifest.layers[layerId];
      const layer = cloneMarkup(layerEntry.markup, 'State overlay "' + layerId + '"');
      layer.classList.add('relphi-canonical-glyph-state__overlay');
      layer.dataset.overlayId = layerId;
      layer.setAttribute('aria-hidden', 'true');
      applyLayerPaint(layer, options, layerId);
      if (svgTarget) configureSvgBox(layer, options && options.size);
      host.appendChild(layer);
    });

    const base = cloneMarkup(glyph.markup, 'Glyph "' + glyph.id + '"');
    base.classList.add('relphi-canonical-glyph-state__base');
    base.setAttribute('aria-hidden', 'true');
    const baseColor = options && options.baseColor || options && options.color;
    if (baseColor) base.style.color = baseColor;
    if (svgTarget) configureSvgBox(base, options && options.size);
    host.appendChild(base);

    target.replaceChildren(host);
    return host;
  }

  function installStyles() {
    if (document.getElementById('relphiCanonicalGlyphStateStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiCanonicalGlyphStateStyles';
    style.textContent = [
      'span.relphi-canonical-glyph-state{position:relative;display:inline-block;inline-size:1em;block-size:1em;overflow:visible;color:currentColor;vertical-align:middle}',
      'span.relphi-canonical-glyph-state>svg{position:absolute;inset:0;display:block;width:100%;height:100%;overflow:visible}'
    ].join('');
    document.head.appendChild(style);
  }

  installStyles();
  window.RelphiCanonicalGlyphState = Object.freeze({
    expectedGlyphCount: EXPECTED_GLYPH_COUNT,
    requiredStates: REQUIRED_STATES,
    registerManifest,
    resolve,
    place,
    source: 'https://oracleofrelphi.com/glyphs-unified-preview.html',
    supportedStates: function () { return manifest ? Object.freeze(Object.keys(manifest.states)) : Object.freeze([]); }
  });
})();
