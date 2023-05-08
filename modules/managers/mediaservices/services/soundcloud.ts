import { AxiosResponse } from 'axios';
import m3u8stream from 'm3u8stream';

import { Proxy, UserError } from '@/modules/utils';

import { MediaService } from './baseservice';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseMediaType,
} from '../types';

interface SoundCloudIDCache {
  version: string;
  id: string;
}

type HydratableType =
  | 'anonymousId'
  | 'meUser'
  | 'features'
  | 'experiments'
  | 'geoip'
  | 'privacySettings'
  | 'trackingBrowserTabId'
  | 'user'
  | 'sound'
  | 'playlist';

interface SoundCloudHydratable {
  hydratable: HydratableType;
  data: any;
}

interface SoundCloudTranscodingInfo {
  duration: number;
  format: { protocol: 'hls' | 'progressive'; mime_type: 'audio/mpeg' };
  url: string;
}

interface SoundCloudUserInfo {
  avatar_url: string;
  username: string;
}

interface SoundCloudTrackInfo {
  artwork_url: string;
  downloadable: boolean;
  id: number;
  media: { transcodings: SoundCloudTranscodingInfo[] };
  permalink_url: string;
  title: string;
  track_authorization: string;
  user: SoundCloudUserInfo;
}

export default class SoundCloudService extends MediaService {
  public hosts = ['soundcloud.com'];
  public patterns = [
    '/:author/:song/s-:accessKey',
    '/:author/:song',
    '/:author/sets/:set',
    '/:shortened',
  ];
  private idCache: SoundCloudIDCache = { version: '', id: '' };

  private readonly HYDRATION_REGEX =
    /<script.*>window\.__sc_hydration\s*=\s*(.+?);*\s*<\/script>/g;
  private readonly SC_VERSION_REGEX =
    /<script>window\.__sc_version="[0-9]{10}"<\/script>/;

  async findClientID() {
    try {
      const { data: sc } = await Proxy.get('https://soundcloud.com/');
      let scVersion = String(
        sc.match(this.SC_VERSION_REGEX)[0].match(/[0-9]{10}/)
      );

      if (this.idCache.version === scVersion) return this.idCache.id;

      let scripts = sc.matchAll(/<script.+src="(.+)".+>/g);
      let clientid: string = '';
      for (let script of scripts) {
        let url = script[1];

        if (url && !url.startsWith('https://a-v2.sndcdn.com')) return;

        const { data: scrf } = await Proxy.get(url);
        const id = scrf.match(/\("client_id=[A-Za-z0-9]{32}"\)/);

        if (id && typeof id[0] === 'string') {
          clientid = (id[0].match(/[A-Za-z0-9]{32}/) as RegExpMatchArray)[0];
          break;
        }
      }
      this.idCache.version = scVersion;
      this.idCache.id = clientid;

      return clientid;
    } catch (e) {
      return false;
    }
  }

  private formMediaServiceResponse(
    track: SoundCloudTrackInfo
  ): MediaServiceResponse {
    return {
      media: {
        type: MediaServiceResponseMediaType.FETCH,
        fetch: async () => {
          const clientId = await this.findClientID();
          if (!clientId)
            throw new Error('failed to fetch soundcloud client id');

          if (track.downloadable) {
            const {
              data: { redirectUri },
            } = await Proxy.get(
              `https://api-v2.soundcloud.com/tracks/${track.id}/download?client_id=${clientId}`
            );
            const { data } = await Proxy.get(redirectUri, {
              responseType: 'stream',
            });

            return data;
          }

          let selected;
          for (const transcoding of track.media.transcodings)
            if (transcoding.format.protocol === 'hls') selected = transcoding;

          if (!selected) throw new Error('HLS format not found');

          let { url } = selected;
          if (url.length === 0) throw new Error('wtf');

          url +=
            (url.includes('?') ? '&' : '?') +
            `client_id=${clientId}&track_authorization=${track.track_authorization}`;

          const { data } = await Proxy.get(url);
          return m3u8stream(data.url);
        },
      },
      information: {
        title: track.title,
        author: track.user.username,
        cover: track.artwork_url,
        duration: track.media.transcodings[0].duration / 1000,
        url: track.permalink_url,
      },
    };
  }

  public async download(url: string): Promise<DownloadReturnedValue> {
    let response: AxiosResponse<string> = await Proxy.get(url);

    if (!response) throw new Error('no response. unsupported link format?');

    const match = [...response.data.matchAll(this.HYDRATION_REGEX)];
    if (match.length === 0)
      throw new Error(
        'no soundcloud hydration matches, something must be broken'
      );

    const hydrationData: SoundCloudHydratable[] = JSON.parse(match[0][1]);
    const sorted: Record<HydratableType, any> = {
      anonymousId: null,
      experiments: null,
      features: null,
      geoip: null,
      meUser: null,
      playlist: null,
      privacySettings: null,
      sound: null,
      trackingBrowserTabId: null,
      user: null,
    };

    for (const hydratable of hydrationData)
      sorted[hydratable.hydratable] = hydratable.data;

    if (sorted.playlist) {
      const playlist = sorted.playlist as { tracks: SoundCloudTrackInfo[] };
      return playlist.tracks.map(x =>
        this.formMediaServiceResponse(x)
      ) as DownloadReturnedValue;
    } else if (sorted.sound)
      return this.formMediaServiceResponse(
        sorted.sound as SoundCloudTrackInfo
      ) as DownloadReturnedValue;
    else throw new Error('invalid URL');
  }

  public async findOne(query: string) {
    const clientId = await this.findClientID();
    if (!clientId) throw new Error('failed to fetch soundcloud client id');

    const { data } = await Proxy.get<{ collection: SoundCloudTrackInfo[] }>(
      `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(
        query
      )}&variant_ids=&facet=genre&client_id=${clientId}&limit=20&offset=0`
    );

    if (data.collection.length === 0) throw new UserError('query-not-found');

    return (await this.download(
      data.collection[0].permalink_url
    )) as MediaServiceResponse;
  }
}
