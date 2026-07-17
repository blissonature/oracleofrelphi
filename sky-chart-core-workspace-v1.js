// Repairs the legacy single-slot calculator by rebuilding both core sky slots before comparison.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let buildingSkyB = false;
  let awaitingCalculation = false;
  let skyA = null;

  function byId(id) { return document.getElementById(id); }
  function fire(el, type) { if (el) el.dispatchEvent(new Event(type, { bubbles:true })); }
  function hasPlacements(text) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,120}\d{1,2}°/i.test(String(text || ''));
  }
  function setField(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value || '';
    fire(el, 'input');
    fire(el, 'change');
  }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const el = byId(id);
      if (!el) return;
      el.value = kind;
      fire(el, 'input');
      fire(el, 'change');
    });
  }
  function pasteCommitButton() {
    return document.querySelector('.sky-paste-create-button, [data-create-sky], [data-confirm-sky]');
  }
  function captureSkyA() {
    if (skyA) return true;
    const output = byId('chartOutput');
    const paste = byId('skyCreatorPaste')?.value || '';
    if (!output || !hasPlacements(output.textContent || '')) return false;
    skyA = {
      html: output.innerHTML,
      paste: paste,
      name: byId('skyCreatorName')?.value || '',
      notes: byId('skyCreatorNotes')?.value || ''
    };
    return true;
  }
  function currentCalculatedRecord() {
    return {
      html: byId('chartOutput')?.innerHTML || '',
      paste: byId('skyCreatorPaste')?.value || '',
      name: byId('skyCalcName')?.value || byId('skyCreatorName')?.value || '',
      notes: byId('skyCreatorNotes')?.value || ''
    };
  }
  function writeSlot(kind, record) {
    setTarget(kind);
    setField('skyCreatorName', record.name);
    setField('skyCalcName', record.name);
    setField('skyCreatorNotes', record.notes);
    setField('skyCreatorPaste', record.paste);
    const commit = pasteCommitButton();
    if (commit && hasPlacements(record.paste)) {
      commit.click();
      return true;
    }
    const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
    if (output && record.html) {
      output.innerHTML = record.html;
      output.hidden = false;
      output.removeAttribute('hidden');
      return true;
    }
    return false;
  }
  function enableComparison() {
    const mode = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    mode?.click();
    byId('currentSkyOutput')?.removeAttribute('hidden');
    window.dispatchEvent(new Event('resize'));
  }
  function finishComparison() {
    if (!buildingSkyB || !awaitingCalculation || !skyA) return;
    const status = byId('skyCalcStatus')?.textContent || '';
    const chart = byId('chartOutput');
    if (!/^Calculated Sky for\b/i.test(status.trim()) || !hasPlacements(chart?.textContent || '')) return;

    const skyB = currentCalculatedRecord();
    if (!hasPlacements(skyB.paste) && chart?.innerHTML === skyA.html) return;

    // Establish Sky B first, then restore Sky A as a separate core record.
    writeSlot('currentSky', skyB);
    writeSlot('chart', skyA);

    const current = byId('currentSkyOutput');
    if (current && !hasPlacements(current.textContent || '') && skyB.html) {
      current.innerHTML = skyB.html;
      current.hidden = false;
      current.removeAttribute('hidden');
    }
    if (chart && !hasPlacements(chart.textContent || '') && skyA.html) chart.innerHTML = skyA.html;

    if (!hasPlacements(chart?.textContent || '') || !hasPlacements(current?.textContent || '')) return;

    setTarget('currentSky');
    enableComparison();
    buildingSkyB = false;
    awaitingCalculation = false;
    document.body.dataset.relphiSkyBReady = 'true';
    delete document.body.dataset.relphiPendingSkyKind;
    window.dispatchEvent(new CustomEvent('relphi:sky-b-ready'));
  }
  function beginSkyB() {
    buildingSkyB = true;
    document.body.dataset.relphiPendingSkyKind = 'currentSky';
    captureSkyA();
  }
  function prepareCalculation() {
    if (!buildingSkyB) return;
    captureSkyA();
    awaitingCalculation = true;
    // Let the legacy calculator run in its native slot; finishComparison rebuilds both slots afterward.
    setTarget('chart');
  }
  function install() {
    document.addEventListener('click', function (event) {
      const node = event.target;
      if (node?.closest?.('#relphiAddComparison')) beginSkyB();
      if (node?.closest?.('#relphiSkyNameContinue') && ((byId('relphiSkyNameEyebrow')?.textContent || '').toLowerCase().includes('comparison'))) beginSkyB();
      if (node?.closest?.('#relphiHereNow, #relphiChooseWhenWhere, #skyCalcRun')) prepareCalculation();
    }, true);
    ['chartOutput','currentSkyOutput','skyCalcStatus'].forEach(function (id) {
      const node = byId(id);
      if (node) new MutationObserver(finishComparison).observe(node, { childList:true, subtree:true, characterData:true });
    });
  }
  window.RelphiSkyWorkspace = { beginSkyB: beginSkyB, prepareCalculation: prepareCalculation, isBuildingSkyB: function () { return buildingSkyB; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();