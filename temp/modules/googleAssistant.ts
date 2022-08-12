// This component is purely made for fun and will be probably limited
// in the future.

import * as AudioMixer from 'audio-mixer';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import dbg from 'debug';
import { Message } from 'detritus-client/lib/structures';
import { Embed, Markup } from 'detritus-client/lib/utils';
import fs from 'fs';
import GoogleAssistant from 'google-assistant';
import prism from 'prism-media';
import { Readable } from 'stream';

import { Voice } from '..';
import BaseModule from '../foundation/BaseModule';
import { EMBED_COLORS, EMOJI_ICONS, GOOGLE_COLORS } from '../../constants';

const TAG = 'GoogleAssistant';
const debug = dbg(TAG);

export default class GoogleAssistantVoiceModule extends BaseModule {
  public readonly stream: ReadableStream;
  private readonly config: IGoogleAssistantConfig;
  private complete: boolean = true;
  private conversation: any;
  private decoders: Record<string, prism.opus.Decoder> = {};
  private finalTranscription: string;
  private idle: NodeJS.Timeout;
  private mixer: AudioMixer.InterleavedMixer;
  private mixerInputs: Record<string, AudioMixer.Input> = {};
  private mixerEmptyInput: AudioMixer.Input;
  private responseMessage: Message | boolean;
  private transcriptEditedAt = 0;
  private transcriptMessage: Message | boolean;
  private sox: ChildProcessWithoutNullStreams;
  private writeStream: fs.WriteStream;
  private readonly packetEventFunc = (packet) => this.receivePacket(packet);
  private readonly googleAssistant: GoogleAssistant;
  private readonly RECEIVER_FRAME_LENGTH = 20;
  private readonly SAMPLE_RATE = 24000;
  private readonly AUDIO_CHANNELS = 1;

  constructor(voice: Voice) {
    super(voice);

    this.voice.logChannel.createMessage({
      embed: {
        title: EMOJI_ICONS.GOOGLE_ASSISTANT + ' Warning',
        description:
          'As per Google Assistant SDK Terms of Service, we need to inform you that ' +
          'we are logging and monitoring the usage of this feature. [Read more](https://developers.google.com/assistant/sdk/terms-of-service).',
        color: EMBED_COLORS.WAR,
      },
    });

    this.config = voice.application.config.googleAssistantSettings;
    this.config.conversation.audio = {
      encodingIn: 'LINEAR16',
      sampleRateIn: this.SAMPLE_RATE,
      encodingOut: 'MP3',
      sampleRateOut: this.SAMPLE_RATE,
    };

    this.googleAssistant = new GoogleAssistant(this.config.auth);
    this.googleAssistant.on('started', (conv: any) =>
      this.setupConversation(conv)
    );

    this.voice.playInternalSoundeffect('ga');

    this.idle = setInterval(
      () =>
        this.mixerEmptyInput &&
        this.mixerEmptyInput.write(
          Buffer.alloc(this.voice.FRAME_SIZE * this.voice.AUDIO_CHANNELS * 2)
        ),
      this.RECEIVER_FRAME_LENGTH
    );
  }

  private receivePacket({ data, userId }: any) {
    if (!this.sox) {
      this.sox = spawn('sox', [
        '-t',
        'raw',
        '-b',
        '16',
        '-e',
        'signed-integer',
        '-r',
        this.voice.SAMPLE_RATE.toString(),
        '-c',
        this.voice.AUDIO_CHANNELS.toString(),
        '-',
        '-r',
        this.SAMPLE_RATE.toString(),
        '-c',
        this.AUDIO_CHANNELS.toString(),
        '-t',
        'raw',
        '-b',
        '16',
        '-e',
        'signed-integer',
        '-',
        'vol',
        '12',
        'dB',
      ]);
      this.sox.stdout.on(
        'error',
        (err: any) => err.code !== 'EPIPE' && console.error(err)
      );
      this.sox.stdin.on(
        'error',
        (err: any) => err.code !== 'EPIPE' && console.error(err)
      );
      this.sox.stdout.on('data', (data) => this.conversation.write(data));
      this.sox.stdout.pipe(this.writeStream);
      this.sox.on('error', (err) => {
        console.error(err);

        Sentry.captureException(err, {
          tags: { loc: TAG },
        });
      });
      this.mixer.pipe(this.sox.stdin);
    }

    if (this.decoders[userId]) {
      this.decoders[userId].write(data);
    }
  }

  private setupVoiceReceiver() {
    debug('Starting voice receiver...');

    this.writeStream = fs.createWriteStream(
      `galogs/ga-${Date.now()}-${this.voice.channel.id}.raw`
    );

    const bitDepth = 16;
    this.mixer = new AudioMixer.Mixer({
      sampleRate: this.voice.SAMPLE_RATE,
      channels: this.voice.AUDIO_CHANNELS,
      bitDepth,
    });

    this.voice.channel.members.forEach((member) => {
      this.mixerInputs[member.id] = new AudioMixer.Input({
        sampleRate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        bitDepth,
        clearInterval: 250,
        volume: this.voice.channel.members.size * 100,
      });
      this.decoders[member.id] = new prism.opus.Decoder({
        rate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        frameSize: this.voice.FRAME_SIZE,
      });

      this.decoders[member.id].pipe(this.mixerInputs[member.id]);
      this.mixer.addInput(this.mixerInputs[member.id]);
    });

    this.mixerEmptyInput = new AudioMixer.Input({
      sampleRate: this.voice.SAMPLE_RATE,
      channels: this.voice.AUDIO_CHANNELS,
      bitDepth,
      clearInterval: 250,
    });
    this.mixer.addInput(this.mixerEmptyInput);

    this.voice.connection.sendAudioSilenceFrame();
    this.voice.connection.on('packet', this.packetEventFunc);
  }

  private getRidOfVoiceReceiver() {
    debug('Stopping voice receiver...');
    this.voice.connection.off('packet', this.packetEventFunc);
    for (const id in this.mixerInputs) {
      this.mixer.removeInput(this.mixerInputs[id]),
        this.decoders[id].unpipe(this.mixerInputs[id]);
    }
    if (this.writeStream) this.writeStream.close();
    this.decoders = {};
    this.mixerInputs = {};
    this.mixerEmptyInput = null;
    if (this.sox) {
      this.sox.kill(9);
      this.sox = null;
    }
  }

  private async onResponse(text?: string) {
    if (!text) return;
    debug('Response:', text);

    const keys = Object.keys(GOOGLE_COLORS);
    const color = GOOGLE_COLORS[keys[(keys.length * Math.random()) << 0]];

    this.responseMessage = true;
    this.responseMessage = await this.voice.logChannel.createMessage({
      embed: {
        title: this.finalTranscription
          ? EMOJI_ICONS.GOOGLE_ASSISTANT + ' `' + this.finalTranscription + '`'
          : null,
        description: text,
        color,
      },
    });
    this.emit('responseMessageCreated');
  }

  private async onError(error: Error, endedConv: boolean) {
    this.getRidOfVoiceReceiver();
    console.error(error);

    Sentry.captureException(error, {
      tags: { loc: TAG },
      extra: { endedConv },
    });

    await this.voice.logChannel.createMessage({
      embed: {
        title: endedConv
          ? 'Conversation ended with an error'
          : 'Google Assistant Error',
        color: EMBED_COLORS.ERR,
        description: Markup.codeblock(error.message),
      },
    });
  }

  private async onTranscription({
    transcription,
    done,
  }: {
    transcription: string;
    done: boolean;
  }) {
    debug('Transcription:', transcription, '; Done?:', done);
    if (!done) {
      try {
        const embed = new Embed({
          title: EMOJI_ICONS.GOOGLE_MIC + ' `' + transcription + '`',
          color: GOOGLE_COLORS.BLUE,
        });

        if (!this.transcriptMessage) {
          (this.transcriptMessage = true),
            (this.transcriptMessage = await this.voice.logChannel.createMessage(
              {
                embed,
              }
            )),
            this.emit('transcriptMessageCreated');
        } else if (
          typeof this.transcriptMessage !== 'boolean' &&
          Date.now() - this.transcriptEditedAt >= 250
        ) {
          this.transcriptEditedAt = Date.now();
          await this.transcriptMessage.edit({
            embed,
          });
        }
      } catch (err) {}
    } else {
      this.finalTranscription = transcription;
      this.voice.playFile('resources/googleAssistant/pingSuccess.wav');
      if (this.transcriptMessage) {
        const getRidOfTranscriptMessage = async () => {
          if (!this.transcriptMessage) return;
          try {
            await (this.transcriptMessage as Message).delete(),
              (this.transcriptMessage = null);
          } catch (err) {}
        };

        if (typeof this.transcriptMessage !== 'boolean') {
          await getRidOfTranscriptMessage();
        } else {
          this.once(
            'transcriptMessageCreated',
            async () => await getRidOfTranscriptMessage()
          );
        }
      }

      if (this.responseMessage) {
        const editResponseMessage = async () => {
          const message = this.responseMessage as Message;
          const embed = message.embeds.get(0);
          embed.title =
            EMOJI_ICONS.GOOGLE_ASSISTANT + ' `' + transcription + '`';

          await message.edit({
            embed,
          });
          this.responseMessage = null;
        };

        if (typeof this.responseMessage !== 'boolean') {
          await editResponseMessage();
        } else {
          this.once(
            'responseMessageCreated',
            async () => await editResponseMessage()
          );
        }
      }
    }
  }

  private setupConversation(conv: any) {
    let stream: Readable;
    let streamTimeout: NodeJS.Timeout;

    conv
      .on('audio-data', (data: Buffer) => {
        if (!stream) {
          stream = new Readable({
            read() {},
          });
          this.voice.addToQueue({
            readable: stream,
          });
        }

        stream.push(Buffer.from(data));
        if (streamTimeout) {
          clearTimeout(streamTimeout);
        }
        streamTimeout = setTimeout(() => stream.emit('end'), 500);
      })
      .on('end-of-utterance', () => this.getRidOfVoiceReceiver())
      .on(
        'transcription',
        async (data: { transcription: string; done: boolean }) =>
          await this.onTranscription(data)
      )
      .on('response', async (text: string) => await this.onResponse(text))
      .once('ended', (error: Error, continueConversation: boolean) => {
        if (error) {
          this.onError(error, true);
        } else if (continueConversation) {
          const playerKillEvent = () => {
            if (this.voice.queue.length !== 0) return;
            this.voice.off('playerKill', playerKillEvent);
            this.complete = true;
            this.startListening();
          };
          this.voice.on('playerKill', playerKillEvent);
        } else {
          debug('Conversation complete');
          this.complete = true;
        }
      })
      .on('error', async (error: Error) => await this.onError(error, false));
    this.conversation = conv;
  }

  public async startListening() {
    if (!this.complete) {
      return await this.voice.logChannel.createMessage({
        content: 'Already listening, please talk.',
      });
    }
    this.complete = false;
    this.responseMessage = null;
    this.conversation = null;
    this.voice.kill(false);
    this.voice.playFile('resources/googleAssistant/pingStart.wav');
    if (this.sox) {
      this.getRidOfVoiceReceiver();
    }
    this.setupVoiceReceiver();
    this.googleAssistant.start(this.config.conversation);
  }

  public destroy() {
    if (!this.complete) {
      return false;
    }
    clearInterval(this.idle);
    debug('Destroying self...');
    this.voice.kill(false);
    this.getRidOfVoiceReceiver();
    this.voice.playInternalSoundeffect('ga-stop');
    this.voice.denyOnAudioSubmission = false;
    this.voice.module = null;
    return true;
  }
}
