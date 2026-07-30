// Keep only full-size canonical placement wrappers on the main comparison wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;

  function wheelFor(root) {
    const scope = root || document;
    if (scope.matches?.('.unified-sky-wheel')) return scope;
    return scope.querySelector?.('.unified-sky-wheel') || document.querySelector('.unified-sky-wheel');
  }

  function directPlacementWrappers(wheel) {
    return Array.from(wheel.querySelectorAll('.chart-wheel-placement-stick, .chart-wheel-placement'))
      .filter(function (node) {
        return !node.parentElement?.closest('.chart-wheel-placement-stick, .chart-wheel-placement');
      });
  }

  function keepCanonicalLayerOnly(root) {
    const wheel = wheelFor(root);
    if (!wheel) return;

    const canonical = wheel.querySelectorAll('.relphi-comparison-candy[data-glyph-id]');
    if (!canonical.length) return;

    directPlacementWrappers(wheel).forEach(function (placement) {
      const host = placement.querySelector('.relphi-comparison-candy[data-glyph-id]');

      // The tiny placements are emitted as separate placement wrappers with no
      // canonical candy host. Suppress those wrappers completely.
      if (!host) {
        placement.style.setProperty('display', 'none', 'important');
        placement.setAttribute('aria-hidden', 'true');
        return;
      }

      placement.style.removeProperty('display');
      placement.removeAttribute('aria-hidden');

      // Keep the full-size canonical bubble and its ancestor chain. Hide only
      // sibling fallback marker artwork inside the canonical placement wrapper.
      Array.from(placement.children).forEach(function (child) {
        const containsCanonical = child === host || child.contains(host);
        const tag = child.tagName?.toLowerCase();
        const keepStructural = tag === 'line' || tag === 'polyline' ||
          child.matches?.('.chart-wheel-stick, .chart-wheel-radius, .chart-wheel-marker-degree, .chart-wheel-marker-name');

        if (containsCanonical || keepStructural) {
          child.style?.removeProperty('display');
          return;
        }

        child.style?.setProperty('display', 'none', 'important');
      });

      host.style.setProperty('display', 'inline', 'important');
      host.style.setProperty('visibility', 'visible', 'important');
      host.style.setProperty('opacity', '1', 'important');
      host.removeAttribute('aria-hidden');
    });
  }

  function queue(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      keepCanonicalLayerOnly(root || document);
    });
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    queue(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () {
    queue(document);
  });

  function start() {
    keepCanonicalLayerOnly(document);
    const observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) { return mutation.addedNodes.length; })) queue(document);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();