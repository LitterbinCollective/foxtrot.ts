import fs from 'fs';
import ytdl from 'better-ytdl-core';

import { BaseFormat } from './baseformat';
import { VoiceFormatResponseFetch, VoiceFormatResponseType } from '../managers';

export default class YouTubeFormat extends BaseFormat {
  public regex =
    /^https?:\/\/(?:www\.|music\.)?youtu(?:be\.com\/watch\?v=|be\.com\/shorts\/|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?$/g;
  public printName = 'YouTube';

  private get cookies() {
    const cookie = fs.readFileSync('youtube.cookies').toString();
    let result = '';

    for (const line of cookie) {
      if (line.trim() === '' || line.startsWith('#')) continue;

      const [domain, _include, path, secure, _expiry, key, value] =
        line.split('\t');
      if (
        !(domain.startsWith('.') || domain.startsWith('www')) ||
        secure.toLowerCase() !== 'true' ||
        path !== '/'
      )
        continue;
      result += `${key}=${value};`;
    }

    return result;
  }

  public async process(_: string, [__, videoId]: RegExpMatchArray) {
    const IPv6Block = this.formatCredentials.youtube
      ? this.formatCredentials.youtube.ipv6
      : undefined;
    let info: ytdl.videoInfo;
    try {
      info = await ytdl.getBasicInfo(videoId, {
        /*requestOptions: {
          headers: {
            cookies: this.cookies
          }
        },*/
        IPv6Block,
      } as any);
    } catch (err) {
      return false;
    }

    let image = '';
    let width = 0;
    for (const thumbnail of info.videoDetails.thumbnails)
      if (thumbnail.width > width)
        (image = thumbnail.url), (width = thumbnail.width);

    function fetch() {
      const stream = ytdl(videoId, {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25,
        IPv6Block,
        /*requestOptions: {
          headers: {
            cookies: this.cookies
          }
        },*/
      });
      return stream;
    }

    return {
      fetch,
      type: VoiceFormatResponseType.FETCH,
      info: {
        title: info.videoDetails.title,
        url: info.videoDetails.video_url,
        duration: Number(info.videoDetails.lengthSeconds),
        image,
      },
    } as VoiceFormatResponseFetch;
  }
}
