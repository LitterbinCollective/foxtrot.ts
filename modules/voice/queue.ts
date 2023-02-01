import { Structures } from 'detritus-client';

import VoiceQueueAnnouncer from './announcer';
import NewVoice from '.';
import {
  VoiceFormatResponse,
  VoiceFormatResponseType,
  VoiceFormatManager,
  VoiceFormatResponseURL,
  VoiceFormatResponseReadable,
  VoiceFormatResponseFetch,
} from './managers';
import { UserError } from '../utils';

export default class VoiceQueue {
  public readonly announcer: VoiceQueueAnnouncer;
  private formats: VoiceFormatManager;
  private inProgress: number[] = [];
  private queue: VoiceFormatResponse[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, logChannel: Structures.ChannelTextType) {
    this.voice = voice;
    this.announcer = new VoiceQueueAnnouncer(voice, logChannel);
    this.formats = new VoiceFormatManager();
  }

  public async push(url: string, user?: Structures.User) {
    const next = this.inProgress.length === 0;
    const pushID = Date.now();
    const index = this.inProgress.push(pushID) - 1;
    const wasEmpty = this.queue.length === 0;

    let result;

    try {
      const FORMAT_FROMURL_TIMEOUT = 30; // in seconds

      let timeoutHandle;
      const timeoutPromise = new Promise<void>((_, rej) => {
        timeoutHandle = setTimeout(
          () => rej(new Error('fromURL timed out (' + FORMAT_FROMURL_TIMEOUT + ' seconds)')),
          FORMAT_FROMURL_TIMEOUT * 1000
        );
      })

      result = await Promise.race([ timeoutPromise, this.formats.fromURL(url) ]);
      clearTimeout(timeoutHandle);

      if (!result)
        throw new UserError('the requested URL is not supported');
    } catch (err) {
      this.inProgress.splice(index, 1);
      if (wasEmpty && this.queue.length > 0)
        await this.next();

      throw err;
    }

    if (this.inProgress.indexOf(pushID) === -1)
      return false;

    if (Array.isArray(result))
      result = result.map(res => {
        res.info.submittee = user;
        return res;
      });
    else result.info.submittee = user;

    if (Array.isArray(result)) this.queue.push(...result);
    else this.queue.push(result);

    if (wasEmpty && next) await this.next();

    this.inProgress.splice(index, 1);

    return true;
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
    this.inProgress = [];
  }

  public async next() {
    if (this.voice.isPlaying) return;
    this.announcer.reset();

    if (this.queue.length === 0) return;

    const singleResponse = this.queue.shift();
    if (!singleResponse) return;

    this.announcer.play(singleResponse.info);
    switch (singleResponse.type) {
      case VoiceFormatResponseType.URL:
        this.voice.play((singleResponse as VoiceFormatResponseURL).url);
        break;
      case VoiceFormatResponseType.READABLE:
        this.voice.play(
          (singleResponse as VoiceFormatResponseReadable).readable
        );
        break;
      case VoiceFormatResponseType.FETCH:
        this.voice.play(
          await (singleResponse as VoiceFormatResponseFetch).fetch()
        );
        break;
      default:
        throw new Error('Unknown VoiceFormatResponseType');
    }
    // this.voice.playStream(singleResponse.readable ? singleResponse.readable : await singleResponse.fetch());
  }
}
