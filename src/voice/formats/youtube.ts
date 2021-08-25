import ytdl from 'ytdl-core';

import { ExtendedReadable } from '..';
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

    let image = '';
    let width = 0;
    for (const thumbnail of info.videoDetails.thumbnails)
      if (thumbnail.width > width)
        image = thumbnail.url,
        width = thumbnail.width

    const stream: ExtendedReadable = ytdl(matched);
    stream.info = {
      title: info.videoDetails.title,
      url: info.videoDetails.video_url,
      image,
    };
    return stream;
  }
}
