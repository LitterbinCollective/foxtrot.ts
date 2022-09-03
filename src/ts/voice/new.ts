import { GatewayClientEvents } from 'detritus-client';
import {
  ChannelGuildVoice,
  ChannelTextType,
  Member,
} from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';

import { Application } from '../application';
import VoicePipeline from './pipeline';
import { VoiceEffectManager } from './managers';
import FFMpeg from './ffmpeg';
import { VoiceStore } from '../stores';
import VoiceQueue from './queue';

export default class NewVoice extends EventEmitter {
  public effects!: VoiceEffectManager;
  public initialized = false;
  public queue!: VoiceQueue;
  public readonly AUDIO_CHANNELS = 2;
  public readonly SAMPLE_RATE = 48000;
  private channel: ChannelGuildVoice;
  private ffmpeg?: FFMpeg;
  private pipeline!: VoicePipeline;

  constructor(
    channel: ChannelGuildVoice,
    logChannel: ChannelTextType
  ) {
    super();
    this.channel = channel;
    this.initialize(logChannel);
  }

  public get isPlaying() {
    return this.ffmpeg !== undefined;
  }

  public onVoiceStateUpdate(payload: GatewayClientEvents.VoiceStateUpdate) {
    if (this.pipeline)
      this.pipeline.onVoiceStateUpdate(payload);
  }

  public onVoiceServerUpdate(payload: GatewayClientEvents.VoiceServerUpdate) {
    if (this.pipeline)
      this.pipeline.onVoiceServerUpdate(payload);
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

    this.effects = new VoiceEffectManager(this);
    this.queue = new VoiceQueue(this, logChannel);
    this.pipeline.playSilence();

    this.emit('initialized');
    this.initialized = true;
  }

  public update() {
    if (this.pipeline)
      this.pipeline.update();
  }

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
      ['-re'],
      fromURL ? stream : undefined
    );

    this.effects.createAudioEffectManager();
    this.ffmpeg.on('end', () => this.skip());

    if (!fromURL) stream.pipe(this.ffmpeg, { end: false });

    this.ffmpeg
      .pipe(this.effects, { end: false })
      .pipe(this.pipeline, { end: false });
  }

  public set volume(value: number) {
    this.pipeline.volume = value;
  }

  public set bitrate(value: number) {
    this.pipeline.bitrate = value * 1000;
  }

  public skip() {
    this.cleanUp();
    this.queue.next();
  }

  private cleanUp() {
    if (this.ffmpeg) {
      this.ffmpeg.unpipe(this.effects);
      this.ffmpeg?.destroy();
      this.ffmpeg = undefined;
    }

    this.pipeline.playSilence();
    this.effects.destroyAudioEffectManager();
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
    /*
    script = script.toLowerCase();
    for (const word of script.split(' '))
      if (word.split(':')[0].split('#')[0] === 'sh') {
        this.pipeline.clearReadableArray();
        break;
      }
    const parsedScript = this.application.sh.Parser.parse(script);
    const stream = await this.application.sh.Audio.run(parsedScript);
    this.pipeline.addReadable(stream);
    */
  }

  public kill(unexpected: boolean = false) {
    if (unexpected) this.queue.announcer.unexpectedLeave();
    this.cleanUp();
    this.pipeline.destroy();
    VoiceStore.delete(this.channel.guildId)
  }
}
