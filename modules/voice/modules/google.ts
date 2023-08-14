import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { Structures, Utils } from 'detritus-client';
import EventEmitter from 'events';
import GoogleAssistant from 'google-assistant';
import { join } from 'path';

import '@/configs/google-assistant-client-secret.json';
import settings from '@/configs/google-assistant-settings.json';
import { Constants, UserError } from '@/modules/utils';

import Voice from '..';
import BaseModule from './basemodule';

const AUDIO_CHANNELS = 1;
const MIN_DELAY_BETWEEN_TRANSCRIPTION_EDITS = 300;
const SAMPLE_RATE = 24000;

export default class GoogleAssistantModule extends BaseModule {
  private active = false;
  private assistant: GoogleAssistant;
  private conversation: any;
  private ffmpeg: ChildProcessWithoutNullStreams | null = null;
  private ffmpegConversation: ChildProcessWithoutNullStreams | null = null;
  private lastTranscribed = 0;
  private response?: Structures.Message | true;
  private transcription?: Structures.Message | true;

  constructor(voice: Voice) {
    super(voice);

    if (!settings.allowedServers.includes(voice.channel?.guildId || ''))
      voice.destroyModule();

    const configBase = join(__dirname, '../../../configs/');
    this.assistant = new GoogleAssistant({
      keyFilePath: join(configBase, 'google-assistant-client-secret.json'),
      savedTokensPath: join(configBase, 'google-assistant-saved.json'),
    });

    this.conversationStarted = this.conversationStarted.bind(this);
    this.onTranscription = this.onTranscription.bind(this);
    this.onResponse = this.onResponse.bind(this);
    this.conversationEnded = this.conversationEnded.bind(this);
    this.onError = this.onError.bind(this);

    this.assistant.on('started', this.conversationStarted);
    this.startFFMpeg();
  }

  private startFFMpeg() {
    if (this.ffmpeg) return;
    this.ffmpeg = spawn('ffmpeg', [
      '-f', 's16le',
      '-ar', Constants.OPUS_SAMPLE_RATE.toString(),
      '-ac', Constants.OPUS_AUDIO_CHANNELS.toString(),
      '-i', '-',
      '-ar', SAMPLE_RATE.toString(),
      '-ac', AUDIO_CHANNELS.toString(),
      '-f', 's16le',
      '-',
    ]);
    this.ffmpeg.stdout.on('error', (err: any) => err.code !== 'EPIPE' && this.logger.error(err));
    this.ffmpeg.stdin.on('error', (err: any) => err.code !== 'EPIPE' && this.logger.error(err));
    this.ffmpeg.stdout.on('data', (data: Buffer) =>
      this.conversation && this.conversation.write(data)
    );
    this.ffmpeg.on('error', (err: Error) => {
      this.logger.error(err);
    });
  }

  private onError(err: Error) {
    this.voice.destroyModule(new UserError('commands.runtime-error'));
    this.logger.error(err);
  }

  private formTitle(trans: string) {
    return Constants.EMOJIS.PLAY + ' ' + Utils.Markup.codestring(trans);
  }

  private async onTranscription(data: { transcription: string, done: boolean }) {
    this.logger.debug('trans', data.transcription, '; done:', data.done);

    try {
      const embed = new Utils.Embed({
        title: this.formTitle(data.transcription),
        color: Constants.EMBED_COLORS.DEFAULT
      });

      if (this.transcription) {
        if (data.done) {
          if (typeof this.transcription !== 'boolean')
            await this.transcription.delete();
          else
            this.once('transcription', () => typeof this.transcription === 'object' && this.transcription.delete());

          await this.responseMessage({ transcription: data.transcription });
          return;
        }

        if (typeof this.transcription !== 'boolean' && Date.now() - this.lastTranscribed >= MIN_DELAY_BETWEEN_TRANSCRIPTION_EDITS) {
          await this.transcription.edit({ embed })
          this.lastTranscribed = Date.now()
        }
      } else {
        this.transcription = true;
        this.transcription = await this.voice.queue.announcer.createMessage({ embed });
        this.emit('transcription');
      }
    } catch (err) {}
  }

  public update(buffer?: Buffer) {
    if (this.ffmpeg && buffer)
      this.ffmpeg.stdin.write(buffer);
  }

  private async responseMessage(data: { response?: string, transcription?: string }) {
    try {
      if (typeof this.response === 'boolean') {
        this.once('response', () => this.responseMessage(data));
        return;
      }

      const previous = this.response && this.response.embeds.filter(x => x.isRich)[0];
      const embed = new Utils.Embed({
        title: previous?.title,
        description: previous?.description,
        color: Constants.EMBED_COLORS.DEFAULT
      });

      if (data.response)
        embed.setDescription(data.response);

      if (data.transcription)
        embed.setTitle(this.formTitle(data.transcription));

      if (this.response) {
        await this.response.edit({ embed })
      } else {
        this.response = true;
        this.response = await this.voice.queue.announcer.createMessage({ embed });
        this.emit('response');
      }
    } catch (err) {}
  }

  private async onResponse(text?: string) {
    if (!text) {
      this.active = false;
      return;
    }
    await this.responseMessage({ response: text });
  }

  private async conversationEnded(error: Error, cont: boolean) {
    this.unuseVoiceReceiver();
    if (error)
      return this.onError(error);

    if (cont)
      this.once('continue', () => {
        this.logger.debug('continuing...');
        this.active = false;
        this.action();
      });
    else
      this.active = false;
  }

  private conversationStarted(conv: EventEmitter) {
    if (this.ffmpegConversation && !this.ffmpegConversation.killed)
      this.ffmpegConversation.kill();

    const ffmpeg = this.ffmpegConversation = spawn('ffmpeg', [
      '-f', 's16le',
      '-ar', SAMPLE_RATE.toString(),
      '-ac', AUDIO_CHANNELS.toString(),
      '-i', '-',
      '-ar', Constants.OPUS_SAMPLE_RATE.toString(),
      '-ac', Constants.OPUS_AUDIO_CHANNELS.toString(),
      '-f', 's16le',
      '-'
    ]);

    let sound = Buffer.alloc(0);
    ffmpeg.stdout.on('data', (data: Buffer) =>
      sound = Buffer.concat([ sound, data ])
    );

    ffmpeg.stdout.on('end', async () => {
      this.voice.playSoundeffect(sound);
      this.logger.debug('playing sound...');
      setTimeout(
        () => this.emit('continue'),
        Math.floor(sound.length / (Constants.OPUS_SAMPLE_RATE * Constants.OPUS_AUDIO_CHANNELS * 2) * 1000)
      );
    });

    const timeoutFunc = () => ffmpeg.stdin.end();
    let timeout: NodeJS.Timeout;

    conv
      .on('audio-data', (data: Buffer) => {
        ffmpeg.stdin.write(Buffer.from(data));
        if (timeout)
          clearTimeout(timeout);
        timeout = setTimeout(timeoutFunc, 100);
      })
      .on('end-of-utterance', () => this.unuseVoiceReceiver())
      .on('transcription', this.onTranscription)
      .on('response', this.onResponse)
      .once('ended', this.conversationEnded)
      .once('ended', (text?: string) => !text && ffmpeg.kill())
      .on('error', this.onError)
      .on('data', (data) => this.logger.debug(data));

    this.conversation = conv;
  }

  public action(): void {
    if (this.active) return;
    this.logger.debug('action()');
    this.active = true;
    this.useVoiceReceiver();

    this.response = undefined;
    this.transcription = undefined;

    this.assistant.start({
      deviceLocation: { coordinates: settings.location, },
      lang: settings.lang,
      audio: {
        encodingIn: 'LINEAR16',
        sampleRateIn: SAMPLE_RATE,
        encodingOut: 'LINEAR16',
        sampleRateOut: SAMPLE_RATE
      }
    });
  }

  public cleanUp(): void {
    if (this.ffmpeg && !this.ffmpeg.killed)
      this.ffmpeg.kill();

    if (this.ffmpegConversation && !this.ffmpegConversation.killed)
      this.ffmpegConversation.kill();
  }
}