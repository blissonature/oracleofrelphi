// Selected Relationship updates in place; they must never pull the page down automatically.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSelectedRelationshipScrollLockV1) return;
  window.__relphiSelectedRelationshipScrollLockV1 = true;

  const nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (...args) {
    const selectedPanel = this.id === 'skySelectedRelationship'
      ? this
      : this.closest?.('#skySelectedRelationship');
    if (selectedPanel) {
      selectedPanel.dataset.automaticScrollSuppressed = 'true';
      window.dispatchEvent(new CustomEvent('relphi:selected-relationship-scroll-suppressed'));
      return;
    }
    return nativeScrollIntoView.apply(this, args);
  };
})();
