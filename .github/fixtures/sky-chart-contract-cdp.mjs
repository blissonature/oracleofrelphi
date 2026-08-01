import fs from 'node:fs';

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitForEndpoint(url, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (_) {}
    await delay(100);
  }
  throw new Error('Chrome debugging endpoint did not become available.');
}

const targets = await waitForEndpoint('http://127.0.0.1:9222/json');
const target = targets.find(item => item.type === 'page');
if (!target?.webSocketDebuggerUrl) throw new Error('No Chrome page target was available.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
const browserErrors = [];

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push(message.params?.exceptionDetails?.text || 'Uncaught browser exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
    const text = (message.params.args || []).map(arg => arg.value || arg.description || '').join(' ');
    if (/sky chart contract|canonical|uncaught|typeerror|referenceerror/i.test(text)) browserErrors.push(text);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result || {});
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once:true });
  socket.addEventListener('error', reject, { once:true });
});

function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    returnByValue:true,
    awaitPromise:true,
    userGesture:true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed.');
  return result.result?.value;
}

async function waitFor(expression, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width:1440,
  height:1200,
  deviceScaleFactor:1,
  mobile:false
});

const fixture = {
  skyA: {
    name:'Contract Sky A',
    placements: {
      Sun:{ sign:'Aries', degree:10, minute:0, house:1 },
      Moon:{ sign:'Taurus', degree:20, minute:0, house:2 },
      Ascendant:{ sign:'Cancer', degree:0, minute:0, house:1 },
      Mercury:{ sign:'Gemini', degree:15, minute:0, house:12 },
      Venus:{ sign:'Pisces', degree:5, minute:0, house:9 },
      Mars:{ sign:'Leo', degree:2, minute:0, house:2 }
    },
    calcProfile:{
      dateTime:'1985-10-08T04:37',
      timeZone:'America/New_York',
      location:'Malden, Massachusetts',
      latitude:'42.4251',
      longitude:'-71.0662',
      houseSystem:'whole-sign',
      houseCusps:[90,120,150,180,210,240,270,300,330,0,30,60]
    }
  },
  skyB: {
    name:'Contract Sky B',
    placements: {
      Sun:{ sign:'Libra', degree:10, minute:0, house:10 },
      Moon:{ sign:'Leo', degree:20, minute:0, house:8 },
      Ascendant:{ sign:'Capricorn', degree:0, minute:0, house:1 },
      Mercury:{ sign:'Sagittarius', degree:15, minute:0, house:12 },
      Venus:{ sign:'Virgo', degree:5, minute:0, house:9 },
      Mars:{ sign:'Aquarius', degree:2, minute:0, house:2 }
    },
    calcProfile:{
      dateTime:'2026-07-29T12:00',
      timeZone:'America/Denver',
      location:'Denver, Colorado',
      latitude:'39.7392',
      longitude:'-104.9903',
      houseSystem:'whole-sign',
      houseCusps:[270,300,330,0,30,60,90,120,150,180,210,240]
    }
  }
};

await command('Page.addScriptToEvaluateOnNewDocument', {
  source:`localStorage.setItem('relphiSkyChartA', ${JSON.stringify(JSON.stringify(fixture.skyA))});localStorage.setItem('relphiSkyChartB', ${JSON.stringify(JSON.stringify(fixture.skyB))});sessionStorage.clear();`
});
await command('Page.navigate', { url:'http://127.0.0.1:8000/sky-chart.html?preview=pr55&contractSmoke=1' });

await waitFor(`Boolean(document.querySelector('#relphiSkyChartContractRoot'))`);
await waitFor(`document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel')?.dataset.ready === 'true'`);
await waitFor(`document.querySelectorAll('.relphi-contract-relationship-row').length >= 3`);
await waitFor(`document.querySelectorAll('.relphi-contract-heptagram-svg[data-ready="true"]').length === 2`);

const initial = await evaluate(`(() => {
  const root = document.querySelector('#relphiSkyChartContractRoot');
  const wheel = document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel[data-ready="true"]');
  const nativeOutput = document.querySelector('#chartPanel>.sky-output-box');
  const rows = Array.from(document.querySelectorAll('.relphi-contract-relationship-row'));
  const heptagrams = Array.from(document.querySelectorAll('.relphi-contract-heptagram-svg[data-ready="true"]'));
  return {
    root:Boolean(root),
    wheel:Boolean(wheel),
    relationships:rows.length,
    nativeOutputDisplay:nativeOutput ? getComputedStyle(nativeOutput).display : 'missing',
    gridTracks:root ? getComputedStyle(root).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    glyphErrors:root ? root.querySelectorAll('[data-glyph-error],[data-relphi-canonical-token-error],.relphi-contract-heptagram-error').length : -1,
    counterfeitText:root ? /[☉☽☿♀♂♃♄♅♆♇]/.test(root.innerText) : true,
    placementCount:root ? root.querySelectorAll('.relphi-contract-placement').length : 0,
    heptagrams:heptagrams.length,
    heptagramGlyphs:root ? root.querySelectorAll('.relphi-contract-heptagram-glyph').length : 0,
    heptagramLinks:root ? Array.from(root.querySelectorAll('.relphi-contract-heptagram-link')).filter(link => /^planetaryhours\.html#/.test(link.getAttribute('href') || '')).length : 0
  };
})()`);

if (!initial.root || !initial.wheel) throw new Error('Canonical root or comparison wheel did not render.');
if (initial.relationships < 3) throw new Error('Relationship list did not populate.');
if (initial.nativeOutputDisplay !== 'none') throw new Error('Native legacy output is publicly visible.');
if (initial.gridTracks !== 3) throw new Error('Desktop contract did not produce three predictable grid tracks.');
if (initial.glyphErrors !== 0) throw new Error('One or more public canonical glyphs failed.');
if (initial.counterfeitText) throw new Error('A public Unicode astrology substitution was detected.');
if (initial.placementCount < 12) throw new Error('Both skies did not render their placement markers.');
if (initial.heptagrams !== 2 || initial.heptagramGlyphs !== 14 || initial.heptagramLinks !== 2) throw new Error('Both data-driven canonical Planetary Hours flaps did not render completely.');

const interaction = await evaluate(`(async () => {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wheel = document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel[data-ready="true"]');
  const line = wheel.querySelector('[data-interactive="aspect"][data-aspect-index]');
  const rows = () => Array.from(document.querySelectorAll('.relphi-contract-relationship-row'));
  const visible = () => rows().filter(row => !row.hidden && getComputedStyle(row).display !== 'none').length;
  const total = rows().length;

  const registry = window.RelphiGlyphRegistry;
  const aName = registry.get(line.dataset.skyAPlacement)?.name || line.dataset.skyAPlacement;
  const bName = registry.get(line.dataset.skyBPlacement)?.name || line.dataset.skyBPlacement;
  const aspectName = registry.get(line.dataset.aspect)?.name || line.dataset.aspect;
  const nativeOutput = document.getElementById('chartOutput');
  const nativeRow = document.createElement('button');
  nativeRow.type = 'button';
  nativeRow.className = 'relationship-row';
  nativeRow.textContent = aName + ' ' + aspectName + ' ' + bName + ' Orb: ' + line.dataset.orb + '°';
  nativeRow.addEventListener('click', () => {
    const old = nativeOutput.querySelector('[data-contract-native-selected]');
    if (old) old.remove();
    const selected = document.createElement('section');
    selected.dataset.contractNativeSelected = 'true';
    const first = document.createElement('article');
    first.className = 'relphi-dual-card-item';
    first.innerHTML = '<h4>Native Card A</h4><p>First canonical relationship card.</p>';
    const second = document.createElement('article');
    second.className = 'relphi-dual-card-item';
    second.innerHTML = '<h4>Native Card B</h4><p>Second canonical relationship card.</p>';
    const reading = document.createElement('section');
    reading.className = 'relphi-progressive-reading';
    reading.innerHTML = '<p>Native progressive interpretation adopted.</p>';
    selected.append(first, second, reading);
    nativeOutput.appendChild(selected);
  });
  nativeOutput.appendChild(nativeRow);
  window.dispatchEvent(new Event('relphi:relationships-rendered'));
  const mappedStarted = Date.now();
  while (!nativeRow.dataset.relationshipIndex && Date.now() - mappedStarted < 2000) await delay(40);

  line.dispatchEvent(new PointerEvent('pointerover', { bubbles:true }));
  await delay(100);
  const hoverVisible = visible();
  line.dispatchEvent(new PointerEvent('pointerout', { bubbles:true, relatedTarget:document.body }));
  await delay(100);
  const restoredVisible = visible();
  line.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
  await delay(500);

  const selectedMount = document.getElementById('relphiSelectedRelationshipMount');
  const shell = selectedMount.querySelector('.relphi-contract-selected-shell');
  const children = shell ? Array.from(shell.children).map(node => node.className) : [];
  const cardRow = selectedMount.querySelector('.relphi-contract-selected-cards');
  const cardChildren = cardRow ? Array.from(cardRow.children).map(node => node.className) : [];
  return {
    total,
    mappedIndex:nativeRow.dataset.relationshipIndex || null,
    hoverVisible,
    restoredVisible,
    selectedVisible:visible(),
    selectedFacts:Boolean(selectedMount.querySelector('.relphi-contract-selected-facts')),
    selectedGraphic:Boolean(selectedMount.querySelector('.relphi-contract-selected-graphic')),
    adoptedCards:selectedMount.querySelectorAll('.relphi-dual-card-item').length,
    adoptedReading:Boolean(selectedMount.querySelector('.relphi-progressive-reading')),
    placeholderCount:Array.from(selectedMount.querySelectorAll('.relphi-contract-selected-empty')).filter(node => /loading/i.test(node.textContent || '')).length,
    shellOrder:children,
    cardOrder:cardChildren
  };
})()`);

if (!(interaction.hoverVisible >= 1 && interaction.hoverVisible < interaction.total)) throw new Error('Aspect hover did not filter the relationship list.');
if (interaction.restoredVisible !== interaction.total) throw new Error('Pointer-out did not restore the unselected relationship list.');
if (interaction.selectedVisible !== 1) throw new Error('Aspect isolation did not retain exactly one relationship row.');
if (interaction.mappedIndex !== '0') throw new Error('The native relationship was not mapped semantically to the canonical relationship.');
if (!interaction.selectedFacts || !interaction.selectedGraphic) throw new Error('Selected Relationship did not build its canonical graphic and facts hierarchy.');
if (interaction.adoptedCards !== 2 || !interaction.adoptedReading || interaction.placeholderCount !== 0) throw new Error('The actual dual cards and progressive reading were not adopted.');
if (!interaction.shellOrder[0]?.includes('graphic') || !interaction.shellOrder[1]?.includes('facts') || !interaction.shellOrder[2]?.includes('cards')) throw new Error('Selected Relationship top-level order is incorrect.');
if (!interaction.cardOrder[0]?.includes('card') || !interaction.cardOrder[1]?.includes('symbol') || !interaction.cardOrder[2]?.includes('card') || !interaction.cardOrder[3]?.includes('reveal')) throw new Error('Selected Relationship card/symbol/reveal order is incorrect.');

const desktopScreenshot = await command('Page.captureScreenshot', { format:'png', captureBeyondViewport:true });
fs.writeFileSync('sky-chart-contract-desktop.png', Buffer.from(desktopScreenshot.data, 'base64'));

await command('Emulation.setDeviceMetricsOverride', {
  width:390,
  height:844,
  deviceScaleFactor:3,
  mobile:true
});
await delay(300);
const mobile = await evaluate(`(() => {
  const root = document.getElementById('relphiSkyChartContractRoot');
  const rootRect = root.getBoundingClientRect();
  const cardRects = Array.from(root.querySelectorAll('.relphi-contract-card')).map(card => card.getBoundingClientRect());
  return {
    gridTracks:getComputedStyle(root).gridTemplateColumns.split(' ').filter(Boolean).length,
    rootWidth:rootRect.width,
    viewportWidth:document.documentElement.clientWidth,
    overflow:document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cardsInside:cardRects.every(rect => rect.left >= -1 && rect.right <= document.documentElement.clientWidth + 1),
    heptagramsVisible:Array.from(root.querySelectorAll('.relphi-contract-heptagram-link')).every(link => {
      const rect = link.getBoundingClientRect();
      return rect.width >= 70 && rect.height >= 60 && getComputedStyle(link).visibility === 'visible';
    })
  };
})()`);
if (mobile.gridTracks !== 1) throw new Error('iPhone contract did not collapse to one predictable grid track.');
if (mobile.overflow > 1 || !mobile.cardsInside) throw new Error('iPhone contract overflows horizontally.');
if (!mobile.heptagramsVisible) throw new Error('Planetary Hours flaps are not legible on iPhone width.');
const mobileScreenshot = await command('Page.captureScreenshot', { format:'png', captureBeyondViewport:true });
fs.writeFileSync('sky-chart-contract-mobile.png', Buffer.from(mobileScreenshot.data, 'base64'));

await delay(200);
if (browserErrors.length) throw new Error('Browser errors: ' + browserErrors.join(' | '));
fs.writeFileSync('sky-chart-contract-browser-result.json', JSON.stringify({ initial, interaction, mobile, browserErrors }, null, 2));

console.log(JSON.stringify({ initial, interaction, mobile, browserErrors }, null, 2));
socket.close();
