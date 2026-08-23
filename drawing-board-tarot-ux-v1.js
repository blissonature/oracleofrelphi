// Tarot-first empty state and mobile hierarchy for standalone Drawing Board.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardTarotUxV1) return;
  window.__relphiDrawingBoardTarotUxV1 = true;

  const PANEL = '#shortListPanel';
  const EMPTY_ID = 'drawingBoardTarotEmptyState';
  let queued = false;

  function root() { return document.querySelector(PANEL); }

  function installStyle() {
    if (document.getElementById('drawing-board-tarot-ux-v1-style')) return;
    const style = document.createElement('style');
    style.id = 'drawing-board-tarot-ux-v1-style';
    style.textContent = `
      html body.relphi-drawing-board-page #shortListPanel .drawing-board-helpful-tip{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;position:absolute!important;pointer-events:none!important}
      .relphi-drawing-board-page .drawing-board-tarot-empty{display:grid;grid-template-columns:118px minmax(0,1fr);gap:1.15rem;align-items:center;margin:.9rem 0 1rem;padding:1rem 1.05rem;border:1px solid rgba(220,31,24,.24);border-radius:1.35rem;background:linear-gradient(135deg,rgba(220,31,24,.045),rgba(255,255,255,.92));box-shadow:0 10px 28px rgba(33,24,18,.055)}
      .relphi-drawing-board-page .drawing-board-tarot-empty-art{position:relative;width:108px;height:132px;margin:auto}
      .relphi-drawing-board-page .drawing-board-tarot-empty-art img{position:absolute;left:50%;top:50%;width:62px;height:107px;object-fit:cover;border-radius:5px;border:1px solid rgba(17,17,17,.28);box-shadow:0 7px 18px rgba(17,17,17,.18);transform-origin:50% 88%;background:#eee}
      .relphi-drawing-board-page .drawing-board-tarot-empty-art img:nth-child(1){transform:translate(-66%,-49%) rotate(-12deg)}
      .relphi-drawing-board-page .drawing-board-tarot-empty-art img:nth-child(2){z-index:2;transform:translate(-50%,-53%)}
      .relphi-drawing-board-page .drawing-board-tarot-empty-art img:nth-child(3){transform:translate(-34%,-49%) rotate(12deg)}
      .relphi-drawing-board-page .drawing-board-tarot-empty-copy{min-width:0}
      .relphi-drawing-board-page .drawing-board-tarot-empty-kicker{margin:0 0 .2rem;color:#a71b17;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .relphi-drawing-board-page .drawing-board-tarot-empty h3{margin:0;font-size:1.24rem;line-height:1.08}
      .relphi-drawing-board-page .drawing-board-tarot-empty p:not(.drawing-board-tarot-empty-kicker){margin:.42rem 0 .72rem;color:#5f5752;font-size:.94rem;line-height:1.35}
      .relphi-drawing-board-page .drawing-board-tarot-empty-actions{display:flex;flex-wrap:wrap;gap:.5rem}
      .relphi-drawing-board-page .drawing-board-tarot-empty-actions button{min-height:42px;padding:.55rem .82rem;border-radius:.8rem;font:inherit;font-weight:800;cursor:pointer}
      .relphi-drawing-board-page [data-relphi-empty-draw]{border:2px solid #c91f19;background:#dc1f18;color:#fff}
      .relphi-drawing-board-page [data-relphi-empty-choose]{border:1px solid rgba(17,17,17,.25);background:#fff;color:#111}
      @media(max-width:600px){
        .relphi-drawing-board-page .drawing-board-tarot-empty{grid-template-columns:78px minmax(0,1fr);gap:.72rem;margin:.65rem 0 .8rem;padding:.75rem;border-radius:1rem}
        .relphi-drawing-board-page .drawing-board-tarot-empty-art{width:72px;height:96px}
        .relphi-drawing-board-page .drawing-board-tarot-empty-art img{width:44px;height:76px;border-radius:4px}
        .relphi-drawing-board-page .drawing-board-tarot-empty h3{font-size:1.05rem}
        .relphi-drawing-board-page .drawing-board-tarot-empty p:not(.drawing-board-tarot-empty-kicker){margin:.28rem 0 .52rem;font-size:.84rem;line-height:1.28}
        .relphi-drawing-board-page .drawing-board-tarot-empty-kicker{font-size:.67rem}
        .relphi-drawing-board-page .drawing-board-tarot-empty-actions{display:grid;grid-template-columns:1fr;gap:.36rem}
        .relphi-drawing-board-page .drawing-board-tarot-empty-actions button{width:100%;min-height:38px;padding:.42rem .55rem;font-size:.84rem}
      }
    `;
    document.head.appendChild(style);
  }

  function removeLegacyTip(scope) {
    (scope || document).querySelectorAll?.('.drawing-board-helpful-tip').forEach(node => node.remove());
  }

  function cardCount(panel) {
    return panel ? panel.querySelectorAll('[data-row-card]').length : 0;
  }

  function openChooseFlow(panel) {
    const openSearch = () => {
      const placeholders = Array.from(panel.querySelectorAll('.card-row-item.card-row-placeholder-item'));
      const item = placeholders[placeholders.length - 1];
      const search = item?.querySelector('[data-relphi-placeholder-search]');
      if (!search) return false;
      search.click();
      window.setTimeout(() => item.querySelector('[data-relphi-placeholder-query]')?.focus(), 0);
      return true;
    };
    if (openSearch()) return;
    panel.querySelector('#addCardPlaceholder')?.click();
    const started = Date.now();
    (function waitForPlaceholder() {
      if (openSearch()) return;
      if (Date.now() - started < 1200) requestAnimationFrame(waitForPlaceholder);
    })();
  }

  function ensureEmptyState(panel) {
    if (!panel) return;
    removeLegacyTip(panel);

    const existing = panel.querySelector('#' + EMPTY_ID);
    if (cardCount(panel)) {
      existing?.remove();
      return;
    }

    const drawer = panel.querySelector('.card-row-drawing-board');
    if (!drawer) return;
    if (existing?.isConnected) return;

    const empty = document.createElement('section');
    empty.id = EMPTY_ID;
    empty.className = 'drawing-board-tarot-empty';
    empty.setAttribute('aria-label', 'Start a tarot card drawing');
    empty.innerHTML = `
      <div class="drawing-board-tarot-empty-art" aria-hidden="true">
        <img src="assets/tarot/rws-export/the_fool.webp" alt="">
        <img src="assets/tarot/rws-export/the_magician.webp" alt="">
        <img src="assets/tarot/rws-export/the_high_priestess.webp" alt="">
      </div>
      <div class="drawing-board-tarot-empty-copy">
        <p class="drawing-board-tarot-empty-kicker">Tarot card workspace</p>
        <h3>Draw or choose a tarot card</h3>
        <p>Build a spread here, then tap any card to read its full Ledger entry below.</p>
        <div class="drawing-board-tarot-empty-actions">
          <button type="button" data-relphi-empty-draw>Draw a tarot card</button>
          <button type="button" data-relphi-empty-choose>Choose a tarot card</button>
        </div>
      </div>`;
    drawer.insertAdjacentElement('afterend', empty);
  }

  function clarifyControls(panel) {
    if (!panel) return;
    const draw = panel.querySelector('#drawRandomRowCard');
    if (draw) {
      draw.textContent = 'Draw card';
      draw.setAttribute('aria-label', 'Draw a random tarot card');
      draw.title = 'Draw a random tarot card';
    }
    const add = panel.querySelector('#addCardPlaceholder');
    if (add) {
      add.textContent = 'Add card slot';
      add.setAttribute('aria-label', 'Add an empty tarot card slot');
      add.title = 'Add an empty tarot card slot';
    }
    const spreads = panel.querySelector('#relphiLabelsToggle');
    if (spreads) {
      spreads.textContent = 'Spreads';
      spreads.setAttribute('aria-label', 'Tarot spread templates');
      spreads.title = 'Tarot spread templates';
    }
    panel.querySelectorAll('.relphi-labels-drawer header strong').forEach(label => {
      if (label.textContent.trim() === 'Templates') label.textContent = 'Tarot Spreads';
    });
  }

  function enhance() {
    queued = false;
    const panel = root();
    removeLegacyTip(document);
    if (!panel) return;
    clarifyControls(panel);
    ensureEmptyState(panel);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(enhance);
  }

  window.addEventListener('click', event => {
    const panel = root();
    if (!panel) return;
    if (event.target.closest?.('[data-relphi-empty-draw]')) {
      event.preventDefault();
      panel.querySelector('#drawRandomRowCard')?.click();
      return;
    }
    if (event.target.closest?.('[data-relphi-empty-choose]')) {
      event.preventDefault();
      openChooseFlow(panel);
    }
  }, true);

  installStyle();
  enhance();
  new MutationObserver(schedule).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','data-row-card','hidden'] });
})();
