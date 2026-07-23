// Canonical glyph artwork and atomic bubble component.
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;

  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();
  const MOON_PATH = 'M29.11,14.75 L26.50,16.24 L26.50,17.73 L27.62,18.85 L33.59,21.09 L37.32,23.70 L41.42,27.80 L44.78,32.65 L48.51,42.73 L49.25,51.68 L46.64,62.87 L42.91,69.59 L35.82,76.67 L27.24,80.40 L26.50,81.15 L26.50,83.02 L29.48,84.51 L35.08,85.63 L41.79,85.63 L50.37,83.76 L55.22,81.52 L62.31,76.30 L67.53,69.96 L70.15,65.11 L73.13,54.29 L73.13,46.46 L71.64,38.99 L69.03,32.65 L65.67,27.43 L61.19,22.58 L55.60,18.48 L51.87,16.61 L44.03,14.37 L34.70,14.00 Z M36.20,17.73 L45.90,18.48 L53.73,21.83 L57.83,24.82 L61.56,28.55 L65.67,34.52 L68.65,42.35 L69.40,47.95 L69.40,52.80 L67.91,60.26 L63.06,69.59 L54.48,77.42 L47.02,80.78 L39.93,81.90 L35.82,81.15 L44.03,74.44 L48.88,67.35 L52.24,57.65 L52.98,48.32 L51.49,38.99 L48.13,30.79 L43.66,24.45 L36.20,18.48 Z';

  function svg(name) {
    return document.createElementNS(NS, name);
  }

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill && fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  function thickenToNodeWeight(root, entry, color) {
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
    const response = await fetch(path + '?v=14');
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
    root.querySelectorAll('*').forEach(node => {
      max = Math.max(max, numericStrokeWidth(node));
    });
    return max;
  }

  function availableRadius(radius, padding, bubbleStrokeWidth) {
    const gap = Math.max(1, Number(padding) || 1);
    const boundaryInset = Math.max(0, Number(bubbleStrokeWidth) || 0) / 2;
    return Math.max(1, radius - boundaryInset - gap);
  }

  function fit(node, radius, padding, entry, bubbleStrokeWidth) {
    node.removeAttribute('transform');

    if (entry.fitMode === 'letter') {
      node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0})`);
      return;
    }

    if (entry.fitMode === 'lilith') {
      const referenceAvailableRadius = 16.825;
      const scale = availableRadius(radius, padding, bubbleStrokeWidth) / referenceAvailableRadius * (Number(entry.scale) || 1);
      node.setAttribute('transform', `translate(0 ${entry.dy || 0}) scale(${scale})`);
      return;
    }

    let box;
    try {
      box = node.getBBox();
    } catch (_) {
      return;
    }
    if (!box || !box.width || !box.height) return;

    const usableRadius = availableRadius(radius, padding, bubbleStrokeWidth);
    const sourceStroke = largestStroke(node);
    const visibleWidth = box.width + sourceStroke;
    const visibleHeight = box.height + sourceStroke;
    let maximumScale;

    if (entry.fitMode === 'symbol') {
      const usableDiameter = usableRadius * 2;
      maximumScale = Math.min(usableDiameter / visibleWidth, usableDiameter / visibleHeight) * 0.9;
    } else if (entry.fitMode === 'box') {
      const innerSquareSide = usableRadius * Math.SQRT2;
      maximumScale = Math.min(innerSquareSide / visibleWidth, innerSquareSide / visibleHeight);
    } else {
      maximumScale = usableRadius / (Math.hypot(visibleWidth / 2, visibleHeight / 2) || 1);
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

    // Reuse Luna's approved crescent geometry at an intermediate size. The
    // horizontal offset balances the crescent's visible mass around x=0.
    const crescentGroup = svg('g');
    crescentGroup.setAttribute('transform', 'translate(2.15 -4.35) scale(.22) translate(-49.8 -49.8)');
    const crescent = svg('path');
    crescent.setAttribute('d', MOON_PATH);
    crescent.setAttribute('fill', color);
    crescent.setAttribute('fill-rule', 'evenodd');
    crescent.setAttribute('clip-rule', 'evenodd');
    crescent.setAttribute('stroke', 'none');
    crescentGroup.appendChild(crescent);

    // The cross remains on the bubble's fixed vertical centerline. Its
    // geometry and 1.45 stroke match the established planetary crosses.
    const cross = svg('path');
    cross.setAttribute('d', 'M0 3.7V14.4M-4 9.35H4');
    cross.setAttribute('fill', 'none');
    cross.setAttribute('stroke', color);
    cross.setAttribute('stroke-width', '1.45');
    cross.setAttribute('stroke-linecap', 'round');
    cross.setAttribute('stroke-linejoin', 'round');

    group.append(crescentGroup, cross);
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