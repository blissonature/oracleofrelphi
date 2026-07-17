// Ensures named-sky saves use the completed name and are verified against the saved library.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  function byId(id) { return document.getElementById(id); }
  function fire(el, type) { if (el) el.dispatchEvent(new Event(type, { bubbles:true })); }
  function completed() {
    const match = (byId('relphiSkyCompleteHeading')?.textContent || '').match(/^(.*?)\s+is now\s+(Sky [AB])$/i);
    return match ? { name:match[1].trim(), slot:match[2] } : null;
  }
  function exists(name) {
    return Array.from(byId('skyCreatorLibrary')?.options || []).some(function (option) {
      return option.value && option.textContent.trim().toLowerCase() === name.toLowerCase();
    });
  }
  function install() {
    document.addEventListener('click', function (event) {
      if (!event.target.closest?.('#relphiSaveActiveSky')) return;
      const record = completed();
      if (!record) return;
      const kind = record.slot === 'Sky B' ? 'currentSky' : 'chart';
      ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) { const el = byId(id); if (!el) return; el.value = kind; fire(el, 'input'); fire(el, 'change'); });
      ['skyCreatorName','skyCalcName'].forEach(function (id) { const el = byId(id); if (!el) return; el.value = record.name; fire(el, 'input'); fire(el, 'change'); });
      setTimeout(function () {
        const status = byId('relphiActiveSkyStatus');
        if (!status) return;
        if (exists(record.name)) status.textContent = 'Saved "' + record.name + '" to your saved skies.';
        else status.textContent = '"' + record.name + '" was not added to saved skies. Nothing was claimed as saved.';
      }, 1200);
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();