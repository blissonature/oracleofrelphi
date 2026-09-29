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
      initOmnibox(container);
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

  function normalizeOmniboxText(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function tarotPageUrl(query) {
    const url = new URL('tarot.html', document.baseURI);
    if (query) url.searchParams.set('q', query);
    return url.href;
  }

  function runRelphiCommand(command, query) {
    const onTarot = /(^|\/)tarot\.html$/.test(location.pathname) || window.__relphiTarotPreviewDocument === true;
    if (command === 'tarot-search') {
      if (!onTarot) { location.href = tarotPageUrl(query); return; }
      const input = document.getElementById('oracleCommand');
      if (input && query) input.value = query;
      document.getElementById('runCommand')?.click();
      document.querySelector('.menu-container.active')?.classList.remove('active');
      input?.focus();
      return;
    }
    if (command === 'drawing-board') {
      if (!onTarot) { location.href = new URL('tarot.html#shortListPanel', document.baseURI).href; return; }
      (document.getElementById('relphiOpenDrawingBoardCurrent') || document.getElementById('landingOpenBoard'))?.click();
      return;
    }
    if (command === 'show-all-cards') {
      if (!onTarot) { location.href = new URL('tarot.html?command=show-all', document.baseURI).href; return; }
      document.getElementById('showAllCards')?.click();
    }
  }

  function initOmnibox(container) {
    const input = container.querySelector('#relphiOmnibox');
    const results = container.querySelector('#relphiOmniboxResults');
    const browse = container.querySelector('#relphiOmniboxBrowse');
    if (!input || !results || !browse || input.dataset.omniboxReady === 'true') return;
    input.dataset.omniboxReady = 'true';

    const sourceItems = Array.from(browse.querySelectorAll('[data-omnibox-item], .relphi-omnibox-command'));
    function itemText(item) {
      return normalizeOmniboxText([item.textContent, item.dataset.keywords].join(' '));
    }
    function activate(item, query) {
      if (item.matches('.relphi-omnibox-command')) {
        runRelphiCommand(item.dataset.relphiCommand, query);
      } else if (item.href) {
        location.href = item.href;
      }
    }
    function render() {
      const raw = input.value.trim();
      const query = normalizeOmniboxText(raw);
      results.innerHTML = '';
      if (!query) {
        results.hidden = true;
        browse.hidden = false;
        return;
      }
      browse.hidden = true;
      const matches = sourceItems.filter(item => query.split(' ').every(term => itemText(item).includes(term))).slice(0, 8);
      matches.forEach(function (item, index) {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'relphi-omnibox-result';
        option.setAttribute('role', 'option');
        option.dataset.index = String(index);
        option.innerHTML = item.innerHTML;
        option.addEventListener('click', function () { activate(item, raw); });
        results.appendChild(option);
      });
      const tarot = document.createElement('button');
      tarot.type = 'button';
      tarot.className = 'relphi-omnibox-result relphi-omnibox-result--search';
      tarot.setAttribute('role', 'option');
      tarot.innerHTML = '<span>Search Tarot Ledger for “' + raw.replace(/[<>&"]/g, function(ch){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[ch];}) + '”</span><small>Card names · correspondences · themes</small>';
      tarot.addEventListener('click', function () { runRelphiCommand('tarot-search', raw); });
      results.appendChild(tarot);
      results.hidden = false;
    }
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      const first = results.querySelector('.relphi-omnibox-result');
      if (!first) return;
      event.preventDefault();
      first.click();
    });
    container.querySelectorAll('.relphi-omnibox-command').forEach(function (button) {
      button.addEventListener('click', function () { runRelphiCommand(button.dataset.relphiCommand, input.value.trim()); });
    });
  }

  function loadAstrologyFoundationEnhancements() {
    if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;
    // navloader.js owns the one canonical glyph runtime and study-glyph consumer.
    appendScript('astrology-foundations-mobile-signs.js?v=2');
    appendScript('astrology-foundations-consistency.js?v=1');
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('.menu-container .logo-btn, .menu-container #menuButton');
    if (button) {
      event.preventDefault();
      const container = button.closest('.menu-container');
      if (container) {
        const willOpen = !container.classList.contains('active');
        setOpen(container, button, willOpen);
        if (willOpen) setTimeout(function () { container.querySelector('#relphiOmnibox')?.focus(); }, 0);
      }
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
