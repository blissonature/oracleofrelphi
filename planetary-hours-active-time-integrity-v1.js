// Planetary Hours active-time integrity guard.
// The active instant is authoritative. Live/system mode always displays real current time;
// manual mode displays the selected wall time. Only an explicit hour preview may synthesize time.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname) || window.__relphiPlanetaryHoursActiveTimeIntegrityV2) return;
  window.__relphiPlanetaryHoursActiveTimeIntegrityV2 = true;

  function zone() {
    return document.getElementById('tzSelect')?.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
  function useSystem() { return document.getElementById('useSystem')?.checked !== false; }
  function is24Hour() { return document.getElementById('timeFormatToggle')?.textContent?.trim() === '24h'; }
  function explicitHourPreview() {
    const label = document.getElementById('heptagramHourLabel')?.textContent?.trim() || '';
    return /^Previewing\b/i.test(label);
  }

  function activeInstant() {
    if (useSystem()) return new Date();
    const date = document.getElementById('datePick')?.value;
    const time = document.getElementById('timePick')?.value;
    if (!date || !time) return null;
    if (window.luxon?.DateTime) {
      const dt = window.luxon.DateTime.fromISO(`${date}T${time}`, { zone:zone() });
      if (dt.isValid) return dt.toJSDate();
    }
    const fallback = new Date(`${date}T${time}:00`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
      timeZone:zone(), hour:is24Hour() ? '2-digit' : 'numeric', minute:'2-digit', hour12:!is24Hour()
    });
  }

  function correct() {
    if (explicitHourPreview()) return;
    const instant = activeInstant(); if (!instant) return;
    const panel = document.getElementById('panelCurrentTime');
    if (panel) panel.textContent = formatTime(instant);
  }
  function start() {
    correct();
    ['click','change','input'].forEach(name => document.addEventListener(name,()=>requestAnimationFrame(correct),true));
    setInterval(correct,1000);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
