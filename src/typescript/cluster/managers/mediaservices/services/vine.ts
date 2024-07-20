import { MediaService } from './baseservice';
import { DownloadReturnedValue, MediaServiceResponseMediaType } from '../types';
import { URLMediaService } from '..';

interface VineArchivePost {
  description: string;
  permalinkUrl: string;
  thumbnailUrl: string;
  username: string;
  videoUrl: string;
};

export default class VineService extends MediaService {
  public disableSearch: boolean = true;
  public hosts = [ 'vine.co' ];
  public patterns = [
    '/v/:id',
  ];

  public async download(_: string, matches: Record<string, string>): Promise<DownloadReturnedValue> {
    const res = await fetch(`https://archive.vine.co/posts/${matches.id}.json`);
    const post: VineArchivePost = await res.json();

    const probe = await URLMediaService.probe(post.videoUrl);

    return {
      information: {
        title: post.description,
        cover: post.thumbnailUrl,
        author: post.username,
        duration: probe.duration,
        url: post.permalinkUrl,
      },
      media: {
        type: MediaServiceResponseMediaType.URL,
        url: post.videoUrl,
      },
    };
  }
};