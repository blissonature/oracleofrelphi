// Final ownership of the comparison wheel's protected rings and placement lanes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEELS = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const STRUCTURE = 'relphi-dual-house-rings';
  const ZODIAC = 'relphi-zodiac-structure-ring';
  const MARKERS = 'relphi-canonical-marker-layer';
  const HOST = 'relphi-canonical-marker-host';
  const LEADER = 'relphi-canonical-marker-leader';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const MAX_SHIFT = 12;
  const lastGoodStructure = new WeakMap();
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

  function expectedHouseRings() {
    const skyB = read(KEYS.skyB);
    return skyB && Object.keys(placements(skyB)).length ? 2 : 1;
  }

  function longitude(item) {
    if (!item) return NaN;
    const sign = SIGNS.findIndex(function (name) {
      return name.toLowerCase() === String(item.sign || '').trim().toLowerCase();
    });
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }

  function normalize(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function resolvedId(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && entry.id || '';
  }

  function ascendantLongitude() {
    const map = placements(read(KEYS.skyA));
    const key = Object.keys(map).find(function (name) {
      const id = resolvedId(name);
      return id === 'asc' || /^(rising|ascendant|asc|ac)$/i.test(String(name).trim());
    });
    return key ? longitude(map[key]) : NaN;
  }

  function placementForHost(host) {
    const sky = host.dataset.sky === 'skyB' ? 'skyB' : 'skyA';
    const map = placements(read(KEYS[sky]));
    const wanted = host.dataset.glyphId || '';
    const key = Object.keys(map).find(function (name) { return resolvedId(name) === wanted; });
    return key ? map[key] : null;
  }

  function point(cx, cy, radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x:cx + Math.cos(radians) * radius, y:cy + Math.sin(radians) * radius };
  }

  function angleForLongitude(value, asc) {
    return normalize(180 + (value - asc));
  }

  function numeric(node, attribute) {
    const value = Number(node && node.getAttribute(attribute));
    return Number.isFinite(value) ? value : NaN;
  }

  function radiusFor(host) {
    const circle = host.querySelector('.relphi-glyph-bubble > circle');
    const radius = Number(circle && circle.getAttribute('r'));
    return Number.isFinite(radius) && radius > 0 ? radius : 18;
  }

  function completeStructure(layer) {
    return layer && layer.dataset.ready === 'true' &&
      layer.querySelectorAll(':scope > .relphi-house-ring').length >= expectedHouseRings() &&
      layer.querySelectorAll('.relphi-zodiac-plain-host[data-ready="true"]').length === 12;
  }

  function ensureCompleteStructure(svg) {
    const ready = Array.from(svg.querySelectorAll(':scope > .' + STRUCTURE + '[data-ready="true"]'));
    const complete = ready.filter(completeStructure);
    const newestComplete = complete[complete.length - 1];
    if (newestComplete) {
      lastGoodStructure.set(svg, newestComplete.cloneNode(true));
      ready.forEach(function (layer) {
        if (layer !== newestComplete && !completeStructure(layer)) layer.remove();
      });
      return newestComplete;
    }

    ready.forEach(function (layer) { if (!completeStructure(layer)) layer.remove(); });
    const cached = lastGoodStructure.get(svg);
    if (!cached) return null;
    const restored = cached.cloneNode(true);
    restored.dataset.restoredCompleteStructure = 'true';
    svg.insertBefore(restored, svg.firstChild);
    window.dispatchEvent(new CustomEvent('relphi:wheel-structure-ready', {
      detail:{ svg:svg, innerRadius:Number(restored.dataset.zodiacInner || restored.dataset.innerLimit) }
    }));
    return restored;
  }

  function bandGeometry(structure) {
    const zodiac = structure && structure.querySelector('.' + ZODIAC);
    const circles = zodiac && zodiac.querySelectorAll(':scope > circle');
    if (!zodiac || !circles || circles.length < 2) return null;
    const cx = Number(structure.dataset.cx);
    const cy = Number(structure.dataset.cy);
    const outer = Number(structure.dataset.zodiacOuter) || numeric(circles[0], 'r');
    const inner = Number(structure.dataset.zodiacInner) || numeric(circles[1], 'r');
    const signRadius = Number(structure.dataset.zodiacSignRadius) || outer - (outer - inner) * .16;
    if (![cx, cy, outer, inner, signRadius].every(Number.isFinite)) return null;
    return { cx:cx, cy:cy, outer:outer, inner:inner, signRadius:signRadius };
  }

  function leaderForHost(lines, host, index) {
    const matching = lines.find(function (line) {
      return line.dataset.relphiOwnershipUsed !== 'true' && line.dataset.glyphId === host.dataset.glyphId &&
        (!line.dataset.sky || line.dataset.sky === host.dataset.sky);
    });
    const line = matching || lines[index] || null;
    if (line) line.dataset.relphiOwnershipUsed = 'true';
    return line;
  }

  function resolveCollisions(items) {
    for (let pass = 0; pass < 80; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a];
          const second = items[b];
          const p = point(first.cx, first.cy, first.lane, first.angle + first.shift);
          const q = point(second.cx, second.cy, second.lane, second.angle + second.shift);
          const minimum = first.radius + second.radius + 5;
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= minimum) continue;
          const direction = normalize(second.angle - first.angle) < 180 ? 1 : -1;
          const push = Math.min(1.2, Math.max(.2, (minimum - distance) / Math.max(first.lane, second.lane) * 20));
          first.shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, first.shift - direction * push / 2));
          second.shift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, second.shift + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function placeMarkers(svg, structure) {
    const frame = bandGeometry(structure);
    if (!frame) return false;
    const layers = Array.from(svg.querySelectorAll(':scope > .' + MARKERS + ':not(.relphi-canonical-marker-staging)'));
    const markerLayer = layers[layers.length - 1];
    if (!markerLayer) return false;
    const hosts = Array.from(markerLayer.querySelectorAll('.' + HOST));
    const lines = Array.from(markerLayer.querySelectorAll('.' + LEADER));
    const asc = ascendantLongitude();
    if (!hosts.length || !Number.isFinite(asc)) return false;

    const largest = hosts.reduce(function (value, host) { return Math.max(value, radiusFor(host)); }, 18);
    const innerSafe = frame.inner + largest + 6;
    const outerSafe = frame.signRadius - largest - 9;
    const available = Math.max(8, outerSafe - innerSafe);
    const laneA = innerSafe + available * .28;
    const laneB = innerSafe + available * .72;

    const items = hosts.map(function (host, index) {
      const value = longitude(placementForHost(host));
      if (!Number.isFinite(value)) return null;
      return {
        host:host,
        line:null,
        index:index,
        cx:frame.cx,
        cy:frame.cy,
        angle:angleForLongitude(value, asc),
        shift:0,
        lane:host.dataset.sky === 'skyB' ? laneB : laneA,
        radius:radiusFor(host)
      };
    }).filter(Boolean);
    if (!items.length) return false;

    lines.forEach(function (line) { delete line.dataset.relphiOwnershipUsed; });
    items.forEach(function (item) { item.line = leaderForHost(lines, item.host, item.index); });
    resolveCollisions(items);

    applying = true;
    items.forEach(function (item) {
      const anchor = point(frame.cx, frame.cy, frame.inner, item.angle);
      const display = point(frame.cx, frame.cy, item.lane, item.angle + item.shift);
      const transform = 'translate(' + display.x.toFixed(3) + ' ' + display.y.toFixed(3) + ')';
      item.host.setAttribute('transform', transform);
      item.host.dataset.relphiProtectedTransform = transform;
      item.host.dataset.trueDegreeAngle = item.angle.toFixed(5);
      item.host.dataset.displayDegreeAngle = (item.angle + item.shift).toFixed(5);
      item.host.style.visibility = 'visible';
      item.host.style.opacity = '1';
      if (!item.line) return;
      item.line.setAttribute('x1', anchor.x.toFixed(3));
      item.line.setAttribute('y1', anchor.y.toFixed(3));
      item.line.setAttribute('x2', display.x.toFixed(3));
      item.line.setAttribute('y2', display.y.toFixed(3));
      item.line.dataset.sky = item.host.dataset.sky || '';
      item.line.dataset.glyphId = item.host.dataset.glyphId || '';
      item.line.dataset.relphiExactDegree = 'true';
      item.line.dataset.relphiToCenter = 'true';
      item.line.style.display = 'block';
      item.line.style.visibility = 'visible';
      item.line.style.opacity = '1';
    });
    lines.forEach(function (line) { delete line.dataset.relphiOwnershipUsed; });
    markerLayer.dataset.relphiPlacementBand = 'protected';
    markerLayer.dataset.relphiDegreeAnchored = 'true';
    markerLayer.style.visibility = 'visible';
    markerLayer.style.opacity = '1';
    applying = false;
    return true;
  }

  function layout(svg) {
    const structure = ensureCompleteStructure(svg);
    return structure ? placeMarkers(svg, structure) : false;
  }

  function run() {
    queued = false;
    let incomplete = false;
    document.querySelectorAll(WHEELS).forEach(function (svg) {
      if (!layout(svg)) incomplete = true;
    });
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
      if (record.type === 'attributes' && record.target && record.target.classList && record.target.classList.contains(HOST)) {
        return record.target.getAttribute('transform') !== record.target.dataset.relphiProtectedTransform;
      }
      return Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || [])).some(function (node) {
        return node && node.nodeType === 1 &&
          ((node.matches && node.matches('.' + STRUCTURE + ',.' + MARKERS)) ||
           (node.querySelector && node.querySelector('.' + STRUCTURE + ',.' + MARKERS)));
      });
    });
  }

  function styles() {
    if (document.getElementById('relphi-protected-ring-ownership-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-protected-ring-ownership-style';
    style.textContent = '.' + LEADER + '[data-relphi-to-center="true"]{display:block!important;visibility:visible!important;opacity:1!important;stroke:#111;stroke-width:1.35;stroke-linecap:round;vector-effect:non-scaling-stroke}';
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
    window.addEventListener('relphi:wheel-markers-finalized', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    window.addEventListener('relphi:house-system-changed', queue);
    window.addEventListener('storage', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();