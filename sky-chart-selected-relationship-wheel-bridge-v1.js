// Give each visible aspect line a wide invisible hit target. Wheel activation is
// handled by the foundation interaction layer and never selects the dual-card view.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  function installHitTargets() {
    document.querySelectorAll('[data-layer="aspects"] > line[data-relation-index]:not(.sky-foundation-aspect-hit)').forEach(function (line) {
      line.classList.add('sky-foundation-aspect');
      if (line.dataset.hitTargetInstalled === 'true') {
        // Filters may have changed since this hit envelope was created.
        const hit=line.nextElementSibling;
        if(hit?.classList.contains('sky-foundation-aspect-hit'))
          hit.style.pointerEvents=window.RelphiSkyFoundationInteractions?.aspectLineEligible?.(line)?'stroke':'none';
        return;
      }
      line.dataset.hitTargetInstalled = 'true';
      const hit = line.cloneNode(false);
      hit.removeAttribute('class');
      hit.classList.add('sky-foundation-aspect-hit');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '28');
      hit.setAttribute('stroke-linecap', 'round');
      hit.setAttribute('vector-effect', 'non-scaling-stroke');
      hit.setAttribute('pointer-events', 'stroke');
      hit.style.pointerEvents=window.RelphiSkyFoundationInteractions?.aspectLineEligible?.(line)?'stroke':'none';
      hit.setAttribute('tabindex', '-1');
      hit.setAttribute('aria-hidden', 'true');
      hit.dataset.interactive = 'aspect';
      hit.dataset.focusPiece = 'aspect';
      hit.dataset.relationIndex = line.dataset.relationIndex;
      line.parentNode.insertBefore(hit, line.nextSibling);
    });
  }

  window.addEventListener('relphi:sky-foundation-interactions-ready', installHitTargets);
  // The bridge owns hit envelopes for all filters, without competing
  // hit-test listeners. Disabled lines lose their existing envelopes here.
  [
    'relphi:sky-aspect-visibility-applied',
    'relphi:sky-foundation-filter-changed',
    'relphi:sky-placement-multiselect-changed',
    'relphi:sky-house-multiselect-changed',
    'relphi:sky-zodiac-filter-changed',
    'relphi:sky-orb-limit-changed'
  ].forEach(name=>window.addEventListener(name,installHitTargets));
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
