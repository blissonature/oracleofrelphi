// Turns an already-completed two-slot workspace into a V3 restore transaction.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const params = new URLSearchParams(location.search);
  if (!params.has('v3restore') || params.has('v3resume')) return;

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function hasPlacements(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return false;
    return Object.values(source).some(function (item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const degree = item.degree;
      return String(item.sign || '').trim() || (degree !== '' && degree != null && Number.isFinite(Number(degree)));
    });
  }

  const a = read('relphiTarotChart');
  const b = read('relphiCurrentSky');
  if (!hasPlacements(a) || !hasPlacements(b)) return;

  try {
    sessionStorage.setItem('relphiWizardV3Resume', JSON.stringify({
      skyA:a.name || 'Sky A',
      skyB:b.name || 'Sky B',
      savedAt:Date.now()
    }));
  } catch (_) { return; }

  params.delete('v3restore');
  params.set('v3resume', String(Date.now()));
  const url = new URL(location.href);
  url.search = params.toString();
  location.replace(url.toString());
})();
