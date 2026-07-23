// Canonical glyph artwork and atomic bubble component.
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;
  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();

  function svg(name) { return document.createElementNS(NS, name); }

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  function thickenToNodeWeight(root, entry, color) {
    // Keep the approved weights for Nodes, Lilith, Fortune, and lettered points.
    if (
      entry.id === 'north-node' ||
      entry.id === 'south-node' ||
      entry.id === 'lilith' ||
      entry.id === 'part-of-fortune' ||
      entry.fitMode === 'letter'
    ) return;

    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      const current = parseFloat(node.getAttribute('stroke-width')) || 0;

      if (stroke && stroke !== 'none') {
        node.setAttribute('stroke', color);
        node.setAttribute('stroke-width', String(current + 0.9));
      } else if (fill && fill !== 'none') {
        node.setAttribute('stroke', color);
        node.setAttribute('stroke-width', '1.15');
        node.setAttribute('paint-order', 'stroke fill');
      }
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
    });
  }

  async function loadAsset(path) {
    if (cache.has(path)) return cache.get(path).cloneNode(true);
    const response = await fetch(path + '?v=13');
    if (!response.ok) throw new Error('Could not load glyph asset: ' + path);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    cache.set(path, source);
    return source.cloneNode(true);
  }

  function numericStrokeWidth(node) {
    const direct = parseFloat(node.getAttribute('stroke-width'));
    if (Number.isFinite(direct)) return direct;
    const computed = parseFloat(getComputedStyle(node).strokeWidth);
    return Number.isFinite(computed) ? computed : 0;
  }

  function largestStroke(root) {
    let max = numericStrokeWidth(root);
    root.querySelectorAll('*').forEach(node => { max = Math.max(max, numericStrokeWidth(node)); });
    return max;
  }

  function fit(node, radius, padding, entry, bubbleStrokeWidth) {
    node.removeAttribute('transform');

    // Lettered points use one literal typographic size. Do not width-fit,
    // compress, expand, or alter individual labels after font assignment.
    if (entry.fitMode === 'letter') {
      node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0})`);
      return;
    }

    let box;
    try { box = node.getBBox(); } catch (_) { return; }
    if (!box || !box.width || !box.height) return;

    const gap = Math.max(1, Number(padding) || 1);
    const boundaryInset = Math.max(0, Number(bubbleStrokeWidth) || 0) / 2;
    const availableRadius = Math.max(1, radius - boundaryInset - gap);
    const sourceStroke = largestStroke(node);
    const visibleWidth = box.width + sourceStroke;
    const visibleHeight = box.height + sourceStroke;
    let maximumScale;

    if (entry.fitMode === 'symbol') {
      const usableDiameter = availableRadius * 2;
      maximumScale = Math.min(usableDiameter / visibleWidth, usableDiameter / visibleHeight) * 0.9;
    } else if (entry.fitMode === 'box') {
      const innerSquareSide = availableRadius * Math.SQRT2;
      maximumScale = Math.min(innerSquareSide / visibleWidth, innerSquareSide / visibleHeight);
    } else {
      const halfW = visibleWidth / 2;
      const halfH = visibleHeight / 2;
      maximumScale = availableRadius / (Math.hypot(halfW, halfH) || 1);
    }

    const scale = maximumScale * Math.max(0.1, Number(entry.scale) || 1);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0}) scale(${scale}) translate(${-cx} ${-cy})`);
  }

  function sun(parent, color) {
    const group = svg('g');
    const ring = svg('circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', '10');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', color);
    ring.setAttribute('stroke-width', '1.45');
    const dot = svg('circle');
    dot.setAttribute('cx', '0');
    dot.setAttribute('cy', '0');
    dot.setAttribute('r', '2.15');
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', 'none');
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

  function lilith(parent, color) {
    const group = svg('g');

    // The crescent is intentionally solid and visually dominant.
    const crescent = svg('path');
    crescent.setAttribute('d', 'M2.7 -10.8C-3.9 -10.7-7.8-6.2-7.8 0C-7.8 6.3-3.8 10.8 2.7 10.8C-0.8 8.1-2.3 4.4-2.3 0C-2.3-4.4-0.8-8.1 2.7-10.8Z');
    crescent.setAttribute('fill', color);
    crescent.setAttribute('stroke', 'none');

    // The cross is weighted after the final glyph scale. non-scaling-stroke
    // prevents enlargement from making it heavier than the other crosses.
    const cross = svg('path');
    cross.setAttribute('d', 'M0 8.2V16.2M-4.1 12.2H4.1');
    cross.setAttribute('fill', 'none');
    cross.setAttribute('stroke', color);
    cross.setAttribute('stroke-width', '1.45');
    cross.setAttribute('stroke-linecap', 'round');
    cross.setAttribute('stroke-linejoin', 'round');
    cross.setAttribute('vector-effect', 'non-scaling-stroke');

    group.append(crescent, cross);
    parent.appendChild(group);
    return group;
  }

  function textGlyph(parent, entry, color) {
    const text = svg('text');
    const lettered = /^(ASC|DSC|MC|IC|Vx)$/.test(entry.fallback);
    text.textContent = entry.fallback;
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    text.style.fontFamily = lettered ? 'Arial,Helvetica,sans-serif' : 'Apple Symbols,Segoe UI Symbol,Noto Sans Symbols 2,serif';
    text.style.fontWeight = entry.fontWeight || (lettered ? '700' : '600');
    text.style.fontSize = lettered ? '16px' : '34px';
    if (entry.id === 'asc' || entry.id === 'dsc') text.style.letterSpacing = '0.45px';
    parent.appendChild(text);
    return text;
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

    if (entry.id === 'sun') {
      art = sun(parent, color);
    } else if (entry.id === 'lilith') {
      art = lilith(parent, color);
    } else if (entry.asset) {
      const source = await loadAsset(entry.asset);
      art = svg('g');
      Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
      parent.appendChild(art);
      recolor(art, color);
    } else if (entry.fallback === 'fortune') {
      art = fortune(parent, color);
    } else {
      art = textGlyph(parent, entry, color);
    }

    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    thickenToNodeWeight(art, entry, color);
    await new Promise(resolve => requestAnimationFrame(resolve));
    fit(art, radius, padding, entry, bubbleStrokeWidth);
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