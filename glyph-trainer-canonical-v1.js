// Replaces Glyph Trainer display glyphs with the shared canonical renderer.
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  let scanQueued = false;

  function identityFor(holder) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;

    if (holder.id === 'flashSymbol') {
      const answerName = document.querySelector('#flashAnswer h3')?.textContent;
      return registry.resolve(answerName) || registry.resolve(holder.textContent);
    }

    const cardName = holder.closest('.glyph-card')?.querySelector('.glyph-name')?.textContent;
    return registry.resolve(cardName) || registry.resolve(holder.textContent);
  }

  function renderHolder(holder) {
    const component = window.RelphiGlyphComponent;
    const entry = identityFor(holder);
    if (!component || !entry) return;

    const existing = holder.querySelector('svg[data-relphi-canonical-id]');
    if (existing?.dataset.relphiCanonicalId === entry.id) return;

    const fallback = holder.textContent;
    const root = document.createElementNS(NS, 'svg');
    root.setAttribute('viewBox', '-32 -32 64 64');
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', entry.name);
    root.dataset.relphiCanonicalId = entry.id;
    holder.replaceChildren(root);

    component.draw(root, entry.id, {
      radius: holder.id === 'flashSymbol' ? 27 : 25,
      padding: 2,
      color: 'currentColor'
    }).catch(function () {
      if (root.isConnected && holder.contains(root)) holder.textContent = fallback;
    });
  }

  function scan() {
    scanQueued = false;
    document.querySelectorAll('.glyph-card .glyph-symbol, #flashSymbol').forEach(renderHolder);
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  }

  function start() {
    scan();
    const page = document.querySelector('.glyph-page');
    if (!page) return;
    new MutationObserver(queueScan).observe(page, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();