import { Readable } from 'stream';
import { Innertube } from 'youtubei.js';

import { UserError } from '@/modules/utils';

import { MediaService } from './baseservice';
import { MediaServiceResponse, MediaServiceResponseMediaType } from '../types';

export default class YouTubeService extends MediaService {
  public hosts = ['youtube.com', 'youtu.be'];
  private yt!: Innertube;

  constructor() {
    super();

    this.patterns = this.match;
    Innertube.create().then(v => (this.yt = v));
  }

  public match(url: URL): Record<string, string> {
    return {
      id: url.searchParams.get('v') || '',
    };
  }

  public test(url: URL): URL | Promise<URL> {
    if (url.hostname === 'youtu.be') {
      url.hostname = 'youtube.com';
      url.searchParams.append('v', url.pathname.slice(1));
      url.pathname = '/watch';
    }

    return url;
  }

  public async download(
    url: string,
    matches: Record<string, string>
  ): Promise<MediaServiceResponse> {
    const info = await this.yt.getBasicInfo(matches.id, 'ANDROID');
    if (!info.streaming_data) throw new Error('no streaming_data');
    const { expires } = info.streaming_data;

    return {
      media: {
        type: MediaServiceResponseMediaType.FETCH,
        fetch: async () => {
          let stream: ReadableStream;

          const options = {
            type: 'audio' as 'audio',
            quality: 'best',
            format: 'mp4',
          };

          if (expires.getDate() - Date.now() <= 0)
            stream = await this.yt.download(matches.id, options);
          else stream = await info.download(options);

          return Readable.from(stream as any);
        },
      },
      information: {
        title: info.basic_info.title || '',
        author: info.basic_info.author || '',
        duration: info.basic_info.duration || -1,
        cover: (info.basic_info.thumbnail || [])[0].url,
        url,
      },
    };
  }

  public async findOne(query: string): Promise<MediaServiceResponse> {
    const results = await this.yt.search(query, { type: 'video' });

    if (!results.videos || results.videos.length === 0)
      throw new UserError('query-not-found');

    const id = (results.videos[0] as any).id;
    return await this.download('https://youtu.be/' + id, { id });
  }
}
