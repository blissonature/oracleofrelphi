// Canonical-only relationship token renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiCanonicalRelationshipTokensV1) return;
  window.__relphiCanonicalRelationshipTokensV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  let observer = null;
  let queued = false;

  function identity(holder) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    const values = [
      holder.dataset.glyphId,
      holder.getAttribute('aria-label')?.replace(/^Reveal\s+/i, ''),
      holder.querySelector('img')?.alt,
      holder.textContent
    ];
    for (const value of values) {
      if (!value) continue;
      const entry = registry.resolve(value) || registry.get(value);
      if (entry) return entry;
    }
    return null;
  }

  function render(holder) {
    if (holder.dataset.relphiCanonicalTokenReady === 'true') return;
    const component = window.RelphiGlyphComponent;
    const entry = identity(holder);
    if (!component?.draw || !entry) {
      holder.replaceChildren();
      holder.dataset.relphiCanonicalTokenError = entry ? 'component-unavailable' : 'glyph-unresolved';
      return;
    }
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-18 -18 36 36');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', entry.name);
    holder.replaceChildren(svg);
    holder.dataset.glyphId = entry.id;
    holder.dataset.relphiCanonicalTokenReady = 'pending';
    component.draw(svg, entry.id, { radius:14, padding:1, color:'currentColor' }).then(function () {
      holder.dataset.relphiCanonicalTokenReady = 'true';
      holder.removeAttribute('data-relphi-canonical-token-error');
    }).catch(function (error) {
      svg.remove();
      holder.dataset.relphiCanonicalTokenReady = 'failed';
      holder.dataset.relphiCanonicalTokenError = error?.message || 'canonical-draw-failed';
    });
  }

  function scan() {
    queued = false;
    document.querySelectorAll('#chartOutput .relphi-canonical-token-glyph, #relphiSelectedRelationshipMount .relphi-canonical-token-glyph').forEach(render);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  function start() {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.draw) {
      setTimeout(start, 30);
      return;
    }
    scan();
    const output = document.getElementById('chartOutput');
    if (output && !observer) {
      observer = new MutationObserver(queue);
      observer.observe(output, { childList:true, subtree:true });
    }
    window.addEventListener('relphi:canonical-angle-masters-ready', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
