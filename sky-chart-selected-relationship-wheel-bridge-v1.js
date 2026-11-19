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
      hit.setAttribute('stroke-width', '28');
      hit.setAttribute('stroke-linecap', 'round');
      hit.setAttribute('vector-effect', 'non-scaling-stroke');
      hit.setAttribute('pointer-events', 'stroke');
      // Clone the source's current visibility. Later Focus/Harmonic Window
      // changes are applied atomically by the existing visibility owner.
      if(line.hidden||line.getAttribute('aria-hidden')==='true'||
         getComputedStyle(line).display==='none'){
        hit.hidden=true;
        hit.setAttribute('aria-hidden','true');
        hit.style.setProperty('display','none','important');
        hit.style.setProperty('pointer-events','none','important');
      }
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
