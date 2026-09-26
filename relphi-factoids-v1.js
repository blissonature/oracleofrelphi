// Contextual Relphi factoid toasts.
// Shows one small fact at a time, rotates by context after "Got it", and stays out of the way.
(function () {
  'use strict';
  if (window.__relphiFactoidsV1) return;
  window.__relphiFactoidsV1 = true;

  const STORAGE_PREFIX = 'relphiFactoidCursorV1:';
  const PAGE_KEY = 'relphiFactoidShownThisViewV1';

  const FACTS = Object.freeze({
    'sunrise-edge': Object.freeze({
      title: 'Sunrise starts at the edge',
      text: 'Sunrise begins when the Sun’s upper edge first appears at the horizon. The center of the disk has not risen yet.'
    }),
    'sunrise-standard': Object.freeze({
      title: 'Why sunrise uses −0.833°',
      text: 'Standard sunrise calculations place the Sun’s center about 0.833° below the geometric horizon, combining the Sun’s apparent radius with typical atmospheric refraction.'
    }),
    'sun-width': Object.freeze({
      title: 'The Sun occupies real sky',
      text: 'The Sun spans about 32 arcminutes, roughly 0.53° of sky. Its apparent radius is about 16′.'
    }),
    'horizon-refraction': Object.freeze({
      title: 'The horizon bends light',
      text: 'Near the horizon, standard atmospheric refraction is about 34′. Weather and local conditions can shift the apparent moment of sunrise.'
    }),
    'planetary-hour-length': Object.freeze({
      title: 'A planetary hour is not fixed at 60 minutes',
      text: 'Planetary hours are temporal hours: daylight and darkness are each divided into twelve parts, so their lengths change with season and latitude.'
    }),
    'angular-units': Object.freeze({
      title: 'One degree contains a lot of sky',
      text: 'One zodiac degree contains 60 arcminutes, and one arcminute contains 60 arcseconds: 1° = 3,600″.'
    }),
    'body-center': Object.freeze({
      title: 'A placement is the body’s center',
      text: 'An ephemeris longitude normally gives the center of a celestial body. Its visible disk extends a small distance to either side of that coordinate.'
    }),
    'jupiter-width': Object.freeze({
      title: 'Jupiter is smaller than one arcminute',
      text: 'Jupiter usually spans roughly 30–50 arcseconds as seen from Earth: less than one arcminute and far less than one zodiac degree.'
    }),
    'moon-width': Object.freeze({
      title: 'The Moon is about half a degree wide',
      text: 'The Moon spans roughly half a degree of sky, close to the Sun’s apparent size. That near-match is what makes total solar eclipses possible.'
    })
  });

  const SKY_EXPORT_FACTS = Object.freeze({
    'configuration:grand-trine': 'A Grand Trine is three trines forming one closed triangle.',
    'configuration:kite': 'A Kite adds an opposition and two sextiles to a Grand Trine.',
    'configuration:yod': 'A Yod is a sextile base whose two ends converge on one apex through quincunxes.',
    'configuration:mystic-rectangle': 'A Mystic Rectangle contains two oppositions joined by two trines and two sextiles.',
    'configuration:t-square': 'A T-Square is an opposition whose two ends both square a third placement.',
    'configuration:grand-cross': 'A Grand Cross contains two oppositions joined by four squares.',
    'configuration:minor-grand-trine': 'A Minor Grand Trine combines one trine with two sextiles to a third placement.',
    'configuration:grand-sextile': 'A Grand Sextile / Star of David contains six sextiles, six trines, and three oppositions in one six-point figure.',
    'configuration:cradle': 'A Cradle is an opposition supported by two trines and three sextiles.',
    'configuration:thors-hammer': 'A Thor’s Hammer / Fist of God is a square whose ends converge on an apex through two tri-octiles.',
    'aspect:conjunction': 'A conjunction places two functions at the same zodiacal longitude.',
    'aspect:sextile': 'A sextile is a 60° relationship.',
    'aspect:square': 'A square is a 90° relationship.',
    'aspect:trine': 'A trine is a 120° relationship.',
    'aspect:quincunx': 'A quincunx is a 150° relationship.',
    'aspect:opposition': 'An opposition is a 180° relationship.',
    'placement:sun': 'The Sun spans about 32 arcminutes, roughly 0.53° of sky.',
    'placement:moon': 'The Moon spans roughly half a degree of sky, close to the Sun’s apparent size.',
    'placement:jupiter': 'Jupiter usually spans less than one arcminute as seen from Earth.'
  });

  const CONTEXTS = Object.freeze({
    'planetary-sun-frame': Object.freeze(['sunrise-edge', 'sunrise-standard', 'sun-width', 'horizon-refraction', 'planetary-hour-length']),
    'planetary-moon': Object.freeze(['moon-width', 'angular-units', 'body-center']),
    'planetary-wanderers': Object.freeze(['jupiter-width', 'body-center', 'angular-units']),
    'sky-wheel': Object.freeze(['angular-units', 'body-center', 'sun-width', 'jupiter-width', 'moon-width'])
  });

  let activeToast = null;
  let activeContext = null;
  let shownThisView = false;
  let pendingTimer = 0;

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function cursorFor(context) {
    const raw = Number(storageGet(STORAGE_PREFIX + context));
    return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
  }

  function styleOnce() {
    if (document.getElementById('relphi-factoid-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-factoid-style-v1';
    style.textContent = [
      '.relphi-factoid-toast{position:fixed;right:clamp(.75rem,2.5vw,1.35rem);bottom:clamp(.75rem,2.5vw,1.35rem);z-index:2147483000;width:min(360px,calc(100vw - 1.5rem));box-sizing:border-box;background:#fff;color:#1f1b18;border:1px solid rgba(201,33,30,.28);border-radius:1rem;box-shadow:0 14px 40px rgba(35,28,24,.18);padding:.82rem .88rem .78rem;text-align:left;font-family:inherit;line-height:1.38;animation:relphiFactoidIn .18s ease-out}',
      '.relphi-factoid-eyebrow{display:block;margin:0 0 .18rem;color:#c9211e;font-size:.68rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}',
      '.relphi-factoid-title{display:block;margin:0 0 .24rem;font-size:.93rem;font-weight:900;line-height:1.22}',
      '.relphi-factoid-text{margin:0;color:#49413b;font-size:.84rem}',
      '.relphi-factoid-actions{display:flex;justify-content:flex-end;margin-top:.58rem}',
      '.relphi-factoid-gotit{appearance:none;border:0;border-radius:999px;background:#c9211e;color:#fff;padding:.42rem .72rem;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer}',
      '.relphi-factoid-gotit:hover,.relphi-factoid-gotit:focus-visible{background:#a91b18;outline:2px solid rgba(201,33,30,.26);outline-offset:2px}',
      '@keyframes relphiFactoidIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}',
      '@media(max-width:520px){.relphi-factoid-toast{left:.75rem;right:.75rem;bottom:.75rem;width:auto}}',
      '@media(prefers-reduced-motion:reduce){.relphi-factoid-toast{animation:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function removeToast() {
    if (activeToast) activeToast.remove();
    activeToast = null;
    activeContext = null;
  }

  function show(context, options) {
    options = options || {};
    const ids = CONTEXTS[context];
    if (!ids || !ids.length) return false;
    if (activeToast) return false;
    if (shownThisView && !options.force) return false;

    const index = cursorFor(context) % ids.length;
    const id = ids[index];
    const fact = FACTS[id];
    if (!fact) return false;

    styleOnce();
    const toast = document.createElement('aside');
    toast.className = 'relphi-factoid-toast';
    toast.dataset.factoidId = id;
    toast.dataset.factoidContext = context;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML =
      '<span class="relphi-factoid-eyebrow">Factoid</span>' +
      '<strong class="relphi-factoid-title"></strong>' +
      '<p class="relphi-factoid-text"></p>' +
      '<div class="relphi-factoid-actions"><button class="relphi-factoid-gotit" type="button">Got it</button></div>';

    toast.querySelector('.relphi-factoid-title').textContent = fact.title;
    toast.querySelector('.relphi-factoid-text').textContent = fact.text;
    toast.querySelector('.relphi-factoid-gotit').addEventListener('click', function () {
      storageSet(STORAGE_PREFIX + context, String((index + 1) % ids.length));
      removeToast();
    });

    document.body.appendChild(toast);
    activeToast = toast;
    activeContext = context;
    shownThisView = true;
    try { sessionStorage.setItem(PAGE_KEY, '1'); } catch (_) {}
    return true;
  }

  function schedule(context, delay) {
    if (shownThisView || activeToast || pendingTimer) return;
    pendingTimer = window.setTimeout(function () {
      pendingTimer = 0;
      show(context);
    }, Math.max(0, Number(delay) || 0));
  }

  function observe(selector, context, delay) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (!('IntersectionObserver' in window)) {
      schedule(context, delay);
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      const visible = entries.some(function (entry) {
        return entry.isIntersecting && entry.intersectionRatio >= 0.3;
      });
      if (!visible) return;
      observer.disconnect();
      schedule(context, delay);
    }, { threshold:[0.3, 0.6] });
    observer.observe(target);
  }

  function bindContextClick(selector, context) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.addEventListener('click', function () {
      if (!activeToast) show(context, { force:true });
    });
  }

  function initPlanetaryHours() {
    // The Sun frame gets the quiet introductory factoid. More specific facts appear
    // only when the person actually engages with those parts of the tool.
    observe('.ph-day-frame', 'planetary-sun-frame', 900);
    bindContextClick('#moonDisc', 'planetary-moon');
    bindContextClick('#wandererGrid', 'planetary-wanderers');
  }

  function skyExportContext() {
    const expandedConfig = document.querySelector('.sky-configuration-result-tile.is-expanded[data-configuration-type]');
    if (expandedConfig) return 'configuration:' + expandedConfig.dataset.configurationType;

    const expandedRelationship = document.querySelector('.sky-foundation-relationship-row.is-inline-expanded[data-aspect]');
    if (expandedRelationship) return 'aspect:' + String(expandedRelationship.dataset.aspect || '').toLowerCase();

    const selectedRelationship = document.querySelector('.sky-foundation-relationship-row.is-selected[data-aspect]');
    if (selectedRelationship) return 'aspect:' + String(selectedRelationship.dataset.aspect || '').toLowerCase();

    try {
      const origin = window.RelphiSkyFoundationInteractions?.getSelectionOrigin?.();
      const placement = String(origin?.placement || origin?.id || '').toLowerCase();
      if (placement) return 'placement:' + placement;
      const aspect = String(origin?.aspect || '').toLowerCase();
      if (aspect) return 'aspect:' + aspect;
    } catch (_) {}

    return 'sky-wheel';
  }

  function skyExportFactoid() {
    const context = skyExportContext();
    if (SKY_EXPORT_FACTS[context]) return SKY_EXPORT_FACTS[context];

    const ids = CONTEXTS['sky-wheel'];
    if (!ids || !ids.length) return '';
    const index = cursorFor('sky-wheel') % ids.length;
    const fact = FACTS[ids[index]];
    if (!fact) return '';
    storageSet(STORAGE_PREFIX + 'sky-wheel', String((index + 1) % ids.length));
    return fact.text;
  }

  function initSkyChart() {
    // Sky Chart factoids belong to the unavoidable wait while preparing a
    // full wheel copy. Do not interrupt ordinary chart reading with a toast.
  }

  function init() {
    styleOnce();
    const path = location.pathname;
    if (/(^|\/)planetaryhours\.html$/.test(path)) initPlanetaryHours();
    else if (/(^|\/)sky-chart\.html$/.test(path)) initSkyChart();
  }

  window.RelphiFactoids = Object.freeze({
    show: show,
    dismiss: removeToast,
    facts: FACTS,
    contexts: CONTEXTS,
    skyExportContext: skyExportContext,
    skyExportFactoid: skyExportFactoid,
    get activeContext() { return activeContext; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
