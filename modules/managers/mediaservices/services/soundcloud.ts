import { Proxy } from '@/modules/utils'

import { MediaService } from '../baseservice';
import { MediaServiceResponse, MediaServiceResponseMediaType } from '../types';

let cachedID: { version: string, id: string } = {
  version: '',
  id: ''
};

async function findClientID() {
  try {
    const { data: sc } = await Proxy.get('https://soundcloud.com/');
    let scVersion = String(sc.match(/<script>window\.__sc_version="[0-9]{10}"<\/script>/)[0].match(/[0-9]{10}/));

    if (cachedID.version === scVersion) return cachedID.id;

    let scripts = sc.matchAll(/<script.+src="(.+)">/g);
    let clientid: string = '';
    for (let script of scripts) {
      let url = script[1];

      if (url && !url.startsWith('https://a-v2.sndcdn.com')) return;

      const { data: scrf } = await Proxy.get(url);
      const id = scrf.match(/\("client_id=[A-Za-z0-9]{32}"\)/);

      if (id && typeof id[0] === 'string') {
        clientid = (id[0].match(/[A-Za-z0-9]{32}/) as RegExpMatchArray)[0];
        break;
      }
    }
    cachedID.version = scVersion;
    cachedID.id = clientid;

    return clientid;
  } catch (e) {
    return false;
  }
}

export default class SoundCloudService extends MediaService {
  public hosts = [ 'soundcloud.com' ];
  public patterns = [
    ':author/:song/s-:accessKey',
    ':author/:song',
    ':shortened'
  ];
}