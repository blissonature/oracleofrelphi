// Compatibility no-op: canonical marker renderer owns Pluto and Fortune color.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  document.getElementById('relphiSpecialVectorColorStyle')?.remove();
})();
