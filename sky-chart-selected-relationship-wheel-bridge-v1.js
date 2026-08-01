// Bridge the comparison wheel's exact relationship state to the selected-view row contract.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  let wheelIntent = null;
  let bridgeBusy = false;

  function aspectLine(target) {
    return target?.closest?.('.sky-foundation-aspect[data-relation-index], [data-focus-piece="aspect"][data-relation-index]') || null;
  }

  function rememberWheelIntent(target) {
    const line = aspectLine(target);
    if (!line) return;
    const index = Number(line.dataset.relationIndex);
    if (!Number.isInteger(index)) return;
    wheelIntent = { index, at:performance.now() };
  }

  function activate(index) {
    if (bridgeBusy || !Number.isInteger(index)) return;
    const row = document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`);
    if (!row) return;
    bridgeBusy = true;
    row.click();
    queueMicrotask(function () {
      const panel = document.getElementById('skySelectedRelationship');
      if (panel && Number(panel.dataset.relationIndex) === index) {
        panel.dataset.selectionSource = 'comparison-wheel';
      }
      bridgeBusy = false;
      wheelIntent = null;
    });
  }

  document.addEventListener('pointerdown', function (event) {
    rememberWheelIntent(event.target);
  }, true);

  document.addEventListener('click', function (event) {
    rememberWheelIntent(event.target);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const line = aspectLine(event.target);
    if (!line) return;
    event.preventDefault();
    rememberWheelIntent(line);
  }, true);

  window.addEventListener('relphi:sky-foundation-filter-changed', function (event) {
    const state = event.detail?.state;
    if (!wheelIntent || performance.now() - wheelIntent.at > 1000) return;
    if (state?.kind !== 'aspect' || state?.mode !== 'selected') return;
    const index = Number(state.value);
    if (!Number.isInteger(index) || index !== wheelIntent.index) return;
    queueMicrotask(function () { activate(index); });
  });

  window.addEventListener('relphi:selected-relationship-rendered', function (event) {
    if (!wheelIntent) return;
    const index = Number(event.detail?.index);
    if (index !== wheelIntent.index) return;
    const panel = document.getElementById('skySelectedRelationship');
    if (panel) panel.dataset.selectionSource = 'comparison-wheel';
    wheelIntent = null;
    bridgeBusy = false;
  });
})();
