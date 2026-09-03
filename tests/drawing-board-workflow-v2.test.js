const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.js'), 'utf8');
const interactions = fs.readFileSync(path.join(root, 'drawing-board-interactions-v1.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');
const tarot = fs.readFileSync(path.join(root, 'tarot-app.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'tarot.html'), 'utf8');

assert.match(nav, /drawing-board-workflow-v2\.js\?v=30/);
assert.match(nav, /drawing-board-interactions-v1\.js\?v=5/);
assert.doesNotMatch(nav, /drawing-board-custom-position-stickers-v1\.js/);
assert.match(nav, /drawing-board-template-lifecycle-v1\.js\?v=3/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=15/);
assert.match(page, /navloader\.js\?v=59/);
assert.match(page, /tarot-app\.js\?v=360/);

assert.match(workflow, /> Labels/);
assert.match(workflow, /Position #/);
assert.doesNotMatch(workflow, /relphiDrawingBoardStickerPrefabsV1/);
assert.doesNotMatch(workflow, /Save as prefab/);
assert.doesNotMatch(workflow, /data-custom-sticker-prefab/);
assert.doesNotMatch(workflow, /function addPrefabControls/);
assert.doesNotMatch(workflow, /const PREFAB_KEY/);
assert.doesNotMatch(interactions, /select\.id = 'rowPositionPrefabSelect'/);
assert.doesNotMatch(interactions, /Choose a position-sticker prefab/);
assert.doesNotMatch(workflow, /rowStickerPrefabLoad/);
assert.doesNotMatch(workflow, /rowStickerPrefabApply/);
assert.doesNotMatch(workflow, /location\.reload\(\)/);
assert.doesNotMatch(workflow, /compactDefaultCards/);
assert.match(workflow, /user-select:text!important/);
assert.match(workflow, /function beginDescriptionSelection/);
assert.match(workflow, /function relphiLockedInterpretation/);
assert.match(workflow, /RELPHI_CARD_SENSES/);
assert.match(workflow, /locked_relphi_interpretation/);
assert.match(workflow, /RELPHI_LOCKED_INTERPRETATIONS/);
assert.match(workflow, /relphi_derived_interpretation/);
assert.match(workflow, /syncDescriptionLayers\(panel\)/);
assert.match(workflow, /card\.draggable = false/);
assert.match(workflow, /card\.draggable = true/);
assert.match(workflow, /descriptionSelecting/);
assert.match(workflow, /document\.addEventListener\('selectstart'/);
assert.match(workflow, /document\.addEventListener\('dragstart'/);
assert.match(workflow, /-webkit-user-drag:none!important/);
assert.match(workflow, /Helpful tip/);
assert.match(workflow, /removeUnavailableSelectionControls/);
assert.match(workflow, /'resetRowCardTransform', 'selectAllRow', 'clearRowSelection'/);
assert.match(workflow, /function organizeBoardOptions/);
assert.match(workflow, /function organizeBoardHeader/);
assert.match(workflow, /Spread template', 'Choose or edit the spread structure\.'/);
assert.match(workflow, /Reading details', 'Name the reading before drawing\.'/);
assert.match(workflow, /move\(spreadSetup, control\('rowPositionLabels'\)\)/);
assert.match(workflow, /move\(spreadSetup, panel\.querySelector\('#addCardPlaceholder'\)\)/);
assert.match(workflow, /settingsPanel\.open = false/);
assert.match(workflow, /settingsPanel\.open = !settingsPanel\.open/);
assert.match(workflow, /relphi-board-options-native-summary/);
assert.match(workflow, /board-options-master-toggle/);
assert.match(workflow, /normalizeSelect\('rowDrawScope', 'Pack', choices\)/);
assert.match(workflow, /normalizeToggle\('rowAllowReversalsQuick', 'Reversals', choices\)/);
assert.match(workflow, /normalizeToggle\('rowAllowRepeats', 'Repeats', choices\)/);
assert.match(workflow, /normalizeToggle\('rowPositionStickersQuick', 'Labels', choices\)/);
assert.match(workflow, /draw\.textContent = 'Draw'/);
assert.match(workflow, /undo\.textContent = 'Undo'/);
assert.match(workflow, /clearCards\.textContent = 'Clear Cards'/);
assert.match(workflow, /redo\.hidden = true/);
assert.match(workflow, /clearBoard\.textContent = 'Reset Board'/);
assert.match(workflow, /trigger\.title = 'Snaps and background'/);
assert.match(workflow, /board-flyout-group--snaps/);
assert.match(workflow, /board-flyout-group--background/);
assert.match(workflow, /board-arrange-flyout/);
assert.match(workflow, /drawing-board-after-canvas/);
assert.match(workflow, /Write interpretation notes after you can see the cards\./);
assert.match(workflow, /Save or export after the reading is on the board\./);
assert.match(workflow, /move\(notesSection\.querySelector\('\.drawing-board-post-body'\), control\('rowNotes'\)\)/);
assert.match(workflow, /card-row-drawing-board:not\(\[open\]\)>summary button/);
assert.doesNotMatch(workflow, /board-draw-toggles/);
assert.doesNotMatch(workflow, /setupGroup\(setup, 'draw'/);
assert.doesNotMatch(workflow, /setupGroup\(setup, 'arrange'/);
assert.match(interactions, /undo\.textContent = 'Undo'/);
assert.match(interactions, /redo\.hidden = true/);
assert.match(workflow, /function normalizeDisabledButtonCursors\(panel\)/);
assert.match(workflow, /button\.style\.setProperty\('cursor', 'default', 'important'\)/);
assert.match(workflow, /Save & export/);
assert.match(workflow, /Download board data \(JSON\)/);
assert.match(workflow, /Download web version/);
assert.match(workflow, /Print \/ save PDF/);
assert.match(workflow, /Card \/ placeholder/);
assert.match(workflow, /Upload image/);
assert.match(workflow, /Remove image/);
assert.match(workflow, /applyEnvelopeColor/);
assert.match(workflow, /background-color', color, 'important'/);
assert.match(workflow, /board-options-master-toggle/);
assert.match(workflow, /relphi-board-options-native-summary\{display:none!important/);
assert.match(workflow, /board-header-group--actions/);
assert.match(workflow, /board-header-group--choices/);
assert.match(workflow, /board-pack-control/);
assert.match(workflow, /board-quick-toggle/);
assert.match(workflow, /card-row-more-options:not\(\[open\]\)>\.card-row-composer\{display:none!important/);
assert.match(workflow, /board-arrange-flyout/);
assert.match(workflow, /board-arrange-trigger/);
assert.match(workflow, /workspaceToolbar\.appendChild\(flyout\)/);
assert.match(workflow, /board-flyout-group--snaps/);
assert.match(workflow, /board-flyout-group--background/);
assert.match(workflow, /is-collapsed/);
assert.match(workflow, /aria-expanded/);
assert.match(workflow, /accent-color:#111!important/);
assert.match(workflow, /'downloadRowHtml', 'downloadRowTextHtml', 'printCardRowImage', 'snapshotCardRowArrangement'/);
assert.match(page, />Hide Cards<\/button>/);
assert.doesNotMatch(page, /Search, draw, or build a board/);
assert.doesNotMatch(page, /tarot-entry-panel/);
assert.match(page, /tarot-command-panel--primary/);
assert.match(page, /relphiOpenDrawingBoardCurrent/);
assert.match(page, /Open Drawing Board/);
assert.match(workflow, /function openBoardFromLedger/);
assert.match(workflow, /card-row-drawing-board:has\(\.card-row-composer:not\(\.is-relphi-organized\)\)\{visibility:hidden!important\}/);
assert.match(workflow, /panel\.hidden = true/);
assert.match(workflow, /drawer\.open = true/);

assert.match(workflow, /assets\/tarot\/rws-export\//);
assert.match(workflow, /\.webp/);
assert.match(workflow, /Download web version/);
assert.match(workflow, /Oracle of Relphi/);
assert.match(workflow, /A Relphi reading/);
assert.match(workflow, /logo\.png/);
assert.match(workflow, /reading-notes/);
assert.match(workflow, /\.orientation\.is-reversed/);
assert.match(workflow, /printWindow\.print\(\)/);
assert.match(workflow, /card img\.reversed\{transform:rotate\(180deg\)\}/);

assert.match(tarot, /function rowCardInterpretation[\s\S]*layerInterpretationForOrientation/);
assert.match(tarot, /return reversed \? reversedDerivedMeaning\(card\) : layerInterpretation\(card\)/);
assert.match(tarot, /data-row-reverse=/);
assert.match(tarot, /reversed shows its core operation turning inward/);
assert.doesNotMatch(tarot, /Number layer under reversal/);
assert.match(tarot, /CARD_ROW_DEFAULT_GAP_X_PX = 0/);
assert.match(tarot, /CARD_ROW_DEFAULT_GAP_Y_PX = 0/);
assert.match(tarot, /CARD_ROW_LEGACY_DEFAULT_GAPS/);

const sandbox = {
  location:{ pathname:'/tarot.html', search:'', hash:'', href:'https://oracleofrelphi.com/tarot.html' },
  document:{ readyState:'loading', addEventListener(){} },
  localStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
  sessionStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} },
  URL, Intl, Date, Event, Blob, console
};
vm.createContext(sandbox);
vm.runInContext(workflow.replace(/\}\)\(\);\s*$/, 'globalThis.__printableHtml = printableHtml;\n})();'), sandbox);
const card = {
  dataset:{ rowCard:'the_fool', rowReversed:'false' },
  querySelector(selector) {
    if (selector === '.or-card-title-banner') return { textContent:'The Fool' };
    if (selector === '.or-layer-scroll span') return { textContent:'Breath before form and movement before identity.' };
    return null;
  }
};
const item = {
  classList:{ contains(){ return false; } },
  querySelector(selector) {
    if (selector === '[data-row-card]') return card;
    if (selector === '.card-row-position-editor') return { textContent:'The beginning' };
    return null;
  }
};
const panel = {
  querySelectorAll(){ return [item]; },
  querySelector(selector) {
    if (selector === '#rowName') return { value:'Sample Reading' };
    if (selector === '#rowNotes') return { value:'A sample note.' };
    return null;
  }
};
const exportedHtml = sandbox.__printableHtml(panel);
assert.match(exportedHtml, /<strong>Oracle of Relphi<\/strong>/);
assert.match(exportedHtml, /Sample Reading/);
assert.match(exportedHtml, /The beginning/);
assert.match(exportedHtml, /the_fool\.webp/);
assert.match(exportedHtml, /assets\/tarot\/rws-export\/the_fool\.webp/);
assert.match(exportedHtml, /A sample note\./);

console.log('Drawing Board workflow v2 regression checks passed.');
