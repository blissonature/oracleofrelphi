// Zodiac ring rendered only through the frozen approved canonical component.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANON_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const WHEELS = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const LAYER = 'relphi-canonical-zodiac-ring';
  const ZODIAC = new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  let queued = false;

  function pointInRoot(svg, node, x, y) {
    try {
      const a = node.getScreenCTM && node.getScreenCTM();
      const b = svg.getScreenCTM && svg.getScreenCTM();
      if (a && b) return new DOMPoint(x, y).matrixTransform(a).matrixTransform(b.inverse());
    } catch (_) {}
    return { x:x, y:y };
  }

  function entryFor(node) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    const entry = registry.resolve(node.textContent || node.dataset?.sign || node.dataset?.glyphId || '');
    return entry && ZODIAC.has(entry.id) ? entry : null;
  }

  function labelsFor(svg) {
    return Array.from(svg.querySelectorAll('text')).filter(function (node) {
      if (node.closest('.chart-wheel-placement-stick,.' + LAYER + ',.relphi-canonical-marker-layer')) return false;
      return Boolean(entryFor(node));
    });
  }

  function renderWheel(svg) {
    const component = window.RelphiGlyphComponent;
    const labels = labelsFor(svg);
    if (!component || labels.length < 12) return;

    svg.querySelectorAll(':scope > .' + LAYER).forEach(function (node) { node.remove(); });
    const layer = document.createElementNS(NS, 'g');
    layer.classList.add(LAYER);
    layer.dataset.canonCommit = CANON_COMMIT;
    layer.dataset.presentation = 'inscribed';
    layer.setAttribute('aria-label', 'Canonical inscribed zodiac glyphs');
    svg.appendChild(layer);

    const view = svg.viewBox && svg.viewBox.baseVal;
    const span = view && view.width ? Math.min(view.width, view.height) : Math.min(svg.clientWidth || 700, svg.clientHeight || 700);
    const radius = Math.max(11.5, Math.min(15, span * 0.019));

    const jobs = labels.slice(0, 12).map(function (label) {
      const entry = entryFor(label);
      const box = label.getBBox();
      const local = pointInRoot(svg, label, box.x + box.width / 2, box.y + box.height / 2);
      const host = document.createElementNS(NS, 'g');
      host.classList.add('relphi-canonical-zodiac-host');
      host.dataset.glyphId = entry.id;
      host.dataset.canonCommit = CANON_COMMIT;
      host.setAttribute('transform', 'translate(' + local.x.toFixed(3) + ' ' + local.y.toFixed(3) + ')');
      host.setAttribute('aria-label', entry.name);
      layer.appendChild(host);
      label.style.display = 'none';
      const bubble = component.createBubble(host, entry.id, {
        radius:radius,
        padding:1,
        color:'#111',
        fill:'#fff',
        strokeWidth:2.35
      });
      return bubble.ready;
    });

    Promise.allSettled(jobs).then(function (results) {
      svg.dataset.relphiCanonicalZodiacAudit = JSON.stringify({
        canonCommit:CANON_COMMIT,
        component:'RelphiGlyphComponent.createBubble',
        count:jobs.length,
        failed:results.filter(function (r) { return r.status === 'rejected'; }).length
      });
    });
  }

  function render() {
    queued = false;
    document.querySelectorAll(WHEELS).forEach(renderWheel);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(render); });
  }

  function start() {
    queue();
    [120, 400, 900].forEach(function (delay) { setTimeout(queue, delay); });
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
