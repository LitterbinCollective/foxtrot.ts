import { OpusEncoder } from '@discordjs/opus';
import _debug from 'debug';
import { GatewayClientEvents } from 'detritus-client';
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { ChannelGuildVoice } from 'detritus-client/lib/structures';
import { Readable, Transform, TransformCallback, Writable } from 'stream';

const debug = _debug('glowmem/pipeline');

class VoicePipelinePlayer extends Writable {
  public voiceConnection: VoiceConnection;

  private readonly opusEncoder: OpusEncoder;
  private readonly pipeline: VoicePipeline;

  constructor(pipeline: VoicePipeline, voiceChannel: ChannelGuildVoice) {
    super();
    this.pipeline = pipeline;
    this.opusEncoder = new OpusEncoder(
      this.pipeline.SAMPLE_RATE,
      this.pipeline.AUDIO_CHANNELS
    );
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
    const voiceState = (payload as GatewayClientEvents.VoiceStateUpdate).voiceState;
    const channel = voiceState ? voiceState.channel : (payload as ChannelGuildVoice);
    this.voiceConnection = (await channel.join({ receive: true })).connection;
  }

  public _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error) => void
  ): void {
    if (!this.voiceConnection) return;
    const opusPacket = this.opusEncoder.encode(chunk);
    this.voiceConnection.sendAudio(opusPacket, { isOpus: true });
    setTimeout(callback, this.pipeline.OPUS_FRAME_LENGTH);
  }
}

class ReadableWithCounter extends Readable {
  public counter = 0;
}

class VoicePipelineMixer extends Transform {
  public volume = 1;
  private clipCount = 0;
  private lastClipCheck = Date.now();
  private readonly audioReadables: ReadableWithCounter[] = [];
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
    this.audioReadables.push(readable as ReadableWithCounter);
  }
}

export default class VoicePipeline extends Transform {
  public readonly mixer: VoicePipelineMixer;
  public readonly SAMPLE_RATE = 48000;
  public readonly AUDIO_CHANNELS = 2;
  public readonly OPUS_FRAME_LENGTH = 20;
  public readonly SAMPLE_BYTE_LEN = 2;

  private silenceInterval: NodeJS.Timeout;
  private readonly player: VoicePipelinePlayer;
  private readonly OPUS_FRAME_SIZE = 960;

  constructor(voiceChannel: ChannelGuildVoice) {
    super();

    this.player = new VoicePipelinePlayer(this, voiceChannel);
    this.mixer = new VoicePipelineMixer(this);

    this.pipe(this.mixer).pipe(this.player);
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
    if (!this.silenceInterval)
      this.silenceInterval = setInterval(
        () =>
          this.mixer.write(
            Buffer.alloc(
              this.OPUS_FRAME_SIZE * this.AUDIO_CHANNELS * this.SAMPLE_BYTE_LEN
            )
          ),
        this.OPUS_FRAME_LENGTH
      );
  }

  public stopSilence() {
    if (this.silenceInterval) {
      clearInterval(this.silenceInterval);
      delete this.silenceInterval;
    }
  }
}
