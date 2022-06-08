import { ChannelTextType, User } from 'detritus-client/lib/structures';

import { FormatResponse } from '.';
import VoiceQueueAnnouncer from './announcer';
import NewVoice from './new';
import { VoiceFormatProcessor } from './processors';

export default class VoiceQueue {
  private formats: VoiceFormatProcessor;
  private queue: FormatResponse[] = [];
  private readonly announcer: VoiceQueueAnnouncer;
  private readonly voice: NewVoice;

  constructor (voice: NewVoice, logChannel: ChannelTextType) {
    this.voice = voice;
    this.announcer = new VoiceQueueAnnouncer(logChannel);
    this.formats = new VoiceFormatProcessor(voice.application);
  }

  public async push(url: string, user?: User) {
    const result = await this.formats.fromURL(url, user);
    if (!result) return false;
    const wasEmpty = this.queue.length === 0;

    if (Array.isArray(result))
      this.queue.push(...result);
    else
      this.queue.push(result);
    if (wasEmpty) await this.next();
    return true;
  }

  public async next() {
    if ((this.voice.ffmpeg && !this.voice.ffmpeg.readableEnded) || this.queue.length === 0)
      return;
    const singleResponse = this.queue.shift();
    this.voice.playStream(singleResponse.readable ? singleResponse.readable : await singleResponse.fetch());
  }
}