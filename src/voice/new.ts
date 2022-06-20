import {
  ChannelGuildVoice,
  ChannelTextType,
  Member,
} from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';

import { Application } from '../Application';
import VoicePipeline from './pipeline';
import { VoiceEffectProcessor } from './processors';
import FFMpeg from './ffmpeg';
import VoiceQueue from './queue';

export default class NewVoice extends EventEmitter {
  public effects!: VoiceEffectProcessor;
  public initialized = false;
  public queue!: VoiceQueue;
  public readonly application: Application;
  public readonly AUDIO_CHANNELS = 2;
  public readonly SAMPLE_RATE = 48000;
  private channel: ChannelGuildVoice;
  private ffmpeg?: FFMpeg;
  private pipeline!: VoicePipeline;

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

  public get isPlaying() {
    return this.ffmpeg !== undefined;
  }

  private async initialize(logChannel: ChannelTextType) {
    try {
      this.pipeline = new VoicePipeline(this, this.channel);
    } catch (err) {
      if (err instanceof Error) {
        await logChannel.createMessage(err.message);
        return this.kill();
      }
    }

    this.effects = new VoiceEffectProcessor(this);
    this.queue = new VoiceQueue(this, logChannel);
    this.pipeline.playSilence();

    this.application.newvoices.set(this.channel.guildId, this);
    this.emit('initialized');
    this.initialized = true;
  }

  public update() { this.pipeline.update(); }

  public play(stream: NodeJS.ReadableStream | string) {
    if (this.ffmpeg) this.cleanUp();

    this.pipeline.stopSilence();

    const fromURL = typeof stream === 'string';
    this.ffmpeg = new FFMpeg(
      [
        '-analyzeduration',
        '0',
        // '-loglevel', '0',
        '-ar',
        this.SAMPLE_RATE.toString(),
        '-ac',
        this.AUDIO_CHANNELS.toString(),
        '-f',
        's16le',
      ],
      [ '-re' ],
      fromURL ? stream : undefined
    );

    this.effects.createAudioEffectProcessor();
    this.ffmpeg.on('end', () => this.skip());

    if (!fromURL) stream.pipe(this.ffmpeg, { end: false });

    this.ffmpeg
      .pipe(this.effects, { end: false })
      .pipe(this.pipeline, { end: false });
  }

  public skip() {
    this.cleanUp();
    this.queue.next();
  }

  private cleanUp() {
    if (this.ffmpeg) {
      this.ffmpeg.unpipe(this.effects);
      this.ffmpeg.destroy();
    }
    this.ffmpeg = undefined;
    this.pipeline.playSilence();

    this.effects.destroyAudioEffectProcessor();
    this.effects.unpipe(this.pipeline);
  }

  public canExecuteVoiceCommands(member: Member) {
    return this.channel === member.voiceChannel;
  }

  public canLeave(member: Member) {
    return (
      this.canExecuteVoiceCommands(member) || this.channel.members.size === 1
    );
  }

  public async playSoundeffect(script: string) {
    script = script.toLowerCase();
    for (const word of script.split(' '))
      if (word.split(':')[0].split('#')[0] === 'sh') {
        this.pipeline.clearReadableArray();
        break;
      }
    const parsedScript = this.application.sh.Parser.parse(script);
    const stream = await this.application.sh.Audio.run(parsedScript);
    this.pipeline.addReadable(stream);
  }

  public kill() {
    this.cleanUp();
    this.pipeline.destroy();
    this.application.newvoices.delete(this.channel.guildId);
  }
}
