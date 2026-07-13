// Oracle of Relphi navigation menu behavior.
// Safe to load before or after nav.html is injected.
(function () {
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

      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(container, button, !container.classList.contains('active'));
      });

      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) setOpen(container, button, false);
      });
    });
  }

  function loadAstrologyFoundationGlyphs() {
    if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;
    if (document.querySelector('script[src^="planet-glyph-loader.js"]')) return;

    const script = document.createElement('script');
    script.src = 'planet-glyph-loader.js?v=1';
    document.body.appendChild(script);
  }

  document.addEventListener('click', function (event) {
    document.querySelectorAll('.menu-container.active').forEach(function (container) {
      if (!container.contains(event.target)) {
        setOpen(container, container.querySelector('.logo-btn, #menuButton'), false);
      }
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
      loadAstrologyFoundationGlyphs();
    });
  } else {
    initRelphiMenu();
    loadAstrologyFoundationGlyphs();
  }
})();
