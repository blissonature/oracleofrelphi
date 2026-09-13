from pathlib import Path

p=Path('planetaryhours.html')
s=p.read_text()
old='''  /* v309 small Planetary Hours polish: keep the Sky Chart button on one line. */
  .planetary-page .ph-datefield-link {
    white-space: nowrap !important;
    font-size: .86rem !important;
    line-height: 1.1 !important;
    padding: .68em 1em !important;
    max-width: 100% !important;
'''
new='''  /* Sky Chart jump action must fit the narrow Day column without clipping. */
  .planetary-page .ph-datefield-link {
    display: flex !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    white-space: normal !important;
    text-align: center !important;
    font-size: .86rem !important;
    line-height: 1.15 !important;
    padding: .68em .75em !important;
'''
if old not in s:
    raise SystemExit('Sky Chart jump CSS marker not found')
p.write_text(s.replace(old,new,1))

t=Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
x=t.read_text()
marker="assert.match(page,/#controls \\.ph-btn\\.ph-btn-secondary/);\n"
addition="assert.match(page,/\\.planetary-page \\.ph-datefield-link \\{[\\s\\S]*width: 100% !important;[\\s\\S]*box-sizing: border-box !important;[\\s\\S]*white-space: normal !important;/);\n"
if marker not in x:
    raise SystemExit('test insertion marker not found')
if addition not in x:
    x=x.replace(marker,marker+addition,1)
t.write_text(x)
