// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9349;
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/matrix-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: FILE });
  await wait(1500);
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return { error: JSON.stringify(r.result.exceptionDetails).slice(0, 300) };
    return r.result ? r.result.result.value : undefined;
  };
  const click = async (id) => ev(`document.getElementById('${id}').click()`);
  const resultText = async () => ev(`document.getElementById('resultGrid').innerText + '|' + document.getElementById('resultScalar').innerText + '|' + (document.getElementById('resultError').hidden ? '' : document.getElementById('resultError').innerText)`);

  check('title renders', (await ev(`document.title`)) === 'Matrix Calculator BD');
  check('A grid has 4 inputs (default sample 2x2)', (await ev(`document.querySelectorAll('#aGrid input').length`)) === 4);
  check('default A sample present', (await ev(`document.querySelectorAll('#aGrid input')[0].value`)) === '1');
  check('heading EN default', (await ev(`document.querySelector('h1').innerText`)) === 'Matrix Calculator BD');

  await click('opMul');
  let rt = await resultText();
  check('A x B = 19/22/43/50', /19/.test(rt) && /22/.test(rt) && /43/.test(rt) && /50/.test(rt), rt);
  await click('opDet');
  rt = await resultText();
  check('det(A) = -2', /\-2/.test(rt), rt);
  await click('opInverse');
  rt = await resultText();
  check('inverse A = -2/1/1.5/-0.5', /\-2/.test(rt) && /1\.5/.test(rt) && /\-0\.5/.test(rt), rt);
  await click('opTrace');
  rt = await resultText();
  check('trace(A) = 5', /(^|\|)5(\||$)/.test(rt), rt);

  // Singular inverse -> visible error, no crash.
  await ev(`document.querySelectorAll('#aGrid input').forEach((inp, i) => { inp.value = [1,2,2,4][i]; })`);
  await click('opInverse');
  rt = await resultText();
  check('singular inverse shows error', /singular/i.test(rt), rt);

  // Empty cell -> inline error.
  await ev(`document.querySelectorAll('#aGrid input')[0].value = ''`);
  await click('opAdd');
  rt = await resultText();
  check('empty cell shows error', rt.length > 2 && !/19/.test(rt.split('|')[0]), rt);

  // BN toggle rewrites heading and persists.
  await click('langBtn');
  check('BN heading after toggle', (await ev(`document.querySelector('h1').innerText`)).includes('ম্যাট্রিক্স'), await ev(`document.querySelector('h1').innerText`));
  check('BN lang persisted', (await ev(`localStorage.getItem('matrix-calc-lang')`)) === 'bn');

  // 390px mobile: no horizontal overflow.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(400);
  const overflow = await ev(`document.documentElement.scrollWidth <= 390`);
  check('390px no horizontal overflow', overflow === true, await ev(`document.documentElement.scrollWidth`));
  await send('Emulation.clearDeviceMetricsOverride');

  check('no console/page errors', pageErrors.length === 0, pageErrors.join(' ; '));

  console.log('\n' + (failures === 0 ? 'SMOKE GREEN' : failures + ' SMOKE FAILURES'));
  try { ws.close(); } catch (e) {}
  chrome.kill();
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
