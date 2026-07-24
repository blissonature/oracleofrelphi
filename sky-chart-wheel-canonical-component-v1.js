// SkyChart wheel: one atomic canonical inscribed-glyph render per wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const WHEEL_SELECTOR = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const LAYER_CLASS = 'relphi-canonical-marker-layer';
  const STAGING_CLASS = 'relphi-canonical-marker-staging';
  const HOST_CLASS = 'relphi-canonical-marker-host';
  const LEADER_CLASS = 'relphi-canonical-marker-leader';
  const READY_CLASS = 'relphi-canonical-ready';
  const FALLBACK_CLASS = 'relphi-canonical-fallback';
  const RED = '#dc1f18';
  const BLUE = '#3166e2';
  const PURPLE = '#7651c9';
  const MIN_RADIUS = 15.5;
  const MAX_RADIUS = 18;
  const RADIUS_RATIO = 0.022;
  const GAP = 7;
  const MAX_TANGENTIAL_SHIFT = 92;
  const ITERATIONS = 64;

  let queued = false;
  let rendering = false;
  let dirty = false;
  let timer = 0;
  const generations = new WeakMap();

  function svgNode(name) {
    return document.createElementNS(NS, name);
  }

  function numberAttr(node, name) {
    const value = Number(node && node.getAttribute && node.getAttribute(name));
    return Number.isFinite(value) ? value : NaN;
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function nextGeneration(svg) {
    const value = (generations.get(svg) || 0) + 1;
    generations.set(svg, value);
    return value;
  }

  function isCurrent(svg, generation) {
    return svg.isConnected && generations.get(svg) === generation;
  }

  function pointInRoot(svg, node, x, y) {
    try {
      const nodeMatrix = node && node.getScreenCTM && node.getScreenCTM();
      const rootMatrix = svg && svg.getScreenCTM && svg.getScreenCTM();
      if (nodeMatrix && rootMatrix) {
        const screenPoint = new DOMPoint(x, y).matrixTransform(nodeMatrix);
        const rootPoint = screenPoint.matrixTransform(rootMatrix.inverse());
        return { x:rootPoint.x, y:rootPoint.y };
      }
    } catch (_) {}
    try {
      const matrix = node && node.getCTM && node.getCTM();
      if (matrix) {
        const point = new DOMPoint(x, y).matrixTransform(matrix);
        return { x:point.x, y:point.y };
      }
    } catch (_) {}
    return { x:x, y:y };
  }

  function wheelCenter(svg) {
    const box = svg && svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    }
    const width = Number(svg.getAttribute('width')) || svg.clientWidth || 800;
    const height = Number(svg.getAttribute('height')) || svg.clientHeight || 800;
    return { x:width / 2, y:height / 2 };
  }

  function standardRadius(svg) {
    const box = svg && svg.viewBox && svg.viewBox.baseVal;
    const span = box && box.width > 0
      ? Math.min(box.width, box.height)
      : Math.min(svg.clientWidth || 800, svg.clientHeight || 800);
    return Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, span * RADIUS_RATIO));
  }

  function entryFor(value) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry || value == null) return null;
    return registry.resolve(value) || registry.get(value) || null;
  }

  function entryFromPlacement(group) {
    const name = group.querySelector('.chart-wheel-marker-name,[data-body-name],[data-planet-name]');
    const glyph = group.querySelector('.chart-wheel-marker-glyph,[data-glyph-id],[data-body-glyph],[data-planet-glyph]');
    const candidates = [
      group.dataset && group.dataset.relphiBodyId,
      group.dataset && group.dataset.body,
      group.dataset && group.dataset.planet,
      group.dataset && group.dataset.name,
      group.dataset && group.dataset.placement,
      group.getAttribute && group.getAttribute('data-body'),
      group.getAttribute && group.getAttribute('data-name'),
      group.getAttribute && group.getAttribute('aria-label'),
      name && name.textContent,
      glyph && glyph.dataset && glyph.dataset.glyphId,
      glyph && glyph.textContent
    ];
    for (const candidate of candidates) {
      const entry = entryFor(bare(candidate));
      if (entry) return entry;
    }
    return null;
  }

  function skyIdentity(group) {
    const signature = [
      group.className && group.className.baseVal,
      group.dataset && group.dataset.sky,
      group.dataset && group.dataset.slot,
      group.dataset && group.dataset.kind,
      group.getAttribute && group.getAttribute('aria-label')
    ].filter(Boolean).join(' ').toLowerCase();
    if (/(sky[-_ ]?c|third)/.test(signature)) return 'skyC';
    if (/(sky[-_ ]?b|current[-_ ]?sky|comparison)/.test(signature)) return 'skyB';
    return 'skyA';
  }

  function skyColor(sky) {
    return sky === 'skyB' ? BLUE : sky === 'skyC' ? PURPLE : RED;
  }

  function contactForPlacement(svg, group) {
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    if (contact) {
      const x = numberAttr(contact, 'cx');
      const y = numberAttr(contact, 'cy');
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const root = pointInRoot(svg, contact, x, y);
        if (Number.isFinite(root.x) && Number.isFinite(root.y)) return root;
      }
    }
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (knob) {
      const x = numberAttr(knob, 'cx');
      const y = numberAttr(knob, 'cy');
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const root = pointInRoot(svg, knob, x, y);
        if (Number.isFinite(root.x) && Number.isFinite(root.y)) return root;
      }
    }
    return null;
  }

  function laneDistance(sky, radius) {
    if (sky === 'skyB') return radius * 5.2;
    if (sky === 'skyC') return radius * 4.25;
    return radius * 3.3;
  }

  function collectPlacements(svg, radius) {
    const center = wheelCenter(svg);
    const placements = [];
    Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR)).forEach(function (group, index) {
      const entry = entryFromPlacement(group);
      const contact = contactForPlacement(svg, group);
      if (!entry || !contact) return;
      const dx = contact.x - center.x;
      const dy = contact.y - center.y;
      const length = Math.hypot(dx, dy) || 1;
      const radial = { x:dx / length, y:dy / length };
      const tangent = { x:-radial.y, y:radial.x };
      const sky = skyIdentity(group);
      placements.push({
        index:index,
        group:group,
        entry:entry,
        sky:sky,
        color:skyColor(sky),
        contact:contact,
        radial:radial,
        tangent:tangent,
        outward:laneDistance(sky, radius),
        tangential:0
      });
    });
    return placements;
  }

  function position(item) {
    return {
      x:item.contact.x + item.radial.x * item.outward + item.tangent.x * item.tangential,
      y:item.contact.y + item.radial.y * item.outward + item.tangent.y * item.tangential
    };
  }

  function solveCollisions(items, radius) {
    const minimum = radius * 2 + GAP;
    for (let pass = 0; pass < ITERATIONS; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a];
          const second = items[b];
          const p = position(first);
          const q = position(second);
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= minimum) continue;
          const cross = first.radial.x * second.radial.y - first.radial.y * second.radial.x;
          const direction = Math.sign(cross) || (first.index < second.index ? 1 : -1);
          const push = Math.min(8, (minimum - distance) * 0.58 + 0.75);
          first.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, first.tangential - direction * push / 2));
          second.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, second.tangential + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function ensureStyles() {
    let style = document.getElementById('relphi-canonical-wheel-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-canonical-wheel-style';
      document.head.appendChild(style);
    }
    style.textContent = [
      '.' + LAYER_CLASS + '{pointer-events:none}',
      '.' + STAGING_CLASS + '{visibility:hidden!important;pointer-events:none}',
      '.' + HOST_CLASS + '{pointer-events:none}',
      '.' + LEADER_CLASS + '{fill:none;stroke:#111;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}',
      'svg.' + READY_CLASS + ' .chart-wheel-marker-glyph{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.' + READY_CLASS + ' circle.chart-wheel-stick-knob{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.' + READY_CLASS + ' line.chart-wheel-stick{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.' + READY_CLASS + ' .relphi-marker-unit,svg.' + READY_CLASS + ' .relphi-wheel-planet-glyph,svg.' + READY_CLASS + ' .relphi-approved-glyph,svg.' + READY_CLASS + ' .relphi-fortune-vector,svg.' + READY_CLASS + ' svg.relphi-colored-glyph,svg.' + READY_CLASS + ' svg.relphi-bold-inline-glyph,svg.' + READY_CLASS + ' image.relphi-bubble-glyph-image{display:none!important;visibility:hidden!important;opacity:0!important}'
    ].join('');
  }

  function createLayer(svg, generation) {
    const layer = svgNode('g');
    layer.classList.add(LAYER_CLASS, STAGING_CLASS);
    layer.dataset.generation = String(generation);
    layer.setAttribute('aria-label', 'Canonical sky placement glyphs');
    const leaders = svgNode('g');
    leaders.classList.add('relphi-canonical-leader-layer');
    const glyphs = svgNode('g');
    glyphs.classList.add('relphi-canonical-glyph-layer');
    layer.append(leaders, glyphs);
    svg.appendChild(layer);
    return { root:layer, leaders:leaders, glyphs:glyphs };
  }

  function drawLeader(layer, item, point, radius) {
    const dx = point.x - item.contact.x;
    const dy = point.y - item.contact.y;
    const length = Math.hypot(dx, dy) || 1;
    const end = {
      x:point.x - dx / length * (radius + 1.5),
      y:point.y - dy / length * (radius + 1.5)
    };
    const line = svgNode('line');
    line.classList.add(LEADER_CLASS);
    line.setAttribute('x1', item.contact.x.toFixed(3));
    line.setAttribute('y1', item.contact.y.toFixed(3));
    line.setAttribute('x2', end.x.toFixed(3));
    line.setAttribute('y2', end.y.toFixed(3));
    line.dataset.glyphId = item.entry.id;
    layer.appendChild(line);
  }

  function drawHost(layer, item, point, radius) {
    const host = svgNode('g');
    host.classList.add(HOST_CLASS);
    host.dataset.glyphId = item.entry.id;
    host.dataset.sky = item.sky;
    host.dataset.glyphColor = item.color;
    host.setAttribute('transform', 'translate(' + point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ')');
    host.setAttribute('aria-label', item.entry.name);
    layer.appendChild(host);
    const bubble = window.RelphiGlyphComponent.createBubble(host, item.entry.id, {
      radius:radius,
      padding:1.35,
      color:item.color,
      fill:'#fff',
      strokeWidth:2.25
    });
    return bubble.ready.then(function () {
      host.dataset.ready = 'true';
      return host;
    });
  }

  function audit(placements, layer, radius) {
    const hosts = Array.from(layer.querySelectorAll('.' + HOST_CLASS));
    let oversized = 0;
    hosts.forEach(function (host) {
      try {
        const box = host.getBBox();
        if (box.width > radius * 2.55 || box.height > radius * 2.55) oversized += 1;
      } catch (_) {}
    });
    return {
      registry:'RelphiGlyphRegistry',
      component:'RelphiGlyphComponent.createBubble',
      variant:'inscribed',
      placements:placements.length,
      hosts:hosts.length,
      leaders:layer.querySelectorAll('.' + LEADER_CLASS).length,
      oversized:oversized,
      valid:hosts.length === placements.length && oversized === 0
    };
  }

  function publish(svg, layer, placements, radius, generation) {
    if (!isCurrent(svg, generation)) {
      layer.remove();
      return null;
    }
    const result = audit(placements, layer, radius);
    if (!result.valid) {
      layer.remove();
      if (!svg.querySelector(':scope > .' + LAYER_CLASS + ':not(.' + STAGING_CLASS + ')')) {
        svg.classList.add(FALLBACK_CLASS);
      }
      return result;
    }
    svg.querySelectorAll(':scope > .' + LAYER_CLASS + ':not(.' + STAGING_CLASS + ')').forEach(function (oldLayer) {
      oldLayer.remove();
    });
    layer.classList.remove(STAGING_CLASS);
    svg.classList.remove(FALLBACK_CLASS);
    svg.classList.add(READY_CLASS);
    svg.dataset.relphiCanonicalGlyphAudit = JSON.stringify(result);
    return result;
  }

  function renderWheel(svg) {
    const generation = nextGeneration(svg);
    const radius = standardRadius(svg);
    const placements = collectPlacements(svg, radius);
    if (!placements.length) {
      if (!svg.querySelector(':scope > .' + LAYER_CLASS + ':not(.' + STAGING_CLASS + ')')) {
        svg.classList.add(FALLBACK_CLASS);
      }
      return Promise.resolve(null);
    }
    solveCollisions(placements, radius);
    const layer = createLayer(svg, generation);
    const jobs = placements.map(function (item) {
      const point = position(item);
      drawLeader(layer.leaders, item, point, radius);
      return drawHost(layer.glyphs, item, point, radius);
    });
    return Promise.all(jobs).then(function () {
      return publish(svg, layer.root, placements, radius, generation);
    }).catch(function (error) {
      layer.root.remove();
      if (isCurrent(svg, generation) && !svg.querySelector(':scope > .' + LAYER_CLASS + ':not(.' + STAGING_CLASS + ')')) {
        svg.classList.add(FALLBACK_CLASS);
      }
      console.error('Canonical SkyChart wheel render failed:', error);
      return null;
    });
  }

  function settleFrames(count) {
    return new Promise(function (resolve) {
      function step(remaining) {
        if (remaining <= 0) return resolve();
        requestAnimationFrame(function () { step(remaining - 1); });
      }
      step(count);
    });
  }

  function render() {
    if (rendering) {
      dirty = true;
      return;
    }
    rendering = true;
    dirty = false;
    queued = false;
    ensureStyles();
    settleFrames(2).then(function () {
      const wheels = Array.from(document.querySelectorAll(WHEEL_SELECTOR));
      return Promise.allSettled(wheels.map(renderWheel));
    }).then(function (results) {
      const audits = results.map(function (result) {
        return result.status === 'fulfilled' ? result.value : null;
      }).filter(Boolean);
      document.documentElement.dataset.relphiCanonicalSkyAudit = JSON.stringify({
        wheels:audits.length,
        audits:audits
      });
    }).finally(function () {
      rendering = false;
      if (dirty) schedule(60);
    });
  }

  function schedule(delay) {
    dirty = true;
    if (rendering) return;
    clearTimeout(timer);
    if (queued && !delay) return;
    queued = true;
    timer = setTimeout(function () {
      queued = false;
      render();
    }, Number.isFinite(Number(delay)) ? Number(delay) : 80);
  }

  function relevant(records) {
    return records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        if (!node || node.nodeType !== 1) return false;
        if (node.closest && node.closest('.' + LAYER_CLASS)) return false;
        return (node.matches && (node.matches(PLACEMENT_SELECTOR) || node.matches(WHEEL_SELECTOR))) ||
          (node.querySelector && (node.querySelector(PLACEMENT_SELECTOR) || node.querySelector(WHEEL_SELECTOR)));
      });
    });
  }

  function install() {
    ensureStyles();
    schedule(0);
    new MutationObserver(function (records) {
      if (relevant(records)) schedule(100);
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', function () { schedule(120); }, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { schedule(120); });
    window.addEventListener('relphi:extra-points-updated', function () { schedule(120); });
    window.RelphiCanonicalSkyWheel = Object.freeze({ render:function () { schedule(0); } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();