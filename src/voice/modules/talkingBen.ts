import * as AudioMixer from 'audio-mixer'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import dbg from 'debug'
import prism from 'prism-media'
import * as Sentry from '@sentry/node'

import { Voice } from '..'
import BaseModule from '../foundation/BaseModule'

const TAG = 'TalkingBen'
const debug = dbg(TAG)

export default class TalkingBenVoiceModule extends BaseModule {
  private decoders: Record < string, prism.opus.Decoder > = {}
  private hasBeenSilentSince?: number
  private heard: boolean = false
  private heardCounter = 0
  private kill = false
  private idle: NodeJS.Timeout
  private mixer: AudioMixer.Mixer
  private mixerInputs: Record < string, AudioMixer.Input > = {}
  private mixerEmptyInput: AudioMixer.Input
  private sox?: ChildProcessWithoutNullStreams
  private startedAt = 0
  private readonly packetEventFunc = (packet) => this.receivePacket(packet)
  private readonly RECEIVER_FRAME_LENGTH = 20
  private readonly MAX_WAIT_TIME_SILENCE = 5000
  private readonly MAX_WAIT_TIME = 500
  private readonly MIN_HEARD_COUNT = 4
  private readonly MIN_VOLUME = 0.05

  constructor (voice: Voice) {
    super(voice);
    this.startEvent();
    this.idle = setInterval(
      () =>
        this.mixerEmptyInput && this.mixerEmptyInput.write(Buffer.alloc(this.voice.FRAME_SIZE * this.voice.AUDIO_CHANNELS * 2)),
      this.RECEIVER_FRAME_LENGTH
    );
  }

  private startEvent() {
    this.voice.addToQueue('resources/talkingBen/tbstart.wav')
    const playerKillEvent = () => {
      debug('playerKill event received, assuming that it will play the next sound')
      this.playSound('ben', 'Ben?')
      this.voice.once('playerKill', () =>
        this.startListening()
      )
    }
    this.voice.once('playerKill', playerKillEvent)
  }

  private respond() {
    this.heard = false
    this.startedAt = Date.now()
    this.stopListening()
    const responses = [
      'disgust',
      'laugh',
      'no',
      'yes'
    ]

    let chosen = responses[Math.floor(Math.random() * responses.length)]
    debug('Response: ', chosen)
    let response = ''
    switch (chosen) {
      case 'disgust':
        response = '*[Disgust]*'
        break
      case 'laugh':
        response = '*[Laugh]*'
        break
      case 'no':
        response = 'No.'
        break
      case 'yes':
        response = 'Yes.'
        break
    }

    this.playSound(chosen, response)
    this.voice.once('playerKill', () =>
      !this.kill && this.startListening()
    )
  }

  private playSound(sound: string, response: string) {
    this.voice.addToQueue('resources/talkingBen/tb' + sound + '.wav')
    this.voice.logChannel.createMessage(response)
  }

  private receivePacket ({
    data,
    userId
  }: any) {
    if (this.decoders[userId]) {
      this.decoders[userId].write(data)
    }
  }

  private stopListening () {
    if (this.sox) {
      this.sox.kill(9)
      this.sox = null
    }
    this.voice.connection.off('packet', this.packetEventFunc)
    for (const id in this.mixerInputs) {
      this.mixer.removeInput(this.mixerInputs[id]),
      this.decoders[id].unpipe(this.mixerInputs[id])
    }
    this.decoders = {}
    this.mixerInputs = {}
  }

  private startListening () {
    debug('Starting voice receiver...')
    this.startedAt = Date.now();
    this.heard = false
    this.hasBeenSilentSince = Date.now()

    const bitDepth = 16
    if (!this.mixer || !this.sox) {
      this.mixer = new AudioMixer.Mixer({
        sampleRate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        bitDepth
      })

      this.sox = spawn('sox', [
        '-t', 'raw',
        '-b', '16',
        '-e', 'signed-integer',
        '-r', this.voice.SAMPLE_RATE.toString(),
        '-c', this.voice.AUDIO_CHANNELS.toString(),
        '-',
        '-r', this.voice.SAMPLE_RATE.toString(),
        '-c', this.voice.AUDIO_CHANNELS.toString(),
        '-t', 'raw',
        '-b', '16',
        '-e', 'signed-integer',
        '-',
        'vol', '24', 'dB'
      ])
      this.sox.stderr.on('data', (c) => console.log(c.toString()));
      this.sox.stdout.on('error', (error: any) => error.code !== 'EPIPE' && console.error(error.code));
      this.sox.stdin.on('error', (error: any) => error.code !== 'EPIPE' && console.error(error.code));
      this.sox.stdout.on('data', (chunk: Buffer) => {
        let silent = true
        const SAMPLE_BYTE_LEN = 2

        for (let v = 0; v < chunk.length / SAMPLE_BYTE_LEN; v++) {
          const pos = v * SAMPLE_BYTE_LEN

          const samples = chunk.readInt16LE(pos)
          if (Math.abs(samples) / 32678 >= this.MIN_VOLUME)
            silent = false
        }

        if (silent) {
          this.hasBeenSilentSince = this.hasBeenSilentSince || Date.now()
          this.heardCounter = 0;
          debug('silence, hasBeenSilentSince =', this.hasBeenSilentSince)
          if (this.heard) {
            if (Date.now() - this.hasBeenSilentSince >= this.MAX_WAIT_TIME)
              this.respond()
          } else if (Date.now() - this.startedAt >= this.MAX_WAIT_TIME_SILENCE) {
            this.startedAt = Date.now()
            this.destroy()
            this.voice.logChannel.createMessage('*[Ben has hang up the phone.]*')
          }
        } else
          this.hasBeenSilentSince = null,
          this.heardCounter++,
          (this.heardCounter >= this.MIN_HEARD_COUNT && (this.heard = true)),
          debug('heard')
      });
      this.sox.on('error', (err) => {
        console.error(err)

        Sentry.captureException(err, {
          tags: { loc: TAG }
        })
      })
      this.mixer.pipe(this.sox.stdin)

      this.mixerEmptyInput = new AudioMixer.Input({
        sampleRate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        bitDepth,
        clearInterval: 250
      })
      this.mixer.addInput(this.mixerEmptyInput)
    }

    this.voice.channel.members.forEach(member => {
      this.mixerInputs[member.id] = new AudioMixer.Input({
        sampleRate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        bitDepth,
        clearInterval: 250,
        volume: this.voice.channel.members.size * 200
      })
      this.decoders[member.id] = new prism.opus.Decoder({
        rate: this.voice.SAMPLE_RATE,
        channels: this.voice.AUDIO_CHANNELS,
        frameSize: this.voice.FRAME_SIZE
      })

      this.decoders[member.id].pipe(this.mixerInputs[member.id])
      this.mixer.addInput(this.mixerInputs[member.id])
    })

    this.voice.connection.sendAudioSilenceFrame()
    this.voice.connection.on('packet', this.packetEventFunc)
  }

  public destroy () {
    this.stopListening()
    this.kill = true
    clearInterval(this.idle)
    this.voice.kill(false)
    this.voice.addToQueue('resources/talkingBen/tbend.wav')
    this.voice.denyOnAudioSubmission = false
    this.voice.module = null
    return true
  }
}