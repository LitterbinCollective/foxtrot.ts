import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection';
import { ChannelGuildVoice } from 'detritus-client/lib/structures';
import * as prism from 'prism-media';
import { Writable } from 'stream';
import { ReadStream } from 'fs';

import { Application } from '../Application';
import BaseEffect from './BaseEffect';

class Player extends Writable {
  private count = 0;
  private readonly voice: Voice;
  private readonly FRAME_LENGTH = 20;

  constructor(voice: Voice) {
    super();
    this.voice = voice;
  }

  write(chunk: any) {
    if (!this.voice.startTime) this.voice.startTime = Date.now();

    const ms =
      this.FRAME_LENGTH +
      (this.count - 1) * this.FRAME_LENGTH -
      (Date.now() - this.voice.startTime - this.voice.pauseTime);
    setTimeout(
			() => this.voice.connection.sendAudio(chunk, { isOpus: true }),
			ms
		);
		this.count++;

		return true;
  }
}

export class Voice {
  public readonly application: Application;
  public readonly channel: ChannelGuildVoice;
  public effects: Map<string, BaseEffect> = new Map();
  public connection: VoiceConnection;
  public queue: ReadStream[] = [];
  public startTime;
  public pauseTime = 0;
  private streams: Record<string, any> = {};
	private player: Player;
  private currentlyPlaying;
  private readonly SAMPLE_RATE = 48000;
  private readonly AUDIO_CHANNELS = 2;
  private readonly FRAME_SIZE = 960;

  constructor(application: Application, channel: ChannelGuildVoice) {
    this.application = application;
    this.channel = channel;

    application.voices.set(channel.guildId, this);
    this.initialize();
  }

  private async initialize() {
    const { connection } = await this.channel.join();
    this.connection = connection;
    this.connection.setOpusEncoder();
    this.connection.setSpeaking({ voice: true });
  }

  private startFFMpeg() {
    let audioFilters = Array.from(this.effects, (effect) => effect.toString())
      .filter((v) => v === '')
      .join(';');

    let args = [
      '-analyzeduration',
      '0',
      '-loglevel',
      '0',
      '-f',
      's16le',
      '-ar',
      this.SAMPLE_RATE.toString(),
      '-ac',
      this.AUDIO_CHANNELS.toString(),
    ];

    if (audioFilters !== '') args.unshift('-filter_complex', audioFilters);

    this.streams = {};
    this.streams.ffmpeg = this.currentlyPlaying.pipe(
      new prism.FFmpeg({ args })
    );
    this.streams.opus = this.streams.ffmpeg.pipe(
      new prism.opus.Encoder({
        channels: this.AUDIO_CHANNELS,
        rate: this.SAMPLE_RATE,
        frameSize: this.FRAME_SIZE,
      })
    );
    this.player = new Player(this);
		this.streams.opus.pipe(this.player);
  }

  public addStreamToQueue(buff: ReadStream) {
    if (this.queue.length === 0)
      return (this.currentlyPlaying = buff), this.startFFMpeg();
    this.queue.push(buff);
  }

  public async kill() {
    await this.channel.leave();
    this.application.voices.delete(this.channel.guildId);
  }
}
