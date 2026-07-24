// Restores Tarot Ledger date -> sky creation without sharing SkyChart's A/B storage.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  function loadDrawingBoardExportPreserver() {
    if (document.querySelector('script[src^="drawing-board-export-preserver-v1.js"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = 'drawing-board-export-preserver-v1.js?v=1';
    document.body.appendChild(script);
  }

  loadDrawingBoardExportPreserver();

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function setValue(id, value) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    fire(field, 'input');
    fire(field, 'change');
  }
  function whereWhen() {
    try {
      const packet = JSON.parse(localStorage.getItem('relphiPlanetaryHoursWhereWhen') || 'null') || {};
      return {
        latitude:String(packet.lat || packet.latitude || byId('skyCalcLatitude')?.value || ''),
        longitude:String(packet.lon || packet.longitude || byId('skyCalcLongitude')?.value || ''),
        timeZone:String(packet.tz || packet.timeZone || byId('skyCalcTimeZone')?.value || ''),
        location:String(packet.loc || packet.location || byId('skyCalcLocation')?.value || '')
      };
    } catch (_) {
      return { latitude:byId('skyCalcLatitude')?.value || '', longitude:byId('skyCalcLongitude')?.value || '', timeZone:byId('skyCalcTimeZone')?.value || '', location:byId('skyCalcLocation')?.value || '' };
    }
  }
  function skyUrl(date, packet, autoRun) {
    const params = new URLSearchParams({
      preview:'pr55',
      source:'tarot-date',
      datetime:date + 'T12:00',
      lat:packet.latitude,
      lon:packet.longitude,
      tz:packet.timeZone,
      loc:packet.location,
      calc:autoRun ? '1' : '0',
      name:'Tarot date ' + date
    });
    return 'sky-chart.html?' + params.toString() + '#sky-calc';
  }
  function addBridgeNote(date, packet, calculating) {
    const output = byId('dateOutput');
    if (!output) return;
    output.querySelector('.tarot-date-sky-bridge')?.remove();
    const note = document.createElement('section');
    note.className = 'tarot-date-sky-bridge generated-note';
    const place = packet.location || (packet.latitude && packet.longitude ? packet.latitude + ', ' + packet.longitude : 'a place you choose');
    note.innerHTML = '<strong>' + (calculating ? 'Creating the date sky at local noon.' : 'This date needs a location before a full sky can be calculated.') + '</strong> ' + (calculating ? 'Using ' + place + ' and ' + (packet.timeZone || 'the saved time zone') + '. ' : '') + '<a href="' + skyUrl(date, packet, calculating) + '">Open this date in SkyChart</a>';
    output.appendChild(note);
  }
  function createDateSky() {
    const date = byId('dateInput')?.value || '';
    if (!/^\d{4}-\d\d-\d\d$/.test(date)) return;
    const packet = whereWhen();
    const canCalculate = !!packet.latitude && !!packet.longitude;
    addBridgeNote(date, packet, canCalculate);
    if (!canCalculate || !byId('skyCalcRun')) return;

    setValue('skyCalcTarget', 'chart');
    setValue('skyCreatorTarget', 'chart');
    setValue('skyCalcDateTime', date + 'T12:00');
    setValue('skyCalcLatitude', packet.latitude);
    setValue('skyCalcLongitude', packet.longitude);
    setValue('skyCalcTimeZone', packet.timeZone);
    setValue('skyCalcLocation', packet.location);
    setValue('skyCalcName', 'Tarot date ' + date);
    byId('skyCalcRun').click();

    const started = Date.now();
    (function wait() {
      const text = byId('skyCalcStatus')?.textContent.trim() || '';
      if (/^Calculated\b/i.test(text)) {
        byId('saveChart')?.click();
        const note = document.querySelector('.tarot-date-sky-bridge strong');
        if (note) note.textContent = 'Date sky created in the Tarot Ledger at local noon.';
        return;
      }
      if (Date.now() - started < 30000 && !/^(Could not|Enter |Choose )/i.test(text)) setTimeout(wait, 120);
    })();
  }
  function start() {
    const button = byId('readDate');
    if (!button || button.dataset.dateSkyBridge) return;
    button.dataset.dateSkyBridge = 'true';
    button.addEventListener('click', function () { setTimeout(createDateSky, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();