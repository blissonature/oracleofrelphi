// Give each visible aspect line a wide invisible hit target and route it to the exact relationship row.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipWheelBridgeV1) return;
  window.__relphiSelectedRelationshipWheelBridgeV1 = true;

  let bridgeBusy = false;

  function aspectLine(target) {
    return target?.closest?.('.sky-foundation-aspect[data-relation-index], .sky-foundation-aspect-hit[data-relation-index], [data-focus-piece="aspect"][data-relation-index]') || null;
  }

  function activate(index) {
    if (bridgeBusy || !Number.isInteger(index)) return;
    const row = document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`);
    if (!row) return;
    bridgeBusy = true;
    row.click();
    queueMicrotask(function () {
      const panel = document.getElementById('skySelectedRelationship');
      if (panel && Number(panel.dataset.relationIndex) === index) {
        panel.dataset.selectionSource = 'comparison-wheel';
      }
      bridgeBusy = false;
    });
  }

  function installHitTargets() {
    document.querySelectorAll('.sky-foundation-aspect[data-relation-index]').forEach(function (line) {
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

  document.addEventListener('click', function (event) {
    const line = aspectLine(event.target);
    if (!line) return;
    const index = Number(line.dataset.relationIndex);
    if (!Number.isInteger(index)) return;
    queueMicrotask(function () { activate(index); });
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const line = aspectLine(event.target);
    if (!line) return;
    const index = Number(line.dataset.relationIndex);
    if (!Number.isInteger(index)) return;
    event.preventDefault();
    activate(index);
  }, true);

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
