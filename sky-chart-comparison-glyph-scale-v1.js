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

  function apply(root) {
    undoExperimentalHostScaling(root);
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

    // The calculator formerly appended a newly calculated Sky B to the existing
    // comparison state. Clear only Sky B immediately before the normal calculator
    // handler runs, so the new birth data replaces the old comparison sky.
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();