// Sky Chart contract bootstrap. This is the only public-renderer entry point.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyContractBootV1) return;
  window.__relphiSkyContractBootV1 = true;

  // The native result surface is calculation/card data only. It is never public UI.
  const guard = document.createElement('style');
  guard.id = 'relphi-sky-contract-first-paint';
  guard.textContent = 'body.sky-chart-page #chartPanel>.sky-output-box{display:none!important}';
  document.head.appendChild(guard);

  if (!window.CSS) window.CSS = {};
  if (!window.CSS.escape) {
    window.CSS.escape = function (value) {
      return String(value).replace(/[^a-zA-Z0-9_-]/g, function (character) {
        return '\\' + character.codePointAt(0).toString(16) + ' ';
      });
    };
  }

  if (!document.querySelector('link[href^="sky-chart-contract-v1.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'sky-chart-contract-v1.css?v=1';
    document.head.appendChild(link);
  }

  function load(src, done) {
    const base = src.split('?')[0];
    const existing = document.querySelector('script[src^="' + base + '"]');
    if (existing) {
      if (done) {
        if (existing.dataset.relphiLoaded === 'true') queueMicrotask(done);
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
    document.head.appendChild(script);
  }

  load('relphi-canonical-angle-masters-v1.js?v=1', function () {
    load('sky-chart-contract-renderer-v1.js?v=1', function () {
      load('sky-chart-contract-controller-v1.js?v=2');
    });
  });
})();
