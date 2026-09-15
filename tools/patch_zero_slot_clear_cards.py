from pathlib import Path

# Clear Cards must not manufacture placeholders for a freeform board.
p = Path('tarot-app.js')
text = p.read_text()
old = """  function commitShortList(next, options = {}) {
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
new = """  function commitShortList(next) {
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
if old not in text:
    raise SystemExit('tarot-app Clear Cards anchor not found')
p.write_text(text.replace(old, new, 1))

# The outer Drawing Board open/closed state is authoritative in its trigger.
# Re-renders must not hide an already-open zero-slot board because of stale
# module-local state.
p = Path('drawing-board-workflow-v2.js')
text = p.read_text()
old = """    if (!initialized) {
      boardOpen=!root.hidden && trigger?.getAttribute('aria-expanded')==='true';
      initialized=true;
    }
    if (!boardOpen) {
"""
new = """    if (!initialized) initialized=true;
    boardOpen=trigger?.getAttribute('aria-expanded')==='true';
    if (!boardOpen) {
"""
if old not in text:
    raise SystemExit('workflow enhance open-state anchor not found')
text = text.replace(old, new, 1)
old = """    if (trigger) {
      event.preventDefault(); event.stopImmediatePropagation();
      setBoardOpen(!boardOpen,{fit:!boardOpen});
      return;
    }
"""
new = """    if (trigger) {
      event.preventDefault(); event.stopImmediatePropagation();
      const wasOpen=trigger.getAttribute('aria-expanded')==='true';
      setBoardOpen(!wasOpen,{fit:!wasOpen});
      return;
    }
"""
if old not in text:
    raise SystemExit('workflow toggle anchor not found')
p.write_text(text.replace(old, new, 1))
