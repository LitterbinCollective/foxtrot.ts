import { Structures, Utils } from 'detritus-client';
import { EventEmitter } from 'events';
import { unlinkSync } from 'fs';
import * as Sentry from '@sentry/node';
import { Readable } from 'stream';

import mediaservice from '@cluster/managers/mediaservices';
import {
  DownloadReturnedValue,
  MediaServiceResponse,
  MediaServiceResponseInformation,
  MediaServiceResponseMedia,
  MediaServiceResponseMediaType,
} from '@cluster/managers/mediaservices/types';
import { Constants, sendFeedback, UserError } from '@cluster/utils';

import VoiceQueueAnnouncer from './announcer';
import NewVoice from '.';

const FORMAT_FROMURL_TIMEOUT_MS = 30000;

type GetPlayable = [ string | Readable, string | undefined ];

class VoiceQueueMediaError extends Error {
  public information?: MediaServiceResponseInformation;

  constructor(message?: string, information?: MediaServiceResponseInformation) {
    super(message);
    this.information = information;
  }
}

// exists solely so there will not be a racing condition
class VoiceQueueMedia extends EventEmitter {
  private _children?: VoiceQueueMedia[];
  private formatData!: DownloadReturnedValue;
  private _submittee?: Structures.User;
  private message?: Structures.Message;
  private url: string;

  constructor(
    url: string | MediaServiceResponse,
    message?: Structures.Message | Structures.User
  ) {
    super();

    if (message instanceof Structures.User) this._submittee = message;
    else this.message = message;

    if (typeof url === 'string') {
      this.url = url;
      this.fetchFormatData();
    } else {
      this.url = url.information.url;
      this.formatData = url;
    }
  }

  private get submittee(): Structures.User | undefined {
    if (this._submittee) return this._submittee;
    return this.message ? this.message.author : undefined;
  }

  public get info(): MediaServiceResponseInformation {
    if (this.formatData && !Array.isArray(this.formatData))
      return this.formatData.information;

    return {
      title: '[...]',
      author: '',
      duration: 0,
      url: this.url,
    };
  }

  public get loaded() {
    return this.formatData !== undefined;
  }

  public get children() {
    if (!this.formatData)
      throw new Error(
        'children getter called on an invalid VoiceQueueMedia object'
      );

    if (!Array.isArray(this.formatData))
      return [this];
    if (this._children)
      return this._children;

    return (this._children = this.formatData.map(x => new VoiceQueueMedia(x)));
  }

  private async fetchFormatData() {
    try {
      let result;

      let timeoutHandle;
      const timeoutPromise = new Promise<void>((_, rej) => {
        timeoutHandle = setTimeout(
          () =>
            rej(
              new Error(
                'download timed out (' + FORMAT_FROMURL_TIMEOUT_MS + 'ms)'
              )
            ),
            FORMAT_FROMURL_TIMEOUT_MS
        );
      });

      result = await Promise.race([
        timeoutPromise,
        mediaservice.download(this.url),
      ]);
      clearTimeout(timeoutHandle);

      if (!result) throw new UserError('queue.url-unsupported');

      if (this.submittee) {
        const name = this.submittee.discriminator === '0' ? this.submittee.username : this.submittee.tag;

        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i++)
            result[i].information.metadata = {
              name,
              icon_url: this.submittee.avatarUrl,
              url: this.message ? this.message.jumpLink : undefined,
            };
        } else
          result.information.metadata = {
            name,
            icon_url: this.submittee.avatarUrl,
            url: this.message ? this.message.jumpLink : undefined,
          };
      }

      this.formatData = result;
    } catch (err) {
      return this.emit('error', err);
    }

    this.emit('finish');
  }

  public async getPlayable(media?: MediaServiceResponseMedia): Promise<GetPlayable> {
    if (!this.formatData || Array.isArray(this.formatData))
      throw new Error('getPlayable called on an invalid VoiceQueueMedia object');

    if (!media)
      media = this.formatData.media;

    try {
      switch (media.type) {
        case MediaServiceResponseMediaType.URL:
          return [ media.url, media.decryptionKey ];
        case MediaServiceResponseMediaType.FILE:
          throw new Error('not implemented');
        case MediaServiceResponseMediaType.FETCH:
          const data = await media.fetch();

          if (data instanceof Readable)
            return [ data, undefined ];

          return await this.getPlayable(data);
        default:
          throw new Error('unknown VoiceFormatResponseType');
      }
    } catch (err) {
      const error = err as VoiceQueueMediaError;

      if (!Array.isArray(this.formatData)) {
        error.information = Object.assign({}, this.formatData.information);
        delete error.information.metadata;
      }

      throw error;
    }
  }

  public after() {
    if (!this.formatData || Array.isArray(this.formatData))
      throw new Error('after called on an invalid VoiceQueueMedia object');

    if (this.formatData.media.type === MediaServiceResponseMediaType.FILE)
      unlinkSync(this.formatData.media.path);
  }
}

export default class VoiceQueue {
  public currentlyPlaying?: VoiceQueueMedia;
  public readonly announcer: VoiceQueueAnnouncer;
  private queue: VoiceQueueMedia[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, logChannel: Structures.ChannelTextType) {
    this.voice = voice;
    this.announcer = new VoiceQueueAnnouncer(voice, logChannel);
  }

  public async push(
    url: string,
    message?: Structures.Message | Structures.User
  ) {
    const object = new VoiceQueueMedia(url, message);
    this.queue.push(object);

    return new Promise((res, rej) => {
      object.once('finish', () => {
        const index = this.queue.indexOf(object);
        if (index === -1) return;
        this.queue.splice(index, 1, ...object.children);

        if (!this.voice.isPlaying) this.next();

        res(true);
      });

      object.once('error', error => {
        rej(error);

        const index = this.queue.indexOf(object);
        if (index !== -1) this.queue.splice(index, 1);
      });
    });
  }

  public get info() {
    return this.queue.map(response => response.info);
  }

  public delete(id: number) {
    if (!this.queue[id]) throw new UserError('queue.not-found');
    return this.queue.splice(id, 1)[0];
  }

  public clear() {
    this.queue = [];
  }

  public streamingError(err: any) {
    const error = Utils.Markup.codestring(err.toString());
    this.announcer.createMessage(Constants.EMOJIS.BOMB + ' ' + error);
    this.next();

    Sentry.captureException(err);
  }

  public async next() {
    if (this.voice.isPlaying) return;
    this.announcer.reset();

    if (this.queue.length === 0) return;

    const media = this.queue[0];
    if (!media) return;
    if (!media.loaded) {
      this.announcer.createLoadingMessage();
      return;
    }

    if (this.currentlyPlaying)
      this.currentlyPlaying.after();

    this.queue.shift();

    this.currentlyPlaying = media;
    this.announcer.play(media.info);

    try {
      const playable = await media.getPlayable();
      this.voice.play(...playable);
    } catch (err: any) {
      this.streamingError(err);
    }

    // this.voice.playStream(singleResponse.readable ? singleResponse.readable : await singleResponse.fetch());
  }
}
