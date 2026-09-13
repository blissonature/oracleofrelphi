// Compatibility shim. Spread/template lifecycle is owned by the layout controller.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardTemplateLifecycleV1) return;
  window.__relphiDrawingBoardTemplateLifecycleV1 = true;

  // Kept only because older loaders still request this filename. It must not
  // stage placeholders, re-apply layouts, or mutate Drawing Board state.
  window.RelphiDrawingBoardTemplateLifecycle = Object.freeze({
    retired:true
  });
})();
