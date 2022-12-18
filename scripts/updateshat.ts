import axios from 'axios';
import fs from 'fs';
import { decodeArrayStream } from '@msgpack/msgpack';

import shatLists from '@/configs/shat.json';
import { Constants, Logger } from '@/modules/utils';

const logger = new Logger('UpdateShat');
const VORBIS_FILE_EXTENSION = '.ogg';
const shat: Record<string, string[]> = {};

async function shatBuildFromGitHub(repo: string, usesMsgPack: boolean, base = 'sounds/chatsounds') {
  const baseUrl = `https://raw.githubusercontent.com/${repo}/master/${base}/`;
  const sounds: string[][] = [];

  if (usesMsgPack) {
    const resp = await axios.get(baseUrl + 'list.msgpack', {
      responseType: 'stream',
    });
    const generator = decodeArrayStream(resp.data);
    for await (const sound of generator) sounds.push(sound as string[]);
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
  const exists = fs.existsSync(Constants.SHAT_FILENAME);
  const stat = exists && fs.statSync(Constants.SHAT_FILENAME);
  if (!exists || !stat || Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
    logger.warn('no shat file or modification lifetime expired! fetching...');

    let i = 0;
    logger.info(
      `loading shat... [0/${Object.entries(shatLists).length}]`
    );
    try {
      for (const repo in shatLists) {
        i++;
        const repository = shatLists[repo as keyof typeof shatLists];
        if (Array.isArray(repository.bases))
          for (const base of repository.bases)
            await shatBuildFromGitHub(repo, repository.useMsgPack, base);
        else await shatBuildFromGitHub(repo, repository.useMsgPack);
        logger.info(
          `loading shat... [${i}/${Object.entries(shatLists).length}]`
        );
      }

      logger.log('done! writing...');
      fs.writeFileSync(Constants.SHAT_FILENAME, JSON.stringify(shat));
    } catch (err) {
      logger.error(
        `something went wrong while loading shat! halting loading... [${i}/${
          Object.entries(shatLists).length
        }]`
      );
      logger.error(err);

      if (exists)
        logger.info('use the older shat file instead');
    }
  } else
    logger.info('nothing to update');
}

checkShat();