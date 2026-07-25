// Allows the browser-only Sky Chart preview to read JPL Horizons through CORS-safe relays.
(function () {
  'use strict';
  if (window.__relphiJplCorsBridgeV1) return;
  window.__relphiJplCorsBridgeV1 = true;

  const nativeFetch = window.fetch.bind(window);
  const JPL = 'https://ssd.jpl.nasa.gov/api/horizons.api?';
  const relays = [
    function (url) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url); },
    function (url) { return 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(url); }
  ];

  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url || !url.startsWith(JPL)) return nativeFetch(input, init);

    try {
      const direct = await nativeFetch(input, init);
      if (direct.ok) return direct;
    } catch (_) {}

    let lastError = null;
    for (const relay of relays) {
      try {
        const response = await nativeFetch(relay(url), Object.assign({}, init || {}, { mode:'cors', cache:'no-store' }));
        if (response.ok) return response;
        lastError = new Error('Chiron relay returned ' + response.status + '.');
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Chiron ephemeris request failed.');
  };
})();
