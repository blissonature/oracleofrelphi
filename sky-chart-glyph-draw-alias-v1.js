// Compatibility alias used by the Sky Chart Next display adapter.
(function () {
  'use strict';
  function install() {
    const component = window.RelphiGlyphComponent;
    if (!component || component.createGlyph) return !!component;
    window.RelphiGlyphComponent = Object.freeze({
      draw:component.draw,
      createGlyph:function (parent, identity, options) {
        const ready = component.draw(parent, identity, {
          radius:Number(options?.size || 19),
          padding:0,
          color:options?.color || '#171717',
          bubbleStrokeWidth:0
        });
        return { root:parent, ready:ready };
      },
      createBubble:component.createBubble,
      fit:component.fit,
      recolor:component.recolor
    });
    return true;
  }
  if (install()) return;
  const timer = setInterval(function () {
    if (install()) clearInterval(timer);
  }, 25);
  setTimeout(function () { clearInterval(timer); }, 8000);
})();