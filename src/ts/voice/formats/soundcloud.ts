import scdl from 'soundcloud-downloader';

import {
  VoiceFormatResponseFetch,
  VoiceFormatResponseType,
} from '../managers';
import { BaseFormat } from './baseformat';

export default class SoundcloudFormat extends BaseFormat {
  public regex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/g;
  public printName = 'SoundCloud';

  public async process(matched: string) {
    let info: any;
    try {
      info = await scdl.getInfo(matched);
    } catch (err) {
      return false;
    }

    async function fetch() {
      const stream = await scdl.download(matched);
      return stream;
    }

    return {
      fetch,
      type: VoiceFormatResponseType.FETCH,
      info: {
        title: info.user.username + ' - ' + info.title,
        image: info.artwork_url || info.user.avatar_url,
        url: matched,
        duration: info.full_duration / 1000,
      },
    } as VoiceFormatResponseFetch;
  }
}
