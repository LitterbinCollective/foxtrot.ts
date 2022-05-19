import { ChannelGuildVoice, ChannelTextType } from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';

import { Application } from '../Application';
import VoicePipeline from './pipeline';

export default class NewVoice extends EventEmitter {
  private application: Application;
  private channel: ChannelGuildVoice;
  private pipeline: VoicePipeline;

  constructor(
    application: Application,
    channel: ChannelGuildVoice,
    logChannel: ChannelTextType
  ) {
    super();
    this.application = application;
    this.channel = channel;
    this.initialize(logChannel);
  }

  private async initialize(logChannel: ChannelTextType) {
    try {
      this.pipeline = new VoicePipeline(this.channel);
    } catch (err) {
      await logChannel.createMessage(err.message);
      this.kill();
    }

    // this.application.voices.set(this.channel.guildId, this);
  }

  public kill() {

  }
}