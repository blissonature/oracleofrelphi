// Keeps Sky Chart provenance factual: Planetary Hours is named only when explicitly supplied.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function cleanFalseDefault() {
    const params = new URLSearchParams(location.search);
    if (params.has('name')) return;
    const input = document.getElementById('skyCalcName');
    if (input && input.value.trim() === 'Planetary Hours date') {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles:true }));
      input.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }

  cleanFalseDefault();
  document.addEventListener('DOMContentLoaded', cleanFalseDefault, { once:true });
  window.addEventListener('load', cleanFalseDefault, { once:true });
  setTimeout(cleanFalseDefault, 400);
})();
