// Cache-busted navigation and encoding repairs for Astrology Foundations.
// Glyph rendering is owned exclusively by astrology-foundations-canonical-glyphs-v1.js.
(function () {
  'use strict';
  if (!/(^|\/)astrology-foundations\.html$/.test(location.pathname)) return;

  const VALID_TABS = new Set(['houses','signs','planets','moon','aspects','tonic','systems','ancient','orders','wheel']);
  const REPAIRS = [
    [/Â·/g,'·'],[/â†’/g,'→'],[/â€”/g,'—'],[/â€“/g,'–'],[/â€™/g,'’'],
    [/â€œ/g,'“'],[/â€/g,'”'],[/â€¦/g,'…'],[/â—Ž/g,'◎'],[/â˜/g,'☍'],
    [/â–³/g,'△'],[/â–¡/g,'□'],[/âš¹/g,'⚹'],[/âˆ /g,'∠'],[/âšº/g,'⚺']
  ];
  let applyingHistory = false;

  function repairString(value) {
    let next = value;
    REPAIRS.forEach(pair => { next = next.replace(pair[0], pair[1]); });
    return next;
  }

  function repairVisibleText(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fixed = repairString(node.nodeValue || '');
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
    });
    if (document.title) document.title = repairString(document.title);
  }

  function tabFromHash() {
    const raw = location.hash.replace(/^#/, '').split('/')[0].toLowerCase();
    return VALID_TABS.has(raw) ? raw : 'houses';
  }

  function activateTabFromLocation() {
    const kind = tabFromHash();
    const button = document.querySelector('.foundation-tabs button[data-kind="' + kind + '"]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    applyingHistory = true;
    button.click();
    requestAnimationFrame(() => { applyingHistory = false; });
  }

  function installHistory() {
    document.addEventListener('click', event => {
      const button = event.target.closest('.foundation-tabs button[data-kind]');
      if (!button || applyingHistory) return;
      const kind = button.dataset.kind;
      if (!VALID_TABS.has(kind)) return;
      const nextHash = '#' + kind;
      if (location.hash !== nextHash) history.pushState({ foundationTab:kind }, '', nextHash);
    }, true);
    window.addEventListener('popstate', activateTabFromLocation);
    window.addEventListener('hashchange', activateTabFromLocation);
    activateTabFromLocation();
  }

  function start() {
    installHistory();
    repairVisibleText(document.body);
    let queued = false;
    new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        repairVisibleText(document.body);
      });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
