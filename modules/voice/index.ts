import { GatewayClientEvents, Structures } from 'detritus-client';
import { EventEmitter } from 'events';

import chatsounds from '@/modules/chatsounds';
import { GuildSettingsStore, VoiceStore } from '@/modules/stores';
import config from '@/configs/app.json';

import VoicePipeline from './pipeline';
import { VoiceEffectManager } from './managers';
import FFMpeg from './ffmpeg';
import VoiceQueue from './queue';

export * as Announcer from './announcer';
export * as FFMpeg from './ffmpeg';
export * as Managers from './managers';
export * as Pipeline from './pipeline';
export * as Queue from './queue';

export default class Voice extends EventEmitter {
  public effects!: VoiceEffectManager;
  public initialized = false;
  public queue!: VoiceQueue;
  public special = true;
  public readonly AUDIO_CHANNELS = 2;
  public readonly SAMPLE_RATE = 48000;
  private ffmpeg?: FFMpeg;
  private pipeline!: VoicePipeline;

  constructor(
    channel: Structures.ChannelGuildVoice,
    logChannel: Structures.ChannelTextType
  ) {
    super();
    this.initialize(channel, logChannel);
  }

  private get channel() {
    return this.pipeline.channel;
  }

  public get isPlaying() {
    return this.ffmpeg !== undefined;
  }

  public onVoiceStateUpdate(payload: GatewayClientEvents.VoiceStateUpdate) {
    if (this.pipeline) this.pipeline.onVoiceStateUpdate(payload);
  }

  public onVoiceServerUpdate(payload: GatewayClientEvents.VoiceServerUpdate) {
    if (this.pipeline) this.pipeline.onVoiceServerUpdate(payload);
  }

  private async initialize(channel: Structures.ChannelGuildVoice, logChannel: Structures.ChannelTextType) {
    try {
      this.pipeline = new VoicePipeline(this, channel);
    } catch (err) {
      if (err instanceof Error) {
        await logChannel.createMessage(err.message);
        return this.kill();
      }
    }

    this.effects = new VoiceEffectManager(this);
    this.effects.on('data', chunk => this.pipeline.write(chunk));
    this.queue = new VoiceQueue(this, logChannel);
    this.pipeline.playSilence();

    const settings = await GuildSettingsStore.getOrCreate(channel.guildId);
    this.special = settings.special;

    this.emit('initialized');
    this.initialized = true;
  }

  public update() {
    if (this.pipeline) this.pipeline.update();
  }

  public play(stream: NodeJS.ReadableStream | string) {
    if (this.ffmpeg) this.cleanUp();

    this.pipeline.stopSilence();

    const fromURL = typeof stream === 'string';

    const pre = ['-re'];
    if (fromURL && config.proxy.length !== 0)
      pre.unshift('-http_proxy', config.proxy);

    this.ffmpeg = new FFMpeg(
      [
        '-analyzeduration',
        '0',
        '-loglevel',
        process.env.NODE_ENV === 'production' ? '0' : '32',
        '-ar',
        this.SAMPLE_RATE.toString(),
        '-ac',
        this.AUDIO_CHANNELS.toString(),
        '-f',
        's16le',
      ],
      pre,
      fromURL ? stream : undefined
    );

    this.effects.createAudioEffectManager();
    this.ffmpeg.on('end', () => this.skip());

    if (!fromURL) {
      stream.pipe(this.ffmpeg, { end: false });
      stream.on('error', (err) => {
        this.cleanUp();
        this.queue.streamingError(err);
      });
    }

    this.ffmpeg.pipe(this.effects, { end: false });
  }

  public set volume(value: number) {
    this.pipeline.volume = value;
  }

  public set bitrate(value: number) {
    this.pipeline.bitrate = value * 1000;
  }

  public get bitrate() {
    return this.pipeline.bitrate;
  }

  public skip() {
    this.cleanUp();
    this.queue.next();
  }

  private cleanUp() {
    if (this.ffmpeg) {
      this.ffmpeg.unpipe(this.effects);
      this.ffmpeg.destroy();
      this.ffmpeg = undefined;
    }

    this.pipeline.playSilence();
    this.effects.destroyAudioEffectManager();
  }

  public canExecuteVoiceCommands(member: Structures.Member) {
    if (!this.channel)
      return true;
    return this.channel === member.voiceChannel;
  }

  public canLeave(member: Structures.Member) {
    if (!this.channel)
      return true;
    return this.canExecuteVoiceCommands(member) || this.channel.members.size === 1;
  }

  public async playSoundeffect(script: string | Buffer) {
    if (script instanceof Buffer) return this.pipeline.playBuffer(script);
    const context = chatsounds.newBuffer(script);
    const buffer = await context.audio();
    if (context.mute) this.pipeline.clearReadableArray();
    if (buffer) this.pipeline.playBuffer(buffer);
  }

  public kill(forceLeave: boolean = false) {
    this.cleanUp();
    this.pipeline.destroy();
    if (this.channel)
      VoiceStore.delete(this.channel.guildId as string);
  }
}
