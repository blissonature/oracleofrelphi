// Loads shared navigation and page-specific enhancements.
(function () {
  'use strict';

  function appendScript(src, onload, onerror) {
    const base = src.split('?')[0];
    const existing = document.querySelector('script[src^="' + base + '"]');
    if (existing) {
      if (onload) {
        if (existing.dataset.relphiLoaded === 'true') queueMicrotask(onload);
        else existing.addEventListener('load', onload, { once:true });
      }
      return existing;
    }
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    script.addEventListener('load', function () {
      script.dataset.relphiLoaded = 'true';
      if (onload) onload();
    }, { once:true });
    if (onerror) script.addEventListener('error', onerror, { once:true });
    document.head.appendChild(script);
    return script;
  }

  function bootSkyFoundation() {
    if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
    const chartPanel = document.getElementById('chartPanel');
    if (!chartPanel) return;

    document.body.classList.add('sky-foundation-active', 'sky-foundation-booting');

    if (!document.getElementById('sky-foundation-first-paint')) {
      const style = document.createElement('style');
      style.id = 'sky-foundation-first-paint';
      style.textContent = [
        'body.sky-chart-page.sky-foundation-active #chartPanel>:not(#skyFoundationRoot){display:none!important}',
        '#skyFoundationRoot{display:grid;grid-template-columns:minmax(220px,270px) minmax(520px,1fr) minmax(220px,270px);grid-template-areas:"a comparison b";gap:14px;align-items:start;width:100%;min-width:0}',
        '#skyFoundationA{grid-area:a;border-top:4px solid #c9211e}',
        '#skyFoundationComparison{grid-area:comparison}',
        '#skyFoundationB{grid-area:b;border-top:4px solid #2462d0}',
        '.sky-foundation-panel{min-width:0;overflow:hidden;border:1px solid rgba(31,27,24,.18);border-radius:16px;background:#fffdf8}',
        '.sky-foundation-heading{display:flex;align-items:center;gap:8px;min-height:43px;padding:0 12px;border-bottom:1px solid rgba(31,27,24,.11);font:800 .82rem/1.2 system-ui,sans-serif}',
        '.sky-foundation-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '#skyFoundationWheelMount{min-height:420px}',
        '@media(max-width:900px){#skyFoundationRoot{grid-template-columns:1fr 1fr;grid-template-areas:"a b" "comparison comparison"}}',
        '@media(max-width:620px){#skyFoundationRoot{grid-template-columns:1fr;grid-template-areas:"a" "b" "comparison"}}'
      ].join('');
      document.head.appendChild(style);
    }

    if (!document.getElementById('skyFoundationRoot')) {
      const root = document.createElement('section');
      root.id = 'skyFoundationRoot';
      root.setAttribute('aria-label', 'Sky Chart foundation');
      root.setAttribute('aria-busy', 'true');
      root.innerHTML = [
        '<aside id="skyFoundationA" class="sky-foundation-panel" aria-label="Sky A"><header class="sky-foundation-heading"><span>Sky A</span><span class="sky-foundation-name">Sky A</span></header><div class="sky-foundation-body"></div></aside>',
        '<section id="skyFoundationComparison" class="sky-foundation-panel" aria-label="Comparison zodiac wheel"><header class="sky-foundation-heading"><span>Comparison</span></header><div id="skyFoundationWheelMount"></div></section>',
        '<aside id="skyFoundationB" class="sky-foundation-panel" aria-label="Sky B"><header class="sky-foundation-heading"><span>Sky B</span><span class="sky-foundation-name">Sky B</span></header><div class="sky-foundation-body"></div></aside>'
      ].join('');
      chartPanel.prepend(root);
    }

    if (!document.querySelector('link[href^="sky-chart-foundation-v1.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'sky-chart-foundation-v1.css?v=1';
      document.head.appendChild(link);
    }

    appendScript('relphi-glyph-registry-v1.js?v=0d56ee7', function () {
      appendScript('relphi-glyph-component-v1.js?v=0d56ee7', function () {
        appendScript('relphi-moon-stroke-preservation-v1.js?v=1', function () {
          appendScript('relphi-neptune-cross-connection-v1.js?v=1', function () {
            appendScript('sky-chart-foundation-v1.js?v=1');
          });
        });
      });
    });
  }

  // sky-chart.html places navloader after the full chart markup, so this runs
  // immediately and reserves the final three-panel surface before old output.
  bootSkyFoundation();

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

  function loadOtherEnhancements() {
    if (/(^|\/)tarot\.html$/.test(location.pathname)) {
      appendScript('tarot-date-sky-bridge-v1.js?v=1');
      appendScript('drawing-board-workflow-v2.js?v=19');
    }
    if (/(^|\/)planetaryhours\.html$/.test(location.pathname)) {
      appendScript('planetary-hours-location-prompt.js?v=4');
      appendScript('standardize-zodiac-wheels.js?v=4');
      appendScript('relphi-glyph-bubbles.js?v=2');
    }
    if (/(^|\/)glyphs\.html$/.test(location.pathname)) {
      appendScript('relphi-glyph-registry-v1.js?v=0d56ee7', function () {
        appendScript('relphi-glyph-component-v1.js?v=0d56ee7', function () {
          appendScript('relphi-moon-stroke-preservation-v1.js?v=1', function () {
            appendScript('relphi-neptune-cross-connection-v1.js?v=1', function () {
              appendScript('glyph-trainer-canonical-v1.js?v=1');
            });
          });
        });
      });
    }
  }

  function start() {
    initAnalytics();
    ensureNavStyles();
    loadOtherEnhancements();
    if (document.querySelector('.menu-container')) return initMenu();
    fetch('nav.html?v=14')
      .then(function (response) { if (!response.ok) throw new Error('Could not load nav.html'); return response.text(); })
      .then(injectNav)
      .catch(fallbackNav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
