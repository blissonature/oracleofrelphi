// Compatibility no-op for color, plus local Chiron and relationship UX bootstrap.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  document.getElementById('relphiSpecialVectorColorStyle')?.remove();

  function load(src, done) {
    const base = src.split('?')[0];
    const existing = document.querySelector('script[src^="' + base + '"]');
    if (existing) {
      if (done) {
        if (existing.dataset.relphiLoaded === 'true') setTimeout(done, 0);
        else existing.addEventListener('load', done, { once:true });
      }
      return;
    }
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    script.addEventListener('load', function () {
      script.dataset.relphiLoaded = 'true';
      if (done) done();
    }, { once:true });
    document.body.appendChild(script);
  }

  load('sky-chart-chiron-local-v1.js?v=3', function () {
    load('sky-chart-calculated-points-storage-bridge-v2.js?v=3');
  });
  load('sky-chart-relationship-scope-progressive-v1.js?v=3');
})();