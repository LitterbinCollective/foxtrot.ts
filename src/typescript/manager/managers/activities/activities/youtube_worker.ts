import { BG, BgConfig } from 'bgutils-js';
import { JSDOM } from 'jsdom';
import { Innertube } from 'youtubei.js';
import { isMainThread, parentPort } from 'worker_threads';

async function act() {
  if (isMainThread) return;

  const innertube = await Innertube.create({
    retrieve_player: false,
  });

  const requestKey = 'O43z0dpjhgX20SCx4KAo';
  const visitorData = innertube.session.context.client.visitorData;

  if (!visitorData)
    throw new Error('could not get visitor data');

  const dom = new JSDOM();

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document
  });

  const bgConfig: BgConfig = {
    fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => fetch(input, init),
    globalObj: globalThis,
    identifier: visitorData,
    requestKey
  };

  const bgChallenge = await BG.Challenge.create(bgConfig);

  if (!bgChallenge)
    throw new Error('could not get challenge');

  const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;

  if (interpreterJavascript) {
    new Function(interpreterJavascript)();
  } else throw new Error('could not load VM');

  const poTokenResult = await BG.PoToken.generate({
    program: bgChallenge.program,
    globalName: bgChallenge.globalName,
    bgConfig
  });

  parentPort?.postMessage({
    visitorData,
    poToken: poTokenResult.poToken,
    integrityTokenData: poTokenResult.integrityTokenData
  });
}

act();