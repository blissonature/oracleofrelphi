// Compatibility shim. Geometry is owned by drawing-board-template-lifecycle-v1.js
// (the state-level Drawing Board layout controller on this branch).
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardRenderGeometryV1) return;
  window.__relphiDrawingBoardRenderGeometryV1 = true;
  // Deliberately no DOM geometry mutations, observers, translations, or fit logic.
})();
