import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { join } from 'path';

import { Constants, convertToType, UserError } from '@cluster/utils';

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
        loggerTag: 'SoX Manager',
        scanPath: join(__dirname, 'effects/'),
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
    this.sox.stdout.on('error', e => {
      this.logger.error('sox.stdout spew an error:', e);
      this.logger.error('arguments used:', this.args);
    });
  }
}

export default new SoxManager;