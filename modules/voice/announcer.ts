import { Structures, Utils } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';

import { Constants, durationInString } from '@/modules/utils';

import { VoiceFormatResponseInfo } from './managers';
import NewVoice from '.';

export default class VoiceQueueAnnouncer {
  public channel: Structures.ChannelTextType;
  private current?: VoiceFormatResponseInfo;
  private loadingMessage?: Structures.Message;
  private startTime?: number;
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, channel: Structures.ChannelTextType) {
    this.voice = voice;
    this.channel = channel;
  }

  public async createLoadingMessage() {
    this.loadingMessage = await this.channel.createMessage('Loading...');
  }

  private playProgress(duration?: number) {
    if (!this.startTime) return;
    if (!duration) {
      if (this.current) duration = this.current.duration;
      else throw new Error('Duration not provided');
    }

    const progress = Math.floor((Date.now() - this.startTime) / 1000);
    const factor = Math.min(progress / duration, 1);

    const progressStr = durationInString(progress),
      durationStr = durationInString(duration);

    const LENGTH = 16;
    const repeatCount = ~~(factor * LENGTH);
    const progressBar =
      '-'.repeat(Math.max(repeatCount, 0)) +
      Constants.EMOJIS.RADIO +
      '-'.repeat(Math.max(LENGTH - repeatCount, 0));
    return Utils.Markup.codestring(
      `${progressStr} ${progressBar} ${durationStr}`
    );
  }

  public play(
    streamInfo: VoiceFormatResponseInfo | undefined = this.current,
    returnCreateMessage = false
  ): RequestTypes.CreateMessage | undefined {
    if (!streamInfo) throw new Error('No stream info provided');
    if (!this.current) {
      this.startTime = Date.now();
      this.current = streamInfo;
    }

    const fromURL = typeof streamInfo.image === 'string';
    console.log(streamInfo);
    const embed = new Utils.Embed({
      author: streamInfo.author,
      title: Constants.EMOJIS.PLAY + ' ' + streamInfo.title,
      description: this.playProgress(streamInfo.duration),
      color: Constants.EMBED_COLORS.DEFAULT,
      url: streamInfo.url,
      thumbnail: {
        url: fromURL ? (streamInfo.image as string) : 'attachment://image.jpg',
      },
    });

    const options: RequestTypes.CreateMessage = { embed };
    if (!fromURL)
      options.file = {
        filename: 'image.jpg',
        value: streamInfo.image as Buffer,
      };
    if (returnCreateMessage) return options;

    if (this.loadingMessage) {
      this.loadingMessage.edit(options);
      this.loadingMessage = undefined;
      return;
    }

    this.channel.createMessage(options);
  }

  public unexpectedLeave() {
    return this.channel.createMessage('what is wrong with you?');
  }

  public reset() {
    this.current = undefined;
    this.startTime = undefined;
  }
}
