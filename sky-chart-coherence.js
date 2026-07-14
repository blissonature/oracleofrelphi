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
  function install() {
    document.querySelectorAll('[data-use-ph-settings][data-sky-entry-kind]').forEach(function (button) {
      button.addEventListener('click', function () { setTimeout(function () { showPhConfirmation(button.dataset.skyEntryKind || 'chart'); }, 0); });
    });
    document.addEventListener('click', function (event) {
      const button = event.target.closest && event.target.closest('[data-same-sky-mode]');
      if (button) try { localStorage.setItem('relphiSkySameSkyMode', button.dataset.sameSkyMode); } catch (error) {}
    });
    new MutationObserver(function () { scheduleEqualize(); restoreSameSkyMode(); }).observe(document.body, { childList:true, subtree:true });
    if (window.ResizeObserver) new ResizeObserver(scheduleEqualize).observe(document.body);
    matchMedia('(min-width: 641px)').addEventListener?.('change', scheduleEqualize);
    scheduleEqualize(); restoreSameSkyMode();
  }
  window.RelphiSkyCoherence = { equalizeComparisonCards, showPhConfirmation };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();
