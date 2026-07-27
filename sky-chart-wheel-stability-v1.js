// Prevents mobile-scroll redraw flicker and publishes canonical markers only after exact-degree leaders are complete.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEELS = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const LAYER = 'relphi-canonical-marker-layer';
  const STAGING = 'relphi-canonical-marker-staging';
  const HOST = 'relphi-canonical-marker-host';
  const LEADER = 'relphi-canonical-marker-leader';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  let lastLayoutWidth = document.documentElement.clientWidth;
  let lastLayoutHeight = document.documentElement.clientHeight;
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

  function normalized(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function resolvedId(value) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.resolve(value) || registry.get(value));
    return entry && entry.id || '';
  }

  function placementForHost(host) {
    const sky = host.dataset.sky === 'skyB' ? 'skyB' : 'skyA';
    const map = placements(read(KEYS[sky]));
    const wanted = host.dataset.glyphId || '';
    const key = Object.keys(map).find(function (name) { return resolvedId(name) === wanted; });
    return key ? map[key] : null;
  }

  function ascendantLongitude() {
    const map = placements(read(KEYS.skyA));
    const key = Object.keys(map).find(function (name) {
      const id = resolvedId(name);
      return id === 'asc' || /^(rising|ascendant|asc|ac)$/i.test(String(name).trim());
    });
    return key ? longitude(map[key]) : NaN;
  }

  function translate(node) {
    const match = String(node.getAttribute('transform') || '').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
    return match ? { x:Number(match[1]), y:Number(match[2]) } : null;
  }

  function hostRadius(host) {
    const circle = host.querySelector('.relphi-glyph-bubble > circle');
    const radius = Number(circle && circle.getAttribute('r'));
    if (Number.isFinite(radius) && radius > 0) return radius;
    try {
      const box = host.getBBox();
      return Math.max(box.width, box.height) / 2;
    } catch (_) { return 18; }
  }

  function structure(svg) {
    const candidates = Array.from(svg.querySelectorAll(':scope > .relphi-dual-house-rings[data-ready="true"]'));
    const layer = candidates[candidates.length - 1] || null;
    if (!layer) return null;
    const cx = Number(layer.dataset.cx);
    const cy = Number(layer.dataset.cy);
    const inner = Number(layer.dataset.innerLimit);
    return Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(inner) ? { layer, cx, cy, inner } : null;
  }

  function exactAnchor(frame, host, fallbackLine) {
    const itemLongitude = longitude(placementForHost(host));
    const asc = ascendantLongitude();
    if (Number.isFinite(itemLongitude) && Number.isFinite(asc)) {
      const degrees = normalized(180 + (itemLongitude - asc));
      const radians = degrees * Math.PI / 180;
      return {
        x:frame.cx + Math.cos(radians) * frame.inner,
        y:frame.cy + Math.sin(radians) * frame.inner
      };
    }
    const sourceX = Number(fallbackLine && fallbackLine.getAttribute('x1'));
    const sourceY = Number(fallbackLine && fallbackLine.getAttribute('y1'));
    if (!Number.isFinite(sourceX) || !Number.isFinite(sourceY)) return null;
    const dx = sourceX - frame.cx;
    const dy = sourceY - frame.cy;
    const length = Math.hypot(dx, dy) || 1;
    return { x:frame.cx + dx / length * frame.inner, y:frame.cy + dy / length * frame.inner };
  }

  function lineForHost(lines, host, index) {
    const byIdentity = lines.find(function (line) {
      return line.dataset.relphiAssigned !== 'true' && line.dataset.glyphId === host.dataset.glyphId &&
        (!line.dataset.sky || line.dataset.sky === host.dataset.sky);
    });
    const line = byIdentity || lines[index] || null;
    if (line) line.dataset.relphiAssigned = 'true';
    return line;
  }

  function finalizeLayer(svg, markerLayer) {
    if (!markerLayer || markerLayer.classList.contains(STAGING)) return false;
    const frame = structure(svg);
    if (!frame) return false;
    const hosts = Array.from(markerLayer.querySelectorAll('.' + HOST));
    const lines = Array.from(markerLayer.querySelectorAll('.' + LEADER));
    if (!hosts.length || lines.length < hosts.length) return false;
    if (hosts.some(function (host) { return host.dataset.ready !== 'true' || !translate(host); })) return false;

    lines.forEach(function (line) {
      delete line.dataset.relphiAssigned;
      line.style.visibility = 'hidden';
      line.style.opacity = '0';
    });

    const completed = hosts.every(function (host, index) {
      const line = lineForHost(lines, host, index);
      const initialPoint = translate(host);
      if (!line || !initialPoint) return false;

      const radius = hostRadius(host);
      const dx = initialPoint.x - frame.cx;
      const dy = initialPoint.y - frame.cy;
      const distance = Math.hypot(dx, dy) || 1;
      const maximum = Math.max(1, frame.inner - radius - 5);
      const glyphX = distance > maximum ? frame.cx + dx / distance * maximum : initialPoint.x;
      const glyphY = distance > maximum ? frame.cy + dy / distance * maximum : initialPoint.y;
      host.setAttribute('transform', 'translate(' + glyphX.toFixed(3) + ' ' + glyphY.toFixed(3) + ')');

      const anchor = exactAnchor(frame, host, line);
      if (!anchor) return false;
      const leaderDx = glyphX - anchor.x;
      const leaderDy = glyphY - anchor.y;
      const leaderLength = Math.hypot(leaderDx, leaderDy);
      if (!Number.isFinite(leaderLength) || leaderLength <= radius + 1.5) return false;
      const endX = glyphX - leaderDx / leaderLength * (radius + 1.5);
      const endY = glyphY - leaderDy / leaderLength * (radius + 1.5);

      line.setAttribute('x1', anchor.x.toFixed(3));
      line.setAttribute('y1', anchor.y.toFixed(3));
      line.setAttribute('x2', endX.toFixed(3));
      line.setAttribute('y2', endY.toFixed(3));
      line.dataset.sky = host.dataset.sky || '';
      line.dataset.glyphId = host.dataset.glyphId || line.dataset.glyphId || '';
      line.dataset.relphiExactDegree = 'true';
      return true;
    });

    lines.forEach(function (line) { delete line.dataset.relphiAssigned; });
    if (!completed) return false;

    markerLayer.dataset.relphiDegreeAnchored = 'true';
    hosts.forEach(function (host) { host.style.visibility = 'visible'; host.style.opacity = '1'; });
    lines.forEach(function (line) {
      line.style.display = 'block';
      line.style.visibility = 'visible';
      line.style.opacity = '1';
    });
    markerLayer.style.visibility = 'visible';
    markerLayer.style.opacity = '1';
    window.dispatchEvent(new CustomEvent('relphi:wheel-markers-finalized', { detail:{ svg, markerLayer } }));
    return true;
  }

  function finalizeWheel(svg) {
    Array.from(svg.querySelectorAll(':scope > .' + LAYER)).forEach(function (layer) {
      if (layer.classList.contains(STAGING)) {
        layer.style.visibility = 'hidden';
        layer.style.opacity = '0';
        return;
      }
      finalizeLayer(svg, layer);
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll(WHEELS).forEach(finalizeWheel);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function mutationRelevant(records) {
    return records.some(function (record) {
      if (record.type === 'attributes' && record.target && record.target.classList &&
          (record.target.classList.contains(LAYER) || record.target.classList.contains(HOST))) return true;
      return Array.from(record.addedNodes || []).some(function (node) {
        return node && node.nodeType === 1 &&
          ((node.matches && node.matches('.' + LAYER + ',.relphi-dual-house-rings')) ||
           (node.querySelector && node.querySelector('.' + LAYER + ',.relphi-dual-house-rings')));
      });
    });
  }

  function suppressChromeResize(event) {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    if (width === lastLayoutWidth && height === lastLayoutHeight) {
      event.stopImmediatePropagation();
      return;
    }
    lastLayoutWidth = width;
    lastLayoutHeight = height;
  }

  function styles() {
    if (document.getElementById('relphi-wheel-stability-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-wheel-stability-style';
    style.textContent = [
      '.' + LAYER + '.' + STAGING + '{visibility:hidden!important;opacity:0!important}',
      '.' + LAYER + ':not([data-relphi-degree-anchored="true"]):not(.' + STAGING + '){visibility:hidden!important;opacity:0!important}',
      '.' + LEADER + ':not([data-relphi-exact-degree="true"]){visibility:hidden!important;opacity:0!important}',
      '.' + LEADER + '[data-relphi-exact-degree="true"]{display:block!important;visibility:visible!important;opacity:1!important;stroke:#111;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}'
    ].join('');
    document.head.appendChild(style);
  }

  function start() {
    styles();
    window.addEventListener('resize', suppressChromeResize, { capture:true, passive:true });
    new MutationObserver(function (records) {
      if (mutationRelevant(records)) queue();
    }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','data-ready'] });
    window.addEventListener('relphi:wheel-structure-ready', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    queue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
