import SpotifyDL, { SpotifyImage, SpotifyTrack, SpotifyTrackExtended } from 's-dl';

import cookie from '@/managers/cookie';
import config from '@/managers/config';

import { MediaService } from './baseservice';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseMediaType
} from '../types';
import { DEFAULT_SOUND_ICON } from '..';
import com from '@/com';

export default class SpotifyService extends MediaService {
  public disableSearch: boolean = true;
  public hosts = [ 'spotify.com' ];
  public patterns = [
    '/track/:track',
    '/album/:album',
    '/playlist/:playlist'
  ];
  private _spotifyDl?: SpotifyDL;

  constructor() {
    super();

    this.rotate = this.rotate.bind(this);

    try {
      if (
        !cookie.imported.spotify
        || !config.imported.widevineClientId
        || !config.imported.widevinePrivateKey
      )
        throw new Error();

      this.spotifyDl = new SpotifyDL({
        cookies: {
          rotation: this.rotate,
          type: 'header'
        },
        clientId: config.imported.widevineClientId,
        privateKey: config.imported.widevinePrivateKey
      });
    } catch (err) {}
  }

  private rotate() {
    if (!cookie.imported.spotify)
      throw new Error();
    return cookie.imported.spotify.rotate().toString();
  }

  private get spotifyDl() {
    if (!this._spotifyDl)
      throw new Error('spotifyDl not initialized');

    if (com.data._spotifyDirty && com.data._spotify) {
      com.data._spotifyDirty = false;
      this._spotifyDl.setTOTP(com.data._spotify.version, Buffer.from(com.data._spotify.transformedSecret, 'utf8'));
    }

    return this._spotifyDl;
  }

  private set spotifyDl(spotifyDl: SpotifyDL) {
    this._spotifyDl = spotifyDl;
  }

  public before(url: URL): URL {
    if (url.hostname !== 'open.spotify.com')
      throw new Error('not a valid Spotify link');

    return url;
  }

  private formResponse(track: SpotifyTrack | SpotifyTrackExtended, image?: SpotifyImage): MediaServiceResponse {
    return {
      media: {
        type: MediaServiceResponseMediaType.FETCH,
        fetch: async () => {
          const response = await this.spotifyDl?.downloadTrack(track, { spawn: false });
          if ('stream' in response && response.stream) {
            return response.stream as any;
          } else if ('streamUrl' in response) {
            return {
              decryptionKey: response.decryptionKey,
              type: MediaServiceResponseMediaType.URL,
              url: response.streamUrl,
            };
          }

          throw new Error('no stream URL was given');
        }
      },
      information: {
        title: track.name,
        author: track.artists.map(x => x.name).join(', '),
        cover: ('album' in track ? track.album.images[0] : image)?.url || DEFAULT_SOUND_ICON,
        duration: track.duration_ms / 1000,
        url: track.external_urls.spotify
      }
    };
  }

  public async download(_: string, matches: Record<string, string | undefined>): Promise<DownloadReturnedValue> {
    switch (true) {
      case ('track' in matches): {
        const object = await this.spotifyDl.getTrack(matches.track as string);
        return this.formResponse(object);
      };
      case ('album' in matches): {
        const object = await this.spotifyDl.getAlbum(matches.album as string);
        return object.tracks.items.map(x => this.formResponse(x, object.images[0]));
      };
      case ('playlist' in matches): {
        const object = await this.spotifyDl.getPlaylist(matches.playlist as string);
        return object.tracks.items
          .filter(x => x.track.type === 'track')
          .map(x => this.formResponse(x.track as SpotifyTrackExtended));
      };
      default:
        throw new Error('nothing exists!!');
    }
  }
}