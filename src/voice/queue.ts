import { ChannelTextType, User } from 'detritus-client/lib/structures';

import { VoiceFormatResponse, VoiceFormatResponseType } from './processors';
import VoiceQueueAnnouncer from './announcer';
import NewVoice from './new';
import { VoiceFormatProcessor } from './processors';

export default class VoiceQueue {
  public readonly announcer: VoiceQueueAnnouncer;
  private formats: VoiceFormatProcessor;
  private queue: VoiceFormatResponse[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, logChannel: ChannelTextType) {
    this.voice = voice;
    this.announcer = new VoiceQueueAnnouncer(voice, logChannel);
    this.formats = new VoiceFormatProcessor(voice.application);
  }

  public async push(url: string, user?: User) {
    let result = await this.formats.fromURL(url);
    if (!result) return false;
    if (Array.isArray(result))
      result = result.map((res) => {
        res.info.submittee = user;
        return res;
      });
    else result.info.submittee = user;
    const wasEmpty = this.queue.length === 0;

    if (Array.isArray(result)) this.queue.push(...result);
    else this.queue.push(result);
    if (wasEmpty) await this.next();
    return true;
  }

  public async next() {
    if (this.voice.ffmpeg && !this.voice.ffmpeg.readableEnded) return;
    if (this.queue.length === 0) return this.announcer.reset();
    const singleResponse = this.queue.shift();
    this.announcer.play(singleResponse.info);
    switch (singleResponse.type) {
      case VoiceFormatResponseType.URL:
        this.voice.play(singleResponse.url);
        break;
      case VoiceFormatResponseType.READABLE:
        this.voice.play(singleResponse.readable);
        break;
      case VoiceFormatResponseType.FETCH:
        this.voice.play(await singleResponse.fetch());
        break;
      default:
        throw new Error('Unknown VoiceFormatResponseType');
    }
    // this.voice.playStream(singleResponse.readable ? singleResponse.readable : await singleResponse.fetch());
  }
}
