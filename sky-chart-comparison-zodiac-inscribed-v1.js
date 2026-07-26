// Replaces comparison-wheel zodiac labels with the canonical circled glyph presentation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  const NS = 'http://www.w3.org/2000/svg';
  const SIGNS = new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  const WHEELS = '.unified-sky-wheel svg,#currentSkyOutput svg,.sky-output-box[data-sky="comparison"] svg,.sky-output-box[data-slot="skyB"] svg';
  const OWN = 'relphi-comparison-zodiac-inscribed-layer';
  let queued = false;

  function entryFor(value) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    const entry = registry.resolve(String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim());
    return entry && SIGNS.has(entry.id) ? entry : null;
  }

  function pointInRoot(svg, node, x, y) {
    try {
      const a = node.getScreenCTM(), b = svg.getScreenCTM();
      if (a && b) return new DOMPoint(x, y).matrixTransform(a).matrixTransform(b.inverse());
    } catch (_) {}
    return { x:x, y:y };
  }

  function candidates(svg) {
    return Array.from(svg.querySelectorAll('text')).filter(function (node) {
      if (node.closest('.chart-wheel-placement-stick,.' + OWN + ',.relphi-canonical-marker-layer,.relphi-sky-glyph-layer')) return false;
      return Boolean(entryFor(node.dataset?.glyphId || node.dataset?.sign || node.textContent));
    });
  }

  function renderWheel(svg) {
    const labels = candidates(svg);
    if (labels.length < 12) return;
    svg.querySelector(':scope > .' + OWN)?.remove();
    const layer = document.createElementNS(NS, 'g');
    layer.classList.add(OWN);
    layer.setAttribute('aria-label', 'Canonical circled zodiac glyphs');
    svg.appendChild(layer);
    const view = svg.viewBox && svg.viewBox.baseVal;
    const span = view && view.width ? Math.min(view.width, view.height) : Math.min(svg.clientWidth || 700, svg.clientHeight || 700);
    const radius = Math.max(11.5, Math.min(15, span * 0.019));
    const jobs = labels.slice(0, 12).map(function (label) {
      const entry = entryFor(label.dataset?.glyphId || label.dataset?.sign || label.textContent);
      let x = Number(label.getAttribute('x')) || 0;
      let y = Number(label.getAttribute('y')) || 0;
      const box = label.getBBox?.();
      if (box && box.width && box.height) { x = box.x + box.width / 2; y = box.y + box.height / 2; }
      const point = pointInRoot(svg, label, x, y);
      const host = document.createElementNS(NS, 'g');
      host.dataset.glyphId = entry.id;
      host.dataset.glyphVariant = 'inscribed';
      host.setAttribute('transform', 'translate(' + point.x.toFixed(3) + ' ' + point.y.toFixed(3) + ')');
      host.setAttribute('aria-label', entry.name);
      layer.appendChild(host);
      label.style.display = 'none';
      return window.RelphiGlyphComponent.createBubble(host, entry.id, { radius:radius, padding:1, color:'#111', fill:'#fff', strokeWidth:2 }).ready;
    });
    Promise.allSettled(jobs).then(function () {
      svg.dataset.relphiComparisonZodiacGlyphs = JSON.stringify({ source:'glyph-canon.json', variant:'inscribed', count:jobs.length });
    });
  }

  function render() {
    queued = false;
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) return;
    document.querySelectorAll(WHEELS).forEach(renderWheel);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(render); });
  }

  function start() {
    queue();
    [150, 500, 1200].forEach(function (delay) { setTimeout(queue, delay); });
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();