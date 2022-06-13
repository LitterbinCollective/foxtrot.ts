import { ChannelTextType } from 'detritus-client/lib/structures';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import { VoiceFormatResponseInfo } from './processors';
import { EMBED_COLORS, EMOJIS } from '../constants';

export default class VoiceQueueAnnouncer {
  private channel: ChannelTextType;
  private current: VoiceFormatResponseInfo;
  private startTime: number;

  constructor (channel: ChannelTextType) {
    this.channel = channel;
  }

  private durationInStr(seconds: number) {
    const result = [~~(seconds / 60) % 60, ~~seconds % 60];
    let hours: number;
    if ((hours = ~~(seconds / 3600)) !== 0) result.unshift(hours);
    return result
      .map((n) => (n < 10 ? '0' + n.toString() : n.toString()))
      .join(':');
  }

  private playProgress(duration?: number) {
    if (!duration) {
      if (this.current)
        duration = this.current.duration
      else
        throw new Error('Duration not provided');
    }

    const progress = Math.floor((Date.now() - this.startTime) / 1000);
    const factor = progress / duration;

    const progressStr = this.durationInStr(progress),
      durationStr = this.durationInStr(duration);

    const LENGTH = 16;
    const repeatCount = ~~(factor * LENGTH);
    const progressBar = '-'.repeat(repeatCount) + EMOJIS.RADIO + '-'.repeat(LENGTH - repeatCount);
    return Markup.codestring(`${progressStr} ${progressBar} ${durationStr}`);
  }

  public play(streamInfo: VoiceFormatResponseInfo) {
    this.startTime = Date.now();
    this.current = streamInfo;
    const fromURL = typeof streamInfo.image === 'string';
    const embed = new Embed({
      author: streamInfo.submittee ? {
        name: streamInfo.submittee.username + '#' + streamInfo.submittee.discriminator,
        icon_url: streamInfo.submittee.avatarUrl,
      } : undefined,
      title: EMOJIS.PLAY + ' ' + streamInfo.title,
      color: EMBED_COLORS.DEF,
      url: streamInfo.url,
      thumbnail: {
        url: fromURL ? streamInfo.image as string : 'attachment://image.jpg',
      },
    });
    if (streamInfo.duration)
      embed.description = this.playProgress(streamInfo.duration);
    const options: RequestTypes.CreateMessage = { embed };
    if (!fromURL)
      options.file = { filename: 'image.jpg', value: streamInfo.image as Buffer };
    return this.channel.createMessage(options);
  }
}