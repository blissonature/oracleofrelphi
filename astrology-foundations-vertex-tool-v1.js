// Earth-anchored Three.js Vertex and local-angle teaching tool for Astrology Foundations.
(function () {
  'use strict';

  if (!/(^|\/)astrology-foundations\.html$/.test(location.pathname)) return;
  if (window.__relphiAstrologyFoundationsVertexToolV1) return;
  window.__relphiAstrologyFoundationsVertexToolV1 = true;

  const tabs = document.querySelector('.foundation-tabs');
  const title = document.getElementById('foundationTitle');
  const note = document.getElementById('foundationNote');
  const grid = document.getElementById('foundationGrid');
  if (!tabs || !title || !grid) return;

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.180.0/+esm';
  const OBLIQUITY_DEG = 23.4392911;
  const ECLIPTIC_NORTH_POLE_RA_HOURS = 18;
  const ECLIPTIC_NORTH_POLE_DEC_DEG = 90 - OBLIQUITY_DEG;

  const DETAILS = {
    observer: {
      eyebrow:'Earth-anchored frame',
      title:'The observer is tangent to Earth',
      body:'The birthplace sits at the center of the local celestial sphere. Zenith points directly away from Earth’s center, Nadir points toward it, and the horizon is perpendicular to that local vertical.',
      formula:'Earth center → observer → Zenith'
    },
    ecliptic: {
      eyebrow:'Earth and sky',
      title:'The ecliptic is tilted from Earth’s equator',
      body:'The gray celestial equator is perpendicular to Earth’s rotation axis. The red ecliptic is tilted from it by Earth’s obliquity, about 23.44°. Observer latitude and local sidereal time determine how both circles appear in the local sky.',
      formula:'celestial equator ∠ ecliptic = 23.44°'
    },
    horizon: {
      eyebrow:'East–west horizon',
      title:'Horizon → Ascendant and Descendant',
      body:'The green horizon is the plane through the observer perpendicular to Zenith. The ecliptic’s eastern horizon crossing is the Ascendant; the opposite western crossing is the Descendant.',
      formula:'ecliptic ∩ horizon = ASC ↔ DSC'
    },
    meridian: {
      eyebrow:'North–south vertical',
      title:'Local meridian → Midheaven and Imum Coeli',
      body:'The black local meridian runs through North, Zenith, South, and Nadir. The upper ecliptic crossing is the Midheaven; its opposite is the Imum Coeli.',
      formula:'ecliptic ∩ local meridian = MC ↔ IC'
    },
    vertex: {
      eyebrow:'East–west vertical',
      title:'Prime vertical → Vertex and Anti-Vertex',
      body:'The blue prime vertical runs through East, Zenith, West, and Nadir. Its western ecliptic crossing is the Vertex; the opposite eastern crossing is the Anti-Vertex.',
      formula:'ecliptic ∩ prime vertical = Vx ↔ Anti-Vx'
    },
    all: {
      eyebrow:'The coherent pattern',
      title:'Earth fixes the frame; the camera moves around it',
      body:'Drag to orbit around a fixed Earth-centered local frame. The horizon, meridian, prime vertical, celestial equator, and ecliptic stay anchored to the observer while ASC–DSC, MC–IC, and Vertex–Anti-Vertex are recalculated from their actual plane intersections.',
      formula:'one Earth-anchored frame → three ecliptic intersection axes'
    }
  };

  const COLORS = {
    ecliptic:0xc7251f,
    horizon:0x3d8d3a,
    prime:0x2358d8,
    meridian:0x171717,
    equator:0x808080,
    sphere:0x777777,
    point:0x9b3fc7,
    observer:0x111111,
    earth:0xc9c4bc,
    earthGrid:0x7c776f
  };

  let focus = 'all';
  let buildStep = 5;
  let observerLatitude = 40;
  let localSiderealHours = 12;
  let threeRuntime = null;
  let threeImportPromise = null;

  function installStyles() {
    if (document.getElementById('relphi-vertex-angles-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-vertex-angles-style-v1';
    style.textContent = [
      '#vertexAnglesTool{display:grid;gap:1rem}',
      '#vertexAnglesTool *{box-sizing:border-box}',
      '#vertexAnglesTool .va-intro{max-width:850px;margin:0 auto;text-align:center;line-height:1.5;color:#333}',
      '#vertexAnglesTool .va-mode-row{display:flex;flex-wrap:wrap;justify-content:center;gap:.45rem}',
      '#vertexAnglesTool .va-mode-row button,#vertexAnglesTool .va-build button,#vertexAnglesTool .va-campanus,#vertexAnglesTool .va-view-control,#vertexAnglesTool .va-example{font:inherit;font-weight:800;border:1.5px solid #111;border-radius:999px;background:#fff;color:#111;padding:.55rem .82rem;cursor:pointer;min-height:2.65rem}',
      '#vertexAnglesTool .va-mode-row button[aria-pressed="true"],#vertexAnglesTool .va-build button[aria-current="step"],#vertexAnglesTool .va-mode-row button:hover,#vertexAnglesTool .va-mode-row button:focus,#vertexAnglesTool .va-build button:hover,#vertexAnglesTool .va-build button:focus,#vertexAnglesTool .va-campanus:hover,#vertexAnglesTool .va-campanus:focus,#vertexAnglesTool .va-view-control:hover,#vertexAnglesTool .va-view-control:focus,#vertexAnglesTool .va-example:hover,#vertexAnglesTool .va-example:focus{background:#111;color:#fff;outline:none}',
      '#vertexAnglesTool .va-shell{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(270px,.65fr);gap:1rem;align-items:start}',
      '#vertexAnglesTool .va-stage,#vertexAnglesTool .va-detail,#vertexAnglesTool .va-family{background:#fff;border:1px solid rgba(17,17,17,.14);border-radius:1.1rem;padding:.9rem}',
      '#vertexAnglesTool .va-stage{min-width:0;display:grid;gap:.55rem}',
      '#vertexAnglesTool .va-three-stage{position:relative;width:100%;height:clamp(23rem,52vw,35rem);min-height:23rem;border-radius:.9rem;overflow:hidden;background:radial-gradient(circle at 50% 38%,#fff 0,#fbfaf8 64%,#f1ece6 100%);border:1px solid rgba(17,17,17,.08);touch-action:none}',
      '#vertexAnglesTool .va-three-stage canvas{display:block;width:100%;height:100%;cursor:grab;touch-action:none}',
      '#vertexAnglesTool .va-three-stage canvas.is-dragging{cursor:grabbing}',
      '#vertexAnglesTool .va-three-status{position:absolute;inset:0;display:grid;place-items:center;padding:1rem;text-align:center;font-weight:800;color:#555}',
      '#vertexAnglesTool .va-label-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
      '#vertexAnglesTool .va-three-label{position:absolute;transform:translate(-50%,-50%);max-width:9rem;white-space:nowrap;font:800 .76rem/1.1 system-ui,sans-serif;color:#111;background:rgba(255,255,255,.9);border:1px solid rgba(17,17,17,.16);border-radius:999px;padding:.24rem .43rem;pointer-events:none;transition:opacity .15s ease}',
      '#vertexAnglesTool button.va-three-label{pointer-events:auto;cursor:pointer;min-height:2rem;padding:.28rem .48rem}',
      '#vertexAnglesTool button.va-three-label:hover,#vertexAnglesTool button.va-three-label:focus{outline:2px solid #111;outline-offset:2px}',
      '#vertexAnglesTool .va-three-label.is-vertex{border-color:rgba(155,63,199,.6)}',
      '#vertexAnglesTool .va-three-label.is-angle{border-color:rgba(199,37,31,.5)}',
      '#vertexAnglesTool .va-three-label.is-cardinal{background:rgba(255,255,255,.76);border-color:transparent;color:#555}',
      '#vertexAnglesTool .va-three-label.is-pole{background:rgba(244,242,239,.94);border-color:rgba(90,90,90,.28);color:#444}',
      '#vertexAnglesTool .va-three-label.is-observer{background:#111;color:#fff;border-color:#111}',
      '#vertexAnglesTool .va-stage-tools{display:flex;align-items:center;justify-content:space-between;gap:.55rem;flex-wrap:wrap}',
      '#vertexAnglesTool .va-stage-hint{margin:0;color:#555;font-size:.82rem;line-height:1.35;flex:1 1 16rem}',
      '#vertexAnglesTool .va-view-controls{display:flex;gap:.3rem;flex-wrap:wrap}',
      '#vertexAnglesTool .va-view-control{min-height:2.1rem;padding:.32rem .52rem;font-size:.82rem}',
      '#vertexAnglesTool .va-detail{display:grid;gap:.7rem}',
      '#vertexAnglesTool .va-eyebrow{margin:0;color:#dc1f18;font-size:.76rem;font-weight:900;text-transform:uppercase;letter-spacing:.09em}',
      '#vertexAnglesTool .va-detail h3{margin:0;font-size:1.22rem;line-height:1.18}',
      '#vertexAnglesTool .va-detail p{margin:0;line-height:1.48;color:#333}',
      '#vertexAnglesTool .va-formula{border-left:4px solid #dc1f18;background:#faf3f0;border-radius:.65rem;padding:.65rem .75rem;font-weight:900;line-height:1.35}',
      '#vertexAnglesTool .va-geo-controls{display:grid;gap:.65rem;padding:.75rem;border:1px solid rgba(17,17,17,.1);border-radius:.9rem;background:#fbfaf8}',
      '#vertexAnglesTool .va-geo-controls h4{margin:0;font-size:.9rem}',
      '#vertexAnglesTool .va-control{display:grid;gap:.25rem}',
      '#vertexAnglesTool .va-control-head{display:flex;justify-content:space-between;gap:.5rem;align-items:baseline;font-size:.84rem;font-weight:800}',
      '#vertexAnglesTool .va-control output{color:#dc1f18;font-weight:900}',
      '#vertexAnglesTool .va-control input[type="range"]{width:100%;accent-color:#dc1f18}',
      '#vertexAnglesTool .va-control-note{margin:0!important;font-size:.78rem;line-height:1.35!important;color:#666!important}',
      '#vertexAnglesTool .va-example{justify-self:start;min-height:2.15rem;padding:.35rem .58rem;font-size:.8rem}',
      '#vertexAnglesTool .va-build{display:grid;gap:.45rem;margin-top:.15rem}',
      '#vertexAnglesTool .va-build-label{font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#555}',
      '#vertexAnglesTool .va-build-row{display:flex;flex-wrap:wrap;gap:.35rem}',
      '#vertexAnglesTool .va-build button{padding:.45rem .65rem;min-height:2.35rem;font-size:.84rem}',
      '#vertexAnglesTool .va-family{display:grid;gap:.75rem}',
      '#vertexAnglesTool .va-family h3{margin:0;text-align:center}',
      '#vertexAnglesTool .va-family-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem}',
      '#vertexAnglesTool .va-family-card{border:1px solid rgba(17,17,17,.12);border-radius:.9rem;padding:.7rem;background:#fff}',
      '#vertexAnglesTool .va-family-card strong{display:block;margin-bottom:.2rem}',
      '#vertexAnglesTool .va-family-card span{display:block;color:#444;font-size:.88rem;line-height:1.35}',
      '#vertexAnglesTool .va-family-card code{display:block;margin-top:.45rem;white-space:normal;font:800 .82rem/1.35 system-ui,sans-serif;color:#111}',
      '#vertexAnglesTool .va-campanus-wrap{display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap;padding:.75rem;border-radius:.9rem;background:#f7f4f1}',
      '#vertexAnglesTool .va-campanus-wrap p{margin:0;flex:1 1 24rem;line-height:1.4;color:#333}',
      '#vertexAnglesTool .va-campanus{background:#111;color:#fff;white-space:nowrap}',
      '#vertexAnglesTool .va-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem .8rem;font-size:.82rem;color:#444}',
      '#vertexAnglesTool .va-legend span{display:inline-flex;align-items:center;gap:.35rem}',
      '#vertexAnglesTool .va-swatch{width:.75rem;height:.75rem;border-radius:50%;display:inline-block}',
      '@media(max-width:780px){#vertexAnglesTool .va-shell{grid-template-columns:1fr}#vertexAnglesTool .va-family-grid{grid-template-columns:1fr}#vertexAnglesTool .va-detail{order:-1}#vertexAnglesTool .va-three-stage{height:clamp(23rem,96vw,31rem)}}',
      '@media(max-width:460px){#vertexAnglesTool .va-mode-row{display:grid;grid-template-columns:1fr 1fr}#vertexAnglesTool .va-mode-row button{width:100%;padding:.5rem .6rem}#vertexAnglesTool .va-stage{padding:.55rem}#vertexAnglesTool .va-three-stage{height:23rem}#vertexAnglesTool .va-three-label{font-size:.69rem}#vertexAnglesTool .va-stage-tools{display:grid;grid-template-columns:1fr}#vertexAnglesTool .va-view-controls{justify-content:center}#vertexAnglesTool .va-build-row{display:grid;grid-template-columns:1fr 1fr}#vertexAnglesTool .va-build button{width:100%}}',
      '@media(prefers-reduced-motion:reduce){#vertexAnglesTool .va-three-label{transition:none}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function addTab() {
    let button = tabs.querySelector('[data-kind="angles"]');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.dataset.kind = 'angles';
    button.setAttribute('aria-pressed', 'false');
    button.textContent = 'Vertex & Angles';
    const systems = tabs.querySelector('[data-kind="systems"]');
    if (systems && systems.nextSibling) tabs.insertBefore(button, systems.nextSibling);
    else tabs.appendChild(button);
    return button;
  }

  function latitudeLabel(value) {
    const n = Math.abs(Number(value) || 0);
    if (n < 0.05) return '0°';
    return n.toFixed(n % 1 ? 1 : 0) + '° ' + (value >= 0 ? 'N' : 'S');
  }

  function lstLabel(value) {
    let hours = ((Number(value) || 0) % 24 + 24) % 24;
    const whole = Math.floor(hours);
    const minutes = Math.round((hours - whole) * 60);
    if (minutes === 60) return String((whole + 1) % 24).padStart(2, '0') + ':00';
    return String(whole).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
  }

  function toolMarkup() {
    return [
      '<section id="vertexAnglesTool" aria-label="Vertex and local angles interactive tool">',
        '<p class="va-intro"><strong>Earth fixes the frame.</strong> The observer sits on a curved Earth beneath the celestial sphere. Rotate the camera around the model while North, East, Zenith, the horizon, the meridian, and the prime vertical remain physically anchored.</p>',
        '<div class="va-mode-row" role="group" aria-label="Choose an angle family">',
          '<button type="button" data-va-focus="all" aria-pressed="true">All three</button>',
          '<button type="button" data-va-focus="horizon" aria-pressed="false">ASC ↔ DSC</button>',
          '<button type="button" data-va-focus="meridian" aria-pressed="false">MC ↔ IC</button>',
          '<button type="button" data-va-focus="vertex" aria-pressed="false">Vx ↔ Anti-Vx</button>',
        '</div>',
        '<div class="va-shell">',
          '<div class="va-stage">',
            '<div class="va-three-stage" id="vaThreeStage" aria-label="Interactive Earth-anchored three-dimensional celestial sphere">',
              '<div class="va-three-status" id="vaThreeStatus">Loading Earth-anchored 3D celestial sphere…</div>',
            '</div>',
            '<div class="va-stage-tools">',
              '<p class="va-stage-hint">Drag to orbit the camera · pinch or scroll to zoom · tap a plotted point to isolate its axis.</p>',
              '<div class="va-view-controls" role="group" aria-label="Orbit the camera around the three-dimensional model">',
                '<button class="va-view-control" type="button" data-va-rotate="left" aria-label="Orbit camera left">←</button>',
                '<button class="va-view-control" type="button" data-va-rotate="up" aria-label="Orbit camera up">↑</button>',
                '<button class="va-view-control" type="button" data-va-rotate="down" aria-label="Orbit camera down">↓</button>',
                '<button class="va-view-control" type="button" data-va-rotate="right" aria-label="Orbit camera right">→</button>',
                '<button class="va-view-control" type="button" data-va-rotate="reset">Reset view</button>',
              '</div>',
            '</div>',
            '<div class="va-legend" aria-label="Diagram colors">',
              '<span><i class="va-swatch" style="background:#c7251f"></i>Ecliptic</span>',
              '<span><i class="va-swatch" style="background:#858585"></i>Celestial equator</span>',
              '<span><i class="va-swatch" style="background:#3d8d3a"></i>Horizon</span>',
              '<span><i class="va-swatch" style="background:#2358d8"></i>Prime vertical</span>',
              '<span><i class="va-swatch" style="background:#171717"></i>Local meridian</span>',
            '</div>',
          '</div>',
          '<aside class="va-detail" aria-live="polite">',
            '<p class="va-eyebrow" id="vaEyebrow"></p>',
            '<h3 id="vaDetailTitle"></h3>',
            '<p id="vaDetailBody"></p>',
            '<div class="va-formula" id="vaFormula"></div>',
            '<section class="va-geo-controls" aria-label="Earth orientation controls">',
              '<h4>Orient the local sky</h4>',
              '<label class="va-control">',
                '<span class="va-control-head"><span>Observer latitude</span><output id="vaLatitudeOutput">' + latitudeLabel(observerLatitude) + '</output></span>',
                '<input id="vaLatitude" type="range" min="-89" max="89" step="1" value="' + observerLatitude + '">',
                '<span class="va-control-note">Latitude sets the altitude of Earth’s north celestial pole above the local horizon.</span>',
              '</label>',
              '<label class="va-control">',
                '<span class="va-control-head"><span>Local sidereal time</span><output id="vaLstOutput">' + lstLabel(localSiderealHours) + '</output></span>',
                '<input id="vaLst" type="range" min="0" max="23.75" step=".25" value="' + localSiderealHours + '">',
                '<span class="va-control-note">Sidereal time rotates the celestial equator and ecliptic through the fixed local horizon.</span>',
              '</label>',
              '<button class="va-example" type="button" id="vaResetSky">Reset teaching sky</button>',
            '</section>',
            '<div class="va-build">',
              '<span class="va-build-label">Build the geometry</span>',
              '<div class="va-build-row" role="group" aria-label="Construction steps">',
                '<button type="button" data-va-step="0">1 Earth + Observer</button>',
                '<button type="button" data-va-step="1">2 Equator + Ecliptic</button>',
                '<button type="button" data-va-step="2">3 Horizon</button>',
                '<button type="button" data-va-step="3">4 Meridian</button>',
                '<button type="button" data-va-step="4">5 Prime vertical</button>',
                '<button type="button" data-va-step="5" aria-current="step">6 Complete</button>',
              '</div>',
            '</div>',
          '</aside>',
        '</div>',
        '<section class="va-family" aria-label="Three intersection families">',
          '<h3>The same construction, repeated three times</h3>',
          '<div class="va-family-grid">',
            '<article class="va-family-card"><strong>Horizon</strong><span>Eastern and western ecliptic crossings.</span><code>ecliptic ∩ horizon = ASC ↔ DSC</code></article>',
            '<article class="va-family-card"><strong>Local meridian</strong><span>Upper and lower meridian crossings.</span><code>ecliptic ∩ meridian = MC ↔ IC</code></article>',
            '<article class="va-family-card"><strong>Prime vertical</strong><span>Western and eastern prime-vertical crossings.</span><code>ecliptic ∩ prime vertical = Vx ↔ Anti-Vx</code></article>',
          '</div>',
          '<div class="va-campanus-wrap"><p><strong>Coherence link:</strong> Campanus house construction also uses the prime vertical. The same blue Earth-anchored great circle therefore belongs to both the Vertex lesson and the house-system lesson.</p><button class="va-campanus" type="button" id="vaOpenCampanus">See Campanus in House Systems</button></div>',
        '</section>',
      '</section>'
    ].join('');
  }

  function layerRequirement(layer) {
    const stepByLayer = {
      earth:0,
      'earth-grid':0,
      'earth-axis':0,
      sphere:0,
      observer:0,
      orientation:0,
      equator:1,
      ecliptic:1,
      horizon:2,
      'horizon-points':2,
      meridian:3,
      'meridian-points':3,
      prime:4,
      'vertex-points':4,
      poles:1
    };
    return stepByLayer[layer] == null ? 0 : stepByLayer[layer];
  }

  function focusAllows(layer) {
    if (focus === 'all') return true;
    if (layer === 'earth' || layer === 'earth-grid' || layer === 'earth-axis' || layer === 'sphere' || layer === 'observer' || layer === 'orientation' || layer === 'equator' || layer === 'ecliptic' || layer === 'poles') return true;
    if (focus === 'horizon') return layer === 'horizon' || layer === 'horizon-points';
    if (focus === 'meridian') return layer === 'meridian' || layer === 'meridian-points';
    if (focus === 'vertex') return layer === 'prime' || layer === 'vertex-points';
    return true;
  }

  function detailKey() {
    if (buildStep === 0) return 'observer';
    if (buildStep === 1) return 'ecliptic';
    if (buildStep === 2) return 'horizon';
    if (buildStep === 3) return 'meridian';
    if (buildStep === 4) return 'vertex';
    return focus === 'all' ? 'all' : focus;
  }

  function sync() {
    const root = document.getElementById('vertexAnglesTool');
    if (!root) return;

    root.querySelectorAll('[data-va-focus]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.vaFocus === focus));
    });
    root.querySelectorAll('[data-va-step]').forEach(function (button) {
      if (Number(button.dataset.vaStep) === buildStep) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    const detail = DETAILS[detailKey()] || DETAILS.all;
    const eyebrow = root.querySelector('#vaEyebrow');
    const detailTitle = root.querySelector('#vaDetailTitle');
    const body = root.querySelector('#vaDetailBody');
    const formula = root.querySelector('#vaFormula');
    if (eyebrow) eyebrow.textContent = detail.eyebrow;
    if (detailTitle) detailTitle.textContent = detail.title;
    if (body) body.textContent = detail.body;
    if (formula) formula.textContent = detail.formula;

    const latitudeOutput = root.querySelector('#vaLatitudeOutput');
    const lstOutput = root.querySelector('#vaLstOutput');
    if (latitudeOutput) latitudeOutput.textContent = latitudeLabel(observerLatitude);
    if (lstOutput) lstOutput.textContent = lstLabel(localSiderealHours);

    if (threeRuntime && threeRuntime.root === root) {
      threeRuntime.updateSkyGeometry();
      threeRuntime.applyVisibility();
    }
  }

  function setFocus(next) {
    focus = DETAILS[next] ? next : 'all';
    if (buildStep < 5) buildStep = 5;
    sync();
  }

  function stopThreeRuntime() {
    if (!threeRuntime) return;
    threeRuntime.stop();
    threeRuntime = null;
  }

  function importThree() {
    if (!threeImportPromise) threeImportPromise = import(THREE_URL);
    return threeImportPromise;
  }

  function intersectGreatCircles(THREE, normalA, normalB, radius) {
    const direction = new THREE.Vector3().crossVectors(normalA, normalB);
    if (direction.lengthSq() < 1e-10) return null;
    direction.normalize().multiplyScalar(radius);
    return [direction.clone(), direction.clone().multiplyScalar(-1)];
  }

  function selectPair(pair, predicate) {
    if (!pair) return [null, null];
    return predicate(pair[0]) ? [pair[0], pair[1]] : [pair[1], pair[0]];
  }

  function localNorthCelestialPole(THREE, latitudeDeg) {
    const phi = THREE.MathUtils.degToRad(latitudeDeg);
    return new THREE.Vector3(0, Math.sin(phi), Math.cos(phi)).normalize();
  }

  function localEclipticNorthPole(THREE, latitudeDeg, lstHours) {
    const phi = THREE.MathUtils.degToRad(latitudeDeg);
    const dec = THREE.MathUtils.degToRad(ECLIPTIC_NORTH_POLE_DEC_DEG);
    const hourAngle = THREE.MathUtils.degToRad((((lstHours - ECLIPTIC_NORTH_POLE_RA_HOURS) * 15) % 360 + 360) % 360);
    const cosDec = Math.cos(dec);
    return new THREE.Vector3(
      -cosDec * Math.sin(hourAngle),
      Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * cosDec * Math.cos(hourAngle),
      Math.cos(phi) * Math.sin(dec) - Math.sin(phi) * cosDec * Math.cos(hourAngle)
    ).normalize();
  }

  async function initThree(root) {
    const stage = root.querySelector('#vaThreeStage');
    const status = root.querySelector('#vaThreeStatus');
    if (!stage) return;

    let THREE;
    try {
      THREE = await importThree();
    } catch (error) {
      if (status) status.textContent = 'The Three.js engine could not load. The Earth-anchored formulas below remain available.';
      return;
    }
    if (!root.isConnected || document.getElementById('vertexAnglesTool') !== root) return;

    stopThreeRuntime();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xffffff, 0);
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 'Earth-anchored rotatable celestial sphere showing the celestial equator, ecliptic, horizon, local meridian, prime vertical, and their astrological intersections.');

    stage.innerHTML = '';
    stage.appendChild(renderer.domElement);
    const labelLayer = document.createElement('div');
    labelLayer.className = 'va-label-layer';
    labelLayer.setAttribute('aria-hidden', 'false');
    stage.appendChild(labelLayer);

    const world = new THREE.Group();
    scene.add(world);

    const radius = 2.05;
    const earthRadius = 0.72;
    const layers = [];
    const pointMeshes = [];
    const labels = [];
    const pointByKey = {};
    const labelByKey = {};
    const disposableGeometries = [];
    const disposableMaterials = [];

    let cameraAzimuth = 0.72;
    let cameraElevation = 0.38;
    let cameraDistance = 6.45;

    function setCameraFromOrbit() {
      const cosEl = Math.cos(cameraElevation);
      camera.position.set(
        cameraDistance * cosEl * Math.sin(cameraAzimuth),
        cameraDistance * Math.sin(cameraElevation),
        cameraDistance * cosEl * Math.cos(cameraAzimuth)
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
    }
    setCameraFromOrbit();

    function register(object, layer, baseOpacity) {
      world.add(object);
      layers.push({ object:object, layer:layer, baseOpacity:baseOpacity });
      return object;
    }

    function basicMaterial(color, opacity) {
      const value = new THREE.MeshBasicMaterial({
        color:color,
        transparent:true,
        opacity:opacity,
        depthWrite:false
      });
      disposableMaterials.push(value);
      return value;
    }

    function greatCircle(normal, color, layer, thickness, opacity) {
      const geometry = new THREE.TorusGeometry(radius, thickness || 0.018, 6, 256);
      disposableGeometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, basicMaterial(color, opacity == null ? 0.96 : opacity));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal.clone().normalize());
      register(mesh, layer, opacity == null ? 0.96 : opacity);
      return mesh;
    }

    function point(key, position, color, layer, focusName, labelText, labelClass) {
      const geometry = new THREE.SphereGeometry(0.085, 18, 14);
      disposableGeometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, basicMaterial(color, 1));
      mesh.position.copy(position);
      mesh.userData.focus = focusName || '';
      mesh.userData.layer = layer;
      register(mesh, layer, 1);
      pointMeshes.push(mesh);
      pointByKey[key] = mesh;
      addLabel(key, labelText, position, layer, focusName, labelClass || 'is-angle');
      return mesh;
    }

    function addLabel(key, text, position, layer, focusName, extraClass) {
      const element = document.createElement(focusName ? 'button' : 'span');
      if (focusName) {
        element.type = 'button';
        element.dataset.vaFocusPoint = focusName;
        element.setAttribute('aria-label', 'Focus ' + text);
        element.addEventListener('click', function () { setFocus(focusName); });
      }
      element.className = 'va-three-label' + (extraClass ? ' ' + extraClass : '');
      element.textContent = text;
      labelLayer.appendChild(element);
      const entry = {
        key:key,
        element:element,
        position:position.clone(),
        layer:layer,
        focusName:focusName || '',
        built:true,
        allowed:true
      };
      labels.push(entry);
      if (key) labelByKey[key] = entry;
      return element;
    }

    function setLabelPosition(key, position) {
      if (labelByKey[key]) labelByKey[key].position.copy(position);
    }

    function setPointPosition(key, position) {
      if (pointByKey[key] && position) pointByKey[key].position.copy(position);
      if (position) setLabelPosition(key, position);
    }

    const sphereGeometry = new THREE.SphereGeometry(radius, 28, 20);
    disposableGeometries.push(sphereGeometry);
    const sphere = new THREE.Mesh(sphereGeometry, basicMaterial(COLORS.sphere, 0.065));
    sphere.material.wireframe = true;
    register(sphere, 'sphere', 0.065);

    const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 22);
    disposableGeometries.push(earthGeometry);
    const earthMaterial = new THREE.MeshBasicMaterial({
      color:COLORS.earth,
      transparent:true,
      opacity:0.96,
      depthWrite:true
    });
    disposableMaterials.push(earthMaterial);
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, -earthRadius, 0);
    register(earth, 'earth', 0.96);

    const earthGridMaterial = new THREE.MeshBasicMaterial({
      color:COLORS.earthGrid,
      transparent:true,
      opacity:0.2,
      wireframe:true,
      depthWrite:false
    });
    disposableMaterials.push(earthGridMaterial);
    const earthGrid = new THREE.Mesh(earthGeometry.clone(), earthGridMaterial);
    disposableGeometries.push(earthGrid.geometry);
    earthGrid.position.copy(earth.position);
    earthGrid.scale.setScalar(1.006);
    register(earthGrid, 'earth-grid', 0.2);

    const horizonNormal = new THREE.Vector3(0, 1, 0);
    const meridianNormal = new THREE.Vector3(1, 0, 0);
    const primeNormal = new THREE.Vector3(0, 0, 1);

    const horizonCircle = greatCircle(horizonNormal, COLORS.horizon, 'horizon', 0.018, 0.96);
    const meridianCircle = greatCircle(meridianNormal, COLORS.meridian, 'meridian', 0.017, 0.92);
    const primeCircle = greatCircle(primeNormal, COLORS.prime, 'prime', 0.018, 0.96);
    const equatorCircle = greatCircle(new THREE.Vector3(0, 1, 0), COLORS.equator, 'equator', 0.011, 0.48);
    const eclipticCircle = greatCircle(new THREE.Vector3(0, 1, 0), COLORS.ecliptic, 'ecliptic', 0.022, 1);

    const axisMaterial = new THREE.LineBasicMaterial({ color:0x555555, transparent:true, opacity:0.17, depthWrite:false });
    disposableMaterials.push(axisMaterial);
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-radius * 1.12, 0, 0), new THREE.Vector3(radius * 1.12, 0, 0),
      new THREE.Vector3(0, -radius * 1.12, 0), new THREE.Vector3(0, radius * 1.12, 0),
      new THREE.Vector3(0, 0, -radius * 1.12), new THREE.Vector3(0, 0, radius * 1.12)
    ]);
    disposableGeometries.push(axisGeometry);
    const axes = new THREE.LineSegments(axisGeometry, axisMaterial);
    register(axes, 'orientation', 0.17);

    const earthAxisGeometry = new THREE.BufferGeometry();
    const earthAxisPositions = new Float32Array(6);
    earthAxisGeometry.setAttribute('position', new THREE.BufferAttribute(earthAxisPositions, 3));
    disposableGeometries.push(earthAxisGeometry);
    const earthAxisMaterial = new THREE.LineBasicMaterial({ color:0x666666, transparent:true, opacity:0.5, depthWrite:false });
    disposableMaterials.push(earthAxisMaterial);
    const earthAxis = new THREE.Line(earthAxisGeometry, earthAxisMaterial);
    register(earthAxis, 'earth-axis', 0.5);

    const observerGeometry = new THREE.SphereGeometry(0.075, 16, 12);
    disposableGeometries.push(observerGeometry);
    const observer = new THREE.Mesh(observerGeometry, basicMaterial(COLORS.observer, 1));
    register(observer, 'observer', 1);

    point('asc', new THREE.Vector3(radius,0,0), COLORS.ecliptic, 'horizon-points', 'horizon', 'ASC', 'is-angle');
    point('dsc', new THREE.Vector3(-radius,0,0), COLORS.ecliptic, 'horizon-points', 'horizon', 'DSC', 'is-angle');
    point('mc', new THREE.Vector3(0,radius,0), COLORS.ecliptic, 'meridian-points', 'meridian', 'MC', 'is-angle');
    point('ic', new THREE.Vector3(0,-radius,0), COLORS.ecliptic, 'meridian-points', 'meridian', 'IC', 'is-angle');
    point('vertex', new THREE.Vector3(-radius,0,0), COLORS.point, 'vertex-points', 'vertex', 'VERTEX Vx', 'is-vertex');
    point('antivertex', new THREE.Vector3(radius,0,0), COLORS.point, 'vertex-points', 'vertex', 'Anti-Vertex', 'is-vertex');
    point('ncp', new THREE.Vector3(0,radius,0), COLORS.equator, 'poles', '', 'NCP', 'is-pole');
    point('scp', new THREE.Vector3(0,-radius,0), COLORS.equator, 'poles', '', 'SCP', 'is-pole');

    addLabel('east', 'East', new THREE.Vector3(radius * 1.24, 0, 0), 'orientation', '', 'is-cardinal');
    addLabel('west', 'West', new THREE.Vector3(-radius * 1.24, 0, 0), 'orientation', '', 'is-cardinal');
    addLabel('zenith', 'Zenith', new THREE.Vector3(0, radius * 1.24, 0), 'orientation', '', 'is-cardinal');
    addLabel('nadir', 'Nadir', new THREE.Vector3(0, -radius * 1.24, 0), 'orientation', '', 'is-cardinal');
    addLabel('north', 'North', new THREE.Vector3(0, 0, radius * 1.24), 'orientation', '', 'is-cardinal');
    addLabel('south', 'South', new THREE.Vector3(0, 0, -radius * 1.24), 'orientation', '', 'is-cardinal');
    addLabel('observer', 'Birthplace', new THREE.Vector3(0, 0.14, 0), 'observer', '', 'is-observer');

    function updateSkyGeometry() {
      const ncp = localNorthCelestialPole(THREE, observerLatitude);
      const eclipticNorth = localEclipticNorthPole(THREE, observerLatitude, localSiderealHours);

      equatorCircle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ncp);
      eclipticCircle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), eclipticNorth);

      const horizonPair = selectPair(intersectGreatCircles(THREE, eclipticNorth, horizonNormal, radius), function (p) { return p.x > 0; });
      const meridianPair = selectPair(intersectGreatCircles(THREE, eclipticNorth, meridianNormal, radius), function (p) { return p.y > 0; });
      const vertexPair = selectPair(intersectGreatCircles(THREE, eclipticNorth, primeNormal, radius), function (p) { return p.x < 0; });

      if (horizonPair[0]) {
        setPointPosition('asc', horizonPair[0]);
        setPointPosition('dsc', horizonPair[1]);
      }
      if (meridianPair[0]) {
        setPointPosition('mc', meridianPair[0]);
        setPointPosition('ic', meridianPair[1]);
      }
      if (vertexPair[0]) {
        setPointPosition('vertex', vertexPair[0]);
        setPointPosition('antivertex', vertexPair[1]);
      }

      const ncpPoint = ncp.clone().multiplyScalar(radius);
      const scpPoint = ncpPoint.clone().multiplyScalar(-1);
      setPointPosition('ncp', ncpPoint);
      setPointPosition('scp', scpPoint);

      const axisExtent = radius * 1.16;
      const a = ncp.clone().multiplyScalar(axisExtent);
      const b = a.clone().multiplyScalar(-1);
      earthAxisPositions[0] = b.x; earthAxisPositions[1] = b.y; earthAxisPositions[2] = b.z;
      earthAxisPositions[3] = a.x; earthAxisPositions[4] = a.y; earthAxisPositions[5] = a.z;
      earthAxisGeometry.attributes.position.needsUpdate = true;
      earthAxisGeometry.computeBoundingSphere();
    }

    updateSkyGeometry();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const activePointers = new Map();
    let previousPinchDistance = 0;
    let pointerStart = null;
    let animationFrame = 0;
    let stopped = false;

    function resize() {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    function clampCamera() {
      cameraDistance = Math.max(4.3, Math.min(9.2, cameraDistance));
      cameraElevation = Math.max(-1.25, Math.min(1.25, cameraElevation));
      setCameraFromOrbit();
    }

    function pointerDistance() {
      const values = Array.from(activePointers.values());
      if (values.length < 2) return 0;
      const dx = values[0].x - values[1].x;
      const dy = values[0].y - values[1].y;
      return Math.hypot(dx, dy);
    }

    function onPointerDown(event) {
      renderer.domElement.setPointerCapture(event.pointerId);
      activePointers.set(event.pointerId, { x:event.clientX, y:event.clientY, previousX:event.clientX, previousY:event.clientY });
      if (activePointers.size === 1) pointerStart = { x:event.clientX, y:event.clientY };
      if (activePointers.size === 2) previousPinchDistance = pointerDistance();
      renderer.domElement.classList.add('is-dragging');
    }

    function onPointerMove(event) {
      const state = activePointers.get(event.pointerId);
      if (!state) return;
      state.previousX = state.x;
      state.previousY = state.y;
      state.x = event.clientX;
      state.y = event.clientY;

      if (activePointers.size === 1) {
        const dx = state.x - state.previousX;
        const dy = state.y - state.previousY;
        cameraAzimuth -= dx * 0.007;
        cameraElevation += dy * 0.007;
        clampCamera();
      } else if (activePointers.size >= 2) {
        const distance = pointerDistance();
        if (previousPinchDistance > 0 && distance > 0) {
          cameraDistance *= previousPinchDistance / distance;
          clampCamera();
        }
        previousPinchDistance = distance;
      }
    }

    function tryRaycast(event) {
      if (!pointerStart) return;
      const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (moved > 7) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const visiblePoints = pointMeshes.filter(function (mesh) { return mesh.visible && mesh.userData.focus; });
      const hits = raycaster.intersectObjects(visiblePoints, false);
      if (hits.length && hits[0].object.userData.focus) setFocus(hits[0].object.userData.focus);
    }

    function onPointerUp(event) {
      if (activePointers.size === 1) tryRaycast(event);
      activePointers.delete(event.pointerId);
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (activePointers.size < 2) previousPinchDistance = 0;
      if (!activePointers.size) {
        renderer.domElement.classList.remove('is-dragging');
        pointerStart = null;
      }
    }

    function onWheel(event) {
      event.preventDefault();
      cameraDistance += event.deltaY * 0.006;
      clampCamera();
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive:false });

    function projectLabels() {
      scene.updateMatrixWorld(true);
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const cameraDirection = camera.position.clone().normalize();

      labels.forEach(function (entry) {
        if (!entry.built) {
          entry.element.hidden = true;
          return;
        }
        entry.element.hidden = false;
        const worldPosition = entry.position;
        const projected = worldPosition.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        entry.element.style.left = x.toFixed(1) + 'px';
        entry.element.style.top = y.toFixed(1) + 'px';

        let facing = 1;
        if (entry.position.lengthSq() > 0.06) {
          const outward = worldPosition.clone().normalize();
          facing = Math.max(0.24, Math.min(1, (outward.dot(cameraDirection) + 1.05) / 1.6));
        }
        entry.element.style.opacity = String((entry.allowed ? 1 : 0.12) * facing);
      });
    }

    function applyVisibility() {
      layers.forEach(function (entry) {
        const built = layerRequirement(entry.layer) <= buildStep;
        const allowed = focusAllows(entry.layer);
        entry.object.visible = built;
        const materials = Array.isArray(entry.object.material) ? entry.object.material : [entry.object.material];
        materials.filter(Boolean).forEach(function (mat) {
          mat.opacity = allowed ? entry.baseOpacity : Math.min(0.08, entry.baseOpacity * 0.14);
        });
      });
      labels.forEach(function (entry) {
        entry.built = layerRequirement(entry.layer) <= buildStep;
        entry.allowed = focusAllows(entry.layer);
      });
    }

    function rotate(direction) {
      const step = Math.PI / 12;
      if (direction === 'left') cameraAzimuth -= step;
      if (direction === 'right') cameraAzimuth += step;
      if (direction === 'up') cameraElevation += step;
      if (direction === 'down') cameraElevation -= step;
      if (direction === 'reset') {
        cameraAzimuth = 0.72;
        cameraElevation = 0.38;
        cameraDistance = 6.45;
      }
      clampCamera();
    }

    function animate() {
      if (stopped || !root.isConnected || document.getElementById('vertexAnglesTool') !== root) {
        stop();
        return;
      }
      renderer.render(scene, camera);
      projectLabels();
      animationFrame = requestAnimationFrame(animate);
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      disposableGeometries.forEach(function (geometry) { geometry.dispose(); });
      disposableMaterials.forEach(function (mat) { mat.dispose(); });
      renderer.dispose();
    }

    threeRuntime = {
      root:root,
      applyVisibility:applyVisibility,
      updateSkyGeometry:updateSkyGeometry,
      rotate:rotate,
      stop:stop
    };

    root.querySelectorAll('[data-va-rotate]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (threeRuntime && threeRuntime.root === root) threeRuntime.rotate(button.dataset.vaRotate);
      });
    });

    applyVisibility();
    animate();
  }

  function bindTool() {
    const root = document.getElementById('vertexAnglesTool');
    if (!root) return;

    root.querySelectorAll('[data-va-focus]').forEach(function (button) {
      button.addEventListener('click', function () { setFocus(button.dataset.vaFocus); });
    });

    root.querySelectorAll('[data-va-step]').forEach(function (button) {
      button.addEventListener('click', function () {
        buildStep = Math.max(0, Math.min(5, Number(button.dataset.vaStep) || 0));
        focus = buildStep === 2 ? 'horizon' : buildStep === 3 ? 'meridian' : buildStep === 4 ? 'vertex' : 'all';
        sync();
      });
    });

    const latitudeInput = root.querySelector('#vaLatitude');
    const lstInput = root.querySelector('#vaLst');

    latitudeInput?.addEventListener('input', function () {
      observerLatitude = Math.max(-89, Math.min(89, Number(latitudeInput.value) || 0));
      sync();
    });

    lstInput?.addEventListener('input', function () {
      localSiderealHours = Math.max(0, Math.min(23.75, Number(lstInput.value) || 0));
      sync();
    });

    root.querySelector('#vaResetSky')?.addEventListener('click', function () {
      observerLatitude = 40;
      localSiderealHours = 12;
      if (latitudeInput) latitudeInput.value = String(observerLatitude);
      if (lstInput) lstInput.value = String(localSiderealHours);
      sync();
    });

    root.querySelector('#vaOpenCampanus')?.addEventListener('click', function () {
      stopThreeRuntime();
      const systems = tabs.querySelector('[data-kind="systems"]');
      systems?.click();
      requestAnimationFrame(function () {
        const campanus = grid.querySelector('[data-system="Campanus"]');
        campanus?.click();
        campanus?.scrollIntoView({
          behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block:'center'
        });
      });
    });

    sync();
    initThree(root);
  }

  function renderTool() {
    stopThreeRuntime();
    document.querySelectorAll('.foundation-tabs [data-kind]').forEach(function (button) {
      button.setAttribute('aria-pressed', 'false');
    });
    const tab = tabs.querySelector('[data-kind="angles"]');
    tab?.setAttribute('aria-pressed', 'true');
    title.textContent = 'Vertex & Local Angles';
    if (note) {
      note.hidden = false;
      note.textContent = 'Orbit an Earth-anchored three-dimensional celestial sphere and trace how the ecliptic produces ASC/DSC, MC/IC, and Vertex/Anti-Vertex from three local great circles.';
    }
    focus = 'all';
    buildStep = 5;
    grid.innerHTML = toolMarkup();
    bindTool();
  }

  installStyles();
  const tab = addTab();
  tab.addEventListener('click', renderTool);

  const requestedTool = new URLSearchParams(location.search).get('tool');
  if (requestedTool === 'vertex-angles' || requestedTool === 'angles' || requestedTool === 'vertex') {
    requestAnimationFrame(function () { tab.click(); });
  }
})();