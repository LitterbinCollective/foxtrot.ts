import { Readable } from 'stream';
import { Innertube, OAuth2Tokens } from 'youtubei.js';

import { UserError } from '@cluster/utils';
import cookie from '@cluster/managers/cookie';
import { MediaService } from './baseservice';
import { MediaServiceResponse, MediaServiceResponseMediaType } from '../types';

export default class YouTubeService extends MediaService {
  public hosts = ['youtube.com', 'youtu.be'];
  private yt!: Promise<Innertube>;

  constructor() {
    super();

    this.patterns = this.match;
    this.yt = Innertube.create();
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

  private getOAuthData() {
    const cookies = cookie.imported.youtube;
    if (!cookies) return;

    const REQUIRED_VALUES = [ 'access_token', 'refresh_token' ];
    if (REQUIRED_VALUES.some(x => !cookies.has(x)))
      return;

    if (cookies.has('expires')) {
      cookies.set('expiry_date', cookies.get('expires') as string);
    } else if (!cookies.has('expiry_date'))
      return;

    return Object.fromEntries(cookies.entries()) as unknown as OAuth2Tokens;
  }

  private async getInnertube() {
    const innertube = await this.yt;

    const shouldRefreshToken = innertube.session.oauth.shouldRefreshToken();
    if (innertube.session.logged_in && !shouldRefreshToken)
      return innertube;

    const cookies = cookie.imported.youtube;
    if (!cookies) return;

    const oauth = this.getOAuthData();
    if (oauth) {
      await innertube.session.oauth.init(oauth);
      innertube.session.logged_in = true;
    }

    if (shouldRefreshToken)
      await innertube.session.oauth.refreshAccessToken();

    const oldExpiryString = cookies.get('expiry_date');
    const newExpiryString = innertube.session.oauth.oauth2_tokens?.expiry_date;

    if (oldExpiryString && newExpiryString) {
      // just trust me
      const oldExpiry = new Date(oldExpiryString);
      const newExpiry = new Date(newExpiryString);

      if (oldExpiry !== newExpiry) {
        for (const key in innertube.session.oauth.client_id) {
          type Value = keyof typeof innertube.session.oauth.client_id;
          cookies.set(
            key,
            innertube.session.oauth.client_id[key as Value]
          );
        }

        for (const key in innertube.session.oauth.oauth2_tokens) {
          // bare with me here
          type Value = keyof typeof innertube.session.oauth.oauth2_tokens;
          const value = innertube.session.oauth.oauth2_tokens[key as Value];
          if (value === undefined) continue;

          cookies.set(
            key,
            String(value)
          );
        }

        cookies.set('expiry_date', newExpiry.toISOString());
      }
    }

    return innertube;
  }

  public async download(
    url: string,
    matches: Record<string, string>
  ): Promise<MediaServiceResponse> {
    const innertube = await this.getInnertube();
    if (!innertube) throw new Error('no innertube available');

    const info = await innertube.getBasicInfo(matches.id, 'ANDROID');
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
            stream = await innertube.download(matches.id, options);
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
    const innertube = await this.getInnertube();
    if (!innertube) throw new Error('no innertube available');

    const results = await innertube.search(query, { type: 'video' });

    if (!results.videos || results.videos.length === 0)
      throw new UserError('query-not-found');

    const id = (results.videos[0] as any).id;
    return await this.download('https://youtu.be/' + id, { id });
  }
}
