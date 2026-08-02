// Align the foundation aspect-line contract with the selected relationship listener.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipLineBridgeV1) return;
  window.__relphiSelectedRelationshipLineBridgeV1 = true;

  function annotate() {
    document.querySelectorAll('[data-layer="aspects"] > line[data-relation-index]').forEach(function (line) {
      line.classList.add('sky-foundation-aspect');
    });
  }

  window.addEventListener('relphi:sky-foundation-interactions-ready', annotate);
  document.addEventListener('DOMContentLoaded', annotate, { once:true });
  requestAnimationFrame(annotate);
})();
