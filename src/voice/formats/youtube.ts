import ytdl from 'ytdl-core';

import BaseFormat from '../foundation/BaseFormat';

export default class YouTubeFormat extends BaseFormat {
  public regex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g;
  public printName = 'YouTube';

  public async onMatch(matched: string) {
    let info: ytdl.videoInfo;
    try {
      info = await ytdl.getBasicInfo(matched);
    } catch (err) {
      return false;
    }

    const stream: any = ytdl(matched);
    stream.info = info;
    return stream;
  }
}
