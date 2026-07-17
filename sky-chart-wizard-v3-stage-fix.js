// Restores V3 method transitions whose destination IDs were renamed.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const stageIds = [
    'relphiV3Name',
    'relphiV3Method',
    'relphiV3ExistingStage',
    'relphiV3CalculateStage',
    'relphiV3Complete'
  ];

  function showStage(id) {
    stageIds.forEach(function (stageId) {
      const stage = document.getElementById(stageId);
      if (stage) stage.hidden = stageId !== id;
    });
  }

  window.addEventListener('click', function (event) {
    const target = event.target;
    if (target.closest?.('#relphiV3Calculate')) {
      window.setTimeout(function () {
        showStage('relphiV3CalculateStage');
        const choices = document.getElementById('relphiV3CalcChoices');
        if (choices) choices.hidden = false;
      }, 0);
      return;
    }
    if (target.closest?.('#relphiV3Existing')) {
      window.setTimeout(function () { showStage('relphiV3ExistingStage'); }, 0);
    }
  }, true);
})();
