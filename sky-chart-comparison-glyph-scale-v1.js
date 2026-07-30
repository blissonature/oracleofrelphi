// Keeps the comparison wheel to one full-size Sky A layer and one full-size Sky B layer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SKY_B_DRAFT_KEY = 'relphiSkyChartSkyBDraftV1';
  let applyQueued = false;
  let applying = false;

  function renderedSize(node) {
    try {
      const box = node.getBoundingClientRect();
      return Math.max(box.width, box.height);
    } catch (error) {
      return 0;
    }
  }

  function renderedCenter(node) {
    try {
      const box = node.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    } catch (error) {
      return { x: 0, y: 0 };
    }
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function wheelFor(root) {
    const scope = root || document;
    return scope.matches?.('.unified-sky-wheel')
      ? scope
      : scope.querySelector?.('.unified-sky-wheel') || document.querySelector('.unified-sky-wheel');
  }

  function canonicalHosts(wheel) {
    return wheel
      ? Array.from(wheel.querySelectorAll('.relphi-comparison-candy[data-glyph-id]'))
      : [];
  }

  function placementOwner(node) {
    return node.closest('.chart-wheel-placement-stick, .chart-wheel-placement, [data-placement-id], [data-object-id]');
  }

  function skyKey(node) {
    const owner = node.closest('.sky-b, [data-sky="b"], [data-sky-id="currentSky"], .sky-a, [data-sky="a"], [data-sky-id="chart"]');
    if (owner?.matches('.sky-b, [data-sky="b"], [data-sky-id="currentSky"]')) return 'b';
    if (owner?.matches('.sky-a, [data-sky="a"], [data-sky-id="chart"]')) return 'a';

    const stroke = String(node.getAttribute('stroke') || node.style?.stroke || '').toLowerCase();
    const fill = String(node.getAttribute('fill') || node.style?.fill || '').toLowerCase();
    const color = stroke + ' ' + fill;
    if (/49\s*,\s*102\s*,\s*226|31\s*,\s*79\s*,\s*186|#3166e2|#1f4fba/.test(color)) return 'b';
    if (/220\s*,\s*31\s*,\s*24|143\s*,\s*23\s*,\s*19|#dc1f18|#8f1713/.test(color)) return 'a';
    return 'unknown';
  }

  function dedupeFullSizeBubbles(wheel) {
    const groups = new Map();

    canonicalHosts(wheel).forEach(function (host) {
      const owner = placementOwner(host);
      const ownerKey = owner?.dataset?.placementId || owner?.dataset?.objectId || '';
      const glyphKey = String(host.dataset.glyphId || '').toLowerCase();
      const center = renderedCenter(host);
      const angleBucket = Math.round(Math.atan2(center.y, center.x) * 100) / 100;
      const key = [skyKey(host), glyphKey, ownerKey || angleBucket].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(host);
    });

    groups.forEach(function (hosts) {
      if (hosts.length < 2) return;
      hosts.sort(function (a, b) { return renderedSize(b) - renderedSize(a); });
      const keeper = hosts[0];
      const keeperCenter = renderedCenter(keeper);
      const keeperSize = renderedSize(keeper);

      hosts.slice(1).forEach(function (candidate) {
        const samePlace = distance(keeperCenter, renderedCenter(candidate)) < Math.max(keeperSize, 18) * 1.5;
        if (samePlace || renderedSize(candidate) <= keeperSize) candidate.remove();
      });
    });
  }

  function removeEveryTinyPlacementLayer(wheel) {
    const full = canonicalHosts(wheel);
    if (!full.length) return;

    const sizes = full.map(renderedSize).filter(function (size) { return size > 8; }).sort(function (a, b) { return a - b; });
    const fullSize = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 24;

    // On the large wheel, canonical candy bubbles are the only placement symbols allowed.
    // Preserve leader lines and labels, but remove every other glyph/circle/icon renderer.
    wheel.querySelectorAll('.chart-wheel-placement-stick, .chart-wheel-placement, [data-placement-id], [data-object-id]').forEach(function (placement) {
      placement.querySelectorAll('*').forEach(function (node) {
        if (node.closest('.relphi-comparison-candy')) return;
        if (node.matches('line, polyline')) return;
        if (node.matches('.chart-wheel-marker-degree, .chart-wheel-marker-name')) return;
        if (node.closest('.chart-wheel-marker-degree, .chart-wheel-marker-name')) return;

        const tag = node.tagName?.toLowerCase();
        const looksLikePlacementSymbol =
          tag === 'circle' || tag === 'ellipse' || tag === 'text' || tag === 'use' ||
          node.matches?.('.chart-wheel-marker-glyph, .chart-wheel-marker-object, .chart-wheel-marker-frame, .chart-wheel-marker-planet, .planet-thumb, .planet-thumb-glyph, .chart-wheel-marker-disc, .chart-wheel-stick-knob, .mini-wheel-marker, .mini-wheel-marker-glyph');

        if (!looksLikePlacementSymbol) return;
        if (renderedSize(node) <= fullSize * 1.15 || node.matches?.('.chart-wheel-marker-glyph, .chart-wheel-marker-object, .chart-wheel-marker-frame, .chart-wheel-marker-planet, .planet-thumb, .planet-thumb-glyph, .chart-wheel-marker-disc, .chart-wheel-stick-knob, .mini-wheel-marker, .mini-wheel-marker-glyph')) {
          node.remove();
        }
      });
    });

    // Catch detached mini marker groups that are not nested in a placement wrapper.
    wheel.querySelectorAll('g').forEach(function (group) {
      if (group.closest('.relphi-comparison-candy')) return;
      if (group.closest('.chart-wheel-sign-sector, .chart-wheel-aspect-ranges, .chart-wheel-all-aspects, .chart-wheel-selected-aspects')) return;
      if (group.matches('.chart-wheel-placement-stick, .chart-wheel-placement')) return;

      const hasBubble = group.querySelector(':scope > circle, :scope > ellipse');
      const hasGlyph = group.querySelector(':scope > text, :scope > use');
      if (!hasBubble || !hasGlyph) return;

      const size = renderedSize(group);
      if (size > 3 && size < fullSize * 0.9) group.remove();
    });
  }

  function installHardCssGuard() {
    if (document.getElementById('sky-chart-no-mini-placement-layer')) return;
    const style = document.createElement('style');
    style.id = 'sky-chart-no-mini-placement-layer';
    style.textContent = [
      '.unified-sky-wheel .mini-wheel-marker,',
      '.unified-sky-wheel .mini-wheel-marker-glyph,',
      '.unified-sky-wheel .chart-wheel-marker-frame,',
      '.unified-sky-wheel .chart-wheel-marker-object,',
      '.unified-sky-wheel .chart-wheel-marker-planet,',
      '.unified-sky-wheel .chart-wheel-marker-disc,',
      '.unified-sky-wheel .planet-thumb:not(.relphi-comparison-candy .planet-thumb),',
      '.unified-sky-wheel .planet-thumb-glyph:not(.relphi-comparison-candy .planet-thumb-glyph) {',
      '  display: none !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function apply(root) {
    if (applying) return;
    applying = true;
    try {
      installHardCssGuard();
      const wheel = wheelFor(root);
      if (!wheel) return;
      dedupeFullSizeBubbles(wheel);
      removeEveryTinyPlacementLayer(wheel);
    } finally {
      applying = false;
    }
  }

  function queueApply(root) {
    if (applyQueued) return;
    applyQueued = true;
    requestAnimationFrame(function () {
      applyQueued = false;
      apply(root || document);
    });
  }

  function saveSkyBDraft() {
    const target = document.getElementById('skyCalcTarget');
    if (!target || target.value !== 'currentSky') return;
    const read = function (id) { return document.getElementById(id)?.value || ''; };
    try {
      localStorage.setItem(SKY_B_DRAFT_KEY, JSON.stringify({
        name: read('skyCalcName'),
        dateTime: read('skyCalcDateTime'),
        timeZone: read('skyCalcTimeZone'),
        location: read('skyCalcLocation'),
        latitude: read('skyCalcLatitude'),
        longitude: read('skyCalcLongitude'),
        houseSystem: read('skyCalcHouseSystem')
      }));
    } catch (error) {}
  }

  function restoreSkyBDraft() {
    let draft;
    try { draft = JSON.parse(localStorage.getItem(SKY_B_DRAFT_KEY) || 'null'); } catch (error) {}
    if (!draft) return;
    const write = function (id, value) {
      const input = document.getElementById(id);
      if (input && value !== undefined && value !== null) input.value = value;
    };
    write('skyCalcName', draft.name);
    write('skyCalcDateTime', draft.dateTime);
    write('skyCalcTimeZone', draft.timeZone);
    write('skyCalcLocation', draft.location);
    write('skyCalcLatitude', draft.latitude);
    write('skyCalcLongitude', draft.longitude);
    write('skyCalcHouseSystem', draft.houseSystem);
  }

  function replaceSkyBBeforeCalculation(event) {
    const run = event.target.closest?.('#skyCalcRun');
    if (!run) return;
    const calcTarget = document.getElementById('skyCalcTarget');
    if (!calcTarget || calcTarget.value !== 'currentSky') return;

    saveSkyBDraft();
    const editorTarget = document.getElementById('skyCreatorTarget');
    const clearButton = document.getElementById('skyCreatorClear');
    if (editorTarget && clearButton) {
      editorTarget.value = 'currentSky';
      editorTarget.dispatchEvent(new Event('change', { bubbles: true }));
      clearButton.click();
      restoreSkyBDraft();
      calcTarget.value = 'currentSky';
    }
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    queueApply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () {
    queueApply(document);
  });

  function start() {
    apply(document);
    document.addEventListener('click', replaceSkyBBeforeCalculation, true);
    document.addEventListener('change', function (event) {
      if (event.target.closest?.('.sky-calc-panel')) saveSkyBDraft();
    });

    const observer = new MutationObserver(function (mutations) {
      if (!applying && mutations.some(function (mutation) { return mutation.addedNodes.length; })) queueApply(document);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();