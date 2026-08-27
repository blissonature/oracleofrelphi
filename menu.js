// Oracle of Relphi navigation menu behavior.
// Safe to load before or after nav.html is injected.
(function () {
  if (window.__relphiMenuControllerInstalled) {
    window.RelphiInitMenu?.();
    return;
  }
  window.__relphiMenuControllerInstalled = true;

  function setOpen(container, button, isOpen) {
    container.classList.toggle('active', isOpen);
    if (button) button.setAttribute('aria-expanded', String(isOpen));
  }

  function initRelphiMenu() {
    document.querySelectorAll('.menu-container').forEach(function (container) {
      if (container.dataset.menuReady === 'true') return;
      const button = container.querySelector('.logo-btn, #menuButton');
      const menu = container.querySelector('.dropdown-menu, #dropdownMenu');
      if (!button || !menu) return;
      container.dataset.menuReady = 'true';
      button.setAttribute('type', 'button');
      button.setAttribute('aria-controls', menu.id || 'dropdownMenu');
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function appendScript(src, onload) {
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
    document.body.appendChild(script);
    return script;
  }

  function loadCanonicalGlyphRuntime(onReady) {
    appendScript('https://oracleofrelphi.com/relphi-glyph-registry-v1.js?v=24', function () {
      appendScript('https://oracleofrelphi.com/relphi-glyph-component-v1.js?v=27', function () {
        appendScript('https://oracleofrelphi.com/relphi-moon-stroke-preservation-v1.js?v=1', function () {
          appendScript('https://oracleofrelphi.com/relphi-neptune-cross-connection-v1.js?v=1', onReady);
        });
      });
    });
  }

  function loadAstrologyFoundationEnhancements() {
    if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;
    // Astrology Foundations glyph loading is owned by navloader's single shared
    // Master Glyph runtime path. Preserve the authored matrix layout here.
    appendScript('astrology-foundations-consistency.js?v=1');
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('.menu-container .logo-btn, .menu-container #menuButton');
    if (button) {
      event.preventDefault();
      const container = button.closest('.menu-container');
      if (container) setOpen(container, button, !container.classList.contains('active'));
      return;
    }
    const menuLink = event.target.closest('.menu-container .dropdown-menu a');
    if (menuLink) {
      const container = menuLink.closest('.menu-container');
      if (container) setOpen(container, container.querySelector('.logo-btn, #menuButton'), false);
      return;
    }
    document.querySelectorAll('.menu-container.active').forEach(function (container) {
      if (!container.contains(event.target)) setOpen(container, container.querySelector('.logo-btn, #menuButton'), false);
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      document.querySelectorAll('.menu-container.active').forEach(function (container) {
        const button = container.querySelector('.logo-btn, #menuButton');
        setOpen(container, button, false);
        if (button) button.focus();
      });
    }
  });

  window.RelphiInitMenu = initRelphiMenu;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initRelphiMenu();
      loadAstrologyFoundationEnhancements();
    });
  } else {
    initRelphiMenu();
    loadAstrologyFoundationEnhancements();
  }
})();
