(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  let queued = false;

  function equalizeComparisonCards() {
    const desktop = matchMedia('(min-width: 641px)').matches;
    document.querySelectorAll('.relationship-reading-pair').forEach(function (pair) {
      const cards = Array.from(pair.querySelectorAll(':scope > .relationship-placement-card'));
      cards.forEach(function (card) { card.style.minHeight = ''; });
      if (!desktop || cards.length !== 2) return;
      const height = Math.max.apply(null, cards.map(function (card) { return card.scrollHeight; }));
      cards.forEach(function (card) { card.style.minHeight = height + 'px'; });
      pair.dataset.equalizedCardHeight = String(height);
    });
  }
  function scheduleEqualize() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; equalizeComparisonCards(); });
  }
  function restoreSameSkyMode() {
    let saved = '';
    try { saved = localStorage.getItem('relphiSkySameSkyMode') || ''; } catch (error) {}
    if (!['include','exclude','separate'].includes(saved)) return;
    const button = document.querySelector('[data-same-sky-mode="' + saved + '"]');
    if (button && button.getAttribute('aria-pressed') !== 'true') button.click();
  }
  function phText() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem('relphiPlanetaryHoursWhereWhen') || 'null'); } catch (error) {}
    if (!data) data = window.RelphiLocation && window.RelphiLocation.read && window.RelphiLocation.read();
    if (!data || !data.datetime || data.lat == null || data.lon == null || !data.tz) return '';
    return [data.datetime.replace('T', ' '), data.loc || (Number(data.lat).toFixed(4) + ', ' + Number(data.lon).toFixed(4)), data.tz, data.houseSystem || 'Whole Sign'].filter(Boolean).join(' · ');
  }
  function showPhConfirmation(target) {
    const box = document.querySelector('[data-ph-confirmation="' + target + '"]');
    if (!box) return;
    const text = phText();
    box.hidden = !text;
    box.textContent = text ? ('Imported Planetary Hours moment: ' + text) : 'No complete Planetary Hours moment is saved yet.';
  }
  function injectRelationshipColorStyles() {
    if (document.getElementById('relphi-relationship-color-hints')) return;
    const style = document.createElement('style');
    style.id = 'relphi-relationship-color-hints';
    style.textContent = `
body.sky-chart-page .relationship-list-row,
body.sky-chart-page .chart-wheel-aspect-key > span { --relationship-aspect-color: #6b625d; }
body.sky-chart-page .relationship-list-row.aspect-conjunction,
body.sky-chart-page .chart-wheel-aspect-key .key-conjunction { --relationship-aspect-color: #111; }
body.sky-chart-page .relationship-list-row.aspect-opposition,
body.sky-chart-page .chart-wheel-aspect-key .key-opposition { --relationship-aspect-color: #7b1fa2; }
body.sky-chart-page .relationship-list-row.aspect-trine,
body.sky-chart-page .chart-wheel-aspect-key .key-trine { --relationship-aspect-color: #1e88e5; }
body.sky-chart-page .relationship-list-row.aspect-square,
body.sky-chart-page .relationship-list-row.aspect-semi-square,
body.sky-chart-page .relationship-list-row.aspect-semisquare,
body.sky-chart-page .relationship-list-row.aspect-octile,
body.sky-chart-page .relationship-list-row.aspect-sesquiquadrate,
body.sky-chart-page .relationship-list-row.aspect-tri-octile,
body.sky-chart-page .chart-wheel-aspect-key .key-square { --relationship-aspect-color: #dc1f18; }
body.sky-chart-page .relationship-list-row.aspect-sextile,
body.sky-chart-page .relationship-list-row.aspect-semi-sextile,
body.sky-chart-page .relationship-list-row.aspect-semisextile,
body.sky-chart-page .chart-wheel-aspect-key .key-sextile { --relationship-aspect-color: #2e7d32; }
body.sky-chart-page .relationship-list-row.aspect-quincunx,
body.sky-chart-page .relationship-list-row.aspect-inconjunct,
body.sky-chart-page .chart-wheel-aspect-key .key-quincunx { --relationship-aspect-color: #d97706; }
body.sky-chart-page .relationship-list-row.aspect-quintile,
body.sky-chart-page .relationship-list-row.aspect-biquintile,
body.sky-chart-page .relationship-list-row.aspect-decile,
body.sky-chart-page .relationship-list-row.aspect-tridecile { --relationship-aspect-color: #b7791f; }
body.sky-chart-page .relationship-list-row.aspect-novile,
body.sky-chart-page .relationship-list-row.aspect-binovile,
body.sky-chart-page .relationship-list-row.aspect-septile,
body.sky-chart-page .relationship-list-row.aspect-biseptile,
body.sky-chart-page .relationship-list-row.aspect-triseptile,
body.sky-chart-page .relationship-list-row.aspect-undecile { --relationship-aspect-color: #6d4c9f; }
body.sky-chart-page .relationship-line-sample {
  display: inline-block;
  flex: 0 0 1.8rem;
  width: 1.8rem;
  height: .42rem;
  overflow: visible;
  vertical-align: middle;
}
body.sky-chart-page .relationship-line-sample line {
  stroke: var(--relationship-aspect-color, #6b625d) !important;
  stroke-width: 3 !important;
  stroke-linecap: round;
  opacity: .96;
  vector-effect: non-scaling-stroke;
}
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-conjunction { stroke-dasharray: 3 3; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-opposition { stroke-dasharray: none; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-trine { stroke-dasharray: 8 3; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-square,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semi-square,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semisquare,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-octile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-sesquiquadrate,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-tri-octile { stroke-dasharray: 2 2; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-sextile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semi-sextile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-semisextile { stroke-dasharray: 6 2; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-quincunx,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-inconjunct { stroke-dasharray: 8 3 2 3; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-quintile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-biquintile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-decile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-tridecile { stroke-dasharray: 5 2 1 2; }
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-novile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-binovile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-septile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-biseptile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-triseptile,
body.sky-chart-page .relationship-line-sample .chart-wheel-aspect-undecile { stroke-dasharray: 1 2; }
body.sky-chart-page .chart-wheel-aspect-key > span {
  color: #332d29 !important;
  gap: .32rem;
}
body.sky-chart-page .chart-wheel-aspect-key .relationship-line-sample {
  flex-basis: 1.45rem;
  width: 1.45rem;
}
body.sky-chart-page .relationship-list-row .relationship-line-sample {
  margin-right: .08rem;
}
`;
    document.head.appendChild(style);
  }
  function aspectClassFrom(element, prefix) {
    const found = Array.from(element.classList || []).find(function (name) { return name.indexOf(prefix) === 0; });
    return found ? found.slice(prefix.length) : '';
  }
  function createLineSample(aspect) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'relationship-line-sample');
    svg.setAttribute('viewBox', '0 0 32 6');
    svg.setAttribute('aria-hidden', 'true');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-wheel-aspect-' + aspect);
    line.setAttribute('x1', '1');
    line.setAttribute('y1', '3');
    line.setAttribute('x2', '31');
    line.setAttribute('y2', '3');
    svg.appendChild(line);
    return svg;
  }
  function enhanceRelationshipColorHints() {
    injectRelationshipColorStyles();
    document.querySelectorAll('.relationship-list-row').forEach(function (row) {
      const aspect = aspectClassFrom(row, 'aspect-');
      const points = row.querySelector('.relationship-list-points');
      if (!aspect || !points || points.querySelector('.relationship-line-sample')) return;
      points.prepend(createLineSample(aspect));
    });
    document.querySelectorAll('.chart-wheel-aspect-key > span').forEach(function (item) {
      const aspect = aspectClassFrom(item, 'key-');
      if (!aspect || item.querySelector('.relationship-line-sample')) return;
      item.prepend(createLineSample(aspect));
    });
  }
  function install() {
    document.querySelectorAll('[data-use-ph-settings][data-sky-entry-kind]').forEach(function (button) {
      button.addEventListener('click', function () { setTimeout(function () { showPhConfirmation(button.dataset.skyEntryKind || 'chart'); }, 0); });
    });
    document.addEventListener('click', function (event) {
      const button = event.target.closest && event.target.closest('[data-same-sky-mode]');
      if (button) try { localStorage.setItem('relphiSkySameSkyMode', button.dataset.sameSkyMode); } catch (error) {}
    });
    new MutationObserver(function () {
      scheduleEqualize();
      restoreSameSkyMode();
      enhanceRelationshipColorHints();
    }).observe(document.body, { childList:true, subtree:true });
    if (window.ResizeObserver) new ResizeObserver(scheduleEqualize).observe(document.body);
    matchMedia('(min-width: 641px)').addEventListener?.('change', scheduleEqualize);
    scheduleEqualize(); restoreSameSkyMode(); enhanceRelationshipColorHints();
  }
  window.RelphiSkyCoherence = { equalizeComparisonCards, showPhConfirmation, enhanceRelationshipColorHints };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();
