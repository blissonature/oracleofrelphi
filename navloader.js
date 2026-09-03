// Loads shared navigation and page-specific enhancements.
(function () {
  'use strict';

  function appendScript(src, onload, onerror) {
    const base = src.split('?')[0];
    const existing = document.querySelector('script[src^="' + base + '"]');
    if (existing) {
      if (onload) setTimeout(onload, 0);
      return existing;
    }
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    if (onload) script.addEventListener('load', onload, { once:true });
    if (onerror) script.addEventListener('error', onerror, { once:true });
    document.body.appendChild(script);
    return script;
  }

  function initAnalytics() {
    const id = 'G-PNWZP2MW64';
    if (!/(^|\.)oracleofrelphi\.com$/i.test(location.hostname) || document.getElementById('relphi-google-tag')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    const script = document.createElement('script');
    script.id = 'relphi-google-tag';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }

  function ensureNavStyles() {
    if (document.getElementById('relphi-nav-style') || document.querySelector('link[href*="style.css"]')) return;
    const style = document.createElement('style');
    style.id = 'relphi-nav-style';
    style.textContent = '.menu-container{position:absolute;top:1rem;left:1rem;z-index:999}.logo-btn{background:none;border:0;cursor:pointer;padding:0;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center}.logo-btn img{width:44px;height:44px}.dropdown-menu{display:none;position:absolute;top:56px;left:0;min-width:180px;background:#111;border:2px solid #fff;border-radius:1.25em;box-shadow:0 8px 32px rgba(0,0,0,.26);padding:.7em 0}.dropdown-menu a,.dropdown-menu summary{display:block;color:#fff;text-decoration:none;padding:1em 1.5em;font-size:1.05em;white-space:nowrap}.dropdown-menu a:hover,.dropdown-menu a:focus{background:#dc1f18}.menu-container.active .dropdown-menu a{padding-left:2.25em}@media(max-width:600px){.dropdown-menu{min-width:130px;left:-10px}}';
    document.head.appendChild(style);
  }

  function initMenu() {
    if (window.RelphiInitMenu) return window.RelphiInitMenu();
    appendScript('menu.js?v=6');
  }

  function injectNav(html) {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder && !placeholder.querySelector('.menu-container')) placeholder.innerHTML = html;
    else if (!document.querySelector('.menu-container')) {
      const holder = document.createElement('div');
      holder.innerHTML = html;
      document.body.insertBefore(holder, document.body.firstChild);
    }
    ensureNavStyles();
    initMenu();
  }

  function fallbackNav() {
    injectNav('<div class="menu-container" id="menuContainer"><button class="logo-btn" id="menuButton" type="button" aria-label="Open navigation menu" aria-controls="dropdownMenu" aria-expanded="false"><img src="logo.png" alt="Oracle of Relphi logo"></button><nav class="dropdown-menu" id="dropdownMenu" aria-label="Main navigation"><a href="index.html">Home</a><a href="tarot.html">Tarot Ledger</a><a href="sky-chart.html">Sky Chart</a><a href="planetaryhours.html">Planetary Hours</a><a href="glyphs.html">Glyph Trainer</a><details class="nav-tool-group"><summary>Study</summary><a href="astrology-foundations.html">Astrology Foundations</a><a href="constellations.html">Constellation Trainer</a><a href="mythic-atlas.html">Mythic Atlas</a><a href="ancient-measures.html">Ancient Measures</a><a href="rainbow-brand.html">Rainbow Brand</a></details><a href="guide.html">Guide</a><a href="about.html">About</a><a href="services.html">Services</a><a href="forsacreduseonly.html">For Sacred Use Only</a><a href="https://ko-fi.com/oracleofrelphi" target="_blank" rel="noopener">Support</a></nav></div>');
  }

  function showPreviewLoadFailure() {
    if (document.getElementById('relphiPreviewLoadFailure') || document.getElementById('relphiSkyBuilderV4')) return;
    const hero = document.querySelector('.sky-chart-hero-panel');
    if (!hero) return;
    const note = document.createElement('div');
    note.id = 'relphiPreviewLoadFailure';
    note.className = 'generated-note';
    note.setAttribute('role', 'alert');
    note.innerHTML = '<strong>The Sky Builder preview did not finish loading.</strong> <button type="button" id="relphiRetryPreview" class="relphi-preview-retry">Retry preview</button>';
    hero.insertAdjacentElement('afterend', note);
    const retryButton = document.getElementById('relphiRetryPreview');
    if (retryButton) {
      Object.assign(retryButton.style, {
        appearance:'none', border:'1px solid rgba(220,31,24,.45)', borderRadius:'999px',
        background:'#fff', color:'#111', font:'inherit', fontWeight:'800',
        marginLeft:'.5rem', padding:'.55rem .9rem', cursor:'pointer'
      });
    }
    retryButton?.addEventListener('click', function () {
      const url = new URL(location.href);
      url.searchParams.set('previewRetry', String(Date.now()));
      location.replace(url.toString());
    });
  }

  function finishSkyBuilderLoad() {
    if (!document.getElementById('relphiSkyBuilderV4') || window.__relphiSkyBuilderEnhancementsLoaded) return false;
    window.__relphiSkyBuilderEnhancementsLoaded = true;
    document.getElementById('relphiPreviewLoadFailure')?.remove();
    window.dispatchEvent(new Event('relphi:sky-builder-v4-loaded'));
    appendScript('sky-chart-builder-v4-defaults.js?v=1');
    appendScript('sky-chart-language-cleanup.js?v=6');
    appendScript('sky-chart-aspect-keyboard.js?v=1');
    return true;
  }

  function waitForSkyBuilder(started, onTimeout) {
    if (finishSkyBuilderLoad()) return;
    if (Date.now() - started < 8000) {
      setTimeout(function () { waitForSkyBuilder(started, onTimeout); }, 50);
      return;
    }
    onTimeout();
  }

  function loadSkyBuilder(attempt) {
    const retry = Number(attempt) || 0;
    const suffix = retry ? '&retry=' + Date.now() : '';
    const retryOrFail = function () {
      const failed = document.querySelector('script[src^="sky-chart-builder-v4.js"]');
      if (failed) failed.remove();
      if (retry < 2) {
        setTimeout(function () { loadSkyBuilder(retry + 1); }, 250);
        return;
      }
      showPreviewLoadFailure();
    };
    appendScript('sky-chart-builder-v4.js?v=18' + suffix, function () {
      waitForSkyBuilder(Date.now(), retryOrFail);
    }, retryOrFail);
  }

  function ensureCanonicalSkyBootStyle() {
    if (document.getElementById('relphi-canonical-sky-boot-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-canonical-sky-boot-style';
    style.textContent = [
      '.sky-chart-page .unified-sky-wheel svg:not(.relphi-canonical-ready):not(.relphi-canonical-fallback),',
      '.sky-chart-page #chartOutput svg:not(.relphi-canonical-ready):not(.relphi-canonical-fallback),',
      '.sky-chart-page #currentSkyOutput svg:not(.relphi-canonical-ready):not(.relphi-canonical-fallback),',
      '.sky-chart-page .sky-output-box svg:not(.relphi-canonical-ready):not(.relphi-canonical-fallback){visibility:hidden!important}',
      '.sky-chart-page svg.relphi-canonical-ready,.sky-chart-page svg.relphi-canonical-fallback{visibility:visible!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function loadCanonicalSkyWheel() {
    ensureCanonicalSkyBootStyle();
    appendScript('relphi-glyph-registry-v1.js?v=19', function () {
      appendScript('relphi-glyph-component-v1.js?v=20', function () {
        appendScript('sky-chart-wheel-e9344099-canonical-master-v1.js?v=1', function () {
          appendScript('sky-chart-wheel-canonical-component-v1.js?v=3', function () {
            appendScript('sky-chart-wheel-marker-interaction-v1.js?v=2');
          });
        });
      });
    });
  }

  function refreshDrawingBoardControlAssets() {
    const link = document.querySelector('link[href^="drawing-board-workflow-v2.css"]');
    if (link) link.href = 'drawing-board-workflow-v2.css?v=22';
    if (!document.getElementById('relphi-drawing-board-collapse-contract')) {
      const style = document.createElement('style');
      style.id = 'relphi-drawing-board-collapse-contract';
      style.textContent = '#shortListPanel .card-row-drawing-board:not([open])>summary>:not(strong){display:none!important}';
      document.head.appendChild(style);
    }
  }

  function loadEnhancements() {
    if (/(^|\/)tarot\.html$/.test(location.pathname)) {
      refreshDrawingBoardControlAssets();
      appendScript('tarot-date-sky-bridge-v1.js?v=2');
      appendScript('drawing-board-workflow-v2.js?v=69');
      appendScript('drawing-board-interactions-v1.js?v=12');
      appendScript('drawing-board-template-lifecycle-v1.js?v=7', function () {
        appendScript('drawing-board-spread-prefabs-v1.js?v=46');
      });
    }
    if (/(^|\/)planetaryhours\.html$/.test(location.pathname)) {
      appendScript('planetary-hours-location-prompt.js?v=4');
      appendScript('standardize-zodiac-wheels.js?v=4');
      appendScript('relphi-glyph-bubbles.js?v=2');
    }
    if (/(^|\/)glyphs\.html$/.test(location.pathname)) {
      appendScript('relphi-glyph-registry-v1.js?v=19', function () {
        appendScript('relphi-glyph-component-v1.js?v=20', function () {
          appendScript('glyph-trainer-canonical-v1.js?v=1');
        });
      });
    }

    if (/(^|\/)sky-chart\.html$/.test(location.pathname)) {
      const preview = new URLSearchParams(location.search).get('preview');
      [
        'sky-chart-stability-hotfix.js?v=1',
        'sky-chart-static-dynamic.js?v=2',
        'sky-chart-aspect-duration-fix.js?v=2',
        'sky-chart-relationship-language.js?v=5',
        'sky-chart-canonical-relationship-ui-v1.js?v=1',
        'sky-chart-canonical-glyph-correction-v1.js?v=1',
        'sky-chart-related-relationships-v2.js?v=2',
        'sky-chart-sign-cusps-v1.js?v=1',
        'sky-chart-provenance-fix.js?v=1',
        'sky-chart-extra-points-support-v1.js?v=3',
        'sky-chart-calculated-points-v1.js?v=4',
        'sky-chart-special-vector-color-v1.js?v=1'
      ].forEach(function (src) { appendScript(src); });
      loadCanonicalSkyWheel();

      appendScript('sky-chart-builder-v4-unlock.js?v=1');
      loadSkyBuilder(0);
      appendScript(preview === 'pr22' ? 'sky-chart-relationship-color-hints-pr22.js?v=1' : 'sky-chart-relationship-color-hints.js?v=3');
    }
  }

  function start() {
    initAnalytics();
    ensureNavStyles();
    loadEnhancements();
    if (document.querySelector('.menu-container')) return initMenu();
    fetch('nav.html?v=14')
      .then(function (response) { if (!response.ok) throw new Error('Could not load nav.html'); return response.text(); })
      .then(injectNav)
      .catch(fallbackNav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();