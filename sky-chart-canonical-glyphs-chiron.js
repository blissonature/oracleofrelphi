// Single-source SkyChart integration for the approved Relphi glyph system.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const SKY_A = '#dc1f18';
  const SKY_B = '#3166e2';
  const WHEEL_VARIANT = 'inscribed';
  const MIN_RADIUS = 12.5;
  const MAX_RADIUS = 15.5;
  const RADIUS_RATIO = 0.0225;
  const LEGACY_STYLE_MARKERS = [
    'sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'
  ];
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
  const LEGACY_NODE_SELECTOR = [
    'image',
    '.standardized-planet-glyph',
    '.relphi-bubble-glyph-image',
    '.relphi-v2-glyph-host',
    '.relphi-sky-glyph-layer',
    '.canonical-sky-glyph'
  ].join(',');

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

    const explicit = container.querySelector(GLYPH_SOURCE_SELECTOR);
    entry = entryFromAttributes(explicit) || entryFor(explicit && explicit.textContent);
    if (entry) return entry;

    const name = container.querySelector(NAME_SOURCE_SELECTOR);
    entry = entryFromAttributes(name) || entryFor(name && name.textContent);
    if (entry) return entry;

    const texts = Array.from(container.querySelectorAll('text'));
    for (const text of texts) {
      if (/degree|minute|house/i.test(String(text.className && text.className.baseVal || ''))) continue;
      entry = entryFromAttributes(text) || entryFor(text.textContent);
      if (entry) return entry;
    }
    return null;
  }

  function normalizePaint(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function paintColor(value) {
    const paint = normalizePaint(value);
    if (!paint || paint === 'none' || paint === 'transparent') return null;
    if (
      paint.includes('#3166e2') ||
      paint.includes('rgb(49,102,226)') ||
      paint.includes('rgba(49,102,226,')
    ) return SKY_B;
    if (
      paint.includes('#dc1f18') ||
      paint.includes('rgb(220,31,24)') ||
      paint.includes('rgba(220,31,24,')
    ) return SKY_A;
    return null;
  }

  function colorFromNode(node) {
    if (!node) return null;
    const direct = [
      node.getAttribute && node.getAttribute('fill'),
      node.getAttribute && node.getAttribute('stroke'),
      node.style && node.style.fill,
      node.style && node.style.stroke
    ];
    for (const value of direct) {
      const color = paintColor(value);
      if (color) return color;
    }
    try {
      const style = getComputedStyle(node);
      return paintColor(style.fill) || paintColor(style.stroke);
    } catch (_) {
      return null;
    }
  }

  function colorFromPlacement(container) {
    const saved = paintColor(container.dataset && container.dataset.relphiSkyColor);
    if (saved) return saved;

    const signature = [
      container.dataset && container.dataset.sky,
      container.dataset && container.dataset.skyId,
      container.dataset && container.dataset.slot,
      container.dataset && container.dataset.kind,
      container.getAttribute && container.getAttribute('class'),
      container.closest && container.closest('[data-sky],[data-sky-id],#chartOutput,#currentSkyOutput')?.getAttribute('id')
    ].filter(Boolean).join(' ').toLowerCase();

    if (/(sky.?b|current.?sky|comparison|blue)/.test(signature)) return SKY_B;
    if (/(sky.?a|primary|chartoutput|red)/.test(signature)) return SKY_A;

    const candidates = Array.from(container.querySelectorAll(
      GLYPH_SOURCE_SELECTOR + ',circle.chart-wheel-stick-knob,line.chart-wheel-stick'
    ));
    for (const node of candidates) {
      const color = colorFromNode(node);
      if (color) return color;
    }
    return container.closest && container.closest('#currentSkyOutput') ? SKY_B : SKY_A;
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

  function removeLegacyArtwork(container) {
    container.querySelectorAll(LEGACY_NODE_SELECTOR).forEach(function (node) {
      if (!node.closest('.relphi-sky-glyph-host')) node.remove();
    });

    Array.from(container.querySelectorAll('text')).forEach(function (text) {
      if (text.closest('.relphi-sky-glyph-host')) return;
      const className = String(text.className && text.className.baseVal || '');
      const resolved = entryFromAttributes(text) || entryFor(text.textContent);
      if (!resolved) return;
      if (/chart-wheel-marker-name|degree|minute|house/i.test(className)) return;
      text.remove();
    });

    const hosts = Array.from(container.querySelectorAll(':scope > .relphi-sky-glyph-host'));
    hosts.slice(1).forEach(function (host) { host.remove(); });
  }

  function prepareKnob(knob, radius) {
    if (!knob) return;
    knob.dataset.relphiGeometryOnly = 'true';
    knob.setAttribute('r', String(radius));
    knob.setAttribute('fill', 'none');
    knob.setAttribute('stroke', 'none');
    knob.setAttribute('fill-opacity', '0');
    knob.setAttribute('stroke-opacity', '0');
  }

  function placementKey(entry, color, x, y, radius) {
    return [
      entry.id,
      color === SKY_B ? 'b' : 'a',
      WHEEL_VARIANT,
      x.toFixed(3),
      y.toFixed(3),
      radius.toFixed(3)
    ].join(':');
  }

  function renderBubble(host, entry, color, radius) {
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

    const svg = container.ownerSVGElement;
    const knob = container.querySelector('circle.chart-wheel-stick-knob');
    if (!svg || !knob) return;

    const entry = entryFromPlacement(container);
    if (!entry) return;

    const color = colorFromPlacement(container);
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
    host.classList.add('chart-wheel-marker-glyph', 'relphi-sky-glyph-host');
    host.dataset.glyphId = entry.id;
    host.dataset.glyphVariant = WHEEL_VARIANT;
    host.dataset.sky = color === SKY_B ? 'b' : 'a';
    host.dataset.placementKey = key;
    host.setAttribute('aria-label', entry.name);
    host.setAttribute('transform', 'translate(' + x.toFixed(3) + ' ' + y.toFixed(3) + ')');
    container.appendChild(host);

    renderBubble(host, entry, color, radius).catch(function (error) {
      host.remove();
      console.error('Could not draw approved SkyChart glyph:', entry.id, error);
    });
  }

  function removeDetachedLegacyArtwork(svg) {
    svg.querySelectorAll('.relphi-v2-glyph-host,.relphi-sky-glyph-layer').forEach(function (node) {
      node.remove();
    });
    svg.querySelectorAll('image').forEach(function (image) {
      if (!image.closest(PLACEMENT_SELECTOR) && !image.closest('.relphi-sky-glyph-host')) image.remove();
    });
    svg.querySelectorAll(GLYPH_SOURCE_SELECTOR).forEach(function (source) {
      if (!source.closest(PLACEMENT_SELECTOR)) source.remove();
    });
  }

  function renderWheel(svg) {
    if (!svg || !svg.querySelectorAll) return;
    const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
    if (!placements.length) return;
    svg.dataset.glyphVariant = WHEEL_VARIANT;
    removeDetachedLegacyArtwork(svg);
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
      wheelVariant:WHEEL_VARIANT,
      wheels:0,
      placements:0,
      hosts:0,
      redHosts:0,
      blueHosts:0,
      duplicatePlacements:0,
      plainHosts:0,
      remainingGlyphSources:0,
      oversizedHosts:0,
      misplacedHosts:0
    };

    document.querySelectorAll(WHEEL_SELECTOR).forEach(function (svg) {
      const placements = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
      if (!placements.length) return;
      result.wheels += 1;
      const expectedRadius = standardRadius(svg);
      result.placements += placements.length;

      placements.forEach(function (group) {
        const knob = group.querySelector('circle.chart-wheel-stick-knob');
        const hosts = Array.from(group.querySelectorAll(':scope > .relphi-sky-glyph-host'));
        result.hosts += hosts.length;
        if (hosts.length > 1) result.duplicatePlacements += 1;
        hosts.forEach(function (host) {
          if (host.dataset.glyphVariant === 'plain') result.plainHosts += 1;
          if (host.dataset.sky === 'b') result.blueHosts += 1;
          else result.redHosts += 1;
          try {
            const box = host.getBBox();
            if (box.width > expectedRadius * 2.8 || box.height > expectedRadius * 2.8) result.oversizedHosts += 1;
          } catch (_) {}
          if (knob) {
            const x = numberAttr(knob, 'cx');
            const y = numberAttr(knob, 'cy');
            const transform = host.getAttribute('transform') || '';
            if (x != null && y != null && !transform.includes(x.toFixed(3)) && !transform.includes(y.toFixed(3))) {
              result.misplacedHosts += 1;
            }
          }
        });
      });
      result.remainingGlyphSources += svg.querySelectorAll(GLYPH_SOURCE_SELECTOR).length;
    });

    result.valid =
      result.duplicatePlacements === 0 &&
      result.plainHosts === 0 &&
      result.remainingGlyphSources === 0 &&
      result.oversizedHosts === 0 &&
      result.misplacedHosts === 0 &&
      result.hosts === result.placements;
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
        wheelVariant:WHEEL_VARIANT,
        refresh:scheduleRender,
        audit:audit
      };

      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{
          version:8,
          architecture:'knob-anchored-one-placement-one-inscribed-host',
          wheelVariant:WHEEL_VARIANT,
          skyA:true,
          skyB:true
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
