// Keep Drawing Board history entries on the standalone route even though the page uses a parent asset base.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardHistoryV1) return;
  window.__relphiDrawingBoardHistoryV1 = true;

  const normalize = value => {
    if (typeof value !== 'string' || !value.startsWith('#')) return value;
    return location.pathname + location.search + value;
  };

  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);

  history.pushState = function (state, title, url) {
    return push(state, title, normalize(url));
  };
  history.replaceState = function (state, title, url) {
    return replace(state, title, normalize(url));
  };
})();
