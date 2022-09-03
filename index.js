const axios = require('axios');
const { ClusterManager } = require('detritus-client');
const fs = require('fs');
const { decodeArrayStream } = require('@msgpack/msgpack');

const { Logger } = require('./dist/src/ts/utils');
const { EXTERNAL_IPC_OP_CODES } = require('./dist/src/ts/constants');
const config = require('./config.json');

const logger = new Logger('Manager');

const manager = new ClusterManager('./bot', config.token, {
  respawn: true,
  shardCount: config.shardCount || 1,
  shardsPerCluster: config.shardsPerCluster || 4,
});

const SHAT_FILENAME = '.shat';
const VORBIS_FILE_EXTENSION = '.ogg';
let shat = {};

// Source: https://github.com/Metastruct/Chatsounds-X/blob/master/app/src/ChatsoundsFetcher.ts
async function shatBuildFromGitHub(repo, usesMsgPack, base) {
  if (!base) base = 'sounds/chatsounds';

  const baseUrl = `https://raw.githubusercontent.com/${repo}/master/${base}/`;
  const sounds = [];

  if (usesMsgPack) {
    const resp = await axios.get(baseUrl + 'list.msgpack', {
      responseType: 'stream',
    });
    const generator = decodeArrayStream(resp.data);
    for await (const sound of generator) sounds.push(sound);
  } else {
    const responseFromGh = await axios.get(
      `https://api.github.com/repos/${repo}/git/trees/master?recursive=1`
    );
    const body = JSON.stringify(responseFromGh.data);
    let i = 0;
    for (const match of body.matchAll(
      /"path":\s*"([\w\/\s\.]+)"(?:\n|,|})/g
    )) {
      let path = match[1];
      if (!path || path.length === 0) continue;
      if (!path.startsWith(base) || !path.endsWith(VORBIS_FILE_EXTENSION)) continue;

      path = path.substring(base.length + 1);
      const chunks = path.split('/');
      const realm = chunks[0];
      let trigger = chunks[1];

      if (!chunks[2]) {
        trigger = trigger.substring(0, trigger.length - VORBIS_FILE_EXTENSION.length);
      }

      sounds[i] = [realm, trigger, path];

      if (trigger.startsWith('-')) {
        sounds[i][1] = sounds[i][1].substring(1);
        sounds[i][3] = `${realm}/${trigger}.txt`;
      }

      i++;
    }
  }

  for (const [_realm, name, file] of sounds) {
    if (!shat[name]) shat[name] = [];
    shat[name].push(baseUrl + file);
  }
}

async function checkShat() {
  const exists = fs.existsSync(SHAT_FILENAME);
  const stat = exists && fs.statSync(SHAT_FILENAME);
  if (!exists || !stat || Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
    logger.warn('no shat file or modification lifetime expired! fetching...');

    let i = 0;
    logger.info(
      `loading shat... [0/${Object.entries(config.shatLists).length}]`
    );
    try {
      for (const repo in config.shatLists) {
        i++;
        const cfg = config.shatLists[repo];
        if (cfg.bases)
          for (const base of cfg.bases)
            await shatBuildFromGitHub(repo, cfg.useMsgPack, base);
        else await shatBuildFromGitHub(repo, cfg.useMsgPack);
        logger.info(
          `loading shat... [${i}/${Object.entries(config.shatLists).length}]`
        );
      }

      logger.log('done! writing...');
      fs.writeFileSync(SHAT_FILENAME, JSON.stringify(shat));
    } catch (err) {
      logger.error(
        `something went wrong while loading shat! halting loading... [${i}/${
          Object.entries(config.shatLists).length
        }]`
      );
      logger.error(err);

      if (exists) {
        logger.warn('using the older shat file instead');
        shat = JSON.parse(fs.readFileSync(SHAT_FILENAME).toString());
      }
    }
  } else {
    shat = JSON.parse(fs.readFileSync(SHAT_FILENAME));
  }
}

manager.on('clusterProcess', ({ clusterProcess }) => {
  const prefix = `Cluster [${clusterProcess.clusterId}]:`;
  clusterProcess.on('ready', () => {
    logger.log(prefix, 'process ready');
    clusterProcess.sendIPC(EXTERNAL_IPC_OP_CODES.SHARE_SHAT, shat);
  });
  clusterProcess.on('warn', ({ error }) =>
    logger.error(prefix, 'error:', error)
  );
  clusterProcess.on('close', ({ code, signal }) => {
    let message = `closed: ${code}`;
    if (signal)
      message += '/' + signal;
    logger.error(prefix, message);
  });
  clusterProcess.on('message', ({ op }) => {
    if (op === EXTERNAL_IPC_OP_CODES.STOP_MANAGER) {
      logger.warn(prefix, 'child has requested to stop manager!');
      process.exit(0);
    }
  });
});

(async () => {
  await checkShat();
  logger.log('starting...');
  await manager.run();
  logger.info(`loaded ${manager.shardStart} - ${manager.shardEnd} shards out of ${manager.shardCount} total`);
})();