// Makes the live House System subsection visually and structurally match the existing Houses filter list.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;

  function normalizedText(node) {
    return String(node && node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function housesContainer() {
    return Array.from(document.querySelectorAll('details,fieldset,.filter-group,.sky-filter-group,.chart-filter-group,.sky-filter-category')).find(function (node) {
      const heading = node.querySelector(':scope > summary,:scope > legend,:scope > button,:scope > .filter-heading,:scope > .sky-filter-heading');
      return normalizedText(heading).startsWith('houses');
    }) || null;
  }

  function setsHeading(container) {
    return Array.from(container.querySelectorAll('legend,h3,h4,h5,h6,strong,.filter-subheading,.sky-filter-subheading,.filter-section-title,.sky-filter-section-title')).find(function (node) {
      return normalizedText(node) === 'sets';
    }) || null;
  }

  function installStyles() {
    if (document.getElementById('relphi-house-system-filter-match-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-house-system-filter-match-style';
    style.textContent = `
      #relphiHouseSystemFilter{
        display:block!important;
        width:100%!important;
        max-width:none!important;
        margin:0 0 .9rem!important;
        padding:0 0 .9rem!important;
        border:0!important;
        border-bottom:1px solid rgba(17,17,17,.12)!important;
        text-align:left!important;
        font:inherit!important;
      }
      #relphiHouseSystemFilter legend{
        display:block!important;
        width:100%!important;
        margin:0 0 .55rem!important;
        padding:0!important;
        color:#6f6f6f!important;
        font:inherit!important;
        font-size:.78rem!important;
        font-weight:800!important;
        line-height:1.2!important;
        letter-spacing:.055em!important;
        text-align:left!important;
        text-transform:uppercase!important;
      }
      #relphiHouseSystemFilter .relphi-house-system-choices{
        display:flex!important;
        flex-direction:column!important;
        align-items:stretch!important;
        justify-content:flex-start!important;
        width:100%!important;
        margin:0!important;
        padding:0!important;
        gap:.42rem!important;
        text-align:left!important;
      }
      #relphiHouseSystemFilter .relphi-house-system-choices label{
        display:flex!important;
        flex-direction:row!important;
        align-items:center!important;
        justify-content:flex-start!important;
        width:100%!important;
        min-height:0!important;
        margin:0!important;
        padding:.08rem .25rem!important;
        gap:.48rem!important;
        color:#171717!important;
        font:inherit!important;
        font-size:.98rem!important;
        font-weight:700!important;
        line-height:1.35!important;
        text-align:left!important;
        cursor:pointer!important;
      }
      #relphiHouseSystemFilter .relphi-house-system-choices label span{
        display:inline!important;
        width:auto!important;
        margin:0!important;
        padding:0!important;
        text-align:left!important;
      }
      #relphiHouseSystemFilter input[type="radio"]{
        appearance:auto!important;
        -webkit-appearance:radio!important;
        display:inline-block!important;
        flex:0 0 auto!important;
        width:1.18rem!important;
        height:1.18rem!important;
        min-width:1.18rem!important;
        margin:0!important;
        padding:0!important;
        accent-color:#596a64!important;
        vertical-align:middle!important;
      }
      #relphiHouseSystemFilter .relphi-house-system-status{
        display:block!important;
        min-height:0!important;
        margin:.5rem 0 0!important;
        padding:0!important;
        font-size:.78rem!important;
        font-weight:600!important;
        line-height:1.35!important;
        text-align:left!important;
      }
    `;
    document.head.appendChild(style);
  }

  function placeAndNormalize() {
    queued = false;
    installStyles();
    const fieldset = document.getElementById('relphiHouseSystemFilter');
    const container = housesContainer();
    if (!fieldset || !container) return;

    const heading = setsHeading(container);
    if (heading) {
      const candidate = heading.closest('fieldset,.filter-subsection,.sky-filter-subsection,.filter-section,.sky-filter-section,section');
      const anchor = candidate && candidate !== container ? candidate : heading;
      if (fieldset.nextElementSibling !== anchor) anchor.parentNode.insertBefore(fieldset, anchor);
    } else {
      const panel = container.querySelector(':scope > div,:scope > section,:scope > .filter-panel,:scope > .filter-options,:scope > .sky-filter-options') || container;
      if (panel.firstElementChild !== fieldset) panel.insertBefore(fieldset, panel.firstElementChild);
    }

    fieldset.querySelectorAll('label').forEach(function (label) {
      label.removeAttribute('class');
      label.style.removeProperty('text-align');
      label.style.removeProperty('justify-content');
    });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(placeAndNormalize);
  }

  function start() {
    placeAndNormalize();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();