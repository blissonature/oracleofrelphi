from pathlib import Path
p=Path('drawing-board-workflow-v2.css')
text=p.read_text()
old_frame='.relphi-focus-art-frame{display:grid!important;box-sizing:border-box!important;place-items:center!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;padding:0!important;overflow:hidden!important}'
new_frame='.relphi-focus-art-frame{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;padding:0!important;overflow:hidden!important}'
old_art='.relphi-focus-art{display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;transform:none!important;transform-origin:50% 50%!important}'
new_art='.relphi-focus-art{position:absolute!important;inset:0!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;transform:none!important;transform-origin:50% 50%!important}'
old_mobile='  .relphi-focus-art{width:min(18rem,80vw)!important;height:auto!important;max-width:min(18rem,80vw)!important;max-height:none!important}'
new_mobile='  .relphi-focus-art{position:static!important;inset:auto!important;width:min(18rem,80vw)!important;height:auto!important;max-width:min(18rem,80vw)!important;max-height:none!important}'
for old,new in [(old_frame,new_frame),(old_art,new_art),(old_mobile,new_mobile)]:
    if old not in text:
        raise SystemExit('expected CSS block not found: '+old[:100])
    text=text.replace(old,new,1)
p.write_text(text)
