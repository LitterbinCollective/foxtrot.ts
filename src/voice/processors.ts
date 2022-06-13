import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { User } from 'detritus-client/lib/structures';
import fs from 'fs';
import { Transform } from 'stream';

import { Application } from '../Application';
import { FILENAME_REGEX } from '../constants';
import BaseEffect from './foundation/BaseEffect';
import BaseFormat from './foundation/BaseFormat';
import NewVoice from './new';

class BaseVoiceProcessor extends Transform {
  public readonly processors: Record<string, any> = {};

  constructor(constructorArgs: any[], scanPath: string) {
    super();
    for (const fileName of fs.readdirSync(__dirname + '/' + scanPath)) {
      const name = fileName.replace(FILENAME_REGEX, '');
      const any: any = require('./' + scanPath + fileName).default;
      this.processors[name] = new any(...constructorArgs);
    }
  }
}

export interface VoiceFormatResponseInfo {
  title: string;
  url: string;
  submittee?: User;
  image: string | Buffer;
  duration: number;
}

export enum VoiceFormatResponseType {
  URL = 'url',
  READABLE = 'readable',
  FETCH = 'fetch',
}

export interface VoiceFormatResponse {
  fetch?: () => Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;
  info: VoiceFormatResponseInfo;
  readable?: NodeJS.ReadableStream;
  type: VoiceFormatResponseType;
  url?: string;
}

export class VoiceFormatProcessor extends BaseVoiceProcessor {
  public readonly processors: Record<string, BaseFormat>;

  constructor(application: Application) {
    super([application.config.formatCredentials], 'formats/');
  }

  public async fromURL(url: string) {
    let result: VoiceFormatResponse[] | VoiceFormatResponse | false;

    for (const formatName in this.processors) {
      const format = this.processors[formatName];
      const match = url.match(format.regex);
      if (!match || match.length === 0) continue;

      try {
        result = await format.process(url);
        if (!result) continue;
      } catch (err) {
        console.error('VoiceFormatProcessor/' + format.printName, err);
        continue;
      }

      break;
    }

    return result;
  }
}

export class VoiceEffectProcessor extends BaseVoiceProcessor {
  public readonly processors: Record<string, BaseEffect>;
  private sox?: ChildProcessWithoutNullStreams;
  private stack: BaseEffect[] = [];
  private readonly voice: NewVoice;
  private readonly STACK_LIMIT = 16;

  constructor(voice: NewVoice) {
    super([], 'effects/');
    this.voice = voice;
  }

  public addEffect(name: string, start?: number) {
    start = start || this.stack.length;
    if (this.stack.length === this.STACK_LIMIT)
      throw new Error('effect stack overflow');
    const effect = Object.assign(
      Object.create(Object.getPrototypeOf(this.processors[name])),
      this.processors[name]
    );
    effect.enabled = true;
    this.stack.splice(start, 0, effect);
    if (this.sox) this.createAudioEffectProcessor();
    return start + 1;
  }

  public removeEffect(id: number) {
    if (this.stack.length === 0) throw new Error('effect stack underflow');
    this.stack.splice(id, 1);
    if (this.sox) this.createAudioEffectProcessor();
  }

  private get args() {
    let result = [];
    for (const effect of this.stack)
      if (effect.enabled !== false && typeof effect.args !== 'boolean')
        result = result.concat([effect.name, ...effect.args]);
    return result;
  }

  private get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  private get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public destroyAudioEffectProcessor() {
    if (this.sox) this.sox.kill(9);
  }

  public _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error) => void
  ): void {
    if (this.sox) this.sox.stdin.write(chunk);
    callback();
  }

  public createAudioEffectProcessor() {
    this.destroyAudioEffectProcessor();

    this.sox = spawn('sox', [
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
      ...this.args,
    ]);

    console.log(this.args);

    this.sox.stdout.on('data', (chunk) => this.push(chunk));
    this.sox.stderr.on('data', (data) => console.log(data.toString()));
    this.sox.stdout.on('error', (e) => console.error('sox.stdout'));
  }
}
