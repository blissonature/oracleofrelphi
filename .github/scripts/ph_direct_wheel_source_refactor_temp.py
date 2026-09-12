from pathlib import Path
import re

page_path = Path('planetaryhours.html')
page = page_path.read_text(encoding='utf-8')


def sub_once(pattern, replacement, label):
    global page
    page, count = re.subn(pattern, replacement, page, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')


if 'ph-current-wheel-direct' not in page:
    sub_once(
        r"  /\* Planetary Hours owns dynamic ruler glyphs directly from the canonical SVG assets\. \*/\n"
        r"  \.ph-direct-canonical-glyph \{.*?\n"
        r"  #dayRulerProfileName \.ph-direct-canonical-glyph,\n"
        r"  #hourRulerProfileName \.ph-direct-canonical-glyph \{ margin-right:\.18em; \}\n",
        """  /* Planetary Hours owns dynamic ruler glyphs directly from the canonical SVG assets. */
  .ph-direct-canonical-glyph {
    display:inline-block;
    width:1.08em;
    height:1.08em;
    vertical-align:-.16em;
    background:currentColor;
    -webkit-mask:var(--ph-canonical-glyph) center / contain no-repeat;
    mask:var(--ph-canonical-glyph) center / contain no-repeat;
    flex:0 0 auto;
  }
  #dayRulerProfileName,
  #hourRulerProfileName {
    display:inline-flex;
    align-items:center;
    vertical-align:middle;
  }
  #dayRulerProfileName .ph-direct-canonical-glyph,
  #hourRulerProfileName .ph-direct-canonical-glyph {
    width:2.15em;
    height:2.15em;
    margin:0 .04em 0 0;
    vertical-align:middle;
  }
  #dayRulerProfileName .ph-direct-canonical-glyph { color:#fff; }
  #hourRulerProfileName .ph-direct-canonical-glyph { color:#111; }
  @media (max-width:760px) {
    #dayRulerProfileName .ph-direct-canonical-glyph { color:#111; }
  }
""",
        'ruler glyph sizing and color'
    )

    sub_once(
        r"  \.ph-current-wheel-card \{.*?  \.ph-current-wheel-card \.ph-tiny \{ margin:\.25rem 0 0; \}\n",
        """  .ph-current-wheel-card {
    display:block;
    margin:.65rem auto 0;
    max-width:270px;
    border:1px solid var(--relphi-line);
    border-radius:1rem;
    background:#fff;
    padding:.55rem;
    color:inherit;
    text-decoration:none;
    cursor:pointer;
    transition:border-color .16s ease, box-shadow .16s ease, transform .16s ease;
  }
  .ph-current-wheel-card:hover { border-color:rgba(220,31,24,.55); box-shadow:0 8px 22px rgba(0,0,0,.07); transform:translateY(-1px); }
  .ph-current-wheel-card:focus-visible { outline:3px solid rgba(220,31,24,.3); outline-offset:3px; border-color:var(--relphi-red); }
  .ph-current-wheel-card h3 { margin:.05rem 0 .25rem; font-size:.95rem; }
  .ph-current-wheel { width:min(242px,100%); height:auto; display:block; margin:0 auto; overflow:visible; }
  .ph-current-wheel-direct:not(.is-ready) { visibility:hidden; }
  .ph-current-wheel-direct .ph-wheel-house-sector { stroke:rgba(45,39,34,.10); stroke-width:1.1; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-house-cusp { stroke:rgba(45,39,34,.28); stroke-width:1.15; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-house-number { fill:#514943; font:800 16px/1 system-ui,sans-serif; text-anchor:middle; dominant-baseline:middle; }
  .ph-current-wheel-direct .ph-wheel-zodiac-sector { stroke:#fffdfa; stroke-width:1.45; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-zodiac-inner,
  .ph-current-wheel-direct .ph-wheel-zodiac-outer { fill:none; stroke:rgba(45,39,34,.38); stroke-width:1.35; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-sign { pointer-events:none; filter:drop-shadow(0 0 2px rgba(255,255,255,.98)); }
  .ph-current-wheel-direct .ph-wheel-angle-line { stroke:#514943; stroke-width:1.3; stroke-linecap:round; opacity:.72; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-angle-label { fill:#514943; font:850 13px/1 system-ui,sans-serif; text-anchor:middle; dominant-baseline:middle; paint-order:stroke; stroke:#fffdfa; stroke-width:3px; }
  .ph-current-wheel-direct .ph-wheel-placement-leader { stroke:#c9211e; stroke-width:1.35; stroke-linecap:round; opacity:.58; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-placement-contact { fill:#c9211e; stroke:#fffdfa; stroke-width:1.15; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-direct .ph-wheel-placement { filter:drop-shadow(0 1px 2px rgba(45,39,34,.16)); }
  .ph-current-wheel-direct .ph-wheel-center { fill:#211d1a; stroke:#fffdfa; stroke-width:1.5; vector-effect:non-scaling-stroke; }
  .ph-current-wheel-card .ph-tiny { margin:.25rem 0 0; }
""",
        'current wheel core styles'
    )

    anchor = '</main>\n\n<script>\n(function () {'
    replacement = '</main>\n\n<script src="relphi-glyph-registry-v1.js?v=28"></script>\n<script src="relphi-glyph-component-v1.js?v=32"></script>\n<script src="sky-chart-wheel-spec-v1.js?v=6"></script>\n<script>\n(function () {'
    if page.count(anchor) != 1:
        raise SystemExit(f'preload scripts anchor: expected one match, found {page.count(anchor)}')
    page = page.replace(anchor, replacement, 1)

    old_placeholder = '<a class="ph-current-wheel-card" id="phCurrentWheelCard" href="sky-chart.html#sky-calc" aria-label="Open this date and location in Sky Chart"><h3>Current placements</h3><div id="phCurrentWheel"><p class="ph-tiny">Planet wheel loads when Astronomy Engine is available.</p></div></a>'
    new_placeholder = '<a class="ph-current-wheel-card" id="phCurrentWheelCard" href="sky-chart.html#sky-calc" aria-label="Open this date and location in Sky Chart"><h3>Current placements</h3><div id="phCurrentWheel"></div></a>'
    if page.count(old_placeholder) != 1:
        raise SystemExit(f'wheel placeholder: expected one match, found {page.count(old_placeholder)}')
    page = page.replace(old_placeholder, new_placeholder, 1)

    page = page.replace("  const phSignGlyphs = {Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'};\n", '', 1)

    direct_wheel = r'''  const phWheelNs = 'http://www.w3.org/2000/svg';
  const phWheelSignIds = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  let phWheelRenderGeneration = 0;

  function phWheelSvg(name, attrs) {
    const node = document.createElementNS(phWheelNs, name);
    Object.entries(attrs || {}).forEach(function (entry) { node.setAttribute(entry[0], String(entry[1])); });
    return node;
  }

  function phWheelAnnularPath(center, inner, outer, start, end) {
    const span = phNormDeg(end - start) || 360;
    const large = span > 180 ? 1 : 0;
    const a = phZodiacPoint(start, outer, center.x, center.y);
    const b = phZodiacPoint(start + span, outer, center.x, center.y);
    const c = phZodiacPoint(start + span, inner, center.x, center.y);
    const d = phZodiacPoint(start, inner, center.x, center.y);
    return 'M' + a.x.toFixed(3) + ' ' + a.y.toFixed(3) +
      ' A' + outer + ' ' + outer + ' 0 ' + large + ' 1 ' + b.x.toFixed(3) + ' ' + b.y.toFixed(3) +
      ' L' + c.x.toFixed(3) + ' ' + c.y.toFixed(3) +
      ' A' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + d.x.toFixed(3) + ' ' + d.y.toFixed(3) + ' Z';
  }

  function phWheelCanonicalBubble(host, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!host || !entry || !component?.createBubble) return Promise.resolve(false);
    try {
      const rendered = component.createBubble(host, entry.id, {
        radius: options.radius,
        padding: options.padding == null ? .7 : options.padding,
        color: options.color,
        fill: options.fill == null ? '#fffdfa' : options.fill,
        strokeWidth: options.strokeWidth == null ? 1.8 : options.strokeWidth
      });
      if (options.plain) {
        rendered.circle.style.opacity = '0';
        rendered.circle.setAttribute('aria-hidden', 'true');
      }
      return Promise.resolve(rendered.ready).then(function () { return true; }).catch(function () { return false; });
    } catch (error) {
      return Promise.resolve(false);
    }
  }

  function phRenderCurrentWheel(frame) {
    if (!el.phCurrentWheel) return;
    const generation = ++phWheelRenderGeneration;
    if (!window.Astronomy || !window.RelphiSkyWheelSpec || !window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.createBubble) {
      el.phCurrentWheel.replaceChildren();
      return;
    }
    const date = frame ? frame.localNow : localNow();
    try {
      const spec = window.RelphiSkyWheelSpec.mini;
      const role = window.RelphiSkyWheelSpec.miniRole?.('A') || spec.standalone;
      const center = spec.center || {x:300,y:300};
      const zodiac = spec.zodiac;
      const house = role.house || {inner:zodiac.outer,outer:207,numberRadius:167.75};
      const colors = window.RelphiSkyWheelSpec.COLORS;
      const placementColor = window.RelphiSkyWheelSpec.SKY?.A || '#c9211e';
      const root = phWheelSvg('svg', {
        class:'ph-current-wheel ph-current-wheel-direct',
        viewBox:(spec.viewBox || [0,0,600,600]).join(' '),
        preserveAspectRatio:'xMidYMid meet',
        role:'img',
        'aria-label':'Current planetary placements mini zodiac wheel using the Sky Chart visual system'
      });
      root.dataset.directWheelReady = 'false';

      const houseLayer = phWheelSvg('g', {class:'ph-wheel-house-layer'});
      const zodiacLayer = phWheelSvg('g', {class:'ph-wheel-zodiac-layer'});
      const angleLayer = phWheelSvg('g', {class:'ph-wheel-angle-layer'});
      const placementLayer = phWheelSvg('g', {class:'ph-wheel-placement-layer'});
      const jobs = [];

      const asc = phAscendantLongitude(date, state.lat, state.lon);
      const mc = phMidheavenLongitude(date, state.lon);
      for (let i = 0; i < 12; i += 1) {
        const start = phNormDeg(asc + i * 30);
        const end = start + 30;
        const mid = start + 15;
        houseLayer.appendChild(phWheelSvg('path', {
          d:phWheelAnnularPath(center, house.inner, house.outer, start, end),
          class:'ph-wheel-house-sector',
          fill:i % 2 ? '#faf7f2' : '#fffdfa'
        }));
        const a = phZodiacPoint(start, house.inner, center.x, center.y);
        const b = phZodiacPoint(start, house.outer, center.x, center.y);
        houseLayer.appendChild(phWheelSvg('line', {x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'ph-wheel-house-cusp'}));
        const labelPoint = phZodiacPoint(mid, house.numberRadius, center.x, center.y);
        const label = phWheelSvg('text', {x:labelPoint.x,y:labelPoint.y,class:'ph-wheel-house-number'});
        label.textContent = String(i + 1);
        houseLayer.appendChild(label);
      }

      for (let i = 0; i < 12; i += 1) {
        zodiacLayer.appendChild(phWheelSvg('path', {
          d:phWheelAnnularPath(center, zodiac.inner, zodiac.outer, i * 30, i * 30 + 30),
          class:'ph-wheel-zodiac-sector',
          fill:colors[i] || '#ddd',
          'fill-opacity':zodiac.fillOpacity == null ? .82 : zodiac.fillOpacity
        }));
      }
      zodiacLayer.appendChild(phWheelSvg('circle', {cx:center.x,cy:center.y,r:zodiac.inner,class:'ph-wheel-zodiac-inner'}));
      zodiacLayer.appendChild(phWheelSvg('circle', {cx:center.x,cy:center.y,r:zodiac.outer,class:'ph-wheel-zodiac-outer'}));

      phWheelSignIds.forEach(function (id, index) {
        const point = phZodiacPoint(index * 30 + 15, (zodiac.inner + zodiac.outer) / 2, center.x, center.y);
        const host = phWheelSvg('g', {transform:'translate(' + point.x + ' ' + point.y + ')',class:'ph-wheel-sign'});
        zodiacLayer.appendChild(host);
        jobs.push(phWheelCanonicalBubble(host, id, {radius:zodiac.glyphRadius || 14,color:'#514b45',plain:true,strokeWidth:1.5}));
      });

      const edge = Number(role.edge || house.outer);
      const inward = edge - Number(spec.angleGap || 12);
      [["Asc",asc],["Dsc",asc + 180],["MC",mc],["IC",mc + 180]].forEach(function (definition) {
        const labelText = definition[0];
        const degree = definition[1];
        const a = phZodiacPoint(degree, inward, center.x, center.y);
        const b = phZodiacPoint(degree, edge, center.x, center.y);
        const t = phZodiacPoint(degree, edge + 16, center.x, center.y);
        angleLayer.appendChild(phWheelSvg('line', {x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'ph-wheel-angle-line'}));
        const label = phWheelSvg('text', {x:t.x,y:t.y,class:'ph-wheel-angle-label'});
        label.textContent = labelText;
        angleLayer.appendChild(label);
      });

      const bodyItems = skyBodies.slice(0,10).map(function (body) {
        const lon = phAstronomyLongitude(body, date);
        return {body:body,lon:lon,placement:phLongitudeToPlacement(lon)};
      });
      const displayAngles = phWheelDisplayAngles(bodyItems, 10.5);
      const placementRadius = Number(role.placement?.[0] || 172);
      const bubbleRadius = Number(spec.placementBubbleRadius || 13);
      const strokeWidth = Number(spec.placementStrokeWidth || 1.8);
      bodyItems.forEach(function (item) {
        const displayLon = displayAngles.get(item.body);
        const from = phZodiacPoint(item.lon, zodiac.outer, center.x, center.y);
        const to = phZodiacPoint(displayLon, placementRadius, center.x, center.y);
        placementLayer.appendChild(phWheelSvg('line', {x1:from.x,y1:from.y,x2:to.x,y2:to.y,class:'ph-wheel-placement-leader'}));
        placementLayer.appendChild(phWheelSvg('circle', {cx:from.x,cy:from.y,r:2.4,class:'ph-wheel-placement-contact'}));
        const host = phWheelSvg('g', {transform:'translate(' + to.x + ' ' + to.y + ')',class:'ph-wheel-placement'});
        host.dataset.placement = item.body.toLowerCase();
        const title = phWheelSvg('title');
        title.textContent = item.body + ' ' + item.placement.sign + ' ' + item.placement.degree + '°' + String(item.placement.minute).padStart(2,'0') + '′';
        host.appendChild(title);
        placementLayer.appendChild(host);
        jobs.push(phWheelCanonicalBubble(host, item.body.toLowerCase(), {radius:bubbleRadius,color:placementColor,fill:'#fffdfa',strokeWidth:strokeWidth}));
      });

      root.appendChild(houseLayer);
      root.appendChild(zodiacLayer);
      root.appendChild(angleLayer);
      root.appendChild(placementLayer);
      root.appendChild(phWheelSvg('circle', {cx:center.x,cy:center.y,r:4,class:'ph-wheel-center'}));
      const caption = document.createElement('p');
      caption.className = 'ph-tiny';
      caption.textContent = 'Preview only. Use Sky Chart for the full reading.';
      el.phCurrentWheel.replaceChildren(root, caption);

      Promise.allSettled(jobs).then(function () {
        if (generation !== phWheelRenderGeneration || !root.isConnected) return;
        root.dataset.directWheelReady = 'true';
        root.classList.add('is-ready');
      });
    } catch (error) {
      el.phCurrentWheel.replaceChildren();
    }
  }'''

    pattern = r"  function phRenderCurrentWheel\(frame\) \{.*?\n  \}\n\n  function renderWandererGrid\(frame\) \{"
    replacement = direct_wheel + "\n\n  function renderWandererGrid(frame) {"
    page, count = re.subn(pattern, replacement, page, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'direct mini wheel renderer: expected one match, found {count}')

    page_path.write_text(page, encoding='utf-8', newline='')

standardizer_path = Path('standardize-zodiac-wheels.js')
standardizer = standardizer_path.read_text(encoding='utf-8')
if 'loadPlanetaryHoursParity' in standardizer:
    standardizer, count = re.subn(
        r"\n  function append\(src, onload\) \{.*?\n  \}\n\n  function loadPlanetaryHoursParity\(onready\) \{.*?\n  \}\n",
        "\n",
        standardizer,
        count=1,
        flags=re.S
    )
    if count != 1:
        raise SystemExit(f'standardizer parity loader removal: expected one match, found {count}')
    old = """    if (IS_PLANETARY_HOURS) {
      loadPlanetaryHoursParity(() => { run(document); observe(); });
      return;
    }
    run(document);
    observe();"""
    new = """    run(document);
    observe();"""
    if standardizer.count(old) != 1:
        raise SystemExit(f'standardizer start ownership: expected one match, found {standardizer.count(old)}')
    standardizer = standardizer.replace(old, new, 1)
    standardizer_path.write_text(standardizer, encoding='utf-8', newline='')

parity_path = Path('planetary-hours-sky-chart-visual-parity-v1.js')
if parity_path.exists():
    parity_path.unlink()

test_path = Path('tests/planetary-hours-sky-chart-visual-parity.mjs')
test_path.write_text("""import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('planetaryhours.html','utf8');
const standardizer=fs.readFileSync('standardize-zodiac-wheels.js','utf8');
const nav=fs.readFileSync('navloader.js','utf8');
const integrity=fs.readFileSync('planetary-hours-active-time-integrity-v1.js','utf8');

assert.match(page,/Direct Sky Chart-matched heptagram renderer: core presentation, no post-processing/);
assert.match(page,/const heptagramCanonicalArt = Object\\.freeze/);
assert.match(page,/const cx = 180, cy = 180, r = 142/);
assert.match(page,/ph-core-heptagram-day-ring inner/);
assert.match(page,/r=\\\"23\\\"/);
assert.match(page,/r=\\\"27\\\"/);
assert.match(page,/for \\(let i = 0; i < 7; i\\+\\+\\) svg \\+= heptagramLine\\(chaldean/);
assert.match(page,/directHeptagramPlanetMarkup\\(key, dayKey, hourKey\\)/);
assert.match(page,/data-direct-heptagram-ready|directHeptagramReady/);
assert.doesNotMatch(nav,/relphi-ph-visual-boot-mask|ensurePlanetaryHoursVisualBootStyle/);
assert.doesNotMatch(integrity,/correctHour24|ph-heptagram-node/);
assert.doesNotMatch(standardizer,/installPlanetaryHoursBootMask|relphi-ph-visual-boot-mask/);
assert.match(standardizer,/isPlanetaryHoursOwnedSvg/);
assert.doesNotMatch(standardizer,/planetary-hours-sky-chart-visual-parity|loadPlanetaryHoursParity/);

assert.match(page,/function canonicalPlanetGlyphMarkup/);
assert.match(page,/assets\\/planet-glyphs\\//);
assert.match(page,/#dayRulerProfileName \\.ph-direct-canonical-glyph \\{ color:#fff; \\}/);
assert.match(page,/#hourRulerProfileName \\.ph-direct-canonical-glyph \\{ color:#111; \\}/);
assert.match(page,/width:2\\.15em/);
assert.match(page,/dayRulerProfileName\\.innerHTML = canonicalPlanetGlyphMarkup/);
assert.match(page,/hourRulerProfileName\\.innerHTML = canonicalPlanetGlyphMarkup/);
assert.doesNotMatch(page,/id=\"moonDisc\">☽<\\/div>/);
assert.doesNotMatch(page,/dayRulerProfileName\\.textContent = day\\.sym/);
assert.doesNotMatch(page,/hourRulerProfileName.*textContent = row\\.ruler\\.sym/);
assert.doesNotMatch(page,/row\\.ruler\\.sym \\+ ' '/);
assert.doesNotMatch(page,/r\\.ruler\\.sym \\+ '<\\/span>'/);
assert.doesNotMatch(page,/currentRow\\.ruler\\.sym/);
assert.doesNotMatch(page,/byKey\\[prevDayKeyForCue\\]\\.sym/);
assert.doesNotMatch(page,/byKey\\[nextDayKeyForCue\\]\\.sym/);
assert.match(page,/heptagramOrderText\\.innerHTML/);

assert.match(page,/relphi-glyph-registry-v1\\.js\\?v=28/);
assert.match(page,/relphi-glyph-component-v1\\.js\\?v=32/);
assert.match(page,/sky-chart-wheel-spec-v1\\.js\\?v=6/);
assert.match(page,/ph-current-wheel-direct/);
assert.match(page,/function phWheelCanonicalBubble/);
assert.match(page,/root\\.dataset\\.directWheelReady = 'false'/);
assert.match(page,/root\\.classList\\.add\\('is-ready'\\)/);
assert.doesNotMatch(page,/const phSignGlyphs/);
assert.doesNotMatch(page,/Planet wheel loads when Astronomy Engine is available/);
assert.doesNotMatch(page,/class=\\\"planet-marker/);

console.log('Planetary Hours direct heptagram, ruler glyph, and direct mini-wheel ownership contract passed.');
""", encoding='utf-8', newline='')
