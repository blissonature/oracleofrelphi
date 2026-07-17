// Preview-only repair for Sky A identity, false saved-sky errors, and missing navigation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const A_KEY = 'relphiTarotChart';
  const B_KEY = 'relphiCurrentSky';

  function byId(id) { return document.getElementById(id); }
  function readJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function removeKey(key) { try { localStorage.removeItem(key); } catch (_) {} }
  function placements(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) &&
        (String(item.sign || '').trim() || (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree))));
    }));
  }
  function signature(payload) {
    return Object.entries(placements(payload)).sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (entry) {
      const item = entry[1] || {};
      return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
    }).join('|');
  }
  function records() {
    const list = readJson(LIBRARY_KEY, []);
    return Array.isArray(list) ? list.filter(function (record) { return record && signature(record); }) : [];
  }
  function matchingRecord(payload) {
    const sig = signature(payload);
    if (!sig) return null;
    const matches = records().filter(function (record) { return signature(record) === sig; });
    return matches.find(function (record) { return String(record.name || '').trim().toLowerCase() === 'marisa'; }) || matches[0] || null;
  }
  function setVisibleName(name) {
    const chart = byId('chartOutput');
    if (chart) chart.dataset.skyName = name;
    document.querySelectorAll('#relphiV3Complete [data-kind="chart"] h3, #relphiSkyCompleteStage [data-kind="chart"] h3').forEach(function (node) {
      node.textContent = name;
    });
    const completeHeading = byId('relphiSkyCompleteHeading');
    if (completeHeading && /is now Sky A$/i.test(completeHeading.textContent || '')) completeHeading.textContent = name + ' is now Sky A';
    const labels = Array.from(document.querySelectorAll('.sky-chart-legend, .wheel-legend, [data-sky-legend], #chartOutput [class*="legend"]'));
    labels.forEach(function (node) {
      const text = String(node.textContent || '').trim();
      if (/^Untitled Sky\b/i.test(text) || /^Sky A$/i.test(text)) node.textContent = name;
    });
  }
  function repairIdentity() {
    const a = readJson(A_KEY, null);
    if (!signature(a)) return;
    const match = matchingRecord(a);
    if (!match?.name) return;
    if (String(a.name || '').trim() !== String(match.name).trim()) {
      writeJson(A_KEY, { ...a, name:match.name });
    }
    setVisibleName(match.name);

    const b = readJson(B_KEY, null);
    if (signature(b) && signature(b) === signature(a)) {
      removeKey(B_KEY);
      delete document.body.dataset.relphiSkyBReady;
      const current = byId('currentSkyOutput');
      if (current) {
        current.innerHTML = '';
        current.hidden = true;
        current.setAttribute('hidden', '');
      }
    }

    [byId('relphiV3NameStatus'), byId('relphiSkyNameError'), byId('relphiV3CalcStatus'), byId('relphiV3NativeRenderStatus')].forEach(function (node) {
      if (!node) return;
      if (/saved sky (?:is )?unavailable|could not be loaded|could not restore both skies|rendering stopped: timed out/i.test(node.textContent || '')) {
        node.textContent = match.name + ' is loaded as Sky A.';
      }
    });
    window.RelphiSkyWizardV3?.renderComplete?.();
  }
  function ensureStartOver() {
    if (byId('relphiStartOver')) return;
    const wizard = byId('relphiSkyWizard');
    if (!wizard) return;
    const row = document.createElement('div');
    row.className = 'relphi-start-over-row';
    row.innerHTML = '<button id="relphiStartOver" class="back" type="button">Start Over</button>';
    wizard.insertBefore(row, wizard.firstChild);
    byId('relphiStartOver').addEventListener('click', function () {
      if (!window.confirm('Start over? This clears Sky A and Sky B from the current workspace. Your saved skies will not be deleted.')) return;
      removeKey(A_KEY);
      removeKey(B_KEY);
      try { sessionStorage.removeItem('relphiWizardV3SkyA'); sessionStorage.removeItem('relphiWizardV3Resume'); } catch (_) {}
      const url = new URL(location.href);
      url.searchParams.set('reset', String(Date.now()));
      location.replace(url.toString());
    });
  }
  function comparisonNameStage() {
    const eyebrow = String(byId('relphiV3NameEyebrow')?.textContent || byId('relphiSkyNameEyebrow')?.textContent || '').toLowerCase();
    return eyebrow.includes('comparison');
  }
  function ensureBack() {
    if (!comparisonNameStage()) return;
    const nameStage = byId('relphiV3Name') || byId('relphiSkyNameStage');
    if (!nameStage || byId('relphiBackFromComparisonName')) return;
    const button = document.createElement('button');
    button.id = 'relphiBackFromComparisonName';
    button.type = 'button';
    button.className = 'back';
    button.textContent = 'Back';
    nameStage.appendChild(button);
    button.addEventListener('click', function () {
      delete document.body.dataset.relphiPendingSkyKind;
      window.RelphiSkyWizardV3?.renderComplete?.();
      const complete = byId('relphiV3Complete') || byId('relphiSkyCompleteStage');
      if (complete) complete.hidden = false;
      nameStage.hidden = true;
    });
  }
  function installStyles() {
    if (byId('relphiPr55IdentityStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiPr55IdentityStyles';
    style.textContent = '.relphi-start-over-row{display:flex;justify-content:flex-end;margin:0 0 1rem}.relphi-start-over-row button,#relphiBackFromComparisonName{appearance:none;border:1px solid rgba(220,31,24,.42);border-radius:999px;background:#fff;color:#111;font:inherit;font-weight:700;padding:.75rem 1.25rem;min-height:44px}';
    document.head.appendChild(style);
  }
  function install() {
    installStyles();
    [0, 300, 900, 1800, 3500].forEach(function (delay) {
      setTimeout(function () { repairIdentity(); ensureStartOver(); ensureBack(); }, delay);
    });
    document.addEventListener('click', function () { setTimeout(function () { repairIdentity(); ensureStartOver(); ensureBack(); }, 0); }, true);
    new MutationObserver(function () { repairIdentity(); ensureStartOver(); ensureBack(); }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
