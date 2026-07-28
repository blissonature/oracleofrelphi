// Gives the desktop comparison wheel enough central width and keeps side cards legible.
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
          grid-template-columns: minmax(280px, 320px) minmax(680px, 1fr) minmax(280px, 320px) !important;
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
          overflow-wrap: normal !important;
          word-break: normal !important;
        }
        #relphiSkyWorkspace .relphi-workspace-summary {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 0 !important;
          padding: 0 14px 10px !important;
        }
        #relphiSkyWorkspace .relphi-workspace-summary-copy {
          min-width: 0 !important;
        }
        #relphiSkyWorkspace .relphi-workspace-summary .relphi-workspace-title-row {
          display: flex !important;
          flex-direction: row !important;
          align-items: flex-start !important;
          padding: 14px 2px 8px !important;
        }
        #relphiSkyWorkspace .relphi-workspace-title-row h2,
        #relphiSkyWorkspace .relphi-workspace-meta dd,
        #relphiSkyWorkspace .relphi-workspace-placement span {
          overflow-wrap: normal !important;
          word-break: normal !important;
        }
        #relphiSkyWorkspace .relphi-workspace-title-row h2 {
          min-width: 0 !important;
          line-height: 1.15 !important;
        }
        #relphiSkyWorkspace .relphi-workspace-meta {
          padding: 0 2px 8px !important;
        }
        #relphiSkyWorkspace .relphi-workspace-meta div {
          grid-template-columns: 68px minmax(0, 1fr) !important;
          align-items: start !important;
        }
        #relphiSkyWorkspace .relphi-workspace-meta dd {
          min-width: 0 !important;
          white-space: normal !important;
        }
        #relphiSkyWorkspace .relphi-ph-portal {
          grid-column: 1 !important;
          width: min(154px, 72%) !important;
          max-width: 154px !important;
          justify-self: center !important;
          margin: 2px auto 4px !important;
        }
        #relphiSkyWorkspace .relphi-workspace-placement {
          grid-template-columns: 20px minmax(88px, 1.15fr) 52px minmax(72px, .9fr) 28px !important;
          font-size: .86rem !important;
        }
      }
      @media (min-width: 1180px) and (max-width: 1360px) {
        #relphiSkyWorkspace.has-sky-b {
          grid-template-columns: minmax(260px, 290px) minmax(620px, 1fr) minmax(260px, 290px) !important;
        }
        #relphiSkyWorkspace .relphi-ph-portal {
          width: 138px !important;
          max-width: 138px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();