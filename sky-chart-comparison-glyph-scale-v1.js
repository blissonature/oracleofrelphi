// Applies the Prognose-style visual hierarchy to canonical comparison-wheel candy balls.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function clean(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function scaleFor(id) {
    const key = clean(id);
    if (key === 'sun' || key === 'moon') return 1.22;
    if (['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'].includes(key)) return 1;
    if (['rising','ascendant','asc','ac','descendant','dsc','dc','mc','midheaven','ic','imumcoeli'].includes(key)) return 0.9;
    if (['chiron','northnode','southnode','node','lilith','vertex','partoffortune','fortune'].includes(key)) return 0.78;
    return 0.84;
  }

  function apply(root) {
    (root || document).querySelectorAll('.relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      const scale = scaleFor(host.dataset.glyphId);
      const transform = String(host.getAttribute('transform') || '').replace(/\s+scale\([^)]*\)\s*$/, '');
      host.setAttribute('transform', transform + ' scale(' + scale + ')');
      host.dataset.visualScale = String(scale);
    });
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    apply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () { requestAnimationFrame(function () { apply(document); }); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(document); }, { once:true });
  else apply(document);
})();
