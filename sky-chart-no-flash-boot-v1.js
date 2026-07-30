// Sky Chart workspace remains visible while display enhancements initialize.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function reveal() {
    document.body.classList.remove('relphi-sky-preparing');
    document.body.classList.add('relphi-sky-final-ready');

    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) {
      workspace.style.setProperty('display', 'grid', 'important');
      workspace.style.setProperty('visibility', 'visible', 'important');
      workspace.style.setProperty('opacity', '1', 'important');
      workspace.style.setProperty('pointer-events', 'auto', 'important');
      Array.from(workspace.children).forEach(function (child) {
        child.style.setProperty('visibility', 'visible', 'important');
        child.style.setProperty('opacity', '1', 'important');
      });
    }
  }

  const oldStyle = document.getElementById('relphi-sky-no-flash-style');
  if (oldStyle) oldStyle.remove();

  const style = document.createElement('style');
  style.id = 'relphi-sky-workspace-always-visible';
  style.textContent = `
    .sky-chart-page #relphiSkyWorkspace,
    .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace,
    .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace {
      display:grid!important;
      visibility:visible!important;
      opacity:1!important;
      pointer-events:auto!important;
    }
    .sky-chart-page #relphiSkyWorkspace > *,
    .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace > *,
    .sky-chart-page.relphi-sky-final-ready #relphiSkyWorkspace > * {
      visibility:visible!important;
      opacity:1!important;
    }
    .sky-chart-page #relphiSkyWorkspace::before,
    .sky-chart-page.relphi-sky-preparing #relphiSkyWorkspace::before {
      display:none!important;
      content:none!important;
    }
  `;
  document.head.appendChild(style);

  window.RelphiSkyRenderGate = Object.freeze({
    prepare: reveal,
    reveal: reveal
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal, { once:true });
  } else {
    reveal();
  }
})();