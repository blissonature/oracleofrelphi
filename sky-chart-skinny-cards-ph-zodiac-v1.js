// Replaces the clipped heptagram crop with the compact Planetary Hours mini-zodiac treatment.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;

  function prepare(card) {
    const seal = card.querySelector('.relphi-skinny-seal');
    if (seal) seal.remove();

    const solo = card.querySelector('.relphi-skinny-solo');
    const svg = solo && solo.querySelector('svg');
    if (!solo || !svg) return;

    solo.classList.add('ph-current-wheel-card', 'relphi-skinny-ph-zodiac');
    svg.classList.add('ph-current-wheel');
    svg.setAttribute('aria-label', (card.querySelector('.relphi-skinny-head h2')?.textContent || 'Sky') + ' mini zodiac');

    const circles = Array.from(svg.querySelectorAll(':scope > circle'));
    circles.forEach(function (circle, index) {
      circle.classList.add(index === 0 ? 'wheel-core' : 'wheel-inner');
    });

    Array.from(svg.querySelectorAll(':scope > line')).forEach(function (line, index) {
      line.classList.add(index < 12 ? 'sign-tick' : 'house-cusp');
    });

    svg.querySelectorAll('g[data-glyph-id]').forEach(function (host) {
      host.classList.add('planet-marker');
      const leader = host.previousElementSibling;
      if (leader && leader.tagName && leader.tagName.toLowerCase() === 'line') leader.classList.add('planet-stick');
      host.querySelector('.relphi-canonical-glyph')?.classList.add('planet-label');
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll('#relphiSkyWorkspace .relphi-skinny-sky-card').forEach(prepare);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function styles() {
    if (document.getElementById('relphi-skinny-ph-zodiac-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-ph-zodiac-style';
    style.textContent = `
      #relphiSkyWorkspace .relphi-skinny-seal{display:none!important}
      #relphiSkyWorkspace .relphi-skinny-ph-zodiac{
        display:block!important;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        padding:.28rem .22rem .34rem!important;
        border:0!important;
        border-radius:0!important;
        background:#fff!important;
        box-shadow:none!important;
        transform:none!important;
      }
      #relphiSkyWorkspace .relphi-skinny-ph-zodiac .ph-current-wheel{
        display:block!important;
        width:min(138px,92%)!important;
        height:auto!important;
        margin:0 auto!important;
        overflow:visible!important;
      }
      #relphiSkyWorkspace .ph-current-wheel .wheel-core{fill:#fffaf7!important;stroke:#c4c1bc!important;stroke-width:1.25!important}
      #relphiSkyWorkspace .ph-current-wheel .wheel-inner{fill:none!important;stroke:#c4c1bc!important;stroke-width:.72!important;opacity:.72!important}
      #relphiSkyWorkspace .ph-current-wheel .sign-tick{stroke:#6f6b66!important;stroke-width:.55!important;opacity:.42!important}
      #relphiSkyWorkspace .ph-current-wheel .house-cusp{stroke:#77736e!important;stroke-width:.62!important;opacity:.24!important}
      #relphiSkyWorkspace .ph-current-wheel .planet-stick{stroke:#222!important;stroke-width:.9!important;opacity:.72!important}
      #relphiSkyWorkspace .ph-current-wheel .planet-label{color:var(--panel-accent)!important}
      #relphiSkyWorkspace .ph-current-wheel .planet-marker{color:var(--panel-accent)!important}
      @media(min-width:1180px){
        #relphiSkyWorkspace.has-sky-b{grid-template-columns:minmax(152px,174px) minmax(820px,1fr) minmax(152px,174px)!important;gap:10px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    styles();
    run();
    new MutationObserver(queue).observe(document.body, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();