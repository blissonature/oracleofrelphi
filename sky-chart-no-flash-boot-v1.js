// Prevents visitors from seeing intermediate Sky Chart renderers.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  document.body.classList.add('relphi-sky-preparing');

  if (!document.getElementById('relphi-sky-no-flash-style')) {
    const style = document.createElement('style');
    style.id = 'relphi-sky-no-flash-style';
    style.textContent = `
      .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace{
        visibility:hidden!important;
        opacity:0!important;
        pointer-events:none!important;
      }
      .sky-chart-page.relphi-sky-preparing #chartOutput{
        min-height:34rem;
        position:relative;
      }
      .sky-chart-page.relphi-sky-preparing #chartOutput::before{
        content:'Preparing chart…';
        position:absolute;
        inset:0;
        display:grid;
        place-items:center;
        min-height:34rem;
        color:#6b6661;
        font:800 .9rem system-ui,sans-serif;
        letter-spacing:.04em;
        background:#fff;
        border:1px solid rgba(17,17,17,.09);
        border-radius:1rem;
      }
      .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace{
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
      }
      .sky-chart-page.relphi-sky-final-ready #chartOutput::before{display:none!important}
    `;
    document.head.appendChild(style);
  }

  window.RelphiSkyRenderGate = Object.freeze({
    prepare: function () {
      document.body.classList.remove('relphi-sky-final-ready');
      document.body.classList.add('relphi-sky-preparing');
    },
    reveal: function () {
      document.body.classList.remove('relphi-sky-preparing');
      document.body.classList.add('relphi-sky-final-ready');
    }
  });
})();