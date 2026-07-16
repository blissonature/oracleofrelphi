// Loads shared navigation and initializes the menu after nav.html is present.
(function () {
  function initGoogleAnalytics() {
    const measurementId = 'G-PNWZP2MW64';
    const isProduction = /(^|\.)oracleofrelphi\.com$/i.test(window.location.hostname);
    if (!isProduction || document.getElementById('relphi-google-tag')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const script = document.createElement('script');
    script.id = 'relphi-google-tag';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  initGoogleAnalytics();

  const relphiNavCss = `
.menu-container {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 999;
}
.logo-btn {
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  padding: 0;
  width: 48px; height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
}
.logo-btn:focus {
  box-shadow: 0 0 0 3px rgba(220,31,24,.30);
}
.logo-btn img {
  display: block;
  width: 44px;
  height: 44px;
}
.dropdown-menu {
  display: none;
  position: absolute;
  top: 56px;
  left: 0;
  min-width: 180px;
  background: #111;
  border-radius: 1.25em;
  box-shadow: 0 8px 32px rgba(0,0,0,0.26);
  padding: 0.7em 0;
  text-align: left;
  border: 2px solid #fff;
}
.dropdown-menu summary {
  color: #fff;
  padding: 1em 1.5em 0.55em;
  font-size: 1.12em;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}
.dropdown-menu .nav-tool-group a {
  padding-left: 2.25em;
  font-size: 1em;
}
.dropdown-menu a {
  display: block;
  color: #fff;
  text-decoration: none;
  padding: 1em 1.5em;
  font-size: 1.12em;
  border-radius: 0.8em;
  transition: background 0.18s, color 0.18s;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.dropdown-menu a:hover,
.dropdown-menu a:focus {
  background: #dc1f18;
  color: #fff;
  outline: none;
}
.menu-container.active .dropdown-menu {
  display: block;
  animation: fadeIn 0.15s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px);}
  to { opacity: 1; transform: translateY(0);}
}
@media (max-width: 600px) {
  .dropdown-menu {
    min-width: 130px;
    left: -10px;
  }
}`;

  function hasSharedStyleSheet() {
    return Array.prototype.some.call(document.querySelectorAll('link[rel~="stylesheet"]'), function (link) {
      const href = link.getAttribute('href') || '';
      return /(^|\/)style\.css(?:[?#].*)?$/.test(href);
    });
  }

  function appendScript(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.src = src;
    document.body.appendChild(script);
  }

  function loadPageEnhancements() {
    if (/(^|\/)planetaryhours\.html$/.test(window.location.pathname)) {
      appendScript('planetary-hours-location-prompt.js?v=4');
      appendScript('standardize-zodiac-wheels.js?v=4');
      appendScript('relphi-glyph-bubbles.js?v=2');
    }
    if (/(^|\/)sky-chart\.html$/.test(window.location.pathname)) {
      appendScript('sky-chart-stability-hotfix.js?v=1');
      appendScript('sky-chart-static-dynamic.js?v=2');
      appendScript('sky-chart-aspect-duration-fix.js?v=2');
      appendScript('sky-chart-relationship-language.js?v=1');
      appendScript('sky-chart-related-relationships-v2.js?v=2');
      appendScript('sky-ledger-glyph-alignment.js?v=1');
      appendScript('sky-ledger-wheel-glyphs.js?v=2');
      appendScript('relphi-glyph-bubbles.js?v=2');
      appendScript('sky-chart-provenance-fix.js?v=1');
      appendScript('sky-chart-wizard-v2.js?v=4');
      appendScript('sky-chart-delay-comparison-render.js?v=1');
      appendScript('sky-chart-wizard-native-flow-fix.js?v=3');
      appendScript('sky-chart-active-sky-controls.js?v=2');
      appendScript('sky-chart-core-target-fix.js?v=1');
      appendScript('sky-chart-language-cleanup.js?v=5');
      const previewPr = new URLSearchParams(window.location.search).get('preview');
      if (previewPr === 'pr22') appendScript('sky-chart-relationship-color-hints-pr22.js?v=1');
      else appendScript('sky-chart-relationship-color-hints.js?v=3');
    }
  }

  function ensureNavStyles() {
    if (hasSharedStyleSheet() || document.getElementById('relphi-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-nav-style';
    style.textContent = relphiNavCss;
    document.head.appendChild(style);
  }

  function initMenu() {
    if (window.RelphiInitMenu) {
      window.RelphiInitMenu();
      return;
    }

    if (!document.querySelector('script[src^="menu.js"]')) {
      const script = document.createElement('script');
      script.src = 'menu.js?v=5';
      script.onload = function () {
        if (window.RelphiInitMenu) window.RelphiInitMenu();
      };
      document.body.appendChild(script);
    }
  }

  function injectNav(html) {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder && !placeholder.querySelector('.menu-container')) {
      placeholder.innerHTML = html;
    } else if (!document.querySelector('.menu-container')) {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.insertBefore(div, document.body.firstChild);
    }
    ensureNavStyles();
    initMenu();
  }

  function fallbackNav() {
    injectNav(`
<div class="menu-container" id="menuContainer">
  <button class="logo-btn" aria-label="Open navigation menu" aria-controls="dropdownMenu" aria-expanded="false" id="menuButton" type="button">
    <img src="logo.png" alt="Oracle of Relphi logo" width="44" height="44"/>
    <span class="nav-brand-text">Oracle of <span>Relphi</span></span>
    <span class="nav-edition-badge">Anniversary</span>
  </button>
  <nav class="dropdown-menu" id="dropdownMenu" aria-label="Main navigation">
    <a href="index.html">Home</a>
    <a href="tarot.html">Tarot Ledger</a>
    <a href="sky-chart.html">Sky Chart</a>
    <a href="planetaryhours.html">Planetary Hours</a>
    <a href="glyphs.html">Glyph Trainer</a>
    <details class="nav-tool-group">
      <summary>Study</summary>
      <a href="astrology-foundations.html">Astrology Foundations</a>
      <a href="constellations.html">Constellation Trainer</a>
      <a href="mythic-atlas.html">Mythic Atlas</a>
      <a href="ancient-measures.html">Ancient Measures</a>
      <a href="rainbow-brand.html">Rainbow Brand</a>
    </details>
    <a href="guide.html">Guide</a>
    <a href="about.html">About</a>
    <a href="services.html">Services</a>
    <a href="forsacreduseonly.html">For Sacred Use Only</a>
    <a href="https://ko-fi.com/oracleofrelphi" target="_blank" rel="noopener">Support</a>
  </nav>
</div>`);
  }

  function loadNav() {
    ensureNavStyles();
    loadPageEnhancements();

    if (document.querySelector('.menu-container')) {
      initMenu();
      return;
    }

    fetch('nav.html?v=14')
      .then(function (response) {
        if (!response.ok) throw new Error('Could not load nav.html');
        return response.text();
      })
      .then(injectNav)
      .catch(function (error) {
        console.error('RelphiNav: failed to load nav.html', error);
        fallbackNav();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNav);
  } else {
    loadNav();
  }
})();
