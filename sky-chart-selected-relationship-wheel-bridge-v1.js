// Bridge the comparison wheel's exact relationship index to the selected-view row contract.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  function aspectLine(target) {
    return target?.closest?.('.sky-foundation-aspect[data-relation-index], [data-focus-piece="aspect"][data-relation-index]') || null;
  }

  function activate(line) {
    const index = Number(line?.dataset?.relationIndex);
    if (!Number.isInteger(index)) return;
    const row = document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`);
    if (!row) return;

    // The row is the canonical relationship object. Reuse it rather than
    // reconstructing a second relationship from wheel styling or geometry.
    row.click();
    queueMicrotask(function () {
      const panel = document.getElementById('skySelectedRelationship');
      if (!panel || Number(panel.dataset.relationIndex) !== index) return;
      panel.dataset.selectionSource = 'comparison-wheel';
    });
  }

  document.addEventListener('click', function (event) {
    const line = aspectLine(event.target);
    if (!line) return;
    queueMicrotask(function () { activate(line); });
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const line = aspectLine(event.target);
    if (!line) return;
    event.preventDefault();
    activate(line);
  }, true);
})();
