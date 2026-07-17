// Preview-only state bridge and compact completed workspace.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const item = entry[1];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const degree = item.degree;
      return String(item.sign || '').trim() || (degree !== '' && degree !== null && Number.isFinite(Number(degree)));
    }));
  }
  function hasPlacements(payload) {
    return !!Object.keys(placementEntries(payload && (payload.placements || payload))).length;
  }
  function canonicalBody(value) {
    const key = normalize(value).replace(/[^a-z]/g, '');
    const aliases = {
      sun:'Sun', moon:'Moon', mercury:'Mercury', venus:'Venus', mars:'Mars', jupiter:'Jupiter', saturn:'Saturn',
      uranus:'Uranus', neptune:'Neptune', pluto:'Pluto', rising:'Rising', asc:'Rising', ascendant:'Rising',
      mc:'Midheaven', midheaven:'Midheaven'
    };
    return aliases[key] || String(value || '').trim();
  }
  function parsePlacementText(text) {
    const placements = {};
    String(text || '').split(/\r?\n/).forEach(function (line) {
      const clean = line.trim();
      if (!clean) return;
      let match = clean.match(/^\s*([^,]+?)\s*,\s*([A-Za-z]+)\s*,\s*(\d{1,2})\s*°\s*(\d{1,2})?/i);
      if (!match) match = clean.match(/^\s*(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|Ascendant|MC|Midheaven)\s+([A-Za-z]+)\s+(\d{1,2})\s*°\s*(\d{1,2})?/i);
      if (!match) return;
      const houseMatch = clean.match(/(?:in\s+)?(\d{1,2})(?:st|nd|rd|th)?\s*House/i);
      placements[canonicalBody(match[1])] = {
        sign:match[2],
        degree:Number(match[3]),
        minute:Number(match[4] || 0),
        house:houseMatch ? Number(houseMatch[1]) : '',
        retrograde:/\bretrograde\b|℞/i.test(clean)
      };
    });
    return placements;
  }
  function headingName(kind) {
    if (kind === 'currentSky') {
      const current = readJson(SLOT_KEYS.currentSky, null);
      return String(current?.name || byId('currentSkyOutput')?.dataset.skyName || '').trim();
    }
    const heading = byId('relphiSkyCompleteHeading')?.textContent || '';
    return heading.match(/^(.*?)\s+is now\s+Sky A$/i)?.[1]?.trim() ||
      String(byId('chartOutput')?.dataset.skyName || byId('skyCreatorName')?.value || '').trim();
  }
  function libraryRecord(name) {
    const library = readJson(LIBRARY_KEY, []);
    return Array.isArray(library) ? library.find(function (record) {
      return normalize(record?.name) === normalize(name) && Object.keys(placementEntries(record?.placements)).length;
    }) : null;
  }
  function payloadFromEditor(name) {
    const placements = parsePlacementText(byId('skyCreatorPaste')?.value || '');
    if (!Object.keys(placements).length) return null;
    return {
      name:name,
      notes:byId('skyCreatorNotes')?.value || '',
      placements:placements,
      calcProfile:{},
      savedAt:new Date().toISOString(),
      savedAtLocal:new Date().toLocaleString()
    };
  }
  function ensureSlot(kind, requestedName) {
    const key = SLOT_KEYS[kind];
    const name = String(requestedName || headingName(kind) || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim();
    let payload = readJson(key, null);
    if (hasPlacements(payload)) {
      payload.name = name || payload.name;
      writeJson(key, payload);
      return payload;
    }

    const saved = libraryRecord(name);
    if (saved) {
      payload = {
        name:saved.name,
        notes:saved.notes || '',
        placements:placementEntries(saved.placements),
        calcProfile:saved.calcProfile || {},
        savedAt:saved.savedAt || new Date().toISOString(),
        savedAtLocal:saved.savedAtLocal || new Date().toLocaleString()
      };
    } else {
      payload = payloadFromEditor(name);
    }
    if (!payload || !hasPlacements(payload)) return null;
    return writeJson(key, payload) ? payload : null;
  }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,140}\d{1,2}°/i.test(node?.textContent || '');
  }
  function slotInfo(kind) {
    const payload = readJson(SLOT_KEYS[kind], null);
    const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
    if (!hasPlacements(payload) && !outputHasPlacements(output)) return null;
    const placements = placementEntries(payload && (payload.placements || payload));
    return {
      kind:kind,
      label:kind === 'currentSky' ? 'Sky B' : 'Sky A',
      name:String(payload?.name || output?.dataset.skyName || (kind === 'currentSky' ? 'Sky B' : 'Sky A')).trim(),
      count:Object.keys(placements).length || 12
    };
  }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = kind;
      fire(field, 'input');
      fire(field, 'change');
    });
  }
  function activateExistingControl(kind, action) {
    setTarget(kind);
    const id = action === 'edit' ? 'relphiEditActiveSky' : 'relphiClearActiveSky';
    byId(id)?.click();
  }
  function panelMarkup(info) {
    return '<article class="relphi-finished-sky-panel" data-kind="' + info.kind + '">' +
      '<div><p class="eyebrow">' + info.label + '</p><h3>' + escapeHtml(info.name) + '</h3><p>' + info.count + ' placements</p></div>' +
      '<div class="relphi-finished-sky-actions">' +
        '<button type="button" data-sky-edit="' + info.kind + '">Edit</button>' +
        '<button type="button" data-sky-clear="' + info.kind + '">Clear</button>' +
      '</div></article>';
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character];
    });
  }
  function renderFinishedWorkspace() {
    const complete = byId('relphiSkyCompleteStage');
    if (!complete || complete.hidden) return;
    const skyA = slotInfo('chart');
    const skyB = slotInfo('currentSky');
    if (!skyA) return;

    byId('relphiBuilderMinimize')?.remove();
    const oldCopy = complete.querySelector('.sky-wizard-step-copy');
    const oldRow = complete.querySelector('.button-row');
    if (oldCopy) oldCopy.hidden = true;
    if (oldRow) oldRow.hidden = true;

    let workspace = byId('relphiFinishedSkyWorkspace');
    if (!workspace) {
      workspace = document.createElement('div');
      workspace.id = 'relphiFinishedSkyWorkspace';
      complete.appendChild(workspace);
    }
    workspace.innerHTML = '<div class="relphi-finished-sky-grid">' + panelMarkup(skyA) + (skyB ? panelMarkup(skyB) : '') + '</div>' +
      (!skyB ? '<button id="relphiCompactAddComparison" class="relphi-primary-action" type="button">Add a comparison sky</button>' : '');

    const status = byId('relphiBuilderStatusPanel');
    if (status) status.hidden = true;
    complete.classList.toggle('has-two-skies', !!skyB);
  }
  function installStyles() {
    if (byId('relphiPreviewStateFixStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiPreviewStateFixStyles';
    style.textContent = `
      #relphiBuilderMinimize{display:none!important}
      #relphiSkyCompleteStage:not([hidden]){display:block!important}
      #relphiFinishedSkyWorkspace{width:100%}
      .relphi-finished-sky-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
      .relphi-finished-sky-panel{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.15rem 1.25rem;border:1px solid rgba(0,0,0,.13);border-radius:20px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.055)}
      .relphi-finished-sky-panel h3{margin:.15rem 0 .2rem;font-size:1.3rem}
      .relphi-finished-sky-panel p{margin:0}
      .relphi-finished-sky-actions{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:flex-end}
      .relphi-finished-sky-actions button{border-radius:999px!important;padding:.7rem 1.05rem!important;background:#fff!important;color:#111!important;border:1px solid rgba(220,31,24,.45)!important;font-weight:700!important}
      #relphiCompactAddComparison{margin-top:1rem;border-radius:999px!important;padding:.85rem 1.3rem!important}
      @media(max-width:720px){.relphi-finished-sky-grid{grid-template-columns:1fr}.relphi-finished-sky-panel{align-items:flex-start;flex-direction:column}.relphi-finished-sky-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }
  function clearFalsePlacementError() {
    const status = byId('relphiActiveSkyStatus');
    if (status && /must contain placements before adding Sky B/i.test(status.textContent || '') && ensureSlot('chart', headingName('chart'))) {
      status.textContent = '';
    }
  }
  function install() {
    installStyles();

    document.addEventListener('click', function (event) {
      const add = event.target.closest?.('#relphiAddComparison, #relphiCompactAddComparison');
      if (add) {
        const payload = ensureSlot('chart', headingName('chart'));
        if (payload) clearFalsePlacementError();
        if (add.id === 'relphiCompactAddComparison') {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.RelphiTwoSkyAuthority?.begin?.(event);
        }
        return;
      }
      const edit = event.target.closest?.('[data-sky-edit]');
      if (edit) {
        event.preventDefault();
        activateExistingControl(edit.dataset.skyEdit, 'edit');
        return;
      }
      const clear = event.target.closest?.('[data-sky-clear]');
      if (clear) {
        event.preventDefault();
        activateExistingControl(clear.dataset.skyClear, 'clear');
        setTimeout(renderFinishedWorkspace, 100);
      }
    }, true);

    const observer = new MutationObserver(function () {
      clearFalsePlacementError();
      renderFinishedWorkspace();
      byId('relphiBuilderMinimize')?.remove();
    });
    observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
    setInterval(function () {
      clearFalsePlacementError();
      renderFinishedWorkspace();
      byId('relphiBuilderMinimize')?.remove();
    }, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
