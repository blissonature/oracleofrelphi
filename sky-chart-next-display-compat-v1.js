// Compatibility bridge for mounting the Sky Chart Next wheel inside the live Sky Chart.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function installStyles() {
    if (document.getElementById('sky-chart-next-display-compat-style')) return;
    const style = document.createElement('style');
    style.id = 'sky-chart-next-display-compat-style';
    style.textContent = [
      '.sky-chart-page .scn-live-wheel {',
      '  visibility: visible !important;',
      '  opacity: 1 !important;',
      '  display: block !important;',
      '}',
      '.sky-chart-page .unified-sky-wheel:has(.scn-live-wheel) {',
      '  visibility: visible !important;',
      '  opacity: 1 !important;',
      '}',
      '.sky-chart-page .relphi-workspace-sky,',
      '.sky-chart-page .relphi-sky-workspace,',
      '.sky-chart-page #relphiSkyWorkspace {',
      '  visibility: visible !important;',
      '  opacity: 1 !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function installGlyphAlias() {
    const component = window.RelphiGlyphComponent;
    if (!component || component.createGlyph) return !!component;
    window.RelphiGlyphComponent = Object.freeze(Object.assign({}, component, {
      createGlyph:function (parent, identity, options) {
        const ready = component.draw(parent, identity, {
          radius:Number(options?.size || 19),
          padding:Number(options?.padding ?? 1),
          color:options?.color || '#171717',
          bubbleStrokeWidth:0
        });
        return { ready:ready };
      }
    }));
    return true;
  }

  function install() {
    installStyles();
    if (!installGlyphAlias()) return setTimeout(install, 40);
    document.documentElement.dataset.skyChartNextCompat = 'ready';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();