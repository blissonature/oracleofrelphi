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
  async function loadAsset(path) {
    if (cache.has(path)) return cache.get(path).cloneNode(true);
    const response = await fetch(path + '?v=5');
    if (!response.ok) throw new Error('Could not load glyph asset: ' + path);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    cache.set(path, source);
    return source.cloneNode(true);
  }
  function fit(node, radius, padding, entry) {
    node.removeAttribute('transform');
    let box;
    try { box = node.getBBox(); } catch (_) { return; }
    if (!box || !box.width || !box.height) return;
    const safe = Math.max(1, radius * 2 - padding * 2);
    const scale = safe / Math.max(box.width, box.height) * (entry.scale || 1);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    node.setAttribute('transform', `translate(${entry.dx || 0} ${entry.dy || 0}) scale(${scale}) translate(${-cx} ${-cy})`);
  }
  function fortune(parent, color) {
    const group = svg('g');
    group.innerHTML = '<circle cx="0" cy="0" r="9" fill="none"/><path d="M-6.35-6.35L6.35 6.35M6.35-6.35L-6.35 6.35" fill="none"/>';
    group.querySelectorAll('*').forEach(node => {
      node.setAttribute('stroke', color);
      node.setAttribute('stroke-width', '2');
      node.setAttribute('stroke-linecap', 'round');
      node.setAttribute('stroke-linejoin', 'round');
    });
    parent.appendChild(group);
    return group;
  }
  function textGlyph(parent, entry, color) {
    const text = svg('text');
    text.textContent = entry.fallback;
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    text.style.fontFamily = /^(ASC|DSC|MC|IC|Vx)$/.test(entry.fallback) ? 'system-ui,sans-serif' : 'Apple Symbols,Segoe UI Symbol,Noto Sans Symbols 2,serif';
    text.style.fontWeight = /^(ASC|DSC|MC|IC|Vx)$/.test(entry.fallback) ? '700' : '600';
    text.style.fontSize = /^(ASC|DSC|MC|IC|Vx)$/.test(entry.fallback) ? '22px' : '34px';
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
    let art;
    if (entry.asset) {
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
    await new Promise(resolve => requestAnimationFrame(resolve));
    fit(art, radius, padding, entry);
    return art;
  }
  function createBubble(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);
    const radius = Number(options?.radius || 19);
    const color = options?.color || '#dc1f18';
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    const circle = svg('circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', options?.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(options?.strokeWidth || 2.35));
    root.appendChild(circle);
    parent.appendChild(root);
    const ready = draw(root, entry.id, { radius, padding: options?.padding ?? 1, color });
    return { root, circle, entry, ready };
  }

  window.RelphiGlyphComponent = Object.freeze({ draw, createBubble, fit, recolor });
})();