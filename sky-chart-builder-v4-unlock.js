// Allows the promoted Sky Builder V4 to initialize on the ordinary Sky Chart URL.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') === 'pr55') return;

  const original = location.href;
  const url = new URL(original);
  url.searchParams.set('preview', 'pr55');
  history.replaceState(history.state, '', url.toString());

  window.addEventListener('relphi:sky-builder-v4-loaded', function restoreUrl() {
    history.replaceState(history.state, '', original);
  }, { once:true });

  window.setTimeout(function () {
    if (location.href !== original) history.replaceState(history.state, '', original);
  }, 10000);
})();
