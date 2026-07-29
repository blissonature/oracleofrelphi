// Canonical glyph-based relationship language and mobile dual-card presentation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODY = {
    '☉':['sun','Sun','identity, vitality, and conscious purpose'],
    '☽':['moon','Moon','feelings, instincts, and emotional needs'],
    '☿':['mercury','Mercury','thought, perception, and communication'],
    '♀':['venus','Venus','values, attraction, affection, and relating'],
    '♂':['mars','Mars','drive, assertion, desire, and action'],
    '♃':['jupiter','Jupiter','growth, confidence, meaning, and expansion'],
    '♄':['saturn','Saturn','structure, limits, responsibility, and commitment'],
    '♅':['uranus','Uranus','freedom, disruption, originality, and change'],
    '♆':['neptune','Neptune','imagination, sensitivity, surrender, and vision'],
    '⯓':['pluto','Pluto','power, depth, transformation, and compulsion'],
    '⚷':['chiron','Chiron','the wound, the healing intelligence developed around it, and the capacity to guide healing'],
    'ASC':['asc','Ascendant','the way a person enters life, meets the world, and is immediately perceived'],
    'MC':['mc','Midheaven','public direction, vocation, visibility, and the role a person grows toward']
  };
  const SIGN = {
    '♈':['aries','Aries','initiative, directness, courage, impulse, and beginning'],
    '♉':['taurus','Taurus','embodiment, value, pleasure, endurance, and material continuity'],
    '♊':['gemini','Gemini','language, exchange, curiosity, movement, and multiplicity'],
    '♋':['cancer','Cancer','care, protection, memory, belonging, and attachment'],
    '♌':['leo','Leo','radiance, creativity, pride, loyalty, and recognition'],
    '♍':['virgo','Virgo','discernment, service, refinement, repair, and usefulness'],
    '♎':['libra','Libra','relationship, balance, fairness, dialogue, and mutual recognition'],
    '♏':['scorpio','Scorpio','intensity, secrecy, survival, bonding, and emotional truth'],
    '♐':['sagittarius','Sagittarius','meaning, faith, exploration, philosophy, and freedom'],
    '♑':['capricorn','Capricorn','structure, responsibility, endurance, mastery, and worldly form'],
    '♒':['aquarius','Aquarius','systems, reform, collective intelligence, detachment, and future orientation'],
    '♓':['pisces','Pisces','surrender, imagination, compassion, permeability, and release']
  };
  const ASPECT = {
    '☌':['conjunction','Conjunction','a concentrated relationship in which the two functions operate together and intensify one another'],
    '☍':['opposition','Opposition','a polarized relationship that creates awareness through contrast, mirroring, and negotiation'],
    '□':['square','Square','a tense, activating relationship that demands movement, effort, and development'],
    '△':['trine','Trine','a flowing, low-resistance relationship in which the two functions support one another naturally'],
    '✶':['sextile','Sextile','a cooperative relationship that creates usable opportunities when consciously engaged'],
    '⚻':['quincunx','Quincunx','an awkward but productive relationship that requires ongoing adjustment and recalibration'],
    '⚺':['semi-sextile','Semi-Sextile','a subtle relationship that asks the two functions to notice and accommodate one another'],
    '∠':['octile','Octile','a minor hard aspect that creates friction and presses for action'],
    '⚼':['tri-octile','Tri-Octile','a minor hard aspect that intensifies pressure toward adjustment and expression'],
    'Q':['quintile','Quintile','a creative relationship that supports specialized talent and intentional pattern-making'],
    'bQ':['bi-quintile','Bi-Quintile','a creative relationship that supports refined skill and unusual synthesis']
  };

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_A_KEY = 'relphiSkyChartA';
  const SLOT_B_KEY = 'relphiSkyChartB';
  const BUILDER_STATE_KEY = 'relphiSkyBuilderV4State';
  const BIRTH_SETUP_KEY = 'relphiBirthProfileSetupV1';

  function registryEntry(id) {
    try { return window.RelphiGlyphRegistry && window.RelphiGlyphRegistry.resolve(id); }
    catch (_) { return null; }
  }

  function centerMars() {
    const mars = registryEntry('mars');
    if (mars) { mars.dx = 0; mars.dy = 0; }
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }

  function hasBirthRecord() {
    const records = readJson(LIBRARY_KEY, []);
    return Array.isArray(records) && records.some(function (record) {
      return String(record && record.name || '').trim().toLowerCase() === 'my birth chart';
    });
  }

  function rememberBirthSetupContext() {
    if (hasBirthRecord() || sessionStorage.getItem(BIRTH_SETUP_KEY)) return;
    const context = {
      slotA:localStorage.getItem(SLOT_A_KEY),
      slotB:localStorage.getItem(SLOT_B_KEY),
      builderState:sessionStorage.getItem(BUILDER_STATE_KEY),
      startedAt:Date.now()
    };
    sessionStorage.setItem(BIRTH_SETUP_KEY, JSON.stringify(context));
    document.documentElement.classList.add('relphi-birth-profile-setup');
  }

  function restoreStoredValue(storage, key, value) {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, value);
  }

  function finishBirthProfileSetup() {
    const raw = sessionStorage.getItem(BIRTH_SETUP_KEY);
    if (!raw || !hasBirthRecord()) return false;
    let context;
    try { context = JSON.parse(raw); }
    catch (_) { context = {}; }
    restoreStoredValue(localStorage, SLOT_A_KEY, context.slotA);
    restoreStoredValue(localStorage, SLOT_B_KEY, context.slotB);
    restoreStoredValue(sessionStorage, BUILDER_STATE_KEY, context.builderState);
    sessionStorage.removeItem(BIRTH_SETUP_KEY);
    sessionStorage.setItem('relphiBirthProfileSavedNotice', '1');
    location.reload();
    return true;
  }

  function maintainBirthProfileSetup() {
    const active = sessionStorage.getItem(BIRTH_SETUP_KEY);
    document.documentElement.classList.toggle('relphi-birth-profile-setup', !!active);
    if (!active) return;

    document.querySelectorAll('.sky-calc-setup label').forEach(function (label) {
      if (/target sky/i.test(label.textContent || '')) {
        label.hidden = true;
        label.setAttribute('aria-hidden', 'true');
      }
    });

    const setupCard = Array.from(document.querySelectorAll('.relphi-v4-card')).find(function (card) {
      return /set up my birth chart/i.test(card.textContent || '');
    });
    if (setupCard) {
      setupCard.querySelectorAll('[data-action="here-now"]').forEach(function (button) { button.hidden = true; });
      const manual = setupCard.querySelector('[data-action="manual"]');
      if (manual) {
        const title = manual.querySelector('strong');
        const copy = manual.querySelector('span');
        if (title) title.textContent = 'Enter birth details';
        if (copy) copy.textContent = 'Enter your birth date, exact time, and birthplace.';
      }
    }

    finishBirthProfileSetup();
  }

  function showBirthProfileSavedNotice() {
    if (sessionStorage.getItem('relphiBirthProfileSavedNotice') !== '1') return;
    sessionStorage.removeItem('relphiBirthProfileSavedNotice');
    const host = document.getElementById('relphiSkyBuilderV4') || document.querySelector('.sky-chart-hero-panel');
    if (!host || document.getElementById('relphiBirthProfileSaved')) return;
    const note = document.createElement('p');
    note.id = 'relphiBirthProfileSaved';
    note.className = 'generated-note';
    note.setAttribute('role', 'status');
    note.textContent = 'My birth chart is saved in your sky library. No Sky A or Sky B was selected.';
    host.insertAdjacentElement('afterend', note);
  }

  function installBirthProfileBehavior() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-action="quick-birth"]');
      if (!button || hasBirthRecord()) return;
      rememberBirthSetupContext();
    }, true);
    maintainBirthProfileSetup();
    showBirthProfileSavedNotice();
  }

  function token(symbol, data, kind) {
    const id = data[0], name = data[1], meaning = data[2];
    const wrap = document.createElement('span');
    wrap.className = 'relphi-canonical-token';
    const glyph = document.createElement('button');
    glyph.type = 'button';
    glyph.className = 'relphi-canonical-token-glyph';
    glyph.setAttribute('aria-label', 'Reveal ' + name);
    glyph.setAttribute('aria-expanded', 'false');

    const entry = registryEntry(id);
    if (entry && entry.asset) {
      const image = document.createElement('img');
      image.src = entry.asset;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      glyph.appendChild(image);
    } else {
      glyph.textContent = symbol;
    }

    function collapseToGlyph() {
      wrap.querySelector('.relphi-canonical-token-name')?.remove();
      wrap.querySelector('.relphi-canonical-token-meaning')?.remove();
      glyph.setAttribute('aria-expanded', 'false');
    }
    glyph.addEventListener('click', function (event) {
      event.stopPropagation();
      if (wrap.querySelector('.relphi-canonical-token-name')) return collapseToGlyph();
      const nameButton = document.createElement('button');
      nameButton.type = 'button';
      nameButton.className = 'relphi-canonical-token-name';
      nameButton.textContent = name;
      nameButton.setAttribute('aria-expanded', 'false');
      nameButton.addEventListener('click', function (nameEvent) {
        nameEvent.stopPropagation();
        const existing = wrap.querySelector('.relphi-canonical-token-meaning');
        if (existing) { existing.remove(); nameButton.setAttribute('aria-expanded', 'false'); return; }
        const meaningButton = document.createElement('button');
        meaningButton.type = 'button';
        meaningButton.className = 'relphi-canonical-token-meaning';
        meaningButton.textContent = (kind ? kind + ': ' : '') + meaning;
        meaningButton.addEventListener('click', function (meaningEvent) {
          meaningEvent.stopPropagation();
          meaningButton.remove();
          nameButton.setAttribute('aria-expanded', 'false');
        });
        wrap.appendChild(meaningButton);
        nameButton.setAttribute('aria-expanded', 'true');
      });
      wrap.appendChild(nameButton);
      glyph.setAttribute('aria-expanded', 'true');
    });
    wrap.appendChild(glyph);
    return wrap;
  }

  function text(value) { return document.createTextNode(value); }

  function parseReading(reading) {
    const raw = (reading.textContent || '').replace(/Select symbols[^.]*\.?/i, '').trim();
    const pattern = /^Between\s+(.+?)\s+and\s+(.+?),\s*(☉|☽|☿|♀|♂|♃|♄|♅|♆|⯓|⚷|ASC|MC)(?:\s+\w+)?\s+in\s+(♈|♉|♊|♋|♌|♍|♎|♏|♐|♑|♒|♓)(?:\s+\w+)?\s+at\s+([^\s]+)\s+connects with\s+(☉|☽|☿|♀|♂|♃|♄|♅|♆|⯓|⚷|ASC|MC)(?:\s+\w+)?\s+in\s+(♈|♉|♊|♋|♌|♍|♎|♏|♐|♑|♒|♓)(?:\s+\w+)?\s+at\s+([^\s.]+)\s+through\s+(☌|☍|□|△|✶|⚻|⚺|∠|⚼|Q|bQ)/i;
    const match = raw.match(pattern);
    if (!match) return null;
    return { aName:match[1], bName:match[2], aBody:match[3], aSign:match[4], aDegree:match[5], bBody:match[6], bSign:match[7], bDegree:match[8], aspect:match[9] };
  }

  function rebuild(reading) {
    if (reading.dataset.relphiCanonicalRelationship === 'true') return;
    const parsed = parseReading(reading);
    if (!parsed || !BODY[parsed.aBody] || !BODY[parsed.bBody] || !SIGN[parsed.aSign] || !SIGN[parsed.bSign] || !ASPECT[parsed.aspect]) return;
    const tailMatch = (reading.textContent || '').match(/(\.(?:\s+They share|\s+This influence|\s+Orb:)[\s\S]*)$/i);
    reading.replaceChildren();
    reading.dataset.relphiCanonicalRelationship = 'true';
    reading.appendChild(text(parsed.aName + '’s '));
    reading.appendChild(token(parsed.aBody, BODY[parsed.aBody], BODY[parsed.aBody][1] === 'Sun' || BODY[parsed.aBody][1] === 'Moon' ? 'luminary' : 'planet'));
    reading.appendChild(text(' ' + parsed.aDegree + ' '));
    reading.appendChild(token(parsed.aSign, SIGN[parsed.aSign], 'sign'));
    reading.appendChild(text(' connects with ' + parsed.bName + '’s '));
    reading.appendChild(token(parsed.bBody, BODY[parsed.bBody], BODY[parsed.bBody][1] === 'Sun' || BODY[parsed.bBody][1] === 'Moon' ? 'luminary' : 'planet'));
    reading.appendChild(text(' ' + parsed.bDegree + ' '));
    reading.appendChild(token(parsed.bSign, SIGN[parsed.bSign], 'sign'));
    reading.appendChild(text(' through '));
    reading.appendChild(token(parsed.aspect, ASPECT[parsed.aspect], 'aspect'));
    reading.appendChild(text(tailMatch ? tailMatch[1] : '.'));
  }

  function markDualCardViews() {
    document.querySelectorAll('.relphi-progressive-reading, .relphi-canonical-relationship-reading').forEach(function (reading) {
      let host = reading.parentElement;
      while (host && host !== document.body) {
        const cards = host.querySelectorAll('.tarot-card, .spread-card, [class*="card-image"], img[src*="card"], img[alt*="card" i]');
        if (cards.length >= 2 && cards.length <= 4) {
          host.classList.add('relphi-mobile-dual-card-view');
          const firstTwo = Array.from(cards).slice(0, 2);
          firstTwo.forEach(function (card) { card.classList.add('relphi-dual-card-item'); });
          break;
        }
        host = host.parentElement;
      }
    });
  }

  function installStyles() {
    if (document.getElementById('relphi-canonical-relationship-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-canonical-relationship-ui-styles';
    style.textContent = [
      '.relphi-canonical-token{display:inline-flex;align-items:baseline;gap:.22em;flex-wrap:wrap;vertical-align:baseline}',
      '.relphi-canonical-token button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer}',
      '.relphi-canonical-token-glyph{display:inline-grid;place-items:center;width:1.22em;height:1.22em;vertical-align:-.2em;border-radius:.22em}',
      '.relphi-canonical-token-glyph img{display:block;width:1.08em;height:1.08em;object-fit:contain;object-position:center}',
      '.relphi-canonical-token-name{font-weight:800;text-decoration:underline dotted rgba(17,17,17,.4);text-underline-offset:.18em}',
      '.relphi-canonical-token-meaning{color:#554d48;font-weight:520;text-align:left}',
      '.relphi-canonical-token button:hover,.relphi-canonical-token button:focus-visible{color:#b81712;outline:2px solid rgba(220,31,24,.32);outline-offset:2px}',
      '.relphi-birth-profile-setup .relphi-v4-complete{visibility:hidden}',
      '@media(max-width:600px){',
      '.relphi-mobile-dual-card-view{display:grid!important;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr)!important;align-items:center!important;gap:.45rem!important}',
      '.relphi-mobile-dual-card-view .relphi-dual-card-item{grid-row:1!important;min-width:0!important;width:100%!important;max-width:100%!important}',
      '.relphi-mobile-dual-card-view .relphi-dual-card-item:first-of-type{grid-column:1!important}',
      '.relphi-mobile-dual-card-view .relphi-dual-card-item:nth-of-type(2){grid-column:3!important}',
      '.relphi-mobile-dual-card-view .relphi-progressive-reading,.relphi-mobile-dual-card-view .relphi-canonical-relationship-reading,.relphi-mobile-dual-card-view [class*="reading"]{grid-column:1/-1!important;grid-row:auto!important}',
      '.relphi-progressive-reading,.relphi-canonical-relationship-reading{line-height:1.9;overflow-wrap:anywhere}',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function run() {
    centerMars();
    maintainBirthProfileSetup();
    document.querySelectorAll('.relphi-progressive-reading').forEach(rebuild);
    markDualCardViews();
  }

  function start() {
    installStyles();
    installBirthProfileBehavior();
    run();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; run(); });
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();