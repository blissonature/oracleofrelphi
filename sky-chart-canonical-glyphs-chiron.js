// Single-source SkyChart integration for the approved Relphi glyph system.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const GLYPH_SOURCE_SELECTOR = [
    'text.chart-wheel-marker-glyph',
    'text[data-glyph-id]',
    'text[data-planet-glyph]',
    'text[data-body-glyph]'
  ].join(',');
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const SKY_A = '#dc1f18';
  const SKY_B = '#3166e2';
  const LEGACY_STYLE_MARKERS = ['sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'];
  let renderQueued = false;
  let renderRunning = false;

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
    // Earlier preview passes created detached top-level layers. They are not part of the new architecture.
    document.querySelectorAll('.relphi-sky-glyph-layer,.relphi-v2-glyph-host').forEach(function (node) { node.remove(); });
  }

  function ensureStyles() {
    if (document.getElementById('relphi-sky-glyph-native-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-glyph-native-style';
    style.textContent = [
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

  function identityFromAttributes(node) {
    const values = [
      node?.dataset?.glyphId,
      node?.dataset?.planetGlyph,
      node?.dataset?.bodyGlyph,
      node?.dataset?.planet,
      node?.dataset?.body,
      node?.dataset?.object,
      node?.getAttribute?.('aria-label'),
      node?.getAttribute?.('title')
    ];
    for (const value of values) {
      const entry = entryFor(value);
      if (entry) return entry;
    }
    return null;
  }

  function identityForGlyphSource(node) {
    if (!(node instanceof SVGTextElement) || !node.matches(GLYPH_SOURCE_SELECTOR)) return null;
    return identityFromAttributes(node) || entryFor(node.textContent);
  }

  function identityForInline(node) {
    return identityFromAttributes(node) || entryFor(node?.textContent);
  }

  function isSkyB(node) {
    return !!node?.closest?.('#currentSkyOutput,[data-sky="b"],[data-sky-id="skyB"],.sky-b,.current-sky');
  }

  function skyColor(node) {
    return isSkyB(node) ? SKY_B : SKY_A;
  }

  function numericCoordinate(text, name, fallback) {
    const raw = text.getAttribute(name);
    if (raw != null && raw !== '') {
      const first = String(raw).trim().split(/[ ,]+/)[0];
      if (Number.isFinite(Number(first))) return Number(first);
    }
    return fallback;
  }

  function sourceCenter(text) {
    let box;
    try { box = text.getBBox(); } catch (_) { box = null; }
    return {
      x:numericCoordinate(text, 'x', box ? box.x + box.width / 2 : 0),
      y:numericCoordinate(text, 'y', box ? box.y + box.height / 2 : 0)
    };
  }

  function wheelRadius(svg) {
    const viewBox = svg.viewBox?.baseVal;
    const span = viewBox && viewBox.width ? Math.min(viewBox.width, viewBox.height) : Math.min(svg.clientWidth || 600, svg.clientHeight || 600);
    return Math.max(10.5, Math.min(17, span * 0.0255));
  }

  function placementKey(container, entry, center) {
    const slot = isSkyB(container) ? 'b' : 'a';
    const groupKey = container?.dataset?.body || container?.dataset?.planet || container?.dataset?.object || '';
    return [slot, entry.id, groupKey, center.x.toFixed(2), center.y.toFixed(2)].join(':');
  }

  function removeDuplicateHosts(container, keep) {
    Array.from(container.querySelectorAll(':scope > .relphi-sky-glyph-host')).forEach(function (host) {
      if (host !== keep) host.remove();
    });
  }

  function drawPlacementContainer(container) {
    if (!container || !container.querySelectorAll) return;
    const sources = Array.from(container.querySelectorAll(GLYPH_SOURCE_SELECTOR)).filter(function (node) {
      return !!identityForGlyphSource(node);
    });
    const existing = Array.from(container.querySelectorAll(':scope > .relphi-sky-glyph-host'));

    // A settled placement already has one managed component and no legacy source.
    if (!sources.length) {
      if (existing.length > 1) removeDuplicateHosts(container, existing[0]);
      return;
    }

    const source = sources[0];
    const entry = identityForGlyphSource(source);
    if (!entry) return;
    const center = sourceCenter(source);
    const key = placementKey(container, entry, center);
    const matching = existing.find(function (host) { return host.dataset.placementKey === key; });

    // Remove every legacy glyph source in this placement, including accidental duplicate producers.
    sources.forEach(function (node) { node.remove(); });

    if (matching) {
      removeDuplicateHosts(container, matching);
      return;
    }

    existing.forEach(function (host) { host.remove(); });
    const host = document.createElementNS(NS, 'g');
    host.classList.add('chart-wheel-marker-glyph', 'relphi-sky-glyph-host');
    host.dataset.glyphId = entry.id;
    host.dataset.sky = isSkyB(container) ? 'b' : 'a';
    host.dataset.placementKey = key;
    host.setAttribute('aria-label', entry.name);
    host.setAttribute('transform', 'translate(' + center.x + ' ' + center.y + ')');
    container.appendChild(host);

    window.RelphiGlyphComponent.draw(host, entry.id, {
      radius:wheelRadius(source.ownerSVGElement),
      padding:1.35,
      color:skyColor(container),
      bubbleStrokeWidth:0
    }).catch(function (error) {
      console.error('Could not draw approved SkyChart glyph:', entry.id, error);
    });
  }

  function renderWheel(svg) {
    if (!svg || !svg.querySelectorAll) return;
    svg.querySelectorAll('.relphi-sky-glyph-layer').forEach(function (node) { node.remove(); });

    const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
    placements.forEach(drawPlacementContainer);

    // Some angle or point markers may use the glyph class without a placement wrapper.
    Array.from(svg.querySelectorAll(GLYPH_SOURCE_SELECTOR)).forEach(function (source) {
      if (source.closest(PLACEMENT_SELECTOR)) return;
      const parent = source.parentElement;
      if (parent) drawPlacementContainer(parent);
    });
  }

  function replaceInlineGlyph(element) {
    if (!element || element.namespaceURI === NS || element.closest('.relphi-sky-inline-glyph')) return;
    if (!/glyph|planet|body|marker/i.test(String(element.className || ''))) return;
    const entry = identityForInline(element);
    if (!entry) return;

    const already = element.querySelector(':scope > .relphi-sky-inline-glyph');
    if (already?.dataset?.glyphId === entry.id) return;

    const color = skyColor(element);
    element.removeAttribute('style');
    const host = document.createElement('span');
    host.className = 'relphi-sky-inline-glyph';
    host.dataset.glyphId = entry.id;
    host.setAttribute('aria-label', entry.name);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-24 -24 48 48');
    svg.setAttribute('aria-hidden', 'true');
    host.appendChild(svg);
    element.replaceChildren(host);

    window.RelphiGlyphComponent.draw(svg, entry.id, {
      radius:17,
      padding:1.35,
      color:color,
      bubbleStrokeWidth:0
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

  function audit() {
    const wheels = Array.from(document.querySelectorAll(WHEEL_SELECTOR));
    const result = { wheels:wheels.length, placements:0, hosts:0, duplicatePlacements:0, legacyGlyphSources:0 };
    wheels.forEach(function (svg) {
      const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
      result.placements += placements.length;
      placements.forEach(function (group) {
        const count = group.querySelectorAll(':scope > .relphi-sky-glyph-host').length;
        result.hosts += count;
        if (count > 1) result.duplicatePlacements += 1;
      });
      result.legacyGlyphSources += svg.querySelectorAll(GLYPH_SOURCE_SELECTOR).length;
    });
    return result;
  }

  function render() {
    if (renderRunning) return;
    renderRunning = true;
    try {
      removeLegacyGlyphStyling();
      ensureStyles();
      document.querySelectorAll(WHEEL_SELECTOR).forEach(renderWheel);
      document.querySelectorAll('*').forEach(replaceInlineGlyph);
      ensureOptions(document);
      document.documentElement.dataset.relphiSkyGlyphAudit = JSON.stringify(audit());
    } finally {
      renderRunning = false;
    }
  }

  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      render();
    });
  }

  function start() {
    dependencies().then(function () {
      render();
      new MutationObserver(scheduleRender).observe(document.body, { childList:true, subtree:true });

      window.RelphiCanonicalSkyGlyphs = {
        registry:window.RelphiGlyphRegistry,
        component:window.RelphiGlyphComponent,
        refresh:scheduleRender,
        audit:audit
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ version:4, architecture:'one-source-one-host', source:'RelphiGlyphComponent', skyA:true, skyB:true }
      }));

      if (!document.querySelector('script[src^="sky-chart-calculated-point-bridge.js"]')) {
        const bridge = document.createElement('script');
        bridge.src = 'sky-chart-calculated-point-bridge.js?v=2';
        bridge.async = false;
        document.body.appendChild(bridge);
      }
    }).catch(function (error) {
      console.error('SkyChart approved glyph renderer failed.', error);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();