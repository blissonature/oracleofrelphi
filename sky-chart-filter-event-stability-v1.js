// Prevent unchanged house/aspect filter state broadcasts from recursively waking each other.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFilterEventStabilityV1) return;
  window.__relphiSkyFilterEventStabilityV1 = true;

  const watched = new Set(['relphi:sky-aspect-multiselect-changed','relphi:sky-house-multiselect-changed']);
  const signatures = new Map();
  const original = EventTarget.prototype.dispatchEvent;

  function stable(value) {
    if (Array.isArray(value)) return value.map(stable).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }

  EventTarget.prototype.dispatchEvent = function (event) {
    if (this === window && watched.has(event?.type)) {
      const signature = JSON.stringify(stable(event.detail || {}));
      if (signatures.get(event.type) === signature) return true;
      signatures.set(event.type, signature);
    }
    return original.call(this, event);
  };
})();
