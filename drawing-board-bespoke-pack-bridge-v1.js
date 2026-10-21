// Preserve the native shuffled draw and reversal rules while allowing a crafted
// question to select its own sub-pack independently of the append order.
(function () {
  'use strict';
  const ledger=window.RelphiTarotLedgerBridge;
  if (!ledger || ledger.drawCardForBoardScope) return;

  function drawCardForBoardScope(value) {
    const options=window.RelphiDrawingBoardOptionsBridge;
    const root=document.querySelector('#shortListPanel');
    if (!options?.capture || !options?.restore || !root) return false;
    const before=options.capture();
    const index=(before.shortList || []).length;
    const requested=String(value || 'full');
    const original=before.rowPositionMeta?.[index] || {};
    const originalScope=String(original.drawScope || before.rowActiveLayout?.positions?.[index]?.drawScope || before.rowDrawScope || 'full');
    const override=originalScope!==requested;

    if (override) {
      before.rowPositionMeta=Array.isArray(before.rowPositionMeta)?before.rowPositionMeta:[];
      before.rowPositionMeta[index]={...original,drawScope:requested};
      options.restore(before);
    }

    try {
      const button=root.querySelector('#drawRandomRowCard');
      if (!button || button.disabled) return false;
      button.click();
      return (options.capture().shortList || []).length===index+1;
    } finally {
      // The override belongs to this draw only, not to the question that will
      // occupy this slot when the workflow reorders the board.
      if (override) {
        const after=options.capture();
        if (Array.isArray(after.rowPositionMeta) && after.rowPositionMeta[index]) {
          if (Object.hasOwn(original,'drawScope')) after.rowPositionMeta[index].drawScope=original.drawScope;
          else delete after.rowPositionMeta[index].drawScope;
          options.restore(after);
        }
      }
    }
  }

  window.RelphiTarotLedgerBridge=Object.freeze({...ledger,drawCardForBoardScope});
})();
