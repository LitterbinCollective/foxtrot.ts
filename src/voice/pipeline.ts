import _debug from 'debug';
import { GatewayClientEvents, ShardClient } from 'detritus-client';
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { ChannelGuildVoice } from 'detritus-client/lib/structures';
import { EventEmitter } from 'events';
import { opus } from 'prism-media';
import { Readable, Transform, TransformCallback, PassThrough } from 'stream';

import NewVoice from './new';

const debug = _debug('glowmem/pipeline');

class VoiceSafeConnection extends EventEmitter {
  public voiceConnection: VoiceConnection;
  private channel: ChannelGuildVoice;
  private readonly shard: ShardClient;

  constructor(
    voiceChannel: ChannelGuildVoice,
    shard: ShardClient
  ) {
    super();
    this.shard = shard;
    this.onVoiceStateUpdate = this.onVoiceStateUpdate.bind(this);
    this.shard.on('voiceStateUpdate', this.onVoiceStateUpdate);
    this.initialize(voiceChannel);
  }

  private async initialize(voiceChannel: ChannelGuildVoice) {
    if (!voiceChannel.canJoin || !voiceChannel.canSpeak)
      throw new Error(
        'Bot is not able to join or speak in this voice channel.'
      );
    await this.onVoiceStateUpdate(voiceChannel);
    this.emit('connected');
  }

  public async onVoiceStateUpdate(
    payload: ChannelGuildVoice | GatewayClientEvents.VoiceStateUpdate,
    force: boolean = false
  ) {
    const payloadAsPayload = payload as GatewayClientEvents.VoiceStateUpdate;
    if (
      (this.voiceConnection && !payloadAsPayload.old && !force) ||
      (payloadAsPayload.voiceState &&
        (payloadAsPayload.voiceState.guildId !== this.channel.id ||
          payloadAsPayload.voiceState.channelId ===
            this.channel.id))
    )
      return;
    if (this.voiceConnection) this.voiceConnection.kill();
    debug('onVoiceStateUpdate, force =', force);
    const voiceState = payloadAsPayload.voiceState;
    const channel = voiceState
      ? voiceState.channel
      : (payload as ChannelGuildVoice);
    this.channel = channel;
    this.voiceConnection = (await channel.join({ receive: true })).connection;
    this.voiceConnection.setOpusEncoder();
    this.voiceConnection.setSpeaking({
      voice: true,
    });
    this.voiceConnection.sendAudioSilenceFrame();
  }

  public sendAudio(packet: Buffer) {
    if (!this.voiceConnection) return;
    this.voiceConnection.sendAudio(packet, { isOpus: true });
  }

  public sendEmpty() {
    if (!this.voiceConnection) return;
    this.voiceConnection.sendAudioSilenceFrame();
  }

  public destroy() {
    if (this.voiceConnection) this.voiceConnection.kill();
    this.shard.off('voiceStateUpdate', this.onVoiceStateUpdate);
  }
}

class PassThroughWithCounter extends PassThrough {
  public counter = 0;
}

class VoicePipelineMixer extends Transform {
  public volume = 1;
  private audioReadables: PassThroughWithCounter[] = [];
  private clipCount = 0;
  private lastClipCheck = Date.now();
  private readonly pipeline: VoicePipeline;

  constructor(pipeline: VoicePipeline) {
    super();
    this.pipeline = pipeline;
  }

  public _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    const { SAMPLE_BYTE_LEN, AUDIO_CHANNELS, SAMPLE_RATE } = this.pipeline;
    const INT_16_BOUNDARIES = { MIN: -32768, MAX: 32767 };

    for (
      let position = 0;
      position < chunk.length;
      position += SAMPLE_BYTE_LEN
    ) {
      let sample = chunk.readInt16LE(position);

      for (let i = 0; i < this.audioReadables.length; i++) {
        const readable = this.audioReadables[i];
        const buffer = readable.read(SAMPLE_BYTE_LEN);
        if (buffer) {
          sample += buffer.readInt16LE(0);
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
        debug('samples clipped', this.clipCount, 'times!');
        this.clipCount = 0;
      }
      this.lastClipCheck = now;
    }

    this.push(chunk);
    callback();
  }

  public addReadable(readable: Readable) {
    const passThrough = new PassThroughWithCounter();
    readable.pipe(passThrough, { end: false });
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

export default class VoicePipeline extends PassThrough {
  public readonly mixer: VoicePipelineMixer;
  public readonly OPUS_FRAME_LENGTH = 20;
  public readonly OPUS_FRAME_SIZE = 960;
  public readonly SAMPLE_BYTE_LEN = 2;

  private silenceInterval?: NodeJS.Timeout;
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
      this.voice.application.clusterClient.shards.get(voiceChannel.shardId)
    );
    this.mixer = new VoicePipelineMixer(this);

    this.connection.on('connected', () => this.emit('connected'));
    this.pipe(this.opus, { end: false }); //.pipe(this.mixer, { end: false })
  }

  public update() {
    const packet = this.opus.read();
    if (packet) this.connection.sendAudio(packet);
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

  public destroy() {
    this.stopSilence();
    this.unpipe(this.mixer).unpipe(this.opus);
    this.connection.destroy();
    this.mixer.destroy();
    this.opus.destroy();
    super.destroy();
  }
}
