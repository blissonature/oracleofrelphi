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

assert.match(nav, /drawing-board-workflow-v2\.js\?v=31/);
assert.match(nav, /drawing-board-interactions-v1\.js\?v=4/);
assert.doesNotMatch(nav, /drawing-board-custom-position-stickers-v1\.js/);
assert.match(nav, /drawing-board-template-lifecycle-v1\.js\?v=2/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=16/);
assert.match(page, /navloader\.js\?v=60/);
assert.match(page, /tarot-app\.js\?v=360/);

assert.match(workflow, /Show position stickers/);
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
assert.doesNotMatch(workflow, /const create = group\('create'\)/);
assert.match(workflow, /board-history-menu/);
assert.doesNotMatch(workflow, /Spread design', 'Choose a reusable design or type position stickers for a custom one/);
assert.match(workflow, /> Show position stickers/);
assert.match(workflow, /What would you like to know\?/);
assert.doesNotMatch(workflow, /Reading details', 'Name the reading before drawing/);
assert.doesNotMatch(workflow, /Draw settings', 'Choose the pack, repeats, and reversals before drawing/);
assert.match(workflow, /move\(spreadSetup, control\('rowPositionLabels'\)\)/);
assert.match(workflow, /move\(spreadSetup, control\('rowDrawScope'\)\)/);
assert.match(workflow, /board-reading-toggle-stack/);
assert.match(workflow, /drawing-board-primary-actions/);
assert.match(workflow, /\['undoShortList','redoShortList','drawRandomRowCard','addCardPlaceholder','clearRowCardsOnly'\]/);
assert.match(workflow, /toggleStack\.appendChild\(stickerToggle\)/);
assert.match(workflow, /toggleStack\.appendChild\(repeatsToggle\)/);
assert.match(workflow, /toggleStack\.appendChild\(reversalsToggle\)/);
assert.match(workflow, /drawing-board-after-canvas/);
assert.match(workflow, /Write interpretation notes after you can see the cards\./);
assert.match(workflow, /Save or export after the reading is on the board\./);
assert.match(workflow, /move\(notesSection\.querySelector\('\.drawing-board-post-body'\), control\('rowNotes'\)\)/);
assert.match(workflow, /board-reading-toggle-stack\{order:40!important;display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
assert.match(workflow, /board-reading-toggle-stack>label input\[type="checkbox"\]\{grid-column:1!important;width:1rem!important;height:1rem!important;margin:0!important\}/);
assert.match(workflow, /function normalizeDisabledButtonCursors\(panel\)/);
assert.match(workflow, /button\.style\.setProperty\('cursor', 'default', 'important'\)/);
assert.match(workflow, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{[\s\S]*cursor:default!important\}/);
assert.match(workflow, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important/);
assert.match(interactions, /html body #shortListPanel \.board-history-icon:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important;box-shadow:none!important;cursor:default!important\}/);
assert.doesNotMatch(workflow, /move\(choices, '\.quick-position-sticker-toggle'\)/);
assert.match(workflow, /panel\.querySelector\('#rowPositionStickersQuick'\)/);
assert.match(workflow, /function installReadingOptionsDrawer\(panel\)/);
assert.match(workflow, /summary\.textContent = 'Reading Options'/);
assert.match(workflow, /relphi-reading-options-drawer/);
assert.match(workflow, /transform:translateX\(-100%\)!important/);
assert.doesNotMatch(workflow, /ensureNumberedStickers/);
assert.doesNotMatch(workflow, /<span>Reading setup<\/span>/);
assert.doesNotMatch(workflow, /setupGroup\(setup, 'arrange'/);
assert.match(workflow, /resetBoard\.textContent = 'Reset Board'/);
assert.match(workflow, /safeName \+ '\\.json'/);
assert.match(workflow, /safeName \+ '\\.html'/);
assert.match(workflow, /relphi-snap-icon/);
assert.match(workflow, /grid-template-columns:1\.2rem 1\.65rem 2rem minmax\(3\.6rem,auto\) 2rem!important/);
assert.match(workflow, /function installWorkspaceTools\(panel\)/);
assert.match(workflow, /data-tool="snaps"/);
assert.match(workflow, /data-tool="background"/);
assert.match(workflow, /relphi-background-row/);
assert.match(workflow, /relphi-snap-row/);
assert.match(workflow, /relphi-workspace-flyout/);
assert.match(workflow, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.match(workflow, /drawing-board-primary-actions/);
assert.match(workflow, /Save & export/);
assert.match(workflow, /Download board data \(JSON\)/);
assert.match(workflow, /Download web version/);
assert.match(workflow, /Print \/ save PDF/);
assert.match(workflow, /workspaceCardImageUpload/);
assert.match(workflow, /Upload board background image/);
assert.match(workflow, /Clear board background/);
assert.match(workflow, /applyEnvelopeColor/);
assert.match(workflow, /background-color', color, 'important'/);
assert.match(workflow, /card-row-workspace-toolbar\{border-radius:12px!important\}/);
assert.match(workflow, /board-options-toggle/);
assert.match(workflow, /board-options-tabs/);
assert.doesNotMatch(workflow, /className = 'board-arrange-flyout'/);
assert.doesNotMatch(workflow, /className = 'board-arrange-trigger'/);
assert.doesNotMatch(workflow, /workspaceToolbar\.appendChild\(flyout\)/);
assert.match(workflow, /card-row-position-label\{grid-column:1\/-1!important;grid-row:1!important\}/);
assert.match(workflow, /repeat\(3,minmax\(0,1fr\)\)/);
assert.doesNotMatch(workflow, /setAttribute\('role', 'tablist'\)/);
assert.match(workflow, /board-options-body/);
assert.match(workflow, /is-collapsed/);
assert.match(workflow, /aria-expanded/);
assert.match(workflow, /grid-template-columns:1fr!important/);
assert.match(workflow, /accent-color:#111!important/);
assert.match(workflow, /card-row-placeholder-item\{height:max-content!important;min-height:0!important/);
assert.match(workflow, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.match(workflow, /card-row-control-block--layout \.board-options-body\{display:grid!important;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
assert.match(workflow, /board-snap-control\{grid-template-columns:minmax\(6\.5rem,1fr\) 2rem/);
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
