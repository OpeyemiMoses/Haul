const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('/Users/user/.gemini/antigravity-ide/scratch/hual/frontend/node_modules/ws');

const ARTIFACT_DIR = '/Users/user/.gemini/antigravity-ide/brain/cfced25b-9832-4f55-bd67-5792dd8d99e0/.tempmediaStorage';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Starting headless Chrome...');
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1100',
    '--disable-gpu',
    '--no-sandbox',
    'http://localhost:5173/'
  ]);

  await sleep(2000);

  let targets;
  for (let i = 0; i < 10; i++) {
    try {
      const res = execSync('curl -s http://127.0.0.1:9222/json').toString();
      targets = JSON.parse(res);
      break;
    } catch (e) {
      await sleep(500);
    }
  }

  const page = targets.find(t => t.type === 'page');
  if (!page) {
    console.error('No page found');
    chromeProcess.kill();
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let idCounter = 1;
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise(r => ws.on('open', r));
  console.log('Connected to CDP WebSocket');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  async function capture(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buf);
    console.log(`Saved screenshot: ${outPath} (${buf.length} bytes)`);
    return outPath;
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : null;
  }

  console.log('1. Capturing Landing Hero & Measurable Difference...');
  await sleep(1500);
  await capture('v2_landing_hero.png');

  console.log('2. Scrolling to In-Person Counter Till...');
  await evaluate(`
    const el = document.getElementById('in-person');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await sleep(1000);
  await capture('v2_counter_till_mockup.png');

  console.log('3. Scrolling to Living Passport Mockup & Thirty Chains...');
  await evaluate(`
    const el = document.getElementById('living-passport');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  `);
  await sleep(1000);
  await capture('v2_living_passport_mockup.png');

  console.log('4. Navigating to Launch Split Page...');
  await evaluate(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Launch App') || b.innerText.includes('Launch Storefront'));
    if (btn) btn.click();
  `);
  await sleep(1500);
  await capture('v2_launch_page.png');

  console.log('5. Entering Storefront as Guest / User...');
  await evaluate(`
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Browse Storefront as Guest'));
    if (guestBtn) guestBtn.click();
  `);
  await sleep(2000);
  await capture('v2_storefront_nosidenav.png');

  console.log('6. Opening User Profile Modal in Storefront...');
  await evaluate(`
    const profileBtn = Array.from(document.querySelectorAll('header button')).find(b => b.querySelector('svg.lucide-chevron-down') || b.innerText.includes('Account'));
    if (profileBtn) profileBtn.click();
  `);
  await sleep(1500);
  await capture('v2_profile_modal.png');

  console.log('Done capturing all views!');
  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
