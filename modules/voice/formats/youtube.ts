import fs from 'fs';
import { Readable } from 'stream';
import { Innertube } from 'youtubei.js';

import { BaseFormat } from './baseformat';
import { VoiceFormatResponseFetch, VoiceFormatResponseType } from '../managers';

export default class YouTubeFormat extends BaseFormat {
  public regex =
    /^https?:\/\/(?:www\.|music\.)?youtu(?:be\.com\/watch\?v=|be\.com\/shorts\/|\.be\/)([\w\-\_]*)(&(amp;)?[\w\?=]*)?$/g;
  public printName = 'YouTube';
  private yt!: Innertube;

  constructor (formatCredentials: IConfigFormatCredentials) {
    super(formatCredentials);

    Innertube.create().then(v => this.yt = v);
  }

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

  public async process(url: string, [__, videoId]: RegExpMatchArray) {
    const info = await this.yt.getBasicInfo(videoId, 'ANDROID');
    if (!info.streaming_data)
      throw new Error('no streaming_data');
    const { expires } = info.streaming_data;

    return {
      type: VoiceFormatResponseType.FETCH,
      fetch: async () => {
        let stream: ReadableStream;

        const options = {
          type: 'audio' as 'audio',
          quality: 'best',
          format: 'mp4'
        };

        if (expires.getDate() - Date.now() <= 0)
          stream = await this.yt.download(videoId, options);
        else
          stream = await info.download(options);

        return Readable.from(stream as any);
      },
      info: {
        title: info.basic_info.author + ' - ' + info.basic_info.title || '',
        image: (info.basic_info.thumbnail || [])[0].url,
        duration: info.basic_info.duration || -1,
        url
      }
    }
  }
}
