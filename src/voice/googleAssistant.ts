import * as AudioMixer from 'audio-mixer';
import {
  spawn,
  ChildProcessWithoutNullStreams
} from 'child_process';
import dbg from 'debug';
import { Message } from 'detritus-client/lib/structures';
import { Embed } from 'detritus-client/lib/utils';
import { EventEmitter } from 'events';
import GoogleAssistant from 'google-assistant';
import prism from 'prism-media';
import * as Sentry from '@sentry/node';
import { Readable } from 'stream';

import { Voice } from '.';
import {
  EMBED_COLORS,
  EMOJI_ICONS,
  GOOGLE_COLORS
} from '../constants';

const TAG = 'GoogleAssistant';
const debug = dbg(TAG);

export default class GoogleAssistantVoiceModule extends EventEmitter {
  public readonly stream: ReadableStream;
  private config: IGoogleAssistantConfig;
  private complete: boolean = true;
  private conversation: any;
  private decoders: Record < string, prism.opus.Decoder > = {};
  private finalTranscription: string;
  private mixer: AudioMixer.InterleavedMixer;
  private mixerInputs: Record < string, AudioMixer.Input > = {};
  private responseMessage: Message | boolean;
  private transcriptEditedAt = 0;
  private transcriptMessage: Message | boolean;
  private sox: ChildProcessWithoutNullStreams;
  private packetEventFunc = (packet) => this.receivePacket(packet);
  private readonly googleAssistant: GoogleAssistant;
  private readonly voice: Voice;
  private readonly SAMPLE_RATE = 24000;
  private readonly AUDIO_CHANNELS = 1;

  constructor(voice: Voice) {
    super();
    this.voice = voice;

    this.config = voice.application.config.googleAssistantSettings;
    this.config.conversation.audio = {
      encodingIn: 'LINEAR16',
      sampleRateIn: this.SAMPLE_RATE,
      encodingOut: 'MP3',
      sampleRateOut: this.SAMPLE_RATE
    };

    this.googleAssistant = new GoogleAssistant(this.config.auth);
    this.googleAssistant.on('started', (conv: any) =>
      this.setupConversation(conv)
    );

    this.voice.denyOnAudioSubmission = true;
    this.voice.kill(false);
    this.voice.googleAssistant = this;
  }

  private receivePacket({
    data,
    userId
  }: any) {
    if (!this.sox) {
      this.sox = spawn('sox', [
        '-t', 'raw',
        '-b', '16',
        '-e', 'signed-integer',
        '-r', this.voice.SAMPLE_RATE.toString(),
        '-c', this.voice.AUDIO_CHANNELS.toString(),
        '-',
        '-r', this.SAMPLE_RATE.toString(),
        '-c', this.AUDIO_CHANNELS.toString(),
        '-t', 'raw',
        '-b', '16',
        '-e', 'signed-integer',
        '-',
        'vol', '12', 'dB'
      ]);
      this.sox.stdout.on('data', (data) =>
        this.conversation.write(data)
      );
      this.sox.on('error', (err) => {
        console.error(err);
        
        Sentry.captureException(err, {
          tags: { loc: TAG }
        });
      });
      this.mixer.pipe(this.sox.stdin);
    }

    if (this.decoders[userId])
      this.decoders[userId].write(data);
  }

  private setupVoiceReceiver() {
    debug('Starting voice receiver...');

    const BIT_DEPTH = 16;
    this.mixer = new AudioMixer.Mixer({
      sampleRate: this.voice.SAMPLE_RATE,
      channels: this.voice.AUDIO_CHANNELS,
      bitDepth: BIT_DEPTH
    });

    this.voice.channel.members.forEach(member => {
      this.mixerInputs[member.id] = new AudioMixer.Input({
        sampleRate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        bitDepth: BIT_DEPTH,
        clearInterval: 250,
        volume: 200
      });
      this.decoders[member.id] = new prism.opus.Decoder({
        rate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        frameSize: this.voice.FRAME_SIZE
      });

      this.decoders[member.id].pipe(this.mixerInputs[member.id]);
      this.mixer.addInput(this.mixerInputs[member.id]);
    });

    this.voice.connection.sendAudioSilenceFrame();
    this.voice.connection.on('packet', this.packetEventFunc);
  }

  private getRidOfVoiceReceiver() {
    debug('Stopping voice receiver...');
    this.voice.connection.off('packet', this.packetEventFunc);
    for (const id in this.mixerInputs)
      this.mixer.removeInput(this.mixerInputs[id]),
      this.decoders[id].unpipe(this.mixerInputs[id]);
    this.decoders = {};
    this.mixerInputs = {};
    if (this.sox) {
      this.sox.kill(0);
      this.sox = null;
    }
  }

  private async onResponse(text ? : string) {
    if (!text) return;
    debug('Response:', text);

    const keys = Object.keys(GOOGLE_COLORS);
    const color = GOOGLE_COLORS[keys[keys.length * Math.random() << 0]];

    this.responseMessage = true;
    this.responseMessage = await this.voice.logChannel.createMessage({
      embed: {
        title: this.finalTranscription ? (EMOJI_ICONS.GOOGLE_ASSISTANT + ' `' + this.finalTranscription + '`') : null,
        description: text,
        color
      }
    });
    this.emit('responseMessageCreated');
  }

  private async onError(error: Error, endedConv: boolean) {
    this.getRidOfVoiceReceiver();
    console.error(error);

    Sentry.captureException({
      tags: { loc: TAG },
      extra: { endedConv }
    });

    await this.voice.logChannel.createMessage({
      embed: {
        title: endedConv ? 'Conversation ended with an error' : 'Google Assistant Error',
        color: EMBED_COLORS.ERR,
        description: '```\n' + error.message + '```'
      }
    });
  }

  private async onTranscription({
    transcription,
    done
  }: {
    transcription: string,
    done: boolean
  }) {
    debug('Transcription:', transcription, '; Done?:', done);
    if (!done) {
      try {
        const embed = new Embed({
          title: EMOJI_ICONS.GOOGLE_MIC + ' `' + transcription + '`',
          color: GOOGLE_COLORS.BLUE,
        });

        if (!this.transcriptMessage)
          this.transcriptMessage = true,
          this.transcriptMessage = await this.voice.logChannel.createMessage({
            embed
          }),
          this.emit('transcriptMessageCreated');
        else if (typeof this.transcriptMessage !== 'boolean' && Date.now() - this.transcriptEditedAt >= 250) {
          this.transcriptEditedAt = Date.now();
          await this.transcriptMessage.edit({
            embed
          });
        }
      } catch (err) {}
    } else {
      this.finalTranscription = transcription;
      this.voice.playFile('resources/googleAssistant/pingSuccess.wav');
      if (this.transcriptMessage) {
        const getRidOfTranscriptMessage = async() => {
          if (!this.transcriptMessage) return;
          try {
            await (this.transcriptMessage as Message).delete(),
              this.transcriptMessage = null;
          } catch (err) {}
        };

        if (typeof this.transcriptMessage !== 'boolean')
          await getRidOfTranscriptMessage();
        else
          this.once(
            'transcriptMessageCreated',
            () => getRidOfTranscriptMessage()
          );
      }

      if (this.responseMessage) {
        const editResponseMessage = async() => {
          const message = this.responseMessage as Message;
          const embed = message.embeds.get(0);
          embed.title = EMOJI_ICONS.GOOGLE_ASSISTANT + ' `' + transcription + '`';

          await message.edit({
            embed
          });
          this.responseMessage = null;
        }

        if (typeof this.responseMessage !== 'boolean')
          await editResponseMessage();
        else
          this.once(
            'responseMessageCreated',
            () => editResponseMessage()
          );
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
            read() {}
          });
          this.voice.addToQueue(stream);
        }

        stream.push(Buffer.from(data));
        if (streamTimeout)
          clearTimeout(streamTimeout);
        streamTimeout = setTimeout(
          () => stream.emit('end'),
          500
        );
      })
      .on('end-of-utterance', () =>
        this.getRidOfVoiceReceiver()
      )
      .on('transcription', async(data: {
          transcription: string,
          done: boolean
        }) =>
        this.onTranscription(data)
      )
      .on('response', (text: string) =>
        this.onResponse(text)
      )
      .once('ended', (error: Error, continueConversation: boolean) => {
        if (error)
          this.onError(error, true);
        else if (continueConversation) {
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
      .on('error', (error: Error) =>
        this.onError(error, false)
      );
    this.conversation = conv;
  }

  public startListening() {
    if (!this.complete)
      return this.voice.logChannel.createMessage({
        content: 'Already listening, please talk.'
      });
    this.complete = false;
    this.responseMessage = null;
    this.conversation = null;
    this.voice.kill(false);
    this.voice.playFile('resources/googleAssistant/pingStart.wav');
    if (this.sox)
      this.getRidOfVoiceReceiver();
    this.setupVoiceReceiver();
    this.googleAssistant.start(this.config.conversation);
  }

  public destroy() {
    if (!this.complete)
      return false;
    debug('Destroying self...');
    this.voice.kill(false);
    this.getRidOfVoiceReceiver();
    this.voice.denyOnAudioSubmission = false;
    this.voice.googleAssistant = null;
    return true;
  }
};