// Prevents mobile-scroll redraw flicker and anchors canonical leaders to exact zodiac degrees.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEELS = '.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  const LAYER = 'relphi-canonical-marker-layer';
  const STAGING = 'relphi-canonical-marker-staging';
  const HOST = 'relphi-canonical-marker-host';
  const LEADER = 'relphi-canonical-marker-leader';
  let lastLayoutWidth = document.documentElement.clientWidth;
  let lastLayoutHeight = document.documentElement.clientHeight;
  let queued = false;

  function translate(node) {
    const match = String(node.getAttribute('transform') || '').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
    return match ? { x:Number(match[1]), y:Number(match[2]) } : null;
  }

  function hostRadius(host) {
    try {
      const box = host.getBBox();
      return Math.max(box.width, box.height) / 2;
    } catch (_) { return 18; }
  }

  function structure(svg) {
    const layer = svg.querySelector(':scope > .relphi-dual-house-rings');
    if (!layer) return null;
    const cx = Number(layer.dataset.cx);
    const cy = Number(layer.dataset.cy);
    const inner = Number(layer.dataset.innerLimit);
    return Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(inner) ? { layer, cx, cy, inner } : null;
  }

  function finalizeLayer(svg, markerLayer) {
    if (!markerLayer || markerLayer.classList.contains(STAGING)) return false;
    const frame = structure(svg);
    if (!frame) return false;
    const hosts = Array.from(markerLayer.querySelectorAll('.' + HOST));
    const lines = Array.from(markerLayer.querySelectorAll('.' + LEADER));
    if (!hosts.length || lines.length < hosts.length) return false;

    hosts.forEach(function (host, index) {
      const line = lines[index];
      const point = translate(host);
      if (!line || !point) return;

      const originalX = Number(line.getAttribute('x1'));
      const originalY = Number(line.getAttribute('y1'));
      const sourceX = Number.isFinite(originalX) ? originalX : point.x;
      const sourceY = Number.isFinite(originalY) ? originalY : point.y;
      const sourceDx = sourceX - frame.cx;
      const sourceDy = sourceY - frame.cy;
      const sourceLength = Math.hypot(sourceDx, sourceDy) || 1;

      // The inner edge of the zodiac band is the exact degree-notch circle.
      const anchorX = frame.cx + sourceDx / sourceLength * frame.inner;
      const anchorY = frame.cy + sourceDy / sourceLength * frame.inner;

      // Keep the complete glyph unit inside the protected zodiac/house bands.
      const glyphDx = point.x - frame.cx;
      const glyphDy = point.y - frame.cy;
      const glyphLength = Math.hypot(glyphDx, glyphDy) || 1;
      const radius = hostRadius(host);
      const maximum = Math.max(1, frame.inner - radius - 5);
      let glyphX = point.x;
      let glyphY = point.y;
      if (glyphLength > maximum) {
        glyphX = frame.cx + glyphDx / glyphLength * maximum;
        glyphY = frame.cy + glyphDy / glyphLength * maximum;
        host.setAttribute('transform', 'translate(' + glyphX.toFixed(3) + ' ' + glyphY.toFixed(3) + ')');
      }

      const leaderDx = glyphX - anchorX;
      const leaderDy = glyphY - anchorY;
      const leaderLength = Math.hypot(leaderDx, leaderDy) || 1;
      const endX = glyphX - leaderDx / leaderLength * (radius + 1.5);
      const endY = glyphY - leaderDy / leaderLength * (radius + 1.5);
      line.setAttribute('x1', anchorX.toFixed(3));
      line.setAttribute('y1', anchorY.toFixed(3));
      line.setAttribute('x2', endX.toFixed(3));
      line.setAttribute('y2', endY.toFixed(3));
      line.dataset.sky = host.dataset.sky || '';
      line.style.opacity = '1';
      line.style.visibility = 'visible';
    });

    markerLayer.dataset.relphiDegreeAnchored = 'true';
    markerLayer.style.visibility = 'visible';
    return true;
  }

  function finalizeWheel(svg) {
    const layers = Array.from(svg.querySelectorAll(':scope > .' + LAYER));
    layers.forEach(function (layer) {
      if (layer.classList.contains(STAGING)) {
        layer.style.visibility = 'hidden';
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
      return Array.from(record.addedNodes || []).some(function (node) {
        return node && node.nodeType === 1 && (node.matches?.('.' + LAYER + ',.relphi-dual-house-rings') || node.querySelector?.('.' + LAYER + ',.relphi-dual-house-rings'));
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
      '.' + LAYER + '.' + STAGING + '{visibility:hidden!important}',
      '.' + LAYER + ':not([data-relphi-degree-anchored="true"]):not(.' + STAGING + '){visibility:hidden}',
      '.' + LEADER + '{display:block!important;visibility:visible!important;opacity:1;stroke:#111;stroke-width:1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}'
    ].join('');
    document.head.appendChild(style);
  }

  function start() {
    styles();
    // Capture phase runs before the older bubble-phase resize handler.
    window.addEventListener('resize', suppressChromeResize, { capture:true, passive:true });
    new MutationObserver(function (records) { if (mutationRelevant(records)) queue(); }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:wheel-structure-ready', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    queue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();