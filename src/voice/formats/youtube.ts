import ytdl from 'ytdl-core';

import BaseFormat from '../foundation/BaseFormat';

export default class YouTubeFormat extends BaseFormat {
  public regex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g;
  public printName = 'YouTube';

  public async onMatch(matched: string) {
    try {
      await ytdl.getBasicInfo(matched);
    } catch (err) {
      return false;
    }

    return ytdl(matched);
  }
}
