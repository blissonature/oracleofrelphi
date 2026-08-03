// Prevent source-sized canonical SVG art from ever reaching a visible paint frame.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphSizeGuardV1) return;
  window.__relphiSkyGlyphSizeGuardV1 = true;

  const SELECTOR = '.relphi-canonical-glyph';
  const CHART_SCOPE = '#skyFoundationRoot,#skySelectedRelationship';
  let pending = 0;
  let withheld = 0;
  const errors = [];

  function updateState() {
    document.documentElement.dataset.skyGlyphSizeGuardPending = String(pending);
    document.documentElement.dataset.skyGlyphSizeGuardWithheld = String(withheld);
  }

  function finishPending(art) {
    delete art.dataset.relphiSizeGuardPending;
    pending = Math.max(0, pending - 1);
    updateState();
  }

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
    return { root, entry, radius, strokeWidth, id };
  }

  function reveal(art, mode) {
    art.dataset.relphiAtomicCommit = 'true';
    art.dataset.relphiSizeGuard = mode;
    art.style.removeProperty('visibility');
    art.style.removeProperty('opacity');
    finishPending(art);
    window.dispatchEvent(new CustomEvent('relphi:glyph-size-guard-committed', {
      detail:{ art, mode }
    }));
  }

  function withhold(art, reason, error) {
    art.dataset.relphiSizeGuard = 'withheld';
    art.dataset.relphiSizeGuardError = reason;
    art.style.setProperty('visibility', 'hidden', 'important');
    withheld += 1;
    errors.push({
      reason,
      glyphId:art.closest('.relphi-glyph-bubble')?.dataset?.glyphId || '',
      message:String(error?.message || error || '')
    });
    window.__relphiSkyGlyphSizeGuardErrors = errors.slice();
    finishPending(art);
  }

  function fitAndReveal(art) {
    if (!art.isConnected || !inChart(art)) {
      finishPending(art);
      return;
    }
    if (art.dataset.relphiAtomicCommit === 'true') {
      reveal(art, 'already-fitted');
      return;
    }

    // Some canonical renderers build the fitted group while detached, then append
    // the finished group later. A pre-existing transform is evidence that the fit
    // has already happened; mark it rather than applying a second fit.
    if (art.hasAttribute('transform') && art.getAttribute('transform').trim()) {
      reveal(art, 'pre-fitted');
      return;
    }

    const component = window.RelphiGlyphComponent;
    const { root, entry, radius, strokeWidth, id } = expectedFit(art);
    if (!root || !entry || !component?.fit) {
      withhold(art, !root ? 'bubble-missing' : !entry ? `identity-missing:${id}` : 'fit-unavailable');
      return;
    }

    try {
      component.fit(art, entry, radius, 1, strokeWidth);
      reveal(art, 'guard-fitted');
    } catch (error) {
      withhold(art, 'fit-failed', error);
    }
  }

  function guard(art) {
    if (!(art instanceof SVGElement) || !art.matches(SELECTOR) || !inChart(art)) return;
    if (art.dataset.relphiAtomicCommit === 'true') return;
    if (art.dataset.relphiSizeGuardPending === 'true') return;

    art.dataset.relphiSizeGuardPending = 'true';
    art.style.setProperty('visibility', 'hidden', 'important');
    pending += 1;
    updateState();

    // Mutation observers run before the browser paints. Finishing the fit in the
    // following microtask keeps the raw source geometry hidden and commits the
    // canonical size before the next rendering opportunity.
    queueMicrotask(() => fitAndReveal(art));
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
    updateState();
  }

  window.RelphiSkyGlyphSizeGuard = Object.freeze({
    inspect,
    get pending() { return pending; },
    get withheld() { return withheld; },
    get errors() { return errors.slice(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
