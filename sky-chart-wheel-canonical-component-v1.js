// SkyChart wheel: one canonical inscribed glyph component per placement, in root SVG coordinates.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const WHEEL_SELECTOR = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const LAYER_CLASS = 'relphi-canonical-marker-layer';
  const HOST_CLASS = 'relphi-canonical-marker-host';
  const LEADER_CLASS = 'relphi-canonical-marker-leader';
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

  function rootPoint(node, x, y) {
    const matrix = node && node.getCTM && node.getCTM();
    if (!matrix) return { x:x, y:y };
    try {
      const point = new DOMPoint(x, y).matrixTransform(matrix);
      return { x:point.x, y:point.y };
    } catch (_) {
      return { x:x, y:y };
    }
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

  function colorFromNode(node) {
    if (!node) return null;
    const values = [
      node.getAttribute && node.getAttribute('fill'),
      node.getAttribute && node.getAttribute('stroke'),
      node.style && node.style.fill,
      node.style && node.style.stroke
    ];
    try {
      const style = getComputedStyle(node);
      values.push(style.fill, style.stroke, style.color);
    } catch (_) {}
    for (const value of values) {
      const text = String(value || '').trim();
      if (!text || text === 'none' || text === 'transparent' || /rgba\([^)]*,\s*0\s*\)$/.test(text)) continue;
      if (/^(#|rgb|hsl)/i.test(text)) return text;
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
    if (/(sky.?c|third)/.test(signature)) return 'skyC';
    if (/(sky.?b|current.?sky|comparison|blue)/.test(signature)) return 'skyB';
    return 'skyA';
  }

  function placementColor(group, sky) {
    const glyph = group.querySelector('.chart-wheel-marker-glyph,[data-glyph-id]');
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const leader = group.querySelector('line.chart-wheel-stick');
    const explicit = colorFromNode(glyph) || colorFromNode(knob) || colorFromNode(leader);
    if (explicit) return explicit;
    return sky === 'skyB' ? BLUE : sky === 'skyC' ? PURPLE : RED;
  }

  function contactForPlacement(group) {
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    if (contact) {
      const x = numberAttr(contact, 'cx');
      const y = numberAttr(contact, 'cy');
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const root = rootPoint(contact, x, y);
        if (Number.isFinite(root.x) && Number.isFinite(root.y)) return root;
      }
    }
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    if (knob) {
      const x = numberAttr(knob, 'cx');
      const y = numberAttr(knob, 'cy');
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const root = rootPoint(knob, x, y);
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
      const contact = contactForPlacement(group);
      if (!entry || !contact) return;
      const dx = contact.x - center.x;
      const dy = contact.y - center.y;
      const length = Math.hypot(dx, dy) || 1;
      const radial = { x:dx / length, y:dy / length };
      const tangent = { x:-radial.y, y:radial.x };
      const sky = skyIdentity(group);
      const color = placementColor(group, sky);
      const outward = laneDistance(sky, radius);
      placements.push({
        index:index,
        group:group,
        entry:entry,
        sky:sky,
        color:color,
        contact:contact,
        radial:radial,
        tangent:tangent,
        outward:outward,
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
      '.' + HOST_CLASS + '{pointer-events:none}',
      '.' + LEADER_CLASS + '{fill:none;stroke:#111;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}',
      '.chart-wheel-marker-glyph{display:none!important;visibility:hidden!important;opacity:0!important}',
      'circle.chart-wheel-stick-knob{display:none!important;visibility:hidden!important;opacity:0!important}',
      'line.chart-wheel-stick{display:none!important;visibility:hidden!important;opacity:0!important}',
      '.relphi-marker-unit,.relphi-wheel-planet-glyph,.relphi-approved-glyph,.relphi-fortune-vector,svg.relphi-colored-glyph,svg.relphi-bold-inline-glyph,image.relphi-bubble-glyph-image{display:none!important;visibility:hidden!important;opacity:0!important}'
    ].join('');
  }

  function purgeLegacy(svg) {
    svg.querySelectorAll('.relphi-sky-glyph-layer,.relphi-v2-glyph-host,.canonical-sky-glyph').forEach(function (node) { node.remove(); });
    svg.querySelectorAll(':scope > .' + LAYER_CLASS).forEach(function (node) { node.remove(); });
  }

  function createLayer(svg) {
    const layer = svgNode('g');
    layer.classList.add(LAYER_CLASS);
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
    }).catch(function (error) {
      host.remove();
      console.error('Canonical SkyChart glyph failed:', item.entry.id, error);
      return null;
    });
  }

  function audit(svg, placements, layer, radius) {
    const hosts = Array.from(layer.querySelectorAll('.' + HOST_CLASS));
    const ids = hosts.map(function (host) { return host.dataset.glyphId; });
    let oversized = 0;
    hosts.forEach(function (host) {
      try {
        const box = host.getBBox();
        if (box.width > radius * 2.55 || box.height > radius * 2.55) oversized += 1;
      } catch (_) {}
    });
    const result = {
      registry:'RelphiGlyphRegistry',
      component:'RelphiGlyphComponent.createBubble',
      variant:'inscribed',
      placements:placements.length,
      hosts:hosts.length,
      leaders:layer.querySelectorAll('.' + LEADER_CLASS).length,
      oversized:oversized,
      ids:ids,
      valid:hosts.length === placements.length && oversized === 0
    };
    svg.dataset.relphiCanonicalGlyphAudit = JSON.stringify(result);
    return result;
  }

  function renderWheel(svg) {
    purgeLegacy(svg);
    const radius = standardRadius(svg);
    const placements = collectPlacements(svg, radius);
    if (!placements.length) return Promise.resolve(null);
    solveCollisions(placements, radius);
    const layer = createLayer(svg);
    const jobs = [];
    placements.forEach(function (item) {
      const point = position(item);
      drawLeader(layer.leaders, item, point, radius);
      jobs.push(drawHost(layer.glyphs, item, point, radius));
    });
    return Promise.allSettled(jobs).then(function () {
      return audit(svg, placements, layer.root, radius);
    });
  }

  function render() {
    if (rendering) return;
    rendering = true;
    queued = false;
    ensureStyles();
    const wheels = Array.from(document.querySelectorAll(WHEEL_SELECTOR));
    Promise.allSettled(wheels.map(renderWheel)).then(function (results) {
      const audits = results.map(function (result) {
        return result.status === 'fulfilled' ? result.value : null;
      }).filter(Boolean);
      document.documentElement.dataset.relphiCanonicalSkyAudit = JSON.stringify({
        wheels:audits.length,
        audits:audits
      });
    }).finally(function () {
      rendering = false;
    });
  }

  function schedule() {
    if (queued || rendering) return;
    queued = true;
    requestAnimationFrame(render);
  }

  function relevant(records) {
    return records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        if (!node || node.nodeType !== 1 || node.closest && node.closest('.' + LAYER_CLASS)) return false;
        return node.matches && (node.matches(PLACEMENT_SELECTOR) || node.matches(WHEEL_SELECTOR)) ||
          node.querySelector && (node.querySelector(PLACEMENT_SELECTOR) || node.querySelector(WHEEL_SELECTOR));
      });
    });
  }

  function install() {
    ensureStyles();
    schedule();
    new MutationObserver(function (records) {
      if (relevant(records)) schedule();
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    window.RelphiCanonicalSkyWheel = Object.freeze({ render:schedule });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();