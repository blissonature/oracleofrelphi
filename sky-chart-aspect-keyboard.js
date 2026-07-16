// Preserves keyboard accessibility for interactive aspect and relationship rows.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function enhance() {
    document.querySelectorAll('[data-aspect], [data-relationship], .aspect-row, .relationship-row, .aspect-line, .relationship-line').forEach(function (element) {
      if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
      if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target.closest?.('[data-aspect], [data-relationship], .aspect-row, .relationship-row, .aspect-line, .relationship-line');
    if (!item) return;
    event.preventDefault();
    item.click();
  });

  enhance();
  new MutationObserver(enhance).observe(document.body, { childList:true, subtree:true });
})();
