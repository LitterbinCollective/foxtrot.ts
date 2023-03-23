import { Proxy } from '@/modules/utils';

import { VoiceFormatResponseType, VoiceFormatResponseURL } from '../managers';
import { BaseFormat } from './baseformat';

// everything that is necessary for downloading is typed
interface BandcampTrackFormats {
  'mp3-128': string
};

interface BandcampTrackInfo {
  art_id: number;
  artist: string | null;
  duration: number;
  file: BandcampTrackFormats;
  title: string;
  url: string;
};

interface BandcampInfo {
  art_id: string;
  artist: string;
  trackinfo: BandcampTrackInfo[]
  url: string;
};

export default class BandcampFormat extends BaseFormat {
  public regex = /^https?:\/\/(?:.*)\.bandcamp\.com\/(?:track|album)\/(?:.*)$/g;
  public printName = 'Bandcamp';
  private readonly TRALBUM_REGEX =
    /<script.+src="https?:\/\/s.\.bcbits\.com\/bundle\/bundle\/1\/tralbum_head-.+\.js".+data-tralbum="(.*?)".+><\/script>/g;
  private readonly CHARS = { quot: '"', amp: '&' };

  private decodeHTML(str: string) {
    return str.replaceAll(
      /&(.+?);/g,
      m => this.CHARS[m.slice(1, -1) as keyof typeof this.CHARS]
    );
  }

  public async process(url: string) {
    const { data: info } = await Proxy(url);

    const match = [...info.matchAll(this.TRALBUM_REGEX)];
    if (match.length === 0)
      throw new Error('no tralbum data matches, something must be broken');

    const processed: BandcampInfo = JSON.parse(this.decodeHTML(match[0][1]));

    const array = await Promise.all(
      processed.trackinfo.map(async (track) => {
        return {
          type: VoiceFormatResponseType.URL,
          url: track.file['mp3-128'],
          info: {
            title: (track.artist || processed.artist) + ' - ' + track.title,
            image: `https://f4.bcbits.com/img/a${processed.art_id}_1.jpg`,
            url: processed.url,
            duration: track.duration,
          },
        };
      })
    );

    return array as VoiceFormatResponseURL[];
  }
}
