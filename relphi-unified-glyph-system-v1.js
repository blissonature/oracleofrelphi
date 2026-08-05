// Canonical adapter for every Relphi glyph consumer.
// The authored Master Glyph component owns artwork, artboards, whitespace, scale, and optical placement.
(function () {
  'use strict';
  if (window.RelphiUnifiedGlyphs) return;

  const NS = 'http://www.w3.org/2000/svg';
  const ASPECT_IDS = new Set([
    'conjunction','opposition','trine','square','sextile','semi-sextile',
    'quincunx','octile','tri-octile','quintile','bi-quintile'
  ]);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const base = src.split('?')[0];
      const existing = document.querySelector('script[src^="' + base + '"]');
      if (existing) {
        if ((base.includes('registry') && window.RelphiGlyphRegistry) ||
            (base.includes('component') && window.RelphiGlyphComponent)) {
          resolve();
          return;
        }
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = document.createElement('script');
      script.async = false;
      script.src = src;
      script.addEventListener('load', resolve, { once:true });
      script.addEventListener('error', reject, { once:true });
      document.body.appendChild(script);
    });
  }

  const ready = loadScript('relphi-glyph-registry-v1.js?v=1')
    .then(() => loadScript('relphi-glyph-component-v1.js?v=1'))
    .then(() => {
      if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) {
        throw new Error('Canonical Master Glyph system did not initialize.');
      }
      return true;
    });

  const bare = value => String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  const provisional = new Map([
    ['☉','sun'],['⊙','sun'],['☽','moon'],['☾','moon'],['☿','mercury'],['♀','venus'],
    ['♂','mars'],['♃','jupiter'],['♄','saturn'],['♅','uranus'],['⛢','uranus'],
    ['♆','neptune'],['♇','pluto'],['⯓','pluto'],['☊','north-node'],['☋','south-node'],
    ['⚷','chiron'],['⚸','lilith'],['⊗','part-of-fortune'],['☌','conjunction'],
    ['☍','opposition'],['△','trine'],['▲','trine'],['□','square'],['■','square'],
    ['✶','sextile'],['⚹','sextile'],['⚺','semi-sextile'],['⚻','quincunx'],
    ['∠','octile'],['⚼','tri-octile'],['∡','tri-octile']
  ]);

  function identity(value) {
    const raw = bare(value);
    const entry = window.RelphiGlyphRegistry?.resolve(raw);
    if (entry) return entry.id;
    const lower = raw.toLowerCase();
    return provisional.get(raw) || provisional.get(lower) || lower.replace(/\s+/g, '-');
  }

  function drawCanonical(parent, body, options) {
    const id = identity(body);
    return ready.then(() => window.RelphiGlyphComponent.draw(parent, id, options || {}));
  }

  function load(body) {
    return ready.then(() => {
      const id = identity(body);
      const entry = window.RelphiGlyphRegistry.get(id) || window.RelphiGlyphRegistry.resolve(body);
      if (!entry) throw new Error('Unknown canonical glyph identity: ' + body);
      return entry;
    });
  }

  function renderGlyph(parent, body, options) {
    parent.querySelectorAll(':scope > .relphi-canonical-glyph-host').forEach(node => node.remove());
    const host = document.createElementNS(NS, 'g');
    host.classList.add('relphi-canonical-glyph-host');
    parent.appendChild(host);
    host.ready = drawCanonical(host, body, options);
    return host.ready.then(() => host);
  }

  function createBubble(parent, body, options) {
    const o = options || {};
    const id = identity(body);
    const host = document.createElementNS(NS, 'g');
    host.classList.add('relphi-glyph-bubble', 'relphi-canonical-glyph-host');
    if (o.className) host.classList.add(...String(o.className).split(/\s+/).filter(Boolean));
    host.dataset.body = bare(body);
    host.dataset.glyphId = id;
    parent.appendChild(host);

    host.ready = ready.then(() => {
      // Aspect glyphs are the authored uncircled masters. They are never wrapped in a ring.
      if (ASPECT_IDS.has(id)) {
        host.classList.add('relphi-canonical-aspect');
        return window.RelphiGlyphComponent.draw(host, id, {
          radius: Number(o.radius || 17.5),
          color: o.color || '#dc1f18',
          padding: o.padding == null ? 1 : o.padding
        });
      }

      // Placements use the authored canonical circled form from the same Master Glyph component.
      const result = window.RelphiGlyphComponent.createBubble(host, id, {
        radius: Number(o.radius || 17.5),
        color: o.color || '#dc1f18',
        fill: o.fill || '#fff',
        strokeWidth: Number(o.strokeWidth || 2.35),
        padding: o.padding == null ? 1 : o.padding
      });
      return result?.ready || result;
    });
    return host;
  }

  function setPosition(group, x, y) {
    group.setAttribute('transform', `translate(${Number(x).toFixed(2)} ${Number(y).toFixed(2)})`);
  }

  function radialLayout(items, options) {
    const o = options || {}, gap = o.gap || 43, max = o.maxTangent || 84, passes = o.passes || 56;
    items.forEach(item => { item.offset = Number(item.offset) || 0; });
    const position = item => ({
      x: item.anchor.x + item.radial.x * (item.outward == null ? (o.outward || 58) : item.outward) + item.tangent.x * item.offset,
      y: item.anchor.y + item.radial.y * (item.outward == null ? (o.outward || 58) : item.outward) + item.tangent.y * item.offset
    });
    for (let pass = 0; pass < passes; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const p = position(items[a]), q = position(items[b]), distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= gap) continue;
          const cross = items[a].radial.x * items[b].radial.y - items[a].radial.y * items[b].radial.x;
          const direction = Math.sign(cross) || (a < b ? 1 : -1);
          const push = Math.min(7, (gap - distance) * .64 + .5);
          items[a].offset = Math.max(-max, Math.min(max, items[a].offset - direction * push / 2));
          items[b].offset = Math.max(-max, Math.min(max, items[b].offset + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
    items.forEach(item => {
      const p = position(item);
      item.position = p;
      if (item.group) setPosition(item.group, p.x, p.y);
    });
    return items;
  }

  function replaceTextNode(node, options) {
    const parent = node.parentNode;
    if (!parent) return null;
    const entry = window.RelphiGlyphRegistry?.resolve(node.textContent);
    const id = entry?.id || identity(node.textContent);
    if (!id) return null;
    const x = Number(node.getAttribute('x') || 0), y = Number(node.getAttribute('y') || 0);
    const host = createBubble(parent, id, options || {});
    setPosition(host, x, y);
    node.remove();
    return host;
  }

  window.RelphiUnifiedGlyphs = Object.freeze({
    identity,
    load,
    renderGlyph,
    createBubble,
    setPosition,
    radialLayout,
    replaceTextNode,
    ready,
    canonicalSource: 'RelphiGlyphComponent'
  });
})();
