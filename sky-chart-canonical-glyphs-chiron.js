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
  const LEGACY_VISUAL_SELECTOR = [
    'image.standardized-planet-glyph',
    'image.relphi-bubble-glyph-image',
    '.relphi-v2-glyph-host',
    '.relphi-sky-glyph-layer'
  ].join(',');
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const SKY_A = '#dc1f18';
  const SKY_B = '#3166e2';
  const WHEEL_VARIANT = 'inscribed';
  const MIN_RADIUS = 10.5;
  const MAX_RADIUS = 12.5;
  const RADIUS_RATIO = 0.0195;
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
      script.addEventListener('load', function () {
        if (test()) resolve();
        else reject(new Error('Loaded without expected API: ' + src));
      }, { once:true });
      script.addEventListener('error', reject, { once:true });
    });
  }

  function dependencies() {
    return loadScript('relphi-glyph-registry-v1.js?v=19', function () {
      return !!window.RelphiGlyphRegistry;
    }).then(function () {
      return loadScript('relphi-glyph-component-v1.js?v=19', function () {
        return !!window.RelphiGlyphComponent;
      });
    });
  }

  function removeLegacyGlyphStyling() {
    document.querySelectorAll('style[id],link[href]').forEach(function (node) {
      const signature = ((node.id || '') + ' ' + (node.getAttribute('href') || '')).toLowerCase();
      if (LEGACY_STYLE_MARKERS.some(function (marker) { return signature.includes(marker); })) node.remove();
    });
    document.querySelectorAll(LEGACY_VISUAL_SELECTOR).forEach(function (node) { node.remove(); });
  }

  function ensureStyles() {
    if (document.getElementById('relphi-sky-glyph-native-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-glyph-native-style';
    style.textContent = [
      '.relphi-sky-glyph-host{pointer-events:none}',
      '.relphi-sky-glyph-host>.relphi-glyph-bubble{isolation:isolate}',
      '.relphi-sky-glyph-host>.relphi-glyph-bubble>circle{fill:#fff}'
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
      node && node.dataset && node.dataset.glyphId,
      node && node.dataset && node.dataset.planetGlyph,
      node && node.dataset && node.dataset.bodyGlyph,
      node && node.dataset && node.dataset.planet,
      node && node.dataset && node.dataset.body,
      node && node.dataset && node.dataset.object,
      node && node.getAttribute && node.getAttribute('aria-label'),
      node && node.getAttribute && node.getAttribute('title')
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

  function isSkyB(node) {
    return !!(node && node.closest && node.closest('#currentSkyOutput,[data-sky="b"],[data-sky-id="skyB"],.sky-b,.current-sky'));
  }

  function skyColor(node) {
    return isSkyB(node) ? SKY_B : SKY_A;
  }

  function firstCoordinate(node, name, fallback) {
    const raw = node.getAttribute(name);
    if (raw != null && raw !== '') {
      const first = String(raw).trim().split(/[ ,]+/)[0];
      const value = Number(first);
      if (Number.isFinite(value)) return value;
    }
    return fallback;
  }

  function sourceAnchor(source) {
    let box = null;
    try { box = source.getBBox(); } catch (_) {}
    return {
      x:firstCoordinate(source, 'x', box ? box.x + box.width / 2 : 0),
      y:firstCoordinate(source, 'y', box ? box.y + box.height / 2 : 0)
    };
  }

  function pointInContainer(source, container) {
    const anchor = sourceAnchor(source);
    const svg = source.ownerSVGElement;
    const sourceMatrix = source.getCTM && source.getCTM();
    const containerMatrix = container.getCTM && container.getCTM();
    if (!svg || !sourceMatrix || !containerMatrix || typeof containerMatrix.inverse !== 'function') return anchor;
    try {
      const point = svg.createSVGPoint();
      point.x = anchor.x;
      point.y = anchor.y;
      const viewportPoint = point.matrixTransform(sourceMatrix);
      const localPoint = viewportPoint.matrixTransform(containerMatrix.inverse());
      if (Number.isFinite(localPoint.x) && Number.isFinite(localPoint.y)) {
        return { x:localPoint.x, y:localPoint.y };
      }
    } catch (_) {}
    return anchor;
  }

  function wheelRadius(svg) {
    const viewBox = svg && svg.viewBox && svg.viewBox.baseVal;
    const span = viewBox && viewBox.width
      ? Math.min(viewBox.width, viewBox.height)
      : Math.min((svg && svg.clientWidth) || 600, (svg && svg.clientHeight) || 600);
    return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, span * RADIUS_RATIO));
  }

  function preparePlacementGeometry(container) {
    const knob = container.querySelector('circle.chart-wheel-stick-knob');
    if (!knob) return;
    knob.dataset.relphiGeometryOnly = 'true';
    knob.setAttribute('fill', 'none');
    knob.setAttribute('stroke', 'none');
    knob.setAttribute('fill-opacity', '0');
    knob.setAttribute('stroke-opacity', '0');
  }

  function removeOldPlacementArtwork(container) {
    container.querySelectorAll(LEGACY_VISUAL_SELECTOR).forEach(function (node) { node.remove(); });
    const hosts = Array.from(container.querySelectorAll(':scope > .relphi-sky-glyph-host'));
    hosts.slice(1).forEach(function (host) { host.remove(); });
  }

  function placementKey(container, entry, point) {
    return [
      isSkyB(container) ? 'b' : 'a',
      entry.id,
      WHEEL_VARIANT,
      point.x.toFixed(3),
      point.y.toFixed(3)
    ].join(':');
  }

  function renderInscribedGlyph(host, entry, radius, color) {
    host.replaceChildren();
    host.dataset.glyphVariant = WHEEL_VARIANT;
    const bubble = window.RelphiGlyphComponent.createBubble(host, entry.id, {
      radius:radius,
      padding:1.25,
      color:color,
      fill:'#fff',
      strokeWidth:2.15
    });
    return bubble.ready;
  }

  function drawPlacement(container) {
    if (!container || !container.querySelectorAll) return;
    preparePlacementGeometry(container);
    removeOldPlacementArtwork(container);

    const sources = Array.from(container.querySelectorAll(GLYPH_SOURCE_SELECTOR)).filter(function (node) {
      return !!identityForGlyphSource(node);
    });
    const existing = container.querySelector(':scope > .relphi-sky-glyph-host');

    if (!sources.length) return;

    const source = sources[0];
    const entry = identityForGlyphSource(source);
    if (!entry) return;
    const svg = source.ownerSVGElement;
    const point = pointInContainer(source, container);
    const key = placementKey(container, entry, point);

    sources.forEach(function (node) { node.remove(); });

    if (existing && existing.dataset.placementKey === key) return;
    if (existing) existing.remove();

    const host = document.createElementNS(NS, 'g');
    host.classList.add('chart-wheel-marker-glyph', 'relphi-sky-glyph-host');
    host.dataset.glyphId = entry.id;
    host.dataset.glyphVariant = WHEEL_VARIANT;
    host.dataset.sky = isSkyB(container) ? 'b' : 'a';
    host.dataset.placementKey = key;
    host.setAttribute('aria-label', entry.name);
    host.setAttribute('transform', 'translate(' + point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ')');
    container.appendChild(host);

    renderInscribedGlyph(host, entry, wheelRadius(svg), skyColor(container)).catch(function (error) {
      host.remove();
      console.error('Could not draw approved SkyChart glyph:', entry.id, error);
    });
  }

  function renderWheel(svg) {
    if (!svg || !svg.querySelectorAll) return;
    svg.dataset.glyphVariant = WHEEL_VARIANT;
    Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR)).forEach(drawPlacement);
  }

  function ensureOptions(root) {
    (root && root.querySelectorAll ? root : document).querySelectorAll('select').forEach(function (select) {
      const existing = new Set(Array.from(select.options).map(function (option) {
        const entry = entryFor(option.value || option.textContent);
        return entry && entry.id;
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
    const result = {
      wheels:wheels.length,
      wheelVariant:WHEEL_VARIANT,
      placements:0,
      hosts:0,
      duplicatePlacements:0,
      plainHosts:0,
      inscribedHosts:0,
      remainingGlyphSources:0,
      oversizedHosts:0
    };
    wheels.forEach(function (svg) {
      const expectedRadius = wheelRadius(svg);
      const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
      result.placements += placements.length;
      placements.forEach(function (group) {
        const hosts = Array.from(group.querySelectorAll(':scope > .relphi-sky-glyph-host'));
        result.hosts += hosts.length;
        if (hosts.length > 1) result.duplicatePlacements += 1;
        hosts.forEach(function (host) {
          if (host.dataset.glyphVariant === 'inscribed') result.inscribedHosts += 1;
          if (host.dataset.glyphVariant === 'plain') result.plainHosts += 1;
          try {
            const box = host.getBBox();
            if (box.width > expectedRadius * 2.8 || box.height > expectedRadius * 2.8) result.oversizedHosts += 1;
          } catch (_) {}
        });
      });
      result.remainingGlyphSources += svg.querySelectorAll(GLYPH_SOURCE_SELECTOR).length;
    });
    result.valid = result.duplicatePlacements === 0 && result.plainHosts === 0 && result.remainingGlyphSources === 0 && result.oversizedHosts === 0;
    return result;
  }

  function render() {
    if (renderRunning) return;
    renderRunning = true;
    try {
      removeLegacyGlyphStyling();
      ensureStyles();
      document.querySelectorAll(WHEEL_SELECTOR).forEach(renderWheel);
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
        wheelVariant:WHEEL_VARIANT,
        refresh:scheduleRender,
        audit:audit
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ version:7, architecture:'one-placement-one-inscribed-host', wheelVariant:WHEEL_VARIANT, skyA:true, skyB:true }
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