// Sky Chart contract bootstrap. This is the only public-renderer entry point.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyContractBootV1) return;
  window.__relphiSkyContractBootV1 = true;

  document.body.classList.add('relphi-sky-contract-booting');
  const guard = document.createElement('style');
  guard.id = 'relphi-sky-contract-first-paint';
  guard.textContent = [
    'body.sky-chart-page #chartPanel>.sky-output-box{display:none!important}',
    'body.relphi-sky-contract-booting #chartPanel>*{visibility:hidden!important}',
    'body.relphi-sky-contract-booting #chartPanel>#relphiSkyChartContractRoot{visibility:visible!important}',
    'body.relphi-sky-contract-booting #chartPanel::before{content:"Loading the canonical chart…";display:grid;place-items:center;min-height:420px;border:1px solid rgba(30,27,23,.16);border-radius:16px;background:#fffdf8;color:#6e665f;font:700 .9rem/1.4 system-ui,sans-serif}'
  ].join('');
  document.head.appendChild(guard);

  if (!window.CSS) window.CSS = {};
  if (!window.CSS.escape) {
    window.CSS.escape = function (value) {
      return String(value).replace(/[^a-zA-Z0-9_-]/g, function (character) {
        return '\\' + character.codePointAt(0).toString(16) + ' ';
      });
    };
  }

  function loadScript(src, done) {
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
    script.addEventListener('error', function () {
      document.body.classList.remove('relphi-sky-contract-booting');
      console.error('Sky Chart contract asset failed to load:', src);
    }, { once:true });
    document.head.appendChild(script);
  }

  function startScripts() {
    loadScript('relphi-canonical-angle-masters-v1.js?v=1', function () {
      loadScript('sky-chart-contract-renderer-v1.js?v=1', function () {
        loadScript('sky-chart-contract-controller-v1.js?v=2', function () {
          loadScript('sky-chart-contract-native-map-v1.js?v=1', function () {
            document.body.classList.remove('relphi-sky-contract-booting');
          });
        });
      });
    });
  }

  const existingStyle = document.querySelector('link[href^="sky-chart-contract-v1.css"]');
  if (existingStyle) startScripts();
  else {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'sky-chart-contract-v1.css?v=1';
    link.addEventListener('load', startScripts, { once:true });
    link.addEventListener('error', function () {
      document.body.classList.remove('relphi-sky-contract-booting');
      console.error('Sky Chart contract stylesheet failed to load.');
    }, { once:true });
    document.head.appendChild(link);
  }
})();
