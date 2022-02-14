import axios from 'axios'
import { spawn, ChildProcess } from 'child_process'
import dbg from 'debug'
import { VoiceConnection } from 'detritus-client/lib/media/voiceconnection'
import { ChannelGuildVoice, ChannelTextType, Message } from 'detritus-client/lib/structures'
import { RequestTypes } from 'detritus-client-rest'
import Matcher from 'did-you-mean';
import { EventEmitter } from 'events'
import fs from 'fs'
import * as prism from 'prism-media'
import * as Sentry from '@sentry/node'
import {
  Stream,
  Writable,
  Readable,
  Transform
} from 'stream'
import { decodeArrayStream } from '@msgpack/msgpack'

import { Application } from '../Application'
import BaseEffect from './foundation/BaseEffect'
import BaseFormat from './foundation/BaseFormat'
import { EMBED_COLORS, FILENAME_REGEX } from '../constants'
import GoogleAssistantVoiceModule from './googleAssistant'
import { Rewindable } from './utils'

interface ExtendedReadableInfo {
  title: string
  image?: string
  url: string
  platform?: string
};

export class ExtendedReadable extends Readable {
  public info?: ExtendedReadableInfo
}

const TAG = 'Voice/Player'
const debug = dbg(TAG)

class Player extends Writable {
  public count = 0
  public ss = 0
  private curPos = 0
  private readonly FRAME_LENGTH = 20
  private readonly voice: Voice
  private readonly timeouts: NodeJS.Timeout[] = []

  constructor (voice: Voice) {
    super()
    this.voice = voice
  }

  public get position (): number {
    return this.ss + this.curPos
  }

  private calcMs (count: number) {
    const {
      startTime,
      restartTime,
      pauseTime
    } = this.voice
    if (typeof startTime === 'boolean') return 0
    return (
      count * this.FRAME_LENGTH -
      (Date.now() - (restartTime || startTime) - pauseTime)
    )
  }

  public _write (chunk: any, _enc: any, callback: any) {
    if (!this.voice.startTime) this.voice.startTime = Date.now()

    this.voice.connection.sendAudio(chunk, {
      isOpus: true
    })
    setTimeout(
      () => (
        callback(null),
        (this.curPos = this.count * this.FRAME_LENGTH)
      ),
      this.calcMs(this.count)
    )
    this.count++

    return true
  }

  public onEnd () {
    this.kill()
    debug('stream ends here')
  }

  public kill (notCritical = false) {
    // this.voice.connection.sendAudioSilenceFrame()
    if (!notCritical) {
      this.voice.playerKill()
      this.voice.startTime = false
      this.voice.restartTime = null
    }

    this.ss = 0
    this.curPos = 0
    debug('Player.kill() call')
  }
}

class Mixer extends Transform {
  public buffers: Buffer[] = []
  public readonly FRAME_LENGTH = 20;
  private voice: Voice;

  constructor (voice: Voice, buffers?: Buffer[]) {
    super();
    this.voice = voice;
    if (buffers)
      this.buffers = buffers
  }

  public _write(chunk: any, _enc: any, callback: any) {
    const SAMPLE_BYTE_LEN = 2

    let newbuf = chunk;
    if (this.buffers.length > 0) {
      newbuf = Buffer.alloc(chunk.length)
      const MIN_SAMPLE = -32768
      const MAX_SAMPLE = 32767
      for (let v = 0; v < chunk.length / SAMPLE_BYTE_LEN; v++) {
        const pos = v * SAMPLE_BYTE_LEN;

        let samples = chunk.readInt16LE(pos);
        let count = 0;
        for (let buffer of this.buffers) {
          count++;
          if (2 >= buffer.length) {
            this.buffers.splice(count - 1, 1);
            continue;
          }
          samples += buffer.readInt16LE(0);
          this.buffers[count - 1] = buffer.slice(2, buffer.length);
        }

        if (samples < MIN_SAMPLE || samples > MAX_SAMPLE)
          debug('clamping samples!! (' + samples + ')'),
          samples = Math.max(Math.min(samples, MAX_SAMPLE), MIN_SAMPLE)

        newbuf.writeInt16LE(samples, pos);
      }
    }
    this.push(newbuf);

    callback();
    return true
  }

  public addBuffer(buf: Buffer) {
    this.buffers.push(buf);
  }
}

export class Voice extends EventEmitter {
  public effects: Map < string, BaseEffect > = new Map()
  public connection: VoiceConnection
  public queue: ExtendedReadable[] = []
  public startTime: number | boolean
  public pauseTime = 0
  public restartTime?: number
  public denyOnAudioSubmission = false
  public initialized = false
  public googleAssistant?: GoogleAssistantVoiceModule
  public readonly SAMPLE_RATE = 48000
  public readonly AUDIO_CHANNELS = 2
  public readonly FRAME_SIZE = 960
  public readonly application: Application
  public readonly channel: ChannelGuildVoice
  public readonly logChannel: ChannelTextType
  private readonly formats: BaseFormat[] = []
  private streams: Record < string, any > = {}
  private soundeffects: Record < string, string[] > = {}
  private soundeffectsMatcher: Matcher;
  private children: Record < string, any > = {}
  private player: Player
  private currentlyPlaying: ExtendedReadable | string | false
  private overlay: ExtendedReadable | false
  private rewindable: Rewindable
  private doneWriting = false
  private waitingToWrite: Message
  private mixer: Mixer;
  private idle: NodeJS.Timeout;

  constructor (
    application: Application,
    channel: ChannelGuildVoice,
    logChannel: ChannelTextType
  ) {
    super()
    this.application = application
    this.channel = channel
    this.logChannel = logChannel

    application.voices.set(channel.guildId, this)
    this.initialize()
  }

  private async initialize () {
    const {
      connection
    } = await this.channel.join({
      receive: true
    })

    for (const formatFileName of fs.readdirSync(__dirname + '/formats/')) {
      const Format: any = (
        await
        import (
          './formats/' + formatFileName.replace(FILENAME_REGEX, '')
        )
      ).default
      this.formats.push(new Format())
    }

    for (const effectFileName of fs.readdirSync(__dirname + '/effects/')) {
      const name = effectFileName.replace(FILENAME_REGEX, '')
      const Effect: any = (await
      import ('./effects/' + name)).default
      this.effects.set(name, new Effect())
    }

    this.fetchSoundeffects();
    this.setupConnections();
    this.setupIdleInterval();

    this.connection = connection
    this.connection.setOpusEncoder()
    this.connection.setSpeaking({
      voice: true
    })
    this.emit('initComplete')
    this.initialized = true
    debug('Voice initialized')
  }

  // Source: https://github.com/Metastruct/Chatsounds-X/blob/master/app/src/ChatsoundsFetcher.ts
  private async sfxBuildFromGitHub(repo: string, usesMsgPack: boolean, base?: string) {
    if (!base) base = 'sounds/chatsounds'

    const baseUrl = `https://raw.githubusercontent.com/${repo}/master/${base}/`;
    const sounds: Array<Array<string>> = [];

    if (usesMsgPack) {
      const resp = await axios.get(baseUrl + 'list.msgpack', { responseType: 'stream' });
      const generator: any = decodeArrayStream(resp.data);
			for await (const sound of generator)
        sounds.push(sound);
    } else {
      const responseFromGh = await axios(`https://api.github.com/repos/${repo}/git/trees/master?recursive=1`);
      const body: string = JSON.stringify(responseFromGh.data);
			let i: number = 0;
			for (const match of body.matchAll(/"path":\s*"([\w\/\s\.]+)"(?:\n|,|})/g)) {
				let path: string = match[1];
				if (!path || path.length === 0) continue;
				if (!path.startsWith(base) || !path.endsWith('.ogg')) continue;

				path = path.substring(base.length + 1);
				const chunks: Array<string> = path.split('/');
				const realm: string = chunks[0];
				let trigger: string = chunks[1];

				if (!chunks[2]) {
					trigger = trigger.substring(0, trigger.length - '.ogg'.length);
				}

				sounds[i] = [realm, trigger, path];

				if (trigger.startsWith('-')) {
					sounds[i][1] = sounds[i][1].substring(1);
					sounds[i][3] = `${realm}/${trigger}.txt`;
				}

				i++;
			}
    }

    for (const [ _realm, name, file ] of sounds) {
      if (!this.soundeffects[name])
        this.soundeffects[name] = [];
      this.soundeffects[name].push(baseUrl + file);
    }
  }

  private async fetchSoundeffects() {
    const lists = {
      'PAC3-Server/chatsounds-valve-games': {
        bases: [ 'tf2', 'portal', 'l4d2', 'l4d', 'hl2', 'hl1', 'ep2', 'ep1', 'css', 'csgo' ],
        useMsgPack: true
      },
      'Metastruct/garrysmod-chatsounds': {
        bases: [ 'sound/chatsounds/autoadd' ],
        useMsgPack: false
      },
      'PAC3-Server/chatsounds': {
        bases: false,
        useMsgPack: false
      }
    };

    for (const repo in lists) {
      const cfg = lists[repo];
      if (cfg.bases)
        for (const base of cfg.bases)
          await this.sfxBuildFromGitHub(repo, cfg.usesMsgPack, base)
      else
        await this.sfxBuildFromGitHub(repo, cfg.usesMsgPack);
    }

    this.soundeffectsMatcher = new Matcher(Object.keys(this.soundeffects))
  }

  private setupConnections() {
    this.mixer = new Mixer(this);
    this.streams.opus = this.mixer.pipe(
      new prism.opus.Encoder({
        channels: this.AUDIO_CHANNELS,
        rate: this.SAMPLE_RATE,
        frameSize: this.FRAME_SIZE
      }),
      { end: false }
    )
    this.player = this.streams.opus.pipe(new Player(this), { end: false })
  }

  private setupIdleInterval() {
    debug('starting idle interval')
    this.idle = setInterval(
      () => this.mixer.write(Buffer.alloc(this.FRAME_SIZE * this.AUDIO_CHANNELS * 2)),
      this.mixer.FRAME_LENGTH
    );
  }

  private convert2SOX (streamOrFile = this.currentlyPlaying, ss?: number) {
    const isFile = typeof streamOrFile === 'string'

    const ffmpegArgs: string[] = [
      '-ar',
      this.SAMPLE_RATE.toString(),
      '-ac',
      this.AUDIO_CHANNELS.toString(),
      '-f',
      'sox',
      'pipe:1'
    ]

    ffmpegArgs.unshift(
      '-re',
      '-i',
      (isFile ? (streamOrFile as string) : 'pipe:3')
    )

    if (ss) ffmpegArgs.unshift('-ss', ss.toString())
    if (this.overlay) { ffmpegArgs.splice(2, 0, '-i', 'pipe:4', '-filter_complex', 'amix=inputs=2') }

    const ffmpeg = this.children.ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: [
        'inherit', 'pipe', 'inherit',
        'pipe', 'pipe'
      ]
    })

    ffmpeg.on('close', (code: number) =>
      code === 1 && this.onPlayingError('ffmpeg', new Error('FFMPEG unexpectedly closed with exit code 1'))
    )

    const onError = (err: any) => err.code !== 'ECONNRESET' && this.onPlayingError('ffmpeg', err)

    if (!isFile) {
      const stream = streamOrFile as Stream
      stream.pipe(ffmpeg.stdio[3] as Writable)
      stream.on('error', onError)
    }

    if (this.overlay) {
      this.overlay.pipe(ffmpeg.stdio[4] as Writable)
      this.overlay.on('error', onError)
    }

    ffmpeg.on('error', onError)
    ffmpeg.stdio[3].on('error', onError)
    ffmpeg.stdio[4].on('error', onError)
    return ffmpeg.stdout
  }

  private onPlayingError (cause: string, err: any) {
    if (err.code === 'EPIPE') return
    debug('Error on one of the ' + cause + ' streams', err)

    Sentry.captureException(err, {
      tags: {
        stream: cause,
        loc: TAG
      },
      extra: {
        mediaMetadata: typeof this.currentlyPlaying !== 'string' && this.currentlyPlaying
          ? this.currentlyPlaying.info
          : this.currentlyPlaying
      }
    })

    this.error(
      'Error occurred while trying to play audio',
      err ? '```\n' + err.message + '```' : null
    )

    this.skip()
  }

  public skip () {
    if (this.player) { this.player.kill() } else this.playerKill()
  }

  private async start (ss?: number) {
    const restarted = typeof ss !== 'undefined'
    this.killPrevious()
    let input = this.currentlyPlaying;

    if (!restarted && this.player) this.player.ss = 0
    if (restarted) input = this.currentlyPlaying = this.rewindable.rewind()

    if (!this.rewindable) {
      this.rewindable = new Rewindable()
      this.doneWriting = false
      if (typeof this.currentlyPlaying !== 'string' && this.currentlyPlaying !== false) {
        input = this.currentlyPlaying.pipe(this.rewindable)
        this.currentlyPlaying.on('end', () => {
          this.emit('rewindDone')
          debug('rewind done')
          this.doneWriting = true
        })
      }
    }

    const postPlayingMessage = !restarted && this.currentlyPlaying !== false &&
      typeof this.currentlyPlaying !== 'string' && this.currentlyPlaying.info
    if (postPlayingMessage) {
      const {
        title,
        image,
        url,
        platform
      } = (this.currentlyPlaying as ExtendedReadable).info
      const embed: RequestTypes.CreateChannelMessageEmbed = {
        title: 'Now playing: ' + title,
        url,
        color: EMBED_COLORS.DEF,
        footer: {
          text: 'Fetched from ' + platform
        }
      }
      if (url) {
        embed.thumbnail = {
          url: image
        }
      }

      this.logChannel.createMessage({
        embed
      })
    }

    const effects = Array.from(this.effects, ([_, effect]) => {
      if (typeof effect.args === 'boolean') return []
      return [effect.name, ...effect.args]
    }).reduce((global, local) => global.concat(local), [])
    debug('afx: ', effects)

    this.children.sox = spawn('sox', [
      '-t',
      'sox',
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
      ...effects
    ])

    this.streams.ffmpeg = this.convert2SOX(input, ss)
    this.streams.sox = this.streams.ffmpeg.pipe(this.children.sox.stdin)
    this.children.sox.stdout.pipe(this.mixer, { end: false });

    let killedPrevious = false;
    this.once('killPrevious', () => (killedPrevious = true));
    this.children.sox.stdout.once('end', () => !killedPrevious && this.player.onEnd())

    this.streams.sox.on('error', (e: Error) => this.onPlayingError('sox', e))
    this.streams.opus.once('error', (e: Error) => this.onPlayingError('opus', e))
  }

  public playerKill () {
    this.killPrevious()
    debug('Voice.playerKill() call')
    this.emit('playerKill')
    this.rewindable = null
    this.doneWriting = true

    if (this.overlay) {
      this.overlay = false,
      debug('Stopping to overlay...')
    }

    if (this.queue.length === 0) {
      this.currentlyPlaying = false
      this.setupIdleInterval()
      return
    }

    debug('Another stream available, playing')
    const stream = this.queue.shift()
    this.currentlyPlaying = stream
    this.start()
  }

  public async playURL (url: string) {
    if (this.denyOnAudioSubmission) {
      return await this.logChannel.createMessage({
        embed: {
          title: 'You are denied to submit audio currently',
          color: EMBED_COLORS.ERR
        }
      })
    }

    let result: ExtendedReadable | boolean = false

    for (const format of this.formats) {
      const res = url.match(format.regex)
      if (!res || res.length === 0) continue

      let streamOrFalse: ExtendedReadable | false
      try {
        streamOrFalse = await format.onMatch(url)
        if (!streamOrFalse) continue
      } catch (err) {
        dbg(`error on ${format.printName} format`)
        Sentry.captureException(err, {
          tags: {
            format: format.printName,
            loc: TAG
          },
          extra: { url }
        })
        continue
      }

      debug(`submitted url matched to ${format.printName} format, yay!`)
      result = streamOrFalse
      result.info.platform = format.printName

      break
    }

    if (result !== false) this.addToQueue(result)
    else {
      const formats = this.formats.map(x => x.printName)
      return await this.error('Unrecognized format!', '```\n' + formats.join('\n') + '```')
    }
  }

  public playInternalSoundeffect(file: string) {
    const path = 'resources/sounds/' + file + '.raw'
    if (fs.existsSync(path))
      this.mixer.addBuffer(fs.readFileSync(path))
  }

  private fetchChatsound(url: string) {
    return new Promise(async (res) => {
      const regex = /http(?:s?):\/\/raw\.githubusercontent\.com\/([\w-_\d]*)\/([\w-_\d]*)\/([0-f]*)\//g
      const fileName = url.replaceAll(regex, '').replaceAll('/', '_')
      if (fs.existsSync('cache/' + fileName + '.raw'))
        return res(fs.readFileSync('cache/' + fileName + '.raw'))

      const { data } = await axios({
        method: 'get',
        url,
        responseType: 'stream'
      });

      const stream = spawn('ffmpeg', [ '-i', '-', '-ac', '2', '-ar', '48000', '-f', 's16le', '-'])
      data.pipe(stream.stdin)

      const buffers = []
      stream.stdout.on('data', (data: any) =>
        buffers.push(data)
      )

      stream.stdout.on('end', () => {
        const buffer = Buffer.concat(buffers)
        res(buffer)
        if (!fs.existsSync('cache/')) fs.mkdirSync('cache/')
        fs.writeFileSync('cache/' + fileName + '.raw', buffer)
      })
    })
  }

  public async playSoundeffect(file: string) {
    const parsed = file.toLowerCase().split(';')

    let failed = false
    const fail = (file: string) => {
      if (failed) return
      failed = true
      const matches = this.soundeffectsMatcher && this.soundeffectsMatcher.list(file).map(x => x.value).join('\n')
      this.error('No such soundeffect!', matches && 'Did you mean: ```\n' + matches + '```')
    }

    const combined = (await Promise.all(
      parsed.map(async (file) => {
        file = file.trim()
        const split: any[] = file.split('#')
        if (split[1]) split[1] = Number(split[1])
        else if (this.soundeffects[split[0]])
          split[1] = Math.floor(Math.random() * this.soundeffects[split[0]].length)

        const pathToSfx = this.soundeffects[split[0]]
        debug('parsed sfx', pathToSfx, split)

        if (file === 'sh') {
          this.mixer.buffers = []
          return Buffer.alloc(0)
        }

        if (!this.soundeffects[split[0]])
          return fail(split[0])
        return await this.fetchChatsound(pathToSfx[split[1]])
      })
    )).reduce(
      (pV, cV) =>
        (pV === undefined || cV === undefined) ? undefined : Buffer.concat([(pV as Buffer), (cV as Buffer)]),
      Buffer.alloc(0)
    );

    if (combined !== undefined)
      this.mixer.addBuffer(combined as Buffer);
  }

  private async error (title = 'Unknown Error', description: string = null) {
    return await this.logChannel.createMessage({
      embed: {
        title,
        color: EMBED_COLORS.ERR,
        description
      }
    })
  }

  public async startOverlaying (id: number) {
    id--
    if (this.overlay) { return await this.error('You can only overlay two streams at once!') }
    if (!this.currentlyPlaying) { return await this.error('Nothing currently playing!') }
    if (!this.queue[id]) { return await this.error('No such queue item ' + id + 1) }
    if (typeof this.queue[id] === 'string') { return await this.error("You can't overlay local files!") }
    let ms: number

    if (this.player) {
      ms = this.player.position
      this.player.kill(true)
    }

    this.killPrevious()
    this.overlay = this.queue.splice(id, 1)[0]
    this.restartTime = Date.now()
    debug('Starting to overlay, time:', ms, 'ms')
    this.start(ms / 1000)
  }

  public playFile (path: string) {
    if (!fs.existsSync(path)) { return debug('File', path, 'does not exist!') }
    this.addToQueue(path)
  }

  public async restart () {
    if (!this.player || !this.currentlyPlaying) return
    if (!this.doneWriting && !this.waitingToWrite) {
      this.once('rewindDone', () => {
        this.restart()
        if (!this.waitingToWrite) return;
        this.waitingToWrite.delete()
        this.waitingToWrite = null
      })

      this.waitingToWrite = await this.logChannel.createMessage({
        embed: {
          title: 'Waiting...',
          color: EMBED_COLORS.DEF,
          footer: {
            text: 'Might take a while, depending on how long the sound is.'
          }
        }
      })
      return
    }

    const ms = this.player.position
    this.player.kill(true)
    this.player.ss = ms
    this.restartTime = Date.now()
    debug('Restart call, time: ', ms, 'ms')

    if (this.currentlyPlaying) this.start(ms / 1000)
  }

  public async addToQueue (str: ExtendedReadable | string) {
    if (this.queue.length === 0 && !this.currentlyPlaying) return (this.currentlyPlaying = str), this.start()
    if (typeof str !== 'string') this.queue.push(str)
  }

  private killPrevious () {
    this.emit('killPrevious')
    debug('Voice.killPrevious() call')
    clearInterval(this.idle)
    if (this.player)
      this.player.count = 0
    if (this.children.sox)
      this.children.sox.stdout.unpipe(this.mixer)

    Object.values(this.children).forEach((c: ChildProcess) => c.kill(9))
    this.children = {}
  }

  public kill (removeVoice = true, clearQueue = true) {
    this.queue = clearQueue ? [] : this.queue
    this.overlay = false

    let ms: number
    this.killPrevious()
    if (this.player) {
      ms = this.player.position
      this.player.kill()
    }
    if (removeVoice) {
      this.connection.kill(),
      this.application.voices.delete(this.channel.guildId)
    }
    return ms
  }
}
