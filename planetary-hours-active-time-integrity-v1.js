// Planetary Hours active-time integrity guard.
// The active instant is authoritative. Live/system mode always displays real current time;
// manual mode displays the selected wall time. Only an explicit hour preview may synthesize time.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname) || window.__relphiPlanetaryHoursActiveTimeIntegrityV2) return;
  window.__relphiPlanetaryHoursActiveTimeIntegrityV2 = true;

  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const NS = 'http://www.w3.org/2000/svg';

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
  function localDateKey(date) {
    if (window.luxon?.DateTime) return window.luxon.DateTime.fromJSDate(date).setZone(zone()).toFormat('yyyy-MM-dd');
    return new Intl.DateTimeFormat('en-CA', {timeZone:zone(),year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  }
  function parseWallTime(text, dateKey) {
    if (!window.luxon?.DateTime) return null;
    const format = /\b(?:AM|PM)\b/i.test(text) ? 'yyyy-MM-dd h:mm a' : 'yyyy-MM-dd HH:mm';
    const dt = window.luxon.DateTime.fromFormat(`${dateKey} ${text.trim()}`, format, {zone:zone(), locale:'en-US'});
    return dt.isValid ? dt.toJSDate() : null;
  }
  function hour24Fraction(now) {
    const label = document.getElementById('heptagramHourLabel')?.textContent || '';
    const match = label.match(/hour\s+24\s+of\s+24.*?·\s*([^·–]+(?:AM|PM|\d))\s*[–-]\s*([^·]+?)(?=\s*·|$)/i);
    if (!match) return null;
    const dateKey = localDateKey(now);
    let start = parseWallTime(match[1], dateKey), end = parseWallTime(match[2], dateKey);
    if (!start || !end) return null;
    if (end <= start) end = new Date(end.getTime() + 86400000);
    if (now < start) start = new Date(start.getTime() - 86400000);
    const span = end.getTime() - start.getTime();
    return span > 0 ? Math.max(0, Math.min(.999, (now.getTime() - start.getTime()) / span)) : null;
  }
  function correct() {
    // A synthetic slider time is permitted only while explicitly previewing an hour.
    if (explicitHourPreview()) return;
    const instant = activeInstant(); if (!instant) return;
    const panel = document.getElementById('panelCurrentTime');
    if (panel) panel.textContent = formatTime(instant);
  }
  function start() {
    correct();
    ['click','change','input'].forEach(name => document.addEventListener(name,()=>requestAnimationFrame(correct),true));
    // Keep the living clock authoritative even if the legacy renderer rebuilds underneath it each minute.
    setInterval(correct,1000);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
