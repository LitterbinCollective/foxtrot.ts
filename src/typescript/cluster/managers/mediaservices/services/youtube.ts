import { Readable } from 'stream';
import { Innertube, Session } from 'youtubei.js';
import { fetch as ufetch } from 'undici';

import cookies from '@/managers/cookie';
import Cookie from '@/managers/cookie/cookie';
import { MediaService } from './baseservice';
import { MediaServiceResponse, MediaServiceResponseMediaType } from '../types';
import com from '@/com';

export default class YouTubeService extends MediaService {
  public hosts = ['youtube.com', 'youtu.be'];
  private innertube!: Innertube;

  constructor() {
    super();

    this.patterns = this.match;
  }

  public match(url: URL): Record<string, string> {
    let id = url.searchParams.get('v') || '';

    const shorts = '/shorts/';
    if (url.pathname.startsWith(shorts))
      id = url.pathname.substring(shorts.length);

    return { id };
  }

  public before(url: URL): URL | Promise<URL> {
    if (url.hostname === 'youtu.be') {
      url.hostname = 'youtube.com';
      url.searchParams.append('v', url.pathname.slice(1));
      url.pathname = '/watch';
    }

    return url;
  }

  private fetch(cookie?: Cookie) {
    return async (url: any, options?: any): Promise<any> => {
      console.log(url);
      const result = await ufetch(url, options);
      cookie?.handleSetCookie(result.headers as Headers);
      return result;
    };
  }

  private async getInnertube() {
    const rawCookie = cookies.imported.youtube?.rotate();
    const cookie = rawCookie?.toString();
    const retrievePlayer = !Boolean(rawCookie);

    if (!this.innertube || com.data._youtubeDirty) {
      this.innertube = await Innertube.create({
        retrieve_player: retrievePlayer,
        cookie,
        po_token: com.data._youtube?.poToken,
        visitor_data: com.data._youtube?.visitorData
      });
      com.data._youtubeDirty = false;
    }

    const session = new Session(
      this.innertube.session.context,
      this.innertube.session.api_key,
      this.innertube.session.api_version,
      this.innertube.session.account_index,
      this.innertube.session.config_data,
      this.innertube.session.player,
      cookie,
      this.fetch(rawCookie),
      this.innertube.session.cache,
      com.data._youtube?.poToken
    );

    const innertube = new Innertube(session);
    return innertube;
  }

  public async download(
    url: string,
    matches: Record<string, string>
  ): Promise<MediaServiceResponse> {
    const videoId = matches.id;
    const client = 'WEB_EMBEDDED' as any;

    const yt = await this.getInnertube();
    const info = await yt.getBasicInfo(videoId, client);

    const playability = info.playability_status;
    const basicInfo = info.basic_info;

    // TODO: descriptive errors for users?
    if (playability && playability.status !== 'OK')
      throw new Error(`playability status: ${playability.status}`);

    if (basicInfo.is_live)
      throw new Error('live streams are not supported');

    return {
      media: {
        type: MediaServiceResponseMediaType.FETCH,
        fetch: async () => {
          const yt = await this.getInnertube();
          const stream = await yt.download(videoId, {
            quality: 'best',
            type: 'audio',
            client
          });

          return Readable.from(stream);
        },
      },
      information: {
        title: basicInfo.title || 'unknown',
        author: basicInfo.author || 'author',
        duration: basicInfo.duration || 0,
        url,
        cover: basicInfo.thumbnail?.sort((a, b) => a.width - b.width).pop()?.url,
      },
    };
  }

  public async findOne(query: string): Promise<MediaServiceResponse> {
    throw new Error('no innertube available')
  }
}
