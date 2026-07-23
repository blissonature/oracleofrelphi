// Native Skychart integration for the approved Relphi glyph system.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const SKY_A = '#dc1f18';
  const SKY_B = '#3166e2';
  const LEGACY_STYLE_MARKERS = ['sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'];

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
        if (/sky-ledger.*glyph|wheel.*glyph|ph.*glyph|glyph-bubble|canonical.*glyph/i.test(name) && !/^relphi-glyph-component/.test(name)) {
          node.classList.remove(name);
        }
      });
    });
  }

  function ensureStyles() {
    if (document.getElementById('relphi-sky-glyph-native-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-glyph-native-style';
    style.textContent = [
      '.relphi-sky-glyph-layer{pointer-events:none}',
      '.relphi-sky-glyph-host{pointer-events:none}',
      '.relphi-sky-glyph-host *{vector-effect:non-scaling-stroke}',
      '.relphi-sky-inline-glyph{display:inline-grid;place-items:center;width:1.35em;height:1.35em;vertical-align:middle;line-height:0;margin:0 .08em}',
      '.relphi-sky-inline-glyph>svg{display:block;width:100%;height:100%;overflow:visible}'
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

  function isSkyB(node) {
    return !!node?.closest?.('#currentSkyOutput,[data-sky="b"],[data-sky-id="skyB"],.sky-b,.current-sky');
  }

  function skyColor(node) {
    return isSkyB(node) ? SKY_B : SKY_A;
  }

  function numericCoordinate(text, name, fallback) {
    const raw = text.getAttribute(name);
    if (raw != null && raw !== '' && Number.isFinite(Number(raw))) return Number(raw);
    return fallback;
  }

  function sourceCenter(text) {
    let box;
    try { box = text.getBBox(); } catch (_) { box = null; }
    const x = numericCoordinate(text, 'x', box ? box.x + box.width / 2 : 0);
    const y = numericCoordinate(text, 'y', box ? box.y + box.height / 2 : 0);
    return { x, y };
  }

  function wheelRadius(svg) {
    const viewBox = svg.viewBox?.baseVal;
    const span = viewBox && viewBox.width ? Math.min(viewBox.width, viewBox.height) : Math.min(svg.clientWidth || 600, svg.clientHeight || 600);
    return Math.max(11, Math.min(18, span * 0.027));
  }

  function glyphLayer(svg) {
    let layer = svg.querySelector(':scope > .relphi-sky-glyph-layer');
    if (!layer) {
      layer = document.createElementNS(NS, 'g');
      layer.classList.add('relphi-sky-glyph-layer');
      layer.setAttribute('aria-label', 'Sky placement glyphs');
      svg.appendChild(layer);
    }
    return layer;
  }

  function drawNativePlacement(text) {
    if (!(text instanceof SVGTextElement) || text.closest('.relphi-sky-glyph-host')) return;
    const entry = identityFor(text);
    if (!entry) return;
    const svg = text.ownerSVGElement;
    if (!svg) return;

    const center = sourceCenter(text);
    const color = skyColor(text);
    const radius = wheelRadius(svg);
    const host = document.createElementNS(NS, 'g');
    host.classList.add('relphi-sky-glyph-host');
    host.dataset.glyphId = entry.id;
    host.dataset.sky = color === SKY_B ? 'b' : 'a';
    host.setAttribute('aria-label', entry.name);
    host.setAttribute('transform', 'translate(' + center.x + ' ' + center.y + ')');

    glyphLayer(svg).appendChild(host);
    text.remove();

    window.RelphiGlyphComponent.draw(host, entry.id, {
      radius: radius,
      padding: 1.25,
      color: color,
      bubbleStrokeWidth: 0
    }).catch(function (error) {
      console.error('Could not draw approved Skychart glyph:', entry.id, error);
    });
  }

  function replaceInlineGlyph(element) {
    if (!element || element.namespaceURI === NS || element.closest('.relphi-sky-inline-glyph')) return;
    if (!/glyph|planet|body|marker/i.test(String(element.className || ''))) return;
    const entry = identityFor(element);
    if (!entry) return;

    const color = skyColor(element);
    element.removeAttribute('style');
    Array.from(element.classList).forEach(function (name) {
      if (/glyph|planet|body|marker/i.test(name)) element.classList.remove(name);
    });

    const host = document.createElement('span');
    host.className = 'relphi-sky-inline-glyph';
    host.setAttribute('aria-label', entry.name);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-24 -24 48 48');
    svg.setAttribute('aria-hidden', 'true');
    host.appendChild(svg);
    element.replaceChildren(host);

    window.RelphiGlyphComponent.draw(svg, entry.id, {
      radius: 17,
      padding: 1.25,
      color: color,
      bubbleStrokeWidth: 0
    }).catch(function (error) {
      console.error('Could not draw approved inline glyph:', entry.id, error);
    });
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
    scope.querySelectorAll('svg text').forEach(drawNativePlacement);
    scope.querySelectorAll('*').forEach(replaceInlineGlyph);
    ensureOptions(scope);
  }

  function start() {
    dependencies().then(function () {
      render(document);
      let queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          render(document);
        });
      }).observe(document.body, { childList:true, subtree:true });

      window.RelphiCanonicalSkyGlyphs = {
        registry: window.RelphiGlyphRegistry,
        component: window.RelphiGlyphComponent,
        refresh: function () { render(document); }
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ version:3, architecture:'native-svg-groups', source:'RelphiGlyphComponent', skyA:true, skyB:true }
      }));

      if (!document.querySelector('script[src^="sky-chart-calculated-point-bridge.js"]')) {
        const bridge = document.createElement('script');
        bridge.src = 'sky-chart-calculated-point-bridge.js?v=2';
        bridge.async = false;
        document.body.appendChild(bridge);
      }
    }).catch(function (error) {
      console.error('Skychart approved glyph renderer failed.', error);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();