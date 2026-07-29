// Final comparison-wheel geometry: outer-edge degree ticks, placements inside, exact-degree leaders, persistent houses.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const WHEELS = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE = 'relphi-dual-house-rings';
  const ZODIAC = 'relphi-zodiac-structure-ring';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const CACHE_KEY = 'relphiSkyChartLastCompleteHouseStructureV1';
  const MAX_SHIFT = 14;
  let queued = false;
  let applying = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function expectedHouseCount() {
    return Object.keys(placements(read(KEYS.skyB))).length ? 2 : 1;
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const signIndex = SIGNS.findIndex(function (sign) {
      return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase();
    });
    return signIndex < 0 ? NaN : signIndex * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60 + Number(item.second || 0) / 3600;
  }

  function normalize(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function resolveId(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && entry.id || String(value || '').trim().toLowerCase();
  }

  function placementMap(sky) {
    return placements(read(KEYS[sky]));
  }

  function ascendantLongitude() {
    const map = placementMap('skyA');
    const key = Object.keys(map).find(function (name) {
      const id = resolveId(name);
      return id === 'asc' || /^(rising|ascendant|asc|ac)$/i.test(String(name).trim());
    });
    return key ? longitude(map[key]) : NaN;
  }

  function placementFor(identity, sky) {
    const map = placementMap(sky);
    const key = Object.keys(map).find(function (name) { return resolveId(name) === identity; });
    return key ? map[key] : null;
  }

  function point(cx, cy, radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x:cx + Math.cos(radians) * radius, y:cy + Math.sin(radians) * radius };
  }

  function angleFor(value, asc) {
    return normalize(180 + value - asc);
  }

  function number(node, name) {
    const value = Number(node && node.getAttribute(name));
    return Number.isFinite(value) ? value : NaN;
  }

  function structureComplete(layer) {
    return !!layer && layer.dataset.ready === 'true' &&
      layer.querySelectorAll(':scope > .relphi-house-ring').length >= expectedHouseCount() &&
      layer.querySelectorAll('.relphi-zodiac-plain-host[data-ready="true"]').length === 12;
  }

  function cacheStructure(layer) {
    if (!structureComplete(layer)) return;
    try { sessionStorage.setItem(CACHE_KEY, layer.outerHTML); } catch (_) {}
  }

  function restoreStructure(svg) {
    let html = '';
    try { html = sessionStorage.getItem(CACHE_KEY) || ''; } catch (_) {}
    if (!html) return null;
    const holder = document.createElementNS(NS, 'svg');
    holder.innerHTML = html;
    const restored = holder.firstElementChild;
    if (!restored) return null;
    restored.dataset.restoredCompleteStructure = 'true';
    svg.insertBefore(restored, svg.firstChild);
    return restored;
  }

  function stableStructure(svg) {
    const ready = Array.from(svg.querySelectorAll(':scope > .' + STRUCTURE + '[data-ready="true"]'));
    const complete = ready.filter(structureComplete);
    const newest = complete[complete.length - 1];
    if (newest) {
      cacheStructure(newest);
      ready.forEach(function (layer) { if (layer !== newest && !structureComplete(layer)) layer.remove(); });
      return newest;
    }
    ready.forEach(function (layer) { if (!structureComplete(layer)) layer.remove(); });
    return restoreStructure(svg);
  }

  function markerHostForBubble(bubble) {
    let node = bubble;
    while (node && node.parentElement && node.parentElement.namespaceURI === NS) {
      if (node.classList && node.classList.contains('relphi-canonical-marker-host')) return node;
      if (node.dataset && (node.dataset.sky || node.dataset.glyphId) && node.getAttribute('transform')) return node;
      node = node.parentElement;
      if (node && node.tagName && node.tagName.toLowerCase() === 'svg') break;
    }
    return bubble.parentElement;
  }

  function skyForHost(host) {
    if (host.dataset.sky === 'skyB') return 'skyB';
    if (host.dataset.sky === 'skyA') return 'skyA';
    const color = String(host.getAttribute('stroke') || host.querySelector('circle')?.getAttribute('stroke') || '').toLowerCase();
    if (color.includes('3166') || color.includes('blue') || color === '#36c') return 'skyB';
    return 'skyA';
  }

  function identityForHost(host) {
    return host.dataset.glyphId || host.querySelector('[data-glyph-id]')?.dataset.glyphId || resolveId(host.getAttribute('aria-label') || '');
  }

  function hostRadius(host) {
    const bubble = host.querySelector('.relphi-glyph-bubble > circle,.relphi-approved-inscribed-unit .relphi-glyph-bubble > circle');
    const radius = Number(bubble && bubble.getAttribute('r'));
    if (Number.isFinite(radius) && radius > 0) {
      const scale = String(host.querySelector('.relphi-approved-inscribed-unit')?.getAttribute('transform') || '').match(/scale\(([-+\d.]+)\)/);
      return scale ? radius * Number(scale[1]) : radius;
    }
    try {
      const box = host.getBBox();
      return Math.max(box.width, box.height) / 2;
    } catch (_) { return 18; }
  }

  function collectMarkerHosts(svg, structure) {
    const seen = new Set();
    const hosts = [];
    svg.querySelectorAll('.relphi-glyph-bubble').forEach(function (bubble) {
      if (bubble.closest('.' + STRUCTURE + ',.relphi-ph-portal,#relphiPlanetaryHoursPortal')) return;
      const host = markerHostForBubble(bubble);
      if (!host || seen.has(host)) return;
      const identity = identityForHost(host);
      const sky = skyForHost(host);
      if (!identity || !placementFor(identity, sky)) return;
      seen.add(host);
      hosts.push({ host, identity, sky, radius:hostRadius(host) });
    });
    return hosts;
  }

  function ringGeometry(structure) {
    const zodiac = structure.querySelector('.' + ZODIAC);
    const circles = zodiac && zodiac.querySelectorAll(':scope > circle');
    if (!zodiac || !circles || circles.length < 2) return null;
    const cx = Number(structure.dataset.cx);
    const cy = Number(structure.dataset.cy);
    const outer = number(circles[0], 'r');
    const oldInner = number(circles[1], 'r');
    if (![cx, cy, outer, oldInner].every(Number.isFinite)) return null;

    const signBand = Math.max(34, outer - oldInner);
    const tickBase = outer;
    const signRadius = outer - signBand * .52;

    // Degree notches now grow inward from the OUTER edge of the sign ring.
    zodiac.querySelectorAll('.relphi-zodiac-sign-divider,.relphi-zodiac-decan-tick,.relphi-zodiac-degree-tick').forEach(function (line) {
      const x = number(line, 'x1');
      const y = number(line, 'y1');
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const degrees = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      let length = signBand * .10;
      if (line.classList.contains('relphi-zodiac-sign-divider')) length = signBand;
      else if (line.classList.contains('relphi-zodiac-decan-tick')) length = signBand * .24;
      const start = point(cx, cy, tickBase, degrees);
      const end = point(cx, cy, tickBase - length, degrees);
      line.setAttribute('x1', start.x.toFixed(3));
      line.setAttribute('y1', start.y.toFixed(3));
      line.setAttribute('x2', end.x.toFixed(3));
      line.setAttribute('y2', end.y.toFixed(3));
    });

    // Keep only the outer boundary. The inner border is deliberately removed.
    circles[0].style.display = '';
    circles[1].style.display = 'none';

    const asc = ascendantLongitude();
    if (Number.isFinite(asc)) {
      zodiac.querySelectorAll('.relphi-zodiac-plain-host').forEach(function (host, index) {
        const p = point(cx, cy, signRadius, angleFor(index * 30 + 15, asc));
        host.setAttribute('transform', 'translate(' + p.x.toFixed(3) + ' ' + p.y.toFixed(3) + ')');
      });
    }

    structure.dataset.zodiacOuter = String(outer);
    structure.dataset.zodiacInner = String(oldInner);
    structure.dataset.zodiacSignRadius = String(signRadius);
    structure.dataset.degreeNotchRadius = String(tickBase);
    return { cx, cy, outer, oldInner, signBand, signRadius, tickBase };
  }

  function resolveCollisions(items) {
    for (let pass = 0; pass < 100; pass += 1) {
      let changed = false;
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const a = items[i], b = items[j];
          const p = point(a.cx, a.cy, a.lane, a.angle + a.shift);
          const q = point(b.cx, b.cy, b.lane, b.angle + b.shift);
          const minimum = a.radius + b.radius + 4;
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= minimum) continue;
          const direction = normalize(b.angle - a.angle) < 180 ? 1 : -1;
          const push = Math.min(1.4, Math.max(.2, (minimum - distance) / Math.max(a.lane, b.lane) * 22));
          a.shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, a.shift - direction * push / 2));
          b.shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, b.shift + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function ensureLeaderLayer(svg) {
    let layer = svg.querySelector(':scope > .relphi-final-degree-leaders');
    if (!layer) {
      layer = document.createElementNS(NS, 'g');
      layer.classList.add('relphi-final-degree-leaders');
      layer.setAttribute('pointer-events', 'none');
      const firstMarker = svg.querySelector('.relphi-canonical-marker-layer,.chart-wheel-placement-stick');
      if (firstMarker && firstMarker.parentNode === svg) svg.insertBefore(layer, firstMarker);
      else svg.appendChild(layer);
    }
    layer.replaceChildren();
    return layer;
  }

  function placeActualMarkers(svg, structure, frame) {
    const records = collectMarkerHosts(svg, structure);
    const asc = ascendantLongitude();
    if (!records.length || !Number.isFinite(asc)) return false;

    const largest = records.reduce(function (value, record) { return Math.max(value, record.radius); }, 18);
    // Both lanes are strictly INSIDE the sign ring and degree-notch arc.
    const outerLane = Math.max(frame.oldInner - largest - 8, frame.oldInner * .78);
    const innerLane = Math.max(outerLane - largest * 2 - 7, frame.oldInner * .64);

    const items = records.map(function (record) {
      const value = longitude(placementFor(record.identity, record.sky));
      if (!Number.isFinite(value)) return null;
      return {
        host:record.host,
        identity:record.identity,
        sky:record.sky,
        radius:record.radius,
        cx:frame.cx,
        cy:frame.cy,
        angle:angleFor(value, asc),
        shift:0,
        lane:record.sky === 'skyB' ? innerLane : outerLane
      };
    }).filter(Boolean);
    if (!items.length) return false;
    resolveCollisions(items);

    const leaderLayer = ensureLeaderLayer(svg);
    applying = true;
    items.forEach(function (item) {
      const anchor = point(frame.cx, frame.cy, frame.tickBase, item.angle);
      const display = point(frame.cx, frame.cy, item.lane, item.angle + item.shift);
      const transform = 'translate(' + display.x.toFixed(3) + ' ' + display.y.toFixed(3) + ')';
      item.host.setAttribute('transform', transform);
      item.host.dataset.relphiFinalTransform = transform;
      item.host.dataset.sky = item.sky;
      item.host.dataset.glyphId = item.identity;
      item.host.style.visibility = 'visible';
      item.host.style.opacity = '1';

      const line = document.createElementNS(NS, 'line');
      line.classList.add('relphi-final-degree-leader');
      line.dataset.sky = item.sky;
      line.dataset.glyphId = item.identity;
      line.setAttribute('x1', anchor.x.toFixed(3));
      line.setAttribute('y1', anchor.y.toFixed(3));
      line.setAttribute('x2', display.x.toFixed(3));
      line.setAttribute('y2', display.y.toFixed(3));
      leaderLayer.appendChild(line);
    });
    applying = false;
    return true;
  }

  function layout(svg) {
    const structure = stableStructure(svg);
    if (!structure) return false;
    const frame = ringGeometry(structure);
    if (!frame) return false;
    return placeActualMarkers(svg, structure, frame);
  }

  function run() {
    queued = false;
    let incomplete = false;
    document.querySelectorAll(WHEELS).forEach(function (svg) { if (!layout(svg)) incomplete = true; });
    if (incomplete) setTimeout(queue, 120);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function relevant(records) {
    if (applying) return false;
    return records.some(function (record) {
      if (record.type === 'attributes') {
        const target = record.target;
        if (target && target.getAttribute && target.getAttribute('transform') && target.dataset && target.dataset.relphiFinalTransform) {
          return target.getAttribute('transform') !== target.dataset.relphiFinalTransform;
        }
      }
      return Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || [])).some(function (node) {
        return node && node.nodeType === 1 &&
          ((node.matches && node.matches('.' + STRUCTURE + ',.relphi-glyph-bubble,.relphi-canonical-marker-layer')) ||
           (node.querySelector && node.querySelector('.' + STRUCTURE + ',.relphi-glyph-bubble,.relphi-canonical-marker-layer')));
      });
    });
  }

  function styles() {
    if (document.getElementById('relphi-final-wheel-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-final-wheel-layout-style';
    style.textContent = [
      '.relphi-final-degree-leaders{pointer-events:none}',
      '.relphi-final-degree-leader{stroke:#111;stroke-width:1.15;stroke-linecap:round;opacity:.82;vector-effect:non-scaling-stroke}',
      '.relphi-zodiac-structure-ring>circle:nth-of-type(2){display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function start() {
    styles();
    queue();
    new MutationObserver(function (records) { if (relevant(records)) queue(); }).observe(document.body, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['transform','data-ready']
    });
    window.addEventListener('relphi:wheel-structure-ready', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    window.addEventListener('relphi:house-system-changed', queue);
    window.addEventListener('storage', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();