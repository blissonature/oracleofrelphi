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

socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
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

const initial = await evaluate(`(() => {
  const root = document.querySelector('#relphiSkyChartContractRoot');
  const wheel = document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel[data-ready="true"]');
  const nativeOutput = document.querySelector('#chartPanel>.sky-output-box');
  const rows = Array.from(document.querySelectorAll('.relphi-contract-relationship-row'));
  return {
    root:Boolean(root),
    wheel:Boolean(wheel),
    relationships:rows.length,
    nativeOutputDisplay:nativeOutput ? getComputedStyle(nativeOutput).display : 'missing',
    gridTracks:root ? getComputedStyle(root).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
    glyphErrors:root ? root.querySelectorAll('[data-glyph-error],[data-relphi-canonical-token-error]').length : -1,
    counterfeitText:root ? /[☉☽☿♀♂♃♄♅♆♇]/.test(root.innerText) : true,
    placementCount:root ? root.querySelectorAll('.relphi-contract-placement').length : 0
  };
})()`);

if (!initial.root || !initial.wheel) throw new Error('Canonical root or comparison wheel did not render.');
if (initial.relationships < 3) throw new Error('Relationship list did not populate.');
if (initial.nativeOutputDisplay !== 'none') throw new Error('Native legacy output is publicly visible.');
if (initial.gridTracks !== 3) throw new Error('Desktop contract did not produce three predictable grid tracks.');
if (initial.glyphErrors !== 0) throw new Error('One or more public canonical glyphs failed.');
if (initial.counterfeitText) throw new Error('A public Unicode astrology substitution was detected.');
if (initial.placementCount < 12) throw new Error('Both skies did not render their placement markers.');

const interaction = await evaluate(`(async () => {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wheel = document.querySelector('#relphiComparisonWheelMount>.scn-live-wheel[data-ready="true"]');
  const line = wheel.querySelector('[data-interactive="aspect"][data-aspect-index]');
  const rows = () => Array.from(document.querySelectorAll('.relphi-contract-relationship-row'));
  const visible = () => rows().filter(row => !row.hidden && getComputedStyle(row).display !== 'none').length;
  const total = rows().length;
  line.dispatchEvent(new PointerEvent('pointerover', { bubbles:true }));
  await delay(100);
  const hoverVisible = visible();
  line.dispatchEvent(new PointerEvent('pointerout', { bubbles:true, relatedTarget:document.body }));
  await delay(100);
  const restoredVisible = visible();
  line.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
  await delay(250);
  return {
    total,
    hoverVisible,
    restoredVisible,
    selectedVisible:visible(),
    selectedFacts:Boolean(document.querySelector('#relphiSelectedRelationshipMount .relphi-contract-selected-facts')),
    selectedGraphic:Boolean(document.querySelector('#relphiSelectedRelationshipMount .relphi-contract-selected-graphic')),
    selectedCards:Boolean(document.querySelector('#relphiSelectedRelationshipMount .relphi-contract-selected-cards'))
  };
})()`);

if (!(interaction.hoverVisible >= 1 && interaction.hoverVisible < interaction.total)) throw new Error('Aspect hover did not filter the relationship list.');
if (interaction.restoredVisible !== interaction.total) throw new Error('Pointer-out did not restore the unselected relationship list.');
if (interaction.selectedVisible !== 1) throw new Error('Aspect isolation did not retain exactly one relationship row.');
if (!interaction.selectedFacts || !interaction.selectedGraphic || !interaction.selectedCards) throw new Error('Selected Relationship did not build its canonical hierarchy.');

const screenshot = await command('Page.captureScreenshot', { format:'png', captureBeyondViewport:true });
fs.writeFileSync('sky-chart-contract-desktop.png', Buffer.from(screenshot.data, 'base64'));
fs.writeFileSync('sky-chart-contract-browser-result.json', JSON.stringify({ initial, interaction }, null, 2));

console.log(JSON.stringify({ initial, interaction }, null, 2));
socket.close();
