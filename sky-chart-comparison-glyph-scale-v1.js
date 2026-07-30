// Keeps the comparison wheel to one Sky A layer and one replaceable Sky B layer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SKY_B_DRAFT_KEY = 'relphiSkyChartSkyBDraftV1';
  let applyQueued = false;
  let applying = false;

  function skyKey(node) {
    const owner = node.closest('.sky-b, [data-sky="b"], [data-sky-id="currentSky"], .sky-a, [data-sky="a"], [data-sky-id="chart"]');
    if (owner?.matches('.sky-b, [data-sky="b"], [data-sky-id="currentSky"]')) return 'b';
    if (owner?.matches('.sky-a, [data-sky="a"], [data-sky-id="chart"]')) return 'a';
    return node.classList.contains('sky-b') ? 'b' : 'a';
  }

  function renderedSize(node) {
    try {
      const box = node.getBoundingClientRect();
      return Math.max(box.width, box.height);
    } catch (error) {
      return 0;
    }
  }

  function canonicalHosts(scope) {
    return Array.from(scope.querySelectorAll('.unified-sky-wheel .relphi-comparison-candy[data-glyph-id]'));
  }

  function canonicalReferenceSize(scope) {
    const sizes = canonicalHosts(scope).map(renderedSize).filter(function (size) {
      return Number.isFinite(size) && size > 4;
    }).sort(function (a, b) { return a - b; });
    if (!sizes.length) return 0;
    return sizes[Math.floor(sizes.length / 2)];
  }

  function dedupeCanonicalBubbles(root) {
    const scope = root || document;
    const groups = new Map();

    canonicalHosts(scope).forEach(function (host) {
      const key = skyKey(host) + '|' + String(host.dataset.glyphId || '').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(host);
    });

    groups.forEach(function (hosts) {
      if (hosts.length < 2) return;
      hosts.sort(function (a, b) { return renderedSize(b) - renderedSize(a); });
      hosts.slice(1).forEach(function (duplicate) { duplicate.remove(); });
    });
  }

  function removeNamedLegacyMarkerLayer(root) {
    const scope = root || document;
    if (!canonicalHosts(scope).length) return;

    scope.querySelectorAll(
      '.unified-sky-wheel .chart-wheel-marker-glyph, ' +
      '.unified-sky-wheel .chart-wheel-marker-object, ' +
      '.unified-sky-wheel .chart-wheel-marker-frame, ' +
      '.unified-sky-wheel .chart-wheel-marker-planet, ' +
      '.unified-sky-wheel .planet-thumb-glyph, ' +
      '.unified-sky-wheel .chart-wheel-marker-disc, ' +
      '.unified-sky-wheel .chart-wheel-stick-knob'
    ).forEach(function (legacy) {
      if (legacy.closest('.relphi-comparison-candy')) return;
      legacy.remove();
    });
  }

  function removeSmallRenderedBubbleLayer(root) {
    const scope = root || document;
    const wheel = scope.querySelector('.unified-sky-wheel') || document.querySelector('.unified-sky-wheel');
    if (!wheel) return;

    const reference = canonicalReferenceSize(wheel);
    if (!reference) return;
    const maximumLegacySize = reference * 0.72;
    const candidates = new Set();

    wheel.querySelectorAll('circle, ellipse').forEach(function (shape) {
      if (shape.closest('.relphi-comparison-candy')) return;
      if (shape.closest('.chart-wheel-sign-sector, .chart-wheel-aspect-ranges, .chart-wheel-all-aspects, .chart-wheel-selected-aspects')) return;

      let group = shape.closest('g');
      while (group && group !== wheel) {
        if (group.querySelector('text, use, path')) break;
        group = group.parentElement?.closest('g') || null;
      }
      if (!group || group === wheel || group.closest('.relphi-comparison-candy')) return;
      if (group.closest('.chart-wheel-sign-sector, .chart-wheel-aspect-ranges, .chart-wheel-all-aspects, .chart-wheel-selected-aspects')) return;

      const size = renderedSize(group);
      if (size >= 4 && size <= maximumLegacySize) candidates.add(group);
    });

    candidates.forEach(function (group) { group.remove(); });
  }

  function apply(root) {
    if (applying) return;
    applying = true;
    try {
      dedupeCanonicalBubbles(root);
      removeNamedLegacyMarkerLayer(root);
      removeSmallRenderedBubbleLayer(root);
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