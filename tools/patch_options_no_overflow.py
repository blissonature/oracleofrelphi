from pathlib import Path

p=Path('drawing-board-workflow-v2.css')
text=p.read_text()
anchor='#shortListPanel .relphi-draw-options{display:grid!important;grid-template-columns:minmax(10rem,1fr) repeat(3,auto)!important;align-items:end!important;gap:.45rem!important}\n'
replacement='''#shortListPanel .relphi-draw-options{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:end!important;gap:.45rem!important;min-width:0!important}\n#shortListPanel .relphi-draw-options>label:first-child{grid-column:1/-1!important;min-width:0!important;width:100%!important}\n'''
if anchor not in text: raise SystemExit('draw options grid anchor not found')
text=text.replace(anchor,replacement,1)
anchor='#shortListPanel .relphi-draw-options>label:not(:first-child){display:flex!important;align-items:center!important;gap:.35rem!important;min-height:2.15rem!important;padding:.38rem .5rem!important;border:1px solid #d0c7bf!important;border-radius:7px!important;background:#fff!important;white-space:nowrap!important}\n'
replacement='#shortListPanel .relphi-draw-options>label:not(:first-child){display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:.35rem!important;min-width:0!important;width:100%!important;min-height:2.15rem!important;padding:.38rem .5rem!important;border:1px solid #d0c7bf!important;border-radius:7px!important;background:#fff!important;white-space:normal!important;overflow-wrap:anywhere!important}\n'
if anchor not in text: raise SystemExit('draw options label anchor not found')
text=text.replace(anchor,replacement,1)
anchor='#shortListPanel .relphi-template-save{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.45rem!important}\n'
replacement='#shortListPanel .relphi-template-save{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(7.5rem,auto)!important;gap:.45rem!important;min-width:0!important}\n#shortListPanel .relphi-template-save>*{min-width:0!important;max-width:100%!important}\n'
if anchor not in text: raise SystemExit('template save anchor not found')
text=text.replace(anchor,replacement,1)
# Mobile: stack all option controls so nothing can be horizontally clipped.
media='''\n@media(max-width:700px){\n  #shortListPanel .relphi-draw-options{grid-template-columns:1fr!important}\n  #shortListPanel .relphi-draw-options>label:first-child{grid-column:1!important}\n  #shortListPanel .relphi-template-save{grid-template-columns:1fr!important}\n}\n'''
text += media
p.write_text(text)

p=Path('navloader.js')
text=p.read_text()
if 'drawing-board-workflow-v2.css?v=34' not in text: raise SystemExit('css cache anchor not found')
text=text.replace('drawing-board-workflow-v2.css?v=34','drawing-board-workflow-v2.css?v=35',1)
p.write_text(text)

p=Path('tests/drawing-board-single-owner.test.js')
text=p.read_text().replace('drawing-board-workflow-v2\\.css\\?v=34','drawing-board-workflow-v2\\.css\\?v=35')
p.write_text(text)

p=Path('tests/drawing-board-runtime.test.js')
text=p.read_text()
old="""  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');
  assert.equal(desktopOptions.firstIsBulk,true,'comma-separated Questions / position labels must be the first Options field');
"""
new="""  assert.ok(desktopOptions.left>=0 && desktopOptions.right<=desktopOptions.viewport,'Options must not be cut off horizontally');
  const optionsOverflow=await desktop.locator('.relphi-reading-options-drawer.is-reading-options-open').evaluate(drawer=>{
    const dr=drawer.getBoundingClientRect();
    const offenders=[];
    drawer.querySelectorAll('input,textarea,select,button,label,.relphi-draw-options,.relphi-template-save').forEach(node=>{
      const r=node.getBoundingClientRect();
      if (r.width>0 && (r.left < dr.left-1 || r.right > dr.right+1)) offenders.push({tag:node.tagName,id:node.id||'',cls:node.className||'',left:r.left,right:r.right,drawerLeft:dr.left,drawerRight:dr.right});
    });
    return offenders;
  });
  assert.deepEqual(optionsOverflow,[],'no Options control may overflow or be clipped by the drawer');
  assert.equal(desktopOptions.firstIsBulk,true,'comma-separated Questions / position labels must be the first Options field');
"""
if old not in text: raise SystemExit('desktop options assertion anchor not found')
p.write_text(text.replace(old,new,1))
