// Canonical glyph artwork and uniform whole-artboard presentation.
// Visual authority: https://oracleofrelphi.com/glyphs-unified-preview.html
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANONICAL_BUBBLE_RADIUS = 19;
  const CANONICAL_BUBBLE_STROKE = 2.35;
  const CANONICAL_BUBBLE_PADDING = 1;
  const cache = new Map();
  const svg = name => document.createElementNS(NS, name);

  async function loadAsset(path) {
    if (!path) throw new Error('Canonical glyph asset is missing.');
    if (cache.has(path)) return cache.get(path).cloneNode(true);
    const response = await fetch(path + '?v=canonical-20260805');
    if (!response.ok) throw new Error('Could not load canonical glyph asset: ' + path);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    if (source.nodeName.toLowerCase() !== 'svg') throw new Error('Canonical glyph asset is not SVG: ' + path);
    if (!source.getAttribute('viewBox')) throw new Error('Canonical glyph asset has no authored viewBox: ' + path);
    cache.set(path, source);
    return source.cloneNode(true);
  }

  function tintAsUnit(root, color) {
    root.style.color = color;
    root.setAttribute('color', color);
    root.classList.add('relphi-canonical-tint');
  }

  function authoredFrame(parent, source, entry, options) {
    const radius = Number(options?.radius || 18);
    const padding = Number(options?.padding ?? 1);
    const bubbleStrokeWidth = Number(options?.bubbleStrokeWidth || 0);
    const gap = Math.max(1, padding);
    const usable = Math.max(1, radius - Math.max(0, bubbleStrokeWidth) / 2 - gap);
    const diameter = usable * 2;
    const nested = svg('svg');
    nested.setAttribute('x', String(-usable));
    nested.setAttribute('y', String(-usable));
    nested.setAttribute('width', String(diameter));
    nested.setAttribute('height', String(diameter));
    nested.setAttribute('viewBox', source.getAttribute('viewBox'));
    nested.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    nested.setAttribute('overflow', 'visible');
    Array.from(source.children).forEach(child => nested.appendChild(document.importNode(child, true)));
    nested.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    nested.dataset.authoredViewBox = source.getAttribute('viewBox');
    nested.dataset.glyphPresentation = 'authored-frame-uniform-scale';
    tintAsUnit(nested, options?.color || '#dc1f18');
    parent.appendChild(nested);
    return nested;
  }

  async function draw(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);
    if (!entry.asset) throw new Error('No authored canonical asset for glyph identity: ' + entry.id);
    const source = await loadAsset(entry.asset);
    return authoredFrame(parent, source, entry, options);
  }

  function createBubble(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);
    if (!entry.asset) throw new Error('No authored canonical asset for glyph identity: ' + entry.id);

    const requestedRadius = Number(options?.radius || CANONICAL_BUBBLE_RADIUS);
    const color = options?.color || '#dc1f18';
    const scale = requestedRadius / CANONICAL_BUBBLE_RADIUS;
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    root.dataset.canonicalBubbleRadius = String(CANONICAL_BUBBLE_RADIUS);
    root.dataset.requestedDisplayRadius = String(requestedRadius);
    root.dataset.canonicalBubblePresentation = 'uniform-master-scale';
    root.setAttribute('transform', `scale(${scale})`);
    root.setAttribute('visibility', 'hidden');

    const circle = svg('circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(CANONICAL_BUBBLE_RADIUS));
    circle.setAttribute('fill', options?.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(CANONICAL_BUBBLE_STROKE));
    root.appendChild(circle);
    parent.appendChild(root);

    const ready = draw(root, entry.id, {
      radius: CANONICAL_BUBBLE_RADIUS,
      padding: CANONICAL_BUBBLE_PADDING,
      color,
      bubbleStrokeWidth: CANONICAL_BUBBLE_STROKE
    }).then(art => {
      root.removeAttribute('visibility');
      return art;
    }).catch(error => {
      root.removeAttribute('visibility');
      throw error;
    });

    return { root, circle, entry, ready };
  }

  window.RelphiGlyphComponent = Object.freeze({
    draw,
    createBubble,
    fit: node => node,
    recolor: tintAsUnit,
    canonicalBubbleRadius: CANONICAL_BUBBLE_RADIUS,
    canonicalSource: 'https://oracleofrelphi.com/glyphs-unified-preview.html'
  });
})();
