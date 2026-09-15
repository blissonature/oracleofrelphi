from pathlib import Path

# Restore the individual editable label list directly beneath the comma-separated master field.
p = Path('drawing-board-workflow-v2.js')
text = p.read_text()
old = '''        <label class="relphi-options-field relphi-bulk-questions">Questions / position labels<textarea id="relphiBulkQuestions" rows="3" ${hasCards?'disabled':''} placeholder="Question one, question two, question three">${escapeHtml(draft.labels.join(', '))}</textarea><small>Tip: separate questions with commas. Each comma-separated entry becomes one position.</small></label>\n        <label class="relphi-options-field">Spread Template<select id="relphiSpreadTemplateSelect" ${hasCards?'disabled':''}>${optionTemplateMarkup(draft)}</select></label>'''
new = '''        <label class="relphi-options-field relphi-bulk-questions">Questions / position labels<textarea id="relphiBulkQuestions" rows="3" ${hasCards?'disabled':''} placeholder="Question one, question two, question three">${escapeHtml(draft.labels.join(', '))}</textarea><small>Tip: separate questions with commas. Each comma-separated entry becomes one position.</small></label>\n        <div class="relphi-labels-section">\n          <div class="relphi-options-subhead"><strong>Individual position labels</strong><button type="button" id="relphiAddPosition" ${hasCards?'disabled':''}>Add position</button></div>\n          <div id="relphiPositionLabels">${labelsMarkup(draft.labels)}</div>\n        </div>\n        <label class="relphi-options-field">Spread Template<select id="relphiSpreadTemplateSelect" ${hasCards?'disabled':''}>${optionTemplateMarkup(draft)}</select></label>'''
if old not in text:
    raise SystemExit('Options markup anchor not found')
p.write_text(text.replace(old, new, 1))

# Runtime acceptance: both editing views must be present and synchronized.
p = Path('tests/drawing-board-runtime.test.js')
text = p.read_text()
old = '''  await mobile.fill('#relphiBulkQuestions',bulkQuestions.join(', '));\n  assert.equal(await mobile.locator('#relphiPositionLabels').count(),0,'Options must not duplicate comma-separated questions into a second label list');\n  assert.equal(await mobile.locator('#relphiBulkQuestions').inputValue(),bulkQuestions.join(', '));'''
new = '''  await mobile.fill('#relphiBulkQuestions',bulkQuestions.join(', '));\n  assert.equal(await mobile.locator('#relphiPositionLabels').count(),1,'Options must show the synchronized individual label editor');\n  assert.equal(await mobile.locator('#relphiPositionLabels .relphi-label-row').count(),3,'comma-separated questions should create three individual label fields');\n  assert.deepEqual(await mobile.locator('#relphiPositionLabels .relphi-label-row input').evaluateAll(nodes=>nodes.map(node=>node.value)),bulkQuestions,'individual label fields must mirror the comma-separated master field');\n  assert.equal(await mobile.locator('#relphiBulkQuestions').inputValue(),bulkQuestions.join(', '));'''
if old not in text:
    raise SystemExit('Runtime bulk-question assertion anchor not found')
p.write_text(text.replace(old, new, 1))

# Static contract: require both the master field and the individual list.
p = Path('tests/drawing-board-bulk-questions.test.js')
text = p.read_text()
text = text.replace("assert.doesNotMatch(board, /id=\"relphiPositionLabels\"/);\nassert.doesNotMatch(board, /id=\"relphiAddPosition\"/);\nassert.match(runtime, /Options must not duplicate comma-separated questions into a second label list/);", "assert.match(board, /id=\"relphiPositionLabels\"/);\nassert.match(board, /id=\"relphiAddPosition\"/);\nassert.match(runtime, /Options must show the synchronized individual label editor/);\nassert.match(runtime, /individual label fields must mirror the comma-separated master field/);")
p.write_text(text)
