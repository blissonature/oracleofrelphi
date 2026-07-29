// Compact scale correction for skinny Sky cards.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function install() {
    if (document.getElementById('relphi-skinny-card-compact-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-card-compact-style';
    style.textContent = `
      @media (min-width:1180px) {
        #relphiSkyWorkspace.has-sky-b {
          grid-template-columns:minmax(160px,184px) minmax(820px,1fr) minmax(160px,184px)!important;
          gap:10px!important;
        }
      }
      .relphi-skinny-head {
        gap:.25rem!important;
      }
      .relphi-skinny-head .relphi-workspace-tab {
        padding:.42rem .72rem!important;
        font-size:.72rem!important;
      }
      .relphi-skinny-head h2 {
        font-size:.82rem!important;
      }
      .relphi-skinny-actions button {
        padding:.3rem .22rem!important;
        font-size:.64rem!important;
      }
      .relphi-skinny-actions button:last-child {
        font-size:.84rem!important;
      }
      .relphi-skinny-seal {
        height:34px!important;
      }
      .relphi-skinny-seal .relphi-ph-portal {
        width:82px!important;
        max-width:82px!important;
        top:-28px!important;
      }
      .relphi-skinny-seal .relphi-phc-label {
        display:none!important;
      }
      .relphi-skinny-solo {
        padding:.2rem!important;
      }
      .relphi-skinny-solo svg {
        width:88%!important;
        margin:0 auto!important;
      }
      .relphi-skinny-row {
        grid-template-columns:17px 17px minmax(43px,1fr) 22px!important;
        gap:.16rem!important;
        min-height:22px!important;
        padding:.12rem .28rem!important;
      }
      .relphi-skinny-body-glyph,
      .relphi-skinny-sign-glyph {
        width:14px!important;
        height:14px!important;
      }
      .relphi-skinny-coordinate,
      .relphi-skinny-house {
        font-size:.66rem!important;
      }
      @media (max-width:760px) {
        .relphi-skinny-seal { height:38px!important; }
        .relphi-skinny-seal .relphi-ph-portal { width:90px!important; max-width:90px!important; top:-30px!important; }
        .relphi-skinny-solo { max-width:230px!important; }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();