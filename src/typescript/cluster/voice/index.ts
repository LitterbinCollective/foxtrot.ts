import { GatewayClientEvents, Structures, Utils } from 'detritus-client';
import { EventEmitter } from 'events';
import * as Sentry from '@sentry/node';

import chatsounds from '@cluster/chatsounds';
import { t } from '@cluster/managers/i18n';
import { GuildSettingsStore, VoiceStore } from '@cluster/stores';
import { Constants, UserError } from '@cluster/utils';
import sox, { SoxManager } from '@cluster/managers/sox';

import VoicePipeline from './pipeline';
import FFMpeg from './ffmpeg';
import VoiceQueue from './queue';
import modules from './modules';
import BaseModule from './modules/basemodule';

export * as Announcer from './announcer';
export * as FFMpeg from './ffmpeg';
export * as Modules from './modules';
export * as Pipeline from './pipeline';
export * as Queue from './queue';

export default class Voice extends EventEmitter {
  public allowCorrupt = false;
  public effects!: SoxManager;
  public initialized = false;
  public pipeline!: VoicePipeline;
  public queue!: VoiceQueue;
  public special = true;
  private activeModule?: BaseModule;
  private ffmpeg?: FFMpeg;

  constructor(
    channel: Structures.ChannelGuildVoice,
    logChannel: Structures.ChannelTextType
  ) {
    super();
    this.initialize(channel, logChannel);
  }

  public get channel() {
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

  private async initialize(
    channel: Structures.ChannelGuildVoice,
    logChannel: Structures.ChannelTextType
  ) {
    try {
      this.pipeline = new VoicePipeline(this, channel);
    } catch (err) {
      if (err instanceof Error) {
        await logChannel.createMessage(err.message);
        return this.kill();
      }
    }

    this.effects = sox.clone();
    this.effects.on('data', chunk => this.pipeline.write(chunk));
    this.queue = new VoiceQueue(this, logChannel);
    this.pipeline.playSilence();

    const settings = await GuildSettingsStore.getOrCreate(channel.guildId);
    this.special = settings.special;
    this.allowCorrupt = settings.allowCorrupt;

    this.emit('initialized');
    this.initialized = true;
  }

  public update() {
    if (this.activeModule) this.activeModule.internalUpdate();
    if (this.pipeline) this.pipeline.update();
  }

  public assignModule(module: string) {
    if (!(module in modules))
      throw new UserError(
        'voice-modules.not-found',
        Object.keys(modules).map(x => Utils.Markup.codestring(x)).join(', ')
      );

    const isNew = this.activeModule === undefined;
    if (!isNew)
      this.destroyModule();
    this.activeModule = new modules[module as keyof typeof modules](this);
    this.activeModule.postAssign();
    return isNew;
  }

  public async destroyModule(err?: UserError) {
    if (!this.activeModule)
      throw new UserError('voice-modules.no-active');
    this.activeModule.internalCleanUp();
    delete this.activeModule;

    if (err && this.channel?.guild)
      await this.queue.announcer.createMessage(
        await t(this.channel.guild, err.message, ...err.formatValues)
      );
  }

  public invokeModule(line?: string) {
    if (!this.activeModule)
      throw new UserError('voice-modules.no-active');

    this.activeModule.action(line);
  }

  public play(stream: NodeJS.ReadableStream | string, decryptionKey?: string) {
    if (this.ffmpeg) this.cleanUp();

    this.pipeline.stopSilence();

    const fromURL = typeof stream === 'string';

    const pre = ['-re'];
    if (decryptionKey)
      pre.push('-decryption_key', decryptionKey);

    this.ffmpeg = new FFMpeg(
      [
        '-analyzeduration',
        '0',
        '-loglevel',
        process.env.NODE_ENV === 'production' ? '0' : '32',
        '-ar',
        Constants.OPUS_SAMPLE_RATE.toString(),
        '-ac',
        Constants.OPUS_AUDIO_CHANNELS.toString(),
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
      stream.on('error', err => {
        this.cleanUp();
        this.queue.streamingError(err);
      });
    }

    this.ffmpeg.pipe(this.effects, { end: false });
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
    if (!this.channel) return true;
    return this.channel === member.voiceChannel;
  }

  public canLeave(member: Structures.Member) {
    if (!this.channel) return true;
    return (
      this.canExecuteVoiceCommands(member) || this.channel.members.size === 1
    );
  }

  public async playSoundeffect(script: string | Buffer) {
    if (script instanceof Buffer) return this.pipeline.playBuffer(script);

    try {
      const context = chatsounds.new(script);
      const buffer = await context.buffer({
        sampleRate: Constants.OPUS_SAMPLE_RATE,
        audioChannels: Constants.OPUS_AUDIO_CHANNELS,
        format: 's16le'
      });
      if (context.mute) this.pipeline.clearReadableArray();
      if (buffer) this.pipeline.playBuffer(buffer);
    } catch (err) {
      Sentry.captureException(err);
      throw new UserError('runtime-error')
    }
  }

  public async kill(forceLeave: boolean = false) {
    this.cleanUp();
    try {
      await this.destroyModule();
    } catch (err) {}

    this.pipeline.destroy();
    if (this.channel) VoiceStore.delete(this.channel.guildId as string);
  }
}
