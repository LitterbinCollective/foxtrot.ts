import { Proxy, parseHTMLEntities } from '@/modules/utils';

import { MediaService } from './baseservice';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseMediaType,
} from '../types';

interface BandcampTrackFormats {
  'mp3-128': string;
}

interface BandcampTrackInfo {
  art_id: number;
  artist: string | null;
  duration: number;
  file: BandcampTrackFormats;
  title: string;
  url: string;
}

interface BandcampInfo {
  art_id: string;
  artist: string;
  trackinfo: BandcampTrackInfo[];
  url: string;
}

const TRALBUM_REGEX = /<script.+src="https?:\/\/s.\.bcbits\.com\/bundle\/bundle\/1\/tralbum_head-.+\.js".+data-tralbum="(.*?)".+><\/script>/g;

export default class BandcampService extends MediaService {
  public disableSearch = true;
  public hosts = ['bandcamp.com'];
  public patterns = ['/album/:album', '/track/:track'];

  public before(url: URL): URL | Promise<URL> {
    if (url.hostname.split('.').length !== 3) throw new Error('no subdomain');

    return url;
  }

  public async download(url: string): Promise<DownloadReturnedValue> {
    const { data: info } = await Proxy(url);

    const match = [...info.matchAll(TRALBUM_REGEX)];
    if (match.length === 0)
      throw new Error('no tralbum data matches, something must be broken');

    const processed: BandcampInfo = JSON.parse(parseHTMLEntities(match[0][1]));

    const array = processed.trackinfo.map(
      track =>
        ({
          media: {
            type: MediaServiceResponseMediaType.URL,
            url: track.file['mp3-128'],
          },
          information: {
            title: track.title,
            author: track.artist || processed.artist,
            cover: `https://f4.bcbits.com/img/a${processed.art_id}_1.jpg`,
            duration: track.duration,
            url,
          },
        } as MediaServiceResponse)
    );

    return array;
  }
}
