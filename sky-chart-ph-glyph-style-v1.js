// Compatibility no-op: canonical Sky Chart marker renderer owns glyph visibility and styling.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  document.getElementById('relphiPhGlyphStyle')?.remove();
})();
