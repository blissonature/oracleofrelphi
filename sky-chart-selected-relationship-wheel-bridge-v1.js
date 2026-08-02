// Give each visible aspect line a wide invisible hit target. Wheel activation is
// handled by the foundation interaction layer and never selects the dual-card view.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  function installHitTargets() {
    document.querySelectorAll('[data-layer="aspects"] > line[data-relation-index]:not(.sky-foundation-aspect-hit)').forEach(function (line) {
      line.classList.add('sky-foundation-aspect');
      if (line.dataset.hitTargetInstalled === 'true') return;
      line.dataset.hitTargetInstalled = 'true';
      const hit = line.cloneNode(false);
      hit.removeAttribute('class');
      hit.classList.add('sky-foundation-aspect-hit');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '16');
      hit.setAttribute('pointer-events', 'stroke');
      hit.setAttribute('tabindex', '-1');
      hit.setAttribute('aria-hidden', 'true');
      hit.dataset.interactive = 'aspect';
      hit.dataset.focusPiece = 'aspect';
      hit.dataset.relationIndex = line.dataset.relationIndex;
      line.parentNode.insertBefore(hit, line.nextSibling);
    });
  }

  window.addEventListener('relphi:sky-foundation-interactions-ready', installHitTargets);
  window.addEventListener('relphi:sky-foundation-ready', function () {
    requestAnimationFrame(installHitTargets);
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(installHitTargets);
    }, { once:true });
  } else {
    requestAnimationFrame(installHitTargets);
  }
})();
