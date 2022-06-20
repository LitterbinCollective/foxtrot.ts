import _debug from 'debug';
import { GatewayClientEvents, ShardClient } from 'detritus-client';
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { ChannelGuildVoice } from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';
import { opus } from 'prism-media';
import { Readable, Transform, TransformCallback, PassThrough } from 'stream';
import { Worker, isMainThread, parentPort } from 'worker_threads';

import NewVoice from './new';

const debug = _debug('catvox/pipeline');

interface VoicePipelineMixerMessage {
  type: string;
  data: any;
}

class VoiceSafeConnection extends EventEmitter {
  public voiceConnection!: VoiceConnection;
  private readonly shard: ShardClient;

  constructor(
    voiceChannel: ChannelGuildVoice,
    shard: ShardClient
  ) {
    super();
    this.shard = shard;
    this.onVoiceStateUpdate = this.onVoiceStateUpdate.bind(this);
    this.onVoiceServerUpdate = this.onVoiceServerUpdate.bind(this);
    this.shard.on('voiceStateUpdate', this.onVoiceStateUpdate);
    this.shard.on('voiceServerUpdate', this.onVoiceServerUpdate);
    this.initialize(voiceChannel);
  }

  private async initialize(voiceChannel: ChannelGuildVoice) {
    if (!voiceChannel.canJoin || !voiceChannel.canSpeak)
      throw new Error(
        'Bot is not able to join or speak in this voice channel.'
      );
    const voiceConnectObj = await voiceChannel.join({ receive: true });
    if (!voiceConnectObj) {
      debug('failed to connect, destroying');
      return this.destroy();
    }
    this.voiceConnection = voiceConnectObj.connection;
    this.voiceConnection.setOpusEncoder();
    this.voiceConnection.setSpeaking({
      voice: true,
    });
    this.voiceConnection.sendAudioSilenceFrame();
    this.emit('connected');
  }

  private get channel() {
    return this.voiceConnection ? this.voiceConnection.channel : undefined;
  }

  private async onVoiceServerUpdate(payload: GatewayClientEvents.VoiceServerUpdate) {
    if (!this.channel) return;
    if (payload.guildId !== this.channel.guildId) return;
    if (this.voiceConnection.gateway.socket)
      // to avoid reconnect, we must make the onclose event noop
      this.voiceConnection.gateway.socket.socket.onclose = () => {};
    this.voiceConnection.gateway.setEndpoint(payload.endpoint);
    this.voiceConnection.gateway.setToken(payload.token);
    this.voiceConnection.gateway.once('transportReady', () => {
      debug('gateway says ready');
      this.voiceConnection.setSpeaking({
        voice: true,
      });
      this.voiceConnection.gateway.transport?.connect();
    });
  }

  private async onVoiceStateUpdate(
    payload: GatewayClientEvents.VoiceStateUpdate
  ) {
    if (!this.channel) return;
    if (payload.voiceState.userId === this.shard.userId && payload.voiceState.guildId === this.channel.guildId && payload.leftChannel)
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
    this.shard.off('voiceStateUpdate', this.onVoiceStateUpdate);
    this.emit('destroy');
  }
}

export default class VoicePipeline extends PassThrough {
  public readonly mixer: Worker;
  public readonly OPUS_FRAME_LENGTH = 20;
  public readonly OPUS_FRAME_SIZE = 960;
  public readonly SAMPLE_BYTE_LEN = 2;

  private silenceInterval?: NodeJS.Timeout;
  private opusPacketsReceived = 0;
  private opusPacketCheck = 0;
  private readonly connection: VoiceSafeConnection;
  private readonly opus: opus.Decoder;
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, voiceChannel: ChannelGuildVoice) {
    super();

    this.voice = voice;
    this.opus = new opus.Encoder({
      channels: this.AUDIO_CHANNELS,
      frameSize: this.OPUS_FRAME_SIZE,
      rate: this.SAMPLE_RATE,
    });
    this.connection = new VoiceSafeConnection(
      voiceChannel,
      this.voice.application.clusterClient.shards.get(voiceChannel.shardId) as ShardClient
    );
    this.mixer = new Worker(__filename, {
      stdin: true,
      stdout: true,
    });

    this.connection.on('connected', () => this.emit('connected'));
    this.pipe(this.mixer.stdin as NodeJS.WritableStream, { end: false })
    this.mixer.stdout.pipe(this.opus, { end: false });
  }

  public update() {
    const packet = this.opus.read();
    if (packet) {
      this.connection.sendAudio(packet);
      this.opusPacketsReceived++;
    }

    const time = Date.now() - this.opusPacketCheck;
    if (time >= 1000) {
      debug('received', this.opusPacketsReceived, 'over', time, 'ms');
      this.opusPacketsReceived = 0;
      this.opusPacketCheck = Date.now();
    }
  }

  public get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  public get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public playSilence() {
    debug('playSilence()');
    if (!this.silenceInterval)
      this.silenceInterval = setInterval(
        () =>
          this.write(
            Buffer.alloc(
              this.OPUS_FRAME_SIZE * this.AUDIO_CHANNELS * this.SAMPLE_BYTE_LEN
            )
          ),
        this.OPUS_FRAME_LENGTH
      );
  }

  public stopSilence() {
    debug('stopSilence()');
    if (this.silenceInterval) {
      clearInterval(this.silenceInterval);
      delete this.silenceInterval;
    }
  }

  public addReadable(readable: Readable) {
    let buffer = Buffer.alloc(0);
    readable.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    readable.on('end', () => {
      this.mixer.postMessage({
        type: 'addReadable',
        data: Uint8Array.from(buffer),
      });
    });
  }

  public clearReadableArray() {
    this.mixer.postMessage({
      type: 'clearReadableArray'
    });
  }

  public setVolume(volume: number) {
    this.mixer.postMessage({
      type: 'setVolume',
      data: volume,
    });
  }

  public getVolume() {
    return new Promise((resolve) => {
      const catchVolume = (message: VoicePipelineMixerMessage) => {
        if (message.type !== 'getVolume') return;
        resolve(message.data);
        this.mixer.off('message', catchVolume);
      };

      this.mixer.on('message', catchVolume);

      this.mixer.postMessage({
        type: 'getVolume',
      });
    });
  }

  public destroy() {
    this.stopSilence();
    this.mixer.terminate();
    this.unpipe(this.mixer.stdin as NodeJS.WritableStream)
    this.mixer.stdout.unpipe(this.opus);
    this.connection.destroy();
    this.opus.destroy();
    super.destroy();
  }
}

if (!isMainThread) {
  class PassThroughWithCounter extends PassThrough {
    public counter = 0;
  }

  class VoicePipelineMixer extends Transform {
    public volume = 1;
    private audioReadables: PassThroughWithCounter[] = [];
    private clipCount = 0;
    private lastClipCheck = Date.now();
    private readonly SAMPLE_BYTE_LEN = 2;
    private readonly SAMPLE_RATE = 48000;
    private readonly AUDIO_CHANNELS = 2;

    constructor() {
      super();
    }

    public _transform(
      chunk: any,
      _encoding: BufferEncoding,
      callback: TransformCallback
    ): void {
      const { SAMPLE_BYTE_LEN, AUDIO_CHANNELS, SAMPLE_RATE } = this;
      const INT_16_BOUNDARIES = { MIN: -32768, MAX: 32767 };
      const volume = this.volume * 1 / (this.audioReadables.length + 1)

      for (
        let position = 0;
        position < chunk.length;
        position += SAMPLE_BYTE_LEN
      ) {
        let sample = chunk.readInt16LE(position) * volume;

        for (let i = 0; i < this.audioReadables.length; i++) {
          const readable = this.audioReadables[i];
          const buffer = readable.read(SAMPLE_BYTE_LEN);
          if (buffer) {
            sample += buffer.readInt16LE(0) * volume;
            readable.counter = 0;
          } else {
            readable.counter++;
            if (
              readable.counter >=
              AUDIO_CHANNELS * SAMPLE_RATE * SAMPLE_BYTE_LEN
            )
              this.removeReadable(i);
          }
        }

        sample = Math.floor(sample * this.volume);
        if (sample < INT_16_BOUNDARIES.MIN || sample > INT_16_BOUNDARIES.MAX) {
          this.clipCount++;
          sample = Math.max(
            Math.min(sample, INT_16_BOUNDARIES.MAX),
            INT_16_BOUNDARIES.MIN
          );
        }

        chunk.writeInt16LE(sample, position);
      }

      const now = Date.now();
      if (now - this.lastClipCheck >= 1000) {
        if (this.clipCount !== 0) {
          console.log('samples clipped', this.clipCount, 'times!');
          this.clipCount = 0;
        }
        this.lastClipCheck = now;
      }

      this.push(chunk);
      callback();
    }

    public addReadable(readable: Uint8Array) {
      const passThrough = new PassThroughWithCounter();
      passThrough.write(readable);
      passThrough.end();
      this.audioReadables.push(passThrough);
      return this.audioReadables.length - 1;
    }

    public removeReadable(index: number) {
      this.audioReadables.splice(index, 1);
    }

    public clearReadableArray() {
      this.audioReadables = [];
    }
  }

  const mixer = new VoicePipelineMixer();
  process.stdin.pipe(mixer).pipe(process.stdout);
  parentPort?.on('message', (message: VoicePipelineMixerMessage) => {
    switch (message.type) {
      case 'addReadable':
        mixer.addReadable(message.data);
        break;
      case 'clearReadableArray':
        mixer.clearReadableArray();
        break;
      case 'setVolume':
        mixer.volume = Math.min(Math.max(message.data, 0), 1);
        break;
      case 'getVolume':
        parentPort?.postMessage({
          type: 'getVolume',
          data: mixer.volume,
        });
        break;
    }
  });
}