// Restores the Sky Placements wheel to the canonical master rendering approved at e9344099.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const base = window.RelphiGlyphComponent;
  const registry = window.RelphiGlyphRegistry;
  if (!base || !registry) return;

  // Exact fitting values used by glyphs-unified-preview.html at e9344099.
  const canonical = {
    moon:{ scale:1.2, dx:0.7, dy:0 },
    mars:{ scale:1, dx:-0.95, dy:0.9 },
    square:{ scale:0.9, dx:0, dy:0 },
    quintile:{ scale:0.96, dx:0, dy:-1.2 }
  };

  function restoreRegistry() {
    Object.entries(canonical).forEach(function (pair) {
      const entry = registry.resolve(pair[0]);
      if (!entry) return;
      Object.assign(entry, pair[1]);
    });
  }

  function thickenToNodeWeight(root, entry, color) {
    if (
      entry.id === 'north-node' ||
      entry.id === 'south-node' ||
      entry.id === 'lilith' ||
      entry.id === 'part-of-fortune' ||
      entry.fitMode === 'letter' ||
      entry.fitMode === 'hebrew-letter' ||
      entry.fitMode === 'greek-letter' ||
      String(entry.asset || '').startsWith('assets/zodiac-glyphs/') ||
      String(entry.asset || '').startsWith('assets/element-glyphs/') ||
      String(entry.asset || '').startsWith('assets/aspect-glyphs/')
    ) return;

    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(function (node) {
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

  async function draw(parent, identity, options) {
    restoreRegistry();
    const entry = registry.get(identity) || registry.resolve(identity);
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);
    const settings = options || {};
    const color = settings.color || '#dc1f18';
    const radius = Number(settings.radius || 18);
    const padding = Number(settings.padding == null ? 1 : settings.padding);
    const bubbleStrokeWidth = Number(settings.bubbleStrokeWidth || 0);
    const art = await base.draw(parent, entry.id, settings);
    thickenToNodeWeight(art, entry, color);
    await new Promise(function (resolve) { requestAnimationFrame(resolve); });
    base.fit(art, radius, padding, entry, bubbleStrokeWidth);
    return art;
  }

  function createBubble(parent, identity, options) {
    restoreRegistry();
    const entry = registry.get(identity) || registry.resolve(identity);
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);
    const settings = options || {};
    const radius = Number(settings.radius || 19);
    const color = settings.color || '#dc1f18';
    const strokeWidth = Number(settings.strokeWidth || 2.35);
    const root = document.createElementNS(NS, 'g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', settings.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    root.appendChild(circle);
    parent.appendChild(root);
    const ready = draw(root, entry.id, {
      radius:radius,
      padding:settings.padding == null ? 1 : settings.padding,
      color:color,
      bubbleStrokeWidth:strokeWidth
    });
    return { root:root, circle:circle, entry:entry, ready:ready };
  }

  restoreRegistry();
  window.RelphiGlyphComponent = Object.freeze({
    draw:draw,
    createBubble:createBubble,
    fit:base.fit,
    recolor:base.recolor
  });

  // Earlier relationship helpers incorrectly zeroed Mars after load. Restore the master values last.
  let queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      restoreRegistry();
    });
  }).observe(document.body, { childList:true, subtree:true });
})();