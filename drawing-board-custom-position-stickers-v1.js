// Compatibility repair: free text in the Drawing Board template field must remain position-sticker labels.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiCustomPositionStickerRegistrationFix) return;
  window.__relphiCustomPositionStickerRegistrationFix = true;

  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const TEMPLATE_PROMPT = 'Enter a name for the new Spread Template…';
  let wrappedBindings = 0;

  function usesCapture(options) {
    return options === true || !!(options && typeof options === 'object' && options.capture);
  }

  function isTemplateChoice(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return false;
    return Array.from(document.querySelectorAll('#rowStickerPresetList option')).some(option =>
      String(option.value || '').trim().toLowerCase() === normalized
    );
  }

  function nonBlockingEvent(event) {
    return new Proxy(event, {
      get(target, property) {
        if (property === 'preventDefault' || property === 'stopImmediatePropagation' || property === 'stopPropagation') {
          return function () {};
        }
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  }

  function wrapOmniboxHandler(field, listener) {
    return function (event) {
      const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
      const value = String(field.value || '').trim();

      // Template selection and template-name editing still belong to the prefab module.
      if (state?.designMode || value === TEMPLATE_PROMPT || isTemplateChoice(value)) {
        return listener.call(this, event);
      }

      // Free text belongs to the Drawing Board's original position-label listener.
      // Let the prefab module update only its mode/state, without consuming the real event
      // or mistaking the labels themselves for the reusable template name.
      const rawValue = field.value;
      try {
        field.value = '';
        listener.call(this, nonBlockingEvent(event));
      } finally {
        field.value = rawValue;
      }
    };
  }

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    const isPositionField = this && this.id === 'rowPositionLabels';
    const isPrefabOmniboxHandler = typeof listener === 'function' && listener.name === 'chooseFromOmnibox';
    const isRelevantEvent = type === 'input' || type === 'change';

    if (isPositionField && isPrefabOmniboxHandler && isRelevantEvent && usesCapture(options)) {
      wrappedBindings += 1;
      const result = nativeAddEventListener.call(this, type, wrapOmniboxHandler(this, listener), options);
      if (wrappedBindings >= 2) EventTarget.prototype.addEventListener = nativeAddEventListener;
      return result;
    }

    return nativeAddEventListener.call(this, type, listener, options);
  };
})();
