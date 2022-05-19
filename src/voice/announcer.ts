import { ChannelGuildText } from 'detritus-client/lib/structures';

export default class VoiceAnnouncer {
  private channel: ChannelGuildText;

  constructor (channel: ChannelGuildText) {
    this.channel = channel;
  }

  private play (streamInfo) {}
}