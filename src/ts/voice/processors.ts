import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { User } from 'detritus-client/lib/structures';
import fs from 'fs';
import { Transform } from 'stream';

import { Application } from '../Application';
import { FILENAME_REGEX } from '../constants';
import { BaseEffect, BaseEffectOptions, BaseEffectOptionsRange } from './foundation/BaseEffect';
import BaseFormat from './foundation/BaseFormat';
import NewVoice from './new';

interface BaseVoiceProcessorOptions {
  create?: boolean,
  constructorArgs?: any[],
  scanPath: string
}

class BaseVoiceProcessor extends Transform {
  public readonly processors: Record<string, any> = {};

  constructor(options: BaseVoiceProcessorOptions) {
    super();
    for (const fileName of fs.readdirSync(__dirname + '/' + options.scanPath)) {
      const name = fileName.replace(FILENAME_REGEX, '');
      const any: any = require('./' + options.scanPath + fileName).default;
      if (options.create)
        if (options.constructorArgs)
          this.processors[name] = new any(...options.constructorArgs)
        else
          this.processors[name] = new any()
      else
        this.processors[name] = any;
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
  FETCH = 'fetch'
}

export interface VoiceFormatResponse {
  info: VoiceFormatResponseInfo;
  type: VoiceFormatResponseType;
}

export interface VoiceFormatResponseURL extends VoiceFormatResponse {
  url: string;
  type: VoiceFormatResponseType.URL;
}

export interface VoiceFormatResponseFetch extends VoiceFormatResponse {
  fetch: () => Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;
  type: VoiceFormatResponseType.FETCH;
}

export interface VoiceFormatResponseReadable extends VoiceFormatResponse {
  readable: NodeJS.ReadableStream;
  type: VoiceFormatResponseType.READABLE;
}

export class VoiceFormatProcessor extends BaseVoiceProcessor {
  public readonly processors!: Record<string, BaseFormat>;

  constructor(application: Application) {
    super({
      create: true,
      constructorArgs: [application.config.formatCredentials],
      scanPath: 'formats/'
    });
  }

  public async fromURL(url: string) {
    let result: VoiceFormatResponse[] | VoiceFormatResponse | false = false;

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
  public readonly processors!: Record<string, new () => BaseEffect>;
  public readonly STACK_LIMIT = 8;
  private sox?: ChildProcessWithoutNullStreams;
  private stack: BaseEffect[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice) {
    super({ scanPath: 'effects/' });
    this.voice = voice;
  }

  public addEffect(name: string, start?: number) {
    start = start || this.stack.length;
    if (!this.processors[name])
      throw new Error('effect not found');
    if (this.stack.length === this.STACK_LIMIT)
      throw new Error('effect stack overflow');
    const effect = new this.processors[name];
    effect.enabled = true;
    this.stack.splice(start, 0, effect);
    if (this.sox) this.createAudioEffectProcessor();
    return start;
  }

  public removeEffect(id: number) {
    if (!this.stack[id]) throw new Error('effect not found');
    if (this.stack.length === 0) throw new Error('effect stack underflow');
    this.stack.splice(id, 1);
    if (this.sox) this.createAudioEffectProcessor();
  }

  public getEffectInfo(id: number): any[] {
    if (!this.stack[id]) throw new Error('effect not found');
    return [ this.stack[id].name, this.stack[id].options, this.stack[id].optionsRange ];
  }

  public clearEffects() {
    this.stack = [];
    if (this.sox) this.createAudioEffectProcessor();
  }

  public setValue(id: number, name: string, value?: any) {
    if (!this.stack[id]) throw new Error('effect not found');
    const afx = this.stack[id];
    const option = afx.options[name as keyof BaseEffectOptions];
    if (option === undefined)
      throw new Error('effect option not found');
    if (value === undefined)
      throw new Error('value has to be provided');

    const type = typeof option;
    switch (type) {
      case 'number':
        value = Number(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      default:
        throw new Error(
          'could not convert given value to needed type! ' + type
        );
    }

    if (type !== typeof value)
      throw new Error('the type of value is not equal to the type of a specified setting');

    const range: number[] | undefined = afx.optionsRange[name as keyof BaseEffectOptionsRange];
    if (typeof value === 'number' && range) {
      const [min, max] = range;
      if (value < min || value > max)
        throw new Error(`given value out of range (${min} - ${max})`)
    }

    afx.options[name as keyof BaseEffectOptions] = value;
    if (this.sox) this.createAudioEffectProcessor();
  }

  public getValue(id: number, option: string) {
    if (!this.stack[id]) throw new Error('effect not found');
    return this.stack[id].options[option];
  }

  private get args() {
    let result: string[] = [];
    for (const effect of this.stack)
      if (effect.enabled !== false && typeof effect.args !== 'boolean')
        result = result.concat([effect.name, ...effect.args.map((x: string | number) => x.toString())]);
    return result;
  }

  private get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  private get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public get list() {
    return this.stack.map((x) => x.name);
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
