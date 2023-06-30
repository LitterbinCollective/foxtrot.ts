import { Proxy } from '@/modules/utils';
import { DownloadReturnedValue } from '../types';
import { MediaService } from './baseservice';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

const TWITTER_GUEST_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
const GUEST_TOKEN_AGE = 10740000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

interface TwitterGuestActivate {
  guest_token: string;
};

interface TwitterAPIError {
  code: number;
};

interface TwitterPost {
  retweeted_status_id_str: string;
};

interface TwitterConversation {
  errors?: TwitterAPIError[];
  conversation?: {
    globalObjects?: {
      tweets?: Record<string, TwitterPost>
    }
  }
};

export default class TwitterService extends MediaService {
  public disableSearch: boolean = true;
  public patterns = [
    '/:user/status/:tweet/video/:v',
    '/:user/status/:tweet',
    '/i/spaces/:space'
  ];
  private guestToken: string | null = null;
  private guestTokenFetching = false;
  private guestTokenPromises: ((value?: any) => void)[][] = [];
  private guestTokenLast = -1;

  private get guestTokenUsable() {
    return this.guestToken && Date.now() - this.guestTokenLast < GUEST_TOKEN_AGE;
  }

  private async fetchAPI<T>(version: string, path: string, options: AxiosRequestConfig = {}) {
    if (!this.guestTokenUsable)
      await this.assignGuestToken();

    const headers = {
      'authorization': 'Bearer ' + TWITTER_GUEST_TOKEN,
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'user-agent': USER_AGENT,
      'x-guest-token': this.guestToken
    };
    options.headers = Object.assign(options.headers || {}, headers);

    return (
      await Proxy(
        'https://api.twitter.com/' + version + path,
        options
      )
    ) as AxiosResponse<T>;
  }

  private async assignGuestToken(force = false) {
    if (this.guestTokenUsable && !force) return;
    if (this.guestTokenFetching)
      return await new Promise<undefined>((res, rej) =>
        this.guestTokenPromises.push([res, rej])
      );

    this.guestTokenFetching = true;

    try {
      const { data: activate } = await Proxy.get<TwitterGuestActivate>('https://api.twitter.com/1.1/guest/activate.json', {
        headers: {
          authorization: 'Bearer ' + TWITTER_GUEST_TOKEN,
          'user-agent': USER_AGENT
        }
      });
      this.guestTokenLast = Date.now();
      this.guestToken = activate.guest_token;

      this.guestTokenFetching = false;
      this.guestTokenPromises.forEach(([res]) => res());
      this.guestTokenPromises = [];
    } catch (err) {
      this.guestTokenFetching = false;
      this.guestTokenPromises.forEach(([_, rej]) => rej(err));
      this.guestTokenPromises = [];
    }
  }

  private async getPost(id: string, retry = true): Promise<any> {
    try {
      const { data: post } = await this.fetchAPI<TwitterConversation>('2', '/timeline/conversation/' + id + '.json?tweet_mode=extended&include_user_entities=1');

      if (post.errors)
        throw new Error('Twitter API responded with errors: ' + post.errors.map(x => x.code).join(', '));

      if (!post.conversation || !post.conversation.globalObjects || !post.conversation.globalObjects.tweets)
        throw new Error('Twitter API did not respond with conversation.globalObjects.tweets');

      const { tweets } = post.conversation.globalObjects;

      if (!tweets[id])
        throw new Error('Twitter API responded, but the tweet with the specified id is missing?');

      return tweets[tweets[id].retweeted_status_id_str || id];
    } catch(err) {
      if (retry) {
        await this.assignGuestToken();
        return await this.getPost(id, false);
      }

      throw err;
    }
  }
};