import { GatewayClientEvents, Structures, Utils } from 'detritus-client';
import { EventEmitter } from 'events';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as Sentry from '@sentry/node';

import chatsounds from '@cluster/chatsounds';
import { t } from '@cluster/managers/i18n';
import { FeedbackStore, VoiceStore } from '@cluster/stores';
import { Constants, UserError } from '@cluster/utils';
import sox, { SoxManager } from '@cluster/managers/sox';
import tts, { TTSManager } from '@cluster/managers/tts';
import { OPUS_AUDIO_CHANNELS, OPUS_FRAME_SIZE, OPUS_SAMPLE_RATE } from '@/utils/constants';
import { getOrCreateSettings } from '@/db/queries';

import VoicePipeline from './pipeline';
import VoiceQueue from './queue';
import modules from './modules';
import BaseModule from './modules/basemodule';

export * as Announcer from './announcer';
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
  public time = 0;
  private activeModule?: BaseModule;
  private ffmpeg?: ChildProcessWithoutNullStreams;
  private silence = true;
  private tts!: TTSManager;

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

  public onMessageCreate(payload: GatewayClientEvents.MessageCreate) {
    if (this.tts) this.tts.createMessage(payload);
  }

  public onVoiceStateUpdate(payload: GatewayClientEvents.VoiceStateUpdate) {
    if (this.pipeline) this.pipeline.onVoiceStateUpdate(payload);
    if (this.tts) this.tts.voiceStateUpdate(payload);
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
    this.effects.createAudioEffectManager();
    this.queue = new VoiceQueue(this, logChannel);

    const settings = await getOrCreateSettings(channel.guildId);
    this.special = settings.special;
    this.allowCorrupt = settings.allowCorrupt;
    this.pipeline.volume = settings.defaultVolume;

    this.tts = tts.clone();
    this.tts.voice = this;
    this.tts.pick = settings.tts || undefined;
    this.tts.tellJoinLeave = settings.ttsTellJoinLeave;
    this.tts.tellMessageAuthor = settings.ttsTellMessageAuthor;

    this.emit('initialized');
    this.initialized = true;

    this.playChatsoundScript('null=1 (100500 zdorovo):realm(internal)');
  }

  public update() {
    let samples: Buffer | null = null;

    const naturalLength = OPUS_FRAME_SIZE * OPUS_AUDIO_CHANNELS * 2;
    const length = naturalLength * this.effects.speed;
    if (this.ffmpeg && !this.silence) {
      samples = this.ffmpeg.stdout.read(length);

      if (!samples && this.ffmpeg?.stdout.closed)
        this.skip()
      else if (samples)
        this.time += samples.length / (OPUS_SAMPLE_RATE * OPUS_AUDIO_CHANNELS * 2);
    } else
      samples = Buffer.alloc(Math.floor(length));

    if (samples)
      this.effects.write(samples);

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

    this.silence = false;

    const fromURL = typeof stream === 'string';

    const pre = [];
    if (decryptionKey)
      pre.push('-decryption_key', decryptionKey);

    this.ffmpeg = spawn('ffmpeg', [
      ...pre,
      '-i', fromURL ? stream : 'pipe:0',
      '-f', 's16le',
      '-ar', Constants.OPUS_SAMPLE_RATE.toString(),
      '-ac', Constants.OPUS_AUDIO_CHANNELS.toString(),
      'pipe:1'
    ]);

    // this.effects.createAudioEffectManager();

    if (!fromURL) {
      stream.pipe(this.ffmpeg.stdin);
      stream.on('error', err => {
        this.cleanUp();
        this.queue.streamingError(err);
      });
    }
  }

  public pause() {
    if (!this.ffmpeg)
      throw new UserError('commands.nothing-is-playing');

    // this.ffmpeg.togglePause();
    this.silence = !this.silence;
  }

  public skip() {
    this.cleanUp();
    this.queue.next();
  }

  private cleanUp() {
    if (this.ffmpeg) {
      this.ffmpeg.stdin.end();
      this.ffmpeg.kill('SIGKILL');
      this.ffmpeg = undefined;
    }

    this.time = 0;
    // this.effects.destroyAudioEffectManager();
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

  public async playChatsoundScript(script: string | Buffer) {
    if (script instanceof Buffer) return this.pipeline.playBuffer(script);

    try {
      // TODO: mute prop in WorkerContext? optimize worker?
      const context = chatsounds.new(script.toString());
      const buffer = await context.buffer({
        sampleRate: Constants.OPUS_SAMPLE_RATE,
        audioChannels: Constants.OPUS_AUDIO_CHANNELS,
        format: 's16le'
      });
      if (context.mute) this.pipeline.clearReadableArray();
      if (buffer) this.pipeline.playBuffer(buffer);
    } catch (err) {
      let id = '';

      Sentry.withScope(scope => {
        scope.setContext('chatsoundInfo', {
          script
        });

        id = Sentry.captureException(err, {
          mechanism: {
            type: 'voice_play_soundeffect',
            handled: true
          }
        });
      });

      throw new UserError('runtime-error.min', Utils.Markup.codestring(id));
    }
  }

  public async kill(forceLeave: boolean = false) {
    this.cleanUp();
    try {
      await this.destroyModule();
    } catch (err) {}

    this.pipeline.destroy();
    if (this.channel)
      VoiceStore.delete(this.channel.guildId as string);

    FeedbackStore.create(this.queue.announcer.channel);
  }
}
