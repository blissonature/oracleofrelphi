// Replaces Sky Ledger wheel-node text symbols with the approved planetary SVG paths.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const GLYPHS = {
    '☉':'sun', '☽':'moon', '☿':'mercury', '♀':'venus', '♂':'mars',
    '♃':'jupiter', '♄':'saturn', '♅':'uranus', '♆':'neptune', '♇':'pluto', '⯓':'pluto'
  };
  const pathCache = new Map();
  let queued = false;

  function loadPaths(name) {
    if (pathCache.has(name)) return pathCache.get(name);
    const request = fetch('assets/planet-glyphs/' + name + '.svg')
      .then(function (response) {
        if (!response.ok) throw new Error('Could not load ' + name + ' glyph');
        return response.text();
      })
      .then(function (markup) {
        const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
        return Array.prototype.map.call(doc.querySelectorAll('path'), function (path) {
          return {
            d:path.getAttribute('d') || '',
            fillRule:path.getAttribute('fill-rule') || '',
            clipRule:path.getAttribute('clip-rule') || ''
          };
        }).filter(function (path) { return path.d; });
      });
    pathCache.set(name, request);
    return request;
  }

  function numericAttribute(el, name) {
    const value = el.getAttribute(name);
    return value == null ? NaN : Number(value);
  }

  function textPoint(text) {
    const x = numericAttribute(text, 'x');
    const y = numericAttribute(text, 'y');
    if (Number.isFinite(x) && Number.isFinite(y)) return { x:x, y:y };
    try {
      const box = text.getBBox();
      return { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    } catch (error) {
      return null;
    }
  }

  function nearbyCircle(text) {
    const point = textPoint(text);
    if (!point) return null;
    let scope = text.parentElement;
    for (let depth = 0; scope && depth < 3; depth += 1, scope = scope.parentElement) {
      const circles = scope.querySelectorAll(':scope > circle, :scope > g > circle');
      let best = null;
      let bestDistance = Infinity;
      circles.forEach(function (circle) {
        const cx = numericAttribute(circle, 'cx');
        const cy = numericAttribute(circle, 'cy');
        const r = numericAttribute(circle, 'r');
        if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r) || r < 5 || r > 28) return;
        const distance = Math.hypot(point.x - cx, point.y - cy);
        if (distance <= r * 1.2 && distance < bestDistance) {
          best = circle;
          bestDistance = distance;
        }
      });
      if (best) return best;
    }
    return null;
  }

  function glyphColor(text, circle) {
    const textFill = text.getAttribute('fill') || getComputedStyle(text).fill;
    if (textFill && textFill !== 'none') return textFill;
    const circleStroke = circle.getAttribute('stroke') || getComputedStyle(circle).stroke;
    return circleStroke && circleStroke !== 'none' ? circleStroke : '#111111';
  }

  function installGlyph(text, circle, paths) {
    if (!text.isConnected || text.dataset.relphiWheelGlyphAligned === 'true' || !paths.length) return;
    const cx = numericAttribute(circle, 'cx');
    const cy = numericAttribute(circle, 'cy');
    const r = numericAttribute(circle, 'r');
    const svg = text.closest('svg');
    const viewBox = svg && svg.viewBox && svg.viewBox.baseVal;
    const validPosition = Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(r) && r > 0 &&
      (!viewBox || !viewBox.width || (cx - r >= viewBox.x && cy - r >= viewBox.y && cx + r <= viewBox.x + viewBox.width && cy + r <= viewBox.y + viewBox.height));
    if (!validPosition) {
      delete text.dataset.relphiWheelGlyphPending;
      return;
    }
    text.parentElement.querySelectorAll(':scope > .relphi-wheel-planet-glyph').forEach(function (existing) { existing.remove(); });
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('class', 'relphi-wheel-planet-glyph');
    group.setAttribute('data-relphi-glyph-for', (text.textContent || '').trim());
    group.setAttribute('aria-hidden', 'true');
    group.style.pointerEvents = 'none';
    const color = glyphColor(text, circle);

    paths.forEach(function (source) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', source.d);
      path.setAttribute('fill', color);
      if (source.fillRule) path.setAttribute('fill-rule', source.fillRule);
      if (source.clipRule) path.setAttribute('clip-rule', source.clipRule);
      group.appendChild(path);
    });

    text.parentNode.insertBefore(group, text.nextSibling);
    let box;
    try { box = group.getBBox(); } catch (error) { group.remove(); delete text.dataset.relphiWheelGlyphPending; return; }
    if (!Number.isFinite(box.x) || !Number.isFinite(box.y) || !Number.isFinite(box.width) || !Number.isFinite(box.height) || !box.width || !box.height) { group.remove(); delete text.dataset.relphiWheelGlyphPending; return; }

    // Leave one CSS pixel of breathing room between the visible path and the circle stroke.
    const available = Math.max(1, (r * 2) - 2);
    const scale = Math.min(available / box.width, available / box.height);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    group.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + scale + ') translate(' + (-centerX) + ' ' + (-centerY) + ')');

    text.setAttribute('visibility', 'hidden');
    text.dataset.relphiWheelGlyphAligned = 'true';
    delete text.dataset.relphiWheelGlyphPending;
  }

  function alignText(text) {
    if (!text || text.dataset.relphiWheelGlyphAligned === 'true' || text.dataset.relphiWheelGlyphPending === 'true') return;
    const symbol = (text.textContent || '').trim();
    const name = GLYPHS[symbol];
    if (!name) return;
    const circle = nearbyCircle(text);
    if (!circle) return;
    text.dataset.relphiWheelGlyphPending = 'true';
    loadPaths(name).then(function (paths) { installGlyph(text, circle, paths); }).catch(function () { delete text.dataset.relphiWheelGlyphPending; });
  }

  function run(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('svg text').forEach(alignText);
    if (root && root.matches && root.matches('svg text')) alignText(root);
    scope.querySelectorAll('svg .relphi-wheel-planet-glyph').forEach(function (group) {
      const parent = group.parentElement;
      if (!parent || !parent.querySelector('text[data-relphi-wheel-glyph-aligned="true"]')) group.remove();
    });
  }

  function start() {
    run(document);
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        run(document);
      });
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
