// Prevent source-sized canonical SVG art from ever reaching a visible paint frame.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphSizeGuardV1) return;
  window.__relphiSkyGlyphSizeGuardV1 = true;

  const SELECTOR = '.relphi-canonical-glyph';
  const CHART_SCOPE = '#skyFoundationRoot,#skySelectedRelationship';
  let pending = 0;

  function inChart(art) {
    return !!art.closest(CHART_SCOPE);
  }

  function expectedFit(art) {
    const root = art.closest('.relphi-glyph-bubble');
    const circle = root?.querySelector(':scope > circle');
    const id = root?.dataset?.glyphId || art.dataset.glyphId || '';
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    const radius = Number(circle?.getAttribute('r') || 19);
    const strokeWidth = Number(circle?.getAttribute('stroke-width') || 2.35);
    return { root, entry, radius, strokeWidth };
  }

  function reveal(art, mode) {
    art.dataset.relphiAtomicCommit = 'true';
    art.dataset.relphiSizeGuard = mode;
    art.style.removeProperty('visibility');
    art.style.removeProperty('opacity');
    delete art.dataset.relphiSizeGuardPending;
    pending = Math.max(0, pending - 1);
    document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
    window.dispatchEvent(new CustomEvent('relphi:glyph-size-guard-committed', {
      detail:{ art, mode }
    }));
  }

  function fitAndReveal(art) {
    if (!art.isConnected || !inChart(art)) {
      pending = Math.max(0, pending - 1);
      document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
      return;
    }
    if (art.dataset.relphiAtomicCommit === 'true') {
      reveal(art, 'already-fitted');
      return;
    }

    const component = window.RelphiGlyphComponent;
    const { root, entry, radius, strokeWidth } = expectedFit(art);
    if (root && entry && component?.fit) {
      component.fit(art, entry, radius, 1, strokeWidth);
      reveal(art, 'guard-fitted');
      return;
    }

    // A canonical group without a resolvable bubble is still withheld rather than
    // allowing a source-sized asset to flash across the chart.
    art.dataset.relphiSizeGuard = 'withheld-unresolved';
    art.dataset.relphiSizeGuardError = entry ? 'bubble-missing' : 'identity-missing';
    delete art.dataset.relphiSizeGuardPending;
    pending = Math.max(0, pending - 1);
    document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
  }

  function guard(art) {
    if (!(art instanceof SVGElement) || !art.matches(SELECTOR) || !inChart(art)) return;
    if (art.dataset.relphiAtomicCommit === 'true') return;
    if (art.dataset.relphiSizeGuardPending === 'true') return;

    art.dataset.relphiSizeGuardPending = 'true';
    art.style.setProperty('visibility', 'hidden', 'important');
    pending += 1;
    document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
    requestAnimationFrame(() => fitAndReveal(art));
  }

  function inspect(node) {
    if (!(node instanceof Element)) return;
    if (node.matches?.(SELECTOR)) guard(node);
    node.querySelectorAll?.(SELECTOR).forEach(guard);
  }

  const observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(inspect));
  });

  function start() {
    observer.observe(document.documentElement, { childList:true, subtree:true });
    document.querySelectorAll(`${CHART_SCOPE} ${SELECTOR}`).forEach(guard);
    document.documentElement.dataset.skyGlyphSizeGuard = 'active';
    document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
  }

  window.RelphiSkyGlyphSizeGuard = Object.freeze({
    inspect,
    get pending() { return pending; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
