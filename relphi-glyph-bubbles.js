// Keeps planetary glyph bubbles legible and visually consistent across
// Planetary Hours and Sky Chart without copying raw SVG path data.
(function () {
  'use strict';

  const path = window.location.pathname;
  if (!/(^|\/)(planetaryhours|sky-chart)\.html$/.test(path)) return;

  const MIN_GAP_PX = 1.25;
  const IMAGE_EDGE_GAP_PX = 2;
  const NS = 'http://www.w3.org/2000/svg';
  const GLYPHS = {
    '☉': 'sun', '☽': 'moon', '☿': 'mercury', '♀': 'venus', '♂': 'mars',
    '♃': 'jupiter', '♄': 'saturn', '♅': 'uranus', '♆': 'neptune',
    '♇': 'pluto', '⯓': 'pluto'
  };
  const TEXT_SELECTORS = [
    '.ph-current-wheel .planet-label',
    '.chart-wheel-marker-glyph',
    '.mini-wheel-marker-glyph'
  ].join(',');
  const IMAGE_SELECTORS = [
    '.ph-current-wheel image.standardized-planet-glyph',
    'image.relphi-bubble-glyph-image'
  ].join(',');

  let queued = false;

  function installStyles() {
    if (document.getElementById('relphi-glyph-bubble-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-glyph-bubble-style';
    style.textContent = [
      '.ph-current-wheel .planet-dot{',
      '  fill:#fff!important;',
      '  stroke:var(--relphi-red,#dc1f18)!important;',
      '  stroke-width:1.5!important;',
      '  filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.14));',
      '}',
      '.ph-current-wheel .planet-label{fill:#111!important}',
      '.chart-wheel-marker-disc{',
      '  fill:#fff!important;',
      '  stroke:var(--relphi-red,#dc1f18)!important;',
      '  stroke-width:1.6!important;',
      '  filter:drop-shadow(0 1px 2px rgba(0,0,0,.14))!important;',
      '}',
      '.chart-wheel-placement.sky-b .chart-wheel-marker-disc{',
      '  fill:#fff!important;',
      '  stroke:#111!important;',
      '  stroke-dasharray:3 2;',
      '}',
      '.chart-wheel-marker-glyph,.chart-wheel-placement.sky-b .chart-wheel-marker-glyph{fill:#111!important}',
      '.mini-wheel-marker{fill:#fff!important;stroke:var(--relphi-red,#dc1f18)!important;stroke-width:1.5!important}',
      '.mini-wheel-marker.is-b{fill:#fff!important;stroke:#111!important;stroke-dasharray:2 1.5}',
      '.mini-wheel-marker-glyph,.mini-wheel-marker-glyph.is-b{fill:#111!important}',
      '.ph-current-wheel .planet-label,',
      '.chart-wheel-marker-glyph,',
      '.mini-wheel-marker-glyph{',
      '  font-family:"Segoe UI Symbol","Noto Sans Symbols 2","Noto Sans Symbols","Arial Unicode MS",sans-serif!important;',
      '  font-weight:900!important;',
      '}',
      'image.relphi-bubble-glyph-image,image.standardized-planet-glyph{pointer-events:none}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function circleForNode(node) {
    const parent = node && node.parentElement;
    if (!parent) return null;
    if (node.matches('.planet-label, image.standardized-planet-glyph')) return parent.querySelector('circle.planet-dot');
    if (node.matches('.chart-wheel-marker-glyph, image.relphi-bubble-glyph-image[data-kind="chart"]')) return parent.querySelector('circle.chart-wheel-marker-disc');
    if (node.matches('.mini-wheel-marker-glyph, image.relphi-bubble-glyph-image[data-kind="mini"]')) return parent.querySelector('circle.mini-wheel-marker');
    return null;
  }

  function screenScale(element) {
    const matrix = element && element.getScreenCTM ? element.getScreenCTM() : null;
    if (!matrix) return 1;
    const scaleX = Math.hypot(matrix.a, matrix.b);
    const scaleY = Math.hypot(matrix.c, matrix.d);
    return Math.max(0.001, Math.min(scaleX, scaleY));
  }

  function strokeWidthPx(circle) {
    const computed = window.getComputedStyle(circle);
    const width = parseFloat(computed.strokeWidth) || 0;
    return /non-scaling-stroke/i.test(computed.vectorEffect || '') ? width : width * screenScale(circle);
  }

  function prepareCircle(circle) {
    if (!circle) return;
    if (circle.matches('.ph-current-wheel .planet-dot')) {
      const currentRadius = Number(circle.getAttribute('r')) || 0;
      if (currentRadius < 8) circle.setAttribute('r', '8');
    }
  }

  function fitImage(image) {
    const circle = circleForNode(image);
    if (!circle || !image.isConnected) return;
    prepareCircle(circle);

    const radius = Number(circle.getAttribute('r'));
    const cx = Number(circle.getAttribute('cx'));
    const cy = Number(circle.getAttribute('cy'));
    const scale = screenScale(circle);
    if (![radius, cx, cy, scale].every(Number.isFinite) || radius <= 0 || scale <= 0) return;

    const strokeUnits = strokeWidthPx(circle) / scale;
    const edgeGapUnits = Math.max(MIN_GAP_PX, IMAGE_EDGE_GAP_PX) / scale;
    const size = Math.max(2, (radius - strokeUnits / 2 - edgeGapUnits) * 2);

    image.setAttribute('x', (cx - size / 2).toFixed(3));
    image.setAttribute('y', (cy - size / 2).toFixed(3));
    image.setAttribute('width', size.toFixed(3));
    image.setAttribute('height', size.toFixed(3));
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.dataset.relphiBubbleGapPx = Math.max(MIN_GAP_PX, IMAGE_EDGE_GAP_PX).toFixed(2);
    circle.dataset.relphiBubbleGapPx = image.dataset.relphiBubbleGapPx;
  }

  function createImageForText(text) {
    if (!text || text.dataset.relphiBubbleImageReady === 'true') return null;
    const symbol = (text.textContent || '').trim();
    const name = GLYPHS[symbol];
    const circle = circleForNode(text);
    if (!name || !circle || !text.parentNode) return null;

    const kind = text.matches('.chart-wheel-marker-glyph') ? 'chart' : text.matches('.mini-wheel-marker-glyph') ? 'mini' : 'planetary-hours';
    const image = document.createElementNS(NS, 'image');
    image.setAttribute('href', 'assets/planet-glyphs/' + name + '.svg?v=4');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'assets/planet-glyphs/' + name + '.svg?v=4');
    image.setAttribute('class', 'relphi-bubble-glyph-image');
    image.setAttribute('data-kind', kind);
    image.setAttribute('aria-hidden', 'true');
    image.setAttribute('focusable', 'false');
    image.style.pointerEvents = 'none';

    image.addEventListener('load', function () {
      fitImage(image);
      text.style.opacity = '0';
      text.dataset.relphiBubbleImageReady = 'true';
    }, { once: true });
    image.addEventListener('error', function () {
      image.remove();
      text.style.removeProperty('opacity');
      delete text.dataset.relphiBubbleImageReady;
      fitText(text);
    }, { once: true });

    text.parentNode.insertBefore(image, text.nextSibling);
    fitImage(image);
    return image;
  }

  function resetBaseFont(text) {
    if (!text.dataset.relphiBubbleBaseFontPx) {
      const size = parseFloat(window.getComputedStyle(text).fontSize);
      if (Number.isFinite(size) && size > 0) text.dataset.relphiBubbleBaseFontPx = String(size);
    }
    const base = Number(text.dataset.relphiBubbleBaseFontPx);
    if (Number.isFinite(base) && base > 0) text.style.fontSize = base + 'px';
    return base;
  }

  function fitText(text) {
    const circle = circleForNode(text);
    if (!circle || !text.isConnected || !circle.isConnected) return;
    prepareCircle(circle);

    const baseFont = resetBaseFont(text);
    if (!Number.isFinite(baseFont) || baseFont <= 0) return;

    text.setAttribute('text-anchor', 'middle');
    if (!text.hasAttribute('dominant-baseline')) text.setAttribute('dominant-baseline', 'middle');

    const radiusUnits = Number(circle.getAttribute('r'));
    const unitScale = screenScale(circle);
    if (!Number.isFinite(radiusUnits) || radiusUnits <= 0 || !Number.isFinite(unitScale)) return;

    const innerRadiusPx = Math.max(1, radiusUnits * unitScale - strokeWidthPx(circle) / 2 - MIN_GAP_PX);
    let fontSize = baseFont;

    for (let pass = 0; pass < 3; pass += 1) {
      const rect = text.getBoundingClientRect();
      const halfDiagonal = Math.hypot(rect.width / 2, rect.height / 2);
      if (!Number.isFinite(halfDiagonal) || halfDiagonal <= 0) break;
      const ratio = innerRadiusPx / halfDiagonal;
      if (Math.abs(1 - ratio) < 0.025) break;
      fontSize = Math.max(5, Math.min(baseFont * 1.18, fontSize * ratio * 0.985));
      text.style.fontSize = fontSize.toFixed(3) + 'px';
    }

    const finalRect = text.getBoundingClientRect();
    const finalHalfDiagonal = Math.hypot(finalRect.width / 2, finalRect.height / 2);
    const visibleGap = Math.max(0, radiusUnits * unitScale - strokeWidthPx(circle) / 2 - finalHalfDiagonal);
    text.dataset.relphiBubbleGapPx = visibleGap.toFixed(2);
    circle.dataset.relphiBubbleGapPx = visibleGap.toFixed(2);
  }

  function processText(text) {
    const existingImage = text.parentElement && text.parentElement.querySelector('image.relphi-bubble-glyph-image');
    if (existingImage) {
      fitImage(existingImage);
      return;
    }
    createImageForText(text);
    if (text.style.opacity !== '0') fitText(text);
  }

  function fitAll(root) {
    installStyles();
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(IMAGE_SELECTORS).forEach(fitImage);
    scope.querySelectorAll(TEXT_SELECTORS).forEach(processText);
    if (root && root.matches) {
      if (root.matches(IMAGE_SELECTORS)) fitImage(root);
      if (root.matches(TEXT_SELECTORS)) processText(root);
    }
  }

  function scheduleFit() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      fitAll(document);
    });
  }

  function start() {
    fitAll(document);
    new MutationObserver(scheduleFit).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleFit, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit).catch(function () {});
  }

  window.RelphiGlyphBubbles = { fit: fitAll, minimumGapPx: MIN_GAP_PX };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
