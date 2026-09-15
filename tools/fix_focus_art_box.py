from pathlib import Path
p=Path('drawing-board-workflow-v2.css')
text=p.read_text()
old='.relphi-focus-art-frame{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;padding:.2rem!important}'
new='.relphi-focus-art-frame{display:grid!important;box-sizing:border-box!important;place-items:center!important;width:100%!important;height:100%!important;min-height:0!important;padding:.2rem!important;overflow:hidden!important}'
if old not in text:
    raise SystemExit('focus art frame rule not found')
p.write_text(text.replace(old,new,1))
