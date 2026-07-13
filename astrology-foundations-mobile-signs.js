// Compact zodiac-sign matrix for narrow phone displays.
(function () {
  'use strict';

  if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;
  if (document.getElementById('astrology-foundations-mobile-signs')) return;

  const style = document.createElement('style');
  style.id = 'astrology-foundations-mobile-signs';
  style.textContent = `
    @media (max-width: 560px) {
      /* Preserve the Cardinal / Fixed / Mutable structure without horizontal scrolling. */
      .foundation-matrix:not(.house-matrix) {
        min-width: 0 !important;
        width: 100%;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: .36rem;
      }

      .foundation-matrix:not(.house-matrix) .matrix-corner {
        display: none !important;
      }

      .foundation-matrix:not(.house-matrix) .matrix-head {
        min-width: 0;
        padding: .38rem .14rem;
        border-radius: .72rem;
        font-size: .7rem;
        line-height: 1.05;
        overflow-wrap: anywhere;
      }

      .foundation-matrix:not(.house-matrix) .matrix-row-label {
        grid-column: 1 / -1;
        min-width: 0;
        margin-top: .08rem;
        padding: .3rem .45rem;
        border: 0;
        border-radius: .65rem;
        box-shadow: none;
        background: rgba(17,17,17,.055);
        font-size: .76rem;
        line-height: 1;
        letter-spacing: .035em;
      }

      .foundation-matrix:not(.house-matrix) .flip-tile {
        min-width: 0;
        width: 100%;
        height: 4.35rem;
      }

      .foundation-matrix:not(.house-matrix) .flip-face {
        min-width: 0;
        padding: .28rem;
        border-radius: .72rem;
      }

      .foundation-matrix:not(.house-matrix) .front-glyph {
        font-size: clamp(1.85rem, 10vw, 2.35rem) !important;
        line-height: 1;
      }

      .foundation-matrix:not(.house-matrix) .flip-back {
        padding: .3rem;
        font-size: .66rem;
        line-height: 1.12;
        overflow-wrap: anywhere;
      }

      .element-filters {
        gap: .34rem;
        margin-bottom: .62rem;
      }

      .element-filters button {
        padding: .42rem .62rem;
        font-size: .8rem;
      }
    }

    @media (max-width: 350px) {
      .foundation-matrix:not(.house-matrix) {
        gap: .28rem;
      }
      .foundation-matrix:not(.house-matrix) .matrix-head {
        font-size: .64rem;
      }
      .foundation-matrix:not(.house-matrix) .flip-tile {
        height: 4rem;
      }
      .foundation-matrix:not(.house-matrix) .front-glyph {
        font-size: 1.8rem !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
