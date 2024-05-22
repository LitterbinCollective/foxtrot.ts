import { AxiosRequestConfig, AxiosResponse } from 'axios';
import m3u8stream from 'm3u8stream';

import { Proxy, UserError } from '@clu/utils';

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

interface SoundCloudPartialTrackInfo {
  id: number;
}

interface SoundCloudTrackInfo extends SoundCloudPartialTrackInfo {
  artwork_url: string;
  downloadable: boolean;
  has_downloads_left: boolean;
  media: { transcodings: SoundCloudTranscodingInfo[] };
  permalink_url: string;
  title: string;
  track_authorization: string;
  user: SoundCloudUserInfo;
}

const HYDRATION_REGEX = /<script.*>window\.__sc_hydration\s*=\s*(.+?);*\s*<\/script>/g;
const SC_VERSION_REGEX = /<script>window\.__sc_version="[0-9]{10}"<\/script>/;
const CHUNK_SIZE = 15;
const FULL_TRACK_AMOUNT = 5;

export default class SoundCloudService extends MediaService {
  public hosts = ['soundcloud.com'];
  public patterns = [
    '/:author/:song/s-:accessKey',
    '/:author/:song',
    '/:author/sets/:set',
    '/:shortened',
  ];
  private idCache: SoundCloudIDCache = { version: '', id: '' };

  async findClientID() {
    try {
      const { data: sc } = await Proxy.get('https://soundcloud.com/');
      let scVersion = String(
        sc.match(SC_VERSION_REGEX)[0].match(/[0-9]{10}/)
      );

      if (this.idCache.version === scVersion) return this.idCache.id;

      let scripts = sc.matchAll(/<script.+src="(.+)".+>/g);
      let clientid: string = '';
      for (let script of scripts) {
        let url = script[1];

        if (url && !url.startsWith('https://a-v2.sndcdn.com')) continue;

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

  private async apiWrapper<T = any>(method: 'post' | 'get', path: string, data?: any, bailout = false): Promise<T> {
    const clientId = await this.findClientID();
    if (!clientId)
      throw new Error('no client id available');

    const url = new URL('https://api-v2.soundcloud.com/');
    url.href += path.startsWith('/') ? path.slice(1) : path;
    url.searchParams.set('client_id', clientId);

    try {
      const axiosResponse = await Proxy.request<T>({ url: url.href, method, data });

      return axiosResponse.data;
    } catch (err) {
      if (bailout)
        throw err;
      else
        return await this.apiWrapper<T>(method, path, data, true);
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

          if (track.downloadable && track.has_downloads_left) {
            const { redirectUri } = await this.apiWrapper<{ redirectUri: string }>(
              'get',
              `/tracks/${track.id}/download?`
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
    const response: AxiosResponse<string> = await Proxy.get(url);

    const match = [...response.data.matchAll(HYDRATION_REGEX)];
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

    switch (true) {
      case !!sorted.playlist: // soundcloud gives partial tracklist in hydratable
        const tracks: (SoundCloudPartialTrackInfo | SoundCloudTrackInfo)[] = sorted.playlist.tracks;
        let chunks: (SoundCloudTrackInfo[] | Promise<SoundCloudTrackInfo[]>)[] = [
          tracks.slice(0, FULL_TRACK_AMOUNT) as SoundCloudTrackInfo[]
        ];

        for (let i = FULL_TRACK_AMOUNT; i < tracks.length; i += CHUNK_SIZE) {
          const tracksChunk = tracks.slice(i, i + CHUNK_SIZE);

          const fetchPartialTracks = async (tracksChunk: (SoundCloudTrackInfo | SoundCloudPartialTrackInfo)[]) => {
            const ids: (SoundCloudTrackInfo | number)[] = tracksChunk.map(x => x.id);
            const fullTracks = await this.apiWrapper<SoundCloudTrackInfo[]>('get', `/tracks?ids=${ids.join(',')}`);

            for (const track of fullTracks)
              tracksChunk[ids.indexOf(track.id)] = track;

            return tracksChunk as SoundCloudTrackInfo[];
          };

          chunks.push(fetchPartialTracks(tracksChunk));
        }

        const thing = (await Promise.all(chunks)).flat();
        console.log(thing);

        return thing.map(x => this.formMediaServiceResponse(x));
      case !!sorted.sound:
        return this.formMediaServiceResponse(
          sorted.sound as SoundCloudTrackInfo
        );
    }

    throw new Error('invalid URL');
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

    return await this.download(
      data.collection[0].permalink_url
    ) as MediaServiceResponse;
  }
}
