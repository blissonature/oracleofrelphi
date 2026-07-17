// Loads shared navigation and page-specific enhancements.
(function () {
  'use strict';
  function appendScript(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
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
    style.textContent = '.menu-container{position:absolute;top:1rem;left:1rem;z-index:999}.logo-btn{background:none;border:0;cursor:pointer;padding:0;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center}.logo-btn img{width:44px;height:44px}.dropdown-menu{display:none;position:absolute;top:56px;left:0;min-width:180px;background:#111;border:2px solid #fff;border-radius:1.25em;box-shadow:0 8px 32px rgba(0,0,0,.26);padding:.7em 0}.dropdown-menu a,.dropdown-menu summary{display:block;color:#fff;text-decoration:none;padding:1em 1.5em;font-size:1.05em;white-space:nowrap}.dropdown-menu a:hover,.dropdown-menu a:focus{background:#dc1f18}.menu-container.active .dropdown-menu{display:block}.dropdown-menu .nav-tool-group a{padding-left:2.25em}@media(max-width:600px){.dropdown-menu{min-width:130px;left:-10px}}';
    document.head.appendChild(style);
  }
  function initMenu() { if (window.RelphiInitMenu) return window.RelphiInitMenu(); appendScript('menu.js?v=5'); }
  function injectNav(html) {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder && !placeholder.querySelector('.menu-container')) placeholder.innerHTML = html;
    else if (!document.querySelector('.menu-container')) { const holder = document.createElement('div'); holder.innerHTML = html; document.body.insertBefore(holder, document.body.firstChild); }
    ensureNavStyles(); initMenu();
  }
  function fallbackNav() { injectNav('<div class="menu-container" id="menuContainer"><button class="logo-btn" id="menuButton" type="button" aria-label="Open navigation menu" aria-controls="dropdownMenu" aria-expanded="false"><img src="logo.png" alt="Oracle of Relphi logo"></button><nav class="dropdown-menu" id="dropdownMenu" aria-label="Main navigation"><a href="index.html">Home</a><a href="tarot.html">Tarot Ledger</a><a href="sky-chart.html">Sky Chart</a><a href="planetaryhours.html">Planetary Hours</a><a href="glyphs.html">Glyph Trainer</a><details class="nav-tool-group"><summary>Study</summary><a href="astrology-foundations.html">Astrology Foundations</a><a href="constellations.html">Constellation Trainer</a><a href="mythic-atlas.html">Mythic Atlas</a><a href="ancient-measures.html">Ancient Measures</a><a href="rainbow-brand.html">Rainbow Brand</a></details><a href="guide.html">Guide</a><a href="about.html">About</a><a href="services.html">Services</a><a href="forsacreduseonly.html">For Sacred Use Only</a><a href="https://ko-fi.com/oracleofrelphi" target="_blank" rel="noopener">Support</a></nav></div>'); }
  function loadEnhancements() {
    if (/(^|\/)planetaryhours\.html$/.test(location.pathname)) {
      appendScript('planetary-hours-location-prompt.js?v=4'); appendScript('standardize-zodiac-wheels.js?v=4'); appendScript('relphi-glyph-bubbles.js?v=2');
    }
    if (/(^|\/)sky-chart\.html$/.test(location.pathname)) {
      const preview = new URLSearchParams(location.search).get('preview');
      [
        'sky-chart-stability-hotfix.js?v=1',
        'sky-chart-static-dynamic.js?v=2',
        'sky-chart-aspect-duration-fix.js?v=2',
        'sky-chart-relationship-language.js?v=2',
        'sky-chart-related-relationships-v2.js?v=2',
        'sky-ledger-glyph-alignment.js?v=1',
        'sky-ledger-wheel-glyphs.js?v=2',
        'relphi-glyph-bubbles.js?v=2',
        'sky-chart-provenance-fix.js?v=1'
      ].forEach(appendScript);

      if (preview === 'pr55') {
        const reviewBase = 'https://raw.githack.com/blissonature/oracleofrelphi/8a7ba543e8b9724805bdc730d1c7fb8c2ff9123c/';
        [
          reviewBase + 'sky-chart-saved-sky-recovery.js',
          reviewBase + 'sky-chart-two-sky-authority.js',
          reviewBase + 'sky-chart-start-over.js',
          'sky-chart-active-sky-controls.js?v=3',
          reviewBase + 'sky-chart-named-save-guarantee.js',
          'sky-chart-language-cleanup.js?v=5',
          'sky-chart-aspect-keyboard.js?v=1'
        ].forEach(appendScript);
      } else {
        [
          'sky-chart-core-workspace-v1.js?v=2',
          'sky-chart-here-now-flow.js?v=2',
          'sky-chart-wizard-v2.js?v=7',
          'sky-chart-wizard-native-flow-fix.js?v=4',
          'sky-chart-save-verification-v1.js?v=1',
          'sky-chart-active-sky-controls.js?v=3',
          'sky-chart-language-cleanup.js?v=5',
          'sky-chart-wizard-ui-state-fix.js?v=6',
          'sky-chart-aspect-keyboard.js?v=1'
        ].forEach(appendScript);
      }
      appendScript(preview === 'pr22' ? 'sky-chart-relationship-color-hints-pr22.js?v=1' : 'sky-chart-relationship-color-hints.js?v=3');
    }
  }
  function start() {
    initAnalytics(); ensureNavStyles(); loadEnhancements(); if (document.querySelector('.menu-container')) return initMenu();
    fetch('nav.html?v=14').then(function (response) { if (!response.ok) throw new Error('Could not load nav.html'); return response.text(); }).then(injectNav).catch(fallbackNav);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();