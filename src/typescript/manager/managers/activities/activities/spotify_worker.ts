import puppeteer from 'puppeteer';
import { isMainThread, parentPort } from 'worker_threads';

const hookName = 's' + Math.random().toString(36).substring(2, 15);
const HOOK = `
(() => {
  if (globalThis.${hookName}ok) return;
  globalThis.${hookName}ok = true;
  globalThis.${hookName} = globalThis.${hookName} || [];

  Object.defineProperty(Object.prototype, 'secret', {
    configurable: true,
    set: function(v) {
      try {
        globalThis.${hookName}.push({ secret: v, version: this.version, obj: this });
        console.log('Captured secret on object:', this);
      } catch (e) {
        console.log('Error capturing secret:', e);
      }
      Object.defineProperty(this, 'secret', {
        value: v,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  });
})();
`;

interface Capture {
  transformedSecret?: string;
  secret: string;
  version?: number;
  obj: any;
}

interface StrictCapture extends Capture {
  version: number;
}

function transformSecret(originalSecret: string) {
  const asciiCodes = [];
  for (let i = 0; i < originalSecret.length; i += 1) {
    const char = originalSecret.charCodeAt(i);
    const transformed = char ^ ((i % 33) + 9);
    asciiCodes.push(transformed);
  }
  return asciiCodes.join('');
}

function tryGetTOTP(Capture: Capture[]) {
  let candidates: StrictCapture[] = [];
  for (const capture of Capture) {
    if (typeof capture.secret !== 'string')
      continue;

    if (!capture.version && capture.obj.version)
      capture.version = capture.obj.version;

    if (!capture.version)
      continue;

    candidates.push(capture as StrictCapture);
  }

  if (candidates.length === 0)
    throw new Error('No valid secret found');

  candidates.sort((a, b) => a.version - b.version);

  const real = candidates[candidates.length - 1];
  real.transformedSecret = transformSecret(real.secret);

  return real;
}

async function act() {
  if (isMainThread) return;

  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    await page.evaluateOnNewDocument(HOOK);
    await page.goto('https://open.spotify.com/');
    await page.waitForNetworkIdle();

    const secrets = await page.evaluate(`globalThis.${hookName}`) as Capture[];
    const totpData = tryGetTOTP(secrets);
    parentPort?.postMessage(totpData);
  } finally {
    await browser.close();
  }
}

act();