import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { Structures } from 'detritus-client';
import fs from 'fs';
import { Transform } from 'stream';

import { Constants, convertToType, Logger } from '@/modules/utils';

import config from '@/configs/formats.json';
import { BaseEffect, BaseEffectOptions, BaseEffectOptionsRange } from './effects/baseeffect';
import { BaseFormat } from './formats/baseformat';
import NewVoice from '.';

interface BaseVoiceManagerOptions {
  create?: boolean;
  constructorArgs?: any[];
  loggerTag?: string;
  scanPath: string;
}

class BaseVoiceManager extends Transform {
  public readonly logger!: Logger;
  public readonly processors: Record<string, any> = {};

  constructor(options: BaseVoiceManagerOptions) {
    super();
    if (options.loggerTag) this.logger = new Logger(options.loggerTag);
    this.processors = BaseVoiceManager.standaloneScan(options);
  }

  public static standaloneScan(options: BaseVoiceManagerOptions) {
    const processors: Record<string, any> = {};
    for (const fileName of fs.readdirSync(__dirname + '/' + options.scanPath)) {
      const name = fileName.replace(Constants.FILENAME_REGEX, '');
      const any: any = require('./' + options.scanPath + fileName).default;
      if (!any) continue;
      if (options.create)
        if (options.constructorArgs)
          processors[name] = new any(...options.constructorArgs);
        else processors[name] = new any();
      else processors[name] = any;
    }
    return processors;
  }
}

export interface VoiceFormatResponseInfo {
  title: string;
  url: string;
  submittee?: Structures.User;
  image: string | Buffer;
  duration: number;
}

export enum VoiceFormatResponseType {
  URL = 'url',
  READABLE = 'readable',
  FETCH = 'fetch',
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

export class VoiceFormatManager extends BaseVoiceManager {
  public readonly processors!: Record<string, BaseFormat>;

  constructor() {
    super({
      create: true,
      constructorArgs: [config],
      loggerTag: 'Voice format manager',
      scanPath: 'formats/',
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
        this.logger.error(format.printName, 'spew an error: ', err);
        this.logger.error('url used:', url);
        continue;
      }

      break;
    }

    return result;
  }
}

const VOICE_EFFECT_MANAGER_SCAN_PATH = 'effects/';

export class VoiceEffectManager extends BaseVoiceManager {
  public readonly processors!: Record<string, new () => BaseEffect>;
  public readonly STACK_LIMIT = 8;
  private sox?: ChildProcessWithoutNullStreams;
  private stack: BaseEffect[] = [];
  private readonly voice: NewVoice;

  constructor(voice: NewVoice) {
    super({
      loggerTag: 'Voice effect manager',
      scanPath: VOICE_EFFECT_MANAGER_SCAN_PATH,
    });
    this.voice = voice;
  }

  public static getArgumentType() {
    const effects = this.standaloneScan({
      scanPath: VOICE_EFFECT_MANAGER_SCAN_PATH,
    });
    return Object.keys(effects).map(effect => ({
      name: effect,
      value: effect,
    }));
  }

  public addEffect(name: string, start?: number) {
    start = start || this.stack.length;
    if (!this.processors[name]) throw new Error('effect not found');
    if (this.stack.length === this.STACK_LIMIT)
      throw new Error('effect stack overflow');
    const effect = new this.processors[name]();
    effect.enabled = true;
    this.stack.splice(start, 0, effect);
    if (this.sox) this.createAudioEffectManager();
    return start;
  }

  public removeEffect(id: number) {
    if (!this.stack[id]) throw new Error('effect not found');
    if (this.stack.length === 0) throw new Error('effect stack underflow');
    this.stack.splice(id, 1);
    if (this.sox) this.createAudioEffectManager();
  }

  public getEffectInfo(id: number) {
    if (!this.stack[id]) throw new Error('effect not found');
    return {
      name: this.stack[id].name,
      options: this.stack[id].options,
      optionsRange: this.stack[id].optionsRange,
    };
  }

  public clearEffects() {
    this.stack = [];
    if (this.sox) this.createAudioEffectManager();
  }

  public setValue(id: number, name: string, value?: any) {
    if (!this.stack[id]) throw new Error('effect not found');
    const afx = this.stack[id];
    const option = afx.options[name as keyof BaseEffectOptions];
    if (option === undefined) throw new Error('effect option not found');
    if (value === undefined) throw new Error('value has to be provided');

    const type = typeof option;
    value = convertToType(value, type);

    const range: number[] | undefined =
      afx.optionsRange[name as keyof BaseEffectOptionsRange];
    if (type === 'number' && range) {
      const [min, max] = range;
      if (value < min || value > max)
        throw new Error(`given value out of range (${min} - ${max})`);
    }

    afx.options[name as keyof BaseEffectOptions] = value;
    if (this.sox) this.createAudioEffectManager();
  }

  public getValue(id: number, option: string) {
    if (!this.stack[id]) throw new Error('effect not found');
    return this.stack[id].options[option];
  }

  private get args() {
    let result: string[] = [];
    for (const effect of this.stack)
      if (effect.enabled !== false && typeof effect.args !== 'boolean')
        result = result.concat([
          effect.name,
          ...effect.args.map((x: string | number) => x.toString()),
        ]);
    return result;
  }

  private get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  private get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public get list() {
    return this.stack.map(x => x.name);
  }

  public destroyAudioEffectManager() {
    if (this.sox) this.sox.kill('SIGKILL');
  }

  public _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (error?: Error) => void
  ): void {
    if (this.sox) this.sox.stdin.write(chunk);
    callback();
  }

  public createAudioEffectManager() {
    this.destroyAudioEffectManager();

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

    this.sox.stdout.on('data', chunk => this.push(chunk));
    this.sox.stderr.on('data', data => console.log(data.toString()));
    this.sox.stdout.on('error', e => {
      this.logger.error('sox.stdout spew an error:', e);
      this.logger.error('arguments used:', this.args);
    });
  }
}
