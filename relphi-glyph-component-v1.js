// Canonical glyph artwork and atomic bubble component.
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;

  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();
  const svg = name => document.createElementNS(NS, name);

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill && fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  async function loadAsset(path) {
    if (cache.has(path)) return cache.get(path).cloneNode(true);
    const response = await fetch(path + '?v=25');
    if (!response.ok) throw new Error('Could not load glyph asset: ' + path);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    if (source.nodeName.toLowerCase() !== 'svg') throw new Error('Glyph asset is not an SVG: ' + path);
    if (!source.getAttribute('viewBox')) throw new Error('Glyph asset has no authored viewBox: ' + path);
    cache.set(path, source);
    return source.cloneNode(true);
  }

  function availableRadius(radius, padding, bubbleStrokeWidth) {
    const gap = Math.max(1, Number(padding) || 1);
    return Math.max(1, radius - Math.max(0, Number(bubbleStrokeWidth) || 0) / 2 - gap);
  }

  function canonicalAssetFrame(parent, source, radius, padding, bubbleStrokeWidth, color, entry) {
    const usableRadius = availableRadius(radius, padding, bubbleStrokeWidth);
    const frame = svg('svg');
    frame.setAttribute('x', String(-usableRadius));
    frame.setAttribute('y', String(-usableRadius));
    frame.setAttribute('width', String(usableRadius * 2));
    frame.setAttribute('height', String(usableRadius * 2));
    frame.setAttribute('viewBox', source.getAttribute('viewBox'));
    frame.setAttribute('preserveAspectRatio', source.getAttribute('preserveAspectRatio') || 'xMidYMid meet');
    frame.setAttribute('overflow', 'visible');
    frame.dataset.glyphPresentation = 'authored-viewbox';
    frame.dataset.canonicalAsset = entry.asset;
    frame.dataset.canonicalViewBox = source.getAttribute('viewBox');
    Array.from(source.children).forEach(child => frame.appendChild(document.importNode(child, true)));
    recolor(frame, color);
    parent.appendChild(frame);
    return frame;
  }

  function sun(parent, color) {
    const group = svg('g');
    const ring = svg('circle');
    ring.setAttribute('r', '10');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '1.45');
    const dot = svg('circle');
    dot.setAttribute('r', '2.15');
    dot.setAttribute('fill', color);
    group.append(ring, dot);
    parent.appendChild(group);
    return group;
  }

  function fortune(parent, color) {
    const group = svg('g');
    group.innerHTML = '<circle cx="0" cy="0" r="9" fill="none"/><path d="M-6.35-6.35L6.35 6.35M6.35-6.35L-6.35 6.35" fill="none"/>';
    group.querySelectorAll('*').forEach(node => {
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '1.45');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
    });
    parent.appendChild(group);
    return group;
  }

  function textGlyph(parent, entry, color) {
    const text = svg('text');
    const aspectLetter = entry.fitMode === 'aspect-letter';
    const hebrewLetter = entry.fitMode === 'hebrew-letter';
    const greekLetter = entry.fitMode === 'greek-letter';
    const lettered = entry.fitMode === 'letter' || aspectLetter || hebrewLetter || greekLetter;
    text.textContent = entry.fallback;
    text.setAttribute('x', String(entry.dx || 0));
    text.setAttribute('y', String((entry.dy || 0) + (hebrewLetter ? -2 : 0)));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    if (hebrewLetter) {
      text.setAttribute('direction', 'rtl');
      text.style.fontFamily = 'Noto Serif Hebrew,SBL Hebrew,Ezra SIL,David Libre,Times New Roman,serif';
    } else if (greekLetter) {
      text.style.fontFamily = 'Noto Serif,Times New Roman,Georgia,serif';
    } else {
      text.style.fontFamily = lettered ? 'Arial,Helvetica,sans-serif' : 'Apple Symbols,Segoe UI Symbol,Noto Sans Symbols 2,serif';
    }
    text.style.fontWeight = entry.fontWeight || (lettered ? '700' : '600');
    text.style.fontSize = hebrewLetter ? '31px' : greekLetter ? '30px' : aspectLetter ? '24px' : lettered ? '16px' : '34px';
    if (entry.id === 'asc' || entry.id === 'dsc') text.style.letterSpacing = '-0.35px';
    text.dataset.glyphPresentation = 'fixed-text';
    parent.appendChild(text);
    return text;
  }

  // Retained only for API compatibility. Canonical SVG assets are never measured
  // or refitted; their authored viewBox is the complete coordinate system.
  function fit(node) {
    return node;
  }

  async function draw(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 18);
    const padding = Number(options?.padding ?? 1);
    const color = options?.color || '#dc1f18';
    const bubbleStrokeWidth = Number(options?.bubbleStrokeWidth || 0);
    let art;

    if (entry.id === 'sun') art = sun(parent, color);
    else if (entry.asset) {
      const source = await loadAsset(entry.asset);
      art = canonicalAssetFrame(parent, source, radius, padding, bubbleStrokeWidth, color, entry);
    } else if (entry.fallback === 'fortune') art = fortune(parent, color);
    else art = textGlyph(parent, entry, color);

    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    art.dataset.glyphReady = 'true';
    return art;
  }

  function createBubble(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 19);
    const color = options?.color || '#dc1f18';
    const strokeWidth = Number(options?.strokeWidth || 2.35);
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    const circle = svg('circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', options?.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    root.appendChild(circle);
    parent.appendChild(root);
    const ready = draw(root, entry.id, {
      radius,
      padding: options?.padding ?? 1,
      color,
      bubbleStrokeWidth: strokeWidth
    });
    return { root, circle, entry, ready };
  }

  window.RelphiGlyphComponent = Object.freeze({ draw, createBubble, fit, recolor });
})();