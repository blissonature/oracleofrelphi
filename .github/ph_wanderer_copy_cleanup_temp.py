from pathlib import Path

path = Path('planetaryhours.html')
page = path.read_text()
old = '<p class="ph-planet-instructions">Viewable wanderers stay open. Wanderers that are not practical to see are collapsed; tap one to open its full orientation guide. Tiles remain ordered by practical viewing.</p>'
new = '<p class="ph-planet-instructions">Choose a tile to see rise, set, visibility, compass direction, and altitude together.</p>'
if old not in page:
    raise SystemExit('public-facing developer note target not found')
path.write_text(page.replace(old, new, 1))
