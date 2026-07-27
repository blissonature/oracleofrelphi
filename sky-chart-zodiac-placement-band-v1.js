// Expands the zodiac band inward and lays comparison placements inside it with exact-degree leaders.
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
  const MAX_SHIFT_DEGREES = 11;
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function longitude(item) {
    if (!item) return NaN;
    const signIndex = SIGNS.findIndex(function (sign) {
      return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase();
    });
    return signIndex < 0 ? NaN : signIndex * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
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

  function number(node, name) {
    const value = Number(node && node.getAttribute(name));
    return Number.isFinite(value) ? value : NaN;
  }

  function hostRadius(host) {
    const circle = host.querySelector('.relphi-glyph-bubble > circle');
    const radius = Number(circle && circle.getAttribute('r'));
    if (Number.isFinite(radius) && radius > 0) return radius;
    return 18;
  }

  function expandBand(svg, structure) {
    const zodiac = structure.querySelector('.' + ZODIAC);
    if (!zodiac) return null;
    const circles = zodiac.querySelectorAll(':scope > circle');
    if (circles.length < 2) return null;
    const cx = Number(structure.dataset.cx);
    const cy = Number(structure.dataset.cy);
    const outer = number(circles[0], 'r');
    const originalInner = number(circles[1], 'r');
    if (![cx, cy, outer, originalInner].every(Number.isFinite)) return null;

    const originalThickness = outer - originalInner;
    const extension = Math.max(20, Math.min(32, originalThickness * .62));
    const inner = originalInner - extension;
    const thickness = outer - inner;
    const signRadius = outer - thickness * .16;
    const hasB = !!read(KEYS.skyB) && Object.keys(placements(read(KEYS.skyB))).length > 0;
    const laneA = inner + thickness * (hasB ? .21 : .34);
    const laneB = inner + thickness * .49;

    circles[1].setAttribute('r', inner.toFixed(3));
    zodiac.querySelectorAll('.relphi-zodiac-sign-divider,.relphi-zodiac-decan-tick,.relphi-zodiac-degree-tick').forEach(function (line) {
      const x = number(line, 'x1');
      const y = number(line, 'y1');
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const degrees = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      let endRadius = inner + thickness * .10;
      if (line.classList.contains('relphi-zodiac-sign-divider')) endRadius = outer;
      else if (line.classList.contains('relphi-zodiac-decan-tick')) endRadius = inner + thickness * .24;
      const start = point(cx, cy, inner, degrees);
      const end = point(cx, cy, endRadius, degrees);
      line.setAttribute('x1', start.x.toFixed(3));
      line.setAttribute('y1', start.y.toFixed(3));
      line.setAttribute('x2', end.x.toFixed(3));
      line.setAttribute('y2', end.y.toFixed(3));
    });

    zodiac.querySelectorAll('.relphi-zodiac-plain-host').forEach(function (host, index) {
      const asc = ascendantLongitude();
      if (!Number.isFinite(asc)) return;
      const position = point(cx, cy, signRadius, angleForLongitude(index * 30 + 15, asc));
      host.setAttribute('transform', 'translate(' + position.x.toFixed(3) + ' ' + position.y.toFixed(3) + ')');
    });

    structure.dataset.innerLimit = String(inner);
    structure.dataset.zodiacInner = String(inner);
    structure.dataset.zodiacOuter = String(outer);
    structure.dataset.zodiacSignRadius = String(signRadius);
    structure.dataset.placementLaneA = String(laneA);
    structure.dataset.placementLaneB = String(laneB);
    structure.dataset.bandExpanded = 'true';
    return { cx, cy, inner, outer, thickness, signRadius, laneA, laneB, hasB };
  }

  function lineForHost(lines, host, index) {
    const matching = lines.find(function (line) {
      return line.dataset.used !== 'true' && line.dataset.glyphId === host.dataset.glyphId &&
        (!line.dataset.sky || line.dataset.sky === host.dataset.sky);
    });
    const line = matching || lines[index] || null;
    if (line) line.dataset.used = 'true';
    return line;
  }

  function resolveCollisions(items) {
    for (let pass = 0; pass < 70; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a];
          const second = items[b];
          const p = point(first.cx, first.cy, first.radius, first.angle + first.shift);
          const q = point(second.cx, second.cy, second.radius, second.angle + second.shift);
          const minimum = first.glyphRadius + second.glyphRadius + 5;
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= minimum) continue;
          const direction = normalize(second.angle - first.angle) < 180 ? 1 : -1;
          const push = Math.min(1.15, Math.max(.18, (minimum - distance) / Math.max(first.radius, second.radius) * 18));
          first.shift = Math.max(-MAX_SHIFT_DEGREES, Math.min(MAX_SHIFT_DEGREES, first.shift - direction * push / 2));
          second.shift = Math.max(-MAX_SHIFT_DEGREES, Math.min(MAX_SHIFT_DEGREES, second.shift + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function placeMarkers(svg, frame) {
    const markerLayers = Array.from(svg.querySelectorAll(':scope > .' + MARKERS + ':not(.relphi-canonical-marker-staging)'));
    const markerLayer = markerLayers[markerLayers.length - 1];
    if (!markerLayer) return false;
    const hosts = Array.from(markerLayer.querySelectorAll('.' + HOST));
    const lines = Array.from(markerLayer.querySelectorAll('.' + LEADER));
    const asc = ascendantLongitude();
    if (!hosts.length || !Number.isFinite(asc)) return false;

    const items = hosts.map(function (host, index) {
      const item = placementForHost(host);
      const degree = longitude(item);
      if (!Number.isFinite(degree)) return null;
      return {
        host,
        line:null,
        index,
        cx:frame.cx,
        cy:frame.cy,
        angle:angleForLongitude(degree, asc),
        shift:0,
        radius:host.dataset.sky === 'skyB' ? frame.laneB : frame.laneA,
        glyphRadius:hostRadius(host)
      };
    }).filter(Boolean);
    if (!items.length) return false;

    lines.forEach(function (line) { delete line.dataset.used; });
    items.forEach(function (item) { item.line = lineForHost(lines, item.host, item.index); });
    resolveCollisions(items);

    items.forEach(function (item) {
      const anchor = point(frame.cx, frame.cy, frame.inner, item.angle);
      const display = point(frame.cx, frame.cy, item.radius, item.angle + item.shift);
      item.host.setAttribute('transform', 'translate(' + display.x.toFixed(3) + ' ' + display.y.toFixed(3) + ')');
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
    lines.forEach(function (line) { delete line.dataset.used; });
    markerLayer.dataset.relphiDegreeAnchored = 'true';
    markerLayer.dataset.relphiPlacementBand = 'true';
    markerLayer.style.visibility = 'visible';
    markerLayer.style.opacity = '1';
    return true;
  }

  function layoutWheel(svg) {
    const structures = Array.from(svg.querySelectorAll(':scope > .' + STRUCTURE + '[data-ready="true"]'));
    const structure = structures[structures.length - 1];
    if (!structure) return false;
    const frame = expandBand(svg, structure);
    if (!frame) return false;
    return placeMarkers(svg, frame);
  }

  function run() {
    queued = false;
    let incomplete = false;
    document.querySelectorAll(WHEELS).forEach(function (svg) {
      if (!layoutWheel(svg)) incomplete = true;
    });
    if (incomplete) setTimeout(queue, 100);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function relevant(records) {
    return records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        return node && node.nodeType === 1 &&
          ((node.matches && node.matches('.' + STRUCTURE + ',.' + MARKERS)) ||
           (node.querySelector && node.querySelector('.' + STRUCTURE + ',.' + MARKERS)));
      });
    });
  }

  function styles() {
    if (document.getElementById('relphi-zodiac-placement-band-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-zodiac-placement-band-style';
    style.textContent = '.' + LEADER + '[data-relphi-to-center="true"]{display:block!important;visibility:visible!important;opacity:1!important;stroke:#111;stroke-width:1.35;stroke-linecap:round;vector-effect:non-scaling-stroke}';
    document.head.appendChild(style);
  }

  function start() {
    styles();
    queue();
    new MutationObserver(function (records) { if (relevant(records)) queue(); }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:wheel-structure-ready', queue);
    window.addEventListener('relphi:wheel-markers-finalized', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    window.addEventListener('relphi:house-system-changed', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
