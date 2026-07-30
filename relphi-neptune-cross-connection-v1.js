// Uses the repository Neptune SVG as the canonical rendered master.
// The outer trident arms meet across the central shaft at y=62.
(function () {
  'use strict';

  const INSTALL_FLAG = '__relphiNeptuneCrossConnectionInstalled';
  if (window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;

  const NS = 'http://www.w3.org/2000/svg';
  const ASSET_URL = 'assets/planet-glyphs/neptune.svg?v=2';
  let sourcePromise;
  const svg = name => document.createElementNS(NS, name);

  function resolveEntry(identity) {
    const registry = window.RelphiGlyphRegistry;
    return registry && (registry.get(identity) || registry.resolve(identity));
  }

  function loadSource() {
    if (!sourcePromise) {
      sourcePromise = fetch(ASSET_URL)
        .then(response => {
          if (!response.ok) throw new Error('Could not load canonical Neptune SVG.');
          return response.text();
        })
        .then(markup => new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement);
    }
    return sourcePromise.then(source => source.cloneNode(true));
  }

  function matchPlanetStrokeWeight(art, color) {
    art.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
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

  function wrap(base) {
    if (!base || base.neptuneCrossConnected) return base;

    async function drawNeptune(parent, entry, options) {
      const radius = Number(options?.radius || 18);
      const padding = Number(options?.padding ?? 1);
      const color = options?.color || '#dc1f18';
      const bubbleStrokeWidth = Number(options?.bubbleStrokeWidth || 0);
      const source = await loadSource();
      const art = svg('g');

      Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
      parent.appendChild(art);
      base.recolor(art, color);
      matchPlanetStrokeWeight(art, color);
      art.classList.add('relphi-canonical-glyph', 'relphi-glyph-neptune');
      await new Promise(resolve => requestAnimationFrame(resolve));
      base.fit(art, radius, padding, entry, bubbleStrokeWidth);
      return art;
    }

    async function draw(parent, identity, options) {
      const entry = resolveEntry(identity);
      if (!entry || entry.id !== 'neptune') return base.draw(parent, identity, options);
      try {
        return await drawNeptune(parent, entry, options);
      } catch (_) {
        return base.draw(parent, identity, options);
      }
    }

    function createBubble(parent, identity, options) {
      const entry = resolveEntry(identity);
      if (!entry || entry.id !== 'neptune') return base.createBubble(parent, identity, options);

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

    return Object.freeze({
      draw,
      createBubble,
      fit: base.fit,
      recolor: base.recolor,
      canonicalSource: base.canonicalSource,
      moonStrokePreserved: base.moonStrokePreserved,
      neptuneCrossConnected: true
    });
  }

  if (window.RelphiGlyphComponent) window.RelphiGlyphComponent = wrap(window.RelphiGlyphComponent);
})();
