import { readdirSync } from 'fs';

import { Constants, Logger } from '@/modules/utils';
import { Transform } from 'stream';

interface BaseManagerOptions {
  create?: boolean;
  constructorArgs?: any[];
  loggerTag?: string;
  scanPath?: string;
}

export function managerScan<T>(options: BaseManagerOptions) {
  const processors: Record<string, T> = {};

  if (!options.scanPath) return processors;

  for (const fileName of readdirSync(__dirname + '/' + options.scanPath)) {
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

export default class BaseManager<T> {
  public readonly logger!: Logger;
  public readonly processors: Record<string, T> = {};

  constructor(options: BaseManagerOptions) {
    if (options.loggerTag) this.logger = new Logger(options.loggerTag);
    this.processors = managerScan<T>(options);
  }
}

export class BaseTransformManager<T> extends Transform {
  public readonly logger!: Logger;
  public readonly processors: Record<string, T> = {};

  constructor(options: BaseManagerOptions) {
    super();
    if (options.loggerTag) this.logger = new Logger(options.loggerTag);
    this.processors = managerScan<T>(options);
  }
}