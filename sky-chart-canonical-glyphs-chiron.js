// Unified SkyChart renderer for the approved Relphi glyph geometry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const WHEEL_VARIANT = 'inscribed';
  const DEFAULT_COLOR = '#dc1f18';
  const FALLBACK_COLORS = Object.freeze({ skyA:'#dc1f18', skyB:'#3166e2' });
  const MIN_RADIUS = 12.5;
  const MAX_RADIUS = 15.5;
  const RADIUS_RATIO = 0.0225;
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const GLYPH_SOURCE_SELECTOR = [
    'text.chart-wheel-marker-glyph',
    'text[data-glyph-id]',
    'text[data-planet-glyph]',
    'text[data-body-glyph]'
  ].join(',');
  const NAME_SOURCE_SELECTOR = [
    'text.chart-wheel-marker-name',
    '[data-body-name]',
    '[data-planet-name]'
  ].join(',');
  const LEGACY_GLYPH_SELECTOR = [
    '.chart-wheel-marker-glyph:not(.relphi-sky-glyph-host)',
    '.relphi-canonical-glyph:not(.relphi-sky-glyph-host .relphi-canonical-glyph)',
    '.relphi-glyph-bubble:not(.relphi-sky-glyph-host .relphi-glyph-bubble)',
    'image.standardized-planet-glyph',
    'image.relphi-bubble-glyph-image',
    '.relphi-v2-glyph-host',
    '.relphi-sky-glyph-layer',
    '.canonical-sky-glyph'
  ].join(',');
  const LEGACY_STYLE_MARKERS = [
    'sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'
  ];

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

  function ensureStyles() {
    if (document.getElementById('relphi-sky-glyph-native-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-glyph-native-style';
    style.textContent = [
      '.relphi-sky-glyph-host{pointer-events:none}',
      '.relphi-sky-glyph-host>.relphi-glyph-bubble{isolation:isolate}',
      '.relphi-sky-glyph-host>.relphi-glyph-bubble>circle{fill:#fff}',
      '.chart-wheel-stick-knob[data-relphi-geometry-only="true"]{fill:none!important;stroke:none!important;fill-opacity:0!important;stroke-opacity:0!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function removeLegacyStyles() {
    document.querySelectorAll('style[id],link[href]').forEach(function (node) {
      const signature = ((node.id || '') + ' ' + (node.getAttribute('href') || '')).toLowerCase();
      if (LEGACY_STYLE_MARKERS.some(function (marker) { return signature.includes(marker); })) node.remove();
    });
  }

  function entryFor(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && BODY_IDS.has(entry.id) ? entry : null;
  }

  function entryFromAttributes(node) {
    if (!node) return null;
    const values = [
      node.dataset && node.dataset.relphiBodyId,
      node.dataset && node.dataset.glyphId,
      node.dataset && node.dataset.planetGlyph,
      node.dataset && node.dataset.bodyGlyph,
      node.dataset && node.dataset.planet,
      node.dataset && node.dataset.body,
      node.dataset && node.dataset.object,
      node.getAttribute && node.getAttribute('aria-label'),
      node.getAttribute && node.getAttribute('title')
    ];
    for (const value of values) {
      const entry = entryFor(value);
      if (entry) return entry;
    }
    return null;
  }

  function entryFromPlacement(container) {
    let entry = entryFromAttributes(container);
    if (entry) return entry;

    const glyphSource = container.querySelector(GLYPH_SOURCE_SELECTOR);
    entry = entryFromAttributes(glyphSource) || entryFor(glyphSource && glyphSource.textContent);
    if (entry) return entry;

    const nameSource = container.querySelector(NAME_SOURCE_SELECTOR);
    entry = entryFromAttributes(nameSource) || entryFor(nameSource && nameSource.textContent);
    if (entry) return entry;

    for (const text of Array.from(container.querySelectorAll('text'))) {
      const className = String(text.className && text.className.baseVal || '');
      if (/degree|minute|house/i.test(className)) continue;
      entry = entryFromAttributes(text) || entryFor(text.textContent);
      if (entry) return entry;
    }
    return null;
  }

  function cleanColor(value, allowNeutral) {
    const color = String(value || '').trim();
    if (!color) return null;
    const normalized = color.toLowerCase().replace(/\s+/g, '');
    if (normalized === 'none' || normalized === 'transparent' || normalized === 'rgba(0,0,0,0)') return null;
    if (!allowNeutral && (
      normalized === '#000' || normalized === '#000000' || normalized === 'black' ||
      normalized === '#fff' || normalized === '#ffffff' || normalized === 'white' ||
      normalized === 'rgb(0,0,0)' || normalized === 'rgb(255,255,255)'
    )) return null;
    return color;
  }

  function colorFromNode(node) {
    if (!node) return null;
    const nodes = [node].concat(Array.from(node.querySelectorAll ? node.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line,text') : []));
    for (const item of nodes) {
      const direct = [
        item.getAttribute && item.getAttribute('stroke'),
        item.style && item.style.stroke,
        item.getAttribute && item.getAttribute('fill'),
        item.style && item.style.fill
      ];
      for (const value of direct) {
        const color = cleanColor(value, false);
        if (color) return color;
      }
      try {
        const style = getComputedStyle(item);
        const color = cleanColor(style.stroke, false) || cleanColor(style.fill, false);
        if (color) return color;
      } catch (_) {}
    }
    return null;
  }

  function explicitPlacementColor(container) {
    const explicitAncestor = container.closest && container.closest('[data-sky-color],[data-relphi-sky-color],[data-color]');
    const nodes = explicitAncestor && explicitAncestor !== container ? [container, explicitAncestor] : [container];
    for (const node of nodes) {
      const values = [
        node.dataset && node.dataset.relphiSkyColor,
        node.dataset && node.dataset.skyColor,
        node.dataset && node.dataset.color,
        node.getAttribute && node.getAttribute('data-relphi-sky-color'),
        node.getAttribute && node.getAttribute('data-sky-color')
      ];
      try { values.push(getComputedStyle(node).getPropertyValue('--relphi-sky-color')); } catch (_) {}
      for (const value of values) {
        const color = cleanColor(value, true);
        if (color) return color;
      }
    }
    return null;
  }

  function slotIdentity(container) {
    const values = [
      container.dataset && container.dataset.sky,
      container.dataset && container.dataset.skyId,
      container.dataset && container.dataset.slot,
      container.dataset && container.dataset.kind,
      container.getAttribute && container.getAttribute('class')
    ].filter(Boolean).join(' ').toLowerCase();
    if (/(sky.?b|current.?sky|comparison)/.test(values)) return 'skyB';
    if (/(sky.?a|primary)/.test(values)) return 'skyA';
    const output = container.closest && container.closest('#chartOutput,#currentSkyOutput');
    if (output && output.id === 'currentSkyOutput') return 'skyB';
    return 'skyA';
  }

  function placementColor(container) {
    const explicit = explicitPlacementColor(container);
    if (explicit) return explicit;

    const candidates = [
      container.querySelector(GLYPH_SOURCE_SELECTOR),
      container.querySelector('.relphi-canonical-glyph'),
      container.querySelector('.relphi-glyph-bubble'),
      container.querySelector('image.standardized-planet-glyph'),
      container.querySelector('image.relphi-bubble-glyph-image'),
      container.querySelector('circle.chart-wheel-stick-knob')
    ];
    for (const candidate of candidates) {
      const color = colorFromNode(candidate);
      if (color) return color;
    }

    return FALLBACK_COLORS[slotIdentity(container)] || DEFAULT_COLOR;
  }

  function numberAttr(node, name) {
    const value = Number(node && node.getAttribute && node.getAttribute(name));
    return Number.isFinite(value) ? value : null;
  }

  function standardRadius(svg) {
    const viewBox = svg && svg.viewBox && svg.viewBox.baseVal;
    const span = viewBox && viewBox.width
      ? Math.min(viewBox.width, viewBox.height)
      : Math.min((svg && svg.clientWidth) || 600, (svg && svg.clientHeight) || 600);
    return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, span * RADIUS_RATIO));
  }

  function prepareKnob(knob, radius) {
    knob.dataset.relphiGeometryOnly = 'true';
    knob.setAttribute('r', String(radius));
    knob.setAttribute('fill', 'none');
    knob.setAttribute('stroke', 'none');
    knob.setAttribute('fill-opacity', '0');
    knob.setAttribute('stroke-opacity', '0');
  }

  function removeLegacyArtwork(container) {
    container.querySelectorAll(LEGACY_GLYPH_SELECTOR).forEach(function (node) {
      if (!node.closest('.relphi-sky-glyph-host')) node.remove();
    });
    Array.from(container.querySelectorAll(GLYPH_SOURCE_SELECTOR)).forEach(function (source) {
      if (!source.closest('.relphi-sky-glyph-host')) source.remove();
    });
    const hosts = Array.from(container.querySelectorAll(':scope > .relphi-sky-glyph-host'));
    hosts.slice(1).forEach(function (host) { host.remove(); });
  }

  function placementKey(entry, color, x, y, radius) {
    return [entry.id, WHEEL_VARIANT, color, x.toFixed(3), y.toFixed(3), radius.toFixed(3)].join(':');
  }

  function renderInscribed(host, entry, color, radius) {
    host.replaceChildren();
    host.dataset.glyphVariant = WHEEL_VARIANT;
    host.dataset.glyphColor = color;
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
    const svg = container && container.ownerSVGElement;
    const knob = container && container.querySelector('circle.chart-wheel-stick-knob');
    if (!svg || !knob) return;

    const entry = entryFromPlacement(container);
    if (!entry) return;

    const color = placementColor(container);
    const x = numberAttr(knob, 'cx');
    const y = numberAttr(knob, 'cy');
    if (x == null || y == null) return;

    const radius = standardRadius(svg);
    container.dataset.relphiBodyId = entry.id;
    container.dataset.relphiSkyColor = color;
    prepareKnob(knob, radius);
    removeLegacyArtwork(container);

    const key = placementKey(entry, color, x, y, radius);
    let host = container.querySelector(':scope > .relphi-sky-glyph-host');
    if (host && host.dataset.placementKey === key) return;
    if (host) host.remove();

    host = document.createElementNS(NS, 'g');
    host.classList.add('relphi-sky-glyph-host');
    host.dataset.glyphId = entry.id;
    host.dataset.glyphVariant = WHEEL_VARIANT;
    host.dataset.glyphColor = color;
    host.dataset.placementKey = key;
    host.setAttribute('aria-label', entry.name);
    host.setAttribute('transform', 'translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ')');
    container.appendChild(host);

    renderInscribed(host, entry, color, radius).then(function () {
      if (window.RelphiWheelCollision && typeof window.RelphiWheelCollision.schedule === 'function') {
        window.RelphiWheelCollision.schedule();
      }
    }).catch(function (error) {
      host.remove();
      console.error('Could not draw approved SkyChart glyph:', entry.id, error);
    });
  }

  function renderWheel(svg) {
    const placements = Array.from(svg && svg.querySelectorAll ? svg.querySelectorAll(PLACEMENT_SELECTOR) : []);
    if (!placements.length) return;
    svg.dataset.glyphVariant = WHEEL_VARIANT;
    svg.querySelectorAll('.relphi-v2-glyph-host,.relphi-sky-glyph-layer').forEach(function (node) { node.remove(); });
    placements.forEach(drawPlacement);
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
    const result = {
      geometrySource:'RelphiGlyphComponent.createBubble',
      wheelVariant:WHEEL_VARIANT,
      wheels:0,
      placements:0,
      hosts:0,
      duplicatePlacements:0,
      plainHosts:0,
      remainingLegacyGlyphs:0,
      oversizedHosts:0,
      colors:{}
    };

    document.querySelectorAll(WHEEL_SELECTOR).forEach(function (svg) {
      const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
      if (!placements.length) return;
      result.wheels += 1;
      result.placements += placements.length;
      const expectedRadius = standardRadius(svg);

      placements.forEach(function (group) {
        const hosts = Array.from(group.querySelectorAll(':scope > .relphi-sky-glyph-host'));
        result.hosts += hosts.length;
        if (hosts.length > 1) result.duplicatePlacements += 1;
        hosts.forEach(function (host) {
          if (host.dataset.glyphVariant === 'plain') result.plainHosts += 1;
          const color = host.dataset.glyphColor || 'unknown';
          result.colors[color] = (result.colors[color] || 0) + 1;
          try {
            const box = host.getBBox();
            if (box.width > expectedRadius * 2.8 || box.height > expectedRadius * 2.8) result.oversizedHosts += 1;
          } catch (_) {}
        });
        result.remainingLegacyGlyphs += group.querySelectorAll(LEGACY_GLYPH_SELECTOR).length;
      });
    });

    result.valid =
      result.hosts === result.placements &&
      result.duplicatePlacements === 0 &&
      result.plainHosts === 0 &&
      result.remainingLegacyGlyphs === 0 &&
      result.oversizedHosts === 0;
    return result;
  }

  function render() {
    if (renderRunning) return;
    renderRunning = true;
    try {
      removeLegacyStyles();
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
        geometrySource:'single',
        wheelVariant:WHEEL_VARIANT,
        refresh:scheduleRender,
        audit:audit
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{
          version:11,
          architecture:'one-geometry-color-parameterized',
          geometrySource:'RelphiGlyphComponent.createBubble',
          wheelVariant:WHEEL_VARIANT
        }
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
