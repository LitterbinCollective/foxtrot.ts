import { ChannelTextType } from 'detritus-client/lib/structures';

export default class VoiceQueueAnnouncer {
  private channel: ChannelTextType;

  constructor (channel: ChannelTextType) {
    this.channel = channel;
  }

  private play (streamInfo) {}
}