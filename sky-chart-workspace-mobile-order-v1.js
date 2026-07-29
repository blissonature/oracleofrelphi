// Keeps both Sky cards together above the comparison output on narrow screens.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (document.getElementById('relphi-workspace-mobile-order-style')) return;

  const style = document.createElement('style');
  style.id = 'relphi-workspace-mobile-order-style';
  style.textContent = [
    '@media(max-width:760px){',
    '  #relphiSkyWorkspace>.relphi-workspace-sky[data-workspace-slot="skyA"]{order:1}',
    '  #relphiSkyWorkspace>.relphi-workspace-sky[data-workspace-slot="skyB"]{order:2}',
    '  #relphiSkyWorkspace>.relphi-workspace-center{order:3}',
    '}'
  ].join('');
  document.head.appendChild(style);
})();
