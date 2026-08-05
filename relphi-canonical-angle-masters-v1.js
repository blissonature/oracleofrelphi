// Approved Oracle of Relphi angle/point monograms.
// These entries are consumed only through RelphiGlyphComponent; renderers do not
// draw their own text, circles, or substitute symbols.
(function () {
  'use strict';
  if (window.__relphiCanonicalAngleMastersV1) return;
  window.__relphiCanonicalAngleMastersV1 = true;

  function apply() {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return false;
    const masters = {
      vertex:{ fallback:'Vx', fitMode:'letter', fontWeight:'700', scale:1, dx:0, dy:0 },
      asc:{ fallback:'ASC', fitMode:'letter', fontWeight:'700', scale:1, dx:0, dy:0 },
      dsc:{ fallback:'DSC', fitMode:'letter', fontWeight:'700', scale:1, dx:0, dy:0 },
      mc:{ fallback:'MC', fitMode:'letter', fontWeight:'700', scale:1, dx:0, dy:0 },
      ic:{ fallback:'IC', fitMode:'letter', fontWeight:'700', scale:1, dx:0, dy:0 }
    };
    Object.entries(masters).forEach(([id, values]) => {
      const entry = registry.get(id);
      if (!entry) throw new Error('Missing approved canonical master: ' + id);
      Object.assign(entry, values);
    });
    document.documentElement.dataset.relphiCanonicalAngleMasters = 'ASC,DSC,MC,IC,Vx';
    window.dispatchEvent(new Event('relphi:canonical-angle-masters-ready'));
    return true;
  }

  if (!apply()) {
    const timer = setInterval(function () {
      if (apply()) clearInterval(timer);
    }, 20);
    setTimeout(function () { clearInterval(timer); }, 5000);
  }
})();
