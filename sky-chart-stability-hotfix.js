// Containment layer for the live Sky Chart workflow while the larger editor is reconciled.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BROKEN_SESSION_KEY = 'relphiSkyChartSessionV1';
  const MODE_KEY = 'relphiSkyBuilderModeV1';
  const TARGETS = new Set(['chart', 'currentSky']);
  let activeEntryTarget = 'chart';
  let pasteBusy = false;

  function byId(id) { return document.getElementById(id); }
  function dispatchChange(element) {
    if (!element) return;
    element.dispatchEvent(new Event('change', { bubbles:true }));
  }

  function disableBrokenCrossSkyRestore() {
    try {
      const existing = localStorage.getItem(BROKEN_SESSION_KEY);
      if (existing && !localStorage.getItem(BROKEN_SESSION_KEY + ':disabled-backup')) {
        localStorage.setItem(BROKEN_SESSION_KEY + ':disabled-backup', existing);
      }
      localStorage.removeItem(BROKEN_SESSION_KEY);
    } catch (error) {}
    window.RelphiSkyRefreshPersistenceDisabled = true;
  }

  function injectStyles() {
    if (byId('relphi-sky-chart-stability-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-chart-stability-style';
    style.textContent = `
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > .sky-wizard-shell {
  display:grid !important;
}
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > .sky-builder-advanced-panel {
  display:none !important;
}
body.sky-chart-page #chartPanel[data-sky-builder-ui="advanced"] > .sky-wizard-shell {
  display:none !important;
}
body.sky-chart-page #chartPanel[data-sky-builder-ui="advanced"] > .sky-builder-advanced-panel {
  display:block !important;
}
body.sky-chart-page .sky-paste-create-wrap {
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  gap:.45rem;
  margin-top:.5rem;
}
body.sky-chart-page .sky-paste-create-button {
  border:1px solid #111;
  border-radius:999px;
  background:#111;
  color:#fff;
  padding:.55rem .78rem;
  font:800 .78rem/1.1 Montserrat,sans-serif;
  cursor:pointer;
}
body.sky-chart-page .sky-paste-create-button:hover,
body.sky-chart-page .sky-paste-create-button:focus-visible {
  border-color:#dc1f18;
  background:#dc1f18;
  outline:none;
}
body.sky-chart-page .sky-paste-create-button:disabled { opacity:.55; cursor:wait; }
body.sky-chart-page .sky-paste-create-status {
  margin:0;
  color:rgba(17,17,17,.7);
  font-size:.72rem;
  line-height:1.35;
}
`;
    document.head.appendChild(style);
  }

  function setBuilderMode(mode, remember) {
    const panel = byId('chartPanel');
    const wizard = byId('skyBuilderWizardMode');
    const advanced = byId('skyBuilderAdvancedMode');
    const drawer = byId('skyCreatorDrawer');
    const next = mode === 'advanced' ? 'advanced' : 'wizard';
    if (panel) panel.dataset.skyBuilderUi = next;
    if (wizard) {
      wizard.classList.toggle('is-active', next === 'wizard');
      wizard.setAttribute('aria-pressed', next === 'wizard' ? 'true' : 'false');
    }
    if (advanced) {
      advanced.classList.toggle('is-active', next === 'advanced');
      advanced.setAttribute('aria-pressed', next === 'advanced' ? 'true' : 'false');
    }
    if (drawer) {
      if (next === 'advanced') drawer.setAttribute('open', '');
      else drawer.removeAttribute('open');
    }
    if (remember !== false) try { sessionStorage.setItem(MODE_KEY, next); } catch (error) {}
  }

  function initialBuilderMode() {
    // Wizard remains the safe default. A deliberate Advanced click survives only
    // within the current tab session.
    let saved = '';
    try { saved = sessionStorage.getItem(MODE_KEY) || ''; } catch (error) {}
    setBuilderMode(saved === 'advanced' ? 'advanced' : 'wizard', false);
  }

  function setTarget(target) {
    if (!TARGETS.has(target)) return;
    activeEntryTarget = target;
    ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (!select || select.value === target) return;
      select.value = target;
      dispatchChange(select);
    });
  }

  function targetForNode(node) {
    if (!node || !node.closest) return activeEntryTarget;
    if (node.closest('#skyWizardCompareEntryPanel')) return 'currentSky';
    if (node.closest('#skyWizardPrimaryEntryPanel')) return 'chart';
    return activeEntryTarget;
  }

  function guardEntryTarget(event) {
    const target = targetForNode(event.target);
    if (TARGETS.has(target)) setTarget(target);
  }

  const BODY_NAMES = {
    'sun':'Sun','☉':'Sun','moon':'Moon','☽':'Moon','mercury':'Mercury','☿':'Mercury',
    'venus':'Venus','♀':'Venus','mars':'Mars','♂':'Mars','jupiter':'Jupiter','♃':'Jupiter',
    'saturn':'Saturn','♄':'Saturn','uranus':'Uranus','♅':'Uranus','neptune':'Neptune','♆':'Neptune',
    'pluto':'Pluto','⯓':'Pluto','♇':'Pluto','asc':'Ascendant','ascendant':'Ascendant',
    'mc':'Midheaven','midheaven':'Midheaven','node':'North Node','north node':'North Node',
    'chiron':'Chiron','lilith':'Lilith'
  };
  const SIGN_NAMES = {
    'aries':'Aries','♈':'Aries','taurus':'Taurus','♉':'Taurus','gemini':'Gemini','♊':'Gemini',
    'cancer':'Cancer','♋':'Cancer','leo':'Leo','♌':'Leo','virgo':'Virgo','♍':'Virgo',
    'libra':'Libra','♎':'Libra','scorpio':'Scorpio','♏':'Scorpio','sagittarius':'Sagittarius','♐':'Sagittarius',
    'capricorn':'Capricorn','♑':'Capricorn','aquarius':'Aquarius','♒':'Aquarius','pisces':'Pisces','♓':'Pisces'
  };

  function normalized(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9♈-♓☉-♇⯓]+/g, ' ').trim();
  }

  function firstAlias(text, aliases) {
    const source = normalized(text);
    const entries = Object.keys(aliases).sort(function (a, b) { return b.length - a.length; });
    const found = entries.find(function (key) {
      const token = normalized(key);
      return source === token || source.startsWith(token + ' ') || source.indexOf(' ' + token + ' ') !== -1;
    });
    return found ? aliases[found] : '';
  }

  function parsePlacements(text) {
    return String(text || '').split(/\r?\n/).map(function (raw) {
      const line = raw.trim();
      if (!line) return null;
      const body = firstAlias(line, BODY_NAMES);
      const sign = firstAlias(line, SIGN_NAMES);
      const degreeMatch = line.match(/(\d{1,2})\s*°\s*(\d{1,2})?\s*[′'’]?/);
      if (!body || !sign || !degreeMatch) return null;
      const houseMatch = line.match(/(?:in\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+house/i);
      return {
        body:body,
        sign:sign,
        degree:String(Math.min(29, Number(degreeMatch[1]) || 0)),
        minute:String(Math.min(59, Number(degreeMatch[2]) || 0)),
        house:houseMatch ? String(Math.min(12, Math.max(1, Number(houseMatch[1]) || 1))) : ''
      };
    }).filter(Boolean);
  }

  function setMeaningfulValue(control, wanted) {
    if (!control || wanted == null || wanted === '') return false;
    if (control.tagName === 'SELECT') {
      const needle = normalized(wanted);
      const option = Array.from(control.options || []).find(function (item) {
        const value = normalized(item.value);
        const label = normalized(item.textContent);
        return value === needle || label === needle || value.indexOf(needle) !== -1 || label.indexOf(needle) !== -1;
      });
      if (!option) return false;
      control.value = option.value;
    } else control.value = wanted;
    control.dispatchEvent(new Event('input', { bubbles:true }));
    control.dispatchEvent(new Event('change', { bubbles:true }));
    return true;
  }

  function addPlacementButton(form) {
    return Array.from(form.querySelectorAll('button')).find(function (button) {
      const text = normalized(button.textContent);
      return /(^| )(add|insert|create|apply|save)( placement)?($| )/.test(text) && !/(clear|remove|delete|reset)/.test(text);
    }) || null;
  }

  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  async function buildFromParsedPlacements(items) {
    const form = byId('skyCreatorForm');
    if (!form) return { added:0, reason:'The placement builder is not available.' };
    let added = 0;
    for (const item of items) {
      const body = form.querySelector('.placement-body, [data-placement-body]');
      const sign = form.querySelector('.placement-sign, [data-placement-sign]');
      const degree = form.querySelector('.placement-degree, [data-placement-degree]');
      const minute = form.querySelector('.placement-minute, [data-placement-minute]');
      const house = form.querySelector('.placement-house, [data-placement-house]');
      const add = addPlacementButton(form);
      if (!body || !sign || !degree || !minute || !add) {
        return { added:added, reason:'The current placement builder did not expose all required controls.' };
      }
      setMeaningfulValue(body, item.body);
      setMeaningfulValue(sign, item.sign);
      setMeaningfulValue(degree, item.degree);
      setMeaningfulValue(minute, item.minute);
      if (house && item.house) setMeaningfulValue(house, item.house);
      add.click();
      added += 1;
      await wait(90);
    }
    return { added:added, reason:'' };
  }

  function pasteStatus(message, isError) {
    const status = document.querySelector('.sky-paste-create-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#991913' : '';
  }

  async function createSkyFromPaste() {
    if (pasteBusy) return;
    const textarea = byId('skyCreatorPaste');
    const text = textarea && textarea.value.trim();
    if (!text) { pasteStatus('Paste placements first.', true); textarea?.focus(); return; }
    const items = parsePlacements(text);
    if (!items.length) {
      pasteStatus('No complete placement lines were recognized. Include a body, sign, degree, and minutes.', true);
      return;
    }
    pasteBusy = true;
    const button = document.querySelector('.sky-paste-create-button');
    if (button) button.disabled = true;
    setTarget(targetForNode(textarea));

    // Give the native parser first opportunity; older builds sometimes parse on
    // input without presenting a visible action.
    const output = byId(activeEntryTarget === 'currentSky' ? 'currentSkyOutput' : 'chartOutput');
    const before = output ? output.textContent : '';
    textarea.dispatchEvent(new Event('input', { bubbles:true }));
    textarea.dispatchEvent(new Event('change', { bubbles:true }));
    await wait(240);
    const after = output ? output.textContent : '';
    if (after && after !== before) {
      pasteStatus('Sky created from the pasted placements.', false);
    } else {
      const result = await buildFromParsedPlacements(items);
      if (result.added === items.length) pasteStatus('Created ' + result.added + ' placements in this sky.', false);
      else pasteStatus((result.added ? 'Added ' + result.added + ' placements. ' : '') + result.reason, true);
    }
    pasteBusy = false;
    if (button) button.disabled = false;
  }

  function installPasteAction() {
    const textarea = byId('skyCreatorPaste');
    if (!textarea || document.querySelector('.sky-paste-create-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'sky-paste-create-wrap';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sky-paste-create-button';
    button.textContent = 'Create sky from pasted placements';
    const status = document.createElement('p');
    status.className = 'sky-paste-create-status';
    status.setAttribute('aria-live', 'polite');
    wrap.append(button, status);
    textarea.insertAdjacentElement('afterend', wrap);
    button.addEventListener('click', createSkyFromPaste);
    textarea.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        createSkyFromPaste();
      }
    });
  }

  function install() {
    injectStyles();
    disableBrokenCrossSkyRestore();
    initialBuilderMode();
    installPasteAction();

    document.addEventListener('click', function (event) {
      if (event.target.closest('#skyBuilderWizardMode')) setBuilderMode('wizard');
      if (event.target.closest('#skyBuilderAdvancedMode')) setBuilderMode('advanced');
      const entry = event.target.closest('[data-sky-entry-kind]');
      if (entry) setTarget(entry.dataset.skyEntryKind);
    }, true);

    document.addEventListener('focusin', guardEntryTarget, true);
    document.addEventListener('beforeinput', guardEntryTarget, true);

    new MutationObserver(function () {
      installPasteAction();
      const panel = byId('chartPanel');
      if (panel && !['wizard','advanced'].includes(panel.dataset.skyBuilderUi)) initialBuilderMode();
    }).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiSkyChartStability = {
    setBuilderMode:setBuilderMode,
    setTarget:setTarget,
    parsePlacements:parsePlacements,
    createSkyFromPaste:createSkyFromPaste
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
