from pathlib import Path
import re

src = Path('tarot.html').read_text(encoding='utf-8')
html = src.replace('\r\n', '\n')

html = re.sub(r'<head([^>]*)>', r'<head\1>\n  <base href="../">', html, count=1, flags=re.I)
html = re.sub(r'<title>Tarot Ledger · Oracle of Relphi</title>', '<title>Drawing Board · Oracle of Relphi</title>', html, count=1, flags=re.I)
html = re.sub(r'<body>', '<body class="relphi-drawing-board-page">', html, count=1, flags=re.I)
html = re.sub(r'<h1>Tarot <span class="red">Ledger</span></h1>', '<h1>Drawing <span class="red">Board</span></h1>', html, count=1, flags=re.I)

# Drawing Board is not launched from Tarot Ledger. Remove the Ledger landing surface entirely.
html = re.sub(
    r'\n\s*<section class="tarot-entry-panel".*?</section>\s*',
    '\n',
    html,
    count=1,
    flags=re.I | re.S,
)

# Shared controls remain available to tarot-app.js, but are not part of Drawing Board's visible interface.
html = re.sub(
    r'<section class="tarot-mode-bar" aria-label="Tarot Ledger modes">',
    '<section class="tarot-mode-bar" hidden aria-label="Shared card controls">',
    html,
    count=1,
    flags=re.I,
)

for pattern in [
    r'<section id="tarotSummary"',
    r'<section id="visibilityPanel"',
    r'<section id="datePanel"',
    r'<section id="chartPanel"',
    r'<section id="spreadPanel"',
    r'<section id="browsePanel"',
]:
    html = re.sub(pattern, lambda m: m.group(0) + ' hidden', html, count=1)

html = html.replace(
    '<section class="tarot-command-panel tarot-command-drawer" aria-label="Tarot command panel">',
    '<section class="tarot-command-panel tarot-command-drawer" aria-label="Drawing Board workspace">',
    1,
)
html = html.replace('<details open>', '<details hidden>', 1)
html = html.replace(
    '<section id="shortListPanel" class="short-list-panel" hidden aria-label="Drawing Board"></section>',
    '<section id="shortListPanel" class="short-list-panel" aria-label="Drawing Board"><div id="drawingBoardBootStatus" class="generated-note" role="status">Loading Drawing Board…</div></section>',
    1,
)

# No first-paint guard and no hidden launch click: tarot-app.js renders the board directly into shortListPanel.
out = Path('drawing-board/tarot.html')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'Wrote {out} from tarot.html')
