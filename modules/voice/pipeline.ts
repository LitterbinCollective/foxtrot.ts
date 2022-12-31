import { GatewayClientEvents, Structures } from 'detritus-client';
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { OpusEncoder } from '@discordjs/opus';
import { EventEmitter } from 'events';
import { Readable, Transform, TransformCallback } from 'stream';

import { Mixer } from '@/modules/mixer';
import { Logger } from '@/modules/utils';

import NewVoice from '.';

class VoiceSafeConnection extends EventEmitter {
  public voiceConnection!: VoiceConnection;
  private readonly logger: Logger;

  constructor(voiceChannel: Structures.ChannelGuildVoice) {
    super();
    this.logger = new Logger(`Voice safe connection [${voiceChannel.guildId}]`);
    this.onVoiceStateUpdate = this.onVoiceStateUpdate.bind(this);
    this.onVoiceServerUpdate = this.onVoiceServerUpdate.bind(this);
    this.on('voiceStateUpdate', this.onVoiceStateUpdate);
    this.on('voiceServerUpdate', this.onVoiceServerUpdate);
    this.initialize(voiceChannel);
  }

  private async initialize(voiceChannel: Structures.ChannelGuildVoice) {
    if (!voiceChannel.canJoin || !voiceChannel.canSpeak)
      throw new Error(
        'Bot is not able to join or speak in this voice channel.'
      );
    const voiceConnectObj = await voiceChannel.join({ receive: true });
    if (!voiceConnectObj) {
      this.logger.debug('failed to connect, destroying');
      return this.destroy();
    }
    this.voiceConnection = voiceConnectObj.connection;
    this.voiceConnection.setOpusEncoder();
    this.voiceConnection.setSpeaking({
      voice: true,
    });
    this.voiceConnection.sendAudioSilenceFrame();
    if (this.voiceConnection.gateway.socket)
      this.voiceConnection.gateway.socket.socket.onclose = () => {};
    this.emit('connected');
  }

  private get channel() {
    return this.voiceConnection ? this.voiceConnection.channel : undefined;
  }

  public async onVoiceServerUpdate(
    payload: GatewayClientEvents.VoiceServerUpdate
  ) {
    if (!this.channel) return;
    if (payload.guildId !== this.channel.guildId) return;
    this.voiceConnection.gateway.setEndpoint(payload.endpoint);
    this.voiceConnection.gateway.setToken(payload.token);
    if (this.voiceConnection.gateway.socket)
      this.voiceConnection.gateway.socket.socket.onclose = () => {};
    this.voiceConnection.gateway.once('transportReady', () => {
      this.logger.debug('gateway says ready');
      this.voiceConnection.setSpeaking({
        voice: true,
      });
      this.voiceConnection.gateway.transport?.connect();
    });
  }

  public async onVoiceStateUpdate(
    payload: GatewayClientEvents.VoiceStateUpdate
  ) {
    if (!this.channel) return;
    if (
      payload.voiceState.userId === this.channel.client.userId &&
      payload.voiceState.guildId === this.channel.guildId &&
      payload.leftChannel
    )
      return this.destroy();
  }

  public sendAudio(packet: Buffer) {
    if (!this.voiceConnection || this.voiceConnection.killed) return;
    this.voiceConnection.sendAudio(packet, { isOpus: true });
  }

  public sendEmpty() {
    if (!this.voiceConnection || this.voiceConnection.killed) return;
    this.voiceConnection.sendAudioSilenceFrame();
  }

  public destroy() {
    if (this.voiceConnection) this.voiceConnection.kill();
    this.emit('destroy');
  }
}

export default class VoicePipeline extends Transform {
  public mixer?: Mixer;
  public readonly OPUS_FRAME_LENGTH = 20;
  public readonly OPUS_FRAME_SIZE = 960;
  public readonly SAMPLE_BYTE_LEN = 2;
  private silent: boolean = false;
  private opus?: OpusEncoder;
  private opusLeftover? = Buffer.alloc(0);
  private opusPacketsReceived = 0;
  private opusPacketCheck = 0;
  private readonly connection: VoiceSafeConnection;
  private readonly logger: Logger;
  private readonly voice: NewVoice;
  private readonly REQUIRED_SAMPLES: number;

  public onVoiceServerUpdate: (
    payload: GatewayClientEvents.VoiceServerUpdate
  ) => void;
  public onVoiceStateUpdate: (
    payload: GatewayClientEvents.VoiceStateUpdate
  ) => void;

  constructor(voice: NewVoice, voiceChannel: Structures.ChannelGuildVoice) {
    super({ readableObjectMode: true });

    this.voice = voice;
    this.logger = new Logger(`Voice pipeline [${voiceChannel.guildId}]`);
    this.connection = new VoiceSafeConnection(voiceChannel);
    this.mixer = new Mixer();
    this.opus = new OpusEncoder(this.SAMPLE_RATE, this.AUDIO_CHANNELS);

    this.REQUIRED_SAMPLES =
      this.AUDIO_CHANNELS * this.OPUS_FRAME_SIZE * this.SAMPLE_BYTE_LEN;

    this.onConnectionDestroy = this.onConnectionDestroy.bind(this);
    this.onVoiceServerUpdate = this.connection.onVoiceServerUpdate;
    this.onVoiceStateUpdate = this.connection.onVoiceStateUpdate;

    this.connection.on('connected', () => this.emit('connected'));
    this.connection.on('destroy', this.onConnectionDestroy);
  }

  public get channel() {
    return this.connection.voiceConnection.channel;
  }

  public set bitrate(value: number) {
    if (this.opus) this.opus.setBitrate(Math.min(128e3, Math.max(16e3, value)));
  }

  public get bitrate(): number {
    if (this.opus) return this.opus.getBitrate();
    return -1;
  }

  private onConnectionDestroy() {
    this.voice.kill(true);
  }

  public update() {
    const packet = this.read();
    if (packet) {
      this.connection.sendAudio(packet);
      this.opusPacketsReceived++;
    }

    if (this.silent) this.write(Buffer.alloc(this.REQUIRED_SAMPLES));

    const time = Date.now() - this.opusPacketCheck;
    if (time >= 1000) {
      this.logger.debug(
        'received',
        this.opusPacketsReceived,
        'over',
        time,
        'ms'
      );
      this.opusPacketsReceived = 0;
      this.opusPacketCheck = Date.now();
    }
  }

  public _transform(
    chunk: any,
    _: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (!this.opus || !this.opusLeftover || !this.mixer) return callback();
    const buffer = this.mixer.Process(chunk);

    this.opusLeftover = Buffer.concat([this.opusLeftover, buffer]);

    let n = 0;
    while (this.opusLeftover.length >= this.REQUIRED_SAMPLES * (n + 1)) {
      const frame = this.opus.encode(
        this.opusLeftover.slice(
          n * this.REQUIRED_SAMPLES,
          (n + 1) * this.REQUIRED_SAMPLES
        )
      );
      this.push(frame);
      n++;
    }
    this.logger.debug('converted opus frames ', n);
    if (n > 0)
      this.opusLeftover = this.opusLeftover.slice(n * this.REQUIRED_SAMPLES);
    return callback();
  }

  public get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  public get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public playSilence() {
    this.logger.debug('playSilence()');
    this.silent = true;
  }

  public stopSilence() {
    this.logger.debug('stopSilence()');
    this.silent = false;
  }

  public playBuffer(buffer: Buffer) {
    if (this.mixer) this.mixer.AddReadable(buffer);
  }

  public clearReadableArray() {
    if (this.mixer) this.mixer.ClearReadables();
  }

  public set volume(volume: number) {
    if (this.mixer) this.mixer.SetVolume(volume);
  }

  public get volume(): number {
    if (this.mixer) return this.mixer.GetVolume();
    return -1;
  }

  public destroy() {
    this.stopSilence();
    this.connection.off('destroy', this.onConnectionDestroy);
    this.connection.destroy();
    this.mixer = undefined;
    this.opus = undefined;
    this.opusLeftover = undefined;
    super.destroy();
  }
}
