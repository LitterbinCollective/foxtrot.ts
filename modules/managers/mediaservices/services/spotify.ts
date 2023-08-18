import { readFileSync } from 'fs';
import SpotifyDL, { SpotifyImage, SpotifyTrack, SpotifyTrackExtended } from 's-dl';
import { join } from 'path';

import { MediaService } from './baseservice';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseMediaType
} from '../types';
import { DEFAULT_SOUND_ICON } from '..';

const DIST_REGEX = /dist[\/\\]{0,1}$/g;

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

    try {
      // if all of these fail to read the file, it's going to error out anyway
      const cookies = readFileSync(this.cookiesPath);
      const clientId = readFileSync(this.widevineClientIdPath);
      const privateKey = readFileSync(this.widevineClientPrivateKeyPath);

      this.spotifyDl = new SpotifyDL({
        cookies,
        clientId,
        privateKey
      });
    } catch (err) {}
  }

  private get spotifyDl() {
    if (!this._spotifyDl)
      throw new Error('spotifyDl not initialized');

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

  private get baseConfigPath() {
    let cwd = process.cwd();

    if (DIST_REGEX.test(cwd))
      cwd = cwd.replace(DIST_REGEX, '');

    return join(cwd, 'configs/');
  }

  private get widevineClientPrivateKeyPath() {
    return join(this.baseConfigPath, 'widevine_private_key.pem');
  }

  private get widevineClientIdPath() {
    return join(this.baseConfigPath, 'widevine_client_id.bin');
  }

  private get cookiesPath() {
    return join(this.baseConfigPath, 'spotify_cookies.txt');
  }

  private formResponse(track: SpotifyTrack | SpotifyTrackExtended, image?: SpotifyImage): MediaServiceResponse {
    return {
      media: {
        type: MediaServiceResponseMediaType.FETCH,
        fetch: async () => {
          const response = await this.spotifyDl?.downloadTrack(track, { spawn: false });
          if ('streamUrl' in response) {
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
      case ('album' in matches):{
        const object = await this.spotifyDl.getAlbum(matches.album as string);
        return object.tracks.items.map(x => this.formResponse(x, object.images[0]));
      };
      case ('playlist' in matches):{
        const object = await this.spotifyDl.getPlaylist(matches.playlist as string);
        return object.tracks.items
          .filter(x => x.track.type === 'track')
          .map(x => this.formResponse(x.track as SpotifyTrackExtended));
      };
      default:
        throw new Error('literally an impossible error');
    }
  }
}