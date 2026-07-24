// Root-coordinate SkyChart renderer for the approved Relphi glyph geometry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const SOURCE_SELECTOR = [
    'text.chart-wheel-marker-glyph',
    'text[data-glyph-id]',
    'text[data-planet-glyph]',
    'text[data-body-glyph]'
  ].join(',');
  const NAME_SELECTOR = [
    'text.chart-wheel-marker-name',
    '[data-body-name]',
    '[data-planet-name]'
  ].join(',');
  const BODY_IDS = new Set([
    'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
    'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
  ]);
  const DEFAULT_COLORS = Object.freeze({ skyA:'#dc1f18', skyB:'#3166e2' });
  const DEFAULT_COLOR = DEFAULT_COLORS.skyA;
  const MIN_RADIUS = 11.5;
  const MAX_RADIUS = 14.5;
  const RADIUS_RATIO = 0.0205;
  const OWN_LAYER = 'relphi-sky-glyph-layer';
  const OWN_HOST = 'relphi-sky-glyph-host';
  const HIDDEN_SOURCE = 'relphi-legacy-glyph-source';
  const LEGACY_STYLE_MARKERS = [
    'sky-ledger-glyph','wheel-glyph','ph-glyph','glyph-bubble','canonical-sky-glyph'
  ];

  let queued = false;
  let running = false;
  let generation = 0;

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
    let style = document.getElementById('relphi-sky-glyph-root-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-sky-glyph-root-style';
      document.head.appendChild(style);
    }
    style.textContent = [
      '.' + OWN_LAYER + '{pointer-events:none}',
      '.' + OWN_HOST + '{pointer-events:none}',
      '.' + OWN_HOST + '>.relphi-glyph-bubble{isolation:isolate}',
      '.' + OWN_HOST + '>.relphi-glyph-bubble>circle{fill:#fff}',
      '.' + HIDDEN_SOURCE + '{display:none!important;visibility:hidden!important;opacity:0!important}',
      '.chart-wheel-stick-knob[data-relphi-geometry-only="true"]{fill:none!important;stroke:none!important;fill-opacity:0!important;stroke-opacity:0!important}'
    ].join('');
  }

  function removeLegacyStyles() {
    document.querySelectorAll('style[id],link[href]').forEach(function (node) {
      const signature = ((node.id || '') + ' ' + (node.getAttribute('href') || '')).toLowerCase();
      if (node.id !== 'relphi-sky-glyph-root-style' && LEGACY_STYLE_MARKERS.some(function (marker) {
        return signature.includes(marker);
      })) node.remove();
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

  function sourceForPlacement(group) {
    return group.querySelector(SOURCE_SELECTOR);
  }

  function entryFromPlacement(group) {
    let entry = entryFromAttributes(group);
    if (entry) return entry;

    const source = sourceForPlacement(group);
    entry = entryFromAttributes(source) || entryFor(source && source.textContent);
    if (entry) return entry;

    const name = group.querySelector(NAME_SELECTOR);
    entry = entryFromAttributes(name) || entryFor(name && name.textContent);
    if (entry) return entry;

    for (const text of Array.from(group.querySelectorAll('text'))) {
      const className = String(text.className && text.className.baseVal || '');
      if (/degree|minute|house/i.test(className)) continue;
      entry = entryFromAttributes(text) || entryFor(text.textContent);
      if (entry) return entry;
    }
    return null;
  }

  function validColor(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === 'none' || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)') return null;
    return raw;
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
      const color = validColor(value);
      if (color) return color;
    }
    try {
      const style = getComputedStyle(node);
      return validColor(style.fill) || validColor(style.stroke);
    } catch (_) {
      return null;
    }
  }

  function slotIdentity(group) {
    const signature = [
      group.dataset && group.dataset.sky,
      group.dataset && group.dataset.skyId,
      group.dataset && group.dataset.slot,
      group.dataset && group.dataset.kind,
      group.getAttribute && group.getAttribute('class')
    ].filter(Boolean).join(' ').toLowerCase();
    if (/(sky.?c|third)/.test(signature)) return 'skyC';
    if (/(sky.?b|current.?sky|comparison|blue)/.test(signature)) return 'skyB';
    if (/(sky.?a|primary|red)/.test(signature)) return 'skyA';
    const output = group.closest && group.closest('#chartOutput,#currentSkyOutput');
    return output && output.id === 'currentSkyOutput' ? 'skyB' : 'skyA';
  }

  function placementColor(group) {
    const stored = validColor(group.dataset && group.dataset.relphiSkyColor);
    if (stored) return stored;

    const candidates = [
      sourceForPlacement(group),
      group.querySelector('circle.chart-wheel-stick-knob'),
      group.querySelector('line.chart-wheel-stick'),
      group.querySelector('.relphi-canonical-glyph'),
      group.querySelector('.relphi-glyph-bubble'),
      group.querySelector('image')
    ];
    for (const candidate of candidates) {
      const color = colorFromNode(candidate);
      if (color) return color;
    }

    return DEFAULT_COLORS[slotIdentity(group)] || DEFAULT_COLOR;
  }

  function numberAttr(node, name) {
    const value = Number(node && node.getAttribute && node.getAttribute(name));
    return Number.isFinite(value) ? value : null;
  }

  function pointInRoot(node, x, y, svg) {
    const sourceMatrix = node && node.getScreenCTM && node.getScreenCTM();
    const rootMatrix = svg && svg.getScreenCTM && svg.getScreenCTM();
    if (!sourceMatrix || !rootMatrix || typeof rootMatrix.inverse !== 'function') return { x:x, y:y };
    try {
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      return point.matrixTransform(sourceMatrix).matrixTransform(rootMatrix.inverse());
    } catch (_) {
      return { x:x, y:y };
    }
  }

  function anchorForPlacement(group, svg) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (!knob) return null;
    const cx = numberAttr(knob, 'cx');
    const cy = numberAttr(knob, 'cy');
    if (cx == null || cy == null) return null;
    const root = pointInRoot(knob, cx, cy, svg);
    if (!Number.isFinite(root.x) || !Number.isFinite(root.y)) return null;
    return { x:root.x, y:root.y, knob:knob };
  }

  function standardRadius(svg) {
    const viewBox = svg && svg.viewBox && svg.viewBox.baseVal;
    const span = viewBox && viewBox.width
      ? Math.min(viewBox.width, viewBox.height)
      : Math.min((svg && svg.clientWidth) || 600, (svg && svg.clientHeight) || 600);
    return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, span * RADIUS_RATIO));
  }

  function markLegacySources(svg) {
    svg.querySelectorAll(SOURCE_SELECTOR).forEach(function (node) {
      if (!node.closest('.' + OWN_LAYER)) node.classList.add(HIDDEN_SOURCE);
    });
    svg.querySelectorAll('image.standardized-planet-glyph,image.relphi-bubble-glyph-image,.relphi-v2-glyph-host,.canonical-sky-glyph').forEach(function (node) {
      if (!node.closest('.' + OWN_LAYER)) node.remove();
    });
    svg.querySelectorAll('.relphi-glyph-bubble,.relphi-canonical-glyph').forEach(function (node) {
      if (!node.closest('.' + OWN_LAYER)) node.remove();
    });
  }

  function prepareKnob(knob) {
    knob.dataset.relphiGeometryOnly = 'true';
  }

  function makeLayer(svg, renderId) {
    svg.querySelectorAll(':scope > .' + OWN_LAYER).forEach(function (node) { node.remove(); });
    const layer = document.createElementNS(NS, 'g');
    layer.classList.add(OWN_LAYER);
    layer.dataset.renderId = String(renderId);
    layer.setAttribute('aria-label', 'Sky placement glyphs');
    svg.appendChild(layer);
    return layer;
  }

  function renderHost(layer, placement, radius, renderId) {
    const host = document.createElementNS(NS, 'g');
    host.classList.add(OWN_HOST);
    host.dataset.glyphId = placement.entry.id;
    host.dataset.glyphVariant = 'inscribed';
    host.dataset.glyphColor = placement.color;
    host.dataset.placementIndex = String(placement.index);
    host.setAttribute('aria-label', placement.entry.name);
    host.setAttribute('transform', 'translate(' + placement.x.toFixed(3) + ' ' + placement.y.toFixed(3) + ')');
    layer.appendChild(host);

    const bubble = window.RelphiGlyphComponent.createBubble(host, placement.entry.id, {
      radius:radius,
      padding:1.25,
      color:placement.color,
      fill:'#fff',
      strokeWidth:2.15
    });

    return bubble.ready.then(function () {
      if (!layer.isConnected || layer.dataset.renderId !== String(renderId)) return;
      host.dataset.ready = 'true';
    }).catch(function (error) {
      host.remove();
      console.error('Could not draw approved SkyChart glyph:', placement.entry.id, error);
    });
  }

  function collectPlacements(svg) {
    const placements = [];
    Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR)).forEach(function (group, index) {
      const entry = entryFromPlacement(group);
      const anchor = anchorForPlacement(group, svg);
      if (!entry || !anchor) return;
      const color = placementColor(group);
      group.dataset.relphiBodyId = entry.id;
      group.dataset.relphiSkyColor = color;
      prepareKnob(anchor.knob);
      placements.push({ group:group, index:index, entry:entry, color:color, x:anchor.x, y:anchor.y });
    });
    return placements;
  }

  function auditWheel(svg, placements, layer, radius) {
    const hosts = Array.from(layer.querySelectorAll(':scope > .' + OWN_HOST));
    let oversized = 0;
    hosts.forEach(function (host) {
      try {
        const box = host.getBBox();
        if (box.width > radius * 2.6 || box.height > radius * 2.6) oversized += 1;
      } catch (_) {}
    });
    return {
      placements:placements.length,
      hosts:hosts.length,
      hiddenLegacySources:svg.querySelectorAll('.' + HIDDEN_SOURCE).length,
      oversizedHosts:oversized,
      valid:hosts.length === placements.length && oversized === 0
    };
  }

  function renderWheel(svg, renderId) {
    const placements = collectPlacements(svg);
    if (!placements.length) return Promise.resolve(null);
    markLegacySources(svg);
    const radius = standardRadius(svg);
    const layer = makeLayer(svg, renderId);
    const jobs = placements.map(function (placement) {
      return renderHost(layer, placement, radius, renderId);
    });
    return Promise.allSettled(jobs).then(function () {
      if (!layer.isConnected || layer.dataset.renderId !== String(renderId)) return null;
      const audit = auditWheel(svg, placements, layer, radius);
      svg.dataset.relphiGlyphAudit = JSON.stringify(audit);
      return audit;
    });
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

  function render() {
    if (running) return;
    running = true;
    queued = false;
    const renderId = ++generation;
    removeLegacyStyles();
    ensureStyles();
    const wheels = Array.from(document.querySelectorAll(WHEEL_SELECTOR));
    Promise.allSettled(wheels.map(function (svg) { return renderWheel(svg, renderId); }))
      .then(function (results) {
        if (renderId !== generation) return;
        const audits = results.map(function (result) { return result.status === 'fulfilled' ? result.value : null; }).filter(Boolean);
        document.documentElement.dataset.relphiSkyGlyphAudit = JSON.stringify({
          geometrySource:'RelphiGlyphComponent',
          variant:'inscribed',
          wheels:audits.length,
          audits:audits
        });
      })
      .finally(function () {
        if (renderId === generation) running = false;
      });
    ensureOptions(document);
  }

  function scheduleRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(render);
    });
  }

  function mutationIsOwn(record) {
    const nodes = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || []));
    return nodes.length && nodes.every(function (node) {
      return node.nodeType !== Node.ELEMENT_NODE ||
        node.classList && (node.classList.contains(OWN_LAYER) || node.classList.contains(OWN_HOST)) ||
        node.closest && node.closest('.' + OWN_LAYER);
    });
  }

  function installObserver() {
    const root = document.getElementById('chartPanel') || document.body;
    new MutationObserver(function (records) {
      if (records.every(mutationIsOwn)) return;
      const relevant = records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.matches && (node.matches(PLACEMENT_SELECTOR) || node.matches('svg')) ||
             node.querySelector && (node.querySelector(PLACEMENT_SELECTOR) || node.querySelector('svg')));
        });
      });
      if (relevant) scheduleRender();
    }).observe(root, { childList:true, subtree:true });
  }

  function start() {
    dependencies().then(function () {
      scheduleRender();
      [120, 360, 900, 1800].forEach(function (delay) { setTimeout(scheduleRender, delay); });
      window.addEventListener('resize', scheduleRender, { passive:true });
      window.addEventListener('relphi:sky-builder-v4-loaded', scheduleRender);
      installObserver();

      window.RelphiCanonicalSkyGlyphs = {
        registry:window.RelphiGlyphRegistry,
        component:window.RelphiGlyphComponent,
        geometrySource:'single',
        variant:'inscribed',
        refresh:scheduleRender
      };
      window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', {
        detail:{ version:13, architecture:'root-coordinate-single-geometry', variant:'inscribed' }
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