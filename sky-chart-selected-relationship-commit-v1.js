// Reveal the selected relationship only after its final glyphs and both sky cards exist.
(function () {
  'use strict';
  if (window.__relphiSelectedRelationshipCommitV1) return;
  window.__relphiSelectedRelationshipCommitV1 = true;

  let panel = null;
  let body = null;
  let observer = null;
  let revealFrame = 0;

  function withhold() {
    if (!panel) return;
    panel.removeAttribute('data-glyphs-ready');
    if (revealFrame) cancelAnimationFrame(revealFrame);
    revealFrame = 0;
  }

  function bind() {
    const nextPanel = document.getElementById('skySelectedRelationship');
    const nextBody = nextPanel?.querySelector('.sky-selected-body');
    if (!nextPanel || !nextBody) return false;
    if (panel === nextPanel && body === nextBody && observer) return true;
    observer?.disconnect();
    panel = nextPanel;
    body = nextBody;
    withhold();
    observer = new MutationObserver(withhold);
    observer.observe(body, { childList:true, subtree:true });
    return true;
  }

  function revealFinalComposition() {
    if (!bind()) return;
    withhold();
    revealFrame = requestAnimationFrame(() => {
      revealFrame = 0;
      const bubbles = panel.querySelectorAll('.sky-selected-symbols .relphi-glyph-bubble[data-relphi-atomic-ready="true"][data-relphi-atomic-build="detached-final"]');
      const cards = panel.querySelectorAll('.sky-selected-cards > .sky-selected-card[data-selected-card]');
      const completeCards = Array.from(cards).every(card => card.querySelector('img'));
      if (bubbles.length === 3 && cards.length === 2 && completeCards) {
        panel.dataset.glyphsReady = 'true';
      }
    });
  }

  window.addEventListener('relphi:selected-relationship-rendered', revealFinalComposition);
  window.addEventListener('relphi:sky-foundation-ready', bind);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once:true });
  else bind();
})();
