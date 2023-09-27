import { Proxy } from '@/modules/utils';
import { DownloadReturnedValue, MediaServiceResponse, MediaServiceResponseMediaType } from '../types';
import { MediaService } from './baseservice';

interface SyndicationResult {
  __typename: string;
};

interface TweetUserDetails {
  name: string;
  screen_name: string;
};

interface TweetVideoVariant {
  bitrate: number;
  content_type: 'video/mp4' | 'application/x-mpegURL';
  url: string;
};

interface TweetMediaDetailVideoInfo {
  duration_millis: number;
  variants: TweetVideoVariant[];
}

interface TweetMediaDetail {
  expanded_url: string;
  media_url_https: string;
  type: string;
  video_info: TweetMediaDetailVideoInfo;
};

interface TweetSyndicationResult extends SyndicationResult {
  __typename: 'Tweet';
  created_at: string;
  mediaDetails: TweetMediaDetail[];
  text: string;
  user: TweetUserDetails;
};

export default class TwitterService extends MediaService {
  public hosts: string[] = [
    'twitter.com',
    'vxtwitter.com',
    'fxtwitter.com',
    'x.com'
  ];
  public patterns = [
    '/:user/status/:id/video/:v',
    '/:user/status/:id.mp4',
    '/:user/status/:id'
  ];

  private formVideoResponse(text: string, user: TweetUserDetails, media: TweetMediaDetail): MediaServiceResponse {
    let bestMatch: TweetVideoVariant = media.video_info.variants
      .filter(x => x.content_type === 'video/mp4')
      .sort((a, b) =>  b.bitrate - a.bitrate)[0];

    const { screen_name, name } = user;
    return {
      information: {
        title: text,
        cover: media.media_url_https,
        author: `${name} (@${screen_name})`,
        duration: media.video_info.duration_millis / 1000,
        url: media.expanded_url,
      },
      media: {
        type: MediaServiceResponseMediaType.URL,
        url: bestMatch.url
      }
    };
  }

  public async download(_: string, matches: Record<string, string>): Promise<DownloadReturnedValue> {
    const { data: synd } = await Proxy.get<TweetSyndicationResult>('https://cdn.syndication.twimg.com/tweet-result?id=' + matches.id);
    if (synd.__typename !== 'Tweet')
      throw new Error('invalid syndication response, received type ' + synd.__typename);

    const videos = synd.mediaDetails.filter(x => x.type === 'video');

    if (videos.length === 0)
      throw new Error('specified tweet does not contain a video');

    if (matches.v) {
      const media = videos[+matches.v - 1];
      if (!media)
        throw new Error('no such video');

      return this.formVideoResponse(synd.text, synd.user, media);
    }

    return videos.map(media => this.formVideoResponse(synd.text, synd.user, media));
  }
};