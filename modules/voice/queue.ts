import { Structures } from 'detritus-client';
import { EventEmitter } from 'events';

import VoiceQueueAnnouncer from './announcer';
import NewVoice from '.';
import {
  VoiceFormatResponse,
  VoiceFormatResponseType,
  VoiceFormatResponseURL,
  VoiceFormatResponseReadable,
  VoiceFormatResponseFetch,
  VoiceFormatResponseInfo,
  formats,
} from './managers';
import { UserError } from '../utils';

const FORMAT_FROMURL_TIMEOUT = 30; // in seconds

class VoiceQueueMedia extends EventEmitter {
  private _children?: VoiceQueueMedia[];
  private formatData!: VoiceFormatResponse | VoiceFormatResponse[];
  private _submittee?: Structures.User;
  private message?: Structures.Message;
  private url: string;

  constructor(url: string | VoiceFormatResponse, message?: Structures.Message | Structures.User) {
    super();

    if (message instanceof Structures.User)
      this._submittee = message
    else
      this.message = message;

    if (typeof url === 'string') {
      this.url = url;
      this.fetchFormatData();
    } else {
      this.url = url.info.url;
      this.formatData = url;
    }
  }

  private get submittee(): Structures.User | undefined {
    if (this._submittee)
      return this._submittee;
    return this.message ? this.message.author : undefined;
  }

  public get info(): VoiceFormatResponseInfo {
    if (this.formatData && !Array.isArray(this.formatData))
      return this.formatData.info;

    return {
      title: '[loading...]',
      duration: 0,
      url: this.url,
      image: ''
    };
  }

  public get loaded() {
    return this.formatData !== undefined;
  }

  public get children() {
    if (!this.formatData)
      throw new Error('children getter called on an invalid VoiceQueueMedia object');

    if (!Array.isArray(this.formatData))
      return [ this ];

    if (this._children)
      return this._children;

    return this._children = this.formatData.map(x => new VoiceQueueMedia(x));
  }

  private async fetchFormatData() {
    try {
      let result;

      let timeoutHandle;
      const timeoutPromise = new Promise<void>((_, rej) => {
        timeoutHandle = setTimeout(
          () => rej(new Error('fromURL timed out (' + FORMAT_FROMURL_TIMEOUT + ' seconds)')),
          FORMAT_FROMURL_TIMEOUT * 1000
        );
      })

      result = await Promise.race([ timeoutPromise, formats.fromURL(this.url) ]);
      clearTimeout(timeoutHandle);

      if (!result)
        throw new UserError('the requested URL is not supported');

      if (this.submittee) {
        if (Array.isArray(result)) {
          for (let i = 0; i < result.length; i++)
            result[i].info.author = {
              name: this.submittee.tag,
              icon_url: this.submittee.avatarUrl,
              url: this.message ? this.message.jumpLink : undefined
            };
        } else
          result.info.author = {
            name: this.submittee.tag,
            icon_url: this.submittee.avatarUrl,
            url: this.message ? this.message.jumpLink : undefined
          };
      }

      this.formatData = result;
    } catch (err) {
      return this.emit('error', err);
    }

    this.emit('finish');
  }

  public async getStream() {
    if (!this.formatData || Array.isArray(this.formatData))
      throw new Error('getStream called on an invalid VoiceQueueMedia object');

    switch (this.formatData.type) {
      case VoiceFormatResponseType.URL:
        return (this.formatData as VoiceFormatResponseURL).url;
      case VoiceFormatResponseType.READABLE:
        return (this.formatData as VoiceFormatResponseReadable).readable;
      case VoiceFormatResponseType.FETCH:
        return await (this.formatData as VoiceFormatResponseFetch).fetch();
      default:
        throw new Error('unknown VoiceFormatResponseType');
    }
  }
}

export default class VoiceQueue {
  public readonly announcer: VoiceQueueAnnouncer;
  private queue: VoiceQueueMedia[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, logChannel: Structures.ChannelTextType) {
    this.voice = voice;
    this.announcer = new VoiceQueueAnnouncer(voice, logChannel);
  }

  public async push(url: string, message?: Structures.Message | Structures.User) {
    const object = new VoiceQueueMedia(url, message);
    this.queue.push(object);

    return new Promise((res, rej) => {
      object.once('finish', () => {
        const index = this.queue.indexOf(object);
        if (index === -1) return;
        this.queue.splice(index, 1, ...object.children);

        if (!this.voice.isPlaying)
          this.next();

        res(true);
      });

      object.once('error', (error) => {
        rej(error);

        const index = this.queue.indexOf(object);
        if (index !== -1)
          this.queue.splice(index, 1);
      });
    });
  }

  public get info() {
    return this.queue.map(response => response.info);
  }

  public delete(id: number) {
    if (!this.queue[id])
      throw new UserError('specified id does not exist in the queue');
    return this.queue.splice(id, 1)[0];
  }

  public clear() {
    this.queue = [];
  }

  private async continue(media: VoiceQueueMedia) {
    this.announcer.play(media.info);
    try {
      this.voice.play(await media.getStream());
    } catch (err: any) {
      this.announcer.createMessage('Skipping due to a streaming error: ' + err.toString());
      this.next();
    }
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

    this.queue.shift();
    this.continue(media);

    // this.voice.playStream(singleResponse.readable ? singleResponse.readable : await singleResponse.fetch());
  }
}
