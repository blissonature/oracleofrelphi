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
const style = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const workflowCss = fs.readFileSync(path.join(root, 'drawing-board-workflow-v2.css'), 'utf8');
const workflowUi = workflow + '\n' + workflowCss;

assert.match(nav, /drawing-board-workflow-v2\.js\?v=52/);
assert.match(nav, /drawing-board-interactions-v1\.js\?v=7/);
assert.match(nav, /drawing-board-template-lifecycle-v1\.js\?v=3/);
assert.match(nav, /drawing-board-spread-prefabs-v1\.js\?v=28/);
assert.match(page, /style\.css\?v=350/);
assert.match(page, /drawing-board-workflow-v2\.css\?v=6/);
assert.match(page, /navloader\.js\?v=82/);
assert.match(page, /tarot-app\.js\?v=364/);
assert.doesNotMatch(workflow, /document\.createElement\('style'\)|style\.textContent|document\.head\.appendChild\(style\)/);
assert.equal((workflow.match(/installOptionsButton\(panel\)/g) || []).length, 2);
assert.doesNotMatch(workflow, /board-arrange-flyout|board-arrange-trigger/);
['board-options-tabs','board-options-toggle','board-options-heading','board-snap-control','card-row-control-block--layout','board-setup-group--arrange','board-setup-group--draw','board-reading-behavior-row','board-header-group--create','board-header-group--choices'].forEach(token => {
  assert.equal(workflowCss.includes(token), false, 'retired Drawing Board CSS survived consolidation: ' + token);
});
assert.match(workflowCss, /Drawing Board workflow UI/);





assert.match(page, /tarot-app\.js\?v=364/);

assert.match(workflowUi, /Position Stickers/);
assert.match(workflowUi, /Position #/);
assert.doesNotMatch(workflowUi, /relphiDrawingBoardStickerPrefabsV1/);
assert.doesNotMatch(workflowUi, /Save as prefab/);
assert.doesNotMatch(workflowUi, /data-custom-sticker-prefab/);
assert.doesNotMatch(workflowUi, /function addPrefabControls/);
assert.doesNotMatch(workflowUi, /const PREFAB_KEY/);
assert.doesNotMatch(interactions, /select\.id = 'rowPositionPrefabSelect'/);
assert.doesNotMatch(interactions, /Choose a position-sticker prefab/);
assert.doesNotMatch(workflowUi, /rowStickerPrefabLoad/);
assert.doesNotMatch(workflowUi, /rowStickerPrefabApply/);
assert.doesNotMatch(workflowUi, /location\.reload\(\)/);
assert.doesNotMatch(workflowUi, /compactDefaultCards/);
assert.match(workflowUi, /user-select:text!important/);
assert.match(workflowUi, /function beginDescriptionSelection/);
assert.match(workflowUi, /function relphiLockedInterpretation/);
assert.match(workflowUi, /RELPHI_CARD_SENSES/);
assert.match(workflowUi, /locked_relphi_interpretation/);
assert.match(workflowUi, /RELPHI_LOCKED_INTERPRETATIONS/);
assert.match(workflowUi, /relphi_derived_interpretation/);
assert.match(workflowUi, /syncDescriptionLayers\(panel\)/);
assert.match(workflowUi, /card\.draggable = false/);
assert.match(workflowUi, /card\.draggable = true/);
assert.match(workflowUi, /descriptionSelecting/);
assert.match(workflowUi, /document\.addEventListener\('selectstart'/);
assert.match(workflowUi, /document\.addEventListener\('dragstart'/);
assert.match(workflowUi, /-webkit-user-drag:none!important/);
assert.match(workflowUi, /Helpful tip/);
assert.match(workflowUi, /removeUnavailableSelectionControls/);
assert.match(workflowUi, /'resetRowCardTransform', 'selectAllRow', 'clearRowSelection'/);
assert.match(workflowUi, /function organizeBoardOptions/);
assert.match(workflowUi, /function organizeBoardHeader/);
assert.doesNotMatch(workflowUi, /const create = group\('create'\)/);
assert.match(workflowUi, /board-history-menu/);
assert.doesNotMatch(workflowUi, /Spread design', 'Choose a reusable design or type position stickers for a custom one/);
assert.match(workflowUi, /> Position Stickers/);
assert.match(workflowUi, /Board Options/);
assert.doesNotMatch(workflowUi, /Reading details', 'Name the reading before drawing/);
assert.doesNotMatch(workflowUi, /Draw settings', 'Choose the pack, repeats, and reversals before drawing/);
assert.match(workflowUi, /const readingName = control\('rowName'\)/);
assert.match(workflowUi, /textNode\.textContent = 'Reading Name '/);
assert.match(workflowUi, /move\(spreadSetup, readingName\)/);
assert.match(workflowUi, /move\(spreadSetup, control\('rowPositionLabels'\)\)/);
assert.match(workflowUi, /drawSettingsRow\.className = 'board-draw-settings-row'/);
assert.match(workflowUi, /packControl\.classList\.remove\('relphi-fixed-full-pack'\)/);
assert.match(workflowUi, /move\(drawSettingsRow, packControl\)/);
assert.match(workflowUi, /board-reading-toggle-stack/);
assert.match(workflowUi, /drawing-board-primary-actions/);
assert.match(workflowUi, /function installBoardControllerAutoHide\(panel\)/);
assert.match(workflowUi, /relphi-board-controller-hotzone--actions/);
assert.match(workflowUi, /relphi-board-controller-hotzone--tools/);
assert.match(workflowUi, /relphi-board-controller-hotzone--zoom/);
assert.match(workflowUi, /window\.setTimeout\(hide, 1000\)/);
assert.match(workflowUi, /is-controller-idle/);
assert.match(workflowUi, /installBoardControllerAutoHide\(panel\)/);
assert.match(workflowUi, /\['undoShortList','redoShortList','drawRandomRowCard','addCardPlaceholder','clearRowCardsOnly'\]/);
assert.match(workflowUi, /renameToggle\(stickerToggle, 'Position Stickers'\)/);
assert.match(workflowUi, /renameToggle\(repeatsToggle, 'Repeats'\)/);
assert.match(workflowUi, /renameToggle\(reversalsToggle, 'Reversals'\)/);
assert.match(workflowUi, /drawing-board-after-canvas/);
assert.match(workflowUi, /Write interpretation notes after you can see the cards\./);
assert.match(workflowUi, /Save or export after the reading is on the board\./);
assert.match(workflowUi, /move\(notesSection\.querySelector\('\.drawing-board-post-body'\), control\('rowNotes'\)\)/);
assert.match(workflowUi, /function normalizeDisabledButtonCursors\(panel\)/);
assert.match(workflowUi, /button\.style\.setProperty\('cursor', 'default', 'important'\)/);
assert.match(workflowUi, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{[\s\S]*cursor:default!important\}/);
assert.match(workflowUi, /#undoShortList:disabled[\s\S]*#redoShortList:disabled[\s\S]*#clearShortList:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important/);
assert.match(interactions, /html body #shortListPanel \.board-history-icon:disabled\{opacity:\.4!important;border:1px solid rgba\(17,17,17,\.28\)!important;background:#fffdf8!important;color:rgba\(17,17,17,\.48\)!important;box-shadow:none!important;cursor:default!important\}/);
assert.doesNotMatch(workflowUi, /move\(choices, '\.quick-position-sticker-toggle'\)/);
assert.match(workflowUi, /panel\.querySelector\('#rowPositionStickersQuick'\)/);
assert.match(workflowUi, /function installReadingOptionsDrawer\(panel\)/);
assert.match(workflowUi, /relphiDrawingBoardPositionStickersV2/);
assert.match(workflowUi, /function ensureReadyToDrawDefaults\(panel\)/);
assert.match(workflowUi, /drawScope\.value = 'full'/);
assert.match(workflowUi, /reversals\.checked = true/);
assert.match(workflowUi, /setStickersEnabled\(false\)/);
assert.doesNotMatch(workflowUi, /function readingOptionsResetState\(panel\)/);
assert.doesNotMatch(workflowUi, /function readingOptionsAutoCloseReady\(panel\)/);
assert.match(workflowUi, /function syncReadingOptionsDrawer\(panel\)/);
assert.match(workflowUi, /panel\.dataset\.relphiReadingOptionsOpen === 'true'/);
assert.match(workflowUi, /function installOptionsButton\(panel\)/);
assert.match(workflowUi, /button\.id = 'drawingBoardOptionsButton'/);
assert.match(workflowUi, /button\.textContent = 'Options'/);
assert.match(workflowUi, /button\.setAttribute\('aria-controls', 'drawingBoardReadingOptions'\)/);
assert.match(tarot, /<summary><strong>Drawing Board <span class="card-row-count">\$\{items\.length\}<\/span><\/strong><\/summary>/);
assert.match(tarot, /card-row-icon-toolbar card-row-action-staging/);
assert.doesNotMatch(tarot, /<summary>[\s\S]{0,900}card-row-icon-toolbar/);
assert.match(workflow, /if \(resetBoard\) primaryActions\.appendChild\(resetBoard\)/);
assert.match(workflow, /const anchor = actionRow\?\.contains\(reset\) \? reset : \(clearCards \|\| reset\)/);
assert.match(workflowCss, /v3 single Options \+ compact pack controls \+ collapsed title only/);
assert.match(workflowCss, /board-draw-settings-row > \.card-row-draw-scope-label[\s\S]{0,180}grid-column:1!important/);
assert.match(workflowCss, /board-draw-settings-row > \.board-reading-toggle-stack[\s\S]{0,180}grid-column:2!important/);
assert.match(workflowCss, /board-reading-toggle-stack > label[\s\S]{0,180}grid-column:auto!important/);
assert.match(workflowCss, /card-row-action-staging[\s\S]{0,80}display:none!important/);
assert.match(workflowUi, /setReadingOptionsOpen\(panel, opening\)/);
assert.doesNotMatch(workflowUi, /setup\.id = 'drawingBoardSetupButton'/);
assert.doesNotMatch(workflowUi, /function setCompactOptionsOpen/);
assert.doesNotMatch(workflowUi, /drawingBoardSetupButton/);
assert.doesNotMatch(workflowUi, /drawingBoardOptionsPopover/);
assert.doesNotMatch(workflowUi, /drawing-board-settings-wrap/);
assert.doesNotMatch(workflowUi, /popover\.id = 'drawingBoardOptionsPopover'/);
assert.match(workflowUi, /drawSettingsRow\.appendChild\(toggleStack\)/);
assert.match(workflowUi, /board-draw-settings-row\{display:grid!important;grid-template-columns:minmax\(10rem,1\.15fr\) minmax\(18rem,2\.85fr\)!important/);
assert.match(workflowUi, /board-draw-settings-row \.board-reading-toggle-stack\{display:grid!important;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
assert.match(workflowUi, /relphi-fixed-full-pack\{display:block!important\}/);
assert.match(workflowUi, /relphi-reading-options-drawer:not\(\.is-reading-options-open\)\{display:none!important\}/);
assert.match(workflowUi, /relphi-reading-options-drawer>summary\{display:none!important\}/);
assert.match(workflow, /summary\.textContent = 'Board Options'/);
assert.match(workflow, /panel\.dataset\.relphiReadingOptionsOpen = 'false'/);
assert.match(workflow, /setReadingOptionsOpen\(panel, false\)/);
assert.match(workflow, /renameToggle\(stickerToggle, 'Position Stickers'\)/);
assert.match(workflow, /renameToggle\(repeatsToggle, 'Repeats'\)/);
assert.match(workflow, /renameToggle\(reversalsToggle, 'Reversals'\)/);
assert.match(workflow, /move\(drawSettingsRow, packControl\)/);
assert.doesNotMatch(workflow, /drawing-board-title/);
assert.doesNotMatch(workflowCss, /card-row-drawing-board:has\(\.card-row-composer:not\(\.is-relphi-organized\)\)\{visibility:hidden!important\}/);
assert.match(workflowCss, /v5 confirmed Board Options ownership/);
assert.match(workflowCss, /board-setup-group--spread>\.card-row-name-label/);
assert.match(workflowCss, /relphi-position-label-storage/);
assert.match(workflowCss, /board-draw-settings-row/);
assert.match(style, /Drawing Board collapsed state: title only\./);
assert.match(style, /card-row-drawing-board:not\(\[open\]\) > summary \.card-row-icon-toolbar/);

assert.match(workflowUi, /workspace\.insertAdjacentElement\('beforebegin', drawer\)/);
assert.doesNotMatch(workflowUi, /auto-reset/);
assert.doesNotMatch(workflowUi, /relphiReadingOptionsMode/);


assert.doesNotMatch(workflowUi, /relphi-reading-options-hotzone/);
assert.doesNotMatch(workflowUi, /translateX\(-100%\)/);
assert.doesNotMatch(workflowUi, /openFromEdge/);
assert.doesNotMatch(workflowUi, /ensureNumberedStickers/);
assert.doesNotMatch(workflowUi, /<span>Reading setup<\/span>/);
assert.doesNotMatch(workflowUi, /setupGroup\(setup, 'arrange'/);
assert.match(workflowUi, /resetBoard\.textContent = 'Reset Board'/);
assert.match(workflowUi, /safeName \+ '\\.json'/);
assert.match(workflowUi, /safeName \+ '\\.html'/);
assert.match(workflowUi, /relphi-snap-icon/);
assert.match(workflowUi, /grid-template-columns:1\.2rem 1\.65rem 2rem minmax\(3\.6rem,auto\) 2rem!important/);
assert.match(workflowUi, /function installWorkspaceTools\(panel\)/);
assert.match(workflowUi, /data-tool="snaps"/);
assert.match(workflowUi, /data-tool="background"/);
assert.match(workflowUi, /relphi-background-row/);
assert.match(workflowUi, /relphi-snap-row/);
assert.match(workflowUi, /relphi-workspace-flyout/);
assert.match(workflowUi, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.match(workflowUi, /drawing-board-primary-actions/);
assert.match(workflowUi, /Save & export/);
assert.match(workflowUi, /Download board data \(JSON\)/);
assert.match(workflowUi, /Download web version/);
assert.match(workflowUi, /Print \/ save PDF/);
assert.match(workflowUi, /workspaceCardImageUpload/);
assert.match(workflowUi, /Upload board background image/);
assert.match(workflowUi, /Clear board background/);
assert.match(workflowUi, /BOARD_TEXTURE_KEY = 'relphiDrawingBoardTextureV1'/);
assert.match(workflowUi, /DEFAULT_BOARD_TEXTURE = 'felt'/);
assert.match(workflowUi, /DEFAULT_BOARD_COLOR = '#7d1f28'/);
assert.match(workflowUi, /workspaceBoardTexture/);
assert.match(workflowUi, /function applyBoardTexture\(panel\)/);
assert.match(workflowUi, /Felt/);
assert.match(workflowUi, /Linen/);
assert.match(workflowUi, /Herringbone/);
assert.match(style, /var\(--relphi-board-texture, none\)/);
assert.equal((style.match(/repeating-linear-gradient\(0deg/g) || []).length, 1);
assert.match(style, /planet-thumb--jupiter/);
assert.doesNotMatch(style, /short-list-row\.card-row-board[\s\S]{0,650}repeating-linear-gradient/);
assert.doesNotMatch(style, /card-row-workspace \.short-list-row\.card-row-board[\s\S]{0,650}repeating-linear-gradient/);
assert.match(style, /background-color: var\(--row-table-bg, #7d1f28\)/);
assert.match(workflowUi, /applyEnvelopeColor/);
assert.match(workflowUi, /background-color', color, 'important'/);
assert.match(workflowUi, /card-row-workspace-toolbar\{border-radius:12px!important\}/);
assert.doesNotMatch(workflowCss, /board-options-toggle/);
assert.doesNotMatch(workflowCss, /board-options-tabs/);
assert.doesNotMatch(workflowUi, /className = 'board-arrange-flyout'/);
assert.doesNotMatch(workflowUi, /className = 'board-arrange-trigger'/);
assert.doesNotMatch(workflowUi, /workspaceToolbar\.appendChild\(flyout\)/);
assert.match(workflowUi, /card-row-position-label\{grid-column:1\/-1!important;grid-row:1!important\}/);
assert.match(workflowUi, /repeat\(3,minmax\(0,1fr\)\)/);
assert.doesNotMatch(workflowUi, /setAttribute\('role', 'tablist'\)/);
assert.match(workflowUi, /board-options-body/);
assert.match(workflowUi, /aria-expanded/);
assert.match(workflowUi, /grid-template-columns:1fr!important/);
assert.match(workflowUi, /accent-color:#111!important/);
assert.match(workflowUi, /card-row-placeholder-item\{height:max-content!important;min-height:0!important/);
assert.match(workflowUi, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
assert.doesNotMatch(workflowCss, /card-row-control-block--layout/);
assert.doesNotMatch(workflowCss, /board-snap-control/);
assert.match(workflowUi, /'downloadRowHtml', 'downloadRowTextHtml', 'printCardRowImage', 'snapshotCardRowArrangement'/);
assert.match(page, />Hide Cards<\/button>/);
assert.doesNotMatch(page, /Search, draw, or build a board/);
assert.doesNotMatch(page, /tarot-entry-panel/);
assert.match(page, /tarot-command-panel--primary/);
assert.match(page, /relphiOpenDrawingBoardCurrent/);
assert.match(page, /Open Drawing Board/);
assert.match(workflowUi, /function openBoardFromLedger/);
assert.match(workflowUi, /card-row-drawing-board:has\(\.card-row-composer:not\(\.is-relphi-organized\)\)\{visibility:hidden!important\}/);
assert.match(workflowUi, /panel\.hidden = true/);
assert.match(workflowUi, /drawer\.open = true/);

assert.match(workflowUi, /assets\/tarot\/rws-export\//);
assert.match(workflowUi, /\.webp/);
assert.match(workflowUi, /Download web version/);
assert.match(workflowUi, /Oracle of Relphi/);
assert.match(workflowUi, /A Relphi reading/);
assert.match(workflowUi, /logo\.png/);
assert.match(workflowUi, /reading-notes/);
assert.match(workflowUi, /\.orientation\.is-reversed/);
assert.match(workflowUi, /printWindow\.print\(\)/);
assert.match(workflowUi, /card img\.reversed\{transform:rotate\(180deg\)\}/);

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
