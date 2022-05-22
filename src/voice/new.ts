import { ChannelGuildVoice, ChannelTextType, Member } from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';

import { Application } from '../Application';
import VoicePipeline from './pipeline';

export default class NewVoice extends EventEmitter {
  public readonly AUDIO_CHANNELS = 2;
  public readonly SAMPLE_RATE = 48000;
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
      this.pipeline = new VoicePipeline(this, this.channel);
    } catch (err) {
      await logChannel.createMessage(err.message);
      return this.kill();
    }

    this.application.newvoices.set(this.channel.guildId, this);
    this.pipeline.playSilence();
    this.emit('initialized');
  }

  public canCallVoiceCommands(member: Member) {
    return this.channel === member.voiceChannel;
  }

  public canLeave(member: Member) {
    return this.canCallVoiceCommands(member) ||
      this.channel.members.size === 1;
  }

  public async playSoundeffect(script: string) {
    script = script.toLowerCase();
    for (const word of script.split(' '))
      if (word.split(':')[0].split('#')[0] === 'sh') {
        this.pipeline.mixer.clearReadableArray();
        break;
      }
    const parsedScript = this.application.sh.Parser.parse(script);
    const stream = await this.application.sh.Audio.run(parsedScript);
    this.pipeline.mixer.addReadable(stream);
  }

  public kill() {
    this.pipeline.destroy();
    this.application.newvoices.delete(this.channel.guildId);
  }
}