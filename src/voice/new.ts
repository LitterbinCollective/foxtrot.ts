import { ChannelGuildVoice, ChannelTextType, Member } from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

import { Application } from '../Application';
import VoicePipeline from './pipeline';
import { VoiceEffectProcessor, VoiceFormatProcessor } from './processors';
import { FFMpeg } from './ffmpeg';

export default class NewVoice extends EventEmitter {
  public readonly queue = [];
  public readonly AUDIO_CHANNELS = 2;
  public readonly SAMPLE_RATE = 48000;
  private application: Application;
  private channel: ChannelGuildVoice;
  private effects: VoiceEffectProcessor;
  private ffmpeg?: FFMpeg;
  private formats: VoiceFormatProcessor;
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

    this.effects = new VoiceEffectProcessor(this);
    this.formats = new VoiceFormatProcessor(this.application);

    this.application.newvoices.set(this.channel.guildId, this);
    this.pipeline.on('connected', async () =>
      {
        this.emit('initialized');
        const result = await this.formats.fromURL('https://soundcloud.com/iamhzn/nocturne');
        if (result !== false)
          this.playStream(await (Array.isArray(result) ? result[0] : result).fetch());
      }
    )
  }

  private playStream(stream: Readable) {
    if (this.ffmpeg) {
      this.ffmpeg.unpipe(this.effects);
      this.ffmpeg.destroy();
    }

    this.ffmpeg = new FFMpeg([
      '-analyzeduration', '0',
      // '-loglevel', '0',
      '-ar', this.SAMPLE_RATE.toString(),
      '-ac', this.AUDIO_CHANNELS.toString(),
      '-f', 's16le'
    ], [ '-re' ]);

    this.effects.createAudioEffectProcessor();
    this.ffmpeg.on('end', () => console.log('ffmpeg stream ended'));
    stream.pipe(this.ffmpeg, { end: false })
      .pipe(this.effects, { end: false })
      .pipe(this.pipeline, { end: false });
  }

  public canExecuteVoiceCommands(member: Member) {
    return this.channel === member.voiceChannel;
  }

  public canLeave(member: Member) {
    return this.canExecuteVoiceCommands(member) ||
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