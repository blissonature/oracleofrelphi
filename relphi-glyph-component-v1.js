// Canonical glyph artwork and atomic bubble component.
(function () {
  'use strict';
  if (window.RelphiGlyphComponent) return;

  const NS = 'http://www.w3.org/2000/svg';
  const cache = new Map();
  const fitMetrics = new Map();
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

  function thickenToNodeWeight(root, entry, color) {
    if (
      entry.fitMode === 'static-master' ||
      entry.id === 'north-node' ||
      entry.id === 'south-node' ||
      entry.fitMode === 'letter' ||
      entry.fitMode === 'hebrew-letter' ||
      entry.fitMode === 'greek-letter' ||
      String(entry.asset || '').startsWith('assets/zodiac-glyphs/') ||
      String(entry.asset || '').startsWith('assets/element-glyphs/') ||
      String(entry.asset || '').startsWith('assets/aspect-glyphs/')
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
    const response = await fetch(path + '?v=24');
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

  function validBox(box) {
    return !!box && Number.isFinite(box.x) && Number.isFinite(box.y) &&
      Number.isFinite(box.width) && Number.isFinite(box.height) && box.width > 0 && box.height > 0;
  }

  function mountedBox(node) {
    try {
      const box = node.getBBox();
      return validBox(box) ? box : null;
    } catch (_) {
      return null;
    }
  }

  function probeBox(node) {
    const parent = document.body || document.documentElement;
    if (!parent) return null;
    const probe = svg('svg');
    probe.setAttribute('viewBox', '-256 -256 512 512');
    probe.setAttribute('aria-hidden', 'true');
    probe.dataset.relphiGlyphMeasureProbe = 'true';
    Object.assign(probe.style, {
      position:'fixed',
      left:'-10000px',
      top:'-10000px',
      width:'512px',
      height:'512px',
      visibility:'hidden',
      pointerEvents:'none',
      overflow:'visible'
    });
    const clone = node.cloneNode(true);
    clone.removeAttribute('transform');
    clone.style.visibility = 'visible';
    probe.appendChild(clone);
    parent.appendChild(probe);
    try {
      const box = clone.getBBox();
      return validBox(box) ? box : null;
    } catch (_) {
      return null;
    } finally {
      probe.remove();
    }
  }

  function metricsFor(node, entry) {
    const cached = fitMetrics.get(entry.id);
    if (cached) return cached;
    const box = mountedBox(node) || probeBox(node);
    if (!box) return null;
    const metrics = Object.freeze({
      x:box.x,
      y:box.y,
      width:box.width,
      height:box.height,
      stroke:largestStroke(node)
    });
    fitMetrics.set(entry.id, metrics);
    return metrics;
  }

  function availableRadius(radius, padding, bubbleStrokeWidth) {
    const gap = Math.max(1, Number(padding) || 1);
    return Math.max(1, radius - Math.max(0, Number(bubbleStrokeWidth) || 0) / 2 - gap);
  }

  function fit(node, radius, padding, entry, bubbleStrokeWidth) {
    if (entry.fitMode === 'static-master') return true;
    node.removeAttribute('transform');

    if (entry.fitMode === 'letter' || entry.fitMode === 'hebrew-letter' || entry.fitMode === 'greek-letter') {
      node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0})`);
      return true;
    }

    const metrics = metricsFor(node, entry);
    if (!metrics) return false;

    const usableRadius = availableRadius(radius, padding, bubbleStrokeWidth);
    const visibleWidth = metrics.width + metrics.stroke;
    const visibleHeight = metrics.height + metrics.stroke;
    let maximumScale;

    if (entry.fitMode === 'symbol') {
      maximumScale = Math.min((usableRadius * 2) / visibleWidth, (usableRadius * 2) / visibleHeight) * 0.9;
    } else if (entry.fitMode === 'box') {
      const innerSquareSide = usableRadius * Math.SQRT2;
      maximumScale = Math.min(innerSquareSide / visibleWidth, innerSquareSide / visibleHeight);
    } else {
      maximumScale = usableRadius / (Math.hypot(visibleWidth / 2, visibleHeight / 2) || 1);
    }

    const scale = maximumScale * Math.max(0.1, Number(entry.scale) || 1);
    const cx = metrics.x + metrics.width / 2;
    const cy = metrics.y + metrics.height / 2;
    node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0}) scale(${scale}) translate(${-cx} ${-cy})`);
    node.dataset.fitMetricsSource = 'identity-cache';
    return true;
  }

  function textGlyph(parent, entry, color) {
    const text = svg('text');
    const aspectLetter = entry.fitMode === 'aspect-letter';
    const hebrewLetter = entry.fitMode === 'hebrew-letter';
    const greekLetter = entry.fitMode === 'greek-letter';
    const lettered = entry.fitMode === 'letter' || aspectLetter || hebrewLetter || greekLetter;
    text.textContent = entry.fallback;
    text.setAttribute('x', '0');
    text.setAttribute('y', hebrewLetter ? '-2' : '0');
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
    parent.appendChild(text);
    return text;
  }

  function staticMaster(parent, source, entry, color, radius) {
    const art = svg('g');
    Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
    const scale = 0.64 * Math.max(0.1, Number(radius) || 19) / 19;
    art.setAttribute('transform', `matrix(${scale} 0 0 ${scale} ${-50 * scale} ${-50 * scale})`);
    art.dataset.staticMaster = 'true';
    parent.appendChild(art);
    recolor(art, color);
    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    return art;
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
    let needsFittedReveal = false;

    if (entry.asset) {
      const source = await loadAsset(entry.asset);
      if (entry.fitMode === 'static-master') return staticMaster(parent, source, entry, color, radius);
      art = svg('g');
      Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
      // Dynamic SVG masters must never expose their raw source geometry. Fitting uses
      // identity-cached source metrics, with an offscreen probe when the live consumer
      // is hidden, so the same identity receives the same transform in every context.
      art.style.visibility = 'hidden';
      needsFittedReveal = true;
      parent.appendChild(art);
      recolor(art, color);
    } else art = textGlyph(parent, entry, color);

    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    thickenToNodeWeight(art, entry, color);
    await new Promise(resolve => requestAnimationFrame(resolve));
    const fitted = fit(art, radius, padding, entry, bubbleStrokeWidth);
    if (needsFittedReveal) {
      art.dataset.fitState = fitted ? 'resolved' : 'unresolved';
      if (fitted) art.style.visibility = '';
      else console.error('[Relphi glyph fit] Canonical dynamic glyph remained hidden because its source metrics could not be resolved:', entry.id);
    }
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