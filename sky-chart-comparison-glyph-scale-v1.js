// Keeps the comparison wheel to one Sky A layer and one replaceable Sky B layer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPH_FONT_SIZE = '13px';
  const SKY_B_DRAFT_KEY = 'relphiSkyChartSkyBDraftV1';

  function undoExperimentalHostScaling(root) {
    (root || document).querySelectorAll('.relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      const saved = host.dataset.uniformGlyphBaseTransform;
      if (saved !== undefined) {
        if (saved) host.setAttribute('transform', saved);
        else host.removeAttribute('transform');
      }
      delete host.dataset.uniformGlyphBaseTransform;
      delete host.dataset.visualScale;
    });
  }

  function normalizeTextGlyphs(root) {
    (root || document).querySelectorAll(
      '.unified-sky-wheel .chart-wheel-marker-glyph, ' +
      '.unified-sky-wheel .planet-thumb-glyph'
    ).forEach(function (glyph) {
      glyph.setAttribute('font-size', GLYPH_FONT_SIZE);
      glyph.style.setProperty('font-size', GLYPH_FONT_SIZE, 'important');
      glyph.style.setProperty('line-height', '1', 'important');
    });
  }

  function removeLegacyMiniGlyphs(root) {
    const scope = root || document;
    scope.querySelectorAll('.unified-sky-wheel .chart-wheel-placement, .unified-sky-wheel .chart-wheel-placement-stick').forEach(function (placement) {
      const canonical = placement.querySelector('.relphi-comparison-candy[data-glyph-id]');
      if (!canonical) return;

      placement.querySelectorAll(
        '.chart-wheel-marker-glyph, ' +
        '.chart-wheel-marker-object, ' +
        '.chart-wheel-marker-frame, ' +
        '.chart-wheel-marker-planet, ' +
        '.planet-thumb-glyph'
      ).forEach(function (legacy) {
        if (legacy.closest('.relphi-comparison-candy')) return;
        legacy.style.setProperty('display', 'none', 'important');
        legacy.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function dedupeCanonicalGlyphs(root) {
    const scope = root || document;
    scope.querySelectorAll('.unified-sky-wheel .chart-wheel-placement, .unified-sky-wheel .chart-wheel-placement-stick').forEach(function (placement) {
      const seen = new Set();
      Array.from(placement.querySelectorAll('.relphi-comparison-candy[data-glyph-id]')).reverse().forEach(function (host) {
        const key = [
          host.dataset.glyphId || '',
          placement.classList.contains('sky-b') ? 'sky-b' : 'sky-a'
        ].join('|');
        if (seen.has(key)) host.remove();
        else seen.add(key);
      });
    });
  }

  function apply(root) {
    undoExperimentalHostScaling(root);
    dedupeCanonicalGlyphs(root);
    removeLegacyMiniGlyphs(root);
    normalizeTextGlyphs(root);
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
    apply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () {
    requestAnimationFrame(function () { apply(document); });
  });

  function start() {
    apply(document);
    document.addEventListener('click', replaceSkyBBeforeCalculation, true);
    document.addEventListener('change', function (event) {
      if (event.target.closest?.('.sky-calc-panel')) saveSkyBDraft();
    });

    const observer = new MutationObserver(function () {
      requestAnimationFrame(function () { apply(document); });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();