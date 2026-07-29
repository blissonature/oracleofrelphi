// Prevents visitors from seeing intermediate Sky Chart renderers without blanking the page.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  document.body.classList.add('relphi-sky-preparing');

  if (!document.getElementById('relphi-sky-no-flash-style')) {
    const style = document.createElement('style');
    style.id = 'relphi-sky-no-flash-style';
    style.textContent = `
      .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace{
        display:block!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:none!important;
        min-height:34rem!important;
        position:relative!important;
      }
      .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace>*{
        visibility:hidden!important;
      }
      .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace::before{
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
        visibility:visible!important;
        z-index:50;
      }
      .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace{
        display:grid!important;
        visibility:visible!important;
        opacity:1!important;
        pointer-events:auto!important;
      }
      .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace>*{
        visibility:visible!important;
      }
      .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace::before{display:none!important}
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