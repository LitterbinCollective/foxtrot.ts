import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { User } from 'detritus-client/lib/structures';
import fs from 'fs';
import { PassThrough } from 'stream';

import { FormatResponse } from '.'; // todo: remove

import { Application } from '../Application';
import { FILENAME_REGEX } from '../constants';
import BaseEffect from './foundation/BaseEffect';
import BaseFormat from './foundation/BaseFormat';
import NewVoice from './new';

class BaseVoiceProcessor {
  public readonly processors: Record<string, any> = {};

  constructor (constructorArgs: any[], scanPath: string) {
    for (const fileName of fs.readdirSync(__dirname + '/' + scanPath)) {
      const name = fileName.replace(FILENAME_REGEX, '');
      const any: any = require('./formats/' +
        fileName.replace(FILENAME_REGEX, '')).default;
      this.processors[name] = new any(...constructorArgs);
    }
  }
}

export class VoiceFormatProcessor extends BaseVoiceProcessor {
  public readonly processors: Record<string, BaseFormat> = {};

  constructor (application: Application) {
    super([application.config.formatCredentials], 'formats/');
  }

  public async getURL(url: string, user: User) {
    let result: FormatResponse[] | FormatResponse | false;

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

      if (Array.isArray(result))
        result = result.map((x) => {
          x.info.platform = format.printName;
          x.info.submittee = user;
          return x;
        });
      else {
        result.info.platform = format.printName;
        result.info.submittee = user;
      }

      break;
    }

    return result;
  }
}

export class VoiceEffectProcessor extends BaseVoiceProcessor {
  public readonly processors: Record<string, BaseEffect> = {};
  public readonly stdin: PassThrough;
  private child?: ChildProcessWithoutNullStreams;
  private stack: BaseEffect[] = [];
  private readonly voice: NewVoice;
  private readonly STACK_LIMIT = 16;

  constructor (application: Application, voice: NewVoice) {
    super([application.config.formatCredentials], 'effects/');
    this.voice = voice;
    this.stdin = new PassThrough();
  }

  public addEffect(name: string, start?: number) {
    start = start || this.stack.length;
    if (this.stack.length === this.STACK_LIMIT)
      throw new Error('effect stack overflow');
    this.stack.splice(start, 0, Object.assign(Object.create(Object.getPrototypeOf(this.processors[name])), this.processors[name]));
    return start + 1;
  }

  public removeEffect(id: number) {
    if (this.stack.length === 0)
      throw new Error('effect stack underflow');
    this.stack.splice(id, 1);
  }

  private get args() {
    const result = [];
    for (const effect of this.stack)
      result.push(effect.args);
    return result;
  }

  private get SAMPLE_RATE() {
    return this.voice.SAMPLE_RATE;
  }

  private get AUDIO_CHANNELS() {
    return this.voice.AUDIO_CHANNELS;
  }

  public createAudioEffectProcessor() {
    if (this.child) {
      this.stdin.unpipe(this.child.stdin);
      this.child.kill(9);
    }

    this.child = spawn('sox', [
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

    this.stdin.pipe(this.child.stdin);
  }
}