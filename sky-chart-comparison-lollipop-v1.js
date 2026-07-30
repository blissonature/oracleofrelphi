// The full-size canonical wheel is the only placement renderer on Sky Chart.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const TINY_OVERLAY = '.relphi-comparison-lollipop-v1';
  let removing = false;

  function removeTinyOverlay(root) {
    if (removing) return;
    removing = true;
    try {
      const scope = root && root.querySelectorAll ? root : document;
      scope.querySelectorAll(TINY_OVERLAY).forEach(function (overlay) {
        overlay.remove();
      });
      document.querySelectorAll('.unified-sky-wheel svg').forEach(function (svg) {
        svg.dataset.relphiPlacementLayer = 'canonical-full-size-only';
      });
    } finally {
      removing = false;
    }
  }

  function start() {
    removeTinyOverlay(document);

    new MutationObserver(function (records) {
      if (removing) return;
      const containsTinyOverlay = records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          if (!node || node.nodeType !== 1) return false;
          return node.matches?.(TINY_OVERLAY) || !!node.querySelector?.(TINY_OVERLAY);
        });
      });
      if (containsTinyOverlay) removeTinyOverlay(document);
    }).observe(document.body, { childList:true, subtree:true });

    window.addEventListener('relphi:comparison-lollipop-ready', function () {
      removeTinyOverlay(document);
    });
  }

  window.RelphiComparisonLollipop = Object.freeze({
    disabled:true,
    removeTinyOverlay:function () { removeTinyOverlay(document); }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
