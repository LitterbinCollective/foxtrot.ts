import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createDecipheriv, createHash } from 'crypto';
import https from 'https';
import { PassThrough } from 'stream';

import { Proxy, UserError } from '@/modules/utils';

import { MediaService } from './baseservice';
import { MediaServiceResponse, MediaServiceResponseMediaType } from '../types';

const BLOWFISH_CIPHER = 'BF_CBC_STRIPE';
const BLOWFISH_SECRET = 'g4el58wc0zvf9na1';
const DEEZER_APP_STATE_REGEX =
  /<script.*>window\.__DZR_APP_STATE__\s*=\s*(.+?)\s*<\/script>/g;
const EMBED_APP_ID = '430922';

interface DeezerGetUserDataResponse {
  results?: {
    USER?: {
      OPTIONS: {
        license_token: string;
        expiration_timestamp: number;
      };
    };
    SESSION_ID?: string;
    checkForm?: string;
  };
}

interface DeezerTrackData {
  ALB_PICTURE: string;
  ART_NAME: string;
  DURATION: string;
  MD5_ORIGIN?: string;
  MEDIA_VERSION: string;
  SNG_ID: string;
  SNG_TITLE: string;
  TRACK_TOKEN: string;
  TRACK_TOKEN_EXPIRE: number;
}

interface DeezerAlbumData {
  data?: {
    attributes: {
      duration: number;
      name: string;
      tracksIds: number[];
    };
  };
}

interface DeezerAPIToken {
  data?: {
    attributes: {
      token: string;
      userId: number;
    };
    id: string;
    type: 'accesstoken';
  };
}

enum TRACK_FORMATS {
  MP3_128 = 'MP3_128',
  MP3_64 = 'MP3_64',
  MP3_MISC = 'MP3_MISC',
}

interface DeezerGetUrlResponse {
  data?: {
    media: {
      cipher: { type: typeof BLOWFISH_CIPHER };
      exp: number;
      format: TRACK_FORMATS.MP3_128;
      nbf: number;
      sources: {
        provider: string;
        url: string;
      }[];
    }[];
  }[];
}

interface AuthTokens {
  apiToken: string;
  checkForm: string;
  licenseToken: string;
}

export default class DeezerService extends MediaService {
  public hosts = ['deezer.com'];
  public patterns = ['/:country/album/:album', '/:country/track/:track'];
  private authTokens?: AuthTokens;
  private authTokenFetching: boolean = false;
  private authTokenPromises: ((value?: any) => void)[][] = [];
  private userExpiration: number = -1;

  private formGwlightURL(method: string, apiToken = '') {
    const url = new URL('https://www.deezer.com/ajax/gw-light.php');
    const cid = Math.floor(Math.random() * 99999999);
    url.searchParams.append('method', method);
    url.searchParams.append('input', '3');
    url.searchParams.append('api_version', '1.0');
    url.searchParams.append('api_token', apiToken);
    url.searchParams.append('cid', String(cid));
    return url.href;
  }

  private async getAuthTokens() {
    // if license token is going to expire in 30 seconds
    // we have to refetch it, so there would not be a problem
    if (this.authTokens && this.userExpiration - Date.now() / 1000 >= 30)
      return;
    if (this.authTokenFetching)
      return await new Promise<undefined>((res, rej) =>
        this.authTokenPromises.push([res, rej])
      );

    this.authTokenFetching = true;

    try {
      const { data: userData } = await Proxy.post<DeezerGetUserDataResponse>(
        this.formGwlightURL('deezer.getUserData')
      );

      if (
        !userData.results ||
        !userData.results.USER ||
        !userData.results.SESSION_ID ||
        !userData.results.checkForm
      )
        throw new Error('invalid response from deezer.getUserData');

      const { data: apiToken } = await this.fetchAPI<DeezerAPIToken>(
        '/platform/generic/token/unlogged',
        { data: 'app_id=' + EMBED_APP_ID, method: 'post' },
        true
      );
      if (!apiToken.data) throw new Error('invalid response from deezer api');

      const { license_token, expiration_timestamp } =
        userData.results.USER.OPTIONS;
      this.userExpiration = expiration_timestamp;

      this.authTokens = {
        apiToken: apiToken.data.attributes.token,
        licenseToken: license_token,
        checkForm: userData.results.checkForm,
      };

      this.authTokenFetching = false;
      this.authTokenPromises.forEach(([res]) => res());
      this.authTokenPromises = [];
    } catch (err) {
      this.authTokenPromises.forEach(([_, rej]) => rej(err));
      this.authTokenPromises = [];
      throw err;
    }
  }

  private async getLicenseToken() {
    await this.getAuthTokens();
    return this.authTokens?.licenseToken || '';
  }

  private async getAPIToken() {
    await this.getAuthTokens();
    return this.authTokens?.apiToken || '';
  }

  private async getTrackInfo(trackId: string) {
    const { data: html } = await Proxy(
      'https://www.deezer.com/us/track/' + trackId
    );

    const matches = [...html.matchAll(DEEZER_APP_STATE_REGEX)];
    if (matches.length === 0)
      throw new Error(
        'no deezer app state data matches, something must be broken'
      );

    const trackData: { DATA: DeezerTrackData } = JSON.parse(matches[0][1]);
    return trackData.DATA;
  }

  private async fetchAPI<T = any>(
    path: string,
    options: AxiosRequestConfig = {},
    noauth = false
  ) {
    if (!options.headers) options.headers = {};

    if (!options.headers.authorization && !noauth)
      options.headers.authorization = 'Bearer ' + (await this.getAPIToken());

    return (await Proxy(
      'https://api.deezer.com' + path,
      options
    )) as AxiosResponse<T>;
  }

  private async getAlbumTracks(albumId: string) {
    const { data: albumData } = await this.fetchAPI<DeezerAlbumData>(
      '/platform/generic/album/' + albumId
    );

    if (!albumData.data) throw new Error('invalid response from deezer api');

    return Promise.all(
      albumData.data.attributes.tracksIds.map(
        // we have to do this so we could get track tokens, too
        x => this.getTrackInfo(x.toString())
      )
    );
  }

  private getBlowfishKey(songId: string) {
    const idMd5 = createHash('md5').update(songId, 'ascii').digest('hex');
    let bfKey = '';

    for (let i = 0; i < 16; i++)
      bfKey += String.fromCharCode(
        idMd5.charCodeAt(i) ^
          idMd5.charCodeAt(i + 16) ^
          BLOWFISH_SECRET.charCodeAt(i)
      );

    return bfKey;
  }

  private async createStream(trackToken: string, songId: string) {
    const { data }: { data: DeezerGetUrlResponse } = await Proxy.post(
      'https://media.deezer.com/v1/get_url',
      {
        license_token: await this.getLicenseToken(),
        media: [
          {
            type: 'FULL',
            formats: [
              { cipher: BLOWFISH_CIPHER, format: TRACK_FORMATS.MP3_128 },
              { cipher: BLOWFISH_CIPHER, format: TRACK_FORMATS.MP3_64 },
              { cipher: BLOWFISH_CIPHER, format: TRACK_FORMATS.MP3_MISC },
            ],
          },
        ],
        track_tokens: [trackToken],
      }
    );
    if (!data.data) throw new Error('invalid get_url response, wtf?');

    const passThrough = new PassThrough();
    const { url } = data.data[0].media[0].sources[0];

    const blowfishKey = this.getBlowfishKey(songId);

    https.get(url, function (response) {
      let i = 0;
      response.on('readable', () => {
        let chunk: Buffer | null;
        while ((chunk = response.read(2048))) {
          if (i % 3 > 0 || chunk.length < 2048) passThrough.push(chunk);
          else {
            const blowfishDecrypt = createDecipheriv(
              'bf-cbc',
              blowfishKey,
              '\x00\x01\x02\x03\x04\x05\x06\x07'
            );
            blowfishDecrypt.setAutoPadding(false);

            let decoded = blowfishDecrypt.update(
              chunk.toString('hex'),
              'hex',
              'hex'
            );
            decoded += blowfishDecrypt.final('hex');
            passThrough.push(decoded, 'hex');
          }

          i++;
        }
      });

      response.on('end', () => {
        passThrough.push(null);
      });
    });

    return passThrough;
  }

  public async download(url: string, matches: Record<string, string>) {
    let data: DeezerTrackData[];

    if (matches.album) data = await this.getAlbumTracks(matches.album);
    else data = [await this.getTrackInfo(matches.track)];

    const tracks = data.map(
      x =>
        ({
          media: {
            type: MediaServiceResponseMediaType.FETCH,
            fetch: async () => {
              let trackToken = x.TRACK_TOKEN;
              if (x.TRACK_TOKEN_EXPIRE - Date.now() <= 0)
                trackToken = (await this.getTrackInfo(x.SNG_ID)).TRACK_TOKEN;

              return await this.createStream(trackToken, x.SNG_ID);
            },
          },
          information: {
            title: x.SNG_TITLE,
            author: x.ART_NAME,
            cover: `https://e-cdn-images.dzcdn.net/images/cover/${x.ALB_PICTURE}/264x264-000000-80-0-0.jpg`,
            duration: +x.DURATION,
            url,
          },
        } as MediaServiceResponse)
    );

    return tracks;
  }

  public async findOne(query: string) {
    const { data } = await this.fetchAPI(
      '/search/track?q=' + encodeURIComponent(query)
    );
    if (data.data.length === 0) throw new UserError('query-not-found');

    const track = data.data[0].id;
    const responses = await this.download(
      'https://deezer.com/us/track/' + track,
      { track }
    );

    return responses[0] as MediaServiceResponse;
  }
}
