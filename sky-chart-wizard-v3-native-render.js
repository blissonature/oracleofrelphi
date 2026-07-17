// Rebuilds both visible sky outputs through the one renderer the legacy engine reliably supports.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  let repairing = false;
  let repairedSignature = '';

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function readJson(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      return String(item.sign || '').trim() || (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree)));
    }));
  }
  function hasPlacements(payload) { return Object.keys(placementEntries(payload)).length > 0; }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,180}\d{1,2}°/i.test(node?.textContent || '');
  }
  function signature(payload) {
    return Object.entries(placementEntries(payload)).sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (entry) {
      const item = entry[1] || {};
      return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
    }).join('|');
  }
  function setValue(id, value) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    fire(field, 'input');
    fire(field, 'change');
  }
  function setPrimaryTarget() {
    setValue('skyCreatorTarget', 'chart');
    setValue('skyCalcTarget', 'chart');
  }
  function placementText(payload) {
    return Object.entries(placementEntries(payload)).map(function (entry) {
      const name = entry[0];
      const item = entry[1] || {};
      const degree = Number.isFinite(Number(item.degree)) ? Number(item.degree) : 0;
      const minute = Number.isFinite(Number(item.minute)) ? String(Number(item.minute)).padStart(2, '0') : '00';
      const house = item.house !== '' && item.house != null && Number.isFinite(Number(item.house)) ? ', in ' + Number(item.house) + ' House' : '';
      const retrograde = item.retrograde ? ', Retrograde' : '';
      return name + ',' + String(item.sign || '') + ',' + degree + '°' + minute + "'" + house + retrograde;
    }).join('\n');
  }
  function findCommitButton() {
    const direct = document.querySelector('.sky-paste-create-button, [data-create-sky], [data-confirm-sky]');
    if (direct) return direct;
    const scope = byId('skyCreatorDrawer') || document;
    return Array.from(scope.querySelectorAll('button')).find(function (button) {
      const text = String(button.textContent || '').trim();
      return /(?:create|build|apply|use)\s+(?:sky\s+from\s+)?(?:entered\s+)?placements|create\s+sky/i.test(text) && !/save|export|delete|clear|calculate/i.test(text);
    }) || null;
  }
  function waitUntil(test, timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      (function check() {
        try { const value = test(); if (value) return resolve(value); } catch (_) {}
        if (Date.now() - started > timeout) return reject(new Error('Timed out'));
        setTimeout(check, 100);
      })();
    });
  }
  function preserveSlots(a, b) {
    writeJson(SLOT_KEYS.chart, a);
    writeJson(SLOT_KEYS.currentSky, b);
  }
  function renderInPrimary(payload, a, b) {
    const chart = byId('chartOutput');
    const commit = findCommitButton();
    const text = placementText(payload);
    if (!chart || !commit || !text) return Promise.reject(new Error('Primary renderer is unavailable'));

    const expected = signature(payload);
    setPrimaryTarget();
    setValue('skyCreatorName', payload.name || 'Sky');
    setValue('skyCalcName', payload.name || 'Sky');
    setValue('skyCreatorNotes', payload.notes || '');
    setValue('skyCreatorPaste', text);
    chart.innerHTML = '';
    commit.click();

    return waitUntil(function () {
      const renderedPayload = readJson(SLOT_KEYS.chart);
      return outputHasPlacements(chart) && signature(renderedPayload) === expected;
    }, 10000).then(function () {
      const html = chart.innerHTML;
      preserveSlots(a, b);
      return html;
    });
  }
  function activateComparison() {
    const button = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    button?.click();
    const current = byId('currentSkyOutput');
    if (current) {
      current.hidden = false;
      current.removeAttribute('hidden');
    }
    window.dispatchEvent(new Event('resize'));
  }
  function status(message) {
    const complete = byId('relphiV3Complete');
    if (!complete) return;
    let note = byId('relphiV3NativeRenderStatus');
    if (!note) {
      note = document.createElement('p');
      note.id = 'relphiV3NativeRenderStatus';
      note.className = 'generated-note';
      note.setAttribute('aria-live', 'polite');
      complete.appendChild(note);
    }
    note.textContent = message;
  }
  function needsRepair(a, b) {
    if (!hasPlacements(a) || !hasPlacements(b)) return false;
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    return !outputHasPlacements(chart) || !outputHasPlacements(current) ||
      String(chart?.dataset.skyName || '').trim().toLowerCase() !== String(a.name || '').trim().toLowerCase() ||
      String(current?.dataset.skyName || '').trim().toLowerCase() !== String(b.name || '').trim().toLowerCase();
  }
  function repair() {
    if (repairing) return;
    const a = readJson(SLOT_KEYS.chart);
    const b = readJson(SLOT_KEYS.currentSky);
    if (!needsRepair(a, b)) return;
    const pairSignature = signature(a) + '||' + signature(b);
    if (!pairSignature.replace(/\|/g, '') || pairSignature === repairedSignature) return;
    if (!findCommitButton()) return;

    repairing = true;
    status('Rendering Sky B, then restoring Sky A…');
    let skyBHtml = '';

    renderInPrimary(b, a, b).then(function (html) {
      skyBHtml = html;
      return renderInPrimary(a, a, b);
    }).then(function () {
      const chart = byId('chartOutput');
      const current = byId('currentSkyOutput');
      if (!chart || !current || !skyBHtml) throw new Error('Sky B output was not captured');

      current.innerHTML = skyBHtml;
      current.dataset.skyName = b.name || 'Sky B';
      current.hidden = false;
      current.removeAttribute('hidden');
      chart.dataset.skyName = a.name || 'Sky A';
      preserveSlots(a, b);
      activateComparison();

      return waitUntil(function () {
        return outputHasPlacements(chart) && outputHasPlacements(current);
      }, 3000);
    }).then(function () {
      repairedSignature = pairSignature;
      document.body.dataset.relphiSkyBReady = 'true';
      status('Sky A and Sky B are shown together on the wheel.');
      window.RelphiSkyWizardV3?.renderComplete?.();
      window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', { detail:{ skyA:a.name, skyB:b.name } }));
    }).catch(function (error) {
      preserveSlots(a, b);
      status('The two sky records remain preserved, but rendering stopped: ' + error.message + '.');
    }).finally(function () { repairing = false; });
  }
  function install() {
    try { sessionStorage.removeItem('relphiWizardV3Resume'); } catch (_) {}
    const started = Date.now();
    (function waitForRenderer() {
      if (findCommitButton() && byId('chartOutput') && byId('currentSkyOutput')) {
        repair();
        [500, 1200, 2500, 5000].forEach(function (delay) { setTimeout(repair, delay); });
        return;
      }
      if (Date.now() - started < 8000) setTimeout(waitForRenderer, 100);
    })();
    window.addEventListener('relphi:sky-b-ready', function () { setTimeout(repair, 50); });
  }

  window.RelphiV3NativeRender = { repair:repair };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
