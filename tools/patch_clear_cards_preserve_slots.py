from pathlib import Path

p = Path('tarot-app.js')
text = p.read_text()
old = """  function commitShortList(next) {
    next = next.filter(Boolean);
    if (shortListSame(state.shortList, next)) return;
    if (next.length && state.rowLayoutDesignMode) return;
    pushBoardUndo();
    if (next.length) {
      state.rowLayoutLocked = true;
      state.rowLayoutDesignMode = false;
    }
    state.shortList = next;
    state.shortListSelection = state.shortListSelection.filter(id => next.includes(id));
    setRowCardReversalArray(rowCardReversalArray(next.length));
    refreshShortListViews();
  }
  function clearShortListCardsOnlyNative() {
    if (!(state.shortList || []).length) return;
    commitShortList([]);
  }
"""
new = """  function commitShortList(next, options = {}) {
    next = next.filter(Boolean);
    if (shortListSame(state.shortList, next)) return;
    if (next.length && state.rowLayoutDesignMode) return;
    const preserveSlotCount = options.preserveSlots ? rowSlotCount() : 0;
    pushBoardUndo();
    if (next.length) {
      state.rowLayoutLocked = true;
      state.rowLayoutDesignMode = false;
    }
    state.shortList = next;
    if (preserveSlotCount && rowSlotCount(next.length) < preserveSlotCount) {
      const labels = (state.shortListPositionLabels || []).slice();
      while (labels.length < preserveSlotCount) labels.push('');
      state.shortListPositionLabels = labels;
    }
    state.shortListSelection = state.shortListSelection.filter(id => next.includes(id));
    setRowCardReversalArray(rowCardReversalArray(next.length));
    refreshShortListViews();
  }
  function clearShortListCardsOnlyNative() {
    if (!(state.shortList || []).length) return;
    commitShortList([], { preserveSlots: true });
  }
"""
if old not in text:
    raise SystemExit('Clear Cards native anchor not found')
p.write_text(text.replace(old, new, 1))
