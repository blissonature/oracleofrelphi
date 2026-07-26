// Zodiac ring rendered only through the frozen approved canonical component.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANON_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const WHEELS = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const LAYER = 'relphi-canonical-zodiac-ring';
  const HOST = 'relphi-canonical-zodiac-host';
  const SOURCE = 'relphi-canonical-zodiac-source';
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
    const identity = node.dataset?.relphiZodiacSign || node.textContent || node.dataset?.sign || node.dataset?.glyphId || '';
    const entry = registry.resolve(identity);
    return entry && ZODIAC.has(entry.id) ? entry : null;
  }

  function labelsFor(svg) {
    return Array.from(svg.querySelectorAll('text')).filter(function (node) {
      if (node.closest('.chart-wheel-placement-stick,.' + LAYER + ',.relphi-canonical-marker-layer')) return false;
      return Boolean(entryFor(node));
    }).slice(0, 12);
  }

  function labelRecord(svg, label) {
    const entry = entryFor(label);
    if (!entry) return null;
    if (label.style.display === 'none') label.style.display = '';

    let x = Number(label.dataset.relphiZodiacX);
    let y = Number(label.dataset.relphiZodiacY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      const box = label.getBBox();
      const local = pointInRoot(svg, label, box.x + box.width / 2, box.y + box.height / 2);
      x = local.x;
      y = local.y;
      label.dataset.relphiZodiacX = String(x);
      label.dataset.relphiZodiacY = String(y);
      label.dataset.relphiZodiacSign = entry.id;
    }

    label.classList.add(SOURCE);
    return { label:label, entry:entry, x:x, y:y };
  }

  function signatureFor(records, radius) {
    return records.map(function (record) {
      return record.entry.id + ':' + record.x.toFixed(3) + ',' + record.y.toFixed(3);
    }).join('|') + '|r=' + radius.toFixed(3);
  }

  function hideSources(records) {
    records.forEach(function (record) {
      record.label.style.visibility = 'hidden';
      record.label.style.pointerEvents = 'none';
    });
  }

  function showSources(records) {
    records.forEach(function (record) {
      record.label.style.visibility = '';
      record.label.style.pointerEvents = '';
    });
  }

  function renderWheel(svg) {
    const component = window.RelphiGlyphComponent;
    const labels = labelsFor(svg);
    if (!component || labels.length < 12) return;
    if (svg.dataset.relphiCanonicalZodiacRendering === 'true') return;

    const view = svg.viewBox && svg.viewBox.baseVal;
    const span = view && view.width ? Math.min(view.width, view.height) : Math.min(svg.clientWidth || 700, svg.clientHeight || 700);
    const radius = Math.max(11.5, Math.min(15, span * 0.019));
    const records = labels.map(function (label) { return labelRecord(svg, label); }).filter(Boolean);
    if (records.length < 12) return;

    const signature = signatureFor(records, radius);
    const published = svg.querySelector(':scope > .' + LAYER + '[data-published="true"]');
    if (published && published.dataset.signature === signature && published.querySelectorAll('.' + HOST).length === 12) {
      hideSources(records);
      return;
    }

    svg.dataset.relphiCanonicalZodiacRendering = 'true';
    const layer = document.createElementNS(NS, 'g');
    layer.classList.add(LAYER);
    layer.dataset.canonCommit = CANON_COMMIT;
    layer.dataset.presentation = 'inscribed';
    layer.dataset.signature = signature;
    layer.dataset.published = 'false';
    layer.style.visibility = 'hidden';
    layer.setAttribute('aria-label', 'Canonical inscribed zodiac glyphs');
    svg.appendChild(layer);

    const jobs = records.map(function (record) {
      const host = document.createElementNS(NS, 'g');
      host.classList.add(HOST);
      host.dataset.glyphId = record.entry.id;
      host.dataset.canonCommit = CANON_COMMIT;
      host.setAttribute('transform', 'translate(' + record.x.toFixed(3) + ' ' + record.y.toFixed(3) + ')');
      host.setAttribute('aria-label', record.entry.name);
      layer.appendChild(host);
      const bubble = component.createBubble(host, record.entry.id, {
        radius:radius,
        padding:1,
        color:'#111',
        fill:'#fff',
        strokeWidth:2.35
      });
      return bubble.ready;
    });

    Promise.all(jobs).then(function () {
      if (!svg.isConnected) return;
      svg.querySelectorAll(':scope > .' + LAYER).forEach(function (other) {
        if (other !== layer) other.remove();
      });
      hideSources(records);
      layer.dataset.published = 'true';
      layer.style.visibility = 'visible';
      svg.dataset.relphiCanonicalZodiacAudit = JSON.stringify({
        canonCommit:CANON_COMMIT,
        component:'RelphiGlyphComponent.createBubble',
        count:jobs.length,
        failed:0,
        stable:true
      });
    }).catch(function (error) {
      layer.remove();
      showSources(records);
      console.error('Canonical zodiac ring render failed:', error);
    }).finally(function () {
      delete svg.dataset.relphiCanonicalZodiacRendering;
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

  function mutationIsOnlyOurs(record) {
    if (record.target?.closest?.('.' + LAYER)) return true;
    const nodes = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || [])).filter(function (node) {
      return node && node.nodeType === 1;
    });
    return nodes.length > 0 && nodes.every(function (node) {
      return node.matches?.('.' + LAYER) || node.closest?.('.' + LAYER);
    });
  }

  function start() {
    queue();
    [120, 400, 900].forEach(function (delay) { setTimeout(queue, delay); });
    new MutationObserver(function (records) {
      if (records.every(mutationIsOnlyOurs)) return;
      queue();
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();