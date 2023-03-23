import { createDecipheriv, createHash } from 'crypto';
import https from 'https';
import { PassThrough } from 'stream';

import { Proxy } from '@/modules/utils';

import { VoiceFormatResponseFetch, VoiceFormatResponseType } from '../managers';
import { BaseFormat } from './baseformat';

const BLOWFISH_CIPHER = 'BF_CBC_STRIPE';

// most of the JSON garbage we receive from deezer is not
// typed because there is too much stuff to type
interface DeezerGetUserDataResponse {
  results?: {
    USER?: {
      OPTIONS: {
        license_token: string;
        expiration_timestamp: number;
      };
    };
    SESSION_ID?: string;
  };
};

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
};

interface DeezerAlbumData {
  data?: {
    attributes: {
      duration: number;
      name: string;
      tracksIds: number[];
    };
  }
};

interface DeezerAPIToken {
  data?: {
    attributes: {
      token: string;
      userId: number;
    };
    id: string;
    type: 'accesstoken';
  };
};

enum TRACK_FORMATS {
  MP3_128 = 'MP3_128',
  MP3_64 = 'MP3_64',
  MP3_MISC = 'MP3_MISC'
}

interface DeezerGetUrlResponse {
  data?: {
    media: {
      cipher: { type: typeof BLOWFISH_CIPHER },
      exp: number,
      format: TRACK_FORMATS.MP3_128,
      nbf: number,
      sources: {
        provider: string,
        url: string
      }[]
    }[];
  }[];
};

export default class DeezerFormat extends BaseFormat {
  public regex = /^https?:\/\/(?:www\.)?deezer\.com\/[A-z]{2}\/(album|track)\/(\d*)/g;
  public printName = 'Deezer';
  private apiToken: string = '';
  private authTokenFetching: boolean = false;
  private authTokenPromises: ((value?: any) => void)[][] = [];
  private licenseToken: string = '';
  private userExpiration: number = -1;
  private readonly BLOWFISH_SECRET = 'g4el58wc0zvf9na1';
  private readonly DEEZER_APP_STATE_REGEX = /<script.*>window\.__DZR_APP_STATE__\s*=\s*(.+?)\s*<\/script>/g;
  private readonly EMBED_APP_ID = '430922';

  constructor(formatCredentials: any) {
    super(formatCredentials);
  }

  private async getAuthTokens() {
    try {
      // if license token is going to expire in 30 seconds
      // we have to refetch it, so there would not be a problem
      if (this.licenseToken &&
          this.userExpiration - Date.now() / 1000 >= 30)
        return;
      if (this.authTokenFetching)
        return await new Promise<undefined>((res, rej) =>
          this.authTokenPromises.push([res, rej])
        );

      this.authTokenFetching = true;

      const cid = Math.floor(Math.random() * 99999999);
      const { data: userData }: { data: DeezerGetUserDataResponse } = await Proxy.post(
        'https://www.deezer.com/ajax/gw-light.php?method=deezer.getUserData&input=3&api_version=1.0&api_token=&cid=' + cid,
      );

      if (!userData.results || !userData.results.USER || !userData.results.SESSION_ID)
        throw new Error('invalid response from deezer.getUserData');

      const { data: apiToken }: { data: DeezerAPIToken } = await Proxy.post(
        'https://api.deezer.com/platform/generic/token/unlogged',
        'app_id=' + this.EMBED_APP_ID
      );
      if (!apiToken.data)
        throw new Error('invalid response from deezer api');

      this.apiToken = apiToken.data.attributes.token;

      const { license_token, expiration_timestamp } = userData.results.USER.OPTIONS;
      this.licenseToken = license_token;
      this.userExpiration = expiration_timestamp;

      this.authTokenFetching = false;
      this.authTokenPromises.forEach(([res]) => res());
      this.authTokenPromises = [];
    } catch (err) {
      this.authTokenPromises.forEach(([_, rej]) => rej(err));
      this.authTokenPromises = [];
      throw err;
    }
  }

  private async getLicenseToken(): Promise<string> {
    await this.getAuthTokens();
    return this.licenseToken;
  }

  private async getAPIToken() {
    await this.getAuthTokens();
    return this.apiToken;
  }

  private getBlowfishKey(songId: string) {
    const idMd5 = createHash('md5')
      .update(songId, 'ascii')
      .digest('hex');
    let bfKey = '';

    for (let i = 0; i < 16; i++)
      bfKey += String.fromCharCode(idMd5.charCodeAt(i) ^ idMd5.charCodeAt(i + 16) ^ this.BLOWFISH_SECRET.charCodeAt(i));

    return bfKey;
  }

  private async getTrackInfo(trackId: string) {
    const { data: html } = await Proxy('https://www.deezer.com/us/track/' + trackId);

    const matches = [...html.matchAll(this.DEEZER_APP_STATE_REGEX)];
    if (matches.length === 0)
      throw new Error('no deezer app state data matches, something must be broken');

    const trackData: { DATA: DeezerTrackData } = JSON.parse(matches[0][1]);
    return trackData.DATA;
  }

  private async getAlbumTracks(albumId: string) {
    const { data: albumData }: { data: DeezerAlbumData } = await Proxy.get(
      'https://api.deezer.com/platform/generic/album/' + albumId,
      {
        headers: {
          authorization: 'Bearer ' + await this.getAPIToken()
        }
      }
    );

    if (!albumData.data)
      throw new Error('invalid response from deezer api');

    return Promise.all(
      albumData.data.attributes.tracksIds.map(
        // we have to do this so we could get track tokens, too
        (x) => this.getTrackInfo(x.toString())
      )
    );
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
              { cipher: BLOWFISH_CIPHER, format: TRACK_FORMATS.MP3_MISC }
            ]
          }
        ],
        track_tokens: [ trackToken ]
      }
    );
    if (!data.data)
      throw new Error('invalid get_url response, wtf?');

    const passThrough = new PassThrough();
    const { url } = data.data[0].media[0].sources[0];

    const blowfishKey = this.getBlowfishKey(songId);

    https.get(url, function (response) {
      let i = 0;
      response.on('readable', () => {
        let chunk: Buffer | null;
        while (chunk = response.read(2048)) {
          if (i % 3 > 0 || chunk.length < 2048)
            passThrough.push(chunk)
          else {
            const blowfishDecrypt = createDecipheriv('bf-cbc', blowfishKey, '\x00\x01\x02\x03\x04\x05\x06\x07');
            blowfishDecrypt.setAutoPadding(false);

            let decoded = blowfishDecrypt.update(chunk.toString('hex'), 'hex', 'hex');
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

  public async process(url: string, [ _, type, id ]: RegExpMatchArray): Promise<VoiceFormatResponseFetch[] | false> {
    let data: DeezerTrackData[];

    try {
      switch(type) {
        case 'album':
          data = await this.getAlbumTracks(id);
        break;
        case 'track':
          data = [ await this.getTrackInfo(id) ];
        break;
        default:
          return false;
      }
    } catch (err) {
      return false;
    }

    return data.map(x => ({
      fetch: async () => {
        let trackToken = x.TRACK_TOKEN;
        if (x.TRACK_TOKEN_EXPIRE - Date.now() <= 0)
          trackToken = (await this.getTrackInfo(x.SNG_ID)).TRACK_TOKEN;

        return await this.createStream(trackToken, x.SNG_ID);
      },
      type: VoiceFormatResponseType.FETCH,
      info: {
        title: x.ART_NAME + ' - ' + x.SNG_TITLE,
        image: `https://e-cdn-images.dzcdn.net/images/cover/${x.ALB_PICTURE}/264x264-000000-80-0-0.jpg`,
        url,
        duration: +x.DURATION
      }
    })) as VoiceFormatResponseFetch[];
  }
}
