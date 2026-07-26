// Canonical wheel integrity layer: position complete approved masters without altering them.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANON_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
  const WHEELS = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const PLACEMENT_SOURCE = '.relphi-canonical-marker-layer:not(.relphi-canonical-marker-staging):not(.relphi-canonical-integrity-layer)';
  const PLACEMENT_TARGET = 'relphi-canonical-integrity-layer';
  const ZODIAC_SOURCE = '.relphi-canonical-zodiac-ring:not(.relphi-canonical-zodiac-integrity-layer)';
  const ZODIAC_TARGET = 'relphi-canonical-zodiac-integrity-layer';
  let queued = false;
  let rendering = false;
  let dirty = false;

  function svgNode(name) {
    return document.createElementNS(NS, name);
  }

  function ensureStyles() {
    let style = document.getElementById('relphi-canonical-integrity-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-canonical-integrity-style';
      document.head.appendChild(style);
    }
    style.textContent = [
      '.relphi-canonical-marker-layer:not(.' + PLACEMENT_TARGET + '){display:none!important;visibility:hidden!important;opacity:0!important}',
      '.relphi-canonical-zodiac-ring:not(.' + ZODIAC_TARGET + '){display:none!important;visibility:hidden!important;opacity:0!important}',
      '.' + PLACEMENT_TARGET + ',.' + ZODIAC_TARGET + '{display:inline!important;visibility:visible!important;opacity:1!important;pointer-events:none}',
      'svg.relphi-canonical-ready .chart-wheel-placement-stick text{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.relphi-canonical-ready .chart-wheel-placement-stick line{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.relphi-canonical-ready .chart-wheel-placement-stick path,svg.relphi-canonical-ready .chart-wheel-placement-stick rect,svg.relphi-canonical-ready .chart-wheel-placement-stick ellipse,svg.relphi-canonical-ready .chart-wheel-placement-stick polygon,svg.relphi-canonical-ready .chart-wheel-placement-stick polyline{display:none!important;visibility:hidden!important;opacity:0!important}',
      'svg.relphi-canonical-ready .chart-wheel-placement-stick circle:not(.chart-wheel-contact-dot){display:none!important;visibility:hidden!important;opacity:0!important}'
    ].join('');
  }

  function signatureForHosts(hosts) {
    return hosts.map(function (host) {
      return [
        host.dataset.glyphId || '',
        host.dataset.sky || '',
        host.dataset.glyphColor || '',
        host.getAttribute('transform') || ''
      ].join('|');
    }).join(';;');
  }

  function latest(svg, selector) {
    const nodes = Array.from(svg.querySelectorAll(':scope > ' + selector));
    return nodes[nodes.length - 1] || null;
  }

  async function renderPlacements(svg, component) {
    const source = latest(svg, PLACEMENT_SOURCE);
    if (!source) return null;
    const sourceHosts = Array.from(source.querySelectorAll('.relphi-canonical-marker-host'));
    if (!sourceHosts.length) return null;
    const signature = signatureForHosts(sourceHosts);
    const current = svg.querySelector(':scope > .' + PLACEMENT_TARGET);
    if (current && current.dataset.signature === signature) return current;

    const layer = svgNode('g');
    layer.classList.add('relphi-canonical-marker-layer', PLACEMENT_TARGET);
    layer.dataset.canonCommit = CANON_COMMIT;
    layer.dataset.signature = signature;
    layer.dataset.presentation = 'inscribed';
    layer.dataset.masterPolicy = 'untouched-component-defaults';
    layer.setAttribute('aria-label', 'Untouched canonical sky placement glyphs');

    const leaders = svgNode('g');
    leaders.classList.add('relphi-canonical-integrity-leaders');
    source.querySelectorAll('.relphi-canonical-marker-leader').forEach(function (line) {
      leaders.appendChild(line.cloneNode(true));
    });
    const glyphs = svgNode('g');
    glyphs.classList.add('relphi-canonical-integrity-glyphs');
    layer.append(leaders, glyphs);
    svg.appendChild(layer);

    const jobs = sourceHosts.map(function (sourceHost) {
      const id = sourceHost.dataset.glyphId || '';
      const color = sourceHost.dataset.glyphColor || '#dc1f18';
      const host = svgNode('g');
      host.classList.add('relphi-canonical-marker-host', 'relphi-canonical-integrity-host');
      host.dataset.glyphId = id;
      host.dataset.sky = sourceHost.dataset.sky || '';
      host.dataset.glyphColor = color;
      host.dataset.canonCommit = CANON_COMMIT;
      host.setAttribute('transform', sourceHost.getAttribute('transform') || '');
      host.setAttribute('aria-label', sourceHost.getAttribute('aria-label') || id);
      glyphs.appendChild(host);
      // No radius, padding, fill, stroke, scale, font, or offset overrides.
      return component.createBubble(host, id, { color:color }).ready;
    });

    const results = await Promise.allSettled(jobs);
    if (results.some(function (result) { return result.status === 'rejected'; })) {
      layer.remove();
      return null;
    }
    svg.querySelectorAll(':scope > .' + PLACEMENT_TARGET).forEach(function (old) {
      if (old !== layer) old.remove();
    });
    svg.dataset.relphiCanonicalPlacementIntegrity = JSON.stringify({
      canonCommit:CANON_COMMIT,
      source:'RelphiGlyphComponent.createBubble defaults',
      untouched:true,
      count:jobs.length
    });
    return layer;
  }

  async function renderZodiac(svg, component) {
    const source = latest(svg, ZODIAC_SOURCE);
    if (!source) return null;
    const sourceHosts = Array.from(source.querySelectorAll('[data-glyph-id]')).slice(0, 12);
    if (sourceHosts.length < 12) return null;
    const signature = signatureForHosts(sourceHosts);
    const current = svg.querySelector(':scope > .' + ZODIAC_TARGET);
    if (current && current.dataset.signature === signature) return current;

    const layer = svgNode('g');
    layer.classList.add('relphi-canonical-zodiac-ring', ZODIAC_TARGET);
    layer.dataset.canonCommit = CANON_COMMIT;
    layer.dataset.signature = signature;
    layer.dataset.presentation = 'inscribed';
    layer.dataset.masterPolicy = 'untouched-component-defaults';
    layer.setAttribute('aria-label', 'Untouched canonical zodiac glyphs');
    svg.appendChild(layer);

    const jobs = sourceHosts.map(function (sourceHost) {
      const id = sourceHost.dataset.glyphId || '';
      const host = svgNode('g');
      host.classList.add('relphi-canonical-zodiac-host', 'relphi-canonical-zodiac-integrity-host');
      host.dataset.glyphId = id;
      host.dataset.canonCommit = CANON_COMMIT;
      host.setAttribute('transform', sourceHost.getAttribute('transform') || '');
      host.setAttribute('aria-label', sourceHost.getAttribute('aria-label') || id);
      layer.appendChild(host);
      return component.createBubble(host, id, { color:'#111' }).ready;
    });

    const results = await Promise.allSettled(jobs);
    if (results.some(function (result) { return result.status === 'rejected'; })) {
      layer.remove();
      return null;
    }
    svg.querySelectorAll(':scope > .' + ZODIAC_TARGET).forEach(function (old) {
      if (old !== layer) old.remove();
    });
    svg.dataset.relphiCanonicalZodiacIntegrity = JSON.stringify({
      canonCommit:CANON_COMMIT,
      source:'RelphiGlyphComponent.createBubble defaults',
      untouched:true,
      count:jobs.length
    });
    return layer;
  }

  async function render() {
    queued = false;
    if (rendering) {
      dirty = true;
      return;
    }
    rendering = true;
    dirty = false;
    ensureStyles();
    try {
      const component = window.RelphiGlyphComponent;
      if (!component || typeof component.createBubble !== 'function') return;
      const wheels = Array.from(document.querySelectorAll(WHEELS));
      for (const svg of wheels) {
        await renderPlacements(svg, component);
        await renderZodiac(svg, component);
      }
    } finally {
      rendering = false;
      if (dirty) queue();
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(render); });
  }

  function relevant(records) {
    return records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        if (!node || node.nodeType !== 1) return false;
        if (node.closest && (node.closest('.' + PLACEMENT_TARGET) || node.closest('.' + ZODIAC_TARGET))) return false;
        return (node.matches && (node.matches(PLACEMENT_SOURCE) || node.matches(ZODIAC_SOURCE) || node.matches(WHEELS))) ||
          (node.querySelector && (node.querySelector(PLACEMENT_SOURCE) || node.querySelector(ZODIAC_SOURCE)));
      });
    });
  }

  function start() {
    ensureStyles();
    queue();
    [120, 400, 900].forEach(function (delay) { setTimeout(queue, delay); });
    new MutationObserver(function (records) {
      if (relevant(records)) queue();
    }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    window.RelphiCanonicalIntegrity = Object.freeze({ render:queue });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
