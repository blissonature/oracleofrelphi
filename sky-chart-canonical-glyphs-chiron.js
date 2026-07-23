// Native Skychart integration for the unified Relphi glyph system.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const A = '#dc1f18';
  const B = '#3166e2';
  const LEGACY_STYLE_MARKERS = [
    'sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'
  ];

  function loadScript(src, test) {
    return new Promise(function (resolve, reject) {
      if (test()) return resolve();
      const base = src.split('?')[0];
      let script = document.querySelector('script[src^="' + base + '"]');
      if (!script) {
        script = document.createElement('script');
        script.src = src;
        script.async = false;
        document.body.appendChild(script);
      }
      script.addEventListener('load', function () { test() ? resolve() : reject(new Error(src)); }, { once:true });
      script.addEventListener('error', reject, { once:true });
    });
  }

  function dependencies() {
    return loadScript('relphi-glyph-registry-v1.js?v=19', function () { return !!window.RelphiGlyphRegistry; })
      .then(function () {
        return loadScript('relphi-glyph-component-v1.js?v=19', function () { return !!window.RelphiGlyphComponent; });
      });
  }

  function removeLegacyGlyphStyling() {
    document.querySelectorAll('style[id],link[href]').forEach(function (node) {
      const signature = ((node.id || '') + ' ' + (node.getAttribute('href') || '')).toLowerCase();
      if (LEGACY_STYLE_MARKERS.some(function (marker) { return signature.includes(marker); })) node.remove();
    });
    document.querySelectorAll('[class]').forEach(function (node) {
      Array.from(node.classList).forEach(function (name) {
        if (/sky-ledger.*glyph|wheel.*glyph|ph.*glyph|glyph-bubble|canonical.*glyph/i.test(name) && !/^relphi-v2-/.test(name)) {
          node.classList.remove(name);
        }
      });
    });
  }

  function ensureStyles() {
    if (document.getElementById('relphi-sky-glyph-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-glyph-v2-style';
    style.textContent = [
      '.relphi-v2-glyph-host{display:inline-grid;place-items:center;line-height:0;vertical-align:middle;flex:0 0 auto}',
      '.relphi-v2-glyph-host>svg{display:block;width:100%;height:100%;overflow:visible}',
      '.relphi-v2-wheel-host{pointer-events:none;overflow:visible}',
      '.relphi-v2-inline-host{width:1.35em;height:1.35em;margin:0 .08em}',
      '.relphi-v2-wheel-host *,.relphi-v2-inline-host *{vector-effect:non-scaling-stroke}'
    ].join('');
    document.head.appendChild(style);
  }

  function entryFor(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && BODY_IDS.has(entry.id) ? entry : null;
  }

  function identityFor(node) {
    const values = [
      node?.dataset?.glyphId, node?.dataset?.planet, node?.dataset?.body, node?.dataset?.object,
      node?.dataset?.name, node?.getAttribute?.('aria-label'), node?.getAttribute?.('title'), node?.textContent
    ];
    for (const value of values) {
      const entry = entryFor(value);
      if (entry) return entry;
    }
    return null;
  }

  function skyColor(node) {
    return node?.closest?.('#currentSkyOutput,[data-sky="b"],[data-sky-id="skyB"],.sky-b,.current-sky') ? B : A;
  }

  function cleanSourceNode(node) {
    node.removeAttribute('style');
    node.removeAttribute('font-size');
    node.removeAttribute('font-family');
    node.removeAttribute('font-weight');
    node.removeAttribute('letter-spacing');
    node.removeAttribute('textLength');
    node.removeAttribute('lengthAdjust');
  }

  function draw(host, entry, color, radius) {
    host.replaceChildren();
    return window.RelphiGlyphComponent.draw(host, entry.id, {
      radius: radius,
      padding: 1,
      color: color,
      bubbleStrokeWidth: 0
    });
  }

  function replaceSvgText(text) {
    if (!(text instanceof SVGTextElement) || text.closest('.relphi-v2-wheel-host')) return;
    const entry = identityFor(text);
    if (!entry) return;
    let box;
    try { box = text.getBBox(); } catch (_) { return; }
    const fontSize = parseFloat(getComputedStyle(text).fontSize) || 18;
    const size = Math.max(24, Math.min(48, Math.max(fontSize * 1.65, box.height * 1.35)));
    const x = Number(text.getAttribute('x')) || box.x + box.width / 2;
    const y = Number(text.getAttribute('y')) || box.y + box.height / 2;
    const host = document.createElementNS(NS, 'svg');
    host.setAttribute('viewBox', '-32 -32 64 64');
    host.setAttribute('x', String(x - size / 2));
    host.setAttribute('y', String(y - size / 2));
    host.setAttribute('width', String(size));
    host.setAttribute('height', String(size));
    host.setAttribute('aria-label', entry.name);
    host.classList.add('relphi-v2-glyph-host', 'relphi-v2-wheel-host');
    host.dataset.glyphId = entry.id;
    const transform = text.getAttribute('transform');
    if (transform) host.setAttribute('transform', transform);
    cleanSourceNode(text);
    text.replaceWith(host);
    draw(host, entry, skyColor(host), Math.max(10, size * .44));
  }

  function replaceHtmlGlyph(element) {
    if (!element || element.namespaceURI === NS || element.closest('.relphi-v2-glyph-host')) return;
    if (!/glyph|planet|body|marker/i.test(String(element.className || ''))) return;
    const entry = identityFor(element);
    if (!entry) return;
    element.removeAttribute('style');
    element.className = '';
    const host = document.createElement('span');
    host.className = 'relphi-v2-glyph-host relphi-v2-inline-host';
    host.setAttribute('aria-label', entry.name);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-32 -32 64 64');
    host.appendChild(svg);
    element.replaceChildren(host);
    draw(svg, entry, skyColor(element), 18);
  }

  function ensureOptions(root) {
    (root?.querySelectorAll ? root : document).querySelectorAll('select').forEach(function (select) {
      const existing = new Set(Array.from(select.options).map(function (option) {
        return entryFor(option.value || option.textContent)?.id;
      }).filter(Boolean));
      if (!existing.size) return;
      BODY_IDS.forEach(function (id) {
        if (existing.has(id)) return;
        const entry = window.RelphiGlyphRegistry.get(id);
        if (entry) select.appendChild(new Option(entry.name, entry.name));
      });
    });
  }

  function render(root) {
    removeLegacyGlyphStyling();
    ensureStyles();
    const scope = root?.querySelectorAll ? root : document;
    scope.querySelectorAll('svg text').forEach(replaceSvgText);
    scope.querySelectorAll('*').forEach(replaceHtmlGlyph);
    ensureOptions(scope);
  }

  function start() {
    dependencies().then(function () {
      render(document);
      let queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; render(document); });
      }).observe(document.body, { childList:true, subtree:true });
      window.RelphiCanonicalSkyGlyphs = {
        registry:window.RelphiGlyphRegistry,
        component:window.RelphiGlyphComponent,
        refresh:function () { render(document); }
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ version:2, source:'RelphiGlyphComponent', skyA:true, skyB:true }
      }));
      if (!document.querySelector('script[src^="sky-chart-calculated-point-bridge.js"]')) {
        const bridge = document.createElement('script');
        bridge.src = 'sky-chart-calculated-point-bridge.js?v=1';
        bridge.async = false;
        document.body.appendChild(bridge);
      }
    }).catch(function (error) { console.error('Skychart glyph v2 failed.', error); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();