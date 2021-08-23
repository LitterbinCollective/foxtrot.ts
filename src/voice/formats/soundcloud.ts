import scdl from 'soundcloud-downloader';

import BaseFormat from '../foundation/BaseFormat';

export default class SoundcloudFormat extends BaseFormat {
  public regex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/g;
  public printName = 'Soundcloud';

  public async onMatch(matched: string) {
    let info: any;
    try {
      info = await scdl.getInfo(matched);
    } catch (err) {
      return false;
    }

    const stream = await scdl.download(matched);
    stream.info = info;
    return stream;
  }
}
