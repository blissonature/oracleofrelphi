// Gives the desktop comparison wheel enough central width to remain legible.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function install() {
    if (document.getElementById('relphi-workspace-desktop-width-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-workspace-desktop-width-style';
    style.textContent = `
      @media (min-width: 1180px) {
        body.sky-chart-page > main.tarot-app-shell {
          width: min(96vw, 1500px) !important;
          max-width: 1500px !important;
        }
        #relphiSkyWorkspace.has-sky-b {
          grid-template-columns: minmax(260px, 310px) minmax(680px, 1fr) minmax(260px, 310px) !important;
          gap: 18px !important;
          width: 100% !important;
        }
        #relphiSkyWorkspace .relphi-workspace-center,
        #relphiSkyWorkspace .relphi-workspace-wheel-slot,
        #relphiSkyWorkspace .sky-output-box,
        #relphiSkyWorkspace .unified-sky-wheel {
          min-width: 0 !important;
          width: 100% !important;
          max-width: none !important;
        }
        #relphiSkyWorkspace .sky-output-box > *,
        #relphiSkyWorkspace .unified-sky-wheel > * {
          max-width: 100% !important;
        }
        #relphiSkyWorkspace .relphi-workspace-sky {
          min-width: 0 !important;
          overflow-wrap: anywhere;
        }
        #relphiSkyWorkspace .relphi-workspace-meta div {
          grid-template-columns: 58px minmax(0, 1fr) !important;
        }
      }
      @media (min-width: 1180px) and (max-width: 1360px) {
        #relphiSkyWorkspace.has-sky-b {
          grid-template-columns: minmax(230px, 270px) minmax(620px, 1fr) minmax(230px, 270px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
