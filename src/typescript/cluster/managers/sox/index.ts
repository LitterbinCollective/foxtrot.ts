import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { join } from 'path';

import { Constants, UserError } from '@cluster/utils';
import { convertToType } from '@/utils';

import {
  BaseEffect,
  BaseEffectOptions,
  BaseEffectOptionsRange,
} from './effects/baseeffect';
import { BaseTransformManager, BaseManagerOptions } from '@/managers';

export class SoxManager extends BaseTransformManager<new () => BaseEffect> {
  private sox?: ChildProcessWithoutNullStreams;
  private stack: BaseEffect[] = [];

  constructor(_?: BaseManagerOptions, rawImported?: Record<string, any>) {
    super(
      {
        logger: 'SoX',
        path: join(__dirname, 'effects/'),
      },
      rawImported
    );
  }

  public addEffect(name: string, start?: number) {
    start = start || this.stack.length;
    if (!this.imported[name])
      throw new UserError('effects-mgr.not-found');
    if (this.stack.length === Constants.VOICE_EFFECTS_STACK_LIMIT)
      throw new UserError('effects-mgr.stack-overflow');

    const effect = new this.imported[name]();
    effect.enabled = true;
    this.stack.splice(start, 0, effect);

    if (this.sox) this.createAudioEffectManager();
    return start;
  }

  public newAddEffect(str: string, start = this.stack.length): [ number, boolean ] {
    const parts: string[] = [];
    let buf = '', depth = 0;
    for (const ch of str) {
      if (ch === '(')      { depth++; buf += ch; }
      else if (ch === ')') { depth--; buf += ch; }
      else if (ch === ',' && depth === 0) {
        parts.push(buf.trim());
        buf = '';
      } else
        buf += ch;
    }

    if (buf.trim())
      parts.push(buf.trim());

    const stack: BaseEffect[] = [];
    let index = start;
    let hypotheticalLength = this.stack.length;
    for (const part of parts) {
      const match = part.match(/^([a-zA-Z0-9_]+)(?:\((.*)\))?$/);
      if (!match)
        throw new UserError('effects-mgr.spec.syntax', part);

      const [, name, inner] = match;

      if (!this.imported[name])
        throw new UserError('effects-mgr.not-found');

      const effect = new this.imported[name]();
      effect.enabled = true;

      if (inner) {
        const pairRegex = /([a-zA-Z0-9_]+)\s*=\s*([^\s,)\(]+)/g;
        let match;
        while ((match = pairRegex.exec(inner)) !== null) {
          const [, k, v] = match;
          if (v === undefined)
            throw new UserError('effects-mgr.spec.expected-kv', part);

          const num = +v;
          if (isNaN(num))
            throw new UserError('effects-mgr.spec.expected-number', part);

          if (!effect.options[k])
            throw new UserError('effects-mgr.spec.option-not-found', k, part);

          if (k in effect.optionsRange && effect.optionsRange[k][0] > num || num > effect.optionsRange[k][1])
            throw new UserError('effects-mgr.spec.value-out-of-range', num, k, part);

          effect.options[k] = num;
        }
      }

      if (hypotheticalLength === Constants.VOICE_EFFECTS_STACK_LIMIT)
        throw new UserError('effects-mgr.stack-overflow');

      stack.push(effect);
      index++;
      hypotheticalLength++;
    }

    this.stack.splice(start, 0, ...stack);

    if (this.sox) this.createAudioEffectManager();
    return [ start, parts.length === 1 ];
  }

  public generateEffectSpecString() {
    const stack: string[] = [];
    for (const effect of this.stack) {
      const options = Object.entries(effect.options)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      stack.push(`${effect.name}(${options})`);
    }
    return stack.join(', ');
  }

  public removeEffect(index: number) {
    if (!this.stack[index])
      throw new UserError('effects-mgr.not-found');
    if (this.stack.length === 0)
      throw new UserError('effects-mgr.stack-underflow');

    this.stack.splice(index, 1);

    if (this.sox) this.createAudioEffectManager();
  }

  public getEffectInfo(index: number) {
    if (!this.stack[index])
      throw new UserError('effects-mgr.not-found');

    return {
      name: this.stack[index].name,
      options: this.stack[index].options,
      optionsRange: this.stack[index].optionsRange,
    };
  }

  public clearEffects() {
    this.stack = [];

    if (this.sox) this.createAudioEffectManager();
  }

  public setValue(index: number, name: string, value: any) {
    if (!this.stack[index])
      throw new UserError('effects-mgr.not-found');

    const audioEffect = this.stack[index];
    const option = audioEffect.options[name as keyof BaseEffectOptions];
    if (option === undefined)
      throw new UserError('effects-mgr.option-not-found');
    if (value === undefined)
      throw new UserError('effects-mgr.value-undefined');

    const type = typeof option;
    value = convertToType(value, type);

    const range: number[] | undefined =
      audioEffect.optionsRange[name as keyof BaseEffectOptionsRange];

    if (type === 'number' && range) {
      const [min, max] = range;
      if (value < min || value > max)
        throw new UserError('effects-mgr.out-of-range', min, max);
    }

    audioEffect.options[name as keyof BaseEffectOptions] = value;

    if (this.sox) this.createAudioEffectManager();
  }

  public getValue(index: number, option: string) {
    if (!this.stack[index])
      throw new UserError('effects-mgr.not-found');

    return this.stack[index].options[option];
  }

  public get speed() {
    return this.stack.reduce((acc, x) => acc * x.speed, 1);
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
      Constants.OPUS_SAMPLE_RATE.toString(),
      '-c',
      Constants.OPUS_AUDIO_CHANNELS.toString(),
      '-t',
      'raw',
      '-b',
      '16',
      '-e',
      'signed-integer',
      '-',
      '-r',
      Constants.OPUS_SAMPLE_RATE.toString(),
      '-c',
      Constants.OPUS_AUDIO_CHANNELS.toString(),
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
    this.sox.stdin.on('error', e => {
      this.logger.error('sox.stdin spew an error:', e);
      this.logger.error('arguments used:', this.args);
    });
    this.sox.stdout.on('error', e => {
      this.logger.error('sox.stdout spew an error:', e);
      this.logger.error('arguments used:', this.args);
    });
  }
}

export default new SoxManager;