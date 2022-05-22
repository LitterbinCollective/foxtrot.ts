import { OpusEncoder } from '@discordjs/opus';
import _debug from 'debug';
import { GatewayClientEvents } from 'detritus-client';
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { ChannelGuildVoice } from 'detritus-client/lib/structures';
import { Readable, Transform, TransformCallback, Writable, PassThrough } from 'stream';

import NewVoice from './new';

const debug = _debug('glowmem/pipeline');

class VoicePipelinePlayer extends Writable {
  public voiceConnection: VoiceConnection;

  private buffer: Buffer;
  private readonly opusEncoder: OpusEncoder;
  private readonly pipeline: VoicePipeline;
  private readonly OPUS_MINIMUM_BYTES: number;

  constructor(pipeline: VoicePipeline, voiceChannel: ChannelGuildVoice) {
    super();

    this.pipeline = pipeline;
    const { OPUS_FRAME_SIZE, SAMPLE_RATE, AUDIO_CHANNELS, SAMPLE_BYTE_LEN } = this.pipeline;
    this.opusEncoder = new OpusEncoder(
      SAMPLE_RATE,
      AUDIO_CHANNELS
    );
    this.buffer = Buffer.alloc(0);
    this.OPUS_MINIMUM_BYTES = OPUS_FRAME_SIZE * AUDIO_CHANNELS * SAMPLE_BYTE_LEN;

    this.initialize(voiceChannel);
  }

  private async initialize(voiceChannel: ChannelGuildVoice) {
    if (!voiceChannel.canJoin || !voiceChannel.canSpeak)
      throw new Error('Bot is not able to join or speak in this voice channel.');
    await this.onVoiceStateUpdate(voiceChannel);
  }

  public async onVoiceStateUpdate(payload: ChannelGuildVoice | GatewayClientEvents.VoiceStateUpdate, force: boolean = false) {
    if (this.voiceConnection && !(payload as GatewayClientEvents.VoiceStateUpdate).old && !force) return;
    if (this.voiceConnection) this.voiceConnection.kill();
    debug('onVoiceStateUpdate, force =', force);
    const voiceState = (payload as GatewayClientEvents.VoiceStateUpdate).voiceState;
    const channel = voiceState ? voiceState.channel : (payload as ChannelGuildVoice);
    this.voiceConnection = (await channel.join({ receive: true })).connection;
    this.voiceConnection.setOpusEncoder();
    this.voiceConnection.setSpeaking({
      voice: true,
    });
  }

  public _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error) => void
  ): void {
    if (!this.voiceConnection)
      return callback();

    this.buffer = Buffer.concat([ this.buffer, chunk ]);
    let frames = 0;
    while (this.OPUS_MINIMUM_BYTES * (frames + 1) <= this.buffer.length) {
      const opusPacket = this.opusEncoder.encode(
        this.buffer.slice(this.OPUS_MINIMUM_BYTES * frames, this.OPUS_MINIMUM_BYTES * (frames + 1))
      );
      this.voiceConnection.sendAudio(opusPacket, { isOpus: true });
      frames++;
    }

    if (frames > 0) {
      this.buffer = this.buffer.slice(this.OPUS_MINIMUM_BYTES * frames);
      setTimeout(callback, this.pipeline.OPUS_FRAME_LENGTH * frames);
    } else callback();
  }

  public destroy() {
    super.destroy();
    this.voiceConnection.kill();
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
            this.audioReadables.splice(i, 1);
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
  }

  public clearReadableArray() {
    this.audioReadables = [];
  }
}

export default class VoicePipeline extends Transform {
  public readonly mixer: VoicePipelineMixer;
  public readonly OPUS_FRAME_LENGTH = 20;
  public readonly OPUS_FRAME_SIZE = 960;
  public readonly SAMPLE_BYTE_LEN = 2;

  private silenceInterval?: NodeJS.Timeout;
  private readonly player: VoicePipelinePlayer;
  private readonly voice: NewVoice;

  constructor(voice: NewVoice, voiceChannel: ChannelGuildVoice) {
    super();

    this.voice = voice;
    this.player = new VoicePipelinePlayer(this, voiceChannel);
    this.mixer = new VoicePipelineMixer(this);

    this.pipe(this.mixer, { end: false }).pipe(this.player, { end: false });
  }

  public get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  public get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public _transform(
    chunk: any,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this.push(chunk);
    callback();
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
    this.unpipe(this.mixer).unpipe(this.player);
    this.player.destroy();
    this.mixer.destroy();
    super.destroy();
  }
}
