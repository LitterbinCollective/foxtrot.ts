import { User } from 'detritus-client/lib/structures';
import fs from 'fs';
import { FormatResponse } from '.';

import { Application } from '../Application';
import { FILENAME_REGEX } from '../constants';
import BaseEffect from './foundation/BaseEffect';
import BaseFormat from './foundation/BaseFormat';

class BaseVoiceProcessor {
  public readonly processors: any[] = [];

  constructor (constructorArgs: any[], scanPath: string) {
    for (const fileName of fs.readdirSync(__dirname + '/' + scanPath)) {
      const any: any = require('./formats/' +
        fileName.replace(FILENAME_REGEX, '')).default;
      this.processors.push(new any(...constructorArgs));
    }
  }
}

export class VoiceFormatProcessor extends BaseVoiceProcessor {
  public readonly processors: BaseFormat[] = [];

  constructor (application: Application) {
    super([application.config.formatCredentials], 'formats/');
  }

  public async getURL(url: string, user: User) {
    let result: FormatResponse[] | FormatResponse | false;

    for (const format of this.processors) {
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
  public readonly processors: BaseEffect[] = [];
  private stack: BaseEffect[] = [];

  constructor (application: Application) {
    super([application.config.formatCredentials], 'effects/');
  }

  public addEffect() {

  }
}