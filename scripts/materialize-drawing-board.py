from pathlib import Path
import re

src = Path('tarot.html').read_text(encoding='utf-8')
html = src.replace('\r\n', '\n')

html = re.sub(r'<head([^>]*)>', r'<head\1>\n  <base href="../">', html, count=1, flags=re.I)
html = re.sub(r'<title>Tarot Ledger · Oracle of Relphi</title>', '<title>Drawing Board · Oracle of Relphi</title>', html, count=1, flags=re.I)
html = re.sub(r'<body>', '<body class="relphi-drawing-board-page">', html, count=1, flags=re.I)
html = re.sub(r'<h1>Tarot <span class="red">Ledger</span></h1>', '<h1>Drawing <span class="red">Board</span></h1>', html, count=1, flags=re.I)

# Ledger-only surfaces stay in the inherited DOM for shared logic, but never paint on the standalone page.
for pattern in [
    r'<section class="tarot-entry-panel"',
    r'<section class="tarot-mode-bar"',
    r'<section id="tarotSummary"',
    r'<section id="visibilityPanel"',
    r'<section id="datePanel"',
    r'<section id="chartPanel"',
    r'<section id="spreadPanel"',
    r'<section id="browsePanel"',
]:
    html = re.sub(pattern, lambda m: m.group(0) + ' hidden', html, count=1)

# Keep the original launch button available to shared board logic, but hide its whole entry surface above.
# The standalone board host is visible immediately and carries a compact boot message instead of blank space.
html = html.replace(
    '<section id="shortListPanel" class="short-list-panel" hidden aria-label="Drawing Board"></section>',
    '<section id="shortListPanel" class="short-list-panel" aria-label="Drawing Board"><div id="drawingBoardBootStatus" class="generated-note" role="status">Loading drawing workspace…</div></section>',
    1,
)

# Do not paint the Ledger command/search drawer on Drawing Board.
html = html.replace('<details open>', '<details hidden>', 1)

# First-paint cleanup runs after shared scripts; navloader recognizes the /drawing-board/tarot.html context.
html = html.replace('</body>', '  <script src="drawing-board-first-paint-v1.js?v=3"></script>\n</body>', 1)

out = Path('drawing-board/tarot.html')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'Wrote {out} from tarot.html')
