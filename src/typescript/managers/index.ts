import { readdirSync, readFileSync, statSync, watch } from 'fs';
import { Transform } from 'stream';
import { isAbsolute, join } from 'path';

import { Constants, Logger } from '@/utils';

export interface BaseManagerOptions {
  create?: boolean;
  constructorArgs?: any[];
  loggerTag?: string;
  scanPath: string;
  file?: boolean;
  recursive?: boolean;
  map?: (any: any, objectName: string, fileName: string) => any;
  watch?: boolean;
}

const SNAKE_CASE_REGEX = /[-_]([0-z])/g;
export default class BaseManager<T> {
  public logger!: Logger;
  public imported!: Record<string, T>;
  private rawImported!: Record<string, any>;
  private options!: BaseManagerOptions;

  constructor(options: BaseManagerOptions, rawImported?: Record<string, any>) {
    this.init(options, rawImported);
  }

  public init(options: BaseManagerOptions, rawImported?: Record<string, any>) {
    if (!isAbsolute(options.scanPath))
      options.scanPath = join(process.cwd(), options.scanPath as string);

    this.options = options;

    if (options.loggerTag)
      this.logger = new Logger(options.loggerTag);

    this.imported = {};

    const freshScan = !rawImported;
    if (!rawImported) // typescript pls
      rawImported = {};

    const map = options.map || ((any: any) => any);

    const array = freshScan
      ? readdirSync(options.scanPath, { recursive: options.recursive })
      : Object.keys(rawImported);
    for (let fileName of array) {
      fileName = fileName.toString('utf-8').replaceAll('\\', '/');

      let objectName = fileName.split('/').pop() as string;
      if (objectName.startsWith('.')) continue;

      let any: any;
      if (freshScan) {
        const path = join(options.scanPath, fileName);
        const stat = statSync(path);
        if (stat.isDirectory())
          continue;

        objectName = objectName.replace(Constants.FILENAME_REGEX, '')
          .replace(SNAKE_CASE_REGEX, (_, l) => l.toUpperCase());
        this.logger.debug(`scanning: ${objectName} (${fileName})`);

        if (options.file)
          any = readFileSync(path)
        else
          any = require(path).default;

        if (!any) continue;

        rawImported[objectName] = any;
      } else {
        this.logger.debug('reusing: ' + fileName);
        any = rawImported[objectName];
      }

      if (options.create && !options.file)
        this.imported[objectName] = new any(...(options.constructorArgs || []));
      else
        this.imported[objectName] = map(any, objectName, fileName);
    }

    this.rawImported = rawImported;

    this.watch = this.watch.bind(this);
    if (options.watch)
      watch(options.scanPath, this.watch);
  }

  public watch(): any | Promise<any> {}

  public clone() {
    const prototype = Object.getPrototypeOf(this);
    return new prototype.constructor(this.options, this.rawImported);
  }
}

export class BaseTransformManager<T> extends Transform {
  public logger!: Logger;
  public imported!: Record<string, T>;
  private rawImported!: Record<keyof typeof this.imported, any>;
  private options!: BaseManagerOptions;

  constructor(options: BaseManagerOptions, rawImported?: Record<string, any>) {
    super();
    BaseManager.prototype.init.call(
      this as unknown as BaseManager<T>,
      options,
      rawImported
    );
  }

  public clone() {
    return BaseManager.prototype.clone.call(
      this as unknown as BaseManager<T>
    );
  }

  public watch(): any | Promise<any> {}
}